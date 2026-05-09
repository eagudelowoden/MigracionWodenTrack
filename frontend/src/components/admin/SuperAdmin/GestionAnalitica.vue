<template>
  <div class="h-full flex flex-col gap-3 animate-fade-in">

    <!-- ── Sub-navegación ───────────────────────────────────────── -->
    <div class="flex items-center gap-1 p-1 rounded-xl border shrink-0"
      :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
      <button v-for="tab in TABS" :key="tab.key" @click="subTab = tab.key"
        class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
        :class="subTab === tab.key
          ? 'bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20'
          : isDark
            ? 'text-white/40 hover:text-white/80 hover:bg-white/5'
            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'">
        <i :class="tab.icon" class="text-[10px]"></i>
        <span class="hidden sm:inline">{{ tab.label }}</span>
      </button>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         VISTA 1 — Empleados sin malla
    ══════════════════════════════════════════════════════════ -->
    <template v-if="subTab === 'sin-malla'">
      <div class="flex items-center justify-between px-3 py-2.5 rounded-xl border shrink-0"
        :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <i class="fas fa-user-slash text-rose-500 text-xs"></i>
          </div>
          <div>
            <h2 class="text-[11px] font-semibold uppercase tracking-wider"
              :class="isDark ? 'text-white' : 'text-slate-700'">Empleados sin malla</h2>
            <p class="text-[9px] font-medium opacity-40 uppercase tracking-wide"
              :class="isDark ? 'text-white' : 'text-slate-500'">
              {{ smFiltrados.length }} empleados sin asignación activa
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <input v-model="smBusqueda" type="text" placeholder="Buscar…"
            class="h-7 px-3 rounded-lg border text-[10px] outline-none w-40 transition-all"
            :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-300'" />
          <button @click="cargarSinMalla" :disabled="sm.cargando"
            class="h-7 w-7 rounded-lg border flex items-center justify-center transition-all"
            :class="isDark ? 'border-white/10 text-white/40 hover:bg-white/5' : 'border-slate-200 text-slate-400 hover:bg-slate-50'">
            <i class="fas fa-rotate text-[10px]" :class="sm.cargando ? 'fa-spin' : ''"></i>
          </button>
        </div>
      </div>

      <div class="flex-1 min-h-0 rounded-xl border overflow-hidden flex flex-col"
        :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
        <div v-if="sm.cargando" class="flex-1 flex items-center justify-center">
          <i class="fas fa-circle-notch fa-spin text-blue-500 text-xl"></i>
        </div>
        <div v-else-if="!smFiltrados.length" class="flex-1 flex flex-col items-center justify-center gap-2">
          <i class="fas fa-check-circle text-4xl text-emerald-500/30"></i>
          <p class="text-[11px] opacity-30" :class="isDark ? 'text-white' : 'text-slate-500'">
            {{ smBusqueda ? 'Sin resultados' : 'Todos los empleados tienen malla asignada' }}
          </p>
        </div>
        <div v-else class="flex-1 overflow-y-auto">
          <table class="w-full text-[10px] border-collapse">
            <thead class="sticky top-0 z-10">
              <tr :class="isDark ? 'bg-[#162030]' : 'bg-slate-50'">
                <th class="px-4 py-2 text-left font-semibold uppercase tracking-wider opacity-50"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Nombre</th>
                <th class="px-4 py-2 text-left font-semibold uppercase tracking-wider opacity-50"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Cargo</th>
                <th class="px-4 py-2 text-left font-semibold uppercase tracking-wider opacity-50"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Área</th>
                <th class="px-4 py-2 text-left font-semibold uppercase tracking-wider opacity-50"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Departamento</th>
                <th class="px-4 py-2 text-left font-semibold uppercase tracking-wider opacity-50"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Segmento</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in smFiltrados" :key="e.id_odoo"
                class="border-t transition-all"
                :class="isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'">
                <td class="px-4 py-2.5 font-semibold" :class="isDark ? 'text-white' : 'text-slate-700'">{{ e.nombre }}</td>
                <td class="px-4 py-2.5 opacity-60 text-[9px]" :class="isDark ? 'text-white' : 'text-slate-600'">{{ e.cargo }}</td>
                <td class="px-4 py-2.5">
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-bold"
                    :class="isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'">{{ e.area }}</span>
                </td>
                <td class="px-4 py-2.5 opacity-60 text-[9px]" :class="isDark ? 'text-white' : 'text-slate-600'">{{ e.departamento }}</td>
                <td class="px-4 py-2.5 opacity-60 text-[9px]" :class="isDark ? 'text-white' : 'text-slate-600'">{{ e.segmento }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════
         VISTA 2 — Asignación masiva
    ══════════════════════════════════════════════════════════ -->
    <template v-if="subTab === 'masivo'">
      <div class="flex items-center justify-between px-3 py-2.5 rounded-xl border shrink-0"
        :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <i class="fas fa-layer-group text-indigo-500 text-xs"></i>
          </div>
          <div>
            <h2 class="text-[11px] font-semibold uppercase tracking-wider"
              :class="isDark ? 'text-white' : 'text-slate-700'">Asignación masiva de mallas</h2>
            <p class="text-[9px] font-medium opacity-40 uppercase tracking-wide"
              :class="isDark ? 'text-white' : 'text-slate-500'">
              {{ masivo.seleccionados.length }} seleccionados
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <select v-model="masivo.mallaId"
            class="h-7 px-2 rounded-lg border text-[10px] outline-none transition-all"
            :class="isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'">
            <option value="">— Seleccionar malla —</option>
            <option v-for="m in masivo.mallas" :key="m.id" :value="m.id">{{ m.nombre }}</option>
          </select>
          <button @click="ejecutarAsignacionMasiva"
            :disabled="!masivo.mallaId || !masivo.seleccionados.length || masivo.guardando"
            class="h-7 px-4 rounded-lg bg-indigo-500 text-white text-[9px] font-bold uppercase tracking-wide disabled:opacity-30 hover:bg-indigo-400 transition-all flex items-center gap-1.5">
            <i class="fas text-[9px]" :class="masivo.guardando ? 'fa-circle-notch fa-spin' : 'fa-bolt'"></i>
            Asignar
          </button>
        </div>
      </div>

      <!-- Tabla de empleados sin malla seleccionables -->
      <div class="flex-1 min-h-0 rounded-xl border overflow-hidden flex flex-col"
        :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
        <div class="px-3 py-2 border-b flex items-center gap-3 shrink-0"
          :class="isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'">
          <input type="checkbox" class="w-3.5 h-3.5 accent-indigo-500 cursor-pointer"
            :checked="masivo.seleccionados.length === sm.data.length && sm.data.length > 0"
            @change="toggleSeleccionarTodos" />
          <span class="text-[9px] font-bold uppercase tracking-wider opacity-40"
            :class="isDark ? 'text-white' : 'text-slate-600'">Seleccionar todos sin malla</span>
          <button @click="cargarSinMalla" :disabled="sm.cargando"
            class="ml-auto h-6 w-6 rounded-lg border flex items-center justify-center transition-all"
            :class="isDark ? 'border-white/10 text-white/40 hover:bg-white/5' : 'border-slate-200 text-slate-400 hover:bg-slate-50'">
            <i class="fas fa-rotate text-[9px]" :class="sm.cargando ? 'fa-spin' : ''"></i>
          </button>
        </div>
        <div v-if="sm.cargando" class="flex-1 flex items-center justify-center">
          <i class="fas fa-circle-notch fa-spin text-indigo-500 text-xl"></i>
        </div>
        <div v-else-if="!sm.data.length" class="flex-1 flex items-center justify-center">
          <p class="text-[11px] opacity-30" :class="isDark ? 'text-white' : 'text-slate-500'">
            No hay empleados sin malla
          </p>
        </div>
        <div v-else class="flex-1 overflow-y-auto divide-y"
          :class="isDark ? 'divide-white/5' : 'divide-slate-100'">
          <div v-for="e in sm.data" :key="e.id_odoo"
            class="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all"
            :class="[
              masivo.seleccionados.includes(e.id_odoo)
                ? isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'
                : isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
            ]"
            @click="toggleSeleccion(e.id_odoo)">
            <input type="checkbox" class="w-3.5 h-3.5 accent-indigo-500 cursor-pointer shrink-0"
              :checked="masivo.seleccionados.includes(e.id_odoo)" @click.stop />
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-semibold truncate" :class="isDark ? 'text-white' : 'text-slate-700'">{{ e.nombre }}</p>
              <p class="text-[9px] opacity-50" :class="isDark ? 'text-white' : 'text-slate-500'">{{ e.area }} · {{ e.departamento }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════
         VISTA 3 — Heatmap
    ══════════════════════════════════════════════════════════ -->
    <template v-if="subTab === 'heatmap'">
      <div class="flex items-center justify-between px-3 py-2.5 rounded-xl border shrink-0"
        :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <i class="fas fa-th text-cyan-500 text-xs"></i>
          </div>
          <div>
            <h2 class="text-[11px] font-semibold uppercase tracking-wider"
              :class="isDark ? 'text-white' : 'text-slate-700'">Heatmap de asistencia</h2>
            <p class="text-[9px] font-medium opacity-40 uppercase tracking-wide"
              :class="isDark ? 'text-white' : 'text-slate-500'">
              {{ hm.data?.totalEmpleados || 0 }} empleados · {{ hm.data?.grid?.length || 0 }} días
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <select v-model="hm.departamento"
            class="h-7 px-2 rounded-lg border text-[10px] outline-none"
            :class="isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'">
            <option value="">Todos los departamentos</option>
            <option v-for="d in hm.data?.departamentos || []" :key="d" :value="d">{{ d }}</option>
          </select>
          <input v-model="hm.startDate" type="date" class="h-7 px-2 rounded-lg border text-[10px] outline-none"
            :class="isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'" />
          <input v-model="hm.endDate" type="date" class="h-7 px-2 rounded-lg border text-[10px] outline-none"
            :class="isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'" />
          <button @click="cargarHeatmap" :disabled="hm.cargando"
            class="h-7 px-3 rounded-lg bg-cyan-500 text-white text-[9px] font-bold uppercase tracking-wide hover:bg-cyan-400 disabled:opacity-50 transition-all flex items-center gap-1.5">
            <i class="fas text-[9px]" :class="hm.cargando ? 'fa-circle-notch fa-spin' : 'fa-search'"></i>
            Cargar
          </button>
        </div>
      </div>

      <div class="flex-1 min-h-0 rounded-xl border overflow-hidden flex flex-col"
        :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
        <div v-if="hm.cargando" class="flex-1 flex items-center justify-center">
          <i class="fas fa-circle-notch fa-spin text-cyan-500 text-xl"></i>
        </div>
        <div v-else-if="!hm.data?.grid?.length" class="flex-1 flex flex-col items-center justify-center gap-2">
          <i class="fas fa-th text-4xl opacity-10" :class="isDark ? 'text-white' : 'text-slate-400'"></i>
          <p class="text-[11px] opacity-30" :class="isDark ? 'text-white' : 'text-slate-500'">
            Selecciona un rango de fechas y presiona Cargar
          </p>
        </div>
        <div v-else class="flex-1 overflow-auto p-4">
          <!-- Leyenda -->
          <div class="flex items-center gap-3 mb-4">
            <span class="text-[9px] font-bold uppercase opacity-40" :class="isDark ? 'text-white' : 'text-slate-500'">Asistencia:</span>
            <div class="flex items-center gap-1">
              <div v-for="pct in [0,25,50,75,100]" :key="pct"
                class="w-8 h-4 rounded text-[8px] font-bold flex items-center justify-center text-white"
                :style="{ background: heatColor(pct) }">{{ pct }}%</div>
            </div>
            <span class="text-[9px] font-bold opacity-40 ml-auto"
              :class="isDark ? 'text-white' : 'text-slate-500'">
              Total: {{ hm.data.totalEmpleados }} empleados
            </span>
          </div>

          <!-- Grid de días -->
          <div class="grid gap-1" style="grid-template-columns: auto repeat(7, 1fr);">
            <!-- Headers días semana -->
            <div></div>
            <div v-for="d in DIAS_SEMANA" :key="d"
              class="text-center text-[9px] font-bold uppercase opacity-40 py-1"
              :class="isDark ? 'text-white' : 'text-slate-500'">{{ d }}</div>

            <!-- Semanas -->
            <template v-for="(semana, si) in hmSemanas" :key="si">
              <div class="text-[8px] font-semibold opacity-40 flex items-center pr-2"
                :class="isDark ? 'text-white' : 'text-slate-500'">
                S{{ si + 1 }}
              </div>
              <div v-for="dia in semana" :key="dia?.fecha || `empty-${si}-${dia}`"
                class="h-10 rounded-lg flex flex-col items-center justify-center text-[8px] font-bold transition-all relative group"
                :style="dia ? { background: heatColor(dia.pct) } : {}"
                :class="[
                  dia ? 'cursor-default text-white' : 'opacity-10',
                  !dia && (isDark ? 'bg-white/5' : 'bg-slate-100')
                ]">
                <template v-if="dia">
                  <span>{{ dia.fecha.slice(8) }}</span>
                  <span class="opacity-80">{{ dia.pct }}%</span>
                  <!-- Tooltip -->
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-lg text-[9px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 shadow-lg"
                    :class="isDark ? 'bg-slate-900 text-white border border-white/10' : 'bg-white text-slate-700 border border-slate-200'">
                    {{ dia.fecha }} · {{ dia.presentes }} presentes
                  </div>
                </template>
              </div>
            </template>
          </div>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════
         VISTA 4 — Comparativa de áreas
    ══════════════════════════════════════════════════════════ -->
    <template v-if="subTab === 'comparativa'">
      <div class="flex items-center justify-between px-3 py-2.5 rounded-xl border shrink-0"
        :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <i class="fas fa-chart-bar text-violet-500 text-xs"></i>
          </div>
          <div>
            <h2 class="text-[11px] font-semibold uppercase tracking-wider"
              :class="isDark ? 'text-white' : 'text-slate-700'">Comparativa entre áreas</h2>
            <p class="text-[9px] font-medium opacity-40 uppercase tracking-wide"
              :class="isDark ? 'text-white' : 'text-slate-500'">
              {{ comp.data.length }} áreas en el período
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <input v-model="comp.startDate" type="date" class="h-7 px-2 rounded-lg border text-[10px] outline-none"
            :class="isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'" />
          <input v-model="comp.endDate" type="date" class="h-7 px-2 rounded-lg border text-[10px] outline-none"
            :class="isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'" />
          <button @click="cargarComparativa" :disabled="comp.cargando"
            class="h-7 px-3 rounded-lg bg-violet-500 text-white text-[9px] font-bold uppercase tracking-wide hover:bg-violet-400 disabled:opacity-50 transition-all flex items-center gap-1.5">
            <i class="fas text-[9px]" :class="comp.cargando ? 'fa-circle-notch fa-spin' : 'fa-search'"></i>
            Analizar
          </button>
        </div>
      </div>

      <div class="flex-1 min-h-0 rounded-xl border overflow-hidden flex flex-col"
        :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
        <div v-if="comp.cargando" class="flex-1 flex items-center justify-center">
          <i class="fas fa-circle-notch fa-spin text-violet-500 text-xl"></i>
        </div>
        <div v-else-if="!comp.data.length" class="flex-1 flex flex-col items-center justify-center gap-2">
          <i class="fas fa-chart-bar text-4xl opacity-10" :class="isDark ? 'text-white' : 'text-slate-400'"></i>
          <p class="text-[11px] opacity-30" :class="isDark ? 'text-white' : 'text-slate-500'">
            Selecciona un rango y presiona Analizar
          </p>
        </div>
        <div v-else class="flex-1 overflow-y-auto">
          <table class="w-full text-[10px] border-collapse">
            <thead class="sticky top-0 z-10">
              <tr :class="isDark ? 'bg-[#162030]' : 'bg-slate-50'">
                <th class="px-4 py-2.5 text-left font-semibold uppercase tracking-wider opacity-50 w-44"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Área</th>
                <th class="px-4 py-2.5 text-left font-semibold uppercase tracking-wider opacity-50 w-28"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Depto</th>
                <th class="px-4 py-2.5 text-center font-semibold uppercase tracking-wider opacity-50 w-16"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Empl.</th>
                <th class="px-4 py-2.5 text-left font-semibold uppercase tracking-wider opacity-50"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Puntualidad</th>
                <th class="px-4 py-2.5 text-left font-semibold uppercase tracking-wider opacity-50"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Tardanzas</th>
                <th class="px-4 py-2.5 text-left font-semibold uppercase tracking-wider opacity-50"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Ausentismo est.</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in comp.data" :key="a.area"
                class="border-t transition-all"
                :class="isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'">
                <td class="px-4 py-3 font-semibold" :class="isDark ? 'text-white' : 'text-slate-700'">{{ a.area }}</td>
                <td class="px-4 py-3 text-[9px] opacity-60" :class="isDark ? 'text-white' : 'text-slate-600'">{{ a.departamento }}</td>
                <td class="px-4 py-3 text-center font-bold text-[11px]" :class="isDark ? 'text-white' : 'text-slate-700'">{{ a.totalEmpleados }}</td>

                <!-- Puntualidad -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 h-1.5 rounded-full overflow-hidden"
                      :class="isDark ? 'bg-white/10' : 'bg-slate-100'">
                      <div class="h-full rounded-full transition-all"
                        :style="{ width: a.aTiempoPct + '%' }"
                        :class="a.aTiempoPct >= 80 ? 'bg-emerald-500' : a.aTiempoPct >= 60 ? 'bg-amber-500' : 'bg-rose-500'">
                      </div>
                    </div>
                    <span class="text-[10px] font-bold w-8 text-right"
                      :class="a.aTiempoPct >= 80 ? 'text-emerald-500' : a.aTiempoPct >= 60 ? 'text-amber-500' : 'text-rose-500'">
                      {{ a.aTiempoPct }}%
                    </span>
                  </div>
                </td>

                <!-- Tardanzas -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 h-1.5 rounded-full overflow-hidden"
                      :class="isDark ? 'bg-white/10' : 'bg-slate-100'">
                      <div class="h-full rounded-full bg-amber-500 transition-all"
                        :style="{ width: a.tardanzaPct + '%' }"></div>
                    </div>
                    <span class="text-[10px] font-bold w-8 text-right text-amber-500">{{ a.tardanzaPct }}%</span>
                  </div>
                </td>

                <!-- Ausentismo -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 h-1.5 rounded-full overflow-hidden"
                      :class="isDark ? 'bg-white/10' : 'bg-slate-100'">
                      <div class="h-full rounded-full bg-rose-500 transition-all"
                        :style="{ width: Math.min(a.ausentismoPct, 100) + '%' }"></div>
                    </div>
                    <span class="text-[10px] font-bold w-8 text-right text-rose-500">{{ a.ausentismoPct }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Nota metodología -->
          <div class="px-4 py-2 border-t"
            :class="isDark ? 'border-white/5' : 'border-slate-100'">
            <p class="text-[9px] opacity-30" :class="isDark ? 'text-white' : 'text-slate-500'">
              * Ausentismo estimado comparando marcaciones registradas vs. días laborales esperados (L-V). Puntualidad calculada sobre marcaciones con estado "A TIEMPO".
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════
         VISTA 5 — Correo / Ausentismos
    ══════════════════════════════════════════════════════════ -->
    <template v-if="subTab === 'correo'">
      <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-y-auto">

        <!-- Panel izquierdo: Configuración SMTP -->
        <div class="rounded-xl border overflow-hidden flex flex-col"
          :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
          <div class="px-4 py-2.5 border-b flex items-center justify-between"
            :class="isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'">
            <div class="flex items-center gap-2">
              <i class="fas fa-envelope-open-text text-emerald-500 text-[11px]"></i>
              <span class="text-[10px] font-bold uppercase tracking-wider opacity-60"
                :class="isDark ? 'text-white' : 'text-slate-600'">Configuración SMTP (Outlook)</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-1.5 h-1.5 rounded-full"
                :class="correo.config.habilitado ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'"></div>
              <span class="text-[9px] font-bold uppercase"
                :class="correo.config.habilitado ? 'text-emerald-400' : 'text-slate-400'">
                {{ correo.config.habilitado ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>

          <div class="p-4 flex-1 flex flex-col gap-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Host SMTP *</label>
                <input v-model="correo.form.host" type="text" placeholder="smtp.office365.com"
                  class="w-full px-3 py-1.5 rounded-lg border text-[11px] outline-none transition-all"
                  :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-700'" />
              </div>
              <div>
                <label class="block text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Puerto</label>
                <input v-model="correo.form.port" type="text" placeholder="587"
                  class="w-full px-3 py-1.5 rounded-lg border text-[11px] outline-none transition-all"
                  :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'" />
              </div>
            </div>

            <div>
              <label class="block text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1"
                :class="isDark ? 'text-white' : 'text-slate-600'">Correo (usuario SMTP) *</label>
              <input v-model="correo.form.user" type="email" placeholder="notificaciones@empresa.com"
                class="w-full px-3 py-1.5 rounded-lg border text-[11px] outline-none transition-all"
                :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'" />
            </div>

            <div>
              <label class="block text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1"
                :class="isDark ? 'text-white' : 'text-slate-600'">
                Contraseña *
                <span v-if="correo.config.passConfigurado" class="ml-1 text-emerald-400 normal-case font-normal">(ya configurada — dejar vacío para no cambiar)</span>
              </label>
              <input v-model="correo.form.pass" type="password" placeholder="••••••••"
                class="w-full px-3 py-1.5 rounded-lg border text-[11px] outline-none transition-all"
                :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'" />
            </div>

            <div>
              <label class="block text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1"
                :class="isDark ? 'text-white' : 'text-slate-600'">Nombre del remitente</label>
              <input v-model="correo.form.fromNombre" type="text" placeholder="WodenTrack RRHH"
                class="w-full px-3 py-1.5 rounded-lg border text-[11px] outline-none transition-all"
                :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'" />
            </div>

            <!-- Toggle habilitado -->
            <div class="flex items-center justify-between p-2.5 rounded-xl border"
              :class="correo.form.habilitado
                ? isDark ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-emerald-300 bg-emerald-50'
                : isDark ? 'border-white/10' : 'border-slate-200'">
              <div>
                <p class="text-[10px] font-bold"
                  :class="correo.form.habilitado ? 'text-emerald-500' : isDark ? 'text-white/60' : 'text-slate-500'">
                  Sistema de correo
                </p>
                <p class="text-[9px] opacity-50" :class="isDark ? 'text-white' : 'text-slate-400'">
                  {{ correo.form.habilitado ? 'Habilitado — se enviarán correos' : 'Deshabilitado — no se enviarán correos' }}
                </p>
              </div>
              <button @click="correo.form.habilitado = !correo.form.habilitado"
                class="w-10 h-5 rounded-full transition-all relative"
                :class="correo.form.habilitado ? 'bg-emerald-500' : isDark ? 'bg-white/10' : 'bg-slate-200'">
                <div class="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-sm"
                  :class="correo.form.habilitado ? 'left-[22px]' : 'left-0.5'"></div>
              </button>
            </div>

            <!-- Acciones -->
            <div class="flex gap-2 mt-auto pt-2">
              <button @click="testConexion" :disabled="correo.testeando"
                class="flex-1 h-8 rounded-xl border text-[9px] font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1.5"
                :class="isDark ? 'border-white/10 text-white/60 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:bg-slate-50'">
                <i class="fas text-[9px]" :class="correo.testeando ? 'fa-circle-notch fa-spin' : 'fa-plug'"></i>
                Probar conexión
              </button>
              <button @click="guardarConfigCorreo" :disabled="correo.guardando"
                class="flex-1 h-8 rounded-xl bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wide hover:bg-emerald-400 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5">
                <i class="fas text-[9px]" :class="correo.guardando ? 'fa-circle-notch fa-spin' : 'fa-save'"></i>
                Guardar
              </button>
            </div>

            <!-- Resultado test -->
            <div v-if="correo.testResult"
              class="px-3 py-2 rounded-xl text-[10px] font-semibold border"
              :class="correo.testResult.ok
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'">
              <i :class="correo.testResult.ok ? 'fas fa-check' : 'fas fa-xmark'" class="mr-1.5"></i>
              {{ correo.testResult.mensaje }}
            </div>
          </div>
        </div>

        <!-- Panel derecho: Envío manual de ausentismo -->
        <div class="rounded-xl border overflow-hidden flex flex-col"
          :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
          <div class="px-4 py-2.5 border-b flex items-center gap-2"
            :class="isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'">
            <i class="fas fa-paper-plane text-blue-500 text-[11px]"></i>
            <span class="text-[10px] font-bold uppercase tracking-wider opacity-60"
              :class="isDark ? 'text-white' : 'text-slate-600'">Envío manual — Ausentismo</span>
          </div>

          <div class="p-4 flex-1 flex flex-col gap-3 overflow-y-auto">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Empleado *</label>
                <input v-model="correo.envio.empleado" type="text" placeholder="Nombre completo"
                  class="w-full px-3 py-1.5 rounded-lg border text-[11px] outline-none"
                  :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'" />
              </div>
              <div>
                <label class="block text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Cédula</label>
                <input v-model="correo.envio.cedula" type="text" placeholder="1234567890"
                  class="w-full px-3 py-1.5 rounded-lg border text-[11px] outline-none"
                  :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Cargo</label>
                <input v-model="correo.envio.cargo" type="text"
                  class="w-full px-3 py-1.5 rounded-lg border text-[11px] outline-none"
                  :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'" />
              </div>
              <div>
                <label class="block text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Departamento</label>
                <input v-model="correo.envio.departamento" type="text"
                  class="w-full px-3 py-1.5 rounded-lg border text-[11px] outline-none"
                  :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Fecha inicio *</label>
                <input v-model="correo.envio.fechaInicio" type="date"
                  class="w-full px-3 py-1.5 rounded-lg border text-[11px] outline-none"
                  :class="isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'" />
              </div>
              <div>
                <label class="block text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Fecha fin</label>
                <input v-model="correo.envio.fechaFin" type="date"
                  class="w-full px-3 py-1.5 rounded-lg border text-[11px] outline-none"
                  :class="isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'" />
              </div>
            </div>

            <div>
              <label class="block text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1"
                :class="isDark ? 'text-white' : 'text-slate-600'">Motivo</label>
              <textarea v-model="correo.envio.motivo" rows="2" placeholder="Descripción del ausentismo…"
                class="w-full px-3 py-1.5 rounded-lg border text-[11px] outline-none resize-none"
                :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'"></textarea>
            </div>

            <div>
              <label class="block text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1"
                :class="isDark ? 'text-white' : 'text-slate-600'">Destinatarios * (separados por coma)</label>
              <input v-model="correo.envio.destinatariosRaw" type="text"
                placeholder="rrhh@empresa.com, jefe@empresa.com"
                class="w-full px-3 py-1.5 rounded-lg border text-[11px] outline-none"
                :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'" />
            </div>

            <button @click="enviarAusentismo"
              :disabled="correo.enviando || !correo.envio.empleado || !correo.envio.fechaInicio || !correo.envio.destinatariosRaw"
              class="h-9 w-full rounded-xl bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-blue-400 disabled:opacity-30 transition-all flex items-center justify-center gap-2">
              <i class="fas text-[10px]" :class="correo.enviando ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'"></i>
              {{ correo.enviando ? 'Enviando…' : 'Enviar reporte de ausentismo' }}
            </button>

            <!-- Resultado envío -->
            <div v-if="correo.envioResult"
              class="px-3 py-2 rounded-xl text-[10px] font-semibold border"
              :class="correo.envioResult.ok
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'">
              <i :class="correo.envioResult.ok ? 'fas fa-check' : 'fas fa-xmark'" class="mr-1.5"></i>
              {{ correo.envioResult.mensaje }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════
         VISTA 6 — IA y Predicción
    ══════════════════════════════════════════════════════════ -->
    <template v-if="subTab === 'ia'">
      <div class="flex items-center justify-between px-3 py-2.5 rounded-xl border shrink-0"
        :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <i class="fas fa-brain text-violet-500 text-xs"></i>
          </div>
          <div>
            <h2 class="text-[11px] font-semibold uppercase tracking-wider"
              :class="isDark ? 'text-white' : 'text-slate-700'">IA y Predicción de Riesgo</h2>
            <p class="text-[9px] font-medium opacity-40 uppercase tracking-wide"
              :class="isDark ? 'text-white' : 'text-slate-500'">Score 0–100 · últimos 30 días</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <input v-model="ia.busqueda" type="text" placeholder="Buscar empleado…"
            class="h-7 px-3 rounded-lg border text-[10px] outline-none w-44 transition-all"
            :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-300'" />
          <select v-model="ia.nivelFiltro"
            class="h-7 px-2 rounded-lg border text-[10px] outline-none transition-all"
            :class="isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'">
            <option value="">Todos</option>
            <option value="alto">Alto riesgo</option>
            <option value="medio">Medio</option>
            <option value="bajo">Bajo</option>
          </select>
          <button @click="cargarIA" :disabled="ia.cargando"
            class="h-7 w-7 rounded-lg border flex items-center justify-center transition-all"
            :class="isDark ? 'border-white/10 text-white/40 hover:bg-white/5' : 'border-slate-200 text-slate-400 hover:bg-slate-50'">
            <i class="fas fa-rotate text-[10px]" :class="ia.cargando ? 'fa-spin' : ''"></i>
          </button>
        </div>
      </div>

      <div class="flex-1 min-h-0 rounded-xl border overflow-auto"
        :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
        <div v-if="ia.cargando" class="flex items-center justify-center h-40">
          <i class="fas fa-circle-notch fa-spin text-violet-500 text-xl"></i>
        </div>
        <table v-else class="w-full text-[10px]">
          <thead>
            <tr class="sticky top-0" :class="isDark ? 'bg-slate-800' : 'bg-slate-50'">
              <th class="px-3 py-2 text-left font-semibold uppercase tracking-wide opacity-50">Empleado</th>
              <th class="px-3 py-2 text-left font-semibold uppercase tracking-wide opacity-50">Área</th>
              <th class="px-3 py-2 text-center font-semibold uppercase tracking-wide opacity-50">Score</th>
              <th class="px-3 py-2 text-center font-semibold uppercase tracking-wide opacity-50">Asist.</th>
              <th class="px-3 py-2 text-center font-semibold uppercase tracking-wide opacity-50">Puntual.</th>
              <th class="px-3 py-2 text-left font-semibold uppercase tracking-wide opacity-50">Patrones detectados</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in iaFiltrados" :key="emp.id_odoo"
              class="border-t transition-colors"
              :class="isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'">
              <td class="px-3 py-2">
                <div class="font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">{{ emp.nombre }}</div>
                <div class="opacity-40 text-[9px]">{{ emp.cargo }}</div>
              </td>
              <td class="px-3 py-2 opacity-60">{{ emp.area }}</td>
              <td class="px-3 py-2 text-center">
                <div class="inline-flex flex-col items-center gap-0.5">
                  <span class="font-bold text-[13px]"
                    :class="emp.nivel === 'alto' ? 'text-rose-500' : emp.nivel === 'medio' ? 'text-amber-500' : 'text-emerald-500'">
                    {{ emp.score }}
                  </span>
                  <span class="px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase"
                    :class="emp.nivel === 'alto'
                      ? 'bg-rose-500/10 text-rose-500'
                      : emp.nivel === 'medio'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-emerald-500/10 text-emerald-500'">
                    {{ emp.nivel }}
                  </span>
                </div>
              </td>
              <td class="px-3 py-2 text-center font-semibold"
                :class="emp.asistenciaPct < 60 ? 'text-rose-500' : emp.asistenciaPct < 80 ? 'text-amber-500' : 'text-emerald-500'">
                {{ emp.asistenciaPct }}%
              </td>
              <td class="px-3 py-2 text-center font-semibold"
                :class="emp.puntualidadPct < 50 ? 'text-rose-500' : emp.puntualidadPct < 70 ? 'text-amber-500' : 'text-emerald-500'">
                {{ emp.puntualidadPct }}%
              </td>
              <td class="px-3 py-2">
                <div class="flex flex-wrap gap-1">
                  <span v-for="p in emp.patrones" :key="p"
                    class="px-1.5 py-0.5 rounded text-[8px] font-medium bg-rose-500/10 text-rose-500">{{ p }}</span>
                  <span v-if="!emp.patrones.length" class="opacity-30 text-[9px]">Sin patrones</span>
                </div>
              </td>
            </tr>
            <tr v-if="!iaFiltrados.length">
              <td colspan="6" class="px-3 py-8 text-center opacity-30">Sin datos</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════
         VISTA 7 — Tendencias 12 meses
    ══════════════════════════════════════════════════════════ -->
    <template v-if="subTab === 'tendencias'">
      <div class="flex items-center justify-between px-3 py-2.5 rounded-xl border shrink-0"
        :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <i class="fas fa-chart-line text-cyan-500 text-xs"></i>
          </div>
          <div>
            <h2 class="text-[11px] font-semibold uppercase tracking-wider"
              :class="isDark ? 'text-white' : 'text-slate-700'">Tendencias 12 Meses</h2>
            <p class="text-[9px] font-medium opacity-40 uppercase tracking-wide"
              :class="isDark ? 'text-white' : 'text-slate-500'">Puntualidad y ausentismo por departamento</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <select v-model="tend.depto"
            class="h-7 px-2 rounded-lg border text-[10px] outline-none transition-all"
            :class="isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'">
            <option value="">Todos los deptos.</option>
            <option v-for="d in tendDeptos" :key="d" :value="d">{{ d }}</option>
          </select>
          <button @click="cargarTendencias" :disabled="tend.cargando"
            class="h-7 w-7 rounded-lg border flex items-center justify-center transition-all"
            :class="isDark ? 'border-white/10 text-white/40 hover:bg-white/5' : 'border-slate-200 text-slate-400 hover:bg-slate-50'">
            <i class="fas fa-rotate text-[10px]" :class="tend.cargando ? 'fa-spin' : ''"></i>
          </button>
        </div>
      </div>

      <div class="flex-1 min-h-0 rounded-xl border overflow-auto p-4"
        :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
        <div v-if="tend.cargando" class="flex items-center justify-center h-40">
          <i class="fas fa-circle-notch fa-spin text-cyan-500 text-xl"></i>
        </div>
        <div v-else-if="!tendDataFiltrado.length" class="flex items-center justify-center h-40 opacity-30 text-sm">Sin datos</div>
        <template v-else>
          <!-- Leyenda -->
          <div class="flex items-center gap-4 mb-4">
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-0.5 bg-emerald-500 rounded"></div>
              <span class="text-[9px] font-semibold uppercase opacity-60" :class="isDark ? 'text-white' : 'text-slate-600'">Puntualidad %</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-0.5 bg-rose-500 rounded"></div>
              <span class="text-[9px] font-semibold uppercase opacity-60" :class="isDark ? 'text-white' : 'text-slate-600'">Ausentismo %</span>
            </div>
          </div>
          <!-- SVG Chart -->
          <div class="overflow-x-auto">
            <svg :width="tendSvgW" height="220" class="overflow-visible">
              <!-- Grid lines -->
              <line v-for="y in [0,25,50,75,100]" :key="y"
                x1="50" :y1="tendY(y)" :x2="tendSvgW - 10" :y2="tendY(y)"
                :stroke="isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'" stroke-width="1"/>
              <!-- Y labels -->
              <text v-for="y in [0,25,50,75,100]" :key="'l'+y"
                x="44" :y="tendY(y) + 4" text-anchor="end" font-size="8"
                :fill="isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'">{{ y }}</text>
              <!-- Puntualidad polyline -->
              <polyline :points="tendPoints('puntualidadPct')" fill="none" stroke="#10b981" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
              <!-- Ausentismo polyline -->
              <polyline :points="tendPoints('ausentismoPct')" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
              <!-- Dots puntualidad -->
              <circle v-for="(p, i) in tendDataFiltrado" :key="'dp'+i"
                :cx="tendX(i)" :cy="tendY(p.puntualidadPct)" r="3" fill="#10b981">
                <title>{{ p.mes }} · {{ p.departamento }} · Puntualidad: {{ p.puntualidadPct }}%</title>
              </circle>
              <!-- Dots ausentismo -->
              <circle v-for="(p, i) in tendDataFiltrado" :key="'da'+i"
                :cx="tendX(i)" :cy="tendY(p.ausentismoPct)" r="3" fill="#f43f5e">
                <title>{{ p.mes }} · {{ p.departamento }} · Ausentismo: {{ p.ausentismoPct }}%</title>
              </circle>
              <!-- X labels -->
              <text v-for="(p, i) in tendDataFiltrado" :key="'xl'+i"
                :x="tendX(i)" y="215" text-anchor="middle" font-size="7"
                :fill="isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'">{{ p.mes?.substring(5) }}</text>
            </svg>
          </div>
        </template>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════
         VISTA 8 — Ranking de departamentos
    ══════════════════════════════════════════════════════════ -->
    <template v-if="subTab === 'ranking'">
      <div class="flex items-center justify-between px-3 py-2.5 rounded-xl border shrink-0"
        :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <i class="fas fa-trophy text-amber-500 text-xs"></i>
          </div>
          <div>
            <h2 class="text-[11px] font-semibold uppercase tracking-wider"
              :class="isDark ? 'text-white' : 'text-slate-700'">Ranking del Mes</h2>
            <p class="text-[9px] font-medium opacity-40 uppercase tracking-wide"
              :class="isDark ? 'text-white' : 'text-slate-500'">Mejores y peores áreas en asistencia + puntualidad</p>
          </div>
        </div>
        <button @click="cargarRanking" :disabled="rank.cargando"
          class="h-7 w-7 rounded-lg border flex items-center justify-center transition-all"
          :class="isDark ? 'border-white/10 text-white/40 hover:bg-white/5' : 'border-slate-200 text-slate-400 hover:bg-slate-50'">
          <i class="fas fa-rotate text-[10px]" :class="rank.cargando ? 'fa-spin' : ''"></i>
        </button>
      </div>

      <div class="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div v-if="rank.cargando" class="col-span-2 flex items-center justify-center h-40">
          <i class="fas fa-circle-notch fa-spin text-amber-500 text-xl"></i>
        </div>
        <template v-else>
          <!-- Mejores -->
          <div class="rounded-xl border overflow-hidden"
            :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
            <div class="px-4 py-2.5 border-b flex items-center gap-2"
              :class="isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'">
              <i class="fas fa-star text-amber-400 text-xs"></i>
              <span class="text-[10px] font-bold uppercase tracking-wider opacity-60"
                :class="isDark ? 'text-white' : 'text-slate-600'">Top 3 — Mejor desempeño</span>
            </div>
            <div class="p-4 flex flex-col gap-3">
              <div v-for="(area, idx) in rank.mejores" :key="area.area"
                class="flex items-center gap-3 p-3 rounded-xl border"
                :class="isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'">
                <div class="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
                  :class="idx === 0 ? 'bg-amber-400/10' : idx === 1 ? 'bg-slate-400/10' : 'bg-orange-400/10'">
                  <span>{{ idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉' }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-[11px] font-bold truncate" :class="isDark ? 'text-white' : 'text-slate-800'">{{ area.area }}</div>
                  <div class="text-[9px] opacity-40">{{ area.departamento }} · {{ area.totalEmpleados }} emp.</div>
                  <div class="flex gap-2 mt-1">
                    <div class="flex items-center gap-1">
                      <div class="h-1 rounded-full bg-emerald-500/20 w-20 overflow-hidden">
                        <div class="h-full rounded-full bg-emerald-500 transition-all" :style="{ width: area.asistenciaPct + '%' }"></div>
                      </div>
                      <span class="text-[9px] text-emerald-500 font-bold">{{ area.asistenciaPct }}%</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <div class="h-1 rounded-full bg-blue-500/20 w-20 overflow-hidden">
                        <div class="h-full rounded-full bg-blue-500 transition-all" :style="{ width: area.puntualidadPct + '%' }"></div>
                      </div>
                      <span class="text-[9px] text-blue-500 font-bold">{{ area.puntualidadPct }}%</span>
                    </div>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-[18px] font-black"
                    :class="isDark ? 'text-white' : 'text-slate-800'">{{ area.score }}</div>
                  <div class="text-[8px] opacity-40 uppercase tracking-wide">score</div>
                </div>
              </div>
              <div v-if="!rank.mejores.length" class="text-center opacity-30 text-sm py-6">Sin datos</div>
            </div>
          </div>

          <!-- Peores -->
          <div class="rounded-xl border overflow-hidden"
            :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
            <div class="px-4 py-2.5 border-b flex items-center gap-2"
              :class="isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'">
              <i class="fas fa-triangle-exclamation text-rose-400 text-xs"></i>
              <span class="text-[10px] font-bold uppercase tracking-wider opacity-60"
                :class="isDark ? 'text-white' : 'text-slate-600'">Bottom 3 — Requieren atención</span>
            </div>
            <div class="p-4 flex flex-col gap-3">
              <div v-for="(area, idx) in rank.peores" :key="area.area"
                class="flex items-center gap-3 p-3 rounded-xl border"
                :class="isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'">
                <div class="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 bg-rose-500/10">
                  <span>{{ idx === 0 ? '⚠️' : idx === 1 ? '📉' : '🔴' }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-[11px] font-bold truncate" :class="isDark ? 'text-white' : 'text-slate-800'">{{ area.area }}</div>
                  <div class="text-[9px] opacity-40">{{ area.departamento }} · {{ area.totalEmpleados }} emp.</div>
                  <div class="flex gap-2 mt-1">
                    <div class="flex items-center gap-1">
                      <div class="h-1 rounded-full bg-rose-500/20 w-20 overflow-hidden">
                        <div class="h-full rounded-full bg-rose-500 transition-all" :style="{ width: area.asistenciaPct + '%' }"></div>
                      </div>
                      <span class="text-[9px] text-rose-500 font-bold">{{ area.asistenciaPct }}%</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <div class="h-1 rounded-full bg-amber-500/20 w-20 overflow-hidden">
                        <div class="h-full rounded-full bg-amber-500 transition-all" :style="{ width: area.puntualidadPct + '%' }"></div>
                      </div>
                      <span class="text-[9px] text-amber-500 font-bold">{{ area.puntualidadPct }}%</span>
                    </div>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-[18px] font-black text-rose-500">{{ area.score }}</div>
                  <div class="text-[8px] opacity-40 uppercase tracking-wide">score</div>
                </div>
              </div>
              <div v-if="!rank.peores.length" class="text-center opacity-30 text-sm py-6">Sin datos</div>
            </div>
          </div>
        </template>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({ isDark: Boolean });
const emit  = defineEmits(['success', 'error']);
const API_URL = import.meta.env.VITE_API_URL;

const TABS = [
  { key: 'sin-malla',   icon: 'fas fa-user-slash',  label: 'Sin malla'   },
  { key: 'masivo',      icon: 'fas fa-layer-group',  label: 'Asig. masiva'},
  { key: 'heatmap',     icon: 'fas fa-th',           label: 'Heatmap'     },
  { key: 'comparativa', icon: 'fas fa-chart-bar',    label: 'Comparativa' },
  { key: 'correo',      icon: 'fas fa-envelope',     label: 'Correo'      },
  { key: 'ia',          icon: 'fas fa-brain',         label: 'IA Riesgo'   },
  { key: 'tendencias',  icon: 'fas fa-chart-line',    label: 'Tendencias'  },
  { key: 'ranking',     icon: 'fas fa-trophy',        label: 'Ranking'     },
];
const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const subTab = ref('sin-malla');

// ── Helpers de fecha ──────────────────────────────────────────
const hoy = () => new Date().toISOString().split('T')[0];
const hace30 = () => {
  const d = new Date(); d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
};

// ── Estado: Sin malla ─────────────────────────────────────────
const sm = ref({ cargando: false, data: [] });
const smBusqueda = ref('');
const smFiltrados = computed(() => {
  if (!smBusqueda.value.trim()) return sm.value.data;
  const q = smBusqueda.value.toLowerCase();
  return sm.value.data.filter(e =>
    e.nombre?.toLowerCase().includes(q) ||
    e.area?.toLowerCase().includes(q) ||
    e.departamento?.toLowerCase().includes(q)
  );
});

const cargarSinMalla = async () => {
  sm.value.cargando = true;
  try {
    const res = await fetch(`${API_URL}/superadmin/analitica/sin-malla`);
    if (!res.ok) throw new Error();
    sm.value.data = await res.json();
    masivo.value.seleccionados = [];
  } catch { emit('error', 'Error al cargar empleados sin malla'); }
  finally { sm.value.cargando = false; }
};

// ── Estado: Asignación masiva ─────────────────────────────────
const masivo = ref({ seleccionados: [], mallaId: '', mallas: [], guardando: false });

const toggleSeleccion = (id) => {
  const idx = masivo.value.seleccionados.indexOf(id);
  if (idx === -1) masivo.value.seleccionados.push(id);
  else masivo.value.seleccionados.splice(idx, 1);
};
const toggleSeleccionarTodos = () => {
  if (masivo.value.seleccionados.length === sm.value.data.length) {
    masivo.value.seleccionados = [];
  } else {
    masivo.value.seleccionados = sm.value.data.map(e => e.id_odoo);
  }
};

const cargarMallas = async () => {
  try {
    const res = await fetch(`${API_URL}/mallas-admin`);
    if (!res.ok) throw new Error();
    masivo.value.mallas = (await res.json()).filter(m => m.activa);
  } catch { emit('error', 'Error al cargar mallas'); }
};

const ejecutarAsignacionMasiva = async () => {
  if (!masivo.value.mallaId || !masivo.value.seleccionados.length) return;
  masivo.value.guardando = true;
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const asignaciones = masivo.value.seleccionados.map(id => ({
      usuarioIdOdoo: id,
      mallaId: Number(masivo.value.mallaId),
    }));
    const res = await fetch(`${API_URL}/superadmin/analitica/asignar-masivo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asignaciones, asignadoPor: session.name || 'superadmin' }),
    });
    if (!res.ok) throw new Error();
    const r = await res.json();
    emit('success', `${r.procesados} empleados asignados correctamente`);
    masivo.value.seleccionados = [];
    masivo.value.mallaId = '';
    await cargarSinMalla();
  } catch { emit('error', 'Error al asignar mallas'); }
  finally { masivo.value.guardando = false; }
};

// ── Estado: Heatmap ───────────────────────────────────────────
const hm = ref({ cargando: false, data: null, startDate: hace30(), endDate: hoy(), departamento: '' });

const heatColor = (pct) => {
  const h = Math.round(pct * 1.2); // 0→rojo, 100→verde
  return `hsl(${h}, 72%, 42%)`;
};

// Organizar días en semanas (7 columnas: Dom-Sáb)
const hmSemanas = computed(() => {
  if (!hm.value.data?.grid?.length) return [];
  const grid = hm.value.data.grid;
  const semanas = [];
  let semana = new Array(7).fill(null);

  for (const dia of grid) {
    semana[dia.diaSemana] = dia;
    if (dia.diaSemana === 6) {
      semanas.push([...semana]);
      semana = new Array(7).fill(null);
    }
  }
  if (semana.some(d => d !== null)) semanas.push(semana);
  return semanas;
});

const cargarHeatmap = async () => {
  if (!hm.value.startDate || !hm.value.endDate) return;
  hm.value.cargando = true;
  try {
    const params = new URLSearchParams({ startDate: hm.value.startDate, endDate: hm.value.endDate });
    if (hm.value.departamento) params.set('departamento', hm.value.departamento);
    const res = await fetch(`${API_URL}/superadmin/analitica/heatmap?${params}`);
    if (!res.ok) throw new Error();
    hm.value.data = await res.json();
  } catch { emit('error', 'Error al cargar heatmap'); }
  finally { hm.value.cargando = false; }
};

// ── Estado: Comparativa ───────────────────────────────────────
const comp = ref({ cargando: false, data: [], startDate: hace30(), endDate: hoy() });

const cargarComparativa = async () => {
  if (!comp.value.startDate || !comp.value.endDate) return;
  comp.value.cargando = true;
  try {
    const params = new URLSearchParams({ startDate: comp.value.startDate, endDate: comp.value.endDate });
    const res = await fetch(`${API_URL}/superadmin/analitica/comparativa-areas?${params}`);
    if (!res.ok) throw new Error();
    comp.value.data = await res.json();
  } catch { emit('error', 'Error al cargar comparativa'); }
  finally { comp.value.cargando = false; }
};

// ── Estado: Correo ────────────────────────────────────────────
const correo = ref({
  config:      { host: '', port: '587', user: '', passConfigurado: false, fromNombre: 'WodenTrack', habilitado: false },
  form:        { host: '', port: '587', user: '', pass: '', fromNombre: 'WodenTrack', habilitado: false },
  guardando:   false,
  testeando:   false,
  testResult:  null,
  enviando:    false,
  envioResult: null,
  envio: {
    empleado: '', cedula: '', cargo: '', departamento: '', area: '',
    fechaInicio: hoy(), fechaFin: '', motivo: '', destinatariosRaw: '',
  },
});

const cargarConfigCorreo = async () => {
  try {
    const res = await fetch(`${API_URL}/superadmin/correo/config`);
    if (!res.ok) throw new Error();
    const cfg = await res.json();
    correo.value.config = cfg;
    correo.value.form = {
      host:        cfg.host,
      port:        cfg.port,
      user:        cfg.user,
      pass:        '',
      fromNombre:  cfg.fromNombre,
      habilitado:  cfg.habilitado,
    };
  } catch { emit('error', 'Error al cargar configuración de correo'); }
};

const guardarConfigCorreo = async () => {
  correo.value.guardando = true;
  correo.value.testResult = null;
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const res = await fetch(`${API_URL}/superadmin/correo/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...correo.value.form, updatedBy: session.name || 'superadmin' }),
    });
    if (!res.ok) throw new Error();
    emit('success', 'Configuración de correo guardada');
    await cargarConfigCorreo();
  } catch { emit('error', 'Error al guardar configuración'); }
  finally { correo.value.guardando = false; }
};

const testConexion = async () => {
  correo.value.testeando = true;
  correo.value.testResult = null;
  try {
    const res = await fetch(`${API_URL}/superadmin/correo/test`, { method: 'POST' });
    correo.value.testResult = await res.json();
  } catch { correo.value.testResult = { ok: false, mensaje: 'Error al conectar con el servidor' }; }
  finally { correo.value.testeando = false; }
};

const enviarAusentismo = async () => {
  const e = correo.value.envio;
  if (!e.empleado || !e.fechaInicio || !e.destinatariosRaw) return;
  correo.value.enviando = true;
  correo.value.envioResult = null;
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const destinatarios = e.destinatariosRaw.split(',').map(s => s.trim()).filter(Boolean);
    const res = await fetch(`${API_URL}/superadmin/correo/ausentismo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empleado:      e.empleado,
        cedula:        e.cedula   || undefined,
        cargo:         e.cargo    || undefined,
        departamento:  e.departamento || undefined,
        area:          e.area     || undefined,
        fechaInicio:   e.fechaInicio,
        fechaFin:      e.fechaFin || undefined,
        motivo:        e.motivo   || undefined,
        destinatarios,
        enviadoPor:    session.name || 'superadmin',
      }),
    });
    correo.value.envioResult = await res.json();
    if (correo.value.envioResult.ok) emit('success', 'Reporte de ausentismo enviado');
  } catch { correo.value.envioResult = { ok: false, mensaje: 'Error de red al enviar' }; }
  finally { correo.value.enviando = false; }
};

// ── Estado: IA y Predicción ───────────────────────────────────
const ia = ref({ cargando: false, data: [], busqueda: '', nivelFiltro: '' });
const iaFiltrados = computed(() => {
  let list = ia.value.data;
  if (ia.value.nivelFiltro) list = list.filter(e => e.nivel === ia.value.nivelFiltro);
  if (ia.value.busqueda.trim()) {
    const q = ia.value.busqueda.toLowerCase();
    list = list.filter(e => e.nombre?.toLowerCase().includes(q) || e.area?.toLowerCase().includes(q));
  }
  return list;
});
const cargarIA = async () => {
  ia.value.cargando = true;
  try {
    const r = await fetch(`${API_URL}/superadmin/ia/scores`);
    const d = await r.json();
    ia.value.data = Array.isArray(d) ? d : [];
  } catch { emit('error', 'Error cargando scores de riesgo'); }
  finally { ia.value.cargando = false; }
};

// ── Estado: Tendencias 12 meses ───────────────────────────────
const tend = ref({ cargando: false, data: [], depto: '' });
const tendDeptos = computed(() => [...new Set(tend.value.data.map(d => d.departamento))].sort());
const tendDataFiltrado = computed(() => {
  if (!tend.value.depto) {
    // Agrupar por mes, promediar departamentos
    const mesMap = new Map();
    for (const d of tend.value.data) {
      if (!mesMap.has(d.mes)) mesMap.set(d.mes, { mes: d.mes, departamento: 'Todos', _p: [], _a: [] });
      mesMap.get(d.mes)._p.push(d.puntualidadPct);
      mesMap.get(d.mes)._a.push(d.ausentismoPct);
    }
    return [...mesMap.values()].map(m => ({
      mes: m.mes,
      departamento: 'Todos',
      puntualidadPct: Math.round(m._p.reduce((a, b) => a + b, 0) / m._p.length),
      ausentismoPct: Math.round(m._a.reduce((a, b) => a + b, 0) / m._a.length),
    })).sort((a, b) => a.mes.localeCompare(b.mes));
  }
  return tend.value.data.filter(d => d.departamento === tend.value.depto).sort((a, b) => a.mes.localeCompare(b.mes));
});
const TEND_PAD_L = 50, TEND_PAD_R = 10, TEND_PAD_T = 10, TEND_H = 200;
const tendSvgW = computed(() => Math.max(400, tendDataFiltrado.value.length * 60 + TEND_PAD_L + TEND_PAD_R));
const tendX = (i) => TEND_PAD_L + i * ((tendSvgW.value - TEND_PAD_L - TEND_PAD_R) / Math.max(tendDataFiltrado.value.length - 1, 1));
const tendY = (pct) => TEND_PAD_T + (1 - pct / 100) * TEND_H;
const tendPoints = (field) => tendDataFiltrado.value.map((p, i) => `${tendX(i)},${tendY(p[field])}`).join(' ');
const cargarTendencias = async () => {
  tend.value.cargando = true;
  try {
    const r = await fetch(`${API_URL}/superadmin/ia/tendencias`);
    const d = await r.json();
    tend.value.data = Array.isArray(d) ? d : [];
  } catch { emit('error', 'Error cargando tendencias'); }
  finally { tend.value.cargando = false; }
};

// ── Estado: Ranking ───────────────────────────────────────────
const rank = ref({ cargando: false, mejores: [], peores: [] });
const cargarRanking = async () => {
  rank.value.cargando = true;
  try {
    const r = await fetch(`${API_URL}/superadmin/ia/ranking`);
    const d = await r.json();
    rank.value.mejores = Array.isArray(d?.mejores) ? d.mejores : [];
    rank.value.peores  = Array.isArray(d?.peores)  ? d.peores  : [];
  } catch { emit('error', 'Error cargando ranking'); }
  finally { rank.value.cargando = false; }
};

// ── Lazy load por tab ─────────────────────────────────────────
watch(subTab, (tab) => {
  if (tab === 'ia' && !ia.value.data.length) cargarIA();
  if (tab === 'tendencias' && !tend.value.data.length) cargarTendencias();
  if (tab === 'ranking' && !rank.value.mejores.length) cargarRanking();
});

// ── Carga inicial ─────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([cargarSinMalla(), cargarMallas(), cargarConfigCorreo()]);
});
</script>
