<template>
  <div class="h-full flex flex-col gap-2.5 overflow-y-auto custom-scroll pr-1">

    <!-- ── Filtros (PrimeVue) ──────────────────────────────────────────────── -->
    <div class="rounded-xl border p-3 flex flex-wrap items-end gap-3 shrink-0"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-bold uppercase tracking-wide"
          :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Desde</label>
        <DatePicker v-model="filtroDesde" dateFormat="dd/mm/yy" showIcon iconDisplay="input"
          inputClass="!h-8 !text-[12px]" class="w-36" />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-bold uppercase tracking-wide"
          :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Hasta</label>
        <DatePicker v-model="filtroHasta" dateFormat="dd/mm/yy" showIcon iconDisplay="input"
          inputClass="!h-8 !text-[12px]" class="w-36" />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-bold uppercase tracking-wide"
          :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Área / Departamento</label>
        <AutoComplete v-model="departamentoSeleccionado" :suggestions="departamentosFiltrados"
          @complete="filtrarDepartamentos" @clear="departamentoSeleccionado = ''" dropdown
          placeholder="Todas las áreas" inputClass="!h-8 !text-[12px] !w-48" />
      </div>

      <Button @click="cargarTodo" label="Actualizar" icon="pi pi-refresh" :loading="cargando" class="!h-8 !px-4 !text-[12px]" />
    </div>

    <div v-if="error" class="rounded-lg border px-3 py-2 text-[12px]"
      :class="isDark ? 'bg-red-950/40 border-red-900/60 text-red-300' : 'bg-red-50 border-red-200 text-red-700'">
      {{ error }}
    </div>

    <!-- ── 6 Tarjetas KPI ──────────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
      <div class="rounded-2xl border p-3 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[11px] font-medium" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Cumplimiento</span>
          <span class="w-6 h-6 rounded-lg flex items-center justify-center text-[11px]"
            :class="isDark ? 'bg-[#3B82F6]/15 text-[#60A5FA]' : 'bg-[#EEF4FF] text-[#2563eb]'">
            <i class="pi pi-shield"></i>
          </span>
        </div>
        <p class="text-lg font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ kpi.cumplimientoPromedio }}%</p>
      </div>

      <div class="rounded-2xl border p-3 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[11px] font-medium" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Puntualidad</span>
          <span class="w-6 h-6 rounded-lg flex items-center justify-center text-[11px]"
            :class="isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'">
            <i class="pi pi-check-circle"></i>
          </span>
        </div>
        <p class="text-lg font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ kpi.puntualidad }}%</p>
      </div>

      <div class="rounded-2xl border p-3 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[11px] font-medium" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Llegadas tarde</span>
          <span class="w-6 h-6 rounded-lg flex items-center justify-center text-[11px]"
            :class="isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-500'">
            <i class="pi pi-clock"></i>
          </span>
        </div>
        <p class="text-lg font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ kpi.totalTardanzas }}</p>
      </div>

      <div class="rounded-2xl border p-3 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[11px] font-medium" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Ausencias</span>
          <span class="w-6 h-6 rounded-lg flex items-center justify-center text-[11px]"
            :class="isDark ? 'bg-orange-500/15 text-orange-400' : 'bg-orange-50 text-orange-600'">
            <i class="pi pi-user-minus"></i>
          </span>
        </div>
        <p class="text-lg font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ kpi.totalAusencias }}</p>
        <p class="text-[10px] mt-0.5" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">{{ kpi.ausenciasInjustificadas }} sin justificar</p>
      </div>
    </div>

    <!-- ── Cumplimiento por área (barras horizontales) + Estado de asistencia (dona) ── -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-2.5 shrink-0">
      <div class="lg:col-span-2 rounded-2xl border p-3 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-[12px] font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">Cumplimiento por área</h3>
          <div class="flex items-center gap-3 text-[11px]" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#22C55E]"></span>≥ 90%</span>
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#F59E0B]"></span>80–90%</span>
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#EF4444]"></span>&lt; 80%</span>
          </div>
        </div>
        <div :style="{ height: alturaBarrasArea }">
          <Chart v-if="chartCumplimiento" type="bar" :data="chartCumplimiento" :options="opcionesBarrasHorizontal" class="w-full h-full" />
          <p v-else class="text-[12px]" :class="isDark ? 'text-[#888888]' : 'text-slate-400'">Sin datos para el periodo seleccionado.</p>
        </div>

        <!-- Extremos por área: quién más llega tarde y quién es más puntual -->
        <div v-if="cumplimientoAreas.length" class="mt-3 overflow-x-auto">
          <table class="w-full text-[11px]">
            <thead>
              <tr :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
                <th class="text-left font-semibold py-1.5 pr-3">Área</th>
                <th class="text-left font-semibold py-1.5 pr-3">Más llega tarde</th>
                <th class="text-left font-semibold py-1.5">Más puntual</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in cumplimientoAreas" :key="a.departamento" class="border-t"
                :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                <td class="py-1.5 pr-3 font-medium" :class="isDark ? 'text-white' : 'text-slate-900'">{{ a.departamento }}</td>
                <td class="py-1.5 pr-3" :class="isDark ? 'text-red-400' : 'text-red-600'">{{ a.peor_empleado || '—' }}</td>
                <td class="py-1.5" :class="isDark ? 'text-emerald-400' : 'text-emerald-600'">{{ a.mejor_empleado || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="rounded-2xl border p-3 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <h3 class="text-[12px] font-bold mb-2" :class="isDark ? 'text-white' : 'text-slate-900'">Estado de asistencia</h3>
        <div class="h-56">
          <Chart v-if="chartEstado" type="doughnut" :data="chartEstado" :options="opcionesDona" class="w-full h-full" />
          <p v-else class="text-[12px]" :class="isDark ? 'text-[#888888]' : 'text-slate-400'">Sin datos.</p>
        </div>
      </div>
    </div>

    <!-- ── Tardanzas por área / por día ────────────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-2.5 shrink-0">
      <div class="rounded-2xl border p-3 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <h3 class="text-[12px] font-bold mb-2" :class="isDark ? 'text-white' : 'text-slate-900'">Tardanzas por área</h3>
        <div class="h-48">
          <Chart v-if="chartTardanzasArea" type="bar" :data="chartTardanzasArea" :options="opcionesBarrasVerticales" class="w-full h-full" />
          <p v-else class="text-[12px]" :class="isDark ? 'text-[#888888]' : 'text-slate-400'">Sin tardanzas en el periodo.</p>
        </div>
      </div>

      <div class="rounded-2xl border p-3 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <h3 class="text-[12px] font-bold mb-2" :class="isDark ? 'text-white' : 'text-slate-900'">Tardanzas por día</h3>
        <div class="h-48">
          <Chart v-if="chartTardanzasDia" type="line" :data="chartTardanzasDia" :options="opcionesLineaTardanzas" class="w-full h-full" />
          <p v-else class="text-[12px]" :class="isDark ? 'text-[#888888]' : 'text-slate-400'">Sin tardanzas en el periodo.</p>
        </div>
      </div>
    </div>

    <!-- ── Días destacados: clic para ver el detalle de ese día abajo ──────── -->
    <div v-if="diaMasTardanzas || diaMasAusencias" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 shrink-0">
      <button v-if="diaMasTardanzas" type="button" @click="irADetalleDia(diaMasTardanzas.fecha)"
        class="text-left rounded-2xl border p-3 shadow-sm transition-colors"
        :class="isDark ? 'bg-[#161B26] border-[#222938] hover:bg-white/[0.03]' : 'bg-white border-slate-200 hover:bg-slate-50'">
        <div class="flex items-center gap-2">
          <span class="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] shrink-0"
            :class="isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'">
            <i class="pi pi-clock"></i>
          </span>
          <div>
            <p class="text-[11px] font-medium" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Día con más llegadas tarde</p>
            <p class="text-[13px] font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">
              {{ formatFechaISO(diaMasTardanzas.fecha) }} — {{ diaMasTardanzas.total_tardanzas }} tardanzas
            </p>
          </div>
        </div>
      </button>
      <button v-if="diaMasAusencias" type="button" @click="irADetalleDia(diaMasAusencias.fecha)"
        class="text-left rounded-2xl border p-3 shadow-sm transition-colors"
        :class="isDark ? 'bg-[#161B26] border-[#222938] hover:bg-white/[0.03]' : 'bg-white border-slate-200 hover:bg-slate-50'">
        <div class="flex items-center gap-2">
          <span class="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] shrink-0"
            :class="isDark ? 'bg-orange-500/15 text-orange-400' : 'bg-orange-50 text-orange-600'">
            <i class="pi pi-user-minus"></i>
          </span>
          <div>
            <p class="text-[11px] font-medium" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Día con más ausencias</p>
            <p class="text-[13px] font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">
              {{ formatFechaISO(diaMasAusencias.fecha) }} — {{ diaMasAusencias.total_ausencias }} ausencias
            </p>
          </div>
        </div>
      </button>
    </div>

    <!-- ── Distribución de minutos de tardanza ─────────────────────────────── -->
    <div class="rounded-2xl border p-3 shadow-sm shrink-0"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <h3 class="text-[12px] font-bold mb-2" :class="isDark ? 'text-white' : 'text-slate-900'">Distribución de minutos de tardanza</h3>
      <div class="h-44">
        <Chart v-if="chartDistribucionMinutos" type="bar" :data="chartDistribucionMinutos" :options="opcionesBarrasVerticales" class="w-full h-full" />
        <p v-else class="text-[12px]" :class="isDark ? 'text-[#888888]' : 'text-slate-400'">Sin tardanzas en el periodo.</p>
      </div>
    </div>

    <!-- ── Tendencia de cumplimiento / tardanzas ───────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-2.5 shrink-0">
      <div class="rounded-2xl border p-3 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <h3 class="text-[12px] font-bold mb-2" :class="isDark ? 'text-white' : 'text-slate-900'">Tendencia mes a mes — % de cumplimiento</h3>
        <div class="h-44">
          <Chart v-if="chartTendencia" type="line" :data="chartTendencia" :options="opcionesLinea" class="w-full h-full" />
          <p v-else class="text-[12px]" :class="isDark ? 'text-[#888888]' : 'text-slate-400'">Sin datos para el rango seleccionado.</p>
        </div>
      </div>
      <div class="rounded-2xl border p-3 shadow-sm"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <h3 class="text-[12px] font-bold mb-2" :class="isDark ? 'text-white' : 'text-slate-900'">Tendencia mes a mes — # de tardanzas</h3>
        <div class="h-44">
          <Chart v-if="chartTendenciaTardanzas" type="line" :data="chartTendenciaTardanzas" :options="opcionesLineaTardanzas" class="w-full h-full" />
          <p v-else class="text-[12px]" :class="isDark ? 'text-[#888888]' : 'text-slate-400'">Sin datos para el rango seleccionado.</p>
        </div>
      </div>
    </div>

    <!-- ── Personas que requieren atención ─────────────────────────────────── -->
    <div class="rounded-2xl border p-3 shadow-sm shrink-0"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <h3 class="text-[12px] font-bold mb-2" :class="isDark ? 'text-white' : 'text-slate-900'">Personas que requieren atención</h3>
      <p class="text-[10px] mb-2" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">3+ tardanzas o alguna ausencia sin justificar en el periodo seleccionado.</p>
      <DataTable :value="personasAtencion" paginator :rows="8" size="small" scrollable scrollHeight="220px"
        :class="isDark ? 'p-datatable-dark' : ''">
        <Column field="nombre" header="Nombre" sortable />
        <Column field="cedula" header="Cédula" sortable style="width: 130px" />
        <Column field="departamento" header="Área" sortable />
        <Column field="total_tardanzas" header="Tardanzas" sortable style="width: 110px">
          <template #body="{ data }">
            <span v-if="data.total_tardanzas > 0" v-tooltip.top="{ value: tooltipTardanzas(data.tardanzas_detalle), escape: false }"
              class="px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-help"
              :class="isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'">{{ data.total_tardanzas }}</span>
            <span v-else>—</span>
          </template>
        </Column>
        <Column field="ausencias_injustificadas" header="Ausencias s/justificar" sortable style="width: 160px">
          <template #body="{ data }">
            <span v-if="data.ausencias_injustificadas > 0" v-tooltip.top="{ value: tooltipAusencias(data.ausencias_detalle), escape: false }"
              class="px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-help"
              :class="isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600'">{{ data.ausencias_injustificadas }}</span>
            <span v-else>—</span>
          </template>
        </Column>
        <template #empty>Nadie requiere atención en el periodo seleccionado.</template>
      </DataTable>
    </div>

    <!-- ── Detalle de un día específico ──────────────────────────────────── -->
    <div ref="detalleDiaSection" class="rounded-2xl border p-3 shadow-sm shrink-0"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <div class="flex flex-wrap items-end justify-between gap-2 mb-2">
        <div class="flex flex-wrap items-end gap-2">
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold uppercase tracking-wide"
              :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Ver detalle del día</label>
            <DatePicker v-model="diaDetalleDate" dateFormat="dd/mm/yy" showIcon iconDisplay="input"
              inputClass="!h-8 !text-[12px]" class="w-40" />
          </div>
          <Button @click="cargarDetalleDia" label="Consultar" icon="pi pi-search" :loading="cargandoDia" size="small" severity="secondary" outlined />
        </div>
        <span v-if="detalleDia.length" class="text-[11px] font-semibold px-2 py-1 rounded-full"
          :class="isDark ? 'bg-white/[0.06] text-[#888888]' : 'bg-slate-100 text-slate-500'">
          {{ detalleDia.filter(d => d.estado === 'ENTRADA TARDE').length }} de {{ detalleDia.length }} llegaron tarde
        </span>
      </div>
      <DataTable :value="detalleDia" paginator :rows="10" size="small" scrollable scrollHeight="220px"
        :class="isDark ? 'p-datatable-dark' : ''">
        <Column field="nombre" header="Nombre" sortable />
        <Column field="cedula" header="Cédula" sortable style="width: 130px" />
        <Column field="departamento" header="Área" sortable />
        <Column field="entrada" header="Entrada" sortable style="width: 100px" />
        <Column field="salida" header="Salida" sortable style="width: 100px" />
        <Column field="estado" header="Estado" sortable style="width: 140px">
          <template #body="{ data }">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold" :class="claseBadgeEstado(data.estado)">
              {{ etiquetaEstado(data.estado) }}
            </span>
          </template>
        </Column>
        <template #empty>Sin registros para ese día. Presiona "Consultar".</template>
      </DataTable>
    </div>

    <!-- ── Ranking de tardanzas ────────────────────────────────────────────── -->
    <div class="rounded-2xl border p-3 shadow-sm shrink-0"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <div class="flex flex-wrap items-end justify-between gap-2 mb-2">
        <div>
          <h3 class="text-[12px] font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">
            Ranking de llegadas tarde
          </h3>
          <p class="text-[10px] mt-0.5" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
            {{ formatFechaCorta(rankingStartDate) }} — {{ formatFechaCorta(rankingEndDate) }}
          </p>
        </div>
        <div class="flex flex-wrap items-end gap-2">
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold uppercase tracking-wide"
              :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Desde</label>
            <DatePicker v-model="rankingStartDate" dateFormat="dd/mm/yy" showIcon iconDisplay="input"
              inputClass="!h-8 !text-[12px]" class="w-36" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold uppercase tracking-wide"
              :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Hasta</label>
            <DatePicker v-model="rankingEndDate" dateFormat="dd/mm/yy" showIcon iconDisplay="input"
              inputClass="!h-8 !text-[12px]" class="w-36" />
          </div>
          <Button @click="cargarRanking" label="Buscar" icon="pi pi-search" :loading="cargandoRanking" size="small" severity="secondary" outlined />
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText v-model="busquedaPersona" placeholder="Buscar persona…" class="!h-8 !text-[12px] w-44" />
          </IconField>
        </div>
      </div>
      <DataTable :value="rankingFiltrado" paginator :rows="10" sortField="total_tardanzas" :sortOrder="-1"
        removableSort size="small" scrollable scrollHeight="240px"
        :class="isDark ? 'p-datatable-dark' : ''">
        <Column field="nombre" header="Nombre" sortable />
        <Column field="cedula" header="Cédula" sortable style="width: 140px" />
        <Column field="departamento" header="Área" sortable />
        <Column field="total_tardanzas" header="# Tardanzas" sortable style="width: 140px" />
        <template #empty>Sin llegadas tarde para el periodo/área/persona seleccionados.</template>
      </DataTable>
    </div>

    <!-- ── Personas más puntuales ───────────────────────────────────────────── -->
    <div class="rounded-2xl border p-3 shadow-sm shrink-0"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <h3 class="text-[12px] font-bold mb-2" :class="isDark ? 'text-white' : 'text-slate-900'">Personas más puntuales</h3>
      <p class="text-[10px] mb-2" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">Cero tardanzas en todo el periodo seleccionado.</p>
      <DataTable :value="personasPuntuales" paginator :rows="8" size="small" scrollable scrollHeight="200px"
        :class="isDark ? 'p-datatable-dark' : ''">
        <Column field="nombre" header="Nombre" sortable />
        <Column field="cedula" header="Cédula" sortable style="width: 130px" />
        <Column field="departamento" header="Área" sortable />
        <Column field="total_dias" header="Días trabajados" sortable style="width: 140px" />
        <template #empty>Sin registros para el periodo seleccionado.</template>
      </DataTable>
    </div>

    <!-- ── Jornadas incompletas / Calidad de marcaciones ───────────────────── -->
    <div class="rounded-2xl border p-3 shadow-sm shrink-0"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <h3 class="text-[12px] font-bold mb-2" :class="isDark ? 'text-white' : 'text-slate-900'">Jornadas incompletas / Calidad de marcaciones</h3>
      <DataTable :value="calidadMarcaciones" paginator :rows="6" size="small" scrollable scrollHeight="180px"
        :class="isDark ? 'p-datatable-dark' : ''">
        <Column field="departamento" header="Área" sortable />
        <Column field="total_incompletas" header="Incompletas" sortable style="width: 110px" />
        <Column field="porcentaje_incompletas" header="%" sortable style="width: 90px">
          <template #body="{ data }">{{ data.porcentaje_incompletas }}%</template>
        </Column>
        <template #empty>Sin datos para el periodo seleccionado.</template>
      </DataTable>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import axios from 'axios';
import DatePicker from 'primevue/datepicker';
import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import Chart from 'primevue/chart';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import vTooltip from 'primevue/tooltip';

const props = defineProps({
  isDark: { type: Boolean, default: false },
  company: String,
});

// El backend de este módulo vive en la raíz de la API, no bajo /usuarios
// (mismo patrón que GestionPermisos.vue para /modulos-disponibles).
const baseUrl = (import.meta.env.VITE_API_URL || '').replace('/usuarios', '');

const hoy = new Date();
// Rango con día incluido (antes era solo "Mes" — el usuario necesita poder
// acotar a un día o rango exacto, no solo a un mes calendario completo).
const filtroDesde = ref(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
const filtroHasta = ref(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));

const departamentoSeleccionado = ref('');
const departamentosTodos = ref([]);
const departamentosFiltrados = ref([]);

function filtrarDepartamentos(ev) {
  const q = (ev.query || '').toLowerCase();
  departamentosFiltrados.value = q
    ? departamentosTodos.value.filter(d => d.toLowerCase().includes(q))
    : [...departamentosTodos.value];
}

const ranking = ref([]);
const cumplimientoAreas = ref([]);
const tendenciaSerie = ref([]);
const estadoAsistencia = ref([]);
const tardanzasPorArea = ref([]);
const tardanzasPorDia = ref([]);
const ausenciasPorDia = ref([]);
const distribucionMinutos = ref([]);
const personasAtencion = ref([]);
const personasPuntuales = ref([]);
const calidadMarcaciones = ref([]);
const cargando = ref(false);
const cargandoRanking = ref(false);
const error = ref('');

function dateToISO(d) {
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatFechaCorta(d) {
  if (!d) return '—';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// fecha viene como 'YYYY-MM-DD' del backend
function formatFechaISO(fechaStr) {
  if (!fechaStr) return '—';
  const [y, m, d] = fechaStr.split('-');
  return `${d}/${m}/${y}`;
}

function tooltipTardanzas(detalle) {
  if (!detalle?.length) return '';
  return detalle
    .map(d => `${formatFechaISO(d.fecha)}: entró ${d.hora_entrada || '—'}, salió ${d.hora_salida || '—'}`)
    .join('<br>');
}

function tooltipAusencias(detalle) {
  if (!detalle?.length) return '';
  return detalle.map(d => formatFechaISO(d.fecha)).join('<br>');
}

function isoStrToDate(fechaStr) {
  const [y, m, d] = fechaStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function etiquetaEstado(estado) {
  if (estado === 'ENTRADA TARDE') return 'Tarde';
  if (estado === 'A TIEMPO') return 'A tiempo';
  if (estado === 'AUSENTE') return 'Ausente';
  if (estado === 'INCOMPLETO') return 'Incompleto';
  return estado;
}

function claseBadgeEstado(estado) {
  if (estado === 'ENTRADA TARDE') return props.isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600';
  if (estado === 'AUSENTE') return props.isDark ? 'bg-orange-500/15 text-orange-400' : 'bg-orange-50 text-orange-600';
  if (estado === 'INCOMPLETO') return props.isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600';
  return props.isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600';
}

// ── Ranking: rango de fechas propio (independiente del "Mes" de las tarjetas/
// gráficas) + búsqueda por nombre/cédula, para poder consultar "cuántas veces
// llegó tarde tal persona en tal rango" sin estar atado a un mes calendario.
const rankingStartDate = ref(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
const rankingEndDate = ref(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
const busquedaPersona = ref('');

const rankingFiltrado = computed(() => {
  const q = busquedaPersona.value.trim().toLowerCase();
  if (!q) return ranking.value;
  return ranking.value.filter(r =>
    (r.nombre || '').toLowerCase().includes(q) || (r.cedula || '').toLowerCase().includes(q)
  );
});

// ── Detalle de un día específico: quién llegó, a qué hora, y si llegó tarde.
const diaDetalleDate = ref(new Date());
const detalleDia = ref([]);
const cargandoDia = ref(false);
const detalleDiaSection = ref(null);

// Clic en "Día con más tardanzas/ausencias": carga el detalle de ese día y
// hace scroll hasta la sección para que el resultado quede a la vista.
async function irADetalleDia(fechaStr) {
  diaDetalleDate.value = isoStrToDate(fechaStr);
  await cargarDetalleDia();
  await nextTick();
  detalleDiaSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function cargarDetalleDia() {
  cargandoDia.value = true;
  try {
    const { data } = await axios.get(`${baseUrl}/dashboard-asistencia/detalle-dia`, {
      params: {
        fecha: dateToISO(diaDetalleDate.value),
        departamento: departamentoSeleccionado.value || undefined,
        company: props.company,
      },
    });
    detalleDia.value = data.registros || [];
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error al cargar el detalle del día.';
  } finally {
    cargandoDia.value = false;
  }
}

async function cargarDepartamentos() {
  try {
    const { data } = await axios.get(`${baseUrl}/dashboard-asistencia/departamentos`, {
      params: { company: props.company },
    });
    departamentosTodos.value = data.departamentos || [];
  } catch {
    // no crítico: el autocomplete simplemente queda vacío
  }
}

async function cargarRanking() {
  cargandoRanking.value = true;
  try {
    const { data } = await axios.get(`${baseUrl}/dashboard-asistencia/ranking-tardanzas`, {
      params: {
        startDate: dateToISO(rankingStartDate.value),
        endDate: dateToISO(rankingEndDate.value),
        departamento: departamentoSeleccionado.value || undefined,
        company: props.company,
      },
    });
    ranking.value = data.ranking || [];
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error al cargar el ranking de tardanzas.';
  } finally {
    cargandoRanking.value = false;
  }
}

async function cargarCumplimiento() {
  const { data } = await axios.get(`${baseUrl}/dashboard-asistencia/cumplimiento-por-area`, {
    params: {
      startDate: dateToISO(filtroDesde.value),
      endDate: dateToISO(filtroHasta.value),
      departamento: departamentoSeleccionado.value || undefined,
      company: props.company,
    },
  });
  cumplimientoAreas.value = data.areas || [];
}

async function cargarTendencia() {
  // Sin filtro propio ("Comparar tendencia desde" se quitó): siempre muestra
  // los últimos 6 meses hasta la fecha "Hasta" del filtro principal.
  const fin = filtroHasta.value;
  const inicio = new Date(fin.getFullYear(), fin.getMonth() - 5, 1);
  const { data } = await axios.get(`${baseUrl}/dashboard-asistencia/tendencia-mensual`, {
    params: { startDate: dateToISO(inicio), endDate: dateToISO(fin), departamento: departamentoSeleccionado.value || undefined, company: props.company },
  });
  tendenciaSerie.value = data.serie || [];
}

// Los métodos nuevos ya son agregaciones SQL sobre `asistencia_diaria_resumen`
// (el cron nocturno ya cruzó todo) — no hay límite de admisión Odoo aquí, por
// eso sí se disparan en paralelo (a diferencia de cargarTodo, que mezcla estos
// livianos con los históricos que ya existían).
async function cargarSeccionesNuevas() {
  const params = {
    startDate: dateToISO(filtroDesde.value),
    endDate: dateToISO(filtroHasta.value),
    departamento: departamentoSeleccionado.value || undefined,
    company: props.company,
  };

  const [estado, tArea, tDia, aDia, distMin, atencion, puntuales, calidad] = await Promise.all([
    axios.get(`${baseUrl}/dashboard-asistencia/estado-asistencia`, { params }),
    axios.get(`${baseUrl}/dashboard-asistencia/tardanzas-por-area`, { params }),
    axios.get(`${baseUrl}/dashboard-asistencia/tardanzas-por-dia`, { params }),
    axios.get(`${baseUrl}/dashboard-asistencia/ausencias-por-dia`, { params }),
    axios.get(`${baseUrl}/dashboard-asistencia/distribucion-minutos-tardanza`, { params }),
    axios.get(`${baseUrl}/dashboard-asistencia/personas-atencion`, { params }),
    axios.get(`${baseUrl}/dashboard-asistencia/personas-puntuales`, { params }),
    axios.get(`${baseUrl}/dashboard-asistencia/calidad-marcaciones`, { params }),
  ]);

  estadoAsistencia.value = estado.data.estados || [];
  tardanzasPorArea.value = tArea.data.areas || [];
  tardanzasPorDia.value = tDia.data.dias || [];
  ausenciasPorDia.value = aDia.data.dias || [];
  distribucionMinutos.value = distMin.data.buckets || [];
  personasAtencion.value = atencion.data.personas || [];
  personasPuntuales.value = puntuales.data.personas || [];
  calidadMarcaciones.value = calidad.data.areas || [];
}

const diaMasTardanzas = computed(() => {
  if (!tardanzasPorDia.value.length) return null;
  return tardanzasPorDia.value.reduce((max, d) => (d.total_tardanzas > (max?.total_tardanzas ?? 0) ? d : max), null);
});

const diaMasAusencias = computed(() => {
  if (!ausenciasPorDia.value.length) return null;
  return ausenciasPorDia.value.reduce((max, d) => (d.total_ausencias > (max?.total_ausencias ?? 0) ? d : max), null);
});

async function cargarTodo() {
  cargando.value = true;
  error.value = '';
  try {
    // Secuencial, NO en paralelo: el backend solo admite 2 consultas "pesadas"
    // simultáneas (control anti-OOM) y tendencia-mensual por sí sola ya hace
    // varias llamadas a Odoo por dentro — disparar las 3 a la vez agotaba el
    // cupo y una de ellas (normalmente el ranking) terminaba rechazada con
    // "Ups, esto podría tardar un poco…", dejando la tabla vacía.
    await cargarCumplimiento();
    await cargarRanking();
    await cargarTendencia();
    await cargarSeccionesNuevas();
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error al cargar el dashboard de asistencia.';
  } finally {
    cargando.value = false;
  }
}

const colorTexto = computed(() => (props.isDark ? '#E2E8F0' : '#334155'));
const colorGrid = computed(() => (props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'));

function colorCumplimiento(pct) {
  if (pct >= 90) return '#22C55E';
  if (pct >= 80) return '#F59E0B';
  return '#EF4444';
}

const kpi = computed(() => {
  const areas = cumplimientoAreas.value;
  const cumplimientoPromedio = areas.length
    ? Math.round((areas.reduce((s, a) => s + a.porcentaje_cumplimiento, 0) / areas.length) * 10) / 10
    : 0;
  const totalTardanzas = areas.reduce((s, a) => s + a.total_tardanzas, 0);
  const totalRegistros = areas.reduce((s, a) => s + a.total_registros, 0);
  const puntualidad = totalRegistros > 0 ? Math.round((100 - (totalTardanzas / totalRegistros) * 100) * 10) / 10 : 0;

  const ausenteEstado = estadoAsistencia.value.find(e => e.estado === 'AUSENTE');
  const totalAusencias = ausenteEstado?.total ?? 0;
  const ausenciasInjustificadas = personasAtencion.value.reduce((s, p) => s + (p.ausencias_injustificadas || 0), 0);

  return { cumplimientoPromedio, puntualidad, totalTardanzas, totalAusencias, ausenciasInjustificadas };
});

const chartCumplimiento = computed(() => {
  if (!cumplimientoAreas.value.length) return null;
  return {
    labels: cumplimientoAreas.value.map(a => a.departamento),
    datasets: [{
      label: '% Cumplimiento',
      data: cumplimientoAreas.value.map(a => a.porcentaje_cumplimiento),
      backgroundColor: cumplimientoAreas.value.map(a => colorCumplimiento(a.porcentaje_cumplimiento)),
      borderRadius: { topLeft: 0, topRight: 8, bottomLeft: 0, bottomRight: 8 },
      borderSkipped: false,
      barPercentage: 0.6,
      categoryPercentage: 0.7,
    }],
  };
});

// Alto dinámico para que las barras horizontales no se aplasten cuando hay muchas áreas.
const alturaBarrasArea = computed(() => `${Math.max(180, cumplimientoAreas.value.length * 28)}px`);

const chartEstado = computed(() => {
  if (!estadoAsistencia.value.length) return null;
  const colores = { PUNTUAL: '#22C55E', TARDE: '#F59E0B', AUSENTE: '#EF4444', INCOMPLETO: '#94A3B8' };
  const etiquetas = { PUNTUAL: 'Puntual', TARDE: 'Tarde', AUSENTE: 'Ausente', INCOMPLETO: 'Incompleto' };
  return {
    labels: estadoAsistencia.value.map(e => etiquetas[e.estado] || e.estado),
    datasets: [{
      data: estadoAsistencia.value.map(e => e.total),
      backgroundColor: estadoAsistencia.value.map(e => colores[e.estado] || '#94A3B8'),
      borderWidth: 0,
    }],
  };
});

const chartTardanzasArea = computed(() => {
  if (!tardanzasPorArea.value.length) return null;
  return {
    labels: tardanzasPorArea.value.map(a => a.departamento),
    datasets: [{
      label: 'Tardanzas',
      data: tardanzasPorArea.value.map(a => a.total_tardanzas),
      backgroundColor: '#F59E0B',
      borderRadius: 6,
      barPercentage: 0.6,
    }],
  };
});

const chartTardanzasDia = computed(() => {
  if (!tardanzasPorDia.value.length) return null;
  return {
    labels: tardanzasPorDia.value.map(d => d.fecha.slice(5)),
    datasets: [{
      label: 'Tardanzas',
      data: tardanzasPorDia.value.map(d => d.total_tardanzas),
      borderColor: '#F59E0B',
      backgroundColor: 'rgba(245,158,11,0.15)',
      tension: 0.3,
      fill: true,
      pointRadius: 2,
    }],
  };
});

const chartDistribucionMinutos = computed(() => {
  if (!distribucionMinutos.value.some(b => b.total > 0)) return null;
  return {
    labels: distribucionMinutos.value.map(b => `${b.rango} min`),
    datasets: [{
      label: 'Tardanzas',
      data: distribucionMinutos.value.map(b => b.total),
      backgroundColor: '#EF4444',
      borderRadius: 6,
      barPercentage: 0.6,
    }],
  };
});

const chartTendencia = computed(() => {
  if (!tendenciaSerie.value.length) return null;
  return {
    labels: tendenciaSerie.value.map(s => s.mes),
    datasets: [{
      label: '% Cumplimiento',
      data: tendenciaSerie.value.map(s => s.porcentaje_cumplimiento),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59,130,246,0.15)',
      tension: 0.3,
      fill: true,
      pointRadius: 3,
    }],
  };
});

const chartTendenciaTardanzas = computed(() => {
  if (!tendenciaSerie.value.length) return null;
  return {
    labels: tendenciaSerie.value.map(s => s.mes),
    datasets: [{
      label: '# Tardanzas',
      data: tendenciaSerie.value.map(s => s.total_tardanzas),
      borderColor: '#F59E0B',
      backgroundColor: 'rgba(245,158,11,0.15)',
      tension: 0.3,
      fill: true,
      pointRadius: 3,
    }],
  };
});

const opcionesBarrasHorizontal = computed(() => ({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const area = cumplimientoAreas.value[ctx.dataIndex];
          return ` ${ctx.formattedValue}% cumplimiento (${area.total_tardanzas}/${area.total_registros} tarde)`;
        },
      },
    },
  },
  scales: {
    x: { min: 0, max: 100, ticks: { color: colorTexto.value, callback: (v) => `${v}%` }, grid: { color: colorGrid.value } },
    y: { ticks: { color: colorTexto.value, font: { size: 10 } }, grid: { display: false } },
  },
}));

const opcionesBarrasVerticales = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: colorTexto.value, autoSkip: false, maxRotation: 40, minRotation: 40, font: { size: 10 } }, grid: { display: false } },
    y: { beginAtZero: true, ticks: { color: colorTexto.value, precision: 0 }, grid: { color: colorGrid.value } },
  },
}));

