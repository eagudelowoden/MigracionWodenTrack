<template>
  <div class="h-full flex flex-col">

    <!-- ── Panel de selección ─────────────────────────────────────────────── -->
    <div v-if="!subModule" class="h-full flex flex-col items-center justify-center animate-fade-in py-6">

      <div class="text-center mb-8">
        <h2 class="text-lg font-black italic uppercase tracking-tighter transition-colors duration-500"
          :class="isDark ? 'text-white' : 'text-slate-900'">
          Panel de <span class="text-[#FF8F00]">Novedades</span>
        </h2>
        <div class="h-0.5 w-10 bg-[#FF8F00] mx-auto rounded-full mt-2"></div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl px-6">

        <!-- Admin Card -->
        <button v-if="isSuperAdmin || hasPerm('admin.novedades.admin')"
          @click="subModule = 'admin'"
          class="group relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden"
          :class="isDark
            ? 'bg-[#252b3b] border-white/10 hover:border-orange-500 hover:shadow-[0_0_0_1px_rgba(255,143,0,0.5),0_0_30px_rgba(255,143,0,0.2)]'
            : 'bg-white border-slate-200 hover:border-orange-400 shadow-sm hover:shadow-[0_0_20px_rgba(255,143,0,0.15)]'">

          <div class="absolute top-0 left-0 w-8 h-8 overflow-hidden rounded-tl-xl">
            <div class="absolute -top-4 -left-4 w-8 h-8 rotate-45 transition-all duration-300"
              :class="isDark ? 'bg-orange-500/20 group-hover:bg-orange-500/50' : 'bg-orange-400/15 group-hover:bg-orange-400/40'"></div>
          </div>
          <div class="absolute top-0 left-4 right-4 h-px transition-all duration-300"
            :class="isDark ? 'bg-gradient-to-r from-transparent via-orange-500/0 to-transparent group-hover:via-orange-500/80' : 'bg-gradient-to-r from-transparent via-orange-400/0 to-transparent group-hover:via-orange-400/60'"></div>

          <div class="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
            :class="isDark
              ? 'bg-orange-500/15 text-orange-400 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(255,143,0,0.6)]'
              : 'bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white'">
            <i class="fas fa-user-shield text-lg"></i>
          </div>

          <div class="text-center relative">
            <h3 class="font-black uppercase italic text-[11px] tracking-wide transition-colors"
              :class="isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-800'">Acceso Coordinadores</h3>
            <p class="text-[9px] font-bold uppercase tracking-widest mt-0.5 transition-colors"
              :class="isDark ? 'text-slate-500 group-hover:text-orange-400' : 'text-slate-400'">Planta</p>
          </div>
        </button>

        <!-- RRHH Card -->
        <button v-if="isSuperAdmin || hasPerm('admin.novedades.rrhh')"
          @click="subModule = 'rrhh'"
          class="group relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden"
          :class="isDark
            ? 'bg-[#252b3b] border-white/10 hover:border-blue-500 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5),0_0_30px_rgba(59,130,246,0.2)]'
            : 'bg-white border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]'">

          <div class="absolute top-0 left-0 w-8 h-8 overflow-hidden rounded-tl-xl">
            <div class="absolute -top-4 -left-4 w-8 h-8 rotate-45 transition-all duration-300"
              :class="isDark ? 'bg-blue-500/20 group-hover:bg-blue-500/50' : 'bg-blue-400/15 group-hover:bg-blue-400/40'"></div>
          </div>
          <div class="absolute top-0 left-4 right-4 h-px transition-all duration-300"
            :class="isDark ? 'bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-hover:via-blue-500/80' : 'bg-gradient-to-r from-transparent via-blue-400/0 to-transparent group-hover:via-blue-400/60'"></div>

          <div class="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
            :class="isDark
              ? 'bg-blue-500/15 text-blue-400 group-hover:bg-blue-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]'
              : 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white'">
            <i class="fas fa-id-card text-lg"></i>
          </div>

          <div class="text-center relative">
            <h3 class="font-black uppercase italic text-[11px] tracking-wide transition-colors"
              :class="isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-800'">Capital Humano</h3>
            <p class="text-[9px] font-bold uppercase tracking-widest mt-0.5 transition-colors"
              :class="isDark ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-400'">Nómina</p>
          </div>
        </button>

        <!-- User Card -->
        <button v-if="isSuperAdmin || hasPerm('admin.novedades.user')"
          @click="subModule = 'user'"
          class="group relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden"
          :class="isDark
            ? 'bg-[#252b3b] border-white/10 hover:border-emerald-500 hover:shadow-[0_0_0_1px_rgba(16,185,129,0.5),0_0_30px_rgba(16,185,129,0.2)]'
            : 'bg-white border-slate-200 hover:border-emerald-400 shadow-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]'">

          <div class="absolute top-0 left-0 w-8 h-8 overflow-hidden rounded-tl-xl">
            <div class="absolute -top-4 -left-4 w-8 h-8 rotate-45 transition-all duration-300"
              :class="isDark ? 'bg-emerald-500/20 group-hover:bg-emerald-500/50' : 'bg-emerald-400/15 group-hover:bg-emerald-400/40'"></div>
          </div>
          <div class="absolute top-0 left-4 right-4 h-px transition-all duration-300"
            :class="isDark ? 'bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent group-hover:via-emerald-500/80' : 'bg-gradient-to-r from-transparent via-emerald-400/0 to-transparent group-hover:via-emerald-400/60'"></div>

          <div class="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
            :class="isDark
              ? 'bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]'
              : 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white'">
            <i class="fas fa-user-edit text-lg"></i>
          </div>

          <div class="text-center relative">
            <h3 class="font-black uppercase italic text-[11px] tracking-wide transition-colors"
              :class="isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-800'">Acceso Usuarios</h3>
            <p class="text-[9px] font-bold uppercase tracking-widest mt-0.5 transition-colors"
              :class="isDark ? 'text-slate-500 group-hover:text-emerald-400' : 'text-slate-400'">Personal</p>
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
