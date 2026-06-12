import { ref, computed } from 'vue';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;
const COLS_HX = ['rn', 'rndf', 'rddf', 'hedo', 'heno', 'hefd', 'hefn'];

export function useCargueHoras() {
  const registros = ref([]);
  const isLoading = ref(false);
  const isUploading = ref(false);
  const isExportingPlantilla = ref(false);
  const errorMsg = ref('');
  const successMsg = ref('');
  const currentPage = ref(1);
  const itemsPerPage = 20;

  // ── Helpers de sesión ────────────────────────────────────────────────────────
  function getSession() {
    return JSON.parse(localStorage.getItem('user_session') || '{}');
  }
  function hasPerm(permiso) {
    const s = getSession();
    return s.isSuperAdmin || s.permisos?.[permiso] === true;
  }
  function getAreaSegmento() {
    const s = getSession();
    if (s.isSuperAdmin || s.permisos?.['super.superadmin']) return {};
    const perfil = s.perfil || {};
    if (perfil.segmento?.id) return { segmento_id: perfil.segmento.id };
    if (perfil.area?.id) return { area_id: perfil.area.id };
    return {};
  }

  // ── Agrupación para tabla ─────────────────────────────────────────────────────
  const gruposPorEmpresa = computed(() => {
    const mapa = new Map();
    for (const r of registros.value) {
      const empresa = r.company || 'Sin empresa';
      if (!mapa.has(empresa)) mapa.set(empresa, new Map());
      const empleados = mapa.get(empresa);
      const key = r.cedula || r.nombre;
      if (!empleados.has(key)) empleados.set(key, { nombre: r.nombre, cedula: r.cedula, filas: [] });
      empleados.get(key).filas.push(r);
    }
    return mapa;
  });

  const filasAplanadas = computed(() => {
    const result = [];
    for (const [empresa, empleados] of gruposPorEmpresa.value) {
      result.push({ tipo: 'empresa', data: { empresa } });
      for (const [, emp] of empleados) {
        for (const fila of emp.filas) result.push({ tipo: 'fila', data: fila });
        const sub = {};
        COLS_HX.forEach(c => { sub[c] = emp.filas.reduce((a, f) => a + Number(f[c] || 0), 0); });
        result.push({ tipo: 'subtotal', data: { nombre: emp.nombre, subtotales: sub } });
      }
    }
    return result;
  });

  const totalPages = computed(() => Math.max(1, Math.ceil(filasAplanadas.value.length / itemsPerPage)));
  const filasPaginadas = computed(() => {
    const s = (currentPage.value - 1) * itemsPerPage;
    return filasAplanadas.value.slice(s, s + itemsPerPage);
  });
  const totalRegistros = computed(() => registros.value.length);

  // ── API calls ────────────────────────────────────────────────────────────────
  async function cargarHistorial({ startDate, endDate, company, departamento } = {}) {
    isLoading.value = true;
    errorMsg.value = '';
    try {
      const s = getSession();
      const params = { startDate, endDate, company };
      if (departamento) params.departamento = departamento;

      // Filtro de estructura si no es superadmin
      if (!s.isSuperAdmin && !hasPerm('admin.filtro_departamento')) {
        const estructura = getAreaSegmento();
        Object.assign(params, estructura);
      }

      const { data } = await axios.get(`${API}/horas-extra/cargue/historial`, { params });
      registros.value = data;
      currentPage.value = 1;
    } catch (e) {
      errorMsg.value = e.response?.data?.message || 'Error al cargar historial';
    } finally {
      isLoading.value = false;
    }
  }

  async function subirExcel(file, { company, departamento, origen = 'gerente' } = {}) {
    if (!file) return;
    isUploading.value = true;
    errorMsg.value = '';
    successMsg.value = '';
    try {
      const s = getSession();
      const form = new FormData();
      form.append('file', file);
      if (company) form.append('company', company);
      if (departamento) form.append('departamento', departamento);
      form.append('cargado_por', s.name || '');
      form.append('origen', origen);

      const estructura = getAreaSegmento();
      if (estructura.area_id) form.append('area_id', String(estructura.area_id));
      if (estructura.segmento_id) form.append('segmento_id', String(estructura.segmento_id));

      const { data } = await axios.post(`${API}/horas-extra/cargue`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      successMsg.value = `✅ ${data.guardados} registros guardados exitosamente.`;
      if (data.errores?.length) {
        errorMsg.value = `⚠️ ${data.errores.length} fila(s) con error: ${data.errores.slice(0, 3).join(' | ')}`;
      }
      return data;
    } catch (e) {
      errorMsg.value = e.response?.data?.message || 'Error al procesar el archivo';
      throw e;
    } finally {
      isUploading.value = false;
    }
  }

  // ── Lotes (agrupados por cargue) ─────────────────────────────────────────────
  const lotes = ref([]);
  const isLoadingLotes = ref(false);

  async function cargarLotes({ startDate, endDate, company, departamento } = {}) {
    isLoadingLotes.value = true;
    try {
      const s = getSession();
      const params = { startDate, endDate, company };
      if (departamento) params.departamento = departamento;
      if (!s.isSuperAdmin && !hasPerm('admin.filtro_departamento')) {
        Object.assign(params, getAreaSegmento());
      }
      const { data } = await axios.get(`${API}/horas-extra/cargue/lotes`, { params });
      lotes.value = data;
    } catch {
      lotes.value = [];
    } finally {
      isLoadingLotes.value = false;
    }
  }

  // ── Comparativo sistema vs gerente ───────────────────────────────────────────
  const comparativo = ref(null);
  const isLoadingComparativo = ref(false);

  async function cargarComparativo(loteId) {
    isLoadingComparativo.value = true;
    comparativo.value = null;
    try {
      const { data } = await axios.get(`${API}/horas-extra/cargue/comparar/${loteId}`);
      comparativo.value = data;
    } catch {
      comparativo.value = null;
    } finally {
      isLoadingComparativo.value = false;
    }
  }

  // ── Registros de un lote ─────────────────────────────────────────────────────
  const registrosLote = ref([]);
  const isLoadingRegistrosLote = ref(false);

  async function cargarRegistrosLote(loteId) {
    isLoadingRegistrosLote.value = true;
    registrosLote.value = [];
    try {
      const { data } = await axios.get(`${API}/horas-extra/cargue/registros/${loteId}`);
      registrosLote.value = data;
    } catch {
      registrosLote.value = [];
    } finally {
      isLoadingRegistrosLote.value = false;
    }
  }

  // ── Notificar desde cargue ───────────────────────────────────────────────────
  const isNotifyingCargue = ref(false);

  async function notificarLote(loteId) {
    isNotifyingCargue.value = true;
    try {
      const s = getSession();
      const { data } = await axios.post(`${API}/horas-extra/cargue/notificar/${loteId}`, {
        cargado_por: s.name || '',
      });
      return data;
    } finally {
      isNotifyingCargue.value = false;
    }
  }

  async function descargarPlantilla() {
    isExportingPlantilla.value = true;
    try {
      const { data } = await axios.get(`${API}/horas-extra/cargue/plantilla`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_cargue_horas.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      isExportingPlantilla.value = false;
    }
  }

  // ── Formatters ───────────────────────────────────────────────────────────────
  function formatFecha(f) {
    if (!f) return '—';
    const [y, m, d] = f.split('-');
    return `${d}/${m}/${y}`;
  }
  function formatDecimal(v) {
    const n = Number(v);
    return isNaN(n) ? '0' : n.toFixed(2).replace('.', ',');
  }

  return {
    registros,
    isLoading,
    isUploading,
    isExportingPlantilla,
    errorMsg,
    successMsg,
    currentPage,
    totalPages,
    filasPaginadas,
    filasAplanadas,
    totalRegistros,
    COLS_HX,
    cargarHistorial,
    subirExcel,
    descargarPlantilla,
    formatFecha,
    formatDecimal,
    hasPerm,
    // Lotes
    lotes,
    isLoadingLotes,
    cargarLotes,
    // Comparativo
    comparativo,
    isLoadingComparativo,
    cargarComparativo,
    // Registros de lote
    registrosLote,
    isLoadingRegistrosLote,
    cargarRegistrosLote,
    // Notificar desde cargue
    isNotifyingCargue,
    notificarLote,
  };
}
