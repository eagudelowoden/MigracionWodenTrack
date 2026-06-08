<template>
    <Transition name="fade">
        <div v-if="modelValue" class="gp-overlay" :class="isDark ? 'gp-overlay-dark' : 'gp-overlay-light'"
            @click.self="emit('update:modelValue', null)">

            <Transition name="modal" appear>
                <div v-if="modelValue" class="gp-modal" :class="isDark ? 'gp-modal-dark' : 'gp-modal-light'">

                    <!-- ── HEADER ──────────────────── -->
                    <header class="gp-header">
                        <div class="gp-header-icon">
                            <i class="fas fa-key"></i>
                        </div>
                        <div class="gp-header-info">
                            <p class="gp-eyebrow">Permisos del usuario</p>
                            <h3 class="gp-title">{{ modelValue.nombre }}</h3>
                        </div>
                        <button @click="emit('update:modelValue', null)" class="gp-close" aria-label="Cerrar">
                            <i class="fas fa-times"></i>
                        </button>
                    </header>

                    <!-- ── META: resumen + acción ────── -->
                    <div class="gp-meta">
                        <div class="gp-meta-text">
                            <span class="gp-meta-dot" :class="totalAsignados > 0 ? 'is-on' : ''"></span>
                            <span class="gp-meta-count">{{ totalAsignados }}</span>
                            <span class="gp-meta-of">/ {{ totalPermisos }}</span>
                            <span class="gp-meta-label">permisos activos</span>
                        </div>
                        <button @click="toggleAll" class="gp-link">
                            <i class="fas text-[10px] mr-1"
                                :class="allOpen ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                            {{ allOpen ? 'Colapsar' : 'Expandir' }} todo
                        </button>
                    </div>

                    <!-- ── BODY ─────────────────────── -->
                    <div class="gp-body custom-scroll">

                        <!-- Estructura organizacional -->
                        <section class="gp-section">
                            <p class="gp-section-label">
                                <i class="fas fa-sitemap"></i>
                                Estructura organizacional
                            </p>
                            <div class="gp-grid-2">
                                <div class="gp-field">
                                    <label class="gp-field-label">Área</label>
                                    <div class="gp-select-wrap">
                                        <select v-model="modelValue.area_id"
                                            @change="emit('update-structure', { user: modelValue, field: 'area_id' })"
                                            class="gp-select">
                                            <option :value="null">Sin área</option>
                                            <option v-for="a in areas" :key="a.id" :value="a.id">{{ a.nombre }}</option>
                                        </select>
                                        <i class="fas fa-chevron-down gp-select-chev"></i>
                                    </div>
                                </div>
                                <div class="gp-field">
                                    <label class="gp-field-label">Segmento</label>
                                    <div class="gp-select-wrap">
                                        <select v-model="modelValue.segmento_id"
                                            @change="emit('update-structure', { user: modelValue, field: 'segmento_id' })"
                                            class="gp-select">
                                            <option :value="null">Sin segmento</option>
                                            <option v-for="s in segmentos" :key="s.id" :value="s.id">{{ s.nombre }}
                                            </option>
                                        </select>
                                        <i class="fas fa-chevron-down gp-select-chev"></i>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <!-- Sin módulos cargados aún -->
                        <div v-if="SECTIONS.length === 0" class="gp-empty-modules">
                            <i class="fas fa-circle-notch fa-spin" style="color:#3b82f6"></i>
                            <span>Cargando módulos…</span>
                        </div>

                        <!-- Secciones de permisos -->
                        <section v-for="section in SECTIONS" :key="section.key" class="gp-section">
                            <button @click="toggleSection(section.key)" class="gp-section-head">
                                <div class="gp-section-head-left">
                                    <span class="gp-section-icon">
                                        <i :class="section.icon"></i>
                                    </span>
                                    <span class="gp-section-title">{{ section.title }}</span>
                                    <span class="gp-section-count"
                                        :class="section.slugs.filter(s => hasPerm(s)).length > 0 ? 'is-on' : ''">
                                        {{ section.slugs.filter(s => hasPerm(s)).length }} de {{ section.slugs.length }}
                                    </span>
                                </div>
                                <i class="fas fa-chevron-down gp-section-chev"
                                    :class="openSections[section.key] ? 'is-open' : ''"></i>
                            </button>

                            <Transition name="accordion">
                                <ul v-if="openSections[section.key]" class="gp-perm-list">
                                    <li v-for="slug in section.slugs" :key="slug" class="gp-perm-row"
                                        :class="hasPerm(slug) ? 'is-active' : ''">
                                        <div class="gp-perm-info">
                                            <div class="gp-perm-title-row">
                                                <span class="gp-perm-name">
                                                    {{ MODULO_LABELS[slug]?.nombre ?? slug }}
                                                </span>
                                                <span v-if="MODULO_LABELS[slug]?.scope" class="gp-scope-tag">
                                                    <i class="fas fa-globe text-[8px]"></i>
                                                    scope
                                                </span>
                                            </div>
                                            <p class="gp-perm-desc">
                                                {{ MODULO_LABELS[slug]?.desc ?? 'Acceso al módulo' }}
                                            </p>
                                        </div>
                                        <label class="gp-toggle">
                                            <input type="checkbox" :checked="hasPerm(slug)"
                                                @change="emit('toggle-perm', { user: modelValue, slug })"
                                                class="gp-toggle-input">
                                            <span class="gp-toggle-track">
                                                <span class="gp-toggle-thumb"></span>
                                            </span>
                                        </label>
                                    </li>
                                </ul>
                            </Transition>
                        </section>

                        <!-- Departamentos visibles -->
                        <section v-if="hasPerm('admin.filtro_departamento') || hasPerm('novedades.director')"
                            class="gp-section">
                            <div class="gp-section-head gp-section-head-static">
                                <div class="gp-section-head-left">
                                    <span class="gp-section-icon">
                                        <i class="fas fa-building"></i>
                                    </span>
                                    <span class="gp-section-title">Departamentos visibles</span>
                                    <span class="gp-section-count"
                                        :class="deptosSeleccionados.length > 0 ? 'is-on' : ''">
                                        {{ deptosSeleccionados.length }} activos
                                    </span>
                                </div>
                            </div>
                            <p class="gp-section-help">Restringe qué departamentos puede consultar el usuario.</p>

                            <div class="gp-dept-grid custom-scroll">
                                <template v-if="todosLosDepartamentos?.length">
                                    <label v-for="dept in todosLosDepartamentos" :key="dept" class="gp-dept-item"
                                        :class="deptosSeleccionados.includes(dept) ? 'is-active' : ''">
                                        <input type="checkbox" :checked="deptosSeleccionados.includes(dept)"
                                            @change="toggleDept(dept)" class="sr-only">
                                        <span class="gp-dept-check">
                                            <i v-if="deptosSeleccionados.includes(dept)" class="fas fa-check"></i>
                                        </span>
                                        <span class="gp-dept-name">{{ dept }}</span>
                                    </label>
                                </template>
                                <div v-else class="gp-dept-empty">Sin departamentos disponibles</div>
                            </div>

                            <button @click="guardarDeptos" :disabled="isSavingDeptos" class="gp-btn-secondary">
                                <i class="fas" :class="isSavingDeptos ? 'fa-circle-notch fa-spin' : 'fa-save'"></i>
                                {{ isSavingDeptos ? 'Guardando…' : 'Guardar departamentos' }}
                            </button>
                        </section>

                    </div>

                    <!-- ── FOOTER ──────────────────── -->
                    <footer class="gp-footer">
                        <button @click="emit('update:modelValue', null)" class="gp-btn-primary">
                            Listo
                        </button>
                    </footer>
                </div>
            </Transition>
        </div>
    </Transition>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
    modelValue: Object,
    isDark: Boolean,
    areas: Array,
    segmentos: Array,
    todosLosDepartamentos: Array,
    apiUrl: String,
});

