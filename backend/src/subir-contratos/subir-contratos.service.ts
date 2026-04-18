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

    let ids = await this.odoo.executeKw<number[]>(
      'hr.employee',
      'search',
      [[['name', '=', name]]],
      { limit: 1 },
      uid,
    );

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

    let ids = await this.odoo.executeKw<number[]>(
      'resource.calendar',
      'search',
      [[['name', '=', name]]],
      { limit: 1 },
      uid,
    );

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

  // ✅ NUEVO: Resolver el Cargo (Job) para evitar el error "no hace referencia"
  private async resolveJobId(name: string): Promise<number | null> {
    const uid = await this.odoo.authenticate();

    let ids = await this.odoo.executeKw<number[]>(
      'hr.job',
      'search',
      [[['name', '=', name]]],
      { limit: 1 },
      uid,
    );

    if (!ids.length) {
      ids = await this.odoo.executeKw<number[]>(
        'hr.job',
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

      const rawRows: ExcelJS.Row[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        if (row.getCell(1).text?.trim() || row.getCell(3).text?.trim()) {
          rawRows.push(row);
        }
      });

      // En lugar de un array plano, creamos un array de objetos con la data exacta
      const recordsForOdoo: any[] = [];

      for (const row of rawRows) {
        // 1. Resolver IDs
        const employeeNameRaw = this.normalizeText(row.getCell(3).text || '');
        const employeeId = await this.resolveEmployeeId(employeeNameRaw);

        const calendarNameRaw = this.normalizeText(row.getCell(7).text || '');
        const calendarId = await this.resolveCalendarId(calendarNameRaw);

        const jobNameRaw = this.normalizeText(row.getCell(8).text || '');
        const jobId = await this.resolveJobId(jobNameRaw);

        // 2. Parsear IDs
        const idCell = row.getCell(1).text?.trim();
        let idContrato: number | null = null;

        if (idCell) {
          // Extraemos mágicamente solo los números del texto "__export__.hr_contract_4511..."
          const extractNumbers = idCell.match(/\d+/);
          if (extractNumbers) {
            idContrato = parseInt(extractNumbers[0], 10);
          }
        }

        // Compañía: Forzamos el ID 1 ya que el Excel trae el texto "(CO) WODEN COLOMBIA SAS"
        const companyId = 1;

        // 3. Armar el diccionario EXACTO para Odoo (Solo enviamos los campos que tienen valor)
        const contractData: any = {
          state: this.mapState(row.getCell(4).text || ''),
        };

        if (companyId) contractData.company_id = companyId;
        if (employeeId) contractData.employee_id = employeeId;
        if (calendarId) contractData.resource_calendar_id = calendarId;
        if (jobId) contractData.job_id = jobId;

        const dateStart = this.formatDate(row.getCell(6).value);
        if (dateStart) contractData.date_start = dateStart;

        const dateEnd = this.formatDate(row.getCell(5).value);
        if (dateEnd) contractData.date_end = dateEnd;

        recordsForOdoo.push({
          id: idContrato, // Ahora sí enviará el número limpio (ej. 4511)
          data: contractData,
          rowNumber: row.number,
        });
      }

      return await this.uploadToOdoo(recordsForOdoo);
    } catch (error: any) {
      this.logger.error(`Error procesando Excel: ${error.message}`);
      throw new InternalServerErrorException(
        `Fallo en procesamiento: ${error.message}`,
      );
    }
  }

  // NUEVO uploadToOdoo: Usa CRUD real en lugar de importar
  private async uploadToOdoo(records: any[]) {
    const uid = await this.odoo.authenticate();
    let procesados = 0;
    const errors: string[] = [];

    for (const record of records) {
      try {
        if (record.id && !isNaN(record.id)) {
          // Si tiene ID en el Excel, ACTUALIZAMOS el registro (write)
          await this.odoo.executeKw(
            'hr.contract',
            'write',
            [[record.id], record.data],
            {},
            uid,
          );
        } else {
          // Si NO tiene ID, CREAMOS uno nuevo (create)
          await this.odoo.executeKw(
            'hr.contract',
            'create',
            [record.data],
            {},
            uid,
          );
        }
        procesados++;
      } catch (error: any) {
        // Atrapamos el error individual para que el proceso no se caiga
        // y podamos ver exactamente qué fila y qué campo falló
        const errorMsg = error.faultString || error.message;
        this.logger.error(
          `Error en fila ${record.rowNumber} (ID: ${record.id}): ${errorMsg}`,
        );
        errors.push(`Fila ${record.rowNumber}: ${errorMsg}`);
      }
    }

    return {
      success: errors.length === 0,
      message:
        errors.length > 0
          ? 'Sincronización con errores'
          : 'Sincronización completada',
      total_procesados: procesados,
      total_errores: errors.length,
      errors: errors,
    };
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

  // private async uploadToOdoo(fields: string[], rows: any[][]) {
  //   try {
  //     const uid = await this.odoo.authenticate();

  //     const result = await this.odoo.executeKw<any>(
  //       'hr.contract',
  //       'load',
  //       [fields, rows],
  //       {
  //         context: {
  //           import_file: true,
  //           import_compat: true,
  //           tracking_disable: true,
  //         },
  //       },
  //       uid,
  //     );

  //     // Log para depuración en caso de que un registro falle
  //     if (result.messages?.length > 0) {
  //       this.logger.debug(
  //         `Detalle Odoo load: ${JSON.stringify(result.messages)}`,
  //       );
  //     }

  //     return {
  //       success: !result.messages?.some((m: any) => m.type === 'error'),
  //       message: result.ids ? 'Sincronización completada' : 'Error en Odoo',
  //       total_procesados: result.ids ? result.ids.length : 0,
  //       errors: result.messages || [],
  //     };
  //   } catch (error: any) {
  //     this.logger.error(`Error Odoo crítico: ${error.message}`);
  //     throw new InternalServerErrorException(`Error Odoo: ${error.message}`);
  //   }
  // }
}
