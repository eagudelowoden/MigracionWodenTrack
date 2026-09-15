<template>
  <div class="h-full animate-in fade-in duration-500 flex flex-col gap-2 p-3 overflow-hidden">
    <!-- Toolbar propia — solo cuando NO está embebido en otra pantalla que ya
         trae sus propios filtros (ej. /admin/asistencias). -->
    <div v-if="!embedded" class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-md border"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

      <div class="flex items-center gap-2">
        <div class="w-7 h-7 bg-amber-500/10 text-amber-500 rounded-md flex items-center justify-center">
          <i class="fas fa-database text-[11px]"></i>
        </div>
        <div>
          <h2 class="text-[13px] font-semibold tracking-tight" :class="isDark ? 'text-white' : 'text-slate-900'">
            Datos Directos (Odoo)
          </h2>
          <p class="text-[10px] leading-tight" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            <code>employee_id</code> directo, sin emparejar turnos ni cruzar mallas.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-1.5">
        <!-- HOY toggle -->
        <button @click="filterHoy = !filterHoy"
          class="flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] border text-[11px] font-medium transition-all active:scale-[0.98]"
          :class="filterHoy
            ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
            : (isDark ? 'bg-[#0B0F19] border-[#222938] text-[#888888] hover:text-white hover:border-[#3B82F6]/40' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300')">
          <i class="fas text-[10px]" :class="filterHoy ? 'fa-calendar-check' : 'fa-calendar'"></i>
          Hoy
        </button>

        <!-- Rango de fechas -->
        <div class="flex items-center gap-2 h-7 px-2 rounded-[5px] border transition-all"
          :class="[filterHoy ? 'opacity-40 pointer-events-none' : '', isDark ? 'bg-[#0B0F19] border-[#222938]' : 'bg-white border-slate-200']">
          <input v-model="startDate" type="date" @change="filterHoy = false"
            class="bg-transparent text-[11px] font-medium outline-none cursor-pointer w-[100px]"
            :class="isDark ? 'text-white' : 'text-slate-700'">
          <div class="w-px h-3" :class="isDark ? 'bg-[#222938]' : 'bg-slate-300'"></div>
          <input v-model="endDate" type="date" @change="filterHoy = false"
            class="bg-transparent text-[11px] font-medium outline-none cursor-pointer w-[100px]"
            :class="isDark ? 'text-white' : 'text-slate-700'">
        </div>

        <!-- Empresa -->
        <div class="relative">
          <select v-model="selectedCompany"
            class="h-7 pl-2.5 pr-7 text-[11px] font-medium rounded-[5px] border outline-none appearance-none cursor-pointer w-40 transition-all"
            :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]' : 'bg-white border-slate-200 text-slate-700 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'">
            <option value="">Todas las empresas</option>
            <option v-for="e in empresas" :key="e" :value="e">{{ e }}</option>
          </select>
          <i class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none"
            :class="isDark ? 'text-[#888888]' : 'text-slate-400'"></i>
        </div>

        <!-- Departamento -->
        <input v-model="selectedDepartment" type="text" placeholder="Departamento (opcional)…"
          class="h-7 px-2.5 text-[11px] font-medium rounded-[5px] border outline-none w-40 transition-all"
          :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white placeholder:text-[#5a5a5a] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]' : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'">

        <!-- Search (client-side: nombre/employee_id/cédula, sobre lo ya descargado) -->
        <div class="relative">
          <i class="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px]"
            :class="isDark ? 'text-[#888888]' : 'text-slate-400'"></i>
          <input v-model="search" type="text" placeholder="Nombre, cédula o employee_id…"
            class="h-7 pl-7 pr-2.5 text-[11px] font-medium rounded-[5px] border outline-none w-48 transition-all"
            :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white placeholder:text-[#5a5a5a] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]' : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]'">
        </div>

        <!-- Consultar -->
        <button @click="fetchCrudoDiagnostico"
          class="flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] border text-[11px] font-medium transition-all active:scale-[0.98]"
          :class="isDark
            ? 'bg-[#0B0F19] border-[#222938] text-[#f5f5f7] hover:text-white hover:border-[#3B82F6]/40'
            : 'bg-white border-slate-200 text-[#1e2538] hover:bg-black hover:text-white hover:border-black'">
          <i class="fas fa-magnifying-glass text-[10px]" :class="{ 'fa-spin': loadingCrudo }"></i>
          Consultar
        </button>
      </div>
    </div>

    <div v-if="crudoError" class="px-3 py-2 rounded-md text-[11px] font-medium flex items-center gap-2 border"
      :class="isDark ? 'bg-[#dc2626]/[0.08] border-[#dc2626]/30 text-[#f87171]' : 'bg-red-50 border-red-200 text-red-700'">
      <i class="fas fa-circle-exclamation text-[11px]"></i>
      {{ crudoError }}
    </div>

    <!-- Cargando -->
    <div v-if="loadingCrudo" class="flex-1 flex items-center justify-center rounded-md border"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <div class="flex flex-col items-center gap-3 py-20">
        <i class="fas fa-circle-notch fa-spin text-2xl" :class="isDark ? 'text-amber-400' : 'text-amber-500'"></i>
        <span class="text-[11px] font-medium" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Descargando Datos Directos…
        </span>
      </div>
    </div>

    <!-- Vacío inicial -->
    <div v-else-if="!crudoData" class="flex-1 flex items-center justify-center rounded-md border"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <div class="flex flex-col items-center gap-2 py-20">
        <i class="fas fa-database text-2xl" :class="isDark ? 'text-slate-600' : 'text-slate-300'"></i>
        <span class="text-[11px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
          Selecciona los filtros y presiona Consultar
        </span>
      </div>
    </div>

    <template v-else>
      <!-- Sub-tabs + descarga -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-0.5 p-0.5 rounded-md border w-fit"
          :class="isDark ? 'bg-[#0B0F19] border-[#222938]' : 'bg-slate-100 border-slate-200'">
          <button @click="crudoTab = 'attendances'; crudoPage = 1"
            class="h-6 px-2.5 rounded-[4px] text-[10px] font-semibold transition-all"
            :class="crudoTab === 'attendances' ? 'bg-amber-500 text-white' : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700')">
            Aplicación ({{ crudoData.attendancesCount }})
          </button>
          <button @click="crudoTab = 'logs'; crudoPage = 1"
            class="h-6 px-2.5 rounded-[4px] text-[10px] font-semibold transition-all"
            :class="crudoTab === 'logs' ? 'bg-amber-500 text-white' : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700')">
            Biométrico ({{ crudoData.logsCount }})
          </button>
        </div>

        <button @click="descargarCrudo" :disabled="!crudoRowsActivas.length"
          class="flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] border text-[11px] font-medium transition-all active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none"
          :class="isDark
            ? 'bg-[#0B0F19] border-[#222938] text-[#f5f5f7] hover:text-white hover:border-emerald-500/40'
            : 'bg-white border-slate-200 text-[#1e2538] hover:border-emerald-500'">
          <i class="fas fa-download text-[10px]"></i>
          Descargar
        </button>
      </div>

      <!-- Tabla cruda -->
      <div class="flex-1 overflow-hidden rounded-md border flex flex-col relative"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
        <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar scroll-smooth">
          <table class="w-full border-separate border-spacing-0">
            <thead class="sticky top-0 z-30">
              <tr class="bg-[#1e2538]">
                <th
                  class="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                  ID Odoo</th>
                <th
                  class="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                  Employee ID</th>
                <th
                  class="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                  Empleado</th>
                <th
                  class="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                  Cédula</th>
                <th
                  class="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                  Depto</th>
                <template v-if="crudoTab === 'attendances'">
                  <th
                    class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                    Check in</th>
                  <th
                    class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                    Check out</th>
                </template>
                <template v-else>
                  <th
                    class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                    Punching time</th>
                  <th
                    class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                    Status</th>
                  <th
                    class="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide border-b border-[#f5f5f7] text-[#f5f5f7]">
                    Device</th>
                </template>
              </tr>
            </thead>
            <tbody v-if="!crudoRowsPaginadas.length">
              <tr>
                <td :colspan="crudoTab === 'attendances' ? 7 : 8" class="py-16 text-center">
                  <i class="fas fa-inbox text-2xl mb-2 block" :class="isDark ? 'text-slate-600' : 'text-slate-300'"></i>
                  <span class="text-[11px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Sin registros</span>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr v-for="(row, i) in crudoRowsPaginadas" :key="row.id"
                :class="[i % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-transparent']">
                <td class="px-3 py-2 border-b text-[11px] tabular-nums"
                  :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">{{ row.id }}
                </td>
                <td class="px-3 py-2 border-b text-[11px] font-bold tabular-nums"
                  :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{
                    row.employee_id }}</td>
                <td class="px-3 py-2 border-b text-[11px] font-semibold"
                  :class="isDark ? 'border-[#222938] text-white' : 'border-slate-100 text-slate-900'">{{ row.empleado }}
                </td>
                <td class="px-3 py-2 border-b text-[11px] tabular-nums"
                  :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{ row.cedula
                    || '—' }}
                </td>
                <td class="px-3 py-2 border-b text-[11px]"
                  :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-100 text-slate-500'">{{
                    row.department_id }}
                </td>
                <template v-if="crudoTab === 'attendances'">
                  <td class="px-3 py-2 border-b text-center text-[11px] tabular-nums"
                    :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{
                      row.check_in || '—' }}</td>
                  <td class="px-3 py-2 border-b text-center text-[11px] tabular-nums"
                    :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{
                      row.check_out || '—' }}</td>
                </template>
                <template v-else>
                  <td class="px-3 py-2 border-b text-center text-[11px] tabular-nums"
                    :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{
                      row.punching_time || '—' }}</td>
                  <td class="px-3 py-2 border-b text-center text-[11px]"
                    :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{
                      row.status || '—' }}</td>
                  <td class="px-3 py-2 border-b text-center text-[11px]"
                    :class="isDark ? 'border-[#222938] text-slate-300' : 'border-slate-100 text-slate-700'">{{
                      row.device || '—' }}</td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div v-if="crudoRowsActivas.length" class="px-3 py-2 border-t flex items-center justify-between"
          :class="isDark ? 'border-[#222938] bg-[#0B0F19]/40' : 'border-slate-200 bg-slate-50/60'">
          <span class="text-[11px]" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
            <span :class="isDark ? 'text-white font-medium' : 'text-slate-900 font-medium'">{{ crudoRowsActivas.length
            }}</span>
            registros
          </span>
          <div class="flex items-center gap-1.5">
            <button @click="crudoPage--" :disabled="crudoPage === 1"
              class="w-7 h-7 flex items-center justify-center rounded-[5px] border transition-all disabled:opacity-30"
              :class="isDark ? 'bg-[#161B26] border-[#222938] text-[#E2E8F0] hover:bg-white/[0.03] hover:border-[#3B82F6]/40' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'">
              <i class="fas fa-chevron-left text-[9px]"></i>
            </button>
            <div class="h-7 px-3 flex items-center rounded-[5px] text-[11px] font-medium border"
              :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-900'">
              {{ crudoPage }} / {{ crudoTotalPages }}
            </div>
            <button @click="crudoPage++" :disabled="crudoPage >= crudoTotalPages"
              class="w-7 h-7 flex items-center justify-center rounded-[5px] border transition-all disabled:opacity-30"
              :class="isDark ? 'bg-[#161B26] border-[#222938] text-[#E2E8F0] hover:bg-white/[0.03] hover:border-[#3B82F6]/40' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'">
              <i class="fas fa-chevron-right text-[9px]"></i>
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { apiFetch } from '@/utils/apiFetch.js';
import { useCargarAsistencias } from '../../../composables/UserLogica/cargarAsistencias';

