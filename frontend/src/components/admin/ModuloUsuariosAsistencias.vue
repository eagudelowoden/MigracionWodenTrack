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
        <!-- Pestañas Odoo / Ecuador GPS -->
        <div class="flex items-center gap-0.5 ml-2 p-0.5 rounded-md border"
          :class="isDark ? 'bg-[#0B0F19] border-[#222938]' : 'bg-slate-100 border-slate-200'">
          <button @click="tabActiva = 'odoo'" class="h-5 px-2.5 rounded text-[10px] font-semibold transition-all"
            :class="tabActiva === 'odoo'
              ? 'bg-[#3B82F6] text-white'
              : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700')">
            Odoo
          </button>
          <button v-if="esEcuador" @click="tabActiva = 'ecuador'; cargarMarcacionesEcuador()"
            class="h-5 px-2.5 rounded text-[10px] font-semibold transition-all flex items-center gap-1" :class="tabActiva === 'ecuador'
              ? 'bg-emerald-500 text-white'
              : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700')">
            <i class="fas fa-location-dot text-[8px]"></i> GPS
          </button>
        </div>
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
        <template v-if="hasPerm('admin.filtro_departamento')">
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
          <input v-model="search" type="text" placeholder="Nombre o cédula…" @keyup.enter="fetchReporte"
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

          <button @click="fetchReporte"
            class="h-7 w-7 rounded-[5px] border flex items-center justify-center transition-all" :class="isDark
              ? 'bg-[#0B0F19] border-[#222938] text-[#f5f5f7] hover:text-white hover:border-[#3B82F6]/40'
              : 'bg-white border-slate-200 text-[#1e2538] hover:bg-black hover:text-white hover:border-black'"
            title="Buscar">
            <i class="fas fa-magnifying-glass text-[10px]" :class="{ 'fa-spin': loading }"></i>
          </button>

          <button @click="downloadReport" :disabled="loading || reportData.length === 0"
            class="flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] border text-[11px] font-medium transition-all active:scale-[0.98] disabled:opacity-50"
            :class="isDark
              ? 'bg-[#0B0F19] border-[#222938] text-[#E2E8F0] hover:bg-white/[0.03] hover:border-[#3B82F6]/40'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'">
            <i :class="loading ? 'fas fa-circle-notch fa-spin' : 'fas fa-file-excel'" class="text-[10px]"></i>
            <span>Excel</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Error de validación de rango -->
    <div v-if="errorMsg" class="px-3 py-2 rounded-md text-[11px] font-medium flex items-center gap-2 border" :class="isDark
      ? 'bg-[#dc2626]/[0.08] border-[#dc2626]/30 text-[#f87171]'
      : 'bg-red-50 border-red-200 text-red-700'">
      <i class="fas fa-circle-exclamation text-[11px]"></i>
      {{ errorMsg }}
    </div>

    <!-- Tabla -->
    <div v-if="tabActiva === 'odoo'"
      class="table-wrapper flex-1 overflow-hidden rounded-md border flex flex-col relative"
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
                    <div class="loading-ring">
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                    <span class="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums"
                      :class="isDark ? 'text-[#60A5FA]' : 'text-[#3B82F6]'">
                      {{ Math.min(99, Math.round(loadingProgress)) }}%
                    </span>
                  </div>
                  <span class="text-[11px] font-medium tracking-wide"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">
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
            <tr v-for="(item, index) in paginatedData" :key="item.id" class="group transition-all duration-150" :class="[
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

    <!-- ── TABLA MARCACIONES ECUADOR GPS ─────────────────────────────────── -->
    <div v-if="tabActiva === 'ecuador'"
      class="table-wrapper flex-1 overflow-hidden rounded-md border flex flex-col relative"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

      <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar scroll-smooth">
        <table class="w-full border-separate border-spacing-0">
          <thead class="sticky top-0 z-30">
            <tr class="bg-[#1e2538]">
              <th
                class="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                Colaborador</th>
              <th
                class="px-2 py-2.5 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                Cédula</th>
              <th
                class="px-2 py-2.5 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                Fecha</th>
              <th
                class="px-2 py-2.5 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                Entrada</th>
              <th
                class="px-2 py-2.5 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                Salida</th>
            </tr>
          </thead>

          <tbody v-if="cargandoEcuador">
            <tr>
              <td colspan="5" class="py-16 text-center">
                <div class="loading-ring mx-auto">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
                <span class="block mt-3 text-[11px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Cargando
                  marcaciones…</span>
              </td>
            </tr>
          </tbody>

          <tbody v-else-if="!marcacionesEcuadorAgrupadas.length && !cargandoEcuador">
            <tr>
              <td colspan="5" class="py-16 text-center">
                <i class="fas fa-location-dot text-2xl mb-2 block"
                  :class="isDark ? 'text-slate-600' : 'text-slate-300'"></i>
                <span class="text-[11px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Sin marcaciones
                  Ecuador</span>
              </td>
            </tr>
          </tbody>

          <tbody v-else class="divide-y-0">
            <tr v-for="(m, idx) in marcacionesEcuadorAgrupadas" :key="`${m.cedula}-${m.fecha}`"
              class="group transition-all duration-150" :class="[
                idx % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-transparent',
                isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-white/[0.03]'
              ]">

              <!-- Colaborador -->
              <td class="px-4 py-3 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <i class="fas fa-user text-[10px] text-emerald-500"></i>
                  </div>
                  <span class="text-[11px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ m.nombre
                    }}</span>
                </div>
              </td>

              <!-- Cédula -->
              <td class="px-4 py-3 text-center border-b font-bold text-[12px]"
                :class="isDark ? 'text-slate-300 border-[#222938]' : 'text-slate-700 border-slate-100'">
                {{ m.cedula }}
              </td>

              <!-- Fecha -->
              <td class="px-4 py-3 text-center border-b text-[11px] tabular-nums"
                :class="isDark ? 'text-slate-400 border-[#222938]' : 'text-slate-500 border-slate-100'">
                {{ m.fecha }}
              </td>

              <!-- Entrada -->
              <td class="px-4 py-3 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                <div v-if="m.entrada" class="flex items-center justify-center gap-2">
                  <span class="text-[12px] font-bold tabular-nums text-emerald-500">{{ m.entrada.hora }}</span>
                  <button v-if="m.entrada.latitud && m.entrada.longitud"
                    @click="verEnMapa(m.entrada.latitud, m.entrada.longitud)"
                    class="h-6 px-2 rounded border text-[9px] font-semibold transition-all hover:scale-105" :class="isDark
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'"
                    title="Ver ubicación de entrada en Google Maps">
                    <i class="fas fa-map-location-dot"></i>
                  </button>
                </div>
                <span v-else class="block text-center text-[10px]"
                  :class="isDark ? 'text-slate-600' : 'text-slate-400'">—</span>
              </td>

              <!-- Salida -->
              <td class="px-4 py-3 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                <div v-if="m.salida" class="flex items-center justify-center gap-2">
                  <span class="text-[12px] font-bold tabular-nums text-rose-500">{{ m.salida.hora }}</span>
                  <button v-if="m.salida.latitud && m.salida.longitud"
                    @click="verEnMapa(m.salida.latitud, m.salida.longitud)"
                    class="h-6 px-2 rounded border text-[9px] font-semibold transition-all hover:scale-105" :class="isDark
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                      : 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'"
                    title="Ver ubicación de salida en Google Maps">
                    <i class="fas fa-map-location-dot"></i>
                  </button>
                </div>
                <span v-else class="block text-center text-[10px]"
                  :class="isDark ? 'text-slate-600' : 'text-slate-400'">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer conteo -->
      <div class="px-3 py-2 border-t flex items-center justify-between"
        :class="isDark ? 'border-[#222938] bg-[#0B0F19]/40' : 'border-slate-200 bg-slate-50/60'">
        <span class="text-[11px]" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
          <span :class="isDark ? 'text-white font-medium' : 'text-slate-900 font-medium'">{{
            marcacionesEcuadorAgrupadas.length }}</span>
          {{ marcacionesEcuadorAgrupadas.length === 1 ? 'registro' : 'registros' }} ·
          {{ marcacionesEcuador.length }} marcaciones Ecuador
        </span>
        <button @click="cargarMarcacionesEcuador" :disabled="cargandoEcuador"
          class="flex items-center gap-1 h-6 px-2 rounded text-[10px] font-medium border transition-all disabled:opacity-50"
          :class="isDark ? 'border-[#222938] text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-700'">
          <i class="fas fa-rotate text-[9px]" :class="{ 'fa-spin': cargandoEcuador }"></i>
          Actualizar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { apiFetch } from '@/utils/apiFetch.js';
