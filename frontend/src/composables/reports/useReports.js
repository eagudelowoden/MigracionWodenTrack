import axios from "axios";
import { ref } from "vue";

export function useReports() {
  const isDownloading = ref(false);
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const downloadMallaTemplate = async () => {
    try {
      isDownloading.value = true;
      const response = await axios.get(
        `${API_BASE_URL}/reports/mallas/template`,
        {
          responseType: "blob",
          timeout: 30000, // 30 segundos de espera
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const fecha = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `plantilla_mallas_${fecha}.xlsx`);

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar la plantilla:", error);
      alert(
        "Error: No se pudo conectar con el servidor para generar el Excel."
      );
    } finally {
      isDownloading.value = false;
    }
  };

  return {
    downloadMallaTemplate,
    isDownloading,
  };
}
