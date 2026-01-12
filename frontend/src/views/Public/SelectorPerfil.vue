<template>
  <div class="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-white font-sans">
    <div class="max-w-4xl w-full space-y-8 text-center">
      <div>
        <h1 class="text-4xl font-black italic text-[#FF8F00] uppercase tracking-tighter">Woden Control Center</h1>
        <p class="opacity-50 font-bold uppercase text-xs tracking-[0.4em] mt-2 text-white">Selecciona tu modo de operación</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button @click="selectRole('/marcacion')" class="role-card group">
          <div class="icon-box bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white">
            <i class="fas fa-fingerprint text-3xl"></i>
          </div>
          <h3 class="font-black italic uppercase">Marcación</h3>
          <p class="text-[10px] opacity-40 uppercase font-bold leading-tight">Registrar entrada y salida de turno</p>
        </button>

        <button @click="selectRole('/admin')" class="role-card group">
          <div class="icon-box bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white">
            <i class="fas fa-user-tie text-3xl"></i>
          </div>
          <h3 class="font-black italic uppercase">Administrador</h3>
          <p class="text-[10px] opacity-40 uppercase font-bold leading-tight">Control de asistencia y mallas</p>
        </button>

        <button @click="selectRole('/super-admin')" class="role-card group border-[#FF8F00]/30 shadow-2xl shadow-[#FF8F00]/5">
          <div class="icon-box bg-[#FF8F00]/10 text-[#FF8F00] group-hover:bg-[#FF8F00] group-hover:text-black">
            <i class="fas fa-crown text-3xl"></i>
          </div>
          <h3 class="font-black italic uppercase text-[#FF8F00]">Super Admin</h3>
          <p class="text-[10px] opacity-40 uppercase font-bold leading-tight">Consola central y configuración</p>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
const selectRole = (path) => router.push(path);
</script>

<style scoped>
.role-card {
  @apply bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all duration-300 hover:scale-105 hover:bg-white/10;
}
.icon-box {
  @apply w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500;
}
</style>