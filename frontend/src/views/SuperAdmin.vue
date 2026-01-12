<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAttendance } from '../composables/UserLogica/useAttendance.js';
import { useApkRepo } from '../composables/adminLogica/useApkRepo.js';

const { logout, isDark, toggleTheme } = useAttendance();
const { apkData, fetchApkInfo, subirApk, guardarNovedades } = useApkRepo();

const currentTab = ref('stats');
const isSidebarOpen = ref(true);
const mallasData = ref([]);
const asistenciasHoy = ref(0);
const selectedFile = ref(null);
const localChangelog = ref([]);

// Sistema de Notificación Local
const notification = ref({ show: false, message: '', type: 'success' });

const showNotification = (msg, type = 'success') => {
  notification.value = { show: true, message: msg, type };
  setTimeout(() => notification.value.show = false, 4000);
};

const tabClass = (active) => [
  'w-full flex items-center p-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300',
  active 
    ? 'bg-[#FF8F00] text-black shadow-lg shadow-[#FF8F00]/20' 
    : isDark.value ? 'text-slate-500 hover:bg-white/5' : 'text-slate-400 hover:bg-black/5'
];

onMounted(async () => {
  await fetchApkInfo();
  if (apkData.value) {
    localChangelog.value = [...apkData.value.changelog];
  }
});

const addNote = () => localChangelog.value.push("");
const removeNote = (i) => localChangelog.value.splice(i, 1);

const handleFileUpload = (e) => {
  selectedFile.value = e.target.files[0];
};

const saveChangelog = async () => {
  try {
    await guardarNovedades(localChangelog.value);
    showNotification("Novedades sincronizadas correctamente");
  } catch (e) {
    showNotification("Error al guardar novedades", "error");
  }
};

const uploadApkFile = async () => {
  if (!selectedFile.value) return;
  try {
    await subirApk(selectedFile.value);
    showNotification("Nueva versión desplegada con éxito");
    selectedFile.value = null;
    await fetchApkInfo();
  } catch (e) {
    showNotification("Fallo en la subida del archivo", "error");
  }
};
</script>

<template>
  <div class="flex min-h-screen transition-colors duration-500" :class="isDark ? 'bg-[#020617] text-slate-200' : 'bg-[#F8FAFC] text-slate-800'">
    
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
        <div class="w-10 h-10 shrink-0 bg-[#FF8F00] rounded-2xl flex items-center justify-center text-black shadow-lg shadow-[#FF8F00]/20">
          <i class="fas fa-shield-alt"></i>
        </div>
        <span v-if="isSidebarOpen" class="font-black italic text-xl tracking-tighter">WODEN<span class="text-[#FF8F00]">ADMIN</span></span>
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
      </nav>

      <div class="space-y-4">
        <button @click="toggleTheme" class="w-full flex items-center p-3 rounded-xl text-[10px] font-bold uppercase transition-all hover:bg-slate-500/10" :class="!isSidebarOpen && 'justify-center'">
          <i :class="[isDark ? 'fas fa-sun text-yellow-500' : 'fas fa-moon text-indigo-500', isSidebarOpen && 'mr-3']"></i>
          <span v-if="isSidebarOpen">{{ isDark ? 'Modo Claro' : 'Modo Oscuro' }}</span>
        </button>
        <button @click="logout" class="w-full flex items-center p-3 text-[10px] font-black uppercase text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all" :class="!isSidebarOpen && 'justify-center'">
          <i class="fas fa-sign-out-alt" :class="isSidebarOpen && 'mr-3'"></i>
          <span v-if="isSidebarOpen">Salir</span>
        </button>
      </div>
    </aside>

    <main class="flex-1 flex flex-col h-screen overflow-hidden">
      <header class="h-16 flex items-center justify-between px-8 border-b transition-colors" :class="isDark ? 'bg-[#0f172a]/50 border-white/5' : 'bg-white border-slate-200'">
        <button @click="isSidebarOpen = !isSidebarOpen" class="p-2 rounded-lg hover:bg-slate-500/10">
          <i class="fas fa-bars"></i>
        </button>
        <div class="flex items-center gap-4">
          <span class="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase rounded-full">Sistema Activo</span>
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
                <i class="fab fa-android text-4xl mb-4 group-hover:scale-110 group-hover:text-[#FF8F00] transition-all duration-500"></i>
                <p class="text-[10px] font-black uppercase tracking-tighter opacity-60">
                  {{ selectedFile ? selectedFile.name : 'Click para subir nueva APK' }}
                </p>
                <p v-if="selectedFile" class="text-[8px] mt-2 text-[#FF8F00] font-bold">Tamaño: {{ (selectedFile.size / (1024*1024)).toFixed(2) }} MB</p>
              </div>

              <button v-if="selectedFile" @click="uploadApkFile" class="w-full mt-6 py-4 bg-[#FF8F00] text-black font-black rounded-2xl text-[10px] uppercase shadow-xl shadow-[#FF8F00]/20 hover:scale-[1.02] active:scale-95 transition-all">
                Publicar Versión Actual
              </button>
            </div>

            <div class="form-container" :class="isDark ? 'card-dark' : 'card-light'">
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                  <i class="fas fa-list-check text-emerald-500"></i>
                  <h3 class="text-xs font-black uppercase tracking-widest">Control de Cambios</h3>
                </div>
                <button @click="addNote" class="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
                  <i class="fas fa-plus text-xs"></i>
                </button>
              </div>

              <div class="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scroll">
                <TransitionGroup name="list">
                  <div v-for="(note, index) in localChangelog" :key="index" class="flex gap-2 group">
                    <div class="flex-1 relative">
                       <i class="fas fa-chevron-right absolute left-3 top-1/2 -translate-y-1/2 text-[8px] opacity-30"></i>
                       <input v-model="localChangelog[index]" 
                              class="w-full bg-slate-500/5 border border-slate-500/10 pl-8 pr-4 py-3 rounded-xl text-[10px] font-bold focus:border-[#FF8F00] outline-none transition-all"
                              placeholder="Ej: Optimización de velocidad..." />
                    </div>
                    <button @click="removeNote(index)" class="w-10 h-10 shrink-0 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-all">
                      <i class="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </TransitionGroup>
              </div>

              <button @click="saveChangelog" class="w-full mt-6 py-4 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all">
                Guardar Novedades
              </button>
            </div>

          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.stat-card { @apply p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col; }
.stat-card.destaque { @apply border-[#FF8F00]/30 bg-[#FF8F00]/5; }
.card-dark { @apply bg-white/5 border-white/5; }
.card-light { @apply bg-white border-slate-200 shadow-sm; }

.stat-card .label { @apply text-[10px] uppercase font-black opacity-40 tracking-widest; }
.stat-card .value { @apply text-5xl font-black italic; }

.form-container { @apply p-8 rounded-[3rem] border transition-all; }

.drop-zone {
  @apply border-2 border-dashed border-slate-500/20 rounded-[2.5rem] p-12 text-center transition-all cursor-pointer flex flex-col items-center;
}
.drop-zone:hover { @apply border-[#FF8F00]/50 bg-[#FF8F00]/5; }

.animate-fade-in { animation: fadeIn 0.6s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

/* TRANSICIONES */
.notification-enter-active, .notification-leave-active { transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.notification-enter-from { opacity: 0; transform: translateX(100px); }
.notification-leave-to { opacity: 0; transform: scale(0.9); }

.list-enter-active, .list-leave-active { transition: all 0.3s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateX(-20px); }

.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,143,0,0.2); border-radius: 10px; }
</style>