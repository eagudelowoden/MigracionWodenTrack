<template>
  <div class="space-y-5 overflow-y-auto pr-1" style="max-height: calc(100vh - 150px);">
    <!-- Header -->
    <div class="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <h2 class="text-lg font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">
          Resumen Nocturno de Asistencia
        </h2>
        <p class="text-[12px] mt-0.5" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Un proceso aparte (worker) cruza malla + asistencia + novedades y guarda el resultado en
          <code>asistencia_diaria_resumen</code>. El Dashboard de Asistencia solo consulta esa tabla.
        </p>
      </div>
      <div class="flex items-end gap-2 flex-wrap">
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-bold uppercase tracking-wide"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Empresa</label>
          <Select v-model="empresaSel" :options="opcionesEmpresa" optionLabel="label" optionValue="value"
            inputClass="!h-8 !text-[12px]" class="w-52" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-bold uppercase tracking-wide"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Desde (opcional)</label>
          <DatePicker v-model="rangoDesde" dateFormat="dd/mm/yy" showIcon iconDisplay="input" showButtonBar
            inputClass="!h-8 !text-[12px]" class="w-36" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-bold uppercase tracking-wide"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Hasta (opcional)</label>
          <DatePicker v-model="rangoHasta" dateFormat="dd/mm/yy" showIcon iconDisplay="input" showButtonBar
            inputClass="!h-8 !text-[12px]" class="w-36" />
        </div>
        <Button @click="ejecutarAhora" :disabled="ejecutando || procesando" :loading="ejecutando || procesando"
          :label="procesando ? 'Procesando…' : (ejecutando ? 'Iniciando…' : 'Ejecutar ahora')"
          icon="pi pi-play" class="!h-8 !px-4 !text-[12px]" />
      </div>
    </div>
    <p class="text-[11px] -mt-3" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
      Si dejas las fechas vacías, recalcula los últimos {{ config?.dias_ventana ?? 2 }} días. Para cargar un
      histórico (ej. 2-3 meses) para que el dashboard tenga datos, elige el rango y dale "Ejecutar ahora".
      El worker corre aparte: no bloquea la API mientras procesa.
    </p>

    <!-- Config -->
    <div v-if="config" class="rounded-2xl border shadow-sm p-5 space-y-4"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

      <!-- Activo -->
      <label class="flex items-center justify-between cursor-pointer">
        <div>
          <div class="text-[13px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">
            Cron activo
          </div>
          <div class="text-[11px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            Si está activo, corre automáticamente <strong>una vez al día</strong> a la hora configurada.
          </div>
        </div>
        <ToggleSwitch v-model="config.activo" />
      </label>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <!-- Empresa del cron -->
        <div class="col-span-2 sm:col-span-1 flex flex-col gap-1">
          <label class="text-[11px] font-medium" :class="isDark ? 'text-slate-300' : 'text-slate-600'">Empresa del cron</label>
          <Select v-model="empresaSel" :options="opcionesEmpresa" optionLabel="label" optionValue="value"
            inputClass="!h-9 !text-[12px]" class="w-full" />
        </div>
        <!-- Hora -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-medium" :class="isDark ? 'text-slate-300' : 'text-slate-600'">Hora
            (0-23)</label>
          <InputNumber v-model="config.hora" :min="0" :max="23" showButtons buttonLayout="horizontal"
            inputClass="!h-9 !text-[13px]" class="w-full" />
        </div>
        <!-- Minuto -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-medium" :class="isDark ? 'text-slate-300' : 'text-slate-600'">Minuto
            (0-59)</label>
          <InputNumber v-model="config.minuto" :min="0" :max="59" showButtons buttonLayout="horizontal"
            inputClass="!h-9 !text-[13px]" class="w-full" />
        </div>
        <!-- Ventana -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-medium" :class="isDark ? 'text-slate-300' : 'text-slate-600'">Días a
            recalcular</label>
          <InputNumber v-model="config.dias_ventana" :min="1" :max="60" :disabled="usaRangoFijo" showButtons buttonLayout="horizontal"
            inputClass="!h-9 !text-[13px]" class="w-full" />
        </div>
      </div>

      <!-- Rango fijo: si se define, el cron automático recalcula SIEMPRE ese rango exacto, en vez de "últimos N días" -->
      <div class="rounded-lg p-3 border space-y-2"
        :class="isDark ? 'bg-[#0B0F19] border-[#222938]' : 'bg-slate-50 border-slate-200'">
        <label class="flex items-center gap-2 cursor-pointer">
          <Checkbox v-model="usaRangoFijo" binary />
          <span class="text-[12px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">
            Usar un rango de fechas fijo para el cron automático
          </span>
        </label>
        <p class="text-[11px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          En vez de "últimos N días", cada corrida automática recalculará siempre este mismo rango exacto
          (útil para reforzar un histórico puntual mientras se corrige un dato).
        </p>
        <div v-if="usaRangoFijo" class="flex flex-wrap items-end gap-3 pt-1">
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold uppercase tracking-wide"
              :class="isDark ? 'text-slate-400' : 'text-slate-500'">Desde</label>
            <DatePicker v-model="rangoFijoDesde" dateFormat="dd/mm/yy" showIcon iconDisplay="input"
              inputClass="!h-8 !text-[12px]" class="w-36" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold uppercase tracking-wide"
              :class="isDark ? 'text-slate-400' : 'text-slate-500'">Hasta</label>
            <DatePicker v-model="rangoFijoHasta" dateFormat="dd/mm/yy" showIcon iconDisplay="input"
              inputClass="!h-8 !text-[12px]" class="w-36" />
          </div>
        </div>
      </div>

      <div class="rounded-lg px-3 py-2.5 text-[12px] border"
        :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'">
        <div>
          <i class="fas fa-building mr-1.5 text-[#3B82F6]"></i>
          Empresa del cron:
          <strong :class="isDark ? 'text-white' : 'text-slate-900'">{{ empresaSel === 'Todas' ? 'Todas las empresas' :
            empresaSel }}</strong>
          <span class="opacity-60">(la que elijas arriba y guardes)</span>
        </div>
        <div v-if="usaRangoFijo" class="mt-1">
          <i class="fas fa-calendar-day mr-1.5 text-[#3B82F6]"></i>
          Cada corrida recalcula siempre el rango fijo:
          <strong :class="isDark ? 'text-white' : 'text-slate-900'">{{ formatFechaCorta(rangoFijoDesde) }}</strong>
          →
          <strong :class="isDark ? 'text-white' : 'text-slate-900'">{{ formatFechaCorta(rangoFijoHasta) }}</strong>
        </div>
        <div v-else class="mt-1">
          <i class="fas fa-calendar-day mr-1.5 text-[#3B82F6]"></i>
          Cada corrida recalcula los últimos <strong>{{ config.dias_ventana }} días</strong>:
          <strong :class="isDark ? 'text-white' : 'text-slate-900'">{{ rangoCron.desde }}</strong>
          →
          <strong :class="isDark ? 'text-white' : 'text-slate-900'">{{ rangoCron.hasta }}</strong>
        </div>
        <div class="mt-1">
          <i class="fas fa-clock mr-1.5 text-[#3B82F6]"></i>
          Corre <strong>una vez al día</strong> a las {{ String(config.hora).padStart(2, '0') }}:{{ String(config.minuto).padStart(2, '0') }} (hora Colombia).
        </div>
        <div class="mt-1 opacity-70">
          Nota: las fechas <em>Desde/Hasta</em> de arriba son solo para "Ejecutar ahora" (manual),
          no para el cron automático.
        </div>
      </div>

      <div class="flex items-center justify-between flex-wrap gap-3 pt-2">
        <div class="text-[12px] flex items-center gap-3" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          <span>
            <i class="fas fa-clock mr-1.5 text-[#3B82F6]"></i>
            Próxima ejecución:
            <strong :class="isDark ? 'text-slate-200' : 'text-slate-700'">
              {{ config.activo ? formatFecha(config.proximaEjecucion) : 'Desactivado' }}
            </strong>
          </span>
          <span v-if="config.ultima_corrida_fecha">
            <i class="fas fa-check mr-1.5 text-emerald-500"></i>
            Última corrida automática: <strong :class="isDark ? 'text-slate-200' : 'text-slate-700'">{{ config.ultima_corrida_fecha }}</strong>
          </span>
          <span v-if="procesando" class="text-amber-500 font-semibold flex items-center gap-2">
            <i class="fas fa-spinner fa-spin"></i>Procesando ahora…
            <button @click="cancelarCorrida" :disabled="cancelando" type="button"
              class="underline decoration-dotted hover:no-underline disabled:opacity-50">
              {{ cancelando ? 'Cancelando…' : 'Cancelar' }}
            </button>
          </span>
        </div>
        <Button @click="guardar" :loading="guardando" label="Guardar configuración" icon="pi pi-save"
          severity="secondary" outlined class="!h-9 !text-[12px]" />
      </div>
    </div>

    <!-- Historial de corridas: pendiente/procesando/completado/error -->
    <div class="rounded-2xl border shadow-sm overflow-hidden"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <div class="flex items-center justify-between px-5 py-3 border-b"
        :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
        <h3 class="text-[13px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">
          Últimas Ejecuciones
        </h3>
        <Button @click="cargarLogs" icon="pi pi-refresh" :loading="cargandoLogs"
          label="Actualizar" text size="small" class="!text-[11px]" />
      </div>
      <DataTable :value="logs" size="small" scrollable scrollHeight="300px" :class="isDark ? 'p-datatable-dark' : ''">
        <Column field="id" header="#" style="width: 60px" />
        <Column field="tipo" header="Tipo" style="width: 90px">
          <template #body="{ data }">{{ data.tipo === 'cron' ? 'Automático' : 'Manual' }}</template>
        </Column>
        <Column field="company" header="Empresa">
          <template #body="{ data }">{{ data.company || 'Todas' }}</template>
        </Column>
        <Column header="Rango" style="width: 180px">
          <template #body="{ data }">{{ data.rango_desde || '—' }} → {{ data.rango_hasta || '—' }}</template>
        </Column>
        <Column field="estado" header="Estado" style="width: 130px">
          <template #body="{ data }">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold" :class="estadoClass(data.estado)">
              {{ etiquetaEstado(data.estado) }}
            </span>
          </template>
        </Column>
        <Column header="Resultado">
          <template #body="{ data }">
            <span v-if="data.estado === 'completado'">{{ data.total_filas }} filas guardadas</span>
            <span v-else-if="data.estado === 'error'" class="text-red-500" :title="data.error_mensaje">{{ data.error_mensaje }}</span>
            <span v-else>—</span>
          </template>
        </Column>
        <Column header="Creado" style="width: 150px">
          <template #body="{ data }">{{ formatFecha(data.created_at) }}</template>
        </Column>
        <Column header="" style="width: 90px">
          <template #body="{ data }">
            <button v-if="data.estado === 'procesando'" @click="cancelarCorrida" :disabled="cancelando"
              type="button"
              class="px-2 py-0.5 rounded text-[10px] font-semibold transition-all disabled:opacity-40 border border-red-400/40 text-red-400 hover:bg-red-500/10">
              <i class="fas" :class="cancelando ? 'fa-spinner fa-spin' : 'fa-xmark'"></i> Cancelar
            </button>
          </template>
        </Column>
        <template #empty>Sin ejecuciones todavía.</template>
      </DataTable>
    </div>

    <!-- Consola en vivo: cada fase del cálculo (autenticar/consultar Odoo, guardar) apenas ocurre -->
    <div class="rounded-2xl border shadow-sm overflow-hidden"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <div class="flex items-center justify-between px-5 py-3 border-b flex-wrap gap-2"
        :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
        <h3 class="text-[13px] font-semibold flex items-center gap-2" :class="isDark ? 'text-white' : 'text-slate-900'">
          Consola en vivo
          <span v-if="consolaConectada" class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        </h3>
        <div class="text-[11px] flex items-center gap-3" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          <span :title="'Retraso del hilo principal de la API (perf_hooks). >100ms = algo lo está bloqueando.'">
            <i class="fas fa-heart-pulse mr-1" :class="eventLoop.maxMs > 100 ? 'text-red-500' : 'text-emerald-500'"></i>
            Event loop: mean {{ eventLoop.meanMs }}ms / max {{ eventLoop.maxMs }}ms
          </span>
          <button @click="consola = []" type="button" class="underline decoration-dotted hover:no-underline">Limpiar</button>
        </div>
      </div>
      <div ref="consolaEl" class="p-3 font-mono text-[11px] overflow-y-auto space-y-0.5"
        style="max-height: 220px;" :class="isDark ? 'bg-[#0B0F19] text-slate-300' : 'bg-slate-50 text-slate-700'">
        <div v-if="!consola.length" class="opacity-50">
          Sin actividad — se llena en cuanto corra el cron automático o le des "Ejecutar ahora".
        </div>
        <div v-for="(e, i) in consola" :key="i" class="whitespace-pre-wrap">
          <span class="opacity-50">{{ e.hora }}</span> {{ e.icono }} {{ e.texto }}
        </div>
      </div>
    </div>

    <p v-if="mensaje" class="text-[12px] font-medium" :class="mensajeError ? 'text-red-500' : 'text-emerald-500'">
      {{ mensaje }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import ToggleSwitch from 'primevue/toggleswitch';
import Checkbox from 'primevue/checkbox';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

defineProps({ isDark: { type: Boolean, default: true } });

// Este módulo vive en la raíz de la API, no bajo /usuarios (igual que el resto
// de dashboard-asistencia) — pero /companies sí vive bajo /usuarios, por eso
// se guarda también la URL original para esa única llamada.
const API_USUARIOS = import.meta.env.VITE_API_URL || '';
const API = API_USUARIOS.replace('/usuarios', '');
const config = ref(null);
const procesando = ref(false);
const ejecutando = ref(false);
const guardando = ref(false);
const rangoDesde = ref(null);
const rangoHasta = ref(null);
const empresas = ref([]);
const empresaSel = ref('Todas');
const usaRangoFijo = ref(false);
const rangoFijoDesde = ref(null);
const rangoFijoHasta = ref(null);
const cancelando = ref(false);
const logs = ref([]);
const cargandoLogs = ref(false);
let pollTimer = null;
let logsPollTimer = null;

// ── Consola en vivo (SSE vía fetch, no EventSource) + salud del event loop ──
// EventSource nativo no puede mandar el header Authorization — esta API
// exige sesión en casi todas las rutas, así que se lee el stream a mano con
// fetch() (mismo patrón que useCargarAsistencias.js para /reporte-novedades/stream).
function getToken() {
  try {
    const raw = localStorage.getItem('user_session');
    return raw ? (JSON.parse(raw)?.token ?? null) : null;
  } catch { return null; }
}

const consola = ref([]);
const consolaEl = ref(null);
const consolaConectada = ref(false);
const eventLoop = ref({ meanMs: 0, maxMs: 0 });
let streamAbort = null;
let eventLoopTimer = null;

const FASE_TEXTO = {
  'dia-inicio': (d) => `Día ${d.indice}/${d.total} — ${d.fecha}`,
  'odoo-inicio': (d) => `Consultando Odoo (roster + asistencia + novedades) para ${d.fecha}…`,
  'odoo-fin': (d) => `Odoo respondió en ${d.ms}ms — ${d.roster} en roster, ${d.marcaciones} marcaciones (${d.fecha})`,
  'guardando-inicio': (d) => `Guardando en BD (upsert) ${d.filas} filas de ${d.fecha}…`,
  'guardando-fin': (d) => `Guardado listo en ${d.ms}ms (${d.fecha})`,
};
const FASE_ICONO = {
  'dia-inicio': '📅',
  'odoo-inicio': '🌐',
  'odoo-fin': '📥',
  'guardando-inicio': '💾',
  'guardando-fin': '✅',
};

function agregarEventoConsola(evento) {
  const texto = FASE_TEXTO[evento.fase]?.(evento.detalle) ?? `${evento.fase}: ${JSON.stringify(evento.detalle)}`;
  consola.value.push({
    hora: new Date(evento.ts).toLocaleTimeString('es-CO', { hour12: false }),
    icono: FASE_ICONO[evento.fase] ?? '•',
    texto,
  });
  if (consola.value.length > 500) consola.value.shift();
  requestAnimationFrame(() => {
    if (consolaEl.value) consolaEl.value.scrollTop = consolaEl.value.scrollHeight;
  });
}

async function conectarConsola() {
  if (streamAbort) return;
  streamAbort = new AbortController();
  // Reintenta solo mientras el componente siga montado (streamAbort no fue cancelado).
  while (streamAbort && !streamAbort.signal.aborted) {
    try {
      const token = getToken();
      const res = await fetch(`${API}/dashboard-asistencia/resumen-cron/stream`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: streamAbort.signal,
      });
      if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);
      consolaConectada.value = true;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop();
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          try { agregarEventoConsola(JSON.parse(line.slice(6))); } catch { /* línea no parseable */ }
        }
      }
    } catch (e) {
      if (streamAbort?.signal.aborted) break;
    }
    consolaConectada.value = false;
    if (streamAbort && !streamAbort.signal.aborted) {
      await new Promise((r) => setTimeout(r, 3000)); // reconectar tras un corte
    }
  }
}

