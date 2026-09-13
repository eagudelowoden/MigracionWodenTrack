<template>
  <Transition name="slide-down">
    <div v-if="backendCaido"
      class="fixed top-0 left-0 right-0 z-[10001] h-10 flex items-center justify-center gap-2 px-6 shadow-lg text-[12px] font-semibold"
      :class="isDark ? 'bg-amber-600/95 text-white' : 'bg-amber-500 text-white'">
      <i class="fas fa-circle-notch fa-spin"></i>
      <span>Nuestros servicios no están disponibles. Espera un momento mientras terminamos…</span>
    </div>
  </Transition>

  <!-- ALERTA (rojo) / ACTUALIZACIÓN (verde esmeralda) → banner superior persistente -->
  <Transition name="slide-down">
    <div v-if="anuncioSuperior"
      class="fixed top-0 left-0 right-0 z-[10000] min-h-12 flex items-center justify-center px-6 shadow-2xl border-b backdrop-blur-md"
      :class="esAlerta
        ? (isDark ? 'bg-red-700/95 border-red-500 text-white' : 'bg-red-600 border-red-700 text-white')
        : (isDark ? 'bg-emerald-700/95 border-emerald-500 text-white' : 'bg-emerald-600 border-emerald-700 text-white')">

      <div class="flex items-center gap-4 w-full max-w-7xl justify-center py-2">
        <i class="text-lg flex-shrink-0"
          :class="esAlerta ? 'fas fa-exclamation-circle animate-pulse' : 'fas fa-rocket'"></i>

        <div class="min-w-0 text-center">
          <p v-if="anuncioSuperior.title"
            class="text-[10px] font-black uppercase tracking-[0.15em] opacity-80 leading-none mb-1">
            {{ anuncioSuperior.title }}
          </p>
          <p class="text-[14px] font-bold tracking-wide leading-snug font-sans">
            {{ anuncioSuperior.body }}
          </p>
        </div>

        <button @click="cerrarSuperior" :disabled="progSuperior < 1"
          class="ml-6 flex items-center gap-2 h-8 pl-2 pr-3 rounded-full transition-all flex-shrink-0"
          :class="progSuperior < 1 ? 'bg-black/10 cursor-wait' : 'bg-black/20 hover:bg-black/40'">
          <svg class="h-5 w-5 -rotate-90" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" class="opacity-25" />
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"
              stroke-dasharray="62.83" :stroke-dashoffset="62.83 * (1 - progSuperior)" />
          </svg>
          <span class="text-[11px] font-black uppercase tracking-wider">Entendido</span>
        </button>
      </div>
    </div>
  </Transition>

  <Transition name="fade">
    <div v-if="nuevaActualizacion" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
      style="background-color: rgba(2, 6, 23, 0.85); backdrop-filter: blur(12px);">
      <div class="flex flex-col items-center gap-6 p-8 rounded-3xl border shadow-2xl max-w-sm w-full text-center"
        :class="isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'">
        <div class="flex flex-col items-center gap-3">
          <div class="h-4 w-4 rounded-full bg-blue-500 animate-ping"></div>
          <h2 class="text-xl font-black uppercase tracking-widest" :class="isDark ? 'text-white' : 'text-slate-900'">
            Nueva Versión</h2>
          <p class="text-xs leading-relaxed" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Hay cambios en el
            sistema. Es necesario reiniciar para continuar.</p>
        </div>
        <button @click="recargarPagina"
          class="w-full py-4 rounded-2xl bg-blue-600 text-white font-black uppercase text-xs tracking-wider hover:bg-blue-500 transition-all">
          Actualizar Ahora
        </button>
      </div>
    </div>
  </Transition>

  <!-- INFORMACIÓN → burbuja flotante. Insiste mientras no se lee (pulso +
       globo con el título) y queda apagada para releer una vez leída. -->
  <Transition name="slide-up">
    <div v-if="anuncioLateral && !panelAbierto" class="wt-burbuja-wrap">

      <Transition name="slide-right">
        <button v-if="globoVisible" @click="abrirLateral" class="wt-globo">
          <span class="wt-globo-eyebrow">Comunicado</span>
          <span class="wt-globo-title">{{ anuncioLateral.title }}</span>
          <span class="wt-globo-cta">Toca para leer</span>
        </button>
      </Transition>

      <div class="wt-burbuja-box">
        <button @click="abrirLateral" class="wt-burbuja" :class="{ 'is-nuevo': !avisoLeido }"
          :aria-label="avisoLeido ? 'Ver comunicado' : 'Comunicado sin leer'">
          <span v-if="!avisoLeido" class="wt-burbuja-ping"></span>
          <i class="fas fa-bullhorn"></i>
        </button>

        <!-- Sin leer: punto rojo. Ya leído: X para retirar la burbuja. -->
        <span v-if="!avisoLeido" class="wt-burbuja-dot"></span>
        <button v-else @click.stop="descartarBurbuja" class="wt-burbuja-x" aria-label="Quitar aviso">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </Transition>

  <!-- INFORMACIÓN → Drawer lateral persistente. Sin icono de cerrar ni escape:
       la única salida es el botón "Entendido", habilitado tras DELAY_MS. -->
  <Drawer v-model:visible="drawerLateral" position="right" :modal="false" :dismissable="false"
    :showCloseIcon="puedeCerrar" :closeOnEscape="puedeCerrar" :blockScroll="false" class="wt-aviso-drawer">

    <template #header>
      <div class="flex items-start gap-3 min-w-0 w-full">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 wt-aviso-icon">
          <i class="fas fa-info-circle text-lg"></i>
        </div>
        <div class="min-w-0">
          <p class="text-[10px] font-black uppercase tracking-[0.15em] wt-aviso-eyebrow">Comunicado</p>
          <h3 class="text-base font-black leading-tight wt-aviso-title">{{ anuncioLateral?.title }}</h3>
        </div>
      </div>
    </template>

    <p class="text-[14px] leading-relaxed whitespace-pre-line break-words wt-aviso-body">
      {{ anuncioLateral?.body }}
    </p>

    <template #footer>
      <Button :disabled="progLateral < 1" @click="cerrarLateral" class="w-full justify-center wt-aviso-btn" size="small">
        <svg v-if="progLateral < 1" class="h-4 w-4 -rotate-90" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" class="opacity-30" />
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"
            stroke-dasharray="62.83" :stroke-dashoffset="62.83 * (1 - progLateral)" />
        </svg>
        <span class="font-black uppercase text-xs tracking-wider">Entendido</span>
      </Button>
    </template>
  </Drawer>

  <!-- Sistema bajo presión: consulta pesada rechazada (503 SISTEMA_OCUPADO) -->
  <Transition name="slide-up">
    <div v-if="sistemaOcupadoMsg"
      class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10002] max-w-md w-[92%] p-4 rounded-2xl border shadow-2xl flex items-center gap-3"
      :class="isDark ? 'bg-slate-900 border-amber-500/40 text-white' : 'bg-white border-amber-300 text-slate-800'">
      <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        :class="isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-500'">
        <i class="fas fa-hourglass-half"></i>
      </div>
      <p class="flex-1 text-[12px] font-semibold leading-snug">{{ sistemaOcupadoMsg }}</p>
      <button @click="sistemaOcupadoMsg = null" class="opacity-40 hover:opacity-100 flex-shrink-0">
        <i class="fas fa-times text-[13px]"></i>
      </button>
    </div>
  </Transition>

  <!-- Sesión expirada por inactividad -->
  <Transition name="fade">
    <div v-if="sesionExpirada" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
      style="background-color: rgba(2, 6, 23, 0.85); backdrop-filter: blur(12px);">
      <div class="flex flex-col items-center gap-6 p-8 rounded-3xl border shadow-2xl max-w-sm w-full text-center"
        :class="isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'">
        <div class="flex flex-col items-center gap-3">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center"
            :class="isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-500'">
            <i class="fas fa-clock text-lg"></i>
          </div>
          <h2 class="text-lg font-black" :class="isDark ? 'text-white' : 'text-slate-900'">Tu sesión expiró</h2>
          <p class="text-xs leading-relaxed" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            Por seguridad, cerramos tu sesión tras un tiempo sin actividad. Ingresa de nuevo para continuar.
          </p>
        </div>
        <button @click="cerrarAviso"
          class="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-black uppercase text-xs tracking-wider hover:bg-blue-500 transition-all">
          Ingresar de nuevo
        </button>
      </div>
    </div>
  </Transition>

  <main :class="{ 'pt-12 transition-all': anuncioSuperior, 'pt-10 transition-all': !anuncioSuperior && backendCaido }">
    <router-view />
  </main>
