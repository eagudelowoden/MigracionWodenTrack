<template>
    <div class="ge-root" :class="isDark ? 'ge-dark' : 'ge-light'">

        <!-- ─── HEADER ─────────────────────────────────────────────────── -->
        <header class="ge-header">
            <div class="ge-header-left">
                <div class="ge-header-icon">
                    <i class="fas fa-sitemap"></i>
                </div>
                <div>
                    <p class="ge-eyebrow">Organización</p>
                    <h2 class="ge-title">Estructura organizacional</h2>
                </div>
            </div>
            <button @click="recargar" :disabled="isReloading" class="ge-icon-btn" title="Recargar">
                <i class="fas fa-rotate" :class="isReloading ? 'fa-spin' : ''"></i>
            </button>
        </header>

        <div class="ge-grid">

            <!-- ═══ FORMULARIO NUEVO ═══ -->
            <section class="ge-card">
                <header class="ge-section-head">
                    <div class="ge-section-head-left">
                        <div class="ge-section-icon">
                            <i class="fas fa-plus"></i>
                        </div>
                        <div>
                            <p class="ge-section-title">Registrar nueva unidad</p>
                            <p class="ge-section-sub">Crea áreas o segmentos</p>
                        </div>
                    </div>
                </header>

                <div class="ge-form">
                    <!-- TIPO TOGGLE -->
                    <div class="ge-toggle-group">
                        <button @click="form.tipo = 'area'" class="ge-toggle"
                            :class="form.tipo === 'area' ? 'is-active' : ''">
                            <i class="fas fa-folder"></i>
                            Área
                        </button>
                        <button @click="form.tipo = 'segmento'" class="ge-toggle"
                            :class="form.tipo === 'segmento' ? 'is-active' : ''">
                            <i class="fas fa-building"></i>
                            Segmento
                        </button>
                    </div>

                    <!-- NOMBRE -->
                    <div class="ge-field">
                        <label class="ge-label">
                            Nombre del {{ form.tipo === 'area' ? 'área' : 'segmento' }}
                        </label>
                        <input v-model="form.nombre" type="text" placeholder="Ej: Móviles, Laboratorio..."
                            class="ge-input" />
                    </div>

                    <!-- SEGMENTO/DEPARTAMENTO (solo áreas) -->
                    <div v-if="form.tipo === 'area'" class="ge-field">
                        <label class="ge-label">Segmento al que pertenece</label>
                        <div class="ge-select-wrap">
                            <select v-model="form.departamento" class="ge-select">
                                <option value="">— Sin segmento —</option>
                                <option v-for="d in deptosReales" :key="d" :value="d">{{ d }}</option>
                            </select>
                            <i class="fas fa-chevron-down ge-select-chev"></i>
                        </div>
                        <p class="ge-help">Segmentos registrados en maestro_segmentos</p>
                    </div>

                    <!-- RESPONSABLE -->
                    <div class="ge-field ge-field-search">
                        <label class="ge-label">Responsable (jefe)</label>
                        <div class="ge-search">
                            <i class="fas fa-search ge-search-icon"></i>
                            <input type="text" v-model="searchQuery" @focus="showDropdown = true"
                                placeholder="Buscar por nombre o cargo..." class="ge-input ge-input-search" />
                        </div>
                        <div v-if="showDropdown && searchQuery" class="ge-dropdown">
                            <div class="ge-dropdown-list custom-scroll">
                                <button v-for="u in filteredUsers" :key="u.id" @click="selectUser(u)"
                                    class="ge-dropdown-item">
                                    <div class="ge-dropdown-name">{{ u.nombre }}</div>
                                    <div class="ge-dropdown-cargo">{{ u.cargo || 'Sin cargo' }}</div>
                                </button>
                                <div v-if="!filteredUsers.length" class="ge-dropdown-empty">Sin resultados</div>
                            </div>
                        </div>
                        <div v-if="showDropdown" @click="showDropdown = false" class="ge-overlay"></div>
                    </div>

                    <button @click="submitForm" :disabled="!form.nombre || !form.responsableId" class="ge-btn-primary">
                        <i class="fas fa-check"></i>
                        Confirmar y guardar
                    </button>
                </div>
            </section>

            <!-- ═══ LISTA AGRUPADA CON EDICIÓN ═══ -->
            <section class="ge-card">
                <header class="ge-section-head">
                    <div class="ge-section-head-left">
                        <div class="ge-section-icon">
                            <i class="fas fa-list-tree"></i>
                        </div>
                        <div>
                            <p class="ge-section-title">Estructura activa</p>
                            <p class="ge-section-sub">Clic en un área para editar</p>
                        </div>
                    </div>
                    <span class="ge-count-pill">
                        {{ totalUnidades }} unidades
                    </span>
                </header>

                <div class="ge-list custom-scroll">

                    <!-- ÁREAS AGRUPADAS POR DEPARTAMENTO -->
                    <template v-if="Object.keys(areasAgrupadasLocal).length">
                        <div v-for="(areasList, depto) in areasAgrupadasLocal" :key="depto" class="ge-group">
                            <div class="ge-group-head">
                                <i class="fas fa-folder-tree ge-group-icon"></i>
                                <span class="ge-group-name">{{ depto }}</span>
                                <span class="ge-group-count">{{ areasList.length }}</span>
                                <div class="ge-group-line"></div>
                            </div>

                            <div v-for="area in areasList" :key="'a-' + area.id" class="ge-item-wrap">
                                <!-- Vista normal -->
                                <button v-if="editingAreaId !== area.id" class="ge-item" @click="startEditArea(area)">
                                    <span class="ge-item-dot"></span>
                                    <div class="ge-item-info">
                                        <div class="ge-item-name">{{ area.nombre }}</div>
                                        <div class="ge-item-meta">
                                            <i class="fas fa-user-tie"></i>
                                            {{ area.responsable?.nombre || 'Sin asignar' }}
                                        </div>
                                    </div>
                                    <i class="fas fa-pen ge-item-edit"></i>
                                </button>

                                <!-- Modo edición -->
                                <div v-else class="ge-edit-card">
                                    <div class="ge-edit-head">
                                        <span class="ge-edit-title">
                                            <i class="fas fa-pen-to-square"></i>
                                            Editando: {{ area.nombre }}
                                        </span>
                                        <button @click="cancelEdit" class="ge-edit-close">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>

                                    <div class="ge-field">
                                        <label class="ge-label">Segmento</label>
                                        <div class="ge-select-wrap">
                                            <select v-model="editForm.departamento" class="ge-select">
                                                <option value="">— Sin segmento —</option>
                                                <option v-for="d in deptosReales" :key="d" :value="d">{{ d }}</option>
                                            </select>
                                            <i class="fas fa-chevron-down ge-select-chev"></i>
                                        </div>
                                    </div>

                                    <div class="ge-field ge-field-search">
                                        <label class="ge-label">Jefe del área</label>
                                        <div class="ge-search">
                                            <i class="fas fa-search ge-search-icon"></i>
                                            <input type="text" v-model="editSearchQuery"
                                                @focus="showEditDropdown = true"
                                                :placeholder="area.responsable?.nombre || 'Buscar responsable...'"
                                                class="ge-input ge-input-search" />
                                        </div>
                                        <div v-if="showEditDropdown && editSearchQuery" class="ge-dropdown">
                                            <div class="ge-dropdown-list custom-scroll">
                                                <button v-for="u in filteredEditUsers" :key="u.id"
                                                    @click="selectEditUser(u)" class="ge-dropdown-item">
                                                    <div class="ge-dropdown-name">{{ u.nombre }}</div>
                                                    <div class="ge-dropdown-cargo">{{ u.cargo || 'Sin cargo' }}</div>
                                                </button>
                                                <div v-if="!filteredEditUsers.length" class="ge-dropdown-empty">Sin
                                                    resultados</div>
                                            </div>
                                        </div>
                                        <div v-if="showEditDropdown" @click="showEditDropdown = false"
                                            class="ge-overlay"></div>
                                    </div>

                                    <div class="ge-edit-actions">
                                        <button @click="saveEdit(area.id)" class="ge-btn-primary ge-btn-flex">
                                            <i class="fas fa-save"></i>
                                            Guardar
                                        </button>
                                        <button @click="cancelEdit" class="ge-btn-secondary">
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- Áreas sin departamento -->
                    <div v-if="!Object.keys(areasAgrupadasLocal).length && props.areas?.length" class="ge-group">
                        <div class="ge-group-head">
                            <i class="fas fa-circle-question ge-group-icon"></i>
                            <span class="ge-group-name">Sin clasificar</span>
                            <span class="ge-group-count">{{ props.areas.length }}</span>
                            <div class="ge-group-line"></div>
                        </div>
                        <div v-for="area in props.areas" :key="'ua-' + area.id" class="ge-item-wrap">
                            <button class="ge-item" @click="startEditArea(area)">
                                <span class="ge-item-dot"></span>
                                <div class="ge-item-info">
                                    <div class="ge-item-name">{{ area.nombre }}</div>
                                    <div class="ge-item-meta">
                                        <i class="fas fa-user-tie"></i>
                                        {{ area.responsable?.nombre || 'Sin asignar' }}
                                    </div>
                                </div>
                                <i class="fas fa-pen ge-item-edit"></i>
                            </button>
                        </div>
                    </div>

                    <!-- SEGMENTOS -->
                    <template v-if="props.segmentos?.length">
                        <div class="ge-group">
                            <div class="ge-group-head">
                                <i class="fas fa-building ge-group-icon"></i>
                                <span class="ge-group-name">Segmentos</span>
                                <span class="ge-group-count">{{ props.segmentos.length }}</span>
                                <div class="ge-group-line"></div>
                            </div>
                            <div v-for="seg in props.segmentos" :key="'s-' + seg.id" class="ge-item-wrap">
                                <div class="ge-item ge-item-static">
                                    <span class="ge-item-dot ge-item-dot-on"></span>
                                    <div class="ge-item-info">
                                        <div class="ge-item-name">{{ seg.nombre }}</div>
                                        <div class="ge-item-meta">
                                            <i class="fas fa-user-tie"></i>
                                            {{ seg.responsable?.nombre || 'Sin asignar' }}
                                        </div>
                                    </div>
                                    <span class="ge-item-tag">Segmento</span>
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- Empty state -->
                    <div v-if="!Object.keys(areasAgrupadasLocal).length && !props.areas?.length && !props.segmentos?.length"
                        class="ge-empty">
                        <i class="fas fa-folder-open"></i>
                        Sin unidades registradas
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    usuarios: Array,
    areas: Array,
    segmentos: Array,
    areasAgrupadas: Object,
    departamentosDisponibles: Array,
    isDark: Boolean,
});

