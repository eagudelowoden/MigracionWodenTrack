<template>
  <div class="h-full flex flex-col">

    <!-- ── Panel de selección ─────────────────────────────────────────────── -->
    <div v-if="!subModule" class="h-full flex flex-col items-center justify-center animate-fade-in py-6">

      <div class="text-center mb-10">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-[9px] font-black uppercase tracking-widest"
          :class="isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-100'">
          <i class="fas fa-bell text-[8px]"></i> Centro de Novedades
        </div>
        <h2 class="text-2xl font-black tracking-tight transition-colors duration-500"
          :class="isDark ? 'text-white' : 'text-slate-900'">
          Panel de <span class="text-[#3B82F6]">Novedades</span>
        </h2>
        <p class="text-[10px] font-medium mt-1.5" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Selecciona el módulo al que deseas acceder</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl px-6">

        <!-- Admin Card -->
        <button v-if="isSuperAdmin || hasPerm('admin.novedades.admin')"
          @click="subModule = 'admin'"
          class="group relative flex flex-col items-center justify-center gap-4 p-7 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-1"
          :class="isDark
            ? 'bg-[#1a2235] border-white/10 hover:border-rose-500/50 hover:shadow-[0_8px_30px_rgba(244,63,94,0.2)]'
            : 'bg-white border-slate-100 shadow-sm hover:border-rose-300 hover:shadow-[0_8px_25px_rgba(244,63,94,0.12)]'">
          <div class="absolute top-0 left-4 right-4 h-px transition-all duration-500"
            :class="isDark ? 'bg-gradient-to-r from-transparent via-rose-500/0 to-transparent group-hover:via-rose-500/60' : 'bg-gradient-to-r from-transparent via-rose-400/0 to-transparent group-hover:via-rose-300'"></div>
          <div class="relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300"
            :class="isDark
              ? 'bg-rose-500/10 text-rose-400 group-hover:bg-rose-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-rose-500/30'
              : 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-rose-500/25'">
            <i class="fas fa-user-shield text-xl"></i>
          </div>
          <div class="text-center relative">
            <h3 class="font-black uppercase text-[11px] tracking-wide transition-colors"
              :class="isDark ? 'text-slate-200' : 'text-slate-800'">Acceso Coordinadores</h3>
            <p class="text-[9px] font-bold uppercase tracking-widest mt-1 transition-colors"
              :class="isDark ? 'text-slate-500 group-hover:text-rose-400' : 'text-slate-400 group-hover:text-rose-500'">Planta</p>
          </div>
        </button>

        <!-- RRHH Card -->
        <button v-if="isSuperAdmin || hasPerm('admin.novedades.rrhh')"
          @click="subModule = 'rrhh'"
          class="group relative flex flex-col items-center justify-center gap-4 p-7 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-1"
          :class="isDark
            ? 'bg-[#1a2235] border-white/10 hover:border-blue-500/50 hover:shadow-[0_8px_30px_rgba(59,130,246,0.2)]'
            : 'bg-white border-slate-100 shadow-sm hover:border-blue-300 hover:shadow-[0_8px_25px_rgba(59,130,246,0.12)]'">
          <div class="absolute top-0 left-4 right-4 h-px transition-all duration-500"
            :class="isDark ? 'bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-hover:via-blue-500/60' : 'bg-gradient-to-r from-transparent via-blue-400/0 to-transparent group-hover:via-blue-300'"></div>
          <div class="relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300"
            :class="isDark
              ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/30'
              : 'bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/25'">
            <i class="fas fa-id-card text-xl"></i>
          </div>
          <div class="text-center relative">
            <h3 class="font-black uppercase text-[11px] tracking-wide transition-colors"
              :class="isDark ? 'text-slate-200' : 'text-slate-800'">Capital Humano</h3>
            <p class="text-[9px] font-bold uppercase tracking-widest mt-1 transition-colors"
              :class="isDark ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-500'">Nómina</p>
          </div>
        </button>

        <!-- User Card -->
        <button v-if="isSuperAdmin || hasPerm('admin.novedades.user')"
          @click="subModule = 'user'"
          class="group relative flex flex-col items-center justify-center gap-4 p-7 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-1"
          :class="isDark
            ? 'bg-[#1a2235] border-white/10 hover:border-emerald-500/50 hover:shadow-[0_8px_30px_rgba(16,185,129,0.2)]'
            : 'bg-white border-slate-100 shadow-sm hover:border-emerald-300 hover:shadow-[0_8px_25px_rgba(16,185,129,0.12)]'">
          <div class="absolute top-0 left-4 right-4 h-px transition-all duration-500"
            :class="isDark ? 'bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent group-hover:via-emerald-500/60' : 'bg-gradient-to-r from-transparent via-emerald-400/0 to-transparent group-hover:via-emerald-300'"></div>
          <div class="relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300"
            :class="isDark
              ? 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-500/30'
              : 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-500/25'">
            <i class="fas fa-user-edit text-xl"></i>
          </div>
          <div class="text-center relative">
            <h3 class="font-black uppercase text-[11px] tracking-wide transition-colors"
              :class="isDark ? 'text-slate-200' : 'text-slate-800'">Acceso Usuarios</h3>
            <p class="text-[9px] font-bold uppercase tracking-widest mt-1 transition-colors"
              :class="isDark ? 'text-slate-500 group-hover:text-emerald-400' : 'text-slate-400 group-hover:text-emerald-500'">Personal</p>
          </div>
        </button>

      </div>
    </div>

    <!-- ── Sub-vistas ──────────────────────────────────────────────────────── -->
    <template v-else>
      <!-- Botón volver -->
      <button @click="subModule = null"
        class="self-start flex items-center gap-2 px-3 py-1.5 mb-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
        :class="isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100'">
        <i class="fas fa-arrow-left text-[9px]"></i> Volver
      </button>

      <NovedadesAdmin v-if="subModule === 'admin'" :isDark="isDark" :company="company" />
      <NovedadesRRHH  v-else-if="subModule === 'rrhh'"  :isDark="isDark" :company="company" />
      <NovedadesUsuario v-else-if="subModule === 'user'" :isDark="isDark" :company="company" :employee="employee" />
    </template>

  </div>
</template>

<script setup>
import { ref, inject } from 'vue';
import NovedadesAdmin   from './novedadesadminView.vue';
import NovedadesRRHH    from './novedadesRRHView.vue';
import NovedadesUsuario from './novedadesusuarioView.vue';

const props = defineProps({
  isDark:  Boolean,
  company: String,
});

// employee lo provee AdminView via provide('adminEmployee', ...)
const employee = inject('adminEmployee', null);

const subModule = ref(null);

const session    = JSON.parse(localStorage.getItem('user_session') || '{}');
const isSuperAdmin = session.isSuperAdmin || false;
const hasPerm = (p) => session.permisos?.[p] === true;
</script>
