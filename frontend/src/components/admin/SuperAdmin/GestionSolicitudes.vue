<template>
  <div class="h-full flex flex-col gap-3 animate-fade-in">

    <!-- HEADER -->
    <div class="flex items-center justify-between px-3 py-2.5 rounded-xl border shrink-0"
      :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
          <i class="fas fa-inbox text-indigo-500 text-xs"></i>
        </div>
        <div>
          <h2 class="text-[11px] font-semibold uppercase tracking-wider"
            :class="isDark ? 'text-white' : 'text-slate-700'">Solicitudes de apertura</h2>
          <p class="text-[9px] font-medium opacity-40 uppercase tracking-wide"
            :class="isDark ? 'text-white' : 'text-slate-500'">
            Cargue de mallas &nbsp;·&nbsp;
            <span :class="pendientes > 0 ? 'text-amber-400' : ''">{{ pendientes }} pendiente{{ pendientes !== 1 ? 's' : '' }}</span>
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <!-- Filtro estado -->
        <div class="flex rounded-lg border overflow-hidden"
          :class="isDark ? 'border-white/10' : 'border-slate-200'">
          <button v-for="f in FILTROS" :key="f.value" @click="filtro = f.value"
            class="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-all"
            :class="filtro === f.value
              ? 'bg-indigo-500 text-white'
              : isDark ? 'bg-white/3 text-white/40 hover:bg-white/8' : 'bg-white text-slate-400 hover:bg-slate-50'">
            {{ f.label }}
          </button>
        </div>
        <button @click="cargar" :disabled="cargando"
          class="h-7 w-7 rounded-lg border flex items-center justify-center transition-all"
          :class="isDark ? 'border-white/10 text-white/40 hover:bg-white/5' : 'border-slate-200 text-slate-400 hover:bg-slate-50'">
          <i class="fas fa-rotate text-[10px]" :class="cargando ? 'fa-spin' : ''"></i>
        </button>
      </div>
    </div>

    <!-- LISTA -->
    <div class="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5">

      <div v-if="cargando" class="flex items-center justify-center h-40">
        <i class="fas fa-circle-notch fa-spin text-indigo-500 text-xl"></i>
      </div>

      <div v-else-if="!listaFiltrada.length"
        class="flex flex-col items-center justify-center h-40 gap-2 rounded-xl border"
        :class="isDark ? 'border-white/5' : 'border-slate-200'">
        <i class="fas fa-inbox text-4xl opacity-10" :class="isDark ? 'text-white' : 'text-slate-400'"></i>
        <p class="text-[11px] opacity-30" :class="isDark ? 'text-white' : 'text-slate-500'">
          {{ filtro === 'pendiente' ? 'Sin solicitudes pendientes' : 'Sin solicitudes en este filtro' }}
        </p>
      </div>

      <div v-for="s in listaFiltrada" :key="s.id"
        class="rounded-xl border p-3.5 transition-all"
        :class="[
          isDark ? 'bg-white/5 border-white/8' : 'bg-white border-slate-200',
          s.estado === 'pendiente' ? (isDark ? 'border-amber-500/20' : 'border-amber-300') : ''
        ]">

        <div class="flex items-start gap-3">
          <!-- Avatar -->
          <div class="w-9 h-9 rounded-xl flex items-center justify-center font-black text-[12px] shrink-0"
            :class="isDark ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-100 text-indigo-600'">
            {{ s.solicitante_nombre?.charAt(0)?.toUpperCase() || '?' }}
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[11px] font-bold" :class="isDark ? 'text-white' : 'text-slate-800'">
                {{ s.solicitante_nombre }}
              </span>
              <!-- Badges de área/segmento -->
              <span v-if="s.area_nombre"
                class="px-1.5 py-0.5 rounded text-[8px] font-bold"
                :class="isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-100 text-blue-600'">
                <i class="fas fa-layer-group mr-0.5 text-[7px]"></i>{{ s.area_nombre }}
              </span>
              <span v-if="s.segmento_nombre"
                class="px-1.5 py-0.5 rounded text-[8px] font-bold"
                :class="isDark ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-100 text-violet-600'">
                <i class="fas fa-sitemap mr-0.5 text-[7px]"></i>{{ s.segmento_nombre }}
              </span>
              <!-- Estado badge -->
              <span class="px-1.5 py-0.5 rounded text-[8px] font-bold ml-auto shrink-0"
                :class="{
                  'bg-amber-500/15 text-amber-400': s.estado === 'pendiente',
                  'bg-emerald-500/15 text-emerald-400': s.estado === 'aprobado',
                  'bg-rose-500/15 text-rose-400': s.estado === 'rechazado',
                }">
                <i :class="estadoIcon(s.estado)" class="mr-0.5 text-[7px]"></i>
                {{ s.estado.charAt(0).toUpperCase() + s.estado.slice(1) }}
              </span>
            </div>

            <!-- Mensaje -->
            <p v-if="s.mensaje" class="text-[10px] mt-1 opacity-60 leading-relaxed"
              :class="isDark ? 'text-white' : 'text-slate-600'">
              "{{ s.mensaje }}"
            </p>

            <!-- Meta info -->
            <div class="flex items-center gap-3 mt-1.5 flex-wrap">
              <span class="text-[8px] opacity-30 flex items-center gap-1"
                :class="isDark ? 'text-white' : 'text-slate-500'">
                <i class="fas fa-clock text-[7px]"></i>
                {{ formatFecha(s.created_at) }}
              </span>
              <span v-if="s.atendido_por" class="text-[8px] opacity-40 flex items-center gap-1"
                :class="isDark ? 'text-white' : 'text-slate-500'">
                <i class="fas fa-user-check text-[7px]"></i>
                Atendido por {{ s.atendido_por }}
              </span>
            </div>
          </div>
        </div>

        <!-- Acciones (solo si pendiente) -->
        <div v-if="s.estado === 'pendiente'" class="flex gap-2 mt-3 ml-12">
          <button @click="atender(s.id, 'aprobado')" :disabled="procesando === s.id"
            class="flex-1 h-7 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-40">
            <i class="fas fa-check text-[9px]"></i> Aprobar
          </button>
          <button @click="atender(s.id, 'rechazado')" :disabled="procesando === s.id"
            class="flex-1 h-7 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 bg-rose-500/80 text-white hover:bg-rose-500 disabled:opacity-40">
            <i class="fas fa-xmark text-[9px]"></i> Rechazar
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({ isDark: Boolean });
const emit  = defineEmits(['success', 'error']);
const API_URL = import.meta.env.VITE_API_URL;

