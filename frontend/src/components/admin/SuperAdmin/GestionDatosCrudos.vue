<template>
  <div class="space-y-3 h-full flex flex-col overflow-hidden">
    <!-- Header + filtros -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">
          Datos Crudos (Odoo)
        </h2>
        <p class="text-[12px] mt-0.5" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Diagnóstico: datos tal cual vienen de Odoo (<code>employee_id</code> directo), SIN emparejar
          turnos ni cruzar mallas/cédulas. Solo Super Admin.
        </p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-1.5">
      <!-- HOY toggle -->
      <button @click="filterHoy = !filterHoy"
        class="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-[12px] font-medium transition-all active:scale-[0.98]"
        :class="filterHoy
          ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
          : (isDark ? 'bg-[#0B0F19] border-[#222938] text-[#888888] hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900')">
        <i class="fas text-[10px]" :class="filterHoy ? 'fa-calendar-check' : 'fa-calendar'"></i>
        Hoy
      </button>

      <!-- Rango de fechas -->
      <div class="flex items-center gap-2 h-8 px-2 rounded-lg border transition-all"
        :class="[filterHoy ? 'opacity-40 pointer-events-none' : '', isDark ? 'bg-[#0B0F19] border-[#222938]' : 'bg-white border-slate-200']">
        <input v-model="startDate" type="date" @change="filterHoy = false" class="bg-transparent text-[12px] font-medium outline-none cursor-pointer w-[110px]"
          :class="isDark ? 'text-white' : 'text-slate-700'">
        <div class="w-px h-3" :class="isDark ? 'bg-[#222938]' : 'bg-slate-300'"></div>
        <input v-model="endDate" type="date" @change="filterHoy = false" class="bg-transparent text-[12px] font-medium outline-none cursor-pointer w-[110px]"
          :class="isDark ? 'text-white' : 'text-slate-700'">
      </div>

      <!-- Empresa -->
      <div class="relative">
        <select v-model="selectedCompany"
          class="h-8 pl-2.5 pr-7 text-[12px] font-medium rounded-lg border outline-none appearance-none cursor-pointer w-48"
          :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-700'">
          <option value="">Todas las empresas</option>
          <option v-for="e in empresas" :key="e" :value="e">{{ e }}</option>
        </select>
        <i class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none"
          :class="isDark ? 'text-[#888888]' : 'text-slate-400'"></i>
      </div>

      <!-- Departamento -->
      <input v-model="selectedDepartment" type="text" placeholder="Departamento (opcional)…"
        class="h-8 px-2.5 text-[12px] font-medium rounded-lg border outline-none w-48"
        :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white placeholder:text-[#5a5a5a]' : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400'">

      <!-- Search (client-side: nombre/employee_id, no hay cédula en modo crudo) -->
      <div class="relative">
        <i class="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px]"
          :class="isDark ? 'text-[#888888]' : 'text-slate-400'"></i>
        <input v-model="search" type="text" placeholder="Nombre o employee_id…"
          class="h-8 pl-7 pr-2.5 text-[12px] font-medium rounded-lg border outline-none w-48"
          :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white placeholder:text-[#5a5a5a]' : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400'">
      </div>

      <button @click="fetchCrudoDiagnostico"
        class="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-semibold transition-all active:scale-[0.98] bg-amber-500 text-white hover:bg-amber-600">
        <i class="fas fa-magnifying-glass text-[10px]" :class="{ 'fa-spin': loadingCrudo }"></i>
        Consultar
      </button>
    </div>

    <div v-if="crudoError" class="px-3 py-2 rounded-lg text-[12px] font-medium flex items-center gap-2 border"
      :class="isDark ? 'bg-[#dc2626]/[0.08] border-[#dc2626]/30 text-[#f87171]' : 'bg-red-50 border-red-200 text-red-700'">
      <i class="fas fa-circle-exclamation text-[11px]"></i>
      {{ crudoError }}
    </div>

    <!-- Cargando -->
    <div v-if="loadingCrudo" class="flex-1 flex items-center justify-center rounded-xl border"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <div class="flex flex-col items-center gap-3 py-20">
        <i class="fas fa-circle-notch fa-spin text-2xl" :class="isDark ? 'text-amber-400' : 'text-amber-500'"></i>
        <span class="text-[12px] font-medium" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Descargando crudo de Odoo (sin cruces)…
        </span>
      </div>
    </div>

    <!-- Vacío inicial -->
    <div v-else-if="!crudoData" class="flex-1 flex items-center justify-center rounded-xl border"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <div class="flex flex-col items-center gap-2 py-20">
        <i class="fas fa-database text-2xl" :class="isDark ? 'text-slate-600' : 'text-slate-300'"></i>
        <span class="text-[12px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
          Selecciona los filtros y presiona Consultar
        </span>
      </div>
    </div>

    <template v-else>
      <!-- Métricas -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div class="px-3 py-2 rounded-lg border" :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
          <span class="block text-[9px] uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Asistencias</span>
          <span class="block text-[16px] font-bold tabular-nums" :class="isDark ? 'text-white' : 'text-slate-900'">{{ crudoData.attendancesCount }}</span>
        </div>
        <div class="px-3 py-2 rounded-lg border" :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
          <span class="block text-[9px] uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Logs biométrico/app</span>
          <span class="block text-[16px] font-bold tabular-nums" :class="isDark ? 'text-white' : 'text-slate-900'">{{ crudoData.logsCount }}</span>
        </div>
        <div class="px-3 py-2 rounded-lg border" :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
          <span class="block text-[9px] uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Tiempo total</span>
          <span class="block text-[16px] font-bold tabular-nums" :class="isDark ? 'text-white' : 'text-slate-900'">{{ (crudoData.tiempoTotalMs / 1000).toFixed(1) }}s</span>
        </div>
        <div class="px-3 py-2 rounded-lg border" :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
          <span class="block text-[9px] uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Heap tras descarga</span>
          <span class="block text-[16px] font-bold tabular-nums" :class="isDark ? 'text-white' : 'text-slate-900'">
            {{ crudoData.memoria?.heapMb_tras_descargarLogs ?? '—' }} MB
            <span class="text-[10px] font-normal opacity-60">(inicio {{ crudoData.memoria?.heapMb_inicio }} MB)</span>
          </span>
        </div>
      </div>

      <!-- Sub-tabs -->
      <div class="flex items-center gap-0.5 p-0.5 rounded-lg border w-fit"
        :class="isDark ? 'bg-[#0B0F19] border-[#222938]' : 'bg-slate-100 border-slate-200'">
        <button @click="crudoTab = 'attendances'; crudoPage = 1"
          class="h-6 px-2.5 rounded text-[10px] font-semibold transition-all"
          :class="crudoTab === 'attendances' ? 'bg-amber-500 text-white' : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700')">
          hr.attendance ({{ crudoData.attendancesCount }})
        </button>
        <button @click="crudoTab = 'logs'; crudoPage = 1"
          class="h-6 px-2.5 rounded text-[10px] font-semibold transition-all"
          :class="crudoTab === 'logs' ? 'bg-amber-500 text-white' : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700')">
          attendance.log ({{ crudoData.logsCount }})
        </button>
      </div>

      <!-- Tabla cruda -->
      <div class="flex-1 overflow-hidden rounded-xl border flex flex-col relative"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar scroll-smooth">
          <table class="w-full border-separate border-spacing-0">
            <thead class="sticky top-0 z-30">
              <tr class="bg-[#1e2538]">
                <th class="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">ID Odoo</th>
                <th class="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">Employee ID</th>
                <th class="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">Empleado</th>
                <th class="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">Depto</th>
                <template v-if="crudoTab === 'attendances'">
                  <th class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">Check in</th>
                  <th class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">Check out</th>
                </template>
                <template v-else>
                  <th class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">Punching time</th>
                  <th class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">Status</th>
                  <th class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">Device</th>
                </template>
              </tr>
            </thead>
            <tbody v-if="!crudoRowsPaginadas.length">
              <tr>
                <td :colspan="crudoTab === 'attendances' ? 6 : 7" class="py-16 text-center">
                  <i class="fas fa-inbox text-2xl mb-2 block" :class="isDark ? 'text-slate-600' : 'text-slate-300'"></i>
                  <span class="text-[11px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Sin registros</span>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr v-for="(row, i) in crudoRowsPaginadas" :key="row.id"
                :class="[i % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-transparent']">
                <td class="px-3 py-2 border-b text-[11px] tabular-nums" :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">{{ row.id }}</td>
                <td class="px-3 py-2 border-b text-[11px] font-bold tabular-nums" :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{ row.employee_id }}</td>
                <td class="px-3 py-2 border-b text-[11px] font-semibold" :class="isDark ? 'border-[#222938] text-white' : 'border-slate-100 text-slate-900'">{{ row.empleado }}</td>
                <td class="px-3 py-2 border-b text-[11px]" :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">{{ row.department_id }}</td>
                <template v-if="crudoTab === 'attendances'">
                  <td class="px-3 py-2 border-b text-center text-[11px] tabular-nums" :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{ row.check_in || '—' }}</td>
                  <td class="px-3 py-2 border-b text-center text-[11px] tabular-nums" :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{ row.check_out || '—' }}</td>
                </template>
                <template v-else>
                  <td class="px-3 py-2 border-b text-center text-[11px] tabular-nums" :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{ row.punching_time || '—' }}</td>
                  <td class="px-3 py-2 border-b text-center text-[11px]" :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{ row.status || '—' }}</td>
                  <td class="px-3 py-2 border-b text-center text-[11px]" :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{ row.device || '—' }}</td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div v-if="crudoRowsActivas.length" class="px-3 py-2 border-t flex items-center justify-between"
          :class="isDark ? 'border-[#222938] bg-[#0B0F19]/40' : 'border-slate-200 bg-slate-50/60'">
          <span class="text-[11px]" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
            <span :class="isDark ? 'text-white font-medium' : 'text-slate-900 font-medium'">{{ crudoRowsActivas.length }}</span>
            registros
          </span>
          <div class="flex items-center gap-1.5">
            <button @click="crudoPage--" :disabled="crudoPage === 1"
              class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all disabled:opacity-30"
              :class="isDark ? 'bg-[#161B26] border-[#222938] text-[#E2E8F0]' : 'bg-white border-slate-200 text-slate-700'">
              <i class="fas fa-chevron-left text-[9px]"></i>
            </button>
            <div class="h-7 px-3 flex items-center rounded-lg text-[11px] font-medium border"
              :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-900'">
              {{ crudoPage }} / {{ crudoTotalPages }}
            </div>
            <button @click="crudoPage++" :disabled="crudoPage >= crudoTotalPages"
              class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all disabled:opacity-30"
              :class="isDark ? 'bg-[#161B26] border-[#222938] text-[#E2E8F0]' : 'bg-white border-slate-200 text-slate-700'">
              <i class="fas fa-chevron-right text-[9px]"></i>
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { useCargarAsistencias } from '../../../composables/UserLogica/cargarAsistencias';