const emit = defineEmits(['save', 'update-area', 'refresh']);

const isReloading = ref(false);
const recargar = async () => {
    isReloading.value = true;
    emit('refresh');
    setTimeout(() => { isReloading.value = false; }, 800);
};

const searchQuery = ref('');
const showDropdown = ref(false);
const form = ref({ tipo: 'area', nombre: '', departamento: '', responsableId: null });

const editingAreaId = ref(null);
const editForm = ref({ departamento: '', responsableId: null });
const editSearchQuery = ref('');
const showEditDropdown = ref(false);

const deptosReales = computed(() => props.departamentosDisponibles || []);
const areasAgrupadasLocal = computed(() => props.areasAgrupadas || {});

const totalUnidades = computed(() =>
    (props.areas?.length || 0) + (props.segmentos?.length || 0)
);

const filteredUsers = computed(() => {
    if (!searchQuery.value) return [];
    const q = searchQuery.value.toLowerCase();
    return (props.usuarios || []).filter(u =>
        u.nombre?.toLowerCase().includes(q) || u.cargo?.toLowerCase().includes(q)
    );
});

const filteredEditUsers = computed(() => {
    if (!editSearchQuery.value) return [];
    const q = editSearchQuery.value.toLowerCase();
    return (props.usuarios || []).filter(u =>
        u.nombre?.toLowerCase().includes(q) || u.cargo?.toLowerCase().includes(q)
    );
});

