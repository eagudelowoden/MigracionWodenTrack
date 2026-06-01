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
        <input v-model="filtros.cedula" type="text" placeholder="Número de cédula..."
          @keydown.enter="buscar"
          class="h-8 px-3 rounded-[6px] border text-[11px] outline-none transition-all"
          :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white placeholder:text-slate-600 focus:border-emerald-500/50'
                         : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-emerald-400'" />
      </div>
      <!-- Fecha inicio -->
      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-semibold uppercase tracking-wide"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">Desde</label>
        <input v-model="filtros.fechaInicio" type="date"
          class="h-8 px-3 rounded-[6px] border text-[11px] outline-none transition-all"
          :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white focus:border-emerald-500/50'
                         : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-400'" />
      </div>
      <!-- Fecha fin -->
      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-semibold uppercase tracking-wide"
          :class="isDark ? 'text-slate-400' : 'text-slate-500'">Hasta</label>
        <input v-model="filtros.fechaFin" type="date"
          class="h-8 px-3 rounded-[6px] border text-[11px] outline-none transition-all"
          :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white focus:border-emerald-500/50'
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
        <div v-for="item in resultados" :key="item.novedad.id"
          class="rounded-md border overflow-hidden"
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
                <p class="text-[13px] font-semibold uppercase"
                  :class="isDark ? 'text-white' : 'text-slate-900'">{{ item.novedad.nombre }}</p>
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
              <span class="text-[10px] font-semibold px-2 py-1 rounded-full"
                :class="item.pazSalvo?.proceso_completo
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : item.pazSalvo
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-slate-500/15 text-slate-400'">
                <i class="mr-1 text-[8px]"
                  :class="item.pazSalvo?.proceso_completo ? 'fas fa-circle-check' : 'fas fa-circle-half-stroke'"></i>
                {{ item.pazSalvo?.proceso_completo ? 'Proceso completo' : item.pazSalvo ? 'En proceso' : 'Sin iniciar' }}
              </span>
            </div>
          </div>

          <!-- Checklist de módulos -->
          <div class="px-4 py-3">
            <!-- Iniciar proceso si no existe paz_salvo -->
            <div v-if="!item.pazSalvo"
              class="flex items-center justify-between py-2 px-3 rounded-lg border border-dashed"
              :class="isDark ? 'border-[#222938] text-slate-500' : 'border-slate-300 text-slate-400'">
              <span class="text-[11px]">Proceso de offboarding no iniciado aún</span>
              <button @click="iniciarProceso(item)"
                :disabled="item._iniciando"
                class="h-7 px-3 rounded-[5px] text-[11px] font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1.5">
                <i :class="item._iniciando ? 'fas fa-spinner fa-spin' : 'fas fa-play'" class="text-[9px]"></i>
                Iniciar proceso
              </button>
            </div>

            <!-- Módulos checklist -->
            <div v-else class="flex flex-col gap-3">
              <!-- Grid de 3 módulos -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <ModuloChecklist
                  v-for="mod in MODULOS" :key="mod.key"
                  :modulo="mod"
                  :ps="item.pazSalvo"
                  :isDark="isDark"
                  @actualizar="(data) => actualizarModulo(item, data)" />
              </div>

              <!-- Progreso + Paz y Salvo -->
              <div class="flex items-center justify-between px-3 py-2 rounded-lg border"
                :class="isDark ? 'border-[#222938] bg-[#0B0F19]' : 'border-slate-100 bg-slate-50'">
                <!-- Barra de progreso -->
                <div class="flex items-center gap-3 flex-1">
                  <div class="flex-1 h-1.5 rounded-full overflow-hidden"
                    :class="isDark ? 'bg-[#222938]' : 'bg-slate-200'">
                    <div class="h-full rounded-full transition-all duration-500"
                      :class="progreso(item.pazSalvo) === 100 ? 'bg-emerald-500' : 'bg-amber-400'"
                      :style="`width: ${progreso(item.pazSalvo)}%`"></div>
                  </div>
                  <span class="text-[11px] font-semibold shrink-0"
                    :class="progreso(item.pazSalvo) === 100
                      ? 'text-emerald-500'
                      : (isDark ? 'text-amber-400' : 'text-amber-600')">
                    {{ progreso(item.pazSalvo) }}%
                  </span>
                  <span v-if="item.pazSalvo.proceso_completo"
                    class="text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
                    <i class="fas fa-circle-check text-[9px]"></i> Proceso completado
                  </span>
                </div>

                <!-- Botón Paz y Salvo -->
                <button
                  :disabled="!item.pazSalvo.proceso_completo"
                  @click="generarPazYSalvo(item)"
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
      <div v-else-if="!buscado"
        class="flex-1 flex flex-col items-center justify-center gap-3 opacity-40">
        <i class="fas fa-magnifying-glass text-4xl" :class="isDark ? 'text-slate-600' : 'text-slate-400'"></i>
        <p class="text-[12px] font-medium" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
          Ingresa una cédula o rango de fechas para buscar
        </p>
      </div>

    </div>

    <!-- Modal Paz y Salvo -->
    <Teleport to="body">
      <div v-if="pazSalvoModal.visible" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background:rgba(0,0,0,0.6)" @click.self="pazSalvoModal.visible = false">
        <div class="w-full max-w-2xl rounded-xl border shadow-2xl overflow-hidden"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

          <!-- Header modal -->
          <div class="flex items-center justify-between px-6 py-4 border-b"
            :class="isDark ? 'border-[#222938] bg-[#0d1117]' : 'border-slate-100 bg-emerald-50'">
            <div class="flex items-center gap-3">
              <i class="fas fa-file-certificate text-emerald-500 text-xl"></i>
              <div>
                <p class="text-[14px] font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">Paz y Salvo</p>
                <p class="text-[11px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Proceso de offboarding completado</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button @click="imprimirPazYSalvo"
                class="h-8 px-3 rounded-[6px] text-[11px] font-medium bg-emerald-500 text-white hover:bg-emerald-600 flex items-center gap-1.5">
                <i class="fas fa-print text-[10px]"></i> Imprimir
              </button>
              <button @click="pazSalvoModal.visible = false"
                class="w-8 h-8 rounded-[6px] flex items-center justify-center border transition-all"
                :class="isDark ? 'border-[#222938] text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500'">
                <i class="fas fa-times text-[10px]"></i>
              </button>
            </div>
          </div>

          <!-- Contenido Paz y Salvo (imprimible) -->
          <div id="paz-salvo-print" class="px-8 py-6 space-y-5">
            <div class="text-center border-b pb-4" :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
              <p class="text-[10px] font-semibold uppercase tracking-widest mb-1"
                :class="isDark ? 'text-emerald-400' : 'text-emerald-600'">Paz y Salvo</p>
              <h3 class="text-[18px] font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">
                {{ pazSalvoModal.item?.novedad?.nombre }}
              </h3>
              <p class="text-[12px] mt-1" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                CC {{ pazSalvoModal.item?.novedad?.cedula }}
                <span v-if="pazSalvoModal.item?.novedad?.departamento">
                  · {{ pazSalvoModal.item.novedad.departamento }}
                </span>
              </p>
            </div>

            <p class="text-[12px]" :class="isDark ? 'text-slate-300' : 'text-slate-700'">
              Se certifica que el colaborador ha completado satisfactoriamente todos los módulos
              del proceso de desvinculación, habiendo recibido el visto bueno de los departamentos
              responsables.
            </p>

            <!-- Detalle de módulos -->
            <div class="grid grid-cols-3 gap-3">
              <div v-for="mod in MODULOS" :key="mod.key"
                class="flex flex-col gap-1.5 p-3 rounded-lg border"
                :class="isDark ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50'">
                <div class="flex items-center gap-2">
                  <i :class="mod.icon" class="text-emerald-500 text-[11px]"></i>
                  <span class="text-[11px] font-semibold text-emerald-600">{{ mod.label }}</span>
                  <i class="fas fa-circle-check text-emerald-500 ml-auto text-[10px]"></i>
                </div>
                <p class="text-[10px]" :class="isDark ? 'text-slate-400' : 'text-slate-600'">
                  Completado por: {{ getModuloPor(pazSalvoModal.item?.pazSalvo, mod.key) }}
                </p>
                <p class="text-[10px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                  {{ getModuloFecha(pazSalvoModal.item?.pazSalvo, mod.key) }}
                </p>
              </div>
            </div>

            <div class="text-center pt-2 border-t" :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
              <p class="text-[11px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                Generado el {{ formatFechaHoy() }} · Sistema WodenTrack
              </p>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import axios from 'axios';
