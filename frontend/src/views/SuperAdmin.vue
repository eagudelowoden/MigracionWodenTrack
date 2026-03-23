<script setup>
import { ref, onMounted, watch } from 'vue'; // Importamos watch y quitamos computed (ya vienen del composable)
import { useAttendance } from '../composables/UserLogica/useAttendance.js';
import { useCompanies } from '../composables/adminLogica/useCompanies.js';
import { useUsuariosSync } from '../composables/adminLogica/useUsuariosSync.js';
import { useOrganizacion } from '../composables/adminLogica/useOrganizacion.js';
import GestionEstructura from '../components/admin/SuperAdmin/GestionEstructura.vue';
import Notificaciones from '../components/admin/SuperAdmin/GestionNotificaciones.vue';
import GestionApk from '../components/admin/SuperAdmin/GestionApk.vue';
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
// const { apkData, fetchApkInfo, subirApk, guardarNovedades } = useApkRepo();
const {
  dbCompanies, isSyncing: isSyncingCompanies, odooCompanies,
  fetchDbCompanies, fetchOdooRaw, syncCompanies, toggleCompanyStatus
} = useCompanies();

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

// --- Clases dinámicas para navegación ---

// --- Carga Inicial ---
onMounted(async () => {
  await fetchApkInfo();
  if (apkData.value) localChangelog.value = [...apkData.value.changelog];

  // Cargamos datos iniciales
  await Promise.all([
    fetchDbCompanies(),
    fetchOdooRaw(),
    fetchDbUsuarios(),
    fetchOrganizacion(),
    fetchOdooUsuarios(),
    fetchNotificationLogs()
  ]);
});

// --- Lógica de Compañías ---
const handleSyncCompanies = async () => {
  syncProgress.value = 5;
  const progressTimer = setInterval(() => { if (syncProgress.value < 85) syncProgress.value += 2; }, 100);

  try {
    const res = await syncCompanies();
    syncProgress.value = 100;
    showNotification(res.message, res.status === 'info' ? 'warning' : 'success');
    await fetchDbCompanies();
  } catch (e) {
    showNotification("Error en la comunicación", "error");
  } finally {
    clearInterval(progressTimer);
    setTimeout(() => { syncProgress.value = 0; }, 1000);
  }
};

const handleToggleCompany = async (id, currentStatus) => {
  try {
    await toggleCompanyStatus(id, currentStatus);
    showNotification("Estado actualizado");
    await fetchDbCompanies();
  } catch (e) {
    showNotification("Error al cambiar estado", "error");
  }
};

// // --- Lógica de APK ---
// const addNote = () => localChangelog.value.push("");
// const removeNote = (i) => localChangelog.value.splice(i, 1);
// const handleFileUpload = (e) => { selectedFile.value = e.target.files[0]; };

// const saveChangelog = async () => {
//   try {
//     await guardarNovedades(localChangelog.value);
//     showNotification("Historial guardado");
//   } catch (e) {
//     showNotification("Error al guardar", "error");
//   }
// };

