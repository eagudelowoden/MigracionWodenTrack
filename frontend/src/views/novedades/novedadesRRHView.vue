<template>
  <div class="w-full h-full animate-fade-in transition-all duration-500 flex flex-col gap-1.5">

    <!-- Header compacto: título + filtros + acciones en una sola barra -->
    <div class="flex items-center gap-2 px-3 py-2 rounded-md border shrink-0"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

      <!-- Título -->
      <div class="flex items-center gap-2 shrink-0">
        <div class="w-6 h-6 flex items-center justify-center rounded-lg bg-[#3B82F6] text-white shrink-0">
          <i class="fas fa-user-check text-[10px]"></i>
        </div>
        <div>
          <h2 class="text-sm font-semibold uppercase tracking-tight leading-none"
            :class="isDark ? 'text-white' : 'text-slate-800'">
            Gestión <span class="text-[#3B82F6]">Capital Humano</span>
          </h2>
          <p class="text-[8px] font-semibold opacity-40 uppercase tracking-[0.15em] mt-0.5"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Revisión de Novedades</p>
        </div>
      </div>

      <!-- Búsqueda nombre (flex-1) -->
      <div
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border w-44 transition-all focus-within:ring-1 focus-within:ring-[#3B82F6]/30"
        :class="isDark ? 'border-[#222938] bg-[#161B26]' : 'border-slate-200 bg-slate-50'">
        <i class="fas fa-magnifying-glass text-[#3B82F6] text-[9px] shrink-0"></i>
        <input v-model="filters.nombre" type="text" placeholder="Buscar por nombre..."
          class="bg-transparent text-[11px] font-medium outline-none w-full placeholder:text-slate-400"
          :class="isDark ? 'text-white' : 'text-slate-700'" />
        <button v-if="filters.nombre" @click="filters.nombre = ''"
          class="opacity-40 hover:opacity-80 transition-opacity shrink-0">
          <i class="fas fa-xmark text-[9px]" :class="isDark ? 'text-slate-300' : 'text-slate-600'"></i>
        </button>
      </div>

      <!-- Departamento -->
      <div class="relative shrink-0">
        <div
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all focus-within:ring-1 focus-within:ring-[#3B82F6]/30"
          :class="isDark ? 'border-[#222938] bg-[#161B26]' : 'border-slate-200 bg-slate-50'">
          <i class="fas fa-building text-[#3B82F6] text-[9px]"></i>
          <input v-model="filters.departamento" type="text" placeholder="Depto..."
            class="bg-transparent text-[11px] font-medium outline-none w-24 placeholder:text-slate-400"
            :class="isDark ? 'text-white' : 'text-slate-700'" @focus="showDeptList = true"
            @blur="setTimeout(() => showDeptList = false, 150)" />
          <button v-if="filters.departamento" @click="filters.departamento = ''"
            class="opacity-40 hover:opacity-80 shrink-0">
            <i class="fas fa-xmark text-[9px]" :class="isDark ? 'text-slate-300' : 'text-slate-600'"></i>
          </button>
        </div>
        <div v-if="showDeptList && deptSuggestions.length"
          class="absolute top-full left-0 mt-1 z-50 w-52 rounded-md border overflow-hidden"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
          <button v-for="s in deptSuggestions" :key="s"
            @mousedown.prevent="filters.departamento = s; showDeptList = false"
            class="w-full text-left px-3 py-2 text-[10px] font-bold transition-colors hover:bg-[#3B82F6]/10"
            :class="isDark ? 'text-slate-200' : 'text-slate-700'">{{ s }}</button>
        </div>
      </div>

      <!-- Fechas compacto -->
      <div class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border shrink-0"
        :class="isDark ? 'border-[#222938] bg-[#161B26]' : 'border-slate-200 bg-slate-50'">
        <i class="fas fa-calendar-day text-[#3B82F6] text-[9px]"></i>
        <input type="date" v-model="filters.fechaInicio"
          class="bg-transparent text-[10px] font-semibold outline-none cursor-pointer"
          :class="isDark ? 'text-white [color-scheme:dark]' : 'text-slate-700'" />
        <span class="text-[9px] opacity-30">—</span>
        <input type="date" v-model="filters.fechaFin"
          class="bg-transparent text-[10px] font-semibold outline-none cursor-pointer"
          :class="isDark ? 'text-white [color-scheme:dark]' : 'text-slate-700'" />
      </div>

      <!-- Reset -->
      <button @click="resetFilters"
        class="w-7 h-7 flex items-center justify-center rounded-lg border transition-colors hover:text-[#3B82F6] shrink-0"
        :class="isDark ? 'border-[#222938] bg-[#161B26] text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'">
        <i class="fas fa-rotate-left text-[9px]" :class="{ 'fa-spin': loading }"></i>
      </button>

      <!-- Dropdown Estado (Vercel-style) -->
      <div class="relative shrink-0">
        <button @click="showEstadoDropdown = !showEstadoDropdown"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-all"
          :class="isDark ? 'border-[#222938] bg-[#161B26] text-slate-300 hover:border-[#3B82F6]/40' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400'">
          <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ background: currentTabOption.color }"></span>
          {{ currentTabOption.label }}
          <span class="text-[8px] opacity-50 font-normal tabular-nums">({{ getOptCount(tabEstado) }})</span>
          <i class="fas fa-chevron-down text-[7px] opacity-40 ml-0.5" :class="{ 'rotate-180': showEstadoDropdown }"></i>
        </button>

        <div v-if="showEstadoDropdown"
          class="absolute top-full right-0 mt-1 z-50 w-44 rounded-md border overflow-hidden"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200 shadow-sm'">
          <button v-for="opt in ESTADO_OPTIONS" :key="opt.value"
            @click="tabEstado = opt.value; showEstadoDropdown = false"
            class="w-full flex items-center justify-between px-3 py-2 text-[10px] font-medium transition-colors"
            :class="tabEstado === opt.value
              ? (isDark ? 'bg-white/[0.07] text-white' : 'bg-slate-100 text-slate-900')
              : (isDark ? 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ background: opt.color }"></span>
              {{ opt.label }}
            </div>
            <span class="text-[8px] opacity-40 tabular-nums">{{ getOptCount(opt.value) }}</span>
          </button>
        </div>
      </div>

      <!-- Botón carpetas -->
      <button @click="modalEstados.open = true"
        class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[9px] font-semibold uppercase tracking-wide transition-all hover:brightness-110 active:scale-[0.98] shrink-0"
        :class="isDark ? 'bg-[#161B26] border-[#222938] text-[#3B82F6]' : 'bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#3B82F6]'">
        <i class="fas fa-folder-open text-[9px]"></i> Carpetas
      </button>
    </div>

    <!-- Backdrop dropdown estado -->
    <teleport to="body">
      <div v-if="showEstadoDropdown" class="fixed inset-0 z-40" @click="showEstadoDropdown = false"></div>
    </teleport>

    <!-- Tabla -->
    <div class="flex-1 flex flex-col w-full overflow-hidden rounded-md border transition-all duration-500"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200 shadow-slate-100'">

      <div v-if="loading" class="flex-1 flex items-center justify-center gap-3">
        <i class="fas fa-circle-notch fa-spin text-[#3B82F6]"></i>
        <span class="text-[11px] font-semibold uppercase tracking-wide"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cargando novedades...</span>
      </div>

      <div v-else-if="error" class="flex-1 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3 opacity-70">
          <i class="fas fa-exclamation-triangle text-red-400 text-2xl"></i>
          <p class="text-[11px] font-bold text-red-400">Error al cargar los registros</p>
          <button @click="fetchNovedades"
            class="px-4 py-2 rounded-lg text-[9px] font-semibold uppercase bg-[#3B82F6] text-white">
            Reintentar
          </button>
        </div>
      </div>

      <!-- Vista Mis Carpetas CH (acordeón) -->
      <div v-else-if="tabEstado === 'carpetas'" class="flex-1 flex flex-col overflow-hidden">
        <div v-if="!estadosCh.length" class="flex-1 flex items-center justify-center">
          <div class="flex flex-col items-center gap-3 opacity-40">
            <i class="fas fa-folder-plus text-3xl text-[#3B82F6]"></i>
            <p class="text-[11px] font-semibold uppercase tracking-wide text-center"
              :class="isDark ? 'text-slate-400' : 'text-slate-500'">
              No hay carpetas. Créalas con "Estados".
            </p>
          </div>
        </div>
        <div v-else class="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5">
          <div v-for="carpeta in novedadesPorCarpetaCh" :key="carpeta.id" class="rounded-lg border overflow-hidden"
            :class="isDark ? 'border-[#222938]' : 'border-slate-200'">

            <!-- Cabecera clicable -->
            <button @click="toggleCarpetaCh(carpeta.id)"
              class="w-full flex items-center justify-between px-3 py-2 transition-colors"
              :class="isDark ? 'bg-[#161B26] hover:bg-[#2d3a50]' : 'bg-slate-50 hover:bg-slate-100'">
              <div class="flex items-center gap-2">
                <i :class="carpeta.icono" :style="{ color: carpeta.color }" class="text-xs w-3.5 text-center"></i>
                <span class="text-[10px] font-semibold uppercase tracking-wide" :style="{ color: carpeta.color }">
                  {{ carpeta.nombre }}
                </span>
                <span class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[7px] font-semibold"
                  :style="{ color: carpeta.color, background: carpeta.color + '20' }">
                  {{ carpeta.items.length }}
                </span>
                <span v-if="!carpeta.items.length" class="text-[8px] opacity-30"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Vacía</span>
              </div>
              <i class="fas text-[9px] transition-transform duration-200" :class="[carpetasAbiertasCh.has(carpeta.id) ? 'fa-chevron-up' : 'fa-chevron-down',
              isDark ? 'text-slate-500' : 'text-slate-400']"></i>
            </button>

            <!-- Contenido desplegable -->
            <div v-if="carpetasAbiertasCh.has(carpeta.id)">
              <div v-if="!carpeta.items.length" class="px-3 py-2.5 text-center border-t"
                :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                <p class="text-[9px] opacity-30" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                  Sin novedades
                </p>
              </div>
              <div v-else class="overflow-x-auto border-t" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                <table class="w-full border-separate border-spacing-0">
                  <thead>
                    <tr :class="isDark ? 'bg-[#1a2035]' : 'bg-white'">
                      <th class="px-3 py-1.5 text-left text-[7px] font-semibold uppercase tracking-wide"
                        :class="isDark ? 'text-slate-500' : 'text-slate-400'">Colaborador</th>
                      <th class="px-3 py-1.5 text-center text-[7px] font-semibold uppercase tracking-wide"
                        :class="isDark ? 'text-slate-500' : 'text-slate-400'">Inicio</th>
                      <th class="px-3 py-1.5 text-center text-[7px] font-semibold uppercase tracking-wide"
                        :class="isDark ? 'text-slate-500' : 'text-slate-400'">Fin</th>

                      <th class="px-3 py-1.5 text-center text-[7px] font-semibold uppercase tracking-wide"
                        :class="isDark ? 'text-slate-500' : 'text-slate-400'">Estado</th>
                      <th class="px-3 py-1.5 text-right text-[7px] font-semibold uppercase tracking-wide"
                        :class="isDark ? 'text-slate-500' : 'text-slate-400'">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(nov, idx) in carpeta.items" :key="'ch-' + nov.id" :class="[idx % 2 !== 0 ? (isDark ? 'bg-white/[0.02]' : 'bg-slate-50/60') : 'bg-transparent',
                    isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-white/[0.03]/50']">
                      <td class="px-3 py-2 border-t" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                        <div class="flex items-center gap-1.5">
                          <div
                            class="w-5 h-5 rounded-md bg-[#3B82F6]/10 flex items-center justify-center text-[8px] font-semibold text-[#3B82F6] shrink-0">
                            {{ nov.nombre?.charAt(0) ?? '?' }}
                          </div>
                          <div>
                            <p class="text-[9px] font-semibold uppercase"
                              :class="isDark ? 'text-white' : 'text-slate-800'">{{ nov.nombre }}</p>
                            <p class="text-[8px] opacity-40">{{ nov.cedula }}</p>
                          </div>
                        </div>
                      </td>
                      <td class="px-3 py-2 text-center border-t"
                        :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                        <span class="text-[9px] font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{
                          formatFecha(nov.fechaInicio ?? nov.fecha_inicio) }}</span>
                      </td>
                      <td class="px-3 py-2 text-center border-t"
                        :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                        <span class="text-[9px] font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{
                          formatFecha(nov.fechaFin ?? nov.fecha_fin) }}</span>
                      </td>
                      <td class="px-3 py-2 border-t max-w-[180px]"
                        :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                        <div class="flex items-center gap-1.5">
                          <p class="text-[9px] font-medium line-clamp-1 flex-1"
                            :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ nov.descripcion }}</p>
                          <span v-if="nov.descripcion" @click="verMotivo(nov.descripcion, 'Descripción')"
                            class="cursor-pointer text-[#3B82F6] hover:text-[#3B82F6]/70 shrink-0">
                            <i class="fas fa-eye text-[9px]"></i>
                          </span>
                        </div>
                      </td>
                      <td class="px-3 py-2 text-center border-t"
                        :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                        <span
                          class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] font-semibold uppercase tracking-wide border"
                          :class="getEstadoVisual(nov).bg">
                          <i :class="getEstadoVisual(nov).icon" :style="{ color: getEstadoVisual(nov).color }"></i>
                          <span :style="{ color: getEstadoVisual(nov).color }">{{ getEstadoVisual(nov).label }}</span>
                        </span>
                      </td>
                      <td class="px-3 py-2 text-right border-t"
                        :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                        <div class="flex items-center justify-end gap-1">
                          <button @click="verSoporte(nov.id)"
                            class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[7px] font-semibold uppercase tracking-wide transition-all hover:brightness-110"
                            :class="isDark ? 'bg-[#161B26] text-slate-300 border-[#3d4558]' : 'bg-slate-100 text-slate-600 border-slate-200'">
                            <i class="fas fa-eye text-[7px]"></i> Soporte
                          </button>
                          <button @click="abrirSelectorCh(nov)"
                            class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[7px] font-semibold uppercase tracking-wide transition-all hover:brightness-110"
                            :class="isDark ? 'bg-[#161B26] text-[#3B82F6] border-[#3d4558]' : 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30'">
                            <i class="fas fa-folder-open text-[7px]"></i> Mover
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="px-4 py-1.5 border-t shrink-0"
          :class="isDark ? 'border-[#222938] bg-[#161B26]' : 'border-slate-100 bg-slate-50'">
          <p class="text-[9px] font-semibold uppercase tracking-wide"
            :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            Carpetas: <span class="text-[#3B82F6]">{{ estadosCh.length }}</span>
            &nbsp;·&nbsp; Novedades asignadas: <span :class="isDark ? 'text-white' : 'text-slate-800'">{{
              novedadesEnCarpetaCh }}</span>
          </p>
        </div>
      </div>

      <div v-else-if="novedadesFiltradas.length === 0" class="flex-1 flex items-center justify-center">
        <div class="flex flex-col items-center gap-2 opacity-50">
          <i class="fas fa-folder-open text-3xl" :class="isDark ? 'text-slate-500' : 'text-slate-300'"
            style="color:#3B82F6"></i>
          <p class="text-[11px] font-semibold uppercase tracking-wide"
            :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            {{ mensajeVacio }}
          </p>
        </div>
      </div>

      <!-- Tabla desktop -->
      <div v-else class="hidden md:flex flex-col flex-1 overflow-hidden">
        <div class="flex-1 overflow-y-auto overflow-x-auto">
          <table class="w-full border-separate border-spacing-0">
            <thead class="sticky top-0 z-10">
              <tr class="bg-[#334155]">
                <th
                  class="px-4 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">
                  Colaborador</th>
                <th
                  class="px-4 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">
                  Inicio</th>
                <th
                  class="px-4 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">
                  Fin</th>
                <th
                  class="px-4 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">
                  Días</th>
                <th
                  class="px-4 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">
                  Descripción</th>
                <th
                  class="px-4 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">
                  Tipificación</th>
                <!-- Estado CH personalizado -->
                <th
                  class="px-4 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">
                  Carpeta CH</th>
                <th
                  class="px-4 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">
                  Est. Jefe</th>
                <th
                  class="px-4 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">
                  Mot. Jefe</th>
                <th
                  class="px-4 py-2.5 text-right text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">
                  Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in novedadesFiltradas" :key="item.id" @click="abrirDetalle(item)"
                class="group transition-all duration-150 cursor-pointer" :class="[
                  idx % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-transparent',
                  isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-blue-50/60'
                ]">

                <!-- Colaborador -->
                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <div class="flex items-center gap-2.5">
                    <div
                      class="w-7 h-7 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center text-[10px] font-semibold text-[#3B82F6] shrink-0">
                      {{ item.nombre?.charAt(0) ?? '?' }}
                    </div>
                    <div class="flex flex-col">
                      <span class="text-[11px] font-bold uppercase tracking-tight"
                        :class="isDark ? 'text-white' : 'text-slate-900'" v-html="highlight(item.nombre)"></span>
                      <span class="text-[9px] font-medium opacity-50">CC: {{ item.cedula }}</span>
                    </div>
                  </div>
                </td>

                <!-- Fechas -->
                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <span class="text-[11px] font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                    {{ formatFecha(item.fechaInicio ?? item.fecha_inicio) }}
                  </span>
                </td>
                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <span class="text-[11px] font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                    {{ formatFecha(item.fechaFin ?? item.fecha_fin) }}
                  </span>
                </td>

                <!-- Días -->
                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <span class="text-[12px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">
                    {{ calcDias(item.fechaInicio ?? item.fecha_inicio, item.fechaFin ?? item.fecha_fin) }}
                  </span>
                </td>

                <!-- Descripción -->
                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <div class="flex items-center gap-2 max-w-[200px]">
                    <p class="text-[11px] font-medium line-clamp-1 flex-1"
                      :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                      {{ item.descripcion }}
                    </p>
                    <span v-if="item.descripcion" @click.stop="verMotivo(item.descripcion, 'Descripción')"
                      class="cursor-pointer text-[#3B82F6] hover:text-[#3B82F6]/70 shrink-0">
                      <i class="fas fa-eye text-[12px]"></i>
                    </span>
                  </div>
                </td>

                <!-- Tipificación -->
                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <p class="text-[11px] font-medium line-clamp-2 max-w-[140px]"
                    :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                    {{ item.tipificacion || '—' }}
                  </p>
                </td>

                <!-- Carpeta CH (estado personalizado) -->
                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'"
                  @click.stop>
                  <div class="relative flex items-center justify-center gap-1">
                    <!-- Badge del estado CH actual -->
                    <span v-if="item.estadoCh"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-semibold uppercase tracking-wide border border-current/20 bg-current/10 cursor-pointer hover:brightness-110"
                      :style="{ color: getColorEstadoCh(item.estadoCh) }" @click="abrirSelectorCh(item)">
                      <i :class="getIconEstadoCh(item.estadoCh)"></i>
                      {{ item.estadoCh }}
                    </span>
                    <button v-else @click="abrirSelectorCh(item)"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-semibold uppercase tracking-wide border transition-all hover:border-[#3B82F6]/40 hover:text-[#3B82F6]"
                      :class="isDark ? 'border-[#3d4558] text-slate-500' : 'border-slate-200 text-slate-400'">
                      <i class="fas fa-folder-plus text-[8px]"></i> Asignar
                    </button>
                  </div>
                </td>

                <!-- Estado jefe badge -->
                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <span class="px-2 py-0.5 rounded-md text-[8px] uppercase tracking-wide border font-semibold"
                    :class="item.aprobadoJefe === 1
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : item.aprobadoJefe === 0
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : (isDark ? 'bg-[#2d3548] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-400 border-slate-200')">
                    <i :class="item.aprobadoJefe === 1 ? 'fas fa-check' : item.aprobadoJefe === 0 ? 'fas fa-xmark' : 'fas fa-clock'"
                      class="mr-1"></i>
                    {{ item.aprobadoJefe === 1 ? 'Aprobado' : item.aprobadoJefe === 0 ? 'Rechazado' : 'Pendiente' }}
                  </span>
                </td>

                <!-- Motivo jefe -->
                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <span v-if="item.motivoJefe" @click.stop="verMotivo(item.motivoJefe, 'Motivo Jefe Directo')"
                    class="cursor-pointer text-[12px] font-bold text-[#3B82F6] hover:underline">
                    <i class="fas fa-comment-alt mr-1"></i>Ver
                  </span>
                  <span v-else class="text-[11px] opacity-30">—</span>
                </td>

                <!-- Acciones -->
                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'" @click.stop>
                  <div class="flex items-center justify-end gap-2">
                    <!-- Badge estado RRHH -->
                    <span class="px-2 py-0.5 rounded-md text-[8px] uppercase tracking-wide border font-semibold"
                      :class="item.aprobadoRrhh === 1
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : item.aprobadoRrhh === 0
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : (isDark ? 'bg-[#2d3548] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-400 border-slate-200')">
                      <i :class="item.aprobadoRrhh === 1 ? 'fas fa-check' : item.aprobadoRrhh === 0 ? 'fas fa-xmark' : 'fas fa-clock'"
                        class="mr-1"></i>
                      {{ item.aprobadoRrhh === 1 ? 'Aprobada' : item.aprobadoRrhh === 0 ? 'Rechazada' : 'Pendiente' }}
                    </span>
                    <!-- Botón ⋮ -->
                    <button @click.stop="toggleMenu($event, item.id)"
                      class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all active:scale-[0.98]"
                      :class="isDark ? 'bg-[#161B26] border-[#222938] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'">
                      <i class="fas fa-ellipsis-vertical text-[10px]"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="px-4 py-1.5 border-t shrink-0 flex items-center justify-between"
          :class="isDark ? 'border-[#222938] bg-[#161B26]' : 'border-slate-100 bg-slate-50'">
          <p class="text-[9px] font-semibold uppercase tracking-wide"
            :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            Resultados: <span :class="isDark ? 'text-white' : 'text-slate-800'">{{ novedadesFiltradas.length }}</span>
          </p>
          <p class="text-[9px] font-bold opacity-40" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            Total: {{ novedades.length }}
          </p>
        </div>
      </div>

      <!-- Mobile -->
      <div v-if="!loading && !error && novedadesFiltradas.length > 0" class="md:hidden flex-1 overflow-y-auto divide-y"
        :class="isDark ? 'divide-[#2d3548]' : 'divide-slate-100'">
        <div v-for="item in novedadesFiltradas" :key="'mob-' + item.id" class="p-3 space-y-2">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2.5">
              <div
                class="w-7 h-7 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center text-[10px] font-semibold text-[#3B82F6]">
                {{ item.nombre?.charAt(0) ?? '?' }}
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] font-semibold uppercase tracking-tight"
                  :class="isDark ? 'text-white' : 'text-slate-800'">{{ item.nombre }}</span>
                <span class="text-[9px] opacity-50">CC: {{ item.cedula }}</span>
              </div>
            </div>
            <!-- Estado carpeta -->
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-semibold uppercase border"
              :class="getEstadoVisual(item).bg">
              <i :class="getEstadoVisual(item).icon" :style="{ color: getEstadoVisual(item).color }"></i>
              <span :style="{ color: getEstadoVisual(item).color }">{{ getEstadoVisual(item).label }}</span>
            </span>
          </div>
          <p class="text-[10px] opacity-60 line-clamp-2" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{
            item.descripcion }}</p>
          <button @click="verSoporte(item.id)"
            class="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-semibold uppercase italic tracking-wide shadow-md"
            :class="isDark ? 'bg-[#3B82F6] text-white' : 'bg-[#161B26] text-white'">
            <i class="fas fa-eye"></i> Ver Soporte
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════
         MODAL: Gestión de estados CH personalizados
    ══════════════════════════════════════════════════════════════════ -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="modalEstados.open" class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: rgba(0,0,0,0.7)" @click.self="modalEstados.open = false">

          <div class="w-full max-w-md rounded-md border overflow-hidden"
            :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

            <!-- Header -->
            <div class="flex items-center justify-between px-5 py-3.5 border-b"
              :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
              <div class="flex items-center gap-2">
                <i class="fas fa-folder-plus text-[#3B82F6]"></i>
                <h3 class="text-sm font-semibold uppercase tracking-wide"
                  :class="isDark ? 'text-white' : 'text-slate-800'">
                  Mis estados CH
                </h3>
              </div>
              <button @click="modalEstados.open = false"
                class="w-7 h-7 rounded-lg flex items-center justify-center border"
                :class="isDark ? 'bg-[#161B26] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-500 border-slate-200'">
                <i class="fas fa-xmark text-xs"></i>
              </button>
            </div>

            <!-- Formulario crear / editar carpeta -->
            <div class="px-5 py-4 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
              <p class="text-[9px] font-semibold uppercase tracking-wide mb-3"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                {{ editandoEstado ? '✏️ Editando carpeta' : 'Nueva carpeta' }}
              </p>
              <div class="flex gap-2">
                <!-- Nombre -->
                <input v-model="nuevoEstado.nombre" type="text" placeholder="Nombre de la carpeta..."
                  class="flex-1 px-3 py-2 rounded-lg border text-[11px] font-bold outline-none transition-all focus:ring-1 focus:ring-[#3B82F6]/40"
                  :class="isDark ? 'bg-[#161B26] border-[#222938] text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-800'"
                  @keyup.enter="guardarEstadoCh" />
                <!-- Color -->
                <input type="color" v-model="nuevoEstado.color"
                  class="w-9 h-9 rounded-lg border cursor-pointer p-0.5 shrink-0"
                  :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'" title="Color" />
                <!-- Icono -->
                <select v-model="nuevoEstado.icono"
                  class="px-2 py-2 rounded-lg border text-[10px] font-bold outline-none shrink-0"
                  :class="isDark ? 'bg-[#161B26] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-700'">
                  <option value="fas fa-folder">📁 Carpeta</option>
                  <option value="fas fa-box-archive">📦 Archivo</option>
                  <option value="fas fa-clock">⏰ Espera</option>
                  <option value="fas fa-paper-plane">✉️ Enviado</option>
                  <option value="fas fa-check-circle">✅ Check</option>
                  <option value="fas fa-times-circle">❌ X</option>
                  <option value="fas fa-bookmark">🔖 Marca</option>
                  <option value="fas fa-star">⭐ Estrella</option>
                  <option value="fas fa-flag">🚩 Bandera</option>
                  <option value="fas fa-tag">🏷️ Etiqueta</option>
                </select>
                <!-- Guardar -->
                <button @click="guardarEstadoCh" :disabled="!nuevoEstado.nombre.trim() || loadingEstado"
                  class="px-3 py-2 rounded-lg text-[10px] font-semibold uppercase italic tracking-wide transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  :class="editandoEstado ? 'bg-emerald-500 text-white' : 'bg-[#3B82F6] text-white'">
                  <i v-if="loadingEstado" class="fas fa-circle-notch fa-spin text-[9px]"></i>
                  <i v-else :class="editandoEstado ? 'fas fa-check' : 'fas fa-plus'" class="text-[9px]"></i>
                </button>
                <!-- Cancelar edición -->
                <button v-if="editandoEstado" @click="cancelarEdicion"
                  class="px-2 py-2 rounded-lg border text-[10px] font-semibold transition-all"
                  :class="isDark ? 'border-[#222938] text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'">
                  <i class="fas fa-xmark text-[9px]"></i>
                </button>
              </div>

              <!-- Preview -->
              <div v-if="nuevoEstado.nombre.trim()" class="mt-2 flex items-center gap-1.5">
                <span class="text-[9px] opacity-50" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Vista
                  previa:</span>
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-semibold uppercase tracking-wide border border-current/20 bg-current/10"
                  :style="{ color: nuevoEstado.color }">
                  <i :class="nuevoEstado.icono"></i>
                  {{ nuevoEstado.nombre }}
                </span>
              </div>

              <p v-if="errorEstado" class="mt-2 text-[10px] text-red-400 font-bold">
                <i class="fas fa-exclamation-circle mr-1"></i>{{ errorEstado }}
              </p>
            </div>

            <!-- Lista de carpetas existentes -->
            <div class="px-5 py-3 max-h-64 overflow-y-auto">
              <p class="text-[9px] font-semibold uppercase tracking-wide mb-2"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                Carpetas Capital Humano ({{ estadosCh.length }})
              </p>
              <div v-if="!estadosCh.length" class="text-[11px] opacity-40 text-center py-4"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                No hay carpetas aún.
              </div>
              <div v-else class="flex flex-col gap-1.5">
                <div v-for="est in estadosCh" :key="est.id"
                  class="flex items-center justify-between px-3 py-2 rounded-lg border transition-all" :class="[isDark ? 'bg-[#161B26] border-[#3d4558]' : 'bg-slate-50 border-slate-200',
                  editandoEstado?.id === est.id ? 'ring-1 ring-[#3B82F6]' : '']">
                  <div class="flex items-center gap-2">
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-semibold uppercase tracking-wide border border-current/20 bg-current/10"
                      :style="{ color: est.color }">
                      <i :class="est.icono"></i>
                      {{ est.nombre }}
                    </span>
                    <span class="text-[9px] opacity-40" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                      {{novedades.filter(n => n.estadoCh === est.nombre).length}} nov.
                    </span>
                  </div>
                  <div class="flex items-center gap-1">
                    <!-- Editar -->
                    <button @click="iniciarEdicionEstado(est)"
                      class="w-6 h-6 rounded-lg flex items-center justify-center border text-[9px] transition-all hover:bg-[#3B82F6]/10 hover:text-[#3B82F6] hover:border-[#3B82F6]/30"
                      :class="isDark ? 'border-[#3d4558] text-slate-500' : 'border-slate-200 text-slate-400'">
                      <i class="fas fa-pen-to-square"></i>
                    </button>
                    <!-- Eliminar -->
                    <button @click="confirmarEliminarEstado(est)"
                      class="w-6 h-6 rounded-lg flex items-center justify-center border text-[9px] transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                      :class="isDark ? 'border-[#3d4558] text-slate-500' : 'border-slate-200 text-slate-400'">
                      <i class="fas fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- Modal selector estado CH (para asignar a una novedad) -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="selectorCh.open" class="fixed inset-0 z-[60] flex items-center justify-center"
          style="background: rgba(0,0,0,0.6)" @click.self="selectorCh.open = false">

          <div class="w-full max-w-xs rounded-md border overflow-hidden"
            :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

            <div class="flex items-center justify-between px-4 py-3 border-b"
              :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
              <span class="text-[11px] font-semibold uppercase tracking-wide"
                :class="isDark ? 'text-white' : 'text-slate-700'">
                <i class="fas fa-folder-open text-[#3B82F6] mr-2"></i>Asignar estado
              </span>
              <button @click="selectorCh.open = false"
                class="w-6 h-6 rounded-lg flex items-center justify-center border"
                :class="isDark ? 'bg-[#161B26] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-500 border-slate-200'">
                <i class="fas fa-xmark text-xs"></i>
              </button>
            </div>

            <div class="p-3 flex flex-col gap-1.5 max-h-72 overflow-y-auto">
              <!-- Opción quitar estado -->
              <button @click="asignarEstadoCh(selectorCh.novedad, null)"
                class="flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-semibold uppercase transition-all hover:bg-slate-500/10"
                :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-200 text-slate-500'">
                <i class="fas fa-folder-minus"></i> Sin estado
              </button>
              <!-- Estados CH disponibles -->
              <button v-for="est in estadosCh" :key="'sel-' + est.id"
                @click="asignarEstadoCh(selectorCh.novedad, est.nombre)"
                class="flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-semibold uppercase tracking-wide transition-all hover:brightness-110"
                :class="selectorCh.novedad?.estadoCh === est.nombre
                  ? 'ring-2 ring-offset-1'
                  : (isDark ? 'border-[#222938]' : 'border-slate-200')"
                :style="{ borderColor: est.color + '40', backgroundColor: est.color + '15', color: est.color }">
                <i :class="est.icono"></i>
                {{ est.nombre }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- Modal soporte -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="modalOpen" class="fixed inset-0 z-[95] flex items-center justify-center p-4"
          style="background: rgba(0,0,0,0.7)" @click.self="modalOpen = false">
          <div class="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-md overflow-hidden"
            :class="isDark ? 'bg-[#161B26]' : 'bg-white'">
            <div class="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
              :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
              <div class="flex items-center gap-2">
                <i class="fas fa-eye text-[#3B82F6] text-xs"></i>
                <span class="text-[11px] font-semibold uppercase tracking-wide"
                  :class="isDark ? 'text-white' : 'text-slate-700'">Soporte</span>
                <span class="text-[10px] opacity-50" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{
                  modalNombre }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <a v-if="modalFileUrl" :href="modalFileUrl" target="_blank"
                  class="px-2 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-wide border flex items-center gap-1 transition-all hover:brightness-110"
                  :class="isDark ? 'bg-[#161B26] text-slate-300 border-[#3d4558]' : 'bg-slate-100 text-slate-600 border-slate-200'">
                  <i class="fas fa-external-link-alt text-[#3B82F6]"></i> Abrir
                </a>
                <button @click="modalOpen = false" class="w-7 h-7 rounded-lg flex items-center justify-center border"
                  :class="isDark ? 'bg-[#161B26] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-500 border-slate-200'">
                  <i class="fas fa-xmark text-xs"></i>
                </button>
              </div>
            </div>
            <div class="flex-1 overflow-auto flex items-center justify-center p-3 min-h-[400px]"
              :class="isDark ? 'bg-[#151c2c]' : 'bg-slate-50'">
              <div v-if="modalLoading" class="flex flex-col items-center gap-3">
                <i class="fas fa-circle-notch fa-spin text-[#3B82F6] text-2xl"></i>
              </div>
              <img v-else-if="modalIsImage && modalFileUrl" :src="modalFileUrl"
                class="max-w-full max-h-[70vh] object-contain rounded-lg" />
              <iframe v-else-if="modalIsPdf && modalFileUrl" :src="modalFileUrl" class="w-full rounded-lg border-0"
                style="height: 70vh" />
              <div v-else class="flex flex-col items-center gap-4 opacity-60">
                <i class="fas fa-file text-5xl" :class="isDark ? 'text-slate-500' : 'text-slate-400'"></i>
                <a v-if="modalFileUrl" :href="modalFileUrl" target="_blank"
                  class="text-[#3B82F6] underline font-bold text-xs">Abrir archivo</a>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- Menú contextual ⋮ -->
    <teleport to="body">
      <div v-if="menuAbierto !== null" class="fixed inset-0 z-40" @click="menuAbierto = null"></div>
      <transition name="fade-msg">
        <div v-if="menuAbierto !== null" class="fixed z-50 w-40 rounded-md border overflow-hidden"
          :style="{ top: menuPos.y + 'px', left: menuPos.x + 'px' }"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
          <button @click="verSoporte(menuAbierto); menuAbierto = null"
            class="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-semibold uppercase italic tracking-wide transition-all hover:bg-[#3B82F6]/10"
            :class="isDark ? 'text-slate-300' : 'text-slate-700'">
            <i class="fas fa-eye text-[#3B82F6] w-3"></i> Ver soporte
          </button>
        </div>
      </transition>
    </teleport>


    <!-- ══════════════════════════════════════════════════════════════
         MODAL DETALLE — Capital Humano (solo lectura)
    ══════════════════════════════════════════════════════════════════ -->
    <teleport to="body">
      <transition name="fade-panel">
        <div v-if="detalleModal.open" class="fixed inset-0 z-[85] flex items-center justify-center p-2"
          style="background:rgba(0,0,0,0.55);backdrop-filter:blur(4px)" @click.self="detalleModal.open = false">

          <div class="w-full max-w-[95vw] h-[92vh] rounded-[10px] border flex flex-col overflow-hidden"
            style="animation: vcModalIn 0.2s ease-out forwards;" :class="isDark
              ? 'bg-[#161B26] border-[#222938] shadow-[0_32px_64px_rgba(0,0,0,0.5)]'
              : 'bg-white border-[#e5e5e5] shadow-[0_24px_48px_rgba(0,0,0,0.1)]'">

            <!-- Header -->
            <div class="flex items-start justify-between px-6 pt-5 pb-4 border-b shrink-0"
              :class="isDark ? 'border-[#222938]' : 'border-[#e5e5e5]'">
              <div class="flex items-center gap-3 flex-1 min-w-0 pr-4">
                <div
                  class="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center text-[14px] font-semibold text-[#3B82F6] shrink-0">
                  {{ detalleModal.novedad?.nombre?.charAt(0) ?? '?' }}
                </div>
                <div class="min-w-0">
                  <p class="text-[15px] font-semibold tracking-[-0.01em] truncate"
                    :class="isDark ? 'text-white' : 'text-[#111]'">
                    {{ detalleModal.novedad?.nombre }}
                  </p>
                  <p class="text-[12px] mt-0.5 truncate" :class="isDark ? 'text-[#64748b]' : 'text-[#737373]'">
                    CC {{ detalleModal.novedad?.cedula }}
                    <span v-if="detalleModal.novedad?.departamento"> · {{ detalleModal.novedad.departamento }}</span>
                    <span v-if="detalleModal.novedad?.cargo"> · {{ detalleModal.novedad.cargo }}</span>
                  </p>
                </div>
              </div>
              <button @click="detalleModal.open = false"
                class="rounded-[6px] w-8 h-8 flex items-center justify-center border transition-colors shrink-0" :class="isDark
                  ? 'border-[#222938] text-[#64748b] hover:text-white hover:bg-[#222938]'
                  : 'border-[#e5e5e5] text-[#737373] hover:text-[#111] hover:bg-[#f5f5f5]'">
                <i class="fas fa-xmark text-xs"></i>
              </button>
            </div>

            <!-- Body scrollable -->
            <div class="px-6 py-5 flex-1 flex flex-col gap-5 overflow-y-auto vc-scroll min-h-0">

              <!-- Fila info principal -->
              <div class="grid grid-cols-3 gap-x-8 gap-y-4">
                <div>
                  <p class="text-[10px] font-semibold tracking-[0.08em] uppercase mb-1.5"
                    :class="isDark ? 'text-[#475569]' : 'text-[#737373]'">Tipificación</p>
                  <span v-if="detalleModal.novedad?.tipificacion"
                    class="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold border"
                    :class="detalleModal.novedad.tipificacion === 'Renuncia'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : (isDark ? 'bg-[#1a2035] text-slate-300 border-[#3d4558]' : 'bg-slate-100 text-slate-600 border-slate-200')">
                    {{ detalleModal.novedad.tipificacion }}
                  </span>
                  <span v-else :class="isDark ? 'text-[#64748b]' : 'text-[#737373]'" class="text-[13px]">—</span>
                </div>
                <div>
                  <p class="text-[10px] font-semibold tracking-[0.08em] uppercase mb-1.5"
                    :class="isDark ? 'text-[#475569]' : 'text-[#737373]'">Est. Jefe</p>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border"
                    :class="detalleModal.novedad?.aprobadoJefe === 1
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : detalleModal.novedad?.aprobadoJefe === 0
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'">
                    <i
                      :class="detalleModal.novedad?.aprobadoJefe === 1 ? 'fas fa-check' : detalleModal.novedad?.aprobadoJefe === 0 ? 'fas fa-xmark' : 'fas fa-clock'"></i>
                    {{ detalleModal.novedad?.aprobadoJefe === 1 ? 'Aprobado' : detalleModal.novedad?.aprobadoJefe === 0
                      ? 'Rechazado' : 'Pendiente' }}
                  </span>
                </div>
                <div>
                  <p class="text-[10px] font-semibold tracking-[0.08em] uppercase mb-1.5"
                    :class="isDark ? 'text-[#475569]' : 'text-[#737373]'">Fecha inicio</p>
                  <p class="text-[13px] font-medium" :class="isDark ? 'text-[#e2e8f0]' : 'text-[#171717]'">
                    {{ formatFecha(detalleModal.novedad?.fechaInicio ?? detalleModal.novedad?.fecha_inicio) }}
                  </p>
                </div>
                <div>
                  <p class="text-[10px] font-semibold tracking-[0.08em] uppercase mb-1.5"
                    :class="isDark ? 'text-[#475569]' : 'text-[#737373]'">Fecha fin</p>
                  <p class="text-[13px] font-medium" :class="isDark ? 'text-[#e2e8f0]' : 'text-[#171717]'">
                    {{ formatFecha(detalleModal.novedad?.fechaFin ?? detalleModal.novedad?.fecha_fin) }}
                  </p>
                </div>
                <div>
                  <p class="text-[10px] font-semibold tracking-[0.08em] uppercase mb-1.5"
                    :class="isDark ? 'text-[#475569]' : 'text-[#737373]'">Días</p>
                  <p class="text-[13px] font-medium" :class="isDark ? 'text-[#e2e8f0]' : 'text-[#171717]'">
                    {{ calcDias(detalleModal.novedad?.fechaInicio ?? detalleModal.novedad?.fecha_inicio,
                      detalleModal.novedad?.fechaFin ?? detalleModal.novedad?.fecha_fin) }}
                  </p>
                </div>
                <div
                  v-if="detalleModal.novedad?.tipificacion === 'Renuncia' && detalleModal.novedad?.ultimoDiaTrabajado"
                  class="col-span-3">
                  <p class="text-[10px] font-semibold tracking-[0.08em] uppercase mb-1.5"
                    :class="isDark ? 'text-[#475569]' : 'text-[#737373]'">Último día trabajado</p>
                  <p class="text-[13px] font-medium" :class="isDark ? 'text-[#e2e8f0]' : 'text-[#171717]'">
                    {{ formatFecha(detalleModal.novedad.ultimoDiaTrabajado) }}
                  </p>
                </div>
              </div>

              <!-- Descripción -->
              <div class="border-t pt-5" :class="isDark ? 'border-[#222938]' : 'border-[#e5e5e5]'">
                <p class="text-[10px] font-semibold tracking-[0.08em] uppercase mb-2"
                  :class="isDark ? 'text-[#475569]' : 'text-[#737373]'">Descripción</p>
                <p class="text-[13px] leading-[1.65]" :class="isDark ? 'text-[#94a3b8]' : 'text-[#444]'">
                  {{ detalleModal.novedad?.descripcion || '—' }}
                </p>
              </div>

              <!-- Motivo jefe (si existe) -->
              <div v-if="detalleModal.novedad?.motivoJefe" class="border-t pt-5"
                :class="isDark ? 'border-[#222938]' : 'border-[#e5e5e5]'">
                <p class="text-[10px] font-semibold tracking-[0.08em] uppercase mb-2"
                  :class="isDark ? 'text-[#475569]' : 'text-[#737373]'">Motivo jefe</p>
                <p class="text-[13px] leading-[1.65]" :class="isDark ? 'text-[#94a3b8]' : 'text-[#444]'">
                  {{ detalleModal.novedad.motivoJefe }}
                </p>
              </div>

              <!-- Datos de liquidación (solo lectura, solo Renuncia) -->
              <template v-if="detalleModal.novedad?.tipificacion === 'Renuncia'">
                <div class="border-t pt-5" :class="isDark ? 'border-[#222938]' : 'border-[#e5e5e5]'">
                  <p class="text-[10px] font-semibold tracking-[0.08em] uppercase mb-4"
                    :class="isDark ? 'text-[#475569]' : 'text-[#737373]'">Datos de liquidación</p>
                  <div class="grid grid-cols-2 gap-4">
                    <div
                      v-for="(campo, key) in { 'Descuento': 'renunciaDescuento', 'Comisiones': 'renunciaComisiones', 'Horas extra': 'renunciaHorasExtra', 'Transporte': 'renunciaTransporte' }"
                      :key="key" class="rounded-[6px] border p-3"
                      :class="isDark ? 'bg-[#1a2035] border-[#222938]' : 'bg-[#f9f9f9] border-[#e5e5e5]'">
                      <p class="text-[10px] font-semibold tracking-[0.06em] uppercase mb-1"
                        :class="isDark ? 'text-[#475569]' : 'text-[#737373]'">{{ key }}</p>
                      <p class="text-[13px] leading-relaxed whitespace-pre-wrap" :class="detalleModal.novedad?.[campo]
                        ? (isDark ? 'text-[#e2e8f0]' : 'text-[#171717]')
                        : (isDark ? 'text-[#334155]' : 'text-[#c0c0c0]')">
                        {{ detalleModal.novedad?.[campo] || 'Sin datos' }}
                      </p>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Archivos adjuntos -->
              <div class="border-t pt-5" :class="isDark ? 'border-[#222938]' : 'border-[#e5e5e5]'">
                <p class="text-[10px] font-semibold tracking-[0.08em] uppercase mb-3"
                  :class="isDark ? 'text-[#475569]' : 'text-[#737373]'">
                  Archivos adjuntos
                  <span v-if="detalleModal.archivos.length"
                    class="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-[#3B82F6]/10 text-[#3B82F6]">
                    {{ detalleModal.archivos.length }}
                  </span>
                </p>

                <div v-if="detalleModal.cargandoArchivos" class="flex items-center gap-2 py-2">
                  <i class="fas fa-circle-notch fa-spin text-[#3B82F6] text-xs"></i>
                  <span class="text-[12px]" :class="isDark ? 'text-[#64748b]' : 'text-[#737373]'">Cargando
                    archivos...</span>
                </div>

                <div v-else-if="!detalleModal.archivos.length" class="flex items-center gap-2 py-3 opacity-40">
                  <i class="fas fa-paperclip text-sm" :class="isDark ? 'text-slate-500' : 'text-slate-400'"></i>
                  <span class="text-[12px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Sin archivos
                    adjuntos</span>
                </div>

                <div v-else class="flex flex-col gap-2">
                  <div v-for="archivo in detalleModal.archivos" :key="archivo.id"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-[6px] border transition-colors"
                    :class="isDark ? 'border-[#222938] bg-[#1a2035] hover:bg-[#222938]' : 'border-[#e5e5e5] bg-[#f9f9f9] hover:bg-[#f0f0f0]'">
                    <i class="text-base w-5 text-center shrink-0" :class="(archivo.mimetype ?? '').startsWith('image/')
                      ? 'fas fa-image text-[#3B82F6]'
                      : (archivo.mimetype ?? '') === 'application/pdf'
                        ? 'fas fa-file-pdf text-red-400'
                        : 'fas fa-file text-slate-400'"></i>
                    <span class="flex-1 text-[12px] font-medium truncate"
                      :class="isDark ? 'text-[#e2e8f0]' : 'text-[#171717]'">
                      {{ archivo.nombreOriginal ?? archivo.nombre_original ?? 'Archivo' }}
                    </span>
                    <span class="text-[10px] shrink-0" :class="isDark ? 'text-[#475569]' : 'text-[#9a9a9a]'">
                      {{ ((archivo.tamano ?? 0) / 1024).toFixed(0) > 0 ? ((archivo.tamano ?? 0) / 1024).toFixed(0) + ' KB' : '' }}
                    </span>
                    <button @click="abrirArchivoDetalle(archivo)"
                      class="shrink-0 h-7 px-3 rounded-[6px] border text-[11px] font-medium transition-colors flex items-center gap-1.5"
                      :class="isDark
                        ? 'border-[#222938] text-[#64748b] hover:text-white hover:border-[#3d4558] bg-[#161B26]'
                        : 'border-[#e5e5e5] text-[#555] hover:text-[#111] bg-white'">
                      <i class="fas fa-eye text-[#3B82F6] text-[10px]"></i> Ver
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- Modal ver motivo -->
    <teleport to="body">
      <div v-if="motivoModal.open"
        class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @mousedown.self="motivoModal.open = false">
        <div class="w-full max-w-sm rounded-md border p-6 flex flex-col gap-4"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
          <div class="flex items-center gap-2">
            <i class="fas fa-comment-alt text-[#3B82F6]"></i>
            <h3 class="text-sm font-semibold uppercase tracking-wide" :class="isDark ? 'text-white' : 'text-slate-800'">
              {{ motivoModal.titulo }}
            </h3>
          </div>
          <p class="text-[15px] font-medium leading-relaxed" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
            {{ motivoModal.texto }}
          </p>
          <button @click="motivoModal.open = false"
            class="py-2 rounded-lg text-[10px] font-semibold uppercase italic border"
            :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-200 text-slate-500'">
            Cerrar
          </button>
        </div>
      </div>
    </teleport>


  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { useNovedades, getEstadoVisual } from '../../composables/adminLogica/useNovedades';

const API_URL = import.meta.env.VITE_API_URL;

const props = defineProps({ isDark: Boolean, company: String });

const {
  novedades,
  loading,
  error,
  fetchNovedades,
  fetchNovedad,
  eliminarNovedad,
  getFileUrl,
  // Carpetas CH (tipo = 'rrhh')
  estadosCh,
  fetchEstadosCh,
  crearEstadoCh,
  editarEstadoCh,
  eliminarEstadoCh,
  cambiarEstadoCh,
} = useNovedades();

// Este módulo siempre usa tipo = 'rrhh'
const TIPO_CH = 'rrhh';

// ─── Filtros de búsqueda ──────────────────────────────────────────
const filters = ref({ nombre: '', departamento: '', cargo: '', fechaInicio: '', fechaFin: '' });
const showDeptList = ref(false);
const showCargoList = ref(false);
const showEstadoDropdown = ref(false);
const tabEstado = ref(''); // '' | 'nueva' | 'revision' | 'aprobada' | 'rechazada' | 'ch:NombreEstado'

const ESTADO_OPTIONS = [
  { value: '', label: 'Todas', color: '#94a3b8' },
  { value: 'nueva', label: 'Nuevas', color: '#3B82F6' },
  { value: 'revision', label: 'Revisión', color: '#F59E0B' },
  { value: 'aprobada', label: 'Aprobadas', color: '#10B981' },
  { value: 'rechazada', label: 'No aprobadas', color: '#EF4444' },
  { value: 'carpetas', label: 'Carpetas', color: '#8B5CF6' },
];

// ─── Modales ──────────────────────────────────────────────────────
const modalOpen = ref(false);
const modalLoading = ref(false);
const modalFileUrl = ref('');
const modalNombre = ref('');
const modalMime = ref('');
const menuAbierto = ref(null);
const itemMenuActual = ref(null);
const menuPos = ref({ x: 0, y: 0 });
const motivoModal = ref({ open: false, titulo: '', texto: '' });

// Modal gestión estados CH
const modalEstados = ref({ open: false });

// Acordeón carpetas CH
const carpetasAbiertasCh = ref(new Set());
const toggleCarpetaCh = (id) => {
  const s = new Set(carpetasAbiertasCh.value);
  s.has(id) ? s.delete(id) : s.add(id);
  carpetasAbiertasCh.value = s;
};
const nuevoEstado = ref({ nombre: '', icono: 'fas fa-folder', color: '#3B82F6' });
const loadingEstado = ref(false);
const errorEstado = ref('');

// Selector de estado CH para asignar
const selectorCh = ref({ open: false, novedad: null });

// ─── Montaje ──────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([fetchNovedades(), fetchEstadosCh(TIPO_CH)]);
});

