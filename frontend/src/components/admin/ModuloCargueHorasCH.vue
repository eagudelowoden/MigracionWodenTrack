<template>
  <div class="h-full animate-fade-in flex flex-col gap-3">

    <!-- ── Toolbar (Vercel ultra compacto, sin labels) ───────────────────── -->
    <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-md border"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

      <div class="flex items-center gap-2">
        <div class="w-7 h-7 bg-[#3B82F6]/10 text-[#3B82F6] rounded-md flex items-center justify-center">
          <i class="fas fa-file-arrow-up text-[11px]"></i>
        </div>
        <h2 class="text-[13px] font-semibold tracking-tight"
          :class="isDark ? 'text-white' : 'text-slate-900'">
          Cargue Horas CH
        </h2>
      </div>

      <div class="flex flex-wrap items-center gap-1.5">

        <!-- Rango fechas (agrupadas con separador) -->
        <div class="flex items-center gap-2 h-7 px-2 rounded-[5px] border transition-all"
          :class="isDark ? 'bg-[#0B0F19] border-[#222938]' : 'bg-white border-slate-200'">
          <input v-model="startDate" type="date"
            class="bg-transparent text-[11px] font-medium outline-none cursor-pointer w-[100px]"
            :class="isDark ? 'text-white' : 'text-slate-700'" />
          <div class="w-px h-3" :class="isDark ? 'bg-[#222938]' : 'bg-slate-300'"></div>
          <input v-model="endDate" type="date"
            class="bg-transparent text-[11px] font-medium outline-none cursor-pointer w-[100px]"
            :class="isDark ? 'text-white' : 'text-slate-700'" />
        </div>

        <!-- Nombre -->
        <div class="relative">
          <i class="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px]"
            :class="isDark ? 'text-[#888888]' : 'text-slate-400'"></i>
          <input v-model="filterNombre" type="text" placeholder="Nombre…"
            class="h-7 pl-7 pr-2.5 text-[11px] font-medium rounded-[5px] border outline-none w-36 transition-all"
            :class="isDark
              ? 'bg-[#0B0F19] border-[#222938] text-white placeholder:text-[#5a5a5a] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'
              : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'" />
        </div>

        <!-- Departamento -->
        <input v-if="hasPerm('admin.filtro_departamento') || isSuperAdmin"
          v-model="filterDepartamento" type="text" placeholder="Departamento…"
          class="h-7 px-2.5 text-[11px] font-medium rounded-[5px] border outline-none w-36 transition-all"
          :class="isDark
            ? 'bg-[#0B0F19] border-[#222938] text-white placeholder:text-[#5a5a5a] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'
            : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'" />

        <!-- Refrescar -->
        <button @click="handleCargar" :disabled="isLoading"
          class="h-7 w-7 rounded-[5px] border flex items-center justify-center transition-all disabled:opacity-40"
          :class="isDark
            ? 'bg-[#0B0F19] border-[#222938] text-[#888888] hover:text-white hover:border-[#3B82F6]/40'
            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300'"
          title="Refrescar">
          <i class="fas fa-arrows-rotate text-[10px]" :class="{ 'fa-spin': isLoading }"></i>
        </button>
      </div>
    </div>

    <!-- ── Tabla (Vercel) ─────────────────────────────────────────────────── -->
    <div class="flex-1 overflow-hidden rounded-md border flex flex-col"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

      <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
        <table class="w-full border-separate border-spacing-0 text-[11px]">

          <!-- Header siempre oscuro -->
          <thead class="sticky top-0 z-30">
            <tr class="bg-[#0B0F19]">
              <th colspan="2"
                class="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-r border-[#222938] text-[#888888]">
                Colaborador
              </th>
              <th class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-r border-[#222938] text-[#888888]">
                Fecha
              </th>
              <th colspan="2"
                class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-r border-[#222938] text-[#888888]">
                Jornada
              </th>
              <th colspan="2"
                class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-r border-[#222938] text-[#888888]">
                Tiempo laborado
              </th>
              <th v-for="col in COLS_HX" :key="col"
                class="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-r border-[#222938] text-[#888888] w-12">
                {{ col.toUpperCase() }}
              </th>
              <th class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#222938] text-[#888888] w-24">
                Cargado por
              </th>
            </tr>
            <tr class="bg-[#0B0F19]">
              <th class="px-3 py-1.5 text-left text-[9px] font-normal border-b border-r border-[#222938] text-[#6a6a72] w-28">Cédula</th>
              <th class="px-3 py-1.5 text-left text-[9px] font-normal border-b border-r border-[#222938] text-[#6a6a72]">Nombre</th>
              <th class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r border-[#222938] text-[#6a6a72] w-24"></th>
              <th class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r border-[#222938] text-[#6a6a72] w-20">Inicio</th>
              <th class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r border-[#222938] text-[#6a6a72] w-20">Fin</th>
              <th class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r border-[#222938] text-[#6a6a72] w-20">Entrada</th>
              <th class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r border-[#222938] text-[#6a6a72] w-20">Salida</th>
              <th v-for="_ in 7" :key="_"
                class="px-2 py-1.5 text-center text-[9px] font-normal border-b border-r border-[#222938] text-[#6a6a72]">hrs</th>
              <th class="px-3 py-1.5 border-b border-[#222938]"></th>
            </tr>
          </thead>

          <tbody>
            <!-- Loading -->
            <tr v-if="isLoading" v-for="n in 8" :key="'sk-' + n">
              <td colspan="15" class="px-3 py-3">
                <div class="h-3 w-full rounded animate-pulse"
                  :class="isDark ? 'bg-[#222938]/40' : 'bg-slate-100'"></div>
              </td>
            </tr>

            <!-- Sin datos -->
            <tr v-else-if="!filasPaginadas.length">
              <td colspan="15" class="px-4 py-14 text-center">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-12 h-12 rounded-md flex items-center justify-center"
                    :class="isDark ? 'bg-[#3B82F6]/10 text-[#60A5FA]' : 'bg-blue-50 text-[#3B82F6]'">
                    <i class="fas fa-file-arrow-up text-lg"></i>
                  </div>
                  <p class="text-[11px] font-medium"
                    :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
                    No hay cargues en este rango de fechas
                  </p>
                </div>
              </td>
            </tr>

            <!-- Filas -->
            <template v-else v-for="(item, idx) in filasPaginadas" :key="idx">

              <!-- Cabecera empresa -->
              <tr v-if="item.tipo === 'empresa'">
                <td colspan="15" class="px-4 py-2 text-[10px] font-medium border-b"
                  :class="isDark
                    ? 'bg-[#0B0F19] border-[#222938] text-[#E2E8F0]'
                    : 'bg-slate-100 border-slate-200 text-slate-700'">
                  <i class="fas fa-building mr-2 opacity-60 text-[#3B82F6]"></i>{{ item.data.empresa }}
                </td>
              </tr>

              <!-- Fila normal -->
              <tr v-else-if="item.tipo === 'fila'" class="group transition-colors duration-100" :class="[
                idx % 2 !== 0
                  ? (isDark ? 'bg-white/[0.02]' : 'bg-slate-50/60') : '',
                isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
              ]">
                <td class="px-3 py-2 border-b border-r font-mono text-[10px]"
                  :class="isDark ? 'border-[#222938] text-[#888888]' : 'border-slate-100 text-slate-500'">
                  {{ item.data.cedula || '—' }}
                </td>
                <td class="px-3 py-2 border-b border-r" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <div class="text-[11px] font-medium"
                    :class="isDark ? 'text-white' : 'text-slate-900'">{{ item.data.nombre }}</div>
                </td>
                <td class="px-3 py-2 border-b border-r text-center text-[11px]"
                  :class="isDark ? 'border-[#222938] text-[#E2E8F0]' : 'border-slate-100 text-slate-700'">
                  {{ formatFecha(item.data.fecha) }}
                </td>
                <td class="px-3 py-2 border-b border-r text-center font-mono text-[11px]"
                  :class="isDark ? 'border-[#222938] text-[#E2E8F0]' : 'border-slate-100 text-slate-700'">
                  {{ item.data.inicio_turno || '—' }}
                </td>
                <td class="px-3 py-2 border-b border-r text-center font-mono text-[11px]"
                  :class="isDark ? 'border-[#222938] text-[#E2E8F0]' : 'border-slate-100 text-slate-700'">
                  {{ item.data.fin_turno || '—' }}
                </td>
                <td class="px-3 py-2 border-b border-r text-center font-mono text-[11px]"
                  :class="isDark ? 'border-[#222938] text-[#4ade80]' : 'border-slate-100 text-[#16a34a]'">
                  {{ item.data.hora_inicio_laborado || '—' }}
                </td>
                <td class="px-3 py-2 border-b border-r text-center font-mono text-[11px]"
                  :class="isDark ? 'border-[#222938] text-[#4ade80]' : 'border-slate-100 text-[#16a34a]'">
                  {{ item.data.hora_fin_laborado || '—' }}
                </td>
                <td v-for="col in COLS_HX" :key="col"
                  class="px-2 py-2 border-b border-r text-center text-[11px]" :class="[
                    isDark ? 'border-[#222938]' : 'border-slate-100',
                    Number(item.data[col]) > 0
                      ? (isDark ? 'text-[#60A5FA] font-medium' : 'text-[#3B82F6] font-medium')
                      : (isDark ? 'text-[#3a3a42]' : 'text-slate-300')
                  ]">
                  {{ formatDecimal(item.data[col]) }}
                </td>
                <td class="px-2 py-2 border-b text-center text-[10px]"
                  :class="isDark ? 'border-[#222938] text-[#888888]' : 'border-slate-100 text-slate-400'">
                  {{ item.data.cargado_por || '—' }}
                </td>
              </tr>

              <!-- Subtotal -->
              <tr v-else-if="item.tipo === 'subtotal'">
                <td colspan="7" class="px-3 py-2 border-b border-r text-[10px] font-medium"
                  :class="isDark
                    ? 'bg-[#3B82F6]/[0.06] border-[#222938] text-[#60A5FA]'
                    : 'bg-blue-50/50 border-slate-200 text-blue-700'">
                  Subtotal — {{ item.data.nombre }}
                </td>
                <td v-for="col in COLS_HX" :key="col"
                  class="px-2 py-2 border-b border-r text-center text-[11px] font-semibold"
                  :class="isDark
                    ? 'bg-[#3B82F6]/[0.06] border-[#222938] text-[#60A5FA]'
                    : 'bg-blue-50/50 border-slate-200 text-blue-700'">
                  {{ formatDecimal(item.data.subtotales[col]) }}
                </td>
                <td class="border-b"
                  :class="isDark ? 'bg-[#3B82F6]/[0.06] border-[#222938]' : 'bg-blue-50/50 border-slate-200'"></td>
              </tr>

            </template>
          </tbody>
        </table>
      </div>

      <!-- Paginación Vercel -->
      <div v-if="filasAplanadas.length > 0" class="px-3 py-2 border-t flex items-center justify-between"
        :class="isDark ? 'border-[#222938] bg-[#0B0F19]/40' : 'border-slate-200 bg-slate-50/60'">
        <span class="text-[11px]" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
          <span :class="isDark ? 'text-white font-medium' : 'text-slate-900 font-medium'">{{ totalRegistros }}</span>
          {{ totalRegistros === 1 ? 'registro cargado' : 'registros cargados' }}
        </span>
        <div class="flex items-center gap-1.5">
          <button @click="currentPage--" :disabled="currentPage === 1"
            class="w-7 h-7 flex items-center justify-center rounded-[5px] border transition-all disabled:opacity-30"
            :class="isDark
              ? 'bg-[#161B26] border-[#222938] text-[#E2E8F0] hover:bg-white/[0.03] hover:border-[#3B82F6]/40'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'">
            <i class="fas fa-chevron-left text-[9px]"></i>
          </button>
          <div class="h-7 px-3 flex items-center rounded-[5px] text-[11px] font-medium border"
            :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-900'">
            {{ currentPage }} / {{ totalPages }}
          </div>
          <button @click="currentPage++" :disabled="currentPage >= totalPages"
            class="w-7 h-7 flex items-center justify-center rounded-[5px] border transition-all disabled:opacity-30"
            :class="isDark
              ? 'bg-[#161B26] border-[#222938] text-[#E2E8F0] hover:bg-white/[0.03] hover:border-[#3B82F6]/40'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'">
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

watch([startDate, endDate, filterNombre, filterDepartamento], () => { handleCargar(); });
watch(() => props.company, () => handleCargar());
onMounted(() => handleCargar());
</script>

<style></style>
