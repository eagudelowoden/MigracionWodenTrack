<template>
  <div class="h-full flex flex-col gap-0" :class="isDark ? 'text-white' : 'text-slate-900'">

    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
      :class="isDark ? 'bg-[#0d1117] border-[#222938]' : 'bg-white border-slate-200'">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/10">
          <i class="fas fa-building-user text-violet-400 text-[13px]"></i>
        </div>
        <div>
          <h2 class="text-[13px] font-semibold">Fondos de Empleados</h2>
          <p class="text-[10px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            Gestión de fondos y sus correos de notificación
          </p>
        </div>
      </div>
      <button @click="abrirModalFondo(null)"
        class="h-8 px-3 rounded-md text-[11px] font-medium bg-violet-500 text-white hover:bg-violet-600 flex items-center gap-1.5 transition-all">
        <i class="fas fa-plus text-[9px]"></i> Nuevo fondo
      </button>
    </div>

    <!-- Contenido -->
    <div class="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">

      <!-- Estado vacío -->
      <div v-if="!cargando && !fondos.length"
        class="flex-1 flex flex-col items-center justify-center gap-3 py-16 opacity-50">
        <i class="fas fa-building-user text-4xl" :class="isDark ? 'text-slate-600' : 'text-slate-400'"></i>
        <p class="text-[12px] font-medium" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
          No hay fondos creados. Crea el primero.
        </p>
      </div>

      <!-- Loader -->
      <div v-else-if="cargando" class="flex items-center justify-center py-16 opacity-50">
        <i class="fas fa-spinner fa-spin text-xl" :class="isDark ? 'text-slate-500' : 'text-slate-400'"></i>
      </div>

      <!-- Lista de fondos -->
      <div v-for="fondo in fondos" :key="fondo.id"
        class="rounded-xl border overflow-hidden"
        :class="isDark ? 'bg-[#0d1117] border-[#222938]' : 'bg-white border-slate-200'">

        <!-- Cabecera del fondo -->
        <div class="flex items-center justify-between px-4 py-3 border-b"
          :class="isDark ? 'border-[#222938] bg-[#111827]' : 'border-slate-100 bg-slate-50'">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center bg-violet-500/15">
              <i class="fas fa-building-user text-violet-400 text-[10px]"></i>
            </div>
            <div>
              <p class="text-[12px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">{{ fondo.nombre }}</p>
              <p class="text-[10px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                {{ fondo.correos?.length ?? 0 }} correo{{ (fondo.correos?.length ?? 0) !== 1 ? 's' : '' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <button @click="abrirModalFondo(fondo)"
              class="w-7 h-7 rounded-md flex items-center justify-center border transition-all"
              :class="isDark ? 'border-[#2d3548] text-slate-400 hover:text-white' : 'border-slate-200 text-slate-400 hover:text-slate-700'">
              <i class="fas fa-pen text-[9px]"></i>
            </button>
            <button @click="confirmarEliminar(fondo)"
              class="w-7 h-7 rounded-md flex items-center justify-center border transition-all"
              :class="isDark ? 'border-[#2d3548] text-slate-500 hover:text-red-400 hover:border-red-500/30' : 'border-slate-200 text-slate-400 hover:text-red-500'">
              <i class="fas fa-trash text-[9px]"></i>
            </button>
          </div>
        </div>

        <!-- Correos del fondo -->
        <div class="px-4 py-3 flex flex-col gap-2">
          <!-- Tags de correos -->
          <div v-if="fondo.correos?.length" class="flex flex-wrap gap-1.5">
            <div v-for="email in fondo.correos" :key="email"
              class="flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px]"
              :class="isDark ? 'border-[#2d3548] bg-[#1a2030] text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'">
              <i class="fas fa-envelope opacity-40 text-[8px]"></i>
              <span>{{ email }}</span>
              <button @click="quitarCorreoFondo(fondo, email)"
                class="ml-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all hover:bg-red-500/20">
                <i class="fas fa-xmark text-[7px] text-red-400"></i>
              </button>
            </div>
          </div>
          <p v-else class="text-[11px]" :class="isDark ? 'text-slate-600' : 'text-slate-400'">
            <i class="fas fa-info-circle mr-1 text-[9px]"></i>
            Sin correos asociados
          </p>

          <!-- Agregar correo al fondo -->
          <div class="flex items-center gap-2 pt-1 border-t" :class="isDark ? 'border-[#1a2030]' : 'border-slate-100'">
            <input
              v-model="fondo._nuevoCorreo"
              type="email"
              placeholder="agregar@correo.com"
              @keydown.enter="agregarCorreoFondo(fondo)"
              class="flex-1 h-7 px-2.5 rounded-md border text-[11px] outline-none transition-all"
              :class="isDark ? 'bg-[#0b0f19] border-[#222938] text-white placeholder:text-slate-600 focus:border-violet-500/50' : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-violet-400'" />
            <button @click="agregarCorreoFondo(fondo)"
              :disabled="!fondo._nuevoCorreo?.trim()"
              class="h-7 px-2.5 rounded-md text-[10px] font-medium bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 disabled:opacity-40 flex items-center gap-1 transition-all">
              <i class="fas fa-plus text-[8px]"></i> Agregar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal crear/editar fondo -->
    <Teleport to="body">
      <transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100" leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
        <div v-if="modal.visible" class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background:rgba(0,0,0,0.5);backdrop-filter:blur(3px)"
          @click.self="modal.visible = false">
          <div class="w-full max-w-sm rounded-xl border shadow-2xl overflow-hidden"
            :class="isDark ? 'bg-[#111318] border-[#222938]' : 'bg-white border-slate-200'">

            <div class="flex items-center justify-between px-5 py-3.5 border-b"
              :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
              <p class="text-[13px] font-semibold">
                {{ modal.editando ? 'Editar fondo' : 'Nuevo fondo de empleados' }}
              </p>
              <button @click="modal.visible = false"
                class="w-7 h-7 rounded-md flex items-center justify-center transition-all"
                :class="isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'">
                <i class="fas fa-times text-[10px]"></i>
              </button>
            </div>

            <div class="px-5 py-4">
              <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">Nombre del fondo</label>
              <input v-model="modal.nombre" type="text" placeholder="Ej: Coomeva, ARL Sura, Caja Compensación..."
                @keydown.enter="guardarFondo"
                class="w-full h-9 px-3 rounded-md border text-[12px] outline-none transition-all"
                :class="isDark ? 'bg-[#0b0f19] border-[#222938] text-white placeholder:text-slate-600 focus:border-violet-500/50' : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-violet-400'" />
            </div>

            <div class="flex items-center justify-end gap-2 px-5 py-3.5 border-t"
              :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
              <button @click="modal.visible = false"
                class="h-8 px-3 rounded-md text-[11px] font-medium border transition-all"
                :class="isDark ? 'border-[#2d3548] text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-700'">
                Cancelar
              </button>
              <button @click="guardarFondo"
                :disabled="!modal.nombre.trim() || guardando"
                class="h-8 px-4 rounded-md text-[11px] font-medium bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 flex items-center gap-1.5 transition-all">
                <i :class="guardando ? 'fas fa-spinner fa-spin' : 'fas fa-check'" class="text-[9px]"></i>
                {{ guardando ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Modal confirmar eliminación -->
    <Teleport to="body">
      <transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100">
        <div v-if="confirmDelete.visible" class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background:rgba(0,0,0,0.5);backdrop-filter:blur(3px)"
          @click.self="confirmDelete.visible = false">
          <div class="w-full max-w-xs rounded-xl border shadow-2xl overflow-hidden"
            :class="isDark ? 'bg-[#111318] border-[#222938]' : 'bg-white border-slate-200'">
            <div class="px-5 py-4 flex flex-col gap-2">
              <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-1">
                <i class="fas fa-trash text-red-400"></i>
              </div>
              <p class="text-[13px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">¿Eliminar fondo?</p>
              <p class="text-[11px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                Se eliminará <strong>{{ confirmDelete.fondo?.nombre }}</strong> y sus correos asociados. Esta acción no se puede deshacer.
              </p>
            </div>
            <div class="flex items-center justify-end gap-2 px-5 py-3 border-t"
              :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
              <button @click="confirmDelete.visible = false"
                class="h-8 px-3 rounded-md text-[11px] font-medium border transition-all"
                :class="isDark ? 'border-[#2d3548] text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500'">
                Cancelar
              </button>
              <button @click="eliminarFondo"
                class="h-8 px-4 rounded-md text-[11px] font-medium bg-red-500 text-white hover:bg-red-600 flex items-center gap-1.5 transition-all">
                <i class="fas fa-trash text-[9px]"></i> Eliminar
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
          <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="toast.error ? 'bg-red-400' : 'bg-emerald-400'"></span>
          <p class="text-[12px] font-medium text-white flex-1">{{ toast.mensaje }}</p>
        </div>
      </transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

const props = defineProps({ isDark: Boolean });

const API_URL = import.meta.env.VITE_API_URL;

const fondos   = ref([]);
const cargando = ref(false);
const guardando = ref(false);

const modal = reactive({ visible: false, editando: false, id: null, nombre: '' });
const confirmDelete = reactive({ visible: false, fondo: null });
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
    const res = await fetch(`${API_URL}/superadmin/fondos-empleados`, { cache: 'no-store' });
    if (!res.ok) throw new Error();
    const data = await res.json();
    // asegurar que cada fondo tenga _nuevoCorreo (campo local UI)
    fondos.value = data.map(f => ({ ...f, correos: f.correos ?? [], _nuevoCorreo: '' }));
  } catch { mostrarToast('Error al cargar fondos', true); }
  finally { cargando.value = false; }
}

