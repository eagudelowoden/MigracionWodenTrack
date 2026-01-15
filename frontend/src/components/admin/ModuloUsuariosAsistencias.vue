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

        <button @click="fetchReporte" class="p-1.5 text-slate-500 hover:text-[#FF8F00] transition-colors"
          title="Sincronizar">
          <i class="fas fa-arrows-rotate text-xs" :class="{ 'fa-spin': loading }"></i>
        </button>

        <button @click="downloadReport" :disabled="loading"
          class="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Exportar Reporte">
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
                Estatus
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
                  getStatusClass(item.estado),
                  isDark ? 'bg-opacity-20 border-opacity-30' : 'bg-opacity-10 border-opacity-40'
                ]"
                  class="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-widest transition-all shadow-sm">
                  {{ item.estado || 'OK' }}
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
import { onMounted } from 'vue';
import { useCargarAsistencias } from '../../composables/UserLogica/cargarAsistencias';
import { useAttendance } from '../../composables/UserLogica/useAttendance';
import '../../assets/css/reporteTabla.css';

const { reportData, search, loading, fetchReporte, downloadReport } = useCargarAsistencias();
const { isDark } = useAttendance();

const formatTime = (value) => {
  if (!value) return '--:--'
  return new Date(value).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
const formatDateTime = (value) => {
  if (!value) return '--'

  return new Date(value).toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}


const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('es-CO')
}


onMounted(() => fetchReporte());

const getStatusClass = (status) => {
  if (!status) return 'bg-slate-50 text-slate-400 border-slate-200';
  const s = status.toUpperCase();
  if (s.includes('TARDE')) return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950 dark:text-red-400 dark:border-red-900';
  if (s.includes('TIEMPO') || s.includes('OK')) return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900';
  return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900';
};
</script>