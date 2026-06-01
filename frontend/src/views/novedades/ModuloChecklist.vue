<template>
  <div class="rounded-lg border p-3 flex flex-col gap-2 transition-all"
    :class="[
      isDark ? 'border-[#222938] bg-[#0B0F19]' : 'border-slate-200 bg-slate-50',
      completado ? (isDark ? 'border-emerald-500/30 bg-emerald-500/[0.04]' : 'border-emerald-300 bg-emerald-50') : '',
    ]">

    <!-- Encabezado del módulo -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-md flex items-center justify-center text-[11px]"
          :class="completado
            ? 'bg-emerald-500/15 text-emerald-500'
            : (isDark ? 'bg-[#222938] text-slate-400' : 'bg-slate-200 text-slate-500')">
          <i :class="modulo.icon"></i>
        </div>
        <span class="text-[12px] font-semibold"
          :class="completado ? 'text-emerald-500' : (isDark ? 'text-slate-300' : 'text-slate-700')">
          {{ modulo.label }}
        </span>
      </div>
      <!-- Toggle -->
      <button type="button" @click="toggleOk"
        class="relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none"
        :class="completado ? 'bg-emerald-500' : (isDark ? 'bg-[#333]' : 'bg-slate-300')">
        <span class="absolute top-[3px] w-3.5 h-3.5 rounded-full bg-white shadow transition-all duration-200"
          :class="completado ? 'left-[20px]' : 'left-[3px]'"></span>
      </button>
    </div>

    <!-- Estado -->
    <div v-if="completado" class="text-[10px]" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
      <i class="fas fa-user-check mr-1"></i>{{ ps[`${modulo.key}_por`] || '—' }}
      <span v-if="ps[`${modulo.key}_fecha`]" class="ml-1">
        · {{ new Date(ps[`${modulo.key}_fecha`]).toLocaleDateString('es-CO') }}
      </span>
    </div>

    <!-- Notas -->
    <div v-if="editando || ps[`${modulo.key}_notas`]">
      <textarea v-if="editando" v-model="notas" rows="2"
        :placeholder="`Observaciones ${modulo.label}…`"
        class="w-full px-2 py-1.5 text-[10px] rounded-md border outline-none resize-none transition-all"
        :class="isDark ? 'bg-[#0B0F19] border-[#222938] text-white placeholder:text-slate-600 focus:border-emerald-500/50'
                       : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-emerald-400'">
      </textarea>
      <p v-else class="text-[10px] italic" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
        {{ ps[`${modulo.key}_notas`] }}
      </p>
    </div>

    <!-- Botones edición -->
    <div class="flex items-center gap-1.5 mt-auto">
      <button v-if="!editando" @click="editando = true"
        class="text-[10px] font-medium flex items-center gap-1 transition-all"
        :class="isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'">
        <i class="fas fa-pen text-[8px]"></i> Notas
      </button>
      <template v-if="editando">
        <button @click="guardar"
          class="h-6 px-2.5 rounded-[4px] text-[10px] font-medium bg-emerald-500 text-white hover:bg-emerald-600 flex items-center gap-1">
          <i class="fas fa-floppy-disk text-[8px]"></i> Guardar
        </button>
        <button @click="cancelar"
          class="h-6 px-2 rounded-[4px] text-[10px] border transition-all"
          :class="isDark ? 'border-[#222938] text-slate-500 hover:text-white' : 'border-slate-200 text-slate-400'">
          Cancelar
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  modulo: Object,  // { key, label, icon }
  ps: Object,      // PazSalvo record
  isDark: Boolean,
});
const emit = defineEmits(['actualizar']);

const editando = ref(false);
const notas    = ref(props.ps?.[`${props.modulo.key}_notas`] || '');

const completado = computed(() => !!props.ps?.[`${props.modulo.key}_ok`]);

function toggleOk() {
  emit('actualizar', {
    modulo: props.modulo.key,
    ok:     !completado.value,
    notas:  notas.value,
  });
}

function guardar() {
  emit('actualizar', {
    modulo: props.modulo.key,
    ok:     completado.value,
    notas:  notas.value,
  });
  editando.value = false;
}

function cancelar() {
  notas.value    = props.ps?.[`${props.modulo.key}_notas`] || '';
  editando.value = false;
}
</script>
