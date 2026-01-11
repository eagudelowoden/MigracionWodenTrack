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

  const fetchMallasDesdeOdoo = async () => {
    try {
      isLoading.value = true;
      const response = await axios.get(`${NEST_API_URL}/usuarios/mallas`);
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
      const response = await axios.get(`${NEST_API_URL}/reports/mallas/template`, {
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
      const response = await axios.post(`${NEST_API_URL}/contracts-upload/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        uploadSuccessMessage.value = response.data.message;
        fetchMallasDesdeOdoo();
      } else {
        uploadErrors.value = response.data.errors;
      }
      showResultModal.value = true;
    } catch (error) {
      alert("Error en el servidor de carga.");
    } finally {
      isUploading.value = false;
      event.target.value = '';
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

  // IMPORTANTE: Retornar todo lo que el componente necesita usar
  return {
    mallasData, searchQuery, isLoading, isLoadingDownload,
    isUploading, uploadErrors, uploadSuccessMessage, showResultModal,
    fetchMallasDesdeOdoo, downloadMallaTemplate, handleFileUpload, filteredMallas
  };
}