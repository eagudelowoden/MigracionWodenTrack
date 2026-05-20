<template>
  <div class="admin-layout transition-colors duration-500" :class="isDark ? 'theme-dark' : 'theme-light'">

    <!-- ── Sidebar (Geist full-bleed) ──────────────────────────────────────── -->
    <aside class="relative flex flex-col transition-all duration-300 ease-out z-50 border-r"
      :style="{ backgroundColor: isDark ? '#161B26' : '#ffffff' }"
      :class="[isSidebarOpen ? 'w-56' : 'w-16', isDark ? 'border-[#222938]' : 'border-slate-200']">

      <!-- Logo (compacto Vercel) -->
      <div class="relative h-11 flex items-center px-4 shrink-0 overflow-hidden border-b"
        :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
        <div class="flex items-center gap-2 group cursor-default">
          <div class="w-1 h-4 bg-[#3B82F6] rounded-sm"></div>
          <div v-if="isSidebarOpen" class="flex items-baseline animate-fade-in whitespace-nowrap">
            <span class="text-[13px] font-semibold tracking-tight"
              :class="isDark ? 'text-white' : 'text-slate-900'">Woden</span>
            <span class="ml-0.5 text-[13px] font-medium text-[#3B82F6]">Track</span>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-2 space-y-1.5 mt-4 overflow-y-auto custom-scroll">

        <button v-if="employee?.isSuperAdmin || employee?.permisos?.['admin.asistencias']"
          @click="router.push('/admin/asistencias')"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden"
          :class="route.path === '/admin/asistencias'
            ? (isDark ? 'bg-white/[0.04] text-white' : 'bg-slate-100 text-slate-900')
            : (isDark ? 'text-[#888888] hover:text-white hover:bg-white/[0.03]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-user-check text-xs transition-transform group-hover:scale-110"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[10px] font-bold uppercase tracking-wide">Asistencias</span>
          <div v-if="route.path === '/admin/asistencias'"
            class="absolute left-0 w-[2px] h-5 bg-[#3B82F6] rounded-r"></div>
        </button>

        <button v-if="employee?.isSuperAdmin || employee?.permisos?.['admin.mallas']"
          @click="router.push('/admin/mallas')"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden"
          :class="route.path === '/admin/mallas'
            ? (isDark ? 'bg-white/[0.04] text-white' : 'bg-slate-100 text-slate-900')
            : (isDark ? 'text-[#888888] hover:text-white hover:bg-white/[0.03]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-cloud-arrow-up text-xs transition-transform group-hover:scale-110"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[10px] font-bold uppercase tracking-wide">Cargue Mallas</span>
          <div v-if="route.path === '/admin/mallas'"
            class="absolute left-0 w-[2px] h-5 bg-[#3B82F6] rounded-r"></div>
        </button>

        <button v-if="employee?.isSuperAdmin || employee?.permisos?.['admin.calculos']"
          @click="router.push('/admin/horas-extra')"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden"
          :class="route.path === '/admin/horas-extra'
            ? (isDark ? 'bg-white/[0.04] text-white' : 'bg-slate-100 text-slate-900')
            : (isDark ? 'text-[#888888] hover:text-white hover:bg-white/[0.03]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-clock-rotate-left text-xs transition-transform group-hover:scale-110"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[10px] font-bold uppercase tracking-wide">Horas Extra</span>
          <div v-if="route.path === '/admin/horas-extra'"
            class="absolute left-0 w-[2px] h-5 bg-[#3B82F6] rounded-r"></div>
        </button>

        <button v-if="employee?.isSuperAdmin || employee?.permisos?.['horas.ver_cargue_ch']"
          @click="router.push('/admin/cargue-horas-ch')"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden"
          :class="route.path === '/admin/cargue-horas-ch'
            ? (isDark ? 'bg-white/[0.04] text-white' : 'bg-slate-100 text-slate-900')
            : (isDark ? 'text-[#888888] hover:text-white hover:bg-white/[0.03]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-file-arrow-up text-xs transition-transform group-hover:scale-110"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[10px] font-bold uppercase tracking-wide">Cargue HX</span>
          <div v-if="route.path === '/admin/cargue-horas-ch'"
            class="absolute left-0 w-[2px] h-5 bg-[#3B82F6] rounded-r"></div>
        </button>

        <button v-if="employee?.isSuperAdmin || employee?.permisos?.['admin.novedades']"
          @click="router.push('/admin/novedades')"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden"
          :class="route.path.startsWith('/admin/novedades')
            ? (isDark ? 'bg-white/[0.04] text-white' : 'bg-slate-100 text-slate-900')
            : (isDark ? 'text-[#888888] hover:text-white hover:bg-white/[0.03]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-bullhorn text-xs transition-transform group-hover:scale-110"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[10px] font-bold uppercase tracking-wide">Novedades</span>
          <div v-if="route.path.startsWith('/admin/novedades')"
            class="absolute left-0 w-[2px] h-5 bg-[#3B82F6] rounded-r"></div>
        </button>

      </nav>

      <!-- Dev Nav: solo DESARROLLADOR -->
      <div v-if="employee?.isSuperAdmin" class="px-2 pb-1 space-y-1 border-t"
        :class="isDark ? 'border-white/5' : 'border-slate-100'">
        <p v-if="isSidebarOpen" class="px-1 pt-2 text-[8px] font-black uppercase opacity-40 tracking-widest">Dev Nav</p>
        <button @click="router.push('/super-admin')"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:bg-[#3B82F6]/20"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-shield-halved text-[#3B82F6] text-xs"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[9px] font-black uppercase tracking-wide">Super Admin</span>
        </button>
        <button @click="router.push('/admin')"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:bg-[#3B82F6]/20"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-user-shield text-[#3B82F6] text-xs"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[9px] font-black uppercase tracking-wide">Admin</span>
        </button>
        <button @click="router.push('/marcacion')"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:bg-[#3B82F6]/20"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-fingerprint text-[#3B82F6] text-xs"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[9px] font-black uppercase tracking-wide">Marcación</span>
        </button>
      </div>

      <!-- Acciones footer -->
      <div class="p-2 space-y-1 mt-auto border-t" :class="isDark ? 'border-white/5' : 'border-slate-100'">
        <button @click="toggleTheme"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-blue-500 transition-all">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'" class="text-xs"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[9px] font-black uppercase tracking-widest">{{ isDark ? 'Luz' :
            'Oscuro' }}</span>
        </button>
        <button @click="logout"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 transition-all">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-power-off text-xs"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[9px] font-black uppercase tracking-widest">Salir</span>
        </button>
      </div>
    </aside>

    <!-- ── Main ────────────────────────────────────────────────────────────── -->
    <main class="flex-1 flex flex-col min-w-0 h-full">

      <!-- Header (estilo GitHub / Vercel compacto) -->
      <header class="h-11 flex items-center justify-between px-3 shrink-0 z-40 transition-all border-b"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

        <div class="flex items-center gap-3">
          <button @click="isSidebarOpen = !isSidebarOpen"
            class="transition-colors p-1.5 rounded-md"
            :class="isDark
              ? 'text-[#888888] hover:text-white hover:bg-white/[0.03]'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'">
            <i class="fas fa-bars text-[13px]"></i>
          </button>

          <div v-if="allCompanies.length > 0"
            class="flex items-center gap-2 px-2.5 h-7 rounded-md transition-all min-w-[220px] border focus-within:border-[#3B82F6] focus-within:ring-1 focus-within:ring-[#3B82F6]"
            :class="isDark
              ? 'bg-[#0B0F19] border-[#222938]'
              : 'bg-slate-50 border-slate-200 hover:border-slate-300'">
            <i class="fas fa-building text-[#3B82F6] text-[10px]"></i>
            <select v-model="selectedCompany"
              class="flex-1 bg-transparent text-[11px] font-medium outline-none cursor-pointer appearance-none transition-colors"
              :class="isDark ? 'text-white' : 'text-slate-800'">
              <option v-for="comp in allCompanies" :key="comp.id" :value="comp.name"
                :class="isDark ? 'bg-[#161B26] text-white' : 'bg-white text-slate-800'">
                {{ comp.name }}
              </option>
            </select>
            <i class="fas fa-chevron-down text-[8px]" :class="isDark ? 'text-[#888888]' : 'text-slate-400'"></i>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Saludo con avatar circular + status dot (Vercel style) -->
          <div class="hidden md:flex items-center gap-2.5 h-8 pl-2 pr-3 rounded-full border transition-all"
            :class="isDark
              ? 'bg-[#0B0F19] border-[#222938] hover:border-[#3B82F6]/40'
              : 'bg-slate-50 border-slate-200 hover:border-slate-300'">
            <!-- Avatar con inicial + status dot online -->
            <div class="relative">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
                style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);">
                {{ initial }}
              </div>
              <!-- Punto verde online -->
              <div class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#16a34a]"
                :class="isDark ? 'ring-2 ring-[#0B0F19]' : 'ring-2 ring-slate-50'"></div>
            </div>
            <!-- Texto -->
            <div class="flex flex-col leading-none">
              <span class="text-[9px] font-medium"
                :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Hola,</span>
              <span class="text-[12px] font-semibold mt-0.5"
                :class="isDark ? 'text-white' : 'text-slate-900'">
                {{ displayName }}
              </span>
            </div>
          </div>

          <!-- Botones Entrada/Salida -->
          <div class="flex items-center gap-1.5">
            <button @click="handleAttendance" :disabled="loading || employee?.is_inside || employee?.day_completed"
              class="btn-header-smart in group">
              <div class="icon-box-smart"><i class="fas fa-arrow-right-to-bracket"></i></div>
              <span class="hidden md:inline">Entrada</span>
            </button>
            <button @click="handleAttendance" :disabled="loading || !employee?.is_inside || employee?.day_completed"
              class="btn-header-smart out group">
              <div class="icon-box-smart"><i class="fas fa-arrow-right-from-bracket"></i></div>
              <span class="hidden md:inline">Salida</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Contenido — router-view con props compartidos -->
      <div class="flex-1 p-4 overflow-hidden font-round-custom custom-scroll"
        :style="{ backgroundColor: isDark ? '#0B0F19' : '#f8fafc' }">

        <!-- Mantenimiento del módulo activo -->
        <div v-if="moduleKeyFromRoute && !moduloActivo(moduleKeyFromRoute)"
          class="h-full flex items-center justify-center animate-fade-in">
          <div class="text-center max-w-sm">
            <div class="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              :class="isDark ? 'bg-white/5' : 'bg-slate-100'">
              <i class="fas fa-wrench text-2xl text-[#3B82F6]"></i>
            </div>
            <h3 class="text-sm font-black uppercase tracking-tight mb-2"
              :class="isDark ? 'text-white' : 'text-slate-800'">Módulo en mantenimiento</h3>
            <p class="text-[11px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
              {{ modulosConfig[`module_${moduleKeyFromRoute}_message`] }}
            </p>
          </div>
        </div>

        <!-- Módulo activo — keep-alive preserva datos y filtros al cambiar de ruta -->
        <router-view v-else v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" :isDark="isDark" :company="selectedCompany" />
          </keep-alive>
        </router-view>

      </div>
    </main>

    <!-- Widget mensajes internos — deshabilitado temporalmente -->

    <!-- ── Toast recordatorio automático ─────────────────────────────────────── -->
    <transition name="fade">
      <div v-if="toastRecordatorio" class="fixed top-5 right-5 z-50 w-80 rounded-2xl border shadow-2xl overflow-hidden"
        :class="isDark ? 'bg-[#161B26] border-violet-500/30' : 'bg-white border-violet-200'">
        <div class="h-1 bg-gradient-to-r from-violet-500 to-blue-500"></div>
        <div class="px-4 py-3 flex items-start gap-3">
          <div class="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <i class="fas fa-bell text-violet-500 text-sm"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[10px] font-black uppercase tracking-wider text-violet-500 mb-0.5">
              🔔 Recordatorio · {{ toastRecordatorio.hora }}
            </div>
            <div class="text-[11px] font-semibold mb-0.5" :class="isDark ? 'text-white' : 'text-slate-800'">
              {{ toastRecordatorio.titulo }}
            </div>
            <div class="text-[10px] opacity-60 leading-relaxed" :class="isDark ? 'text-white' : 'text-slate-600'">
              {{ toastRecordatorio.mensaje }}
            </div>
          </div>
          <button @click="toastRecordatorio = null"
            class="shrink-0 w-5 h-5 rounded flex items-center justify-center opacity-30 hover:opacity-70 transition-all"
            :class="isDark ? 'text-white' : 'text-slate-500'">
            <i class="fas fa-xmark text-[10px]"></i>
          </button>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, provide, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { adminOdoo } from '../composables/adminLogica/adminOdoo.js';
import { io } from 'socket.io-client';
import '../assets/css/admin-style.css';

const router = useRouter();
const route = useRoute();

const {
  employee,
  loading,
  isSidebarOpen,
  handleAttendance,
  logout,
  isDark,
  toggleTheme,
  allCompanies,
  selectedCompany,
} = adminOdoo();

// Expone employee a las vistas hijas (NovedadesPanelView lo inyecta)
provide('adminEmployee', employee);

// ── Display helpers para el saludo ───────────────────────────────────────────
const displayName = computed(() => {
  const raw = employee.value?.name?.split(' ')[2]?.toLowerCase();
  if (!raw) return 'Usuario';
  return raw.replace(/^\w/, c => c.toUpperCase());
});

const initial = computed(() => {
  const n = displayName.value;
  return n ? n.charAt(0).toUpperCase() : 'U';
});

// ── Config de módulos (mantenimiento) ─────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL;

const modulosConfig = reactive({
  module_asistencias_active: 'true',
  module_asistencias_message: 'Módulo en mantenimiento. Vuelve pronto.',
  module_calculos_active: 'true',
  module_calculos_message: 'Módulo en mantenimiento. Vuelve pronto.',
  module_mallas_active: 'true',
  module_mallas_message: 'Módulo en mantenimiento. Vuelve pronto.',
  module_novedades_active: 'true',
  module_novedades_message: 'Módulo en mantenimiento. Vuelve pronto.',
});

const moduloActivo = (key) => modulosConfig[`module_${key}_active`] === 'true';

// Mapea la ruta activa → clave de config
const moduleKeyFromRoute = computed(() => {
  const p = route.path;
  if (p.includes('/asistencias')) return 'asistencias';
  if (p.includes('/mallas')) return 'mallas';
  if (p.includes('/horas-extra')) return 'calculos';
  if (p.includes('/novedades')) return 'novedades';
  return null;
});

// ── WebSocket sesión interna ──────────────────────────────────────────────────
const WS_URL = (API_URL || '').replace('/usuarios', '') || 'http://localhost:3000';
let internoSocket = null;
const mensajesNoLeidos = ref([]);
const mostrarBandeja = ref(false);
const socketConectado = ref(false);
const toastRecordatorio = ref(null);
let toastTimer = null;

const conectarInterno = () => {
  if (internoSocket) return;
  const idOdoo = employee.value?.id_odoo;
  const nombre = employee.value?.name;
  if (!idOdoo) return;

  internoSocket = io(`${WS_URL}/interno`, { transports: ['websocket'] });
  internoSocket.on('connect', () => {
    socketConectado.value = true;
    internoSocket.emit('join', { idOdoo, nombre });
  });
  internoSocket.on('disconnect', () => { socketConectado.value = false; });
  internoSocket.on('new-message', (msg) => {
    if (msg.para_id_odoo === idOdoo || msg.para_id_odoo === null) {
      mensajesNoLeidos.value.unshift(msg);
    }
  });
  internoSocket.on('reminder', (data) => {
    toastRecordatorio.value = data;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastRecordatorio.value = null; }, 8000);
  });
  internoSocket.on('force-disconnect', () => {
    internoSocket.disconnect();
    logout();
  });
};

// Conectar en cuanto employee se cargue (watcher + fallback en onMounted)
watch(() => employee.value?.id_odoo, (id) => { if (id) conectarInterno(); }, { immediate: true });

onMounted(async () => {
  // Fallback: si el watcher no alcanzó a disparar antes del mount
  setTimeout(() => conectarInterno(), 1500);

  try {
    const res = await fetch(`${API_URL}/sistema-config`);
    if (res.ok) Object.assign(modulosConfig, await res.json());
  } catch { }
});

onUnmounted(() => {
  internoSocket?.disconnect();
  clearTimeout(toastTimer);
});
</script>


<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity .2s, transform .2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
