<template>
  <div class="h-full flex flex-col animate-fade-in" :class="isDark ? 'text-slate-100' : 'text-slate-800'">

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
      :class="isDark ? 'bg-[#1c2333] border-white/10' : 'bg-white border-slate-200'">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          :class="isDark ? 'bg-orange-500/15' : 'bg-orange-100'">
          <i class="fas fa-sliders text-orange-500 text-sm"></i>
        </div>
        <div>
          <h1 class="text-sm font-bold leading-tight">Configuración del Sistema</h1>
          <p class="text-xs mt-0.5" :class="isDark ? 'text-white/40' : 'text-slate-400'">Versión {{ appVersion }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium"
          :class="mantenimiento.enabled
            ? 'border-rose-400/40 bg-rose-500/10 text-rose-400'
            : isDark ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400' : 'border-emerald-300 bg-emerald-50 text-emerald-600'">
          <span class="w-2 h-2 rounded-full shrink-0"
            :class="mantenimiento.enabled ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'"></span>
          {{ mantenimiento.enabled ? 'En mantenimiento' : 'Sistema operativo' }}
        </div>
        <button @click="guardar" :disabled="saving"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
          style="background:linear-gradient(135deg,#f97316,#ea580c);color:#fff">
          <i :class="saving ? 'fas fa-spinner fa-spin text-xs' : 'fas fa-floppy-disk text-xs'"></i>
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </div>

    <!-- ── Tabs ───────────────────────────────────────────────────────────── -->
    <div class="flex border-b shrink-0"
      :class="isDark ? 'bg-[#161d2b] border-white/8' : 'bg-slate-50 border-slate-200'">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        class="flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 -mb-px transition-all"
        :class="activeTab === tab.id
          ? isDark ? 'border-orange-400 text-orange-400 bg-white/3' : 'border-orange-500 text-orange-600 bg-white'
          : isDark ? 'border-transparent text-white/40 hover:text-white/70 hover:bg-white/3' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-white'">
        <i :class="tab.icon + ' text-sm'"></i>
        {{ tab.label }}
      </button>
    </div>

    <!-- ── Tab content ────────────────────────────────────────────────────── -->
    <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar">

      <!-- ═══ TAB SISTEMA ═══════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'sistema'" class="p-5 space-y-4">

        <!-- Mantenimiento -->
        <div class="rounded-2xl border overflow-hidden transition-all"
          :class="mantenimiento.enabled
            ? isDark ? 'border-rose-500/40' : 'border-rose-400'
            : isDark ? 'border-white/10' : 'border-slate-200'">

          <div class="px-5 py-4 border-b flex items-center justify-between gap-4"
            :class="mantenimiento.enabled
              ? isDark ? 'bg-rose-950/50 border-rose-500/20' : 'bg-rose-50 border-rose-300'
              : isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200'">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                :class="mantenimiento.enabled ? 'bg-rose-500/20' : isDark ? 'bg-white/5' : 'bg-white border border-slate-200 shadow-sm'">
                <i class="fas fa-hard-hat"
                  :class="mantenimiento.enabled ? 'text-rose-400' : isDark ? 'text-white/40' : 'text-slate-500'"></i>
              </div>
              <div>
                <p class="text-sm font-semibold" :class="mantenimiento.enabled ? isDark ? 'text-rose-300' : 'text-rose-700' : ''">
                  Modo mantenimiento IIS
                </p>
                <p class="text-xs mt-0.5" :class="isDark ? 'text-white/40' : 'text-slate-500'">
                  Redirige a los usuarios a una página de mantenimiento
                </p>
              </div>
            </div>
            <button @click="toggleMantenimiento" :disabled="mantenimiento.saving || !mantenimiento.configured"
              class="relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 disabled:opacity-40 focus:outline-none"
              :class="mantenimiento.enabled ? 'bg-rose-500 shadow-lg shadow-rose-500/30' : isDark ? 'bg-white/15' : 'bg-slate-300'">
              <span v-if="mantenimiento.saving" class="absolute inset-0 flex items-center justify-center">
                <i class="fas fa-spinner fa-spin text-white text-xs"></i>
              </span>
              <span v-else class="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
                :class="mantenimiento.enabled ? 'left-7' : 'left-1'"></span>
            </button>
          </div>

          <div class="px-5 py-4" :class="isDark ? 'bg-[#0f1623]' : 'bg-white'">
            <div v-if="!mantenimiento.configured" class="flex items-center gap-2 text-sm text-amber-500">
              <i class="fas fa-triangle-exclamation shrink-0"></i>
              <span>La variable <code class="font-mono bg-amber-500/10 px-1.5 py-0.5 rounded text-xs">WEBCONFIG_PATH</code> no está configurada en el servidor.</span>
            </div>
            <div v-else class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-medium"
                  :class="mantenimiento.enabled ? 'text-rose-400' : isDark ? 'text-emerald-400' : 'text-emerald-600'">
                  {{ mantenimiento.enabled ? 'Sitio en mantenimiento' : 'Sitio operativo' }}
                </p>
                <p class="text-xs mt-0.5" :class="isDark ? 'text-white/40' : 'text-slate-500'">
                  {{ mantenimiento.enabled ? 'Los usuarios son redirigidos a mantenimiento.html' : 'Todos los usuarios acceden normalmente' }}
                </p>
              </div>
              <span class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border shrink-0"
                :class="mantenimiento.enabled
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                  : isDark ? 'border-emerald-500/20 bg-emerald-500/8 text-emerald-400' : 'border-emerald-200 bg-emerald-50 text-emerald-600'">
                <i :class="mantenimiento.enabled ? 'fas fa-lock' : 'fas fa-check-circle'"></i>
                {{ mantenimiento.enabled ? 'Activo' : 'Normal' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Almacenamiento -->
        <div class="rounded-2xl border overflow-hidden" :class="isDark ? 'border-white/10' : 'border-slate-200'">
          <div class="px-5 py-4 border-b flex items-center gap-3"
            :class="isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200'">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              :class="isDark ? 'bg-white/5' : 'bg-white border border-slate-200 shadow-sm'">
              <i class="fas fa-database" :class="isDark ? 'text-white/40' : 'text-slate-500'"></i>
            </div>
            <div>
              <p class="text-sm font-semibold">Almacenamiento de soportes</p>
              <p class="text-xs mt-0.5" :class="isDark ? 'text-white/40' : 'text-slate-500'">
                Dónde se guardan los archivos adjuntos del sistema
              </p>
            </div>
          </div>
          <div class="px-5 py-4 flex gap-3" :class="isDark ? 'bg-[#0f1623]' : 'bg-white'">
            <button v-for="opt in storageOpts" :key="opt.v" @click="config.storage_mode = opt.v"
              class="flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left"
              :class="config.storage_mode === opt.v
                ? 'border-orange-500 bg-orange-500/10'
                : isDark ? 'border-white/8 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'">
              <i :class="[opt.icon, 'text-xl', config.storage_mode === opt.v ? 'text-orange-400' : isDark ? 'text-white/30' : 'text-slate-400']"></i>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold"
                  :class="config.storage_mode === opt.v ? 'text-orange-400' : isDark ? 'text-white/80' : 'text-slate-700'">
                  {{ opt.label }}
                </p>
                <p class="text-xs mt-0.5" :class="isDark ? 'text-white/35' : 'text-slate-500'">{{ opt.desc }}</p>
              </div>
              <i v-if="config.storage_mode === opt.v" class="fas fa-check-circle text-orange-400 shrink-0"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- ═══ TAB MÓDULOS ══════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'modulos'" class="p-5 space-y-3">
        <p class="text-xs px-1 pb-1" :class="isDark ? 'text-white/40' : 'text-slate-500'">
          Los módulos inactivos muestran un mensaje de mantenimiento a los usuarios en lugar del contenido.
        </p>
        <div v-for="mod in modulos" :key="mod.key" class="rounded-2xl border overflow-hidden transition-all"
          :class="isActive(mod.key)
            ? isDark ? 'border-white/10' : 'border-slate-200'
            : isDark ? 'border-rose-500/30' : 'border-rose-300'">

          <div class="px-5 py-4 flex items-center gap-4"
            :class="isDark ? 'bg-[#0f1623]' : 'bg-white'">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all"
              :class="isActive(mod.key)
                ? isDark ? 'bg-emerald-500/12 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                : isDark ? 'bg-rose-500/12 text-rose-400' : 'bg-rose-100 text-rose-500'">
              <i :class="mod.icon + ' text-base'"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold">{{ mod.label }}</p>
              <p class="text-xs mt-0.5" :class="isDark ? 'text-white/40' : 'text-slate-500'">{{ mod.desc }}</p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <span class="text-xs font-medium"
                :class="isActive(mod.key) ? isDark ? 'text-emerald-400' : 'text-emerald-600' : 'text-rose-400'">
                {{ isActive(mod.key) ? 'Activo' : 'Inactivo' }}
              </span>
              <button @click="toggleModulo(mod.key)"
                class="relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 focus:outline-none"
                :class="isActive(mod.key) ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25' : isDark ? 'bg-white/15' : 'bg-slate-300'">
                <span class="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
                  :class="isActive(mod.key) ? 'left-7' : 'left-1'"></span>
              </button>
            </div>
          </div>

          <Transition name="slide">
            <div v-if="!isActive(mod.key)" class="px-5 pb-4" :class="isDark ? 'bg-[#0f1623]' : 'bg-white'">
              <div class="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
                :class="isDark ? 'border-white/8 bg-white/3' : 'border-slate-100 bg-slate-50'">
                <i class="fas fa-message text-xs" :class="isDark ? 'text-white/25' : 'text-slate-400'"></i>
                <input v-model="config[mod.key + '_message']" type="text"
                  placeholder="Mensaje que verán los usuarios..."
                  class="flex-1 bg-transparent text-sm outline-none"
                  :class="isDark ? 'text-white placeholder-white/20' : 'text-slate-700 placeholder-slate-400'" />
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- ═══ TAB PROGRAMACIÓN ══════════════════════════════════════════════ -->
      <div v-if="activeTab === 'schedule'" class="p-5 space-y-4">

        <!-- Enable card -->
        <div class="rounded-2xl border overflow-hidden" :class="isDark ? 'border-white/10' : 'border-slate-200'">
          <div class="px-5 py-4 flex items-center gap-4" :class="isDark ? 'bg-[#0f1623]' : 'bg-white'">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              :class="isDark ? 'bg-indigo-500/12' : 'bg-indigo-50'">
              <i class="fas fa-calendar-check text-indigo-500 text-base"></i>
            </div>
            <div class="flex-1">
              <p class="text-sm font-semibold">Control de fechas de cargue</p>
              <p class="text-xs mt-0.5" :class="isDark ? 'text-white/40' : 'text-slate-500'">
                {{ config.mallas_schedule_enabled === 'true'
                  ? 'Activo — el cargue solo está disponible en los días configurados'
                  : 'Inactivo — el botón de cargue siempre está disponible' }}
              </p>
            </div>
            <button
              @click="config.mallas_schedule_enabled = config.mallas_schedule_enabled === 'true' ? 'false' : 'true'"
              class="relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 focus:outline-none"
              :class="config.mallas_schedule_enabled === 'true' ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30' : isDark ? 'bg-white/15' : 'bg-slate-300'">
              <span class="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
                :class="config.mallas_schedule_enabled === 'true' ? 'left-7' : 'left-1'"></span>
            </button>
          </div>
        </div>

        <!-- Free mode message -->
        <div v-if="config.mallas_schedule_enabled !== 'true'"
          class="flex items-center gap-4 p-5 rounded-2xl border"
          :class="isDark ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50'">
          <i class="fas fa-unlock text-emerald-500 text-2xl shrink-0"></i>
          <div>
            <p class="text-sm font-semibold" :class="isDark ? 'text-emerald-400' : 'text-emerald-700'">
              Cargue siempre disponible
            </p>
            <p class="text-xs mt-0.5" :class="isDark ? 'text-emerald-500/60' : 'text-emerald-600/70'">
              Los usuarios pueden cargar mallas en cualquier momento. Activa el control para programar ventanas.
            </p>
          </div>
        </div>

        <template v-if="config.mallas_schedule_enabled === 'true'">

          <!-- Mode selector -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button v-for="m in SCHEDULE_MODES" :key="m.value" @click="config.mallas_schedule_mode = m.value"
              class="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all"
              :class="config.mallas_schedule_mode === m.value
                ? 'border-indigo-500 bg-indigo-500/10'
                : isDark ? 'border-white/8 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'">
              <i :class="[m.icon, 'text-2xl', config.mallas_schedule_mode === m.value ? 'text-indigo-400' : isDark ? 'text-white/25' : 'text-slate-400']"></i>
              <p class="text-xs font-semibold"
                :class="config.mallas_schedule_mode === m.value ? 'text-indigo-400' : isDark ? 'text-white/60' : 'text-slate-600'">
                {{ m.label }}
              </p>
              <p class="text-[10px] text-center leading-tight"
                :class="isDark ? 'text-white/25' : 'text-slate-400'">{{ m.desc }}</p>
            </button>
          </div>

          <!-- ── SEMANAL ───────────────────────────────────────────────── -->
          <div v-if="config.mallas_schedule_mode === 'weekly'"
            class="rounded-2xl border overflow-hidden"
            :class="isDark ? 'border-white/10' : 'border-slate-200'">
            <div class="px-5 py-3 border-b"
              :class="isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200'">
              <p class="text-xs font-semibold" :class="isDark ? 'text-white/60' : 'text-slate-600'">
                Selecciona los días de la semana habilitados
              </p>
            </div>
            <div class="p-4 grid grid-cols-7 gap-2" :class="isDark ? 'bg-[#0f1623]' : 'bg-white'">
              <button v-for="d in diasSemanaFull" :key="d.v"
                @click="toggleScheduleDay('weekly', d.v)"
                class="flex flex-col items-center gap-1 py-3 px-1 rounded-xl border-2 transition-all"
                :class="scheduleWeeklyDays.includes(d.v)
                  ? 'border-indigo-500 bg-indigo-500/12'
                  : isDark ? 'border-white/8 hover:border-white/20' : 'border-slate-200 hover:border-indigo-300'">
                <span class="text-[9px] font-black uppercase tracking-wider"
                  :class="scheduleWeeklyDays.includes(d.v) ? 'text-indigo-400' : isDark ? 'text-white/35' : 'text-slate-400'">
                  {{ d.short }}
                </span>
                <span class="text-base font-bold"
                  :class="scheduleWeeklyDays.includes(d.v) ? 'text-indigo-400' : isDark ? 'text-white/70' : 'text-slate-700'">
                  {{ d.nextDate }}
                </span>
                <span class="text-[9px]"
                  :class="isDark ? 'text-white/25' : 'text-slate-400'">{{ d.nextMonth }}</span>
                <span v-if="d.isToday"
                  class="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 mt-0.5">
                  Hoy
                </span>
              </button>
            </div>
            <div v-if="scheduleWeeklyDays.length" class="px-5 pb-3"
              :class="isDark ? 'bg-[#0f1623]' : 'bg-white'">
              <p class="text-xs" :class="isDark ? 'text-white/40' : 'text-slate-500'">
                Habilitado cada
                {{ diasSemanaFull.filter(d => scheduleWeeklyDays.includes(d.v)).map(d => d.full).join(', ') }}
              </p>
            </div>
          </div>

          <!-- ── MENSUAL (calendario) ──────────────────────────────────── -->
          <div v-if="config.mallas_schedule_mode === 'monthly'"
            class="rounded-2xl border overflow-hidden"
            :class="isDark ? 'border-white/10' : 'border-slate-200'">
            <div class="px-5 py-3 border-b flex items-center justify-between"
              :class="isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200'">
              <button @click="prevMonth"
                class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                :class="isDark ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-700'">
                <i class="fas fa-chevron-left text-xs"></i>
              </button>
              <p class="text-sm font-semibold capitalize">{{ monthName }} {{ calYear }}</p>
              <button @click="nextMonth"
                class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                :class="isDark ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-700'">
                <i class="fas fa-chevron-right text-xs"></i>
              </button>
            </div>
            <div class="p-4" :class="isDark ? 'bg-[#0f1623]' : 'bg-white'">
              <!-- Day headers -->
              <div class="grid grid-cols-7 mb-2">
                <div v-for="h in ['Lu','Ma','Mi','Ju','Vi','Sá','Do']" :key="h"
                  class="text-center text-[10px] font-black uppercase py-1"
                  :class="isDark ? 'text-white/30' : 'text-slate-400'">{{ h }}</div>
              </div>
              <!-- Grid -->
              <div class="grid grid-cols-7 gap-1">
                <div v-for="(cell, idx) in calendarGrid" :key="idx">
                  <button v-if="cell" @click="toggleScheduleDay('monthly', cell)"
                    class="w-full aspect-square rounded-xl text-sm font-semibold transition-all flex items-center justify-center"
                    :class="scheduleMonthlyDays.includes(cell)
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                      : isDark ? 'hover:bg-white/8 text-white/60 hover:text-white' : 'hover:bg-indigo-50 text-slate-600 hover:text-indigo-600'">
                    {{ cell }}
                  </button>
                  <div v-else class="w-full aspect-square"></div>
                </div>
              </div>
              <p v-if="scheduleMonthlyDays.length" class="mt-3 text-xs text-center"
                :class="isDark ? 'text-white/40' : 'text-slate-500'">
                Habilitado el día {{ scheduleMonthlyDays.join(', ') }} de cada mes
              </p>
            </div>
          </div>

          <!-- ── FECHAS EXACTAS (calendario navegable) ────────────────── -->
          <div v-if="config.mallas_schedule_mode === 'specific'"
            class="rounded-2xl border overflow-hidden"
            :class="isDark ? 'border-white/10' : 'border-slate-200'">
            <div class="px-5 py-3 border-b flex items-center justify-between"
              :class="isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200'">
              <button @click="prevMonth"
                class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                :class="isDark ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-slate-200 text-slate-500'">
                <i class="fas fa-chevron-left text-xs"></i>
              </button>
              <p class="text-sm font-semibold capitalize">{{ monthName }} {{ calYear }}</p>
              <button @click="nextMonth"
                class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                :class="isDark ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-slate-200 text-slate-500'">
                <i class="fas fa-chevron-right text-xs"></i>
              </button>
            </div>
            <div class="p-4" :class="isDark ? 'bg-[#0f1623]' : 'bg-white'">
              <div class="grid grid-cols-7 mb-2">
                <div v-for="h in ['Lu','Ma','Mi','Ju','Vi','Sá','Do']" :key="h"
                  class="text-center text-[10px] font-black uppercase py-1"
                  :class="isDark ? 'text-white/30' : 'text-slate-400'">{{ h }}</div>
              </div>
              <div class="grid grid-cols-7 gap-1">
                <div v-for="(cell, idx) in calendarGrid" :key="idx">
                  <button v-if="cell"
                    @click="!isPastDate(calYear, calMonth, cell) && toggleSpecificDate(calYear, calMonth, cell)"
                    class="w-full aspect-square rounded-xl text-sm font-semibold transition-all flex items-center justify-center"
                    :class="isSpecificDateSelected(calYear, calMonth, cell)
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                      : isPastDate(calYear, calMonth, cell)
                        ? isDark ? 'text-white/15 cursor-not-allowed' : 'text-slate-200 cursor-not-allowed'
                        : isDark ? 'hover:bg-white/8 text-white/60 hover:text-white' : 'hover:bg-indigo-50 text-slate-600 hover:text-indigo-600'">
                    {{ cell }}
                  </button>
                  <div v-else class="w-full aspect-square"></div>
                </div>
              </div>
              <!-- Selected dates chips -->
              <div v-if="scheduleSpecificDates.length" class="mt-4 border-t pt-3 flex flex-wrap gap-1.5"
                :class="isDark ? 'border-white/8' : 'border-slate-100'">
                <span v-for="d in scheduleSpecificDates" :key="d"
                  class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                  :class="isDark ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'">
                  {{ formatSpecificDate(d) }}
                  <button @click="removeSpecificDate(d)" class="ml-0.5 opacity-50 hover:opacity-100">
                    <i class="fas fa-times text-[9px]"></i>
                  </button>
                </span>
              </div>
              <p v-else class="mt-3 text-xs text-center opacity-40">
                Haz clic en los días para seleccionar fechas exactas
              </p>
            </div>
          </div>

          <!-- Próximas fechas -->
          <div v-if="proximasFechas.length" class="rounded-2xl border p-4"
            :class="isDark ? 'border-indigo-500/20 bg-indigo-500/5' : 'border-indigo-200 bg-indigo-50'">
            <p class="text-xs font-semibold uppercase tracking-wide mb-3"
              :class="isDark ? 'text-indigo-400' : 'text-indigo-600'">
              <i class="fas fa-calendar-circle-user mr-1.5"></i>Próximas ventanas habilitadas
            </p>
            <div class="flex flex-wrap gap-2">
              <span v-for="f in proximasFechas" :key="f"
                class="px-3 py-1.5 rounded-xl text-xs font-medium"
                :class="isDark ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20' : 'bg-white text-indigo-700 border border-indigo-200 shadow-sm'">
                {{ f }}
              </span>
            </div>
          </div>

          <div v-else-if="config.mallas_schedule_mode !== 'free'"
            class="flex items-center gap-3 p-4 rounded-2xl border text-sm"
            :class="isDark ? 'border-amber-500/20 bg-amber-500/5 text-amber-400' : 'border-amber-200 bg-amber-50 text-amber-700'">
            <i class="fas fa-triangle-exclamation shrink-0"></i>
            No hay fechas habilitadas configuradas aún.
          </div>

        </template>

      </div>

      <!-- ═══ TAB CORREO ═══════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'correo'" class="p-5 space-y-4">

        <!-- SMTP Config -->
        <div class="rounded-2xl border overflow-hidden" :class="isDark ? 'border-white/10' : 'border-slate-200'">
          <div class="px-5 py-3.5 border-b flex items-center justify-between gap-4"
            :class="isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200'">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center"
                :class="isDark ? 'bg-blue-500/15' : 'bg-blue-100'">
                <i class="fas fa-gear text-blue-500 text-sm"></i>
              </div>
              <div>
                <p class="text-sm font-bold" :class="isDark ? 'text-white' : 'text-slate-800'">Configuración SMTP</p>
                <p class="text-[10px]" :class="isDark ? 'text-white/40' : 'text-slate-400'">Outlook / Office 365 — smtp.office365.com:587</p>
              </div>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-2 h-2 rounded-full" :class="correo.form.habilitado ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'"></div>
              <span class="text-[9px] font-bold uppercase" :class="correo.form.habilitado ? 'text-emerald-400' : isDark ? 'text-slate-500' : 'text-slate-400'">
                {{ correo.form.habilitado ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>
          <div class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[9px] font-bold uppercase tracking-wider mb-1" :class="isDark ? 'text-white/50' : 'text-slate-500'">Host SMTP *</label>
              <input v-model="correo.form.host" type="text" placeholder="smtp.office365.com"
                class="w-full px-3 py-2 rounded-xl border text-[11px] outline-none transition-all"
                :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-400'" />
            </div>
            <div>
              <label class="block text-[9px] font-bold uppercase tracking-wider mb-1" :class="isDark ? 'text-white/50' : 'text-slate-500'">Puerto</label>
              <input v-model="correo.form.port" type="text" placeholder="587"
                class="w-full px-3 py-2 rounded-xl border text-[11px] outline-none transition-all"
                :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[9px] font-bold uppercase tracking-wider mb-1" :class="isDark ? 'text-white/50' : 'text-slate-500'">Correo Outlook (usuario SMTP) *</label>
              <input v-model="correo.form.user" type="email" placeholder="notificaciones@miempresa.com"
                class="w-full px-3 py-2 rounded-xl border text-[11px] outline-none transition-all"
                :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-400'" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[9px] font-bold uppercase tracking-wider mb-1" :class="isDark ? 'text-white/50' : 'text-slate-500'">
                Contraseña de aplicación *
                <span v-if="correo.config.passConfigurado" class="ml-1 text-emerald-400 normal-case font-normal">(configurada — dejar vacío para no cambiar)</span>
              </label>
              <input v-model="correo.form.pass" type="password" placeholder="••••••••"
                class="w-full px-3 py-2 rounded-xl border text-[11px] outline-none transition-all"
                :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'" />
            </div>
            <div>
              <label class="block text-[9px] font-bold uppercase tracking-wider mb-1" :class="isDark ? 'text-white/50' : 'text-slate-500'">Nombre del remitente</label>
              <input v-model="correo.form.fromNombre" type="text" placeholder="WodenTrack RRHH"
                class="w-full px-3 py-2 rounded-xl border text-[11px] outline-none transition-all"
                :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'" />
            </div>
            <div class="flex items-end">
              <div class="w-full flex items-center justify-between p-3 rounded-xl border"
                :class="correo.form.habilitado ? (isDark ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-300 bg-emerald-50') : (isDark ? 'border-white/10' : 'border-slate-200')">
                <div>
                  <p class="text-[10px] font-bold" :class="correo.form.habilitado ? 'text-emerald-500' : isDark ? 'text-white/50' : 'text-slate-500'">
                    {{ correo.form.habilitado ? 'Habilitado' : 'Deshabilitado' }}
                  </p>
                  <p class="text-[9px] opacity-50" :class="isDark ? 'text-white' : 'text-slate-400'">Envío de correos</p>
                </div>
                <button @click="correo.form.habilitado = !correo.form.habilitado"
                  class="w-10 h-5 rounded-full transition-all relative shrink-0"
                  :class="correo.form.habilitado ? 'bg-emerald-500' : isDark ? 'bg-white/10' : 'bg-slate-200'">
                  <div class="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-sm"
                    :class="correo.form.habilitado ? 'left-[22px]' : 'left-0.5'"></div>
                </button>
              </div>
            </div>
          </div>
          <div class="px-5 pb-5 flex gap-2">
            <button @click="testConexion" :disabled="correo.testeando"
              class="flex items-center gap-1.5 px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wide transition-all disabled:opacity-50"
              :class="isDark ? 'border-white/10 text-white/60 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:bg-slate-50'">
              <i class="fas text-[10px]" :class="correo.testeando ? 'fa-circle-notch fa-spin' : 'fa-plug'"></i>
              Probar conexión
            </button>
            <button @click="guardarConfigCorreo" :disabled="correo.guardando"
              class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-blue-400 disabled:opacity-50 transition-all">
              <i class="fas text-[10px]" :class="correo.guardando ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'"></i>
              Guardar SMTP
            </button>
          </div>
          <div v-if="correo.testResult" class="mx-5 mb-5 px-3 py-2 rounded-xl text-[10px] font-semibold border"
            :class="correo.testResult.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'">
            <i :class="correo.testResult.ok ? 'fas fa-check' : 'fas fa-xmark'" class="mr-1.5"></i>
            {{ correo.testResult.mensaje }}
          </div>
        </div>

        <!-- Destinatarios de Novedades -->
        <div class="rounded-2xl border overflow-hidden" :class="isDark ? 'border-white/10' : 'border-slate-200'">
          <div class="px-5 py-3.5 border-b flex items-center gap-2.5"
            :class="isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200'">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center"
              :class="isDark ? 'bg-violet-500/15' : 'bg-violet-100'">
              <i class="fas fa-users text-violet-500 text-sm"></i>
            </div>
            <div>
              <p class="text-sm font-bold" :class="isDark ? 'text-white' : 'text-slate-800'">Destinatarios de Novedades</p>
              <p class="text-[10px]" :class="isDark ? 'text-white/40' : 'text-slate-400'">Recibirán un correo cuando el jefe o RRHH apruebe/rechace una novedad</p>
            </div>
          </div>
          <div class="p-5 space-y-3">
            <!-- Lista de destinatarios -->
            <div v-if="correo.destinatarios.length" class="flex flex-wrap gap-2">
              <div v-for="email in correo.destinatarios" :key="email"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-semibold"
                :class="isDark ? 'bg-violet-500/10 border-violet-500/30 text-violet-300' : 'bg-violet-50 border-violet-200 text-violet-700'">
                <i class="fas fa-envelope text-[9px] opacity-60"></i>
                {{ email }}
                <button @click="quitarDestinatario(email)" class="ml-1 opacity-50 hover:opacity-100 transition-opacity">
                  <i class="fas fa-xmark text-[9px]"></i>
                </button>
              </div>
            </div>
            <p v-else class="text-[10px] py-3 text-center" :class="isDark ? 'text-white/30' : 'text-slate-400'">
              No hay destinatarios configurados aún
            </p>
            <!-- Agregar -->
            <div class="flex gap-2">
              <input v-model="correo.nuevoDestinatario" type="email" placeholder="correo@empresa.com"
                @keydown.enter.prevent="agregarDestinatario"
                class="flex-1 px-3 py-2 rounded-xl border text-[11px] outline-none transition-all"
                :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-violet-500/50' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-violet-400'" />
              <button @click="agregarDestinatario"
                class="px-3 py-2 rounded-xl border text-[10px] font-bold transition-all"
                :class="isDark ? 'border-white/10 text-white/60 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:bg-slate-100'">
                <i class="fas fa-plus"></i>
              </button>
              <button @click="guardarDestinatarios" :disabled="correo.guardandoDest"
                class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-violet-400 disabled:opacity-50 transition-all">
                <i class="fas text-[10px]" :class="correo.guardandoDest ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'"></i>
                Guardar
              </button>
            </div>
          </div>
        </div>

        <!-- Prueba de envío -->
        <div class="rounded-2xl border overflow-hidden" :class="isDark ? 'border-white/10' : 'border-slate-200'">
          <div class="px-5 py-3.5 border-b flex items-center gap-2.5"
            :class="isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200'">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center"
              :class="isDark ? 'bg-emerald-500/15' : 'bg-emerald-100'">
              <i class="fas fa-paper-plane text-emerald-500 text-sm"></i>
            </div>
            <div>
              <p class="text-sm font-bold" :class="isDark ? 'text-white' : 'text-slate-800'">Prueba de envío</p>
              <p class="text-[10px]" :class="isDark ? 'text-white/40' : 'text-slate-400'">Envía un correo de prueba para verificar que la configuración funciona</p>
            </div>
          </div>
          <div class="p-5 flex gap-2">
            <input v-model="correo.correoTest" type="email" placeholder="mi-correo@empresa.com"
              class="flex-1 px-3 py-2 rounded-xl border text-[11px] outline-none transition-all"
              :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-emerald-400'" />
            <button @click="enviarCorreoTest" :disabled="correo.enviandoTest || !correo.correoTest"
              class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-emerald-400 disabled:opacity-50 transition-all">
              <i class="fas text-[10px]" :class="correo.enviandoTest ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'"></i>
              {{ correo.enviandoTest ? 'Enviando…' : 'Enviar prueba' }}
            </button>
          </div>
          <div v-if="correo.testEnvioResult" class="mx-5 mb-5 px-3 py-2 rounded-xl text-[10px] font-semibold border"
            :class="correo.testEnvioResult.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'">
            <i :class="correo.testEnvioResult.ok ? 'fas fa-check' : 'fas fa-xmark'" class="mr-1.5"></i>
            {{ correo.testEnvioResult.mensaje }}
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';

const props = defineProps({ isDark: Boolean });
const emit = defineEmits(['success', 'error']);

const API_URL = import.meta.env.VITE_API_URL;
const API_BASE = API_URL.replace('/usuarios', '');

// ── Tabs ─────────────────────────────────────────────────────────────────────
const activeTab = ref('sistema');
const tabs = [
  { id: 'sistema',   label: 'Sistema',        icon: 'fas fa-server' },
  { id: 'modulos',   label: 'Módulos',         icon: 'fas fa-th-large' },
  { id: 'schedule',  label: 'Programación',    icon: 'fas fa-calendar-check' },
  { id: 'correo',    label: 'Correo',           icon: 'fas fa-envelope' },
];

// ── Constants ─────────────────────────────────────────────────────────────────
const SCHEDULE_MODES = [
  { value: 'free',     label: 'Libre',         icon: 'fas fa-unlock-keyhole', desc: 'Siempre disponible' },
  { value: 'weekly',   label: 'Semanal',        icon: 'fas fa-calendar-week',  desc: 'Días de la semana' },
  { value: 'monthly',  label: 'Mensual',        icon: 'fas fa-calendar-days',  desc: 'Días del mes (recurrente)' },
  { value: 'specific', label: 'Fechas exactas', icon: 'fas fa-calendar-check', desc: 'Fechas puntuales' },
];

const storageOpts = [
  { v: 'local', icon: 'fas fa-hard-drive',  label: 'Almacenamiento local', desc: 'Archivos guardados en el servidor' },
  { v: 's3',    icon: 'fab fa-aws',          label: 'Amazon S3',            desc: 'Credenciales configuradas en .env' },
];

const modulos = [
  { key: 'module_asistencias', label: 'Asistencias',   icon: 'fas fa-chart-line',      desc: 'Control de asistencia y marcación' },
  { key: 'module_mallas',      label: 'Cargue Mallas', icon: 'fas fa-cloud-arrow-up',  desc: 'Programación y cargue de turnos' },
  { key: 'module_novedades',   label: 'Novedades',     icon: 'fas fa-file-circle-plus', desc: 'Registro y gestión de novedades' },
];

// ── State ─────────────────────────────────────────────────────────────────────
const saving = ref(false);
const appVersion = ref('—');
const mantenimiento = reactive({ enabled: false, configured: false, saving: false });

const config = reactive({
  storage_mode: 'local',
  module_asistencias_active: 'true',
  module_asistencias_message: 'Módulo en mantenimiento. Vuelve pronto.',
  module_mallas_active: 'true',
  module_mallas_message: 'Módulo en mantenimiento. Vuelve pronto.',
  module_novedades_active: 'true',
  module_novedades_message: 'Módulo en mantenimiento. Vuelve pronto.',
  mallas_schedule_enabled: 'false',
  mallas_schedule_mode: 'free',
  mallas_schedule_weekly_days: '[]',
  mallas_schedule_monthly_days: '[]',
  mallas_schedule_specific_dates: '[]',
});

// ── Calendar navigation ───────────────────────────────────────────────────────
const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
const calMonth = ref(today.getMonth());
const calYear  = ref(today.getFullYear());

const prevMonth = () => {
  if (calMonth.value === 0) { calMonth.value = 11; calYear.value--; }
  else calMonth.value--;
};
const nextMonth = () => {
  if (calMonth.value === 11) { calMonth.value = 0; calYear.value++; }
  else calMonth.value++;
};

const monthName = computed(() =>
  new Date(calYear.value, calMonth.value, 1)
    .toLocaleDateString('es-CO', { month: 'long', timeZone: 'America/Bogota' })
);

const calendarGrid = computed(() => {
  const firstDay = new Date(calYear.value, calMonth.value, 1).getDay();
  const daysInMonth = new Date(calYear.value, calMonth.value + 1, 0).getDate();
  const offset = (firstDay + 6) % 7; // Monday-first
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
});

// ── Weekly days with next occurrence dates ────────────────────────────────────
const diasSemanaFull = computed(() => {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  return [
    { v: 1, short: 'Lun', full: 'lunes' },
    { v: 2, short: 'Mar', full: 'martes' },
    { v: 3, short: 'Mié', full: 'miércoles' },
    { v: 4, short: 'Jue', full: 'jueves' },
    { v: 5, short: 'Vie', full: 'viernes' },
    { v: 6, short: 'Sáb', full: 'sábado' },
    { v: 0, short: 'Dom', full: 'domingo' },
  ].map(d => {
    const diff = ((d.v - now.getDay()) + 7) % 7;
    const next = new Date(now);
    next.setDate(now.getDate() + diff);
    return {
      ...d,
      nextDate: next.getDate(),
      nextMonth: next.toLocaleDateString('es-CO', { month: 'short', timeZone: 'America/Bogota' }),
      isToday: diff === 0,
    };
  });
});

// ── Schedule helpers ──────────────────────────────────────────────────────────
const scheduleWeeklyDays = computed(() => {
  try { return JSON.parse(config.mallas_schedule_weekly_days || '[]'); } catch { return []; }
});
const scheduleMonthlyDays = computed(() => {
  try { return JSON.parse(config.mallas_schedule_monthly_days || '[]'); } catch { return []; }
});
const scheduleSpecificDates = computed(() => {
  try { return JSON.parse(config.mallas_schedule_specific_dates || '[]'); } catch { return []; }
});

const toggleScheduleDay = (type, val) => {
  const key = type === 'weekly' ? 'mallas_schedule_weekly_days' : 'mallas_schedule_monthly_days';
  const arr = [...(type === 'weekly' ? scheduleWeeklyDays.value : scheduleMonthlyDays.value)];
  const idx = arr.indexOf(val);
  if (idx === -1) arr.push(val);
  else arr.splice(idx, 1);
  arr.sort((a, b) => a - b);
  config[key] = JSON.stringify(arr);
};

const isPastDate = (year, month, day) => {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
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
  if (idx === -1) arr.push(s);
  else arr.splice(idx, 1);
  arr.sort();
  config.mallas_schedule_specific_dates = JSON.stringify(arr);
};

const removeSpecificDate = (dateStr) => {
  const arr = scheduleSpecificDates.value.filter(d => d !== dateStr);
  config.mallas_schedule_specific_dates = JSON.stringify(arr);
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
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    let ok = false;
    if (config.mallas_schedule_mode === 'weekly') {
      ok = scheduleWeeklyDays.value.includes(d.getDay());
    } else if (config.mallas_schedule_mode === 'monthly') {
      ok = scheduleMonthlyDays.value.includes(d.getDate());
    } else if (config.mallas_schedule_mode === 'specific') {
      const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      ok = scheduleSpecificDates.value.includes(s);
    }
    if (ok) res.push(d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Bogota' }));
  }
  return res;
});

// ── Modules ───────────────────────────────────────────────────────────────────
const isActive = (key) => config[key + '_active'] === 'true';
const toggleModulo = (key) => { config[key + '_active'] = isActive(key) ? 'false' : 'true'; };

// ── Maintenance ───────────────────────────────────────────────────────────────
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
    const res = await fetch(`${API_BASE}/mantenimiento`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: nuevo }),
    });
    const data = await res.json();
    if (data.ok) {
      mantenimiento.enabled = nuevo;
      emit('success', nuevo ? '⚠ Mantenimiento activado' : '✓ Sitio restaurado');
    } else {
      emit('error', data.message || 'No se pudo cambiar el estado');
    }
  } catch { emit('error', 'Error al comunicarse con el servidor'); }
  finally { mantenimiento.saving = false; }
};

