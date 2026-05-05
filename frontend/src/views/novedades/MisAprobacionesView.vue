<template>
    <div class="w-full h-full animate-fade-in flex flex-col gap-2">

        <!-- Header -->
        <div class="flex items-center justify-between p-1.5 px-3 rounded-2xl border shrink-0 shadow-sm"
            :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">
            <div class="flex items-center gap-2 ml-1">
                <div class="w-7 h-7 flex items-center justify-center rounded-xl bg-[#FF8F00] text-white shadow-sm">
                    <i class="fas fa-folder-open text-xs"></i>
                </div>
                <div>
                    <h2 class="text-base font-black uppercase tracking-tighter"
                        :class="isDark ? 'text-white' : 'text-slate-800'">
                        Novedades <span class="text-[#FF8F00]">Mi Equipo</span>
                    </h2>
                    <div class="flex items-center gap-1.5 mt-0.5">
                        <i :class="modoIcon" class="text-[8px] text-[#FF8F00]"></i>
                        <p class="text-[8px] font-bold opacity-50 uppercase tracking-[0.2em]"
                            :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ modoLabel }}</p>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <!-- Tabs Por Aprobar / Historial -->
                <div class="flex items-center rounded-xl border overflow-hidden"
                    :class="isDark ? 'border-[#2d3548]' : 'border-slate-200'">
                    <button @click="activeTab = 'pendientes'"
                        class="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                        :class="activeTab === 'pendientes'
                            ? 'bg-[#FF8F00] text-black'
                            : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')">
                        <i class="fas fa-folder-open text-[9px]"></i>
                        Por Aprobar
                        <span v-if="pendientes.length > 0"
                            class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-black"
                            :class="activeTab === 'pendientes' ? 'bg-black/20 text-black' : 'bg-[#FF8F00]/20 text-[#FF8F00]'">
                            {{ pendientes.length }}
                        </span>
                    </button>
                    <button @click="activeTab = 'historial'"
                        class="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                        :class="activeTab === 'historial'
                            ? 'bg-[#FF8F00] text-black'
                            : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')">
                        <i class="fas fa-clock-rotate-left text-[9px]"></i>
                        Historial
                    </button>
                </div>

                <button @click="$emit('volver')"
                    class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-black uppercase italic tracking-widest border transition-all hover:scale-105"
                    :class="isDark ? 'bg-[#273045] border-[#2d3548] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'">
                    <i class="fas fa-arrow-left text-[9px]"></i> Volver
                </button>
            </div>
        </div>

        <!-- Contenido -->
        <div class="flex-1 flex flex-col overflow-hidden rounded-2xl border"
            :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

            <div v-if="loading" class="flex-1 flex items-center justify-center gap-2">
                <i class="fas fa-circle-notch fa-spin text-[#FF8F00]"></i>
                <span class="text-[11px] font-black uppercase tracking-widest opacity-50"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cargando...</span>
            </div>

            <!-- TAB: POR APROBAR -->
            <template v-else-if="activeTab === 'pendientes'">
                <div v-if="pendientes.length === 0" class="flex-1 flex items-center justify-center">
                    <div class="flex flex-col items-center gap-2 opacity-40">
                        <i class="fas fa-check-circle text-3xl text-emerald-500"></i>
                        <p class="text-[11px] font-black uppercase tracking-widest"
                            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Sin novedades pendientes</p>
                    </div>
                </div>

                <div v-else class="flex-1 overflow-y-auto">
                    <table class="w-full border-separate border-spacing-0">
                        <thead class="sticky top-0 z-10">
                            <tr class="bg-[#334155]">
                                <th class="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Colaborador</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Inicio</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Fin</th>
                                <th class="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Descripción</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Capital Humano</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Motivo Capital</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Motivo Jefe</th>
                                <th class="px-4 py-2.5 text-right text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item, idx) in pendientes" :key="item.id"
                                :class="[idx % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-transparent',
                                isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-orange-50']">

                                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <div class="flex items-center gap-2">
                                        <div class="w-7 h-7 rounded-lg bg-[#FF8F00]/10 flex items-center justify-center text-[10px] font-black text-[#FF8F00] shrink-0">
                                            {{ item.nombre?.charAt(0) ?? '?' }}
                                        </div>
                                        <div>
                                            <p class="text-[10px] font-black uppercase" :class="isDark ? 'text-white' : 'text-slate-800'">{{ item.nombre }}</p>
                                            <p class="text-[10px] opacity-50">CC: {{ item.cedula }}</p>
                                        </div>
                                    </div>
                                </td>

                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <span class="text-[11px] font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ formatFecha(item.fechaInicio) }}</span>
                                </td>
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <span class="text-[11px] font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ formatFecha(item.fechaFin) }}</span>
                                </td>

                                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <p class="text-[12px] font-medium line-clamp-1 max-w-[180px]" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ item.descripcion }}</p>
                                </td>

                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <EstadoBadge :valor="item.aprobadoRrhh" />
                                </td>

                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <span v-if="item.motivoRrhh" @click="verMotivo(item.motivoRrhh, 'Motivo Capital Humano')"
                                        class="cursor-pointer text-[11px] font-bold text-[#FF8F00] hover:underline">
                                        <i class="fas fa-comment-alt mr-1"></i>Ver
                                    </span>
                                    <span v-else class="text-[11px] opacity-30">—</span>
                                </td>

                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <span v-if="item.motivoJefe" @click="verMotivo(item.motivoJefe, 'Motivo Jefe Directo')"
                                        class="cursor-pointer text-[11px] font-bold text-[#FF8F00] hover:underline">
                                        <i class="fas fa-comment-alt mr-1"></i>Ver
                                    </span>
                                    <span v-else class="text-[11px] opacity-30">—</span>
                                </td>

                                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <div class="flex items-center justify-end">
                                        <button @click.stop="toggleMenu($event, item.id)"
                                            class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95"
                                            :class="isDark ? 'bg-[#273045] border-[#2d3548] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'">
                                            <i class="fas fa-ellipsis-vertical text-[10px]"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="px-4 py-1.5 border-t shrink-0" :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-100 bg-slate-50'">
                    <p class="text-[9px] font-black uppercase tracking-widest" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                        Por aprobar: <span class="text-[#FF8F00]">{{ pendientes.length }}</span>
                    </p>
                </div>
            </template>

            <!-- TAB: HISTORIAL -->
            <template v-else>
                <!-- Filtros historial -->
                <div class="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b shrink-0"
                    :class="isDark ? 'border-[#2d3548] bg-[#1a2035]' : 'border-slate-100 bg-slate-50'">

                    <!-- Búsqueda -->
                    <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border focus-within:ring-1 focus-within:ring-[#FF8F00]/30 flex-1 min-w-[160px]"
                        :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-200 bg-white'">
                        <i class="fas fa-search text-[#FF8F00] text-[9px]"></i>
                        <input v-model="histBuscar" type="text" placeholder="Buscar colaborador..."
                            class="bg-transparent text-[10px] font-bold outline-none w-full placeholder:font-normal placeholder:text-slate-500"
                            :class="isDark ? 'text-white' : 'text-slate-700'" />
                    </div>

                    <!-- Filtro estado -->
                    <select v-model="histEstado"
                        class="px-2.5 py-1.5 rounded-lg border text-[10px] font-bold outline-none"
                        :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white' : 'bg-white border-slate-200 text-slate-700'">
                        <option value="">Todos los estados</option>
                        <option value="nueva">🟠 Nuevas</option>
                        <option value="pendiente">🟡 En revisión</option>
                        <option value="aprobada">🟢 Aprobadas</option>
                        <option value="rechazada">🔴 No aprobadas</option>
                    </select>

                    <button v-if="histBuscar || histEstado" @click="histBuscar=''; histEstado=''"
                        class="p-1.5 rounded-lg border text-[10px] transition-colors"
                        :class="isDark ? 'border-[#2d3548] bg-[#273045] text-slate-400 hover:text-[#FF8F00]' : 'border-slate-200 bg-white text-slate-500 hover:text-[#FF8F00]'">
                        <i class="fas fa-rotate-left"></i>
                    </button>
                </div>

                <div v-if="historialFiltrado.length === 0" class="flex-1 flex items-center justify-center">
                    <div class="flex flex-col items-center gap-2 opacity-40">
                        <i class="fas fa-inbox text-3xl" :class="isDark ? 'text-slate-600' : 'text-slate-300'"></i>
                        <p class="text-[11px] font-black uppercase tracking-widest" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Sin novedades</p>
                    </div>
                </div>

                <div v-else class="flex-1 overflow-y-auto overflow-x-auto">
                    <table class="w-full border-separate border-spacing-0">
                        <thead class="sticky top-0 z-10">
                            <tr class="bg-[#334155]">
                                <th class="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Colaborador</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Inicio</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Fin</th>
                                <th class="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Descripción</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Estado</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Jefe</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Capital</th>
                                <th class="px-4 py-2.5 text-right text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Soporte</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item, idx) in historialFiltrado" :key="'h-'+item.id"
                                :class="[idx % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-transparent',
                                isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-orange-50']">

                                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <div class="flex items-center gap-2">
                                        <div class="w-7 h-7 rounded-lg bg-[#FF8F00]/10 flex items-center justify-center text-[10px] font-black text-[#FF8F00] shrink-0">
                                            {{ item.nombre?.charAt(0) ?? '?' }}
                                        </div>
                                        <div>
                                            <p class="text-[10px] font-black uppercase" :class="isDark ? 'text-white' : 'text-slate-800'">{{ item.nombre }}</p>
                                            <p class="text-[9px] opacity-50">CC: {{ item.cedula }}</p>
                                        </div>
                                    </div>
                                </td>

                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <span class="text-[11px] font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ formatFecha(item.fechaInicio) }}</span>
                                </td>
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <span class="text-[11px] font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ formatFecha(item.fechaFin) }}</span>
                                </td>

                                <td class="px-4 py-2.5 border-b max-w-[200px]" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <p class="text-[11px] font-medium line-clamp-2" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ item.descripcion }}</p>
                                </td>

                                <!-- Estado visual tipo carpeta -->
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <FolderEstado :nov="item" />
                                </td>

                                <!-- Jefe badge -->
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <EstadoBadge :valor="item.aprobadoJefe" mini />
                                </td>

                                <!-- RRHH badge -->
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <EstadoBadge :valor="item.aprobadoRrhh" mini />
                                </td>

                                <td class="px-4 py-2.5 text-right border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <button @click="verSoporte(item)"
                                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95"
                                        :class="isDark ? 'bg-[#273045] text-slate-300 border-[#3d4558]' : 'bg-slate-100 text-slate-600 border-slate-200'">
                                        <i class="fas fa-eye text-[#FF8F00]"></i> Ver
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="px-4 py-1.5 border-t shrink-0" :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-100 bg-slate-50'">
                    <p class="text-[9px] font-black uppercase tracking-widest" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                        Total historial: <span :class="isDark ? 'text-white' : 'text-slate-800'">{{ historialFiltrado.length }}</span>
                        / {{ novedades.length }}
                    </p>
                </div>
            </template>
        </div>

        <!-- Modal soporte -->
        <teleport to="body">
            <div v-if="soporteModal.open"
                class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                @mousedown.self="soporteModal.open = false">
                <div class="w-full max-w-2xl h-[70vh] rounded-2xl border flex flex-col overflow-hidden shadow-2xl"
                    :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">
                    <div class="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
                        :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                        <span class="text-[11px] font-black uppercase tracking-widest"
                            :class="isDark ? 'text-white' : 'text-slate-700'">
                            <i class="fas fa-eye text-[#FF8F00] mr-2"></i>Soporte
                        </span>
                        <button @click="soporteModal.open = false"
                            class="w-7 h-7 rounded-lg flex items-center justify-center border"
                            :class="isDark ? 'bg-[#273045] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-500 border-slate-200'">
                            <i class="fas fa-xmark text-xs"></i>
                        </button>
                    </div>
                    <div class="flex-1 overflow-hidden flex items-center justify-center p-2"
                        :class="isDark ? 'bg-[#151c2c]' : 'bg-slate-50'">
                        <div v-if="soporteModal.loading" class="flex items-center gap-2 opacity-50">
                            <i class="fas fa-circle-notch fa-spin text-[#FF8F00]"></i>
                            <span class="text-[11px] font-black uppercase">Cargando...</span>
                        </div>
                        <img v-else-if="soporteModal.isImage" :src="soporteModal.url"
                            class="max-w-full max-h-full object-contain rounded-lg shadow-xl" />
                        <iframe v-else-if="soporteModal.isPdf" :src="soporteModal.url"
                            class="w-full h-full rounded-lg border-0" />
                        <div v-else class="flex flex-col items-center gap-3 opacity-60">
                            <i class="fas fa-file text-4xl text-slate-400"></i>
                            <p class="text-[10px]">Vista previa no disponible</p>
                        </div>
                    </div>
                </div>
            </div>
        </teleport>

        <!-- Modal motivo genérico -->
        <teleport to="body">
            <div v-if="motivoModal.open"
                class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                @mousedown.self="motivoModal.open = false">
                <div class="w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl"
                    :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-comment-alt text-[#FF8F00]"></i>
                        <h3 class="text-sm font-black uppercase tracking-widest"
                            :class="isDark ? 'text-white' : 'text-slate-800'">
                            {{ motivoModal.titulo }}
                        </h3>
                    </div>
                    <p class="text-[15px] font-medium leading-relaxed"
                        :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                        {{ motivoModal.texto }}
                    </p>
                    <button @click="motivoModal.open = false"
                        class="py-2 rounded-lg text-[10px] font-black uppercase italic border"
                        :class="isDark ? 'border-[#2d3548] text-slate-400' : 'border-slate-200 text-slate-500'">
                        Cerrar
                    </button>
                </div>
            </div>
        </teleport>

        <!-- Menú contextual (tab pendientes) -->
        <teleport to="body">
            <div v-if="menuAbierto !== null" class="fixed inset-0 z-40" @click="menuAbierto = null"></div>

            <transition name="fade-msg">
                <div v-if="menuAbierto !== null" class="fixed z-50 w-44 rounded-xl border shadow-2xl overflow-hidden"
                    :style="{ top: menuPos.y + 'px', left: menuPos.x + 'px' }"
                    :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

                    <button @click="verSoporte(itemMenuActual); menuAbierto = null"
                        class="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase italic tracking-widest transition-all hover:bg-[#FF8F00]/10"
                        :class="isDark ? 'text-slate-300' : 'text-slate-700'">
                        <i class="fas fa-eye text-[#FF8F00] w-3"></i> Ver soporte
                    </button>

                    <div class="border-t mx-2" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'"></div>

                    <button @click="abrirAccion(itemMenuActual, 1); menuAbierto = null"
                        class="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase italic tracking-widest transition-all hover:bg-emerald-500/10"
                        :class="isDark ? 'text-emerald-400' : 'text-emerald-600'">
                        <i class="fas fa-check w-3"></i> Aprobar
                    </button>

                    <button @click="abrirAccion(itemMenuActual, 0); menuAbierto = null"
                        class="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase italic tracking-widest transition-all hover:bg-red-500/10"
                        :class="isDark ? 'text-red-400' : 'text-red-500'">
                        <i class="fas fa-xmark w-3"></i> Rechazar
                    </button>
                </div>
            </transition>
        </teleport>

        <!-- Modal aprobar/rechazar -->
        <teleport to="body">
            <div v-if="accionModal.open"
                class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                @mousedown.self="accionModal.open = false">
                <div class="w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl"
                    :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">
                    <div class="flex items-center gap-2">
                        <i :class="accionModal.tipo === 1 ? 'fas fa-check-circle text-emerald-500' : 'fas fa-times-circle text-red-400'"
                            class="text-lg"></i>
                        <h3 class="text-sm font-black uppercase tracking-widest"
                            :class="isDark ? 'text-white' : 'text-slate-800'">
                            {{ accionModal.tipo === 1 ? 'Aprobar' : 'Rechazar' }} novedad
                        </h3>
                    </div>
                    <p class="text-[10px] font-bold opacity-60" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                        {{ accionModal.nombre }}
                    </p>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[9px] font-black uppercase tracking-widest"
                            :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                            Motivo <span class="text-red-400">*</span>
                        </label>
                        <textarea v-model="accionModal.motivo" rows="3"
                            :placeholder="accionModal.tipo === 1 ? 'Motivo de aprobación...' : 'Motivo de rechazo...'"
                            class="px-3 py-2.5 rounded-lg border text-xs font-medium outline-none resize-none placeholder:text-slate-500"
                            :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white' : 'bg-white border-slate-200 text-slate-800'">
                        </textarea>
                    </div>
                    <div class="flex gap-2 pt-1">
                        <button type="button" @click="accionModal.open = false"
                            class="flex-1 py-2 rounded-lg text-[10px] font-black uppercase italic border"
                            :class="isDark ? 'border-[#2d3548] text-slate-400' : 'border-slate-200 text-slate-500'">
                            Cancelar
                        </button>
                        <button type="button" @click="confirmarAccion" :disabled="!accionModal.motivo.trim()"
                            class="flex-1 py-2 rounded-lg text-[10px] font-black uppercase italic transition-all disabled:opacity-40"
                            :class="accionModal.tipo === 1 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'">
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        </teleport>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent, h } from 'vue';
import { useNovedades, getEstadoVisual } from '../../composables/adminLogica/useNovedades';
import axios from 'axios';

