<template>

  <div class="w-full h-full">

    <MisAprobacionesView v-if="vistaActiva === 'aprobaciones'" :isDark="isDark" @volver="vistaActiva = 'registro'" />
    <div v-else class="w-full h-full animate-fade-in transition-colors duration-500 flex flex-col gap-1">

      <!-- ADMIN -->
      <!-- Header SEPARADO -->
      <div class="flex items-center justify-between gap-2 p-1.5 px-3 rounded-2xl border shrink-0 shadow-sm"
        :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

        <div class="flex items-center gap-2 ml-1">
          <div class="w-7 h-7 flex items-center justify-center rounded-xl bg-[#FF8F00] text-white shadow-sm shrink-0">
            <i class="fas fa-file-signature text-xs"></i>
          </div>
          <div>
            <h2 class="text-base font-black uppercase tracking-tighter"
              :class="isDark ? 'text-white' : 'text-slate-800'">
              Registro <span class="text-[#FF8F00]">Novedad</span>
            </h2>
            <p class="text-[8px] font-bold opacity-50 uppercase tracking-[0.2em]"
              :class="isDark ? 'text-slate-400' : 'text-slate-500'">
              {{ company || 'Woden Track' }}
            </p>
          </div>
        </div>
        <button @click="vistaActiva = 'aprobaciones'"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-black uppercase italic tracking-widest border transition-all hover:scale-105 active:scale-95"
          :class="isDark ? 'bg-[#273045] border-[#2d3548] text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'">
          <i class="fas fa-clock text-[#FF8F00]"></i>
          Listado
        </button>

        <!-- Indicador de almacenamiento (solo lectura, configurado en Super Admin) -->
        <div
          class="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest mr-1"
          :class="storageMode === 's3'
            ? 'bg-[#FF8F00]/10 text-[#FF8F00] border-[#FF8F00]/30'
            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'">
          <i :class="storageMode === 's3' ? 'fab fa-aws' : 'fas fa-hard-drive'"></i>
          {{ storageMode === 's3' ? 'AWS S3' : 'Local' }}
        </div>
      </div>

      <!-- BODY: formulario + visor lado a lado -->
      <div class="flex-1 flex gap-1 overflow-hidden">

        <!-- Formulario SEPARADO -->
        <div class="flex flex-col overflow-hidden rounded-2xl border transition-all duration-300" :class="[
          viewerOpen ? 'w-1/2' : 'w-full',
          isDark ? 'bg-[#1e2538] border-[#2d3548] shadow-black/40' : 'bg-white border-slate-200 shadow-slate-100'
        ]">

          <form @submit.prevent="handleSubmit" class="flex-1 flex flex-col p-5 gap-4 overflow-y-auto">

            <!-- Banner modo storage -->
            <div class="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold border" :class="storageMode === 's3'
              ? 'bg-[#FF8F00]/10 border-[#FF8F00]/25 text-[#FF8F00]'
              : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600'">
              <i :class="storageMode === 's3' ? 'fab fa-aws' : 'fas fa-hard-drive'"></i>
              <span v-if="storageMode === 's3'">
                Soporte → <strong>AWS S3</strong>
              </span>
              <span v-else>
                Soporte → <strong>carpeta local</strong>
                <code class="ml-1 opacity-50 text-[9px]">/uploads/novedades/</code>
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">

              <!-- Nombre -->
              <div class="flex flex-col gap-1.5">
                <label class="text-[9px] font-black uppercase tracking-widest ml-1"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Nombre</label>
                <div
                  class="flex items-center gap-3 px-4 py-2.5 rounded-lg border focus-within:ring-1 focus-within:ring-[#FF8F00]/30 transition-all text-xs"
                  :class="isDark ? 'bg-[#273045] border-[#2d3548]' : 'bg-white border-slate-200 shadow-sm'">
                  <i class="fas fa-user-circle text-[#FF8F00]/80 text-sm"></i>
                  <input type="text" v-model="form.nombre" placeholder="Nombre completo..." required
                    class="bg-transparent w-full font-bold outline-none placeholder:text-slate-500"
                    :class="isDark ? 'text-white' : 'text-slate-800'" />
                </div>
              </div>

              <!-- Jefe de área detectado -->
              <div v-if="jefe" class="md:col-span-2 flex items-center gap-3 px-4 py-2.5 rounded-lg border"
                :class="isDark ? 'bg-[#273045] border-[#2d3548]' : 'bg-slate-50 border-slate-200'">
                <div
                  class="w-7 h-7 rounded-lg bg-[#FF8F00]/10 flex items-center justify-center text-[10px] font-black text-[#FF8F00] shrink-0">
                  {{ jefe.name?.charAt(0) ?? '?' }}
                </div>
                <div class="flex flex-col flex-1">
                  <span class="text-[8px] font-black uppercase tracking-widest opacity-50"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Jefe directo</span>
                  <span class="text-[10px] font-black uppercase" :class="isDark ? 'text-white' : 'text-slate-800'">{{
                    jefe.name }}</span>
                  <span class="text-[9px] opacity-40" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ jefe.job
                    || '' }}</span>
                </div>
                <span
                  class="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-[#FF8F00]/10 text-[#FF8F00] border border-[#FF8F00]/20">
                  <i class="fas fa-user-tie mr-1"></i>Responsable
                </span>
              </div>
              <!-- Cédula -->
              <div class="flex flex-col gap-1.5">
                <label class="text-[9px] font-black uppercase tracking-widest ml-1"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cédula</label>
                <div
                  class="flex items-center gap-3 px-4 py-2.5 rounded-lg border focus-within:ring-1 focus-within:ring-[#FF8F00]/30 transition-all text-xs"
                  :class="isDark ? 'bg-[#273045] border-[#2d3548]' : 'bg-white border-slate-200 shadow-sm'">
                  <i class="fas fa-id-card text-[#FF8F00]/80 text-sm"></i>
                  <input type="number" v-model="form.cedula" placeholder="Número identificación..." required
                    class="bg-transparent w-full font-bold outline-none placeholder:text-slate-500"
                    :class="isDark ? 'text-white' : 'text-slate-800'" />
                </div>
              </div>

              <!-- Fecha Inicio -->
              <div class="flex flex-col gap-1.5">
                <label class="text-[9px] font-black uppercase tracking-widest ml-1"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Fecha Inicio</label>
                <input type="date" v-model="form.fechaInicio" required
                  class="px-4 py-2.5 rounded-lg border text-xs font-bold outline-none transition-all"
                  :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white [color-scheme:dark]' : 'bg-white border-slate-200 text-slate-800'" />
              </div>

              <!-- Fecha Fin -->
              <div class="flex flex-col gap-1.5">
                <label class="text-[9px] font-black uppercase tracking-widest ml-1"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Fecha Fin</label>
                <input type="date" v-model="form.fechaFin" required
                  class="px-4 py-2.5 rounded-lg border text-xs font-bold outline-none transition-all"
                  :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white [color-scheme:dark]' : 'bg-white border-slate-200 text-slate-800'" />
              </div>

              <!-- Descripción -->
              <div class="md:col-span-2 flex flex-col gap-1.5">
                <label class="text-[9px] font-black uppercase tracking-widest ml-1"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Descripción</label>
                <textarea v-model="form.descripcion" rows="3" placeholder="Explique el motivo..." required
                  class="px-4 py-3 rounded-lg border text-xs font-medium outline-none resize-none transition-all placeholder:text-slate-500"
                  :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'">
              </textarea>
              </div>

              <div class="md:col-span-2 flex flex-col gap-1.5">
                <label class="text-[9px] font-black uppercase tracking-widest ml-1"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Tipificación</label>
                <select v-model="form.tipificacion" required
                  class="px-4 py-3 rounded-lg border text-xs font-medium outline-none transition-all" :class="isDark
                    ? 'bg-[#273045] border-[#2d3548] text-white'
                    : 'bg-white border-slate-200 text-slate-800 shadow-sm'">
                  <option value="" disabled>Seleccione el tipo de novedad...</option>
                  <option v-for="tip in TIPIFICACIONES" :key="tip" :value="tip">{{ tip }}</option>
                </select>
              </div>


              <!-- Soporte -->
              <div class="md:col-span-2 flex flex-col gap-2">
                <label class="text-[9px] font-black uppercase tracking-widest ml-1"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                  Documento de Soporte
                  <span class="ml-1 opacity-40 normal-case font-medium text-[9px]">
                    PDF, imagen, Word, Excel — máx 20 MB
                  </span>
                </label>

                <!-- Drop zone -->
                <div @dragover.prevent="dragOver = true" @dragleave="dragOver = false" @drop.prevent="onDrop"
                  class="flex items-center p-1.5 rounded-lg border transition-all" :class="[
                    dragOver ? 'border-dashed border-[#FF8F00] scale-[1.01]' : '',
                    isDark ? 'bg-[#273045] border-[#2d3548]' : 'bg-white border-slate-200 shadow-sm'
                  ]">
                  <div class="flex-1 px-3 truncate text-[10px] font-bold" :class="fileName
                    ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
                    : (isDark ? 'text-slate-500' : 'text-slate-400')">
                    <i
                      :class="['mr-2', fileName ? 'fas fa-file-check text-emerald-500' : 'fas fa-file-upload text-[#FF8F00]']"></i>
                    {{ fileName || 'Ningún archivo seleccionado...' }}
                  </div>

                  <!-- Botón Ver — solo aparece cuando hay archivo -->
                  <button v-if="previewUrl" @click.prevent="toggleViewer" type="button"
                    class="px-3 py-2 rounded-md mr-1 text-[10px] font-black uppercase italic transition-all hover:brightness-110 active:scale-95 flex items-center gap-1 border"
                    :class="isDark ? 'bg-[#2d3548] text-slate-300 border-[#3d4558]' : 'bg-slate-100 text-slate-600 border-slate-200'">
                    <i class="fas fa-eye text-[#FF8F00]"></i>
                    {{ viewerOpen ? 'Cerrar' : 'Ver' }}
                  </button>

                  <input type="file" @change="onFileChange" id="file-upload" class="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
                  <label for="file-upload"
                    class="px-4 py-2 rounded-md bg-[#FF8F00] text-black text-[10px] font-black uppercase italic cursor-pointer hover:brightness-110 active:scale-95 transition-all">
                    {{ fileName ? 'Cambiar' : 'Subir' }}
                  </label>
                </div>

                <!-- Miniatura si es imagen -->
                <div v-if="previewUrl && isImage"
                  class="rounded-xl overflow-hidden border max-h-28 flex items-center justify-center"
                  :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-100 bg-slate-50'">
                  <img :src="previewUrl" class="max-h-28 object-contain" />
                </div>

                <!-- Info otros tipos -->
                <div v-else-if="fileName" class="flex items-center gap-3 px-4 py-3 rounded-xl border"
                  :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-100 bg-slate-50'">
                  <i :class="['text-xl', fileIcon]"></i>
                  <div>
                    <p class="text-[11px] font-bold truncate max-w-xs"
                      :class="isDark ? 'text-white' : 'text-slate-700'">
                      {{ fileName }}</p>
                    <p class="text-[9px] opacity-50" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ fileSize
                    }}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            <!-- Mensaje estado submit -->
            <transition name="fade-msg">
              <div v-if="submitStatus"
                class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-bold border" :class="submitStatus === 'ok'
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'">
                <i :class="submitStatus === 'ok' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
                {{ submitMessage }}
              </div>
            </transition>

            <!-- Footer -->
            <div class="flex items-center justify-between pt-4 mt-auto border-t"
              :class="isDark ? 'border-[#2d3548]' : 'border-slate-200'">

              <button @click.prevent="resetForm" type="button"
                class="px-5 py-2.5 rounded-lg font-black uppercase italic tracking-widest text-[10px] transition-all active:scale-95 flex items-center gap-2 border"
                :class="isDark
                  ? 'text-slate-400 border-[#2d3548] hover:text-slate-200 hover:border-slate-500'
                  : 'text-slate-400 border-slate-200 hover:text-slate-700 hover:border-slate-400'">
                <i class="fas fa-rotate-left text-[10px]"></i> Limpiar
              </button>

              <button type="submit" :disabled="loading"
                class="group px-8 py-2.5 rounded-lg font-black uppercase italic tracking-widest text-[10px] transition-all active:scale-95 shadow-md flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                :class="isDark ? 'bg-[#FF8F00] text-black hover:brightness-110' : 'bg-slate-900 text-white hover:bg-slate-700'">
                <i v-if="loading" class="fas fa-circle-notch fa-spin text-[10px]"></i>
                <i v-else class="fas fa-check-circle text-[10px] group-hover:scale-110 transition-transform"></i>
                {{ loading ? 'Guardando...' : 'Guardar Novedad' }}
              </button>

            </div>
          </form>
        </div>

        <!-- Panel visor de archivo -->
        <transition name="slide-panel">
          <div v-if="viewerOpen && previewUrl" class="flex flex-col w-1/2 rounded-2xl border overflow-hidden"
            :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

            <!-- Toolbar visor -->
            <div class="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
              :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
              <div class="flex items-center gap-2">
                <i class="fas fa-eye text-[#FF8F00] text-xs"></i>
                <span class="text-[11px] font-black uppercase tracking-widest"
                  :class="isDark ? 'text-white' : 'text-slate-700'">Vista Previa</span>
                <span class="text-[10px] font-bold truncate max-w-[140px] opacity-50"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ fileName }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <a :href="previewUrl" :download="fileName"
                  class="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all hover:brightness-110 flex items-center gap-1"
                  :class="isDark ? 'bg-[#273045] text-slate-300 border-[#3d4558]' : 'bg-slate-100 text-slate-600 border-slate-200'">
                  <i class="fas fa-download text-[#FF8F00]"></i> Descargar
                </a>
                <button @click="viewerOpen = false"
                  class="w-7 h-7 rounded-lg flex items-center justify-center border transition-all"
                  :class="isDark ? 'bg-[#273045] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-500 border-slate-200'">
                  <i class="fas fa-xmark text-xs"></i>
                </button>
              </div>
            </div>

            <!-- Contenido visor -->
            <div class="flex-1 overflow-hidden flex items-center justify-center p-2"
              :class="isDark ? 'bg-[#151c2c]' : 'bg-slate-50'">
              <img v-if="isImage" :src="previewUrl" class="max-w-full max-h-full object-contain rounded-lg shadow-xl" />
              <iframe v-else-if="isPdf" :src="previewUrl" class="w-full h-full rounded-lg border-0"
                title="Vista previa PDF" />
              <div v-else class="flex flex-col items-center gap-4 opacity-60">
                <i :class="['text-6xl', fileIcon]"></i>
                <p class="text-xs text-center" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                  Vista previa no disponible.<br />
                  <span class="opacity-60 text-[10px]">Descarga el archivo para abrirlo.</span>
                </p>
              </div>
            </div>

          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import MisAprobacionesView from './MisAprobacionesView.vue';

