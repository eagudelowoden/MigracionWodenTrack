<template>
  <div class="novedades-container-main h-full animate-in fade-in duration-500 flex flex-col gap-2">

    <!-- Toolbar (Vercel compacto) -->
    <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-md border"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

      <div class="flex items-center gap-2">
        <div class="w-7 h-7 bg-[#3B82F6]/10 text-[#3B82F6] rounded-md flex items-center justify-center">
          <i class="fas fa-clipboard-list text-[11px]"></i>
        </div>
        <h2 class="text-[13px] font-semibold tracking-tight" :class="isDark ? 'text-white' : 'text-slate-900'">
          Asistencias
        </h2>
      </div>

      <div class="flex flex-wrap items-center gap-1.5">

        <!-- HOY toggle -->
        <button @click="filterHoy = !filterHoy"
          class="flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] border text-[11px] font-medium transition-all active:scale-[0.98]"
          :class="filterHoy
            ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
            : (isDark
              ? 'bg-[#0B0F19] border-[#222938] text-[#888888] hover:text-white hover:border-[#3B82F6]/40'
              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300')"
          title="Filtrar solo hoy">
          <i class="fas text-[10px]" :class="filterHoy ? 'fa-calendar-check' : 'fa-calendar'"></i>
          Hoy
        </button>

        <!-- Rango de fechas -->
        <div class="flex items-center gap-2 h-7 px-2 rounded-[5px] border transition-all" :class="[
          filterHoy ? 'opacity-40 pointer-events-none' : '',
          isDark ? 'bg-[#0B0F19] border-[#222938]' : 'bg-white border-slate-200'
        ]">
          <input v-model="startDate" type="date"
            class="bg-transparent text-[11px] font-medium outline-none cursor-pointer w-[100px]"
            :class="isDark ? 'text-white' : 'text-slate-700'">
          <div class="w-px h-3" :class="isDark ? 'bg-[#222938]' : 'bg-slate-300'"></div>
          <input v-model="endDate" type="date"
            class="bg-transparent text-[11px] font-medium outline-none cursor-pointer w-[100px]"
            :class="isDark ? 'text-white' : 'text-slate-700'">
        </div>

        <!-- Departamento -->
        <template v-if="hasPerm('admin.filtro_departamento') || hasPerm('admin.ver_todo')">
          <div class="relative">
            <select v-model="selectedDepartment"
              class="h-7 pl-2.5 pr-7 text-[11px] font-medium rounded-[5px] border outline-none appearance-none cursor-pointer w-36 transition-all"
              :class="isDark
                ? 'bg-[#0B0F19] border-[#222938] text-white focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'
                : 'bg-white border-slate-200 text-slate-700 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'">
              <option value="">Todos los departamentos</option>
              <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
            </select>
            <i class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none"
              :class="isDark ? 'text-[#888888]' : 'text-slate-400'"></i>
          </div>
        </template>

        <!-- Search -->
        <div class="relative">
          <i class="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px]"
            :class="isDark ? 'text-[#888888]' : 'text-slate-400'"></i>
          <input v-model="search" type="text" placeholder="Nombre o cédula…" @keyup.enter="modoCrudo ? null : fetchReporte()"
            class="h-7 pl-7 pr-2.5 text-[11px] font-medium rounded-[5px] border outline-none w-44 transition-all"
            :class="isDark
              ? 'bg-[#0B0F19] border-[#222938] text-white placeholder:text-[#5a5a5a] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'
              : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'">
        </div>

        <!-- Acciones -->
        <div class="flex items-center gap-1.5 border-l pl-1.5 ml-0.5"
          :class="isDark ? 'border-[#222938]' : 'border-slate-200'">

          <button @click="clearFilters"
            class="h-7 w-7 rounded-[5px] border flex items-center justify-center transition-all" :class="isDark
              ? 'bg-[#0B0F19] border-[#222938] text-[#888888] hover:text-[#f87171] hover:border-[#dc2626]/40'
              : 'bg-white border-slate-200 text-slate-500 hover:text-[#dc2626] hover:border-rose-300'"
            title="Limpiar filtros">
            <i class="fas fa-filter-circle-xmark text-[10px]"></i>
          </button>

          <button @click="modoCrudo ? fetchCrudoDiagnostico() : fetchReporte()"
            class="h-7 w-7 rounded-[5px] border flex items-center justify-center transition-all" :class="isDark
              ? 'bg-[#0B0F19] border-[#222938] text-[#f5f5f7] hover:text-white hover:border-[#3B82F6]/40'
              : 'bg-white border-slate-200 text-[#1e2538] hover:bg-black hover:text-white hover:border-black'"
            title="Buscar">
            <i class="fas fa-magnifying-glass text-[10px]" :class="{ 'fa-spin': modoCrudo ? loadingCrudo : loading }"></i>
          </button>

          <button @click="downloadReport" :disabled="loading || reportData.length === 0"
            class="flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] border text-[11px] font-medium transition-all active:scale-[0.98] disabled:opacity-50"
            :class="isDark
              ? 'bg-[#0B0F19] border-[#222938] text-[#E2E8F0] hover:bg-white/[0.03] hover:border-[#3B82F6]/40'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'">
            <i :class="loading ? 'fas fa-circle-notch fa-spin' : 'fas fa-file-excel'" class="text-[10px]"></i>
            <span>Excel</span>
          </button>

          <!-- Datos crudos: solo descarga de Odoo, SIN cruces de mallas ni cédulas -->
          <button @click="toggleModoCrudo"
            class="flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] border text-[11px] font-medium transition-all active:scale-[0.98]"
            :class="modoCrudo
              ? 'bg-amber-500 text-white border-amber-500'
              : (isDark
                ? 'bg-[#0B0F19] border-[#222938] text-[#888888] hover:text-white hover:border-amber-500/40'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300')"
            title="Ver datos crudos de Odoo (sin cruces de mallas/cédulas)">
            <i class="fas fa-database text-[10px]"></i>
            <span>Datos crudos</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Error de validación de rango -->
    <div v-if="errorMsg && !modoCrudo" class="px-3 py-2 rounded-md text-[11px] font-medium flex items-center gap-2 border" :class="isDark
      ? 'bg-[#dc2626]/[0.08] border-[#dc2626]/30 text-[#f87171]'
      : 'bg-red-50 border-red-200 text-red-700'">
      <i class="fas fa-circle-exclamation text-[11px]"></i>
      {{ errorMsg }}
    </div>

    <!-- ══ VISTA DE DIAGNÓSTICO: DATOS CRUDOS ═══════════════════════════════ -->
    <div v-if="modoCrudo" class="flex-1 overflow-hidden flex flex-col gap-2">

      <!-- Aviso -->
      <div class="px-3 py-2 rounded-md text-[11px] font-medium flex items-center gap-2 border"
        :class="isDark ? 'bg-amber-500/[0.08] border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'">
        <i class="fas fa-flask text-[11px]"></i>
        Vista de diagnóstico: datos tal cual vienen de Odoo (employee_id directo), SIN emparejar turnos ni cruzar mallas/cédulas.
      </div>

      <div v-if="crudoError" class="px-3 py-2 rounded-md text-[11px] font-medium flex items-center gap-2 border" :class="isDark
        ? 'bg-[#dc2626]/[0.08] border-[#dc2626]/30 text-[#f87171]'
        : 'bg-red-50 border-red-200 text-red-700'">
        <i class="fas fa-circle-exclamation text-[11px]"></i>
        {{ crudoError }}
      </div>

      <!-- Cargando -->
      <div v-if="loadingCrudo" class="flex-1 flex items-center justify-center rounded-md border"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <div class="flex flex-col items-center gap-3 py-20">
          <i class="fas fa-circle-notch fa-spin text-2xl" :class="isDark ? 'text-amber-400' : 'text-amber-500'"></i>
          <span class="text-[11px] font-medium" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            Descargando crudo de Odoo (sin cruces)…
          </span>
        </div>
      </div>

      <template v-else-if="crudoData">
        <!-- Métricas -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div class="px-3 py-2 rounded-md border" :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
            <span class="block text-[9px] uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Asistencias</span>
            <span class="block text-[16px] font-bold tabular-nums" :class="isDark ? 'text-white' : 'text-slate-900'">{{ crudoData.attendancesCount }}</span>
          </div>
          <div class="px-3 py-2 rounded-md border" :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
            <span class="block text-[9px] uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Logs biométrico/app</span>
            <span class="block text-[16px] font-bold tabular-nums" :class="isDark ? 'text-white' : 'text-slate-900'">{{ crudoData.logsCount }}</span>
          </div>
          <div class="px-3 py-2 rounded-md border" :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
            <span class="block text-[9px] uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Tiempo total</span>
            <span class="block text-[16px] font-bold tabular-nums" :class="isDark ? 'text-white' : 'text-slate-900'">{{ (crudoData.tiempoTotalMs / 1000).toFixed(1) }}s</span>
          </div>
          <div class="px-3 py-2 rounded-md border" :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
            <span class="block text-[9px] uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Heap tras descarga</span>
            <span class="block text-[16px] font-bold tabular-nums" :class="isDark ? 'text-white' : 'text-slate-900'">
              {{ crudoData.memoria?.heapMb_tras_descargarLogs ?? '—' }} MB
              <span class="text-[10px] font-normal opacity-60">(inicio {{ crudoData.memoria?.heapMb_inicio }} MB)</span>
            </span>
          </div>
        </div>

        <!-- Sub-tabs -->
        <div class="flex items-center gap-0.5 p-0.5 rounded-md border w-fit"
          :class="isDark ? 'bg-[#0B0F19] border-[#222938]' : 'bg-slate-100 border-slate-200'">
          <button @click="crudoTab = 'attendances'; crudoPage = 1"
            class="h-6 px-2.5 rounded text-[10px] font-semibold transition-all"
            :class="crudoTab === 'attendances' ? 'bg-amber-500 text-white' : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700')">
            hr.attendance ({{ crudoData.attendancesCount }})
          </button>
          <button @click="crudoTab = 'logs'; crudoPage = 1"
            class="h-6 px-2.5 rounded text-[10px] font-semibold transition-all"
            :class="crudoTab === 'logs' ? 'bg-amber-500 text-white' : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700')">
            attendance.log ({{ crudoData.logsCount }})
          </button>
        </div>

        <!-- Tabla cruda -->
        <div class="table-wrapper flex-1 overflow-hidden rounded-md border flex flex-col relative"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
          <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar scroll-smooth">
            <table class="w-full border-separate border-spacing-0">
              <thead class="sticky top-0 z-30">
                <tr class="bg-[#1e2538]">
                  <th class="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">ID Odoo</th>
                  <th class="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">Employee ID</th>
                  <th class="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">Empleado</th>
                  <th class="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">Depto</th>
                  <template v-if="crudoTab === 'attendances'">
                    <th class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">Check in</th>
                    <th class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">Check out</th>
                  </template>
                  <template v-else>
                    <th class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">Punching time</th>
                    <th class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">Status</th>
                    <th class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">Device</th>
                  </template>
                </tr>
              </thead>
              <tbody v-if="!crudoRowsPaginadas.length">
                <tr><td :colspan="crudoTab === 'attendances' ? 6 : 7" class="py-16 text-center">
                  <i class="fas fa-inbox text-2xl mb-2 block" :class="isDark ? 'text-slate-600' : 'text-slate-300'"></i>
                  <span class="text-[11px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Sin registros</span>
                </td></tr>
              </tbody>
              <tbody v-else>
                <tr v-for="(row, i) in crudoRowsPaginadas" :key="row.id"
                  :class="[i % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-transparent']">
                  <td class="px-3 py-2 border-b text-[11px] tabular-nums" :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">{{ row.id }}</td>
                  <td class="px-3 py-2 border-b text-[11px] font-bold tabular-nums" :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{ row.employee_id }}</td>
                  <td class="px-3 py-2 border-b text-[11px] font-semibold" :class="isDark ? 'border-[#222938] text-white' : 'border-slate-100 text-slate-900'">{{ row.empleado }}</td>
                  <td class="px-3 py-2 border-b text-[11px]" :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">{{ row.department_id }}</td>
                  <template v-if="crudoTab === 'attendances'">
                    <td class="px-3 py-2 border-b text-center text-[11px] tabular-nums" :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{ row.check_in || '—' }}</td>
                    <td class="px-3 py-2 border-b text-center text-[11px] tabular-nums" :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{ row.check_out || '—' }}</td>
                  </template>
                  <template v-else>
                    <td class="px-3 py-2 border-b text-center text-[11px] tabular-nums" :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{ row.punching_time || '—' }}</td>
                    <td class="px-3 py-2 border-b text-center text-[11px]" :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{ row.status || '—' }}</td>
                    <td class="px-3 py-2 border-b text-center text-[11px]" :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{ row.device || '—' }}</td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Paginación cruda -->
          <div v-if="crudoRowsActivas.length" class="px-3 py-2 border-t flex items-center justify-between"
            :class="isDark ? 'border-[#222938] bg-[#0B0F19]/40' : 'border-slate-200 bg-slate-50/60'">
            <span class="text-[11px]" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
              <span :class="isDark ? 'text-white font-medium' : 'text-slate-900 font-medium'">{{ crudoRowsActivas.length }}</span>
              registros
            </span>
            <div class="flex items-center gap-1.5">
              <button @click="crudoPage--" :disabled="crudoPage === 1"
                class="w-7 h-7 flex items-center justify-center rounded-[5px] border transition-all disabled:opacity-30"
                :class="isDark ? 'bg-[#161B26] border-[#222938] text-[#E2E8F0]' : 'bg-white border-slate-200 text-slate-700'">
                <i class="fas fa-chevron-left text-[9px]"></i>
              </button>
              <div class="h-7 px-3 flex items-center rounded-[5px] text-[11px] font-medium border"
                :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-900'">
                {{ crudoPage }} / {{ crudoTotalPages }}
              </div>
              <button @click="crudoPage++" :disabled="crudoPage >= crudoTotalPages"
                class="w-7 h-7 flex items-center justify-center rounded-[5px] border transition-all disabled:opacity-30"
                :class="isDark ? 'bg-[#161B26] border-[#222938] text-[#E2E8F0]' : 'bg-white border-slate-200 text-slate-700'">
                <i class="fas fa-chevron-right text-[9px]"></i>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Tabla -->
    <div v-else class="table-wrapper flex-1 overflow-hidden rounded-md border flex flex-col relative"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

      <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar scroll-smooth">
        <table class="w-full border-separate border-spacing-0">
          <thead class="sticky top-0 z-30">
            <!-- Header siempre oscuro (consistente con otros módulos) -->
            <tr class="bg-[#1e2538]">
              <th
                class="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                Colaborador
              </th>
              <th
                class="px-2 py-2.5 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                Identificación
              </th>
              <th
                class="px-2 py-2.5 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                Entrada
              </th>
              <th
                class="px-2 py-2.5 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                Salida
              </th>
              <th
                class="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                Estatus entrada
              </th>
              <th
                class="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                Estatus salida
              </th>
            </tr>
          </thead>

          <!-- Progreso de carga (dentro de la tabla) -->
          <tbody v-if="loading">
            <tr>
              <td colspan="6" class="p-0">
                <!-- Barra de progreso con % real simulado -->
                <div class="w-full h-1 overflow-hidden" :class="isDark ? 'bg-[#222938]' : 'bg-slate-100'">
                  <div class="h-full bg-[#3B82F6] transition-all duration-300 ease-out rounded-r-full"
                    :style="{ width: `${loadingProgress}%` }"></div>
                </div>
                <!-- Spinner + porcentaje -->
                <div class="flex flex-col items-center justify-center gap-3 py-20">
                  <div class="relative">
                    <div class="loading-ring"><div></div><div></div><div></div><div></div></div>
                    <span class="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums"
                      :class="isDark ? 'text-[#60A5FA]' : 'text-[#3B82F6]'">
                      {{ Math.min(99, Math.round(loadingProgress)) }}%
                    </span>
                  </div>
                  <span class="text-[11px] font-medium tracking-wide" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                    Consultando asistencias en Odoo…
                  </span>
                </div>
              </td>
            </tr>
          </tbody>

          <!-- Sin datos -->
          <tbody v-else-if="!paginatedData.length && !loading">
            <tr>
              <td colspan="6" class="py-16 text-center">
                <i class="fas fa-inbox text-2xl mb-2 block" :class="isDark ? 'text-slate-600' : 'text-slate-300'"></i>
                <span class="text-[11px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Sin resultados</span>
              </td>
            </tr>
          </tbody>

          <tbody v-else class="divide-y-0">
            <tr v-for="(item, index) in paginatedData" :key="item.id" class="group transition-all duration-150"
              :class="[
                index % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-transparent',
                isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-white/[0.03]'
              ]">

              <td class="px-4 py-3 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                <div class="flex items-center gap-3">
                  <div
                    class="avatar-mini w-8 h-8 rounded-full bg-slate-500/20 flex items-center justify-center shrink-0">
                    <i class="fas fa-user text-[10px]" :class="isDark ? 'text-slate-300' : 'text-slate-500'"></i>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-[11px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">
                      {{ item.empleado }}
                    </span>
                    <span class="text-[10px] font-normal mt-0.5" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
                      {{ item.department_id || 'Sin departamento' }}
                    </span>
                  </div>
                </div>
              </td>

              <td class="px-4 py-3 text-center border-b font-bold text-[12px]"
                :class="isDark ? 'text-slate-300 border-[#222938]' : 'text-slate-700 border-slate-100'">
                {{ item.cc }}
              </td>

              <td class="px-4 py-3 text-center border-b font-bold text-[12px]"
                :class="isDark ? 'text-slate-300 border-[#222938]' : 'text-slate-700 border-slate-100'">
                {{ formatSoloHora(item.check_in) }}
              </td>

              <td class="px-4 py-3 text-center border-b font-bold text-[12px]"
                :class="isDark ? 'text-slate-300 border-[#222938]' : 'text-slate-700 border-slate-100'">
                {{ formatSoloHora(item.check_out) }}
              </td>

              <td class="px-4 py-3 text-right border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                <div class="flex items-center justify-end gap-1 flex-wrap">
                  <span :class="getStatusClass(item.c_entrada)"
                    class="px-2 py-0.5 rounded text-[9px] font-bold uppercase border tracking-widest bg-opacity-10">
                    {{ item.c_entrada || 'OK' }}
                  </span>
                  <span v-if="item.fuente" :class="getFuenteClass(item.fuente)"
                    class="px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase border tracking-widest">
                    {{ item.fuente === 'BIOMÉTRICO' ? '⬡ BIOMÉTRICO' : '⬡ APP' }}
                  </span>
                </div>
              </td>

              <td class="px-4 py-3 text-right border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                <div class="flex items-center justify-end gap-1 flex-wrap">
                  <span :class="getStatusClass(item.c_salida)"
                    class="px-2 py-0.5 rounded text-[9px] font-bold uppercase border tracking-widest bg-opacity-10">
                    {{ item.c_salida || 'OK' }}
                  </span>
                  <span v-if="item.fuente" :class="getFuenteClass(item.fuente)"
                    class="px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase border tracking-widest">
                    {{ item.fuente === 'BIOMÉTRICO' ? '⬡ BIOMÉTRICO' : '⬡ APP' }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación (Vercel) -->

      <div v-if="paginatedData?.length" class="px-3 py-2 border-t flex items-center justify-between"
        :class="isDark ? 'border-[#222938] bg-[#0B0F19]/40' : 'border-slate-200 bg-slate-50/60'">

        <span class="text-[11px]" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
          <span :class="isDark ? 'text-white font-medium' : 'text-slate-900 font-medium'">{{ reportData.length }}</span>
          {{ reportData.length === 1 ? 'registro' : 'registros' }}
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
  </div>
</template>

<script setup>
import { apiFetch } from '@/utils/apiFetch.js';
import { onMounted, watch, ref, computed } from 'vue';
import { useCargarAsistencias } from '../../composables/UserLogica/cargarAsistencias';
import { useAttendance } from '../../composables/UserLogica/useAttendance';
import '../../assets/css/reporteTabla.css';

const props = defineProps({
  isDark: Boolean,
  company: String
});

const {
  reportData,
  search,
  selectedDepartment,
  startDate,
  endDate,
  departments,
  loading,
  fetchReporte,
  filterHoy,
  downloadReport,
  clearFilters,
  selectedArea,
  selectedSegmento,
  selectedCompany,
  errorMsg,
  chunkProgress,
  loadingProgress,
  crudoData,
  loadingCrudo,
  crudoError,
  fetchCrudoDiagnostico,
} = useCargarAsistencias();

const { isDark: isDarkTheme } = useAttendance();

const session = JSON.parse(localStorage.getItem("user_session") || "{}");
// const esAdmin = session.role === 'admin';
const hasPerm = (permiso) => {
  const permisos = session.permisos || session.permissions || {};
  return permisos[permiso] === true;
};

const esAdmin = computed(() => hasPerm('admin.filtro_departamento') || hasPerm('admin.ver_todo'));
const miDepto = session.department;
const idLogueado = session.id_odoo;
const userProfile = ref(null);
const loadingProfile = ref(true);
const misResponsabilidades = ref([]); // Lista para guardar etiquetas dinámicas

// --- LÓGICA DE PAGINACIÓN ---
const currentPage = ref(1);
const itemsPerPage = ref(15); // Aumentado un poco para aprovechar pantallas grandes

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return reportData.value.slice(start, end);
});
onMounted(async () => {
  const baseUrl = import.meta.env.VITE_API_URL.replace(/\/$/, "");

  // 1. Sincronizar compañía SIN disparar el watch todavía
  if (props.company) {
    selectedCompany.value = props.company;
  }

  // 2. Cargar perfil
  // admin.ver_todo: ve todos los departamentos de su empresa sin restricción de área/segmento
  const tieneVerTodo = session.permisos?.['admin.ver_todo'] === true;
  if (!session.isSuperAdmin && !tieneVerTodo) {
    try {
      const resp = await apiFetch(`${baseUrl}/perfil-completo/${idLogueado}`);
      if (resp.ok) {
        const perfil = await resp.json();
        userProfile.value = perfil;

        // Responsable de segmento → filtrar por segmento (ve TODOS los del segmento).
        // Coordinador con coord.ver_segmento → también ve todo el segmento (sin ser responsable).
        // Responsable de área → filtrar solo por área.
        // Enviar ambos a la vez causaría un AND en el backend, reduciendo los resultados.
        const esResponsableSegmento = session.permisos?.['novedades.ver_segmento'] === true;
        const esCoordSegmento = !esResponsableSegmento && session.permisos?.['coord.ver_segmento'] === true;
        if ((esResponsableSegmento || esCoordSegmento) && perfil.segmento?.id) {
          selectedSegmento.value = perfil.segmento.id;
        } else if (perfil.area?.id) {
          selectedArea.value = perfil.area.id;
        }
      }
    } catch (e) {
      console.error("Error cargando perfil:", e);
    }
  }

  // 3. UNA SOLA llamada al final
  fetchReporte();
});


