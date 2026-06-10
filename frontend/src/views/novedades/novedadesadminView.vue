<template>

  <div class="w-full h-full">

    <MisAprobacionesView v-if="vistaActiva === 'aprobaciones'" :isDark="isDark" @volver="vistaActiva = 'registro'" />
    <div v-else class="w-full h-full animate-fade-in transition-colors duration-500 flex flex-col gap-1.5">

      <!-- Header -->
      <div class="flex items-center gap-2 px-3 py-2 rounded-md border shrink-0"
        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

        <div class="flex items-center gap-2 shrink-0">
          <div class="w-6 h-6 flex items-center justify-center rounded-lg bg-[#3B82F6] text-white shrink-0">
            <i class="fas fa-file-signature text-[10px]"></i>
          </div>
          <div>
            <h2 class="text-sm font-semibold uppercase tracking-tight leading-none"
              :class="isDark ? 'text-white' : 'text-slate-800'">
              Registro <span class="text-[#3B82F6]">Novedad</span>
            </h2>
            <p class="text-[8px] font-semibold opacity-40 uppercase tracking-[0.15em] mt-0.5"
              :class="isDark ? 'text-slate-400' : 'text-slate-500'">
              {{ company || 'Woden Track' }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1.5 ml-auto shrink-0">
          <!-- Indicador storage -->
          <div class="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold"
            :class="storageMode === 's3' ? 'bg-[#3B82F6]/10 text-[#3B82F6]' : 'bg-emerald-500/10 text-emerald-500'">
            <i :class="storageMode === 's3' ? 'fab fa-aws text-[10px]' : 'fas fa-hard-drive text-[10px]'"></i>
            {{ storageMode === 's3' ? 'S3' : 'Local' }}
          </div>
          <!-- Botón ir al listado -->
          <button @click="vistaActiva = 'aprobaciones'"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-wide border transition-all hover:brightness-110 active:scale-[0.98]"
            :class="isDark ? 'bg-[#161B26] border-[#222938] text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'">
            <i class="fas fa-table-list text-[#3B82F6] text-[10px]"></i>
            Novedades Equipo
          </button>
        </div>
      </div>

      <!-- BODY: formulario + visor lado a lado -->
      <div class="flex-1 flex gap-1.5 overflow-hidden min-h-0">

        <!-- Formulario -->
        <div class="flex flex-col overflow-hidden rounded-md border transition-all duration-300 w-full"
          :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

          <form @submit.prevent="handleSubmit" class="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">

            <div class="grid grid-cols-1 gap-3">

              <!-- Nombre -->
              <div class="flex flex-col gap-1">
                <label class="text-[9px] font-semibold uppercase tracking-wide ml-0.5"
                  :class="isDark ? 'text-slate-400' : 'text-[#3B82F6]'">Nombre</label>
                <div
                  class="flex items-center gap-2.5 px-3 py-2 rounded-lg border focus-within:ring-1 focus-within:ring-[#3B82F6]/30 transition-all"
                  :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
                  <i class="fas fa-user-circle text-[#3B82F6]/60 text-xs"></i>
                  <input type="text" v-model="form.nombre" placeholder="Nombre completo..." required
                    class="bg-transparent w-full font-semibold outline-none placeholder:text-slate-500 text-xs"
                    :class="isDark ? 'text-white' : 'text-slate-800'" />
                </div>
              </div>

              <!-- Jefe de área -->
              <div v-if="jefe" class="flex items-center gap-2.5 px-3 py-2 rounded-lg border"
                :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-slate-50 border-slate-200'">
                <div
                  class="w-6 h-6 rounded-md bg-[#3B82F6]/15 flex items-center justify-center text-[9px] font-semibold text-[#3B82F6] shrink-0">
                  {{ jefe.name?.charAt(0) ?? '?' }}
                </div>
                <div class="flex flex-col flex-1 min-w-0">
                  <span class="text-[8px] font-bold uppercase tracking-wide opacity-40"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Jefe directo</span>
                  <span class="text-[11px] font-bold uppercase truncate"
                    :class="isDark ? 'text-white' : 'text-slate-800'">{{ jefe.name }}</span>
                  <span class="text-[9px] opacity-40 truncate" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{
                    jefe.job || '' }}</span>
                </div>
                <span
                  class="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-semibold uppercase bg-[#3B82F6]/10 text-[#3B82F6]">
                  <i class="fas fa-user-tie text-[8px]"></i>Responsable
                </span>
              </div>

              <!-- Cédula + Fecha Inicio + Fecha Fin en una fila -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div class="flex flex-col gap-1">
                  <label class="text-[9px] font-semibold uppercase tracking-wide ml-0.5"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cédula</label>
                  <div
                    class="flex items-center gap-2 px-3 py-2 rounded-lg border focus-within:ring-1 focus-within:ring-[#3B82F6]/30 transition-all"
                    :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
                    <i class="fas fa-id-card text-[#3B82F6]/60 text-xs"></i>
                    <input type="number" v-model="form.cedula" placeholder="N° identificación..." required
                      class="bg-transparent w-full font-semibold outline-none placeholder:text-slate-500 text-xs"
                      :class="isDark ? 'text-white' : 'text-slate-800'" />
                  </div>
                </div>
                <div v-if="form.tipificacion !== 'Renuncia'" class="flex flex-col gap-1">
                  <label class="text-[9px] font-semibold uppercase tracking-wide ml-0.5"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Fecha Inicio</label>
                  <input type="date" v-model="form.fechaInicio" required
                    class="px-3 py-2 rounded-lg border text-xs font-semibold outline-none transition-all"
                    :class="isDark ? 'bg-[#161B26] border-[#222938] text-white [color-scheme:dark]' : 'bg-white border-slate-200 text-slate-800'" />
                </div>
                <div v-if="form.tipificacion !== 'Renuncia'" class="flex flex-col gap-1">
                  <label class="text-[9px] font-semibold uppercase tracking-wide ml-0.5"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Fecha Fin</label>
                  <input type="date" v-model="form.fechaFin" required
                    class="px-3 py-2 rounded-lg border text-xs font-semibold outline-none transition-all"
                    :class="isDark ? 'bg-[#161B26] border-[#222938] text-white [color-scheme:dark]' : 'bg-white border-slate-200 text-slate-800'" />
                </div>
              </div>

              <!-- Descripción -->
              <div class="flex flex-col gap-1">
                <label class="text-[9px] font-semibold uppercase tracking-wide ml-0.5"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Descripción</label>
                <textarea v-model="form.descripcion" rows="3" placeholder="Explique el motivo..." required
                  class="px-3 py-2.5 rounded-lg border text-xs font-medium outline-none resize-none transition-all placeholder:text-slate-500"
                  :class="isDark ? 'bg-[#161B26] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-800'">
                </textarea>
              </div>

              <!-- Tipificación -->
              <div class="flex flex-col gap-1">
                <label class="text-[9px] font-semibold uppercase tracking-wide ml-0.5"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Tipificación</label>
                <select v-model="form.tipificacion" required
                  class="px-3 py-2 rounded-lg border text-xs font-semibold outline-none transition-all"
                  :class="isDark ? 'bg-[#161B26] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-800'">
                  <option value="" disabled>Seleccione el tipo de novedad...</option>
                  <option v-for="tip in TIPIFICACIONES" :key="tip" :value="tip">{{ tip }}</option>
                </select>
              </div>

              <!-- Último Día Trabajado (solo Renuncia) -->
              <transition name="fade-msg">
                <div v-if="form.tipificacion === 'Renuncia'" class="flex flex-col gap-1">
                  <label class="text-[9px] font-semibold uppercase tracking-wide ml-0.5 text-amber-500">
                    <i class="fas fa-calendar-xmark mr-1"></i>Último Día Trabajado
                  </label>
                  <input type="date" v-model="form.ultimoDiaTrabajado" required
                    class="px-3 py-2 rounded-lg border text-xs font-semibold outline-none transition-all ring-1 ring-amber-500/30"
                    :class="isDark ? 'bg-[#161B26] border-amber-500/40 text-white [color-scheme:dark]' : 'bg-white border-amber-400/50 text-slate-800'" />
                </div>
              </transition>

              <!-- Campos liquidación Renuncia -->
              <transition name="fade-msg">
                <div v-if="form.tipificacion === 'Renuncia'" class="grid grid-cols-2 gap-3">
                  <!-- Descuento -->
                  <div class="flex flex-col gap-1">
                    <label class="text-[9px] font-semibold uppercase tracking-wide ml-0.5 text-amber-500">
                      <i class="fas fa-tag mr-1"></i>Descuento
                    </label>
                    <input type="text" v-model="form.renunciaDescuento" placeholder="Valor descuento..."
                      class="px-3 py-2 rounded-lg border text-xs font-semibold outline-none transition-all ring-1 ring-amber-500/30 placeholder:text-slate-500"
                      :class="isDark ? 'bg-[#161B26] border-amber-500/40 text-white' : 'bg-white border-amber-400/50 text-slate-800'" />
                  </div>
                  <!-- Comisiones -->
                  <div class="flex flex-col gap-1">
                    <label class="text-[9px] font-semibold uppercase tracking-wide ml-0.5 text-amber-500">
                      <i class="fas fa-coins mr-1"></i>Comisiones
                    </label>
                    <input type="text" v-model="form.renunciaComisiones" placeholder="Valor comisiones..."
                      class="px-3 py-2 rounded-lg border text-xs font-semibold outline-none transition-all ring-1 ring-amber-500/30 placeholder:text-slate-500"
                      :class="isDark ? 'bg-[#161B26] border-amber-500/40 text-white' : 'bg-white border-amber-400/50 text-slate-800'" />
                  </div>
                  <!-- Horas Extra -->
                  <div class="flex flex-col gap-1">
                    <label class="text-[9px] font-semibold uppercase tracking-wide ml-0.5 text-amber-500">
                      <i class="fas fa-clock mr-1"></i>Horas Extra
                    </label>
                    <input type="text" v-model="form.renunciaHorasExtra" placeholder="Valor horas extra..."
                      class="px-3 py-2 rounded-lg border text-xs font-semibold outline-none transition-all ring-1 ring-amber-500/30 placeholder:text-slate-500"
                      :class="isDark ? 'bg-[#161B26] border-amber-500/40 text-white' : 'bg-white border-amber-400/50 text-slate-800'" />
                  </div>
                  <!-- Transporte -->
                  <div class="flex flex-col gap-1">
                    <label class="text-[9px] font-semibold uppercase tracking-wide ml-0.5 text-amber-500">
                      <i class="fas fa-bus mr-1"></i>Transporte
                    </label>
                    <input type="text" v-model="form.renunciaTransporte" placeholder="Valor transporte..."
                      class="px-3 py-2 rounded-lg border text-xs font-semibold outline-none transition-all ring-1 ring-amber-500/30 placeholder:text-slate-500"
                      :class="isDark ? 'bg-[#161B26] border-amber-500/40 text-white' : 'bg-white border-amber-400/50 text-slate-800'" />
                  </div>
                </div>
              </transition>

              <!-- Archivos adjuntos (múltiples) -->
              <div class="flex flex-col gap-1.5">
                <label class="text-[9px] font-semibold uppercase tracking-wide ml-0.5"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                  Archivos de Soporte
                  <span class="ml-1 opacity-35 normal-case font-medium text-[8px]">Solo PDF e imágenes — máx 10
                    archivos, 20 MB c/u</span>
                </label>

                <!-- Zona de drop -->
                <div @dragover.prevent="dragOver = true" @dragleave="dragOver = false" @drop.prevent="onDrop"
                  class="flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed transition-all cursor-pointer"
                  :class="[dragOver ? 'border-[#3B82F6] bg-[#3B82F6]/5' : (isDark ? 'border-[#222938] bg-[#161B26]' : 'border-slate-200 bg-slate-50')]"
                  @click="$refs.fileInput.click()">
                  <i class="fas fa-cloud-arrow-up text-[#3B82F6] text-sm shrink-0"></i>
                  <span class="flex-1 text-[10px] font-medium text-slate-400">
                    {{ archivosSeleccionados.length ? `${archivosSeleccionados.length} archivo(s) seleccionado(s)` :
                      'Arrastra o haz clic para seleccionar...' }}
                  </span>
                  <input ref="fileInput" type="file" multiple @change="onFilesChange" class="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" />
                  <span
                    class="shrink-0 px-3 py-1 rounded-md bg-[#3B82F6] text-white text-[9px] font-semibold uppercase">
                    Elegir
                  </span>
                </div>

                <!-- Lista de archivos seleccionados -->
                <div v-if="archivosSeleccionados.length"
                  class="flex flex-col gap-1 max-h-[136px] overflow-y-auto pr-0.5">
                  <div v-for="(file, idx) in archivosSeleccionados" :key="idx"
                    class="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                    :class="isDark ? 'border-[#222938] bg-[#161B26]' : 'border-slate-100 bg-white'">
                    <i :class="['text-sm shrink-0', getFileIcon(file)]"></i>
                    <span class="flex-1 text-[10px] font-medium truncate"
                      :class="isDark ? 'text-slate-200' : 'text-slate-700'">{{ file.name }}</span>
                    <span class="text-[9px] opacity-40 shrink-0"
                      :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ formatSize(file.size) }}</span>
                    <button @click.prevent="quitarArchivo(idx)" type="button"
                      class="shrink-0 w-5 h-5 flex items-center justify-center rounded-md text-rose-400 hover:bg-rose-500/10 transition-all">
                      <i class="fas fa-xmark text-[9px]"></i>
                    </button>
                  </div>
                </div>

                <!-- Error de tipo -->
                <p v-if="archivoError" class="text-[9px] text-rose-400 font-semibold flex items-center gap-1">
                  <i class="fas fa-circle-exclamation"></i> {{ archivoError }}
                </p>
              </div>

            </div>

            <!-- Mensaje estado submit -->
            <transition name="fade-msg">
              <div v-if="submitStatus"
                class="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-semibold border"
                :class="submitStatus === 'ok' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'">
                <i :class="submitStatus === 'ok' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
                {{ submitMessage }}
              </div>
            </transition>

            <!-- Footer -->
            <div class="flex items-center justify-between pt-3 mt-auto border-t"
              :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
              <button @click.prevent="resetForm" type="button"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-wide transition-all active:scale-[0.98] border"
                :class="isDark ? 'text-slate-500 border-[#222938] hover:text-slate-300 hover:border-slate-500' : 'text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300'">
                <i class="fas fa-rotate-left text-[9px]"></i> Limpiar
              </button>
              <button type="submit" :disabled="loading"
                class="group flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold uppercase tracking-wide text-[9px] transition-all active:scale-[0.98] shadow-sm disabled:opacity-60 disabled:cursor-wait"
                :class="isDark ? 'bg-[#3B82F6] text-white hover:brightness-110' : 'bg-[#0B0F19] text-white hover:bg-slate-700'">
                <i v-if="loading" class="fas fa-circle-notch fa-spin text-[9px]"></i>
                <i v-else class="fas fa-check-circle text-[9px] group-hover:scale-110 transition-transform"></i>
                {{ loading ? 'Guardando...' : 'Guardar Novedad' }}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import MisAprobacionesView from './MisAprobacionesView.vue';
