<script setup>
import { apiFetch } from '@/utils/apiFetch.js';
import { ref, onMounted } from 'vue';

const props = defineProps({ isDark: { type: Boolean, default: true } });

const API_URL = import.meta.env.VITE_API_URL;

const loading = ref(true);
const errorMsg = ref('');
// Valores leídos de sistema_config (clave -> valor). Fallback = valor vigente en el motor.
const cfg = ref({});

// Metadatos de presentación. Los valores reales vienen de la API; el `def` es el
// valor que el motor de cálculo usa hoy en código (sirve de respaldo).
const GRUPOS = [
  {
    titulo: 'Franjas horarias',
    icon: 'fas fa-clock',
    items: [
      { key: 'hx_inicio_nocturno', label: 'Inicio jornada nocturna', def: '19', sufijo: ':00 h',
        nota: 'La noche arranca aquí (Ley 2466/2025). Define RN, HENO, RNDF, HEFN.' },
      { key: 'hx_inicio_diurno', label: 'Inicio jornada diurna', def: '6', sufijo: ':00 h',
        nota: 'La franja diurna va desde esta hora hasta el inicio nocturno.' },
      { key: 'hx_umbral_entrada_nocturna', label: 'Umbral entrada nocturna (heurística)', def: '21', sufijo: ':00 h',
        nota: 'Hora mínima para asumir que una entrada sin salida cruza la medianoche.' },
    ],
  },
  {
    titulo: 'Tolerancias y redondeo',
    icon: 'fas fa-sliders',
    items: [
      { key: 'hx_tolerancia_min', label: 'Tolerancia de llegada', def: '6', sufijo: ' min',
        nota: 'Minutos de gracia antes de exigir reposición por llegada tarde.' },
      { key: 'hx_redondeo_min', label: 'Umbral de redondeo', def: '50', sufijo: ' min',
        nota: 'Si la fracción tiene ≥ estos minutos, sube a la hora completa.' },
      { key: 'hx_max_turno_horas', label: 'Duración máxima de turno', def: '14', sufijo: ' h',
        nota: 'Por encima de esto, un emparejamiento entrada/salida se considera inválido.' },
    ],
  },
  {
    titulo: 'Reglas de clasificación',
    icon: 'fas fa-scale-balanced',
    items: [
      { key: 'hx_dominical_festivo_modo', label: 'Domingo / festivo sin malla', def: 'todo_extra',
        map: { todo_extra: 'Todo como hora extra', recargo_mas_extra: 'Recargo + extra el excedente' },
        nota: 'Cómo se paga el trabajo en domingo/festivo cuando no hay turno en la malla.' },
    ],
  },
  {
    titulo: 'Porcentajes de recargo (referencia)',
    icon: 'fas fa-percent',
    items: [
      { key: 'hx_recargo_nocturno_pct', label: 'Recargo nocturno (RN)', def: '35', sufijo: ' %' },
      { key: 'hx_recargo_dominical_pct', label: 'Recargo dominical/festivo', def: '80', sufijo: ' %' },
      { key: 'hx_extra_diurna_pct', label: 'Hora extra diurna (HEDO)', def: '25', sufijo: ' %' },
      { key: 'hx_extra_nocturna_pct', label: 'Hora extra nocturna (HENO)', def: '75', sufijo: ' %' },
    ],
  },
];

const valorDe = (item) => {
  const raw = cfg.value[item.key] ?? item.def;
  if (item.map) return item.map[raw] ?? raw;
  return `${raw}${item.sufijo ?? ''}`;
};

const cargar = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await apiFetch(`${API_URL}/sistema-config`);
    cfg.value = await res.json();
  } catch (e) {
    console.error('Error cargando parámetros HX:', e);
    errorMsg.value = 'No se pudieron cargar los parámetros. Mostrando valores por defecto del motor.';
  } finally {
    loading.value = false;
  }
};

onMounted(cargar);
</script>

<template>
  <div class="p-5">
    <!-- Encabezado -->
    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center bg-lime-500/10">
          <i class="fas fa-business-time text-lime-500 text-sm"></i>
        </div>
        <div>
          <h2 class="text-[15px] font-bold" :class="isDark ? 'text-white' : 'text-slate-800'">
            Parametrización Horas Extra
          </h2>
          <p class="text-[11px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            Valores con los que el motor de cálculo clasifica recargos y horas extra
          </p>
        </div>
      </div>
      <button @click="cargar"
        class="px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide border flex items-center gap-1.5 transition-all hover:brightness-110"
        :class="isDark ? 'bg-[#161B26] text-slate-300 border-[#3d4558]' : 'bg-slate-100 text-slate-600 border-slate-200'">
        <i class="fas fa-rotate text-lime-500" :class="{ 'fa-spin': loading }"></i> Recargar
      </button>
    </div>

    <!-- Aviso solo lectura -->
    <div class="mb-5 px-4 py-2.5 rounded-lg border flex items-start gap-2.5"
      :class="isDark ? 'bg-amber-500/5 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'">
      <i class="fas fa-circle-info mt-0.5 text-[12px]"></i>
      <p class="text-[11px] leading-relaxed">
        <b>Solo lectura.</b> Esta vista muestra cómo está parametrizado el cálculo hoy. Editar estos
        valores desde aquí estará disponible en una fase posterior; por ahora ningún cambio afecta el motor.
      </p>
    </div>

    <div v-if="errorMsg"
      class="mb-4 px-4 py-2 rounded-lg text-[11px] border"
      :class="isDark ? 'bg-red-500/5 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-600'">
      {{ errorMsg }}
    </div>

    <!-- Grupos de parámetros -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="grupo in GRUPOS" :key="grupo.titulo" class="rounded-xl border overflow-hidden"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <div class="px-4 py-2.5 border-b flex items-center gap-2"
          :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
          <i :class="[grupo.icon, 'text-lime-500 text-[12px]']"></i>
          <span class="text-[11px] font-bold uppercase tracking-wide"
            :class="isDark ? 'text-slate-200' : 'text-slate-700'">{{ grupo.titulo }}</span>
        </div>
        <div class="divide-y" :class="isDark ? 'divide-[#222938]' : 'divide-slate-100'">
          <div v-for="item in grupo.items" :key="item.key" class="px-4 py-3">
            <div class="flex items-center justify-between gap-3">
              <span class="text-[12px] font-medium" :class="isDark ? 'text-slate-300' : 'text-slate-700'">
                {{ item.label }}
              </span>
              <span class="text-[12px] font-bold font-mono px-2 py-0.5 rounded shrink-0"
                :class="isDark ? 'bg-lime-500/10 text-lime-400' : 'bg-lime-50 text-lime-700'">
                {{ valorDe(item) }}
              </span>
            </div>
            <p v-if="item.nota" class="text-[10px] mt-1 leading-relaxed"
              :class="isDark ? 'text-slate-500' : 'text-slate-400'">{{ item.nota }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
