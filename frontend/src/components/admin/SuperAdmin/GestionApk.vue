<template>
  <div class="apk-root" :class="isDark ? 'apk-dark' : 'apk-light'">
    <div class="apk-grid">

      <!-- ══ SUBIR APK ══════════════════════════════════════════════════════ -->
      <div class="apk-card" :class="isDark ? 'apk-card-dark' : 'apk-card-light'">

        <!-- Header -->
        <div class="apk-card-head" :class="isDark ? 'apk-chead-dark' : 'apk-chead-light'">
          <div class="apk-icon-wrap apk-icon-indigo">
            <i class="fas fa-cloud-arrow-up text-[11px] text-indigo-400"></i>
          </div>
          <span class="apk-card-title" :class="isDark ? 'text-white' : 'text-slate-800'">
            Actualizar software
          </span>
        </div>

        <div class="apk-card-body">

          <!-- Zone de carga de archivo -->
          <div @click="!isUploading && $refs.fileInput.click()"
            class="apk-dropzone"
            :class="[
              isDark ? 'apk-drop-dark' : 'apk-drop-light',
              isUploading ? 'apk-drop-busy' : 'apk-drop-idle'
            ]">
            <input type="file" ref="fileInput" @change="handleFileUpload" class="hidden" accept=".apk" />

            <i class="fab fa-android text-3xl"
              :class="selectedFile ? 'text-indigo-400' : (isDark ? 'text-white/20' : 'text-slate-300')"></i>

            <p class="apk-drop-label" :class="isDark ? 'text-white/60' : 'text-slate-500'">
              {{ selectedFile ? selectedFile.name : 'Clic para seleccionar APK' }}
            </p>
            <p v-if="selectedFile" class="apk-drop-size text-amber-400">
              {{ (selectedFile.size / (1024 * 1024)).toFixed(2) }} MB
            </p>
            <p v-else class="apk-drop-hint" :class="isDark ? 'text-white/20' : 'text-slate-300'">
              Solo archivos .apk
            </p>
          </div>

          <!-- Banner de estado de publicación -->
          <Transition name="apk-status">
            <div v-if="uploadStatus !== 'idle'" class="apk-status-banner"
              :class="{
                'apk-status-uploading': uploadStatus === 'uploading',
                'apk-status-publishing': uploadStatus === 'publishing',
                'apk-status-success': uploadStatus === 'success',
                'apk-status-error': uploadStatus === 'error',
              }">

              <!-- Uploading -->
              <template v-if="uploadStatus === 'uploading'">
                <div class="apk-status-inner">
                  <i class="fas fa-circle-notch fa-spin text-indigo-400 text-[13px]"></i>
                  <div>
                    <p class="apk-status-title">Subiendo APK</p>
                    <p class="apk-status-sub">Transfiriendo archivo al servidor…</p>
                  </div>
                </div>
                <div class="apk-progress-track">
                  <div class="apk-progress-bar apk-progress-indigo"></div>
                </div>
              </template>

              <!-- Publishing -->
              <template v-else-if="uploadStatus === 'publishing'">
                <div class="apk-status-inner">
                  <i class="fas fa-satellite-dish fa-pulse text-amber-400 text-[13px]"></i>
                  <div>
                    <p class="apk-status-title">Publicando</p>
                    <p class="apk-status-sub">Procesando y registrando nueva versión…</p>
                  </div>
                </div>
                <div class="apk-progress-track">
                  <div class="apk-progress-bar apk-progress-amber apk-progress-pulse"></div>
                </div>
              </template>

              <!-- Success -->
              <template v-else-if="uploadStatus === 'success'">
                <div class="apk-status-inner">
                  <div class="apk-success-icon">
                    <i class="fas fa-check text-[11px] text-white"></i>
                  </div>
                  <div>
                    <p class="apk-status-title apk-title-success">¡Publicación exitosa!</p>
                    <p class="apk-status-sub">La nueva versión está disponible para los usuarios.</p>
                  </div>
                </div>
              </template>

              <!-- Error -->
              <template v-else-if="uploadStatus === 'error'">
                <div class="apk-status-inner">
                  <i class="fas fa-circle-exclamation text-rose-400 text-[13px]"></i>
                  <div>
                    <p class="apk-status-title apk-title-error">Error al publicar</p>
                    <p class="apk-status-sub">Verifica el archivo e intenta de nuevo.</p>
                  </div>
                </div>
              </template>

            </div>
          </Transition>

          <!-- Botón publicar -->
          <button v-if="selectedFile || uploadStatus === 'error'"
            @click="handleUpload"
            :disabled="isUploading"
            class="apk-btn-publish"
            :class="isUploading ? 'apk-btn-disabled' : 'apk-btn-amber'">
            <i class="text-[9px]" :class="isUploading ? 'fas fa-circle-notch fa-spin' : 'fas fa-rocket'"></i>
            {{ isUploading ? 'Procesando…' : 'Publicar versión' }}
          </button>

        </div>
      </div>

      <!-- ══ CHANGELOG ══════════════════════════════════════════════════════ -->
      <div class="apk-card" :class="isDark ? 'apk-card-dark' : 'apk-card-light'">

        <!-- Header -->
        <div class="apk-card-head" :class="isDark ? 'apk-chead-dark' : 'apk-chead-light'">
          <div class="apk-icon-wrap apk-icon-emerald">
            <i class="fas fa-list-check text-[11px] text-emerald-400"></i>
          </div>
          <span class="apk-card-title" :class="isDark ? 'text-white' : 'text-slate-800'">
            Control de cambios
          </span>
          <button @click="addNote" class="apk-add-btn">
            <i class="fas fa-plus text-[9px]"></i>
          </button>
        </div>

        <div class="apk-card-body">

          <!-- Lista novedades -->
          <div class="apk-changelog-list">
            <TransitionGroup name="list">
              <div v-for="(note, i) in localChangelog" :key="i" class="apk-note-row">
                <span class="apk-note-bullet" :class="isDark ? 'text-white/20' : 'text-slate-300'">›</span>
                <input v-model="localChangelog[i]"
                  class="apk-note-input"
                  :class="isDark ? 'apk-input-dark' : 'apk-input-light'"
                  placeholder="Ej: Optimización de velocidad…" />
                <button @click="removeNote(i)" class="apk-note-del"
                  :class="isDark ? 'apk-del-dark' : 'apk-del-light'">
                  <i class="fas fa-trash-alt text-[9px]"></i>
                </button>
              </div>
            </TransitionGroup>

            <div v-if="!localChangelog.length" class="apk-empty"
              :class="isDark ? 'text-white/20' : 'text-slate-300'">
              Sin novedades — agrega una
            </div>
          </div>

          <!-- Banner guardar -->
          <Transition name="apk-status">
            <div v-if="saveStatus !== 'idle'" class="apk-status-banner apk-status-banner-sm"
              :class="{
                'apk-status-uploading': saveStatus === 'saving',
                'apk-status-success':   saveStatus === 'saved',
                'apk-status-error':     saveStatus === 'error',
              }">
              <div class="apk-status-inner">

                <template v-if="saveStatus === 'saving'">
                  <i class="fas fa-circle-notch fa-spin text-indigo-400 text-[12px]"></i>
                  <p class="apk-status-title">Guardando novedades…</p>
                </template>

                <template v-else-if="saveStatus === 'saved'">
                  <div class="apk-success-icon">
                    <i class="fas fa-check text-[10px] text-white"></i>
                  </div>
                  <p class="apk-status-title apk-title-success">¡Historial guardado!</p>
                </template>

                <template v-else-if="saveStatus === 'error'">
                  <i class="fas fa-circle-exclamation text-rose-400 text-[12px]"></i>
                  <p class="apk-status-title apk-title-error">Error al guardar</p>
                </template>

              </div>
            </div>
          </Transition>

          <!-- Botón guardar -->
          <button @click="handleSaveChangelog"
            :disabled="saveStatus === 'saving'"
            class="apk-btn-save"
            :class="saveStatus === 'saving' ? 'apk-btn-disabled' : 'apk-btn-indigo'">
            <i class="text-[9px]" :class="saveStatus === 'saving' ? 'fas fa-circle-notch fa-spin' : 'fas fa-floppy-disk'"></i>
            {{ saveStatus === 'saving' ? 'Guardando…' : 'Guardar novedades' }}
          </button>

        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useApkRepo } from '../../../composables/adminLogica/useApkRepo';

