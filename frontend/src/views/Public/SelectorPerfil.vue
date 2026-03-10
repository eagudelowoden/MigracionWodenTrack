<template>
  <div class="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden transition-colors duration-700"
    :class="isDark ? 'bg-[#0f172a] text-white' : 'bg-[#F8FAFC] text-slate-900'">
    
    <div class="absolute inset-0 z-0 pointer-events-none">
      <div class="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-pulse"
           :class="isDark ? 'bg-orange-500/15' : 'bg-orange-200/40'"></div>
      <div class="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] animate-float"
           :class="isDark ? 'bg-blue-400/10' : 'bg-blue-100/50'"></div>
      
      <div class="absolute inset-0 opacity-[0.35]"
           :class="isDark ? 'brightness-200' : 'brightness-50'"
           style="background-image: radial-gradient(circle, #475569 1px, transparent 1px); background-size: 28px 28px; mask-image: radial-gradient(ellipse at center, black, transparent 95%);">
      </div>
    </div>

    <div class="max-w-4xl w-full space-y-10 text-center relative z-10 py-6">
      <header class="space-y-3">
        <div class="inline-block px-3 py-1 rounded-full border mb-2 backdrop-blur-md"
             :class="isDark ? 'bg-white/10 border-white/20 text-orange-400 shadow-lg shadow-black/20' : 'bg-slate-200/50 border-slate-300 text-orange-600'">
          <span class="text-[8px] font-black uppercase tracking-[0.25em]">
            Panel de Control Central
          </span>
        </div>
        
        <h1 class="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
          <span class="text-[#FF8F00] drop-shadow-[0_0_15px_rgba(255,143,0,0.4)]">Woden</span>
          <span :class="isDark ? 'text-white' : 'text-slate-800'"> Control</span>
        </h1>
        <p class="opacity-50 font-bold uppercase text-[9px] tracking-[0.4em]">
          Selecciona tu modo de operación
        </p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <button @click="selectRole('/marcacion')" class="role-card group" :class="cardClass">
          <div class="icon-box bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <i class="fas fa-fingerprint text-2xl"></i>
          </div>
          <div class="space-y-1.5 text-center">
            <h3 class="font-black italic uppercase text-base group-hover:text-emerald-500 transition-colors">Marcación</h3>
            <p class="text-[9px] opacity-50 uppercase font-bold leading-tight tracking-wider">Asistencia y turnos</p>
          </div>
          <div class="w-6 h-0.5 bg-emerald-500/20 rounded-full group-hover:w-12 group-hover:bg-emerald-500 transition-all duration-500"></div>
        </button>

        <button v-if="session?.isSuperAdmin || session?.role === 'admin' || session?.permisos?.['admin.admin']"
          @click="selectRole('/admin')" class="role-card group" :class="cardClass">
          <div class="icon-box bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
            <i class="fas fa-user-tie text-2xl"></i>
          </div>
          <div class="space-y-1.5 text-center">
            <h3 class="font-black italic uppercase text-base group-hover:text-blue-500 transition-colors">Administrador</h3>
            <p class="text-[9px] opacity-50 uppercase font-bold leading-tight tracking-wider">Gestión y mallas</p>
          </div>
          <div class="w-6 h-0.5 bg-blue-500/20 rounded-full group-hover:w-12 group-hover:bg-blue-500 transition-all duration-500"></div>
        </button>

        <button v-if="session?.isSuperAdmin || session?.permisos?.['super.superadmin']"
          @click="selectRole('/super-admin')" 
          class="role-card group border-[#FF8F00]/20" 
          :class="[cardClass, isDark ? 'shadow-[0_15px_40px_-15px_rgba(0,0,0,0.6)]' : 'shadow-lg']">
          <div class="icon-box bg-[#FF8F00]/10 text-[#FF8F00] group-hover:bg-[#FF8F00] group-hover:text-black group-hover:shadow-[0_0_20px_rgba(255,143,0,0.5)]">
            <i class="fas fa-crown text-2xl"></i>
          </div>
          <div class="space-y-1.5 text-center">
            <h3 class="font-black italic uppercase text-base text-[#FF8F00]">Super Admin</h3>
            <p class="text-[9px] opacity-50 uppercase font-bold leading-tight tracking-wider">Consola Central</p>
          </div>
          <div class="w-6 h-0.5 bg-[#FF8F00]/20 rounded-full group-hover:w-12 group-hover:bg-[#FF8F00] transition-all duration-500"></div>
        </button>
      </div>

      <footer class="pt-8 flex flex-col items-center gap-5">
        <button @click="toggleTheme" 
                class="flex items-center gap-2.5 px-6 py-2 rounded-full border transition-all hover:scale-105 active:scale-95 shadow-md"
                :class="isDark ? 'bg-white/10 border-white/20 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-600'">
          <i class="fas text-[12px]" :class="isDark ? 'fa-sun' : 'fa-moon'"></i>
          <span class="text-[10px] font-black uppercase tracking-widest">Modo {{ isDark ? 'Claro' : 'Oscuro' }}</span>
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ref, onMounted, computed } from 'vue';
import { useAttendance } from '../../composables/UserLogica/useAttendance.js';

const router = useRouter();
const session = ref(null);
const { isDark, toggleTheme } = useAttendance();

const cardClass = computed(() => 
  isDark.value 
    ? 'bg-[#1e293b]/40 border-white/10 hover:bg-[#334155]/60 hover:border-white/20 shadow-2xl' 
    : 'bg-white/80 border-white shadow-xl hover:bg-white hover:shadow-2xl'
);

onMounted(() => {
  const savedSession = localStorage.getItem('user_session');
  if (savedSession) {
    session.value = JSON.parse(savedSession);
  } else {
    router.push('/login');
  }
});

const selectRole = (path) => router.push(path);
</script>

<style scoped>
.role-card {
  @apply backdrop-blur-xl p-8 rounded-3xl flex flex-col items-center gap-5 transition-all duration-500 border relative overflow-hidden;
}

.icon-box {
  @apply w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 mb-1;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-1.5%, 3%); }
}

.animate-float {
  animation: float 15s ease-in-out infinite;
}

h3, p {
  @apply transition-colors duration-300;
}
</style>