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
    return reporteParaPantalla.value.slice(start, end); // 👈 cambia aquí
  });

  const totalPages = computed(() => {
    return Math.max(
      1,
      Math.ceil(reporteParaPantalla.value.length / itemsPerPage.value), // 👈 y aquí
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
  const fetchReporte = debounce(async () => {
    if (abortController.value) {
      abortController.value.abort();
    }
    abortController.value = new AbortController();

    loading.value = true;
    const session = JSON.parse(localStorage.getItem("user_session") || "{}");
    const permisos = session.permisos || session.permissions || {};
    const tieneFiltroDepto = permisos["admin.filtro_departamento"] === true;

    try {
      const url = new URL(`${API_BASE_URL}/reporte-novedades`);
      url.searchParams.append("hoy", filterHoy.value.toString());
      if (startDate.value)
        url.searchParams.append("startDate", startDate.value);
      if (endDate.value) url.searchParams.append("endDate", endDate.value);
      if (selectedCompany.value && selectedCompany.value !== "Todas") {
        url.searchParams.append("company", selectedCompany.value);
      }

      if (tieneFiltroDepto) {
        // Admin: puede filtrar por lo que quiera
        if (selectedDepartment.value) {
          url.searchParams.append("departamento", selectedDepartment.value);
        }
        if (selectedSegmento.value) {
          url.searchParams.append("segmento_id", selectedSegmento.value);
        }
        if (selectedArea.value) {
          url.searchParams.append("area_id", selectedArea.value);
        }
        //pruebas
      } else {
        // Usuario normal: filtrar por su area_id y/o segmento_id del perfil
        // NO enviamos departamento — los permisos se aplican por estructura
        if (selectedArea.value) {
          url.searchParams.append("area_id", selectedArea.value);
        }
        if (selectedSegmento.value) {
          url.searchParams.append("segmento_id", selectedSegmento.value);
        }
      }

      console.log("URL final:", url.toString());
      const res = await fetch(url.toString(), {
        signal: abortController.value.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error("Error en la respuesta del servidor");
      }

      const data = await res.json();
      rawData.value = data;
      initialLoadDone = true;
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Request cancelado — se lanzó uno más reciente");
        return;
      }
      console.error("Error al obtener el reporte:", err);
      rawData.value = [];
    } finally {
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

    const formatHoraParaExcel = (value) => {
      if (!value || value === "N/A" || value === "null") return "N/A";
      try {
        const partes = value.split(" ");
        if (partes.length < 2) return value;
        const [hh, mm, ss] = partes[1].split(":");
        return `${hh}:${mm}:${ss}`;
      } catch (e) {
        return value;
      }
    };

    try {
      // 1. Fetch separado para Excel — pide todos los registros sin agrupar
      const session = JSON.parse(localStorage.getItem("user_session") || "{}");
      const permisos = session.permisos || session.permissions || {};
      const tieneFiltroDepto = permisos["admin.filtro_departamento"] === true;
      const deptoUsuario = session.department;

      const url = new URL(`${API_BASE_URL}/reporte-novedades`);
      url.searchParams.append("hoy", filterHoy.value.toString());
      if (startDate.value)
        url.searchParams.append("startDate", startDate.value);
      if (endDate.value) url.searchParams.append("endDate", endDate.value);
      if (selectedCompany.value && selectedCompany.value !== "Todas") {
        url.searchParams.append("company", selectedCompany.value);
      }
      if (selectedSegmento.value)
        url.searchParams.append("segmento_id", selectedSegmento.value);
      if (selectedArea.value)
        url.searchParams.append("area_id", selectedArea.value);
      if (tieneFiltroDepto) {
        if (selectedDepartment.value)
          url.searchParams.append("departamento", selectedDepartment.value);
      } else {
        if (deptoUsuario) url.searchParams.append("departamento", deptoUsuario);
      }
      // 👇 parámetro clave para que el backend no agrupe
      url.searchParams.append("agrupar", "false");

      const resRaw = await fetch(url.toString());
      const todosLosDatos = await resRaw.json();

      // 2. Mapear todos los registros para Excel
      const dataFiltrada = todosLosDatos.map((item) => ({
        Colaborador: item.empleado,
        Cedula: item.cc || "N/A",
        Departamento: item.department_id,
        Fecha: item.fecha,
        Entrada: formatHoraParaExcel(item.check_in),
        Salida: formatHoraParaExcel(item.check_out),
        Estatus_Entrada: item.c_entrada || "N/A",
        Estatus_Salida: item.c_salida || "N/A",
        Estado: item.estado,
      }));

      // 3. Enviar al backend para generar Excel
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
  };
}
