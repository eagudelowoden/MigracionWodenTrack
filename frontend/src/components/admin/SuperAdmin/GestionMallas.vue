<template>
  <div class="h-full flex flex-col gap-3 animate-fade-in">

    <!-- HEADER -->
    <div class="flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all"
      :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
      <div class="flex items-center gap-3">
        <div class="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <i class="fas fa-calendar-alt text-blue-500 text-xs"></i>
        </div>
        <div>
          <h2 class="text-[11px] font-semibold uppercase tracking-wider"
            :class="isDark ? 'text-white' : 'text-slate-700'">Gestión de Mallas</h2>
          <p class="text-[9px] font-medium opacity-40 uppercase tracking-wide"
            :class="isDark ? 'text-white' : 'text-slate-500'">
            {{ mallas.length }} mallas · {{ mallasFiltradas.length }} mostrando
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button @click="descargarPlantilla"
          class="h-7 px-3 rounded-lg border text-[9px] font-semibold uppercase tracking-wide transition-all flex items-center gap-1.5"
          :class="isDark ? 'border-white/10 text-white/50 hover:bg-white/5 hover:text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'">
          <i class="fas fa-download text-[9px]"></i> Plantilla
        </button>
        <button @click="panelUpload = !panelUpload"
          class="h-7 px-3 rounded-lg border text-[9px] font-semibold uppercase tracking-wide transition-all flex items-center gap-1.5"
          :class="panelUpload
            ? 'bg-indigo-500 border-indigo-500 text-white'
            : isDark ? 'border-white/10 text-white/50 hover:bg-white/5 hover:text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'">
          <i class="fas fa-file-excel text-[9px]"></i> Carga masiva
        </button>
        <button @click="panelForm = !panelForm"
          class="h-8 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all flex items-center gap-2"
          :class="panelForm
            ? 'bg-slate-500 text-white'
            : 'bg-blue-500 text-white hover:bg-blue-400'">
          <i :class="panelForm ? 'fas fa-times' : 'fas fa-plus'" class="text-[10px]"></i>
          {{ panelForm ? 'Cancelar' : 'Nueva Malla' }}
        </button>
      </div>
    </div>

    <!-- PANEL: CARGA MASIVA EXCEL -->
    <Transition name="slide-down">
      <div v-if="panelUpload" class="rounded-xl border overflow-hidden transition-all"
        :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
        <div class="px-3 py-2 border-b flex items-center gap-2"
          :class="isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'">
          <i class="fas fa-file-excel text-indigo-400 text-[10px]"></i>
          <span class="text-[10px] font-semibold uppercase tracking-wider opacity-60"
            :class="isDark ? 'text-white' : 'text-slate-600'">Crear mallas desde Excel</span>
        </div>
        <div class="p-4 flex items-center gap-4">
          <label class="flex-1 flex flex-col items-center gap-2 border-2 border-dashed rounded-xl py-6 cursor-pointer transition-all"
            :class="isDark ? 'border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50'">
            <i class="fas fa-cloud-upload-alt text-2xl opacity-30"
              :class="isDark ? 'text-white' : 'text-slate-400'"></i>
            <span class="text-[10px] font-semibold uppercase tracking-wide opacity-50"
              :class="isDark ? 'text-white' : 'text-slate-500'">
              {{ archivoExcel ? archivoExcel.name : 'Seleccionar archivo .xlsx' }}
            </span>
            <input type="file" accept=".xlsx,.xls" class="hidden" @change="onFileChange" />
          </label>

          <div class="text-[9px] space-y-1 opacity-50 shrink-0 max-w-[180px]"
            :class="isDark ? 'text-white' : 'text-slate-500'">
            <p class="font-bold uppercase">Formato esperado:</p>
            <p>Col 1: nombre malla</p>
            <p>Col 2: compañía</p>
            <p>Col 3: día (0=Lun…6=Dom)</p>
            <p>Col 4: hora inicio (7.00)</p>
            <p>Col 5: hora fin (17.00)</p>
            <p>Col 6: periodo</p>
          </div>

          <button @click="subirExcel" :disabled="!archivoExcel || cargandoExcel"
            class="h-10 px-5 rounded-xl bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wide disabled:opacity-30 hover:bg-indigo-400 transition-all flex items-center gap-2 shrink-0">
            <i class="fas text-[10px]" :class="cargandoExcel ? 'fa-circle-notch fa-spin' : 'fa-upload'"></i>
            {{ cargandoExcel ? 'Procesando...' : 'Subir' }}
          </button>
        </div>

        <div v-if="resultadoUpload" class="px-4 pb-4">
          <div class="rounded-lg px-3 py-2 text-[10px] font-medium border"
            :class="resultadoUpload.errores?.length
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'">
            <p class="font-bold">
              {{ resultadoUpload.creadas }} mallas creadas ·
              {{ resultadoUpload.omitidas }} ya existían ·
              {{ resultadoUpload.errores?.length || 0 }} errores
            </p>
            <ul v-if="resultadoUpload.errores?.length" class="mt-1 space-y-0.5 list-disc list-inside opacity-80">
              <li v-for="e in resultadoUpload.errores" :key="e">{{ e }}</li>
            </ul>
          </div>
        </div>
      </div>
    </Transition>

    <!-- PANEL: FORMULARIO CREAR MALLA -->
    <!-- overflow-visible permite que los dropdowns de hora en el Domingo no queden ocultos -->
    <Transition name="slide-down">
      <div v-if="panelForm" class="rounded-xl border transition-all"
        :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
        <div class="px-3 py-2 border-b rounded-t-xl"
          :class="isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'">
          <span class="text-[10px] font-semibold uppercase tracking-wider opacity-60"
            :class="isDark ? 'text-white' : 'text-slate-600'">Nueva malla horaria</span>
        </div>
        <div class="p-4 space-y-4">

          <!-- Nombre y compañía -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[9px] font-bold uppercase tracking-wider mb-1 opacity-50"
                :class="isDark ? 'text-white' : 'text-slate-600'">Nombre *</label>
              <input v-model="form.nombre" type="text" placeholder="(ADM) ADMIN-001 Colombia L-V 7-17"
                class="w-full px-3 py-2 rounded-lg border text-[11px] outline-none transition-all"
                :class="isDark
                  ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-blue-500/50'
                  : 'bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-300 focus:border-blue-400'" />
            </div>
            <div>
              <label class="block text-[9px] font-bold uppercase tracking-wider mb-1 opacity-50"
                :class="isDark ? 'text-white' : 'text-slate-600'">Compañía</label>
              <input v-model="form.compania" type="text" placeholder="(CO) WODEN COLOMBIA SAS"
                class="w-full px-3 py-2 rounded-lg border text-[11px] outline-none transition-all"
                :class="isDark
                  ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-blue-500/50'
                  : 'bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-300 focus:border-blue-400'" />
            </div>
          </div>

          <!-- Tabla de días — sin overflow-hidden para que los dropdowns de la última fila sean visibles -->
          <div class="rounded-xl border"
            :class="isDark ? 'border-white/10' : 'border-slate-200'">
            <table class="w-full text-[10px] border-collapse">
              <thead>
                <tr :class="isDark ? 'bg-white/5' : 'bg-slate-50'">
                  <th class="px-3 py-2 text-left font-semibold uppercase tracking-wider opacity-50 w-8 rounded-tl-xl">
                    <i class="fas fa-check"></i>
                  </th>
                  <th class="px-3 py-2 text-left font-semibold uppercase tracking-wider opacity-50">Día</th>

                  <!-- HEADER HORA INICIO — abre dropdown masivo -->
                  <th class="px-3 py-2 text-left">
                    <div class="relative inline-block">
                      <button @click="toggleHeaderDropdown('inicio')"
                        class="flex items-center gap-1.5 font-semibold uppercase tracking-wider transition-all rounded-lg px-2 py-1 group"
                        :class="headerDropdown === 'inicio'
                          ? 'bg-blue-500 text-white'
                          : isDark ? 'opacity-50 hover:opacity-100 text-white hover:bg-white/10' : 'opacity-50 hover:opacity-100 text-slate-600 hover:bg-slate-200'">
                        <i class="fas fa-clock text-[9px]"></i>
                        Hora inicio
                        <i class="fas fa-chevron-down text-[8px]" :class="headerDropdown === 'inicio' ? 'rotate-180' : ''" style="transition:transform .15s"></i>
                      </button>
                      <div v-if="headerDropdown === 'inicio'"
                        class="absolute top-full left-0 mt-1 z-50 rounded-xl border shadow-xl w-44 overflow-hidden"
                        :class="isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'">
                        <div class="p-2 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                          <p class="text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1.5"
                            :class="isDark ? 'text-white' : 'text-slate-500'">Aplicar a todos</p>
                          <input v-model="searchHoraInicio" type="text" placeholder="Buscar hora..."
                            class="w-full text-[11px] outline-none bg-transparent border-b pb-1"
                            :class="isDark ? 'text-white placeholder:text-white/30 border-white/10' : 'text-slate-700 placeholder:text-slate-300 border-slate-200'" />
                        </div>
                        <div class="max-h-[160px] overflow-y-auto custom-scroll">
                          <div v-for="h in horasFiltradas(searchHoraInicio)" :key="h.value"
                            @click="aplicarHoraATodos('inicio', h.value)"
                            class="px-3 py-1.5 cursor-pointer text-[11px] font-semibold transition-all"
                            :class="isDark ? 'hover:bg-blue-500/20 text-white hover:text-blue-400' : 'hover:bg-amber-50 text-slate-700 hover:text-amber-600'">
                            {{ h.label }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </th>

                  <!-- HEADER HORA FIN — abre dropdown masivo -->
                  <th class="px-3 py-2 text-left">
                    <div class="relative inline-block">
                      <button @click="toggleHeaderDropdown('fin')"
                        class="flex items-center gap-1.5 font-semibold uppercase tracking-wider transition-all rounded-lg px-2 py-1"
                        :class="headerDropdown === 'fin'
                          ? 'bg-blue-500 text-white'
                          : isDark ? 'opacity-50 hover:opacity-100 text-white hover:bg-white/10' : 'opacity-50 hover:opacity-100 text-slate-600 hover:bg-slate-200'">
                        <i class="fas fa-clock text-[9px]"></i>
                        Hora fin
                        <i class="fas fa-chevron-down text-[8px]" :class="headerDropdown === 'fin' ? 'rotate-180' : ''" style="transition:transform .15s"></i>
                      </button>
                      <div v-if="headerDropdown === 'fin'"
                        class="absolute top-full left-0 mt-1 z-50 rounded-xl border shadow-xl w-44 overflow-hidden"
                        :class="isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'">
                        <div class="p-2 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                          <p class="text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1.5"
                            :class="isDark ? 'text-white' : 'text-slate-500'">Aplicar a todos</p>
                          <input v-model="searchHoraFin" type="text" placeholder="Buscar hora..."
                            class="w-full text-[11px] outline-none bg-transparent border-b pb-1"
                            :class="isDark ? 'text-white placeholder:text-white/30 border-white/10' : 'text-slate-700 placeholder:text-slate-300 border-slate-200'" />
                        </div>
                        <div class="max-h-[160px] overflow-y-auto custom-scroll">
                          <div v-for="h in horasFiltradas(searchHoraFin)" :key="h.value"
                            @click="aplicarHoraATodos('fin', h.value)"
                            class="px-3 py-1.5 cursor-pointer text-[11px] font-semibold transition-all"
                            :class="isDark ? 'hover:bg-blue-500/20 text-white hover:text-blue-400' : 'hover:bg-amber-50 text-slate-700 hover:text-amber-600'">
                            {{ h.label }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </th>

                  <th class="px-3 py-2 text-left font-semibold uppercase tracking-wider opacity-50 rounded-tr-xl">Periodo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(detalle, idx) in form.detalles" :key="detalle.dia_semana"
                  class="border-t transition-all"
                  :class="[
                    isDark ? 'border-white/5' : 'border-slate-100',
                    !detalle.activo ? 'opacity-30' : ''
                  ]">
                  <td class="px-3 py-2">
                    <input type="checkbox" v-model="detalle.activo"
                      class="w-3.5 h-3.5 accent-blue-500 cursor-pointer" />
                  </td>
                  <td class="px-3 py-2 font-semibold" :class="isDark ? 'text-white' : 'text-slate-700'">
                    {{ DIAS[detalle.dia_semana] }}
                  </td>

                  <!-- HORA INICIO — dropdown buscable por fila. Las últimas filas abren hacia arriba -->
                  <td class="px-3 py-2">
                    <div class="relative">
                      <button :disabled="!detalle.activo"
                        @click="toggleRowDropdown(detalle.dia_semana, 'inicio')"
                        class="rounded-lg border px-2 py-1 text-[10px] font-semibold outline-none transition-all flex items-center gap-1.5 min-w-[68px]"
                        :class="isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'">
                        {{ formatHora(detalle.hora_inicio) }}
                        <i class="fas fa-chevron-down text-[7px] opacity-40 ml-auto"></i>
                      </button>
                      <div v-if="rowDropdown === `${detalle.dia_semana}-inicio`"
                        class="absolute left-0 z-50 rounded-xl border shadow-xl w-40 overflow-hidden"
                        :class="[
                          idx >= form.detalles.length - 3 ? 'bottom-full mb-1' : 'top-full mt-1',
                          isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
                        ]">
                        <div class="p-1.5 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                          <input v-model="searchRow" type="text" placeholder="Buscar..."
                            class="w-full text-[11px] outline-none bg-transparent px-1"
                            :class="isDark ? 'text-white placeholder:text-white/30' : 'text-slate-700 placeholder:text-slate-300'"
                            @click.stop />
                        </div>
                        <div class="max-h-[160px] overflow-y-auto custom-scroll">
                          <div v-for="h in horasFiltradas(searchRow)" :key="h.value"
                            @click="selectRowHora(detalle, 'inicio', h.value)"
                            class="px-3 py-1.5 cursor-pointer text-[11px] font-semibold transition-all"
                            :class="[
                              detalle.hora_inicio === h.value ? 'text-blue-500 font-black' : '',
                              isDark ? 'hover:bg-blue-500/20 text-white' : 'hover:bg-amber-50 text-slate-700'
                            ]">
                            {{ h.label }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- HORA FIN — dropdown buscable por fila. Las últimas filas abren hacia arriba -->
                  <td class="px-3 py-2">
                    <div class="relative">
                      <button :disabled="!detalle.activo"
                        @click="toggleRowDropdown(detalle.dia_semana, 'fin')"
                        class="rounded-lg border px-2 py-1 text-[10px] font-semibold outline-none transition-all flex items-center gap-1.5 min-w-[68px]"
                        :class="isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'">
                        {{ formatHora(detalle.hora_fin) }}
                        <i class="fas fa-chevron-down text-[7px] opacity-40 ml-auto"></i>
                      </button>
                      <div v-if="rowDropdown === `${detalle.dia_semana}-fin`"
                        class="absolute left-0 z-50 rounded-xl border shadow-xl w-40 overflow-hidden"
                        :class="[
                          idx >= form.detalles.length - 3 ? 'bottom-full mb-1' : 'top-full mt-1',
                          isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
                        ]">
                        <div class="p-1.5 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                          <input v-model="searchRow" type="text" placeholder="Buscar..."
                            class="w-full text-[11px] outline-none bg-transparent px-1"
                            :class="isDark ? 'text-white placeholder:text-white/30' : 'text-slate-700 placeholder:text-slate-300'"
                            @click.stop />
                        </div>
                        <div class="max-h-[160px] overflow-y-auto custom-scroll">
                          <div v-for="h in horasFiltradas(searchRow)" :key="h.value"
                            @click="selectRowHora(detalle, 'fin', h.value)"
                            class="px-3 py-1.5 cursor-pointer text-[11px] font-semibold transition-all"
                            :class="[
                              detalle.hora_fin === h.value ? 'text-blue-500 font-black' : '',
                              isDark ? 'hover:bg-blue-500/20 text-white' : 'hover:bg-amber-50 text-slate-700'
                            ]">
                            {{ h.label }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td class="px-3 py-2">
                    <select v-model="detalle.periodo" :disabled="!detalle.activo"
                      class="rounded-lg border px-2 py-1 text-[10px] outline-none transition-all"
                      :class="isDark
                        ? 'bg-white/5 border-white/10 text-white focus:border-blue-500/50'
                        : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-400'">
                      <option value="morning">Diurna</option>
                      <option value="afternoon">Tarde</option>
                      <option value="night">Nocturna</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Overlay para cerrar dropdowns de la tabla -->
          <div v-if="headerDropdown || rowDropdown" @click="headerDropdown = null; rowDropdown = null" class="fixed inset-0 z-40"></div>

          <!-- REDUCCIÓN DE HORAS -->
          <div class="rounded-xl border transition-all overflow-hidden"
            :class="reduccion.activa
              ? isDark ? 'border-orange-500/40 bg-orange-500/5' : 'border-orange-300 bg-orange-50'
              : isDark ? 'border-white/10' : 'border-slate-200'">
            <div class="px-3 py-2.5 flex items-center gap-3 cursor-pointer select-none"
              @click="reduccion.activa = !reduccion.activa">
              <input type="checkbox" v-model="reduccion.activa"
                class="w-3.5 h-3.5 accent-orange-500 cursor-pointer" @click.stop />
              <div>
                <p class="text-[10px] font-bold uppercase tracking-wide"
                  :class="reduccion.activa
                    ? 'text-orange-500'
                    : isDark ? 'text-white/60' : 'text-slate-500'">
                  Reducción de horas
                </p>
                <p class="text-[9px] opacity-50"
                  :class="isDark ? 'text-white' : 'text-slate-400'">
                  Aplica reducción en un día específico de la malla
                </p>
              </div>
            </div>

            <Transition name="slide-down">
              <div v-if="reduccion.activa"
                class="px-4 pb-4 pt-1 flex flex-wrap items-end gap-4 border-t"
                :class="isDark ? 'border-orange-500/20' : 'border-orange-200'">

                <div>
                  <label class="block text-[9px] font-bold uppercase tracking-wider mb-1 opacity-50"
                    :class="isDark ? 'text-white' : 'text-slate-600'">Horas a reducir</label>
                  <div class="flex items-center gap-1">
                    <button @click="reduccion.horas = Math.max(0.5, reduccion.horas - 0.5)"
                      class="w-7 h-7 rounded-lg border flex items-center justify-center transition-all font-bold"
                      :class="isDark ? 'border-white/10 text-white hover:bg-white/10' : 'border-slate-200 text-slate-600 hover:bg-slate-100'">−</button>
                    <span class="w-12 text-center text-[13px] font-black text-orange-500">{{ reduccion.horas }}h</span>
                    <button @click="reduccion.horas = Math.min(8, reduccion.horas + 0.5)"
                      class="w-7 h-7 rounded-lg border flex items-center justify-center transition-all font-bold"
                      :class="isDark ? 'border-white/10 text-white hover:bg-white/10' : 'border-slate-200 text-slate-600 hover:bg-slate-100'">+</button>
                  </div>
                </div>

                <div>
                  <label class="block text-[9px] font-bold uppercase tracking-wider mb-1 opacity-50"
                    :class="isDark ? 'text-white' : 'text-slate-600'">Día afectado</label>
                  <div class="flex flex-wrap gap-1.5">
                    <button v-for="d in form.detalles.filter(d => d.activo)" :key="d.dia_semana"
                      @click="reduccion.dia = d.dia_semana"
                      class="h-7 px-3 rounded-lg border text-[9px] font-bold uppercase transition-all"
                      :class="reduccion.dia === d.dia_semana
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : isDark
                          ? 'border-white/10 text-white/50 hover:bg-white/10'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-100'">
                      {{ DIAS_SHORT[d.dia_semana] }}
                    </button>
                  </div>
                </div>

                <div v-if="reduccion.dia !== null" class="flex-1 min-w-[160px]">
                  <label class="block text-[9px] font-bold uppercase tracking-wider mb-1 opacity-50"
                    :class="isDark ? 'text-white' : 'text-slate-600'">Resultado</label>
                  <div class="px-3 py-1.5 rounded-lg border text-[10px] font-semibold"
                    :class="isDark ? 'border-orange-500/30 bg-orange-500/10 text-orange-400' : 'border-orange-200 bg-orange-50 text-orange-600'">
                    {{ DIAS[reduccion.dia] }}:
                    {{ formatHora(form.detalles[reduccion.dia].hora_inicio) }} →
                    {{ formatHoraFin(form.detalles[reduccion.dia].hora_inicio, form.detalles[reduccion.dia].hora_fin, reduccion.horas) }}
                    <span class="opacity-60">(−{{ reduccion.horas }}h)</span>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Botón guardar -->
          <div class="flex justify-end">
            <button @click="crearMalla" :disabled="guardando || !form.nombre.trim()"
              class="h-9 px-6 rounded-xl bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wide disabled:opacity-30 hover:bg-blue-400 transition-all flex items-center gap-2">
              <i class="fas text-[10px]" :class="guardando ? 'fa-circle-notch fa-spin' : 'fa-save'"></i>
              {{ guardando ? 'Guardando...' : 'Guardar Malla' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- TABLA DE MALLAS EXISTENTES -->
    <div class="flex-1 min-h-0 rounded-xl border overflow-hidden transition-all flex flex-col"
      :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">

      <!-- Header con búsqueda -->
      <div class="shrink-0 px-3 py-2 border-b flex items-center gap-2"
        :class="isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'">
        <!-- Búsqueda por nombre/compañía -->
        <div class="relative flex-1 max-w-xs">
          <i class="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] opacity-40"
            :class="isDark ? 'text-white' : 'text-slate-500'"></i>
          <input
            v-model="filterMalla"
            type="text"
            placeholder="Buscar malla..."
            class="w-full pl-7 pr-2.5 py-1 rounded-lg border text-[10px] font-medium outline-none transition-all"
            :class="isDark
              ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-blue-500/40'
              : 'bg-white border-slate-200 text-slate-700 placeholder-slate-300 focus:border-blue-400'"
          />
        </div>

        <span class="text-[9px] font-semibold uppercase tracking-wider opacity-40 ml-auto"
          :class="isDark ? 'text-white' : 'text-slate-600'">
          {{ mallasFiltradas.length }} / {{ mallas.length }}
        </span>

        <button @click="cargarMallas" :disabled="cargando"
          class="w-6 h-6 rounded-lg border flex items-center justify-center transition-all"
          :class="isDark ? 'border-white/10 text-white/40 hover:bg-white/5' : 'border-slate-200 text-slate-400 hover:bg-slate-50'">
          <i class="fas fa-rotate text-[10px]" :class="cargando ? 'fa-spin' : ''"></i>
        </button>
      </div>

      <div v-if="cargando" class="flex-1 flex items-center justify-center">
        <i class="fas fa-circle-notch fa-spin text-blue-500 text-lg"></i>
      </div>

      <div v-else-if="!mallasFiltradas.length" class="flex-1 flex flex-col items-center justify-center">
        <i class="fas fa-calendar-alt text-3xl opacity-10 mb-2 block"
          :class="isDark ? 'text-white' : 'text-slate-400'"></i>
        <p class="text-[11px] opacity-30" :class="isDark ? 'text-white' : 'text-slate-500'">
          {{ filterMalla ? 'Sin resultados para "' + filterMalla + '"' : 'No hay mallas registradas' }}
        </p>
      </div>

      <div v-else class="flex-1 overflow-y-auto divide-y" :class="isDark ? 'divide-white/5' : 'divide-slate-100'">
        <div v-for="malla in mallasFiltradas" :key="malla.id"
          class="px-4 py-3 transition-all"
          :class="isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-semibold truncate"
                  :class="isDark ? 'text-white' : 'text-slate-700'">{{ malla.nombre }}</span>
                <span class="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  :class="malla.activa
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-slate-500/10 text-slate-400'">
                  {{ malla.activa ? 'Activa' : 'Inactiva' }}
                </span>
              </div>
              <p v-if="malla.compania" class="text-[9px] opacity-40 mt-0.5"
                :class="isDark ? 'text-white' : 'text-slate-500'">{{ malla.compania }}</p>

              <div v-if="malla.detalles?.length" class="flex flex-wrap gap-1 mt-2">
                <span v-for="d in malla.detalles.slice().sort((a,b) => a.dia_semana - b.dia_semana)"
                  :key="d.id"
                  class="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                  :class="isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-50 text-amber-600'">
                  {{ DIAS_SHORT[d.dia_semana] }}
                  {{ formatHora(d.hora_inicio) }}-{{ formatHora(d.hora_fin) }}
                </span>
              </div>
              <p v-else class="text-[9px] opacity-30 mt-1 italic"
                :class="isDark ? 'text-white' : 'text-slate-400'">Sin horarios definidos</p>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <button @click="toggleMalla(malla)"
                class="h-6 px-2.5 rounded-lg border text-[9px] font-semibold uppercase transition-all"
                :class="malla.activa
                  ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'
                  : 'border-slate-400/30 text-slate-400 hover:bg-slate-500 hover:text-white'">
                {{ malla.activa ? 'ON' : 'OFF' }}
              </button>
              <button @click="confirmarEliminar(malla)"
                class="h-6 w-6 rounded-lg border flex items-center justify-center transition-all"
                :class="isDark
                  ? 'border-rose-500/20 text-rose-400/50 hover:bg-rose-500 hover:text-white hover:border-rose-500'
                  : 'border-rose-200 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500'">
                <i class="fas fa-trash text-[9px]"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL CONFIRMACIÓN ELIMINAR -->
    <Transition name="fade">
      <div v-if="mallaAEliminar" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="mallaAEliminar = null"></div>
        <div class="relative rounded-2xl border p-6 w-full max-w-sm shadow-2xl"
          :class="isDark ? 'bg-[#1e2a3a] border-white/10' : 'bg-white border-slate-200'">
          <div class="text-center space-y-3">
            <div class="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <i class="fas fa-trash text-rose-400 text-lg"></i>
            </div>
            <p class="text-[12px] font-bold" :class="isDark ? 'text-white' : 'text-slate-700'">
              ¿Eliminar malla?
            </p>
            <p class="text-[11px] opacity-60" :class="isDark ? 'text-white' : 'text-slate-500'">
              "{{ mallaAEliminar.nombre }}" y sus {{ mallaAEliminar.detalles?.length || 0 }} horarios serán eliminados.
            </p>
            <div class="flex gap-2 pt-2">
              <button @click="mallaAEliminar = null"
                class="flex-1 h-9 rounded-xl border text-[10px] font-bold uppercase transition-all"
                :class="isDark ? 'border-white/10 text-white/60 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:bg-slate-50'">
                Cancelar
              </button>
              <button @click="eliminarMalla" :disabled="eliminando"
                class="flex-1 h-9 rounded-xl bg-rose-500 text-white text-[10px] font-bold uppercase hover:bg-rose-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                <i class="fas text-[10px]" :class="eliminando ? 'fa-circle-notch fa-spin' : 'fa-trash'"></i>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({ isDark: Boolean });
const emit = defineEmits(['success', 'error']);

const API_URL = import.meta.env.VITE_API_URL;

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const HORAS = Array.from({ length: 48 }, (_, i) => {
  const valor = i * 0.5;
  const h = Math.floor(valor).toString().padStart(2, '0');
  const m = valor % 1 === 0.5 ? '30' : '00';
  return { value: valor, label: `${h}:${m}` };
});

const formatHora = (decimal) => {
  const norm = ((decimal % 24) + 24) % 24;
  const h = Math.floor(norm).toString().padStart(2, '0');
  const m = Math.round((norm % 1) * 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

const formatHoraFin = (inicio, fin, reduccion) => {
  const esNocturno = fin < inicio;
  const nuevaFin = esNocturno
    ? Math.max(0, fin - reduccion)
    : Math.max(inicio + 1, fin - reduccion);
  return formatHora(nuevaFin);
};

const detectarPeriodo = (horaInicio) => {
  if (horaInicio >= 5 && horaInicio < 12) return 'morning';
  if (horaInicio >= 12 && horaInicio < 20) return 'afternoon';
  return 'night';
};

const formularioInicial = () => ({
  nombre: '',
  compania: '',
  detalles: DIAS.map((_, i) => ({
    dia_semana: i,
    activo: i < 5,
    hora_inicio: 7,
    hora_fin: i === 4 ? 16 : 17,
    periodo: 'morning',
  })),
});

const reduccionInicial = () => ({ activa: false, horas: 2, dia: null });

// ── Estado ──────────────────────────────────────────────────
const mallas = ref([]);
const cargando = ref(false);
const panelForm = ref(false);
const panelUpload = ref(false);
const form = ref(formularioInicial());
const guardando = ref(false);
const mallaAEliminar = ref(null);
const eliminando = ref(false);
const archivoExcel = ref(null);
const cargandoExcel = ref(false);
const resultadoUpload = ref(null);
const reduccion = ref(reduccionInicial());

// Filtro búsqueda mallas
const filterMalla = ref('');

const mallasFiltradas = computed(() => {
  if (!filterMalla.value.trim()) return mallas.value;
  const q = filterMalla.value.toLowerCase();
  return mallas.value.filter(
    m => m.nombre?.toLowerCase().includes(q) || m.compania?.toLowerCase().includes(q)
  );
});

// ── Dropdowns de horas ──────────────────────────────────────
const headerDropdown = ref(null);
const rowDropdown    = ref(null);
const searchHoraInicio = ref('');
const searchHoraFin    = ref('');
const searchRow        = ref('');

const horasFiltradas = (query) => {
  if (!query) return HORAS;
  return HORAS.filter(h => h.label.includes(query.trim()));
};

const toggleHeaderDropdown = (tipo) => {
  rowDropdown.value = null;
  searchHoraInicio.value = '';
  searchHoraFin.value = '';
  headerDropdown.value = headerDropdown.value === tipo ? null : tipo;
};

const toggleRowDropdown = (dia, tipo) => {
  headerDropdown.value = null;
  searchRow.value = '';
  const key = `${dia}-${tipo}`;
  rowDropdown.value = rowDropdown.value === key ? null : key;
};

const aplicarHoraATodos = (tipo, valor) => {
  form.value.detalles.forEach(d => {
    if (d.activo) {
      if (tipo === 'inicio') d.hora_inicio = valor;
      else d.hora_fin = valor;
    }
  });
  headerDropdown.value = null;
};

const selectRowHora = (detalle, tipo, valor) => {
  if (tipo === 'inicio') detalle.hora_inicio = valor;
  else detalle.hora_fin = valor;
  rowDropdown.value = null;
};

// ── API ─────────────────────────────────────────────────────
const cargarMallas = async () => {
  cargando.value = true;
  try {
    const res = await fetch(`${API_URL}/mallas-admin`);
    if (!res.ok) throw new Error();
    mallas.value = await res.json();
  } catch {
    emit('error', 'Error al cargar mallas');
  } finally {
    cargando.value = false;
  }
};

const crearMalla = async () => {
  if (!form.value.nombre.trim()) return;
  guardando.value = true;
  try {
    const detallesFinales = form.value.detalles
      .filter((d) => d.activo)
      .map((d) => {
        if (reduccion.value.activa && reduccion.value.dia === d.dia_semana && reduccion.value.horas > 0) {
          const nuevaHoraFin = Math.max(d.hora_inicio + 1, d.hora_fin - reduccion.value.horas);
          return { ...d, hora_fin: nuevaHoraFin };
        }
        return { ...d };
      });

    const payload = {
      nombre: form.value.nombre,
      compania: form.value.compania,
      detalles: detallesFinales,
    };
    const res = await fetch(`${API_URL}/mallas-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Error');
    emit('success', 'Malla creada correctamente');
    panelForm.value = false;
    form.value = formularioInicial();
    reduccion.value = reduccionInicial();
    await cargarMallas();
  } catch (e) {
    emit('error', e.message || 'Error al crear malla');
  } finally {
    guardando.value = false;
  }
};

const confirmarEliminar = (malla) => { mallaAEliminar.value = malla; };

const eliminarMalla = async () => {
  if (!mallaAEliminar.value) return;
  eliminando.value = true;
  try {
    const res = await fetch(`${API_URL}/mallas-admin/${mallaAEliminar.value.id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    emit('success', 'Malla eliminada');
    mallaAEliminar.value = null;
    await cargarMallas();
  } catch {
    emit('error', 'Error al eliminar');
  } finally {
    eliminando.value = false;
  }
};

const toggleMalla = async (malla) => {
  try {
    const res = await fetch(`${API_URL}/mallas-admin/${malla.id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activa: !malla.activa }),
    });
    if (!res.ok) throw new Error();
    emit('success', `Malla ${malla.activa ? 'desactivada' : 'activada'}`);
    await cargarMallas();
  } catch {
    emit('error', 'Error al cambiar estado');
  }
};

const onFileChange = (e) => {
  archivoExcel.value = e.target.files[0] || null;
  resultadoUpload.value = null;
};

const subirExcel = async () => {
  if (!archivoExcel.value) return;
  cargandoExcel.value = true;
  resultadoUpload.value = null;
  try {
    const fd = new FormData();
    fd.append('file', archivoExcel.value);
    const res = await fetch(`${API_URL}/mallas-admin/upload-excel`, { method: 'POST', body: fd });
    resultadoUpload.value = await res.json();
    if (resultadoUpload.value.creadas > 0) {
      emit('success', `${resultadoUpload.value.creadas} mallas creadas`);
      await cargarMallas();
    }
  } catch {
    emit('error', 'Error al procesar el archivo');
  } finally {
    cargandoExcel.value = false;
    archivoExcel.value = null;
  }
};

const descargarPlantilla = () => {
  window.open(`${API_URL}/mallas-admin/plantilla`, '_blank');
};

watch(
  () => form.value.detalles.map((d) => d.hora_inicio),
  (nuevas, anteriores) => {
    nuevas.forEach((hora, i) => {
      if (hora !== anteriores?.[i]) {
        form.value.detalles[i].periodo = detectarPeriodo(hora);
      }
    });
  },
);

onMounted(cargarMallas);
</script>

<style scoped>
.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background: rgba(156,163,175,0.2); border-radius: 10px; }

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
