<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

// ── Constantes de navegación (agrupadas por categoría) ───────────────────────
const NAV_GROUPS = [
  {
    label: 'Gestión',
    items: {
      stats: { icon: 'fas fa-chart-pie', label: 'Dashboard', color: 'text-blue-400', bg: 'bg-blue-500/10' },
      users: { icon: 'fas fa-users', label: 'Personal', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
      estructura: { icon: 'fas fa-sitemap', label: 'Organización', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
      companies: { icon: 'fas fa-building-columns', label: 'Empresas', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    },
  },
  {
    label: 'Operación',
    items: {
      mallas: { icon: 'fas fa-calendar-days', label: 'Mallas', color: 'text-amber-400', bg: 'bg-amber-500/10' },
      solicitudes: { icon: 'fas fa-inbox', label: 'Solicitudes', color: 'text-amber-400', bg: 'bg-amber-500/10' },
      analitica: { icon: 'fas fa-chart-line', label: 'Analítica HR', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
      sesiones: { icon: 'fas fa-lock', label: 'Sesiones', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    },
  },
  {
    label: 'Comunicación',
    items: {
      notifications: { icon: 'fas fa-bell', label: 'Avisos', color: 'text-rose-400', bg: 'bg-rose-500/10' },
      mensajes: { icon: 'fas fa-message', label: 'Mensajes', color: 'text-sky-400', bg: 'bg-sky-500/10' },
      recordatorios: { icon: 'fas fa-clock', label: 'Recordatorios', color: 'text-violet-400', bg: 'bg-violet-500/10' },
    },
  },
  {
    label: 'Sistema',
    items: {
      apk: { icon: 'fab fa-android', label: 'APK', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      api: { icon: 'fas fa-plug', label: 'API Externa', color: 'text-teal-400', bg: 'bg-teal-500/10' },
      config: { icon: 'fas fa-sliders', label: 'Configuración', color: 'text-slate-400', bg: 'bg-slate-500/10' },
      modulos: { icon: 'fas fa-puzzle-piece', label: 'Módulos', color: 'text-violet-400', bg: 'bg-violet-500/10' },
      reportes: { icon: 'fas fa-triangle-exclamation', label: 'Rep. Falla', color: 'text-red-400', bg: 'bg-red-500/10' },
      offboarding: { icon: 'fas fa-list-check', label: 'Checklist Offboarding', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    },
  },
];

// Mapa plano para acceso rápido por key (icon/label en otros lugares del código)
const NAV_ITEMS = NAV_GROUPS.reduce((acc, g) => ({ ...acc, ...g.items }), {});

const MODULE_LABELS = {
  stats: 'Dashboard', apk: 'APK', companies: 'Empresas', users: 'Personal',
  notifications: 'Avisos', estructura: 'Organización', mallas: 'Mallas',
  analitica: 'Analítica HR', sesiones: 'Sesiones', mensajes: 'Mensajes',
  recordatorios: 'Recordatorios', config: 'Configuración', api: 'API Externa',
  modulos: 'Módulos & Permisos', solicitudes: 'Solicitudes', reportes: 'Rep. de Falla',
};
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
import GestionChecklistOffboarding from '../components/admin/SuperAdmin/GestionChecklistOffboarding.vue';
import GestionApiExterna from '../components/admin/SuperAdmin/GestionApiExterna.vue';
import GestionAnalitica from '../components/admin/SuperAdmin/GestionAnalitica.vue';
import GestionSesiones from '../components/admin/SuperAdmin/GestionSesiones.vue';
import GestionMensajes from '../components/admin/SuperAdmin/GestionMensajes.vue';
import GestionRecordatorios from '../components/admin/SuperAdmin/GestionRecordatorios.vue';
import GestionSolicitudes from '../components/admin/SuperAdmin/GestionSolicitudes.vue';
import GestionModulos from '../components/admin/SuperAdmin/GestionModulos.vue';
import ModuloReportesFalla from '../components/admin/ModuloReportesFalla.vue';
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
  stats: 'super.dashboard',
  apk: 'super.gestionarapk',
  companies: 'super.companias',
  users: 'super.personal',
  notifications: 'super.avisos',
  estructura: 'super.organizacion',
  mallas: 'super.mallas',
  analitica: 'super.analitica',
  sesiones: 'super.sesiones',
  mensajes: 'super.mensajes',
  recordatorios: 'super.recordatorios',
  config: 'super.configuracion',
  api: 'super.api',
  modulos: 'super.superadmin',
  solicitudes: 'super.solicitudes',
  reportes: 'super.reportes',
  offboarding: 'super.offboarding',
};

// Solo el root (isSuperAdmin) ve todo. super.superadmin solo da entrada al panel.
const isSA = computed(() => !!employee.value?.isSuperAdmin);

const canAccess = (tabKey) => {
  if (isSA.value) return true;
  const perm = TAB_PERMS[tabKey];
  return perm ? !!employee.value?.permisos?.[perm] : false;
};

const groupHasAccess = (group) => Object.keys(group.items).some(canAccess);

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
const showUserMenu = ref(false);

// Nombre de pila (formato "Apellido1 Apellido2 Nombre1 Nombre2" → "Nombre1")
const displayName = computed(() => {
  const name = employee.value?.name?.trim() ?? '';
  if (!name) return '';
  const words = name.split(/\s+/);
  // Si hay 3+ palabras → la tercera es el primer nombre; si no, la última
  const first = words.length >= 3 ? words[2] : words[words.length - 1];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
});
const displayRole = computed(() =>
  employee.value?.isSuperAdmin ? 'Super Admin' : 'Administrador'
);

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
  <div class="sa-root" :class="isDark ? 'sa-dark' : 'sa-light'">

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="notification.show" class="sa-toast"
        :class="notification.type === 'success' ? 'sa-toast-ok' : 'sa-toast-err'">
        <i :class="notification.type === 'success' ? 'fas fa-check' : 'fas fa-xmark'" class="text-xs"></i>
        <span class="text-[11px] font-bold">{{ notification.message }}</span>
      </div>
    </Transition>

    <!-- Hamburguesa móvil -->
    <button v-if="!isSidebarOpen" @click="isSidebarOpen = true"
      class="lg:hidden fixed top-4 left-4 z-[60] w-9 h-9 rounded-xl flex items-center justify-center text-white"
      style="background:#3b82f6">
      <i class="fas fa-bars text-sm"></i>
    </button>
    <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="lg:hidden fixed inset-0 bg-black/60 z-[45]"></div>

    <!-- ═══════════ SIDEBAR ═══════════ -->
    <aside class="sa-sidebar" :class="[isDark ? 'sa-sidebar-dark' : 'sa-sidebar-light',
    isSidebarOpen ? 'sa-sidebar-open' : 'sa-sidebar-closed']">

      <!-- Botón colapsar -->
      <button @click="isSidebarOpen = !isSidebarOpen" class="sa-collapse-btn"
        :class="[isDark ? 'sa-collapse-dark' : 'sa-collapse-light', !isSidebarOpen && 'hidden lg:flex rotate-180']">
        <i class="fas fa-chevron-left text-[9px]"></i>
      </button>

      <!-- Brand -->
      <div class="sa-brand" :class="!isSidebarOpen && 'lg:justify-center lg:px-0'">
        <div class="sa-brand-icon">
          <i class="fas fa-shield-halved text-[13px] text-white"></i>
        </div>
        <div v-if="isSidebarOpen">
          <p class="sa-brand-name" :class="isDark ? 'text-white' : 'text-slate-800'">
            Super<span style="color:#3b82f6">Admin</span>
          </p>
          <p class="sa-brand-sub">Consola</p>
        </div>
      </div>

      <div class="sa-divider"></div>

      <!-- Nav items (agrupados por categoría) -->
      <nav class="sa-nav">
        <template v-for="(group, gIdx) in NAV_GROUPS" :key="group.label">
          <!-- Label de grupo (solo si hay items accesibles) -->
          <div v-if="groupHasAccess(group)" class="sa-nav-group">
            <p v-if="isSidebarOpen" class="sa-nav-group-label">{{ group.label }}</p>
            <div v-else class="sa-nav-group-divider lg:block hidden"></div>

            <template v-for="(item, key) in group.items" :key="key">
              <button v-if="canAccess(key)" @click="navigateTo(key)" :title="item.label" class="sa-nav-item" :class="[
                !isSidebarOpen && 'lg:justify-center',
                currentTab === key
                  ? (isDark ? 'sa-nav-active-dark' : 'sa-nav-active-light')
                  : (isDark ? 'sa-nav-idle-dark' : 'sa-nav-idle-light'),
              ]">
                <div v-if="currentTab === key" class="sa-nav-bar"></div>
                <div class="sa-nav-icon">
                  <i :class="item.icon" :style="isDark
                    ? (currentTab === key ? 'color:#e2e8f0' : 'color:#8b9ab4')
                    : (currentTab === key ? 'color:#0f172a' : 'color:#334155')"></i>
                </div>
                <span v-if="isSidebarOpen" class="sa-nav-label">{{ item.label }}</span>
              </button>
            </template>
          </div>
        </template>
      </nav>

      <div class="sa-divider"></div>

      <!-- Dev Nav -->
      <div v-if="isSA" class="px-2 pb-1 shrink-0">
        <p v-if="isSidebarOpen" class="sa-section-label">Dev Nav</p>
        <button v-for="d in [
          { path: '/super-admin', icon: 'fas fa-shield-halved', label: 'Super Admin' },
          { path: '/admin', icon: 'fas fa-user-shield', label: 'Admin' },
          { path: '/marcacion', icon: 'fas fa-fingerprint', label: 'Marcación' },
        ]" :key="d.path" @click="router.push(d.path)" :title="d.label" class="sa-dev-btn"
          :class="!isSidebarOpen && 'lg:justify-center'">
          <i :class="d.icon" class="text-[10px] shrink-0"></i>
          <span v-if="isSidebarOpen">{{ d.label }}</span>
        </button>
      </div>


    </aside>

    <!-- ═══════════ MAIN ═══════════ -->
    <main class="sa-main">

      <!-- Header -->
      <header class="sa-header" :class="isDark ? 'sa-header-dark' : 'sa-header-light'">
        <!-- Izquierda: breadcrumb -->
        <div class="flex items-center gap-2 min-w-0">
          <span class="relative flex h-2 w-2 shrink-0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="sa-breadcrumb-root" :class="isDark ? 'text-white/40' : 'text-slate-400'">WodenAdmin</span>
          <i class="fas fa-chevron-right text-[7px] opacity-20 shrink-0"></i>
          <span class="sa-breadcrumb-page" :class="isDark ? 'text-white' : 'text-slate-800'">
            {{ MODULE_LABELS[currentTab] ?? currentTab }}
          </span>
        </div>

        <!-- Derecha: 1-Sistema Activo · 2-Tema · 3-Usuario (con dropdown) -->
        <div class="flex items-center gap-2 shrink-0">
          <!-- 1. Ssistema activo -->

          <!-- 2. Toggle tema — solo ícono, sin texto -->
          <button @click="toggleTheme" class="sa-theme-btn" :class="isDark ? 'sa-theme-dark' : 'sa-theme-light'"
            title="Cambiar tema">
            <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'" class="text-[11px]"
              :style="isDark ? 'color:#facc15' : 'color:#818cf8'"></i>
          </button>

          <!-- 3. Usuario con dropdown -->
          <div class="relative" v-if="employee?.name">
            <button @click="showUserMenu = !showUserMenu" class="sa-user-chip"
              :class="isDark ? 'sa-user-dark' : 'sa-user-light'">
              <div class="sa-user-avatar">
                <span class="text-[10px] font-black" style="color:#3b82f6">
                  {{ displayName.charAt(0) }}
                </span>
              </div>
              <div class="leading-tight text-left">
                <p class="text-[8px] font-semibold uppercase tracking-widest opacity-40"
                  :class="isDark ? 'text-white' : 'text-slate-500'">{{ displayRole }}</p>
                <p class="text-[11px] font-bold" :class="isDark ? 'text-white' : 'text-slate-800'">{{ displayName }}</p>
              </div>
              <i class="fas fa-chevron-down text-[8px] opacity-30 ml-1 transition-transform"
                :class="showUserMenu ? 'rotate-180' : ''"></i>
            </button>

            <!-- Dropdown -->
            <Transition name="dropdown">
              <div v-if="showUserMenu" class="absolute right-0 top-full mt-2 w-44 rounded-xl border py-1 z-50 shadow-xl"
                :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
                <div class="px-3 py-2 border-b" :class="isDark ? 'border-white/[0.06]' : 'border-slate-100'">
                  <p class="text-[9px] font-bold uppercase tracking-widest opacity-40"
                    :class="isDark ? 'text-white' : 'text-slate-500'">{{ displayRole }}</p>
                  <p class="text-[11px] font-bold mt-0.5" :class="isDark ? 'text-white' : 'text-slate-800'">{{
                    displayName
                    }}</p>
                </div>
                <button @click="logout(); showUserMenu = false"
                  class="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-rose-400 hover:bg-rose-500/10 transition-all">
                  <i class="fas fa-arrow-right-from-bracket text-[10px]"></i>
                  Cerrar sesión
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- Área de contenido -->
      <div class="sa-content" :class="isDark ? 'sa-content-dark' : 'sa-content-light'">

        <!-- Módulos de contenido normal -->
        <template v-for="tab in ['stats', 'apk', 'companies', 'users', 'notifications', 'estructura', 'config', 'api', 'modulos']"
          :key="tab">
          <div v-if="currentTab === tab && canAccess(tab)" class="sa-card animate-fade-in"
            :class="isDark ? 'sa-card-dark' : 'sa-card-light'">
            <GestionDashboard v-if="tab === 'stats'" :isDark="isDark" />
            <GestionApk v-if="tab === 'apk'" :isDark="isDark" @success="showNotification($event)"
              @error="showNotification($event, 'error')" />
            <GestionCompanias v-if="tab === 'companies'" :isDark="isDark" @success="showNotification($event)"
              @error="showNotification($event, 'error')" />
            <GestionUsuarios v-if="tab === 'users'" :isDark="isDark" @success="showNotification($event)"
              @error="showNotification($event, 'error')" @open-perms="openPerms($event)" />
            <Notificaciones v-if="tab === 'notifications'" :isDark="isDark" :apiUrl="API_URL"
              @notification-sent="showNotification('Notificación enviada')" />
            <GestionEstructura v-if="tab === 'estructura'" :key="areas.length" :isDark="isDark" :usuarios="dbUsuarios"
              :areas="areas" :segmentos="segmentos" :areasAgrupadas="areasAgrupadas"
              :departamentosDisponibles="segmentos.map(s => s.nombre)" @save="handleSaveEstructura"
              @update-area="handleUpdateArea" @refresh="fetchOrganizacion" />
            <GestionConfiguraciones v-if="tab === 'config'" :isDark="isDark" @success="showNotification($event)"
              @error="showNotification($event, 'error')" />
            <GestionApiExterna v-if="tab === 'api'" :isDark="isDark" @success="showNotification($event)"
              @error="showNotification($event, 'error')" />
            <GestionModulos v-if="tab === 'modulos'" :isDark="isDark" :apiUrl="API_URL"
              @success="showNotification($event)" @error="showNotification($event, 'error')" />
          </div>
        </template>

        <!-- Módulos de altura completa -->
        <template
          v-for="tab in ['mallas', 'analitica', 'sesiones', 'mensajes', 'recordatorios', 'solicitudes', 'reportes', 'offboarding']"
          :key="tab">
          <div v-if="currentTab === tab && canAccess(tab)" class="sa-card sa-card-full animate-fade-in"
            :class="isDark ? 'sa-card-dark' : 'sa-card-light'">
            <GestionMallas v-if="tab === 'mallas'" :isDark="isDark" @success="showNotification($event)"
              @error="showNotification($event, 'error')" />
            <GestionAnalitica v-if="tab === 'analitica'" :isDark="isDark" @success="showNotification($event)"
              @error="showNotification($event, 'error')" />
            <GestionSesiones v-if="tab === 'sesiones'" :isDark="isDark" @success="showNotification($event)"
              @error="showNotification($event, 'error')" />
            <GestionMensajes v-if="tab === 'mensajes'" :isDark="isDark" @success="showNotification($event)"
              @error="showNotification($event, 'error')" />
            <GestionRecordatorios v-if="tab === 'recordatorios'" :isDark="isDark" @success="showNotification($event)"
              @error="showNotification($event, 'error')" />
            <GestionSolicitudes v-if="tab === 'solicitudes'" :isDark="isDark" @success="showNotification($event)"
              @error="showNotification($event, 'error')" />
            <ModuloReportesFalla v-if="tab === 'reportes'" :isDark="isDark" />
            <GestionChecklistOffboarding v-if="tab === 'offboarding'" :isDark="isDark" />
          </div>
        </template>

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
/* ══ LAYOUT RAÍZ ══ */
.sa-root {
  display: flex;
  height: 100vh;
  overflow: hidden;
  font-family: 'Inter', system-ui, sans-serif;
}

.sa-dark {
  background: #0B0F19;
  color: #fff;
}

.sa-light {
  background: #f1f5f9;
  color: #1e293b;
}

/* ══ TOAST ══ */
.sa-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  border-radius: 14px;
  border: 1px solid;
  backdrop-filter: blur(16px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  font-size: 11px;
  font-weight: 700;
}

.sa-toast-ok {
  background: rgba(6, 78, 59, .9);
  border-color: rgba(52, 211, 153, .25);
  color: #6ee7b7;
}

.sa-toast-err {
  background: rgba(127, 29, 29, .9);
  border-color: rgba(252, 165, 165, .25);
  color: #fca5a5;
}

.toast-enter-active,
.toast-leave-active {
  transition: all .3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* ══ SIDEBAR ══ */
.sa-sidebar {
  position: relative;
  z-index: 50;
  height: 100vh;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width .3s ease;
  overflow: visible;
  border-right: 1px solid;
}

/* El nav interior sí hace scroll pero sin clip al botón que sobresale */
.sa-sidebar > .sa-nav {
  overflow-y: auto;
  overflow-x: hidden;
}

.sa-sidebar-dark {
  background: #161B26;
  border-color: #222938;
}

.sa-sidebar-light {
  background: #fff;
  border-color: #e2e8f0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
}

.sa-sidebar-open {
  width: 220px;
}

.sa-sidebar-closed {
  width: 0;
}

@media(min-width:1024px) {
  .sa-sidebar-closed {
    width: 60px;
  }
}

/* Colapsar */
.sa-collapse-btn {
  position: absolute;
  right: -13px;
  top: 28px;
  z-index: 60;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1.5px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .2s;
  box-shadow: 0 2px 6px rgba(0,0,0,0.18);
}

.sa-collapse-dark {
  background: #1e2638;
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.6);
}

.sa-collapse-light {
  background: #fff;
  border-color: #cbd5e1;
  color: #64748b;
}

.sa-collapse-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59,130,246,0.25);
}

/* Brand */
.sa-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 14px 14px;
  flex-shrink: 0;
}

