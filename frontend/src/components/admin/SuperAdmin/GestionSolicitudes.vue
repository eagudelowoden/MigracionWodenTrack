<template>
  <div class="w-full h-full flex flex-col font-sans select-none relative transition-colors duration-200"
    :class="isDark ? 'bg-[#1A1F35] text-[#EDEDED]' : 'bg-[#FAFAFA] text-[#111111]'" @click="closePopover">

    <header class="flex items-center justify-between pb-5 border-b shrink-0 text-left"
      :class="isDark ? 'border-slate-800/80' : 'border-[#EAEAEA]'">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 flex items-center justify-center rounded-lg border text-sm transition-colors"
          :class="isDark ? 'bg-[#222942] border-slate-700/60 text-white' : 'bg-white border-[#EAEAEA] text-[#111111] shadow-sm'">
          <i class="fas fa-inbox"></i>
        </div>
        <div class="space-y-0.5">
          <h2 class="text-base font-semibold tracking-tight">
            Solicitudes de apertura
          </h2>
          <p class="text-xs flex items-center gap-2" :class="isDark ? 'text-slate-400' : 'text-[#666666]'">
            <span>Cargue de mallas</span>
            <span class="opacity-40">·</span>
            <span :class="pendientes > 0 ? 'text-[#e88710] font-medium' : ''">
              {{ pendientes }} pendiente{{ pendientes !== 1 ? 's' : '' }}
            </span>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button @click="showStats = !showStats"
          class="h-8 px-3 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-all"
          :class="isDark ? 'bg-[#222942] border-slate-700/60 hover:bg-[#2b3352] text-zinc-300' : 'bg-white border-[#EAEAEA] text-zinc-600 shadow-sm'">
          <i class="fas fa-chart-bar opacity-60 text-[10px]"></i>
          <span>{{ showStats ? 'Ocultar' : 'Indicadores' }}</span>
          <i class="fas fa-chevron-down text-[9px] opacity-40 transition-transform"
            :class="showStats ? 'rotate-180' : ''"></i>
        </button>

        <button @click="cargar" :disabled="cargando"
          class="w-8 h-8 rounded-md border flex items-center justify-center transition-all disabled:opacity-40"
          :class="isDark ? 'bg-[#222942] border-slate-700/60 hover:bg-[#2b3352]' : 'bg-white border-[#EAEAEA] hover:bg-slate-50 shadow-sm'">
          <i class="fas fa-rotate text-xs" :class="cargando ? 'fa-spin' : ''"></i>
        </button>
      </div>
    </header>

    <Transition name="fade">
      <div v-if="showStats" class="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 shrink-0 text-left">
        <div v-for="stat in [
          { label: 'Total', count: lista.length, icon: 'fa-inbox', color: 'text-slate-400' },
          { label: 'Pendientes', count: pendientes, icon: 'fa-hourglass-half', color: 'text-[#e88710]' },
          { label: 'Aprobadas', count: aprobadas, icon: 'fa-circle-check', color: 'text-emerald-400' },
          { label: 'Rechazadas', count: rechazadas, icon: 'fa-circle-xmark', color: 'text-rose-400' }
        ]" :key="stat.label" class="p-4 rounded-xl border flex flex-col space-y-1.5"
          :class="isDark ? 'bg-[#161B26]/60 border-slate-800/80' : 'bg-white border-[#EAEAEA] shadow-sm'">
          <div class="flex items-center justify-between text-xs opacity-60">
            <span>{{ stat.label }}</span>
            <i :class="['fas text-[10px]', stat.icon, stat.color]"></i>
          </div>
          <p class="text-xl font-bold tracking-tight">{{ stat.count }}</p>
        </div>
      </div>
    </Transition>

    <div class="flex items-center pt-5 pb-3 border-b shrink-0 text-left"
      :class="isDark ? 'border-slate-800/80' : 'border-[#EAEAEA]'">
      <div class="flex gap-1">
        <button v-for="f in FILTROS" :key="f.value" @click="filtro = f.value"
          class="h-7 px-3 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 relative"
          :class="filtro === f.value
            ? (isDark ? 'bg-[#222942] border border-slate-700/40 text-white' : 'bg-[#111111] text-white')
            : (isDark ? 'text-slate-400 hover:text-white hover:bg-[#222942]/50' : 'text-[#666666] hover:text-[#111111] hover:bg-zinc-100')">
          <span>{{ f.label }}</span>
          <span v-if="f.value === 'pendiente' && pendientes > 0"
            class="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#e88710]/10 text-[#e88710] border border-[#e88710]/20">
            {{ pendientes }}
          </span>
        </button>
      </div>
    </div>

    <div class="flex-1 flex flex-col items-center justify-center min-h-[250px]">

      <div v-if="cargando" class="flex items-center gap-2 text-xs font-medium opacity-60">
        <i class="fas fa-circle-notch fa-spin text-[#e88710]"></i>
        <span>Cargando solicitudes…</span>
      </div>

      <div v-else-if="!listaFiltrada.length" class="text-center space-y-2 max-w-xs animate-fade-in">
        <div class="w-10 h-10 mx-auto flex items-center justify-center rounded-xl border opacity-30"
          :class="isDark ? 'bg-[#222942] border-slate-700/60' : 'bg-white border-[#EAEAEA]'">
          <i class="fas fa-inbox text-sm"></i>
        </div>
        <p class="text-xs font-medium opacity-50">
          {{ filtro === 'pendiente' ? 'Sin solicitudes pendientes' : 'Sin resultados en este filtro' }}
        </p>
      </div>

      <div v-else class="w-full flex flex-col overflow-hidden text-left h-full">

        <div
          class="grid grid-cols-12 gap-4 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider border-b shrink-0"
          :class="isDark ? 'bg-[#161B26]/40 border-slate-800/80 text-slate-400' : 'bg-zinc-50 border-[#EAEAEA] text-[#666666]'">
          <span class="col-span-2">Estado</span>
          <span class="col-span-3">Solicitante</span>
          <span class="col-span-4">Mensaje</span>
          <span class="col-span-2">Fecha</span>
          <span class="col-span-1 text-right">Acción</span>
        </div>

        <div class="flex-1 overflow-y-auto divide-y scrollbar-none"
          :class="isDark ? 'divide-slate-800/50' : 'divide-[#EAEAEA]'">
          <div v-for="s in listaFiltrada" :key="s.id"
            class="grid grid-cols-12 gap-4 px-4 py-3.5 items-center text-xs transition-colors hover:bg-zinc-500/[0.01]">
            <div class="col-span-2">
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border"
                :class="{
                  'bg-amber-500/5 border-amber-500/20 text-amber-500': s.estado === 'pendiente',
                  'bg-emerald-500/5 border-emerald-500/20 text-emerald-500': s.estado === 'aprobado',
                  'bg-rose-500/5 border-rose-500/20 text-rose-500': s.estado === 'rechazado',
                }">
                <span class="w-1 h-1 rounded-full" :class="{
                  'bg-amber-500': s.estado === 'pendiente',
                  'bg-emerald-500': s.estado === 'aprobado',
                  'bg-rose-500': s.estado === 'rechazado',
                }"></span>
                {{ s.estado.charAt(0).toUpperCase() + s.estado.slice(1) }}
              </span>
            </div>

            <div class="col-span-3 flex items-center gap-2.5 min-w-0">
              <button
                class="w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 border transition-all hover:scale-105"
                :class="isDark ? 'bg-[#222942] border-slate-700/60 text-white' : 'bg-slate-100 border-slate-200 text-slate-800 shadow-sm'"
                @click.stop="togglePopover(s, $event)" :title="s.solicitante_nombre">
                {{ s.solicitante_nombre?.charAt(0)?.toUpperCase() || '?' }}
              </button>
              <p class="font-semibold truncate" :class="isDark ? 'text-white' : 'text-slate-900'">
                {{ s.solicitante_nombre }}
              </p>
            </div>

            <div class="col-span-4 space-y-0.5 pr-2">
              <p class="font-medium truncate opacity-70" :class="isDark ? 'text-zinc-300' : 'text-zinc-700'">
                {{ s.mensaje ? `"${s.mensaje}"` : '—' }}
              </p>
              <span v-if="s.atendido_por" class="inline-flex items-center gap-1 text-[10px] opacity-40">
                <i class="fas fa-user-check text-[8px]"></i> Atendido por: {{ s.atendido_por }}
              </span>
            </div>

            <div class="col-span-2 opacity-60 font-medium">
              {{ formatFecha(s.created_at) }}
            </div>

            <div class="col-span-1 flex items-center justify-end gap-1.5">
              <template v-if="s.estado === 'pendiente'">
                <button @click="atender(s.id, 'aprobado')" :disabled="procesando === s.id"
                  class="w-6 h-6 rounded-md flex items-center justify-center text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-40"
                  title="Aprobar">
                  <i class="fas fa-check text-[9px]"></i>
                </button>
                <button @click="atender(s.id, 'rechazado')" :disabled="procesando === s.id"
                  class="w-6 h-6 rounded-md flex items-center justify-center text-rose-400 bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-40"
                  title="Rechazar">
                  <i class="fas fa-xmark text-[9px]"></i>
                </button>
              </template>
              <span v-else class="text-[11px] font-bold opacity-20 pr-1">
                <i class="fas fa-check-double"></i>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="popover.visible"
        class="absolute z-50 w-52 rounded-xl p-4 border text-left flex items-start gap-3 shadow-xl animate-scale-up backdrop-blur-md"
        :class="isDark ? 'bg-[#161B26]/95 border-[#222938]' : 'bg-white border-slate-200'"
        :style="{ top: popover.y + 'px', left: popover.x + 'px' }" @click.stop>
        <div
          class="w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 bg-[#2563EB]/10 text-[#2563EB]">
          {{ popover.data?.solicitante_nombre?.charAt(0)?.toUpperCase() || '?' }}
        </div>
        <div class="flex-1 min-w-0 space-y-1">
          <p class="text-xs font-bold truncate" :class="isDark ? 'text-white' : 'text-slate-900'">
            {{ popover.data?.solicitante_nombre || '—' }}
          </p>
          <div class="text-[10px] font-medium opacity-60 space-y-0.5">
            <p v-if="popover.data?.cargo" class="truncate"><i class="fas fa-briefcase text-[8px] mr-1"></i> {{
              popover.data.cargo }}</p>
            <p v-if="popover.data?.departamento || popover.data?.segmento_nombre" class="truncate"><i
                class="fas fa-sitemap text-[8px] mr-1"></i> {{ popover.data?.departamento ||
                  popover.data?.segmento_nombre
              }}</p>
            <p v-if="popover.data?.area_nombre" class="truncate"><i class="fas fa-layer-group text-[8px] mr-1"></i> {{
              popover.data.area_nombre }}</p>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}

