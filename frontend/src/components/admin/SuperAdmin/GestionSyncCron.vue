<template>
  <div class="gsc-wrap">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="gsc-header">
      <div>
        <h2 class="gsc-title">Sincronización Automática</h2>
        <p class="gsc-subtitle">Sincroniza empleados de Odoo con la base de datos local de forma programada.</p>
      </div>
      <button @click="ejecutarManual" :disabled="ejecutando || config?.ultimo_estado === 'running' || selectedPaises.length === 0"
        class="gsc-btn-run">
        <i class="fas" :class="ejecutando ? 'fa-spinner fa-spin' : 'fa-play'"></i>
        {{ ejecutando ? 'Ejecutando...' : 'Ejecutar ahora' }}
      </button>
    </div>

    <!-- ── Estado actual ────────────────────────────────────────────────────── -->
    <div v-if="config" class="gsc-cards">

      <div class="gsc-card">
        <div class="gsc-card-label">Estado</div>
        <div class="gsc-status-pill" :class="`gsc-status-${estadoColor(config.ultimo_estado)}`">
          <span class="gsc-status-dot"></span>
          {{ labelEstado(config.ultimo_estado) }}
        </div>
      </div>

      <div class="gsc-card">
        <div class="gsc-card-label">Última ejecución</div>
        <div class="gsc-card-value">{{ formatFecha(config.ultimo_inicio) }}</div>
        <div class="gsc-card-sub" v-if="config.ultima_duracion_seg != null">
          Duración: {{ formatDuracion(config.ultima_duracion_seg) }}
        </div>
      </div>

      <div class="gsc-card">
        <div class="gsc-card-label">Próxima ejecución</div>
        <div class="gsc-card-value">{{ config.activo ? formatFecha(config.proxima_ejecucion) : 'Desactivado' }}</div>
        <div class="gsc-card-sub">{{ config.activo ? `Todos los días a las ${padHora(config.hora)}:${padHora(config.minuto)}` : 'El cron está desactivado' }}</div>
      </div>

      <div class="gsc-card">
        <div class="gsc-card-label">Último resultado</div>
        <div class="gsc-card-value" v-if="config.ultimo_resumen">{{ config.ultimo_resumen }}</div>
        <div class="gsc-card-value gsc-text-muted" v-else>Sin ejecuciones</div>
        <div class="gsc-error-msg" v-if="config.ultimo_error">
          <i class="fas fa-triangle-exclamation"></i> {{ config.ultimo_error }}
        </div>
      </div>

    </div>

    <!-- Skeleton loading -->
    <div v-else-if="loading" class="gsc-cards">
      <div v-for="i in 4" :key="i" class="gsc-card gsc-skeleton"></div>
    </div>

    <!-- ── Configuración ────────────────────────────────────────────────────── -->
    <div class="gsc-section">
      <h3 class="gsc-section-title">Configuración del cron</h3>

      <div class="gsc-form">

        <!-- Activo toggle -->
        <div class="gsc-form-row">
          <label class="gsc-label">Estado del cron</label>
          <button @click="toggleActivo" class="gsc-toggle" :class="form.activo ? 'gsc-toggle-on' : 'gsc-toggle-off'">
            <span class="gsc-toggle-thumb"></span>
          </button>
          <span class="gsc-toggle-label">{{ form.activo ? 'Activo' : 'Inactivo' }}</span>
        </div>

        <!-- Hora -->
        <div class="gsc-form-row">
          <label class="gsc-label">Hora de ejecución</label>
          <div class="gsc-time-inputs">
            <div class="gsc-time-group">
              <label class="gsc-time-label">Hora</label>
              <select v-model.number="form.hora" class="gsc-select">
                <option v-for="h in 24" :key="h-1" :value="h-1">{{ padHora(h-1) }}</option>
              </select>
            </div>
            <span class="gsc-time-sep">:</span>
            <div class="gsc-time-group">
              <label class="gsc-time-label">Minuto</label>
              <select v-model.number="form.minuto" class="gsc-select">
                <option v-for="m in [0,5,10,15,20,25,30,35,40,45,50,55]" :key="m" :value="m">{{ padHora(m) }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Países -->
        <div class="gsc-form-row gsc-form-col">
          <div class="gsc-label-row">
            <label class="gsc-label">Países a sincronizar</label>
            <span class="gsc-required-hint" v-if="selectedPaises.length === 0">
              <i class="fas fa-triangle-exclamation"></i> Selecciona al menos un país
            </span>
            <span class="gsc-ok-hint" v-else>
              <i class="fas fa-check"></i> {{ selectedPaises.length }} seleccionado{{ selectedPaises.length > 1 ? 's' : '' }}
            </span>
          </div>

          <!-- Dropdown multi-select -->
          <div class="gsc-dropdown-wrap" ref="dropdownRef">
            <!-- Trigger -->
            <button type="button" class="gsc-dropdown-trigger" @click="dropdownOpen = !dropdownOpen"
              :class="dropdownOpen ? 'gsc-dropdown-trigger-open' : ''">
              <span v-if="paisesDisponibles.length === 0" class="gsc-text-muted">
                <i class="fas fa-spinner fa-spin" style="margin-right:6px"></i>Cargando países...
              </span>
              <span v-else-if="selectedPaises.length === 0" class="gsc-text-muted">Selecciona los países...</span>
              <span v-else-if="selectedPaises.length === paisesDisponibles.length" class="gsc-trigger-label">
                Todos los países
              </span>
              <span v-else class="gsc-trigger-label">
                {{ selectedPaises.length }} país{{ selectedPaises.length > 1 ? 'es' : '' }} seleccionado{{ selectedPaises.length > 1 ? 's' : '' }}
              </span>
              <i class="fas fa-chevron-down gsc-dropdown-caret" :class="dropdownOpen ? 'gsc-caret-open' : ''"></i>
            </button>

            <!-- Panel desplegable -->
            <Transition name="gsc-drop">
              <div v-if="dropdownOpen && paisesDisponibles.length > 0" class="gsc-dropdown-list"
                :style="props.isDark ? 'background:#1e2a3a;border-color:#3d4e61' : 'background:#ffffff;border-color:#e2e8f0'">

                <!-- Búsqueda -->
                <div class="gsc-search-wrap"
                  :style="props.isDark ? 'border-color:#3d4e61' : 'border-color:#e2e8f0'">
                  <i class="fas fa-magnifying-glass gsc-search-icon"></i>
                  <input v-model="paisSearch" class="gsc-search-input" placeholder="Buscar país..." autofocus />
                </div>

                <div class="gsc-dropdown-scroll">
                  <!-- Todos los países -->
                  <div class="gsc-dropdown-item" @click="toggleTodos">
                    <i class="fas fa-earth-americas gsc-globe-icon"></i>
                    <span class="gsc-dropdown-item-label">Todos los países</span>
                    <i v-if="selectedPaises.length === paisesDisponibles.length"
                      class="fas fa-check gsc-check-icon"></i>
                  </div>
                  <div class="gsc-dropdown-divider"></div>

                  <!-- Lista filtrada -->
                  <div v-for="pais in paisesFiltrados" :key="pais"
                    class="gsc-dropdown-item" @click="togglePais(pais)"
                    :class="selectedPaises.includes(pais) ? 'gsc-item-selected' : ''"
                    :style="props.isDark ? 'color:#d5dbdb' : 'color:#1e293b'">
                    <span class="gsc-dropdown-item-label">{{ pais }}</span>
                    <i v-if="selectedPaises.includes(pais)" class="fas fa-check gsc-check-icon"></i>
                  </div>

                  <div v-if="paisesFiltrados.length === 0" class="gsc-no-results">
                    Sin resultados
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <div class="gsc-form-actions">
          <button @click="guardar" :disabled="loading || selectedPaises.length === 0" class="gsc-btn-save">
            <i class="fas fa-floppy-disk"></i>
            {{ loading ? 'Guardando...' : 'Guardar configuración' }}
          </button>
          <span v-if="savedMsg" class="gsc-saved-msg">
            <i class="fas fa-check"></i> Guardado
          </span>
        </div>

      </div>
    </div>

    <!-- ── Historial ────────────────────────────────────────────────────────── -->
    <div class="gsc-section">
      <h3 class="gsc-section-title">Historial de ejecuciones</h3>

      <div v-if="historial.length === 0" class="gsc-empty">
        <i class="fas fa-clock-rotate-left"></i>
        <p>Sin ejecuciones registradas aún.</p>
      </div>

      <table v-else class="gsc-table">
        <thead>
          <tr>
            <th>Fecha inicio</th>
            <th>Duración</th>
            <th>Estado</th>
            <th>Países</th>
            <th>Insertados</th>
            <th>Actualizados</th>
            <th>Eliminados</th>
            <th>Origen</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in historial" :key="log.id" :class="`gsc-tr-${estadoColor(log.estado)}`">
            <td class="gsc-td-fecha">{{ formatFecha(log.inicio) }}</td>
            <td>{{ formatDuracion(log.duracion_seg) }}</td>
            <td>
              <span class="gsc-badge" :class="`gsc-badge-${estadoColor(log.estado)}`">
                {{ labelEstado(log.estado) }}
              </span>
            </td>
            <td class="gsc-td-paises">{{ log.paises || '—' }}</td>
            <td class="gsc-td-num gsc-green">+{{ log.insertados ?? 0 }}</td>
            <td class="gsc-td-num gsc-blue">~{{ log.actualizados ?? 0 }}</td>
            <td class="gsc-td-num gsc-red">-{{ log.eliminados ?? 0 }}</td>
            <td>
              <span class="gsc-origen" :class="log.origen === 'manual' ? 'gsc-origen-manual' : 'gsc-origen-auto'">
                {{ log.origen === 'manual' ? 'Manual' : 'Auto' }}
              </span>
            </td>
            <td class="gsc-td-error">
              <span v-if="log.error" :title="log.error" class="gsc-error-chip">
                <i class="fas fa-triangle-exclamation"></i> Ver
              </span>
              <span v-else class="gsc-text-muted">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { useSyncCron } from '../../../composables/adminLogica/useSyncCron.js';

const props = defineProps({ isDark: Boolean });

const {
  config, historial, paisesDisponibles, loading, ejecutando, error,
  fetchConfig, guardarConfig, ejecutarAhora, fetchHistorial, fetchPaises,
  estadoColor, formatDuracion, formatFecha,
} = useSyncCron();

const savedMsg = ref(false);
const selectedPaises = ref([]);
const dropdownOpen = ref(false);
const dropdownRef = ref(null);
const paisSearch = ref('');

const paisesFiltrados = computed(() =>
  (paisesDisponibles.value ?? []).filter(p =>
    p.toLowerCase().includes(paisSearch.value.toLowerCase())
  )
);

const togglePais = (pais) => {
  const idx = selectedPaises.value.indexOf(pais);
  if (idx === -1) selectedPaises.value = [...selectedPaises.value, pais];
  else selectedPaises.value = selectedPaises.value.filter(p => p !== pais);
};

const toggleTodos = () => {
  if (selectedPaises.value.length === paisesDisponibles.value.length)
    selectedPaises.value = [];
  else
    selectedPaises.value = [...paisesDisponibles.value];
};

const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    dropdownOpen.value = false;
    paisSearch.value = '';
  }
};

