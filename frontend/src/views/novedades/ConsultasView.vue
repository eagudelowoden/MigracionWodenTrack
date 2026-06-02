<template>
  <div class="h-full flex flex-col gap-3 animate-fade-in">

    <!-- Header -->
    <div class="flex items-center gap-3 px-4 py-3 rounded-md border shrink-0"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/15">
        <i class="fas fa-magnifying-glass text-emerald-500 text-[13px]"></i>
      </div>
      <div>
        <h2 class="text-[13px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'">
          Consultas — Proceso de Offboarding
        </h2>
        <p class="text-[10px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
          Renuncias aprobadas · Seguimiento de Paz y Salvo
        </p>
      </div>
    </div>

    <!-- Filtros de búsqueda -->
    <div class="flex flex-wrap items-end gap-3 px-4 py-3 rounded-md border shrink-0"
      :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
      <!-- Cédula -->
      <div class="flex flex-col gap-1 flex-1 min-w-[160px]">
        <label class="text-[10px] font-semibold uppercase tracking-wide"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cédula</label>
        <input v-model="filtros.cedula" type="text" placeholder="Número de cédula..." @keydown.enter="buscar"
          class="h-8 px-3 rounded-[6px] border text-[11px] outline-none transition-all" :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white placeholder:text-slate-600 focus:border-emerald-500/50'
            : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-emerald-400'" />
      </div>
      <!-- Fecha inicio -->
      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-semibold uppercase tracking-wide"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">Desde</label>
        <input v-model="filtros.fechaInicio" type="date"
          class="h-8 px-3 rounded-[6px] border text-[11px] outline-none transition-all" :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white focus:border-emerald-500/50'
            : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-400'" />
      </div>
      <!-- Fecha fin -->
      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-semibold uppercase tracking-wide"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">Hasta</label>
        <input v-model="filtros.fechaFin" type="date"
          class="h-8 px-3 rounded-[6px] border text-[11px] outline-none transition-all" :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white focus:border-emerald-500/50'
            : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-400'" />
      </div>
      <!-- Botón buscar -->
      <button @click="buscar" :disabled="buscando"
        class="h-8 px-4 rounded-[6px] text-[11px] font-medium flex items-center gap-2 transition-all bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50">
        <i :class="buscando ? 'fas fa-spinner fa-spin' : 'fas fa-search'" class="text-[10px]"></i>
        {{ buscando ? 'Buscando…' : 'Buscar' }}
      </button>
    </div>

    <!-- Resultados -->
    <div class="flex-1 overflow-hidden flex flex-col gap-3 min-h-0">

      <!-- Sin resultados -->
      <div v-if="!buscando && buscado && !resultados.length"
        class="flex-1 flex flex-col items-center justify-center gap-2">
        <i class="fas fa-user-slash text-3xl opacity-20" :class="isDark ? 'text-slate-400' : 'text-slate-500'"></i>
        <p class="text-[12px] font-medium" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
          No se encontraron renuncias aprobadas con esos filtros
        </p>
      </div>

      <!-- Lista de resultados -->
      <div v-else-if="resultados.length" class="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        <div v-for="item in resultados" :key="item.novedad.id" class="rounded-md border overflow-hidden"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

          <!-- Cabecera del registro -->
          <div class="flex items-center justify-between px-4 py-3 border-b"
            :class="isDark ? 'border-[#222938] bg-[#0d1117]' : 'border-slate-100 bg-slate-50'">
            <div class="flex items-center gap-3">
              <!-- Avatar -->
              <div class="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-bold"
                :class="isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'">
                {{ item.novedad.nombre?.charAt(0) ?? '?' }}
              </div>
              <div>
                <p class="text-[13px] font-semibold uppercase" :class="isDark ? 'text-white' : 'text-slate-900'">{{
                  item.novedad.nombre }}</p>
                <p class="text-[10px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                  CC {{ item.novedad.cedula }}
                  <span v-if="item.novedad.departamento"> · {{ item.novedad.departamento }}</span>
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <!-- Fecha renuncia -->
              <span class="text-[10px] font-medium px-2 py-1 rounded-full"
                :class="isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'">
                <i class="fas fa-calendar-day mr-1 text-[8px]"></i>
                {{ formatFecha(item.novedad.fechaInicio) }}
              </span>
              <!-- Badge estado proceso -->
              <span class="text-[10px] font-semibold px-2 py-1 rounded-full" :class="item.pazSalvo?.proceso_completo
                ? 'bg-emerald-500/15 text-emerald-500'
                : item.pazSalvo
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-slate-500/15 text-slate-400'">
                <i class="mr-1 text-[8px]"
                  :class="item.pazSalvo?.proceso_completo ? 'fas fa-circle-check' : 'fas fa-circle-half-stroke'"></i>
                {{ item.pazSalvo?.proceso_completo ? 'Proceso completo' : item.pazSalvo ? 'En proceso' : 'Sin iniciar'
                }}
              </span>
            </div>
          </div>

          <div class="px-4 py-3">
            <div v-if="!item.pazSalvo"
              class="flex items-center justify-between py-2 px-3 rounded-lg border border-dashed"
              :class="isDark ? 'border-[#222938] text-slate-500' : 'border-slate-300 text-slate-400'">
              <span class="text-[11px]">Proceso de offboarding no iniciado aún</span>
              <button @click="iniciarProceso(item)" :disabled="item._iniciando"
                class="h-7 px-3 rounded-[5px] text-[11px] font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1.5">
                <i :class="item._iniciando ? 'fas fa-spinner fa-spin' : 'fas fa-play'" class="text-[9px]"></i>
                Iniciar proceso
              </button>
            </div>

            <div v-else class="flex flex-col gap-3">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button v-for="mod in MODULOS" :key="mod.key" @click="abrirSubModal(mod, item)"
                  class="flex flex-col justify-between p-3 rounded-lg border text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                  :class="isDark ? 'border-[#222938] bg-[#111827] hover:bg-[#1f2937]' : 'border-slate-200 bg-white hover:bg-slate-50'">

                  <div class="flex items-center justify-between w-full mb-2">
                    <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">{{ mod.label }}</span>
                    <span
                      :class="verificarModuloCompleto(mod.key, item) ? 'text-emerald-500' : 'text-amber-500'">
                      <i
                        :class="verificarModuloCompleto(mod.key, item) ? 'fas fa-check-circle' : 'fas fa-clock'"></i>
                    </span>
                  </div>

                  <div class="flex items-center gap-1 text-[11px] font-medium"
                    :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                    <i class="fas fa-list-check text-[9px]"></i>
                    <span>Responder checklist</span>
                  </div>
                </button>
              </div>

              <div class="flex items-center justify-between px-3 py-2 rounded-lg border"
                :class="isDark ? 'border-[#222938] bg-[#0B0F19]' : 'border-slate-100 bg-slate-50'">
                <div class="flex items-center gap-3 flex-1">
                  <div class="flex-1 h-1.5 rounded-full overflow-hidden"
                    :class="isDark ? 'bg-[#222938]' : 'bg-slate-200'">
                    <div class="h-full rounded-full transition-all duration-500"
                      :class="progreso(item) === 100 ? 'bg-emerald-500' : 'bg-amber-400'"
                      :style="`width: ${progreso(item)}%`"></div>
                  </div>
                  <span class="text-[11px] font-semibold shrink-0"
                    :class="progreso(item) === 100 ? 'text-emerald-500' : (isDark ? 'text-amber-400' : 'text-amber-600')">
                    {{ progreso(item) }}%
                  </span>
                  <span v-if="item.pazSalvo.proceso_completo"
                    class="text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
                    <i class="fas fa-circle-check text-[9px]"></i> Proceso completado
                  </span>
                </div>

                <button :disabled="!item.pazSalvo.proceso_completo" @click="generarPazYSalvo(item)"
                  class="ml-4 h-8 px-4 rounded-[6px] text-[11px] font-semibold flex items-center gap-2 transition-all"
                  :class="item.pazSalvo.proceso_completo
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98]'
                    : (isDark ? 'bg-[#222938] text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed')"
                  :title="item.pazSalvo.proceso_completo ? 'Generar Paz y Salvo' : 'Completa todos los módulos para generar el Paz y Salvo'">
                  <i class="fas fa-file-certificate text-[10px]"></i>
                  Paz y Salvo
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Estado inicial -->
      <div v-else-if="!buscado" class="flex-1 flex flex-col items-center justify-center gap-3 opacity-40">
        <i class="fas fa-magnifying-glass text-4xl" :class="isDark ? 'text-slate-600' : 'text-slate-400'"></i>
        <p class="text-[12px] font-medium" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
          Ingresa una cédula o rango de fechas para buscar
        </p>
      </div>

    </div>

    <!-- Modal Checklist -->
    <Teleport to="body">
      <div v-if="subModalOpen && moduloActivo && itemActivo"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <div class="relative w-full max-w-lg rounded-xl shadow-xl border p-5"
          :class="isDark ? 'bg-[#151b26] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-800'">

          <div class="flex items-center justify-between border-b pb-3 mb-4"
            :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
            <div>
              <h4 class="text-xs font-semibold uppercase tracking-wider text-emerald-500">Módulo</h4>
              <h3 class="text-sm font-bold">{{ moduloActivo.label }}</h3>
            </div>
            <button @click="cerrarSubModal" class="text-slate-400 hover:text-slate-600 text-sm">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div v-for="(pregunta, idx) in CHECKLISTS_POR_MODULO[moduloActivo?.key]" :key="idx"
              class="flex items-center justify-between p-3 rounded-lg border"
              :class="isDark ? 'bg-[#0b0f17] border-[#222938]' : 'bg-slate-50 border-slate-100'">
              <span class="text-xs font-medium pr-4">{{ pregunta.texto }}</span>
              <div class="flex gap-1 bg-slate-200 dark:bg-[#1f2937] p-0.5 rounded-md shrink-0">
                <button @click="guardarRespuesta(pregunta.id, true)"
                  class="px-3 py-1 text-[10px] font-bold rounded-sm transition-all"
                  :class="obtenerRespuestaActual(pregunta.id) === true
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'">
                  SÍ
                </button>
                <button @click="guardarRespuesta(pregunta.id, false)"
                  class="px-3 py-1 text-[10px] font-bold rounded-sm transition-all"
                  :class="obtenerRespuestaActual(pregunta.id) === false
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'">
                  NO
                </button>
              </div>
            </div>
          </div>

          <div class="mt-5 pt-3 border-t flex justify-end gap-2"
            :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
            <button @click="cerrarSubModal"
              class="h-8 px-4 rounded-md text-[11px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
              Guardar y Cerrar
            </button>
          </div>

        </div>
      </div>
    </Teleport>

    <!-- Toast estilo Vercel -->
    <Teleport to="body">
      <transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-2 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-1 scale-95">
        <div v-if="toast.visible"
          class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border shadow-2xl"
          style="background:#111; border-color:rgba(255,255,255,0.1); min-width:220px; max-width:360px; box-shadow:0 8px 32px rgba(0,0,0,0.5)">
          <span class="shrink-0 w-1.5 h-1.5 rounded-full" :class="toast.error ? 'bg-red-400' : 'bg-emerald-400'"></span>
          <p class="text-[12px] font-medium text-white flex-1" style="letter-spacing:0.01em">{{ toast.mensaje }}</p>
          <button @click="toast.visible = false"
            class="shrink-0 text-[10px] text-white/30 hover:text-white/70 transition-colors ml-1">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </transition>
    </Teleport>

    <!-- Modal Paz y Salvo -->
    <Teleport to="body">
      <transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 scale-[0.97]"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-[0.97]">
        <div v-if="pazSalvoModal.visible"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background:rgba(0,0,0,0.55);backdrop-filter:blur(3px)"
          @click.self="pazSalvoModal.visible = false">

          <div id="paz-salvo-print" class="w-full max-w-[520px] rounded-xl overflow-hidden shadow-2xl border"
            :class="isDark ? 'bg-[#111318] border-[#222938]' : 'bg-white border-slate-200'">

            <!-- Header -->
            <div class="flex items-center justify-between px-5 py-3.5 border-b"
              :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                <span class="text-[10px] font-semibold uppercase tracking-[0.12em]"
                  :class="isDark ? 'text-slate-400' : 'text-slate-400'">Paz y Salvo · Offboarding</span>
              </div>
              <div class="flex items-center gap-1.5">
                <button @click="imprimirPazYSalvo"
                  class="flex items-center gap-1.5 h-7 px-3 rounded-md text-[11px] font-medium border transition-all"
                  :class="isDark ? 'border-[#2d3548] text-slate-400 hover:text-white hover:border-slate-500' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'">
                  <i class="fas fa-arrow-up-from-bracket text-[9px]"></i> Imprimir
                </button>
                <button @click="pazSalvoModal.visible = false"
                  class="w-7 h-7 rounded-md flex items-center justify-center border transition-all"
                  :class="isDark ? 'border-[#2d3548] text-slate-500 hover:text-white' : 'border-slate-200 text-slate-400 hover:text-slate-700'">
                  <i class="fas fa-times text-[10px]"></i>
                </button>
              </div>
            </div>

            <!-- Body -->
            <div class="px-6 py-5 space-y-5">

              <!-- Colaborador / Fecha -->
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1"
                    :class="isDark ? 'text-slate-500' : 'text-slate-400'">Colaborador</p>
                  <p class="text-[16px] font-semibold tracking-tight"
                    :class="isDark ? 'text-white' : 'text-slate-900'">
                    {{ pazSalvoModal.item?.novedad?.nombre }}
                  </p>
                  <p class="text-[12px] mt-0.5"
                    :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                    CC {{ pazSalvoModal.item?.novedad?.cedula }}
                    <span v-if="pazSalvoModal.item?.novedad?.departamento">
                      · {{ pazSalvoModal.item.novedad.departamento }}
                    </span>
                  </p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1"
                    :class="isDark ? 'text-slate-500' : 'text-slate-400'">Generado</p>
                  <p class="text-[12px] font-medium"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ formatFechaHoy() }}</p>
                </div>
              </div>

              <!-- Separador punteado -->
              <div class="border-t border-dashed"
                :class="isDark ? 'border-[#2d3548]' : 'border-slate-200'"></div>

              <!-- Tabla de módulos -->
              <div>
                <div class="flex items-center justify-between px-1 mb-2">
                  <span class="text-[10px] font-semibold uppercase tracking-[0.1em]"
                    :class="isDark ? 'text-slate-600' : 'text-slate-400'">Módulo</span>
                  <span class="text-[10px] font-semibold uppercase tracking-[0.1em]"
                    :class="isDark ? 'text-slate-600' : 'text-slate-400'">Responsable · Fecha</span>
                </div>
                <div v-for="(mod, i) in MODULOS" :key="mod.key"
                  class="flex items-center justify-between px-1 py-2.5"
                  :class="i < MODULOS.length - 1 ? (isDark ? 'border-b border-[#1e2433]' : 'border-b border-slate-100') : ''">
                  <div class="flex items-center gap-2.5">
                    <span class="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-emerald-500/10">
                      <i :class="mod.icon" class="text-emerald-500" style="font-size:9px"></i>
                    </span>
                    <span class="text-[13px] font-medium"
                      :class="isDark ? 'text-slate-200' : 'text-slate-700'">{{ mod.label }}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="text-right">
                      <p class="text-[11px] font-medium"
                        :class="isDark ? 'text-slate-400' : 'text-slate-600'">
                        {{ getModuloPor(pazSalvoModal.item?.pazSalvo, mod.key) }}
                      </p>
                      <p class="text-[10px]"
                        :class="isDark ? 'text-slate-600' : 'text-slate-400'">
                        {{ getModuloFecha(pazSalvoModal.item?.pazSalvo, mod.key) }}
                      </p>
                    </div>
                    <span class="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/10">
                      <i class="fas fa-check text-emerald-500" style="font-size:8px"></i>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Separador punteado -->
              <div class="border-t border-dashed"
                :class="isDark ? 'border-[#2d3548]' : 'border-slate-200'"></div>

              <!-- Footer -->
              <div class="flex items-center justify-between">
                <p class="text-[11px]" :class="isDark ? 'text-slate-600' : 'text-slate-400'">
                  WodenTrack · Sistema de Gestión
                </p>
                <span class="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-500">
                  <i class="fas fa-circle-check text-[9px]"></i> Proceso completo
                </span>
              </div>

            </div>
          </div>
        </div>
      </transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import axios from 'axios';