// ─── Helpers estado CH ────────────────────────────────────────────
const getColorEstadoCh = (nombre) => {
  const est = estadosCh.value.find(e => e.nombre === nombre);
  return est?.color ?? '#6b7280';
};
const getIconEstadoCh = (nombre) => {
  const est = estadosCh.value.find(e => e.nombre === nombre);
  return est?.icono ?? 'fas fa-folder';
};

// ─── Contadores para tabs ─────────────────────────────────────────
const cuentaNuevas = computed(() =>
  novedades.value.filter(n => {
    const cfg = getEstadoVisual(n);
    return cfg.label === 'Nueva';
  }).length
);
const cuentaRevision = computed(() =>
  novedades.value.filter(n => {
    const cfg = getEstadoVisual(n);
    return cfg.label.includes('revisión') || cfg.label.includes('Pend.');
  }).length
);
const cuentaAprobadas = computed(() =>
  novedades.value.filter(n => n.aprobado === 1).length
);
const cuentaRechazadas = computed(() =>
  novedades.value.filter(n => n.aprobado === 0).length
);

const currentTabOption = computed(() =>
  ESTADO_OPTIONS.find(o => o.value === tabEstado.value) ?? ESTADO_OPTIONS[0]
);

const getOptCount = (value) => {
  switch (value) {
    case '': return novedades.value.length;
    case 'nueva': return cuentaNuevas.value;
    case 'revision': return cuentaRevision.value;
    case 'aprobada': return cuentaAprobadas.value;
    case 'rechazada': return cuentaRechazadas.value;
    case 'carpetas': return novedadesEnCarpetaCh.value;
    default: return 0;
  }
};

