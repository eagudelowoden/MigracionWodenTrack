<template>
  <div class="h-full flex flex-col gap-2.5 overflow-y-auto custom-scroll pr-1">

    <!-- ── Filtros (PrimeVue) ──────────────────────────────────────────────── -->
    <div class="rounded-xl border p-3 flex flex-wrap items-end gap-3 shrink-0"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-bold uppercase tracking-wide"
          :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Desde</label>
        <DatePicker v-model="filtroDesde" dateFormat="dd/mm/yy" showIcon iconDisplay="input"
          inputClass="!h-8 !text-[12px]" class="w-36" />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-bold uppercase tracking-wide"
          :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Hasta</label>
        <DatePicker v-model="filtroHasta" dateFormat="dd/mm/yy" showIcon iconDisplay="input"
          inputClass="!h-8 !text-[12px]" class="w-36" />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-bold uppercase tracking-wide"
          :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Segmento</label>
        <Select v-model="segmentoSeleccionado" :options="segmentosDisponibles" optionLabel="nombre"
          optionValue="nombre" showClear placeholder="Todos los segmentos" inputClass="!h-8 !text-[12px]"
          class="w-48" />
      </div>

      <Button @click="cargarTodo" label="Actualizar" icon="pi pi-refresh" :loading="cargando"
        class="!h-8 !px-4 !text-[12px]" />
    </div>

    <div v-if="error" class="rounded-lg border px-3 py-2 text-[12px]"
      :class="isDark ? 'bg-orange-950/40 border-orange-900/60 text-orange-300' : 'bg-orange-50 border-orange-200 text-orange-700'">
      {{ error }}
    </div>

    <!-- ── 6 Tarjetas KPI ──────────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
      <div class="rounded-2xl border p-3 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[11px] font-medium"
            :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Cumplimiento</span>
          <span class="w-6 h-6 rounded-lg flex items-center justify-center text-[11px]"
            :class="isDark ? 'bg-[#36A2EB]/15 text-[#60B2F5]' : 'bg-[#36A2EB]/10 text-[#2E86D1]'">
            <i class="pi pi-shield"></i>
          </span>
        </div>
        <p class="text-lg font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ kpi.cumplimientoPromedio }}%
        </p>
      </div>

      <div class="rounded-2xl border p-3 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[11px] font-medium" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Puntualidad</span>
          <span class="w-6 h-6 rounded-lg flex items-center justify-center text-[11px]"
            :class="isDark ? 'bg-[#2DD9B9]/15 text-[#2DD9B9]' : 'bg-[#2DD9B9]/10 text-[#1BA88E]'">
            <i class="pi pi-check-circle"></i>
          </span>
        </div>
        <p class="text-lg font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ kpi.puntualidad }}%</p>
      </div>

      <div class="rounded-2xl border p-3 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[11px] font-medium" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Llegadas
            tarde</span>
          <span class="w-6 h-6 rounded-lg flex items-center justify-center text-[11px]"
            :class="isDark ? 'bg-[#FFCE56]/15 text-[#FFCE56]' : 'bg-[#FFCE56]/15 text-[#B8860B]'">
            <i class="pi pi-clock"></i>
          </span>
        </div>
        <p class="text-lg font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ kpi.totalTardanzas }}</p>
      </div>

      <div class="rounded-2xl border p-3 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[11px] font-medium" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Ausencias</span>
          <span class="w-6 h-6 rounded-lg flex items-center justify-center text-[11px]"
            :class="isDark ? 'bg-[#FF9F40]/15 text-[#FF9F40]' : 'bg-[#FF9F40]/15 text-[#C56A00]'">
            <i class="pi pi-user-minus"></i>
          </span>
        </div>
        <p class="text-lg font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ kpi.totalAusencias }}</p>
      </div>
    </div>

    <!-- ── Cumplimiento por área (barras horizontales) + Estado de asistencia (dona) ── -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-2.5 shrink-0">
      <div class="lg:col-span-2 rounded-2xl border p-3 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <h3 class="text-[12px] font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">
              {{ modoCentroCosto ? 'Cumplimiento por centro de costo' : 'Cumplimiento por área' }}
            </h3>
            <span class="text-[10px]" :class="isDark ? 'text-[#666666]' : 'text-slate-400'">
              (clic en una barra para filtrar el resto del dashboard)</span>
          </div>
          <div class="flex items-center gap-3 text-[11px]" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#2DD9B9]"></span>≥ 90%</span>
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#FFCE56]"></span>80–90%</span>
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#FF9F40]"></span>&lt;
              80%</span>
          </div>
        </div>
        <div v-if="segmentoSeleccionado || centroCostoSeleccionado" class="mb-2 flex flex-wrap gap-2">
          <button type="button" @click="limpiarSegmento"
            class="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors"
            :class="isDark ? 'bg-[#36A2EB]/15 text-[#60B2F5] hover:bg-[#36A2EB]/25' : 'bg-[#36A2EB]/10 text-[#2E86D1] hover:bg-[#36A2EB]/20'">
            <i class="pi pi-filter"></i> Segmento: {{ segmentoSeleccionado }} <i class="pi pi-times ml-0.5"></i>
          </button>
          <button v-if="centroCostoSeleccionado" type="button" @click="limpiarCentroCosto"
            class="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors"
            :class="isDark ? 'bg-[#2DD9B9]/15 text-[#2DD9B9] hover:bg-[#2DD9B9]/25' : 'bg-[#2DD9B9]/10 text-[#1BA88E] hover:bg-[#2DD9B9]/20'">
            <i class="pi pi-filter"></i> Centro de costo: {{ centroCostoSeleccionado }} <i class="pi pi-times ml-0.5"></i>
          </button>
        </div>
        <div :style="{ height: alturaBarrasArea }">
          <Chart v-if="chartCumplimiento" type="bar" :data="chartCumplimiento" :options="opcionesBarrasHorizontal"
            class="w-full h-full" />
          <p v-else class="text-[12px]" :class="isDark ? 'text-[#888888]' : 'text-slate-400'">Sin datos para el periodo
            seleccionado.</p>
        </div>
      </div>

      <div class="rounded-2xl border p-3 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <h3 class="text-[12px] font-bold mb-2" :class="isDark ? 'text-white' : 'text-slate-900'">Estado de asistencia
        </h3>
        <div class="h-56">
          <Chart v-if="chartEstado" type="doughnut" :data="chartEstado" :options="opcionesDona" class="w-full h-full" />
          <p v-else class="text-[12px]" :class="isDark ? 'text-[#888888]' : 'text-slate-400'">Sin datos.</p>
        </div>
      </div>
    </div>

    <!-- ── Tardanzas por área ───────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 gap-2.5 shrink-0">
      <div class="rounded-2xl border p-3 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <h3 class="text-[12px] font-bold mb-2" :class="isDark ? 'text-white' : 'text-slate-900'">
          Personas del área <span class="font-normal" :class="isDark ? 'text-[#666666]' : 'text-slate-400'">(clic en
            una barra para ver sus días de tardanza)</span>
        </h3>
        <div :style="{ height: alturaTardanzasPersonas }">
          <Chart v-if="chartTardanzasArea" type="bar" :data="chartTardanzasArea" :options="opcionesBarrasTardanzasPersonas"
            class="w-full h-full" />
          <p v-else class="text-[12px]" :class="isDark ? 'text-[#888888]' : 'text-slate-400'">Sin tardanzas en el
            periodo.</p>
        </div>
        <div v-if="personaTardanzasSeleccionada" class="mt-3 pt-3 border-t" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
          <div class="flex items-center justify-between mb-1.5">
            <p class="text-[11px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">
              {{ personaTardanzasSeleccionada.nombre }} — días de tardanza
            </p>
            <button type="button" @click="personaTardanzasSeleccionada = null"
              class="text-[11px] opacity-60 hover:opacity-100" :class="isDark ? 'text-white' : 'text-slate-900'">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div style="height: 140px;">
            <Chart type="bar" :data="chartDetallePersona(personaTardanzasSeleccionada.detalle)"
              :options="opcionesDetallePersona" class="w-full h-full" />
          </div>
        </div>
      </div>
    </div>

    <!-- ── Día destacado: clic para ver el detalle de ese día abajo ────────── -->
    <div v-if="diaMasTardanzas" class="grid grid-cols-1 gap-2.5 shrink-0">
      <button type="button" @click="irADetalleDia(diaMasTardanzas.fecha)"
        class="text-left rounded-2xl border p-3 shadow-sm transition-colors"
        :class="isDark ? 'bg-[#161B26] border-[#222938] hover:bg-white/[0.03]' : 'bg-white border-slate-200 hover:bg-slate-50'">
        <div class="flex items-center gap-2">
          <span class="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] shrink-0"
            :class="isDark ? 'bg-[#FFCE56]/15 text-[#FFCE56]' : 'bg-[#FFCE56]/15 text-[#B8860B]'">
            <i class="pi pi-clock"></i>
          </span>
          <div>
            <p class="text-[11px] font-medium" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Día con más
              llegadas tarde</p>
            <p class="text-[13px] font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">
              {{ formatFechaISO(diaMasTardanzas.fecha) }} — {{ diaMasTardanzas.total_tardanzas }} tardanzas
            </p>
          </div>
        </div>
      </button>
    </div>

    <!-- ── Detalle de un día específico ──────────────────────────────────── -->
    <div ref="detalleDiaSection" class="rounded-2xl border p-3 shadow-sm shrink-0"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <div class="flex flex-wrap items-end justify-between gap-2 mb-2">
        <div>
          <h3 class="text-[12px] font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">Ver detalle del día</h3>
          <p class="text-[10px] mt-0.5" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
            {{ formatFechaISO(dateToISO(diaDetalleDate)) }} — se actualiza con el rango de fechas, el clic en un día
            destacado, o el filtro de segmento/centro de costo.
          </p>
        </div>
        <span v-if="detalleDia.length" class="text-[11px] font-semibold px-2 py-1 rounded-full"
          :class="isDark ? 'bg-white/[0.06] text-[#888888]' : 'bg-slate-100 text-slate-500'">
          {{detalleDia.filter(d => d.estado === 'ENTRADA TARDE').length}} de {{ detalleDia.length }} llegaron tarde
        </span>
      </div>
      <DataTable :value="detalleDia" paginator :rows="10" size="small" scrollable scrollHeight="220px"
        :class="isDark ? 'p-datatable-dark' : ''">
        <Column header="Fecha" style="width: 100px">
          <template #body>{{ formatFechaISO(dateToISO(diaDetalleDate)) }}</template>
        </Column>
        <Column field="nombre" header="Nombre" sortable />
        <Column field="cedula" header="Cédula" sortable style="width: 130px" />
        <Column field="departamento" header="Área" sortable />
        <Column field="entrada" header="Entrada" sortable style="width: 100px" />
        <Column field="salida" header="Salida" sortable style="width: 100px" />
        <Column field="estado" header="Estado" sortable style="width: 140px">
          <template #body="{ data }">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold" :class="claseBadgeEstado(data.estado)">
              {{ etiquetaEstado(data.estado) }}
            </span>
          </template>
        </Column>
        <template #empty>Sin registros para ese día. Presiona "Actualizar" arriba.</template>
      </DataTable>
    </div>

    <!-- ── Ranking de tardanzas ────────────────────────────────────────────── -->
    <div class="rounded-2xl border p-3 shadow-sm shrink-0"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <div class="flex flex-wrap items-end justify-between gap-2 mb-2">
        <div>
          <h3 class="text-[12px] font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">
            Listado llegadas tarde
          </h3>
          <p class="text-[10px] mt-0.5" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
            {{ formatFechaCorta(rankingStartDate) }} — {{ formatFechaCorta(rankingEndDate) }}
          </p>
        </div>
        <div class="flex flex-wrap items-end gap-2">
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold uppercase tracking-wide"
              :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Desde</label>
            <DatePicker v-model="rankingStartDate" dateFormat="dd/mm/yy" showIcon iconDisplay="input"
              inputClass="!h-8 !text-[12px]" class="w-36" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold uppercase tracking-wide"
              :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Hasta</label>
            <DatePicker v-model="rankingEndDate" dateFormat="dd/mm/yy" showIcon iconDisplay="input"
              inputClass="!h-8 !text-[12px]" class="w-36" />
          </div>
          <Button @click="cargarRanking" label="Buscar" icon="pi pi-search" :loading="cargandoRanking" size="small"
            severity="secondary" outlined />
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText v-model="busquedaPersona" placeholder="Buscar persona…" class="!h-8 !text-[12px] w-44" />
          </IconField>
        </div>
      </div>
      <DataTable :value="rankingFiltrado" v-model:expandedRows="rankingExpandido" paginator :rows="10"
        sortField="total_tardanzas" :sortOrder="-1" dataKey="cedula" removableSort size="small" scrollable
        scrollHeight="240px" :class="isDark ? 'p-datatable-dark' : ''">
        <Column expander style="width: 36px" />
        <Column field="nombre" header="Nombre" sortable />
        <Column field="cedula" header="Cédula" sortable style="width: 140px" />
        <Column field="departamento" header="Área" sortable />
        <Column field="total_tardanzas" header="# Tardanzas" sortable style="width: 140px" />
        <template #expansion="{ data }">
          <div class="pl-10 py-2" style="height: 150px; max-width: 520px;">
            <Chart type="bar" :data="chartDetallePersona(data.detalle)" :options="opcionesDetallePersona"
              class="w-full h-full" />
          </div>
        </template>
        <template #empty>Sin llegadas tarde para el periodo/área/persona seleccionados.</template>
      </DataTable>
    </div>

    <!-- ── Jornadas incompletas / Calidad de marcaciones ───────────────────── -->
    <div class="rounded-2xl border p-3 shadow-sm shrink-0"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <h3 class="text-[12px] font-bold mb-2" :class="isDark ? 'text-white' : 'text-slate-900'">Jornadas incompletas /
        Calidad de marcaciones</h3>
      <DataTable :value="calidadMarcaciones" paginator :rows="6" size="small" scrollable scrollHeight="180px"
        :class="isDark ? 'p-datatable-dark' : ''">
        <Column field="departamento" header="Área" sortable />
        <Column field="total_incompletas" header="Incompletas" sortable style="width: 110px" />
        <Column field="porcentaje_incompletas" header="%" sortable style="width: 90px">
          <template #body="{ data }">{{ data.porcentaje_incompletas }}%</template>
        </Column>
        <template #empty>Sin datos para el periodo seleccionado.</template>
      </DataTable>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import axios from 'axios';
