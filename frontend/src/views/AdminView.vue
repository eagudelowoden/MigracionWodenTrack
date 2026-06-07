<template>
  <div class="admin-layout transition-colors duration-500" :class="isDark ? 'theme-dark' : 'theme-light'">

    <!-- ── Sidebar (Geist full-bleed) ──────────────────────────────────────── -->
    <aside class="relative flex flex-col transition-all duration-300 ease-out z-50 border-r"
      :style="{ backgroundColor: isDark ? '#273045' : '#ffffff' }"
      :class="[isSidebarOpen ? 'w-56' : 'w-16', isDark ? 'border-[#222938]' : 'border-slate-200']">

      <!-- Logo (compacto Vercel) -->
      <div class="relative h-11 flex items-center px-4 shrink-0 overflow-hidden border-b"
        :class="isDark ? 'border-[#273045]' : 'border-slate-200'">
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
          <div v-if="route.path === '/admin/asistencias'" class="absolute left-0 w-[2px] h-5 bg-[#3B82F6] rounded-r">
          </div>
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
          <div v-if="route.path === '/admin/mallas'" class="absolute left-0 w-[2px] h-5 bg-[#3B82F6] rounded-r"></div>
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
          <span v-if="isSidebarOpen" class="text-[10px] font-bold uppercase tracking-wide">Gestion de Horas</span>
          <div v-if="route.path === '/admin/horas-extra'" class="absolute left-0 w-[2px] h-5 bg-[#3B82F6] rounded-r">
          </div>
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
      <div v-if="employee?.isSuperAdmin" class="px-3 pb-2 space-y-1 border-t transition-colors"
        :class="isDark ? 'border-[#222938]' : 'border-[#EAEAEA]'">

        <p v-if="isSidebarOpen" class="px-2 pt-3 text-[9px] font-medium uppercase tracking-widest select-none"
          :class="isDark ? 'text-[#888888]' : 'text-[#666666]'">
          Dev Nav
        </p>

        <button @click="router.push('/super-admin')"
          class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-[11px] font-medium tracking-wide transition-all duration-150 group active:scale-[0.99]"
          :class="isDark
            ? 'text-[#888888] hover:text-white hover:bg-[#161B26]'
            : 'text-[#666666] hover:text-black hover:bg-[#FAFAFA]'">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-shield-halved text-xs transition-colors"
              :class="isDark ? 'text-[#0070f3] group-hover:text-white' : 'text-[#1e2538] group-hover:text-black'"></i>
          </div>
          <span v-if="isSidebarOpen" class="capitalize">Super Admin</span>
        </button>

        <button @click="router.push('/admin')"
          class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-[11px] font-medium tracking-wide transition-all duration-150 group active:scale-[0.99]"
          :class="isDark
            ? 'text-[#888888] hover:text-white hover:bg-[#161B26]'
            : 'text-[#666666] hover:text-black hover:bg-[#FAFAFA]'">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-user-shield text-xs transition-colors"
              :class="isDark ? 'text-[#0070f3] group-hover:text-white' : 'text-[#1e2538] group-hover:text-black'"></i>
          </div>
          <span v-if="isSidebarOpen" class="capitalize">Admin</span>
        </button>

        <button @click="router.push('/marcacion')"
          class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-[11px] font-medium tracking-wide transition-all duration-150 group active:scale-[0.99]"
          :class="isDark
            ? 'text-[#888888] hover:text-white hover:bg-[#161B26]'
            : 'text-[#666666] hover:text-black hover:bg-[#FAFAFA]'">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-fingerprint text-xs transition-colors"
              :class="isDark ? 'text-[#0070f3] group-hover:text-white' : 'text-[#1e2538] group-hover:text-black'"></i>
          </div>
          <span v-if="isSidebarOpen" class="capitalize">Marcación</span>
        </button>
      </div>

    </aside>

    <!-- ── Main ────────────────────────────────────────────────────────────── -->
    <main class="flex-1 flex flex-col min-w-0 h-full">

      <!-- Header (estilo GitHub / Vercel compacto) -->
      <header class="h-11 flex items-center justify-between px-3 shrink-0 z-40 transition-all border-b"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

        <div class="flex items-center gap-3">
          <button @click="isSidebarOpen = !isSidebarOpen" class="transition-colors p-1.5 rounded-md" :class="isDark
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


          <!-- Botones Entrada/Salida -->
          <div class="flex items-center gap-1.5">
            <button @click="handleAttendance('in')" :disabled="loading || employee?.is_inside || employee?.day_completed"
              class="btn-header-smart in group">
              <div class="icon-box-smart"><i class="fas fa-arrow-right-to-bracket"></i></div>
              <span class="hidden md:inline">Entrada</span>
            </button>
            <button @click="handleAttendance('out')" :disabled="loading || !employee?.is_inside || employee?.day_completed"
              class="btn-header-smart out group">
              <div class="icon-box-smart"><i class="fas fa-arrow-right-from-bracket"></i></div>
              <span class="hidden md:inline">Salida</span>
            </button>
          </div>
          <!-- Chip usuario con dropdown -->
          <div class="relative hidden md:block" ref="userChipRef">
            <button
              @click="showUserMenu = !showUserMenu"
              class="flex items-center gap-3 h-9 pl-2 pr-3 rounded-md border transition-all duration-150 select-none font-sans"
              :class="isDark
                ? 'bg-[#161B26] border-[#222938] hover:border-[#2A344A]'
                : 'bg-white border-[#EAEAEA] hover:border-[#D1D1D1]'">

              <div
                class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium tracking-wider uppercase border transition-colors duration-150"
                :class="isDark
                  ? 'bg-[#0B0F19] border-[#222938] text-[#E2E8F0]'
                  : 'bg-[#FAFAFA] border-[#EAEAEA] text-[#444444]'">
                {{ initial }}
              </div>

              <div class="flex flex-col justify-center text-left">
                <span class="text-[10px] tracking-wider uppercase font-medium leading-none"
                  :class="isDark ? 'text-[#888888]' : 'text-[#666666]'">
                  Hola,
                </span>
                <span class="text-[13px] font-semibold tracking-tight mt-0.5 leading-none"
                  :class="isDark ? 'text-white' : 'text-[#111111]'">
                  {{ displayName }}
                </span>
              </div>

              <i class="fas fa-chevron-down text-[8px] ml-1 transition-transform duration-150"
                :class="[isDark ? 'text-[#888888]' : 'text-slate-400', showUserMenu ? 'rotate-180' : '']"></i>
            </button>

            <!-- Dropdown -->
            <Transition name="chip-drop">
              <div v-if="showUserMenu"
                class="absolute right-0 top-full mt-1.5 w-44 rounded-lg border shadow-lg overflow-hidden z-50"
                :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

                <button @click="toggleTheme; showUserMenu = false"
                  class="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-medium transition-colors"
                  :class="isDark
                    ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'">
                  <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'" class="w-4 text-center text-[11px]"></i>
                  {{ isDark ? 'Modo claro' : 'Modo oscuro' }}
                </button>

                <div class="h-px mx-2" :class="isDark ? 'bg-[#222938]' : 'bg-slate-100'"></div>

                <button @click="logout(); showUserMenu = false"
                  class="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-medium transition-colors text-rose-500 hover:bg-rose-500/5"
                  :class="isDark ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'">
                  <i class="fas fa-arrow-right-from-bracket w-4 text-center text-[11px]"></i>
                  Cerrar sesión
                </button>

              </div>
            </Transition>
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

