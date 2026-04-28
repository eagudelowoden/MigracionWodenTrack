<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
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
import '../assets/css/admin-style.css';
import '../assets/css/SuperAdmin.css';


// --- 1. CONFIGURACIÓN ---
const API_URL = import.meta.env.VITE_API_URL;

const props = defineProps({ isDark: Boolean });
const router = useRouter();
const { logout, isDark, toggleTheme, employee } = useAttendance();
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
    if (data.tipo === 'area') {
      await crearArea({ nombre: data.nombre, responsableId: data.responsableId, departamento: data.departamento });
    } else {
      await crearSegmento({ nombre: data.nombre, responsableId: data.responsableId });
    }
    showNotification(`${data.tipo.toUpperCase()} guardado con éxito`);
  } catch (e) {
    showNotification("Error al guardar la estructura", "error");
  }
};

const handleUpdateArea = async ({ id, departamento, responsableId, nombre }) => {
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
// --- Estado Local Restante ---
const currentTab = ref('stats');
const isSidebarOpen = ref(true);


// --- Sistema de Notificación ---
const notification = ref({ show: false, message: '', type: 'success' });
const showNotification = (msg, type = 'success') => {
  notification.value = { show: true, message: msg, type };
  setTimeout(() => notification.value.show = false, 5000);
};

// SuperAdmin.vue — agrega estas funciones
const togglePermisoLocal = async (user, slug) => {
  const activo = !hasPerm(user, slug);
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const res = await fetch(`${API_URL}/asignar-permiso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idOdoo: user.id_odoo,
        modulo: slug,
        activo: activo,
        adminName: session.name || 'Desconocido'
      })
    });
    if (!res.ok) throw new Error();

    // Refrescar el usuario en la tabla local
    await fetchDbUsuarios();

    // Actualizar el usuario seleccionado para que el modal refleje el cambio
    const actualizado = dbUsuarios.value.find(u => u.id_odoo === user.id_odoo);
    if (actualizado) selectedUserPerms.value = { ...actualizado };

    showNotification(`Permiso ${activo ? 'asignado' : 'removido'}`);
  } catch (e) {
    showNotification('Error al actualizar permiso', 'error');
  }
};

const updateUserStructure = async (user, field) => {
  try {
    const res = await fetch(`${API_URL}/actualizar-estructura`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idOdoo: user.id_odoo,
        campo: field,
        valor: user[field],
        adminName: employee.value?.name || 'Desconocido',
      })
    });
    if (!res.ok) throw new Error();
    showNotification('Cambio guardado');
  } catch (e) {
    showNotification('Error al guardar', 'error');
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
            estructura: ['fas fa-sitemap', 'Organización'],
            mallas: ['fas fa-calendar-alt', 'Mallas'],
            config: ['fas fa-sliders', 'Configuraciones'],
            api: ['fas fa-plug', 'API Externa']
          }" :key="key" @click="currentTab = key" :class="[
            'w-full flex items-center rounded-lg transition-all duration-200 p-2.5 text-[10px] font-bold uppercase',
            currentTab === key ? 'bg-[#FF8F00] text-black shadow-md' : 'hover:bg-slate-500/10',
            !isSidebarOpen && 'lg:justify-center'
          ]" :title="item[1]">
            <i :class="[item[0], isSidebarOpen ? 'mr-3 text-sm' : 'text-lg']"></i>
            <span v-if="isSidebarOpen" class="truncate">{{ item[1] }}</span>
          </button>
        </nav>

        <!-- Navegación rápida: solo visible para DESARROLLADOR -->
        <div v-if="employee?.isSuperAdmin" class="pt-3 pb-1 space-y-1 border-t border-white/5">
          <p v-if="isSidebarOpen" class="px-2 text-[8px] font-black uppercase opacity-40 tracking-widest mb-1">Dev Nav</p>
          <button @click="router.push('/super-admin')"
            :title="'Super Admin'"
            class="w-full flex items-center p-2 rounded-lg text-[9px] font-bold uppercase hover:bg-[#FF8F00]/20 transition-all"
            :class="!isSidebarOpen && 'lg:justify-center'">
            <i class="fas fa-shield-halved text-[#FF8F00]" :class="isSidebarOpen && 'mr-3'"></i>
            <span v-if="isSidebarOpen">Super Admin</span>
          </button>
          <button @click="router.push('/admin')"
            :title="'Admin'"
            class="w-full flex items-center p-2 rounded-lg text-[9px] font-bold uppercase hover:bg-[#FF8F00]/20 transition-all"
            :class="!isSidebarOpen && 'lg:justify-center'">
            <i class="fas fa-user-shield text-[#FF8F00]" :class="isSidebarOpen && 'mr-3'"></i>
            <span v-if="isSidebarOpen">Admin</span>
          </button>
          <button @click="router.push('/marcacion')"
            :title="'Marcación'"
            class="w-full flex items-center p-2 rounded-lg text-[9px] font-bold uppercase hover:bg-[#FF8F00]/20 transition-all"
            :class="!isSidebarOpen && 'lg:justify-center'">
            <i class="fas fa-fingerprint text-[#FF8F00]" :class="isSidebarOpen && 'mr-3'"></i>
            <span v-if="isSidebarOpen">Marcación</span>
          </button>
        </div>

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

      <div class="flex-1 p-4 lg:p-4 overflow-y-auto flex flex-col">

        <!-- TEMPLATE DASHBOARD -->
        <div v-if="currentTab === 'stats'" class="animate-fade-in p-2">
          <GestionDashboard :isDark="isDark" />
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
            :segmentos="segmentos" :areasAgrupadas="areasAgrupadas"
            :departamentosDisponibles="segmentos.map(s => s.nombre)"
            @save="handleSaveEstructura"
            @update-area="handleUpdateArea" />
        </div>

        <!-- TEMPLATE MALLAS -->
        <div v-if="currentTab === 'mallas'" class="animate-fade-in p-2 flex-1 min-h-0 flex flex-col">
          <GestionMallas :isDark="isDark" @success="showNotification($event)"
            @error="showNotification($event, 'error')" />
        </div>

        <!-- TEMPLATE CONFIGURACIONES -->
        <div v-if="currentTab === 'config'" class="animate-fade-in p-2">
          <GestionConfiguraciones :isDark="isDark" @success="showNotification($event)"
            @error="showNotification($event, 'error')" />
        </div>

        <!-- TEMPLATE API EXTERNA -->
        <div v-if="currentTab === 'api'" class="animate-fade-in p-2">
          <GestionApiExterna :isDark="isDark" @success="showNotification($event)"
            @error="showNotification($event, 'error')" />
        </div>
      </div>
    </main>


    <!-- TEMPLATE — al final del template, antes del cierre -->
    <GestionPermisos v-model="selectedUserPerms" :isDark="isDark" :areas="areas" :segmentos="segmentos"
      :apiUrl="API_URL" :todosLosDepartamentos="departamentosUnicos"
      @toggle-perm="togglePermisoLocal($event.user, $event.slug)"
      @update-structure="updateUserStructure($event.user, $event.field)" />

  </div>
</template>
