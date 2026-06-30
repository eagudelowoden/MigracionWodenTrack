<template>
  <div
    class="min-h-screen w-screen flex flex-col items-center p-4 transition-colors duration-300 font-sans"
    :class="isDark ? 'bg-[#0B0F19] text-[#F5F5F7]' : 'bg-[#F4F6FA] text-[#111827]'"
  >
    <!-- Fondos de resplandor -->
    <div class="fixed inset-0 z-0 pointer-events-none opacity-30">
      <div
        class="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] rounded-full blur-[120px]"
        :class="isDark ? 'bg-blue-500/10' : 'bg-blue-400/20'"
      ></div>
      <div
        class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] rounded-full blur-[120px]"
        :class="isDark ? 'bg-[#e88710]/10' : 'bg-[#e88710]/15'"
      ></div>
    </div>

    <div class="w-full max-w-2xl relative z-10 space-y-4 py-2">

      <!-- Header -->
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button
            @click="router.push('/marcacion')"
            class="w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-95"
            :class="isDark ? 'bg-[#161B26] border-[#222938] text-zinc-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 shadow-sm'"
          >
            <i class="fas fa-arrow-left text-xs"></i>
          </button>
          <div>
            <span class="block text-[10px] font-bold uppercase tracking-wider text-[#e88710]">
              Woden FSM
            </span>
            <h1 class="text-sm font-bold" :class="isDark ? 'text-white' : 'text-[#111827]'">
              Seriales Recuperados
            </h1>
          </div>
        </div>
        <button
          @click="toggleTheme"
          class="active:scale-95 p-2.5 rounded-full border transition-all"
          :class="isDark ? 'bg-[#161B26] border-[#222938] text-amber-400' : 'bg-white border-slate-200 text-slate-500 shadow-sm'"
        >
          <i :class="isDark ? 'fas fa-sun text-xs' : 'fas fa-moon text-xs'"></i>
        </button>
      </header>

      <!-- Filtros -->
      <div
        class="p-4 rounded-2xl border space-y-3"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200 shadow-sm'"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-bold opacity-60">Fecha de consulta</label>
            <input
              type="date"
              v-model="filtros.fecha"
              class="px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all"
              :class="isDark
                ? 'bg-[#0B0F19] border-[#222938] text-white [color-scheme:dark]'
                : 'bg-[#F4F6FA] border-slate-200 text-zinc-800'"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-bold opacity-60">Cédula (opcional)</label>
            <input
              type="text"
              v-model="filtros.documento"
              placeholder="Filtrar por cédula..."
              class="px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all placeholder:opacity-40"
              :class="isDark
                ? 'bg-[#0B0F19] border-[#222938] text-white'
                : 'bg-[#F4F6FA] border-slate-200 text-zinc-800'"
            />
          </div>
        </div>
        <button
          @click="consultar"
          :disabled="loading"
          class="w-full h-10 rounded-xl text-xs font-bold text-white bg-[#e88710] hover:bg-[#d07a0e] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <div v-if="loading" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <i v-else class="fas fa-magnifying-glass text-xs"></i>
          {{ loading ? 'Consultando...' : 'Consultar' }}
        </button>
      </div>

      <!-- Error -->
      <transition name="fade">
        <div
          v-if="error"
          class="p-3 rounded-xl text-xs font-semibold border flex items-center gap-2 bg-rose-500/10 border-transparent text-rose-500"
        >
          <i class="fas fa-circle-exclamation"></i>
          {{ error }}
        </div>
      </transition>

      <!-- Resultados: resumen -->
      <div v-if="registros !== null && !loading" class="space-y-3">
        <div class="flex items-center justify-between px-1">
          <span class="text-[11px] font-bold opacity-50 uppercase tracking-wider">
            {{ registros.length > 0 ? `${registros.length} registro${registros.length !== 1 ? 's' : ''} — ${filtros.fecha}` : 'Sin resultados' }}
          </span>
          <span v-if="registros.length > 0" class="text-[10px] font-bold text-[#e88710]">
            {{ filtros.fecha }}
          </span>
        </div>

        <!-- Estado vacío -->
        <div
          v-if="registros.length === 0"
          class="p-8 rounded-2xl border text-center space-y-2"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'"
        >
          <i class="fas fa-box-open text-2xl opacity-20"></i>
          <p class="text-xs opacity-40 font-medium">No se encontraron seriales recuperados para esta fecha.</p>
        </div>

        <!-- Cards de registros -->
        <div
          v-for="(item, idx) in registros"
          :key="idx"
          class="p-4 rounded-2xl border transition-all"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200 shadow-sm'"
        >
          <!-- Cabecera de card: serial + estatus -->
          <div class="flex items-start justify-between gap-2 mb-3">
            <div>
              <span class="block text-[10px] font-bold uppercase tracking-wider opacity-40">Serial</span>
              <span class="text-sm font-bold font-mono" :class="isDark ? 'text-white' : 'text-[#111827]'">
                {{ item.serial || item.serial_confirmado || '—' }}
              </span>
            </div>
            <span
              v-if="item.estatus"
              class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
              :class="estatusColor(item.estatus)"
            >
              {{ item.estatus }}
            </span>
          </div>

          <!-- Campos del registro -->
          <div class="grid grid-cols-2 gap-x-4 gap-y-2">
            <template v-for="(val, key) in camposFiltrados(item)" :key="key">
              <div class="flex flex-col">
                <span class="text-[10px] font-semibold opacity-40 truncate">{{ labelCampo(String(key)) }}</span>
                <span class="text-xs font-medium truncate" :class="isDark ? 'text-zinc-200' : 'text-zinc-700'">
                  {{ val || '—' }}
                </span>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Estado inicial (sin consulta aún) -->
      <div
        v-if="registros === null && !loading && !error"
        class="p-8 rounded-2xl border text-center space-y-2"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'"
      >
        <i class="fas fa-barcode text-3xl opacity-20"></i>
        <p class="text-xs opacity-40 font-medium">
          Selecciona una fecha y presiona <strong>Consultar</strong> para ver los seriales recuperados.
        </p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { apiFetch } from '@/utils/apiFetch.js';