const selectUser = (user) => {
    form.value.responsableId = user.id;
    searchQuery.value = user.nombre;
    showDropdown.value = false;
};

const submitForm = () => {
    emit('save', { ...form.value });
    form.value.nombre = '';
    form.value.departamento = '';
    form.value.responsableId = null;
    searchQuery.value = '';
};

const startEditArea = (area) => {
    editingAreaId.value = area.id;
    editForm.value = {
        departamento: area.departamento || '',
        responsableId: area.responsable?.id || null,
    };
    editSearchQuery.value = '';
};

const cancelEdit = () => {
    editingAreaId.value = null;
    editSearchQuery.value = '';
};

const selectEditUser = (user) => {
    editForm.value.responsableId = user.id;
    editSearchQuery.value = user.nombre;
    showEditDropdown.value = false;
};

const saveEdit = (areaId) => {
    emit('update-area', {
        id: areaId,
        departamento: editForm.value.departamento || null,
        responsableId: editForm.value.responsableId || undefined,
    });
    cancelEdit();
};
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════════
   VARIABLES — paleta zinc (Vercel-style)
   ══════════════════════════════════════════════════════════════════ */
.ge-light {
    --bg: #ffffff;
    --bg-soft: #fafafa;
    --bg-hover: #f4f4f5;
    --border: #ececec;
    --border-strong: #e2e2e2;
    --text: #09090b;
    --text-muted: #52525b;
    --text-soft: #a1a1aa;
    /* Azul de marca refinado (no muy saturado) */
    --brand: #3B82F6;
    --brand-soft: rgba(59, 130, 246, 0.08);
    --brand-text: #2563EB;
    /* Verde para segmentos y estado activo */
    --on: #16a34a;
    --on-soft: #f0fdf4;
    --on-text: #15803d;
    /* Púrpura sutil para encabezados de grupo */
    --accent: #7c3aed;
    --accent-soft: #f5f3ff;
    --accent-text: #6d28d9;
    --off: #dc2626;
    --off-soft: #fef2f2;
    /* Botón primario en color de marca */
    --btn-bg: #2563eb;
    --btn-bg-hover: #1d4ed8;
    --btn-text: #ffffff;
}

