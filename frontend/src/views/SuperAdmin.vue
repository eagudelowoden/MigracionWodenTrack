<script setup>
import { ref, onMounted, watch } from 'vue'; // Importamos watch y quitamos computed (ya vienen del composable)
import { useAttendance } from '../composables/UserLogica/useAttendance.js';
import { useCompanies } from '../composables/adminLogica/useCompanies.js';
import { useUsuariosSync } from '../composables/adminLogica/useUsuariosSync.js';
import { useOrganizacion } from '../composables/adminLogica/useOrganizacion.js';
import GestionEstructura from '../components/admin/SuperAdmin/GestionEstructura.vue';
import Notificaciones from '../components/admin/SuperAdmin/GestionNotificaciones.vue';
import GestionApk from '../components/admin/SuperAdmin/GestionApk.vue';
import GestionCompanias from '../components/admin/SuperAdmin/GestionCompanias.vue';
import GestionUsuarios from '../components/admin/SuperAdmin/GestionUsuarios.vue';
import '../assets/css/admin-style.css';
import '../assets/css/SuperAdmin.css';
import axios from 'axios';
import { io } from 'socket.io-client';


// --- 1. CONFIGURACIÓN ---
const API_URL = import.meta.env.VITE_API_URL;

// --- 1. CONFIGURACIÓN DE SOCKETS Y NOTIFICACIONES ---
const SOCKET_URL = import.meta.env.VITE_API_URL
const notif = ref({ title: '', body: '', type: 'update' });
const notificationLogs = ref([]);
// --- Composables ---
const props = defineProps({ isDark: Boolean });
const { logout, isDark, toggleTheme } = useAttendance();


// 2. Extraer los métodos y estados
const {
  areas,
  segmentos,
  fetchDatos: fetchOrganizacion,
  crearArea,
  crearSegmento
} = useOrganizacion();

// 3. Crear la función puente para el evento @save del componente
const handleSaveEstructura = async (data) => {
  try {
    if (data.tipo === 'area') {
      await crearArea({ nombre: data.nombre, responsableId: data.responsableId });
    } else {
      await crearSegmento({ nombre: data.nombre, responsableId: data.responsableId });
    }
    showNotification(`${data.tipo.toUpperCase()} guardado con éxito`);
  } catch (e) {
    showNotification("Error al guardar la estructura", "error");
  }
};

// IMPORTANTE: Extraemos TODO lo necesario del composable de usuarios
// Eliminamos las declaraciones manuales de searchUser, selectedDept y los computed
const {
  dbUsuarios,
  odooUsuarios,
  isSyncing: isSyncingUsers,
  syncProgress: userSyncProgress,
  searchUser,
  selectedDept,
  selectedCountry,
  departamentosUnicos,
  filteredOdoo,
  filteredLocal,
  fetchDbUsuarios,
  fetchOdooUsuarios,
  executeSync: syncAllUsers
} = useUsuariosSync();

// --- 3. ESTADOS PARA PROGRESO ---
const progressPercent = ref(0);
const progressDetail = ref({ current: 0, total: 0 });
const syncPreview = ref(null);
const isFetchingPreview = ref(false);
let progressTimer = null;

