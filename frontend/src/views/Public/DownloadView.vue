<template>
  <div class="page-root">

    <!-- Blobs de fondo -->
    <div class="blob blob-orange"></div>
    <div class="blob blob-blue"></div>
    <div class="blob blob-purple"></div>

    <!-- ── LOADING ────────────────────────────────────── -->
    <div v-if="loading" class="state-center">
      <div class="loader-ring"></div>
      <p class="loader-text">Sincronizando...</p>
    </div>

    <!-- ── CONTENIDO ──────────────────────────────────── -->
    <div v-else-if="apkData" class="content-wrap">

      <!-- Cabecera branding -->
      <div class="brand-head">
        <div class="app-icon">
          <i class="fab fa-android"></i>
        </div>
        <div class="brand-text">
          <h1 class="brand-name">Woden<span class="brand-orange">Track</span></h1>
          <span class="brand-badge">Uso Profesional</span>
        </div>
      </div>

      <!-- ── Sin APK disponible ── -->
      <div v-if="!apkData.exists" class="glass-card empty-card">
        <div class="empty-icon">
          <i class="fas fa-clock"></i>
        </div>
        <h3 class="empty-title">Sin actualizaciones</h3>
        <p class="empty-text">
          Estamos preparando una nueva versión. Intenta de nuevo en unos minutos.
        </p>
      </div>

      <!-- ── APK disponible ── -->
      <div v-else class="glass-card main-card">

        <!-- Versión y tamaño -->
        <div class="meta-row">
          <div class="meta-chip">
            <i class="fas fa-tag"></i>
            <span>v{{ apkData.version }}</span>
          </div>
          <div class="meta-chip">
            <i class="fas fa-weight-hanging"></i>
            <span>{{ apkData.size }} MB</span>
          </div>
          <div class="meta-chip meta-chip-green">
            <i class="fas fa-circle-check"></i>
            <span>Verificada</span>
          </div>
        </div>

        <!-- Botón de descarga principal -->
        <button @click="descargarApk" class="btn-download">
          <span class="btn-download-icon">
            <i class="fas fa-download"></i>
          </span>
          <span class="btn-download-text">
            <span class="btn-download-main">Descargar APK</span>
            <span class="btn-download-sub">Android 6.0+</span>
          </span>
          <i class="fas fa-chevron-right btn-download-arrow"></i>
        </button>

        <!-- Acciones secundarias -->
        <div class="secondary-actions">
          <button @click="activeModal = 'changelog'" class="btn-secondary">
            <i class="fas fa-rocket text-blue-400"></i>
            Novedades
          </button>
          <button @click="activeModal = 'qr'" class="btn-secondary">
            <i class="fas fa-qrcode text-[#FF8F00]"></i>
            Código QR
          </button>
        </div>
      </div>

      <!-- Sección de privacidad -->
      <div class="glass-card privacy-card">
        <div class="privacy-row">
          <div class="privacy-icons">
            <span class="priv-icon"><i class="fas fa-camera-slash"></i></span>
            <span class="priv-icon"><i class="fas fa-microphone-slash"></i></span>
            <span class="priv-icon"><i class="fas fa-address-book-slash"></i></span>
          </div>
          <div class="privacy-info">
            <p class="privacy-title">WodenTrack NO es intrusiva</p>
            <p class="privacy-sub">Sin acceso a cámara, micrófono ni contactos</p>
          </div>
        </div>
        <button @click="activeModal = 'privacy'" class="btn-privacy">
          ¿Cómo funcionan los permisos?
          <i class="fas fa-arrow-right text-[10px]"></i>
        </button>
      </div>

      <!-- Back -->
      <router-link to="/login" class="back-link">
        <i class="fas fa-arrow-left"></i> Volver al inicio
      </router-link>

    </div>

    <!-- ── MODALES ──────────────────────────────────────── -->
    <Transition name="modal">
      <div v-if="activeModal" class="modal-overlay" @click.self="activeModal = null">
        <div class="modal-box">

          <button @click="activeModal = null" class="modal-close">
            <i class="fas fa-xmark"></i>
          </button>

          <!-- Privacidad -->
          <div v-if="activeModal === 'privacy'" class="modal-body">
            <div class="modal-icon modal-icon-green">
              <i class="fas fa-shield-halved"></i>
            </div>
            <h3 class="modal-title">Política de Cero Permisos</h3>
            <p class="modal-text">
              Tu dispositivo muestra alertas cuando una app intenta acceder a datos privados.
              WodenTrack <strong>nunca activará esas alertas</strong>.
            </p>
            <div class="modal-highlight">
              <i class="fas fa-check-circle text-emerald-400 mt-0.5 shrink-0"></i>
              <p>Nuestra arquitectura es <em>No Intrusiva</em> y funciona sin pedir permisos de fotos, contactos o micrófono.</p>
            </div>
            <button @click="activeModal = null" class="btn-modal-ok">Entendido</button>
          </div>

          <!-- QR -->
          <div v-if="activeModal === 'qr'" class="modal-body">
            <div class="modal-icon modal-icon-orange">
              <i class="fas fa-qrcode"></i>
            </div>
            <h3 class="modal-title">Escaneo Rápido</h3>
            <div v-if="apkData?.exists" class="qr-wrapper">
              <qrcode-vue :value="apkData.downloadUrl" :size="180" level="H" foreground="#0f121a" />
            </div>
            <p v-else class="text-rose-400 text-xs font-bold uppercase text-center">QR no disponible</p>
            <p class="modal-hint">Apunta tu cámara al código para descargar</p>
          </div>

          <!-- Changelog -->
          <div v-if="activeModal === 'changelog'" class="modal-body">
            <div class="modal-icon modal-icon-blue">
              <i class="fas fa-rocket"></i>
            </div>
            <h3 class="modal-title">Novedades</h3>
            <ul class="changelog-list">
              <li v-for="(item, i) in apkData.changelog" :key="i" class="changelog-item">
                <i class="fas fa-circle-dot text-[#FF8F00] text-[8px] mt-1 shrink-0"></i>
                <span>{{ item }}</span>
              </li>
            </ul>
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

