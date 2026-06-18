<template>
  <div class="h-full flex flex-col gap-3">
    <!-- ── Header: Controles ───────────────────────────────────────────────── -->
    <div class="flex items-end gap-3 flex-wrap px-4 pt-3">
      <!-- Filtros -->
      <div class="flex gap-2 flex-wrap items-end">
        <div>
          <label class="text-xs font-medium block mb-1" :class="isDark ? 'text-slate-300' : 'text-slate-600'">Desde</label>
          <input v-model="startDate" type="date" class="px-2 py-1.5 text-xs border rounded"
            :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-white border-slate-200'">
        </div>
        <div>
          <label class="text-xs font-medium block mb-1" :class="isDark ? 'text-slate-300' : 'text-slate-600'">Hasta</label>
          <input v-model="endDate" type="date" class="px-2 py-1.5 text-xs border rounded"
            :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-white border-slate-200'">
        </div>
        <div>
          <label class="text-xs font-medium block mb-1" :class="isDark ? 'text-slate-300' : 'text-slate-600'">Empleado</label>
          <input v-model="filterNombre" type="text" placeholder="Nombre o cédula" class="px-2 py-1.5 text-xs border rounded"
            :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white placeholder-slate-500' : 'bg-white border-slate-200 placeholder-slate-400'">
        </div>
      </div>

      <!-- Botones acciones -->
      <div class="flex gap-2">
        <button @click="calcular" :disabled="isCalculating"
          class="px-3 py-1.5 text-xs font-medium rounded border transition-all disabled:opacity-50"
          :class="isDark ? 'bg-[#3B82F6]/15 border-[#3B82F6]/60 text-[#60A5FA] hover:bg-[#3B82F6]/25' : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'">
          <i class="fas fa-calculator mr-1"></i>{{ isCalculating ? 'Calculando...' : 'Calcular' }}
        </button>
        <button @click="mostrarDecimales = !mostrarDecimales"
          class="px-3 py-1.5 text-xs font-medium rounded border transition-all"
          :class="mostrarDecimales ? (isDark ? 'bg-[#3B82F6]/15 border-[#3B82F6]/60 text-[#60A5FA]' : 'bg-blue-50 border-blue-200 text-blue-700') : (isDark ? 'bg-[#161B26] border-[#222938] text-slate-400' : 'bg-white border-slate-200 text-slate-600')">
          <i class="fas fa-toggle-on mr-1" :class="mostrarDecimales ? '' : 'rotate-180'"></i>{{ mostrarDecimales ? 'Decimales' : 'Horas' }}
        </button>
        <button @click="exportarExcel" :disabled="isExporting"
          class="px-3 py-1.5 text-xs font-medium rounded border transition-all disabled:opacity-50"
          :class="isDark ? 'bg-[#161B26] border-[#222938] text-slate-400 hover:bg-[#3B82F6]/[0.05]' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'">
          <i :class="isExporting ? 'fas fa-spinner fa-spin' : 'fas fa-file-excel'" class="mr-1"></i>{{ isExporting ? 'Exportando...' : 'Excel' }}
        </button>
      </div>
    </div>

    <!-- ── Grid AG-GRID (Excel-like) ──────────────────────────────────────── -->
    <div class="flex-1 overflow-hidden px-4 pb-4">
      <AgGridVue
        :columnDefs="columnDefs"
        :rowData="gridData"
        :defaultColDef="defaultColDef"
        :gridOptions="gridOptions"
        :theme="theme"
        class="w-full h-full"
        @grid-ready="onGridReady">
      </AgGridVue>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import { useReporteMallas } from '../../composables/adminLogica/useReporteMallas';

ModuleRegistry.registerModules([AllCommunityModule]);

const props = defineProps({
  isDark: { type: Boolean, default: false },
});

const {
  registros,
  isCalculating,
  isExporting,
  startDate,
  endDate,
  filterNombre,
  calcular,
  exportarExcel,
} = useReporteMallas();

const mostrarDecimales = ref(false);
let gridApi = null;
const isDark = computed(() => props.isDark);
const theme = computed(() =>
  isDark.value
    ? themeQuartz.withParams({ accentColor: '#3B82F6' })
    : themeQuartz.withParams({ accentColor: '#3B82F6' })
);

function fmtCalculo(val) {
  const n = Number(val || 0);
  return mostrarDecimales.value ? parseFloat(n.toFixed(2)).toString() : Math.floor(n).toString();
}

function formatFecha(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

const gridData = computed(() =>
  (registros.value || []).map(r => ({
    colaborador: r.empleado,
    cedula: r.cc,
    fecha: formatFecha(r.fecha),
    jornada_inicio: r.turno_inicio || '-',
    jornada_fin: r.turno_fin || '-',
    entrada: r.check_in || '-',
    salida: r.check_out || '-',
    rn: fmtCalculo(r.rn),
    rndf: fmtCalculo(r.rndf),
    rddf: fmtCalculo(r.rddf),
    hedo: fmtCalculo(r.hedo),
    heno: fmtCalculo(r.heno),
    hefd: fmtCalculo(r.hefd),
    hefn: fmtCalculo(r.hefn),
  }))
);

const defaultColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  wrapHeaderText: true,
  autoHeaderHeight: true,
};

const columnDefs = [
  { field: 'colaborador', headerName: 'Colaborador', width: 180 },
  { field: 'cedula', headerName: 'Cédula', width: 100 },
  { field: 'fecha', headerName: 'Fecha', width: 90 },
  { field: 'jornada_inicio', headerName: 'Jornada Inicio', width: 100 },
  { field: 'jornada_fin', headerName: 'Jornada Fin', width: 100 },
  { field: 'entrada', headerName: 'Entrada', width: 120 },
  { field: 'salida', headerName: 'Salida', width: 120 },
  { field: 'rn', headerName: 'RN', width: 70, cellClass: 'text-red-500 font-bold' },
  { field: 'rndf', headerName: 'RNDF', width: 70, cellClass: 'text-red-400 font-bold' },
  { field: 'rddf', headerName: 'RDDF', width: 70, cellClass: 'text-red-400 font-bold' },
  { field: 'hedo', headerName: 'HEDO', width: 70, cellClass: 'text-blue-500 font-bold' },
  { field: 'heno', headerName: 'HENO', width: 70, cellClass: 'text-blue-400 font-bold' },
  { field: 'hefd', headerName: 'HEFD', width: 70, cellClass: 'text-amber-500 font-bold' },
  { field: 'hefn', headerName: 'HEFN', width: 70, cellClass: 'text-amber-400 font-bold' },
];

const gridOptions = {
  enableCellTextSelection: true,
  ensureDomOrder: true,
  pagination: true,
  paginationPageSize: 50,
  paginationPageSizeSelector: [10, 25, 50, 100, 200],
};

function onGridReady(params) {
  gridApi = params.api;
  gridApi.sizeColumnsToFit();
}

watch(isDark, () => {
  if (gridApi) gridApi.refreshCells();
});
</script>

<style scoped>
:deep(.ag-cell) {
  display: flex;
  align-items: center;
}
</style>
