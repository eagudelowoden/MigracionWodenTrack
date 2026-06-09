<template>
  <div class="h-full animate-fade-in flex flex-col gap-3">

    <!-- ── Header row: Tabs (izq) + Acciones (der) ───────────────────────── -->
    <div class="flex items-center justify-between gap-3 flex-wrap"
      v-if="isSuperAdmin || hasPerm('admin.calculos') || hasPerm('horas.guardados') || hasPerm('horas.novedades_aprobadas') || hasPerm('horas.cargue')">

      <!-- Tabs (Vercel segmented) -->
      <div class="flex items-center gap-0.5 p-0.5 rounded-md border w-fit"
        :class="isDark ? 'bg-[#0B0F19] border-[#222938]' : 'bg-slate-100 border-slate-200'">
        <button v-if="isSuperAdmin || hasPerm('admin.calculos')" @click="activeTab = 'calculos'"
          class="px-3 h-7 rounded-[5px] text-[11px] font-medium transition-all flex items-center gap-1.5" :class="activeTab === 'calculos'
            ? (isDark ? 'bg-[#161B26] text-white' : 'bg-white text-slate-900 shadow-sm')
            : (isDark ? 'text-[#888888] hover:text-white' : 'text-slate-500 hover:text-slate-800')">
          <i class="fas fa-calculator text-[10px]"></i>Cálculos
        </button>
        <button v-if="isSuperAdmin || hasPerm('horas.guardados')" @click="handleTabGuardados"
          class="px-3 h-7 rounded-[5px] text-[11px] font-medium transition-all flex items-center gap-1.5" :class="activeTab === 'guardados'
            ? (isDark ? 'bg-[#161B26] text-white' : 'bg-white text-slate-900 shadow-sm')
            : (isDark ? 'text-[#888888] hover:text-white' : 'text-slate-500 hover:text-slate-800')">
          <i class="fas fa-floppy-disk text-[10px]"></i>Guardados
        </button>
        <button v-if="isSuperAdmin || hasPerm('horas.novedades_aprobadas')" @click="handleTabNovedades('aprobadas')"
          class="px-3 h-7 rounded-[5px] text-[11px] font-medium transition-all flex items-center gap-1.5" :class="activeTab === 'aprobadas'
            ? (isDark ? 'bg-[#161B26] text-white' : 'bg-white text-slate-900 shadow-sm')
            : (isDark ? 'text-[#888888] hover:text-white' : 'text-slate-500 hover:text-slate-800')">
          <i class="fas fa-circle-check text-[10px]"></i>Novedades Aprobadas
          <span v-if="novedadesAprobadas.length"
            class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
            :class="activeTab === 'aprobadas' ? 'bg-[#3B82F6]/20 text-[#3B82F6]' : 'bg-[#3B82F6]/15 text-[#3B82F6]'">
            {{ novedadesAprobadas.length }}
          </span>
        </button>
        <button v-if="isSuperAdmin || hasPerm('horas.novedades_aprobadas')" @click="handleTabHistorial"
          class="px-3 h-7 rounded-[5px] text-[11px] font-medium transition-all flex items-center gap-1.5" :class="activeTab === 'historial'
            ? (isDark ? 'bg-[#161B26] text-white' : 'bg-white text-slate-900 shadow-sm')
            : (isDark ? 'text-[#888888] hover:text-white' : 'text-slate-500 hover:text-slate-800')">
          <i class="fas fa-clock-rotate-left text-[10px]"></i>Historial
        </button>
        <!-- Cargue Horas — al final con dropdown -->
        <div v-if="isSuperAdmin || hasPerm('horas.cargue')" class="relative cargue-menu-wrapper">
          <button @click.stop="toggleCargueMenu"
            class="px-3 h-7 rounded-[5px] text-[11px] font-medium transition-all flex items-center gap-1.5" :class="activeTab === 'cargue'
              ? (isDark ? 'bg-[#161B26] text-white' : 'bg-white text-slate-900 shadow-sm')
              : (isDark ? 'text-[#888888] hover:text-white' : 'text-slate-500 hover:text-slate-800')">
            <i class="fas fa-file-arrow-up text-[10px]"></i>Cargue Horas
            <i class="fas fa-chevron-down text-[8px] ml-0.5 transition-transform duration-150"
              :class="showCargueMenu ? 'rotate-180' : ''"></i>
          </button>
          <!-- Dropdown -->
          <div v-if="showCargueMenu"
            class="absolute top-full right-0 mt-1 w-52 rounded-md border shadow-xl z-50 overflow-hidden"
            :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
            <button @click="selectCargueView('upload')"
              class="w-full flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-medium transition-all text-left"
              :class="[isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-slate-50',
              activeCargueView === 'upload' && activeTab === 'cargue'
                ? (isDark ? 'text-white' : 'text-slate-900')
                : (isDark ? 'text-[#E2E8F0]' : 'text-slate-700')]">
              <i class="fas fa-cloud-arrow-up text-[10px] text-[#3B82F6] w-3.5"></i>
              Cargue de horas
            </button>
            <div class="h-px" :class="isDark ? 'bg-[#222938]' : 'bg-slate-100'"></div>
            <button @click="selectCargueView('historial')"
              class="w-full flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-medium transition-all text-left"
              :class="[isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-slate-50',
              activeCargueView === 'historial' && activeTab === 'cargue'
                ? (isDark ? 'text-white' : 'text-slate-900')
                : (isDark ? 'text-[#E2E8F0]' : 'text-slate-700')]">
              <i class="fas fa-table-list text-[10px] text-[#3B82F6] w-3.5"></i>
              Horas cargadas
            </button>
          </div>
        </div>
      </div>

      <!-- Acciones (solo visible en tab Cálculos) — borde azul visible en ambos modos -->
      <div v-if="activeTab === 'calculos'" class="flex items-center gap-1.5">

        <!-- Toggle decimales / horas cerradas -->
        <button @click="mostrarDecimales = !mostrarDecimales"
          class="flex items-center gap-1.5 h-7 px-3 rounded-[5px] border text-[11px] font-medium transition-all active:scale-[0.98]"
          :class="mostrarDecimales
            ? (isDark ? 'bg-[#3B82F6]/15 border-[#3B82F6]/60 text-[#60A5FA]' : 'bg-[#3B82F6]/10 border-[#3B82F6]/40 text-[#2563eb]')
            : (isDark ? 'bg-[#161B26] border-[#222938] text-[#888888] hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800')"
          :title="mostrarDecimales ? 'Mostrando medias horas (0.5). Clic para ver horas cerradas' : 'Mostrando horas cerradas (7). Clic para ver medias horas'">
          <i class="fas fa-toggle-on text-[11px]" :class="mostrarDecimales ? '' : 'opacity-40 rotate-180'"></i>
          <span>{{ mostrarDecimales ? 'Decimales' : 'Decimales' }}</span>
        </button>

        <!-- Exportar -->
        <button @click="handleExportar" :disabled="isExporting || !registros.length"
          class="flex items-center gap-1.5 h-7 px-3 rounded-[5px] border text-[11px] font-medium transition-all active:scale-[0.98] disabled:opacity-40"
          :class="isDark
            ? 'bg-[#161B26] border-[#3B82F6]/30 text-[#E2E8F0] hover:bg-[#3B82F6]/[0.05] hover:border-[#3B82F6]/60'
            : 'bg-white border-[#3B82F6]/30 text-slate-700 hover:bg-[#3B82F6]/[0.05] hover:border-[#3B82F6]/60'">
          <i :class="isExporting ? 'fas fa-spinner fa-spin' : 'fas fa-file-excel'" class="text-[10px]"></i>
          <span>{{ isExporting ? 'Exportando…' : 'Exportar' }}</span>
        </button>

        <!-- Calcular -->
        <button @click="handleCalcular" :disabled="isCalculating || isSaving || isLoading"
          class="flex items-center gap-1.5 h-7 px-3 rounded-[5px] border text-[11px] font-medium transition-all active:scale-[0.98] disabled:opacity-40"
          :class="isDark
            ? 'bg-[#161B26] border-[#3B82F6]/30 text-[#E2E8F0] hover:bg-[#3B82F6]/[0.05] hover:border-[#3B82F6]/60'
            : 'bg-white border-[#3B82F6]/30 text-slate-700 hover:bg-[#3B82F6]/[0.05] hover:border-[#3B82F6]/60'">
          <i :class="isCalculating ? 'fas fa-spinner fa-spin' : 'fas fa-calculator'" class="text-[10px]"></i>
          <span>{{ isCalculating ? 'Calculando…' : 'Calcular' }}</span>
        </button>


        <!-- Guardar (solo registros seleccionados) -->
        <button @click="handleGuardar" :disabled="isSaving || isCalculating || !selectedRecords.length"
          :title="!selectedRecords.length ? 'Selecciona al menos un registro para guardar' : ''"
          class="flex items-center gap-1.5 h-7 px-3 rounded-[5px] border text-[11px] font-medium transition-all active:scale-[0.98] disabled:opacity-40 bg-[#3B82F6] border-[#3B82F6] text-white hover:bg-[#2563EB] hover:border-[#2563EB]">
          <i :class="isSaving ? 'fas fa-spinner fa-spin' : 'fas fa-floppy-disk'" class="text-[10px]"></i>
          <span v-if="isSaving">Guardando…</span>
          <span v-else>Guardar ({{ selectedRecords.length }})</span>
        </button>
      </div>
    </div>

    <!-- ══ TAB CÁLCULOS ════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'calculos' && (isSuperAdmin || hasPerm('admin.calculos'))">

      <!-- ── Toolbar con filtros (Vercel) ───────────────────────────────── -->
      <div class="rounded-md border" :class="isDark ? 'bg-[#273045] border-[#222938]' : 'bg-white border-slate-200'">

        <!-- Sección filtros -->
        <div class="flex flex-wrap items-end gap-3 px-3 py-2.5">

          <!-- Rango de fechas -->
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-medium" :class="isDark ? 'text-[#ecedef]' : 'text-slate-500'">
              Desde
            </label>
            <input type="date" v-model="startDate"
              class="h-7 px-2.5 text-[11px] font-medium rounded-[5px] border outline-none transition-all"
              :class="isDark
                ? 'bg-[#0B0F19] border-[#222938] text-white focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'
                : 'bg-white border-slate-200 text-slate-800 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-medium" :class="isDark ? 'text-[#ffffff]' : 'text-slate-500'">
              Hasta
            </label>
            <input type="date" v-model="endDate"
              class="h-7 px-2.5 text-[11px] font-medium rounded-[5px] border outline-none transition-all"
              :class="isDark
                ? 'bg-[#0B0F19] border-[#222938] text-white focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'
                : 'bg-white border-slate-200 text-slate-800 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'" />
          </div>

          <!-- Separador visual -->
          <div class="h-7 w-px self-end" :class="isDark ? 'bg-[#222938]' : 'bg-slate-200'"></div>

          <!-- Buscar nombre/cédula -->
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-medium" :class="isDark ? 'text-[#ffffff]' : 'text-slate-500'">
              Nombre / Cédula
            </label>
            <div class="relative">
              <i class="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px]"
                :class="isDark ? 'text-[#ffffff]' : 'text-slate-400'"></i>
              <input v-model="filterNombre" type="text" placeholder="Buscar…"
                class="h-7 pl-7 pr-2.5 text-[11px] font-medium rounded-[5px] border outline-none w-40 transition-all"
                :class="isDark
                  ? 'bg-[#0B0F19] border-[#222938] text-white placeholder:text-[#5a5a5a] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'
                  : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'" />
            </div>
          </div>

          <!-- Cargo -->
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-medium" :class="isDark ? 'text-[#ffffff]' : 'text-slate-500'">
              Cargo
            </label>
            <div class="relative">
              <select v-model="filterCargo"
                class="h-7 pl-2.5 pr-7 text-[11px] font-medium rounded-[5px] border outline-none appearance-none w-40 cursor-pointer transition-all"
                :class="isDark
                  ? 'bg-[#0B0F19] border-[#222938] text-white focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'
                  : 'bg-white border-slate-200 text-slate-800 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'">
                <option value="">Todos</option>
                <option v-for="c in opcionesCargos" :key="c" :value="c">{{ c }}</option>
              </select>
              <i class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none"
                :class="isDark ? 'text-[#ffffff]' : 'text-slate-400'"></i>
            </div>
          </div>

          <!-- Departamento -->
          <div v-if="hasPerm('admin.filtro_departamento') || isSuperAdmin" class="flex flex-col gap-1">
            <label class="text-[10px] font-medium" :class="isDark ? 'text-[#ffffff]' : 'text-slate-500'">
              Departamento
            </label>
            <div class="relative">
              <select v-model="filterDepartamento"
                class="h-7 pl-2.5 pr-7 text-[11px] font-medium rounded-[5px] border outline-none appearance-none w-44 cursor-pointer transition-all"
                :class="isDark
                  ? 'bg-[#0B0F19] border-[#222938] text-white focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'
                  : 'bg-white border-slate-200 text-slate-800 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'">
                <option value="">Todos</option>
                <option v-for="d in opcionesDepartamentos" :key="d" :value="d">{{ d }}</option>
              </select>
              <i class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none"
                :class="isDark ? 'text-[#888888]' : 'text-slate-400'"></i>
            </div>
          </div>

          <!-- Toggle solo extras -->
          <label class="flex items-center gap-2 cursor-pointer select-none self-end pb-1">
            <div class="relative">
              <input type="checkbox" v-model="soloConExtras" class="sr-only peer" />
              <div class="w-7 h-4 rounded-full transition-colors peer-checked:bg-[#3B82F6]"
                :class="isDark ? 'bg-[#222938]' : 'bg-slate-200'"></div>
              <div
                class="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform peer-checked:translate-x-3">
              </div>
            </div>
            <span class="text-[11px] font-medium whitespace-nowrap"
              :class="isDark ? 'text-[#E2E8F0]' : 'text-slate-700'">Solo con extras</span>
          </label>
        </div>

      </div>

      <!-- ── Nota sexagesimal ───────────────────────────────────────────────── -->
      <!-- <div class="px-4 py-1.5 rounded-xl text-[9px] font-medium"
      :class="isDark ? 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20' : 'bg-blue-50 text-blue-700 border border-blue-200'">
      <i class="fas fa-circle-info mr-1.5"></i>
      <strong>NOTA:</strong> Valores en sistema sexagesimal.
      15 min = 0,25 &nbsp;|&nbsp; 30 min = 0,50 &nbsp;|&nbsp; 45 min = 0,75 &nbsp;|&nbsp; 60 min = 1,0
    </div> -->

      <!-- ── Tabla (Vercel) ─────────────────────────────────────────────────── -->
      <div class="flex-1 overflow-hidden rounded-md border flex flex-col"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

        <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
          <table class="w-full border-separate border-spacing-0 text-[11px]">

            <!-- Encabezado uniforme -->
            <thead class="sticky top-0 z-30">
              <tr class="bg-[#1e2538]">
                <!-- Checkbox select-all -->
                <th rowspan="2" class="px-2 py-2 text-center border-b border-r w-8 border-[#f5f5f7]">
                  <input type="checkbox" :checked="isAllFilteredSelected" :indeterminate="isIndeterminate"
                    @change="toggleAllFiltered" class="w-3.5 h-3.5 cursor-pointer accent-[#3B82F6]" />
                </th>
                <th colspan="2"
                  class="px-3 py-2 text-left text-[10px] font-medium tracking-wide border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                  Colaborador
                </th>
                <th
                  class="px-3 py-2 text-center text-[10px] font-medium tracking-wide border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                  Fecha
                </th>
                <th colspan="2"
                  class="px-3 py-2 text-center text-[10px] font-medium tracking-wide border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                  Jornada
                </th>
                <th colspan="2"
                  class="px-3 py-2 text-center text-[10px] font-medium tracking-wide border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                  Tiempo laborado
                </th>
                <th v-for="col in ['RN', 'RNDF', 'RDDF', 'HEDO', 'HENO', 'HEFD', 'HEFN']" :key="col"
                  class="px-2 py-2 text-center text-[10px] font-medium tracking-wide border-b border-r w-12 border-[#f5f5f7] text-[#f5f5f7]">
                  {{ col }}
                </th>
                <th
                  class="px-3 py-2 text-center text-[10px] font-medium tracking-wide border-b w-20 border-[#f5f5f7] text-[#f5f5f7]">
                  Aprobar
                </th>
              </tr>
              <tr class="bg-[#1e2538]">
                <th
                  class="px-3 py-1.5 text-left text-[9px] font-normal border-b border-r w-28 border-[#f5f5f7] text-[#f5f5f7]">
                  Cédula</th>
                <th
                  class="px-3 py-1.5 text-left text-[9px] font-normal border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                  Nombre</th>
                <th
                  class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r w-24 border-[#f5f5f7] text-[#f5f5f7]">
                </th>
                <th
                  class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r w-20 border-[#f5f5f7] text-[#f5f5f7]">
                  Inicio</th>
                <th
                  class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r w-20 border-[#f5f5f7] text-[#f5f5f7]">
                  Fin</th>
                <th
                  class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r w-20 border-[#f5f5f7] text-[#f5f5f7]">
                  Entrada</th>
                <th
                  class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r w-20 border-[#f5f5f7] text-[#f5f5f7]">
                  Salida</th>
                <th v-for="_ in 7" :key="_"
                  class="px-2 py-1.5 text-center text-[9px] font-normal border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                  hrs</th>
                <th class="px-3 py-1.5 border-b" :class="isDark ? 'border-[#f5f5f7]' : 'border-slate-200'"></th>
              </tr>
            </thead>

            <tbody>
              <!-- Loading skeleton -->
              <tr v-if="isLoading || isCalculating" v-for="n in 8" :key="'sk-' + n">
                <td colspan="16" class="px-3 py-3">
                  <div class="h-3 w-full rounded animate-pulse" :class="isDark ? 'bg-[#161B26]' : 'bg-slate-100'"></div>
                </td>
              </tr>

              <!-- Sin datos -->
              <tr v-else-if="!filasPaginadas.length">
                <td colspan="16" class="px-4 py-14 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center"
                      :class="isDark ? 'bg-[#161B26]' : 'bg-slate-100'">
                      <i class="fas fa-calculator text-xl text-[#3B82F6]"></i>
                    </div>
                    <p class="text-[11px] font-bold uppercase" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                      Selecciona un rango de fechas y presiona Calcular
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Filas de datos -->
              <template v-else v-for="(item, idx) in filasPaginadas" :key="idx">

                <!-- Cabecera empresa -->
                <tr v-if="item.tipo === 'empresa'">
                  <td colspan="16" class="px-4 py-2 text-[10px] font-medium border-b" :class="isDark
                    ? 'bg-[#0B0F19] border-[#222938] text-[#E2E8F0]'
                    : 'bg-slate-100 border-slate-200 text-slate-700'">
                    <i class="fas fa-building mr-2 opacity-60 text-[#3B82F6]"></i>{{ item.data.empresa }}
                  </td>
                </tr>

                <!-- Fila normal -->
                <tr v-else-if="item.tipo === 'fila'" class="group transition-all duration-100" :class="[
                  idx % 2 !== 0
                    ? (isDark ? 'bg-white/[0.03]' : 'bg-slate-50/60')
                    : '',
                  isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-white/[0.03]/40'
                ]">

                  <!-- Checkbox fila -->
                  <td class="px-2 py-2 border-b border-r text-center"
                    :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                    <input type="checkbox" :checked="isSelected(item.data)" @change="toggleSelected(item.data)"
                      class="w-3.5 h-3.5 cursor-pointer accent-[#3B82F6]" />
                  </td>

                  <td class="px-3 py-2 border-b border-r font-mono text-[9px]"
                    :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">
                    {{ item.data.cedula }}
                  </td>

                  <td class="px-3 py-2 border-b border-r" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                    <div class="font-bold uppercase" :class="isDark ? 'text-white' : 'text-slate-900'">
                      {{ item.data.nombre }}
                    </div>
                    <div class="text-[8px] mt-0.5" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                      {{ item.data.cargo || '—' }}
                    </div>
                  </td>

                  <td class="px-3 py-2 border-b border-r text-center" :class="[isDark ? 'border-[#222938]' : 'border-slate-100',
                  item.data.es_dominical
                    ? 'text-violet-500 font-semibold'
                    : (isDark ? 'text-slate-300' : 'text-slate-700')]">
                    <span>{{ formatFecha(item.data.fecha) }}</span>
                    <span v-if="item.data.es_dominical"
                      class="ml-1 text-[7px] font-semibold bg-violet-500/20 text-violet-500 px-1 rounded">
                      {{ esDomingo(item.data.fecha) ? 'DOM' : 'FEST' }}
                    </span>
                  </td>

                  <td class="px-3 py-2 border-b border-r text-center font-mono"
                    :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">
                    {{ item.data.inicio_turno || '—' }}
                  </td>
                  <td class="px-3 py-2 border-b border-r text-center font-mono"
                    :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">
                    {{ item.data.fin_turno || '—' }}
                  </td>

                  <td class="px-3 py-2 border-b border-r text-center font-mono"
                    :class="isDark ? 'border-[#222938] text-emerald-400' : 'border-slate-100 text-emerald-700'">
                    {{ formatHora(item.data.fecha_entrada) || '—' }}
                  </td>
                  <td class="px-3 py-2 border-b border-r text-center font-mono"
                    :class="isDark ? 'border-[#222938] text-emerald-400' : 'border-slate-100 text-emerald-700'">
                    {{ formatHora(item.data.fecha_salida) || '—' }}
                  </td>

                  <td v-for="col in COLS_HX" :key="col" class="px-2 py-2 border-b border-r text-center" :class="[
                    isDark ? 'border-[#222938]' : 'border-slate-100',
                    Number(item.data[col]) > 0
                      ? (isDark ? 'text-[#3B82F6] font-semibold' : 'text-blue-500 font-semibold')
                      : (isDark ? 'text-slate-600' : 'text-slate-300')
                  ]">
                    {{ fmtCalculo(item.data[col]) }}
                  </td>

                  <td class="px-2 py-2 border-b text-center" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                    <div class="flex items-center justify-center gap-1">
                      <button @click="abrirModalAprobar(item.data, true)" :disabled="!item.data.id"
                        :title="!item.data.id ? 'Guarda los registros primero' : ''"
                        class="w-6 h-6 rounded-[4px] flex items-center justify-center transition-all border disabled:opacity-30 disabled:cursor-not-allowed"
                        :class="item.data.aprobado === true
                          ? 'bg-[#16a34a] border-[#16a34a] text-white'
                          : (isDark
                            ? 'bg-transparent border-[#222938] text-[#888888] hover:text-[#4ade80] hover:border-[#16a34a]/40'
                            : 'bg-transparent border-slate-200 text-slate-400 hover:text-[#16a34a] hover:border-[#16a34a]/40')">
                        <i class="fas fa-check text-[9px]"></i>
                      </button>
                      <button @click="abrirModalAprobar(item.data, false)" :disabled="!item.data.id"
                        :title="!item.data.id ? 'Guarda los registros primero' : ''"
                        class="w-6 h-6 rounded-[4px] flex items-center justify-center transition-all border disabled:opacity-30 disabled:cursor-not-allowed"
                        :class="item.data.aprobado === false
                          ? 'bg-[#dc2626] border-[#dc2626] text-white'
                          : (isDark
                            ? 'bg-transparent border-[#222938] text-[#888888] hover:text-[#f87171] hover:border-[#dc2626]/40'
                            : 'bg-transparent border-slate-200 text-slate-400 hover:text-[#dc2626] hover:border-[#dc2626]/40')">
                        <i class="fas fa-times text-[9px]"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Subtotal colaborador (Vercel sutil) -->
                <tr v-else-if="item.tipo === 'subtotal'">
                  <td colspan="8" class="px-3 py-2 border-b border-r text-[10px] font-medium" :class="isDark
                    ? 'bg-[#3B82F6]/[0.06] border-[#222938] text-[#60A5FA]'
                    : 'bg-blue-50/50 border-slate-200 text-blue-700'">
                    Subtotal — {{ item.data.nombre }}
                  </td>
                  <td v-for="col in COLS_HX" :key="col"
                    class="px-2 py-2 border-b border-r text-center text-[11px] font-semibold" :class="isDark
                      ? 'bg-[#3B82F6]/[0.06] border-[#222938] text-[#60A5FA]'
                      : 'bg-blue-50/50 border-slate-200 text-blue-700'">
                    {{ fmtCalculo(item.data.subtotales[col]) }}
                  </td>
                  <td class="border-b"
                    :class="isDark ? 'bg-[#3B82F6]/[0.06] border-[#222938]' : 'bg-blue-50/50 border-slate-200'">
                  </td>
                </tr>

              </template>
            </tbody>
          </table>
        </div>

        <!-- Paginación (Vercel) -->
        <div v-if="filasAplanadas.length > 0" class="px-3 py-2 border-t flex items-center justify-between"
          :class="isDark ? 'border-[#222938] bg-[#0B0F19]/40' : 'border-slate-200 bg-slate-50/60'">
          <span class="text-[11px]" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
            <span :class="isDark ? 'text-white font-medium' : 'text-slate-900 font-medium'">{{ totalRegistros }}</span>
            {{ totalRegistros === 1 ? 'registro' : 'registros' }}
          </span>
          <div class="flex items-center gap-1.5">
            <button @click="currentPage--" :disabled="currentPage === 1"
              class="w-7 h-7 flex items-center justify-center rounded-[5px] border transition-all disabled:opacity-30"
              :class="isDark
                ? 'bg-[#161B26] border-[#222938] text-[#E2E8F0] hover:bg-white/[0.03] hover:border-[#3B82F6]/40'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'">
              <i class="fas fa-chevron-left text-[9px]"></i>
            </button>
            <div class="h-7 px-3 flex items-center rounded-[5px] text-[11px] font-medium border"
              :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-900'">
              {{ currentPage }} / {{ totalPages }}
            </div>
            <button @click="currentPage++" :disabled="currentPage >= totalPages"
              class="w-7 h-7 flex items-center justify-center rounded-[5px] border transition-all disabled:opacity-30"
              :class="isDark
                ? 'bg-[#161B26] border-[#222938] text-[#E2E8F0] hover:bg-white/[0.03] hover:border-[#3B82F6]/40'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'">
              <i class="fas fa-chevron-right text-[9px]"></i>
            </button>
          </div>
        </div>
      </div>

    </template>
    <!-- ══ FIN TAB CÁLCULOS ══════════════════════════════════════════════════ -->

    <!-- ══ TAB CARGUE HORAS ════════════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'cargue' && (isSuperAdmin || hasPerm('horas.cargue'))">
      <div class="flex flex-col gap-3 flex-1 overflow-hidden">

        <!-- Sub-nav: Upload vs Historial -->
        <div class="flex items-center gap-0.5 p-0.5 rounded-md border w-fit"
          :class="isDark ? 'bg-[#0B0F19] border-[#222938]' : 'bg-slate-100 border-slate-200'">
          <button @click="selectCargueView('upload')"
            class="px-3 h-6 rounded-[5px] text-[10px] font-medium transition-all flex items-center gap-1.5" :class="activeCargueView === 'upload'
              ? (isDark ? 'bg-[#161B26] text-white' : 'bg-white text-slate-900 shadow-sm')
              : (isDark ? 'text-[#888888] hover:text-white' : 'text-slate-500 hover:text-slate-800')">
            <i class="fas fa-cloud-arrow-up text-[9px]"></i>Cargue de horas
          </button>
          <button @click="selectCargueView('historial')"
            class="px-3 h-6 rounded-[5px] text-[10px] font-medium transition-all flex items-center gap-1.5" :class="activeCargueView === 'historial'
              ? (isDark ? 'bg-[#161B26] text-white' : 'bg-white text-slate-900 shadow-sm')
              : (isDark ? 'text-[#888888] hover:text-white' : 'text-slate-500 hover:text-slate-800')">
            <i class="fas fa-table-list text-[9px]"></i>Horas cargadas
          </button>
        </div>

        <!-- ── Vista: Cargue de horas ──────────────────────────────────────── -->
        <template v-if="activeCargueView === 'upload'">

          <!-- Toolbar -->
          <div class="flex items-center gap-2 flex-wrap p-2.5 rounded-md border"
            :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
            <button @click="handleDescargarPlantilla" :disabled="isExportingPlantilla"
              class="flex items-center gap-1.5 h-7 px-3 rounded-[5px] text-[11px] font-medium transition-all active:scale-[0.98] disabled:opacity-50 border"
              :class="isDark
                ? 'bg-[#0B0F19] border-[#222938] text-[#E2E8F0] hover:bg-white/[0.03] hover:border-[#3B82F6]/40'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'">
              <i :class="isExportingPlantilla ? 'fas fa-spinner fa-spin' : 'fas fa-download'" class="text-[10px]"></i>
              Descargar plantilla
            </button>
            <div class="flex-1 flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-[5px] border min-w-[280px]"
              :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-[#888888]' : 'bg-slate-50 border-slate-200 text-slate-500'">
              <i class="fas fa-circle-info text-[10px] text-[#3B82F6]"></i>
              <span>Descarga la plantilla, complétala y súbela aquí. El sistema asignará los registros
                automáticamente.</span>
            </div>
          </div>

          <!-- Card principal -->
          <div class="flex-1 rounded-md border flex flex-col overflow-hidden"
            :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

            <!-- Drop zone -->
            <div
              class="flex-1 flex flex-col items-center justify-center gap-4 p-8 m-4 rounded-md border border-dashed cursor-pointer transition-all"
              :class="[
                isDragOver
                  ? 'border-[#3B82F6] bg-[#3B82F6]/[0.06]'
                  : (isDark
                    ? 'border-[#222938] hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/[0.03]'
                    : 'border-slate-300 hover:border-[#3B82F6]/50 hover:bg-slate-50/60'),
                archivoSeleccionado ? 'border-[#16a34a] bg-[#16a34a]/[0.04]' : ''
              ]" @dragover.prevent="isDragOver = true" @dragleave="isDragOver = false" @drop.prevent="handleDrop"
              @click="$refs.fileInput.click()">

              <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="handleFileSelect" />

              <div class="w-12 h-12 rounded-md flex items-center justify-center transition-all" :class="archivoSeleccionado
                ? (isDark ? 'bg-[#16a34a]/10 text-[#4ade80]' : 'bg-green-50 text-[#16a34a]')
                : (isDark ? 'bg-[#3B82F6]/10 text-[#60A5FA]' : 'bg-blue-50 text-[#3B82F6]')">
                <i class="text-[18px] transition-all" :class="[
                  archivoSeleccionado ? 'fas fa-file-circle-check' : 'fas fa-file-arrow-up',
                  isDragOver ? 'scale-110' : ''
                ]"></i>
              </div>

              <div class="text-center">
                <p class="text-[13px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">
                  {{ archivoSeleccionado ? archivoSeleccionado.name : 'Arrastra tu Excel o haz clic para seleccionar' }}
                </p>
                <p class="text-[11px] mt-1" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
                  {{ archivoSeleccionado ? 'Archivo listo para cargar' : 'Formatos: .xlsx, .xls' }}
                </p>
              </div>

              <button v-if="archivoSeleccionado" @click.stop="archivoSeleccionado = null"
                class="h-6 px-2.5 rounded-[5px] text-[10px] font-medium border transition-colors" :class="isDark
                  ? 'border-[#222938] text-[#888888] hover:text-[#f87171] hover:border-[#f87171]/40'
                  : 'border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300'">
                <i class="fas fa-times mr-1 text-[9px]"></i>Quitar
              </button>
            </div>

            <!-- Mensajes de estado -->
            <div v-if="cargueSuccessMsg"
              class="mx-4 mb-3 px-3 py-2 rounded-[5px] text-[11px] font-medium border flex items-center gap-2"
              :class="isDark ? 'bg-[#16a34a]/[0.08] border-[#16a34a]/30 text-[#4ade80]' : 'bg-green-50 border-green-200 text-green-700'">
              <i class="fas fa-circle-check text-[12px]"></i>{{ cargueSuccessMsg }}
            </div>
            <div v-if="cargueErrorMsg"
              class="mx-4 mb-3 px-3 py-2 rounded-[5px] text-[11px] font-medium border flex items-center gap-2"
              :class="isDark ? 'bg-[#dc2626]/[0.08] border-[#dc2626]/30 text-[#f87171]' : 'bg-red-50 border-red-200 text-red-700'">
              <i class="fas fa-triangle-exclamation text-[12px]"></i>{{ cargueErrorMsg }}
            </div>

            <!-- Footer -->
            <div class="px-4 py-2.5 border-t flex items-center justify-end"
              :class="isDark ? 'border-[#222938] bg-[#0B0F19]/40' : 'border-slate-200 bg-slate-50/60'">
              <button @click="handleSubirExcel" :disabled="!archivoSeleccionado || isUploading"
                class="flex items-center gap-1.5 h-7 px-3 rounded-[5px] text-[11px] font-medium transition-all active:scale-[0.98] disabled:opacity-40 bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                <i :class="isUploading ? 'fas fa-spinner fa-spin' : 'fas fa-cloud-arrow-up'" class="text-[10px]"></i>
                {{ isUploading ? 'Guardando…' : 'Guardar cargue' }}
              </button>
            </div>
          </div>
        </template>
        <!-- ── Fin Vista: Cargue de horas ──────────────────────────────────── -->

        <!-- ── Vista: Historial de horas cargadas ──────────────────────────── -->
        <template v-else-if="activeCargueView === 'historial'">

          <!-- Toolbar filtros -->
          <div class="flex items-center gap-2 flex-wrap p-2.5 rounded-md border"
            :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

            <div class="flex flex-col gap-1">
              <label class="text-[10px] font-medium" :class="isDark ? 'text-[#ecedef]' : 'text-slate-500'">Desde</label>
              <input type="date" v-model="cargueStartDate"
                class="h-7 px-2.5 text-[11px] font-medium rounded-[5px] border outline-none transition-all"
                :class="isDark
                  ? 'bg-[#0B0F19] border-[#222938] text-white focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'
                  : 'bg-white border-slate-200 text-slate-800 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-[10px] font-medium" :class="isDark ? 'text-[#ecedef]' : 'text-slate-500'">Hasta</label>
              <input type="date" v-model="cargueEndDate"
                class="h-7 px-2.5 text-[11px] font-medium rounded-[5px] border outline-none transition-all"
                :class="isDark
                  ? 'bg-[#0B0F19] border-[#222938] text-white focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'
                  : 'bg-white border-slate-200 text-slate-800 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'" />
            </div>

            <!-- Buscar -->
            <button @click="handleCargarCargueHistorial" :disabled="cargueIsLoading"
              class="self-end flex items-center gap-1.5 h-7 px-3 rounded-[5px] text-[11px] font-medium transition-all active:scale-[0.98] disabled:opacity-40 border"
              :class="isDark
                ? 'bg-[#0B0F19] border-[#222938] text-[#E2E8F0] hover:bg-white/[0.03] hover:border-[#3B82F6]/40'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'">
              <i :class="cargueIsLoading ? 'fas fa-spinner fa-spin' : 'fas fa-arrows-rotate'" class="text-[10px]"></i>
              Buscar
            </button>

            <span class="self-end text-[11px] ml-auto" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
              <span class="font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">{{ cargueTotalRegistros
              }}</span>
              registro(s) encontrado(s)
            </span>
          </div>

          <!-- Tabla historial -->
          <div class="flex-1 overflow-hidden rounded-md border flex flex-col"
            :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

            <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
              <table class="w-full border-separate border-spacing-0 text-[11px]">

                <thead class="sticky top-0 z-30">
                  <tr class="bg-[#1e2538]">
                    <th
                      class="px-3 py-2 text-left text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                      Cédula</th>
                    <th
                      class="px-3 py-2 text-left text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                      Nombre</th>
                    <th
                      class="px-3 py-2 text-center text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                      Fecha</th>
                    <th
                      class="px-3 py-2 text-left text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                      Departamento</th>
                    <th v-for="col in COLS_HX" :key="col"
                      class="px-2 py-2 text-center text-[10px] font-medium border-b border-r w-12 border-[#f5f5f7] text-[#f5f5f7]">
                      {{ col.toUpperCase() }}
                    </th>
                    <th
                      class="px-3 py-2 text-center text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7] w-20">
                      Estado</th>
                    <th
                      class="px-3 py-2 text-center text-[10px] font-medium border-b border-[#f5f5f7] text-[#f5f5f7] w-20">
                      Aprobar</th>
                  </tr>
                </thead>

                <tbody>
                  <!-- Loading -->
                  <tr v-if="cargueIsLoading" v-for="n in 8" :key="'csk-' + n">
                    <td colspan="13" class="px-3 py-3">
                      <div class="h-3 w-full rounded animate-pulse" :class="isDark ? 'bg-[#161B26]' : 'bg-slate-100'">
                      </div>
                    </td>
                  </tr>

                  <!-- Sin datos -->
                  <tr v-else-if="!cargueFilasPaginadas.length">
                    <td colspan="13" class="px-4 py-14 text-center">
                      <div class="flex flex-col items-center gap-3">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center"
                          :class="isDark ? 'bg-[#161B26]' : 'bg-slate-100'">
                          <i class="fas fa-table-list text-xl text-[#3B82F6]"></i>
                        </div>
                        <p class="text-[11px] font-bold uppercase"
                          :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                          Selecciona un rango y presiona Buscar
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Filas agrupadas -->
                  <template v-else v-for="(item, idx) in cargueFilasPaginadas" :key="idx">

                    <!-- Cabecera empresa -->
                    <tr v-if="item.tipo === 'empresa'">
                      <td colspan="13" class="px-4 py-2 text-[10px] font-medium border-b"
                        :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-[#E2E8F0]' : 'bg-slate-100 border-slate-200 text-slate-700'">
                        <i class="fas fa-building mr-2 opacity-60 text-[#3B82F6]"></i>{{ item.data.empresa }}
                      </td>
                    </tr>

                    <!-- Fila normal -->
                    <tr v-else-if="item.tipo === 'fila'" class="group transition-all duration-100"
                      :class="idx % 2 !== 0 ? (isDark ? 'bg-white/[0.03]' : 'bg-slate-50/60') : ''">

                      <td class="px-3 py-2 border-b border-r font-mono text-[9px]"
                        :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">
                        {{ item.data.cedula }}
                      </td>

                      <td class="px-3 py-2 border-b border-r" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                        <div class="font-bold uppercase" :class="isDark ? 'text-white' : 'text-slate-900'">{{
                          item.data.nombre }}</div>
                        <div class="text-[8px] mt-0.5" :class="isDark ? 'text-slate-500' : 'text-slate-400'">{{
                          item.data.cargo || '—' }}</div>
                      </td>

                      <td class="px-3 py-2 border-b border-r text-center"
                        :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">
                        {{ formatFecha(item.data.fecha) }}
                      </td>

                      <td class="px-3 py-2 border-b border-r"
                        :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-600'">
                        {{ item.data.departamento || '—' }}
                      </td>

                      <td v-for="col in COLS_HX" :key="col" class="px-2 py-2 border-b border-r text-center" :class="[isDark ? 'border-[#222938]' : 'border-slate-100',
                      Number(item.data[col]) > 0
                        ? (isDark ? 'text-[#3B82F6] font-semibold' : 'text-blue-500 font-semibold')
                        : (isDark ? 'text-slate-600' : 'text-slate-300')]">
                        {{ fmtCalculo(item.data[col]) }}
                      </td>

                      <!-- Estado chip -->
                      <td class="px-2 py-2 border-b border-r text-center"
                        :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold" :class="item.data.aprobado === true
                          ? 'bg-[#16a34a]/15 text-[#4ade80]'
                          : item.data.aprobado === false
                            ? 'bg-[#dc2626]/15 text-[#f87171]'
                            : (isDark ? 'bg-[#222938] text-[#888888]' : 'bg-slate-100 text-slate-500')">
                          <i class="mr-1 text-[8px]"
                            :class="item.data.aprobado === true ? 'fas fa-check' : item.data.aprobado === false ? 'fas fa-times' : 'fas fa-clock'"></i>
                          {{ item.data.aprobado === true ? 'Aprobado' : item.data.aprobado === false ? 'Rechazado' :
                            'Pendiente' }}
                        </span>
                      </td>

                      <!-- Botones aprobar/rechazar -->
                      <td class="px-2 py-2 border-b text-center"
                        :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                        <div class="flex items-center justify-center gap-1">
                          <button @click="abrirModalAprobar(item.data, true)" :disabled="!item.data.id"
                            class="w-6 h-6 rounded-[4px] flex items-center justify-center transition-all border disabled:opacity-30 disabled:cursor-not-allowed"
                            :class="item.data.aprobado === true
                              ? 'bg-[#16a34a] border-[#16a34a] text-white'
                              : (isDark
                                ? 'bg-transparent border-[#222938] text-[#888888] hover:text-[#4ade80] hover:border-[#16a34a]/40'
                                : 'bg-transparent border-slate-200 text-slate-400 hover:text-[#16a34a] hover:border-[#16a34a]/40')">
                            <i class="fas fa-check text-[9px]"></i>
                          </button>
                          <button @click="abrirModalAprobar(item.data, false)" :disabled="!item.data.id"
                            class="w-6 h-6 rounded-[4px] flex items-center justify-center transition-all border disabled:opacity-30 disabled:cursor-not-allowed"
                            :class="item.data.aprobado === false
                              ? 'bg-[#dc2626] border-[#dc2626] text-white'
                              : (isDark
                                ? 'bg-transparent border-[#222938] text-[#888888] hover:text-[#f87171] hover:border-[#dc2626]/40'
                                : 'bg-transparent border-slate-200 text-slate-400 hover:text-[#dc2626] hover:border-[#dc2626]/40')">
                            <i class="fas fa-times text-[9px]"></i>
                          </button>
                        </div>
                      </td>
                    </tr>

                    <!-- Subtotal colaborador -->
                    <tr v-else-if="item.tipo === 'subtotal'">
                      <td colspan="4" class="px-3 py-2 border-b border-r text-[10px] font-medium"
                        :class="isDark ? 'bg-[#3B82F6]/[0.06] border-[#222938] text-[#60A5FA]' : 'bg-blue-50/50 border-slate-200 text-blue-700'">
                        Subtotal — {{ item.data.nombre }}
                      </td>
                      <td v-for="col in COLS_HX" :key="col"
                        class="px-2 py-2 border-b border-r text-center text-[11px] font-semibold"
                        :class="isDark ? 'bg-[#3B82F6]/[0.06] border-[#222938] text-[#60A5FA]' : 'bg-blue-50/50 border-slate-200 text-blue-700'">
                        {{ fmtCalculo(item.data.subtotales[col]) }}
                      </td>
                      <td colspan="2" class="border-b"
                        :class="isDark ? 'bg-[#3B82F6]/[0.06] border-[#222938]' : 'bg-blue-50/50 border-slate-200'">
                      </td>
                    </tr>

                  </template>
                </tbody>
              </table>
            </div>

            <!-- Paginación -->
            <div v-if="cargueFilasAplanadas.length > 0" class="px-3 py-2 border-t flex items-center justify-between"
              :class="isDark ? 'border-[#222938] bg-[#0B0F19]/40' : 'border-slate-200 bg-slate-50/60'">
              <span class="text-[11px]" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
                <span class="font-medium" :class="isDark ? 'text-white' : 'text-slate-900'">{{ cargueTotalRegistros
                }}</span>
                {{ cargueTotalRegistros === 1 ? 'registro' : 'registros' }}
              </span>
              <div class="flex items-center gap-1.5">
                <button @click="cargueCurrentPage--" :disabled="cargueCurrentPage === 1"
                  class="w-7 h-7 flex items-center justify-center rounded-[5px] border transition-all disabled:opacity-30"
                  :class="isDark
                    ? 'bg-[#161B26] border-[#222938] text-[#E2E8F0] hover:bg-white/[0.03] hover:border-[#3B82F6]/40'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'">
                  <i class="fas fa-chevron-left text-[9px]"></i>
                </button>
                <div class="h-7 px-3 flex items-center rounded-[5px] text-[11px] font-medium border"
                  :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-900'">
                  {{ cargueCurrentPage }} / {{ cargueTotalPages }}
                </div>
                <button @click="cargueCurrentPage++" :disabled="cargueCurrentPage >= cargueTotalPages"
                  class="w-7 h-7 flex items-center justify-center rounded-[5px] border transition-all disabled:opacity-30"
                  :class="isDark
                    ? 'bg-[#161B26] border-[#222938] text-[#E2E8F0] hover:bg-white/[0.03] hover:border-[#3B82F6]/40'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'">
                  <i class="fas fa-chevron-right text-[9px]"></i>
                </button>
              </div>
            </div>
          </div>
        </template>
        <!-- ── Fin Vista: Historial ─────────────────────────────────────────── -->

      </div>
    </template>
    <!-- ══ FIN TAB CARGUE HORAS ══════════════════════════════════════════════ -->

    <!-- ══ TAB GUARDADOS ════════════════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'guardados' && (isSuperAdmin || hasPerm('horas.guardados'))">

      <!-- Toolbar -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-[11px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          <span class="font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">{{ registrosGuardados.length
          }}</span>
          registro(s) guardado(s) en el rango
          <span v-if="selectedGuardados.size" class="ml-2 font-semibold text-[#3B82F6]">
            · {{ selectedGuardados.size }} seleccionado(s)
          </span>
        </span>

        <div class="ml-auto flex items-center gap-1.5 flex-wrap">
          <!-- Acciones masivas: solo visibles cuando hay selección -->
          <template v-if="selectedGuardados.size > 0">
            <!-- Limpiar -->
            <button @click="clearSeleccionGuardados"
              class="h-7 px-2 rounded-[5px] border text-[11px] font-medium transition-all"
              :class="isDark ? 'border-[#222938] text-[#888888] hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'">
              <i class="fas fa-xmark text-[9px]"></i> Limpiar
            </button>
            <!-- Aprobar seleccionados -->
            <button @click="aprobarSeleccionadosGuardados(true)" :disabled="bulkGuardandoAprobacion"
              class="h-7 px-3 rounded-[5px] border text-[11px] font-medium flex items-center gap-1.5 transition-all disabled:opacity-40"
              :class="isDark ? 'bg-[#16a34a]/10 border-[#16a34a]/40 text-[#4ade80] hover:bg-[#16a34a]/20' : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'">
              <i :class="bulkGuardandoAprobacion ? 'fas fa-spinner fa-spin' : 'fas fa-check'" class="text-[9px]"></i>
              Aprobar ({{ selectedGuardados.size }})
            </button>
            <!-- Rechazar seleccionados -->
            <button @click="aprobarSeleccionadosGuardados(false)" :disabled="bulkGuardandoAprobacion"
              class="h-7 px-3 rounded-[5px] border text-[11px] font-medium flex items-center gap-1.5 transition-all disabled:opacity-40"
              :class="isDark ? 'bg-[#dc2626]/10 border-[#dc2626]/40 text-[#f87171] hover:bg-[#dc2626]/20' : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'">
              <i class="fas fa-times text-[9px]"></i>
              Rechazar ({{ selectedGuardados.size }})
            </button>
            <!-- Eliminar seleccionados -->
            <button @click="eliminarSeleccionadosGuardados" :disabled="bulkEliminandoGuardados"
              class="h-7 px-3 rounded-[5px] border text-[11px] font-medium flex items-center gap-1.5 transition-all disabled:opacity-40"
              :class="isDark ? 'bg-[#dc2626]/10 border-[#dc2626]/40 text-[#f87171] hover:bg-[#dc2626]/20' : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'">
              <i :class="bulkEliminandoGuardados ? 'fas fa-spinner fa-spin' : 'fas fa-trash'" class="text-[9px]"></i>
              Eliminar ({{ selectedGuardados.size }})
            </button>
          </template>

          <!-- Obs. grupal por fecha -->
          <button v-if="fechasUnicasGuardados.length" @click="abrirObsGrupal()"
            class="h-7 px-3 rounded-[5px] border text-[11px] font-medium flex items-center gap-1.5 transition-all"
            :class="isDark ? 'bg-[#161B26] border-amber-500/30 text-amber-400 hover:bg-amber-500/10' : 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50'"
            title="Agregar observación/justificación a todos los registros de una fecha">
            <i class="fas fa-pen-to-square text-[9px]"></i> Obs. por fecha
          </button>

          <!-- Refresh -->
          <button @click="handleTabGuardados" :disabled="isLoadingGuardados"
            class="h-7 w-7 rounded-[5px] border flex items-center justify-center transition-all disabled:opacity-40"
            :class="isDark ? 'bg-[#161B26] border-[#222938] text-[#888888] hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'">
            <i class="fas fa-arrows-rotate text-[10px]" :class="{ 'fa-spin': isLoadingGuardados }"></i>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-hidden rounded-md border flex flex-col"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

        <div v-if="isLoadingGuardados" class="flex-1 flex items-center justify-center">
          <i class="fas fa-spinner fa-spin text-[#3B82F6] text-xl"></i>
        </div>

        <div v-else-if="!filasPaginadasGuardados.length"
          class="flex-1 flex flex-col items-center justify-center gap-3 p-12">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center"
            :class="isDark ? 'bg-[#161B26]' : 'bg-slate-100'">
            <i class="fas fa-floppy-disk text-xl text-[#3B82F6]"></i>
          </div>
          <p class="text-[11px] font-bold uppercase" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            No hay registros guardados en el rango seleccionado
          </p>
        </div>

        <div v-else class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
          <table class="w-full border-separate border-spacing-0 text-[11px]">
            <thead class="sticky top-0 z-30">
              <tr class="bg-[#1e2538]">
                <!-- Checkbox seleccionar todos -->
                <th class="px-3 py-2 text-center border-b border-r border-[#f5f5f7] w-8">
                  <input type="checkbox" :checked="allGuardadosSelected" :indeterminate="someGuardadosSelected"
                    @change="toggleAllGuardados" class="w-3.5 h-3.5 rounded accent-[#3B82F6] cursor-pointer" />
                </th>
                <th
                  class="px-3 py-2 text-left text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                  Cédula</th>
                <th
                  class="px-3 py-2 text-left text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                  Nombre</th>
                <th
                  class="px-3 py-2 text-center text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                  Fecha</th>
                <th
                  class="px-3 py-2 text-left text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                  Departamento</th>
                <th
                  class="px-3 py-2 text-center text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7] w-20">
                  Entrada</th>
                <th
                  class="px-3 py-2 text-center text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7] w-20">
                  Salida</th>
                <th
                  class="px-3 py-2 text-center text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7] w-24">
                  T. Laborado</th>
                <th v-for="col in COLS_HX" :key="col"
                  class="px-2 py-2 text-center text-[10px] font-medium border-b border-r w-12 border-[#f5f5f7] text-[#f5f5f7]">
                  {{ col.toUpperCase() }}
                </th>
                <th
                  class="px-3 py-2 text-center text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7] w-24">
                  Estado</th>
                <th
                  class="px-3 py-2 text-center text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7] w-32">
                  Actividad</th>
                <th class="px-3 py-2 text-center text-[10px] font-medium border-b border-[#f5f5f7] text-[#f5f5f7] w-28">
                  Acciones</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(item, idx) in filasPaginadasGuardados" :key="idx">

                <!-- Empresa -->
                <tr v-if="item.tipo === 'empresa'">
                  <td colspan="18" class="px-4 py-2 text-[10px] font-medium border-b"
                    :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-[#E2E8F0]' : 'bg-slate-100 border-slate-200 text-slate-700'">
                    <i class="fas fa-building mr-2 opacity-60 text-[#3B82F6]"></i>{{ item.data.empresa }}
                  </td>
                </tr>

                <!-- Fila normal -->
                <tr v-else-if="item.tipo === 'fila'" class="group transition-all duration-100" :class="[
                  selectedGuardados.has(item.data.id)
                    ? (isDark ? 'bg-[#3B82F6]/[0.07]' : 'bg-blue-50/70')
                    : editandoId === item.data.id
                      ? (isDark ? 'bg-[#3B82F6]/[0.06]' : 'bg-blue-50/60')
                      : idx % 2 !== 0 ? (isDark ? 'bg-white/[0.03]' : 'bg-slate-50/60') : ''
                ]">
                  <!-- Checkbox -->
                  <td class="px-3 py-2 border-b border-r text-center"
                    :class="isDark ? 'border-[#222938]' : 'border-slate-100'" @click.stop>
                    <input type="checkbox" :checked="selectedGuardados.has(item.data.id)"
                      @change="toggleGuardadoSelected(item.data.id)"
                      class="w-3.5 h-3.5 rounded accent-[#3B82F6] cursor-pointer" />
                  </td>
                  <!-- Cédula -->
                  <td class="px-3 py-2 border-b border-r font-mono text-[9px]"
                    :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">
                    {{ item.data.cedula }}
                  </td>
                  <!-- Nombre -->
                  <td class="px-3 py-2 border-b border-r" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                    <div class="font-bold uppercase" :class="isDark ? 'text-white' : 'text-slate-900'">{{
                      item.data.nombre }}</div>
                    <div class="text-[8px] mt-0.5" :class="isDark ? 'text-slate-500' : 'text-slate-400'">{{
                      item.data.cargo || '—' }}</div>
                  </td>
                  <!-- Fecha -->
                  <td class="px-3 py-2 border-b border-r text-center"
                    :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">
                    {{ formatFecha(item.data.fecha) }}
                  </td>
                  <!-- Dpto -->
                  <td class="px-3 py-2 border-b border-r"
                    :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-600'">
                    {{ item.data.departamento || '—' }}
                  </td>
                  <!-- Entrada -->
                  <td class="px-2 py-2 border-b border-r text-center font-mono text-[10px]"
                    :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-600'">
                    {{ item.data.fecha_entrada ? item.data.fecha_entrada.split(' ')[1]?.slice(0, 5) ?? '—' : '—' }}
                  </td>
                  <!-- Salida -->
                  <td class="px-2 py-2 border-b border-r text-center font-mono text-[10px]"
                    :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-600'">
                    {{ item.data.fecha_salida ? item.data.fecha_salida.split(' ')[1]?.slice(0, 5) ?? '—' : '—' }}
                  </td>
                  <!-- T. Laborado -->
                  <td class="px-2 py-2 border-b border-r text-center text-[10px] font-semibold"
                    :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">
                    <template v-if="item.data.fecha_entrada && item.data.fecha_salida">
                      {{ calcularTiempoLaborado(item.data.fecha_entrada, item.data.fecha_salida) }}
                    </template>
                    <span v-else :class="isDark ? 'text-slate-600' : 'text-slate-300'">—</span>
                  </td>



                  <!-- Celdas de horas: input en modo edición, valor normal en modo lectura -->
                  <td v-for="col in COLS_HX" :key="col" class="px-1 py-1 border-b border-r text-center"
                    :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                    <input v-if="editandoId === item.data.id" type="number" v-model.number="editandoValores[col]"
                      min="0" max="24" step="0.5"
                      class="w-14 text-center text-[11px] font-semibold rounded px-1 py-0.5 border outline-none transition-all"
                      :class="isDark
                        ? 'bg-[#0B0F19] border-[#3B82F6]/50 text-[#60A5FA] focus:border-[#3B82F6]'
                        : 'bg-white border-blue-300 text-blue-600 focus:border-blue-500'" />
                    <span v-else :class="[
                      Number(item.data[col]) > 0
                        ? (isDark ? 'text-[#3B82F6] font-semibold' : 'text-blue-500 font-semibold')
                        : (isDark ? 'text-slate-600' : 'text-slate-300')
                    ]">{{ formatDecimal(item.data[col]) }}</span>
                  </td>



                  <!-- Estado -->
                  <td class="px-2 py-2 border-b border-r text-center"
                    :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold" :class="item.data.aprobado === true
                      ? 'bg-[#16a34a]/15 text-[#4ade80]'
                      : item.data.aprobado === false
                        ? 'bg-[#dc2626]/15 text-[#f87171]'
                        : (isDark ? 'bg-[#222938] text-[#888888]' : 'bg-slate-100 text-slate-500')">
                      <i class="mr-1 text-[8px]"
                        :class="item.data.aprobado === true ? 'fas fa-check' : item.data.aprobado === false ? 'fas fa-times' : 'fas fa-clock'"></i>
                      {{ item.data.aprobado === true ? 'Aprobado' : item.data.aprobado === false ? 'Rechazado' :
                        'Pendiente' }}
                    </span>
                  </td>

                  <!-- Actividad (justificación) -->
                  <td class="px-2 py-2 border-b border-r text-center"
                    :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                    <template v-if="tieneExtras(item.data)">
                      <button v-if="item.data.actividad" @click="abrirModalActividad(item.data)"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all"
                        title="Ver / editar actividad">
                        <i class="fas fa-check text-[8px]"></i>Justificado
                      </button>
                      <button v-else @click="abrirModalActividad(item.data)"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-all animate-pulse"
                        title="Agregar actividad requerida">
                        <i class="fas fa-triangle-exclamation text-[8px]"></i>Sin justificación
                      </button>
                    </template>
                    <span v-else class="text-[10px]" :class="isDark ? 'text-slate-600' : 'text-slate-300'">—</span>
                  </td>

                  <!-- Acciones -->
                  <td class="px-2 py-2 border-b text-center" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                    <!-- Modo edición: guardar / cancelar -->
                    <div v-if="editandoId === item.data.id" class="flex items-center justify-center gap-1">
                      <button @click="guardarHorasInline(item.data)" :disabled="guardandoHoras"
                        class="h-6 px-2 rounded-[4px] text-[9px] font-semibold flex items-center gap-1 transition-all border bg-[#3B82F6] border-[#3B82F6] text-white hover:bg-[#2563eb] disabled:opacity-50">
                        <i :class="guardandoHoras ? 'fas fa-spinner fa-spin' : 'fas fa-floppy-disk'"
                          class="text-[8px]"></i>
                        Guardar
                      </button>
                      <button @click="cancelarEdicion"
                        class="w-6 h-6 rounded-[4px] flex items-center justify-center transition-all border"
                        :class="isDark ? 'border-[#222938] text-[#888888] hover:text-white' : 'border-slate-200 text-slate-400 hover:text-slate-700'">
                        <i class="fas fa-xmark text-[9px]"></i>
                      </button>
                    </div>
                    <!-- Modo normal: aprobar / rechazar / editar / eliminar -->
                    <div v-else class="flex items-center justify-center gap-1">
                      <button
                        @click="tieneExtras(item.data) && !item.data.actividad ? abrirModalActividad(item.data) : abrirModalAprobar(item.data, true)"
                        class="w-6 h-6 rounded-[4px] flex items-center justify-center transition-all border"
                        :class="item.data.aprobado === true
                          ? 'bg-[#16a34a] border-[#16a34a] text-white'
                          : tieneExtras(item.data) && !item.data.actividad
                            ? (isDark ? 'border-amber-500/40 text-amber-400/50 cursor-not-allowed' : 'border-amber-300 text-amber-300 cursor-not-allowed')
                            : (isDark ? 'bg-transparent border-[#222938] text-[#888888] hover:text-[#4ade80] hover:border-[#16a34a]/40' : 'bg-transparent border-slate-200 text-slate-400 hover:text-[#16a34a] hover:border-[#16a34a]/40')"
                        :title="tieneExtras(item.data) && !item.data.actividad ? 'Agrega actividad antes de aprobar' : 'Aprobar'">
                        <i class="fas fa-check text-[9px]"></i>
                      </button>
                      <button @click="abrirModalAprobar(item.data, false)"
                        class="w-6 h-6 rounded-[4px] flex items-center justify-center transition-all border"
                        :class="item.data.aprobado === false
                          ? 'bg-[#dc2626] border-[#dc2626] text-white'
                          : (isDark ? 'bg-transparent border-[#222938] text-[#888888] hover:text-[#f87171] hover:border-[#dc2626]/40' : 'bg-transparent border-slate-200 text-slate-400 hover:text-[#dc2626] hover:border-[#dc2626]/40')"
                        title="Rechazar">
                        <i class="fas fa-times text-[9px]"></i>
                      </button>
                      <button @click="iniciarEdicion(item.data)"
                        class="w-6 h-6 rounded-[4px] flex items-center justify-center transition-all border" :class="isDark
                          ? 'bg-transparent border-[#222938] text-[#888888] hover:text-[#60A5FA] hover:border-[#3B82F6]/40'
                          : 'bg-transparent border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-300'"
                        title="Editar horas">
                        <i class="fas fa-pen text-[9px]"></i>
                      </button>
                      <button @click="abrirModalEliminar(item.data)"
                        class="w-6 h-6 rounded-[4px] flex items-center justify-center transition-all border" :class="isDark
                          ? 'bg-transparent border-[#222938] text-[#888888] hover:text-[#f87171] hover:border-[#dc2626]/40'
                          : 'bg-transparent border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300'"
                        title="Eliminar registro">
                        <i class="fas fa-trash text-[9px]"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Subtotal -->
                <tr v-else-if="item.tipo === 'subtotal'">
                  <td colspan="8" class="px-3 py-2 border-b border-r text-[10px] font-medium"
                    :class="isDark ? 'bg-[#3B82F6]/[0.06] border-[#222938] text-[#60A5FA]' : 'bg-blue-50/50 border-slate-200 text-blue-700'">
                    Subtotal — {{ item.data.nombre }}
                  </td>
                  <td v-for="col in COLS_HX" :key="col"
                    class="px-2 py-2 border-b border-r text-center text-[11px] font-semibold"
                    :class="isDark ? 'bg-[#3B82F6]/[0.06] border-[#222938] text-[#60A5FA]' : 'bg-blue-50/50 border-slate-200 text-blue-700'">
                    {{ formatDecimal(item.data.subtotales[col]) }}
                  </td>
                  <td colspan="3" class="border-b"
                    :class="isDark ? 'bg-[#3B82F6]/[0.06] border-[#222938]' : 'bg-blue-50/50 border-slate-200'"></td>
                </tr>

              </template>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div v-if="filasAplanadasGuardados.length > 0" class="px-3 py-2 border-t flex items-center justify-between"
          :class="isDark ? 'border-[#222938] bg-[#0B0F19]/40' : 'border-slate-200 bg-slate-50/60'">
          <span class="text-[11px]" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
            <span class="font-medium" :class="isDark ? 'text-white' : 'text-slate-900'">{{ registrosGuardados.length
            }}</span>
            registros
          </span>
          <div class="flex items-center gap-1.5">
            <button @click="currentPageGuardados--" :disabled="currentPageGuardados === 1"
              class="w-7 h-7 flex items-center justify-center rounded-[5px] border transition-all disabled:opacity-30"
              :class="isDark ? 'bg-[#161B26] border-[#222938] text-[#E2E8F0] hover:border-[#3B82F6]/40' : 'bg-white border-slate-200 text-slate-700'">
              <i class="fas fa-chevron-left text-[9px]"></i>
            </button>
            <div class="h-7 px-3 flex items-center rounded-[5px] text-[11px] font-medium border"
              :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-900'">
              {{ currentPageGuardados }} / {{ totalPagesGuardados }}
            </div>
            <button @click="currentPageGuardados++" :disabled="currentPageGuardados >= totalPagesGuardados"
              class="w-7 h-7 flex items-center justify-center rounded-[5px] border transition-all disabled:opacity-30"
              :class="isDark ? 'bg-[#161B26] border-[#222938] text-[#E2E8F0] hover:border-[#3B82F6]/40' : 'bg-white border-slate-200 text-slate-700'">
              <i class="fas fa-chevron-right text-[9px]"></i>
            </button>
          </div>
        </div>
      </div>
    </template>
    <!-- ══ FIN TAB GUARDADOS ══════════════════════════════════════════════════ -->

    <!-- ══ TAB NOVEDADES APROBADAS ══════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'aprobadas' && (isSuperAdmin || hasPerm('horas.novedades_aprobadas'))">

      <!-- Toolbar notificar -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-[11px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          <span class="font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">{{ novedadesAprobadas.length
          }}</span>
          registro(s) pendientes de notificar
          <span v-if="selectedNovedades.size" class="ml-2 font-semibold text-[#3B82F6]">
            · {{ selectedNovedades.size }} seleccionado(s)
          </span>
        </span>
        <div class="ml-auto flex items-center gap-1.5">
          <!-- Limpiar selección -->
          <button v-if="selectedNovedades.size" @click="clearSeleccionNovedades"
            class="h-7 px-2 rounded-[5px] border text-[11px] font-medium transition-all"
            :class="isDark ? 'border-[#222938] text-[#888888] hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'">
            <i class="fas fa-xmark text-[9px]"></i> Limpiar
          </button>
          <!-- Notificar -->
          <button @click="abrirVistaPrevia" :disabled="isNotifying || !novedadesAprobadas.length"
            class="flex items-center gap-1.5 h-7 px-3 rounded-[5px] border text-[11px] font-medium transition-all active:scale-[0.98] disabled:opacity-40"
            :class="selectedNovedades.size
              ? (isDark ? 'bg-[#3B82F6]/15 border-[#3B82F6]/60 text-[#60A5FA]' : 'bg-[#3B82F6]/10 border-[#3B82F6]/40 text-[#2563eb]')
              : (isDark ? 'bg-[#161B26] border-[#3B82F6]/30 text-[#E2E8F0] hover:bg-[#3B82F6]/[0.05] hover:border-[#3B82F6]/60' : 'bg-white border-[#3B82F6]/30 text-slate-700 hover:bg-[#3B82F6]/[0.05] hover:border-[#3B82F6]/60')">
            <i :class="isNotifying ? 'fas fa-spinner fa-spin' : 'fas fa-envelope'" class="text-[10px]"></i>
            {{ isNotifying ? 'Enviando…' : selectedNovedades.size ? `Notificar (${selectedNovedades.size})` :
              'Notificar'
              +
              'todos' }}
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-hidden rounded-md border flex flex-col"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

        <div v-if="isLoadingNovedades" class="flex-1 flex items-center justify-center">
          <i class="fas fa-spinner fa-spin text-[#3B82F6] text-xl"></i>
        </div>

        <div v-else-if="!novedadesAprobadas.length" class="flex-1 flex flex-col items-center justify-center gap-3 p-12">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center"
            :class="isDark ? 'bg-[#161B26]' : 'bg-slate-100'">
            <i class="fas fa-circle-check text-xl text-[#16a34a]"></i>
          </div>
          <p class="text-[11px] font-bold uppercase" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            No hay novedades aprobadas en el rango seleccionado
          </p>
        </div>

        <div v-else class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
          <table class="w-full border-separate border-spacing-0 text-[11px]">
            <thead class="sticky top-0 z-30">
              <tr class="bg-[#1e2538]">
                <!-- Checkbox seleccionar todos -->
                <th class="px-3 py-2 text-center border-b border-r border-[#f5f5f7] w-8">
                  <input type="checkbox"
                    :checked="selectedNovedades.size === novedadesAprobadas.length && novedadesAprobadas.length > 0"
                    :indeterminate="selectedNovedades.size > 0 && selectedNovedades.size < novedadesAprobadas.length"
                    @change="toggleAllNovedades" class="w-3.5 h-3.5 rounded accent-[#3B82F6] cursor-pointer" />
                </th>
                <th
                  class="px-3 py-2 text-left text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                  Cédula</th>
                <th
                  class="px-3 py-2 text-left text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                  Nombre</th>
                <th
                  class="px-3 py-2 text-center text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                  Fecha</th>
                <th
                  class="px-3 py-2 text-left text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                  Departamento</th>
                <th v-for="col in ['RN', 'RNDF', 'RDDF', 'HEDO', 'HENO', 'HEFD', 'HEFN']" :key="col"
                  class="px-2 py-2 text-center text-[10px] font-medium border-b border-r w-12 border-[#f5f5f7] text-[#f5f5f7]">
                  {{ col }}
                </th>
                <th
                  class="px-3 py-2 text-left text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                  Observación</th>
                <th class="px-3 py-2 text-center text-[10px] font-medium border-b border-[#f5f5f7] text-[#f5f5f7] w-20">
                  Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, idx) in novedadesAprobadas" :key="r.id" class="group transition-all cursor-pointer" :class="[
                selectedNovedades.has(r.id)
                  ? (isDark ? 'bg-[#3B82F6]/[0.08]' : 'bg-blue-50/70')
                  : idx % 2 !== 0 ? (isDark ? 'bg-white/[0.03]' : 'bg-slate-50/60') : '',
              ]" @click="toggleNovedadSelected(r.id)">
                <!-- Checkbox -->
                <td class="px-3 py-2 border-b border-r text-center"
                  :class="isDark ? 'border-[#222938]' : 'border-slate-100'" @click.stop>
                  <input type="checkbox" :checked="selectedNovedades.has(r.id)" @change="toggleNovedadSelected(r.id)"
                    class="w-3.5 h-3.5 rounded accent-[#3B82F6] cursor-pointer" />
                </td>
                <td class="px-3 py-2 border-b border-r font-mono text-[9px]"
                  :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">{{ r.cedula }}
                </td>
                <td class="px-3 py-2 border-b border-r font-bold uppercase"
                  :class="isDark ? 'border-[#222938] text-white' : 'border-slate-100 text-slate-900'">{{ r.nombre }}
                </td>
                <td class="px-3 py-2 border-b border-r text-center"
                  :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{
                    formatFecha(r.fecha) }}</td>
                <td class="px-3 py-2 border-b border-r"
                  :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-600'">{{
                    r.departamento || '—' }}</td>
                <td v-for="col in COLS_HX" :key="col" class="px-2 py-2 border-b border-r text-center"
                  :class="[isDark ? 'border-[#222938]' : 'border-slate-100',
                  Number(r[col]) > 0 ? (isDark ? 'text-[#3B82F6] font-semibold' : 'text-blue-500 font-semibold') : (isDark ? 'text-slate-600' : 'text-slate-300')]">
                  {{ formatDecimal(r[col]) }}
                </td>
                <td class="px-3 py-2 border-b border-r text-[10px] italic"
                  :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">
                  {{ r.observacion || '—' }}
                </td>
                <!-- Acciones: deshacer aprobación / eliminar -->
                <td class="px-2 py-2 border-b text-center" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <div class="flex items-center justify-center gap-1">
                    <button @click="handleDeshacerAprobacion(r.id)"
                      class="w-6 h-6 rounded-[4px] flex items-center justify-center transition-all border" :class="isDark
                        ? 'bg-transparent border-[#222938] text-[#888888] hover:text-amber-400 hover:border-amber-500/40'
                        : 'bg-transparent border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-400'"
                      title="Deshacer aprobación">
                      <i class="fas fa-rotate-left text-[9px]"></i>
                    </button>
                    <button @click="abrirModalEliminar(r)"
                      class="w-6 h-6 rounded-[4px] flex items-center justify-center transition-all border" :class="isDark
                        ? 'bg-transparent border-[#222938] text-[#888888] hover:text-[#f87171] hover:border-[#dc2626]/40'
                        : 'bg-transparent border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300'"
                      title="Eliminar registro">
                      <i class="fas fa-trash text-[9px]"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
    <!-- ══ FIN TAB NOVEDADES APROBADAS ══════════════════════════════════════ -->

    <!-- ══ TAB HISTORIAL ════════════════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'historial' && (isSuperAdmin || hasPerm('horas.novedades_aprobadas'))">

      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-[11px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          <span class="font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">{{ historial.length }}</span>
          registro(s) notificados en el rango
        </span>
        <button @click="cargarHistorial(props.company)" :disabled="isLoadingHistorial"
          class="ml-auto h-7 w-7 rounded-[5px] border flex items-center justify-center transition-all disabled:opacity-40"
          :class="isDark ? 'bg-[#161B26] border-[#222938] text-[#888888] hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'">
          <i class="fas fa-arrows-rotate text-[10px]" :class="{ 'fa-spin': isLoadingHistorial }"></i>
        </button>
      </div>

      <div class="flex-1 overflow-hidden rounded-md border flex flex-col"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

        <div v-if="isLoadingHistorial" class="flex-1 flex items-center justify-center">
          <i class="fas fa-spinner fa-spin text-[#3B82F6] text-xl"></i>
        </div>

        <div v-else-if="!historial.length" class="flex-1 flex flex-col items-center justify-center gap-3 p-12">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center"
            :class="isDark ? 'bg-[#161B26]' : 'bg-slate-100'">
            <i class="fas fa-clock-rotate-left text-xl text-[#3B82F6]"></i>
          </div>
          <p class="text-[11px] font-bold uppercase" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            No hay registros notificados en el rango seleccionado
          </p>
        </div>

        <div v-else class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
          <table class="w-full border-separate border-spacing-0 text-[11px]">
            <thead class="sticky top-0 z-30">
              <tr class="bg-[#1e2538]">
                <th
                  class="px-3 py-2 text-left text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                  Cédula</th>
                <th
                  class="px-3 py-2 text-left text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                  Nombre</th>
                <th
                  class="px-3 py-2 text-center text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                  Fecha</th>
                <th
                  class="px-3 py-2 text-left text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">
                  Departamento</th>
                <th v-for="col in COLS_HX" :key="col"
                  class="px-2 py-2 text-center text-[10px] font-medium border-b border-r w-12 border-[#f5f5f7] text-[#f5f5f7]">
                  {{ col.toUpperCase() }}
                </th>
                <th class="px-3 py-2 text-left text-[10px] font-medium border-b border-[#f5f5f7] text-[#f5f5f7]">
                  Observación</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, idx) in historial" :key="r.id" class="transition-all"
                :class="idx % 2 !== 0 ? (isDark ? 'bg-white/[0.03]' : 'bg-slate-50/60') : ''">
                <td class="px-3 py-2 border-b border-r font-mono text-[9px]"
                  :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">{{ r.cedula }}
                </td>
                <td class="px-3 py-2 border-b border-r font-bold uppercase"
                  :class="isDark ? 'border-[#222938] text-white' : 'border-slate-100 text-slate-900'">{{ r.nombre }}
                </td>
                <td class="px-3 py-2 border-b border-r text-center"
                  :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{
                    formatFecha(r.fecha) }}</td>
                <td class="px-3 py-2 border-b border-r"
                  :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-600'">{{
                    r.departamento || '—' }}</td>
                <td v-for="col in COLS_HX" :key="col" class="px-2 py-2 border-b border-r text-center"
                  :class="[isDark ? 'border-[#222938]' : 'border-slate-100',
                  Number(r[col]) > 0 ? (isDark ? 'text-[#3B82F6] font-semibold' : 'text-blue-500 font-semibold') : (isDark ? 'text-slate-600' : 'text-slate-300')]">
                  {{ formatDecimal(r[col]) }}
                </td>
                <td class="px-3 py-2 border-b text-[10px]"
                  :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">
                  {{ r.observacion || '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="px-3 py-1.5 border-t shrink-0"
          :class="isDark ? 'border-[#222938] bg-[#0B0F19]/40' : 'border-slate-200 bg-slate-50/60'">
          <p class="text-[9px] font-semibold uppercase tracking-wide"
            :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            Historial: <span class="text-[#3B82F6]">{{ historial.length }}</span> registros notificados
          </p>
        </div>
      </div>
    </template>
    <!-- ══ FIN TAB HISTORIAL ═════════════════════════════════════════════════ -->


    <!-- ══ MODAL OBSERVACIÓN GRUPAL POR FECHA ══════════════════════════════ -->
    <Teleport to="body">
      <div v-if="modalObsGrupal.visible" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background:rgba(0,0,0,0.55)" @click.self="modalObsGrupal.visible = false">
        <div class="w-full max-w-md rounded-xl border shadow-2xl"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

          <!-- Header -->
          <div class="flex items-center gap-3 px-5 py-4 border-b"
            :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/10 flex-shrink-0">
              <i class="fas fa-pen-to-square text-amber-500 text-[13px]"></i>
            </div>
            <div class="min-w-0">
              <p class="text-[13px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">
                Observación / Justificación grupal
              </p>
              <p class="text-[11px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                Se aplicará a todos los registros de la fecha seleccionada
              </p>
            </div>
            <button @click="modalObsGrupal.visible = false"
              class="ml-auto w-7 h-7 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
              :class="isDark ? 'text-slate-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'">
              <i class="fas fa-xmark text-[12px]"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="px-5 py-4 flex flex-col gap-4">

            <!-- Selector de fecha -->
            <div>
              <label class="block text-[10px] font-semibold uppercase mb-1.5"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">Fecha</label>
              <div class="flex flex-wrap gap-1.5">
                <button v-for="f in fechasUnicasGuardados" :key="f" @click="modalObsGrupal.fecha = f"
                  class="px-3 py-1 rounded-[5px] border text-[11px] font-medium transition-all"
                  :class="modalObsGrupal.fecha === f
                    ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                    : (isDark ? 'bg-[#0B0F19] border-[#222938] text-slate-300 hover:border-[#3B82F6]/40' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300')">
                  {{ formatFecha(f) }}
                  <span class="ml-1 opacity-60 text-[9px]">
                    ({{soloFilasGuardados.filter(r => r.fecha === f).length}})
                  </span>
                </button>
              </div>
            </div>

            <!-- Registros afectados -->
            <div v-if="modalObsGrupal.fecha">
              <label class="block text-[10px] font-semibold uppercase mb-1.5"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                Registros afectados ({{soloFilasGuardados.filter(r => r.fecha === modalObsGrupal.fecha).length}})
              </label>
              <div class="rounded-lg border overflow-hidden" :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
                <div v-for="r in soloFilasGuardados.filter(rr => rr.fecha === modalObsGrupal.fecha)" :key="r.id"
                  class="flex items-center gap-3 px-3 py-2 border-b last:border-b-0 text-[11px]"
                  :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <i class="fas fa-user text-[9px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'"></i>
                  <span class="font-semibold uppercase truncate" :class="isDark ? 'text-white' : 'text-slate-800'">{{
                    r.nombre }}</span>
                  <span class="ml-auto text-[9px] shrink-0" :class="isDark ? 'text-slate-500' : 'text-slate-400'">{{
                    r.departamento || '—' }}</span>
                </div>
              </div>
            </div>

            <!-- Observación -->
            <div>
              <label class="block text-[10px] font-semibold uppercase mb-1.5"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">Observación / Justificación</label>
              <textarea v-model="modalObsGrupal.observacion" rows="3"
                placeholder="Ej: Trabajo en cierre de mes, turno extra autorizado por gerencia..."
                class="w-full rounded-lg border px-3 py-2 text-[11px] resize-none outline-none transition-all" :class="isDark
                  ? 'bg-[#0B0F19] border-[#222938] text-white placeholder-slate-600 focus:border-[#3B82F6]/60'
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-400'">
          </textarea>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-2 px-5 py-4 border-t"
            :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
            <button @click="modalObsGrupal.visible = false"
              class="h-8 px-4 rounded-lg border text-[11px] font-medium transition-all"
              :class="isDark ? 'border-[#222938] text-[#888888] hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'">
              Cancelar
            </button>
            <button @click="guardarObsGrupal"
              :disabled="!modalObsGrupal.fecha || !modalObsGrupal.observacion.trim() || modalObsGrupal.loading"
              class="h-8 px-4 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 bg-amber-500 hover:bg-amber-600 text-white">
              <i :class="modalObsGrupal.loading ? 'fas fa-spinner fa-spin' : 'fas fa-floppy-disk'"
                class="text-[10px]"></i>
              {{ modalObsGrupal.loading ? 'Guardando…' : 'Aplicar a todos' }}
            </button>
          </div>

        </div>
      </div>
    </Teleport>

    <!-- ══ MODAL VISTA PREVIA NOTIFICACIÓN ══════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="modalVistaPrevia" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background:rgba(0,0,0,0.65)" @click.self="cerrarVistaPrevia">
        <div class="w-full max-w-5xl rounded-xl border shadow-2xl flex flex-col" style="max-height:90vh"
          :class="isDark ? 'bg-[#0F1420] border-[#222938]' : 'bg-white border-slate-200'">

          <!-- ── Header ── -->
          <div class="flex items-center gap-3 px-5 py-3.5 border-b flex-shrink-0"
            :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10 flex-shrink-0">
              <i class="fas fa-envelope-open-text text-emerald-500 text-[13px]"></i>
            </div>
            <div class="min-w-0">
              <p class="text-[13px] font-semibold leading-tight" :class="isDark ? 'text-white' : 'text-slate-900'">Vista
                previa — Notificación a Capital Humano</p>
              <p class="text-[11px] leading-tight mt-0.5" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                Revisa que los datos sean correctos antes de enviar.
                <span class="font-semibold ml-1" :class="isDark ? 'text-white' : 'text-slate-800'">
                  {{ registrosANotificar.length }} registro(s) seleccionado(s)
                </span>
              </p>
            </div>
            <button @click="cerrarVistaPrevia"
              class="ml-auto flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              :class="isDark ? 'text-slate-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'">
              <i class="fas fa-xmark text-[12px]"></i>
            </button>
          </div>

          <!-- ── Simulación de correo ── -->
          <div class="flex-1 overflow-y-auto custom-scrollbar">

            <!-- Cabecera del correo (para/asunto) -->
            <div class="px-5 pt-4 pb-3 border-b flex flex-col gap-1.5 flex-shrink-0"
              :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
              <div class="flex items-center gap-2 text-[11px]">
                <span class="w-14 text-right flex-shrink-0 font-medium"
                  :class="isDark ? 'text-slate-500' : 'text-slate-400'">Para:</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  :class="isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'">
                  Capital Humano (destinatarios configurados)
                </span>
              </div>
              <div class="flex items-center gap-2 text-[11px]">
                <span class="w-14 text-right flex-shrink-0 font-medium"
                  :class="isDark ? 'text-slate-500' : 'text-slate-400'">Asunto:</span>
                <span class="font-semibold" :class="isDark ? 'text-slate-200' : 'text-slate-700'">
                  ✅ Novedades HX aprobadas ({{ registrosANotificar.length }} registros) — {{ fechaHoyISO }}
                </span>
              </div>
              <div class="flex items-center gap-2 text-[11px]">
                <span class="w-14 text-right flex-shrink-0 font-medium"
                  :class="isDark ? 'text-slate-500' : 'text-slate-400'">Adjunto:</span>
                <span class="flex items-center gap-1" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                  <i class="fas fa-file-excel text-emerald-500 text-[10px]"></i>
                  novedades_hx_aprobadas_{{ fechaHoyISO }}.xlsx
                </span>
              </div>
              <div class="flex items-center gap-2 text-[11px]">
                <span class="w-14 text-right flex-shrink-0 font-medium"
                  :class="isDark ? 'text-slate-500' : 'text-slate-400'">Calculado por:</span>
                <input v-model="calculadoPor" type="text" placeholder="Nombre de quien calcula…"
                  class="h-7 px-2.5 text-[11px] font-medium rounded-[5px] border outline-none w-64 transition-all"
                  :class="isDark
                    ? 'bg-[#0B0F19] border-[#222938] text-white placeholder:text-[#5a5a5a] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'
                    : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'" />
              </div>
            </div>

            <!-- Cuerpo del correo simulado -->
            <div class="px-5 py-4">
              <!-- Banner verde igual al correo real -->
              <div class="rounded-lg border-l-4 border-emerald-500 px-4 py-3 mb-4"
                :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-slate-50'">
                <p class="text-[12px] font-semibold mb-1" :class="isDark ? 'text-white' : 'text-slate-900'">
                  ✅ Novedades de horas extra aprobadas
                </p>
                <p class="text-[11px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                  {{ registrosANotificar.length }} registro(s) aprobado(s). Ver detalle en el archivo adjunto.
                </p>
                <p v-if="calculadoPor" class="text-[11px] mt-1.5 font-medium"
                  :class="isDark ? 'text-emerald-400' : 'text-emerald-700'">
                  <i class="fas fa-user-check mr-1 text-[10px]"></i>Enviado por: {{ calculadoPor }}
                </p>
              </div>

              <!-- Tabla detalle completa (marcación + horas) -->
              <p class="text-[9px] font-semibold uppercase tracking-wide mb-2"
                :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                Detalle de marcación y horas calculadas
              </p>
              <div class="rounded-lg border overflow-auto custom-scrollbar"
                :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
                <table class="w-full text-[11px] border-separate border-spacing-0" style="min-width:860px">
                  <thead class="sticky top-0 z-10">
                    <tr :class="isDark ? 'bg-[#1e2538]' : 'bg-slate-100'">
                      <th class="px-3 py-2 text-left text-[10px] font-semibold border-b border-r"
                        :class="isDark ? 'border-[#2d3748] text-slate-300' : 'border-slate-200 text-slate-600'">Cédula
                      </th>
                      <th class="px-3 py-2 text-left text-[10px] font-semibold border-b border-r"
                        :class="isDark ? 'border-[#2d3748] text-slate-300' : 'border-slate-200 text-slate-600'">Nombre
                      </th>
                      <th class="px-3 py-2 text-center text-[10px] font-semibold border-b border-r"
                        :class="isDark ? 'border-[#2d3748] text-slate-300' : 'border-slate-200 text-slate-600'">Fecha
                      </th>
                      <th class="px-3 py-2 text-left text-[10px] font-semibold border-b border-r"
                        :class="isDark ? 'border-[#2d3748] text-slate-300' : 'border-slate-200 text-slate-600'">Depto.
                      </th>
                      <!-- Marcación -->
                      <th colspan="3"
                        class="px-2 py-2 text-center text-[10px] font-semibold border-b border-r bg-blue-500/10"
                        :class="isDark ? 'border-[#2d3748] text-blue-300' : 'border-slate-200 text-blue-700'">
                        Marcación
                      </th>
                      <!-- Horas extra -->
                      <th colspan="7"
                        class="px-2 py-2 text-center text-[10px] font-semibold border-b border-r bg-emerald-500/10"
                        :class="isDark ? 'border-[#2d3748] text-emerald-300' : 'border-slate-200 text-emerald-700'">
                        Horas calculadas
                      </th>
                      <th class="px-3 py-2 text-left text-[10px] font-semibold border-b"
                        :class="isDark ? 'border-[#2d3748] text-slate-300' : 'border-slate-200 text-slate-600'">
                        Observación
                      </th>
                    </tr>
                    <!-- Sub-headers marcación + horas -->
                    <tr :class="isDark ? 'bg-[#161B26]' : 'bg-white'">
                      <th colspan="4" class="border-b border-r"
                        :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
                      </th>
                      <!-- Marcación sub -->
                      <th class="px-2 py-1.5 text-center text-[9px] font-medium border-b border-r bg-blue-500/5"
                        :class="isDark ? 'border-[#222938] text-blue-400' : 'border-slate-200 text-blue-600'">Entrada
                      </th>
                      <th class="px-2 py-1.5 text-center text-[9px] font-medium border-b border-r bg-blue-500/5"
                        :class="isDark ? 'border-[#222938] text-blue-400' : 'border-slate-200 text-blue-600'">Salida
                      </th>
                      <!-- Horas sub -->
                      <th v-for="col in ['RN', 'RNDF', 'RDDF', 'HEDO', 'HENO', 'HEFD', 'HEFN']" :key="col"
                        class="px-2 py-1.5 text-center text-[9px] font-medium border-b border-r bg-emerald-500/5 w-10"
                        :class="isDark ? 'border-[#222938] text-emerald-400' : 'border-slate-200 text-emerald-700'">
                        {{ col }}
                      </th>
                      <th class="border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-200'"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(r, idx) in registrosANotificar" :key="r.id" class="transition-colors"
                      :class="idx % 2 !== 0 ? (isDark ? 'bg-white/[0.025]' : 'bg-slate-50/70') : ''">
                      <!-- Cédula -->
                      <td class="px-3 py-2 border-b border-r font-mono text-[9px]"
                        :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">
                        {{ r.cedula }}
                      </td>
                      <!-- Nombre -->
                      <td class="px-3 py-2 border-b border-r font-bold uppercase text-[10px]"
                        :class="isDark ? 'border-[#222938] text-white' : 'border-slate-100 text-slate-900'">
                        {{ r.nombre }}
                        <div v-if="r.cargo" class="text-[8px] font-normal mt-0.5"
                          :class="isDark ? 'text-slate-500' : 'text-slate-400'">{{ r.cargo }}</div>
                      </td>
                      <!-- Fecha -->
                      <td class="px-3 py-2 border-b border-r text-center"
                        :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-600'">
                        {{ formatFecha(r.fecha) }}
                      </td>
                      <!-- Depto -->
                      <td class="px-3 py-2 border-b border-r"
                        :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">
                        {{ r.departamento || '—' }}
                      </td>
                      <!-- Entrada -->
                      <td class="px-2 py-2 border-b border-r text-center font-mono text-[10px] bg-blue-500/[0.03]"
                        :class="isDark ? 'border-[#222938] text-blue-300' : 'border-slate-100 text-blue-700'">
                        {{ r.fecha_entrada ? (r.fecha_entrada.split(' ')[1]?.slice(0, 5) ?? '—') : '—' }}
                      </td>
                      <!-- Salida -->
                      <td class="px-2 py-2 border-b border-r text-center font-mono text-[10px] bg-blue-500/[0.03]"
                        :class="isDark ? 'border-[#222938] text-blue-300' : 'border-slate-100 text-blue-700'">
                        {{ r.fecha_salida ? (r.fecha_salida.split(' ')[1]?.slice(0, 5) ?? '—') : '—' }}
                      </td>
                      <!-- T. Laborado -->

                      <!-- Cols HX -->
                      <td v-for="col in COLS_HX" :key="col"
                        class="px-2 py-2 border-b border-r text-center bg-emerald-500/[0.03]" :class="[isDark ? 'border-[#222938]' : 'border-slate-100',
                        Number(r[col]) > 0
                          ? (isDark ? 'text-emerald-400 font-semibold' : 'text-emerald-700 font-semibold')
                          : (isDark ? 'text-slate-600' : 'text-slate-300')]">
                        {{ Number(r[col]) > 0 ? formatDecimal(r[col]) : '—' }}
                      </td>
                      <!-- Observación -->
                      <td class="px-3 py-2 border-b italic text-[10px]"
                        :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">
                        {{ r.observacion || '—' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>

          <!-- ── Acciones ── -->
          <div class="flex items-center justify-between gap-3 px-5 py-3.5 border-t flex-shrink-0"
            :class="isDark ? 'border-[#222938] bg-[#0B0F19]/60' : 'border-slate-200 bg-slate-50/80'">
            <p class="text-[10px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
              <i class="fas fa-circle-info mr-1"></i>
              Se adjuntará un Excel con el detalle completo al correo.
            </p>
            <div class="flex items-center gap-2">
              <button @click="cerrarVistaPrevia"
                class="h-8 px-4 rounded-lg border text-[11px] font-medium transition-all"
                :class="isDark ? 'border-[#222938] text-[#888888] hover:text-white hover:border-slate-600' : 'border-slate-200 text-slate-500 hover:text-slate-800'">
                Cancelar
              </button>
              <button @click="confirmarNotificar" :disabled="isNotifying"
                class="h-8 px-5 rounded-lg text-[11px] font-semibold flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                <i :class="isNotifying ? 'fas fa-spinner fa-spin' : 'fas fa-paper-plane'" class="text-[10px]"></i>
                {{ isNotifying ? 'Enviando correo…' : 'Confirmar y notificar a Capital Humano' }}
              </button>
            </div>
          </div>

        </div>
      </div>
    </Teleport>

    <!-- ══ MODAL ELIMINAR ═══════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="modalEliminar.visible" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background:rgba(0,0,0,0.55)">
        <div class="w-full max-w-sm rounded-xl border shadow-2xl"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
          <div class="flex items-center gap-3 px-5 py-4 border-b"
            :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center bg-[#dc2626]/15">
              <i class="fas fa-trash text-[#dc2626] text-[11px]"></i>
            </div>
            <div>
              <p class="text-[13px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">Eliminar registro
              </p>
              <p class="text-[10px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Esta acción no se puede
                deshacer
              </p>
            </div>
          </div>
          <div class="px-5 py-4">
            <p class="text-[12px]" :class="isDark ? 'text-slate-300' : 'text-slate-700'">
              ¿Eliminar el registro de
              <span class="font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">{{
                modalEliminar.registro?.nombre
              }}</span>
              del <span class="font-semibold">{{ formatFecha(modalEliminar.registro?.fecha) }}</span>?
            </p>
          </div>
          <div class="px-5 py-3 border-t flex items-center justify-end gap-2"
            :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
            <button @click="modalEliminar.visible = false"
              class="h-7 px-3 rounded-[5px] text-[11px] font-medium border transition-all"
              :class="isDark ? 'border-[#222938] text-[#888888] hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'">
              Cancelar
            </button>
            <button @click="confirmarEliminar" :disabled="modalEliminar.loading"
              class="h-7 px-3 rounded-[5px] text-[11px] font-medium border text-white bg-[#dc2626] border-[#dc2626] hover:bg-[#b91c1c] transition-all disabled:opacity-50">
              <i v-if="modalEliminar.loading" class="fas fa-spinner fa-spin mr-1 text-[9px]"></i>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <!-- ══ FIN MODAL ELIMINAR ═════════════════════════════════════════════════ -->

    <!-- ══ MODAL ACTIVIDAD ══════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="modalActividad.visible" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background:rgba(0,0,0,0.55)">
        <div class="w-full max-w-md rounded-xl border shadow-2xl"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b"
            :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-500/15">
                <i class="fas fa-pen text-amber-400 text-[11px]"></i>
              </div>
              <div>
                <p class="text-[13px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">
                  Justificación de horas extra
                </p>
                <p class="text-[10px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                  {{ modalActividad.registro?.nombre }}
                </p>
              </div>
            </div>
            <button @click="modalActividad.visible = false"
              class="w-7 h-7 rounded-lg flex items-center justify-center border transition-all"
              :class="isDark ? 'border-[#222938] text-[#888888] hover:text-white' : 'border-slate-200 text-slate-400 hover:text-slate-700'">
              <i class="fas fa-times text-[10px]"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="px-5 py-4 flex flex-col gap-3">
            <!-- Info -->
            <div class="rounded-lg px-3 py-2 text-[10px] flex items-center gap-2"
              :class="isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'">
              <i class="fas fa-triangle-exclamation"></i>
              <span>Esta actividad es <strong>obligatoria</strong> para poder aprobar el registro con horas
                extra.</span>
            </div>
            <!-- Textarea -->
            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-medium" :class="isDark ? 'text-[#E2E8F0]' : 'text-slate-700'">
                ¿Qué actividad justifica las horas extra?
              </label>
              <textarea v-model="modalActividad.texto" rows="4"
                placeholder="Describe la actividad o motivo que justifica las horas extra trabajadas…"
                class="w-full px-3 py-2 text-[11px] rounded-lg border outline-none resize-none transition-all" :class="isDark
                  ? 'bg-[#0B0F19] border-[#222938] text-white placeholder:text-[#5a5a5a] focus:border-amber-500/50'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-400'">
          </textarea>
              <p class="text-[10px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                {{ modalActividad.texto.length }}/500 caracteres
              </p>
            </div>
            <!-- Detalle del registro -->
            <div class="rounded-lg px-3 py-2.5 text-[10px] grid grid-cols-2 gap-x-4 gap-y-1"
              :class="isDark ? 'bg-[#0B0F19] text-slate-400' : 'bg-slate-50 text-slate-500'">
              <span><span class="font-medium" :class="isDark ? 'text-slate-300' : 'text-slate-700'">Fecha:</span> {{
                formatFecha(modalActividad.registro?.fecha) }}</span>
              <span><span class="font-medium" :class="isDark ? 'text-slate-300' : 'text-slate-700'">HEDO:</span> {{
                formatDecimal(modalActividad.registro?.hedo) }}h</span>
              <span><span class="font-medium" :class="isDark ? 'text-slate-300' : 'text-slate-700'">HENO:</span> {{
                formatDecimal(modalActividad.registro?.heno) }}h</span>
              <span><span class="font-medium" :class="isDark ? 'text-slate-300' : 'text-slate-700'">HEFD:</span> {{
                formatDecimal(modalActividad.registro?.hefd) }}h</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-5 py-3 border-t flex items-center justify-end gap-2"
            :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
            <button @click="modalActividad.visible = false"
              class="h-7 px-3 rounded-[5px] text-[11px] font-medium border transition-all"
              :class="isDark ? 'border-[#222938] text-[#888888] hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'">
              Cancelar
            </button>
            <button @click="guardarActividad" :disabled="!modalActividad.texto.trim() || modalActividad.loading"
              class="h-7 px-3 rounded-[5px] text-[11px] font-medium border text-white transition-all disabled:opacity-50 bg-amber-500 border-amber-500 hover:bg-amber-600">
              <i v-if="modalActividad.loading" class="fas fa-spinner fa-spin mr-1 text-[9px]"></i>
              Guardar actividad
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <!-- ══ FIN MODAL ACTIVIDAD ═══════════════════════════════════════════════ -->

    <!-- ══ MODAL OBSERVACIÓN ════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="modalAprobar.visible" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background:rgba(0,0,0,0.55)">
        <div class="w-full max-w-md rounded-xl border shadow-2xl"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b"
            :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center"
                :class="modalAprobar.aprobado ? 'bg-[#16a34a]/15' : 'bg-[#dc2626]/15'">
                <i :class="modalAprobar.aprobado ? 'fas fa-check text-[#16a34a]' : 'fas fa-times text-[#dc2626]'"
                  class="text-[11px]"></i>
              </div>
              <div>
                <p class="text-[13px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">
                  {{ modalAprobar.aprobado ? 'Aprobar' : 'Rechazar' }} horas extra
                </p>
                <p class="text-[10px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                  {{ modalAprobar.registro?.nombre }}
                </p>
              </div>
            </div>
            <button @click="cerrarModal"
              class="w-7 h-7 rounded-lg flex items-center justify-center border transition-all"
              :class="isDark ? 'border-[#222938] text-[#888888] hover:text-white' : 'border-slate-200 text-slate-400 hover:text-slate-700'">
              <i class="fas fa-times text-[10px]"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="px-5 py-4 flex flex-col gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-medium" :class="isDark ? 'text-[#E2E8F0]' : 'text-slate-700'">
                Observación <span class="font-normal opacity-60">(opcional)</span>
              </label>
              <textarea v-model="modalAprobar.observacion" rows="3" placeholder="Escribe una observación..."
                class="w-full px-3 py-2 text-[11px] rounded-lg border outline-none resize-none transition-all" :class="isDark
                  ? 'bg-[#0B0F19] border-[#222938] text-white placeholder:text-[#5a5a5a] focus:border-[#3B82F6]'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#3B82F6]'">
          </textarea>
            </div>

            <!-- Info del registro -->
            <div class="rounded-lg px-3 py-2.5 text-[10px] grid grid-cols-2 gap-x-4 gap-y-1"
              :class="isDark ? 'bg-[#0B0F19] text-slate-400' : 'bg-slate-50 text-slate-500'">
              <span><span class="font-medium" :class="isDark ? 'text-slate-300' : 'text-slate-700'">Fecha:</span> {{
                formatFecha(modalAprobar.registro?.fecha) }}</span>
              <span><span class="font-medium" :class="isDark ? 'text-slate-300' : 'text-slate-700'">Dpto:</span> {{
                modalAprobar.registro?.departamento || '—' }}</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-5 py-3 border-t flex items-center justify-end gap-2"
            :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
            <button @click="cerrarModal" class="h-7 px-3 rounded-[5px] text-[11px] font-medium border transition-all"
              :class="isDark ? 'border-[#222938] text-[#888888] hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'">
              Cancelar
            </button>
            <button @click="confirmarAprobar" :disabled="modalAprobar.loading"
              class="h-7 px-3 rounded-[5px] text-[11px] font-medium border text-white transition-all disabled:opacity-50"
              :class="modalAprobar.aprobado
                ? 'bg-[#16a34a] border-[#16a34a] hover:bg-[#15803d]'
                : 'bg-[#dc2626] border-[#dc2626] hover:bg-[#b91c1c]'">
              <i v-if="modalAprobar.loading" class="fas fa-spinner fa-spin mr-1 text-[9px]"></i>
              {{ modalAprobar.aprobado ? 'Aprobar' : 'Rechazar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <!-- ══ FIN MODAL OBSERVACIÓN ═════════════════════════════════════════════ -->

  </div>

  <!-- ══ TOAST NOTIFICACIÓN ══════════════════════════════════════════════════ -->
  <Teleport to="body">
    <Transition enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2 scale-95" leave-active-class="transition-all duration-200 ease-in"
      leave-to-class="opacity-0 translate-y-2 scale-95">
      <div v-if="saveSuccessMsg"
        class="fixed bottom-5 right-5 z-[9999] flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border max-w-sm w-full pointer-events-auto"
        :class="saveSuccessMsg.startsWith('❌')
          ? (isDark ? 'bg-[#1a0a0a] border-red-500/30 text-red-400' : 'bg-white border-red-200 text-red-700')
          : saveSuccessMsg.startsWith('⚠')
            ? (isDark ? 'bg-[#1a1500] border-amber-500/30 text-amber-400' : 'bg-white border-amber-200 text-amber-700')
            : (isDark ? 'bg-[#0a1a0a] border-emerald-500/30 text-emerald-400' : 'bg-white border-emerald-200 text-emerald-700')">

        <!-- Ícono -->
        <div class="shrink-0 mt-0.5">
          <i v-if="saveSuccessMsg.startsWith('❌')" class="fas fa-circle-xmark text-base text-red-500"></i>
          <i v-else-if="saveSuccessMsg.startsWith('⚠')"
            class="fas fa-triangle-exclamation text-base text-amber-500"></i>
          <i v-else class="fas fa-circle-check text-base text-emerald-500"></i>
        </div>

        <!-- Texto -->
        <div class="flex-1 min-w-0">
          <p class="text-[11px] font-semibold leading-snug">
            {{ saveSuccessMsg.replace(/^[✅⚠️❌]\s*/, '') }}
          </p>
        </div>

        <!-- Cerrar -->
        <button @click="saveSuccessMsg = ''" class="shrink-0 opacity-40 hover:opacity-100 transition-opacity ml-1">
          <i class="fas fa-xmark text-[10px]"></i>
        </button>

      </div>
    </Transition>
  </Teleport>

</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useReporteMallas } from '../../composables/adminLogica/useReporteMallas';
import { useCargueHoras } from '../../composables/adminLogica/useCargueHoras';

const props = defineProps({
  isDark: Boolean,
  company: String,
});

const session = JSON.parse(localStorage.getItem('user_session') || '{}');
const isSuperAdmin = session.isSuperAdmin || false;

// Tab activo
const activeTab = ref('calculos');

// Toggle: mostrar decimales (7.66) o horas cerradas (7) en la tabla de cálculos.
// OFF → parte entera sin redondear: 7.66 → 7, 10.5 → 10  (Math.floor)
// ON  → igual que formatDecimal: 7.66 → "7.66" | 1.5 → "1.5" | 2.0 → "2"
const mostrarDecimales = ref(false);
function fmtCalculo(val) {
  const n = Number(val || 0);
  if (!mostrarDecimales.value) return Math.floor(n);
  return parseFloat(n.toFixed(2)).toString();
}

// ── Composable Cálculos ──────────────────────────────────────────────────────
const {
  registros,
  isLoading,
  isCalculating,
  isSaving,
  isExporting,
  hayResultadosCalculados,
  startDate,
  endDate,
  filterNombre,
  filterCargo,
  filterDepartamento,
  soloConExtras,
  opcionesCargos,
  opcionesDepartamentos,
  filasPaginadas,
  filasAplanadas,
  currentPage,
  totalPages,
  totalRegistros,
  calcular,
  guardarCalculados,
  aprobarRegistro,
  actualizarActividad,
  actualizarHoras,
  exportarExcel,
  formatHora,
  formatFecha,
  formatDecimal,
  COLS_HX,
  hasPerm,
  novedadesAprobadas,
  isLoadingNovedades,
  cargarNovedadesAprobadas,
  selectedNovedades,
  toggleNovedadSelected,
  toggleAllNovedades,
  clearSeleccionNovedades,
  historial,
  isLoadingHistorial,
  cargarHistorial,
  registrosGuardados,
  isLoadingGuardados,
  currentPageGuardados,
  totalPagesGuardados,
  filasAplanadasGuardados,
  filasPaginadasGuardados,
  cargarGuardados,
  eliminarRegistro,
  deshacerAprobacion,
  isNotifying,
  notificarAprobados,
  calculadoPor,
  selectedRecords,
  isSelected,
  toggleSelected,
  isAllFilteredSelected,
  isIndeterminate,
  toggleAllFiltered,
  clearSelection,
} = useReporteMallas();

// ── Composable Cargue ────────────────────────────────────────────────────────
const {
  isUploading,
  isExportingPlantilla,
  errorMsg: cargueErrorMsg,
  successMsg: cargueSuccessMsg,
  subirExcel,
  descargarPlantilla,
  isLoading: cargueIsLoading,
  registros: cargueRegistros,
  filasPaginadas: cargueFilasPaginadas,
  filasAplanadas: cargueFilasAplanadas,
  currentPage: cargueCurrentPage,
  totalPages: cargueTotalPages,
  totalRegistros: cargueTotalRegistros,
  cargarHistorial: cargarCargueHistorial,
} = useCargueHoras();

const archivoSeleccionado = ref(null);
const isDragOver = ref(false);

// ── Cargue Horas dropdown & sub-vistas ────────────────────────────────────────
const showCargueMenu = ref(false);
const activeCargueView = ref('upload'); // 'upload' | 'historial'
const cargueStartDate = ref('');
const cargueEndDate = ref('');

function handleFileSelect(event) {
  const f = event.target.files?.[0];
  if (f) archivoSeleccionado.value = f;
}
function handleDrop(event) {
  isDragOver.value = false;
  const f = event.dataTransfer.files?.[0];
  if (f) archivoSeleccionado.value = f;
}
async function handleSubirExcel() {
  if (!archivoSeleccionado.value) return;
  try {
    await subirExcel(archivoSeleccionado.value, { company: props.company });
    archivoSeleccionado.value = null;
  } catch { /* el composable ya maneja el error */ }
}
async function handleDescargarPlantilla() {
  await descargarPlantilla();
}

// ── Actividad (justificación de horas extra) ────────────────────────────────

/** Suma total de horas extra del registro (HEDO + HENO + HEFD + HEFN) */
function totalExtras(registro) {
  return (
    Number(registro?.hedo || 0) +
    Number(registro?.heno || 0) +
    Number(registro?.hefd || 0) +
    Number(registro?.hefn || 0)
  );
}

/** Requiere justificación cuando los extras suman >= 0.5h (30 min) */
function tieneExtras(registro) {
  return totalExtras(registro) >= 0.5;
}

// ── Edición inline de horas ──────────────────────────────────────────────────
const editandoId = ref(null);   // id del registro en edición
const editandoValores = reactive({ rn: 0, rndf: 0, rddf: 0, hedo: 0, heno: 0, hefd: 0, hefn: 0 });
const guardandoHoras = ref(false);

function iniciarEdicion(registro) {
  editandoId.value = registro.id;
  Object.assign(editandoValores, {
    rn: Number(registro.rn || 0),
    rndf: Number(registro.rndf || 0),
    rddf: Number(registro.rddf || 0),
    hedo: Number(registro.hedo || 0),
    heno: Number(registro.heno || 0),
    hefd: Number(registro.hefd || 0),
    hefn: Number(registro.hefn || 0),
  });
}

function cancelarEdicion() {
  editandoId.value = null;
}

async function guardarHorasInline(registro) {
  if (!registro?.id) return;
  guardandoHoras.value = true;
  try {
    await actualizarHoras(registro.id, { ...editandoValores });
    editandoId.value = null;
  } catch { /* silencioso */ } finally {
    guardandoHoras.value = false;
  }
}

const modalActividad = reactive({
  visible: false,
  registro: null,
  texto: '',
  loading: false,
});

function abrirModalActividad(registro) {
  modalActividad.registro = registro;
  modalActividad.texto = registro.actividad || '';
  modalActividad.loading = false;
  modalActividad.visible = true;
}

async function guardarActividad() {
  if (!modalActividad.registro?.id) return;
  modalActividad.loading = true;
  try {
    await actualizarActividad(modalActividad.registro.id, modalActividad.texto);
    modalActividad.visible = false;
  } catch { /* silencioso */ } finally {
    modalActividad.loading = false;
  }
}

function toggleCargueMenu() {
  showCargueMenu.value = !showCargueMenu.value;
}

function selectCargueView(view) {
  activeTab.value = 'cargue';
  activeCargueView.value = view;
  showCargueMenu.value = false;
  if (view === 'historial') {
    handleCargarCargueHistorial();
  }
}

async function handleCargarCargueHistorial() {
  await cargarCargueHistorial({
    startDate: cargueStartDate.value || undefined,
    endDate: cargueEndDate.value || undefined,
    company: props.company,
  });
}

function handleCargueMenuOutsideClick(e) {
  if (!e.target.closest('.cargue-menu-wrapper')) {
    showCargueMenu.value = false;
  }
}

// ── Selección masiva en Guardados ────────────────────────────────────────────
const selectedGuardados = ref(new Set());

const soloFilasGuardados = computed(() =>
  filasAplanadasGuardados.value.filter(f => f.tipo === 'fila').map(f => f.data)
);

const allGuardadosSelected = computed(() =>
  soloFilasGuardados.value.length > 0 &&
  soloFilasGuardados.value.every(r => selectedGuardados.value.has(r.id))
);
const someGuardadosSelected = computed(() =>
  soloFilasGuardados.value.some(r => selectedGuardados.value.has(r.id)) && !allGuardadosSelected.value
);

function toggleGuardadoSelected(id) {
  const s = new Set(selectedGuardados.value);
  s.has(id) ? s.delete(id) : s.add(id);
  selectedGuardados.value = s;
}
function toggleAllGuardados() {
  if (allGuardadosSelected.value) {
    selectedGuardados.value = new Set();
  } else {
    selectedGuardados.value = new Set(soloFilasGuardados.value.map(r => r.id));
  }
}
function clearSeleccionGuardados() {
  selectedGuardados.value = new Set();
}

// Aprobar/rechazar todos los seleccionados
const bulkGuardandoAprobacion = ref(false);
async function aprobarSeleccionadosGuardados(aprobado) {
  const ids = [...selectedGuardados.value];
  if (!ids.length) return;
  bulkGuardandoAprobacion.value = true;
  try {
    for (const id of ids) {
      await aprobarRegistro(id, aprobado, '');
    }
    clearSeleccionGuardados();
    await cargarGuardados(props.company);
  } catch { /* silencioso */ } finally {
    bulkGuardandoAprobacion.value = false;
  }
}

// Eliminar todos los seleccionados
const bulkEliminandoGuardados = ref(false);
async function eliminarSeleccionadosGuardados() {
  const ids = [...selectedGuardados.value];
  if (!ids.length) return;
  bulkEliminandoGuardados.value = true;
  try {
    for (const id of ids) {
      await eliminarRegistro(id);
    }
    clearSeleccionGuardados();
  } catch { /* silencioso */ } finally {
    bulkEliminandoGuardados.value = false;
  }
}

// ── Modal observación grupal por fecha ───────────────────────────────────────
const modalObsGrupal = reactive({
  visible: false,
  fecha: '',           // YYYY-MM-DD
  observacion: '',
  loading: false,
});

/** Fechas únicas presentes en los registros guardados */
const fechasUnicasGuardados = computed(() => {
  const set = new Set(soloFilasGuardados.value.map(r => r.fecha).filter(Boolean));
  return [...set].sort();
});

function abrirObsGrupal(fecha = '') {
  modalObsGrupal.fecha = fecha || (fechasUnicasGuardados.value[0] ?? '');
  modalObsGrupal.observacion = '';
  modalObsGrupal.loading = false;
  modalObsGrupal.visible = true;
}

/** Registros que recibirán la observación grupal:
 *  - Si hay selección activa → solo los seleccionados
 *  - Si no hay selección     → todos los de la fecha elegida
 */
const registrosObsGrupal = computed(() => {
  if (selectedGuardados.value.size > 0) {
    return soloFilasGuardados.value.filter(r => selectedGuardados.value.has(r.id));
  }
  return soloFilasGuardados.value.filter(r => r.fecha === modalObsGrupal.fecha);
});

const haySeleccionActiva = computed(() => selectedGuardados.value.size > 0);

async function guardarObsGrupal() {
  const ids = registrosObsGrupal.value.map(r => r.id);
  if (!ids.length) return;
  modalObsGrupal.loading = true;
  try {
    for (const id of ids) {
      await actualizarActividad(id, modalObsGrupal.observacion);
    }
    modalObsGrupal.visible = false;
    await cargarGuardados(props.company);
  } catch { /* silencioso */ } finally {
    modalObsGrupal.loading = false;
  }
}

// ── Modal vista previa notificación ──────────────────────────────────────────
const modalVistaPrevia = ref(false);

/** Registros que se van a notificar: los seleccionados, o todos si no hay selección */
const registrosANotificar = computed(() =>
  selectedNovedades.value.size > 0
    ? novedadesAprobadas.value.filter(n => selectedNovedades.value.has(n.id))
    : novedadesAprobadas.value
);

/** Fecha de hoy en formato YYYY-MM-DD para el asunto del correo */
const fechaHoyISO = computed(() => new Date().toISOString().slice(0, 10));

function abrirVistaPrevia() {
  modalVistaPrevia.value = true;
}
function cerrarVistaPrevia() {
  modalVistaPrevia.value = false;
}
async function confirmarNotificar() {
  modalVistaPrevia.value = false;
  await handleNotificar();
}

// ── Modal observación ─────────────────────────────────────────────────────────
const modalAprobar = reactive({
  visible: false,
  registro: null,
  aprobado: true,
  observacion: '',
  loading: false,
});

function abrirModalAprobar(registro, aprobado) {
  modalAprobar.registro = registro;
  modalAprobar.aprobado = aprobado;
  modalAprobar.observacion = registro.observacion || '';
  modalAprobar.loading = false;
  modalAprobar.visible = true;
}

function cerrarModal() {
  modalAprobar.visible = false;
}

async function confirmarAprobar() {
  if (!modalAprobar.registro?.id) return;
  modalAprobar.loading = true;
  try {
    await aprobarRegistro(modalAprobar.registro.id, modalAprobar.aprobado, modalAprobar.observacion);
    modalAprobar.visible = false;
    // Recargar la vista activa según el tab
    if (activeTab.value === 'guardados') {
      await cargarGuardados(props.company);
    } else if (activeTab.value === 'cargue' && activeCargueView.value === 'historial') {
      await handleCargarCargueHistorial();
    }
  } catch { /* silencioso */ } finally {
    modalAprobar.loading = false;
  }
}

// ── Handlers nuevas pestañas ──────────────────────────────────────────────────
async function handleTabNovedades(tab) {
  activeTab.value = tab;
  if (tab === 'aprobadas') {
    await cargarNovedadesAprobadas(props.company);
  }
}

async function handleTabHistorial() {
  activeTab.value = 'historial';
  // Si las fechas son del mes actual, ampliar a 30 días atrás para ver historial reciente
  const hoy = new Date().toISOString().slice(0, 10);
  const primerDiaMes = hoy.slice(0, 8) + '01';
  if (startDate.value === primerDiaMes && endDate.value === hoy) {
    const hace30 = new Date();
    hace30.setDate(hace30.getDate() - 30);
    startDate.value = hace30.toISOString().slice(0, 10);
  }
  await cargarHistorial(props.company);
}

async function handleTabGuardados() {
  activeTab.value = 'guardados';
  clearSeleccionGuardados();
  await cargarGuardados(props.company);
}

// ── Modal eliminar ────────────────────────────────────────────────────────────
const modalEliminar = reactive({
  visible: false,
  registro: null,
  loading: false,
});

function abrirModalEliminar(registro) {
  modalEliminar.registro = registro;
  modalEliminar.loading = false;
  modalEliminar.visible = true;
}

async function confirmarEliminar() {
  if (!modalEliminar.registro?.id) return;
  modalEliminar.loading = true;
  try {
    await eliminarRegistro(modalEliminar.registro.id);
    modalEliminar.visible = false;
  } catch { /* silencioso */ } finally {
    modalEliminar.loading = false;
  }
}

async function handleDeshacerAprobacion(id) {
  try {
    await deshacerAprobacion(id);
  } catch { /* silencioso */ }
}

// ── Handlers cálculos ────────────────────────────────────────────────────────
async function handleCargar() {
  await cargarHistorial(props.company);
}

async function handleCalcular() {
  try {
    await calcular(props.company);
  } catch { /* el composable ya loguea */ }
}

const saveSuccessMsg = ref('');
let _saveSuccessTimer = null;

async function handleGuardar() {
  try {
    const n = selectedRecords.value.length;
    const result = await guardarCalculados(props.company, mostrarDecimales.value);
    const guardados = result?.guardados ?? 0;
    const omitidos = result?.omitidos ?? [];

    if (omitidos.length && guardados === 0) {
      saveSuccessMsg.value = `⚠️ ${omitidos.length} registro(s) no guardado(s): ya existen aprobados para esa fecha`;
    } else if (omitidos.length) {
      saveSuccessMsg.value = `⚠️ ${guardados} guardado(s), ${omitidos.length} omitido(s) por tener registro aprobado`;
    } else {
      saveSuccessMsg.value = `✅ ${guardados} registro(s) guardado(s) correctamente`;
    }
    clearTimeout(_saveSuccessTimer);
    _saveSuccessTimer = setTimeout(() => { saveSuccessMsg.value = ''; }, 6000);

    if (guardados > 0) cargarGuardados(props.company).catch(() => { });
  } catch (e) {
    saveSuccessMsg.value = `❌ Error al guardar: ${e?.response?.data?.message || e?.message || 'intente de nuevo'}`;
    clearTimeout(_saveSuccessTimer);
    _saveSuccessTimer = setTimeout(() => { saveSuccessMsg.value = ''; }, 8000);
  }
}

async function handleExportar() {
  try {
    await exportarExcel(props.company);
  } catch { /* silencioso */ }
}

async function handleNotificar() {
  try {
    await notificarAprobados();
  } catch { /* silencioso */ }
}

/**
 * Devuelve true si la fecha YYYY-MM-DD cae en domingo.
 * Se usa para distinguir "DOM" de "FEST" en el badge:
 *   - es_dominical=true + esDomingo → domingo (trabajó en descanso dominical)
 *   - es_dominical=true + !esDomingo → festivo que NO es domingo (ej. lunes festivo)
 */
function esDomingo(fecha) {
  if (!fecha) return false;
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(y, m - 1, d).getDay() === 0; // 0 = domingo en JS
}

function calcularTiempoLaborado(entrada, salida) {
  if (!entrada || !salida) return '—';
  const diff = (new Date(salida) - new Date(entrada)) / 60000;
  if (isNaN(diff) || diff <= 0) return '—';
  const h = Math.floor(diff / 60);
  const m = Math.floor(diff % 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

onMounted(() => {
  // Seleccionar el primer tab al que el usuario tiene acceso
  if (!isSuperAdmin && !hasPerm('admin.calculos')) {
    if (hasPerm('horas.guardados')) activeTab.value = 'guardados';
    else if (hasPerm('horas.novedades_aprobadas')) activeTab.value = 'aprobadas';
    else if (hasPerm('horas.cargue')) activeTab.value = 'cargue';
  }
  document.addEventListener('click', handleCargueMenuOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleCargueMenuOutsideClick);
});
</script>
<style></style>
