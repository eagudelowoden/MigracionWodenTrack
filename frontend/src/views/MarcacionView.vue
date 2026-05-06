<template>
  <div v-if="employee"
    class="min-h-screen flex flex-col items-center justify-between p-8 transition-all duration-500 font-sans"
    :class="isDark ? 'bg-[#060a14] theme-dark text-white' : 'bg-[#f8fafc] theme-light text-[#1e293b]'">

    <header class="w-full max-w-[450px] flex items-center justify-between px-2">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-[#ff8f00] flex items-center justify-center shadow-lg">
          <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase text-[#ff8f00] tracking-widest opacity-80">Registra marcación</p>
          <h2 class="text-base font-black uppercase tracking-tight">{{ employee.name }}</h2>
        </div>
      </div>

      <button @click="toggleTheme" class="theme-toggle active:scale-90 p-3 rounded-xl border transition-all"
        :class="isDark ? 'bg-white/5 border-white/10 text-yellow-400' : 'bg-white border-slate-200 text-slate-500'">
        <span v-if="isDark">☀️</span><span v-else>🌙</span>
      </button>
    </header>

    <main class="text-center">
      <h1 class="clock-main-display tabular-nums mb-2">
        {{ currentTime?.split(' ')[0] }}
      </h1>
      <p class="text-2xl font-black text-[#ff8f00] tracking-[0.3em] uppercase opacity-90">
        {{ currentTime?.split(' ')[1] }}
      </p>

      <div v-if="employee.day_completed"
        class="mt-4 px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <span class="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Jornada Finalizada hoy</span>
      </div>
    </main>

    <footer class="w-full max-w-[450px] space-y-3">

      <!-- Botones entrada / salida -->
      <div class="action-grid grid grid-cols-2 gap-4">
        <button @click="handleAttendance" :disabled="loading || employee.is_inside || employee.day_completed"
          class="action-card btn-entrada group disabled:opacity-20 disabled:grayscale active:scale-95 transition-all"
          :class="{ 'border-emerald-500/50': employee.day_completed }">
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-white/10 shadow-sm transition-transform group-hover:not-disabled:scale-110">
            <svg v-if="employee.day_completed" class="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14" />
            </svg>
          </div>
          <span class="text-[10px] font-black uppercase tracking-widest">
            {{ employee.day_completed ? 'Completado' : (employee.is_inside ? 'Ya ingresaste' : 'Entrada') }}
          </span>
        </button>

        <button @click="handleAttendance" :disabled="loading || !employee.is_inside || employee.day_completed"
          class="action-card btn-salida group disabled:opacity-20 disabled:grayscale active:scale-95 transition-all">
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-white/10 shadow-sm transition-transform group-hover:not-disabled:scale-110">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
            </svg>
          </div>
          <span class="text-[10px] font-black uppercase tracking-widest">
            {{ employee.day_completed ? 'Finalizado' : 'Salida' }}
          </span>
        </button>
      </div>

      <!-- Separador -->
      <div class="flex items-center gap-3 px-1">
        <div class="flex-1 h-px" :class="isDark ? 'bg-white/5' : 'bg-slate-200'"></div>
        <span class="text-[8px] font-black uppercase tracking-[0.2em] opacity-30">Gestión</span>
        <div class="flex-1 h-px" :class="isDark ? 'bg-white/5' : 'bg-slate-200'"></div>
      </div>

      <!-- Botón Registrar Novedad — solo si tiene permiso -->
      <!-- <button v-if="canRegistrarNovedad" @click="showChoiceModal = true"
        class="w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all duration-300 active:scale-95 group"
        :class="isDark
          ? 'border-white/8 bg-white/3 hover:border-[#ff8f00]/40 hover:bg-[#ff8f00]/5'
          : 'border-slate-200 bg-white hover:border-[#ff8f00]/40 hover:bg-[#ff8f00]/5 shadow-sm'">
        <div class="flex items-center gap-2">
          <div
            class="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:bg-[#ff8f00] group-hover:text-black"
            :class="isDark ? 'bg-white/8 text-slate-400' : 'bg-slate-100 text-slate-500'">
            <i class="fas fa-file-signature text-[9px]"></i>
          </div>
          <div class="text-left">
            <p class="text-[9px] font-black uppercase tracking-widest transition-colors group-hover:text-[#ff8f00]"
              :class="isDark ? 'text-slate-300' : 'text-slate-700'">Registrar Novedad</p>
            <p class="text-[7px] font-bold uppercase tracking-widest opacity-30"
              :class="isDark ? 'text-slate-500' : 'text-slate-400'">Permisos · Incapacidades</p>
          </div>
        </div>
        <i
          class="fas fa-chevron-right text-[8px] opacity-20 group-hover:opacity-60 group-hover:text-[#ff8f00] transition-all group-hover:translate-x-0.5"></i>
      </button> -->

      <!-- Dev Nav -->
      <div v-if="employee?.isSuperAdmin" class="flex items-center justify-center gap-3 pt-2">
        <button @click="router.push('/super-admin')" title="Super Admin"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all hover:border-[#FF8F00]/60 hover:text-[#FF8F00]"
          :class="isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-400'">
          <i class="fas fa-shield-halved text-[#FF8F00]"></i> Super
        </button>
        <button @click="router.push('/admin')" title="Admin"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all hover:border-[#FF8F00]/60 hover:text-[#FF8F00]"
          :class="isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-400'">
          <i class="fas fa-user-shield text-[#FF8F00]"></i> Admin
        </button>
        <button @click="router.push('/marcacion')" title="Marcación"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all hover:border-[#FF8F00]/60 hover:text-[#FF8F00]"
          :class="isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-400'">
          <i class="fas fa-fingerprint text-[#FF8F00]"></i> Mark
        </button>
      </div>

      <!-- Cerrar sesión -->
      <div class="flex flex-col items-center gap-2 pt-2">
        <button @click="logout"
          class="text-[10px] font-black uppercase tracking-widest transition-colors hover:text-[#ff8f00]">
          Cerrar Sesión
        </button>
        <span class="text-[9px] font-bold uppercase tracking-widest opacity-40">WodenTrack Pro</span>
      </div>

    </footer>
  </div>

  <!-- ══════════════════════════════════════════════════════════════════════════
       MODAL ELECCIÓN: Individual / Colectiva
  ══════════════════════════════════════════════════════════════════════════════ -->
  <teleport to="body">
    <transition name="fade-modal">
      <div v-if="showChoiceModal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        style="background:rgba(0,0,0,0.6);" @click.self="showChoiceModal = false">

        <div class="w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden"
          :class="isDark ? 'bg-[#1e2538] border-white/10' : 'bg-white border-slate-200'">

          <!-- Header -->
          <!-- <div class="flex items-center justify-between px-5 py-4 border-b"
            :class="isDark ? 'border-white/10' : 'border-slate-100'">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-xl bg-[#ff8f00]/15 flex items-center justify-center">
                <i class="fas fa-file-signature text-[#ff8f00] text-xs"></i>
              </div>
              <span class="text-[12px] font-black uppercase tracking-widest"
                :class="isDark ? 'text-white' : 'text-slate-800'">Registrar Novedad</span>
            </div>
            <button @click="showChoiceModal = false"
              class="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
              :class="isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:bg-slate-100'">
              <i class="fas fa-times text-xs"></i>
            </button>
          </div> -->

          <!-- Opciones -->
          <div class="p-4 flex flex-col gap-3">

            <!-- Individual -->
            <button @click="goIndividual"
              class="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 transition-all group" :class="isDark
                ? 'border-[#ff8f00]/30 bg-[#ff8f00]/5 hover:bg-[#ff8f00]/15 hover:border-[#ff8f00]/60'
                : 'border-[#ff8f00]/30 bg-orange-50 hover:bg-orange-100 hover:border-[#ff8f00]/60'">
              <div
                class="w-10 h-10 rounded-xl bg-[#ff8f00] flex items-center justify-center shrink-0 shadow-md shadow-orange-500/30 group-hover:scale-105 transition-transform">
                <i class="fas fa-user text-white text-sm"></i>
              </div>
              <div class="text-left">
                <p class="text-[12px] font-black" :class="isDark ? 'text-white' : 'text-slate-800'">Mi Novedad</p>
                <p class="text-[10px] font-medium opacity-60" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                  Registrar solo para mí
                </p>
              </div>
              <i class="fas fa-chevron-right text-[10px] ml-auto opacity-30 group-hover:opacity-70 group-hover:translate-x-0.5 transition-all"
                :class="isDark ? 'text-slate-300' : 'text-slate-600'"></i>
            </button>

            <!-- Colectiva -->
            <!-- <button @click="openColectiva"
              class="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 transition-all group"
              :class="isDark
                ? 'border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/15 hover:border-violet-500/60'
                : 'border-violet-400/30 bg-violet-50 hover:bg-violet-100 hover:border-violet-400/60'">
              <div class="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center shrink-0 shadow-md shadow-violet-500/30 group-hover:scale-105 transition-transform">
                <i class="fas fa-users text-white text-sm"></i>
              </div>
              <div class="text-left">
                <p class="text-[12px] font-black" :class="isDark ? 'text-white' : 'text-slate-800'">Novedad Colectiva</p>
                <p class="text-[10px] font-medium opacity-60" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                  Aplicar a uno o varios empleados
                </p>
              </div>
              <i class="fas fa-chevron-right text-[10px] ml-auto opacity-30 group-hover:opacity-70 group-hover:translate-x-0.5 transition-all"
                :class="isDark ? 'text-slate-300' : 'text-slate-600'"></i>
            </button> -->

          </div>
        </div>
      </div>
    </transition>
  </teleport>

  <!-- ══════════════════════════════════════════════════════════════════════════
       MODAL NOVEDAD COLECTIVA
  ══════════════════════════════════════════════════════════════════════════════ -->
  <teleport to="body">
    <transition name="fade-modal">
      <div v-if="showColectivaModal" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background:rgba(0,0,0,0.65);" @click.self="closeColectiva">

        <div class="w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh]"
          :class="isDark ? 'bg-[#1e2538] border-white/10' : 'bg-white border-slate-200'">

          <!-- Header modal colectiva -->
          <div class="flex items-center justify-between px-5 py-4 border-b shrink-0"
            :class="isDark ? 'border-white/10' : 'border-slate-100'">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <i class="fas fa-users text-violet-400 text-xs"></i>
              </div>
              <span class="text-[12px] font-black uppercase tracking-widest"
                :class="isDark ? 'text-white' : 'text-slate-800'">Novedad Colectiva</span>
            </div>
            <button @click="closeColectiva" class="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
              :class="isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:bg-slate-100'">
              <i class="fas fa-times text-xs"></i>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

            <!-- Formulario -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <!-- Fecha inicio -->
              <div class="flex flex-col gap-1">
                <label class="text-[9px] font-black uppercase tracking-widest"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Fecha Inicio</label>
                <input type="date" v-model="cForm.fechaInicio"
                  class="px-3 py-2 rounded-lg border text-xs font-bold outline-none transition-all"
                  :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white [color-scheme:dark]' : 'bg-white border-slate-200 text-slate-800'" />
              </div>

              <!-- Fecha fin -->
              <div class="flex flex-col gap-1">
                <label class="text-[9px] font-black uppercase tracking-widest"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Fecha Fin</label>
                <input type="date" v-model="cForm.fechaFin"
                  class="px-3 py-2 rounded-lg border text-xs font-bold outline-none transition-all"
                  :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white [color-scheme:dark]' : 'bg-white border-slate-200 text-slate-800'" />
              </div>

              <!-- Descripción -->
              <div class="sm:col-span-2 flex flex-col gap-1">
                <label class="text-[9px] font-black uppercase tracking-widest"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Descripción / Motivo</label>
                <textarea v-model="cForm.descripcion" rows="2" placeholder="Motivo de la novedad..."
                  class="px-3 py-2 rounded-lg border text-xs font-medium outline-none resize-none transition-all placeholder:text-slate-500"
                  :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white' : 'bg-white border-slate-200 text-slate-800'">
                </textarea>
              </div>

            </div>

            <!-- Lista de empleados -->
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <label class="text-[9px] font-black uppercase tracking-widest"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                  Empleados
                  <span class="ml-2 font-medium normal-case opacity-60">
                    ({{ selectedEmployees.length }} seleccionados)
                  </span>
                </label>
                <div class="flex items-center gap-2">
                  <!-- Buscador -->
                  <div class="relative">
                    <i class="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400"></i>
                    <input v-model="empSearch" type="text" placeholder="Buscar..."
                      class="pl-7 pr-2 py-1 text-[10px] rounded-lg border outline-none w-32 transition-all"
                      :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white' : 'bg-white border-slate-200 text-slate-700'" />
                  </div>
                  <!-- Seleccionar todos -->
                  <button @click="toggleSelectAll" type="button"
                    class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border transition-all"
                    :class="allSelected
                      ? (isDark ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'bg-violet-100 border-violet-300 text-violet-700')
                      : (isDark ? 'border-white/10 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800')">
                    {{ allSelected ? 'Quitar todos' : 'Todos' }}
                  </button>
                </div>
              </div>

              <!-- Loading empleados -->
              <div v-if="loadingEmpleados" class="flex items-center justify-center py-6 gap-2"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                <i class="fas fa-circle-notch fa-spin text-[#ff8f00]"></i>
                <span class="text-[10px] font-bold uppercase">Cargando empleados...</span>
              </div>

              <!-- Lista -->
              <div v-else class="max-h-48 overflow-y-auto rounded-xl border divide-y"
                :class="isDark ? 'border-white/10 divide-white/5' : 'border-slate-200 divide-slate-100'">

                <div v-if="!filteredEmployees.length"
                  class="px-4 py-6 text-center text-[10px] font-bold uppercase opacity-40"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                  Sin empleados disponibles
                </div>

                <label v-for="emp in filteredEmployees" :key="emp.cc"
                  class="flex items-center gap-3 px-3 py-2 cursor-pointer transition-all" :class="isSelected(emp)
                    ? (isDark ? 'bg-violet-500/10' : 'bg-violet-50')
                    : (isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50')">
                  <input type="checkbox" :checked="isSelected(emp)" @change="toggleEmployee(emp)"
                    class="accent-violet-500 w-3.5 h-3.5 cursor-pointer" />
                  <div class="flex-1 min-w-0">
                    <p class="text-[11px] font-bold uppercase truncate"
                      :class="isDark ? 'text-white' : 'text-slate-800'">{{ emp.nombre }}</p>
                    <p class="text-[9px] opacity-50 truncate" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                      {{ emp.cc }} · {{ emp.cargo || '—' }}
                    </p>
                  </div>
                  <span v-if="isSelected(emp)"
                    class="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
                    <i class="fas fa-check text-white text-[7px]"></i>
                  </span>
                </label>
              </div>
            </div>

            <!-- Estado del envío -->
            <transition name="fade-msg">
              <div v-if="cStatus.msg"
                class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[11px] font-bold border" :class="cStatus.type === 'ok'
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : cStatus.type === 'error'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'">
                <i
                  :class="cStatus.type === 'ok' ? 'fas fa-check-circle' : cStatus.type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-circle-notch fa-spin'"></i>
                {{ cStatus.msg }}
              </div>
            </transition>

          </div>

          <!-- Footer -->
          <div class="px-5 py-4 border-t shrink-0 flex items-center justify-between gap-3"
            :class="isDark ? 'border-white/10 bg-[#161b2c]' : 'border-slate-100 bg-slate-50'">
            <button @click="closeColectiva" type="button"
              class="px-4 py-2 rounded-xl text-[11px] font-bold uppercase border transition-all"
              :class="isDark ? 'border-white/15 text-slate-300 hover:text-white' : 'border-slate-200 text-slate-600'">
              Cancelar
            </button>
            <button @click="submitColectiva" :disabled="submittingColectiva || !canSubmitColectiva"
              class="px-5 py-2 rounded-xl text-[11px] font-black uppercase bg-violet-500 hover:bg-violet-600 text-white transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <i v-if="submittingColectiva" class="fas fa-circle-notch fa-spin text-xs"></i>
              <i v-else class="fas fa-paper-plane text-xs"></i>
              {{ submittingColectiva ? `Enviando ${cProgress.current}/${cProgress.total}...` : `Aplicar a
              ${selectedEmployees.length} empleado${selectedEmployees.length !== 1 ? 's' : ''}` }}
            </button>
          </div>

        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import '../assets/css/marcacion-style.css';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAttendance } from '../composables/UserLogica/useAttendance.js';
import axios from 'axios';

const router = useRouter();
const { employee, currentTime, handleAttendance, logout, loading, isDark, toggleTheme } = useAttendance();

const API_URL = import.meta.env.VITE_API_URL;
const session = JSON.parse(localStorage.getItem('user_session') || '{}');

// ── Permiso para ver el botón ──────────────────────────────────────────────
const canRegistrarNovedad = computed(() =>
  employee.value?.isSuperAdmin ||
  employee.value?.permisos?.['marcacion.novedad'] === true
);

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
    const params = new URLSearchParams({ t: Date.now() });
    if (session.company) params.append('company', session.company);
    // Si no es superAdmin ni tiene filtro_departamento, filtra por su depto
    const permisos = session.permisos || {};
    if (!session.isSuperAdmin && !permisos['admin.filtro_departamento'] && session.department) {
      params.append('departamento', session.department);
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
      fd.append('creadoPor', session.id_odoo ?? '');

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
