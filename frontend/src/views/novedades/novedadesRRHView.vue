<template>
  <div class="w-full h-full animate-fade-in transition-all duration-500 flex flex-col gap-2">

    <!-- Header SEPARADO (como en Mallas) -->
    <div class="flex flex-wrap items-center justify-between gap-3 p-1.5 px-3 rounded-2xl border shrink-0 shadow-sm"
      :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

      <div class="flex items-center gap-3 ml-1">
        <div class="w-7 h-7 flex items-center justify-center rounded-xl bg-[#FF8F00] text-white shadow-sm">
          <i class="fas fa-user-check text-xs"></i>
        </div>
        <div>
          <h2 class="text-base font-black uppercase tracking-tighter" :class="isDark ? 'text-white' : 'text-slate-800'">
            Gestión <span class="text-[#FF8F00]">RRHH</span>
          </h2>
          <p class="text-[8px] font-bold opacity-50 uppercase tracking-[0.2em]"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Auditoría de Novedades</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center px-3 py-1.5 rounded-lg border"
          :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-200 bg-white'">
          <select v-model="filters.depto"
            class="bg-transparent text-[10px] font-bold uppercase outline-none cursor-pointer"
            :class="isDark ? 'text-white' : 'text-slate-700'">
            <option value="">Departamento</option>
            <option v-for="d in deptos" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>

        <div class="flex items-center px-3 py-1.5 rounded-lg border"
          :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-200 bg-white'">
          <select v-model="filters.cargo"
            class="bg-transparent text-[10px] font-bold uppercase outline-none cursor-pointer"
            :class="isDark ? 'text-white' : 'text-slate-700'">
            <option value="">Cargo</option>
            <option v-for="c in cargos" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <button @click="resetFilters" class="p-1.5 rounded-lg border transition-colors hover:text-[#FF8F00]"
          :class="isDark ? 'border-[#2d3548] bg-[#273045] text-slate-400' : 'border-slate-200 bg-white text-slate-500'">
          <i class="fas fa-sync-alt text-[10px]"></i>
        </button>
      </div>
    </div>

    <!-- Tabla SEPARADA (bloque independiente) -->
    <div class="flex-1 flex flex-col w-full overflow-hidden rounded-2xl border transition-all duration-500"
      :class="isDark ? 'bg-[#1e2538] border-[#2d3548] shadow-black/40' : 'bg-white border-slate-200 shadow-slate-100'">

      <!-- Tabla desktop -->
      <div class="hidden md:flex flex-col flex-1 overflow-hidden">
        <div class="flex-1 overflow-y-auto overflow-x-auto">
          <table class="w-full border-separate border-spacing-0">
            <thead class="sticky top-0 z-10">
              <tr class="bg-[#334155]">
                <th
                  class="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Colaborador</th>
                <th
                  class="px-4 py-3 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Área / Cargo</th>
                <th
                  class="px-4 py-3 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Novedad</th>
                <th
                  class="px-4 py-3 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Días</th>
                <th
                  class="px-5 py-3 text-right text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                  Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in novedadesFiltradas" :key="idx" class="group transition-all duration-150" :class="[
                idx % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-transparent',
                isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-orange-50'
              ]">

                <td class="px-5 py-3 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-lg bg-[#FF8F00]/10 flex items-center justify-center text-xs font-black text-[#FF8F00] shrink-0">
                      {{ item.nombre.charAt(0) }}
                    </div>
                    <div class="flex flex-col">
                      <span class="text-[11px] font-bold uppercase tracking-tight"
                        :class="isDark ? 'text-white' : 'text-slate-900'">{{ item.nombre }}</span>
                      <span class="text-[9px] font-medium opacity-50 tracking-wider">CC: {{ item.cedula }}</span>
                    </div>
                  </div>
                </td>

                <td class="px-4 py-3 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <div class="flex flex-col">
                    <span class="text-[10px] font-bold uppercase tracking-tighter"
                      :class="isDark ? 'text-slate-300' : 'text-slate-700'">{{ item.departamento }}</span>
                    <span class="text-[8px] opacity-50 uppercase">{{ item.cargo }}</span>
                  </div>
                </td>

                <td class="px-4 py-3 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <span class="px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter"
                    :class="getCatTag(item.categoria)">
                    {{ item.categoria }}
                  </span>
                </td>

                <td class="px-4 py-3 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <span class="text-[11px] font-black" :class="isDark ? 'text-white' : 'text-slate-800'">{{ item.dias
                    }}</span>
                </td>

                <td class="px-5 py-3 text-right border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <button @click="verSoporte(item.url)"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase italic tracking-widest transition-all hover:scale-105 active:scale-95 shadow-sm"
                    :class="isDark ? 'bg-[#FF8F00] text-black' : 'bg-slate-900 text-white'">
                    <i class="fas fa-file-pdf"></i>
                    <span>Soporte</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="px-5 py-2 border-t shrink-0 flex items-center"
          :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-100 bg-slate-50'">
          <p class="text-[9px] font-black uppercase tracking-widest"
            :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            Resultados: <span :class="isDark ? 'text-white' : 'text-slate-800'">{{ novedadesFiltradas.length }}</span>
          </p>
        </div>
      </div>

      <!-- Mobile -->
      <div class="md:hidden flex-1 overflow-y-auto divide-y" :class="isDark ? 'divide-[#2d3548]' : 'divide-slate-100'">
        <div v-for="(item, idx) in novedadesFiltradas" :key="'mob-' + idx" class="p-4 space-y-3">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-lg bg-[#FF8F00]/10 flex items-center justify-center text-[10px] font-black text-[#FF8F00]">
                {{ item.nombre.charAt(0) }}
              </div>
              <span class="text-[10px] font-black uppercase tracking-tight"
                :class="isDark ? 'text-white' : 'text-slate-800'">{{ item.nombre }}</span>
            </div>
            <span class="px-2 py-1 rounded text-[8px] font-black uppercase" :class="getCatTag(item.categoria)">{{
              item.categoria }}</span>
          </div>
          <div class="flex items-center justify-between text-[9px] font-bold uppercase opacity-60">
            <span>{{ item.cargo }} • {{ item.departamento }}</span>
            <span class="text-[#FF8F00]">{{ item.dias }} Días</span>
          </div>
          <button @click="verSoporte(item.url)"
            class="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[9px] font-black uppercase italic tracking-widest shadow-md"
            :class="isDark ? 'bg-[#FF8F00] text-black' : 'bg-slate-800 text-white'">
            <i class="fas fa-file-alt"></i>
            <span>Ver Soporte</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({ isDark: Boolean, company: String });
const filters = ref({ depto: '', cargo: '' });

const deptos = ['Operaciones', 'Bodega', 'Producción', 'Logística'];
const cargos = ['Supervisor', 'Analista', 'Operario I', 'Coordinador'];

const novedades = ref([
  { nombre: "Elder Agudelo Pita", cedula: "1020455", departamento: "Operaciones", cargo: "Supervisor", categoria: "Incapacidad", dias: 3, url: "#" },
  { nombre: "Maria Lopez Fernanda", cedula: "1030998", departamento: "Bodega", cargo: "Analista", categoria: "Permiso", dias: 1, url: "#" },
  { nombre: "Juan Ramirez Carlos", cedula: "8055422", departamento: "Producción", cargo: "Operario I", categoria: "Calamidad", dias: 2, url: "#" },
]);

const novedadesFiltradas = computed(() =>
  novedades.value.filter(n =>
    (!filters.value.depto || n.departamento === filters.value.depto) &&
    (!filters.value.cargo || n.cargo === filters.value.cargo)
  )
);

const getCatTag = (cat) => {
  if (cat === 'Incapacidad') return 'bg-red-500/10 text-red-500';
  if (cat === 'Permiso') return 'bg-emerald-500/10 text-emerald-500';
  return 'bg-amber-500/10 text-amber-500';
};

const resetFilters = () => filters.value = { depto: '', cargo: '' };
const verSoporte = (url) => window.open(url, '_blank');
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
