<template>
  <div class="login-root" :class="isDark ? 'dark' : 'light'">

    <!-- ─── Panel izquierdo: Branding ─────────────────────── -->
    <div class="brand-panel">
      <div class="geo geo-1"></div>
      <div class="geo geo-2"></div>
      <div class="geo geo-3"></div>
      <div class="geo geo-4"></div>

      <div class="brand-top">
        <div class="brand-badge">
          <span class="brand-dot"></span>
          <span>Woden Colombia SAS</span>
        </div>
      </div>

      <div class="brand-center">
        <div class="brand-logo">
          <span class="logo-woden">WODEN</span><span class="logo-track">TRACK</span>
        </div>
        <p class="brand-tagline">
          Plataforma de control de asistencia<br>y gestión de personal en tiempo real.
        </p>

        <div class="brand-features">
          <div class="feature-item">
            <span class="feature-icon"><i class="fas fa-clock"></i></span>
            <span>Marcación en tiempo real</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon"><i class="fas fa-shield-halved"></i></span>
            <span>Acceso seguro y cifrado</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon"><i class="fas fa-chart-bar"></i></span>
            <span>Reportes instantáneos</span>
          </div>
        </div>
      </div>

      <p class="brand-version">v1.0 · Todos los derechos reservados</p>
    </div>

    <!-- ─── Panel derecho: Formulario ────────────────────────── -->
    <div class="form-panel">
      <div class="form-container">

        <!-- Status -->
        <div class="status-bar">
          <span class="status-dot"></span>
          <span class="status-text">Conexión Segura</span>
        </div>

        <!-- Header -->
        <div class="form-header">
          <h2 class="form-title">Bienvenido</h2>
          <p class="form-subtitle">Ingresa tus credenciales para continuar</p>
        </div>

        <!-- Fields -->
        <div class="form-fields">
          <div class="field-group">
            <label class="field-label">ID de Acceso</label>
            <div class="field-wrapper">
              <svg class="field-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input v-model="form.usuario" type="text" placeholder="Ingresa tu ID..."
                class="field-input" @keyup.enter="handleLogin" autocomplete="off" />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">PIN de Seguridad</label>
            <div class="field-wrapper">
              <svg class="field-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                placeholder="Ingresa tu PIN..." class="field-input field-input-pin"
                @keyup.enter="handleLogin" />
              <button @click="showPassword = !showPassword" type="button" class="eye-btn">
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>

          <Transition name="fade">
            <div v-if="message.text && message.type === 'error'" class="error-msg">
              <i class="fas fa-circle-exclamation"></i>
              {{ message.text }}
            </div>
          </Transition>
        </div>

        <!-- Button -->
        <button @click="handleLogin" :disabled="loading" class="btn-login">
          <template v-if="!loading">
            <i class="fas fa-arrow-right-to-bracket"></i>
            <span>Ingresar</span>
          </template>
          <div v-else class="spinner"></div>
        </button>

        <!-- Footer links -->
        <div class="form-footer">
          <button @click="toggleTheme" class="theme-btn">
            <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'"></i>
            {{ isDark ? 'Modo Claro' : 'Modo Oscuro' }}
          </button>
          <router-link to="/download" class="download-link">
            <i class="fab fa-android"></i> App Android
          </router-link>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { useAttendance } from '../composables/UserLogica/useAttendance.js';
const { form, loading, showPassword, handleLogin, message, isDark, toggleTheme } = useAttendance();
</script>

<style scoped>
/* ─── ROOT ───────────────────────────────────────────────── */
.login-root {
  min-height: 100dvh;
  display: flex;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

/* ─── BRAND PANEL ────────────────────────────────────────── */
.brand-panel {
  width: 44%;
  min-height: 100dvh;
  background: linear-gradient(150deg, #0d1526 0%, #162034 50%, #0d1526 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2.5rem 3rem;
}

/* Geometric background elements */
.geo {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.geo-1 {
  width: 480px; height: 480px;
  top: -160px; right: -140px;
  background: radial-gradient(circle, rgba(255,143,0,0.1) 0%, transparent 65%);
  border: 1px solid rgba(255,143,0,0.12);
  animation: float1 9s ease-in-out infinite;
}
.geo-2 {
  width: 300px; height: 300px;
  bottom: 60px; left: -100px;
  background: radial-gradient(circle, rgba(255,143,0,0.06) 0%, transparent 65%);
  border: 1px solid rgba(255,143,0,0.08);
  animation: float1 12s ease-in-out infinite reverse;
}
.geo-3 {
  width: 180px; height: 180px;
  top: 45%; left: 55%;
  border: 1px solid rgba(255,143,0,0.07);
  animation: rotate 25s linear infinite;
}
.geo-4 {
  width: 80px; height: 80px;
  top: 20%; left: 15%;
  border: 1px solid rgba(255,143,0,0.1);
  animation: rotate 15s linear infinite reverse;
}

@keyframes float1 {
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-24px) scale(1.02); }
}
@keyframes rotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.brand-top { position: relative; z-index: 1; }
.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 99px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255,255,255,0.4);
}
.brand-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e;
}

.brand-center {
  position: relative;
  z-index: 1;
}

