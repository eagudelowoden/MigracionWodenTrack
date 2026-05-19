<template>
  <div class="sol-root" :class="isDark ? 'sol-dark' : 'sol-light'" @click="closePopover">

    <!-- ── HEADER ─────────────────────────────────────────────────── -->
    <div class="sol-header">
      <div class="sol-header-left">
        <div class="sol-header-icon" :class="isDark ? 'sol-icon-dark' : 'sol-icon-light'">
          <i class="fas fa-inbox text-[13px] text-amber-400"></i>
        </div>
        <div>
          <h2 class="sol-title" :class="isDark ? 'text-white' : 'text-slate-800'">
            Solicitudes de apertura
          </h2>
          <p class="sol-subtitle" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            Cargue de mallas
            <span class="sol-sub-sep" :class="isDark ? 'text-white/20' : 'text-slate-300'">·</span>
            <span :class="pendientes > 0 ? 'text-amber-400 font-bold' : ''">
              {{ pendientes }} pendiente{{ pendientes !== 1 ? 's' : '' }}
            </span>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button @click="showStats = !showStats" class="sol-btn" :class="isDark ? 'sol-btn-dark' : 'sol-btn-light'">
          <i class="fas fa-chart-bar text-[9px]" style="opacity:.7"></i>
          <span>{{ showStats ? 'Ocultar' : 'Indicadores' }}</span>
          <i class="fas fa-chevron-down text-[8px] transition-transform" :class="showStats ? 'rotate-180' : ''"></i>
        </button>
        <button @click="cargar" :disabled="cargando" class="sol-btn sol-btn-icon" :class="isDark ? 'sol-btn-dark' : 'sol-btn-light'">
          <i class="fas fa-rotate text-[10px]" :class="cargando ? 'fa-spin' : ''"></i>
        </button>
      </div>
    </div>

    <!-- ── STATS PILLS (colapsable) ──────────────────────────────── -->
    <Transition name="stats-slide">
      <div v-if="showStats" class="sol-stats">
        <div class="sol-pill" :class="isDark ? 'sol-pill-dark' : 'sol-pill-light'">
          <i class="fas fa-inbox text-[9px] text-slate-400"></i>
          <span class="sol-pill-num" :class="isDark ? 'text-white' : 'text-slate-700'">{{ lista.length }}</span>
          <span class="sol-pill-lbl" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Total</span>
        </div>
        <div class="sol-pill" :class="isDark ? 'sol-pill-dark' : 'sol-pill-light'">
          <i class="fas fa-hourglass-half text-[9px] text-amber-400"></i>
          <span class="sol-pill-num text-amber-400">{{ pendientes }}</span>
          <span class="sol-pill-lbl" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Pendientes</span>
        </div>
        <div class="sol-pill" :class="isDark ? 'sol-pill-dark' : 'sol-pill-light'">
          <i class="fas fa-circle-check text-[9px] text-emerald-400"></i>
          <span class="sol-pill-num text-emerald-400">{{ aprobadas }}</span>
          <span class="sol-pill-lbl" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Aprobadas</span>
        </div>
        <div class="sol-pill" :class="isDark ? 'sol-pill-dark' : 'sol-pill-light'">
          <i class="fas fa-circle-xmark text-[9px] text-rose-400"></i>
          <span class="sol-pill-num text-rose-400">{{ rechazadas }}</span>
          <span class="sol-pill-lbl" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Rechazadas</span>
        </div>
      </div>
    </Transition>

    <!-- ── DIVIDER + FILTROS ──────────────────────────────────────── -->
    <div class="sol-toolbar">
      <div class="sol-divider" :class="isDark ? 'sol-divider-dark' : 'sol-divider-light'"></div>
      <div class="sol-filters" :class="isDark ? 'sol-filters-dark' : 'sol-filters-light'">
        <button
          v-for="f in FILTROS" :key="f.value"
          @click="filtro = f.value"
          class="sol-filter-btn"
          :class="filtro === f.value
            ? 'sol-filter-active'
            : (isDark ? 'sol-filter-idle-dark' : 'sol-filter-idle-light')"
        >
          {{ f.label }}
          <span v-if="f.value === 'pendiente' && pendientes > 0" class="sol-filter-badge">{{ pendientes }}</span>
        </button>
      </div>
    </div>

    <!-- ── ESTADO CARGANDO ────────────────────────────────────────── -->
    <div v-if="cargando" class="sol-loading" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
      <i class="fas fa-circle-notch fa-spin text-amber-400"></i>
      <span>Cargando solicitudes…</span>
    </div>

    <!-- ── ESTADO VACÍO ───────────────────────────────────────────── -->
    <div v-else-if="!listaFiltrada.length" class="sol-empty" :class="isDark ? 'sol-empty-dark' : 'sol-empty-light'">
      <i class="fas fa-inbox sol-empty-icon" :class="isDark ? 'text-white/15' : 'text-slate-300'"></i>
      <p class="sol-empty-text" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
        {{ filtro === 'pendiente' ? 'Sin solicitudes pendientes' : 'Sin resultados en este filtro' }}
      </p>
    </div>

    <!-- ── TABLA ──────────────────────────────────────────────────── -->
    <div v-else class="sol-table-wrap">
      <!-- Cabecera -->
      <div class="sol-thead" :class="isDark ? 'sol-thead-dark' : 'sol-thead-light'">
        <span class="sol-th sol-col-estado">Estado</span>
        <span class="sol-th sol-col-nombre">Solicitante</span>
        <span class="sol-th sol-col-msg">Mensaje</span>
        <span class="sol-th sol-col-fecha">Fecha</span>
        <span class="sol-th sol-col-accion text-right">Acción</span>
      </div>

      <!-- Filas -->
      <div class="sol-rows">
        <div
          v-for="s in listaFiltrada" :key="s.id"
          class="sol-row"
          :class="[
            isDark ? 'sol-row-dark' : 'sol-row-light',
            s.estado === 'pendiente'  ? 'sol-row-amber'   : '',
            s.estado === 'aprobado'   ? 'sol-row-green'   : '',
            s.estado === 'rechazado'  ? 'sol-row-rose'    : '',
          ]"
        >
          <!-- Estado -->
          <div class="sol-col-estado">
            <span class="sol-badge" :class="{
              'sol-badge-amber': s.estado === 'pendiente',
              'sol-badge-green': s.estado === 'aprobado',
              'sol-badge-rose' : s.estado === 'rechazado',
            }">
              <span class="sol-badge-dot" :class="{
                'bg-amber-400'  : s.estado === 'pendiente',
                'bg-emerald-400': s.estado === 'aprobado',
                'bg-rose-400'   : s.estado === 'rechazado',
              }"></span>
              {{ s.estado.charAt(0).toUpperCase() + s.estado.slice(1) }}
            </span>
          </div>

          <!-- Solicitante -->
          <div class="sol-col-nombre flex items-center gap-2 min-w-0">
            <button
              class="sol-avatar shrink-0"
              :class="isDark ? 'sol-avatar-dark' : 'sol-avatar-light'"
              @click.stop="togglePopover(s, $event)"
              :title="s.solicitante_nombre"
            >
              {{ s.solicitante_nombre?.charAt(0)?.toUpperCase() || '?' }}
            </button>
            <p class="sol-row-name" :class="isDark ? 'text-white' : 'text-slate-800'">
              {{ s.solicitante_nombre }}
            </p>
          </div>

          <!-- Mensaje -->
          <div class="sol-col-msg">
            <p v-if="s.mensaje" class="sol-row-msg" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
              "{{ s.mensaje }}"
            </p>
            <span v-if="s.atendido_por" class="sol-atendido" :class="isDark ? 'text-white/30' : 'text-slate-400'">
              <i class="fas fa-user-check text-[7px]"></i> {{ s.atendido_por }}
            </span>
          </div>

          <!-- Fecha -->
          <div class="sol-col-fecha">
            <p class="sol-row-date" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ formatFecha(s.created_at) }}</p>
          </div>

          <!-- Acción -->
          <div class="sol-col-accion flex items-center justify-end gap-1.5">
            <template v-if="s.estado === 'pendiente'">
              <button @click="atender(s.id, 'aprobado')" :disabled="procesando === s.id"
                class="sol-icon-btn sol-icon-green" title="Aprobar">
                <i class="fas fa-check text-[10px]"></i>
              </button>
              <button @click="atender(s.id, 'rechazado')" :disabled="procesando === s.id"
                class="sol-icon-btn sol-icon-red" title="Rechazar">
                <i class="fas fa-xmark text-[10px]"></i>
              </button>
            </template>
            <span v-else class="sol-done-icon" :class="isDark ? 'text-white/20' : 'text-slate-300'">
              <i class="fas fa-check-double text-[10px]"></i>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── POPOVER INFO ───────────────────────────────────────────── -->
    <Transition name="pop">
      <div
        v-if="popover.visible"
        class="sol-popover"
        :class="isDark ? 'sol-popover-dark' : 'sol-popover-light'"
        :style="{ top: popover.y + 'px', left: popover.x + 'px' }"
        @click.stop
      >
        <div class="sol-pop-arrow" :class="isDark ? 'sol-pop-arrow-dark' : 'sol-pop-arrow-light'"></div>
        <div class="sol-pop-avatar" :class="isDark ? 'sol-avatar-dark' : 'sol-avatar-light'">
          {{ popover.data?.solicitante_nombre?.charAt(0)?.toUpperCase() || '?' }}
        </div>
        <div class="sol-pop-info">
          <p class="sol-pop-name" :class="isDark ? 'text-white' : 'text-slate-800'">
            {{ popover.data?.solicitante_nombre || '—' }}
          </p>
          <p v-if="popover.data?.cargo" class="sol-pop-row" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            <i class="fas fa-briefcase text-[7px] opacity-60"></i> {{ popover.data.cargo }}
          </p>
          <p v-if="popover.data?.departamento || popover.data?.segmento_nombre" class="sol-pop-row" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            <i class="fas fa-sitemap text-[7px] opacity-60"></i>
            {{ popover.data?.departamento || popover.data?.segmento_nombre }}
          </p>
          <p v-if="popover.data?.area_nombre" class="sol-pop-row" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            <i class="fas fa-layer-group text-[7px] opacity-60"></i> {{ popover.data.area_nombre }}
          </p>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props   = defineProps({ isDark: Boolean });
