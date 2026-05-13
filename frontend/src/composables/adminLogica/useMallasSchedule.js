import { ref, computed } from 'vue';

const API_URL = () => import.meta.env.VITE_API_URL;

// Hora actual en Colombia (UTC-5)
function getColombiaDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
}

// Verifica si la fecha dada (Date) cae en alguno de los días configurados
function fechaPermitida(schedule, fecha = getColombiaDate()) {
  if (!schedule.enabled) return true; // sin control → siempre abierto
  if (schedule.mode === 'free') return true;

  if (schedule.mode === 'weekly') {
    const diasSemana = JSON.parse(schedule.weekly_days || '[]');
    return diasSemana.includes(fecha.getDay()); // 0=Dom, 1=Lun...
  }

  if (schedule.mode === 'monthly') {
    const diasMes = JSON.parse(schedule.monthly_days || '[]');
    return diasMes.includes(fecha.getDate()); // 1-31
  }

  return false;
}

export function useMallasSchedule() {
  const schedule = ref(null);   // null = aún no cargado
  const cargando = ref(false);

  const cargarSchedule = async () => {
    cargando.value = true;
    try {
      const r = await fetch(`${API_URL()}/sistema-config`);
      const data = await r.json();
      schedule.value = {
        enabled:      data.mallas_schedule_enabled === 'true',
        mode:         data.mallas_schedule_mode || 'free',
        weekly_days:  data.mallas_schedule_weekly_days || '[]',
        monthly_days: data.mallas_schedule_monthly_days || '[]',
      };
    } catch {
      schedule.value = { enabled: false, mode: 'free', weekly_days: '[]', monthly_days: '[]' };
    } finally {
      cargando.value = false;
    }
  };

  const carguePermitido = computed(() => {
    if (!schedule.value) return true; // mientras carga, no bloquear
    return fechaPermitida(schedule.value);
  });

  const proximaFechaHabilitada = computed(() => {
    if (!schedule.value || !schedule.value.enabled) return null;
    if (schedule.value.mode === 'free') return null;

    const hoy = getColombiaDate();
    for (let i = 1; i <= 60; i++) {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() + i);
      if (fechaPermitida(schedule.value, d)) {
        return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Bogota' });
      }
    }
    return null;
  });

  return { schedule, cargando, carguePermitido, proximaFechaHabilitada, cargarSchedule };
}