const fetchSyncPreview = async () => {
  if (selectedCountry.value === 'TODOS') return alert("Selecciona un país");

  isFetchingPreview.value = true;
  try {
    const url = `${API_URL}/sincronizar/preview?pais=${selectedCountry.value}&depto=${selectedDept.value}`;
    const res = await fetch(url, { method: 'POST' });
    syncPreview.value = await res.json();
  } catch (e) {
    showNotification("Error al obtener preview", "error");
  } finally {
    isFetchingPreview.value = false;
  }
};
// --- 4. FUNCIÓN DE SINCRONIZACIÓN CORREGIDA ---
const executeSync = async () => {
  if (selectedCountry.value === 'TODOS') return alert("Selecciona un país");

  isSyncingUsers.value = true; // Activamos el estado del composable
  progressPercent.value = 0;

  // Polling para ver el progreso
  progressTimer = setInterval(async () => {
    try {
      const res = await fetch(`${API_URL}/sincronizar/progreso`);
      const data = await res.json();
      progressDetail.value = { current: data.current, total: data.total };
      if (data.total > 0) progressPercent.value = Math.round((data.current / data.total) * 100);
      if (['completed', 'error', 'cancelled'].includes(data.status)) clearInterval(progressTimer);
    } catch (e) { console.error("Error en polling", e); }
  }, 500);

  try {
    const url = `${API_URL}/sincronizar/ejecutar?pais=${selectedCountry.value}&depto=${selectedDept.value}`;
    const res = await fetch(url, { method: "POST" });
    const result = await res.json();

    if (res.ok) {
      await fetchDbUsuarios();
      progressPercent.value = 100;
      showNotification(result.message, 'success');
    } else {
      throw new Error(result.message);
    }
  } catch (e) {
    showNotification("Error en sincronización", "error");
    console.error(e);
  } finally {
    clearInterval(progressTimer);
    setTimeout(() => {
      isSyncingUsers.value = false;
      progressPercent.value = 0;
    }, 2000);
  }
};

const handleCancel = async () => {
  await fetch(`${API_URL}/sincronizar/cancelar`, { method: "POST" });
  isSyncingUsers.value = false;
  clearInterval(progressTimer);
};



// --- Observador (Watch) para el cambio de país ---
watch(selectedCountry, async () => {
  selectedDept.value = "TODOS";
  // Al cambiar país, refrescamos ambas listas
  await Promise.all([
    fetchDbUsuarios(),
    fetchOdooUsuarios()
  ]);
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
  return user.permisos.some(p => p.modulos === slug);
};
const togglePermisoLocal = async (user, slug) => {
  const activo = !hasPerm(user, slug);
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/asignar-permiso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idOdoo: user.id_odoo,
        modulo: slug,
        activo: activo,
        adminName: 'Daniel'
      })
    });

    if (!res.ok) throw new Error("Error en el servidor");

    // Refrescamos la lista general de la DB
    await fetchDbUsuarios();

    // Sincronizamos el modal para que el switch cambie de posición
    if (selectedUserPerms.value) {
      const actualizado = dbUsuarios.value.find(u => u.id_odoo === user.id_odoo);
      if (actualizado) {
        selectedUserPerms.value = actualizado;
      }
    }

    showNotification(`Permiso ${activo ? 'asignado' : 'removido'} correctamente`);
  } catch (e) {
    showNotification("Error al actualizar permisos", "error");
    console.error(e);
  }
};

const updateUserStructure = async (user, field) => {
  const value = user[field];

  try {
    // Agregamos /usuarios/ a la ruta
    const res = await fetch(`${import.meta.env.VITE_API_URL}/actualizar-estructura`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idOdoo: user.id_odoo,
        campo: field,
        valor: value
      })
    });

    if (!res.ok) throw new Error("Error en la respuesta del servidor");

    showNotification("Cambio guardado en la base de datos", "success");
  } catch (e) {
    showNotification("No se pudo guardar el cambio", "error");
    console.error(e);
  }
};

// --- Estado Local Restante ---
const currentTab = ref('stats');
const isSidebarOpen = ref(true);
const syncProgress = ref(0);
const mallasData = ref([]);
const asistenciasHoy = ref(0);
// const selectedFile = ref(null);
const localChangelog = ref([]);

