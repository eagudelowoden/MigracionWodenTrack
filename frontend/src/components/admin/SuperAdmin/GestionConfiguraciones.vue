<template>
  <div class="c-root" :class="isDark ? 'c-dark' : 'c-light'">

    <!-- ══ HEADER ══════════════════════════════════════════════════════════ -->
    <div class="c-header" :class="isDark ? 'c-header-dark' : 'c-header-light'">
      <div>
        <h2 class="c-title" :class="isDark ? 'text-white' : 'text-[#111]'">Configuración del Sistema</h2>
        <p class="c-subtitle" :class="isDark ? 'text-[#555]' : 'text-[#999]'">v{{ appVersion }}</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="c-status-row">
          <span class="c-status-dot" :class="mantenimiento.enabled ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'"></span>
          <span class="c-status-label" :class="isDark ? 'text-[#666]' : 'text-[#999]'">
            {{ mantenimiento.enabled ? 'Mantenimiento' : 'Operativo' }}
          </span>
        </div>
        <button @click="guardar" :disabled="saving" class="c-btn-primary">
          <i class="text-[9px]" :class="saving ? 'fas fa-circle-notch fa-spin' : 'fas fa-floppy-disk'"></i>
          {{ saving ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
    </div>

    <!-- ══ TABS ═════════════════════════════════════════════════════════════ -->
    <div class="c-tabs" :class="isDark ? 'c-tabs-dark' : 'c-tabs-light'">
      <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id"
        class="c-tab" :class="activeTab === t.id ? (isDark ? 'c-tab-active-dark' : 'c-tab-active-light') : (isDark ? 'c-tab-idle-dark' : 'c-tab-idle-light')">
        {{ t.label }}
        <span v-if="activeTab === t.id" class="c-tab-line"></span>
      </button>
    </div>

    <!-- ══ BODY ══════════════════════════════════════════════════════════════ -->
    <div class="c-body">

      <!-- ── TAB SISTEMA ──────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'sistema'" class="c-section">

        <!-- Mantenimiento IIS -->
        <div class="c-card" :class="isDark ? 'c-card-dark' : 'c-card-light'">
          <div class="c-row" :class="isDark ? 'c-row-dark' : 'c-row-light'">
            <div class="flex-1 min-w-0">
              <p class="c-row-label" :class="isDark ? 'text-white' : 'text-[#111]'">Modo mantenimiento IIS</p>
              <p class="c-row-desc" :class="isDark ? 'text-[#555]' : 'text-[#999]'">Redirige a los usuarios a una página de mantenimiento</p>
            </div>
            <button @click="toggleMantenimiento" :disabled="mantenimiento.saving || !mantenimiento.configured"
              class="c-toggle" :class="mantenimiento.enabled ? 'c-toggle-on-rose' : (isDark ? 'c-toggle-off-dark' : 'c-toggle-off-light')">
              <span v-if="mantenimiento.saving" class="c-toggle-spin"><i class="fas fa-spinner fa-spin text-white text-[7px]"></i></span>
              <span v-else class="c-toggle-knob" :class="mantenimiento.enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'"></span>
            </button>
          </div>
          <div class="c-card-body">
            <div v-if="!mantenimiento.configured" class="c-alert c-alert-amber">
              <i class="fas fa-triangle-exclamation text-[9px] shrink-0"></i>
              La variable <code class="c-code">WEBCONFIG_PATH</code> no está configurada en el servidor.
            </div>
            <p v-else class="c-row-desc" :class="mantenimiento.enabled ? 'text-rose-500' : (isDark ? 'text-emerald-400' : 'text-emerald-600')">
              {{ mantenimiento.enabled ? 'Los usuarios son redirigidos a mantenimiento.html' : 'Todos los usuarios acceden normalmente' }}
            </p>
          </div>
        </div>

        <!-- Almacenamiento -->
        <div class="c-card" :class="isDark ? 'c-card-dark' : 'c-card-light'">
          <div class="c-card-head" :class="isDark ? 'c-head-dark' : 'c-head-light'">
            <p class="c-section-label" :class="isDark ? 'text-[#555]' : 'text-[#999]'">Almacenamiento de soportes</p>
            <p class="c-row-desc" :class="isDark ? 'text-[#444]' : 'text-[#bbb]'">Dónde se guardan los archivos adjuntos</p>
          </div>
          <div class="c-card-body">
            <div class="c-radio-list">
              <button v-for="opt in storageOpts" :key="opt.v" @click="config.storage_mode = opt.v"
                class="c-radio-row" :class="isDark ? 'c-radio-row-dark' : 'c-radio-row-light'">
                <span class="c-radio-indicator" :class="config.storage_mode === opt.v ? 'c-radio-on' : (isDark ? 'c-radio-off-dark' : 'c-radio-off-light')">
                  <span v-if="config.storage_mode === opt.v" class="c-radio-dot"></span>
                </span>
                <div class="text-left flex-1">
                  <p class="c-radio-label" :class="isDark ? 'text-white' : 'text-[#111]'">{{ opt.label }}</p>
                  <p class="c-row-desc" :class="isDark ? 'text-[#555]' : 'text-[#999]'">{{ opt.desc }}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── TAB MÓDULOS ─────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'modulos'" class="c-section">
        <p class="c-hint" :class="isDark ? 'text-[#444]' : 'text-[#bbb]'">
          Los módulos inactivos muestran un mensaje de mantenimiento en lugar del contenido.
        </p>
        <div class="c-card" :class="isDark ? 'c-card-dark' : 'c-card-light'">
          <div v-for="(mod, idx) in modulos" :key="mod.key">
            <div class="c-row" :class="[idx > 0 ? (isDark ? 'c-row-sep-dark' : 'c-row-sep-light') : '']">
              <span class="c-dot" :class="isActive(mod.key) ? 'bg-emerald-500' : 'bg-rose-500'"></span>
              <div class="flex-1 min-w-0">
                <p class="c-row-label" :class="isDark ? 'text-white' : 'text-[#111]'">{{ mod.label }}</p>
                <p class="c-row-desc" :class="isDark ? 'text-[#555]' : 'text-[#999]'">{{ mod.desc }}</p>
              </div>
              <span class="c-badge" :class="isActive(mod.key)
                ? (isDark ? 'c-badge-green-dark' : 'c-badge-green-light')
                : 'c-badge-red'">
                {{ isActive(mod.key) ? 'Activo' : 'Inactivo' }}
              </span>
            </div>

            <Transition name="slide">
              <div v-if="!isActive(mod.key)" class="c-msg-wrap" :class="isDark ? 'c-row-sep-dark' : 'c-row-sep-light'">
                <div class="c-msg-inner" :class="isDark ? 'c-msg-dark' : 'c-msg-light'">
                  <i class="fas fa-message text-[8px] shrink-0 opacity-30"></i>
                  <input v-model="config[mod.key + '_message']" type="text"
                    placeholder="Mensaje que verán los usuarios…"
                    class="c-msg-input" :class="isDark ? 'text-white placeholder-white/20' : 'text-[#333] placeholder-[#ccc]'" />
                </div>
              </div>
            </Transition>

            <!-- Acordeón Renuncia dentro de Novedades -->
            <div v-if="mod.key === 'module_novedades'" class="c-row-sep-dark" :class="isDark ? 'c-row-sep-dark' : 'c-row-sep-light'">
              <button @click="renunciaOpen = !renunciaOpen"
                class="c-accordion-trigger" :class="isDark ? 'c-accordion-dark' : 'c-accordion-light'">
                <i class="fas fa-envelope-open-text text-rose-400 text-[9px] shrink-0"></i>
                <span class="flex-1 text-left c-row-label" :class="isDark ? 'text-[#888]' : 'text-[#666]'">
                  Notificaciones de Renuncia
                </span>
                <span v-if="correo.renunciaEmails.length"
                  class="c-count-badge text-rose-400 bg-rose-500/10">
                  {{ correo.renunciaEmails.length }}
                </span>
                <i class="fas text-[9px] transition-transform duration-150"
                  :class="[renunciaOpen ? 'fa-chevron-up' : 'fa-chevron-down', isDark ? 'text-[#444]' : 'text-[#ccc]']"></i>
              </button>

              <Transition name="slide">
                <div v-if="renunciaOpen" class="c-accordion-body" :class="isDark ? 'c-accordion-body-dark' : 'c-accordion-body-light'">
                  <p class="c-row-desc mb-3" :class="isDark ? 'text-[#555]' : 'text-[#999]'">
                    Correos adicionales que reciben aviso cuando la tipificación es
                    <span class="text-rose-400 font-semibold">Renuncia</span>
                  </p>
                  <div v-if="correo.renunciaEmails.length" class="flex flex-col gap-1 mb-3">
                    <div v-for="email in correo.renunciaEmails" :key="email"
                      class="c-email-row" :class="isDark ? 'c-email-dark' : 'c-email-light'">
                      <i class="fas fa-at text-[8px] opacity-30 shrink-0"></i>
                      <span class="flex-1 truncate" :class="isDark ? 'text-[#aaa]' : 'text-[#444]'">{{ email }}</span>
                      <button @click="quitarRenunciaEmail(email)" class="c-remove-btn">
                        <i class="fas fa-xmark text-[8px]"></i>
                      </button>
                    </div>
                  </div>
                  <p v-else class="c-row-desc mb-3" :class="isDark ? 'text-[#444]' : 'text-[#ccc]'">Sin correos configurados</p>
                  <div class="c-input-row">
                    <input v-model="correo.nuevoRenunciaEmail" type="email" placeholder="correo@empresa.com"
                      @keydown.enter="agregarRenunciaEmail"
                      class="c-input flex-1" :class="isDark ? 'c-input-dark' : 'c-input-light'" />
                    <button @click="agregarRenunciaEmail" :disabled="!correo.nuevoRenunciaEmail.trim()"
                      class="c-btn-ghost disabled:opacity-40" :class="isDark ? 'c-ghost-dark' : 'c-ghost-light'">
                      <i class="fas fa-plus text-[9px]"></i> Agregar
                    </button>
                    <button @click="guardarRenunciaEmails" :disabled="correo.guardandoRenuncia || !correo.renunciaEmails.length"
                      class="c-btn-primary disabled:opacity-40">
                      <i class="fas text-[9px]" :class="correo.guardandoRenuncia ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'"></i>
                      {{ correo.guardandoRenuncia ? 'Guardando…' : 'Guardar' }}
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>

      <!-- ── TAB PROGRAMACIÓN ─────────────────────────────────────────────── -->
      <div v-if="activeTab === 'schedule'" class="c-section">

        <div class="c-card" :class="isDark ? 'c-card-dark' : 'c-card-light'">
          <div class="c-row">
            <div class="flex-1 min-w-0">
              <p class="c-row-label" :class="isDark ? 'text-white' : 'text-[#111]'">Control de fechas de cargue</p>
              <p class="c-row-desc" :class="isDark ? 'text-[#555]' : 'text-[#999]'">
                {{ config.mallas_schedule_enabled === 'true' ? 'El cargue solo está disponible en los días configurados' : 'El botón de cargue siempre está disponible' }}
              </p>
            </div>
            <button @click="config.mallas_schedule_enabled = config.mallas_schedule_enabled === 'true' ? 'false' : 'true'"
              class="c-toggle" :class="config.mallas_schedule_enabled === 'true' ? 'c-toggle-on-indigo' : (isDark ? 'c-toggle-off-dark' : 'c-toggle-off-light')">
              <span class="c-toggle-knob" :class="config.mallas_schedule_enabled === 'true' ? 'translate-x-[18px]' : 'translate-x-[2px]'"></span>
            </button>
          </div>
        </div>

        <div v-if="config.mallas_schedule_enabled !== 'true'" class="c-banner" :class="isDark ? 'c-banner-green-dark' : 'c-banner-green-light'">
          <i class="fas fa-unlock text-emerald-500 text-sm shrink-0"></i>
          <div>
            <p class="c-row-label" :class="isDark ? 'text-emerald-400' : 'text-emerald-700'">Cargue siempre disponible</p>
            <p class="c-row-desc mt-0.5" :class="isDark ? 'text-emerald-600' : 'text-emerald-600/70'">Activa el control para definir ventanas de cargue.</p>
          </div>
        </div>

        <template v-if="config.mallas_schedule_enabled === 'true'">
          <!-- Selector modo -->
          <div class="c-card" :class="isDark ? 'c-card-dark' : 'c-card-light'">
            <div class="c-card-head" :class="isDark ? 'c-head-dark' : 'c-head-light'">
              <p class="c-section-label" :class="isDark ? 'text-[#555]' : 'text-[#999]'">Modo de programación</p>
            </div>
            <div class="c-card-body">
              <div class="c-mode-grid">
                <button v-for="m in SCHEDULE_MODES" :key="m.value" @click="config.mallas_schedule_mode = m.value"
                  class="c-mode-btn"
                  :class="config.mallas_schedule_mode === m.value
                    ? (isDark ? 'c-mode-active-dark' : 'c-mode-active-light')
                    : (isDark ? 'c-mode-idle-dark' : 'c-mode-idle-light')">
                  <i :class="[m.icon, 'text-base mb-1', config.mallas_schedule_mode === m.value ? 'text-indigo-400' : (isDark ? 'text-[#444]' : 'text-[#ccc]')]"></i>
                  <p class="c-mode-label" :class="config.mallas_schedule_mode === m.value ? 'text-indigo-400' : (isDark ? 'text-[#888]' : 'text-[#555]')">{{ m.label }}</p>
                  <p class="c-row-desc text-center" :class="isDark ? 'text-[#444]' : 'text-[#ccc]'">{{ m.desc }}</p>
                </button>
              </div>
            </div>
          </div>

          <!-- Semanal -->
          <div v-if="config.mallas_schedule_mode === 'weekly'" class="c-card" :class="isDark ? 'c-card-dark' : 'c-card-light'">
            <div class="c-card-head" :class="isDark ? 'c-head-dark' : 'c-head-light'">
              <p class="c-section-label" :class="isDark ? 'text-[#555]' : 'text-[#999]'">Días habilitados</p>
            </div>
            <div class="c-card-body">
              <div class="cfg-week-grid">
                <button v-for="d in diasSemanaFull" :key="d.v" @click="toggleScheduleDay('weekly', d.v)"
                  class="cfg-day-btn"
                  :class="scheduleWeeklyDays.includes(d.v) ? 'cfg-day-active' : (isDark ? 'cfg-day-idle-dark' : 'cfg-day-idle-light')">
                  <span class="cfg-day-short" :class="scheduleWeeklyDays.includes(d.v) ? 'text-indigo-400' : (isDark ? 'text-white/35' : 'text-slate-400')">{{ d.short }}</span>
                  <span class="cfg-day-num" :class="scheduleWeeklyDays.includes(d.v) ? 'text-indigo-400' : (isDark ? 'text-white/70' : 'text-slate-700')">{{ d.nextDate }}</span>
                  <span class="cfg-day-month" :class="isDark ? 'text-white/25' : 'text-slate-400'">{{ d.nextMonth }}</span>
                  <span v-if="d.isToday" class="cfg-today-pill">Hoy</span>
                </button>
              </div>
              <p v-if="scheduleWeeklyDays.length" class="cfg-schedule-summary" :class="isDark ? 'text-[#555]' : 'text-[#999]'">
                Habilitado cada {{ diasSemanaFull.filter(d => scheduleWeeklyDays.includes(d.v)).map(d => d.full).join(', ') }}
              </p>
            </div>
          </div>

          <!-- Mensual / Fechas exactas calendar -->
          <div v-if="config.mallas_schedule_mode === 'monthly' || config.mallas_schedule_mode === 'specific'"
            class="c-card" :class="isDark ? 'c-card-dark' : 'c-card-light'">
            <div class="c-cal-nav" :class="isDark ? 'c-head-dark' : 'c-head-light'">
              <button @click="prevMonth" class="c-cal-btn" :class="isDark ? 'c-cal-btn-dark' : 'c-cal-btn-light'"><i class="fas fa-chevron-left text-[9px]"></i></button>
              <p class="c-cal-title" :class="isDark ? 'text-white' : 'text-[#111]'">{{ monthName }} {{ calYear }}</p>
              <button @click="nextMonth" class="c-cal-btn" :class="isDark ? 'c-cal-btn-dark' : 'c-cal-btn-light'"><i class="fas fa-chevron-right text-[9px]"></i></button>
            </div>
            <div class="c-card-body">
              <div class="cfg-cal-head-row">
                <div v-for="h in ['Lu','Ma','Mi','Ju','Vi','Sá','Do']" :key="h" class="cfg-cal-head-cell" :class="isDark ? 'text-[#444]' : 'text-[#ccc]'">{{ h }}</div>
              </div>
              <div class="cfg-cal-grid">
                <div v-for="(cell, idx) in calendarGrid" :key="idx">
                  <button v-if="cell"
                    @click="config.mallas_schedule_mode === 'monthly'
                      ? toggleScheduleDay('monthly', cell)
                      : (!isPastDate(calYear, calMonth, cell) && toggleSpecificDate(calYear, calMonth, cell))"
                    class="cfg-cal-day"
                    :class="(config.mallas_schedule_mode === 'monthly' ? scheduleMonthlyDays.includes(cell) : isSpecificDateSelected(calYear, calMonth, cell))
                      ? 'cfg-cal-day-active'
                      : (config.mallas_schedule_mode === 'specific' && isPastDate(calYear, calMonth, cell))
                        ? (isDark ? 'cfg-cal-day-past-dark' : 'cfg-cal-day-past-light')
                        : (isDark ? 'cfg-cal-day-idle-dark' : 'cfg-cal-day-idle-light')">
                    {{ cell }}
                  </button>
                  <div v-else class="cfg-cal-day"></div>
                </div>
              </div>
              <div v-if="config.mallas_schedule_mode === 'specific' && scheduleSpecificDates.length" class="cfg-specific-chips" :class="isDark ? 'border-white/8' : 'border-slate-100'">
                <span v-for="d in scheduleSpecificDates" :key="d" class="cfg-specific-chip" :class="isDark ? 'cfg-chip-indigo-dark' : 'cfg-chip-indigo-light'">
                  {{ formatSpecificDate(d) }}
                  <button @click="removeSpecificDate(d)" class="c-remove-btn"><i class="fas fa-times text-[8px]"></i></button>
                </span>
              </div>
              <p v-else-if="config.mallas_schedule_mode === 'specific'" class="cfg-schedule-summary cfg-schedule-summary-center" :class="isDark ? 'text-[#444]' : 'text-[#ccc]'">
                Haz clic en los días para seleccionar fechas exactas
              </p>
              <p v-if="config.mallas_schedule_mode === 'monthly' && scheduleMonthlyDays.length" class="cfg-schedule-summary cfg-schedule-summary-center" :class="isDark ? 'text-[#555]' : 'text-[#999]'">
                Habilitado el día {{ scheduleMonthlyDays.join(', ') }} de cada mes
              </p>
            </div>
          </div>

          <div v-if="proximasFechas.length" class="c-card c-proximas" :class="isDark ? 'c-card-dark' : 'c-card-light'">
            <p class="c-section-label mb-2" :class="isDark ? 'text-indigo-400' : 'text-indigo-600'">Próximas ventanas habilitadas</p>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="f in proximasFechas" :key="f" class="cfg-proxima-chip" :class="isDark ? 'cfg-chip-indigo-dark' : 'cfg-proxima-chip-light'">{{ f }}</span>
            </div>
          </div>
          <div v-else-if="config.mallas_schedule_mode !== 'free'" class="c-alert c-alert-amber">
            <i class="fas fa-triangle-exclamation text-[9px] shrink-0"></i>
            No hay fechas habilitadas configuradas aún.
          </div>
        </template>
      </div>

      <!-- ── TAB CORREO ───────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'correo'" class="c-section">

        <!-- SMTP -->
        <div class="c-card" :class="isDark ? 'c-card-dark' : 'c-card-light'">
          <div class="c-card-head" :class="isDark ? 'c-head-dark' : 'c-head-light'">
            <div class="flex-1">
              <p class="c-section-label" :class="isDark ? 'text-[#555]' : 'text-[#999]'">Configuración SMTP</p>
              <p class="c-row-desc" :class="isDark ? 'text-[#444]' : 'text-[#bbb]'">Outlook / Office 365 — smtp.office365.com:587</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="c-dot" :class="correo.form.habilitado ? 'bg-emerald-500 animate-pulse' : (isDark ? 'bg-[#333]' : 'bg-[#ddd]')"></span>
              <span class="c-row-desc" :class="correo.form.habilitado ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-[#444]' : 'text-[#bbb]')">
                {{ correo.form.habilitado ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>
          <div class="c-card-body">
            <div class="c-form-grid">
              <div class="c-field">
                <label class="c-label" :class="isDark ? 'text-[#555]' : 'text-[#999]'">Host SMTP</label>
                <input v-model="correo.form.host" type="text" placeholder="smtp.office365.com" class="c-input" :class="isDark ? 'c-input-dark' : 'c-input-light'" />
              </div>
              <div class="c-field">
                <label class="c-label" :class="isDark ? 'text-[#555]' : 'text-[#999]'">Puerto</label>
                <input v-model="correo.form.port" type="text" placeholder="587" class="c-input" :class="isDark ? 'c-input-dark' : 'c-input-light'" />
              </div>
              <div class="c-field c-span2">
                <label class="c-label" :class="isDark ? 'text-[#555]' : 'text-[#999]'">Usuario SMTP</label>
                <input v-model="correo.form.user" type="email" placeholder="notificaciones@empresa.com" class="c-input" :class="isDark ? 'c-input-dark' : 'c-input-light'" />
              </div>
              <div class="c-field c-span2">
                <label class="c-label" :class="isDark ? 'text-[#555]' : 'text-[#999]'">
                  Contraseña de aplicación
                  <span v-if="correo.config.passConfigurado" class="opacity-50 font-normal"> · configurada</span>
                </label>
                <input v-model="correo.form.pass" type="password" placeholder="••••••••" class="c-input" :class="isDark ? 'c-input-dark' : 'c-input-light'" />
              </div>
              <div class="c-field">
                <label class="c-label" :class="isDark ? 'text-[#555]' : 'text-[#999]'">Nombre remitente</label>
                <input v-model="correo.form.fromNombre" type="text" placeholder="WodenTrack RRHH" class="c-input" :class="isDark ? 'c-input-dark' : 'c-input-light'" />
              </div>
              <div class="c-field">
                <label class="c-label" :class="isDark ? 'text-[#555]' : 'text-[#999]'">Envío de correos</label>
                <div class="c-toggle-row" :class="correo.form.habilitado ? (isDark ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50/60') : (isDark ? 'border-[#222]' : 'border-[#eee]')">
                  <span class="c-row-desc" :class="correo.form.habilitado ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-[#444]' : 'text-[#bbb]')">
                    {{ correo.form.habilitado ? 'Habilitado' : 'Deshabilitado' }}
                  </span>
                  <button @click="correo.form.habilitado = !correo.form.habilitado"
                    class="c-toggle shrink-0" :class="correo.form.habilitado ? 'c-toggle-on-green' : (isDark ? 'c-toggle-off-dark' : 'c-toggle-off-light')">
                    <span class="c-toggle-knob" :class="correo.form.habilitado ? 'translate-x-[18px]' : 'translate-x-[2px]'"></span>
                  </button>
                </div>
              </div>
            </div>
            <div class="c-actions">
              <button @click="testConexion" :disabled="correo.testeando" class="c-btn-ghost" :class="isDark ? 'c-ghost-dark' : 'c-ghost-light'">
                <i class="fas text-[9px]" :class="correo.testeando ? 'fa-circle-notch fa-spin' : 'fa-plug'"></i> Probar conexión
              </button>
              <button @click="guardarConfigCorreo" :disabled="correo.guardando" class="c-btn-primary">
                <i class="fas text-[9px]" :class="correo.guardando ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'"></i> Guardar SMTP
              </button>
            </div>
            <div v-if="correo.testResult" class="c-result mt-3" :class="correo.testResult.ok ? 'c-result-ok' : 'c-result-err'">
              <i :class="correo.testResult.ok ? 'fas fa-check' : 'fas fa-xmark'" class="text-[9px]"></i>
              {{ correo.testResult.mensaje }}
            </div>
          </div>
        </div>

        <!-- Novedades (tipo: novedades) -->
        <div class="c-card" :class="isDark ? 'c-card-dark' : 'c-card-light'">
          <div class="c-card-head" :class="isDark ? 'c-head-dark' : 'c-head-light'">
            <div>
              <p class="c-section-label" :class="isDark ? 'text-[#555]' : 'text-[#999]'">Novedades</p>
              <p class="c-row-desc" :class="isDark ? 'text-[#444]' : 'text-[#bbb]'">Correos que reciben notificaciones generales de novedades aprobadas</p>
            </div>
          </div>
          <div class="c-card-body">
            <div v-if="correo.destinatarios.length" class="flex flex-wrap gap-1.5 mb-3">
              <div v-for="email in correo.destinatarios" :key="email" class="c-tag" :class="isDark ? 'c-tag-dark' : 'c-tag-light'">
                {{ email }}
                <button @click="quitarDestinatario(email)" class="c-remove-btn ml-1"><i class="fas fa-xmark text-[8px]"></i></button>
              </div>
            </div>
            <p v-else class="c-row-desc mb-3" :class="isDark ? 'text-[#444]' : 'text-[#ccc]'">Sin correos configurados</p>
            <div class="c-input-row">
              <input v-model="correo.nuevoDestinatario" type="email" placeholder="novedades@empresa.com"
                @keydown.enter.prevent="agregarDestinatario" class="c-input flex-1" :class="isDark ? 'c-input-dark' : 'c-input-light'" />
              <button @click="agregarDestinatario" class="c-btn-ghost" :class="isDark ? 'c-ghost-dark' : 'c-ghost-light'">
                <i class="fas fa-plus text-[9px]"></i>
              </button>
              <button @click="guardarDestinatarios" :disabled="correo.guardandoDest" class="c-btn-primary">
                <i class="fas text-[9px]" :class="correo.guardandoDest ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'"></i>
                {{ correo.guardandoDest ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Capital Humano -->
        <div class="c-card" :class="isDark ? 'c-card-dark' : 'c-card-light'">
          <div class="c-card-head" :class="isDark ? 'c-head-dark' : 'c-head-light'">
            <div>
              <p class="c-section-label" :class="isDark ? 'text-[#555]' : 'text-[#999]'">Capital Humano</p>
              <p class="c-row-desc" :class="isDark ? 'text-[#444]' : 'text-[#bbb]'">Siempre recibirán el correo al notificar novedades de horas extra aprobadas</p>
            </div>
          </div>
          <div class="c-card-body">
            <div v-if="correo.capitalHumano.length" class="flex flex-wrap gap-1.5 mb-3">
              <div v-for="email in correo.capitalHumano" :key="email" class="c-tag" :class="isDark ? 'c-tag-dark' : 'c-tag-light'">
                {{ email }}
                <button @click="quitarCapitalHumano(email)" class="c-remove-btn ml-1"><i class="fas fa-xmark text-[8px]"></i></button>
              </div>
            </div>
            <p v-else class="c-row-desc mb-3" :class="isDark ? 'text-[#444]' : 'text-[#ccc]'">Sin correos configurados</p>
            <div class="c-input-row">
              <input v-model="correo.nuevoCapitalHumano" type="email" placeholder="capitalhumano@empresa.com"
                @keydown.enter.prevent="agregarCapitalHumano" class="c-input flex-1" :class="isDark ? 'c-input-dark' : 'c-input-light'" />
              <button @click="agregarCapitalHumano" class="c-btn-ghost" :class="isDark ? 'c-ghost-dark' : 'c-ghost-light'">
                <i class="fas fa-plus text-[9px]"></i>
              </button>
              <button @click="guardarCapitalHumano" :disabled="correo.guardandoCH" class="c-btn-primary">
                <i class="fas text-[9px]" :class="correo.guardandoCH ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'"></i>
                {{ correo.guardandoCH ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Coordinadores -->
        <div class="c-card" :class="isDark ? 'c-card-dark' : 'c-card-light'">
          <div class="c-card-head" :class="isDark ? 'c-head-dark' : 'c-head-light'">
            <div>
              <p class="c-section-label" :class="isDark ? 'text-[#555]' : 'text-[#999]'">Coordinadores por Departamento</p>
              <p class="c-row-desc" :class="isDark ? 'text-[#444]' : 'text-[#bbb]'">Reciben el correo según su departamento asignado. Sin asignar → siempre recibe.</p>
            </div>
          </div>
          <div class="c-card-body flex flex-col gap-3">
            <div v-if="correo.coordinadores.length" class="flex flex-col gap-1">
              <div v-for="(item, idx) in correo.coordinadores" :key="idx"
                class="c-email-row" :class="isDark ? 'c-email-dark' : 'c-email-light'">
                <i class="fas fa-envelope text-[8px] opacity-30 shrink-0"></i>
                <span class="flex-1 truncate" :class="isDark ? 'text-[#aaa]' : 'text-[#444]'">{{ item.email }}</span>
                <span v-if="item.segmento" class="c-badge c-badge-blue">{{ item.segmento }}</span>
                <span v-else class="c-badge" :class="isDark ? 'c-badge-neutral-dark' : 'c-badge-neutral-light'">Todos</span>
                <button @click="quitarCoordinador(idx)" class="c-remove-btn"><i class="fas fa-xmark text-[8px]"></i></button>
              </div>
            </div>
            <p v-else class="c-row-desc" :class="isDark ? 'text-[#444]' : 'text-[#ccc]'">Sin coordinadores configurados</p>

            <div class="flex flex-col gap-2 pt-3 border-t" :class="isDark ? 'border-[#1a1a1a]' : 'border-[#f0f0f0]'">
              <p class="c-label" :class="isDark ? 'text-[#555]' : 'text-[#999]'">Agregar coordinador</p>
              <div class="c-field">
                <label class="c-label" :class="isDark ? 'text-[#444]' : 'text-[#bbb]'">Correo electrónico</label>
                <input v-model="correo.nuevoCoordEmail" type="email" placeholder="coordinador@empresa.com"
                  class="c-input" :class="isDark ? 'c-input-dark' : 'c-input-light'" />
              </div>
              <div class="c-field">
                <label class="c-label" :class="isDark ? 'text-[#444]' : 'text-[#bbb]'">Segmento <span class="opacity-50">(opcional)</span></label>
                <select v-model="correo.nuevoCoordSegmento" class="c-input" :class="isDark ? 'c-input-dark' : 'c-input-light'">
                  <option value="">— Sin filtro —</option>
                  <option v-for="s in correo.segmentos" :key="s" :value="s">{{ s }}</option>
                </select>
                <p v-if="!correo.segmentos.length" class="c-row-desc mt-1 text-amber-500">
                  <i class="fas fa-triangle-exclamation mr-1 text-[9px]"></i>No hay segmentos creados.
                </p>
              </div>
              <div class="c-input-row">
                <button @click="agregarCoordinador" :disabled="!correo.nuevoCoordEmail.trim()"
                  class="c-btn-ghost flex-1 disabled:opacity-40" :class="isDark ? 'c-ghost-dark' : 'c-ghost-light'">
                  <i class="fas fa-plus text-[9px]"></i> Agregar a la lista
                </button>
                <button @click="guardarCoordinadores" :disabled="correo.guardandoCoord || !correo.coordinadores.length"
                  class="c-btn-primary flex-1 disabled:opacity-40">
                  <i class="fas text-[9px]" :class="correo.guardandoCoord ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'"></i>
                  {{ correo.guardandoCoord ? 'Guardando…' : 'Guardar' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Prueba de envío -->
        <div class="c-card" :class="isDark ? 'c-card-dark' : 'c-card-light'">
          <div class="c-card-head" :class="isDark ? 'c-head-dark' : 'c-head-light'">
            <p class="c-section-label" :class="isDark ? 'text-[#555]' : 'text-[#999]'">Prueba de envío</p>
          </div>
          <div class="c-card-body">
            <div class="c-input-row">
              <input v-model="correo.correoTest" type="email" placeholder="mi-correo@empresa.com"
                class="c-input flex-1" :class="isDark ? 'c-input-dark' : 'c-input-light'" />
              <button @click="enviarCorreoTest" :disabled="correo.enviandoTest || !correo.correoTest" class="c-btn-primary">
                <i class="fas text-[9px]" :class="correo.enviandoTest ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'"></i>
                {{ correo.enviandoTest ? 'Enviando…' : 'Enviar prueba' }}
              </button>
            </div>
            <div v-if="correo.testEnvioResult" class="c-result mt-3" :class="correo.testEnvioResult.ok ? 'c-result-ok' : 'c-result-err'">
              <i :class="correo.testEnvioResult.ok ? 'fas fa-check' : 'fas fa-xmark'" class="text-[9px]"></i>
              {{ correo.testEnvioResult.mensaje }}
            </div>
          </div>
        </div>

      </div>

    </div><!-- /c-body -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';

const props = defineProps({ isDark: Boolean });
const emit  = defineEmits(['success', 'error']);

const API_URL  = import.meta.env.VITE_API_URL;
const API_BASE = API_URL.replace('/usuarios', '');

const activeTab = ref('sistema');
const tabs = [
  { id: 'sistema',  label: 'Sistema',      icon: 'fas fa-server'         },
  { id: 'modulos',  label: 'Módulos',       icon: 'fas fa-th-large'       },
  { id: 'schedule', label: 'Programación',  icon: 'fas fa-calendar-check' },
  { id: 'correo',   label: 'Correo',        icon: 'fas fa-envelope'       },
];

const SCHEDULE_MODES = [
  { value: 'free',     label: 'Libre',         icon: 'fas fa-unlock-keyhole', desc: 'Siempre disponible'       },
  { value: 'weekly',   label: 'Semanal',        icon: 'fas fa-calendar-week',  desc: 'Días de la semana'        },
  { value: 'monthly',  label: 'Mensual',        icon: 'fas fa-calendar-days',  desc: 'Días del mes (recurrente)'},
  { value: 'specific', label: 'Fechas exactas', icon: 'fas fa-calendar-check', desc: 'Fechas puntuales'         },
];

const storageOpts = [
  { v: 'local', icon: 'fas fa-hard-drive', label: 'Almacenamiento local', desc: 'Archivos guardados en el servidor' },
  { v: 's3',    icon: 'fab fa-aws',         label: 'Amazon S3',            desc: 'Credenciales configuradas en .env' },
];

const modulos = [
  { key: 'module_asistencias', label: 'Asistencias',   icon: 'fas fa-chart-line',       desc: 'Control de asistencia y marcación' },
  { key: 'module_mallas',      label: 'Cargue Mallas', icon: 'fas fa-cloud-arrow-up',   desc: 'Programación y cargue de turnos'   },
  { key: 'module_novedades',   label: 'Novedades',     icon: 'fas fa-file-circle-plus', desc: 'Registro y gestión de novedades'   },
];

const renunciaOpen = ref(false);
const saving     = ref(false);
const appVersion = ref('—');
const mantenimiento = reactive({ enabled: false, configured: false, saving: false });

const config = reactive({
  storage_mode: 'local',
  module_asistencias_active: 'true',  module_asistencias_message: 'Módulo en mantenimiento. Vuelve pronto.',
  module_mallas_active:      'true',  module_mallas_message:      'Módulo en mantenimiento. Vuelve pronto.',
  module_novedades_active:   'true',  module_novedades_message:   'Módulo en mantenimiento. Vuelve pronto.',
  mallas_schedule_enabled: 'false',
  mallas_schedule_mode: 'free',
  mallas_schedule_weekly_days: '[]',
  mallas_schedule_monthly_days: '[]',
  mallas_schedule_specific_dates: '[]',
});

const today    = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
const calMonth = ref(today.getMonth());
const calYear  = ref(today.getFullYear());

const prevMonth = () => { if (calMonth.value === 0) { calMonth.value = 11; calYear.value--; } else calMonth.value--; };
const nextMonth = () => { if (calMonth.value === 11) { calMonth.value = 0; calYear.value++; } else calMonth.value++; };

const monthName = computed(() =>
  new Date(calYear.value, calMonth.value, 1).toLocaleDateString('es-CO', { month: 'long', timeZone: 'America/Bogota' })
);

const calendarGrid = computed(() => {
  const firstDay    = new Date(calYear.value, calMonth.value, 1).getDay();
  const daysInMonth = new Date(calYear.value, calMonth.value + 1, 0).getDate();
  const offset = (firstDay + 6) % 7;
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
});

const diasSemanaFull = computed(() => {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  return [
    { v: 1, short: 'Lun', full: 'lunes'      },
    { v: 2, short: 'Mar', full: 'martes'     },
    { v: 3, short: 'Mié', full: 'miércoles'  },
    { v: 4, short: 'Jue', full: 'jueves'     },
    { v: 5, short: 'Vie', full: 'viernes'    },
    { v: 6, short: 'Sáb', full: 'sábado'     },
    { v: 0, short: 'Dom', full: 'domingo'    },
  ].map(d => {
    const diff = ((d.v - now.getDay()) + 7) % 7;
    const next = new Date(now);
    next.setDate(now.getDate() + diff);
    return {
      ...d,
      nextDate:  next.getDate(),
      nextMonth: next.toLocaleDateString('es-CO', { month: 'short', timeZone: 'America/Bogota' }),
      isToday:   diff === 0,
    };
  });
});

const scheduleWeeklyDays    = computed(() => { try { return JSON.parse(config.mallas_schedule_weekly_days   || '[]'); } catch { return []; } });
const scheduleMonthlyDays   = computed(() => { try { return JSON.parse(config.mallas_schedule_monthly_days  || '[]'); } catch { return []; } });
const scheduleSpecificDates = computed(() => { try { return JSON.parse(config.mallas_schedule_specific_dates|| '[]'); } catch { return []; } });

const toggleScheduleDay = (type, val) => {
  const key = type === 'weekly' ? 'mallas_schedule_weekly_days' : 'mallas_schedule_monthly_days';
  const arr = [...(type === 'weekly' ? scheduleWeeklyDays.value : scheduleMonthlyDays.value)];
  const idx = arr.indexOf(val);
  if (idx === -1) arr.push(val); else arr.splice(idx, 1);
  arr.sort((a, b) => a - b);
  config[key] = JSON.stringify(arr);
};

const isPastDate = (year, month, day) => {
  const now  = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  const cell = new Date(year, month, day);
  return cell < new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const isSpecificDateSelected = (year, month, day) => {
  const s = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return scheduleSpecificDates.value.includes(s);
};

const toggleSpecificDate = (year, month, day) => {
  const s = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const arr = [...scheduleSpecificDates.value];
  const idx = arr.indexOf(s);
  if (idx === -1) arr.push(s); else arr.splice(idx, 1);
  arr.sort();
  config.mallas_schedule_specific_dates = JSON.stringify(arr);
};

const removeSpecificDate = (dateStr) => {
  config.mallas_schedule_specific_dates = JSON.stringify(scheduleSpecificDates.value.filter(d => d !== dateStr));
};

const formatSpecificDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
};

const proximasFechas = computed(() => {
  if (config.mallas_schedule_enabled !== 'true') return [];
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  const res = [];
  for (let i = 0; i <= 90 && res.length < 5; i++) {
    const d = new Date(now); d.setDate(now.getDate() + i);
    let ok = false;
    if      (config.mallas_schedule_mode === 'weekly')   ok = scheduleWeeklyDays.value.includes(d.getDay());
    else if (config.mallas_schedule_mode === 'monthly')  ok = scheduleMonthlyDays.value.includes(d.getDate());
    else if (config.mallas_schedule_mode === 'specific') {
      const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      ok = scheduleSpecificDates.value.includes(s);
    }
    if (ok) res.push(d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Bogota' }));
  }
  return res;
});

const isActive    = (key) => config[key + '_active'] === 'true';
const toggleModulo = (key) => { config[key + '_active'] = isActive(key) ? 'false' : 'true'; };

const cargarMantenimiento = async () => {
  try {
    const [resM, resV] = await Promise.all([
      fetch(`${API_BASE}/mantenimiento`),
      fetch(`${API_BASE}/version?t=${Date.now()}`),
    ]);
    if (resM.ok) { const d = await resM.json(); mantenimiento.enabled = d.enabled; mantenimiento.configured = d.configured; }
    if (resV.ok) { const d = await resV.json(); appVersion.value = d.version ?? '—'; }
  } catch { /* silencioso */ }
};

const toggleMantenimiento = async () => {
  mantenimiento.saving = true;
  const nuevo = !mantenimiento.enabled;
  try {
    const res  = await fetch(`${API_BASE}/mantenimiento`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: nuevo }),
    });
    const data = await res.json();
    if (data.ok) { mantenimiento.enabled = nuevo; emit('success', nuevo ? '⚠ Mantenimiento activado' : '✓ Sitio restaurado'); }
    else emit('error', data.message || 'No se pudo cambiar el estado');
  } catch { emit('error', 'Error al comunicarse con el servidor'); }
  finally { mantenimiento.saving = false; }
};

const cargar = async () => {
  try {
    const res = await fetch(`${API_URL}/sistema-config`);
    if (!res.ok) return;
    Object.assign(config, await res.json());
  } catch { /* silencioso */ }
};

const guardar = async () => {
  saving.value = true;
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const res = await fetch(`${API_URL}/sistema-config`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates: { ...config }, updatedBy: session.name || 'SuperAdmin' }),
    });
    if (!res.ok) throw new Error();
    emit('success', 'Configuración guardada correctamente');
  } catch { emit('error', 'Error al guardar la configuración'); }
  finally { saving.value = false; }
};

const correo = ref({
  config: { host: '', port: '587', user: '', passConfigurado: false, fromNombre: 'WodenTrack', habilitado: false },
  form:   { host: '', port: '587', user: '', pass: '',              fromNombre: 'WodenTrack', habilitado: false },
  guardando: false, testeando: false, testResult: null,
  // Legacy (mantener por compatibilidad)
  destinatarios: [], nuevoDestinatario: '', guardandoDest: false,
  // Capital Humano
  capitalHumano: [], nuevoCapitalHumano: '', guardandoCH: false,
  // Novedades — Renuncia
  renunciaEmails: [], nuevoRenunciaEmail: '', guardandoRenuncia: false,
  // Coordinadores por departamento
  coordinadores: [],          // [{ email, segmento }]
  nuevoCoordEmail: '',
  nuevoCoordSegmento: '',
  guardandoCoord: false,
  segmentos: [],              // nombres de segmentos disponibles
  correoTest: '', enviandoTest: false, testEnvioResult: null,
});

const cargarConfigCorreo = async () => {
  try {
    const [resCfg, resCH, resCord, resSegs, resRen, resDest] = await Promise.all([
      fetch(`${API_URL}/superadmin/correo/config`,                  { cache: 'no-store' }),
      fetch(`${API_URL}/superadmin/correo/capital-humano`,          { cache: 'no-store' }),
      fetch(`${API_URL}/superadmin/correo/coordinadores`,           { cache: 'no-store' }),
      fetch(`${API_URL}/organizacion/segmentos`,                     { cache: 'no-store' }),
      fetch(`${API_URL}/superadmin/correo/novedades-renuncia`,      { cache: 'no-store' }),
      fetch(`${API_URL}/superadmin/correo/novedades-destinatarios`, { cache: 'no-store' }),
    ]);
    if (resCfg.ok) {
      const cfg = await resCfg.json();
      correo.value.config = cfg;
      correo.value.form   = { host: cfg.host, port: cfg.port, user: cfg.user, pass: '', fromNombre: cfg.fromNombre, habilitado: cfg.habilitado };
    }
    if (resCH.ok)   correo.value.capitalHumano  = await resCH.json();
    if (resCord.ok) correo.value.coordinadores   = await resCord.json();
    if (resRen.ok)  correo.value.renunciaEmails  = await resRen.json();
    if (resDest.ok) correo.value.destinatarios   = await resDest.json();
    if (resSegs.ok) {
      const segs = await resSegs.json();
      correo.value.segmentos = Array.isArray(segs) ? segs.map(s => s.nombre ?? s) : [];
    }
  } catch (e) { emit('error', 'Error al cargar configuración de correo'); }
};

const guardarConfigCorreo = async () => {
  correo.value.guardando = true; correo.value.testResult = null;
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const res = await fetch(`${API_URL}/superadmin/correo/config`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...correo.value.form, updatedBy: session.name || 'superadmin' }),
    });
    if (!res.ok) throw new Error();
    emit('success', 'Configuración de correo guardada');
    await cargarConfigCorreo();
  } catch { emit('error', 'Error al guardar configuración'); }
  finally { correo.value.guardando = false; }
};

