<template>
  <div class="w-full h-full flex flex-col gap-3 animate-fade-in">

    <!-- ── Header ── -->
    <div class="flex items-center justify-between px-4 py-3 rounded-md border shrink-0"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/15">
          <i class="fas fa-bell text-amber-400 text-[13px]"></i>
        </div>
        <div>
          <h2 class="text-[13px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">
            Recordatorio Automático · Offboarding
          </h2>
          <p class="text-[10px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            Notifica cuando un checklist lleva demasiado tiempo sin respuesta
          </p>
        </div>
      </div>

      <!-- Ejecutar ahora (manual siempre envía) -->
      <button @click="ejecutarAhora" :disabled="ejecutando || config?.ultimo_estado === 'running'"
        class="flex items-center gap-1.5 h-8 px-4 rounded-md text-[11px] font-semibold transition-all disabled:opacity-50 bg-amber-500 text-white hover:bg-amber-600">
        <i :class="ejecutando ? 'fas fa-circle-notch fa-spin' : 'fas fa-play'" class="text-[9px]"></i>
        {{ ejecutando ? 'Ejecutando…' : 'Ejecutar ahora' }}
      </button>
    </div>

    <!-- ── Tarjetas de estado ── -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
      <!-- Estado actual -->
      <div class="rounded-md border p-3 flex flex-col gap-1"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <p class="text-[9px] font-semibold uppercase tracking-widest"
          :class="isDark ? 'text-slate-500' : 'text-slate-400'">Estado</p>
        <div class="flex items-center gap-1.5 mt-auto">
          <span class="w-2 h-2 rounded-full shrink-0" :class="estadoBadgeClass"></span>
          <span class="text-[12px] font-semibold capitalize" :class="isDark ? 'text-white' : 'text-slate-800'">
            {{ estadoLabel }}
          </span>
        </div>
      </div>

      <!-- Última ejecución -->
      <div class="rounded-md border p-3 flex flex-col gap-1"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <p class="text-[9px] font-semibold uppercase tracking-widest"
          :class="isDark ? 'text-slate-500' : 'text-slate-400'">Última ejecución</p>
        <p class="text-[11px] font-medium mt-auto" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
          {{ config?.ultimo_inicio ? formatFecha(config.ultimo_inicio) : '—' }}
        </p>
      </div>

      <!-- Próxima ejecución -->
      <div class="rounded-md border p-3 flex flex-col gap-1"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <p class="text-[9px] font-semibold uppercase tracking-widest"
          :class="isDark ? 'text-slate-500' : 'text-slate-400'">Próxima</p>
        <p class="text-[11px] font-medium mt-auto" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
          {{ config?.proxima_ejecucion ? formatFecha(config.proxima_ejecucion) : (config?.activo ? '—' : 'Desactivado') }}
        </p>
      </div>

      <!-- Resumen último run -->
      <div class="rounded-md border p-3 flex flex-col gap-1"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <p class="text-[9px] font-semibold uppercase tracking-widest"
          :class="isDark ? 'text-slate-500' : 'text-slate-400'">Último resultado</p>
        <p class="text-[10px] font-medium mt-auto leading-tight"
          :class="config?.ultimo_estado === 'error' ? 'text-red-400' : (isDark ? 'text-slate-300' : 'text-slate-600')">
          {{ config?.ultimo_resumen || config?.ultimo_error || '—' }}
        </p>
      </div>
    </div>

    <!-- ── Cuerpo: Config + Historial ── -->
    <div class="flex-1 flex flex-col md:flex-row gap-3 min-h-0 overflow-hidden">

      <!-- ── Configuración ── -->
      <div class="w-full md:w-[380px] flex flex-col gap-3 shrink-0 overflow-y-auto pr-1">

        <!-- Toggle activo -->
        <div class="rounded-md border p-4"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[12px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">
                Cron activo
              </p>
              <p class="text-[10px] mt-0.5" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                Ejecuta la revisión automáticamente cada día
              </p>
            </div>
            <button @click="toggleActivo"
              class="relative w-10 h-5.5 rounded-full transition-colors duration-200 focus:outline-none"
              :class="formActivo ? 'bg-amber-500' : (isDark ? 'bg-[#2d3548]' : 'bg-slate-200')"
              style="height:22px;width:40px">
              <span class="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
                :class="formActivo ? 'left-[19px]' : 'left-[3px]'"></span>
            </button>
          </div>
        </div>

        <!-- Horario de ejecución -->
        <div class="rounded-md border p-4 flex flex-col gap-3"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
          <p class="text-[10px] font-semibold uppercase tracking-widest"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Horario de ejecución</p>

          <div class="flex items-end gap-3">
            <div class="flex flex-col gap-1 flex-1">
              <label class="text-[10px] font-semibold" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                Hora (0–23)
              </label>
              <input type="number" v-model.number="formHora" min="0" max="23"
                class="h-8 px-3 rounded-md border text-[12px] font-semibold outline-none transition-all"
                :class="isDark
                  ? 'bg-[#0B0F19] border-[#222938] text-white focus:border-amber-500/50'
                  : 'bg-white border-slate-200 text-slate-800 focus:border-amber-400'" />
            </div>
            <div class="flex flex-col gap-1 flex-1">
              <label class="text-[10px] font-semibold" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                Minuto (0–59)
              </label>
              <input type="number" v-model.number="formMinuto" min="0" max="59"
                class="h-8 px-3 rounded-md border text-[12px] font-semibold outline-none transition-all"
                :class="isDark
                  ? 'bg-[#0B0F19] border-[#222938] text-white focus:border-amber-500/50'
                  : 'bg-white border-slate-200 text-slate-800 focus:border-amber-400'" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[10px] font-semibold opacity-0">prev</label>
              <div class="h-8 px-3 rounded-md border flex items-center text-[12px] font-semibold shrink-0"
                :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'">
                {{ String(formHora).padStart(2,'0') }}:{{ String(formMinuto).padStart(2,'0') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Umbral de horas -->
        <div class="rounded-md border p-4 flex flex-col gap-3"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
          <p class="text-[10px] font-semibold uppercase tracking-widest"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Umbral de tiempo sin actividad</p>

          <div class="flex items-end gap-3">
            <div class="flex flex-col gap-1 flex-1">
              <label class="text-[10px] font-semibold" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                Horas sin respuesta
              </label>
              <input type="number" v-model.number="formHorasEspera" min="1" max="720"
                class="h-8 px-3 rounded-md border text-[12px] font-semibold outline-none transition-all"
                :class="isDark
                  ? 'bg-[#0B0F19] border-[#222938] text-white focus:border-amber-500/50'
                  : 'bg-white border-slate-200 text-slate-800 focus:border-amber-400'" />
            </div>
            <div class="h-8 px-3 rounded-md border flex items-center text-[11px] font-medium shrink-0"
              :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'">
              {{ duracionLabel }}
            </div>
          </div>

          <p class="text-[10px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            Si un proceso lleva más de <strong>{{ formHorasEspera }}h</strong> sin que ningún módulo
            sea completado, se enviará el recordatorio.
          </p>
        </div>

        <!-- Correos destinatarios -->
        <div class="rounded-md border p-4 flex flex-col gap-3"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
          <p class="text-[10px] font-semibold uppercase tracking-widest"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Correos de notificación</p>

          <!-- Input agregar correo -->
          <div class="flex gap-2">
            <input v-model="nuevoCorreo" type="email" placeholder="correo@empresa.com"
              @keyup.enter="agregarCorreo"
              class="flex-1 h-8 px-3 rounded-md border text-[11px] outline-none transition-all"
              :class="isDark
                ? 'bg-[#0B0F19] border-[#222938] text-white placeholder:text-slate-600 focus:border-amber-500/50'
                : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-400'" />
            <button @click="agregarCorreo" :disabled="!nuevoCorreo.trim()"
              class="h-8 w-8 rounded-md text-[11px] font-semibold transition-all disabled:opacity-40 flex items-center justify-center"
              :class="isDark ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-amber-500 text-white hover:bg-amber-600'">
              <i class="fas fa-plus text-[10px]"></i>
            </button>
          </div>

          <!-- Lista de correos -->
          <div v-if="correosLista.length === 0"
            class="text-[10px] py-2 text-center"
            :class="isDark ? 'text-slate-600' : 'text-slate-400'">
            <i class="fas fa-exclamation-circle mr-1 text-amber-400"></i>
            Sin correos — la notificación no se enviará
          </div>
          <div v-else class="flex flex-wrap gap-1.5">
            <span v-for="(correo, i) in correosLista" :key="i"
              class="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-md border text-[10px] font-medium"
              :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'">
              <i class="fas fa-envelope text-[8px] opacity-40"></i>
              {{ correo }}
              <button @click="quitarCorreo(i)"
                class="w-4 h-4 rounded flex items-center justify-center transition-colors hover:bg-red-500/20 hover:text-red-400">
                <i class="fas fa-xmark text-[8px]"></i>
              </button>
            </span>
          </div>
        </div>

        <!-- Botón guardar -->
        <button @click="guardar" :disabled="guardando"
          class="h-9 rounded-md text-[11px] font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          :class="isDark ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-amber-500 text-white hover:bg-amber-600'">
          <i :class="guardando ? 'fas fa-circle-notch fa-spin' : 'fas fa-floppy-disk'" class="text-[10px]"></i>
          {{ guardando ? 'Guardando…' : 'Guardar configuración' }}
        </button>

        <!-- Error config -->
        <p v-if="errorConfig" class="text-[10px] text-red-400 font-semibold flex items-center gap-1">
          <i class="fas fa-exclamation-circle"></i> {{ errorConfig }}
        </p>

        <!-- OK config -->
        <transition name="fade">
          <p v-if="guardadoOk" class="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <i class="fas fa-check-circle"></i> Configuración guardada
          </p>
        </transition>
      </div>

      <!-- ── Historial ── -->
      <div class="flex-1 rounded-md border flex flex-col min-h-0 overflow-hidden"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

        <div class="px-4 py-2.5 border-b shrink-0 flex items-center justify-between"
          :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
          <p class="text-[10px] font-semibold uppercase tracking-widest"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            Historial de ejecuciones
          </p>
          <button @click="cargarHistorial"
            class="w-6 h-6 flex items-center justify-center rounded-md border text-[9px] transition-all"
            :class="isDark ? 'border-[#222938] text-slate-400 hover:text-white' : 'border-slate-200 text-slate-400 hover:text-slate-700'">
            <i class="fas fa-rotate-right text-[9px]"></i>
          </button>
        </div>

        <div v-if="!historial.length" class="flex-1 flex items-center justify-center opacity-40">
          <div class="flex flex-col items-center gap-2">
            <i class="fas fa-inbox text-3xl" :class="isDark ? 'text-slate-600' : 'text-slate-300'"></i>
            <p class="text-[11px] font-semibold uppercase tracking-wide"
              :class="isDark ? 'text-slate-500' : 'text-slate-400'">Sin ejecuciones registradas</p>
          </div>
        </div>

        <div v-else class="flex-1 overflow-y-auto overflow-x-auto">
          <table class="w-full border-separate border-spacing-0">
            <thead class="sticky top-0 z-10">
              <tr class="bg-[#334155]">
                <th class="px-4 py-2 text-left text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Inicio</th>
                <th class="px-4 py-2 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Estado</th>
                <th class="px-4 py-2 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Origen</th>
                <th class="px-4 py-2 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Pendientes</th>
                <th class="px-4 py-2 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Correos</th>
                <th class="px-4 py-2 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Duración</th>
                <th class="px-4 py-2 text-left text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Error</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(log, idx) in historial" :key="log.id"
                :class="[idx % 2 !== 0 ? (isDark ? 'bg-white/[0.03]' : 'bg-slate-50') : 'bg-transparent']">
                <td class="px-4 py-2 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <span class="text-[10px] font-medium" :class="isDark ? 'text-slate-300' : 'text-slate-700'">
                    {{ formatFecha(log.inicio) }}
                  </span>
                </td>
                <td class="px-4 py-2 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-semibold uppercase"
                    :class="log.estado === 'success'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : log.estado === 'error'
                        ? 'bg-red-500/10 text-red-400'
                        : log.estado === 'running'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-slate-500/10 text-slate-400'">
                    <i :class="log.estado === 'success' ? 'fas fa-check'
                      : log.estado === 'error' ? 'fas fa-xmark'
                      : log.estado === 'running' ? 'fas fa-circle-notch fa-spin'
                      : 'fas fa-minus'"></i>
                    {{ log.estado }}
                  </span>
                </td>
                <td class="px-4 py-2 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <span class="text-[9px] font-medium uppercase"
                    :class="isDark ? 'text-slate-500' : 'text-slate-400'">{{ log.origen }}</span>
                </td>
                <td class="px-4 py-2 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <span class="text-[12px] font-bold"
                    :class="(log.pendientes_encontrados ?? 0) > 0 ? 'text-amber-400' : (isDark ? 'text-slate-500' : 'text-slate-400')">
                    {{ log.pendientes_encontrados ?? '—' }}
                  </span>
                </td>
                <td class="px-4 py-2 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <span class="text-[12px] font-bold"
                    :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                    {{ log.correos_enviados ?? '—' }}
                  </span>
                </td>
                <td class="px-4 py-2 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <span class="text-[10px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                    {{ formatDuracion(log.duracion_seg) }}
                  </span>
                </td>
                <td class="px-4 py-2 border-b max-w-[200px]" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <p v-if="log.error" class="text-[10px] text-red-400 line-clamp-2">{{ log.error }}</p>
                  <span v-else class="text-[10px] opacity-30" :class="isDark ? 'text-slate-400' : 'text-slate-500'">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="px-4 py-1.5 border-t shrink-0" :class="isDark ? 'border-[#222938] bg-[#161B26]' : 'border-slate-100 bg-slate-50'">
          <p class="text-[9px] font-semibold uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            Últimas <span class="text-amber-400">{{ historial.length }}</span> ejecuciones
          </p>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <teleport to="body">
      <transition name="fade-toast">
        <div v-if="toast.visible"
          class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2.5 px-4 py-2.5 rounded-lg border shadow-2xl"
          style="background:#111;border-color:rgba(255,255,255,0.1);min-width:220px;max-width:360px;">
          <span class="w-1.5 h-1.5 rounded-full shrink-0"
            :class="toast.error ? 'bg-red-400' : 'bg-emerald-400'"></span>
          <p class="text-[12px] font-medium text-white flex-1">{{ toast.msg }}</p>
          <button @click="toast.visible = false" class="text-white/30 hover:text-white/70 transition-colors shrink-0">
            <i class="fas fa-times text-[9px]"></i>
          </button>
        </div>
      </transition>
    </teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({ isDark: Boolean });

const API = `${import.meta.env.VITE_API_URL}/offboarding/cron`;

// ── Estado ────────────────────────────────────────────────────────────────────
const config = ref(null);
const historial = ref([]);
const loading = ref(false);
const guardando = ref(false);
const ejecutando = ref(false);
const errorConfig = ref('');
const guardadoOk = ref(false);

// ── Formulario local ──────────────────────────────────────────────────────────
const formActivo = ref(true);
const formHora = ref(8);
const formMinuto = ref(0);
const formHorasEspera = ref(24);
const correosLista = ref([]);
const nuevoCorreo = ref('');

// ── Toast ─────────────────────────────────────────────────────────────────────
const toast = ref({ visible: false, msg: '', error: false });
let _toastTimer = null;
function mostrarToast(msg, error = false) {
  clearTimeout(_toastTimer);
  toast.value = { visible: true, msg, error };
  _toastTimer = setTimeout(() => { toast.value.visible = false; }, 3500);
}

// ── Computed ──────────────────────────────────────────────────────────────────
const estadoLabel = computed(() => {
  const e = config.value?.ultimo_estado;
  if (e === 'running') return 'Ejecutando';
  if (e === 'success') return 'Completado';
  if (e === 'error') return 'Error';
  return config.value?.activo ? 'Inactivo' : 'Desactivado';
});

const estadoBadgeClass = computed(() => {
  const e = config.value?.ultimo_estado;
  if (e === 'running') return 'bg-blue-400 animate-pulse';
  if (e === 'success') return 'bg-emerald-400';
  if (e === 'error') return 'bg-red-400';
  return 'bg-slate-400';
});

const duracionLabel = computed(() => {
  const h = formHorasEspera.value;
  if (!h) return '—';
  if (h < 24) return `${h} hora${h > 1 ? 's' : ''}`;
  const dias = Math.floor(h / 24);
  const resto = h % 24;
  return resto > 0 ? `${dias}d ${resto}h` : `${dias} día${dias > 1 ? 's' : ''}`;
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatFecha = (f) => {
  if (!f) return '—';
  return new Date(f).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
};
const formatDuracion = (seg) => {
  if (seg == null) return '—';
  if (seg < 60) return `${seg}s`;
  return `${Math.floor(seg / 60)}m ${seg % 60}s`;
};

// ── Sincronizar form desde config ─────────────────────────────────────────────
function syncForm(cfg) {
  if (!cfg) return;
  formActivo.value = !!cfg.activo;
  formHora.value = cfg.hora ?? 8;
  formMinuto.value = cfg.minuto ?? 0;
  formHorasEspera.value = cfg.horas_espera ?? 24;
  correosLista.value = (cfg.correos ?? '')
    .split(',')
    .map(c => c.trim())
    .filter(c => c.length > 0);
}

// ── Carga inicial ─────────────────────────────────────────────────────────────
async function cargarConfig() {
  try {
    const res = await fetch(`${API}/config`);
    config.value = await res.json();
    syncForm(config.value);
  } catch (e) {
    console.error('Error cargando config offboarding:', e);
  }
}

async function cargarHistorial() {
  try {
    const res = await fetch(`${API}/historial?limit=20`);
    historial.value = await res.json();
  } catch { /* silencioso */ }
}

onMounted(async () => {
  await Promise.all([cargarConfig(), cargarHistorial()]);
});

// ── Correos ───────────────────────────────────────────────────────────────────
function agregarCorreo() {
  const c = nuevoCorreo.value.trim().toLowerCase();
  if (!c || !c.includes('@')) return;
  if (!correosLista.value.includes(c)) {
    correosLista.value.push(c);
  }
  nuevoCorreo.value = '';
}

function quitarCorreo(idx) {
  correosLista.value.splice(idx, 1);
}

function toggleActivo() {
  formActivo.value = !formActivo.value;
}

// ── Guardar configuración ─────────────────────────────────────────────────────
async function guardar() {
  errorConfig.value = '';
  const hora = Math.max(0, Math.min(23, formHora.value));
  const minuto = Math.max(0, Math.min(59, formMinuto.value));
  const horas_espera = Math.max(1, formHorasEspera.value);

  guardando.value = true;
  try {
    const res = await fetch(`${API}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hora,
        minuto,
        horas_espera,
        correos: correosLista.value.join(','),
        activo: formActivo.value,
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    config.value = await res.json();
    syncForm(config.value);
    guardadoOk.value = true;
    mostrarToast('Configuración guardada correctamente');
    setTimeout(() => { guardadoOk.value = false; }, 3000);
  } catch (e) {
    errorConfig.value = e.message || 'Error al guardar';
    mostrarToast('Error al guardar la configuración', true);
  } finally {
    guardando.value = false;
  }
}

// ── Ejecutar manualmente ──────────────────────────────────────────────────────
async function ejecutarAhora() {
  ejecutando.value = true;
  try {
    const res = await fetch(`${API}/ejecutar`, { method: 'POST' });
    const log = await res.json();
    if (!res.ok) throw new Error(log.message || 'Error al ejecutar');
    await cargarConfig();
    await cargarHistorial();
    const n = log.pendientes_encontrados ?? 0;
    if (n === 0) {
      mostrarToast('No hay procesos de offboarding incompletos en la BD', true);
    } else {
      mostrarToast(`✅ Revisión completada: ${n} proceso(s) encontrado(s), correo enviado`);
    }
  } catch (e) {
    mostrarToast(e.message || 'Error al ejecutar', true);
    await cargarConfig();
    await cargarHistorial();
  } finally {
    ejecutando.value = false;
  }
}
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-toast-enter-active, .fade-toast-leave-active { transition: all 0.2s ease; }
.fade-toast-enter-from, .fade-toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }
</style>