const emit = defineEmits(['update:modelValue', 'toggle-perm', 'update-structure']);

// ── Módulos cargados desde DB ────────────────────────────────────────────────
const SECTIONS = ref([]);
const MODULO_LABELS = ref({});

const cargarModulos = async () => {
    try {
        const baseUrl = props.apiUrl?.replace('/usuarios', '');
        const res = await fetch(`${baseUrl}/modulos-disponibles/agrupados`);
        const agrupados = await res.json();

        const labels = {};
        const sections = Object.entries(agrupados).map(([key, grupo]) => {
            for (const m of grupo.modulos) {
                labels[m.slug] = { nombre: m.nombre, desc: m.descripcion ?? '', scope: m.es_scope };
            }
            return {
                key,
                title: grupo.label,
                icon: grupo.icon,
                slugs: grupo.modulos.map(m => m.slug),
            };
        });

        SECTIONS.value = sections;
        MODULO_LABELS.value = labels;

        // Inicializar openSections con la primera sección abierta
        const init = {};
        sections.forEach((s, i) => { init[s.key] = i === 0; });
        openSections.value = init;
    } catch {
        // Si falla, dejamos las secciones vacías — el usuario verá un aviso
    }
};

const handleEscapePerms = (e) => {
    if (e.key === 'Escape' && props.modelValue) emit('update:modelValue', null);
};

