<template>
    <div class="gd-root" :class="isDark ? 'gd-dark' : 'gd-light'">

        <!-- ─── HEADER ─────────────────────────────────────────────────── -->
        <header class="gd-header">
            <div class="gd-header-left">
                <div class="gd-header-icon">
                    <i class="fas fa-chart-pie"></i>
                </div>
                <div>
                    <p class="gd-eyebrow">Dashboard</p>
                    <h2 class="gd-title">Vista general del sistema</h2>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span v-if="lastUpdated && !isLoading" class="text-[10px] opacity-40 font-medium hidden sm:block">
                    Actualizado {{ lastUpdated }}
                </span>
                <button @click="loadData" class="gd-icon-btn" title="Actualizar">
                    <i class="fas fa-rotate" :class="isLoading ? 'fa-spin' : ''"></i>
                </button>
            </div>
        </header>

        <!-- ─── MÉTRICAS PRINCIPALES ───────────────────────────────────── -->
        <div class="gd-metrics">

            <article class="gd-card gd-metric">
                <div class="gd-metric-head">
                    <span class="gd-metric-label">Total empleados</span>
                    <div class="gd-metric-icon">
                        <i class="fas fa-users"></i>
                    </div>
                </div>
                <div v-if="isLoading" class="gd-skel-num"></div>
                <span v-else class="gd-metric-value">{{ totalEmpleados.toLocaleString() }}</span>
                <span class="gd-metric-foot">
                    <i class="fas fa-database"></i>
                    Registrados en SQL
                </span>
            </article>

            <article class="gd-card gd-metric">
                <div class="gd-metric-head">
                    <span class="gd-metric-label">Empleados en Odoo</span>
                    <div class="gd-metric-icon">
                        <i class="fas fa-cloud"></i>
                    </div>
                </div>
                <div v-if="isLoading" class="gd-skel-num"></div>
                <span v-else class="gd-metric-value">{{ totalOdoo.toLocaleString() }}</span>
                <span class="gd-metric-foot">
                    <i class="fas fa-cloud-arrow-down"></i>
                    Fuente ERP Odoo
                </span>
            </article>

            <article class="gd-card gd-metric">
                <div class="gd-metric-head">
                    <span class="gd-metric-label">Sedes activas</span>
                    <div class="gd-metric-icon">
                        <i class="fas fa-building"></i>
                    </div>
                </div>
                <div v-if="isLoading" class="gd-skel-num"></div>
                <div v-else class="gd-metric-value-row">
                    <span class="gd-metric-value">{{ sedesActivas }}</span>
                    <span class="gd-metric-of">/ {{ totalSedes }}</span>
                </div>
                <span class="gd-metric-foot">
                    <i class="fas fa-check"></i>
                    Visibles en login
                </span>
            </article>

            <article class="gd-card gd-metric">
                <div class="gd-metric-head">
                    <span class="gd-metric-label">Total sedes</span>
                    <div class="gd-metric-icon">
                        <i class="fas fa-sitemap"></i>
                    </div>
                </div>
                <div v-if="isLoading" class="gd-skel-num"></div>
                <span v-else class="gd-metric-value">{{ totalSedes }}</span>
                <span class="gd-metric-foot">
                    <i class="fas fa-database"></i>
                    Registradas en SQL
                </span>
            </article>

        </div>

        <!-- ─── FILA INFERIOR ──────────────────────────────────────────── -->
        <div class="gd-bottom">

            <!-- ESTADO SINCRONIZACIÓN -->
            <section class="gd-card gd-sync">
                <header class="gd-section-head">
                    <div class="gd-section-head-left">
                        <div class="gd-section-icon">
                            <i class="fas fa-arrows-rotate"></i>
                        </div>
                        <div>
                            <p class="gd-section-title">Estado de sincronización</p>
                            <p class="gd-section-sub">Comparativa Odoo ↔ SQL</p>
                        </div>
                    </div>
                </header>

                <div class="gd-sync-body">
                    <div class="gd-sync-row">
                        <div class="gd-sync-row-left">
                            <span class="gd-status-dot" :class="syncDiff === 0 ? 'is-on' : 'is-warn'"></span>
                            <span class="gd-sync-label">Empleados sincronizados</span>
                        </div>
                        <div v-if="isLoading" class="gd-skel" style="width: 70px;"></div>
                        <span v-else class="gd-sync-value" :class="syncDiff === 0 ? 'is-on' : 'is-warn'">
                            {{ syncDiff === 0 ? 'Al día' : syncDiff + ' pendientes' }}
                        </span>
                    </div>

                    <div class="gd-sync-row">
                        <div class="gd-sync-row-left">
                            <i class="fas fa-cloud gd-sync-icon"></i>
                            <span class="gd-sync-label">Sedes en Odoo</span>
                        </div>
                        <div v-if="isLoading" class="gd-skel" style="width: 40px;"></div>
                        <span v-else class="gd-sync-value">{{ totalSedesOdoo }}</span>
                    </div>

                    <div class="gd-sync-row">
                        <div class="gd-sync-row-left">
                            <span class="gd-status-dot is-on"></span>
                            <span class="gd-sync-label">Empleados activos</span>
                        </div>
                        <div v-if="isLoading" class="gd-skel" style="width: 40px;"></div>
                        <span v-else class="gd-sync-value is-on">{{ empleadosActivos.toLocaleString() }}</span>
                    </div>

                    <div class="gd-sync-row">
                        <div class="gd-sync-row-left">
                            <i class="fas fa-percent gd-sync-icon"></i>
                            <span class="gd-sync-label">Tasa de actividad</span>
                        </div>
                        <div v-if="isLoading" class="gd-skel" style="width: 50px;"></div>
                        <span v-else class="gd-sync-value">{{ tasaActividad }}%</span>
                    </div>
                </div>
            </section>

            <!-- DISTRIBUCIÓN POR SEDE -->
            <section class="gd-card gd-distrib">
                <header class="gd-section-head">
                    <div class="gd-section-head-left">
                        <div class="gd-section-icon">
                            <i class="fas fa-chart-bar"></i>
                        </div>
                        <div>
                            <p class="gd-section-title">Distribución por sede</p>
                            <p class="gd-section-sub">Top {{ Math.min(sedesDistribucion.length, 8) }} con más empleados</p>
                        </div>
                    </div>
                    <span class="gd-count-pill" v-if="!isLoading && sedesDistribucion.length">
                        {{ sedesDistribucion.length }}
                    </span>
                </header>

                <div class="gd-distrib-body custom-scroll">
                    <template v-if="isLoading">
                        <div v-for="i in 5" :key="'sk-d-' + i" class="gd-distrib-row">
                            <div class="gd-skel" style="flex: 1; height: 10px;"></div>
                            <div class="gd-skel" style="width: 60px; height: 6px;"></div>
                            <div class="gd-skel" style="width: 24px; height: 10px;"></div>
                        </div>
                    </template>
                    <template v-else>
                        <div v-for="sede in sedesDistribucion" :key="sede.name" class="gd-distrib-row">
                            <span class="gd-distrib-name">{{ sede.name }}</span>
                            <div class="gd-distrib-bar">
                                <div class="gd-distrib-fill" :style="{ width: sede.pct + '%' }"></div>
                            </div>
                            <span class="gd-distrib-count">{{ sede.count }}</span>
                        </div>
                        <div v-if="!sedesDistribucion.length" class="gd-empty">
                            <i class="fas fa-chart-simple"></i>
                            Sin datos disponibles
                        </div>
                    </template>
                </div>
            </section>
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
const lastUpdated = ref(null);

