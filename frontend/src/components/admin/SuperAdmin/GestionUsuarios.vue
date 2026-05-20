<template>
    <div class="gu-root" :class="isDark ? 'gu-dark' : 'gu-light'">

        <!-- ─── HEADER ───────────────────────────────────────────────────── -->
        <header class="gu-header">
            <div class="gu-header-left">
                <div class="gu-header-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div>
                    <p class="gu-eyebrow">Personal</p>
                    <h2 class="gu-title">Gestión de colaboradores</h2>
                </div>
            </div>

            <div class="gu-header-right">
                <!-- SEARCH -->
                <div class="gu-search">
                    <i class="fas fa-search gu-search-icon"></i>
                    <input v-model="searchUser" type="text" placeholder="Buscar usuario..." class="gu-search-input" />
                </div>

                <!-- REFRESH -->
                <button @click="handleRefresh" :disabled="isRefreshing" class="gu-icon-btn"
                    title="Actualizar datos">
                    <i class="fas fa-rotate" :class="isRefreshing ? 'fa-spin' : ''"></i>
                </button>

                <!-- SYNC -->
                <button v-if="!isSyncingUsers" @click="handleSync" class="gu-btn-primary">
                    <i class="fas fa-arrows-rotate"></i>
                    Sincronizar
                </button>
                <div v-else class="gu-sync-progress">
                    <div class="gu-sync-bar">
                        <div class="gu-sync-fill" :style="{ width: progressPercent + '%' }"></div>
                    </div>
                    <span class="gu-sync-percent">{{ progressPercent }}%</span>
                    <button @click="handleCancel" class="gu-icon-btn gu-icon-btn-danger" title="Cancelar">
                        <i class="fas fa-stop"></i>
                    </button>
                </div>
            </div>
        </header>

        <!-- ─── FILTROS ──────────────────────────────────────────────────── -->
        <div class="gu-filters">
            <p class="gu-filters-label">
                <i class="fas fa-filter"></i>
                Filtros
            </p>

            <!-- PAÍS -->
            <div class="gu-filter" ref="paisRef">
                <button @click="toggleDropdown('pais')" class="gu-filter-btn"
                    :class="selectedCountry !== 'TODOS' ? 'is-active' : ''">
                    <span class="gu-filter-label">País</span>
                    <span class="gu-filter-value">{{ selectedCountry === 'TODOS' ? 'Todos' : selectedCountry }}</span>
                    <i class="fas fa-chevron-down gu-filter-chev"
                        :class="openDropdown === 'pais' ? 'is-open' : ''"></i>
                </button>
                <div v-if="openDropdown === 'pais'" class="gu-dropdown">
                    <div class="gu-dropdown-search">
                        <i class="fas fa-search"></i>
                        <input v-model="searchPais" ref="inputPais" type="text" placeholder="Buscar país..." />
                    </div>
                    <div class="gu-dropdown-list custom-scroll">
                        <button @click="selectPais('TODOS')" class="gu-dropdown-item"
                            :class="selectedCountry === 'TODOS' ? 'is-selected' : ''">
                            <i class="fas fa-globe gu-dropdown-icon"></i>
                            Todos los países
                            <i v-if="selectedCountry === 'TODOS'" class="fas fa-check gu-dropdown-check"></i>
                        </button>
                        <button v-for="c in filteredPaises" :key="c.id" @click="selectPais(c.name)"
                            class="gu-dropdown-item" :class="selectedCountry === c.name ? 'is-selected' : ''">
                            {{ c.name }}
                            <i v-if="selectedCountry === c.name" class="fas fa-check gu-dropdown-check"></i>
                        </button>
                        <div v-if="!filteredPaises.length" class="gu-dropdown-empty">Sin resultados</div>
                    </div>
                </div>
            </div>

            <!-- DEPARTAMENTO -->
            <div class="gu-filter" ref="deptoRef">
                <button @click="toggleDropdown('depto')" class="gu-filter-btn"
                    :class="selectedDept !== 'TODOS' ? 'is-active' : ''">
                    <span class="gu-filter-label">Departamento</span>
                    <span class="gu-filter-value">{{ selectedDept === 'TODOS' ? 'Todos' : selectedDept }}</span>
                    <i class="fas fa-chevron-down gu-filter-chev"
                        :class="openDropdown === 'depto' ? 'is-open' : ''"></i>
                </button>
                <div v-if="openDropdown === 'depto'" class="gu-dropdown">
                    <div class="gu-dropdown-search">
                        <i class="fas fa-search"></i>
                        <input v-model="searchDepto" ref="inputDepto" type="text" placeholder="Buscar departamento..." />
                    </div>
                    <div class="gu-dropdown-list custom-scroll">
                        <button @click="selectDepto('TODOS')" class="gu-dropdown-item"
                            :class="selectedDept === 'TODOS' ? 'is-selected' : ''">
                            <i class="fas fa-building gu-dropdown-icon"></i>
                            Todos los departamentos
                            <i v-if="selectedDept === 'TODOS'" class="fas fa-check gu-dropdown-check"></i>
                        </button>
                        <button v-for="d in filteredDeptos" :key="d" @click="selectDepto(d)"
                            class="gu-dropdown-item" :class="selectedDept === d ? 'is-selected' : ''">
                            {{ d }}
                            <i v-if="selectedDept === d" class="fas fa-check gu-dropdown-check"></i>
                        </button>
                        <div v-if="!filteredDeptos.length" class="gu-dropdown-empty">Sin resultados</div>
                    </div>
                </div>
            </div>

            <!-- CARGO -->
            <div class="gu-filter" ref="cargoRef">
                <button @click="toggleDropdown('cargo')" class="gu-filter-btn"
                    :class="selectedCargo !== 'TODOS' ? 'is-active' : ''">
                    <span class="gu-filter-label">Cargo</span>
                    <span class="gu-filter-value">{{ selectedCargo === 'TODOS' ? 'Todos' : selectedCargo }}</span>
                    <i class="fas fa-chevron-down gu-filter-chev"
                        :class="openDropdown === 'cargo' ? 'is-open' : ''"></i>
                </button>
                <div v-if="openDropdown === 'cargo'" class="gu-dropdown gu-dropdown-right">
                    <div class="gu-dropdown-search">
                        <i class="fas fa-search"></i>
                        <input v-model="searchCargo" ref="inputCargo" type="text" placeholder="Buscar cargo..." />
                    </div>
                    <div class="gu-dropdown-list custom-scroll">
                        <button @click="selectCargo('TODOS')" class="gu-dropdown-item"
                            :class="selectedCargo === 'TODOS' ? 'is-selected' : ''">
                            <i class="fas fa-briefcase gu-dropdown-icon"></i>
                            Todos los cargos
                            <i v-if="selectedCargo === 'TODOS'" class="fas fa-check gu-dropdown-check"></i>
                        </button>
                        <button v-for="c in filteredCargos" :key="c" @click="selectCargo(c)"
                            class="gu-dropdown-item" :class="selectedCargo === c ? 'is-selected' : ''">
                            {{ c }}
                            <i v-if="selectedCargo === c" class="fas fa-check gu-dropdown-check"></i>
                        </button>
                        <div v-if="!filteredCargos.length" class="gu-dropdown-empty">Sin resultados</div>
                    </div>
                </div>
            </div>

            <!-- Limpiar filtros (solo si hay filtros activos) -->
            <button v-if="hasActiveFilters" @click="clearFilters" class="gu-clear-btn">
                <i class="fas fa-xmark"></i>
                Limpiar
            </button>

            <!-- Overlay para cerrar dropdowns -->
            <div v-if="openDropdown" @click="openDropdown = null" class="gu-overlay"></div>
        </div>

        <!-- ─── TABLAS ───────────────────────────────────────────────────── -->
        <div class="gu-tables">

            <!-- ODOO -->
            <section class="gu-table-card">
                <div class="gu-table-head">
                    <div class="gu-table-head-left">
                        <div class="gu-table-icon">
                            <i class="fas fa-cloud-arrow-down"></i>
                        </div>
                        <div>
                            <p class="gu-table-title">Odoo ERP</p>
                            <p class="gu-table-sub">Origen de datos remoto</p>
                        </div>
                    </div>
                    <span class="gu-count-pill">
                        {{ filteredOdoo?.length ?? 0 }} registros
                    </span>
                </div>

                <div class="gu-table-body custom-scroll">
                    <table class="gu-table">
                        <thead>
                            <tr>
                                <th class="gu-th-id">ID</th>
                                <th>Colaborador</th>
                                <th>Departamento</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- SKELETON -->
                            <template v-if="isLoading">
                                <tr v-for="i in 8" :key="'sk-o-' + i" class="gu-tr">
                                    <td class="gu-td-id">
                                        <div class="gu-skel" style="width: 28px; height: 11px;"></div>
                                    </td>
                                    <td>
                                        <div class="gu-skel mb-1" :style="{ width: (50 + (i * 13) % 35) + '%' }"></div>
                                        <div class="gu-skel-soft" :style="{ width: (30 + (i * 7) % 25) + '%' }"></div>
                                    </td>
                                    <td>
                                        <div class="gu-skel" :style="{ width: (40 + (i * 9) % 30) + '%' }"></div>
                                    </td>
                                </tr>
                            </template>

                            <!-- DATOS -->
                            <template v-else>
                                <tr v-for="u in (filteredOdoo ?? [])" :key="u.id" class="gu-tr">
                                    <td class="gu-td-id">{{ u.id }}</td>
                                    <td>
                                        <div class="gu-name">{{ u.name }}</div>
                                        <div class="gu-meta">{{ u.job_title || '—' }}</div>
                                    </td>
                                    <td class="gu-td-dept">
                                        {{ u.department_id ? u.department_id[1] : 'Sin asignar' }}
                                    </td>
                                </tr>
                                <tr v-if="!filteredOdoo?.length">
                                    <td colspan="3" class="gu-empty">
                                        <i class="fas fa-folder-open"></i>
                                        Sin registros para mostrar
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- SQL LOCAL -->
            <section class="gu-table-card">
                <div class="gu-table-head">
                    <div class="gu-table-head-left">
                        <div class="gu-table-icon">
                            <i class="fas fa-database"></i>
                        </div>
                        <div>
                            <p class="gu-table-title">SQL Server local</p>
                            <p class="gu-table-sub">Base de datos sincronizada</p>
                        </div>
                    </div>
                    <span class="gu-count-pill">
                        {{ filteredLocal?.length ?? 0 }} registros
                    </span>
                </div>

                <div class="gu-table-body custom-scroll">
                    <table class="gu-table">
                        <thead>
                            <tr>
                                <th class="gu-th-doc">Cédula</th>
                                <th>Nombre</th>
                                <th class="gu-th-action">Acceso</th>
                                <th class="gu-th-status">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- SKELETON -->
                            <template v-if="isLoading">
                                <tr v-for="i in 8" :key="'sk-l-' + i" class="gu-tr">
                                    <td><div class="gu-skel" style="width: 70px; height: 11px;"></div></td>
                                    <td>
                                        <div class="gu-skel mb-1" :style="{ width: (50 + (i * 11) % 35) + '%' }"></div>
                                        <div class="gu-skel-soft" :style="{ width: (25 + (i * 8) % 25) + '%' }"></div>
                                    </td>
                                    <td class="gu-td-action">
                                        <div class="gu-skel" style="width: 28px; height: 28px; border-radius: 6px;"></div>
                                    </td>
                                    <td class="gu-td-status">
                                        <div class="gu-skel" style="width: 8px; height: 8px; border-radius: 50%; margin: 0 auto;"></div>
                                    </td>
                                </tr>
                            </template>

                            <!-- DATOS -->
                            <template v-else>
                                <tr v-for="user in (filteredLocal ?? [])" :key="user.id_odoo" class="gu-tr">
                                    <td class="gu-td-doc">{{ user.identificacion }}</td>
                                    <td>
                                        <div class="gu-name">{{ user.nombre }}</div>
                                        <div class="gu-meta">{{ user.departamento }}</div>
                                    </td>
                                    <td class="gu-td-action">
                                        <button @click="emit('open-perms', user)" class="gu-perm-btn"
                                            :class="user.permisos?.length > 0 ? 'has-perms' : ''"
                                            :title="user.permisos?.length > 0 ? `${user.permisos.length} permisos activos` : 'Sin permisos'">
                                            <i class="fas fa-key"></i>
                                            <span v-if="user.permisos?.length > 0" class="gu-perm-badge">
                                                {{ user.permisos.length }}
                                            </span>
                                        </button>
                                    </td>
                                    <td class="gu-td-status">
                                        <span class="gu-status-dot" :class="user.is_active ? 'is-on' : 'is-off'"
                                            :title="user.is_active ? 'Activo' : 'Inactivo'"></span>
                                    </td>
                                </tr>
                                <tr v-if="!filteredLocal?.length">
                                    <td colspan="4" class="gu-empty">
                                        <i class="fas fa-folder-open"></i>
                                        Sin registros para mostrar
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useUsuariosSync } from '../../../composables/adminLogica/useUsuariosSync.js';
import { useCompanies } from '../../../composables/adminLogica/useCompanies.js';

