<template>
  <div class="w-full h-full animate-fade-in transition-all duration-500 flex flex-col gap-2">

    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-2 p-1.5 px-3 rounded-2xl border shrink-0 shadow-sm"
      :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

      <div class="flex items-center gap-2.5 ml-1">
        <div class="w-6 h-6 flex items-center justify-center rounded-lg bg-[#FF8F00] text-white shadow-sm">
          <i class="fas fa-user-check text-[10px]"></i>
        </div>
        <div>
          <h2 class="text-sm font-black uppercase tracking-tighter" :class="isDark ? 'text-white' : 'text-slate-800'">
            Gestión <span class="text-[#FF8F00]">Capital Humano</span>
          </h2>
          <p class="text-[8px] font-bold opacity-50 uppercase tracking-[0.2em]"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Revisión de Novedades</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-1.5">
        <!-- Filtros de búsqueda -->
        <div
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border focus-within:ring-1 focus-within:ring-[#FF8F00]/30 transition-all"
          :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-200 bg-white'">
          <i class="fas fa-search text-[#FF8F00] text-[9px]"></i>
          <input v-model="filters.nombre" type="text" placeholder="Nombre..."
            class="bg-transparent text-[10px] font-bold outline-none w-28 placeholder:font-normal placeholder:text-slate-500"
            :class="isDark ? 'text-white' : 'text-slate-700'" />
          <button v-if="filters.nombre" @click="filters.nombre = ''" class="opacity-40 hover:opacity-80 transition-opacity">
            <i class="fas fa-xmark text-[9px]" :class="isDark ? 'text-slate-300' : 'text-slate-600'"></i>
          </button>
        </div>

        <!-- Filtro departamento -->
        <div class="relative">
          <div
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border focus-within:ring-1 focus-within:ring-[#FF8F00]/30 transition-all"
            :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-200 bg-white'">
            <i class="fas fa-building text-[#FF8F00] text-[9px]"></i>
            <input v-model="filters.departamento" type="text" placeholder="Departamento..."
              class="bg-transparent text-[10px] font-bold outline-none w-32 placeholder:font-normal placeholder:text-slate-500"
              :class="isDark ? 'text-white' : 'text-slate-700'"
              @focus="showDeptList = true"
              @blur="setTimeout(() => showDeptList = false, 150)" />
            <button v-if="filters.departamento" @click="filters.departamento = ''" class="opacity-40 hover:opacity-80">
              <i class="fas fa-xmark text-[9px]" :class="isDark ? 'text-slate-300' : 'text-slate-600'"></i>
            </button>
          </div>
          <div v-if="showDeptList && deptSuggestions.length"
            class="absolute top-full left-0 mt-1 z-50 w-56 rounded-xl border shadow-2xl overflow-hidden"
            :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">
            <button v-for="s in deptSuggestions" :key="s"
              @mousedown.prevent="filters.departamento = s; showDeptList = false"
              class="w-full text-left px-3 py-2 text-[10px] font-bold transition-colors hover:bg-[#FF8F00]/10"
              :class="isDark ? 'text-slate-200' : 'text-slate-700'">{{ s }}</button>
          </div>
        </div>

        <!-- Rango fechas -->
        <div class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border"
          :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-200 bg-white'">
          <i class="fas fa-calendar-day text-[#FF8F00] text-[9px]"></i>
          <input type="date" v-model="filters.fechaInicio"
            class="bg-transparent text-[10px] font-bold outline-none cursor-pointer"
            :class="isDark ? 'text-white [color-scheme:dark]' : 'text-slate-700'" />
          <span class="text-[9px] opacity-40 mx-0.5">→</span>
          <input type="date" v-model="filters.fechaFin"
            class="bg-transparent text-[10px] font-bold outline-none cursor-pointer"
            :class="isDark ? 'text-white [color-scheme:dark]' : 'text-slate-700'" />
        </div>

        <!-- Reset + Gestionar estados -->
        <button @click="resetFilters" class="p-1.5 rounded-lg border transition-colors hover:text-[#FF8F00]"
          :class="isDark ? 'border-[#2d3548] bg-[#273045] text-slate-400' : 'border-slate-200 bg-white text-slate-500'">
          <i class="fas fa-sync-alt text-[10px]" :class="{ 'fa-spin': loading }"></i>
        </button>

        <!-- Botón gestionar estados CH -->
        <button @click="modalEstados.open = true"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase italic tracking-widest transition-all hover:brightness-110 active:scale-95"
          :class="isDark ? 'bg-[#273045] border-[#2d3548] text-[#FF8F00]' : 'bg-[#FF8F00]/10 border-[#FF8F00]/30 text-[#FF8F00]'">
          <i class="fas fa-folder-plus text-[9px]"></i> Estados
        </button>
      </div>
    </div>

    <!-- Barra de tabs de estados (Nuevas + custom CH) -->
    <div class="flex items-center gap-1.5 flex-wrap shrink-0 px-0.5">

      <!-- Tab "Todas" -->
      <button @click="tabEstado = ''"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all"
        :class="tabEstado === ''
          ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
          : (isDark ? 'bg-[#1e2538] border-[#2d3548] text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800')">
        <i class="fas fa-layer-group text-[9px]"></i>
        Todas
        <span class="text-[8px] opacity-70">({{ novedades.length }})</span>
      </button>

      <!-- Tab "Nuevas" -->
      <button @click="tabEstado = 'nueva'"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all"
        :class="tabEstado === 'nueva'
          ? 'bg-[#FF8F00] text-black border-[#FF8F00] shadow-sm'
          : (isDark ? 'bg-[#1e2538] border-[#2d3548] text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800')">
        <i class="fas fa-folder-open text-[9px]"></i>
        Nuevas
        <span class="text-[8px] opacity-70">({{ cuentaNuevas }})</span>
      </button>

      <!-- Tab "En revisión" -->
      <button @click="tabEstado = 'revision'"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all"
        :class="tabEstado === 'revision'
          ? 'bg-amber-500 text-black border-amber-500 shadow-sm'
          : (isDark ? 'bg-[#1e2538] border-[#2d3548] text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800')">
        <i class="fas fa-folder text-[9px]"></i>
        En revisión
        <span class="text-[8px] opacity-70">({{ cuentaRevision }})</span>
      </button>

      <!-- Tab "Aprobadas" -->
      <button @click="tabEstado = 'aprobada'"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all"
        :class="tabEstado === 'aprobada'
          ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
          : (isDark ? 'bg-[#1e2538] border-[#2d3548] text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800')">
        <i class="fas fa-folder text-[9px]"></i>
        Aprobadas
        <span class="text-[8px] opacity-70">({{ cuentaAprobadas }})</span>
      </button>

      <!-- Tab "No aprobadas" -->
      <button @click="tabEstado = 'rechazada'"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all"
        :class="tabEstado === 'rechazada'
          ? 'bg-red-500 text-white border-red-500 shadow-sm'
          : (isDark ? 'bg-[#1e2538] border-[#2d3548] text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800')">
        <i class="fas fa-folder text-[9px]"></i>
        No aprobadas
        <span class="text-[8px] opacity-70">({{ cuentaRechazadas }})</span>
      </button>

      <!-- Tabs estados CH personalizados -->
      <button v-for="est in estadosCh" :key="est.id"
        @click="tabEstado = 'ch:' + est.nombre"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all"
        :class="tabEstado === 'ch:' + est.nombre
          ? 'text-white shadow-sm'
          : (isDark ? 'bg-[#1e2538] border-[#2d3548] text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800')"
        :style="tabEstado === 'ch:' + est.nombre ? { backgroundColor: est.color, borderColor: est.color } : {}">
        <i :class="est.icono" class="text-[9px]" :style="tabEstado !== 'ch:' + est.nombre ? { color: est.color } : {}"></i>
        {{ est.nombre }}
        <span class="text-[8px] opacity-70">({{ novedades.filter(n => n.estadoCh === est.nombre).length }})</span>
      </button>
    </div>

    <!-- Tabla -->
    <div class="flex-1 flex flex-col w-full overflow-hidden rounded-2xl border transition-all duration-500"
      :class="isDark ? 'bg-[#1e2538] border-[#2d3548] shadow-black/40' : 'bg-white border-slate-200 shadow-slate-100'">

      <div v-if="loading" class="flex-1 flex items-center justify-center gap-3">
        <i class="fas fa-circle-notch fa-spin text-[#FF8F00]"></i>
        <span class="text-[11px] font-black uppercase tracking-widest"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cargando novedades...</span>
      </div>

      <div v-else-if="error" class="flex-1 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3 opacity-70">
          <i class="fas fa-exclamation-triangle text-red-400 text-2xl"></i>
          <p class="text-[11px] font-bold text-red-400">Error al cargar los registros</p>
          <button @click="fetchNovedades" class="px-4 py-2 rounded-lg text-[9px] font-black uppercase bg-[#FF8F00] text-black">
            Reintentar
          </button>
        </div>
      </div>

      <div v-else-if="novedadesFiltradas.length === 0" class="flex-1 flex items-center justify-center">
        <div class="flex flex-col items-center gap-2 opacity-50">
          <i class="fas fa-folder-open text-3xl" :class="isDark ? 'text-slate-500' : 'text-slate-300'" style="color:#FF8F00"></i>
          <p class="text-[11px] font-black uppercase tracking-widest" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
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
                <th class="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Colaborador</th>
                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Inicio</th>
                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Fin</th>
                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Días</th>
                <th class="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Descripción</th>
                <th class="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Tipificación</th>
                <!-- Estado tipo carpeta -->
                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Estado</th>
                <!-- Estado CH personalizado -->
                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Carpeta CH</th>
                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Est. Jefe</th>
                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Mot. Jefe</th>
                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Mot. Capital</th>
                <th class="px-4 py-2.5 text-right text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in novedadesFiltradas" :key="item.id" class="group transition-all duration-150"
                :class="[
                  idx % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-transparent',
                  isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-orange-50'
                ]">

                <!-- Colaborador -->
                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-lg bg-[#FF8F00]/10 flex items-center justify-center text-[10px] font-black text-[#FF8F00] shrink-0">
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
                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <span class="text-[11px] font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                    {{ formatFecha(item.fechaInicio ?? item.fecha_inicio) }}
                  </span>
                </td>
                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <span class="text-[11px] font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                    {{ formatFecha(item.fechaFin ?? item.fecha_fin) }}
                  </span>
                </td>

                <!-- Días -->
                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <span class="text-[12px] font-black" :class="isDark ? 'text-white' : 'text-slate-800'">
                    {{ calcDias(item.fechaInicio ?? item.fecha_inicio, item.fechaFin ?? item.fecha_fin) }}
                  </span>
                </td>

                <!-- Descripción -->
                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <p class="text-[11px] font-medium line-clamp-2 max-w-[200px]" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                    {{ item.descripcion }}
                  </p>
                </td>

                <!-- Tipificación -->
                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <p class="text-[11px] font-medium line-clamp-2 max-w-[140px]" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                    {{ item.tipificacion || '—' }}
                  </p>
                </td>

                <!-- Estado tipo carpeta -->
                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border"
                    :class="getEstadoVisual(item).bg">
                    <i :class="getEstadoVisual(item).icon" :style="{ color: getEstadoVisual(item).color }"></i>
                    <span :style="{ color: getEstadoVisual(item).color }">{{ getEstadoVisual(item).label }}</span>
                  </span>
                </td>

                <!-- Carpeta CH (estado personalizado) -->
                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <div class="relative flex items-center justify-center gap-1">
                    <!-- Badge del estado CH actual -->
                    <span v-if="item.estadoCh"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-current/20 bg-current/10 cursor-pointer hover:brightness-110"
                      :style="{ color: getColorEstadoCh(item.estadoCh) }"
                      @click="abrirSelectorCh(item)">
                      <i :class="getIconEstadoCh(item.estadoCh)"></i>
                      {{ item.estadoCh }}
                    </span>
                    <button v-else
                      @click="abrirSelectorCh(item)"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border transition-all hover:border-[#FF8F00]/40 hover:text-[#FF8F00]"
                      :class="isDark ? 'border-[#3d4558] text-slate-500' : 'border-slate-200 text-slate-400'">
                      <i class="fas fa-folder-plus text-[8px]"></i> Asignar
                    </button>
                  </div>
                </td>

                <!-- Estado jefe badge -->
                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <span class="px-2 py-0.5 rounded-md text-[8px] uppercase tracking-widest border font-black"
                    :class="item.aprobadoJefe === 1
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : item.aprobadoJefe === 0
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : (isDark ? 'bg-[#2d3548] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-400 border-slate-200')">
                    <i :class="item.aprobadoJefe === 1 ? 'fas fa-check' : item.aprobadoJefe === 0 ? 'fas fa-xmark' : 'fas fa-clock'" class="mr-1"></i>
                    {{ item.aprobadoJefe === 1 ? 'Aprobado' : item.aprobadoJefe === 0 ? 'Rechazado' : 'Pendiente' }}
                  </span>
                </td>

                <!-- Motivo jefe -->
                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <span v-if="item.motivoJefe" @click="verMotivo(item.motivoJefe, 'Motivo Jefe Directo')"
                    class="cursor-pointer text-[12px] font-bold text-[#FF8F00] hover:underline">
                    <i class="fas fa-comment-alt mr-1"></i>Ver
                  </span>
                  <span v-else class="text-[11px] opacity-30">—</span>
                </td>

                <!-- Motivo RRHH -->
                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <span v-if="item.motivoRrhh" @click="verMotivo(item.motivoRrhh, 'Motivo Capital Humano')"
                    class="cursor-pointer text-[12px] font-bold text-[#FF8F00] hover:underline">
                    <i class="fas fa-comment-alt mr-1"></i>Ver
                  </span>
                  <span v-else class="text-[11px] opacity-30">—</span>
                </td>

                <!-- Acciones -->
                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <div class="flex items-center justify-end gap-2">
                    <!-- Badge estado RRHH -->
                    <span class="px-2 py-0.5 rounded-md text-[8px] uppercase tracking-widest border font-black"
                      :class="item.aprobadoRrhh === 1
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : item.aprobadoRrhh === 0
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : (isDark ? 'bg-[#2d3548] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-400 border-slate-200')">
                      <i :class="item.aprobadoRrhh === 1 ? 'fas fa-check' : item.aprobadoRrhh === 0 ? 'fas fa-xmark' : 'fas fa-clock'" class="mr-1"></i>
                      {{ item.aprobadoRrhh === 1 ? 'Aprobada' : item.aprobadoRrhh === 0 ? 'Rechazada' : 'Pendiente' }}
                    </span>
                    <!-- Botón ⋮ -->
                    <button @click.stop="toggleMenu($event, item.id)"
                      class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95"
                      :class="isDark ? 'bg-[#273045] border-[#2d3548] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'">
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
          :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-100 bg-slate-50'">
          <p class="text-[9px] font-black uppercase tracking-widest" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
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
              <div class="w-7 h-7 rounded-lg bg-[#FF8F00]/10 flex items-center justify-center text-[10px] font-black text-[#FF8F00]">
                {{ item.nombre?.charAt(0) ?? '?' }}
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] font-black uppercase tracking-tight" :class="isDark ? 'text-white' : 'text-slate-800'">{{ item.nombre }}</span>
                <span class="text-[9px] opacity-50">CC: {{ item.cedula }}</span>
              </div>
            </div>
            <!-- Estado carpeta -->
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase border"
              :class="getEstadoVisual(item).bg">
              <i :class="getEstadoVisual(item).icon" :style="{ color: getEstadoVisual(item).color }"></i>
              <span :style="{ color: getEstadoVisual(item).color }">{{ getEstadoVisual(item).label }}</span>
            </span>
          </div>
          <p class="text-[10px] opacity-60 line-clamp-2" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ item.descripcion }}</p>
          <button @click="verSoporte(item.id)"
            class="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase italic tracking-widest shadow-md"
            :class="isDark ? 'bg-[#FF8F00] text-black' : 'bg-slate-800 text-white'">
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
        <div v-if="modalEstados.open"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: rgba(0,0,0,0.7)" @click.self="modalEstados.open = false">

          <div class="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
            :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

            <!-- Header -->
            <div class="flex items-center justify-between px-5 py-3.5 border-b"
              :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
              <div class="flex items-center gap-2">
                <i class="fas fa-folder-plus text-[#FF8F00]"></i>
                <h3 class="text-sm font-black uppercase tracking-widest" :class="isDark ? 'text-white' : 'text-slate-800'">
                  Mis estados CH
                </h3>
              </div>
              <button @click="modalEstados.open = false"
                class="w-7 h-7 rounded-lg flex items-center justify-center border"
                :class="isDark ? 'bg-[#273045] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-500 border-slate-200'">
                <i class="fas fa-xmark text-xs"></i>
              </button>
            </div>

            <!-- Formulario crear / editar carpeta -->
            <div class="px-5 py-4 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
              <p class="text-[9px] font-black uppercase tracking-widest mb-3" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                {{ editandoEstado ? '✏️ Editando carpeta' : 'Nueva carpeta' }}
              </p>
              <div class="flex gap-2">
                <!-- Nombre -->
                <input v-model="nuevoEstado.nombre" type="text" placeholder="Nombre de la carpeta..."
                  class="flex-1 px-3 py-2 rounded-lg border text-[11px] font-bold outline-none transition-all focus:ring-1 focus:ring-[#FF8F00]/40"
                  :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-800'"
                  @keyup.enter="guardarEstadoCh" />
                <!-- Color -->
                <input type="color" v-model="nuevoEstado.color"
                  class="w-9 h-9 rounded-lg border cursor-pointer p-0.5 shrink-0"
                  :class="isDark ? 'bg-[#273045] border-[#2d3548]' : 'bg-white border-slate-200'"
                  title="Color" />
                <!-- Icono -->
                <select v-model="nuevoEstado.icono"
                  class="px-2 py-2 rounded-lg border text-[10px] font-bold outline-none shrink-0"
                  :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white' : 'bg-white border-slate-200 text-slate-700'">
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
                  class="px-3 py-2 rounded-lg text-[10px] font-black uppercase italic tracking-widest transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  :class="editandoEstado ? 'bg-emerald-500 text-white' : 'bg-[#FF8F00] text-black'">
                  <i v-if="loadingEstado" class="fas fa-circle-notch fa-spin text-[9px]"></i>
                  <i v-else :class="editandoEstado ? 'fas fa-check' : 'fas fa-plus'" class="text-[9px]"></i>
                </button>
                <!-- Cancelar edición -->
                <button v-if="editandoEstado" @click="cancelarEdicion"
                  class="px-2 py-2 rounded-lg border text-[10px] font-black transition-all"
                  :class="isDark ? 'border-[#2d3548] text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'">
                  <i class="fas fa-xmark text-[9px]"></i>
                </button>
              </div>

              <!-- Preview -->
              <div v-if="nuevoEstado.nombre.trim()" class="mt-2 flex items-center gap-1.5">
                <span class="text-[9px] opacity-50" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Vista previa:</span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-current/20 bg-current/10"
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
              <p class="text-[9px] font-black uppercase tracking-widest mb-2" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                Carpetas Capital Humano ({{ estadosCh.length }})
              </p>
              <div v-if="!estadosCh.length" class="text-[11px] opacity-40 text-center py-4" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                No hay carpetas aún.
              </div>
              <div v-else class="flex flex-col gap-1.5">
                <div v-for="est in estadosCh" :key="est.id"
                  class="flex items-center justify-between px-3 py-2 rounded-lg border transition-all"
                  :class="[isDark ? 'bg-[#273045] border-[#3d4558]' : 'bg-slate-50 border-slate-200',
                    editandoEstado?.id === est.id ? 'ring-1 ring-[#FF8F00]' : '']">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-current/20 bg-current/10"
                      :style="{ color: est.color }">
                      <i :class="est.icono"></i>
                      {{ est.nombre }}
                    </span>
                    <span class="text-[9px] opacity-40" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                      {{ novedades.filter(n => n.estadoCh === est.nombre).length }} nov.
                    </span>
                  </div>
                  <div class="flex items-center gap-1">
                    <!-- Editar -->
                    <button @click="iniciarEdicionEstado(est)"
                      class="w-6 h-6 rounded-lg flex items-center justify-center border text-[9px] transition-all hover:bg-[#FF8F00]/10 hover:text-[#FF8F00] hover:border-[#FF8F00]/30"
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
        <div v-if="selectorCh.open"
          class="fixed inset-0 z-[60] flex items-center justify-center"
          style="background: rgba(0,0,0,0.6)" @click.self="selectorCh.open = false">

          <div class="w-full max-w-xs rounded-2xl border shadow-2xl overflow-hidden"
            :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

            <div class="flex items-center justify-between px-4 py-3 border-b"
              :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
              <span class="text-[11px] font-black uppercase tracking-widest" :class="isDark ? 'text-white' : 'text-slate-700'">
                <i class="fas fa-folder-open text-[#FF8F00] mr-2"></i>Asignar estado
              </span>
              <button @click="selectorCh.open = false"
                class="w-6 h-6 rounded-lg flex items-center justify-center border"
                :class="isDark ? 'bg-[#273045] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-500 border-slate-200'">
                <i class="fas fa-xmark text-xs"></i>
              </button>
            </div>

            <div class="p-3 flex flex-col gap-1.5 max-h-72 overflow-y-auto">
              <!-- Opción quitar estado -->
              <button @click="asignarEstadoCh(selectorCh.novedad, null)"
                class="flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-black uppercase transition-all hover:bg-slate-500/10"
                :class="isDark ? 'border-[#2d3548] text-slate-400' : 'border-slate-200 text-slate-500'">
                <i class="fas fa-folder-minus"></i> Sin estado
              </button>
              <!-- Estados CH disponibles -->
              <button v-for="est in estadosCh" :key="'sel-'+est.id"
                @click="asignarEstadoCh(selectorCh.novedad, est.nombre)"
                class="flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110"
                :class="selectorCh.novedad?.estadoCh === est.nombre
                  ? 'ring-2 ring-offset-1'
                  : (isDark ? 'border-[#2d3548]' : 'border-slate-200')"
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
        <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: rgba(0,0,0,0.7)" @click.self="modalOpen = false">
          <div class="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            :class="isDark ? 'bg-[#1e2538]' : 'bg-white'">
            <div class="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
              :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
              <div class="flex items-center gap-2">
                <i class="fas fa-eye text-[#FF8F00] text-xs"></i>
                <span class="text-[11px] font-black uppercase tracking-widest" :class="isDark ? 'text-white' : 'text-slate-700'">Soporte</span>
                <span class="text-[10px] opacity-50" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ modalNombre }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <a v-if="modalFileUrl" :href="modalFileUrl" target="_blank"
                  class="px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 transition-all hover:brightness-110"
                  :class="isDark ? 'bg-[#273045] text-slate-300 border-[#3d4558]' : 'bg-slate-100 text-slate-600 border-slate-200'">
                  <i class="fas fa-external-link-alt text-[#FF8F00]"></i> Abrir
                </a>
                <button @click="modalOpen = false" class="w-7 h-7 rounded-lg flex items-center justify-center border"
                  :class="isDark ? 'bg-[#273045] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-500 border-slate-200'">
                  <i class="fas fa-xmark text-xs"></i>
                </button>
              </div>
            </div>
            <div class="flex-1 overflow-auto flex items-center justify-center p-3 min-h-[400px]"
              :class="isDark ? 'bg-[#151c2c]' : 'bg-slate-50'">
              <div v-if="modalLoading" class="flex flex-col items-center gap-3">
                <i class="fas fa-circle-notch fa-spin text-[#FF8F00] text-2xl"></i>
              </div>
              <img v-else-if="modalIsImage && modalFileUrl" :src="modalFileUrl" class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-xl" />
              <iframe v-else-if="modalIsPdf && modalFileUrl" :src="modalFileUrl" class="w-full rounded-lg border-0" style="height: 70vh" />
              <div v-else class="flex flex-col items-center gap-4 opacity-60">
                <i class="fas fa-file text-5xl" :class="isDark ? 'text-slate-500' : 'text-slate-400'"></i>
                <a v-if="modalFileUrl" :href="modalFileUrl" target="_blank" class="text-[#FF8F00] underline font-bold text-xs">Abrir archivo</a>
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
        <div v-if="menuAbierto !== null" class="fixed z-50 w-40 rounded-xl border shadow-2xl overflow-hidden"
          :style="{ top: menuPos.y + 'px', left: menuPos.x + 'px' }"
          :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">
          <button @click="verSoporte(menuAbierto); menuAbierto = null"
            class="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase italic tracking-widest transition-all hover:bg-[#FF8F00]/10"
            :class="isDark ? 'text-slate-300' : 'text-slate-700'">
            <i class="fas fa-eye text-[#FF8F00] w-3"></i> Ver soporte
          </button>
          <div class="border-t mx-2" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'"></div>
          <button @click="abrirAccion(itemMenuActual, 1); menuAbierto = null"
            :disabled="itemMenuActual?.aprobadoRrhh === 1"
            class="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase italic tracking-widest transition-all hover:bg-emerald-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
            :class="isDark ? 'text-emerald-400' : 'text-emerald-600'">
            <i class="fas fa-check w-3"></i> Aprobar
          </button>
          <button @click="abrirAccion(itemMenuActual, 0); menuAbierto = null"
            :disabled="itemMenuActual?.aprobadoRrhh === 0"
            class="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase italic tracking-widest transition-all hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
            :class="isDark ? 'text-red-400' : 'text-red-500'">
            <i class="fas fa-xmark w-3"></i> Rechazar
          </button>
        </div>
      </transition>
    </teleport>

    <!-- Modal aprobar/rechazar RRHH -->
    <teleport to="body">
      <div v-if="accionModal.open"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @mousedown.self="accionModal.open = false">
        <div class="w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl"
          :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">
          <div class="flex items-center gap-2">
            <i :class="accionModal.tipo === 1 ? 'fas fa-check-circle text-emerald-500' : 'fas fa-times-circle text-red-400'" class="text-lg"></i>
            <h3 class="text-sm font-black uppercase tracking-widest" :class="isDark ? 'text-white' : 'text-slate-800'">
              {{ accionModal.tipo === 1 ? 'Aprobar' : 'Rechazar' }} novedad
            </h3>
          </div>
          <p class="text-[10px] font-bold opacity-60" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ accionModal.nombre }}</p>
          <div class="flex flex-col gap-1.5">
            <label class="text-[9px] font-black uppercase tracking-widest" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
              Motivo <span class="text-red-400">*</span>
            </label>
            <textarea v-model="accionModal.motivo" rows="3"
              :placeholder="accionModal.tipo === 1 ? 'Motivo de aprobación...' : 'Motivo de rechazo...'"
              class="px-3 py-2.5 rounded-lg border text-xs font-medium outline-none resize-none transition-all placeholder:text-slate-500"
              :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white' : 'bg-white border-slate-200 text-slate-800'">
            </textarea>
          </div>
          <div class="flex gap-2 pt-1">
            <button @click="accionModal.open = false"
              class="flex-1 py-2 rounded-lg text-[10px] font-black uppercase italic border transition-all"
              :class="isDark ? 'border-[#2d3548] text-slate-400 hover:text-slate-200' : 'border-slate-200 text-slate-500 hover:text-slate-700'">
              Cancelar
            </button>
            <button @click="confirmarAccion" :disabled="!accionModal.motivo.trim()"
              class="flex-1 py-2 rounded-lg text-[10px] font-black uppercase italic transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              :class="accionModal.tipo === 1 ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-red-500 text-white hover:bg-red-600'">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Modal ver motivo -->
    <teleport to="body">
      <div v-if="motivoModal.open"
        class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @mousedown.self="motivoModal.open = false">
        <div class="w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl"
          :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">
          <div class="flex items-center gap-2">
            <i class="fas fa-comment-alt text-[#FF8F00]"></i>
            <h3 class="text-sm font-black uppercase tracking-widest" :class="isDark ? 'text-white' : 'text-slate-800'">
              {{ motivoModal.titulo }}
            </h3>
          </div>
          <p class="text-[15px] font-medium leading-relaxed" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
            {{ motivoModal.texto }}
          </p>
          <button @click="motivoModal.open = false"
            class="py-2 rounded-lg text-[10px] font-black uppercase italic border"
            :class="isDark ? 'border-[#2d3548] text-slate-400' : 'border-slate-200 text-slate-500'">
            Cerrar
          </button>
        </div>
      </div>
    </teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNovedades, getEstadoVisual } from '../../composables/adminLogica/useNovedades';

