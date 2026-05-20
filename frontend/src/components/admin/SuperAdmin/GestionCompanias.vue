<template>
    <div class="gc-root" :class="isDark ? 'gc-dark' : 'gc-light'">

        <!-- ─── HEADER ─────────────────────────────────────────────────── -->
        <header class="gc-header">
            <div class="gc-header-left">
                <div class="gc-header-icon">
                    <i class="fas fa-building-columns"></i>
                </div>
                <div>
                    <p class="gc-eyebrow">Empresas</p>
                    <h2 class="gc-title">Sincronización de sedes</h2>
                </div>
            </div>

            <div class="gc-header-right">
                <!-- REFRESH -->
                <button @click="handleRefresh" :disabled="isRefreshing" class="gc-icon-btn" title="Actualizar datos">
                    <i class="fas fa-rotate" :class="isRefreshing ? 'fa-spin' : ''"></i>
                </button>

                <!-- SYNC -->
                <button v-if="!isSyncingCompanies" @click="handleSync" class="gc-btn-primary">
                    <i class="fas fa-arrows-rotate"></i>
                    Sincronizar
                </button>
                <div v-else class="gc-sync-progress">
                    <div class="gc-sync-bar">
                        <div class="gc-sync-fill" :style="{ width: syncProgress + '%' }"></div>
                    </div>
                    <span class="gc-sync-percent">{{ syncProgress }}%</span>
                </div>
            </div>
        </header>

        <!-- ─── TABLAS ─────────────────────────────────────────────────── -->
        <div class="gc-tables">

            <!-- ODOO -->
            <section class="gc-table-card">
                <header class="gc-table-head">
                    <div class="gc-table-head-left">
                        <div class="gc-table-icon">
                            <i class="fas fa-cloud-arrow-down"></i>
                        </div>
                        <div>
                            <p class="gc-table-title">Odoo ERP</p>
                            <p class="gc-table-sub">Origen remoto</p>
                        </div>
                    </div>
                    <span class="gc-count-pill">{{ odooCompanies.length }} sedes</span>
                </header>

                <div class="gc-table-body custom-scroll">
                    <table class="gc-table">
                        <tbody>
                            <tr v-for="c in odooCompanies" :key="c.id" class="gc-tr">
                                <td class="gc-td-id">#{{ c.id }}</td>
                                <td class="gc-td-name">{{ c.name }}</td>
                                <td class="gc-td-check">
                                    <i v-if="dbCompanies.some(db => db.id === c.id)"
                                        class="fas fa-circle-check gc-check-on" title="Sincronizada"></i>
                                </td>
                            </tr>
                            <tr v-if="!odooCompanies.length">
                                <td colspan="3" class="gc-empty">
                                    <i class="fas fa-folder-open"></i>
                                    Sin datos disponibles
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- SQL SERVER LOCAL -->
            <section class="gc-table-card">
                <header class="gc-table-head">
                    <div class="gc-table-head-left">
                        <div class="gc-table-icon">
                            <i class="fas fa-database"></i>
                        </div>
                        <div>
                            <p class="gc-table-title">SQL Server local</p>
                            <p class="gc-table-sub">Base sincronizada</p>
                        </div>
                    </div>
                    <span class="gc-count-pill is-on">
                        {{ dbCompanies.filter(c => c.is_active).length }} activas
                    </span>
                </header>

                <div class="gc-table-body custom-scroll">
                    <table class="gc-table">
                        <tbody>
                            <tr v-for="comp in dbCompanies" :key="comp.id" class="gc-tr"
                                :class="!comp.is_active ? 'is-dim' : ''">
                                <td class="gc-td-info">
                                    <div class="gc-comp-name">{{ comp.name }}</div>
                                    <div class="gc-comp-status">
                                        <span class="gc-status-dot" :class="comp.is_active ? 'is-on' : 'is-off'"></span>
                                        <span :class="comp.is_active ? 'gc-status-on' : 'gc-status-off'">
                                            {{ comp.is_active ? 'Visible en login' : 'Oculta' }}
                                        </span>
                                    </div>
                                </td>
                                <td class="gc-td-toggle">
                                    <button @click="handleToggle(comp.id, comp.is_active)" class="gc-toggle-btn"
                                        :class="comp.is_active ? 'is-on' : 'is-off'">
                                        {{ comp.is_active ? 'ON' : 'OFF' }}
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="!dbCompanies.length">
                                <td colspan="2" class="gc-empty">
                                    <i class="fas fa-folder-open"></i>
                                    Sin datos locales
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useCompanies } from '../../../composables/adminLogica/useCompanies.js';