defineProps({ isDark: { type: Boolean, default: true } });

const {
  search,
  selectedDepartment,
  startDate,
  endDate,
  selectedCompany,
  filterHoy,
  crudoData,
  loadingCrudo,
  crudoError,
  fetchCrudoDiagnostico,
} = useCargarAsistencias();

const API = import.meta.env.VITE_API_URL; // .../usuarios
const empresas = ref([]);

async function cargarEmpresas() {
  try {
    const { data } = await axios.get(`${API}/companies`);
    empresas.value = (Array.isArray(data) ? data : [])
      .filter((c) => c.is_active !== false)
      .map((c) => c.name)
      .filter(Boolean)
      .sort();
  } catch {
    empresas.value = [];
  }
}

// ── Sub-tabs + paginación (mismo comportamiento que la vista original) ──────
const crudoTab = ref('attendances'); // 'attendances' | 'logs'
const crudoPage = ref(1);
const crudoItemsPerPage = 20;

const crudoRowsCrudas = computed(() => {
  if (!crudoData.value) return [];
  return crudoTab.value === 'attendances'
    ? (crudoData.value.attendances ?? [])
    : (crudoData.value.logs ?? []);
});

// El buscador no tiene cédula en modo crudo (no se resuelve a propósito):
// filtra por nombre o employee_id, en el cliente sobre lo ya descargado.
const crudoRowsActivas = computed(() => {
  const s = search.value.toLowerCase().trim();
  if (!s) return crudoRowsCrudas.value;
  return crudoRowsCrudas.value.filter((row) =>
    String(row.empleado || '').toLowerCase().includes(s) ||
    String(row.employee_id || '').includes(s),
  );
});

const crudoTotalPages = computed(() =>
  Math.max(1, Math.ceil(crudoRowsActivas.value.length / crudoItemsPerPage)),
);

const crudoRowsPaginadas = computed(() => {
  const start = (crudoPage.value - 1) * crudoItemsPerPage;
  return crudoRowsActivas.value.slice(start, start + crudoItemsPerPage);
});

onMounted(() => {
  cargarEmpresas();
});
</script>
