<template>
  <div
    class="h-screen w-screen overflow-hidden flex items-center justify-center p-4 transition-colors duration-300 font-sans select-none relative"
    :class="isDark ? 'bg-[#0B1120]' : 'bg-[#ECEFF5]'">

    <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div v-if="!isDark" class="absolute inset-0 transition-opacity duration-300" style="background: 
          radial-gradient(circle at 90% 10%, #BAE6FD 0%, transparent 60%),
          radial-gradient(circle at 10% 90%, #FFE4E6 0%, transparent 50%);">
      </div>

      <div v-if="isDark" class="absolute inset-0 transition-opacity duration-300" style="background: 
          radial-gradient(circle at 90% 10%, #0C4A6E 0%, transparent 50%),
          radial-gradient(circle at 10% 90%, #1E1B4B 0%, transparent 45%);">
      </div>

      <div class="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style="background-image: radial-gradient(#111827 1px, transparent 1px); background-size: 24px 24px;">
      </div>
    </div>

    <div class="w-full max-w-sm rounded-2xl p-8 flex flex-col justify-between transition-all duration-200 border z-10"
      :class="isDark
        ? 'bg-[#1E293B]/80 border-slate-700/50 backdrop-blur-xl shadow-[0_25px_60px_rgba(0,0,0,0.45)]'
        : 'bg-white/95 border-slate-200/80 shadow-[0_20px_40px_rgba(15,23,42,0.06)] backdrop-blur-md'">
      <div>
        <div class="flex justify-end mb-4">
          <i class="fa-solid fa-shield-halved text-xs opacity-40"
            :class="isDark ? 'text-slate-400' : 'text-slate-600'"></i>
        </div>

        <div class="mb-8 text-left">
          <h1 class="text-2xl font-bold tracking-tight mb-1" :class="isDark ? 'text-white' : 'text-[#111827]'">
            Bienvenido a <span class="text-[#e88710] font-extrabold ml-0.5">WodenTrack</span>
          </h1>
          <p class="text-xs font-normal" :class="isDark ? 'text-slate-400' : 'text-[#64748B]'">
            Identifícate para continuar
          </p>
        </div>

        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="block text-xs font-medium"
              :class="isDark ? 'text-slate-300' : 'text-slate-700'">Usuario</label>
            <input v-model="form.usuario" type="text" placeholder="Ingresa tu usuario"
              class="w-full h-11 rounded-xl px-4 text-xs font-medium transition-all duration-150 outline-none border"
              :class="isDark
                ? 'bg-[#0B1120]/60 border-slate-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                : 'bg-white border-slate-300 text-[#111827] focus:border-blue-600 focus:ring-1 focus:ring-blue-600'"
              @keyup.enter="handleLogin" autocomplete="off">
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium"
              :class="isDark ? 'text-slate-300' : 'text-slate-700'">Contraseña</label>
            <div class="relative">
              <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                placeholder="Ingresa tu contraseña"
                class="w-full h-11 rounded-xl pl-4 pr-12 text-xs font-medium transition-all duration-150 outline-none border"
                :class="isDark
                  ? 'bg-[#0B1120]/60 border-slate-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  : 'bg-white border-slate-300 text-[#111827] focus:border-blue-600 focus:ring-1 focus:ring-blue-600'"
                @keyup.enter="handleLogin">
              <button @click="showPassword = !showPassword" type="button"
                class="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity duration-150 opacity-40 hover:opacity-100"
                :class="isDark ? 'text-white' : 'text-slate-600'">
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-xs"></i>
              </button>
            </div>
          </div>

          <Transition name="fade">
            <p v-if="message.text && message.type === 'error'"
              class="text-xs font-medium text-rose-500 pt-1 flex items-center gap-1.5 justify-center">
              <i class="fas fa-circle-exclamation"></i> {{ message.text }}
            </p>
          </Transition>
        </div>
      </div>

      <div class="mt-8 space-y-5">
        <button @click="handleLogin" :disabled="loading"
          class="w-full h-11 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed shadow-md shadow-blue-600/10 dark:shadow-none">
          <template v-if="!loading">
            <span>Continuar</span>
          </template>
          <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </button>

        <div class="border-t" :class="isDark ? 'border-slate-700/60' : 'border-slate-200'"></div>

        <div class="flex items-center justify-between text-[11px] font-medium px-0.5">
          <button @click="toggleTheme" class="transition-colors flex items-center gap-1.5"
            :class="isDark ? 'text-slate-400 hover:text-white' : 'text-[#64748B] hover:text-blue-600'">
            <i :class="isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'"></i>
            <span>{{ isDark ? 'Modo Claro' : 'Modo Oscuro' }}</span>
          </button>

          <router-link to="/download" class="transition-colors flex items-center gap-1.5"
            :class="isDark ? 'text-slate-400 hover:text-white' : 'text-[#64748B] hover:text-blue-600'">
            <i class="fab fa-android"></i>
            <span>Descargar APK</span>
          </router-link>
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

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800;900&display=swap');

/* NUNCA usar * { font-family } aquí — rompe los iconos FontAwesome */

/* ─── Icono de app (esquina redondeada, tipo iOS) ─────── */
.app-icon-box {
  width: 62px;
  height: 62px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-8deg);
  transition: transform 0.3s ease;
}

.app-icon-box:hover {
  transform: rotate(0deg) scale(1.05);
}

.app-icon-light {
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1);
}

.app-icon-dark {
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.app-icon-inner {
  font-size: 1.35rem;
  color: #3b5bdb;
  transform: rotate(8deg);
}

/* ─── Título ──────────────────────────────────────────── */
.login-title {
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
}

/* ─── Iconos de campo ─────────────────────────────────── */
.field-icon-wrap {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.95rem;
  z-index: 10;
  pointer-events: none;
}

.theme-light .field-icon-wrap {
  color: #94a3b8;
}

.theme-dark .field-icon-wrap {
  color: rgba(255, 255, 255, 0.28);
}

/* ─── Botón moderno ───────────────────────────────────── */
.modern-btn {
  width: 100%;
  padding: 0.95rem 1rem;
  border-radius: 14px;
  background: linear-gradient(135deg, #3b5bdb 0%, #1864ab 100%);
  color: #ffffff;
  border: none;
  cursor: pointer;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  box-shadow: 0 8px 22px -4px rgba(59, 91, 219, 0.45);
  transition: all 0.25s ease;
}

.modern-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px -4px rgba(59, 91, 219, 0.55);
}

.modern-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* ─── Transición error ────────────────────────────────── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ─── Animaciones base ────────────────────────────────── */
@keyframes ping {

  75%,
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}

.animate-ping {
  animation: ping 2s infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