const props = defineProps({ isDark: Boolean });
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

<style scoped>
/* ══════════════════════════════════════════════════════════════════
   VARIABLES — Vercel-style + color funcional
   ══════════════════════════════════════════════════════════════════ */
.gc-light {
    --bg: #ffffff;
    --bg-soft: #fafafa;
    --bg-hover: #f4f4f5;
    --border: #ececec;
    --border-strong: #e2e2e2;
    --text: #09090b;
    --text-muted: #52525b;
    --text-soft: #a1a1aa;
    --brand: #3B82F6;
    --brand-soft: rgba(59, 130, 246, 0.08);
    --brand-text: #2563EB;
    --on: #16a34a;
    --on-soft: #f0fdf4;
    --on-text: #15803d;
    --off: #dc2626;
    --off-soft: #fef2f2;
    --off-text: #b91c1c;
    --btn-bg: #2563eb;
    --btn-bg-hover: #1d4ed8;
    --btn-text: #ffffff;
}

.gc-dark {
    --bg: #161B26;
    --bg-soft: #0B0F19;
    --bg-hover: #1F2533;
    --border: #222938;
    --border-strong: #2A3245;
    --text: #fafafa;
    --text-muted: #B0B7C3;
    --text-soft: #888888;
    --brand: #3B82F6;
    --brand-soft: rgba(59, 130, 246, 0.10);
    --brand-text: #60A5FA;
    --on: #4ade80;
    --on-soft: rgba(74, 222, 128, 0.12);
    --on-text: #86efac;
    --off: #f87171;
    --off-soft: rgba(248, 113, 113, 0.12);
    --off-text: #fca5a5;
    --btn-bg: #3b82f6;
    --btn-bg-hover: #2563eb;
    --btn-text: #ffffff;
}

.gc-root {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    color: var(--text);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* HEADER */
.gc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}

.gc-header-left {
    display: flex;
    align-items: center;
    gap: 9px;
}

.gc-header-icon {
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

.gc-eyebrow {
    font-size: 9.5px;
    font-weight: 500;
    color: var(--text-soft);
    letter-spacing: 0.02em;
    margin-bottom: 1px;
    line-height: 1;
}

.gc-title {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.012em;
    color: var(--text);
    line-height: 1.15;
}

.gc-header-right {
    display: flex;
    align-items: center;
    gap: 6px;
}

/* BOTONES */
.gc-icon-btn {
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

.gc-icon-btn:hover:not(:disabled) {
    background: var(--bg-soft);
    color: var(--text);
    border-color: var(--border-strong);
}

.gc-btn-primary {
    padding: 5px 12px;
    height: 28px;
    border-radius: 5px;
    background: var(--btn-bg);
    color: var(--btn-text);
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

.gc-btn-primary i {
    font-size: 10px;
}

.gc-btn-primary:hover {
    background: var(--btn-bg-hover);
    box-shadow: 0 3px 10px -2px rgba(37, 99, 235, 0.35);
}

/* SYNC PROGRESS */
.gc-sync-progress {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 4px 8px;
    background: var(--brand-soft);
    border-radius: 5px;
    height: 28px;
}

.gc-sync-bar {
    width: 90px;
    height: 3px;
    background: var(--border);
    border-radius: 999px;
    overflow: hidden;
}

.gc-sync-fill {
    height: 100%;
    background: var(--brand);
    border-radius: 999px;
    transition: width 0.4s ease;
}

.gc-sync-percent {
    font-size: 10.5px;
    font-weight: 600;
    color: var(--brand-text);
    font-variant-numeric: tabular-nums;
    min-width: 28px;
}

/* TABLAS */
.gc-tables {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    flex: 1;
    min-height: 0;
}

@media (min-width: 1024px) {
    .gc-tables {
        grid-template-columns: 1fr 1fr;
    }
}

.gc-table-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 380px;
    max-height: calc(100vh - 200px);
}

.gc-table-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-soft);
    flex-shrink: 0;
}

