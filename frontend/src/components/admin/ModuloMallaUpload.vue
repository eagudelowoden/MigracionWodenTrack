<template>
  <div class="mesh-container animate-fade-in space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-dashed transition-all"
      :class="isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'">

      <div class="flex items-center gap-3">
        <div class="flex-shrink-0 w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-600">
          <i class="fas fa-calendar-check text-lg"></i>
        </div>
        <div class="leading-tight">
          <h2 class="text-sm font-bold uppercase tracking-tight">Gestión de Mallas</h2>
          <p class="text-[9px] opacity-60 font-semibold uppercase tracking-tighter">Horarios y Cargas</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="relative group">
          <i
            class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[10px] opacity-40 group-focus-within:text-amber-500 transition-colors"></i>
          <input v-model="searchQuery" type="text" placeholder="Buscar..."
            class="pl-8 pr-3 py-1.5 text-xs rounded-lg border bg-transparent focus:ring-1 focus:ring-amber-500 outline-none transition-all w-32 md:w-44"
            :class="isDark ? 'border-slate-700' : 'border-slate-200'">
        </div>

        <button @click="downloadMallaTemplate"
          class="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"
          title="Descargar Excel">
          <i :class="isLoadingDownload ? 'fas fa-circle-notch fa-spin' : 'fas fa-file-excel'"></i>
        </button>

        <input type="file" id="fileInput" class="hidden" @change="handleFileUpload" :disabled="isUploading">
        <label for="fileInput"
          class="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50"
          :class="{ 'opacity-50 pointer-events-none': isUploading }">
          <i :class="isUploading ? 'fas fa-circle-notch fa-spin' : 'fas fa-cloud-arrow-up'"></i>
          <span>{{ isUploading ? '...' : 'Subir' }}</span>
        </label>
      </div>
    </div>

