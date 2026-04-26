<template>
  <div class="mesh-container h-full animate-fade-in flex flex-col gap-2 font-round-custom">

    <!-- ── Barra superior ──────────────────────────────────────────────── -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 p-1.5 px-3 rounded-2xl border transition-all duration-300 -mt-3 shadow-sm"
      :class="isDark ? 'bg-[#1e2538] border-white/5 shadow-black/20' : 'bg-[#f8fafc] border-slate-200 shadow-slate-200/50'">

      <div class="flex items-center gap-3">
        <div
          class="flex-shrink-0 w-7 h-7 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-sm shadow-amber-500/20">
          <i class="fas fa-calendar-check text-xs"></i>
        </div>
        <div class="leading-tight">
          <h2 class="text-sm font-bold tracking-tight" :class="isDark ? 'text-white' : 'text-slate-800'">Mallas</h2>
          <p class="text-[8px] text-amber-600 dark:text-amber-500 font-black uppercase tracking-[0.15em]">Horarios</p>
        </div>
      </div>

      <div class="flex items-center gap-2">

        <template v-if="hasPerm('admin.filtro_departamento')">
          <div class="relative">
            <select v-model="selectedDepartment"
              class="pl-3 pr-8 py-1 text-[10px] font-black uppercase rounded-lg border outline-none appearance-none cursor-pointer w-36 transition-all shadow-sm"
              :class="isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-600'">
              <option value="">DEPARTAMENTOS</option>
              <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
            </select>
            <i class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 pointer-events-none"></i>
          </div>
        </template>

        <div class="relative">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400"></i>
          <input v-model="searchQuery" type="text" placeholder="BUSCAR..."
            class="pl-8 pr-3 py-1 text-[10px] font-bold uppercase rounded-lg border outline-none w-36 md:w-44 transition-all"
            :class="isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-500' : 'bg-white border-slate-200 text-slate-700 focus:border-amber-500'" />
        </div>

        <div class="flex items-center gap-1.5 border-l border-slate-200 dark:border-white/10 pl-2">

          <!-- Descargar plantilla -->
          <button @click="downloadMallaTemplate"
            class="p-1.5 rounded-lg bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
            title="Descargar Plantilla">
            <i :class="isLoadingDownload ? 'fas fa-spinner fa-spin' : 'fas fa-file-excel'" class="text-sm"></i>
          </button>

          <!-- UN SOLO botón: abre selector de archivo -->
          <input type="file" id="fileInput" class="hidden" @change="handleFileSelect"
            :disabled="isUploading" accept=".xlsx,.xls" />
          <label for="fileInput"
            class="flex items-center gap-2 px-4 py-1.5 bg-slate-900 dark:bg-amber-500 text-white text-[10px] font-black uppercase rounded-lg cursor-pointer hover:opacity-90 transition-all active:scale-95 shadow-md"
            :class="{ 'opacity-50 pointer-events-none': isUploading }">
            <i :class="isUploading ? 'fas fa-spinner fa-spin' : 'fas fa-cloud-arrow-up'"></i>
            <span>{{ isUploading ? 'Cargando...' : 'Subir' }}</span>
          </label>

        </div>
      </div>
    </div>

    <!-- ── Tabla principal ─────────────────────────────────────────────── -->
    <div class="table-wrapper flex-1 overflow-hidden rounded-xl border flex flex-col transition-all duration-300"
      :class="isDark ? 'bg-[#253045] border-[#253045]' : 'bg-white border-slate-200 shadow-sm'">

      <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
        <table class="w-full border-separate border-spacing-0">
          <thead class="sticky top-0 z-30 shadow-md">
            <tr :class="isDark ? 'bg-[#3F4A6E]' : 'bg-[#334155]'">
              <th class="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest border-b border-white/10 text-white">
                <div class="flex items-center gap-2"><i class="fas fa-user-circle opacity-60"></i> Colaborador</div>
              </th>
              <th class="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest border-b border-white/10 text-white">Cargo</th>
              <th class="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest border-b border-white/10 text-white">Departamento</th>
              <th class="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest border-b border-white/10 text-white">Malla</th>
              <th class="px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-widest border-b border-white/10 text-white">Jornada</th>
              <th class="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest border-b border-white/10 text-white">Horario</th>
            </tr>
          </thead>

          <tbody class="divide-y-0">
            <tr v-if="isLoading" v-for="n in 8" :key="'loader-' + n">
              <td colspan="6" class="px-4 py-4">
                <div class="h-4 w-full rounded animate-pulse bg-slate-500/10"></div>
              </td>
            </tr>

            <tr v-else v-for="(persona, index) in paginatedMallas" :key="index"
              class="group transition-all duration-150"
              :class="[index % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-transparent', isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-amber-50/50']">

              <td class="px-4 py-3 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                <span class="text-[11px] font-bold uppercase tracking-tight" :class="isDark ? 'text-white' : 'text-slate-900'">{{ persona.nombre }}</span>
              </td>
              <td class="px-4 py-3 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                <span class="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border"
                  :class="isDark ? 'bg-white/5 text-slate-300 border-white/10' : 'bg-slate-100 text-slate-700 border-slate-200'">{{ persona.cargo }}</span>
              </td>
              <td class="px-4 py-3 border-b text-[10px] font-bold" :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-slate-500'">{{ persona.departamento }}</td>
              <td class="px-4 py-3 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase border italic tracking-wider shadow-sm"
                  :style="{ backgroundColor: isDark ? '#E39C2D20' : '#E39C2D10', borderColor: isDark ? '#E39C2D40' : '#E39C2D30', color: '#E39C2D' }">{{ persona.malla }}</span>
              </td>
              <td class="px-4 py-3 text-center uppercase text-[9px] font-black border-b" :class="isDark ? 'border-white/5 text-slate-300' : 'border-slate-100 text-slate-600'">{{ persona.jornada }}</td>
              <td class="px-4 py-3 text-right font-bold text-[11px] border-b" :class="isDark ? 'border-white/5 text-white' : 'border-slate-100 text-slate-800'">{{ persona.horario }}</td>
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
          <button @click="currentPage--" :disabled="currentPage === 1"
            class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all disabled:opacity-20"
            :class="isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-sm'">
            <i class="fas fa-chevron-left text-[9px]"></i>
          </button>
          <div class="px-3 py-1 rounded-lg text-[11px] font-bold border"
            :class="isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'">
            {{ currentPage }} <span class="mx-1.5 opacity-40">/</span> {{ totalPages }}
          </div>
          <button @click="currentPage++" :disabled="currentPage >= totalPages"
            class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all disabled:opacity-20"
            :class="isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-sm'">
            <i class="fas fa-chevron-right text-[9px]"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal 1: Elección (ver preview o subir directo) ─────────────── -->
    <div v-show="showChoiceModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">

      <div class="w-full max-w-sm rounded-2xl shadow-2xl border overflow-hidden transition-all"
        :class="isDark ? 'bg-[#1e2538] border-white/10' : 'bg-white border-slate-200'">

        <!-- Header -->
        <div class="px-6 pt-6 pb-4">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center"
              :class="isDark ? 'bg-amber-500/15' : 'bg-amber-50'">
              <i class="fas fa-file-excel text-amber-500 text-base"></i>
            </div>
            <div>
              <h3 class="text-[13px] font-bold" :class="isDark ? 'text-white' : 'text-slate-800'">
                Archivo cargado
              </h3>
              <p class="text-[10px] font-medium truncate max-w-[200px]"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                {{ pendingFileName }}
              </p>
            </div>
          </div>

          <div class="mt-3 px-3 py-2 rounded-xl flex items-center gap-2"
            :class="isDark ? 'bg-white/5' : 'bg-slate-50'">
            <i class="fas fa-table-list text-amber-500 text-xs"></i>
            <span class="text-[11px] font-bold" :class="isDark ? 'text-slate-200' : 'text-slate-700'">
              {{ previewRows.length }} registro{{ previewRows.length !== 1 ? 's' : '' }} detectado{{ previewRows.length !== 1 ? 's' : '' }}
            </span>
          </div>

          <p class="mt-3 text-[11px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            ¿Qué deseas hacer con este archivo?
          </p>
        </div>

        <!-- Opciones -->
        <div class="px-6 pb-6 flex flex-col gap-2">

          <button @click="openPreview"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            :class="isDark
              ? 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
              : 'border-amber-400/50 bg-amber-50 hover:bg-amber-100 text-amber-700'">
            <i class="fas fa-eye text-lg"></i>
            <div class="text-left">
              <p class="text-[12px] font-bold">Vista Previa</p>
              <p class="text-[10px] opacity-70">Ver los datos antes de confirmar</p>
            </div>
            <i class="fas fa-chevron-right ml-auto text-[10px] opacity-50"></i>
          </button>

          <button @click="uploadDirect"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            :class="isDark
              ? 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-200'
              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'">
            <i class="fas fa-cloud-arrow-up text-lg"></i>
            <div class="text-left">
              <p class="text-[12px] font-bold">Subir directamente</p>
              <p class="text-[10px] opacity-70">Cargar sin revisar</p>
            </div>
            <i class="fas fa-chevron-right ml-auto text-[10px] opacity-50"></i>
          </button>

          <button @click="cancelAll"
            class="w-full py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all hover:opacity-70"
            :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal 2: Vista previa de datos ──────────────────────────────── -->
    <div v-show="showPreviewModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">

      <div class="w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[80vh] transition-all"
        :class="isDark ? 'bg-[#1e2538] border-white/10' : 'bg-white border-slate-200'">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b"
          :class="isDark ? 'border-white/10' : 'border-slate-100'">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center"
              :class="isDark ? 'bg-amber-500/15' : 'bg-amber-50'">
              <i class="fas fa-eye text-amber-500 text-sm"></i>
            </div>
            <div>
              <h3 class="text-[12px] font-bold uppercase tracking-widest" :class="isDark ? 'text-white' : 'text-slate-800'">
                Vista Previa
              </h3>
              <p class="text-[10px] font-medium" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                {{ previewRows.length }} registro{{ previewRows.length !== 1 ? 's' : '' }} — {{ pendingFileName }}
              </p>
            </div>
          </div>
          <button @click="cancelAll"
            class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            :class="isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'">
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>

        <!-- Tabla -->
        <div class="flex-1 overflow-auto custom-scrollbar">
          <table class="w-full border-separate border-spacing-0">
            <thead class="sticky top-0 z-10">
              <tr :class="isDark ? 'bg-[#253045]' : 'bg-slate-50'">
                <th class="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider border-b w-8"
                  :class="isDark ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-400'">#</th>
                <th v-for="header in previewHeaders" :key="header"
                  class="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider border-b whitespace-nowrap"
                  :class="isDark ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-600'">
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in previewRows" :key="idx"
                :class="[idx % 2 !== 0 ? (isDark ? 'bg-white/[0.03]' : 'bg-slate-50/60') : '', isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-amber-50/40']">
                <td class="px-3 py-2 border-b font-mono text-[9px]"
                  :class="isDark ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'">
                  {{ idx + 1 }}
                </td>
                <td v-for="(cell, ci) in row" :key="ci" class="px-3 py-2 border-b"
                  :class="isDark ? 'border-white/5' : 'border-slate-100'">
                  <span v-if="ci === 0" class="font-bold text-[11px] uppercase" :class="isDark ? 'text-white' : 'text-slate-900'">{{ cell }}</span>
                  <span v-else-if="ci === 1"
                    class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase border italic"
                    :style="{ backgroundColor: isDark ? '#E39C2D20' : '#E39C2D10', borderColor: isDark ? '#E39C2D40' : '#E39C2D30', color: '#E39C2D' }">
                    {{ cell }}
                  </span>
                  <span v-else class="text-[10px]" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ cell }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="px-5 py-4 border-t flex items-center justify-between gap-3"
          :class="isDark ? 'border-white/10 bg-[#161b2c]' : 'border-slate-100 bg-slate-50'">
          <p class="text-[10px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            <i class="fas fa-info-circle text-amber-500 mr-1"></i>
            Revisa los datos antes de confirmar
          </p>
          <div class="flex items-center gap-2">
            <button @click="cancelAll"
              class="px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all hover:opacity-80"
              :class="isDark ? 'border-white/15 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-100'">
              Cancelar
            </button>
            <button @click="confirmUpload"
              class="px-5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-amber-500 text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center gap-2">
              <i class="fas fa-cloud-arrow-up text-xs"></i>
              Confirmar carga
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Modal 3: Resultado ──────────────────────────────────────────── -->
    <div v-show="showResultModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">

      <div class="bg-white dark:bg-slate-950 max-w-sm w-full rounded-2xl shadow-xl border border-slate-200/60 dark:border-white/5 overflow-hidden">

        <div class="flex items-center justify-between px-5 py-4">
          <h3 class="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
            Estado de Carga
          </h3>
          <button @click="showResultModal = false"
            class="text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors">
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>

        <div class="px-5 pb-6">
          <div v-if="uploadSuccessMessage" class="mb-4 flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <div class="h-1.5 w-1.5 rounded-full bg-current"></div>
            <p class="text-sm font-medium">{{ uploadSuccessMessage }}</p>
          </div>

          <div v-if="uploadErrors?.length > 0" class="space-y-1">
            <p class="text-[10px] font-semibold text-rose-500/80 mb-2 px-1">INCIDENCIAS DETECTADAS</p>
            <div class="max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              <div v-for="(err, idx) in uploadErrors" :key="idx"
                class="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <span class="text-[9px] font-mono text-slate-400 mt-0.5">#{{ err.fila }}</span>
                <p class="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-tight">
                  <span class="text-slate-400 dark:text-slate-500 font-normal">{{ err.campo }}:</span> {{ err.error }}
                </p>
              </div>
            </div>
          </div>

          <button @click="showResultModal = false"
            class="w-full mt-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-[0.98] transition-all">
            Continuar
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue';
import { useMallasGeneral } from '../../composables/adminLogica/mallasGeneral';
import '../../assets/css/modulo-mallas.css';

const session = JSON.parse(localStorage.getItem("user_session") || "{}");
const hasPerm = (permiso) => {
  const permisos = session.permisos || session.permissions || {};
  return permisos[permiso] === true;
};

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
  currentPage,
  totalPages,
  totalRecords
} = useMallasGeneral();

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
