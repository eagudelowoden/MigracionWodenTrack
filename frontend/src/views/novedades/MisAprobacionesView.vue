<template>
    <div class="w-full h-full animate-fade-in flex flex-col gap-2">

        <!-- Header -->
        <div class="flex items-center justify-between p-1.5 px-3 rounded-2xl border shrink-0 shadow-sm"
            :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">
            <div class="flex items-center gap-2 ml-1">
                <div class="w-7 h-7 flex items-center justify-center rounded-xl bg-[#FF8F00] text-white shadow-sm">
                    <i class="fas fa-clock text-xs"></i>
                </div>
                <div>
                    <h2 class="text-base font-black uppercase tracking-tighter"
                        :class="isDark ? 'text-white' : 'text-slate-800'">
                        Por <span class="text-[#FF8F00]">Aprobar</span>
                    </h2>
                    <p class="text-[8px] font-bold opacity-50 uppercase tracking-[0.2em]"
                        :class="isDark ? 'text-slate-400' : 'text-slate-500'">Novedades pendientes de mi personal</p>
                </div>
            </div>

            <button @click="$emit('volver')"
                class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-black uppercase italic tracking-widest border transition-all hover:scale-105"
                :class="isDark ? 'bg-[#273045] border-[#2d3548] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'">
                <i class="fas fa-arrow-left text-[9px]"></i> Volver
            </button>
        </div>

        <!-- Contenido -->
        <div class="flex-1 flex flex-col overflow-hidden rounded-2xl border"
            :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

            <div v-if="loading" class="flex-1 flex items-center justify-center gap-2">
                <i class="fas fa-circle-notch fa-spin text-[#FF8F00]"></i>
                <span class="text-[11px] font-black uppercase tracking-widest opacity-50"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cargando...</span>
            </div>

            <div v-else-if="pendientes.length === 0" class="flex-1 flex items-center justify-center">
                <div class="flex flex-col items-center gap-2 opacity-40">
                    <i class="fas fa-check-circle text-3xl text-emerald-500"></i>
                    <p class="text-[11px] font-black uppercase tracking-widest"
                        :class="isDark ? 'text-slate-400' : 'text-slate-500'">Sin novedades pendientes</p>
                </div>
            </div>

            <div v-else class="flex-1 overflow-y-auto">
                <table class="w-full border-separate border-spacing-0">
                    <thead class="sticky top-0 z-10">
                        <tr class="bg-[#334155]">
                            <th
                                class="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                                Colaborador</th>
                            <th
                                class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                                Inicio</th>
                            <th
                                class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                                Fin</th>
                            <th
                                class="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                                Tipificación</th>
                            <th
                                class="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                                Descripción</th>
                            <th
                                class="px-4 py-2.5 text-right text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                                Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, idx) in pendientes" :key="item.id" :class="[idx % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-transparent',
                        isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-orange-50']">

                            <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                <div class="flex items-center gap-2">
                                    <div
                                        class="w-7 h-7 rounded-lg bg-[#FF8F00]/10 flex items-center justify-center text-[10px] font-black text-[#FF8F00] shrink-0">
                                        {{ item.nombre?.charAt(0) ?? '?' }}
                                    </div>
                                    <div>
                                        <p class="text-[10px] font-black uppercase"
                                            :class="isDark ? 'text-white' : 'text-slate-800'">{{ item.nombre }}</p>
                                        <p class="text-[9px] opacity-50">CC: {{ item.cedula }}</p>
                                    </div>
                                </div>
                            </td>

                            <td class="px-4 py-2.5 text-center border-b"
                                :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                <span class="text-[9px] font-bold"
                                    :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                                    {{ formatFecha(item.fechaInicio) }}
                                </span>
                            </td>

                            <td class="px-4 py-2.5 text-center border-b"
                                :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                <span class="text-[9px] font-bold"
                                    :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                                    {{ formatFecha(item.fechaFin) }}
                                </span>
                            </td>

                            <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                <span class="text-[9px] font-medium"
                                    :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                                    {{ item.tipificacion || '—' }}
                                </span>
                            </td>

                            <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                <p class="text-[9px] font-medium line-clamp-1 max-w-[180px]"
                                    :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ item.descripcion }}</p>
                            </td>

                            <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                <div class="flex items-center justify-end gap-1.5">
                                    <button @click="abrirAccion(item, 1)"
                                        class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase italic tracking-widest transition-all hover:scale-105 active:scale-95"
                                        :class="isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'">
                                        <i class="fas fa-check text-[9px]"></i> Aprobar
                                    </button>
                                    <button @click="abrirAccion(item, 0)"
                                        class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase italic tracking-widest transition-all hover:scale-105 active:scale-95"
                                        :class="isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white'">
                                        <i class="fas fa-xmark text-[9px]"></i> Rechazar
                                    </button>
                                </div>
                            </td>

                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Footer -->
            <div class="px-4 py-1.5 border-t shrink-0 flex items-center justify-between"
                :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-100 bg-slate-50'">
                <p class="text-[9px] font-black uppercase tracking-widest"
                    :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                    Pendientes: <span :class="isDark ? 'text-[#FF8F00]' : 'text-[#FF8F00]'">{{ pendientes.length
                        }}</span>
                </p>
            </div>
        </div>

        <!-- Modal motivo -->
        <teleport to="body">
            <div v-if="accionModal.open"
                class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                @mousedown.self="accionModal.open = false">
                <div class="w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl"
                    :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

                    <div class="flex items-center gap-2">
                        <i :class="accionModal.tipo === 1 ? 'fas fa-check-circle text-emerald-500' : 'fas fa-times-circle text-red-400'"
                            class="text-lg"></i>
                        <h3 class="text-sm font-black uppercase tracking-widest"
                            :class="isDark ? 'text-white' : 'text-slate-800'">
                            {{ accionModal.tipo === 1 ? 'Aprobar' : 'Rechazar' }} novedad
                        </h3>
                    </div>

                    <p class="text-[10px] font-bold opacity-60" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                        {{ accionModal.nombre }}
                    </p>

                    <div class="flex flex-col gap-1.5">
                        <label class="text-[9px] font-black uppercase tracking-widest"
                            :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                            Motivo <span class="text-red-400">*</span>
                        </label>
                        <textarea v-model="accionModal.motivo" rows="3"
                            :placeholder="accionModal.tipo === 1 ? 'Motivo de aprobación...' : 'Motivo de rechazo...'"
                            class="px-3 py-2.5 rounded-lg border text-xs font-medium outline-none resize-none transition-all placeholder:text-slate-500"
                            :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white' : 'bg-white border-slate-200 text-slate-800'">
            </textarea>
                    </div>

                    <div class="flex gap-2 pt-1">
                        <button type="button" @click="accionModal.open = false"
                            class="flex-1 py-2 rounded-lg text-[10px] font-black uppercase italic border transition-all"
                            :class="isDark ? 'border-[#2d3548] text-slate-400' : 'border-slate-200 text-slate-500'">
                            Cancelar
                        </button>
                        <button type="button" @click="confirmarAccion" :disabled="!accionModal.motivo.trim()"
                            class="flex-1 py-2 rounded-lg text-[10px] font-black uppercase italic transition-all disabled:opacity-40"
                            :class="accionModal.tipo === 1 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'">
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        </teleport>

    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNovedades } from '../../composables/adminLogica/useNovedades';

const props = defineProps({ isDark: Boolean });
const emit = defineEmits(['volver']);

const { novedades, loading, fetchNovedades, aprobarNovedad } = useNovedades();

onMounted(() => fetchNovedades());

// Solo las pendientes (aprobado === null)
const pendientes = computed(() =>
    novedades.value.filter(n => n.aprobado === null || n.aprobado === undefined)
);

const formatFecha = (f) => {
    if (!f) return '—';
    return new Date(f + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const accionModal = ref({ open: false, tipo: 1, id: null, nombre: '', motivo: '' });

const abrirAccion = (item, tipo) => {
    accionModal.value = { open: true, tipo, id: item.id, nombre: item.nombre, motivo: '' };
};

const confirmarAccion = async () => {
    if (!accionModal.value.motivo.trim()) return;
    try {
        await aprobarNovedad(accionModal.value.id, accionModal.value.tipo, accionModal.value.motivo);
        accionModal.value.open = false;
    } catch (e) {
        console.error('Error:', e);
    }
};
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(8px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>