<template>
  <div class="h-full animate-fade-in flex flex-col gap-2 font-round-custom">

    <!-- Toolbar (Vercel compacto) -->
    <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-md border"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

      <div class="flex items-center gap-2">
        <div class="w-7 h-7 bg-[#3B82F6]/10 text-[#3B82F6] rounded-md flex items-center justify-center">
          <i class="fas fa-calendar-check text-[11px]"></i>
        </div>
        <h2 class="text-[13px] font-semibold tracking-tight" :class="isDark ? 'text-white' : 'text-slate-900'">
          Asignación de Mallas
        </h2>
      </div>

      <div class="flex flex-wrap items-center gap-1.5">

        <template v-if="hasPerm('admin.filtro_departamento')">
          <div class="relative">
            <select v-model="selectedDepartment"
              class="h-7 pl-2.5 pr-7 text-[11px] font-medium rounded-[5px] border outline-none appearance-none cursor-pointer w-40 transition-all"
              :class="isDark
                ? 'bg-[#0B0F19] border-[#222938] text-white focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'
                : 'bg-white border-slate-200 text-slate-700 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'">
              <option value="">Todos los departamentos</option>
              <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
            </select>
            <i class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none"
              :class="isDark ? 'text-[#888888]' : 'text-slate-400'"></i>
          </div>
        </template>

        <div class="relative">
          <i class="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px]"
            :class="isDark ? 'text-[#888888]' : 'text-slate-400'"></i>
          <input v-model="searchQuery" type="text" placeholder="Buscar…"
            class="h-7 pl-7 pr-2.5 text-[11px] font-medium rounded-[5px] border outline-none w-40 md:w-48 transition-all"
            :class="isDark
              ? 'bg-[#0B0F19] border-[#222938] text-white placeholder:text-[#5a5a5a] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'
              : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'" />
        </div>

        <div class="flex items-center gap-1.5 border-l pl-1.5 ml-0.5"
          :class="isDark ? 'border-[#222938]' : 'border-slate-200'">

          <button @click="fetchMallasDesdeOdoo"
            class="h-7 w-7 rounded-[5px] border flex items-center justify-center transition-all" :class="isDark
              ? 'bg-[#0B0F19] border-[#222938] text-[#888888] hover:text-white hover:border-[#3B82F6]/40'
              : 'bg-white border-slate-200 text-[#1e2538] hover:bg-black hover:text-white hover:border-black'"
            title="Refrescar">
            <i class="fas fa-arrows-rotate text-[10px]" :class="{ 'fa-spin': isLoadingMallas }"></i>
          </button>

          <button @click="downloadMallaTemplate"
            class="flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] border text-[11px] font-medium transition-all active:scale-[0.98] disabled:opacity-50"
            :class="isDark
              ? 'bg-[#0B0F19] border-[#222938] text-[#E2E8F0] hover:bg-white/[0.03] hover:border-[#3B82F6]/40'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'"
            title="Descargar Plantilla">
            <i :class="isLoadingDownload ? 'fas fa-spinner fa-spin' : 'fas fa-download'" class="text-[10px]"></i>
            <span>Plantilla</span>
          </button>

          <button @click="intentarCargar"
            class="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-[5px] transition-all active:scale-[0.98] border"
            :class="!carguePermitido
                ? (isDark
                  ? 'bg-[#0B0F19] border-[#222938] text-[#888888] hover:text-white hover:bg-white/[0.03]'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50')
                : 'bg-[#3B82F6] text-white border-[#3B82F6] hover:bg-[#2563EB] hover:border-[#2563EB]'"
            :title="!carguePermitido ? 'Fuera de ventana de cargue — haz clic para solicitar apertura' : 'Subir archivo de mallas'">
            <i :class="!carguePermitido ? 'fas fa-lock' : 'fas fa-cloud-arrow-up'" class="text-[10px]"></i>
            <span>{{ !carguePermitido ? 'Bloqueado' : 'Subir' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Tabla asignaciones -->
    <div class="table-wrapper flex-1 overflow-hidden rounded-md border flex flex-col"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

      <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
        <table class="w-full border-separate border-spacing-0">
          <thead class="sticky top-0 z-30">
            <!-- Header con fondo oscuro consistente (dark theme look incluso en light) -->
            <tr class="bg-[#1e2538]">
              <th
                class="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                <div class="flex items-center gap-2"><i class="fas fa-user-circle opacity-60"></i> Colaborador</div>
              </th>
              <th
                class="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                Cédula
              </th>
              <th
                class="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                Cargo
              </th>
              <th
                class="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                Departamento
              </th>
              <th
                class="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                Malla
              </th>
              <th
                class="px-4 py-2.5 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                Jornada
              </th>
              <th
                class="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                Horario
              </th>
            </tr>
          </thead>

          <tbody class="divide-y-0">
            <tr v-if="isLoadingMallas" v-for="n in 8" :key="'loader-' + n">
              <td colspan="7" class="px-4 py-4">
                <div class="h-4 w-full rounded animate-pulse bg-slate-500/10"></div>
              </td>
            </tr>

            <tr v-else v-for="(persona, index) in paginatedMallas" :key="index"
              class="group transition-all duration-150"
              :class="[index % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-transparent', isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-white/[0.03]']">

              <td class="px-4 py-3 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                <span class="text-[11px] font-bold uppercase tracking-tight"
                  :class="isDark ? 'text-white' : 'text-slate-900'">{{ persona.nombre }}</span>
              </td>
              <td class="px-4 py-3 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                <span class="text-[11px] font-mono tracking-wide"
                  :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{
                    persona.cc || '—' }}</span>
              </td>
              <td class="px-4 py-3 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                <span class="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border"
                  :class="isDark ? 'bg-[#161B26]/40 text-slate-300 border-[#222938]' : 'bg-slate-100 text-slate-700 border-slate-200'">{{
                    persona.cargo }}</span>
              </td>
              <td class="px-4 py-3 border-b text-[10px] font-bold"
                :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">{{
                  persona.departamento }}</td>
              <td class="px-4 py-3 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                <span
                  class="px-2 py-0.5 rounded text-[9px] font-semibold uppercase border italic tracking-wider shadow-sm"
                  :style="{ backgroundColor: isDark ? '#E39C2D20' : '#E39C2D10', borderColor: isDark ? '#E39C2D40' : '#E39C2D30', color: '#E39C2D' }">{{
                    persona.malla }}</span>
              </td>
              <td class="px-4 py-3 text-center uppercase text-[9px] font-semibold border-b"
                :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-600'">{{
                  persona.jornada }}
              </td>
              <td class="px-4 py-3 text-right font-bold text-[11px] border-b"
                :class="isDark ? 'border-[#222938] text-white' : 'border-slate-100 text-slate-800'">{{ persona.horario
                }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="paginatedMallas?.length" class="px-4 py-2 border-t flex items-center justify-between shadow-inner"
        :class="isDark ? 'border-[#222938] bg-[#1a1d2d]' : 'border-slate-200 bg-slate-50'">
        <span class="text-[10px] font-bold uppercase" :class="isDark ? 'text-[#D8DAE3]' : 'text-slate-600'">
          Total: <span :class="isDark ? 'text-white' : 'text-slate-900'">{{ totalRecords }}</span>
        </span>
        <div class="flex items-center gap-3">
          <button @click="mallasPage--" :disabled="mallasPage === 1"
            class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all disabled:opacity-20"
            :class="isDark ? 'border-[#222938] hover:bg-[#161B26]/40 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-sm'">
            <i class="fas fa-chevron-left text-[9px]"></i>
          </button>
          <div class="px-3 py-1 rounded-lg text-[11px] font-bold border"
            :class="isDark ? 'bg-[#161B26] border-[#222938] text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'">
            {{ mallasPage }} <span class="mx-1.5 opacity-40">/</span> {{ mallasPages }}
          </div>
          <button @click="mallasPage++" :disabled="mallasPage >= mallasPages"
            class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all disabled:opacity-20"
            :class="isDark ? 'border-[#222938] hover:bg-[#161B26]/40 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-sm'">
            <i class="fas fa-chevron-right text-[9px]"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: fuera de fecha de cargue -->
    <Transition name="fade">
      <div v-if="showSolicitudModal"
        class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div class="w-full max-w-sm rounded-2xl shadow-2xl border overflow-hidden"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

          <!-- Header -->
          <div class="px-5 py-4 border-b flex items-center gap-3"
            :class="isDark ? 'border-white/8 bg-[#3B82F6]/8' : 'border-amber-100 bg-amber-50'">
            <div class="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center shrink-0">
              <i class="fas fa-calendar-xmark text-[#3B82F6] text-lg"></i>
            </div>
            <div>
              <h3 class="text-[13px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">
                Fuera de fecha de cargue
              </h3>
              <p class="text-[9px] mt-0.5" :class="isDark ? 'text-white/40' : 'text-slate-500'">
                No hay una ventana de cargue activa para hoy
              </p>
            </div>
          </div>

          <div class="p-5 space-y-3">
            <p class="text-[10px] leading-relaxed" :class="isDark ? 'text-white/60' : 'text-slate-600'">
              El administrador ha programado fechas específicas para el cargue de mallas.
              <span v-if="proximaFechaHabilitada" class="font-bold" :class="isDark ? 'text-white' : 'text-slate-800'">
                La próxima fecha habilitada es el <em>{{ proximaFechaHabilitada }}</em>.
              </span>
            </p>

            <!-- Nota informativa -->
            <div class="flex items-start gap-2 p-3 rounded-xl text-[9px]"
              :class="isDark ? 'bg-white/4 border border-white/8 text-white/40' : 'bg-slate-50 border border-slate-200 text-slate-500'">
              <i class="fas fa-circle-info mt-0.5 shrink-0"></i>
              Puedes enviar una solicitud de apertura al Super Admin si necesitas cargar mallas hoy.
            </div>

            <div class="flex gap-2 pt-1">
              <button @click="crearSolicitud()"
                class="flex-1 h-9 rounded-xl text-[10px] font-semibold uppercase tracking-wide bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-all flex items-center justify-center gap-1.5">
                <i class="fas fa-paper-plane text-[9px]"></i> Solicitar apertura
              </button>
              <button @click="showSolicitudModal = false"
                class="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all"
                :class="isDark ? 'bg-[#161B26]/40 text-white/40 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Ventana de carga de mallas (estilo AWS S3) -->
    <MallaUploadWindow
      v-model="showUploadWindow"
      :isDark="isDark"
      @uploaded="fetchMallasDesdeOdoo"
    />

  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useMallasGeneral } from '../../composables/adminLogica/mallasGeneral';
