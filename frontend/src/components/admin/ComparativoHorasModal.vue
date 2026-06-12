<template>
  <Teleport to="body">
  <Transition name="fade">
    <div v-if="modelValue" class="ch-overlay" @click.self="emit('update:modelValue', false)">
      <Transition name="modal" appear>
        <div v-if="modelValue" class="ch-modal">

          <!-- Header -->
          <div class="ch-header">
            <div class="ch-avatar">
              <i class="fas fa-code-compare" style="font-size:17px;color:#7c3aed;"></i>
            </div>
            <div style="flex:1;">
              <div class="ch-eyebrow">Auditoría de horas</div>
              <div class="ch-title">Sistema vs Gerente</div>
              <div class="ch-sub" v-if="lote">
                {{ lote.fecha_desde }} → {{ lote.fecha_hasta }} · <strong>{{ lote.cargado_por }}</strong>
              </div>
            </div>
            <button @click="emit('update:modelValue', false)" class="ch-close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Leyenda -->
          <div class="ch-legend">
            <span class="ch-badge ch-igual"><i class="fas fa-equals" style="font-size:8px;"></i> Sin diferencia</span>
            <span class="ch-badge ch-sube"><i class="fas fa-arrow-up" style="font-size:8px;"></i> Gerente subió</span>
            <span class="ch-badge ch-baja"><i class="fas fa-arrow-down" style="font-size:8px;"></i> Gerente bajó</span>
            <span class="ch-badge ch-solo"><i class="fas fa-question" style="font-size:8px;"></i> Solo en sistema</span>
          </div>

          <div class="ch-divider"></div>

          <!-- Loading -->
          <div v-if="isLoading" class="ch-state">
            <i class="fas fa-spinner fa-spin" style="font-size:20px;color:#3B82F6;"></i>
            <span class="ch-state-txt">Cargando comparativo…</span>
          </div>

          <!-- Sin datos -->
          <div v-else-if="!filas.length" class="ch-state">
            <i class="fas fa-circle-check" style="font-size:22px;color:#16a34a;"></i>
            <span class="ch-state-txt">No hay registros del sistema para comparar en este período.</span>
          </div>

          <!-- Tabla -->
          <div v-else class="ch-body">
            <table class="ch-table">
              <thead>
                <tr>
                  <th class="ch-th" rowspan="2" style="min-width:180px;">Colaborador</th>
                  <th class="ch-th text-center" rowspan="2" style="min-width:90px;">Fecha</th>
                  <th v-for="col in COLS" :key="col" class="ch-th text-center" colspan="3" style="min-width:90px;">
                    {{ col.toUpperCase() }}
                  </th>
                </tr>
                <tr>
                  <template v-for="col in COLS" :key="col + '_sub'">
                    <th class="ch-th-sub text-center" style="color:#2563eb;">Sis</th>
                    <th class="ch-th-sub text-center" style="color:#16a34a;">Ger</th>
                    <th class="ch-th-sub text-center">Δ</th>
                  </template>
                </tr>
              </thead>
              <tbody>
                <template v-for="(grupo, nombre) in gruposPorEmpleado" :key="nombre">
                  <tr class="ch-row-emp">
                    <td :colspan="2 + COLS.length * 3" class="ch-emp-cell">
                      <i class="fas fa-user" style="opacity:.45;margin-right:6px;font-size:9px;"></i>{{ nombre }}
                    </td>
                  </tr>
                  <tr v-for="fila in grupo" :key="nombre + fila.fecha"
                    class="ch-row"
                    :class="fila.tieneDiff ? 'ch-row-diff' : ''">
                    <td class="ch-td" style="font-size:11px;color:#6b7280;">{{ fila.nombre }}</td>
                    <td class="ch-td text-center ch-mono" style="font-size:11px;color:#374151;">{{ fmt(fila.fecha) }}</td>
                    <template v-for="col in COLS" :key="col">
                      <td class="ch-td text-center" style="font-size:11px;color:#2563eb;">{{ fmtN(fila.sis[col]) }}</td>
                      <td class="ch-td text-center" style="font-size:11px;color:#16a34a;">{{ fmtN(fila.ger[col]) }}</td>
                      <td class="ch-td text-center ch-delta" :class="deltaCls(fila.sis[col], fila.ger[col])">
                        {{ deltaStr(fila.sis[col], fila.ger[col]) }}
                      </td>
                    </template>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div v-if="!isLoading && filas.length" class="ch-footer">
            <div style="display:flex;gap:20px;">
              <span class="ch-footer-txt">
                <strong>{{ totalConDiff }}</strong> registro(s) con diferencia
              </span>
              <span class="ch-footer-txt">
                <strong>{{ filas.length }}</strong> total comparados
              </span>
            </div>
            <button @click="emit('update:modelValue', false)" class="ch-close-footer">Cerrar</button>
          </div>

        </div>
      </Transition>
    </div>
  </Transition>
  </Teleport>
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
  return d > 0 ? 'ch-delta-up' : 'ch-delta-down';
}

