import { ref, computed, watch } from "vue";
// import { debounce } from "lodash-es";

export function useCargarAsistencias() {
  const reportData = ref([]);
  const loading = ref(false);
  const search = ref("");
  const selectedDepartment = ref("");
  const startDate = ref("");
  const endDate = ref("");
  const selectedCompany = ref(""); // Nueva variable reactiva
  const currentPage = ref(1);
  const itemsPerPage = ref(15); // Lotes de 10 para diseño compacto
  const rawData = ref([]);
  const selectedArea = ref(null);
  const selectedSegmento = ref(null);
  // Variable para el switch de "Hoy"
  const filterHoy = ref(true);
  const abortController = ref(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Computed para obtener solo la porción de datos que se debe mostrar
  // CAMBIO AQUÍ: Usamos reportData (que es el computed filtrado del composable)
  const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return filteredReport.value.slice(start, end);
  });

  const totalPages = computed(() => {
    return Math.max(
      1,
      Math.ceil(filteredReport.value.length / itemsPerPage.value),
    );
  });
  const debounce = (fn, delay) => {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };
  let debounceTimeout = null;

  // Agrega esta bandera para controlar la carga inicial
  let initialLoadDone = false;

  // watch(
  //   [
  //     filterHoy,
  //     startDate,
  //     endDate,
  //     selectedCompany,
  //     selectedArea,
  //     selectedSegmento,
  //   ],
  //   async (newValues, oldValues) => {
  //     if (!initialLoadDone) return;

  //     const [newHoy, newStart, newEnd, newCompany] = newValues;
  //     const [oldHoy, oldStart, oldEnd] = oldValues;

  //     if (!newCompany || newCompany === "") return;

  //     if (newHoy && !oldHoy) {
  //       startDate.value = "";
  //       endDate.value = "";
  //     }

  //     if (
  //       (newStart !== oldStart || newEnd !== oldEnd) &&
  //       (newStart || newEnd) &&
  //       filterHoy.value
  //     ) {
  //       filterHoy.value = false;
  //       return;
  //     }

  //     // 👇 Si solo cambió una de las dos fechas, esperar a que completen ambas
  //     if (newStart && !newEnd) return;
  //     if (!newStart && newEnd) return;

  //     // 👇 Si cambió startDate pero endDate no ha cambiado aún, esperar
  //     if (newStart !== oldStart && newEnd === oldEnd && !newHoy) return;

  //     currentPage.value = 1;
  //     fetchReporte();
  //   },
  // );
  const fetchReporte = debounce(async () => {
    // Cancelar request anterior si aún está pendiente
    if (abortController.value) {
      abortController.value.abort();
    }
    abortController.value = new AbortController();

    loading.value = true;
    const session = JSON.parse(localStorage.getItem("user_session") || "{}");
    const permisos = session.permisos || session.permissions || {};
    const tieneFiltroDepto = permisos["admin.filtro_departamento"] === true;
    const deptoUsuario = session.department;

    try {
      const url = new URL(`${API_BASE_URL}/reporte-novedades`);
      url.searchParams.append("hoy", filterHoy.value.toString());
      if (startDate.value)
        url.searchParams.append("startDate", startDate.value);
      if (endDate.value) url.searchParams.append("endDate", endDate.value);
      if (selectedCompany.value && selectedCompany.value !== "Todas") {
        url.searchParams.append("company", selectedCompany.value);
      }
      if (selectedSegmento.value) {
        url.searchParams.append("segmento_id", selectedSegmento.value);
      }
      if (selectedArea.value) {
        url.searchParams.append("area_id", selectedArea.value);
      }

      if (tieneFiltroDepto) {
        if (selectedDepartment.value) {
          url.searchParams.append("departamento", selectedDepartment.value);
        }
      } else {
        if (deptoUsuario) {
          url.searchParams.append("departamento", deptoUsuario);
        }
      }

      console.log("URL final:", url.toString());
      const res = await fetch(url.toString(), {
        signal: abortController.value.signal, // 👈 permite cancelación
      });
      console.log("Status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error("Error en la respuesta del servidor");
      }

      const data = await res.json();
      console.log("Data length:", data.length);
      rawData.value = data;
      initialLoadDone = true;
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Request cancelado — se lanzó uno más reciente");
        return; // no limpiar datos ni mostrar error
      }
      console.error("Error al obtener el reporte:", err);
      rawData.value = [];
    } finally {
      // Solo apagar loading si este request no fue abortado
      if (!abortController.value?.signal.aborted) {
        loading.value = false;
      }
    }
  }, 600);

  const clearFilters = () => {
    search.value = "";
    selectedDepartment.value = "";
    startDate.value = "";
    endDate.value = "";
    filterHoy.value = false; // Al limpiar filtros, permitimos ver todo
    selectedCompany.value = ""; // Limpiar compañía
  };

  const departments = computed(() => {
    if (!rawData.value || rawData.value.length === 0) return [];

    const allDeps = rawData.value
      .map((item) => item.department_id)
      .filter(Boolean);

    // Quitamos duplicados y ordenamos
    return [...new Set(allDeps)].sort();
  });
  const filteredReport = computed(() => {
    const s = search.value.toLowerCase().trim();
    const d = selectedDepartment.value;
    const start = startDate.value;
    const end = endDate.value;

    return rawData.value.filter((item) => {
      const matchesSearch =
        !s ||
        String(item.empleado || "")
          .toLowerCase()
          .includes(s);
      const matchesDept =
        !d || String(item.department_id).trim() === String(d).trim();

      // Filtro de fecha local (asumiendo que item.fecha es YYYY-MM-DD)
      let matchesDate = true;
      if (start && end) {
        matchesDate = item.fecha >= start && item.fecha <= end;
      }

      return matchesSearch && matchesDept && matchesDate;
    });
  });
  const downloadReport = async () => {
    if (filteredReport.value.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    loading.value = true;

    /**
     * Extrae la hora en formato 24h (00:00:00 - 23:59:59)
     * Ideal para reportes técnicos o militares.
     */
    const formatHoraParaExcel = (value) => {
      if (!value || value === "N/A" || value === "null") return "N/A";

      try {
        // El valor de la API viene como "2026-03-09 18:09:51"
        const partes = value.split(" ");
        if (partes.length < 2) return value;

        const horaCompleta = partes[1]; // "18:09:51"
        const [hh, mm, ss] = horaCompleta.split(":");

        // Simplemente retornamos los componentes tal cual
        // Esto asegura que 6 PM sea "18:09:51"
        return `${hh}:${mm}:${ss}`;
      } catch (e) {
        return value;
      }
    };

    try {
      // 1. Mapeamos los datos enviando el TEXTO ya formateado
      const dataFiltrada = filteredReport.value.map((item) => ({
        Colaborador: item.empleado,
        Cedula: item.doc_number || "N/A", // el backend igual consulta Odoo como fallback
        Departamento: item.department_id,
        Fecha: item.fecha,
        Entrada: formatHoraParaExcel(item.check_in),
        Salida: formatHoraParaExcel(item.check_out),
        Estatus_Entrada: item.c_entrada || "N/A",
        Estatus_Salida: item.c_salida || "N/A",
        Estado: item.estado,
        // Cargo y Malla se eliminan — el backend los resuelve desde hr.employee
      }));

      // 2. Petición al servidor NestJS
      const response = await fetch(
        `${API_BASE_URL}/reports/asistencias/export`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataFiltrada),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al generar el archivo");
      }

      // 3. Procesar la descarga
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // 4. Nombre del archivo
      const ahora = new Date();
      const fechaCorta = ahora.toISOString().slice(0, 10);
      const horaCorta = ahora
        .toLocaleTimeString("es-CO", { hour12: false })
        .replace(/:/g, "-");

      const range =
        typeof startDate !== "undefined" && startDate.value
          ? `_del_${startDate.value}_al_${endDate.value || "hoy"}`
          : "";

      link.setAttribute(
        "download",
        `Reporte_Asistencias${range}_${fechaCorta}_${horaCorta}.xlsx`,
      );

      // 5. Disparar descarga
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error en descarga:", error);
      alert(`Error al descargar el reporte: ${error.message}`);
    } finally {
      loading.value = false;
    }
  };

  return {
    reportData: computed(() => filteredReport.value), // Mantenemos tu lógica de filtrado frontal
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
  };
}
