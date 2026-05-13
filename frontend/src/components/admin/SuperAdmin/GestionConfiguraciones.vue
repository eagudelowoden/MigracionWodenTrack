<template>
  <div class="max-w-3xl mx-auto space-y-5 animate-fade-in">

    <!-- ══ PAGE HEADER ══════════════════════════════════════════════════════ -->
    <div class="relative rounded-2xl overflow-hidden border"
      :class="isDark ? 'bg-[#0d1520] border-white/8' : 'bg-slate-900 border-slate-700'">

      <!-- Grid pattern background -->
      <div class="absolute inset-0 opacity-[0.04]"
        style="background-image: linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px); background-size: 24px 24px;">
      </div>

      <!-- Glow accent -->
      <div class="absolute top-0 left-0 w-48 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent"></div>
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-orange-500/40 blur-sm"></div>

      <div class="relative px-6 py-5 flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
            style="background: linear-gradient(135deg, #FF8F00, #f59e0b); border-color: rgba(255,143,0,0.3); box-shadow: 0 0 20px rgba(255,143,0,0.25)">
            <i class="fas fa-sliders text-black text-base"></i>
          </div>
          <div>
            <h2 class="text-[15px] font-black tracking-tight text-white">
              Configuración del Sistema
            </h2>
            <p class="text-[9px] font-bold uppercase tracking-widest text-white/30 mt-0.5">
              Super Admin &nbsp;·&nbsp; Ajustes globales
            </p>
          </div>
        </div>

        <!-- Status chips -->
        <div class="flex items-center gap-2 shrink-0">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/8 bg-white/5">
            <span class="text-[8px] font-black uppercase tracking-widest text-white/30">Ver.</span>
            <span class="text-[11px] font-black text-orange-400 font-mono">
              {{ appVersion }}
            </span>
          </div>
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border"
            :class="mantenimiento.enabled
              ? 'border-rose-500/30 bg-rose-500/10'
              : 'border-emerald-500/20 bg-emerald-500/8'">
            <div class="w-1.5 h-1.5 rounded-full"
              :class="mantenimiento.enabled ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'"></div>
            <span class="text-[9px] font-black uppercase tracking-widest"
              :class="mantenimiento.enabled ? 'text-rose-400' : 'text-emerald-400'">
              {{ mantenimiento.enabled ? 'Mantenimiento' : 'Operativo' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ 01 · MANTENIMIENTO DEL SITIO ═════════════════════════════════════ -->
    <div class="rounded-2xl border overflow-hidden transition-all duration-500"
      :class="mantenimiento.enabled
        ? (isDark ? 'border-rose-500/40 shadow-lg shadow-rose-500/10' : 'border-rose-400 shadow-lg shadow-rose-500/15')
        : (isDark ? 'border-white/8' : 'border-slate-200')">

      <!-- Section label -->
      <div class="flex items-center gap-3 px-5 py-3 border-b"
        :class="mantenimiento.enabled
          ? (isDark ? 'bg-rose-950/60 border-rose-500/20' : 'bg-rose-600 border-rose-500')
          : (isDark ? 'bg-[#0d1520] border-white/5' : 'bg-slate-900 border-slate-700')">
        <span class="text-[9px] font-black text-white/20 font-mono tracking-widest">01</span>
        <div class="w-px h-3" :class="isDark ? 'bg-white/10' : 'bg-white/20'"></div>
        <i class="fas fa-hard-hat text-[11px]"
          :class="mantenimiento.enabled ? 'text-rose-300' : 'text-white/40'"></i>
        <span class="text-[10px] font-black uppercase tracking-widest"
          :class="mantenimiento.enabled ? 'text-rose-200' : 'text-white/50'">
          Modo mantenimiento del sitio
        </span>
        <span class="ml-auto text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
          :class="mantenimiento.enabled
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            : 'bg-white/5 text-white/25 border-white/8'">
          {{ mantenimiento.enabled ? '⚠ ACTIVO' : 'Desactivado' }}
        </span>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-4"
        :class="isDark ? 'bg-[#111c2b]' : 'bg-white'">

        <!-- Sin configurar -->
        <div v-if="!mantenimiento.configured"
          class="flex items-start gap-3 p-4 rounded-xl border"
          :class="isDark ? 'bg-amber-500/8 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'">
          <i class="fas fa-triangle-exclamation mt-0.5 shrink-0"></i>
          <div class="text-[10px] leading-relaxed">
            <strong class="font-black">WEBCONFIG_PATH</strong> no está configurado en el
            <code class="font-mono px-1 py-0.5 rounded text-[9px]"
              :class="isDark ? 'bg-white/10' : 'bg-amber-100'">.env</code> del backend.
            Agrega la ruta al <code class="font-mono text-[9px]">web.config</code> de IIS para habilitar el control remoto.
          </div>
        </div>

        <template v-if="mantenimiento.configured">
          <!-- Big toggle row -->
          <div class="flex items-center gap-5 p-4 rounded-xl border"
            :class="mantenimiento.enabled
              ? (isDark ? 'bg-rose-500/8 border-rose-500/25' : 'bg-rose-50 border-rose-200')
              : (isDark ? 'bg-white/[0.02] border-white/6' : 'bg-slate-50 border-slate-200')">

            <!-- State icon -->
            <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative"
              :class="mantenimiento.enabled
                ? 'bg-rose-500/20'
                : (isDark ? 'bg-emerald-500/15' : 'bg-emerald-100')">
              <i :class="['text-lg', mantenimiento.enabled ? 'fas fa-lock text-rose-400' : 'fas fa-earth-americas text-emerald-500']"></i>
              <div v-if="mantenimiento.enabled"
                class="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-500 border-2 animate-pulse"
                :class="isDark ? 'border-[#111c2b]' : 'border-white'"></div>
            </div>

            <div class="flex-1 min-w-0">
              <p class="text-[13px] font-black"
                :class="mantenimiento.enabled
                  ? 'text-rose-400'
                  : (isDark ? 'text-emerald-400' : 'text-emerald-600')">
                {{ mantenimiento.enabled ? 'Sitio en mantenimiento' : 'Sitio operativo' }}
              </p>
              <p class="text-[9px] mt-0.5 leading-tight"
                :class="isDark ? 'text-white/30' : 'text-slate-400'">
                {{ mantenimiento.enabled
                  ? 'Los usuarios son redirigidos a mantenimiento.html'
                  : 'Todos los usuarios acceden normalmente' }}
              </p>
            </div>

            <!-- Toggle switch (grande) -->
            <button @click="toggleMantenimiento" :disabled="mantenimiento.saving"
              class="relative w-14 h-7 rounded-full transition-all duration-300 shrink-0 disabled:opacity-50 focus:outline-none"
              :class="mantenimiento.enabled ? 'bg-rose-500 shadow-lg shadow-rose-500/40' : (isDark ? 'bg-white/15' : 'bg-slate-300')">
              <span v-if="mantenimiento.saving" class="absolute inset-0 flex items-center justify-center">
                <i class="fas fa-circle-notch fa-spin text-white text-[11px]"></i>
              </span>
              <span v-else
                class="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300"
                :class="mantenimiento.enabled ? 'left-[34px]' : 'left-1'">
              </span>
            </button>
          </div>

          <!-- Aviso IPs -->
          <div v-if="mantenimiento.enabled"
            class="flex items-start gap-2.5 px-4 py-3 rounded-xl text-[10px]"
            :class="isDark ? 'bg-rose-500/6 border border-rose-500/15 text-rose-300/70' : 'bg-rose-50 border border-rose-200 text-rose-700'">
            <i class="fas fa-shield-halved mt-0.5 shrink-0 text-rose-400"></i>
            <span>
              Las IPs autorizadas en el <code class="font-mono">web.config</code> siguen con acceso normal para
              verificación del estado del sitio.
            </span>
          </div>
        </template>
      </div>
    </div>

    <!-- ══ 02 · ALMACENAMIENTO ═══════════════════════════════════════════════ -->
    <div class="rounded-2xl border overflow-hidden"
      :class="isDark ? 'border-white/8' : 'border-slate-200'">

      <div class="flex items-center gap-3 px-5 py-3 border-b"
        :class="isDark ? 'bg-[#0d1520] border-white/5' : 'bg-slate-900 border-slate-700'">
        <span class="text-[9px] font-black text-white/20 font-mono tracking-widest">02</span>
        <div class="w-px h-3 bg-white/10"></div>
        <i class="fas fa-database text-[11px] text-white/40"></i>
        <span class="text-[10px] font-black uppercase tracking-widest text-white/50">
          Almacenamiento de soportes
        </span>
        <span class="ml-auto text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-white/25 border border-white/8">
          Novedades
        </span>
      </div>

      <div class="p-5 space-y-4" :class="isDark ? 'bg-[#111c2b]' : 'bg-white'">
        <p class="text-[10px]" :class="isDark ? 'text-white/35' : 'text-slate-500'">
          Elige dónde se guardan los archivos adjuntos de las novedades.
        </p>

        <div class="grid grid-cols-2 gap-3">
          <!-- Local -->
          <button @click="config.storage_mode = 'local'"
            class="group relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left overflow-hidden"
            :class="config.storage_mode === 'local'
              ? 'border-orange-500/60 bg-orange-500/8'
              : (isDark ? 'border-white/6 bg-white/[0.02] hover:border-white/15 hover:bg-white/5' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100')">
            <div v-if="config.storage_mode === 'local'"
              class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
              :class="config.storage_mode === 'local'
                ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/30'
                : (isDark ? 'bg-white/8 text-white/40' : 'bg-slate-200 text-slate-500')">
              <i class="fas fa-hard-drive text-sm"></i>
            </div>
            <div>
              <p class="text-[11px] font-black uppercase"
                :class="isDark ? 'text-white' : 'text-slate-800'">Local</p>
              <p class="text-[9px]" :class="isDark ? 'text-white/30' : 'text-slate-400'">Servidor propio</p>
            </div>
            <i v-if="config.storage_mode === 'local'"
              class="fas fa-check-circle text-orange-500 ml-auto text-sm"></i>
          </button>

          <!-- S3 -->
          <button @click="config.storage_mode = 's3'"
            class="group relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left overflow-hidden"
            :class="config.storage_mode === 's3'
              ? 'border-orange-500/60 bg-orange-500/8'
              : (isDark ? 'border-white/6 bg-white/[0.02] hover:border-white/15 hover:bg-white/5' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100')">
            <div v-if="config.storage_mode === 's3'"
              class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
              :class="config.storage_mode === 's3'
                ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/30'
                : (isDark ? 'bg-white/8 text-white/40' : 'bg-slate-200 text-slate-500')">
              <i class="fab fa-aws text-sm"></i>
            </div>
            <div>
              <p class="text-[11px] font-black uppercase"
                :class="isDark ? 'text-white' : 'text-slate-800'">Amazon S3</p>
              <p class="text-[9px]" :class="isDark ? 'text-white/30' : 'text-slate-400'">Nube AWS</p>
            </div>
            <i v-if="config.storage_mode === 's3'"
              class="fas fa-check-circle text-orange-500 ml-auto text-sm"></i>
          </button>
        </div>

        <div v-if="config.storage_mode === 's3'"
          class="flex items-center gap-2.5 px-4 py-3 rounded-xl text-[10px]"
          :class="isDark ? 'bg-amber-500/8 border border-amber-500/15 text-amber-400' : 'bg-amber-50 border border-amber-200 text-amber-700'">
          <i class="fas fa-circle-info shrink-0"></i>
          Las credenciales AWS (<code class="font-mono text-[9px]">access_key</code>,
          <code class="font-mono text-[9px]">secret</code>, región, bucket) van en el
          <code class="font-mono text-[9px]">.env</code> del servidor.
        </div>
      </div>
    </div>

    <!-- ══ 03 · ESTADO DE MÓDULOS ════════════════════════════════════════════ -->
    <div class="rounded-2xl border overflow-hidden"
      :class="isDark ? 'border-white/8' : 'border-slate-200'">

      <div class="flex items-center gap-3 px-5 py-3 border-b"
        :class="isDark ? 'bg-[#0d1520] border-white/5' : 'bg-slate-900 border-slate-700'">
        <span class="text-[9px] font-black text-white/20 font-mono tracking-widest">03</span>
        <div class="w-px h-3 bg-white/10"></div>
        <i class="fas fa-layer-group text-[11px] text-white/40"></i>
        <span class="text-[10px] font-black uppercase tracking-widest text-white/50">
          Estado de módulos
        </span>
        <span class="ml-auto text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-white/25 border border-white/8">
          Panel Admin
        </span>
      </div>

      <div class="divide-y" :class="isDark ? 'bg-[#111c2b] divide-white/[0.04]' : 'bg-white divide-slate-100'">
        <div v-for="mod in modulos" :key="mod.key" class="px-5 py-4">
          <div class="flex items-center gap-4">
            <!-- Status indicator -->
            <div class="relative flex items-center justify-center shrink-0">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                :class="isActive(mod.key)
                  ? (isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-600')
                  : (isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-100 text-rose-500')">
                <i :class="mod.icon + ' text-sm'"></i>
              </div>
              <!-- Live dot -->
              <div class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 transition-all"
                :class="[
                  isActive(mod.key) ? 'bg-emerald-400' : 'bg-slate-400',
                  isActive(mod.key) ? 'animate-pulse' : '',
                  isDark ? 'border-[#111c2b]' : 'border-white',
                ]">
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-[12px] font-black"
                  :class="isDark ? 'text-white/90' : 'text-slate-800'">
                  {{ mod.label }}
                </p>
                <span class="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                  :class="isActive(mod.key)
                    ? (isDark ? 'bg-emerald-500/12 text-emerald-400' : 'bg-emerald-100 text-emerald-600')
                    : (isDark ? 'bg-rose-500/12 text-rose-400' : 'bg-rose-100 text-rose-500')">
                  {{ isActive(mod.key) ? 'Activo' : 'Mantenimiento' }}
                </span>
              </div>
              <p class="text-[9px] mt-0.5" :class="isDark ? 'text-white/25' : 'text-slate-400'">
                {{ mod.desc }}
              </p>
            </div>

            <!-- Toggle -->
            <button @click="toggleModulo(mod.key)"
              class="relative w-11 h-6 rounded-full transition-all duration-300 shrink-0 focus:outline-none"
              :class="isActive(mod.key)
                ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                : (isDark ? 'bg-white/12' : 'bg-slate-300')">
              <span class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300"
                :class="isActive(mod.key) ? 'left-[22px]' : 'left-0.5'">
              </span>
            </button>
          </div>

          <!-- Mensaje mantenimiento -->
          <Transition name="slide">
            <div v-if="!isActive(mod.key)" class="mt-3 ml-[52px]">
              <label class="text-[8px] font-black uppercase tracking-widest block mb-1.5"
                :class="isDark ? 'text-white/20' : 'text-slate-400'">
                <i class="fas fa-comment-dots mr-1"></i>Mensaje para el usuario
              </label>
              <input v-model="config[mod.key + '_message']" type="text"
                placeholder="Ej: Módulo en mantenimiento. Vuelve pronto."
                class="w-full px-3 py-2 rounded-lg border text-[11px] outline-none transition-all"
                :class="isDark
                  ? 'bg-white/4 border-white/8 text-white placeholder-white/20 focus:border-orange-500/50'
                  : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-orange-400'" />
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- ══ SAVE BAR ══════════════════════════════════════════════════════════ -->
    <div class="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border"
      :class="isDark ? 'bg-[#0d1520] border-white/8' : 'bg-slate-900 border-slate-700'">
      <div>
        <p class="text-[11px] font-black text-white/60">Cambios pendientes</p>
        <p class="text-[9px] text-white/25 mt-0.5">El mantenimiento del sitio se guarda de inmediato al activar el toggle</p>
      </div>
      <button @click="guardar" :disabled="saving"
        class="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.97] disabled:opacity-50 shrink-0"
        style="background: linear-gradient(135deg, #FF8F00, #f59e0b); color: #000; box-shadow: 0 4px 15px rgba(255,143,0,0.3)">
        <i :class="saving ? 'fas fa-circle-notch fa-spin' : 'fas fa-floppy-disk'"></i>
        {{ saving ? 'Guardando...' : 'Guardar módulos' }}
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

const props = defineProps({ isDark: Boolean });
const emit = defineEmits(['success', 'error']);

const API_URL = import.meta.env.VITE_API_URL;
const API_BASE = API_URL.replace('/usuarios', '');

const saving = ref(false);
const appVersion = ref('—');

// ── Mantenimiento del sitio ──────────────────────────────────────────────────
const mantenimiento = reactive({ enabled: false, configured: false, saving: false });

const cargarMantenimiento = async () => {
  try {
    const [resM, resV] = await Promise.all([
      fetch(`${API_BASE}/mantenimiento`),
      fetch(`${API_BASE}/version?t=${Date.now()}`),
    ]);
    if (resM.ok) {
      const d = await resM.json();
      mantenimiento.enabled = d.enabled;
      mantenimiento.configured = d.configured;
    }
    if (resV.ok) {
      const d = await resV.json();
      appVersion.value = d.version ?? '—';
    }
  } catch { /* silencioso */ }
};

const toggleMantenimiento = async () => {
  mantenimiento.saving = true;
  const nuevoEstado = !mantenimiento.enabled;
  try {
    const res = await fetch(`${API_BASE}/mantenimiento`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: nuevoEstado }),
    });
    const data = await res.json();
    if (data.ok) {
      mantenimiento.enabled = nuevoEstado;
      emit('success', nuevoEstado ? '⚠ Mantenimiento activado' : '✓ Sitio restaurado');
    } else {
      emit('error', data.message || 'No se pudo cambiar el estado');
    }
  } catch {
    emit('error', 'Error al comunicarse con el servidor');
  } finally {
    mantenimiento.saving = false;
  }
};

// ── Módulos y almacenamiento ─────────────────────────────────────────────────
const config = reactive({
  storage_mode: 'local',
  module_asistencias_active: 'true',
  module_asistencias_message: 'Módulo en mantenimiento. Vuelve pronto.',
  module_mallas_active: 'true',
  module_mallas_message: 'Módulo en mantenimiento. Vuelve pronto.',
  module_novedades_active: 'true',
  module_novedades_message: 'Módulo en mantenimiento. Vuelve pronto.',
});

const modulos = [
  { key: 'module_asistencias', label: 'Asistencias',   icon: 'fas fa-chart-line',       desc: 'Control de asistencia y marcación' },
  { key: 'module_mallas',      label: 'Cargue Mallas', icon: 'fas fa-cloud-arrow-up',    desc: 'Programación y cargue de turnos' },
  { key: 'module_novedades',   label: 'Novedades',     icon: 'fas fa-file-circle-plus',  desc: 'Registro y gestión de novedades' },
];

const isActive = (key) => config[key + '_active'] === 'true';
const toggleModulo = (key) => {
  config[key + '_active'] = isActive(key) ? 'false' : 'true';
};

const cargar = async () => {
  try {
    const res = await fetch(`${API_URL}/sistema-config`);
    if (!res.ok) return;
    const data = await res.json();
    Object.assign(config, data);
  } catch { /* silencioso */ }
};

const guardar = async () => {
  saving.value = true;
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const res = await fetch(`${API_URL}/sistema-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates: { ...config }, updatedBy: session.name || 'SuperAdmin' }),
    });
    if (!res.ok) throw new Error();
    emit('success', 'Configuración guardada');
  } catch {
    emit('error', 'Error al guardar la configuración');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  cargar();
  cargarMantenimiento();
});
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
