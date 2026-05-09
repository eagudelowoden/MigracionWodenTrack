<template>
  <div class="h-full flex flex-col gap-3 animate-fade-in">

    <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3 overflow-hidden">

      <!-- ── Panel izquierdo: destinatarios ────────────────────── -->
      <div class="flex flex-col gap-2 overflow-hidden">

        <!-- Encabezado destinatarios -->
        <div class="px-3 py-2.5 rounded-xl border shrink-0 flex items-center justify-between"
          :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <i class="fas fa-users text-blue-500 text-[9px]"></i>
            </div>
            <span class="text-[10px] font-bold uppercase tracking-wider opacity-60"
              :class="isDark ? 'text-white' : 'text-slate-600'">Jefes de área</span>
          </div>
          <button @click="mostrarAgregar = !mostrarAgregar"
            class="w-6 h-6 rounded-lg flex items-center justify-center transition-all text-blue-500"
            :class="isDark ? 'bg-blue-500/10 hover:bg-blue-500/20' : 'bg-blue-50 hover:bg-blue-100'">
            <i class="fas fa-plus text-[9px]"></i>
          </button>
        </div>

        <!-- Formulario agregar destinatario -->
        <div v-if="mostrarAgregar"
          class="px-3 py-3 rounded-xl border shrink-0"
          :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
          <div class="flex flex-col gap-2">
            <input v-model="nuevoDestinatario.id_odoo" type="number" placeholder="ID Odoo del jefe"
              class="h-7 px-2.5 rounded-lg border text-[10px] outline-none w-full"
              :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'" />
            <input v-model="nuevoDestinatario.nombre" type="text" placeholder="Nombre completo"
              class="h-7 px-2.5 rounded-lg border text-[10px] outline-none w-full"
              :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'" />
            <input v-model="nuevoDestinatario.cargo" type="text" placeholder="Cargo (opcional)"
              class="h-7 px-2.5 rounded-lg border text-[10px] outline-none w-full"
              :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'" />
            <div class="flex gap-2">
              <button @click="agregarDestinatario"
                class="flex-1 h-7 rounded-lg text-[9px] font-bold uppercase tracking-wide bg-blue-500 text-white hover:bg-blue-600 transition-all">
                Agregar
              </button>
              <button @click="mostrarAgregar = false"
                class="h-7 px-3 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all"
                :class="isDark ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Lista destinatarios -->
        <div class="flex-1 min-h-0 rounded-xl border overflow-y-auto"
          :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
          <div v-if="!destinatarios.length" class="flex flex-col items-center justify-center h-full gap-2 py-8">
            <i class="fas fa-user-plus text-3xl opacity-10" :class="isDark ? 'text-white' : 'text-slate-400'"></i>
            <p class="text-[10px] opacity-30" :class="isDark ? 'text-white' : 'text-slate-500'">Sin jefes configurados</p>
          </div>
          <div v-for="d in destinatarios" :key="d.id_odoo"
            class="flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors border-b last:border-b-0"
            :class="[
              isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50',
              chatConversacion?.id_odoo === d.id_odoo
                ? isDark ? 'bg-blue-500/10' : 'bg-blue-50'
                : ''
            ]"
            @click="abrirChat(d)">
            <div class="relative shrink-0">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px]"
                :class="isDark ? 'bg-slate-600 text-white' : 'bg-slate-200 text-slate-600'">
                {{ d.nombre.charAt(0).toUpperCase() }}
              </div>
              <div v-if="estaConectado(d.id_odoo)"
                class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2"
                :class="isDark ? 'border-slate-800' : 'border-white'"></div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[10px] font-semibold truncate" :class="isDark ? 'text-white' : 'text-slate-800'">{{ d.nombre }}</div>
              <div class="text-[9px] opacity-40 truncate">{{ d.cargo || 'Jefe de área' }}</div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <span v-if="noLeidos[d.id_odoo]"
                class="w-4 h-4 rounded-full bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center">
                {{ noLeidos[d.id_odoo] }}
              </span>
              <button @click.stop="quitarDestinatario(d.id_odoo)"
                class="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-500/10 transition-all"
                title="Eliminar">
                <i class="fas fa-xmark text-[9px]"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Panel derecho: chat ────────────────────────────────── -->
      <div class="flex flex-col rounded-xl border overflow-hidden"
        :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">

        <!-- Estado vacío -->
        <div v-if="!chatConversacion" class="flex-1 flex flex-col items-center justify-center gap-3 opacity-30">
          <i class="fas fa-comments text-5xl" :class="isDark ? 'text-white' : 'text-slate-400'"></i>
          <p class="text-[11px]" :class="isDark ? 'text-white' : 'text-slate-500'">Selecciona un jefe para chatear</p>
        </div>

        <template v-else>
          <!-- Chat header -->
          <div class="px-4 py-2.5 border-b flex items-center gap-3 shrink-0"
            :class="isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'">
            <div class="relative">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px]"
                :class="isDark ? 'bg-slate-600 text-white' : 'bg-slate-200 text-slate-600'">
                {{ chatConversacion.nombre.charAt(0).toUpperCase() }}
              </div>
              <div v-if="estaConectado(chatConversacion.id_odoo)"
                class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2"
                :class="isDark ? 'border-slate-800' : 'border-white'"></div>
            </div>
            <div>
              <div class="text-[11px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">{{ chatConversacion.nombre }}</div>
              <div class="text-[9px] opacity-40">
                {{ estaConectado(chatConversacion.id_odoo) ? '🟢 Conectado' : '⚪ Desconectado' }}
              </div>
            </div>
          </div>

          <!-- Mensajes -->
          <div ref="mensajesContainer" class="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            <div v-if="chat.cargando" class="flex items-center justify-center py-8">
              <i class="fas fa-circle-notch fa-spin text-blue-500"></i>
            </div>
            <template v-else>
              <div v-if="!chat.mensajes.length" class="flex items-center justify-center py-8 opacity-30 text-[10px]">
                Sin mensajes aún. ¡Sé el primero en escribir!
              </div>
              <div v-for="msg in chat.mensajes" :key="msg.id"
                class="flex"
                :class="msg.de_id_odoo === 0 ? 'justify-end' : 'justify-start'">
                <div class="max-w-[75%] px-3 py-2 rounded-2xl text-[10px] leading-relaxed"
                  :class="msg.de_id_odoo === 0
                    ? 'bg-blue-500 text-white rounded-br-sm'
                    : isDark
                      ? 'bg-white/10 text-white rounded-bl-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'">
                  <div class="font-medium text-[9px] mb-0.5 opacity-70">{{ msg.de_nombre }}</div>
                  <div>{{ msg.contenido }}</div>
                  <div class="text-[8px] opacity-50 mt-1 text-right">{{ formatHora(msg.created_at) }}</div>
                </div>
              </div>
            </template>
          </div>

          <!-- Input enviar -->
          <div class="px-4 py-3 border-t shrink-0"
            :class="isDark ? 'border-white/5' : 'border-slate-100'">
            <div class="flex gap-2">
              <input v-model="chat.borrador"
                @keydown.enter.prevent="enviarMensaje"
                type="text" placeholder="Escribe un mensaje…"
                class="flex-1 h-8 px-3 rounded-xl border text-[10px] outline-none transition-all"
                :class="isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-700'" />
              <button @click="enviarMensaje" :disabled="!chat.borrador.trim()"
                class="h-8 w-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 bg-blue-500 text-white hover:bg-blue-600">
                <i class="fas fa-paper-plane text-[10px]"></i>
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue';
import { io } from 'socket.io-client';

