<template>
  <div class="novedades-container-main space-y-4 h-full animate-in fade-in duration-500">

    <div class="flex items-center justify-between px-1 shrink-0">
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF8F00]/10 text-[#FF8F00]">
          <i class="fas fa-clipboard-list text-sm"></i>
        </div>

        <h1 class="text-lg font-bold tracking-tight" :class="isDark ? 'text-white' : 'text-slate-800'">
          Novedades
        </h1>
        <div class="h-4 w-[1px] bg-slate-300 dark:bg-slate-700"></div>

        <span class="text-[10px] font-medium uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <i class="fas fa-bolt-lightning text-[9px] text-[#FF8F00]"></i> Odoo Sync
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button @click="filterHoy = !filterHoy"
          :class="filterHoy ? 'bg-[#FF8F00] text-white border-[#FF8F00]' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all"
          title="Filtrar solo hoy">
          <i class="fas" :class="filterHoy ? 'fa-calendar-check' : 'fa-calendar'"></i>
          HOY
        </button>

        <div :class="{ 'opacity-40 pointer-events-none': filterHoy }"
          class="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-opacity">
          <span class="text-[12px] text-slate-400">Desde</span>
          <input v-model="startDate" type="date" title="Desde"
            class="bg-transparent text-[12px] outline-none text-slate-600 dark:text-slate-300 w-28">
          <span class="text-[12px] text-slate-400">Hasta</span>
          <input v-model="endDate" type="date" title="Hasta"
            class="bg-transparent text-[12px] outline-none text-slate-600 dark:text-slate-300 w-28">
        </div>

        <div class="relative group">
          <select v-model="selectedDepartment"
            class="pl-3 pr-8 py-1.5 text-xs rounded border outline-none appearance-none cursor-pointer shadow-sm w-36"
            :class="isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-[#FF8F00]' : 'bg-white border-slate-200 text-slate-600 focus:border-[#FF8F00]'">
            <option value="">Departamentos</option>
            <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
          </select>
          <i
            class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none text-slate-400"></i>
        </div>

        <div class="relative group">
          <input v-model="search" type="text" placeholder="Buscar colaborador..."
            class="pl-8 pr-3 py-1.5 text-xs rounded border outline-none w-44 shadow-sm"
            :class="isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-[#FF8F00]' : 'bg-white border-slate-200 text-slate-600 focus:border-[#FF8F00]'">
          <i class="fas fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400"></i>
        </div>

        <button @click="clearFilters" class="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
          title="Limpiar filtros">
          <i class="fas fa-filter-circle-xmark text-xs"></i>
        </button>

        <div class="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1"></div>

        <button @click="fetchReporte" class="p-1.5 text-slate-500 hover:text-[#FF8F00] transition-colors"
          title="Actualizar datos">
          <i class="fas fa-arrows-rotate text-xs" :class="{ 'fa-spin': loading }"></i>
        </button>

        <button @click="downloadReport" :disabled="loading || reportData.length === 0"
          class="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all active:scale-95 disabled:opacity-50"
          title="Exportar Excel">
          <i :class="loading ? 'fas fa-circle-notch fa-spin' : 'fas fa-file-excel'"></i>
        </button>
      </div>
    </div>

    <div class="table-wrapper overflow-hidden rounded-xl border transition-all duration-300"
      :class="isDark ? 'bg-[#1a1d2d] border-[#2d324d] shadow-none' : 'bg-white border-slate-200 shadow-sm'">

      <div class="overflow-x-auto">
        <table class="w-full border-separate border-spacing-0">
          <thead>
            <tr :class="isDark ? 'bg-[#252a41]' : 'bg-slate-50/50'">
              <th
                class="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] border-b transition-colors"
                :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-black/40'">
                <div class="flex items-center gap-2"><i class="fas fa-user-circle text-[9px]"></i> Colaborador</div>
              </th>
              <th
                class="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.15em] border-b transition-colors"
                :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-black/40'">
                <div class="flex items-center justify-center gap-2"><i class="fas fa-sign-in-alt text-[9px]"></i>
                  Entrada</div>
              </th>
              <th
                class="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.15em] border-b transition-colors"
                :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-black/40'">
                <div class="flex items-center justify-center gap-2"><i class="fas fa-sign-out-alt text-[9px]"></i>
                  Salida</div>
              </th>
              <th
                class="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.15em] border-b transition-colors"
                :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-black/40'">
                Estatus Salida
              </th>
              <th
                class="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.15em] border-b transition-colors"
                :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-black/40'">
                Estatus Entrada
              </th>
            </tr>
          </thead>

          <tbody class="divide-y" :class="isDark ? 'divide-white/5' : 'divide-slate-100'">

            <tr v-if="loading && !reportData.length" v-for="n in 5" :key="'loader-' + n">
              <td colspan="4" class="p-4">
                <div class="h-5 w-full rounded animate-pulse" :class="isDark ? 'bg-white/5' : 'bg-slate-100'"></div>
              </td>
            </tr>

            <tr v-else v-for="item in reportData" :key="item.id" class="group transition-colors duration-150"
              :class="isDark ? 'hover:bg-[#252a41]' : 'hover:bg-slate-50/80'">

              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="shrink-0 transition-opacity group-hover:opacity-100 opacity-30">
                    <i class="far fa-circle-user text-base" :class="isDark ? 'text-slate-300' : 'text-black'"></i>
                  </div>
                  <div class="flex flex-col truncate">
                    <span class="text-[11px] font-bold uppercase tracking-tight transition-colors"
                      :class="isDark ? 'text-slate-100' : 'text-black'">
                      {{ item.empleado }}
                    </span>
                    <span class="text-[9px] font-medium opacity-60 flex items-center gap-1"
                      :class="isDark ? 'text-emerald-400' : 'text-emerald-600'">
                      <i class="fas fa-building text-[8px]"></i> {{ item.department_id }}
                    </span>
                    <span class="text-[9px] font-mono opacity-40 tracking-tighter"
                      :class="isDark ? 'text-slate-400' : 'text-black'">
                      ID: {{ item.id }}
                    </span>
                  </div>
                </div>
              </td>


              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-2">
                  <i class="far fa-clock text-[10px] text-emerald-500 opacity-70"></i>

                  <span class="text-xs font-bold font-mono tracking-tighter"
                    :class="isDark ? 'text-slate-100' : 'text-black'">
                    {{ formatDateTime(item.check_in) }}
                  </span>
                </div>
              </td>


              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-2">
                  <i class="far fa-clock text-[10px] text-rose-500 opacity-70"></i>

                  <span class="text-xs font-bold font-mono tracking-tighter"
                    :class="isDark ? 'text-slate-100' : 'text-black'">
                    {{ formatDateTime(item.check_out) }}
                  </span>
                </div>
              </td>


              <td class="px-4 py-3 text-right">
                <span :class="[
                  getStatusClass(item.comentario),
                  isDark ? 'bg-opacity-20 border-opacity-30' : 'bg-opacity-10 border-opacity-40'
                ]"
                  class="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-widest transition-all shadow-sm">
                  {{ item.comentario || 'OK' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <span :class="[
                  getStatusClass(item.salida),
                  isDark ? 'bg-opacity-20 border-opacity-30' : 'bg-opacity-10 border-opacity-40'
                ]"
                  class="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-widest transition-all shadow-sm">
                  {{ item.salida || 'OK' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, watch } from 'vue'; // Importante importar watch
import { useCargarAsistencias } from '../../composables/UserLogica/cargarAsistencias';
import { useAttendance } from '../../composables/UserLogica/useAttendance';
import '../../assets/css/reporteTabla.css';

// 1. Definir Props
const props = defineProps({
  isDark: Boolean,
  company: String
});

// 2. Extraer lógica del Composable (DEBE IR ANTES DE USARSE)
const {
  reportData,
  search,
  selectedDepartment,
  startDate,
  endDate,
  departments,
  loading,
  fetchReporte,
  filterHoy,
  downloadReport,
  clearFilters,
  selectedCompany // Asegúrate que tu composable exporte esto
} = useCargarAsistencias();

const { isDark: isDarkTheme } = useAttendance();

// 3. Vigilar cambios en la compañía (Prop que viene del Header)
watch(() => props.company, (newCompany) => {
  if (selectedCompany) selectedCompany.value = newCompany;
  fetchReporte();
});

// 4. Ciclo de vida (Un solo onMounted)
onMounted(() => {
  if (props.company && selectedCompany) {
    selectedCompany.value = props.company;
  }
  fetchReporte();
});

// --- FORMATEADORES ---
const formatDateTime = (value) => {
  if (!value) return '--';
  const dateUtc = new Date(value.replace(' ', 'T') + 'Z');
  return dateUtc.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

const getStatusClass = (status) => {
  if (!status) return 'bg-slate-50 text-slate-400 border-slate-200';
  const s = status.toUpperCase();
  if (s.includes('TARDE')) return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950 dark:text-red-400 dark:border-red-900';
  if (s.includes('TIEMPO') || s.includes('OK')) return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900';
  return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900';
};
</script>