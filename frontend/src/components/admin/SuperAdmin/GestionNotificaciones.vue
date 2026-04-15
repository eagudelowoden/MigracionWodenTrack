<template>
    <div class="animate-fade-in p-2">

        <!-- FORMULARIO -->
        <div class="rounded-2xl border p-4 mb-4 transition-all"
            :class="isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'">
            <div class="flex gap-3 items-start">
                <div class="flex-1 flex flex-col gap-2">
                    <input v-model="notif.title" type="text" placeholder="Título del comunicado..."
                        class="w-full bg-transparent border border-slate-500/20 rounded-lg px-3 py-2 text-[12px] font-medium outline-none focus:border-indigo-500 transition-all"
                        :class="isDark ? 'text-white placeholder:text-white/30' : 'text-slate-800 placeholder:text-slate-400'" />
                    <textarea v-model="notif.body" rows="2" placeholder="Descripción del mensaje..."
                        class="w-full bg-transparent border border-slate-500/20 rounded-lg px-3 py-2 text-[12px] font-medium outline-none focus:border-indigo-500 transition-all resize-none"
                        :class="isDark ? 'text-slate-300 placeholder:text-white/30' : 'text-slate-600 placeholder:text-slate-400'"></textarea>
                </div>
                <div class="flex flex-col gap-2 min-w-[150px]">
                    <div class="flex gap-1">
                        <button v-for="t in ['info', 'update', 'alert']" :key="t" @click="notif.type = t"
                            class="px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border transition-all"
                            :class="notif.type === t ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-400/40 text-slate-400'">
                            {{ t }}
                        </button>
                    </div>
                    <button @click="sendNotification" :disabled="!notif.title || !notif.body"
                        class="w-full py-2 bg-indigo-600 text-white text-[11px] font-semibold uppercase tracking-wide rounded-lg hover:bg-indigo-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        <i class="fas fa-paper-plane text-[10px]"></i> Enviar
                    </button>
                </div>
            </div>
        </div>

        <!-- GRID -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">

            <!-- VISTA PREVIA -->
            <div>
                <div class="flex items-center gap-2 mb-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span>
                    <span class="text-[10px] font-semibold uppercase tracking-widest"
                        :class="isDark ? 'text-white/50' : 'text-slate-400'">Vista previa</span>
                </div>
                <div class="rounded-xl border p-4 flex flex-col items-center justify-center min-h-[130px]"
                    :class="isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'">
                    <div class="w-full max-w-[260px] rounded-lg border p-3"
                        :class="isDark ? 'bg-slate-800 border-indigo-500/20' : 'bg-white border-slate-200'">
                        <div class="flex items-center gap-2 border-b pb-2 mb-2"
                            :class="isDark ? 'border-white/10' : 'border-slate-100'">
                            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse inline-block"></span>
                            <span class="text-[10px] font-semibold uppercase tracking-wide text-indigo-500">
                                {{ notif.title || 'Título del mensaje' }}
                            </span>
                        </div>
                        <p class="text-[11px] font-medium leading-relaxed"
                            :class="isDark ? 'text-white/60' : 'text-slate-500'">
                            {{ notif.body || 'El mensaje aparecerá aquí...' }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- HISTORIAL -->
            <div>
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <span class="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                        <span class="text-[10px] font-semibold uppercase tracking-widest"
                            :class="isDark ? 'text-white/50' : 'text-slate-400'">Historial</span>
                    </div>
                    <button @click="deactivateAll"
                        class="text-[10px] font-semibold uppercase px-3 py-1 rounded-full border border-red-400/30 text-red-400 hover:bg-red-500/10 transition-all">
                        Desactivar todo
                    </button>
                </div>

                <div class="rounded-xl border overflow-hidden"
                    :class="isDark ? 'bg-[#0f172a]/80 border-white/5' : 'bg-white border-slate-200'">

                    <div v-if="!notificationLogs.length" class="py-8 text-center text-[11px] font-medium"
                        :class="isDark ? 'text-white/30' : 'text-slate-400'">
                        Sin registros
                    </div>

                    <div v-else class="max-h-[400px] overflow-y-auto">
                        <table class="w-full text-left border-collapse table-fixed">
                            <thead class="sticky top-0 z-10" :class="isDark ? 'bg-slate-800' : 'bg-slate-50'">
                                <tr class="text-[9px] font-semibold uppercase tracking-wider"
                                    :class="isDark ? 'text-white/30' : 'text-slate-400'">
                                    <th class="px-3 py-2 border-b w-[36%]"
                                        :class="isDark ? 'border-white/5' : 'border-slate-100'">
                                        Mensaje</th>
                                    <th class="px-3 py-2 border-b text-center w-[18%]"
                                        :class="isDark ? 'border-white/5' : 'border-slate-100'">Tipo</th>
                                    <th class="px-3 py-2 border-b text-center w-[24%]"
                                        :class="isDark ? 'border-white/5' : 'border-slate-100'">Estado</th>
                                    <th class="px-3 py-2 border-b text-right w-[22%]"
                                        :class="isDark ? 'border-white/5' : 'border-slate-100'">Fecha</th>
                                </tr>
                            </thead>
                            <tbody :class="isDark ? 'text-white' : 'text-slate-700'">
                                <tr v-for="log in notificationLogs" :key="log.id" class="border-b transition-all"
                                    :class="isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'">
                                    <td class="px-3 py-2 text-[11px] font-medium truncate">{{ log.title }}</td>
                                    <td class="px-3 py-2 text-center">
                                        <span class="text-[9px] font-semibold px-2 py-0.5 rounded-full" :class="{
                                            'bg-red-500/10 text-red-400': log.type === 'alert',
                                            'bg-blue-500/10 text-blue-400': log.type === 'update',
                                            'bg-indigo-500/10 text-indigo-400': log.type === 'info'
                                        }">{{ log.type }}</span>
                                    </td>
                                    <td class="px-3 py-2 text-center">
                                        <button v-if="log.is_active" @click="deactivateNotification(log.id)"
                                            class="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
                                            Activo
                                        </button>
                                        <span v-else
                                            class="text-[9px] font-medium px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400">
                                            Inactivo
                                        </span>
                                    </td>
                                    <td class="px-3 py-2 text-right font-mono text-[10px] opacity-40">{{ log.date }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const props = defineProps({
    isDark: Boolean,
    apiUrl: String,
});

const emit = defineEmits(['notification-sent']);

const notif = ref({ title: '', body: '', type: 'info' });
const notificationLogs = ref([]);

const fetchNotificationLogs = async () => {
    try {
        const res = await fetch(`${props.apiUrl}/notifications/history`);
        const data = await res.json();
        notificationLogs.value = data.map(n => ({
            ...n,
            date: new Date(n.created_at).toLocaleDateString('es-CO', {
                day: '2-digit', month: '2-digit'
            }) + ' ' + new Date(n.created_at).toLocaleTimeString('es-CO', {
                hour: '2-digit', minute: '2-digit'
            })
        }));
    } catch (e) { console.error('Error cargando historial', e); }
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

onMounted(() => fetchNotificationLogs());
</script>