<template>
  <Teleport to="body">
  <Transition name="fade">
    <div v-if="modelValue" class="rl-overlay" @click.self="emit('update:modelValue', false)">
      <Transition name="modal" appear>
        <div v-if="modelValue" class="rl-shell">

          <!-- ── Barra título Excel ─────────────────────────────────────────── -->
          <div class="rl-titlebar">
            <div class="rl-titlebar-left">
              <i class="fas fa-file-excel rl-xls-icon"></i>
              <span class="rl-filename">novedades_hx_{{ lote?.fecha_desde || '' }}.xlsx</span>
              <span class="rl-saved">· Registros cargados</span>
            </div>
            <button @click="emit('update:modelValue', false)" class="rl-win-close" title="Cerrar">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- ── Ribbon ────────────────────────────────────────────────────── -->
          <div class="rl-ribbon">
            <div class="rl-ribbon-info">
              <span class="rl-ribbon-chip">
                <i class="fas fa-calendar-alt" style="font-size:9px;"></i>
                {{ fmt(lote?.fecha_desde) }} — {{ fmt(lote?.fecha_hasta) }}
              </span>
              <span class="rl-ribbon-chip">
                <i class="fas fa-user-tie" style="font-size:9px;"></i>
                {{ lote?.cargado_por }}
              </span>
              <span class="rl-ribbon-chip rl-chip-green">
                <i class="fas fa-table" style="font-size:9px;"></i>
                {{ registros.length }} filas
              </span>
            </div>
            <div class="rl-ribbon-right">
              <span class="rl-cell-ref">A1</span>
              <div class="rl-formula-bar">
                <span class="rl-fx">fx</span>
                <span class="rl-formula-val">Novedades Horas Extra</span>
              </div>
            </div>
          </div>

          <!-- ── Loading ───────────────────────────────────────────────────── -->
          <div v-if="isLoading" class="rl-loading">
            <i class="fas fa-spinner fa-spin" style="font-size:22px;color:#217346;"></i>
            <span style="font-size:12px;color:#555;">Cargando hoja de cálculo…</span>
          </div>

          <!-- ── Sin datos ──────────────────────────────────────────────────── -->
          <div v-else-if="!registros.length" class="rl-loading">
            <i class="fas fa-inbox" style="font-size:22px;color:#bbb;"></i>
            <span style="font-size:12px;color:#888;">No hay registros para este lote.</span>
          </div>

          <!-- ── Hoja Excel ─────────────────────────────────────────────────── -->
          <div v-else class="rl-sheet-wrap">
            <table class="rl-sheet">
              <thead>
                <!-- Fila letras de columna -->
                <tr class="rl-col-letters">
                  <th class="rl-corner"></th>
                  <th v-for="(_, ci) in colCount" :key="'ltr'+ci" class="rl-col-letter">
                    {{ colLetter(ci) }}
                  </th>
                </tr>
                <!-- Fila 1: cabeceras agrupadas -->
                <tr class="rl-head1">
                  <th class="rl-rownum-head" rowspan="2">#</th>
                  <th class="rl-hg rl-hg-dark" colspan="2">COLABORADOR</th>
                  <th class="rl-hg rl-hg-dark" colspan="1">FECHA</th>
                  <th class="rl-hg rl-hg-mid" colspan="2">JORNADA LABORAL</th>
                  <th class="rl-hg rl-hg-mid" colspan="2">TIEMPO LABORADO</th>
                  <th v-for="col in HX_COLS" :key="col" class="rl-hg rl-hg-hrs">
                    {{ col.toUpperCase() }}
                  </th>
                </tr>
                <!-- Fila 2: sub-cabeceras -->
                <tr class="rl-head2">
                  <th class="rl-hs rl-hg-dark" style="min-width:110px;">Cédula</th>
                  <th class="rl-hs rl-hg-dark" style="min-width:190px;">Nombre</th>
                  <th class="rl-hs rl-hg-dark" style="min-width:90px;">Fecha</th>
                  <th class="rl-hs rl-hg-mid" style="min-width:80px;">Hora Inicial</th>
                  <th class="rl-hs rl-hg-mid" style="min-width:80px;">Hora Final</th>
                  <th class="rl-hs rl-hg-mid" style="min-width:80px;">Hora Inicial</th>
                  <th class="rl-hs rl-hg-mid" style="min-width:80px;">Hora Final</th>
                  <th v-for="col in HX_COLS" :key="col+'_sub'" class="rl-hs rl-hg-hrs" style="min-width:54px;">0</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(grupo, empresa) in gruposPorEmpresa" :key="empresa">
                  <!-- Fila empresa -->
                  <tr class="rl-row-empresa">
                    <td class="rl-rownum rl-rownum-emp"></td>
                    <td :colspan="7 + HX_COLS.length" class="rl-empresa-cell">
                      {{ empresa }}
                    </td>
                  </tr>
                  <template v-for="(filas, nombre) in grupo" :key="empresa+nombre">
                    <!-- Filas de datos -->
                    <tr v-for="(row, ri) in filas" :key="nombre+ri"
                      class="rl-data-row"
                      :class="rowIndex(empresa, nombre, ri) % 2 === 1 ? 'rl-row-alt' : ''">
                      <td class="rl-rownum">{{ globalIndex(empresa, nombre, ri) }}</td>
                      <td class="rl-cell rl-cell-mono">{{ row.cedula || '' }}</td>
                      <td class="rl-cell rl-cell-name">{{ row.nombre || '' }}</td>
                      <td class="rl-cell rl-cell-center rl-cell-mono">{{ fmt(row.fecha) }}</td>
                      <td class="rl-cell rl-cell-center rl-cell-mono">{{ row.inicio_turno || '' }}</td>
                      <td class="rl-cell rl-cell-center rl-cell-mono">{{ row.fin_turno || '' }}</td>
                      <td class="rl-cell rl-cell-center rl-cell-mono rl-laborado">{{ row.hora_inicio_laborado || '' }}</td>
                      <td class="rl-cell rl-cell-center rl-cell-mono rl-laborado">{{ row.hora_fin_laborado || '' }}</td>
                      <td v-for="col in HX_COLS" :key="col" class="rl-cell rl-cell-num"
                        :class="Number(row[col]) > 0 ? 'rl-num-active' : 'rl-num-zero'">
                        {{ fmtN(row[col]) }}
                      </td>
                    </tr>
                    <!-- Fila subtotal -->
                    <tr class="rl-row-subtotal">
                      <td class="rl-rownum rl-rownum-sub"></td>
                      <td colspan="7" class="rl-subtotal-label">
                        SUBTOTAL – {{ nombre }}
                      </td>
                      <td v-for="col in HX_COLS" :key="'sub'+col" class="rl-subtotal-num">
                        {{ subtotal(filas, col) }}
                      </td>
                    </tr>
                  </template>
                </template>
                <!-- Filas vacías finales -->
                <tr v-for="n in 4" :key="'empty'+n" class="rl-data-row rl-row-empty">
                  <td class="rl-rownum">{{ registros.length + n }}</td>
                  <td v-for="i in 7 + HX_COLS.length" :key="'ev'+i" class="rl-cell"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- ── Barra de estado ────────────────────────────────────────────── -->
          <div class="rl-statusbar">
            <div class="rl-statusbar-left">
              <span class="rl-sheet-tab">
                <i class="fas fa-table" style="font-size:9px;margin-right:4px;"></i>Reporte HX
              </span>
            </div>
            <div class="rl-statusbar-right" v-if="!isLoading && registros.length">
              <span>Recuento: <strong>{{ registros.length }}</strong></span>
              <span class="rl-bar-sep">|</span>
              <span>Total HEDO: <strong>{{ sumCol('hedo') }}</strong></span>
              <span class="rl-bar-sep">|</span>
              <span>Total HENO: <strong>{{ sumCol('heno') }}</strong></span>
              <span class="rl-bar-sep">|</span>
              <span>Total HEFD: <strong>{{ sumCol('hefd') }}</strong></span>
            </div>
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
  registros: { type: Array, default: () => [] },
  isLoading: Boolean,
});
const emit = defineEmits(['update:modelValue']);