const filas = computed(() => {
  if (!props.comparativo) return [];
  const { gerente = [], sistema = [] } = props.comparativo;
  const sisMapa = new Map();
  for (const r of sistema) sisMapa.set(`${r.cedula}__${r.fecha}`, r);

  const result = [];
  for (const g of gerente) {
    const key = `${g.cedula}__${g.fecha}`;
    const s = sisMapa.get(key) ?? {};
    const tieneDiff = COLS.some(c => Math.abs(delta(s[c], g[c])) >= 0.005);
    result.push({ nombre: g.nombre, fecha: g.fecha, cedula: g.cedula, sis: s, ger: g, tieneDiff });
  }
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
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  padding: 12px;
  background: rgba(0,0,0,0.45);
}

.ch-modal {
  width: 98vw; max-width: 98vw; max-height: 95vh;
  border-radius: 12px;
  display: flex; flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 20px 60px -10px rgba(0,0,0,0.18);
  font-family: 'Inter', system-ui, sans-serif;
  color: #111827;
}

/* Header */
.ch-header {
  display: flex; align-items: center; gap: 14px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}
.ch-avatar {
  width: 44px; height: 44px; border-radius: 10px;
  background: #f5f3ff; border: 1px solid #ddd6fe;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.ch-eyebrow { font-size: 10px; font-weight: 600; color: #9ca3af; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 2px; }
.ch-title   { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: #111827; }
.ch-sub     { font-size: 12px; color: #6b7280; margin-top: 2px; }
.ch-close-btn {
  width: 30px; height: 30px; border-radius: 6px;
  border: 1px solid #e5e7eb; background: #fff; cursor: pointer;
  font-size: 12px; color: #9ca3af; transition: all .12s;
  display: flex; align-items: center; justify-content: center;
}
.ch-close-btn:hover { background: #f9fafb; color: #374151; }

/* Leyenda */
.ch-legend {
  display: flex; flex-wrap: wrap; gap: 8px;
  padding: 10px 24px;
  flex-shrink: 0;
}
.ch-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 999px;
}
.ch-igual { background: #f1f5f9; color: #64748b; }
.ch-sube  { background: #fffbeb; color: #92400e; }
.ch-baja  { background: #fef2f2; color: #991b1b; }
.ch-solo  { background: #eef2ff; color: #3730a3; }

.ch-divider { height: 1px; background: #f3f4f6; flex-shrink: 0; }

/* States */
.ch-state {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px; padding: 48px;
}
.ch-state-txt { font-size: 13px; color: #6b7280; }

/* Table */
.ch-body { flex: 1; overflow: auto; }
.ch-body::-webkit-scrollbar { width: 5px; height: 5px; }
.ch-body::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 999px; }

.ch-table { width: 100%; border-collapse: separate; border-spacing: 0; }

.ch-th {
  position: sticky; top: 0; z-index: 5;
  padding: 9px 10px;
  font-size: 10px; font-weight: 600;
  text-transform: uppercase; letter-spacing: .05em; color: #6b7280;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap; text-align: left;
}
.ch-th-sub {
  position: sticky; top: 33px; z-index: 5;
  padding: 4px 8px;
  font-size: 9px; font-weight: 600;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.ch-row-emp {}
.ch-emp-cell {
  padding: 6px 12px;
  font-size: 11px; font-weight: 600; color: #374151;
  background: #f9fafb;
  border-bottom: 1px solid #f3f4f6;
  border-top: 1px solid #f3f4f6;
}

.ch-row { transition: background .1s; }
.ch-row:hover { background: #fafafa; }
.ch-row-diff { background: #fffbeb !important; }
.ch-row-diff:hover { background: #fef9e7 !important; }

.ch-td {
  padding: 7px 10px;
  border-bottom: 1px solid #f3f4f6;
  white-space: nowrap;
}
.ch-mono { font-family: 'JetBrains Mono', monospace; }
.ch-delta { font-size: 11px; font-weight: 700; }
.ch-delta-up   { color: #d97706; }
.ch-delta-down { color: #dc2626; }

/* Footer */
.ch-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 24px;
  border-top: 1px solid #f3f4f6;
  background: #fafafa;
  flex-shrink: 0;
}
.ch-footer-txt { font-size: 12px; color: #6b7280; }
.ch-footer-txt strong { color: #111827; font-weight: 600; }
.ch-close-footer {
  height: 30px; padding: 0 16px; border-radius: 6px;
  border: 1px solid #e5e7eb; background: #fff;
  font-size: 12px; font-weight: 500; color: #374151;
  cursor: pointer; transition: all .12s;
}
.ch-close-footer:hover { background: #f3f4f6; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.modal-enter-active { transition: all .22s cubic-bezier(.16,1,.3,1); }
.modal-leave-active { transition: all .15s ease; }
.modal-enter-from { opacity: 0; transform: translateY(10px) scale(.98); }
.modal-leave-to { opacity: 0; }
</style>
