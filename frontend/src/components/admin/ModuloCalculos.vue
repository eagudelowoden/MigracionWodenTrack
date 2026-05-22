<template>
  <div class="h-full animate-fade-in flex flex-col gap-3">

    <!-- ── Header row: Tabs (izq) + Acciones (der) ───────────────────────── -->
    <div class="flex items-center justify-between gap-3 flex-wrap"
      v-if="isSuperAdmin || hasPerm('admin.calculos') || hasPerm('horas.cargue')">

      <!-- Tabs (Vercel segmented) -->
      <div class="flex items-center gap-0.5 p-0.5 rounded-md border w-fit"
        :class="isDark ? 'bg-[#0B0F19] border-[#222938]' : 'bg-slate-100 border-slate-200'">
        <button @click="activeTab = 'calculos'"
          class="px-3 h-7 rounded-[5px] text-[11px] font-medium transition-all flex items-center gap-1.5" :class="activeTab === 'calculos'
            ? (isDark ? 'bg-[#161B26] text-white' : 'bg-white text-slate-900 shadow-sm')
            : (isDark ? 'text-[#888888] hover:text-white' : 'text-slate-500 hover:text-slate-800')">
          <i class="fas fa-calculator text-[10px]"></i>Cálculos
        </button>
        <div v-if="isSuperAdmin || hasPerm('horas.cargue')" class="relative cargue-menu-wrapper">
          <button @click.stop="toggleCargueMenu"
            class="px-3 h-7 rounded-[5px] text-[11px] font-medium transition-all flex items-center gap-1.5"
            :class="activeTab === 'cargue'
              ? (isDark ? 'bg-[#161B26] text-white' : 'bg-white text-slate-900 shadow-sm')
              : (isDark ? 'text-[#888888] hover:text-white' : 'text-slate-500 hover:text-slate-800')">
            <i class="fas fa-file-arrow-up text-[10px]"></i>Cargue Horas
            <i class="fas fa-chevron-down text-[8px] ml-0.5 transition-transform duration-150"
              :class="showCargueMenu ? 'rotate-180' : ''"></i>
          </button>
          <!-- Dropdown -->
          <div v-if="showCargueMenu"
            class="absolute top-full left-0 mt-1 w-52 rounded-md border shadow-xl z-50 overflow-hidden"
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
        <button @click="handleTabNovedades('aprobadas')"
          class="px-3 h-7 rounded-[5px] text-[11px] font-medium transition-all flex items-center gap-1.5" :class="activeTab === 'aprobadas'
            ? (isDark ? 'bg-[#161B26] text-white' : 'bg-white text-slate-900 shadow-sm')
            : (isDark ? 'text-[#888888] hover:text-white' : 'text-slate-500 hover:text-slate-800')">
          <i class="fas fa-circle-check text-[10px]"></i>Novedades Aprobadas
        </button>
      </div>

      <!-- Acciones (solo visible en tab Cálculos) — borde azul visible en ambos modos -->
      <div v-if="activeTab === 'calculos'" class="flex items-center gap-1.5">

        <!-- Refrescar (icon button con borde azul sutil) -->
        <button @click="handleCargar" :disabled="isLoading"
          class="h-7 w-7 rounded-[5px] border flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          :class="isDark
            ? 'bg-[#161B26] border-[#222938] text-[#888888] hover:text-white hover:border-[#3B82F6]/40 hover:bg-[#0B0F19]'
            : 'bg-white border-slate-200 text-[#1e2538] hover:bg-black hover:text-white hover:border-black'"
          title="Refrescar historial">
          <i class="fas fa-arrows-rotate text-[10px]" :class="{ 'fa-spin': isLoading }"></i>
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
        <button @click="handleGuardar"
          :disabled="isSaving || isCalculating || !selectedRecords.length"
          :title="!selectedRecords.length ? 'Selecciona al menos un registro para guardar' : ''"
          class="flex items-center gap-1.5 h-7 px-3 rounded-[5px] border text-[11px] font-medium transition-all active:scale-[0.98] disabled:opacity-40 bg-[#3B82F6] border-[#3B82F6] text-white hover:bg-[#2563EB] hover:border-[#2563EB]">
          <i :class="isSaving ? 'fas fa-spinner fa-spin' : 'fas fa-floppy-disk'" class="text-[10px]"></i>
          <span v-if="isSaving">Guardando…</span>
          <span v-else>Guardar ({{ selectedRecords.length }})</span>
        </button>
      </div>
    </div>

    <!-- ══ TAB CÁLCULOS ════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'calculos'">

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
                  <input type="checkbox"
                    :checked="isAllFilteredSelected"
                    :indeterminate="isIndeterminate"
                    @change="toggleAllFiltered"
                    class="w-3.5 h-3.5 cursor-pointer accent-[#3B82F6]" />
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
                    <input type="checkbox"
                      :checked="isSelected(item.data)"
                      @change="toggleSelected(item.data)"
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
                      class="ml-1 text-[7px] font-semibold bg-violet-500/20 text-violet-500 px-1 rounded">DOM</span>
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
                    {{ formatDecimal(item.data[col]) }}
                  </td>

                  <td class="px-2 py-2 border-b text-center" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                    <div class="flex items-center justify-center gap-1">
                      <button @click="abrirModalAprobar(item.data, true)"
                        :disabled="!item.data.id"
                        :title="!item.data.id ? 'Guarda los registros primero' : ''"
                        class="w-6 h-6 rounded-[4px] flex items-center justify-center transition-all border disabled:opacity-30 disabled:cursor-not-allowed"
                        :class="item.data.aprobado === true
                          ? 'bg-[#16a34a] border-[#16a34a] text-white'
                          : (isDark
                            ? 'bg-transparent border-[#222938] text-[#888888] hover:text-[#4ade80] hover:border-[#16a34a]/40'
                            : 'bg-transparent border-slate-200 text-slate-400 hover:text-[#16a34a] hover:border-[#16a34a]/40')">
                        <i class="fas fa-check text-[9px]"></i>
                      </button>
                      <button @click="abrirModalAprobar(item.data, false)"
                        :disabled="!item.data.id"
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
                    {{ formatDecimal(item.data.subtotales[col]) }}
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
    <template v-else-if="activeTab === 'cargue'">
      <div class="flex flex-col gap-3 flex-1 overflow-hidden">

        <!-- Sub-nav: Upload vs Historial -->
        <div class="flex items-center gap-0.5 p-0.5 rounded-md border w-fit"
          :class="isDark ? 'bg-[#0B0F19] border-[#222938]' : 'bg-slate-100 border-slate-200'">
          <button @click="selectCargueView('upload')"
            class="px-3 h-6 rounded-[5px] text-[10px] font-medium transition-all flex items-center gap-1.5"
            :class="activeCargueView === 'upload'
              ? (isDark ? 'bg-[#161B26] text-white' : 'bg-white text-slate-900 shadow-sm')
              : (isDark ? 'text-[#888888] hover:text-white' : 'text-slate-500 hover:text-slate-800')">
            <i class="fas fa-cloud-arrow-up text-[9px]"></i>Cargue de horas
          </button>
          <button @click="selectCargueView('historial')"
            class="px-3 h-6 rounded-[5px] text-[10px] font-medium transition-all flex items-center gap-1.5"
            :class="activeCargueView === 'historial'
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
              <span>Descarga la plantilla, complétala y súbela aquí. El sistema asignará los registros automáticamente.</span>
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
              <span class="font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">{{ cargueTotalRegistros }}</span>
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
                    <th class="px-3 py-2 text-left text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">Cédula</th>
                    <th class="px-3 py-2 text-left text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">Nombre</th>
                    <th class="px-3 py-2 text-center text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">Fecha</th>
                    <th class="px-3 py-2 text-left text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">Departamento</th>
                    <th v-for="col in COLS_HX" :key="col"
                      class="px-2 py-2 text-center text-[10px] font-medium border-b border-r w-12 border-[#f5f5f7] text-[#f5f5f7]">
                      {{ col.toUpperCase() }}
                    </th>
                    <th class="px-3 py-2 text-center text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7] w-20">Estado</th>
                    <th class="px-3 py-2 text-center text-[10px] font-medium border-b border-[#f5f5f7] text-[#f5f5f7] w-20">Aprobar</th>
                  </tr>
                </thead>

                <tbody>
                  <!-- Loading -->
                  <tr v-if="cargueIsLoading" v-for="n in 8" :key="'csk-' + n">
                    <td colspan="13" class="px-3 py-3">
                      <div class="h-3 w-full rounded animate-pulse" :class="isDark ? 'bg-[#161B26]' : 'bg-slate-100'"></div>
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
                        <p class="text-[11px] font-bold uppercase" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
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
                        <div class="font-bold uppercase" :class="isDark ? 'text-white' : 'text-slate-900'">{{ item.data.nombre }}</div>
                        <div class="text-[8px] mt-0.5" :class="isDark ? 'text-slate-500' : 'text-slate-400'">{{ item.data.cargo || '—' }}</div>
                      </td>

                      <td class="px-3 py-2 border-b border-r text-center"
                        :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">
                        {{ formatFecha(item.data.fecha) }}
                      </td>

                      <td class="px-3 py-2 border-b border-r"
                        :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-600'">
                        {{ item.data.departamento || '—' }}
                      </td>

                      <td v-for="col in COLS_HX" :key="col" class="px-2 py-2 border-b border-r text-center"
                        :class="[isDark ? 'border-[#222938]' : 'border-slate-100',
                          Number(item.data[col]) > 0
                            ? (isDark ? 'text-[#3B82F6] font-semibold' : 'text-blue-500 font-semibold')
                            : (isDark ? 'text-slate-600' : 'text-slate-300')]">
                        {{ formatDecimal(item.data[col]) }}
                      </td>

                      <!-- Estado chip -->
                      <td class="px-2 py-2 border-b border-r text-center"
                        :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold"
                          :class="item.data.aprobado === true
                            ? 'bg-[#16a34a]/15 text-[#4ade80]'
                            : item.data.aprobado === false
                              ? 'bg-[#dc2626]/15 text-[#f87171]'
                              : (isDark ? 'bg-[#222938] text-[#888888]' : 'bg-slate-100 text-slate-500')">
                          <i class="mr-1 text-[8px]"
                            :class="item.data.aprobado === true ? 'fas fa-check' : item.data.aprobado === false ? 'fas fa-times' : 'fas fa-clock'"></i>
                          {{ item.data.aprobado === true ? 'Aprobado' : item.data.aprobado === false ? 'Rechazado' : 'Pendiente' }}
                        </span>
                      </td>

                      <!-- Botones aprobar/rechazar -->
                      <td class="px-2 py-2 border-b text-center" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                        <div class="flex items-center justify-center gap-1">
                          <button @click="abrirModalAprobar(item.data, true)"
                            :disabled="!item.data.id"
                            class="w-6 h-6 rounded-[4px] flex items-center justify-center transition-all border disabled:opacity-30 disabled:cursor-not-allowed"
                            :class="item.data.aprobado === true
                              ? 'bg-[#16a34a] border-[#16a34a] text-white'
                              : (isDark
                                ? 'bg-transparent border-[#222938] text-[#888888] hover:text-[#4ade80] hover:border-[#16a34a]/40'
                                : 'bg-transparent border-slate-200 text-slate-400 hover:text-[#16a34a] hover:border-[#16a34a]/40')">
                            <i class="fas fa-check text-[9px]"></i>
                          </button>
                          <button @click="abrirModalAprobar(item.data, false)"
                            :disabled="!item.data.id"
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
                        {{ formatDecimal(item.data.subtotales[col]) }}
                      </td>
                      <td colspan="2" class="border-b"
                        :class="isDark ? 'bg-[#3B82F6]/[0.06] border-[#222938]' : 'bg-blue-50/50 border-slate-200'"></td>
                    </tr>

                  </template>
                </tbody>
              </table>
            </div>

            <!-- Paginación -->
            <div v-if="cargueFilasAplanadas.length > 0" class="px-3 py-2 border-t flex items-center justify-between"
              :class="isDark ? 'border-[#222938] bg-[#0B0F19]/40' : 'border-slate-200 bg-slate-50/60'">
              <span class="text-[11px]" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
                <span class="font-medium" :class="isDark ? 'text-white' : 'text-slate-900'">{{ cargueTotalRegistros }}</span>
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

    <!-- ══ TAB NOVEDADES APROBADAS ══════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'aprobadas'">

      <!-- Toolbar notificar -->
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <span class="text-[11px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          <span class="font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">{{ novedadesAprobadas.length }}</span>
          registro(s) aprobado(s) en el rango
        </span>
        <button @click="handleNotificar" :disabled="isNotifying || !novedadesAprobadas.length"
          class="flex items-center gap-1.5 h-7 px-3 rounded-[5px] border text-[11px] font-medium transition-all active:scale-[0.98] disabled:opacity-40"
          :class="isDark
            ? 'bg-[#161B26] border-[#3B82F6]/30 text-[#E2E8F0] hover:bg-[#3B82F6]/[0.05] hover:border-[#3B82F6]/60'
            : 'bg-white border-[#3B82F6]/30 text-slate-700 hover:bg-[#3B82F6]/[0.05] hover:border-[#3B82F6]/60'">
          <i :class="isNotifying ? 'fas fa-spinner fa-spin' : 'fas fa-envelope'" class="text-[10px]"></i>
          {{ isNotifying ? 'Enviando…' : 'Notificar por correo' }}
        </button>
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
                <th class="px-3 py-2 text-left text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">Cédula</th>
                <th class="px-3 py-2 text-left text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">Nombre</th>
                <th class="px-3 py-2 text-center text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">Fecha</th>
                <th class="px-3 py-2 text-left text-[10px] font-medium border-b border-r border-[#f5f5f7] text-[#f5f5f7]">Departamento</th>
                <th v-for="col in ['RN','RNDF','RDDF','HEDO','HENO','HEFD','HEFN']" :key="col"
                  class="px-2 py-2 text-center text-[10px] font-medium border-b border-r w-12 border-[#f5f5f7] text-[#f5f5f7]">
                  {{ col }}
                </th>
                <th class="px-3 py-2 text-left text-[10px] font-medium border-b border-[#f5f5f7] text-[#f5f5f7]">Observación</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, idx) in novedadesAprobadas" :key="r.id"
                class="group transition-all"
                :class="idx % 2 !== 0 ? (isDark ? 'bg-white/[0.03]' : 'bg-slate-50/60') : ''">
                <td class="px-3 py-2 border-b border-r font-mono text-[9px]"
                  :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">{{ r.cedula }}</td>
                <td class="px-3 py-2 border-b border-r font-bold uppercase"
                  :class="isDark ? 'border-[#222938] text-white' : 'border-slate-100 text-slate-900'">{{ r.nombre }}</td>
                <td class="px-3 py-2 border-b border-r text-center"
                  :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{ formatFecha(r.fecha) }}</td>
                <td class="px-3 py-2 border-b border-r"
                  :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-600'">{{ r.departamento || '—' }}</td>
                <td v-for="col in COLS_HX" :key="col" class="px-2 py-2 border-b border-r text-center"
                  :class="[isDark ? 'border-[#222938]' : 'border-slate-100',
                    Number(r[col]) > 0 ? (isDark ? 'text-[#3B82F6] font-semibold' : 'text-blue-500 font-semibold') : (isDark ? 'text-slate-600' : 'text-slate-300')]">
                  {{ formatDecimal(r[col]) }}
                </td>
                <td class="px-3 py-2 border-b text-[10px] italic"
                  :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">
                  {{ r.observacion || '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
    <!-- ══ FIN TAB NOVEDADES APROBADAS ══════════════════════════════════════ -->


    <!-- ══ MODAL OBSERVACIÓN ════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="modalAprobar.visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
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
                class="w-full px-3 py-2 text-[11px] rounded-lg border outline-none resize-none transition-all"
                :class="isDark
                  ? 'bg-[#0B0F19] border-[#222938] text-white placeholder:text-[#5a5a5a] focus:border-[#3B82F6]'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#3B82F6]'">
              </textarea>
            </div>

            <!-- Info del registro -->
            <div class="rounded-lg px-3 py-2.5 text-[10px] grid grid-cols-2 gap-x-4 gap-y-1"
              :class="isDark ? 'bg-[#0B0F19] text-slate-400' : 'bg-slate-50 text-slate-500'">
              <span><span class="font-medium" :class="isDark ? 'text-slate-300' : 'text-slate-700'">Fecha:</span> {{ formatFecha(modalAprobar.registro?.fecha) }}</span>
              <span><span class="font-medium" :class="isDark ? 'text-slate-300' : 'text-slate-700'">Dpto:</span> {{ modalAprobar.registro?.departamento || '—' }}</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-5 py-3 border-t flex items-center justify-end gap-2"
            :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
            <button @click="cerrarModal"
              class="h-7 px-3 rounded-[5px] text-[11px] font-medium border transition-all"
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
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';
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
  cargarHistorial,
  calcular,
  guardarCalculados,
  aprobarRegistro,
  exportarExcel,
  formatHora,
  formatFecha,
  formatDecimal,
  COLS_HX,
  hasPerm,
  novedadesAprobadas,
  isLoadingNovedades,
  cargarNovedadesAprobadas,
  isNotifying,
  notificarAprobados,
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
    // Si estamos en el historial de cargue, recargar esa vista
    if (activeTab.value === 'cargue' && activeCargueView.value === 'historial') {
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

// ── Handlers cálculos ────────────────────────────────────────────────────────
async function handleCargar() {
  await cargarHistorial(props.company);
}

async function handleCalcular() {
  try {
    await calcular(props.company);
  } catch { /* el composable ya loguea */ }
}

async function handleGuardar() {
  try {
    await guardarCalculados(props.company);
  } catch { /* el composable ya loguea */ }
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

watch(() => props.company, (v) => {
  cargarHistorial(v);
});

onMounted(() => {
  cargarHistorial(props.company);
  document.addEventListener('click', handleCargueMenuOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleCargueMenuOutsideClick);
});
</script>
<style></style>
