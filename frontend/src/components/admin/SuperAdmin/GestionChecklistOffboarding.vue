<template>
  <div class="h-full flex flex-col gap-0" :class="isDark ? 'text-white' : 'text-slate-900'">

    <!-- Header principal con selector de vista -->
    <div class="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
      :class="isDark ? 'bg-[#0d1117] border-[#222938]' : 'bg-white border-slate-200'">
      <div class="flex items-center gap-1 p-0.5 rounded-lg border"
        :class="isDark ? 'border-[#222938] bg-[#111827]' : 'border-slate-200 bg-slate-100'">
        <button @click="vistaActiva = 'checklist'"
          class="h-7 px-3 rounded-md text-[11px] font-medium transition-all"
          :class="vistaActiva === 'checklist'
            ? 'bg-emerald-500 text-white shadow-sm'
            : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')">
          <i class="fas fa-list-check mr-1.5 text-[9px]"></i>Checklist
        </button>
        <button @click="vistaActiva = 'fondos'"
          class="h-7 px-3 rounded-md text-[11px] font-medium transition-all"
          :class="vistaActiva === 'fondos'
            ? 'bg-violet-500 text-white shadow-sm'
            : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')">
          <i class="fas fa-building-user mr-1.5 text-[9px]"></i>Fondos de Empleados
        </button>
        <button @click="vistaActiva = 'recordatorio'"
          class="h-7 px-3 rounded-md text-[11px] font-medium transition-all"
          :class="vistaActiva === 'recordatorio'
            ? 'bg-amber-500 text-white shadow-sm'
            : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')">
          <i class="fas fa-bell mr-1.5 text-[9px]"></i>Recordatorio Automático
        </button>
      </div>

      <button v-if="vistaActiva === 'checklist'" @click="abrirModal(null)"
        class="h-8 px-3 rounded-md text-[11px] font-medium bg-emerald-500 text-white hover:bg-emerald-600 flex items-center gap-1.5 transition-all">
        <i class="fas fa-plus text-[9px]"></i> Nueva pregunta
      </button>
    </div>

    <!-- Vista: Fondos de Empleados -->
    <GestionFondoEmpleados v-if="vistaActiva === 'fondos'" :isDark="isDark" class="flex-1 min-h-0" />

    <!-- Vista: Recordatorio Automático -->
    <GestionOffboardingCron v-if="vistaActiva === 'recordatorio'" :isDark="isDark" class="flex-1 min-h-0 p-4 overflow-y-auto" />

    <!-- Vista: Checklist -->
    <template v-if="vistaActiva === 'checklist'">

    <!-- Tabs de módulo -->
    <div class="flex items-center gap-1 px-5 py-2.5 border-b shrink-0"
      :class="isDark ? 'bg-[#0d1117] border-[#222938]' : 'bg-white border-slate-100'">
      <button v-for="m in MODULOS" :key="m.key" @click="moduloActivo = m.key"
        class="h-7 px-3 rounded-md text-[11px] font-medium transition-all"
        :class="moduloActivo === m.key
          ? 'bg-emerald-500/15 text-emerald-500'
          : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')">
        <i :class="m.icon" class="mr-1.5 text-[9px]"></i>{{ m.label }}
        <span class="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full"
          :class="isDark ? 'bg-[#222938]' : 'bg-slate-100'">
          {{ contarPorModulo(m.key) }}
        </span>
      </button>
    </div>

    <!-- Tabla -->
    <div class="flex-1 overflow-y-auto">
      <table class="w-full text-[12px] border-collapse">
        <thead class="sticky top-0 z-10">
          <tr :class="isDark ? 'bg-[#111827] border-b border-[#222938]' : 'bg-slate-50 border-b border-slate-200'">
            <th class="text-left px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
              :class="isDark ? 'text-slate-500' : 'text-slate-400'" style="width:40px">#</th>
            <th class="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
              :class="isDark ? 'text-slate-500' : 'text-slate-400'">Pregunta</th>
            <th class="text-center px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
              :class="isDark ? 'text-slate-500' : 'text-slate-400'" style="width:90px">Estado</th>
            <th class="text-right px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
              :class="isDark ? 'text-slate-500' : 'text-slate-400'" style="width:100px">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando">
            <td colspan="4" class="text-center py-10 text-[12px]"
              :class="isDark ? 'text-slate-500' : 'text-slate-400'">
              <i class="fas fa-spinner fa-spin mr-2"></i>Cargando...
            </td>
          </tr>
          <tr v-else-if="!filas.length">
            <td colspan="4" class="text-center py-10 text-[12px]"
              :class="isDark ? 'text-slate-500' : 'text-slate-400'">
              <i class="fas fa-inbox mr-2 opacity-40"></i>Sin preguntas para este módulo
            </td>
          </tr>
          <tr v-for="(item, i) in filas" :key="item.id"
            class="border-b transition-colors"
            :class="isDark ? 'border-[#1a2030] hover:bg-[#111827]' : 'border-slate-100 hover:bg-slate-50'">
            <td class="px-5 py-3 font-mono text-[11px]"
              :class="isDark ? 'text-slate-600' : 'text-slate-400'">{{ i + 1 }}</td>
            <td class="px-4 py-3" :class="isDark ? 'text-slate-200' : 'text-slate-700'">
              {{ item.texto }}
            </td>
            <td class="px-4 py-3 text-center">
              <button @click="toggleActivo(item)"
                class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full transition-all"
                :class="item.activo
                  ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                  : 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20'">
                <span class="w-1.5 h-1.5 rounded-full"
                  :class="item.activo ? 'bg-emerald-400' : 'bg-slate-400'"></span>
                {{ item.activo ? 'Activa' : 'Inactiva' }}
              </button>
            </td>
            <td class="px-5 py-3 text-right">
              <div class="flex items-center justify-end gap-1">
                <button @click="abrirModal(item)"
                  class="w-7 h-7 rounded-md flex items-center justify-center border transition-all"
                  :class="isDark ? 'border-[#2d3548] text-slate-400 hover:text-white' : 'border-slate-200 text-slate-400 hover:text-slate-700'">
                  <i class="fas fa-pen text-[9px]"></i>
                </button>
                <button @click="confirmarEliminar(item)"
                  class="w-7 h-7 rounded-md flex items-center justify-center border transition-all"
                  :class="isDark ? 'border-[#2d3548] text-slate-500 hover:text-red-400 hover:border-red-500/30' : 'border-slate-200 text-slate-400 hover:text-red-500'">
                  <i class="fas fa-trash text-[9px]"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    </template><!-- /v-if checklist -->

    <!-- Modal crear / editar -->
    <Teleport to="body">
      <transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100" leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
        <div v-if="modal.visible" class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background:rgba(0,0,0,0.5);backdrop-filter:blur(3px)"
          @click.self="modal.visible = false">
          <div class="w-full max-w-md rounded-xl border shadow-2xl overflow-hidden"
            :class="isDark ? 'bg-[#111318] border-[#222938]' : 'bg-white border-slate-200'">

            <div class="flex items-center justify-between px-5 py-3.5 border-b"
              :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
              <p class="text-[13px] font-semibold">
                {{ modal.editando ? 'Editar pregunta' : 'Nueva pregunta' }}
              </p>
              <button @click="modal.visible = false"
                class="w-7 h-7 rounded-md flex items-center justify-center transition-all"
                :class="isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'">
                <i class="fas fa-times text-[10px]"></i>
              </button>
            </div>

            <div class="px-5 py-4 space-y-3.5">
              <!-- Módulo -->
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Módulo</label>
                <select v-model="modal.form.modulo"
                  class="w-full h-8 px-3 rounded-md border text-[12px] outline-none transition-all"
                  :class="isDark ? 'bg-[#0b0f19] border-[#222938] text-white focus:border-emerald-500/50' : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-400'">
                  <option v-for="m in MODULOS" :key="m.key" :value="m.key">{{ m.label }}</option>
                </select>
              </div>
              <!-- Texto -->
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Pregunta</label>
                <textarea v-model="modal.form.texto" rows="3"
                  placeholder="¿El colaborador entregó...?"
                  class="w-full px-3 py-2 rounded-md border text-[12px] outline-none resize-none transition-all"
                  :class="isDark ? 'bg-[#0b0f19] border-[#222938] text-white placeholder:text-slate-600 focus:border-emerald-500/50' : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-emerald-400'"></textarea>
              </div>
              <!-- Orden -->
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Orden</label>
                <input v-model.number="modal.form.orden" type="number" min="0"
                  class="w-24 h-8 px-3 rounded-md border text-[12px] outline-none transition-all"
                  :class="isDark ? 'bg-[#0b0f19] border-[#222938] text-white focus:border-emerald-500/50' : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-400'" />
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 px-5 py-3.5 border-t"
              :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
              <button @click="modal.visible = false"
                class="h-8 px-3 rounded-md text-[11px] font-medium border transition-all"
                :class="isDark ? 'border-[#2d3548] text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-700'">
                Cancelar
              </button>
              <button @click="guardar" :disabled="!modal.form.texto.trim() || guardando"
                class="h-8 px-4 rounded-md text-[11px] font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1.5 transition-all">
                <i :class="guardando ? 'fas fa-spinner fa-spin' : 'fas fa-check'" class="text-[9px]"></i>
                {{ guardando ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0" leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-1">
        <div v-if="toast.visible"
          class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border shadow-2xl"
          style="background:#111;border-color:rgba(255,255,255,0.1);min-width:220px;box-shadow:0 8px 32px rgba(0,0,0,0.5)">
          <span class="w-1.5 h-1.5 rounded-full shrink-0"
            :class="toast.error ? 'bg-red-400' : 'bg-emerald-400'"></span>
          <p class="text-[12px] font-medium text-white flex-1">{{ toast.mensaje }}</p>
        </div>
      </transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import axios from 'axios';
import GestionOffboardingCron from './GestionOffboardingCron.vue';
import GestionFondoEmpleados from './GestionFondoEmpleados.vue';

const props = defineProps({ isDark: Boolean });

const vistaActiva = ref('checklist');

const API_URL = import.meta.env.VITE_API_URL;

const MODULOS = [
  { key: 'sst', label: 'SST',            icon: 'fas fa-hard-hat' },
  { key: 'ch',  label: 'Capital Humano', icon: 'fas fa-users'    },
  { key: 'it',  label: 'IT',             icon: 'fas fa-laptop'   },
];

const items     = ref([]);
const cargando  = ref(false);
const guardando = ref(false);
const moduloActivo = ref('sst');

const filas = computed(() => items.value.filter(i => i.modulo === moduloActivo.value));
const totalActivos = computed(() => items.value.filter(i => i.activo).length);
const contarPorModulo = (key) => items.value.filter(i => i.modulo === key).length;

const modal = reactive({
  visible: false,
  editando: false,
  id: null,
  form: { modulo: 'sst', texto: '', orden: 0 },
});

const toast = reactive({ visible: false, mensaje: '', error: false });
let _toastTimer = null;
function mostrarToast(mensaje, error = false) {
  clearTimeout(_toastTimer);
  Object.assign(toast, { visible: true, mensaje, error });
  _toastTimer = setTimeout(() => { toast.visible = false; }, 3000);
}

async function cargar() {
  cargando.value = true;
  try {
    const { data } = await axios.get(`${API_URL}/offboarding/checklist/admin`);
    items.value = data;
  } catch { mostrarToast('Error al cargar', true); }
  finally { cargando.value = false; }
}

onMounted(cargar);

function abrirModal(item) {
  if (item) {
    Object.assign(modal, { editando: true, id: item.id, visible: true });
    Object.assign(modal.form, { modulo: item.modulo, texto: item.texto, orden: item.orden });
  } else {
    Object.assign(modal, { editando: false, id: null, visible: true });
    Object.assign(modal.form, { modulo: moduloActivo.value, texto: '', orden: filas.value.length });
  }
}

const session = JSON.parse(localStorage.getItem('user_session') || '{}');

async function guardar() {
  if (!modal.form.texto.trim()) return;
  guardando.value = true;
  try {
    if (modal.editando) {
      const { data } = await axios.patch(
        `${API_URL}/offboarding/checklist/${modal.id}`,
        { texto: modal.form.texto, orden: modal.form.orden },
      );
      const idx = items.value.findIndex(i => i.id === modal.id);
      if (idx !== -1) items.value[idx] = data;
    } else {
      const { data } = await axios.post(`${API_URL}/offboarding/checklist`, {
        ...modal.form,
        creado_por: session.name || 'Sistema',
      });
      items.value.push(data);
    }
    modal.visible = false;
    mostrarToast(modal.editando ? 'Pregunta actualizada' : 'Pregunta creada');
  } catch { mostrarToast('Error al guardar', true); }
  finally { guardando.value = false; }
}

async function toggleActivo(item) {
  try {
    const { data } = await axios.patch(
      `${API_URL}/offboarding/checklist/${item.id}`,
      { activo: !item.activo },
    );
    const idx = items.value.findIndex(i => i.id === item.id);
    if (idx !== -1) items.value[idx] = data;
    mostrarToast(data.activo ? 'Pregunta activada' : 'Pregunta desactivada');
  } catch { mostrarToast('Error al actualizar', true); }
}

async function confirmarEliminar(item) {
  if (!confirm(`¿Eliminar la pregunta?\n\n"${item.texto}"`)) return;
  try {
    await axios.delete(`${API_URL}/offboarding/checklist/${item.id}`);
    items.value = items.value.filter(i => i.id !== item.id);
    mostrarToast('Pregunta eliminada');
  } catch { mostrarToast('Error al eliminar', true); }
}
</script>