.ge-dark {
    --bg: #161B26;
    --bg-soft: #0B0F19;
    --bg-hover: #1F2533;
    --border: #222938;
    --border-strong: #2A3245;
    --text: #fafafa;
    --text-muted: #B0B7C3;
    --text-soft: #888888;
    /* Azul calmo para dark theme */
    --brand: #3B82F6;
    --brand-soft: rgba(59, 130, 246, 0.10);
    --brand-text: #60A5FA;
    --on: #4ade80;
    --on-soft: rgba(74, 222, 128, 0.12);
    --on-text: #86efac;
    --accent: #a78bfa;
    --accent-soft: rgba(167, 139, 250, 0.12);
    --accent-text: #c4b5fd;
    --off: #f87171;
    --off-soft: rgba(248, 113, 113, 0.12);
    --btn-bg: #3b82f6;
    --btn-bg-hover: #2563eb;
    --btn-text: #ffffff;
}

/* ══════════════════════════════════════════════════════════════════
   ROOT
   ══════════════════════════════════════════════════════════════════ */
.ge-root {
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
.ge-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.ge-header-left {
    display: flex;
    align-items: center;
    gap: 9px;
}

.ge-header-icon {
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

.ge-eyebrow {
    font-size: 9.5px;
    font-weight: 500;
    color: var(--text-soft);
    letter-spacing: 0.02em;
    margin-bottom: 1px;
    line-height: 1;
}

.ge-title {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.012em;
    color: var(--text);
    line-height: 1.15;
}

.ge-icon-btn {
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

.ge-icon-btn:hover:not(:disabled) {
    background: var(--bg-soft);
    color: var(--text);
    border-color: var(--border-strong);
}

/* ══════════════════════════════════════════════════════════════════
   GRID
   ══════════════════════════════════════════════════════════════════ */
.ge-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    flex: 1;
    min-height: 0;
}

@media (min-width: 1280px) {
    .ge-grid {
        grid-template-columns: 1fr 1fr;
    }
}

/* ══════════════════════════════════════════════════════════════════
   CARD
   ══════════════════════════════════════════════════════════════════ */
.ge-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 440px;
}

/* ══════════════════════════════════════════════════════════════════
   SECTION HEAD
   ══════════════════════════════════════════════════════════════════ */
.ge-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 9px 12px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-soft);
    flex-shrink: 0;
}