import DatePicker from 'primevue/datepicker';
import Select from 'primevue/select';
import Button from 'primevue/button';
import Chart from 'primevue/chart';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

const props = defineProps({
  isDark: { type: Boolean, default: false },
  company: String,
});

// El backend de este módulo vive en la raíz de la API, no bajo /usuarios
// (mismo patrón que GestionPermisos.vue para /modulos-disponibles).
const baseUrl = (import.meta.env.VITE_API_URL || '').replace('/usuarios', '');

const hoy = new Date();
// Rango con día incluido (antes era solo "Mes" — el usuario necesita poder
// acotar a un día o rango exacto, no solo a un mes calendario completo).
const filtroDesde = ref(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
const filtroHasta = ref(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));

// Filtro por SEGMENTO (maestro propio de "Estructura Organizacional",
// maestro_segmentos_estructura — reemplaza al viejo filtro por departamento
// de Odoo). Se activa desde este dropdown O haciendo clic en una barra de
// "Cumplimiento por área"; ambos caminos comparten el mismo estado.
const segmentoSeleccionado = ref('');
const segmentosDisponibles = ref([]);
// Drill-down: cumplimiento por centro de costo DENTRO del segmento elegido —
// reemplaza el gráfico/tabla de "Cumplimiento por área" mientras haya un
// segmento activo (ver computed `modoCentroCosto`).
const cumplimientoCentrosCosto = ref([]);
// Clic en una barra del drill-down de centro de costo: a diferencia del
// desglose que solo se mostraba (informativo), esto SÍ filtra — por ahora
// solo "Personas con más tardanzas" (ranking), que es lo que se pidió.
const centroCostoSeleccionado = ref('');
// Red de seguridad: si el segmento cambia por CUALQUIER vía (dropdown de
// arriba + Actualizar, no solo clic en barra), el centro de costo elegido
// antes deja de tener sentido (era de otro segmento) — se limpia solo.
watch(segmentoSeleccionado, () => { centroCostoSeleccionado.value = ''; });

