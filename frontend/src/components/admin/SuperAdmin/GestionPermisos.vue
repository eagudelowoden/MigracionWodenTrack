<template>
    <Transition name="fade">
        <div v-if="modelValue"
            class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            @click.self="emit('update:modelValue', null)">

            <div class="w-full max-w-lg max-h-[92vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden"
                :class="isDark ? 'bg-[#0d1520] border-white/8 text-white' : 'bg-white border-slate-200 text-slate-900'">

                <!-- ── HEADER ──────────────────────────────────────── -->
                <div class="flex items-center gap-3 px-5 py-4 border-b shrink-0"
                    :class="isDark ? 'border-white/5 bg-white/[0.015]' : 'border-slate-100 bg-slate-50'">
                    <div class="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                        <i class="fas fa-key text-amber-500 text-[12px]"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="text-[13px] font-bold truncate"
                            :class="isDark ? 'text-white' : 'text-slate-800'">
                            {{ modelValue.nombre }}
                        </h3>
                        <p class="text-[9px] font-semibold uppercase tracking-widest opacity-40 mt-0.5">
                            Configurar accesos y permisos
                        </p>
                    </div>
                    <button @click="emit('update:modelValue', null)"
                        class="w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-30 hover:opacity-100"
                        :class="isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'">
                        <i class="fas fa-times text-[12px]"></i>
                    </button>
                </div>

                <!-- ── BODY ───────────────────────────────────────── -->
                <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">

                    <!-- Estructura organizacional -->
                    <div class="rounded-xl border p-3.5"
                        :class="isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'">
                        <div class="flex items-center gap-2 mb-3">
                            <div class="w-5 h-5 rounded-md bg-amber-500/15 flex items-center justify-center">
                                <i class="fas fa-layer-group text-amber-500 text-[9px]"></i>
                            </div>
                            <span class="text-[10px] font-bold uppercase tracking-wider opacity-50">
                                Estructura organizacional
                            </span>
                        </div>
                        <div class="grid grid-cols-2 gap-2.5">
                            <div>
                                <label class="text-[9px] font-semibold uppercase tracking-wider block mb-1.5"
                                    :class="isDark ? 'text-blue-400/70' : 'text-blue-500/70'">
                                    <i class="fas fa-circle text-[5px] mr-1"></i>Área
                                </label>
                                <div class="relative">
                                    <select v-model="modelValue.area_id"
                                        @change="emit('update-structure', { user: modelValue, field: 'area_id' })"
                                        class="w-full rounded-lg px-3 py-2 pr-7 text-[11px] font-medium outline-none border transition-all appearance-none cursor-pointer"
                                        :class="isDark ? 'bg-white/5 border-white/10 text-white focus:border-amber-500' : 'bg-white border-slate-200 text-slate-700 focus:border-amber-400'">
                                        <option :value="null">Sin área</option>
                                        <option v-for="a in areas" :key="a.id" :value="a.id"
                                            :class="isDark ? 'bg-slate-900' : 'bg-white'">{{ a.nombre }}</option>
                                    </select>
                                    <i class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] opacity-30 pointer-events-none"></i>
                                </div>
                            </div>
                            <div>
                                <label class="text-[9px] font-semibold uppercase tracking-wider block mb-1.5"
                                    :class="isDark ? 'text-emerald-400/70' : 'text-emerald-600/70'">
                                    <i class="fas fa-circle text-[5px] mr-1"></i>Segmento
                                </label>
                                <div class="relative">
                                    <select v-model="modelValue.segmento_id"
                                        @change="emit('update-structure', { user: modelValue, field: 'segmento_id' })"
                                        class="w-full rounded-lg px-3 py-2 pr-7 text-[11px] font-medium outline-none border transition-all appearance-none cursor-pointer"
                                        :class="isDark ? 'bg-white/5 border-white/10 text-white focus:border-emerald-500' : 'bg-white border-slate-200 text-slate-700 focus:border-emerald-400'">
                                        <option :value="null">Sin segmento</option>
                                        <option v-for="s in segmentos" :key="s.id" :value="s.id"
                                            :class="isDark ? 'bg-slate-900' : 'bg-white'">{{ s.nombre }}</option>
                                    </select>
                                    <i class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] opacity-30 pointer-events-none"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Secciones de permisos -->
                    <template v-for="section in SECTIONS" :key="section.key">
                        <div class="rounded-xl border overflow-hidden"
                            :class="isDark ? 'border-white/6' : 'border-slate-200'">

                            <!-- Cabecera sección -->
                            <div class="flex items-center gap-2.5 px-3.5 py-2.5 border-b"
                                :class="[
                                    section.key === 'super' ? (isDark ? 'bg-violet-500/5 border-violet-500/10' : 'bg-violet-50 border-violet-100') : '',
                                    section.key === 'admin' ? (isDark ? 'bg-blue-500/5 border-blue-500/10' : 'bg-blue-50 border-blue-100') : '',
                                    section.key === 'scope' ? (isDark ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100') : '',
                                    section.key === 'novedades' ? (isDark ? 'bg-amber-500/5 border-amber-500/10' : 'bg-amber-50 border-amber-100') : '',
                                ]">
                                <div class="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                                    :class="[
                                        section.key === 'super' ? 'bg-violet-500/15' : '',
                                        section.key === 'admin' ? 'bg-blue-500/15' : '',
                                        section.key === 'scope' ? 'bg-emerald-500/15' : '',
                                        section.key === 'novedades' ? 'bg-amber-500/15' : '',
                                    ]">
                                    <i :class="[
                                        section.icon, 'text-[10px]',
                                        section.key === 'super' ? 'text-violet-400' : '',
                                        section.key === 'admin' ? 'text-blue-400' : '',
                                        section.key === 'scope' ? 'text-emerald-400' : '',
                                        section.key === 'novedades' ? 'text-amber-400' : '',
                                    ]"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-[10px] font-bold uppercase tracking-wide"
                                        :class="[
                                            section.key === 'super' ? (isDark ? 'text-violet-400' : 'text-violet-600') : '',
                                            section.key === 'admin' ? (isDark ? 'text-blue-400' : 'text-blue-600') : '',
                                            section.key === 'scope' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : '',
                                            section.key === 'novedades' ? (isDark ? 'text-amber-400' : 'text-amber-600') : '',
                                        ]">
                                        {{ section.title }}
                                    </p>
                                    <p v-if="section.subtitle" class="text-[8px] mt-0.5 opacity-50 truncate">
                                        {{ section.subtitle }}
                                    </p>
                                </div>
                                <span class="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
                                    :class="[
                                        section.key === 'super' ? (isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-100 text-violet-600') : '',
                                        section.key === 'admin' ? (isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-600') : '',
                                        section.key === 'scope' ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-600') : '',
                                        section.key === 'novedades' ? (isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-600') : '',
                                    ]">
                                    {{ section.slugs.filter(s => hasPerm(s)).length }}/{{ section.slugs.length }}
                                </span>
                            </div>

                            <!-- Filas de permiso -->
                            <div class="divide-y"
                                :class="isDark ? 'divide-white/[0.03]' : 'divide-slate-50'">
                                <div v-for="slug in section.slugs" :key="slug"
                                    class="flex items-center gap-3 px-3.5 py-2.5 transition-colors"
                                    :class="isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50'">

                                    <!-- Barra de acento -->
                                    <div class="w-[3px] h-8 rounded-full shrink-0 transition-all"
                                        :class="[
                                            hasPerm(slug) ? (
                                                section.key === 'super' ? 'bg-violet-500' :
                                                section.key === 'admin' ? 'bg-blue-500' :
                                                section.key === 'scope' ? 'bg-emerald-500' :
                                                'bg-amber-500'
                                            ) : (isDark ? 'bg-white/8' : 'bg-slate-200')
                                        ]">
                                    </div>

                                    <!-- Info -->
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center gap-1.5 flex-wrap">
                                            <span class="text-[11px] font-semibold leading-tight"
                                                :class="isDark ? 'text-white/90' : 'text-slate-700'">
                                                {{ MODULO_LABELS[slug]?.nombre ?? slug }}
                                            </span>
                                            <!-- Badge "Todos los módulos" para permisos de alcance -->
                                            <span v-if="MODULO_LABELS[slug]?.scope"
                                                class="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full shrink-0"
                                                :class="isDark ? 'bg-emerald-500/12 text-emerald-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'">
                                                <i class="fas fa-globe text-[6px] mr-0.5"></i>Todos los módulos
                                            </span>
                                        </div>
                                        <p class="text-[9px] opacity-40 mt-0.5 leading-tight">
                                            {{ MODULO_LABELS[slug]?.desc ?? 'Acceso al módulo' }}
                                        </p>
                                    </div>

                                    <!-- Toggle -->
                                    <label class="relative inline-flex items-center cursor-pointer shrink-0">
                                        <input type="checkbox" :checked="hasPerm(slug)"
                                            @change="emit('toggle-perm', { user: modelValue, slug })"
                                            class="sr-only peer">
                                        <div class="w-9 h-5 rounded-full transition-all relative"
                                            :class="[
                                                hasPerm(slug) ? (
                                                    section.key === 'super' ? 'bg-violet-500' :
                                                    section.key === 'admin' ? 'bg-blue-500' :
                                                    section.key === 'scope' ? 'bg-emerald-500' :
                                                    'bg-amber-500'
                                                ) : (isDark ? 'bg-white/10' : 'bg-slate-200')
                                            ]">
                                            <div class="absolute top-[4px] left-[4px] w-3 h-3 rounded-full bg-white shadow transition-all"
                                                :class="hasPerm(slug) ? 'translate-x-4' : ''">
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- Departamentos visibles (solo si tiene filtro o es director) -->
                    <template v-if="hasPerm('admin.filtro_departamento') || hasPerm('novedades.director')">
                        <div class="rounded-xl border overflow-hidden"
                            :class="isDark ? 'border-sky-500/20' : 'border-sky-200'">
                            <div class="flex items-center gap-2.5 px-3.5 py-2.5 border-b"
                                :class="isDark ? 'bg-sky-500/5 border-sky-500/10' : 'bg-sky-50 border-sky-100'">
                                <div class="w-6 h-6 rounded-lg bg-sky-500/15 flex items-center justify-center shrink-0">
                                    <i class="fas fa-building text-sky-400 text-[10px]"></i>
                                </div>
                                <div class="flex-1">
                                    <p class="text-[10px] font-bold uppercase tracking-wide"
                                        :class="isDark ? 'text-sky-400' : 'text-sky-600'">
                                        Departamentos Visibles
                                    </p>
                                    <p class="text-[8px] opacity-50 mt-0.5">
                                        Restringe qué departamentos puede consultar
                                    </p>
                                </div>
                                <span class="text-[9px] font-bold px-2 py-0.5 rounded-full"
                                    :class="isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-100 text-sky-600'">
                                    {{ deptosSeleccionados.length }} activos
                                </span>
                            </div>

                            <div class="p-3.5 space-y-3">
                                <div class="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scroll">
                                    <template v-if="todosLosDepartamentos?.length">
                                        <label v-for="dept in todosLosDepartamentos" :key="dept"
                                            class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all"
                                            :class="deptosSeleccionados.includes(dept)
                                                ? isDark ? 'bg-sky-500/10 border-sky-500/30' : 'bg-sky-50 border-sky-300'
                                                : isDark ? 'bg-white/[0.02] border-white/5 hover:bg-white/5' : 'bg-white border-slate-200 hover:border-slate-300'">
                                            <input type="checkbox" :checked="deptosSeleccionados.includes(dept)"
                                                @change="toggleDept(dept)" class="sr-only">
                                            <div class="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all"
                                                :class="deptosSeleccionados.includes(dept)
                                                    ? 'bg-sky-500 border-sky-500'
                                                    : isDark ? 'border-white/20' : 'border-slate-300'">
                                                <i v-if="deptosSeleccionados.includes(dept)"
                                                    class="fas fa-check text-white text-[7px]"></i>
                                            </div>
                                            <span class="text-[10px] font-medium truncate"
                                                :class="isDark ? 'text-white/70' : 'text-slate-600'">{{ dept }}</span>
                                        </label>
                                    </template>
                                    <div v-else class="col-span-2 text-center py-4 text-[11px] opacity-30">
                                        Sin departamentos disponibles
                                    </div>
                                </div>

                                <button @click="guardarDeptos" :disabled="isSavingDeptos"
                                    class="w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 border"
                                    :class="isDark
                                        ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border-sky-500/20 disabled:opacity-40'
                                        : 'bg-sky-50 text-sky-600 hover:bg-sky-100 border-sky-200 disabled:opacity-40'">
                                    <i class="fas text-[10px]"
                                        :class="isSavingDeptos ? 'fa-circle-notch fa-spin' : 'fa-save'"></i>
                                    {{ isSavingDeptos ? 'Guardando...' : 'Guardar departamentos' }}
                                </button>
                            </div>
                        </div>
                    </template>

                </div>

                <!-- ── FOOTER ──────────────────────────────────────── -->
                <div class="px-4 py-3 border-t shrink-0"
                    :class="isDark ? 'border-white/5 bg-white/[0.01]' : 'border-slate-100 bg-slate-50'">
                    <button @click="emit('update:modelValue', null)"
                        class="w-full py-2.5 bg-amber-500 text-black text-[11px] font-bold uppercase tracking-wide rounded-xl hover:bg-amber-400 active:scale-[0.98] transition-all">
                        Finalizar cambios
                    </button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup>
