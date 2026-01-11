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

    <div class="table-wrapper" :class="isDark ? 'dark-mode' : 'light-mode'">
      <table class="mesh-table text-left w-full border-collapse">
        <thead>
          <tr class="text-[10px] uppercase opacity-50">
            <th class="p-4">Nombre</th>
            <th class="p-4">C.C.</th>
            <th class="p-4">Nombre de Malla</th>
            <th class="p-4 text-center">Jornada</th>
            <th class="p-4 text-right">Horario</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(persona, index) in filteredMallas" :key="index" class="border-b border-white/5">
            <td class="p-4 font-black uppercase text-[#FF8F00]">{{ persona.nombre }}</td>
            <td class="p-4 font-mono opacity-80 text-xs">{{ persona.cc }}</td>
            <td class="p-4">
              <span
                class="malla-tag text-[10px] font-bold py-1 px-3 bg-white/5 rounded-full border border-white/10 uppercase italic">
                {{ persona.malla }}
              </span>
            </td>
            <td class="p-4 text-center">
              <span class="jornada-badge text-[9px] font-black uppercase py-1 px-3 rounded-lg"
                :class="persona.jornada?.toLowerCase()">
                {{ persona.jornada }}
              </span>
            </td>
            <td class="p-4 text-right font-bold text-xs">{{ persona.horario }}</td>
          </tr>

          <tr v-if="filteredMallas.length === 0 && !isLoading">
            <td colspan="5" class="text-center py-20 opacity-50 italic uppercase font-bold text-[10px] tracking-widest">
              {{ searchQuery ? `Sin resultados para "${searchQuery}"` : 'No hay datos disponibles' }}
            </td>
          </tr>

          <tr v-if="isLoading">
            <td colspan="5" class="text-center py-20">
              <div class="flex flex-col items-center gap-3">
                <i class="fas fa-circle-notch fa-spin text-[#FF8F00] text-3xl"></i>
                <span class="text-[10px] font-black uppercase opacity-60 tracking-[0.2em]">Sincronizando Odoo...</span>
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
