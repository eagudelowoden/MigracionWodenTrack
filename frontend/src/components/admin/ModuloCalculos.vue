<template>
  <div class="flex flex-col gap-4 animate-fade-in">

    <!-- Filtros + acciones -->
    <div class="rounded-xl border p-4"
      :class="isDark ? 'bg-[#273045] border-white/5' : 'bg-white border-slate-200 shadow-sm'">

      <div class="flex flex-wrap items-end gap-3">

        <!-- Fecha inicio -->
        <div class="flex flex-col gap-1">
          <label class="text-[9px] font-black uppercase tracking-widest"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Desde</label>
          <input type="date" v-model="startDate"
            class="text-[11px] font-semibold px-3 py-1.5 rounded-lg border outline-none transition-colors" :class="isDark
              ? 'bg-[#1e293b] border-white/10 text-white focus:border-[#FF8F00]'
              : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-[#FF8F00]'" />
        </div>

        <!-- Fecha fin -->
        <div class="flex flex-col gap-1">
          <label class="text-[9px] font-black uppercase tracking-widest"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Hasta</label>
          <input type="date" v-model="endDate"
            class="text-[11px] font-semibold px-3 py-1.5 rounded-lg border outline-none transition-colors" :class="isDark
              ? 'bg-[#1e293b] border-white/10 text-white focus:border-[#FF8F00]'
              : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-[#FF8F00]'" />
        </div>

        <!-- Filtro departamento — solo admins con permiso o superadmin -->
        <div v-if="tieneFiltroDepartamento && departamentos.length" class="flex flex-col gap-1">
          <label class="text-[9px] font-black uppercase tracking-widest"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Departamento</label>
          <select v-model="selectedDepartamento"
            class="text-[11px] font-semibold px-3 py-1.5 rounded-lg border outline-none transition-colors" :class="isDark
              ? 'bg-[#1e293b] border-white/10 text-white focus:border-[#FF8F00]'
              : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-[#FF8F00]'">
            <option value="">Todos los departamentos</option>
            <option v-for="d in departamentos" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>

        <!-- Toggle solo con extras -->
        <label class="flex items-center gap-2 cursor-pointer select-none self-end mb-0.5">
          <div class="relative">
            <input type="checkbox" v-model="soloConExtras" class="sr-only peer" />
            <div class="w-8 h-4 rounded-full transition-colors peer-checked:bg-[#FF8F00]"
              :class="isDark ? 'bg-white/10' : 'bg-slate-200'"></div>
            <div
              class="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform peer-checked:translate-x-4 shadow-sm">
            </div>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-wide"
            :class="isDark ? 'text-slate-300' : 'text-slate-600'">Solo con extras</span>
        </label>

        <!-- Indicador de área/segmento activo (para no-superadmin sin filtro_departamento) -->
        <div v-if="!tieneFiltroDepartamento && (areaActiva || segmentoActivo)"
          class="self-end mb-0.5 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-semibold"
          :class="isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'">
          <i class="fas fa-filter text-[8px]"></i>
          Viendo tu área asignada
        </div>

        <!-- ── Tres botones principales ── -->
        <div class="flex gap-2 ml-auto flex-wrap">

          <!-- CALCULAR -->
          <button @click="calcular" :disabled="loadingCalc || !fechasValidas"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all"
            :class="loadingCalc || !fechasValidas
              ? 'opacity-40 cursor-not-allowed bg-[#FF8F00]/40 text-white'
              : 'bg-[#FF8F00] hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20'">
            <i class="fas" :class="loadingCalc ? 'fa-spinner fa-spin' : 'fa-calculator'"></i>
            {{ loadingCalc ? 'Calculando...' : 'Calcular' }}
          </button>

          <!-- GUARDAR -->
          <button @click="guardar" :disabled="loadingGuardar || !hayResultados"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide border transition-all"
            :class="loadingGuardar || !hayResultados
              ? 'opacity-40 cursor-not-allowed border-slate-300 text-slate-400'
              : isDark
                ? 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10'
                : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50'">
            <i class="fas" :class="loadingGuardar ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>
            {{ loadingGuardar ? 'Guardando...' : 'Guardar' }}
          </button>

          <!-- DESCARGAR -->
          <button @click="descargar" :disabled="!hayResultados"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide border transition-all"
            :class="!hayResultados
              ? 'opacity-40 cursor-not-allowed border-slate-300 text-slate-400'
              : isDark
                ? 'border-blue-500/50 text-blue-400 hover:bg-blue-500/10'
                : 'border-blue-500 text-blue-600 hover:bg-blue-50'">
            <i class="fas fa-file-excel text-xs"></i>
            Descargar
          </button>

          <!-- Historial -->
          <button @click="toggleHistorial"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-semibold border transition-all" :class="verHistorial
              ? 'bg-[#FF8F00]/10 border-[#FF8F00]/40 text-[#FF8F00]'
              : isDark
                ? 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'">
            <i class="fas fa-history text-xs"></i>
            Historial
          </button>

        </div>
      </div>

      <!-- Toast inline -->
      <div v-if="toast.msg" class="mt-3 pt-3 border-t flex items-center gap-2 text-[10px] font-semibold" :class="[
        isDark ? 'border-white/5' : 'border-slate-100',
        toast.type === 'success' ? 'text-emerald-500'
          : toast.type === 'error' ? 'text-rose-500'
            : 'text-[#FF8F00]'
      ]">
        <i class="fas" :class="toast.type === 'success' ? 'fa-circle-check'
          : toast.type === 'error' ? 'fa-circle-exclamation'
            : 'fa-circle-info'"></i>
        {{ toast.msg }}
      </div>

      <!-- Resumen -->
      <div v-if="hayResultados && !verHistorial" class="mt-3 pt-3 border-t flex flex-wrap gap-5"
        :class="isDark ? 'border-white/5' : 'border-slate-100'">
        <div class="text-[10px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          <span class="font-black" :class="isDark ? 'text-white' : 'text-slate-800'">
            {{ filtrados.length }}
          </span>
          registros{{ filtrados.length !== resultados.length ? ` (de ${resultados.length})` : '' }}
        </div>
        <div class="text-[10px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          <span class="font-black text-[#FF8F00]">{{ conExtras }}</span> con horas extra
        </div>
        <div class="text-[10px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Total: <span class="font-black text-emerald-500">{{ formatMinutos(totalMinutos) }}</span>
        </div>
        <div v-if="guardado" class="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
          <i class="fas fa-check-circle text-[9px]"></i> Guardado en base de datos
        </div>
      </div>
    </div>

    <!-- Tabla resultados -->
    <div v-if="!verHistorial && tablaVisible.length" class="rounded-xl border overflow-hidden"
      :class="isDark ? 'border-white/5 bg-[#273045]' : 'border-slate-200 bg-white shadow-sm'">

      <div class="overflow-x-auto custom-scroll">
        <table class="w-full text-[10px]">
          <thead>
            <tr :class="isDark ? 'bg-[#1e293b] text-slate-400' : 'bg-slate-50 text-slate-500'">
              <th class="px-3 py-2 text-left font-black uppercase tracking-wide">Colaborador</th>
              <th class="px-3 py-2 text-left font-black uppercase tracking-wide">CC</th>
              <th class="px-3 py-2 text-left font-black uppercase tracking-wide">Depto</th>
              <th class="px-3 py-2 text-left font-black uppercase tracking-wide">Fecha</th>
              <th class="px-3 py-2 text-center font-black uppercase tracking-wide">Turno</th>
              <th class="px-3 py-2 text-center font-black uppercase tracking-wide">Entrada</th>
              <th class="px-3 py-2 text-center font-black uppercase tracking-wide">Salida</th>
              <th class="px-3 py-2 text-center font-black uppercase tracking-wide text-amber-500">Extra Entrada</th>
              <th class="px-3 py-2 text-center font-black uppercase tracking-wide text-blue-500">Extra Salida</th>
              <th class="px-3 py-2 text-center font-black uppercase tracking-wide text-emerald-500">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in tablaVisible" :key="i" class="border-t transition-colors" :class="[
              isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50',
              row.total_minutos_extra > 0 ? (isDark ? 'bg-[#FF8F00]/5' : 'bg-orange-50/40') : ''
            ]">

              <td class="px-3 py-2 font-semibold max-w-[160px] truncate"
                :class="isDark ? 'text-white' : 'text-slate-800'">{{ row.nombre }}</td>
              <td class="px-3 py-2 font-mono" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ row.cedula }}
              </td>
              <td class="px-3 py-2 max-w-[120px] truncate" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                {{ row.departamento || '—' }}
              </td>
              <td class="px-3 py-2 font-mono" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ row.fecha }}</td>

              <td class="px-3 py-2 text-center">
                <span v-if="row.inicio_turno" class="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-500/10"
                  :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                  {{ row.inicio_turno }} – {{ row.fin_turno }}
                </span>
                <span v-else class="text-slate-400 italic text-[9px]">Sin malla</span>
              </td>

              <td class="px-3 py-2 text-center font-mono" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                {{ soloHora(row.fecha_entrada) || '—' }}
              </td>
              <td class="px-3 py-2 text-center font-mono" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                {{ soloHora(row.fecha_salida) || '—' }}
              </td>

              <td class="px-3 py-2 text-center">
                <div v-if="row.minutos_extra_entrada > 0" class="flex flex-col items-center gap-0.5">
                  <span class="font-black text-amber-500">{{ formatMinutos(row.minutos_extra_entrada) }}</span>
                  <span class="text-[8px] text-slate-400">
                    {{ soloHora(row.inicio_extra_entrada) }} → {{ soloHora(row.fin_extra_entrada) }}
                  </span>
                </div>
                <span v-else class="text-slate-400">—</span>
              </td>

              <td class="px-3 py-2 text-center">
                <div v-if="row.minutos_extra_salida > 0" class="flex flex-col items-center gap-0.5">
                  <span class="font-black text-blue-500">{{ formatMinutos(row.minutos_extra_salida) }}</span>
                  <span class="text-[8px] text-slate-400">
                    {{ soloHora(row.inicio_extra_salida) }} → {{ soloHora(row.fin_extra_salida) }}
                  </span>
                </div>
                <span v-else class="text-slate-400">—</span>
              </td>

              <td class="px-3 py-2 text-center">
                <span v-if="row.total_minutos_extra > 0"
                  class="px-2 py-0.5 rounded-full font-black text-[9px] bg-emerald-500/10 text-emerald-600">
                  {{ formatMinutos(row.total_minutos_extra) }}
                </span>
                <span v-else class="text-slate-400">0</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-2 border-t text-[10px]"
        :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-slate-500'">
        <span>Pág {{ currentPage }} / {{ totalPages }} — {{ filtrados.length }} registros</span>
        <div class="flex gap-1">
          <button @click="currentPage--" :disabled="currentPage === 1"
            class="px-2 py-1 rounded disabled:opacity-30 hover:text-[#FF8F00] transition-colors">
            <i class="fas fa-chevron-left text-[9px]"></i>
          </button>
          <button @click="currentPage++" :disabled="currentPage === totalPages"
            class="px-2 py-1 rounded disabled:opacity-30 hover:text-[#FF8F00] transition-colors">
            <i class="fas fa-chevron-right text-[9px]"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else-if="!verHistorial && !loadingCalc && calculado"
      class="flex flex-col items-center justify-center py-16 gap-3">
      <div class="w-14 h-14 rounded-2xl flex items-center justify-center"
        :class="isDark ? 'bg-white/5' : 'bg-slate-100'">
        <i class="fas fa-calculator text-2xl text-[#FF8F00]"></i>
      </div>
      <p class="text-[11px] font-semibold" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
        No se encontraron registros con los filtros aplicados
      </p>
    </div>

    <!-- ── HISTORIAL ── -->
    <div v-if="verHistorial" class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <div class="w-1 h-5 bg-[#FF8F00] rounded-full"></div>
        <h3 class="text-[11px] font-black uppercase tracking-wide" :class="isDark ? 'text-white' : 'text-slate-800'">
          Historial guardado</h3>
        <span class="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#FF8F00]/10 text-[#FF8F00]">
          {{ historial.length }} registros
        </span>
        <button @click="cargarHistorial" class="ml-2 text-[10px] transition-colors"
          :class="isDark ? 'text-slate-400 hover:text-[#FF8F00]' : 'text-slate-400 hover:text-[#FF8F00]'">
          <i class="fas fa-rotate-right mr-1"></i>Actualizar
        </button>
        <button @click="descargarHistorial" :disabled="!historial.length"
          class="ml-auto flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-black border transition-all disabled:opacity-40"
          :class="isDark
            ? 'border-blue-500/40 text-blue-400 hover:bg-blue-500/10'
            : 'border-blue-400 text-blue-600 hover:bg-blue-50'">
          <i class="fas fa-file-excel text-xs"></i> Descargar historial
        </button>
      </div>

      <div v-if="historial.length" class="rounded-xl border overflow-hidden"
        :class="isDark ? 'border-white/5 bg-[#273045]' : 'border-slate-200 bg-white shadow-sm'">
        <div class="overflow-x-auto custom-scroll">
          <table class="w-full text-[10px]">
            <thead>
              <tr :class="isDark ? 'bg-[#1e293b] text-slate-400' : 'bg-slate-50 text-slate-500'">
                <th class="px-3 py-2 text-left font-black uppercase tracking-wide">Colaborador</th>
                <th class="px-3 py-2 text-left font-black uppercase tracking-wide">CC</th>
                <th class="px-3 py-2 text-left font-black uppercase tracking-wide">Fecha</th>
                <th class="px-3 py-2 text-center font-black uppercase tracking-wide">Turno</th>
                <th class="px-3 py-2 text-center font-black uppercase tracking-wide text-amber-500">Extra Entrada</th>
                <th class="px-3 py-2 text-center font-black uppercase tracking-wide text-blue-500">Extra Salida</th>
                <th class="px-3 py-2 text-center font-black uppercase tracking-wide text-emerald-500">Total</th>
                <th class="px-3 py-2 text-center font-black uppercase tracking-wide">Calculado por</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in historial" :key="i" class="border-t transition-colors" :class="[
                isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50',
                row.total_minutos_extra > 0 ? (isDark ? 'bg-[#FF8F00]/5' : 'bg-orange-50/40') : ''
              ]">
                <td class="px-3 py-2 font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">{{ row.nombre }}
                </td>
                <td class="px-3 py-2 font-mono" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ row.cedula }}
                </td>
                <td class="px-3 py-2 font-mono" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ row.fecha }}
                </td>
                <td class="px-3 py-2 text-center" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                  {{ row.inicio_turno ? `${row.inicio_turno} – ${row.fin_turno}` : '—' }}
                </td>
                <td class="px-3 py-2 text-center">
                  <div v-if="row.minutos_extra_entrada > 0" class="flex flex-col items-center">
                    <span class="font-black text-amber-500">{{ formatMinutos(row.minutos_extra_entrada) }}</span>
                    <span class="text-[8px] text-slate-400">
                      {{ soloHora(row.inicio_extra_entrada) }} → {{ soloHora(row.fin_extra_entrada) }}
                    </span>
                  </div>
                  <span v-else class="text-slate-400">—</span>
                </td>
                <td class="px-3 py-2 text-center">
                  <div v-if="row.minutos_extra_salida > 0" class="flex flex-col items-center">
                    <span class="font-black text-blue-500">{{ formatMinutos(row.minutos_extra_salida) }}</span>
                    <span class="text-[8px] text-slate-400">
                      {{ soloHora(row.inicio_extra_salida) }} → {{ soloHora(row.fin_extra_salida) }}
                    </span>
                  </div>
                  <span v-else class="text-slate-400">—</span>
                </td>
                <td class="px-3 py-2 text-center">
                  <span v-if="row.total_minutos_extra > 0"
                    class="px-2 py-0.5 rounded-full font-black text-[9px] bg-emerald-500/10 text-emerald-600">
                    {{ formatMinutos(row.total_minutos_extra) }}
                  </span>
                  <span v-else class="text-slate-400">0</span>
                </td>
                <td class="px-3 py-2 text-center text-[9px]" :class="isDark ? 'text-slate-400' : 'text-slate-400'">
                  {{ row.calculado_por || '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="flex flex-col items-center py-12 gap-2">
        <i class="fas fa-history text-3xl text-slate-300"></i>
        <p class="text-[11px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          No hay cálculos guardados aún
        </p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import * as XLSX from 'xlsx';

const props = defineProps({
  isDark: Boolean,
  company: String,
});

const API_BASE_URL = import.meta.env.VITE_API_URL;
const session = JSON.parse(localStorage.getItem('user_session') || '{}');

// Permisos
const isSuperAdmin = computed(() => session.isSuperAdmin === true);
const tieneFiltroDepartamento = computed(
  () => isSuperAdmin.value || session.permisos?.['admin.filtro_departamento'] === true,
);

// ── Estado ──
const startDate = ref(new Date().toISOString().split('T')[0]);
const endDate = ref(new Date().toISOString().split('T')[0]);
const soloConExtras = ref(false);
const selectedDepartamento = ref('');
const loadingCalc = ref(false);
const loadingGuardar = ref(false);
const calculado = ref(false);
const guardado = ref(false);
const resultados = ref([]);
const historial = ref([]);
const verHistorial = ref(false);
const currentPage = ref(1);
const ITEMS_PER_PAGE = 20;
const toast = ref({ msg: '', type: '' });

// Área/segmento del perfil del usuario
const areaActiva = ref(null);
const segmentoActivo = ref(null);

// ── Computed ──
const fechasValidas = computed(() => !!(startDate.value || endDate.value));
const hayResultados = computed(() => resultados.value.length > 0);

// Departamentos únicos extraídos de los resultados (para el filtro client-side)
const departamentos = computed(() => {
  const deps = resultados.value
    .map((r) => r.departamento)
    .filter(Boolean);
  return [...new Set(deps)].sort();
});

const conExtras = computed(() => resultados.value.filter((r) => r.total_minutos_extra > 0).length);
const totalMinutos = computed(() =>
  filtrados.value.reduce((acc, r) => acc + (r.total_minutos_extra || 0), 0),
);

// Filtrado client-side: departamento + solo-con-extras
const filtrados = computed(() => {
  let data = resultados.value;
  if (selectedDepartamento.value) {
    data = data.filter((r) => r.departamento === selectedDepartamento.value);
  }
  if (soloConExtras.value) {
    data = data.filter((r) => r.total_minutos_extra > 0);
  }
  return data;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filtrados.value.length / ITEMS_PER_PAGE)));
const tablaVisible = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE;
  return filtrados.value.slice(start, start + ITEMS_PER_PAGE);
});

