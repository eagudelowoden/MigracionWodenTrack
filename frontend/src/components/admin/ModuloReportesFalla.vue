<template>
  <div class="rf-root" :class="isDark ? 'rf-dark' : 'rf-light'">

    <!-- ── HEADER ─────────────────────────────────────────────────── -->
    <div class="rf-header">
      <div class="rf-header-left">
        <div class="rf-header-icon" :class="isDark ? 'rf-icon-dark' : 'rf-icon-light'">
          <i class="fas fa-triangle-exclamation text-[13px] text-red-400"></i>
        </div>
        <div>
          <h2 class="rf-title" :class="isDark ? 'text-white' : 'text-slate-800'">
            Reportes de Falla
            <span class="rf-title-sub" :class="isDark ? 'text-white/25' : 'text-slate-300'">— App Móvil</span>
          </h2>
          <p class="rf-subtitle" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            Reportes enviados por usuarios desde WodenTrack APK
          </p>
        </div>
      </div>

      <!-- Botones derecha -->
      <div class="flex items-center gap-2">
        <button @click="showStats = !showStats" class="rf-btn-refresh" :class="isDark ? 'rf-btn-dark' : 'rf-btn-light'">
          <i class="text-[10px]" :class="showStats ? 'fas fa-chart-bar' : 'fas fa-chart-bar'" style="opacity:.7"></i>
          <span>{{ showStats ? 'Ocultar' : 'Indicadores' }}</span>
          <i class="fas fa-chevron-down text-[8px] transition-transform" :class="showStats ? 'rotate-180' : ''"></i>
        </button>
        <button @click="cargar" class="rf-btn-refresh" :class="isDark ? 'rf-btn-dark' : 'rf-btn-light'">
          <i class="fas fa-rotate-right text-[10px]" :class="{ 'fa-spin': cargando }"></i>
        </button>
      </div>
    </div>

    <!-- ── STATS (colapsable) ─────────────────────────────────────── -->
    <Transition name="stats-slide">
      <div v-if="showStats" class="rf-stats">
        <div class="rf-stat-pill" :class="isDark ? 'rf-stat-dark' : 'rf-stat-light'">
          <i class="fas fa-inbox text-[9px] text-slate-400"></i>
          <span class="rf-pill-num" :class="isDark ? 'text-white' : 'text-slate-700'">{{ reportes.length }}</span>
          <span class="rf-pill-label" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Total</span>
        </div>
        <div class="rf-stat-pill" :class="isDark ? 'rf-stat-dark' : 'rf-stat-light'">
          <i class="fas fa-circle-exclamation text-[9px] text-red-400"></i>
          <span class="rf-pill-num text-red-400">{{ pendientes }}</span>
          <span class="rf-pill-label" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Pendientes</span>
        </div>
        <div class="rf-stat-pill" :class="isDark ? 'rf-stat-dark' : 'rf-stat-light'">
          <i class="fas fa-circle-check text-[9px] text-emerald-400"></i>
          <span class="rf-pill-num text-emerald-400">{{ resueltos }}</span>
          <span class="rf-pill-label" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Resueltos</span>
        </div>
      </div>
    </Transition>

    <!-- ── DIVIDER ────────────────────────────────────────────────── -->
    <div class="rf-divider" :class="isDark ? 'rf-divider-dark' : 'rf-divider-light'"></div>

    <!-- ── ESTADO CARGANDO ────────────────────────────────────────── -->
    <div v-if="cargando" class="rf-loading" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
      <i class="fas fa-circle-notch fa-spin text-red-400"></i>
      <span>Cargando reportes…</span>
    </div>

    <!-- ── ESTADO VACÍO ───────────────────────────────────────────── -->
    <div v-else-if="!reportes.length" class="rf-empty" :class="isDark ? 'rf-empty-dark' : 'rf-empty-light'">
      <i class="fas fa-bug rf-empty-icon" :class="isDark ? 'text-white/15' : 'text-slate-300'"></i>
      <p class="rf-empty-text" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Sin reportes de falla registrados</p>
    </div>

    <!-- ── TABLA CABECERA ─────────────────────────────────────────── -->
    <div v-else class="rf-table-wrap">
      <div class="rf-table-head" :class="isDark ? 'rf-thead-dark' : 'rf-thead-light'">
        <span class="rf-th w-[90px]">Estado</span>
        <span class="rf-th flex-1">Usuario / Descripción</span>
        <span class="rf-th w-[130px] text-right">Fecha</span>
        <span class="rf-th w-[90px] text-right">Acción</span>
      </div>

      <!-- ── FILAS ──────────────────────────────────────────────── -->
      <div class="rf-rows">
        <div
          v-for="r in reportes" :key="r.id"
          class="rf-row"
          :class="[
            isDark ? 'rf-row-dark' : 'rf-row-light',
            r.resuelto ? 'rf-row-resolved' : 'rf-row-pending',
          ]"
        >
          <!-- Estado -->
          <div class="w-[90px] shrink-0">
            <span class="rf-badge" :class="r.resuelto ? 'rf-badge-green' : 'rf-badge-red'">
              <span class="rf-badge-dot" :class="r.resuelto ? 'bg-emerald-400' : 'bg-red-400'"></span>
              {{ r.resuelto ? 'Resuelto' : 'Pendiente' }}
            </span>
          </div>

          <!-- Datos -->
          <div class="flex-1 min-w-0">
            <p class="rf-row-name" :class="isDark ? 'text-white' : 'text-slate-800'">
              {{ r.nombre }}
              <span class="rf-row-id" :class="isDark ? 'text-white/30' : 'text-slate-400'">#{{ r.empleado_id }}</span>
            </p>
            <p class="rf-row-desc" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ r.descripcion }}</p>
          </div>

          <!-- Fecha -->
          <div class="w-[130px] shrink-0 text-right">
            <p class="rf-row-date" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ formatFecha(r.fecha) }}</p>
          </div>

          <!-- Acción -->
          <div class="w-[90px] shrink-0 flex justify-end">
            <button
              v-if="!r.resuelto"
              @click="marcarResuelto(r)"
              class="rf-resolve-btn"
              :class="isDark ? 'rf-resolve-dark' : 'rf-resolve-light'"
            >
              <i class="fas fa-check text-[8px]"></i>
              Resolver
            </button>
            <span v-else class="rf-done-label" :class="isDark ? 'text-white/20' : 'text-slate-300'">
              <i class="fas fa-check-double text-[9px]"></i>
            </span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const props = defineProps({ isDark: Boolean });