.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({ isDark: Boolean });
const emit = defineEmits(['success', 'error']);
const API_URL = import.meta.env.VITE_API_URL;

const FILTROS = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'todas', label: 'Todas' },
  { value: 'aprobado', label: 'Aprobadas' },
  { value: 'rechazado', label: 'Rechazadas' },
];

const lista = ref([]);
const filtro = ref('pendiente');
const cargando = ref(false);
const procesando = ref(null);
const showStats = ref(false);

const popover = ref({ visible: false, data: null, x: 0, y: 0 });

const togglePopover = (s, evt) => {
  if (popover.value.visible && popover.value.data?.id === s.id) {
    popover.value.visible = false;
    return;
  }
  const rect = evt.currentTarget.getBoundingClientRect();
  const rootRect = evt.currentTarget.closest('.sol-root').getBoundingClientRect();
  popover.value = {
    visible: true,
    data: s,
    x: rect.left - rootRect.left + rect.width / 2 - 90,
    y: rect.bottom - rootRect.top + 8,
  };
};

const closePopover = () => { popover.value.visible = false; };

const pendientes = computed(() => lista.value.filter(s => s.estado === 'pendiente').length);
const aprobadas = computed(() => lista.value.filter(s => s.estado === 'aprobado').length);
const rechazadas = computed(() => lista.value.filter(s => s.estado === 'rechazado').length);

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

