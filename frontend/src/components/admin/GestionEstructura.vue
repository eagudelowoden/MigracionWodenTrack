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

            <div>
              <label class="text-[8px] font-black opacity-40 uppercase ml-2">Asignar Responsable (Jefe)</label>
              <select v-model="form.responsableId" 
                      class="w-full mt-1 bg-black/5 border border-white/5 p-4 rounded-2xl text-[10px] font-bold outline-none focus:border-[#FF8F00] appearance-none"
                      :class="isDark ? 'text-white' : 'text-slate-800'">
                <option :value="null" disabled>SELECCIONE UN LÍDER...</option>
                <option v-for="u in usuarios" :key="u.id" :value="u.id">
                  {{ u.nombre }} - {{ u.cargo || 'Sin Cargo' }}
                </option>
              </select>
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

const form = ref({
  tipo: 'area',
  nombre: '',
  responsableId: null
});

const listaCombinada = computed(() => {
  const a = props.areas.map(i => ({ ...i, tipo: 'area' }));
  const s = props.segmentos.map(i => ({ ...i, tipo: 'segmento' }));
  return [...a, ...s];
});

const submitForm = () => {
  emit('save', { ...form.value });
  form.value.nombre = '';
  form.value.responsableId = null;
};
</script>

<style scoped>
.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.2); border-radius: 10px; }
</style>