const props = defineProps({ isDark: Boolean, company: String });

const API_URL = import.meta.env.VITE_API_URL;

const TODOS_MODULOS = [
  { key: 'sst', label: 'SST',            icon: 'fas fa-hard-hat', perm: 'novedades.offboarding.sst' },
  { key: 'ch',  label: 'Capital Humano', icon: 'fas fa-users',    perm: 'novedades.offboarding.ch'  },
  { key: 'it',  label: 'IT',             icon: 'fas fa-laptop',   perm: 'novedades.offboarding.it'  },
];

// Permisos del usuario en sesión
const session = JSON.parse(localStorage.getItem('user_session') || '{}');
const isSuperAdmin = !!session.isSuperAdmin;

// Módulos visibles según permisos (superadmin ve todos)
const MODULOS = computed(() =>
  TODOS_MODULOS.filter(m => isSuperAdmin || session.permisos?.[m.perm])
);

// Checklist cargado desde la BD (clave: modulo → preguntas[])
const checklistDB = ref({});
onMounted(async () => {
  try {
    const { data } = await axios.get(`${API_URL}/offboarding/checklist`);
    const agrupado = {};
    for (const item of data) {
      if (!agrupado[item.modulo]) agrupado[item.modulo] = [];
      agrupado[item.modulo].push({ id: `${item.modulo}_${item.id}`, texto: item.texto, _dbId: item.id });
    }
    checklistDB.value = agrupado;
  } catch { /* checklist no disponible aún */ }
});

