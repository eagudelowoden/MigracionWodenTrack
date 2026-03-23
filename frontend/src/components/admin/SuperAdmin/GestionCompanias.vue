<template>
    <div class="space-y-3 animate-fade-in">

        <!-- HEADER BAR -->
        <div class="flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all"
            :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
            <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <i class="fas fa-building text-amber-500 text-xs"></i>
                </div>
                <div>
                    <h2 class="text-[11px] font-semibold uppercase tracking-wider"
                        :class="isDark ? 'text-white' : 'text-slate-700'">Sincronización de sedes</h2>
                    <p class="text-[9px] font-medium opacity-40 uppercase tracking-wide"
                        :class="isDark ? 'text-white' : 'text-slate-500'">Odoo ERP → SQL Server local</p>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <!-- BARRA DE PROGRESO -->
                <div v-if="isSyncingCompanies" class="w-24 h-1 bg-slate-500/10 rounded-full overflow-hidden">
                    <div class="h-full bg-amber-500 transition-all duration-300" :style="{ width: syncProgress + '%' }">
                    </div>
                </div>

                <!-- REFRESCAR -->
                <button @click="handleRefresh" :disabled="isRefreshing"
                    class="w-7 h-7 rounded-lg border flex items-center justify-center transition-all" :class="isDark
                        ? 'border-white/10 text-white/40 hover:bg-white/5 hover:text-white'
                        : 'border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600'" title="Refrescar datos">
                    <i class="fas fa-rotate text-[11px]" :class="isRefreshing ? 'fa-spin' : ''"></i>
                </button>

                <!-- SINCRONIZAR -->
                <button @click="handleSync" :disabled="isSyncingCompanies"
                    class="h-8 px-4 rounded-lg bg-amber-500 text-black text-[10px] font-bold uppercase tracking-wide hover:bg-amber-400 disabled:opacity-30 transition-all flex items-center gap-2">
                    <i class="fas text-[10px]"
                        :class="isSyncingCompanies ? 'fa-circle-notch fa-spin' : 'fa-sync-alt'"></i>
                    {{ isSyncingCompanies ? syncProgress + '%' : 'Sincronizar' }}
                </button>
            </div>
        </div>

        <!-- GRID TABLAS -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">

            <!-- ODOO -->
            <div class="rounded-xl border overflow-hidden transition-all"
                :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
                <div class="px-3 py-2 border-b flex items-center justify-between"
                    :class="isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'">
                    <span class="text-[9px] font-semibold uppercase tracking-wider opacity-50"
                        :class="isDark ? 'text-white' : 'text-slate-600'">Origen · Odoo</span>
                    <span class="text-[9px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        {{ odooCompanies.length }} sedes
                    </span>
                </div>
                <div class="max-h-[320px] overflow-y-auto custom-scroll">
                    <table class="w-full">
                        <tbody>
                            <tr v-for="c in odooCompanies" :key="c.id" class="border-b transition-all"
                                :class="isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'">
                                <td class="px-3 py-2 font-mono text-[9px] text-blue-400/60 w-10">#{{ c.id }}</td>
                                <td class="px-3 py-2 text-[11px] font-medium"
                                    :class="isDark ? 'text-white' : 'text-slate-700'">{{ c.name }}</td>
                                <td class="px-3 py-2 text-right w-8">
                                    <i v-if="dbCompanies.some(db => db.id === c.id)"
                                        class="fas fa-check text-emerald-400 text-[10px]"></i>
                                </td>
                            </tr>
                            <tr v-if="!odooCompanies.length">
                                <td colspan="3" class="px-3 py-6 text-center text-[11px] opacity-30">Sin datos</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- SQL SERVER LOCAL -->
            <div class="rounded-xl border overflow-hidden transition-all"
                :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
                <div class="px-3 py-2 border-b flex items-center justify-between"
                    :class="isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'">
                    <span class="text-[9px] font-semibold uppercase tracking-wider opacity-50"
                        :class="isDark ? 'text-white' : 'text-slate-600'">Destino · SQL Server</span>
                    <span class="text-[9px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        {{dbCompanies.filter(c => c.is_active).length}} activas
                    </span>
                </div>
                <div class="max-h-[320px] overflow-y-auto custom-scroll">
                    <table class="w-full">
                        <tbody>
                            <tr v-for="comp in dbCompanies" :key="comp.id" class="border-b transition-all" :class="[
                                isDark ? 'border-white/5' : 'border-slate-100',
                                !comp.is_active ? 'opacity-40' : isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                            ]">
                                <td class="px-3 py-2">
                                    <div class="text-[11px] font-medium"
                                        :class="isDark ? 'text-white' : 'text-slate-700'">{{ comp.name }}</div>
                                    <div class="text-[9px] font-semibold mt-0.5"
                                        :class="comp.is_active ? 'text-emerald-400' : 'text-red-400'">
                                        {{ comp.is_active ? 'Visible' : 'Oculto' }}
                                    </div>
                                </td>
                                <td class="px-3 py-2 text-right">
                                    <button @click="handleToggle(comp.id, comp.is_active)"
                                        class="h-6 px-3 rounded-lg border text-[9px] font-semibold uppercase tracking-wide transition-all"
                                        :class="comp.is_active
                                            ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'
                                            : 'border-slate-500/20 text-slate-400 hover:bg-slate-500 hover:text-white hover:border-slate-500'">
                                        {{ comp.is_active ? 'ON' : 'OFF' }}
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="!dbCompanies.length">
                                <td colspan="2" class="px-3 py-6 text-center text-[11px] opacity-30">Sin datos locales
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useCompanies } from '../../../composables/adminLogica/useCompanies.js';

const props = defineProps({
    isDark: Boolean,
});

const emit = defineEmits(['success', 'error']);

const {
    dbCompanies, odooCompanies,
    isSyncing: isSyncingCompanies,
    fetchDbCompanies, fetchOdooRaw,
    syncCompanies, toggleCompanyStatus
} = useCompanies();

const syncProgress = ref(0);
const isRefreshing = ref(false);

const handleRefresh = async () => {
    isRefreshing.value = true;
    try {
        await Promise.all([fetchDbCompanies(), fetchOdooRaw()]);
        emit('success', 'Datos actualizados');
    } catch (e) {
        emit('error', 'Error al refrescar');
    } finally {
        isRefreshing.value = false;
    }
};

const handleSync = async () => {
    syncProgress.value = 5;
    const timer = setInterval(() => {
        if (syncProgress.value < 85) syncProgress.value += 2;
    }, 100);
    try {
        const res = await syncCompanies();
        syncProgress.value = 100;
        emit('success', res.message);
        await fetchDbCompanies();
    } catch (e) {
        emit('error', 'Error en la sincronización');
    } finally {
        clearInterval(timer);
        setTimeout(() => { syncProgress.value = 0; }, 1000);
    }
};

const handleToggle = async (id, currentStatus) => {
    try {
        await toggleCompanyStatus(id, currentStatus);
        emit('success', 'Estado actualizado');
        await fetchDbCompanies();
    } catch (e) {
        emit('error', 'Error al cambiar estado');
    }
};

onMounted(() => Promise.all([fetchDbCompanies(), fetchOdooRaw()]));
</script>