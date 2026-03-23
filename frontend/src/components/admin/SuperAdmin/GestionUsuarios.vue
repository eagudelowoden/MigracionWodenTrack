<template>
    <div class="space-y-3 animate-fade-in">

        <!-- HEADER BAR -->
        <div class="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-all"
            :class="isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'">

            <div class="flex items-center gap-2">
                <div class="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-users-cog text-black text-[10px]"></i>
                </div>
                <div>
                    <h2 class="text-[10px] font-semibold uppercase tracking-wider text-amber-500">Gestión de personal
                    </h2>
                    <p class="text-[9px] font-medium opacity-40 uppercase tracking-wide"
                        :class="isDark ? 'text-white' : 'text-slate-500'">Odoo ERP vs SQL Server</p>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-1 flex-1 justify-end">

                <!-- BUSCAR -->
                <input v-model="searchUser" type="text" placeholder="Buscar usuario..."
                    class="bg-transparent border-b outline-none text-[12px] font-medium transition-all py-1 min-w-[110px]"
                    :class="isDark
                        ? 'border-white/10 text-white placeholder:text-white/30 focus:border-amber-500'
                        : 'border-slate-200 text-slate-700 placeholder:text-slate-300 focus:border-amber-500'" />

                <!-- PAÍS -->
                <select v-model="selectedCountry"
                    class="bg-transparent border-b outline-none text-[11px] font-semibold uppercase cursor-pointer py-1 text-blue-400 transition-all"
                    :class="isDark ? 'border-white/10' : 'border-slate-200'">
                    <option value="TODOS" :class="isDark ? 'bg-slate-900' : 'bg-white'">País: Todos</option>
                    <option v-for="c in odooCompanies" :key="c.id" :value="c.name"
                        :class="isDark ? 'bg-slate-900' : 'bg-white'">{{ c.name }}</option>
                </select>

                <!-- DEPARTAMENTO -->
                <select v-model="selectedDept"
                    class="bg-transparent border-b outline-none text-[11px] font-semibold uppercase cursor-pointer py-1 text-amber-500 transition-all"
                    :class="isDark ? 'border-white/10' : 'border-slate-200'">
                    <option value="TODOS" :class="isDark ? 'bg-slate-900' : 'bg-white'">Dpto: Todos</option>
                    <option v-for="d in departamentosUnicos" :key="d" :value="d"
                        :class="isDark ? 'bg-slate-900' : 'bg-white'">{{ d }}</option>
                </select>

                <!-- REFRESCAR -->
                <button @click="handleRefresh" :disabled="isRefreshing"
                    class="w-7 h-7 rounded-lg border flex items-center justify-center transition-all flex-shrink-0"
                    :class="isDark
                        ? 'border-white/10 text-white/40 hover:bg-white/5 hover:text-white'
                        : 'border-slate-200 text-slate-400 hover:bg-slate-50'">
                    <i class="fas fa-rotate text-[11px]" :class="isRefreshing ? 'fa-spin' : ''"></i>
                </button>

                <!-- SINCRONIZAR -->
                <div class="flex items-center gap-1">
                    <button @click="handleSync" :disabled="isSyncingUsers"
                        class="h-7 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all flex items-center gap-1.5"
                        :class="isSyncingUsers
                            ? 'bg-slate-100 text-slate-400'
                            : 'bg-amber-500 text-black hover:bg-amber-400'">
                        <i class="fas text-[10px]"
                            :class="isSyncingUsers ? 'fa-circle-notch fa-spin' : 'fa-sync-alt'"></i>
                        {{ isSyncingUsers ? progressPercent + '%' : 'Sincronizar' }}
                    </button>
                    <button v-if="isSyncingUsers" @click="handleCancel"
                        class="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-all">
                        <i class="fas fa-stop text-[10px]"></i>
                    </button>
                </div>

            </div>

            <!-- BARRA PROGRESO -->
            <div v-if="isSyncingUsers" class="w-full h-0.5 bg-slate-500/10 rounded-full overflow-hidden">
                <div class="h-full bg-amber-500 transition-all duration-500" :style="{ width: progressPercent + '%' }">
                </div>
            </div>
        </div>

        <!-- TABLAS -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-3">

            <!-- ODOO -->
            <div class="rounded-xl border overflow-hidden flex flex-col h-[500px]"
                :class="isDark ? 'bg-slate-900/40 border-white/10' : 'bg-white border-slate-200 shadow-sm'">
                <div class="px-3 py-2 border-b flex items-center justify-between bg-blue-500/10"
                    :class="isDark ? 'border-white/5' : 'border-slate-100'">
                    <span class="text-[11px] font-semibold uppercase tracking-wider text-blue-400">Odoo ERP</span>
                    <span class="text-[9px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        {{ filteredOdoo?.length ?? 0 }} registros
                    </span>
                </div>
                <div class="flex-1 overflow-y-auto custom-scroll">
                    <table class="w-full text-left border-collapse table-fixed">
                        <thead class="sticky top-0 z-10" :class="isDark ? 'bg-slate-900' : 'bg-slate-50'">
                            <tr class="text-[9px] font-semibold uppercase tracking-wider"
                                :class="isDark ? 'text-white/30' : 'text-slate-400'">
                                <th class="px-3 py-2 w-14 text-center border-b"
                                    :class="isDark ? 'border-white/5' : 'border-slate-100'">ID</th>
                                <th class="px-3 py-2 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                                    Colaborador</th>
                                <th class="px-3 py-2 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                                    Departamento</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- SKELETON -->
                            <template v-if="isLoading">
                                <tr v-for="i in 8" :key="'sk-o-' + i" class="border-b"
                                    :class="isDark ? 'border-white/5' : 'border-slate-100'">
                                    <td class="px-3 py-2.5 text-center">
                                        <div class="h-3 w-8 rounded-md mx-auto animate-pulse"
                                            :class="isDark ? 'bg-white/10' : 'bg-slate-200'"></div>
                                    </td>
                                    <td class="px-3 py-2.5">
                                        <div class="h-3 rounded-md animate-pulse mb-1.5"
                                            :style="{ width: (50 + (i * 13) % 35) + '%' }"
                                            :class="isDark ? 'bg-white/10' : 'bg-slate-200'"></div>
                                        <div class="h-2.5 rounded-md animate-pulse"
                                            :style="{ width: (30 + (i * 7) % 25) + '%' }"
                                            :class="isDark ? 'bg-white/5' : 'bg-slate-100'"></div>
                                    </td>
                                    <td class="px-3 py-2.5">
                                        <div class="h-3 rounded-md animate-pulse"
                                            :style="{ width: (40 + (i * 9) % 30) + '%' }"
                                            :class="isDark ? 'bg-white/10' : 'bg-slate-200'"></div>
                                    </td>
                                </tr>
                            </template>

                            <!-- DATOS -->
                            <template v-else>
                                <tr v-for="u in (filteredOdoo ?? [])" :key="u.id" class="border-b transition-all"
                                    :class="isDark ? 'border-white/5 hover:bg-blue-500/5' : 'border-slate-100 hover:bg-blue-50/50'">
                                    <td class="px-3 py-2 text-center text-blue-400 font-mono text-[10px]">{{ u.id }}
                                    </td>
                                    <td class="px-3 py-2">
                                        <div class="text-[12px] font-semibold truncate"
                                            :class="isDark ? 'text-white' : 'text-slate-800'">{{ u.name }}</div>
                                        <div class="text-[10px] font-medium text-amber-400 truncate mt-0.5">
                                            {{ u.job_title || '—' }}
                                        </div>
                                    </td>
                                    <td class="px-3 py-2 text-[11px] font-medium truncate"
                                        :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                                        {{ u.department_id ? u.department_id[1] : 'S/A' }}
                                    </td>
                                </tr>
                                <tr v-if="!filteredOdoo?.length">
                                    <td colspan="3" class="px-3 py-8 text-center text-[11px] opacity-30">Sin registros
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- SQL LOCAL -->
            <div class="rounded-xl border overflow-hidden flex flex-col h-[500px]"
                :class="isDark ? 'bg-slate-900/40 border-white/10' : 'bg-white border-slate-200 shadow-sm'">
                <div class="px-3 py-2 border-b flex items-center justify-between bg-emerald-500/10"
                    :class="isDark ? 'border-white/5' : 'border-slate-100'">
                    <span class="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">SQL Server
                        local</span>
                    <span class="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {{ filteredLocal?.length ?? 0 }} registros
                    </span>
                </div>
                <div class="flex-1 overflow-y-auto custom-scroll">
                    <table class="w-full text-left border-collapse table-fixed">
                        <thead class="sticky top-0 z-10" :class="isDark ? 'bg-slate-900' : 'bg-slate-50'">
                            <tr class="text-[9px] font-semibold uppercase tracking-wider"
                                :class="isDark ? 'text-white/30' : 'text-slate-400'">
                                <th class="px-3 py-2 w-24 border-b"
                                    :class="isDark ? 'border-white/5' : 'border-slate-100'">Cédula
                                </th>
                                <th class="px-3 py-2 border-b" :class="isDark ? 'border-white/5' : 'border-slate-100'">
                                    Nombre</th>
                                <th class="px-3 py-2 w-16 text-center border-b"
                                    :class="isDark ? 'border-white/5' : 'border-slate-100'">Acceso</th>
                                <th class="px-3 py-2 w-10 text-center border-b"
                                    :class="isDark ? 'border-white/5' : 'border-slate-100'">Est</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in (filteredLocal ?? [])" :key="user.id_odoo"
                                class="border-b transition-all"
                                :class="isDark ? 'border-white/5 hover:bg-emerald-500/5' : 'border-slate-100 hover:bg-emerald-50/50'">
                                <td class="px-3 py-2 font-mono text-emerald-400 text-[10px] font-semibold">
                                    {{ user.identificacion }}
                                </td>
                                <td class="px-3 py-2">
                                    <div class="text-[12px] font-semibold truncate"
                                        :class="isDark ? 'text-white' : 'text-slate-800'">{{ user.nombre }}</div>
                                    <div class="text-[10px] font-medium text-blue-400 truncate mt-0.5">
                                        {{ user.departamento }}
                                    </div>
                                </td>
                                <td class="px-3 py-2 text-center">
                                    <button @click="emit('open-perms', user)"
                                        class="w-7 h-7 rounded-lg border inline-flex items-center justify-center hover:scale-105 transition-all"
                                        :class="isDark ? 'bg-slate-800 border-white/10' : 'bg-slate-100 border-slate-200'">
                                        <i class="fas fa-key text-[10px]"
                                            :class="user.permisos?.length > 0 ? 'text-amber-400' : 'text-slate-400'"></i>
                                    </button>
                                </td>
                                <td class="px-3 py-2 text-center">
                                    <span class="w-2 h-2 rounded-full inline-block"
                                        :class="user.is_active ? 'bg-emerald-400' : 'bg-red-400'"></span>
                                </td>
                            </tr>
                            <tr v-if="!filteredLocal?.length">
                                <td colspan="4" class="px-3 py-8 text-center text-[11px] opacity-30">Sin registros</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useUsuariosSync } from '../../../composables/adminLogica/useUsuariosSync.js';
