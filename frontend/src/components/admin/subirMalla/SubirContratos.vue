<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="bg-white shadow-md rounded-lg p-8 border border-gray-200">
      <h2 class="text-2xl font-bold mb-4 text-gray-800">Carga Masiva de Contratos</h2>
      <p class="text-gray-600 mb-6">Sube tu archivo .xlsx siguiendo el formato técnico de Odoo.</p>

      <div 
        @dragover.prevent="isDragging = true" 
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        :class="['border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors', 
                 isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400']"
      >
        <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        
        <p class="mb-2 text-sm text-gray-700">
          <span class="font-semibold">Haz clic para subir</span> o arrastra y suelta
        </p>
        <p class="text-xs text-gray-500">Solo archivos Excel (.xlsx)</p>
        
        <input type="file" ref="fileInput" class="hidden" accept=".xlsx" @change="handleFileSelect" />
        <button 
          @click="$refs.fileInput.click()"
          class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Seleccionar Archivo
        </button>
      </div>

      <div v-if="uploading" class="mt-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-blue-700">Subiendo a Odoo...</span>
          <span class="text-sm font-medium text-blue-700">{{ progress }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div class="bg-blue-600 h-2.5 rounded-full transition-all" :style="{ width: progress + '%' }"></div>
        </div>
      </div>

      <div v-if="successMessage" class="mt-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
        {{ successMessage }}
      </div>

      <div v-if="errors.length > 0" class="mt-8">
        <h3 class="text-lg font-semibold text-red-600 mb-3">Errores detectados en el archivo:</h3>
        <div class="overflow-x-auto border rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fila</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Campo</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200 text-sm">
              <tr v-for="(err, index) in errors" :key="index">
                <td class="px-4 py-2 font-bold text-gray-700">{{ err.fila }}</td>
                <td class="px-4 py-2 text-blue-600 font-mono">{{ err.campo }}</td>
                <td class="px-4 py-2 text-red-600">{{ err.error }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>

import { CargueMallas } from '../../../composables/adminLogica/cargueMallas.js';
uploadFile
import { ref } from 'vue';
import axios from 'axios';

const isDragging = ref(false);
const uploading = ref(false);
const progress = ref(0);
const errors = ref([]);
const successMessage = ref('');

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) uploadFile(file);
};

const handleDrop = (event) => {
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  if (file) uploadFile(file);
};

const uploadFile = async (file) => {
  // Limpiar estados previos
  errors.value = [];
  successMessage.value = '';
  uploading.value = true;
  progress.value = 0;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post('http://localhost:3000/contracts-upload/import', formData, {
      onUploadProgress: (progressEvent) => {
        progress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      }
    });

    if (response.data.success) {
      successMessage.value = response.data.message;
    } else {
      // Aquí atrapamos los errores que formateamos en el NestJS
      errors.value = response.data.errors;
    }
  } catch (err) {
    console.error(err);
    const msg = err.response?.data?.message || 'Error de conexión con el servidor.';
    alert(msg);
  } finally {
    uploading.value = false;
  }
};
</script>