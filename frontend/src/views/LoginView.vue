<template>
  <div class="h-screen w-screen overflow-hidden flex flex-col font-sans select-none transition-colors duration-300"
    :class="isDark ? 'bg-[#0B1120]' : 'bg-[#F7FAFD]'">

    <!-- ============================================================
         HEADER
    ============================================================= -->
    <header
      class="w-full h-[60px] shrink-0 px-4 sm:px-6 flex items-center justify-between border-b relative z-10 transition-colors duration-300"
      :class="isDark ? 'bg-[#0F172A]/95 border-slate-800' : 'bg-white/97 border-[#E2E8F0]'">

      <div class="inline-flex items-center text-[16px] sm:text-[17px] font-extrabold tracking-tight"
        :class="isDark ? 'text-white' : 'text-[#102E4A]'">
        Woden<span class="text-[#FF5400]">Track</span>
      </div>

      <div class="flex items-center">
        <button type="button" @click="toggleTheme" :aria-label="isDark ? 'Modo claro' : 'Modo oscuro'"
          class="inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
          :class="isDark ? 'bg-[#FF5400]/15 text-[#FF5400]' : 'bg-[#EEF4FB] text-[#102E4A] hover:bg-[#E3ECF7]'">
          <i :class="isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'" class="text-sm"></i>
        </button>
      </div>
    </header>

    <!-- ============================================================
         CONTENIDO PRINCIPAL
    ============================================================= -->
    <main class="relative flex-1 flex items-center justify-center overflow-hidden px-4 py-6">

      <!-- Fondo: mallado disperso e irregular de líneas que se cruzan en ángulos
           variados (estilo Kaspersky), muy tenue. Sin puntos/nodos/partículas. -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <line v-for="(l, i) in bgLines" :key="i" :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2"
          :stroke="isDark ? 'rgba(255,255,255,0.09)' : 'rgba(16,46,74,0.16)'" stroke-width="1"
          vector-effect="non-scaling-stroke" />
      </svg>

      <!-- ==========================================================
           LOGIN CARD
      =========================================================== -->
      <section aria-label="Inicio de sesión"
        class="relative z-10 w-full max-w-[400px] rounded-[17px] border p-7 sm:p-8 transition-colors duration-300"
        :class="isDark
          ? 'bg-[#111C2E]/90 border-slate-800 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl'
          : 'bg-white border-[#D7E0EA] shadow-[0_14px_35px_rgba(16,46,74,0.09)]'">

        <!-- Acento superior sutil -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[2px] rounded-full"
          style="background: linear-gradient(90deg, transparent, rgba(255,84,0,.9), transparent);"></div>

        <!-- Encabezado -->
        <div class="text-center mb-7 pt-1">
          <h1 class="text-[24px] sm:text-[25px] font-extrabold tracking-tight leading-tight"
            :class="isDark ? 'text-white' : 'text-[#10233A]'">
            Iniciar sesión
          </h1>
          <p class="mt-[7px] text-[12px] sm:text-[13px]" :class="isDark ? 'text-slate-400' : 'text-[#64748B]'">
            Identifícate para continuar
          </p>
        </div>

        <!-- Formulario -->
        <div class="space-y-[16px]">

          <!-- Usuario -->
          <div>
            <label for="username" class="block mb-[7px] text-xs font-semibold"
              :class="isDark ? 'text-slate-300' : 'text-[#31445A]'">Usuario</label>
            <div class="relative">
              <span class="absolute left-[14px] top-1/2 -translate-y-1/2 w-[17px] h-[17px] pointer-events-none"
                :class="isDark ? 'text-slate-500' : 'text-[#8AA0B7]'">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
                  stroke-linejoin="round">
                  <circle cx="12" cy="8" r="3.5"></circle>
                  <path d="M5 20C5.7 16.8 8.2 15 12 15S18.3 16.8 19 20"></path>
                </svg>
              </span>
              <input id="username" v-model="form.usuario" type="text" placeholder="Ingresa tu usuario"
                autocomplete="username" @keyup.enter="handleLogin"
                class="w-full h-[47px] px-[42px] rounded-[10px] border text-[13px] outline-none transition-all duration-150"
                :class="isDark
                  ? 'bg-[#0B1120]/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#4C7AB8] focus:ring-2 focus:ring-[#4C7AB8]/20'
                  : 'bg-[#FCFDFE] border-[#D7E0EA] text-[#10233A] placeholder:text-[#9AAABD] hover:border-[#C5D1DE] focus:bg-white focus:border-[#8CA8C7] focus:ring-2 focus:ring-[#102E4A]/[0.07]'">
            </div>
          </div>

          <!-- Contraseña -->
          <div>
            <label for="password" class="block mb-[7px] text-xs font-semibold"
              :class="isDark ? 'text-slate-300' : 'text-[#31445A]'">Contraseña</label>
            <div class="relative">
              <span class="absolute left-[14px] top-1/2 -translate-y-1/2 w-[17px] h-[17px] pointer-events-none"
                :class="isDark ? 'text-slate-500' : 'text-[#8AA0B7]'">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
                  stroke-linejoin="round">
                  <rect x="5" y="10" width="14" height="10" rx="2"></rect>
                  <path d="M8 10V7A4 4 0 0 1 16 7V10"></path>
                </svg>
              </span>
              <input id="password" v-model="form.password" :type="showPassword ? 'text' : 'password'"
                placeholder="Ingresa tu contraseña" autocomplete="current-password" @keyup.enter="handleLogin"
                class="w-full h-[47px] pl-[42px] pr-[42px] rounded-[10px] border text-[13px] outline-none transition-all duration-150"
                :class="isDark
                  ? 'bg-[#0B1120]/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#4C7AB8] focus:ring-2 focus:ring-[#4C7AB8]/20'
                  : 'bg-[#FCFDFE] border-[#D7E0EA] text-[#10233A] placeholder:text-[#9AAABD] hover:border-[#C5D1DE] focus:bg-white focus:border-[#8CA8C7] focus:ring-2 focus:ring-[#102E4A]/[0.07]'">

              <button type="button" @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                class="absolute right-2 top-1/2 -translate-y-1/2 w-[30px] h-[30px] rounded-[7px] flex items-center justify-center transition-colors"
                :class="isDark ? 'text-slate-500 hover:text-white hover:bg-white/5' : 'text-[#8AA0B7] hover:text-[#102E4A] hover:bg-[#EEF4FB]'">
                <svg v-if="!showPassword" viewBox="0 0 24 24" class="w-[18px] h-[18px]" fill="none"
                  stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2.5 12S6 5.5 12 5.5S21.5 12 21.5 12S18 18.5 12 18.5S2.5 12 2.5 12Z"></path>
                  <circle cx="12" cy="12" r="2.8"></circle>
                </svg>
                <svg v-else viewBox="0 0 24 24" class="w-[18px] h-[18px]" fill="none" stroke="currentColor"
                  stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2.5 12S6 5.5 12 5.5S21.5 12 21.5 12S18 18.5 12 18.5S2.5 12 2.5 12Z"></path>
                  <circle cx="12" cy="12" r="2.8"></circle>
                  <path d="M3 3L21 21"></path>
                </svg>
              </button>
            </div>
          </div>

          <Transition name="fade">
            <p v-if="message.text && message.type === 'error'"
              class="text-xs font-medium text-rose-500 flex items-center gap-1.5 justify-center">
              <i class="fas fa-circle-exclamation"></i> {{ message.text }}
            </p>
          </Transition>
        </div>

        <!-- Botón -->
        <button type="button" @click="handleLogin" :disabled="loading"
          class="mt-6 w-full h-[47px] rounded-[10px] text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed"
          :class="isDark ? 'bg-[#1B4A8A] hover:bg-[#173F75]' : 'bg-[#102E4A] hover:bg-[#0B263E]'"
          style="box-shadow: 0 6px 14px rgba(16,46,74,.17)">
          <template v-if="!loading">
            <span>Ingresar</span>
            <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12H19"></path>
              <path d="M13 6L19 12L13 18"></path>
            </svg>
          </template>
          <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </button>

        <!-- Footer de la tarjeta -->
        <div class="w-full h-px my-[18px]" :class="isDark ? 'bg-slate-800' : 'bg-[#E7ECF2]'"></div>

        <div class="flex items-center justify-between text-[11px] font-medium">
          <router-link to="/download" class="inline-flex items-center gap-1.5 transition-colors"
            :class="isDark ? 'text-slate-400 hover:text-white' : 'text-[#31465D] hover:text-[#102E4A]'">
            <svg viewBox="0 0 24 24" class="w-[14px] h-[14px]" fill="none" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 4V15"></path>
              <path d="M7 11L12 16L17 11"></path>
              <path d="M5 20H19"></path>
            </svg>
            Descargar APK
          </router-link>

          <span class="inline-flex items-center gap-1.5" :class="isDark ? 'text-slate-400' : 'text-[#31465D]'">
            <svg viewBox="0 0 24 24" class="w-[14px] h-[14px]" fill="none" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3L19 6V11C19 15.5 16 19 12 21C8 19 5 15.5 5 11V6L12 3Z"></path>
              <path d="M9 11.5L11 13.5L15 9.5"></path>
            </svg>
            Seguro
          </span>
        </div>

        <div class="mt-[13px] flex items-center justify-center gap-1.5 text-[9px]"
          :class="isDark ? 'text-slate-500' : 'text-[#8D9BAA]'">
          <span class="w-1.5 h-1.5 rounded-full bg-[#FF5400]"></span>
          Conexión segura
        </div>
      </section>
    </main>
  </div>
</template>
<script setup>
import '../assets/css/woden-style.css';
import { useAttendance } from '../composables/UserLogica/useAttendance.js';
import { bgLines } from '../utils/bgLines.js';

const { form, loading, showPassword, handleLogin, message, isDark, toggleTheme } = useAttendance();
</script>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800;900&display=swap');
</style>
