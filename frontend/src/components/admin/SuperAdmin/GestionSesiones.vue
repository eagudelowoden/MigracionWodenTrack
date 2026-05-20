<template>
    <div class="gs-root" :class="isDark ? 'gs-dark' : 'gs-light'">

        <!-- ─── HEADER ─────────────────────────────────────────────────── -->
        <header class="gs-header">
            <div class="gs-header-left">
                <div class="gs-header-icon">
                    <i class="fas fa-shield-halved"></i>
                </div>
                <div>
                    <p class="gs-eyebrow">Sesiones</p>
                    <h2 class="gs-title">
                        {{ sesiones.length }} usuario{{ sesiones.length !== 1 ? 's' : '' }}
                        conectado{{ sesiones.length !== 1 ? 's' : '' }}
                    </h2>
                </div>
            </div>

            <div class="gs-header-right">
                <!-- Live badge -->
                <div class="gs-live-badge">
                    <span class="gs-live-dot"></span>
                    <span class="gs-live-text">En vivo</span>
                </div>
                <button @click="cargar" :disabled="cargando" class="gs-icon-btn" title="Actualizar">
                    <i class="fas fa-rotate" :class="cargando ? 'fa-spin' : ''"></i>
                </button>
            </div>
        </header>

        <!-- ─── TABLA ─────────────────────────────────────────────────── -->
        <section class="gs-card">

            <!-- Loading -->
            <div v-if="cargando" class="gs-loading">
                <i class="fas fa-circle-notch fa-spin"></i>
                <span>Cargando sesiones…</span>
            </div>

            <!-- Empty -->
            <div v-else-if="!sesiones.length" class="gs-empty">
                <i class="fas fa-users-slash"></i>
                <p class="gs-empty-title">No hay usuarios conectados</p>
                <p class="gs-empty-sub">Las nuevas sesiones aparecerán aquí en tiempo real</p>
            </div>

            <!-- Tabla -->
            <div v-else class="gs-table-body custom-scroll">
                <table class="gs-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Dispositivo</th>
                            <th>IP</th>
                            <th>Conectado</th>
                            <th>Última actividad</th>
                            <th class="gs-th-action">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="s in sesiones" :key="s.id" class="gs-tr">
                            <td>
                                <div class="gs-user">
                                    <div class="gs-avatar">
                                        <i class="fas fa-user"></i>
                                    </div>
                                    <div class="gs-user-info">
                                        <div class="gs-user-name">{{ s.nombre }}</div>
                                        <div class="gs-user-id">#{{ s.id_odoo }}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="gs-device">
                                    <i :class="deviceIcon(s.device_type)" class="gs-device-icon"></i>
                                    <span class="gs-device-name">{{ s.device_type || 'Desconocido' }}</span>
                                </div>
                            </td>
                            <td>
                                <code class="gs-ip">{{ s.ip_address || '—' }}</code>
                            </td>
                            <td class="gs-date">{{ formatFecha(s.connected_at) }}</td>
                            <td class="gs-date">{{ formatFecha(s.last_seen_at) }}</td>
                            <td class="gs-td-action">
                                <button @click="kickSesion(s)" :disabled="kickingId === s.id_odoo"
                                    class="gs-kick-btn">
                                    <i v-if="kickingId === s.id_odoo" class="fas fa-circle-notch fa-spin"></i>
                                    <template v-else>
                                        <i class="fas fa-power-off"></i>
                                        Cerrar
                                    </template>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Info footer -->
        <footer class="gs-info">
            <i class="fas fa-circle-info"></i>
            <span>
                Las sesiones se actualizan en tiempo real vía WebSocket.
                <strong>"Cerrar sesión"</strong> desconecta al usuario inmediatamente.
            </span>
        </footer>

    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

const props = defineProps({ isDark: Boolean });
const emit = defineEmits(['success', 'error']);
const API_URL = import.meta.env.VITE_API_URL;
const WS_URL = (API_URL || '').replace('/api', '') || 'http://localhost:3000';

const sesiones = ref([]);
const cargando = ref(false);
const kickingId = ref(null);

let socket = null;

const cargar = async () => {
    cargando.value = true;
    try {
        const r = await fetch(`${API_URL}/superadmin/sesiones`);
        sesiones.value = await r.json();
    } catch {
        emit('error', 'Error cargando sesiones');
    } finally {
        cargando.value = false;
    }
};

const kickSesion = async (s) => {
    if (!confirm(`¿Cerrar la sesión de ${s.nombre}?`)) return;
    kickingId.value = s.id_odoo;
    try {
        await fetch(`${API_URL}/superadmin/sesiones/kick/${s.id_odoo}`, { method: 'POST' });
        emit('success', `Sesión de ${s.nombre} cerrada`);
        await cargar();
    } catch {
        emit('error', 'Error al cerrar sesión');
    } finally {
        kickingId.value = null;
    }
};