watch([soloConExtras, selectedDepartamento, filtrados], () => { currentPage.value = 1; });

// ── Helpers ──
function soloHora(dt) {
  if (!dt) return null;
  const t = dt.split(' ')[1];
  return t ? t.slice(0, 5) : null;
}

function formatMinutos(mins) {
  if (!mins) return '0 min';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function showToast(msg, type = 'info', ms = 4500) {
  toast.value = { msg, type };
  setTimeout(() => { toast.value = { msg: '', type: '' }; }, ms);
}

function buildParams() {
  const body = {
    startDate: startDate.value || null,
    endDate: endDate.value || null,
    company: props.company || session.company || null,
    calculado_por: session.name || 'Admin',
  };
  // Admin sin permiso de filtro_departamento → enviar su área/segmento
  if (!tieneFiltroDepartamento.value) {
    if (areaActiva.value) body.area_id = areaActiva.value;
    if (segmentoActivo.value) body.segmento_id = segmentoActivo.value;
  }
  return body;
}

// ── Carga de perfil en mount ──
onMounted(async () => {
  if (!isSuperAdmin.value && session.id_odoo) {
    try {
      const baseUrl = API_BASE_URL.replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/perfil-completo/${session.id_odoo}`);
      if (res.ok) {
        const perfil = await res.json();
        if (perfil.area?.id) areaActiva.value = perfil.area.id;
        if (perfil.segmento?.id) segmentoActivo.value = perfil.segmento.id;
      }
    } catch { }
  }
});

// ── CALCULAR (sin guardar) ──
async function calcular() {
  loadingCalc.value = true;
  calculado.value = false;
  guardado.value = false;
  resultados.value = [];
  selectedDepartamento.value = '';
  verHistorial.value = false;

  try {
    const res = await fetch(`${API_BASE_URL}/horas-extra/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildParams()),
    });
    if (!res.ok) throw new Error('Error al calcular');
    resultados.value = await res.json();
    calculado.value = true;
    showToast(
      `${resultados.value.length} registros — ${conExtras.value} con horas extra`,
      'info',
    );
  } catch (err) {
    showToast(err.message || 'Error de conexión', 'error');
  } finally {
    loadingCalc.value = false;
  }
}

