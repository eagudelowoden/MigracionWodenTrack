<template>
  <Transition name="slide-down">
    <div v-if="anuncioSuperior"
      class="fixed top-0 left-0 right-0 z-[10000] h-12 flex items-center justify-center px-6 shadow-2xl border-b backdrop-blur-md"
      :class="isDark ? 'bg-red-700/95 border-red-500 text-white' : 'bg-red-600 border-red-700 text-white'">

      <div class="flex items-center gap-4 w-full max-w-7xl justify-center">
        <i class="fas fa-exclamation-circle text-lg animate-pulse"></i>

        <p class="text-[14px] font-bold tracking-wide leading-none font-sans italic">
          {{ anuncioSuperior.body }}
        </p>

        <button @click="anuncioSuperior = null"
          class="ml-6 bg-black/20 hover:bg-black/40 h-8 w-8 rounded-full transition-all flex items-center justify-center group">
          <i class="fas fa-times text-sm group-hover:scale-110"></i>
        </button>
      </div>
    </div>
  </Transition>

  <Transition name="fade">
    <div v-if="nuevaActualizacion" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
      style="background-color: rgba(2, 6, 23, 0.85); backdrop-filter: blur(12px);">
      <div class="flex flex-col items-center gap-6 p-8 rounded-3xl border shadow-2xl max-w-sm w-full text-center"
        :class="isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'">
        <div class="flex flex-col items-center gap-3">
          <div class="h-4 w-4 rounded-full bg-blue-500 animate-ping"></div>
          <h2 class="text-xl font-black uppercase tracking-widest" :class="isDark ? 'text-white' : 'text-slate-900'">
            Nueva Versión</h2>
          <p class="text-xs leading-relaxed" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Hay cambios en el
            sistema. Es necesario reiniciar para continuar.</p>
        </div>
        <button @click="recargarPagina"
          class="w-full py-4 rounded-2xl bg-blue-600 text-white font-black uppercase text-xs tracking-wider hover:bg-blue-500 transition-all">
          Actualizar Ahora
        </button>
      </div>
    </div>
  </Transition>

  <Transition name="slide-up">
    <div v-if="anuncioInferior"
      class="fixed bottom-8 right-8 z-[9998] max-w-xs w-full p-4 rounded-2xl border shadow-2xl flex gap-4 transition-all"
      :class="isDark ? 'bg-slate-900 border-indigo-500/30 text-white' : 'bg-white border-slate-200 text-slate-800'">
      <div class="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"><i
          class="fas fa-info-circle"></i></div>
      <div class="flex-1 overflow-hidden">
        <h4 class="text-[10px] font-black uppercase text-indigo-500">{{ anuncioInferior.title }}</h4>
        <p class="text-[11px] font-bold opacity-70">{{ anuncioInferior.body }}</p>
      </div>
      <button @click="anuncioInferior = null" class="opacity-20 hover:opacity-100"><i class="fas fa-times"></i></button>
    </div>
  </Transition>

  <main :class="{ 'pt-10 transition-all': anuncioSuperior }">
    <router-view />
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { io } from 'socket.io-client';
import { useInactividad } from './composables/useInactividad';
import { useAttendance } from './composables/UserLogica/useAttendance.js';

const { isDark } = useAttendance();
useInactividad(10);

const nuevaActualizacion = ref(false);
const anuncioInferior = ref(null);
const anuncioSuperior = ref(null);

const API_BASE = import.meta.env.VITE_API_URL.replace('/usuarios', '');

// --- 🔵 LÓGICA DE NOTIFICACIONES (SOCKETS) ---
const socket = io(API_BASE, { transports: ['websocket'], forceNew: true });

const cargarAnuncioActivo = async () => {
  try {
    const res = await fetch(`${API_BASE}/usuarios/notifications/active`);
    if (!res.ok) return;

    const text = await res.text(); // 👈 primero como texto
    if (!text) return;             // 👈 si está vacío, salir

    const data = JSON.parse(text); // 👈 luego parsear
    if (data && data.is_active) {
      if (data.type === 'alert') anuncioSuperior.value = data;
      else anuncioInferior.value = data;
    }
  } catch (e) {
    console.error("Error cargando anuncio:", e);
  }
};


const setupSockets = () => {
  socket.on('onNotification', (data) => {
    if (data.is_active === false) {
      anuncioSuperior.value = null;
      anuncioInferior.value = null;
      return;
    }
    if (data.type === 'alert') {
      anuncioSuperior.value = data;
    } else {
      anuncioInferior.value = data;
      setTimeout(() => { anuncioInferior.value = null; }, 15000);
    }
  });
};
// --- 🟢 LÓGICA DE VERSIÓN (HTTP POLLING) ---
const verificarVersion = async () => {
  try {
    const res = await fetch(`${API_BASE}/version?t=${Date.now()}`);
    if (res.url.includes('mantenimiento.html') || res.status === 503) {
      window.location.reload(true);
      return;
    }
    const data = await res.json();
    const versionServidor = String(data.version).trim();
    const versionGuardada = localStorage.getItem('app_version');

    if (versionGuardada && versionServidor !== versionGuardada) {
      nuevaActualizacion.value = true; // El bloqueo solo ocurre si cambia el archivo version.json
    } else if (!versionGuardada) {
      localStorage.setItem('app_version', versionServidor);
    }
  } catch (e) { console.error("Error versión"); }
};

const recargarPagina = async () => {
  try {
    const res = await fetch(`${API_BASE}/version?t=${Date.now()}`);
    const data = await res.json();
    localStorage.setItem('app_version', String(data.version).trim());
    localStorage.removeItem('user_session');
    localStorage.removeItem('token');
    window.location.href = '/login';
  } catch (e) { window.location.reload(true); }
};

onMounted(() => {
  cargarAnuncioActivo(); // 👈 Carga el activo al entrar
  verificarVersion();
  setupSockets(); // ✅ ahora existe
  setInterval(verificarVersion, 60000);
});
</script>