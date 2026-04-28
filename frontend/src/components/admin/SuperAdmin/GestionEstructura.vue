<template>
  <div class="space-y-3 animate-fade-in">

    <!-- HEADER -->
    <div class="flex items-center gap-3 px-3 py-2 rounded-xl border transition-all"
      :class="isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200'">
      <div class="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <i class="fas fa-sitemap text-white text-[11px]"></i>
      </div>
      <div>
        <h2 class="text-[11px] font-semibold uppercase tracking-wider text-blue-500">Estructura organizacional</h2>
        <p class="text-[9px] font-medium opacity-40 uppercase tracking-wide mt-0.5">Gestión de departamentos, áreas y segmentos</p>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-3">

      <!-- FORMULARIO -->
      <div class="rounded-xl border p-4 flex flex-col gap-3 transition-all"
        :class="isDark ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200'">

        <div class="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-2"
          :class="isDark ? 'text-white' : 'text-slate-700'">
          <i class="fas fa-plus-circle text-amber-500 text-[11px]"></i>
          Registrar nueva unidad
        </div>

        <!-- TOGGLE TIPO -->
        <div class="flex gap-1 p-1 rounded-lg" :class="isDark ? 'bg-white/5' : 'bg-slate-100'">
          <button @click="form.tipo = 'area'"
            class="flex-1 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-all"
            :class="form.tipo === 'area' ? 'bg-amber-500 text-black' : isDark ? 'text-white/40' : 'text-slate-400'">
            Área
          </button>
          <button @click="form.tipo = 'segmento'"
            class="flex-1 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-all"
            :class="form.tipo === 'segmento' ? 'bg-amber-500 text-black' : isDark ? 'text-white/40' : 'text-slate-400'">
            Segmento
          </button>
        </div>

        <!-- NOMBRE -->
        <div>
          <label class="text-[9px] font-semibold uppercase tracking-wider opacity-50 block mb-1"
            :class="isDark ? 'text-white' : 'text-slate-700'">Nombre de la unidad</label>
          <input v-model="form.nombre" type="text" placeholder="Ej: Móviles, Laboratorio..."
            class="w-full rounded-lg px-3 py-2 text-[12px] font-medium outline-none border transition-all" :class="isDark
              ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-amber-500'
              : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-amber-400'" />
        </div>

        <!-- DEPARTAMENTO (solo para áreas) -->
        <div v-if="form.tipo === 'area'">
          <label class="text-[9px] font-semibold uppercase tracking-wider opacity-50 block mb-1"
            :class="isDark ? 'text-white' : 'text-slate-700'">
            <span class="w-1.5 h-1.5 bg-violet-400 rounded-full inline-block mr-1"></span>
            Departamento al que pertenece
          </label>
          <div class="relative">
            <input v-model="form.departamento" list="depto-sugerencias" type="text"
              placeholder="Ej: Postventa, Logística..."
              class="w-full rounded-lg px-3 py-2 text-[12px] font-medium outline-none border transition-all"
              :class="isDark
                ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-violet-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-violet-400'" />
            <datalist id="depto-sugerencias">
              <option v-for="d in departamentosExistentes" :key="d" :value="d" />
            </datalist>
          </div>
          <p class="text-[9px] opacity-30 mt-1 px-1" :class="isDark ? 'text-white' : 'text-slate-500'">
            Agrupa esta área bajo un departamento. Puedes escribir uno nuevo o seleccionar uno existente.
          </p>
        </div>

        <!-- BUSCADOR RESPONSABLE -->
        <div class="relative">
          <label class="text-[9px] font-semibold uppercase tracking-wider opacity-50 block mb-1"
            :class="isDark ? 'text-white' : 'text-slate-700'">Responsable (jefe del área)</label>
          <div class="relative">
            <input type="text" v-model="searchQuery" @focus="showDropdown = true" placeholder="Escribe para buscar..."
              class="w-full rounded-lg px-3 py-2 pr-8 text-[12px] font-medium outline-none border transition-all"
              :class="isDark
                ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-amber-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-amber-400'" />
            <i class="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 opacity-30 text-[10px]"></i>
          </div>

          <div v-if="showDropdown && searchQuery"
            class="absolute z-50 w-full mt-1 rounded-xl border shadow-xl overflow-hidden"
            :class="isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'">
            <div class="max-h-[160px] overflow-y-auto">
              <div v-for="u in filteredUsers" :key="u.id" @click="selectUser(u)"
                class="px-3 py-2 cursor-pointer border-b transition-all"
                :class="isDark ? 'hover:bg-white/5 border-white/5' : 'hover:bg-slate-50 border-slate-100'">
                <div class="text-[11px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">{{ u.nombre }}</div>
                <div class="text-[9px] font-medium opacity-40 uppercase mt-0.5">{{ u.cargo || 'Sin cargo' }}</div>
              </div>
              <div v-if="!filteredUsers.length" class="px-3 py-3 text-[11px] text-center opacity-40">Sin resultados</div>
            </div>
          </div>
          <div v-if="showDropdown" @click="showDropdown = false" class="fixed inset-0 z-40"></div>
        </div>

        <button @click="submitForm" :disabled="!form.nombre || !form.responsableId"
          class="w-full py-2.5 bg-amber-500 text-black text-[11px] font-bold uppercase tracking-wide rounded-lg hover:bg-amber-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          Confirmar y guardar
        </button>
      </div>

      <!-- LISTA AGRUPADA POR DEPARTAMENTO -->
      <div class="rounded-xl border p-4 flex flex-col gap-3 transition-all"
        :class="isDark ? 'bg-slate-900/40 border-white/5' : 'bg-slate-50 border-slate-200'">

        <div class="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-2"
          :class="isDark ? 'text-white/50' : 'text-slate-400'">
          <i class="fas fa-sitemap text-[10px]"></i> Estructura activa
        </div>

        <div class="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-1 custom-scroll">

          <!-- ÁREAS AGRUPADAS POR DEPARTAMENTO -->
          <template v-if="Object.keys(areasAgrupadasLocal).length">
            <div v-for="(areasList, depto) in areasAgrupadasLocal" :key="depto">
              <!-- Encabezado departamento -->
              <div class="flex items-center gap-2 mb-1.5 px-1">
                <div class="w-4 h-4 rounded-md bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-building text-violet-400 text-[8px]"></i>
                </div>
                <span class="text-[9px] font-bold uppercase tracking-wider"
                  :class="isDark ? 'text-violet-300' : 'text-violet-600'">{{ depto }}</span>
                <div class="h-px flex-1" :class="isDark ? 'bg-violet-500/10' : 'bg-violet-200/60'"></div>
              </div>
              <!-- Áreas del departamento -->
              <div v-for="area in areasList" :key="'a-' + area.id"
                class="flex items-center justify-between px-3 py-2 rounded-lg border mb-1.5 ml-3 transition-all hover:translate-x-0.5"
                :class="isDark ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200'">
                <div class="flex items-center gap-2.5">
                  <span class="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-blue-500"></span>
                  <div>
                    <div class="text-[11px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">{{ area.nombre }}</div>
                    <div class="text-[9px] font-medium opacity-40 mt-0.5">
                      Jefe: {{ area.responsable?.nombre || 'Sin asignar' }}
                    </div>
                  </div>
                </div>
                <span class="text-[8px] font-semibold px-2 py-0.5 rounded-full uppercase bg-blue-500/10 text-blue-400">área</span>
              </div>
            </div>
          </template>

          <!-- SEGMENTOS -->
          <template v-if="props.segmentos?.length">
            <div>
              <div class="flex items-center gap-2 mb-1.5 px-1">
                <div class="w-4 h-4 rounded-md bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-layer-group text-emerald-400 text-[8px]"></i>
                </div>
                <span class="text-[9px] font-bold uppercase tracking-wider"
                  :class="isDark ? 'text-emerald-300' : 'text-emerald-600'">Segmentos</span>
                <div class="h-px flex-1" :class="isDark ? 'bg-emerald-500/10' : 'bg-emerald-200/60'"></div>
              </div>
              <div v-for="seg in props.segmentos" :key="'s-' + seg.id"
                class="flex items-center justify-between px-3 py-2 rounded-lg border mb-1.5 ml-3 transition-all hover:translate-x-0.5"
                :class="isDark ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200'">
                <div class="flex items-center gap-2.5">
                  <span class="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-emerald-500"></span>
                  <div>
                    <div class="text-[11px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">{{ seg.nombre }}</div>
                    <div class="text-[9px] font-medium opacity-40 mt-0.5">
                      Jefe: {{ seg.responsable?.nombre || 'Sin asignar' }}
                    </div>
                  </div>
                </div>
                <span class="text-[8px] font-semibold px-2 py-0.5 rounded-full uppercase bg-emerald-500/10 text-emerald-400">segmento</span>
              </div>
            </div>
          </template>

          <div v-if="!Object.keys(areasAgrupadasLocal).length && !props.segmentos?.length"
            class="text-center py-6 text-[11px] font-medium opacity-30">
            Sin unidades registradas
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  usuarios: Array,
  areas: Array,
  segmentos: Array,
  areasAgrupadas: Object,
  isDark: Boolean
});

const emit = defineEmits(['save']);

const searchQuery = ref('');
const showDropdown = ref(false);

const form = ref({
  tipo: 'area',
  nombre: '',
  departamento: '',
  responsableId: null
});

const areasAgrupadasLocal = computed(() => props.areasAgrupadas || {});

// Extrae los departamentos ya usados para el datalist (sugerencias)
const departamentosExistentes = computed(() => {
  return Object.keys(areasAgrupadasLocal.value).filter(d => d !== 'Sin departamento');
});

const filteredUsers = computed(() => {
  if (!searchQuery.value) return [];
  const query = searchQuery.value.toLowerCase();
  return (props.usuarios || []).filter(u =>
    u.nombre.toLowerCase().includes(query) ||
    (u.cargo && u.cargo.toLowerCase().includes(query))
  );
});

const selectUser = (user) => {
  form.value.responsableId = user.id;
  searchQuery.value = user.nombre;
  showDropdown.value = false;
};

const submitForm = () => {
  emit('save', { ...form.value });
  form.value.nombre = '';
  form.value.departamento = '';
  form.value.responsableId = null;
  searchQuery.value = '';
};
</script>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 4px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.2);
  border-radius: 10px;
}
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
