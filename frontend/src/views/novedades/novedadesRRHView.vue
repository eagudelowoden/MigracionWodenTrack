<template>
  <div class="w-full h-full animate-fade-in transition-all duration-500 flex flex-col gap-2">

    <!-- Header SEPARADO -->
    <div class="flex flex-wrap items-center justify-between gap-3 p-1.5 px-3 rounded-2xl border shrink-0 shadow-sm"
      :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

      <div class="flex items-center gap-3 ml-1">
        <div class="w-7 h-7 flex items-center justify-center rounded-xl bg-[#FF8F00] text-white shadow-sm">
          <i class="fas fa-user-check text-xs"></i>
        </div>
        <div>
          <h2 class="text-base font-black uppercase tracking-tighter" :class="isDark ? 'text-white' : 'text-slate-800'">
            Gestión <span class="text-[#FF8F00]">RRHH</span>
          </h2>
          <p class="text-[8px] font-bold opacity-50 uppercase tracking-[0.2em]"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Auditoría de Novedades</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">

        <!-- Filtro fecha específica -->
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
          :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-200 bg-white'">
          <i class="fas fa-calendar-day text-[#FF8F00] text-[10px]"></i>
          <input type="date" v-model="filters.fecha"
            class="bg-transparent text-[10px] font-bold outline-none cursor-pointer"
            :class="isDark ? 'text-white [color-scheme:dark]' : 'text-slate-700'" />
        </div>

        <!-- Indicador fecha activa -->
        <div v-if="filters.fecha"
          class="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest"
          :class="isDark ? 'border-[#FF8F00]/30 bg-[#FF8F00]/10 text-[#FF8F00]' : 'border-[#FF8F00]/30 bg-[#FF8F00]/5 text-[#FF8F00]'">
          <i class="fas fa-filter text-[8px]"></i>
          {{ formatFecha(filters.fecha) }}
        </div>

        <!-- Reset -->
        <button @click="resetFilters" class="p-1.5 rounded-lg border transition-colors hover:text-[#FF8F00]"
          :class="isDark ? 'border-[#2d3548] bg-[#273045] text-slate-400' : 'border-slate-200 bg-white text-slate-500'">
          <i class="fas fa-sync-alt text-[10px]" :class="{ 'fa-spin': loading }"></i>
        </button>

      </div>
    </div>

    <!-- Tabla SEPARADA -->
    <div class="flex-1 flex flex-col w-full overflow-hidden rounded-2xl border transition-all duration-500"
      :class="isDark ? 'bg-[#1e2538] border-[#2d3548] shadow-black/40' : 'bg-white border-slate-200 shadow-slate-100'">

      <!-- Estado cargando -->
      <div v-if="loading" class="flex-1 flex items-center justify-center gap-3">
        <i class="fas fa-circle-notch fa-spin text-[#FF8F00] text-lg"></i>
        <span class="text-[11px] font-black uppercase tracking-widest"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cargando novedades...</span>
      </div>

      <!-- Estado error -->
      <div v-else-if="error" class="flex-1 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3 opacity-70">
          <i class="fas fa-exclamation-triangle text-red-400 text-2xl"></i>
          <p class="text-[11px] font-bold text-red-400">Error al cargar los registros</p>
          <button @click="fetchNovedades"
            class="px-4 py-2 rounded-lg text-[9px] font-black uppercase bg-[#FF8F00] text-black">
            Reintentar
          </button>
        </div>
      </div>

      <!-- Sin resultados -->
      <div v-else-if="novedadesFiltradas.length === 0 && !loading" class="flex-1 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3 opacity-50">
          <i class="fas fa-inbox text-3xl" :class="isDark ? 'text-slate-500' : 'text-slate-400'"></i>
          <p class="text-[11px] font-black uppercase tracking-widest"
            :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            {{ filters.fecha ? 'Sin novedades para esta fecha' : 'No hay novedades registradas' }}
          </p>
        </div>
      </div>

      <!-- Tabla desktop -->
      <div v-else class="hidden md:flex flex-col flex-1 overflow-hidden">
        <div class="flex-1 overflow-y-auto overflow-x-auto">
          <table class="w-full border-separate border-spacing-0">
            <thead class="sticky top-0 z-10">
              <tr class="bg-[#334155]">
                <th
                  class="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Colaborador
                </th>
                <th
                  class="px-4 py-3 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Período
                </th>
                <th
                  class="px-4 py-3 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Días
                </th>
                <th
                  class="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Descripción
                </th>
                <th
                  class="px-4 py-3 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Modo
                </th>
                <th
                  class="px-5 py-3 text-right text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Soporte
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in novedadesFiltradas" :key="item.id" class="group transition-all duration-150"
                :class="[
                  idx % 2 !== 0
                    ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50')
                    : 'bg-transparent',
                  isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-orange-50'
                ]">

                <!-- Colaborador -->
                <td class="px-5 py-3 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-lg bg-[#FF8F00]/10 flex items-center justify-center text-xs font-black text-[#FF8F00] shrink-0">
                      {{ item.nombre?.charAt(0) ?? '?' }}
                    </div>
                    <div class="flex flex-col">
                      <span class="text-[11px] font-bold uppercase tracking-tight"
                        :class="isDark ? 'text-white' : 'text-slate-900'">{{ item.nombre }}</span>
                      <span class="text-[9px] font-medium opacity-50 tracking-wider">CC: {{ item.cedula }}</span>
                    </div>
                  </div>
                </td>

                <!-- Período -->
                <td class="px-4 py-3 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-[9px] font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                      {{ formatFecha(item.fechaInicio ?? item.fecha_inicio) }}
                    </span>
                    <span class="text-[8px] opacity-40">→</span>
                    <span class="text-[9px] font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                      {{ formatFecha(item.fechaFin ?? item.fecha_fin) }}
                    </span>
                  </div>
                </td>

                <!-- Días -->
                <td class="px-4 py-3 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <span class="text-[13px] font-black" :class="isDark ? 'text-white' : 'text-slate-800'">
                    {{ calcDias(item.fechaInicio ?? item.fecha_inicio, item.fechaFin ?? item.fecha_fin) }}
                  </span>
                </td>

                <!-- Descripción -->
                <td class="px-4 py-3 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <p class="text-[10px] font-medium line-clamp-2 max-w-[200px]"
                    :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                    {{ item.descripcion }}
                  </p>
                </td>

                <!-- Modo storage -->
                <td class="px-4 py-3 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <span class="px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter" :class="(item.soporteStorageMode ?? item.soporte_storage_mode) === 's3'
                    ? 'bg-[#FF8F00]/10 text-[#FF8F00]'
                    : 'bg-emerald-500/10 text-emerald-500'">
                    <i :class="(item.soporteStorageMode ?? item.soporte_storage_mode) === 's3'
                      ? 'fab fa-aws mr-1'
                      : 'fas fa-hard-drive mr-1'"></i>
                    {{ (item.soporteStorageMode ?? item.soporte_storage_mode) === 's3' ? 'S3' : 'Local' }}
                  </span>
                </td>

                <!-- Soporte -->
                <td class="px-5 py-3 text-right border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <button @click="verSoporte(item.id)"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase italic tracking-widest transition-all hover:scale-105 active:scale-95 shadow-sm"
                    :class="isDark ? 'bg-[#FF8F00] text-black' : 'bg-slate-900 text-white'">
                    <i class="fas fa-eye"></i>
                    <span>Ver</span>
                  </button>
                </td>

              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="px-5 py-2 border-t shrink-0 flex items-center justify-between"
          :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-100 bg-slate-50'">
          <p class="text-[9px] font-black uppercase tracking-widest"
            :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            Resultados:
            <span :class="isDark ? 'text-white' : 'text-slate-800'">{{ novedadesFiltradas.length }}</span>
            <span v-if="filters.fecha" class="ml-2 opacity-60">— filtrado por {{ formatFecha(filters.fecha) }}</span>
          </p>
          <p class="text-[9px] font-bold opacity-40" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            Total en BD: {{ novedades.length }}
          </p>
        </div>
      </div>

      <!-- Mobile -->
      <div v-if="!loading && !error && novedadesFiltradas.length > 0" class="md:hidden flex-1 overflow-y-auto divide-y"
        :class="isDark ? 'divide-[#2d3548]' : 'divide-slate-100'">
        <div v-for="item in novedadesFiltradas" :key="'mob-' + item.id" class="p-4 space-y-3">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-lg bg-[#FF8F00]/10 flex items-center justify-center text-[10px] font-black text-[#FF8F00]">
                {{ item.nombre?.charAt(0) ?? '?' }}
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] font-black uppercase tracking-tight"
                  :class="isDark ? 'text-white' : 'text-slate-800'">{{ item.nombre }}</span>
                <span class="text-[9px] opacity-50">CC: {{ item.cedula }}</span>
              </div>
            </div>
            <span class="text-[10px] font-black text-[#FF8F00]">
              {{ calcDias(item.fechaInicio ?? item.fecha_inicio, item.fechaFin ?? item.fecha_fin) }} días
            </span>
          </div>
          <p class="text-[10px] opacity-60 line-clamp-2" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
            {{ item.descripcion }}
          </p>
          <div class="flex items-center justify-between text-[9px] font-bold uppercase opacity-50">
            <span>{{ formatFecha(item.fechaInicio ?? item.fecha_inicio) }} → {{ formatFecha(item.fechaFin ??
              item.fecha_fin) }}</span>
          </div>
          <button @click="verSoporte(item.id)"
            class="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[9px] font-black uppercase italic tracking-widest shadow-md"
            :class="isDark ? 'bg-[#FF8F00] text-black' : 'bg-slate-800 text-white'">
            <i class="fas fa-eye"></i>
            <span>Ver Soporte</span>
          </button>
        </div>
      </div>

    </div>

    <!-- Modal visor soporte -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: rgba(0,0,0,0.7)" @click.self="modalOpen = false">
          <div class="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            :class="isDark ? 'bg-[#1e2538]' : 'bg-white'">

            <!-- Toolbar modal -->
            <div class="flex items-center justify-between px-4 py-3 border-b shrink-0"
              :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
              <div class="flex items-center gap-2">
                <i class="fas fa-eye text-[#FF8F00] text-xs"></i>
                <span class="text-[11px] font-black uppercase tracking-widest"
                  :class="isDark ? 'text-white' : 'text-slate-700'">Soporte</span>
                <span class="text-[10px] opacity-50 font-medium" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                  {{ modalNombre }}
                </span>
              </div>
              <div class="flex items-center gap-1.5">
                <a v-if="modalFileUrl" :href="modalFileUrl" target="_blank"
                  class="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 transition-all hover:brightness-110"
                  :class="isDark ? 'bg-[#273045] text-slate-300 border-[#3d4558]' : 'bg-slate-100 text-slate-600 border-slate-200'">
                  <i class="fas fa-external-link-alt text-[#FF8F00]"></i> Abrir
                </a>
                <button @click="modalOpen = false" class="w-7 h-7 rounded-lg flex items-center justify-center border"
                  :class="isDark ? 'bg-[#273045] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-500 border-slate-200'">
                  <i class="fas fa-xmark text-xs"></i>
                </button>
              </div>
            </div>

            <!-- Contenido modal -->
            <div class="flex-1 overflow-auto flex items-center justify-center p-3 min-h-[400px]"
              :class="isDark ? 'bg-[#151c2c]' : 'bg-slate-50'">
              <div v-if="modalLoading" class="flex flex-col items-center gap-3">
                <i class="fas fa-circle-notch fa-spin text-[#FF8F00] text-2xl"></i>
                <span class="text-[11px] font-black uppercase tracking-widest opacity-50"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cargando archivo...</span>
              </div>
              <img v-else-if="modalIsImage && modalFileUrl" :src="modalFileUrl"
                class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-xl" />
              <iframe v-else-if="modalIsPdf && modalFileUrl" :src="modalFileUrl" class="w-full rounded-lg border-0"
                style="height: 70vh" title="Soporte PDF" />
              <div v-else class="flex flex-col items-center gap-4 opacity-60">
                <i class="fas fa-file text-5xl" :class="isDark ? 'text-slate-500' : 'text-slate-400'"></i>
                <p class="text-xs text-center" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                  Vista previa no disponible.<br />
                  <a v-if="modalFileUrl" :href="modalFileUrl" target="_blank"
                    class="text-[#FF8F00] underline font-bold mt-1 block">Abrir archivo</a>
                </p>
              </div>
            </div>

          </div>
        </div>
      </transition>
    </teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNovedades } from '../../composables/adminLogica/useNovedades';