const testConexion = async () => {
  correo.value.testeando = true; correo.value.testResult = null;
  try {
    const res = await fetch(`${API_URL}/superadmin/correo/test`, { method: 'POST' });
    correo.value.testResult = await res.json();
  } catch { correo.value.testResult = { ok: false, mensaje: 'Error al conectar con el servidor' }; }
  finally { correo.value.testeando = false; }
};

const agregarDestinatario = () => {
  const email = correo.value.nuevoDestinatario.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
  if (!correo.value.destinatarios.includes(email)) correo.value.destinatarios.push(email);
  correo.value.nuevoDestinatario = '';
};

const quitarDestinatario = (email) => {
  correo.value.destinatarios = correo.value.destinatarios.filter(d => d !== email);
};

const guardarDestinatarios = async () => {
  const pendiente = correo.value.nuevoDestinatario.trim().toLowerCase();
  if (pendiente && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pendiente)) {
    if (!correo.value.destinatarios.includes(pendiente)) correo.value.destinatarios.push(pendiente);
    correo.value.nuevoDestinatario = '';
  }
  if (!correo.value.destinatarios.length) { emit('error', 'Escribe al menos un correo destinatario'); return; }
  correo.value.guardandoDest = true;
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const res = await fetch(`${API_URL}/superadmin/correo/novedades-destinatarios`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinatarios: correo.value.destinatarios, updatedBy: session.name || 'superadmin' }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    emit('success', 'Destinatarios guardados');
  } catch { emit('error', 'Error al guardar destinatarios'); }
  finally { correo.value.guardandoDest = false; }
};

