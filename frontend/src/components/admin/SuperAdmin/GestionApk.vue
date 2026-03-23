<template>
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-3">

        <!-- SUBIR APK -->
        <div class="rounded-xl border p-4 flex flex-col gap-3 transition-all"
            :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">

            <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <i class="fas fa-cloud-arrow-up text-indigo-500 text-xs"></i>
                </div>
                <span class="text-[11px] font-semibold uppercase tracking-wider"
                    :class="isDark ? 'text-white' : 'text-slate-700'">Actualizar software</span>
            </div>

            <div @click="$refs.fileInput.click()"
                class="border border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                :class="isDark ? 'border-white/10 hover:border-indigo-500/50 hover:bg-white/5' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'">
                <input type="file" ref="fileInput" @change="handleFileUpload" class="hidden" accept=".apk" />
                <i class="fab fa-android text-3xl text-indigo-500"></i>
                <p class="text-[11px] font-medium text-center" :class="isDark ? 'text-white/50' : 'text-slate-400'">
                    {{ selectedFile ? selectedFile.name : 'Click para subir nueva APK' }}
                </p>
                <p v-if="selectedFile" class="text-[10px] font-semibold text-amber-500">
                    {{ (selectedFile.size / (1024 * 1024)).toFixed(2) }} MB
                </p>
            </div>

            <button v-if="selectedFile" @click="handleUpload"
                class="w-full py-2.5 bg-amber-500 text-black text-[11px] font-bold uppercase tracking-wide rounded-lg hover:bg-amber-400 transition-all">
                Publicar versión
            </button>
        </div>

        <!-- CHANGELOG -->
        <div class="rounded-xl border p-4 flex flex-col gap-3 transition-all"
            :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">

            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <i class="fas fa-list-check text-emerald-500 text-xs"></i>
                    </div>
                    <span class="text-[11px] font-semibold uppercase tracking-wider"
                        :class="isDark ? 'text-white' : 'text-slate-700'">Control de cambios</span>
                </div>
                <button @click="addNote"
                    class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center text-sm font-bold">
                    +
                </button>
            </div>

            <div class="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1 custom-scroll">
                <TransitionGroup name="list">
                    <div v-for="(note, i) in localChangelog" :key="i" class="flex gap-2 items-center">
                        <div class="flex-1 relative">
                            <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px]"
                                :class="isDark ? 'text-white/20' : 'text-slate-300'">›</span>
                            <input v-model="localChangelog[i]"
                                class="w-full pl-6 pr-3 py-2 rounded-lg text-[12px] font-medium outline-none border transition-all"
                                :class="isDark
                                    ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-indigo-500'
                                    : 'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-300 focus:border-indigo-400'"
                                placeholder="Ej: Optimización de velocidad..." />
                        </div>
                        <button @click="removeNote(i)"
                            class="w-7 h-7 rounded-lg border text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center flex-shrink-0"
                            :class="isDark ? 'border-white/10' : 'border-slate-200'">
                            <i class="fas fa-trash-alt text-[10px]"></i>
                        </button>
                    </div>
                </TransitionGroup>

                <div v-if="!localChangelog.length" class="text-center py-5 text-[11px] font-medium"
                    :class="isDark ? 'text-white/20' : 'text-slate-300'">
                    Sin novedades — agrega una
                </div>
            </div>

            <button @click="handleSaveChangelog"
                class="w-full py-2.5 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wide rounded-lg hover:bg-indigo-500 transition-all">
                Guardar novedades
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApkRepo } from '../../../composables/adminLogica/useApkRepo';

const props = defineProps({
    isDark: Boolean,
});

const emit = defineEmits(['success', 'error']);

const { apkData, fetchApkInfo, subirApk, guardarNovedades } = useApkRepo();

const selectedFile = ref(null);
const localChangelog = ref([]);

const handleFileUpload = (e) => {
    selectedFile.value = e.target.files[0];
};

const handleUpload = async () => {
    if (!selectedFile.value) return;
    try {
        await subirApk(selectedFile.value);
        emit('success', 'APK publicada correctamente');
        selectedFile.value = null;
        await fetchApkInfo();
    } catch (e) {
        emit('error', 'Error al subir archivo');
    }
};

const addNote = () => localChangelog.value.push('');
const removeNote = (i) => localChangelog.value.splice(i, 1);

const handleSaveChangelog = async () => {
    try {
        await guardarNovedades(localChangelog.value);
        emit('success', 'Historial guardado');
    } catch (e) {
        emit('error', 'Error al guardar');
    }
};

onMounted(async () => {
    await fetchApkInfo();
    if (apkData.value) localChangelog.value = [...apkData.value.changelog];
});
</script>