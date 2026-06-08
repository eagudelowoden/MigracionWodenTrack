<template>
    <div class="gn-root" :class="isDark ? 'gn-dark' : 'gn-light'">

        <!-- ─── HEADER ─────────────────────────────────────────────────── -->
        <header class="gn-header">
            <div class="gn-header-left">
                <div class="gn-header-icon">
                    <i class="fas fa-bell"></i>
                </div>
                <div>
                    <p class="gn-eyebrow">Avisos</p>
                    <h2 class="gn-title">Centro de notificaciones</h2>
                </div>
            </div>
            <span class="gn-count-pill">{{ notificationLogs.length }} enviados</span>
        </header>

        <div class="gn-grid">

            <!-- ─── FORMULARIO + PREVIEW ─────────────────────────────── -->
            <section class="gn-card">
                <header class="gn-section-head">
                    <div class="gn-section-head-left">
                        <div class="gn-section-icon">
                            <i class="fas fa-paper-plane"></i>
                        </div>
                        <div>
                            <p class="gn-section-title">Nuevo aviso</p>
                            <p class="gn-section-sub">Se enviará a todos los usuarios activos</p>
                        </div>
                    </div>
                </header>

                <div class="gn-form">
                    <!-- Tipo selector -->
                    <div class="gn-types">
                        <button v-for="t in TYPES" :key="t.value" @click="notif.type = t.value" class="gn-type"
                            :class="notif.type === t.value ? `is-active is-${t.value}` : ''">
                            <i :class="t.icon"></i>
                            {{ t.label }}
                        </button>
                    </div>

                    <!-- Título -->
                    <div class="gn-field">
                        <label class="gn-label">Título</label>
                        <input v-model="notif.title" type="text" placeholder="Ej: Mantenimiento programado"
                            class="gn-input" />
                    </div>

                    <!-- Mensaje -->
                    <div class="gn-field">
                        <label class="gn-label">Mensaje</label>
                        <textarea v-model="notif.body" rows="3"
                            placeholder="Describe el aviso que verán los usuarios..." class="gn-textarea"></textarea>
                    </div>

                    <!-- Preview -->
                    <div class="gn-preview" v-if="notif.title || notif.body">
                        <p class="gn-preview-label">Vista previa</p>
                        <div class="gn-preview-card">
                            <div class="gn-preview-head">
                                <span class="gn-preview-dot" :class="`is-${notif.type}`"></span>
                                <span class="gn-preview-type">{{ getTypeLabel(notif.type) }}</span>
                            </div>
                            <p class="gn-preview-title">{{ notif.title || 'Título del aviso' }}</p>
                            <p class="gn-preview-body">{{ notif.body || 'Contenido del mensaje…' }}</p>
                        </div>
                    </div>

                    <!-- Enviar -->
                    <button @click="sendNotification" :disabled="!notif.title || !notif.body" class="gn-btn-primary">
                        <i class="fas fa-paper-plane"></i>
                        Enviar aviso
                    </button>
                </div>
            </section>

            <!-- ─── HISTORIAL ─────────────────────────────────────────── -->
            <section class="gn-card">
                <header class="gn-section-head">
                    <div class="gn-section-head-left">
                        <div class="gn-section-icon">
                            <i class="fas fa-clock-rotate-left"></i>
                        </div>
                        <div>
                            <p class="gn-section-title">Historial</p>
                            <p class="gn-section-sub">Avisos enviados recientemente</p>
                        </div>
                    </div>
                    <button v-if="hayActivos" @click="deactivateAll" class="gn-btn-danger">
                        <i class="fas fa-power-off"></i>
                        Desactivar todo
                    </button>
                </header>

                <div class="gn-history custom-scroll">
                    <div v-if="loadingHistory" class="gn-empty">
                        <i class="fas fa-circle-notch fa-spin"></i>
                        Cargando historial…
                    </div>
                    <div v-else-if="!notificationLogs.length" class="gn-empty">
                        <i class="fas fa-inbox"></i>
                        Sin avisos enviados aún
                    </div>
                    <ul v-else-if="notificationLogs.length" class="gn-list">
                        <li v-for="log in notificationLogs" :key="log.id" class="gn-item">
                            <span class="gn-item-dot" :class="`is-${log.type}`"></span>
                            <div class="gn-item-info">
                                <div class="gn-item-head">
                                    <span class="gn-item-type">{{ getTypeLabel(log.type) }}</span>
                                    <span class="gn-item-date">{{ log.date }}</span>
                                </div>
                                <p class="gn-item-title">{{ log.title }}</p>
                            </div>
                            <button v-if="log.is_active" @click="deactivateNotification(log.id)" class="gn-item-status is-on"
                                title="Click para desactivar">
                                Activo
                            </button>
                            <span v-else class="gn-item-status is-off">Inactivo</span>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const props = defineProps({ isDark: Boolean, apiUrl: String });