const props = defineProps({
  isDark: Boolean,
  company: String,
  employee: Object,
});

// ─── Composable ───────────────────────────────────────────────────────────────
import { useNovedades } from '../../composables/adminLogica/useNovedades';
import { useNovedades as useNovedadesUsuario } from '../../composables/adminLogica/useNovedadesUsuario';

const { crearNovedad, loading } = useNovedades();
const { jefe, fetchJefeDeArea } = useNovedadesUsuario();

// AÑADIR esto (después de los refs)
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

// ─── Storage mode: se lee desde la config del sistema (Super Admin) ──────────
const storageMode = ref('local');

// ─── Form — misma estructura que tenías ──────────────────────────────────────
const form = ref({
  nombre: '', cedula: '', descripcion: '', tipificacion: '',
  fechaInicio: '', fechaFin: '', soporte: null,
});


const TIPIFICACIONES = [
  'Vacaciones', 'No remunerado', 'Días compensatorios', 'Horas extra',
  'Día familia', 'Día cumpleaños', 'Incapacidades', 'Citas médicas',
  'Calamidad doméstica', 'Licencia maternidad', 'Licencia luto',
];

// ─── Estado archivo ───────────────────────────────────────────────────────────
const fileName = ref('');
const fileSize = ref('');
const previewUrl = ref('');
const dragOver = ref(false);
const viewerOpen = ref(false);