const props = defineProps({ isDark: Boolean });
const emit  = defineEmits(['success', 'error']);
const API_URL = import.meta.env.VITE_API_URL;
const WS_URL  = (API_URL || '').replace('/api', '') || 'http://localhost:3000';

const session = JSON.parse(localStorage.getItem('user_session') || '{}');
const SA_ID   = 0; // superadmin usa id 0 para mensajes
const SA_NOMBRE = session.name || 'SuperAdmin';

const destinatarios   = ref([]);
const chatConversacion = ref(null);
const mostrarAgregar  = ref(false);
const noLeidos        = reactive({});
const sesionesActivas = ref(new Set()); // id_odoos conectados

const nuevoDestinatario = ref({ id_odoo: null, nombre: '', cargo: '' });

const chat = ref({ mensajes: [], borrador: '', cargando: false });
const mensajesContainer = ref(null);

let socket = null;

// ── WebSocket ─────────────────────────────────────────────────
const conectarSocket = () => {
  socket = io(`${WS_URL}/interno`, { transports: ['websocket'] });

  socket.on('connect', () => {
    socket.emit('join', { idOdoo: SA_ID, nombre: SA_NOMBRE, isSuperAdmin: true });
  });

  socket.on('new-message', (msg) => {
    if (chatConversacion.value && (
      msg.de_id_odoo === chatConversacion.value.id_odoo ||
      msg.para_id_odoo === chatConversacion.value.id_odoo
    )) {
      chat.value.mensajes.push(msg);
      scrollBottom();
    } else if (msg.de_id_odoo !== SA_ID) {
      noLeidos[msg.de_id_odoo] = (noLeidos[msg.de_id_odoo] || 0) + 1;
    }
  });

  socket.on('sessions-updated', async () => {
    await actualizarSesionesActivas();
  });
};