const totalEmpleados = computed(() => dbUsuarios.value?.length ?? 0);
const totalOdoo = computed(() => odooUsuarios.value?.length ?? 0);
const sedesActivas = computed(() => dbCompanies.value?.filter(c => c.is_active).length ?? 0);
const totalSedes = computed(() => dbCompanies.value?.length ?? 0);
const totalSedesOdoo = computed(() => odooCompanies.value?.length ?? 0);
const empleadosActivos = computed(() => dbUsuarios.value?.filter(u => u.is_active).length ?? 0);
const syncDiff = computed(() => Math.abs(totalOdoo.value - totalEmpleados.value));
const tasaActividad = computed(() => {
    if (!totalEmpleados.value) return 0;
    return Math.round((empleadosActivos.value / totalEmpleados.value) * 100);
});

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
        lastUpdated.value = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }
};

onMounted(loadData);
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════════
   VARIABLES — paleta zinc (igual a Personal/Permisos)
   ══════════════════════════════════════════════════════════════════ */
.gd-light {
    --bg: #ffffff;
    --bg-soft: #fafafa;
    --bg-hover: #f4f4f5;
    --border: #ececec;
    --border-strong: #e2e2e2;
    --text: #09090b;
    --text-muted: #52525b;
    --text-soft: #a1a1aa;
    --brand: #52525b;
    --brand-soft: #f4f4f5;
    --brand-text: #27272a;
    --on: #16a34a;
    --on-soft: #f0fdf4;
    --on-text: #15803d;
    --warn: #ca8a04;
    --warn-soft: #fefce8;
    --warn-text: #a16207;
    --off: #dc2626;
    --off-soft: #fef2f2;
}