.sa-brand-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
}

.sa-brand-name {
  font-size: 13px;
  font-weight: 900;
  letter-spacing: -.02em;
  text-transform: uppercase;
  line-height: 1;
}

.sa-brand-sub {
  font-size: 8px;
  font-weight: 600;
  letter-spacing: .2em;
  text-transform: uppercase;
  opacity: .3;
  margin-top: 2px;
}

/* Divisor */
.sa-divider {
  margin: 0 12px 8px;
  height: 1px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.06);
}

.sa-light .sa-divider {
  background: #f1f5f9;
}

/* Nav */
.sa-nav {
  flex: 1;
  padding: 0 8px;
  overflow-y: auto;
  overflow-x: hidden;
}

.sa-nav::-webkit-scrollbar {
  display: none;
}

.sa-nav {
  scrollbar-width: none;
}

/* Grupo de navegación */
.sa-nav-group {
  margin-bottom: 10px;
}

.sa-nav-group:last-child {
  margin-bottom: 0;
}

.sa-nav-group-label {
  font-size: 8px;
  font-weight: 900;
  letter-spacing: .25em;
  text-transform: uppercase;
  opacity: .35;
  padding: 0 10px;
  margin-bottom: 6px;
  margin-top: 2px;
}

.sa-sidebar-dark .sa-nav-group-label {
  color: #94a3b8;
}

