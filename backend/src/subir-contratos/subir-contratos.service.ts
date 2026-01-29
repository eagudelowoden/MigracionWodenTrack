import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { OdooService } from '../odoo/odoo.service';

@Injectable()
export class SubirContratosService {
  private readonly logger = new Logger(SubirContratosService.name);

  constructor(private readonly odoo: OdooService) { }

  async processExcel(fileBuffer: any) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);

      // Intentamos obtener la primera hoja
      const worksheet = workbook.getWorksheet(1);

      // SOLUCIÓN AL ERROR ts(18048): Validación de existencia
      if (!worksheet) {
        throw new Error('No se encontró la hoja de trabajo en el archivo Excel.');
      }

      // Definición de campos técnicos para asegurar la actualización
      const technicalFields = [
        'id',                   // Col 1: ID Externo (Obligatorio para actualizar)
        'company_id',           // Col 2
        'employee_id',          // Col 3
        'state',                // Col 4
        'date_end',             // Col 5
        'date_start',           // Col 6
        'resource_calendar_id', // Col 7: Campo de la Malla/Horario
        'job_id'                // Col 8
      ];

      const rowsForOdoo: any[][] = [];

      // Ahora TypeScript sabe que 'worksheet' no es undefined aquí
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Saltar encabezado

        const rowData = [
          row.getCell(1).text?.trim() || '', // ID Externo (__export__)
          row.getCell(2).text?.trim() || '',
          row.getCell(3).text?.trim() || '',
          this.mapState(row.getCell(4).text || ''),
          this.formatDate(row.getCell(5).value),
          this.formatDate(row.getCell(6).value),
          row.getCell(7).text?.trim() || '', // El nombre de la Malla
          row.getCell(8).text?.trim() || '',
        ];

        // Solo procesar si tiene el ID Externo para garantizar la actualización
        if (rowData[0]) {
          rowsForOdoo.push(rowData);
        }
      });

      return await this.uploadToOdoo(technicalFields, rowsForOdoo);
    } catch (error: any) {
      this.logger.error(`Error: ${error.message}`);
      throw new InternalServerErrorException(`Fallo en procesamiento: ${error.message}`);
    }
  }

  private mapState(label: string): string {
    // 1. Limpieza básica y manejo de nulos
    if (!label) return 'draft';
    const cleanLabel = label.trim();

    // 2. Diccionario de traducción (Nombres del Excel -> Claves de Odoo)
    const states: Record<string, string> = {
      'Nuevo': 'draft',
      'En proceso': 'open',
      'En Proceso': 'open',
      'Vencido': 'close',
      'Cancelado': 'cancel',
      'Cancelado(a)': 'cancel',
    };

    // 3. Lógica de retorno inteligente
    // Primero: ¿Está en nuestro diccionario?
    if (states[cleanLabel]) {
      return states[cleanLabel];
    }

    // Segundo: ¿El valor ya es una clave técnica válida? (ej. "open", "draft")
    // Esto evita que si el Excel ya está corregido, lo rompa.
    const technicalValues = ['draft', 'open', 'close', 'cancel'];
    if (technicalValues.includes(cleanLabel.toLowerCase())) {
      return cleanLabel.toLowerCase();
    }

    // Por último: Si no coincide con nada, por defecto Odoo lo toma como draft
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

      // Uso de contexto para forzar la actualización del registro existente
      const result = await this.odoo.executeKw<any>(
        'hr.contract',
        'load',
        [fields, rows],
        {
          context: {
            import_file: true,
            import_compat: true, // Crucial para buscar mallas por nombre
            tracking_disable: true,
          }
        },
        uid
      );

      return {
        success: !result.messages?.some((m: any) => m.type === 'error'),
        message: result.ids ? 'Sincronización completada' : 'Error en Odoo',
        total_procesados: result.ids ? result.ids.length : 0,
        errors: result.messages || []
      };
    } catch (error: any) {
      throw new InternalServerErrorException(`Error Odoo: ${error.message}`);
    }
  }
}