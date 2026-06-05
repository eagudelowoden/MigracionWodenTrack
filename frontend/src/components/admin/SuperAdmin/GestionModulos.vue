<template>
    <div class="gm-root">

        <!-- Header -->
        <div class="gm-page-header">
            <div class="gm-page-header-left">
                <div class="gm-page-icon">
                    <i class="fas fa-puzzle-piece"></i>
                </div>
                <div>
                    <h2 class="gm-page-title" :class="isDark ? 'text-white' : 'text-slate-800'">Catálogo de Módulos</h2>
                    <p class="gm-page-sub">Define los permisos disponibles para asignar a usuarios</p>
                </div>
            </div>
            <button @click="abrirCrear" class="gm-btn-primary">
                <i class="fas fa-plus text-[11px]"></i>
                Nuevo módulo
            </button>
        </div>

        <!-- Filtro de grupo -->
        <div class="gm-filters">
            <button v-for="g in gruposMenu" :key="g.key" @click="filtroGrupo = g.key"
                class="gm-filter-chip"
                :class="filtroGrupo === g.key
                    ? (isDark ? 'gm-chip-active-dark' : 'gm-chip-active-light')
                    : (isDark ? 'gm-chip-idle-dark' : 'gm-chip-idle-light')">
                <i v-if="g.icon" :class="g.icon" class="text-[10px]"></i>
                {{ g.label }}
                <span class="gm-chip-count">{{ g.count }}</span>
            </button>
        </div>

        <!-- Tabla -->
        <div class="gm-table-wrap" :class="isDark ? 'gm-table-dark' : 'gm-table-light'">
            <div v-if="loading" class="gm-empty">
                <i class="fas fa-circle-notch fa-spin text-blue-400 text-lg"></i>
                <span>Cargando módulos…</span>
            </div>
            <div v-else-if="modulosFiltrados.length === 0" class="gm-empty">
                <i class="fas fa-inbox text-2xl opacity-20"></i>
                <span class="text-[12px] opacity-40">Sin módulos en este grupo</span>
            </div>
            <table v-else class="gm-table">
                <thead>
                    <tr>
                        <th class="gm-th">Módulo</th>
                        <th class="gm-th">Slug</th>
                        <th class="gm-th">Grupo</th>
                        <th class="gm-th text-center">Alcance</th>
                        <th class="gm-th text-center">Estado</th>
                        <th class="gm-th text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="mod in modulosFiltrados" :key="mod.id" class="gm-tr"
                        :class="isDark ? 'gm-tr-dark' : 'gm-tr-light'">
                        <td class="gm-td">
                            <p class="gm-mod-nombre" :class="isDark ? 'text-white' : 'text-slate-800'">
                                {{ mod.nombre }}
                            </p>
                            <p class="gm-mod-desc">{{ mod.descripcion ?? '—' }}</p>
                        </td>
                        <td class="gm-td">
                            <code class="gm-slug" :class="isDark ? 'gm-slug-dark' : 'gm-slug-light'">{{ mod.slug }}</code>
                        </td>
                        <td class="gm-td">
                            <span class="gm-grupo-tag">
                                <i v-if="mod.grupo_icon" :class="mod.grupo_icon" class="text-[9px]"></i>
                                {{ mod.grupo_label }}
                            </span>
                        </td>
                        <td class="gm-td text-center">
                            <span v-if="mod.es_scope" class="gm-badge-scope">
                                <i class="fas fa-globe text-[8px]"></i> scope
                            </span>
                            <span v-else class="opacity-20 text-[11px]">—</span>
                        </td>
                        <td class="gm-td text-center">
                            <button @click="toggleActivo(mod)" :title="mod.activo ? 'Desactivar' : 'Activar'"
                                class="gm-toggle-status"
                                :class="mod.activo ? 'gm-toggle-on' : 'gm-toggle-off'">
                                <i :class="mod.activo ? 'fas fa-check' : 'fas fa-ban'" class="text-[9px]"></i>
                                {{ mod.activo ? 'Activo' : 'Inactivo' }}
                            </button>
                        </td>
                        <td class="gm-td text-right">
                            <div class="gm-actions">
                                <button @click="abrirEditar(mod)" class="gm-action-btn"
                                    :class="isDark ? 'gm-action-dark' : 'gm-action-light'" title="Editar">
                                    <i class="fas fa-pen text-[10px]"></i>
                                </button>
                                <button v-if="!mod.es_base" @click="confirmarEliminar(mod)" class="gm-action-btn gm-action-del"
                                    title="Eliminar">
                                    <i class="fas fa-trash text-[10px]"></i>
                                </button>
                                <span v-else class="gm-base-badge" title="Módulo base del sistema">
                                    <i class="fas fa-lock text-[8px]"></i>
                                </span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Modal crear/editar -->
        <Teleport to="body">
            <Transition name="fade">
                <div v-if="showModal" class="gm-overlay" @click.self="cerrarModal">
                    <Transition name="modal" appear>
                        <div v-if="showModal" class="gm-modal" :class="isDark ? 'gm-modal-dark' : 'gm-modal-light'">
                            <header class="gm-modal-header">
                                <div class="gm-modal-icon">
                                    <i :class="editando ? 'fas fa-pen' : 'fas fa-plus'"></i>
                                </div>
                                <div>
                                    <p class="gm-modal-eyebrow">{{ editando ? 'Editar módulo' : 'Nuevo módulo' }}</p>
                                    <h3 class="gm-modal-title" :class="isDark ? 'text-white' : 'text-slate-800'">
                                        {{ editando ? form.nombre || 'Sin nombre' : 'Crear módulo' }}
                                    </h3>
                                </div>
                                <button @click="cerrarModal" class="gm-close">
                                    <i class="fas fa-times"></i>
                                </button>
                            </header>

                            <div class="gm-modal-body custom-scroll">
                                <!-- Slug -->
                                <div class="gm-field">
                                    <label class="gm-label">Slug (identificador único) *</label>
                                    <input v-model="form.slug" :disabled="!!editando" placeholder="ej: admin.mi_modulo"
                                        class="gm-input" :class="[isDark ? 'gm-input-dark' : 'gm-input-light', editando ? 'opacity-50 cursor-not-allowed' : '']" />
                                    <p class="gm-help">Formato recomendado: <code>grupo.nombre_sub</code>. No se puede cambiar después de crear.</p>
                                </div>

                                <!-- Nombre -->
                                <div class="gm-field">
                                    <label class="gm-label">Nombre visible *</label>
                                    <input v-model="form.nombre" placeholder="ej: Gestión de Turnos"
                                        class="gm-input" :class="isDark ? 'gm-input-dark' : 'gm-input-light'" />
                                </div>

                                <!-- Descripción -->
                                <div class="gm-field">
                                    <label class="gm-label">Descripción</label>
                                    <textarea v-model="form.descripcion" rows="2" placeholder="Qué puede hacer el usuario con este permiso…"
                                        class="gm-input gm-textarea" :class="isDark ? 'gm-input-dark' : 'gm-input-light'"></textarea>
                                </div>

                                <!-- Grupo -->
                                <div class="gm-grid-2">
                                    <div class="gm-field">
                                        <label class="gm-label">Grupo (clave) *</label>
                                        <div class="gm-select-wrap">
                                            <select v-model="form.grupo" @change="autocompletarGrupoLabel"
                                                class="gm-input gm-select" :class="isDark ? 'gm-input-dark' : 'gm-input-light'">
                                                <option value="">— Seleccionar —</option>
                                                <option v-for="g in gruposExistentes" :key="g.grupo" :value="g.grupo">
                                                    {{ g.grupo }} — {{ g.label }}
                                                </option>
                                                <option value="__nuevo__">+ Nuevo grupo…</option>
                                            </select>
                                            <i class="fas fa-chevron-down gm-chev"></i>
                                        </div>
                                    </div>
                                    <div class="gm-field">
                                        <label class="gm-label">Label del grupo *</label>
                                        <input v-model="form.grupo_label"
                                            :placeholder="form.grupo === '__nuevo__' ? 'Nombre del nuevo grupo' : 'Autocompletado'"
                                            class="gm-input" :class="isDark ? 'gm-input-dark' : 'gm-input-light'" />
                                    </div>
                                </div>

                                <!-- Nuevo grupo key si aplica -->
                                <div v-if="form.grupo === '__nuevo__'" class="gm-field">
                                    <label class="gm-label">Clave del nuevo grupo *</label>
                                    <input v-model="form.grupo_nuevo_key" placeholder="ej: reportes"
                                        class="gm-input" :class="isDark ? 'gm-input-dark' : 'gm-input-light'" />
                                    <p class="gm-help">Solo minúsculas y guiones bajos</p>
                                </div>

                                <!-- Icono + Orden + Scope -->
                                <div class="gm-grid-3">
                                    <div class="gm-field">
                                        <label class="gm-label">Ícono grupo (FontAwesome)</label>
                                        <input v-model="form.grupo_icon" placeholder="fas fa-shield-halved"
                                            class="gm-input" :class="isDark ? 'gm-input-dark' : 'gm-input-light'" />
                                    </div>
                                    <div class="gm-field">
                                        <label class="gm-label">Orden</label>
                                        <input v-model.number="form.orden" type="number" min="0"
                                            class="gm-input" :class="isDark ? 'gm-input-dark' : 'gm-input-light'" />
                                    </div>
                                    <div class="gm-field gm-field-check">
                                        <label class="gm-label">Tipo scope</label>
                                        <label class="gm-checkbox">
                                            <input type="checkbox" v-model="form.es_scope" />
                                            <span>Es permiso de alcance</span>
                                        </label>
                                    </div>
                                </div>

                                <p v-if="errorMsg" class="gm-error">{{ errorMsg }}</p>
                            </div>

                            <footer class="gm-modal-footer">
                                <button @click="cerrarModal" class="gm-btn-secondary">Cancelar</button>
                                <button @click="guardar" :disabled="guardando" class="gm-btn-primary">
                                    <i class="fas" :class="guardando ? 'fa-circle-notch fa-spin' : (editando ? 'fa-check' : 'fa-plus')"></i>
                                    {{ guardando ? 'Guardando…' : (editando ? 'Guardar cambios' : 'Crear módulo') }}
                                </button>
                            </footer>
                        </div>
                    </Transition>
                </div>
            </Transition>
        </Teleport>

        <!-- Modal confirmar eliminar -->
        <Teleport to="body">
            <Transition name="fade">
                <div v-if="showConfirmDel" class="gm-overlay" @click.self="showConfirmDel = false">
                    <div class="gm-modal gm-modal-sm" :class="isDark ? 'gm-modal-dark' : 'gm-modal-light'">
                        <div class="gm-confirm-body">
                            <div class="gm-confirm-icon">
                                <i class="fas fa-trash text-rose-400"></i>
                            </div>
                            <p class="gm-confirm-title" :class="isDark ? 'text-white' : 'text-slate-800'">
                                ¿Eliminar módulo?
                            </p>
                            <p class="gm-confirm-sub">
                                <code>{{ moduloAEliminar?.slug }}</code> será eliminado del catálogo.<br />
                                Los usuarios que ya tienen este permiso asignado <strong>no se verán afectados</strong> de inmediato.
                            </p>
                        </div>
                        <footer class="gm-modal-footer">
                            <button @click="showConfirmDel = false" class="gm-btn-secondary">Cancelar</button>
                            <button @click="eliminar" :disabled="guardando" class="gm-btn-danger">
                                <i class="fas fa-trash text-[10px]"></i>
                                {{ guardando ? 'Eliminando…' : 'Eliminar' }}
                            </button>
                        </footer>
                    </div>
                </div>
            </Transition>
        </Teleport>

    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
    isDark: Boolean,
    apiUrl: String,
});