.sa-sidebar-light .sa-nav-group-label {
  color: #64748b;
}

/* Separador entre grupos cuando sidebar está colapsado (solo desktop) */
.sa-nav-group-divider {
  height: 1px;
  margin: 6px 12px 8px;
  background: rgba(255, 255, 255, 0.06);
}

.sa-sidebar-light .sa-nav-group-divider {
  background: #e2e8f0;
}

.sa-nav-group:first-child .sa-nav-group-divider {
  display: none !important;
}

.sa-nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border-radius: 10px;
  margin-bottom: 2px;
  position: relative;
  cursor: pointer;
  border: none;
  background: none;
  transition: all .15s ease;
  overflow: hidden;
}

/* Activo dark (Geist): fondo iluminado sutil */
.sa-nav-active-dark {
  background: rgba(255, 255, 255, 0.04);
  color: #ffffff;
}

/* Activo light: gris claro sobre sidebar blanco */
.sa-nav-active-light {
  background: #f4f4f5;
  color: #09090b;
}

.sa-nav-idle-dark {
  color: #888888;
  transition: all 0.2s ease;
}

.sa-nav-idle-dark:hover {
  background: rgba(255, 255, 255, 0.03);
  color: #ffffff;
}

.sa-nav-idle-light {
  color: #6b7280;
  transition: all 0.2s ease;
}