onMounted(() => {
    cargarModulos();
    document.addEventListener('keydown', handleEscapePerms);
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleEscapePerms);
});

// ── Estado de UI ─────────────────────────────────────────────────────────────
const deptosSeleccionados = ref([]);
const isSavingDeptos = ref(false);
const openSections = ref({});

const toggleSection = (key) => { openSections.value[key] = !openSections.value[key]; };
const allOpen = computed(() => SECTIONS.value.every(s => openSections.value[s.key]));
const toggleAll = () => {
    const target = !allOpen.value;
    SECTIONS.value.forEach(s => { openSections.value[s.key] = target; });
};

const totalPermisos = computed(() => SECTIONS.value.reduce((acc, s) => acc + s.slugs.length, 0));
const totalAsignados = computed(() =>
    SECTIONS.value.reduce((acc, s) => acc + s.slugs.filter(slug => hasPerm(slug)).length, 0)
);

watch(() => props.modelValue, async (user) => {
    if (!user) return;
    // Reabrir solo la primera sección al cambiar de usuario
    const init = {};
    SECTIONS.value.forEach((s, i) => { init[s.key] = i === 0; });
    openSections.value = init;
    try {
        const res = await fetch(`${props.apiUrl}/departamentos-permitidos/${user.id_odoo}`);
        const data = await res.json();
        deptosSeleccionados.value = Array.isArray(data) ? data : [];
    } catch {
        deptosSeleccionados.value = [];
    }
}, { immediate: true });

const hasPerm = (slug) => {
    if (!props.modelValue?.permisos) return false;
    return props.modelValue.permisos.some(p => p.modulos === slug);
};

const toggleDept = (dept) => {
    const idx = deptosSeleccionados.value.indexOf(dept);
    if (idx === -1) deptosSeleccionados.value.push(dept);
    else deptosSeleccionados.value.splice(idx, 1);
};

