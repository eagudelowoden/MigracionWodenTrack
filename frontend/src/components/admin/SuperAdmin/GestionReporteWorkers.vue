<template>
  <div class="space-y-5 overflow-y-auto pr-1" style="max-height: calc(100vh - 150px);">
    <!-- Header -->
    <div class="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <h2 class="text-lg font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">
          Workers de Reporte (Asistencias)
        </h2>
        <p class="text-[12px] mt-0.5" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Cada consulta del reporte de asistencias (descarga de Odoo + cruce de mallas/turnos) corre en un
          <strong>proceso aparte</strong>, para que nunca bloquee la API. Aquí ves los que están corriendo ahora mismo.
        </p>
      </div>
      <button @click="cargar" :disabled="cargando"
        class="flex items-center gap-2 h-9 px-4 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-50 bg-[#3B82F6] text-white hover:bg-[#2563EB]">
        <i class="fas" :class="cargando ? 'fa-spinner fa-spin' : 'fa-rotate'"></i>
        Actualizar
      </button>
    </div>

    <!-- Tabla de activos -->
    <div class="rounded-xl border overflow-hidden"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <div class="flex items-center justify-between px-5 py-3 border-b"
        :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
        <h3 class="text-[13px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">
          Workers activos
        </h3>
        <span class="text-[11px] px-2 py-0.5 rounded-full font-semibold"
          :class="activos.length ? 'bg-blue-500/15 text-blue-500' : 'bg-slate-500/15 text-slate-400'">
          {{ activos.length }} corriendo
        </span>
      </div>
      <div class="overflow-auto max-h-[440px]">
        <table class="w-full text-[12px]">
          <thead class="sticky top-0 z-10">
            <tr class="text-left" :class="isDark ? 'text-slate-400 bg-[#0B0F19]' : 'text-slate-500 bg-slate-50'">
              <th class="px-4 py-2 font-medium">PID</th>
              <th class="px-4 py-2 font-medium">Filtros</th>
              <th class="px-4 py-2 font-medium">Progreso</th>
              <th class="px-4 py-2 font-medium">RAM</th>
              <th class="px-4 py-2 font-medium">CPU</th>
              <th class="px-4 py-2 font-medium">Tiempo activo</th>
              <th class="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="w in activos" :key="w.pid" class="border-t"
              :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
              <td class="px-4 py-2 font-mono" :class="isDark ? 'text-slate-300' : 'text-slate-700'">{{ w.pid }}</td>
              <td class="px-4 py-2" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                <div class="flex flex-wrap gap-1">
                  <span class="px-1.5 py-0.5 rounded text-[10px]"
                    :class="isDark ? 'bg-[#0B0F19]' : 'bg-slate-100'">
                    {{ w.filtros?.hoy ? 'Hoy' : `${w.filtros?.startDate || '?'} → ${w.filtros?.endDate || '?'}` }}
                  </span>
                  <span v-if="w.filtros?.company" class="px-1.5 py-0.5 rounded text-[10px]"
                    :class="isDark ? 'bg-[#0B0F19]' : 'bg-slate-100'">
                    {{ w.filtros.company }}
                  </span>
                  <span v-if="w.filtros?.departamento" class="px-1.5 py-0.5 rounded text-[10px]"
                    :class="isDark ? 'bg-[#0B0F19]' : 'bg-slate-100'">
                    {{ w.filtros.departamento }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-2 min-w-[180px]">
                <div v-if="w.ultimoProgreso" class="flex items-center gap-2">
                  <div class="flex-1 h-1.5 rounded-full overflow-hidden" :class="isDark ? 'bg-[#0B0F19]' : 'bg-slate-100'">
                    <div class="h-full bg-blue-500 transition-all" :style="{ width: `${w.ultimoProgreso.percent}%` }"></div>
                  </div>
                  <span class="text-[10px] tabular-nums" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                    {{ w.ultimoProgreso.percent }}%
                  </span>
                </div>
                <span v-else class="text-[10px] opacity-50">Iniciando…</span>
                <div v-if="w.ultimoProgreso?.message" class="text-[10px] mt-0.5 opacity-60 truncate">
                  {{ w.ultimoProgreso.message }}
                </div>
              </td>
              <td class="px-4 py-2 tabular-nums" :class="ramClass(w.stats?.rssMb)">
                <span v-if="w.stats">{{ w.stats.rssMb }} MB</span>
                <span v-else class="opacity-40">—</span>
              </td>
              <td class="px-4 py-2 tabular-nums" :class="cpuClass(w.stats?.cpuPercent)">
                <span v-if="w.stats">{{ w.stats.cpuPercent }}%</span>
                <span v-else class="opacity-40">—</span>
              </td>
              <td class="px-4 py-2 tabular-nums" :class="isDark ? 'text-slate-300' : 'text-slate-700'">
                {{ w.segundosActivo }}s
              </td>
              <td class="px-4 py-2">
                <button @click="matar(w.pid)" :disabled="matando === w.pid"
                  class="px-2 py-0.5 rounded text-[10px] font-semibold transition-all disabled:opacity-40 border border-red-400/40 text-red-400 hover:bg-red-500/10"
                  title="Matar este proceso">
                  <i class="fas" :class="matando === w.pid ? 'fa-spinner fa-spin' : 'fa-skull'"></i>
                  Matar
                </button>
              </td>
            </tr>
            <tr v-if="!activos.length">
              <td colspan="7" class="px-4 py-8 text-center" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                No hay workers de reporte corriendo ahora mismo.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p v-if="mensaje" class="text-[12px] font-medium" :class="mensajeError ? 'text-red-500' : 'text-emerald-500'">
      {{ mensaje }}
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

defineProps({ isDark: { type: Boolean, default: true } });

const API = import.meta.env.VITE_API_URL; // .../usuarios
const activos = ref([]);
const cargando = ref(false);
const matando = ref(null);
const mensaje = ref('');
const mensajeError = ref(false);
let autoRefreshTimer = null;

const flash = (msg, error = false) => {
  mensaje.value = msg;
  mensajeError.value = error;
  setTimeout(() => (mensaje.value = ''), 4000);
};

// Referencia: heap del worker hereda el de la API (3 GB) → sobre ~1.5GB de RSS
// ya es una consulta pesada; sobre ~2.2GB está cerca del guard del 55%.
const ramClass = (mb) => {
  if (mb == null) return 'text-slate-400';
  if (mb >= 2200) return 'text-red-500 font-semibold';
  if (mb >= 1500) return 'text-amber-500 font-semibold';
  return 'text-emerald-500';
};

const cpuClass = (pct) => {
  if (pct == null) return 'text-slate-400';
  if (pct >= 90) return 'text-red-500 font-semibold';
  if (pct >= 50) return 'text-amber-500 font-semibold';
  return 'text-emerald-500';
};

async function cargar() {
  cargando.value = true;
  try {
    const { data } = await axios.get(`${API}/reporte-workers`);
    activos.value = Array.isArray(data) ? data : [];
  } catch {
    activos.value = [];
  } finally {
    cargando.value = false;
  }
}

async function matar(pid) {
  matando.value = pid;
  try {
    await axios.patch(`${API}/reporte-workers/${pid}/matar`);
    flash(`Worker (pid ${pid}) detenido.`);
    await cargar();
  } catch (e) {
    flash(e?.response?.data?.message || 'No se pudo detener el worker', true);
  } finally {
    matando.value = null;
  }
}

onMounted(() => {
  cargar();
  // Auto-refresh cada 3s: son procesos efímeros, hay que verlos casi en vivo.
  autoRefreshTimer = setInterval(cargar, 3000);
});

onUnmounted(() => {
  clearInterval(autoRefreshTimer);
});
</script>