import { ref, watch } from 'vue';

// ── Estructura de secciones ──────────────────────────────────────────────────
const SECTIONS = [
    {
        key: 'super',
        title: 'Super Admin',
        subtitle: 'Módulos del panel de control global',
        icon: 'fas fa-shield-halved',
        slugs: [
            'super.superadmin',
            'super.dashboard',
            'super.gestionarapk',
            'super.companias',
            'super.personal',
            'super.avisos',
            'super.organizacion',
            'super.mallas',
            'super.analitica',
            'super.sesiones',
            'super.mensajes',
            'super.recordatorios',
            'super.configuracion',
            'super.api',
        ],
    },
    {
        key: 'admin',
        title: 'Panel Admin',
        subtitle: 'Acceso a módulos del panel de administración',
        icon: 'fas fa-user-shield',
        slugs: [
            'admin.admin',
            'admin.asistencias',
            'admin.mallas',
            'admin.calculos',
            'admin.novedades',
            'horas.ver_cargue_ch',
        ],
    },
    {
        key: 'scope',
        title: 'Alcance de Visibilidad',
        subtitle: 'Define qué empleados ve el usuario en todos los módulos',
        icon: 'fas fa-eye',
        slugs: [
            'novedades.director',
            'novedades.ver_segmento',
            'coord.ver_segmento',
            'novedades.ver_area',
            'admin.filtro_departamento',
        ],
    },
    {
        key: 'novedades',
        title: 'Novedades',
        subtitle: 'Roles y acciones dentro del módulo de novedades',
        icon: 'fas fa-file-lines',
        slugs: [
            'marcacion.novedad',
            'admin.novedades.user',
            'admin.novedades.admin',
            'admin.novedades.rrhh',
        ],
    },
];