const filtros = reactive({ cedula: '', fechaInicio: '', fechaFin: '' });
const resultados = ref([]);
const buscando = ref(false);
const buscado = ref(false);

const pazSalvoModal = reactive({ visible: false, item: null });
const toast = reactive({ visible: false, mensaje: '', error: false });
let _toastTimer = null;
function mostrarToast(mensaje, error = false) {
  clearTimeout(_toastTimer);
  toast.mensaje = mensaje;
  toast.error = error;
  toast.visible = true;
  _toastTimer = setTimeout(() => { toast.visible = false; }, 3000);
}

function formatFecha(f) {
  if (!f) return '—';
  return f.split('-').reverse().join('/');
}
function formatFechaHoy() {
  return new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}
function progreso(item) {
  if (!item) return 0;
  const mods = MODULOS.value;
  const completados = mods.filter(mod => verificarModuloCompleto(mod.key, item)).length;
  return Math.round((completados / (mods.length || 1)) * 100);
}
function getModuloPor(ps, key) {
  if (!ps) return '—';
  return ps[`${key}_por`] || '—';
}
function getModuloFecha(ps, key) {
  if (!ps || !ps[`${key}_fecha`]) return '—';
  return new Date(ps[`${key}_fecha`]).toLocaleDateString('es-CO');
}