const emit    = defineEmits(['success', 'error']);
const API_URL = import.meta.env.VITE_API_URL;

const FILTROS = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'todas',     label: 'Todas'      },
  { value: 'aprobado',  label: 'Aprobadas'  },
  { value: 'rechazado', label: 'Rechazadas' },
];

const lista      = ref([]);
const filtro     = ref('pendiente');
const cargando   = ref(false);
const procesando = ref(null);
const showStats  = ref(false);

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
const aprobadas  = computed(() => lista.value.filter(s => s.estado === 'aprobado').length);
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
  padding: 22px 24px;
  font-family: 'Inter', system-ui, sans-serif;
  overflow: hidden;
}
.sol-dark  { background: #1e2535; color: #fff; }
.sol-light { background: #f8fafc; color: #1e293b; }

/* ── HEADER ───────────────────────────────────────────────── */
.sol-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.sol-header-left { display: flex; align-items: center; gap: 12px; }

.sol-header-icon {
  width: 38px; height: 38px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.sol-icon-dark  { background: rgba(251,191,36,.1);  border: 1px solid rgba(251,191,36,.15); }
.sol-icon-light { background: rgba(251,191,36,.08); border: 1px solid rgba(251,191,36,.12); }

.sol-title {
  font-size: 13px; font-weight: 900;
  text-transform: uppercase; letter-spacing: .05em; line-height: 1;
}
.sol-subtitle {
  font-size: 10px; font-weight: 500;
  margin-top: 3px; letter-spacing: .02em;
}
.sol-sub-sep { margin: 0 4px; }

/* ── BOTONES HEADER ───────────────────────────────────────── */
.sol-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  border-radius: 8px; border: 1px solid;
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .06em;
  cursor: pointer; transition: all .15s;
}
.sol-btn-icon { padding: 6px 9px; }
.sol-btn-dark  { background: transparent; border-color: rgba(255,255,255,.1); color: rgba(255,255,255,.5); }
.sol-btn-dark:hover  { border-color: rgba(255,255,255,.25); color: #fff; background: rgba(255,255,255,.05); }
.sol-btn-light { background: #fff; border-color: #e2e8f0; color: #64748b; }
.sol-btn-light:hover { border-color: #cbd5e1; color: #1e293b; }

/* ── STATS PILLS ──────────────────────────────────────────── */
.sol-stats {
  display: flex; gap: 8px;
  margin-bottom: 14px; flex-shrink: 0;
}
.sol-pill {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 5px 12px; border-radius: 8px; border: 1px solid;
}
.sol-pill-dark  { background: rgba(255,255,255,.03); border-color: rgba(255,255,255,.07); }
.sol-pill-light { background: #fff; border-color: #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,.04); }
.sol-pill-num   { font-size: 13px; font-weight: 900; line-height: 1; }
.sol-pill-lbl   { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; }

/* Transición */
.stats-slide-enter-active,
.stats-slide-leave-active { transition: all .22s ease; }
.stats-slide-enter-from,
.stats-slide-leave-to { opacity: 0; transform: translateY(-6px); }

/* ── TOOLBAR (divider + filtros) ──────────────────────────── */
.sol-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; flex-shrink: 0; }

.sol-divider { flex: 1; height: 1px; }
.sol-divider-dark  { background: rgba(255,255,255,.06); }
.sol-divider-light { background: #e2e8f0; }

.sol-filters {
  display: flex; border-radius: 8px; border: 1px solid; overflow: hidden; flex-shrink: 0;
}
.sol-filters-dark  { border-color: rgba(255,255,255,.1); }
.sol-filters-light { border-color: #e2e8f0; }

.sol-filter-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 5px 12px;
  font-size: 9px; font-weight: 800;
  text-transform: uppercase; letter-spacing: .08em;
  cursor: pointer; border: none; transition: all .15s;
}
.sol-filter-active        { background: #f59e0b; color: #fff; }
.sol-filter-idle-dark     { background: transparent; color: rgba(255,255,255,.35); }
.sol-filter-idle-dark:hover  { background: rgba(255,255,255,.06); color: rgba(255,255,255,.7); }
.sol-filter-idle-light    { background: #fff; color: #94a3b8; }
.sol-filter-idle-light:hover { background: #f8fafc; color: #475569; }

.sol-filter-badge {
  background: #ef4444; color: #fff;
  font-size: 8px; font-weight: 900;
  border-radius: 999px; padding: 0 5px; min-width: 16px; text-align: center;
}

/* ── ESTADOS ──────────────────────────────────────────────── */
.sol-loading {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 48px 0; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em;
}
.sol-empty {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 10px; padding: 60px 0;
  border-radius: 14px; border: 1px dashed; flex: 1;
}
.sol-empty-dark  { border-color: rgba(255,255,255,.08); }
.sol-empty-light { border-color: #e2e8f0; }
.sol-empty-icon  { font-size: 28px; }
.sol-empty-text  { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; }

/* ── TABLA ────────────────────────────────────────────────── */
.sol-table-wrap { display: flex; flex-direction: column; flex: 1; min-height: 0; }

.sol-thead {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 14px; border-radius: 8px; margin-bottom: 6px; flex-shrink: 0;
}
.sol-thead-dark  { background: rgba(255,255,255,.04); }
.sol-thead-light { background: #f1f5f9; }

.sol-th {
  font-size: 8.5px; font-weight: 900;
  text-transform: uppercase; letter-spacing: .15em; color: #64748b;
}

/* Columnas */
.sol-col-estado { width: 88px;  flex-shrink: 0; }
.sol-col-nombre { width: 200px; flex-shrink: 0; }
.sol-col-msg    { flex: 1;      min-width: 0; }
.sol-col-fecha  { width: 110px; flex-shrink: 0; }
.sol-col-accion { width: 72px; flex-shrink: 0; }

.sol-rows {
  display: flex; flex-direction: column; gap: 4px;
  overflow-y: auto; flex: 1; padding-bottom: 4px;
}
.sol-rows::-webkit-scrollbar { width: 4px; }
.sol-rows::-webkit-scrollbar-thumb { border-radius: 2px; background: rgba(100,116,139,.2); }

.sol-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  border-radius: 10px; border: 1px solid;
  transition: background .15s;
}
.sol-row-dark  { background: rgba(255,255,255,.02); border-color: rgba(255,255,255,.06); }
.sol-row-dark:hover  { background: rgba(255,255,255,.05); }
.sol-row-light { background: #fff; border-color: #e8edf4; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
.sol-row-light:hover { background: #fafbfc; }

.sol-row-amber  { border-left: 3px solid rgba(251,191,36,.5);  }
.sol-row-green  { border-left: 3px solid rgba(52,211,153,.35); }
.sol-row-rose   { border-left: 3px solid rgba(244,63,94,.35);  }

/* ── BADGE ESTADO ─────────────────────────────────────────── */
.sol-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 8px; border-radius: 999px;
  font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;
}
.sol-badge-amber { background: rgba(251,191,36,.1);  color: #fbbf24; }
.sol-badge-green { background: rgba(52,211,153,.1);  color: #34d399; }
.sol-badge-rose  { background: rgba(244,63,94,.1);   color: #fb7185; }
.sol-badge-dot   { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

/* ── AVATAR ───────────────────────────────────────────────── */
.sol-avatar {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 900; flex-shrink: 0;
}
.sol-avatar-dark  { background: rgba(251,191,36,.12); color: #fbbf24; }
.sol-avatar-light { background: rgba(251,191,36,.1);  color: #d97706; }

/* ── DATOS FILA ───────────────────────────────────────────── */
.sol-row-name  { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sol-row-msg   { font-size: 10px; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-style: italic; }
.sol-atendido  { font-size: 8px; font-weight: 600; display: flex; align-items: center; gap: 3px; margin-top: 2px; }
.sol-row-date  { font-size: 9px; font-weight: 600; letter-spacing: .04em; }

/* ── BOTONES ACCIÓN ───────────────────────────────────────── */
.sol-icon-btn {
  width: 28px; height: 28px;
  border-radius: 7px; border: 1px solid;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .15s; flex-shrink: 0;
}
.sol-icon-btn:disabled { opacity: .35; cursor: default; }

.sol-icon-green { background: rgba(16,185,129,.12); border-color: rgba(16,185,129,.3); color: #34d399; }
.sol-icon-green:hover:not(:disabled) { background: rgba(16,185,129,.25); border-color: #34d399; color: #fff; }

.sol-icon-red   { background: rgba(239,68,68,.1);   border-color: rgba(239,68,68,.3);  color: #f87171; }
.sol-icon-red:hover:not(:disabled)   { background: rgba(239,68,68,.22);  border-color: #f87171;  color: #fff; }

.sol-done-icon { font-size: 12px; }

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
.sol-popover-dark  { background: #2d3a52; border-color: rgba(255,255,255,.1); box-shadow: 0 8px 24px rgba(0,0,0,.4); }
.sol-popover-light { background: #fff;    border-color: #e2e8f0;              box-shadow: 0 8px 24px rgba(0,0,0,.12); }

/* Flechita superior */
.sol-pop-arrow {
  position: absolute;
  top: -5px; left: 86px;
  width: 8px; height: 8px;
  border-radius: 2px;
  transform: rotate(45deg);
  border-left: 1px solid; border-top: 1px solid;
}
.sol-pop-arrow-dark  { background: #2d3a52; border-color: rgba(255,255,255,.1); }
.sol-pop-arrow-light { background: #fff;    border-color: #e2e8f0; }

.sol-pop-avatar {
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 900; flex-shrink: 0;
}

.sol-pop-info { flex: 1; min-width: 0; }

.sol-pop-name {
  font-size: 11px; font-weight: 800;
  line-height: 1.2;
  word-break: break-word;
  margin-bottom: 5px;
}
.sol-pop-row {
  display: flex; align-items: center; gap: 5px;
  font-size: 9px; font-weight: 600;
  margin-top: 3px;
}

/* Transición */
.pop-enter-active, .pop-leave-active { transition: all .16s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(-4px) scale(.97); }
</style>
