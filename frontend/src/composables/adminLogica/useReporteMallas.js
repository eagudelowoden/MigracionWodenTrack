import { ref, computed, watch } from "vue";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ── Helpers puros ──────────────────────────────────────────────────────────────
function getSession() {
  return JSON.parse(localStorage.getItem("user_session") || "{}");
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

const COLS_HX = ["rn", "rndf", "rddf", "hedo", "heno", "hefd", "hefn"];
const itemsPerPage = 20;

// ══════════════════════════════════════════════════════════════════════════════
// Estado a nivel de módulo — persiste mientras la app esté cargada
// ══════════════════════════════════════════════════════════════════════════════

// Cálculos (resultados frescos)
const registros = ref([]);
const isLoading = ref(false);
const isCalculating = ref(false);
const isSaving = ref(false);
const isExporting = ref(false);
const hayResultadosCalculados = ref(false);
const perfilUsuario = ref(null);

// Filtros y fechas
const startDate = ref(getFirstDayOfMonth());
const endDate = ref(getToday());
const filterNombre = ref("");
const filterCargo = ref("");
const filterDepartamento = ref("");
const soloConExtras = ref(false);
const aprobacionesLocales = ref({});

// Paginación cálculos
const currentPage = ref(1);

// Selección por checkbox
const selectedKeys = ref(new Set());

// Novedades aprobadas
const novedadesAprobadas = ref([]);
const isLoadingNovedades = ref(false);
const isNotifying = ref(false);

// Novedades HX (legacy, se mantiene para compat)
const novedadesHX = ref([]);
const isLoadingNovedadesHX = ref(false);

// Guardados (historial desde DB)
const registrosGuardados = ref([]);
const isLoadingGuardados = ref(false);
const currentPageGuardados = ref(1);

// ── Computed (módulo) ──────────────────────────────────────────────────────────

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

const registrosFiltrados = computed(() => {
  let list = registros.value;
  if (filterNombre.value) {
    const q = filterNombre.value.toLowerCase();
    list = list.filter(
      (r) => r.nombre?.toLowerCase().includes(q) || r.cedula?.includes(filterNombre.value),
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
      (r) => (r.hedo || 0) + (r.heno || 0) + (r.hefd || 0) + (r.hefn || 0) > 0,
    );
  }
  return list;
});

const gruposPorEmpresa = computed(() => {
  const empresaMapa = new Map();
  for (const r of registrosFiltrados.value) {
    const empresa = r.company || "Sin empresa";
    if (!empresaMapa.has(empresa)) empresaMapa.set(empresa, new Map());
    const colabMapa = empresaMapa.get(empresa);
    const key = r.cedula;
    if (!colabMapa.has(key)) {
      colabMapa.set(key, {
        cedula: r.cedula,
        nombre: r.nombre,
        cargo: r.cargo,
        departamento: r.departamento,
        filas: [],
        subtotales: Object.fromEntries(COLS_HX.map((c) => [c, 0])),
      });
    }
    const grupo = colabMapa.get(key);
    grupo.filas.push(r);
    for (const col of COLS_HX) {
      grupo.subtotales[col] =
        Math.round((grupo.subtotales[col] + (Number(r[col]) || 0)) * 100) / 100;
    }
  }
  return [...empresaMapa.entries()].map(([empresa, colabMapa]) => ({
    empresa,
    grupos: [...colabMapa.values()],
  }));
});

const gruposConSubtotales = computed(() =>
  gruposPorEmpresa.value.flatMap((e) => e.grupos),
);

const filasAplanadas = computed(() => {
  const out = [];
  for (const { empresa, grupos } of gruposPorEmpresa.value) {
    out.push({ tipo: "empresa", data: { empresa } });
    for (const g of grupos) {
      for (const f of g.filas) out.push({ tipo: "fila", data: f });
      out.push({ tipo: "subtotal", data: g });
    }
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

// Selección
const isAllFilteredSelected = computed(() => {
  const list = registrosFiltrados.value;
  return list.length > 0 && list.every((r) => selectedKeys.value.has(_rowKey(r)));
});
const isIndeterminate = computed(() => {
  const list = registrosFiltrados.value;
  const count = list.filter((r) => selectedKeys.value.has(_rowKey(r))).length;
  return count > 0 && count < list.length;
});
const selectedRecords = computed(() =>
  registrosFiltrados.value.filter((r) => selectedKeys.value.has(_rowKey(r))),
);

// Guardados computed
const gruposPorEmpresaGuardados = computed(() => {
  const empresaMapa = new Map();
  for (const r of registrosGuardados.value) {
    const empresa = r.company || "Sin empresa";
    if (!empresaMapa.has(empresa)) empresaMapa.set(empresa, new Map());
    const colabMapa = empresaMapa.get(empresa);
    const key = r.cedula;
    if (!colabMapa.has(key)) {
      colabMapa.set(key, {
        cedula: r.cedula, nombre: r.nombre, cargo: r.cargo,
        departamento: r.departamento, filas: [],
        subtotales: Object.fromEntries(COLS_HX.map((c) => [c, 0])),
      });
    }
    const grupo = colabMapa.get(key);
    grupo.filas.push(r);
    for (const col of COLS_HX) {
      grupo.subtotales[col] =
        Math.round((grupo.subtotales[col] + (Number(r[col]) || 0)) * 100) / 100;
    }
  }
  return [...empresaMapa.entries()].map(([empresa, colabMapa]) => ({
    empresa, grupos: [...colabMapa.values()],
  }));
});
const filasAplanadasGuardados = computed(() => {
  const out = [];
  for (const { empresa, grupos } of gruposPorEmpresaGuardados.value) {
    out.push({ tipo: "empresa", data: { empresa } });
    for (const g of grupos) {
      for (const f of g.filas) out.push({ tipo: "fila", data: f });
      out.push({ tipo: "subtotal", data: g });
    }
  }
  return out;
});
const totalPagesGuardados = computed(() =>
  Math.max(1, Math.ceil(filasAplanadasGuardados.value.length / itemsPerPage)),
);
const filasPaginadasGuardados = computed(() => {
  const start = (currentPageGuardados.value - 1) * itemsPerPage;
  return filasAplanadasGuardados.value.slice(start, start + itemsPerPage);
});

// ── Watch (módulo) ─────────────────────────────────────────────────────────────
watch([filterNombre, filterCargo, filterDepartamento, soloConExtras], () => {
  currentPage.value = 1;
});

// ── Helpers internos ───────────────────────────────────────────────────────────
function _rowKey(r) {
  return `${r.cedula}_${r.fecha}`;
}

function isSelected(r) {
  return selectedKeys.value.has(_rowKey(r));
}
function toggleSelected(r) {
  const k = _rowKey(r);
  const next = new Set(selectedKeys.value);
  if (next.has(k)) next.delete(k);
  else next.add(k);
  selectedKeys.value = next;
}
function toggleAllFiltered() {
  if (isAllFilteredSelected.value || isIndeterminate.value) {
    selectedKeys.value = new Set();
  } else {
    selectedKeys.value = new Set(registrosFiltrados.value.map(_rowKey));
  }
}
function clearSelection() {
  selectedKeys.value = new Set();
}

// ── Formatters ─────────────────────────────────────────────────────────────────
function formatHora(datetime) {
  if (!datetime) return "";
  const parts = datetime.split(" ");
  return parts[1] ? parts[1].slice(0, 5) : "";
}
function formatFecha(fechaStr) {
  if (!fechaStr) return "";
  return fechaStr.split("-").reverse().join("/");
}
function formatDecimal(val) {
  const n = Number(val) || 0;
  // Mostrar el valor real hasta 2 decimales, sin ceros finales:
  // 7.66 → "7.66" | 1.5 → "1.5" | 2.0 → "2" | 0.5 → "0.5"
  // Igual que el Excel (numFmt '0.##'), así UI y archivo siempre coinciden.
  return parseFloat(n.toFixed(2)).toString();
}
function getAprobadoLabel(aprobado) {
  if (aprobado === true) return "APROBADO";
  if (aprobado === false) return "RECHAZADO";
  return "PENDIENTE";
}

// ══════════════════════════════════════════════════════════════════════════════
// Función exportada — contiene solo las llamadas async a la API
// ══════════════════════════════════════════════════════════════════════════════
export function useReporteMallas() {

  async function _cargarPerfil() {
    try {
      const s = getSession();
      const idOdoo = s.employee_id || s.id_odoo;
      if (!idOdoo) return;
      const { data } = await axios.get(`${API_BASE_URL}/perfil-completo/${idOdoo}`);
      perfilUsuario.value = data;
    } catch (e) {
      console.error("Error cargando perfil para horas extra:", e);
    }
  }

  function getAreaSegmento() {
    const s = getSession();
    if (s.isSuperAdmin || s.role === "desarrollador_junior" || hasPerm("admin.ver_todo")) {
      return {};
    }
    const esResponsableSegmento = hasPerm("novedades.ver_segmento");
    const perfil = perfilUsuario.value;
    if (esResponsableSegmento && perfil?.segmento?.id) return { segmento_id: perfil.segmento.id };
    if (perfil?.area?.id) return { area_id: perfil.area.id };
    if (s.segmento_id) return { segmento_id: s.segmento_id };
    if (s.area_id) return { area_id: s.area_id };
    return {};
  }

  async function _asegurarPerfil() {
    const s = getSession();
    if (!s.isSuperAdmin && !hasPerm("admin.ver_todo") && !perfilUsuario.value) {
      await _cargarPerfil();
    }
  }

  async function cargarHistorial(company) {
    try {
      isLoading.value = true;
      aprobacionesLocales.value = {};
      await _asegurarPerfil();
      const s = getSession();
      const params = {
        startDate: startDate.value,
        endDate: endDate.value,
        ...(company && company !== "Todas" ? { company } : {}),
        ...getAreaSegmento(),
      };
      if (!hasPerm("admin.filtro_departamento") && !s.isSuperAdmin) {
        if (s.department) params.departamento = s.department;
      }
      const { data } = await axios.get(`${API_BASE_URL}/horas-extra/historial`, { params });
      registros.value = data;
      currentPage.value = 1;
    } catch (err) {
      console.error("Error cargando historial horas extra:", err);
    } finally {
      isLoading.value = false;
    }
  }

  async function calcular(company) {
    try {
      isCalculating.value = true;
      hayResultadosCalculados.value = false;
      await _asegurarPerfil();
      const s = getSession();
      const payload = {
        startDate: startDate.value,
        endDate: endDate.value,
        company: company || "",
        calculado_por: s.name || "Desconocido",
        ...getAreaSegmento(),
      };
      const { data } = await axios.post(`${API_BASE_URL}/horas-extra/calcular`, payload);
      registros.value = data;
      currentPage.value = 1;
      hayResultadosCalculados.value = true;
    } catch (err) {
      console.error("Error calculando horas extra:", err);
      throw err;
    } finally {
      isCalculating.value = false;
    }
  }

  const CAMPOS_HORAS_HX = ['rn', 'rndf', 'rddf', 'hedo', 'heno', 'hefd', 'hefn'];

  async function guardarCalculados(company, usarDecimales = true) {
    try {
      isSaving.value = true;
      const s = getSession();
      const base =
        selectedRecords.value.length > 0
          ? selectedRecords.value
          : registrosFiltrados.value;

      // Si el toggle de decimales está OFF, guardamos horas enteras (Math.floor)
      // para que el correo y el Excel muestren los mismos valores que la tabla.
      const toSave = usarDecimales
        ? base
        : base.map((r) => {
            const copia = { ...r };
            for (const c of CAMPOS_HORAS_HX) {
              copia[c] = Math.floor(Number(r[c] || 0));
            }
            return copia;
          });

      await axios.post(`${API_BASE_URL}/horas-extra/guardar-seleccionados`, {
        registros: toSave,
        calculado_por: s.name || "Desconocido",
      });
      clearSelection();
    } catch (err) {
      console.error("Error guardando horas extra:", err);
      throw err;
    } finally {
      isSaving.value = false;
    }
  }

  async function calcularYCargar(company) {
    return guardarCalculados(company);
  }

  async function aprobarMasivo(company, tipo) {
    try {
      await axios.patch(`${API_BASE_URL}/horas-extra/aprobar`, {
        startDate: startDate.value,
        endDate: endDate.value,
        company: company || "",
        tipo,
      });
      registros.value = registros.value.map((r) => {
        if (tipo === "todas") return { ...r, aprobado: true };
        if (tipo === "dominicales") return { ...r, aprobado: r.es_dominical ? true : false };
        return { ...r, aprobado: false };
      });
    } catch (err) {
      console.error("Error aprobación masiva:", err);
      throw err;
    }
  }

  async function aprobarRegistro(id, aprobado, observacion) {
    try {
      aprobacionesLocales.value[id] = aprobado;
      await axios.patch(`${API_BASE_URL}/horas-extra/aprobar/${id}`, {
        aprobado,
        observacion: observacion || null,
      });
      // Actualizar en registrosGuardados
      const idxG = registrosGuardados.value.findIndex((r) => r.id === id);
      if (idxG !== -1) {
        registrosGuardados.value[idxG] = {
          ...registrosGuardados.value[idxG],
          aprobado,
          observacion: observacion || null,
        };
      }
      // Sincronizar novedadesAprobadas
      if (aprobado === true) {
        const reg = registrosGuardados.value[idxG] ?? { id };
        const yaExiste = novedadesAprobadas.value.findIndex((n) => n.id === id);
        if (yaExiste === -1) {
          novedadesAprobadas.value = [
            { ...reg, aprobado: true, observacion: observacion || null },
            ...novedadesAprobadas.value,
          ];
        } else {
          novedadesAprobadas.value[yaExiste] = {
            ...novedadesAprobadas.value[yaExiste],
            observacion: observacion || null,
          };
        }
      } else {
        novedadesAprobadas.value = novedadesAprobadas.value.filter((n) => n.id !== id);
      }
    } catch (err) {
      console.error("Error aprobando registro:", err);
      delete aprobacionesLocales.value[id];
      throw err;
    }
  }

  async function actualizarHoras(id, horas) {
    try {
      const res = await axios.patch(`${API_BASE_URL}/horas-extra/${id}/horas`, horas);
      const actualizado = res.data;
      const idx = registrosGuardados.value.findIndex((r) => r.id === id);
      if (idx !== -1) {
        registrosGuardados.value[idx] = { ...registrosGuardados.value[idx], ...actualizado };
      }
      return actualizado;
    } catch (err) {
      console.error("Error actualizando horas:", err);
      throw err;
    }
  }

  async function actualizarActividad(id, actividad) {
    try {
      await axios.patch(`${API_BASE_URL}/horas-extra/${id}/actividad`, { actividad });
      // Actualizar en registrosGuardados
      const idx = registrosGuardados.value.findIndex((r) => r.id === id);
      if (idx !== -1) {
        registrosGuardados.value[idx] = { ...registrosGuardados.value[idx], actividad: actividad?.trim() || null };
      }
    } catch (err) {
      console.error("Error actualizando actividad:", err);
      throw err;
    }
  }

  async function notificarAprobados() {
    try {
      isNotifying.value = true;
      await axios.post(`${API_BASE_URL}/horas-extra/notificar-aprobados`, {
        registros: novedadesAprobadas.value,
      });
    } catch (err) {
      console.error("Error enviando notificación:", err);
      throw err;
    } finally {
      isNotifying.value = false;
    }
  }

  async function cargarNovedadesAprobadas(company) {
    try {
      isLoadingNovedades.value = true;
      await _asegurarPerfil();
      const params = {
        startDate: startDate.value,
        endDate: endDate.value,
        ...(company && company !== "Todas" ? { company } : {}),
        ...getAreaSegmento(),
      };
      const { data } = await axios.get(
        `${API_BASE_URL}/horas-extra/novedades-aprobadas`,
        { params: { ...params, _t: Date.now() } },
      );
      novedadesAprobadas.value = data;
    } catch (err) {
      console.error("Error cargando novedades aprobadas:", err);
    } finally {
      isLoadingNovedades.value = false;
    }
  }

  async function cargarNovedadesHX(company) {
    try {
      isLoadingNovedadesHX.value = true;
      await _asegurarPerfil();
      const s = getSession();
      const params = {
        startDate: startDate.value,
        endDate: endDate.value,
        ...(company && company !== "Todas" ? { company } : {}),
        ...getAreaSegmento(),
      };
      if (!hasPerm("admin.filtro_departamento") && !s.isSuperAdmin) {
        if (s.department) params.departamento = s.department;
      }
      const { data } = await axios.get(`${API_BASE_URL}/horas-extra/historial`, { params });
      const deptMap = new Map();
      for (const r of data) {
        const dept = r.departamento || "Sin departamento";
        if (!deptMap.has(dept)) {
          deptMap.set(dept, {
            departamento: dept,
            personas: new Set(),
            totales: { rn: 0, rndf: 0, rddf: 0, hedo: 0, heno: 0, hefd: 0, hefn: 0 },
          });
        }
        const d = deptMap.get(dept);
        d.personas.add(r.cedula);
        for (const col of COLS_HX) {
          d.totales[col] = Math.floor(d.totales[col] + (Number(r[col]) || 0));
        }
      }
      novedadesHX.value = [...deptMap.values()].map((d) => ({ ...d, personas: d.personas.size }));
    } catch (err) {
      console.error("Error cargando novedades HX:", err);
    } finally {
      isLoadingNovedadesHX.value = false;
    }
  }

  async function cargarGuardados(company) {
    try {
      isLoadingGuardados.value = true;
      await _asegurarPerfil();
      const s = getSession();
      const params = {
        startDate: startDate.value,
        endDate: endDate.value,
        ...(company && company !== "Todas" ? { company } : {}),
        ...getAreaSegmento(),
      };
      if (!hasPerm("admin.filtro_departamento") && !s.isSuperAdmin) {
        if (s.department) params.departamento = s.department;
      }
      const { data } = await axios.get(`${API_BASE_URL}/horas-extra/historial`, { params });
      registrosGuardados.value = data;
      currentPageGuardados.value = 1;
    } catch (err) {
      console.error("Error cargando guardados:", err);
    } finally {
      isLoadingGuardados.value = false;
    }
  }

  async function eliminarRegistro(id) {
    await axios.delete(`${API_BASE_URL}/horas-extra/${id}`);
    registrosGuardados.value = registrosGuardados.value.filter((r) => r.id !== id);
    novedadesAprobadas.value = novedadesAprobadas.value.filter((n) => n.id !== id);
  }

  async function deshacerAprobacion(id) {
    await axios.patch(`${API_BASE_URL}/horas-extra/aprobar/${id}`, {
      aprobado: null,
      observacion: null,
    });
    const idx = registrosGuardados.value.findIndex((r) => r.id === id);
    if (idx !== -1) {
      registrosGuardados.value[idx] = {
        ...registrosGuardados.value[idx],
        aprobado: null,
        observacion: null,
      };
    }
    novedadesAprobadas.value = novedadesAprobadas.value.filter((n) => n.id !== id);
  }

  async function exportarExcel(company) {
    try {
      isExporting.value = true;
      const response = await axios.post(
        `${API_BASE_URL}/horas-extra/exportar-calculado`,
        { registros: registrosFiltrados.value },
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const fecha = new Date().toISOString().slice(0, 10);
      link.setAttribute("download", `reporte_hx_mallas_${fecha}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exportando Excel:", err);
      throw err;
    } finally {
      isExporting.value = false;
    }
  }

  return {
    // Estado cálculos
    registros,
    isLoading,
    isCalculating,
    isSaving,
    isExporting,
    hayResultadosCalculados,

    // Filtros
    startDate,
    endDate,
    filterNombre,
    filterCargo,
    filterDepartamento,
    soloConExtras,

    // Opciones dropdowns
    opcionesNombres,
    opcionesCargos,
    opcionesDepartamentos,

    // Datos procesados cálculos
    registrosFiltrados,
    gruposPorEmpresa,
    gruposConSubtotales,
    filasAplanadas,
    filasPaginadas,
    currentPage,
    totalPages,
    totalRegistros: computed(() => registrosFiltrados.value.length),

    // Selección
    selectedKeys,
    selectedRecords,
    isSelected,
    toggleSelected,
    isAllFilteredSelected,
    isIndeterminate,
    toggleAllFiltered,
    clearSelection,

    // Novedades
    novedadesAprobadas,
    isLoadingNovedades,
    cargarNovedadesAprobadas,
    novedadesHX,
    isLoadingNovedadesHX,
    cargarNovedadesHX,
    isNotifying,
    notificarAprobados,

    // Guardados
    registrosGuardados,
    isLoadingGuardados,
    currentPageGuardados,
    totalPagesGuardados,
    filasAplanadasGuardados,
    filasPaginadasGuardados,
    cargarGuardados,
    eliminarRegistro,
    deshacerAprobacion,

    // Acciones
    cargarHistorial,
    calcular,
    guardarCalculados,
    calcularYCargar,
    aprobarRegistro,
    aprobarMasivo,
    actualizarActividad,
    actualizarHoras,
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