const props = defineProps({ isDark: Boolean });
const emit = defineEmits(['success', 'error', 'open-perms']);

const API_URL = import.meta.env.VITE_API_URL;

const {
    dbUsuarios, odooUsuarios,
    isSyncing: isSyncingUsers,
    searchUser, selectedDept, selectedCargo, selectedCountry,
    departamentosUnicos, cargosUnicos, filteredOdoo, filteredLocal,
    fetchDbUsuarios, fetchOdooUsuarios,
} = useUsuariosSync();

const { odooCompanies, fetchOdooRaw } = useCompanies();

// ─── Dropdowns ────────────────────────────────────────────────────────────
const openDropdown = ref(null);
const searchPais   = ref('');
const searchDepto  = ref('');
const searchCargo  = ref('');

const inputPais  = ref(null);
const inputDepto = ref(null);
const inputCargo = ref(null);

const toggleDropdown = async (name) => {
    if (openDropdown.value === name) { openDropdown.value = null; return; }
    openDropdown.value = name;
    searchPais.value = '';
    searchDepto.value = '';
    searchCargo.value = '';
    await nextTick();
    if (name === 'pais')  inputPais.value?.focus();
    if (name === 'depto') inputDepto.value?.focus();
    if (name === 'cargo') inputCargo.value?.focus();
};

