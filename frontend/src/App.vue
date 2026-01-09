<template>
  <router-view />
</template>

<script setup>
import { useInactividad } from './composables/useInactividad';

// Configurar para 10 minutos de inactividad
useInactividad(1);
</script>

<style>
/* Puedes dejar estilos globales aquí si quieres */
</style>