import { useNovedades } from '../../composables/adminLogica/useNovedades';
import { useNovedades as useNovedadesUsuario } from '../../composables/adminLogica/useNovedadesUsuario';

const props = defineProps({
  isDark: Boolean,
  company: String,
  employee: Object,
});

const { crearNovedad, loading } = useNovedades();
const { jefe, fetchJefeDeArea } = useNovedadesUsuario();

const vistaActiva = ref('registro');
const storageMode = ref('local');

const form = ref({
  nombre: '', cedula: '', descripcion: '', tipificacion: '',
  fechaInicio: '', fechaFin: '', ultimoDiaTrabajado: '',
  renunciaDescuento: '', renunciaComisiones: '', renunciaHorasExtra: '', renunciaTransporte: '',
});

const TIPIFICACIONES = [
  'Renuncia', 'No remunerado', 'Días compensatorios', 'Horas extra',
  'Día familia', 'Día cumpleaños', 'Incapacidades', 'Citas médicas',
  'Calamidad doméstica', 'Licencia maternidad', 'Licencia luto', 'Otros'
];

// ─── Multi-file ───────────────────────────────────────────────────────────────
const archivosSeleccionados = ref([]);
const archivoError = ref('');
const dragOver = ref(false);
const submitStatus = ref('');
const submitMessage = ref('');

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const getMimeIcon = (mime = '') => {
  if (mime === 'application/pdf') return 'fas fa-file-pdf text-red-400';
  if (mime.startsWith('image/')) return 'fas fa-file-image text-violet-400';
  return 'fas fa-file text-slate-400';
};
const getFileIcon = (file) => getMimeIcon(file.type);
const formatSize = (bytes) => bytes > 1024 * 1024
  ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
  : `${(bytes / 1024).toFixed(0)} KB`;

