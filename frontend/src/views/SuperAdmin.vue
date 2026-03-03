<script setup>
import { ref, onMounted, watch } from 'vue'; // Importamos watch y quitamos computed (ya vienen del composable)
import { useAttendance } from '../composables/UserLogica/useAttendance.js';
import { useApkRepo } from '../composables/adminLogica/useApkRepo.js';
import { useCompanies } from '../composables/adminLogica/useCompanies.js';
import { useUsuariosSync } from '../composables/adminLogica/useUsuariosSync.js';
import '../assets/css/admin-style.css';
import '../assets/css/SuperAdmin.css';

// --- Composables ---
const { logout, isDark, toggleTheme } = useAttendance();
const { apkData, fetchApkInfo, subirApk, guardarNovedades } = useApkRepo();
const {
  dbCompanies, odooCompanies, isSyncing,
  fetchDbCompanies, fetchOdooRaw, syncCompanies, toggleCompanyStatus
} = useCompanies();

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
// --- Estado Local Restante ---
const currentTab = ref('stats');
const isSidebarOpen = ref(true);
const syncProgress = ref(0);
const mallasData = ref([]);
const asistenciasHoy = ref(0);
const selectedFile = ref(null);
const localChangelog = ref([]);

// --- Sistema de Notificación ---
const notification = ref({ show: false, message: '', type: 'success' });
const showNotification = (msg, type = 'success') => {
  notification.value = { show: true, message: msg, type };
  setTimeout(() => notification.value.show = false, 5000);
};

// --- Clases dinámicas para navegación ---
const tabClass = (active) => [
  'w-full flex items-center p-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300',
  active
    ? 'bg-[#FF8F00] text-black shadow-lg shadow-[#FF8F00]/20'
    : isDark.value ? 'text-slate-500 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5'
];

// --- Carga Inicial ---
onMounted(async () => {
  await fetchApkInfo();
  if (apkData.value) localChangelog.value = [...apkData.value.changelog];

  // Cargamos datos iniciales
  await Promise.all([
    fetchDbCompanies(),
    fetchOdooRaw(),
    fetchDbUsuarios(),
    fetchOdooUsuarios()
  ]);
});

// --- Lógica de Sincronización de Usuarios ---
const handleSyncUsers = async () => {
  try {
    const res = await syncAllUsers();
    showNotification(res.message, res.status === 'info' ? 'warning' : 'success');
  } catch (e) {
    showNotification("Error al sincronizar usuarios", "error");
  }
};

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

// --- Lógica de APK ---
const addNote = () => localChangelog.value.push("");
const removeNote = (i) => localChangelog.value.splice(i, 1);
const handleFileUpload = (e) => { selectedFile.value = e.target.files[0]; };

const saveChangelog = async () => {
  try {
    await guardarNovedades(localChangelog.value);
    showNotification("Historial guardado");
  } catch (e) {
    showNotification("Error al guardar", "error");
  }
};

