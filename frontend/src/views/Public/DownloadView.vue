<template>
  <!-- h-screen overflow-hidden congela el viewport previniendo rebotes o scrolls externos en móviles -->
  <div class="h-screen w-screen overflow-hidden flex flex-col font-sans select-none transition-colors duration-300"
    :class="isDark ? 'bg-[#0B1120] text-[#F5F5F7]' : 'bg-[#F7FAFD] text-[#10233A]'">

    <!-- HEADER (idéntico al login) -->
    <header
      class="w-full h-[60px] shrink-0 px-4 sm:px-6 flex items-center justify-between border-b relative z-10 transition-colors duration-300"
      :class="isDark ? 'bg-[#0F172A]/95 border-slate-800' : 'bg-white/97 border-[#E2E8F0]'">
      <div class="inline-flex items-center text-[16px] sm:text-[17px] font-extrabold tracking-tight"
        :class="isDark ? 'text-white' : 'text-[#102E4A]'">
        Woden<span class="text-[#FF5400]">Track</span>
      </div>
      <button type="button" @click="toggleTheme" :aria-label="isDark ? 'Modo claro' : 'Modo oscuro'"
        class="inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
        :class="isDark ? 'bg-[#FF5400]/15 text-[#FF5400]' : 'bg-[#EEF4FB] text-[#102E4A] hover:bg-[#E3ECF7]'">
        <i :class="isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'" class="text-sm"></i>
      </button>
    </header>

    <main class="relative flex-1 flex items-center justify-center overflow-hidden p-4">

      <!-- Fondo: mismo mallado disperso del login -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <line v-for="(l, i) in bgLines" :key="i" :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2"
          :stroke="isDark ? 'rgba(255,255,255,0.055)' : 'rgba(16,46,74,0.11)'" stroke-width="1"
          vector-effect="non-scaling-stroke" />
      </svg>

    <!-- CONTENEDOR CENTRAL CONTROLADO (Evita exceder el alto del dispositivo) -->
    <div class="w-full max-w-sm flex flex-col justify-between relative z-10 max-h-[85vh] overflow-hidden">

      <!-- LOADING -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 space-y-4">
        <div class="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
          :class="isDark ? 'border-[#FF5400]' : 'border-[#102E4A]'"></div>
        <p class="text-xs font-medium" :class="isDark ? 'text-slate-400' : 'text-[#64748B]'">Cargando la última
          versión...</p>
      </div>

      <!-- CONTENIDO PRINCIPAL CON SCROLL INTERNO SI FUERA NECESARIO -->
      <div v-else-if="apkData" class="flex flex-col overflow-hidden space-y-4 animate-fade-in">

        <!-- CABECERA DE SECCIÓN (Fija arriba) -->
        <div class="flex items-center gap-3.5 p-1 text-left flex-shrink-0">
          <div class="w-11 h-11 flex items-center justify-center rounded-xl text-lg flex-shrink-0"
            :class="isDark ? 'bg-[#1B2B45] text-[#7CA6DA]' : 'bg-[#EEF4FB] text-[#102E4A]'">
            <i class="fab fa-android"></i>
          </div>
          <div class="space-y-0.5">
            <h1 class="text-base font-extrabold tracking-tight" :class="isDark ? 'text-white' : 'text-[#10233A]'">
              Aplicación móvil
            </h1>
            <p class="text-[11px]" :class="isDark ? 'text-slate-400' : 'text-[#64748B]'">Control de asistencia ·
              Android</p>
          </div>
        </div>

        <!-- AREA DE TARJETAS FLUIDA (Si el dispositivo es muy pequeño, esta zona maneja el scroll de forma aislada) -->
        <div class="overflow-y-auto space-y-4 pr-0.5 max-h-full scrollbar-none">

          <!-- CASO 1: SIN ACTUALIZACIÓN DISPONIBLE -->
          <div v-if="!apkData.exists"
            class="p-6 rounded-[17px] border text-center space-y-3 backdrop-blur-md transition-all"
            :class="isDark ? 'bg-[#111C2E]/90 border-slate-800' : 'bg-white border-[#D7E0EA] shadow-[0_14px_35px_rgba(16,46,74,0.06)]'">
            <div class="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <i class="fas fa-clock text-sm"></i>
            </div>
            <div class="space-y-1">
              <h3 class="font-bold text-xs" :class="isDark ? 'text-white' : 'text-[#10233A]'">Sin actualización
                disponible</h3>
              <p class="text-[11px] max-w-xs mx-auto leading-relaxed" :class="isDark ? 'text-slate-400' : 'text-[#64748B]'">
                Nueva versión en preparación por el equipo técnico. Intenta más tarde.</p>
            </div>
          </div>

          <!-- CASO 2: CON APK DISPONIBLE -->
          <div v-else class="space-y-3">
            <!-- TARJETA PRINCIPAL DE DESCARGA -->
            <div class="p-5 rounded-[17px] border text-left space-y-5 backdrop-blur-md"
              :class="isDark ? 'bg-[#111C2E]/90 border-slate-800' : 'bg-white border-[#D7E0EA] shadow-[0_14px_35px_rgba(16,46,74,0.06)]'">

              <!-- Chips de Información Horizontales -->
              <div class="flex flex-wrap gap-1.5">
                <div class="px-2 py-0.5 rounded-lg text-[10px] font-semibold border flex items-center gap-1"
                  :class="isDark ? 'bg-[#0B1120] border-slate-800 text-slate-300' : 'bg-[#F7FAFD] border-[#E7ECF2] text-[#31445A]'">
                  <i class="fas fa-tag text-[8px] opacity-60"></i> v{{ apkData.version }}
                </div>
                <div class="px-2 py-0.5 rounded-lg text-[10px] font-semibold border flex items-center gap-1"
                  :class="isDark ? 'bg-[#0B1120] border-slate-800 text-slate-300' : 'bg-[#F7FAFD] border-[#E7ECF2] text-[#31445A]'">
                  <i class="fas fa-database text-[8px] opacity-60"></i> {{ apkData.size }} MB
                </div>
                <div
                  class="px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                  <i class="fas fa-check-circle text-[9px]"></i> Verificada
                </div>
              </div>

              <!-- Botón de Descarga Estilo Fila -->
              <button @click="descargarApk"
                class="w-full group p-3.5 rounded-xl border text-left flex items-center justify-between transition-all duration-200"
                :class="isDark ? 'bg-[#0B1120] border-slate-800 hover:border-[#FF5400]/50' : 'bg-[#F7FAFD] border-[#E7ECF2] hover:border-[#C5D1DE] shadow-sm'">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 flex items-center justify-center rounded-full text-white transition-transform group-hover:scale-105"
                    :class="isDark ? 'bg-[#1B4A8A]' : 'bg-[#102E4A]'">
                    <i class="fas fa-download text-xs"></i>
                  </div>
                  <div class="space-y-0.5">
                    <span class="block text-xs font-bold" :class="isDark ? 'text-[#FF5400]' : 'text-[#102E4A]'">Descargar
                      APK</span>
                    <span class="block text-[10px] font-medium" :class="isDark ? 'text-slate-400' : 'text-[#64748B]'">Compatible
                      con Android 6.0+</span>
                  </div>
                </div>
                <i class="fas fa-chevron-right text-[10px] opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                  :class="isDark ? 'text-white' : 'text-[#10233A]'"></i>
              </button>

              <!-- Acciones Secundarias -->
              <div class="grid grid-cols-2 gap-2 pt-1 border-t"
                :class="isDark ? 'border-slate-800' : 'border-[#E7ECF2]'">
                <button @click="activeModal = 'changelog'"
                  class="h-9 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-colors"
                  :class="isDark ? 'border-slate-800 text-slate-300 hover:bg-[#0B1120]' : 'border-[#D7E0EA] bg-white text-[#31445A] hover:bg-[#F7FAFD]'">
                  <i class="fas fa-rocket text-[10px] opacity-60"></i> Novedades
                </button>
                <button @click="activeModal = 'qr'"
                  class="h-9 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-colors"
                  :class="isDark ? 'border-slate-800 text-slate-300 hover:bg-[#0B1120]' : 'border-[#D7E0EA] bg-white text-[#31445A] hover:bg-[#F7FAFD]'">
                  <i class="fas fa-qrcode text-[10px] opacity-60"></i> Código QR
                </button>
              </div>
            </div>
          </div>

          <!-- TARJETA PRIVACIDAD / SEGURIDAD -->
          <div class="p-4 rounded-[17px] border text-left space-y-3 backdrop-blur-md"
            :class="isDark ? 'bg-[#111C2E]/90 border-slate-800' : 'bg-white border-[#D7E0EA] shadow-[0_14px_35px_rgba(16,46,74,0.06)]'">
            <div class="flex items-start gap-3">
              <div class="flex gap-1 text-xs text-slate-400 pt-0.5 flex-shrink-0">
                <span class="w-5 h-5 rounded bg-zinc-500/10 flex items-center justify-center text-[10px]"><i
                    class="fas fa-microphone-slash"></i></span>
                <span class="w-5 h-5 rounded bg-zinc-500/10 flex items-center justify-center text-[10px]"><i
                    class="fas fa-user-slash"></i></span>
              </div>
              <div class="space-y-0.5">
                <h4 class="text-xs font-bold" :class="isDark ? 'text-white' : 'text-[#10233A]'">Aplicación no
                  intrusiva</h4>
                <p class="text-[11px] leading-normal" :class="isDark ? 'text-slate-400' : 'text-[#64748B]'">Sin
                  accesos a micrófono, contactos ni archivos privados.</p>
              </div>
            </div>

            <button @click="activeModal = 'privacy'"
              class="w-full h-8 rounded-lg text-[11px] font-bold border flex items-center justify-between px-3 transition-colors"
              :class="isDark ? 'border-slate-800 bg-[#0B1120] text-slate-400 hover:text-white' : 'border-[#E7ECF2] bg-[#F7FAFD] text-[#31445A] hover:text-[#102E4A]'">
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
            :class="isDark ? 'text-slate-400 hover:text-white' : 'text-[#64748B] hover:text-[#102E4A]'">
            <i class="fas fa-arrow-left text-[9px]"></i> Volver al inicio de sesión
          </router-link>
        </div>
      </div>

      <!-- MODALES -->
      <Transition name="fade">
        <div v-if="activeModal"
          class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          @click.self="activeModal = null">
          <div class="w-full max-w-xs rounded-[17px] p-5 border text-left space-y-4 animate-scale-up"
            :class="isDark ? 'bg-[#111C2E] border-slate-800' : 'bg-white border-[#D7E0EA] shadow-xl'">

            <!-- Cabecera de Modal -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center text-[11px]" :class="{
                  'bg-emerald-500/10 text-emerald-500': activeModal === 'privacy',
                  'bg-[#FF5400]/10 text-[#FF5400]': activeModal === 'qr',
                  'bg-[#102E4A]/10 text-[#102E4A] dark:text-[#7CA6DA]': activeModal === 'changelog'
                }">
                  <i :class="{
                    'fas fa-shield-alt': activeModal === 'privacy',
                    'fas fa-qrcode': activeModal === 'qr',
                    'fas fa-rocket': activeModal === 'changelog'
                  }"></i>
                </div>
                <h3 class="font-bold text-xs uppercase tracking-wide" :class="isDark ? 'text-white' : 'text-[#10233A]'">
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
            <div class="text-xs leading-relaxed font-normal" :class="isDark ? 'text-slate-300' : 'text-[#31445A]'">

              <!-- Contenido Privacidad -->
              <template v-if="activeModal === 'privacy'">
                <p class="mb-3 text-[11px]">Tu ecosistema está a salvo. <strong
                    :class="isDark ? 'text-white' : 'text-[#10233A]'" class="font-bold">WodenTrack nunca activará
                    alertas de lectura de datos personales.</strong></p>
                <div class="p-2.5 rounded-xl border flex items-start gap-2 mb-4 text-[11px]"
                  :class="isDark ? 'bg-[#0B1120] border-slate-800' : 'bg-[#F7FAFD] border-[#E7ECF2]'">
                  <i class="fas fa-check-circle text-emerald-500 pt-0.5 flex-shrink-0"></i>
                  <p>Garantía <strong class="font-bold">No Intrusiva</strong>: Sin peticiones de rastreo de ubicación
                    ni de contactos.</p>
                </div>
                <button
                  class="w-full h-9 rounded-xl font-bold text-white transition-colors shadow-sm text-[11px]"
                  :class="isDark ? 'bg-[#1B4A8A] hover:bg-[#173F75]' : 'bg-[#102E4A] hover:bg-[#0B263E]'"
                  @click="activeModal = null">
                  Entendido
                </button>
              </template>

              <!-- Contenido QR -->
              <template v-if="activeModal === 'qr'">
                <div class="flex flex-col items-center justify-center space-y-3 py-1">
                  <div class="p-2 bg-white rounded-xl shadow-sm inline-block" v-if="apkData?.exists">
                    <qrcode-vue :value="apkData.downloadUrl" :size="130" level="H" foreground="#102E4A" />
                  </div>
                  <p v-else class="font-medium text-rose-500 text-[11px]">QR no disponible</p>
                  <p class="text-center max-w-[180px] mx-auto text-[10px]">Escanea con tu cámara móvil para
                    descargar directo.</p>
                </div>
              </template>

              <!-- Contenido Novedades (Changelog) -->
              <template v-if="activeModal === 'changelog'">
                <ul class="space-y-2 max-h-[160px] overflow-y-auto pr-0.5 scrollbar-none">
                  <li v-for="(item, i) in apkData.changelog" :key="i"
                    class="p-2 rounded-xl border flex items-start gap-2.5"
                    :class="isDark ? 'bg-[#0B1120] border-slate-800' : 'bg-[#F7FAFD] border-[#E7ECF2]'">
                    <span
                      class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FF5400]/10 text-[#FF5400] mt-0.5 flex-shrink-0">
                      {{ String(i + 1).padStart(2, '0') }}
                    </span>
                    <span class="font-medium text-[11px]">{{ item }}</span>
                  </li>
                </ul>
              </template>

            </div>
          </div>
        </div>
      </Transition>

    </div>
    </main>
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
import { ref, onMounted } from 'vue';
import QrcodeVue from 'qrcode.vue';
import { useApkRepo } from '../../composables/adminLogica/useApkRepo.js';
import { bgLines } from '../../utils/bgLines.js';

const { apkData, loading, fetchApkInfo, descargarApk } = useApkRepo();
const activeModal = ref(null);

const isDark = ref(localStorage.getItem('theme') !== 'light');
const toggleTheme = () => {
  isDark.value = !isDark.value;
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

onMounted(fetchApkInfo);
</script>