const opcionesLinea = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: colorTexto.value } },
    tooltip: { callbacks: { label: (ctx) => ` ${ctx.formattedValue}% cumplimiento` } },
  },
  scales: {
    x: { ticks: { color: colorTexto.value }, grid: { color: colorGrid.value } },
    y: { min: 0, max: 100, ticks: { color: colorTexto.value, callback: (v) => `${v}%` }, grid: { color: colorGrid.value } },
  },
}));

const opcionesLineaTardanzas = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: colorTexto.value } } },
  scales: {
    x: { ticks: { color: colorTexto.value, autoSkip: false, maxRotation: 40, minRotation: 40, font: { size: 10 } }, grid: { color: colorGrid.value } },
    y: { beginAtZero: true, ticks: { color: colorTexto.value, precision: 0 }, grid: { color: colorGrid.value } },
  },
}));

const opcionesDona = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom', labels: { color: colorTexto.value, boxWidth: 10, font: { size: 11 } } } },
}));

// Sin watch automático a propósito: cambiar el mes/área/tendencia NO dispara
// la consulta por sí solo — el usuario debe presionar "Actualizar" (o
// "Buscar"/"Consultar" en las secciones de ranking y detalle del día).
onMounted(async () => {
  await cargarDepartamentos();
});
</script>