const props = defineProps({ isDark: Boolean, company: String });

const {
  novedades,
  loading,
  error,
  fetchNovedades,
  fetchNovedad,
  aprobarRrhh,
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
const tabEstado = ref(''); // '' | 'nueva' | 'revision' | 'aprobada' | 'rechazada' | 'ch:NombreEstado'

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
const accionModal = ref({ open: false, tipo: 1, id: null, nombre: '', motivo: '' });

// Modal gestión estados CH
const modalEstados = ref({ open: false });
const nuevoEstado = ref({ nombre: '', icono: 'fas fa-folder', color: '#FF8F00' });
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
  return texto.replace(regex, '<mark class="bg-[#FF8F00]/30 text-inherit rounded px-0.5">$1</mark>');
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
    nuevoEstado.value = { nombre: '', icono: 'fas fa-folder', color: '#FF8F00' };
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
  nuevoEstado.value = { nombre: '', icono: 'fas fa-folder', color: '#FF8F00' };
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

// ─── Modal aprobar/rechazar ───────────────────────────────────────
const abrirAccion = (item, tipo) => {
  accionModal.value = { open: true, tipo, id: item.id, nombre: item.nombre, motivo: '' };
};

const confirmarAccion = async () => {
  if (!accionModal.value.motivo.trim()) return;
  try {
    await aprobarRrhh(accionModal.value.id, accionModal.value.tipo, accionModal.value.motivo);
    accionModal.value.open = false;
  } catch (e) {
    console.error('Error en confirmarAccion:', e);
  }
};

// ─── Modal ver motivo ─────────────────────────────────────────────
const verMotivo = (texto, titulo = 'Motivo') => {
  motivoModal.value = { open: true, titulo, texto };
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
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.fade-msg-enter-active, .fade-msg-leave-active { transition: all 0.2s ease; }
.fade-msg-enter-from, .fade-msg-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
