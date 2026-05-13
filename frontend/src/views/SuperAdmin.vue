<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAttendance } from '../composables/UserLogica/useAttendance.js';
import { useUsuariosSync } from '../composables/adminLogica/useUsuariosSync.js';
import { useOrganizacion } from '../composables/adminLogica/useOrganizacion.js';
import GestionEstructura from '../components/admin/SuperAdmin/GestionEstructura.vue';
import Notificaciones from '../components/admin/SuperAdmin/GestionNotificaciones.vue';
import GestionApk from '../components/admin/SuperAdmin/GestionApk.vue';
import GestionCompanias from '../components/admin/SuperAdmin/GestionCompanias.vue';
import GestionUsuarios from '../components/admin/SuperAdmin/GestionUsuarios.vue';
import GestionDashboard from '../components/admin/SuperAdmin/GestionDashboard.vue';
import GestionPermisos from '../components/admin/SuperAdmin/GestionPermisos.vue';
import GestionMallas from '../components/admin/SuperAdmin/GestionMallas.vue';
import GestionConfiguraciones from '../components/admin/SuperAdmin/GestionConfiguraciones.vue';
import GestionApiExterna from '../components/admin/SuperAdmin/GestionApiExterna.vue';
import GestionAnalitica from '../components/admin/SuperAdmin/GestionAnalitica.vue';
import GestionSesiones from '../components/admin/SuperAdmin/GestionSesiones.vue';
import GestionMensajes from '../components/admin/SuperAdmin/GestionMensajes.vue';
import GestionRecordatorios from '../components/admin/SuperAdmin/GestionRecordatorios.vue';
import '../assets/css/admin-style.css';
import '../assets/css/SuperAdmin.css';


// --- 1. CONFIGURACIÓN ---
const API_URL = import.meta.env.VITE_API_URL;

const props = defineProps({ isDark: Boolean });
const router = useRouter();
const route = useRoute();
const { logout, isDark, toggleTheme, employee } = useAttendance();

// ── Sistema de permisos por módulo ────────────────────────────────────────────
const TAB_PERMS = {
  stats:         'super.dashboard',
  apk:           'super.gestionarapk',
  companies:     'super.companias',
  users:         'super.personal',
  notifications: 'super.avisos',
  estructura:    'super.organizacion',
  mallas:        'super.mallas',
  analitica:     'super.analitica',
  sesiones:      'super.sesiones',
  mensajes:      'super.mensajes',
  recordatorios: 'super.recordatorios',
  config:        'super.configuracion',
  api:           'super.api',
};

const isSA = computed(() =>
  employee.value?.isSuperAdmin || !!employee.value?.permisos?.['super.superadmin']
);

const canAccess = (tabKey) => {
  if (isSA.value) return true;
  const perm = TAB_PERMS[tabKey];
  return perm ? !!employee.value?.permisos?.[perm] : false;
};

const currentTab = computed(() => route.params.tab || 'stats');
const navigateTo = (key) => router.push(`/super-admin/${key}`);
const { departamentosUnicos } = useUsuariosSync();

// 2. Extraer los métodos y estados
const {
  areas,
  segmentos,
  areasAgrupadas,
  departamentos,
  fetchDatos: fetchOrganizacion,
  crearArea,
  crearSegmento,
  updateArea,
} = useOrganizacion();

// 3. Crear la función puente para el evento @save del componente
const handleSaveEstructura = async (data) => {
  try {
    if (data.tipo === "area") {
      await crearArea({
        nombre: data.nombre,
        responsableId: data.responsableId,
        departamento: data.departamento,
      });
    } else {
      await crearSegmento({
        nombre: data.nombre,
        responsableId: data.responsableId,
      });
    }
    showNotification(`${data.tipo.toUpperCase()} guardado con éxito`);
  } catch (e) {
    showNotification("Error al guardar la estructura", "error");
  }
};

const handleUpdateArea = async ({
  id,
  departamento,
  responsableId,
  nombre,
}) => {
  try {
    await updateArea(id, { departamento, responsableId, nombre });
    showNotification("Área actualizada correctamente");
  } catch (e) {
    showNotification("Error al actualizar el área", "error");
  }
};

// IMPORTANTE: Extraemos TODO lo necesario del composable de usuarios
// Eliminamos las declaraciones manuales de searchUser, selectedDept y los computed
const {
  dbUsuarios,
  isSyncing: isSyncingUsers,
  syncProgress: userSyncProgress,
  selectedDept,
  selectedCountry,
  fetchDbUsuarios,
  fetchOdooUsuarios,
  executeSync: syncAllUsers,
} = useUsuariosSync();