// Form local
const form = ref({ hora: 2, minuto: 0, activo: true });

// Al llegar la config, pre-seleccionar los países guardados
watch(config, (val) => {
  if (!val) return;
  form.value.hora   = val.hora   ?? 2;
  form.value.minuto = val.minuto ?? 0;
  form.value.activo = val.activo ?? true;
  // Restaurar selección guardada cuando ya tengamos la lista
  syncSeleccion(val.paises);
}, { immediate: true });

// Cuando llegan los países disponibles, re-aplicar la selección guardada
watch(paisesDisponibles, () => {
  if (config.value?.paises) syncSeleccion(config.value.paises);
});

const syncSeleccion = (paisesStr) => {
  if (!paisesStr || paisesStr === 'TODOS') {
    selectedPaises.value = [...(paisesDisponibles.value ?? [])];
  } else {
    selectedPaises.value = paisesStr.split(',').map(p => p.trim()).filter(Boolean);
  }
};

onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
  await Promise.all([fetchConfig(), fetchHistorial(), fetchPaises()]);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const guardar = async () => {
  await guardarConfig({
    hora: form.value.hora,
    minuto: form.value.minuto,
    paises: selectedPaises.value.join(', '),
    activo: form.value.activo,
  });
  savedMsg.value = true;
  setTimeout(() => { savedMsg.value = false; }, 2500);
};