// --- Sistema de Notificación ---
const notification = ref({ show: false, message: '', type: 'success' });
const showNotification = (msg, type = 'success') => {
  notification.value = { show: true, message: msg, type };
  setTimeout(() => notification.value.show = false, 5000);
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
  <div class="flex min-h-screen transition-colors duration-500"
    :class="isDark ? 'bg-[#334157] text-slate-200' : 'bg-[#F8FAFC] text-slate-800'">

    <Transition name="notification">
      <div v-if="notification.show"
        class="fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl"
        :class="notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-rose-500/10 border-rose-500/50 text-rose-500'">
        <i :class="notification.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'"></i>
        <p class="text-[11px] font-black uppercase tracking-widest">{{ notification.message }}</p>
      </div>
    </Transition>

    <button v-if="!isSidebarOpen" @click="isSidebarOpen = true"
      class="lg:hidden fixed top-4 left-4 z-[60] w-10 h-10 bg-[#FF8F00] text-black rounded-xl shadow-lg flex items-center justify-center transition-transform active:scale-95">
      <i class="fas fa-bars"></i>
    </button>

    <div v-if="isSidebarOpen" @click="isSidebarOpen = false"
      class="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[45]"></div>

    <aside :class="[
      'fixed lg:relative z-50 h-screen transition-[width,transform] duration-300 ease-in-out border-r flex flex-col',
      isDark ? 'bg-[#273045] border-white/5 text-white' : 'bg-white border-slate-200 text-slate-800',
      /* En móvil: translate-x para esconder. En PC: cambia ancho de 64 a 16 */
      isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-16 lg:translate-x-0'
    ]">

      <button @click="isSidebarOpen = !isSidebarOpen"
        class="absolute -right-2.5 top-8 w-5 h-5 bg-[#FF8F00] text-black rounded-full shadow-md hover:scale-110 transition-all z-[60] flex items-center justify-center text-[8px]"
        :class="[!isSidebarOpen ? 'rotate-180' : '', !isSidebarOpen && 'hidden lg:flex']">
        <i class="fas fa-chevron-left"></i>
      </button>

      <div v-show="isSidebarOpen || isSidebarOpen === false"
        class="flex flex-col h-full p-2 overflow-hidden transition-all" :class="!isSidebarOpen && 'lg:p-2'">

        <div class="flex items-center gap-3 mb-8" :class="!isSidebarOpen && 'lg:justify-center'">
          <div
            class="w-8 h-8 shrink-0 bg-[#FF8F00] rounded-xl flex items-center justify-center text-black shadow-lg shadow-[#FF8F00]/20">
            <i class="fas fa-shield-alt text-sm"></i>
          </div>
          <span v-if="isSidebarOpen" class="font-black italic text-lg tracking-tighter truncate uppercase">
            Woden<span class="text-[#FF8F00]">Admin</span>
          </span>
        </div>

        <nav class="flex-1 space-y-1">
          <button v-for="(item, key) in {
            stats: ['fas fa-chart-pie', 'Dashboard'],
            apk: ['fab fa-android', 'APK'],
            companies: ['fas fa-building', 'Empresas'],
            users: ['fas fa-users-cog', 'Personal'],
            notifications: ['fas fa-bullhorn', 'Avisos'],
            estructura: ['fas fa-sitemap', 'Organización']
          }" :key="key" @click="currentTab = key" :class="[
            'w-full flex items-center rounded-lg transition-all duration-200 p-2.5 text-[10px] font-bold uppercase',
            currentTab === key ? 'bg-[#FF8F00] text-black shadow-md' : 'hover:bg-slate-500/10',
            !isSidebarOpen && 'lg:justify-center'
          ]" :title="item[1]">
            <i :class="[item[0], isSidebarOpen ? 'mr-3 text-sm' : 'text-lg']"></i>
            <span v-if="isSidebarOpen" class="truncate">{{ item[1] }}</span>
          </button>
        </nav>

        <div class="mt-auto pt-4 space-y-1 border-t border-white/5">
          <button @click="toggleTheme"
            class="w-full flex items-center p-2 rounded-lg text-[9px] font-bold uppercase hover:bg-slate-500/10"
            :class="!isSidebarOpen && 'lg:justify-center'">
            <i
              :class="[isDark ? 'fas fa-sun text-yellow-500' : 'fas fa-moon text-indigo-500', isSidebarOpen && 'mr-3']"></i>
            <span v-if="isSidebarOpen">Tema</span>
          </button>

          <button @click="logout"
            class="w-full flex items-center p-2 text-[9px] font-black uppercase text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
            :class="!isSidebarOpen && 'lg:justify-center'">
            <i class="fas fa-sign-out-alt" :class="isSidebarOpen && 'mr-3'"></i>
            <span v-if="isSidebarOpen">Salir</span>
          </button>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col h-screen overflow-hidden">
      <header class="h-10 flex items-center justify-between px-8 border-b transition-colors"
        :class="isDark ? 'bg-[#0f172a]/50 border-white/5' : 'bg-white border-slate-200'">

        <div class="flex items-center gap-4">
          <span
            class="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase rounded-full">Sistema
            Activo</span>
        </div>
      </header>

      <div class="flex-1 p-4 lg:p-4 overflow-y-auto">

        <div v-if="currentTab === 'stats'" class="animate-fade-in space-y-8">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="stat-card" :class="isDark ? 'card-dark' : 'card-light'">
              <div class="flex justify-between items-start mb-4">
                <span class="label">Total Empleados</span>
                <i class="fas fa-users text-blue-500 opacity-50"></i>
              </div>
              <span class="value">{{ mallasData.length }}</span>
            </div>
            <div class="stat-card destaque">
              <div class="flex justify-between items-start mb-4">
                <span class="label">Asistencias Hoy</span>
                <i class="fas fa-check-double text-[#FF8F00] opacity-50"></i>
              </div>
              <span class="value">{{ asistenciasHoy }}</span>
            </div>
          </div>
        </div>


        <!-- TEMPLATE APK -->
        <div v-if="currentTab === 'apk'" class="animate-fade-in max-w-5xl">
          <GestionApk :isDark="isDark" @success="showNotification($event)" @error="showNotification($event, 'error')" />
        </div>


        <!-- TEMPLATE COMPAÑIAS -->
        <div v-if="currentTab === 'companies'" class="animate-fade-in p-2">
          <GestionCompanias :isDark="isDark" @success="showNotification($event)"
            @error="showNotification($event, 'error')" />
        </div>


        <!-- TEMPLATE USUARIOS-->
        <div v-if="currentTab === 'users'" class="animate-fade-in p-2">
          <GestionUsuarios :isDark="isDark" @success="showNotification($event)"
            @error="showNotification($event, 'error')" @open-perms="openPerms($event)" />
        </div>



        <!-- TEMPLATE NOTIFICACIONES -->
        <div v-if="currentTab === 'notifications'" class="animate-fade-in p-2">
          <Notificaciones :isDark="isDark" :apiUrl="API_URL"
            @notification-sent="showNotification('Notificación enviada')" />
        </div>


        <!-- TEMPLATE AREAS Y SEGMENTOS -->
        <div v-if="currentTab === 'estructura'" class="animate-fade-in p-2">
          <GestionEstructura :key="areas.length" :isDark="isDark" :usuarios="dbUsuarios" :areas="areas"
            :segmentos="segmentos" @save="handleSaveEstructura" />
        </div>




      </div>
    </main>
    <div v-if="selectedUserPerms"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">

      <div
        class="w-full max-w-md max-h-[90vh] rounded-[2.5rem] border border-white/10 p-8 shadow-2xl animate-fade-in flex flex-col"
        :class="isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'">

        <div class="flex justify-between items-start mb-6 shrink-0">
          <div>
            <h3 class="text-xl font-black italic uppercase text-[#FF8F00]">Configurar Accesos</h3>
            <p class="text-[10px] font-bold opacity-50 uppercase tracking-widest">
              {{ selectedUserPerms.nombre }}
            </p>
          </div>
          <button @click="selectedUserPerms = null" class="opacity-50 hover:opacity-100 transition-opacity">
            <i class="fas fa-times-circle text-xl"></i>
          </button>
        </div>

        <div class="space-y-4 overflow-y-auto pr-2 custom-scroll flex-1">

          <div :class="[
            'p-5 rounded-[2rem] border transition-all duration-300',
            isDark ? 'bg-white/[0.02] border-white/10 shadow-xl' : 'bg-slate-50 border-slate-200 shadow-sm'
          ]">
            <div class="flex items-center gap-2 mb-5">
              <div class="w-6 h-6 rounded-lg bg-[#FF8F00]/20 flex items-center justify-center">
                <i class="fas fa-layer-group text-[10px] text-[#FF8F00]"></i>
              </div>
              <span class="text-[10px] font-black uppercase tracking-[0.15em] opacity-70">Estructura
                Organizacional</span>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="group space-y-2">
                <label class="text-[9px] font-bold opacity-50 uppercase ml-1 flex items-center gap-1">
                  <span class="w-1 h-1 bg-blue-500 rounded-full"></span> Área Actual
                </label>
                <div class="relative">
                  <select v-model="selectedUserPerms.area_id"
                    @change="updateUserStructure(selectedUserPerms, 'area_id')"
                    class="w-full bg-black/10 border border-white/5 p-3 rounded-2xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                    :class="isDark ? 'text-white' : 'text-slate-800'">
                    <option :value="null">-- SIN ÁREA --</option>
                    <option v-for="a in areas" :key="a.id" :value="a.id">{{ a.nombre }}</option>
                  </select>
                  <i
                    class="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[8px] opacity-30 pointer-events-none"></i>
                </div>
              </div>

              <div class="group space-y-2">
                <label class="text-[9px] font-bold opacity-50 uppercase ml-1 flex items-center gap-1">
                  <span class="w-1 h-1 bg-emerald-500 rounded-full"></span> Segmento
                </label>
                <div class="relative">
                  <select v-model="selectedUserPerms.segmento_id"
                    @change="updateUserStructure(selectedUserPerms, 'segmento_id')"
                    class="w-full bg-black/10 border border-white/5 p-3 rounded-2xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer"
                    :class="isDark ? 'text-white' : 'text-slate-800'">
                    <option :value="null">-- SIN SEGMENTO --</option>
                    <option v-for="s in segmentos" :key="s.id" :value="s.id">{{ s.nombre }}</option>
                  </select>
                  <i
                    class="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[8px] opacity-30 pointer-events-none"></i>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4 py-2">
            <div class="h-[1px] bg-gradient-to-r from-transparent via-[#FF8F00]/20 to-transparent flex-1"></div>
            <span class="text-[9px] font-black opacity-40 uppercase tracking-[0.2em]">Módulos y Permisos</span>
            <div class="h-[1px] bg-gradient-to-r from-transparent via-[#FF8F00]/20 to-transparent flex-1"></div>
          </div>

          <div class="grid grid-cols-1 gap-2">
            <div
              v-for="slug in ['super.superadmin', 'super.dashboard', 'super.gestionarapk', 'super.companias', 'super.personal', 'admin.admin', 'admin.asistencias', 'admin.mallas', 'admin.novedades']"
              :key="slug"
              class="group flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200"
              :class="isDark
                ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10'
                : 'bg-white border-slate-200 hover:border-[#FF8F00]/30 hover:shadow-md'">

              <div class="flex items-center gap-4">
                <div :class="[
                  'w-1.5 h-8 rounded-full transition-all duration-500',
                  hasPerm(selectedUserPerms, slug) ? 'bg-[#FF8F00] shadow-[0_0_10px_#FF8F00]/40' : 'bg-slate-700/20'
                ]"></div>
                <div>
                  <span
                    class="text-[10px] font-black uppercase tracking-wider block group-hover:text-[#FF8F00] transition-colors">
                    {{ slug.split('.')[1] }}
                    <span class="text-[8px] opacity-30 ml-1 font-normal italic">({{ slug.split('.')[0] }})</span>
                  </span>
                  <p class="text-[8px] opacity-40 font-bold uppercase">Acceso al sistema</p>
                </div>
              </div>

              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" :checked="hasPerm(selectedUserPerms, slug)"
                  @change="togglePermisoLocal(selectedUserPerms, slug)" class="sr-only peer">
                <div class="w-9 h-5 bg-slate-700/30 rounded-full peer 
              peer-checked:bg-[#FF8F00] 
              after:content-[''] after:absolute after:top-[4px] after:left-[4px] 
              after:bg-white after:rounded-full after:h-3 after:w-3 
              after:transition-all peer-checked:after:translate-x-4
              shadow-inner">
                </div>
              </label>
            </div>
          </div>
        </div>

        <button @click="selectedUserPerms = null"
          class="w-full mt-6 py-3 bg-[#FF8F00] text-black font-black text-[11px] rounded-xl active:scale-95 transition-all uppercase tracking-widest shrink-0 shadow-lg shadow-orange-500/20">
          Finalizar Cambios
        </button>
      </div>
    </div>
  </div>
</template>