* { font-family: 'Inter', system-ui, sans-serif; box-sizing: border-box; }

/* ─── ROOT ───────────────────────────────────────── */
.page-root {
  min-height: 100dvh;
  background: #080c18;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  position: relative;
  overflow: hidden;
  color: #ffffff;
}

/* ─── BLOBS ──────────────────────────────────────── */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  animation: drift 12s ease-in-out infinite alternate;
}
.blob-orange {
  width: 420px; height: 420px;
  background: rgba(255, 143, 0, 0.12);
  top: -100px; left: -100px;
}
.blob-blue {
  width: 360px; height: 360px;
  background: rgba(59, 91, 219, 0.1);
  bottom: -80px; right: -80px;
  animation-delay: -4s;
}
.blob-purple {
  width: 280px; height: 280px;
  background: rgba(139, 92, 246, 0.07);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -8s;
}
@keyframes drift {
  from { transform: scale(1) translate(0, 0); }
  to   { transform: scale(1.15) translate(20px, -20px); }
}

/* ─── LOADING ────────────────────────────────────── */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  z-index: 10;
}
.loader-ring {
  width: 44px; height: 44px;
  border: 3px solid rgba(255,143,0,0.2);
  border-top-color: #FF8F00;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loader-text {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.25em;
  color: #FF8F00;
}

