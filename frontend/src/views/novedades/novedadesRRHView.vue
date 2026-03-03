<template>
  <div class="w-full h-full p-2 md:p-4 animate-fade-in transition-all duration-500">
    
    <div 
      class="w-full max-w-7xl mx-auto shadow-sm rounded-[1.2rem] overflow-hidden border transition-all duration-500"
      :class="isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200'"
    >
      
      <div class="p-4 border-b" :class="isDark ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50/30'">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 flex items-center justify-center bg-slate-800 dark:bg-[#FF8F00] text-white dark:text-black rounded-lg shadow-sm">
              <i class="fas fa-user-check text-xs"></i>
            </div>
            <div>
              <h2 class="text-sm font-black uppercase tracking-tighter" :class="isDark ? 'text-white' : 'text-slate-800'">
                Gestión <span class="text-[#FF8F00]">RRHH</span>
              </h2>
              <p class="text-[7px] font-bold opacity-50 uppercase tracking-[0.2em]" :class="isDark ? 'text-white' : 'text-slate-500'">Auditoría de Ausentismos</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <div class="filter-group">
              <i class="fas fa-building text-[8px] opacity-40 mr-1"></i>
              <select v-model="filters.depto" class="filter-select" :class="isDark ? 'dark' : 'light'">
                <option value="">Departamento</option>
                <option v-for="d in deptos" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>

            <div class="filter-group">
              <i class="fas fa-briefcase text-[8px] opacity-40 mr-1"></i>
              <select v-model="filters.cargo" class="filter-select" :class="isDark ? 'dark' : 'light'">
                <option value="">Cargo</option>
                <option v-for="c in cargos" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>

            <div class="filter-group">
              <i class="fas fa-calendar-alt text-[8px] opacity-40 mr-1"></i>
              <input type="date" v-model="filters.fecha" class="filter-select w-24 md:w-auto" :class="isDark ? 'dark' : 'light'" />
            </div>

            <button @click="resetFilters" class="p-2 text-[9px] font-bold uppercase hover:text-[#FF8F00] transition-colors opacity-60">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto custom-scroll">
        <table class="w-full text-left border-collapse table-fixed min-w-[800px]">
          <thead>
            <tr class="border-b" :class="isDark ? 'border-white/5 text-slate-500' : 'border-slate-50 text-slate-400'">
              <th class="w-1/4 px-6 py-3 text-[8px] font-black uppercase tracking-widest">Colaborador</th>
              <th class="w-1/6 px-4 py-3 text-[8px] font-black uppercase tracking-widest text-center">Departamento</th>
              <th class="w-1/6 px-4 py-3 text-[8px] font-black uppercase tracking-widest text-center">Cargo</th>
              <th class="w-1/6 px-4 py-3 text-[8px] font-black uppercase tracking-widest text-center">Categoría / Días</th>
              <th class="w-1/6 px-6 py-3 text-[8px] font-black uppercase tracking-widest text-right">Acción</th>
            </tr>
          </thead>
          <tbody :class="isDark ? 'text-slate-400' : 'text-slate-600'">
            <tr 
              v-for="(item, idx) in novedadesFiltradas" :key="idx"
              class="group border-b last:border-0 transition-all hover:bg-slate-500/5"
              :class="isDark ? 'border-white/5' : 'border-slate-50'"
            >
              <td class="px-6 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-black text-[#FF8F00]">
                    {{ item.nombre.charAt(0) }}
                  </div>
                  <div class="flex flex-col truncate">
                    <span class="text-[10px] font-bold uppercase tracking-tight truncate" :class="isDark ? 'text-slate-200' : 'text-slate-800'">
                      {{ item.nombre }}
                    </span>
                    <span class="text-[8px] font-medium opacity-50 tracking-wider">{{ item.cedula }}</span>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="text-[9px] font-bold uppercase tracking-tighter opacity-80">{{ item.departamento }}</span>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="text-[9px] font-medium tracking-tight opacity-70">{{ item.cargo }}</span>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-2">
                  <span class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase" :class="getCatTag(item.categoria)">
                    {{ item.categoria }}
                  </span>
                  <span class="text-[9px] font-black text-[#FF8F00]">×{{ item.dias }}</span>
                </div>
              </td>
              <td class="px-6 py-3 text-right">
                <button 
                  @click="verSoporte(item.url)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 dark:bg-[#FF8F00] text-white dark:text-black text-[8px] font-black uppercase italic tracking-widest transition-all hover:scale-105 active:scale-95"
                >
                  <i class="fas fa-file-alt"></i>
                  <span>Ver Soporte</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-6 py-2 border-t" :class="isDark ? 'border-white/5' : 'border-slate-50'">
        <p class="text-[8px] font-bold opacity-40 uppercase tracking-[0.2em]">Total registros: {{ novedadesFiltradas.length }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({ isDark: Boolean, company: String });

const filters = ref({ depto: '', cargo: '', fecha: '' });

// Mock data
const deptos = ['Operaciones', 'Bodega', 'Producción', 'Logística'];
const cargos = ['Supervisor', 'Analista', 'Operario I', 'Coordinador'];

const novedades = ref([
  { nombre: "Elder Agudelo", cedula: "1020455", departamento: "Operaciones", cargo: "Supervisor", categoria: "Incapacidad", dias: 3, url: "#" },
  { nombre: "Maria Lopez", cedula: "1030998", departamento: "Bodega", cargo: "Analista", categoria: "Permiso", dias: 1, url: "#" },
  { nombre: "Juan Ramirez", cedula: "8055422", departamento: "Producción", cargo: "Operario I", categoria: "Calamidad", dias: 2, url: "#" },
]);

const novedadesFiltradas = computed(() => {
  return novedades.value.filter(n => {
    return (!filters.value.depto || n.departamento === filters.value.depto) &&
           (!filters.value.cargo || n.cargo === filters.value.cargo);
  });
});

const getCatTag = (cat) => {
  if (cat === 'Incapacidad') return 'bg-red-500/10 text-red-500';
  if (cat === 'Permiso') return 'bg-emerald-500/10 text-emerald-500';
  return 'bg-amber-500/10 text-amber-500';
};

const resetFilters = () => filters.value = { depto: '', cargo: '', fecha: '' };
const verSoporte = (url) => window.open(url, '_blank');
</script>

<style scoped>
.filter-group {
  @apply flex items-center px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20;
}

.filter-select {
  @apply bg-transparent text-[9px] font-bold uppercase outline-none cursor-pointer;
}

.filter-select.dark { @apply text-white; }
.filter-select.light { @apply text-slate-700; }

.custom-scroll::-webkit-scrollbar { height: 4px; }
.custom-scroll::-webkit-scrollbar-thumb { @apply bg-[#FF8F00]/20 rounded-full; }

.animate-fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
</style>