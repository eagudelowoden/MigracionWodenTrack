<template>
  <div class="page-root">

    <!-- Grid HUD de fondo -->
    <div class="hud-grid"></div>
    <div class="hud-scan"></div>

    <!-- Glows -->
    <div class="glow glow-1"></div>
    <div class="glow glow-2"></div>
    <div class="glow glow-3"></div>

    <!-- ── LOADING ──────────────────────────────────── -->
    <div v-if="loading" class="state-center">
      <div class="hud-loader">
        <div class="hud-loader-ring"></div>
        <div class="hud-loader-ring ring-2"></div>
        <i class="fab fa-android hud-loader-icon"></i>
      </div>
      <p class="loader-text"><span class="blink-char">▮</span> Sincronizando sistema...</p>
    </div>

    <!-- ── CONTENIDO ────────────────────────────────── -->
    <div v-else-if="apkData" class="content-wrap">

      <!-- Cabecera -->
      <div class="brand-head">
        <div class="brand-icon-wrap">
          <div class="brand-icon-glow"></div>
          <div class="brand-icon">
            <i class="fab fa-android"></i>
          </div>
        </div>
        <div>
          <div class="sys-label"><span class="blink-char">◈</span> SISTEMA ACTIVO</div>
          <h1 class="brand-name">
            <span class="name-woden">WODEN</span><span class="name-track">TRACK</span>
          </h1>
          <p class="brand-sub">Control de asistencia · Android</p>
        </div>
      </div>

      <!-- Sin APK -->
      <div v-if="!apkData.exists" class="hud-card empty-card">
        <div class="corner tl"></div><div class="corner tr"></div>
        <div class="corner bl"></div><div class="corner br"></div>
        <i class="fas fa-clock empty-icon"></i>
        <p class="empty-title">// SIN ACTUALIZACIÓN DISPONIBLE</p>
        <p class="empty-text">Nueva versión en preparación. Reintenta en unos minutos.</p>
      </div>

      <!-- Con APK -->
      <div v-else class="hud-card main-card">
        <div class="corner tl"></div><div class="corner tr"></div>
        <div class="corner bl"></div><div class="corner br"></div>

        <!-- Metadatos -->
        <div class="meta-bar">
          <div class="meta-tag">
            <span class="meta-label">VERSIÓN</span>
            <span class="meta-value">v{{ apkData.version }}</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-tag">
            <span class="meta-label">TAMAÑO</span>
            <span class="meta-value">{{ apkData.size }} MB</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-tag">
            <span class="meta-label">ESTADO</span>
            <span class="meta-value meta-ok"><i class="fas fa-shield-halved"></i> OK</span>
          </div>
        </div>

        <!-- Botón descarga -->
        <button @click="descargarApk" class="btn-download">
          <div class="btn-download-bg"></div>
          <div class="btn-download-content">
            <div class="btn-dl-left">
              <div class="btn-dl-icon"><i class="fas fa-download"></i></div>
              <div>
                <span class="btn-dl-main">DESCARGAR APK</span>
                <span class="btn-dl-sub">Toca para iniciar · Android 6.0+</span>
              </div>
            </div>
            <i class="fas fa-chevron-right btn-dl-arrow"></i>
          </div>
        </button>

        <!-- Acciones -->
        <div class="action-row">
          <button @click="activeModal = 'changelog'" class="btn-action">
            <i class="fas fa-rocket"></i>
            <span>Novedades</span>
          </button>
          <button @click="activeModal = 'qr'" class="btn-action">
            <i class="fas fa-qrcode"></i>
            <span>Código QR</span>
          </button>
        </div>
      </div>

      <!-- Privacidad -->
      <div class="hud-card privacy-card">
        <div class="corner tl"></div><div class="corner tr"></div>
        <div class="corner bl"></div><div class="corner br"></div>

        <div class="priv-header">
          <div class="priv-badges">
            <span class="priv-badge"><i class="fas fa-microphone-slash"></i></span>
            <span class="priv-badge"><i class="fas fa-user-slash"></i></span>
            <span class="priv-badge"><i class="fas fa-ban"></i></span>
          </div>
          <div>
            <p class="priv-title">NO INTRUSIVA</p>
            <p class="priv-sub">Sin acceso a micrófono, contactos ni datos privados</p>
          </div>
        </div>
        <button @click="activeModal = 'privacy'" class="btn-privacy">
          <i class="fas fa-shield-halved"></i>
          Ver política de permisos
          <i class="fas fa-chevron-right text-[9px] ml-auto"></i>
        </button>
      </div>

      <!-- Back -->
      <router-link to="/login" class="back-link">
        <i class="fas fa-arrow-left"></i> VOLVER AL SISTEMA
      </router-link>

    </div>

    <!-- ── MODALES ───────────────────────────────────── -->
    <Transition name="modal">
      <div v-if="activeModal" class="modal-overlay" @click.self="activeModal = null">
        <div class="modal-box">
          <div class="corner tl"></div><div class="corner tr"></div>
          <div class="corner bl"></div><div class="corner br"></div>

          <div class="modal-head">
            <div v-if="activeModal === 'privacy'" class="modal-head-icon icon-green">
              <i class="fas fa-shield-halved"></i>
            </div>
            <div v-else-if="activeModal === 'qr'" class="modal-head-icon icon-orange">
              <i class="fas fa-qrcode"></i>
            </div>
            <div v-else class="modal-head-icon icon-blue">
              <i class="fas fa-rocket"></i>
            </div>

            <div class="modal-head-text">
              <span class="modal-sys-label">// MÓDULO</span>
              <h3 class="modal-title">
                {{ activeModal === 'privacy' ? 'POLÍTICA DE PERMISOS' : activeModal === 'qr' ? 'ESCANEO RÁPIDO' : 'NOVEDADES DEL SISTEMA' }}
              </h3>
            </div>

            <button @click="activeModal = null" class="modal-close">
              <i class="fas fa-xmark"></i>
            </button>
          </div>

          <div class="modal-body">

            <!-- Privacidad -->
            <template v-if="activeModal === 'privacy'">
              <p class="modal-text">
                Tu dispositivo alerta cuando una app accede a datos privados.
                <strong>WodenTrack nunca activará esas alertas.</strong>
              </p>
              <div class="modal-highlight">
                <i class="fas fa-circle-check text-emerald-400 shrink-0 mt-0.5"></i>
                <p>Arquitectura <em>No Intrusiva</em> — funciona sin permisos de cámara, micrófono ni contactos.</p>
              </div>
              <button @click="activeModal = null" class="btn-modal-ok">ENTENDIDO</button>
            </template>

            <!-- QR -->
            <template v-if="activeModal === 'qr'">
              <div v-if="apkData?.exists" class="qr-frame">
                <qrcode-vue :value="apkData.downloadUrl" :size="170" level="H" foreground="#050810" />
              </div>
              <p v-else class="text-rose-400 text-xs font-bold uppercase text-center">QR no disponible</p>
              <p class="modal-hint">Apunta tu cámara para descargar directamente</p>
            </template>

            <!-- Changelog -->
            <template v-if="activeModal === 'changelog'">
              <ul class="changelog-list">
                <li v-for="(item, i) in apkData.changelog" :key="i" class="changelog-item">
                  <span class="cl-index">{{ String(i + 1).padStart(2, '0') }}</span>
                  <span class="cl-text">{{ item }}</span>
                </li>
              </ul>
            </template>

          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import QrcodeVue from 'qrcode.vue';
