<template>
  <div class="admin-layout transition-colors duration-500" :class="isDark ? 'theme-dark' : 'theme-light'">

    <aside class="relative flex flex-col transition-all duration-500 ease-in-out z-50 border-r"
      :style="{ backgroundColor: isDark ? '#273045' : '#ffffff' }"
      :class="[isSidebarOpen ? 'w-56' : 'w-16', isDark ? 'border-white/5 shadow-2xl shadow-black/40' : 'border-slate-200 shadow-sm']">

      <div class="relative h-16 flex items-center px-5 shrink-0 overflow-hidden">
        <div class="flex items-center group cursor-default">
          <div class="w-1 h-5 bg-[#FF8F00] rounded-full group-hover:h-7 transition-all duration-300"></div>

          <div class="h-4 w-[1px] mx-3 opacity-20" :class="isDark ? 'bg-white' : 'bg-slate-900'"></div>

          <div v-if="isSidebarOpen" class="flex items-baseline animate-fade-in whitespace-nowrap">
            <span class="text-sm font-black tracking-tight uppercase transition-colors duration-300"
              :class="isDark ? 'text-white' : 'text-slate-900'">
              Woden
            </span>
            <span class="ml-1 text-sm font-light tracking-widest text-[#FF8F00] uppercase">
              Track
            </span>
          </div>
        </div>

        <div class="absolute bottom-0 left-4 right-4 h-[1px]"
          :class="isDark ? 'bg-gradient-to-r from-transparent via-white/10 to-transparent' : 'bg-gradient-to-r from-transparent via-slate-200 to-transparent'">
        </div>
      </div>

      <nav class="flex-1 px-2 space-y-1.5 mt-4 overflow-y-auto custom-scroll">

        <button v-if="employee?.isSuperAdmin || employee?.permisos?.['admin.asistencias']"
          @click="currentModule = 'asistencias'"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden"
          :class="currentModule === 'asistencias'
            ? (isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900')
            : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')">

          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-chart-line text-xs transition-transform group-hover:scale-110"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[10px] font-bold uppercase tracking-wide">Asistencias</span>

          <div v-if="currentModule === 'asistencias'"
            class="absolute left-0 w-1 h-4 bg-[#FF8F00] rounded-r-full shadow-[0_0_8px_#FF8F00]"></div>
        </button>

        <button v-if="employee?.isSuperAdmin || employee?.permisos?.['admin.mallas']" @click="currentModule = 'mallas'"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden"
          :class="currentModule === 'mallas'
            ? (isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900')
            : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')">

          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-cloud-arrow-up text-xs transition-transform group-hover:scale-110"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[10px] font-bold uppercase tracking-wide">Cargue Mallas</span>

          <div v-if="currentModule === 'mallas'"
            class="absolute left-0 w-1 h-4 bg-[#FF8F00] rounded-r-full shadow-[0_0_8px_#FF8F00]"></div>
        </button>

        <button v-if="employee?.isSuperAdmin || employee?.permisos?.['admin.novedades']"
          @click="currentModule = 'novedadusuario'"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden"
          :class="['novedadusuario', 'view_novedad_admin', 'view_novedad_rrhh', 'view_novedad_user'].includes(currentModule)
            ? (isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900')
            : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')">

          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-bullhorn text-xs transition-transform group-hover:scale-110"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[10px] font-bold uppercase tracking-wide">Novedades</span>

          <div
            v-if="['novedadusuario', 'view_novedad_admin', 'view_novedad_rrhh', 'view_novedad_user'].includes(currentModule)"
            class="absolute left-0 w-1 h-4 bg-[#FF8F00] rounded-r-full shadow-[0_0_8px_#FF8F00]"></div>
        </button>

      </nav>

      <div class="p-2 space-y-1 mt-auto border-t" :class="isDark ? 'border-white/5' : 'border-slate-100'">

        <button @click="toggleTheme"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-orange-500 transition-all">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'" class="text-xs"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[9px] font-black uppercase tracking-widest">{{ isDark ? 'Luz' :
            'Oscuro' }}</span>
        </button>

        <button @click="logout"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 transition-all">
          <div class="flex items-center justify-center shrink-0 w-5">
            <i class="fas fa-power-off text-xs"></i>
          </div>
          <span v-if="isSidebarOpen" class="text-[9px] font-black uppercase tracking-widest">Salir</span>
        </button>

      </div>
    </aside>

    <main class="flex-1 flex flex-col min-w-0 h-full">
      <header class="h-16 flex items-center justify-between px-6 shrink-0 z-40 transition-all"
        :class="isDark ? 'bg-[#273045] border-b border-white/5' : 'bg-white border-b border-slate-200 shadow-sm'">

        <div class="flex items-center gap-6">
          <button @click="isSidebarOpen = !isSidebarOpen" class="text-slate-400 hover:text-[#273045] transition-colors">
            <i class="fas fa-bars-staggered text-lg"></i>
          </button>

          <div v-if="allCompanies.length > 0"
            class="company-selector flex items-center gap-3 px-4 py-2 rounded-xl transition-all min-w-[320px] border"
            :class="isDark
              ? 'bg-[#0f172a] border-white/10 shadow-lg shadow-black/20'
              : 'bg-slate-50 border-slate-200 shadow-inner hover:border-[#FF8F00]'">

            <i class="fas fa-building text-[#FF8F00] text-xs"></i>

            <select v-model="selectedCompany"
              class="flex-1 bg-transparent text-[11px] font-black uppercase outline-none cursor-pointer appearance-none transition-colors"
              :class="isDark ? 'text-white' : 'text-slate-800'">
              <option v-for="comp in allCompanies" :key="comp.id" :value="comp.name"
                class="dark:bg-[#1e293b] dark:text-white">
                {{ comp.name }}
              </option>
            </select>

            <i class="fas fa-angle-down text-[10px]" :class="isDark ? 'text-white/40' : 'text-slate-400'"></i>
          </div>
        </div>

        <div class="flex items-center gap-6">
          <div class="flex items-center bg-slate-500/10 p-1 rounded-xl gap-1">
            <button @click="handleAttendance" :disabled="loading || employee?.is_inside || employee?.day_completed"
              class="btn-header-smart in group">
              <div class="icon-box-smart">
                <i class="fas fa-sign-in-alt text-[10px]"></i>
              </div>
              <span class="hidden md:inline">Entrada</span>
            </button>
            <button @click="handleAttendance" :disabled="loading || !employee?.is_inside || employee?.day_completed"
              class="btn-header-smart out group">
              <div class="icon-box-smart">
                <i class="fas fa-sign-out-alt text-[10px]"></i>
              </div>
              <span class="hidden md:inline">Salida</span>
            </button>
          </div>

          <div class="flex items-center gap-3 border-l border-slate-300 dark:border-white/10 pl-6">
            <div class="text-right">
              <p class="text-[9px] font-black text-[#FF8F00] tracking-widest leading-none">ADMIN</p>
              <p class="text-[12px] font-bold leading-tight" :class="isDark ? 'text-white' : 'text-slate-800'">
                {{ employee?.name }}
              </p>
            </div>
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF8F00] to-orange-400 flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/20">
              {{ employee?.name?.charAt(0) }}
            </div>
          </div>
        </div>
      </header>

      <div class="flex-1 p-4 overflow-y-auto font-round-custom bg-slate-50/50 dark:bg-[#f5f5f5]/40 custom-scroll">

        <AttendanceModule v-if="currentModule === 'asistencias'" :isDark="isDark" :company="selectedCompany" />
        <MeshModule v-if="currentModule === 'mallas'" :isDark="isDark" :company="selectedCompany" />

        <div v-if="currentModule === 'novedadusuario'"
          class="h-full flex flex-col items-center justify-center animate-fade-in py-6">

          <!-- Header -->
          <div class="text-center mb-8">
            <h2 class="text-lg font-black italic uppercase tracking-tighter transition-colors duration-500"
              :class="isDark ? 'text-white' : 'text-slate-900'">
              Panel de <span class="text-[#FF8F00]">Novedades</span>
            </h2>
            <div class="h-0.5 w-10 bg-[#FF8F00] mx-auto rounded-full mt-2"></div>
          </div>

          <!-- Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl px-6">

            <!-- Admin Card -->
            <button v-if="employee?.isSuperAdmin || employee?.permisos?.['admin.novedades.admin']"
              @click="currentModule = 'view_novedad_admin'"
              class="group relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden"
              :class="isDark
                ? 'bg-[#252b3b] border-white/10 hover:border-orange-500 hover:shadow-[0_0_0_1px_rgba(255,143,0,0.5),0_0_30px_rgba(255,143,0,0.2)]'
                : 'bg-white border-slate-200 hover:border-orange-400 shadow-sm hover:shadow-[0_0_20px_rgba(255,143,0,0.15)]'">

              <!-- Esquina decorativa top-left -->
              <div class="absolute top-0 left-0 w-8 h-8 overflow-hidden rounded-tl-xl">
                <div class="absolute -top-4 -left-4 w-8 h-8 rotate-45 transition-all duration-300" :class="isDark
                  ? 'bg-orange-500/20 group-hover:bg-orange-500/50'
                  : 'bg-orange-400/15 group-hover:bg-orange-400/40'">
                </div>
              </div>

              <!-- Línea top brillante -->
              <div class="absolute top-0 left-4 right-4 h-px transition-all duration-300" :class="isDark
                ? 'bg-gradient-to-r from-transparent via-orange-500/0 to-transparent group-hover:via-orange-500/80'
                : 'bg-gradient-to-r from-transparent via-orange-400/0 to-transparent group-hover:via-orange-400/60'">
              </div>

              <div class="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
                :class="isDark
                  ? 'bg-orange-500/15 text-orange-400 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(255,143,0,0.6)]'
                  : 'bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white'">
                <i class="fas fa-user-shield text-lg"></i>
              </div>

              <div class="text-center relative">
                <h3 class="font-black uppercase italic text-[11px] tracking-wide transition-colors"
                  :class="isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-800'">
                  Acceso Coordinadores
                </h3>
                <p class="text-[9px] font-bold uppercase tracking-widest mt-0.5 transition-colors"
                  :class="isDark ? 'text-slate-500 group-hover:text-orange-400' : 'text-slate-400'">
                  Planta
                </p>
              </div>
            </button>

            <!-- RRHH Card -->
            <button v-if="employee?.isSuperAdmin || employee?.permisos?.['admin.novedades.rrhh']"
              @click="currentModule = 'view_novedad_rrhh'"
              class="group relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden"
              :class="isDark
                ? 'bg-[#252b3b] border-white/10 hover:border-blue-500 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5),0_0_30px_rgba(59,130,246,0.2)]'
                : 'bg-white border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]'">

              <!-- Esquina decorativa top-left -->
              <div class="absolute top-0 left-0 w-8 h-8 overflow-hidden rounded-tl-xl">
                <div class="absolute -top-4 -left-4 w-8 h-8 rotate-45 transition-all duration-300" :class="isDark
                  ? 'bg-blue-500/20 group-hover:bg-blue-500/50'
                  : 'bg-blue-400/15 group-hover:bg-blue-400/40'">
                </div>
              </div>

              <!-- Línea top brillante -->
              <div class="absolute top-0 left-4 right-4 h-px transition-all duration-300" :class="isDark
                ? 'bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-hover:via-blue-500/80'
                : 'bg-gradient-to-r from-transparent via-blue-400/0 to-transparent group-hover:via-blue-400/60'">
              </div>

              <div class="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
                :class="isDark
                  ? 'bg-blue-500/15 text-blue-400 group-hover:bg-blue-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]'
                  : 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white'">
                <i class="fas fa-id-card text-lg"></i>
              </div>

              <div class="text-center relative">
                <h3 class="font-black uppercase italic text-[11px] tracking-wide transition-colors"
                  :class="isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-800'">
                  Capital Humano
                </h3>
                <p class="text-[9px] font-bold uppercase tracking-widest mt-0.5 transition-colors"
                  :class="isDark ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-400'">
                  Nómina
                </p>
              </div>
            </button>

            <!-- User Card -->
            <button @click="currentModule = 'view_novedad_user'"
              class="group relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden"
              :class="isDark
                ? 'bg-[#252b3b] border-white/10 hover:border-emerald-500 hover:shadow-[0_0_0_1px_rgba(16,185,129,0.5),0_0_30px_rgba(16,185,129,0.2)]'
                : 'bg-white border-slate-200 hover:border-emerald-400 shadow-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]'">

              <!-- Esquina decorativa top-left -->
              <div class="absolute top-0 left-0 w-8 h-8 overflow-hidden rounded-tl-xl">
                <div class="absolute -top-4 -left-4 w-8 h-8 rotate-45 transition-all duration-300" :class="isDark
                  ? 'bg-emerald-500/20 group-hover:bg-emerald-500/50'
                  : 'bg-emerald-400/15 group-hover:bg-emerald-400/40'">
                </div>
              </div>

              <!-- Línea top brillante -->
              <div class="absolute top-0 left-4 right-4 h-px transition-all duration-300" :class="isDark
                ? 'bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent group-hover:via-emerald-500/80'
                : 'bg-gradient-to-r from-transparent via-emerald-400/0 to-transparent group-hover:via-emerald-400/60'">
              </div>

              <div class="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
                :class="isDark
                  ? 'bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]'
                  : 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white'">
                <i class="fas fa-user-edit text-lg"></i>
              </div>

              <div class="text-center relative">
                <h3 class="font-black uppercase italic text-[11px] tracking-wide transition-colors"
                  :class="isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-800'">
                  Acceso Usuarios
                </h3>
                <p class="text-[9px] font-bold uppercase tracking-widest mt-0.5 transition-colors"
                  :class="isDark ? 'text-slate-500 group-hover:text-emerald-400' : 'text-slate-400'">
                  Personal
                </p>
              </div>
            </button>

          </div>
        </div>

        <NovedadesAdmin v-if="currentModule === 'view_novedad_admin'" :isDark="isDark" :company="selectedCompany" />
        <NovedadesRRHH v-if="currentModule === 'view_novedad_rrhh'" :isDark="isDark" :company="selectedCompany" />
        <NovedadesUsuario v-if="currentModule === 'view_novedad_user'" :isDark="isDark" :company="selectedCompany"
          :employee="employee" />
      </div>
    </main>
  </div>
</template>
<script setup>
import { adminOdoo } from '../composables/adminLogica/adminOdoo.js';
import AttendanceModule from '../components/admin/ModuloUsuariosAsistencias.vue';
import MeshModule from '../components/admin/ModuloMallaUpload.vue';
import NovedadesAdmin from './novedades/novedadesadminView.vue';
import NovedadesRRHH from './novedades/novedadesRRHView.vue';
import NovedadesUsuario from './novedades/novedadesusuarioView.vue';
import '../assets/css/admin-style.css';

const {
  employee, // <--- Este es tu "session"
  loading,
  currentTime,
  filteredReport,
  searchQuery,
  currentModule,
  isSidebarOpen,
  handleAttendance,
  logout,
  isDark,
  toggleTheme,
  allCompanies,
  selectedCompany,
  downloadExcelReport
} = adminOdoo();
</script>