.sa-nav-idle-light:hover {
  background: #fafafa;
  color: #09090b;
}

/* Línea vertical 2px azul de marca — Geist style, sin glow */
.sa-nav-bar {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 18px;
  border-radius: 0;
  background: #3b82f6;
}

.sa-nav-icon {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.sa-nav-icon-active {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.sa-nav-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .05em;
  text-transform: uppercase;
  white-space: nowrap;
}

/* Sección dev */
.sa-section-label {
  font-size: 8px;
  font-weight: 900;
  letter-spacing: .25em;
  text-transform: uppercase;
  opacity: .25;
  padding: 0 8px;
  margin-bottom: 4px;
}

.sa-dev-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  margin-bottom: 2px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  border: none;
  background: none;
  cursor: pointer;
  transition: color .15s;
}

.sa-sidebar-dark .sa-dev-btn {
  color: #94a3b8;
}

.sa-sidebar-dark .sa-dev-btn:hover {
  color: #cbd5e1;
}

.sa-sidebar-light .sa-dev-btn {
  color: #64748b;
}

.sa-sidebar-light .sa-dev-btn:hover {
  color: #334155;
}

/* Footer sidebar */
.sa-sidebar-footer {
  padding: 8px 8px 14px;
  border-top: 1px solid;
  flex-shrink: 0;
}

