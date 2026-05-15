<template>
  <div class="h-full animate-fade-in flex flex-col gap-2 font-round-custom">

    <!-- Barra superior asignación -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 p-2 px-4 rounded-2xl border transition-all duration-300 -mt-1 shadow-sm"
      :class="isDark ? 'bg-[#1e2538] border-white/5 shadow-black/20' : 'bg-[#f8fafc] border-slate-200 shadow-slate-200/50'">

      <div class="flex items-center gap-3">
        <div
          class="flex-shrink-0 w-9 h-9 bg-[#3B82F6] text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-500/25">
          <i class="fas fa-calendar-check text-sm"></i>
        </div>
        <div class="leading-tight">
          <h2 class="text-base font-bold tracking-tight" :class="isDark ? 'text-white' : 'text-slate-800'">Asignación
            de Mallas</h2>
          <p class="text-[9px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.15em]">Horarios
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
            :class="isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-400' : 'bg-white border-slate-200 text-slate-700 focus:border-blue-400'" />
        </div>

        <div class="flex items-center gap-1.5 border-l border-slate-200 dark:border-white/10 pl-2">
          <button @click="fetchMallasDesdeOdoo" class="p-2 rounded-lg transition-all"
            :class="isDark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-500'"
            title="Refrescar">
            <i class="fas fa-arrows-rotate text-base" :class="{ 'fa-spin': isLoadingMallas }"></i>
          </button>

          <button @click="downloadMallaTemplate"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
            title="Descargar Plantilla">
            <i :class="isLoadingDownload ? 'fas fa-spinner fa-spin' : 'fas fa-file-excel'" class="text-[10px]"></i>
            <span>Plantilla</span>
          </button>

          <input type="file" id="fileInputMallas" class="hidden" @change="handleFileSelect" :disabled="isUploading"
            accept=".xlsx,.xls" />
          <button @click="intentarCargar" :disabled="isUploading"
            class="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-black uppercase rounded-full transition-all active:scale-95 disabled:opacity-50"
            :class="isUploading
              ? 'bg-[#3B82F6] text-white'
              : !carguePermitido
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 hover:bg-amber-500/25'
                : 'bg-[#3B82F6] text-white hover:bg-blue-600'"
            :title="!carguePermitido ? 'Fuera de ventana de cargue — haz clic para solicitar apertura' : 'Subir archivo de mallas'">
            <i :class="isUploading ? 'fas fa-spinner fa-spin' : (!carguePermitido ? 'fas fa-lock' : 'fas fa-cloud-arrow-up')"
              class="text-[10px]"></i>
            <span>{{ isUploading ? 'Cargando...' : (!carguePermitido ? 'Bloqueado' : 'Subir') }}</span>
          </button>
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
                  :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{
                    persona.cc || '—' }}</span>
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

    <!-- Modal: fuera de fecha de cargue -->
    <Transition name="fade">
      <div v-if="showSolicitudModal"
        class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div class="w-full max-w-sm rounded-2xl shadow-2xl border overflow-hidden"
          :class="isDark ? 'bg-[#1e2538] border-white/10' : 'bg-white border-slate-200'">

          <!-- Header -->
          <div class="px-5 py-4 border-b flex items-center gap-3"
            :class="isDark ? 'border-white/8 bg-amber-500/8' : 'border-amber-100 bg-amber-50'">
            <div class="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <i class="fas fa-calendar-xmark text-amber-400 text-lg"></i>
            </div>
            <div>
              <h3 class="text-[13px] font-black" :class="isDark ? 'text-white' : 'text-slate-800'">
                Fuera de fecha de cargue
              </h3>
              <p class="text-[9px] mt-0.5" :class="isDark ? 'text-white/40' : 'text-slate-500'">
                No hay una ventana de cargue activa para hoy
              </p>
            </div>
          </div>

          <div class="p-5 space-y-3">
            <p class="text-[10px] leading-relaxed" :class="isDark ? 'text-white/60' : 'text-slate-600'">
              El administrador ha programado fechas específicas para el cargue de mallas.
              <span v-if="proximaFechaHabilitada" class="font-bold" :class="isDark ? 'text-white' : 'text-slate-800'">
                La próxima fecha habilitada es el <em>{{ proximaFechaHabilitada }}</em>.
              </span>
            </p>

            <!-- Nota informativa -->
            <div class="flex items-start gap-2 p-3 rounded-xl text-[9px]"
              :class="isDark ? 'bg-white/4 border border-white/8 text-white/40' : 'bg-slate-50 border border-slate-200 text-slate-500'">
              <i class="fas fa-circle-info mt-0.5 shrink-0"></i>
              Puedes enviar una solicitud de apertura al Super Admin si necesitas cargar mallas hoy.
            </div>

            <div class="flex gap-2 pt-1">
              <button @click="crearSolicitud()"
                class="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-wide bg-amber-500 text-white hover:bg-amber-400 transition-all flex items-center justify-center gap-1.5">
                <i class="fas fa-paper-plane text-[9px]"></i> Solicitar apertura
              </button>
              <button @click="showSolicitudModal = false"
                class="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all"
                :class="isDark ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal elección -->
    <div v-show="showChoiceModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[3px]">
      <div class="w-full max-w-sm rounded-2xl shadow-2xl border overflow-hidden"
        :class="isDark ? 'bg-[#1e2538] border-white/10' : 'bg-white border-slate-200'">
        <div class="px-6 pt-6 pb-4">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center"
              :class="isDark ? 'bg-[#3B82F6]/15' : 'bg-amber-50'">
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
            :class="isDark ? 'border-amber-500/40 bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 text-amber-400' : 'border-amber-400/50 bg-amber-50 hover:bg-amber-100 text-amber-700'">
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
            class="px-5 py-2 rounded-xl text-[11px] font-bold uppercase bg-[#3B82F6] text-white hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center gap-2">
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

          <!-- ── Resumen de conteos ───────────────────────────────────────── -->
          <div class="flex gap-3 mb-5">
            <!-- Exitosos -->
            <div class="flex-1 rounded-xl p-3 flex flex-col items-center gap-1"
              :class="isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'">
              <span class="text-2xl font-black" :class="isDark ? 'text-emerald-400' : 'text-emerald-600'">
                {{ uploadProcesados?.length ?? 0 }}
              </span>
              <span class="text-[9px] font-black uppercase tracking-widest text-center"
                :class="isDark ? 'text-emerald-500' : 'text-emerald-700'">
                <i class="fas fa-check mr-1"></i>Asignadas
              </span>
            </div>
            <!-- Errores -->
            <div class="flex-1 rounded-xl p-3 flex flex-col items-center gap-1" :class="uploadErrors?.length
              ? (isDark ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-rose-50 border border-rose-200')
              : (isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200')">
              <span class="text-2xl font-black"
                :class="uploadErrors?.length ? (isDark ? 'text-rose-400' : 'text-rose-500') : (isDark ? 'text-slate-500' : 'text-slate-400')">
                {{ uploadErrors?.length ?? 0 }}
              </span>
              <span class="text-[9px] font-black uppercase tracking-widest text-center"
                :class="uploadErrors?.length ? (isDark ? 'text-rose-500' : 'text-rose-600') : (isDark ? 'text-slate-500' : 'text-slate-400')">
                <i class="fas fa-triangle-exclamation mr-1"></i>Errores
              </span>
            </div>
          </div>

          <!-- ── Mensaje de estado ───────────────────────────────────────── -->
          <div v-if="uploadSuccessMessage" class="flex items-center gap-2 mb-4 px-1">
            <i class="fas fa-circle-check text-emerald-500 text-sm flex-shrink-0"></i>
            <p class="text-[11px] font-semibold" :class="isDark ? 'text-emerald-300' : 'text-emerald-700'">
              {{ uploadSuccessMessage }}
            </p>
          </div>
          <div v-else-if="!uploadProcesados?.length" class="flex items-center gap-2 mb-4 px-1">
            <i class="fas fa-triangle-exclamation text-rose-400 text-sm flex-shrink-0"></i>
            <p class="text-[11px] font-semibold" :class="isDark ? 'text-rose-300' : 'text-rose-600'">
              No se pudo asignar ninguna malla
            </p>
          </div>

          <!-- ── Lista de errores ────────────────────────────────────────── -->
          <div v-if="uploadErrors?.length > 0" class="mb-4">
            <p class="text-[9px] font-black uppercase tracking-widest mb-2 px-1"
              :class="isDark ? 'text-rose-400' : 'text-rose-500'">
              Detalle de errores
            </p>
            <div class="max-h-40 overflow-y-auto rounded-xl border custom-scrollbar"
              :class="isDark ? 'border-white/8 bg-white/[0.03]' : 'border-slate-100 bg-slate-50'">
              <div v-for="(err, i) in uploadErrors" :key="i"
                class="flex items-start gap-3 px-3 py-2 border-b last:border-b-0"
                :class="isDark ? 'border-white/5' : 'border-slate-100'">
                <span class="text-[9px] font-mono font-bold mt-0.5 px-1.5 py-0.5 rounded flex-shrink-0"
                  :class="isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-500'">
                  F{{ err.fila }}
                </span>
                <p class="text-[10px] leading-snug" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                  {{ err.error }}
                </p>
              </div>
            </div>
          </div>

          <!-- ── Acciones ────────────────────────────────────────────────── -->
          <!-- Botón descarga reporte (opcional) -->
          <button v-if="uploadProcesados?.length || uploadErrors?.length" @click="descargarReporteCarga"
            class="w-full mb-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            :class="isDark
              ? 'border-white/15 text-slate-300 hover:bg-white/8'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'">
            <i class="fas fa-file-arrow-down text-xs"></i>
            Descargar reporte Excel
          </button>

          <button @click="showResultModal = false"
            class="w-full py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.98]"
            :class="(!uploadErrors?.length && uploadProcesados?.length)
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
              : (isDark ? 'bg-white/8 text-slate-200 hover:bg-white/12' : 'bg-slate-900 text-white hover:opacity-90')">
            {{ (!uploadErrors?.length && uploadProcesados?.length) ? '¡Listo!' : 'Cerrar' }}
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
  uploadProcesados,
  descargarReporteCarga,
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
  carguePermitido,
  proximaFechaHabilitada,
  showSolicitudModal,
  crearSolicitud,
} = useMallasGeneral();

// Intercepta click de "Subir": valida ventana antes de abrir el file picker
const intentarCargar = () => {
  if (!carguePermitido.value) {
    showSolicitudModal.value = true;
    return;
  }
  document.getElementById('fileInputMallas')?.click();
};

// ── Sincronizar company y cargar mallas ──────────────────────────────────────
watch(
  () => props.company,
  (v) => {
    if (v) selectedCompany.value = v;
    fetchMallasDesdeOdoo();
  },
  { immediate: true },
);
</script>
<style></style>
