import { ref, computed } from "vue";

export function useCargarAsistencias() {
  const reportData = ref([]);
  const loading = ref(false);
  const search = ref("");
  const selectedDepartment = ref("");

  const API_BASE_URL = import.meta.env.VITE_API_URL;


  /**
   * Obtiene el reporte de novedades desde el backend
   */
  const fetchReporte = async () => {
    loading.value = true;
    reportData.value = []; // Limpiamos antes de empezar
    try {
      const res = await fetch(`${API_BASE_URL}/reporte-novedades`);
      if (!res.ok) throw new Error("Error en servidor");

      const data = await res.json();
      console.log("Personas cargadas:", data.length); // Para debug
      reportData.value = data;
    } catch (err) {
      console.error("Fallo al traer reporte:", err);
    } finally {
      loading.value = false;
    }
  };
  // --- NUEVO: Obtener lista única de departamentos para el select ---
  const departments = computed(() => {
    // Ahora que el backend envía 'department_id', esto funcionará correctamente
    const allDeps = reportData.value
      .map((item) => item.department_id)
      .filter(Boolean);
    return [...new Set(allDeps)].sort();
  });

  /**
   * Filtra los datos localmente por nombre de empleado o estado
   */
  const filteredReport = computed(() => {
    return reportData.value.filter((item) => {
      // Filtro por texto (nombre o estado)
      const matchesSearch =
        !search.value ||
        item.empleado.toLowerCase().includes(search.value.toLowerCase()) ||
        item.estado.toLowerCase().includes(search.value.toLowerCase());

      // Filtro por departamento
      const matchesDept =
        !selectedDepartment.value ||
        item.department_id === selectedDepartment.value;

      return matchesSearch && matchesDept;
    });
  });

  /**
   * Lógica para descargar el Excel (puedes implementarla luego)
   */

  // ... dentro de useCargarAsistencias ...

  const downloadReport = async () => {
    // 1. Validación inicial
    if (reportData.value.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    loading.value = true; // Activamos el spinner del botón

    try {
      // 2. Preparar los datos tal cual los espera el Servicio en el Backend
      // Usamos reportData.value porque ya tiene aplicados los filtros de búsqueda y departamento
      const dataFiltrada = reportData.value.map((item) => ({
        Colaborador: item.empleado,
        Departamento: item.department_id,
        Fecha: item.fecha,
        Entrada: item.check_in,
        Salida: item.check_out,
        Estado: item.estado,
      }));

      // 3. Petición POST al nuevo endpoint del controlador
      const response = await fetch(
        `${API_BASE_URL}/reports/asistencias/export`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataFiltrada),
        }
      );

      if (!response.ok)
        throw new Error("Error al generar el archivo en el servidor");

      // 4. Recibir el Buffer como un Blob (archivo binario)
      const blob = await response.blob();

      // 5. Crear un enlace temporal para forzar la descarga en el navegador
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Nombre dinámico: si hay depto seleccionado lo incluye en el nombre
      const deptoSuffix = selectedDepartment.value
        ? `_${selectedDepartment.value}`
        : "";
      link.setAttribute("download", `Reporte_Novedades${deptoSuffix}.xlsx`);

      document.body.appendChild(link);
      link.click();

      // 6. Limpieza
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando el reporte:", error);
      alert(
        "Hubo un error al generar el reporte. Por favor, intenta de nuevo."
      );
    } finally {
      loading.value = false; // Apagamos el spinner
    }

    // 1. Preparar los datos para el Excel (limpiar nombres de columnas)
    const dataToExport = reportData.value.map((item) => ({
      Colaborador: item.empleado,
      Departamento: item.department_id,
      Fecha: item.fecha,
      Entrada: item.check_in,
      Salida: item.check_out,
      Estado: item.estado,
    }));

    // 2. Crear el libro de trabajo (Workbook)

    // 3. Generar el nombre del archivo según el filtro
    const deptoNombre = selectedDepartment.value
      ? `_${selectedDepartment.value}`
      : "_Todos";
    const fileName = `Reporte_Novedades${deptoNombre}.xlsx`;
  };
  return {
    reportData: filteredReport, // Retornamos la versión filtrada
    search,
    selectedDepartment, // Exportar
    departments, // Exportar
    loading,
    fetchReporte,
    downloadReport,
  };
}
