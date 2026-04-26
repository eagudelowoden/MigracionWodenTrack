// src/reports/reports.service.ts
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { OdooService } from '../odoo/odoo.service';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class ReportsService {
  constructor(
    private readonly odoo: OdooService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

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

  /** Devuelve { cedulaMap, cargoMap } consultando Odoo — malla ya no viene de aquí */
  private async obtenerCedulaYCargoDeOdoo(
    uid: number,
    nombresEmpleados: string[],
  ): Promise<{
    cedulaMap: Map<string, string>;
    cargoMap: Map<string, string>;
  }> {
    const cedulaMap = new Map<string, string>();
    const cargoMap = new Map<string, string>();

    const empleados = await this.odoo.executeKw<any[]>(
      'hr.employee',
      'search_read',
      [[['name', 'in', nombresEmpleados]]],
      {
        fields: [
          'name',
          'identification_id',
          'barcode',
          'address_home_id',
          'job_id',
        ],
      },
      uid,
    );

    if (!empleados?.length) return { cedulaMap, cargoMap };

    const partnerIds = new Array<number>();
    const partnerPorNombre = new Map<string, number>();

    empleados.forEach((e) => {
      if (e.job_id?.[1]) cargoMap.set(e.name, e.job_id[1]);

      const cedula = e.identification_id || e.barcode;
      if (cedula) {
        cedulaMap.set(e.name, cedula);
      } else {
        const partnerId: number | undefined = e.address_home_id?.[0];
        if (partnerId) {
          partnerIds.push(partnerId);
          partnerPorNombre.set(e.name, partnerId);
        }
      }
    });

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
        if (doc) cedulaMap.set(nombre, doc);
      });
    }

    return { cedulaMap, cargoMap };
  }

  /**
   * Consulta la BD local: para cada (empleado, fecha) del reporte devuelve
   * la malla horaria vigente en esa fecha según mallas_asignaciones.
   * Clave del Map: "NombreEmpleado::YYYY-MM-DD"
   */
  private async obtenerMallasLocalesParaReporte(
    items: any[],
  ): Promise<Map<string, { nombreMalla: string; detallesMalla: string }>> {
    const resultMap = new Map<
      string,
      { nombreMalla: string; detallesMalla: string }
    >();
    if (!items.length) return resultMap;

    const nombresUnicos = [
      ...new Set(
        items
          .map((i) => (i.empleado || i.Colaborador) as string)
          .filter(Boolean),
      ),
    ];
    if (!nombresUnicos.length) return resultMap;

    // 1. nombre → id_odoo desde usuarios_registrados
    const escapedNames = nombresUnicos
      .map((n) => `'${n.replace(/'/g, "''")}'`)
      .join(', ');
    const usuarios: Array<{ nombre: string; id_odoo: number }> =
      await this.dataSource.query(
        `SELECT nombre, id_odoo FROM usuarios_registrados WHERE nombre IN (${escapedNames})`,
      );

    if (!usuarios.length) return resultMap;

    const idOdooMap = new Map<string, number>(
      usuarios.map((u) => [u.nombre, u.id_odoo]),
    );
    const idOdoos = [...new Set(usuarios.map((u) => u.id_odoo))];

    // 2. Traer asignaciones + detalles de malla para esos empleados
    const rows: any[] = await this.dataSource.query(`
      SELECT
        a.usuario_id_odoo,
        CONVERT(varchar(10), a.fecha_inicio, 23) AS fecha_inicio,
        CONVERT(varchar(10), a.fecha_fin,    23) AS fecha_fin,
        h.nombre                                  AS nombre_malla,
        d.dia_semana,
        d.hora_inicio,
        d.hora_fin
      FROM mallas_asignaciones a
      INNER JOIN mallas_horarias h ON h.id = a.malla_id
      LEFT  JOIN mallas_detalles d ON d.malla_id = a.malla_id
      WHERE a.usuario_id_odoo IN (${idOdoos.join(',')})
      ORDER BY a.usuario_id_odoo, a.fecha_inicio DESC
    `);

    // 3. Agrupar filas por empleado → por asignación
    const porEmpleado = new Map<number, Map<string, any>>();
    for (const row of rows) {
      const eid: number = row.usuario_id_odoo;
      if (!porEmpleado.has(eid)) porEmpleado.set(eid, new Map());
      const asigMap = porEmpleado.get(eid)!;
      const k = `${row.fecha_inicio}|${row.fecha_fin}|${row.nombre_malla}`;
      if (!asigMap.has(k)) {
        asigMap.set(k, {
          fecha_inicio: row.fecha_inicio,
          fecha_fin: row.fecha_fin ?? null,
          nombre_malla: row.nombre_malla,
          detalles: [],
        });
      }
      if (row.dia_semana !== null && row.dia_semana !== undefined) {
        asigMap.get(k)!.detalles.push({
          dia_semana: Number(row.dia_semana),
          hora_inicio: Number(row.hora_inicio),
          hora_fin: Number(row.hora_fin),
        });
      }
    }

    // 4. Para cada item resolver la malla vigente en su fecha
    for (const item of items) {
      const nombre: string = item.empleado || item.Colaborador;
      const fecha: string = String(item.fecha || item.Fecha || '').slice(0, 10);
      if (!nombre || !fecha) continue;

      const clave = `${nombre}::${fecha}`;
      if (resultMap.has(clave)) continue;

      const idOdoo = idOdooMap.get(nombre);
      if (!idOdoo) continue;

      const asigMap = porEmpleado.get(idOdoo);
      if (!asigMap?.size) continue;

      // Lista ordenada DESC por fecha_inicio (ya viene así de la query)
      const asigList = [...asigMap.values()];

      // Buscar asignación cuyo rango cubre la fecha
      const vigente =
        asigList.find((a) => {
          const inicio = String(a.fecha_inicio).slice(0, 10);
          const fin = a.fecha_fin ? String(a.fecha_fin).slice(0, 10) : null;
          return inicio <= fecha && (fin === null || fin >= fecha);
        }) ??
        // Fallback: la más reciente anterior a la fecha
        asigList.find((a) => String(a.fecha_inicio).slice(0, 10) <= fecha);

      if (vigente) {
        resultMap.set(clave, {
          nombreMalla: vigente.nombre_malla,
          detallesMalla: this.formatearMallaLocal(vigente.detalles),
        });
      }
    }

    return resultMap;
  }

  private formatearMallaLocal(
    detalles: Array<{
      dia_semana: number;
      hora_inicio: number;
      hora_fin: number;
    }>,
  ): string {
    if (!detalles?.length) return 'SIN DETALLE';
    const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return [...detalles]
      .sort((a, b) => a.dia_semana - b.dia_semana)
      .map(
        (d) =>
          `${DIAS[d.dia_semana] ?? `D${d.dia_semana}`} ${this.decimalAHora(d.hora_inicio)}-${this.decimalAHora(d.hora_fin)}`,
      )
      .join(' | ');
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

    let cedulaMap = new Map<string, string>();
    let cargoMap = new Map<string, string>();
    let mallasLocales = new Map<
      string,
      { nombreMalla: string; detallesMalla: string }
    >();

    const nombresEmpleados = [
      ...new Set(data.map((item) => item.empleado || item.Colaborador)),
    ].filter(Boolean) as string[];

    // Cedula y cargo desde Odoo
    if (nombresEmpleados.length > 0) {
      try {
        const uid = await this.odoo.authenticate();
        ({ cedulaMap, cargoMap } = await this.obtenerCedulaYCargoDeOdoo(
          uid,
          nombresEmpleados,
        ));
      } catch (odooErr) {
        console.error('Error consultando Odoo (cedula/cargo):', odooErr.message);
      }
    }

    // Malla horaria desde la BD local según la fecha del registro
    try {
      mallasLocales = await this.obtenerMallasLocalesParaReporte(data);
    } catch (localErr) {
      console.error('Error consultando mallas locales:', localErr.message);
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
      const fecha = String(item.fecha || item.Fecha || '').slice(0, 10);
      const claveMalla = `${nombre}::${fecha}`;
      const mallaLocal = mallasLocales.get(claveMalla);

      worksheet.addRow({
        colaborador: nombre || 'N/A',
        cedula: item.doc_number || cedulaMap.get(nombre) || 'N/A',
        cargo: cargoMap.get(nombre) || 'N/A',
        depto: item.department_id || item.Departamento || 'N/A',
        fecha: fecha || 'N/A',
        entrada: item.Entrada || item.check_in || 'N/A',
        salida: item.Salida || item.check_out || 'N/A',
        estatus_entrada: item.Estatus_Entrada || item.c_entrada || 'N/A',
        estatus_salida: item.Estatus_Salida || item.c_salida || 'N/A',
        nombre_malla: mallaLocal?.nombreMalla || 'N/A',
        malla: mallaLocal?.detallesMalla || 'N/A',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }
}