.ge-section-head-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.ge-section-icon {
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

.ge-section-title {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--text);
    line-height: 1.15;
}

.ge-section-sub {
    font-size: 9.5px;
    color: var(--text-soft);
    margin-top: 1px;
}

.ge-count-pill {
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

/* ══════════════════════════════════════════════════════════════════
   FORMULARIO
   ══════════════════════════════════════════════════════════════════ */
.ge-form {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
}

.ge-toggle-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    padding: 3px;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: 6px;
}

.ge-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 10px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    font-size: 10.5px;
    font-weight: 600;
    color: var(--text-soft);
    transition: all 0.15s ease;
    font-family: inherit;
}

.ge-toggle i {
    font-size: 9px;
}

.ge-toggle:hover {
    color: var(--text);
}

.ge-toggle.is-active {
    background: var(--brand-soft);
    color: var(--brand-text);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.ge-toggle.is-active i {
    color: var(--brand);
}

.ge-field {
    display: flex;
    flex-direction: column;
    position: relative;
}

.ge-field-search {
    position: relative;
}

.ge-label {
    font-size: 10px;
    font-weight: 500;
    color: var(--text-muted);
    margin-bottom: 5px;
    display: block;
}

.ge-input {
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

.ge-input::placeholder {
    color: var(--text-soft);
}

.ge-input:focus {
    border-color: var(--brand);
    box-shadow: 0 0 0 2px var(--brand-soft);
}

.ge-input-search {
    padding-left: 28px;
}

.ge-search {
    position: relative;
}

.ge-search-icon {
    position: absolute;
    left: 9px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 9.5px;
    color: var(--text-soft);
    pointer-events: none;
}

.ge-select-wrap {
    position: relative;
}

.ge-select {
    width: 100%;
    appearance: none;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 7px 28px 7px 10px;
    font-size: 11.5px;
    color: var(--text);
    cursor: pointer;
    outline: none;
    font-family: inherit;
    transition: all 0.12s ease;
}

.ge-select:focus {
    border-color: var(--brand);
    box-shadow: 0 0 0 2px var(--brand-soft);
}

.ge-select-chev {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 9px;
    color: var(--text-soft);
    pointer-events: none;
}

.ge-help {
    font-size: 9.5px;
    color: var(--text-soft);
    margin-top: 4px;
}

/* DROPDOWN BUSCADOR */
.ge-overlay {
    position: fixed;
    inset: 0;
    z-index: 40;
}

.ge-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 50;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: 0 8px 24px -6px rgba(0, 0, 0, 0.15);
    overflow: hidden;
}

.ge-dropdown-list {
    max-height: 180px;
    overflow-y: auto;
    padding: 3px;
}

.ge-dropdown-item {
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 7px 9px;
    border-radius: 4px;
    transition: background 0.1s ease;
    font-family: inherit;
}

.ge-dropdown-item:hover {
    background: var(--bg-hover);
}

.ge-dropdown-name {
    font-size: 11px;
    font-weight: 500;
    color: var(--text);
}

.ge-dropdown-cargo {
    font-size: 9.5px;
    color: var(--text-soft);
    margin-top: 1px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.ge-dropdown-empty {
    padding: 12px 9px;
    text-align: center;
    font-size: 11px;
    color: var(--text-soft);
}

/* BOTONES */
.ge-btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 8px 14px;
    border-radius: 5px;
    background: var(--btn-bg);
    color: var(--btn-text);
    border: none;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    transition: all 0.12s ease;
    font-family: inherit;
    margin-top: 4px;
}

.ge-btn-primary:hover:not(:disabled) {
    background: var(--btn-bg-hover);
    box-shadow: 0 4px 12px -2px rgba(37, 99, 235, 0.3);
}

.ge-btn-primary:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

.ge-btn-primary i {
    font-size: 10px;
}

.ge-btn-flex {
    flex: 1;
    margin-top: 0;
}

.ge-btn-secondary {
    padding: 8px 14px;
    border-radius: 5px;
    background: var(--bg);
    color: var(--text-muted);
    border: 1px solid var(--border);
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    transition: all 0.12s ease;
    font-family: inherit;
}

.ge-btn-secondary:hover {
    background: var(--bg-soft);
    color: var(--text);
    border-color: var(--border-strong);
}

/* ══════════════════════════════════════════════════════════════════
   LISTA AGRUPADA
   ══════════════════════════════════════════════════════════════════ */
.ge-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px 12px 12px;
}