const formatFecha = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
};

onMounted(cargar);
</script>

<style scoped>
/* ── ROOT ─────────────────────────────────────────────────── */
.sol-root {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  font-family: 'Inter', system-ui, sans-serif;
  overflow: hidden;
}

.sol-dark {
  background: transparent;
  color: #fff;
}

.sol-light {
  background: transparent;
  color: #1e293b;
}

/* ── HEADER ───────────────────────────────────────────────── */
.sol-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.sol-header-left {
  display: flex;
  align-items: center;
  gap: 9px;
}

.sol-header-icon {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sol-icon-dark {
  background: rgba(251, 191, 36, .12);
}

.sol-icon-light {
  background: #fffbeb;
}

.sol-title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.012em;
  line-height: 1.15;
}

.sol-subtitle {
  font-size: 10px;
  font-weight: 500;
  margin-top: 2px;
  letter-spacing: 0.01em;
  opacity: 0.6;
}

.sol-sub-sep {
  margin: 0 4px;
}

/* ── BOTONES HEADER ───────────────────────────────────────── */
.sol-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  cursor: pointer;
  transition: all .15s;
}

.sol-btn-icon {
  padding: 6px 9px;
}

.sol-btn-dark {
  background: transparent;
  border-color: rgba(255, 255, 255, .1);
  color: rgba(255, 255, 255, .5);
}