const emit = defineEmits(['success', 'error']);

const modulos = ref([]);
const loading = ref(true);
const filtroGrupo = ref('todos');
const showModal = ref(false);
const showConfirmDel = ref(false);
const editando = ref(null);
const guardando = ref(false);
const errorMsg = ref('');
const moduloAEliminar = ref(null);
const gruposExistentes = ref([]);

const formVacio = () => ({
    slug: '',
    nombre: '',
    descripcion: '',
    grupo: '',
    grupo_label: '',
    grupo_icon: '',
    grupo_nuevo_key: '',
    orden: 0,
    es_scope: false,
});
const form = ref(formVacio());

const BASE_URL = computed(() => `${props.apiUrl?.replace('/usuarios', '')}/modulos-disponibles`);

const cargar = async () => {
    loading.value = true;
    try {
        const res = await fetch(BASE_URL.value);
        modulos.value = await res.json();
    } catch {
        emit('error', 'Error al cargar módulos');
    } finally {
        loading.value = false;
    }
};

const cargarGrupos = async () => {
    try {
        const res = await fetch(`${BASE_URL.value}/grupos`);
        gruposExistentes.value = await res.json();
    } catch { /* silent */ }
};

onMounted(() => Promise.all([cargar(), cargarGrupos()]));

const gruposMenu = computed(() => {
    const conteo = {};
    for (const m of modulos.value) {
        conteo[m.grupo] = (conteo[m.grupo] ?? 0) + 1;
    }
    const grupos = [{ key: 'todos', label: 'Todos', icon: '', count: modulos.value.length }];
    for (const [k, n] of Object.entries(conteo)) {
        const g = modulos.value.find(m => m.grupo === k);
        grupos.push({ key: k, label: g?.grupo_label ?? k, icon: g?.grupo_icon ?? '', count: n });
    }
    return grupos;
});