import axios from 'axios';
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
} = useCargarAsistencias();

const { isDark: isDarkTheme } = useAttendance();

const session = JSON.parse(localStorage.getItem("user_session") || "{}");
// const esAdmin = session.role === 'admin';
const hasPerm = (permiso) => {
  const permisos = session.permisos || session.permissions || {};
  return permisos[permiso] === true;
};

const esAdmin = computed(() => hasPerm('admin.filtro_departamento'));
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
  if (!session.isSuperAdmin) {
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
  return 'bg-transparent text-[#888888] border-[#222938] dark:border-[#222938]';
};

// ── Pestaña Ecuador GPS ────────────────────────────────────────────────────
const tabActiva = ref('odoo');
const esEcuador = computed(() =>
  props.company?.toLowerCase().includes('ecuador') ||
  session.company?.toLowerCase().includes('ecuador')
);

const API_URL = import.meta.env.VITE_API_URL;
const marcacionesEcuador = ref([]);
const cargandoEcuador = ref(false);

const cargarMarcacionesEcuador = async () => {
  cargandoEcuador.value = true;
  try {
    const params = new URLSearchParams();
    params.append('company', props.company || session.company || 'Ecuador');
    if (startDate.value) params.append('startDate', startDate.value);
    if (endDate.value) params.append('endDate', endDate.value);
    if (filterHoy.value) {
      const hoy = new Date().toISOString().slice(0, 10);
      params.set('startDate', hoy);
      params.set('endDate', hoy);
    }
    if (search.value) params.append('cedula', search.value);
    params.append('limit', '1000');
    const { data } = await axios.get(`${API_URL}/marcacion-ecuador/historial?${params}`);
    marcacionesEcuador.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Error cargando marcaciones Ecuador:', e);
    marcacionesEcuador.value = [];
  } finally {
    cargandoEcuador.value = false;
  }
};

