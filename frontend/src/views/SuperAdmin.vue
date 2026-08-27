<script setup>
import { apiFetch } from '@/utils/apiFetch.js';
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

// ── Constantes de navegación (agrupadas por categoría) ───────────────────────
const NAV_GROUPS = [
  {
    label: 'Gestión',
    collapsible: true,
    items: {
      stats: { icon: 'fas fa-chart-pie', label: 'Dashboard', color: 'text-blue-400', bg: 'bg-blue-500/10' },
      users: { icon: 'fas fa-users', label: 'Personal', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
      estructura: { icon: 'fas fa-sitemap', label: 'Organización', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
      companies: { icon: 'fas fa-building-columns', label: 'Empresas', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    },
  },
  {
    label: 'Operación',
    collapsible: true,
    items: {
      mallas: { icon: 'fas fa-calendar-days', label: 'Mallas', color: 'text-amber-400', bg: 'bg-amber-500/10' },
      paramhx: { icon: 'fas fa-business-time', label: 'Param. Horas Extra', color: 'text-lime-400', bg: 'bg-lime-500/10' },
      solicitudes: { icon: 'fas fa-inbox', label: 'Solicitudes', color: 'text-orange-400', bg: 'bg-orange-500/10' },
      analitica: { icon: 'fas fa-chart-line', label: 'Analítica HR', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
      sesiones: { icon: 'fas fa-lock', label: 'Sesiones', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    },
  },
  {
    label: 'Comunicación',
    collapsible: true,
    items: {
      notifications: { icon: 'fas fa-bell', label: 'Avisos', color: 'text-rose-400', bg: 'bg-rose-500/10' },
      mensajes: { icon: 'fas fa-message', label: 'Mensajes', color: 'text-sky-400', bg: 'bg-sky-500/10' },
      recordatorios: { icon: 'fas fa-clock', label: 'Recordatorios', color: 'text-violet-400', bg: 'bg-violet-500/10' },
    },
  },
  {
    label: 'Cron & Jobs',
    collapsible: true,
    items: {
      cronhoras: { icon: 'fas fa-business-time', label: 'Cálculo Horas Extra', color: 'text-orange-400', bg: 'bg-orange-500/10' },
      sync: { icon: 'fas fa-rotate', label: 'Sync Automático', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
      reporteworkers: { icon: 'fas fa-microchip', label: 'Workers de Reporte', color: 'text-blue-400', bg: 'bg-blue-500/10' },
      cronasistencia: { icon: 'fas fa-user-clock', label: 'Resumen Asistencia', color: 'text-teal-400', bg: 'bg-teal-500/10' },
    },
  },
  {
    label: 'Sistema',
    collapsible: true,
    items: {
      apk: { icon: 'fab fa-android', label: 'APK', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      api: { icon: 'fas fa-plug', label: 'API Externa', color: 'text-teal-400', bg: 'bg-teal-500/10' },
      datoscrudos: { icon: 'fas fa-database', label: 'Datos de Odoo', color: 'text-amber-400', bg: 'bg-amber-500/10' },
      config: { icon: 'fas fa-sliders', label: 'Configuración', color: 'text-slate-400', bg: 'bg-slate-500/10' },
      modulos: { icon: 'fas fa-puzzle-piece', label: 'Módulos', color: 'text-violet-400', bg: 'bg-violet-500/10' },
      reportes: { icon: 'fas fa-triangle-exclamation', label: 'Rep. Falla', color: 'text-red-400', bg: 'bg-red-500/10' },
      offboarding: { icon: 'fas fa-list-check', label: 'Checklist Offboarding', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    },
  },
];

// Grupos colapsables: qué grupos están CERRADOS ahora mismo (por label).
// Vacío por defecto = todos abiertos (no cambia el comportamiento actual
// hasta que el usuario colapse alguno explícitamente).
const gruposColapsados = ref(new Set());
const toggleGrupo = (label) => {
  const s = new Set(gruposColapsados.value);
  s.has(label) ? s.delete(label) : s.add(label);
  gruposColapsados.value = s;
};

// Mapa plano para acceso rápido por key (icon/label en otros lugares del código)
const NAV_ITEMS = NAV_GROUPS.reduce((acc, g) => ({ ...acc, ...g.items }), {});

const MODULE_LABELS = {
  stats: 'Dashboard', apk: 'APK', companies: 'Empresas', users: 'Personal',
  notifications: 'Avisos', estructura: 'Organización', mallas: 'Mallas',
  analitica: 'Analítica HR', sesiones: 'Sesiones', mensajes: 'Mensajes',
  recordatorios: 'Recordatorios', config: 'Configuración', api: 'API Externa',
  modulos: 'Módulos & Permisos', solicitudes: 'Solicitudes', reportes: 'Rep. de Falla',
  offboarding: 'Checklist Offboarding', sync: 'Sync Automático',
  paramhx: 'Parametrización Horas Extra',
  cronhoras: 'Cálculo Automático Horas Extra',
  reporteworkers: 'Workers de Reporte de Asistencias',
  cronasistencia: 'Resumen Nocturno de Asistencia',
  datoscrudos: 'Datos Crudos (Odoo)',
};
import { bgLines } from '../utils/bgLines.js';
import { useAttendance } from '../composables/UserLogica/useAttendance.js';
import { useUsuariosSync } from '../composables/adminLogica/useUsuariosSync.js';
import { useOrganizacion } from '../composables/adminLogica/useOrganizacion.js';
import GestionEstructura from '../components/admin/SuperAdmin/GestionEstructura.vue';
import Notificaciones from '../components/admin/SuperAdmin/GestionNotificaciones.vue';
import GestionApk from '../components/admin/SuperAdmin/GestionApk.vue';
import GestionCompanias from '../components/admin/SuperAdmin/GestionCompanias.vue';
import GestionUsuarios from '../components/admin/SuperAdmin/GestionUsuarios.vue';
import GestionDashboard from '../components/admin/SuperAdmin/GestionDashboard.vue';
import GestionSyncCron from '../components/admin/SuperAdmin/GestionSyncCron.vue';
import GestionCronHoras from '../components/admin/SuperAdmin/GestionCronHoras.vue';
import GestionReporteWorkers from '../components/admin/SuperAdmin/GestionReporteWorkers.vue';
import GestionAsistenciaCron from '../components/admin/SuperAdmin/GestionAsistenciaCron.vue';
import GestionDatosCrudos from '../components/admin/SuperAdmin/GestionDatosCrudos.vue';
import GestionPermisos from '../components/admin/SuperAdmin/GestionPermisos.vue';
import GestionMallas from '../components/admin/SuperAdmin/GestionMallas.vue';
import GestionConfiguraciones from '../components/admin/SuperAdmin/GestionConfiguraciones.vue';
import GestionChecklistOffboarding from '../components/admin/SuperAdmin/GestionChecklistOffboarding.vue';
import GestionOffboardingCron from '../components/admin/SuperAdmin/GestionOffboardingCron.vue';
import GestionApiExterna from '../components/admin/SuperAdmin/GestionApiExterna.vue';
import GestionAnalitica from '../components/admin/SuperAdmin/GestionAnalitica.vue';
import GestionSesiones from '../components/admin/SuperAdmin/GestionSesiones.vue';
import GestionMensajes from '../components/admin/SuperAdmin/GestionMensajes.vue';
import GestionRecordatorios from '../components/admin/SuperAdmin/GestionRecordatorios.vue';
import GestionSolicitudes from '../components/admin/SuperAdmin/GestionSolicitudes.vue';
import GestionModulos from '../components/admin/SuperAdmin/GestionModulos.vue';
import GestionParametrosHorasExtra from '../components/admin/SuperAdmin/GestionParametrosHorasExtra.vue';
import ModuloReportesFalla from '../components/admin/ModuloReportesFalla.vue';
import '../assets/css/admin-style.css';
import '../assets/css/superAdmin.css';


// --- 1. CONFIGURACIÓN ---
const API_URL = import.meta.env.VITE_API_URL;

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
  paramhx: 'super.parametroshx',
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
  sync: 'super.superadmin',
  cronhoras: 'super.superadmin',
  reporteworkers: 'super.superadmin',
  cronasistencia: 'super.superadmin',
  datoscrudos: 'super.datoscrudos',
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
  selectedUserPerms.value = user;
};

const showLogoutModal = ref(false);

const confirmarLogout = () => {
  showUserMenu.value = false;
  showLogoutModal.value = true;
};

const doLogout = () => {
  showLogoutModal.value = false;
  logout();
};
const hasPerm = (user, slug) => {
  if (!user || !user.permisos) return false;
  return user.permisos.some((p) => p.modulos === slug);
};
// --- Estado Local Restante ---
const isSidebarOpen = ref(true);
const showUserMenu = ref(false);

// ── Modal cambio de contraseña (SuperAdmin) ───────────────────────────────────
const showCambioPasswordSA = ref(false);
const pwFormSA = reactive({
  nueva: '', confirmar: '', loading: false,
  error: '', success: '', showNueva: false, showConfirmar: false,
});

const cerrarCambioPasswordSA = () => {
  showCambioPasswordSA.value = false;
  pwFormSA.nueva = ''; pwFormSA.confirmar = '';
  pwFormSA.error = ''; pwFormSA.success = '';
  pwFormSA.showNueva = false; pwFormSA.showConfirmar = false;
};

const guardarPasswordSA = async () => {
  pwFormSA.error = ''; pwFormSA.success = '';
  if (!pwFormSA.nueva || pwFormSA.nueva.length < 6) {
    pwFormSA.error = 'La contraseña debe tener al menos 6 caracteres'; return;
  }
  if (pwFormSA.nueva !== pwFormSA.confirmar) {
    pwFormSA.error = 'Las contraseñas no coinciden'; return;
  }
  pwFormSA.loading = true;
  try {
    const res = await apiFetch(`${API_URL}/cambiar-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_odoo: employee.value?.id_odoo,
        nueva_password: pwFormSA.nueva,
        confirmar_password: pwFormSA.confirmar,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      pwFormSA.success = 'Contraseña actualizada correctamente';
      setTimeout(() => cerrarCambioPasswordSA(), 1500);
    } else {
      pwFormSA.error = data.message || 'Error al cambiar la contraseña';
    }
  } catch {
    pwFormSA.error = 'Error de conexión';
  } finally {
    pwFormSA.loading = false;
  }
};

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

// Estado de guardado/confirmación POR permiso (no un solo valor global) — así
// si el admin activa varios toggles seguidos antes de que el primero
// termine, cada fila mantiene su propio spinner/check sin pisarse.
const savingPermSlugs = ref(new Set());
const permFeedback = reactive({}); // { [slug]: 'ok' | 'error' }

const togglePermisoLocal = async (user, slug) => {
  const activo = !hasPerm(user, slug);
  savingPermSlugs.value.add(slug);
  delete permFeedback[slug];
  try {
    const session = JSON.parse(localStorage.getItem("user_session") || "{}");
    const res = await apiFetch(`${API_URL}/asignar-permiso`, {
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

    // Cargar los permisos actualizados desde el backend
    const baseUrl = API_URL?.replace('/usuarios', '');
    const permRes = await apiFetch(`${baseUrl}/usuarios/permisos/${user.id_odoo}`);
    const permisos = await permRes.json();

    // Actualizar el usuario seleccionado con permisos reales
    const actualizado = dbUsuarios.value.find(
      (u) => u.id_odoo === user.id_odoo,
    );
    if (actualizado) {
      actualizado.permisos = Array.isArray(permisos) ? permisos : [];
      selectedUserPerms.value = { ...actualizado };
    }

    permFeedback[slug] = 'ok';
    showNotification(`Permiso ${activo ? "asignado" : "removido"}`);
  } catch (e) {
    permFeedback[slug] = 'error';
    showNotification("Error al actualizar permiso", "error");
  } finally {
    savingPermSlugs.value.delete(slug);
    setTimeout(() => { delete permFeedback[slug]; }, 1800);
  }
};

const updateUserStructure = async (user, field) => {
  try {
    const res = await apiFetch(`${API_URL}/actualizar-estructura`, {
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

// Cierra el dropdown de usuario al hacer click fuera o presionar Escape
const userMenuRef = ref(null);
const handleClickOutside = (e) => {
  if (showUserMenu.value && userMenuRef.value && !userMenuRef.value.contains(e.target)) {
    showUserMenu.value = false;
  }
};
const handleEscape = (e) => {
  if (e.key === 'Escape') {
    showUserMenu.value = false;
    showLogoutModal.value = false;
  }
};

// --- Entorno / base de datos activa (solo nombres, sin credenciales) ---
const entornoInfo = ref({ entorno: null, database: null });

const fetchEntorno = async () => {
  try {
    const base = API_URL.replace('/usuarios', '');
    const res = await apiFetch(`${base}/entorno`);
    entornoInfo.value = await res.json();
  } catch (e) {
    console.error('Error cargando info de entorno:', e);
  }
};

const ENTORNO_LABELS = { production: 'Producción', qa: 'QA', development: 'Desarrollo' };
const entornoLabel = computed(() => ENTORNO_LABELS[entornoInfo.value.entorno] || entornoInfo.value.entorno || '—');
const entornoColor = computed(() => {
  if (entornoInfo.value.entorno === 'production') return 'red';
  if (entornoInfo.value.entorno === 'qa') return 'amber';
  return 'emerald';
});

// --- Carga Inicial ---
onMounted(async () => {
  document.addEventListener('click', handleClickOutside, true);
  document.addEventListener('keydown', handleEscape);
  await Promise.all([
    fetchDbUsuarios(),
    fetchOrganizacion(),
    fetchOdooUsuarios(),
    fetchEntorno(),
  ]);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true);
  document.removeEventListener('keydown', handleEscape);
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
      style="background:#102E4A">
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
            Woden<span style="color:#FF5400">Track</span>
          </p>
          <p class="sa-brand-sub">Consola Admin</p>
        </div>
      </div>

      <div class="sa-divider"></div>

      <!-- Nav items (agrupados por categoría) -->
      <nav class="sa-nav">
        <template v-for="(group, gIdx) in NAV_GROUPS" :key="group.label">
          <!-- Label de grupo (solo si hay items accesibles) -->
          <div v-if="groupHasAccess(group)" class="sa-nav-group">
            <!-- Label de grupo NORMAL (no colapsable) -->
            <p v-if="isSidebarOpen && !group.collapsible" class="sa-nav-group-label">{{ group.label }}</p>

            <!-- Label de grupo COLAPSABLE: clickeable, con flecha.
                 La flecha es un triángulo CSS puro (sin depender de ninguna
                 fuente de íconos) para que nunca falle su renderizado. -->
            <button v-if="isSidebarOpen && group.collapsible" @click="toggleGrupo(group.label)"
              class="sa-nav-group-label sa-nav-group-toggle">
              <span class="sa-nav-group-toggle-label">{{ group.label }}</span>
              <span class="sa-nav-group-arrow"
                :class="{ 'sa-nav-group-arrow-closed': gruposColapsados.has(group.label) }"></span>
            </button>

            <div v-if="!isSidebarOpen" class="sa-nav-group-divider lg:block hidden"></div>

            <div v-if="!group.collapsible || !gruposColapsados.has(group.label)">
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
                      ? (currentTab === key ? 'color:#FF9A66' : 'color:#8b9ab4')
                      : (currentTab === key ? 'color:#102E4A' : 'color:#64748B')"></i>
                  </div>
                  <span v-if="isSidebarOpen" class="sa-nav-label">{{ item.label }}</span>
                </button>
              </template>
            </div>
          </div>
        </template>
      </nav>

      <div class="sa-divider"></div>

      <!-- Dev Nav: solo superadmin (root) -->
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

      <!-- Otros accesos: usuarios que entran a Super Admin por un permiso de
           módulo puntual (no son el root/isSuperAdmin) también necesitan una
           forma de volver a Admin/Marcación. -->
      <div v-else class="px-2 pb-1 shrink-0">
        <p v-if="isSidebarOpen" class="sa-section-label">Otros accesos</p>
        <button v-for="d in [
          ...(employee?.role === 'admin' || employee?.permisos?.['admin.admin']
            ? [{ path: '/admin', icon: 'fas fa-user-shield', label: 'Admin' }]
            : []),
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
          <span class="sa-breadcrumb-root" :class="isDark ? 'text-white/40' : 'text-slate-400'">WodenAdmin</span>
          <i class="fas fa-chevron-right text-[7px] opacity-20 shrink-0"></i>
          <span class="sa-breadcrumb-page" :class="isDark ? 'text-white' : 'text-slate-800'">
            {{ MODULE_LABELS[currentTab] ?? currentTab }}
          </span>
        </div>

        <!-- Derecha: 1-Sistema Activo · 2-Tema · 3-Usuario (con dropdown) -->
        <div class="flex items-center gap-2 shrink-0">
          <!-- 1. Sistema activo: entorno (.env) + nombre de la BD, sin credenciales -->
          <div v-if="entornoInfo.entorno" class="sa-env-chip"
            :class="[`sa-env-${entornoColor}`, isDark ? 'sa-env-dark' : 'sa-env-light']"
            :title="`Entorno: ${entornoLabel} · Base de datos: ${entornoInfo.database || '—'}`">
            <span class="sa-env-label">{{ entornoLabel }}</span>
            <span class="sa-env-sep"></span>
            <span class="sa-env-db">{{ entornoInfo.database || '—' }}</span>
          </div>

          <!-- 2. Toggle tema — solo ícono, sin texto -->
          <button @click="toggleTheme" class="sa-theme-btn" :class="isDark ? 'sa-theme-dark' : 'sa-theme-light'"
            title="Cambiar tema">
            <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'" class="text-[11px]"
              :style="isDark ? 'color:#facc15' : 'color:#818cf8'"></i>
          </button>

          <!-- 3. Usuario con dropdown -->
          <div class="relative" v-if="employee?.name" ref="userMenuRef">
            <button @click="showUserMenu = !showUserMenu" class="sa-user-chip"
              :class="isDark ? 'sa-user-dark' : 'sa-user-light'">
              <div class="sa-user-avatar">
                <span class="text-[10px] font-black" :style="isDark ? 'color:#FF9A66' : 'color:#102E4A'">
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
              <div v-if="showUserMenu" class="absolute right-0 top-full mt-2 w-44 rounded-xl py-1 z-50"
                :class="isDark ? 'bg-[#111C2E] shadow-[0_10px_28px_rgba(0,0,0,0.35)]' : 'bg-white shadow-[0_8px_24px_rgba(16,46,74,0.08)]'">
                <div class="px-3 py-2 border-b" :class="isDark ? 'border-white/[0.06]' : 'border-[#EEF2F6]'">
                  <p class="text-[9px] font-bold uppercase tracking-widest opacity-40"
                    :class="isDark ? 'text-white' : 'text-[#64748B]'">{{ displayRole }}</p>
                  <p class="text-[11px] font-bold mt-0.5" :class="isDark ? 'text-white' : 'text-[#10233A]'">{{
                    displayName
                  }}</p>
                </div>
                <button @click="showUserMenu = false; showCambioPasswordSA = true"
                  class="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-medium transition-colors"
                  :class="isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]' : 'text-[#31445A] hover:text-[#102E4A] hover:bg-[#F7FAFD]'">
                  <i class="fas fa-key text-[10px]"></i>
                  Cambiar contraseña
                </button>
                <div class="h-px mx-2 my-1" :class="isDark ? 'bg-[#1e293b]' : 'bg-[#EEF2F6]'"></div>
                <button @click="confirmarLogout"
                  class="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-rose-500 hover:bg-rose-500/10 transition-colors">
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

        <!-- Fondo: mallado geométrico muy sutil (mismo estilo del login).
             Decoración secundaria, detrás de las tarjetas — el contenido
             sigue siendo el protagonista. -->
        <svg class="sa-content-bg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <line v-for="(l, i) in bgLines" :key="i" :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2"
            :stroke="isDark ? 'rgba(255,255,255,0.035)' : 'rgba(16,46,74,0.05)'" stroke-width="1"
            vector-effect="non-scaling-stroke" />
        </svg>

        <!-- Módulos de contenido normal -->
        <template
          v-for="tab in ['stats', 'apk', 'companies', 'notifications', 'estructura', 'api', 'modulos', 'sync', 'cronhoras', 'reporteworkers', 'cronasistencia']"
          :key="tab">
          <div v-if="currentTab === tab && canAccess(tab)" class="sa-card"
            :class="isDark ? 'sa-card-dark' : 'sa-card-light'">
            <GestionDashboard v-if="tab === 'stats'" :isDark="isDark" />
            <GestionApk v-if="tab === 'apk'" :isDark="isDark" @success="showNotification($event)"
              @error="showNotification($event, 'error')" />
            <GestionCompanias v-if="tab === 'companies'" :isDark="isDark" @success="showNotification($event)"
              @error="showNotification($event, 'error')" />
            <Notificaciones v-if="tab === 'notifications'" :isDark="isDark" :apiUrl="API_URL"
              @notification-sent="showNotification('Notificación enviada')" />
            <GestionEstructura v-if="tab === 'estructura'" :key="areas.length" :isDark="isDark" :usuarios="dbUsuarios"
              :areas="areas" :segmentos="segmentos" :areasAgrupadas="areasAgrupadas"
              :departamentosDisponibles="segmentos.map(s => s.nombre)" @save="handleSaveEstructura"
              @update-area="handleUpdateArea" @refresh="fetchOrganizacion" />
            <GestionApiExterna v-if="tab === 'api'" :isDark="isDark" @success="showNotification($event)"
              @error="showNotification($event, 'error')" />
            <GestionModulos v-if="tab === 'modulos'" :isDark="isDark" :apiUrl="API_URL"
              @success="showNotification($event)" @error="showNotification($event, 'error')" />
            <GestionSyncCron v-if="tab === 'sync'" :isDark="isDark" />
            <GestionCronHoras v-if="tab === 'cronhoras'" :isDark="isDark" />
            <GestionReporteWorkers v-if="tab === 'reporteworkers'" :isDark="isDark" />
            <GestionAsistenciaCron v-if="tab === 'cronasistencia'" :isDark="isDark" />
          </div>
        </template>

        <!-- Módulos de altura completa -->
        <template
          v-for="tab in ['mallas', 'paramhx', 'analitica', 'config', 'users', 'sesiones', 'mensajes', 'recordatorios', 'solicitudes', 'reportes', 'offboarding', 'datoscrudos']"
          :key="tab">
          <div v-if="currentTab === tab && canAccess(tab)" class="sa-card sa-card-full"
            :class="isDark ? 'sa-card-dark' : 'sa-card-light'">
            <GestionMallas v-if="tab === 'mallas'" :isDark="isDark" @success="showNotification($event)"
              @error="showNotification($event, 'error')" />
            <GestionParametrosHorasExtra v-if="tab === 'paramhx'" :isDark="isDark" />
            <GestionAnalitica v-if="tab === 'analitica'" :isDark="isDark" @success="showNotification($event)"
              @error="showNotification($event, 'error')" />
            <GestionConfiguraciones v-if="tab === 'config'" :isDark="isDark" @success="showNotification($event)"
              @error="showNotification($event, 'error')" />
            <GestionUsuarios v-if="tab === 'users'" :isDark="isDark" @success="showNotification($event)"
              @error="showNotification($event, 'error')" @open-perms="openPerms($event)" />
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
            <GestionDatosCrudos v-if="tab === 'datoscrudos'" :isDark="isDark" />
          </div>
        </template>

      </div>
    </main>

    <!-- ── Modal Cambiar Contraseña (SuperAdmin) ─────────────────────────────── -->
    <teleport to="body">
      <transition name="fade">
        <div v-if="showCambioPasswordSA"
          class="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          @click.self="cerrarCambioPasswordSA">
          <div class="w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden"
            :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
            <div class="flex items-center justify-between px-5 py-4 border-b"
              :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <i class="fas fa-key text-blue-500 text-xs"></i>
                </div>
                <span class="text-sm font-bold" :class="isDark ? 'text-white' : 'text-slate-800'">Cambiar
                  contraseña</span>
              </div>
              <button @click="cerrarCambioPasswordSA"
                class="w-7 h-7 rounded-lg flex items-center justify-center opacity-40 hover:opacity-100 transition-colors"
                :class="isDark ? 'text-white hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'">
                <i class="fas fa-xmark text-xs"></i>
              </button>
            </div>
            <div class="px-5 py-4 space-y-3.5">
              <p class="text-[11px] leading-relaxed" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                Al establecer una contraseña personal, deberás usarla para ingresar en lugar de tu cédula.
              </p>
              <div class="space-y-1">
                <label class="text-[11px] font-semibold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">Nueva
                  contraseña</label>
                <div class="relative">
                  <input v-model="pwFormSA.nueva" :type="pwFormSA.showNueva ? 'text' : 'password'"
                    placeholder="Mínimo 6 caracteres"
                    class="w-full h-10 rounded-xl px-3 pr-10 text-xs border outline-none transition-all"
                    :class="isDark ? 'bg-[#0B1120]/60 border-[#222938] text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'" />
                  <button type="button" @click="pwFormSA.showNueva = !pwFormSA.showNueva"
                    class="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity"
                    :class="isDark ? 'text-white' : 'text-slate-500'">
                    <i :class="pwFormSA.showNueva ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-xs"></i>
                  </button>
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-[11px] font-semibold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">Confirmar
                  contraseña</label>
                <div class="relative">
                  <input v-model="pwFormSA.confirmar" :type="pwFormSA.showConfirmar ? 'text' : 'password'"
                    placeholder="Repite la contraseña"
                    class="w-full h-10 rounded-xl px-3 pr-10 text-xs border outline-none transition-all"
                    :class="isDark ? 'bg-[#0B1120]/60 border-[#222938] text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'" />
                  <button type="button" @click="pwFormSA.showConfirmar = !pwFormSA.showConfirmar"
                    class="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity"
                    :class="isDark ? 'text-white' : 'text-slate-500'">
                    <i :class="pwFormSA.showConfirmar ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-xs"></i>
                  </button>
                </div>
              </div>
              <transition name="fade">
                <p v-if="pwFormSA.error" class="text-[11px] text-rose-500 flex items-center gap-1.5">
                  <i class="fas fa-circle-exclamation"></i> {{ pwFormSA.error }}
                </p>
                <p v-else-if="pwFormSA.success" class="text-[11px] text-emerald-500 flex items-center gap-1.5">
                  <i class="fas fa-circle-check"></i> {{ pwFormSA.success }}
                </p>
              </transition>
            </div>
            <div class="px-5 pb-5 flex gap-2.5">
              <button @click="cerrarCambioPasswordSA"
                class="flex-1 h-9 rounded-xl text-xs font-semibold border transition-all"
                :class="isDark ? 'border-[#222938] text-slate-400 hover:text-white hover:border-slate-500' : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300'">
                Cancelar
              </button>
              <button @click="guardarPasswordSA" :disabled="pwFormSA.loading"
                class="flex-1 h-9 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                <div v-if="pwFormSA.loading"
                  class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span v-else><i class="fas fa-check mr-1"></i>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- ── Modal confirmación logout (estilo WodenTrack) ───────────────────── -->
    <Transition name="logout-fade">
      <div v-if="showLogoutModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style="background: rgba(16,46,74,0.45)" @click.self="showLogoutModal = false">

        <Transition name="logout-pop" appear>
          <div v-if="showLogoutModal" class="wt-modal" :class="isDark ? 'wt-modal-dark' : 'wt-modal-light'">

            <!-- Icono -->
            <div class="wt-modal-icon" :class="isDark ? 'wt-modal-icon-dark' : 'wt-modal-icon-light'">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <path d="M16 17L21 12L16 7"></path>
                <path d="M21 12H9"></path>
              </svg>
            </div>

            <!-- Texto -->
            <p class="wt-modal-title" :class="isDark ? 'text-white' : 'text-[#10233A]'">Cerrar sesión</p>
            <p class="wt-modal-text" :class="isDark ? 'text-slate-400' : 'text-[#64748B]'">
              ¿Confirmas que quieres cerrar la sesión? Necesitarás iniciar sesión de nuevo para volver a la consola.
            </p>

            <!-- Acciones -->
            <div class="wt-modal-actions">
              <button @click="showLogoutModal = false" class="wt-modal-btn"
                :class="isDark ? 'wt-modal-btn-secondary-dark' : 'wt-modal-btn-secondary-light'">
                Cancelar
              </button>
              <button @click="doLogout" class="wt-modal-btn wt-modal-btn-danger">
                Cerrar sesión
              </button>
            </div>

          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Panel de permisos -->
    <GestionPermisos v-model="selectedUserPerms" :isDark="isDark" :areas="areas" :segmentos="segmentos"
      :apiUrl="API_URL" :todosLosDepartamentos="departamentosUnicos" :savingPermSlugs="savingPermSlugs"
      :permFeedback="permFeedback" @toggle-perm="togglePermisoLocal($event.user, $event.slug)"
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
  background: #F7FAFD;
  color: #10233A;
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
.sa-sidebar>.sa-nav {
  overflow-y: auto;
  overflow-x: hidden;
}

.sa-sidebar-dark {
  background: #0B1120;
  border-color: #1e293b;
}

.sa-sidebar-light {
  background: #fff;
  border-color: #D7E0EA;
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
  top: 13px;
  z-index: 60;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1.5px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color .15s, color .15s;
}

.sa-collapse-dark {
  background: #1e2638;
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.6);
}

.sa-collapse-light {
  background: #fff;
  border-color: #D7E0EA;
  color: #64748B;
}

.sa-collapse-btn:hover {
  border-color: #102E4A;
  color: #102E4A;
}

/* Brand — misma altura que .sa-header (52px) para que la línea divisoria
   entre sidebar y header quede perfectamente alineada, sin escalón. */
.sa-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 14px;
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
  background: #102E4A;
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
  background: #E5EBF2;
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

.sa-nav-group-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  opacity: .7;
  transition: opacity .15s;
}

.sa-nav-group-toggle:hover {
  opacity: 1;
}

.sa-nav-group-toggle-label {
  flex: 1;
  text-align: left;
}

/* Flecha en CSS puro (triángulo por bordes) — no depende de ninguna fuente de
   íconos, así que nunca puede fallar en renderizar. */
.sa-nav-group-arrow {
  width: 0;
  height: 0;
  flex-shrink: 0;
  border-left: 3px solid transparent;
  border-right: 3px solid transparent;
  border-top: 4px solid currentColor;
  transition: transform .15s ease;
}

.sa-nav-group-arrow-closed {
  transform: rotate(-90deg);
}

/* Separador entre grupos cuando sidebar está colapsado (solo desktop) */
.sa-nav-group-divider {
  height: 1px;
  margin: 6px 12px 8px;
  background: rgba(255, 255, 255, 0.06);
}

.sa-sidebar-light .sa-nav-group-divider {
  background: #D7E0EA;
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

/* Activo light: azul muy claro de marca sobre sidebar blanco */
.sa-nav-active-light {
  background: #EEF4FB;
  color: #102E4A;
}

.sa-nav-idle-dark {
  color: #888888;
  transition: background-color .15s, color .15s;
}

.sa-nav-idle-dark:hover {
  background: rgba(255, 255, 255, 0.03);
  color: #ffffff;
}

.sa-nav-idle-light {
  color: #64748B;
  transition: background-color .15s, color .15s;
}

.sa-nav-idle-light:hover {
  background: #F7FAFD;
  color: #10233A;
}

/* Línea vertical 2px naranja de marca — acento del item activo, sin glow */
.sa-nav-bar {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 18px;
  border-radius: 0;
  background: #FF5400;
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
  background: #0B1120;
  border-color: #1e293b;
}

.sa-header-light {
  background: #fff;
  border-color: #E5EBF2;
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

.sa-env-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.sa-env-label {
  text-transform: uppercase;
  letter-spacing: .05em;
}

.sa-env-sep {
  width: 1px;
  height: 10px;
  flex-shrink: 0;
  background: currentColor;
  opacity: .25;
}

.sa-env-db {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-weight: 600;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sa-env-red {
  color: #ef4444;
}

.sa-env-amber {
  color: #f59e0b;
}

.sa-env-emerald {
  color: #22c55e;
}

.sa-env-dark.sa-env-red {
  background: rgba(239, 68, 68, .10);
}

.sa-env-dark.sa-env-amber {
  background: rgba(245, 158, 11, .10);
}

.sa-env-dark.sa-env-emerald {
  background: rgba(74, 222, 128, .10);
}

.sa-env-light.sa-env-red {
  background: rgba(239, 68, 68, .08);
}

.sa-env-light.sa-env-amber {
  background: rgba(245, 158, 11, .08);
}

.sa-env-light.sa-env-emerald {
  background: rgba(22, 163, 74, .08);
}

.sa-env-db {
  color: inherit;
  opacity: .85;
}

.sa-theme-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .2s;
}

.sa-theme-dark {
  background: rgba(255, 255, 255, 0.04);
}

.sa-theme-dark:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sa-theme-light {
  background: #EEF4FB;
}

.sa-theme-light:hover {
  background: #E3ECF7;
}

.sa-user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 5px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  background: transparent;
  transition: background-color .15s;
}

.sa-user-dark:hover {
  background: rgba(255, 255, 255, 0.05);
}

.sa-user-light:hover {
  background: #F7FAFD;
}

.sa-user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sa-light .sa-user-avatar {
  background: #EEF4FB;
}

.sa-dark .sa-user-avatar {
  background: rgba(255, 148, 77, 0.15);
}

/* ══ CONTENIDO ══ */
.sa-content {
  position: relative;
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
  background: #F7FAFD;
}

/* Mallado geométrico de fondo — decoración secundaria, muy sutil, detrás de
   las tarjetas (que son opacas y siguen siendo el protagonista). */
.sa-content-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* ══ CARD / CONTAINER MÓDULOS ══ */
/* Todos los cards llenan el área de contenido */
.sa-card {
  position: relative;
  z-index: 1;
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
  background: #fff;
  border-color: #D7E0EA;
  box-shadow: 0 8px 24px rgba(16, 46, 74, 0.06);
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

/* Modal logout — overlay */
.logout-fade-enter-active,
.logout-fade-leave-active {
  transition: opacity .2s ease;
}

.logout-fade-enter-from,
.logout-fade-leave-to {
  opacity: 0;
}

/* Modal logout — tarjeta */
.logout-pop-enter-active {
  transition: all .18s ease-out;
}

.logout-pop-leave-active {
  transition: all .12s ease-in;
}

.logout-pop-enter-from,
.logout-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── Modal de confirmación (cerrar sesión) — estilo WodenTrack ───────────── */
.wt-modal {
  width: 100%;
  max-width: 340px;
  border-radius: 14px;
  border: 1px solid;
  padding: 24px 22px 20px;
  text-align: center;
}

.wt-modal-light {
  background: #ffffff;
  border-color: #D7E0EA;
  box-shadow: 0 10px 30px rgba(16, 46, 74, 0.12);
}

.wt-modal-dark {
  background: #111C2E;
  border-color: #1e293b;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}

.wt-modal-icon {
  width: 44px;
  height: 44px;
  margin: 0 auto 14px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wt-modal-icon-light {
  background: #FEF1EC;
  color: #FF5400;
}

.wt-modal-icon-dark {
  background: rgba(255, 84, 0, 0.12);
  color: #FF9A66;
}

.wt-modal-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.wt-modal-text {
  margin-top: 6px;
  font-size: 12.5px;
  line-height: 1.5;
}

.wt-modal-actions {
  margin-top: 20px;
  display: flex;
  gap: 8px;
}

.wt-modal-btn {
  flex: 1;
  height: 40px;
  border-radius: 9px;
  border: none;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color .15s, color .15s;
}

.wt-modal-btn-secondary-light {
  background: #F7FAFD;
  border: 1px solid #D7E0EA;
  color: #10233A;
}

.wt-modal-btn-secondary-light:hover {
  background: #EEF4FB;
}

.wt-modal-btn-secondary-dark {
  background: transparent;
  border: 1px solid #1e293b;
  color: #cbd5e1;
}

.wt-modal-btn-secondary-dark:hover {
  background: rgba(255, 255, 255, 0.05);
}

.wt-modal-btn-danger {
  background: #dc2626;
  color: #ffffff;
}

.wt-modal-btn-danger:hover {
  background: #b91c1c;
}
</style>