// ── Capital Humano ──────────────────────────────────────────────────────────
const agregarCapitalHumano = () => {
  const email = correo.value.nuevoCapitalHumano.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
  if (!correo.value.capitalHumano.includes(email)) correo.value.capitalHumano.push(email);
  correo.value.nuevoCapitalHumano = '';
};

const quitarCapitalHumano = async (email) => {
  correo.value.capitalHumano = correo.value.capitalHumano.filter(e => e !== email);
  await guardarCapitalHumano(false); // persistir sin hacer flush del input
};

const guardarCapitalHumano = async (flushInput = true) => {
  if (flushInput) agregarCapitalHumano();
  correo.value.guardandoCH = true;
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const res = await fetch(`${API_URL}/superadmin/correo/capital-humano`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails: correo.value.capitalHumano, updatedBy: session.name || 'superadmin' }),
    });
    if (!res.ok) throw new Error();
    emit('success', 'Capital Humano guardado');
    await cargarConfigCorreo();
  } catch { emit('error', 'Error al guardar Capital Humano'); }
  finally { correo.value.guardandoCH = false; }
};

// ── Novedades — Renuncia ────────────────────────────────────────────────────
const agregarRenunciaEmail = () => {
  const email = correo.value.nuevoRenunciaEmail.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
  if (!correo.value.renunciaEmails.includes(email)) correo.value.renunciaEmails.push(email);
  correo.value.nuevoRenunciaEmail = '';
};