.sa-footer-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  margin-bottom: 2px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  border: none;
  background: none;
  cursor: pointer;
  transition: all .15s;
}

.sa-footer-btn-dark {
  color: rgba(255, 255, 255, 0.35);
}

.sa-footer-btn-dark:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.sa-footer-btn-light {
  color: #94a3b8;
}

.sa-footer-btn-light:hover {
  color: #1e293b;
  background: #f1f5f9;
}

.sa-logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: rgba(239, 68, 68, 0.5);
  border: none;
  background: none;
  cursor: pointer;
  transition: all .15s;
}

.sa-logout-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

/* ══ MAIN ══ */
.sa-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

/* Header */
.sa-header {
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid;
}

.sa-header-dark {
  background: #161B26;
  border-color: #222938;
}

.sa-header-light {
  background: #fff;
  border-color: #e2e8f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.sa-breadcrumb-root {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .15em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.sa-breadcrumb-page {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.sa-status-badge {
  display: none;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid rgba(52, 211, 153, 0.25);
  background: rgba(52, 211, 153, 0.06);
}

@media(min-width:640px) {
  .sa-status-badge {
    display: flex;
  }
}

.sa-theme-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .2s;
}

.sa-theme-dark {
  border-color: #222938;
  background: rgba(255, 255, 255, 0.04);
}

