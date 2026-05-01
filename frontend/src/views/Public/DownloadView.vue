<template>
  <div class="page-root">
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>

    <!-- LOADING -->
    <div v-if="loading" class="state-center">
      <div class="spin-ring"></div>
      <p class="loading-txt">Cargando...</p>
    </div>

    <!-- CONTENIDO -->
    <div v-else-if="apkData" class="content">

      <!-- App icon + nombre -->
      <div class="brand">
        <div class="app-icon">
          <i class="fab fa-android"></i>
        </div>
        <div class="brand-info">
          <p class="brand-sys">◈ Sistema activo</p>
          <h1 class="brand-title">Woden<span>Track</span></h1>
          <p class="brand-desc">Control de asistencia · Android</p>
        </div>
      </div>

      <!-- Sin APK -->
      <div v-if="!apkData.exists" class="card empty">
        <i class="fas fa-clock" style="font-size:1.5rem;color:#FF8F00;"></i>
        <p class="empty-title">Sin actualización disponible</p>
        <p class="empty-sub">Nueva versión en preparación. Intenta más tarde.</p>
      </div>

      <!-- Con APK -->
      <div v-else class="card main">

        <!-- Chips de info -->
        <div class="chips">
          <div class="chip">
            <i class="fas fa-tag"></i>
            <span>v{{ apkData.version }}</span>
          </div>
          <div class="chip">
            <i class="fas fa-database"></i>
            <span>{{ apkData.size }} MB</span>
          </div>
          <div class="chip chip-green">
            <i class="fas fa-check-circle"></i>
            <span>Verificada</span>
          </div>
        </div>

        <!-- Botón descarga -->
        <button class="btn-dl" @click="descargarApk">
          <div class="btn-dl-icon">
            <i class="fas fa-download"></i>
          </div>
          <div class="btn-dl-text">
            <span class="btn-dl-main">Descargar APK</span>
            <span class="btn-dl-sub">Android 6.0 o superior</span>
          </div>
          <i class="fas fa-chevron-right btn-dl-arrow"></i>
        </button>

        <!-- Secundarios -->
        <div class="sec-row">
          <button class="btn-sec" @click="activeModal = 'changelog'">
            <i class="fas fa-rocket"></i> Novedades
          </button>
          <button class="btn-sec" @click="activeModal = 'qr'">
            <i class="fas fa-qrcode"></i> Código QR
          </button>
        </div>
      </div>

      <!-- Privacidad -->
      <div class="card priv">
        <div class="priv-top">
          <div class="priv-icons">
            <span class="priv-ico"><i class="fas fa-microphone-slash"></i></span>
            <span class="priv-ico"><i class="fas fa-user-slash"></i></span>
            <span class="priv-ico"><i class="fas fa-ban"></i></span>
          </div>
          <div>
            <p class="priv-title">No intrusiva</p>
            <p class="priv-sub">Sin acceso a micrófono, contactos ni datos privados</p>
          </div>
        </div>
        <button class="btn-priv" @click="activeModal = 'privacy'">
          <i class="fas fa-shield-alt"></i>
          Ver política de permisos
          <i class="fas fa-chevron-right" style="margin-left:auto;font-size:0.65rem;"></i>
        </button>
      </div>

      <!-- Volver -->
      <router-link to="/login" class="back-lnk">
        <i class="fas fa-arrow-left"></i> Volver al inicio
      </router-link>
    </div>

    <!-- MODALES -->
    <Transition name="mfade">
      <div v-if="activeModal" class="modal-bg" @click.self="activeModal = null">
        <div class="modal-card">

          <!-- Cabecera -->
          <div class="modal-hd">
            <div class="modal-ico" :class="{
              'mico-green' : activeModal==='privacy',
              'mico-orange': activeModal==='qr',
              'mico-blue'  : activeModal==='changelog'
            }">
              <i :class="{
                'fas fa-shield-alt': activeModal==='privacy',
                'fas fa-qrcode'    : activeModal==='qr',
                'fas fa-rocket'    : activeModal==='changelog'
              }"></i>
            </div>
            <h3 class="modal-title">
              {{ activeModal==='privacy' ? 'Política de permisos'
               : activeModal==='qr'      ? 'Escaneo rápido'
               :                           'Novedades' }}
            </h3>
            <button class="modal-cls" @click="activeModal=null">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Cuerpo -->
          <div class="modal-body">

            <template v-if="activeModal==='privacy'">
              <p class="modal-txt">Tu dispositivo alerta cuando una app intenta acceder a tus datos. <strong>WodenTrack nunca activará esas alertas.</strong></p>
              <div class="modal-hl">
                <i class="fas fa-check-circle" style="color:#4ade80;flex-shrink:0;margin-top:2px;"></i>
                <p>Arquitectura <strong>No Intrusiva</strong> — sin permisos de cámara, micrófono ni contactos.</p>
              </div>
              <button class="btn-ok" @click="activeModal=null">Entendido</button>
            </template>

            <template v-if="activeModal==='qr'">
              <div class="qr-box" v-if="apkData?.exists">
                <qrcode-vue :value="apkData.downloadUrl" :size="175" level="H" foreground="#0a0f1e" />
              </div>
              <p v-else class="modal-txt" style="color:#f87171;">QR no disponible</p>
              <p class="modal-hint">Apunta tu cámara para descargar directamente</p>
            </template>

            <template v-if="activeModal==='changelog'">
              <ul class="cl-list">
                <li v-for="(item, i) in apkData.changelog" :key="i" class="cl-item">
                  <span class="cl-num">{{ String(i+1).padStart(2,'0') }}</span>
                  <span>{{ item }}</span>
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
/* IMPORTANTE: nunca usar * { font-family } aquí — rompe FontAwesome */

