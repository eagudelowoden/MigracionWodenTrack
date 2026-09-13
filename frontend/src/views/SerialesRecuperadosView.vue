<template>
  <div class="vercel-root min-h-screen w-screen flex flex-col items-center transition-colors duration-200"
    :class="isDark ? 'dark' : ''">
    <div class="w-full max-w-3xl px-5 py-6 space-y-6">

      <!-- Top bar -->
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button @click="router.push('/marcacion')" class="v-icon-btn" aria-label="Volver">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div class="flex items-center gap-2">
            <div class="v-logo">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 19.5h20L12 2z" />
              </svg>
            </div>
            <div class="leading-tight">
              <h1 class="text-[15px] font-semibold tracking-tight v-fg">Seriales Recuperados</h1>
              <p class="text-[11px] v-muted">WFSM · Consulta</p>
            </div>
          </div>
        </div>
        <button @click="toggleTheme" class="v-icon-btn" aria-label="Tema">
          <svg v-if="isDark" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2">
            <circle cx="12" cy="12" r="5" />
            <path stroke-linecap="round"
              d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        </button>
      </header>

      <!-- Filtros -->
      <section class="v-card p-4">
        <div class="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 sm:items-end">
          <div class="flex flex-col gap-1.5">
            <label class="v-label">Desde</label>
            <input type="date" v-model="filtros.fecha" class="v-input" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="v-label">Hasta</label>
            <input type="date" v-model="filtros.fechaFin" class="v-input" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="v-label">Cédula cliente <span class="v-muted font-normal">(opcional)</span></label>
            <input type="text" v-model="filtros.documento" placeholder="Ej. 1035851539" @keyup.enter="consultar"
              class="v-input" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="v-label">Agente <span class="v-muted font-normal">(nombre o cédula)</span></label>
            <input type="text" v-model="filtros.agente" placeholder="Nombre o cédula del agente"
              @keyup.enter="consultar" class="v-input" />
          </div>
          <button @click="consultar" :disabled="loading || !hayFiltro" class="v-btn-primary"
            :title="hayFiltro ? '' : 'Escribe una cédula de cliente o un agente'">
            <span v-if="loading" class="v-spinner"></span>
            <template v-else>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="7" />
                <path stroke-linecap="round" d="M21 21l-4.3-4.3" />
              </svg>
              Consultar
            </template>
          </button>
        </div>

        <p class="v-pista">
          <strong>Cédula del cliente</strong> consulta la API directamente, sin importar el rango.
          <strong>Agente</strong> busca sobre los datos que el proceso nocturno ya guardó (último mes).
        </p>
      </section>

      <!-- Error -->
      <transition name="fade">
        <div v-if="error" class="v-alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path stroke-linecap="round" d="M12 8v4M12 16h.01" />
          </svg>
          <span>{{ error }}</span>
        </div>
      </transition>

      <!-- Resultados -->
      <section v-if="registros !== null && !loading" class="space-y-3">
        <!-- Barra resumen + búsqueda -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-baseline gap-2">
            <span class="text-[22px] font-semibold tracking-tight v-fg tabular-nums">{{ totalFiltrado }}</span>
            <span class="text-[12px] v-muted">
              registro{{ totalFiltrado !== 1 ? 's' : '' }}<template v-if="busquedaLocal"> · filtrado</template>
            </span>

            <!-- Diagnóstico: de dónde salieron los datos y, en modo directo,
                 cuántos devolvió WFS antes de filtrar aquí. Si total_api no
                 baja al enviar una cédula, WFS está ignorando el parámetro. -->
            <span
              v-if="infoConsulta && infoConsulta.modo === 'bd' && infoConsulta.dias_con_cache < infoConsulta.dias_rango"
              class="v-modo is-tope"
              title="El cron nocturno aun no ha traido esos dias. Busca por cedula de cliente para consultar la API directamente.">
              {{ infoConsulta.dias_rango - infoConsulta.dias_con_cache }} de {{ infoConsulta.dias_rango }} dias sin datos
            </span>
            <span v-if="infoConsulta?.truncado" class="v-modo is-tope"
              title="Hay mas resultados. Acota el rango de fechas o filtra por cedula.">
              Tope alcanzado
            </span>
            <span v-if="infoConsulta" class="v-modo" :class="infoConsulta.modo === 'directo' ? 'is-directo' : 'is-bd'">
              {{ infoConsulta.modo === 'directo' ? 'WFS directo' : (infoConsulta.sincronizado ? 'DB' : 'DB') }}
              <template v-if="infoConsulta.total_api !== null"> · API devolvió {{ infoConsulta.total_api }}</template>
            </span>
          </div>
          <div class="v-search">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="7" />
              <path stroke-linecap="round" d="M21 21l-4.3-4.3" />
            </svg>
            <input v-model="busquedaLocal" type="text" placeholder="Buscar en resultados..." />
          </div>
        </div>

        <!-- Vacío -->
        <div v-if="totalFiltrado === 0" class="v-card v-empty">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p>No se encontraron seriales recuperados.</p>

          <!-- Sugerencia del backend: aparece cuando la búsqueda salió vacía y
               no se usó cédula de cliente, que es el único filtro que la API
               resuelve en su servidor (y el que hace viables los 15 días). -->
          <p v-if=infoConsulta?.sugerencia class="v-sugerencia">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9" />
              <path stroke-linecap="round" d="M12 16v-5M12 8h.01" />
            </svg>
            <span>{{ infoConsulta.sugerencia }}</span>
          </p>
        </div>

        <!-- Lista -->
        <div v-else class="space-y-2.5">
          <article v-for="(item, idx) in visibles" :key="idx" class="v-card v-row">
            <!-- Cabecera fila -->
            <div class="flex items-center justify-between gap-3 mb-3">
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="v-badge" :class="estatusClass(item.estatus)">
                  <span class="v-dot"></span>{{ item.estatus || 'N/D' }}
                </span>
                <code class="text-[12.5px] font-medium v-fg truncate">{{ item.serial || item.serial_confirmado || '—'
                }}</code>
              </div>
              <a v-if="linkComprobante(item)" :href="linkComprobante(item)" target="_blank" rel="noopener"
                class="v-link-btn shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Comprobante
              </a>
            </div>
            <!-- Detalle -->
            <dl class="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-2.5">
              <div v-for="campo in CAMPOS_VISIBLES" :key="campo.key" class="min-w-0">
                <dt class="v-dt">{{ campo.label }}</dt>
                <dd class="v-dd truncate">{{ item[campo.key] || '—' }}</dd>
              </div>
            </dl>
          </article>

          <button v-if="visibles.length < totalFiltrado" @click="limite += 50" class="v-btn-ghost">
            Mostrar más
            <span class="v-muted">· {{ totalFiltrado - visibles.length }} restantes</span>
          </button>
        </div>
      </section>

      <!-- Estado inicial -->
      <section v-if="registros === null && !loading && !error" class="v-card v-empty">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" d="M4 5v14M8 5v14M12 5v14M16 5v14M20 5v14" />
        </svg>
        <p>Selecciona una fecha y presiona <strong class="v-fg">Consultar</strong>.</p>
      </section>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { apiFetch } from '@/utils/apiFetch.js';