const toggleActivo = () => { form.value.activo = !form.value.activo; };

const ejecutarManual = async () => {
  await ejecutarAhora();
};

const padHora = (n) => String(n).padStart(2, '0');

const labelEstado = (e) => {
  if (e === 'success') return 'Exitoso';
  if (e === 'error') return 'Error';
  if (e === 'parcial') return 'Parcial';
  if (e === 'running') return 'Ejecutando';
  return 'Sin datos';
};
</script>

<style scoped>
.gsc-wrap {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 2px 0;
  font-family: system-ui, sans-serif;
}

/* Header */
.gsc-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.gsc-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0 0 3px;
}
.gsc-subtitle {
  font-size: 11px;
  color: var(--text-soft);
  margin: 0;
}

.gsc-btn-run {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 16px;
  background: #3B82F6;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
  white-space: nowrap;
}
.gsc-btn-run:hover:not(:disabled) { background: #2563eb; }
.gsc-btn-run:disabled { opacity: .5; cursor: not-allowed; }

/* Cards resumen */
.gsc-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}
.gsc-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.gsc-card.gsc-skeleton {
  height: 80px;
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse {
  0%,100% { opacity: 1; }
  50%      { opacity: .4; }
}
.gsc-card-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--text-soft);
}
.gsc-card-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}
.gsc-card-sub {
  font-size: 10px;
  color: var(--text-soft);
}
.gsc-error-msg {
  font-size: 10px;
  color: #ef4444;
  margin-top: 2px;
}
.gsc-text-muted { color: var(--text-soft) !important; }