</template>

<script setup>
import { apiFetch } from '@/utils/apiFetch.js';
import { ref, computed, onMounted } from 'vue';
import { io } from 'socket.io-client';
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import { useInactividad } from './composables/useInactividad';
import { useAttendance } from './composables/UserLogica/useAttendance.js';

const { isDark } = useAttendance();
const { sesionExpirada, cerrarAviso } = useInactividad(10);

const nuevaActualizacion = ref(false);
// 'info' → panel lateral | 'alert' (rojo) y 'update' (verde) → banner superior
const anuncioLateral = ref(null);
const anuncioSuperior = ref(null);
const esAlerta = computed(() => anuncioSuperior.value?.type === 'alert');
// Estado de la burbuja: el aviso puede existir con el panel cerrado.
const panelAbierto = ref(false);   // ¿el Drawer está desplegado?
const avisoLeido = ref(false);     // ¿ya pulsó "Entendido"?
const globoVisible = ref(false);   // globo con el título, al llegar el aviso
const GLOBO_MS = 7000;
let _globoTimer = null;

// La X aparece junto con el botón: antes de los 3 s no hay salida, después
// las dos vías cierran igual (ambas pasan por cerrarLateral → marca leído).
const puedeCerrar = computed(() => progLateral.value >= 1);

const drawerLateral = computed({
  get: () => panelAbierto.value && !!anuncioLateral.value,
  set: (v) => { if (!v) cerrarLateral(); },
});

