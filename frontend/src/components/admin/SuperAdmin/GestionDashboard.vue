<template>
    <div class="space-y-4 animate-fade-in">

        <!-- MÉTRICAS -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">

            <div class="rounded-xl border p-4 flex flex-col gap-2 transition-all"
                :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
                <div class="flex items-center justify-between">
                    <span class="text-[9px] font-semibold uppercase tracking-wider opacity-50"
                        :class="isDark ? 'text-white' : 'text-slate-500'">Total empleados</span>
                    <div class="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <i class="fas fa-users text-blue-400 text-[10px]"></i>
                    </div>
                </div>
                <div v-if="isLoading" class="h-7 w-16 rounded-lg animate-pulse"
                    :class="isDark ? 'bg-white/10' : 'bg-slate-200'"></div>
                <span v-else class="text-2xl font-bold" :class="isDark ? 'text-white' : 'text-slate-800'">{{
                    totalEmpleados }}</span>
                <span class="text-[10px] font-medium" :class="isDark ? 'text-white/30' : 'text-slate-400'">Registrados
                    en SQL</span>
            </div>

            <div class="rounded-xl border p-4 flex flex-col gap-2 transition-all"
                :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
                <div class="flex items-center justify-between">
                    <span class="text-[9px] font-semibold uppercase tracking-wider opacity-50"
                        :class="isDark ? 'text-white' : 'text-slate-500'">Empleados en Odoo</span>
                    <div class="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <i class="fas fa-cloud text-purple-400 text-[10px]"></i>
                    </div>
                </div>
                <div v-if="isLoading" class="h-7 w-16 rounded-lg animate-pulse"
                    :class="isDark ? 'bg-white/10' : 'bg-slate-200'"></div>
                <span v-else class="text-2xl font-bold" :class="isDark ? 'text-white' : 'text-slate-800'">{{ totalOdoo
                    }}</span>
                <span class="text-[10px] font-medium" :class="isDark ? 'text-white/30' : 'text-slate-400'">Fuente ERP
                    Odoo</span>
            </div>

            <div class="rounded-xl border p-4 flex flex-col gap-2 transition-all"
                :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
                <div class="flex items-center justify-between">
                    <span class="text-[9px] font-semibold uppercase tracking-wider opacity-50"
                        :class="isDark ? 'text-white' : 'text-slate-500'">Sedes activas</span>
                    <div class="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <i class="fas fa-building text-amber-400 text-[10px]"></i>
                    </div>
                </div>
                <div v-if="isLoading" class="h-7 w-16 rounded-lg animate-pulse"
                    :class="isDark ? 'bg-white/10' : 'bg-slate-200'"></div>
                <span v-else class="text-2xl font-bold" :class="isDark ? 'text-white' : 'text-slate-800'">{{
                    sedesActivas }}</span>
                <span class="text-[10px] font-medium" :class="isDark ? 'text-white/30' : 'text-slate-400'">Visibles en
                    login</span>
            </div>

            <div class="rounded-xl border p-4 flex flex-col gap-2 transition-all"
                :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
                <div class="flex items-center justify-between">
                    <span class="text-[9px] font-semibold uppercase tracking-wider opacity-50"
                        :class="isDark ? 'text-white' : 'text-slate-500'">Total sedes</span>
                    <div class="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <i class="fas fa-sitemap text-emerald-400 text-[10px]"></i>
                    </div>
                </div>
                <div v-if="isLoading" class="h-7 w-16 rounded-lg animate-pulse"
                    :class="isDark ? 'bg-white/10' : 'bg-slate-200'"></div>
                <span v-else class="text-2xl font-bold" :class="isDark ? 'text-white' : 'text-slate-800'">{{ totalSedes
                    }}</span>
                <span class="text-[10px] font-medium" :class="isDark ? 'text-white/30' : 'text-slate-400'">Registradas
                    en SQL</span>
            </div>

        </div>

        <!-- FILA 2: SYNC STATUS -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">

            <!-- ESTADO SINCRONIZACIÓN -->
            <div class="rounded-xl border p-4 flex flex-col gap-3 transition-all"
                :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-semibold uppercase tracking-wider"
                        :class="isDark ? 'text-white/50' : 'text-slate-400'">Estado sincronización</span>
                    <button @click="loadData"
                        class="w-6 h-6 rounded-lg border flex items-center justify-center transition-all"
                        :class="isDark ? 'border-white/10 text-white/30 hover:text-white hover:bg-white/5' : 'border-slate-200 text-slate-400 hover:bg-slate-50'">
                        <i class="fas fa-rotate text-[10px]" :class="isLoading ? 'fa-spin' : ''"></i>
                    </button>
                </div>

                <div class="flex flex-col gap-2">
                    <div class="flex items-center justify-between py-2 border-b"
                        :class="isDark ? 'border-white/5' : 'border-slate-100'">
                        <span class="text-[11px] font-medium"
                            :class="isDark ? 'text-white/60' : 'text-slate-500'">Empleados sincronizados</span>
                        <div v-if="isLoading" class="h-3 w-10 rounded animate-pulse"
                            :class="isDark ? 'bg-white/10' : 'bg-slate-200'"></div>
                        <span v-else class="text-[11px] font-semibold"
                            :class="syncDiff === 0 ? 'text-emerald-400' : 'text-amber-400'">
                            {{ syncDiff === 0 ? 'Al día' : syncDiff + ' pendientes' }}
                        </span>
                    </div>

                    <div class="flex items-center justify-between py-2 border-b"
                        :class="isDark ? 'border-white/5' : 'border-slate-100'">
                        <span class="text-[11px] font-medium" :class="isDark ? 'text-white/60' : 'text-slate-500'">Sedes
                            en Odoo</span>
                        <div v-if="isLoading" class="h-3 w-10 rounded animate-pulse"
                            :class="isDark ? 'bg-white/10' : 'bg-slate-200'"></div>
                        <span v-else class="text-[11px] font-semibold text-blue-400">
                            {{ totalSedesOdoo }}
                        </span>
                    </div>

                    <div class="flex items-center justify-between py-2">
                        <span class="text-[11px] font-medium"
                            :class="isDark ? 'text-white/60' : 'text-slate-500'">Empleados activos</span>
                        <div v-if="isLoading" class="h-3 w-10 rounded animate-pulse"
                            :class="isDark ? 'bg-white/10' : 'bg-slate-200'"></div>
                        <span v-else class="text-[11px] font-semibold text-emerald-400">
                            {{ empleadosActivos }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- DISTRIBUCIÓN SEDES -->
            <div class="rounded-xl border p-4 flex flex-col gap-3 transition-all"
                :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
                <span class="text-[10px] font-semibold uppercase tracking-wider"
                    :class="isDark ? 'text-white/50' : 'text-slate-400'">Distribución por sede</span>

                <div class="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                    <template v-if="isLoading">
                        <div v-for="i in 4" :key="i" class="flex items-center gap-2">
                            <div class="h-3 rounded animate-pulse flex-1"
                                :class="isDark ? 'bg-white/10' : 'bg-slate-200'"></div>
                            <div class="h-3 w-8 rounded animate-pulse" :class="isDark ? 'bg-white/5' : 'bg-slate-100'">
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <div v-for="sede in sedesDistribucion" :key="sede.name" class="flex items-center gap-2">
                            <span class="text-[10px] font-medium truncate flex-1"
                                :class="isDark ? 'text-white/60' : 'text-slate-500'">{{ sede.name }}</span>
                            <div class="flex items-center gap-1.5">
                                <div class="h-1.5 rounded-full bg-amber-500/20 overflow-hidden" style="width:60px">
                                    <div class="h-full bg-amber-500 rounded-full transition-all"
                                        :style="{ width: sede.pct + '%' }"></div>
                                </div>
                                <span class="text-[10px] font-semibold text-amber-400 w-6 text-right">
                                    {{ sede.count }}
                                </span>
                            </div>
                        </div>
                        <div v-if="!sedesDistribucion.length" class="text-center py-4 text-[11px] opacity-30">Sin datos
                        </div>
                    </template>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUsuariosSync } from '../../../composables/adminLogica/useUsuariosSync.js';
