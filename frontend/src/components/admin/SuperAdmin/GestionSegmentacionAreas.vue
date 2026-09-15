<template>
  <div class="gsa-root" :class="isDark ? 'gsa-dark' : 'gsa-light'">

    <!-- ─── HEADER ─────────────────────────────────────────────────── -->
    <header class="gsa-header">
      <div class="gsa-header-left">
        <div class="gsa-header-icon">
          <i class="fas fa-diagram-project"></i>
        </div>
        <div>
          <p class="gsa-eyebrow">Estructura Organizacional</p>
          <h2 class="gsa-title">Segmentación de personas</h2>
        </div>
      </div>
    </header>

    <p class="gsa-intro">
      Asigna Segmento y Centro de Costo a cada persona. Esta asignación (tabla
      <code>segmentacion_areas</code>) es la que usa el Dashboard de Asistencia
      para agrupar — es independiente de los permisos y de "Organización".
    </p>

    <p v-if="mensaje" class="gsa-flash" :class="mensajeError ? 'gsa-flash-error' : 'gsa-flash-ok'">
      {{ mensaje }}
    </p>

    <div class="gsa-grid">

      <!-- ═══ MAESTROS: SEGMENTO + CENTRO DE COSTO (ambos nuevos, propios de esta vista) ═══ -->
      <div class="gsa-maestros-col">
        <section class="gsa-card gsa-card-narrow">
          <header class="gsa-section-head">
            <div class="gsa-section-head-left">
              <div class="gsa-section-icon">
                <i class="fas fa-layer-group"></i>
              </div>
              <div>
                <p class="gsa-section-title">Segmentos</p>
                <p class="gsa-section-sub">Maestro propio — crea los que falten</p>
              </div>
            </div>
            <span class="gsa-count-pill">{{ segmentos.length }}</span>
          </header>

          <div class="gsa-form">
            <div class="gsa-field">
              <label class="gsa-label">Nombre</label>
              <input v-model="nuevoSegmento.nombre" type="text" placeholder="Ej: Remanufactura"
                class="gsa-input" @keyup.enter="crearSegmento" />
            </div>
            <button @click="crearSegmento" :disabled="!nuevoSegmento.nombre.trim() || creandoSegmento"
              class="gsa-btn-primary">
              <i class="fas" :class="creandoSegmento ? 'fa-spinner fa-spin' : 'fa-plus'"></i>
              Crear segmento
            </button>
          </div>

          <div class="gsa-list custom-scroll">
            <div v-if="!segmentos.length" class="gsa-empty">
              <i class="fas fa-folder-open"></i>
              Sin segmentos todavía
            </div>
            <div v-for="s in segmentos" :key="s.id" class="gsa-cc-item">
              <span class="gsa-item-dot"></span>
              <div class="gsa-item-info">
                <div class="gsa-item-name">{{ s.nombre }}</div>
              </div>
              <button @click="eliminarSegmento(s)" type="button" class="gsa-item-delete" title="Eliminar">
                <i class="fas fa-trash-can"></i>
              </button>
            </div>
          </div>
        </section>

        <!-- ═══ CENTROS DE COSTO (maestro) ═══ -->
        <section class="gsa-card gsa-card-narrow">
          <header class="gsa-section-head">
            <div class="gsa-section-head-left">
              <div class="gsa-section-icon">
                <i class="fas fa-sitemap"></i>
              </div>
              <div>
                <p class="gsa-section-title">Centros de costo</p>
                <p class="gsa-section-sub">Maestro — crea los que falten</p>
              </div>
            </div>
            <span class="gsa-count-pill">{{ centrosCosto.length }}</span>
          </header>

          <div class="gsa-form">
            <div class="gsa-field">
              <label class="gsa-label">Nombre</label>
              <input v-model="nuevoCentro.nombre" type="text" placeholder="Ej: CC-Bogotá Planta"
                class="gsa-input" @keyup.enter="crearCentroCosto" />
            </div>
            <div class="gsa-field">
              <label class="gsa-label">Código (opcional)</label>
              <input v-model="nuevoCentro.codigo" type="text" placeholder="Ej: CC-001"
                class="gsa-input" @keyup.enter="crearCentroCosto" />
            </div>
            <button @click="crearCentroCosto" :disabled="!nuevoCentro.nombre.trim() || creandoCentro"
              class="gsa-btn-primary">
              <i class="fas" :class="creandoCentro ? 'fa-spinner fa-spin' : 'fa-plus'"></i>
              Crear centro de costo
            </button>
          </div>

          <div class="gsa-list custom-scroll">
            <div v-if="!centrosCosto.length" class="gsa-empty">
              <i class="fas fa-folder-open"></i>
              Sin centros de costo todavía
            </div>
            <div v-for="cc in centrosCosto" :key="cc.id" class="gsa-cc-item">
              <span class="gsa-item-dot"></span>
              <div class="gsa-item-info">
                <div class="gsa-item-name">{{ cc.nombre }}</div>
                <div v-if="cc.codigo" class="gsa-item-meta">{{ cc.codigo }}</div>
              </div>
              <button @click="eliminarCentroCosto(cc)" type="button" class="gsa-item-delete" title="Eliminar">
                <i class="fas fa-trash-can"></i>
              </button>
            </div>
          </div>
        </section>
      </div>

      <!-- ═══ ASIGNACIÓN POR PERSONA ═══ -->
      <section class="gsa-card gsa-card-wide">
        <header class="gsa-section-head">
          <div class="gsa-section-head-left">
            <div class="gsa-section-icon">
              <i class="fas fa-users"></i>
            </div>
            <div>
              <p class="gsa-section-title">Personas</p>
              <p class="gsa-section-sub">Asigna segmento y centro de costo</p>
            </div>
          </div>
          <span class="gsa-count-pill">{{ total }}</span>
        </header>

        <div class="gsa-search-bar">
          <i class="fas fa-search gsa-search-icon"></i>
          <input v-model="search" type="text" placeholder="Buscar por nombre o cédula..."
            class="gsa-input gsa-input-search" @input="debouncedBuscar" />
        </div>

        <div class="gsa-table-wrap custom-scroll">
          <table class="gsa-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cédula</th>
                <th>Depto. (Odoo)</th>
                <th>Segmento</th>
                <th>Centro de costo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in personas" :key="p.id_odoo">
                <td class="gsa-td-nombre">{{ p.nombre }}</td>
                <td>{{ p.identificacion || '—' }}</td>
                <td class="gsa-td-muted">{{ p.departamento || '—' }}</td>
                <td>
                  <select class="gsa-select-cell" :value="p.segmento_id || ''"
                    @change="asignar(p, 'segmento_id', $event.target.value)">
                    <option value="">— Sin segmento —</option>
                    <option v-for="s in segmentos" :key="s.id" :value="s.id">{{ s.nombre }}</option>
                  </select>
                </td>
                <td>
                  <select class="gsa-select-cell" :value="p.centro_costo_id || ''"
                    @change="asignar(p, 'centro_costo_id', $event.target.value)">
                    <option value="">— Sin centro de costo —</option>
                    <option v-for="cc in centrosCosto" :key="cc.id" :value="cc.id">{{ cc.nombre }}</option>
                  </select>
                </td>
              </tr>
              <tr v-if="!personas.length">
                <td colspan="5" class="gsa-empty-row">
                  {{ cargando ? 'Cargando…' : 'Sin resultados.' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="gsa-pager">
          <button @click="page > 1 && (page--, cargarPersonas())" :disabled="page <= 1" class="gsa-btn-secondary">
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="gsa-pager-text">Página {{ page }} de {{ totalPaginas }}</span>
          <button @click="page < totalPaginas && (page++, cargarPersonas())" :disabled="page >= totalPaginas"
            class="gsa-btn-secondary">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const props = defineProps({
  isDark: Boolean,
});

const API = (import.meta.env.VITE_API_URL || '').replace('/usuarios', '') + '/estructura-organizacional';

const centrosCosto = ref([]);
const segmentos = ref([]);
const nuevoCentro = ref({ nombre: '', codigo: '' });
const creandoCentro = ref(false);
const nuevoSegmento = ref({ nombre: '' });
const creandoSegmento = ref(false);

const personas = ref([]);
const total = ref(0);
const page = ref(1);
const limit = 20;
const search = ref('');
const cargando = ref(false);

const mensaje = ref('');
const mensajeError = ref(false);
const flash = (msg, error = false) => {
  mensaje.value = msg;
  mensajeError.value = error;
  setTimeout(() => (mensaje.value = ''), 5000);
};

const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / limit)));

