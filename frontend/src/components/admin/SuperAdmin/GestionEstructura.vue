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
        <p class="text-[9px] font-medium opacity-40 uppercase tracking-wide mt-0.5">Gestión de áreas y segmentos</p>
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
          <input v-model="form.nombre" type="text" placeholder="Ej: Calidad, Logística..."
            class="w-full rounded-lg px-3 py-2 text-[12px] font-medium outline-none border transition-all" :class="isDark
              ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-amber-500'
              : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-amber-400'" />
        </div>

        <!-- BUSCADOR RESPONSABLE -->
        <div class="relative">
          <label class="text-[9px] font-semibold uppercase tracking-wider opacity-50 block mb-1"
            :class="isDark ? 'text-white' : 'text-slate-700'">Responsable</label>
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
                <div class="text-[11px] font-600" :class="isDark ? 'text-white' : 'text-slate-800'">{{ u.nombre }}</div>
                <div class="text-[9px] font-medium opacity-40 uppercase mt-0.5">{{ u.cargo || 'Sin cargo' }}</div>
              </div>
              <div v-if="!filteredUsers.length" class="px-3 py-3 text-[11px] text-center opacity-40">Sin resultados
              </div>
            </div>
          </div>
          <div v-if="showDropdown" @click="showDropdown = false" class="fixed inset-0 z-40"></div>
        </div>

        <button @click="submitForm" :disabled="!form.nombre || !form.responsableId"
          class="w-full py-2.5 bg-amber-500 text-black text-[11px] font-bold uppercase tracking-wide rounded-lg hover:bg-amber-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          Confirmar y guardar
        </button>
      </div>

      <!-- LISTA -->
      <div class="rounded-xl border p-4 flex flex-col gap-3 transition-all"
        :class="isDark ? 'bg-slate-900/40 border-white/5' : 'bg-slate-50 border-slate-200'">

        <div class="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-2"
          :class="isDark ? 'text-white/50' : 'text-slate-400'">
          <i class="fas fa-list-ul text-[10px]"></i> Unidades activas
        </div>

        <div class="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scroll">
          <div v-for="item in listaCombinada" :key="item.id + item.tipo"
            class="flex items-center justify-between px-3 py-2 rounded-lg border transition-all hover:translate-x-0.5"
            :class="isDark ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200'">
            <div class="flex items-center gap-2.5">
              <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                :class="item.tipo === 'area' ? 'bg-blue-500' : 'bg-emerald-500'"></span>
              <div>
                <div class="text-[11px] font-semibold" :class="isDark ? 'text-white' : 'text-slate-800'">{{ item.nombre
                }}</div>
                <div class="text-[9px] font-medium opacity-40 mt-0.5">
                  Resp: {{ item.responsable?.nombre || 'S/A' }}
                </div>
              </div>
            </div>
            <span class="text-[8px] font-semibold px-2 py-0.5 rounded-full uppercase"
              :class="isDark ? 'bg-white/5 text-white/30' : 'bg-slate-100 text-slate-400'">
              {{ item.tipo }}
            </span>
          </div>

          <div v-if="!listaCombinada.length" class="text-center py-6 text-[11px] font-medium opacity-30">
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
  isDark: Boolean
});

const emit = defineEmits(['save']);

// --- ESTADOS DEL BUSCADOR ---
const searchQuery = ref('');
const showDropdown = ref(false);

const form = ref({
  tipo: 'area',
  nombre: '',
  responsableId: null
});

// --- LÓGICA DE FILTRADO ---
const filteredUsers = computed(() => {
  if (!searchQuery.value) return [];
  const query = searchQuery.value.toLowerCase();
  return props.usuarios.filter(u =>
    u.nombre.toLowerCase().includes(query) ||
    (u.cargo && u.cargo.toLowerCase().includes(query))
  );
});

const selectUser = (user) => {
  form.value.responsableId = user.id;
  searchQuery.value = user.nombre; // Mostramos el nombre seleccionado en el input
  showDropdown.value = false;
};

const listaCombinada = computed(() => {
  const a = props.areas.map(i => ({ ...i, tipo: 'area' }));
  const s = props.segmentos.map(i => ({ ...i, tipo: 'segmento' }));
  return [...a, ...s];
});

const submitForm = () => {
  emit('save', { ...form.value });
  form.value.nombre = '';
  form.value.responsableId = null;
  searchQuery.value = ''; // Limpiar buscador
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