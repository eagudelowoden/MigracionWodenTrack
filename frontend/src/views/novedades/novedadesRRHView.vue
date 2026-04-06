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
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Revision de Novedades</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-1.5">

        <!-- Búsqueda por nombre -->
        <div
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border focus-within:ring-1 focus-within:ring-[#FF8F00]/30 transition-all"
          :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-200 bg-white'">
          <i class="fas fa-search text-[#FF8F00] text-[9px]"></i>
          <input v-model="filters.nombre" type="text" placeholder="Buscar por nombre..."
            class="bg-transparent text-[10px] font-bold outline-none w-36 placeholder:font-normal placeholder:text-slate-500"
            :class="isDark ? 'text-white' : 'text-slate-700'" />
          <button v-if="filters.nombre" @click="filters.nombre = ''"
            class="opacity-40 hover:opacity-80 transition-opacity">
            <i class="fas fa-xmark text-[9px]" :class="isDark ? 'text-slate-300' : 'text-slate-600'"></i>
          </button>
        </div>

        <!-- Filtro fecha -->
        <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
          :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-200 bg-white'">
          <i class="fas fa-calendar-day text-[#FF8F00] text-[9px]"></i>
          <input type="date" v-model="filters.fecha"
            class="bg-transparent text-[10px] font-bold outline-none cursor-pointer"
            :class="isDark ? 'text-white [color-scheme:dark]' : 'text-slate-700'" />
        </div>

        <!-- Badge fecha activa -->
        <div v-if="filters.fecha"
          class="flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest"
          :class="isDark ? 'border-[#FF8F00]/30 bg-[#FF8F00]/10 text-[#FF8F00]' : 'border-[#FF8F00]/30 bg-[#FF8F00]/5 text-[#FF8F00]'">
          <i class="fas fa-filter text-[8px]"></i>
          {{ formatFecha(filters.fecha) }}
        </div>

        <!-- Reset -->
        <button @click="resetFilters" class="p-1.5 rounded-lg border transition-colors hover:text-[#FF8F00]"
          :class="isDark ? 'border-[#2d3548] bg-[#273045] text-slate-400' : 'border-slate-200 bg-white text-slate-500'">
          <i class="fas fa-sync-alt text-[10px]" :class="{ 'fa-spin': loading }"></i>
        </button>

      </div>
    </div>

    <!-- Tabla -->
    <div class="flex-1 flex flex-col w-full overflow-hidden rounded-2xl border transition-all duration-500"
      :class="isDark ? 'bg-[#1e2538] border-[#2d3548] shadow-black/40' : 'bg-white border-slate-200 shadow-slate-100'">

      <!-- Loading -->
      <div v-if="loading" class="flex-1 flex items-center justify-center gap-3">
        <i class="fas fa-circle-notch fa-spin text-[#FF8F00]"></i>
        <span class="text-[11px] font-black uppercase tracking-widest"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cargando novedades...</span>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="flex-1 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3 opacity-70">
          <i class="fas fa-exclamation-triangle text-red-400 text-2xl"></i>
          <p class="text-[11px] font-bold text-red-400">Error al cargar los registros</p>
          <button @click="fetchNovedades"
            class="px-4 py-2 rounded-lg text-[9px] font-black uppercase bg-[#FF8F00] text-black">
            Reintentar
          </button>
        </div>
      </div>

      <!-- Sin resultados -->
      <div v-else-if="novedadesFiltradas.length === 0" class="flex-1 flex items-center justify-center">
        <div class="flex flex-col items-center gap-2 opacity-50">
          <i class="fas fa-inbox text-3xl" :class="isDark ? 'text-slate-500' : 'text-slate-400'"></i>
          <p class="text-[11px] font-black uppercase tracking-widest"
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
                  class="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Colaborador</th>
                <th
                  class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Inicio</th>
                <th
                  class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Fin</th>
                <th
                  class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Días</th>
                <th
                  class="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Descripción</th>
                <th
                  class="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Tificación</th>
                <th
                  class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Motivo Jefe Directo
                </th>
                <th
                  class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Motivo Jefe Directo
                </th>
                <th
                  class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Modo</th>
                <th
                  class="px-4 py-2.5 text-right text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Soporte</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in novedadesFiltradas" :key="item.id" class="group transition-all duration-150"
                :class="[
                  idx % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-transparent',
                  isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-orange-50'
                ]">

                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <div class="flex items-center gap-2.5">
                    <div
                      class="w-7 h-7 rounded-lg bg-[#FF8F00]/10 flex items-center justify-center text-[10px] font-black text-[#FF8F00] shrink-0">
                      {{ item.nombre?.charAt(0) ?? '?' }}
                    </div>
                    <div class="flex flex-col">
                      <span class="text-[11px] font-bold uppercase tracking-tight"
                        :class="isDark ? 'text-white' : 'text-slate-900'" v-html="highlight(item.nombre)"></span>
                      <span class="text-[9px] font-medium opacity-50">CC: {{ item.cedula }}</span>
                    </div>
                  </div>
                </td>

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

                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <span class="text-[12px] font-black" :class="isDark ? 'text-white' : 'text-slate-800'">
                    {{ calcDias(item.fechaInicio ?? item.fecha_inicio, item.fechaFin ?? item.fecha_fin) }}
                  </span>
                </td>

                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <p class="text-[11px] font-medium line-clamp-2 max-w-[200px]"
                    :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ item.descripcion }}</p>
                </td>

                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <p class="text-[11px] font-medium line-clamp-2 max-w-[200px]"
                    :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ item.tipificacion }}</p>
                </td>
                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <span v-if="item.motivoRrhh" @click="verMotivo(item.motivoRrhh, 'Motivo Capital Humano')"
                    class="cursor-pointer text-[12px] font-bold text-[#FF8F00] hover:underline">
                    <i class="fas fa-comment-alt mr-1"></i>Ver
                  </span>
                  <span v-else class="text-[11px] opacity-30">—</span>
                </td>

                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <span v-if="item.motivoJefe" @click="verMotivos(item.motivoJefe)"
                    class="cursor-pointer text-[12px] font-bold text-[#FF8F00] hover:underline">
                    <i class="fas fa-comment-alt mr-1"></i>Ver
                  </span>
                  <span v-else class="text-[11px] opacity-30">—</span>
                </td>

                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <span class="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter" :class="(item.soporteStorageMode ?? item.soporte_storage_mode) === 's3'
                    ? 'bg-[#FF8F00]/10 text-[#FF8F00]'
                    : 'bg-emerald-500/10 text-emerald-500'">
                    <i
                      :class="(item.soporteStorageMode ?? item.soporte_storage_mode) === 's3' ? 'fab fa-aws mr-1' : 'fas fa-hard-drive mr-1'"></i>
                    {{ (item.soporteStorageMode ?? item.soporte_storage_mode) === 's3' ? 'S3' : 'Local' }}
                  </span>
                </td>

                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <div class="flex items-center justify-end gap-2">

                    <!-- Badge estado -->
                    <span class="px-2 py-0.5 rounded-md text-[8px] uppercase tracking-widest border"
                      style="font-family: 'Nunito', sans-serif; font-weight: 900;"
                      :class="item.aprobado === 1
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : item.aprobado === 0
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : (isDark ? 'bg-[#2d3548] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-400 border-slate-200')">
                      <i :class="item.aprobado === 1 ? 'fas fa-check' : item.aprobado === 0 ? 'fas fa-xmark' : 'fas fa-clock'"
                        class="mr-1"></i>
                      {{ item.aprobado === 1 ? 'Aprobada' : item.aprobado === 0 ? 'Rechazada' : 'Pendiente' }}
                    </span>

                    <!-- Botón ⋮ -->
                    <div class="relative">
                      <button @click.stop="toggleMenu($event, item.id)"
                        class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95"
                        :class="isDark ? 'bg-[#273045] border-[#2d3548] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'">
                        <i class="fas fa-ellipsis-vertical text-[10px]"></i>
                      </button>
                    </div>

                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="px-4 py-1.5 border-t shrink-0 flex items-center justify-between"
          :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-100 bg-slate-50'">
          <p class="text-[9px] font-black uppercase tracking-widest"
            :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            Resultados: <span :class="isDark ? 'text-white' : 'text-slate-800'">{{ novedadesFiltradas.length }}</span>
            <span v-if="filters.fecha" class="ml-2 opacity-60">— {{ formatFecha(filters.fecha) }}</span>
            <span v-if="filters.nombre" class="ml-2 opacity-60">— "{{ filters.nombre }}"</span>
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
                class="w-7 h-7 rounded-lg bg-[#FF8F00]/10 flex items-center justify-center text-[10px] font-black text-[#FF8F00]">
                {{ item.nombre?.charAt(0) ?? '?' }}
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] font-black uppercase tracking-tight"
                  :class="isDark ? 'text-white' : 'text-slate-800'" v-html="highlight(item.nombre)"></span>
                <span class="text-[9px] opacity-50">CC: {{ item.cedula }}</span>
              </div>
            </div>
            <span class="text-[10px] font-black text-[#FF8F00]">
              {{ calcDias(item.fechaInicio ?? item.fecha_inicio, item.fechaFin ?? item.fecha_fin) }} días
            </span>
          </div>
          <p class="text-[10px] opacity-60 line-clamp-2" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
            {{ item.descripcion }}
          </p>
          <div class="flex items-center justify-between text-[17px] font-bold uppercase opacity-50">
            <span>{{ formatFecha(item.fechaInicio ?? item.fecha_inicio) }} → {{ formatFecha(item.fechaFin ??
              item.fecha_fin) }}</span>
          </div>
          <button @click="verSoporte(item.id)"
            class="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase italic tracking-widest shadow-md"
            :class="isDark ? 'bg-[#FF8F00] text-black' : 'bg-slate-800 text-white'">
            <i class="fas fa-eye"></i> Ver Soporte
          </button>
        </div>
      </div>

    </div>

    <!-- Modal -->
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
                <span class="text-[11px] font-black uppercase tracking-widest"
                  :class="isDark ? 'text-white' : 'text-slate-700'">Soporte</span>
                <span class="text-[10px] opacity-50" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                  {{ modalNombre }}
                </span>
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
                <span class="text-[11px] font-black uppercase tracking-widest opacity-50"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cargando archivo...</span>
              </div>
              <img v-else-if="modalIsImage && modalFileUrl" :src="modalFileUrl"
                class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-xl" />
              <iframe v-else-if="modalIsPdf && modalFileUrl" :src="modalFileUrl" class="w-full rounded-lg border-0"
                style="height: 70vh" title="Soporte PDF" />
              <div v-else class="flex flex-col items-center gap-4 opacity-60">
                <i class="fas fa-file text-5xl" :class="isDark ? 'text-slate-500' : 'text-slate-400'"></i>
                <p class="text-xs text-center" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                  Vista previa no disponible.<br />
                  <a v-if="modalFileUrl" :href="modalFileUrl" target="_blank"
                    class="text-[#FF8F00] underline font-bold mt-1 block">Abrir archivo</a>
                </p>
              </div>
            </div>

          </div>
        </div>
      </transition>
    </teleport>

    <!-- Fuera de la tabla, dentro del template principal -->
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

          <button @click="abrirAccion(itemMenuActual, 1); menuAbierto = null" :disabled="itemMenuActual?.aprobado === 1"
            class="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase italic tracking-widest transition-all hover:bg-emerald-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
            :class="isDark ? 'text-emerald-400' : 'text-emerald-600'">
            <i class="fas fa-check w-3"></i> Aprobar
          </button>

          <button @click="abrirAccion(itemMenuActual, 0); menuAbierto = null" :disabled="itemMenuActual?.aprobado === 0"
            class="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase italic tracking-widest transition-all hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
            :class="isDark ? 'text-red-400' : 'text-red-500'">
            <i class="fas fa-xmark w-3"></i> Rechazar
          </button>

        </div>
      </transition>
    </teleport>
    <!-- Modal motivo -->
    <teleport to="body">
      <div v-if="accionModal.open"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @mousedown.self="accionModal.open = false">

        <div class="w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl"
          :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

          <div class="flex items-center gap-2">
            <i :class="accionModal.tipo === 1 ? 'fas fa-check-circle text-emerald-500' : 'fas fa-times-circle text-red-400'"
              class="text-lg"></i>
            <h3 class="text-sm font-black uppercase tracking-widest" :class="isDark ? 'text-white' : 'text-slate-800'">
              {{ accionModal.tipo === 1 ? 'Aprobar' : 'Rechazar' }} novedad
            </h3>
          </div>

          <p class="text-[10px] font-bold opacity-60" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
            {{ accionModal.nombre }}
          </p>

          <div class="flex flex-col gap-1.5">
            <label class="text-[9px] font-black uppercase tracking-widest"
              :class="isDark ? 'text-slate-400' : 'text-slate-500'">
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
    <!-- Modal motivo ver -->
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

    <teleport to="body">
      <div v-if="motivoModalJefe.open"
        class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @mousedown.self="motivoModalJefe.open = false">
        <div class="w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl"
          :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">
          <div class="flex items-center gap-2">
            <i class="fas fa-comment-alt text-[#FF8F00]"></i>
            <h3 class="text-sm font-black uppercase tracking-widest" :class="isDark ? 'text-white' : 'text-slate-800'">
              Motivo Jefe Directo
            </h3>
          </div>
          <p class="text-[15px] font-medium leading-relaxed" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
            {{ motivoModalJefe.texto }}
          </p>
          <button @click="motivoModalJefe.open = false"
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
import { useNovedades } from '../../composables/adminLogica/useNovedades';

