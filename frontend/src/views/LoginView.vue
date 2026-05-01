<template>
  <div class="min-h-screen flex items-center justify-center transition-all duration-700 p-4"
    :class="isDark ? 'bg-[#1a1f35] theme-dark' : 'bg-[#eef2f7] theme-light'">
    <div class="woden-card relative" :class="isDark ? 'card-dark' : 'card-light'">

      <div>
        <!-- Status -->
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

        <!-- Logo -->
        <div class="text-center mb-10">
          <div class="app-icon-box mx-auto mb-5" :class="isDark ? 'app-icon-dark' : 'app-icon-light'">
            <i class="fa-solid fa-grip app-icon-inner"></i>
          </div>
          <h1 class="login-title mb-2">
            <span :class="isDark ? 'text-white' : 'text-[#111827]'">Woden</span><span class="text-[#ff8f00]">Track</span>
          </h1>
          <p class="text-[9px] font-semibold uppercase tracking-[0.35em]"
            :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            Identifícate para continuar
          </p>
        </div>

        <!-- Inputs -->
        <div class="space-y-4">
          <div class="input-wrapper">
            <input v-model="form.usuario" type="text" placeholder="Usuario"
              class="woden-input-base modern-input" @keyup.enter="handleLogin" autocomplete="off">
            <span class="field-icon-wrap">
              <i class="fa-regular fa-circle-user"></i>
            </span>
          </div>

          <div class="input-wrapper">
            <input v-model="form.password" :type="showPassword ? 'text' : 'password'" placeholder="Contraseña"
              class="woden-input-base modern-input pr-10" @keyup.enter="handleLogin">
            <span class="field-icon-wrap">
              <i class="fa-solid fa-fingerprint"></i>
            </span>
            <button @click="showPassword = !showPassword" type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100 opacity-35"
              :class="isDark ? 'text-slate-400' : 'text-slate-500'">
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-xs"></i>
            </button>
          </div>

          <Transition name="fade">
            <p v-if="message.text && message.type === 'error'"
              class="text-[9px] font-bold uppercase tracking-widest text-rose-400 text-center pt-1">
              <i class="fas fa-circle-exclamation mr-1"></i>{{ message.text }}
            </p>
          </Transition>
        </div>
      </div>

      <div class="mt-8">
        <!-- Botón -->
        <button @click="handleLogin" :disabled="loading" class="modern-btn mb-6 active:scale-[0.98]">
          <template v-if="!loading">
            <i class="fa-solid fa-arrow-right-to-bracket"></i>
            <span>Entrar al Sistema</span>
          </template>
          <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
        </button>

        <!-- Theme toggle -->
        <div class="flex flex-col items-center gap-2">
          <button @click="toggleTheme"
            class="text-[10px] font-semibold uppercase tracking-widest transition-colors flex items-center gap-1.5"
            :class="isDark ? 'text-slate-500 hover:text-slate-200' : 'text-slate-400 hover:text-[#ff8f00]'">
            <i :class="isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'" class="text-[10px]"></i>
            Modo {{ isDark ? 'Claro' : 'Oscuro' }}
          </button>
        </div>

        <!-- Download link -->
        <div class="flex flex-col items-center gap-2 mt-4">
          <router-link to="/download"
            class="text-[9px] font-bold text-[#ff8f00] uppercase tracking-widest hover:opacity-70 transition-opacity flex items-center gap-1">
            <i class="fab fa-android"></i> Descargar Aplicación
          </router-link>
          <p class="text-[7px] font-bold uppercase tracking-[0.4em] opacity-20"
            :class="isDark ? 'text-slate-300' : 'text-slate-500'">Version 1.0</p>
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
.app-icon-box:hover { transform: rotate(0deg) scale(1.05); }

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
.theme-light .field-icon-wrap { color: #94a3b8; }
.theme-dark  .field-icon-wrap { color: rgba(255, 255, 255, 0.28); }

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
.modern-btn:disabled { opacity: 0.65; cursor: not-allowed; }

/* ─── Transición error ────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ─── Animaciones base ────────────────────────────────── */
@keyframes ping {
  75%, 100% { transform: scale(2.5); opacity: 0; }
}
.animate-ping { animation: ping 2s infinite; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.animate-spin { animation: spin 1s linear infinite; }
</style>