.gd-dark {
    --bg: #161B26;
    --bg-soft: #0B0F19;
    --bg-hover: #1F2533;
    --border: #222938;
    --border-strong: #2A3245;
    --text: #fafafa;
    --text-muted: #B0B7C3;
    --text-soft: #888888;
    --brand: #d4d4d8;
    --brand-soft: rgba(212, 212, 216, 0.08);
    --brand-text: #e4e4e7;
    --on: #4ade80;
    --on-soft: rgba(74, 222, 128, 0.12);
    --on-text: #86efac;
    --warn: #facc15;
    --warn-soft: rgba(250, 204, 21, 0.12);
    --warn-text: #fde047;
    --off: #f87171;
    --off-soft: rgba(248, 113, 113, 0.12);
}

/* ══════════════════════════════════════════════════════════════════
   ROOT
   ══════════════════════════════════════════════════════════════════ */
.gd-root {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    color: var(--text);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* ══════════════════════════════════════════════════════════════════
   HEADER
   ══════════════════════════════════════════════════════════════════ */
.gd-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.gd-header-left {
    display: flex;
    align-items: center;
    gap: 9px;
}

.gd-header-icon {
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

.gd-eyebrow {
    font-size: 9.5px;
    font-weight: 500;
    color: var(--text-soft);
    letter-spacing: 0.02em;
    margin-bottom: 1px;
    line-height: 1;
}

.gd-title {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.012em;
    color: var(--text);
    line-height: 1.15;
}

.gd-icon-btn {
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

.gd-icon-btn:hover {
    background: var(--bg-soft);
    color: var(--text);
    border-color: var(--border-strong);
}

/* ══════════════════════════════════════════════════════════════════
   CARD GENÉRICA
   ══════════════════════════════════════════════════════════════════ */
.gd-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 14px;
    transition: border-color 0.15s ease;
}

.gd-card:hover {
    border-color: var(--border-strong);
}

/* ══════════════════════════════════════════════════════════════════
   MÉTRICAS — 4 columnas
   ══════════════════════════════════════════════════════════════════ */
.gd-metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

@media (min-width: 1024px) {
    .gd-metrics {
        grid-template-columns: repeat(4, 1fr);
    }
}

.gd-metric {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
}

.gd-metric-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
}

.gd-metric-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-soft);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.gd-metric-icon {
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

.gd-metric-value-row {
    display: flex;
    align-items: baseline;
    gap: 5px;
}

.gd-metric-value {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--text);
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
}

.gd-metric-of {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-soft);
    font-variant-numeric: tabular-nums;
}

.gd-metric-foot {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 500;
    color: var(--text-soft);
}

.gd-metric-foot i {
    font-size: 8px;
    opacity: 0.6;
}

/* ══════════════════════════════════════════════════════════════════
   FILA INFERIOR
   ══════════════════════════════════════════════════════════════════ */
