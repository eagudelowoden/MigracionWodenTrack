import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { OdooService } from '../odoo/odoo.service';

interface OdooLoadResponse {
  ids: number[] | false;
  messages: Array<{
    type: string;
    message: string;
    rows: { from: number; to: number };
    field: string;
  }>;
}

@Injectable()
export class SubirContratosService {
  private readonly logger = new Logger(SubirContratosService.name);

  constructor(private readonly odoo: OdooService) {}

  // Usamos 'any' para evitar conflictos de firmas de Buffer/Uint8Array en nodenext
  async processExcel(fileBuffer: any) {
    try {
      // 1. Declaración e inicialización de workbook (Soluciona ts(2304))
      const workbook = new ExcelJS.Workbook();

      // 2. Carga segura del buffer (Soluciona ts(2345))
      await workbook.xlsx.load(fileBuffer as any);

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('No se encontró la hoja de trabajo en el archivo Excel.');
      }

      const technicalFields = [
        'id', 'company_id', 'employee_id', 'state', 
        'date_end', 'date_start', 'resource_calendar_id', 'job_id'
      ];

      const rowsForOdoo: any[][] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Saltar encabezado

        rowsForOdoo.push([
          row.getCell(1).text?.trim() || '',
          row.getCell(2).text?.trim() || '',
          row.getCell(3).text?.trim() || '',
          this.mapState(row.getCell(4).text || ''),
          this.formatDate(row.getCell(5).value),
          this.formatDate(row.getCell(6).value),
          row.getCell(7).text?.trim() || '',
          row.getCell(8).text?.trim() || '',
        ]);
      });

      return await this.uploadToOdoo(technicalFields, rowsForOdoo);

    } catch (error: any) {
      this.logger.error(`Error procesando Excel: ${error.message}`);
      throw new InternalServerErrorException(
        `Fallo en lectura de archivo: ${error.message}`
      );
    }
  }

  private mapState(label: string): string {
    const states: Record<string, string> = {
      'En proceso': 'draft',
      'Abierto': 'open',
      'Finalizado': 'close',
      'Cancelado': 'cancel',
    };
    return states[label.trim()] ?? 'draft';
  }

  private formatDate(value: any): string {
    if (!value) return '';
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return value.toString().trim();
  }

  private async uploadToOdoo(fields: string[], rows: any[][]) {
    try {
      const uid = await this.odoo.authenticate();

      const result = await this.odoo.executeKw<OdooLoadResponse>(
        'hr.contract',
        'load',
        [fields, rows],
        {},
        uid
      );

      if (result.messages?.length) {
        return {
          success: false,
          message: 'Odoo detectó errores en los datos',
          errors: result.messages.map(m => ({
            fila: m.rows.from,
            campo: m.field,
            error: m.message,
          })),
        };
      }

      return {
        success: true,
        message: 'Sincronización masiva completada con éxito',
        total_procesados: result.ids ? result.ids.length : 0,
        odoo_ids: result.ids,
      };
    } catch (error: any) {
      this.logger.error(`Error cargando a Odoo: ${error.message}`);
      throw new InternalServerErrorException('Error de comunicación con Odoo.');
    }
  }
}