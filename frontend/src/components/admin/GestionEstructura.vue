<template>
  <div class="space-y-8 animate-fade-in">
    <div class="flex items-center gap-4 px-4 py-2 rounded-xl border"
         :class="isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'">
      <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
        <i class="fas fa-sitemap text-[12px]"></i>
      </div>
      <div>
        <h2 class="text-[11px] font-black uppercase tracking-wider text-blue-500 leading-none">Estructura Organizacional</h2>
        <p class="text-[8px] font-bold opacity-40 uppercase tracking-tighter mt-0.5">Gestión de Áreas y Segmentos</p>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
      
      <div class="space-y-6">
        <div class="p-8 rounded-[2rem] border transition-all duration-500"
             :class="isDark ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'">
          
          <div class="flex items-center gap-3 mb-8">
            <i class="fas fa-plus-circle text-[#FF8F00]"></i>
            <h3 class="text-xs font-black uppercase tracking-[0.2em]" :class="isDark ? 'text-white' : 'text-slate-800'">Registrar Nueva Unidad</h3>
          </div>

          <div class="space-y-5">
            <div class="flex gap-2 p-1 rounded-xl bg-black/5 mb-4">
              <button @click="form.tipo = 'area'" 
                      :class="form.tipo === 'area' ? 'bg-[#FF8F00] text-black' : 'text-slate-500'"
                      class="flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all">Área</button>
              <button @click="form.tipo = 'segmento'" 
                      :class="form.tipo === 'segmento' ? 'bg-[#FF8F00] text-black' : 'text-slate-500'"
                      class="flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all">Segmento</button>
            </div>

            <div>
              <label class="text-[8px] font-black opacity-40 uppercase ml-2">Nombre de la Unidad</label>
              <input v-model="form.nombre" type="text" placeholder="EJ: CALIDAD / LOGISTICA..."
                     class="w-full mt-1 bg-black/5 border border-white/5 p-4 rounded-2xl text-[10px] font-bold outline-none focus:border-[#FF8F00] transition-all"
                     :class="isDark ? 'text-white' : 'text-slate-800'"/>
            </div>

            <div class="relative">
              <label class="text-[8px] font-black opacity-40 uppercase ml-2">Asignar Responsable (Jefe)</label>
              
              <div class="relative mt-1">
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  @focus="showDropdown = true"
                  placeholder="ESCRIBE PARA BUSCAR..."
                  class="w-full bg-black/5 border border-white/5 p-4 rounded-2xl text-[10px] font-bold outline-none focus:border-[#FF8F00] transition-all"
                  :class="isDark ? 'text-white' : 'text-slate-800'"
                />
                <i class="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 opacity-20 text-[10px]"></i>
              </div>

              <div v-if="showDropdown && searchQuery" 
                   class="absolute z-50 w-full mt-2 rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-xl"
                   :class="isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'">
                
                <div class="max-h-[200px] overflow-y-auto custom-scroll">
                  <div v-for="u in filteredUsers" :key="u.id"
                       @click="selectUser(u)"
                       class="p-4 cursor-pointer transition-all border-b last:border-0"
                       :class="isDark ? 'hover:bg-white/5 border-white/5' : 'hover:bg-slate-50 border-slate-100'">
                    <div class="text-[10px] font-black uppercase" :class="isDark ? 'text-white' : 'text-slate-800'">{{ u.nombre }}</div>
                    <div class="text-[8px] font-bold opacity-40 uppercase">{{ u.cargo || 'Sin Cargo' }}</div>
                  </div>
                  
                  <div v-if="filteredUsers.length === 0" class="p-4 text-[10px] text-center opacity-40 font-bold uppercase">
                    No se encontraron resultados
                  </div>
                </div>
              </div>
              
              <div v-if="showDropdown" @click="showDropdown = false" class="fixed inset-0 z-40"></div>
            </div>

            <button @click="submitForm" 
                    :disabled="!form.nombre || !form.responsableId"
                    class="w-full py-4 bg-[#FF8F00] text-black font-black rounded-2xl text-[10px] uppercase shadow-xl shadow-[#FF8F00]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30">
              Confirmar y Guardar
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="p-6 rounded-[2rem] border h-full"
             :class="isDark ? 'bg-slate-900/40 border-white/5' : 'bg-slate-50 border-slate-200'">
          
          <h3 class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-6 flex items-center gap-2">
            <i class="fas fa-list-ul"></i> Unidades Activas
          </h3>

          <div class="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scroll">
            <div v-for="item in listaCombinada" :key="item.id + item.tipo"
                 class="group flex items-center justify-between p-4 rounded-2xl border transition-all hover:translate-x-1"
                 :class="isDark ? 'bg-black/20 border-white/5 hover:bg-black/40' : 'bg-white border-slate-200 shadow-sm'">
              
              <div class="flex items-center gap-4">
                <div class="w-2 h-2 rounded-full" :class="item.tipo === 'area' ? 'bg-blue-500' : 'bg-emerald-500'"></div>
                <div>
                  <div class="text-[10px] font-black uppercase tracking-tight" :class="isDark ? 'text-white' : 'text-slate-800'">
                    {{ item.nombre }}
                  </div>
                  <div class="text-[8px] font-bold opacity-50 uppercase tracking-tighter">
                    Resp: {{ item.responsable?.nombre || 'S/A' }}
                  </div>
                </div>
              </div>

              <span class="text-[7px] font-black px-2 py-1 rounded bg-black/10 opacity-40 uppercase tracking-widest">
                {{ item.tipo }}
              </span>
            </div>
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
.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.2); border-radius: 10px; }

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>