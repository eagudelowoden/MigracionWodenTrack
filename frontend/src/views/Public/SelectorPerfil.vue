<template>
  <div
    class="min-h-screen flex items-center justify-center p-6 font-sans relative overflow-hidden transition-colors duration-300 select-none"
    :class="isDark ? 'bg-[#1a1f35] text-[#F5F5F7]' : 'bg-[#F4F6FA] text-[#111827]'">

    <!-- FONDO UNIFICADO WODENTRACK -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <!-- Patrón de cuadrícula/puntos sutil -->
      <div class="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style="background-image: radial-gradient(#111827 1px, transparent 1px); background-size: 24px 24px;">
      </div>

      <!-- Resplandor 1: Azul institucional (Arriba a la izquierda) -->
      <div class="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] transition-opacity duration-300"
        :class="isDark ? 'bg-blue-500/10' : 'bg-blue-400/20'">
      </div>

      <!-- Resplandor 2: Naranja WodenTrack (Abajo a la derecha) -->
      <div class="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[120px] transition-opacity duration-300"
        :class="isDark ? 'bg-[#e88710]/10' : 'bg-[#e88710]/15'">
      </div>
    </div>

    <!-- CONTENEDOR PRINCIPAL -->
    <div class="max-w-4xl w-full space-y-10 relative z-10 py-6">

      <!-- Encabezado / Identidad Corporativa -->
      <header
        class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 text-left animate-fade-in"
        :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
        <div class="space-y-1.5">
          <!-- Logotipo unificado con el naranja de tu marca -->
          <div class="flex items-center gap-2 text-[#e88710] font-bold text-xl tracking-tight mb-1">
            <span
              class="w-6 h-6 rounded-md bg-[#e88710] text-white flex items-center justify-center text-xs font-black shadow-sm">W</span>
            <span class="font-extrabold">Woden<span
                :class="isDark ? 'text-white' : 'text-[#111827]'">Track</span></span>
          </div>
          <h1 class="text-2xl md:text-3xl font-bold tracking-tight">
            Hola, <span class="font-normal text-lg md:text-2xl block md:inline"
              :class="isDark ? 'text-[#8895B3]' : 'text-[#64748B]'">selecciona tu espacio de trabajo</span>
          </h1>
        </div>

        <!-- Indicador de cuenta/sesión limpia con efecto cristal o block -->
        <div class="text-[12px] font-medium px-3 py-1.5 rounded-full backdrop-blur-md self-start md:self-auto border"
          :class="isDark ? 'bg-[#161B26]/90 border-[#222938] text-[#8895B3]' : 'bg-white border-transparent text-[#64748B] shadow-[0_4px_12px_rgba(0,0,0,0.02)]'">
          <i class="fa-solid fa-shield-halved mr-1.5 text-[#e88710]"></i>
          Sesión Activa
        </div>
      </header>

      <!-- Grid de Opciones (Tarjetas Premium Acristaladas) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">

        <!-- Card: Marcación -->
        <button @click="selectRole('/marcacion')"
          class="group relative p-6 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between min-h-[170px] backdrop-blur-md"
          :class="isDark
            ? 'bg-[#161B26]/90 border-[#222938] hover:border-[#e88710] hover:bg-[#1c2333]/90'
            : 'bg-white/90 border-transparent shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)]'">

          <div>
            <!-- Burbuja de icono interactiva con azul y naranja -->
            <div
              class="w-11 h-11 flex items-center justify-center rounded-xl text-base transition-all duration-300 border"
              :class="isDark
                ? 'bg-[#0B0F19] border-[#222938] text-white group-hover:bg-[#e88710] group-hover:border-[#e88710]'
                : 'bg-[#F4F6FA] border-transparent text-[#111827] group-hover:bg-[#2563EB] group-hover:text-white'">
              <i class="fas fa-fingerprint"></i>
            </div>
            <h3 class="font-bold text-[17px] tracking-tight mt-4" :class="isDark ? 'text-white' : 'text-[#111827]'">
              Marcación de Asistencia
            </h3>
          </div>

          <p
            class="text-[13px] mt-2 font-semibold text-[#2563EB] dark:text-[#e88710] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Registrar turno <i class="fas fa-chevron-right text-[10px] ml-0.5"></i>
          </p>
        </button>

        <!-- Card: Administrador -->
        <button v-if="session?.isSuperAdmin || session?.role === 'admin' || session?.permisos?.['admin.admin']"
          @click="selectRole('/admin')"
          class="group relative p-6 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between min-h-[170px] backdrop-blur-md"
          :class="isDark
            ? 'bg-[#161B26]/90 border-[#222938] hover:border-[#e88710] hover:bg-[#1c2333]/90'
            : 'bg-white/90 border-transparent shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)]'">

          <div>
            <div
              class="w-11 h-11 flex items-center justify-center rounded-xl text-base transition-all duration-300 border"
              :class="isDark
                ? 'bg-[#0B0F19] border-[#222938] text-white group-hover:bg-[#e88710] group-hover:border-[#e88710]'
                : 'bg-[#F4F6FA] border-transparent text-[#111827] group-hover:bg-[#2563EB] group-hover:text-white'">
              <i class="fas fa-user-tie"></i>
            </div>
            <h3 class="font-bold text-[17px] tracking-tight mt-4" :class="isDark ? 'text-white' : 'text-[#111827]'">
              Panel de Administración
            </h3>
          </div>

          <p
            class="text-[13px] mt-2 font-semibold text-[#2563EB] dark:text-[#e88710] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Gestionar mallas <i class="fas fa-chevron-right text-[10px] ml-0.5"></i>
          </p>
        </button>

        <!-- Card: Super Admin -->
        <button v-if="session?.isSuperAdmin || session?.permisos?.['super.superadmin']"
          @click="selectRole('/super-admin')"
          class="group relative p-6 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between min-h-[170px] backdrop-blur-md"
          :class="isDark
            ? 'bg-[#161B26]/90 border-[#222938] hover:border-[#e88710] hover:bg-[#1c2333]/90'
            : 'bg-white/90 border-transparent shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)]'">

          <div>
            <div
              class="w-11 h-11 flex items-center justify-center rounded-xl text-base transition-all duration-300 border"
              :class="isDark
                ? 'bg-[#0B0F19] border-[#222938] text-white group-hover:bg-[#e88710] group-hover:border-[#e88710]'
                : 'bg-[#F4F6FA] border-transparent text-[#111827] group-hover:bg-[#2563EB] group-hover:text-white'">
              <i class="fas fa-crown"></i>
            </div>
            <h3 class="font-bold text-[17px] tracking-tight mt-4" :class="isDark ? 'text-white' : 'text-[#111827]'">
              Configuración Maestra
            </h3>
          </div>

          <p
            class="text-[13px] mt-2 font-semibold text-[#2563EB] dark:text-[#e88710] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Consola raíz <i class="fas fa-chevron-right text-[10px] ml-0.5"></i>
          </p>
        </button>
      </div>

      <!-- Footer / Barra de Herramientas e Interfaz -->
      <footer class="pt-6 flex justify-between items-center text-[12px] border-t"
        :class="isDark ? 'border-[#222938] text-[#8895B3]' : 'border-slate-200 text-[#64748B]'">
        <span class="font-medium">WodenTrack © 2026</span>

        <div class="flex items-center gap-5">
          <button @click="toggleTheme"
            class="transition-colors flex items-center gap-1.5 hover:text-[#e88710] dark:hover:text-white">
            <i :class="isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'"></i>
            <span>{{ isDark ? 'Modo Claro' : 'Modo Oscuro' }}</span>
          </button>

          <span class="opacity-30">|</span>

          <router-link to="/download"
            class="transition-colors flex items-center gap-1.5 hover:text-[#2563EB] dark:hover:text-white">
            <i class="fab fa-android"></i>
            <span>Descargar APK</span>
          </router-link>
        </div>
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

  0%,
  100% {
    transform: translate(0, 0);
  }

  50% {
    transform: translate(-1.5%, 3%);
  }
}

.animate-float {
  animation: float 15s ease-in-out infinite;
}

h3,
p {
  @apply transition-colors duration-300;
}
</style>