// const uploadApkFile = async () => {
//   if (!selectedFile.value) return;
//   try {
//     await subirApk(selectedFile.value);
//     showNotification("APK publicada correctamente");
//     selectedFile.value = null;
//     await fetchApkInfo();
//   } catch (e) {
//     showNotification("Error al subir archivo", "error");
//   }
// };
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

        <div v-if="currentTab === 'apk'" class="animate-fade-in max-w-5xl">
          <GestionApk :isDark="isDark" @success="showNotification($event)" @error="showNotification($event, 'error')" />
        </div>


        <div v-if="currentTab === 'companies'" class="animate-fade-in space-y-4 p-2">

          <div class="flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-500/10 bg-white/5">
            <div class="flex items-center gap-4">
              <div class="flex flex-col">
                <h2 class="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF8F00]">Sincronización</h2>
                <span class="text-[9px] opacity-50 font-bold uppercase tracking-tighter">Odoo ERP vs Local DB</span>
              </div>
              <div v-if="isSyncingCompanies" class="w-32 h-[3px] bg-slate-500/10 rounded-full overflow-hidden">
                <div class="h-full bg-[#FF8F00] transition-all duration-300" :style="{ width: syncProgress + '%' }">
                </div>
              </div>
            </div>

            <button @click="handleSyncCompanies" :disabled="isSyncingCompanies"
              class="h-8 px-5 rounded-lg bg-[#FF8F00] text-white text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 disabled:opacity-30 transition-all">
              <i class="fas mr-2" :class="isSyncingCompanies ? 'fa-circle-notch fa-spin' : 'fa-sync-alt'"></i>
              {{ isSyncingCompanies ? `${syncProgress}%` : 'Sincronizar Sedes' }}
            </button>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

            <div class="rounded-2xl border border-slate-500/10 overflow-hidden bg-white/5">
              <div class="p-3 border-b border-slate-500/10 flex items-center justify-between bg-white/[0.02]">
                <h3 class="text-[9px] font-black uppercase tracking-widest opacity-60">Origen: Odoo</h3>
                <span class="text-[8px] font-bold text-blue-500">REAL-TIME</span>
              </div>
              <div class="max-h-[350px] overflow-y-auto custom-scroll">
                <table class="w-full">
                  <tbody class="text-[10px]">
                    <tr v-for="c in odooCompanies" :key="c.id"
                      class="border-b border-slate-500/5 hover:bg-white/[0.02] transition-colors">
                      <td class="p-3 font-mono text-blue-500/60 text-[9px]">#{{ c.id }}</td>
                      <td class="p-3 font-bold uppercase tracking-tight">{{ c.name }}</td>
                      <td class="p-3 text-right">
                        <i v-if="dbCompanies.some(db => db.id === c.id)"
                          class="fas fa-check text-emerald-500 text-[9px]"></i>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-500/10 overflow-hidden bg-white/5">
              <div class="p-3 border-b border-slate-500/10 flex items-center justify-between bg-white/[0.02]">
                <h3 class="text-[9px] font-black uppercase tracking-widest opacity-60">Destino: SQL Server</h3>
                <span class="text-[8px] font-bold text-[#FF8F00]">LOCAL DB</span>
              </div>
              <div class="max-h-[350px] overflow-y-auto custom-scroll">
                <table class="w-full text-left">
                  <tbody class="text-[10px]">
                    <tr v-for="comp in dbCompanies" :key="comp.id" class="border-b border-slate-500/5 transition-all"
                      :class="!comp.is_active ? 'opacity-30 grayscale' : 'hover:bg-white/[0.02]'">
                      <td class="p-3">
                        <div class="font-bold uppercase">{{ comp.name }}</div>
                        <div class="text-[7px] font-black tracking-tighter"
                          :class="comp.is_active ? 'text-emerald-500' : 'text-rose-500'">
                          {{ comp.is_active ? 'VISIBLE' : 'OCULTO' }}
                        </div>
                      </td>
                      <td class="p-3 text-right">
                        <button @click="handleToggleCompany(comp.id, comp.is_active)"
                          class="h-6 px-3 rounded-md border text-[8px] font-black uppercase transition-all" :class="comp.is_active
                            ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white'
                            : 'border-slate-500/30 text-slate-500 hover:bg-slate-500 hover:text-white'">
                          {{ comp.is_active ? 'ON' : 'OFF' }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>


        <div v-if="currentTab === 'users'" class="animate-fade-in space-y-3 p-0">

          <div class="flex flex-wrap items-center justify-between gap-4 px-4 py-2 rounded-xl border"
            :class="isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'">

            <div class="flex items-center gap-3">
              <div
                class="w-7 h-7 bg-[#FF8F00] rounded-lg flex items-center justify-center text-black shadow-lg shadow-[#FF8F00]/20">
                <i class="fas fa-users-cog text-[10px]"></i>
              </div>
              <div>
                <h2 class="text-[10px] font-black uppercase tracking-wider text-[#FF8F00] leading-none">Gestión Personal
                </h2>
                <p class="text-[8px] font-bold opacity-40 uppercase tracking-tighter mt-0.5">Odoo vs SQL</p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-3 flex-1 justify-end min-w-0">

              <div class="flex-1 max-w-[160px]">
                <input v-model="searchUser" type="text" placeholder="BUSCAR USUARIO..."
                  class="font-mono-custom w-full py-1 bg-transparent border-b outline-none text-[13px] font-bold transition-all"
                  :class="isDark
                    ? 'border-white/10 text-slate-200 placeholder:text-slate-500 focus:border-[#FF8F00]'
                    : 'border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-[#FF8F00]'" />
              </div>

              <select v-model="selectedCountry"
                class="font-mono-custom bg-transparent border-b outline-none text-[13px] font-black uppercase cursor-pointer text-blue-500 py-1 min-w-[100px] w-auto transition-colors"
                :class="isDark ? 'border-white/10 hover:border-blue-400' : 'border-slate-200 hover:border-blue-400'">
                <option value="TODOS" :class="isDark ? 'bg-[#1e293b] text-white' : 'bg-white text-slate-800'">PAÍS:
                  TODOS</option>
                <option v-for="c in odooCompanies" :key="c.id" :value="c.name"
                  :class="isDark ? 'bg-[#1e293b] text-white' : 'bg-white text-slate-800'">
                  {{ c.name }}
                </option>
              </select>

              <select v-model="selectedDept"
                class="font-mono-custom bg-transparent border-b outline-none text-[10px] font-black uppercase cursor-pointer text-[#FF8F00] py-1 min-w-[120px] w-auto transition-colors"
                :class="isDark ? 'border-white/10 hover:border-orange-300' : 'border-slate-200 hover:border-orange-300'">
                <option value="TODOS" :class="isDark ? 'bg-[#1e293b] text-white' : 'bg-white text-slate-800'">DEP: TODOS
                </option>
                <option v-for="dept in departamentosUnicos" :key="dept" :value="dept"
                  :class="isDark ? 'bg-[#1e293b] text-white' : 'bg-white text-slate-800'">
                  {{ dept }}
                </option>
              </select>
              <div class="flex flex-col gap-1 min-w-[130px]">
                <div class="flex items-center gap-2">
                  <button @click="executeSync" :disabled="isSyncingUsers"
                    class="relative flex-1 flex items-center justify-center h-7 px-4 rounded-md transition-all duration-300 active:scale-95 disabled:opacity-50"
                    :class="isSyncingUsers ? 'bg-slate-100 text-slate-400' : 'bg-[#FF8F00] text-white'">
                    <span class="text-[9px] font-black uppercase tracking-widest">
                      {{ isSyncingUsers ? 'Cargando...' : 'Sincronizar' }}
                    </span>
                  </button>

                  <button v-if="isSyncingUsers" @click="handleCancel"
                    class="flex items-center justify-center w-7 h-7 text-rose-500 hover:bg-rose-50 rounded-md transition-all">
                    <i class="fas fa-stop text-[8px]"></i>
                  </button>
                </div>

                <div v-if="isSyncingUsers" class="w-full h-[2px] bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-[#FF8F00] transition-all duration-500"
                    :style="{ width: progressPercent + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 font-mono-custom">

            <div class="rounded-xl border border-white/10 overflow-hidden flex flex-col h-[520px]"
              :class="isDark ? 'bg-slate-900/40' : 'bg-white shadow-lg'">

              <div class="p-3 border-b border-white/10 flex justify-between items-center bg-blue-500/10">
                <span class="text-[12px] font-bold uppercase text-blue-400 tracking-wider">Odoo ERP System</span>
                <span class="text-[10px] font-bold opacity-50 px-2 py-0.5 bg-blue-500/10 rounded">{{
                  filteredOdoo?.length }} Items</span>
              </div>

              <div class="flex-1 overflow-y-auto custom-scroll relative">
                <table class="w-full text-left border-collapse table-fixed">
                  <thead class="sticky top-0 z-20" :class="isDark ? 'bg-[#161f33]' : 'bg-slate-50'">
                    <tr class="text-[10px] uppercase font-bold text-slate-500 border-b border-white/10">
                      <th class="p-3 w-16 text-center">ID</th>
                      <th class="p-3 w-1/2">Colaborador</th>
                      <th class="p-3 w-1/3">Departamento</th>
                    </tr>
                  </thead>

                  <tbody class="divide-y divide-white/5">
                    <tr v-for="u in (filteredOdoo || [])" :key="u.id"
                      class="hover:bg-blue-500/5 transition-colors group">

                      <td class="p-3 text-center text-blue-400 font-bold text-[11px]">
                        {{ u.id }}
                      </td>

                      <td class="p-3">
                        <div class="flex flex-col truncate">
                          <span class="font-bold text-[13px] uppercase truncate"
                            :class="isDark ? 'text-slate-100' : 'text-slate-900'">
                            {{ u.name }}
                          </span>
                          <span class="text-[10px] font-semibold text-orange-400/90 truncate mt-0.5">
                            {{ u.job_title || '---' }}
                          </span>
                        </div>
                      </td>

                      <td class="p-3 truncate text-[11px] font-medium"
                        :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                        {{ u.department_id ? u.department_id[1] : 'S/A' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="rounded-xl border border-white/10 overflow-hidden flex flex-col h-[520px]"
              :class="isDark ? 'bg-slate-900/60' : 'bg-white shadow-lg'">

              <div class="p-3 border-b border-white/10 flex justify-between items-center bg-emerald-500/10">
                <span class="text-[12px] font-bold uppercase text-emerald-400 tracking-wider">WodenTrack SQL</span>
                <span class="text-[10px] font-bold opacity-50 px-2 py-0.5 bg-emerald-500/10 rounded">{{
                  filteredLocal?.length }} Items</span>
              </div>

              <div class="flex-1 overflow-y-auto custom-scroll relative">
                <table class="w-full text-left border-collapse table-fixed">
                  <thead class="sticky top-0 z-20" :class="isDark ? 'bg-[#1e273a]' : 'bg-slate-50'">
                    <tr class="text-[10px] uppercase font-bold text-slate-500 border-b border-white/10">
                      <th class="p-3 w-24">Cédula</th>
                      <th class="p-3">Nombre / Depto</th>
                      <th class="p-3 w-20 text-center">Acceso</th>
                      <th class="p-3 w-12 text-center">Est</th>
                    </tr>
                  </thead>

                  <tbody class="divide-y divide-white/5">
                    <tr v-for="user in filteredLocal" :key="user.id_odoo"
                      class="hover:bg-emerald-500/5 transition-all group">

                      <td class="p-3 font-bold text-emerald-500 text-[11px] tracking-tighter">
                        {{ user.identificacion }}
                      </td>

                      <td class="p-3">
                        <div class="flex flex-col truncate">
                          <span class="font-bold text-[13px] uppercase truncate"
                            :class="isDark ? 'text-slate-100' : 'text-slate-800'">
                            {{ user.nombre }}
                          </span>
                          <span class="text-[10px] font-bold text-blue-400 mt-0.5 truncate">
                            {{ user.departamento }}
                          </span>
                        </div>
                      </td>

                      <td class="p-3 text-center">
                        <button @click="openPerms(user)"
                          class="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 inline-flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                          <i class="fas fa-key text-[12px]"
                            :class="user.permisos?.length > 0 ? 'text-orange-400' : 'text-slate-600'"></i>
                        </button>
                      </td>

                      <td class="p-3 text-center">
                        <div :class="user.is_active ? 'bg-emerald-500' : 'bg-rose-500'"
                          class="w-2.5 h-2.5 rounded-full inline-block shadow-lg"></div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>




        <div v-if="currentTab === 'notifications'" class="animate-fade-in p-2">
          <Notificaciones :isDark="isDark" :apiUrl="API_URL"
            @notification-sent="showNotification('Notificación enviada')" />
        </div>


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
