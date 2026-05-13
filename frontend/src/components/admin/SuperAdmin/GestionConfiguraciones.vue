<template>
  <div class="h-full flex flex-col gap-2 animate-fade-in">

    <!-- HEADER minimalista -->
    <div class="flex items-center justify-between px-3 py-2 rounded-lg border shrink-0"
      :class="isDark ? 'bg-white/4 border-white/8' : 'bg-slate-50 border-slate-200'">
      <div class="flex items-center gap-2">
        <i class="fas fa-sliders text-[11px]" :class="isDark ? 'text-orange-400' : 'text-orange-500'"></i>
        <span class="text-[10px] font-black uppercase tracking-wider" :class="isDark ? 'text-white/70' : 'text-slate-700'">Configuración</span>
        <span class="text-[8px] font-mono px-1.5 py-0.5 rounded border" :class="isDark ? 'bg-white/5 border-white/8 text-orange-400' : 'bg-white border-slate-200 text-orange-500'">v{{ appVersion }}</span>
      </div>
      <div class="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[8px] font-bold uppercase tracking-widest transition-all duration-300"
        :class="mantenimiento.enabled
          ? 'border-rose-500/30 bg-rose-500/8 text-rose-400'
          : (isDark ? 'border-emerald-500/20 bg-emerald-500/6 text-emerald-400' : 'border-emerald-300 bg-emerald-50 text-emerald-600')">
        <div class="w-1.5 h-1.5 rounded-full" :class="mantenimiento.enabled ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'"></div>
        {{ mantenimiento.enabled ? 'Mantenimiento' : 'Operativo' }}
      </div>
    </div>

    <!-- GRID principal -->
    <div class="flex-1 min-h-0 grid grid-cols-[1.2fr_0.8fr] gap-2">

      <!-- ─ COL IZQUIERDA ─────────────────────────────────────────────────── -->
      <div class="flex flex-col gap-2 min-h-0 overflow-y-auto">

        <!-- 01 · MANTENIMIENTO IIS -->
        <div class="rounded-lg border overflow-hidden transition-all duration-300"
          :class="mantenimiento.enabled
            ? (isDark ? 'border-rose-500/40' : 'border-rose-400')
            : (isDark ? 'border-white/8' : 'border-slate-200')">

          <!-- row header -->
          <div class="flex items-center gap-2 px-3 py-2 border-b"
            :class="mantenimiento.enabled
              ? (isDark ? 'bg-rose-950/60 border-rose-500/20' : 'bg-rose-600 border-rose-500')
              : (isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-200')">
            <i class="fas fa-hard-hat text-[9px]"
              :class="mantenimiento.enabled ? 'text-rose-300' : (isDark ? 'text-white/30' : 'text-slate-400')"></i>
            <span class="text-[9px] font-bold uppercase tracking-wide flex-1"
              :class="mantenimiento.enabled ? 'text-rose-200' : (isDark ? 'text-white/40' : 'text-slate-600')">Modo mantenimiento IIS</span>
            <span class="text-[7px] font-black uppercase px-1.5 py-0.5 rounded border"
              :class="mantenimiento.enabled
                ? 'text-rose-300 border-rose-500/30 bg-rose-500/15'
                : (isDark ? 'text-white/20 border-white/8 bg-white/3' : 'text-slate-400 border-slate-200 bg-white')">
              {{ mantenimiento.enabled ? '⚠ ACTIVO' : 'inactivo' }}
            </span>
          </div>

          <!-- row body: una sola fila compacta -->
          <div class="px-3 py-2.5 flex items-center gap-3" :class="isDark ? 'bg-[#111c2b]' : 'bg-white'">
            <div v-if="!mantenimiento.configured" class="flex-1 text-[9px] flex items-center gap-1.5"
              :class="isDark ? 'text-amber-400' : 'text-amber-600'">
              <i class="fas fa-triangle-exclamation shrink-0"></i>
              <span>WEBCONFIG_PATH no configurado en <code class="font-mono">.env</code></span>
            </div>
            <template v-if="mantenimiento.configured">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
                :class="mantenimiento.enabled ? 'bg-rose-500/15' : (isDark ? 'bg-emerald-500/10' : 'bg-emerald-50')">
                <i :class="['text-[11px]', mantenimiento.enabled ? 'fas fa-lock text-rose-400' : 'fas fa-earth-americas text-emerald-500']"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[10px] font-bold" :class="mantenimiento.enabled ? 'text-rose-400' : (isDark ? 'text-emerald-400' : 'text-emerald-600')">
                  {{ mantenimiento.enabled ? 'Sitio en mantenimiento' : 'Sitio operativo' }}
                </p>
                <p class="text-[8px] opacity-40 truncate" :class="isDark ? 'text-white' : 'text-slate-500'">
                  {{ mantenimiento.enabled ? 'Usuarios redirigidos a mantenimiento.html' : 'Todos acceden normalmente' }}
                </p>
              </div>
              <button @click="toggleMantenimiento" :disabled="mantenimiento.saving"
                class="relative w-10 h-5 rounded-full transition-all duration-300 shrink-0 disabled:opacity-40 focus:outline-none"
                :class="mantenimiento.enabled ? 'bg-rose-500 shadow shadow-rose-500/40' : (isDark ? 'bg-white/15' : 'bg-slate-300')">
                <span v-if="mantenimiento.saving" class="absolute inset-0 flex items-center justify-center">
                  <i class="fas fa-circle-notch fa-spin text-white text-[8px]"></i>
                </span>
                <span v-else class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
                  :class="mantenimiento.enabled ? 'left-[22px]' : 'left-0.5'"></span>
              </button>
            </template>
          </div>
        </div>

        <!-- 02 · ALMACENAMIENTO -->
        <div class="rounded-lg border overflow-hidden" :class="isDark ? 'border-white/8' : 'border-slate-200'">
          <div class="flex items-center gap-2 px-3 py-2 border-b"
            :class="isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-200'">
            <i class="fas fa-database text-[9px]" :class="isDark ? 'text-white/30' : 'text-slate-400'"></i>
            <span class="text-[9px] font-bold uppercase tracking-wide flex-1"
              :class="isDark ? 'text-white/40' : 'text-slate-600'">Almacenamiento de soportes</span>
          </div>
          <div class="px-3 py-2.5 flex items-center gap-2" :class="isDark ? 'bg-[#111c2b]' : 'bg-white'">
            <button v-for="opt in [{v:'local',icon:'fas fa-hard-drive',l:'Local'},{v:'s3',icon:'fab fa-aws',l:'S3'}]"
              :key="opt.v" @click="config.storage_mode = opt.v"
              class="flex items-center gap-1.5 h-7 px-3 rounded-lg border text-[9px] font-bold transition-all"
              :class="config.storage_mode === opt.v
                ? 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                : (isDark ? 'border-white/8 bg-white/3 text-white/25 hover:border-white/15' : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300')">
              <i :class="opt.icon + ' text-[9px]'"></i> {{ opt.l }}
              <i v-if="config.storage_mode === opt.v" class="fas fa-check text-[8px] ml-0.5"></i>
            </button>
            <span v-if="config.storage_mode === 's3'" class="text-[8px] ml-1 opacity-40" :class="isDark ? 'text-amber-400' : 'text-amber-600'">
              <i class="fas fa-circle-info"></i> Credenciales en .env
            </span>
          </div>
        </div>

        <!-- 04 · PROGRAMACIÓN CARGUE MALLAS -->
        <div class="rounded-lg border overflow-hidden flex-1" :class="isDark ? 'border-white/8' : 'border-slate-200'">
          <div class="flex items-center gap-2 px-3 py-2 border-b"
            :class="isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-200'">
            <i class="fas fa-calendar-check text-[9px]" :class="isDark ? 'text-white/30' : 'text-slate-400'"></i>
            <span class="text-[9px] font-bold uppercase tracking-wide flex-1"
              :class="isDark ? 'text-white/40' : 'text-slate-600'">Ventana cargue mallas</span>
            <button @click="config.mallas_schedule_enabled = config.mallas_schedule_enabled === 'true' ? 'false' : 'true'"
              class="relative w-8 h-4 rounded-full transition-all duration-300 focus:outline-none"
              :class="config.mallas_schedule_enabled === 'true' ? 'bg-indigo-500' : (isDark ? 'bg-white/15' : 'bg-slate-300')">
              <span class="absolute top-[2px] w-3 h-3 rounded-full bg-white shadow transition-all duration-300"
                :class="config.mallas_schedule_enabled === 'true' ? 'left-[18px]' : 'left-[2px]'"></span>
            </button>
          </div>

          <div class="px-3 py-2.5 space-y-2.5" :class="isDark ? 'bg-[#111c2b]' : 'bg-white'">
            <!-- Off -->
            <p v-if="config.mallas_schedule_enabled !== 'true'" class="text-[9px]"
              :class="isDark ? 'text-white/25' : 'text-slate-400'">
              <i class="fas fa-unlock mr-1 text-emerald-400"></i>Siempre abierto. Activa para programar ventanas.
            </p>

            <template v-if="config.mallas_schedule_enabled === 'true'">
              <!-- Modo -->
              <div class="flex gap-1.5">
                <button v-for="m in SCHEDULE_MODES" :key="m.value"
                  @click="config.mallas_schedule_mode = m.value"
                  class="flex items-center gap-1 h-6 px-2.5 rounded-lg border text-[8px] font-bold uppercase transition-all"
                  :class="config.mallas_schedule_mode === m.value
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                    : (isDark ? 'border-white/8 bg-white/3 text-white/25 hover:border-white/15' : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300')">
                  <i :class="m.icon + ' text-[8px]'"></i>{{ m.label }}
                </button>
              </div>

              <!-- Días semana -->
              <div v-if="config.mallas_schedule_mode === 'weekly'" class="flex gap-1">
                <button v-for="d in DIAS_SEMANA" :key="d.v"
                  @click="toggleScheduleDay('weekly', d.v)"
                  class="flex-1 h-8 rounded-lg border text-[8px] font-black transition-all flex flex-col items-center justify-center"
                  :class="scheduleWeeklyDays.includes(d.v)
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400'
                    : (isDark ? 'border-white/8 bg-white/3 text-white/20 hover:border-white/20' : 'border-slate-200 bg-slate-50 text-slate-300 hover:text-slate-500')">
                  <span class="text-[9px] font-black">{{ d.l }}</span>
                  <span class="text-[6px] opacity-50">{{ d.s }}</span>
                </button>
              </div>

              <!-- Días mes -->
              <div v-if="config.mallas_schedule_mode === 'monthly'" class="flex flex-wrap gap-1">
                <button v-for="n in 31" :key="n"
                  @click="toggleScheduleDay('monthly', n)"
                  class="w-6 h-6 rounded text-[8px] font-bold transition-all border"
                  :class="scheduleMonthlyDays.includes(n)
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400'
                    : (isDark ? 'border-white/8 bg-white/3 text-white/20 hover:border-white/15' : 'border-slate-200 bg-white text-slate-300 hover:text-slate-500')">
                  {{ n }}
                </button>
                <p class="w-full text-[7px] mt-0.5 opacity-25" :class="isDark ? 'text-white' : 'text-slate-500'">Ej: 14, 15, 30 = mitad y fin de mes</p>
              </div>

              <!-- Próximas fechas -->
              <div v-if="proximasFechas.length" class="flex flex-wrap gap-1">
                <span class="text-[7px] w-full font-black uppercase tracking-widest opacity-30 mb-0.5" :class="isDark ? 'text-white' : 'text-slate-500'">próximas fechas</span>
                <span v-for="f in proximasFechas" :key="f"
                  class="px-1.5 py-0.5 rounded text-[7px] font-semibold"
                  :class="isDark ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-600'">{{ f }}</span>
              </div>
            </template>
          </div>
        </div>

      </div>

      <!-- ─ COL DERECHA: MÓDULOS ──────────────────────────────────────────── -->
      <div class="rounded-lg border overflow-hidden flex flex-col" :class="isDark ? 'border-white/8' : 'border-slate-200'">

        <div class="flex items-center gap-2 px-3 py-2 border-b shrink-0"
          :class="isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-200'">
          <i class="fas fa-layer-group text-[9px]" :class="isDark ? 'text-white/30' : 'text-slate-400'"></i>
          <span class="text-[9px] font-bold uppercase tracking-wide flex-1"
            :class="isDark ? 'text-white/40' : 'text-slate-600'">Módulos</span>
          <span class="text-[7px] font-black px-1.5 py-0.5 rounded border"
            :class="isDark ? 'bg-emerald-500/8 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'">
            {{ modulos.filter(m => isActive(m.key)).length }}/{{ modulos.length }}
          </span>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto divide-y"
          :class="isDark ? 'bg-[#111c2b] divide-white/[0.04]' : 'bg-white divide-slate-100'">
          <div v-for="mod in modulos" :key="mod.key" class="px-3 py-2.5">
            <div class="flex items-center gap-2">
              <div class="relative shrink-0">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  :class="isActive(mod.key)
                    ? (isDark ? 'bg-emerald-500/12 text-emerald-400' : 'bg-emerald-100 text-emerald-600')
                    : (isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-100 text-rose-500')">
                  <i :class="mod.icon + ' text-[10px]'"></i>
                </div>
                <div class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border"
                  :class="[isActive(mod.key) ? 'bg-emerald-400' : 'bg-slate-400', isDark ? 'border-[#111c2b]' : 'border-white']"></div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[10px] font-bold truncate" :class="isDark ? 'text-white/80' : 'text-slate-800'">{{ mod.label }}</p>
                <p class="text-[8px] opacity-30 truncate" :class="isDark ? 'text-white' : 'text-slate-500'">{{ mod.desc }}</p>
              </div>
              <button @click="toggleModulo(mod.key)"
                class="relative w-9 h-5 rounded-full transition-all duration-300 shrink-0 focus:outline-none"
                :class="isActive(mod.key) ? 'bg-emerald-500' : (isDark ? 'bg-white/12' : 'bg-slate-300')">
                <span class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
                  :class="isActive(mod.key) ? 'left-[18px]' : 'left-0.5'"></span>
              </button>
            </div>
            <Transition name="slide">
              <input v-if="!isActive(mod.key)" v-model="config[mod.key + '_message']" type="text"
                placeholder="Mensaje al usuario…"
                class="mt-2 ml-9 w-[calc(100%-2.25rem)] h-6 px-2 rounded border text-[9px] outline-none"
                :class="isDark ? 'bg-white/4 border-white/8 text-white placeholder-white/20 focus:border-indigo-500/50' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-indigo-300'" />
            </Transition>
          </div>
        </div>

        <div class="flex items-center justify-between gap-2 px-3 py-2 border-t shrink-0"
          :class="isDark ? 'bg-[#0a1119] border-white/5' : 'bg-slate-800 border-slate-700'">
          <p class="text-[8px] text-white/25">Mantenimiento IIS se aplica al instante</p>
          <button @click="guardar" :disabled="saving"
            class="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all active:scale-95 disabled:opacity-50"
            style="background:linear-gradient(135deg,#FF8F00,#f59e0b);color:#000">
            <i :class="saving ? 'fas fa-circle-notch fa-spin' : 'fas fa-floppy-disk'" class="text-[9px]"></i>
            {{ saving ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';

const props = defineProps({ isDark: Boolean });
const emit = defineEmits(['success', 'error']);

const SCHEDULE_MODES = [
  { value: 'free',    label: 'Libre',    icon: 'fas fa-unlock' },
  { value: 'weekly',  label: 'Semanal',  icon: 'fas fa-calendar-week' },
  { value: 'monthly', label: 'Mensual',  icon: 'fas fa-calendar-days' },
];
const DIAS_SEMANA = [
  { v: 0, l: 'D', s: 'Dom' }, { v: 1, l: 'L', s: 'Lun' }, { v: 2, l: 'M', s: 'Mar' },
  { v: 3, l: 'X', s: 'Mié' }, { v: 4, l: 'J', s: 'Jue' }, { v: 5, l: 'V', s: 'Vie' },
  { v: 6, l: 'S', s: 'Sáb' },
];

const API_URL = import.meta.env.VITE_API_URL;
const API_BASE = API_URL.replace('/usuarios', '');

const saving = ref(false);
const appVersion = ref('—');

// ── Mantenimiento del sitio ──────────────────────────────────────────────────
const mantenimiento = reactive({ enabled: false, configured: false, saving: false });

const cargarMantenimiento = async () => {
  try {
    const [resM, resV] = await Promise.all([
      fetch(`${API_BASE}/mantenimiento`),
      fetch(`${API_BASE}/version?t=${Date.now()}`),
    ]);
    if (resM.ok) {
      const d = await resM.json();
      mantenimiento.enabled = d.enabled;
      mantenimiento.configured = d.configured;
    }
    if (resV.ok) {
      const d = await resV.json();
      appVersion.value = d.version ?? '—';
    }
  } catch { /* silencioso */ }
};

const toggleMantenimiento = async () => {
  mantenimiento.saving = true;
  const nuevoEstado = !mantenimiento.enabled;
  try {
    const res = await fetch(`${API_BASE}/mantenimiento`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: nuevoEstado }),
    });
    const data = await res.json();
    if (data.ok) {
      mantenimiento.enabled = nuevoEstado;
      emit('success', nuevoEstado ? '⚠ Mantenimiento activado' : '✓ Sitio restaurado');
    } else {
      emit('error', data.message || 'No se pudo cambiar el estado');
    }
  } catch {
    emit('error', 'Error al comunicarse con el servidor');
  } finally {
    mantenimiento.saving = false;
  }
};

// ── Módulos y almacenamiento ─────────────────────────────────────────────────
const config = reactive({
  storage_mode: 'local',
  module_asistencias_active: 'true',
  module_asistencias_message: 'Módulo en mantenimiento. Vuelve pronto.',
  module_mallas_active: 'true',
  module_mallas_message: 'Módulo en mantenimiento. Vuelve pronto.',
  module_novedades_active: 'true',
  module_novedades_message: 'Módulo en mantenimiento. Vuelve pronto.',
  mallas_schedule_enabled: 'false',
  mallas_schedule_mode: 'free',
  mallas_schedule_weekly_days: '[]',
  mallas_schedule_monthly_days: '[]',
});

// ── Helpers de schedule ───────────────────────────────────────────────────────
const scheduleWeeklyDays  = computed(() => { try { return JSON.parse(config.mallas_schedule_weekly_days || '[]'); } catch { return []; } });
const scheduleMonthlyDays = computed(() => { try { return JSON.parse(config.mallas_schedule_monthly_days || '[]'); } catch { return []; } });

const toggleScheduleDay = (type, val) => {
  const key = type === 'weekly' ? 'mallas_schedule_weekly_days' : 'mallas_schedule_monthly_days';
  const arr = type === 'weekly' ? [...scheduleWeeklyDays.value] : [...scheduleMonthlyDays.value];
  const idx = arr.indexOf(val);
  if (idx === -1) arr.push(val);
  else arr.splice(idx, 1);
  arr.sort((a, b) => a - b);
  config[key] = JSON.stringify(arr);
};

const proximasFechas = computed(() => {
  if (config.mallas_schedule_enabled !== 'true') return [];
  const hoy = new Date();
  const resultados = [];
  for (let i = 0; i <= 90 && resultados.length < 5; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    let ok = false;
    if (config.mallas_schedule_mode === 'weekly') {
      ok = scheduleWeeklyDays.value.includes(d.getDay());
    } else if (config.mallas_schedule_mode === 'monthly') {
      ok = scheduleMonthlyDays.value.includes(d.getDate());
    } else if (config.mallas_schedule_mode === 'free') {
      break;
    }
    if (ok) resultados.push(d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }));
  }
  return resultados;
});

const modulos = [
  { key: 'module_asistencias', label: 'Asistencias',   icon: 'fas fa-chart-line',       desc: 'Control de asistencia y marcación' },
  { key: 'module_mallas',      label: 'Cargue Mallas', icon: 'fas fa-cloud-arrow-up',    desc: 'Programación y cargue de turnos' },
  { key: 'module_novedades',   label: 'Novedades',     icon: 'fas fa-file-circle-plus',  desc: 'Registro y gestión de novedades' },
];

const isActive = (key) => config[key + '_active'] === 'true';
const toggleModulo = (key) => {
  config[key + '_active'] = isActive(key) ? 'false' : 'true';
};

const cargar = async () => {
  try {
    const res = await fetch(`${API_URL}/sistema-config`);
    if (!res.ok) return;
    const data = await res.json();
    Object.assign(config, data);
  } catch { /* silencioso */ }
};

const guardar = async () => {
  saving.value = true;
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const res = await fetch(`${API_URL}/sistema-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates: { ...config }, updatedBy: session.name || 'SuperAdmin' }),
    });
    if (!res.ok) throw new Error();
    emit('success', 'Configuración guardada');
  } catch {
    emit('error', 'Error al guardar la configuración');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  cargar();
  cargarMantenimiento();
});
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
