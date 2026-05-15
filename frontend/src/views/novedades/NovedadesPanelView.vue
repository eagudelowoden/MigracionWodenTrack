<template>
  <div class="h-full flex flex-col">

    <!-- ── Panel de selección ─────────────────────────────────────────────── -->
    <div v-if="!subModule"
      class="h-full flex flex-col items-center justify-center animate-fade-in relative overflow-hidden rounded-xl bg-[#1f2937]">

      <!-- Círculos decorativos de fondo -->
      <div class="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none"></div>
      <div class="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none"></div>
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/[0.03] pointer-events-none">
      </div>

      <!-- Título -->
      <div class="text-center mb-10 relative z-10">
        <h2 class="text-2xl font-black tracking-tight text-white drop-shadow">
          Panel de <span class="text-white/80">Novedades</span>
        </h2>
        <p class="text-[10px] font-semibold mt-1.5 text-white/60 uppercase tracking-widest">Selecciona el módulo al que
          deseas acceder</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-2xl px-6 relative z-10">

        <!-- Admin Card -->
        <button v-if="isSuperAdmin || hasPerm('admin.novedades.admin')" @click="subModule = 'admin'"
          class="group relative flex flex-col items-center justify-center gap-4 p-7 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-1.5 hover:shadow-2xl active:scale-[0.98]"
          :class="isDark
            ? 'bg-white/15 border-white/25 backdrop-blur-sm hover:bg-white/25 hover:border-violet-300/50 hover:shadow-violet-500/20'
            : 'bg-white/15 border-white/25 backdrop-blur-sm hover:bg-white/25 hover:border-white/50 hover:shadow-violet-500/20'">
          <div
            class="relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 bg-violet-500/20 text-white group-hover:bg-violet-500 group-hover:shadow-lg group-hover:shadow-violet-500/40">
            <i class="fas fa-user-shield text-xl"></i>
          </div>
          <div class="text-center relative">
            <h3 class="font-black uppercase text-[11px] tracking-wide text-white">Acceso Coordinadores</h3>
            <p
              class="text-[9px] font-bold uppercase tracking-widest mt-1 text-white/50 group-hover:text-violet-200 transition-colors">
              Planta</p>
          </div>
        </button>

        <!-- RRHH Card -->
        <button v-if="isSuperAdmin || hasPerm('admin.novedades.rrhh')" @click="subModule = 'rrhh'"
          class="group relative flex flex-col items-center justify-center gap-4 p-7 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-1.5 hover:shadow-2xl active:scale-[0.98]"
          :class="isDark
            ? 'bg-white/15 border-white/25 backdrop-blur-sm hover:bg-white/25 hover:border-sky-300/50 hover:shadow-sky-400/20'
            : 'bg-white/15 border-white/25 backdrop-blur-sm hover:bg-white/25 hover:border-white/50 hover:shadow-sky-400/20'">
          <div
            class="relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 bg-sky-400/20 text-white group-hover:bg-sky-400 group-hover:shadow-lg group-hover:shadow-sky-400/40">
            <i class="fas fa-id-card text-xl"></i>
          </div>
          <div class="text-center relative">
            <h3 class="font-black uppercase text-[11px] tracking-wide text-white">Capital Humano</h3>
            <p
              class="text-[9px] font-bold uppercase tracking-widest mt-1 text-white/50 group-hover:text-sky-200 transition-colors">
              Nómina</p>
          </div>
        </button>

        <!-- User Card -->
        <button v-if="isSuperAdmin || hasPerm('admin.novedades.user')" @click="subModule = 'user'"
          class="group relative flex flex-col items-center justify-center gap-4 p-7 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-1.5 hover:shadow-2xl active:scale-[0.98]"
          :class="isDark
            ? 'bg-white/15 border-white/25 backdrop-blur-sm hover:bg-white/25 hover:border-emerald-300/50 hover:shadow-emerald-400/20'
            : 'bg-white/15 border-white/25 backdrop-blur-sm hover:bg-white/25 hover:border-white/50 hover:shadow-emerald-400/20'">
          <div
            class="relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 bg-emerald-400/20 text-white group-hover:bg-emerald-400 group-hover:shadow-lg group-hover:shadow-emerald-400/40">
            <i class="fas fa-user-edit text-xl"></i>
          </div>
          <div class="text-center relative">
            <h3 class="font-black uppercase text-[11px] tracking-wide text-white">Acceso Usuarios</h3>
            <p
              class="text-[9px] font-bold uppercase tracking-widest mt-1 text-white/50 group-hover:text-emerald-200 transition-colors">
              Personal</p>
          </div>
        </button>

      </div>
    </div>

    <!-- ── Sub-vistas ──────────────────────────────────────────────────────── -->
    <template v-else>
      <!-- Botón volver -->
      <button @click="subModule = null"
        class="self-start flex items-center gap-1.5 px-2.5 py-1 mb-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 border"
        :class="isDark
          ? 'bg-[#1e2538] border-[#2d3548] text-slate-400 hover:text-white hover:border-slate-500'
          : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 shadow-sm'">
        <i class="fas fa-arrow-left text-[8px]"></i> Volver
      </button>

      <NovedadesAdmin v-if="subModule === 'admin'" :isDark="isDark" :company="company" />
      <NovedadesRRHH v-else-if="subModule === 'rrhh'" :isDark="isDark" :company="company" />
      <NovedadesUsuario v-else-if="subModule === 'user'" :isDark="isDark" :company="company" :employee="employee" />
    </template>

  </div>
</template>

<script setup>
import { ref, inject } from 'vue';
import NovedadesAdmin from './novedadesadminView.vue';
import NovedadesRRHH from './novedadesRRHView.vue';
import NovedadesUsuario from './novedadesusuarioView.vue';

const props = defineProps({
  isDark: Boolean,
  company: String,
});

// employee lo provee AdminView via provide('adminEmployee', ...)
const employee = inject('adminEmployee', null);

const subModule = ref(null);

const session = JSON.parse(localStorage.getItem('user_session') || '{}');
const isSuperAdmin = session.isSuperAdmin || false;
const hasPerm = (p) => session.permisos?.[p] === true;
</script>
