<template>
  <div class="w-full h-full p-3 md:p-6 lg:p-8 animate-fade-in transition-all duration-500 bg-transparent">
    
    <div 
      class="w-full max-w-[1400px] mx-auto shadow-sm rounded-2xl overflow-hidden border transition-all duration-500"
      :class="isDark ? 'bg-slate-900/40 border-white/5 shadow-black/40' : 'bg-white border-slate-200 shadow-slate-100'"
    >
      
      <div class="p-4 md:p-6 border-b" :class="isDark ? 'border-white/5 bg-white/5' : 'border-slate-50 bg-slate-50/30'">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 flex items-center justify-center bg-slate-800 dark:bg-[#FF8F00] text-white dark:text-black rounded-xl shrink-0 shadow-sm">
              <i class="fas fa-user-check text-base"></i>
            </div>
            <div>
              <h2 class="text-base font-black uppercase tracking-tighter" :class="isDark ? 'text-white' : 'text-slate-800'">
                Gestión <span class="text-[#FF8F00]">RRHH</span>
              </h2>
              <p class="text-[8px] font-bold opacity-50 uppercase tracking-[0.2em]" :class="isDark ? 'text-white' : 'text-slate-500'">Auditoría de Novedades</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <div class="filter-group flex-1 sm:flex-none min-w-[110px]">
              <select v-model="filters.depto" class="filter-select" :class="isDark ? 'dark' : 'light'">
                <option value="">Departamento</option>
                <option v-for="d in deptos" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>

            <div class="filter-group flex-1 sm:flex-none min-w-[110px]">
              <select v-model="filters.cargo" class="filter-select" :class="isDark ? 'dark' : 'light'">
                <option value="">Cargo</option>
                <option v-for="c in cargos" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>

            <button @click="resetFilters" class="p-2.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:text-[#FF8F00] transition-colors">
              <i class="fas fa-sync-alt text-[10px]"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="hidden md:block overflow-x-auto custom-scroll">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b" :class="isDark ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'">
              <th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Colaborador</th>
              <th class="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center">Área / Cargo</th>
              <th class="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center">Novedad</th>
              <th class="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center">Días</th>
              <th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-right">Acción</th>
            </tr>
          </thead>
          <tbody :class="isDark ? 'text-slate-400' : 'text-slate-600'">
            <tr v-for="(item, idx) in novedadesFiltradas" :key="idx"
              class="border-b last:border-0 hover:bg-slate-500/5 transition-colors"
              :class="isDark ? 'border-white/5' : 'border-slate-50'">
              
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-[#FF8F00]/10 flex items-center justify-center text-xs font-black text-[#FF8F00] shrink-0">
                    {{ item.nombre.charAt(0) }}
                  </div>
                  <div class="flex flex-col truncate">
                    <span class="text-[11px] font-bold uppercase tracking-tight truncate" :class="isDark ? 'text-slate-200' : 'text-slate-800'">
                      {{ item.nombre }}
                    </span>
                    <span class="text-[9px] font-medium opacity-50 tracking-wider">CC: {{ item.cedula }}</span>
                  </div>
                </div>
              </td>

              <td class="px-4 py-4 text-center">
                <div class="flex flex-col">
                  <span class="text-[10px] font-bold uppercase tracking-tighter" :class="isDark ? 'text-slate-300' : 'text-slate-700'">{{ item.departamento }}</span>
                  <span class="text-[8px] opacity-50 uppercase">{{ item.cargo }}</span>
                </div>
              </td>

              <td class="px-4 py-4 text-center">
                <span class="px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter" :class="getCatTag(item.categoria)">
                  {{ item.categoria }}
                </span>
              </td>

              <td class="px-4 py-4 text-center">
                <span class="text-[11px] font-black" :class="isDark ? 'text-white' : 'text-slate-800'">{{ item.dias }}</span>
              </td>

              <td class="px-6 py-4 text-right">
                <button @click="verSoporte(item.url)"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-[#FF8F00] text-white dark:text-black text-[9px] font-black uppercase italic tracking-widest transition-all hover:scale-105 active:scale-95 shadow-sm">
                  <i class="fas fa-file-pdf"></i>
                  <span>Soporte</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md:hidden divide-y" :class="isDark ? 'divide-white/5' : 'divide-slate-100'">
        <div v-for="(item, idx) in novedadesFiltradas" :key="'mob-'+idx" class="p-4 space-y-3">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-[#FF8F00]/10 flex items-center justify-center text-[10px] font-black text-[#FF8F00]">
                {{ item.nombre.charAt(0) }}
              </div>
              <span class="text-[10px] font-black uppercase tracking-tight" :class="isDark ? 'text-white' : 'text-slate-800'">{{ item.nombre }}</span>
            </div>
            <span class="px-2 py-1 rounded text-[8px] font-black uppercase" :class="getCatTag(item.categoria)">{{ item.categoria }}</span>
          </div>
          
          <div class="flex items-center justify-between text-[9px] font-bold uppercase opacity-60">
            <span>{{ item.cargo }} • {{ item.departamento }}</span>
            <span class="text-[#FF8F00]">{{ item.dias }} Días</span>
          </div>

          <button @click="verSoporte(item.url)"
            class="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-800 dark:bg-[#FF8F00] text-white dark:text-black text-[9px] font-black uppercase italic tracking-widest shadow-md">
            <i class="fas fa-file-alt"></i>
            <span>Ver Soporte</span>
          </button>
        </div>
      </div>

      <div class="px-6 py-3 border-t bg-slate-50/30 dark:bg-black/10" :class="isDark ? 'border-white/5' : 'border-slate-50'">
        <p class="text-[9px] font-black opacity-30 uppercase tracking-[0.3em]">Resultados: {{ novedadesFiltradas.length }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({ isDark: Boolean, company: String });
const filters = ref({ depto: '', cargo: '', fecha: '' });

const deptos = ['Operaciones', 'Bodega', 'Producción', 'Logística'];
const cargos = ['Supervisor', 'Analista', 'Operario I', 'Coordinador'];

const novedades = ref([
  { nombre: "Elder Agudelo Pita", cedula: "1020455", departamento: "Operaciones", cargo: "Supervisor", categoria: "Incapacidad", dias: 3, url: "#" },
  { nombre: "Maria Lopez Fernanda", cedula: "1030998", departamento: "Bodega", cargo: "Analista", categoria: "Permiso", dias: 1, url: "#" },
  { nombre: "Juan Ramirez Carlos", cedula: "8055422", departamento: "Producción", cargo: "Operario I", categoria: "Calamidad", dias: 2, url: "#" },
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
  @apply flex items-center px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20;
}
.filter-select {
  @apply bg-transparent text-[10px] font-bold uppercase outline-none cursor-pointer w-full;
}
.filter-select.dark { @apply text-white; }
.filter-select.light { @apply text-slate-700; }

.custom-scroll::-webkit-scrollbar { height: 4px; }
.custom-scroll::-webkit-scrollbar-thumb { @apply bg-[#FF8F00]/20 rounded-full; }

.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>