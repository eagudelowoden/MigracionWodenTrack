<template>
  <div class="h-full flex flex-col gap-3 animate-fade-in">

    <!-- ── Header ───────────────────────────────────────────────── -->
    <div class="flex items-center justify-between px-3 py-2.5 rounded-xl border shrink-0"
      :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <i class="fas fa-bell text-violet-500 text-xs"></i>
        </div>
        <div>
          <h2 class="text-[11px] font-semibold uppercase tracking-wider"
            :class="isDark ? 'text-white' : 'text-slate-700'">Recordatorios Automáticos</h2>
          <p class="text-[9px] font-medium opacity-40 uppercase tracking-wide"
            :class="isDark ? 'text-white' : 'text-slate-500'">
            {{ lista.filter(r => r.activo).length }} activo{{ lista.filter(r => r.activo).length !== 1 ? 's' : '' }} de {{ lista.length }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button @click="abrirNuevo"
          class="h-7 px-3 rounded-lg text-[9px] font-bold uppercase tracking-wide bg-violet-500 text-white hover:bg-violet-600 transition-all flex items-center gap-1.5">
          <i class="fas fa-plus text-[9px]"></i> Nuevo
        </button>
        <button @click="cargar" :disabled="cargando"
          class="h-7 w-7 rounded-lg border flex items-center justify-center transition-all"
          :class="isDark ? 'border-white/10 text-white/40 hover:bg-white/5' : 'border-slate-200 text-slate-400 hover:bg-slate-50'">
          <i class="fas fa-rotate text-[10px]" :class="cargando ? 'fa-spin' : ''"></i>
        </button>
      </div>
    </div>

    <!-- ── Contenido ─────────────────────────────────────────────── -->
    <div class="flex-1 min-h-0 flex gap-3 overflow-hidden">

      <!-- Lista de recordatorios -->
      <div class="flex-1 min-w-0 flex flex-col gap-2 overflow-y-auto pr-1">

        <div v-if="cargando" class="flex items-center justify-center h-32">
          <i class="fas fa-circle-notch fa-spin text-violet-500 text-xl"></i>
        </div>

        <div v-else-if="!lista.length"
          class="flex flex-col items-center justify-center h-40 gap-2 rounded-xl border"
          :class="isDark ? 'border-white/5' : 'border-slate-200'">
          <i class="fas fa-bell-slash text-4xl opacity-10" :class="isDark ? 'text-white' : 'text-slate-400'"></i>
          <p class="text-[11px] opacity-30" :class="isDark ? 'text-white' : 'text-slate-500'">
            Sin recordatorios configurados. Crea uno con el botón "Nuevo".
          </p>
        </div>

        <div v-for="rec in lista" :key="rec.id"
          class="rounded-xl border p-3 transition-all"
          :class="[
            isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200',
            !rec.activo ? 'opacity-50' : ''
          ]">
          <div class="flex items-start gap-3">
            <!-- Icono canal -->
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              :class="rec.activo ? 'bg-violet-500/10' : isDark ? 'bg-white/5' : 'bg-slate-100'">
              <i :class="[canalIcon(rec.canal), rec.activo ? 'text-violet-500' : 'text-slate-400', 'text-xs']"></i>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[11px] font-bold"
                  :class="isDark ? 'text-white' : 'text-slate-800'">{{ rec.nombre }}</span>
                <span class="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase"
                  :class="rec.activo
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : isDark ? 'bg-white/5 text-white/30' : 'bg-slate-100 text-slate-400'">
                  {{ rec.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
              <p class="text-[10px] opacity-60 mt-0.5 truncate"
                :class="isDark ? 'text-white' : 'text-slate-600'">{{ rec.mensaje }}</p>

              <!-- Días + hora -->
              <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                <div class="flex gap-0.5">
                  <span v-for="(d, i) in DIAS" :key="i"
                    class="w-5 h-5 rounded text-[8px] font-bold flex items-center justify-center"
                    :class="parseDias(rec.dias).includes(i)
                      ? 'bg-violet-500 text-white'
                      : isDark ? 'bg-white/5 text-white/20' : 'bg-slate-100 text-slate-300'">
                    {{ d }}
                  </span>
                </div>
                <div class="flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold"
                  :class="isDark ? 'border-white/10 text-white/60' : 'border-slate-200 text-slate-500'">
                  <i class="fas fa-clock text-[8px]"></i>
                  {{ rec.hora }}
                </div>
                <div class="flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px]"
                  :class="isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'">
                  <i :class="canalIcon(rec.canal)" class="text-[8px]"></i>
                  {{ canalLabel(rec.canal) }}
                </div>
              </div>

              <!-- Destinatarios -->
              <div v-if="parseDests(rec.destinatarios).length" class="flex flex-wrap gap-1 mt-1.5">
                <span v-for="d in parseDests(rec.destinatarios)" :key="d.id_odoo"
                  class="px-1.5 py-0.5 rounded text-[8px]"
                  :class="isDark ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-500'">
                  {{ d.nombre }}
                </span>
              </div>
            </div>

            <!-- Acciones -->
            <div class="flex items-center gap-1 shrink-0">
              <button @click="disparar(rec)" title="Probar ahora"
                class="w-6 h-6 rounded-lg flex items-center justify-center transition-all text-amber-500 hover:bg-amber-500/10">
                <i class="fas fa-play text-[9px]"></i>
              </button>
              <button @click="abrirEditar(rec)" title="Editar"
                class="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                :class="isDark ? 'text-white/30 hover:bg-white/5 hover:text-white' : 'text-slate-400 hover:bg-slate-100'">
                <i class="fas fa-pencil text-[9px]"></i>
              </button>
              <button @click="toggleActivo(rec)" :title="rec.activo ? 'Desactivar' : 'Activar'"
                class="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                :class="rec.activo
                  ? 'text-emerald-500 hover:bg-emerald-500/10'
                  : isDark ? 'text-white/20 hover:bg-white/5' : 'text-slate-300 hover:bg-slate-100'">
                <i :class="rec.activo ? 'fas fa-toggle-on' : 'fas fa-toggle-off'" class="text-sm"></i>
              </button>
              <button @click="eliminar(rec)" title="Eliminar"
                class="w-6 h-6 rounded-lg flex items-center justify-center transition-all text-rose-500 hover:bg-rose-500/10">
                <i class="fas fa-trash-can text-[9px]"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Panel formulario ───────────────────────────────────── -->
      <div v-if="form.abierto"
        class="w-80 shrink-0 rounded-xl border overflow-hidden flex flex-col"
        :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">

        <div class="px-4 py-3 border-b flex items-center justify-between shrink-0"
          :class="isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'">
          <span class="text-[10px] font-bold uppercase tracking-wider opacity-60"
            :class="isDark ? 'text-white' : 'text-slate-600'">
            {{ form.id ? 'Editar recordatorio' : 'Nuevo recordatorio' }}
          </span>
          <button @click="form.abierto = false"
            class="w-5 h-5 rounded flex items-center justify-center opacity-40 hover:opacity-100 transition-all"
            :class="isDark ? 'text-white' : 'text-slate-500'">
            <i class="fas fa-xmark text-[10px]"></i>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

          <!-- Nombre -->
          <div>
            <label class="block text-[9px] font-bold uppercase tracking-wider mb-1 opacity-50"
              :class="isDark ? 'text-white' : 'text-slate-600'">Nombre</label>
            <input v-model="form.nombre" type="text" placeholder="Ej: Recordatorio cargue mallas"
              class="w-full h-8 px-3 rounded-lg border text-[10px] outline-none"
              :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'" />
          </div>

          <!-- Mensaje -->
          <div>
            <label class="block text-[9px] font-bold uppercase tracking-wider mb-1 opacity-50"
              :class="isDark ? 'text-white' : 'text-slate-600'">Mensaje</label>
            <textarea v-model="form.mensaje" rows="3" placeholder="Texto del recordatorio…"
              class="w-full px-3 py-2 rounded-lg border text-[10px] outline-none resize-none"
              :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'"></textarea>
          </div>

          <!-- Días -->
          <div>
            <label class="block text-[9px] font-bold uppercase tracking-wider mb-1.5 opacity-50"
              :class="isDark ? 'text-white' : 'text-slate-600'">Días de envío</label>
            <div class="flex gap-1">
              <button v-for="(d, i) in DIAS" :key="i" @click="toggleDia(i)"
                class="flex-1 h-7 rounded-lg text-[9px] font-bold transition-all"
                :class="form.dias.includes(i)
                  ? 'bg-violet-500 text-white'
                  : isDark ? 'bg-white/5 text-white/30 hover:bg-white/10' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'">
                {{ d }}
              </button>
            </div>
          </div>

          <!-- Hora -->
          <div>
            <label class="block text-[9px] font-bold uppercase tracking-wider mb-1 opacity-50"
              :class="isDark ? 'text-white' : 'text-slate-600'">Hora de envío</label>
            <input v-model="form.hora" type="time"
              class="w-full h-8 px-3 rounded-lg border text-[10px] outline-none"
              :class="isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'" />
          </div>

          <!-- Canal -->
          <div>
            <label class="block text-[9px] font-bold uppercase tracking-wider mb-1.5 opacity-50"
              :class="isDark ? 'text-white' : 'text-slate-600'">Canal de notificación</label>
            <div class="flex gap-1.5">
              <button v-for="c in CANALES" :key="c.value" @click="form.canal = c.value"
                class="flex-1 h-7 rounded-lg text-[9px] font-bold transition-all flex items-center justify-center gap-1"
                :class="form.canal === c.value
                  ? 'bg-violet-500 text-white'
                  : isDark ? 'bg-white/5 text-white/30 hover:bg-white/10' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'">
                <i :class="c.icon" class="text-[8px]"></i>{{ c.label }}
              </button>
            </div>
          </div>

          <!-- Destinatarios por cédula -->
          <div>
            <label class="block text-[9px] font-bold uppercase tracking-wider mb-1.5 opacity-50"
              :class="isDark ? 'text-white' : 'text-slate-600'">Destinatarios</label>

            <!-- Chips de destinatarios agregados -->
            <div v-if="form.destsList.length" class="flex flex-wrap gap-1 mb-2">
              <span v-for="d in form.destsList" :key="d.id_odoo"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold"
                :class="isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-700'">
                {{ d.nombre }}
                <button @click="quitarDestinatarioRec(d.id_odoo)" class="opacity-60 hover:opacity-100 ml-0.5">
                  <i class="fas fa-xmark text-[8px]"></i>
                </button>
              </span>
            </div>

            <!-- Búsqueda por cédula -->
            <div class="flex gap-1.5">
              <input v-model="cedulaRec" type="text" placeholder="Buscar por cédula…"
                @keydown.enter.prevent="buscarDestinatarioRec"
                class="flex-1 h-7 px-2.5 rounded-lg border text-[10px] outline-none"
                :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'" />
              <button @click="buscarDestinatarioRec" :disabled="buscandoRec || !cedulaRec.trim()"
                class="h-7 px-2.5 rounded-lg text-[9px] font-bold bg-violet-500 text-white hover:bg-violet-600 transition-all disabled:opacity-40 flex items-center gap-1">
                <i :class="buscandoRec ? 'fas fa-circle-notch fa-spin' : 'fas fa-search'" class="text-[9px]"></i>
              </button>
            </div>

            <!-- Preview resultado -->
            <div v-if="resultadoRec" class="mt-1.5 px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-2"
              :class="isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'">
              <div class="flex items-center gap-1.5 min-w-0">
                <i class="fas fa-user-check text-emerald-500 text-[10px] shrink-0"></i>
                <span class="text-[10px] font-semibold truncate" :class="isDark ? 'text-white' : 'text-slate-800'">{{ resultadoRec.nombre }}</span>
              </div>
              <button @click="agregarDestinatarioRec"
                class="h-6 px-2 rounded-lg text-[8px] font-bold uppercase bg-violet-500 text-white hover:bg-violet-600 transition-all shrink-0">
                + Agregar
              </button>
            </div>
            <p v-if="errorRec" class="text-[9px] text-rose-500 mt-0.5">{{ errorRec }}</p>
            <p class="text-[9px] opacity-30 mt-0.5" :class="isDark ? 'text-white' : 'text-slate-500'">
              Dejar vacío para notificar a todos los conectados
            </p>
          </div>

          <!-- Activo -->
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-semibold opacity-60"
              :class="isDark ? 'text-white' : 'text-slate-600'">Activar al guardar</span>
            <button @click="form.activo = !form.activo"
              class="transition-all" :class="form.activo ? 'text-emerald-500' : 'text-slate-400'">
              <i :class="form.activo ? 'fas fa-toggle-on text-xl' : 'fas fa-toggle-off text-xl'"></i>
            </button>
          </div>
        </div>

        <!-- Botones guardar -->
        <div class="px-4 py-3 border-t flex gap-2 shrink-0"
          :class="isDark ? 'border-white/5' : 'border-slate-100'">
          <button @click="guardar" :disabled="guardando || !form.nombre.trim() || !form.hora || !form.dias.length"
            class="flex-1 h-8 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-40 transition-all">
            <i v-if="guardando" class="fas fa-circle-notch fa-spin mr-1"></i>
            {{ form.id ? 'Guardar cambios' : 'Crear recordatorio' }}
          </button>
          <button @click="form.abierto = false"
            class="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
            :class="isDark ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'">
            Cancelar
          </button>
        </div>
      </div>

    </div>

    <!-- Nota informativa -->
    <div class="px-3 py-2 rounded-xl border shrink-0"
      :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
      <p class="text-[9px] opacity-30" :class="isDark ? 'text-white' : 'text-slate-500'">
        <i class="fas fa-circle-info mr-1"></i>
        Los recordatorios se evalúan cada minuto. El botón <i class="fas fa-play"></i> permite probar el envío de inmediato sin esperar el horario configurado.
        Canal "Ambos" envía WebSocket + Email (requiere configuración SMTP activa).
      </p>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

const props = defineProps({ isDark: Boolean });
const emit  = defineEmits(['success', 'error']);
const API_URL = import.meta.env.VITE_API_URL;

const DIAS   = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const CANALES = [
  { value: 'websocket', label: 'Notif.',  icon: 'fas fa-bolt' },
  { value: 'email',     label: 'Email',   icon: 'fas fa-envelope' },
  { value: 'ambos',     label: 'Ambos',   icon: 'fas fa-layer-group' },
];

const lista    = ref([]);
const cargando = ref(false);
const guardando = ref(false);

const cedulaRec    = ref('');
const buscandoRec  = ref(false);
const resultadoRec = ref(null);
const errorRec     = ref('');

const formBase = () => ({
  abierto: false, id: null,
  nombre: '', mensaje: '', dias: [], hora: '08:00',
  canal: 'websocket', destsList: [], activo: true,
});
const form = reactive(formBase());

const buscarDestinatarioRec = async () => {
  if (!cedulaRec.value.trim()) return;
  buscandoRec.value = true;
  resultadoRec.value = null;
  errorRec.value = '';
  try {
    const r = await fetch(`${API_URL}/buscar-cedula/${encodeURIComponent(cedulaRec.value.trim())}`);
    if (!r.ok) { errorRec.value = 'No se encontró un usuario con esa cédula'; return; }
    const data = await r.json();
    if (form.destsList.some(d => d.id_odoo === data.id_odoo)) {
      errorRec.value = 'Ya está en la lista de destinatarios';
    } else {
      resultadoRec.value = data;
    }
  } catch { errorRec.value = 'Error al buscar. Intenta de nuevo.'; }
  finally { buscandoRec.value = false; }
};

const agregarDestinatarioRec = () => {
  if (!resultadoRec.value) return;
  form.destsList.push({ id_odoo: resultadoRec.value.id_odoo, nombre: resultadoRec.value.nombre });
  resultadoRec.value = null;
  cedulaRec.value = '';
  errorRec.value = '';
};

const quitarDestinatarioRec = (idOdoo) => {
  const idx = form.destsList.findIndex(d => d.id_odoo === idOdoo);
  if (idx !== -1) form.destsList.splice(idx, 1);
};

// ── Helpers ───────────────────────────────────────────────────
const parseDias  = (s) => { try { return JSON.parse(s || '[]'); } catch { return []; } };
const parseDests = (s) => { try { return JSON.parse(s || '[]'); } catch { return []; } };
const canalIcon  = (c) => c === 'email' ? 'fas fa-envelope' : c === 'ambos' ? 'fas fa-layer-group' : 'fas fa-bolt';
const canalLabel = (c) => c === 'email' ? 'Email' : c === 'ambos' ? 'Ambos' : 'WebSocket';

const toggleDia = (i) => {
  const idx = form.dias.indexOf(i);
  if (idx === -1) form.dias.push(i);
  else form.dias.splice(idx, 1);
};

// ── CRUD ──────────────────────────────────────────────────────
const cargar = async () => {
  cargando.value = true;
  try {
    const r = await fetch(`${API_URL}/recordatorios`);
    const d = await r.json();
    lista.value = Array.isArray(d) ? d : [];
  } catch { emit('error', 'Error cargando recordatorios'); }
  finally { cargando.value = false; }
};

const resetSearch = () => {
  cedulaRec.value = '';
  resultadoRec.value = null;
  errorRec.value = '';
};

const abrirNuevo = () => {
  Object.assign(form, formBase(), { abierto: true });
  resetSearch();
};

const abrirEditar = (rec) => {
  Object.assign(form, {
    abierto: true,
    id: rec.id,
    nombre: rec.nombre,
    mensaje: rec.mensaje,
    dias: parseDias(rec.dias),
    hora: rec.hora,
    canal: rec.canal,
    destsList: parseDests(rec.destinatarios),
    activo: rec.activo,
  });
  resetSearch();
};

const guardar = async () => {
  const payload = {
    nombre:       form.nombre.trim(),
    mensaje:      form.mensaje.trim(),
    dias:         form.dias,
    hora:         form.hora,
    canal:        form.canal,
    destinatarios: form.destsList,
    activo:       form.activo,
  };

  guardando.value = true;
  try {
    const url    = form.id ? `${API_URL}/recordatorios/${form.id}` : `${API_URL}/recordatorios`;
    const method = form.id ? 'PATCH' : 'POST';
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!r.ok) throw new Error('Error del servidor');
    emit('success', form.id ? 'Recordatorio actualizado' : 'Recordatorio creado');
    form.abierto = false;
    await cargar();
  } catch { emit('error', 'Error guardando recordatorio'); }
  finally { guardando.value = false; }
};

const toggleActivo = async (rec) => {
  try {
    await fetch(`${API_URL}/recordatorios/${rec.id}/toggle`, { method: 'PATCH' });
    rec.activo = !rec.activo;
  } catch { emit('error', 'Error cambiando estado'); }
};

const disparar = async (rec) => {
  try {
    await fetch(`${API_URL}/recordatorios/${rec.id}/disparar`, { method: 'POST' });
    emit('success', `Recordatorio "${rec.nombre}" enviado`);
  } catch { emit('error', 'Error al disparar recordatorio'); }
};

const eliminar = async (rec) => {
  if (!confirm(`¿Eliminar el recordatorio "${rec.nombre}"?`)) return;
  try {
    await fetch(`${API_URL}/recordatorios/${rec.id}`, { method: 'DELETE' });
    emit('success', 'Recordatorio eliminado');
    await cargar();
  } catch { emit('error', 'Error eliminando recordatorio'); }
};

onMounted(cargar);
</script>