const actualizarSesionesActivas = async () => {
  try {
    const r = await fetch(`${API_URL}/superadmin/sesiones`);
    const data = await r.json();
    sesionesActivas.value = new Set(data.map(s => s.id_odoo));
  } catch {}
};

const estaConectado = (idOdoo) => sesionesActivas.value.has(idOdoo);

// ── Destinatarios ─────────────────────────────────────────────
const cargarDestinatarios = async () => {
  try {
    const r = await fetch(`${API_URL}/superadmin/mensajes/destinatarios`);
    destinatarios.value = await r.json();
    for (const d of destinatarios.value) {
      const r2 = await fetch(`${API_URL}/superadmin/mensajes/no-leidos/${d.id_odoo}`);
      noLeidos[d.id_odoo] = await r2.json();
    }
  } catch { emit('error', 'Error cargando destinatarios'); }
};

const agregarDestinatario = async () => {
  const { id_odoo, nombre, cargo } = nuevoDestinatario.value;
  if (!id_odoo || !nombre.trim()) return;
  try {
    const r = await fetch(`${API_URL}/superadmin/mensajes/destinatarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_odoo: +id_odoo, nombre: nombre.trim(), cargo: cargo.trim() || undefined }),
    });
    destinatarios.value = await r.json();
    nuevoDestinatario.value = { id_odoo: null, nombre: '', cargo: '' };
    mostrarAgregar.value = false;
    emit('success', 'Jefe agregado como destinatario');
  } catch { emit('error', 'Error agregando destinatario'); }
};

const quitarDestinatario = async (idOdoo) => {
  if (!confirm('¿Eliminar a este jefe de la lista de mensajería?')) return;
  try {
    const r = await fetch(`${API_URL}/superadmin/mensajes/destinatarios/${idOdoo}`, { method: 'DELETE' });
    destinatarios.value = await r.json();
    if (chatConversacion.value?.id_odoo === idOdoo) chatConversacion.value = null;
    emit('success', 'Destinatario eliminado');
  } catch { emit('error', 'Error eliminando destinatario'); }
};

// ── Chat ──────────────────────────────────────────────────────
const abrirChat = async (d) => {
  chatConversacion.value = d;
  noLeidos[d.id_odoo] = 0;
  chat.value = { mensajes: [], borrador: '', cargando: true };
  try {
    const r = await fetch(`${API_URL}/superadmin/mensajes/historial?de=${SA_ID}&para=${d.id_odoo}`);
    chat.value.mensajes = await r.json();
  } catch { emit('error', 'Error cargando historial'); }
  finally {
    chat.value.cargando = false;
    await nextTick();
    scrollBottom();
  }
};

const enviarMensaje = () => {
  if (!chat.value.borrador.trim() || !chatConversacion.value || !socket) return;
  socket.emit('send-message', {
    deIdOdoo:   SA_ID,
    deNombre:   SA_NOMBRE,
    paraIdOdoo: chatConversacion.value.id_odoo,
    paraNombre: chatConversacion.value.nombre,
    contenido:  chat.value.borrador.trim(),
  });
  chat.value.borrador = '';
};

const scrollBottom = () => {
  nextTick(() => {
    if (mensajesContainer.value) {
      mensajesContainer.value.scrollTop = mensajesContainer.value.scrollHeight;
    }
  });
};

const formatHora = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

onMounted(async () => {
  await Promise.all([cargarDestinatarios(), actualizarSesionesActivas()]);
  conectarSocket();
});

onUnmounted(() => {
  socket?.disconnect();
});
</script>
