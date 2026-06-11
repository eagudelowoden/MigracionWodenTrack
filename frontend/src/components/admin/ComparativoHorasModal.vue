<template>
  <Transition name="fade">
    <div v-if="modelValue" class="ch-overlay" @click.self="emit('update:modelValue', false)">
      <Transition name="modal" appear>
        <div v-if="modelValue" class="ch-modal" :class="isDark ? 'ch-dark' : 'ch-light'">

          <!-- Header -->
          <header class="ch-header">
            <div class="ch-header-icon">
              <i class="fas fa-code-compare"></i>
            </div>
            <div class="ch-header-info">
              <p class="ch-eyebrow">Auditoría de horas</p>
              <h3 class="ch-title">Sistema vs Gerente</h3>
              <p class="ch-subtitle" v-if="lote">
                {{ lote.fecha_desde }} → {{ lote.fecha_hasta }}
                · <span class="font-medium">{{ lote.cargado_por }}</span>
              </p>
            </div>
            <button @click="emit('update:modelValue', false)" class="ch-close">
              <i class="fas fa-times"></i>
            </button>
          </header>

          <!-- Leyenda -->
          <div class="ch-legend">
            <span class="ch-badge ch-badge-igual"><i class="fas fa-equals text-[8px]"></i> Sin diferencia</span>
            <span class="ch-badge ch-badge-sube"><i class="fas fa-arrow-up text-[8px]"></i> Gerente subió</span>
            <span class="ch-badge ch-badge-baja"><i class="fas fa-arrow-down text-[8px]"></i> Gerente bajó</span>
            <span class="ch-badge ch-badge-solo"><i class="fas fa-question text-[8px]"></i> Solo en sistema</span>
          </div>

          <!-- Loading -->
          <div v-if="isLoading" class="ch-loading">
            <i class="fas fa-spinner fa-spin text-[#3B82F6] text-xl"></i>
            <span class="text-[12px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cargando comparativo…</span>
          </div>

          <!-- Sin datos -->
          <div v-else-if="!filas.length" class="ch-empty">
            <i class="fas fa-circle-check text-emerald-500 text-2xl"></i>
            <p :class="isDark ? 'text-slate-400' : 'text-slate-500'">No hay registros del sistema para comparar en este período.</p>
          </div>

          <!-- Tabla comparativa -->
          <div v-else class="ch-body custom-scroll">
            <table class="ch-table">
              <thead class="sticky top-0 z-10">
                <tr class="bg-[#1e2538]">
                  <th class="ch-th border-r" rowspan="2">Colaborador</th>
                  <th class="ch-th border-r" rowspan="2">Fecha</th>
                  <th v-for="col in COLS" :key="col" class="ch-th text-center border-r" colspan="3">
                    {{ col.toUpperCase() }}
                  </th>
                </tr>
                <tr class="bg-[#1e2538]">
                  <template v-for="col in COLS" :key="col + '_sub'">
                    <th class="ch-th-sub text-center border-r text-[#60A5FA]">Sis</th>
                    <th class="ch-th-sub text-center border-r text-emerald-400">Ger</th>
                    <th class="ch-th-sub text-center border-r">Δ</th>
                  </template>
                </tr>
              </thead>
              <tbody>
                <template v-for="(grupo, nombre) in gruposPorEmpleado" :key="nombre">
                  <!-- Cabecera empleado -->
                  <tr class="ch-row-emp">
                    <td :colspan="2 + COLS.length * 3" class="px-3 py-1.5 text-[10px] font-semibold border-b"
                      :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'">
                      <i class="fas fa-user mr-1.5 opacity-50"></i>{{ nombre }}
                    </td>
                  </tr>
                  <!-- Filas por fecha -->
                  <tr v-for="fila in grupo" :key="nombre + fila.fecha"
                    class="transition-colors"
                    :class="[fila.tieneDiff ? (isDark ? 'bg-amber-500/[0.04]' : 'bg-amber-50/60') : '',
                             isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50']">
                    <td class="ch-td border-r text-[10px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                      {{ fila.nombre }}
                    </td>
                    <td class="ch-td border-r text-center font-mono text-[10px]"
                      :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                      {{ fmt(fila.fecha) }}
                    </td>
                    <template v-for="col in COLS" :key="col">
                      <td class="ch-td text-center border-r text-[10px]"
                        :class="isDark ? 'text-[#60A5FA]' : 'text-blue-600'">
                        {{ fmtN(fila.sis[col]) }}
                      </td>
                      <td class="ch-td text-center border-r text-[10px]"
                        :class="isDark ? 'text-emerald-400' : 'text-emerald-700'">
                        {{ fmtN(fila.ger[col]) }}
                      </td>
                      <td class="ch-td text-center border-r text-[10px] font-semibold"
                        :class="deltaCls(fila.sis[col], fila.ger[col])">
                        {{ deltaStr(fila.sis[col], fila.ger[col]) }}
                      </td>
                    </template>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- Footer resumen -->
          <footer v-if="!isLoading && filas.length" class="ch-footer">
            <div class="flex items-center gap-4 text-[11px]">
              <span :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                <span class="font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ totalConDiff }}</span>
                registro(s) con diferencia
              </span>
              <span :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                <span class="font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ filas.length }}</span>
                total comparados
              </span>
            </div>
            <button @click="emit('update:modelValue', false)"
              class="h-7 px-4 rounded-md text-[11px] font-medium border transition-all"
              :class="isDark ? 'border-[#222938] text-slate-300 hover:text-white' : 'border-slate-200 text-slate-600 hover:text-slate-900'">
              Cerrar
            </button>
          </footer>

        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  isDark: Boolean,
  lote: Object,
  comparativo: Object,
  isLoading: Boolean,
});
const emit = defineEmits(['update:modelValue']);