const emit = defineEmits(['notification-sent']);

const TYPES = [
    { value: 'info', label: 'Información', icon: 'fas fa-circle-info' },
    { value: 'update', label: 'Actualización', icon: 'fas fa-arrow-up-right-from-square' },
    { value: 'alert', label: 'Alerta', icon: 'fas fa-triangle-exclamation' },
];

const notif = ref({ title: '', body: '', type: 'info' });
const notificationLogs = ref([]);
const loadingHistory = ref(false);

const hayActivos = computed(() => notificationLogs.value.some(n => n.is_active));

const getTypeLabel = (t) => TYPES.find(x => x.value === t)?.label || t;

const fetchNotificationLogs = async () => {
    try {
        loadingHistory.value = true;
        const res = await fetch(`${props.apiUrl}/notifications/history`);
        const data = await res.json();
        notificationLogs.value = data.map(n => ({
            ...n,
            date: new Date(n.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' }) +
                ' ' + new Date(n.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        }));
    } catch (e) { console.error(e); } finally {
        loadingHistory.value = false;
    }
};

const sendNotification = async () => {
    if (!notif.value.title || !notif.value.body) return;
    try {
        await axios.post(`${props.apiUrl}/notifications`, notif.value);
        notif.value = { title: '', body: '', type: 'info' };
        emit('notification-sent');
        await fetchNotificationLogs();
    } catch (e) { console.error(e); }
};

const deactivateNotification = async (id) => {
    try {
        await axios.post(`${props.apiUrl}/notifications/${id}/deactivate`);
        await fetchNotificationLogs();
    } catch (e) { console.error(e); }
};

const deactivateAll = async () => {
    try {
        await axios.post(`${props.apiUrl}/notifications/deactivate-all`);
        await fetchNotificationLogs();
    } catch (e) { console.error(e); }
};

onMounted(fetchNotificationLogs);
</script>

<style scoped>
.gn-light {
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
    --warn: #d97706;
    --warn-soft: #fffbeb;
    --warn-text: #b45309;
    --off: #dc2626;
    --off-soft: #fef2f2;
    --off-text: #b91c1c;
}

.gn-dark {
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
    --warn: #fbbf24;
    --warn-soft: rgba(251, 191, 36, 0.12);
    --warn-text: #fcd34d;
    --off: #f87171;
    --off-soft: rgba(248, 113, 113, 0.12);
    --off-text: #fca5a5;
}

.gn-root {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    color: var(--text);
    font-family: 'Inter', system-ui, sans-serif;
}

.gn-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.gn-header-left { display: flex; align-items: center; gap: 9px; }

.gn-header-icon {
    width: 30px; height: 30px; border-radius: 7px;
    background: var(--brand-soft); color: var(--brand-text);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px;
}

.gn-eyebrow { font-size: 9.5px; font-weight: 500; color: var(--text-soft); line-height: 1; margin-bottom: 1px; }
.gn-title { font-size: 14px; font-weight: 600; letter-spacing: -0.012em; line-height: 1.15; }

.gn-count-pill {
    font-size: 10px; font-weight: 500; color: var(--text-muted);
    background: var(--bg); border: 1px solid var(--border);
    padding: 3px 10px; border-radius: 999px;
    font-variant-numeric: tabular-nums;
}

.gn-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    flex: 1;
    min-height: 0;
}

@media (min-width: 1280px) {
    .gn-grid { grid-template-columns: 1fr 1fr; }
}

.gn-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 420px;
}

.gn-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 9px 12px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-soft);
}

.gn-section-head-left { display: flex; align-items: center; gap: 8px; }

.gn-section-icon {
    width: 26px; height: 26px; border-radius: 6px;
    background: var(--brand-soft); color: var(--brand-text);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px;
}

.gn-section-title { font-size: 11.5px; font-weight: 600; line-height: 1.15; }
.gn-section-sub { font-size: 9.5px; color: var(--text-soft); margin-top: 1px; }

/* FORMULARIO */
.gn-form {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
}

.gn-types {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 4px;
    padding: 3px;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: 6px;
}

.gn-type {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 5px 8px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    font-size: 10px;
    font-weight: 600;
    color: var(--text-soft);
    transition: all 0.15s ease;
    font-family: inherit;
}

.gn-type i { font-size: 9px; }
.gn-type:hover { color: var(--text); }

.gn-type.is-active.is-info { background: var(--brand-soft); color: var(--brand-text); }
.gn-type.is-active.is-info i { color: var(--brand); }
.gn-type.is-active.is-update { background: var(--on-soft); color: var(--on-text); }
.gn-type.is-active.is-update i { color: var(--on); }
.gn-type.is-active.is-alert { background: var(--off-soft); color: var(--off-text); }
.gn-type.is-active.is-alert i { color: var(--off); }

