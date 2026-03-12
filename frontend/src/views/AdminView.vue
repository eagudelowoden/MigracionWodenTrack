<template>
  <div class="admin-layout transition-colors duration-500" :class="isDark ? 'theme-dark' : 'theme-light'">

    <aside class="sidebar" :style="{ backgroundColor: isDark ? '#273045' : '#f8fafc' }"
      :class="[isSidebarOpen ? 'sidebar-open' : 'sidebar-closed']">
      <div class="sidebar-header px-6 py-8">
        <div class="flex items-center group cursor-default">
          <div class="w-1 h-6 bg-[#FF8F00] rounded-full mr-3 group-hover:h-8 transition-all duration-300"></div>

          <div v-if="isSidebarOpen" class="flex items-baseline animate-fade-in">
            <span class="text-xl font-bold tracking-tight uppercase transition-colors duration-300"
              :class="isDark ? 'text-white' : 'text-slate-900'">
              Woden
            </span>
            <span class="ml-1 text-xl font-light tracking-widest text-[#FF8F00] uppercase">
              Track
            </span>
          </div>
        </div>


      </div>

      <nav class="flex-1 px-3 space-y-2 mt-6">
        <button v-if="employee?.isSuperAdmin || employee?.permisos?.['admin.asistencias']"
          @click="currentModule = 'asistencias'"
          :class="['nav-link-v2', currentModule === 'asistencias' ? 'active' : '']">
          <div class="nav-icon"><i class="fas fa-chart-line"></i></div>
          <span v-if="isSidebarOpen">Asistencias</span>
        </button>

        <button v-if="employee?.isSuperAdmin || employee?.permisos?.['admin.mallas']" @click="currentModule = 'mallas'"
          :class="['nav-link-v2', currentModule === 'mallas' ? 'active' : '']">
          <div class="nav-icon"><i class="fas fa-cloud-arrow-up"></i></div>
          <span v-if="isSidebarOpen">Cargue Mallas</span>
        </button>

        <button v-if="employee?.isSuperAdmin || employee?.permisos?.['admin.novedades']"
          @click="currentModule = 'novedadusuario'"
          :class="['nav-link-v2', currentModule === 'novedadusuario' ? 'active' : '']">
          <div class="nav-icon"><i class="fas fa-bullhorn"></i></div>
          <span v-if="isSidebarOpen">Novedades</span>
        </button>
      </nav>

      <div class="p-4 space-y-2 border-t" :class="isDark ? 'border-white/5' : 'border-slate-100'">
        <button @click="toggleTheme" class="nav-link-v2">
          <div class="nav-icon"><i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'"></i></div>
          <span v-if="isSidebarOpen">{{ isDark ? 'Luz' : 'Oscuro' }}</span>
        </button>
        <button @click="logout" class="nav-link-v2 logout">
          <div class="nav-icon"><i class="fas fa-power-off"></i></div>
          <span v-if="isSidebarOpen">Salir</span>
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

          <div class="text-center mb-6">
            <h2 class="text-lg font-black italic uppercase tracking-tighter transition-colors duration-500"
              :class="isDark ? 'text-white' : 'text-slate-900'">
              Panel de <span class="text-[#FF8F00]">Novedades</span>
            </h2>
            <div class="h-1 w-8 bg-[#FF8F00] mx-auto rounded-full mt-1 opacity-50"></div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl px-6">

            <button v-if="employee?.isSuperAdmin || employee?.permisos?.['admin.novedades.admin']"
              @click="currentModule = 'view_novedad_admin'" class="hub-card-mini group"
              :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'">

              <div class="icon-wrap bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-black">
                <i class="fas fa-user-shield text-xl"></i>
              </div>
              <div class="text-center">
                <h3 class="font-black uppercase italic text-[11px] transition-colors"
                  :class="isDark ? 'text-white' : 'text-slate-800'">Acceso Cordinadores</h3>
                <p class="text-[7px] opacity-40 font-bold uppercase tracking-tight"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Planta</p>
              </div>
            </button>

            <button v-if="employee?.isSuperAdmin || employee?.permisos?.['admin.novedades.rrhh']"
              @click="currentModule = 'view_novedad_rrhh'" class="hub-card-mini group"
              :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'">

              <div class="icon-wrap bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white">
                <i class="fas fa-id-card text-xl"></i>
              </div>
              <div class="text-center">
                <h3 class="font-black uppercase italic text-[11px] transition-colors"
                  :class="isDark ? 'text-white' : 'text-slate-800'">Capital Humano</h3>
                <p class="text-[7px] opacity-40 font-bold uppercase tracking-tight"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Nómina</p>
              </div>
            </button>

            <button @click="currentModule = 'view_novedad_user'" class="hub-card-mini group"
              :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'">

              <div
                class="icon-wrap bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white">
                <i class="fas fa-user-edit text-xl"></i>
              </div>
              <div class="text-center">
                <h3 class="font-black uppercase italic text-[11px] transition-colors"
                  :class="isDark ? 'text-white' : 'text-slate-800'">Acceso Usuarios</h3>
                <p class="text-[7px] opacity-40 font-bold uppercase tracking-tight"
                  :class="isDark ? 'text-white' : 'text-slate-600'">Personal</p>
              </div>
            </button>

          </div>
        </div>

        <NovedadesAdmin v-if="currentModule === 'view_novedad_admin'" />
        <NovedadesRRHH v-if="currentModule === 'view_novedad_rrhh'" />
        <NovedadesUsuario v-if="currentModule === 'view_novedad_user'" />

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
