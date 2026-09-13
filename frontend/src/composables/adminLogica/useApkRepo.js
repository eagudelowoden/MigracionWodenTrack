import { apiFetch } from '@/utils/apiFetch.js';
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
      
      const response = await apiFetch(`${API_URL}/apk/info`);
      
      if (!response.ok) throw new Error('Error al obtener información del servidor');
      
      apkData.value = await response.json();
    } catch (err) {
      error.value = err.message;
      console.error("Error fetchApkInfo:", err);
    } finally {
      loading.value = false;
    }
  };

  // Antes esto era `window.location.href = ...`: el navegador se llevaba la
  // descarga y la página perdía toda visibilidad — el usuario no sabía si
  // terminó ni dónde quedó el archivo, tocaba ir a las notificaciones.
  // Ahora la leemos por streaming para poder reportar avance y final.
  const descargando = ref(false);
  const progresoDescarga = ref(0);
  const descargaCompletada = ref(false);

  const descargarApk = async () => {
    descargando.value = true;
    progresoDescarga.value = 0;
    descargaCompletada.value = false;

    try {
      const response = await fetch(`${API_URL}/apk/download`);
      if (!response.ok) throw new Error('No se pudo descargar el archivo');

      // El backend responde con Transfer-Encoding: chunked, así que NO hay
      // Content-Length del cual sacar el porcentaje. Usamos el tamaño que ya
      // nos dio /apk/info (viene en MB) como total estimado.
      const totalBytes =
        Number(response.headers.get('Content-Length')) ||
        Number(apkData.value?.size || 0) * 1024 * 1024;

      const reader = response.body?.getReader();
      if (!reader) throw new Error('streaming no disponible');

      const chunks = [];
      let recibidos = 0;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        recibidos += value.length;
        if (totalBytes > 0) {
          progresoDescarga.value = Math.min(
            100,
            Math.round((recibidos / totalBytes) * 100)
          );
        }
      }

      const blob = new Blob(chunks, {
        type: 'application/vnd.android.package-archive',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WodenTrack-${apkData.value?.version ?? 'app'}.apk`;
      a.click();
      // Revocar de inmediato corta la descarga en algunos navegadores.
      setTimeout(() => URL.revokeObjectURL(url), 60000);

      progresoDescarga.value = 100;
      descargaCompletada.value = true;
    } catch (err) {
      error.value = err.message;
      // Respaldo: navegación directa, que el navegador se encargue como antes.
      window.location.href = `${API_URL}/apk/download`;
    } finally {
      descargando.value = false;
    }
  };

  const eliminarApk = async () => {
    const res = await apiFetch(`${API_URL}/apk`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar el APK');
    await fetchApkInfo();
    return await res.json();
  };

  // Funciones para SuperAdmin
  const subirApk = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiFetch(`${API_URL}/apk/upload`, {
      method: 'POST',
      body: formData
    });
    return await res.json();
  };

  const guardarNovedades = async (notes) => {
    const res = await apiFetch(`${API_URL}/apk/changelog`, {
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
    descargando,
    progresoDescarga,
    descargaCompletada,
    eliminarApk,
    subirApk,
    guardarNovedades
  };
}