// --- Observador (Watch) para el cambio de país ---
watch(selectedCountry, async () => {
  selectedDept.value = "TODOS";
  // Al cambiar país, refrescamos ambas listas
  await Promise.all([fetchDbUsuarios(), fetchOdooUsuarios()]);
});
// --- 1. ESTADOS REACTIVOS (Nivel principal) ---
const selectedUserPerms = ref(null);

// --- 2. FUNCIONES DE INTERFAZ (Nivel principal) ---
const openPerms = (user) => {
  console.log("Abriendo permisos para:", user.nombre); // Para debugear
  selectedUserPerms.value = user;
};
const hasPerm = (user, slug) => {
  if (!user || !user.permisos) return false;
  return user.permisos.some((p) => p.modulos === slug);
};
// --- Estado Local Restante ---
const isSidebarOpen = ref(true);

// --- Sistema de Notificación ---
const notification = ref({ show: false, message: "", type: "success" });
const showNotification = (msg, type = "success") => {
  notification.value = { show: true, message: msg, type };
  setTimeout(() => (notification.value.show = false), 5000);
};

// SuperAdmin.vue — agrega estas funciones
const togglePermisoLocal = async (user, slug) => {
  const activo = !hasPerm(user, slug);
  try {
    const session = JSON.parse(localStorage.getItem("user_session") || "{}");
    const res = await fetch(`${API_URL}/asignar-permiso`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idOdoo: user.id_odoo,
        modulo: slug,
        activo: activo,
        adminName: session.name || "Desconocido",
      }),
    });
    if (!res.ok) throw new Error();

    // Refrescar el usuario en la tabla local
    await fetchDbUsuarios();

    // Actualizar el usuario seleccionado para que el modal refleje el cambio
    const actualizado = dbUsuarios.value.find(
      (u) => u.id_odoo === user.id_odoo,
    );
    if (actualizado) selectedUserPerms.value = { ...actualizado };

    showNotification(`Permiso ${activo ? "asignado" : "removido"}`);
  } catch (e) {
    showNotification("Error al actualizar permiso", "error");
  }
};

const updateUserStructure = async (user, field) => {
  try {
    const res = await fetch(`${API_URL}/actualizar-estructura`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idOdoo: user.id_odoo,
        campo: field,
        valor: user[field],
        adminName: employee.value?.name || "Desconocido",
      }),
    });
    if (!res.ok) throw new Error();
    showNotification("Cambio guardado");
  } catch (e) {
    showNotification("Error al guardar", "error");
  }
};