const props = defineProps({ isDark: Boolean });
const emit  = defineEmits(['success', 'error']);

const { apkData, fetchApkInfo, subirApk, guardarNovedades } = useApkRepo();

const selectedFile  = ref(null);
const localChangelog = ref([]);

// 'idle' | 'uploading' | 'publishing' | 'success' | 'error'
const uploadStatus = ref('idle');
// 'idle' | 'saving' | 'saved' | 'error'
const saveStatus   = ref('idle');

const isUploading = computed(() =>
  uploadStatus.value === 'uploading' || uploadStatus.value === 'publishing'
);

const handleFileUpload = (e) => {
  selectedFile.value = e.target.files[0];
  uploadStatus.value = 'idle';
};

const handleUpload = async () => {
  if (!selectedFile.value) return;
  try {
    uploadStatus.value = 'uploading';
    await subirApk(selectedFile.value);

    uploadStatus.value = 'publishing';
    // Pequeña pausa visual para que el usuario vea el estado "Publicando"
    await new Promise(r => setTimeout(r, 900));

    uploadStatus.value = 'success';
    emit('success', 'APK publicada correctamente');
    selectedFile.value = null;
    await fetchApkInfo();

    setTimeout(() => { uploadStatus.value = 'idle'; }, 3500);
  } catch {
    uploadStatus.value = 'error';
    emit('error', 'Error al subir archivo');
  }
};

