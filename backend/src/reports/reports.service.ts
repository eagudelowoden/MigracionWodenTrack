// src/reports/reports.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { OdooService } from '../odoo/odoo.service';

@Injectable()
export class ReportsService {
  constructor(private readonly odoo: OdooService) { }

  // src/reports/reports.service.ts

  async generarPlantillaMallas(): Promise<Buffer> {
    try {
      const uid = await this.odoo.authenticate();

      // 1. Traer los contratos
      const contratos = await this.odoo.executeKw<any[]>(
        'hr.contract',
        'search_read',
        [[]],
        {
          fields: ['name', 'company_id', 'employee_id', 'job_id', 'resource_calendar_id', 'date_start', 'date_end', 'state']
        },
        uid,
      );

      const idMap = new Map();

      // 2. SIMULAR "import_compat: true"
      // Intentamos traer los IDs Externos (los que tienen letras)
      try {
        const contractIds = contratos.map(c => c.id);
        const externalIds = await this.odoo.executeKw<any[]>(
          'ir.model.data',
          'search_read',
          [[
            ['model', '=', 'hr.contract'],
            ['res_id', 'in', contractIds]
          ]],
          { fields: ['res_id', 'module', 'name'] },
          uid,
        );

        externalIds.forEach(item => {
          // Esto construye el: modulo.nombre_externo
          idMap.set(item.res_id, `${item.module}.${item.name}`);
        });
      } catch (e) {
        console.warn("Odoo limitó el acceso a metadatos. Usando IDs de DB para compatibilidad.");
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Carga de Mallas');

      // 3. LA COLUMNA DEBE LLAMARSE 'id' PARA SER COMPATIBLE
      worksheet.columns = [
        { header: 'id', key: 'id', width: 35 },
        { header: 'Referencia de contrato', key: 'name', width: 25 },
        { header: 'Compañía', key: 'company', width: 25 },
        { header: 'Empleado', key: 'employee', width: 30 },
        { header: 'Puesto de trabajo', key: 'job', width: 25 },
        { header: 'Horario de trabajo', key: 'calendar', width: 30 },
        { header: 'Fecha de inicio', key: 'date_start', width: 15 },
        { header: 'Fecha de finalización', key: 'date_end', width: 15 },
        { header: 'Estado', key: 'state', width: 12 }
      ];

      // Estilo
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF8F00' } };

      // 4. Llenar datos
      contratos.forEach(con => {
        worksheet.addRow({
          // Si encontramos el External ID (el de letras) lo usamos.
          // Si no, usamos el ID numérico. ODOO RECONOCE AMBOS AL IMPORTAR.
          id: idMap.get(con.id) || con.id,
          name: con.name || '',
          company: Array.isArray(con.company_id) ? con.company_id[1] : '',
          employee: Array.isArray(con.employee_id) ? con.employee_id[1] : '',
          job: Array.isArray(con.job_id) ? con.job_id[1] : '',
          calendar: Array.isArray(con.resource_calendar_id) ? con.resource_calendar_id[1] : '',
          date_start: con.date_start || '',
          date_end: con.date_end || '',
          state: con.state || ''
        });
      });
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer as ArrayBuffer);

    } catch (error) {
      console.error("Error en reporte:", error.message);
      throw new InternalServerErrorException(`Error de Odoo: ${error.message}`);
    }
  }

async generarReporteAsistencias(data: any[]): Promise<Buffer> {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Novedades');

    worksheet.columns = [
      { header: 'COLABORADOR', key: 'empleado', width: 35 },
      { header: 'DEPARTAMENTO', key: 'depto', width: 25 },
      { header: 'FECHA', key: 'fecha', width: 15 },
      { header: 'HORA ENTRADA', key: 'check_in', width: 20 },
      { header: 'HORA SALIDA', key: 'check_out', width: 20 },
      { header: 'ESTATUS ENTRADA', key: 'estatus_in', width: 25 }, // Key simplificada
      { header: 'ESTATUS SALIDA', key: 'estatus_out', width: 25 }  // Key simplificada
    ];

    // Estilos de cabecera...
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF107C41' }
    };

    data.forEach(item => {
      worksheet.addRow({
        empleado: item.Colaborador,
        depto: item.Departamento,
        fecha: item.Fecha,
        check_in: item.Entrada,
        check_out: item.Salida,
        // MAPEADO CORRECTO:
        estatus_in: item.Estatus_Entrada, 
        estatus_out: item.Estatus_Salida
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  } catch (error) {
    console.error("Error en reporte de asistencias:", error.message);
    throw new InternalServerErrorException(`Error al generar Excel: ${error.message}`);
  }
}
}

