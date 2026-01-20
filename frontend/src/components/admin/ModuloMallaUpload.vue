<template>
  <div class="mesh-container space-y-4 flex flex-col h-full overflow-hidden animate-fade-in">

    <div
      class="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl border border-dashed transition-all shrink-0"
      :class="isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'">
      <div class="flex items-center gap-3">
        <div
          class="flex-shrink-0 w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-600 border border-amber-500/20">
          <i class="fas fa-calendar-check text-sm"></i>
        </div>
        <div class="leading-tight">
          <h2 class="text-xs font-black uppercase tracking-tight" :class="isDark ? 'text-white' : 'text-slate-800'">
            Mallas
          </h2>
          <p class="text-[9px] text-amber-500 font-bold uppercase tracking-tighter">Horarios</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="relative">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400"></i>
          <input v-model="searchQuery" type="text" placeholder="BUSCAR..."
            class="pl-8 pr-3 py-1.5 text-[11px] font-bold uppercase rounded-lg border bg-transparent outline-none w-32 md:w-44"
            :class="isDark ? 'border-slate-700 text-white focus:border-amber-500' : 'border-slate-200 text-slate-700 focus:border-amber-500'" />
        </div>

        <button @click="downloadMallaTemplate"
          class="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
          <i :class="isLoadingDownload ? 'fas fa-spinner fa-spin' : 'fas fa-file-excel'"></i>
        </button>

        <input type="file" id="fileInput" class="hidden" @change="handleFileUpload" :disabled="isUploading" />
        <label for="fileInput"
          class="flex items-center gap-2 px-4 py-1.5 bg-slate-900 dark:bg-amber-500 text-white text-[10px] font-black uppercase rounded-lg cursor-pointer hover:opacity-90 transition-all active:scale-95 shadow-md"
          :class="{ 'opacity-50 pointer-events-none': isUploading }">
          <i :class="isUploading ? 'fas fa-spinner fa-spin' : 'fas fa-cloud-arrow-up'"></i>
          <span>{{ isUploading ? 'Cargando' : 'Subir' }}</span>
        </label>
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
                class="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                <div class="flex items-center gap-2">
                  <i class="fas fa-fingerprint text-[9px] opacity-60"></i> Cargo
                </div>
              </th>
              <th
                class="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                <div class="flex items-center gap-2">
                  <i class="fas fa-layer-group text-[9px] opacity-60"></i> Malla
                </div>
              </th>
              <th
                class="px-4 py-4 text-center text-[10px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                Jornada
              </th>
              <th
                class="px-4 py-4 text-right text-[10px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                <div class="flex items-center justify-end gap-2">
                  <i class="fas fa-clock text-[9px] opacity-60"></i> Horario
                </div>
              </th>
            </tr>
          </thead>

          <tbody class="divide-y-0">
            <tr v-if="isLoading" v-for="n in 5" :key="'loader-' + n">
              <td colspan="5" class="px-4 py-4">
                <div class="h-4 w-full rounded animate-pulse bg-slate-500/10"></div>
              </td>
            </tr>

            <tr v-else v-for="(persona, index) in paginatedMallas" :key="index"
              class="group transition-all duration-150" :class="[
                index % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-100/80') : 'bg-transparent',
                isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-slate-100'
              ]">
              <td class="px-4 py-3 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                <span class="text-[11px] font-bold uppercase" :class="isDark ? 'text-white' : 'text-slate-700'">
                  {{ persona.nombre }}
                </span>
              </td>

              <td class="px-4 py-3 border-b font-mono text-[13px]"
                :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-slate-500'">
                {{ persona.cargo }}
              </td>

              <td class="px-4 py-3 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase border italic tracking-wider shadow-sm"
                  :style="{
                    backgroundColor: isDark ? '#E39C2D20' : '#E39C2D10',
                    borderColor: isDark ? '#E39C2D40' : '#E39C2D30',
                    color: '#E39C2D'
                  }">
                  {{ persona.malla }}
                </span>
              </td>

              <td class="px-4 py-3 text-center uppercase text-[9px] font-black border-b"
                :class="[isDark ? 'border-white/5 text-slate-300' : 'border-slate-100 text-slate-600']">
                {{ persona.jornada }}
              </td>

              <td class="px-4 py-3 text-right font-mono text-[11px] font-black border-b"
                :class="[isDark ? 'border-white/5 text-slate-100' : 'border-slate-100 text-slate-700']">
                {{ persona.horario }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="paginatedMallas?.length"
        class="px-6 py-3 border-t flex items-center justify-between shrink-0 transition-colors z-40 shadow-inner"
        :class="isDark ? 'border-white/5 bg-[#1a1d2d]' : 'border-slate-100 bg-white'">
        <span class="text-[10px] font-black uppercase opacity-90 text-[#5858E8]">Total: {{ totalRecords }}</span>
        <div class="flex items-center gap-2">
          <button @click="currentPage--" :disabled="currentPage === 1" class="btn-pagination">
            <i class="fas fa-chevron-left text-xs"></i>
          </button>
          <span class="text-[10px] font-black uppercase tracking-tighter">
            Pág {{ currentPage }} de {{ totalPages }}
          </span>
          <button @click="currentPage++" :disabled="currentPage >= totalPages" class="btn-pagination">
            <i class="fas fa-chevron-right text-xs"></i>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showResultModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <div
        class="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-500/10">
        <div class="px-6 py-4 border-b border-slate-500/10 flex justify-between items-center">
          <h3 class="text-xs font-black uppercase tracking-widest" :class="isDark ? 'text-white' : 'text-slate-800'">
            Resultado de Carga
          </h3>
          <button @click="showResultModal = false" class="text-slate-400 hover:text-rose-500">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div v-if="uploadSuccessMessage"
            class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold uppercase mb-4 text-center">
            {{ uploadSuccessMessage }}
          </div>

          <div v-if="uploadErrors && uploadErrors.length > 0">
            <p class="text-[10px] font-black uppercase text-rose-500 mb-3 tracking-widest">Errores detectados:</p>
            <div class="space-y-2">
              <div v-for="(err, idx) in uploadErrors" :key="idx"
                class="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                <div class="flex justify-between text-[9px] font-black uppercase mb-1">
                  <span>Fila: {{ err.fila }}</span>
                  <span class="text-rose-500">{{ err.campo }}</span>
                </div>
                <p class="text-[11px] font-semibold text-slate-500 dark:text-slate-300 leading-tight">
                  {{ err.error }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-slate-500/5 flex justify-end">
          <button @click="showResultModal = false"
            class="px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-lg hover:bg-amber-500 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scrollbar Integrado */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(227, 156, 45, 0.2);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(227, 156, 45, 0.5);
}

.btn-pagination {
  @apply w-8 h-8 flex items-center justify-center rounded-full border border-transparent transition-all hover:bg-slate-500/10 disabled:opacity-10 text-xs;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
<script setup>
import { onMounted, watch } from 'vue';
import { useMallasGeneral } from '../../composables/adminLogica/mallasGeneral';

const props = defineProps({
  isDark: Boolean,
  company: String
});

const {
  searchQuery,
  isLoading,
  isLoadingDownload,
  isUploading,
  uploadErrors,
  uploadSuccessMessage,
  showResultModal,
  selectedCompany,
  fetchMallasDesdeOdoo,
  downloadMallaTemplate,
  handleFileUpload,
  paginatedMallas, // Datos ya cortados para la tabla
  currentPage,
  totalPages,
  totalRecords
} = useMallasGeneral();

// Sincronizar con la compañía seleccionada en el Header
watch(() => props.company, (newVal) => {
  selectedCompany.value = newVal;
  fetchMallasDesdeOdoo();
});

onMounted(() => {
  if (props.company) selectedCompany.value = props.company;
  fetchMallasDesdeOdoo();
});
</script>
<style></style>