const quitarRenunciaEmail = async (email) => {
  correo.value.renunciaEmails = correo.value.renunciaEmails.filter(e => e !== email);
  await guardarRenunciaEmails(false);
};

const guardarRenunciaEmails = async (flushInput = true) => {
  if (flushInput) agregarRenunciaEmail();
  correo.value.guardandoRenuncia = true;
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const res = await fetch(`${API_URL}/superadmin/correo/novedades-renuncia`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails: correo.value.renunciaEmails, updatedBy: session.name || 'superadmin' }),
    });
    if (!res.ok) throw new Error();
    emit('success', 'Correos de renuncia guardados');
    await cargarConfigCorreo();
  } catch { emit('error', 'Error al guardar correos de renuncia'); }
  finally { correo.value.guardandoRenuncia = false; }
};

// ── Coordinadores por departamento ──────────────────────────────────────────
const agregarCoordinador = () => {
  const email = correo.value.nuevoCoordEmail.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
  const segmento = correo.value.nuevoCoordSegmento?.trim() || null;
  const yaExiste = correo.value.coordinadores.some(c => c.email === email && c.segmento === segmento);
  if (!yaExiste) correo.value.coordinadores.push({ email, segmento });
  correo.value.nuevoCoordEmail = '';
  correo.value.nuevoCoordSegmento = '';
};