async function cargarCentrosCosto() {
  const { data } = await axios.get(`${API}/centros-costo`);
  centrosCosto.value = data || [];
}

async function cargarSegmentos() {
  const { data } = await axios.get(`${API}/segmentos`);
  segmentos.value = data || [];
}

async function crearCentroCosto() {
  if (!nuevoCentro.value.nombre.trim()) return;
  creandoCentro.value = true;
  try {
    await axios.post(`${API}/centros-costo`, {
      nombre: nuevoCentro.value.nombre.trim(),
      codigo: nuevoCentro.value.codigo.trim() || undefined,
    });
    nuevoCentro.value = { nombre: '', codigo: '' };
    await cargarCentrosCosto();
  } finally {
    creandoCentro.value = false;
  }
}

async function crearSegmento() {
  if (!nuevoSegmento.value.nombre.trim()) return;
  creandoSegmento.value = true;
  try {
    await axios.post(`${API}/segmentos`, { nombre: nuevoSegmento.value.nombre.trim() });
    nuevoSegmento.value = { nombre: '' };
    await cargarSegmentos();
  } finally {
    creandoSegmento.value = false;
  }
}

async function eliminarSegmento(s) {
  if (!confirm(`¿Eliminar el segmento "${s.nombre}"? Esta acción no se puede deshacer.`)) return;
  try {
    await axios.delete(`${API}/segmentos/${s.id}`);
    await cargarSegmentos();
    flash('Segmento eliminado.');
  } catch (e) {
    flash(e?.response?.data?.message || 'No se pudo eliminar el segmento.', true);
  }
}