.ge-group {
    margin-bottom: 12px;
}

.ge-group:last-child {
    margin-bottom: 0;
}

.ge-group-head {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 6px;
    padding: 0 2px;
}

.ge-group-icon {
    width: 20px;
    height: 20px;
    border-radius: 5px;
    background: var(--accent-soft);
    color: var(--accent-text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    flex-shrink: 0;
}

.ge-group-name {
    font-size: 9.5px;
    font-weight: 700;
    color: var(--accent-text);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ge-group-count {
    font-size: 9px;
    font-weight: 600;
    color: var(--accent-text);
    padding: 1px 6px;
    border-radius: 999px;
    background: var(--accent-soft);
    font-variant-numeric: tabular-nums;
}

.ge-group-line {
    flex: 1;
    height: 1px;
    background: var(--border);
    margin-left: 4px;
}

/* ITEMS */
.ge-item-wrap {
    margin-left: 14px;
    margin-bottom: 4px;
}

.ge-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.12s ease;
    text-align: left;
    font-family: inherit;
}

.ge-item:hover {
    background: var(--brand-soft);
    border-color: var(--brand);
    transform: translateX(2px);
}

.ge-item:hover .ge-item-edit {
    opacity: 0.7;
    color: var(--brand);
}

.ge-item:hover .ge-item-name {
    color: var(--brand-text);
}

.ge-item-static {
    cursor: default;
}

.ge-item-static:hover {
    background: var(--bg);
    border-color: var(--border);
    transform: none;
}

.ge-item-static:hover .ge-item-name {
    color: var(--text);
}

.ge-item-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--brand);
    flex-shrink: 0;
    box-shadow: 0 0 0 2.5px var(--brand-soft);
}

.ge-item-dot-on {
    background: var(--on);
    box-shadow: 0 0 0 2.5px var(--on-soft);
}

.ge-item-info {
    flex: 1;
    min-width: 0;
}

.ge-item-name {
    font-size: 11.5px;
    font-weight: 500;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.25;
}

.ge-item-meta {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 9.5px;
    color: var(--text-soft);
    margin-top: 2px;
}

.ge-item-meta i {
    font-size: 8px;
    opacity: 0.7;
}

.ge-item-edit {
    font-size: 9px;
    color: var(--text-soft);
    opacity: 0;
    transition: opacity 0.12s ease;
}

.ge-item-tag {
    font-size: 9px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 999px;
    background: var(--on-soft);
    color: var(--on-text);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    flex-shrink: 0;
}

/* ══════════════════════════════════════════════════════════════════
   EDIT CARD INLINE
   ══════════════════════════════════════════════════════════════════ */
.ge-edit-card {
    background: var(--brand-soft);
    border: 1px solid var(--brand);
    border-radius: 7px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.ge-edit-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.ge-edit-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 700;
    color: var(--brand-text);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.ge-edit-title i {
    font-size: 9px;
    color: var(--brand);
}

.ge-edit-close {
    width: 22px;
    height: 22px;
    border-radius: 4px;
    background: transparent;
    border: none;
    color: var(--text-soft);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    transition: all 0.12s ease;
}

.ge-edit-close:hover {
    background: var(--bg-hover);
    color: var(--text);
}

.ge-edit-actions {
    display: flex;
    gap: 6px;
}

/* ══════════════════════════════════════════════════════════════════
   EMPTY STATE
   ══════════════════════════════════════════════════════════════════ */
.ge-empty {
    text-align: center;
    padding: 40px 12px;
    color: var(--text-soft);
    font-size: 11px;
}

.ge-empty i {
    display: block;
    font-size: 20px;
    margin-bottom: 8px;
    opacity: 0.5;
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
