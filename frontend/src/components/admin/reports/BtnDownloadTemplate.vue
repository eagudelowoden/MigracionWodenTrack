<template>
  <button @click="downloadMallaTemplate" class="btn-download">
    <i class="fas fa-file-excel mr-2"></i>
    Descargar Plantilla
  </button>
</template>

<script setup>
import { useReports } from '@/composables/useReports';

const { downloadMallaTemplate } = useReports();
</script>

<style scoped>
.btn-download {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background-color: #217346; /* Color verde de Excel */
  color: white;
  border-radius: 12px;
  font-weight: 900;
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-download:hover {
  background-color: #1a5a37;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 115, 70, 0.3);
}
</style>