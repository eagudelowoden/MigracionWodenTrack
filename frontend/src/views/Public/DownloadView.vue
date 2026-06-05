<template>
  <!-- h-screen overflow-hidden congela el viewport previniendo rebotes o scrolls externos en móviles -->
  <div
    class="h-screen w-screen overflow-hidden flex items-center justify-center p-4 transition-colors duration-300 font-sans select-none relative"
    :class="isDark ? 'bg-[#0B0F19] text-[#F5F5F7]' : 'bg-[#F4F6FA] text-[#111827]'">

    <!-- FONDO PREMIUM UNIFICADO -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div class="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style="background-image: radial-gradient(#111827 1px, transparent 1px); background-size: 24px 24px;">
      </div>
      <div class="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] transition-opacity duration-300"
        :class="isDark ? 'bg-blue-500/10' : 'bg-blue-400/20'"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[120px] transition-opacity duration-300"
        :class="isDark ? 'bg-[#e88710]/10' : 'bg-[#e88710]/15'"></div>
    </div>

    <!-- CONTENEDOR CENTRAL CONTROLADO (Evita exceder el alto del dispositivo) -->
    <div class="w-full max-w-sm flex flex-col justify-between relative z-10 max-h-[92vh] overflow-hidden">

      <!-- LOADING ESTILO NUBANK -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 space-y-4">
        <div class="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
          :class="isDark ? 'border-[#e88710]' : 'border-[#2563EB]'"></div>
        <p class="text-xs font-medium opacity-60 tracking-wide">Cargando la última versión...</p>
      </div>

      <!-- CONTENIDO PRINCIPAL CON SCROLL INTERNO SI FUERA NECESARIO -->
      <div v-else-if="apkData" class="flex flex-col overflow-hidden space-y-4 animate-fade-in">

        <!-- CABECERA DE MARCA (Fija arriba) -->
        <header class="flex items-center gap-3.5 p-1 text-left flex-shrink-0">
          <div class="w-11 h-11 flex items-center justify-center rounded-xl border text-lg flex-shrink-0"
            :class="isDark ? 'bg-[#161B26] border-[#222938] text-[#e88710]' : 'bg-white border-transparent text-[#2563EB] shadow-sm'">
            <i class="fab fa-android"></i>
          </div>
          <div class="space-y-0.5">
            <h1 class="text-lg font-extrabold tracking-tight">
              Woden<span class="text-[#e88710]">Track</span>
            </h1>
            <p class="text-[11px] opacity-60">Control de asistencia · Android</p>
          </div>
        </header>

        <!-- AREA DE TARJETAS FLUIDA (Si el dispositivo es muy pequeño, esta zona maneja el scroll de forma aislada) -->
        <div class="overflow-y-auto space-y-4 pr-0.5 max-h-full scrollbar-none">

          <!-- CASO 1: SIN ACTUALIZACIÓN DISPONIBLE -->
          <div v-if="!apkData.exists"
            class="p-6 rounded-2xl border text-center space-y-3 backdrop-blur-md transition-all"
            :class="isDark ? 'bg-[#161B26]/90 border-[#222938]' : 'bg-white/90 border-transparent shadow-[0_10px_30px_rgba(0,0,0,0.02)]'">
            <div class="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <i class="fas fa-clock text-sm"></i>
            </div>
            <div class="space-y-1">
              <h3 class="font-bold text-xs">Sin actualización disponible</h3>
              <p class="text-[11px] opacity-60 max-w-xs mx-auto leading-relaxed">Nueva versión en preparación por el
                equipo técnico. Intenta más tarde.</p>
            </div>
          </div>

          <!-- CASO 2: CON APK DISPONIBLE -->
          <div v-else class="space-y-3">
            <!-- TARJETA PRINCIPAL DE DESCARGA -->
            <div class="p-5 rounded-2xl border text-left space-y-5 backdrop-blur-md"
              :class="isDark ? 'bg-[#161B26]/90 border-[#222938]' : 'bg-white/90 border-transparent shadow-[0_10px_30px_rgba(0,0,0,0.02)]'">

              <!-- Chips de Información Horizontales -->
              <div class="flex flex-wrap gap-1.5">
                <div class="px-2 py-0.5 rounded-lg text-[10px] font-semibold border flex items-center gap-1"
                  :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-zinc-300' : 'bg-[#F4F6FA] border-transparent text-zinc-700'">
                  <i class="fas fa-tag text-[8px] opacity-60"></i> v{{ apkData.version }}
                </div>
                <div class="px-2 py-0.5 rounded-lg text-[10px] font-semibold border flex items-center gap-1"
                  :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-zinc-300' : 'bg-[#F4F6FA] border-transparent text-zinc-700'">
                  <i class="fas fa-database text-[8px] opacity-60"></i> {{ apkData.size }} MB
                </div>
                <div
                  class="px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                  <i class="fas fa-check-circle text-[9px]"></i> Verificada
                </div>
              </div>

              <!-- Botón de Descarga Estilo Fila Nubank -->
              <button @click="descargarApk"
                class="w-full group p-3.5 rounded-xl border text-left flex items-center justify-between transition-all duration-200"
                :class="isDark ? 'bg-[#0B0F19] border-[#222938] hover:border-[#e88710]' : 'bg-[#F4F6FA] border-transparent hover:border-slate-300 shadow-sm'">
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 flex items-center justify-center rounded-full bg-[#2563EB] text-white transition-transform group-hover:scale-105">
                    <i class="fas fa-download text-xs"></i>
                  </div>
                  <div class="space-y-0.5">
                    <span class="block text-xs font-bold text-[#2563EB] dark:text-[#e88710]">Descargar APK</span>
                    <span class="block text-[10px] opacity-60 font-medium">Compatible con Android 6.0+</span>
                  </div>
                </div>
                <i class="fas fa-chevron-right text-[10px] opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                  :class="isDark ? 'text-white' : 'text-[#111827]'"></i>
              </button>

              <!-- Acciones Secundarias Rediseñadas -->
              <div class="grid grid-cols-2 gap-2 pt-1 border-t"
                :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                <button @click="activeModal = 'changelog'"
                  class="h-9 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-colors"
                  :class="isDark ? 'border-[#222938] hover:bg-[#0B0F19]' : 'border-slate-200 bg-white hover:bg-slate-50'">
                  <i class="fas fa-rocket text-[10px] opacity-60"></i> Novedades
                </button>
                <button @click="activeModal = 'qr'"
                  class="h-9 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-colors"
                  :class="isDark ? 'border-[#222938] hover:bg-[#0B0F19]' : 'border-slate-200 bg-white hover:bg-slate-50'">
                  <i class="fas fa-qrcode text-[10px] opacity-60"></i> Código QR
                </button>
              </div>
            </div>
          </div>

          <!-- TARJETA PRIVACIDAD / SEGURIDAD -->
          <div class="p-4 rounded-2xl border text-left space-y-3 backdrop-blur-md"
            :class="isDark ? 'bg-[#161B26]/90 border-[#222938]' : 'bg-white/90 border-transparent shadow-[0_10px_30px_rgba(0,0,0,0.02)]'">
            <div class="flex items-start gap-3">
              <div class="flex gap-1 text-xs pt-0.5 text-slate-400 flex-shrink-0">
                <span class="w-5 h-5 rounded bg-zinc-500/10 flex items-center justify-center text-[10px]"><i
                    class="fas fa-microphone-slash"></i></span>
                <span class="w-5 h-5 rounded bg-zinc-500/10 flex items-center justify-center text-[10px]"><i
                    class="fas fa-user-slash"></i></span>
              </div>
              <div class="space-y-0.5">
                <h4 class="text-xs font-bold">Aplicación no intrusiva</h4>
                <p class="text-[11px] opacity-60 leading-normal">Sin accesos a micrófono, contactos ni archivos
                  privados.</p>
              </div>
            </div>

            <button @click="activeModal = 'privacy'"
              class="w-full h-8 rounded-lg text-[11px] font-bold border flex items-center justify-between px-3 transition-colors"
              :class="isDark ? 'border-[#222938] bg-[#0B0F19] text-[#8895B3] hover:text-white' : 'border-slate-200 bg-[#F4F6FA] text-slate-600 hover:text-[#2563EB]'">
              <span class="flex items-center gap-1.5"><i class="fas fa-shield-alt text-[10px]"></i> Política de
                permisos</span>
              <i class="fas fa-chevron-right text-[8px] opacity-60"></i>
            </button>
          </div>
        </div>

        <!-- LINK DE RETORNO (Fijo abajo) -->
        <div class="pt-1 text-center flex-shrink-0">
          <router-link to="/login"
            class="inline-flex items-center gap-1.5 text-xs font-bold tracking-tight transition-colors"
            :class="isDark ? 'text-[#8895B3] hover:text-white' : 'text-[#64748B] hover:text-[#2563EB]'">
            <i class="fas fa-arrow-left text-[9px]"></i> Volver al inicio de sesión
          </router-link>
        </div>
      </div>

      <!-- MODALES COMPLETAMENTE REDISEÑADOS -->
      <Transition name="fade">
        <div v-if="activeModal"
          class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          @click.self="activeModal = null">
          <div class="w-full max-w-xs rounded-2xl p-5 border text-left space-y-4 animate-scale-up"
            :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-transparent shadow-xl'">

            <!-- Cabecera de Modal -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center text-[11px]" :class="{
                  'bg-emerald-500/10 text-emerald-500': activeModal === 'privacy',
                  'bg-[#e88710]/10 text-[#e88710]': activeModal === 'qr',
                  'bg-blue-500/10 text-blue-500': activeModal === 'changelog'
                }">
                  <i :class="{
                    'fas fa-shield-alt': activeModal === 'privacy',
                    'fas fa-qrcode': activeModal === 'qr',
                    'fas fa-rocket': activeModal === 'changelog'
                  }"></i>
                </div>
                <h3 class="font-bold text-xs uppercase tracking-wide">
                  {{ activeModal === 'privacy' ? 'Permisos' : activeModal === 'qr' ? 'Escaneo' : 'Novedades' }}
                </h3>
              </div>
              <button
                class="w-6 h-6 flex items-center justify-center rounded-full opacity-40 hover:opacity-100 hover:bg-zinc-500/10 transition-all"
                @click="activeModal = null">
                <i class="fas fa-times text-[10px]"></i>
              </button>
            </div>

            <!-- Cuerpo de Modal -->
            <div class="text-xs leading-relaxed font-normal">

              <!-- Contenido Privacidad -->
              <template v-if="activeModal === 'privacy'">
                <p class="opacity-70 mb-3 text-[11px]">Tu ecosistema está a salvo. <strong class="font-bold">WodenTrack
                    nunca activará alertas de lectura de datos personales.</strong></p>
                <div class="p-2.5 rounded-xl border flex items-start gap-2 mb-4 text-[11px]"
                  :class="isDark ? 'bg-[#0B0F19] border-[#222938]' : 'bg-[#F4F6FA] border-transparent'">
                  <i class="fas fa-check-circle text-emerald-500 pt-0.5 flex-shrink-0"></i>
                  <p class="opacity-80">Garantía <strong class="font-bold">No Intrusiva</strong>: Sin peticiones de
                    rastreo de ubicación ni de contactos.</p>
                </div>
                <button
                  class="w-full h-9 rounded-xl font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors shadow-sm text-[11px]"
                  @click="activeModal = null">
                  Entendido
                </button>
              </template>

              <!-- Contenido QR -->
              <template v-if="activeModal === 'qr'">
                <div class="flex flex-col items-center justify-center space-y-3 py-1">
                  <div class="p-2 bg-white rounded-xl shadow-sm inline-block" v-if="apkData?.exists">
                    <qrcode-vue :value="apkData.downloadUrl" :size="130" level="H" foreground="#0B0F19" />
                  </div>
                  <p v-else class="font-medium text-rose-500 text-[11px]">QR no disponible</p>
                  <p class="text-center opacity-60 max-w-[180px] mx-auto text-[10px]">Escanea con tu cámara móvil para
                    descargar directo.</p>
                </div>
              </template>

              <!-- Contenido Novedades (Changelog) -->
              <template v-if="activeModal === 'changelog'">
                <ul class="space-y-2 max-h-[160px] overflow-y-auto pr-0.5 scrollbar-none">
                  <li v-for="(item, i) in apkData.changelog" :key="i"
                    class="p-2 rounded-xl border flex items-start gap-2.5"
                    :class="isDark ? 'bg-[#0B0F19] border-[#222938]' : 'bg-[#F4F6FA] border-transparent'">
                    <span
                      class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#e88710]/10 text-[#e88710] mt-0.5 flex-shrink-0">
                      {{ String(i + 1).padStart(2, '0') }}
                    </span>
                    <span class="opacity-80 font-medium text-[11px]">{{ item }}</span>
                  </li>
                </ul>
              </template>

            </div>
          </div>
        </div>
      </Transition>

    </div>
  </div>
</template>

<style scoped>
/* Utilidad de CSS para ocultar las barras de scroll predeterminadas y mantener la limpieza visual */
.scrollbar-none::-webkit-scrollbar {
  display: none;
}

.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

<script setup>
import { ref, onMounted, computed } from 'vue';
import QrcodeVue from 'qrcode.vue';
import { useApkRepo } from '../../composables/adminLogica/useApkRepo.js';

const { apkData, loading, error, fetchApkInfo, descargarApk } = useApkRepo();
const activeModal = ref(null);

const isDark = ref(localStorage.getItem('theme') !== 'light');

onMounted(fetchApkInfo);
</script>

<style scoped>
/* IMPORTANTE: nunca usar * { font-family } aquí — rompe FontAwesome */

.page-root {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.25rem;
  position: relative;
  overflow: hidden;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  transition: background .4s, color .4s;
}

/* Tema oscuro */
.theme-dark {
  background: #0a0f1e;
  color: #e2e8f0;
}

/* Tema claro */
.theme-light {
  background: #f1f5f9;
  color: #1e293b;
}

/* Glows de fondo */
.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  animation: breathe 8s ease-in-out infinite alternate;
}

.bg-glow-1 {
  width: 480px;
  height: 480px;
  top: -150px;
  left: -150px;
}

.bg-glow-2 {
  width: 380px;
  height: 380px;
  bottom: -120px;
  right: -120px;
  animation-delay: -4s;
}

.theme-dark .bg-glow-1 {
  background: rgba(255, 143, 0, .09);
}

.theme-dark .bg-glow-2 {
  background: rgba(59, 91, 219, .08);
}

.theme-light .bg-glow-1 {
  background: rgba(255, 143, 0, .12);
}

.theme-light .bg-glow-2 {
  background: rgba(59, 91, 219, .07);
}

@keyframes breathe {
  from {
    opacity: .6;
    transform: scale(1);
  }

  to {
    opacity: 1;
    transform: scale(1.12);
  }
}

/* Loading */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spin-ring {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(255, 143, 0, .2);
  border-top-color: #FF8F00;
  animation: spin .9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-txt {
  font-size: .7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .2em;
  color: rgba(255, 143, 0, .7);
}

/* Content */
.content {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: .9rem;
  z-index: 1;
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: .5rem .25rem .75rem;
}

.app-icon {
  width: 70px;
  height: 70px;
  border-radius: 22px;
  flex-shrink: 0;
  background: linear-gradient(145deg, #131b30, #1c2540);
  border: 1.5px solid rgba(255, 143, 0, .3);
  box-shadow: 0 0 28px rgba(255, 143, 0, .15), inset 0 1px 0 rgba(255, 255, 255, .05);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #FF8F00;
}

.brand-sys {
  font-size: .58rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .2em;
  color: #FF8F00;
  margin-bottom: .2rem;
}

.brand-title {
  font-size: 2.1rem;
  font-weight: 900;
  letter-spacing: -.03em;
  line-height: 1;
  margin-bottom: .25rem;
}

.theme-dark .brand-title {
  color: #f1f5f9;
}

.theme-light .brand-title {
  color: #0f172a;
}

.brand-title span {
  color: #FF8F00;
}

.theme-dark .brand-desc {
  color: rgba(255, 255, 255, .25);
}

.theme-light .brand-desc {
  color: #94a3b8;
}

.brand-desc {
  font-size: .6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .1em;
}

/* Card base */
.card {
  border-radius: 20px;
  padding: 1.4rem;
  transition: background .4s, border-color .4s;
}

.theme-dark .card {
  background: rgba(255, 255, 255, .03);
  border: 1px solid rgba(255, 255, 255, .07);
}

.theme-light .card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 16px rgba(0, 0, 0, .06);
}

/* Main card */
.main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Chips */
.chips {
  display: flex;
  gap: .5rem;
  flex-wrap: wrap;
}

.chip {
  display: flex;
  align-items: center;
  gap: .35rem;
  padding: .3rem .8rem;
  border-radius: 99px;
  font-size: .68rem;
  font-weight: 700;
}

.theme-dark .chip {
  background: rgba(255, 255, 255, .05);
  border: 1px solid rgba(255, 255, 255, .08);
  color: #94a3b8;
}

.theme-light .chip {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.chip-green {
  color: #16a34a !important;
  border-color: rgba(22, 163, 74, .25) !important;
  background: rgba(22, 163, 74, .07) !important;
}

/* Download button */
.btn-dl {
  width: 100%;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  background: linear-gradient(135deg, #FF8F00 0%, #e06600 100%);
  padding: .95rem 1.15rem;
  display: flex;
  align-items: center;
  gap: .85rem;
  box-shadow: 0 8px 28px -4px rgba(255, 143, 0, .45);
  transition: transform .2s ease, box-shadow .2s ease;
}

.btn-dl:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 36px -4px rgba(255, 143, 0, .55);
}

.btn-dl:active {
  transform: translateY(0);
}

.btn-dl-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(0, 0, 0, .18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: #fff;
  flex-shrink: 0;
}

.btn-dl-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  text-align: left;
}

.btn-dl-main {
  font-size: .88rem;
  font-weight: 800;
  color: #000;
  letter-spacing: .01em;
}

.btn-dl-sub {
  font-size: .6rem;
  font-weight: 600;
  color: rgba(0, 0, 0, .45);
  text-transform: uppercase;
  letter-spacing: .07em;
  margin-top: .1rem;
}

.btn-dl-arrow {
  color: rgba(0, 0, 0, .3);
  font-size: .75rem;
}

/* Secundarios */
.sec-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .6rem;
}

.btn-sec {
  padding: .75rem;
  border-radius: 12px;
  font-size: .68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  transition: all .2s;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

.theme-dark .btn-sec {
  background: rgba(255, 255, 255, .04);
  border: 1px solid rgba(255, 255, 255, .07);
  color: rgba(255, 255, 255, .5);
}

.theme-light .btn-sec {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.btn-sec:hover {
  background: rgba(255, 143, 0, .07);
  border-color: rgba(255, 143, 0, .2);
  color: #FF8F00;
}

/* Empty */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .7rem;
  text-align: center;
}

.empty-title {
  font-size: .8rem;
  font-weight: 800;
  color: #FF8F00;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.empty-sub {
  font-size: .72rem;
  color: #475569;
  line-height: 1.6;
}

/* Privacy */
.priv {
  display: flex;
  flex-direction: column;
  gap: .9rem;
}

.priv-top {
  display: flex;
  align-items: center;
  gap: .85rem;
}

.priv-icons {
  display: flex;
  gap: .4rem;
  flex-shrink: 0;
}

.priv-ico {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: rgba(74, 222, 128, .06);
  border: 1px solid rgba(74, 222, 128, .15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .65rem;
  color: #4ade80;
}

.priv-title {
  font-size: .78rem;
  font-weight: 800;
  margin-bottom: .2rem;
}

.theme-dark .priv-title {
  color: #f1f5f9;
}

.theme-light .priv-title {
  color: #0f172a;
}

.priv-sub {
  font-size: .65rem;
  color: #64748b;
}

.btn-priv {
  width: 100%;
  padding: .72rem 1rem;
  border-radius: 12px;
  background: rgba(74, 222, 128, .04);
  border: 1px solid rgba(74, 222, 128, .12);
  color: #4ade80;
  font-size: .7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: .5rem;
  transition: all .2s;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

.btn-priv:hover {
  background: rgba(74, 222, 128, .09);
  border-color: rgba(74, 222, 128, .25);
}

/* Back */
.back-lnk {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .4rem;
  font-size: .65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .15em;
  color: rgba(255, 255, 255, .15);
  text-decoration: none;
  padding: .5rem;
  transition: color .2s;
}

.back-lnk:hover {
  color: rgba(255, 143, 0, .6);
}

/* Modal */
.modal-bg {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 1rem;
  background: rgba(4, 6, 15, .88);
  backdrop-filter: blur(18px);
}

@media (min-width: 500px) {
  .modal-bg {
    align-items: center;
  }
}

.modal-card {
  width: 100%;
  max-width: 390px;
  border: 1px solid rgba(255, 143, 0, .18);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 0 60px rgba(255, 143, 0, .08), 0 30px 70px rgba(0, 0, 0, .4);
}

.theme-dark .modal-card {
  background: #0d1325;
}

.theme-light .modal-card {
  background: #ffffff;
}

.modal-hd {
  display: flex;
  align-items: center;
  gap: .85rem;
  padding: 1.15rem 1.4rem;
}

.theme-dark .modal-hd {
  border-bottom: 1px solid rgba(255, 255, 255, .06);
}

.theme-light .modal-hd {
  border-bottom: 1px solid #f1f5f9;
}

.modal-ico {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .95rem;
}

.mico-green {
  background: rgba(74, 222, 128, .1);
  border: 1px solid rgba(74, 222, 128, .2);
  color: #4ade80;
}

.mico-orange {
  background: rgba(255, 143, 0, .1);
  border: 1px solid rgba(255, 143, 0, .2);
  color: #FF8F00;
}

.mico-blue {
  background: rgba(96, 165, 250, .1);
  border: 1px solid rgba(96, 165, 250, .2);
  color: #60a5fa;
}

.modal-title {
  flex: 1;
  font-size: .82rem;
  font-weight: 800;
}

.theme-dark .modal-title {
  color: #f1f5f9;
}

.theme-light .modal-title {
  color: #0f172a;
}

.modal-cls {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  font-size: .75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .2s;
}

.theme-dark .modal-cls {
  background: rgba(255, 255, 255, .05);
  border: 1px solid rgba(255, 255, 255, .08);
  color: #64748b;
}

.theme-light .modal-cls {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #94a3b8;
}

.modal-cls:hover {
  background: rgba(255, 143, 0, .1);
  color: #FF8F00;
}

.modal-body {
  padding: 1.4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.modal-txt {
  font-size: .78rem;
  color: #64748b;
  line-height: 1.7;
  text-align: center;
}

.theme-dark .modal-txt strong {
  color: #f1f5f9;
}

.theme-light .modal-txt strong {
  color: #0f172a;
}

.modal-hl {
  display: flex;
  align-items: flex-start;
  gap: .65rem;
  padding: .85rem 1rem;
  background: rgba(74, 222, 128, .04);
  border-left: 2px solid #4ade80;
  border-radius: 0 10px 10px 0;
  font-size: .73rem;
  color: #64748b;
  line-height: 1.6;
  width: 100%;
}

.modal-hl strong {
  color: #fff;
}

.btn-ok {
  width: 100%;
  padding: .85rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #FF8F00, #e06600);
  color: #000;
  font-size: .75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .12em;
  border: none;
  cursor: pointer;
  transition: all .2s;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

.btn-ok:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(255, 143, 0, .4);
}

.qr-box {
  padding: .85rem;
  background: #fff;
  border-radius: 16px;
}

.modal-hint {
  font-size: .6rem;
  font-weight: 600;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: .14em;
  text-align: center;
}

.cl-list {
  width: 100%;
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: .5rem;
  max-height: 280px;
  overflow-y: auto;
}

.cl-item {
  display: flex;
  align-items: flex-start;
  gap: .7rem;
  padding: .7rem .9rem;
  background: rgba(255, 255, 255, .02);
  border: 1px solid rgba(255, 143, 0, .08);
  border-radius: 10px;
  font-size: .73rem;
  color: #94a3b8;
  line-height: 1.5;
}

.cl-num {
  font-size: .6rem;
  font-weight: 800;
  color: #FF8F00;
  flex-shrink: 0;
  margin-top: 2px;
  font-family: monospace;
}

/* Transición modal */
.mfade-enter-active {
  transition: opacity .3s ease;
}

.mfade-leave-active {
  transition: opacity .25s ease;
}

.mfade-enter-from,
.mfade-leave-to {
  opacity: 0;
}

.mfade-enter-active .modal-card {
  animation: slideUp .35s cubic-bezier(.16, 1, .3, 1) both;
}

@keyframes slideUp {
  from {
    transform: translateY(30px) scale(.97);
    opacity: 0;
  }

  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}
</style>