const props = defineProps({ isDark: Boolean, company: String });

const {
  novedades,
  loading,
  error,
  fetchNovedades,
  fetchNovedad,
  aprobarRrhh,   // ← cambia aprobarNovedad por aprobarRrhh
  eliminarNovedad,
  getFileUrl
} = useNovedades();

const filters = ref({ fecha: '', nombre: '' });

const mensajeVacio = computed(() =>
  filters.value.nombre || filters.value.fecha
    ? 'Sin resultados para el filtro aplicado'
    : 'No hay novedades registradas'
);

const modalOpen = ref(false);
const modalLoading = ref(false);
const modalFileUrl = ref('');
const modalNombre = ref('');
const modalMime = ref('');
const menuAbierto = ref(null);
const itemMenuActual = ref(null);
const menuPos = ref({ x: 0, y: 0 });

const toggleMenu = (event, id) => {
  if (menuAbierto.value === id) {
    menuAbierto.value = null;
    return;
  }
  const btn = event.currentTarget.getBoundingClientRect();
  menuPos.value = {
    x: btn.right - 160,
    y: btn.bottom + 6,
  };
  itemMenuActual.value = novedadesFiltradas.value.find(n => n.id === id);
  menuAbierto.value = id;
};

const modalIsImage = computed(() => /image\/(jpeg|jpg|png|gif|webp|svg)/.test(modalMime.value));
const modalIsPdf = computed(() => modalMime.value === 'application/pdf');