.sa-theme-dark:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sa-theme-light {
  border-color: #e2e8f0;
  background: #f8fafc;
}

.sa-theme-light:hover {
  background: #e2e8f0;
}

.sa-user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-radius: 12px;
  border: 1px solid;
  cursor: default;
}

.sa-user-dark {
  border-color: #222938;
  background: rgba(255, 255, 255, 0.04);
}

.sa-user-light {
  border-color: #e2e8f0;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.sa-user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  flex-shrink: 0;
  background: rgba(59, 130, 246, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ══ CONTENIDO ══ */
.sa-content {
  flex: 1;
  min-height: 0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
}

.sa-content-dark {
  background: #0B0F19;
}

.sa-content-light {
  background: #f1f5f9;
}

/* ══ CARD / CONTAINER MÓDULOS ══ */
/* Todos los cards llenan el área de contenido */
.sa-card {
  flex: 1;
  min-height: 0;
  border-radius: 14px;
  border: 1px solid;
  overflow: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

/* Módulos de altura completa: sin padding, el módulo llena borde a borde */
.sa-card-full {
  padding: 0;
}

.sa-card-dark {
  background: #0B0F19;
  border-color: #222938;
}

.sa-card-light {
  background: #f8fafc;
  border-color: #e2e8f0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
}

/* Dropdown usuario */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all .18s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>