import { useApkRepo } from '../../composables/adminLogica/useApkRepo.js';

const { apkData, loading, error, fetchApkInfo, descargarApk } = useApkRepo();
const activeModal = ref(null);
onMounted(fetchApkInfo);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');

* { font-family: 'Inter', system-ui, sans-serif; box-sizing: border-box; }

/* ─── ROOT ──────────────────────────────────────── */
.page-root {
  min-height: 100dvh;
  background: #050810;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  position: relative;
  overflow: hidden;
  color: #e2e8f0;
}

/* ─── HUD GRID ──────────────────────────────────── */
.hud-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,143,0,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,143,0,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}
.hud-scan {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    transparent 0%,
    rgba(255, 143, 0, 0.015) 50%,
    transparent 100%
  );
  background-size: 100% 200px;
  animation: scan 8s linear infinite;
  pointer-events: none;
}
@keyframes scan {
  from { background-position: 0 -200px; }
  to   { background-position: 0 100vh; }
}

/* ─── GLOWS ─────────────────────────────────────── */
.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
}
.glow-1 {
  width: 500px; height: 500px;
  background: rgba(255,143,0,0.08);
  top: -180px; left: -180px;
  animation: breathe 7s ease-in-out infinite alternate;
}
.glow-2 {
  width: 400px; height: 400px;
  background: rgba(59,91,219,0.07);
  bottom: -150px; right: -150px;
  animation: breathe 9s ease-in-out infinite alternate-reverse;
}
.glow-3 {
  width: 250px; height: 250px;
  background: rgba(0,212,255,0.04);
  top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  animation: breathe 5s ease-in-out infinite alternate;
}
@keyframes breathe {
  from { opacity: 0.6; transform: scale(1); }
  to   { opacity: 1;   transform: scale(1.15); }
}