const filteredPaises = computed(() => {
    const q = searchPais.value.toLowerCase();
    return (odooCompanies.value || []).filter(c => c.name.toLowerCase().includes(q));
});

const filteredDeptos = computed(() => {
    const q = searchDepto.value.toLowerCase();
    return (departamentosUnicos.value || [])
        .filter(d => d !== 'TODOS' && d.toLowerCase().includes(q));
});

const filteredCargos = computed(() => {
    const q = searchCargo.value.toLowerCase();
    return (cargosUnicos.value || [])
        .filter(c => c !== 'TODOS' && c.toLowerCase().includes(q));
});

const selectPais = (val) => { selectedCountry.value = val; openDropdown.value = null; };
const selectDepto = (val) => { selectedDept.value = val; openDropdown.value = null; };
const selectCargo = (val) => { selectedCargo.value = val; openDropdown.value = null; };

const hasActiveFilters = computed(() =>
    selectedCountry.value !== 'TODOS' ||
    selectedDept.value !== 'TODOS' ||
    selectedCargo.value !== 'TODOS'
);

const clearFilters = () => {
    selectedCountry.value = 'TODOS';
    selectedDept.value = 'TODOS';
    selectedCargo.value = 'TODOS';
};

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

<style scoped>
/* ══════════════════════════════════════════════════════════════════
   VARIABLES — azul clásico tipo Vercel/GitHub
   ══════════════════════════════════════════════════════════════════ */
