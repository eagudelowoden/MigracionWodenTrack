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
  // Resetear página cuando cambie la compañía o búsqueda
  watch([search, selectedDepartment, startDate, endDate, filterHoy], () => {
    currentPage.value = 1;
  });
  // OBSERVADOR CLAVE: Si el usuario toca el calendario, apagamos "Hoy" y buscamos
  // 2. Un solo observador para disparar la búsqueda
  watch(
    [startDate, endDate, filterHoy, selectedCompany],
    ([newStart, newEnd, newHoy], [oldStart, oldEnd, oldHoy]) => {
      // Si el usuario cambió una fecha manualmente, apagamos el switch de "Hoy"
      if (
        (newStart !== oldStart || newEnd !== oldEnd) &&
        (newStart || newEnd)
      ) {
        if (filterHoy.value) {
          filterHoy.value = false;
          return; // No ejecutamos fetchReporte aquí, porque el cambio de filterHoy disparará este mismo watch otra vez
        }
      }

      fetchReporte();
    },
  );
  // ... dentro de useCargarAsistencias ...
  // Dentro de useCargarAsistencias.js
  const fetchReporte = async () => {
    loading.value = true;
    try {
      const url = new URL(`${API_BASE_URL}/reporte-novedades`);
      const session = JSON.parse(localStorage.getItem("user_session") || "{}");
      const deptoUsuario = session.department || "";

      // --- PARÁMETROS ---
      url.searchParams.append("hoy", filterHoy.value.toString());

      // AGREGA ESTO: Enviar fechas si existen
      if (startDate.value)
        url.searchParams.append("start_date", startDate.value);
      if (endDate.value) url.searchParams.append("end_date", endDate.value);

      if (selectedCompany.value) {
        url.searchParams.append("company", selectedCompany.value);
      }

      const deptoAEnviar = selectedDepartment.value || deptoUsuario;
      if (deptoAEnviar && deptoAEnviar !== "DEPARTAMENTOS") {
        url.searchParams.append("departamento", deptoAEnviar);
      }

      url.searchParams.append("_t", Date.now().toString());

      const res = await fetch(url.toString());
      const data = await res.json();
      rawData.value = data;
    } catch (err) {
      console.error("Error:", err);
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