/* Status pill */
.gsc-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  width: fit-content;
}
.gsc-status-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.gsc-status-green  { color: #22c55e; background: rgba(34,197,94,.12); }
.gsc-status-red    { color: #ef4444; background: rgba(239,68,68,.12); }
.gsc-status-yellow { color: #f59e0b; background: rgba(245,158,11,.12); }
.gsc-status-blue   { color: #3b82f6; background: rgba(59,130,246,.12); }
.gsc-status-gray   { color: var(--text-soft); background: var(--bg-input); }

/* Sección */
.gsc-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 18px 20px;
}
.gsc-section-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--text-soft);
  margin: 0 0 14px;
}

/* Form */
.gsc-form { display: flex; flex-direction: column; gap: 16px; }
.gsc-form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.gsc-form-col { flex-direction: column; align-items: flex-start; }
.gsc-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
  min-width: 160px;
}
.gsc-hint {
  font-size: 11px;
  color: var(--text-soft);
  margin: 2px 0 6px;
}
.gsc-hint code {
  background: var(--bg-input);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 11px;
}
.gsc-input {
  width: 100%;
  max-width: 360px;
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 12px;
  outline: none;
}
.gsc-input:focus { border-color: #3b82f6; }
.gsc-select {
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 12px;
  outline: none;
  cursor: pointer;
}
.gsc-time-inputs { display: flex; align-items: center; gap: 8px; }
.gsc-time-group { display: flex; flex-direction: column; gap: 3px; }
.gsc-time-label { font-size: 9px; color: var(--text-soft); text-transform: uppercase; }
.gsc-time-sep { font-size: 18px; font-weight: 700; color: var(--text-soft); margin-top: 12px; }

/* Toggle */
.gsc-toggle {
  width: 38px; height: 22px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  position: relative;
  transition: background .2s;
  flex-shrink: 0;
}
.gsc-toggle-on  { background: #3b82f6; }
.gsc-toggle-off { background: var(--border); }
.gsc-toggle-thumb {
  position: absolute;
  top: 3px; left: 3px;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: left .2s;
}
.gsc-toggle-on .gsc-toggle-thumb { left: 19px; }
.gsc-toggle-label { font-size: 12px; color: var(--text-soft); }

.gsc-form-actions { display: flex; align-items: center; gap: 10px; }
.gsc-btn-save {
  display: flex; align-items: center; gap: 7px;
  padding: 7px 16px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--text-main);
  font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all .15s;
}
.gsc-btn-save:hover:not(:disabled) { border-color: #3b82f6; color: #3b82f6; }
.gsc-btn-save:disabled { opacity: .5; cursor: not-allowed; }
.gsc-saved-msg { font-size: 12px; color: #22c55e; font-weight: 600; }

/* Tabla historial */
.gsc-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 28px; color: var(--text-soft);
  font-size: 12px;
}
.gsc-empty i { font-size: 24px; opacity: .4; }

.gsc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.gsc-table th {
  text-align: left;
  padding: 6px 10px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--text-soft);
  border-bottom: 1px solid var(--border);
}
.gsc-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  color: var(--text-main);
  vertical-align: middle;
}
.gsc-table tr:last-child td { border-bottom: none; }
.gsc-tr-green { background: transparent; }
.gsc-tr-red   { background: rgba(239,68,68,.04); }
.gsc-tr-yellow{ background: rgba(245,158,11,.04); }