import MallaUploadWindow from './MallaUploadWindow.vue';
import '../../assets/css/modulo-mallas.css';

const props = defineProps({
  isDark: Boolean,
  company: String,
});

// ── Sesión ───────────────────────────────────────────────────────────────────
const session = JSON.parse(localStorage.getItem('user_session') || '{}');
const hasPerm = (permiso) => {
  const permisos = session.permisos || session.permissions || {};
  return permisos[permiso] === true;
};

// ── Asignación de Mallas ─────────────────────────────────────────────────────
const {
  searchQuery,
  isLoading: isLoadingMallas,
  isLoadingDownload,
  selectedCompany,
  selectedDepartment,
  departments,
  fetchMallasDesdeOdoo,
  downloadMallaTemplate,
  paginatedMallas,
  currentPage: mallasPage,
  totalPages: mallasPages,
  totalRecords,
  carguePermitido,
  proximaFechaHabilitada,
  showSolicitudModal,
  crearSolicitud,
} = useMallasGeneral();

// Ventana de carga
const showUploadWindow = ref(false);

const intentarCargar = () => {
  if (!carguePermitido.value) {
    showSolicitudModal.value = true;
    return;
  }
  showUploadWindow.value = true;
};

// ── Sincronizar company y cargar mallas ──────────────────────────────────────
watch(
  () => props.company,
  (v) => {
    if (v) selectedCompany.value = v;
    fetchMallasDesdeOdoo();
  },
  { immediate: true },
);
</script>
<style></style>
