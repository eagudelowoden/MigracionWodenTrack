<template>
  <div class="h-full flex flex-col gap-4 overflow-y-auto custom-scroll pr-1">

    <!-- ── Filtros (PrimeVue) ──────────────────────────────────────────────── -->
    <div class="rounded-xl border p-4 flex flex-wrap items-end gap-4 shrink-0"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-bold uppercase tracking-wide"
          :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Mes</label>
        <DatePicker v-model="mesSeleccionadoDate" view="month" dateFormat="mm/yy" showIcon iconDisplay="input"
          inputClass="!h-9 !text-[13px]" class="w-40" />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-bold uppercase tracking-wide"
          :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Área / Departamento</label>
        <AutoComplete v-model="departamentoSeleccionado" :suggestions="departamentosFiltrados"
          @complete="filtrarDepartamentos" @clear="departamentoSeleccionado = ''" dropdown
          placeholder="Todas las áreas" inputClass="!h-9 !text-[13px] !w-56" />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-bold uppercase tracking-wide"
          :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Comparar tendencia desde</label>
        <DatePicker v-model="mesInicioTendenciaDate" view="month" dateFormat="mm/yy" showIcon iconDisplay="input"
          inputClass="!h-9 !text-[13px]" class="w-40" />
      </div>

      <Button @click="cargarTodo" label="Actualizar" icon="pi pi-refresh" :loading="cargando" size="small" />
    </div>

    <div v-if="error" class="rounded-lg border px-4 py-2.5 text-[13px]"
      :class="isDark ? 'bg-red-950/40 border-red-900/60 text-red-300' : 'bg-red-50 border-red-200 text-red-700'">
      {{ error }}
    </div>

    <!-- ── Tarjetas KPI ────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
      <div class="rounded-2xl border p-4 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-medium" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Cumplimiento promedio</span>
          <span class="w-7 h-7 rounded-lg flex items-center justify-center text-[12px]"
            :class="isDark ? 'bg-[#3B82F6]/15 text-[#60A5FA]' : 'bg-[#EEF4FF] text-[#2563eb]'">
            <i class="pi pi-shield"></i>
          </span>
        </div>
        <p class="text-xl font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ kpi.cumplimientoPromedio }}%</p>
      </div>

      <div class="rounded-2xl border p-4 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-medium" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Llegadas tarde ({{ mesSeleccionadoLabel }})</span>
          <span class="w-7 h-7 rounded-lg flex items-center justify-center text-[12px]"
            :class="isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-500'">
            <i class="pi pi-clock"></i>
          </span>
        </div>
        <p class="text-xl font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ kpi.totalTardanzas }}</p>
      </div>

      <div class="rounded-2xl border p-4 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-medium" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Mejor área</span>
          <span class="w-7 h-7 rounded-lg flex items-center justify-center text-[12px]"
            :class="isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'">
            <i class="pi pi-arrow-up-right"></i>
          </span>
        </div>
        <p class="text-[15px] font-bold truncate" :class="isDark ? 'text-white' : 'text-slate-900'">{{ kpi.mejorArea?.departamento || '—' }}</p>
        <p class="text-[11px] mt-0.5" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">{{ kpi.mejorArea?.porcentaje_cumplimiento ?? 0 }}% cumplimiento</p>
      </div>

      <div class="rounded-2xl border p-4 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-medium" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Áreas en riesgo (&lt;80%)</span>
          <span class="w-7 h-7 rounded-lg flex items-center justify-center text-[12px]"
            :class="isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'">
            <i class="pi pi-exclamation-triangle"></i>
          </span>
        </div>
        <p class="text-xl font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ kpi.areasEnRiesgo }}</p>
      </div>
    </div>

    <!-- ── Comparativo de cumplimiento por área ───────────────────────────── -->
    <div class="rounded-2xl border p-4 shadow-sm shrink-0"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-[13px] font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">Cumplimiento por área</h3>
        <div class="flex items-center gap-3 text-[11px]" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
          <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#22C55E]"></span>≥ 90%</span>
          <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#F59E0B]"></span>80–90%</span>
          <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#EF4444]"></span>&lt; 80%</span>
        </div>
      </div>
      <div class="h-80">
        <Chart v-if="chartCumplimiento" type="bar" :data="chartCumplimiento" :options="opcionesBarras" class="w-full h-full" />
        <p v-else class="text-[12px]" :class="isDark ? 'text-[#888888]' : 'text-slate-400'">Sin datos para el periodo seleccionado.</p>
      </div>
    </div>

    <!-- ── Tendencia mensual ───────────────────────────────────────────────── -->
    <div class="rounded-2xl border p-4 shadow-sm shrink-0"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <h3 class="text-[13px] font-bold mb-3" :class="isDark ? 'text-white' : 'text-slate-900'">
        Tendencia mes a mes — % de cumplimiento
      </h3>
      <div class="h-64">
        <Chart v-if="chartTendencia" type="line" :data="chartTendencia" :options="opcionesLinea" class="w-full h-full" />
        <p v-else class="text-[12px]" :class="isDark ? 'text-[#888888]' : 'text-slate-400'">Sin datos para el rango seleccionado.</p>
      </div>
    </div>

    <!-- ── Ranking de tardanzas ────────────────────────────────────────────── -->
    <div class="rounded-2xl border p-4 shadow-sm shrink-0"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-[13px] font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">
          Ranking de llegadas tarde ({{ mesSeleccionadoLabel }})
        </h3>
        <span class="text-[11px] font-semibold px-2 py-1 rounded-full"
          :class="isDark ? 'bg-white/[0.06] text-[#888888]' : 'bg-slate-100 text-slate-500'">
          {{ ranking.length }} {{ ranking.length === 1 ? 'persona' : 'personas' }}
        </span>
      </div>
      <DataTable :value="ranking" paginator :rows="10" sortField="total_tardanzas" :sortOrder="-1"
        removableSort size="small" scrollable scrollHeight="360px"
        :class="isDark ? 'p-datatable-dark' : ''">
        <Column field="nombre" header="Nombre" sortable />
        <Column field="cedula" header="Cédula" sortable style="width: 140px" />
        <Column field="departamento" header="Área" sortable />
        <Column field="total_tardanzas" header="# Tardanzas" sortable style="width: 140px" />
        <template #empty>Sin llegadas tarde para el periodo/área seleccionados.</template>
      </DataTable>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import DatePicker from 'primevue/datepicker';