// ── Chip usuario dropdown ─────────────────────────────────────────────────────
const showUserMenu = ref(false);
const userChipRef = ref(null);

const handleClickOutsideChip = (e) => {
  if (showUserMenu.value && userChipRef.value && !userChipRef.value.contains(e.target))
    showUserMenu.value = false;
};

// ── Display helpers para el saludo ───────────────────────────────────────────
const displayName = computed(() => {
  const parts = employee.value?.name?.trim().split(/\s+/) ?? [];
  const raw = (parts[2] || parts[1] || parts[0] || '').toLowerCase();
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
  document.addEventListener('click', handleClickOutsideChip);
  // Fallback: si el watcher no alcanzó a disparar antes del mount
  setTimeout(() => conectarInterno(), 1500);

  try {
    const res = await fetch(`${API_URL}/sistema-config`);
    if (res.ok) Object.assign(modulosConfig, await res.json());
  } catch { }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutsideChip);
  internoSocket?.disconnect();
  clearTimeout(toastTimer);
});
</script>


<style scoped>
.chip-drop-enter-active {
  transition: opacity .15s ease, transform .15s ease;
}
.chip-drop-leave-active {
  transition: opacity .1s ease, transform .1s ease;
}
.chip-drop-enter-from,
.chip-drop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

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