const HX_COLS = ['rn', 'rndf', 'rddf', 'hedo', 'heno', 'hefd', 'hefn'];
const colCount = computed(() => 7 + HX_COLS.length); // cedula, nombre, fecha, 2 jornada, 2 laborado, 7 horas

function colLetter(i) {
  let s = '', n = i;
  do { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; } while (n >= 0);
  return s;
}

function fmt(f) {
  if (!f) return '';
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y}`;
}
function fmtN(v) {
  const n = Number(v ?? 0);
  return n === 0 ? '0' : n.toFixed(2);
}
function sumCol(col) {
  return props.registros.reduce((a, r) => a + Number(r[col] || 0), 0).toFixed(2);
}
function subtotal(filas, col) {
  return filas.reduce((a, r) => a + Number(r[col] || 0), 0).toFixed(2);
}

// Agrupa: empresa → nombre → [filas]
const gruposPorEmpresa = computed(() => {
  const m = {};
  for (const r of props.registros) {
    const emp = r.company || 'Sin empresa';
    const nom = r.nombre || r.cedula || '—';
    if (!m[emp]) m[emp] = {};
    if (!m[emp][nom]) m[emp][nom] = [];
    m[emp][nom].push(r);
  }
  return m;
});

// Para numeración de filas
let _globalRow = 0;
const rowMap = computed(() => {
  const map = [];
  let i = 1;
  for (const emp of Object.values(gruposPorEmpresa.value)) {
    for (const filas of Object.values(emp)) {
      for (const _ of filas) { map.push(i++); }
    }
  }
  return map;
});

let _flatIdx = 0;
function globalIndex(empresa, nombre, ri) {
  let idx = 1;
  for (const [emp, empleados] of Object.entries(gruposPorEmpresa.value)) {
    for (const [nom, filas] of Object.entries(empleados)) {
      for (let i = 0; i < filas.length; i++) {
        if (emp === empresa && nom === nombre && i === ri) return idx;
        idx++;
      }
    }
  }
  return idx;
}
function rowIndex(empresa, nombre, ri) {
  return globalIndex(empresa, nombre, ri);
}
</script>

<style scoped>
/* ── Overlay ────────────────────────────────────────────────────────────────── */
.rl-overlay {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  padding: 30px;
  background: rgba(0,0,0,0.55);
}

/* ── Shell ──────────────────────────────────────────────────────────────────── */
.rl-shell {
  width: 100%; max-width: 1500px; height: calc(100vh - 60px);
  border-radius: 10px; overflow: hidden;
  display: flex; flex-direction: column;
  background: #f0f0f0;
  box-shadow: 0 24px 80px -10px rgba(0,0,0,0.4);
  font-family: 'Calibri', 'Segoe UI', sans-serif;
}

/* ── Titlebar ───────────────────────────────────────────────────────────────── */
.rl-titlebar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 12px; height: 36px;
  background: #217346; flex-shrink: 0;
}
.rl-titlebar-left { display: flex; align-items: center; gap: 8px; }
.rl-xls-icon  { font-size: 18px; color: #fff; }
.rl-filename  { font-size: 12px; font-weight: 600; color: #fff; }
.rl-saved     { font-size: 11px; color: rgba(255,255,255,.6); }
.rl-win-close {
  width: 28px; height: 28px; border: none; background: transparent;
  color: rgba(255,255,255,.8); font-size: 13px; cursor: pointer;
  border-radius: 4px; transition: background .12s;
  display: flex; align-items: center; justify-content: center;
}
.rl-win-close:hover { background: rgba(255,255,255,.18); color: #fff; }

/* ── Ribbon ─────────────────────────────────────────────────────────────────── */
.rl-ribbon {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
  padding: 5px 12px; background: #fff;
  border-bottom: 1px solid #d0d0d0; flex-shrink: 0; gap: 8px;
}
.rl-ribbon-info { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.rl-ribbon-chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; padding: 3px 9px; border-radius: 3px;
  background: #f0f0f0; border: 1px solid #d0d0d0; color: #444;
}
.rl-chip-green { background: #e8f5e9; border-color: #a5d6a7; color: #1b5e20; font-weight: 600; }
.rl-ribbon-right { display: flex; align-items: center; }
.rl-cell-ref {
  height: 24px; min-width: 52px; padding: 0 8px;
  border: 1px solid #ababab; background: #fff;
  font-size: 12px; font-weight: 600; color: #333;
  display: flex; align-items: center; justify-content: center;
}
.rl-formula-bar {
  height: 24px; min-width: 260px; padding: 0 8px;
  border: 1px solid #ababab; border-left: none; background: #fff;
  font-size: 12px; color: #222;
  display: flex; align-items: center; gap: 8px;
}
.rl-fx { font-style: italic; font-weight: 700; color: #217346; font-size: 14px; }
.rl-formula-val { color: #555; }

/* ── Loading ────────────────────────────────────────────────────────────────── */
.rl-loading {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px; background: #fff;
}

/* ── Hoja ───────────────────────────────────────────────────────────────────── */
.rl-sheet-wrap { flex: 1; overflow: auto; background: #fff; }
.rl-sheet-wrap::-webkit-scrollbar { width: 12px; height: 12px; }
.rl-sheet-wrap::-webkit-scrollbar-track { background: #f0f0f0; }
.rl-sheet-wrap::-webkit-scrollbar-thumb { background: #bbb; border: 2px solid #f0f0f0; border-radius: 2px; }

.rl-sheet { border-collapse: collapse; }

/* Letras de columna */
.rl-col-letters { background: #f2f2f2; }
.rl-corner {
  width: 40px; min-width: 40px; background: #f2f2f2;
  border: 1px solid #d0d0d0;
  position: sticky; top: 0; left: 0; z-index: 15;
}
.rl-col-letter {
  background: #f2f2f2; border: 1px solid #d0d0d0;
  text-align: center; font-size: 10px; font-weight: 500; color: #666;
  padding: 2px 4px;
  position: sticky; top: 0; z-index: 12;
}

/* Cabeceras fila 1 */
.rl-head1 {}
.rl-rownum-head {
  width: 40px; min-width: 40px; background: #f2f2f2;
  border: 1px solid #d0d0d0; text-align: center;
  font-size: 10px; color: #666;
  position: sticky; top: 20px; left: 0; z-index: 14;
}
.rl-hg {
  border: 1px solid #145c30;
  color: #fff; font-size: 11px; font-weight: 700;
  padding: 5px 8px; text-align: center; white-space: nowrap;
  position: sticky; top: 20px; z-index: 11;
  letter-spacing: .03em;
}
.rl-hg-dark { background: #1F5C3A; }
.rl-hg-mid  { background: #1F5C3A; }
.rl-hg-hrs  { background: #1F5C3A; min-width: 54px; }

/* Cabeceras fila 2 */
.rl-head2 {}
.rl-hs {
  border: 1px solid #145c30;
  color: #fff; font-size: 10px; font-weight: 600;
  padding: 4px 8px; text-align: center; white-space: nowrap;
  position: sticky; top: 46px; z-index: 10;
}
.rl-hg-dark.rl-hs { background: #1F5C3A; }
.rl-hg-mid.rl-hs  { background: #1F5C3A; }
.rl-hg-hrs.rl-hs  { background: #1F5C3A; }

/* Fila empresa */
.rl-row-empresa {}
.rl-rownum-emp { background: #f2f2f2; border: 1px solid #d0d0d0; }
.rl-empresa-cell {
  background: #1F5C3A; color: #fff;
  font-size: 11px; font-weight: 700; padding: 5px 10px;
  border: 1px solid #145c30; letter-spacing: .02em;
}

/* Filas de datos */
.rl-data-row { transition: background .07s; }
.rl-data-row:hover .rl-cell,
.rl-data-row:hover .rl-rownum { background: #e8f0fe !important; }
.rl-row-alt .rl-cell   { background: #f9fafb; }
.rl-row-alt .rl-rownum { background: #f4f4f4; }
.rl-row-empty .rl-cell { background: #fff; }

.rl-rownum {
  width: 40px; min-width: 40px; background: #f2f2f2;
  border: 1px solid #d8d8d8; text-align: center;
  font-size: 10px; color: #888; padding: 0 4px;
  position: sticky; left: 0; z-index: 5;
}

.rl-cell {
  border: 1px solid #d8d8d8; padding: 4px 8px;
  font-size: 12px; color: #1a1a1a; background: #fff;
  white-space: nowrap; min-height: 22px;
}
.rl-cell-mono   { font-family: 'Consolas', monospace; font-size: 11px; color: #444; }
.rl-cell-name   { font-weight: 500; color: #111; }
.rl-cell-center { text-align: center; }
.rl-laborado    { color: #217346; font-weight: 500; }
.rl-cell-num    { text-align: right; font-family: 'Consolas', monospace; font-size: 12px; }
.rl-num-active  { color: #0070C0; font-weight: 700; background: #fff !important; }
.rl-num-zero    { color: #bfbfbf; text-align: center; }

/* Subtotal */
.rl-row-subtotal {}
.rl-rownum-sub {
  width: 40px; background: #FFF2CC;
  border: 1px solid #e0c84a;
  position: sticky; left: 0; z-index: 5;
}
.rl-subtotal-label {
  background: #FFF2CC; color: #7d6608;
  font-size: 11px; font-weight: 700;
  padding: 4px 10px; border: 1px solid #e0c84a;
  font-style: italic;
}
.rl-subtotal-num {
  background: #FFF2CC; color: #0070C0;
  font-size: 11px; font-weight: 700;
  text-align: right; padding: 4px 8px;
  border: 1px solid #e0c84a;
  font-family: 'Consolas', monospace;
}

/* ── Status bar ─────────────────────────────────────────────────────────────── */
.rl-statusbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 12px; height: 24px;
  background: #217346; flex-shrink: 0;
}
.rl-sheet-tab {
  font-size: 11px; font-weight: 600;
  background: #fff; color: #217346;
  padding: 1px 12px; border-radius: 2px 2px 0 0;
  display: inline-flex; align-items: center;
}
.rl-statusbar-right {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; color: rgba(255,255,255,.9);
}
.rl-statusbar-right strong { color: #fff; }
.rl-bar-sep { opacity: .4; }

/* ── Transitions ────────────────────────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.modal-enter-active { transition: all .22s cubic-bezier(.16,1,.3,1); }
.modal-leave-active { transition: all .15s ease; }
.modal-enter-from { opacity: 0; transform: translateY(10px) scale(.98); }
.modal-leave-to   { opacity: 0; }
</style>
