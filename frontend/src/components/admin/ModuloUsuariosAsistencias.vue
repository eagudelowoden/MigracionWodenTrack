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
        <div class="relative group">
          <input v-model="search" type="text" placeholder="Buscar..." 
            class="pl-8 pr-3 py-1.5 text-xs rounded border outline-none transition-all w-48 shadow-sm"
            :class="isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-[#FF8F00]' : 'bg-white border-slate-200 text-slate-600 focus:border-[#FF8F00]'">
          <i class="fas fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400"></i>
        </div>

        <button @click="fetchReporte" class="p-1.5 text-slate-500 hover:text-[#FF8F00] transition-colors" title="Sincronizar">
          <i class="fas fa-arrows-rotate text-xs" :class="{ 'fa-spin': loading }"></i>
        </button>

<button 
  @click="downloadReport" 
  :disabled="loading"
  class="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
  title="Exportar Reporte"
>
  <i :class="loading ? 'fas fa-circle-notch fa-spin' : 'fas fa-file-excel'"></i>
</button>

      </div>
    </div>

    <div class="table-wrapper shadow-sm" :class="isDark ? 'dark-mode bg-slate-900/40' : 'bg-white border-slate-200 border'">
      <div class="table-responsive-container">
        <table class="novedades-table">
          <thead>
            <tr>
              <th class="w-[40%]">Colaborador</th>
              <th class="w-[20%]">Entrada</th>
              <th class="w-[20%]">Salida</th>
              <th class="w-[20%] text-right">Estatus</th>
            </tr>
          </thead>
          
          <tbody :class="isDark ? 'text-slate-300' : 'text-slate-600'">
            <tr v-for="item in reportData" :key="item.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
              
              <td>
                <div class="flex items-center gap-3">
                  <div class="shrink-0 text-slate-400">
                    <i class="far fa-circle-user text-lg"></i>
                  </div>
                  <div class="flex flex-col truncate">
                    <span class="font-semibold uppercase text-[11px] truncate" :class="isDark ? 'text-slate-100' : 'text-slate-700'">
                      {{ item.empleado }}
                    </span>
                    <span class="text-[9px] opacity-60 font-medium tracking-tight">ID: {{ item.id }}</span>
                  </div>
                </div>
              </td>

              <td class="text-center">
                <div class="flex items-center justify-center gap-2">
                  <i class="far fa-clock text-[10px] text-emerald-500 opacity-70"></i>
                  <span class="time-text">{{ item.check_in || '--:--' }}</span>
                </div>
              </td>

              <td class="text-center">
                <div class="flex items-center justify-center gap-2">
                  <i class="far fa-clock text-[10px] text-rose-500 opacity-70"></i>
                  <span class="time-text">{{ item.check_out || '--:--' }}</span>
                </div>
              </td>

              <td class="text-right">
                <span :class="getStatusClass(item.estado)" 
                  class="px-2 py-0.5 rounded text-[9px] font-bold uppercase border tracking-tight">
                  {{ item.estado || 'OK' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="loading && !reportData.length" class="py-12 flex flex-col items-center justify-center gap-2">
          <i class="fas fa-circle-notch fa-spin text-[#FF8F00] text-xl"></i>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronizando...</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted } from 'vue';
import { useCargarAsistencias } from '../../composables/UserLogica/cargarAsistencias';
import { useAttendance } from '../../composables/UserLogica/useAttendance'; 
import '../../assets/css/reporteTabla.css';

const { reportData, search, loading, fetchReporte, downloadReport } = useCargarAsistencias();
const { isDark } = useAttendance();

onMounted(() => fetchReporte());

const getStatusClass = (status) => {
  if (!status) return 'bg-slate-50 text-slate-400 border-slate-200';
  const s = status.toUpperCase();
  if (s.includes('TARDE')) return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950 dark:text-red-400 dark:border-red-900';
  if (s.includes('TIEMPO') || s.includes('OK')) return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900';
  return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900';
};
</script>