.gd-bottom {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    flex: 1;
    min-height: 0;
}

@media (min-width: 1024px) {
    .gd-bottom {
        grid-template-columns: 1fr 1fr;
    }
}

.gd-sync,
.gd-distrib {
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
}

/* ══════════════════════════════════════════════════════════════════
   CABECERA DE SECCIÓN
   ══════════════════════════════════════════════════════════════════ */
.gd-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-soft);
}

.gd-section-head-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.gd-section-icon {
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

.gd-section-title {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--text);
    line-height: 1.15;
}

.gd-section-sub {
    font-size: 9.5px;
    color: var(--text-soft);
    margin-top: 1px;
}

.gd-count-pill {
    font-size: 10px;
    font-weight: 500;
    color: var(--text-muted);
    background: var(--bg);
    border: 1px solid var(--border);
    padding: 2px 8px;
    border-radius: 999px;
    font-variant-numeric: tabular-nums;
}

/* ══════════════════════════════════════════════════════════════════
   SYNC BODY
   ══════════════════════════════════════════════════════════════════ */
.gd-sync-body {
    padding: 4px 14px 8px;
    display: flex;
    flex-direction: column;
}

.gd-sync-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 9px 0;
    border-bottom: 1px solid var(--border);
}

.gd-sync-row:last-child {
    border-bottom: none;
}

.gd-sync-row-left {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
}

.gd-sync-icon {
    font-size: 9px;
    color: var(--text-soft);
    width: 12px;
    text-align: center;
}

.gd-sync-label {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 500;
}

.gd-sync-value {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--text);
    font-variant-numeric: tabular-nums;
}

.gd-sync-value.is-on {
    color: var(--on);
}

.gd-sync-value.is-warn {
    color: var(--warn);
}

.gd-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
}

.gd-status-dot.is-on {
    background: var(--on);
    box-shadow: 0 0 0 2.5px var(--on-soft);
}

.gd-status-dot.is-warn {
    background: var(--warn);
    box-shadow: 0 0 0 2.5px var(--warn-soft);
}

.gd-status-dot.is-off {
    background: var(--off);
    box-shadow: 0 0 0 2.5px var(--off-soft);
}

/* ══════════════════════════════════════════════════════════════════
   DISTRIBUCIÓN POR SEDE
   ══════════════════════════════════════════════════════════════════ */
.gd-distrib-body {
    padding: 6px 14px 10px;
    overflow-y: auto;
    max-height: 240px;
}

.gd-distrib-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 0;
    border-bottom: 1px solid var(--border);
}

.gd-distrib-row:last-child {
    border-bottom: none;
}

.gd-distrib-name {
    flex: 1;
    font-size: 10.5px;
    font-weight: 500;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
}

.gd-distrib-bar {
    width: 80px;
    height: 5px;
    background: var(--bg-hover);
    border-radius: 999px;
    overflow: hidden;
    flex-shrink: 0;
}

.gd-distrib-fill {
    height: 100%;
    background: var(--brand);
    border-radius: 999px;
    transition: width 0.4s ease;
}

.gd-distrib-count {
    font-size: 11px;
    font-weight: 600;
    color: var(--text);
    width: 30px;
    text-align: right;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
}

/* ══════════════════════════════════════════════════════════════════
   EMPTY
   ══════════════════════════════════════════════════════════════════ */
.gd-empty {
    text-align: center;
    padding: 32px 12px;
    color: var(--text-soft);
    font-size: 11px;
}

.gd-empty i {
    display: block;
    font-size: 18px;
    margin-bottom: 6px;
    opacity: 0.5;
}

/* ══════════════════════════════════════════════════════════════════
   SKELETON
   ══════════════════════════════════════════════════════════════════ */
.gd-skel {
    height: 10px;
    border-radius: 3px;
    background: var(--border-strong);
    animation: gd-pulse 1.4s ease-in-out infinite;
}

.gd-skel-num {
    height: 24px;
    width: 60px;
    border-radius: 4px;
    background: var(--border-strong);
    animation: gd-pulse 1.4s ease-in-out infinite;
}

@keyframes gd-pulse {
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