const modulosFiltrados = computed(() =>
    filtroGrupo.value === 'todos'
        ? modulos.value
        : modulos.value.filter(m => m.grupo === filtroGrupo.value)
);

const autocompletarGrupoLabel = () => {
    if (form.value.grupo === '__nuevo__') {
        form.value.grupo_label = '';
        form.value.grupo_icon = '';
        return;
    }
    const g = gruposExistentes.value.find(x => x.grupo === form.value.grupo);
    if (g) {
        form.value.grupo_label = g.label;
        form.value.grupo_icon = g.icon;
    }
};

const abrirCrear = () => {
    editando.value = null;
    form.value = formVacio();
    errorMsg.value = '';
    showModal.value = true;
};

const abrirEditar = (mod) => {
    editando.value = mod;
    form.value = {
        slug: mod.slug,
        nombre: mod.nombre,
        descripcion: mod.descripcion ?? '',
        grupo: mod.grupo,
        grupo_label: mod.grupo_label,
        grupo_icon: mod.grupo_icon ?? '',
        grupo_nuevo_key: '',
        orden: mod.orden,
        es_scope: mod.es_scope,
    };
    errorMsg.value = '';
    showModal.value = true;
};

const cerrarModal = () => {
    showModal.value = false;
    editando.value = null;
};