onMounted(cargar);

function abrirModalFondo(fondo) {
  if (fondo) {
    Object.assign(modal, { visible: true, editando: true, id: fondo.id, nombre: fondo.nombre });
  } else {
    Object.assign(modal, { visible: true, editando: false, id: null, nombre: '' });
  }
}

async function guardarFondo() {
  if (!modal.nombre.trim()) return;
  guardando.value = true;
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    let res;
    if (modal.editando) {
      res = await fetch(`${API_URL}/superadmin/fondos-empleados/${modal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: modal.nombre.trim(), updatedBy: session.name || 'superadmin' }),
      });
    } else {
      res = await fetch(`${API_URL}/superadmin/fondos-empleados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: modal.nombre.trim(), createdBy: session.name || 'superadmin' }),
      });
    }
    if (!res.ok) throw new Error();
    modal.visible = false;
    mostrarToast(modal.editando ? 'Fondo actualizado' : 'Fondo creado');
    await cargar();
  } catch { mostrarToast('Error al guardar el fondo', true); }
  finally { guardando.value = false; }
}

function confirmarEliminar(fondo) {
  confirmDelete.fondo = fondo;
  confirmDelete.visible = true;
}

async function eliminarFondo() {
  if (!confirmDelete.fondo) return;
  try {
    const res = await fetch(`${API_URL}/superadmin/fondos-empleados/${confirmDelete.fondo.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error();
    confirmDelete.visible = false;
    mostrarToast('Fondo eliminado');
    await cargar();
  } catch { mostrarToast('Error al eliminar el fondo', true); }
}

async function agregarCorreoFondo(fondo) {
  const email = (fondo._nuevoCorreo ?? '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
  if (fondo.correos.includes(email)) {
    fondo._nuevoCorreo = '';
    return;
  }
  fondo.correos.push(email);
  fondo._nuevoCorreo = '';
  await persistirCorreosFondo(fondo);
}

async function quitarCorreoFondo(fondo, email) {
  fondo.correos = fondo.correos.filter(c => c !== email);
  await persistirCorreosFondo(fondo);
}

async function persistirCorreosFondo(fondo) {
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const res = await fetch(`${API_URL}/superadmin/fondos-empleados/${fondo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correos: fondo.correos, updatedBy: session.name || 'superadmin' }),
    });
    if (!res.ok) throw new Error();
    mostrarToast('Correos actualizados');
  } catch { mostrarToast('Error al guardar correos', true); }
}
</script>
