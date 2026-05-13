<template>
  <div class="max-w-3xl mx-auto space-y-6 animate-fade-in">

    <!-- ── Sección 0: Modo mantenimiento del sitio ───────────────────────── -->
    <div class="rounded-2xl border p-5 space-y-4 transition-all"
      :class="mantenimiento.enabled
        ? (isDark ? 'bg-rose-950/40 border-rose-500/40' : 'bg-rose-50 border-rose-300')
        : (isDark ? 'bg-[#1e2538] border-white/10' : 'bg-white border-slate-200 shadow-sm')">

      <div class="flex items-center gap-2 pb-3 border-b"
        :class="mantenimiento.enabled
          ? (isDark ? 'border-rose-500/30' : 'border-rose-200')
          : (isDark ? 'border-white/10' : 'border-slate-100')">
        <i class="fas fa-hard-hat"
          :class="mantenimiento.enabled ? 'text-rose-400' : 'text-[#FF8F00]'"></i>
        <h3 class="text-[11px] font-black uppercase tracking-widest"
          :class="isDark ? 'text-slate-200' : 'text-slate-700'">
          Modo mantenimiento del sitio
        </h3>
        <span class="ml-auto px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
          :class="mantenimiento.enabled
            ? 'bg-rose-500/20 text-rose-400'
            : (isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-600')">
          {{ mantenimiento.enabled ? 'ACTIVO' : 'Desactivado' }}
        </span>
      </div>

      <!-- Sin configurar -->
      <div v-if="!mantenimiento.configured"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px]"
        :class="isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700 border border-amber-200'">
        <i class="fas fa-triangle-exclamation shrink-0"></i>
        <span>
          <strong>WEBCONFIG_PATH</strong> no está configurado en el <code class="font-mono">.env</code> del backend.
          Agrega la ruta al <code class="font-mono">web.config</code> de IIS para habilitar el control remoto.
        </span>
      </div>

      <template v-if="mantenimiento.configured">
        <p class="text-[10px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Activa el mantenimiento para redirigir a todos los usuarios (excepto la IP permitida en IIS) a la página
          <code class="font-mono text-[9px] px-1 py-0.5 rounded"
            :class="isDark ? 'bg-white/10' : 'bg-slate-100'">mantenimiento.html</code>.
        </p>

        <div class="flex items-center justify-between gap-4 rounded-xl p-4 border"
          :class="mantenimiento.enabled
            ? (isDark ? 'bg-rose-500/10 border-rose-500/30' : 'bg-rose-50 border-rose-200')
            : (isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              :class="mantenimiento.enabled
                ? 'bg-rose-500/20 text-rose-400'
                : (isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-600')">
              <i :class="mantenimiento.enabled ? 'fas fa-lock text-sm' : 'fas fa-globe text-sm'"></i>
            </div>
            <div>
              <p class="text-[12px] font-black"
                :class="mantenimiento.enabled
                  ? 'text-rose-400'
                  : (isDark ? 'text-emerald-400' : 'text-emerald-600')">
                {{ mantenimiento.enabled ? 'Sitio en mantenimiento' : 'Sitio operativo' }}
              </p>
              <p class="text-[9px] opacity-50 mt-0.5">
                {{ mantenimiento.enabled
                  ? 'Usuarios ven la página de mantenimiento'
                  : 'Todos los usuarios acceden normalmente' }}
              </p>
            </div>
          </div>

          <button @click="toggleMantenimiento" :disabled="mantenimiento.saving"
            class="relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 disabled:opacity-50"
            :class="mantenimiento.enabled ? 'bg-rose-500' : (isDark ? 'bg-white/20' : 'bg-slate-300')">
            <span v-if="mantenimiento.saving"
              class="absolute inset-0 flex items-center justify-center">
              <i class="fas fa-circle-notch fa-spin text-white text-[10px]"></i>
            </span>
            <span v-else
              class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300"
              :class="mantenimiento.enabled ? 'left-[26px]' : 'left-0.5'">
            </span>
          </button>
        </div>

        <div v-if="mantenimiento.enabled"
          class="flex items-start gap-2 px-3 py-2.5 rounded-xl text-[10px]"
          :class="isDark ? 'bg-rose-500/8 text-rose-300' : 'bg-rose-50 text-rose-700 border border-rose-200'">
          <i class="fas fa-info-circle mt-0.5 shrink-0"></i>
          <span>
            Los usuarios con la IP autorizada en el <code class="font-mono">web.config</code> pueden seguir
            accediendo normalmente para verificar el estado del sitio.
          </span>
        </div>
      </template>
    </div>

    <!-- Header -->
    <div class="flex items-center gap-3 mb-2">
      <div class="w-10 h-10 rounded-xl bg-[#FF8F00] flex items-center justify-center shadow-lg shadow-orange-500/20">
        <i class="fas fa-sliders text-white text-base"></i>
      </div>
      <div>
        <h2 class="text-base font-black uppercase tracking-tight" :class="isDark ? 'text-white' : 'text-slate-800'">
          Configuraciones del sistema
        </h2>
        <p class="text-[10px] font-bold uppercase tracking-widest"
          :class="isDark ? 'text-slate-500' : 'text-slate-400'">
          Super Admin · Ajustes globales
        </p>
      </div>
    </div>

    <!-- ── Sección 1: Almacenamiento de soportes ─────────────────────────── -->
    <div class="rounded-2xl border p-5 space-y-4 transition-all"
      :class="isDark ? 'bg-[#1e2538] border-white/10' : 'bg-white border-slate-200 shadow-sm'">

      <div class="flex items-center gap-2 pb-3 border-b" :class="isDark ? 'border-white/10' : 'border-slate-100'">
        <i class="fas fa-folder-open text-[#FF8F00]"></i>
        <h3 class="text-[11px] font-black uppercase tracking-widest"
          :class="isDark ? 'text-slate-200' : 'text-slate-700'">
          Almacenamiento de soportes
        </h3>
        <span class="ml-auto px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
          :class="isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'">
          Novedades
        </span>
      </div>

      <p class="text-[10px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
        Elige dónde se guardan los archivos adjuntos de las novedades.
      </p>

      <div class="grid grid-cols-2 gap-3">
        <!-- Local -->
        <button @click="config.storage_mode = 'local'"
          class="flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left"
          :class="config.storage_mode === 'local'
            ? 'border-[#FF8F00] bg-orange-500/10'
            : (isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-slate-50 hover:bg-slate-100')">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            :class="config.storage_mode === 'local' ? 'bg-[#FF8F00] text-white' : (isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-500')">
            <i class="fas fa-hard-drive text-sm"></i>
          </div>
          <div>
            <p class="text-[11px] font-black uppercase" :class="isDark ? 'text-white' : 'text-slate-800'">Local</p>
            <p class="text-[9px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Servidor propio</p>
          </div>
          <i v-if="config.storage_mode === 'local'" class="fas fa-check-circle text-[#FF8F00] ml-auto"></i>
        </button>

        <!-- S3 -->
        <button @click="config.storage_mode = 's3'"
          class="flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left"
          :class="config.storage_mode === 's3'
            ? 'border-[#FF8F00] bg-orange-500/10'
            : (isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-slate-50 hover:bg-slate-100')">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            :class="config.storage_mode === 's3' ? 'bg-[#FF8F00] text-white' : (isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-500')">
            <i class="fab fa-aws text-sm"></i>
          </div>
          <div>
            <p class="text-[11px] font-black uppercase" :class="isDark ? 'text-white' : 'text-slate-800'">Amazon S3</p>
            <p class="text-[9px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Nube AWS</p>
          </div>
          <i v-if="config.storage_mode === 's3'" class="fas fa-check-circle text-[#FF8F00] ml-auto"></i>
        </button>
      </div>

      <div v-if="config.storage_mode === 's3'" class="mt-1 px-4 py-3 rounded-xl text-[10px] flex items-center gap-2"
        :class="isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'">
        <i class="fas fa-info-circle shrink-0"></i>
        Las credenciales AWS (access key, secret, región, bucket) se configuran en el archivo
        <code class="font-mono font-bold">.env</code> del servidor.
      </div>
    </div>

    <!-- ── Sección 2: Estado de módulos ──────────────────────────────────── -->
    <div class="rounded-2xl border p-5 space-y-4 transition-all"
      :class="isDark ? 'bg-[#1e2538] border-white/10' : 'bg-white border-slate-200 shadow-sm'">

      <div class="flex items-center gap-2 pb-3 border-b" :class="isDark ? 'border-white/10' : 'border-slate-100'">
        <i class="fas fa-toggle-on text-[#FF8F00]"></i>
        <h3 class="text-[11px] font-black uppercase tracking-widest"
          :class="isDark ? 'text-slate-200' : 'text-slate-700'">
          Estado de módulos (Admin)
        </h3>
      </div>

      <p class="text-[10px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
        Desactiva un módulo para mostrar un mensaje de mantenimiento a los usuarios.
      </p>

      <div class="space-y-3">
        <div v-for="mod in modulos" :key="mod.key" class="rounded-xl border p-4 transition-all"
          :class="isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'">

          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="isActive(mod.key)
                ? 'bg-emerald-500/15 text-emerald-500'
                : 'bg-rose-500/15 text-rose-500'">
                <i :class="mod.icon + ' text-sm'"></i>
              </div>
              <div>
                <p class="text-[11px] font-black uppercase" :class="isDark ? 'text-white' : 'text-slate-800'">
                  {{ mod.label }}
                </p>
                <p class="text-[9px] font-bold uppercase"
                  :class="isActive(mod.key) ? 'text-emerald-500' : 'text-rose-500'">
                  {{ isActive(mod.key) ? 'Activo' : 'En mantenimiento' }}
                </p>
              </div>
            </div>

            <!-- Toggle -->
            <button @click="toggleModulo(mod.key)"
              class="relative w-11 h-6 rounded-full transition-all duration-300 shrink-0"
              :class="isActive(mod.key) ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'">
              <span class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300"
                :class="isActive(mod.key) ? 'left-[22px]' : 'left-0.5'"></span>
            </button>
          </div>

          <!-- Mensaje mantenimiento -->
          <Transition name="slide">
            <div v-if="!isActive(mod.key)" class="mt-3">
              <label class="text-[9px] font-black uppercase tracking-widest mb-1 block"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                Mensaje para el usuario
              </label>
              <input v-model="config[mod.key + '_message']" type="text"
                placeholder="Ej: Módulo en mantenimiento. Vuelve pronto."
                class="w-full px-3 py-2 rounded-lg border text-[11px] outline-none transition-all" :class="isDark
                  ? 'bg-white/5 border-white/10 text-white focus:border-[#FF8F00]'
                  : 'bg-white border-slate-300 text-slate-700 focus:border-[#FF8F00]'" />
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- ── Botón guardar ───────────────────────────────────────────────────── -->
    <div class="flex justify-end">
      <button @click="guardar" :disabled="saving"
        class="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF8F00] text-black text-[11px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-400 active:scale-[0.98] transition-all disabled:opacity-50">
        <i :class="saving ? 'fas fa-spinner fa-spin' : 'fas fa-floppy-disk'"></i>
        {{ saving ? 'Guardando...' : 'Guardar cambios' }}
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

// ── Mantenimiento del sitio ──────────────────────────────────────────────────
const mantenimiento = reactive({ enabled: false, configured: false, saving: false });

const cargarMantenimiento = async () => {
  try {
    const res = await fetch(`${API_BASE}/mantenimiento`);
    if (!res.ok) return;
    const data = await res.json();
    mantenimiento.enabled = data.enabled;
    mantenimiento.configured = data.configured;
  } catch { /* no bloquea si el backend no lo soporta aún */ }
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
      emit('success', nuevoEstado ? 'Mantenimiento activado' : 'Sitio restaurado');
    } else {
      emit('error', data.message || 'No se pudo cambiar el estado');
    }
  } catch {
    emit('error', 'Error al comunicarse con el servidor');
  } finally {
    mantenimiento.saving = false;
  }
};

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
  { key: 'module_asistencias', label: 'Asistencias', icon: 'fas fa-chart-line' },
  { key: 'module_mallas', label: 'Cargue Mallas', icon: 'fas fa-cloud-arrow-up' },
  { key: 'module_novedades', label: 'Novedades', icon: 'fas fa-bullhorn' },
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
  } catch (e) {
    console.error('Error cargando config:', e);
  }
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
