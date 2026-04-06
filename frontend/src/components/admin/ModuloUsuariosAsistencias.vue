<template>
  <div class="novedades-container-main h-full animate-in fade-in duration-500 flex flex-col gap-2">

    <div
      class="flex flex-wrap items-center justify-between gap-3 p-1.5 px-3 rounded-2xl border transition-all duration-300 font-round-custom -mt-3 shadow-sm"
      :class="isDark ? 'bg-[#1e2538] border-white/5 shadow-black/20' : 'bg-[#f8fafc] border-slate-200 shadow-slate-200/50'">

      <div class="relative flex items-center shrink-0 ml-1 gap-3 font-round-custom">
        <span
          class="lg:hidden absolute -top-4 left-0 px-1 text-[8px] font-bold uppercase tracking-[0.15em] leading-none transition-colors"
          :class="isDark ? 'text-slate-500' : 'text-slate-400'">
          Asistencias
        </span>

        <div
          class="flex items-center justify-center w-7 h-7 rounded-xl bg-[#FF8F00] text-white shadow-sm shadow-orange-500/20">
          <i class="fas fa-clipboard-list text-xs"></i>
        </div>

        <h2 class="hidden lg:block text-base font-bold tracking-tight"
          :class="isDark ? 'text-white' : 'text-slate-800'">
          Asistencias
        </h2>
      </div>

      <div class="flex flex-wrap items-center gap-1.5">
        <button @click="filterHoy = !filterHoy"
          class="flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-black transition-all hover:scale-105 active:scale-95"
          :class="filterHoy ? 'bg-[#FF8F00] text-white border-[#FF8F00]' : (isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500')"
          title="Filtrar solo hoy">
          <i class="fas" :class="filterHoy ? 'fa-calendar-check' : 'fa-calendar'"></i>
          HOY
        </button>

        <div class="flex items-center gap-2 px-2 py-0.5 rounded-lg border transition-all" :class="[
          filterHoy ? 'opacity-40 pointer-events-none grayscale' : '',
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        ]">
          <input v-model="startDate" type="date"
            class="bg-transparent text-[11px] font-bold outline-none w-26 cursor-pointer"
            :class="isDark ? 'text-slate-300' : 'text-slate-600'">
          <div class="w-[1px] h-3 bg-slate-300 dark:bg-slate-600"></div>
          <input v-model="endDate" type="date"
            class="bg-transparent text-[11px] font-bold outline-none w-26 cursor-pointer"
            :class="isDark ? 'text-slate-300' : 'text-slate-600'">
        </div>

        <div class="flex items-center gap-2">
          <template v-if="hasPerm('admin.filtro_departamento')">
            <div class="relative">
              <select v-model="selectedDepartment"
                class="pl-3 pr-8 py-1 text-[10px] font-black uppercase rounded-lg border outline-none appearance-none cursor-pointer w-36 transition-all shadow-sm"
                :class="isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-600'">
                <option value="">DEPARTAMENTOS</option>
                <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
              </select>
              <i
                class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 pointer-events-none"></i>
            </div>
          </template>

          <div class="relative group">
            <input v-model="search" type="text" placeholder="BUSCAR..."
              class="pl-8 pr-3 py-1 text-[10px] font-bold uppercase rounded-lg border outline-none w-36 shadow-sm transition-all"
              :class="isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-[#FF8F00]' : 'bg-white border-slate-200 text-slate-600 focus:border-[#FF8F00]'">
            <i class="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400"></i>
          </div>
        </div>

        <div class="flex items-center gap-0.5 border-l border-slate-200 dark:border-white/10 pl-2">
          <button @click="clearFilters" class="p-1.5 text-slate-400 hover:text-rose-500 transition-all">
            <i class="fas fa-filter-circle-xmark text-base"></i>
          </button>
          <button @click="fetchReporte" class="p-1.5 text-slate-500 hover:text-[#FF8F00] transition-all">
            <i class="fas fa-arrows-rotate text-base" :class="{ 'fa-spin': loading }"></i>
          </button>
          <button @click="downloadReport" :disabled="loading || reportData.length === 0"
            class="ml-1 p-1.5 rounded-lg bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50">
            <i :class="loading ? 'fas fa-circle-notch fa-spin' : 'fas fa-file-excel'" class="text-sm"></i>
          </button>
        </div>
      </div>
    </div>

    <div
      class="table-wrapper flex-1 overflow-hidden rounded-xl border flex flex-col transition-all duration-300 font-round-custom"
      :class="isDark ? 'bg-[#253045] border-[#253045]' : 'bg-white border-slate-200 shadow-sm'">

      <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar scroll-smooth">
        <table class="w-full border-separate border-spacing-0 font-round-custom">
          <thead class="sticky top-0 z-30 shadow-md">
            <tr :class="isDark ? 'bg-[#3F4A6E]' : 'bg-[#334155]'">
              <th
                class="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.05em] border-b border-white/10 text-white">
                Colaborador</th>
              <th
                class="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.05em] border-b border-white/10 text-white">
                Identificación</th>
              <th
                class="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.05em] border-b border-white/10 text-white">
                Entrada</th>
              <th
                class="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.05em] border-b border-white/10 text-white">
                Salida</th>
              <th
                class="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.05em] border-b border-white/10 text-white">
                Estatus Entrada</th>
              <th
                class="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.05em] border-b border-white/10 text-white">
                Estatus Salida</th>
            </tr>
          </thead>

          <tbody class="divide-y-0">
            <tr v-if="loading" v-for="n in 8" :key="'loader-' + n">
              <td colspan="6" class="px-4 py-4">
                <div class="h-4 w-full rounded animate-pulse" :class="isDark ? 'bg-white/5' : 'bg-slate-100'"></div>
              </td>
            </tr>

            <tr v-else v-for="(item, index) in paginatedData" :key="item.id" class="group transition-all duration-150"
              :class="[
                index % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-transparent',
                isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-orange-50'
              ]">

              <td class="px-4 py-3 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                <div class="flex items-center gap-3">
                  <div
                    class="avatar-mini w-8 h-8 rounded-full bg-slate-500/20 flex items-center justify-center shrink-0">
                    <i class="fas fa-user text-[10px]" :class="isDark ? 'text-slate-300' : 'text-slate-500'"></i>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-[11px] font-bold uppercase tracking-tight"
                      :class="isDark ? 'text-white' : 'text-slate-900'">
                      {{ item.empleado }}
                    </span>
                    <span class="text-[9px] font-bold" :class="isDark ? 'text-orange-400/90' : 'text-orange-600'">
                      {{ item.department_id || 'Sin Depto' }}
                    </span>
                  </div>
                </div>
              </td>

              <td class="px-4 py-3 text-center border-b font-bold text-[12px]"
                :class="isDark ? 'text-slate-300 border-white/5' : 'text-slate-700 border-slate-100'">
                {{ item.cc }}
              </td>

              <td class="px-4 py-3 text-center border-b font-bold text-[12px]"
                :class="isDark ? 'text-slate-300 border-white/5' : 'text-slate-700 border-slate-100'">
                {{ formatSoloHora(item.check_in) }}
              </td>

              <td class="px-4 py-3 text-center border-b font-bold text-[12px]"
                :class="isDark ? 'text-slate-300 border-white/5' : 'text-slate-700 border-slate-100'">
                {{ formatSoloHora(item.check_out) }}
              </td>

              <td class="px-4 py-3 text-right border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                <span :class="getStatusClass(item.c_entrada)"
                  class="px-2 py-0.5 rounded text-[9px] font-bold uppercase border tracking-widest bg-opacity-10">
                  {{ item.c_entrada || 'OK' }}
                </span>
              </td>

              <td class="px-4 py-3 text-right border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                <span :class="getStatusClass(item.c_salida)"
                  class="px-2 py-0.5 rounded text-[9px] font-bold uppercase border tracking-widest bg-opacity-10">
                  {{ item.c_salida || 'OK' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="paginatedData?.length"
        class="px-4 py-2 border-t flex items-center justify-between font-round-custom shadow-inner"
        :class="isDark ? 'border-white/5 bg-[#1a1d2d]' : 'border-slate-200 bg-slate-50'">

        <span class="text-[10px] font-bold uppercase tracking-wide"
          :class="isDark ? 'text-[#5858E8]' : 'text-slate-600'">
          Total: <span :class="isDark ? 'text-white' : 'text-slate-900'">{{ reportData.length }}</span>
        </span>

        <div class="flex items-center gap-3">
          <button @click="currentPage--" :disabled="currentPage === 1"
            class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all disabled:opacity-20"
            :class="isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-sm'">
            <i class="fas fa-chevron-left text-[9px]"></i>
          </button>

          <div class="flex items-center px-3 py-1 rounded-lg text-[11px] font-bold border"
            :class="isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'">
            {{ currentPage }} <span class="mx-1.5 opacity-40">/</span> {{ totalPages }}
          </div>

          <button @click="currentPage++" :disabled="currentPage >= totalPages"
            class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all disabled:opacity-20"
            :class="isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-sm'">
            <i class="fas fa-chevron-right text-[9px]"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, ref, computed } from 'vue';
import { useCargarAsistencias } from '../../composables/UserLogica/cargarAsistencias';
import { useAttendance } from '../../composables/UserLogica/useAttendance';
import '../../assets/css/reporteTabla.css';

const props = defineProps({
  isDark: Boolean,
  company: String
});

const {
  reportData,
  search,
  selectedDepartment,
  startDate,
  endDate,
  departments,
  loading,
  fetchReporte,
  filterHoy,
  downloadReport,
  clearFilters,
  selectedArea,      // <--- Extraer aquí
  selectedSegmento,  // <--- Extraer aquí
  selectedCompany
} = useCargarAsistencias();

const { isDark: isDarkTheme } = useAttendance();

const session = JSON.parse(localStorage.getItem("user_session") || "{}");
// const esAdmin = session.role === 'admin';
const hasPerm = (permiso) => {
  const permisos = session.permisos || session.permissions || {};
  return permisos[permiso] === true;
};

const esAdmin = computed(() => hasPerm('admin.filtro_departamento'));
const miDepto = session.department;
const idLogueado = session.id_odoo;
const userProfile = ref(null);
const loadingProfile = ref(true);
const misResponsabilidades = ref([]); // Lista para guardar etiquetas dinámicas

// --- LÓGICA DE PAGINACIÓN ---
const currentPage = ref(1);
const itemsPerPage = ref(15); // Aumentado un poco para aprovechar pantallas grandes

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return reportData.value.slice(start, end);
});
onMounted(async () => {
  const baseUrl = import.meta.env.VITE_API_URL.replace(/\/$/, "");

  // 1. Sincronizar compañía de las props primero
  if (props.company) {
    selectedCompany.value = props.company;
  }

  // 2. Cargar perfil si NO es superAdmin (para coordinadores/líderes)
  // Nota: Usa el rol o una bandera que indique que necesita filtro de área
  if (!session.isSuperAdmin) {
    try {
      const resp = await fetch(`${baseUrl}/perfil-completo/${idLogueado}`);
      if (resp.ok) {
        const perfil = await resp.json();
        userProfile.value = perfil;

        // ASIGNACIÓN CLAVE: Esto dispara el watch en el composable
        if (perfil.area?.id) {
          selectedArea.value = perfil.area.id;
        }
        // if (perfil.segmento?.id) {
        //   selectedSegmento.value = perfil.segmento.id;
        // }

        // // Si el usuario tiene un departamento asignado en Odoo/Local
        // if (perfil.departamento) {
        //   selectedDepartment.value = perfil.departamento;
        // }
      }
    } catch (e) {
      console.error("Error cargando perfil:", e);
    }
  }

  // 3. Ejecutar carga inicial
  fetchReporte();
});