.page-root {
  min-height: 100dvh;
  background: #0a0f1e;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.25rem;
  position: relative;
  overflow: hidden;
  color: #e2e8f0;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

/* Glows de fondo */
.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  animation: breathe 8s ease-in-out infinite alternate;
}
.bg-glow-1 { width: 480px; height: 480px; background: rgba(255,143,0,0.09); top: -150px; left: -150px; }
.bg-glow-2 { width: 380px; height: 380px; background: rgba(59,91,219,0.08); bottom: -120px; right: -120px; animation-delay: -4s; }
@keyframes breathe {
  from { opacity: .6; transform: scale(1); }
  to   { opacity: 1;  transform: scale(1.12); }
}

/* Loading */
.state-center { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
.spin-ring {
  width: 40px; height: 40px; border-radius: 50%;
  border: 3px solid rgba(255,143,0,.2);
  border-top-color: #FF8F00;
  animation: spin .9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-txt { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .2em; color: rgba(255,143,0,.7); }

/* Content */
.content { width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: .9rem; z-index: 1; }

/* Brand */
.brand { display: flex; align-items: center; gap: 1rem; padding: .5rem .25rem .75rem; }
.app-icon {
  width: 70px; height: 70px; border-radius: 22px; flex-shrink: 0;
  background: linear-gradient(145deg, #131b30, #1c2540);
  border: 1.5px solid rgba(255,143,0,.3);
  box-shadow: 0 0 28px rgba(255,143,0,.15), inset 0 1px 0 rgba(255,255,255,.05);
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem; color: #FF8F00;
}
.brand-sys { font-size: .58rem; font-weight: 700; text-transform: uppercase; letter-spacing: .2em; color: #FF8F00; margin-bottom: .2rem; }
.brand-title { font-size: 2.1rem; font-weight: 900; letter-spacing: -.03em; line-height: 1; color: #f1f5f9; margin-bottom: .25rem; }
.brand-title span { color: #FF8F00; }
.brand-desc { font-size: .6rem; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,.25); }

/* Card base */
.card {
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 20px;
  padding: 1.4rem;
}

/* Main card */
.main { display: flex; flex-direction: column; gap: 1rem; }

/* Chips */
.chips { display: flex; gap: .5rem; flex-wrap: wrap; }
.chip {
  display: flex; align-items: center; gap: .35rem;
  padding: .3rem .8rem;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 99px;
  font-size: .68rem; font-weight: 700; color: #94a3b8;
}
.chip-green { color: #4ade80; border-color: rgba(74,222,128,.2); background: rgba(74,222,128,.06); }

/* Download button */
.btn-dl {
  width: 100%; border: none; border-radius: 16px; cursor: pointer;
  background: linear-gradient(135deg, #FF8F00 0%, #e06600 100%);
  padding: .95rem 1.15rem;
  display: flex; align-items: center; gap: .85rem;
  box-shadow: 0 8px 28px -4px rgba(255,143,0,.45);
  transition: transform .2s ease, box-shadow .2s ease;
}
.btn-dl:hover { transform: translateY(-2px); box-shadow: 0 14px 36px -4px rgba(255,143,0,.55); }
.btn-dl:active { transform: translateY(0); }
.btn-dl-icon {
  width: 42px; height: 42px; border-radius: 12px;
  background: rgba(0,0,0,.18);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; color: #fff; flex-shrink: 0;
}
.btn-dl-text { display: flex; flex-direction: column; flex: 1; text-align: left; }
.btn-dl-main { font-size: .88rem; font-weight: 800; color: #000; letter-spacing: .01em; }
.btn-dl-sub  { font-size: .6rem; font-weight: 600; color: rgba(0,0,0,.45); text-transform: uppercase; letter-spacing: .07em; margin-top: .1rem; }
.btn-dl-arrow { color: rgba(0,0,0,.3); font-size: .75rem; }

/* Secundarios */
.sec-row { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
.btn-sec {
  padding: .75rem;
  border-radius: 12px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.07);
  color: rgba(255,255,255,.5);
  font-size: .68rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: .07em;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: .45rem;
  transition: all .2s;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}
.btn-sec:hover { background: rgba(255,143,0,.07); border-color: rgba(255,143,0,.2); color: #FF8F00; }

/* Empty */
.empty { display: flex; flex-direction: column; align-items: center; gap: .7rem; text-align: center; }
.empty-title { font-size: .8rem; font-weight: 800; color: #FF8F00; text-transform: uppercase; letter-spacing: .08em; }
.empty-sub   { font-size: .72rem; color: #475569; line-height: 1.6; }

/* Privacy */
.priv { display: flex; flex-direction: column; gap: .9rem; }
.priv-top { display: flex; align-items: center; gap: .85rem; }
.priv-icons { display: flex; gap: .4rem; flex-shrink: 0; }
.priv-ico {
  width: 32px; height: 32px; border-radius: 9px;
  background: rgba(74,222,128,.06);
  border: 1px solid rgba(74,222,128,.15);
  display: flex; align-items: center; justify-content: center;
  font-size: .65rem; color: #4ade80;
}
.priv-title { font-size: .78rem; font-weight: 800; color: #f1f5f9; margin-bottom: .2rem; }
.priv-sub   { font-size: .65rem; color: #475569; }
.btn-priv {
  width: 100%; padding: .72rem 1rem; border-radius: 12px;
  background: rgba(74,222,128,.04);
  border: 1px solid rgba(74,222,128,.12);
  color: #4ade80; font-size: .7rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: .07em;
  cursor: pointer; display: flex; align-items: center; gap: .5rem;
  transition: all .2s;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}
.btn-priv:hover { background: rgba(74,222,128,.09); border-color: rgba(74,222,128,.25); }

/* Back */
.back-lnk {
  display: flex; align-items: center; justify-content: center; gap: .4rem;
  font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .15em;
  color: rgba(255,255,255,.15); text-decoration: none; padding: .5rem;
  transition: color .2s;
}
.back-lnk:hover { color: rgba(255,143,0,.6); }

/* Modal */
.modal-bg {
  position: fixed; inset: 0; z-index: 200;
  display: flex; align-items: flex-end; justify-content: center; padding: 1rem;
  background: rgba(4,6,15,.88); backdrop-filter: blur(18px);
}
@media (min-width: 500px) { .modal-bg { align-items: center; } }

.modal-card {
  width: 100%; max-width: 390px;
  background: #0d1325;
  border: 1px solid rgba(255,143,0,.18);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 0 60px rgba(255,143,0,.08), 0 30px 70px rgba(0,0,0,.6);
}
.modal-hd {
  display: flex; align-items: center; gap: .85rem;
  padding: 1.15rem 1.4rem;
  border-bottom: 1px solid rgba(255,255,255,.06);
}
.modal-ico {
  width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: .95rem;
}
.mico-green  { background: rgba(74,222,128,.1);  border: 1px solid rgba(74,222,128,.2);  color: #4ade80; }
.mico-orange { background: rgba(255,143,0,.1);   border: 1px solid rgba(255,143,0,.2);   color: #FF8F00; }
.mico-blue   { background: rgba(96,165,250,.1);  border: 1px solid rgba(96,165,250,.2);  color: #60a5fa; }
.modal-title { flex: 1; font-size: .82rem; font-weight: 800; color: #f1f5f9; }
.modal-cls {
  width: 30px; height: 30px; border-radius: 8px;
  background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
  color: #64748b; font-size: .75rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all .2s;
}
.modal-cls:hover { background: rgba(255,255,255,.1); color: #fff; }

.modal-body {
  padding: 1.4rem;
  display: flex; flex-direction: column; align-items: center; gap: 1rem;
}
.modal-txt { font-size: .78rem; color: #64748b; line-height: 1.7; text-align: center; }
.modal-txt strong { color: #f1f5f9; }
.modal-hl {
  display: flex; align-items: flex-start; gap: .65rem;
  padding: .85rem 1rem;
  background: rgba(74,222,128,.04);
  border-left: 2px solid #4ade80;
  border-radius: 0 10px 10px 0;
  font-size: .73rem; color: #64748b; line-height: 1.6; width: 100%;
}
.modal-hl strong { color: #fff; }
.btn-ok {
  width: 100%; padding: .85rem; border-radius: 12px;
  background: linear-gradient(135deg, #FF8F00, #e06600);
  color: #000; font-size: .75rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: .12em;
  border: none; cursor: pointer; transition: all .2s;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}
.btn-ok:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(255,143,0,.4); }

.qr-box { padding: .85rem; background: #fff; border-radius: 16px; }
.modal-hint { font-size: .6rem; font-weight: 600; color: #334155; text-transform: uppercase; letter-spacing: .14em; text-align: center; }

.cl-list { width: 100%; list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .5rem; max-height: 280px; overflow-y: auto; }
.cl-item {
  display: flex; align-items: flex-start; gap: .7rem;
  padding: .7rem .9rem;
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,143,0,.08);
  border-radius: 10px; font-size: .73rem; color: #94a3b8; line-height: 1.5;
}
.cl-num { font-size: .6rem; font-weight: 800; color: #FF8F00; flex-shrink: 0; margin-top: 2px; font-family: monospace; }

/* Transición modal */
.mfade-enter-active { transition: opacity .3s ease; }
.mfade-leave-active { transition: opacity .25s ease; }
.mfade-enter-from, .mfade-leave-to { opacity: 0; }
.mfade-enter-active .modal-card { animation: slideUp .35s cubic-bezier(.16,1,.3,1) both; }
@keyframes slideUp {
  from { transform: translateY(30px) scale(.97); opacity: 0; }
  to   { transform: translateY(0) scale(1); opacity: 1; }
}
</style>