watch(() => props.company, (newCompany) => {
  if (newCompany && newCompany !== selectedCompany.value) {
    selectedCompany.value = newCompany;
    fetchReporte();
  }
});

const totalPages = computed(() => Math.max(1, Math.ceil(reportData.value.length / itemsPerPage.value)));

// Resetear a pág 1 si cambian los filtros
watch([reportData, search, selectedDepartment, filterHoy, startDate, endDate], () => {
  currentPage.value = 1;
});


const formatSoloHora = (value) => {
  if (!value || value === 'N/A') return '--/--/-- --:--:--';

  try {
    // El valor viene como "2026-03-09 10:09:51"
    const [fecha, hora] = value.split(' ');
    const [anio, mes, dia] = fecha.split('-');
    const [hh, mm, ss] = hora.split(':'); // Extraemos 'ss' (segundos)

    let h = parseInt(hh);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;

    // Retorna: 09-03-2026 10:09:51 AM
    // Usamos padStart en h por si quieres que el 9 aparezca como 09
    const horaFormateada = String(h).padStart(2, '0');

    return `${dia}-${mes}-${anio} ${horaFormateada}:${mm}:${ss} ${ampm}`;
  } catch (e) {
    return value;
  }
}

const getStatusClass = (status) => {
  if (!status || status.toUpperCase() === 'OK')
    return 'bg-[#16a34a]/[0.10] text-[#16a34a] border-[#16a34a]/30 dark:text-[#4ade80]';

  const s = status.toUpperCase();
  if (s.includes('TARDE') || s.includes('INCUMPLIDO'))
    return 'bg-[#dc2626]/[0.10] text-[#dc2626] border-[#dc2626]/30 dark:text-[#f87171]';

  return 'bg-[#3B82F6]/[0.10] text-[#3B82F6] border-[#3B82F6]/30 dark:text-[#60A5FA]';
};