async function eliminarCentroCosto(cc) {
  if (!confirm(`¿Eliminar el centro de costo "${cc.nombre}"? Esta acción no se puede deshacer.`)) return;
  try {
    await axios.delete(`${API}/centros-costo/${cc.id}`);
    await cargarCentrosCosto();
    flash('Centro de costo eliminado.');
  } catch (e) {
    flash(e?.response?.data?.message || 'No se pudo eliminar el centro de costo.', true);
  }
}

async function cargarPersonas() {
  cargando.value = true;
  try {
    const { data } = await axios.get(`${API}/asignaciones`, {
      params: { search: search.value || undefined, page: page.value, limit },
    });
    personas.value = data.filas || [];
    total.value = data.total || 0;
  } finally {
    cargando.value = false;
  }
}

let timerBusqueda = null;
function debouncedBuscar() {
  clearTimeout(timerBusqueda);
  timerBusqueda = setTimeout(() => {
    page.value = 1;
    cargarPersonas();
  }, 400);
}

async function asignar(persona, campo, valorRaw) {
  const valor = valorRaw ? Number(valorRaw) : null;
  persona[campo] = valor; // feedback optimista en la fila
  await axios.put(`${API}/asignaciones/${persona.id_odoo}`, { [campo]: valor });
}

onMounted(async () => {
  await Promise.all([cargarCentrosCosto(), cargarSegmentos(), cargarPersonas()]);
});
</script>

<style scoped>
/* Reutiliza la misma paleta zinc que GestionEstructura.vue (.ge-*) para
   coherencia visual, con prefijo .gsa- propio de este componente. */
.gsa-light {
  --bg: #ffffff;
  --bg-soft: #fafafa;
  --bg-hover: #f4f4f5;
  --border: #ececec;
  --border-strong: #e2e2e2;
  --text: #09090b;
  --text-muted: #52525b;
  --text-soft: #a1a1aa;
  --brand: #3B82F6;
  --brand-soft: rgba(59, 130, 246, 0.08);
  --brand-text: #2563EB;
  --btn-bg: #2563eb;
  --btn-bg-hover: #1d4ed8;
  --btn-text: #ffffff;
}

.gsa-dark {
  --bg: #161B26;
  --bg-soft: #0B0F19;
  --bg-hover: #1F2533;
  --border: #222938;
  --border-strong: #2A3245;
  --text: #fafafa;
  --text-muted: #B0B7C3;
  --text-soft: #888888;
  --brand: #3B82F6;
  --brand-soft: rgba(59, 130, 246, 0.10);
  --brand-text: #60A5FA;
  --btn-bg: #3b82f6;
  --btn-bg-hover: #2563eb;
  --btn-text: #ffffff;
}

.gsa-root {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  color: var(--text);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.gsa-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.gsa-header-left {
  display: flex;
  align-items: center;
  gap: 9px;
}

.gsa-header-icon {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  background: var(--brand-soft);
  color: var(--brand-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  flex-shrink: 0;
}

.gsa-eyebrow {
  font-size: 9.5px;
  font-weight: 500;
  color: var(--text-soft);
  letter-spacing: 0.02em;
  margin-bottom: 1px;
  line-height: 1;
}

.gsa-title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.012em;
  color: var(--text);
  line-height: 1.15;
}

.gsa-intro {
  font-size: 10.5px;
  color: var(--text-soft);
  line-height: 1.5;
}

.gsa-intro code {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 10px;
}

.gsa-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  flex: 1;
  min-height: 0;
}

