import { ref, computed } from 'vue';

const API = `${import.meta.env.VITE_API_URL}/sync-cron`;

export function useSyncCron() {
  const config = ref(null);
  const historial = ref([]);
  const loading = ref(false);
  const ejecutando = ref(false);
  const error = ref(null);

  // ── Fetch config + estado ──────────────────────────────────────────────────
  const fetchConfig = async () => {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API}/config`);
      config.value = await res.json();
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  };

  // ── Guardar config ─────────────────────────────────────────────────────────
  const guardarConfig = async (dto) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      config.value = await res.json();
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  };

  // ── Ejecutar ahora ─────────────────────────────────────────────────────────
  const ejecutarAhora = async () => {
    ejecutando.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API}/ejecutar`, { method: 'POST' });
      const log = await res.json();
      await fetchConfig();
      await fetchHistorial();
      return log;
    } catch (e) {
      error.value = e.message;
    } finally {
      ejecutando.value = false;
    }
  };

  // ── Historial ──────────────────────────────────────────────────────────────
  const fetchHistorial = async () => {
    try {
      const res = await fetch(`${API}/historial?limit=15`);
      historial.value = await res.json();
    } catch (e) {
      console.error('Error cargando historial:', e);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const estadoColor = (estado) => {
    if (estado === 'success') return 'green';
    if (estado === 'error') return 'red';
    if (estado === 'parcial') return 'yellow';
    if (estado === 'running') return 'blue';
    return 'gray';
  };

  const formatDuracion = (seg) => {
    if (!seg && seg !== 0) return '—';
    if (seg < 60) return `${seg}s`;
    return `${Math.floor(seg / 60)}m ${seg % 60}s`;
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const paisesDisponibles = computed(() => {
    if (!config.value?.paises) return [];
    if (config.value.paises === 'TODOS') return ['TODOS'];
    return config.value.paises.split(',').map((p) => p.trim());
  });

  return {
    config,
    historial,
    loading,
    ejecutando,
    error,
    fetchConfig,
    guardarConfig,
    ejecutarAhora,
    fetchHistorial,
    estadoColor,
    formatDuracion,
    formatFecha,
    paisesDisponibles,
  };
}
