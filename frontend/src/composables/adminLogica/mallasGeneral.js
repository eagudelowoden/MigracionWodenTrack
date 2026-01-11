// src/composables/adminLogica/mallasGeneral.js
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

  const NEST_API_URL = 'http://localhost:8082';

  // --- Obtener Datos ---
  const fetchMallasDesdeOdoo = async () => {
    try {
      isLoading.value = true;
      const response = await axios.get(`${NEST_API_URL}/usuarios/mallas?t=${Date.now()}`);
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
      const response = await axios.get(`${NEST_API_URL}/reports/mallas/template`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `plantilla_mallas_woden_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error al descargar plantilla');
    } finally {
      isLoadingDownload.value = false;
    }
  };

  // --- Subir Archivo ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      isUploading.value = true;
      uploadErrors.value = [];
      const response = await axios.post(`${NEST_API_URL}/contracts-upload/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        uploadSuccessMessage.value = response.data.message;
        mallasData.value = []; // Limpiamos para efecto visual
        setTimeout(() => fetchMallasDesdeOdoo(), 1000);
      } else {
        uploadErrors.value = response.data.errors || [];
      }
      showResultModal.value = true;
    } catch (error) {
      alert("Error en el servidor de carga.");
    } finally {
      isUploading.value = false;
      if (event.target) event.target.value = '';
    }
  };

  // --- Filtro ---
  const filteredMallas = computed(() => {
    if (!searchQuery.value) return mallasData.value;
    const query = searchQuery.value.toLowerCase();
    return mallasData.value.filter(p => 
      p.nombre?.toLowerCase().includes(query) ||
      p.cc?.toString().includes(query) ||
      p.malla?.toLowerCase().includes(query)
    );
  });

  // Retornamos TODO lo que el template necesita tocar
  return {
    mallasData, searchQuery, isLoading, isLoadingDownload,
    isUploading, uploadErrors, uploadSuccessMessage, showResultModal,
    fetchMallasDesdeOdoo, downloadMallaTemplate, handleFileUpload, filteredMallas
  };
}