.gu-light {
    --bg: #ffffff;
    --bg-soft: #fafafa;
    --bg-hover: #f4f4f5;
    --border: #ececec;
    --border-strong: #e2e2e2;
    --text: #09090b;
    --text-muted: #52525b;
    --text-soft: #a1a1aa;
    /* Acento ultra-sobrio: gris pizarra (casi neutro) */
    --brand: #52525b;
    --brand-soft: #f4f4f5;
    --brand-text: #27272a;
    /* Verde funcional para estado activo */
    --on: #16a34a;
    --on-soft: #f0fdf4;
    --on-text: #15803d;
    --off: #dc2626;
    --off-soft: #fef2f2;
}

.gu-dark {
    --bg: #18181b;
    --bg-soft: #131316;
    --bg-hover: #1f1f23;
    --border: #27272a;
    --border-strong: #3f3f46;
    --text: #fafafa;
    --text-muted: #a1a1aa;
    --text-soft: #71717a;
    /* Gris ZINC puro neutro: SIN subtono azul */
    --brand: #d4d4d8;
    --brand-soft: rgba(212, 212, 216, 0.08);
    --brand-text: #e4e4e7;
    --on: #4ade80;
    --on-soft: rgba(74, 222, 128, 0.12);
    --on-text: #86efac;
    --off: #f87171;
    --off-soft: rgba(248, 113, 113, 0.12);
}