// ─── Sugerencias autocomplete ─────────────────────────────────────
const deptSuggestions = computed(() => {
  const q = filters.value.departamento.toLowerCase().trim();
  const all = [...new Set(novedades.value.map(n => n.departamento).filter(Boolean))].sort();
  if (!q) return all.slice(0, 8);
  return all.filter(d => d.toLowerCase().includes(q)).slice(0, 8);
});

// ─── Filtrado combinado (tabs + búsqueda) ────────────────────────
const novedadesFiltradas = computed(() => {
  const { nombre, departamento, cargo, fechaInicio, fechaFin } = filters.value;
  let lista = novedades.value;

  // Filtro por tab de estado
  if (tabEstado.value) {
    if (tabEstado.value === 'nueva') {
      lista = lista.filter(n => getEstadoVisual(n).label === 'Nueva');
    } else if (tabEstado.value === 'revision') {
      lista = lista.filter(n => {
        const l = getEstadoVisual(n).label;
        return l.includes('revisión') || l.includes('Pend.');
      });
    } else if (tabEstado.value === 'aprobada') {
      lista = lista.filter(n => n.aprobado === 1);
    } else if (tabEstado.value === 'rechazada') {
      lista = lista.filter(n => n.aprobado === 0);
    } else if (tabEstado.value.startsWith('ch:')) {
      const nombre_estado = tabEstado.value.slice(3);
      lista = lista.filter(n => n.estadoCh === nombre_estado);
    }
  }

  // Filtros de texto
  if (nombre) lista = lista.filter(n => (n.nombre ?? '').toLowerCase().includes(nombre.toLowerCase()));
  if (departamento) lista = lista.filter(n => (n.departamento ?? '').toLowerCase().includes(departamento.toLowerCase()));
  if (cargo) lista = lista.filter(n => (n.cargo ?? '').toLowerCase().includes(cargo.toLowerCase()));

  if (fechaInicio || fechaFin) {
    lista = lista.filter(n => {
      const ini = (n.fechaInicio ?? n.fecha_inicio ?? '').slice(0, 10);
      const fin = (n.fechaFin ?? n.fecha_fin ?? '').slice(0, 10);
      if (fechaInicio && fin < fechaInicio) return false;
      if (fechaFin && ini > fechaFin) return false;
      return true;
    });
  }

  return lista;
});