const guardar = async () => {
    errorMsg.value = '';
    const grupoFinal = form.value.grupo === '__nuevo__' ? form.value.grupo_nuevo_key.trim() : form.value.grupo;

    if (!form.value.slug.trim() || !form.value.nombre.trim() || !grupoFinal || !form.value.grupo_label.trim()) {
        errorMsg.value = 'Slug, nombre, grupo y label del grupo son obligatorios.';
        return;
    }

    guardando.value = true;
    try {
        const payload = {
            slug: form.value.slug.trim(),
            nombre: form.value.nombre.trim(),
            descripcion: form.value.descripcion.trim() || null,
            grupo: grupoFinal,
            grupo_label: form.value.grupo_label.trim(),
            grupo_icon: form.value.grupo_icon.trim() || null,
            orden: form.value.orden,
            es_scope: form.value.es_scope,
        };

        if (editando.value) {
            const res = await fetch(`${BASE_URL.value}/${editando.value.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(await res.text());
        } else {
            const res = await fetch(BASE_URL.value, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg.includes('slug') ? `El slug "${payload.slug}" ya existe` : msg);
            }
        }

        await Promise.all([cargar(), cargarGrupos()]);
        cerrarModal();
        emit('success', editando.value ? 'Módulo actualizado' : 'Módulo creado correctamente');
    } catch (e) {
        errorMsg.value = e.message || 'Error al guardar';
    } finally {
        guardando.value = false;
    }
};

const toggleActivo = async (mod) => {
    try {
        await fetch(`${BASE_URL.value}/${mod.id}/toggle`, { method: 'PATCH' });
        mod.activo = !mod.activo;
        emit('success', `Módulo ${mod.activo ? 'activado' : 'desactivado'}`);
    } catch {
        emit('error', 'Error al cambiar estado');
    }
};

const confirmarEliminar = (mod) => {
    moduloAEliminar.value = mod;
    showConfirmDel.value = true;
};

const eliminar = async () => {
    if (!moduloAEliminar.value) return;
    guardando.value = true;
    try {
        const res = await fetch(`${BASE_URL.value}/${moduloAEliminar.value.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(await res.text());
        modulos.value = modulos.value.filter(m => m.id !== moduloAEliminar.value.id);
        showConfirmDel.value = false;
        emit('success', 'Módulo eliminado');
    } catch (e) {
        emit('error', e.message || 'Error al eliminar');
    } finally {
        guardando.value = false;
    }
};
</script>

<style scoped>
.gm-root {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 4px 0;
}

/* Header */
.gm-page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}

.gm-page-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.gm-page-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(59, 130, 246, .12);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3b82f6;
    font-size: 14px;
    flex-shrink: 0;
}

.gm-page-title {
    font-size: 15px;
    font-weight: 700;
    margin: 0;
    line-height: 1.2;
}

.gm-page-sub {
    font-size: 11px;
    color: #8b9ab4;
    margin: 2px 0 0;
}

/* Filtros */
.gm-filters {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.gm-filter-chip {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all .15s;
}

.gm-chip-count {
    font-size: 9px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 6px;
    background: rgba(255, 255, 255, .08);
}

.gm-chip-active-dark {
    background: rgba(59, 130, 246, .2);
    border-color: rgba(59, 130, 246, .3);
    color: #93c5fd;
}

.gm-chip-active-light {
    background: rgba(59, 130, 246, .1);
    border-color: rgba(59, 130, 246, .25);
    color: #2563eb;
}

.gm-chip-idle-dark {
    background: rgba(255, 255, 255, .04);
    border-color: rgba(255, 255, 255, .06);
    color: #8b9ab4;
}

.gm-chip-idle-light {
    background: rgba(0, 0, 0, .04);
    border-color: rgba(0, 0, 0, .06);
    color: #64748b;
}

/* Tabla */
.gm-table-wrap {
    border-radius: 14px;
    border: 1px solid;
    overflow: hidden;
}

.gm-table-dark {
    border-color: rgba(255, 255, 255, .07);
    background: #111827;
}

.gm-table-light {
    border-color: rgba(0, 0, 0, .06);
    background: #fff;
}

.gm-table {
    width: 100%;
    border-collapse: collapse;
}

.gm-th {
    padding: 8px 12px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .05em;
    color: #8b9ab4;
    border-bottom: 1px solid rgba(255, 255, 255, .06);
    text-align: left;
}

.gm-tr {
    transition: background .12s;
}

.gm-tr-dark:hover {
    background: rgba(255, 255, 255, .025);
}

.gm-tr-light:hover {
    background: rgba(0, 0, 0, .02);
}

.gm-td {
    padding: 9px 12px;
    border-bottom: 1px solid rgba(128, 128, 128, .08);
    vertical-align: middle;
}

.gm-tr:last-child .gm-td {
    border-bottom: none;
}

.gm-mod-nombre {
    font-size: 12px;
    font-weight: 600;
    margin: 0;
    line-height: 1.3;
}

.gm-mod-desc {
    font-size: 10px;
    color: #8b9ab4;
    margin: 2px 0 0;
    line-height: 1.3;
    max-width: 280px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.gm-slug {
    font-size: 10px;
    font-family: 'JetBrains Mono', monospace, monospace;
    padding: 2px 6px;
    border-radius: 5px;
}

.gm-slug-dark {
    background: rgba(59, 130, 246, .12);
    color: #93c5fd;
}

.gm-slug-light {
    background: rgba(59, 130, 246, .08);
    color: #2563eb;
}

.gm-grupo-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
    color: #8b9ab4;
}

.gm-badge-scope {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 9px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 6px;
    background: rgba(168, 85, 247, .12);
    color: #c084fc;
    border: 1px solid rgba(168, 85, 247, .2);
}

.gm-toggle-status {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 9px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 7px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all .15s;
}

.gm-toggle-on {
    background: rgba(34, 197, 94, .1);
    color: #4ade80;
    border-color: rgba(34, 197, 94, .2);
}

.gm-toggle-off {
    background: rgba(107, 114, 128, .08);
    color: #6b7280;
    border-color: rgba(107, 114, 128, .15);
}

.gm-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    justify-content: flex-end;
}

.gm-action-btn {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all .15s;
}

.gm-action-dark {
    background: rgba(255, 255, 255, .05);
    color: #8b9ab4;
    border-color: rgba(255, 255, 255, .07);
}

.gm-action-dark:hover {
    background: rgba(59, 130, 246, .15);
    color: #93c5fd;
    border-color: rgba(59, 130, 246, .2);
}

.gm-action-light {
    background: rgba(0, 0, 0, .04);
    color: #64748b;
    border-color: rgba(0, 0, 0, .06);
}

.gm-action-light:hover {
    background: rgba(59, 130, 246, .08);
    color: #2563eb;
    border-color: rgba(59, 130, 246, .15);
}

.gm-action-del {
    background: rgba(239, 68, 68, .08) !important;
    color: #f87171 !important;
    border-color: rgba(239, 68, 68, .15) !important;
}

.gm-action-del:hover {
    background: rgba(239, 68, 68, .18) !important;
}

.gm-base-badge {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #8b9ab4;
    opacity: .4;
}

/* Empty / loading */
.gm-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 40px;
    color: #8b9ab4;
    font-size: 12px;
}