const FILTROS = [
  { value: 'pendiente',  label: 'Pendientes' },
  { value: 'todas',      label: 'Todas' },
  { value: 'aprobado',   label: 'Aprobadas' },
  { value: 'rechazado',  label: 'Rechazadas' },
];

const lista    = ref([]);
const filtro   = ref('pendiente');
const cargando = ref(false);
const procesando = ref(null);

const pendientes = computed(() => lista.value.filter(s => s.estado === 'pendiente').length);

const listaFiltrada = computed(() =>
  filtro.value === 'todas' ? lista.value : lista.value.filter(s => s.estado === filtro.value)
);

const cargar = async () => {
  cargando.value = true;
  try {
    const r = await fetch(`${API_URL}/superadmin/solicitudes`);
    lista.value = await r.json();
  } catch { emit('error', 'Error cargando solicitudes'); }
  finally { cargando.value = false; }
};

const atender = async (id, estado) => {
  procesando.value = id;
  const session = JSON.parse(localStorage.getItem('user_session') || '{}');
  try {
    const r = await fetch(`${API_URL}/superadmin/solicitudes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado, atendido_por: session.name || 'SuperAdmin' }),
    });
    const updated = await r.json();
    const idx = lista.value.findIndex(s => s.id === id);
    if (idx !== -1) lista.value[idx] = updated;
    emit('success', estado === 'aprobado' ? 'Solicitud aprobada' : 'Solicitud rechazada');
  } catch { emit('error', 'Error al atender solicitud'); }
  finally { procesando.value = null; }
};

const estadoIcon = (e) => e === 'pendiente' ? 'fas fa-hourglass-half' : e === 'aprobado' ? 'fas fa-check-circle' : 'fas fa-times-circle';

const formatFecha = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

onMounted(cargar);
</script>
