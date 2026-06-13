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
      // Una sola petición con todo el rango para que el backend pueda
      // emparejar correctamente los punches de turnos nocturnos que cruzan
      // la medianoche sin que el corte de chunks rompa los pares.
      const res = await fetch(
        buildUrl(
          filterHoy.value ? null : startDate.value,
          filterHoy.value ? null : endDate.value,
        ),
        { signal },
      );
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
      rawData.value = await res.json();

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
    const datos = [...filteredReport.value].sort((a, b) =>
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
            _sortKey: fechaSalida,
          });
        }
      }

      // Re-ordenar descendente por fecha incluyendo las filas extras
      dataFiltrada.sort((a, b) => b._sortKey.localeCompare(a._sortKey));
      dataFiltrada.forEach((r) => delete r._sortKey);

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
