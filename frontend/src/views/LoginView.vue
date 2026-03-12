<template>
  <div class="min-h-screen flex items-center justify-center transition-all duration-700 p-4 font-mono-custom"
    :class="isDark ? 'bg-[#3F4A6E] theme-dark' : 'bg-[#F8FAFC] theme-light'">
    <div class="woden-card relative" :class="isDark ? 'card-dark' : 'card-light'">

      <div>
        <div class="flex items-center gap-2 mb-8">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="text-[8px] font-black uppercase tracking-[0.2em]"
            :class="isDark ? 'text-emerald-400' : 'text-emerald-600'">
            Conexión Segura
          </span>
        </div>

        <div class="text-center mb-10">
          <h1 class="text-2xl font-black italic tracking-tighter leading-none mb-3 font-mono-custom">
            <span class="text-[#ff8f00]">WODEN</span><span
              :class="isDark ? 'text-white' : 'text-slate-800'">TRACK</span>
          </h1>
          <p class="text-[9px] font-bold uppercase tracking-[0.4em] opacity-30">Identifícate</p>
          <div class="h-0.5 w-8 bg-[#ff8f00] mx-auto mt-2 rounded-full"></div>
        </div>

        <div class="space-y-4">
          <div class="input-wrapper">
            <input v-model="form.usuario" type="text" placeholder="ID DE ACCESO"
              class="woden-input-base font-mono-custom" @keyup.enter="handleLogin">
            <svg class="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <div class="input-wrapper">
            <input v-model="form.password" :type="showPassword ? 'text' : 'password'" placeholder="PIN DE SEGURIDAD"
              class="woden-input-base font-mono-custom" @keyup.enter="handleLogin">
            <svg class="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <button @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2"
              :class="isDark ? 'text-slate-400' : 'text-slate-600'">
            </button>
          </div>
        </div>
      </div>

      <div class="mt-8">
        <button @click="handleLogin" :disabled="loading"
          class="woden-btn-primary mb-6 active:scale-95 font-mono-custom">
          <span v-if="!loading" class="text-[11px] font-bold">AUTENTICAR ACCESO</span>
          <div v-else class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
        </button>

        <div class="flex flex-col items-center gap-2">
          <button @click="toggleTheme"
            class="text-[10px] font-black uppercase tracking-widest transition-colors font-mono-custom"
            :class="isDark ? 'text-slate-500 hover:text-white' : 'text-slate-700 hover:text-orange-600'">
            Modo {{ isDark ? 'Claro' : 'Oscuro' }}
          </button>
        </div>

        <div class="flex flex-col items-center gap-2 mt-4">
          <router-link to="/download"
            class="text-[9px] font-black text-[#ff8f00] uppercase tracking-widest hover:underline font-mono-custom">
            <i class="fab fa-android mr-1"></i> Descargar Aplicación
          </router-link>
          <p class="text-[7px] font-bold uppercase tracking-[0.4em] opacity-20 font-mono-custom">Version 1.0</p>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import '../assets/css/woden-style.css';
import { useAttendance } from '../composables/UserLogica/useAttendance.js';
const { form, loading, showPassword, handleLogin, message, isDark, toggleTheme } = useAttendance();
</script>