async function buscar() {
  if (!filtros.cedula.trim()) {
    mostrarToast('Ingresa una cédula para buscar', true);
    return;
  }
  buscando.value = true;
  buscado.value = true;
  try {
    const params = {};
    if (filtros.cedula) params.cedula = filtros.cedula.trim();
    if (filtros.fechaInicio) params.fechaInicio = filtros.fechaInicio;
    if (filtros.fechaFin) params.fechaFin = filtros.fechaFin;
    if (props.company && props.company !== 'Todas') params.company = props.company;

    const { data } = await axios.get(`${API_URL}/novedades/paz-salvo/buscar`, { params });
    // API_URL ya incluye /usuarios → ruta final: /usuarios/novedades/paz-salvo/buscar
    resultados.value = data.map(r => {
      const respuestas = {}
      for (const mod of TODOS_MODULOS) {
        const raw = r.pazSalvo?.[`${mod.key}_items`]
        if (raw) Object.assign(respuestas, JSON.parse(raw))
      }
      return { ...r, _iniciando: false, _respuestas: respuestas }
    });
  } catch (e) {
    console.error(e);
    resultados.value = [];
  } finally {
    buscando.value = false;
  }
}

async function iniciarProceso(item) {
  item._iniciando = true;
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const { data } = await axios.post(
      `${API_URL}/novedades/paz-salvo/iniciar/${item.novedad.id}`,
      { por: session.name || 'Sistema' },
    );
    item.pazSalvo = data;
  } catch (e) { console.error(e); }
  finally { item._iniciando = false; }
}