const COLS = ['rn', 'rndf', 'rddf', 'hedo', 'heno', 'hefd', 'hefn'];

function fmt(f) {
  if (!f) return '—';
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y}`;
}
function fmtN(v) {
  const n = Number(v ?? 0);
  return n === 0 ? '—' : n.toFixed(2).replace('.', ',');
}
function delta(sis, ger) {
  return Number(ger ?? 0) - Number(sis ?? 0);
}
function deltaStr(sis, ger) {
  const d = delta(sis, ger);
  if (Math.abs(d) < 0.005) return '—';
  return (d > 0 ? '+' : '') + d.toFixed(2).replace('.', ',');
}
function deltaCls(sis, ger) {
  const d = delta(sis, ger);
  if (Math.abs(d) < 0.005) return '';
  return d > 0
    ? 'text-amber-500'
    : 'text-red-500';
}

// Construir filas combinando sistema y gerente por cedula+fecha
const filas = computed(() => {
  if (!props.comparativo) return [];
  const { gerente = [], sistema = [] } = props.comparativo;

  const sisMapa = new Map();
  for (const r of sistema) {
    sisMapa.set(`${r.cedula}__${r.fecha}`, r);
  }

  const result = [];
  for (const g of gerente) {
    const key = `${g.cedula}__${g.fecha}`;
    const s = sisMapa.get(key) ?? {};
    const tieneDiff = COLS.some(c => Math.abs(delta(s[c], g[c])) >= 0.005);
    result.push({ nombre: g.nombre, fecha: g.fecha, cedula: g.cedula, sis: s, ger: g, tieneDiff });
  }
  // Filas del sistema que el gerente no tocó
  const gerKeys = new Set(gerente.map(g => `${g.cedula}__${g.fecha}`));
  for (const s of sistema) {
    const key = `${s.cedula}__${s.fecha}`;
    if (!gerKeys.has(key)) {
      result.push({ nombre: s.nombre, fecha: s.fecha, cedula: s.cedula, sis: s, ger: {}, tieneDiff: true });
    }
  }

  return result.sort((a, b) => a.nombre.localeCompare(b.nombre) || a.fecha.localeCompare(b.fecha));
});

const gruposPorEmpleado = computed(() => {
  const m = {};
  for (const f of filas.value) {
    if (!m[f.nombre]) m[f.nombre] = [];
    m[f.nombre].push(f);
  }
  return m;
});

const totalConDiff = computed(() => filas.value.filter(f => f.tieneDiff).length);
</script>

<style scoped>
.ch-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.55);
}

.ch-modal {
  width: 100%;
  max-width: 820px;
  max-height: 90vh;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 60px -12px rgba(0,0,0,0.35);
  font-family: 'Inter', system-ui, sans-serif;
}

.ch-light { background: #ffffff; color: #09090b; border: 1px solid #e4e4e7; }
.ch-dark  { background: #161B26; color: #fafafa;  border: 1px solid #222938; }

.ch-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px 24px 14px;
  flex-shrink: 0;
  border-bottom: 1px solid;
}
.ch-dark  .ch-header { border-color: #222938; }
.ch-light .ch-header { border-color: #e4e4e7; }

.ch-header-icon {
  width: 36px; height: 36px; border-radius: 8px;
  background: rgba(59,130,246,.12); color: #60A5FA;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
}
.ch-header-info { flex: 1; }
.ch-eyebrow { font-size: 10px; font-weight: 500; color: #888; margin-bottom: 2px; }
.ch-title { font-size: 17px; font-weight: 600; letter-spacing: -0.015em; }
.ch-subtitle { font-size: 11px; color: #888; margin-top: 2px; }
.ch-close {
  width: 28px; height: 28px; border-radius: 6px;
  border: none; background: transparent; cursor: pointer;
  font-size: 13px; color: #888; transition: color .12s;
}
.ch-close:hover { color: inherit; }

.ch-legend {
  display: flex; flex-wrap: wrap; gap: 8px;
  padding: 10px 24px; flex-shrink: 0;
  border-bottom: 1px solid;
}
.ch-dark  .ch-legend { border-color: #222938; }
.ch-light .ch-legend { border-color: #e4e4e7; }

.ch-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 500; padding: 3px 8px; border-radius: 999px;
}
.ch-badge-igual { background: rgba(148,163,184,.12); color: #94a3b8; }
.ch-badge-sube  { background: rgba(245,158,11,.12);  color: #f59e0b; }
.ch-badge-baja  { background: rgba(239,68,68,.12);   color: #ef4444; }
.ch-badge-solo  { background: rgba(99,102,241,.12);  color: #818cf8; }

.ch-loading, .ch-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px; padding: 48px;
}

.ch-body {
  flex: 1; overflow: auto;
}

.ch-table {
  width: 100%; border-collapse: separate; border-spacing: 0; font-size: 11px;
}

.ch-th {
  padding: 8px 10px;
  text-align: left; font-size: 10px; font-weight: 500;
  text-transform: uppercase; letter-spacing: .04em;
  color: #f5f5f7; border-bottom: 1px solid #2a3245;
}
.ch-th-sub {
  padding: 4px 6px;
  font-size: 9px; font-weight: 400;
  color: #8b9ab4; border-bottom: 1px solid #2a3245;
}
.ch-td {
  padding: 7px 8px;
  border-bottom: 1px solid;
  white-space: nowrap;
}
.ch-dark  .ch-td { border-color: #222938; }
.ch-light .ch-td { border-color: #f0f0f0; }

.ch-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 24px; flex-shrink: 0; border-top: 1px solid;
}
.ch-dark  .ch-footer { border-color: #222938; background: #0B0F19; }
.ch-light .ch-footer { border-color: #e4e4e7; background: #fafafa; }

.custom-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
.custom-scroll::-webkit-scrollbar-thumb { background: #2a3245; border-radius: 999px; }

.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.modal-enter-active { transition: all .22s cubic-bezier(.16,1,.3,1); }
.modal-leave-active { transition: all .15s ease; }
.modal-enter-from { opacity: 0; transform: translateY(10px) scale(.98); }
.modal-leave-to { opacity: 0; }
</style>