const getFuenteClass = (fuente) => {
  if (!fuente) return '';
  // Estilo Vercel sutil: gris neutro con sutil distinción
  return 'bg-transparent text-[#888888] border-[#222938] dark:border-[#222938]';
};

// ── Vista de diagnóstico: datos crudos (sin cruces de mallas/cédulas) ────────
const modoCrudo = ref(false);
const crudoTab = ref('attendances'); // 'attendances' | 'logs'
const crudoPage = ref(1);
const crudoItemsPerPage = 20;

const toggleModoCrudo = () => {
  modoCrudo.value = !modoCrudo.value;
  if (modoCrudo.value) {
    crudoTab.value = 'attendances';
    crudoPage.value = 1;
    fetchCrudoDiagnostico();
  }
};

// Datos crudos (sin filtrar): lo que trajo el backend para la pestaña activa
const crudoRowsCrudas = computed(() => {
  if (!crudoData.value) return [];
  return crudoTab.value === 'attendances'
    ? (crudoData.value.attendances ?? [])
    : (crudoData.value.logs ?? []);
});

// El buscador de "Nombre o cédula" en modo crudo no tiene cédula (no se
// resuelve a propósito), así que filtra por nombre o employee_id.
const crudoRowsActivas = computed(() => {
  const s = search.value.toLowerCase().trim();
  if (!s) return crudoRowsCrudas.value;
  return crudoRowsCrudas.value.filter((row) =>
    String(row.empleado || '').toLowerCase().includes(s) ||
    String(row.employee_id || '').includes(s),
  );
});

