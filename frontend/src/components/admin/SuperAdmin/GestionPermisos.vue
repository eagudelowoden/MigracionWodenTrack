<template>
    <Transition name="fade">
        <div v-if="modelValue"
            class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            @click.self="emit('update:modelValue', null)">

            <div class="w-full max-w-md max-h-[90vh] rounded-2xl border shadow-2xl animate-fade-in flex flex-col"
                :class="isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'">

                <!-- HEADER -->
                <div class="flex items-start justify-between p-5 border-b flex-shrink-0"
                    :class="isDark ? 'border-white/5' : 'border-slate-100'">
                    <div>
                        <h3 class="text-[13px] font-bold text-amber-500 uppercase tracking-wide">Configurar accesos</h3>
                        <p class="text-[10px] font-medium opacity-50 mt-0.5">{{ modelValue.nombre }}</p>
                    </div>
                    <button @click="emit('update:modelValue', null)"
                        class="w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-40 hover:opacity-100"
                        :class="isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'">
                        <i class="fas fa-times text-[12px]"></i>
                    </button>
                </div>

                <!-- BODY -->
                <div class="flex-1 overflow-y-auto p-5 space-y-4 custom-scroll">

                    <!-- ESTRUCTURA ORGANIZACIONAL -->
                    <div class="rounded-xl border p-4 space-y-3"
                        :class="isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'">
                        <div class="flex items-center gap-2 mb-1">
                            <div class="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center">
                                <i class="fas fa-layer-group text-amber-500 text-[9px]"></i>
                            </div>
                            <span class="text-[10px] font-semibold uppercase tracking-wider opacity-60">
                                Estructura organizacional
                            </span>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-[9px] font-semibold uppercase tracking-wider opacity-40 block mb-1.5
                  flex items-center gap-1">
                                    <span class="w-1.5 h-1.5 bg-blue-400 rounded-full inline-block"></span> Área
                                </label>
                                <div class="relative">
                                    <select v-model="modelValue.area_id"
                                        @change="emit('update-structure', { user: modelValue, field: 'area_id' })"
                                        class="w-full rounded-lg px-3 py-2 pr-7 text-[11px] font-medium outline-none border transition-all appearance-none cursor-pointer"
                                        :class="isDark
                                            ? 'bg-white/5 border-white/10 text-white focus:border-amber-500'
                                            : 'bg-white border-slate-200 text-slate-700 focus:border-amber-400'">
                                        <option :value="null">Sin área</option>
                                        <option v-for="a in areas" :key="a.id" :value="a.id"
                                            :class="isDark ? 'bg-slate-900' : 'bg-white'">{{ a.nombre }}</option>
                                    </select>
                                    <i
                                        class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] opacity-30 pointer-events-none"></i>
                                </div>
                            </div>

                            <div>
                                <label class="text-[9px] font-semibold uppercase tracking-wider opacity-40 block mb-1.5
                  flex items-center gap-1">
                                    <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block"></span> Segmento
                                </label>
                                <div class="relative">
                                    <select v-model="modelValue.segmento_id"
                                        @change="emit('update-structure', { user: modelValue, field: 'segmento_id' })"
                                        class="w-full rounded-lg px-3 py-2 pr-7 text-[11px] font-medium outline-none border transition-all appearance-none cursor-pointer"
                                        :class="isDark
                                            ? 'bg-white/5 border-white/10 text-white focus:border-emerald-500'
                                            : 'bg-white border-slate-200 text-slate-700 focus:border-emerald-400'">
                                        <option :value="null">Sin segmento</option>
                                        <option v-for="s in segmentos" :key="s.id" :value="s.id"
                                            :class="isDark ? 'bg-slate-900' : 'bg-white'">{{ s.nombre }}</option>
                                    </select>
                                    <i
                                        class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] opacity-30 pointer-events-none"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- DIVISOR -->
                    <div class="flex items-center gap-3">
                        <div class="h-px flex-1 bg-amber-500/10"></div>
                        <span class="text-[9px] font-semibold uppercase tracking-widest opacity-30">Módulos y
                            permisos</span>
                        <div class="h-px flex-1 bg-amber-500/10"></div>
                    </div>

                    <!-- PERMISOS -->
                    <div class="space-y-1.5">
                        <div v-for="slug in MODULOS" :key="slug"
                            class="flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all"
                            :class="isDark
                                ? 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                                : 'bg-white border-slate-200 hover:border-amber-300/50'">

                            <div class="flex items-center gap-3">
                                <div class="w-1 h-7 rounded-full transition-all"
                                    :class="hasPerm(slug) ? 'bg-amber-500' : isDark ? 'bg-white/10' : 'bg-slate-200'">
                                </div>
                                <div>
                                    <span class="text-[11px] font-semibold block"
                                        :class="isDark ? 'text-white' : 'text-slate-700'">
                                        {{ slug.split('.')[1] }}
                                        <span class="text-[9px] opacity-30 font-normal ml-1">({{ slug.split('.')[0]
                                            }})</span>
                                    </span>
                                    <span class="text-[9px] font-medium opacity-40">Acceso al módulo</span>
                                </div>
                            </div>

                            <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                <input type="checkbox" :checked="hasPerm(slug)"
                                    @change="emit('toggle-perm', { user: modelValue, slug })" class="sr-only peer">
                                <div class="w-9 h-5 rounded-full transition-all
                  bg-slate-300 peer-checked:bg-amber-500
                  after:content-[''] after:absolute after:top-[4px] after:left-[4px]
                  after:bg-white after:rounded-full after:h-3 after:w-3
                  after:transition-all peer-checked:after:translate-x-4" :class="isDark ? 'bg-white/10' : ''">
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- FOOTER -->
                <div class="p-5 border-t flex-shrink-0" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                    <button @click="emit('update:modelValue', null)"
                        class="w-full py-2.5 bg-amber-500 text-black text-[11px] font-bold uppercase tracking-wide rounded-xl hover:bg-amber-400 transition-all">
                        Finalizar cambios
                    </button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup>
const MODULOS = [
    'super.superadmin',
    'super.dashboard',
    'super.gestionarapk',
    'super.companias',
    'super.personal',
    'admin.admin',
    'admin.asistencias',
    'admin.mallas',
    'admin.novedades',
];

const props = defineProps({
    modelValue: Object,   // el usuario seleccionado (v-model)
    isDark: Boolean,
    areas: Array,
    segmentos: Array,
});

const emit = defineEmits([
    'update:modelValue',
    'toggle-perm',
    'update-structure',
]);

const hasPerm = (slug) => {
    if (!props.modelValue?.permisos) return false;
    return props.modelValue.permisos.some(p => p.modulos === slug);
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity .2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>