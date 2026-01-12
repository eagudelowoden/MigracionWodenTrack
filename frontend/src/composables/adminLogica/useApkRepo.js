import { ref } from 'vue';

export function useApkRepo() {
  const apkData = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Limpieza segura de la URL
  const rawUrl = import.meta.env.VITE_API_URL || '';
  const API_URL = rawUrl.replace('/usuarios', ''); 

  const fetchApkInfo = async () => {
    loading.value = true;
    error.value = null;
    try {
      // Agregamos un log para ver qué URL está intentando llamar en la consola (F12)
      console.log("Llamando a:", `${API_URL}/apk/info`);
      
      const response = await fetch(`${API_URL}/apk/info`);
      
      if (!response.ok) throw new Error('Error al obtener información del servidor');
      
      apkData.value = await response.json();
    } catch (err) {
      error.value = err.message;
      console.error("Error fetchApkInfo:", err);
    } finally {
      loading.value = false;
    }
  };

  const descargarApk = () => {
    window.location.href = `${API_URL}/apk/download`;
  };

  // Funciones para SuperAdmin
  const subirApk = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/apk/upload`, {
      method: 'POST',
      body: formData
    });
    return await res.json();
  };

  const guardarNovedades = async (notes) => {
    const res = await fetch(`${API_URL}/apk/changelog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
    return await res.json();
  };

  return {
    apkData,
    loading,
    error,
    fetchApkInfo,
    descargarApk,
    subirApk,
    guardarNovedades
  };
}