const agregarArchivos = (files) => {
  archivoError.value = '';
  for (const f of files) {
    if (!ALLOWED_TYPES.includes(f.type)) {
      archivoError.value = `"${f.name}" no es PDF ni imagen. Solo se aceptan PDF, JPG, PNG, GIF o WEBP.`;
      return;
    }
    if (archivosSeleccionados.value.length >= 10) {
      archivoError.value = 'Máximo 10 archivos por novedad.';
      return;
    }
    if (!archivosSeleccionados.value.find(x => x.name === f.name && x.size === f.size)) {
      archivosSeleccionados.value.push(f);
    }
  }
};

const onFilesChange = (e) => agregarArchivos([...e.target.files]);
const onDrop = (e) => { dragOver.value = false; agregarArchivos([...(e.dataTransfer?.files ?? [])]); };
const quitarArchivo = (idx) => archivosSeleccionados.value.splice(idx, 1);

// ─── Submit ───────────────────────────────────────────────────────────────────
const handleSubmit = async () => {
  submitStatus.value = '';
  archivoError.value = '';
  try {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const res = await crearNovedad({
      nombre: form.value.nombre,
      cedula: form.value.cedula,
      descripcion: form.value.descripcion,
      tipificacion: form.value.tipificacion,
      fechaInicio: form.value.tipificacion === 'Renuncia' ? form.value.ultimoDiaTrabajado : form.value.fechaInicio,
      fechaFin: form.value.tipificacion === 'Renuncia' ? form.value.ultimoDiaTrabajado : form.value.fechaFin,
      ultimoDiaTrabajado: form.value.tipificacion === 'Renuncia' ? (form.value.ultimoDiaTrabajado || null) : null,
      renunciaDescuento: form.value.tipificacion === 'Renuncia' ? (form.value.renunciaDescuento || null) : null,
      renunciaComisiones: form.value.tipificacion === 'Renuncia' ? (form.value.renunciaComisiones || null) : null,
      renunciaHorasExtra: form.value.tipificacion === 'Renuncia' ? (form.value.renunciaHorasExtra || null) : null,
      renunciaTransporte: form.value.tipificacion === 'Renuncia' ? (form.value.renunciaTransporte || null) : null,
      archivos: archivosSeleccionados.value,
      storageMode: storageMode.value,
      responsableIdOdoo: jefe.value?.id_odoo ?? null,
      responsableNombre: jefe.value?.name ?? null,
      responsableCargo: jefe.value?.job ?? null,
      creadoPor: session.id_odoo ?? null,
    });
    submitStatus.value = 'ok';
    submitMessage.value = `Novedad guardada correctamente (ID ${res?.data?.id ?? ''}).`;
    resetForm();
    setTimeout(() => { submitStatus.value = ''; }, 5000);
  } catch (e) {
    submitStatus.value = 'error';
    submitMessage.value = e?.response?.data?.message || 'Error al guardar la novedad.';
  }
};

// ─── Reset ────────────────────────────────────────────────────────────────────
const resetForm = () => {
  form.value = {
    nombre: '', cedula: '', descripcion: '', tipificacion: '',
    fechaInicio: '', fechaFin: '', ultimoDiaTrabajado: '',
    renunciaDescuento: '', renunciaComisiones: '', renunciaHorasExtra: '', renunciaTransporte: '',
  };
  archivosSeleccionados.value = [];
  archivoError.value = '';
  submitStatus.value = '';
};

// ─── onMounted ────────────────────────────────────────────────────────────────
onMounted(async () => {
  const session = JSON.parse(localStorage.getItem('user_session') || '{}');
  const department = props.employee?.department || session?.department;
  if (department) await fetchJefeDeArea(department);
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/sistema-config`);
    if (res.ok) {
      const cfg = await res.json();
      if (cfg.storage_mode) storageMode.value = cfg.storage_mode;
    }
  } catch { }
});
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: all 0.3s ease;
}

.slide-panel-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-panel-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.fade-msg-enter-active,
.fade-msg-leave-active {
  transition: all 0.25s ease;
}

.fade-msg-enter-from,
.fade-msg-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>