.brand-logo {
  font-size: 3.8rem;
  font-weight: 900;
  font-style: italic;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 1.1rem;
}
.logo-woden { color: #ff8f00; }
.logo-track { color: #ffffff; }

.brand-tagline {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.38);
  line-height: 1.7;
  margin-bottom: 2.5rem;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.feature-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  font-size: 0.78rem;
  font-weight: 500;
  color: rgba(255,255,255,0.5);
}
.feature-icon {
  width: 34px; height: 34px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,143,0,0.12);
  border: 1px solid rgba(255,143,0,0.18);
  border-radius: 9px;
  color: #ff8f00;
  font-size: 0.72rem;
}

.brand-version {
  position: relative;
  z-index: 1;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: rgba(255,255,255,0.15);
}

/* ─── FORM PANEL ─────────────────────────────────────────── */
.form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  transition: background 0.4s;
}
.dark  .form-panel { background: #0f172a; }
.light .form-panel { background: #f1f5f9; }

.form-container {
  width: 100%;
  max-width: 380px;
}

/* Status */
.status-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2.5rem;
}
.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34,197,94,0.6);
  animation: pulse-dot 2.5s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(34,197,94,0.6); }
  50%       { opacity: 0.5; box-shadow: 0 0 3px rgba(34,197,94,0.3); }
}
.status-text {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #22c55e;
}

/* Header */
.form-header { margin-bottom: 2rem; }
.form-title {
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  margin-bottom: 0.3rem;
}
.dark  .form-title { color: #f8fafc; }
.light .form-title { color: #0f172a; }

.form-subtitle { font-size: 0.82rem; }
.dark  .form-subtitle { color: rgba(255,255,255,0.35); }
.light .form-subtitle { color: #64748b; }

/* Fields */
.form-fields { margin-bottom: 1.5rem; }
.field-group { margin-bottom: 1.2rem; }

.field-label {
  display: block;
  font-size: 0.67rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
}
.dark  .field-label { color: rgba(255,255,255,0.4); }
.light .field-label { color: #475569; }

.field-wrapper { position: relative; }
.field-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 15px; height: 15px;
  z-index: 1;
  pointer-events: none;
}
.dark  .field-icon { color: rgba(255,255,255,0.25); }
.light .field-icon { color: #94a3b8; }

.field-input {
  width: 100%;
  padding: 0.9rem 1rem 0.9rem 2.8rem;
  border-radius: 0.875rem;
  font-size: 0.875rem;
  font-weight: 600;
  outline: none;
  border: 1.5px solid transparent;
  transition: all 0.25s ease;
}
.field-input-pin { padding-right: 3rem; }

.dark .field-input {
  background: rgba(255,255,255,0.05);
  color: #f1f5f9;
  border-color: rgba(255,255,255,0.07);
}
.dark .field-input::placeholder { color: rgba(255,255,255,0.2); }
.dark .field-input:focus {
  background: rgba(255,143,0,0.06);
  border-color: rgba(255,143,0,0.45);
  box-shadow: 0 0 0 3px rgba(255,143,0,0.08);
}

.light .field-input {
  background: #ffffff;
  color: #0f172a;
  border-color: #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.light .field-input::placeholder { color: #cbd5e1; }
.light .field-input:focus {
  border-color: #ff8f00;
  box-shadow: 0 0 0 3px rgba(255,143,0,0.1);
}

.eye-btn {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.78rem;
  transition: opacity 0.2s;
  opacity: 0.35;
}
.eye-btn:hover { opacity: 0.85; }
.dark  .eye-btn { color: #e2e8f0; }
.light .eye-btn { color: #475569; }

.error-msg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.18);
  border-radius: 0.75rem;
  color: #f87171;
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

/* Button */
.btn-login {
  width: 100%;
  padding: 1rem;
  border-radius: 0.875rem;
  background: linear-gradient(135deg, #ff8f00 0%, #e67e00 100%);
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  box-shadow: 0 8px 24px -4px rgba(255,143,0,0.38);
  transition: all 0.25s ease;
  margin-bottom: 1.75rem;
}
.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px -6px rgba(255,143,0,0.5);
}
.btn-login:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 4px 12px -2px rgba(255,143,0,0.3);
}
.btn-login:disabled { opacity: 0.65; cursor: not-allowed; }

.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Footer */
.form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.theme-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: color 0.2s;
}
.dark  .theme-btn { color: rgba(255,255,255,0.25); }
.dark  .theme-btn:hover { color: rgba(255,255,255,0.7); }
.light .theme-btn { color: #94a3b8; }
.light .theme-btn:hover { color: #ff8f00; }

.download-link {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #ff8f00;
  text-decoration: none;
  transition: opacity 0.2s;
}
.download-link:hover { opacity: 0.65; }

/* ─── TRANSITIONS ────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ─── RESPONSIVE ─────────────────────────────────────────── */
@media (max-width: 768px) {
  .login-root { flex-direction: column; }

  .brand-panel {
    width: 100%;
    min-height: auto;
    padding: 1.75rem 1.75rem 1.5rem;
  }
  .brand-logo { font-size: 2.6rem; }
  .brand-tagline { font-size: 0.78rem; margin-bottom: 0; }
  .brand-features, .brand-version { display: none; }

  .form-panel { padding: 2rem 1.5rem; }
  .form-container { max-width: 100%; }
  .status-bar { margin-bottom: 1.75rem; }
  .form-header { margin-bottom: 1.5rem; }
  .form-title { font-size: 1.6rem; }
}
</style>
