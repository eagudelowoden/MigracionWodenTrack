<template>
  <div class="h-full animate-fade-in flex flex-col gap-3">

    <!-- ── Header row: Tabs (izq) + Acciones (der) ───────────────────────── -->
    <div class="flex items-center justify-between gap-3 flex-wrap"
      v-if="isSuperAdmin || hasPerm('admin.calculos') || hasPerm('horas.cargue')">

      <!-- Tabs (Vercel segmented) -->
      <div class="flex items-center gap-0.5 p-0.5 rounded-md border w-fit"
        :class="isDark ? 'bg-[#0B0F19] border-[#222938]' : 'bg-slate-100 border-slate-200'">
        <button @click="activeTab = 'calculos'"
          class="px-3 h-7 rounded-[5px] text-[11px] font-medium transition-all flex items-center gap-1.5"
          :class="activeTab === 'calculos'
            ? (isDark ? 'bg-[#161B26] text-white' : 'bg-white text-slate-900 shadow-sm')
            : (isDark ? 'text-[#888888] hover:text-white' : 'text-slate-500 hover:text-slate-800')">
          <i class="fas fa-calculator text-[10px]"></i>Cálculos
        </button>
        <button v-if="isSuperAdmin || hasPerm('horas.cargue')" @click="activeTab = 'cargue'"
          class="px-3 h-7 rounded-[5px] text-[11px] font-medium transition-all flex items-center gap-1.5"
          :class="activeTab === 'cargue'
            ? (isDark ? 'bg-[#161B26] text-white' : 'bg-white text-slate-900 shadow-sm')
            : (isDark ? 'text-[#888888] hover:text-white' : 'text-slate-500 hover:text-slate-800')">
          <i class="fas fa-file-arrow-up text-[10px]"></i>Cargue Horas
        </button>
      </div>

      <!-- Acciones (solo visible en tab Cálculos) — borde azul visible en ambos modos -->
      <div v-if="activeTab === 'calculos'" class="flex items-center gap-1.5">

        <!-- Refrescar (icon button con borde azul sutil) -->
        <button @click="handleCargar" :disabled="isLoading"
          class="h-7 w-7 rounded-[5px] border flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-40"
          :class="isDark
            ? 'bg-[#161B26] border-[#3B82F6]/30 text-[#888888] hover:text-white hover:border-[#3B82F6]/60 hover:bg-[#3B82F6]/[0.05]'
            : 'bg-white border-[#3B82F6]/30 text-slate-500 hover:text-[#3B82F6] hover:border-[#3B82F6]/60 hover:bg-[#3B82F6]/[0.05]'"
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

        <!-- Guardar (primary brand fill) -->
        <button @click="handleGuardar" :disabled="isSaving || isCalculating || !hayResultadosCalculados"
          class="flex items-center gap-1.5 h-7 px-3 rounded-[5px] border text-[11px] font-medium transition-all active:scale-[0.98] disabled:opacity-40 bg-[#3B82F6] border-[#3B82F6] text-white hover:bg-[#2563EB] hover:border-[#2563EB]">
          <i :class="isSaving ? 'fas fa-spinner fa-spin' : 'fas fa-floppy-disk'" class="text-[10px]"></i>
          <span>{{ isSaving ? 'Guardando…' : 'Guardar' }}</span>
        </button>
      </div>
    </div>

    <!-- ══ TAB CÁLCULOS ════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'calculos'">

      <!-- ── Toolbar con filtros (Vercel) ───────────────────────────────── -->
      <div class="rounded-md border"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

        <!-- Sección filtros -->
        <div class="flex flex-wrap items-end gap-3 px-3 py-2.5">

          <!-- Rango de fechas -->
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-medium" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
              Desde
            </label>
            <input type="date" v-model="startDate"
              class="h-7 px-2.5 text-[11px] font-medium rounded-[5px] border outline-none transition-all"
              :class="isDark
                ? 'bg-[#0B0F19] border-[#222938] text-white focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'
                : 'bg-white border-slate-200 text-slate-800 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-medium" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
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

          <!-- Buscar nombre -->
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-medium" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
              Nombre
            </label>
            <div class="relative">
              <i class="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px]"
                :class="isDark ? 'text-[#888888]' : 'text-slate-400'"></i>
              <input v-model="filterNombre" type="text" placeholder="Buscar…"
                class="h-7 pl-7 pr-2.5 text-[11px] font-medium rounded-[5px] border outline-none w-40 transition-all"
                :class="isDark
                  ? 'bg-[#0B0F19] border-[#222938] text-white placeholder:text-[#5a5a5a] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'
                  : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'" />
            </div>
          </div>

          <!-- Cargo -->
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-medium" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
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
                :class="isDark ? 'text-[#888888]' : 'text-slate-400'"></i>
            </div>
          </div>

          <!-- Departamento -->
          <div v-if="hasPerm('admin.filtro_departamento') || isSuperAdmin" class="flex flex-col gap-1">
            <label class="text-[10px] font-medium" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
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
              <div class="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform peer-checked:translate-x-3"></div>
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
            <tr class="bg-[#0B0F19]">
              <th colspan="2"
                class="px-3 py-2 text-left text-[10px] font-medium tracking-wide border-b border-r border-[#222938] text-[#888888]">
                Colaborador
              </th>
              <th
                class="px-3 py-2 text-center text-[10px] font-medium tracking-wide border-b border-r border-[#222938] text-[#888888]">
                Fecha
              </th>
              <th colspan="2"
                class="px-3 py-2 text-center text-[10px] font-medium tracking-wide border-b border-r border-[#222938] text-[#888888]">
                Jornada
              </th>
              <th colspan="2"
                class="px-3 py-2 text-center text-[10px] font-medium tracking-wide border-b border-r border-[#222938] text-[#888888]">
                Tiempo laborado
              </th>
              <th v-for="col in ['RN', 'RNDF', 'RDDF', 'HEDO', 'HENO', 'HEFD', 'HEFN']" :key="col"
                class="px-2 py-2 text-center text-[10px] font-medium tracking-wide border-b border-r w-12 border-[#222938] text-[#888888]">
                {{ col }}
              </th>
              <th
                class="px-3 py-2 text-center text-[10px] font-medium tracking-wide border-b w-20 border-[#222938] text-[#888888]">
                Aprobar
              </th>
            </tr>
            <tr class="bg-[#0B0F19]">
              <th class="px-3 py-1.5 text-left text-[9px] font-normal border-b border-r w-28 border-[#222938] text-[#6a6a72]">
                Cédula</th>
              <th class="px-3 py-1.5 text-left text-[9px] font-normal border-b border-r border-[#222938] text-[#6a6a72]">
                Nombre</th>
              <th class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r w-24 border-[#222938] text-[#6a6a72]">
                </th>
              <th class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r w-20 border-[#222938] text-[#6a6a72]">
                Inicio</th>
              <th class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r w-20 border-[#222938] text-[#6a6a72]">
                Fin</th>
              <th class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r w-20 border-[#222938] text-[#6a6a72]">
                Entrada</th>
              <th class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r w-20 border-[#222938] text-[#6a6a72]">
                Salida</th>
              <th v-for="_ in 7" :key="_"
                class="px-2 py-1.5 text-center text-[9px] font-normal border-b border-r border-[#222938] text-[#6a6a72]">
                hrs</th>
              <th class="px-3 py-1.5 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-200'"></th>
            </tr>
          </thead>

          <tbody>
            <!-- Loading skeleton -->
            <tr v-if="isLoading || isCalculating" v-for="n in 8" :key="'sk-' + n">
              <td colspan="15" class="px-3 py-3">
                <div class="h-3 w-full rounded animate-pulse" :class="isDark ? 'bg-[#161B26]' : 'bg-slate-100'"></div>
              </td>
            </tr>

            <!-- Sin datos -->
            <tr v-else-if="!filasPaginadas.length">
              <td colspan="15" class="px-4 py-14 text-center">
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
                <td colspan="15" class="px-4 py-2 text-[10px] font-medium border-b"
                  :class="isDark
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
                    <button @click="handleAprobar(item.data.id, true)"
                      class="w-6 h-6 rounded-[4px] flex items-center justify-center transition-all border"
                      :class="item.data.aprobado === true
                        ? 'bg-[#16a34a] border-[#16a34a] text-white'
                        : (isDark
                            ? 'bg-transparent border-[#222938] text-[#888888] hover:text-[#4ade80] hover:border-[#16a34a]/40'
                            : 'bg-transparent border-slate-200 text-slate-400 hover:text-[#16a34a] hover:border-[#16a34a]/40')">
                      <i class="fas fa-check text-[9px]"></i>
                    </button>
                    <button @click="handleAprobar(item.data.id, false)"
                      class="w-6 h-6 rounded-[4px] flex items-center justify-center transition-all border"
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
                <td colspan="7" class="px-3 py-2 border-b border-r text-[10px] font-medium"
                  :class="isDark
                    ? 'bg-[#3B82F6]/[0.06] border-[#222938] text-[#60A5FA]'
                    : 'bg-blue-50/50 border-slate-200 text-blue-700'">
                  Subtotal — {{ item.data.nombre }}
                </td>
                <td v-for="col in COLS_HX" :key="col"
                  class="px-2 py-2 border-b border-r text-center text-[11px] font-semibold"
                  :class="isDark
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

    <!-- ══ TAB CARGUE HORAS (Vercel) ════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'cargue'">
      <div class="flex flex-col gap-3 flex-1 overflow-hidden">

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
            :class="isDark
              ? 'bg-[#0B0F19] border-[#222938] text-[#888888]'
              : 'bg-slate-50 border-slate-200 text-slate-500'">
            <i class="fas fa-circle-info text-[10px] text-[#3B82F6]"></i>
            <span>Descarga la plantilla, complétala y súbela aquí. El sistema asignará los registros automáticamente.</span>
          </div>
        </div>

        <!-- Card principal -->
        <div class="flex-1 rounded-md border flex flex-col overflow-hidden"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

          <!-- Drop zone -->
          <div class="flex-1 flex flex-col items-center justify-center gap-4 p-8 m-4 rounded-md border border-dashed cursor-pointer transition-all"
            :class="[
              isDragOver
                ? 'border-[#3B82F6] bg-[#3B82F6]/[0.06]'
                : (isDark
                    ? 'border-[#222938] hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/[0.03]'
                    : 'border-slate-300 hover:border-[#3B82F6]/50 hover:bg-slate-50/60'),
              archivoSeleccionado ? 'border-[#16a34a] bg-[#16a34a]/[0.04]' : ''
            ]"
            @dragover.prevent="isDragOver = true"
            @dragleave="isDragOver = false"
            @drop.prevent="handleDrop"
            @click="$refs.fileInput.click()">

            <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="handleFileSelect" />

            <!-- Icono limpio Vercel -->
            <div class="w-12 h-12 rounded-md flex items-center justify-center transition-all"
              :class="archivoSeleccionado
                ? (isDark ? 'bg-[#16a34a]/10 text-[#4ade80]' : 'bg-green-50 text-[#16a34a]')
                : (isDark ? 'bg-[#3B82F6]/10 text-[#60A5FA]' : 'bg-blue-50 text-[#3B82F6]')">
              <i class="text-[18px] transition-all"
                :class="[
                  archivoSeleccionado ? 'fas fa-file-circle-check' : 'fas fa-file-arrow-up',
                  isDragOver ? 'scale-110' : ''
                ]"></i>
            </div>

            <!-- Texto -->
            <div class="text-center">
              <p class="text-[13px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">
                {{ archivoSeleccionado ? archivoSeleccionado.name : 'Arrastra tu Excel o haz clic para seleccionar' }}
              </p>
              <p class="text-[11px] mt-1" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
                {{ archivoSeleccionado ? 'Archivo listo para cargar' : 'Formatos: .xlsx, .xls' }}
              </p>
            </div>

            <button v-if="archivoSeleccionado" @click.stop="archivoSeleccionado = null"
              class="h-6 px-2.5 rounded-[5px] text-[10px] font-medium border transition-colors"
              :class="isDark
                ? 'border-[#222938] text-[#888888] hover:text-[#f87171] hover:border-[#f87171]/40'
                : 'border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300'">
              <i class="fas fa-times mr-1 text-[9px]"></i>Quitar
            </button>
          </div>

          <!-- Mensajes de estado -->
          <div v-if="cargueSuccessMsg" class="mx-4 mb-3 px-3 py-2 rounded-[5px] text-[11px] font-medium border flex items-center gap-2"
            :class="isDark
              ? 'bg-[#16a34a]/[0.08] border-[#16a34a]/30 text-[#4ade80]'
              : 'bg-green-50 border-green-200 text-green-700'">
            <i class="fas fa-circle-check text-[12px]"></i>{{ cargueSuccessMsg }}
          </div>
          <div v-if="cargueErrorMsg" class="mx-4 mb-3 px-3 py-2 rounded-[5px] text-[11px] font-medium border flex items-center gap-2"
            :class="isDark
              ? 'bg-[#dc2626]/[0.08] border-[#dc2626]/30 text-[#f87171]'
              : 'bg-red-50 border-red-200 text-red-700'">
            <i class="fas fa-triangle-exclamation text-[12px]"></i>{{ cargueErrorMsg }}
          </div>

          <!-- Footer con botón guardar -->
          <div class="px-4 py-2.5 border-t flex items-center justify-end"
            :class="isDark ? 'border-[#222938] bg-[#0B0F19]/40' : 'border-slate-200 bg-slate-50/60'">
            <button @click="handleSubirExcel" :disabled="!archivoSeleccionado || isUploading"
              class="flex items-center gap-1.5 h-7 px-3 rounded-[5px] text-[11px] font-medium transition-all active:scale-[0.98] disabled:opacity-40 bg-[#3B82F6] hover:bg-[#2563EB] text-white">
              <i :class="isUploading ? 'fas fa-spinner fa-spin' : 'fas fa-cloud-arrow-up'" class="text-[10px]"></i>
              {{ isUploading ? 'Guardando…' : 'Guardar cargue' }}
            </button>
          </div>

        </div>

      </div>
    </template>
    <!-- ══ FIN TAB CARGUE HORAS ══════════════════════════════════════════════ -->

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
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
} = useReporteMallas();

// ── Composable Cargue ────────────────────────────────────────────────────────
const {
  isUploading,
  isExportingPlantilla,
  errorMsg: cargueErrorMsg,
  successMsg: cargueSuccessMsg,
  subirExcel,
  descargarPlantilla,
} = useCargueHoras();

const archivoSeleccionado = ref(null);
const isDragOver = ref(false);

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

async function handleAprobar(id, aprobado) {
  try {
    await aprobarRegistro(id, aprobado);
  } catch { /* silencioso */ }
}

watch(() => props.company, (v) => {
  cargarHistorial(v);
});

onMounted(() => {
  cargarHistorial(props.company);
});
</script>
<style></style>
