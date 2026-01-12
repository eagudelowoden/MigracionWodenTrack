import { ref } from 'vue';

export function useApkRepo() {
  const apkData = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Obtenemos la URL base de tu .env (ej: http://localhost:3000/api)
  const API_URL = import.meta.env.VITE_API_URL.replace('/usuarios', '');

  const fetchApkInfo = async () => {
    loading.value = true;
    error.value = null;
    try {
      // Llamamos al endpoint de NestJS que creamos
      const response = await fetch(`${API_URL}/apk/info`);
      
      if (!response.ok) {
        throw new Error('No se pudo obtener la información de la APK');
      }
      
      const data = await response.json();
      apkData.value = data;
    } catch (err) {
      error.value = err.message;
      console.error("Error en APK Repo:", err);
    } finally {
      loading.value = false;
    }
  };

  const descargarApk = () => {
    // Redirigimos directamente al endpoint de descarga de NestJS
    // El navegador se encarga de gestionar la descarga gracias al StreamableFile
    window.location.href = `${API_URL}/apk/download`;
  };

  return {
    apkData,
    loading,
    error,
    fetchApkInfo,
    descargarApk
  };
}