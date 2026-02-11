<template>
  <Transition name="fade">
    <div v-if="nuevaActualizacion" 
         class="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
         style="background-color: rgba(2, 6, 23, 0.8); backdrop-filter: blur(12px);">
      
      <div class="flex flex-col items-center gap-6 p-8 rounded-3xl border shadow-2xl transition-all duration-500 max-w-sm w-full text-center"
           :class="isDark ? 'bg-slate-900 border-white/10 shadow-black' : 'bg-white border-slate-200 shadow-slate-200/50'">
        
        <div class="flex flex-col items-center gap-3">
          <div class="relative flex h-4 w-4 mb-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
          </div>
          
          <h2 class="text-xl font-black uppercase tracking-widest" :class="isDark ? 'text-white' : 'text-slate-900'">
            Nueva Versión
          </h2>
          <p class="text-xs leading-relaxed" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            Tenemos actualizaciones. Para continuar, es necesario actualizar la versión.
          </p>
        </div>

        <button @click="recargarPagina" 
                class="group flex items-center justify-center gap-3 w-full py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                :class="isDark ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-900 text-white hover:bg-blue-600'">
          <span class="text-xs font-black uppercase tracking-wider">Actualizar Ahora</span>
          <svg class="w-4 h-4 transition-transform group-hover:rotate-180 duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
useInactividad(10); 

const nuevaActualizacion = ref(false);
// Limpiamos la URL base
const API_BASE = import.meta.env.VITE_API_URL.replace('/usuarios', '');

const verificarVersion = async () => {
  try {
    const res = await fetch(`${API_BASE}/version?t=${Date.now()}`);

    // --- DETECCIÓN DE MANTENIMIENTO (Tu lógica original) ---
    if (res.url.includes('mantenimiento.html') || res.status === 503) {
      console.warn("SISTEMA EN MANTENIMIENTO: Redirigiendo...");
      window.location.reload(true);
      return;
    }

    if (!res.ok) return;

    const data = await res.json();
    const versionServidor = String(data.version).trim();
    const versionGuardada = localStorage.getItem('app_version');

    if (!versionGuardada) {
      localStorage.setItem('app_version', versionServidor);
      return;
    }

    // Activamos el bloqueo si las versiones son distintas
    if (versionServidor !== versionGuardada) {
      nuevaActualizacion.value = true;
    }
    
  } catch (e) {
    console.error("Error conectando al servidor de versiones");
  }
};

const recargarPagina = async () => {
  try {
    const res = await fetch(`${API_BASE}/version?t=${Date.now()}`);
    if (res.url.includes('mantenimiento.html')) {
      window.location.reload(true);
      return;
    }
    const data = await res.json();
    
    // 1. Guardamos la nueva versión
    localStorage.setItem('app_version', String(data.version).trim());

    // 2. CERRAMOS SESIÓN (Borra lo que uses para el login)
    localStorage.removeItem('user_session'); 
    localStorage.removeItem('token');

    // 3. Recarga total al login para limpiar memoria
    window.location.href = '/login'; 
  } catch (e) {
    localStorage.removeItem('user_session');
    window.location.reload(true);
  }
};

onMounted(() => {
  verificarVersion();
  setInterval(verificarVersion, 30000); 
});
</script>

<style scoped>
/* Transición simple para asegurar que se vea */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>