<template>
  <Teleport to="body">
  <Transition name="fade">
    <div v-if="modelValue" class="rl-overlay" @click.self="emit('update:modelValue', false)">
      <Transition name="modal" appear>
        <div v-if="modelValue" class="rl-modal" :class="isDark ? 'rl-dark' : 'rl-light'">

          <!-- Header -->
          <header class="rl-header">
            <div class="rl-header-icon">
              <i class="fas fa-table"></i>
            </div>
            <div class="rl-header-info">
              <p class="rl-eyebrow">Registros cargados</p>
              <h3 class="rl-title">{{ lote?.origen === 'gerente' ? 'Cargue Gerente' : 'Cargue Sistema' }}</h3>
              <p class="rl-subtitle" v-if="lote">
                {{ lote.fecha_desde }} → {{ lote.fecha_hasta }}
                · <span class="font-medium">{{ lote.cargado_por }}</span>
                · <span class="font-semibold">{{ lote.registros }} registros</span>
              </p>
            </div>
            <button @click="emit('update:modelValue', false)" class="rl-close">
              <i class="fas fa-times"></i>
            </button>
          </header>

          <!-- Loading -->
          <div v-if="isLoading" class="rl-loading">
            <i class="fas fa-spinner fa-spin text-[#3B82F6] text-xl"></i>
            <span class="text-[12px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cargando registros…</span>
          </div>

          <!-- Sin datos -->
          <div v-else-if="!registros.length" class="rl-empty">
            <i class="fas fa-inbox text-slate-400 text-2xl"></i>
            <p :class="isDark ? 'text-slate-400' : 'text-slate-500'">No hay registros para este lote.</p>
          </div>

          <!-- Tabla -->
          <div v-else class="rl-body custom-scroll">
            <table class="rl-table">
              <thead class="sticky top-0 z-10">
                <tr class="bg-[#1e2538]">
                  <th class="rl-th border-r" rowspan="2">Cédula</th>
                  <th class="rl-th border-r" rowspan="2">Nombre</th>
                  <th class="rl-th border-r text-center" rowspan="2">Fecha</th>
                  <th class="rl-th border-r text-center" rowspan="2">Departamento</th>
                  <th v-for="col in COLS" :key="col" class="rl-th text-center border-r" colspan="1">
                    {{ col.toUpperCase() }}
                  </th>
                  <th class="rl-th text-center" rowspan="2">Observación</th>
                </tr>
                <tr class="bg-[#1e2538]">
                  <th v-for="col in COLS" :key="col + '_hrs'" class="rl-th-sub text-center border-r text-[#60A5FA]">
                    hrs
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(grupo, nombre) in gruposPorEmpleado" :key="nombre">
                  <!-- Cabecera empleado -->
                  <tr>
                    <td :colspan="4 + COLS.length + 1" class="px-3 py-1.5 text-[10px] font-semibold border-b"
                      :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'">
                      <i class="fas fa-user mr-1.5 opacity-50"></i>{{ nombre }}
                    </td>
                  </tr>
                  <!-- Filas -->
                  <tr v-for="(fila, i) in grupo" :key="nombre + fila.fecha + i"
                    class="transition-colors"
                    :class="isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'">
                    <td class="rl-td border-r font-mono text-[10px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                      {{ fila.cedula || '—' }}
                    </td>
                    <td class="rl-td border-r text-[11px]" :class="isDark ? 'text-white' : 'text-slate-900'">
                      {{ fila.nombre }}
                    </td>
                    <td class="rl-td border-r text-center font-mono text-[11px]" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                      {{ fmt(fila.fecha) }}
                    </td>
                    <td class="rl-td border-r text-[10px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                      {{ fila.departamento || '—' }}
                    </td>
                    <td v-for="col in COLS" :key="col" class="rl-td text-center border-r text-[11px]"
                      :class="[isDark ? 'border-[#222938]' : 'border-slate-100',
                        Number(fila[col]) > 0
                          ? (isDark ? 'text-[#60A5FA] font-semibold' : 'text-[#3B82F6] font-semibold')
                          : (isDark ? 'text-[#3a3a42]' : 'text-slate-300')]">
                      {{ fmtN(fila[col]) }}
                    </td>
                    <td class="rl-td text-[10px] italic" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                      {{ fila.observacion || '—' }}
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <footer v-if="!isLoading && registros.length" class="rl-footer">
            <span class="text-[11px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
              <span class="font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ registros.length }}</span>
              registro(s) cargado(s)
            </span>
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

const gruposPorEmpleado = computed(() => {
  const m = {};
  for (const r of props.registros) {
    const key = r.nombre || r.cedula || '—';
    if (!m[key]) m[key] = [];
    m[key].push(r);
  }
  return m;
});
</script>

<style scoped>
.rl-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.6);
}

.rl-modal {
  width: 98vw;
  max-width: 1300px;
  max-height: 92vh;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 60px -12px rgba(0,0,0,0.4);
  font-family: 'Inter', system-ui, sans-serif;
}

.rl-light { background: #ffffff; color: #09090b; border: 1px solid #e4e4e7; }
.rl-dark  { background: #161B26; color: #fafafa;  border: 1px solid #222938; }

.rl-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 24px 14px;
  flex-shrink: 0;
  border-bottom: 1px solid;
}
.rl-dark  .rl-header { border-color: #222938; }
.rl-light .rl-header { border-color: #e4e4e7; }

.rl-header-icon {
  width: 36px; height: 36px; border-radius: 8px;
  background: rgba(59,130,246,.12); color: #60A5FA;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
}
.rl-header-info { flex: 1; }
.rl-eyebrow { font-size: 10px; font-weight: 500; color: #888; margin-bottom: 2px; }
.rl-title { font-size: 17px; font-weight: 600; letter-spacing: -0.015em; }
.rl-subtitle { font-size: 11px; color: #888; margin-top: 2px; }
.rl-close {
  width: 28px; height: 28px; border-radius: 6px;
  border: none; background: transparent; cursor: pointer;
  font-size: 13px; color: #888; transition: color .12s;
}
.rl-close:hover { color: inherit; }

.rl-loading, .rl-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px; padding: 48px;
}

.rl-body {
  flex: 1; overflow: auto;
}

.rl-table {
  width: 100%; border-collapse: separate; border-spacing: 0; font-size: 11px;
}

.rl-th {
  padding: 8px 10px;
  text-align: left; font-size: 10px; font-weight: 500;
  text-transform: uppercase; letter-spacing: .04em;
  color: #f5f5f7; border-bottom: 1px solid #2a3245;
  white-space: nowrap;
}
.rl-th-sub {
  padding: 4px 6px;
  font-size: 9px; font-weight: 400;
  color: #8b9ab4; border-bottom: 1px solid #2a3245;
}
.rl-td {
  padding: 7px 10px;
  border-bottom: 1px solid;
  white-space: nowrap;
}
.rl-dark  .rl-td { border-color: #222938; }
.rl-light .rl-td { border-color: #f0f0f0; }

.rl-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 24px; flex-shrink: 0; border-top: 1px solid;
}
.rl-dark  .rl-footer { border-color: #222938; background: #0B0F19; }
.rl-light .rl-footer { border-color: #e4e4e7; background: #fafafa; }

.custom-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
.custom-scroll::-webkit-scrollbar-thumb { background: #2a3245; border-radius: 999px; }

.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.modal-enter-active { transition: all .22s cubic-bezier(.16,1,.3,1); }
.modal-leave-active { transition: all .15s ease; }
.modal-enter-from { opacity: 0; transform: translateY(10px) scale(.98); }
.modal-leave-to { opacity: 0; }
</style>