const props = defineProps({ isDark: Boolean, company: String });

// ─── Composable ───────────────────────────────────────────────────────────────
const { novedades, loading, error, fetchNovedades, fetchNovedad, getFileUrl } = useNovedades();

// ─── Filtros — solo fecha por ahora ──────────────────────────────────────────
const filters = ref({ fecha: '' });

// ─── Modal visor ──────────────────────────────────────────────────────────────
const modalOpen = ref(false);
const modalLoading = ref(false);
const modalFileUrl = ref('');
const modalNombre = ref('');
const modalMime = ref('');

const modalIsImage = computed(() =>
  /image\/(jpeg|jpg|png|gif|webp|svg)/.test(modalMime.value)
);
const modalIsPdf = computed(() => modalMime.value === 'application/pdf');

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => fetchNovedades());

// ─── Filtrado por fecha ───────────────────────────────────────────────────────
const novedadesFiltradas = computed(() => {
  if (!filters.value.fecha) return novedades.value;

  return novedades.value.filter((n) => {
    const inicio = n.fechaInicio ?? n.fecha_inicio ?? '';
    const fin = n.fechaFin ?? n.fecha_fin ?? '';
    const fechaBusq = filters.value.fecha; // 'YYYY-MM-DD'
    // Muestra la novedad si la fecha buscada cae dentro del período
    return fechaBusq >= inicio.slice(0, 10) && fechaBusq <= fin.slice(0, 10);
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatFecha = (f) => {
  if (!f) return '—';
  const d = new Date(f + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const calcDias = (inicio, fin) => {
  if (!inicio || !fin) return '—';
  const ms = new Date(fin) - new Date(inicio);
  return Math.round(ms / 86400000) + 1;
};

const resetFilters = () => {
  filters.value = { fecha: '' };
  fetchNovedades();
};

// ─── Ver soporte ──────────────────────────────────────────────────────────────
const verSoporte = async (id) => {
  modalOpen.value = true;
  modalLoading.value = true;
  modalFileUrl.value = '';
  modalMime.value = '';

  try {
    const detalle = await fetchNovedad(id);
    modalNombre.value = detalle.nombre ?? detalle.data?.nombre ?? '';
    modalMime.value = detalle.soporteMime ?? detalle.soporte_mime ?? '';
    // ← siempre usa el endpoint /file, nunca la ruta relativa
    modalFileUrl.value = `${import.meta.env.VITE_API_URL}/novedades/${id}/file`;
  } catch {
    modalFileUrl.value = `${import.meta.env.VITE_API_URL}/novedades/${id}/file`;
  } finally {
    modalLoading.value = false;
  }
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>