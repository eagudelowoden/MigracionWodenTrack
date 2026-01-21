// src/reports/reports.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { OdooService } from '../odoo/odoo.service';

@Injectable()
export class ReportsService {
  constructor(private readonly odoo: OdooService) { }

  // src/reports/reports.service.ts

  async generarPlantillaMallas(companyName: string): Promise<Buffer> {
    try {
      const uid = await this.odoo.authenticate();

      // 1. Traer los contratos FILTRADOS por la compañía seleccionada
      // Usamos 'company_id.name' para comparar directamente con el texto que viene del select
      const contratos = await this.odoo.executeKw<any[]>(
        'hr.contract',
        'search_read',
        [[['company_id.name', '=', companyName]]], // <-- FILTRO APLICADO
        {
          fields: ['name', 'company_id', 'employee_id', 'job_id', 'resource_calendar_id', 'date_start', 'date_end', 'state', 'department_id']
        },
        uid,
      );

      const idMap = new Map();

      // 2. Obtener IDs Externos (solo de los contratos filtrados para mayor eficiencia)
      if (contratos.length > 0) {
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
            idMap.set(item.res_id, `${item.module}.${item.name}`);
          });
        } catch (e) {
          console.warn("Odoo limitó el acceso a metadatos. Usando IDs numéricos.");
        }
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Carga de Mallas');

      // 3. Configuración de columnas
      worksheet.columns = [
        { header: 'id', key: 'id', width: 35 },
        { header: 'Compañía', key: 'company', width: 25 },
        { header: 'Empleado', key: 'employee', width: 30 },
        { header: 'Estado', key: 'state', width: 12 },
        { header: 'Fecha de finalización', key: 'date_end', width: 15 },
        { header: 'Fecha de inicio', key: 'date_start', width: 15 },
        { header: 'Horario de trabajo', key: 'calendar', width: 30 },
        { header: 'Puesto de trabajo', key: 'job', width: 25 },
        { header: 'Referencia de contrato', key: 'name', width: 25 },
        { header: 'Departamento', key: 'department', width: 25 },
      ];

      // Estilo del encabezado (Naranja corporativo)
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF8F00' } };

      // 4. Llenar datos (Solo los contratos de la sede seleccionada)
      contratos.forEach(con => {
        worksheet.addRow({
          id: idMap.get(con.id) || con.id,
          company: Array.isArray(con.company_id) ? con.company_id[1] : '',
          employee: Array.isArray(con.employee_id) ? con.employee_id[1] : '',
          state: con.state || '',
          date_end: con.date_end || '',
          date_start: con.date_start || '',
          calendar: Array.isArray(con.resource_calendar_id) ? con.resource_calendar_id[1] : '',
          job: Array.isArray(con.job_id) ? con.job_id[1] : '',
          name: con.name || '',
          department: Array.isArray(con.department_id) ? con.department_id[1] : '',
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

      // 1. Definición de Columnas
      worksheet.columns = [
        { header: 'COLABORADOR', key: 'colaborador', width: 35 },
        { header: 'DEPARTAMENTO', key: 'depto', width: 25 },
        { header: 'FECHA', key: 'fecha', width: 15 },
        { header: 'HORA ENTRADA', key: 'entrada', width: 20 },
        { header: 'HORA SALIDA', key: 'salida', width: 20 },
        { header: 'ESTATUS ENTRADA', key: 'estatus_entrada', width: 25 },
        { header: 'ESTATUS SALIDA', key: 'estatus_salida', width: 25 }
      ];

      // Estilos de cabecera...
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF107C41' }
      };

      // 2. Mapeo de Datos (Asegúrate de que coincidan con el objeto que envías)
      data.forEach(item => {
        worksheet.addRow({
          colaborador: item.empleado || item.Colaborador || 'N/A',
          depto: item.department_id || item.Departamento || 'N/A',
          fecha: item.fecha || item.Fecha || 'N/A',
          entrada: item.check_in || item.Entrada || 'N/A',
          salida: item.check_out || item.Salida || 'N/A',
          // Usamos los nombres que vienen de tu servicio anterior (c_entrada / c_salida)
          estatus_entrada: item.c_entrada || item.Estatus_Entrada || 'N/A',
          estatus_salida: item.c_salida || item.Estatus_Salida || 'N/A'
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