/* ══════════════════════════════════════════════════════════════════
   ROOT
   ══════════════════════════════════════════════════════════════════ */
.gu-root {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    color: var(--text);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* ══════════════════════════════════════════════════════════════════
   HEADER — compacto
   ══════════════════════════════════════════════════════════════════ */
.gu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}

.gu-header-left {
    display: flex;
    align-items: center;
    gap: 9px;
}

.gu-header-icon {
    width: 30px;
    height: 30px;
    border-radius: 7px;
    background: var(--brand-soft);
    color: var(--brand-text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    flex-shrink: 0;
}

.gu-eyebrow {
    font-size: 9.5px;
    font-weight: 500;
    color: var(--text-soft);
    letter-spacing: 0.02em;
    margin-bottom: 1px;
    line-height: 1;
}

.gu-title {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.012em;
    color: var(--text);
    line-height: 1.15;
}

.gu-header-right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}

/* ══════════════════════════════════════════════════════════════════
   SEARCH
   ══════════════════════════════════════════════════════════════════ */
.gu-search {
    position: relative;
    display: flex;
    align-items: center;
}

.gu-search-icon {
    position: absolute;
    left: 9px;
    color: var(--text-soft);
    font-size: 10px;
    pointer-events: none;
}

.gu-search-input {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 5px 10px 5px 26px;
    font-size: 11.5px;
    color: var(--text);
    width: 200px;
    height: 28px;
    outline: none;
    transition: border-color 0.12s ease;
    font-family: inherit;
}

.gu-search-input::placeholder {
    color: var(--text-soft);
}

.gu-search-input:focus {
    border-color: var(--brand);
    box-shadow: 0 0 0 2px var(--brand-soft);
}

/* ══════════════════════════════════════════════════════════════════
   BOTONES
   ══════════════════════════════════════════════════════════════════ */
.gu-icon-btn {
    width: 28px;
    height: 28px;
    border-radius: 5px;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text-muted);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 10.5px;
    transition: all 0.12s ease;
}

.gu-icon-btn:hover:not(:disabled) {
    background: var(--bg-soft);
    color: var(--text);
    border-color: var(--border-strong);
}

.gu-icon-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.gu-icon-btn-danger {
    color: var(--off);
    border-color: var(--off-soft);
}

.gu-icon-btn-danger:hover {
    background: var(--off-soft);
    color: var(--off);
}

.gu-btn-primary {
    padding: 5px 12px;
    height: 28px;
    border-radius: 5px;
    background: var(--brand);
    color: #fff;
    border: none;
    cursor: pointer;
    font-size: 11.5px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.12s ease;
    font-family: inherit;
}

.gu-btn-primary i {
    font-size: 10px;
}

.gu-btn-primary:hover {
    background: var(--brand-text);
    box-shadow: 0 3px 10px -2px rgba(37, 99, 235, 0.35);
}

/* SYNC PROGRESS */
.gu-sync-progress {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 4px 8px;
    background: var(--brand-soft);
    border-radius: 5px;
    height: 28px;
}

.gu-sync-bar {
    width: 90px;
    height: 3px;
    background: var(--border);
    border-radius: 999px;
    overflow: hidden;
}

.gu-sync-fill {
    height: 100%;
    background: var(--brand);
    border-radius: 999px;
    transition: width 0.4s ease;
}

.gu-sync-percent {
    font-size: 10.5px;
    font-weight: 600;
    color: var(--brand-text);
    font-variant-numeric: tabular-nums;
    min-width: 28px;
}

/* ══════════════════════════════════════════════════════════════════
   FILTROS — versión compacta
   ══════════════════════════════════════════════════════════════════ */
.gu-filters {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: 6px;
    flex-wrap: wrap;
    position: relative;
}

