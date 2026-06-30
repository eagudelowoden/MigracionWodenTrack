<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <h2 class="text-lg font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">
          Cálculo Automático de Horas Extra
        </h2>
        <p class="text-[12px] mt-0.5" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Un proceso aparte (worker) calcula las horas extra y las guarda en la tabla
          <code>calculados_extras</code>. Los usuarios solo consultan, sin recalcular.
        </p>
      </div>
      <div class="flex items-end gap-2 flex-wrap">
        <div>
          <label class="text-[10px] font-medium block mb-1" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Empresa</label>
          <select v-model="empresaSel"
            class="h-9 px-2 text-[12px] rounded-lg border outline-none min-w-[200px]"
            :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-800'">
            <option value="Todas">Todas las empresas</option>
            <option v-for="e in empresas" :key="e" :value="e">{{ e }}</option>
          </select>
        </div>
        <div>
          <label class="text-[10px] font-medium block mb-1" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Desde (opcional)</label>
          <input type="date" v-model="rangoDesde"
            class="h-9 px-2 text-[12px] rounded-lg border outline-none"
            :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-800'" />
        </div>
        <div>
          <label class="text-[10px] font-medium block mb-1" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Hasta (opcional)</label>
          <input type="date" v-model="rangoHasta"
            class="h-9 px-2 text-[12px] rounded-lg border outline-none"
            :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-800'" />
        </div>
        <button @click="ejecutarAhora" :disabled="ejecutando"
          class="flex items-center gap-2 h-9 px-4 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-50 bg-[#3B82F6] text-white hover:bg-[#2563EB]">
          <i class="fas" :class="ejecutando ? 'fa-spinner fa-spin' : 'fa-play'"></i>
          {{ ejecutando ? 'Encolando…' : 'Ejecutar ahora' }}
        </button>
      </div>
    </div>
    <p class="text-[11px] -mt-3" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
      Si dejas las fechas vacías, recalcula los últimos {{ config?.dias_ventana ?? 3 }} días. Para
      cargar un histórico (ej. 2 meses), elige el rango y dale "Ejecutar ahora".
    </p>

    <!-- Config -->
    <div v-if="config" class="rounded-xl border p-5 space-y-4"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

      <!-- Activo -->
      <label class="flex items-center justify-between cursor-pointer">
        <div>
          <div class="text-[13px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">
            Cron activo
          </div>
          <div class="text-[11px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            Si está activo, calcula automáticamente <strong>cada hora</strong>, dentro del rango horario configurado.
          </div>
        </div>
        <div class="relative">
          <input type="checkbox" v-model="config.activo" class="sr-only peer" />
          <div class="w-10 h-5 rounded-full transition-colors peer-checked:bg-[#3B82F6]"
            :class="isDark ? 'bg-[#222938]' : 'bg-slate-200'"></div>
          <div class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
        </div>
      </label>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <!-- Hora inicio -->
        <div>
          <label class="text-[11px] font-medium" :class="isDark ? 'text-slate-300' : 'text-slate-600'">Desde hora (0-23)</label>
          <input type="number" min="0" max="23" v-model.number="config.hora_inicio"
            class="mt-1 w-full h-9 px-3 text-[13px] rounded-lg border outline-none"
            :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-800'" />
        </div>
        <!-- Hora fin -->
        <div>
          <label class="text-[11px] font-medium" :class="isDark ? 'text-slate-300' : 'text-slate-600'">Hasta hora (0-23)</label>
          <input type="number" min="0" max="23" v-model.number="config.hora_fin"
            class="mt-1 w-full h-9 px-3 text-[13px] rounded-lg border outline-none"
            :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-800'" />
        </div>
        <!-- Minuto -->
        <div>
          <label class="text-[11px] font-medium" :class="isDark ? 'text-slate-300' : 'text-slate-600'">Minuto (0-59)</label>
          <input type="number" min="0" max="59" v-model.number="config.minuto"
            class="mt-1 w-full h-9 px-3 text-[13px] rounded-lg border outline-none"
            :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-800'" />
        </div>
        <!-- Ventana -->
        <div>
          <label class="text-[11px] font-medium" :class="isDark ? 'text-slate-300' : 'text-slate-600'">Días a recalcular</label>
          <input type="number" min="1" max="60" v-model.number="config.dias_ventana"
            class="mt-1 w-full h-9 px-3 text-[13px] rounded-lg border outline-none"
            :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-800'" />
        </div>
      </div>
      <p class="text-[11px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
        Corre <strong>cada hora</strong> de las {{ config.hora_inicio }}:00 a las {{ config.hora_fin }}:00.
        Para corridas horarias, mantén "Días a recalcular" bajo (2-3) para que sea ágil.
      </p>

      <div class="flex items-center justify-between flex-wrap gap-3 pt-2">
        <div class="text-[12px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          <i class="fas fa-clock mr-1.5 text-[#3B82F6]"></i>
          Próxima ejecución:
          <strong :class="isDark ? 'text-slate-200' : 'text-slate-700'">
            {{ config.activo ? formatFecha(config.proximaEjecucion) : 'Desactivado' }}
          </strong>
        </div>
        <button @click="guardar" :disabled="guardando"
          class="h-9 px-4 rounded-lg text-[12px] font-semibold border transition-all disabled:opacity-50"
          :class="isDark ? 'border-[#3B82F6]/40 text-[#60A5FA] hover:bg-[#3B82F6]/10' : 'border-[#3B82F6]/40 text-[#2563eb] hover:bg-[#3B82F6]/5'">
          <i class="fas" :class="guardando ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>
          {{ guardando ? 'Guardando…' : 'Guardar configuración' }}
        </button>
      </div>
    </div>

    <!-- Historial de corridas -->
    <div class="rounded-xl border overflow-hidden"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <div class="flex items-center justify-between px-5 py-3 border-b"
        :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
        <h3 class="text-[13px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">
          Últimas corridas
        </h3>
        <button @click="cargarJobs" class="text-[11px]" :class="isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'">
          <i class="fas fa-rotate" :class="{ 'fa-spin': cargandoJobs }"></i> Actualizar
        </button>
      </div>
      <div class="overflow-auto max-h-[340px]">
        <table class="w-full text-[12px]">
          <thead class="sticky top-0 z-10">
            <tr class="text-left" :class="isDark ? 'text-slate-400 bg-[#0B0F19]' : 'text-slate-500 bg-slate-50'">
              <th class="px-4 py-2 font-medium">#</th>
              <th class="px-4 py-2 font-medium">Tipo</th>
              <th class="px-4 py-2 font-medium">Rango</th>
              <th class="px-4 py-2 font-medium">Estado</th>
              <th class="px-4 py-2 font-medium">Resultado</th>
              <th class="px-4 py-2 font-medium">Creado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="j in jobs" :key="j.id" class="border-t"
              :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
              <td class="px-4 py-2" :class="isDark ? 'text-slate-300' : 'text-slate-700'">{{ j.id }}</td>
              <td class="px-4 py-2" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ j.tipo }}</td>
              <td class="px-4 py-2" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                {{ j.rango_desde || '—' }} → {{ j.rango_hasta || '—' }}
              </td>
              <td class="px-4 py-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold" :class="estadoClass(j.estado)">
                  {{ j.estado }}
                </span>
              </td>
              <td class="px-4 py-2" :class="isDark ? 'text-slate-300' : 'text-slate-700'">
                {{ j.resultado_resumen || j.error_mensaje || '—' }}
              </td>
              <td class="px-4 py-2" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ formatFecha(j.created_at) }}</td>
            </tr>
            <tr v-if="!jobs.length">
              <td colspan="6" class="px-4 py-8 text-center" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                Sin corridas todavía
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
import { ref, onMounted } from 'vue';
import axios from 'axios';

