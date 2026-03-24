<template>
    <div class="min-h-screen transition-colors duration-500 flex flex-col"
        :class="isDark ? 'bg-[#060a14]' : 'bg-[#f8fafc]'">

        <!-- Header -->
        <header class="w-full px-3 sm:px-5 py-2.5 sm:py-3 border-b flex items-center justify-between shrink-0"
            :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200 shadow-sm'">

            <div class="flex items-center gap-2 sm:gap-3">
                <div
                    class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#FF8F00] flex items-center justify-center shadow-sm shrink-0">
                    <i class="fas fa-file-signature text-white text-[10px] sm:text-xs"></i>
                </div>
                <div>
                    <h1 class="text-xs sm:text-sm font-black uppercase tracking-tighter"
                        :class="isDark ? 'text-white' : 'text-slate-800'">
                        Registro <span class="text-[#FF8F00]">Novedad</span>
                    </h1>
                    <p class="text-[7px] font-bold opacity-40 uppercase tracking-widest hidden sm:block"
                        :class="isDark ? 'text-slate-400' : 'text-slate-500'">Woden Track</p>
                </div>
            </div>

            <div class="flex items-center gap-1.5 sm:gap-2">
                <button @click="isDark = !isDark"
                    class="w-7 h-7 sm:p-2 flex items-center justify-center rounded-lg border transition-all"
                    :class="isDark ? 'border-[#2d3548] bg-[#273045] text-yellow-400' : 'border-slate-200 bg-white text-slate-500'">
                    <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'" class="text-[10px] sm:text-xs"></i>
                </button>
                <button @click="router.push('/marcacion')"
                    class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all hover:text-[#FF8F00] hover:border-[#FF8F00]/40"
                    :class="isDark ? 'border-[#2d3548] bg-[#273045] text-slate-400' : 'border-slate-200 bg-white text-slate-500'">
                    <i class="fas fa-arrow-left text-[9px]"></i>
                    <span class="hidden sm:inline">Volver</span>
                </button>
            </div>
        </header>

        <!-- Contenido -->
        <div class="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-5 overflow-hidden"
            style="height: calc(100vh - 52px)">
            <NovedadesUsuario :isDark="isDark" :company="company" :employee="employee" :hideHeader="true" />
        </div>

    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import NovedadesUsuario from './novedadesusuarioView.vue';

const router = useRouter();
const isDark = ref(localStorage.getItem('theme') === 'dark');
const session = JSON.parse(localStorage.getItem('user_session') || '{}');
const employee = ref(session);
const company = ref(session?.company || '');

watch(isDark, (val) => {
    localStorage.setItem('theme', val ? 'dark' : 'light');
});
</script>