import { useCompanies } from '../../../composables/adminLogica/useCompanies.js';

const props = defineProps({ isDark: Boolean });
const emit = defineEmits(['success', 'error', 'open-perms']);

const API_URL = import.meta.env.VITE_API_URL;

const {
    dbUsuarios, odooUsuarios,
    isSyncing: isSyncingUsers,
    searchUser, selectedDept, selectedCountry,
    departamentosUnicos, filteredOdoo, filteredLocal,
    fetchDbUsuarios, fetchOdooUsuarios,
} = useUsuariosSync();

const { odooCompanies, fetchOdooRaw } = useCompanies();

const progressPercent = ref(0);
const isRefreshing = ref(false);
const isLoading = ref(true);
let progressTimer = null;

const handleRefresh = async () => {
    isRefreshing.value = true;
    try {
        await Promise.all([fetchDbUsuarios(), fetchOdooUsuarios()]);
        emit('success', 'Datos actualizados');
    } catch (e) {
        emit('error', 'Error al refrescar');
    } finally {
        isRefreshing.value = false;
    }
};

const handleSync = async () => {
    if (selectedCountry.value === 'TODOS') return alert('Selecciona un país');
    isSyncingUsers.value = true;
    progressPercent.value = 0;

    progressTimer = setInterval(async () => {
        try {
            const res = await fetch(`${API_URL}/sincronizar/progreso`);
            const data = await res.json();
            if (data.total > 0) progressPercent.value = Math.round((data.current / data.total) * 100);
            if (['completed', 'error', 'cancelled'].includes(data.status)) clearInterval(progressTimer);
        } catch (e) { console.error(e); }
    }, 500);

    try {
        const url = `${API_URL}/sincronizar/ejecutar?pais=${selectedCountry.value}&depto=${selectedDept.value}`;
        const res = await fetch(url, { method: 'POST' });
        const result = await res.json();
        if (res.ok) {
            await fetchDbUsuarios();
            progressPercent.value = 100;
            emit('success', result.message);
        } else throw new Error(result.message);
    } catch (e) {
        emit('error', 'Error en sincronización');
    } finally {
        clearInterval(progressTimer);
        setTimeout(() => {
            isSyncingUsers.value = false;
            progressPercent.value = 0;
        }, 2000);
    }
};

const handleCancel = async () => {
    await fetch(`${API_URL}/sincronizar/cancelar`, { method: 'POST' });
    isSyncingUsers.value = false;
    clearInterval(progressTimer);
};

watch(selectedCountry, async () => {
    selectedDept.value = 'TODOS';
    await Promise.all([fetchDbUsuarios(), fetchOdooUsuarios()]);
});

onMounted(async () => {
    isLoading.value = true;
    try {
        await Promise.all([fetchDbUsuarios(), fetchOdooUsuarios(), fetchOdooRaw()]);
    } finally {
        isLoading.value = false;
    }
});
</script>