// --- Avisos ya leídos: se guardan por id para NO repetirlos en cada recarga.
// Si el aviso vuelve en cada refresco, la gente aprende a ignorarlo.
const VISTOS_KEY = 'wt_avisos_vistos';
// Descartar la burbuja es distinto de leer el aviso: hay que recordarlo aparte
// o la burbuja reaparece en la siguiente recarga.
const DESCARTADOS_KEY = 'wt_avisos_descartados';
const leerIds = (k) => {
  try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; }
};
const guardarId = (k, id) => {
  const v = leerIds(k);
  if (!v.includes(id)) localStorage.setItem(k, JSON.stringify(v.concat(id).slice(-80)));
};
const leerVistos = () => leerIds(VISTOS_KEY);
const yaVisto = (a) => !!a?.id && leerVistos().includes(a.id);
const marcarVisto = (a) => { if (a?.id) guardarId(VISTOS_KEY, a.id); };
const yaDescartado = (a) => !!a?.id && leerIds(DESCARTADOS_KEY).includes(a.id);

// --- Retardo antes de poder descartar: obliga a un mínimo de lectura.
const DELAY_MS = 3000;
const progSuperior = ref(0);
const progLateral = ref(0);
let _tickSup = null, _tickLat = null;
const iniciarCuenta = (cual) => {
  const inicio = Date.now();
  const prog = cual === 'sup' ? progSuperior : progLateral;
  prog.value = 0;
  clearInterval(cual === 'sup' ? _tickSup : _tickLat);
  const id = setInterval(() => {
    prog.value = Math.min(1, (Date.now() - inicio) / DELAY_MS);
    if (prog.value >= 1) clearInterval(id);
  }, 50);
  if (cual === 'sup') _tickSup = id; else _tickLat = id;
};

