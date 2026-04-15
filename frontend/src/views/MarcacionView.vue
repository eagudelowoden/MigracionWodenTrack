<template>
  <div v-if="employee"
    class="min-h-screen flex flex-col items-center justify-between p-8 transition-all duration-500 font-sans"
    :class="isDark ? 'bg-[#060a14] theme-dark text-white' : 'bg-[#f8fafc] theme-light text-[#1e293b]'">

    <header class="w-full max-w-[450px] flex items-center justify-between px-2">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-[#ff8f00] flex items-center justify-center shadow-lg">
          <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase text-[#ff8f00] tracking-widest opacity-80">Registra marcación</p>
          <h2 class="text-base font-black uppercase tracking-tight">{{ employee.name }}</h2>
        </div>
      </div>

      <button @click="toggleTheme" class="theme-toggle active:scale-90 p-3 rounded-xl border transition-all"
        :class="isDark ? 'bg-white/5 border-white/10 text-yellow-400' : 'bg-white border-slate-200 text-slate-500'">
        <span v-if="isDark">☀️</span><span v-else>🌙</span>
      </button>
    </header>

    <main class="text-center">
      <h1 class="clock-main-display tabular-nums mb-2">
        {{ currentTime?.split(' ')[0] }}
      </h1>
      <p class="text-2xl font-black text-[#ff8f00] tracking-[0.3em] uppercase opacity-90">
        {{ currentTime?.split(' ')[1] }}
      </p>

      <div v-if="employee.day_completed"
        class="mt-4 px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <span class="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Jornada Finalizada hoy</span>
      </div>
    </main>

    <footer class="w-full max-w-[450px] space-y-3">

      <!-- Botones entrada / salida -->
      <div class="action-grid grid grid-cols-2 gap-4">
        <button @click="handleAttendance" :disabled="loading || employee.is_inside || employee.day_completed"
          class="action-card btn-entrada group disabled:opacity-20 disabled:grayscale active:scale-95 transition-all"
          :class="{ 'border-emerald-500/50': employee.day_completed }">
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-white/10 shadow-sm transition-transform group-hover:not-disabled:scale-110">
            <svg v-if="employee.day_completed" class="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14" />
            </svg>
          </div>
          <span class="text-[10px] font-black uppercase tracking-widest">
            {{ employee.day_completed ? 'Completado' : (employee.is_inside ? 'Ya ingresaste' : 'Entrada') }}
          </span>
        </button>

        <button @click="handleAttendance" :disabled="loading || !employee.is_inside || employee.day_completed"
          class="action-card btn-salida group disabled:opacity-20 disabled:grayscale active:scale-95 transition-all">
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-white/10 shadow-sm transition-transform group-hover:not-disabled:scale-110">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
            </svg>
          </div>
          <span class="text-[10px] font-black uppercase tracking-widest">
            {{ employee.day_completed ? 'Finalizado' : 'Salida' }}
          </span>
        </button>
      </div>

      <!-- Separador con etiqueta -->
      <div class="flex items-center gap-3 px-1">
        <div class="flex-1 h-px" :class="isDark ? 'bg-white/5' : 'bg-slate-200'"></div>
        <span class="text-[8px] font-black uppercase tracking-[0.2em] opacity-30">Gestión</span>
        <div class="flex-1 h-px" :class="isDark ? 'bg-white/5' : 'bg-slate-200'"></div>
      </div>

      <!-- Botón Registrar Novedad -->
      <!-- <button @click="router.push('/novedad')"
        class="w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all duration-300 active:scale-95 group"
        :class="isDark
          ? 'border-white/8 bg-white/3 hover:border-[#ff8f00]/40 hover:bg-[#ff8f00]/5'
          : 'border-slate-200 bg-white hover:border-[#ff8f00]/40 hover:bg-[#ff8f00]/5 shadow-sm'">
        <div class="flex items-center gap-2">
          <div
            class="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:bg-[#ff8f00] group-hover:text-black"
            :class="isDark ? 'bg-white/8 text-slate-400' : 'bg-slate-100 text-slate-500'">
            <i class="fas fa-file-signature text-[9px]"></i>
          </div>
          <div class="text-left">
            <p class="text-[9px] font-black uppercase tracking-widest transition-colors group-hover:text-[#ff8f00]"
              :class="isDark ? 'text-slate-300' : 'text-slate-700'">
              Registrar Novedad
            </p>
            <p class="text-[7px] font-bold uppercase tracking-widest opacity-30"
              :class="isDark ? 'text-slate-500' : 'text-slate-400'">
              Permisos · Incapacidades
            </p>
          </div>
        </div>
        <i
          class="fas fa-chevron-right text-[8px] opacity-20 group-hover:opacity-60 group-hover:text-[#ff8f00] transition-all group-hover:translate-x-0.5"></i>
      </button> -->
      <!-- Cerrar sesión -->
      <div class="flex flex-col items-center gap-2 pt-2">
        <button @click="logout"
          class="text-[10px] font-black uppercase tracking-widest transition-colors hover:text-[#ff8f00]">
          Cerrar Sesión
        </button>
        <span class="text-[9px] font-bold uppercase tracking-widest opacity-40">WodenTrack Pro</span>
      </div>

    </footer>
  </div>
</template>

<script setup>
import '../assets/css/marcacion-style.css';
import { useRouter } from 'vue-router';
import { useAttendance } from '../composables/UserLogica/useAttendance.js';

const router = useRouter();
const { employee, currentTime, handleAttendance, logout, loading, isDark, toggleTheme } = useAttendance();
</script>