<template>
  <div class="cfg-root" :class="isDark ? 'cfg-dark' : 'cfg-light'">

    <!-- ══ HEADER ═══════════════════════════════════════════════════════════ -->
    <div class="cfg-header" :class="isDark ? 'cfg-header-dark' : 'cfg-header-light'">
      <div class="cfg-header-left">
        <div class="cfg-header-icon" :class="isDark ? 'cfg-icon-dark' : 'cfg-icon-light'">
          <i class="fas fa-sliders text-[13px] text-orange-400"></i>
        </div>
        <div>
          <h2 class="cfg-title" :class="isDark ? 'text-white' : 'text-slate-800'">
            Configuración del Sistema
          </h2>
          <p class="cfg-subtitle" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            Versión {{ appVersion }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Badge estado sistema -->
        <div class="cfg-status-badge"
          :class="mantenimiento.enabled
            ? 'cfg-badge-maintenance'
            : (isDark ? 'cfg-badge-ok-dark' : 'cfg-badge-ok-light')">
          <span class="cfg-status-dot"
            :class="mantenimiento.enabled ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'"></span>
          {{ mantenimiento.enabled ? 'En mantenimiento' : 'Sistema operativo' }}
        </div>

        <!-- Guardar -->
        <button @click="guardar" :disabled="saving" class="cfg-btn-save">
          <i class="text-[9px]" :class="saving ? 'fas fa-circle-notch fa-spin' : 'fas fa-floppy-disk'"></i>
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </div>
    </div>

    <!-- ══ TABS ══════════════════════════════════════════════════════════════ -->
    <div class="cfg-tabs" :class="isDark ? 'cfg-tabs-dark' : 'cfg-tabs-light'">
      <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id"
        class="cfg-tab"
        :class="activeTab === t.id
          ? 'cfg-tab-active'
          : (isDark ? 'cfg-tab-idle-dark' : 'cfg-tab-idle-light')">
        <i :class="t.icon" class="text-[9px]"></i>
        {{ t.label }}
        <span v-if="activeTab === t.id" class="cfg-tab-bar"></span>
      </button>
    </div>

    <!-- ══ BODY ══════════════════════════════════════════════════════════════ -->
    <div class="cfg-body">

      <!-- ─── TAB SISTEMA ──────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'sistema'" class="cfg-section">

        <!-- Mantenimiento IIS -->
        <div class="cfg-card" :class="isDark ? 'cfg-card-dark' : 'cfg-card-light'">
          <div class="cfg-card-head" :class="isDark ? 'cfg-chead-dark' : 'cfg-chead-light'">
            <div class="cfg-chip-icon"
              :class="mantenimiento.enabled
                ? 'bg-rose-500/15 border-rose-500/20'
                : (isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200')">
              <i class="fas fa-hard-hat text-[10px]"
                :class="mantenimiento.enabled ? 'text-rose-400' : (isDark ? 'text-white/40' : 'text-slate-500')"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="cfg-card-title" :class="isDark ? 'text-white' : 'text-slate-800'">Modo mantenimiento IIS</p>
              <p class="cfg-card-desc" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Redirige a los usuarios a una página de mantenimiento</p>
            </div>
            <button @click="toggleMantenimiento" :disabled="mantenimiento.saving || !mantenimiento.configured"
              class="cfg-toggle shrink-0"
              :class="mantenimiento.enabled ? 'cfg-toggle-on-rose' : (isDark ? 'cfg-toggle-off-dark' : 'cfg-toggle-off-light')">
              <span v-if="mantenimiento.saving" class="cfg-toggle-spin">
                <i class="fas fa-spinner fa-spin text-white text-[8px]"></i>
              </span>
              <span v-else class="cfg-toggle-knob"
                :class="mantenimiento.enabled ? 'translate-x-[22px]' : 'translate-x-0.5'"></span>
            </button>
          </div>

          <div class="cfg-card-body">
            <div v-if="!mantenimiento.configured" class="cfg-alert cfg-alert-amber">
              <i class="fas fa-triangle-exclamation text-amber-400 text-[10px] shrink-0"></i>
              <span>La variable <code class="cfg-code">WEBCONFIG_PATH</code> no está configurada en el servidor.</span>
            </div>
            <div v-else class="flex items-center justify-between gap-3">
              <div>
                <p class="cfg-info-label"
                  :class="mantenimiento.enabled ? 'text-rose-400' : (isDark ? 'text-emerald-400' : 'text-emerald-600')">
                  {{ mantenimiento.enabled ? 'Sitio en mantenimiento' : 'Sitio operativo' }}
                </p>
                <p class="cfg-info-sub" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                  {{ mantenimiento.enabled
                    ? 'Los usuarios son redirigidos a mantenimiento.html'
                    : 'Todos los usuarios acceden normalmente' }}
                </p>
              </div>
              <span class="cfg-state-pill"
                :class="mantenimiento.enabled
                  ? 'cfg-pill-rose'
                  : (isDark ? 'cfg-pill-green-dark' : 'cfg-pill-green-light')">
                <i :class="mantenimiento.enabled ? 'fas fa-lock' : 'fas fa-check-circle'" class="text-[8px]"></i>
                {{ mantenimiento.enabled ? 'Activo' : 'Normal' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Almacenamiento -->
        <div class="cfg-card" :class="isDark ? 'cfg-card-dark' : 'cfg-card-light'">
          <div class="cfg-card-head" :class="isDark ? 'cfg-chead-dark' : 'cfg-chead-light'">
            <div class="cfg-chip-icon" :class="isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'">
              <i class="fas fa-database text-[10px]" :class="isDark ? 'text-white/40' : 'text-slate-500'"></i>
            </div>
            <div>
              <p class="cfg-card-title" :class="isDark ? 'text-white' : 'text-slate-800'">Almacenamiento de soportes</p>
              <p class="cfg-card-desc" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Dónde se guardan los archivos adjuntos del sistema</p>
            </div>
          </div>
          <div class="cfg-card-body">
            <div class="cfg-storage-grid">
              <button v-for="opt in storageOpts" :key="opt.v" @click="config.storage_mode = opt.v"
                class="cfg-storage-opt"
                :class="config.storage_mode === opt.v
                  ? 'cfg-opt-active'
                  : (isDark ? 'cfg-opt-idle-dark' : 'cfg-opt-idle-light')">
                <i :class="[opt.icon, 'text-lg']"
                  :style="config.storage_mode === opt.v ? 'color:#f97316' : ''"></i>
                <div class="text-left flex-1 min-w-0">
                  <p class="cfg-opt-label"
                    :class="config.storage_mode === opt.v ? 'text-orange-400' : (isDark ? 'text-white/80' : 'text-slate-700')">
                    {{ opt.label }}
                  </p>
                  <p class="cfg-opt-desc" :class="isDark ? 'text-slate-500' : 'text-slate-400'">{{ opt.desc }}</p>
                </div>
                <i v-if="config.storage_mode === opt.v" class="fas fa-circle-check text-orange-400 text-[11px] shrink-0"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── TAB MÓDULOS ──────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'modulos'" class="cfg-section">
        <p class="cfg-section-hint" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
          Los módulos inactivos muestran un mensaje de mantenimiento a los usuarios en lugar del contenido.
        </p>

        <div class="cfg-card" :class="isDark ? 'cfg-card-dark' : 'cfg-card-light'">
          <div v-for="(mod, idx) in modulos" :key="mod.key">
            <div class="cfg-mod-row" :class="[
              idx > 0 ? (isDark ? 'cfg-mod-sep-dark' : 'cfg-mod-sep-light') : '',
              !isActive(mod.key) ? (isDark ? 'bg-rose-950/20' : 'bg-rose-50/60') : '',
            ]">
              <div class="cfg-chip-icon"
                :class="isActive(mod.key)
                  ? (isDark ? 'bg-emerald-500/12 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')
                  : (isDark ? 'bg-rose-500/12 border-rose-500/20' : 'bg-rose-50 border-rose-200')">
                <i :class="[mod.icon, 'text-[10px]', isActive(mod.key)
                    ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
                    : (isDark ? 'text-rose-400' : 'text-rose-500')]"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="cfg-mod-label" :class="isDark ? 'text-white' : 'text-slate-800'">{{ mod.label }}</p>
                <p class="cfg-card-desc" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ mod.desc }}</p>
              </div>
              <div class="flex items-center gap-2.5 shrink-0">
                <span class="cfg-mod-state"
                  :class="isActive(mod.key) ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 'text-rose-400'">
                  {{ isActive(mod.key) ? 'Activo' : 'Inactivo' }}
                </span>
                <button @click="toggleModulo(mod.key)"
                  class="cfg-toggle"
                  :class="isActive(mod.key) ? 'cfg-toggle-on-green' : (isDark ? 'cfg-toggle-off-dark' : 'cfg-toggle-off-light')">
                  <span class="cfg-toggle-knob"
                    :class="isActive(mod.key) ? 'translate-x-[22px]' : 'translate-x-0.5'"></span>
                </button>
              </div>
            </div>

            <Transition name="slide">
              <div v-if="!isActive(mod.key)" class="cfg-mod-msg-wrap" :class="isDark ? 'cfg-mod-sep-dark' : 'cfg-mod-sep-light'">
                <div class="cfg-mod-msg-inner" :class="isDark ? 'cfg-mod-msg-dark' : 'cfg-mod-msg-light'">
                  <i class="fas fa-message text-[9px] shrink-0" :class="isDark ? 'text-white/25' : 'text-slate-400'"></i>
                  <input v-model="config[mod.key + '_message']" type="text"
                    placeholder="Mensaje que verán los usuarios…"
                    class="cfg-mod-msg-input"
                    :class="isDark ? 'text-white placeholder-white/20' : 'text-slate-700 placeholder-slate-400'" />
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- ─── TAB PROGRAMACIÓN ─────────────────────────────────────────────── -->
      <div v-if="activeTab === 'schedule'" class="cfg-section">

        <!-- Control habilitado -->
        <div class="cfg-card" :class="isDark ? 'cfg-card-dark' : 'cfg-card-light'">
          <div class="cfg-card-head" :class="isDark ? 'cfg-chead-dark' : 'cfg-chead-light'">
            <div class="cfg-chip-icon bg-indigo-500/12 border-indigo-500/20">
              <i class="fas fa-calendar-check text-indigo-500 text-[10px]"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="cfg-card-title" :class="isDark ? 'text-white' : 'text-slate-800'">Control de fechas de cargue</p>
              <p class="cfg-card-desc" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                {{ config.mallas_schedule_enabled === 'true'
                  ? 'Activo — el cargue solo está disponible en los días configurados'
                  : 'Inactivo — el botón de cargue siempre está disponible' }}
              </p>
            </div>
            <button
              @click="config.mallas_schedule_enabled = config.mallas_schedule_enabled === 'true' ? 'false' : 'true'"
              class="cfg-toggle shrink-0"
              :class="config.mallas_schedule_enabled === 'true' ? 'cfg-toggle-on-indigo' : (isDark ? 'cfg-toggle-off-dark' : 'cfg-toggle-off-light')">
              <span class="cfg-toggle-knob"
                :class="config.mallas_schedule_enabled === 'true' ? 'translate-x-[22px]' : 'translate-x-0.5'"></span>
            </button>
          </div>
        </div>

        <!-- Modo libre -->
        <div v-if="config.mallas_schedule_enabled !== 'true'"
          class="cfg-info-banner" :class="isDark ? 'cfg-banner-green-dark' : 'cfg-banner-green-light'">
          <i class="fas fa-unlock text-emerald-500 text-base shrink-0"></i>
          <div>
            <p class="cfg-banner-title" :class="isDark ? 'text-emerald-400' : 'text-emerald-700'">Cargue siempre disponible</p>
            <p class="cfg-banner-desc" :class="isDark ? 'text-emerald-500/60' : 'text-emerald-600/70'">
              Los usuarios pueden cargar mallas en cualquier momento. Activa el control para programar ventanas.
            </p>
          </div>
        </div>

        <template v-if="config.mallas_schedule_enabled === 'true'">

          <!-- Selector de modo -->
          <div class="cfg-card" :class="isDark ? 'cfg-card-dark' : 'cfg-card-light'">
            <div class="cfg-card-head" :class="isDark ? 'cfg-chead-dark' : 'cfg-chead-light'">
              <i class="fas fa-sliders text-[9px] text-orange-400"></i>
              <span class="cfg-card-title" :class="isDark ? 'text-white' : 'text-slate-700'">Modo de programación</span>
            </div>
            <div class="cfg-card-body">
              <div class="cfg-mode-grid">
                <button v-for="m in SCHEDULE_MODES" :key="m.value" @click="config.mallas_schedule_mode = m.value"
                  class="cfg-mode-opt"
                  :class="config.mallas_schedule_mode === m.value
                    ? 'cfg-mode-active'
                    : (isDark ? 'cfg-mode-idle-dark' : 'cfg-mode-idle-light')">
                  <i :class="[m.icon, 'text-xl', config.mallas_schedule_mode === m.value ? 'text-indigo-400' : (isDark ? 'text-white/25' : 'text-slate-400')]"></i>
                  <p class="cfg-mode-label"
                    :class="config.mallas_schedule_mode === m.value ? 'text-indigo-400' : (isDark ? 'text-white/70' : 'text-slate-600')">
                    {{ m.label }}
                  </p>
                  <p class="cfg-mode-desc" :class="isDark ? 'text-white/25' : 'text-slate-400'">{{ m.desc }}</p>
                </button>
              </div>
            </div>
          </div>

          <!-- SEMANAL -->
          <div v-if="config.mallas_schedule_mode === 'weekly'"
            class="cfg-card" :class="isDark ? 'cfg-card-dark' : 'cfg-card-light'">
            <div class="cfg-card-head" :class="isDark ? 'cfg-chead-dark' : 'cfg-chead-light'">
              <i class="fas fa-calendar-week text-[9px] text-indigo-400"></i>
              <span class="cfg-card-title" :class="isDark ? 'text-white' : 'text-slate-700'">Días de la semana habilitados</span>
            </div>
            <div class="cfg-card-body">
              <div class="cfg-week-grid">
                <button v-for="d in diasSemanaFull" :key="d.v"
                  @click="toggleScheduleDay('weekly', d.v)"
                  class="cfg-day-btn"
                  :class="scheduleWeeklyDays.includes(d.v)
                    ? 'cfg-day-active'
                    : (isDark ? 'cfg-day-idle-dark' : 'cfg-day-idle-light')">
                  <span class="cfg-day-short"
                    :class="scheduleWeeklyDays.includes(d.v) ? 'text-indigo-400' : (isDark ? 'text-white/35' : 'text-slate-400')">
                    {{ d.short }}
                  </span>
                  <span class="cfg-day-num"
                    :class="scheduleWeeklyDays.includes(d.v) ? 'text-indigo-400' : (isDark ? 'text-white/70' : 'text-slate-700')">
                    {{ d.nextDate }}
                  </span>
                  <span class="cfg-day-month" :class="isDark ? 'text-white/25' : 'text-slate-400'">{{ d.nextMonth }}</span>
                  <span v-if="d.isToday" class="cfg-today-pill">Hoy</span>
                </button>
              </div>
              <p v-if="scheduleWeeklyDays.length" class="cfg-schedule-summary" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                Habilitado cada {{ diasSemanaFull.filter(d => scheduleWeeklyDays.includes(d.v)).map(d => d.full).join(', ') }}
              </p>
            </div>
          </div>

          <!-- MENSUAL -->
          <div v-if="config.mallas_schedule_mode === 'monthly'"
            class="cfg-card" :class="isDark ? 'cfg-card-dark' : 'cfg-card-light'">
            <div class="cfg-cal-nav" :class="isDark ? 'cfg-chead-dark' : 'cfg-chead-light'">
              <button @click="prevMonth" class="cfg-cal-nav-btn" :class="isDark ? 'cfg-cal-nav-dark' : 'cfg-cal-nav-light'">
                <i class="fas fa-chevron-left text-[9px]"></i>
              </button>
              <p class="cfg-cal-title" :class="isDark ? 'text-white' : 'text-slate-700'">{{ monthName }} {{ calYear }}</p>
              <button @click="nextMonth" class="cfg-cal-nav-btn" :class="isDark ? 'cfg-cal-nav-dark' : 'cfg-cal-nav-light'">
                <i class="fas fa-chevron-right text-[9px]"></i>
              </button>
            </div>
            <div class="cfg-card-body">
              <div class="cfg-cal-head-row">
                <div v-for="h in ['Lu','Ma','Mi','Ju','Vi','Sá','Do']" :key="h" class="cfg-cal-head-cell"
                  :class="isDark ? 'text-white/30' : 'text-slate-400'">{{ h }}</div>
              </div>
              <div class="cfg-cal-grid">
                <div v-for="(cell, idx) in calendarGrid" :key="idx">
                  <button v-if="cell" @click="toggleScheduleDay('monthly', cell)"
                    class="cfg-cal-day"
                    :class="scheduleMonthlyDays.includes(cell)
                      ? 'cfg-cal-day-active'
                      : (isDark ? 'cfg-cal-day-idle-dark' : 'cfg-cal-day-idle-light')">
                    {{ cell }}
                  </button>
                  <div v-else class="cfg-cal-day"></div>
                </div>
              </div>
              <p v-if="scheduleMonthlyDays.length" class="cfg-schedule-summary cfg-schedule-summary-center"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                Habilitado el día {{ scheduleMonthlyDays.join(', ') }} de cada mes
              </p>
            </div>
          </div>

          <!-- FECHAS EXACTAS -->
          <div v-if="config.mallas_schedule_mode === 'specific'"
            class="cfg-card" :class="isDark ? 'cfg-card-dark' : 'cfg-card-light'">
            <div class="cfg-cal-nav" :class="isDark ? 'cfg-chead-dark' : 'cfg-chead-light'">
              <button @click="prevMonth" class="cfg-cal-nav-btn" :class="isDark ? 'cfg-cal-nav-dark' : 'cfg-cal-nav-light'">
                <i class="fas fa-chevron-left text-[9px]"></i>
              </button>
              <p class="cfg-cal-title" :class="isDark ? 'text-white' : 'text-slate-700'">{{ monthName }} {{ calYear }}</p>
              <button @click="nextMonth" class="cfg-cal-nav-btn" :class="isDark ? 'cfg-cal-nav-dark' : 'cfg-cal-nav-light'">
                <i class="fas fa-chevron-right text-[9px]"></i>
              </button>
            </div>
            <div class="cfg-card-body">
              <div class="cfg-cal-head-row">
                <div v-for="h in ['Lu','Ma','Mi','Ju','Vi','Sá','Do']" :key="h" class="cfg-cal-head-cell"
                  :class="isDark ? 'text-white/30' : 'text-slate-400'">{{ h }}</div>
              </div>
              <div class="cfg-cal-grid">
                <div v-for="(cell, idx) in calendarGrid" :key="idx">
                  <button v-if="cell"
                    @click="!isPastDate(calYear, calMonth, cell) && toggleSpecificDate(calYear, calMonth, cell)"
                    class="cfg-cal-day"
                    :class="isSpecificDateSelected(calYear, calMonth, cell)
                      ? 'cfg-cal-day-active'
                      : isPastDate(calYear, calMonth, cell)
                        ? (isDark ? 'cfg-cal-day-past-dark' : 'cfg-cal-day-past-light')
                        : (isDark ? 'cfg-cal-day-idle-dark' : 'cfg-cal-day-idle-light')">
                    {{ cell }}
                  </button>
                  <div v-else class="cfg-cal-day"></div>
                </div>
              </div>

              <!-- Chips fechas seleccionadas -->
              <div v-if="scheduleSpecificDates.length" class="cfg-specific-chips" :class="isDark ? 'border-white/8' : 'border-slate-100'">
                <span v-for="d in scheduleSpecificDates" :key="d" class="cfg-specific-chip"
                  :class="isDark ? 'cfg-chip-indigo-dark' : 'cfg-chip-indigo-light'">
                  {{ formatSpecificDate(d) }}
                  <button @click="removeSpecificDate(d)" class="cfg-chip-remove">
                    <i class="fas fa-times text-[8px]"></i>
                  </button>
                </span>
              </div>
              <p v-else class="cfg-schedule-summary cfg-schedule-summary-center" :class="isDark ? 'text-white/30' : 'text-slate-400'">
                Haz clic en los días para seleccionar fechas exactas
              </p>
            </div>
          </div>

          <!-- Próximas fechas -->
          <div v-if="proximasFechas.length" class="cfg-card cfg-proximas" :class="isDark ? 'cfg-proximas-dark' : 'cfg-proximas-light'">
            <p class="cfg-proximas-title" :class="isDark ? 'text-indigo-400' : 'text-indigo-600'">
              <i class="fas fa-calendar-circle-user mr-1.5"></i>Próximas ventanas habilitadas
            </p>
            <div class="cfg-proximas-chips">
              <span v-for="f in proximasFechas" :key="f" class="cfg-proxima-chip"
                :class="isDark ? 'cfg-chip-indigo-dark' : 'cfg-proxima-chip-light'">
                {{ f }}
              </span>
            </div>
          </div>

          <div v-else-if="config.mallas_schedule_mode !== 'free'"
            class="cfg-alert cfg-alert-amber">
            <i class="fas fa-triangle-exclamation text-amber-400 text-[10px] shrink-0"></i>
            <span>No hay fechas habilitadas configuradas aún.</span>
          </div>

        </template>
      </div>

      <!-- ─── TAB CORREO ───────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'correo'" class="cfg-section">

        <!-- SMTP -->
        <div class="cfg-card" :class="isDark ? 'cfg-card-dark' : 'cfg-card-light'">
          <div class="cfg-card-head" :class="isDark ? 'cfg-chead-dark' : 'cfg-chead-light'">
            <div class="cfg-chip-icon bg-blue-500/12 border-blue-500/20">
              <i class="fas fa-gear text-blue-400 text-[10px]"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="cfg-card-title" :class="isDark ? 'text-white' : 'text-slate-800'">Configuración SMTP</p>
              <p class="cfg-card-desc" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Outlook / Office 365 — smtp.office365.com:587</p>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="cfg-smtp-dot" :class="correo.form.habilitado ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'"></span>
              <span class="cfg-smtp-state" :class="correo.form.habilitado ? 'text-emerald-400' : (isDark ? 'text-slate-500' : 'text-slate-400')">
                {{ correo.form.habilitado ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>

          <div class="cfg-card-body">
            <div class="cfg-form-grid2">
              <div class="cfg-field">
                <label class="cfg-label" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Host SMTP *</label>
                <input v-model="correo.form.host" type="text" placeholder="smtp.office365.com"
                  class="cfg-input" :class="isDark ? 'cfg-input-dark' : 'cfg-input-light'" />
              </div>
              <div class="cfg-field">
                <label class="cfg-label" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Puerto</label>
                <input v-model="correo.form.port" type="text" placeholder="587"
                  class="cfg-input" :class="isDark ? 'cfg-input-dark' : 'cfg-input-light'" />
              </div>
              <div class="cfg-field cfg-span2">
                <label class="cfg-label" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Correo Outlook (usuario SMTP) *</label>
                <input v-model="correo.form.user" type="email" placeholder="notificaciones@miempresa.com"
                  class="cfg-input" :class="isDark ? 'cfg-input-dark' : 'cfg-input-light'" />
              </div>
              <div class="cfg-field cfg-span2">
                <label class="cfg-label" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                  Contraseña de aplicación *
                  <span v-if="correo.config.passConfigurado" class="cfg-pass-hint">
                    (configurada — dejar vacío para no cambiar)
                  </span>
                </label>
                <input v-model="correo.form.pass" type="password" placeholder="••••••••"
                  class="cfg-input" :class="isDark ? 'cfg-input-dark' : 'cfg-input-light'" />
              </div>
              <div class="cfg-field">
                <label class="cfg-label" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Nombre del remitente</label>
                <input v-model="correo.form.fromNombre" type="text" placeholder="WodenTrack RRHH"
                  class="cfg-input" :class="isDark ? 'cfg-input-dark' : 'cfg-input-light'" />
              </div>
              <div class="cfg-field">
                <label class="cfg-label" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Envío de correos</label>
                <div class="cfg-toggle-field"
                  :class="correo.form.habilitado
                    ? (isDark ? 'border-emerald-500/30 bg-emerald-500/8' : 'border-emerald-200 bg-emerald-50')
                    : (isDark ? 'border-white/10' : 'border-slate-200')">
                  <p class="cfg-toggle-field-label"
                    :class="correo.form.habilitado ? 'text-emerald-500' : (isDark ? 'text-white/50' : 'text-slate-500')">
                    {{ correo.form.habilitado ? 'Habilitado' : 'Deshabilitado' }}
                  </p>
                  <button @click="correo.form.habilitado = !correo.form.habilitado"
                    class="cfg-toggle shrink-0"
                    :class="correo.form.habilitado ? 'cfg-toggle-on-green' : (isDark ? 'cfg-toggle-off-dark' : 'cfg-toggle-off-light')">
                    <span class="cfg-toggle-knob"
                      :class="correo.form.habilitado ? 'translate-x-[22px]' : 'translate-x-0.5'"></span>
                  </button>
                </div>
              </div>
            </div>

            <div class="cfg-smtp-actions">
              <button @click="testConexion" :disabled="correo.testeando"
                class="cfg-btn-ghost" :class="isDark ? 'cfg-ghost-dark' : 'cfg-ghost-light'">
                <i class="fas text-[9px]" :class="correo.testeando ? 'fa-circle-notch fa-spin' : 'fa-plug'"></i>
                Probar conexión
              </button>
              <button @click="guardarConfigCorreo" :disabled="correo.guardando" class="cfg-btn-blue">
                <i class="fas text-[9px]" :class="correo.guardando ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'"></i>
                Guardar SMTP
              </button>
            </div>

            <div v-if="correo.testResult" class="cfg-result-banner mt-3"
              :class="correo.testResult.ok ? 'cfg-result-ok' : 'cfg-result-err'">
              <i :class="correo.testResult.ok ? 'fas fa-check' : 'fas fa-xmark'" class="text-[9px]"></i>
              {{ correo.testResult.mensaje }}
            </div>
          </div>
        </div>

        <!-- Destinatarios -->
        <div class="cfg-card" :class="isDark ? 'cfg-card-dark' : 'cfg-card-light'">
          <div class="cfg-card-head" :class="isDark ? 'cfg-chead-dark' : 'cfg-chead-light'">
            <div class="cfg-chip-icon bg-violet-500/12 border-violet-500/20">
              <i class="fas fa-users text-violet-400 text-[10px]"></i>
            </div>
            <div>
              <p class="cfg-card-title" :class="isDark ? 'text-white' : 'text-slate-800'">Destinatarios de Novedades</p>
              <p class="cfg-card-desc" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Recibirán un correo cuando RRHH apruebe o rechace una novedad</p>
            </div>
          </div>
          <div class="cfg-card-body">
            <div v-if="correo.destinatarios.length" class="cfg-dest-chips">
              <div v-for="email in correo.destinatarios" :key="email" class="cfg-dest-chip"
                :class="isDark ? 'cfg-chip-violet-dark' : 'cfg-chip-violet-light'">
                <i class="fas fa-envelope text-[7px] opacity-60"></i>
                {{ email }}
                <button @click="quitarDestinatario(email)" class="cfg-chip-remove">
                  <i class="fas fa-xmark text-[8px]"></i>
                </button>
              </div>
            </div>
            <p v-else class="cfg-empty-hint" :class="isDark ? 'text-white/30' : 'text-slate-400'">
              No hay destinatarios configurados aún
            </p>
            <div class="cfg-dest-input-row">
              <input v-model="correo.nuevoDestinatario" type="email" placeholder="correo@empresa.com"
                @keydown.enter.prevent="agregarDestinatario"
                class="cfg-input flex-1" :class="isDark ? 'cfg-input-dark' : 'cfg-input-light'" />
              <button @click="agregarDestinatario" class="cfg-btn-ghost" :class="isDark ? 'cfg-ghost-dark' : 'cfg-ghost-light'">
                <i class="fas fa-plus text-[9px]"></i>
              </button>
              <button @click="guardarDestinatarios" :disabled="correo.guardandoDest" class="cfg-btn-violet">
                <i class="fas text-[9px]" :class="correo.guardandoDest ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'"></i>
                Guardar
              </button>
            </div>
          </div>
        </div>

        <!-- Prueba de envío -->
        <div class="cfg-card" :class="isDark ? 'cfg-card-dark' : 'cfg-card-light'">
          <div class="cfg-card-head" :class="isDark ? 'cfg-chead-dark' : 'cfg-chead-light'">
            <div class="cfg-chip-icon bg-emerald-500/12 border-emerald-500/20">
              <i class="fas fa-paper-plane text-emerald-400 text-[10px]"></i>
            </div>
            <div>
              <p class="cfg-card-title" :class="isDark ? 'text-white' : 'text-slate-800'">Prueba de envío</p>
              <p class="cfg-card-desc" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Envía un correo de prueba para verificar que la configuración funciona</p>
            </div>
          </div>
          <div class="cfg-card-body">
            <div class="cfg-dest-input-row">
              <input v-model="correo.correoTest" type="email" placeholder="mi-correo@empresa.com"
                class="cfg-input flex-1" :class="isDark ? 'cfg-input-dark' : 'cfg-input-light'" />
              <button @click="enviarCorreoTest" :disabled="correo.enviandoTest || !correo.correoTest"
                class="cfg-btn-emerald">
                <i class="fas text-[9px]" :class="correo.enviandoTest ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'"></i>
                {{ correo.enviandoTest ? 'Enviando…' : 'Enviar prueba' }}
              </button>
            </div>
            <div v-if="correo.testEnvioResult" class="cfg-result-banner mt-3"
              :class="correo.testEnvioResult.ok ? 'cfg-result-ok' : 'cfg-result-err'">
              <i :class="correo.testEnvioResult.ok ? 'fas fa-check' : 'fas fa-xmark'" class="text-[9px]"></i>
              {{ correo.testEnvioResult.mensaje }}
            </div>
          </div>
        </div>

      </div>

    </div><!-- /cfg-body -->
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
  destinatarios: [], nuevoDestinatario: '', guardandoDest: false,
  correoTest: '', enviandoTest: false, testEnvioResult: null,
});

const cargarConfigCorreo = async () => {
  try {
    const [resCfg, resDest] = await Promise.all([
      fetch(`${API_URL}/superadmin/correo/config`, { cache: 'no-store' }),
      fetch(`${API_URL}/superadmin/correo/novedades-destinatarios`, { cache: 'no-store' }),
    ]);
    if (resCfg.ok) {
      const cfg = await resCfg.json();
      correo.value.config = cfg;
      correo.value.form   = { host: cfg.host, port: cfg.port, user: cfg.user, pass: '', fromNombre: cfg.fromNombre, habilitado: cfg.habilitado };
    }
    if (resDest.ok) {
      const lista = await resDest.json();
      correo.value.destinatarios = Array.isArray(lista) ? lista : [];
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
/* ── ROOT ─────────────────────────────────────────────────── */
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

/* ── MÓDULOS ──────────────────────────────────────────────── */
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