const mostrarAnuncio = (data) => {
  if (!data) return;

  // 'info' → burbuja flotante. A diferencia de los banners, un aviso ya leído
  // NO se descarta: la burbuja queda (apagada) para poder releerlo mientras el
  // comunicado siga activo. Solo desaparece si se desactiva desde la consola.
  if (data.type === 'info') {
    if (yaDescartado(data)) return;
    anuncioLateral.value = data;
    avisoLeido.value = yaVisto(data);
    panelAbierto.value = false;
    if (avisoLeido.value) {
      progLateral.value = 1;   // ya lo leyó: sin retardo al reabrir
      globoVisible.value = false;
    } else {
      progLateral.value = 0;
      // El globo con el título se asoma unos segundos para que la burbuja no
      // pase desapercibida, y luego se repliega dejando solo el punto.
      globoVisible.value = true;
      clearTimeout(_globoTimer);
      _globoTimer = setTimeout(() => { globoVisible.value = false; }, GLOBO_MS);
    }
    return;
  }

  if (yaVisto(data)) return;
  anuncioSuperior.value = data;
  iniciarCuenta('sup');
};

const abrirLateral = () => {
  globoVisible.value = false;
  clearTimeout(_globoTimer);
  panelAbierto.value = true;
  if (!avisoLeido.value) iniciarCuenta('lat');
};

const cerrarSuperior = () => { marcarVisto(anuncioSuperior.value); anuncioSuperior.value = null; };

// Cierra el panel pero conserva la burbuja: el aviso queda disponible.
const cerrarLateral = () => {
  marcarVisto(anuncioLateral.value);
  avisoLeido.value = true;
  progLateral.value = 1;
  panelAbierto.value = false;
};

// X de la burbuja: la retira para siempre (para este navegador), aunque el
// comunicado siga activo en la consola.
const descartarBurbuja = () => {
  if (anuncioLateral.value?.id) guardarId(DESCARTADOS_KEY, anuncioLateral.value.id);
  marcarVisto(anuncioLateral.value);
  limpiarLateral();
};

// Desactivado desde la consola de admin → se va todo, burbuja incluida.
const limpiarLateral = () => {
  clearTimeout(_globoTimer);
  globoVisible.value = false;
  panelAbierto.value = false;
  anuncioLateral.value = null;
};
// true mientras el backend no responde (ej. reiniciando por un deploy)
const backendCaido = ref(false);
// Mensaje amable cuando el sistema rechaza una consulta pesada por presión
const sistemaOcupadoMsg = ref(null);
let _sistemaOcupadoTimer = null;

const API_BASE = import.meta.env.VITE_API_URL.replace('/usuarios', '');

// --- 🔵 LÓGICA DE NOTIFICACIONES (SOCKETS) ---
// Incluimos 'polling' como respaldo: si IIS no proxea bien el WebSocket en
// producción, socket.io conecta igual por long-polling (vía el reverse proxy
// HTTP normal), de modo que el evento 'disconnect' sí se dispare ante una caída.
const socket = io(API_BASE, { transports: ['websocket', 'polling'], forceNew: true });

const cargarAnuncioActivo = async () => {
  try {
    const res = await apiFetch(`${API_BASE}/usuarios/notifications/active`);
    if (!res.ok) return;

    const text = await res.text(); // 👈 primero como texto
    if (!text) return;             // 👈 si está vacío, salir

    const data = JSON.parse(text); // 👈 luego parsear
    if (data && data.is_active) {
      mostrarAnuncio(data);
    }
  } catch (e) {
    console.error("Error cargando anuncio:", e);
  }
};


