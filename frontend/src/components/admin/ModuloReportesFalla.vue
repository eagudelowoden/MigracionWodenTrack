<template>
  <div class="p-4 space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-sm font-black uppercase tracking-widest" :class="isDark ? 'text-white' : 'text-slate-800'">
          Reportes de Falla — App Móvil
        </h2>
        <p class="text-[10px] font-medium mt-0.5" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Reportes enviados por usuarios desde WodenTrack APK
        </p>
      </div>
      <button @click="cargar"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all"
        :class="isDark ? 'border-white/10 text-slate-300 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'">
        <i class="fas fa-rotate-right text-[9px]" :class="{ 'fa-spin': cargando }"></i>
        Actualizar
      </button>
    </div>

    <!-- Estadísticas rápidas -->
    <div class="grid grid-cols-3 gap-3">
      <div class="rounded-xl border px-4 py-3 text-center"
        :class="isDark ? 'bg-white/3 border-white/8' : 'bg-white border-slate-200 shadow-sm'">
        <p class="text-xl font-black" :class="isDark ? 'text-white' : 'text-slate-800'">{{ reportes.length }}</p>
        <p class="text-[9px] font-bold uppercase tracking-widest opacity-50 mt-0.5">Total</p>
      </div>
      <div class="rounded-xl border px-4 py-3 text-center"
        :class="isDark ? 'bg-white/3 border-white/8' : 'bg-white border-slate-200 shadow-sm'">
        <p class="text-xl font-black text-red-400">{{ pendientes }}</p>
        <p class="text-[9px] font-bold uppercase tracking-widest opacity-50 mt-0.5">Pendientes</p>
      </div>
      <div class="rounded-xl border px-4 py-3 text-center"
        :class="isDark ? 'bg-white/3 border-white/8' : 'bg-white border-slate-200 shadow-sm'">
        <p class="text-xl font-black text-emerald-400">{{ resueltos }}</p>
        <p class="text-[9px] font-bold uppercase tracking-widest opacity-50 mt-0.5">Resueltos</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="cargando" class="flex items-center justify-center py-12 gap-2"
      :class="isDark ? 'text-slate-400' : 'text-slate-500'">
      <i class="fas fa-circle-notch fa-spin text-[#ff8f00]"></i>
      <span class="text-[11px] font-bold uppercase">Cargando reportes...</span>
    </div>

    <!-- Sin reportes -->
    <div v-else-if="!reportes.length"
      class="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border"
      :class="isDark ? 'border-white/8 bg-white/2' : 'border-slate-200 bg-slate-50'">
      <i class="fas fa-bug text-2xl opacity-20" :class="isDark ? 'text-white' : 'text-slate-400'"></i>
      <p class="text-[11px] font-bold uppercase tracking-widest opacity-40"
        :class="isDark ? 'text-slate-300' : 'text-slate-500'">
        No hay reportes de falla
      </p>
    </div>

    <!-- Lista de reportes -->
    <div v-else class="space-y-3">
      <div v-for="r in reportes" :key="r.id"
        class="rounded-xl border p-4 transition-all"
        :class="[
          r.resuelto
            ? (isDark ? 'border-emerald-500/15 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50')
            : (isDark ? 'border-red-500/15 bg-red-500/5' : 'border-red-100 bg-red-50')
        ]">

        <!-- Encabezado del reporte -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] font-black uppercase tracking-widest"
                :class="isDark ? 'text-white' : 'text-slate-800'">
                {{ r.nombre }}
              </span>
              <span class="text-[9px] font-bold px-2 py-0.5 rounded-full"
                :class="r.resuelto
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : 'bg-red-500/15 text-red-400'">
                {{ r.resuelto ? '✓ Resuelto' : 'Pendiente' }}
              </span>
            </div>
            <p class="text-[9px] font-medium opacity-50 mt-0.5"
              :class="isDark ? 'text-slate-300' : 'text-slate-500'">
              ID {{ r.empleado_id }} · {{ formatFecha(r.fecha) }}
            </p>
          </div>

          <!-- Marcar como resuelto -->
          <button v-if="!r.resuelto" @click="marcarResuelto(r)"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all shrink-0"
            :class="isDark
              ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
              : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'">
            <i class="fas fa-check text-[8px]"></i> Resolver
          </button>
        </div>

        <!-- Descripción -->
        <p class="mt-3 text-[11px] font-medium leading-relaxed"
          :class="isDark ? 'text-slate-300' : 'text-slate-700'">
          {{ r.descripcion }}
        </p>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const isDark  = inject('isDark', ref(false));

const reportes = ref([]);
const cargando = ref(false);

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