async function actualizarModulo(item, { modulo, ok, notas }) {
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const { data } = await axios.patch(
      `${API_URL}/novedades/paz-salvo/${item.pazSalvo.id}/modulo`,
      { modulo, ok, notas, por: session.name || 'Sistema' },
    );
    item.pazSalvo = data;
  } catch (e) { console.error(e); }
}

function generarPazYSalvo(item) {
  pazSalvoModal.item = item;
  pazSalvoModal.visible = true;
}
// 1. Estados reactivos del Modal
const subModalOpen = ref(false)
const moduloActivo = ref(null) // Guarda el objeto del módulo (p.ej. TI, Recursos Humanos)
const itemActivo = ref(null)   // Guarda el registro del colaborador actual

// Checklist dinámico cargado desde la BD (ver onMounted arriba)
const CHECKLISTS_POR_MODULO = computed(() => checklistDB.value)

// 3. Funciones Controladoras
const abrirSubModal = (modulo, item) => {
  moduloActivo.value = modulo
  itemActivo.value = item
  subModalOpen.value = true
}

const cerrarSubModal = async () => {
  if (moduloActivo.value && itemActivo.value) {
    const modKey = moduloActivo.value.key
    const preguntas = CHECKLISTS_POR_MODULO.value[modKey] ?? []
    const respuestas = itemActivo.value._respuestas ?? {}
    const items = Object.fromEntries(preguntas.map(p => [p.id, respuestas[p.id] ?? null]).filter(([, v]) => v !== null))
    const ok = preguntas.length > 0 && preguntas.every(p => respuestas[p.id] !== undefined && respuestas[p.id] !== null)
    const session = JSON.parse(localStorage.getItem('user_session') || '{}')
    try {
      const { data } = await axios.patch(
        `${API_URL}/novedades/paz-salvo/${itemActivo.value.pazSalvo.id}/modulo`,
        { modulo: modKey, ok, por: session.name || 'Sistema', items },
      )
      const guardado = itemActivo.value
      guardado.pazSalvo = data
      mostrarToast('Checklist guardado correctamente')
    } catch (e) {
      console.error(e)
      mostrarToast('Error al guardar, intenta de nuevo', true)
    }
  }
  subModalOpen.value = false
  moduloActivo.value = null
  itemActivo.value = null
}