const verEnMapa = (latitud, longitud) => {
  if (!latitud || !longitud) return;
  window.open(`https://www.google.com/maps?q=${latitud},${longitud}&z=17`, '_blank');
};

// Agrupa las marcaciones por empleado+fecha: cada fila = un día con su entrada y salida
const marcacionesEcuadorAgrupadas = computed(() => {
  const mapa = new Map();
  for (const m of marcacionesEcuador.value) {
    // Usar id_odoo como clave principal; si no hay, caer en nombre normalizado
    const empKey = m.id_odoo || m.nombre?.toLowerCase().trim() || m.cedula || 'unknown';
    const key = `${empKey}__${m.fecha}`;
    if (!mapa.has(key)) {
      mapa.set(key, {
        cedula: m.cedula || '',
        nombre: m.nombre || '',
        fecha: m.fecha,
        company: m.company,
        entrada: null,
        salida: null,
      });
    }
    const fila = mapa.get(key);
    // Si este registro tiene más datos que el que ya guardamos, actualizar
    if (m.cedula && !fila.cedula) fila.cedula = m.cedula;
    if (m.nombre && !fila.nombre) fila.nombre = m.nombre;
    // Guarda el de hora más temprana para entrada y más tardía para salida
    if (m.tipo === 'entrada') {
      if (!fila.entrada || m.hora < fila.entrada.hora) fila.entrada = m;
    } else {
      if (!fila.salida || m.hora > fila.salida.hora) fila.salida = m;
    }
  }
  // Ordenar por fecha desc, luego nombre
  return [...mapa.values()].sort((a, b) =>
    b.fecha.localeCompare(a.fecha) || a.nombre.localeCompare(b.nombre)
  );
});
</script>

<style scoped>
.loading-ring {
  display: inline-block;
  position: relative;
  width: 36px;
  height: 36px;
}

.loading-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 36px;
  height: 36px;
  border: 3px solid transparent;
  border-top-color: #3B82F6;
  border-radius: 50%;
  animation: ring-spin 0.9s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.loading-ring div:nth-child(1) {
  animation-delay: -0.3s;
}

.loading-ring div:nth-child(2) {
  animation-delay: -0.2s;
  border-top-color: #60A5FA;
  opacity: .6;
}

.loading-ring div:nth-child(3) {
  animation-delay: -0.1s;
  border-top-color: #93C5FD;
  opacity: .35;
}

.loading-ring div:nth-child(4) {
  border-top-color: #BFDBFE;
  opacity: .15;
}

@keyframes ring-spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>