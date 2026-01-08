// src/composables/useInactividad.js
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

export function useInactividad(tiempoMinutos = 5) {
  const router = useRouter();
  let timer = null;

  const tiempoMilisegundos = tiempoMinutos * 60 * 1000;

  const logout = () => {
    console.warn("Sesión cerrada por inactividad");
    localStorage.clear();
    sessionStorage.clear();
    router.push('/login');
    // Si quieres que refresque para limpiar el estado de Vuex/Pinia:
    // window.location.reload(); 
  };

  const resetTimer = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(logout, tiempoMilisegundos);
  };

  onMounted(() => {
    // Eventos que se consideran "actividad"
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);
    
    // Iniciar el temporizador al montar el componente
    resetTimer();
  });

  onUnmounted(() => {
    // Limpiar eventos y timer al salir para evitar fugas de memoria
    window.removeEventListener('mousemove', resetTimer);
    window.removeEventListener('keydown', resetTimer);
    window.removeEventListener('click', resetTimer);
    window.removeEventListener('scroll', resetTimer);
    if (timer) clearTimeout(timer);
  });

  return { resetTimer };
}