/* ─── CONTENT ────────────────────────────────────── */
.content-wrap {
  width: 100%;
  max-width: 400px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ─── BRAND HEAD ─────────────────────────────────── */
.brand-head {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 0.25rem;
  margin-bottom: 0.5rem;
}
.app-icon {
  width: 64px; height: 64px;
  border-radius: 18px;
  background: linear-gradient(145deg, #1e2540, #111827);
  border: 1px solid rgba(255,143,0,0.2);
  box-shadow: 0 0 30px rgba(255,143,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.9rem;
  color: #FF8F00;
  flex-shrink: 0;
}
.brand-text { display: flex; flex-direction: column; gap: 0.3rem; }
.brand-name {
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
  color: #f1f5f9;
}
.brand-orange { color: #FF8F00; }
.brand-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background: rgba(255,143,0,0.1);
  border: 1px solid rgba(255,143,0,0.2);
  border-radius: 99px;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #FF8F00;
  width: fit-content;
}

/* ─── GLASS CARD ─────────────────────────────────── */
.glass-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 24px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
}

/* ─── MAIN CARD ──────────────────────────────────── */
.main-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

/* Meta chips */
.meta-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.meta-chip {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.75rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 99px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
}
.meta-chip i { font-size: 0.65rem; }
.meta-chip-green { color: #4ade80; border-color: rgba(74,222,128,0.2); background: rgba(74,222,128,0.07); }

/* Download button */
.btn-download {
  width: 100%;
  padding: 1rem 1.25rem;
  border-radius: 16px;
  background: linear-gradient(135deg, #FF8F00 0%, #e67700 100%);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 8px 28px -4px rgba(255,143,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15);
  transition: all 0.25s ease;
}
.btn-download:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 36px -4px rgba(255,143,0,0.6);
}
.btn-download:active { transform: translateY(0); }

.btn-download-icon {
  width: 40px; height: 40px;
  border-radius: 12px;
  background: rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: #ffffff;
  flex-shrink: 0;
}
.btn-download-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
}
.btn-download-main {
  font-size: 0.9rem;
  font-weight: 800;
  color: #000000;
  letter-spacing: -0.01em;
}
.btn-download-sub {
  font-size: 0.65rem;
  font-weight: 600;
  color: rgba(0,0,0,0.5);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.btn-download-arrow {
  color: rgba(0,0,0,0.35);
  font-size: 0.75rem;
}

/* Secondary actions */
.secondary-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}
.btn-secondary {
  padding: 0.75rem;
  border-radius: 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  color: #cbd5e1;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}
.btn-secondary:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.12);
}

/* ─── EMPTY CARD ─────────────────────────────────── */
.empty-card {
  padding: 2.5rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
.empty-icon {
  width: 52px; height: 52px;
  border-radius: 50%;
  background: rgba(255,143,0,0.1);
  border: 1px solid rgba(255,143,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FF8F00;
  font-size: 1.25rem;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,143,0,0.3); }
  50% { box-shadow: 0 0 0 8px rgba(255,143,0,0); }
}
.empty-title { font-size: 0.85rem; font-weight: 800; color: #FF8F00; text-transform: uppercase; letter-spacing: 0.1em; }
.empty-text { font-size: 0.75rem; color: #64748b; line-height: 1.6; max-width: 260px; }

/* ─── PRIVACY CARD ───────────────────────────────── */
.privacy-card {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.privacy-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.privacy-icons {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
}
.priv-icon {
  width: 32px; height: 32px;
  border-radius: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4ade80;
  font-size: 0.7rem;
}
.privacy-info { flex: 1; }
.privacy-title { font-size: 0.78rem; font-weight: 800; color: #f1f5f9; margin-bottom: 0.2rem; }
.privacy-sub { font-size: 0.65rem; color: #64748b; font-weight: 500; }

.btn-privacy {
  width: 100%;
  padding: 0.7rem 1rem;
  border-radius: 12px;
  background: rgba(74,222,128,0.05);
  border: 1px solid rgba(74,222,128,0.15);
  color: #4ade80;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}
.btn-privacy:hover { background: rgba(74,222,128,0.1); }

/* ─── BACK LINK ──────────────────────────────────── */
.back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255,255,255,0.18);
  text-decoration: none;
  transition: color 0.2s;
  padding: 0.5rem;
}
.back-link:hover { color: rgba(255,255,255,0.6); }

/* ─── MODAL ──────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 1rem;
  background: rgba(4, 6, 15, 0.85);
  backdrop-filter: blur(16px);
}
@media (min-width: 480px) {
  .modal-overlay { align-items: center; }
}

.modal-box {
  width: 100%;
  max-width: 380px;
  background: #0f1629;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 28px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 40px 80px rgba(0,0,0,0.6);
}
.modal-close {
  position: absolute;
  top: 1.1rem; right: 1.1rem;
  width: 32px; height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  color: #94a3b8;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  z-index: 1;
}
.modal-close:hover { background: rgba(255,255,255,0.12); color: #fff; }

.modal-body {
  padding: 2rem 1.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.modal-icon {
  width: 60px; height: 60px;
  border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}
.modal-icon-green  { background: rgba(74,222,128,0.1);  border: 1px solid rgba(74,222,128,0.2);  color: #4ade80; }
.modal-icon-orange { background: rgba(255,143,0,0.1);   border: 1px solid rgba(255,143,0,0.2);   color: #FF8F00; }
.modal-icon-blue   { background: rgba(96,165,250,0.1);  border: 1px solid rgba(96,165,250,0.2);  color: #60a5fa; }

.modal-title {
  font-size: 0.9rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #f1f5f9;
  text-align: center;
}
.modal-text {
  font-size: 0.78rem;
  color: #64748b;
  line-height: 1.7;
  text-align: center;
}
.modal-text strong { color: #f1f5f9; }

.modal-highlight {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(74,222,128,0.05);
  border-left: 3px solid #4ade80;
  border-radius: 0 12px 12px 0;
  font-size: 0.75rem;
  color: #94a3b8;
  line-height: 1.6;
  width: 100%;
}
.modal-highlight em { color: #fff; font-style: normal; font-weight: 700; }

.btn-modal-ok {
  width: 100%;
  padding: 0.9rem;
  border-radius: 14px;
  background: linear-gradient(135deg, #FF8F00, #e67700);
  color: #000;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-modal-ok:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(255,143,0,0.4); }

.qr-wrapper {
  padding: 1rem;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}
.modal-hint {
  font-size: 0.65rem;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 600;
  text-align: center;
}

.changelog-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  list-style: none;
  padding: 0; margin: 0;
  max-height: 260px;
  overflow-y: auto;
}
.changelog-item {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  font-size: 0.75rem;
  color: #94a3b8;
  line-height: 1.5;
}

/* ─── TRANSITIONS ────────────────────────────────── */
.modal-enter-active { transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-leave-active { transition: all 0.25s ease; }
.modal-enter-from   { opacity: 0; }
.modal-leave-to     { opacity: 0; }
.modal-enter-from .modal-box { transform: translateY(40px) scale(0.95); }
.modal-leave-to   .modal-box { transform: scale(0.96); }
</style>