const mensajeVacio = computed(() => {
  if (tabEstado.value) return `Sin novedades en "${tabEstado.value.startsWith('ch:') ? tabEstado.value.slice(3) : tabEstado.value}"`;
  const { nombre, departamento, cargo, fechaInicio, fechaFin } = filters.value;
  return nombre || departamento || cargo || fechaInicio || fechaFin
    ? 'Sin resultados para el filtro aplicado'
    : 'No hay novedades registradas';
});

// ─── Helpers formato ─────────────────────────────────────────────
const highlight = (texto) => {
  if (!filters.value.nombre || !texto) return texto ?? '';
  const regex = new RegExp(`(${filters.value.nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return texto.replace(regex, '<mark class="bg-[#3B82F6]/30 text-inherit rounded px-0.5">$1</mark>');
};

const formatFecha = (f) => {
  if (!f) return '—';
  return new Date(f + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const calcDias = (inicio, fin) => {
  if (!inicio || !fin) return '—';
  return Math.round((new Date(fin) - new Date(inicio)) / 86400000) + 1;
};

const resetFilters = () => {
  filters.value = { nombre: '', departamento: '', cargo: '', fechaInicio: '', fechaFin: '' };
  tabEstado.value = '';
  fetchNovedades();
};

// ─── Gestión carpetas CH (tipo='rrhh') ────────────────────────────
const editandoEstado = ref(null); // { id, nombre, icono, color } cuando se edita

const guardarEstadoCh = async () => {
  if (!nuevoEstado.value.nombre.trim()) return;
  loadingEstado.value = true;
  errorEstado.value = '';
  try {
    if (editandoEstado.value) {
      // Editar existente
      await editarEstadoCh(
        editandoEstado.value.id,
        { nombre: nuevoEstado.value.nombre.trim(), icono: nuevoEstado.value.icono, color: nuevoEstado.value.color },
        TIPO_CH,
      );
      editandoEstado.value = null;
    } else {
      // Crear nuevo
      await crearEstadoCh({
        nombre: nuevoEstado.value.nombre.trim(),
        icono: nuevoEstado.value.icono,
        color: nuevoEstado.value.color,
        tipo: TIPO_CH,
      });
    }
    nuevoEstado.value = { nombre: '', icono: 'fas fa-folder', color: '#3B82F6' };
  } catch (e) {
    errorEstado.value = e?.response?.data?.message || 'Error al guardar la carpeta.';
  } finally {
    loadingEstado.value = false;
  }
};

const iniciarEdicionEstado = (est) => {
  editandoEstado.value = { id: est.id };
  nuevoEstado.value = { nombre: est.nombre, icono: est.icono, color: est.color };
  errorEstado.value = '';
};

const cancelarEdicion = () => {
  editandoEstado.value = null;
  nuevoEstado.value = { nombre: '', icono: 'fas fa-folder', color: '#3B82F6' };
  errorEstado.value = '';
};

const confirmarEliminarEstado = async (est) => {
  if (!confirm(`¿Eliminar la carpeta "${est.nombre}"? Las novedades con esa carpeta quedarán sin asignar.`)) return;
  try {
    await eliminarEstadoCh(est.id, TIPO_CH);
  } catch (e) {
    alert('Error al eliminar la carpeta.');
  }
};

// ─── Selector carpeta CH en una novedad ──────────────────────────
const abrirSelectorCh = (novedad) => {
  selectorCh.value = { open: true, novedad };
};

const asignarEstadoCh = async (novedad, estadoCh) => {
  if (!novedad) return;
  try {
    await cambiarEstadoCh(novedad.id, estadoCh, TIPO_CH);
    selectorCh.value.open = false;
  } catch (e) {
    console.error('Error asignando carpeta CH:', e);
  }
};

// ─── Menú contextual ──────────────────────────────────────────────
const modalIsImage = computed(() => /image\/(jpeg|jpg|png|gif|webp|svg)/.test(modalMime.value));
const modalIsPdf = computed(() => modalMime.value === 'application/pdf');

const toggleMenu = (event, id) => {
  if (menuAbierto.value === id) { menuAbierto.value = null; return; }
  const btn = event.currentTarget.getBoundingClientRect();
  menuPos.value = { x: btn.right - 160, y: btn.bottom + 6 };
  itemMenuActual.value = novedadesFiltradas.value.find(n => n.id === id);
  menuAbierto.value = id;
};


// ─── Modal ver motivo ─────────────────────────────────────────────
const verMotivo = (texto, titulo = 'Motivo') => {
  motivoModal.value = { open: true, titulo, texto };
};

// ─── Novedades agrupadas por carpeta CH ──────────────────────────
const novedadesPorCarpetaCh = computed(() =>
  estadosCh.value.map(carpeta => ({
    ...carpeta,
    items: novedades.value.filter(n => n.estadoCh === carpeta.nombre),
  }))
);

const novedadesEnCarpetaCh = computed(() =>
  novedades.value.filter(n => n.estadoCh).length
);

// ─── Modal detalle (Capital Humano, solo lectura) ─────────────────
const detalleModal = ref({ open: false, novedad: null, archivos: [], cargandoArchivos: false });

const abrirDetalle = async (item) => {
  detalleModal.value = { open: true, novedad: item, archivos: [], cargandoArchivos: true };
  try {
    const res = await axios.get(`${API_URL}/novedades/${item.id}/archivos`);
    detalleModal.value.archivos = Array.isArray(res.data) ? res.data : [];
  } catch {
    detalleModal.value.archivos = [];
  } finally {
    detalleModal.value.cargandoArchivos = false;
  }
};

const abrirArchivoDetalle = (archivo) => {
  const url = `${API_URL}/novedades/${detalleModal.value.novedad.id}/archivos/${archivo.id}/file`;
  modalOpen.value = true;
  modalLoading.value = false;
  modalNombre.value = archivo.nombreOriginal ?? archivo.nombre_original ?? 'Archivo';
  modalMime.value = archivo.mimetype ?? '';
  modalFileUrl.value = url;
};

// ─── Modal soporte ────────────────────────────────────────────────
const verSoporte = async (id) => {
  modalOpen.value = true;
  modalLoading.value = true;
  modalFileUrl.value = '';
  modalMime.value = '';
  try {
    const detalle = await fetchNovedad(id);
    modalNombre.value = detalle.nombre ?? '';
    modalMime.value = detalle.soporteMime ?? detalle.soporte_mime ?? '';
    modalFileUrl.value = `${import.meta.env.VITE_API_URL}/novedades/${id}/file`;
  } catch {
    modalFileUrl.value = `${import.meta.env.VITE_API_URL}/novedades/${id}/file`;
  } finally {
    modalLoading.value = false;
  }
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Modal detalle */
@keyframes vcModalIn {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.99);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.fade-panel-enter-active,
.fade-panel-leave-active {
  transition: opacity 0.2s ease;
}

.fade-panel-enter-from,
.fade-panel-leave-to {
  opacity: 0;
}

.fade-msg-enter-active,
.fade-msg-leave-active {
  transition: all 0.2s ease;
}

.fade-msg-enter-from,
.fade-msg-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Scrollbar sutil */
.vc-scroll::-webkit-scrollbar {
  width: 3px;
}

.vc-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.vc-scroll::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.2);
  border-radius: 99px;
}

.vc-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.4);
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s ease;
}

.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
