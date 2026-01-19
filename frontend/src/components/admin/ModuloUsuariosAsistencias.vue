<template>
  <div class="novedades-container-main space-y-4 h-full animate-in fade-in duration-500 flex flex-col">

    <div class="flex flex-wrap items-center justify-between gap-4 px-1 shrink-0">
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF8F00]/10 text-[#FF8F00]">
          <i class="fas fa-clipboard-list text-sm"></i>
        </div>
        <h1 class="text-lg font-bold tracking-tight" :class="isDark ? 'text-white' : 'text-slate-800'">
          Novedades
        </h1>
        <div class="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
        <span
          class="text-[10px] font-medium uppercase tracking-widest text-slate-500 hidden sm:flex items-center gap-1.5">
          <i class="fas fa-bolt-lightning text-[9px] text-[#FF8F00]"></i> Odoo Sync
        </span>
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
      :class="isDark ? 'bg-[#1a1d2d] border-[#2d324d] shadow-none' : 'bg-white border-slate-200 shadow-sm'">

      <div class="flex-1 overflow-auto">
        <table class="w-full border-separate border-spacing-0">
          <thead class="sticky top-0 z-10 shadow-sm">
            <tr :class="isDark ? 'bg-[#252a41]' : 'bg-slate-50/80 backdrop-blur-md'">
              <th class="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest border-b"
                :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-slate-500'">
                <div class="flex items-center gap-2"><i class="fas fa-user-circle"></i> Colaborador</div>
              </th>
              <th class="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest border-b"
                :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-slate-500'">
                <div class="flex items-center justify-center gap-2"><i class="fas fa-sign-in-alt"></i> Entrada</div>
              </th>
              <th class="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest border-b"
                :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-slate-500'">
                <div class="flex items-center justify-center gap-2"><i class="fas fa-sign-out-alt"></i> Salida</div>
              </th>
              <th class="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest border-b"
                :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-slate-500'">
                Estatus Entrada
              </th>
              <th class="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest border-b"
                :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-slate-500'">
                Estatus Salida
              </th>
            </tr>
          </thead>

          <tbody class="divide-y" :class="isDark ? 'divide-white/5' : 'divide-slate-100'">
            <tr v-if="loading" v-for="n in 8" :key="'loader-' + n">
              <td colspan="5" class="px-4 py-4">
                <div class="h-4 w-full rounded animate-pulse" :class="isDark ? 'bg-white/5' : 'bg-slate-100'"></div>
              </td>
            </tr>

            <tr v-else v-for="item in paginatedData" :key="item.id" class="group transition-all duration-150"
              :class="isDark ? 'hover:bg-[#252a41]' : 'hover:bg-orange-50/50'">

              <td class="px-4 py-3">
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
              <td class="px-4 py-3 text-center">
                <span class="text-[14px] font-mono font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                  {{ formatDateTime(item.check_in) }}
                </span>
              </td>

              <td class="px-4 py-3 text-center">
                <span class="text-[14px] font-mono font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                  {{ formatDateTime(item.check_out) }}
                </span>
              </td>

              <td class="px-4 py-3 text-right">
                <span :class="[getStatusClass(item.comentario), isDark ? 'bg-opacity-10' : 'bg-opacity-10']"
                  class="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-widest transition-all">
                  {{ item.comentario || 'OK' }}
                </span>
              </td>

              <td class="px-4 py-3 text-right">
                <span :class="[getStatusClass(item.salida), isDark ? 'bg-opacity-10' : 'bg-opacity-10']"
                  class="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-widest transition-all">
                  {{ item.salida || 'OK' }}
                </span>
              </td>
            </tr>

            <tr v-if="!loading && reportData.length === 0">
              <td colspan="5" class="py-20 text-center opacity-30">
                <i class="fas fa-folder-open text-4xl mb-3 block"></i>
                <p class="text-[11px] font-black uppercase tracking-widest">No se encontraron registros</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="reportData.length > 0"
        class="px-4 py-3 border-t flex items-center justify-between shrink-0 transition-colors"
        :class="isDark ? 'border-white/5 bg-[#1a1d2d]' : 'border-slate-100 bg-slate-50/50'">

        <div class="flex items-center gap-4">
          <span class="text-[10px] font-black uppercase tracking-widest opacity-40">
            Total: {{ reportData.length }} registros
          </span>
          <div class="h-3 w-[1px] bg-slate-500/20"></div>
          <span class="text-[10px] font-black uppercase tracking-widest text-[#FF8F00]">
            Página {{ currentPage }} de {{ totalPages }}
          </span>
        </div>

        <div class="flex items-center gap-1.5">
          <button @click="currentPage = 1" :disabled="currentPage === 1"
            class="p-2 rounded-lg border border-transparent hover:bg-slate-500/10 disabled:opacity-10 transition-all">
            <i class="fas fa-angles-left text-[10px]"></i>
          </button>

          <button @click="currentPage--" :disabled="currentPage === 1"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-500/10 hover:bg-[#FF8F00] hover:text-white disabled:opacity-10 transition-all text-[10px] font-black uppercase">
            <i class="fas fa-chevron-left"></i> Anterior
          </button>

          <button @click="currentPage++" :disabled="currentPage >= totalPages"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-500/10 hover:bg-[#FF8F00] hover:text-white disabled:opacity-10 transition-all text-[10px] font-black uppercase">
            Siguiente <i class="fas fa-chevron-right"></i>
          </button>

          <button @click="currentPage = totalPages" :disabled="currentPage === totalPages"
            class="p-2 rounded-lg border border-transparent hover:bg-slate-500/10 disabled:opacity-10 transition-all">
            <i class="fas fa-angles-right text-[10px]"></i>
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
  if (!value) return '--:--:--';
  // Reemplazo para compatibilidad con Safari/Firefox
  const dateUtc = new Date(value.replace(' ', 'T') + 'Z');
  return dateUtc.toLocaleString('es-CO', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
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
  max-height: calc(100vh - 180px);
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