const motivoModalJefe = ref({ open: false, texto: '' });

const verMotivos = (motivojefe) => {
  motivoModalJefe.value = { open: true, texto: motivojefe };
};

const motivoModal = ref({ open: false, texto: '', titulo: '' });

const verMotivo = (texto, titulo = 'Motivo') => {
  motivoModal.value = { open: true, texto, titulo };
};
onMounted(() => fetchNovedades());

const novedadesFiltradas = computed(() => {
  return novedades.value.filter((n) => {
    const matchNombre = !filters.value.nombre ||
      (n.nombre ?? '').toLowerCase().includes(filters.value.nombre.toLowerCase());

    if (!filters.value.fecha) return matchNombre;

    const inicio = n.fechaInicio ?? n.fecha_inicio ?? '';
    const fin = n.fechaFin ?? n.fecha_fin ?? '';
    const matchFecha = filters.value.fecha >= inicio.slice(0, 10) &&
      filters.value.fecha <= fin.slice(0, 10);

    return matchNombre && matchFecha;
  });
});

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
  filters.value = { fecha: '', nombre: '' };
  fetchNovedades();
};

const accionModal = ref({
  open: false, tipo: 1, id: null, nombre: '', motivo: ''
});

const abrirAccion = (item, tipo) => {
  accionModal.value = { open: true, tipo, id: item.id, nombre: item.nombre, motivo: '' };
};

const confirmarAccion = async () => {
  if (!accionModal.value.motivo.trim()) return;
  try {
    await aprobarRrhh(  // ← usa aprobarRrhh
      accionModal.value.id,
      accionModal.value.tipo,
      accionModal.value.motivo
    );
    accionModal.value.open = false;
  } catch (e) {
    console.error('Error en confirmarAccion:', e);
  }
};

const verSoporte = async (id) => {
  modalOpen.value = true;
  modalLoading.value = true;
  modalFileUrl.value = '';
  modalMime.value = '';
  try {
    const detalle = await fetchNovedad(id);
    modalNombre.value = detalle.nombre ?? detalle.data?.nombre ?? '';
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
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
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
</style>