.gn-field { display: flex; flex-direction: column; }
.gn-label { font-size: 10px; font-weight: 500; color: var(--text-muted); margin-bottom: 5px; }

.gn-input,
.gn-textarea {
    width: 100%;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 7px 10px;
    font-size: 11.5px;
    color: var(--text);
    outline: none;
    transition: all 0.12s ease;
    font-family: inherit;
}

.gn-textarea { resize: vertical; min-height: 64px; line-height: 1.4; }

.gn-input::placeholder,
.gn-textarea::placeholder { color: var(--text-soft); }

.gn-input:focus,
.gn-textarea:focus {
    border-color: var(--brand);
    box-shadow: 0 0 0 2px var(--brand-soft);
}

/* PREVIEW */
.gn-preview {
    background: var(--bg-soft);
    border: 1px dashed var(--border-strong);
    border-radius: 6px;
    padding: 10px;
}

.gn-preview-label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-soft);
    margin-bottom: 7px;
}

.gn-preview-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 9px 10px;
}

.gn-preview-head { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
.gn-preview-dot { width: 6px; height: 6px; border-radius: 50%; }
.gn-preview-dot.is-info { background: var(--brand); box-shadow: 0 0 0 2.5px var(--brand-soft); }
.gn-preview-dot.is-update { background: var(--on); box-shadow: 0 0 0 2.5px var(--on-soft); }
.gn-preview-dot.is-alert { background: var(--off); box-shadow: 0 0 0 2.5px var(--off-soft); }

.gn-preview-type {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-soft);
}

.gn-preview-title { font-size: 11.5px; font-weight: 600; margin-bottom: 3px; }
.gn-preview-body { font-size: 10.5px; color: var(--text-muted); line-height: 1.4; }

.gn-btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 8px 14px;
    border-radius: 5px;
    background: var(--brand);
    color: #fff;
    border: none;
    cursor: pointer;
    font-size: 11.5px;
    font-weight: 600;
    transition: all 0.12s ease;
    font-family: inherit;
}

.gn-btn-primary i { font-size: 10px; }

.gn-btn-primary:hover:not(:disabled) {
    background: var(--brand-text);
    box-shadow: 0 3px 10px -2px rgba(37, 99, 235, 0.35);
}

.gn-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }

.gn-btn-danger {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border: 1px solid var(--off-soft);
    background: transparent;
    color: var(--off-text);
    border-radius: 5px;
    cursor: pointer;
    font-size: 10px;
    font-weight: 600;
    transition: all 0.12s ease;
    font-family: inherit;
}

.gn-btn-danger i { font-size: 9px; }

.gn-btn-danger:hover {
    background: var(--off-soft);
    border-color: var(--off);
}

/* HISTORIAL */
.gn-history {
    flex: 1;
    overflow-y: auto;
}

.gn-list {
    list-style: none;
    margin: 0;
    padding: 0;
}

.gn-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    transition: background 0.1s ease;
}

.gn-item:hover { background: var(--bg-hover); }
.gn-item:last-child { border-bottom: none; }

.gn-item-dot {
    width: 6px; height: 6px; border-radius: 50%;
    flex-shrink: 0;
}

.gn-item-dot.is-info { background: var(--brand); box-shadow: 0 0 0 2.5px var(--brand-soft); }
.gn-item-dot.is-update { background: var(--on); box-shadow: 0 0 0 2.5px var(--on-soft); }
.gn-item-dot.is-alert { background: var(--off); box-shadow: 0 0 0 2.5px var(--off-soft); }

.gn-item-info { flex: 1; min-width: 0; }

.gn-item-head {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 2px;
}

.gn-item-type {
    font-size: 8.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-soft);
}

.gn-item-date {
    font-size: 9.5px;
    color: var(--text-soft);
    font-variant-numeric: tabular-nums;
    margin-left: auto;
}

.gn-item-title {
    font-size: 11.5px;
    font-weight: 500;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.gn-item-status {
    font-size: 9px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex-shrink: 0;
    cursor: pointer;
    border: none;
    transition: all 0.12s ease;
    font-family: inherit;
}

.gn-item-status.is-on {
    background: var(--on-soft);
    color: var(--on-text);
}

.gn-item-status.is-on:hover {
    background: var(--off-soft);
    color: var(--off-text);
}

.gn-item-status.is-off {
    background: var(--bg-hover);
    color: var(--text-soft);
    cursor: default;
}

.gn-empty {
    text-align: center;
    padding: 40px 16px;
    color: var(--text-soft);
    font-size: 11px;
}

.gn-empty i {
    display: block;
    font-size: 24px;
    margin-bottom: 8px;
    opacity: 0.4;
}

.custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 999px; }
</style>
