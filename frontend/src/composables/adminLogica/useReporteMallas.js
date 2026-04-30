import { ref, computed, watch } from 'vue';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function getSession() {
  return JSON.parse(localStorage.getItem('user_session') || '{}');
}

function hasPerm(permiso) {
  const s = getSession();
  const permisos = s.permisos || s.permissions || {};
  return permisos[permiso] === true;
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getFirstDayOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export function useReporteMallas() {
  const registros = ref([]);
  const isLoading = ref(false);
  const isCalculating = ref(false);
  const isExporting = ref(false);

  const startDate = ref(getFirstDayOfMonth());
  const endDate = ref(getToday());

  // Filtros
  const filterNombre = ref('');
  const filterCargo = ref('');
  const filterDepartamento = ref('');
  const soloConExtras = ref(false);

  // Aprobaciones locales (id → boolean|null) — se aplican antes de guardar
  const aprobacionesLocales = ref({});

  // Paginación
  const currentPage = ref(1);
  const itemsPerPage = 20;

  // ── Helpers de sesión ──────────────────────────────────────────────────────

  function getAreaSegmento() {
    const s = getSession();
    // "desarrollador_junior" ve todo (sin filtro de área/segmento)
    if (s.isSuperAdmin || s.role === 'desarrollador_junior' || hasPerm('admin.ver_todo')) {
      return {};
    }
    const params = {};
    if (s.area_id) params.area_id = s.area_id;
    if (s.segmento_id) params.segmento_id = s.segmento_id;
    return params;
  }

  // ── Opciones para filtros (derivadas de los registros cargados) ─────────────

  const opcionesNombres = computed(() => {
    const set = new Set(registros.value.map((r) => r.nombre).filter(Boolean));
    return [...set].sort();
  });

  const opcionesCargos = computed(() => {
    const set = new Set(registros.value.map((r) => r.cargo).filter(Boolean));
    return [...set].sort();
  });

  const opcionesDepartamentos = computed(() => {
    const set = new Set(registros.value.map((r) => r.departamento).filter(Boolean));
    return [...set].sort();
  });

  // ── Filtrado local ─────────────────────────────────────────────────────────

  const registrosFiltrados = computed(() => {
    let list = registros.value;

    if (filterNombre.value) {
      const q = filterNombre.value.toLowerCase();
      list = list.filter(
        (r) =>
          r.nombre?.toLowerCase().includes(q) ||
          r.cedula?.includes(filterNombre.value),
      );
    }
    if (filterCargo.value) {
      const q = filterCargo.value.toLowerCase();
      list = list.filter((r) => r.cargo?.toLowerCase().includes(q));
    }
    if (filterDepartamento.value) {
      list = list.filter((r) => r.departamento === filterDepartamento.value);
    }
    if (soloConExtras.value) {
      list = list.filter(
        (r) =>
          (r.hedo || 0) + (r.heno || 0) + (r.hefd || 0) + (r.hefn || 0) > 0,
      );
    }

    return list;
  });

  // ── Agrupación por colaborador con subtotales ──────────────────────────────

  const COLS_HX = ['rn', 'rndf', 'rddf', 'hedo', 'heno', 'hefd', 'hefn'];

  const gruposConSubtotales = computed(() => {
    const mapa = new Map();

    for (const r of registrosFiltrados.value) {
      const key = r.cedula;
      if (!mapa.has(key)) {
        mapa.set(key, {
          cedula: r.cedula,
          nombre: r.nombre,
          cargo: r.cargo,
          departamento: r.departamento,
          filas: [],
          subtotales: Object.fromEntries(COLS_HX.map((c) => [c, 0])),
        });
      }
      const grupo = mapa.get(key);
      grupo.filas.push(r);
      for (const col of COLS_HX) {
        grupo.subtotales[col] =
          Math.round((grupo.subtotales[col] + (Number(r[col]) || 0)) * 100) / 100;
      }
    }

    return [...mapa.values()];
  });

  // Filas aplanadas (fila normal + fila subtotal al final de cada grupo) para paginación
  const filasAplanadas = computed(() => {
    const out = [];
    for (const g of gruposConSubtotales.value) {
      for (const f of g.filas) {
        out.push({ tipo: 'fila', data: f });
      }
      out.push({ tipo: 'subtotal', data: g });
    }
    return out;
  });

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(filasAplanadas.value.length / itemsPerPage)),
  );

  const filasPaginadas = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filasAplanadas.value.slice(start, start + itemsPerPage);
  });

  watch([filterNombre, filterCargo, filterDepartamento, soloConExtras], () => {
    currentPage.value = 1;
  });

  // ── API calls ──────────────────────────────────────────────────────────────

  async function cargarHistorial(company) {
    try {
      isLoading.value = true;
      aprobacionesLocales.value = {};

      const s = getSession();
      const params = {
        startDate: startDate.value,
        endDate: endDate.value,
        ...(company && company !== 'Todas' ? { company } : {}),
        ...getAreaSegmento(),
      };

      // Si el usuario tiene filtro de departamento fijo (sin permiso de ver todo)
      if (!hasPerm('admin.filtro_departamento') && !s.isSuperAdmin) {
        if (s.department) params.departamento = s.department;
      }

      const { data } = await axios.get(
        `${API_BASE_URL}/usuarios/horas-extra/historial`,
        { params },
      );
      registros.value = data;
      currentPage.value = 1;
    } catch (err) {
      console.error('Error cargando historial horas extra:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function calcularYCargar(company) {
    try {
      isCalculating.value = true;
      const s = getSession();

      const payload = {
        startDate: startDate.value,
        endDate: endDate.value,
        company: company || '',
        calculado_por: s.name || 'Desconocido',
        guardar: true,
        ...getAreaSegmento(),
      };

      await axios.post(
        `${API_BASE_URL}/usuarios/horas-extra/guardar`,
        payload,
      );
      await cargarHistorial(company);
    } catch (err) {
      console.error('Error calculando horas extra:', err);
      throw err;
    } finally {
      isCalculating.value = false;
    }
  }

  async function aprobarRegistro(id, aprobado) {
    try {
      aprobacionesLocales.value[id] = aprobado;
      await axios.patch(
        `${API_BASE_URL}/usuarios/horas-extra/aprobar/${id}`,
        { aprobado },
      );
      // Actualizar en la lista local
      const idx = registros.value.findIndex((r) => r.id === id);
      if (idx !== -1) registros.value[idx].aprobado = aprobado;
    } catch (err) {
      console.error('Error aprobando registro:', err);
      delete aprobacionesLocales.value[id];
      throw err;
    }
  }

  async function exportarExcel(company) {
    try {
      isExporting.value = true;
      const s = getSession();

      const params = {
        startDate: startDate.value,
        endDate: endDate.value,
        ...(company && company !== 'Todas' ? { company } : {}),
        ...getAreaSegmento(),
      };

      if (!hasPerm('admin.filtro_departamento') && !s.isSuperAdmin) {
        if (s.department) params.departamento = s.department;
      }

      const response = await axios.get(
        `${API_BASE_URL}/usuarios/horas-extra/exportar-excel`,
        { params, responseType: 'blob' },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fecha = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `reporte_hx_mallas_${fecha}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exportando Excel:', err);
      throw err;
    } finally {
      isExporting.value = false;
    }
  }

  // ── Helpers UI ─────────────────────────────────────────────────────────────

  function formatHora(datetime) {
    if (!datetime) return '';
    const parts = datetime.split(' ');
    return parts[1] ? parts[1].slice(0, 5) : '';
  }

  function formatFecha(fechaStr) {
    if (!fechaStr) return '';
    return fechaStr.split('-').reverse().join('/');
  }

  function formatDecimal(val) {
    const n = Number(val) || 0;
    return n === 0 ? '0' : n.toFixed(2).replace('.', ',');
  }

  function getAprobadoLabel(aprobado) {
    if (aprobado === true) return 'APROBADO';
    if (aprobado === false) return 'RECHAZADO';
    return 'PENDIENTE';
  }

  return {
    // Estado
    registros,
    isLoading,
    isCalculating,
    isExporting,

    // Filtros
    startDate,
    endDate,
    filterNombre,
    filterCargo,
    filterDepartamento,
    soloConExtras,

    // Opciones para dropdowns
    opcionesNombres,
    opcionesCargos,
    opcionesDepartamentos,

    // Datos procesados
    registrosFiltrados,
    gruposConSubtotales,
    filasAplanadas,
    filasPaginadas,
    currentPage,
    totalPages,
    totalRegistros: computed(() => registrosFiltrados.value.length),

    // Acciones
    cargarHistorial,
    calcularYCargar,
    aprobarRegistro,
    exportarExcel,

    // Helpers UI
    formatHora,
    formatFecha,
    formatDecimal,
    getAprobadoLabel,

    COLS_HX,

    hasPerm,
  };
}