// ─── Estado submit ────────────────────────────────────────────────────────────
const submitStatus = ref(''); // '' | 'ok' | 'error'
const submitMessage = ref('');

// ─── Computed tipo de archivo ─────────────────────────────────────────────────
const ext = computed(() => fileName.value.split('.').pop().toLowerCase());
const isImage = computed(() => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext.value));
const isPdf = computed(() => ext.value === 'pdf');
const fileIcon = computed(() => {
  if (isImage.value) return 'fas fa-file-image text-violet-400';
  if (isPdf.value) return 'fas fa-file-pdf text-red-400';
  if (['doc', 'docx'].includes(ext.value)) return 'fas fa-file-word text-blue-400';
  if (['xls', 'xlsx'].includes(ext.value)) return 'fas fa-file-excel text-emerald-400';
  return 'fas fa-file text-slate-400';
});

// ─── Manejo de archivo ────────────────────────────────────────────────────────
const processFile = (file) => {
  if (!file) return;
  form.value.soporte = file;
  fileName.value = file.name;
  fileSize.value = file.size > 1024 * 1024
    ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
    : `${(file.size / 1024).toFixed(0)} KB`;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = URL.createObjectURL(file);
};
const vistaActiva = ref('registro');
// Igual que tu handleFileUpload original, pero renombrado para claridad
const onFileChange = (e) => processFile(e.target.files[0]);
const onDrop = (e) => { dragOver.value = false; processFile(e.dataTransfer?.files[0]); };
const toggleViewer = () => { viewerOpen.value = !viewerOpen.value; };