const props = defineProps({
  isDark: { type: Boolean, default: true },
  // Cuando está embebido en otra pantalla (ej. /admin/asistencias, que ya
  // trae su propia barra de Hoy/fechas/empresa/depto/búsqueda), se oculta la
  // toolbar propia y se reutilizan los filtros de esa pantalla en vez de
  // tener dos barras duplicadas.
  embedded: { type: Boolean, default: false },
  // El objeto que devuelve useCargarAsistencias() de la pantalla que
  // embebe este componente — mismas refs, mismo estado, una sola fuente de
  // verdad. Si no se pasa (uso standalone en SuperAdmin), crea el suyo.
  sharedState: { type: Object, default: null },
});

const cargar = props.sharedState || useCargarAsistencias();
const {
  search,
  selectedDepartment,
  startDate,
  endDate,
  selectedCompany,
  selectedArea,
  selectedSegmento,
  selectedEmployeeId,
  filterHoy,
  crudoData,
  loadingCrudo,
  crudoError,
  fetchCrudoDiagnostico,
} = cargar;

const API = import.meta.env.VITE_API_URL; // .../usuarios
const empresas = ref([]);

async function cargarEmpresas() {
  try {
    const { data } = await axios.get(`${API}/companies`);
    empresas.value = (Array.isArray(data) ? data : [])
      .filter((c) => c.is_active !== false)
      .map((c) => c.name)
      .filter(Boolean)
      .sort();
  } catch {
    empresas.value = [];
  }
}