<div class="table-wrapper overflow-hidden rounded-xl border transition-all duration-300"
     :class="isDark ? 'bg-[#1a1d2d] border-[#2d324d] shadow-none' : 'bg-white border-slate-200 shadow-sm'">
  
  <table class="w-full border-separate border-spacing-0">
    <thead>
      <tr :class="isDark ? 'bg-[#252a41]' : 'bg-slate-50/50'">
        <th class="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] border-b transition-colors"
            :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-black/40'">
          <div class="flex items-center gap-2"><i class="fas fa-user-circle text-[9px]"></i> Nombre</div>
        </th>
        <th class="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] border-b transition-colors"
            :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-black/40'">
          <div class="flex items-center gap-2"><i class="fas fa-fingerprint text-[9px]"></i> ID</div>
        </th>
        <th class="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] border-b transition-colors"
            :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-black/40'">
          <div class="flex items-center gap-2"><i class="fas fa-project-diagram text-[9px]"></i> Malla</div>
        </th>
        <th class="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.15em] border-b transition-colors"
            :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-black/40'">
          Jornada
        </th>
        <th class="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.15em] border-b transition-colors"
            :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-black/40'">
          <div class="flex items-center justify-end gap-2"><i class="fas fa-clock-rotate-left text-[9px]"></i> Horario</div>
        </th>
      </tr>
    </thead>
    
    <tbody class="divide-y" :class="isDark ? 'divide-white/5' : 'divide-slate-100'">
      
      <tr v-if="isLoading" v-for="n in 5" :key="'loader-'+n">
        <td colspan="5" class="p-4">
          <div class="h-4 w-full rounded animate-pulse" :class="isDark ? 'bg-white/5' : 'bg-slate-100'"></div>
        </td>
      </tr>

      <tr v-else v-for="(persona, index) in filteredMallas" :key="index" 
          class="group transition-colors duration-150"
          :class="isDark ? 'hover:bg-[#252a41]' : 'hover:bg-slate-50/80'">
        
        <td class="px-4 py-3">
          <span class="text-[12px] font-bold uppercase tracking-tight transition-colors"
                :class="isDark ? 'text-slate-100' : 'text-black'">
            {{ persona.nombre }}
          </span>
        </td>

        <td class="px-4 py-3">
          <span class="font-mono text-[11px] opacity-40 transition-opacity group-hover:opacity-100"
                :class="isDark ? 'text-slate-400' : 'text-black'">
            {{ persona.cc }}
          </span>
        </td>

        <td class="px-4 py-3">
          <span class="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold border italic uppercase"
                :class="isDark 
                  ? 'bg-white/5 border-white/10 text-slate-400' 
                  : 'bg-slate-50 border-slate-200 text-slate-600'">
            {{ persona.malla }}
          </span>
        </td>

        <td class="px-4 py-3 text-center">
          <span class="inline-flex items-center justify-center gap-1.5 w-24 py-1 rounded text-[9px] font-black uppercase tracking-wider border transition-all"
                :class="[
                  persona.jornada?.toLowerCase(),
                  isDark ? 'bg-opacity-20 border-opacity-30' : 'bg-opacity-10 border-opacity-40'
                ]">
            <i :class="{
              'fas fa-sun': persona.jornada?.toLowerCase().includes('mañana'),
              'fas fa-cloud-sun': persona.jornada?.toLowerCase().includes('tarde'),
              'fas fa-moon': persona.jornada?.toLowerCase().includes('noche'),
              'fas fa-circle': !persona.jornada
            }" class="text-[8px]"></i>
            {{ persona.jornada }}
          </span>
        </td>

        <td class="px-4 py-3 text-right">
          <span class="text-xs font-bold font-mono tracking-tighter"
                :class="isDark ? 'text-slate-100' : 'text-black'">
            {{ persona.horario }}
          </span>
        </td>
      </tr>

      <tr v-if="filteredMallas.length === 0 && !isLoading">
        <td colspan="5" class="py-16 text-center">
          <div class="flex flex-col items-center gap-2" :class="isDark ? 'text-slate-500' : 'text-black/20'">
            <i class="fas fa-folder-open text-2xl opacity-20"></i>
            <span class="text-[10px] font-bold uppercase tracking-[0.2em]">
               {{ searchQuery ? `Sin resultados para "${searchQuery}"` : 'Sin datos disponibles' }}
            </span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>

    <div v-if="showResultModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">

      <div
        class="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-700/50 animate-in zoom-in-95 duration-300">

        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 class="text-sm font-bold uppercase tracking-tight text-slate-800 dark:text-slate-100">Importación
              Finalizada</h3>
            <p class="text-[10px] text-slate-400 font-medium uppercase">Reporte de Sistema</p>
          </div>
          <button @click="showResultModal = false"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <i class="fas fa-xmark text-lg"></i>
          </button>
        </div>

        <div class="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">

          <div v-if="uploadSuccessMessage"
            class="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 mb-4">
            <div
              class="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <i class="fas fa-check text-sm"></i>
            </div>
            <div>
              <p
                class="text-xs font-bold text-emerald-900 dark:text-emerald-400 uppercase tracking-tight leading-tight">
                {{ uploadSuccessMessage }}</p>
              <p class="text-[10px] text-emerald-600/70 font-medium uppercase mt-0.5">Sincronización completa</p>
            </div>
          </div>

          <div v-if="uploadErrors.length > 0" class="mt-4">
            <div class="flex items-center gap-2 mb-4 px-1">
              <i class="fas fa-microchip text-red-500 text-xs"></i>
              <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Log de errores de
                validación</span>
            </div>

            <div class="space-y-3 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
              <div v-for="(err, idx) in uploadErrors" :key="idx"
                class="relative overflow-hidden group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all hover:border-red-500/50 shadow-sm">

                <div class="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>

                <div class="p-4">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <span
                        class="flex items-center justify-center bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                        FILA {{ err.fila || '?' }}
                      </span>
                      <span class="text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                        Módulo: <span class="text-slate-900 dark:text-slate-200">{{ err.campo || 'General' }}</span>
                      </span>
                    </div>
                    <span
                      class="text-[9px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100 uppercase">
                      Conflicto
                    </span>
                  </div>

                  <div
                    class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-dashed border-slate-200 dark:border-slate-700">
                    <div class="flex gap-2">
                      <i class="fas fa-terminal text-[10px] text-slate-400 mt-1"></i>
                      <p class="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                        {{ err.error || 'Ocurrió un error inesperado en esta fila.' }}
                      </p>
                    </div>
                  </div>

                  <div v-if="err.valor_enviado" class="mt-3 flex items-center gap-2 text-[10px]">
                    <span class="font-bold text-slate-400 uppercase tracking-tighter">Dato recibido:</span>
                    <code
                      class="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 rounded border border-amber-100 dark:border-amber-800 font-mono">
            "{{ err.valor_enviado }}"
          </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end">
          <button @click="showResultModal = false"
            class="group flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-amber-500 dark:hover:bg-amber-500 hover:text-white transition-all shadow-md">
            <span>Cerrar Reporte</span>
            <i class="fas fa-arrow-right text-[9px] group-hover:translate-x-1 transition-transform"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
// 1. Importamos la función del composable
import { useMallasGeneral } from '../../composables/adminLogica/mallasGeneral.js';

// Estilos
import '../../assets/css/modulo-mallas.css';
import '../../assets/css/subirMallas.css';

const props = defineProps({
  isDark: Boolean
});

// 2. Extraemos las piezas que necesitamos (Destructuring)
const {
  searchQuery,
  isLoading,
  isLoadingDownload,
  isUploading,
  uploadErrors,
  uploadSuccessMessage,
  showResultModal,
  filteredMallas, // <-- Usamos la versión filtrada para el v-for
  fetchMallasDesdeOdoo,
  downloadMallaTemplate,
  handleFileUpload
} = useMallasGeneral();

// 3. Solo dejamos el onMounted para arrancar
onMounted(() => {
  fetchMallasDesdeOdoo();
});
</script>
