import { ref, computed } from "vue";

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
  // Progreso de carga por chunks: { current: 2, total: 4 }
  const chunkProgress = ref({ current: 0, total: 0 });

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
   * Divide un rango [start, end] (YYYY-MM-DD) en trozos de hasta 7 días.
   * Retorna array de { start, end }.
   */
  const splitEnSemanas = (start, end) => {
    const chunks = [];
    let cursor = new Date(start + "T00:00:00");
    const fechaFin = new Date(end + "T00:00:00");

    while (cursor <= fechaFin) {
      const chunkStart = cursor.toISOString().slice(0, 10);
      const limite = new Date(cursor);
      limite.setDate(limite.getDate() + 6);
      const chunkEnd = (limite <= fechaFin ? limite : fechaFin)
        .toISOString()
        .slice(0, 10);
      chunks.push({ start: chunkStart, end: chunkEnd });
      cursor.setDate(cursor.getDate() + 7);
    }
    return chunks;
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
   * Construye la URL con todos los filtros activos.
   * chunkStart / chunkEnd sobreescriben las fechas del filtro (para chunking).
   */
  const buildUrl = (chunkStart, chunkEnd) => {
    const session = JSON.parse(localStorage.getItem("user_session") || "{}");
    const permisos = session.permisos || session.permissions || {};
    const tieneFiltroDepto = permisos["admin.filtro_departamento"] === true;

    const url = new URL(`${API_BASE_URL}/reporte-novedades`);
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
    chunkProgress.value = { current: 0, total: 0 };

    try {
      if (filterHoy.value) {
        // ── Modo "Hoy": una sola petición ──────────────────────────────────
        const res = await fetch(buildUrl(null, null), { signal });
        if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
        rawData.value = await res.json();
      } else {
        // ── Modo rango: dividir en semanas y cargar progresivamente ─────────
        const chunks = splitEnSemanas(startDate.value, endDate.value);
        chunkProgress.value = { current: 0, total: chunks.length };

        for (const chunk of chunks) {
          if (signal.aborted) break;

          const res = await fetch(buildUrl(chunk.start, chunk.end), { signal });
          if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);

          const chunkData = await res.json();
          // Agregar al rawData existente → el usuario ve datos parciales
          rawData.value = [...rawData.value, ...chunkData];
          chunkProgress.value.current++;
        }
      }

      initialLoadDone = true;
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Request cancelado — se lanzó uno más reciente");
        return;
      }
      console.error("Error al obtener el reporte:", err);
      errorMsg.value = "Error al cargar el reporte. Intenta de nuevo.";
      rawData.value = [];
    } finally {
      if (!abortController.value?.signal.aborted) {
        loading.value = false;
        chunkProgress.value = { current: 0, total: 0 };
      }
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
    const vistos = new Set();
    return filteredReport.value.filter((item) => {
      if (item.tipo !== "LOG CRUDO") return true;
      const key = `${item.empleado}_${item.fecha}`;
      if (vistos.has(key)) return false;
      vistos.add(key);
      return true;
    });
  });

  // ─── Descarga Excel ──────────────────────────────────────────────────────────

  const downloadReport = async () => {
    const datos = filteredReport.value;
    if (datos.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    loading.value = true;

    const formatHora = (value) => {
      if (!value || value === "N/A" || value === "null") return "N/A";
      try {
        const partes = value.split(" ");
        if (partes.length < 2) return value;
        const [hh, mm, ss] = partes[1].split(":");
        return `${hh}:${mm}:${ss}`;
      } catch {
        return value;
      }
    };

    try {
      const dataFiltrada = datos.map((item) => ({
        Colaborador: item.empleado,
        Cedula: item.cc || "N/A",
        Departamento: item.department_id,
        Fecha: item.fecha,
        Entrada: formatHora(item.check_in),
        Salida: formatHora(item.check_out),
        Estatus_Entrada: item.c_entrada || "N/A",
        Estatus_Salida: item.c_salida || "N/A",
        Estado: item.estado,
      }));

      const response = await fetch(`${API_BASE_URL}/reports/asistencias/export`, {
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
    paginatedData,
    totalPages,
    currentPage,
    itemsPerPage,
  };
}
