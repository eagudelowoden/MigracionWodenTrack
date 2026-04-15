import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { OdooService } from '../odoo/odoo.service';

@Injectable()
export class SubirContratosService {
  private readonly logger = new Logger(SubirContratosService.name);

  constructor(private readonly odoo: OdooService) {}

  private normalizeText(text: string): string {
    if (!text) return '';
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
  }

  private async resolveEmployeeId(name: string): Promise<number | null> {
    const uid = await this.odoo.authenticate();

    // Intento 1: búsqueda exacta con el nombre normalizado
    let ids = await this.odoo.executeKw<number[]>(
      'hr.employee',
      'search',
      [[['name', '=', name]]],
      { limit: 1 },
      uid,
    );

    // Intento 2: ilike (ignora mayúsculas/minúsculas)
    if (!ids.length) {
      ids = await this.odoo.executeKw<number[]>(
        'hr.employee',
        'search',
        [[['name', 'ilike', name]]],
        { limit: 1 },
        uid,
      );
    }

    return ids.length ? ids[0] : null;
  }
  private async resolveCalendarId(name: string): Promise<number | null> {
    const uid = await this.odoo.authenticate();

    // Intento 1: exacto
    let ids = await this.odoo.executeKw<number[]>(
      'resource.calendar',
      'search',
      [[['name', '=', name]]],
      { limit: 1 },
      uid,
    );

    // Intento 2: ilike
    if (!ids.length) {
      ids = await this.odoo.executeKw<number[]>(
        'resource.calendar',
        'search',
        [[['name', 'ilike', name]]],
        { limit: 1 },
        uid,
      );
    }

    return ids.length ? ids[0] : null;
  }

  async processExcel(fileBuffer: any) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error(
          'No se encontró la hoja de trabajo en el archivo Excel.',
        );
      }

      const technicalFields = [
        'id',
        'company_id',
        'employee_id/.id',
        'state',
        'date_end',
        'date_start',
        'resource_calendar_id/.id', // ← igual que employee_id
        'job_id',
      ];

      // 1. Recolectar filas válidas primero (sync)
      const rawRows: ExcelJS.Row[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        if (row.getCell(1).text?.trim()) {
          rawRows.push(row);
        }
      });

      // 2. Resolver employee_id de forma async para cada fila
      const rowsForOdoo: any[][] = [];
      for (const row of rawRows) {
        const employeeNameRaw = this.normalizeText(row.getCell(3).text || '');
        const employeeId = await this.resolveEmployeeId(employeeNameRaw);
        const calendarNameRaw = this.normalizeText(row.getCell(7).text || '');

        const calendarId = await this.resolveCalendarId(calendarNameRaw);

        if (!employeeId) {
          this.logger.warn(
            `Empleado no encontrado en Odoo: "${employeeNameRaw}"`,
          );
        }

        const rowData = [
          row.getCell(1).text?.trim() || '',
          row.getCell(2).text?.trim() || '',
          employeeId ? employeeId.toString() : '',
          this.mapState(row.getCell(4).text || ''),
          this.formatDate(row.getCell(5).value),
          this.formatDate(row.getCell(6).value),
          calendarId ? calendarId.toString() : '', // ← ID numérico de la malla
          row.getCell(8).text?.trim() || '',
        ];
        rowsForOdoo.push(rowData);
      }

      return await this.uploadToOdoo(technicalFields, rowsForOdoo);
    } catch (error: any) {
      this.logger.error(`Error: ${error.message}`);
      throw new InternalServerErrorException(
        `Fallo en procesamiento: ${error.message}`,
      );
    }
  }

  private mapState(label: string): string {
    if (!label) return 'draft';
    const cleanLabel = label.trim();

    const states: Record<string, string> = {
      Nuevo: 'draft',
      'En proceso': 'open',
      'En Proceso': 'open',
      Vencido: 'close',
      Cancelado: 'cancel',
      'Cancelado(a)': 'cancel',
    };

    if (states[cleanLabel]) return states[cleanLabel];

    const technicalValues = ['draft', 'open', 'close', 'cancel'];
    if (technicalValues.includes(cleanLabel.toLowerCase())) {
      return cleanLabel.toLowerCase();
    }

    return 'draft';
  }

  private formatDate(value: any): string {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString().split('T')[0];
    return value.toString().trim();
  }

  private async uploadToOdoo(fields: string[], rows: any[][]) {
    try {
      const uid = await this.odoo.authenticate();

      const result = await this.odoo.executeKw<any>(
        'hr.contract',
        'load',
        [fields, rows],
        {
          context: {
            import_file: true,
            import_compat: true,
            tracking_disable: true,
          },
        },
        uid,
      );

      return {
        success: !result.messages?.some((m: any) => m.type === 'error'),
        message: result.ids ? 'Sincronización completada' : 'Error en Odoo',
        total_procesados: result.ids ? result.ids.length : 0,
        errors: result.messages || [],
      };
    } catch (error: any) {
      throw new InternalServerErrorException(`Error Odoo: ${error.message}`);
    }
  }
}
