<template>
  <div class="mesh-container animate-fade-in space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 p-6 rounded-[2rem] border border-dashed"
         :class="isDark ? 'border-slate-600' : 'border-slate-200 shadow-sm bg-white'">
      
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-[#FF8F00]/20 rounded-xl flex items-center justify-center text-[#FF8F00]">
          <i class="fas fa-calendar-alt text-xl"></i>
        </div>
        <div>
          <h2 class="text-lg font-black uppercase italic leading-none">Gestión de Mallas</h2>
          <p class="text-[10px] opacity-60 font-bold uppercase tracking-widest">Cargue y visualización de horarios</p>
        </div>
      </div>

      <div class="flex gap-2">
        <input type="file" id="fileInput" class="hidden" accept=".xlsx, .xls" @change="handleFileUpload">
        <label for="fileInput" class="btn-upload">
          <i class="fas fa-file-upload mr-2"></i>
          Subir Nueva Malla
        </label>
      </div>
    </div>

    <div class="table-wrapper" :class="isDark ? 'dark-mode' : 'light-mode'">
      <table class="mesh-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>C.C.</th>
            <th>Nombre de Malla</th>
            <th class="text-center">Jornada</th>
            <th class="text-right">Horario</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(persona, index) in mallasData" :key="index">
            <td class="font-black uppercase text-[#FF8F00]">{{ persona.nombre }}</td>
            <td class="font-mono opacity-80">{{ persona.cc }}</td>
            <td>
              <span class="malla-tag">{{ persona.malla }}</span>
            </td>
            <td class="text-center">
              <span class="jornada-badge" :class="persona.jornada.toLowerCase()">
                {{ persona.jornada }}
              </span>
            </td>
            <td class="text-right font-bold">{{ persona.horario }}</td>
          </tr>
          <tr v-if="mallasData.length === 0">
            <td colspan="5" class="text-center py-10 opacity-50 italic">
              No hay datos de mallas cargados actualmente.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios'; // Asegúrate de tener instalado axios
import '../../assets/css/modulo-mallas.css';

defineProps({
  isDark: Boolean
});

// 1. Iniciamos con un array vacío
const mallasData = ref([]);
const isLoading = ref(true);

// 2. Función para traer los datos reales de Odoo
const fetchMallasDesdeOdoo = async () => {
  try {
    isLoading.value = true;
    
    // Cambia esta URL por la ruta real de tu API NestJS
    const response = await axios.get('http://localhost:8082/usuarios/mallas');
    
    // Asignamos los datos recibidos a nuestra variable reactiva
    mallasData.value = response.data;
  } catch (error) {
    console.error("Error cargando mallas:", error);
    // Opcional: podrías mostrar una notificación de error aquí
  } finally {
    isLoading.value = false;
  }
};

// 3. Ejecutar la carga apenas se abra el componente
onMounted(() => {
  fetchMallasDesdeOdoo();
});

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    console.log("Procesando archivo:", file.name);
    // Tu lógica para procesar Excel si fuera necesario
  }
};
</script>

<style scoped>

</style>