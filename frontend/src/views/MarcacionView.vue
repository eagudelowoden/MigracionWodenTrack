<template>
  <div v-if="employee"
    class="h-screen w-screen overflow-hidden flex flex-col items-center justify-between p-6 transition-colors duration-300 font-sans select-none relative"
    :class="isDark ? 'bg-[#0B0F19] text-[#F5F5F7]' : 'bg-[#F4F6FA] text-[#111827]'">

    <!-- FONDO DE RESPLANDORES PREMIUM WODENTRACK -->
    <div class="absolute inset-0 z-0 pointer-events-none opacity-40">
      <div
        class="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] rounded-full blur-[120px] transition-opacity duration-300"
        :class="isDark ? 'bg-blue-500/10' : 'bg-blue-400/20'"></div>
      <div
        class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] rounded-full blur-[120px] transition-opacity duration-300"
        :class="isDark ? 'bg-[#e88710]/10' : 'bg-[#e88710]/15'"></div>
    </div>

    <!-- CONTENEDOR SEGURO MÓVIL -->
    <div class="w-full max-w-[420px] h-full flex flex-col justify-between relative z-10 py-2">

      <!-- HEADER ESTILO APP PREMIUM -->
      <header class="w-full flex items-center justify-between px-1 flex-shrink-0">
        <div class="flex items-center gap-3 text-left">
          <!-- Avatar con inicial unificada -->
          <div
            class="w-11 h-11 rounded-xl font-bold flex items-center justify-center text-sm shadow-sm transition-colors border"
            :class="isDark ? 'bg-[#161B26] border-[#222938] text-[#e88710]' : 'bg-white border-slate-200/60 text-[#2563EB]'">
            <i class="far fa-user-circle text-lg"></i>
          </div>
          <div class="space-y-0.5 text-left">
            <span class="block text-[10px] font-bold uppercase tracking-wider text-[#e88710]">Sesión {{ employee.job || 'Operario' }}</span>
            <h2 class="text-sm font-bold tracking-tight" :class="isDark ? 'text-white' : 'text-[#111827]'">
              Hola, {{ primerNombre }}
            </h2>
          </div>
        </div>

        <button @click="toggleTheme" class="active:scale-95 p-2.5 rounded-full border transition-all"
          :class="isDark ? 'bg-[#161B26] border-[#222938] text-amber-400' : 'bg-white border-slate-200 text-slate-500 shadow-sm'">
          <span v-if="isDark"><i class="fas fa-sun text-xs"></i></span>
          <span v-else><i class="fas fa-moon text-xs"></i></span>
        </button>
      </header>

      <!-- RELOJ CENTRAL DE OPERACIÓN -->
      <main class="text-center my-auto py-6 flex flex-col items-center justify-center flex-shrink-0">
        <h1 class="text-5xl md:text-6xl font-light tracking-tighter tabular-nums"
          :class="isDark ? 'text-white' : 'text-[#111827]'">
          {{ currentTime?.split(' ')[0] }}
        </h1>
        <p class="text-xs font-bold text-[#e88710] tracking-[0.25em] uppercase mt-2">
          {{ currentTime?.split(' ')[1] }}
        </p>

        <!-- Estado de Jornada Completa -->
        <div v-if="employee.day_completed"
          class="mt-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-[10px] font-bold uppercase text-emerald-500 tracking-wider">Jornada Finalizada</span>
        </div>
      </main>

      <!-- SECCIÓN ACCIONES Y ENTORNO -->
      <footer class="w-full space-y-4 flex-shrink-0">

        <!-- GRID DE BOTONES PRINCIPALES CORREGIDO PARA MODO CLARO -->
        <div class="action-grid grid grid-cols-2 gap-3.5">

          <!-- ENTRADA -->
          <button @click="handleAttendance('in')" :disabled="loading || employee.is_inside || employee.day_completed"
            class="group p-5 rounded-2xl border text-left flex flex-col justify-between min-h-[125px] transition-all duration-300 relative overflow-hidden active:scale-[0.98] disabled:opacity-20 disabled:pointer-events-none"
            :class="isDark
              ? 'bg-[#161B26]/90 border-[#222938] hover:border-[#e88710] backdrop-blur-md'
              : 'bg-white border-slate-200/80 shadow-[0_8px_24px_rgba(0,0,0,0.03)] hover:border-slate-400'">

            <div class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors border"
              :class="isDark
                ? 'bg-[#0B0F19] border-[#222938] text-zinc-400 group-hover:bg-[#e88710] group-hover:border-[#e88710] group-hover:text-white'
                : 'bg-[#F4F6FA] border-slate-100 text-zinc-600 group-hover:bg-[#2563EB] group-hover:border-[#2563EB] group-hover:text-white'">
              <svg v-if="employee.day_completed" class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor"
                viewBox="0 0 24 24" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14" />
              </svg>
            </div>

            <div class="space-y-0.5 mt-4">
              <span class="block text-[11px] font-bold uppercase tracking-wider opacity-40">Registro</span>
              <span class="block text-sm font-bold" :class="isDark ? 'text-white' : 'text-[#111827]'">
                {{ employee.day_completed ? 'Completado' : (employee.is_inside ? 'Dentro' : 'Entrada') }}
              </span>
              <span v-if="employee.hora_entrada" class="block text-[10px] font-semibold tabular-nums text-zinc-400">
                {{ employee.hora_entrada }}
              </span>
            </div>
          </button>

          <!-- SALIDA -->
          <button @click="handleAttendance('out')" :disabled="loading || !employee.is_inside || employee.day_completed"
            class="group p-5 rounded-2xl border text-left flex flex-col justify-between min-h-[125px] transition-all duration-300 relative overflow-hidden active:scale-[0.98] disabled:opacity-20 disabled:pointer-events-none"
            :class="isDark
              ? 'bg-[#161B26]/90 border-[#222938] hover:border-[#e88710] backdrop-blur-md'
              : 'bg-white border-slate-200/80 shadow-[0_8px_24px_rgba(0,0,0,0.03)] hover:border-slate-400'">

            <div class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors border"
              :class="isDark
                ? 'bg-[#0B0F19] border-[#222938] text-zinc-400 group-hover:bg-[#e88710] group-hover:border-[#e88710] group-hover:text-white'
                : 'bg-[#F4F6FA] border-slate-100 text-zinc-600 group-hover:bg-[#2563EB] group-hover:border-[#2563EB] group-hover:text-white'">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
              </svg>
            </div>

            <div class="space-y-0.5 mt-4">
              <span class="block text-[11px] font-bold uppercase tracking-wider opacity-40">Registro</span>
              <span class="block text-sm font-bold" :class="isDark ? 'text-white' : 'text-[#111827]'">Salida</span>
              <span v-if="employee.hora_salida" class="block text-[10px] font-semibold tabular-nums text-zinc-400">
                {{ employee.hora_salida }}
              </span>
            </div>
          </button>
        </div>

        <!-- MARCACIÓN ECUADOR CON GPS — solo para usuarios Ecuador con permiso -->
        <MarcacionAsistenciaEcuador
          v-if="canMarcacionEcuador"
          :isDark="isDark"
          :employee="employee"
        />

        <!-- MENU DE DESARROLLO / ROLES COMPACTADO CORREGIDO PARA MODO CLARO -->
        <div v-if="employee?.isSuperAdmin || canVerSeriales"
          class="p-1 border rounded-xl flex items-center justify-around text-[10px] font-bold"
          :class="isDark ? 'bg-[#161B26] border-[#222938] text-zinc-400' : 'bg-white border-slate-200 text-slate-600 shadow-sm'">
          <template v-if="employee?.isSuperAdmin">
            <button @click="router.push('/super-admin')"
              class="py-1 px-3 rounded-lg hover:text-[#e88710] dark:hover:text-white transition-colors flex items-center gap-1">
              <i class="fas fa-shield-halved text-[9px] text-[#e88710]"></i> Super
            </button>
            <span class="opacity-20">|</span>
            <button @click="router.push('/admin')"
              class="py-1 px-3 rounded-lg hover:text-[#e88710] dark:hover:text-white transition-colors flex items-center gap-1">
              <i class="fas fa-user-shield text-[9px] text-[#e88710]"></i> Admin
            </button>
            <span class="opacity-20">|</span>
            <button @click="router.push('/marcacion')"
              class="py-1 px-3 rounded-lg hover:text-[#e88710] dark:hover:text-white transition-colors flex items-center gap-1">
              <i class="fas fa-fingerprint text-[9px] text-[#e88710]"></i> Marcación
            </button>
            <span class="opacity-20">|</span>
          </template>
          <button v-if="canVerSeriales" @click="router.push('/marcacion/seriales')"
            class="py-1 px-3 rounded-lg hover:text-[#e88710] dark:hover:text-white transition-colors flex items-center gap-1">
            <i class="fas fa-barcode text-[9px] text-[#e88710]"></i> Seriales
          </button>
        </div>

        <!-- ACCIONES DE CIERRE -->
        <div class="flex flex-col items-center gap-1 pt-1">
          <div class="flex items-center gap-3">
            <button @click="showCambioPasswordMarcacion = true"
              class="text-xs font-semibold text-zinc-400 hover:text-[#2563EB] dark:hover:text-[#e88710] transition-colors flex items-center gap-1">
              <i class="fas fa-key text-[10px]"></i> Contraseña
            </button>
            <span class="opacity-20 text-zinc-400">·</span>
            <button @click="logout"
              class="text-xs font-bold text-zinc-400 hover:text-[#2563EB] dark:hover:text-[#e88710] transition-colors">
              Cerrar Sesión
            </button>
          </div>
          <span class="text-[9px] font-semibold opacity-30 tracking-wider">WodenTrack Pro v3.0</span>
        </div>

      </footer>
    </div>
  </div>

  <!-- ── Modal Cambiar Contraseña (Marcación) ──────────────────────────────── -->
  <teleport to="body">
    <transition name="fade">
      <div v-if="showCambioPasswordMarcacion"
        class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        @click.self="cerrarCambioPasswordM">
        <div class="w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
          <div class="flex items-center justify-between px-5 py-4 border-b"
            :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <i class="fas fa-key text-blue-500 text-xs"></i>
              </div>
              <span class="text-sm font-bold" :class="isDark ? 'text-white' : 'text-slate-800'">Cambiar contraseña</span>
            </div>
            <button @click="cerrarCambioPasswordM"
              class="w-7 h-7 rounded-lg flex items-center justify-center opacity-40 hover:opacity-100 transition-colors"
              :class="isDark ? 'text-white hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'">
              <i class="fas fa-xmark text-xs"></i>
            </button>
          </div>
          <div class="px-5 py-4 space-y-3.5">
            <p class="text-[11px] leading-relaxed" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
              Al establecer una contraseña personal, deberás usarla para ingresar en lugar de tu cédula.
            </p>
            <div class="space-y-1">
              <label class="text-[11px] font-semibold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">Nueva contraseña</label>
              <div class="relative">
                <input v-model="pwFormM.nueva" :type="pwFormM.showNueva ? 'text' : 'password'"
                  placeholder="Mínimo 6 caracteres"
                  class="w-full h-10 rounded-xl px-3 pr-10 text-xs border outline-none transition-all"
                  :class="isDark ? 'bg-[#0B1120]/60 border-[#222938] text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'" />
                <button type="button" @click="pwFormM.showNueva = !pwFormM.showNueva"
                  class="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity"
                  :class="isDark ? 'text-white' : 'text-slate-500'">
                  <i :class="pwFormM.showNueva ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-xs"></i>
                </button>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-[11px] font-semibold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">Confirmar contraseña</label>
              <div class="relative">
                <input v-model="pwFormM.confirmar" :type="pwFormM.showConfirmar ? 'text' : 'password'"
                  placeholder="Repite la contraseña"
                  class="w-full h-10 rounded-xl px-3 pr-10 text-xs border outline-none transition-all"
                  :class="isDark ? 'bg-[#0B1120]/60 border-[#222938] text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'" />
                <button type="button" @click="pwFormM.showConfirmar = !pwFormM.showConfirmar"
                  class="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity"
                  :class="isDark ? 'text-white' : 'text-slate-500'">
                  <i :class="pwFormM.showConfirmar ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-xs"></i>
                </button>
              </div>
            </div>
            <transition name="fade">
              <p v-if="pwFormM.error" class="text-[11px] text-rose-500 flex items-center gap-1.5">
                <i class="fas fa-circle-exclamation"></i> {{ pwFormM.error }}
              </p>
              <p v-else-if="pwFormM.success" class="text-[11px] text-emerald-500 flex items-center gap-1.5">
                <i class="fas fa-circle-check"></i> {{ pwFormM.success }}
              </p>
            </transition>
          </div>
          <div class="px-5 pb-5 flex gap-2.5">
            <button @click="cerrarCambioPasswordM"
              class="flex-1 h-9 rounded-xl text-xs font-semibold border transition-all"
              :class="isDark ? 'border-[#222938] text-slate-400 hover:text-white hover:border-slate-500' : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300'">
              Cancelar
            </button>
            <button @click="guardarPasswordM" :disabled="pwFormM.loading"
              class="flex-1 h-9 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
              <div v-if="pwFormM.loading" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span v-else><i class="fas fa-check mr-1"></i>Guardar</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>

  <!-- ══════════════════════════════════════════════════════════════════════════
        MODAL NOVEDAD COLECTIVA CORREGIDO PARA MODO CLARO
  ══════════════════════════════════════════════════════════════════════════════ -->
  <teleport to="body">
    <transition name="fade">
      <div v-if="showColectivaModal"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="closeColectiva">

        <div class="w-full max-w-lg rounded-2xl border shadow-xl flex flex-col max-h-[85vh] overflow-hidden"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-transparent'">

          <!-- HEADER MODAL -->
          <div class="flex items-center justify-between px-5 py-4 border-b shrink-0"
            :class="isDark ? 'border-[#222938]' : 'border-zinc-100'">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-[#e88710]/10 flex items-center justify-center text-[#e88710]">
                <i class="fas fa-users text-xs"></i>
              </div>
              <span class="text-sm font-bold tracking-tight" :class="isDark ? 'text-white' : 'text-[#111827]'">Novedad
                Colectiva</span>
            </div>
            <button @click="closeColectiva"
              class="w-7 h-7 flex items-center justify-center rounded-full opacity-40 hover:opacity-100 hover:bg-zinc-500/10 transition-all">
              <i class="fas fa-times text-xs"></i>
            </button>
          </div>

          <!-- ÁREA CON SCROLL INTERNO CORRECTO -->
          <div class="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-none">

            <!-- Formulario de Fechas -->
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1 text-left">
                <label class="text-[11px] font-bold opacity-60">Fecha Inicio</label>
                <input type="date" v-model="cForm.fechaInicio"
                  class="px-3 py-2 rounded-xl border text-xs font-semibold outline-none"
                  :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white [color-scheme:dark]' : 'bg-[#F4F6FA] border-slate-200 text-zinc-800'" />
              </div>
              <div class="flex flex-col gap-1 text-left">
                <label class="text-[11px] font-bold opacity-60">Fecha Fin</label>
                <input type="date" v-model="cForm.fechaFin"
                  class="px-3 py-2 rounded-xl border text-xs font-semibold outline-none"
                  :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white [color-scheme:dark]' : 'bg-[#F4F6FA] border-slate-200 text-zinc-800'" />
              </div>
            </div>

            <!-- Descripción -->
            <div class="flex flex-col gap-1 text-left">
              <label class="text-[11px] font-bold opacity-60">Descripción / Motivo</label>
              <textarea v-model="cForm.descripcion" rows="2" placeholder="Describe la novedad..."
                class="px-3 py-2 rounded-xl border text-xs font-medium outline-none resize-none placeholder:opacity-40"
                :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-[#F4F6FA] border-slate-200 text-zinc-800'"></textarea>
            </div>

            <!-- Listado y Buscador de Empleados -->
            <div class="space-y-2 text-left">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label class="text-[11px] font-bold opacity-60">
                  Selección de Personal <span class="font-medium">({{ selectedEmployees.length }} seleccionados)</span>
                </label>

                <div class="flex items-center gap-2">
                  <div class="relative">
                    <i class="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] opacity-40"></i>
                    <input v-model="empSearch" type="text" placeholder="Buscar..."
                      class="pl-7 pr-2 py-1 text-[11px] rounded-lg border outline-none w-28"
                      :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-[#F4F6FA] border-slate-200 text-zinc-700'" />
                  </div>
                  <button @click="toggleSelectAll" type="button"
                    class="px-2 py-1 rounded-lg text-[10px] font-bold border transition-all"
                    :class="allSelected ? 'bg-[#2563EB]/10 border-transparent text-[#2563EB]' : 'border-slate-300 dark:border-[#222938] opacity-60'">
                    {{ allSelected ? 'Quitar todos' : 'Todos' }}
                  </button>
                </div>
              </div>

              <!-- Loading Empleados -->
              <div v-if="loadingEmpleados" class="flex items-center justify-center py-6 gap-2 opacity-60">
                <div class="w-4 h-4 border-2 border-t-transparent border-[#e88710] rounded-full animate-spin"></div>
                <span class="text-xs font-medium">Buscando nómina...</span>
              </div>

              <!-- Lista interna con Scroll Propio Aislado -->
              <div v-else class="max-h-40 overflow-y-auto rounded-xl border divide-y scrollbar-none"
                :class="isDark ? 'border-[#222938] divide-[#222938]/60' : 'border-slate-200 divide-slate-100'">

                <div v-if="!filteredEmployees.length" class="px-4 py-6 text-center text-xs opacity-40">
                  Sin resultados disponibles
                </div>

                <label v-for="emp in filteredEmployees" :key="emp.cc"
                  class="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all"
                  :class="isSelected(emp) ? (isDark ? 'bg-[#e88710]/10' : 'bg-orange-50') : (isDark ? 'hover:bg-[#0B0F19]' : 'hover:bg-zinc-50')">
                  <input type="checkbox" :checked="isSelected(emp)" @change="toggleEmployee(emp)"
                    class="accent-[#e88710] w-3.5 h-3.5 cursor-pointer" />
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold uppercase truncate" :class="isDark ? 'text-white' : 'text-[#111827]'">{{
                      emp.nombre }}</p>
                    <p class="text-[10px] opacity-50 truncate">{{ emp.cc }} · {{ emp.cargo || 'Operario' }}</p>
                  </div>
                  <span v-if="isSelected(emp)"
                    class="w-4 h-4 rounded-full bg-[#e88710] flex items-center justify-center shrink-0">
                    <i class="fas fa-check text-white text-[8px]"></i>
                  </span>
                </label>
              </div>
            </div>

            <!-- Alertas de estado en el modal -->
            <transition name="fade">
              <div v-if="cStatus.msg" class="p-3 rounded-xl text-xs font-semibold border flex items-center gap-2"
                :class="cStatus.type === 'ok' ? 'bg-emerald-500/10 border-transparent text-emerald-500' : 'bg-rose-500/10 border-transparent text-rose-500'">
                <i :class="cStatus.type === 'ok' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
                {{ cStatus.msg }}
              </div>
            </transition>
          </div>

          <!-- FOOTER DEL MODAL -->
          <div class="px-5 py-4 border-t shrink-0 flex items-center justify-between gap-3"
            :class="isDark ? 'border-[#222938] bg-[#0B0F19]' : 'border-zinc-100 bg-zinc-50'">
            <button @click="closeColectiva" type="button"
              class="px-4 py-2 rounded-xl text-xs font-bold border transition-all"
              :class="isDark ? 'border-[#222938] text-zinc-400 hover:text-white' : 'border-slate-200 text-zinc-600 hover:bg-zinc-100'">
              Cancelar
            </button>
            <button @click="submitColectiva" :disabled="submittingColectiva || !canSubmitColectiva"
              class="px-5 py-2 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
              <i v-if="submittingColectiva" class="fas fa-circle-notch fa-spin text-xs"></i>
              <span>{{ submittingColectiva ? 'Enviando...' : `Aplicar a ${selectedEmployees.length}` }}</span>
            </button>
          </div>

        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}

.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
<script setup>
import { apiFetch } from '@/utils/apiFetch.js';
import '../assets/css/marcacion-style.css';
import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAttendance } from '../composables/UserLogica/useAttendance.js';
import MarcacionAsistenciaEcuador from '../components/MarcacionAsistenciaEcuador.vue';
import axios from 'axios';

const router = useRouter();
const { employee, currentTime, handleAttendance, logout, loading, isDark, toggleTheme } = useAttendance();

const API_URL = import.meta.env.VITE_API_URL;

// Primer nombre de pila para el saludo. Convención colombiana del nombre
// completo: "Apellido1 Apellido2 Nombre1 [Nombre2]" (p. ej. "AGUDELO PITA
// ELDER DANIEL" → "Elder"). Con 4+ palabras se asume 2 apellidos y se toma la
// 3ra; con menos, se ajusta proporcionalmente.
const primerNombre = computed(() => {
  const partes = (employee.value?.name || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '';
  const idx = partes.length >= 3 ? 2 : partes.length - 1;
  const nombre = partes[idx] || '';
  return nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();
});

// ── Permiso para ver el botón ──────────────────────────────────────────────
const canRegistrarNovedad = computed(() =>
  employee.value?.isSuperAdmin ||
  employee.value?.permisos?.['marcacion.novedad'] === true
);

const canVerSeriales = computed(() =>
  employee.value?.isSuperAdmin ||
  employee.value?.permisos?.['admin.marcacion_seriales'] === true
);

// Solo para usuarios Ecuador (por company o pais) con permiso ecuador.marcacion
const canMarcacionEcuador = computed(() => {
  const emp = employee.value;
  if (!emp) return false;
  const esEcuador =
    emp.company?.toLowerCase().includes('ecuador') ||
    emp.pais?.toLowerCase() === 'ecuador';
  const tienePermiso =
    emp.isSuperAdmin || emp.permisos?.['ecuador.marcacion'] === true;
  return esEcuador && tienePermiso;
});

// ── Modal elección ─────────────────────────────────────────────────────────
const showChoiceModal = ref(false);

const goIndividual = () => {
  showChoiceModal.value = false;
  router.push('/novedad');
};

// ── Modal colectiva ────────────────────────────────────────────────────────
const showColectivaModal = ref(false);
const loadingEmpleados = ref(false);
const empleados = ref([]);
const empSearch = ref('');
const selectedEmployees = ref([]);
const submittingColectiva = ref(false);
const cProgress = ref({ current: 0, total: 0 });
const cStatus = ref({ msg: '', type: '' });

const cForm = ref({
  fechaInicio: '',
  fechaFin: '',
  descripcion: '',
});

const filteredEmployees = computed(() => {
  const q = empSearch.value.toLowerCase();
  if (!q) return empleados.value;
  return empleados.value.filter(e =>
    e.nombre?.toLowerCase().includes(q) ||
    e.cc?.toString().includes(q) ||
    e.cargo?.toLowerCase().includes(q)
  );
});

const allSelected = computed(() =>
  filteredEmployees.value.length > 0 &&
  filteredEmployees.value.every(e => isSelected(e))
);

const canSubmitColectiva = computed(() =>
  selectedEmployees.value.length > 0 &&
  cForm.value.fechaInicio &&
  cForm.value.fechaFin &&
  cForm.value.fechaFin >= cForm.value.fechaInicio &&
  cForm.value.descripcion.trim()
);

const isSelected = (emp) =>
  selectedEmployees.value.some(e => e.cc === emp.cc);

const toggleEmployee = (emp) => {
  const idx = selectedEmployees.value.findIndex(e => e.cc === emp.cc);
  if (idx >= 0) selectedEmployees.value.splice(idx, 1);
  else selectedEmployees.value.push(emp);
};

const toggleSelectAll = () => {
  if (allSelected.value) {
    // Quitar los del filtro actual
    const ccsFiltrados = new Set(filteredEmployees.value.map(e => e.cc));
    selectedEmployees.value = selectedEmployees.value.filter(e => !ccsFiltrados.has(e.cc));
  } else {
    // Agregar los del filtro que no estén ya
    filteredEmployees.value.forEach(e => {
      if (!isSelected(e)) selectedEmployees.value.push(e);
    });
  }
};

const fetchEmpleados = async () => {
  try {
    loadingEmpleados.value = true;
    const emp = employee.value || {};
    const params = new URLSearchParams({ t: Date.now() });
    if (emp.company) params.append('company', emp.company);
    const permisos = emp.permisos || {};
    if (!emp.isSuperAdmin && !permisos['admin.filtro_departamento'] && emp.department) {
      params.append('departamento', emp.department);
    }
    const res = await axios.get(`${API_URL}/mallas?${params}`);
    empleados.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    console.error('Error cargando empleados:', e);
    empleados.value = [];
  } finally {
    loadingEmpleados.value = false;
  }
};

const openColectiva = async () => {
  showChoiceModal.value = false;
  cForm.value = { fechaInicio: '', fechaFin: '', descripcion: '' };
  selectedEmployees.value = [];
  empSearch.value = '';
  cStatus.value = { msg: '', type: '' };
  showColectivaModal.value = true;
  await fetchEmpleados();
};

const closeColectiva = () => {
  if (submittingColectiva.value) return;
  showColectivaModal.value = false;
};

const submitColectiva = async () => {
  if (!canSubmitColectiva.value) return;

  submittingColectiva.value = true;
  cProgress.value = { current: 0, total: selectedEmployees.value.length };
  cStatus.value = { msg: `Enviando 0/${selectedEmployees.value.length}...`, type: 'loading' };

  const errores = [];

  for (const emp of selectedEmployees.value) {
    try {
      const fd = new FormData();
      fd.append('nombre', emp.nombre);
      fd.append('cedula', emp.cc);
      fd.append('descripcion', cForm.value.descripcion);
      fd.append('fechaInicio', cForm.value.fechaInicio);
      fd.append('fechaFin', cForm.value.fechaFin);
      fd.append('storageMode', 'local');
      fd.append('creadoPor', employee.value?.id_odoo ?? '');

      await axios.post(`${API_URL}/novedades`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      cProgress.value.current++;
      cStatus.value.msg = `Enviando ${cProgress.value.current}/${cProgress.value.total}...`;
    } catch {
      errores.push(emp.nombre);
    }
  }

  submittingColectiva.value = false;

  if (errores.length === 0) {
    cStatus.value = {
      msg: `✓ Novedad aplicada a ${cProgress.value.total} empleado${cProgress.value.total !== 1 ? 's' : ''} correctamente.`,
      type: 'ok',
    };
    setTimeout(() => closeColectiva(), 2500);
  } else {
    cStatus.value = {
      msg: `Completado con ${errores.length} error${errores.length !== 1 ? 'es' : ''}. Fallaron: ${errores.slice(0, 3).join(', ')}${errores.length > 3 ? '...' : ''}`,
      type: 'error',
    };
  }
};

// ── Modal cambio de contraseña (Marcación) ────────────────────────────────────
const showCambioPasswordMarcacion = ref(false);
const pwFormM = reactive({
  nueva: '', confirmar: '', loading: false,
  error: '', success: '', showNueva: false, showConfirmar: false,
});

const cerrarCambioPasswordM = () => {
  showCambioPasswordMarcacion.value = false;
  pwFormM.nueva = ''; pwFormM.confirmar = '';
  pwFormM.error = ''; pwFormM.success = '';
};

const guardarPasswordM = async () => {
  pwFormM.error = ''; pwFormM.success = '';
  if (!pwFormM.nueva || pwFormM.nueva.length < 6) {
    pwFormM.error = 'Mínimo 6 caracteres'; return;
  }
  if (pwFormM.nueva !== pwFormM.confirmar) {
    pwFormM.error = 'Las contraseñas no coinciden'; return;
  }
  pwFormM.loading = true;
  try {
    const res = await apiFetch(`${API_URL}/cambiar-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_odoo: employee.value?.id_odoo,
        nueva_password: pwFormM.nueva,
        confirmar_password: pwFormM.confirmar,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      pwFormM.success = '¡Contraseña actualizada!';
      setTimeout(() => cerrarCambioPasswordM(), 1500);
    } else {
      pwFormM.error = data.message || 'Error al cambiar la contraseña';
    }
  } catch {
    pwFormM.error = 'Error de conexión';
  } finally {
    pwFormM.loading = false;
  }
};
</script>

<style scoped>
.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.2s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}


.fade-msg-enter-active,
.fade-msg-leave-active {
  transition: all 0.3s ease;
}

.fade-msg-enter-from,
.fade-msg-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