/* Buttons */
.gm-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    background: #3b82f6;
    color: #fff;
    cursor: pointer;
    border: none;
    transition: background .15s;
}

.gm-btn-primary:hover {
    background: #2563eb;
}

.gm-btn-primary:disabled {
    opacity: .6;
    cursor: not-allowed;
}

.gm-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    background: transparent;
    color: #8b9ab4;
    cursor: pointer;
    border: 1px solid rgba(128, 128, 128, .2);
    transition: all .15s;
}

.gm-btn-secondary:hover {
    color: #e2e8f0;
    border-color: rgba(255, 255, 255, .15);
}

.gm-btn-danger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    background: #ef4444;
    color: #fff;
    cursor: pointer;
    border: none;
    transition: background .15s;
}

.gm-btn-danger:hover {
    background: #dc2626;
}

.gm-btn-danger:disabled {
    opacity: .6;
    cursor: not-allowed;
}

/* Modal */
.gm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, .65);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 20px;
}

.gm-modal {
    width: 100%;
    max-width: 540px;
    border-radius: 18px;
    border: 1px solid;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    max-height: 90vh;
}

.gm-modal-sm {
    max-width: 380px;
}

.gm-modal-dark {
    background: #111827;
    border-color: rgba(255, 255, 255, .08);
}

