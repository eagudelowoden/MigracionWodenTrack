// src/composables/adminLogica/mallasGeneral.js
import { ref, computed } from "vue";
import axios from "axios";

export function useMallasGeneral() {
  const mallasData = ref([]);
  const searchQuery = ref("");
  const isLoading = ref(true);
  const isLoadingDownload = ref(false);
  const isUploading = ref(false);
  const uploadErrors = ref([]);
  const uploadSuccessMessage = ref("");
  const showResultModal = ref(false);
  const selectedCompany = ref(""); // <--- Nuevo: Estado para la compañía

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // --- Obtener Datos ---
  const fetchMallasDesdeOdoo = async () => {
    try {
      isLoading.value = true;
      // Construir URL con el parámetro de compañía
      let url = `${API_BASE_URL}/mallas?t=${Date.now()}`;
      if (selectedCompany.value) {
        url += `&company=${encodeURIComponent(selectedCompany.value)}`;
      }

      const response = await axios.get(url);
      mallasData.value = response.data;
    } catch (error) {
      console.error("Error cargando mallas:", error);
    } finally {
      isLoading.value = false;
    }
  };

  // --- Descargar Plantilla ---
  const downloadMallaTemplate = async () => {
    try {
      isLoadingDownload.value = true;
      const response = await axios.get(
        `${API_BASE_URL}/reports/mallas/template`,
        {
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `plantilla_mallas_woden_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Error al descargar plantilla");
    } finally {
      isLoadingDownload.value = false;
    }
  };

  // --- Subir Archivo ---
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      isUploading.value = true;
      uploadErrors.value = [];
      uploadSuccessMessage.value = "";

      const response = await axios.post(
        `${API_BASE_URL}/contracts-upload/import`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("Respuesta del servidor:", response.data); // MIRA ESTO EN LA CONSOLA (F12)

      if (response.data.success) {
        uploadSuccessMessage.value = response.data.message;
        if (typeof fetchMallasDesdeOdoo === "function") fetchMallasDesdeOdoo();
      } else {
        // Mapeo flexible: intenta leer 'fila' o 'row', 'campo' o 'field', etc.
        const rawErrors = response.data.errors || [];
        uploadErrors.value = rawErrors.map((err) => ({
          fila: err.fila || err.row || err.linea || "?",
          campo: err.campo || err.field || err.column || "General",
          error: err.error || err.message || err.err || "Error sin descripción",
        }));
      }
    } catch (error) {
      console.error("Fallo de red o servidor:", error);
      uploadErrors.value = [
        {
          fila: "!",
          campo: "RED",
          error:
            error.response?.data?.message ||
            "No se pudo conectar con el servidor.",
        },
      ];
    } finally {
      isUploading.value = false;
      showResultModal.value = true;
      if (event.target) event.target.value = "";
    }
  };

  // --- Filtro ---
  const filteredMallas = computed(() => {
    if (!searchQuery.value) return mallasData.value;
    const query = searchQuery.value.toLowerCase();
    return mallasData.value.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(query) ||
        p.cc?.toString().includes(query) ||
        p.malla?.toLowerCase().includes(query)
    );
  });

  // Retornamos TODO lo que el template necesita tocar
  return {
    mallasData,
    searchQuery,
    isLoading,
    isLoadingDownload,
    isUploading,
    uploadErrors,
    uploadSuccessMessage,
    showResultModal,
    selectedCompany,
    fetchMallasDesdeOdoo,
    downloadMallaTemplate,
    handleFileUpload,
    filteredMallas,
    filteredMallas: computed(() => {
      if (!searchQuery.value) return mallasData.value;
      const query = searchQuery.value.toLowerCase();
      return mallasData.value.filter(p => 
        p.nombre?.toLowerCase().includes(query) || 
        p.cc?.toString().includes(query)
      );
    })
  };
}