import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import Chart from 'primevue/chart';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const props = defineProps({
  isDark: { type: Boolean, default: false },
  company: String,
});

// El backend de este módulo vive en la raíz de la API, no bajo /usuarios
// (mismo patrón que GestionPermisos.vue para /modulos-disponibles).
const baseUrl = (import.meta.env.VITE_API_URL || '').replace('/usuarios', '');

function toMesStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const hoy = new Date();
const mesSeleccionadoDate = ref(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
const mesInicioTendenciaDate = ref(new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1));

const mesSeleccionado = computed(() => toMesStr(mesSeleccionadoDate.value));
const mesInicioTendencia = computed(() => toMesStr(mesInicioTendenciaDate.value));
const mesSeleccionadoLabel = computed(() => mesSeleccionado.value);

const departamentoSeleccionado = ref('');
const departamentosTodos = ref([]);
const departamentosFiltrados = ref([]);

function filtrarDepartamentos(ev) {
  const q = (ev.query || '').toLowerCase();
  departamentosFiltrados.value = q
    ? departamentosTodos.value.filter(d => d.toLowerCase().includes(q))
    : [...departamentosTodos.value];
}

const ranking = ref([]);
const cumplimientoAreas = ref([]);
const tendenciaSerie = ref([]);
const cargando = ref(false);
const error = ref('');

function rangoDelMes(mes) {
  const [y, m] = mes.split('-').map(Number);
  const start = `${mes}-01`;
  const end = new Date(y, m, 0).toISOString().slice(0, 10); // último día del mes
  return { start, end };
}

async function cargarDepartamentos() {
  try {
    const { data } = await axios.get(`${baseUrl}/dashboard-asistencia/departamentos`, {
      params: { company: props.company },
    });
    departamentosTodos.value = data.departamentos || [];
  } catch {
    // no crítico: el autocomplete simplemente queda vacío
  }
}

async function cargarRanking() {
  const { start, end } = rangoDelMes(mesSeleccionado.value);
  const { data } = await axios.get(`${baseUrl}/dashboard-asistencia/ranking-tardanzas`, {
    params: { startDate: start, endDate: end, departamento: departamentoSeleccionado.value || undefined, company: props.company },
  });
  ranking.value = data.ranking || [];
}

async function cargarCumplimiento() {
  const { start, end } = rangoDelMes(mesSeleccionado.value);
  const { data } = await axios.get(`${baseUrl}/dashboard-asistencia/cumplimiento-por-area`, {
    params: { startDate: start, endDate: end, company: props.company },
  });
  cumplimientoAreas.value = data.areas || [];
}