const quitarCoordinador = async (idx) => {
  correo.value.coordinadores.splice(idx, 1);
  await guardarCoordinadores(false); // persistir sin hacer flush del input
};

const guardarCoordinadores = async (flushInput = true) => {
  if (flushInput) agregarCoordinador();
  correo.value.guardandoCoord = true;
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const res = await fetch(`${API_URL}/superadmin/correo/coordinadores`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: correo.value.coordinadores, updatedBy: session.name || 'superadmin' }),
    });
    if (!res.ok) throw new Error();
    emit('success', 'Coordinadores guardados');
    await cargarConfigCorreo();
  } catch { emit('error', 'Error al guardar coordinadores'); }
  finally { correo.value.guardandoCoord = false; }
};

const enviarCorreoTest = async () => {
  if (!correo.value.correoTest) return;
  correo.value.enviandoTest = true; correo.value.testEnvioResult = null;
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const res = await fetch(`${API_URL}/superadmin/correo/ausentismo`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empleado: 'Usuario de Prueba', cedula: '0000000000',
        tipificacion: 'PRUEBA DE CORREO', descripcion: 'Este es un correo de prueba enviado desde WodenTrack.',
        fechaInicio: new Date().toISOString().split('T')[0],
        destinatarios: [correo.value.correoTest],
        enviadoPor: session.name || 'SuperAdmin',
      }),
    });
    correo.value.testEnvioResult = await res.json();
  } catch { correo.value.testEnvioResult = { ok: false, mensaje: 'Error de red al enviar' }; }
  finally { correo.value.enviandoTest = false; }
};

onMounted(() => { cargar(); cargarMantenimiento(); cargarConfigCorreo(); });
watch(activeTab, (tab) => { if (tab === 'correo') cargarConfigCorreo(); });
</script>

