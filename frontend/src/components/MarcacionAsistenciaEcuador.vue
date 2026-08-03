<template>
  <div class="rounded-2xl border overflow-hidden transition-all"
    :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200 shadow-sm'">

    <!-- Header -->
    <div class="flex items-center gap-2.5 px-4 py-3 border-b"
      :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
      <div class="w-7 h-7 rounded-lg flex items-center justify-center"
        :class="isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'">
        <i class="fas fa-location-dot text-emerald-500 text-xs"></i>
      </div>
      <div class="flex-1">
        <span class="block text-[11px] font-bold uppercase tracking-wider"
          :class="isDark ? 'text-white' : 'text-slate-800'">Asistencia en Soporte</span>
        <span class="block text-[9px] uppercase tracking-widest font-semibold text-emerald-500">Con ubicación GPS</span>
      </div>
      <!-- Estado hoy -->
      <div v-if="registrosHoy.length" class="text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded-full"
        :class="isDark ? 'bg-[#222938] text-slate-400' : 'bg-slate-100 text-slate-500'">
        {{ registrosHoy.length }} hoy
      </div>
    </div>

    <!-- Contenido -->
    <div class="px-4 py-3 space-y-3">

      <!-- Última marcación -->
      <div v-if="ultimaMarcacion"
        class="flex items-center gap-2 text-[11px] py-1.5 px-2.5 rounded-lg"
        :class="isDark ? 'bg-[#0B0F19]' : 'bg-slate-50'">
        <i :class="ultimaMarcacion.tipo === 'entrada' ? 'fas fa-arrow-right-to-bracket text-emerald-500' : 'fas fa-arrow-right-from-bracket text-rose-500'"
          class="text-[10px] w-3"></i>
        <span :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Última:
          <strong :class="ultimaMarcacion.tipo === 'entrada' ? 'text-emerald-500' : 'text-rose-500'">
            {{ ultimaMarcacion.tipo === 'entrada' ? 'Entrada' : 'Salida' }}
          </strong>
          a las {{ ultimaMarcacion.hora }}
        </span>
      </div>

      <!-- Botón principal -->
      <button @click="marcar" :disabled="cargando || obteniendo || !ubicacion && !sinGps"
        class="w-full h-12 rounded-xl text-[13px] font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        :class="tipoPendiente === 'entrada'
          ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
          : 'bg-rose-500 hover:bg-rose-600 text-white'">
        <template v-if="obteniendo">
          <i class="fas fa-location-crosshairs fa-beat text-xs"></i>
          Obteniendo ubicación…
        </template>
        <template v-else-if="cargando">
          <i class="fas fa-spinner fa-spin text-xs"></i>
          Registrando…
        </template>
        <template v-else>
          <i :class="tipoPendiente === 'entrada' ? 'fas fa-arrow-right-to-bracket' : 'fas fa-arrow-right-from-bracket'"
            class="text-xs"></i>
          Registrar {{ tipoPendiente === 'entrada' ? 'Entrada' : 'Salida' }}
        </template>
      </button>

      <!-- GPS status -->
      <div class="flex items-center gap-1.5 text-[10px]"
        :class="isDark ? 'text-slate-500' : 'text-slate-400'">
        <template v-if="ubicacion">
          <i class="fas fa-circle-check text-emerald-500 text-[9px]"></i>
          GPS: {{ ubicacion.latitud.toFixed(5) }}, {{ ubicacion.longitud.toFixed(5) }}
        </template>
        <template v-else-if="obteniendo">
          <i class="fas fa-circle-notch fa-spin text-[9px]"></i>
          Obteniendo coordenadas…
        </template>
        <template v-else-if="sinGps">
          <i class="fas fa-triangle-exclamation text-amber-500 text-[9px]"></i>
          Sin GPS — se registrará sin ubicación
        </template>
        <template v-else>
          <i class="fas fa-location-arrow text-[9px]"></i>
          GPS no solicitado
        </template>
      </div>

      <!-- Botón para obtener GPS si no se tiene -->
      <button v-if="!ubicacion && !obteniendo" @click="obtenerUbicacion"
        class="w-full h-8 rounded-lg text-[11px] font-semibold border transition-all"
        :class="isDark ? 'border-[#222938] text-slate-400 hover:text-white hover:border-slate-500' : 'border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700'">
        <i class="fas fa-location-crosshairs text-[9px] mr-1"></i>
        Obtener ubicación GPS
      </button>

      <!-- Mensaje resultado -->
      <transition name="fade">
        <div v-if="mensaje"
          class="text-[11px] font-medium text-center py-1.5 px-3 rounded-lg"
          :class="mensajeError
            ? (isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600')
            : (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')">
          {{ mensaje }}
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const props = defineProps({
  isDark: { type: Boolean, default: true },
  employee: { type: Object, required: true },
});

const API_URL = import.meta.env.VITE_API_URL;

const ultimaMarcacion = ref(null);
const registrosHoy = ref([]);
const tipoPendiente = ref('entrada');
const ubicacion = ref(null);
const obteniendo = ref(false);
const sinGps = ref(false);
const cargando = ref(false);
const mensaje = ref('');
const mensajeError = ref(false);

const flash = (msg, error = false) => {
  mensaje.value = msg;
  mensajeError.value = error;
  setTimeout(() => (mensaje.value = ''), 4000);
};

async function cargarEstado() {
  try {
    const { data } = await axios.get(
      `${API_URL}/marcacion-ecuador/estado/${props.employee.id_odoo}`,
    );
    ultimaMarcacion.value = data.ultima;
    tipoPendiente.value = data.tipo_pendiente;
    registrosHoy.value = data.registros_hoy ?? [];
  } catch (e) {
    console.error('Error cargando estado Ecuador:', e);
  }
}

async function obtenerUbicacion() {
  if (!navigator.geolocation) {
    sinGps.value = true;
    return false;
  }
  obteniendo.value = true;
  sinGps.value = false;

  // Precisión objetivo (metros) y tope de tiempo. En lugar de tomar la primera
  // lectura (casi siempre la menos precisa) o una cacheada, observamos varias
  // lecturas y nos quedamos con la MEJOR (menor 'accuracy').
  const PRECISION_OBJETIVO = 20; // m: si se alcanza esto o mejor, cortamos ya
  const TIEMPO_MAXIMO = 15000; // ms: tope de espera antes de usar la mejor lectura

  return new Promise((resolve) => {
    let mejor = null; // mejor posición acumulada (menor accuracy)
    let watchId = null;
    let timer = null;

    const finalizar = (ok) => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (timer !== null) clearTimeout(timer);
      obteniendo.value = false;
      if (ok && mejor) {
        ubicacion.value = {
          latitud: mejor.coords.latitude,
          longitud: mejor.coords.longitude,
          precision: mejor.coords.accuracy,
        };
        resolve(true);
      } else {
        sinGps.value = true;
        resolve(false);
      }
    };

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        // Nos quedamos con la lectura más precisa vista hasta ahora
        if (!mejor || pos.coords.accuracy < mejor.coords.accuracy) {
          mejor = pos;
        }
        // Si ya es lo bastante precisa, no seguimos esperando
        if (mejor.coords.accuracy <= PRECISION_OBJETIVO) {
          finalizar(true);
        }
      },
      () => {
        // Si falló pero ya teníamos alguna lectura válida, la usamos igual
        finalizar(!!mejor);
      },
      { enableHighAccuracy: true, timeout: TIEMPO_MAXIMO, maximumAge: 0 },
    );

    // Al vencer el tope de tiempo, usamos la mejor lectura acumulada
    timer = setTimeout(() => finalizar(!!mejor), TIEMPO_MAXIMO);
  });
}

async function marcar() {
  if (cargando.value) return;
  // Si aún no tenemos ubicación, intentar obtenerla primero
  if (!ubicacion.value && !sinGps.value) {
    await obtenerUbicacion();
  }
  cargando.value = true;
  try {
    const payload = {
      id_odoo: props.employee.id_odoo,
      cedula: props.employee.cedula || props.employee.identification || '',
      nombre: props.employee.name || props.employee.nombre || '',
      tipo: tipoPendiente.value,
      company: props.employee.company || 'Ecuador',
      latitud: ubicacion.value?.latitud ?? null,
      longitud: ubicacion.value?.longitud ?? null,
    };
    await axios.post(`${API_URL}/marcacion-ecuador/marcar`, payload);
    flash(
      `✓ ${tipoPendiente.value === 'entrada' ? 'Entrada' : 'Salida'} registrada${ubicacion.value ? ' con GPS' : ''}`,
    );
    await cargarEstado();
  } catch (e) {
    flash('Error al registrar la marcación', true);
  } finally {
    cargando.value = false;
  }
}

onMounted(async () => {
  await cargarEstado();
  // Solicitar GPS al montar para tenerlo listo
  obtenerUbicacion();
});
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