const guardarDeptos = async () => {
    isSavingDeptos.value = true;
    try {
        const session = JSON.parse(localStorage.getItem('user_session') || '{}');
        await fetch(`${props.apiUrl}/departamentos-permitidos/${props.modelValue.id_odoo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                departamentos: deptosSeleccionados.value,
                adminName: session.name || 'Desconocido',
            }),
        });
    } finally {
        isSavingDeptos.value = false;
    }
};
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════════
   VARIABLES — paleta neutra + un acento de marca (índigo) + verde "on"
   Inspirada en Stripe / Linear / GitHub
   ══════════════════════════════════════════════════════════════════ */
.gp-modal-light {
    --bg: #ffffff;
    --bg-soft: #fafafa;
    --bg-active: #f4f4f5;
    --border: #ececec;
    --border-strong: #e2e2e2;
    --text: #09090b;
    --text-muted: #52525b;
    --text-soft: #a1a1aa;
    /* Acento ultra-sobrio: gris pizarra (casi neutro) */
    --brand: #52525b;
    --brand-soft: #f4f4f5;
    --brand-text: #27272a;
    /* Verde funcional */
    --on: #16a34a;
    --on-soft: #f0fdf4;
    --on-text: #15803d;
    --danger: #dc2626;
}

.gp-empty-modules {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px;
    font-size: 12px;
    color: #8b9ab4;
}

.gp-modal-dark {
    --bg: #161B26;
    --bg-soft: #0B0F19;
    --bg-active: #1f1f23;
    --border: #222938;
    --border-strong: #2A3245;
    --text: #fafafa;
    --text-muted: #B0B7C3;
    --text-soft: #888888;
    /* Gris ZINC puro neutro */
    --brand: #d4d4d8;
    --brand-soft: rgba(212, 212, 216, 0.08);
    --brand-text: #e4e4e7;
    --on: #4ade80;
    --on-soft: rgba(74, 222, 128, 0.12);
    --on-text: #86efac;
    --danger: #f87171;
}

/* ══════════════════════════════════════════════════════════════════
   OVERLAY
   ══════════════════════════════════════════════════════════════════ */
.gp-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
}

.gp-overlay-dark { background: rgba(0, 0, 0, 0.6); }
.gp-overlay-light { background: rgba(0, 0, 0, 0.35); }

/* ══════════════════════════════════════════════════════════════════
   MODAL — clean, minimalista
   ══════════════════════════════════════════════════════════════════ */
.gp-modal {
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    background: var(--bg);
    color: var(--text);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 50px -15px rgba(0, 0, 0, 0.25);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* ══════════════════════════════════════════════════════════════════
   HEADER
   ══════════════════════════════════════════════════════════════════ */
.gp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 22px 24px 16px;
    flex-shrink: 0;
}

.gp-header-icon {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    background: var(--brand-soft);
    color: var(--brand-text);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 14px;
}

.gp-header-info {
    flex: 1;
    min-width: 0;
}

.gp-eyebrow {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-soft);
    letter-spacing: 0.02em;
    margin-bottom: 4px;
}

.gp-title {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.015em;
    line-height: 1.25;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.gp-close {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--text-soft);
    cursor: pointer;
    transition: all 0.12s ease;
    font-size: 14px;
    flex-shrink: 0;
}

.gp-close:hover {
    background: var(--accent-soft);
    color: var(--text);
}

/* ══════════════════════════════════════════════════════════════════
   META
   ══════════════════════════════════════════════════════════════════ */
.gp-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px 16px;
    flex-shrink: 0;
}

.gp-meta-text {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
}

.gp-meta-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--border-strong);
    flex-shrink: 0;
    transition: background 0.18s ease;
}

.gp-meta-dot.is-on {
    background: var(--on);
    box-shadow: 0 0 0 3px var(--on-soft);
}

.gp-meta-count {
    font-weight: 600;
    color: var(--text);
    font-variant-numeric: tabular-nums;
}

.gp-meta-of {
    color: var(--text-soft);
    font-weight: 500;
}

.gp-meta-label {
    color: var(--text-muted);
    margin-left: 6px;
    font-size: 12px;
}

.gp-link {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px 0;
    transition: color 0.12s ease;
}

.gp-link:hover {
    color: var(--text);
    text-decoration: underline;
    text-underline-offset: 3px;
}

/* ══════════════════════════════════════════════════════════════════
   BODY — separadores horizontales finos
   ══════════════════════════════════════════════════════════════════ */
.gp-body {
    flex: 1;
    overflow-y: auto;
    padding: 0;
    border-top: 1px solid var(--border);
}

/* ══════════════════════════════════════════════════════════════════
   SECCIÓN — sin caja, solo separador entre ellas
   ══════════════════════════════════════════════════════════════════ */
.gp-section {
    padding: 18px 24px;
    border-bottom: 1px solid var(--border);
}

.gp-section:last-child {
    border-bottom: none;
}

.gp-section-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 12px;
    letter-spacing: 0.01em;
    display: flex;
    align-items: center;
    gap: 7px;
    text-transform: uppercase;
}

.gp-section-label i {
    font-size: 11px;
    color: var(--brand);
}

/* Cabecera de acordeón */
.gp-section-head {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    color: var(--text);
}

.gp-section-head-static {
    cursor: default;
}

.gp-section-head-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.gp-section-icon {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    background: var(--brand-soft);
    color: var(--brand-text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    flex-shrink: 0;
}

.gp-section-title {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.005em;
    color: var(--text);
}

.gp-section-count {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-soft);
    font-variant-numeric: tabular-nums;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--bg-soft);
    transition: all 0.15s ease;
}

.gp-section-count.is-on {
    background: var(--on-soft);
    color: var(--on-text);
}

.gp-section-help {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 4px;
    margin-bottom: 14px;
    line-height: 1.45;
}

.gp-section-chev {
    font-size: 11px;
    color: var(--text-soft);
    transition: transform 0.2s ease;
    flex-shrink: 0;
}

.gp-section-chev.is-open {
    transform: rotate(180deg);
}

/* ══════════════════════════════════════════════════════════════════
   GRID 2 COLUMNAS (selects)
   ══════════════════════════════════════════════════════════════════ */
.gp-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.gp-field-label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    color: var(--text-muted);
    margin-bottom: 6px;
}

.gp-select-wrap {
    position: relative;
}

.gp-select {
    width: 100%;
    appearance: none;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 9px 32px 9px 12px;
    font-size: 13px;
    color: var(--text);
    font-family: inherit;
    cursor: pointer;
    outline: none;
    transition: border-color 0.12s ease;
}

.gp-select:hover {
    border-color: var(--border-strong);
}

.gp-select:focus {
    border-color: var(--accent);
}

.gp-select-chev {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 10px;
    color: var(--text-soft);
    pointer-events: none;
}

/* ══════════════════════════════════════════════════════════════════
   LISTA DE PERMISOS
   ══════════════════════════════════════════════════════════════════ */
.gp-perm-list {
    list-style: none;
    padding: 0;
    margin: 12px 0 0;
}

.gp-perm-row {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 12px 10px;
    border-top: 1px solid var(--border);
    margin: 0 -10px;
    border-radius: 6px;
    transition: background 0.12s ease;
}

.gp-perm-row:hover {
    background: var(--bg-soft);
}

.gp-perm-row:first-child {
    border-top: none;
    padding-top: 6px;
}

.gp-perm-info {
    flex: 1;
    min-width: 0;
}

.gp-perm-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.gp-perm-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    line-height: 1.3;
}

.gp-scope-tag {
    font-size: 10px;
    font-weight: 500;
    color: var(--brand-text);
    padding: 2px 7px;
    border-radius: 4px;
    background: var(--brand-soft);
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.gp-perm-desc {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 4px;
    line-height: 1.45;
    max-width: 320px;
}

/* ══════════════════════════════════════════════════════════════════
   TOGGLE — minimal, monocromático
   ══════════════════════════════════════════════════════════════════ */
.gp-toggle {
    position: relative;
    display: inline-flex;
    cursor: pointer;
    flex-shrink: 0;
    margin-top: 2px;
}

.gp-toggle-input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
}

.gp-toggle-track {
    width: 32px;
    height: 18px;
    border-radius: 999px;
    background: var(--border-strong);
    position: relative;
    transition: background 0.18s ease;
    display: block;
}

.gp-toggle-input:checked + .gp-toggle-track {
    background: var(--on);
}

.gp-toggle-input:focus-visible + .gp-toggle-track {
    box-shadow: 0 0 0 3px var(--on-soft);
}

.gp-toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    transition: transform 0.18s ease;
}

.gp-toggle-input:checked + .gp-toggle-track .gp-toggle-thumb {
    transform: translateX(14px);
}

/* ══════════════════════════════════════════════════════════════════
   DEPARTAMENTOS
   ══════════════════════════════════════════════════════════════════ */
.gp-dept-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    max-height: 160px;
    overflow-y: auto;
    margin-bottom: 14px;
    padding-right: 4px;
}

.gp-dept-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.12s ease;
}

.gp-dept-item:hover {
    background: var(--bg-soft);
}

.gp-dept-item.is-active {
    background: var(--brand-soft);
}

.gp-dept-check {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    border: 1px solid var(--border-strong);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.12s ease;
}

.gp-dept-item.is-active .gp-dept-check {
    background: var(--brand);
    border-color: var(--brand);
}

.gp-dept-item.is-active .gp-dept-check i { color: #fff; }

.gp-dept-check i {
    font-size: 8px;
}

.gp-dept-name {
    font-size: 12px;
    color: var(--text);
    font-weight: 400;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.gp-dept-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 20px 0;
    font-size: 12px;
    color: var(--text-soft);
}

/* ══════════════════════════════════════════════════════════════════
   BOTONES
   ══════════════════════════════════════════════════════════════════ */
.gp-btn-primary {
    width: 100%;
    padding: 10px 14px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    background: var(--brand);
    color: #fff;
    transition: all 0.12s ease;
    font-family: inherit;
    letter-spacing: 0.01em;
}

.gp-btn-primary:hover {
    background: var(--brand-text);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px -2px rgba(79, 70, 229, 0.3);
}

.gp-btn-primary:active {
    transform: translateY(0);
}

.gp-btn-secondary {
    width: 100%;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid var(--border-strong);
    background: var(--bg);
    color: var(--text);
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.12s ease;
    font-family: inherit;
}

.gp-btn-secondary:hover:not(:disabled) {
    background: var(--bg-soft);
}

.gp-btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.gp-btn-secondary i {
    font-size: 11px;
    color: var(--text-muted);
}

/* ══════════════════════════════════════════════════════════════════
   FOOTER
   ══════════════════════════════════════════════════════════════════ */
.gp-footer {
    padding: 16px 24px 20px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
    background: var(--bg);
}

/* ══════════════════════════════════════════════════════════════════
   SCROLLBAR sutil
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

/* ══════════════════════════════════════════════════════════════════
   TRANSICIONES
   ══════════════════════════════════════════════════════════════════ */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.modal-enter-active {
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-leave-active {
    transition: all 0.15s ease;
}

.modal-enter-from {
    opacity: 0;
    transform: translateY(8px);
}

.modal-leave-to {
    opacity: 0;
}

.accordion-enter-active,
.accordion-leave-active {
    transition: max-height 0.22s ease, opacity 0.18s ease;
    overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
    max-height: 0;
    opacity: 0;
}

.accordion-enter-to,
.accordion-leave-from {
    max-height: 800px;
    opacity: 1;
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
</style>