// ── GUARDAR (recalcula + persiste en DB) ──
async function guardar() {
  if (!hayResultados.value) return;
  loadingGuardar.value = true;

  try {
    const res = await fetch(`${API_BASE_URL}/horas-extra/guardar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildParams()),
    });
    if (!res.ok) throw new Error('Error al guardar');
    guardado.value = true;
    showToast('Cálculo guardado correctamente en la base de datos', 'success');
  } catch (err) {
    showToast(err.message || 'Error al guardar', 'error');
  } finally {
    loadingGuardar.value = false;
  }
}

// ── DESCARGAR Excel ──
function buildFilas(data) {
  return data.map((r) => ({
    Colaborador: r.nombre,
    Cedula: r.cedula,
    Departamento: r.departamento || '',
    Fecha: r.fecha,
    Inicio_Turno: r.inicio_turno || '',
    Fin_Turno: r.fin_turno || '',
    Entrada_Real: soloHora(r.fecha_entrada) || '',
    Salida_Real: soloHora(r.fecha_salida) || '',
    Inicio_Extra_Entrada: soloHora(r.inicio_extra_entrada) || '',
    Fin_Extra_Entrada: soloHora(r.fin_extra_entrada) || '',
    Minutos_Extra_Entrada: r.minutos_extra_entrada || 0,
    Inicio_Extra_Salida: soloHora(r.inicio_extra_salida) || '',
    Fin_Extra_Salida: soloHora(r.fin_extra_salida) || '',
    Minutos_Extra_Salida: r.minutos_extra_salida || 0,
    Total_Minutos_Extra: r.total_minutos_extra || 0,
  }));
}

function descargar() {
  if (!hayResultados.value) return;
  const ws = XLSX.utils.json_to_sheet(buildFilas(filtrados.value));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Horas Extra');
  XLSX.writeFile(wb, `HorasExtra_${startDate.value}_${endDate.value}.xlsx`);
}

// ── HISTORIAL ──
async function cargarHistorial() {
  try {
    const params = new URLSearchParams();
    if (startDate.value) params.set('startDate', startDate.value);
    if (endDate.value) params.set('endDate', endDate.value);
    const company = props.company || session.company;
    if (company) params.set('company', company);
    if (soloConExtras.value) params.set('soloConExtras', 'true');

    const res = await fetch(`${API_BASE_URL}/horas-extra/historial?${params}`);
    if (res.ok) historial.value = await res.json();
  } catch { }
}

function descargarHistorial() {
  if (!historial.value.length) return;
  const filas = historial.value.map((r) => ({
    ...buildFilas([r])[0],
    Calculado_Por: r.calculado_por || '',
  }));
  const ws = XLSX.utils.json_to_sheet(filas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Historial');
  XLSX.writeFile(wb, `HistorialHorasExtra_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function toggleHistorial() {
  verHistorial.value = !verHistorial.value;
  if (verHistorial.value) cargarHistorial();
}
</script>
