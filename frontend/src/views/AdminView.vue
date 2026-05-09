<template>
  <div class="admin-layout transition-colors duration-500" :class="isDark ? 'theme-dark' : 'theme-light'">

    <!-- ── Sidebar ─────────────────────────────────────────────────────────── -->
    <aside class="relative flex flex-col transition-all duration-500 ease-in-out z-50 border-r"
      :style="{ backgroundColor: isDark ? '#273045' : '#ffffff' }"
      :class="[isSidebarOpen ? 'w-56' : 'w-16', isDark ? 'border-white/5 shadow-2xl shadow-black/40' : 'border-slate-200 shadow-sm']">

      <!-- Logo -->
      <div class="relative h-16 flex items-center px-5 shrink-0 overflow-hidden">
        <div class="flex items-center group cursor-default">
          <div class="w-1 h-5 bg-[#3B82F6] rounded-full group-hover:h-7 transition-all duration-300"></div>
          <div class="h-4 w-[1px] mx-3 opacity-20" :class="isDark ? 'bg-white' : 'bg-slate-900'"></div>
          <div v-if="isSidebarOpen" class="flex items-baseline animate-fade-in whitespace-nowrap">
            <span class="text-sm font-black tracking-tight uppercase transition-colors duration-300"
              :class="isDark ? 'text-white' : 'text-slate-900'">Woden</span>
            <span class="ml-1 text-sm font-light tracking-widest text-[#3B82F6] uppercase">Track</span>
          </div>
        </div>
        <div class="absolute bottom-0 left-4 right-4 h-[1px]"
          :class="isDark ? 'bg-gradient-to-r from-transparent via-white/10 to-transparent' : 'bg-gradient-to-r from-transparent via-slate-200 to-transparent'">
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-2 space-y-1.5 mt-4 overflow-y-auto custom-scroll">

        <button v-if="employee?.isSuperAdmin || employee?.permisos?.['admin.asistencias']"
          @click="router.push('/admin/asistencias')"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden"
          :class="route.path === '/admin/asistencias'
            ? (isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900')
            : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-user-check text-xs transition-transform group-hover:scale-110"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[10px] font-bold uppercase tracking-wide">Asistencias</span>
          <div v-if="route.path === '/admin/asistencias'"
            class="absolute left-0 w-1 h-4 bg-[#3B82F6] rounded-r-full shadow-[0_0_8px_#3B82F6]"></div>
        </button>

        <button v-if="employee?.isSuperAdmin || employee?.permisos?.['admin.mallas']"
          @click="router.push('/admin/mallas')"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden"
          :class="route.path === '/admin/mallas'
            ? (isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900')
            : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-cloud-arrow-up text-xs transition-transform group-hover:scale-110"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[10px] font-bold uppercase tracking-wide">Cargue Mallas</span>
          <div v-if="route.path === '/admin/mallas'"
            class="absolute left-0 w-1 h-4 bg-[#3B82F6] rounded-r-full shadow-[0_0_8px_#3B82F6]"></div>
        </button>

        <button v-if="employee?.isSuperAdmin || employee?.permisos?.['admin.calculos']"
          @click="router.push('/admin/horas-extra')"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden"
          :class="route.path === '/admin/horas-extra'
            ? (isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900')
            : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-clock-rotate-left text-xs transition-transform group-hover:scale-110"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[10px] font-bold uppercase tracking-wide">Horas Extra</span>
          <div v-if="route.path === '/admin/horas-extra'"
            class="absolute left-0 w-1 h-4 bg-[#3B82F6] rounded-r-full shadow-[0_0_8px_#3B82F6]"></div>
        </button>

        <button v-if="employee?.isSuperAdmin || employee?.permisos?.['horas.ver_cargue_ch']"
          @click="router.push('/admin/cargue-horas-ch')"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden"
          :class="route.path === '/admin/cargue-horas-ch'
            ? (isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900')
            : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-file-arrow-up text-xs transition-transform group-hover:scale-110"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[10px] font-bold uppercase tracking-wide">Cargue HX</span>
          <div v-if="route.path === '/admin/cargue-horas-ch'"
            class="absolute left-0 w-1 h-4 bg-[#3B82F6] rounded-r-full shadow-[0_0_8px_#3B82F6]"></div>
        </button>

        <button v-if="employee?.isSuperAdmin || employee?.permisos?.['admin.novedades']"
          @click="router.push('/admin/novedades')"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden"
          :class="route.path.startsWith('/admin/novedades')
            ? (isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900')
            : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-bullhorn text-xs transition-transform group-hover:scale-110"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[10px] font-bold uppercase tracking-wide">Novedades</span>
          <div v-if="route.path.startsWith('/admin/novedades')"
            class="absolute left-0 w-1 h-4 bg-[#3B82F6] rounded-r-full shadow-[0_0_8px_#3B82F6]"></div>
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
          <span v-if="isSidebarOpen" class="text-[9px] font-black uppercase tracking-widest">{{ isDark ? 'Luz' : 'Oscuro' }}</span>
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

      <!-- Header -->
      <header class="h-16 flex items-center justify-between px-6 shrink-0 z-40 transition-all"
        :class="isDark ? 'bg-[#273045] border-b border-white/5' : 'bg-white border-b border-slate-200 shadow-sm'">

        <div class="flex items-center gap-6">
          <button @click="isSidebarOpen = !isSidebarOpen" class="text-slate-400 hover:text-[#273045] transition-colors">
            <i class="fas fa-bars-staggered text-lg"></i>
          </button>

          <div v-if="allCompanies.length > 0"
            class="company-selector flex items-center gap-3 px-4 py-2 rounded-xl transition-all min-w-[320px] border"
            :class="isDark
              ? 'bg-[#0f172a] border-white/10 shadow-lg shadow-black/20'
              : 'bg-slate-50 border-slate-200 shadow-inner hover:border-[#3B82F6]'">
            <i class="fas fa-building text-[#3B82F6] text-xs"></i>
            <select v-model="selectedCompany"
              class="flex-1 bg-transparent text-[11px] font-black uppercase outline-none cursor-pointer appearance-none transition-colors"
              :class="isDark ? 'text-white' : 'text-slate-800'">
              <option v-for="comp in allCompanies" :key="comp.id" :value="comp.name"
                class="dark:bg-[#1e293b] dark:text-white">
                {{ comp.name }}
              </option>
            </select>
            <i class="fas fa-angle-down text-[10px]" :class="isDark ? 'text-white/40' : 'text-slate-400'"></i>
          </div>
        </div>

        <div class="flex items-center gap-6">
          <div class="flex items-center bg-slate-500/10 p-1 rounded-xl gap-1">
            <button @click="handleAttendance" :disabled="loading || employee?.is_inside || employee?.day_completed"
              class="btn-header-smart in group">
              <div class="icon-box-smart"><i class="fas fa-sign-in-alt text-[10px]"></i></div>
              <span class="hidden md:inline">Entrada</span>
            </button>
            <button @click="handleAttendance" :disabled="loading || !employee?.is_inside || employee?.day_completed"
              class="btn-header-smart out group">
              <div class="icon-box-smart"><i class="fas fa-sign-out-alt text-[10px]"></i></div>
              <span class="hidden md:inline">Salida</span>
            </button>
          </div>

          <div class="flex items-center gap-2 border-l border-slate-300 dark:border-white/10 pl-6">
            <div class="text-right">
              <p class="text-[11px] font-bold leading-none" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                ¡Hola,
                <span class="text-[15px] font-black text-[#3B82F6]">{{ employee?.name?.split(' ').pop()?.toLowerCase()?.replace(/^\w/, c => c.toUpperCase()) }}</span>!
              </p>
              <p class="text-[9px] font-medium leading-tight mt-0.5" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                Administrador
              </p>
            </div>
          </div>
        </div>
      </header>

      <!-- Contenido — router-view con props compartidos -->
      <div class="flex-1 p-4 overflow-hidden font-round-custom bg-slate-50/50 dark:bg-[#f5f5f5]/40 custom-scroll">

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

        <!-- Módulo activo -->
        <router-view v-else v-slot="{ Component }">
          <component :is="Component" :isDark="isDark" :company="selectedCompany" />
        </router-view>

      </div>
    </main>

    <!-- ── Widget mensajes internos ──────────────────────────────────────────── -->
    <div class="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      <!-- Bandeja desplegable -->
      <transition name="fade">
        <div v-if="mostrarBandeja && mensajesNoLeidos.length"
          class="w-72 rounded-2xl border shadow-2xl overflow-hidden mb-1"
          :class="isDark ? 'bg-[#1e293b] border-white/10' : 'bg-white border-slate-200'">
          <div class="px-4 py-2.5 border-b flex items-center justify-between"
            :class="isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'">
            <span class="text-[10px] font-bold uppercase tracking-wider"
              :class="isDark ? 'text-white/60' : 'text-slate-500'">Mensajes recibidos</span>
            <button @click="mensajesNoLeidos = []" class="text-[9px] text-rose-400 hover:text-rose-600 font-bold uppercase">
              Limpiar
            </button>
          </div>
          <div class="max-h-60 overflow-y-auto">
            <div v-for="msg in mensajesNoLeidos" :key="msg.id"
              class="px-4 py-2.5 border-b last:border-b-0"
              :class="isDark ? 'border-white/5' : 'border-slate-100'">
              <div class="text-[9px] font-bold text-blue-500 mb-0.5">{{ msg.de_nombre }}</div>
              <div class="text-[10px]" :class="isDark ? 'text-white/80' : 'text-slate-700'">{{ msg.contenido }}</div>
              <div class="text-[8px] opacity-40 mt-0.5">
                {{ new Date(msg.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) }}
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Botón flotante -->
      <button @click="mostrarBandeja = !mostrarBandeja"
        class="relative w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all"
        :class="isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'">
        <i class="fas fa-comments text-white text-base"></i>
        <span v-if="mensajesNoLeidos.length"
          class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
          {{ mensajesNoLeidos.length > 9 ? '9+' : mensajesNoLeidos.length }}
        </span>
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, provide, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { adminOdoo } from '../composables/adminLogica/adminOdoo.js';
import { io } from 'socket.io-client';
import '../assets/css/admin-style.css';

const router = useRouter();
const route  = useRoute();

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
  if (p.includes('/mallas'))      return 'mallas';
  if (p.includes('/horas-extra')) return 'calculos';
  if (p.includes('/novedades'))   return 'novedades';
  return null;
});

// ── WebSocket sesión interna ──────────────────────────────────────────────────
const WS_URL = (API_URL || '').replace('/usuarios', '') || 'http://localhost:3000';
let internoSocket = null;
const mensajesNoLeidos = ref([]);
const mostrarBandeja   = ref(false);

const conectarInterno = () => {
  if (internoSocket) return;
  const idOdoo = employee.value?.id_odoo;
  const nombre = employee.value?.name;
  if (!idOdoo) return;

  internoSocket = io(`${WS_URL}/interno`, { transports: ['websocket'] });
  internoSocket.on('connect', () => {
    internoSocket.emit('join', { idOdoo, nombre });
  });
  internoSocket.on('new-message', (msg) => {
    if (msg.para_id_odoo === idOdoo || msg.para_id_odoo === null) {
      mensajesNoLeidos.value.unshift(msg);
    }
  });
  internoSocket.on('force-disconnect', () => {
    internoSocket.disconnect();
    logout();
  });
};

// Conectar en cuanto employee se cargue
watch(() => employee.value?.id_odoo, (id) => { if (id) conectarInterno(); }, { immediate: true });

onMounted(async () => {
  try {
    const res = await fetch(`${API_URL}/sistema-config`);
    if (res.ok) Object.assign(modulosConfig, await res.json());
  } catch {}
});

onUnmounted(() => {
  internoSocket?.disconnect();
});
</script>


<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .2s, transform .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(8px); }
</style>