// ── Etiquetas y descripciones ────────────────────────────────────────────────
const MODULO_LABELS = {
    // Super Admin
    'super.superadmin':    { nombre: 'Super Admin',        desc: 'Acceso a la vista del panel — los módulos visibles dependen de los permisos super.* asignados individualmente' },
    'super.dashboard':     { nombre: 'Dashboard',          desc: 'Vista general y métricas del sistema' },
    'super.gestionarapk':  { nombre: 'Gestionar APK',      desc: 'Publicación y versionado de aplicaciones' },
    'super.companias':     { nombre: 'Compañías',          desc: 'Administración de empresas registradas' },
    'super.personal':      { nombre: 'Personal',           desc: 'Gestión de colaboradores y sincronización' },
    'super.avisos':        { nombre: 'Avisos',             desc: 'Envío de notificaciones masivas' },
    'super.organizacion':  { nombre: 'Organización',       desc: 'Estructura de áreas y segmentos' },
    'super.mallas':        { nombre: 'Mallas',             desc: 'Gestión global de horarios y turnos' },
    'super.analitica':     { nombre: 'Analítica HR',       desc: 'Reportes y métricas de recursos humanos' },
    'super.sesiones':      { nombre: 'Sesiones',           desc: 'Supervisión de sesiones activas' },
    'super.mensajes':      { nombre: 'Mensajes',           desc: 'Centro de mensajería interna' },
    'super.recordatorios': { nombre: 'Recordatorios',      desc: 'Gestión de recordatorios automáticos' },
    'super.configuracion': { nombre: 'Configuración',      desc: 'Parámetros generales del sistema' },
    'super.api':           { nombre: 'API Externa',        desc: 'Configuración de integraciones y webhooks' },

    // Admin
    'admin.admin':         { nombre: 'Admin General',      desc: 'Acceso al panel de administración' },
    'admin.asistencias':   { nombre: 'Asistencias',        desc: 'Consulta y gestión de registros de asistencia' },
    'admin.mallas':        { nombre: 'Mallas',             desc: 'Programación y edición de turnos' },
    'admin.calculos':      { nombre: 'Horas Extra',        desc: 'Cálculo y registro de horas extra' },
    'admin.novedades':     { nombre: 'Novedades',          desc: 'Acceso al módulo de novedades' },
    'horas.ver_cargue_ch': { nombre: 'Cargue Horas CH',   desc: 'Visualización del cargue de horas CH' },

    // Alcance de visibilidad — aplican en TODOS los módulos
    'novedades.director':      { nombre: 'Director de Departamento', desc: 'Ve todos los empleados del departamento en asistencias, mallas y novedades', scope: true },
    'novedades.ver_segmento':  { nombre: 'Jefe de Segmento',        desc: 'Ve todo el segmento como responsable en asistencias, mallas y novedades', scope: true },
    'coord.ver_segmento':      { nombre: 'Coordinador de Segmento', desc: 'Ve todo el segmento en asistencias, mallas y novedades sin ser responsable', scope: true },
    'novedades.ver_area':      { nombre: 'Jefe de Área',            desc: 'Ve los empleados de su área asignada en asistencias, mallas y novedades', scope: true },
    'admin.filtro_departamento': { nombre: 'Filtro por Departamento', desc: 'Puede filtrar la vista por departamento en asistencias, mallas y cálculos', scope: true },

    // Novedades
    'marcacion.novedad':      { nombre: 'Registrar Novedad',     desc: 'Muestra el botón de novedad en la pantalla de marcación' },
    'admin.novedades.user':   { nombre: 'Rol Empleado',          desc: 'Puede registrar y gestionar sus propias novedades' },
    'admin.novedades.admin':  { nombre: 'Rol Administrador',     desc: 'Gestión completa de novedades del equipo' },
    'admin.novedades.rrhh':   { nombre: 'Rol RRHH',             desc: 'Auditoría, revisión y aprobación de novedades' },
};

const props = defineProps({
    modelValue: Object,
    isDark: Boolean,
    areas: Array,
    segmentos: Array,
    todosLosDepartamentos: Array,
    apiUrl: String,
});

const emit = defineEmits(['update:modelValue', 'toggle-perm', 'update-structure']);

const deptosSeleccionados = ref([]);
const isSavingDeptos = ref(false);

watch(() => props.modelValue, async (user) => {
    if (!user) return;
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
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
