import { ref, computed } from 'vue';

function getColombiaDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
}

function toColombiaDateStr(date) {
  const d = new Date(date.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fechaPermitida(schedule, fecha = getColombiaDate()) {
  if (!schedule.enabled) return true;
  if (schedule.mode === 'free') return true;

  if (schedule.mode === 'weekly') {
    const dias = JSON.parse(schedule.weekly_days || '[]');
    return dias.includes(fecha.getDay());
  }

  if (schedule.mode === 'monthly') {
    const dias = JSON.parse(schedule.monthly_days || '[]');
    return dias.includes(fecha.getDate());
  }

  if (schedule.mode === 'specific') {
    const fechas = JSON.parse(schedule.specific_dates || '[]');
    const str = toColombiaDateStr(fecha);
    return fechas.includes(str);
  }

  return false;
}

export function useMallasSchedule() {
  const schedule = ref(null);
  const cargando = ref(false);

  const cargarSchedule = async () => {
    cargando.value = true;
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const r = await fetch(`${API_URL}/sistema-config`);
      const data = await r.json();
      schedule.value = {
        enabled:        data.mallas_schedule_enabled === 'true',
        mode:           data.mallas_schedule_mode || 'free',
        weekly_days:    data.mallas_schedule_weekly_days || '[]',
        monthly_days:   data.mallas_schedule_monthly_days || '[]',
        specific_dates: data.mallas_schedule_specific_dates || '[]',
      };
    } catch {
      schedule.value = { enabled: false, mode: 'free', weekly_days: '[]', monthly_days: '[]', specific_dates: '[]' };
    } finally {
      cargando.value = false;
    }
  };

  const carguePermitido = computed(() => {
    if (!schedule.value) return true;
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