.gm-modal-light {
    background: #fff;
    border-color: rgba(0, 0, 0, .08);
}

.gm-modal-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 18px;
    border-bottom: 1px solid rgba(128, 128, 128, .1);
}

.gm-modal-icon {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: rgba(59, 130, 246, .12);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3b82f6;
    font-size: 12px;
    flex-shrink: 0;
}

.gm-modal-eyebrow {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #8b9ab4;
    margin: 0;
}

.gm-modal-title {
    font-size: 14px;
    font-weight: 700;
    margin: 2px 0 0;
}

.gm-close {
    margin-left: auto;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: transparent;
    border: none;
    color: #8b9ab4;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    transition: all .15s;
}

.gm-close:hover {
    background: rgba(239, 68, 68, .1);
    color: #f87171;
}

.gm-modal-body {
    padding: 16px 18px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.gm-modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 18px;
    border-top: 1px solid rgba(128, 128, 128, .1);
}

/* Form */
.gm-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.gm-field-check {
    justify-content: flex-end;
}

.gm-label {
    font-size: 10px;
    font-weight: 700;
    color: #8b9ab4;
    text-transform: uppercase;
    letter-spacing: .05em;
}

.gm-input {
    padding: 7px 10px;
    border-radius: 9px;
    border: 1px solid;
    font-size: 12px;
    outline: none;
    transition: border-color .15s;
    width: 100%;
    box-sizing: border-box;
}

