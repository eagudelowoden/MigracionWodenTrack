<template>
  <div class="h-full animate-fade-in flex flex-col gap-3">

    <!-- ── Toolbar ───────────────────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-md border"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

      <div class="flex items-center gap-2">
        <div class="w-7 h-7 bg-[#3B82F6]/10 text-[#3B82F6] rounded-md flex items-center justify-center">
          <i class="fas fa-file-arrow-up text-[11px]"></i>
        </div>
        <h2 class="text-[13px] font-semibold tracking-tight" :class="isDark ? 'text-white' : 'text-slate-900'">
          Cargue Horas CH
        </h2>
        <!-- Tabs vista -->
        <div class="flex items-center gap-0.5 p-0.5 rounded-md border ml-2"
          :class="isDark ? 'bg-[#0B0F19] border-[#222938]' : 'bg-slate-100 border-slate-200'">
          <button @click="vista = 'lotes'"
            class="px-2.5 h-6 rounded-[4px] text-[10px] font-medium transition-all"
            :class="vista === 'lotes'
              ? (isDark ? 'bg-[#161B26] text-white' : 'bg-white text-slate-900 shadow-sm')
              : (isDark ? 'text-[#888888] hover:text-white' : 'text-slate-500 hover:text-slate-800')">
            <i class="fas fa-layer-group mr-1 text-[9px]"></i>Por lote
          </button>
          <button @click="vista = 'historial'"
            class="px-2.5 h-6 rounded-[4px] text-[10px] font-medium transition-all"
            :class="vista === 'historial'
              ? (isDark ? 'bg-[#161B26] text-white' : 'bg-white text-slate-900 shadow-sm')
              : (isDark ? 'text-[#888888] hover:text-white' : 'text-slate-500 hover:text-slate-800')">
            <i class="fas fa-history mr-1 text-[9px]"></i>Historial
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-1.5">
        <!-- Notificar seleccionados (solo si hay lotes seleccionados) -->
        <button v-if="lotesSeleccionados.size > 0"
          @click="handleNotificarSeleccionados"
          :disabled="notificandoMasivo"
          class="flex items-center gap-1.5 h-7 px-3 rounded-[5px] border text-[10px] font-medium transition-all disabled:opacity-40"
          :class="isDark
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'">
          <i :class="notificandoMasivo ? 'fas fa-spinner fa-spin' : 'fas fa-paper-plane'" class="text-[9px]"></i>
          {{ notificandoMasivo ? 'Enviando…' : `Notificar (${lotesSeleccionados.size})` }}
        </button>
        <!-- Rango fechas -->
        <div class="flex items-center gap-2 h-7 px-2 rounded-[5px] border"
          :class="isDark ? 'bg-[#0B0F19] border-[#222938]' : 'bg-white border-slate-200'">
          <input v-model="startDate" type="date"
            class="bg-transparent text-[11px] font-medium outline-none cursor-pointer w-[100px]"
            :class="isDark ? 'text-white' : 'text-slate-700'" />
          <div class="w-px h-3" :class="isDark ? 'bg-[#222938]' : 'bg-slate-300'"></div>
          <input v-model="endDate" type="date"
            class="bg-transparent text-[11px] font-medium outline-none cursor-pointer w-[100px]"
            :class="isDark ? 'text-white' : 'text-slate-700'" />
        </div>
        <!-- Refrescar -->
        <button @click="recargar" :disabled="isLoading || isLoadingLotes"
          class="h-7 w-7 rounded-[5px] border flex items-center justify-center transition-all disabled:opacity-40"
          :class="isDark
            ? 'bg-[#0B0F19] border-[#222938] text-[#888888] hover:text-white'
            : 'bg-white border-slate-200 text-[#1e2538] hover:bg-black hover:text-white'">
          <i class="fas fa-arrows-rotate text-[10px]" :class="{ 'fa-spin': isLoading || isLoadingLotes }"></i>
        </button>
      </div>
    </div>

    <!-- ══ VISTA: LOTES ════════════════════════════════════════════════════════ -->
    <div v-if="vista === 'lotes'" class="flex-1 overflow-hidden rounded-md border flex flex-col"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

      <div v-if="isLoadingLotes" class="flex-1 flex items-center justify-center">
        <i class="fas fa-spinner fa-spin text-[#3B82F6] text-lg"></i>
      </div>

      <div v-else-if="!lotes.length" class="flex-1 flex flex-col items-center justify-center gap-3 p-12">
        <i class="fas fa-layer-group text-2xl" :class="isDark ? 'text-slate-600' : 'text-slate-300'"></i>
        <p class="text-[11px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
          No hay cargues en este rango de fechas
        </p>
      </div>

      <div v-else class="flex-1 overflow-y-auto">
        <table class="w-full border-separate border-spacing-0 text-[11px]">
          <thead class="sticky top-0 z-10">
            <tr class="bg-[#1e2538]">
              <!-- Checkbox seleccionar todos -->
              <th class="w-9 px-3 py-2.5 border-b border-[#2a3245]">
                <input type="checkbox" class="w-3.5 h-3.5 rounded accent-[#3B82F6] cursor-pointer"
                  :checked="lotes.length > 0 && lotesSeleccionados.size === lotes.length"
                  :indeterminate="lotesSeleccionados.size > 0 && lotesSeleccionados.size < lotes.length"
                  @change="toggleSelectAll" />
              </th>
              <th class="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#2a3245] text-[#f5f5f7]">Período</th>
              <th class="px-3 py-2.5 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#2a3245] text-[#f5f5f7]">Origen</th>
              <th class="px-3 py-2.5 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#2a3245] text-[#f5f5f7]">Registros</th>
              <th class="px-3 py-2.5 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#2a3245] text-[#f5f5f7]">Cargado por</th>
              <th class="px-3 py-2.5 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#2a3245] text-[#f5f5f7]">Fecha cargue</th>
              <th class="px-3 py-2.5 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#2a3245] text-[#f5f5f7]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(lote, idx) in lotes" :key="lote.lote_id"
              class="transition-colors cursor-pointer"
              :class="[
                lotesSeleccionados.has(lote.lote_id) ? (isDark ? 'bg-blue-500/[0.07]' : 'bg-blue-50/60') : (idx % 2 !== 0 ? (isDark ? 'bg-white/[0.02]' : 'bg-slate-50/60') : ''),
              ]"
              @click.exact="toggleLote(lote.lote_id)">

              <!-- Checkbox -->
              <td class="w-9 px-3 py-3 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                <input type="checkbox" class="w-3.5 h-3.5 rounded accent-[#3B82F6] cursor-pointer"
                  :checked="lotesSeleccionados.has(lote.lote_id)"
                  @click.stop
                  @change="toggleLote(lote.lote_id)" />
              </td>

              <!-- Período -->
              <td class="px-4 py-3 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                <div class="font-mono text-[11px]" :class="isDark ? 'text-white' : 'text-slate-900'">
                  {{ fmt(lote.fecha_desde) }} — {{ fmt(lote.fecha_hasta) }}
                </div>
                <div class="text-[9px] mt-0.5" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                  {{ lote.company || '—' }}
                </div>
              </td>

              <!-- Origen badge -->
              <td class="px-3 py-3 border-b text-center" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-semibold"
                  :class="lote.origen === 'gerente'
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-blue-500/15 text-blue-400'">
                  <i :class="lote.origen === 'gerente' ? 'fas fa-user-tie' : 'fas fa-robot'" class="text-[8px]"></i>
                  {{ lote.origen === 'gerente' ? 'Gerente' : 'Sistema' }}
                </span>
              </td>

              <!-- Registros -->
              <td class="px-3 py-3 border-b text-center font-mono text-[12px] font-semibold"
                :class="isDark ? 'border-[#222938] text-slate-200' : 'border-slate-100 text-slate-700'">
                {{ lote.registros }}
              </td>

              <!-- Cargado por -->
              <td class="px-3 py-3 border-b text-[10px]"
                :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-600'">
                {{ lote.cargado_por || '—' }}
              </td>

              <!-- Fecha cargue -->
              <td class="px-3 py-3 border-b text-center text-[10px] font-mono"
                :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">
                {{ fmtDatetime(lote.created_at) }}
              </td>

              <!-- Acciones -->
              <td class="px-3 py-3 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'" @click.stop>
                <div class="flex items-center justify-center gap-1.5">
                  <!-- Ver vs Sistema (solo si origen = gerente) -->
                  <button v-if="lote.origen === 'gerente'"
                    @click="abrirComparativo(lote)"
                    class="flex items-center gap-1 h-6 px-2.5 rounded-[4px] border text-[10px] font-medium transition-all"
                    :class="isDark
                      ? 'border-violet-500/30 text-violet-400 hover:bg-violet-500/10'
                      : 'border-violet-300 text-violet-700 hover:bg-violet-50'">
                    <i class="fas fa-code-compare text-[9px]"></i> vs Sistema
                  </button>
                  <!-- Notificar -->
                  <button @click="handleNotificarLote(lote)"
                    :disabled="notificandoLoteId === lote.lote_id"
                    class="flex items-center gap-1 h-6 px-2.5 rounded-[4px] border text-[10px] font-medium transition-all disabled:opacity-40"
                    :class="isDark
                      ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                      : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'">
                    <i :class="notificandoLoteId === lote.lote_id ? 'fas fa-spinner fa-spin' : 'fas fa-envelope'" class="text-[9px]"></i>
                    {{ notificandoLoteId === lote.lote_id ? 'Enviando…' : 'Notificar' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ VISTA: HISTORIAL (tabla original) ════════════════════════════════════ -->
    <div v-else class="flex-1 overflow-hidden rounded-md border flex flex-col"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

      <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
        <table class="w-full border-separate border-spacing-0 text-[11px]">
          <thead class="sticky top-0 z-30">
            <tr class="bg-[#1e2538]">
              <th colspan="2" class="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-r border-[#f5f5f7] text-[#f5f5f7]">Colaborador</th>
              <th class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-r border-[#f5f5f7] text-[#f5f5f7]">Fecha</th>
              <th colspan="2" class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-r border-[#f5f5f7] text-[#f5f5f7]">Jornada</th>
              <th colspan="2" class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-r border-[#f5f5f7] text-[#f5f5f7]">Tiempo laborado</th>
              <th v-for="col in COLS_HX" :key="col" class="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-r border-[#f5f5f7] text-[#f5f5f7] w-12">
                {{ col.toUpperCase() }}
              </th>
              <th class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">Origen</th>
            </tr>
            <tr class="bg-[#1e2538]">
              <th class="px-3 py-1.5 text-left text-[9px] font-normal border-b border-r border-[#f5f5f7] text-[#f5f5f7] w-28">Cédula</th>
              <th class="px-3 py-1.5 text-left text-[9px] font-normal border-b border-r border-[#f5f5f7] text-[#f5f5f7]">Nombre</th>
              <th class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r border-[#f5f5f7] text-[#f5f5f7] w-24"></th>
              <th class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r border-[#f5f5f7] text-[#f5f5f7] w-20">Inicio</th>
              <th class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r border-[#f5f5f7] text-[#f5f5f7] w-20">Fin</th>
              <th class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r border-[#f5f5f7] text-[#f5f5f7] w-20">Entrada</th>
              <th class="px-3 py-1.5 text-center text-[9px] font-normal border-b border-r border-[#f5f5f7] text-[#f5f5f7] w-20">Salida</th>
              <th v-for="_ in 7" :key="_" class="px-2 py-1.5 text-center text-[9px] font-normal border-b border-r border-[#f5f5f7] text-[#f5f5f7]">hrs</th>
              <th class="px-3 py-1.5 border-b border-[#222938]"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading" v-for="n in 8" :key="'sk-' + n">
              <td colspan="16" class="px-3 py-3">
                <div class="h-3 w-full rounded animate-pulse" :class="isDark ? 'bg-[#222938]/40' : 'bg-slate-100'"></div>
              </td>
            </tr>
            <tr v-else-if="!filasPaginadas.length">
              <td colspan="16" class="px-4 py-14 text-center">
                <p class="text-[11px]" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">No hay registros en este rango</p>
              </td>
            </tr>
            <template v-else v-for="(item, idx) in filasPaginadas" :key="idx">
              <tr v-if="item.tipo === 'empresa'">
                <td colspan="16" class="px-4 py-2 text-[10px] font-medium border-b"
                  :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-[#E2E8F0]' : 'bg-slate-100 border-slate-200 text-slate-700'">
                  <i class="fas fa-building mr-2 opacity-60 text-[#3B82F6]"></i>{{ item.data.empresa }}
                </td>
              </tr>
              <tr v-else-if="item.tipo === 'fila'" class="group transition-colors"
                :class="idx % 2 !== 0 ? (isDark ? 'bg-white/[0.02]' : 'bg-slate-50/60') : ''">
                <td class="px-3 py-2 border-b border-r font-mono text-[10px]" :class="isDark ? 'border-[#222938] text-[#888888]' : 'border-slate-100 text-slate-500'">{{ item.data.cedula || '—' }}</td>
                <td class="px-3 py-2 border-b border-r" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <div class="text-[11px] font-medium" :class="isDark ? 'text-white' : 'text-slate-900'">{{ item.data.nombre }}</div>
                </td>
                <td class="px-3 py-2 border-b border-r text-center text-[11px]" :class="isDark ? 'border-[#222938] text-[#E2E8F0]' : 'border-slate-100 text-slate-700'">{{ formatFecha(item.data.fecha) }}</td>
                <td class="px-3 py-2 border-b border-r text-center font-mono text-[11px]" :class="isDark ? 'border-[#222938] text-[#E2E8F0]' : 'border-slate-100 text-slate-700'">{{ item.data.inicio_turno || '—' }}</td>
                <td class="px-3 py-2 border-b border-r text-center font-mono text-[11px]" :class="isDark ? 'border-[#222938] text-[#E2E8F0]' : 'border-slate-100 text-slate-700'">{{ item.data.fin_turno || '—' }}</td>
                <td class="px-3 py-2 border-b border-r text-center font-mono text-[11px]" :class="isDark ? 'border-[#222938] text-[#4ade80]' : 'border-slate-100 text-[#16a34a]'">{{ item.data.hora_inicio_laborado || '—' }}</td>
                <td class="px-3 py-2 border-b border-r text-center font-mono text-[11px]" :class="isDark ? 'border-[#222938] text-[#4ade80]' : 'border-slate-100 text-[#16a34a]'">{{ item.data.hora_fin_laborado || '—' }}</td>
                <td v-for="col in COLS_HX" :key="col" class="px-2 py-2 border-b border-r text-center text-[11px]"
                  :class="[isDark ? 'border-[#222938]' : 'border-slate-100',
                    Number(item.data[col]) > 0 ? (isDark ? 'text-[#60A5FA] font-medium' : 'text-[#3B82F6] font-medium') : (isDark ? 'text-[#3a3a42]' : 'text-slate-300')]">
                  {{ formatDecimal(item.data[col]) }}
                </td>
                <!-- Origen badge en detalle -->
                <td class="px-2 py-2 border-b text-center" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                  <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-semibold"
                    :class="item.data.origen === 'gerente' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'">
                    <i :class="item.data.origen === 'gerente' ? 'fas fa-user-tie' : 'fas fa-robot'" class="text-[7px]"></i>
                    {{ item.data.origen === 'gerente' ? 'Gte' : 'Sis' }}
                  </span>
                </td>
              </tr>
              <tr v-else-if="item.tipo === 'subtotal'">
                <td colspan="7" class="px-3 py-2 border-b border-r text-[10px] font-medium"
                  :class="isDark ? 'bg-[#3B82F6]/[0.06] border-[#222938] text-[#60A5FA]' : 'bg-blue-50/50 border-slate-200 text-blue-700'">
                  Subtotal — {{ item.data.nombre }}
                </td>
                <td v-for="col in COLS_HX" :key="col" class="px-2 py-2 border-b border-r text-center text-[11px] font-semibold"
                  :class="isDark ? 'bg-[#3B82F6]/[0.06] border-[#222938] text-[#60A5FA]' : 'bg-blue-50/50 border-slate-200 text-blue-700'">
                  {{ formatDecimal(item.data.subtotales[col]) }}
                </td>
                <td class="border-b" :class="isDark ? 'bg-[#3B82F6]/[0.06] border-[#222938]' : 'bg-blue-50/50 border-slate-200'"></td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="filasAplanadas.length > 0" class="px-3 py-2 border-t flex items-center justify-between"
        :class="isDark ? 'border-[#222938] bg-[#0B0F19]/40' : 'border-slate-200 bg-slate-50/60'">
        <span class="text-[11px]" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
          <span class="font-medium" :class="isDark ? 'text-white' : 'text-slate-900'">{{ totalRegistros }}</span> registros
        </span>
        <div class="flex items-center gap-1.5">
          <button @click="currentPage--" :disabled="currentPage === 1"
            class="w-7 h-7 flex items-center justify-center rounded-[5px] border transition-all disabled:opacity-30"
            :class="isDark ? 'bg-[#161B26] border-[#222938] text-[#E2E8F0]' : 'bg-white border-slate-200 text-slate-700'">
            <i class="fas fa-chevron-left text-[9px]"></i>
          </button>
          <div class="h-7 px-3 flex items-center rounded-[5px] text-[11px] font-medium border"
            :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-900'">
            {{ currentPage }} / {{ totalPages }}
          </div>
          <button @click="currentPage++" :disabled="currentPage >= totalPages"
            class="w-7 h-7 flex items-center justify-center rounded-[5px] border transition-all disabled:opacity-30"
            :class="isDark ? 'bg-[#161B26] border-[#222938] text-[#E2E8F0]' : 'bg-white border-slate-200 text-slate-700'">
            <i class="fas fa-chevron-right text-[9px]"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- ══ MODAL COMPARATIVO ═══════════════════════════════════════════════════ -->
    <ComparativoHorasModal
      v-model="showComparativo"
      :isDark="isDark"
      :lote="loteSeleccionado"
      :comparativo="comparativo"
      :isLoading="isLoadingComparativo"
    />

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useCargueHoras } from '../../composables/adminLogica/useCargueHoras';
import ComparativoHorasModal from './ComparativoHorasModal.vue';

const props = defineProps({
  isDark: Boolean,
  company: String,
});

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
  // Lotes
  lotes,
  isLoadingLotes,
  cargarLotes,
  // Comparativo
  comparativo,
  isLoadingComparativo,
  cargarComparativo,
  // Notificar
  isNotifyingCargue,
  notificarLote,
} = useCargueHoras();

const vista = ref('lotes');
const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
const endDate = ref(new Date().toISOString().slice(0, 10));

// ── Selección masiva ──────────────────────────────────────────────────────────
const lotesSeleccionados = ref(new Set());

function toggleLote(loteId) {
  const s = new Set(lotesSeleccionados.value);
  s.has(loteId) ? s.delete(loteId) : s.add(loteId);
  lotesSeleccionados.value = s;
}

function toggleSelectAll() {
  if (lotesSeleccionados.value.size === lotes.value.length) {
    lotesSeleccionados.value = new Set();
  } else {
    lotesSeleccionados.value = new Set(lotes.value.map(l => l.lote_id));
  }
}

// ── Notificar masivo ──────────────────────────────────────────────────────────
const notificandoMasivo = ref(false);

async function handleNotificarSeleccionados() {
  notificandoMasivo.value = true;
  try {
    const ids = Array.from(lotesSeleccionados.value);
    for (const id of ids) {
      await notificarLote(id);
    }
    lotesSeleccionados.value = new Set();
  } catch { /* silencioso */ } finally {
    notificandoMasivo.value = false;
  }
}

// ── Comparativo modal ─────────────────────────────────────────────────────────
const showComparativo = ref(false);
const loteSeleccionado = ref(null);

async function abrirComparativo(lote) {
  loteSeleccionado.value = lote;
  showComparativo.value = true;
  await cargarComparativo(lote.lote_id);
}

// ── Notificar lote individual ─────────────────────────────────────────────────
const notificandoLoteId = ref(null);

async function handleNotificarLote(lote) {
  notificandoLoteId.value = lote.lote_id;
  try {
    await notificarLote(lote.lote_id);
  } catch { /* silencioso */ } finally {
    notificandoLoteId.value = null;
  }
}

// ── Helpers de formato ────────────────────────────────────────────────────────
function fmt(f) {
  if (!f) return '—';
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y}`;
}
function fmtDatetime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Carga ─────────────────────────────────────────────────────────────────────
async function recargar() {
  lotesSeleccionados.value = new Set();
  const params = { startDate: startDate.value, endDate: endDate.value, company: props.company };
  await Promise.all([
    cargarLotes(params),
    cargarHistorial(params),
  ]);
}

watch([startDate, endDate], () => recargar());
watch(() => props.company, () => recargar());
onMounted(() => recargar());
</script>

<style></style>
