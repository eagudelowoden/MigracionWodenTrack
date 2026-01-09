<template>
  <Transition name="fade-slide">
    <div v-if="nuevaActualizacion" class="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] px-4">
      <div class="flex items-center gap-6 p-2 pl-5 rounded-full border shadow-2xl backdrop-blur-xl transition-all duration-500"
           :class="isDark ? 'bg-slate-900/80 border-white/10 shadow-black/50' : 'bg-white/80 border-slate-200 shadow-slate-200/50'">
        
        <div class="flex items-center gap-3">
          <span class="relative flex h-1.5 w-1.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
          </span>
          <span class="text-[9px] font-bold uppercase tracking-[0.2em]" 
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            Nueva Versión
          </span>
        </div>

        <button @click="recargarPagina" 
                class="group flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300"
                :class="isDark ? 'bg-white text-black hover:bg-blue-500 hover:text-white' : 'bg-slate-900 text-white hover:bg-blue-600'">
          <span class="text-[9px] font-black uppercase tracking-wider">Actualizar</span>
          <svg class="w-3 h-3 transition-transform group-hover:rotate-180 duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>

  <router-view />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useInactividad } from './composables/useInactividad';
import { useAttendance } from './composables/UserLogica/useAttendance.js';

const { isDark } = useAttendance();
useInactividad(10); // Ajustado a 10 min

const nuevaActualizacion = ref(false);
const API_BASE = import.meta.env.VITE_API_URL.replace('/usuarios', '');

const verificarVersion = async () => {
  try {
    const res = await fetch(`${API_BASE}/version?t=${Date.now()}`);

    // --- DETECCIÓN DE MANTENIMIENTO ---
    // Si el IIS redirige al html de mantenimiento, la URL de respuesta cambiará.
    // O si el servidor responde con 503 (Service Unavailable).
    if (res.url.includes('mantenimiento.html') || res.status === 503) {
      console.warn("SISTEMA EN MANTENIMIENTO: Redirigiendo...");
      window.location.reload(true);
      return;
    }

    if (!res.ok) return;

    // --- LÓGICA DE ACTUALIZACIÓN ---
    const data = await res.json();
    const versionServidor = String(data.version).trim();
    const versionGuardada = localStorage.getItem('app_version');

    if (!versionGuardada) {
      localStorage.setItem('app_version', versionServidor);
      return;
    }

    // Si los datos son diferentes, mostramos el banner
    nuevaActualizacion.value = (versionServidor !== versionGuardada);
    
  } catch (e) {
    console.error("Error conectando al servidor de versiones o sistema offline");
  }
};

const recargarPagina = async () => {
  try {
    const res = await fetch(`${API_BASE}/version?t=${Date.now()}`);
    // Si al intentar actualizar ya está en mantenimiento, recarga y sale
    if (res.url.includes('mantenimiento.html')) {
      window.location.reload(true);
      return;
    }
    const data = await res.json();
    localStorage.setItem('app_version', String(data.version).trim());
    window.location.reload(true);
  } catch (e) {
    window.location.reload();
  }
};

onMounted(() => {
  verificarVersion();
  // Revisar cada 30 segundos garantiza que el mantenimiento se detecte rápido
  setInterval(verificarVersion, 30000); 
});
</script>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px) scale(0.95);
}
</style>