// connect_error puede dispararse en una recarga normal (el socket nuevo aún no
// conecta a través del proxy de IIS) → NO encendemos el banner directo, sino
// que confirmamos con un chequeo HTTP real para evitar falsos positivos.
let _healthCheckTimer = null;
const programarChequeoSalud = () => {
  clearTimeout(_healthCheckTimer);
  _healthCheckTimer = setTimeout(verificarVersion, 800);
};

// Latch: ¿el socket llegó a conectar alguna vez en esta carga de página?
// Sirve para distinguir "recarga normal que aún no conecta" (no mostrar banner)
// de "reconexión fallida tras una caída real" (mostrar banner de inmediato).
let _socketYaConecto = false;

const setupSockets = () => {
  socket.on('connect', () => {
    _socketYaConecto = true;
    verificarVersion();
  });

  // disconnect = la conexión ESTABA viva y se perdió → caída real → banner ya.
  // disconnect puede dispararse por un event loop bloqueado durante una consulta
  // pesada (no una caída real). Confirmamos por HTTP antes de mostrar el banner.
  socket.on('disconnect', () => { programarChequeoSalud(); });

  // connect_error: si YA habíamos conectado, es una reconexión que falla tras una
  // caída real → banner inmediato (los intentos de reconexión fallan al instante
  // porque el proxy no alcanza el backend; ESTO es lo que da la rapidez en IIS).
  // Si nunca conectamos (recarga normal), confirmamos por HTTP para no parpadear.
  socket.on('connect_error', () => {
    if (_socketYaConecto) backendCaido.value = true;
    else programarChequeoSalud();
  });

  socket.on('onNotification', (data) => {
    if (data.is_active === false) {
      anuncioSuperior.value = null;
      limpiarLateral();
      return;
    }
    mostrarAnuncio(data);
  });
};
// --- 🟢 LÓGICA DE VERSIÓN ---
let _retryTimeout = null;
// Cuenta fallos seguidos del health check. Un solo fallo puede ser un bloqueo
// transitorio del event loop (backend procesando un reporte pesado unos
// segundos), NO una caída. Solo tras 2 fallos seguidos mostramos el banner.
let _fallosConsecutivos = 0;

const verificarVersion = async () => {
  try {
    // Timeout corto: si /version no responde rápido, lo damos por caído sin
    // esperar el timeout largo del navegador (detección inmediata).
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    let res;
    try {
      res = await apiFetch(`${API_BASE}/version?t=${Date.now()}`, { signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }

    if (res.url.includes('mantenimiento.html') || res.status === 503) {
      window.location.reload(true);
      return;
    }

    // OJO: detrás de IIS, un backend caído devuelve 502/504 (hay "respuesta"
    // pero NO está vivo). Solo un 2xx con JSON de versión válido cuenta como
    // vivo; cualquier otra cosa la tratamos como caída → al catch.
    if (!res.ok) throw new Error(`status ${res.status}`);

    const data = await res.json();
    const versionServidor = String(data.version).trim();

    // Confirmado vivo SOLO aquí (tras leer una versión válida). Hacerlo antes
    // causaba un parpadeo false→true en cada 502 del proxy.
    _fallosConsecutivos = 0;
    backendCaido.value = false;

    const versionGuardada = localStorage.getItem('app_version');
    if (versionGuardada && versionServidor !== versionGuardada) {
      nuevaActualizacion.value = true;
    } else if (!versionGuardada) {
      localStorage.setItem('app_version', versionServidor);
    }
  } catch {
    // Un solo fallo NO enciende el banner: puede ser un bloqueo transitorio del
    // event loop (backend procesando un reporte pesado unos segundos). Solo tras
    // 2 fallos consecutivos (caída real) mostramos "servicios no disponibles".
    // El primer fallo reintenta rápido (1.5 s) para confirmar si es real o no.
    _fallosConsecutivos++;
    if (_fallosConsecutivos >= 2) {
      backendCaido.value = true;
    }
    clearTimeout(_retryTimeout);
    _retryTimeout = setTimeout(verificarVersion, _fallosConsecutivos >= 2 ? 5000 : 1500);
  }
};

const recargarPagina = async () => {
  try {
    const res = await apiFetch(`${API_BASE}/version?t=${Date.now()}`);
    const data = await res.json();
    localStorage.setItem('app_version', String(data.version).trim());
    localStorage.removeItem('user_session');
    localStorage.removeItem('token');
    window.location.href = '/login';
  } catch { window.location.reload(true); }
};

// Escucha el evento que dispara axiosSetup cuando el backend responde 503
// SISTEMA_OCUPADO → muestra el toast amable y lo auto-oculta a los 6 s.
const onSistemaOcupado = (e) => {
  sistemaOcupadoMsg.value =
    e?.detail?.message || 'Ups, esto podría tardar un poco. Intenta de nuevo en unos segundos.';
  clearTimeout(_sistemaOcupadoTimer);
  _sistemaOcupadoTimer = setTimeout(() => { sistemaOcupadoMsg.value = null; }, 6000);
};

onMounted(() => {
  cargarAnuncioActivo();
  verificarVersion();
  setupSockets();
  window.addEventListener('sistema-ocupado', onSistemaOcupado);
  // Respaldo HTTP cada 8 s: garantiza detección de caída en ≤ 8 s aunque el
  // WebSocket no avise (caso típico detrás del proxy de IIS en producción).
  setInterval(verificarVersion, 8000);
  // Verificar al volver a la pestaña
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') verificarVersion();
  });
});
</script>
<style>
/* ── Burbuja flotante del comunicado ──────────────────────────────────── */
.wt-burbuja-wrap {
  --wt-aviso-accent: #2563eb;
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: .625rem;
  max-width: calc(100vw - 3rem);
}

