<template>
  <div class="w-full h-full animate-fade-in transition-colors duration-500 flex flex-col gap-2">

    <!-- Header SEPARADO -->
    <div class="flex items-center justify-between gap-3 p-1.5 px-3 rounded-2xl border shrink-0 shadow-sm"
      :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

      <div class="flex items-center gap-3 ml-1">
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
    </div>

    <!-- Formulario SEPARADO -->
    <div class="flex-1 flex flex-col w-full overflow-hidden rounded-2xl border transition-all duration-500"
      :class="isDark ? 'bg-[#1e2538] border-[#2d3548] shadow-black/40' : 'bg-white border-slate-200 shadow-slate-100'">

      <form @submit.prevent="handleSubmit" class="flex-1 flex flex-col p-5 gap-4 overflow-y-auto">

        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">

          <!-- Nombre -->
          <div class="flex flex-col gap-1.5">
            <label class="text-[9px] font-black uppercase tracking-widest ml-1"
              :class="isDark ? 'text-slate-400' : 'text-[#FF8F00]'">Nombre</label>
            <div class="flex items-center gap-3 px-4 py-2.5 rounded-lg border text-xs"
              :class="isDark ? 'bg-[#273045] border-[#2d3548] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-500'">
              <i class="fas fa-user-circle opacity-50 text-sm"></i>
              <input type="text" v-model="form.nombre" readonly
                class="bg-transparent w-full font-bold outline-none cursor-not-allowed"
                :class="isDark ? 'text-white' : 'text-slate-600'" />
            </div>
          </div>

          <!-- Cédula -->
          <div class="flex flex-col gap-1.5">
            <label class="text-[9px] font-black uppercase tracking-widest ml-1"
              :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cédula</label>
            <div class="flex items-center gap-3 px-4 py-2.5 rounded-lg border focus-within:ring-1 focus-within:ring-[#FF8F00]/30 transition-all text-xs"
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

          <!-- Soporte -->
          <div class="md:col-span-2 flex flex-col gap-1.5">
            <label class="text-[9px] font-black uppercase tracking-widest ml-1"
              :class="isDark ? 'text-slate-400' : 'text-slate-500'">Documento de Soporte</label>
            <div class="flex items-center p-1.5 rounded-lg border transition-all"
              :class="isDark ? 'bg-[#273045] border-[#2d3548]' : 'bg-white border-slate-200 shadow-sm'">
              <div class="flex-1 px-3 truncate text-[10px] font-bold"
                :class="fileName ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-slate-500' : 'text-slate-400')">
                <i class="fas fa-file-upload mr-2 text-[#FF8F00]"></i>
                {{ fileName || 'Ningún archivo seleccionado...' }}
              </div>
              <input type="file" @change="handleFileUpload" id="file-upload" class="hidden" />
              <label for="file-upload"
                class="px-4 py-2 rounded-md bg-[#FF8F00] text-black text-[10px] font-black uppercase italic cursor-pointer hover:brightness-110 active:scale-95 transition-all">
                {{ fileName ? 'Cambiar' : 'Buscar' }}
              </label>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end pt-4 mt-auto border-t"
          :class="isDark ? 'border-[#2d3548]' : 'border-slate-200'">
          <button type="submit"
            class="group px-8 py-2.5 rounded-lg font-black uppercase italic tracking-widest text-[10px] transition-all active:scale-95 shadow-md flex items-center gap-2"
            :class="isDark ? 'bg-[#FF8F00] text-black hover:brightness-110' : 'bg-slate-900 text-white hover:bg-slate-700'">
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
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
