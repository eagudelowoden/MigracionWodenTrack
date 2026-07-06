import { apiFetch } from '@/utils/apiFetch.js';
import { ref, computed } from "vue";

// Recupera el token de sesión para cabeceras manuales de fetch
function getToken() {
  try {
    const raw = localStorage.getItem('user_session');
    if (!raw) return null;
    return JSON.parse(raw)?.token ?? null;
  } catch { return null; }
}

export function useCargarAsistencias() {
  const reportData = ref([]);
  const loading = ref(false);
  const search = ref("");
  const selectedDepartment = ref("");
  const startDate = ref("");
  const endDate = ref("");
  const selectedCompany = ref("");
  const currentPage = ref(1);
  const itemsPerPage = ref(15);
  const rawData = ref([]);
  const selectedArea = ref(null);
  const selectedSegmento = ref(null);
  const filterHoy = ref(true);
  const abortController = ref(null);
  const errorMsg = ref("");
  const chunkProgress = ref({ current: 0, total: 0 });
  // Progreso real (0-100) recibido desde el backend vía SSE
  const loadingProgress = ref(0);

  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const MAX_DIAS = 31;

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const debounce = (fn, delay) => {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  /**
   * Valida el rango antes de consultar.
   * Retorna string con el error o "" si es válido.
   */
  const validarRango = () => {
    if (filterHoy.value) return "";

    if (!startDate.value || !endDate.value)
      return "Debes seleccionar fecha de inicio y fecha de fin.";

    const inicio = new Date(startDate.value + "T00:00:00");
    const fin = new Date(endDate.value + "T00:00:00");

    if (fin < inicio)
      return "La fecha de inicio debe ser anterior a la fecha de fin.";

    const diffDias = (fin - inicio) / (1000 * 60 * 60 * 24);
    if (diffDias > MAX_DIAS)
      return `El rango máximo permitido es ${MAX_DIAS} días (1 mes). Seleccionaste ${Math.round(diffDias)} días.`;

    return "";
  };

  /**
   * Construye la URL base o la URL SSE /stream con todos los filtros activos.
   */
  const buildUrl = (chunkStart, chunkEnd, stream = false) => {
    const session = JSON.parse(localStorage.getItem("user_session") || "{}");
    const permisos = session.permisos || session.permissions || {};
    const tieneFiltroDepto = permisos["admin.filtro_departamento"] === true;

    const url = new URL(`${API_BASE_URL}/reporte-novedades${stream ? '/stream' : ''}`);
    url.searchParams.append("hoy", filterHoy.value.toString());
    if (chunkStart) url.searchParams.append("startDate", chunkStart);
    if (chunkEnd) url.searchParams.append("endDate", chunkEnd);
    if (selectedCompany.value && selectedCompany.value !== "Todas")
      url.searchParams.append("company", selectedCompany.value);

    if (tieneFiltroDepto) {
      if (selectedDepartment.value)
        url.searchParams.append("departamento", selectedDepartment.value);
      if (selectedSegmento.value)
        url.searchParams.append("segmento_id", selectedSegmento.value);
      if (selectedArea.value)
        url.searchParams.append("area_id", selectedArea.value);
    } else {
      if (selectedArea.value)
        url.searchParams.append("area_id", selectedArea.value);
      if (selectedSegmento.value)
        url.searchParams.append("segmento_id", selectedSegmento.value);
    }

    return url.toString();
  };

  // ─── Fetch principal ─────────────────────────────────────────────────────────

  let initialLoadDone = false;

  const fetchReporte = debounce(async () => {
    // Cancelar request anterior si sigue activo
    if (abortController.value) abortController.value.abort();
    abortController.value = new AbortController();
    const signal = abortController.value.signal;

    // Validar rango antes de hacer cualquier llamada
    const error = validarRango();
    if (error) {
      errorMsg.value = error;
      rawData.value = [];
      return;
    }

    errorMsg.value = "";
    loading.value = true;
    rawData.value = [];
    loadingProgress.value = 0;
    chunkProgress.value = { current: 0, total: 0 };

    const streamUrl = buildUrl(
      filterHoy.value ? null : startDate.value,
      filterHoy.value ? null : endDate.value,
      true, // stream = true → /reporte-novedades/stream
    );

    try {
      const token = getToken();
      const res = await fetch(streamUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal,
      });

      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Cada evento SSE termina con \n\n
        const parts = buffer.split("\n\n");
        buffer = parts.pop(); // último fragmento incompleto

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          let event;
          try { event = JSON.parse(line.slice(6)); } catch { continue; }

          if (event.type === "progress") {
            loadingProgress.value = event.percent ?? 0;
          } else if (event.type === "chunk") {
            rawData.value = rawData.value.concat(event.data);
          } else if (event.type === "done") {
            initialLoadDone = true;
            loadingProgress.value = 100;
            setTimeout(() => { loadingProgress.value = 0; }, 400);
            loading.value = false;
          } else if (event.type === "error") {
            errorMsg.value = event.message || "Error al cargar el reporte. Intenta de nuevo.";
            rawData.value = [];
            loading.value = false;
            loadingProgress.value = 0;
          }
        }
      }

      // Safety net: si el stream cerró sin evento "done" (crash del backend)
      if (loading.value) {
        loading.value = false;
        loadingProgress.value = 0;
        if (!rawData.value?.length) {
          errorMsg.value = "La conexión se cerró inesperadamente. Intenta de nuevo.";
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Request cancelado — se lanzó uno más reciente");
        return;
      }
      console.error("Error al obtener el reporte:", err);
      errorMsg.value = "Error al cargar el reporte. Intenta de nuevo.";
      rawData.value = [];
      loading.value = false;
      loadingProgress.value = 0;
    }
  }, 600);

  // ─── Computed ────────────────────────────────────────────────────────────────

  const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    return reporteParaPantalla.value.slice(start, start + itemsPerPage.value);
  });

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(reporteParaPantalla.value.length / itemsPerPage.value)),
  );

  const departments = computed(() => {
    if (!rawData.value?.length) return [];
    return [...new Set(rawData.value.map((i) => i.department_id).filter(Boolean))].sort();
  });

  const filteredReport = computed(() => {
    const s = search.value.toLowerCase().trim();
    const d = selectedDepartment.value;
    const start = startDate.value;
    const end = endDate.value;

    return rawData.value.filter((item) => {
      const matchesSearch =
        !s ||
        String(item.empleado || "").toLowerCase().includes(s) ||
        String(item.cc || "").includes(s);
      const matchesDept =
        !d || String(item.department_id).trim() === String(d).trim();
      let matchesDate = true;
      if (start && end) matchesDate = item.fecha >= start && item.fecha <= end;
      return matchesSearch && matchesDept && matchesDate;
    });
  });

  const reporteParaPantalla = computed(() => {
    // LOG CRUDO: fusionar todos los toques del mismo empleado+día en una sola fila.
    // Primer toque = entrada, último toque = salida (si hay más de uno).
    // Se usa _bestExit para rastrear el timestamp más tardío independientemente
    // de cuándo se actualice check_in (evita que sobreescribir check_in rompa la comparación).
    const logCrudoMap = new Map();

    for (const item of filteredReport.value) {
      if (item.tipo !== "LOG CRUDO") continue;
      const key = `${item.empleado}_${item.fecha}`;
      const itemTs = item.check_out || item.check_in;
      if (!logCrudoMap.has(key)) {
        logCrudoMap.set(key, { ...item, _bestExit: itemTs });
      } else {
        const fila = logCrudoMap.get(key);
        // Entrada = toque más temprano
        if (item.check_in && fila.check_in && item.check_in < fila.check_in) {
          fila.check_in = item.check_in;
        }
        // Salida = timestamp más tardío (independiente de check_in)
        if (itemTs && (!fila._bestExit || itemTs > fila._bestExit)) {
          fila._bestExit = itemTs;
        }
      }
    }

    // Aplicar _bestExit como check_out solo si es distinto de check_in
    // y el span es razonable (< 14h). Si el span supera 14h, el primer toque
    // probablemente es la salida de un turno nocturno anterior y el último es
    // la entrada de un turno nuevo → dejar solo el último como entrada sin salida
    // (misma guarda que usa Gestión de Horas para sin-malla).
    const MAX_TURNO_MS = 14 * 60 * 60 * 1000;
    const logCrudoFinal = [...logCrudoMap.values()].map((fila) => {
      if (fila._bestExit && fila._bestExit !== fila.check_in) {
        const spanMs = new Date(fila._bestExit.replace(" ", "T")).getTime()
          - new Date(fila.check_in.replace(" ", "T")).getTime();
        if (spanMs > MAX_TURNO_MS) {
          // Span > 14h: el primer toque es de otro turno, usar solo el último como entrada
          fila.check_in = fila._bestExit;
          fila.check_out = null;
          fila.c_salida = "SIN SALIDA";
          fila.estado = "En curso";
        } else {
          fila.check_out = fila._bestExit;
          fila.c_salida = "";
          fila.estado = "Finalizado";
        }
      }
      delete fila._bestExit;
      return fila;
    });

    const noLogCrudo = filteredReport.value.filter((i) => i.tipo !== "LOG CRUDO");
    return [...noLogCrudo, ...logCrudoFinal];
  });

  // ─── Descarga Excel ──────────────────────────────────────────────────────────

  const downloadReport = async () => {
    const datos = [...reporteParaPantalla.value].sort((a, b) =>
      (b.fecha || "").localeCompare(a.fecha || "") ||
      (b.check_in || "").localeCompare(a.check_in || "")
    );
    if (datos.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    loading.value = true;

    // Formatea como DD/MM/AAAA HH:MM:SS para que la fecha de salida sea
    // visible cuando el turno cruza la medianoche (ej: entrada 01/05 21:41 → salida 02/05 05:06)
    const formatFechaHora = (value) => {
      if (!value || value === "N/A" || value === "null") return "N/A";
      try {
        const [fecha, hora] = value.split(" ");
        const [anio, mes, dia] = fecha.split("-");
        return `${dia}/${mes}/${anio}   ${hora}`;
      } catch {
        return value;
      }
    };

    const fechaDe = (value) =>
      value && value !== "N/A" ? value.split(" ")[0] : null;

    const formatSoloFecha = (yyyymmdd) => {
      if (!yyyymmdd) return null;
      const [anio, mes, dia] = yyyymmdd.split("-");
      return `${dia}/${mes}/${anio}`;
    };

    try {
      const dataFiltrada = [];

      for (const item of datos) {
        const fechaEntrada = fechaDe(item.check_in);
        const fechaSalida  = fechaDe(item.check_out);

        // Fila principal — siempre se agrega
        dataFiltrada.push({
          Colaborador: item.empleado,
          Cedula: item.cc || "N/A",
          Departamento: item.department_id,
          Entrada: formatFechaHora(item.check_in),
          Salida: formatFechaHora(item.check_out),
          Estatus_Entrada: item.c_entrada || "N/A",
          Estatus_Salida: item.c_salida || "N/A",
          Estado: item.estado,
          Fecha: fechaEntrada || null,
          NombreMalla: item.nombre_malla || '',
          MallaHoraria: item.detalles_malla || '',
          _sortKey: fechaEntrada || "",
        });

        // Fila extra: cuando la salida es de un día distinto al de entrada,
        // se agrega una fila solo con la fecha de ese día para que el día
        // quede registrado en el reporte.
        if (fechaEntrada && fechaSalida && fechaEntrada !== fechaSalida) {
          dataFiltrada.push({
            Colaborador: item.empleado,
            Cedula: item.cc || "N/A",
            Departamento: item.department_id,
            Entrada: formatSoloFecha(fechaSalida),
            Salida: "---",
            Estatus_Entrada: "---",
            Estatus_Salida: "---",
            Estado: "Registro de día (salida del turno anterior)",
            Fecha: fechaSalida,
            NombreMalla: item.nombre_malla || '',
            MallaHoraria: item.detalles_malla || '',
            _sortKey: fechaSalida,
          });
        }
      }

      // Re-ordenar descendente por fecha incluyendo las filas extras
      dataFiltrada.sort((a, b) => b._sortKey.localeCompare(a._sortKey));
      dataFiltrada.forEach((r) => delete r._sortKey);

      const response = await apiFetch(`${API_BASE_URL}/reports/asistencias/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataFiltrada),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al generar el archivo");
      }

      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlBlob;

      const ahora = new Date();
      const fechaCorta = ahora.toISOString().slice(0, 10);
      const horaCorta = ahora
        .toLocaleTimeString("es-CO", { hour12: false })
        .replace(/:/g, "-");
      const range = startDate.value
        ? `_del_${startDate.value}_al_${endDate.value || "hoy"}`
        : "";

      link.setAttribute(
        "download",
        `Reporte_Asistencias${range}_${fechaCorta}_${horaCorta}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);
    } catch (error) {
      console.error("Error en descarga:", error);
      alert(`Error al descargar el reporte: ${error.message}`);
    } finally {
      loading.value = false;
    }
  };

  // ─── Limpiar filtros ─────────────────────────────────────────────────────────

  const clearFilters = () => {
    search.value = "";
    selectedDepartment.value = "";
    startDate.value = "";
    endDate.value = "";
    filterHoy.value = false;
    selectedCompany.value = "";
    errorMsg.value = "";
  };

  // ─── Exports ─────────────────────────────────────────────────────────────────

  return {
    reportData: computed(() => reporteParaPantalla.value),
    search,
    rawData,
    selectedDepartment,
    startDate,
    endDate,
    filterHoy,
    loading,
    fetchReporte,
    downloadReport,
    clearFilters,
    selectedCompany,
    selectedArea,
    selectedSegmento,
    departments,
    errorMsg,
    chunkProgress,
    loadingProgress,
    paginatedData,
    totalPages,
    currentPage,
    itemsPerPage,
  };
}