const addNote    = () => localChangelog.value.push('');
const removeNote = (i) => localChangelog.value.splice(i, 1);

const handleSaveChangelog = async () => {
  try {
    saveStatus.value = 'saving';
    await guardarNovedades(localChangelog.value);
    saveStatus.value = 'saved';
    emit('success', 'Historial guardado');
    setTimeout(() => { saveStatus.value = 'idle'; }, 3000);
  } catch {
    saveStatus.value = 'error';
    emit('error', 'Error al guardar');
    setTimeout(() => { saveStatus.value = 'idle'; }, 3000);
  }
};

onMounted(async () => {
  await fetchApkInfo();
  if (apkData.value) localChangelog.value = [...apkData.value.changelog];
});
</script>

<style scoped>
/* ── ROOT ─────────────────────────────────────────────────── */
.apk-root  { padding: 4px; }
.apk-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 900px) { .apk-grid { grid-template-columns: 1fr; } }

/* ── CARD ─────────────────────────────────────────────────── */
.apk-card       { border-radius: 14px; border: 1px solid; overflow: hidden; display: flex; flex-direction: column; }
.apk-card-dark  { background: rgba(255,255,255,.02); border-color: rgba(255,255,255,.07); }
.apk-card-light { background: #fff; border-color: #e2e8f0; box-shadow: 0 1px 6px rgba(0,0,0,.05); }

.apk-card-head {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px; border-bottom: 1px solid;
}
.apk-chead-dark  { border-color: rgba(255,255,255,.06); }
.apk-chead-light { border-color: #f1f5f9; background: #fafbfc; }

.apk-card-body { padding: 14px; display: flex; flex-direction: column; gap: 12px; flex: 1; }

.apk-icon-wrap {
  width: 26px; height: 26px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
}
.apk-icon-indigo { background: rgba(99,102,241,.12); }
.apk-icon-emerald { background: rgba(16,185,129,.12); }

.apk-card-title {
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; flex: 1;
}

/* ── ADD BUTTON ───────────────────────────────────────────── */
.apk-add-btn {
  width: 24px; height: 24px; border-radius: 7px;
  background: rgba(16,185,129,.12); color: #10b981;
  border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background .15s;
}
.apk-add-btn:hover { background: rgba(16,185,129,.25); }

/* ── DROPZONE ─────────────────────────────────────────────── */
.apk-dropzone {
  border: 2px dashed; border-radius: 12px;
  padding: 22px 16px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 6px;
  transition: all .2s;
}
.apk-drop-idle  { cursor: pointer; }
.apk-drop-busy  { cursor: default; opacity: .6; }
.apk-drop-dark  { border-color: rgba(255,255,255,.1); }
.apk-drop-dark.apk-drop-idle:hover  { border-color: rgba(99,102,241,.5); background: rgba(255,255,255,.03); }
.apk-drop-light { border-color: #e2e8f0; }
.apk-drop-light.apk-drop-idle:hover { border-color: rgba(99,102,241,.4); background: #f8fafc; }

.apk-drop-label { font-size: 11px; font-weight: 500; text-align: center; max-width: 180px; word-break: break-all; }
.apk-drop-size  { font-size: 10px; font-weight: 700; }
.apk-drop-hint  { font-size: 10px; }

/* ── STATUS BANNER ────────────────────────────────────────── */
.apk-status-banner {
  border-radius: 10px; padding: 10px 12px;
  display: flex; flex-direction: column; gap: 8px;
  border: 1px solid;
}
.apk-status-banner-sm { padding: 8px 12px; }

.apk-status-inner { display: flex; align-items: center; gap: 10px; }
.apk-status-title { font-size: 11px; font-weight: 700; line-height: 1.2; }
.apk-status-sub   { font-size: 10px; margin-top: 1px; opacity: .7; }

.apk-status-uploading {
  background: rgba(99,102,241,.08); border-color: rgba(99,102,241,.2); color: #818cf8;
}
.apk-status-publishing {
  background: rgba(245,158,11,.08); border-color: rgba(245,158,11,.2); color: #fbbf24;
}
.apk-status-success {
  background: rgba(16,185,129,.08); border-color: rgba(16,185,129,.2); color: #34d399;
}
.apk-status-error {
  background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.2); color: #f87171;
}

.apk-title-success { color: #10b981; }
.apk-title-error   { color: #ef4444; }

/* Check icon circular */
.apk-success-icon {
  width: 22px; height: 22px; border-radius: 50%;
  background: #10b981; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

/* ── PROGRESS BAR ─────────────────────────────────────────── */
.apk-progress-track {
  height: 3px; border-radius: 99px;
  background: rgba(255,255,255,.06); overflow: hidden;
}
.apk-progress-bar {
  height: 100%; border-radius: 99px; animation: apk-sweep 1.4s ease-in-out infinite;
}
.apk-progress-indigo { background: #6366f1; }
.apk-progress-amber  { background: #f59e0b; }
.apk-progress-pulse  { animation: apk-pulse 1s ease-in-out infinite; }

@keyframes apk-sweep {
  0%   { width: 0%;   margin-left: 0%; }
  50%  { width: 60%;  margin-left: 20%; }
  100% { width: 0%;   margin-left: 100%; }
}
@keyframes apk-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: .4; }
}

/* ── BUTTONS ──────────────────────────────────────────────── */
.apk-btn-publish, .apk-btn-save {
  width: 100%; padding: 9px 0;
  border: none; border-radius: 9px; cursor: pointer;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; display: flex; align-items: center;
  justify-content: center; gap: 6px; transition: all .2s;
}
.apk-btn-amber  { background: #f59e0b; color: #000; }
.apk-btn-amber:hover { background: #fbbf24; }
.apk-btn-indigo { background: #6366f1; color: #fff; }
.apk-btn-indigo:hover { background: #818cf8; }
.apk-btn-disabled { background: rgba(100,116,139,.2); color: rgba(100,116,139,.5); cursor: not-allowed; }

/* ── CHANGELOG ────────────────────────────────────────────── */
.apk-changelog-list {
  display: flex; flex-direction: column; gap: 6px;
  max-height: 200px; overflow-y: auto; padding-right: 2px;
}
.apk-changelog-list::-webkit-scrollbar       { width: 4px; }
.apk-changelog-list::-webkit-scrollbar-track { background: transparent; }
.apk-changelog-list::-webkit-scrollbar-thumb { border-radius: 2px; background: rgba(100,116,139,.2); }

.apk-note-row    { display: flex; align-items: center; gap: 6px; }
.apk-note-bullet { font-size: 14px; flex-shrink: 0; }
.apk-note-input  {
  flex: 1; padding: 7px 10px; border-radius: 8px; border: 1px solid;
  font-size: 11px; font-weight: 500; outline: none; transition: border-color .15s;
}
.apk-input-dark  { background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.1); color: #fff; }
.apk-input-dark::placeholder { color: rgba(255,255,255,.2); }
.apk-input-dark:focus  { border-color: rgba(99,102,241,.5); }
.apk-input-light { background: #f8fafc; border-color: #e2e8f0; color: #1e293b; }
.apk-input-light::placeholder { color: #94a3b8; }
.apk-input-light:focus { border-color: rgba(99,102,241,.5); }

.apk-note-del {
  width: 26px; height: 26px; border-radius: 7px; border: 1px solid;
  color: #f87171; background: transparent; cursor: pointer; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; transition: background .15s;
}
.apk-del-dark  { border-color: rgba(255,255,255,.1); }
.apk-del-dark:hover  { background: rgba(239,68,68,.12); }
.apk-del-light { border-color: #e2e8f0; }
.apk-del-light:hover { background: rgba(239,68,68,.08); }

.apk-empty { text-align: center; padding: 20px 0; font-size: 11px; font-weight: 500; }

/* ── TRANSITIONS ──────────────────────────────────────────── */
.apk-status-enter-active { transition: all .3s ease; }
.apk-status-leave-active { transition: all .2s ease; }
.apk-status-enter-from   { opacity: 0; transform: translateY(-6px); }
.apk-status-leave-to     { opacity: 0; transform: translateY(-4px); }

.list-enter-active, .list-leave-active { transition: all .2s ease; }
.list-enter-from, .list-leave-to       { opacity: 0; transform: translateX(-8px); }
</style>