defineProps({ isDark: { type: Boolean, default: true } });

const API = import.meta.env.VITE_API_URL; // .../usuarios
const config = ref(null);
const jobs = ref([]);
const ejecutando = ref(false);
const guardando = ref(false);
const rangoDesde = ref('');
const rangoHasta = ref('');
const empresas = ref([]);
const empresaSel = ref('Todas');
const cargandoJobs = ref(false);
const mensaje = ref('');
const mensajeError = ref(false);

const flash = (msg, error = false) => {
  mensaje.value = msg;
  mensajeError.value = error;
  setTimeout(() => (mensaje.value = ''), 4000);
};

const formatFecha = (f) => {
  if (!f) return '—';
  try {
    return new Date(f).toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return String(f); }
};

const estadoClass = (e) => {
  const map = {
    completado: 'bg-emerald-500/15 text-emerald-500',
    procesando: 'bg-blue-500/15 text-blue-500',
    pendiente: 'bg-amber-500/15 text-amber-500',
    error: 'bg-red-500/15 text-red-500',
  };
  return map[e] || 'bg-slate-500/15 text-slate-400';
};

async function cargarConfig() {
  const { data } = await axios.get(`${API}/horas-extra/cron/config`);
  config.value = data;
}

async function cargarJobs() {
  cargandoJobs.value = true;
  try {
    const { data } = await axios.get(`${API}/horas-extra/jobs`);
    jobs.value = Array.isArray(data) ? data : [];
  } finally {
    cargandoJobs.value = false;
  }
}

async function cargarEmpresas() {
  try {
    const { data } = await axios.get(`${API}/companies`);
    empresas.value = (Array.isArray(data) ? data : [])
      .filter((c) => c.is_active !== false)
      .map((c) => c.name)
      .filter(Boolean)
      .sort();
  } catch {
    empresas.value = [];
  }
}

async function guardar() {
  guardando.value = true;
  try {
    const { hora, minuto, activo, dias_ventana, hora_inicio, hora_fin } = config.value;
    await axios.patch(`${API}/horas-extra/cron/config`, {
      hora, minuto, activo, dias_ventana, hora_inicio, hora_fin,
    });
    await cargarConfig();
    flash('Configuración guardada');
  } catch (e) {
    flash('Error al guardar', true);
  } finally {
    guardando.value = false;
  }
}

async function ejecutarAhora() {
  ejecutando.value = true;
  try {
    const body = {};
    if (rangoDesde.value && rangoHasta.value) {
      body.startDate = rangoDesde.value;
      body.endDate = rangoHasta.value;
    }
    if (empresaSel.value && empresaSel.value !== 'Todas') {
      body.company = empresaSel.value;
    }
    const { data } = await axios.post(`${API}/horas-extra/cron/ejecutar`, body);
    flash(`Cálculo encolado (job #${data.jobId}). El worker lo procesará.`);
    setTimeout(cargarJobs, 1500);
  } catch (e) {
    flash('Error al encolar', true);
  } finally {
    ejecutando.value = false;
  }
}

onMounted(async () => {
  await Promise.all([cargarConfig(), cargarJobs(), cargarEmpresas()]);
});
</script>