.gu-filters-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 9.5px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding-right: 7px;
    border-right: 1px solid var(--border);
    height: 22px;
}

.gu-filters-label i {
    font-size: 9px;
    color: var(--brand);
}

.gu-filter {
    position: relative;
}

.gu-filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    height: 24px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 5px;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.12s ease;
}

.gu-filter-btn:hover {
    border-color: var(--border-strong);
}

.gu-filter-btn.is-active {
    background: var(--brand-soft);
    border-color: var(--brand);
}

.gu-filter-label {
    font-size: 10px;
    font-weight: 500;
    color: var(--text-soft);
}

.gu-filter-btn.is-active .gu-filter-label {
    color: var(--brand-text);
}

.gu-filter-value {
    font-size: 11px;
    font-weight: 600;
    color: var(--text);
    max-width: 110px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.gu-filter-btn.is-active .gu-filter-value {
    color: var(--brand-text);
}

.gu-filter-chev {
    font-size: 8px;
    color: var(--text-soft);
    transition: transform 0.18s ease;
}

.gu-filter-chev.is-open {
    transform: rotate(180deg);
}

.gu-clear-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    height: 24px;
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 10px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 5px;
    transition: all 0.12s ease;
    font-family: inherit;
    margin-left: auto;
}

.gu-clear-btn:hover {
    color: var(--off);
    background: var(--off-soft);
}

.gu-clear-btn i {
    font-size: 9px;
}

/* ══════════════════════════════════════════════════════════════════
   DROPDOWN
   ══════════════════════════════════════════════════════════════════ */
.gu-overlay {
    position: fixed;
    inset: 0;
    z-index: 40;
}

.gu-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 50;
    min-width: 220px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: 0 8px 24px -6px rgba(0, 0, 0, 0.15);
    overflow: hidden;
}

.gu-dropdown-right {
    left: auto;
    right: 0;
}

.gu-dropdown-search {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 10px;
    border-bottom: 1px solid var(--border);
}

.gu-dropdown-search i {
    font-size: 9px;
    color: var(--text-soft);
}

.gu-dropdown-search input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-size: 11px;
    color: var(--text);
    font-family: inherit;
}

.gu-dropdown-search input::placeholder {
    color: var(--text-soft);
}

.gu-dropdown-list {
    max-height: 220px;
    overflow-y: auto;
    padding: 3px;
}

.gu-dropdown-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 9px;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: 4px;
    font-size: 11px;
    color: var(--text);
    text-align: left;
    font-family: inherit;
    transition: background 0.1s ease;
}

.gu-dropdown-item:hover {
    background: var(--bg-hover);
}

.gu-dropdown-item.is-selected {
    background: var(--brand-soft);
    color: var(--brand-text);
    font-weight: 500;
}

.gu-dropdown-icon {
    font-size: 9px;
    color: var(--text-soft);
}

.gu-dropdown-item.is-selected .gu-dropdown-icon {
    color: var(--brand-text);
}

.gu-dropdown-check {
    margin-left: auto;
    font-size: 9px;
    color: var(--brand);
}

.gu-dropdown-empty {
    padding: 12px 9px;
    text-align: center;
    font-size: 11px;
    color: var(--text-soft);
}

/* ══════════════════════════════════════════════════════════════════
   TABLAS
   ══════════════════════════════════════════════════════════════════ */
.gu-tables {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    flex: 1;
    min-height: 0;
}

@media (min-width: 1280px) {
    .gu-tables {
        grid-template-columns: 1fr 1fr;
    }
}

.gu-table-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 480px;
    max-height: calc(100vh - 220px);
}

.gu-table-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-soft);
    flex-shrink: 0;
}

.gu-table-head-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.gu-table-icon {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    background: var(--brand-soft);
    color: var(--brand-text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    flex-shrink: 0;
}

.gu-table-title {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--text);
    line-height: 1.15;
}

.gu-table-sub {
    font-size: 9.5px;
    color: var(--text-soft);
    margin-top: 1px;
}

.gu-count-pill {
    font-size: 10px;
    font-weight: 500;
    color: var(--text-muted);
    background: var(--bg);
    border: 1px solid var(--border);
    padding: 2px 8px;
    border-radius: 999px;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
}

.gu-table-body {
    flex: 1;
    overflow-y: auto;
}

