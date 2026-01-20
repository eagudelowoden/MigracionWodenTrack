<template>
  <div class="novedades-container-main space-y-1 h-full animate-in fade-in duration-500 flex flex-col">

    <div class="flex flex-wrap items-center justify-between gap-1 px-1 shrink-0">
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-7 h-8 rounded-lg bg-[#FF8F00]/10 text-[#FF8F00]">
          <i class="fas fa-clipboard-list text-sm"></i>
        </div>
        <h2 class="text-lg font-bold tracking-tight" :class="isDark ? 'text-white' : 'text-slate-800'">
          Asistencias
        </h2>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button @click="filterHoy = !filterHoy"
          :class="filterHoy ? 'bg-[#FF8F00] text-white border-[#FF8F00]' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all hover:scale-105 active:scale-95"
          title="Filtrar solo hoy">
          <i class="fas" :class="filterHoy ? 'fa-calendar-check' : 'fa-calendar'"></i>
          HOY
        </button>

        <div :class="{ 'opacity-40 pointer-events-none grayscale': filterHoy }"
          class="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-all">
          <span class="text-[12px] text-slate-400 uppercase font-bold">Desde</span>
          <input v-model="startDate" type="date"
            class="bg-transparent text-[13px] outline-none text-slate-600 dark:text-slate-300 w-28 cursor-pointer">
          <div class="w-[1px] h-3 bg-slate-300 dark:bg-slate-600"></div>
          <span class="text-[12px] text-slate-400 uppercase font-bold">Hasta</span>
          <input v-model="endDate" type="date"
            class="bg-transparent text-[13px] outline-none text-slate-600 dark:text-slate-300 w-28 cursor-pointer">
        </div>

        <div class="relative group">
          <select v-model="selectedDepartment"
            class="pl-3 pr-8 py-1.5 text-[11px] font-bold uppercase rounded border outline-none appearance-none cursor-pointer shadow-sm w-40 transition-all"
            :class="isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-[#FF8F00]' : 'bg-white border-slate-200 text-slate-600 focus:border-[#FF8F00]'">
            <option value="">DEPARTAMENTOS</option>
            <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
          </select>
          <i
            class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none text-slate-400"></i>
        </div>

        <div class="relative group">
          <input v-model="search" type="text" placeholder="BUSCAR COLABORADOR..."
            class="pl-8 pr-3 py-1.5 text-[11px] font-bold uppercase rounded border outline-none w-48 shadow-sm transition-all"
            :class="isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-[#FF8F00]' : 'bg-white border-slate-200 text-slate-600 focus:border-[#FF8F00]'">
          <i class="fas fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400"></i>
        </div>

        <button @click="clearFilters" class="p-2 text-slate-400 hover:text-rose-500 transition-colors"
          title="Limpiar filtros">
          <i class="fas fa-filter-circle-xmark text-sm"></i>
        </button>

        <div class="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1"></div>

        <button @click="fetchReporte" class="p-2 text-slate-500 hover:text-[#FF8F00] transition-colors"
          title="Actualizar datos">
          <i class="fas fa-arrows-rotate text-sm" :class="{ 'fa-spin': loading }"></i>
        </button>

        <button @click="downloadReport" :disabled="loading || reportData.length === 0"
          class="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all active:scale-95 disabled:opacity-50 shadow-sm"
          title="Exportar Excel">
          <i :class="loading ? 'fas fa-circle-notch fa-spin' : 'fas fa-file-excel'"></i>
        </button>
      </div>
    </div>

    <div class="table-wrapper flex-1 overflow-hidden rounded-xl border flex flex-col transition-all duration-300"
      :class="isDark ? 'bg-[#1a1d2d] border-[#2d324d]' : 'bg-white border-slate-200 shadow-sm'">

      <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar ">
        <table class="w-full border-separate border-spacing-0">
          <thead class="sticky top-0 z-30 shadow-md">
            <tr :class="isDark ? 'bg-[#2D3A5F]' : 'bg-[#3B4C7A]'">
              <th
                class="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                <div class="flex items-center gap-2">
                  <i class="fas fa-user-circle text-[9px] opacity-60"></i> Colaborador
                </div>
              </th>
              <th
                class="px-4 py-4 text-center text-[10px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                <div class="flex items-center justify-center gap-2">
                  <i class="fas fa-sign-in-alt text-[9px] opacity-60"></i> Entrada
                </div>
              </th>
              <th
                class="px-4 py-4 text-center text-[10px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                <div class="flex items-center justify-center gap-2">
                  <i class="fas fa-sign-out-alt text-[9px] opacity-60"></i> Salida
                </div>
              </th>
              <th
                class="px-4 py-4 text-right text-[10px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                Estatus Entrada
              </th>
              <th
                class="px-10 py-4 text-right text-[10px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                Estatus Salida
              </th>
            </tr>
          </thead>

          <tbody class="divide-y-0">
            <tr v-if="loading" v-for="n in 8" :key="'loader-' + n">
              <td colspan="5" class="px-4 py-4">
                <div class="h-4 w-full rounded animate-pulse" :class="isDark ? 'bg-white/5' : 'bg-slate-100'"></div>
              </td>
            </tr>

            <tr v-else v-for="(item, index) in paginatedData" :key="item.id" class="group transition-all duration-150"
              :class="[
                index % 2 !== 0
                  ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-100/80')
                  : 'bg-transparent',
                isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-orange-50/50'
              ]">

              <td class="px-4 py-3 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                <div class="flex items-center gap-3">
                  <div
                    class="avatar-mini w-8 h-8 rounded-full bg-slate-500/20 flex items-center justify-center shrink-0">
                    <i class="fas fa-user text-[10px]" :class="isDark ? 'text-slate-300' : 'text-slate-500'"></i>
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-[11px] font-bold uppercase tracking-wider leading-none mb-1"
                      :class="isDark ? 'text-white' : 'text-slate-800'">
                      {{ item.empleado }}
                    </span>
                    <span class="text-[9px] font-semibold flex items-center gap-1.5 uppercase tracking-wide"
                      :class="isDark ? 'text-orange-400/90' : 'text-orange-600'">
                      <i class="fas fa-tag text-[7px]"></i>
                      {{ item.department_id || 'Sin Departamento' }}
                    </span>
                  </div>
                </div>
              </td>

              <td class="px-4 py-3 text-center border-b font-mono font-bold text-[13px]"
                :class="[isDark ? 'border-white/5 text-slate-300' : 'border-slate-100 text-slate-600']">
                {{ formatDateTime(item.check_in) }}
              </td>

              <td class="px-4 py-3 text-center border-b font-mono font-bold text-[13px]"
                :class="[isDark ? 'border-white/5 text-slate-300' : 'border-slate-100 text-slate-600']">
                {{ formatDateTime(item.check_out) }}
              </td>

              <td class="px-4 py-3 text-right border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                <span :class="[getStatusClass(item.c_entrada), isDark ? 'bg-opacity-10' : 'bg-opacity-10']"
                  class="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-widest transition-all">
                  {{ item.c_entrada || 'OK' }}
                </span>
              </td>

              <td class="px-4 py-3 text-right border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                <span :class="[getStatusClass(item.c_salida), isDark ? 'bg-opacity-10' : 'bg-opacity-10']"
                  class="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-widest transition-all">
                  {{ item.c_salida || 'OK' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="paginatedData?.length"
        class="px-4 py-1.5 border-t flex items-center justify-between shrink-0 transition-colors z-40"
        :class="isDark ? 'border-white/5 bg-[#1a1d2d]' : 'border-slate-100 bg-white'">

        <span class="text-[9px] font-black uppercase tracking-tighter opacity-90"
          :class="isDark ? 'text-[#5858E8]' : 'text-slate-500'">
          Total: {{ reportData.length }} <span class="hidden sm:inline">registros</span>
        </span>

        <div class="flex items-center gap-2">
          <button @click="currentPage--" :disabled="currentPage === 1"
            class="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-500/10 disabled:opacity-5 transition-all">
            <i class="fas fa-chevron-left text-[8px]"></i>
          </button>

          <div class="flex items-center px-2 py-0.5 rounded bg-slate-500/5 border border-slate-500/10 font-mono">
            <span class="text-[10px] font-black" :class="isDark ? 'text-white' : 'text-slate-800'">{{ currentPage
            }}</span>
            <span class="text-[9px] mx-1 opacity-90">/</span>
            <span class="text-[9px] font-bold opacity-90">{{ totalPages }}</span>
          </div>

          <button @click="currentPage++" :disabled="currentPage >= totalPages"
            class="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-500/10 disabled:opacity-5 transition-all">
            <i class="fas fa-chevron-right text-[8px]"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, ref, computed } from 'vue';
import { useCargarAsistencias } from '../../composables/UserLogica/cargarAsistencias';
import { useAttendance } from '../../composables/UserLogica/useAttendance';
import '../../assets/css/reporteTabla.css';

const props = defineProps({
  isDark: Boolean,
  company: String
});

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
  selectedCompany
} = useCargarAsistencias();

