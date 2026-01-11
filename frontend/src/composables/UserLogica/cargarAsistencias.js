import { ref, computed } from "vue";

export function useCargarAsistencias() {
  const reportData = ref([]);
  const loading = ref(false);
  const search = ref("");

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

  /**
   * Filtra los datos localmente por nombre de empleado o estado
   */
  const filteredReport = computed(() => {
    if (!search.value) return reportData.value;
    const s = search.value.toLowerCase();
    return reportData.value.filter(
      (item) =>
        item.empleado.toLowerCase().includes(s) ||
        item.estado.toLowerCase().includes(s)
    );
  });

  /**
   * Lógica para descargar el Excel (puedes implementarla luego)
   */
  const downloadReport = () => {
    if (reportData.value.length === 0) return;
    console.log("Generando reporte de novedades...");
    // Aquí podrías usar una librería como XLSX o llamar a un endpoint de descarga
  };

  return {
    reportData: filteredReport, // Retornamos la versión filtrada
    search,
    loading,
    fetchReporte,
    downloadReport,
  };
}
