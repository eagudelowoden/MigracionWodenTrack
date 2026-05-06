<template>
  <div class="h-full animate-fade-in flex flex-col gap-2">

    <!-- ── Barra de filtros ───────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-end gap-2 p-2 px-4 rounded-2xl border transition-all duration-300 shadow-sm"
      :class="isDark ? 'bg-[#1e2538] border-white/5 shadow-black/20' : 'bg-[#f8fafc] border-slate-200 shadow-slate-200/50'">

      <!-- Desde -->
      <div class="flex flex-col gap-1">
        <label class="text-[8px] font-black uppercase tracking-widest"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">Desde</label>
        <input type="date" v-model="startDate"
          class="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border outline-none transition-colors"
          :class="isDark ? 'bg-slate-800 border-white/10 text-white focus:border-[#FF8F00]' : 'bg-white border-slate-200 text-slate-800 focus:border-[#FF8F00]'" />
      </div>

      <!-- Hasta -->
      <div class="flex flex-col gap-1">
        <label class="text-[8px] font-black uppercase tracking-widest"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">Hasta</label>
        <input type="date" v-model="endDate"
          class="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border outline-none transition-colors"
          :class="isDark ? 'bg-slate-800 border-white/10 text-white focus:border-[#FF8F00]' : 'bg-white border-slate-200 text-slate-800 focus:border-[#FF8F00]'" />
      </div>

      <!-- Filtro Nombre -->
      <div class="flex flex-col gap-1">
        <label class="text-[8px] font-black uppercase tracking-widest"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">Nombre</label>
        <div class="relative">
          <i class="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400"></i>
          <input v-model="filterNombre" type="text" placeholder="Buscar..."
            class="pl-7 pr-2.5 py-1.5 text-[10px] font-semibold rounded-lg border outline-none w-36 transition-colors"
            :class="isDark ? 'bg-slate-800 border-white/10 text-white focus:border-[#FF8F00]' : 'bg-white border-slate-200 text-slate-800 focus:border-[#FF8F00]'" />
        </div>
      </div>

      <!-- Filtro Departamento (solo CH con permiso) -->
      <div v-if="hasPerm('admin.filtro_departamento') || isSuperAdmin" class="flex flex-col gap-1">
        <label class="text-[8px] font-black uppercase tracking-widest"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">Departamento</label>
        <input v-model="filterDepartamento" type="text" placeholder="Filtrar departamento..."
          class="px-2.5 py-1.5 text-[10px] font-semibold rounded-lg border outline-none w-44 transition-colors"
          :class="isDark ? 'bg-slate-800 border-white/10 text-white focus:border-[#FF8F00]' : 'bg-white border-slate-200 text-slate-800 focus:border-[#FF8F00]'" />
      </div>

      <!-- Acciones -->
      <div class="flex items-center gap-2 ml-auto self-end">
        <button @click="handleCargar" :disabled="isLoading"
          class="p-2 rounded-lg transition-all"
          :class="isDark ? 'text-slate-400 hover:text-[#FF8F00]' : 'text-slate-500 hover:text-[#FF8F00]'"
          title="Refrescar">
          <i class="fas fa-arrows-rotate text-base" :class="{ 'fa-spin': isLoading }"></i>
        </button>
      </div>
    </div>

    <!-- ── Tabla ─────────────────────────────────────────────────────────── -->
    <div class="flex-1 overflow-hidden rounded-xl border flex flex-col transition-all duration-300"
      :class="isDark ? 'bg-[#253045] border-[#253045]' : 'bg-white border-slate-200 shadow-sm'">

      <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
        <table class="w-full border-separate border-spacing-0 text-[10px]">

          <!-- Encabezado -->
          <thead class="sticky top-0 z-30">
            <tr :class="isDark ? 'bg-[#1e293b]' : 'bg-[#334155]'">
              <th colspan="2"
                class="px-3 py-2 text-center text-[9px] font-black uppercase tracking-wider border-b border-r border-white/10 text-white">
                COLABORADOR
              </th>
              <th class="px-3 py-2 text-center text-[9px] font-black uppercase tracking-wider border-b border-r border-white/10 text-white">
                FECHA
              </th>
              <th colspan="2"
                class="px-3 py-2 text-center text-[9px] font-black uppercase tracking-wider border-b border-r border-white/10 text-white">
                JORNADA LABORAL
              </th>
              <th colspan="2"
                class="px-3 py-2 text-center text-[9px] font-black uppercase tracking-wider border-b border-r border-white/10 text-white">
                TIEMPO LABORADO
              </th>
              <th v-for="col in COLS_HX" :key="col"
                class="px-2 py-2 text-center text-[9px] font-black uppercase tracking-wider border-b border-r border-white/10 text-white w-12">
                {{ col.toUpperCase() }}
              </th>
              <th class="px-3 py-2 text-center text-[9px] font-black uppercase tracking-wider border-b border-white/10 text-white w-24">
                CARGADO POR
              </th>
            </tr>
            <tr :class="isDark ? 'bg-[#253045]' : 'bg-[#475569]'">
              <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300 w-28">Cédula</th>
              <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300">Nombre</th>
              <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300 w-24">Fecha</th>
              <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300 w-20">Hora Ini.</th>
              <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300 w-20">Hora Fin</th>
              <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300 w-20">Hora Ini.</th>
              <th class="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider border-b border-r border-white/10 text-slate-300 w-20">Hora Fin</th>
              <th v-for="_ in 7" :key="_"
                class="px-2 py-1.5 text-[8px] font-bold text-center tracking-wider border-b border-r border-white/10 text-slate-400">0</th>
              <th class="px-3 py-1.5 border-b border-white/10 text-slate-300"></th>
            </tr>
          </thead>

          <tbody>
            <!-- Loading -->
            <tr v-if="isLoading" v-for="n in 8" :key="'sk-' + n">
              <td colspan="15" class="px-3 py-3">
                <div class="h-3 w-full rounded animate-pulse" :class="isDark ? 'bg-white/5' : 'bg-slate-100'"></div>
              </td>
            </tr>

            <!-- Sin datos -->
            <tr v-else-if="!filasPaginadas.length">
              <td colspan="15" class="px-4 py-14 text-center">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center"
                    :class="isDark ? 'bg-white/5' : 'bg-slate-100'">
                    <i class="fas fa-file-arrow-up text-xl text-[#FF8F00]"></i>
                  </div>
                  <p class="text-[11px] font-bold uppercase" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                    No hay cargues en este rango de fechas
                  </p>
                </div>
              </td>
            </tr>

            <!-- Filas -->
            <template v-else v-for="(item, idx) in filasPaginadas" :key="idx">

              <!-- Cabecera empresa -->
              <tr v-if="item.tipo === 'empresa'">
                <td colspan="15" class="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white border-b"
                  :class="isDark ? 'bg-[#1e293b] border-white/10' : 'bg-[#334155] border-slate-600'">
                  <i class="fas fa-building mr-2 opacity-70"></i>{{ item.data.empresa }}
                </td>
              </tr>

              <!-- Fila normal -->
              <tr v-else-if="item.tipo === 'fila'" class="group transition-all duration-100" :class="[
                idx % 2 !== 0
                  ? (isDark ? 'bg-white/[0.03]' : 'bg-slate-50/60') : '',
                isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-orange-50/40'
              ]">
                <td class="px-3 py-2 border-b border-r font-mono text-[9px]"
                  :class="isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-slate-500'">
                  {{ item.data.cedula || '—' }}
                </td>
                <td class="px-3 py-2 border-b border-r" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                  <div class="font-bold uppercase" :class="isDark ? 'text-white' : 'text-slate-900'">{{ item.data.nombre }}</div>
                </td>
                <td class="px-3 py-2 border-b border-r text-center"
                  :class="isDark ? 'border-white/5 text-slate-300' : 'border-slate-100 text-slate-700'">
                  {{ formatFecha(item.data.fecha) }}
                </td>
                <td class="px-3 py-2 border-b border-r text-center font-mono"
                  :class="isDark ? 'border-white/5 text-slate-300' : 'border-slate-100 text-slate-700'">
                  {{ item.data.inicio_turno || '—' }}
                </td>
                <td class="px-3 py-2 border-b border-r text-center font-mono"
                  :class="isDark ? 'border-white/5 text-slate-300' : 'border-slate-100 text-slate-700'">
                  {{ item.data.fin_turno || '—' }}
                </td>
                <td class="px-3 py-2 border-b border-r text-center font-mono"
                  :class="isDark ? 'border-white/5 text-emerald-400' : 'border-slate-100 text-emerald-700'">
                  {{ item.data.hora_inicio_laborado || '—' }}
                </td>
                <td class="px-3 py-2 border-b border-r text-center font-mono"
                  :class="isDark ? 'border-white/5 text-emerald-400' : 'border-slate-100 text-emerald-700'">
                  {{ item.data.hora_fin_laborado || '—' }}
                </td>
                <td v-for="col in COLS_HX" :key="col" class="px-2 py-2 border-b border-r text-center" :class="[
                  isDark ? 'border-white/5' : 'border-slate-100',
                  Number(item.data[col]) > 0
                    ? (isDark ? 'text-[#FF8F00] font-black' : 'text-orange-600 font-black')
                    : (isDark ? 'text-slate-600' : 'text-slate-300')
                ]">
                  {{ formatDecimal(item.data[col]) }}
                </td>
                <td class="px-2 py-2 border-b text-center text-[8px]"
                  :class="isDark ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'">
                  {{ item.data.cargado_por || '—' }}
                </td>
              </tr>

              <!-- Subtotal -->
              <tr v-else-if="item.tipo === 'subtotal'">
                <td colspan="7" class="px-3 py-2 border-b border-r text-[9px] font-black uppercase italic"
                  :class="isDark ? 'bg-[#FF8F00]/10 border-[#FF8F00]/20 text-[#FF8F00]' : 'bg-orange-50 border-orange-200 text-orange-800'">
                  Subtotal — {{ item.data.nombre }}
                </td>
                <td v-for="col in COLS_HX" :key="col"
                  class="px-2 py-2 border-b border-r text-center text-[10px] font-black"
                  :class="isDark ? 'bg-[#FF8F00]/10 border-[#FF8F00]/20 text-[#FF8F00]' : 'bg-orange-50 border-orange-200 text-orange-700'">
                  {{ formatDecimal(item.data.subtotales[col]) }}
                </td>
                <td class="border-b"
                  :class="isDark ? 'bg-[#FF8F00]/10 border-[#FF8F00]/20' : 'bg-orange-50 border-orange-200'"></td>
              </tr>

            </template>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="filasAplanadas.length > 0" class="px-4 py-2 border-t flex items-center justify-between"
        :class="isDark ? 'border-white/5 bg-[#1a1d2d]' : 'border-slate-200 bg-slate-50'">
        <span class="text-[10px] font-bold uppercase" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Registros cargados: <span :class="isDark ? 'text-white' : 'text-slate-900'">{{ totalRegistros }}</span>
        </span>
        <div class="flex items-center gap-2">
          <button @click="currentPage--" :disabled="currentPage === 1"
            class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all disabled:opacity-20"
            :class="isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'">
            <i class="fas fa-chevron-left text-[9px]"></i>
          </button>
          <div class="px-3 py-1 rounded-lg text-[11px] font-bold border"
            :class="isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'">
            {{ currentPage }} / {{ totalPages }}
          </div>
          <button @click="currentPage++" :disabled="currentPage >= totalPages"
            class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all disabled:opacity-20"
            :class="isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'">
            <i class="fas fa-chevron-right text-[9px]"></i>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useCargueHoras } from '../../composables/adminLogica/useCargueHoras';

const props = defineProps({
  isDark: Boolean,
  company: String,
});

const session = JSON.parse(localStorage.getItem('user_session') || '{}');
const isSuperAdmin = session.isSuperAdmin || false;

const {
  isLoading,
  filasPaginadas,
  filasAplanadas,
  currentPage,
  totalPages,
  totalRegistros,
  COLS_HX,
  cargarHistorial,
  formatFecha,
  formatDecimal,
  hasPerm,
} = useCargueHoras();

const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
const endDate = ref(new Date().toISOString().slice(0, 10));
const filterNombre = ref('');
const filterDepartamento = ref('');

async function handleCargar() {
  await cargarHistorial({
    startDate: startDate.value,
    endDate: endDate.value,
    company: props.company,
    departamento: filterDepartamento.value || undefined,
  });
}

watch([startDate, endDate, filterNombre, filterDepartamento], () => {
  handleCargar();
});

watch(() => props.company, () => handleCargar());

onMounted(() => handleCargar());
</script>
<style></style>
