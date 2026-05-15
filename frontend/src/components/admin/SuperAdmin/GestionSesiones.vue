<template>
  <div class="h-full flex flex-col gap-3 animate-fade-in">

    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-2.5 rounded-xl border shrink-0"
      :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <i class="fas fa-shield-halved text-emerald-500 text-xs"></i>
        </div>
        <div>
          <h2 class="text-[11px] font-semibold uppercase tracking-wider"
            :class="isDark ? 'text-white' : 'text-slate-700'">Sesiones Activas</h2>
          <p class="text-[9px] font-medium opacity-40 uppercase tracking-wide"
            :class="isDark ? 'text-white' : 'text-slate-500'">
            {{ sesiones.length }} usuario{{ sesiones.length !== 1 ? 's' : '' }} conectado{{ sesiones.length !== 1 ? 's' : '' }} ahora mismo
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border"
          :class="isDark ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50'">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span class="text-[9px] font-bold text-emerald-500 uppercase tracking-wide">En vivo</span>
        </div>
        <button @click="cargar" :disabled="cargando"
          class="h-7 w-7 rounded-lg border flex items-center justify-center transition-all"
          :class="isDark ? 'border-white/10 text-white/40 hover:bg-white/5' : 'border-slate-200 text-slate-400 hover:bg-slate-50'">
          <i class="fas fa-rotate text-[10px]" :class="cargando ? 'fa-spin' : ''"></i>
        </button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="flex-1 min-h-0 rounded-xl border overflow-hidden flex flex-col"
      :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">

      <div v-if="cargando" class="flex-1 flex items-center justify-center">
        <i class="fas fa-circle-notch fa-spin text-emerald-500 text-xl"></i>
      </div>

      <div v-else-if="!sesiones.length" class="flex-1 flex flex-col items-center justify-center gap-2">
        <i class="fas fa-users-slash text-4xl opacity-10" :class="isDark ? 'text-white' : 'text-slate-400'"></i>
        <p class="text-[11px] opacity-30" :class="isDark ? 'text-white' : 'text-slate-500'">No hay usuarios conectados</p>
      </div>

      <div v-else class="flex-1 overflow-auto">
        <table class="w-full text-[10px]">
          <thead>
            <tr class="sticky top-0" :class="isDark ? 'bg-slate-800' : 'bg-slate-50'">
              <th class="px-3 py-2.5 text-left font-semibold uppercase tracking-wide opacity-50">Usuario</th>
              <th class="px-3 py-2.5 text-left font-semibold uppercase tracking-wide opacity-50">Dispositivo</th>
              <th class="px-3 py-2.5 text-left font-semibold uppercase tracking-wide opacity-50">IP</th>
              <th class="px-3 py-2.5 text-left font-semibold uppercase tracking-wide opacity-50">Conectado</th>
              <th class="px-3 py-2.5 text-left font-semibold uppercase tracking-wide opacity-50">Última actividad</th>
              <th class="px-3 py-2.5 text-center font-semibold uppercase tracking-wide opacity-50">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sesiones" :key="s.id"
              class="border-t transition-colors"
              :class="isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'">
              <td class="px-3 py-2.5">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <i class="fas fa-user text-emerald-500 text-[9px]"></i>
                  </div>
                  <div>
                    <div class="font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">{{ s.nombre }}</div>
                    <div class="opacity-30 text-[9px]">#{{ s.id_odoo }}</div>
                  </div>
                </div>
              </td>
              <td class="px-3 py-2.5">
                <div class="flex items-center gap-1.5">
                  <i :class="deviceIcon(s.device_type)" class="opacity-50 text-[11px]"></i>
                  <span class="capitalize opacity-60">{{ s.device_type || 'Desconocido' }}</span>
                </div>
              </td>
              <td class="px-3 py-2.5">
                <code class="text-[9px] opacity-50 font-mono">{{ s.ip_address || '—' }}</code>
              </td>
              <td class="px-3 py-2.5 opacity-50">{{ formatFecha(s.connected_at) }}</td>
              <td class="px-3 py-2.5 opacity-50">{{ formatFecha(s.last_seen_at) }}</td>
              <td class="px-3 py-2.5 text-center">
                <button @click="kickSesion(s)"
                  :disabled="kickingId === s.id_odoo"
                  class="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 disabled:opacity-40">
                  <i v-if="kickingId === s.id_odoo" class="fas fa-circle-notch fa-spin"></i>
                  <span v-else><i class="fas fa-power-off mr-1"></i>Cerrar</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Info WebSocket -->
    <div class="px-3 py-2 rounded-xl border shrink-0"
      :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
      <p class="text-[9px] opacity-30" :class="isDark ? 'text-white' : 'text-slate-500'">
        <i class="fas fa-circle-info mr-1"></i>
        Las sesiones se actualizan en tiempo real vía WebSocket. "Cerrar sesión" desconecta al usuario inmediatamente y borra su token de sesión activa.
      </p>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

const props = defineProps({ isDark: Boolean });
const emit  = defineEmits(['success', 'error']);
const API_URL = import.meta.env.VITE_API_URL;
const WS_URL  = (API_URL || '').replace('/api', '') || 'http://localhost:3000';

const sesiones   = ref([]);
const cargando   = ref(false);
const kickingId  = ref(null);

let socket = null;

const cargar = async () => {
  cargando.value = true;
  try {
    const r = await fetch(`${API_URL}/superadmin/sesiones`);
    sesiones.value = await r.json();
  } catch { emit('error', 'Error cargando sesiones'); }
  finally { cargando.value = false; }
};

const kickSesion = async (s) => {
  if (!confirm(`¿Cerrar la sesión de ${s.nombre}?`)) return;
  kickingId.value = s.id_odoo;
  try {
    await fetch(`${API_URL}/superadmin/sesiones/kick/${s.id_odoo}`, { method: 'POST' });
    emit('success', `Sesión de ${s.nombre} cerrada`);
    await cargar();
  } catch { emit('error', 'Error al cerrar sesión'); }
  finally { kickingId.value = null; }
};

const deviceIcon = (type) => {
  if (type === 'mobile') return 'fas fa-mobile-screen-button';
  if (type === 'tablet') return 'fas fa-tablet-screen-button';
  return 'fas fa-desktop';
};

const formatFecha = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
};

onMounted(() => {
  cargar();
  socket = io(`${WS_URL}/interno`, { transports: ['websocket'] });
  socket.on('sessions-updated', () => cargar());
});

onUnmounted(() => {
  socket?.disconnect();
});
</script>