// Filtros que afectan la consulta al backend: si cambian mientras la vista de
// datos crudos está activa, se refresca sola (antes solo cargaba al activar).
watch(
  [startDate, endDate, filterHoy, selectedDepartment, selectedArea, selectedSegmento, selectedCompany],
  () => {
    if (modoCrudo.value) {
      crudoPage.value = 1;
      fetchCrudoDiagnostico();
    }
  },
);

// El buscador (nombre/employee_id) es client-side → solo resetea la página.
watch(search, () => {
  if (modoCrudo.value) crudoPage.value = 1;
});

const crudoTotalPages = computed(() =>
  Math.max(1, Math.ceil(crudoRowsActivas.value.length / crudoItemsPerPage)),
);

const crudoRowsPaginadas = computed(() => {
  const start = (crudoPage.value - 1) * crudoItemsPerPage;
  return crudoRowsActivas.value.slice(start, start + crudoItemsPerPage);
});
</script>

<style scoped>

.loading-ring { display: inline-block; position: relative; width: 36px; height: 36px; }
.loading-ring div {
  box-sizing: border-box; display: block; position: absolute;
  width: 36px; height: 36px;
  border: 3px solid transparent; border-top-color: #3B82F6;
  border-radius: 50%;
  animation: ring-spin 0.9s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}
.loading-ring div:nth-child(1) { animation-delay: -0.3s; }
.loading-ring div:nth-child(2) { animation-delay: -0.2s; border-top-color: #60A5FA; opacity: .6; }
.loading-ring div:nth-child(3) { animation-delay: -0.1s; border-top-color: #93C5FD; opacity: .35; }
.loading-ring div:nth-child(4) { border-top-color: #BFDBFE; opacity: .15; }
@keyframes ring-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>