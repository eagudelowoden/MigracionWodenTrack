<template>
  <div class="an-root h-full flex flex-col gap-3" :class="{ 'an-dark': isDark }">

    <!-- ── Sub-navegación ───────────────────────────────────────── -->
    <div class="an-tabs">
      <button v-for="tab in TABS" :key="tab.key" @click="subTab = tab.key"
        class="an-tab" :class="{ 'is-active': subTab === tab.key }">
        <i :class="tab.icon" class="text-[11px]"></i>
        <span class="hidden sm:inline">{{ tab.label }}</span>
      </button>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         VISTA 1 — Empleados sin malla
    ══════════════════════════════════════════════════════════ -->
    <template v-if="subTab === 'sin-malla'">
      <div class="an-head">
        <div class="an-head-left">
          <div class="an-head-icon" style="--c:#f43f5e"><i class="fas fa-user-slash"></i></div>
          <div>
            <h2 class="an-head-title">Empleados sin malla</h2>
            <p class="an-head-sub">{{ smFiltrados.length }} sin asignación activa</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <input v-model="smBusqueda" type="text" placeholder="Buscar…" class="an-input w-40" />
          <button @click="cargarSinMalla" :disabled="sm.cargando" class="an-btn-icon">
            <i class="fas fa-rotate text-[11px]" :class="sm.cargando ? 'fa-spin' : ''"></i>
          </button>
        </div>
      </div>

      <div class="an-card flex-1 min-h-0 flex flex-col overflow-hidden">
        <div v-if="sm.cargando" class="an-loading"><i class="fas fa-circle-notch fa-spin"></i></div>
        <div v-else-if="!smFiltrados.length" class="an-empty">
          <i class="fas fa-circle-check text-emerald-500/40"></i>
          <p>{{ smBusqueda ? 'Sin resultados' : 'Todos los empleados tienen malla asignada' }}</p>
        </div>
        <div v-else class="flex-1 overflow-y-auto">
          <table class="an-table">
            <thead>
              <tr>
                <th>Nombre</th><th>Cargo</th><th>Área</th><th>Departamento</th><th>Segmento</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in smPaginados" :key="e.id_odoo">
                <td class="an-strong">{{ e.nombre }}</td>
                <td class="an-muted">{{ e.cargo }}</td>
                <td><span class="an-pill" style="--c:#3b82f6">{{ e.area }}</span></td>
                <td class="an-muted">{{ e.departamento }}</td>
                <td class="an-muted">{{ e.segmento }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="!sm.cargando && smFiltrados.length" class="an-pager">
          <span class="an-pager-info">{{ smFiltrados.length }} registros · pág. {{ smPage }}/{{ smTotalPaginas }}</span>
          <div class="an-pager-btns">
            <button class="an-pager-btn" :disabled="smPage === 1" @click="smPage--"><i class="fas fa-chevron-left"></i></button>
            <button class="an-pager-btn" :disabled="smPage >= smTotalPaginas" @click="smPage++"><i class="fas fa-chevron-right"></i></button>
          </div>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════
         VISTA 2 — Asignación masiva
    ══════════════════════════════════════════════════════════ -->
    <template v-if="subTab === 'masivo'">
      <div class="an-head">
        <div class="an-head-left">
          <div class="an-head-icon" style="--c:#6366f1"><i class="fas fa-layer-group"></i></div>
          <div>
            <h2 class="an-head-title">Asignación masiva de mallas</h2>
            <p class="an-head-sub">{{ masivo.seleccionados.length }} seleccionados</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <select v-model="masivo.mallaId" class="an-select">
            <option value="">— Seleccionar malla —</option>
            <option v-for="m in masivo.mallas" :key="m.id" :value="m.id">{{ m.nombre }}</option>
          </select>
          <button @click="ejecutarAsignacionMasiva"
            :disabled="!masivo.mallaId || !masivo.seleccionados.length || masivo.guardando" class="an-btn-primary">
            <i class="fas text-[10px]" :class="masivo.guardando ? 'fa-circle-notch fa-spin' : 'fa-bolt'"></i>
            Asignar
          </button>
        </div>
      </div>

      <div class="an-card flex-1 min-h-0 flex flex-col overflow-hidden">
        <div class="an-subbar">
          <input type="checkbox" class="an-check"
            :checked="masivo.seleccionados.length === sm.data.length && sm.data.length > 0"
            @change="toggleSeleccionarTodos" />
          <span class="an-subbar-label">Seleccionar todos sin malla</span>
          <button @click="cargarSinMalla" :disabled="sm.cargando" class="an-btn-icon ml-auto !h-6 !w-6">
            <i class="fas fa-rotate text-[10px]" :class="sm.cargando ? 'fa-spin' : ''"></i>
          </button>
        </div>
        <div v-if="sm.cargando" class="an-loading"><i class="fas fa-circle-notch fa-spin"></i></div>
        <div v-else-if="!sm.data.length" class="an-empty"><p>No hay empleados sin malla</p></div>
        <div v-else class="flex-1 overflow-y-auto">
          <div v-for="e in masivoPaginados" :key="e.id_odoo" class="an-row-select"
            :class="{ 'is-sel': masivo.seleccionados.includes(e.id_odoo) }" @click="toggleSeleccion(e.id_odoo)">
            <input type="checkbox" class="an-check shrink-0" :checked="masivo.seleccionados.includes(e.id_odoo)"
              @click.stop />
            <div class="flex-1 min-w-0">
              <p class="an-strong text-[12px] truncate">{{ e.nombre }}</p>
              <p class="an-muted text-[10px]">{{ e.area }} · {{ e.departamento }}</p>
            </div>
          </div>
        </div>
        <div v-if="!sm.cargando && sm.data.length" class="an-pager">
          <span class="an-pager-info">{{ sm.data.length }} sin malla · pág. {{ masivoPage }}/{{ masivoTotalPaginas }}</span>
          <div class="an-pager-btns">
            <button class="an-pager-btn" :disabled="masivoPage === 1" @click="masivoPage--"><i class="fas fa-chevron-left"></i></button>
            <button class="an-pager-btn" :disabled="masivoPage >= masivoTotalPaginas" @click="masivoPage++"><i class="fas fa-chevron-right"></i></button>
          </div>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════
         VISTA 3 — Heatmap
    ══════════════════════════════════════════════════════════ -->
    <template v-if="subTab === 'heatmap'">
      <div class="an-head">
        <div class="an-head-left">
          <div class="an-head-icon" style="--c:#06b6d4"><i class="fas fa-table-cells"></i></div>
          <div>
            <h2 class="an-head-title">Heatmap de asistencia</h2>
            <p class="an-head-sub">{{ hm.data?.totalEmpleados || 0 }} empleados · {{ hm.data?.grid?.length || 0 }} días</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <select v-model="hm.departamento" class="an-select">
            <option value="">Todos los departamentos</option>
            <option v-for="d in hm.data?.departamentos || []" :key="d" :value="d">{{ d }}</option>
          </select>
          <input v-model="hm.startDate" type="date" class="an-input" />
          <input v-model="hm.endDate" type="date" class="an-input" />
          <button @click="cargarHeatmap" :disabled="hm.cargando" class="an-btn-primary">
            <i class="fas text-[10px]" :class="hm.cargando ? 'fa-circle-notch fa-spin' : 'fa-magnifying-glass'"></i>
            Cargar
          </button>
        </div>
      </div>

      <div class="an-card flex-1 min-h-0 flex flex-col overflow-hidden">
        <div v-if="hm.cargando" class="an-loading"><i class="fas fa-circle-notch fa-spin"></i></div>
        <div v-else-if="!hm.data?.grid?.length" class="an-empty">
          <i class="fas fa-table-cells"></i>
          <p>Selecciona un rango de fechas y presiona Cargar</p>
        </div>
        <div v-else class="flex-1 overflow-auto p-4">
          <!-- Leyenda -->
          <div class="flex items-center gap-3 mb-4">
            <span class="an-legend-label">Asistencia</span>
            <div class="flex items-center gap-1">
              <div v-for="pct in [0, 25, 50, 75, 100]" :key="pct"
                class="w-8 h-4 rounded text-[8px] font-bold flex items-center justify-center text-white"
                :style="{ background: heatColor(pct) }">{{ pct }}%</div>
            </div>
            <span class="an-legend-label ml-auto">Total: {{ hm.data.totalEmpleados }} empleados</span>
          </div>

          <!-- Grid de días -->
          <div class="grid gap-1" style="grid-template-columns: auto repeat(7, 1fr);">
            <div></div>
            <div v-for="d in DIAS_SEMANA" :key="d" class="an-legend-label text-center py-1">{{ d }}</div>

            <template v-for="(semana, si) in hmSemanas" :key="si">
              <div class="an-legend-label flex items-center pr-2">S{{ si + 1 }}</div>
              <div v-for="dia in semana" :key="dia?.fecha || `empty-${si}-${dia}`"
                class="h-10 rounded-md flex flex-col items-center justify-center text-[8px] font-bold transition-all relative group"
                :style="dia ? { background: heatColor(dia.pct) } : {}"
                :class="[dia ? 'cursor-default text-white' : 'opacity-10 an-surface-2']">
                <template v-if="dia">
                  <span>{{ dia.fecha.slice(8) }}</span>
                  <span class="opacity-80">{{ dia.pct }}%</span>
                  <div class="an-tooltip">{{ dia.fecha }} · {{ dia.presentes }} presentes</div>
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
      <div class="an-head">
        <div class="an-head-left">
          <div class="an-head-icon" style="--c:#8b5cf6"><i class="fas fa-chart-bar"></i></div>
          <div>
            <h2 class="an-head-title">Comparativa entre áreas</h2>
            <p class="an-head-sub">{{ comp.data.length }} áreas en el período</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <input v-model="comp.startDate" type="date" class="an-input" />
          <input v-model="comp.endDate" type="date" class="an-input" />
          <button @click="cargarComparativa" :disabled="comp.cargando" class="an-btn-primary">
            <i class="fas text-[10px]" :class="comp.cargando ? 'fa-circle-notch fa-spin' : 'fa-magnifying-glass'"></i>
            Analizar
          </button>
        </div>
      </div>

      <div class="an-card flex-1 min-h-0 flex flex-col overflow-hidden">
        <div v-if="comp.cargando" class="an-loading"><i class="fas fa-circle-notch fa-spin"></i></div>
        <div v-else-if="!comp.data.length" class="an-empty">
          <i class="fas fa-chart-bar"></i>
          <p>Selecciona un rango y presiona Analizar</p>
        </div>
        <div v-else class="flex-1 overflow-y-auto">
          <table class="an-table">
            <thead>
              <tr>
                <th class="w-44">Área</th><th class="w-28">Depto</th><th class="text-center w-16">Empl.</th>
                <th>Puntualidad</th><th>Tardanzas</th><th>Ausentismo est.</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in comp.data" :key="a.area">
                <td class="an-strong">{{ a.area }}</td>
                <td class="an-muted text-[10px]">{{ a.departamento }}</td>
                <td class="text-center an-strong">{{ a.totalEmpleados }}</td>
                <td>
                  <div class="an-bar-row">
                    <div class="an-bar"><div :style="{ width: a.aTiempoPct + '%' }"
                      :class="a.aTiempoPct >= 80 ? 'bg-emerald-500' : a.aTiempoPct >= 60 ? 'bg-amber-500' : 'bg-rose-500'"></div></div>
                    <span class="an-bar-val" :class="a.aTiempoPct >= 80 ? 'text-emerald-500' : a.aTiempoPct >= 60 ? 'text-amber-500' : 'text-rose-500'">{{ a.aTiempoPct }}%</span>
                  </div>
                </td>
                <td>
                  <div class="an-bar-row">
                    <div class="an-bar"><div class="bg-amber-500" :style="{ width: a.tardanzaPct + '%' }"></div></div>
                    <span class="an-bar-val text-amber-500">{{ a.tardanzaPct }}%</span>
                  </div>
                </td>
                <td>
                  <div class="an-bar-row">
                    <div class="an-bar"><div class="bg-rose-500" :style="{ width: Math.min(a.ausentismoPct, 100) + '%' }"></div></div>
                    <span class="an-bar-val text-rose-500">{{ a.ausentismoPct }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="an-note">
            * Ausentismo estimado comparando marcaciones registradas vs. días laborales esperados (L-V). Puntualidad
            calculada sobre marcaciones con estado "A TIEMPO".
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
        <div class="an-card flex flex-col overflow-hidden">
          <div class="an-card-head">
            <div class="flex items-center gap-2">
              <i class="fas fa-envelope-open-text text-emerald-500 text-[12px]"></i>
              <span class="an-card-head-title">Configuración SMTP (Outlook)</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-1.5 h-1.5 rounded-full" :class="correo.config.habilitado ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'"></div>
              <span class="text-[9px] font-bold uppercase" :class="correo.config.habilitado ? 'text-emerald-400' : 'an-muted'">
                {{ correo.config.habilitado ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>

          <div class="p-4 flex-1 flex flex-col gap-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="an-label">Host SMTP *</label>
                <input v-model="correo.form.host" type="text" placeholder="smtp.office365.com" class="an-input w-full" />
              </div>
              <div>
                <label class="an-label">Puerto</label>
                <input v-model="correo.form.port" type="text" placeholder="587" class="an-input w-full" />
              </div>
            </div>
            <div>
              <label class="an-label">Correo (usuario SMTP) *</label>
              <input v-model="correo.form.user" type="email" placeholder="notificaciones@empresa.com" class="an-input w-full" />
            </div>
            <div>
              <label class="an-label">
                Contraseña *
                <span v-if="correo.config.passConfigurado" class="ml-1 text-emerald-400 normal-case font-normal">(ya configurada — dejar vacío para no cambiar)</span>
              </label>
              <input v-model="correo.form.pass" type="password" placeholder="••••••••" class="an-input w-full" />
            </div>
            <div>
              <label class="an-label">Nombre del remitente</label>
              <input v-model="correo.form.fromNombre" type="text" placeholder="WodenTrack RRHH" class="an-input w-full" />
            </div>

            <!-- Toggle habilitado -->
            <div class="an-toggle-card" :class="{ 'is-on': correo.form.habilitado }">
              <div>
                <p class="text-[11px] font-bold" :class="correo.form.habilitado ? 'text-emerald-500' : 'an-muted'">Sistema de correo</p>
                <p class="an-muted text-[9px]">{{ correo.form.habilitado ? 'Habilitado — se enviarán correos' : 'Deshabilitado — no se enviarán correos' }}</p>
              </div>
              <button @click="correo.form.habilitado = !correo.form.habilitado" class="an-switch" :class="{ 'is-on': correo.form.habilitado }">
                <div class="an-switch-dot"></div>
              </button>
            </div>

            <!-- Acciones -->
            <div class="flex gap-2 mt-auto pt-2">
              <button @click="testConexion" :disabled="correo.testeando" class="an-btn flex-1">
                <i class="fas text-[10px]" :class="correo.testeando ? 'fa-circle-notch fa-spin' : 'fa-plug'"></i>
                Probar conexión
              </button>
              <button @click="guardarConfigCorreo" :disabled="correo.guardando" class="an-btn-primary flex-1 !h-8" style="--c:#10b981">
                <i class="fas text-[10px]" :class="correo.guardando ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'"></i>
                Guardar
              </button>
            </div>

            <div v-if="correo.testResult" class="an-result" :class="correo.testResult.ok ? 'is-ok' : 'is-err'">
              <i :class="correo.testResult.ok ? 'fas fa-check' : 'fas fa-xmark'" class="mr-1.5"></i>
              {{ correo.testResult.mensaje }}
            </div>
          </div>
        </div>

        <!-- Panel derecho: Envío manual de ausentismo -->
        <div class="an-card flex flex-col overflow-hidden">
          <div class="an-card-head">
            <div class="flex items-center gap-2">
              <i class="fas fa-paper-plane text-blue-500 text-[12px]"></i>
              <span class="an-card-head-title">Envío manual — Ausentismo</span>
            </div>
          </div>

          <div class="p-4 flex-1 flex flex-col gap-3 overflow-y-auto">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="an-label">Empleado *</label>
                <input v-model="correo.envio.empleado" type="text" placeholder="Nombre completo" class="an-input w-full" />
              </div>
              <div>
                <label class="an-label">Cédula</label>
                <input v-model="correo.envio.cedula" type="text" placeholder="1234567890" class="an-input w-full" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="an-label">Cargo</label>
                <input v-model="correo.envio.cargo" type="text" class="an-input w-full" />
              </div>
              <div>
                <label class="an-label">Departamento</label>
                <input v-model="correo.envio.departamento" type="text" class="an-input w-full" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="an-label">Fecha inicio *</label>
                <input v-model="correo.envio.fechaInicio" type="date" class="an-input w-full" />
              </div>
              <div>
                <label class="an-label">Fecha fin</label>
                <input v-model="correo.envio.fechaFin" type="date" class="an-input w-full" />
              </div>
            </div>
            <div>
              <label class="an-label">Motivo</label>
              <textarea v-model="correo.envio.motivo" rows="2" placeholder="Descripción del ausentismo…" class="an-input w-full resize-none"></textarea>
            </div>
            <div>
              <label class="an-label">Destinatarios * (separados por coma)</label>
              <input v-model="correo.envio.destinatariosRaw" type="text" placeholder="rrhh@empresa.com, jefe@empresa.com" class="an-input w-full" />
            </div>

            <button @click="enviarAusentismo"
              :disabled="correo.enviando || !correo.envio.empleado || !correo.envio.fechaInicio || !correo.envio.destinatariosRaw"
              class="an-btn-primary !h-9 w-full" style="--c:#3b82f6">
              <i class="fas text-[11px]" :class="correo.enviando ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'"></i>
              {{ correo.enviando ? 'Enviando…' : 'Enviar reporte de ausentismo' }}
            </button>

            <div v-if="correo.envioResult" class="an-result" :class="correo.envioResult.ok ? 'is-ok' : 'is-err'">
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
      <div class="an-head">
        <div class="an-head-left">
          <div class="an-head-icon" style="--c:#8b5cf6"><i class="fas fa-brain"></i></div>
          <div>
            <h2 class="an-head-title">IA y Predicción de Riesgo</h2>
            <p class="an-head-sub">Score 0–100 · últimos 30 días</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <input v-model="ia.busqueda" type="text" placeholder="Buscar empleado…" class="an-input w-44" />
          <select v-model="ia.nivelFiltro" class="an-select">
            <option value="">Todos</option>
            <option value="alto">Alto riesgo</option>
            <option value="medio">Medio</option>
            <option value="bajo">Bajo</option>
          </select>
          <button @click="cargarIA" :disabled="ia.cargando" class="an-btn-icon">
            <i class="fas fa-rotate text-[11px]" :class="ia.cargando ? 'fa-spin' : ''"></i>
          </button>
        </div>
      </div>

      <div class="an-card flex-1 min-h-0 flex flex-col overflow-hidden">
        <div v-if="ia.cargando" class="an-loading"><i class="fas fa-circle-notch fa-spin"></i></div>
        <div v-else class="flex-1 overflow-auto">
        <table class="an-table">
          <thead>
            <tr>
              <th>Empleado</th><th>Área</th><th class="text-center">Score</th>
              <th class="text-center">Asist.</th><th class="text-center">Puntual.</th><th>Patrones detectados</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in iaPaginados" :key="emp.id_odoo">
              <td>
                <div class="an-strong">{{ emp.nombre }}</div>
                <div class="an-faint text-[9px]">{{ emp.cargo }}</div>
              </td>
              <td class="an-muted">{{ emp.area }}</td>
              <td class="text-center">
                <div class="inline-flex flex-col items-center gap-0.5">
                  <span class="font-bold text-[14px]"
                    :class="emp.nivel === 'alto' ? 'text-rose-500' : emp.nivel === 'medio' ? 'text-amber-500' : 'text-emerald-500'">{{ emp.score }}</span>
                  <span class="an-pill" :style="{ '--c': emp.nivel === 'alto' ? '#f43f5e' : emp.nivel === 'medio' ? '#f59e0b' : '#10b981' }">{{ emp.nivel }}</span>
                </div>
              </td>
              <td class="text-center font-semibold" :class="emp.asistenciaPct < 60 ? 'text-rose-500' : emp.asistenciaPct < 80 ? 'text-amber-500' : 'text-emerald-500'">{{ emp.asistenciaPct }}%</td>
              <td class="text-center font-semibold" :class="emp.puntualidadPct < 50 ? 'text-rose-500' : emp.puntualidadPct < 70 ? 'text-amber-500' : 'text-emerald-500'">{{ emp.puntualidadPct }}%</td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span v-for="p in emp.patrones" :key="p" class="an-tag">{{ p }}</span>
                  <span v-if="!emp.patrones.length" class="an-faint text-[9px]">Sin patrones</span>
                </div>
              </td>
            </tr>
            <tr v-if="!iaFiltrados.length"><td colspan="6" class="text-center an-faint py-8">Sin datos</td></tr>
          </tbody>
        </table>
        </div>
        <div v-if="!ia.cargando && iaFiltrados.length" class="an-pager">
          <span class="an-pager-info">{{ iaFiltrados.length }} empleados · pág. {{ iaPage }}/{{ iaTotalPaginas }}</span>
          <div class="an-pager-btns">
            <button class="an-pager-btn" :disabled="iaPage === 1" @click="iaPage--"><i class="fas fa-chevron-left"></i></button>
            <button class="an-pager-btn" :disabled="iaPage >= iaTotalPaginas" @click="iaPage++"><i class="fas fa-chevron-right"></i></button>
          </div>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════
         VISTA 7 — Tendencias 12 meses
    ══════════════════════════════════════════════════════════ -->
    <template v-if="subTab === 'tendencias'">
      <div class="an-head">
        <div class="an-head-left">
          <div class="an-head-icon" style="--c:#06b6d4"><i class="fas fa-chart-line"></i></div>
          <div>
            <h2 class="an-head-title">Tendencias 12 Meses</h2>
            <p class="an-head-sub">Puntualidad y ausentismo por departamento</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <select v-model="tend.depto" class="an-select">
            <option value="">Todos los deptos.</option>
            <option v-for="d in tendDeptos" :key="d" :value="d">{{ d }}</option>
          </select>
          <button @click="cargarTendencias" :disabled="tend.cargando" class="an-btn-icon">
            <i class="fas fa-rotate text-[11px]" :class="tend.cargando ? 'fa-spin' : ''"></i>
          </button>
        </div>
      </div>

      <div class="an-card flex-1 min-h-0 overflow-auto p-4">
        <div v-if="tend.cargando" class="an-loading"><i class="fas fa-circle-notch fa-spin"></i></div>
        <div v-else-if="!tendDataFiltrado.length" class="an-empty"><p>Sin datos</p></div>
        <template v-else>
          <div class="flex items-center gap-4 mb-4">
            <div class="flex items-center gap-1.5"><div class="w-3 h-0.5 bg-emerald-500 rounded"></div><span class="an-legend-label">Puntualidad %</span></div>
            <div class="flex items-center gap-1.5"><div class="w-3 h-0.5 bg-rose-500 rounded"></div><span class="an-legend-label">Ausentismo %</span></div>
          </div>
          <div class="overflow-x-auto">
            <svg :width="tendSvgW" height="220" class="overflow-visible">
              <line v-for="y in [0, 25, 50, 75, 100]" :key="y" x1="50" :y1="tendY(y)" :x2="tendSvgW - 10" :y2="tendY(y)"
                :stroke="isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'" stroke-width="1" />
              <text v-for="y in [0, 25, 50, 75, 100]" :key="'l' + y" x="44" :y="tendY(y) + 4" text-anchor="end"
                font-size="8" :fill="isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'">{{ y }}</text>
              <polyline :points="tendPoints('puntualidadPct')" fill="none" stroke="#10b981" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
              <polyline :points="tendPoints('ausentismoPct')" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
              <circle v-for="(p, i) in tendDataFiltrado" :key="'dp' + i" :cx="tendX(i)" :cy="tendY(p.puntualidadPct)" r="3" fill="#10b981">
                <title>{{ p.mes }} · {{ p.departamento }} · Puntualidad: {{ p.puntualidadPct }}%</title>
              </circle>
              <circle v-for="(p, i) in tendDataFiltrado" :key="'da' + i" :cx="tendX(i)" :cy="tendY(p.ausentismoPct)" r="3" fill="#f43f5e">
                <title>{{ p.mes }} · {{ p.departamento }} · Ausentismo: {{ p.ausentismoPct }}%</title>
              </circle>
              <text v-for="(p, i) in tendDataFiltrado" :key="'xl' + i" :x="tendX(i)" y="215" text-anchor="middle"
                font-size="7" :fill="isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'">{{ p.mes?.substring(5) }}</text>
            </svg>
          </div>
        </template>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════
         VISTA 8 — Ranking de departamentos
    ══════════════════════════════════════════════════════════ -->
    <template v-if="subTab === 'ranking'">
      <div class="an-head">
        <div class="an-head-left">
          <div class="an-head-icon" style="--c:#f59e0b"><i class="fas fa-trophy"></i></div>
          <div>
            <h2 class="an-head-title">Ranking del Mes</h2>
            <p class="an-head-sub">Mejores y peores áreas en asistencia + puntualidad</p>
          </div>
        </div>
        <button @click="cargarRanking" :disabled="rank.cargando" class="an-btn-icon">
          <i class="fas fa-rotate text-[11px]" :class="rank.cargando ? 'fa-spin' : ''"></i>
        </button>
      </div>

      <div class="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div v-if="rank.cargando" class="col-span-2 an-loading"><i class="fas fa-circle-notch fa-spin"></i></div>
        <template v-else>
          <!-- Mejores -->
          <div class="an-card overflow-hidden">
            <div class="an-card-head">
              <i class="fas fa-star text-amber-400 text-[12px]"></i>
              <span class="an-card-head-title">Top 3 — Mejor desempeño</span>
            </div>
            <div class="p-4 flex flex-col gap-3">
              <div v-for="(area, idx) in rank.mejores" :key="area.area" class="an-rank-row">
                <div class="an-rank-medal" :class="idx === 0 ? 'bg-amber-400/10' : idx === 1 ? 'bg-zinc-400/10' : 'bg-orange-400/10'">
                  <span>{{ idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉' }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="an-strong truncate">{{ area.area }}</div>
                  <div class="an-faint text-[9px]">{{ area.departamento }} · {{ area.totalEmpleados }} emp.</div>
                  <div class="flex gap-2 mt-1">
                    <div class="flex items-center gap-1">
                      <div class="an-mini-bar"><div class="bg-emerald-500" :style="{ width: area.asistenciaPct + '%' }"></div></div>
                      <span class="text-[9px] text-emerald-500 font-bold">{{ area.asistenciaPct }}%</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <div class="an-mini-bar"><div class="bg-blue-500" :style="{ width: area.puntualidadPct + '%' }"></div></div>
                      <span class="text-[9px] text-blue-500 font-bold">{{ area.puntualidadPct }}%</span>
                    </div>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-[18px] font-black an-strong">{{ area.score }}</div>
                  <div class="an-faint text-[8px] uppercase tracking-wide">score</div>
                </div>
              </div>
              <div v-if="!rank.mejores.length" class="text-center an-faint py-6">Sin datos</div>
            </div>
          </div>

          <!-- Peores -->
          <div class="an-card overflow-hidden">
            <div class="an-card-head">
              <i class="fas fa-triangle-exclamation text-rose-400 text-[12px]"></i>
              <span class="an-card-head-title">Bottom 3 — Requieren atención</span>
            </div>
            <div class="p-4 flex flex-col gap-3">
              <div v-for="(area, idx) in rank.peores" :key="area.area" class="an-rank-row">
                <div class="an-rank-medal bg-rose-500/10"><span>{{ idx === 0 ? '⚠️' : idx === 1 ? '📉' : '🔴' }}</span></div>
                <div class="flex-1 min-w-0">
                  <div class="an-strong truncate">{{ area.area }}</div>
                  <div class="an-faint text-[9px]">{{ area.departamento }} · {{ area.totalEmpleados }} emp.</div>
                  <div class="flex gap-2 mt-1">
                    <div class="flex items-center gap-1">
                      <div class="an-mini-bar"><div class="bg-rose-500" :style="{ width: area.asistenciaPct + '%' }"></div></div>
                      <span class="text-[9px] text-rose-500 font-bold">{{ area.asistenciaPct }}%</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <div class="an-mini-bar"><div class="bg-amber-500" :style="{ width: area.puntualidadPct + '%' }"></div></div>
                      <span class="text-[9px] text-amber-500 font-bold">{{ area.puntualidadPct }}%</span>
                    </div>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-[18px] font-black text-rose-500">{{ area.score }}</div>
                  <div class="an-faint text-[8px] uppercase tracking-wide">score</div>
                </div>
              </div>
              <div v-if="!rank.peores.length" class="text-center an-faint py-6">Sin datos</div>
            </div>
          </div>
        </template>
      </div>
    </template>

  </div>
</template>

<script setup>
import { apiFetch } from '@/utils/apiFetch.js';
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({ isDark: Boolean });
const emit = defineEmits(['success', 'error']);
const API_URL = import.meta.env.VITE_API_URL;

const TABS = [
  { key: 'sin-malla', icon: 'fas fa-user-slash', label: 'Sin malla' },
  { key: 'masivo', icon: 'fas fa-layer-group', label: 'Asig. masiva' },
  { key: 'heatmap', icon: 'fas fa-table-cells', label: 'Heatmap' },
  { key: 'comparativa', icon: 'fas fa-chart-bar', label: 'Comparativa' },
  { key: 'correo', icon: 'fas fa-envelope', label: 'Correo' },
  { key: 'ia', icon: 'fas fa-brain', label: 'IA' },
  { key: 'tendencias', icon: 'fas fa-chart-line', label: 'Tendencias' },
  { key: 'ranking', icon: 'fas fa-trophy', label: 'Ranking' },
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
    const res = await apiFetch(`${API_URL}/superadmin/analitica/sin-malla`);
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
    const res = await apiFetch(`${API_URL}/mallas-admin`);
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
    const res = await apiFetch(`${API_URL}/superadmin/analitica/asignar-masivo`, {
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
    const res = await apiFetch(`${API_URL}/superadmin/analitica/heatmap?${params}`);
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
    const res = await apiFetch(`${API_URL}/superadmin/analitica/comparativa-areas?${params}`);
    if (!res.ok) throw new Error();
    comp.value.data = await res.json();
  } catch { emit('error', 'Error al cargar comparativa'); }
  finally { comp.value.cargando = false; }
};

// ── Estado: Correo ────────────────────────────────────────────
const correo = ref({
  config: { host: '', port: '587', user: '', passConfigurado: false, fromNombre: 'WodenTrack', habilitado: false },
  form: { host: '', port: '587', user: '', pass: '', fromNombre: 'WodenTrack', habilitado: false },
  guardando: false,
  testeando: false,
  testResult: null,
  enviando: false,
  envioResult: null,
  envio: {
    empleado: '', cedula: '', cargo: '', departamento: '', area: '',
    fechaInicio: hoy(), fechaFin: '', motivo: '', destinatariosRaw: '',
  },
});

const cargarConfigCorreo = async () => {
  try {
    const res = await apiFetch(`${API_URL}/superadmin/correo/config`);
    if (!res.ok) throw new Error();
    const cfg = await res.json();
    correo.value.config = cfg;
    correo.value.form = {
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      pass: '',
      fromNombre: cfg.fromNombre,
      habilitado: cfg.habilitado,
    };
  } catch { emit('error', 'Error al cargar configuración de correo'); }
};

const guardarConfigCorreo = async () => {
  correo.value.guardando = true;
  correo.value.testResult = null;
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const res = await apiFetch(`${API_URL}/superadmin/correo/config`, {
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
    const res = await apiFetch(`${API_URL}/superadmin/correo/test`, { method: 'POST' });
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
    const res = await apiFetch(`${API_URL}/superadmin/correo/ausentismo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empleado: e.empleado,
        cedula: e.cedula || undefined,
        cargo: e.cargo || undefined,
        departamento: e.departamento || undefined,
        area: e.area || undefined,
        fechaInicio: e.fechaInicio,
        fechaFin: e.fechaFin || undefined,
        motivo: e.motivo || undefined,
        destinatarios,
        enviadoPor: session.name || 'superadmin',
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
    const r = await apiFetch(`${API_URL}/superadmin/ia/scores`);
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
    const r = await apiFetch(`${API_URL}/superadmin/ia/tendencias`);
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
    const r = await apiFetch(`${API_URL}/superadmin/ia/ranking`);
    const d = await r.json();
    rank.value.mejores = Array.isArray(d?.mejores) ? d.mejores : [];
    rank.value.peores = Array.isArray(d?.peores) ? d.peores : [];
  } catch { emit('error', 'Error cargando ranking'); }
  finally { rank.value.cargando = false; }
};

// ── Paginación (cliente) ──────────────────────────────────────
const PAGE_SIZE = 50;

const smPage = ref(1);
const smTotalPaginas = computed(() => Math.max(1, Math.ceil(smFiltrados.value.length / PAGE_SIZE)));
const smPaginados = computed(() => smFiltrados.value.slice((smPage.value - 1) * PAGE_SIZE, smPage.value * PAGE_SIZE));
watch(smFiltrados, () => { smPage.value = 1; });

const masivoPage = ref(1);
const masivoTotalPaginas = computed(() => Math.max(1, Math.ceil(sm.value.data.length / PAGE_SIZE)));
const masivoPaginados = computed(() => sm.value.data.slice((masivoPage.value - 1) * PAGE_SIZE, masivoPage.value * PAGE_SIZE));
watch(() => sm.value.data, () => { masivoPage.value = 1; });

const iaPage = ref(1);
const iaTotalPaginas = computed(() => Math.max(1, Math.ceil(iaFiltrados.value.length / PAGE_SIZE)));
const iaPaginados = computed(() => iaFiltrados.value.slice((iaPage.value - 1) * PAGE_SIZE, iaPage.value * PAGE_SIZE));
watch(iaFiltrados, () => { iaPage.value = 1; });

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

<style scoped>
/* ── Design tokens estilo Vercel / Geist ──────────────────────── */
.an-root {
  --an-surface: #fbfcfe;
  --an-surface-2: #eef2f6;
  --an-border: #dbe3ec;
  --an-border-strong: #c4d0dd;
  --an-text: #1e293b;
  --an-text-muted: #64748b;
  --an-text-faint: #94a3b8;
  --an-accent: #3B82F6;
  --an-accent-fg: #ffffff;
  --an-thead-bg: #1e293b;
  --an-thead-fg: #cbd5e1;
  --an-zebra: #f6f9fc;
  color: var(--an-text);
}
.an-root.an-dark {
  --an-surface: #161B26;
  --an-surface-2: #1F2533;
  --an-border: #222938;
  --an-border-strong: #2A3245;
  --an-text: #fafafa;
  --an-text-muted: #B0B7C3;
  --an-text-faint: #888888;
  --an-accent: #3B82F6;
  --an-accent-fg: #ffffff;
  --an-thead-bg: #1F2533;
  --an-thead-fg: #888888;
  --an-zebra: transparent;
}

.animate-fade-in,
.an-root { animation: anFade 0.25s ease; }
@keyframes anFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

/* ── Tabs ─────────────────────────────────────────────────────── */
.an-tabs {
  display: inline-flex; align-self: flex-start; align-items: center; gap: 2px; flex-shrink: 0;
  max-width: 100%;
  padding: 3px; border-radius: 8px;
  border: 1px solid var(--an-border); background: var(--an-surface);
  overflow-x: auto;
}
.an-tab {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 9px; border-radius: 6px; white-space: nowrap;
  font-size: 10px; font-weight: 600; letter-spacing: 0.01em;
  color: var(--an-text-muted); background: transparent;
  transition: all 0.15s ease;
}
.an-tab:hover { color: var(--an-text); background: var(--an-surface-2); }
.an-tab.is-active {
  color: var(--an-accent-fg); background: var(--an-accent);
}

/* ── Header de sección ────────────────────────────────────────── */
.an-head {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  flex-shrink: 0; flex-wrap: wrap;
  padding: 7px 11px; border-radius: 9px;
  border: 1px solid var(--an-border); background: var(--an-surface);
}
.an-head-left { display: flex; align-items: center; gap: 8px; }
.an-head-icon {
  width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; color: var(--c, #3b82f6);
  background: color-mix(in srgb, var(--c, #3b82f6) 12%, transparent);
}
.an-head-title { font-size: 12px; font-weight: 600; color: var(--an-text); line-height: 1.2; }
.an-head-sub { font-size: 9px; font-weight: 500; color: var(--an-text-muted); }

/* ── Paginador ────────────────────────────────────────────────── */
.an-pager {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  flex-shrink: 0; padding: 7px 14px;
  border-top: 1px solid var(--an-border); background: var(--an-surface);
}
.an-pager-info { font-size: 10px; font-weight: 600; color: var(--an-text-muted); }
.an-pager-btns { display: flex; gap: 6px; }
.an-pager-btn {
  height: 26px; width: 26px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 7px; border: 1px solid var(--an-border);
  background: var(--an-surface-2); color: var(--an-text-muted);
  font-size: 10px; transition: all 0.15s ease;
}
.an-pager-btn:not(:disabled):hover { color: var(--an-text); border-color: var(--an-border-strong); }
.an-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Card ─────────────────────────────────────────────────────── */
.an-card {
  border: 1px solid var(--an-border); border-radius: 12px;
  background: var(--an-surface);
}
.an-card-head {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 10px 16px; border-bottom: 1px solid var(--an-border);
  background: var(--an-surface-2);
}
.an-card-head-title {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.04em; color: var(--an-text-muted);
}

/* ── Inputs / selects ─────────────────────────────────────────── */
.an-input, .an-select {
  height: 30px; padding: 0 10px; border-radius: 8px;
  font-size: 11px; outline: none;
  border: 1px solid var(--an-border); background: var(--an-surface-2);
  color: var(--an-text); transition: border-color 0.15s ease;
}
textarea.an-input { height: auto; padding: 7px 10px; line-height: 1.4; }
.an-input::placeholder { color: var(--an-text-faint); }
.an-input:focus, .an-select:focus { border-color: var(--an-border-strong); }
.an-label {
  display: block; font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.03em; color: var(--an-text-muted); margin-bottom: 5px;
}

/* ── Botones ──────────────────────────────────────────────────── */
.an-btn, .an-btn-primary, .an-btn-icon {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-size: 11px; font-weight: 600; border-radius: 8px;
  transition: all 0.15s ease; white-space: nowrap;
}
.an-btn:disabled, .an-btn-primary:disabled, .an-btn-icon:disabled { opacity: 0.4; cursor: not-allowed; }
.an-btn { height: 30px; padding: 0 14px; border: 1px solid var(--an-border); background: var(--an-surface); color: var(--an-text); }
.an-btn:not(:disabled):hover { background: var(--an-surface-2); border-color: var(--an-border-strong); }
.an-btn-primary {
  height: 30px; padding: 0 16px; border: 1px solid transparent;
  background: var(--c, var(--an-accent)); color: var(--an-accent-fg);
}
.an-btn-primary[style*="--c"] { color: #fff; }
.an-btn-primary:not(:disabled):hover { opacity: 0.88; }
.an-btn-icon {
  height: 30px; width: 30px; padding: 0;
  border: 1px solid var(--an-border); background: var(--an-surface); color: var(--an-text-muted);
}
.an-btn-icon:not(:disabled):hover { background: var(--an-surface-2); color: var(--an-text); }

/* ── Tablas ───────────────────────────────────────────────────── */
.an-table { width: 100%; border-collapse: collapse; font-size: 11px; }
.an-table thead th {
  position: sticky; top: 0; z-index: 10;
  padding: 9px 16px; text-align: left;
  font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--an-thead-fg); background: var(--an-thead-bg);
  border-bottom: 1px solid var(--an-border);
}
.an-table tbody td { padding: 10px 16px; border-top: 1px solid var(--an-border); color: var(--an-text); }
.an-table tbody tr { transition: background 0.12s ease; }
.an-table tbody tr:nth-child(even) { background: var(--an-zebra); }
.an-table tbody tr:hover { background: var(--an-surface-2); }
.an-strong { font-weight: 600; color: var(--an-text); }
.an-muted { color: var(--an-text-muted); }
.an-faint { color: var(--an-text-faint); }

/* ── Pills / tags ─────────────────────────────────────────────── */
.an-pill {
  display: inline-block; padding: 2px 8px; border-radius: 999px;
  font-size: 9px; font-weight: 700; text-transform: capitalize;
  color: var(--c, #3b82f6);
  background: color-mix(in srgb, var(--c, #3b82f6) 14%, transparent);
}
.an-tag {
  padding: 2px 6px; border-radius: 5px; font-size: 8px; font-weight: 600;
  color: #f43f5e; background: rgba(244, 63, 94, 0.12);
}

/* ── Barras de progreso ───────────────────────────────────────── */
.an-bar-row { display: flex; align-items: center; gap: 8px; }
.an-bar { flex: 1; height: 6px; border-radius: 999px; overflow: hidden; background: var(--an-surface-2); }
.an-bar > div { height: 100%; border-radius: 999px; transition: width 0.4s ease; }
.an-bar-val { font-size: 10px; font-weight: 700; width: 32px; text-align: right; }
.an-mini-bar { height: 4px; width: 80px; border-radius: 999px; overflow: hidden; background: var(--an-surface-2); }
.an-mini-bar > div { height: 100%; border-radius: 999px; transition: width 0.4s ease; }

/* ── Estados loading / empty ──────────────────────────────────── */
.an-loading { flex: 1; min-height: 160px; display: flex; align-items: center; justify-content: center; color: var(--an-text-muted); font-size: 20px; }
.an-empty {
  flex: 1; min-height: 160px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 10px;
  color: var(--an-text-faint);
}
.an-empty i { font-size: 34px; opacity: 0.25; }
.an-empty p { font-size: 11px; }

/* ── Sub-barra selección masiva ───────────────────────────────── */
.an-subbar {
  display: flex; align-items: center; gap: 12px; flex-shrink: 0;
  padding: 9px 16px; border-bottom: 1px solid var(--an-border); background: var(--an-surface-2);
}
.an-subbar-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--an-text-muted); }
.an-check { width: 14px; height: 14px; accent-color: #6366f1; cursor: pointer; }
.an-row-select {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 16px; cursor: pointer; border-top: 1px solid var(--an-border);
  transition: background 0.12s ease;
}
.an-row-select:hover { background: var(--an-surface-2); }
.an-row-select.is-sel { background: color-mix(in srgb, #6366f1 12%, transparent); }

/* ── Leyenda / nota ───────────────────────────────────────────── */
.an-legend-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: var(--an-text-muted); }
.an-note { padding: 10px 16px; border-top: 1px solid var(--an-border); font-size: 9px; color: var(--an-text-faint); }
.an-surface-2 { background: var(--an-surface-2); }

/* ── Tooltip heatmap ──────────────────────────────────────────── */
.an-tooltip {
  position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
  margin-bottom: 6px; padding: 4px 8px; border-radius: 8px;
  font-size: 9px; font-weight: 600; white-space: nowrap; z-index: 20;
  opacity: 0; pointer-events: none; transition: opacity 0.15s ease;
  color: var(--an-text); background: var(--an-surface);
  border: 1px solid var(--an-border); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}
.group:hover .an-tooltip { opacity: 1; }

/* ── Toggle / switch ──────────────────────────────────────────── */
.an-toggle-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-radius: 10px; border: 1px solid var(--an-border);
}
.an-toggle-card.is-on { border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.06); }
.an-switch { width: 40px; height: 20px; border-radius: 999px; position: relative; background: var(--an-surface-2); border: 1px solid var(--an-border); transition: background 0.2s ease; }
.an-switch.is-on { background: #10b981; border-color: #10b981; }
.an-switch-dot { width: 14px; height: 14px; border-radius: 999px; background: #fff; position: absolute; top: 2px; left: 3px; transition: left 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
.an-switch.is-on .an-switch-dot { left: 22px; }

/* ── Resultado test/envío ─────────────────────────────────────── */
.an-result { padding: 8px 12px; border-radius: 10px; font-size: 10px; font-weight: 600; border: 1px solid; }
.an-result.is-ok { color: #10b981; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); }
.an-result.is-err { color: #f43f5e; background: rgba(244, 63, 94, 0.1); border-color: rgba(244, 63, 94, 0.3); }

/* ── Ranking ──────────────────────────────────────────────────── */
.an-rank-row { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; border: 1px solid var(--an-border); background: var(--an-surface-2); }
.an-rank-medal { width: 36px; height: 36px; border-radius: 999px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
</style>