.gc-table-head-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.gc-table-icon {
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

.gc-table-title {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--text);
    line-height: 1.15;
}

.gc-table-sub {
    font-size: 9.5px;
    color: var(--text-soft);
    margin-top: 1px;
}

.gc-count-pill {
    font-size: 10px;
    font-weight: 500;
    color: var(--text-muted);
    background: var(--bg);
    border: 1px solid var(--border);
    padding: 2px 8px;
    border-radius: 999px;
    font-variant-numeric: tabular-nums;
}

.gc-count-pill.is-on {
    background: var(--on-soft);
    border-color: transparent;
    color: var(--on-text);
}

.gc-table-body {
    flex: 1;
    overflow-y: auto;
}

.gc-table {
    width: 100%;
    border-collapse: collapse;
}

.gc-tr {
    border-bottom: 1px solid var(--border);
    transition: background 0.1s ease;
}

.gc-tr:hover {
    background: var(--bg-hover);
}

.gc-tr:last-child {
    border-bottom: none;
}

.gc-tr.is-dim {
    opacity: 0.5;
}

.gc-tr.is-dim:hover {
    opacity: 1;
}

.gc-table td {
    padding: 9px 12px;
    font-size: 11.5px;
    vertical-align: middle;
}

.gc-td-id {
    width: 50px;
    font-family: ui-monospace, monospace;
    font-size: 10px;
    color: var(--text-soft);
    font-variant-numeric: tabular-nums;
}

.gc-td-name {
    font-weight: 500;
    color: var(--text);
}

.gc-td-check {
    width: 32px;
    text-align: right;
}

.gc-check-on {
    color: var(--on);
    font-size: 12px;
}

/* INFO + TOGGLE */
.gc-td-info {
    padding: 9px 12px;
}

.gc-comp-name {
    font-size: 11.5px;
    font-weight: 500;
    color: var(--text);
    line-height: 1.25;
}

.gc-comp-status {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 3px;
}

.gc-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
}

.gc-status-dot.is-on {
    background: var(--on);
    box-shadow: 0 0 0 2.5px var(--on-soft);
}

.gc-status-dot.is-off {
    background: var(--off);
    box-shadow: 0 0 0 2.5px var(--off-soft);
}

.gc-status-on {
    font-size: 9.5px;
    font-weight: 600;
    color: var(--on-text);
}

.gc-status-off {
    font-size: 9.5px;
    font-weight: 600;
    color: var(--off-text);
}

.gc-td-toggle {
    width: 70px;
    text-align: right;
    padding: 9px 12px;
}

.gc-toggle-btn {
    height: 24px;
    padding: 0 10px;
    border-radius: 5px;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.12s ease;
    font-family: inherit;
    border: 1px solid;
}

.gc-toggle-btn.is-on {
    background: var(--on-soft);
    color: var(--on-text);
    border-color: transparent;
}

.gc-toggle-btn.is-on:hover {
    background: var(--on);
    color: #fff;
}

.gc-toggle-btn.is-off {
    background: var(--bg);
    color: var(--text-soft);
    border-color: var(--border-strong);
}

.gc-toggle-btn.is-off:hover {
    background: var(--bg-hover);
    color: var(--text);
}

/* EMPTY */
.gc-empty {
    text-align: center;
    padding: 32px 12px !important;
    color: var(--text-soft);
    font-size: 11px;
}

.gc-empty i {
    display: block;
    font-size: 18px;
    margin-bottom: 6px;
    opacity: 0.5;
}

/* SCROLLBAR */
.custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 999px; }
.custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--text-soft); }
</style>
