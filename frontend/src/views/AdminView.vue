<template>
  <div class="admin-layout transition-colors duration-500" :class="isDark ? 'theme-dark' : 'theme-light'">

    <aside class="sidebar" :class="[isSidebarOpen ? 'sidebar-open' : 'sidebar-closed']">
      <div class="sidebar-header">
        <div class="w-10 h-10 bg-[#FF8F00] rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
          <span class="font-black text-xl">W</span>
        </div>
        <h2 v-if="isSidebarOpen" class="ml-3 text-sm font-black uppercase tracking-tighter animate-fade-in" :class="isDark ? 'text-white' : 'text-slate-800'">
          Admin Portal
        </h2>
      </div>

      <nav class="flex-1 px-3 space-y-2 mt-6">
        <button @click="currentModule = 'novedades'"
          :class="['nav-link-v2', currentModule === 'novedades' ? 'active' : '']">
          <div class="nav-icon"><i class="fas fa-chart-line"></i></div>
          <span v-if="isSidebarOpen">Seguimiento</span>
        </button>
        <button @click="currentModule = 'mallas'" 
          :class="['nav-link-v2', currentModule === 'mallas' ? 'active' : '']">
          <div class="nav-icon"><i class="fas fa-cloud-arrow-up"></i></div>
          <span v-if="isSidebarOpen">Cargue Mallas</span>
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
        :class="isDark ? 'bg-[#0f172a] border-b border-white/5' : 'bg-white border-b border-slate-200 shadow-sm'">
        
        <div class="flex items-center gap-6">
          <button @click="isSidebarOpen = !isSidebarOpen" class="text-slate-400 hover:text-[#FF8F00] transition-colors">
            <i class="fas fa-bars-staggered text-lg"></i>
          </button>

          <div v-if="allCompanies.length > 0"
            class="company-selector flex items-center gap-3 px-4 py-2 rounded-xl transition-all min-w-[320px]"
            :class="isDark ? 'bg-slate-800 border border-white/5' : 'bg-slate-50 border border-slate-200 shadow-inner'">
            <i class="fas fa-building text-[#FF8F00]"></i>
            <select v-model="selectedCompany"
              class="flex-1 bg-transparent text-[11px] font-black uppercase outline-none cursor-pointer text-slate-800 dark:text-white appearance-none">
              <option v-for="comp in allCompanies" :key="comp.id" :value="comp.name">{{ comp.name }}</option>
            </select>
            <i class="fas fa-angle-down text-[10px] opacity-40"></i>
          </div>
        </div>

        <div class="flex items-center gap-6">
          <div class="flex items-center bg-slate-500/10 p-1 rounded-xl gap-1">
            <button @click="handleAttendance" :disabled="loading || employee?.is_inside || employee?.day_completed"
              class="btn-action-header in">
              Entrada
            </button>
            <button @click="handleAttendance" :disabled="loading || !employee?.is_inside || employee?.day_completed"
              class="btn-action-header out">
              Salida
            </button>
          </div>

          <div class="flex items-center gap-3 border-l border-slate-300 dark:border-white/10 pl-6">
            <div class="text-right">
              <p class="text-[9px] font-black text-[#FF8F00] tracking-widest leading-none">ADMIN</p>
              <p class="text-[12px] font-bold leading-tight" :class="isDark ? 'text-white' : 'text-slate-800'">
                {{ employee?.name }}
              </p>
            </div>
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF8F00] to-orange-400 flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/20">
              {{ employee?.name?.charAt(0) }}
            </div>
          </div>
        </div>
      </header>

      <div class="flex-1 p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-900/20">
        <AttendanceModule v-if="currentModule === 'novedades'" :isDark="isDark" :company="selectedCompany" />
        <MeshModule v-if="currentModule === 'mallas'" :isDark="isDark" :company="selectedCompany" />
      </div>
    </main>
  </div>
</template>
<script setup>
import { adminOdoo } from '../composables/adminLogica/adminOdoo.js';
import AttendanceModule from '../components/admin/ModuloUsuariosAsistencias.vue';
import MeshModule from '../components/admin/ModuloMallaUpload.vue';
import '../assets/css/admin-style.css';

const {
  employee, loading, currentTime, filteredReport, searchQuery, currentModule, isSidebarOpen,
  handleAttendance, logout, isDark, toggleTheme, allCompanies,    // <--- Agregar esta
  selectedCompany, downloadExcelReport
} = adminOdoo();
</script>