const props = defineProps({ isDark: Boolean });
const emit = defineEmits(['volver']);

const { novedades, loading, aprobarJefe, getFileUrl, fetchPorArea, fetchPorSegmento, fetchPorDepartamentos } = useNovedades();

const API_URL = import.meta.env.VITE_API_URL;
const session = JSON.parse(localStorage.getItem('user_session') || '{}');
const miIdOdoo = session?.id_odoo;

const activeTab = ref('pendientes');
const histBuscar = ref('');
const histEstado = ref('');

// ─── Nivel de acceso ──────────────────────────────────────────────
const esDirector = session?.isSuperAdmin || session?.permisos?.['novedades.director'] === true;
const esSegmento = !esDirector && session?.permisos?.['novedades.ver_segmento'] === true;

const modoLabel = esDirector
    ? 'Director — Todo el departamento'
    : esSegmento
        ? 'Jefe — Todo el segmento'
        : 'Jefe — Solo mi área';
const modoIcon = esDirector ? 'fas fa-building' : esSegmento ? 'fas fa-sitemap' : 'fas fa-users';

// ─── Componentes internos reutilizables ──────────────────────────

/** Badge sencillo para aprobadoJefe / aprobadoRrhh */
const EstadoBadge = defineComponent({
    props: { valor: { default: null }, mini: Boolean },
    setup(p) {
        return () => {
            const v = p.valor;
            if (v === 1) return h('span', {
                class: 'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
            }, [h('i', { class: 'fas fa-check' }), !p.mini && ' Aprobado'].filter(Boolean));
            if (v === 0) return h('span', {
                class: 'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase bg-red-500/10 text-red-400 border border-red-500/20'
            }, [h('i', { class: 'fas fa-xmark' }), !p.mini && ' Rechazado'].filter(Boolean));
            return h('span', {
                class: 'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20'
            }, [h('i', { class: 'fas fa-clock' }), !p.mini && ' Pendiente'].filter(Boolean));
        };
    }
});