import ModuloChecklist from './ModuloChecklist.vue';

const props = defineProps({ isDark: Boolean, company: String });

const API_URL = import.meta.env.VITE_API_URL;

const MODULOS = [
  { key: 'sst', label: 'SST',           icon: 'fas fa-hard-hat',   color: 'amber' },
  { key: 'ch',  label: 'Capital Humano', icon: 'fas fa-users',      color: 'blue' },
  { key: 'it',  label: 'IT',            icon: 'fas fa-laptop',     color: 'violet' },
];

const filtros   = reactive({ cedula: '', fechaInicio: '', fechaFin: '' });
const resultados = ref([]);
const buscando  = ref(false);
const buscado   = ref(false);

const pazSalvoModal = reactive({ visible: false, item: null });

function formatFecha(f) {
  if (!f) return '—';
  return f.split('-').reverse().join('/');
}
function formatFechaHoy() {
  return new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}
function progreso(ps) {
  if (!ps) return 0;
  return Math.round(([ps.sst_ok, ps.ch_ok, ps.it_ok].filter(Boolean).length / 3) * 100);
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
  buscando.value = true;
  buscado.value  = true;
  try {
    const params = {};
    if (filtros.cedula)     params.cedula      = filtros.cedula.trim();
    if (filtros.fechaInicio) params.fechaInicio = filtros.fechaInicio;
    if (filtros.fechaFin)   params.fechaFin    = filtros.fechaFin;
    if (props.company && props.company !== 'Todas') params.company = props.company;

    const { data } = await axios.get(`${API_URL}/novedades/paz-salvo/buscar`, { params });
    // API_URL ya incluye /usuarios → ruta final: /usuarios/novedades/paz-salvo/buscar
    resultados.value = data.map(r => ({ ...r, _iniciando: false }));
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
  pazSalvoModal.item    = item;
  pazSalvoModal.visible = true;
}

function imprimirPazYSalvo() {
  const contenido = document.getElementById('paz-salvo-print')?.innerHTML;
  if (!contenido) return;
  const w = window.open('', '_blank');
  w.document.write(`
    <html><head><title>Paz y Salvo</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
      h3 { color: #1a1a1a; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
      .card { border: 1px solid #16a34a; border-radius: 8px; padding: 12px; background: #f0fdf4; }
      .label { font-weight: 600; color: #16a34a; font-size: 12px; }
      .small { font-size: 11px; color: #666; margin-top: 4px; }
      .center { text-align: center; }
      .border-b { border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px; }
      .badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 600; }
    </style>
    </head><body>${contenido}</body></html>
  `);
  w.document.close();
  w.print();
}
</script>

