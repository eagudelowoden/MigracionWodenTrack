// src/reports/reports.service.ts
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { OdooService } from '../odoo/odoo.service';

@Injectable()
export class ReportsService {
  constructor(private readonly odoo: OdooService) { }

  // src/reports/reports.service.ts

  async generarPlantillaMallas(companyName: string, departamento: string): Promise<Buffer> {
    try {
      const uid = await this.odoo.authenticate();

      // 0. MAPEO DE ESTADOS
      const stateLabels: Record<string, string> = {
        'draft': 'Nuevo',
        'open': 'En proceso',
        'close': 'Vencido',
        'cancel': 'Cancelado(a)'
      };

      // 1. CONSTRUIR EL DOMINIO DINÁMICO
      const domain: any[] = [];
      if (companyName && companyName !== 'Todas') {
        domain.push(['company_id.name', '=', companyName]);
      }
      if (departamento && departamento !== '' && departamento !== 'Todas') {
        domain.push(['employee_id.department_id.name', 'ilike', departamento]);
      }

      // 2. TRAER LOS CONTRATOS FILTRADOS
      const contratos = await this.odoo.executeKw<any[]>(
        'hr.contract',
        'search_read',
        [domain],
        {
          fields: ['name', 'company_id', 'employee_id', 'job_id', 'resource_calendar_id', 'date_start', 'date_end', 'state', 'department_id']
        },
        uid,
      );

      if (!contratos || contratos.length === 0) {
        throw new NotFoundException(`No se encontraron contratos para la compañía ${companyName} en el departamento ${departamento}`);
      }

      // --- REFUERZO: Traer info de Empleados ---
      const employeeIds = [...new Set(contratos.map(c => c.employee_id[0]))];
      const employeesDetail = await this.odoo.executeKw<any[]>(
        'hr.employee',
        'search_read',
        [[['id', 'in', employeeIds]]],
        { fields: ['id', 'job_title', 'department_id'] },
        uid
      );

      const idMap = new Map();

      // 3. OBTENER IDs EXTERNOS (Metadatos)
      const contractIds = contratos.map(c => c.id);
      const externalIds = await this.odoo.executeKw<any[]>(
        'ir.model.data',
        'search_read',
        [[['model', '=', 'hr.contract'], ['res_id', 'in', contractIds]]],
        { fields: ['res_id', 'module', 'name'] },
        uid,
      );

      externalIds.forEach(item => {
        idMap.set(item.res_id, `${item.module}.${item.name}`);
      });

      // --- NUEVO: CREAR ID EXTERNO SI NO EXISTE (Para que Odoo lo acepte al importar) ---
      // --- NUEVO: CREAR ID EXTERNO SI NO EXISTE ---
      for (const con of contratos) {
        if (!idMap.has(con.id)) {
          try {
            // Creamos un nombre único para el ID externo
            const nuevoNombre = `hr_contract_${con.id}_${Math.random().toString(36).substring(7)}`;

            // AQUÍ ESTABA EL ERROR: Agregamos 'uid' como 5to argumento
            await this.odoo.executeKw(
              'ir.model.data',
              'create',
              [[{
                name: nuevoNombre,
                model: 'hr.contract',
                module: '__export__',
                res_id: con.id
              }]],
              {},    // El cuarto argumento son las 'options' (vació en este caso)
              uid    // El quinto argumento es el 'uid' (EL QUE FALTABA)
            );

            idMap.set(con.id, `__export__.${nuevoNombre}`);
          } catch (e) {
            console.warn(`No se pudo crear ID externo para contrato ${con.id}, se usará ID numérico.`);
          }
        }
      }

      // 4. GENERACIÓN DEL EXCEL
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Carga de Mallas');

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

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF8F00' } };

      // 5. LLENAR DATOS
      contratos.forEach(con => {
        const empInfo = employeesDetail.find(e => e.id === con.employee_id[0]);
        const estadoVisible = stateLabels[con.state] || con.state || '';

        worksheet.addRow({
          // Ahora idMap siempre debería tener el formato __export__.xxxx
          id: idMap.get(con.id) || con.id,
          company: Array.isArray(con.company_id) ? con.company_id[1] : '',
          employee: Array.isArray(con.employee_id) ? con.employee_id[1] : '',
          state: estadoVisible,
          date_end: con.date_end || '',
          date_start: con.date_start || '',
          calendar: Array.isArray(con.resource_calendar_id) ? con.resource_calendar_id[1] : '',
          job: Array.isArray(con.job_id)
            ? con.job_id[1]
            : (empInfo && empInfo.job_title ? empInfo.job_title : 'No asignado'),
          name: con.name || '',
          department: Array.isArray(con.department_id)
            ? con.department_id[1]
            : (empInfo && Array.isArray(empInfo.department_id) ? empInfo.department_id[1] : 'No asignado'),
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer as ArrayBuffer);

    } catch (error) {
      console.error("Error en reporte:", error.message);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`Error de Odoo: ${error.message}`);
    }
  }

  async generarReporteAsistencias(data: any[]): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte de Novedades');

      // 1. AUTENTICACIÓN
      const uid = await this.odoo.authenticate();
      const cedulaMap = new Map();

      // 2. BUSCAR CÉDULAS EN RES.PARTNER
      try {
        const nombresEmpleados = [...new Set(data.map(item => item.empleado || item.Colaborador))].filter(Boolean);

        if (nombresEmpleados.length > 0) {
          // Buscamos en el modelo res.partner que es donde me indicas que está el dato
          const partnersOdoo = await this.odoo.executeKw<any[]>(
            'res.partner',
            'search_read',
            [[['name', 'in', nombresEmpleados]]],
            {
              // Traemos el nombre para cruzar y el doc_number que es la cédula
              fields: ['name', 'doc_number']
            },
            uid,
          );

          if (partnersOdoo && partnersOdoo.length > 0) {
            partnersOdoo.forEach(p => {
              // Guardamos en el mapa: Nombre -> Cédula
              cedulaMap.set(p.name, p.doc_number);
            });
          }
        }
      } catch (odooErr) {
        console.error("Error consultando res.partner en Odoo:", odooErr.message);
      }

      // 3. DEFINICIÓN DE COLUMNAS
      worksheet.columns = [
        { header: 'COLABORADOR', key: 'colaborador', width: 35 },
        { header: 'CÉDULA', key: 'cedula', width: 15 },
        { header: 'DEPARTAMENTO', key: 'depto', width: 25 },
        { header: 'FECHA', key: 'fecha', width: 15 },
        { header: 'HORA ENTRADA', key: 'entrada', width: 20 },
        { header: 'HORA SALIDA', key: 'salida', width: 20 },
        { header: 'ESTATUS ENTRADA', key: 'estatus_entrada', width: 25 },
        { header: 'ESTATUS SALIDA', key: 'estatus_salida', width: 25 }
      ];

      // Estilo de cabecera verde
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF107C41' } };

      // 4. LLENADO DE FILAS
     // 4. LLENADO DE FILAS
data.forEach(item => {
  // Normalizamos el nombre del empleado buscando todas las variantes posibles
  const nombreEmpleado = item.empleado || item.Colaborador || item.colaborador;

  worksheet.addRow({
    colaborador: nombreEmpleado || 'N/A',
    
    // Agregamos item.Cédula (con tilde) que es como lo tenías en el frontend
    cedula: item.doc_number || item.Cedula || item.Cédula || cedulaMap.get(nombreEmpleado) || 'N/A',
    
    depto: item.department_id || item.Departamento || item.departamento || 'N/A',
    fecha: item.fecha || item.Fecha || 'N/A',
    
    // Asegúrate que coincida con Entrada / Salida o check_in / check_out
    entrada: item.check_in || item.Entrada || item.entrada || 'N/A',
    salida: item.check_out || item.Salida || item.salida || 'N/A',
    
    estatus_entrada: item.c_entrada || item.Estatus_Entrada || 'N/A',
    estatus_salida: item.c_salida || item.Estatus_Salida || 'N/A'
  });
});

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer as ArrayBuffer);
    } catch (error) {
      console.error("Error crítico en reporte:", error.message);
      throw new InternalServerErrorException(`Error al generar Excel: ${error.message}`);
    }
  }
}