const uploadApkFile = async () => {
  if (!selectedFile.value) return;
  try {
    await subirApk(selectedFile.value);
    showNotification("APK publicada correctamente");
    selectedFile.value = null;
    await fetchApkInfo();
  } catch (e) {
    showNotification("Error al subir archivo", "error");
  }
};
</script>
<template>
  <div class="flex min-h-screen transition-colors duration-500"
    :class="isDark ? 'bg-[#020617] text-slate-200' : 'bg-[#F8FAFC] text-slate-800'">

    <Transition name="notification">
      <div v-if="notification.show"
        class="fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl"
        :class="notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-rose-500/10 border-rose-500/50 text-rose-500'">
        <i :class="notification.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'"></i>
        <p class="text-[11px] font-black uppercase tracking-widest">{{ notification.message }}</p>
      </div>
    </Transition>

    <aside :class="[
      'fixed lg:relative z-50 h-screen transition-all duration-500 border-r flex flex-col p-6',
      isDark ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200',
      isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0 lg:p-4'
    ]">
      <div class="flex items-center gap-3 mb-10" :class="!isSidebarOpen && 'justify-center'">
        <div
          class="w-10 h-10 shrink-0 bg-[#FF8F00] rounded-2xl flex items-center justify-center text-black shadow-lg shadow-[#FF8F00]/20">
          <i class="fas fa-shield-alt"></i>
        </div>
        <span v-if="isSidebarOpen" class="font-black italic text-xl tracking-tighter">WODEN<span
            class="text-[#FF8F00]">ADMIN</span></span>
      </div>

      <nav class="flex-1 space-y-3">
        <button @click="currentTab = 'stats'" :class="tabClass(currentTab === 'stats')" title="Dashboard">
          <i class="fas fa-chart-pie" :class="isSidebarOpen && 'mr-3'"></i>
          <span v-if="isSidebarOpen">Dashboard</span>
        </button>
        <button @click="currentTab = 'apk'" :class="tabClass(currentTab === 'apk')" title="Gestionar APK">
          <i class="fab fa-android" :class="isSidebarOpen && 'mr-3'"></i>
          <span v-if="isSidebarOpen">Gestionar APK</span>
        </button>
        <button @click="currentTab = 'companies'" :class="tabClass(currentTab === 'companies')" title="Compañías">
          <i class="fas fa-building" :class="isSidebarOpen && 'mr-3'"></i>
          <span v-if="isSidebarOpen">Compañías</span>
        </button>
        <button @click="currentTab = 'users'" :class="tabClass(currentTab === 'users')">
          <i class="fas fa-users-cog" :class="isSidebarOpen && 'mr-3'"></i>
          <span v-if="isSidebarOpen">Personal / Usuarios</span>
        </button>
      </nav>

      <div class="space-y-4">
        <button @click="toggleTheme"
          class="w-full flex items-center p-3 rounded-xl text-[10px] font-bold uppercase transition-all hover:bg-slate-500/10"
          :class="!isSidebarOpen && 'justify-center'">
          <i
            :class="[isDark ? 'fas fa-sun text-yellow-500' : 'fas fa-moon text-indigo-500', isSidebarOpen && 'mr-3']"></i>
          <span v-if="isSidebarOpen">{{ isDark ? 'Modo Claro' : 'Modo Oscuro' }}</span>
        </button>
        <button @click="logout"
          class="w-full flex items-center p-3 text-[10px] font-black uppercase text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
          :class="!isSidebarOpen && 'justify-center'">
          <i class="fas fa-sign-out-alt" :class="isSidebarOpen && 'mr-3'"></i>
          <span v-if="isSidebarOpen">Salir</span>
        </button>
      </div>
    </aside>

    <main class="flex-1 flex flex-col h-screen overflow-hidden">
      <header class="h-16 flex items-center justify-between px-8 border-b transition-colors"
        :class="isDark ? 'bg-[#0f172a]/50 border-white/5' : 'bg-white border-slate-200'">
        <button @click="isSidebarOpen = !isSidebarOpen" class="p-2 rounded-lg hover:bg-slate-500/10">
          <i class="fas fa-bars"></i>
        </button>
        <div class="flex items-center gap-4">
          <span
            class="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase rounded-full">Sistema
            Activo</span>
        </div>
      </header>

      <div class="flex-1 p-4 lg:p-10 overflow-y-auto">

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

        <div v-if="currentTab === 'apk'" class="animate-fade-in space-y-8 max-w-5xl">
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">

            <div class="form-container" :class="isDark ? 'card-dark' : 'card-light'">
              <div class="flex items-center gap-3 mb-6">
                <i class="fas fa-cloud-arrow-up text-blue-500"></i>
                <h3 class="text-xs font-black uppercase tracking-widest">Actualizar Software</h3>
              </div>

              <div class="drop-zone group" @click="$refs.fileInput.click()">
                <input type="file" ref="fileInput" @change="handleFileUpload" class="hidden" accept=".apk" />
                <i
                  class="fab fa-android text-4xl mb-4 group-hover:scale-110 group-hover:text-[#FF8F00] transition-all duration-500"></i>
                <p class="text-[10px] font-black uppercase tracking-tighter opacity-60">
                  {{ selectedFile ? selectedFile.name : 'Click para subir nueva APK' }}
                </p>
                <p v-if="selectedFile" class="text-[8px] mt-2 text-[#FF8F00] font-bold">Tamaño: {{ (selectedFile.size /
                  (1024 * 1024)).toFixed(2) }} MB</p>
              </div>

              <button v-if="selectedFile" @click="uploadApkFile"
                class="w-full mt-6 py-4 bg-[#FF8F00] text-black font-black rounded-2xl text-[10px] uppercase shadow-xl shadow-[#FF8F00]/20 hover:scale-[1.02] active:scale-95 transition-all">
                Publicar Versión Actual
              </button>
            </div>

            <div class="form-container" :class="isDark ? 'card-dark' : 'card-light'">
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                  <i class="fas fa-list-check text-emerald-500"></i>
                  <h3 class="text-xs font-black uppercase tracking-widest">Control de Cambios</h3>
                </div>
                <button @click="addNote"
                  class="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
                  <i class="fas fa-plus text-xs"></i>
                </button>
              </div>

              <div class="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scroll">
                <TransitionGroup name="list">
                  <div v-for="(note, index) in localChangelog" :key="index" class="flex gap-2 group">
                    <div class="flex-1 relative">
                      <i
                        class="fas fa-chevron-right absolute left-3 top-1/2 -translate-y-1/2 text-[8px] opacity-30"></i>
                      <input v-model="localChangelog[index]"
                        class="w-full bg-slate-500/5 border border-slate-500/10 pl-8 pr-4 py-3 rounded-xl text-[10px] font-bold focus:border-[#FF8F00] outline-none transition-all"
                        placeholder="Ej: Optimización de velocidad..." />
                    </div>
                    <button @click="removeNote(index)"
                      class="w-10 h-10 shrink-0 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-all">
                      <i class="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </TransitionGroup>
              </div>

              <button @click="saveChangelog"
                class="w-full mt-6 py-4 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all">
                Guardar Novedades
              </button>
            </div>

          </div>
        </div>




        <div v-if="currentTab === 'companies'" class="animate-fade-in space-y-8 p-2">

          <div class="flex justify-between items-center p-6 rounded-3xl border transition-all duration-500 shadow-2xl"
            :class="isDark
              ? 'bg-white/5 border-white/10'
              : 'bg-white border-slate-200 shadow-slate-200/50'">
            <div>
              <h2 class="text-xs font-black uppercase tracking-[0.3em] text-[#FF8F00]">Sincronización Maestra</h2>
              <p class="text-[9px] font-bold uppercase mt-1"
                :class="isDark ? 'opacity-50 text-white' : 'text-slate-500'">
                Comparativa: Odoo ERP vs WodenTrack DB
              </p>
            </div>
            <div class="space-y-4 w-full md:w-auto">
              <button @click="handleSyncCompanies" :disabled="isSyncing"
                class="w-full px-8 py-4 bg-[#FF8F00] text-black text-[11px] font-black uppercase rounded-2xl shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100">
                <div class="flex items-center justify-center gap-3">
                  <i class="fas" :class="isSyncing ? 'fa-spinner fa-spin' : 'fa-sync-alt'"></i>
                  <span>{{ isSyncing ? 'Verificando datos...' : 'Sincronizar Sedes' }}</span>
                </div>
              </button>

              <Transition name="fade">
                <div v-if="isSyncing"
                  class="w-full bg-slate-500/10 h-1.5 rounded-full overflow-hidden border border-white/5">
                  <div
                    class="h-full bg-gradient-to-r from-[#FF8F00] to-orange-300 transition-all duration-300 shadow-[0_0_10px_#FF8F00]"
                    :style="{ width: syncProgress + '%' }">
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">

            <div class="space-y-4">
              <div class="flex items-center gap-3 px-2">
                <i class="fas fa-server text-[#FF8F00] text-[10px]"></i>
                <h3 class="text-[10px] font-black uppercase tracking-widest"
                  :class="isDark ? 'opacity-70 text-white' : 'text-slate-600'">Origen: Odoo ERP</h3>
              </div>

              <div class="rounded-3xl border overflow-hidden shadow-2xl transition-all duration-500"
                :class="isDark ? 'bg-[#0f172a]/60 border-white/5' : 'bg-white border-slate-200'">
                <div class="max-h-[500px] overflow-y-auto custom-scroll">
                  <table class="w-full text-left border-collapse">
                    <thead class="sticky top-0 z-10" :class="isDark ? 'bg-[#161f33]' : 'bg-slate-50'">
                      <tr class="text-[8px] uppercase font-black"
                        :class="isDark ? 'opacity-40 text-white' : 'text-slate-400'">
                        <th class="p-4 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">ID</th>
                        <th class="p-4 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">Nombre en ERP
                        </th>
                      </tr>
                    </thead>
                    <tbody class="text-[10px] font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-700'">
                      <tr v-for="c in odooCompanies" :key="c.id" class="border-b border-white/5">
                        <td class="p-4 text-blue-400 font-mono">#{{ c.id }}</td>
                        <td class="p-4 uppercase flex items-center justify-between">
                          {{ c.name }}
                          <i v-if="dbCompanies.some(db => db.id === c.id)"
                            class="fas fa-check-circle text-emerald-500 text-[10px]" title="Ya en base de datos"></i>
                        </td>
                      </tr>
                      <tr v-if="odooCompanies.length === 0">
                        <td colspan="2" class="p-10 text-center opacity-30 text-[10px] uppercase font-black">Cargando
                          datos de Odoo...</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="flex items-center gap-3 px-2">
                <i class="fas fa-database text-blue-500 text-[10px]"></i>
                <h3 class="text-[10px] font-black uppercase tracking-widest"
                  :class="isDark ? 'opacity-70 text-white' : 'text-slate-600'">DB Local: WodenTrack</h3>
              </div>

              <div class="rounded-3xl border overflow-hidden shadow-2xl transition-all duration-500"
                :class="isDark ? 'bg-[#0f172a]/80 border-[#FF8F00]/10' : 'bg-white border-slate-200'">
                <div class="max-h-[500px] overflow-y-auto custom-scroll">
                  <table class="w-full text-left border-collapse">
                    <thead class="sticky top-0 z-10" :class="isDark ? 'bg-[#1e273a]' : 'bg-slate-50'">
                      <tr class="text-[8px] uppercase font-black"
                        :class="isDark ? 'text-[#FF8F00]/60' : 'text-slate-400'">
                        <th class="p-4 border-b" :class="isDark ? 'border-[#FF8F00]/10' : 'border-slate-100'">Compañía
                          Local</th>
                        <th class="p-4 border-b text-center"
                          :class="isDark ? 'border-[#FF8F00]/10' : 'border-slate-100'">Estado</th>
                        <th class="p-4 border-b text-right"
                          :class="isDark ? 'border-[#FF8F00]/10' : 'border-slate-100'">Visible</th>
                      </tr>
                    </thead>
                    <tbody class="text-[10px] font-black uppercase" :class="isDark ? 'text-white' : 'text-slate-700'">
                      <tr v-for="comp in dbCompanies" :key="comp.id" class="border-b transition-all" :class="[
                        isDark ? 'border-white/5 hover:bg-[#FF8F00]/5' : 'border-slate-50 hover:bg-slate-50',
                        !comp.is_active && 'opacity-30 grayscale'
                      ]">
                        <td class="p-4 truncate max-w-[200px]">{{ comp.name }}</td>
                        <td class="p-4 text-center">
                          <span :class="comp.is_active ? 'text-emerald-500' : 'text-rose-500'"
                            class="text-[8px] font-black tracking-tighter">
                            {{ comp.is_active ? '● ACTIVA' : '○ OCULTA' }}
                          </span>
                        </td>
                        <td class="p-4 text-right text-black">
                          <button @click="handleToggleCompany(comp.id, comp.is_active)"
                            class="w-10 h-5 rounded-full relative transition-all"
                            :class="comp.is_active ? 'bg-emerald-600' : 'bg-slate-300'">
                            <div class="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all"
                              :class="comp.is_active ? 'translate-x-5' : 'translate-x-0'"></div>
                          </button>
                        </td>
                      </tr>
                      <tr v-if="dbCompanies.length === 0">
                        <td colspan="3" class="p-10 text-center opacity-30 text-[10px] uppercase font-black">No hay
                          datos en SQL Server</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
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

            <div class="flex items-center gap-3 flex-1 max-w-2xl justify-end">
              <div class="relative flex-1 max-w-[200px]">
                <i class="fas fa-search absolute left-2 top-1/2 -translate-y-1/2 opacity-20 text-[9px]"></i>
                <input v-model="searchUser" type="text" placeholder="Buscar..."
                  class="w-full pl-6 pr-2 py-1.5 bg-transparent border-b border-slate-500/20 focus:border-[#FF8F00] outline-none text-[10px] font-bold transition-all" />
              </div>

              <select v-model="selectedCountry"
                class="bg-transparent border-b border-slate-500/20 outline-none text-[10px] font-black uppercase cursor-pointer text-blue-500 max-w-[100px] py-1">
                <option value="TODOS">País</option>
                <option v-for="c in odooCompanies" :key="c.id" :value="c.name">{{ c.name }}</option>
              </select>

              <select v-model="selectedDept"
                class="bg-transparent border-b border-slate-500/20 outline-none text-[10px] font-black uppercase cursor-pointer text-[#FF8F00] max-w-[100px] py-1">
                <option v-for="dept in departamentosUnicos" :key="dept" :value="dept">{{ dept }}</option>
              </select>

              <button @click="handleSyncUsers" :disabled="isSyncingUsers"
                class="flex items-center gap-2 px-3 py-1.5 bg-[#FF8F00] text-black text-[9px] font-black uppercase rounded-lg hover:opacity-80 transition-all disabled:opacity-30 shrink-0">
                <i class="fas" :class="isSyncingUsers ? 'fa-spinner fa-spin' : 'fa-sync-alt'"></i>
                <span>{{ isSyncingUsers ? '...' : 'Sinc' }}</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">

            <div class="rounded-xl border border-white/5 overflow-hidden flex flex-col h-[500px]"
              :class="isDark ? 'bg-slate-900/40' : 'bg-white shadow-sm'">

              <div class="p-2 border-b border-white/5 flex justify-between items-center bg-blue-500/5">
                <span class="text-[9px] font-black uppercase text-blue-500 tracking-widest">Odoo ERP</span>
                <span class="text-[8px] font-bold opacity-40">{{ filteredOdoo?.length }} items</span>
              </div>

              <div class="flex-1 overflow-y-auto overflow-x-hidden custom-scroll relative">
                <table class="w-full text-left border-collapse table-fixed">
                  <thead class="sticky top-0 z-20" :class="isDark ? 'bg-[#161f33]' : 'bg-slate-50'">
                    <tr class="text-[9px] uppercase font-black tracking-wider text-slate-500">
                      <th class="p-2 border-b border-white/5 w-12 text-center">ID</th>
                      <th class="p-2 border-b border-white/5 w-1/2">Colaborador</th>
                      <th class="p-2 border-b border-white/5 w-1/3">Departamento</th>
                    </tr>
                  </thead>
                  <tbody class="text-[10px] font-bold">
                    <tr v-for="u in (filteredOdoo || [])" :key="u.id"
                      class="border-b border-white/5 hover:bg-blue-500/5 transition-colors">
                      <td class="p-2 font-mono text-blue-400 text-center">#{{ u.id }}</td>
                      <td class="p-2">
                        <div class="flex flex-col truncate">
                          <span class="font-black uppercase truncate"
                            :class="isDark ? 'text-slate-100' : 'text-slate-900'">{{ u.name }}</span>
                          <span class="text-[8px] font-bold text-[#FF8F00] truncate tracking-tight">{{ u.job_title ||
                            '---' }}</span>
                        </div>
                      </td>
                      <td class="p-2 truncate italic opacity-60 text-[9px]">{{ u.department_id ? u.department_id[1] :
                        'S/A' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="rounded-xl border border-white/5 overflow-hidden flex flex-col h-[500px]"
              :class="isDark ? 'bg-slate-900/60' : 'bg-white shadow-sm'">

              <div class="p-2 border-b border-white/5 flex justify-between items-center bg-emerald-500/5">
                <span class="text-[9px] font-black uppercase text-emerald-500 tracking-widest">WodenTrack SQL</span>
                <span class="text-[8px] font-bold opacity-40">{{ filteredLocal?.length }} items</span>
              </div>

              <div class="flex-1 overflow-y-auto overflow-x-hidden custom-scroll relative">
                <table class="w-full text-left border-collapse table-fixed">
                  <thead class="sticky top-0 z-20" :class="isDark ? 'bg-[#1e273a]' : 'bg-slate-50'">
                    <tr class="text-[9px] uppercase font-black tracking-wider text-slate-500">
                      <th class="p-2 border-b border-white/5 w-20">Cédula</th>
                      <th class="p-2 border-b border-white/5">Nombre / Depto</th>
                      <th class="p-2 border-b border-white/5 w-24 text-center">Accesos Modulares</th>
                      <th class="p-2 border-b border-white/5 w-10 text-center">Est</th>
                    </tr>
                  </thead>
                  <tbody class="text-[10px] font-bold">
                    <tr v-for="user in filteredLocal" :key="user.id_odoo" class="border-b transition-all"
                      :class="isDark ? 'border-white/5 hover:bg-emerald-500/5' : 'border-slate-100 hover:bg-slate-50'">

                      <td class="p-2 font-mono font-black text-emerald-500 truncate">{{ user.identificacion }}</td>

                      <td class="p-2">
                        <div class="flex flex-col truncate">
                          <span class="font-black uppercase truncate"
                            :class="isDark ? 'text-slate-100' : 'text-slate-800'">
                            {{ user.nombre }}
                          </span>
                          <span class="text-[8px] font-bold text-blue-500 mt-0.5 truncate">
                            {{ user.departamento }}
                          </span>
                        </div>
                      </td>

                      <td class="p-2 text-center">
                        <button @click="openPerms(user)"
                          class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#FF8F00]/20 hover:border-[#FF8F00]/40 transition-all group">
                          <i class="fas fa-key text-[10px] group-hover:text-[#FF8F00] transition-colors"
                            :class="user.permisos?.length > 0 ? 'text-[#FF8F00]' : 'text-slate-500'"></i>
                        </button>
                      </td>

                      <td class="p-2 text-center">
                        <div :class="user.is_active ? 'bg-emerald-500' : 'bg-rose-500'"
                          class="w-1.5 h-1.5 rounded-full inline-block"></div>
                      </td>
                    </tr>
                  </tbody>
                </table>
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

                    <div class="space-y-3 overflow-y-auto pr-2 custom-scroll flex-1">
                      <div
                        v-for="slug in ['super.superadmin', 'super.dashboard', 'super.gestionarapk', 'super.companias', 'super.personal', 'admin.admin', 'admin.asistencias', 'admin.mallas', 'admin.novedades']"
                        :key="slug"
                        class="flex items-center justify-between p-4 rounded-2xl bg-black/5 border border-white/5 transition-colors hover:bg-black/10">

                        <div class="mr-4">
                          <span class="text-[10px] font-black uppercase tracking-wider">
                            {{ slug.replace('.', ' ') }}
                          </span>
                          <p class="text-[8px] opacity-40 font-bold uppercase leading-tight">Módulo del sistema</p>
                        </div>

                        <label class="relative inline-flex items-center cursor-pointer shrink-0">
                          <input type="checkbox" :checked="hasPerm(selectedUserPerms, slug)"
                            @change="togglePermisoLocal(selectedUserPerms, slug)" class="sr-only peer">
                          <div
                            class="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:bg-[#FF8F00] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all">
                          </div>
                        </label>
                      </div>
                    </div>

                    <button @click="selectedUserPerms = null"
                      class="w-full mt-6 py-3 bg-[#FF8F00] text-black font-black text-[11px] rounded-xl active:scale-95 transition-all uppercase tracking-widest shrink-0 shadow-lg shadow-orange-500/20">
                      Finalizar Cambios
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>



      </div>
    </main>
  </div>
</template>
