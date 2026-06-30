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
              @keyup.enter="consultar"
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

      <!-- Resultados -->
      <div v-if="registros !== null && !loading" class="space-y-3">
        <!-- Barra de resumen + búsqueda local -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <span class="text-[11px] font-bold opacity-50 uppercase tracking-wider">
            {{ totalFiltrado }} registro{{ totalFiltrado !== 1 ? 's' : '' }}
            <span v-if="busquedaLocal" class="text-[#e88710]">(filtrado)</span>
          </span>
          <div class="relative w-full sm:w-52">
            <i class="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] opacity-40"></i>
            <input
              v-model="busquedaLocal"
              type="text"
              placeholder="Buscar en resultados..."
              class="w-full pl-7 pr-2 py-1.5 text-[11px] rounded-lg border outline-none"
              :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-white border-slate-200 text-zinc-700'"
            />
          </div>
        </div>

        <!-- Estado vacío -->
        <div
          v-if="totalFiltrado === 0"
          class="p-8 rounded-2xl border text-center space-y-2"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'"
        >
          <i class="fas fa-box-open text-2xl opacity-20"></i>
          <p class="text-xs opacity-40 font-medium">No se encontraron seriales recuperados.</p>
        </div>

        <!-- Cards -->
        <div
          v-for="(item, idx) in visibles"
          :key="idx"
          class="p-4 rounded-2xl border transition-all"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200 shadow-sm'"
        >
          <!-- Cabecera: serial + estatus -->
          <div class="flex items-start justify-between gap-2 mb-3">
            <div class="min-w-0">
              <span class="block text-[10px] font-bold uppercase tracking-wider opacity-40">Serial</span>
              <span class="text-sm font-bold font-mono break-all" :class="isDark ? 'text-white' : 'text-[#111827]'">
                {{ item.serial || item.serial_confirmado || '—' }}
              </span>
            </div>
            <span
              v-if="item.estatus"
              class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0"
              :class="estatusColor(item.estatus)"
            >
              {{ item.estatus }}
            </span>
          </div>

          <!-- Campos curados -->
          <div class="grid grid-cols-2 gap-x-4 gap-y-2">
            <div v-for="campo in CAMPOS_VISIBLES" :key="campo.key" class="flex flex-col min-w-0">
              <span class="text-[10px] font-semibold opacity-40 truncate">{{ campo.label }}</span>
              <span class="text-xs font-medium truncate" :class="isDark ? 'text-zinc-200' : 'text-zinc-700'">
                {{ item[campo.key] || '—' }}
              </span>
            </div>
          </div>

          <!-- Comprobante / imágenes -->
          <div v-if="linkComprobante(item)" class="mt-3 pt-3 border-t" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
            <a
              :href="linkComprobante(item)"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all"
            >
              <i class="fas fa-file-arrow-down text-[10px]"></i> Ver comprobante
            </a>
          </div>
        </div>

        <!-- Mostrar más -->
        <button
          v-if="visibles.length < totalFiltrado"
          @click="limite += 50"
          class="w-full h-10 rounded-xl text-xs font-bold border transition-all"
          :class="isDark ? 'border-[#222938] text-zinc-300 hover:text-white' : 'border-slate-200 text-zinc-600 hover:bg-slate-50'"
        >
          Mostrar más ({{ totalFiltrado - visibles.length }} restantes)
        </button>
      </div>

      <!-- Estado inicial -->
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
import { ref, reactive, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { apiFetch } from '@/utils/apiFetch.js';

const router = useRouter();
const API_URL = import.meta.env.VITE_API_URL;

// Tema sincronizado con marcacion
const isDark = ref(localStorage.getItem('theme') === 'dark');
const toggleTheme = () => {
  isDark.value = !isDark.value;
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

// Fecha de hoy en Colombia (UTC-5)
const hoy = () => {
  const col = new Date(Date.now() - 5 * 60 * 60 * 1000);
  return col.toISOString().split('T')[0];
};

const filtros = reactive({ fecha: hoy(), documento: '' });
const loading = ref(false);
const error = ref('');
const registros = ref(null);
const busquedaLocal = ref('');
const limite = ref(50);

// Campos curados a mostrar en cada card (etiqueta legible → key del API)
const CAMPOS_VISIBLES = [
  { key: 'documento_identidad', label: 'Cédula' },
  { key: 'agente_campo', label: 'Agente' },
  { key: 'nombre_usuario', label: 'Cliente' },
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'departamento', label: 'Departamento' },
  { key: 'grupo', label: 'Grupo' },
  { key: 'tarea', label: 'Tarea' },
  { key: 'tipo_cierre', label: 'Tipo de cierre' },
  { key: 'codigo_sap', label: 'Código SAP' },
  { key: 'nombre_material', label: 'Material' },
  { key: 'fecha_recepcion', label: 'Fecha recepción' },
  { key: 'fecha_cierre', label: 'Fecha cierre' },
];

const consultar = async () => {
  error.value = '';
  loading.value = true;
  limite.value = 50;
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
      registros.value = null;
      return;
    }
    registros.value = data.registros ?? [];
  } catch {
    error.value = 'Error de conexión con el servidor.';
    registros.value = null;
  } finally {
    loading.value = false;
  }
};

// Filtrado local en memoria (búsqueda libre sobre los campos visibles + serial)
const registrosFiltrados = computed(() => {
  if (!registros.value) return [];
  const q = busquedaLocal.value.trim().toLowerCase();
  if (!q) return registros.value;
  return registros.value.filter((item) => {
    const campos = [item.serial, item.serial_confirmado, ...CAMPOS_VISIBLES.map((c) => item[c.key])];
    return campos.some((v) => String(v ?? '').toLowerCase().includes(q));
  });
});

const totalFiltrado = computed(() => registrosFiltrados.value.length);
const visibles = computed(() => registrosFiltrados.value.slice(0, limite.value));

// Reiniciar el límite al cambiar la búsqueda local
watch(busquedaLocal, () => { limite.value = 50; });

const linkComprobante = (item) =>
  item.comprobante_cliente || item.imagen_comprobante || '';

const estatusColor = (estatus) => {
  const s = String(estatus).toLowerCase();
  if (s.includes('terminado') || s.includes('recuperado') || s.includes('entregado'))
    return 'bg-emerald-500/10 text-emerald-500';
  if (s.includes('pendiente') || s.includes('proceso')) return 'bg-amber-500/10 text-amber-500';
  if (s.includes('cancel') || s.includes('fallid')) return 'bg-rose-500/10 text-rose-500';
  return isDark.value ? 'bg-zinc-700/50 text-zinc-300' : 'bg-slate-100 text-slate-600';
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
