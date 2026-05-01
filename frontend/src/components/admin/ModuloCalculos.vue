<template>
  <div class="h-full animate-fade-in flex flex-col gap-2">

    <!-- ── Barra de controles ──────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-end gap-3 p-3 px-4 rounded-2xl border transition-all duration-300 shadow-sm"
      :class="isDark ? 'bg-[#1e2538] border-white/5 shadow-black/20' : 'bg-[#f8fafc] border-slate-200 shadow-slate-200/50'">

      <!-- Desde -->
      <div class="flex flex-col gap-1">
        <label class="text-[8px] font-black uppercase tracking-widest"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">Desde</label>
        <input type="date" v-model="startDate"
          class="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border outline-none transition-colors"
          :class="isDark ? 'bg-slate-800 border-white/10 text-white focus:border-[#FF8F00]' : 'bg-white border-slate-200 text-slate-800 focus:border-[#FF8F00]'" />
      </div>

      <!-- Hasta -->
      <div class="flex flex-col gap-1">
        <label class="text-[8px] font-black uppercase tracking-widest"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">Hasta</label>
        <input type="date" v-model="endDate"
          class="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border outline-none transition-colors"
          :class="isDark ? 'bg-slate-800 border-white/10 text-white focus:border-[#FF8F00]' : 'bg-white border-slate-200 text-slate-800 focus:border-[#FF8F00]'" />
      </div>

      <!-- Filtro Nombre -->
      <div class="flex flex-col gap-1">
        <label class="text-[8px] font-black uppercase tracking-widest"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">Nombre</label>
        <div class="relative">
          <i class="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400"></i>
          <input v-model="filterNombre" type="text" placeholder="Buscar..."
            class="pl-7 pr-2.5 py-1.5 text-[10px] font-semibold rounded-lg border outline-none w-36 transition-colors"
            :class="isDark ? 'bg-slate-800 border-white/10 text-white focus:border-[#FF8F00]' : 'bg-white border-slate-200 text-slate-800 focus:border-[#FF8F00]'" />
        </div>
      </div>

      <!-- Filtro Cargo -->
      <div class="flex flex-col gap-1">
        <label class="text-[8px] font-black uppercase tracking-widest"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cargo</label>
        <div class="relative">
          <select v-model="filterCargo"
            class="pl-2.5 pr-7 py-1.5 text-[10px] font-semibold rounded-lg border outline-none appearance-none w-40 cursor-pointer transition-colors"
            :class="isDark ? 'bg-slate-800 border-white/10 text-white focus:border-[#FF8F00]' : 'bg-white border-slate-200 text-slate-800 focus:border-[#FF8F00]'">
            <option value="">Todos los cargos</option>
            <option v-for="c in opcionesCargos" :key="c" :value="c">{{ c }}</option>
          </select>
          <i class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 pointer-events-none"></i>
        </div>
      </div>

      <!-- Filtro Departamento -->
      <div v-if="hasPerm('admin.filtro_departamento') || isSuperAdmin" class="flex flex-col gap-1">
        <label class="text-[8px] font-black uppercase tracking-widest"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">Departamento</label>
        <div class="relative">
          <select v-model="filterDepartamento"
            class="pl-2.5 pr-7 py-1.5 text-[10px] font-semibold rounded-lg border outline-none appearance-none w-44 cursor-pointer transition-colors"
            :class="isDark ? 'bg-slate-800 border-white/10 text-white focus:border-[#FF8F00]' : 'bg-white border-slate-200 text-slate-800 focus:border-[#FF8F00]'">
            <option value="">Todos los departamentos</option>
            <option v-for="d in opcionesDepartamentos" :key="d" :value="d">{{ d }}</option>
          </select>
          <i class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 pointer-events-none"></i>
        </div>
      </div>

      <!-- Solo con extras -->
      <label class="flex items-center gap-2 cursor-pointer select-none self-end pb-1.5">
        <div class="relative">
          <input type="checkbox" v-model="soloConExtras" class="sr-only peer" />
          <div class="w-8 h-4 rounded-full transition-colors peer-checked:bg-[#FF8F00]"
            :class="isDark ? 'bg-white/10' : 'bg-slate-200'"></div>
          <div class="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform peer-checked:translate-x-4 shadow-sm"></div>
        </div>
        <span class="text-[9px] font-black uppercase tracking-wide whitespace-nowrap"
          :class="isDark ? 'text-slate-300' : 'text-slate-600'">Solo con extras</span>
      </label>

      <!-- Acciones -->
      <div class="flex items-center gap-2 ml-auto self-end">

        <!-- Calcular -->
        <button @click="handleCalcular" :disabled="isCalculating || isLoading"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 bg-[#FF8F00] hover:bg-orange-600 text-white shadow-md shadow-orange-500/20">
          <i :class="isCalculating ? 'fas fa-spinner fa-spin' : 'fas fa-calculator'" class="text-xs"></i>
          <span>{{ isCalculating ? 'Calculando...' : 'Calcular' }}</span>
        </button>

        <!-- Refrescar historial -->
        <button @click="handleCargar" :disabled="isLoading"
          class="p-2 rounded-lg transition-all"
          :class="isDark ? 'text-slate-400 hover:text-[#FF8F00]' : 'text-slate-500 hover:text-[#FF8F00]'"
          title="Refrescar historial">
          <i class="fas fa-arrows-rotate text-base" :class="{ 'fa-spin': isLoading }"></i>
        </button>

        <!-- Excel -->
        <button @click="handleExportar" :disabled="isExporting || !registros.length"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50">
          <i :class="isExporting ? 'fas fa-spinner fa-spin' : 'fas fa-file-excel'" class="text-xs"></i>
          <span>{{ isExporting ? 'Exportando...' : 'Excel' }}</span>
        </button>

      </div>
    </div>

    <!-- ── Nota sexagesimal ───────────────────────────────────────────────── -->
    <div class="px-4 py-1.5 rounded-xl text-[9px] font-medium"
      :class="isDark ? 'bg-[#FF8F00]/10 text-[#FF8F00] border border-[#FF8F00]/20' : 'bg-orange-50 text-orange-700 border border-orange-200'">
      <i class="fas fa-circle-info mr-1.5"></i>
      <strong>NOTA:</strong> Valores en sistema sexagesimal.
      15 min = 0,25 &nbsp;|&nbsp; 30 min = 0,50 &nbsp;|&nbsp; 45 min = 0,75 &nbsp;|&nbsp; 60 min = 1,0
    </div>

    <!-- ── Tabla principal ────────────────────────────────────────────────── -->
    <div class="flex-1 overflow-hidden rounded-xl border flex flex-col transition-all duration-300"
      :class="isDark ? 'bg-[#253045] border-[#253045]' : 'bg-white border-slate-200 shadow-sm'">

      <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
        <table class="w-full border-separate border-spacing-0 text-[10px]">

          <!-- Encabezado -->
          <thead class="sticky top-0 z-30">
            <tr :class="isDark ? 'bg-[#1e293b]' : 'bg-[#334155]'">
              <th colspan="2" class="px-3 py-2 text-center text-[9px] font-black uppercase tracking-wider border-b border-r border-white/10 text-white">
                COLABORADOR
              </th>
              <th class="px-3 py-2 text-center text-[9px] font-black uppercase tracking-wider border-b border-r border-white/10 text-white">
                FECHA
              </th>
              <th colspan="2" class="px-3 py-2 text-center text-[9px] font-black uppercase tracking-wider border-b border-r border-white/10 text-white">
                JORNADA LABORAL
              </th>
              <th colspan="2" class="px-3 py-2 text-center text-[9px] font-black uppercase tracking-wider border-b border-r border-white/10 text-white">
                TIEMPO LABORADO
              </th>
              <th v-for="col in ['RN','RNDF','RDDF','HEDO','HENO','HEFD','HEFN']" :key="col"
                class="px-2 py-2 text-center text-[9px] font-black uppercase tracking-wider border-b border-r border-white/10 text-white w-12">
                {{ col }}
              </th>
              <th class="px-3 py-2 text-center text-[9px] font-black uppercase tracking-wider border-b border-white/10 text-white w-20">
                APROBAR
              </th>
            </tr>
            <tr :class="isDark ? 'bg-[#253045]' : 'bg-[#475569]'">
              <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300 w-28">Cédula</th>
              <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300">Nombre</th>
              <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300 w-24">Fecha</th>
              <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300 w-20">Hora Ini.</th>
              <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300 w-20">Hora Fin</th>
              <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300 w-20">Hora Ini.</th>
              <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300 w-20">Hora Fin</th>
              <th v-for="_ in 7" :key="_"
                class="px-2 py-1.5 text-[8px] font-bold text-center tracking-wider border-b border-r border-white/10 text-slate-400">0</th>
              <th class="px-3 py-1.5 border-b border-white/10 text-slate-300"></th>
            </tr>
          </thead>

          <tbody>
            <!-- Loading skeleton -->
            <tr v-if="isLoading || isCalculating" v-for="n in 8" :key="'sk-'+n">
              <td colspan="15" class="px-3 py-3">
                <div class="h-3 w-full rounded animate-pulse"
                  :class="isDark ? 'bg-white/5' : 'bg-slate-100'"></div>
              </td>
            </tr>

            <!-- Sin datos -->
            <tr v-else-if="!filasPaginadas.length">
              <td colspan="15" class="px-4 py-14 text-center">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center"
                    :class="isDark ? 'bg-white/5' : 'bg-slate-100'">
                    <i class="fas fa-calculator text-xl text-[#FF8F00]"></i>
                  </div>
                  <p class="text-[11px] font-bold uppercase"
                    :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                    Selecciona un rango de fechas y presiona Calcular
                  </p>
                </div>
              </td>
            </tr>

            <!-- Filas de datos -->
            <template v-else v-for="(item, idx) in filasPaginadas" :key="idx">

              <!-- Cabecera empresa -->
              <tr v-if="item.tipo === 'empresa'">
                <td colspan="15"
                  class="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white border-b"
                  :class="isDark ? 'bg-[#1e293b] border-white/10' : 'bg-[#334155] border-slate-600'">
                  <i class="fas fa-building mr-2 opacity-70"></i>{{ item.data.empresa }}
                </td>
              </tr>

              <!-- Fila normal -->
              <tr v-else-if="item.tipo === 'fila'"
                class="group transition-all duration-100"
                :class="[
                  idx % 2 !== 0
                    ? (isDark ? 'bg-white/[0.03]' : 'bg-slate-50/60')
                    : '',
                  isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-orange-50/40'
                ]">

                <td class="px-3 py-2 border-b border-r font-mono text-[9px]"
                  :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-slate-500'">
                  {{ item.data.cedula }}
                </td>

                <td class="px-3 py-2 border-b border-r"
                  :class="isDark ? 'border-white/5' : 'border-slate-100'">
                  <div class="font-bold uppercase"
                    :class="isDark ? 'text-white' : 'text-slate-900'">
                    {{ item.data.nombre }}
                  </div>
                  <div class="text-[8px] mt-0.5"
                    :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                    {{ item.data.cargo || '—' }}
                  </div>
                </td>

                <td class="px-3 py-2 border-b border-r text-center"
                  :class="[isDark ? 'border-white/5' : 'border-slate-100',
                    item.data.es_dominical
                      ? 'text-violet-500 font-black'
                      : (isDark ? 'text-slate-300' : 'text-slate-700')]">
                  <span>{{ formatFecha(item.data.fecha) }}</span>
                  <span v-if="item.data.es_dominical"
                    class="ml-1 text-[7px] font-black bg-violet-500/20 text-violet-500 px-1 rounded">DOM</span>
                </td>

                <td class="px-3 py-2 border-b border-r text-center font-mono"
                  :class="isDark ? 'border-white/5 text-slate-300' : 'border-slate-100 text-slate-700'">
                  {{ item.data.inicio_turno || '—' }}
                </td>
                <td class="px-3 py-2 border-b border-r text-center font-mono"
                  :class="isDark ? 'border-white/5 text-slate-300' : 'border-slate-100 text-slate-700'">
                  {{ item.data.fin_turno || '—' }}
                </td>

                <td class="px-3 py-2 border-b border-r text-center font-mono"
                  :class="isDark ? 'border-white/5 text-emerald-400' : 'border-slate-100 text-emerald-700'">
                  {{ formatHora(item.data.fecha_entrada) || '—' }}
                </td>
                <td class="px-3 py-2 border-b border-r text-center font-mono"
                  :class="isDark ? 'border-white/5 text-emerald-400' : 'border-slate-100 text-emerald-700'">
                  {{ formatHora(item.data.fecha_salida) || '—' }}
                </td>

                <td v-for="col in COLS_HX" :key="col"
                  class="px-2 py-2 border-b border-r text-center"
                  :class="[
                    isDark ? 'border-white/5' : 'border-slate-100',
                    Number(item.data[col]) > 0
                      ? (isDark ? 'text-[#FF8F00] font-black' : 'text-orange-600 font-black')
                      : (isDark ? 'text-slate-600' : 'text-slate-300')
                  ]">
                  {{ formatDecimal(item.data[col]) }}
                </td>

                <td class="px-2 py-2 border-b text-center"
                  :class="isDark ? 'border-white/5' : 'border-slate-100'">
                  <div class="flex items-center justify-center gap-1">
                    <button @click="handleAprobar(item.data.id, true)"
                      class="w-6 h-6 rounded flex items-center justify-center transition-all"
                      :class="item.data.aprobado === true
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : (isDark ? 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50')">
                      <i class="fas fa-check text-[9px]"></i>
                    </button>
                    <button @click="handleAprobar(item.data.id, false)"
                      class="w-6 h-6 rounded flex items-center justify-center transition-all"
                      :class="item.data.aprobado === false
                        ? 'bg-rose-500 text-white shadow-sm'
                        : (isDark ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50')">
                      <i class="fas fa-times text-[9px]"></i>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Subtotal colaborador -->
              <tr v-else-if="item.tipo === 'subtotal'">
                <td colspan="7"
                  class="px-3 py-2 border-b border-r text-[9px] font-black uppercase italic"
                  :class="isDark
                    ? 'bg-[#FF8F00]/10 border-[#FF8F00]/20 text-[#FF8F00]'
                    : 'bg-orange-50 border-orange-200 text-orange-800'">
                  Subtotal — {{ item.data.nombre }}
                </td>
                <td v-for="col in COLS_HX" :key="col"
                  class="px-2 py-2 border-b border-r text-center text-[10px] font-black"
                  :class="isDark
                    ? 'bg-[#FF8F00]/10 border-[#FF8F00]/20 text-[#FF8F00]'
                    : 'bg-orange-50 border-orange-200 text-orange-700'">
                  {{ formatDecimal(item.data.subtotales[col]) }}
                </td>
                <td class="border-b"
                  :class="isDark ? 'bg-[#FF8F00]/10 border-[#FF8F00]/20' : 'bg-orange-50 border-orange-200'">
                </td>
              </tr>

            </template>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="filasAplanadas.length > 0"
        class="px-4 py-2 border-t flex items-center justify-between"
        :class="isDark ? 'border-white/5 bg-[#1a1d2d]' : 'border-slate-200 bg-slate-50'">
        <span class="text-[10px] font-bold uppercase" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Registros: <span :class="isDark ? 'text-white' : 'text-slate-900'">{{ totalRegistros }}</span>
        </span>
        <div class="flex items-center gap-2">
          <button @click="currentPage--" :disabled="currentPage === 1"
            class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all disabled:opacity-20"
            :class="isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'">
            <i class="fas fa-chevron-left text-[9px]"></i>
          </button>
          <div class="px-3 py-1 rounded-lg text-[11px] font-bold border"
            :class="isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'">
            {{ currentPage }} / {{ totalPages }}
          </div>
          <button @click="currentPage++" :disabled="currentPage >= totalPages"
            class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all disabled:opacity-20"
            :class="isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'">
            <i class="fas fa-chevron-right text-[9px]"></i>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue';
import { useReporteMallas } from '../../composables/adminLogica/useReporteMallas';

const props = defineProps({
  isDark: Boolean,
  company: String,
});

const session = JSON.parse(localStorage.getItem('user_session') || '{}');
const isSuperAdmin = session.isSuperAdmin || false;

const {
  registros,
  isLoading,
  isCalculating,
  isExporting,
  startDate,
  endDate,
  filterNombre,
  filterCargo,
  filterDepartamento,
  soloConExtras,
  opcionesCargos,
  opcionesDepartamentos,
  filasPaginadas,
  filasAplanadas,
  currentPage,
  totalPages,
  totalRegistros,
  cargarHistorial,
  calcularYCargar,
  aprobarRegistro,
  exportarExcel,
  formatHora,
  formatFecha,
  formatDecimal,
  COLS_HX,
  hasPerm,
} = useReporteMallas();

async function handleCargar() {
  await cargarHistorial(props.company);
}

async function handleCalcular() {
  try {
    await calcularYCargar(props.company);
  } catch { /* el composable ya loguea */ }
}

async function handleExportar() {
  try {
    await exportarExcel(props.company);
  } catch { /* silencioso */ }
}

async function handleAprobar(id, aprobado) {
  try {
    await aprobarRegistro(id, aprobado);
  } catch { /* silencioso */ }
}

watch(() => props.company, (v) => {
  cargarHistorial(v);
});

onMounted(() => {
  cargarHistorial(props.company);
});
</script>
<style></style>