.dark .wt-burbuja-wrap {
  --wt-aviso-accent: #3b82f6;
}

.wt-burbuja-box {
  position: relative;
  flex-shrink: 0;
}

.wt-burbuja {
  position: relative;
  height: 3.5rem;
  width: 3.5rem;
  flex-shrink: 0;
  border: none;
  border-radius: 9999px;
  background: var(--wt-aviso-accent);
  color: #fff;
  font-size: 1.125rem;
  cursor: pointer;
  box-shadow: 0 10px 25px -5px rgb(37 99 235 / .5);
  transition: transform .2s cubic-bezier(.16, 1, .3, 1), box-shadow .2s ease;
}

.wt-burbuja:hover {
  transform: scale(1.08);
  box-shadow: 0 14px 30px -5px rgb(37 99 235 / .6);
}

.wt-burbuja:active {
  transform: scale(.96);
}

/* Sin leer: la burbuja late despacio para pedir atención. */
.wt-burbuja.is-nuevo {
  animation: wt-latido 2.2s ease-in-out infinite;
}

/* Anillo que se expande, como una notificación entrante. */
.wt-burbuja-ping {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  background: var(--wt-aviso-accent);
  opacity: .45;
  animation: wt-ping 2.2s cubic-bezier(0, 0, .2, 1) infinite;
}

/* La X sustituye al punto rojo cuando el aviso ya se leyó. Queda siempre
   visible (no solo en hover) para que también funcione en táctil. */
.wt-burbuja-x {
  position: absolute;
  top: -.25rem;
  right: -.25rem;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1.375rem;
  width: 1.375rem;
  padding: 0;
  cursor: pointer;
  border-radius: 9999px;
  border: 2px solid var(--p-content-background, #fff);
  background: #64748b;
  color: #fff;
  font-size: .625rem;
  box-shadow: 0 2px 6px rgb(15 23 42 / .3);
  transition: background .15s ease, transform .15s ease;
}

.wt-burbuja-x:hover {
  background: #ef4444;
  transform: scale(1.12);
}

.dark .wt-burbuja-x {
  border-color: #0f172a;
}

.wt-burbuja-dot {
  position: absolute;
  top: .125rem;
  right: .125rem;
  height: .875rem;
  width: .875rem;
  border-radius: 9999px;
  background: #ef4444;
  border: 2px solid #fff;
}

.dark .wt-burbuja-dot {
  border-color: #0f172a;
}

@keyframes wt-latido {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.07); }
}

