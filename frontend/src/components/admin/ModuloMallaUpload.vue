<template>
  <div class="h-full animate-fade-in flex flex-col gap-2 font-round-custom">

    <!-- ── Tabs ──────────────────────────────────────────────────────────── -->
    <div class="flex items-center gap-1 px-1">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        class="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
        :class="activeTab === tab.id
          ? (isDark ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' : 'bg-amber-500 text-white shadow-md shadow-amber-500/20')
          : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100')">
        <i :class="tab.icon + ' text-xs'"></i>
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════
         TAB 1: REPORTE HORAS EXTRA MALLAS
    ══════════════════════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'reporte'">

      <!-- Barra de controles -->
      <div class="flex flex-wrap items-end gap-3 p-3 px-4 rounded-2xl border transition-all duration-300 -mt-1 shadow-sm"
        :class="isDark ? 'bg-[#1e2538] border-white/5 shadow-black/20' : 'bg-[#f8fafc] border-slate-200 shadow-slate-200/50'">

        <!-- Desde -->
        <div class="flex flex-col gap-1">
          <label class="text-[8px] font-black uppercase tracking-widest"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Desde</label>
          <input type="date" v-model="startDate"
            class="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border outline-none transition-colors"
            :class="isDark ? 'bg-slate-800 border-white/10 text-white focus:border-amber-500' : 'bg-white border-slate-200 text-slate-800 focus:border-amber-500'" />
        </div>

        <!-- Hasta -->
        <div class="flex flex-col gap-1">
          <label class="text-[8px] font-black uppercase tracking-widest"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Hasta</label>
          <input type="date" v-model="endDate"
            class="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border outline-none transition-colors"
            :class="isDark ? 'bg-slate-800 border-white/10 text-white focus:border-amber-500' : 'bg-white border-slate-200 text-slate-800 focus:border-amber-500'" />
        </div>

        <!-- Filtro Nombre -->
        <div class="flex flex-col gap-1">
          <label class="text-[8px] font-black uppercase tracking-widest"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Nombre</label>
          <div class="relative">
            <i class="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400"></i>
            <input v-model="filterNombre" type="text" placeholder="Buscar nombre..."
              class="pl-7 pr-2.5 py-1.5 text-[10px] font-semibold rounded-lg border outline-none w-40 transition-colors"
              :class="isDark ? 'bg-slate-800 border-white/10 text-white focus:border-amber-500' : 'bg-white border-slate-200 text-slate-800 focus:border-amber-500'" />
          </div>
        </div>

        <!-- Filtro Cargo -->
        <div class="flex flex-col gap-1">
          <label class="text-[8px] font-black uppercase tracking-widest"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cargo</label>
          <div class="relative">
            <select v-model="filterCargo"
              class="pl-2.5 pr-7 py-1.5 text-[10px] font-semibold rounded-lg border outline-none appearance-none w-44 cursor-pointer transition-colors"
              :class="isDark ? 'bg-slate-800 border-white/10 text-white focus:border-amber-500' : 'bg-white border-slate-200 text-slate-800 focus:border-amber-500'">
              <option value="">Todos los cargos</option>
              <option v-for="c in opcionesCargos" :key="c" :value="c">{{ c }}</option>
            </select>
            <i class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 pointer-events-none"></i>
          </div>
        </div>

        <!-- Filtro Departamento -->
        <div v-if="hasPerm('admin.filtro_departamento') || isSuperAdmin" class="flex flex-col gap-1">
          <label class="text-[8px] font-black uppercase tracking-widest"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Departamento</label>
          <div class="relative">
            <select v-model="filterDepartamento"
              class="pl-2.5 pr-7 py-1.5 text-[10px] font-semibold rounded-lg border outline-none appearance-none w-48 cursor-pointer transition-colors"
              :class="isDark ? 'bg-slate-800 border-white/10 text-white focus:border-amber-500' : 'bg-white border-slate-200 text-slate-800 focus:border-amber-500'">
              <option value="">Todos los departamentos</option>
              <option v-for="d in opcionesDepartamentos" :key="d" :value="d">{{ d }}</option>
            </select>
            <i class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 pointer-events-none"></i>
          </div>
        </div>

        <!-- Toggle solo con extras -->
        <label class="flex items-center gap-2 cursor-pointer select-none self-end pb-1.5">
          <div class="relative">
            <input type="checkbox" v-model="soloConExtras" class="sr-only peer" />
            <div class="w-8 h-4 rounded-full transition-colors peer-checked:bg-amber-500"
              :class="isDark ? 'bg-white/10' : 'bg-slate-200'"></div>
            <div class="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform peer-checked:translate-x-4 shadow-sm"></div>
          </div>
          <span class="text-[9px] font-black uppercase tracking-wide whitespace-nowrap"
            :class="isDark ? 'text-slate-300' : 'text-slate-600'">Solo con extras</span>
        </label>

        <!-- Acciones -->
        <div class="flex items-center gap-2 ml-auto self-end">

          <!-- Calcular y Guardar -->
          <button @click="handleCalcular"
            :disabled="isCalculating || isLoading"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
            :class="isDark ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'">
            <i :class="isCalculating ? 'fas fa-spinner fa-spin' : 'fas fa-calculator'" class="text-xs"></i>
            <span>{{ isCalculating ? 'Calculando...' : 'Calcular' }}</span>
          </button>

          <!-- Refrescar -->
          <button @click="handleCargar"
            :disabled="isLoading"
            class="p-2 rounded-lg transition-all"
            :class="isDark ? 'text-slate-400 hover:text-amber-400' : 'text-slate-500 hover:text-amber-500'"
            title="Refrescar">
            <i class="fas fa-arrows-rotate text-base" :class="{ 'fa-spin': isLoading }"></i>
          </button>

          <!-- Exportar Excel -->
          <button @click="handleExportar"
            :disabled="isExporting || !registros.length"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50">
            <i :class="isExporting ? 'fas fa-spinner fa-spin' : 'fas fa-file-excel'" class="text-xs"></i>
            <span>{{ isExporting ? 'Exportando...' : 'Excel' }}</span>
          </button>

        </div>
      </div>

      <!-- Nota sexagesimal -->
      <div class="px-4 py-1.5 rounded-xl text-[9px] font-medium"
        :class="isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200'">
        <i class="fas fa-circle-info mr-1.5"></i>
        <strong>NOTA:</strong> Valores en sistema sexagesimal.
        15 min = 0,25 &nbsp;|&nbsp; 30 min = 0,50 &nbsp;|&nbsp; 45 min = 0,75 &nbsp;|&nbsp; 60 min = 1,0
      </div>

      <!-- Tabla principal -->
      <div class="flex-1 overflow-hidden rounded-xl border flex flex-col transition-all duration-300"
        :class="isDark ? 'bg-[#253045] border-[#253045]' : 'bg-white border-slate-200 shadow-sm'">

        <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
          <table class="w-full border-separate border-spacing-0 text-[10px]">

            <!-- ENCABEZADO GRUPOS -->
            <thead class="sticky top-0 z-30">
              <tr :class="isDark ? 'bg-[#1e293b]' : 'bg-[#334155]'">
                <th colspan="2" class="px-3 py-2 text-center text-[9px] font-black uppercase tracking-wider border-b border-r border-white/10 text-white">
                  COLABORADOR
                </th>
                <th class="px-3 py-2 text-center text-[9px] font-black uppercase tracking-wider border-b border-r border-white/10 text-white">
                  FECHA
                </th>
                <th colspan="2" class="px-3 py-2 text-center text-[9px] font-black uppercase tracking-wider border-b border-r border-white/10 text-white">
                  JORNADA LABORAL
                </th>
                <th colspan="2" class="px-3 py-2 text-center text-[9px] font-black uppercase tracking-wider border-b border-r border-white/10 text-white">
                  TIEMPO LABORADO
                </th>
                <th v-for="col in ['RN','RNDF','RDDF','HEDO','HENO','HEFD','HEFN']" :key="col"
                  class="px-2 py-2 text-center text-[9px] font-black uppercase tracking-wider border-b border-r border-white/10 text-white w-12">
                  {{ col }}
                </th>
                <th class="px-3 py-2 text-center text-[9px] font-black uppercase tracking-wider border-b border-white/10 text-white w-20">
                  APROBAR
                </th>
              </tr>

              <!-- Sub-encabezados -->
              <tr :class="isDark ? 'bg-[#253045]' : 'bg-[#475569]'">
                <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300 w-28">Cédula</th>
                <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300">Nombre</th>
                <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300 w-24">Fecha</th>
                <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300 w-20">Hora Ini.</th>
                <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300 w-20">Hora Fin</th>
                <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300 w-20">Hora Ini.</th>
                <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300 w-20">Hora Fin</th>
                <th v-for="_ in 7" :key="_"
                  class="px-2 py-1.5 text-[8px] font-bold text-center tracking-wider border-b border-r border-white/10 text-slate-400">0</th>
                <th class="px-3 py-1.5 border-b border-white/10 text-slate-300"></th>
              </tr>
            </thead>

            <tbody>
              <!-- Loading skeleton -->
              <tr v-if="isLoading || isCalculating" v-for="n in 8" :key="'sk-'+n">
                <td colspan="15" class="px-3 py-3">
                  <div class="h-3 w-full rounded animate-pulse"
                    :class="isDark ? 'bg-white/5' : 'bg-slate-100'"></div>
                </td>
              </tr>

              <!-- Sin datos -->
              <tr v-else-if="!filasPaginadas.length">
                <td colspan="15" class="px-4 py-12 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center"
                      :class="isDark ? 'bg-white/5' : 'bg-slate-100'">
                      <i class="fas fa-table text-xl" :class="isDark ? 'text-slate-600' : 'text-slate-300'"></i>
                    </div>
                    <p class="text-[11px] font-bold uppercase"
                      :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                      Sin registros. Selecciona un rango de fechas y presiona Calcular.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Filas de datos -->
              <template v-else v-for="(item, idx) in filasPaginadas" :key="idx">

                <!-- Fila cabecera empresa -->
                <tr v-if="item.tipo === 'empresa'">
                  <td colspan="15"
                    class="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white border-b"
                    :class="isDark ? 'bg-[#1e293b] border-white/10' : 'bg-[#334155] border-slate-600'">
                    <i class="fas fa-building mr-2 opacity-70"></i>{{ item.data.empresa }}
                  </td>
                </tr>

                <!-- Fila normal -->
                <tr v-else-if="item.tipo === 'fila'"
                  class="group transition-all duration-100"
                  :class="[
                    idx % 2 !== 0
                      ? (isDark ? 'bg-white/[0.03]' : 'bg-slate-50/60')
                      : '',
                    isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-amber-50/40'
                  ]">

                  <!-- Cédula -->
                  <td class="px-3 py-2 border-b border-r font-mono text-[9px]"
                    :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-slate-500'">
                    {{ item.data.cedula }}
                  </td>

                  <!-- Nombre -->
                  <td class="px-3 py-2 border-b border-r"
                    :class="isDark ? 'border-white/5' : 'border-slate-100'">
                    <div class="font-bold uppercase"
                      :class="isDark ? 'text-white' : 'text-slate-900'">
                      {{ item.data.nombre }}
                    </div>
                    <div class="text-[8px] mt-0.5"
                      :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                      {{ item.data.cargo || '—' }}
                    </div>
                  </td>

                  <!-- Fecha -->
                  <td class="px-3 py-2 border-b border-r text-center"
                    :class="[isDark ? 'border-white/5' : 'border-slate-100',
                      item.data.es_dominical
                        ? 'text-amber-500 font-black'
                        : (isDark ? 'text-slate-300' : 'text-slate-700')]">
                    <span>{{ formatFecha(item.data.fecha) }}</span>
                    <span v-if="item.data.es_dominical"
                      class="ml-1 text-[7px] font-black bg-amber-500/20 text-amber-500 px-1 rounded">DOM</span>
                  </td>

                  <!-- Jornada Laboral (de la malla) -->
                  <td class="px-3 py-2 border-b border-r text-center font-mono"
                    :class="isDark ? 'border-white/5 text-slate-300' : 'border-slate-100 text-slate-700'">
                    {{ item.data.inicio_turno || '—' }}
                  </td>
                  <td class="px-3 py-2 border-b border-r text-center font-mono"
                    :class="isDark ? 'border-white/5 text-slate-300' : 'border-slate-100 text-slate-700'">
                    {{ item.data.fin_turno || '—' }}
                  </td>

                  <!-- Tiempo Laborado (asistencia real) -->
                  <td class="px-3 py-2 border-b border-r text-center font-mono"
                    :class="isDark ? 'border-white/5 text-emerald-400' : 'border-slate-100 text-emerald-700'">
                    {{ formatHora(item.data.fecha_entrada) || '—' }}
                  </td>
                  <td class="px-3 py-2 border-b border-r text-center font-mono"
                    :class="isDark ? 'border-white/5 text-emerald-400' : 'border-slate-100 text-emerald-700'">
                    {{ formatHora(item.data.fecha_salida) || '—' }}
                  </td>

                  <!-- Columnas HX -->
                  <td v-for="col in COLS_HX" :key="col"
                    class="px-2 py-2 border-b border-r text-center"
                    :class="[
                      isDark ? 'border-white/5' : 'border-slate-100',
                      Number(item.data[col]) > 0
                        ? (isDark ? 'text-amber-400 font-black' : 'text-amber-600 font-black')
                        : (isDark ? 'text-slate-600' : 'text-slate-300')
                    ]">
                    {{ formatDecimal(item.data[col]) }}
                  </td>

                  <!-- Aprobar -->
                  <td class="px-2 py-2 border-b text-center"
                    :class="isDark ? 'border-white/5' : 'border-slate-100'">
                    <div class="flex items-center justify-center gap-1">
                      <button @click="handleAprobar(item.data.id, true)"
                        :title="'Aprobar'"
                        class="w-6 h-6 rounded flex items-center justify-center transition-all"
                        :class="item.data.aprobado === true
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : (isDark ? 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50')">
                        <i class="fas fa-check text-[9px]"></i>
                      </button>
                      <button @click="handleAprobar(item.data.id, false)"
                        :title="'Rechazar'"
                        class="w-6 h-6 rounded flex items-center justify-center transition-all"
                        :class="item.data.aprobado === false
                          ? 'bg-rose-500 text-white shadow-sm'
                          : (isDark ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50')">
                        <i class="fas fa-times text-[9px]"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Fila de SUBTOTAL por colaborador -->
                <tr v-else-if="item.tipo === 'subtotal'"
                  class="transition-all">
                  <td colspan="7"
                    class="px-3 py-2 border-b border-r text-[9px] font-black uppercase italic"
                    :class="isDark
                      ? 'bg-amber-500/15 border-amber-500/20 text-amber-300'
                      : 'bg-amber-50 border-amber-200 text-amber-800'">
                    Subtotal — {{ item.data.nombre }}
                  </td>
                  <td v-for="col in COLS_HX" :key="col"
                    class="px-2 py-2 border-b border-r text-center text-[10px] font-black"
                    :class="isDark
                      ? 'bg-amber-500/15 border-amber-500/20 text-amber-300'
                      : 'bg-amber-50 border-amber-200 text-amber-700'">
                    {{ formatDecimal(item.data.subtotales[col]) }}
                  </td>
                  <td class="border-b"
                    :class="isDark ? 'bg-amber-500/15 border-amber-500/20' : 'bg-amber-50 border-amber-200'">
                  </td>
                </tr>

              </template>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div v-if="filasAplanadas.length > 0"
          class="px-4 py-2 border-t flex items-center justify-between"
          :class="isDark ? 'border-white/5 bg-[#1a1d2d]' : 'border-slate-200 bg-slate-50'">
          <span class="text-[10px] font-bold uppercase" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            Registros: <span :class="isDark ? 'text-white' : 'text-slate-900'">{{ totalRegistros }}</span>
          </span>
          <div class="flex items-center gap-2">
            <button @click="currentPage--" :disabled="currentPage === 1"
              class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all disabled:opacity-20"
              :class="isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'">
              <i class="fas fa-chevron-left text-[9px]"></i>
            </button>
            <div class="px-3 py-1 rounded-lg text-[11px] font-bold border"
              :class="isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'">
              {{ currentPage }} / {{ totalPages }}
            </div>
            <button @click="currentPage++" :disabled="currentPage >= totalPages"
              class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all disabled:opacity-20"
              :class="isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'">
              <i class="fas fa-chevron-right text-[9px]"></i>
            </button>
          </div>
        </div>
      </div>

    </template>

    <!-- ══════════════════════════════════════════════════════════════════════
         TAB 2: ASIGNACIÓN DE MALLAS
    ══════════════════════════════════════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'asignacion'">

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
            <h2 class="text-base font-bold tracking-tight" :class="isDark ? 'text-white' : 'text-slate-800'">Asignación de Mallas</h2>
            <p class="text-[9px] text-amber-600 dark:text-amber-500 font-black uppercase tracking-[0.15em]">Horarios Colaboradores</p>
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
              <i class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 pointer-events-none"></i>
            </div>
          </template>

          <div class="relative">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400"></i>
            <input v-model="searchQuery" type="text" placeholder="BUSCAR..."
              class="pl-8 pr-3 py-1.5 text-[10px] font-bold uppercase rounded-lg border outline-none w-40 md:w-52 transition-all shadow-sm"
              :class="isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-500' : 'bg-white border-slate-200 text-slate-700 focus:border-amber-500'" />
          </div>

          <div class="flex items-center gap-1.5 border-l border-slate-200 dark:border-white/10 pl-2">
            <button @click="fetchMallasDesdeOdoo"
              class="p-2 rounded-lg transition-all"
              :class="isDark ? 'text-slate-400 hover:text-amber-400' : 'text-slate-500 hover:text-amber-500'"
              title="Refrescar">
              <i class="fas fa-arrows-rotate text-base" :class="{ 'fa-spin': isLoadingMallas }"></i>
            </button>

            <button @click="downloadMallaTemplate"
              class="p-2 rounded-lg bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
              title="Descargar Plantilla">
              <i :class="isLoadingDownload ? 'fas fa-spinner fa-spin' : 'fas fa-file-excel'" class="text-sm"></i>
            </button>

            <input type="file" id="fileInputMallas" class="hidden" @change="handleFileSelect"
              :disabled="isUploading" accept=".xlsx,.xls" />
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
              <tr v-if="isLoadingMallas" v-for="n in 8" :key="'loader-' + n">
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
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
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
            <div class="mt-3 px-3 py-2 rounded-xl flex items-center gap-2"
              :class="isDark ? 'bg-white/5' : 'bg-slate-50'">
              <i class="fas fa-table-list text-amber-500 text-xs"></i>
              <span class="text-[11px] font-bold" :class="isDark ? 'text-slate-200' : 'text-slate-700'">
                {{ previewRows.length }} registro{{ previewRows.length !== 1 ? 's' : '' }} detectado{{ previewRows.length !== 1 ? 's' : '' }}
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
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
        <div class="w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[80vh]"
          :class="isDark ? 'bg-[#1e2538] border-white/10' : 'bg-white border-slate-200'">
          <div class="flex items-center justify-between px-5 py-4 border-b"
            :class="isDark ? 'border-white/10' : 'border-slate-100'">
            <h3 class="text-[12px] font-bold uppercase tracking-widest" :class="isDark ? 'text-white' : 'text-slate-800'">Vista Previa</h3>
            <button @click="cancelAll"
              class="w-7 h-7 flex items-center justify-center rounded-lg"
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
                    :class="isDark ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'">{{ i + 1 }}</td>
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
            <button @click="cancelAll"
              class="px-4 py-2 rounded-xl text-[11px] font-bold uppercase border transition-all"
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
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
        <div class="bg-white dark:bg-slate-950 max-w-sm w-full rounded-2xl shadow-xl border border-slate-200/60 dark:border-white/5 overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4">
            <h3 class="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Estado de Carga</h3>
            <button @click="showResultModal = false" class="text-slate-300 hover:text-slate-600 transition-colors">
              <i class="fas fa-times text-xs"></i>
            </button>
          </div>
          <div class="px-5 pb-6">
            <div v-if="uploadSuccessMessage" class="mb-4 flex items-center gap-3 text-emerald-600">
              <div class="h-1.5 w-1.5 rounded-full bg-current"></div>
              <p class="text-sm font-medium">{{ uploadSuccessMessage }}</p>
            </div>
            <div v-if="uploadErrors?.length > 0" class="space-y-1">
              <p class="text-[10px] font-semibold text-rose-500/80 mb-2 px-1">INCIDENCIAS DETECTADAS</p>
              <div class="max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                <div v-for="(err, i) in uploadErrors" :key="i"
                  class="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <span class="text-[9px] font-mono text-slate-400 mt-0.5">#{{ err.fila }}</span>
                  <p class="text-[11px] font-medium text-slate-700 leading-tight">
                    <span class="text-slate-400 font-normal">{{ err.campo }}:</span> {{ err.error }}
                  </p>
                </div>
              </div>
            </div>
            <button @click="showResultModal = false"
              class="w-full mt-6 py-2.5 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-all">
              Continuar
            </button>
          </div>
        </div>
      </div>

    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useMallasGeneral } from '../../composables/adminLogica/mallasGeneral';
import { useReporteMallas } from '../../composables/adminLogica/useReporteMallas';
import '../../assets/css/modulo-mallas.css';

const props = defineProps({
  isDark: Boolean,
  company: String,
});

// ── Tabs ─────────────────────────────────────────────────────────────────────
const activeTab = ref('reporte');

const tabs = [
  { id: 'reporte', label: 'Reporte HX Mallas', icon: 'fas fa-chart-bar' },
  { id: 'asignacion', label: 'Asignación Mallas', icon: 'fas fa-cloud-arrow-up' },
];

// ── Sesión ───────────────────────────────────────────────────────────────────
const session = JSON.parse(localStorage.getItem('user_session') || '{}');
const isSuperAdmin = session.isSuperAdmin || false;
const hasPerm = (permiso) => {
  const permisos = session.permisos || session.permissions || {};
  return permisos[permiso] === true;
};

// ── Tab Reporte (HX) ─────────────────────────────────────────────────────────
const {
  registros,
  isLoading,
  isCalculating,
  isExporting,
  startDate,
  endDate,
  filterNombre,
  filterCargo,
  filterDepartamento,
  soloConExtras,
  opcionesNombres,
  opcionesCargos,
  opcionesDepartamentos,
  filasPaginadas,
  filasAplanadas,
  currentPage,
  totalPages,
  totalRegistros,
  cargarHistorial,
  calcularYCargar,
  aprobarRegistro,
  exportarExcel,
  formatHora,
  formatFecha,
  formatDecimal,
  COLS_HX,
} = useReporteMallas();

async function handleCargar() {
  await cargarHistorial(props.company);
}

async function handleCalcular() {
  try {
    await calcularYCargar(props.company);
  } catch {
    // Silencioso; el composable ya loguea
  }
}

async function handleExportar() {
  try {
    await exportarExcel(props.company);
  } catch {
    // Silencioso
  }
}

async function handleAprobar(id, aprobado) {
  try {
    await aprobarRegistro(id, aprobado);
  } catch {
    // Silencioso
  }
}

// ── Tab Asignación (mallas legacy) ───────────────────────────────────────────
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

// ── Sincronizar company ───────────────────────────────────────────────────────
watch(() => props.company, (v) => {
  selectedCompany.value = v;
  if (activeTab.value === 'asignacion') fetchMallasDesdeOdoo();
  if (activeTab.value === 'reporte') cargarHistorial(v);
});

watch(activeTab, (tab) => {
  if (tab === 'asignacion') fetchMallasDesdeOdoo();
  if (tab === 'reporte') cargarHistorial(props.company);
});

onMounted(() => {
  if (props.company) selectedCompany.value = props.company;
  // Cargar historial del tab activo por defecto
  cargarHistorial(props.company);
});
</script>
<style></style>