@media (min-width: 1100px) {
  .gsa-grid {
    grid-template-columns: 280px 1fr;
  }
}

.gsa-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 440px;
}

/* Columna con los dos maestros (Segmentos + Centros de costo) apilados: cada
   tarjeta se achica a la mitad para que las dos quepan sin quedar gigantes. */
.gsa-maestros-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.gsa-maestros-col .gsa-card {
  min-height: 260px;
}

.gsa-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-soft);
  flex-shrink: 0;
}

.gsa-section-head-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.gsa-section-icon {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: var(--brand-soft);
  color: var(--brand-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  flex-shrink: 0;
}

.gsa-section-title {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.15;
}

.gsa-section-sub {
  font-size: 9.5px;
  color: var(--text-soft);
  margin-top: 1px;
}

.gsa-count-pill {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg);
  border: 1px solid var(--border);
  padding: 2px 8px;
  border-radius: 999px;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.gsa-form {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gsa-field {
  display: flex;
  flex-direction: column;
}

.gsa-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted);
  margin-bottom: 5px;
}

.gsa-input {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 7px 10px;
  font-size: 11.5px;
  color: var(--text);
  outline: none;
  font-family: inherit;
  transition: all 0.12s ease;
}

.gsa-input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.gsa-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px 14px;
  border-radius: 5px;
  background: var(--btn-bg);
  color: var(--btn-text);
  border: none;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  font-family: inherit;
  transition: all 0.12s ease;
}

.gsa-btn-primary:hover:not(:disabled) {
  background: var(--btn-bg-hover);
}

.gsa-btn-primary:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.gsa-btn-secondary {
  padding: 6px 10px;
  border-radius: 5px;
  background: var(--bg);
  color: var(--text-muted);
  border: 1px solid var(--border);
  cursor: pointer;
  font-size: 11px;
  font-family: inherit;
  transition: all 0.12s ease;
}

.gsa-btn-secondary:hover:not(:disabled) {
  background: var(--bg-soft);
  color: var(--text);
}

.gsa-btn-secondary:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.gsa-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.gsa-cc-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 9px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 6px;
}

.gsa-item-delete {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 5px;
  background: transparent;
  border: none;
  color: var(--text-soft);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10.5px;
  transition: all 0.12s ease;
}

.gsa-item-delete:hover {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.gsa-flash {
  font-size: 11px;
  font-weight: 500;
  padding: 7px 11px;
  border-radius: 6px;
  border: 1px solid;
}

.gsa-flash-ok {
  color: #15803d;
  background: rgba(34, 197, 94, 0.08);
  border-color: rgba(34, 197, 94, 0.25);
}

.gsa-flash-error {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.08);
  border-color: rgba(220, 38, 38, 0.25);
}

.gsa-item-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand);
  flex-shrink: 0;
  box-shadow: 0 0 0 2.5px var(--brand-soft);
}

.gsa-item-info {
  flex: 1;
  min-width: 0;
}

.gsa-item-name {
  font-size: 11px;
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gsa-item-meta {
  font-size: 9.5px;
  color: var(--text-soft);
  margin-top: 1px;
}

.gsa-empty, .gsa-empty-row {
  text-align: center;
  padding: 30px 12px;
  color: var(--text-soft);
  font-size: 11px;
}

.gsa-empty i {
  display: block;
  font-size: 18px;
  margin-bottom: 6px;
  opacity: 0.5;
}

.gsa-search-bar {
  position: relative;
  padding: 10px 12px 0;
  flex-shrink: 0;
}

.gsa-search-icon {
  position: absolute;
  left: 22px;
  top: 50%;
  transform: translateY(calc(-50% + 5px));
  font-size: 10px;
  color: var(--text-soft);
  pointer-events: none;
}

.gsa-input-search {
  padding-left: 28px;
}

.gsa-table-wrap {
  flex: 1;
  overflow: auto;
  padding: 10px 12px;
}

.gsa-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.gsa-table th {
  text-align: left;
  padding: 6px 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--text-soft);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--bg);
}

.gsa-table td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.gsa-td-nombre {
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
}

.gsa-td-muted {
  color: var(--text-soft);
  font-size: 10.5px;
}

.gsa-select-cell {
  width: 100%;
  min-width: 140px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 5px 8px;
  font-size: 10.5px;
  color: var(--text);
  cursor: pointer;
  outline: none;
  font-family: inherit;
}

.gsa-select-cell:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.gsa-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 8px 12px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.gsa-pager-text {
  font-size: 10.5px;
  color: var(--text-muted);
}

.custom-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scroll::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 999px;
}
</style>