const API_URL = import.meta.env.VITE_API_URL;
const reportes  = ref([]);
const cargando  = ref(false);
const showStats = ref(false);

const pendientes = computed(() => reportes.value.filter(r => !r.resuelto).length);
const resueltos  = computed(() => reportes.value.filter(r =>  r.resuelto).length);

const cargar = async () => {
  cargando.value = true;
  try {
    const res = await axios.get(`${API_URL}/reportes-falla`);
    reportes.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    console.error('Error cargando reportes:', e);
  } finally {
    cargando.value = false;
  }
};

const marcarResuelto = async (r) => {
  try {
    await axios.patch(`${API_URL}/reportes-falla/${r.id}/resolver`);
    r.resuelto = true;
  } catch (e) {
    console.error('Error al resolver reporte:', e);
  }
};

const formatFecha = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

onMounted(cargar);
</script>

<style scoped>
/* ── ROOT ─────────────────────────────────────────────────── */
.rf-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  gap: 0;
  font-family: 'Inter', system-ui, sans-serif;
  overflow: hidden;
}
.rf-dark  { background: transparent; color: #fff; }
.rf-light { background: transparent; color: #1e293b; }

/* ── HEADER ───────────────────────────────────────────────── */
.rf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.rf-header-left { display: flex; align-items: center; gap: 9px; }

.rf-header-icon {
  width: 30px; height: 30px;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.rf-icon-dark  { background: rgba(248,113,113,.12); }
.rf-icon-light { background: #fef2f2; }

.rf-title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.012em;
  line-height: 1.15;
}
.rf-title-sub { font-weight: 400; font-size: 12px; opacity: 0.5; }

.rf-subtitle {
  font-size: 10px;
  font-weight: 500;
  margin-top: 2px;
  letter-spacing: 0.01em;
  opacity: 0.6;
}

.rf-btn-refresh {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid;
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .06em;
  cursor: pointer;
  transition: all .15s;
}
.rf-btn-dark  { background: transparent; border-color: rgba(255,255,255,.1); color: rgba(255,255,255,.5); }
.rf-btn-dark:hover  { border-color: rgba(255,255,255,.25); color: #fff; background: rgba(255,255,255,.05); }
.rf-btn-light { background: #fff; border-color: #e2e8f0; color: #64748b; }
.rf-btn-light:hover { border-color: #cbd5e1; color: #1e293b; }

/* ── STATS ────────────────────────────────────────────────── */
.rf-stats {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  flex-shrink: 0;
  overflow: hidden;
}

.rf-stat-pill {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid;
}
.rf-stat-dark  { background: rgba(255,255,255,.03); border-color: rgba(255,255,255,.07); }
.rf-stat-light { background: #fff; border-color: #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,.04); }

.rf-pill-num   { font-size: 13px; font-weight: 900; line-height: 1; }
.rf-pill-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; }

/* Transición stats */
.stats-slide-enter-active,
.stats-slide-leave-active { transition: all .22s ease; }
.stats-slide-enter-from,
.stats-slide-leave-to { opacity: 0; transform: translateY(-6px); max-height: 0; margin-bottom: 0; }

/* ── DIVIDER ──────────────────────────────────────────────── */
.rf-divider { height: 1px; margin-bottom: 16px; flex-shrink: 0; }
.rf-divider-dark  { background: rgba(255,255,255,.06); }
.rf-divider-light { background: #e2e8f0; }

/* ── ESTADOS ──────────────────────────────────────────────── */
.rf-loading {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 48px 0; font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .08em;
}
.rf-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 60px 0; border-radius: 14px; border: 1px dashed;
  flex: 1;
}
.rf-empty-dark  { border-color: rgba(255,255,255,.08); }
.rf-empty-light { border-color: #e2e8f0; }
.rf-empty-icon  { font-size: 28px; }
.rf-empty-text  { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; }

/* ── TABLA ────────────────────────────────────────────────── */
.rf-table-wrap { display: flex; flex-direction: column; flex: 1; min-height: 0; }

.rf-table-head {
  display: flex; align-items: center; gap: 12px;
  padding: 7px 14px;
  border-radius: 8px;
  margin-bottom: 6px;
  flex-shrink: 0;
}
.rf-thead-dark  { background: rgba(255,255,255,.04); }
.rf-thead-light { background: #f1f5f9; }

.rf-th {
  font-size: 8.5px; font-weight: 900;
  text-transform: uppercase; letter-spacing: .15em;
  color: #64748b;
}

.rf-rows { display: flex; flex-direction: column; gap: 4px; overflow-y: auto; flex: 1; padding-bottom: 4px; }
.rf-rows::-webkit-scrollbar { width: 4px; }
.rf-rows::-webkit-scrollbar-thumb { border-radius: 2px; background: rgba(100,116,139,.2); }

.rf-row {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 14px;
  border-radius: 10px;
  border: 1px solid;
  transition: background .15s;
}
.rf-row-dark  { background: rgba(255,255,255,.02); border-color: rgba(255,255,255,.06); }
.rf-row-dark:hover  { background: rgba(255,255,255,.05); }
.rf-row-light { background: #fff; border-color: #e8edf4; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
.rf-row-light:hover { background: #fafbfc; }

/* Acento lateral por estado */
.rf-row-pending { border-left: 3px solid rgba(239,68,68,.4); }
.rf-row-resolved { border-left: 3px solid rgba(52,211,153,.3); }

/* ── BADGE ESTADO ─────────────────────────────────────────── */
.rf-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 8px; border-radius: 999px;
  font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;
}
.rf-badge-red   { background: rgba(239,68,68,.1);  color: #f87171; }
.rf-badge-green { background: rgba(52,211,153,.1); color: #34d399; }

.rf-badge-dot {
  width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
}

/* ── DATOS FILA ───────────────────────────────────────────── */
.rf-row-name {
  font-size: 11px; font-weight: 800;
  text-transform: uppercase; letter-spacing: .04em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.rf-row-id   { font-size: 9px; font-weight: 500; margin-left: 6px; }
.rf-row-desc { font-size: 10px; font-weight: 400; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rf-row-date { font-size: 9px; font-weight: 600; letter-spacing: .04em; }

/* ── BOTÓN RESOLVER ───────────────────────────────────────── */
.rf-resolve-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 7px; border: 1px solid;
  font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em;
  cursor: pointer; transition: all .15s;
}
.rf-resolve-dark  { background: transparent; border-color: rgba(52,211,153,.3); color: #34d399; }
.rf-resolve-dark:hover  { background: rgba(52,211,153,.1); border-color: rgba(52,211,153,.5); }
.rf-resolve-light { background: #fff; border-color: #bbf7d0; color: #059669; }
.rf-resolve-light:hover { background: #f0fdf4; border-color: #6ee7b7; }

.rf-done-label { font-size: 12px; }
</style>