// ─── Submit — reemplaza el alert por llamada real ─────────────────────────────
const handleSubmit = async () => {
  if (!form.value.soporte) {
    submitStatus.value = 'error';
    submitMessage.value = 'Por favor cargue un documento de soporte.';
    return;
  }

  submitStatus.value = '';
  try {
    const res = await crearNovedad({
      nombre: form.value.nombre,
      cedula: form.value.cedula,
      descripcion: form.value.descripcion,
      tipificacion: form.value.tipificacion,
      fechaInicio: form.value.fechaInicio,
      fechaFin: form.value.fechaFin,
      soporte: form.value.soporte,
      storageMode: storageMode.value,

      // ─── AÑADIR ESTO ───────────────────────────
      responsableIdOdoo: jefe.value?.id_odoo ?? null,
      responsableNombre: jefe.value?.name ?? null,
      responsableCargo: jefe.value?.job ?? null,
    });
    submitStatus.value = 'ok';
    submitMessage.value = `Novedad guardada correctamente (ID ${res?.data?.id ?? ''}).`;
    setTimeout(() => { submitStatus.value = ''; }, 5000);

  } catch (e) {
    submitStatus.value = 'error';
    submitMessage.value = e?.response?.data?.message || 'Error al guardar la novedad.';
  }
};

// ─── Reset ────────────────────────────────────────────────────────────────────
const resetForm = () => {
  form.value = { nombre: '', cedula: '', descripcion: '', tipificacion: '', fechaInicio: '', fechaFin: '', soporte: null };
  fileName.value = fileSize.value = previewUrl.value = '';
  viewerOpen.value = false;
  submitStatus.value = '';
};
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