const deviceIcon = (type) => {
    if (type === 'mobile') return 'fas fa-mobile-screen-button';
    if (type === 'tablet') return 'fas fa-tablet-screen-button';
    return 'fas fa-desktop';
};

const formatFecha = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
};

onMounted(() => {
    cargar();
    socket = io(`${WS_URL}/interno`, { transports: ['websocket'] });
    socket.on('sessions-updated', () => cargar());
});

onUnmounted(() => {
    socket?.disconnect();
});
</script>

<style scoped>
.gs-light {
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
}

.gs-dark {
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
}

.gs-root {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    color: var(--text);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* HEADER */
.gs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}

.gs-header-left {
    display: flex;
    align-items: center;
    gap: 9px;
}

.gs-header-icon {
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

.gs-eyebrow {
    font-size: 9.5px;
    font-weight: 500;
    color: var(--text-soft);
    margin-bottom: 1px;
    line-height: 1;
}

.gs-title {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.012em;
    line-height: 1.15;
}

.gs-header-right {
    display: flex;
    align-items: center;
    gap: 6px;
}

.gs-live-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--on-soft);
    color: var(--on-text);
    height: 28px;
}

.gs-live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--on);
    animation: gs-pulse 2s ease-in-out infinite;
}

@keyframes gs-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.2); }
}

.gs-live-text {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.gs-icon-btn {
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

.gs-icon-btn:hover:not(:disabled) {
    background: var(--bg-soft);
    color: var(--text);
    border-color: var(--border-strong);
}

/* CARD */
.gs-card {
    flex: 1;
    min-height: 0;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* LOADING / EMPTY */
.gs-loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: var(--text-muted);
    font-size: 12px;
}

.gs-loading i {
    color: var(--brand);
    font-size: 16px;
}

.gs-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 40px 16px;
}

.gs-empty i {
    font-size: 32px;
    color: var(--text-soft);
    opacity: 0.5;
    margin-bottom: 6px;
}

.gs-empty-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
}

.gs-empty-sub {
    font-size: 11px;
    color: var(--text-soft);
}

/* TABLA */
.gs-table-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
}

.gs-table {
    width: 100%;
    border-collapse: collapse;
}

.gs-table thead th {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg-soft);
    padding: 8px 14px;
    text-align: left;
    font-size: 9.5px;
    font-weight: 600;
    color: var(--text-soft);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-bottom: 1px solid var(--border);
}

.gs-th-action {
    text-align: center !important;
    width: 90px;
}

.gs-tr {
    border-bottom: 1px solid var(--border);
    transition: background 0.1s ease;
}

.gs-tr:hover {
    background: var(--bg-hover);
}

.gs-tr:last-child {
    border-bottom: none;
}

.gs-table td {
    padding: 9px 14px;
    font-size: 11px;
    vertical-align: middle;
}

.gs-user {
    display: flex;
    align-items: center;
    gap: 9px;
}

.gs-avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--brand-soft);
    color: var(--brand-text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9.5px;
    flex-shrink: 0;
}

.gs-user-info {
    min-width: 0;
}

.gs-user-name {
    font-size: 11.5px;
    font-weight: 500;
    color: var(--text);
    line-height: 1.25;
}

.gs-user-id {
    font-size: 9.5px;
    color: var(--text-soft);
    margin-top: 1px;
    font-variant-numeric: tabular-nums;
}

.gs-device {
    display: flex;
    align-items: center;
    gap: 6px;
}

.gs-device-icon {
    color: var(--text-soft);
    font-size: 11px;
    width: 14px;
    text-align: center;
}

.gs-device-name {
    font-size: 11px;
    color: var(--text-muted);
    text-transform: capitalize;
}

.gs-ip {
    font-family: ui-monospace, monospace;
    font-size: 10px;
    color: var(--text-soft);
    background: var(--bg-soft);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid var(--border);
}

.gs-date {
    font-size: 10.5px;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.gs-td-action {
    text-align: center;
}

.gs-kick-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    height: 24px;
    border-radius: 5px;
    background: var(--off-soft);
    color: var(--off-text);
    border: none;
    cursor: pointer;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    transition: all 0.12s ease;
    font-family: inherit;
}

.gs-kick-btn i {
    font-size: 9px;
}

.gs-kick-btn:hover:not(:disabled) {
    background: var(--off);
    color: #fff;
}

.gs-kick-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* INFO FOOTER */
.gs-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 14px;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 10.5px;
    color: var(--text-muted);
    line-height: 1.4;
    flex-shrink: 0;
}

.gs-info i {
    color: var(--brand);
    font-size: 11px;
    flex-shrink: 0;
}

.gs-info strong {
    color: var(--text);
    font-weight: 600;
}

/* SCROLLBAR */
.custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 999px; }
.custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--text-soft); }
</style>