/* ─── LOADING ───────────────────────────────────── */
.state-center {
  display: flex; flex-direction: column;
  align-items: center; gap: 1.5rem; z-index: 10;
}
.hud-loader {
  position: relative;
  width: 64px; height: 64px;
  display: flex; align-items: center; justify-content: center;
}
.hud-loader-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: #FF8F00;
  animation: spin 1s linear infinite;
}
.ring-2 {
  inset: 8px;
  border-top-color: rgba(255,143,0,0.4);
  animation-duration: 1.5s;
  animation-direction: reverse;
}
.hud-loader-icon { color: #FF8F00; font-size: 1.2rem; position: relative; z-index: 1; }
@keyframes spin { to { transform: rotate(360deg); } }

.loader-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(255,143,0,0.7);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
.blink-char { animation: blink 1s step-end infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

/* ─── CONTENT ───────────────────────────────────── */
.content-wrap {
  width: 100%; max-width: 420px;
  z-index: 10;
  display: flex; flex-direction: column; gap: 0.85rem;
}

/* ─── BRAND HEAD ────────────────────────────────── */
.brand-head {
  display: flex; align-items: center; gap: 1.1rem;
  padding: 0.5rem 0.25rem 0.75rem;
}
.brand-icon-wrap { position: relative; flex-shrink: 0; }
.brand-icon-glow {
  position: absolute; inset: -8px;
  background: radial-gradient(circle, rgba(255,143,0,0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: breathe 3s ease-in-out infinite alternate;
}
.brand-icon {
  width: 68px; height: 68px;
  border-radius: 20px;
  background: linear-gradient(145deg, #0f1629, #1a2040);
  border: 1px solid rgba(255,143,0,0.35);
  box-shadow: 0 0 20px rgba(255,143,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05);
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem; color: #FF8F00;
  position: relative; z-index: 1;
}
.sys-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem; font-weight: 700;
  color: #FF8F00; letter-spacing: 0.2em;
  text-transform: uppercase; margin-bottom: 0.2rem;
}
.brand-name {
  font-size: 2.1rem; font-weight: 900;
  letter-spacing: -0.02em; line-height: 1;
  margin-bottom: 0.25rem;
}
.name-woden { color: #f1f5f9; }
.name-track  { color: #FF8F00; }
.brand-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem; color: rgba(255,255,255,0.25);
  text-transform: uppercase; letter-spacing: 0.1em;
}

/* ─── HUD CARD ──────────────────────────────────── */
.hud-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,143,0,0.15);
  border-radius: 20px;
  position: relative;
  padding: 1.5rem;
  backdrop-filter: blur(12px);
  box-shadow: 0 0 40px rgba(255,143,0,0.04), inset 0 1px 0 rgba(255,255,255,0.04);
}

/* Esquinas HUD */
.corner {
  position: absolute;
  width: 14px; height: 14px;
  border-color: #FF8F00;
  border-style: solid;
}
.corner.tl { top: -1px; left: -1px; border-width: 2px 0 0 2px; border-radius: 4px 0 0 0; }
.corner.tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; border-radius: 0 4px 0 0; }
.corner.bl { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; border-radius: 0 0 0 4px; }
.corner.br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; border-radius: 0 0 4px 0; }

/* ─── MAIN CARD ─────────────────────────────────── */
.main-card { display: flex; flex-direction: column; gap: 1.1rem; }

/* Meta bar */
.meta-bar {
  display: flex; align-items: center;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,143,0,0.1);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  gap: 1rem;
}
.meta-tag { display: flex; flex-direction: column; gap: 0.15rem; flex: 1; align-items: center; }
.meta-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem; font-weight: 700;
  color: rgba(255,255,255,0.25); letter-spacing: 0.15em;
}
.meta-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem; font-weight: 700; color: #f1f5f9;
}
.meta-ok { color: #4ade80; }
.meta-divider { width: 1px; height: 28px; background: rgba(255,143,0,0.15); }

/* Download button */
.btn-download {
  width: 100%; border: none; cursor: pointer;
  border-radius: 16px; padding: 0;
  position: relative; overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.btn-download:hover { transform: translateY(-2px); box-shadow: 0 16px 40px -4px rgba(255,143,0,0.5); }
.btn-download:active { transform: translateY(0); }

.btn-download-bg {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, #FF8F00 0%, #e06800 60%, #FF8F00 100%);
  background-size: 200% 200%;
  animation: shimmer 3s ease infinite;
}
@keyframes shimmer {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.btn-download-content {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem; gap: 1rem;
}
.btn-dl-left { display: flex; align-items: center; gap: 0.85rem; }
.btn-dl-icon {
  width: 42px; height: 42px; border-radius: 12px;
  background: rgba(0,0,0,0.18);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; color: #fff; flex-shrink: 0;
}
.btn-dl-main {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem; font-weight: 700;
  color: #000; letter-spacing: 0.05em;
}
.btn-dl-sub {
  display: block;
  font-size: 0.6rem; font-weight: 600;
  color: rgba(0,0,0,0.45); text-transform: uppercase; letter-spacing: 0.08em;
  margin-top: 0.1rem;
}
.btn-dl-arrow { color: rgba(0,0,0,0.3); font-size: 0.8rem; }

/* Action row */
.action-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
.btn-action {
  padding: 0.75rem 0.5rem;
  border-radius: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,143,0,0.12);
  color: rgba(255,255,255,0.55);
  font-size: 0.68rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  transition: all 0.2s;
}
.btn-action:hover {
  background: rgba(255,143,0,0.07);
  border-color: rgba(255,143,0,0.3);
  color: #FF8F00;
}
.btn-action i { font-size: 0.8rem; }

/* ─── EMPTY CARD ────────────────────────────────── */
.empty-card { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
.empty-icon { font-size: 1.5rem; color: #FF8F00; animation: breathe 2s ease-in-out infinite alternate; }
.empty-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem; font-weight: 700;
  color: rgba(255,143,0,0.7); letter-spacing: 0.1em;
}
.empty-text { font-size: 0.75rem; color: #475569; line-height: 1.6; }

/* ─── PRIVACY CARD ──────────────────────────────── */
.privacy-card { display: flex; flex-direction: column; gap: 1rem; }
.priv-header { display: flex; align-items: center; gap: 0.85rem; }
.priv-badges { display: flex; gap: 0.4rem; flex-shrink: 0; }
.priv-badge {
  width: 30px; height: 30px; border-radius: 8px;
  background: rgba(74,222,128,0.06);
  border: 1px solid rgba(74,222,128,0.15);
  display: flex; align-items: center; justify-content: center;
  color: #4ade80; font-size: 0.65rem;
}
.priv-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem; font-weight: 700;
  color: #4ade80; letter-spacing: 0.1em; margin-bottom: 0.2rem;
}
.priv-sub { font-size: 0.65rem; color: #475569; }
.btn-privacy {
  width: 100%; padding: 0.7rem 1rem;
  border-radius: 12px;
  background: rgba(74,222,128,0.04);
  border: 1px solid rgba(74,222,128,0.12);
  color: #4ade80;
  font-size: 0.68rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  cursor: pointer;
  display: flex; align-items: center; gap: 0.5rem;
  transition: all 0.2s;
}
.btn-privacy:hover { background: rgba(74,222,128,0.08); border-color: rgba(74,222,128,0.25); }

/* ─── BACK ──────────────────────────────────────── */
.back-link {
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.2em;
  color: rgba(255,255,255,0.12); text-decoration: none;
  transition: color 0.2s; padding: 0.5rem;
}
.back-link:hover { color: rgba(255,143,0,0.6); }

/* ─── MODAL ─────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 100;
  display: flex; align-items: flex-end; justify-content: center; padding: 1rem;
  background: rgba(2,4,12,0.9);
  backdrop-filter: blur(20px);
}
@media (min-width: 500px) { .modal-overlay { align-items: center; } }

.modal-box {
  width: 100%; max-width: 400px;
  background: #080d1e;
  border: 1px solid rgba(255,143,0,0.2);
  border-radius: 24px;
  position: relative; overflow: hidden;
  box-shadow: 0 0 60px rgba(255,143,0,0.1), 0 40px 80px rgba(0,0,0,0.6);
}

.modal-head {
  display: flex; align-items: center; gap: 0.85rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255,143,0,0.1);
  background: rgba(255,143,0,0.03);
}
.modal-head-icon {
  width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 1rem;
}
.icon-green  { background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.2); color: #4ade80; }
.icon-orange { background: rgba(255,143,0,0.1);  border: 1px solid rgba(255,143,0,0.2);  color: #FF8F00; }
.icon-blue   { background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.2); color: #60a5fa; }

.modal-head-text { flex: 1; }
.modal-sys-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem; color: rgba(255,143,0,0.5); letter-spacing: 0.2em; display: block;
}
.modal-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem; font-weight: 700; color: #f1f5f9; letter-spacing: 0.05em;
}
.modal-close {
  width: 30px; height: 30px; border-radius: 8px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
  color: #64748b; font-size: 0.75rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; flex-shrink: 0;
}
.modal-close:hover { background: rgba(255,255,255,0.1); color: #fff; }

.modal-body {
  padding: 1.5rem;
  display: flex; flex-direction: column; align-items: center; gap: 1rem;
}
.modal-text { font-size: 0.78rem; color: #64748b; line-height: 1.7; text-align: center; }
.modal-text strong { color: #f1f5f9; }
.modal-highlight {
  display: flex; align-items: flex-start; gap: 0.7rem;
  padding: 0.9rem 1rem;
  background: rgba(74,222,128,0.04);
  border-left: 2px solid #4ade80;
  border-radius: 0 10px 10px 0;
  font-size: 0.73rem; color: #64748b; line-height: 1.6; width: 100%;
}
.modal-highlight em { color: #fff; font-style: normal; font-weight: 700; }
.btn-modal-ok {
  width: 100%; padding: 0.85rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #FF8F00, #e06800);
  color: #000; font-size: 0.72rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.15em;
  border: none; cursor: pointer; transition: all 0.2s;
  font-family: 'JetBrains Mono', monospace;
}
.btn-modal-ok:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(255,143,0,0.4); }

.qr-frame {
  padding: 0.85rem; background: #fff;
  border-radius: 16px;
  box-shadow: 0 0 30px rgba(255,143,0,0.15);
}
.modal-hint {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.58rem; color: #334155;
  text-transform: uppercase; letter-spacing: 0.15em; text-align: center;
}

.changelog-list {
  width: 100%; display: flex; flex-direction: column; gap: 0.5rem;
  list-style: none; padding: 0; margin: 0;
  max-height: 280px; overflow-y: auto;
}
.changelog-item {
  display: flex; align-items: flex-start; gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,143,0,0.08);
  border-radius: 10px;
}
.cl-index {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem; font-weight: 700;
  color: #FF8F00; flex-shrink: 0; margin-top: 1px;
}
.cl-text { font-size: 0.73rem; color: #94a3b8; line-height: 1.5; }

/* ─── TRANSITIONS ───────────────────────────────── */
.modal-enter-active { transition: opacity 0.3s ease; }
.modal-leave-active { transition: opacity 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal-box { animation: slideUp 0.35s cubic-bezier(0.16,1,0.3,1) both; }
@keyframes slideUp {
  from { transform: translateY(30px) scale(0.97); opacity: 0; }
  to   { transform: translateY(0) scale(1); opacity: 1; }
}
</style>
