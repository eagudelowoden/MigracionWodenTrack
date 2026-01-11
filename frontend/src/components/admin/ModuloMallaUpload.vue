<template>
  <div class="mesh-container animate-fade-in space-y-6">
    <div
      class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 p-6 rounded-[2rem] border border-dashed"
      :class="isDark ? 'border-slate-600' : 'border-slate-200 shadow-sm bg-white'">

      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-[#FF8F00]/20 rounded-xl flex items-center justify-center text-[#FF8F00]">
          <i class="fas fa-calendar-alt text-xl"></i>
        </div>
        <div>
          <h2 class="text-lg font-black uppercase italic leading-none">Gestión de Mallas</h2>
          <p class="text-[10px] opacity-60 font-bold uppercase tracking-widest">Cargue y visualización de horarios</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center opacity-40">
            <i class="fas fa-search text-xs"></i>
          </span>
          <input v-model="searchQuery" type="text" placeholder="Buscar..." class="search-input"
            :class="isDark ? 'dark-search' : 'light-search'">
        </div>

        <button @click="downloadMallaTemplate" class="btn-download-excel" title="Descargar Plantilla Excel"
          :disabled="isLoadingDownload">
          <i v-if="!isLoadingDownload" class="fas fa-file-excel"></i>
          <i v-else class="fas fa-circle-notch fa-spin"></i>
        </button>

        <input type="file" id="fileInput" class="hidden" accept=".xlsx, .xls" @change="handleFileUpload"
          :disabled="isUploading">
        <label for="fileInput" class="btn-upload flex items-center cursor-pointer"
          :class="{ 'opacity-50 pointer-events-none': isUploading }">
          <i v-if="!isUploading" class="fas fa-file-upload mr-2"></i>
          <i v-else class="fas fa-circle-notch fa-spin mr-2"></i>
          {{ isUploading ? 'Procesando...' : 'Subir Malla' }}
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
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div
        class="bg-white rounded-[2.5rem] max-w-2xl w-full overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 class="text-xl font-black uppercase italic text-slate-900 leading-none">Importación Finalizada</h3>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Reporte detallado de Odoo</p>
          </div>
          <button @click="showResultModal = false"
            class="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-all">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="p-8 max-h-[50vh] overflow-y-auto">
          <div v-if="uploadSuccessMessage" class="flex flex-col items-center py-6 text-center">
            <div
              class="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4 text-3xl shadow-inner">
              <i class="fas fa-check-double"></i>
            </div>
            <p class="font-black text-slate-800 uppercase italic text-lg leading-tight">{{ uploadSuccessMessage }}</p>
            <p class="text-xs font-bold text-slate-400 uppercase mt-2">Los cambios ya están reflejados en el sistema</p>
          </div>

          <div v-if="uploadErrors.length > 0">
            <div
              class="flex items-center gap-3 bg-red-50 text-red-600 p-4 rounded-2xl mb-6 shadow-sm border border-red-100">
              <i class="fas fa-exclamation-triangle text-xl"></i>
              <p class="text-[11px] font-black uppercase leading-tight">
                Se detectaron {{ uploadErrors.length }} inconsistencias.<br>
                <span class="opacity-70">Las siguientes filas no pudieron procesarse:</span>
              </p>
            </div>

            <div class="space-y-2">
              <div v-for="(err, idx) in uploadErrors" :key="idx"
                class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div class="flex items-center gap-4">
                  <div
                    class="w-8 h-8 bg-slate-800 text-white rounded-lg flex items-center justify-center font-black text-xs">
                    {{ err.fila }}
                  </div>
                  <div>
                    <p class="text-[9px] font-black uppercase text-slate-400 leading-none mb-1">Campo: {{ err.campo }}
                    </p>
                    <p class="text-xs font-bold text-red-500 uppercase italic">{{ err.error }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-8 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button @click="showResultModal = false"
            class="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#FF8F00] hover:shadow-lg hover:shadow-[#FF8F00]/30 transition-all">
            Cerrar Reporte
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
