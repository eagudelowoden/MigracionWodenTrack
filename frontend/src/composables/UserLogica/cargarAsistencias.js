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
  const itemsPerPage = ref(10); // Lotes de 10 para diseño compacto
  // Variable para el switch de "Hoy"
  const filterHoy = ref(true);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Computed para obtener solo la porción de datos que se debe mostrar
  const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return reportData.value.slice(start, end);
  });

  // Calcular total de páginas
  const totalPages = computed(() =>
    Math.ceil(reportData.value.length / itemsPerPage.value),
  );

  // Resetear página cuando cambie la compañía o búsqueda
  watch([selectedCompany, reportData], () => {
    currentPage.value = 1;
  });

  // ... dentro de useCargarAsistencias ...
  const fetchReporte = async (companyOverride = null) => {
    loading.value = true;

    // Si el parámetro es un evento (clic), lo ignoramos
    const isEvent =
      companyOverride instanceof Event ||
      (companyOverride && companyOverride.target);
    const actualCompany = isEvent ? null : companyOverride;

    try {
      const url = new URL(`${API_BASE_URL}/reporte-novedades`);

      // Aseguramos que 'hoy' sea un string "true" o "false"
      const soloHoy = filterHoy.value === true || filterHoy.value === "true";
      url.searchParams.append("hoy", soloHoy.toString());

      // Prioridad: 1. Parámetro manual, 2. Variable reactiva del componente
      const companyToFilter = actualCompany || selectedCompany.value;

      if (companyToFilter && typeof companyToFilter === "string") {
        url.searchParams.append("company", companyToFilter);
      }

      // Cache breaker
      url.searchParams.append("_t", Date.now().toString());

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Error en servidor");

      const data = await res.json();
      reportData.value = data;
    } catch (err) {
      console.error("Fallo al traer reporte:", err);
    } finally {
      loading.value = false;
    }
  };

  // Escuchar cambios en filterHoy para recargar automáticamente
  watch(filterHoy, () => {
    fetchReporte();
  });
  watch(selectedCompany, () => {
    fetchReporte();
  });

  const clearFilters = () => {
    search.value = "";
    selectedDepartment.value = "";
    startDate.value = "";
    endDate.value = "";
    filterHoy.value = false; // Al limpiar filtros, permitimos ver todo
    selectedCompany.value = ""; // Limpiar compañía
  };

  const departments = computed(() => {
    const allDeps = reportData.value
      .map((item) => item.department_id)
      .filter(Boolean);
    return [...new Set(allDeps)].sort();
  });

  const filteredReport = computed(() => {
    return reportData.value.filter((item) => {
      const s = search.value.toLowerCase();

      const matchesSearch =
        !search.value ||
        item.empleado.toLowerCase().includes(s) ||
        item.estado.toLowerCase().includes(s);

      const matchesDept =
        !selectedDepartment.value ||
        String(item.department_id) === String(selectedDepartment.value);

      const itemDate = item.fecha;
      const matchesDate =
        (!startDate.value || itemDate >= startDate.value) &&
        (!endDate.value || itemDate <= endDate.value);

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
     * Función para ajustar la fecha UTC de Odoo a la hora local de Colombia (UTC-5)
     * Esto elimina el desfase de 5 horas en el Excel.
     */
    const ajustarHoraLocal = (fechaUTC) => {
      if (!fechaUTC || fechaUTC === "N/A" || fechaUTC === "null") return "N/A";
      try {
        // Forzamos la interpretación como UTC agregando el sufijo
        const fecha = new Date(fechaUTC.replace(/-/g, "/") + " UTC");
        return fecha.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
      } catch (e) {
        console.error("Error al transformar fecha:", e);
        return fechaUTC;
      }
    };

    try {
      // 1. Mapeamos los datos para el envío, corrigiendo el desfase horario
      const dataFiltrada = filteredReport.value.map((item) => ({
        Colaborador: item.empleado,
        Departamento: item.department_id,
        Fecha: item.fecha,
        Entrada: ajustarHoraLocal(item.check_in),
        Salida: ajustarHoraLocal(item.check_out),
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

      // 3. Procesar la descarga del archivo Blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // 4. Construcción del nombre del archivo
      const ahora = new Date();
      const fechaCorta = ahora.toISOString().slice(0, 10);
      const horaCorta = ahora
        .toLocaleTimeString("es-CO", { hour12: false })
        .replace(/:/g, "-");

      // Si tienes variables de rango de fecha, las incluimos en el nombre
      const range =
        typeof startDate !== "undefined" && startDate.value
          ? `_del_${startDate.value}_al_${endDate.value || "hoy"}`
          : "";

      link.setAttribute(
        "download",
        `Reporte_Asistencias${range}_${fechaCorta}_${horaCorta}.xlsx`,
      );

      // 5. Disparar descarga y limpiar
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
    reportData: filteredReport,
    search,
    selectedDepartment,
    startDate,
    endDate,
    filterHoy, // IMPORTANTE: Exponer esta variable
    departments,
    loading,
    fetchReporte,
    downloadReport,
    clearFilters,
    selectedCompany,
  };
}
