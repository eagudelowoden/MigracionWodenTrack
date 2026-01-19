<template>
  <div class="admin-layout transition-colors duration-500" :class="isDark ? 'theme-dark' : 'theme-light'">

    <aside class="sidebar"
      :class="[isDark ? 'theme-dark' : 'theme-light', isSidebarOpen ? 'sidebar-open' : 'sidebar-closed']">
      <div class="sidebar-header">
        <h2 v-if="isSidebarOpen" class="text-[#FF8F00] text-sm font-black uppercase italic truncate">Woden Admin</h2>
        <span v-else class="text-[#FF8F00] font-black text-xl">W</span>
      </div>

      <div v-if="isSidebarOpen" class="p-3 space-y-3 animate-fade-in">
        <div class="text-center py-2 rounded-xl bg-[#FF8F00]/10 border border-[#FF8F00]/20">
          <p class="text-lg font-mono font-black text-[#FF8F00]">{{ currentTime }}</p>
        </div>
        <div class="grid grid-cols-2 gap-1.5">
          <button @click="handleAttendance" :disabled="loading || employee?.is_inside || employee?.day_completed"
            class="btn-attendance btn-in">Entrada</button>
          <button @click="handleAttendance" :disabled="loading || !employee?.is_inside || employee?.day_completed"
            class="btn-attendance btn-out">Salida</button>
        </div>
      </div>

      <nav class="flex-1 px-2 space-y-1 mt-4">
        <button @click="currentModule = 'novedades'"
          :class="['nav-link', currentModule === 'novedades' ? 'active' : '']">
          <i class="fas fa-users"></i>
          <span v-if="isSidebarOpen">Seguimiento de Asistencia</span>
        </button>
        <button @click="currentModule = 'mallas'" :class="['nav-link', currentModule === 'mallas' ? 'active' : '']">
          <i class="fas fa-calendar-check"></i>
          <span v-if="isSidebarOpen">Cargue Mallas</span>
        </button>
      </nav>

      <div class="p-3 border-t space-y-2" :class="isDark ? 'border-slate-600' : 'border-slate-100'">
        <button @click="toggleTheme"
          class="theme-toggle-btn w-full flex items-center justify-center p-2 rounded-xl border text-[9px] font-black uppercase">
          <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'"></i>
          <span v-if="isSidebarOpen" class="ml-2">{{ isDark ? 'Claro' : 'Oscuro' }}</span>
        </button>
        <button @click="logout"
          class="w-full flex items-center justify-center p-2 bg-rose-600/10 text-rose-500 hover:bg-rose-600 hover:text-white rounded-xl font-black text-[9px] uppercase transition-all">
          <i class="fas fa-sign-out-alt"></i>
          <span v-if="isSidebarOpen" class="ml-2">Salir</span>
        </button>
      </div>
    </aside>

    <main class="flex-1 flex flex-col min-w-0 h-full">
      <header class="header-main h-14 border-b flex items-center justify-between px-4">
        <div class="flex items-center gap-4">
          <button @click="isSidebarOpen = !isSidebarOpen" class="sidebar-toggle-btn">
            <i :class="isSidebarOpen ? 'fas fa-indent' : 'fas fa-outdent'"></i>
          </button>

          <div class="flex items-center gap-3">
            <div v-if="allCompanies.length > 0"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm transition-all duration-300 min-w-[280px]"
              :class="isDark ? 'bg-slate-800 border-slate-700 hover:border-[#FF8F00]' : 'bg-white border-slate-200 hover:border-[#FF8F00]'">

              <i class="fas fa-building text-[#FF8F00] text-xs"></i>

              <select v-model="selectedCompany"
                class="flex-1 bg-transparent text-[11px] font-bold uppercase outline-none cursor-pointer text-slate-600 dark:text-slate-300 appearance-none">
                <option v-for="comp in allCompanies" :key="comp.id" :value="comp.name">
                  {{ comp.name }}
                </option>
              </select>

              <i class="fas fa-chevron-down text-[9px] text-slate-400 pointer-events-none"></i>
            </div>
          </div>
        </div>

        <div class="text-right">
          <p class="text-[8px] font-black uppercase text-[#FF8F00]">Admin</p>
          <p class="text-[10px] font-bold opacity-60 leading-none">{{ employee?.name }}</p>
        </div>
      </header>

      <div class="flex-1 p-3 md:p-3 overflow-y-auto">
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