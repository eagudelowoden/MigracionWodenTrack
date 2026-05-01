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
                    <div class="flex items-center gap-1.5 mt-0.5">
                        <i :class="modoIcon" class="text-[8px] text-[#FF8F00]"></i>
                        <p class="text-[8px] font-bold opacity-50 uppercase tracking-[0.2em]"
                            :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ modoLabel }}</p>
                    </div>
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
                                Descripción</th>
                            <th
                                class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                                Capital Humano</th>
                            <th
                                class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                                Motivo Capital Humano
                            </th>
                            <th
                                class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                                Motivo Jefe Directo
                            </th>
                            <th
                                class="px-4 py-2.5 text-right text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">
                                Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, idx) in pendientes" :key="item.id" :class="[idx % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-transparent',
                        isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-orange-50']">

                            <!-- Colaborador -->
                            <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                <div class="flex items-center gap-2">
                                    <div
                                        class="w-7 h-7 rounded-lg bg-[#FF8F00]/10 flex items-center justify-center text-[10px] font-black text-[#FF8F00] shrink-0">
                                        {{ item.nombre?.charAt(0) ?? '?' }}
                                    </div>
                                    <div>
                                        <p class="text-[10px] font-black uppercase"
                                            :class="isDark ? 'text-white' : 'text-slate-800'">{{ item.nombre }}</p>
                                        <p class="text-[11px] opacity-50">CC: {{ item.cedula }}</p>
                                    </div>
                                </div>
                            </td>

                            <!-- Fechas -->
                            <td class="px-4 py-2.5 text-center border-b"
                                :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                <span class="text-[11px] font-bold"
                                    :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{
                                        formatFecha(item.fechaInicio) }}</span>
                            </td>
                            <td class="px-4 py-2.5 text-center border-b"
                                :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                <span class="text-[11px] font-bold"
                                    :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ formatFecha(item.fechaFin)
                                    }}</span>
                            </td>

                            <!-- Descripción -->
                            <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                <p class="text-[12px] font-medium line-clamp-1 max-w-[180px]"
                                    :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ item.descripcion }}</p>
                            </td>



                            <!-- Estado RRHH -->
                            <td class="px-4 py-2.5 text-center border-b"
                                :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                <span v-if="item.aprobadoRrhh === 1"
                                    class="px-2 py-0.5 rounded-md text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <i class="fas fa-check mr-1"></i>Aprobado
                                </span>
                                <span v-else-if="item.aprobadoRrhh === 0"
                                    class="px-2 py-0.5 rounded-md text-[8px] font-black uppercase bg-red-500/10 text-red-400 border border-red-500/20">
                                    <i class="fas fa-xmark mr-1"></i>Rechazado
                                </span>
                                <span v-else
                                    class="px-2 py-0.5 rounded-md text-[8px] font-black uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                    <i class="fas fa-clock mr-1"></i>Pendiente
                                </span>
                            </td>
                            <td class="px-4 py-2.5 text-center border-b"
                                :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                <span v-if="item.motivoRrhh" @click="verMotivo(item.motivoRrhh)"
                                    class="cursor-pointer text-[11px] font-bold text-[#FF8F00] hover:underline">
                                    <i class="fas fa-comment-alt mr-1"></i>Ver
                                </span>
                                <span v-else class="text-[11px] opacity-30">—</span>
                            </td>

                            <td class="px-4 py-2.5 text-center border-b"
                                :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                <span v-if="item.motivoJefe" @click="verMotivos(item.motivoJefe)"
                                    class="cursor-pointer text-[12px] font-bold text-[#FF8F00] hover:underline">
                                    <i class="fas fa-comment-alt mr-1"></i>Ver
                                </span>
                                <span v-else class="text-[11px] opacity-30">—</span>
                            </td>

                            <!-- Acciones -->
                            <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                <div class="flex items-center justify-end">
                                    <button @click.stop="toggleMenu($event, item.id)"
                                        class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95"
                                        :class="isDark ? 'bg-[#273045] border-[#2d3548] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'">
                                        <i class="fas fa-ellipsis-vertical text-[10px]"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Footer -->
            <div class="px-4 py-1.5 border-t shrink-0"
                :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-100 bg-slate-50'">
                <p class="text-[9px] font-black uppercase tracking-widest"
                    :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                    Pendientes: <span class="text-[#FF8F00]">{{ pendientes.length }}</span>
                </p>
            </div>
        </div>

        <!-- Modal soporte -->
        <teleport to="body">
            <div v-if="soporteModal.open"
                class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                @mousedown.self="soporteModal.open = false">
                <div class="w-full max-w-2xl h-[70vh] rounded-2xl border flex flex-col overflow-hidden shadow-2xl"
                    :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">
                    <div class="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
                        :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                        <span class="text-[11px] font-black uppercase tracking-widest"
                            :class="isDark ? 'text-white' : 'text-slate-700'">
                            <i class="fas fa-eye text-[#FF8F00] mr-2"></i>Soporte
                        </span>
                        <button @click="soporteModal.open = false"
                            class="w-7 h-7 rounded-lg flex items-center justify-center border"
                            :class="isDark ? 'bg-[#273045] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-500 border-slate-200'">
                            <i class="fas fa-xmark text-xs"></i>
                        </button>
                    </div>
                    <div class="flex-1 overflow-hidden flex items-center justify-center p-2"
                        :class="isDark ? 'bg-[#151c2c]' : 'bg-slate-50'">
                        <div v-if="soporteModal.loading" class="flex items-center gap-2 opacity-50">
                            <i class="fas fa-circle-notch fa-spin text-[#FF8F00]"></i>
                            <span class="text-[11px] font-black uppercase">Cargando...</span>
                        </div>
                        <img v-else-if="soporteModal.isImage" :src="soporteModal.url"
                            class="max-w-full max-h-full object-contain rounded-lg shadow-xl" />
                        <iframe v-else-if="soporteModal.isPdf" :src="soporteModal.url"
                            class="w-full h-full rounded-lg border-0" />
                        <div v-else class="flex flex-col items-center gap-3 opacity-60">
                            <i class="fas fa-file text-4xl text-slate-400"></i>
                            <p class="text-[10px]">Vista previa no disponible</p>
                        </div>
                    </div>
                </div>
            </div>
        </teleport>

        <teleport to="body">
            <div v-if="motivoModalRRHH.open"
                class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                @mousedown.self="motivoModalRRHH.open = false">
                <div class="w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl"
                    :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-comment-alt text-[#FF8F00]"></i>
                        <div class="flex items-center gap-2">
                            <h3 class="text-sm font-black uppercase tracking-widest"
                                :class="isDark ? 'text-white' : 'text-slate-800'">
                                Motivo Jefe Directo
                            </h3>
                        </div>
                    </div>
                    <p class="text-[15px] font-medium leading-relaxed"
                        :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                        {{ motivoModalRRHH.texto }}
                    </p>
                    <button @click="motivoModalRRHH.open = false"
                        class="py-2 rounded-lg text-[10px] font-black uppercase italic border"
                        :class="isDark ? 'border-[#2d3548] text-slate-400' : 'border-slate-200 text-slate-500'">
                        Cerrar
                    </button>
                </div>
            </div>
        </teleport>

        <teleport to="body">
            <div v-if="menuAbierto !== null" class="fixed inset-0 z-40" @click="menuAbierto = null"></div>

            <transition name="fade-msg">
                <div v-if="menuAbierto !== null" class="fixed z-50 w-44 rounded-xl border shadow-2xl overflow-hidden"
                    :style="{ top: menuPos.y + 'px', left: menuPos.x + 'px' }"
                    :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

                    <!-- Ver soporte -->
                    <button @click="verSoporte(itemMenuActual); menuAbierto = null"
                        class="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase italic tracking-widest transition-all hover:bg-[#FF8F00]/10"
                        :class="isDark ? 'text-slate-300' : 'text-slate-700'">
                        <i class="fas fa-eye text-[#FF8F00] w-3"></i> Ver soporte
                    </button>

                    <div class="border-t mx-2" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'"></div>

                    <!-- Aprobar -->
                    <button @click="abrirAccion(itemMenuActual, 1); menuAbierto = null"
                        class="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase italic tracking-widest transition-all hover:bg-emerald-500/10"
                        :class="isDark ? 'text-emerald-400' : 'text-emerald-600'">
                        <i class="fas fa-check w-3"></i> Aprobar
                    </button>

                    <!-- Rechazar -->
                    <button @click="abrirAccion(itemMenuActual, 0); menuAbierto = null"
                        class="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase italic tracking-widest transition-all hover:bg-red-500/10"
                        :class="isDark ? 'text-red-400' : 'text-red-500'">
                        <i class="fas fa-xmark w-3"></i> Rechazar
                    </button>

                </div>
            </transition>
        </teleport>

        <teleport to="body">
            <div v-if="motivoModal.open"
                class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                @mousedown.self="motivoModal.open = false">
                <div class="w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl"
                    :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-comment-alt text-[#FF8F00]"></i>
                        <h3 class="text-sm font-black uppercase tracking-widest"
                            :class="isDark ? 'text-white' : 'text-slate-800'">
                            Motivo Capital Humano
                        </h3>
                    </div>
                    <p class="text-[15px] font-medium leading-relaxed"
                        :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                        {{ motivoModal.texto }}
                    </p>
                    <button @click="motivoModal.open = false"
                        class="py-2 rounded-lg text-[10px] font-black uppercase italic border"
                        :class="isDark ? 'border-[#2d3548] text-slate-400' : 'border-slate-200 text-slate-500'">
                        Cerrar
                    </button>
                </div>
            </div>
        </teleport>

        <!-- Modal aprobar/rechazar -->
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
                            class="px-3 py-2.5 rounded-lg border text-xs font-medium outline-none resize-none placeholder:text-slate-500"
                            :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white' : 'bg-white border-slate-200 text-slate-800'">
                        </textarea>
                    </div>
                    <div class="flex gap-2 pt-1">
                        <button type="button" @click="accionModal.open = false"
                            class="flex-1 py-2 rounded-lg text-[10px] font-black uppercase italic border"
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
import axios from 'axios';

const props = defineProps({ isDark: Boolean });
const emit = defineEmits(['volver']);

const { novedades, loading, aprobarJefe, getFileUrl, fetchPorArea, fetchPorDepartamentos } = useNovedades();

const API_URL = import.meta.env.VITE_API_URL;
const session = JSON.parse(localStorage.getItem('user_session') || '{}');
const miIdOdoo = session?.id_odoo;

// ─── Nivel de acceso ──────────────────────────────────────────────────────
const esDirector = session?.isSuperAdmin ||
    session?.permisos?.['novedades.director'] === true;
const esJefeArea = !esDirector &&
    session?.permisos?.['novedades.ver_area'] === true;

// Etiqueta del modo activo
const modoLabel = esDirector ? 'Director — Todo el departamento' : 'Jefe — Mi área';
const modoIcon  = esDirector ? 'fas fa-building' : 'fas fa-users';

const verMotivos = (motivojefe) => {
    motivoModalRRHH.value = { open: true, texto: motivojefe };
};

const motivoModalRRHH = ref({ open: false, texto: '', titulo: '' });

const menuAbierto = ref(null);
const itemMenuActual = ref(null);
const menuPos = ref({ x: 0, y: 0 });

const toggleMenu = (event, id) => {
    if (menuAbierto.value === id) {
        menuAbierto.value = null;
        return;
    }
    const btn = event.currentTarget.getBoundingClientRect();
    menuPos.value = {
        x: btn.right - 176,
        y: btn.bottom + 6,
    };
    itemMenuActual.value = pendientes.value.find(n => n.id === id);
    menuAbierto.value = id;
};

onMounted(async () => {
    if (esDirector) {
        try {
            const res = await axios.get(`${API_URL}/departamentos-permitidos/${miIdOdoo}`);
            const deptos = Array.isArray(res.data) ? res.data : [];
            await fetchPorDepartamentos(deptos);
        } catch {
            await fetchPorArea(miIdOdoo);
        }
    } else {
        await fetchPorArea(miIdOdoo);
    }
});

const pendientes = computed(() =>
    novedades.value.filter(n =>
        n.aprobadoJefe === null || n.aprobadoJefe === undefined
    )
);

const formatFecha = (f) => {
    if (!f) return '—';
    return new Date(f + 'T00:00:00').toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

// ─── Modal soporte ────────────────────────────────────
const soporteModal = ref({ open: false, url: '', isImage: false, isPdf: false, loading: false });

const verSoporte = (novedad) => {
    const url = getFileUrl(novedad.id);
    const mime = novedad.soporteMime ?? '';
    soporteModal.value = {
        open: true,
        url,
        isImage: mime.startsWith('image/'),
        isPdf: mime === 'application/pdf',
        loading: false,
    };
};

const motivoModal = ref({ open: false, texto: '' });

const verMotivo = (motivo) => {
    motivoModal.value = { open: true, texto: motivo };
};

// ─── Modal aprobar/rechazar ───────────────────────────
const accionModal = ref({ open: false, tipo: 1, id: null, nombre: '', motivo: '' });

const abrirAccion = (item, tipo) => {
    accionModal.value = { open: true, tipo, id: item.id, nombre: item.nombre, motivo: '' };
};

const confirmarAccion = async () => {
    if (!accionModal.value.motivo.trim()) return;
    try {
        await aprobarJefe(accionModal.value.id, accionModal.value.tipo, accionModal.value.motivo);
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