const totalPages = computed(() => Math.max(1, Math.ceil(reportData.value.length / itemsPerPage.value)));

// Resetear a pág 1 si cambian los filtros
watch([reportData, search, selectedDepartment, filterHoy, startDate, endDate], () => {
  currentPage.value = 1;
});

// Sincronizar compañía del header con la lógica
watch(() => props.company, (newCompany) => {
  if (newCompany) {
    selectedCompany.value = newCompany;
  }
}, { immediate: true });


const formatSoloHora = (value) => {
  if (!value || value === 'N/A') return '--/--/-- --:--:--';

  try {
    // El valor viene como "2026-03-09 10:09:51"
    const [fecha, hora] = value.split(' ');
    const [anio, mes, dia] = fecha.split('-');
    const [hh, mm, ss] = hora.split(':'); // Extraemos 'ss' (segundos)

    let h = parseInt(hh);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;

    // Retorna: 09-03-2026 10:09:51 AM
    // Usamos padStart en h por si quieres que el 9 aparezca como 09
    const horaFormateada = String(h).padStart(2, '0');

    return `${dia}-${mes}-${anio} ${horaFormateada}:${mm}:${ss} ${ampm}`;
  } catch (e) {
    return value;
  }
}

const getStatusClass = (status) => {
  if (!status || status.toUpperCase() === 'OK')
    return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';

  const s = status.toUpperCase();
  if (s.includes('TARDE') || s.includes('INCUMPLIDO'))
    return 'bg-rose-500/10 text-rose-600 border-rose-500/20';

  return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
};
</script>

<style scoped></style>