/** Folder badge — icono carpeta con color según estado */
const FolderEstado = defineComponent({
    props: { nov: Object },
    setup(p) {
        return () => {
            const cfg = getEstadoVisual(p.nov);
            return h('span', {
                class: `inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${cfg.bg}`
            }, [
                h('i', { class: cfg.icon, style: { color: cfg.color } }),
                h('span', { style: { color: cfg.color } }, cfg.label)
            ]);
        };
    }
});

// ─── Datos ────────────────────────────────────────────────────────
onMounted(async () => {
    if (esDirector) {
        try {
            const res = await axios.get(`${API_URL}/departamentos-permitidos/${miIdOdoo}`);
            const deptos = Array.isArray(res.data) ? res.data : [];
            await fetchPorDepartamentos(deptos);
        } catch {
            await fetchPorSegmento(miIdOdoo);
        }
    } else if (esSegmento) {
        await fetchPorSegmento(miIdOdoo);
    } else {
        await fetchPorArea(miIdOdoo);
    }
});

// ─── Computadas ───────────────────────────────────────────────────
/** Solo las que aún esperan mi aprobación como jefe */
const pendientes = computed(() =>
    novedades.value.filter(n => n.aprobadoJefe === null || n.aprobadoJefe === undefined)
);

/** Historial completo con filtros opcionales */
const historialFiltrado = computed(() => {
    let lista = novedades.value;

    if (histBuscar.value) {
        const q = histBuscar.value.toLowerCase();
        lista = lista.filter(n =>
            (n.nombre ?? '').toLowerCase().includes(q) ||
            (n.descripcion ?? '').toLowerCase().includes(q)
        );
    }

    if (histEstado.value) {
        lista = lista.filter(n => {
            const cfg = getEstadoVisual(n);
            const label = cfg.label.toLowerCase();
            const filtro = histEstado.value;
            if (filtro === 'nueva') return label === 'nueva';
            if (filtro === 'pendiente') return label.includes('revisión') || label.includes('pend.');
            if (filtro === 'aprobada') return label === 'aprobada';
            if (filtro === 'rechazada') return label === 'no aprobada';
            return true;
        });
    }

    return lista;
});