const ranking = ref([]);
const rankingExpandido = ref({});
const cumplimientoAreas = ref([]);
const estadoAsistencia = ref([]);
const tardanzasPorDia = ref([]);
const calidadMarcaciones = ref([]);
const cargando = ref(false);
const cargandoRanking = ref(false);
const error = ref('');

function dateToISO(d) {
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatFechaCorta(d) {
  if (!d) return '—';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// fecha viene como 'YYYY-MM-DD' del backend
function formatFechaISO(fechaStr) {
  if (!fechaStr) return '—';
  const [y, m, d] = fechaStr.split('-');
  return `${d}/${m}/${y}`;
}

function isoStrToDate(fechaStr) {
  const [y, m, d] = fechaStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function etiquetaEstado(estado) {
  if (estado === 'ENTRADA TARDE') return 'Tarde';
  if (estado === 'A TIEMPO') return 'A tiempo';
  if (estado === 'AUSENTE') return 'Ausente';
  if (estado === 'INCOMPLETO') return 'Incompleto';
  return estado;
}

function claseBadgeEstado(estado) {
  if (estado === 'ENTRADA TARDE') return props.isDark ? 'bg-[#FFCE56]/15 text-[#FFCE56]' : 'bg-[#FFCE56]/15 text-[#B8860B]';
  if (estado === 'AUSENTE') return props.isDark ? 'bg-[#FF9F40]/15 text-[#FF9F40]' : 'bg-[#FF9F40]/15 text-[#C56A00]';
  if (estado === 'INCOMPLETO') return props.isDark ? 'bg-[#94A3B8]/15 text-[#94A3B8]' : 'bg-[#94A3B8]/15 text-[#64748B]';
  return props.isDark ? 'bg-[#2DD9B9]/15 text-[#2DD9B9]' : 'bg-[#2DD9B9]/15 text-[#1BA88E]';
}

// ── Ranking: rango de fechas propio (independiente del "Mes" de las tarjetas/
// gráficas) + búsqueda por nombre/cédula, para poder consultar "cuántas veces
// llegó tarde tal persona en tal rango" sin estar atado a un mes calendario.
const rankingStartDate = ref(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
const rankingEndDate = ref(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
const busquedaPersona = ref('');

const rankingFiltrado = computed(() => {
  const q = busquedaPersona.value.trim().toLowerCase();
  if (!q) return ranking.value;
  return ranking.value.filter(r =>
    (r.nombre || '').toLowerCase().includes(q) || (r.cedula || '').toLowerCase().includes(q)
  );
});

// ── Detalle de un día específico: quién llegó, a qué hora, y si llegó tarde.
const diaDetalleDate = ref(new Date());
const detalleDia = ref([]);
const cargandoDia = ref(false);
const detalleDiaSection = ref(null);

// Clic en "Día con más tardanzas/ausencias": carga el detalle de ese día y
// hace scroll hasta la sección para que el resultado quede a la vista.
async function irADetalleDia(fechaStr) {
  diaDetalleDate.value = isoStrToDate(fechaStr);
  await cargarDetalleDia();
  await nextTick();
  detalleDiaSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function cargarDetalleDia() {
  cargandoDia.value = true;
  try {
    const { data } = await axios.get(`${baseUrl}/dashboard-asistencia/detalle-dia`, {
      params: {
        fecha: dateToISO(diaDetalleDate.value),
        segmento: segmentoSeleccionado.value || undefined,
        centroCosto: centroCostoSeleccionado.value || undefined,
        company: props.company,
      },
    });
    detalleDia.value = data.registros || [];
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error al cargar el detalle del día.';
  } finally {
    cargandoDia.value = false;
  }
}

async function cargarSegmentosDisponibles() {
  try {
    const { data } = await axios.get(`${baseUrl}/estructura-organizacional/segmentos`);
    segmentosDisponibles.value = data || [];
  } catch {
    // no crítico: el dropdown simplemente queda vacío
  }
}

async function cargarRanking() {
  cargandoRanking.value = true;
  personaTardanzasSeleccionada.value = null; // los datos van a cambiar, no dejar un detalle viejo abierto
  try {
    const { data } = await axios.get(`${baseUrl}/dashboard-asistencia/ranking-tardanzas`, {
      params: {
        startDate: dateToISO(rankingStartDate.value),
        endDate: dateToISO(rankingEndDate.value),
        segmento: segmentoSeleccionado.value || undefined,
        centroCosto: centroCostoSeleccionado.value || undefined,
        company: props.company,
      },
    });
    ranking.value = data.ranking || [];
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error al cargar el ranking de tardanzas.';
  } finally {
    cargandoRanking.value = false;
  }
}

async function cargarCumplimiento() {
  const { data } = await axios.get(`${baseUrl}/dashboard-asistencia/cumplimiento-por-area`, {
    params: {
      startDate: dateToISO(filtroDesde.value),
      endDate: dateToISO(filtroHasta.value),
      segmento: segmentoSeleccionado.value || undefined,
      company: props.company,
    },
  });
  cumplimientoAreas.value = data.areas || [];
}

// Los métodos nuevos ya son agregaciones SQL sobre `asistencia_diaria_resumen`
// (el cron nocturno ya cruzó todo) — no hay límite de admisión Odoo aquí, por
// eso sí se disparan en paralelo (a diferencia de cargarTodo, que mezcla estos
// livianos con los históricos que ya existían).
async function cargarSeccionesNuevas() {
  const params = {
    startDate: dateToISO(filtroDesde.value),
    endDate: dateToISO(filtroHasta.value),
    segmento: segmentoSeleccionado.value || undefined,
    centroCosto: centroCostoSeleccionado.value || undefined,
    company: props.company,
  };

  const [estado, tDia, calidad] = await Promise.all([
    axios.get(`${baseUrl}/dashboard-asistencia/estado-asistencia`, { params }),
    axios.get(`${baseUrl}/dashboard-asistencia/tardanzas-por-dia`, { params }),
    axios.get(`${baseUrl}/dashboard-asistencia/calidad-marcaciones`, { params }),
  ]);

  estadoAsistencia.value = estado.data.estados || [];
  tardanzasPorDia.value = tDia.data.dias || [];
  calidadMarcaciones.value = calidad.data.areas || [];
}

async function cargarCumplimientoCentrosCosto() {
  // Solo tiene sentido dentro de UN segmento — sin eso, "por centro de costo"
  // mezclaría gente de segmentos distintos que puede compartir centro de costo.
  if (!segmentoSeleccionado.value) {
    cumplimientoCentrosCosto.value = [];
    return;
  }
  const { data } = await axios.get(`${baseUrl}/dashboard-asistencia/cumplimiento-por-centro-costo`, {
    params: {
      startDate: dateToISO(filtroDesde.value),
      endDate: dateToISO(filtroHasta.value),
      segmento: segmentoSeleccionado.value,
      company: props.company,
    },
  });
  cumplimientoCentrosCosto.value = data.centros || [];
}

const diaMasTardanzas = computed(() => {
  if (!tardanzasPorDia.value.length) return null;
  return tardanzasPorDia.value.reduce((max, d) => (d.total_tardanzas > (max?.total_tardanzas ?? 0) ? d : max), null);
});

// Recarga todo lo que depende de los filtros (fecha/departamento/segmento).
// `incluirCumplimiento` se apaga cuando el disparo ES un clic en una barra de
// "Cumplimiento por área": ese gráfico debe seguir mostrando TODOS los
// segmentos (para poder elegir otro o quitar el filtro), no reducirse a uno solo.
async function recargarSegunFiltros({ incluirCumplimiento = true } = {}) {
  cargando.value = true;
  error.value = '';
  try {
    // Secuencial, NO en paralelo: el backend solo admite 2 consultas "pesadas"
    // simultáneas (control anti-OOM) — dispararlas todas a la vez agotaba el
    // cupo y alguna (normalmente el ranking) terminaba rechazada con
    // "Ups, esto podría tardar un poco…", dejando la tabla vacía.
    if (incluirCumplimiento) await cargarCumplimiento();
    await cargarRanking();
    await cargarSeccionesNuevas();
    await cargarDetalleDia();
    await cargarCumplimientoCentrosCosto();
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error al cargar el dashboard de asistencia.';
  } finally {
    cargando.value = false;
  }
}

async function cargarTodo() {
  // Refresco completo (botón "Actualizar" o carga inicial): el día que
  // muestra "Ver detalle del día" vuelve a su valor por defecto (el último
  // día del rango) salvo que se sobreescriba haciendo clic en una tarjeta de
  // "Día con más tardanzas/ausencias". Tope en HOY: si el rango elegido se
  // extiende al futuro (ej. "este mes" con hoy a mitad de mes), el último día
  // del rango todavía no ocurrió y nunca va a tener marcaciones — sin este
  // tope, "Ver detalle del día" siempre caía en un día vacío por diseño.
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  diaDetalleDate.value = filtroHasta.value > hoy ? hoy : filtroHasta.value;
  await recargarSegunFiltros({ incluirCumplimiento: true });
}

// Clic en una barra de "Cumplimiento por área": alterna el filtro de
// segmento (clic de nuevo en la misma barra lo quita) y refresca todo lo
// demás con ese filtro — sin tocar el propio gráfico de cumplimiento.
// En modo centro de costo (drill-down DENTRO de un segmento) el clic no hace
// nada — centro de costo es solo informativo, no es un filtro del dashboard.
async function onClickBarraCumplimiento(_evt, elements) {
  if (!elements?.length) return;
  if (modoCentroCosto.value) {
    // Drill-down de centro de costo: clic filtra "Personas con más tardanzas"
    // (clic de nuevo en la misma barra lo quita).
    const centro = cumplimientoCentrosCosto.value[elements[0].index];
    if (!centro) return;
    centroCostoSeleccionado.value = centroCostoSeleccionado.value === centro.centro_costo ? '' : centro.centro_costo;
    await recargarSegunFiltros({ incluirCumplimiento: false });
    return;
  }
  const area = cumplimientoAreas.value[elements[0].index];
  if (!area) return;
  segmentoSeleccionado.value = segmentoSeleccionado.value === area.departamento ? '' : area.departamento;
  // Un segmento nuevo invalida cualquier centro de costo elegido antes (era
  // de otro segmento).
  centroCostoSeleccionado.value = '';
  await recargarSegunFiltros({ incluirCumplimiento: false });
}

async function limpiarSegmento() {
  segmentoSeleccionado.value = '';
  centroCostoSeleccionado.value = '';
  await recargarSegunFiltros({ incluirCumplimiento: false });
}

async function limpiarCentroCosto() {
  centroCostoSeleccionado.value = '';
  await recargarSegunFiltros({ incluirCumplimiento: false });
}

const colorTexto = computed(() => (props.isDark ? '#E2E8F0' : '#334155'));
const colorGrid = computed(() => (props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'));

// Paleta del dashboard: azul, naranja, amarillo, verde azulado (teal), gris —
// sin rojo ni tonos que se lean como rojo (ej. naranja quemado).
const PALETA = {
  azul: '#36A2EB',
  naranja: '#FF9F40',
  amarillo: '#FFCE56',
  teal: '#2DD9B9',
  gris: '#94A3B8',
};

function colorCumplimiento(pct) {
  if (pct >= 90) return PALETA.teal;
  if (pct >= 80) return PALETA.amarillo;
  return PALETA.naranja;
}

// Paleta categórica para "Personas con más tardanzas": un color distinto por
// área/departamento, estable entre renders (mismo departamento → mismo color
// siempre, sin importar en qué orden aparezca en los datos).
const PALETA_CATEGORICA = [
  '#36A2EB', '#FF9F40', '#2DD9B9', '#A78BFA', '#F472B6',
  '#FFCE56', '#34D399', '#60A5FA', '#FB923C', '#94A3B8',
];
const coloresPorDepartamento = new Map();
function colorPorDepartamento(dept) {
  const clave = dept || 'SIN ÁREA';
  if (!coloresPorDepartamento.has(clave)) {
    coloresPorDepartamento.set(clave, PALETA_CATEGORICA[coloresPorDepartamento.size % PALETA_CATEGORICA.length]);
  }
  return coloresPorDepartamento.get(clave);
}

const kpi = computed(() => {
  const areas = cumplimientoAreas.value;
  const cumplimientoPromedio = areas.length
    ? Math.round((areas.reduce((s, a) => s + a.porcentaje_cumplimiento, 0) / areas.length) * 10) / 10
    : 0;
  const totalTardanzas = areas.reduce((s, a) => s + a.total_tardanzas, 0);
  const totalRegistros = areas.reduce((s, a) => s + a.total_registros, 0);
  const puntualidad = totalRegistros > 0 ? Math.round((100 - (totalTardanzas / totalRegistros) * 100) * 10) / 10 : 0;

  const ausenteEstado = estadoAsistencia.value.find(e => e.estado === 'AUSENTE');
  const totalAusencias = ausenteEstado?.total ?? 0;

  return { cumplimientoPromedio, puntualidad, totalTardanzas, totalAusencias };
});

// Con un segmento elegido Y datos de centro de costo cargados, el gráfico
// entero pasa a mostrar el desglose interno (centros de costo) en vez de los
// segmentos — es un drill-down, no un filtro adicional.
const modoCentroCosto = computed(() => !!segmentoSeleccionado.value && cumplimientoCentrosCosto.value.length > 0);

const chartCumplimiento = computed(() => {
  if (modoCentroCosto.value) {
    const datos = cumplimientoCentrosCosto.value;
    return {
      labels: datos.map(c => c.centro_costo),
      datasets: [{
        label: '% Cumplimiento',
        data: datos.map(c => c.porcentaje_cumplimiento),
        backgroundColor: datos.map(c => {
          const color = colorCumplimiento(c.porcentaje_cumplimiento);
          if (!centroCostoSeleccionado.value || c.centro_costo === centroCostoSeleccionado.value) return color;
          return color + '33';
        }),
        borderRadius: { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 },
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      }],
    };
  }
  if (!cumplimientoAreas.value.length) return null;
  return {
    labels: cumplimientoAreas.value.map(a => a.departamento),
    datasets: [{
      label: '% Cumplimiento',
      data: cumplimientoAreas.value.map(a => a.porcentaje_cumplimiento),
      // Con un segmento activo, se atenúan las barras de los demás para que
      // resalte cuál está filtrando (la selección se hace clicando la barra).
      backgroundColor: cumplimientoAreas.value.map(a => {
        const color = colorCumplimiento(a.porcentaje_cumplimiento);
        if (!segmentoSeleccionado.value || a.departamento === segmentoSeleccionado.value) return color;
        return color + '33';
      }),
      borderRadius: { topLeft: 0, topRight: 8, bottomLeft: 0, bottomRight: 8 },
      borderSkipped: false,
      barPercentage: 0.6,
      categoryPercentage: 0.7,
    }],
  };
});

// Barras verticales: alto fijo (ya no depende de cuántas categorías haya,
// como sí hacía falta con las horizontales — acá lo que se aprieta es el
// ancho, y las etiquetas rotadas ya lo manejan).
const alturaBarrasArea = computed(() => '260px');

const chartEstado = computed(() => {
  if (!estadoAsistencia.value.length) return null;
  const colores = { PUNTUAL: PALETA.teal, TARDE: PALETA.amarillo, AUSENTE: PALETA.naranja, INCOMPLETO: PALETA.gris };
  const etiquetas = { PUNTUAL: 'Puntual', TARDE: 'Tarde', AUSENTE: 'Ausente', INCOMPLETO: 'Incompleto' };
  return {
    labels: estadoAsistencia.value.map(e => etiquetas[e.estado] || e.estado),
    datasets: [{
      data: estadoAsistencia.value.map(e => e.total),
      backgroundColor: estadoAsistencia.value.map(e => colores[e.estado] || '#94A3B8'),
      borderWidth: 0,
    }],
  };
});

// Ya no es un agregado por área — son las personas puntuales con más
// tardanzas (viene del mismo `ranking` que ya se carga para la tabla de
// abajo, sin pedirle nada nuevo al backend), coloreadas por su departamento.
// Se limita a un TOP para que las barras no queden ilegibles con cientos de
// personas.
const TOP_TARDANZAS = 12;
const topPersonasTardanzas = computed(() =>
  [...ranking.value].sort((a, b) => b.total_tardanzas - a.total_tardanzas).slice(0, TOP_TARDANZAS),
);

const chartTardanzasArea = computed(() => {
  if (!topPersonasTardanzas.value.length) return null;
  return {
    labels: topPersonasTardanzas.value.map(p => p.nombre),
    datasets: [{
      label: '# Tardanzas',
      data: topPersonasTardanzas.value.map(p => p.total_tardanzas),
      backgroundColor: topPersonasTardanzas.value.map(p => colorPorDepartamento(p.departamento)),
      borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
      borderSkipped: false,
      barPercentage: 0.65,
      categoryPercentage: 0.75,
    }],
  };
});

const alturaTardanzasPersonas = computed(() => '260px');

// Mini-gráfica del detalle expandible por persona (tabla de ranking): minutos
// de tardanza día a día, en vez de la lista de texto que había antes.
function chartDetallePersona(detalle) {
  return {
    labels: (detalle || []).map(d => formatFechaISO(d.fecha)),
    datasets: [{
      label: 'Minutos tarde',
      data: (detalle || []).map(d => d.minutos_tarde ?? 0),
      backgroundColor: PALETA.amarillo,
      borderRadius: 4,
      barPercentage: 0.6,
    }],
  };
}

const opcionesDetallePersona = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => ` ${ctx.formattedValue} min tarde` } },
  },
  scales: {
    x: { ticks: { color: colorTexto.value, autoSkip: false, maxRotation: 40, minRotation: 40, font: { size: 9 } }, grid: { display: false } },
    y: { beginAtZero: true, ticks: { color: colorTexto.value, precision: 0 }, grid: { color: colorGrid.value } },
  },
}));

const opcionesBarrasHorizontal = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  onClick: onClickBarraCumplimiento,
  onHover: (evt, elements) => {
    evt.native.target.style.cursor = elements.length ? 'pointer' : 'default';
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const area = modoCentroCosto.value
            ? cumplimientoCentrosCosto.value[ctx.dataIndex]
            : cumplimientoAreas.value[ctx.dataIndex];
          return ` ${ctx.formattedValue}% cumplimiento (${area.total_tardanzas}/${area.total_registros} tarde) — clic para filtrar`;
        },
      },
    },
  },
  scales: {
    x: { ticks: { color: colorTexto.value, autoSkip: false, maxRotation: 40, minRotation: 40, font: { size: 10 } }, grid: { display: false } },
    y: { min: 0, max: 100, ticks: { color: colorTexto.value, callback: (v) => `${v}%` }, grid: { color: colorGrid.value } },
  },
}));