const router = useRouter();
const API_URL = import.meta.env.VITE_API_URL;

const isDark = ref(localStorage.getItem('theme') === 'dark');
const toggleTheme = () => {
  isDark.value = !isDark.value;
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

const hoy = () => new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().split('T')[0];

const filtros = reactive({ fecha: hoy(), fechaFin: hoy(), documento: '', agente: '' });
const loading = ref(false);
const error = ref('');
const registros = ref(null);
const busquedaLocal = ref('');
// Diagnóstico devuelto por el backend: 'directo' (API WFS) o 'bd' (caché).
const infoConsulta = ref(null);
const limite = ref(50);

const CAMPOS_VISIBLES = [
  { key: 'cedula_cliente', label: 'Cédula cliente' },
  { key: 'agente_campo', label: 'Agente' },
  { key: 'documento_identidad', label: 'Cédula agente' },
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

const ultimaConsulta = ref(0);
const COOLDOWN_MS = 3000;

const consultar = async () => {
  if (loading.value) return; // ya hay una consulta en curso
  const ahora = Date.now();
  if (ahora - ultimaConsulta.value < COOLDOWN_MS) {
    error.value = 'Espera un momento antes de volver a consultar.';
    return;
  }
  ultimaConsulta.value = ahora;

  error.value = '';
  loading.value = true;
  limite.value = 50;
  try {
    // Sin filtro no se consulta: un rango entero son decenas de miles de filas
    // que nadie revisa a mano, y el backend lo rechaza igual.
    if (!filtros.documento.trim() && !filtros.agente.trim()) {
      error.value = 'Aplica un filtro para consultar: cédula del cliente o nombre/cédula del agente.';
      registros.value = null;
      infoConsulta.value = null;
      loading.value = false;
      return;
    }

    const body = { fecha: filtros.fecha, fecha_fin: filtros.fechaFin || filtros.fecha };
    if (filtros.documento.trim()) body.documento = filtros.documento.trim();
    if (filtros.agente.trim()) body.agente = filtros.agente.trim();

    const res = await apiFetch(`${API_URL}/wfsm/seriales-recuperados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      error.value = data?.error || 'Error al consultar la API externa.';
      registros.value = null;
      infoConsulta.value = null;
      return;
    }
    registros.value = data.registros ?? [];
    infoConsulta.value = { modo: data.modo, total_api: data.total_api, total: data.total, sugerencia: data.sugerencia, truncado: data.truncado, dias_rango: data.dias_rango, dias_con_cache: data.dias_con_cache };
  } catch {
    error.value = 'Error de conexión con el servidor.';
    registros.value = null;
  } finally {
    loading.value = false;
  }
};

// Una de las dos búsquedas debe estar presente (ver getSerialesRecuperados).
const hayFiltro = computed(() => !!filtros.documento.trim() || !!filtros.agente.trim());

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

watch(busquedaLocal, () => { limite.value = 50; });

const linkComprobante = (item) => item.comprobante_cliente || item.imagen_comprobante || '';

const estatusClass = (estatus) => {
  const s = String(estatus).toLowerCase();
  if (s.includes('terminado') || s.includes('recuperado') || s.includes('entregado')) return 'is-ok';
  if (s.includes('pendiente') || s.includes('proceso')) return 'is-warn';
  if (s.includes('cancel') || s.includes('fallid')) return 'is-err';
  return 'is-neutral';
};
</script>

<style scoped>
/* ── Paleta estilo Vercel (light / dark via .dark) ─────────────────────────── */
.vercel-root {
  --bg: #fafafa;
  --card: #ffffff;
  --border: #eaeaea;
  --border-strong: #d4d4d4;
  --fg: #0a0a0a;
  --muted: #666666;
  --accent: #0a0a0a;
  --accent-fg: #ffffff;
  --hover: #f5f5f5;
  background: var(--bg);
  color: var(--fg);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.vercel-root.dark {
  --bg: #000000;
  --card: #0a0a0a;
  --border: #1f1f1f;
  --border-strong: #2e2e2e;
  --fg: #ededed;
  --muted: #8f8f8f;
  --accent: #ffffff;
  --accent-fg: #0a0a0a;
  --hover: #161616;
}

.v-fg {
  color: var(--fg);
}

.v-muted {
  color: var(--muted);
}

.v-logo {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: var(--accent-fg);
}

/* Botón icono */
.v-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--fg);
  transition: all .15s ease;
}

.v-icon-btn:hover {
  border-color: var(--border-strong);
  background: var(--hover);
}

.v-icon-btn:active {
  transform: scale(.95);
}

/* Card */
.v-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.v-row {
  padding: 14px 16px;
  transition: border-color .15s ease;
}

.v-row:hover {
  border-color: var(--border-strong);
}

/* Labels e inputs */
.v-sugerencia {
  display: flex;
  align-items: flex-start;
  gap: .5rem;
  max-width: 30rem;
  margin-top: .75rem;
  padding: .625rem .75rem;
  border-radius: .625rem;
  border: 1px solid rgb(37 99 235 / .25);
  background: rgb(37 99 235 / .08);
  color: #2563eb;
  font-size: 12px;
  line-height: 1.45;
  text-align: left;
}

.v-sugerencia svg {
  flex-shrink: 0;
  margin-top: .1rem;
}

.v-pista {
  margin-top: .75rem;
  font-size: 11px;
  line-height: 1.5;
  opacity: .65;
}

.v-pista strong {
  font-weight: 650;
  opacity: .9;
}

.v-modo {
  padding: .125rem .5rem;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
}

.v-modo.is-directo {
  background: rgb(217 119 6 / .15);
  color: #d97706;
}

.v-modo.is-tope {
  background: rgb(217 119 6 / .15);
  color: #b45309;
}

.v-modo.is-bd {
  background: rgb(37 99 235 / .15);
  color: #2563eb;
}

.v-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--fg);
}

.v-input {
  height: 36px;
  padding: 0 11px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--fg);
  font-size: 13px;
  outline: none;
  transition: border-color .15s ease, box-shadow .15s ease;
  width: 100%;
}

.dark .v-input {
  color-scheme: dark;
}

.v-input::placeholder {
  color: var(--muted);
}

.v-input:focus {
  border-color: var(--fg);
  box-shadow: 0 0 0 1px var(--fg);
}

/* Botón primario (negro/blanco) */
.v-btn-primary {
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  background: var(--accent);
  color: var(--accent-fg);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  border: 1px solid var(--accent);
  transition: opacity .15s ease;
}

.v-btn-primary:hover:not(:disabled) {
  opacity: .85;
}

.v-btn-primary:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.v-btn-ghost {
  width: 100%;
  height: 40px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--fg);
  font-size: 13px;
  font-weight: 500;
  transition: all .15s ease;
}

.v-btn-ghost:hover {
  background: var(--hover);
  border-color: var(--border-strong);
}

/* Search */
.v-search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 11px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--muted);
  width: 100%;
  max-width: 260px;
  transition: border-color .15s ease;
}

.v-search:focus-within {
  border-color: var(--fg);
}

.v-search input {
  background: transparent;
  border: none;
  outline: none;
  width: 100%;
  font-size: 12.5px;
  color: var(--fg);
}

.v-search input::placeholder {
  color: var(--muted);
}

/* Link comprobante */
.v-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--fg);
  font-size: 11.5px;
  font-weight: 500;
  transition: all .15s ease;
}

.v-link-btn:hover {
  background: var(--hover);
  border-color: var(--border-strong);
}

/* Definiciones */
.v-dt {
  font-size: 10.5px;
  color: var(--muted);
  margin-bottom: 1px;
  letter-spacing: .01em;
}

.v-dd {
  font-size: 12.5px;
  color: var(--fg);
  font-weight: 450;
}

/* Badge estatus */
.v-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 9px 0 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--fg);
}

.v-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--muted);
}

.v-badge.is-ok .v-dot {
  background: #10b981;
}

.v-badge.is-warn .v-dot {
  background: #f59e0b;
}

.v-badge.is-err .v-dot {
  background: #ef4444;
}

.v-badge.is-neutral .v-dot {
  background: #8f8f8f;
}

/* Alert */
.v-alert {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1px solid rgba(239, 68, 68, .3);
  background: rgba(239, 68, 68, .08);
  color: #ef4444;
  font-size: 12.5px;
  font-weight: 450;
}

/* Empty */
.v-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 20px;
  text-align: center;
  color: var(--muted);
}

.v-empty svg {
  opacity: .35;
}

.v-empty p {
  font-size: 12.5px;
}

/* Spinner */
.v-spinner {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--accent-fg) 35%, transparent);
  border-top-color: var(--accent-fg);
  animation: v-spin .6s linear infinite;
}

@keyframes v-spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