.gsc-td-fecha { white-space: nowrap; }
.gsc-td-paises { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gsc-td-num { font-weight: 700; text-align: center; }
.gsc-td-error { max-width: 120px; }
.gsc-green { color: #22c55e; }
.gsc-blue  { color: #3b82f6; }
.gsc-red   { color: #ef4444; }

.gsc-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}
.gsc-badge-green  { background: rgba(34,197,94,.12);  color: #22c55e; }
.gsc-badge-red    { background: rgba(239,68,68,.12);  color: #ef4444; }
.gsc-badge-yellow { background: rgba(245,158,11,.12); color: #f59e0b; }
.gsc-badge-blue   { background: rgba(59,130,246,.12); color: #3b82f6; }
.gsc-badge-gray   { background: var(--bg-input); color: var(--text-soft); }

.gsc-origen {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
}
.gsc-origen-auto   { background: rgba(139,92,246,.12); color: #8b5cf6; }
.gsc-origen-manual { background: rgba(245,158,11,.12); color: #f59e0b; }

/* Países */
.gsc-label-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.gsc-required-hint {
  font-size: 11px;
  color: #f59e0b;
  font-weight: 600;
}
.gsc-ok-hint {
  font-size: 11px;
  color: #22c55e;
  font-weight: 600;
}

/* Dropdown wrapper */
.gsc-dropdown-wrap {
  position: relative;
  width: 100%;
  max-width: 320px;
}
.gsc-dropdown-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: border-color .15s;
  min-height: 32px;
}
.gsc-dropdown-trigger:hover,
.gsc-dropdown-trigger-open { border-color: #3b82f6; }
.gsc-trigger-label { flex: 1; }
.gsc-dropdown-caret {
  font-size: 9px;
  color: var(--text-soft);
  flex-shrink: 0;
  transition: transform .15s;
}
.gsc-caret-open { transform: rotate(180deg); }

/* Panel */
.gsc-dropdown-list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 200;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 8px 28px rgba(0,0,0,.22);
  overflow: hidden;
}

/* Búsqueda */
.gsc-search-wrap {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
}
.gsc-search-icon { font-size: 11px; color: var(--text-soft); }
.gsc-search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 12px;
  color: var(--text-main);
}
.gsc-search-input::placeholder { color: var(--text-soft); }

.gsc-dropdown-scroll {
  max-height: 220px;
  overflow-y: auto;
}

/* Items */
.gsc-dropdown-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 14px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-main);
  transition: background .1s;
  user-select: none;
}
.gsc-dropdown-item:hover { background: var(--bg-input); }
.gsc-item-selected { color: var(--text-main); }
.gsc-dropdown-item-label { flex: 1; }
.gsc-globe-icon { font-size: 13px; color: var(--text-soft); }
.gsc-check-icon { font-size: 10px; color: #3b82f6; flex-shrink: 0; }
.gsc-dropdown-divider { height: 1px; background: var(--border); }
.gsc-no-results {
  padding: 12px 14px;
  font-size: 11px;
  color: var(--text-soft);
  text-align: center;
}
.gsc-check-input { display: none; }

/* Animación */
.gsc-drop-enter-active { transition: opacity .12s ease, transform .12s ease; }
.gsc-drop-leave-active { transition: opacity .08s ease; }
.gsc-drop-enter-from, .gsc-drop-leave-to { opacity: 0; transform: translateY(-4px); }

.gsc-error-chip {
  font-size: 10px;
  color: #ef4444;
  cursor: help;
  display: flex; align-items: center; gap: 3px;
}
</style>