// Persona elegida al hacer clic en su barra: se muestra su detalle día a día
// debajo del gráfico (reusa la misma mini-gráfica del detalle expandible en
// la tabla de ranking). Clic de nuevo en la misma barra lo cierra.
const personaTardanzasSeleccionada = ref(null);
function onClickBarraPersonaTardanzas(_evt, elements) {
  if (!elements?.length) return;
  const p = topPersonasTardanzas.value[elements[0].index];
  if (!p) return;
  personaTardanzasSeleccionada.value = personaTardanzasSeleccionada.value?.cedula === p.cedula ? null : p;
}

const opcionesBarrasTardanzasPersonas = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  onClick: onClickBarraPersonaTardanzas,
  onHover: (evt, elements) => {
    evt.native.target.style.cursor = elements.length ? 'pointer' : 'default';
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const p = topPersonasTardanzas.value[ctx.dataIndex];
          return ` ${ctx.formattedValue} tardanza(s) — ${p.departamento || 'Sin área'}`;
        },
        // Una línea por cada día que llegó tarde, con fecha y minutos —
        // el resumen de arriba ya dice el total, esto es el detalle.
        afterLabel: (ctx) => {
          const p = topPersonasTardanzas.value[ctx.dataIndex];
          return (p.detalle || []).map(d => `${formatFechaISO(d.fecha)} — ${d.minutos_tarde ?? 0} min tarde`);
        },
      },
    },
  },
  scales: {
    x: { ticks: { color: colorTexto.value, autoSkip: false, maxRotation: 40, minRotation: 40, font: { size: 9 } }, grid: { display: false } },
    y: { beginAtZero: true, ticks: { color: colorTexto.value, precision: 0 }, grid: { color: colorGrid.value } },
  },
}));

const opcionesDona = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom', labels: { color: colorTexto.value, boxWidth: 10, font: { size: 11 } } } },
}));

// Sin watch automático a propósito: cambiar el mes/área/tendencia NO dispara
// la consulta por sí solo — el usuario debe presionar "Actualizar" (o
// "Buscar"/"Consultar" en las secciones de ranking y detalle del día).
onMounted(async () => {
  await cargarSegmentosDisponibles();
});
</script>
