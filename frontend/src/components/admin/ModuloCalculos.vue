<template>
  <div class="flex flex-col gap-4 animate-fade-in">

    <!-- Header + filtros -->
    <div class="rounded-xl border p-4"
      :class="isDark ? 'bg-[#273045] border-white/5' : 'bg-white border-slate-200 shadow-sm'">

      <div class="flex flex-wrap items-end gap-3">

        <!-- Fechas -->
        <div class="flex flex-col gap-1">
          <label class="text-[9px] font-black uppercase tracking-widest"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Desde</label>
          <input type="date" v-model="startDate"
            class="text-[11px] font-semibold px-3 py-1.5 rounded-lg border outline-none transition-colors"
            :class="isDark
              ? 'bg-[#1e293b] border-white/10 text-white focus:border-[#FF8F00]'
              : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-[#FF8F00]'" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[9px] font-black uppercase tracking-widest"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Hasta</label>
          <input type="date" v-model="endDate"
            class="text-[11px] font-semibold px-3 py-1.5 rounded-lg border outline-none transition-colors"
            :class="isDark
              ? 'bg-[#1e293b] border-white/10 text-white focus:border-[#FF8F00]'
              : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-[#FF8F00]'" />
        </div>

        <!-- Separador -->
        <div class="h-8 w-px" :class="isDark ? 'bg-white/10' : 'bg-slate-200'"></div>

        <!-- Solo con extras -->
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <div class="relative">
            <input type="checkbox" v-model="soloConExtras" class="sr-only peer" />
            <div class="w-8 h-4 rounded-full transition-colors peer-checked:bg-[#FF8F00]"
              :class="isDark ? 'bg-white/10' : 'bg-slate-200'"></div>
            <div
              class="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform peer-checked:translate-x-4 shadow-sm">
            </div>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-wide"
            :class="isDark ? 'text-slate-300' : 'text-slate-600'">
            Solo con extras
          </span>
        </label>

        <!-- Botones -->
        <div class="flex gap-2 ml-auto">

          <button @click="calcular" :disabled="loading || (!startDate && !endDate)"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all"
            :class="loading || (!startDate && !endDate)
              ? 'opacity-40 cursor-not-allowed bg-[#FF8F00]/40 text-white'
              : 'bg-[#FF8F00] hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20'">
            <i class="fas" :class="loading ? 'fa-spinner fa-spin' : 'fa-calculator'"></i>
            {{ loading ? 'Calculando...' : 'Calcular Extras' }}
          </button>

          <button v-if="resultados.length" @click="verHistorial = !verHistorial"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide border transition-all"
            :class="isDark
              ? 'border-white/10 text-slate-300 hover:border-[#FF8F00] hover:text-[#FF8F00]'
              : 'border-slate-200 text-slate-600 hover:border-[#FF8F00] hover:text-[#FF8F00]'">
            <i class="fas fa-history text-xs"></i>
            {{ verHistorial ? 'Ver cálculo' : 'Ver historial' }}
          </button>

        </div>
      </div>

      <!-- Resumen -->
      <div v-if="resultados.length && !verHistorial"
        class="mt-3 pt-3 border-t flex flex-wrap gap-4"
        :class="isDark ? 'border-white/5' : 'border-slate-100'">

        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-slate-400"></div>
          <span class="text-[10px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            <span class="font-black" :class="isDark ? 'text-white' : 'text-slate-800'">
              {{ resultados.length }}
            </span> registros
          </span>
        </div>

        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-[#FF8F00]"></div>
          <span class="text-[10px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            <span class="font-black text-[#FF8F00]">{{ conExtras }}</span> con horas extra
          </span>
        </div>

        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span class="text-[10px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            Total:
            <span class="font-black text-emerald-500">{{ formatMinutos(totalMinutos) }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error"
      class="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-semibold">
      <i class="fas fa-circle-exclamation"></i>
      {{ error }}
    </div>

    <!-- Tabla resultados -->
    <div v-if="!verHistorial && tablaVisible.length"
      class="rounded-xl border overflow-hidden"
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
            <tr v-for="(row, i) in tablaVisible" :key="i"
              class="border-t transition-colors"
              :class="[
                isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50',
                row.total_minutos_extra > 0 ? (isDark ? 'bg-[#FF8F00]/5' : 'bg-orange-50/50') : ''
              ]">

              <td class="px-3 py-2 font-semibold max-w-[160px] truncate"
                :class="isDark ? 'text-white' : 'text-slate-800'">
                {{ row.nombre }}
              </td>

              <td class="px-3 py-2 font-mono" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                {{ row.cedula }}
              </td>

              <td class="px-3 py-2 max-w-[120px] truncate"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                {{ row.departamento || '—' }}
              </td>

              <td class="px-3 py-2 font-mono" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                {{ row.fecha }}
              </td>

              <!-- Turno -->
              <td class="px-3 py-2 text-center">
                <span v-if="row.inicio_turno"
                  class="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-500/10"
                  :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                  {{ row.inicio_turno }} – {{ row.fin_turno }}
                </span>
                <span v-else class="text-slate-400">Sin malla</span>
              </td>

              <!-- Entrada -->
              <td class="px-3 py-2 text-center font-mono"
                :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                {{ soloHora(row.fecha_entrada) || '—' }}
              </td>

              <!-- Salida -->
              <td class="px-3 py-2 text-center font-mono"
                :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                {{ soloHora(row.fecha_salida) || '—' }}
              </td>

              <!-- Extra entrada -->
              <td class="px-3 py-2 text-center">
                <div v-if="row.minutos_extra_entrada > 0" class="flex flex-col items-center gap-0.5">
                  <span class="font-black text-amber-500">{{ formatMinutos(row.minutos_extra_entrada) }}</span>
                  <span class="text-[8px]" :class="isDark ? 'text-slate-400' : 'text-slate-400'">
                    {{ soloHora(row.inicio_extra_entrada) }} → {{ soloHora(row.fin_extra_entrada) }}
                  </span>
                </div>
                <span v-else class="text-slate-400">—</span>
              </td>

              <!-- Extra salida -->
              <td class="px-3 py-2 text-center">
                <div v-if="row.minutos_extra_salida > 0" class="flex flex-col items-center gap-0.5">
                  <span class="font-black text-blue-500">{{ formatMinutos(row.minutos_extra_salida) }}</span>
                  <span class="text-[8px]" :class="isDark ? 'text-slate-400' : 'text-slate-400'">
                    {{ soloHora(row.inicio_extra_salida) }} → {{ soloHora(row.fin_extra_salida) }}
                  </span>
                </div>
                <span v-else class="text-slate-400">—</span>
              </td>

              <!-- Total -->
              <td class="px-3 py-2 text-center">
                <span v-if="row.total_minutos_extra > 0"
                  class="inline-block px-2 py-0.5 rounded-full font-black text-[9px] bg-emerald-500/10 text-emerald-600">
                  {{ formatMinutos(row.total_minutos_extra) }}
                </span>
                <span v-else class="text-slate-400 font-semibold">0</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="totalPages > 1"
        class="flex items-center justify-between px-4 py-2 border-t text-[10px]"
        :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-slate-500'">
        <span>Pág {{ currentPage }} / {{ totalPages }}</span>
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
    <div v-else-if="!verHistorial && !loading && calculado"
      class="flex flex-col items-center justify-center py-16 gap-3">
      <div class="w-14 h-14 rounded-2xl flex items-center justify-center"
        :class="isDark ? 'bg-white/5' : 'bg-slate-100'">
        <i class="fas fa-calculator text-2xl text-[#FF8F00]"></i>
      </div>
      <p class="text-[11px] font-semibold" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
        No se encontraron registros con los filtros aplicados
      </p>
    </div>

    <!-- Historial -->
    <div v-if="verHistorial" class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <div class="w-1 h-5 bg-[#FF8F00] rounded-full"></div>
        <h3 class="text-[11px] font-black uppercase tracking-wide"
          :class="isDark ? 'text-white' : 'text-slate-800'">
          Historial guardado
        </h3>
        <span class="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#FF8F00]/10 text-[#FF8F00]">
          {{ historial.length }} registros
        </span>
        <button @click="cargarHistorial" class="ml-auto text-[10px] text-slate-400 hover:text-[#FF8F00] transition-colors">
          <i class="fas fa-refresh mr-1"></i> Actualizar
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
              <tr v-for="(row, i) in historial" :key="i"
                class="border-t transition-colors"
                :class="[
                  isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50',
                  row.total_minutos_extra > 0 ? (isDark ? 'bg-[#FF8F00]/5' : 'bg-orange-50/50') : ''
                ]">
                <td class="px-3 py-2 font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">
                  {{ row.nombre }}
                </td>
                <td class="px-3 py-2 font-mono" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                  {{ row.cedula }}
                </td>
                <td class="px-3 py-2 font-mono" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                  {{ row.fecha }}
                </td>
                <td class="px-3 py-2 text-center" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                  {{ row.inicio_turno && row.fin_turno ? `${row.inicio_turno} – ${row.fin_turno}` : '—' }}
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
                    class="inline-block px-2 py-0.5 rounded-full font-black text-[9px] bg-emerald-500/10 text-emerald-600">
                    {{ formatMinutos(row.total_minutos_extra) }}
                  </span>
                  <span v-else class="text-slate-400">0</span>
                </td>
                <td class="px-3 py-2 text-center text-[9px]"
                  :class="isDark ? 'text-slate-400' : 'text-slate-400'">
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
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
  isDark: Boolean,
  company: String,
});

const API_BASE_URL = import.meta.env.VITE_API_URL;
const session = JSON.parse(localStorage.getItem('user_session') || '{}');

// Estado
const startDate = ref(new Date().toISOString().split('T')[0]);
const endDate = ref(new Date().toISOString().split('T')[0]);
const soloConExtras = ref(false);
const loading = ref(false);
const error = ref('');
const calculado = ref(false);
const resultados = ref([]);
const historial = ref([]);
const verHistorial = ref(false);
const currentPage = ref(1);
const itemsPerPage = 20;

// Computed
const conExtras = computed(() => resultados.value.filter((r) => r.total_minutos_extra > 0).length);
const totalMinutos = computed(() =>
  resultados.value.reduce((acc, r) => acc + (r.total_minutos_extra || 0), 0),
);

const filtrados = computed(() => {
  if (!soloConExtras.value) return resultados.value;
  return resultados.value.filter((r) => r.total_minutos_extra > 0);
});

const totalPages = computed(() => Math.max(1, Math.ceil(filtrados.value.length / itemsPerPage)));

const tablaVisible = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filtrados.value.slice(start, start + itemsPerPage);
});

watch([soloConExtras, filtrados], () => {
  currentPage.value = 1;
});

// Helpers
function soloHora(datetime) {
  if (!datetime) return null;
  const parts = datetime.split(' ');
  return parts[1] ? parts[1].slice(0, 5) : datetime.slice(0, 5);
}

function formatMinutos(mins) {
  if (!mins) return '0 min';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// Calcular y guardar
async function calcular() {
  if (!startDate.value && !endDate.value) return;
  loading.value = true;
  error.value = '';
  calculado.value = false;

  try {
    const res = await fetch(`${API_BASE_URL}/horas-extra/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: startDate.value,
        endDate: endDate.value,
        company: props.company || session.company || null,
        calculado_por: session.name || 'Admin',
      }),
    });

    if (!res.ok) throw new Error('Error al calcular las horas extra');
    resultados.value = await res.json();
    calculado.value = true;
    verHistorial.value = false;
  } catch (err) {
    error.value = err.message || 'Error de conexión';
  } finally {
    loading.value = false;
  }
}

// Cargar historial
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
  } catch {}
}

watch(verHistorial, (val) => {
  if (val) cargarHistorial();
});

onMounted(() => {
  // No cargar automáticamente — esperar al botón
});
</script>