@keyframes wt-ping {
  0% { transform: scale(1); opacity: .45; }
  70%, 100% { transform: scale(1.9); opacity: 0; }
}

/* Globo con el título: se asoma al llegar y se repliega solo. */
.wt-globo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: .125rem;
  min-width: 0;
  max-width: 15rem;
  padding: .625rem .875rem;
  text-align: left;
  cursor: pointer;
  border: 1px solid var(--p-content-border-color, #e2e8f0);
  border-radius: 1rem;
  background: var(--p-content-background, #fff);
  color: var(--p-text-color, #0f172a);
  box-shadow: 0 10px 25px -5px rgb(15 23 42 / .18);
}

.wt-globo-eyebrow {
  font-size: .5625rem;
  font-weight: 900;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: var(--wt-aviso-accent);
}

.wt-globo-title {
  font-size: .8125rem;
  font-weight: 800;
  line-height: 1.25;
  /* Título largo: 2 líneas y corta, la burbuja no debe crecer sin control. */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.wt-globo-cta {
  font-size: .625rem;
  font-weight: 700;
  opacity: .55;
}

/* En móvil el globo se queda sin espacio al lado de la burbuja: se apila. */
@media (max-width: 30rem) {
  .wt-burbuja-wrap {
    flex-direction: column;
    align-items: flex-end;
  }

  .wt-globo {
    max-width: calc(100vw - 3rem);
  }
}

@media (prefers-reduced-motion: reduce) {

  .wt-burbuja.is-nuevo,
  .wt-burbuja-ping {
    animation: none;
  }
}

/* Aviso lateral: ancho y colores tomados de los tokens del WodenPreset,
   así sigue la marca (#fd4c02) y el modo oscuro sin valores hardcodeados. */
.wt-aviso-drawer {
  /* Azul del aviso. No usa --p-primary-color (naranja de marca) a propósito:
     el comunicado es informativo, no una acción de marca. */
  --wt-aviso-accent: #2563eb;
  width: 100% !important;
  max-width: 24rem !important;
}

/* En móvil el panel ocupa casi toda la pantalla: un aviso de 24rem sobre
   un viewport de 360px dejaba el texto en una columna muy estrecha. */
@media (max-width: 30rem) {
  .wt-aviso-drawer {
    max-width: 100% !important;
  }
}

.dark .wt-aviso-drawer {
  /* Azul más claro sobre fondo oscuro para mantener el contraste AA. */
  --wt-aviso-accent: #60a5fa;
}

.wt-aviso-icon {
  background: color-mix(in srgb, var(--wt-aviso-accent) 12%, transparent);
  color: var(--wt-aviso-accent);
}

.wt-aviso-eyebrow {
  color: var(--wt-aviso-accent);
}

/* El Button de PrimeVue hereda el primario naranja; aquí va en azul. */
.wt-aviso-btn {
  background: var(--wt-aviso-accent) !important;
  border-color: var(--wt-aviso-accent) !important;
  color: #fff !important;
}

.wt-aviso-btn:not(:disabled):hover {
  filter: brightness(1.1);
}

/* Título largo: envuelve hasta 2 líneas en vez de cortarse con puntos. */
.wt-aviso-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.wt-aviso-body {
  color: var(--p-text-muted-color);
}

/* Transiciones de los avisos globales (antes estaban declaradas sin CSS). */
.slide-down-enter-active,
.slide-down-leave-active,
.slide-up-enter-active,
.slide-up-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform .35s cubic-bezier(.16, 1, .3, 1), opacity .35s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(1rem);
  opacity: 0;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(1rem);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
