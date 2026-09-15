// src/composables/useInactividad.js
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

/**
 * En vez de un `setTimeout` que cierra sesión en segundo plano exactamente a
 * los N minutos (sin importar qué esté haciendo el usuario en ese instante),
 * esto guarda cuándo fue la última actividad y SOLO evalúa si expiró cuando
 * el usuario efectivamente hace algo (click) o vuelve a la pestaña
 * (visibilitychange). Así:
 *  - Si el usuario sigue inactivo, no pasa nada silenciosamente en segundo
 *    plano (nada que se cruce a mitad de una acción, como un click de
 *    marcación de entrada/salida que a veces sí y a veces no alcanzaba a
 *    completarse antes de que el timer de fondo limpiara la sesión).
 *  - Si vuelve después de superar el tiempo de inactividad, se le muestra un
 *    mensaje claro ("tu sesión expiró, ingresa de nuevo") ANTES de mandarlo
 *    al login, en vez de simplemente aparecer en la pantalla de login sin
 *    explicación.
 */
export function useInactividad(tiempoMinutos = 5) {
  const router = useRouter();
  const tiempoMilisegundos = tiempoMinutos * 60 * 1000;

  let ultimaActividad = Date.now();
  const sesionExpirada = ref(false);

  const marcarActividad = () => {
    ultimaActividad = Date.now();
  };

  const expiro = () => Date.now() - ultimaActividad > tiempoMilisegundos;

  // Se llama en cada click y al volver a la pestaña: si ya expiró, corta acá
  // (antes de que el resto de los handlers del click sigan su curso) y
  // muestra el aviso; si no, simplemente cuenta como actividad nueva.
  const verificarExpiracion = (evento) => {
    if (!expiro()) {
      marcarActividad();
      return;
    }
    if (evento) {
      evento.stopImmediatePropagation();
      evento.preventDefault();
    }
    sesionExpirada.value = true;
  };

  const onVisibilidad = () => {
    if (document.visibilityState === 'visible') verificarExpiracion(null);
  };

  const cerrarAviso = () => {
    sesionExpirada.value = false;
    console.warn('Sesión cerrada por inactividad');
    localStorage.clear();
    sessionStorage.clear();
    router.push('/login');
  };

  onMounted(() => {
    marcarActividad();
    // 'click' en fase de captura: se evalúa ANTES que el handler del botón
    // que el usuario haya tocado, para poder cancelar esa acción si la
    // sesión ya expiró (evita marcar entrada/salida con sesión muerta).
    window.addEventListener('click', verificarExpiracion, true);
    window.addEventListener('keydown', marcarActividad);
    window.addEventListener('mousemove', marcarActividad);
    window.addEventListener('scroll', marcarActividad);
    document.addEventListener('visibilitychange', onVisibilidad);
  });

  onUnmounted(() => {
    window.removeEventListener('click', verificarExpiracion, true);
    window.removeEventListener('keydown', marcarActividad);
    window.removeEventListener('mousemove', marcarActividad);
    window.removeEventListener('scroll', marcarActividad);
    document.removeEventListener('visibilitychange', onVisibilidad);
  });

  return { sesionExpirada, cerrarAviso };
}
