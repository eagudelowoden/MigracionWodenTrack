import { ref, computed } from 'vue';
import axios from 'axios';

export function useMallasGeneral() {
  const mallasData = ref([]);
  const searchQuery = ref('');
  const isLoading = ref(true);
  const isLoadingDownload = ref(false);
  const isUploading = ref(false);
  const uploadErrors = ref([]);
  const uploadSuccessMessage = ref('');
  const showResultModal = ref(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const fetchMallasDesdeOdoo = async () => {
    try {
      isLoading.value = true;
      // Añadimos un timestamp para evitar caché del navegador en la petición GET
      const response = await axios.get(`${API_BASE_URL}/usuarios/mallas?t=${Date.now()}`);
      mallasData.value = response.data;
    } catch (error) {
      console.error("Error cargando mallas:", error);
    } finally {
      isLoading.value = false;
    }
  };

  const downloadMallaTemplate = async () => {
    try {
      isLoadingDownload.value = true;
      const response = await axios.get(`${API_BASE_URL}/reports/mallas/template`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fecha = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `plantilla_mallas_woden_${fecha}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('No se pudo conectar con el servidor de reportes.');
    } finally {
      isLoadingDownload.value = false;
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      isUploading.value = true;
      uploadErrors.value = [];
      uploadSuccessMessage.value = '';

      const response = await axios.post(`${API_BASE_URL}/contracts-upload/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        uploadSuccessMessage.value = response.data.message;
        
        // 1. Limpiamos la lista actual para forzar el estado de carga visual
        mallasData.value = [];
        
        // 2. Pequeña espera para asegurar que Odoo actualizó los índices
        setTimeout(async () => {
          await fetchMallasDesdeOdoo();
        }, 800); 

      } else {
        uploadErrors.value = response.data.errors || [];
      }
      showResultModal.value = true;
    } catch (error) {
      console.error("Error al subir:", error);
      alert("Error en el servidor de carga.");
    } finally {
      isUploading.value = false;
      if (event.target) event.target.value = '';
    }
  };

  const filteredMallas = computed(() => {
    if (!searchQuery.value) return mallasData.value;
    const query = searchQuery.value.toLowerCase();
    return mallasData.value.filter(persona => 
      persona.nombre?.toLowerCase().includes(query) ||
      persona.cc?.toString().includes(query) ||
      persona.malla?.toLowerCase().includes(query)
    );
  });

  return {
    mallasData,
    searchQuery,
    isLoading,
    isLoadingDownload,
    isUploading,
    uploadErrors,
    uploadSuccessMessage,
    showResultModal,
    fetchMallasDesdeOdoo,
    downloadMallaTemplate,
    handleFileUpload,
    filteredMallas
  };
}