async function cargarTendencia() {
  const start = `${mesInicioTendencia.value}-01`;
  const { end } = rangoDelMes(mesSeleccionado.value);
  const { data } = await axios.get(`${baseUrl}/dashboard-asistencia/tendencia-mensual`, {
    params: { startDate: start, endDate: end, departamento: departamentoSeleccionado.value || undefined, company: props.company },
  });
  tendenciaSerie.value = data.serie || [];
}

async function cargarTodo() {
  cargando.value = true;
  error.value = '';
  try {
    // Secuencial, NO en paralelo: el backend solo admite 2 consultas "pesadas"
    // simultáneas (control anti-OOM) y tendencia-mensual por sí sola ya hace
    // varias llamadas a Odoo por dentro — disparar las 3 a la vez agotaba el
    // cupo y una de ellas (normalmente el ranking) terminaba rechazada con
    // "Ups, esto podría tardar un poco…", dejando la tabla vacía.
    await cargarCumplimiento();
    await cargarRanking();
    await cargarTendencia();
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error al cargar el dashboard de asistencia.';
  } finally {
    cargando.value = false;
  }
}

const colorTexto = computed(() => (props.isDark ? '#E2E8F0' : '#334155'));
const colorGrid = computed(() => (props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'));

function colorCumplimiento(pct) {
  if (pct >= 90) return '#22C55E';
  if (pct >= 80) return '#F59E0B';
  return '#EF4444';
}

const kpi = computed(() => {
  const areas = cumplimientoAreas.value;
  const cumplimientoPromedio = areas.length
    ? Math.round((areas.reduce((s, a) => s + a.porcentaje_cumplimiento, 0) / areas.length) * 10) / 10
    : 0;
  const mejorArea = areas.length
    ? areas.reduce((best, a) => (a.porcentaje_cumplimiento > best.porcentaje_cumplimiento ? a : best))
    : null;
  const areasEnRiesgo = areas.filter(a => a.porcentaje_cumplimiento < 80).length;
  const totalTardanzas = areas.reduce((s, a) => s + a.total_tardanzas, 0);
  return { cumplimientoPromedio, mejorArea, areasEnRiesgo, totalTardanzas };
});

const chartCumplimiento = computed(() => {
  if (!cumplimientoAreas.value.length) return null;
  return {
    labels: cumplimientoAreas.value.map(a => a.departamento),
    datasets: [{
      label: '% Cumplimiento',
      data: cumplimientoAreas.value.map(a => a.porcentaje_cumplimiento),
      backgroundColor: cumplimientoAreas.value.map(a => colorCumplimiento(a.porcentaje_cumplimiento)),
      borderRadius: { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 },
      borderSkipped: false,
      barPercentage: 0.55,
      categoryPercentage: 0.7,
    }],
  };
});

const chartTendencia = computed(() => {
  if (!tendenciaSerie.value.length) return null;
  return {
    labels: tendenciaSerie.value.map(s => s.mes),
    datasets: [{
      label: '% Cumplimiento',
      data: tendenciaSerie.value.map(s => s.porcentaje_cumplimiento),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59,130,246,0.15)',
      tension: 0.3,
      fill: true,
      pointRadius: 3,
    }],
  };
});

const opcionesBarras = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  layout: { padding: { bottom: 8 } },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const area = cumplimientoAreas.value[ctx.dataIndex];
          return ` ${ctx.formattedValue}% cumplimiento (${area.total_tardanzas}/${area.total_registros} tarde)`;
        },
      },
    },
  },
  scales: {
    x: {
      ticks: { color: colorTexto.value, autoSkip: false, maxRotation: 40, minRotation: 40, font: { size: 10 } },
      grid: { display: false },
    },
    y: { min: 0, max: 100, ticks: { color: colorTexto.value, callback: (v) => `${v}%` }, grid: { color: colorGrid.value } },
  },
}));

const opcionesLinea = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: colorTexto.value } },
    tooltip: { callbacks: { label: (ctx) => ` ${ctx.formattedValue}% cumplimiento` } },
  },
  scales: {
    x: { ticks: { color: colorTexto.value }, grid: { color: colorGrid.value } },
    y: { min: 0, max: 100, ticks: { color: colorTexto.value, callback: (v) => `${v}%` }, grid: { color: colorGrid.value } },
  },
}));

watch([mesSeleccionado, departamentoSeleccionado, mesInicioTendencia], cargarTodo);

onMounted(async () => {
  await cargarDepartamentos();
  await cargarTodo();
});
</script>