import { useCompanies } from '../../../composables/adminLogica/useCompanies.js';

const props = defineProps({ isDark: Boolean });

const { dbUsuarios, odooUsuarios, fetchDbUsuarios, fetchOdooUsuarios } = useUsuariosSync();
const { dbCompanies, odooCompanies, fetchDbCompanies, fetchOdooRaw } = useCompanies();

const isLoading = ref(true);

// MÉTRICAS COMPUTADAS
const totalEmpleados = computed(() => dbUsuarios.value?.length ?? 0);
const totalOdoo = computed(() => odooUsuarios.value?.length ?? 0);
const sedesActivas = computed(() => dbCompanies.value?.filter(c => c.is_active).length ?? 0);
const totalSedes = computed(() => dbCompanies.value?.length ?? 0);
const totalSedesOdoo = computed(() => odooCompanies.value?.length ?? 0);
const empleadosActivos = computed(() => dbUsuarios.value?.filter(u => u.is_active).length ?? 0);
const syncDiff = computed(() => Math.abs(totalOdoo.value - totalEmpleados.value));

const sedesDistribucion = computed(() => {
    if (!dbUsuarios.value?.length || !dbCompanies.value?.length) return [];
    const max = Math.max(...dbCompanies.value.map(s => {
        return dbUsuarios.value.filter(u =>
            u.sede?.toLowerCase() === s.name?.toLowerCase()
        ).length;
    }), 1);
    return dbCompanies.value
        .filter(s => s.is_active)
        .map(s => {
            const count = dbUsuarios.value.filter(u =>
                u.sede?.toLowerCase() === s.name?.toLowerCase()
            ).length;
            return { name: s.name, count, pct: Math.round((count / max) * 100) };
        })
        .filter(s => s.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
});

const loadData = async () => {
    isLoading.value = true;
    try {
        await Promise.all([
            fetchDbUsuarios(),
            fetchOdooUsuarios(),
            fetchDbCompanies(),
            fetchOdooRaw(),
        ]);
    } finally {
        isLoading.value = false;
    }
};

onMounted(loadData);
</script>