// ─── Helpers ──────────────────────────────────────────────────────
const formatFecha = (f) => {
    if (!f) return '—';
    return new Date(f + 'T00:00:00').toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

// ─── Modal soporte ────────────────────────────────────────────────
const soporteModal = ref({ open: false, url: '', isImage: false, isPdf: false, loading: false });

const verSoporte = (novedad) => {
    const url = getFileUrl(novedad.id);
    const mime = novedad.soporteMime ?? '';
    soporteModal.value = {
        open: true,
        url,
        isImage: mime.startsWith('image/'),
        isPdf: mime === 'application/pdf',
        loading: false,
    };
};

// ─── Modal motivo ─────────────────────────────────────────────────
const motivoModal = ref({ open: false, titulo: '', texto: '' });
const verMotivo = (texto, titulo = 'Motivo') => {
    motivoModal.value = { open: true, titulo, texto };
};

// ─── Menú contextual ──────────────────────────────────────────────
const menuAbierto = ref(null);
const itemMenuActual = ref(null);
const menuPos = ref({ x: 0, y: 0 });

const toggleMenu = (event, id) => {
    if (menuAbierto.value === id) { menuAbierto.value = null; return; }
    const btn = event.currentTarget.getBoundingClientRect();
    menuPos.value = { x: btn.right - 176, y: btn.bottom + 6 };
    itemMenuActual.value = pendientes.value.find(n => n.id === id);
    menuAbierto.value = id;
};

// ─── Modal aprobar/rechazar ───────────────────────────────────────
const accionModal = ref({ open: false, tipo: 1, id: null, nombre: '', motivo: '' });

const abrirAccion = (item, tipo) => {
    accionModal.value = { open: true, tipo, id: item.id, nombre: item.nombre, motivo: '' };
};

const confirmarAccion = async () => {
    if (!accionModal.value.motivo.trim()) return;
    try {
        await aprobarJefe(accionModal.value.id, accionModal.value.tipo, accionModal.value.motivo);
        accionModal.value.open = false;
    } catch (e) {
        console.error('Error:', e);
    }
};
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}

.fade-msg-enter-active,
.fade-msg-leave-active { transition: all 0.2s ease; }
.fade-msg-enter-from,
.fade-msg-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