.sol-btn-dark:hover {
  border-color: rgba(255, 255, 255, .25);
  color: #fff;
  background: rgba(255, 255, 255, .05);
}

.sol-btn-light {
  background: #fff;
  border-color: #e2e8f0;
  color: #64748b;
}

.sol-btn-light:hover {
  border-color: #cbd5e1;
  color: #1e293b;
}

/* ── STATS PILLS ──────────────────────────────────────────── */
.sol-stats {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.sol-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid;
}

.sol-pill-dark {
  background: rgba(255, 255, 255, .03);
  border-color: rgba(255, 255, 255, .07);
}

.sol-pill-light {
  background: #fff;
  border-color: #e2e8f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .04);
}

.sol-pill-num {
  font-size: 13px;
  font-weight: 900;
  line-height: 1;
}

.sol-pill-lbl {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .1em;
}

/* Transición */
.stats-slide-enter-active,
.stats-slide-leave-active {
  transition: all .22s ease;
}

.stats-slide-enter-from,
.stats-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── TOOLBAR (divider + filtros) ──────────────────────────── */
.sol-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.sol-divider {
  flex: 1;
  height: 1px;
}

.sol-divider-dark {
  background: rgba(255, 255, 255, .06);
}

.sol-divider-light {
  background: #e2e8f0;
}

.sol-filters {
  display: flex;
  border-radius: 8px;
  border: 1px solid;
  overflow: hidden;
  flex-shrink: 0;
}

.sol-filters-dark {
  border-color: rgba(255, 255, 255, .1);
}

.sol-filters-light {
  border-color: #e2e8f0;
}

.sol-filter-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .08em;
  cursor: pointer;
  border: none;
  transition: all .15s;
}

.sol-filter-active {
  background: #f59e0b;
  color: #fff;
}

.sol-filter-idle-dark {
  background: transparent;
  color: rgba(255, 255, 255, .35);
}

.sol-filter-idle-dark:hover {
  background: rgba(255, 255, 255, .06);
  color: rgba(255, 255, 255, .7);
}

.sol-filter-idle-light {
  background: #fff;
  color: #94a3b8;
}

.sol-filter-idle-light:hover {
  background: #f8fafc;
  color: #475569;
}

.sol-filter-badge {
  background: #ef4444;
  color: #fff;
  font-size: 8px;
  font-weight: 900;
  border-radius: 999px;
  padding: 0 5px;
  min-width: 16px;
  text-align: center;
}

/* ── ESTADOS ──────────────────────────────────────────────── */
.sol-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 0;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.sol-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 60px 0;
  border-radius: 14px;
  border: 1px dashed;
  flex: 1;
}

.sol-empty-dark {
  border-color: rgba(255, 255, 255, .08);
}

.sol-empty-light {
  border-color: #e2e8f0;
}

.sol-empty-icon {
  font-size: 28px;
}

.sol-empty-text {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .1em;
}

/* ── TABLA ────────────────────────────────────────────────── */
.sol-table-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.sol-thead {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px;
  border-radius: 8px;
  margin-bottom: 6px;
  flex-shrink: 0;
}

.sol-thead-dark {
  background: rgba(255, 255, 255, .04);
}

.sol-thead-light {
  background: #f1f5f9;
}

.sol-th {
  font-size: 8.5px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .15em;
  color: #64748b;
}

/* Columnas */
.sol-col-estado {
  width: 88px;
  flex-shrink: 0;
}

.sol-col-nombre {
  width: 200px;
  flex-shrink: 0;
}

.sol-col-msg {
  flex: 1;
  min-width: 0;
}

.sol-col-fecha {
  width: 110px;
  flex-shrink: 0;
}

.sol-col-accion {
  width: 72px;
  flex-shrink: 0;
}