.gu-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

.gu-table thead th {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg);
    padding: 6px 12px;
    text-align: left;
    font-size: 9px;
    font-weight: 600;
    color: var(--text-soft);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-bottom: 1px solid var(--border);
}

.gu-th-id { width: 56px; text-align: center; }
.gu-th-doc { width: 96px; }
.gu-th-action { width: 60px; text-align: center; }
.gu-th-status { width: 54px; text-align: center; }

.gu-tr {
    border-bottom: 1px solid var(--border);
    transition: background 0.1s ease;
}

.gu-tr:hover {
    background: var(--bg-hover);
}

.gu-tr:last-child {
    border-bottom: none;
}

.gu-table td {
    padding: 7px 12px;
    font-size: 11px;
    color: var(--text);
    vertical-align: middle;
}

.gu-td-id {
    text-align: center;
    font-variant-numeric: tabular-nums;
    color: var(--text-soft);
    font-size: 10px;
    font-weight: 500;
}

.gu-td-doc {
    font-variant-numeric: tabular-nums;
    color: var(--text-muted);
    font-size: 10px;
    font-weight: 500;
}

.gu-td-dept {
    color: var(--text-muted);
    font-size: 10.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.gu-td-action {
    text-align: center;
}

.gu-td-status {
    text-align: center;
}

.gu-name {
    font-size: 11.5px;
    font-weight: 500;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.25;
}

.gu-meta {
    font-size: 9.5px;
    color: var(--text-soft);
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* ══════════════════════════════════════════════════════════════════
   BOTÓN DE PERMISOS
   ══════════════════════════════════════════════════════════════════ */
.gu-perm-btn {
    position: relative;
    width: 24px;
    height: 24px;
    border-radius: 5px;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text-soft);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 9.5px;
    transition: all 0.12s ease;
}

.gu-perm-btn:hover {
    background: var(--bg-hover);
    color: var(--text);
    border-color: var(--border-strong);
}

.gu-perm-btn.has-perms {
    background: var(--brand-soft);
    border-color: transparent;
    color: var(--brand-text);
}

.gu-perm-btn.has-perms:hover {
    background: var(--brand);
    color: #fff;
}

.gu-perm-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 13px;
    height: 13px;
    padding: 0 3px;
    background: var(--on);
    color: #fff;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 700;
    line-height: 13px;
    text-align: center;
    box-shadow: 0 0 0 1.5px var(--bg);
    font-variant-numeric: tabular-nums;
}

/* ══════════════════════════════════════════════════════════════════
   ESTADO
   ══════════════════════════════════════════════════════════════════ */
.gu-status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    transition: all 0.18s ease;
}

.gu-status-dot.is-on {
    background: var(--on);
    box-shadow: 0 0 0 2.5px var(--on-soft);
}

.gu-status-dot.is-off {
    background: var(--off);
    box-shadow: 0 0 0 2.5px var(--off-soft);
}

/* ══════════════════════════════════════════════════════════════════
   EMPTY
   ══════════════════════════════════════════════════════════════════ */
.gu-empty {
    text-align: center;
    padding: 36px 12px !important;
    color: var(--text-soft);
    font-size: 11px;
}

.gu-empty i {
    display: block;
    font-size: 18px;
    margin-bottom: 6px;
    opacity: 0.5;
}

/* ══════════════════════════════════════════════════════════════════
   SKELETON
   ══════════════════════════════════════════════════════════════════ */
.gu-skel {
    height: 9px;
    border-radius: 3px;
    background: var(--border-strong);
    animation: gu-pulse 1.4s ease-in-out infinite;
}

.gu-skel-soft {
    height: 7px;
    border-radius: 3px;
    background: var(--border);
    animation: gu-pulse 1.4s ease-in-out infinite;
}

.mb-1 {
    margin-bottom: 4px;
}

@keyframes gu-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
}

/* ══════════════════════════════════════════════════════════════════
   SCROLLBAR
   ══════════════════════════════════════════════════════════════════ */
.custom-scroll::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.custom-scroll::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scroll::-webkit-scrollbar-thumb {
    background: var(--border-strong);
    border-radius: 999px;
}

.custom-scroll::-webkit-scrollbar-thumb:hover {
    background: var(--text-soft);
}
</style>
