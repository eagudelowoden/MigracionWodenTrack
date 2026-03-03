<template>
  <div class="w-full h-full p-2 md:p-4 animate-fade-in transition-colors duration-500">

    <div class="w-full max-w-5xl mx-auto shadow-lg rounded-[1.5rem] overflow-hidden border transition-all duration-500"
      :class="isDark
        ? 'bg-slate-800/40 border-white/5 shadow-black/40'
        : 'bg-white border-slate-200 shadow-slate-100'">

      <div class="px-6 py-3 flex justify-between items-center border-b"
        :class="isDark ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50/50'">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 flex items-center justify-center bg-[#FF8F00] text-white rounded-xl shadow-md">
            <i class="fas fa-file-signature text-lg"></i>
          </div>
          <div>
            <h2 class="text-lg font-black uppercase tracking-tighter" :class="isDark ? 'text-white' : 'text-slate-800'">
              Registro <span class="text-[#FF8F00]">Novedad</span>
            </h2>
            <p class="text-[8px] font-bold opacity-60 uppercase tracking-widest"
              :class="isDark ? 'text-white' : 'text-slate-500'">
              {{ company || 'Woden Track' }}
            </p>
          </div>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 md:p-8 space-y-5">

        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

          <div class="flex flex-col gap-1.5">
            <label class="text-[9px] font-black uppercase tracking-widest ml-1"
              :class="isDark ? 'text-slate-400' : 'text-[#FF8F00]'">Nombre</label>
            <div class="flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs"
              :class="isDark ? 'bg-black/20 border-white/5 text-slate-400' : 'bg-slate-50 border-transparent text-slate-500'">
              <i class="fas fa-user-circle opacity-50 text-sm"></i>
              <input type="text" v-model="form.nombre" readonly
                class="bg-transparent w-full font-bold outline-none cursor-not-allowed" />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-[9px] font-black uppercase tracking-widest ml-1"
              :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cédula</label>
            <div
              class="flex items-center gap-3 px-4 py-2.5 rounded-xl border focus-within:ring-1 focus-within:ring-[#FF8F00]/30 transition-all text-xs"
              :class="isDark ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'">
              <i class="fas fa-id-card text-[#FF8F00]/60 text-sm"></i>
              <input type="number" v-model="form.cedula" placeholder="Número identificación..." required
                class="bg-transparent w-full font-bold outline-none"
                :class="isDark ? 'text-white' : 'text-slate-800'" />
            </div>
          </div>

          <div class="md:col-span-2 grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-[9px] font-black uppercase tracking-widest ml-1"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">Fecha Inicio</label>
              <input type="date" v-model="form.fechaInicio" required
                class="px-4 py-2.5 rounded-xl border text-xs font-bold outline-none transition-all"
                :class="isDark ? 'bg-slate-900/50 border-white/10 text-white [color-scheme:dark]' : 'bg-white border-slate-200 text-slate-800'" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[9px] font-black uppercase tracking-widest ml-1"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">Fecha Fin</label>
              <input type="date" v-model="form.fechaFin" required
                class="px-4 py-2.5 rounded-xl border text-xs font-bold outline-none transition-all"
                :class="isDark ? 'bg-slate-900/50 border-white/10 text-white [color-scheme:dark]' : 'bg-white border-slate-200 text-slate-800'" />
            </div>
          </div>

          <div class="md:col-span-2 flex flex-col gap-1.5">
            <label class="text-[9px] font-black uppercase tracking-widest ml-1"
              :class="isDark ? 'text-slate-400' : 'text-slate-500'">Descripción</label>
            <textarea v-model="form.descripcion" rows="2" placeholder="Explique el motivo..." required
              class="px-4 py-3 rounded-xl border text-xs font-medium outline-none resize-none transition-all"
              :class="isDark ? 'bg-slate-900/50 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'"></textarea>
          </div>

          <div class="md:col-span-2 flex flex-col gap-1.5">
            <label class="text-[9px] font-black uppercase tracking-widest ml-1"
              :class="isDark ? 'text-slate-400' : 'text-slate-500'">Documento de Soporte</label>
            <div class="flex items-center p-1.5 rounded-xl border transition-all"
              :class="isDark ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'">
              <div class="flex-1 px-3 truncate text-[10px] font-bold"
                :class="fileName ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 'text-slate-400'">
                <i class="fas fa-file-upload mr-2 text-[#FF8F00]"></i>
                {{ fileName || 'Ningún archivo seleccionado...' }}
              </div>
              <input type="file" @change="handleFileUpload" id="file-upload" class="hidden" />
              <label for="file-upload"
                class="px-4 py-2 rounded-lg bg-[#FF8F00] text-black text-[10px] font-black uppercase italic cursor-pointer hover:brightness-110 active:scale-95 transition-all">
                {{ fileName ? 'Cambiar' : 'Buscar' }}
              </label>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end pt-4 border-t border-dashed"
          :class="isDark ? 'border-white/10' : 'border-slate-200'">
          <button type="submit"
            class="group px-8 py-2.5 rounded-lg bg-slate-900 dark:bg-[#FF8F00] text-white dark:text-black font-black uppercase italic tracking-widest text-[10px] transition-all active:scale-95 shadow-md flex items-center gap-2">
            <span>Guardar Novedad</span>
            <i class="fas fa-check-circle text-[10px] group-hover:scale-110 transition-transform"></i>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  isDark: Boolean,
  company: String,
  employee: Object
});

const form = ref({ nombre: '', cedula: '', descripcion: '', fechaInicio: '', fechaFin: '', soporte: null });
const fileName = ref('');

onMounted(() => {
  if (props.employee?.name) {
    form.value.nombre = props.employee.name;
  } else {
    const session = JSON.parse(localStorage.getItem('user_session'));
    form.value.nombre = session?.name || 'Usuario Admin';
  }
});

const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    form.value.soporte = file;
    fileName.value = file.name;
  }
};

const handleSubmit = () => {
  if (!form.value.soporte) {
    alert("Por favor cargue un soporte");
    return;
  }
  alert("Novedad guardada con éxito");
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
</style>