.sol-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  flex: 1;
  padding-bottom: 4px;
}

.sol-rows::-webkit-scrollbar {
  width: 4px;
}

.sol-rows::-webkit-scrollbar-thumb {
  border-radius: 2px;
  background: rgba(100, 116, 139, .2);
}

.sol-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid;
  transition: background .15s;
}

.sol-row-dark {
  background: rgba(255, 255, 255, .02);
  border-color: rgba(255, 255, 255, .06);
}

.sol-row-dark:hover {
  background: rgba(255, 255, 255, .05);
}

.sol-row-light {
  background: #fff;
  border-color: #e8edf4;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .04);
}

.sol-row-light:hover {
  background: #fafbfc;
}

.sol-row-amber {
  border-left: 3px solid rgba(251, 191, 36, .5);
}

.sol-row-green {
  border-left: 3px solid rgba(52, 211, 153, .35);
}

.sol-row-rose {
  border-left: 3px solid rgba(244, 63, 94, .35);
}

/* ── BADGE ESTADO ─────────────────────────────────────────── */
.sol-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
}

.sol-badge-amber {
  background: rgba(251, 191, 36, .1);
  color: #fbbf24;
}

.sol-badge-green {
  background: rgba(52, 211, 153, .1);
  color: #34d399;
}

.sol-badge-rose {
  background: rgba(244, 63, 94, .1);
  color: #fb7185;
}

.sol-badge-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── AVATAR ───────────────────────────────────────────────── */
.sol-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 900;
  flex-shrink: 0;
}

.sol-avatar-dark {
  background: rgba(251, 191, 36, .12);
  color: #fbbf24;
}

.sol-avatar-light {
  background: rgba(251, 191, 36, .1);
  color: #d97706;
}

/* ── DATOS FILA ───────────────────────────────────────────── */
.sol-row-name {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sol-row-msg {
  font-size: 10px;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-style: italic;
}

.sol-atendido {
  font-size: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 2px;
}

.sol-row-date {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: .04em;
}

/* ── BOTONES ACCIÓN ───────────────────────────────────────── */
.sol-icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .15s;
  flex-shrink: 0;
}

.sol-icon-btn:disabled {
  opacity: .35;
  cursor: default;
}

.sol-icon-green {
  background: rgba(16, 185, 129, .12);
  border-color: rgba(16, 185, 129, .3);
  color: #34d399;
}

.sol-icon-green:hover:not(:disabled) {
  background: rgba(16, 185, 129, .25);
  border-color: #34d399;
  color: #fff;
}

.sol-icon-red {
  background: rgba(239, 68, 68, .1);
  border-color: rgba(239, 68, 68, .3);
  color: #f87171;
}

.sol-icon-red:hover:not(:disabled) {
  background: rgba(239, 68, 68, .22);
  border-color: #f87171;
  color: #fff;
}

.sol-done-icon {
  font-size: 12px;
}

/* ── POPOVER ──────────────────────────────────────────────── */
.sol-popover {
  position: absolute;
  z-index: 100;
  width: 180px;
  border-radius: 10px;
  border: 1px solid;
  padding: 10px 12px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  pointer-events: auto;
}

.sol-popover-dark {
  background: #2d3a52;
  border-color: rgba(255, 255, 255, .1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, .4);
}

.sol-popover-light {
  background: #fff;
  border-color: #e2e8f0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .12);
}

/* Flechita superior */
.sol-pop-arrow {
  position: absolute;
  top: -5px;
  left: 86px;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  transform: rotate(45deg);
  border-left: 1px solid;
  border-top: 1px solid;
}

.sol-pop-arrow-dark {
  background: #2d3a52;
  border-color: rgba(255, 255, 255, .1);
}

.sol-pop-arrow-light {
  background: #fff;
  border-color: #e2e8f0;
}

.sol-pop-avatar {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 900;
  flex-shrink: 0;
}

.sol-pop-info {
  flex: 1;
  min-width: 0;
}

.sol-pop-name {
  font-size: 11px;
  font-weight: 800;
  line-height: 1.2;
  word-break: break-word;
  margin-bottom: 5px;
}

.sol-pop-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9px;
  font-weight: 600;
  margin-top: 3px;
}

/* Transición */
.pop-enter-active,
.pop-leave-active {
  transition: all .16s ease;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(.97);
}
</style>
