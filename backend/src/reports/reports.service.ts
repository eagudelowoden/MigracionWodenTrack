// src/reports/reports.service.ts
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { OdooService } from '../odoo/odoo.service';

@Injectable()
export class ReportsService {
  constructor(private readonly odoo: OdooService) {}

  // src/reports/reports.service.ts

  async generarPlantillaMallas(
    companyName: string,
    departamento: string,
  ): Promise<Buffer> {
    try {
      const uid = await this.odoo.authenticate();

      // 0. MAPEO DE ESTADOS
      const stateLabels: Record<string, string> = {
        draft: 'Nuevo',
        open: 'En proceso',
        close: 'Vencido',
        cancel: 'Cancelado(a)',
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
          fields: [
            'name',
            'company_id',
            'employee_id',
            'job_id',
            'resource_calendar_id',
            'date_start',
            'date_end',
            'state',
            'department_id',
          ],
        },
        uid,
      );

      if (!contratos || contratos.length === 0) {
        throw new NotFoundException(
          `No se encontraron contratos para la compañía ${companyName} en el departamento ${departamento}`,
        );
      }

      // --- REFUERZO: Traer info de Empleados ---
      const employeeIds = [...new Set(contratos.map((c) => c.employee_id[0]))];
      const employeesDetail = await this.odoo.executeKw<any[]>(
        'hr.employee',
        'search_read',
        [[['id', 'in', employeeIds]]],
        { fields: ['id', 'job_title', 'department_id'] },
        uid,
      );

      const idMap = new Map();

      // 3. OBTENER IDs EXTERNOS (Metadatos)
      const contractIds = contratos.map((c) => c.id);
      const externalIds = await this.odoo.executeKw<any[]>(
        'ir.model.data',
        'search_read',
        [
          [
            ['model', '=', 'hr.contract'],
            ['res_id', 'in', contractIds],
          ],
        ],
        { fields: ['res_id', 'module', 'name'] },
        uid,
      );

      externalIds.forEach((item) => {
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
              [
                [
                  {
                    name: nuevoNombre,
                    model: 'hr.contract',
                    module: '__export__',
                    res_id: con.id,
                  },
                ],
              ],
              {}, // El cuarto argumento son las 'options' (vació en este caso)
              uid, // El quinto argumento es el 'uid' (EL QUE FALTABA)
            );

            idMap.set(con.id, `__export__.${nuevoNombre}`);
          } catch (e) {
            console.warn(
              `No se pudo crear ID externo para contrato ${con.id}, se usará ID numérico.`,
            );
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
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF8F00' },
      };

      // 5. LLENAR DATOS
      contratos.forEach((con) => {
        const empInfo = employeesDetail.find(
          (e) => e.id === con.employee_id[0],
        );
        const estadoVisible = stateLabels[con.state] || con.state || '';

        worksheet.addRow({
          // Ahora idMap siempre debería tener el formato __export__.xxxx
          id: idMap.get(con.id) || con.id,
          company: Array.isArray(con.company_id) ? con.company_id[1] : '',
          employee: Array.isArray(con.employee_id) ? con.employee_id[1] : '',
          state: estadoVisible,
          date_end: con.date_end || '',
          date_start: con.date_start || '',
          calendar: Array.isArray(con.resource_calendar_id)
            ? con.resource_calendar_id[1]
            : '',
          job: Array.isArray(con.job_id)
            ? con.job_id[1]
            : empInfo && empInfo.job_title
              ? empInfo.job_title
              : 'No asignado',
          name: con.name || '',
          department: Array.isArray(con.department_id)
            ? con.department_id[1]
            : empInfo && Array.isArray(empInfo.department_id)
              ? empInfo.department_id[1]
              : 'No asignado',
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer as ArrayBuffer);
    } catch (error) {
      console.error('Error en reporte:', error.message);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`Error de Odoo: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ─────────────────────────────────────────────

  private decimalAHora(h: number): string {
    const hh = Math.floor(h).toString().padStart(2, '0');
    const mm = Math.round((h % 1) * 60)
      .toString()
      .padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private formatearMalla(lineas: any[]): string {
    const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const ordenadas = [...lineas].sort(
      (a, b) => Number(a.dayofweek) - Number(b.dayofweek),
    );
    return ordenadas
      .map(
        (l) =>
          `${DIAS[Number(l.dayofweek)] ?? `D${l.dayofweek}`} ${this.decimalAHora(l.hour_from)}-${this.decimalAHora(l.hour_to)}`,
      )
      .join(' | ');
  }

  /** Devuelve { cedulaMap, cargoMap, mallaMap } consultando Odoo en 2 llamadas */
  private async obtenerDatosOdooParaAsistencias(
    uid: number,
    nombresEmpleados: string[],
    employeeIds?: number[],
  ): Promise<{
    cedulaMap: Map<string, string>;
    cargoMap: Map<string, string>;
    mallaMap: Map<string, string>;
    nombreMallaMap: Map<string, string>;
  }> {
    const cedulaMap = new Map<string, string>();
    const cargoMap = new Map<string, string>();
    const mallaMap = new Map<string, string>();
    const nombreMallaMap = new Map<string, string>();

    // Buscar por ID si están disponibles, por nombre como fallback
    const domain =
      employeeIds && employeeIds.length > 0
        ? [['id', 'in', employeeIds]]
        : [['name', 'in', nombresEmpleados]];

    const empleados = await this.odoo.executeKw<any[]>(
      'hr.employee',
      'search_read',
      [domain],
      {
        fields: [
          'id',
          'name',
          'identification_id',
          'barcode',
          'address_home_id',
          'job_id',
          'resource_calendar_id',
        ],
      },
      uid,
    );

    // Log para detectar quién no se encuentra
    const noEncontrados = nombresEmpleados.filter(
      (n) => !empleados.find((e) => e.name === n),
    );
    if (noEncontrados.length > 0) {
      console.warn('❌ Empleados no encontrados en Odoo:', noEncontrados);
    }

    if (!empleados?.length)
      return { cedulaMap, cargoMap, mallaMap, nombreMallaMap };

    const calendarIds = new Array<number>();
    const calendarPorNombre = new Map<string, number>();
    const partnerIds = new Array<number>();
    const partnerPorNombre = new Map<string, number>();

    empleados.forEach((e) => {
      if (e.job_id?.[1]) cargoMap.set(e.name, e.job_id[1]);

      const calId: number | undefined = e.resource_calendar_id?.[0];
      const calNombre: string | undefined = e.resource_calendar_id?.[1];
      if (calId) {
        calendarIds.push(calId);
        calendarPorNombre.set(e.name, calId);
      }
      if (calNombre) nombreMallaMap.set(e.name, calNombre);

      const cedula = e.identification_id || e.barcode;
      if (cedula) {
        cedulaMap.set(e.name, cedula);
      } else {
        // Sin identification_id ni barcode → buscar en res.partner
        const partnerId: number | undefined = e.address_home_id?.[0];
        if (partnerId) {
          partnerIds.push(partnerId);
          partnerPorNombre.set(e.name, partnerId);
        } else {
        }
      }
    });

    // Buscar doc_number en res.partner para quienes no tenían identification_id
    if (partnerIds.length > 0) {
      const partners = await this.odoo.executeKw<any[]>(
        'res.partner',
        'search_read',
        [[['id', 'in', [...new Set(partnerIds)]]]],
        { fields: ['id', 'doc_number'] },
        uid,
      );
      const docPorPartnerId = new Map<number, string>(
        partners?.map((p) => [p.id, p.doc_number]) ?? [],
      );

      partnerPorNombre.forEach((partnerId, nombre) => {
        const doc = docPorPartnerId.get(partnerId);
        console.log(
          `🔎 Partner ${partnerId} para "${nombre}" → doc_number: "${doc}" (tipo: ${typeof doc})`,
        );
        if (doc && doc.trim() !== '' && doc !== 'false') {
          cedulaMap.set(nombre, doc);
          console.log(`✅ Cédula por partner: "${nombre}" → ${doc}`);
        } else {
          console.warn(`⚠️ doc_number vacío o false para: "${nombre}"`);
        }
      });
    }

    // Buscar líneas de malla horaria
    if (calendarIds.length > 0) {
      const lineas = await this.odoo.executeKw<any[]>(
        'resource.calendar.attendance',
        'search_read',
        [[['calendar_id', 'in', [...new Set(calendarIds)]]]],
        { fields: ['calendar_id', 'dayofweek', 'hour_from', 'hour_to'] },
        uid,
      );

      const mallasPorCalendar = new Map<number, any[]>();
      lineas?.forEach((l) => {
        const cid: number = l.calendar_id[0];
        if (!mallasPorCalendar.has(cid)) mallasPorCalendar.set(cid, []);
        mallasPorCalendar.get(cid)!.push(l);
      });

      calendarPorNombre.forEach((calId, nombre) => {
        const lineasCal = mallasPorCalendar.get(calId);
        if (lineasCal) mallaMap.set(nombre, this.formatearMalla(lineasCal));
      });
    }

    console.log(
      `📊 Cédulas resueltas: ${cedulaMap.size} / ${empleados.length}`,
    );
    return { cedulaMap, cargoMap, mallaMap, nombreMallaMap };
  }

  private aplicarEstiloCabecera(worksheet: ExcelJS.Worksheet): void {
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF107C41' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  }

  // ─────────────────────────────────────────────
  // MÉTODO PRINCIPAL
  // ─────────────────────────────────────────────

  async generarReporteAsistencias(data: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Asistencias');

    // Datos de Odoo
    let cedulaMap = new Map<string, string>();
    let cargoMap = new Map<string, string>();
    let mallaMap = new Map<string, string>();
    let nombreMallaMap = new Map<string, string>();

    try {
      const nombresEmpleados = [
        ...new Set(data.map((item) => item.empleado || item.Colaborador)),
      ].filter(Boolean) as string[];

      const employeeIds = [
        ...new Set(
          data
            .map((item) => item.employee_id)
            .filter((id) => id && typeof id === 'number'),
        ),
      ] as number[];

      if (nombresEmpleados.length > 0) {
        const uid = await this.odoo.authenticate();
        ({ cedulaMap, cargoMap, mallaMap, nombreMallaMap } =
          await this.obtenerDatosOdooParaAsistencias(
            uid,
            nombresEmpleados,
            employeeIds.length > 0 ? employeeIds : undefined, // 👈
          ));
      }
    } catch (odooErr) {
      console.error('Error consultando Odoo (asistencias):', odooErr.message);
    }

    // Columnas
    worksheet.columns = [
      { header: 'COLABORADOR', key: 'colaborador', width: 35 },
      { header: 'CÉDULA', key: 'cedula', width: 15 },
      { header: 'CARGO', key: 'cargo', width: 30 },
      { header: 'DEPARTAMENTO', key: 'depto', width: 25 },
      { header: 'FECHA', key: 'fecha', width: 15 },
      { header: 'HORA ENTRADA', key: 'entrada', width: 20 },
      { header: 'HORA SALIDA', key: 'salida', width: 20 },
      { header: 'ESTATUS ENTRADA', key: 'estatus_entrada', width: 25 },
      { header: 'ESTATUS SALIDA', key: 'estatus_salida', width: 25 },
      { header: 'NOMBRE MALLA', key: 'nombre_malla', width: 30 },
      { header: 'MALLA HORARIA', key: 'malla', width: 70 },
    ];

    this.aplicarEstiloCabecera(worksheet);

    // Filas
    data.forEach((item) => {
      const nombre = item.empleado || item.Colaborador;
      worksheet.addRow({
        colaborador: nombre || 'N/A',
        cedula: item.doc_number || cedulaMap.get(nombre) || 'N/A',
        cargo: cargoMap.get(nombre) || 'N/A',
        depto: item.department_id || item.Departamento || 'N/A',
        fecha: item.fecha || item.Fecha || 'N/A',
        entrada: item.Entrada || item.check_in || 'N/A',
        salida: item.Salida || item.check_out || 'N/A',
        estatus_entrada: item.Estatus_Entrada || item.c_entrada || 'N/A',
        estatus_salida: item.Estatus_Salida || item.c_salida || 'N/A',
        nombre_malla: nombreMallaMap.get(nombre) || 'N/A',
        malla: mallaMap.get(nombre) || 'N/A',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }
}