// ── Load / Save ───────────────────────────────────────────────────────────────
const cargar = async () => {
  try {
    const res = await fetch(`${API_URL}/sistema-config`);
    if (!res.ok) return;
    const data = await res.json();
    Object.assign(config, data);
  } catch { /* silencioso */ }
};

const guardar = async () => {
  saving.value = true;
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const res = await fetch(`${API_URL}/sistema-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates: { ...config }, updatedBy: session.name || 'SuperAdmin' }),
    });
    if (!res.ok) throw new Error();
    emit('success', 'Configuración guardada correctamente');
  } catch { emit('error', 'Error al guardar la configuración'); }
  finally { saving.value = false; }
};

// ── Correo ────────────────────────────────────────────────────────────────────
const correo = ref({
  config: { host: '', port: '587', user: '', passConfigurado: false, fromNombre: 'WodenTrack', habilitado: false },
  form: { host: '', port: '587', user: '', pass: '', fromNombre: 'WodenTrack', habilitado: false },
  guardando: false, testeando: false, testResult: null,
  destinatarios: [],
  nuevoDestinatario: '',
  guardandoDest: false,
  correoTest: '',
  enviandoTest: false,
  testEnvioResult: null,
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
      correo.value.form = { host: cfg.host, port: cfg.port, user: cfg.user, pass: '', fromNombre: cfg.fromNombre, habilitado: cfg.habilitado };
    }
    if (resDest.ok) {
      const lista = await resDest.json();
      correo.value.destinatarios = Array.isArray(lista) ? lista : [];
    }
  } catch (e) {
    console.error('[Correo] Error cargando config:', e);
    emit('error', 'Error al cargar configuración de correo');
  }
};

const guardarConfigCorreo = async () => {
  correo.value.guardando = true;
  correo.value.testResult = null;
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
  correo.value.testeando = true;
  correo.value.testResult = null;
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
  // Si hay texto pendiente en el input, agregarlo antes de guardar
  const pendiente = correo.value.nuevoDestinatario.trim().toLowerCase();
  if (pendiente && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pendiente)) {
    if (!correo.value.destinatarios.includes(pendiente)) {
      correo.value.destinatarios.push(pendiente);
    }
    correo.value.nuevoDestinatario = '';
  }

  if (!correo.value.destinatarios.length) {
    emit('error', 'Escribe al menos un correo destinatario');
    return;
  }

  correo.value.guardandoDest = true;
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const res = await fetch(`${API_URL}/superadmin/correo/novedades-destinatarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinatarios: correo.value.destinatarios, updatedBy: session.name || 'superadmin' }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    emit('success', 'Destinatarios guardados');
  } catch (e) {
    emit('error', 'Error al guardar destinatarios');
  } finally {
    correo.value.guardandoDest = false;
  }
};

const enviarCorreoTest = async () => {
  if (!correo.value.correoTest) return;
  correo.value.enviandoTest = true;
  correo.value.testEnvioResult = null;
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const res = await fetch(`${API_URL}/superadmin/correo/ausentismo`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empleado: 'Usuario de Prueba',
        cedula: '0000000000',
        tipificacion: 'PRUEBA DE CORREO',
        descripcion: 'Este es un correo de prueba enviado desde WodenTrack.',
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
.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
