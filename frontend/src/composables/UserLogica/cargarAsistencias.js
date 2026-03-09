import { ref, computed, watch } from "vue";

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
  watch(
    [
      search,
      selectedDepartment,
      startDate,
      endDate,
      filterHoy,
      selectedCompany,
      selectedArea,
      selectedSegmento,
    ],
    (
      [newSearch, newDept, newStart, newEnd, newHoy],
      [oldSearch, oldDept, oldStart, oldEnd, oldHoy],
    ) => {
      // 1. Reset de página si cambian filtros
      currentPage.value = 1;

      // 2. Lógica de "Hoy" vs Fechas Manuales
      // Evitamos el bucle infinito: solo cambiamos filterHoy si realmente hubo un cambio de fecha manual
      if (
        newHoy &&
        (newStart !== oldStart || newEnd !== oldEnd) &&
        (newStart || newEnd)
      ) {
        filterHoy.value = false;
        return; // El cambio de filterHoy disparará este watch de nuevo, ahí se hará el fetch
      }

      // 3. OPTIMIZACIÓN: No llamar a la API si solo cambió el "search" o "departamento"
      // porque esos ya los filtras en el FRONTEND con el computed 'filteredReport'
      if (newSearch !== oldSearch || newDept !== oldDept) {
        return; // No hace falta ir al servidor para filtrar por nombre si ya tenemos la data
      }

      // 4. Ejecución de la petición (Solo para cambios que requieren nueva data de Odoo/DB)
      fetchReporte();
    },
    { deep: true },
  );
  const fetchReporte = async () => {
    loading.value = true;
    try {
      const url = new URL(`${API_BASE_URL}/reporte-novedades`);

      // 1. Parámetros de tiempo
      url.searchParams.append("hoy", filterHoy.value.toString());
      if (startDate.value)
        url.searchParams.append("startDate", startDate.value);
      if (endDate.value) url.searchParams.append("endDate", endDate.value);

      // 2. Parámetros de organización
      if (selectedCompany.value && selectedCompany.value !== "Todas") {
        url.searchParams.append("company", selectedCompany.value);
      }

      if (selectedSegmento.value) {
        url.searchParams.append("segmento_id", selectedSegmento.value);
      }

      // 3. Lógica de Filtrado Local Estricto
      if (selectedArea.value) {
        // Prioridad 1: Tenemos el área exacta de la DB local
        url.searchParams.append("area_id", selectedArea.value);
      } else if (
        selectedDepartment.value &&
        selectedDepartment.value !== "DEPARTAMENTOS"
      ) {
        /**
         * Prioridad 2: No hay área manual, pero hay departamento.
         * Mandamos el flag 'solo_con_area' para que el Backend (NestJS)
         * filtre los empleados del departamento contra la tabla local de usuarios.
         */
        url.searchParams.append("solo_con_area", "true");
        // url.searchParams.append("departamento", selectedDepartment.value);
      }

      // 4. Petición
      const res = await fetch(url.toString());

      if (!res.ok) throw new Error("Error en la respuesta del servidor");

      const data = await res.json();

      // 5. Asignación de datos
      rawData.value = data;
    } catch (err) {
      console.error("Error al obtener el reporte:", err);
      rawData.value = []; // Limpiamos datos en caso de error
    } finally {
      loading.value = false;
    }
  };

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
        Cédula: item.doc_number || "N/A",
        Departamento: item.department_id,
        Fecha: item.fecha, // "2026-03-09"
        Entrada: formatHoraParaExcel(item.check_in), // "10:09:51 AM"
        Salida: formatHoraParaExcel(item.check_out), // "06:05:20 PM"
        Estatus_Entrada: item.c_entrada || "N/A",
        Estatus_Salida: item.c_salida || "N/A",
        Estado: item.estado,
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
  };
}
