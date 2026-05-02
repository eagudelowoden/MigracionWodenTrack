<template>
  <div class="h-full animate-fade-in flex flex-col gap-2 font-round-custom">

    <!-- Barra superior asignación -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 p-2 px-4 rounded-2xl border transition-all duration-300 -mt-1 shadow-sm"
      :class="isDark ? 'bg-[#1e2538] border-white/5 shadow-black/20' : 'bg-[#f8fafc] border-slate-200 shadow-slate-200/50'">

      <div class="flex items-center gap-3">
        <div
          class="flex-shrink-0 w-9 h-9 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-amber-500/25">
          <i class="fas fa-calendar-check text-sm"></i>
        </div>
        <div class="leading-tight">
          <h2 class="text-base font-bold tracking-tight" :class="isDark ? 'text-white' : 'text-slate-800'">Asignación
            de Mallas</h2>
          <p class="text-[9px] text-amber-600 dark:text-amber-500 font-black uppercase tracking-[0.15em]">Horarios
            Colaboradores</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">

        <template v-if="hasPerm('admin.filtro_departamento')">
          <div class="relative">
            <select v-model="selectedDepartment"
              class="pl-3 pr-8 py-1.5 text-[10px] font-black uppercase rounded-lg border outline-none appearance-none cursor-pointer w-40 transition-all shadow-sm"
              :class="isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-600'">
              <option value="">DEPARTAMENTOS</option>
              <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
            </select>
            <i
              class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 pointer-events-none"></i>
          </div>
        </template>

        <div class="relative">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400"></i>
          <input v-model="searchQuery" type="text" placeholder="BUSCAR..."
            class="pl-8 pr-3 py-1.5 text-[10px] font-bold uppercase rounded-lg border outline-none w-40 md:w-52 transition-all shadow-sm"
            :class="isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-500' : 'bg-white border-slate-200 text-slate-700 focus:border-amber-500'" />
        </div>

        <div class="flex items-center gap-1.5 border-l border-slate-200 dark:border-white/10 pl-2">
          <button @click="fetchMallasDesdeOdoo" class="p-2 rounded-lg transition-all"
            :class="isDark ? 'text-slate-400 hover:text-amber-400' : 'text-slate-500 hover:text-amber-500'"
            title="Refrescar">
            <i class="fas fa-arrows-rotate text-base" :class="{ 'fa-spin': isLoadingMallas }"></i>
          </button>

          <button @click="downloadMallaTemplate"
            class="p-2 rounded-lg bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
            title="Descargar Plantilla">
            <i :class="isLoadingDownload ? 'fas fa-spinner fa-spin' : 'fas fa-file-excel'" class="text-sm"></i>
          </button>

          <input type="file" id="fileInputMallas" class="hidden" @change="handleFileSelect" :disabled="isUploading"
            accept=".xlsx,.xls" />
          <label for="fileInputMallas"
            class="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-amber-500 text-white text-[10px] font-black uppercase rounded-lg cursor-pointer hover:opacity-90 transition-all active:scale-95 shadow-md"
            :class="{ 'opacity-50 pointer-events-none': isUploading }">
            <i :class="isUploading ? 'fas fa-spinner fa-spin' : 'fas fa-cloud-arrow-up'"></i>
            <span>{{ isUploading ? 'Cargando...' : 'Subir' }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Tabla asignaciones -->
    <div class="table-wrapper flex-1 overflow-hidden rounded-xl border flex flex-col transition-all duration-300"
      :class="isDark ? 'bg-[#253045] border-[#253045]' : 'bg-white border-slate-200 shadow-sm'">

      <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
        <table class="w-full border-separate border-spacing-0">
          <thead class="sticky top-0 z-30 shadow-md">
            <tr :class="isDark ? 'bg-[#3F4A6E]' : 'bg-[#334155]'">
              <th
                class="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest border-b border-white/10 text-white">
                <div class="flex items-center gap-2"><i class="fas fa-user-circle opacity-60"></i> Colaborador</div>
              </th>
              <th
                class="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest border-b border-white/10 text-white">
                Cédula</th>
              <th
                class="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest border-b border-white/10 text-white">
                Cargo</th>
              <th
                class="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest border-b border-white/10 text-white">
                Departamento</th>
              <th
                class="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest border-b border-white/10 text-white">
                Malla</th>
              <th
                class="px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-widest border-b border-white/10 text-white">
                Jornada</th>
              <th
                class="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest border-b border-white/10 text-white">
                Horario</th>
            </tr>
          </thead>

          <tbody class="divide-y-0">
            <tr v-if="isLoadingMallas" v-for="n in 8" :key="'loader-' + n">
              <td colspan="7" class="px-4 py-4">
                <div class="h-4 w-full rounded animate-pulse bg-slate-500/10"></div>
              </td>
            </tr>

            <tr v-else v-for="(persona, index) in paginatedMallas" :key="index"
              class="group transition-all duration-150"
              :class="[index % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-transparent', isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-amber-50/50']">

              <td class="px-4 py-3 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                <span class="text-[11px] font-bold uppercase tracking-tight"
                  :class="isDark ? 'text-white' : 'text-slate-900'">{{ persona.nombre }}</span>
              </td>
              <td class="px-4 py-3 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                <span class="text-[11px] font-mono tracking-wide"
                  :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ persona.cc || '—' }}</span>
              </td>
              <td class="px-4 py-3 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                <span class="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border"
                  :class="isDark ? 'bg-white/5 text-slate-300 border-white/10' : 'bg-slate-100 text-slate-700 border-slate-200'">{{
                    persona.cargo }}</span>
              </td>
              <td class="px-4 py-3 border-b text-[10px] font-bold"
                :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-slate-500'">{{
                  persona.departamento }}</td>
              <td class="px-4 py-3 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase border italic tracking-wider shadow-sm"
                  :style="{ backgroundColor: isDark ? '#E39C2D20' : '#E39C2D10', borderColor: isDark ? '#E39C2D40' : '#E39C2D30', color: '#E39C2D' }">{{
                    persona.malla }}</span>
              </td>
              <td class="px-4 py-3 text-center uppercase text-[9px] font-black border-b"
                :class="isDark ? 'border-white/5 text-slate-300' : 'border-slate-100 text-slate-600'">{{
                  persona.jornada }}
              </td>
              <td class="px-4 py-3 text-right font-bold text-[11px] border-b"
                :class="isDark ? 'border-white/5 text-white' : 'border-slate-100 text-slate-800'">{{ persona.horario
                }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="paginatedMallas?.length" class="px-4 py-2 border-t flex items-center justify-between shadow-inner"
        :class="isDark ? 'border-white/5 bg-[#1a1d2d]' : 'border-slate-200 bg-slate-50'">
        <span class="text-[10px] font-bold uppercase" :class="isDark ? 'text-[#D8DAE3]' : 'text-slate-600'">
          Total: <span :class="isDark ? 'text-white' : 'text-slate-900'">{{ totalRecords }}</span>
        </span>
        <div class="flex items-center gap-3">
          <button @click="mallasPage--" :disabled="mallasPage === 1"
            class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all disabled:opacity-20"
            :class="isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-sm'">
            <i class="fas fa-chevron-left text-[9px]"></i>
          </button>
          <div class="px-3 py-1 rounded-lg text-[11px] font-bold border"
            :class="isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'">
            {{ mallasPage }} <span class="mx-1.5 opacity-40">/</span> {{ mallasPages }}
          </div>
          <button @click="mallasPage++" :disabled="mallasPage >= mallasPages"
            class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all disabled:opacity-20"
            :class="isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-sm'">
            <i class="fas fa-chevron-right text-[9px]"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal elección -->
    <div v-show="showChoiceModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[3px]">
      <div class="w-full max-w-sm rounded-2xl shadow-2xl border overflow-hidden"
        :class="isDark ? 'bg-[#1e2538] border-white/10' : 'bg-white border-slate-200'">
        <div class="px-6 pt-6 pb-4">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center"
              :class="isDark ? 'bg-amber-500/15' : 'bg-amber-50'">
              <i class="fas fa-file-excel text-amber-500 text-base"></i>
            </div>
            <div>
              <h3 class="text-[13px] font-bold" :class="isDark ? 'text-white' : 'text-slate-800'">Archivo cargado</h3>
              <p class="text-[10px] font-medium truncate max-w-[200px]"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ pendingFileName }}</p>
            </div>
          </div>
          <div class="mt-3 px-3 py-2 rounded-xl flex items-center gap-2" :class="isDark ? 'bg-white/5' : 'bg-slate-50'">
            <i class="fas fa-table-list text-amber-500 text-xs"></i>
            <span class="text-[11px] font-bold" :class="isDark ? 'text-slate-200' : 'text-slate-700'">
              {{ previewRows.length }} registro{{ previewRows.length !== 1 ? 's' : '' }} detectado{{
                previewRows.length !==
                  1 ? 's' : '' }}
            </span>
          </div>
        </div>
        <div class="px-6 pb-6 flex flex-col gap-2">
          <button @click="openPreview"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all"
            :class="isDark ? 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400' : 'border-amber-400/50 bg-amber-50 hover:bg-amber-100 text-amber-700'">
            <i class="fas fa-eye text-lg"></i>
            <div class="text-left">
              <p class="text-[12px] font-bold">Vista Previa</p>
              <p class="text-[10px] opacity-70">Ver los datos antes de confirmar</p>
            </div>
          </button>
          <button @click="uploadDirect"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all"
            :class="isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-200' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'">
            <i class="fas fa-cloud-arrow-up text-lg"></i>
            <div class="text-left">
              <p class="text-[12px] font-bold">Subir directamente</p>
              <p class="text-[10px] opacity-70">Cargar sin revisar</p>
            </div>
          </button>
          <button @click="cancelAll" class="w-full py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider"
            :class="isDark ? 'text-slate-500' : 'text-slate-400'">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal preview -->
    <div v-show="showPreviewModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[3px]">
      <div class="w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[80vh]"
        :class="isDark ? 'bg-[#1e2538] border-white/10' : 'bg-white border-slate-200'">
        <div class="flex items-center justify-between px-5 py-4 border-b"
          :class="isDark ? 'border-white/10' : 'border-slate-100'">
          <h3 class="text-[12px] font-bold uppercase tracking-widest" :class="isDark ? 'text-white' : 'text-slate-800'">
            Vista Previa</h3>
          <button @click="cancelAll" class="w-7 h-7 flex items-center justify-center rounded-lg"
            :class="isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'">
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>
        <div class="flex-1 overflow-auto custom-scrollbar">
          <table class="w-full border-separate border-spacing-0">
            <thead class="sticky top-0 z-10">
              <tr :class="isDark ? 'bg-[#253045]' : 'bg-slate-50'">
                <th class="px-3 py-2 text-left text-[10px] font-bold uppercase border-b w-8"
                  :class="isDark ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-400'">#</th>
                <th v-for="h in previewHeaders" :key="h"
                  class="px-3 py-2 text-left text-[10px] font-bold uppercase border-b whitespace-nowrap"
                  :class="isDark ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-600'">{{ h }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in previewRows" :key="i">
                <td class="px-3 py-2 border-b font-mono text-[9px]"
                  :class="isDark ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'">{{ i + 1 }}
                </td>
                <td v-for="(cell, ci) in row" :key="ci" class="px-3 py-2 border-b"
                  :class="isDark ? 'border-white/5' : 'border-slate-100'">
                  <span class="text-[10px]" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ cell }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-5 py-4 border-t flex items-center justify-between gap-3"
          :class="isDark ? 'border-white/10 bg-[#161b2c]' : 'border-slate-100 bg-slate-50'">
          <button @click="cancelAll" class="px-4 py-2 rounded-xl text-[11px] font-bold uppercase border transition-all"
            :class="isDark ? 'border-white/15 text-slate-300' : 'border-slate-200 text-slate-600'">Cancelar</button>
          <button @click="confirmUpload"
            class="px-5 py-2 rounded-xl text-[11px] font-bold uppercase bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center gap-2">
            <i class="fas fa-cloud-arrow-up text-xs"></i>
            Confirmar carga
          </button>
        </div>
      </div>
    </div>

    <!-- Modal resultado -->
    <div v-show="showResultModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[3px]">
      <div class="w-full max-w-sm rounded-2xl shadow-2xl border overflow-hidden"
        :class="isDark ? 'bg-[#1e2538] border-white/10' : 'bg-white border-slate-200'">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b"
          :class="isDark ? 'border-white/8' : 'border-slate-100'">
          <span class="text-[10px] font-black uppercase tracking-[0.2em]"
            :class="isDark ? 'text-slate-400' : 'text-slate-400'">Resultado de Carga</span>
          <button @click="showResultModal = false"
            class="w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
            :class="isDark ? 'text-slate-500 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'">
            <i class="fas fa-times text-[10px]"></i>
          </button>
        </div>

        <div class="px-5 py-5">

          <!-- ÉXITO -->
          <div v-if="uploadSuccessMessage && !uploadErrors?.length" class="flex flex-col items-center text-center py-2">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20"
              :style="{ background: 'linear-gradient(135deg, #10b981, #059669)' }">
              <i class="fas fa-check text-white text-2xl"></i>
            </div>
            <p class="text-[15px] font-bold mb-1" :class="isDark ? 'text-white' : 'text-slate-800'">
              ¡Carga exitosa!
            </p>
            <p class="text-[11px] font-medium" :class="isDark ? 'text-emerald-400' : 'text-emerald-600'">
              {{ uploadSuccessMessage }}
            </p>
          </div>

          <!-- ÉXITO PARCIAL (con algunos errores) -->
          <div v-else-if="uploadSuccessMessage && uploadErrors?.length">
            <div class="flex items-center gap-3 p-3 rounded-xl mb-4"
              :class="isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-500">
                <i class="fas fa-check text-white text-xs"></i>
              </div>
              <p class="text-[11px] font-bold" :class="isDark ? 'text-emerald-300' : 'text-emerald-700'">
                {{ uploadSuccessMessage }}
              </p>
            </div>
          </div>

          <!-- SOLO ERRORES -->
          <div v-if="!uploadSuccessMessage && uploadErrors?.length" class="flex flex-col items-center text-center mb-4">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              :class="isDark ? 'bg-rose-500/15' : 'bg-rose-50'">
              <i class="fas fa-triangle-exclamation text-rose-500 text-xl"></i>
            </div>
            <p class="text-[13px] font-bold" :class="isDark ? 'text-white' : 'text-slate-800'">
              No se procesaron registros
            </p>
          </div>

          <!-- Lista de errores -->
          <div v-if="uploadErrors?.length > 0">
            <div class="flex items-center gap-2 mb-2">
              <i class="fas fa-circle-exclamation text-rose-400 text-[10px]"></i>
              <p class="text-[10px] font-black uppercase tracking-widest text-rose-400">
                {{ uploadErrors.length }} incidencia{{ uploadErrors.length !== 1 ? 's' : '' }}
              </p>
            </div>
            <div class="max-h-44 overflow-y-auto rounded-xl border custom-scrollbar"
              :class="isDark ? 'border-white/8 bg-white/4' : 'border-slate-100 bg-slate-50'">
              <div v-for="(err, i) in uploadErrors" :key="i"
                class="flex items-start gap-3 px-3 py-2.5 border-b last:border-b-0"
                :class="isDark ? 'border-white/5' : 'border-slate-100'">
                <span class="text-[9px] font-mono font-bold mt-0.5 px-1.5 py-0.5 rounded"
                  :class="isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-500'">
                  F{{ err.fila }}
                </span>
                <p class="text-[10px] leading-snug" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                  {{ err.error }}
                </p>
              </div>
            </div>
          </div>

          <!-- Botón cerrar -->
          <button @click="showResultModal = false"
            class="w-full mt-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.98]"
            :class="(!uploadErrors?.length)
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
              : (isDark ? 'bg-white/8 text-slate-200 hover:bg-white/12' : 'bg-slate-900 text-white hover:opacity-90')">
            {{ !uploadErrors?.length ? '¡Listo!' : 'Cerrar' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { watch } from 'vue';
import { useMallasGeneral } from '../../composables/adminLogica/mallasGeneral';
import '../../assets/css/modulo-mallas.css';

const props = defineProps({
  isDark: Boolean,
  company: String,
});

// ── Sesión ───────────────────────────────────────────────────────────────────
const session = JSON.parse(localStorage.getItem('user_session') || '{}');
const hasPerm = (permiso) => {
  const permisos = session.permisos || session.permissions || {};
  return permisos[permiso] === true;
};

// ── Asignación de Mallas ─────────────────────────────────────────────────────
const {
  searchQuery,
  isLoading: isLoadingMallas,
  isLoadingDownload,
  isUploading,
  uploadErrors,
  uploadSuccessMessage,
  showResultModal,
  showChoiceModal,
  showPreviewModal,
  previewRows,
  previewHeaders,
  pendingFileName,
  selectedCompany,
  selectedDepartment,
  departments,
  fetchMallasDesdeOdoo,
  downloadMallaTemplate,
  handleFileSelect,
  openPreview,
  uploadDirect,
  confirmUpload,
  cancelAll,
  paginatedMallas,
  currentPage: mallasPage,
  totalPages: mallasPages,
  totalRecords,
} = useMallasGeneral();

// ── Sincronizar company y cargar mallas ──────────────────────────────────────
watch(
  () => props.company,
  (v) => {
    if (v) selectedCompany.value = v;
    fetchMallasDesdeOdoo();
  },
  { immediate: true },
);
// En tu ModuloMallaUpload.vue
const cargarMallas = async () => {
  try {
    isLoading.value = true;

    // Empaquetamos los valores actuales
    const misFiltros = {
      selectedCompany: selectedCompany.value,
      selectedDepartment: selectedDepartment.value,
      selectedArea: selectedArea.value,
      selectedSegmento: selectedSegmento.value
    };

    // Llamamos a la función importada
    const resultado = await fetchMallasDesdeOdoo(misFiltros);

    mallasData.value = resultado;
    currentPage.value = 1;

  } catch (err) {
    console.error("Fallo al cargar mallas en el componente:", err);
  } finally {
    isLoading.value = false;
  }
};
</script>
<style></style>