// --- Carga Inicial ---
onMounted(async () => {
  await Promise.all([
    fetchDbUsuarios(),
    fetchOrganizacion(),
    fetchOdooUsuarios(),
  ]);
});
</script>
<template>
  <!-- ══════════════════════════════════════════════════════════
       SUPER ADMIN — Diseño moderno
  ══════════════════════════════════════════════════════════ -->
  <div class="flex min-h-screen transition-colors duration-500 font-sans" :class="isDark ? 'bg-[#1e2a3a] text-slate-200' : 'bg-slate-100 text-slate-800'
    ">
    <!-- ── Toast de notificación ────────────────────────────── -->
    <Transition name="notification">
      <div v-if="notification.show"
        class="fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl max-w-xs"
        :class="notification.type === 'success'
          ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10'
          : 'bg-rose-950/90 border-rose-500/30 text-rose-400 shadow-rose-500/10'
          ">
        <div class="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" :class="notification.type === 'success'
          ? 'bg-emerald-500/20'
          : 'bg-rose-500/20'
          ">
          <i :class="notification.type === 'success'
            ? 'fas fa-check text-[10px]'
            : 'fas fa-xmark text-[10px]'
            "></i>
        </div>
        <p class="text-[11px] font-bold tracking-wide">
          {{ notification.message }}
        </p>
      </div>
    </Transition>

    <!-- ── Botón hamburguesa móvil ───────────────────────────── -->
    <button v-if="!isSidebarOpen" @click="isSidebarOpen = true"
      class="lg:hidden fixed top-4 left-4 z-[60] w-10 h-10 bg-[#3B82F6] text-white rounded-xl shadow-lg shadow-[#3B82F6]/30 flex items-center justify-center active:scale-95 transition-transform">
      <i class="fas fa-bars text-sm"></i>
    </button>

    <!-- Backdrop móvil -->
    <div v-if="isSidebarOpen" @click="isSidebarOpen = false"
      class="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[45]"></div>

    <!-- ════════════════════════════════════════════════════════
         SIDEBAR
    ════════════════════════════════════════════════════════ -->
    <aside :class="[
      'fixed lg:relative z-50 h-screen flex flex-col transition-[width,transform] duration-300 ease-in-out border-r',
      isDark
        ? 'bg-[#162030] border-white/[0.06]'
        : 'bg-white border-slate-200',
      isSidebarOpen
        ? 'w-60 translate-x-0'
        : 'w-0 -translate-x-full lg:w-[62px] lg:translate-x-0',
    ]">
      <!-- Toggle collapse -->
      <button @click="isSidebarOpen = !isSidebarOpen"
        class="absolute -right-3 top-7 w-6 h-6 rounded-full border shadow-lg flex items-center justify-center text-[9px] transition-all z-[60]"
        :class="[
          isDark
            ? 'border-white/10 bg-[#162030] text-white/40'
            : 'border-slate-200 bg-white text-slate-400',
          'hover:text-[#3B82F6] hover:border-[#3B82F6]/40',
          !isSidebarOpen ? 'rotate-180' : '',
          !isSidebarOpen && 'hidden lg:flex',
        ]">
        <i class="fas fa-chevron-left"></i>
      </button>

      <div class="flex flex-col h-full overflow-hidden">
        <!-- Brand -->
        <div class="px-3 pt-5 pb-6 flex items-center gap-3" :class="!isSidebarOpen && 'lg:justify-center lg:px-0'">
          <div
            class="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-[#3B82F6]/30"
            style="background: linear-gradient(135deg, #3b82f6, #60a5fa)">
            <i class="fas fa-shield-alt"></i>
          </div>
          <div v-if="isSidebarOpen" class="overflow-hidden">
            <p class="font-black text-[13px] leading-none tracking-tighter uppercase"
              :class="isDark ? 'text-white' : 'text-slate-800'">
              Woden<span class="text-[#3B82F6]">Admin</span>
            </p>
            <p class="text-[9px] font-medium tracking-widest uppercase mt-0.5"
              :class="isDark ? 'text-white/30' : 'text-slate-400'">
              Control Panel
            </p>
          </div>
        </div>

        <!-- Divisor -->
        <div class="mx-3 mb-3 h-px" :class="isDark ? 'bg-white/5' : 'bg-slate-100'"></div>

        <!-- Nav items -->
        <nav class="flex-1 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          <template v-for="(item, key) in {
            stats: { icon: 'fas fa-chart-pie', label: 'Dashboard', color: 'text-blue-500', bg: 'bg-blue-500/10' },
            apk: { icon: 'fab fa-android', label: 'APK', color: 'text-green-500', bg: 'bg-green-500/10' },
            companies: { icon: 'fas fa-building', label: 'Empresas', color: 'text-purple-500', bg: 'bg-purple-500/10' },
            users: { icon: 'fas fa-users-cog', label: 'Personal', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
            notifications: { icon: 'fas fa-bullhorn', label: 'Avisos', color: 'text-rose-500', bg: 'bg-rose-500/10' },
            estructura: { icon: 'fas fa-sitemap', label: 'Organización', color: 'text-cyan-600', bg: 'bg-cyan-500/10' },
            mallas: { icon: 'fas fa-calendar-alt', label: 'Mallas', color: 'text-amber-500', bg: 'bg-amber-500/10' },
            analitica: { icon: 'fas fa-chart-bar', label: 'Analítica HR', color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10' },
            sesiones: { icon: 'fas fa-shield-halved', label: 'Sesiones', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            mensajes: { icon: 'fas fa-comments', label: 'Mensajes', color: 'text-sky-500', bg: 'bg-sky-500/10' },
            recordatorios: { icon: 'fas fa-bell', label: 'Recordatorios', color: 'text-violet-500', bg: 'bg-violet-500/10' },
            config: { icon: 'fas fa-sliders', label: 'Configuración', color: 'text-slate-500', bg: 'bg-slate-500/10' },
            api: { icon: 'fas fa-plug', label: 'API Externa', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          }" :key="key">
            <button v-if="canAccess(key)" @click="navigateTo(key)" :title="item.label"
              class="group w-full flex items-center gap-3 rounded-xl transition-all duration-150 relative" :class="[
                isSidebarOpen
                  ? 'px-2.5 py-2'
                  : 'lg:justify-center lg:px-0 lg:py-2.5',
                currentTab === key
                  ? 'bg-[#3B82F6]/10 text-[#3B82F6]'
                  : isDark
                    ? 'text-white/40 hover:text-white/80 hover:bg-white/5'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
              ]">
              <!-- Indicador activo izquierdo -->
              <div v-if="currentTab === key"
                class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#3B82F6]"></div>

              <!-- Ícono con fondo -->
              <div class="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center transition-all text-[12px]"
                :class="currentTab === key
                  ? 'bg-[#3B82F6]/20 text-[#3B82F6]'
                  : [item.bg, item.color]
                  ">
                <i :class="item.icon"></i>
              </div>

              <!-- Label -->
              <span v-if="isSidebarOpen" class="text-[11px] font-semibold truncate">
                {{ item.label }}
              </span>
            </button>
          </template>
        </nav>

        <!-- Divisor -->
        <div class="mx-3 my-3 h-px" :class="isDark ? 'bg-white/5' : 'bg-slate-100'"></div>

        <!-- Dev links -->
        <div v-if="isSA" class="px-2 pb-2 space-y-0.5">
          <p v-if="isSidebarOpen" class="px-2 text-[8px] font-black uppercase tracking-widest mb-1"
            :class="isDark ? 'text-white/20' : 'text-slate-300'">
            Dev
          </p>

          <button v-for="devItem in [
            {
              path: '/super-admin',
              icon: 'fas fa-shield-halved',
              label: 'Super Admin',
            },
            { path: '/admin', icon: 'fas fa-user-shield', label: 'Admin' },
            {
              path: '/marcacion',
              icon: 'fas fa-fingerprint',
              label: 'Marcación',
            },
          ]" :key="devItem.path" @click="router.push(devItem.path)" :title="devItem.label"
            class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase text-[#3B82F6]/60 hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-all"
            :class="!isSidebarOpen && 'lg:justify-center'">
            <i :class="devItem.icon" class="text-[11px]"></i>
            <span v-if="isSidebarOpen">{{ devItem.label }}</span>
          </button>
        </div>

        <!-- Footer: tema + logout -->
        <div class="px-2 pb-4 space-y-0.5 pt-3 border-t" :class="isDark ? 'border-white/5' : 'border-slate-100'">
          <button @click="toggleTheme"
            class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all"
            :class="[
              isDark
                ? 'text-white/30 hover:text-white/70 hover:bg-white/5'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
              !isSidebarOpen && 'lg:justify-center',
            ]">
            <i :class="isDark
              ? 'fas fa-sun text-yellow-400'
              : 'fas fa-moon text-indigo-400'
              " class="text-[11px]"></i>
            <span v-if="isSidebarOpen">{{
              isDark ? "Modo claro" : "Modo oscuro"
            }}</span>
          </button>

          <button @click="logout"
            class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
            :class="!isSidebarOpen && 'lg:justify-center'">
            <i class="fas fa-sign-out-alt text-[11px]"></i>
            <span v-if="isSidebarOpen">Salir</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- ════════════════════════════════════════════════════════
         ÁREA PRINCIPAL
    ════════════════════════════════════════════════════════ -->
    <main class="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
      <!-- Header con nombre del módulo actual -->
      <header class="h-12 shrink-0 flex items-center justify-between px-6 border-b backdrop-blur-sm" :class="isDark
        ? 'bg-[#162030]/80 border-white/[0.06]'
        : 'bg-slate-100/80 border-slate-200/80'
        ">
        <!-- Breadcrumb módulo actual -->
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow shadow-emerald-400/50 animate-pulse"></div>
          <span class="text-[10px] font-black uppercase tracking-widest"
            :class="isDark ? 'text-white/30' : 'text-slate-400'">
            WodenAdmin
          </span>
          <i class="fas fa-chevron-right text-[8px] opacity-20"></i>
          <span class="text-[11px] font-bold uppercase tracking-wide"
            :class="isDark ? 'text-white/70' : 'text-slate-600'">
            {{ {
              stats: 'Dashboard', apk: 'APK', companies: 'Empresas',
              users: 'Personal', notifications: 'Avisos', estructura: 'Organización',
              mallas: 'Mallas', analitica: 'Analítica HR', sesiones: 'Sesiones', mensajes: 'Mensajes', recordatorios:
                'Recordatorios', config: 'Configuración', api: 'API Externa'
            }[currentTab] }}
          </span>
        </div>

        <!-- Info del sistema -->
        <div class="flex items-center gap-3">
          <div class="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border" :class="isDark
            ? 'border-emerald-500/20 bg-emerald-500/5'
            : 'border-emerald-300 bg-emerald-50'
            ">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            <span class="text-[9px] font-black uppercase tracking-widest text-emerald-500">Sistema Activo</span>
          </div>
          <div v-if="employee?.name" class="flex items-center gap-2 px-2.5 py-1 rounded-xl border cursor-default"
            :class="isDark ? 'border-white/8 bg-white/5' : 'border-slate-200 bg-white'
              ">
            <div class="w-5 h-5 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center">
              <i class="fas fa-user text-[#3B82F6] text-[8px]"></i>
            </div>
            <span class="text-[10px] font-semibold hidden sm:block"
              :class="isDark ? 'text-white/60' : 'text-slate-600'">
              {{ employee.name.split(" ")[0] }}
            </span>
          </div>
        </div>
      </header>

      <!-- Contenido -->
      <div class="flex-1 overflow-y-auto p-4 lg:p-5 flex flex-col" :class="isDark ? 'bg-[#1e2a3a]' : 'bg-slate-100'">
        <div v-if="currentTab === 'stats' && canAccess('stats')" class="animate-fade-in">
          <GestionDashboard :isDark="isDark" />
        </div>

        <div v-if="currentTab === 'apk' && canAccess('apk')" class="animate-fade-in max-w-5xl">
          <GestionApk :isDark="isDark" @success="showNotification($event)" @error="showNotification($event, 'error')" />
        </div>

        <div v-if="currentTab === 'companies' && canAccess('companies')" class="animate-fade-in">
          <GestionCompanias :isDark="isDark" @success="showNotification($event)"
            @error="showNotification($event, 'error')" />
        </div>

        <div v-if="currentTab === 'users' && canAccess('users')" class="animate-fade-in">
          <GestionUsuarios :isDark="isDark" @success="showNotification($event)"
            @error="showNotification($event, 'error')" @open-perms="openPerms($event)" />
        </div>

        <div v-if="currentTab === 'notifications' && canAccess('notifications')" class="animate-fade-in">
          <Notificaciones :isDark="isDark" :apiUrl="API_URL"
            @notification-sent="showNotification('Notificación enviada')" />
        </div>

        <div v-if="currentTab === 'estructura' && canAccess('estructura')" class="animate-fade-in">
          <GestionEstructura :key="areas.length" :isDark="isDark" :usuarios="dbUsuarios" :areas="areas"
            :segmentos="segmentos" :areasAgrupadas="areasAgrupadas"
            :departamentosDisponibles="segmentos.map(s => s.nombre)" @save="handleSaveEstructura"
            @update-area="handleUpdateArea" @refresh="fetchOrganizacion" />
        </div>

        <div v-if="currentTab === 'mallas' && canAccess('mallas')" class="animate-fade-in flex-1 min-h-0 flex flex-col">
          <GestionMallas :isDark="isDark" @success="showNotification($event)"
            @error="showNotification($event, 'error')" />
        </div>

        <div v-if="currentTab === 'analitica' && canAccess('analitica')" class="animate-fade-in flex-1 min-h-0 flex flex-col">
          <GestionAnalitica :isDark="isDark" @success="showNotification($event)"
            @error="showNotification($event, 'error')" />
        </div>

        <div v-if="currentTab === 'sesiones' && canAccess('sesiones')" class="animate-fade-in flex-1 min-h-0 flex flex-col">
          <GestionSesiones :isDark="isDark" @success="showNotification($event)"
            @error="showNotification($event, 'error')" />
        </div>

        <div v-if="currentTab === 'mensajes' && canAccess('mensajes')" class="animate-fade-in flex-1 min-h-0 flex flex-col">
          <GestionMensajes :isDark="isDark" @success="showNotification($event)"
            @error="showNotification($event, 'error')" />
        </div>

        <div v-if="currentTab === 'recordatorios' && canAccess('recordatorios')" class="animate-fade-in flex-1 min-h-0 flex flex-col">
          <GestionRecordatorios :isDark="isDark" @success="showNotification($event)"
            @error="showNotification($event, 'error')" />
        </div>

        <div v-if="currentTab === 'config' && canAccess('config')" class="animate-fade-in">
          <GestionConfiguraciones :isDark="isDark" @success="showNotification($event)"
            @error="showNotification($event, 'error')" />
        </div>

        <div v-if="currentTab === 'api' && canAccess('api')" class="animate-fade-in">
          <GestionApiExterna :isDark="isDark" @success="showNotification($event)"
            @error="showNotification($event, 'error')" />
        </div>

      </div>
    </main>

    <!-- Panel de permisos -->
    <GestionPermisos v-model="selectedUserPerms" :isDark="isDark" :areas="areas" :segmentos="segmentos"
      :apiUrl="API_URL" :todosLosDepartamentos="departamentosUnicos"
      @toggle-perm="togglePermisoLocal($event.user, $event.slug)"
      @update-structure="updateUserStructure($event.user, $event.field)" />
  </div>
</template>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(24px) scale(0.95);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(24px) scale(0.95);
}
</style>