// ── Scope por área/segmento — MISMA lógica que ModuloUsuariosAsistencias.vue,
// para que "Datos Crudos" respete exactamente los mismos permisos de
// visibilidad (novedades.ver_segmento / coord.ver_segmento / admin.ver_todo)
// que el resto de reportes administrativos, en vez de quedar abierto a lo
// que se le ocurra pedir al que use la pantalla.
async function aplicarScopeVisibilidad() {
  const session = JSON.parse(localStorage.getItem('user_session') || '{}');
  const tieneVerTodo = session.permisos?.['admin.ver_todo'] === true;
  if (session.isSuperAdmin || tieneVerTodo) return;

  try {
    const resp = await apiFetch(`${API}/perfil-completo/${session.id_odoo}`);
    if (!resp.ok) return;
    const perfil = await resp.json();

    const esResponsableSegmento = session.permisos?.['novedades.ver_segmento'] === true;
    const esCoordSegmento = !esResponsableSegmento && session.permisos?.['coord.ver_segmento'] === true;
    if ((esResponsableSegmento || esCoordSegmento) && perfil.segmento?.id) {
      selectedSegmento.value = perfil.segmento.id;
    } else if (perfil.area?.id) {
      selectedArea.value = perfil.area.id;
      if (perfil.segmento?.id) selectedSegmento.value = perfil.segmento.id;
    } else if (perfil.segmento?.id) {
      // Tiene segmento pero no área: sin con qué intersectar, se acota a sí mismo.
      selectedEmployeeId.value = session.id_odoo;
    }
  } catch (e) {
    console.error('Error cargando perfil para scope de datos crudos:', e);
  }
}