const obtenerRespuestaActual = (preguntaId) => {
  if (!itemActivo.value) return null
  return itemActivo.value._respuestas?.[preguntaId] ?? null
}

const guardarRespuesta = (preguntaId, valor) => {
  if (!itemActivo.value._respuestas) {
    itemActivo.value._respuestas = {}
  }
  itemActivo.value._respuestas[preguntaId] = valor
}

const verificarModuloCompleto = (moduloKey, item) => {
  if (!item._respuestas) return false
  const preguntas = CHECKLISTS_POR_MODULO.value[moduloKey]
  if (!preguntas?.length) return false
  return preguntas.every(p => item._respuestas[p.id] !== undefined && item._respuestas[p.id] !== null)
}

function imprimirPazYSalvo() {
  const item = pazSalvoModal.item;
  if (!item) return;
  const ps = item.pazSalvo;
  const novedad = item.novedad;

  const modulosHtml = MODULOS.map(mod => `
    <tr>
      <td class="mod-name">${mod.label}</td>
      <td class="mod-by">${getModuloPor(ps, mod.key)}</td>
      <td class="mod-date">${getModuloFecha(ps, mod.key)}</td>
      <td class="mod-status"><span class="badge-ok">&#10003; Aprobado</span></td>
    </tr>
  `).join('');

  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Paz y Salvo — ${novedad?.nombre ?? ''}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', Arial, sans-serif;
      background: #fff;
      color: #111;
      padding: 56px 64px;
      font-size: 13px;
      line-height: 1.5;
    }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 24px;
      border-bottom: 2px solid #111;
      margin-bottom: 32px;
    }
    .header-brand { font-size: 15px; font-weight: 700; letter-spacing: -0.3px; color: #111; }
    .header-sub   { font-size: 11px; color: #888; margin-top: 2px; letter-spacing: 0.02em; }
    .header-right { text-align: right; }
    .doc-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #16a34a;
    }
    .doc-id { font-size: 11px; color: #aaa; margin-top: 3px; }

    /* ── Employee block ── */
    .employee-block {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }
    .emp-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #999;
      margin-bottom: 5px;
    }
    .emp-name  { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; color: #111; }
    .emp-meta  { font-size: 12px; color: #666; margin-top: 4px; }
    .emp-date-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #999; margin-bottom: 5px; text-align: right; }
    .emp-date  { font-size: 13px; font-weight: 500; color: #444; text-align: right; }

    /* ── Certificación ── */
    .cert-text {
      font-size: 12.5px;
      color: #444;
      line-height: 1.7;
      margin-bottom: 32px;
      padding: 16px 20px;
      background: #f9fafb;
      border-left: 3px solid #16a34a;
      border-radius: 0 6px 6px 0;
    }

    /* ── Tabla de módulos ── */
    .section-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #999;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    thead tr { border-bottom: 1px solid #e5e7eb; }
    thead th {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #aaa;
      padding: 0 12px 8px;
      text-align: left;
    }
    tbody tr { border-bottom: 1px solid #f3f4f6; }
    tbody tr:last-child { border-bottom: none; }
    tbody td { padding: 11px 12px; vertical-align: middle; }
    .mod-name  { font-weight: 600; font-size: 13px; color: #111; }
    .mod-by    { font-size: 12px; color: #555; }
    .mod-date  { font-size: 11px; color: #999; }
    .mod-status { text-align: right; }
    .badge-ok {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      color: #15803d;
      background: #dcfce7;
      padding: 3px 10px;
      border-radius: 99px;
      letter-spacing: 0.02em;
    }

    /* ── Firma ── */
    .signatures {
      display: flex;
      gap: 48px;
      margin-top: 48px;
      margin-bottom: 40px;
    }
    .sig-box {
      flex: 1;
      border-top: 1px solid #d1d5db;
      padding-top: 10px;
    }
    .sig-name  { font-size: 12px; font-weight: 600; color: #111; }
    .sig-role  { font-size: 11px; color: #999; margin-top: 2px; }

    /* ── Footer ── */
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-left  { font-size: 11px; color: #bbb; }
    .footer-right {
      font-size: 11px;
      font-weight: 600;
      color: #15803d;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: #16a34a; display: inline-block; }

    @media print {
      body { padding: 32px 40px; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="header-brand">WodenTrack</div>
      <div class="header-sub">Sistema de Gestión de Talento Humano</div>
    </div>
    <div class="header-right">
      <div class="doc-title">Paz y Salvo</div>
      <div class="doc-id">Generado el ${formatFechaHoy()}</div>
    </div>
  </div>

  <div class="employee-block">
    <div>
      <div class="emp-label">Colaborador</div>
      <div class="emp-name">${novedad?.nombre ?? '—'}</div>
      <div class="emp-meta">
        Cédula: ${novedad?.cedula ?? '—'}
        ${novedad?.departamento ? ' &nbsp;·&nbsp; ' + novedad.departamento : ''}
        ${novedad?.cargo ? ' &nbsp;·&nbsp; ' + novedad.cargo : ''}
      </div>
    </div>
    <div>
      <div class="emp-date-label">Fecha de renuncia</div>
      <div class="emp-date">${formatFecha(novedad?.fechaInicio)}</div>
    </div>
  </div>

  <div class="cert-text">
    Se certifica que el colaborador <strong>${novedad?.nombre ?? ''}</strong> ha completado
    satisfactoriamente todos los módulos del proceso de desvinculación, habiendo recibido el
    visto bueno de los departamentos responsables. El presente documento avala que no existen
    obligaciones pendientes entre las partes a la fecha de su emisión.
  </div>

  <div class="section-label">Detalle de módulos</div>
  <table>
    <thead>
      <tr>
        <th>Módulo</th>
        <th>Responsable</th>
        <th>Fecha</th>
        <th style="text-align:right">Estado</th>
      </tr>
    </thead>
    <tbody>${modulosHtml}</tbody>
  </table>

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-name">_________________________________</div>
      <div class="sig-role">Firma del colaborador</div>
    </div>
    <div class="sig-box">
      <div class="sig-name">_________________________________</div>
      <div class="sig-role">Capital Humano</div>
    </div>
    <div class="sig-box">
      <div class="sig-name">_________________________________</div>
      <div class="sig-role">Gerencia</div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-left">WodenTrack · Documento generado automáticamente · No requiere sello físico</div>
    <div class="footer-right"><span class="dot"></span> Proceso completado</div>
  </div>

</body>
</html>`);
  w.document.close();
  setTimeout(() => w.print(), 400);
}
</script>