<style scoped>
/* ════════════════════════════════════════════════════════════
   ROOT
════════════════════════════════════════════════════════════ */
.c-root { height: 100%; display: flex; flex-direction: column; font-family: 'Inter', system-ui, sans-serif; overflow: hidden; }
.c-dark  { background: transparent; color: #fff; }
.c-light { background: transparent; color: #111; }

/* ── HEADER ─────────────────────────────────────────────── */
.c-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px 12px; flex-shrink: 0; border-bottom: 1px solid;
}
.c-header-dark  { border-color: #1a1a1a; }
.c-header-light { border-color: #ececec; }
.c-title    { font-size: 14px; font-weight: 600; letter-spacing: -0.02em; }
.c-subtitle { font-size: 11px; margin-top: 1px; }
.c-status-row  { display: flex; align-items: center; gap: 6px; }
.c-status-dot  { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.c-status-label { font-size: 11px; }

/* ── TABS ────────────────────────────────────────────────── */
.c-tabs {
  display: flex; padding: 0 20px; border-bottom: 1px solid; flex-shrink: 0;
}
.c-tabs-dark  { border-color: #1a1a1a; }
.c-tabs-light { border-color: #ececec; }
.c-tab {
  position: relative; padding: 10px 14px; font-size: 11px; font-weight: 500;
  cursor: pointer; border: none; background: none; transition: color .15s; letter-spacing: -0.01em;
}
.c-tab-active-dark        { color: #fff; }
.c-tab-active-light       { color: #111; }
.c-tab-idle-dark          { color: #444; }
.c-tab-idle-dark:hover    { color: #888; }
.c-tab-idle-light         { color: #bbb; }
.c-tab-idle-light:hover   { color: #666; }
.c-tab-line {
  position: absolute; bottom: -1px; left: 14px; right: 14px;
  height: 1px; background: currentColor; border-radius: 1px;
}

/* ── BODY ────────────────────────────────────────────────── */
.c-body { flex: 1; min-height: 0; overflow-y: auto; padding: 20px; }
.c-body::-webkit-scrollbar { width: 3px; }
.c-body::-webkit-scrollbar-track { background: transparent; }
.c-body::-webkit-scrollbar-thumb { background: rgba(100,116,139,.15); border-radius: 2px; }
.c-section { display: flex; flex-direction: column; gap: 10px; }
.c-hint { font-size: 11px; padding-bottom: 2px; }

/* ── CARDS ───────────────────────────────────────────────── */
.c-card       { border-radius: 8px; border: 1px solid; overflow: hidden; }
.c-card-dark  { background: #0d0d0d; border-color: #1a1a1a; }
.c-card-light { background: #fff; border-color: #e8e8e8; box-shadow: 0 1px 3px rgba(0,0,0,.04); }

.c-card-head { padding: 11px 14px; border-bottom: 1px solid; }
.c-head-dark  { border-color: #1a1a1a; background: #0a0a0a; }
.c-head-light { border-color: #f0f0f0; background: #fafafa; }

.c-card-body { padding: 14px; }

/* ── ROWS ────────────────────────────────────────────────── */
.c-row { display: flex; align-items: center; gap: 12px; padding: 14px 16px; }
.c-row-sep-dark  { border-top: 1px solid #1a1a1a; }
.c-row-sep-light { border-top: 1px solid #f0f0f0; }
.c-row-label { font-size: 12px; font-weight: 500; letter-spacing: -0.01em; }
.c-row-desc  { font-size: 11px; margin-top: 1px; line-height: 1.4; }
.c-dot  { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.c-section-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; }

/* ── TOGGLE ──────────────────────────────────────────────── */
.c-toggle {
  position: relative; width: 36px; height: 20px;
  border-radius: 999px; border: none; cursor: pointer;
  transition: background .2s; overflow: hidden; flex-shrink: 0;
}
.c-toggle:disabled { opacity: .4; cursor: default; }
.c-toggle-on-green  { background: #16a34a; }
.c-toggle-on-rose   { background: #dc2626; }
.c-toggle-on-indigo { background: #4f46e5; }
.c-toggle-off-dark  { background: #222; }
.c-toggle-off-light { background: #d4d4d8; }
.c-toggle-knob {
  position: absolute; top: 2px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.2);
  transition: transform .18s;
}
.c-toggle-spin { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }

/* ── TOGGLE INLINE ROW ───────────────────────────────────── */
.c-toggle-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; border-radius: 6px; border: 1px solid;
}

/* ── BADGES ──────────────────────────────────────────────── */
.c-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 7px; border-radius: 4px; border: 1px solid;
  font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em;
  white-space: nowrap;
}
.c-badge-green-dark  { color: #4ade80; background: rgba(74,222,128,.08); border-color: rgba(74,222,128,.2); }
.c-badge-green-light { color: #15803d; background: rgba(21,128,61,.06);  border-color: rgba(21,128,61,.2); }
.c-badge-red         { color: #f87171; background: rgba(248,113,113,.08); border-color: rgba(248,113,113,.2); }
.c-badge-blue        { color: #60a5fa; background: rgba(96,165,250,.08); border-color: rgba(96,165,250,.2); }
.c-badge-neutral-dark  { color: #555; background: #111; border-color: #222; }
.c-badge-neutral-light { color: #999; background: #f5f5f5; border-color: #e5e5e5; }

/* ── RADIO LIST (almacenamiento) ─────────────────────────── */
.c-radio-list { display: flex; flex-direction: column; }
.c-radio-row  {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 6px; border: 1px solid;
  cursor: pointer; transition: border-color .15s; background: transparent;
  margin-bottom: 6px;
}
.c-radio-row-dark:hover  { border-color: #333; }
.c-radio-row-light:hover { border-color: #ccc; }
.c-radio-indicator {
  width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.c-radio-on       { border-color: #111; }
.c-radio-off-dark { border-color: #333; }
.c-radio-off-light { border-color: #ccc; }
.c-radio-dot { width: 6px; height: 6px; border-radius: 50%; background: #111; }
.c-radio-label { font-size: 12px; font-weight: 500; }

/* ── ACCORDION ───────────────────────────────────────────── */
.c-accordion-trigger {
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; background: transparent; border: none; cursor: pointer;
  transition: background .1s;
}
.c-accordion-dark:hover  { background: rgba(255,255,255,.02); }
.c-accordion-light:hover { background: rgba(0,0,0,.02); }

.c-count-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 5px;
  border-radius: 4px; font-size: 9px; font-weight: 700;
}

.c-accordion-body { padding: 0 16px 14px; }
.c-accordion-body-dark  {}
.c-accordion-body-light {}

/* ── INACTIVE MESSAGE ────────────────────────────────────── */
.c-msg-wrap  { padding: 0 14px 10px; }
.c-msg-inner { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 6px; border: 1px solid; }
.c-msg-dark  { background: #0a0a0a; border-color: #1a1a1a; }
.c-msg-light { background: #fafafa; border-color: #ececec; }
.c-msg-input { flex: 1; background: transparent; font-size: 11px; outline: none; border: none; }

/* ── INPUTS ──────────────────────────────────────────────── */
.c-input {
  width: 100%; padding: 7px 10px; border-radius: 6px; border: 1px solid;
  font-size: 12px; outline: none; transition: border-color .15s; font-family: inherit;
}
.c-input-dark  { background: #0a0a0a; border-color: #1e1e1e; color: #ddd; }
.c-input-dark::placeholder  { color: #333; }
.c-input-dark:focus  { border-color: #333; }
.c-input-light { background: #fff; border-color: #e5e5e5; color: #111; }
.c-input-light::placeholder { color: #ccc; }
.c-input-light:focus { border-color: #aaa; }

/* ── FORM GRID ───────────────────────────────────────────── */
.c-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
@media (max-width: 500px) { .c-form-grid { grid-template-columns: 1fr; } }
.c-span2 { grid-column: 1 / -1; }
.c-field  { display: flex; flex-direction: column; gap: 4px; }
.c-label  { font-size: 10px; font-weight: 500; }

/* ── BUTTONS ─────────────────────────────────────────────── */
.c-btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; height: 30px; border-radius: 6px; border: none;
  background: #111; color: #fff; font-size: 11px; font-weight: 500;
  cursor: pointer; transition: all .15s; font-family: inherit; white-space: nowrap;
}
.c-dark .c-btn-primary  { background: #fff; color: #111; }
.c-btn-primary:hover:not(:disabled) { opacity: .85; }
.c-btn-primary:disabled { opacity: .4; cursor: default; }

.c-btn-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; height: 30px; border-radius: 6px; border: 1px solid;
  font-size: 11px; font-weight: 500; cursor: pointer;
  transition: all .15s; background: transparent; font-family: inherit; white-space: nowrap;
}
.c-btn-ghost:disabled { opacity: .4; cursor: default; }
.c-ghost-dark  { border-color: #222; color: #555; }
.c-ghost-dark:hover:not(:disabled)  { border-color: #333; color: #aaa; }
.c-ghost-light { border-color: #e5e5e5; color: #888; }
.c-ghost-light:hover:not(:disabled) { border-color: #ccc; color: #333; }

/* ── INPUT ROW / ACTIONS ─────────────────────────────────── */
.c-input-row { display: flex; gap: 8px; align-items: center; }
.c-actions   { display: flex; gap: 8px; margin-top: 12px; }

/* ── EMAIL ROW ───────────────────────────────────────────── */
.c-email-row { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 6px; border: 1px solid; }
.c-email-dark  { background: #0a0a0a; border-color: #1a1a1a; }
.c-email-light { background: #fafafa; border-color: #ebebeb; }

/* ── TAGS ────────────────────────────────────────────────── */
.c-tag { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 4px; border: 1px solid; font-size: 11px; }
.c-tag-dark  { background: #111; border-color: #222; color: #888; }
.c-tag-light { background: #f5f5f5; border-color: #e5e5e5; color: #444; }

/* ── REMOVE BTN ──────────────────────────────────────────── */
.c-remove-btn { display: flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 3px; border: none; background: transparent; cursor: pointer; opacity: .4; transition: opacity .15s; }
.c-remove-btn:hover { opacity: 1; }

/* ── ALERT / BANNER ──────────────────────────────────────── */
.c-alert {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 8px 12px; border-radius: 6px; border: 1px solid;
  font-size: 11px; font-weight: 500;
}
.c-alert-amber { background: rgba(245,158,11,.05); border-color: rgba(245,158,11,.2); color: #f59e0b; }
.c-code { font-family: monospace; font-size: 10px; background: rgba(245,158,11,.1); padding: 1px 4px; border-radius: 3px; }

.c-banner { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 8px; border: 1px solid; }
.c-banner-green-dark  { background: rgba(22,163,74,.05); border-color: rgba(22,163,74,.15); }
.c-banner-green-light { background: rgba(22,163,74,.04); border-color: rgba(22,163,74,.15); }

/* ── RESULT ──────────────────────────────────────────────── */
.c-result { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; border: 1px solid; font-size: 11px; }
.c-result-ok  { background: rgba(52,211,153,.06); border-color: rgba(52,211,153,.2); color: #34d399; }
.c-result-err { background: rgba(248,113,113,.06); border-color: rgba(248,113,113,.2); color: #f87171; }

/* ── SCHEDULE MODES ──────────────────────────────────────── */
.c-mode-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
@media (max-width: 600px) { .c-mode-grid { grid-template-columns: repeat(2,1fr); } }
.c-mode-btn {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 12px 8px; border-radius: 6px; border: 1px solid; cursor: pointer; transition: all .15s; background: transparent;
}
.c-mode-active-dark  { border-color: #4f46e5; background: rgba(79,70,229,.08); }
.c-mode-active-light { border-color: #818cf8; background: rgba(99,102,241,.06); }
.c-mode-idle-dark    { border-color: #1a1a1a; }
.c-mode-idle-dark:hover  { border-color: #333; }
.c-mode-idle-light   { border-color: #e8e8e8; }
.c-mode-idle-light:hover { border-color: #ccc; }
.c-mode-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }

/* ── CALENDAR ────────────────────────────────────────────── */
.c-cal-nav { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid; }
.c-cal-title { font-size: 12px; font-weight: 600; text-transform: capitalize; letter-spacing: -0.01em; }
.c-cal-btn {
  width: 24px; height: 24px; border-radius: 5px; border: none;
  display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s; background: transparent;
}
.c-cal-btn-dark:hover  { background: #1a1a1a; }
.c-cal-btn-light:hover { background: #f0f0f0; }

/* ── PROXIMAS ────────────────────────────────────────────── */
.c-proximas { padding: 14px; }

/* ── TRANSITIONS ─────────────────────────────────────────── */
.slide-enter-active, .slide-leave-active { transition: all .18s ease; }
.slide-enter-from,   .slide-leave-to     { opacity: 0; transform: translateY(-4px); }

/* ────────────────────────────────────────────────────────────
   KEEP legacy classes used by calendar/schedule subcomponents
──────────────────────────────────────────────────────────── */
.cfg-root {
  height: 100%; display: flex; flex-direction: column;
  font-family: 'Inter', system-ui, sans-serif; overflow: hidden;
}
.cfg-dark  { background: transparent; color: #fff; }
.cfg-light { background: transparent; color: #1e293b; }

/* ── HEADER ───────────────────────────────────────────────── */
.cfg-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px 10px; flex-shrink: 0; border-bottom: 1px solid;
}
.cfg-header-dark  { background: transparent; border-color: rgba(255,255,255,.07); }
.cfg-header-light { background: transparent; border-color: #ececec; }
.cfg-header-left  { display: flex; align-items: center; gap: 9px; }

.cfg-header-icon {
  width: 30px; height: 30px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.cfg-icon-dark  { background: rgba(249,115,22,.12); }
.cfg-icon-light { background: #fff7ed; }

.cfg-title    { font-size: 14px; font-weight: 600; letter-spacing: -0.012em; line-height: 1.15; }
.cfg-subtitle { font-size: 10px; font-weight: 500; margin-top: 2px; opacity: 0.55; }

.cfg-status-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 999px; border: 1px solid;
  font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;
}
.cfg-badge-maintenance { background: rgba(244,63,94,.08); border-color: rgba(244,63,94,.3); color: #fb7185; }
.cfg-badge-ok-dark     { background: rgba(52,211,153,.08); border-color: rgba(52,211,153,.2); color: #34d399; }
.cfg-badge-ok-light    { background: rgba(52,211,153,.08); border-color: #6ee7b7; color: #059669; }
.cfg-status-dot        { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

.cfg-btn-save {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; height: 28px; border-radius: 5px; border: none;
  background: #2563eb; color: #fff;
  font-size: 11px; font-weight: 600;
  cursor: pointer; transition: all .15s;
  font-family: inherit;
}
.cfg-btn-save:hover:not(:disabled) {
  background: #1d4ed8;
  box-shadow: 0 3px 10px -2px rgba(37, 99, 235, 0.35);
}
.cfg-btn-save:disabled { opacity: .5; cursor: default; }

/* ── TABS ─────────────────────────────────────────────────── */
.cfg-tabs {
  display: flex; padding: 0 22px; border-bottom: 1px solid; flex-shrink: 0;
}
.cfg-tabs-dark  { background: transparent; border-color: rgba(255,255,255,.07); }
.cfg-tabs-light { background: transparent; border-color: #ececec; }

.cfg-tab {
  position: relative; display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 16px; font-size: 10px; font-weight: 800;
  text-transform: uppercase; letter-spacing: .08em;
  cursor: pointer; border: none; background: none; transition: color .15s;
}
.cfg-tab-active           { color: #f97316; }
.cfg-tab-idle-dark        { color: rgba(255,255,255,.35); }
.cfg-tab-idle-dark:hover  { color: rgba(255,255,255,.7); }
.cfg-tab-idle-light       { color: #94a3b8; }
.cfg-tab-idle-light:hover { color: #475569; }
.cfg-tab-bar {
  position: absolute; bottom: -1px; left: 16px; right: 16px;
  height: 2px; border-radius: 2px 2px 0 0; background: #f97316;
}

/* ── BODY ─────────────────────────────────────────────────── */
.cfg-body {
  flex: 1; min-height: 0; overflow-y: auto; padding: 18px 22px;
}
.cfg-body::-webkit-scrollbar       { width: 4px; }
.cfg-body::-webkit-scrollbar-track { background: transparent; }
.cfg-body::-webkit-scrollbar-thumb { border-radius: 2px; background: rgba(100,116,139,.2); }
.cfg-body::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,.4); }
.cfg-body { scrollbar-width: thin; scrollbar-color: rgba(100,116,139,.2) transparent; }

.cfg-section      { display: flex; flex-direction: column; gap: 12px; }
.cfg-section-hint { font-size: 10px; padding: 0 2px 2px; }

/* ── CARDS ────────────────────────────────────────────────── */
.cfg-card       { border-radius: 12px; border: 1px solid; overflow: hidden; }
.cfg-card-dark  { background: rgba(255,255,255,.02); border-color: rgba(255,255,255,.07); }
.cfg-card-light { background: #fff; border-color: #e2e8f0; box-shadow: 0 1px 6px rgba(0,0,0,.05); }

.cfg-card-head {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px; border-bottom: 1px solid;
}
.cfg-chead-dark  { border-color: rgba(255,255,255,.06); }
.cfg-chead-light { border-color: #f1f5f9; background: #fafbfc; }

.cfg-card-body { padding: 14px; }

.cfg-card-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
.cfg-card-desc  { font-size: 9.5px; font-weight: 400; margin-top: 2px; }

/* Chip icon en card heads */
.cfg-chip-icon {
  width: 30px; height: 30px; border-radius: 8px; border: 1px solid;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

/* ── TOGGLE ───────────────────────────────────────────────── */
.cfg-toggle {
  position: relative; width: 40px; height: 22px;
  border-radius: 999px; border: none; cursor: pointer; transition: background .2s;
  overflow: hidden;
}
.cfg-toggle:disabled { opacity: .4; cursor: default; }
.cfg-toggle-on-rose   { background: #f43f5e; box-shadow: 0 0 0 3px rgba(244,63,94,.15); }
.cfg-toggle-on-green  { background: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,.15); }
.cfg-toggle-on-indigo { background: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
.cfg-toggle-off-dark  { background: rgba(255,255,255,.12); }
.cfg-toggle-off-light { background: #cbd5e1; }

.cfg-toggle-knob {
  position: absolute; top: 3px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.25);
  transition: transform .2s;
}
.cfg-toggle-spin {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
}

/* ── ESTADO PILLS ─────────────────────────────────────────── */
.cfg-state-pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px; border-radius: 999px; border: 1px solid;
  font-size: 9px; font-weight: 700; text-transform: uppercase;
}
.cfg-pill-rose        { background: rgba(244,63,94,.1);  border-color: rgba(244,63,94,.3);  color: #fb7185; }
.cfg-pill-green-dark  { background: rgba(52,211,153,.08); border-color: rgba(52,211,153,.2); color: #34d399; }
.cfg-pill-green-light { background: rgba(52,211,153,.08); border-color: #6ee7b7;             color: #059669; }

/* ── INFO LABELS ──────────────────────────────────────────── */
.cfg-info-label { font-size: 11px; font-weight: 700; }
.cfg-info-sub   { font-size: 9.5px; margin-top: 2px; }

/* ── ALERTS ───────────────────────────────────────────────── */
.cfg-alert {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 9px 12px; border-radius: 8px; border: 1px solid;
  font-size: 10px; font-weight: 500;
}
.cfg-alert-amber { background: rgba(245,158,11,.06); border-color: rgba(245,158,11,.2); color: #f59e0b; }
.cfg-code {
  font-family: monospace; font-size: 9px;
  background: rgba(245,158,11,.1); padding: 1px 5px; border-radius: 4px;
}

/* ── STORAGE OPTIONS ──────────────────────────────────────── */
.cfg-storage-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
@media (max-width: 500px) { .cfg-storage-grid { grid-template-columns: 1fr; } }

.cfg-storage-opt {
  display: flex; align-items: center; gap: 10px;
  padding: 12px; border-radius: 10px; border: 2px solid; cursor: pointer; transition: all .15s;
}
.cfg-opt-active      { border-color: #f97316; background: rgba(249,115,22,.08); }
.cfg-opt-idle-dark   { border-color: rgba(255,255,255,.08); }
.cfg-opt-idle-dark:hover  { border-color: rgba(255,255,255,.2); }
.cfg-opt-idle-light  { border-color: #e2e8f0; }
.cfg-opt-idle-light:hover { border-color: #cbd5e1; }
.cfg-opt-label { font-size: 11px; font-weight: 700; }
.cfg-opt-desc  { font-size: 9px;  margin-top: 2px; }

/* ── MÓDULOS v2 ───────────────────────────────────────────── */
.cfg-mod-list {
  border-radius: 10px; border: 1px solid; overflow: hidden;
}
.cfg-mod-list-dark  { background: rgba(255,255,255,.02); border-color: rgba(255,255,255,.08); }
.cfg-mod-list-light { background: #fff; border-color: #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,.04); }

.cfg-mod2-row {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; transition: background .1s;
}
.cfg-mod2-row:hover { background: rgba(0,0,0,.02); }

.cfg-mod2-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}

.cfg-mod2-label {
  font-size: 12px; font-weight: 600; letter-spacing: -0.01em;
}
.cfg-mod2-desc {
  font-size: 10px; margin-top: 1px;
}
.cfg-mod2-badge {
  display: inline-flex; align-items: center;
  padding: 2px 8px; border-radius: 999px; border: 1px solid;
  font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
}

/* ── Acordeón Renuncia ─────────────────────────────────────── */
.cfg-renuncia-wrap { border-top: 1px solid; }

.cfg-renuncia-trigger {
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; background: transparent; border: none;
  cursor: pointer; transition: background .1s;
}
.cfg-renuncia-trigger:hover { background: rgba(244,63,94,.04); }
.cfg-renuncia-trigger-dark:hover  { background: rgba(244,63,94,.06); }
.cfg-renuncia-trigger-light:hover { background: rgba(244,63,94,.04); }

.cfg-renuncia-title { font-size: 11px; font-weight: 600; }

.cfg-renuncia-body {
  padding: 0 16px 14px;
}
.cfg-renuncia-body-dark  {}
.cfg-renuncia-body-light {}

.cfg-renuncia-desc  { font-size: 9.5px; }
.cfg-renuncia-tag   {
  display: inline-block; font-weight: 700;
  color: #f43f5e; background: rgba(244,63,94,.1);
  padding: 0 5px; border-radius: 4px;
}
.cfg-renuncia-emails { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.cfg-renuncia-email-row {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 10px; border-radius: 6px; border: 1px solid;
}
.cfg-email-row-dark  { background: rgba(255,255,255,.03); border-color: rgba(255,255,255,.06); }
.cfg-email-row-light { background: #fafafa;               border-color: #e5e7eb; }
.cfg-renuncia-empty  { font-size: 10px; padding: 4px 0 8px; }

/* Legacy (keep for inactive-msg rows) */
.cfg-mod-row {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 14px; transition: background .15s;
}
.cfg-mod-sep-dark  { border-top: 1px solid rgba(255,255,255,.06); }
.cfg-mod-sep-light { border-top: 1px solid #f1f5f9; }
.cfg-mod-label     { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; }
.cfg-mod-state     { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }

.cfg-mod-msg-wrap   { padding: 0 14px 12px; }
.cfg-mod-msg-inner  {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 8px; border: 1px solid;
}
.cfg-mod-msg-dark  { background: rgba(255,255,255,.03); border-color: rgba(255,255,255,.08); }
.cfg-mod-msg-light { background: #f8fafc; border-color: #e8edf4; }
.cfg-mod-msg-input { flex: 1; background: transparent; font-size: 10px; outline: none; border: none; }

/* ── SCHEDULE MODES ───────────────────────────────────────── */
.cfg-mode-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
@media (max-width: 600px) { .cfg-mode-grid { grid-template-columns: repeat(2,1fr); } }

.cfg-mode-opt {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 12px 8px; border-radius: 10px; border: 2px solid; cursor: pointer; transition: all .15s;
}
.cfg-mode-active      { border-color: #6366f1; background: rgba(99,102,241,.1); }
.cfg-mode-idle-dark   { border-color: rgba(255,255,255,.08); }
.cfg-mode-idle-dark:hover  { border-color: rgba(255,255,255,.2); }
.cfg-mode-idle-light  { border-color: #e2e8f0; }
.cfg-mode-idle-light:hover { border-color: #a5b4fc; }
.cfg-mode-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
.cfg-mode-desc  { font-size: 8px; text-align: center; line-height: 1.3; }

/* ── CALENDAR ─────────────────────────────────────────────── */
.cfg-cal-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 14px; border-bottom: 1px solid;
}
.cfg-cal-title { font-size: 11px; font-weight: 800; text-transform: capitalize; letter-spacing: .04em; }
.cfg-cal-nav-btn {
  width: 26px; height: 26px; border-radius: 7px; border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background .15s; background: transparent;
}
.cfg-cal-nav-dark:hover  { background: rgba(255,255,255,.1); color: #fff; }
.cfg-cal-nav-dark        { color: rgba(255,255,255,.5); }
.cfg-cal-nav-light:hover { background: #e2e8f0; color: #475569; }
.cfg-cal-nav-light       { color: #94a3b8; }

.cfg-cal-head-row { display: grid; grid-template-columns: repeat(7,1fr); margin-bottom: 6px; }
.cfg-cal-head-cell { text-align: center; font-size: 8.5px; font-weight: 900; text-transform: uppercase; letter-spacing: .12em; padding: 4px 0; }

.cfg-cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; }
.cfg-cal-day {
  width: 100%; aspect-ratio: 1; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; cursor: pointer; border: none;
  background: transparent; transition: all .12s;
}
.cfg-cal-day-active        { background: #6366f1; color: #fff; box-shadow: 0 2px 8px rgba(99,102,241,.3); }
.cfg-cal-day-idle-dark     { color: rgba(255,255,255,.6); }
.cfg-cal-day-idle-dark:hover  { background: rgba(255,255,255,.08); color: #fff; }
.cfg-cal-day-idle-light    { color: #475569; }
.cfg-cal-day-idle-light:hover { background: #ede9fe; color: #4f46e5; }
.cfg-cal-day-past-dark     { color: rgba(255,255,255,.15); cursor: not-allowed; }
.cfg-cal-day-past-light    { color: #cbd5e1; cursor: not-allowed; }

/* ── WEEKLY ───────────────────────────────────────────────── */
.cfg-week-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 6px; margin-bottom: 10px; }
.cfg-day-btn {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 8px 4px; border-radius: 9px; border: 2px solid; cursor: pointer; transition: all .12s;
  background: transparent;
}
.cfg-day-active      { border-color: #6366f1; background: rgba(99,102,241,.1); }
.cfg-day-idle-dark   { border-color: rgba(255,255,255,.08); }
.cfg-day-idle-dark:hover  { border-color: rgba(99,102,241,.4); }
.cfg-day-idle-light  { border-color: #e2e8f0; }
.cfg-day-idle-light:hover { border-color: #a5b4fc; }
.cfg-day-short  { font-size: 7.5px; font-weight: 900; text-transform: uppercase; letter-spacing: .1em; }
.cfg-day-num    { font-size: 13px; font-weight: 900; line-height: 1; }
.cfg-day-month  { font-size: 7px; font-weight: 600; text-transform: uppercase; }
.cfg-today-pill { font-size: 7px; font-weight: 900; padding: 1px 4px; border-radius: 999px; background: rgba(99,102,241,.2); color: #818cf8; }

/* ── SCHEDULE HELPERS ─────────────────────────────────────── */
.cfg-schedule-summary        { font-size: 10px; margin-top: 10px; }
.cfg-schedule-summary-center { text-align: center; opacity: .6; }

.cfg-specific-chips {
  display: flex; flex-wrap: wrap; gap: 6px;
  margin-top: 12px; padding-top: 12px; border-top: 1px solid;
}

.cfg-info-banner {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px; border-radius: 12px;
}
.cfg-banner-green-dark  { background: rgba(52,211,153,.05); }
.cfg-banner-green-light { background: rgba(52,211,153,.06); }
.cfg-banner-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }
.cfg-banner-desc  { font-size: 9.5px; margin-top: 3px; line-height: 1.5; }

.cfg-proximas        { border: none !important; }
.cfg-proximas-dark   { background: rgba(99,102,241,.06); border: 1px solid rgba(99,102,241,.15) !important; }
.cfg-proximas-light  { background: #eef2ff;               border: 1px solid #c7d2fe !important; }
.cfg-proximas-title  { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 10px; padding: 12px 14px 0; }
.cfg-proximas-chips  { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 14px 14px; }

/* ── CHIPS ────────────────────────────────────────────────── */
.cfg-specific-chip, .cfg-proxima-chip, .cfg-dest-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px; border-radius: 8px; border: 1px solid;
  font-size: 9px; font-weight: 600;
}
.cfg-chip-indigo-dark  { background: rgba(99,102,241,.12); border-color: rgba(99,102,241,.25); color: #a5b4fc; }
.cfg-chip-indigo-light { background: #ede9fe; border-color: #a5b4fc; color: #4f46e5; }
.cfg-proxima-chip-light { background: #fff; border-color: #c7d2fe; color: #4f46e5; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
.cfg-chip-violet-dark  { background: rgba(139,92,246,.1);  border-color: rgba(139,92,246,.25); color: #c4b5fd; }
.cfg-chip-violet-light { background: #f5f3ff; border-color: #c4b5fd; color: #7c3aed; }
.cfg-chip-remove {
  background: none; border: none; cursor: pointer; opacity: .5; padding: 0;
  transition: opacity .15s; margin-left: 2px;
}
.cfg-chip-remove:hover { opacity: 1; }

/* ── FORM ─────────────────────────────────────────────────── */
.cfg-form-grid2 {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;
}
@media (max-width: 520px) { .cfg-form-grid2 { grid-template-columns: 1fr; } }
.cfg-span2 { grid-column: span 2; }
@media (max-width: 520px) { .cfg-span2 { grid-column: span 1; } }

.cfg-field { display: flex; flex-direction: column; gap: 4px; }
.cfg-label {
  font-size: 8.5px; font-weight: 900;
  text-transform: uppercase; letter-spacing: .12em;
}
.cfg-pass-hint { font-size: 8.5px; font-weight: 400; text-transform: none; color: #34d399; margin-left: 4px; }

.cfg-input {
  padding: 7px 10px; border-radius: 8px; border: 1px solid;
  font-size: 11px; font-weight: 500; outline: none; transition: border-color .15s; width: 100%;
}
.cfg-input-dark  { background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.1); color: #fff; }
.cfg-input-dark::placeholder { color: rgba(255,255,255,.2); }
.cfg-input-dark:focus  { border-color: rgba(249,115,22,.5); }
.cfg-input-light { background: #f8fafc; border-color: #e2e8f0; color: #1e293b; }
.cfg-input-light::placeholder { color: #94a3b8; }
.cfg-input-light:focus { border-color: rgba(249,115,22,.6); }

.cfg-toggle-field {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; border-radius: 8px; border: 1px solid;
}
.cfg-toggle-field-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }

.cfg-smtp-actions { display: flex; gap: 8px; }

/* ── BUTTONS ──────────────────────────────────────────────── */
.cfg-btn-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 8px; border: 1px solid;
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;
  cursor: pointer; transition: all .15s; background: transparent;
}
.cfg-btn-ghost:disabled { opacity: .4; cursor: default; }
.cfg-ghost-dark  { border-color: rgba(255,255,255,.12); color: #94a3b8; }
.cfg-ghost-dark:hover:not(:disabled)  { color: #fff; background: rgba(255,255,255,.06); }
.cfg-ghost-light { border-color: #e2e8f0; color: #64748b; }
.cfg-ghost-light:hover:not(:disabled) { border-color: #cbd5e1; color: #1e293b; }

.cfg-btn-blue, .cfg-btn-violet, .cfg-btn-emerald {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 8px; border: none;
  font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em;
  cursor: pointer; transition: all .15s; color: #fff;
}
.cfg-btn-blue:disabled, .cfg-btn-violet:disabled, .cfg-btn-emerald:disabled { opacity: .4; cursor: default; }
.cfg-btn-blue    { background: #3b82f6; }
.cfg-btn-blue:hover:not(:disabled)    { background: #2563eb; }
.cfg-btn-violet  { background: #8b5cf6; }
.cfg-btn-violet:hover:not(:disabled)  { background: #7c3aed; }
.cfg-btn-emerald { background: #10b981; }
.cfg-btn-emerald:hover:not(:disabled) { background: #059669; }

/* ── DESTINATARIOS ────────────────────────────────────────── */
.cfg-dest-chips     { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.cfg-dest-input-row { display: flex; gap: 8px; align-items: center; }
.cfg-empty-hint     { font-size: 10px; text-align: center; padding: 8px 0 10px; }

/* ── SMTP DOT ─────────────────────────────────────────────── */
.cfg-smtp-dot   { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.cfg-smtp-state { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }

/* ── RESULT BANNERS ───────────────────────────────────────── */
.cfg-result-banner {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 8px; border: 1px solid;
  font-size: 10px; font-weight: 700;
}
.cfg-result-ok  { background: rgba(52,211,153,.08); border-color: rgba(52,211,153,.25); color: #34d399; }
.cfg-result-err { background: rgba(244,63,94,.08);  border-color: rgba(244,63,94,.25);  color: #fb7185; }

/* ── TRANSITIONS ──────────────────────────────────────────── */
.slide-enter-active, .slide-leave-active { transition: all .2s ease; }
.slide-enter-from,   .slide-leave-to     { opacity: 0; transform: translateY(-6px); }
</style>