const router = useRouter();
const API_URL = import.meta.env.VITE_API_URL;

// Tema (sincronizado con el de marcacion)
const stored = localStorage.getItem('theme');
const isDark = ref(stored === 'dark');

const toggleTheme = () => {
  isDark.value = !isDark.value;
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

// Fecha por defecto: hoy en zona Colombia (UTC-5)
const hoy = () => {
  const now = new Date();
  const col = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return col.toISOString().split('T')[0];
};

const filtros = reactive({ fecha: hoy(), documento: '' });
const loading = ref(false);
const error = ref('');
const registros = ref(null);

const consultar = async () => {
  error.value = '';
  loading.value = true;
  try {
    const body = { fecha: filtros.fecha };
    if (filtros.documento.trim()) body.documento = filtros.documento.trim();

    const res = await apiFetch(`${API_URL}/wfsm/seriales-recuperados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      error.value = data?.error || 'Error al consultar la API externa.';
      return;
    }
    registros.value = data.registros ?? [];
  } catch {
    error.value = 'Error de conexión con el servidor.';
  } finally {
    loading.value = false;
  }
};

// Campos que no se muestran en el grid (ya están en la cabecera)
const CAMPOS_OCULTOS = new Set(['serial', 'serial_confirmado', 'estatus']);

const camposFiltrados = (item) =>
  Object.fromEntries(
    Object.entries(item).filter(
      ([k, v]) => !CAMPOS_OCULTOS.has(k) && v !== null && v !== undefined && v !== '',
    ),
  );

const LABELS = {
  documento_identidad: 'Cédula',
  nombre_colaborador: 'Colaborador',
  nombre: 'Nombre',
  departamento: 'Departamento',
  tipo_cierre: 'Tipo de cierre',
  codigo_sap: 'Código SAP',
  nombre_material: 'Material',
  fecha_recuperacion: 'Fecha recuperación',
  'visita/recepcion': 'Recepción',
  grupo: 'Grupo',
};

const labelCampo = (key) =>
  LABELS[key] ?? key.replace(/_/g, ' ').replace(/\//g, ' / ');

const estatusColor = (estatus) => {
  const s = String(estatus).toLowerCase();
  if (s.includes('recuperado') || s.includes('entregado'))
    return 'bg-emerald-500/10 text-emerald-500';
  if (s.includes('pendiente')) return 'bg-amber-500/10 text-amber-500';
  if (s.includes('cancel')) return 'bg-rose-500/10 text-rose-500';
  return isDark.value
    ? 'bg-zinc-700/50 text-zinc-300'
    : 'bg-slate-100 text-slate-600';
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