.gm-input-dark {
    background: rgba(255, 255, 255, .04);
    border-color: rgba(255, 255, 255, .08);
    color: #e2e8f0;
}

.gm-input-dark:focus {
    border-color: rgba(59, 130, 246, .4);
}

.gm-input-dark::placeholder {
    color: rgba(255, 255, 255, .2);
}

.gm-input-light {
    background: #f8fafc;
    border-color: rgba(0, 0, 0, .08);
    color: #1e293b;
}

.gm-input-light:focus {
    border-color: rgba(59, 130, 246, .35);
}

.gm-textarea {
    resize: vertical;
    min-height: 56px;
}

.gm-select {
    appearance: none;
    cursor: pointer;
}

.gm-select-wrap {
    position: relative;
}

.gm-chev {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 9px;
    color: #8b9ab4;
    pointer-events: none;
}

.gm-help {
    font-size: 10px;
    color: #6b7280;
    margin: 0;
}

.gm-checkbox {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #8b9ab4;
    cursor: pointer;
}

.gm-error {
    font-size: 11px;
    color: #f87171;
    background: rgba(239, 68, 68, .08);
    border: 1px solid rgba(239, 68, 68, .15);
    padding: 7px 10px;
    border-radius: 8px;
    margin: 0;
}

.gm-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.gm-grid-3 {
    display: grid;
    grid-template-columns: 1fr 80px 1fr;
    gap: 10px;
    align-items: end;
}

/* Confirm modal */
.gm-confirm-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px 18px 8px;
    gap: 8px;
}

.gm-confirm-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(239, 68, 68, .1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
}

.gm-confirm-title {
    font-size: 14px;
    font-weight: 700;
    margin: 0;
}

.gm-confirm-sub {
    font-size: 11px;
    color: #8b9ab4;
    margin: 0;
    line-height: 1.5;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
    transition: opacity .2s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.modal-enter-active {
    transition: all .25s cubic-bezier(.175, .885, .32, 1.1);
}

.modal-leave-active {
    transition: all .18s ease-in;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
    transform: scale(.93) translateY(8px);
}
</style>