const { isDark: isDarkTheme } = useAttendance();

// --- LÓGICA DE PAGINACIÓN ---
const currentPage = ref(1);
const itemsPerPage = ref(15); // Aumentado un poco para aprovechar pantallas grandes

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return reportData.value.slice(start, end);
});

const totalPages = computed(() => Math.max(1, Math.ceil(reportData.value.length / itemsPerPage.value)));

// Resetear a pág 1 si cambian los filtros
watch([reportData, search, selectedDepartment, filterHoy, startDate, endDate], () => {
  currentPage.value = 1;
});

// Sincronizar compañía del header con la lógica
watch(() => props.company, (newCompany) => {
  if (selectedCompany) selectedCompany.value = newCompany;
  fetchReporte();
});

onMounted(() => {
  if (props.company && selectedCompany) {
    selectedCompany.value = props.company;
  }
  fetchReporte();
});

// --- HELPERS ---
const formatDateTime = (value) => {
  if (!value || value === 'N/A') return '--/--/-- --:--';
  
  // 1. Ajustamos el desfase de Odoo (UTC a Local)
  const dateUtc = new Date(value.replace(' ', 'T') + 'Z');
  
  // 2. Usamos toLocaleString (en lugar de toLocaleTimeString)
  return dateUtc.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true // Cambia a false si prefieres formato 24h
  });
}

const getStatusClass = (status) => {
  if (!status || status.toUpperCase() === 'OK')
    return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';

  const s = status.toUpperCase();
  if (s.includes('TARDE') || s.includes('INCUMPLIDO'))
    return 'bg-rose-500/10 text-rose-600 border-rose-500/20';

  return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
};
</script>

<style scoped>
/* Transición suave para los cambios de página */
.table-wrapper {
  max-height: calc(107vh - 180px);
}

input[type="date"]::-webkit-calendar-picker-indicator {
  cursor: pointer;
  filter: invert(0.5);
}

.dark input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
}

/* Animación de entrada */
.animate-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>