async function cargarEventLoop() {
  try {
    const { data } = await axios.get(`${API}/dashboard-asistencia/event-loop`);
    eventLoop.value = { meanMs: data.meanMs ?? 0, maxMs: data.maxMs ?? 0 };
  } catch { /* panel opcional, no interrumpe la vista si falla */ }
}

function isoToDate(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatFechaCorta(d) {
  if (!d) return '—';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const opcionesEmpresa = computed(() => [
  { label: 'Todas las empresas', value: 'Todas' },
  ...empresas.value.map((e) => ({ label: e, value: e })),
]);

function dateToISO(d) {
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const rangoCron = computed(() => {
  const dias = Number(config.value?.dias_ventana) || 0;
  const hoyBogota = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }),
  );
  const fmt = (offset) => {
    const d = new Date(hoyBogota);
    d.setDate(d.getDate() - offset);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  return { desde: fmt(dias), hasta: fmt(1) };
});

const mensaje = ref('');
const mensajeError = ref(false);
const flash = (msg, error = false) => {
  mensaje.value = msg;
  mensajeError.value = error;
  setTimeout(() => (mensaje.value = ''), 4000);
};

const formatFecha = (f) => {
  if (!f) return '—';
  try {
    return new Date(f).toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return String(f); }
};

async function cargarConfig() {
  const { data } = await axios.get(`${API}/dashboard-asistencia/resumen-cron/config`);
  config.value = data;
  const seguiaProcesando = procesando.value;
  procesando.value = !!data.procesando;
  if (data?.company) empresaSel.value = data.company;
  usaRangoFijo.value = !!(data.rango_fijo_desde && data.rango_fijo_hasta);
  rangoFijoDesde.value = isoToDate(data.rango_fijo_desde);
  rangoFijoHasta.value = isoToDate(data.rango_fijo_hasta);
  // Mientras esté procesando, revisa cada 5s para que el botón se libere solo.
  clearTimeout(pollTimer);
  if (procesando.value) pollTimer = setTimeout(cargarConfig, 5000);
  // Justo cuando pasa de procesando -> libre, refresca el historial para ver el resultado final.
  if (seguiaProcesando && !procesando.value) await cargarLogs();
}

async function cargarLogs() {
  cargandoLogs.value = true;
  try {
    const { data } = await axios.get(`${API}/dashboard-asistencia/resumen-cron/logs`);
    logs.value = Array.isArray(data) ? data : [];
    // Auto-refresh cada 5s mientras haya una ejecución en curso.
    const hayActivos = logs.value.some((l) => l.estado === 'procesando');
    clearTimeout(logsPollTimer);
    if (hayActivos) logsPollTimer = setTimeout(cargarLogs, 5000);
  } finally {
    cargandoLogs.value = false;
  }
}

function etiquetaEstado(estado) {
  if (estado === 'procesando') return 'Procesando';
  if (estado === 'completado') return 'Completado';
  if (estado === 'error') return 'Error';
  if (estado === 'cancelado') return 'Cancelado';
  return estado;
}

function estadoClass(estado) {
  if (estado === 'procesando') return 'bg-amber-500/15 text-amber-500';
  if (estado === 'completado') return 'bg-emerald-500/15 text-emerald-500';
  if (estado === 'error') return 'bg-red-500/15 text-red-500';
  if (estado === 'cancelado') return 'bg-slate-500/15 text-slate-400';
  return 'bg-slate-500/15 text-slate-400';
}

async function cargarEmpresas() {
  try {
    const { data } = await axios.get(`${API_USUARIOS}/companies`);
    empresas.value = (Array.isArray(data) ? data : [])
      .filter((c) => c.is_active !== false)
      .map((c) => c.name)
      .filter(Boolean)
      .sort();
  } catch {
    empresas.value = [];
  }
}

async function guardar() {
  guardando.value = true;
  try {
    const { hora, minuto, activo, dias_ventana } = config.value;
    await axios.put(`${API}/dashboard-asistencia/resumen-cron/config`, {
      hora, minuto, activo, dias_ventana,
      company: empresaSel.value,
      rango_fijo_desde: usaRangoFijo.value ? dateToISO(rangoFijoDesde.value) : null,
      rango_fijo_hasta: usaRangoFijo.value ? dateToISO(rangoFijoHasta.value) : null,
    });
    await cargarConfig();
    flash('Configuración guardada');
  } catch (e) {
    flash('Error al guardar', true);
  } finally {
    guardando.value = false;
  }
}

async function cancelarCorrida() {
  cancelando.value = true;
  try {
    await axios.post(`${API}/dashboard-asistencia/resumen-cron/cancelar`);
    flash('Corrida cancelada.');
    await cargarConfig();
    await cargarLogs();
  } catch (e) {
    flash('Error al cancelar', true);
  } finally {
    cancelando.value = false;
  }
}

async function ejecutarAhora() {
  ejecutando.value = true;
  try {
    const body = {};
    if (rangoDesde.value && rangoHasta.value) {
      body.startDate = dateToISO(rangoDesde.value);
      body.endDate = dateToISO(rangoHasta.value);
    }
    if (empresaSel.value && empresaSel.value !== 'Todas') {
      body.company = empresaSel.value;
    }
    const { data } = await axios.post(`${API}/dashboard-asistencia/resumen-cron/ejecutar-ahora`, body);
    flash(`Corrida iniciada: ${data.startDate} → ${data.endDate} (${data.company}). Revisa el estado en "Últimas Ejecuciones".`);
    setTimeout(() => { cargarConfig(); cargarLogs(); }, 1500);
  } catch (e) {
    flash('Error al iniciar la corrida', true);
  } finally {
    ejecutando.value = false;
  }
}

onMounted(async () => {
  await Promise.all([cargarConfig(), cargarEmpresas(), cargarLogs()]);
  conectarConsola();
  await cargarEventLoop();
  eventLoopTimer = setInterval(cargarEventLoop, 10000);
});

onUnmounted(() => {
  clearTimeout(pollTimer);
  clearTimeout(logsPollTimer);
  clearInterval(eventLoopTimer);
  streamAbort?.abort();
  streamAbort = null;
});
</script>
