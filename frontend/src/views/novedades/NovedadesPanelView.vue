<template>
    <div class="h-full flex flex-col">

        <!-- ── Panel de selección (Vercel-style) ──────────────────────────── -->
        <div v-show="!subModule" class="h-full flex flex-col items-center justify-center animate-fade-in rounded-lg"
            :class="isDark ? 'bg-transparent' : 'bg-transparent'">

            <!-- Título -->
            <div class="text-center mb-10">
                <p class="text-[10px] font-medium uppercase tracking-[0.12em] mb-2"
                    :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
                    Panel de novedades
                </p>
                <h2 class="text-2xl font-semibold tracking-tight" :class="isDark ? 'text-white' : 'text-slate-900'">
                    Selecciona un módulo
                </h2>
                <p class="text-[12px] font-normal mt-1.5" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
                    Accede al espacio según tu rol y permisos
                </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-4xl px-6">

                <!-- Admin Card -->
                <button v-if="isSuperAdmin || hasPerm('admin.novedades.admin')" @click="subModule = 'admin'"
                    class="group flex flex-col items-start gap-3 p-5 rounded-md border transition-all duration-200 cursor-pointer text-left hover:-translate-y-0.5 active:scale-[0.99]"
                    :class="isDark
                        ? 'bg-[#161B26] border-[#222938] hover:border-[#3B82F6]/60 hover:bg-[#1F2533]'
                        : 'bg-white border-slate-200 hover:border-[#3B82F6] hover:shadow-sm'">
                    <div class="w-9 h-9 rounded-md flex items-center justify-center transition-colors duration-200"
                        :class="isDark
                            ? 'bg-[#3B82F6]/10 text-[#60A5FA] group-hover:bg-[#3B82F6]/15'
                            : 'bg-blue-50 text-[#3B82F6] group-hover:bg-blue-100'">
                        <i class="fas fa-user-shield text-[14px]"></i>
                    </div>
                    <div>
                        <h3 class="text-[13px] font-semibold tracking-tight"
                            :class="isDark ? 'text-white' : 'text-slate-900'">
                            Coordinadores
                        </h3>
                        <p class="text-[11px] mt-0.5" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
                            Gestión de Novedades
                        </p>
                    </div>
                    <div class="flex items-center gap-1.5 mt-1 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        :class="isDark ? 'text-[#60A5FA]' : 'text-[#3B82F6]'">
                        Entrar
                        <i class="fas fa-arrow-right text-[8px]"></i>
                    </div>
                </button>

                <!-- RRHH Card -->
                <button v-if="isSuperAdmin || hasPerm('admin.novedades.rrhh')" @click="subModule = 'rrhh'"
                    class="group flex flex-col items-start gap-3 p-5 rounded-md border transition-all duration-200 cursor-pointer text-left hover:-translate-y-0.5 active:scale-[0.99]"
                    :class="isDark
                        ? 'bg-[#161B26] border-[#222938] hover:border-[#3B82F6]/60 hover:bg-[#1F2533]'
                        : 'bg-white border-slate-200 hover:border-[#3B82F6] hover:shadow-sm'">
                    <div class="w-9 h-9 rounded-md flex items-center justify-center transition-colors duration-200"
                        :class="isDark
                            ? 'bg-[#3B82F6]/10 text-[#60A5FA] group-hover:bg-[#3B82F6]/15'
                            : 'bg-blue-50 text-[#3B82F6] group-hover:bg-blue-100'">
                        <i class="fas fa-id-card text-[14px]"></i>
                    </div>
                    <div>
                        <h3 class="text-[13px] font-semibold tracking-tight"
                            :class="isDark ? 'text-white' : 'text-slate-900'">
                            Capital Humano
                        </h3>
                        <p class="text-[11px] mt-0.5" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
                            Gestión de Novedades
                        </p>
                    </div>
                    <div class="flex items-center gap-1.5 mt-1 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        :class="isDark ? 'text-[#60A5FA]' : 'text-[#3B82F6]'">
                        Entrar
                        <i class="fas fa-arrow-right text-[8px]"></i>
                    </div>
                </button>

                <!-- User Card -->
                <button v-if="isSuperAdmin || hasPerm('admin.novedades.user')" @click="subModule = 'user'"
                    class="group flex flex-col items-start gap-3 p-5 rounded-md border transition-all duration-200 cursor-pointer text-left hover:-translate-y-0.5 active:scale-[0.99]"
                    :class="isDark
                        ? 'bg-[#161B26] border-[#222938] hover:border-[#3B82F6]/60 hover:bg-[#1F2533]'
                        : 'bg-white border-slate-200 hover:border-[#3B82F6] hover:shadow-sm'">
                    <div class="w-9 h-9 rounded-md flex items-center justify-center transition-colors duration-200"
                        :class="isDark
                            ? 'bg-[#3B82F6]/10 text-[#60A5FA] group-hover:bg-[#3B82F6]/15'
                            : 'bg-blue-50 text-[#3B82F6] group-hover:bg-blue-100'">
                        <i class="fas fa-user-edit text-[14px]"></i>
                    </div>
                    <div>
                        <h3 class="text-[13px] font-semibold tracking-tight"
                            :class="isDark ? 'text-white' : 'text-slate-900'">
                            Mis novedades
                        </h3>
                        <p class="text-[11px] mt-0.5" :class="isDark ? 'text-[#888888]' : 'text-slate-500'">
                            Acceso personal
                        </p>
                    </div>
                    <div class="flex items-center gap-1.5 mt-1 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        :class="isDark ? 'text-[#60A5FA]' : 'text-[#3B82F6]'">
                        Entrar
                        <i class="fas fa-arrow-right text-[8px]"></i>
                    </div>
                </button>

            </div>
        </div>

        <!-- ── Botón volver (Vercel ghost) ─────────────────────────────────── -->
        <button v-if="subModule" @click="subModule = null"
            class="self-start inline-flex items-center gap-1.5 px-3 h-7 mb-2 rounded-md text-[11px] font-medium transition-all active:scale-[0.98] border"
            :class="isDark
                ? 'bg-transparent border-[#222938] text-[#888888] hover:text-white hover:border-[#3B82F6]/60'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-400'">
            <i class="fas fa-arrow-left text-[9px]"></i> Volver
        </button>

        <!-- ── Sub-vistas con keep-alive ───────────────────────────────────── -->
        <keep-alive>
            <NovedadesAdmin v-if="subModule === 'admin'" :isDark="isDark" :company="company" />
            <NovedadesRRHH v-else-if="subModule === 'rrhh'" :isDark="isDark" :company="company" />
            <NovedadesUsuario v-else-if="subModule === 'user'" :isDark="isDark" :company="company"
                :employee="employee" />
        </keep-alive>

    </div>
</template>

<script setup>
import { ref, inject } from 'vue';
import NovedadesAdmin from './novedadesadminView.vue';
import NovedadesRRHH from './novedadesRRHView.vue';
import NovedadesUsuario from './novedadesusuarioView.vue';

const props = defineProps({
    isDark: Boolean,
    company: String,
});

const employee = inject('adminEmployee', null);

const subModule = ref(null);

const session = JSON.parse(localStorage.getItem('user_session') || '{}');
const isSuperAdmin = session.isSuperAdmin || false;
const hasPerm = (p) => session.permisos?.[p] === true;
</script>