// ── Sub-tabs + paginación (mismo comportamiento que la vista original) ──────
const crudoTab = ref('attendances'); // 'attendances' | 'logs'
const crudoPage = ref(1);
const crudoItemsPerPage = 20;

const crudoRowsCrudas = computed(() => {
  if (!crudoData.value) return [];
  return crudoTab.value === 'attendances'
    ? (crudoData.value.attendances ?? [])
    : (crudoData.value.logs ?? []);
});

// El buscador filtra en el cliente, sobre lo ya descargado — por
// nombre, employee_id o cédula (x_studio_cedula_codigo, viene directo del
// registro de Odoo, no es un cruce con otra fuente).
const crudoRowsActivas = computed(() => {
  const s = search.value.toLowerCase().trim();
  if (!s) return crudoRowsCrudas.value;
  return crudoRowsCrudas.value.filter((row) =>
    String(row.empleado || '').toLowerCase().includes(s) ||
    String(row.employee_id || '').includes(s) ||
    String(row.cedula || '').includes(s),
  );
});

const crudoTotalPages = computed(() =>
  Math.max(1, Math.ceil(crudoRowsActivas.value.length / crudoItemsPerPage)),
);

const crudoRowsPaginadas = computed(() => {
  const start = (crudoPage.value - 1) * crudoItemsPerPage;
  return crudoRowsActivas.value.slice(start, start + crudoItemsPerPage);
});

// Exporta EXACTAMENTE las filas visibles ahora mismo (misma pestaña activa,
// mismos filtros de nombre/employee_id/cédula ya aplicados) — sin ningún
// enriquecimiento server-side, para no romper el "sin cruces" de esta vista.
function descargarCrudo() {
  const filas = crudoRowsActivas.value;
  if (!filas.length) return;

  const encabezados = crudoTab.value === 'attendances'
    ? { id: 'ID Odoo', employee_id: 'Employee ID', empleado: 'Empleado', cedula: 'Cédula', department_id: 'Depto', check_in: 'Check in', check_out: 'Check out' }
    : { id: 'ID Odoo', employee_id: 'Employee ID', empleado: 'Empleado', cedula: 'Cédula', department_id: 'Depto', punching_time: 'Punching time', status: 'Status', device: 'Device' };

  const datos = filas.map((row) => {
    const out = {};
    for (const [key, label] of Object.entries(encabezados)) out[label] = row[key] ?? '';
    return out;
  });

  const worksheet = XLSX.utils.json_to_sheet(datos);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, crudoTab.value === 'attendances' ? 'hr.attendance' : 'attendance.log');

  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `DatosCrudos_${crudoTab.value}_${fecha}.xlsx`);
}

// Se expone para que la pantalla que embebe este componente (ej.
// ModuloUsuariosAsistencias.vue) pueda disparar la descarga desde SU PROPIO
// botón "Excel" del toolbar compartido, sin duplicar el botón acá también.
defineExpose({ descargarCrudo });

onMounted(async () => {
  // Cuando está embebido, la pantalla que lo contiene YA aplica este mismo
  // scope (misma lógica, mismas refs compartidas) y ya carga sus propias
  // empresas para su propio selector — repetirlo acá sería una llamada de
  // más sin ningún efecto adicional.
  if (!props.embedded) {
    // El scope de área/segmento debe quedar fijado ANTES de que el usuario
    // pueda tocar "Consultar" — si no, la primera consulta saldría sin acotar.
    await aplicarScopeVisibilidad();
    cargarEmpresas();
  }
});
</script>
