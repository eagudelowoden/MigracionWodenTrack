<template>
    <div class="w-full h-full animate-fade-in flex flex-col gap-1.5">

        <!-- Header -->
        <div class="flex items-center gap-2 px-3 py-2 rounded-md border shrink-0"
            :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

            <div class="flex items-center gap-2 shrink-0">
                <div class="w-6 h-6 flex items-center justify-center rounded-lg bg-[#3B82F6] text-white shrink-0">
                    <i class="fas fa-users text-[10px]"></i>
                </div>
                <div>
                    <h2 class="text-sm font-semibold uppercase tracking-tight leading-none"
                        :class="isDark ? 'text-white' : 'text-slate-800'">
                        Novedades <span class="text-[#3B82F6]">Mi Equipo</span>
                    </h2>
                    <div class="flex items-center gap-1 mt-0.5">
                        <i :class="modoIcon" class="text-[8px] text-[#3B82F6]"></i>
                        <p class="text-[8px] font-semibold opacity-40 uppercase tracking-[0.15em]"
                            :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ modoLabel }}</p>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-1.5 ml-auto shrink-0">
                <!-- Tabs -->
                <div class="flex items-center rounded-lg border overflow-hidden"
                    :class="isDark ? 'border-[#222938]' : 'border-slate-200'">
                    <button @click="activeTab = 'pendientes'"
                        class="px-2.5 py-1.5 text-[8px] font-semibold uppercase tracking-wide transition-all flex items-center gap-1"
                        :class="activeTab === 'pendientes'
                            ? 'bg-[#3B82F6] text-white'
                            : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')">
                        <i class="fas fa-clock-rotate-left text-[8px]"></i>
                        Por Aprobar
                        <span v-if="pendientes.length > 0"
                            class="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[7px] font-semibold"
                            :class="activeTab === 'pendientes' ? 'bg-black/20 text-black' : 'bg-[#3B82F6]/20 text-[#3B82F6]'">
                            {{ pendientes.length }}
                        </span>
                    </button>
                    <button @click="activeTab = 'historial'"
                        class="px-2.5 py-1.5 text-[8px] font-semibold uppercase tracking-wide transition-all flex items-center gap-1"
                        :class="activeTab === 'historial'
                            ? 'bg-[#3B82F6] text-white'
                            : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')">
                        <i class="fas fa-list text-[8px]"></i>
                        Historial
                    </button>
                    <button @click="activeTab = 'carpetas'"
                        class="px-2.5 py-1.5 text-[8px] font-semibold uppercase tracking-wide transition-all flex items-center gap-1"
                        :class="activeTab === 'carpetas'
                            ? 'bg-[#3B82F6] text-white'
                            : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')">
                        <i class="fas fa-folder text-[8px]"></i>
                        Carpetas
                        <span v-if="novedadesEnCarpeta > 0"
                            class="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[7px] font-semibold"
                            :class="activeTab === 'carpetas' ? 'bg-black/20 text-black' : 'bg-[#3B82F6]/20 text-[#3B82F6]'">
                            {{ novedadesEnCarpeta }}
                        </span>
                    </button>
                </div>

                <!-- Botón carpetas -->
                <button @click="modalCarpetas.open = true"
                    class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[8px] font-semibold uppercase tracking-wide transition-all hover:brightness-110"
                    :class="isDark ? 'bg-[#161B26] border-[#222938] text-[#3B82F6]' : 'bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#3B82F6]'">
                    <i class="fas fa-folder-plus text-[9px]"></i> Carpetas
                </button>

                <!-- Botón volver -->
                <button @click="$emit('volver')"
                    class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[8px] font-semibold uppercase tracking-wide border transition-all hover:brightness-110 active:scale-[0.98]"
                    :class="isDark ? 'bg-[#161B26] border-[#222938] text-slate-400 hover:text-white hover:border-slate-500' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 shadow-sm'">
                    <i class="fas fa-arrow-left text-[8px]"></i> Volver
                </button>
            </div>
        </div>

        <!-- Contenido -->
        <div class="flex-1 flex flex-col overflow-hidden rounded-md border min-h-0"
            :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

            <div v-if="loading" class="flex-1 flex items-center justify-center gap-2">
                <i class="fas fa-circle-notch fa-spin text-[#3B82F6]"></i>
                <span class="text-[11px] font-semibold uppercase tracking-wide opacity-50"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cargando...</span>
            </div>

            <!-- TAB: POR APROBAR -->
            <template v-else-if="activeTab === 'pendientes'">
                <div v-if="pendientes.length === 0" class="flex-1 flex items-center justify-center">
                    <div class="flex flex-col items-center gap-2 opacity-40">
                        <i class="fas fa-check-circle text-3xl text-emerald-500"></i>
                        <p class="text-[11px] font-semibold uppercase tracking-wide"
                            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Sin novedades pendientes</p>
                    </div>
                </div>

                <div v-else class="flex-1 overflow-y-auto overflow-x-auto">
                    <table class="w-full border-separate border-spacing-0">
                        <thead class="sticky top-0 z-10">
                            <tr class="bg-[#334155]">
                                <th class="px-4 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Colaborador</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Tipo</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Inicio</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Fin</th>
                                <th class="px-4 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Descripción</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Mot. Jefe</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Mi Carpeta</th>
                                <th class="px-4 py-2.5 text-right text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item, idx) in pendientes" :key="item.id"
                                @click="abrirDetalle(item)"
                                class="cursor-pointer"
                                :class="[idx % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-transparent',
                                isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-blue-50/60']">

                                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                    <div class="flex items-center gap-2">
                                        <div class="w-7 h-7 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center text-[10px] font-semibold text-[#3B82F6] shrink-0">
                                            {{ item.nombre?.charAt(0) ?? '?' }}
                                        </div>
                                        <div>
                                            <p class="text-[10px] font-semibold uppercase" :class="isDark ? 'text-white' : 'text-slate-800'">{{ item.nombre }}</p>
                                            <p class="text-[10px] opacity-50">CC: {{ item.cedula }}</p>
                                        </div>
                                    </div>
                                </td>
                                <!-- Tipificación -->
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                    <span v-if="item.tipificacion"
                                        class="px-2 py-0.5 rounded-md text-[8px] font-semibold uppercase tracking-wide border whitespace-nowrap"
                                        :class="item.tipificacion === 'Renuncia'
                                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                            : (isDark ? 'bg-[#161B26] text-slate-300 border-[#3d4558]' : 'bg-slate-100 text-slate-600 border-slate-200')">
                                        {{ item.tipificacion }}
                                    </span>
                                    <span v-else class="text-[11px] opacity-30">—</span>
                                </td>
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                    <span class="text-[11px] font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ formatFecha(item.fechaInicio) }}</span>
                                </td>
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                    <span class="text-[11px] font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ formatFecha(item.fechaFin) }}</span>
                                </td>
                                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                    <div class="flex items-center gap-2 max-w-[200px]">
                                        <p class="text-[12px] font-medium line-clamp-1 flex-1" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ item.descripcion }}</p>
                                    </div>
                                </td>
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                    <span v-if="item.motivoJefe" @click.stop="verMotivo(item.motivoJefe, 'Motivo Jefe Directo')"
                                        class="cursor-pointer text-[11px] font-bold text-[#3B82F6] hover:underline">
                                        <i class="fas fa-comment-alt mr-1"></i>Ver
                                    </span>
                                    <span v-else class="text-[11px] opacity-30">—</span>
                                </td>
                                <!-- Mi Carpeta (coordinador) -->
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'" @click.stop>
                                    <CarpetaBadge :nombre="item.estadoChCoord" :estados="estadosCh" @click="abrirCarpeta(item)" />
                                </td>
                                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                    <div class="flex items-center justify-end">
                                        <button @click.stop="toggleMenu($event, item.id)"
                                            class="w-7 h-7 flex items-center justify-center rounded-lg border transition-all active:scale-[0.98]"
                                            :class="isDark ? 'bg-[#161B26] border-[#222938] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'">
                                            <i class="fas fa-ellipsis-vertical text-[10px]"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="px-4 py-1.5 border-t shrink-0" :class="isDark ? 'border-[#222938] bg-[#161B26]' : 'border-slate-100 bg-slate-50'">
                    <p class="text-[9px] font-semibold uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                        Por aprobar: <span class="text-[#3B82F6]">{{ pendientes.length }}</span>
                    </p>
                </div>
            </template>

            <template v-else-if="activeTab === 'historial'">
                <!-- Filtros historial -->
                <div class="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b shrink-0"
                    :class="isDark ? 'border-[#222938] bg-[#1a2035]' : 'border-slate-100 bg-slate-50'">
                    <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border focus-within:ring-1 focus-within:ring-[#3B82F6]/30 flex-1 min-w-[160px]"
                        :class="isDark ? 'border-[#222938] bg-[#161B26]' : 'border-slate-200 bg-white'">
                        <i class="fas fa-search text-[#3B82F6] text-[9px]"></i>
                        <input v-model="histBuscar" type="text" placeholder="Buscar colaborador..."
                            class="bg-transparent text-[10px] font-bold outline-none w-full placeholder:font-normal placeholder:text-slate-500"
                            :class="isDark ? 'text-white' : 'text-slate-700'" />
                    </div>
                    <select v-model="histEstado"
                        class="px-2.5 py-1.5 rounded-lg border text-[10px] font-bold outline-none"
                        :class="isDark ? 'bg-[#161B26] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-700'">
                        <option value="">Todos los estados</option>
                        <option value="nueva">🟠 Nuevas</option>
                        <option value="pendiente">🟡 En revisión</option>
                        <option value="aprobada">🟢 Aprobadas</option>
                        <option value="rechazada">🔴 No aprobadas</option>
                    </select>
                    <button v-if="histBuscar || histEstado" @click="histBuscar=''; histEstado=''"
                        class="p-1.5 rounded-lg border text-[10px] transition-colors"
                        :class="isDark ? 'border-[#222938] bg-[#161B26] text-slate-400 hover:text-[#3B82F6]' : 'border-slate-200 bg-white text-slate-500 hover:text-[#3B82F6]'">
                        <i class="fas fa-rotate-left"></i>
                    </button>
                </div>

                <div v-if="historialFiltrado.length === 0" class="flex-1 flex items-center justify-center">
                    <div class="flex flex-col items-center gap-2 opacity-40">
                        <i class="fas fa-inbox text-3xl" :class="isDark ? 'text-slate-600' : 'text-slate-300'"></i>
                        <p class="text-[11px] font-semibold uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Sin novedades</p>
                    </div>
                </div>

                <div v-else class="flex-1 overflow-y-auto overflow-x-auto">
                    <table class="w-full border-separate border-spacing-0">
                        <thead class="sticky top-0 z-10">
                            <tr class="bg-[#334155]">
                                <th class="px-4 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Colaborador</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Tipo</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Inicio</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Fin</th>
                                <th class="px-4 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Descripción</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Jefe</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Mi Carpeta</th>
                                <th class="px-4 py-2.5 text-right text-[9px] font-semibold uppercase tracking-wide border-b border-[#222938] text-white">Soporte</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item, idx) in historialFiltrado" :key="'h-'+item.id"
                                @click="abrirDetalle(item)"
                                class="cursor-pointer"
                                :class="[idx % 2 !== 0 ? (isDark ? 'bg-white/[0.04]' : 'bg-slate-50') : 'bg-transparent',
                                isDark ? 'hover:bg-white/[0.08]' : 'hover:bg-blue-50/60']">

                                <td class="px-4 py-2.5 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                    <div class="flex items-center gap-2">
                                        <div class="w-7 h-7 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center text-[10px] font-semibold text-[#3B82F6] shrink-0">
                                            {{ item.nombre?.charAt(0) ?? '?' }}
                                        </div>
                                        <div>
                                            <p class="text-[10px] font-semibold uppercase" :class="isDark ? 'text-white' : 'text-slate-800'">{{ item.nombre }}</p>
                                            <p class="text-[9px] opacity-50">CC: {{ item.cedula }}</p>
                                        </div>
                                    </div>
                                </td>
                                <!-- Tipificación -->
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                    <span v-if="item.tipificacion"
                                        class="px-2 py-0.5 rounded-md text-[8px] font-semibold uppercase tracking-wide border whitespace-nowrap"
                                        :class="item.tipificacion === 'Renuncia'
                                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                            : (isDark ? 'bg-[#161B26] text-slate-300 border-[#3d4558]' : 'bg-slate-100 text-slate-600 border-slate-200')">
                                        {{ item.tipificacion }}
                                    </span>
                                    <span v-else class="text-[11px] opacity-30">—</span>
                                </td>
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                    <span class="text-[11px] font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ formatFecha(item.fechaInicio) }}</span>
                                </td>
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                    <span class="text-[11px] font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ formatFecha(item.fechaFin) }}</span>
                                </td>
                                <td class="px-4 py-2.5 border-b max-w-[200px]" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                    <p class="text-[11px] font-medium line-clamp-1" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ item.descripcion }}</p>
                                </td>
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                    <EstadoBadge :valor="item.aprobadoJefe" mini />
                                </td>
                                <!-- Mi Carpeta (coordinador) -->
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'" @click.stop>
                                    <CarpetaBadge :nombre="item.estadoChCoord" :estados="estadosCh" @click="abrirCarpeta(item)" />
                                </td>
                                <td class="px-4 py-2.5 text-right border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'" @click.stop>
                                    <button @click.stop="verSoporte(item)"
                                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9px] font-semibold uppercase tracking-wide transition-all hover:brightness-110 active:scale-[0.98]"
                                        :class="isDark ? 'bg-[#161B26] text-slate-300 border-[#3d4558]' : 'bg-slate-100 text-slate-600 border-slate-200'">
                                        <i class="fas fa-eye text-[#3B82F6]"></i> Ver
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="px-4 py-1.5 border-t shrink-0" :class="isDark ? 'border-[#222938] bg-[#161B26]' : 'border-slate-100 bg-slate-50'">
                    <p class="text-[9px] font-semibold uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                        Historial: <span :class="isDark ? 'text-white' : 'text-slate-800'">{{ historialFiltrado.length }}</span>
                        / {{ novedades.length }}
                    </p>
                </div>
            </template>
            <template v-else-if="activeTab === 'carpetas'">
                <div v-if="!estadosCh.length" class="flex-1 flex items-center justify-center">
                    <div class="flex flex-col items-center gap-3 opacity-40">
                        <i class="fas fa-folder-plus text-3xl text-[#3B82F6]"></i>
                        <p class="text-[11px] font-semibold uppercase tracking-wide text-center"
                            :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                            No tienes carpetas creadas.<br>
                            <span class="font-normal normal-case tracking-normal">Usa "Mis Carpetas" para crear una.</span>
                        </p>
                    </div>
                </div>

                <div v-else class="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
                    <div v-for="carpeta in novedadesPorCarpeta" :key="carpeta.id"
                        class="rounded-md border overflow-hidden"
                        :class="isDark ? 'border-[#222938]' : 'border-slate-200'">

                        <!-- Cabecera clicable para desplegar -->
                        <button @click="toggleCarpeta(carpeta.id)"
                            class="w-full flex items-center justify-between px-4 py-3 transition-colors"
                            :class="isDark ? 'bg-[#161B26] hover:bg-[#2d3a50]' : 'bg-slate-50 hover:bg-slate-100'">
                            <div class="flex items-center gap-2.5">
                                <i :class="carpeta.icono" :style="{ color: carpeta.color }" class="text-sm w-4 text-center"></i>
                                <span class="text-[11px] font-semibold uppercase tracking-wide"
                                    :style="{ color: carpeta.color }">{{ carpeta.nombre }}</span>
                                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[8px] font-semibold"
                                    :style="{ color: carpeta.color, background: carpeta.color + '20' }">
                                    {{ carpeta.items.length }}
                                </span>
                            </div>
                            <i class="fas text-[10px] transition-transform duration-200"
                                :class="[carpetasAbiertas.has(carpeta.id) ? 'fa-chevron-up' : 'fa-chevron-down',
                                isDark ? 'text-slate-500' : 'text-slate-400']"></i>
                        </button>

                        <!-- Contenido desplegable -->
                        <div v-if="carpetasAbiertas.has(carpeta.id)">
                            <div v-if="!carpeta.items.length" class="px-4 py-4 text-center border-t"
                                :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                <p class="text-[10px] opacity-40" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                                    Sin novedades en esta carpeta
                                </p>
                            </div>
                            <div v-else class="overflow-x-auto border-t" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                <table class="w-full border-separate border-spacing-0">
                                    <thead>
                                        <tr :class="isDark ? 'bg-[#1a2035]' : 'bg-white'">
                                            <th class="px-4 py-2 text-left text-[8px] font-semibold uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Colaborador</th>
                                            <th class="px-4 py-2 text-center text-[8px] font-semibold uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Inicio</th>
                                            <th class="px-4 py-2 text-center text-[8px] font-semibold uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Fin</th>
                                            <th class="px-4 py-2 text-left text-[8px] font-semibold uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Descripción</th>
                                            <th class="px-4 py-2 text-center text-[8px] font-semibold uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Estado</th>
                                            <th class="px-4 py-2 text-right text-[8px] font-semibold uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Mover</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(nov, idx) in carpeta.items" :key="'c-'+nov.id"
                                            :class="[idx % 2 !== 0 ? (isDark ? 'bg-white/[0.02]' : 'bg-slate-50/60') : 'bg-transparent',
                                            isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-white/[0.03]/50']">
                                            <td class="px-4 py-2.5 border-t" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                                <div class="flex items-center gap-2">
                                                    <div class="w-6 h-6 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center text-[9px] font-semibold text-[#3B82F6] shrink-0">
                                                        {{ nov.nombre?.charAt(0) ?? '?' }}
                                                    </div>
                                                    <div>
                                                        <p class="text-[10px] font-semibold uppercase" :class="isDark ? 'text-white' : 'text-slate-800'">{{ nov.nombre }}</p>
                                                        <p class="text-[9px] opacity-50">CC: {{ nov.cedula }}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="px-4 py-2.5 text-center border-t" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                                <span class="text-[10px] font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ formatFecha(nov.fechaInicio) }}</span>
                                            </td>
                                            <td class="px-4 py-2.5 text-center border-t" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                                <span class="text-[10px] font-bold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ formatFecha(nov.fechaFin) }}</span>
                                            </td>
                                            <td class="px-4 py-2.5 border-t max-w-[200px]" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                                <div class="flex items-center gap-2">
                                                    <p class="text-[10px] font-medium line-clamp-1 flex-1" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ nov.descripcion }}</p>
                                                    <span v-if="nov.descripcion" @click="verMotivo(nov.descripcion, 'Descripción')"
                                                        class="cursor-pointer text-[#3B82F6] hover:text-[#3B82F6]/70 shrink-0">
                                                        <i class="fas fa-eye text-[11px]"></i>
                                                    </span>
                                                </div>
                                            </td>
                                            <td class="px-4 py-2.5 text-center border-t" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                                <FolderEstado :nov="nov" />
                                            </td>
                                            <td class="px-4 py-2.5 text-right border-t" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                                                <button @click="abrirCarpeta(nov)"
                                                    class="inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-semibold uppercase tracking-wide transition-all hover:brightness-110"
                                                    :class="isDark ? 'bg-[#161B26] text-[#3B82F6] border-[#3d4558]' : 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30'">
                                                    <i class="fas fa-folder-open text-[8px]"></i> Mover
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="px-4 py-1.5 border-t shrink-0" :class="isDark ? 'border-[#222938] bg-[#161B26]' : 'border-slate-100 bg-slate-50'">
                    <p class="text-[9px] font-semibold uppercase tracking-wide" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                        Carpetas: <span class="text-[#3B82F6]">{{ estadosCh.length }}</span>
                        &nbsp;·&nbsp; Novedades asignadas: <span :class="isDark ? 'text-white' : 'text-slate-800'">{{ novedadesEnCarpeta }}</span>
                    </p>
                </div>
            </template>
        </div>

        <!-- ══════════════════════════════════════════════════════════
             MODAL: Gestión de Mis Carpetas (tipo coordinador)
        ══════════════════════════════════════════════════════════ -->
        <teleport to="body">
            <transition name="modal">
                <div v-if="modalCarpetas.open"
                    class="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style="background:rgba(0,0,0,0.7)" @click.self="modalCarpetas.open = false">

                    <div class="w-full max-w-md rounded-md border overflow-hidden"
                        :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

                        <!-- Header -->
                        <div class="flex items-center justify-between px-5 py-3.5 border-b"
                            :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-folder-plus text-[#3B82F6]"></i>
                                <h3 class="text-sm font-semibold uppercase tracking-wide"
                                    :class="isDark ? 'text-white' : 'text-slate-800'">Mis Carpetas</h3>
                            </div>
                            <button @click="modalCarpetas.open = false"
                                class="w-7 h-7 rounded-lg flex items-center justify-center border"
                                :class="isDark ? 'bg-[#161B26] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-500 border-slate-200'">
                                <i class="fas fa-xmark text-xs"></i>
                            </button>
                        </div>

                        <!-- Formulario crear / editar -->
                        <div class="px-5 py-4 border-b" :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                            <p class="text-[9px] font-semibold uppercase tracking-wide mb-3"
                                :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                                {{ editandoCarpeta ? '✏️ Editando carpeta' : 'Nueva carpeta' }}
                            </p>
                            <div class="flex gap-2">
                                <input v-model="nuevaCarpeta.nombre" type="text" placeholder="Nombre..."
                                    class="flex-1 px-3 py-2 rounded-lg border text-[11px] font-bold outline-none focus:ring-1 focus:ring-[#3B82F6]/40"
                                    :class="isDark ? 'bg-[#161B26] border-[#222938] text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-800'"
                                    @keyup.enter="guardarCarpeta" />
                                <input type="color" v-model="nuevaCarpeta.color"
                                    class="w-9 h-9 rounded-lg border cursor-pointer p-0.5 shrink-0"
                                    :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'" />
                                <select v-model="nuevaCarpeta.icono"
                                    class="px-2 py-2 rounded-lg border text-[10px] font-bold outline-none shrink-0"
                                    :class="isDark ? 'bg-[#161B26] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-700'">
                                    <option value="fas fa-folder">📁 Carpeta</option>
                                    <option value="fas fa-box-archive">📦 Archivo</option>
                                    <option value="fas fa-clock">⏰ Espera</option>
                                    <option value="fas fa-paper-plane">✉️ Enviado</option>
                                    <option value="fas fa-check-circle">✅ Check</option>
                                    <option value="fas fa-times-circle">❌ X</option>
                                    <option value="fas fa-bookmark">🔖 Marca</option>
                                    <option value="fas fa-star">⭐ Estrella</option>
                                    <option value="fas fa-flag">🚩 Bandera</option>
                                    <option value="fas fa-tag">🏷️ Etiqueta</option>
                                </select>
                                <button @click="guardarCarpeta" :disabled="!nuevaCarpeta.nombre.trim() || loadingCarpeta"
                                    class="px-3 py-2 rounded-lg text-[10px] font-semibold uppercase italic tracking-wide transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 flex items-center gap-1"
                                    :class="editandoCarpeta ? 'bg-emerald-500 text-white' : 'bg-[#3B82F6] text-white'">
                                    <i v-if="loadingCarpeta" class="fas fa-circle-notch fa-spin text-[9px]"></i>
                                    <i v-else :class="editandoCarpeta ? 'fas fa-check' : 'fas fa-plus'" class="text-[9px]"></i>
                                </button>
                                <button v-if="editandoCarpeta" @click="cancelarEdicionCarpeta"
                                    class="px-2 py-2 rounded-lg border text-[10px] font-semibold"
                                    :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-200 text-slate-500'">
                                    <i class="fas fa-xmark text-[9px]"></i>
                                </button>
                            </div>

                            <!-- Preview -->
                            <div v-if="nuevaCarpeta.nombre.trim()" class="mt-2 flex items-center gap-1.5">
                                <span class="text-[9px] opacity-50" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Vista previa:</span>
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-semibold uppercase tracking-wide border border-current/20 bg-current/10"
                                    :style="{ color: nuevaCarpeta.color }">
                                    <i :class="nuevaCarpeta.icono"></i>
                                    {{ nuevaCarpeta.nombre }}
                                </span>
                            </div>

                            <p v-if="errorCarpeta" class="mt-2 text-[10px] text-red-400 font-bold">
                                <i class="fas fa-exclamation-circle mr-1"></i>{{ errorCarpeta }}
                            </p>
                        </div>

                        <!-- Lista de mis carpetas -->
                        <div class="px-5 py-3 max-h-64 overflow-y-auto">
                            <p class="text-[9px] font-semibold uppercase tracking-wide mb-2"
                                :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                                Mis Carpetas ({{ estadosCh.length }})
                            </p>
                            <div v-if="!estadosCh.length" class="text-[11px] opacity-40 text-center py-4"
                                :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                                No hay carpetas aún.
                            </div>
                            <div v-else class="flex flex-col gap-1.5">
                                <div v-for="est in estadosCh" :key="est.id"
                                    class="flex items-center justify-between px-3 py-2 rounded-lg border transition-all"
                                    :class="[isDark ? 'bg-[#161B26] border-[#3d4558]' : 'bg-slate-50 border-slate-200',
                                        editandoCarpeta?.id === est.id ? 'ring-1 ring-[#3B82F6]' : '']">
                                    <div class="flex items-center gap-2">
                                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-semibold uppercase tracking-wide border border-current/20 bg-current/10"
                                            :style="{ color: est.color }">
                                            <i :class="est.icono"></i>
                                            {{ est.nombre }}
                                        </span>
                                        <span class="text-[9px] opacity-40" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                                            {{ novedades.filter(n => n.estadoChCoord === est.nombre).length }} nov.
                                        </span>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <button @click="iniciarEdicionCarpeta(est)"
                                            class="w-6 h-6 rounded-lg flex items-center justify-center border text-[9px] transition-all hover:bg-[#3B82F6]/10 hover:text-[#3B82F6]"
                                            :class="isDark ? 'border-[#3d4558] text-slate-500' : 'border-slate-200 text-slate-400'">
                                            <i class="fas fa-pen-to-square"></i>
                                        </button>
                                        <button @click="confirmarEliminarCarpeta(est)"
                                            class="w-6 h-6 rounded-lg flex items-center justify-center border text-[9px] transition-all hover:bg-red-500/10 hover:text-red-400"
                                            :class="isDark ? 'border-[#3d4558] text-slate-500' : 'border-slate-200 text-slate-400'">
                                            <i class="fas fa-trash-can"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </transition>
        </teleport>

        <!-- ══════════════════════════════════════════════════════════
             MODAL: Asignar carpeta a una novedad
        ══════════════════════════════════════════════════════════ -->
        <teleport to="body">
            <div v-if="carpetaModal.open"
                class="fixed inset-0 z-[65] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                @mousedown.self="carpetaModal.open = false">
                <div class="w-full max-w-xs rounded-md border overflow-hidden"
                    :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

                    <div class="flex items-center justify-between px-4 py-3 border-b"
                        :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-folder-open text-[#3B82F6]"></i>
                            <h3 class="text-[11px] font-semibold uppercase tracking-wide"
                                :class="isDark ? 'text-white' : 'text-slate-800'">Mi Carpeta</h3>
                        </div>
                        <button @click="carpetaModal.open = false"
                            class="w-6 h-6 rounded-lg flex items-center justify-center border"
                            :class="isDark ? 'bg-[#161B26] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-500 border-slate-200'">
                            <i class="fas fa-xmark text-[10px]"></i>
                        </button>
                    </div>
                    <div class="px-4 pt-3 pb-1">
                        <p class="text-[10px] font-semibold uppercase opacity-50"
                            :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                            {{ carpetaModal.nombreColaborador }}
                        </p>
                    </div>

                    <div class="px-4 pb-1">
                        <button @click="asignarCarpeta(null)"
                            class="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-bold transition-all hover:bg-[#3B82F6]/10"
                            :class="[isDark ? 'border-[#222938] text-slate-400' : 'border-slate-200 text-slate-500',
                                carpetaModal.estadoActual === null ? 'ring-1 ring-[#3B82F6]' : '']">
                            <i class="fas fa-folder-open opacity-40 w-4"></i>
                            <span>Sin carpeta</span>
                            <i v-if="carpetaModal.estadoActual === null" class="fas fa-check ml-auto text-[#3B82F6] text-[9px]"></i>
                        </button>
                    </div>

                    <div class="px-4 pb-4 flex flex-col gap-1 max-h-52 overflow-y-auto">
                        <div v-if="estadosCh.length === 0" class="text-center py-4 opacity-40">
                            <i class="fas fa-folder text-2xl mb-1" :class="isDark ? 'text-slate-600' : 'text-slate-300'"></i>
                            <p class="text-[10px] font-bold" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                                Sin carpetas — créalas con "Mis Carpetas"
                            </p>
                        </div>
                        <button v-for="est in estadosCh" :key="est.id"
                            @click="asignarCarpeta(est.nombre)"
                            class="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-bold transition-all hover:opacity-80"
                            :class="[isDark ? 'border-[#222938]' : 'border-slate-200',
                                carpetaModal.estadoActual === est.nombre ? 'ring-1 ring-[#3B82F6]' : '']"
                            :style="{ borderLeftColor: est.color, borderLeftWidth: '3px' }">
                            <i :class="est.icono" :style="{ color: est.color }" class="w-4 text-center shrink-0"></i>
                            <span :class="isDark ? 'text-white' : 'text-slate-700'">{{ est.nombre }}</span>
                            <i v-if="carpetaModal.estadoActual === est.nombre" class="fas fa-check ml-auto text-[#3B82F6] text-[9px]"></i>
                        </button>
                    </div>
                </div>
            </div>
        </teleport>

        <!-- Modal soporte -->
        <teleport to="body">
            <div v-if="soporteModal.open"
                class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                @mousedown.self="soporteModal.open = false">
                <div class="w-full max-w-2xl h-[70vh] rounded-md border flex flex-col overflow-hidden"
                    :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
                    <div class="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
                        :class="isDark ? 'border-[#222938]' : 'border-slate-100'">
                        <span class="text-[11px] font-semibold uppercase tracking-wide"
                            :class="isDark ? 'text-white' : 'text-slate-700'">
                            <i class="fas fa-eye text-[#3B82F6] mr-2"></i>Soporte
                        </span>
                        <div class="flex items-center gap-2">
                            <a v-if="soporteModal.isPdf || soporteModal.isImage"
                                :href="soporteModal.url" target="_blank" rel="noopener noreferrer"
                                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9px] font-semibold uppercase tracking-wide transition-all hover:brightness-110"
                                :class="isDark ? 'bg-[#161B26] text-[#3B82F6] border-[#3d4558]' : 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30'">
                                <i class="fas fa-arrow-up-right-from-square text-[9px]"></i> Abrir
                            </a>
                            <button @click="soporteModal.open = false"
                                class="w-7 h-7 rounded-lg flex items-center justify-center border"
                                :class="isDark ? 'bg-[#161B26] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-500 border-slate-200'">
                                <i class="fas fa-xmark text-xs"></i>
                            </button>
                        </div>
                    </div>
                    <div class="flex-1 overflow-hidden flex items-center justify-center p-2"
                        :class="isDark ? 'bg-[#151c2c]' : 'bg-slate-50'">
                        <img v-if="soporteModal.isImage" :src="soporteModal.url"
                            class="max-w-full max-h-full object-contain rounded-lg" />
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

        <!-- Modal motivo -->
        <teleport to="body">
            <div v-if="motivoModal.open"
                class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                @mousedown.self="motivoModal.open = false">
                <div class="w-full max-w-sm rounded-md border p-6 flex flex-col gap-4"
                    :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-comment-alt text-[#3B82F6]"></i>
                        <h3 class="text-sm font-semibold uppercase tracking-wide"
                            :class="isDark ? 'text-white' : 'text-slate-800'">{{ motivoModal.titulo }}</h3>
                    </div>
                    <p class="text-[15px] font-medium leading-relaxed"
                        :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ motivoModal.texto }}</p>
                    <button @click="motivoModal.open = false"
                        class="py-2 rounded-lg text-[10px] font-semibold uppercase italic border"
                        :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-200 text-slate-500'">Cerrar</button>
                </div>
            </div>
        </teleport>

        <!-- Modal aprobar/rechazar -->
        <teleport to="body">
            <div v-if="accionModal.open"
                class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                @mousedown.self="accionModal.open = false">
                <div class="w-full max-w-sm rounded-md border p-6 flex flex-col gap-4"
                    :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">
                    <div class="flex items-center gap-2">
                        <i :class="accionModal.tipo === 1 ? 'fas fa-check-circle text-emerald-500' : 'fas fa-times-circle text-red-400'"
                            class="text-lg"></i>
                        <h3 class="text-sm font-semibold uppercase tracking-wide"
                            :class="isDark ? 'text-white' : 'text-slate-800'">
                            {{ accionModal.tipo === 1 ? 'Aprobar' : 'Rechazar' }} novedad
                        </h3>
                    </div>
                    <p class="text-[10px] font-bold opacity-60" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                        {{ accionModal.nombre }}
                    </p>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[9px] font-semibold uppercase tracking-wide"
                            :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                            Motivo <span class="text-red-400">*</span>
                        </label>
                        <textarea v-model="accionModal.motivo" rows="3"
                            :placeholder="accionModal.tipo === 1 ? 'Motivo de aprobación...' : 'Motivo de rechazo...'"
                            class="px-3 py-2.5 rounded-lg border text-xs font-medium outline-none resize-none placeholder:text-slate-500"
                            :class="isDark ? 'bg-[#161B26] border-[#222938] text-white' : 'bg-white border-slate-200 text-slate-800'">
                        </textarea>
                    </div>

                    <div class="flex gap-2 pt-1">
                        <button @click="accionModal.open = false"
                            class="flex-1 py-2 rounded-lg text-[10px] font-semibold uppercase italic border"
                            :class="isDark ? 'border-[#222938] text-slate-400' : 'border-slate-200 text-slate-500'">
                            Cancelar
                        </button>
                        <button @click="confirmarAccion" :disabled="!accionModal.motivo.trim() || accionModal.loading"
                            class="flex-1 py-2 rounded-lg text-[10px] font-semibold uppercase italic transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                            :class="accionModal.tipo === 1 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'">
                            <i v-if="accionModal.loading" class="fas fa-circle-notch fa-spin text-[9px]"></i>
                            {{ accionModal.loading ? 'Procesando...' : 'Confirmar' }}
                        </button>
                    </div>
                </div>
            </div>
        </teleport>

        <!-- Toast aprobación -->
        <teleport to="body">
            <transition name="fade-msg">
                <div v-if="toast.visible"
                    class="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 px-5 py-4 rounded-md border max-w-xs w-full"
                    :class="toast.tipo === 'aprobada' ? 'bg-[#1e3a5f] border-emerald-500/40 text-white' : 'bg-[#1e3a5f] border-red-500/40 text-white'">
                    <div class="flex items-start gap-3">
                        <i :class="toast.tipo === 'aprobada' ? 'fas fa-circle-check text-emerald-400' : 'fas fa-circle-xmark text-red-400'" class="text-lg mt-0.5 shrink-0"></i>
                        <div class="flex-1 min-w-0">
                            <p class="text-[11px] font-semibold uppercase tracking-wide">Novedad {{ toast.tipo }}</p>
                            <p class="text-[10px] font-semibold opacity-70 mt-0.5 truncate">{{ toast.nombre }}</p>
                        </div>
                        <button @click="toast.visible = false" class="opacity-40 hover:opacity-100 transition-opacity shrink-0">
                            <i class="fas fa-xmark text-xs"></i>
                        </button>
                    </div>
                    <div class="flex items-center gap-2 px-3 py-2 rounded-md text-[10px] font-semibold"
                        :class="toast.correoOk ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'">
                        <i :class="toast.correoOk ? 'fas fa-envelope-circle-check' : 'fas fa-envelope-open-text'" class="text-sm"></i>
                        <span class="flex-1">{{ toast.correoMsg }}</span>
                    </div>
                    <button v-if="!toast.correoOk" @click="reenviarToast" :disabled="toast.reenvioLoading"
                        class="flex items-center justify-center gap-2 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-semibold uppercase tracking-wide transition-all disabled:opacity-50">
                        <i :class="toast.reenvioLoading ? 'fas fa-circle-notch fa-spin' : 'fas fa-paper-plane'" class="text-[9px]"></i>
                        {{ toast.reenvioLoading ? 'Reenviando...' : 'Reenviar correo' }}
                    </button>
                </div>
            </transition>
        </teleport>

        <!-- ══════════════════════════════════════════════════════════
             MODAL DETALLE — estilo Vercel
        ══════════════════════════════════════════════════════════ -->
        <teleport to="body">
            <transition name="fade-panel">
                <div v-if="detallePanel.open"
                    class="fixed inset-0 z-[85] flex items-center justify-center p-2"
                    style="background:rgba(0,0,0,0.55);backdrop-filter:blur(4px)"
                    @click.self="detallePanel.open = false">

                    <div class="w-full max-w-[95vw] h-[92vh] rounded-[10px] border flex flex-col overflow-hidden"
                        style="animation: vcModalIn 0.2s ease-out forwards;"
                        :class="isDark
                            ? 'bg-[#161B26] border-[#222938] shadow-[0_32px_64px_rgba(0,0,0,0.5)]'
                            : 'bg-white border-[#e5e5e5] shadow-[0_24px_48px_rgba(0,0,0,0.1)]'">

                        <!-- ── Header ── -->
                        <div class="flex items-start justify-between px-6 pt-6 pb-5 border-b"
                            :class="isDark ? 'border-[#222938]' : 'border-[#e5e5e5]'">
                            <div class="flex-1 min-w-0 pr-4">
                                <p class="text-[15px] font-semibold tracking-[-0.01em] truncate"
                                    :class="isDark ? 'text-white' : 'text-[#111]'">
                                    {{ detallePanel.novedad?.nombre }}
                                </p>
                                <p class="text-[13px] mt-0.5 truncate"
                                    :class="isDark ? 'text-[#64748b]' : 'text-[#737373]'">
                                    CC {{ detallePanel.novedad?.cedula }}
                                    <span v-if="detallePanel.novedad?.departamento"> · {{ detallePanel.novedad.departamento }}</span>
                                </p>
                            </div>
                            <button @click="detallePanel.open = false"
                                class="rounded-[6px] w-8 h-8 flex items-center justify-center border transition-colors shrink-0"
                                :class="isDark
                                    ? 'border-[#222938] text-[#64748b] hover:text-white hover:bg-[#222938]'
                                    : 'border-[#e5e5e5] text-[#737373] hover:text-[#111] hover:bg-[#f5f5f5]'">
                                <i class="fas fa-xmark text-xs"></i>
                            </button>
                        </div>

                        <!-- ── Body ── -->
                        <div class="px-6 py-5 flex-1 flex flex-col gap-5 overflow-y-auto vc-scroll min-h-0">

                            <!-- Fila: tipificación + estado + fechas -->
                            <div class="grid grid-cols-2 gap-x-8 gap-y-4">
                                <div>
                                    <p class="text-[10px] font-semibold tracking-[0.08em] uppercase mb-1.5"
                                        :class="isDark ? 'text-[#475569]' : 'text-[#737373]'">Tipificación</p>
                                    <p class="text-[13px] font-medium"
                                        :class="isDark ? 'text-[#e2e8f0]' : 'text-[#171717]'">
                                        {{ detallePanel.novedad?.tipificacion || '—' }}
                                    </p>
                                </div>
                                <div>
                                    <p class="text-[10px] font-semibold tracking-[0.08em] uppercase mb-1.5"
                                        :class="isDark ? 'text-[#475569]' : 'text-[#737373]'">Estado</p>
                                    <EstadoBadge :valor="detallePanel.novedad?.aprobadoJefe" />
                                </div>
                                <div>
                                    <p class="text-[10px] font-semibold tracking-[0.08em] uppercase mb-1.5"
                                        :class="isDark ? 'text-[#475569]' : 'text-[#737373]'">Fecha inicio</p>
                                    <p class="text-[13px] font-medium"
                                        :class="isDark ? 'text-[#e2e8f0]' : 'text-[#171717]'">
                                        {{ formatFecha(detallePanel.novedad?.fechaInicio) }}
                                    </p>
                                </div>
                                <div>
                                    <p class="text-[10px] font-semibold tracking-[0.08em] uppercase mb-1.5"
                                        :class="isDark ? 'text-[#475569]' : 'text-[#737373]'">Fecha fin</p>
                                    <p class="text-[13px] font-medium"
                                        :class="isDark ? 'text-[#e2e8f0]' : 'text-[#171717]'">
                                        {{ formatFecha(detallePanel.novedad?.fechaFin) }}
                                    </p>
                                </div>
                                <div v-if="detallePanel.novedad?.tipificacion === 'Renuncia' && detallePanel.novedad?.ultimoDiaTrabajado"
                                    class="col-span-2">
                                    <p class="text-[10px] font-semibold tracking-[0.08em] uppercase mb-1.5"
                                        :class="isDark ? 'text-[#475569]' : 'text-[#737373]'">Último día trabajado</p>
                                    <p class="text-[13px] font-medium"
                                        :class="isDark ? 'text-[#e2e8f0]' : 'text-[#171717]'">
                                        {{ formatFecha(detallePanel.novedad.ultimoDiaTrabajado) }}
                                    </p>
                                </div>
                            </div>

                            <!-- Descripción -->
                            <div class="border-t pt-5" :class="isDark ? 'border-[#222938]' : 'border-[#e5e5e5]'">
                                <p class="text-[10px] font-semibold tracking-[0.08em] uppercase mb-2"
                                    :class="isDark ? 'text-[#475569]' : 'text-[#737373]'">Descripción</p>
                                <p class="text-[13px] leading-[1.65]"
                                    :class="isDark ? 'text-[#94a3b8]' : 'text-[#444]'">
                                    {{ detallePanel.novedad?.descripcion }}
                                </p>
                            </div>

                            <!-- Motivo jefe (si existe) -->
                            <div v-if="detallePanel.novedad?.motivoJefe"
                                class="border-t pt-5" :class="isDark ? 'border-[#222938]' : 'border-[#e5e5e5]'">
                                <p class="text-[10px] font-semibold tracking-[0.08em] uppercase mb-2"
                                    :class="isDark ? 'text-[#475569]' : 'text-[#737373]'">Motivo jefe</p>
                                <p class="text-[13px] leading-[1.65]"
                                    :class="isDark ? 'text-[#94a3b8]' : 'text-[#444]'">
                                    {{ detallePanel.novedad.motivoJefe }}
                                </p>
                            </div>

                            <!-- ── Datos Liquidación (solo Renuncia) ── -->
                            <template v-if="detallePanel.novedad?.tipificacion === 'Renuncia'">
                                <div class="border-t pt-5" :class="isDark ? 'border-[#222938]' : 'border-[#e5e5e5]'">
                                    <p class="text-[10px] font-semibold tracking-[0.08em] uppercase mb-4"
                                        :class="isDark ? 'text-[#475569]' : 'text-[#737373]'">Datos de liquidación</p>
                                    <div class="grid grid-cols-2 gap-3">
                                        <div class="flex flex-col gap-1.5">
                                            <label class="text-[11px] font-medium"
                                                :class="isDark ? 'text-[#64748b]' : 'text-[#737373]'">Descuento</label>
                                            <textarea v-model="renunciaForm.renunciaDescuento" rows="4"
                                                placeholder="Ingrese valor..."
                                                class="vc-field w-full px-3 py-2 rounded-[6px] border text-[13px] outline-none transition-all resize-none leading-relaxed"
                                                :class="isDark
                                                    ? 'bg-[#1a2035] border-[#222938] text-[#e2e8f0] placeholder:text-[#334155] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20'
                                                    : 'bg-white border-[#e5e5e5] text-[#111] placeholder:text-[#c0c0c0] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/15'" />
                                        </div>
                                        <div class="flex flex-col gap-1.5">
                                            <label class="text-[11px] font-medium"
                                                :class="isDark ? 'text-[#64748b]' : 'text-[#737373]'">Comisiones</label>
                                            <textarea v-model="renunciaForm.renunciaComisiones" rows="4"
                                                placeholder="Ingrese valor..."
                                                class="vc-field w-full px-3 py-2 rounded-[6px] border text-[13px] outline-none transition-all resize-none leading-relaxed"
                                                :class="isDark
                                                    ? 'bg-[#1a2035] border-[#222938] text-[#e2e8f0] placeholder:text-[#334155] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20'
                                                    : 'bg-white border-[#e5e5e5] text-[#111] placeholder:text-[#c0c0c0] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/15'" />
                                        </div>
                                        <div class="flex flex-col gap-1.5">
                                            <label class="text-[11px] font-medium"
                                                :class="isDark ? 'text-[#64748b]' : 'text-[#737373]'">Horas extra</label>
                                            <textarea v-model="renunciaForm.renunciaHorasExtra" rows="4"
                                                placeholder="Ingrese valor..."
                                                class="vc-field w-full px-3 py-2 rounded-[6px] border text-[13px] outline-none transition-all resize-none leading-relaxed"
                                                :class="isDark
                                                    ? 'bg-[#1a2035] border-[#222938] text-[#e2e8f0] placeholder:text-[#334155] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20'
                                                    : 'bg-white border-[#e5e5e5] text-[#111] placeholder:text-[#c0c0c0] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/15'" />
                                        </div>
                                        <div class="flex flex-col gap-1.5">
                                            <label class="text-[11px] font-medium"
                                                :class="isDark ? 'text-[#64748b]' : 'text-[#737373]'">Transporte</label>
                                            <textarea v-model="renunciaForm.renunciaTransporte" rows="4"
                                                placeholder="Ingrese valor..."
                                                class="vc-field w-full px-3 py-2 rounded-[6px] border text-[13px] outline-none transition-all resize-none leading-relaxed"
                                                :class="isDark
                                                    ? 'bg-[#1a2035] border-[#222938] text-[#e2e8f0] placeholder:text-[#334155] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20'
                                                    : 'bg-white border-[#e5e5e5] text-[#111] placeholder:text-[#c0c0c0] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/15'" />
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-3 mt-4">
                                        <button @click="guardarRenuncia" :disabled="renunciaGuardando"
                                            class="h-8 px-4 rounded-[6px] text-[13px] font-medium transition-all disabled:opacity-40 flex items-center gap-2"
                                            :class="isDark
                                                ? 'bg-white text-black hover:bg-[#e8e8e8]'
                                                : 'bg-[#171717] text-white hover:bg-[#333]'">
                                            <i v-if="renunciaGuardando" class="fas fa-circle-notch fa-spin text-[10px]"></i>
                                            {{ renunciaGuardando ? 'Guardando...' : 'Guardar' }}
                                        </button>
                                        <transition name="fade-msg">
                                            <p v-if="renunciaMensaje" class="text-[12px]"
                                                :class="renunciaMensaje === 'ok'
                                                    ? (isDark ? 'text-[#64748b]' : 'text-[#555]')
                                                    : 'text-red-500'">
                                                {{ renunciaMensaje === 'ok' ? 'Guardado' : 'Error al guardar' }}
                                            </p>
                                        </transition>
                                    </div>
                                </div>
                            </template>

                        </div>

                        <!-- ── Footer: reenviar notificación (ya procesadas) ── -->
                        <div v-if="detallePanel.novedad?.aprobadoJefe !== null && detallePanel.novedad?.aprobadoJefe !== undefined"
                            class="px-6 py-4 border-t flex items-center gap-3 shrink-0"
                            :class="isDark ? 'border-[#222938]' : 'border-[#e5e5e5]'">
                            <button @click="reenviarDesdeDetalle" :disabled="reenvioDetalle.loading"
                                class="h-8 px-4 rounded-[6px] text-[11px] font-semibold uppercase tracking-wide border transition-all disabled:opacity-50 flex items-center gap-2"
                                :class="isDark
                                    ? 'border-[#222938] text-[#94a3b8] hover:text-white hover:bg-[#222938]'
                                    : 'border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5]'">
                                <i :class="reenvioDetalle.loading ? 'fas fa-circle-notch fa-spin' : 'fas fa-paper-plane'" class="text-[9px]"></i>
                                {{ reenvioDetalle.loading ? 'Reenviando...' : 'Reenviar notificación' }}
                            </button>
                            <transition name="fade-msg">
                                <span v-if="reenvioDetalle.ok !== null" class="text-[11px] font-medium"
                                    :class="reenvioDetalle.ok ? 'text-emerald-400' : 'text-red-400'">
                                    {{ reenvioDetalle.ok ? 'Correo enviado' : reenvioDetalle.msg }}
                                </span>
                            </transition>
                        </div>

                        <!-- ── Footer: aprobar / rechazar (solo pendiente) ── -->
                        <div v-if="detallePanel.novedad?.aprobadoJefe === null || detallePanel.novedad?.aprobadoJefe === undefined"
                            class="px-6 py-4 border-t flex items-center gap-3 shrink-0"
                            :class="isDark ? 'border-[#222938]' : 'border-[#e5e5e5]'">

                            <!-- Toggle notificar -->
                            <button type="button" @click="notificarDetalle = !notificarDetalle"
                                class="flex items-center gap-2 px-3 h-8 rounded-[6px] border transition-all flex-shrink-0"
                                :class="notificarDetalle
                                    ? (isDark ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-emerald-500/40 bg-emerald-50 text-emerald-600')
                                    : (isDark ? 'border-[#222938] text-[#475569]' : 'border-[#e5e5e5] text-[#a1a1aa]')">
                                <i class="fas fa-envelope text-[10px]"></i>
                                <span class="text-[11px] font-medium">Notificar</span>
                                <!-- mini toggle pill -->
                                <span class="relative w-6 h-3 rounded-full transition-colors duration-200 ml-0.5"
                                    :class="notificarDetalle ? 'bg-emerald-500' : (isDark ? 'bg-[#333]' : 'bg-slate-300')">
                                    <span class="absolute top-[2px] w-2 h-2 rounded-full bg-white shadow transition-all duration-200"
                                        :class="notificarDetalle ? 'left-[13px]' : 'left-[2px]'"></span>
                                </span>
                            </button>

                            <div class="flex items-center gap-2 ml-auto">
                                <button @click="abrirAccion(detallePanel.novedad, 0, notificarDetalle); detallePanel.open = false"
                                    class="h-8 px-4 rounded-[6px] text-[13px] font-medium border transition-colors"
                                    :class="isDark
                                        ? 'border-[#222938] text-[#e2e8f0] hover:bg-[#222938]'
                                        : 'border-[#e5e5e5] text-[#171717] hover:bg-[#f5f5f5]'">
                                    Rechazar
                                </button>
                                <button @click="abrirAccion(detallePanel.novedad, 1, notificarDetalle); detallePanel.open = false"
                                    class="h-8 px-4 rounded-[6px] text-[13px] font-medium transition-colors"
                                    :class="isDark
                                        ? 'bg-white text-black hover:bg-[#e8e8e8]'
                                        : 'bg-[#171717] text-white hover:bg-[#333]'">
                                    Aprobar
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </transition>
        </teleport>

        <!-- Menú contextual (tab pendientes) -->
        <teleport to="body">
            <div v-if="menuAbierto !== null" class="fixed inset-0 z-40" @click="menuAbierto = null"></div>
            <transition name="fade-msg">
                <div v-if="menuAbierto !== null" class="fixed z-50 w-48 rounded-md border overflow-hidden"
                    :style="{ top: menuPos.y + 'px', left: menuPos.x + 'px' }"
                    :class="isDark ? 'bg-[#161B26] border-[#222938]' : 'bg-white border-slate-200'">

                    <button @click="verSoporte(itemMenuActual); menuAbierto = null"
                        class="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-semibold uppercase italic tracking-wide transition-all hover:bg-[#3B82F6]/10"
                        :class="isDark ? 'text-slate-300' : 'text-slate-700'">
                        <i class="fas fa-eye text-[#3B82F6] w-3"></i> Ver soporte
                    </button>

                    <button @click="abrirCarpeta(itemMenuActual); menuAbierto = null"
                        class="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-semibold uppercase italic tracking-wide transition-all hover:bg-[#3B82F6]/10"
                        :class="isDark ? 'text-slate-300' : 'text-slate-700'">
                        <i class="fas fa-folder-open text-[#3B82F6] w-3"></i> Enviar a carpeta
                    </button>

                    <div class="border-t mx-2" :class="isDark ? 'border-[#222938]' : 'border-slate-100'"></div>

                    <button @click="abrirDetalle(itemMenuActual); menuAbierto = null"
                        class="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-semibold uppercase italic tracking-wide transition-all hover:bg-[#3B82F6]/10"
                        :class="isDark ? 'text-slate-300' : 'text-slate-700'">
                        <i class="fas fa-arrow-right text-[#3B82F6] w-3"></i> Ver detalle
                    </button>

                </div>
            </transition>
        </teleport>

    </div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent, h } from 'vue';
import { useNovedades, getEstadoVisual } from '../../composables/adminLogica/useNovedades';
import axios from 'axios';

const props = defineProps({ isDark: Boolean });
const emit = defineEmits(['volver']);

const {
    novedades, loading,
    aprobarJefe, reenviarCorreo, getFileUrl,
    fetchPorArea, fetchPorSegmento, fetchPorMiSegmento, fetchPorDepartamentos,
    // Carpetas (tipo = 'coordinador')
    estadosCh, fetchEstadosCh, crearEstadoCh, editarEstadoCh, eliminarEstadoCh, cambiarEstadoCh,
} = useNovedades();

// Este módulo siempre opera con tipo='coordinador'
const TIPO_CARPETA = 'coordinador';

const API_URL = import.meta.env.VITE_API_URL;
const session = JSON.parse(localStorage.getItem('user_session') || '{}');
const miIdOdoo = session?.id_odoo;

const activeTab = ref('pendientes');
const histBuscar = ref('');
const histEstado = ref('');

// ─── Nivel de acceso ──────────────────────────────────────────────
const esDirector = session?.isSuperAdmin || session?.permisos?.['novedades.director'] === true;
const esSegmento = !esDirector && session?.permisos?.['novedades.ver_segmento'] === true;
const esMiSegmento = !esDirector && !esSegmento && session?.permisos?.['coord.ver_segmento'] === true;
const modoLabel = esDirector ? 'Director — Todo el departamento'
  : esSegmento ? 'Jefe — Todo el segmento'
  : esMiSegmento ? 'Coordinador — Todo mi segmento'
  : 'Jefe — Solo mi área';
const modoIcon = esDirector ? 'fas fa-building'
  : (esSegmento || esMiSegmento) ? 'fas fa-sitemap'
  : 'fas fa-users';

// ─── Componentes internos ─────────────────────────────────────────

const EstadoBadge = defineComponent({
    props: { valor: { default: null }, mini: Boolean },
    setup(p) {
        return () => {
            const v = p.valor;
            if (v === 1) return h('span', { class: 'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-semibold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' }, [h('i', { class: 'fas fa-check' }), !p.mini && ' Aprobado'].filter(Boolean));
            if (v === 0) return h('span', { class: 'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-semibold uppercase bg-red-500/10 text-red-400 border border-red-500/20' }, [h('i', { class: 'fas fa-xmark' }), !p.mini && ' Rechazado'].filter(Boolean));
            return h('span', { class: 'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-semibold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20' }, [h('i', { class: 'fas fa-clock' }), !p.mini && ' Pendiente'].filter(Boolean));
        };
    }
});

const FolderEstado = defineComponent({
    props: { nov: Object },
    setup(p) {
        return () => {
            const cfg = getEstadoVisual(p.nov);
            return h('span', { class: `inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-semibold uppercase tracking-wide border ${cfg.bg}` }, [
                h('i', { class: cfg.icon, style: { color: cfg.color } }),
                h('span', { style: { color: cfg.color } }, cfg.label)
            ]);
        };
    }
});

/** Badge para carpeta del coordinador (estadoChCoord) */
const CarpetaBadge = defineComponent({
    props: { nombre: { default: null }, estados: { default: () => [] } },
    emits: ['click'],
    setup(p, { emit: emitBadge }) {
        return () => {
            const est = p.estados.find(e => e.nombre === p.nombre);
            if (est) {
                return h('button', {
                    onClick: () => emitBadge('click'),
                    class: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-semibold uppercase tracking-wide border cursor-pointer hover:opacity-80 transition-opacity',
                    style: { borderColor: est.color + '33', background: est.color + '15' }
                }, [
                    h('i', { class: est.icono, style: { color: est.color } }),
                    h('span', { style: { color: est.color } }, est.nombre)
                ]);
            }
            return h('button', {
                onClick: () => emitBadge('click'),
                class: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-semibold uppercase tracking-wide border border-dashed transition-all hover:border-[#3B82F6]/50 hover:text-[#3B82F6] text-slate-400 border-slate-300/30'
            }, [h('i', { class: 'fas fa-folder-plus text-[9px]' }), h('span', 'Asignar')]);
        };
    }
});

// ─── Montaje ──────────────────────────────────────────────────────
onMounted(async () => {
    // Cargar las carpetas del tipo 'coordinador'
    await fetchEstadosCh(TIPO_CARPETA);

    if (esDirector) {
        try {
            const res = await axios.get(`${API_URL}/departamentos-permitidos/${miIdOdoo}`);
            const deptos = Array.isArray(res.data) ? res.data : [];
            if (deptos.length > 0) {
                // Departamentos explícitamente configurados por el admin
                await fetchPorDepartamentos(deptos);
            } else {
                // Sin departamentos configurados → usar el departamento propio del director
                // (evita que el director vea vacío solo porque nadie configuró su filtro)
                const miDpto = session?.department;
                if (miDpto) {
                    await fetchPorDepartamentos([miDpto]);
                } else {
                    await fetchPorSegmento(miIdOdoo);
                }
            }
        } catch {
            await fetchPorSegmento(miIdOdoo);
        }
    } else if (esSegmento) {
        await fetchPorSegmento(miIdOdoo);
    } else if (esMiSegmento) {
        await fetchPorMiSegmento(miIdOdoo);
    } else {
        await fetchPorArea(miIdOdoo);
    }
});

// ─── Computadas ───────────────────────────────────────────────────
const pendientes = computed(() =>
    novedades.value.filter(n => n.aprobadoJefe === null || n.aprobadoJefe === undefined)
);

// Acordeón de carpetas
const carpetasAbiertas = ref(new Set());
const toggleCarpeta = (id) => {
    const s = new Set(carpetasAbiertas.value);
    s.has(id) ? s.delete(id) : s.add(id);
    carpetasAbiertas.value = s;
};

// Novedades agrupadas por carpeta del coordinador
const novedadesPorCarpeta = computed(() =>
    estadosCh.value.map(carpeta => ({
        ...carpeta,
        items: novedades.value.filter(n => n.estadoChCoord === carpeta.nombre),
    }))
);

const novedadesEnCarpeta = computed(() =>
    novedades.value.filter(n => n.estadoChCoord).length
);

const historialFiltrado = computed(() => {
    let lista = novedades.value;
    if (histBuscar.value) {
        const q = histBuscar.value.toLowerCase();
        lista = lista.filter(n => (n.nombre ?? '').toLowerCase().includes(q) || (n.descripcion ?? '').toLowerCase().includes(q));
    }
    if (histEstado.value) {
        lista = lista.filter(n => {
            const label = getEstadoVisual(n).label.toLowerCase();
            if (histEstado.value === 'nueva') return label === 'nueva';
            if (histEstado.value === 'pendiente') return label.includes('revisión') || label.includes('pend.');
            if (histEstado.value === 'aprobada') return label === 'aprobada';
            if (histEstado.value === 'rechazada') return label === 'no aprobada';
            return true;
        });
    }
    return lista;
});

// ─── Helpers ──────────────────────────────────────────────────────
const formatFecha = (f) => {
    if (!f) return '—';
    return new Date(f + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Modal soporte ────────────────────────────────────────────────
const soporteModal = ref({ open: false, url: '', isImage: false, isPdf: false });
const verSoporte = (novedad) => {
    if (!novedad) return;
    const url = getFileUrl(novedad.id);
    const mime = novedad.soporteMime ?? '';
    soporteModal.value = { open: true, url, isImage: mime.startsWith('image/'), isPdf: mime === 'application/pdf' };
};

// ─── Modal motivo ─────────────────────────────────────────────────
const motivoModal = ref({ open: false, titulo: '', texto: '' });
const verMotivo = (texto, titulo = 'Motivo') => { motivoModal.value = { open: true, titulo, texto }; };

// ─── Menú contextual ──────────────────────────────────────────────
const menuAbierto = ref(null);
const itemMenuActual = ref(null);
const menuPos = ref({ x: 0, y: 0 });
const toggleMenu = (event, id) => {
    if (menuAbierto.value === id) { menuAbierto.value = null; return; }
    const btn = event.currentTarget.getBoundingClientRect();
    menuPos.value = { x: btn.right - 192, y: btn.bottom + 6 };
    itemMenuActual.value = pendientes.value.find(n => n.id === id);
    menuAbierto.value = id;
};

// ─── Gestión Mis Carpetas (tipo='coordinador') ────────────────────
const modalCarpetas = ref({ open: false });
const nuevaCarpeta = ref({ nombre: '', icono: 'fas fa-folder', color: '#3B82F6' });
const editandoCarpeta = ref(null);
const loadingCarpeta = ref(false);
const errorCarpeta = ref('');

const guardarCarpeta = async () => {
    if (!nuevaCarpeta.value.nombre.trim()) return;
    loadingCarpeta.value = true;
    errorCarpeta.value = '';
    try {
        if (editandoCarpeta.value) {
            await editarEstadoCh(
                editandoCarpeta.value.id,
                { nombre: nuevaCarpeta.value.nombre.trim(), icono: nuevaCarpeta.value.icono, color: nuevaCarpeta.value.color },
                TIPO_CARPETA,
            );
            editandoCarpeta.value = null;
        } else {
            await crearEstadoCh({
                nombre: nuevaCarpeta.value.nombre.trim(),
                icono: nuevaCarpeta.value.icono,
                color: nuevaCarpeta.value.color,
                tipo: TIPO_CARPETA,
            });
        }
        nuevaCarpeta.value = { nombre: '', icono: 'fas fa-folder', color: '#3B82F6' };
    } catch (e) {
        errorCarpeta.value = e?.response?.data?.message || 'Error al guardar la carpeta.';
    } finally {
        loadingCarpeta.value = false;
    }
};

const iniciarEdicionCarpeta = (est) => {
    editandoCarpeta.value = { id: est.id };
    nuevaCarpeta.value = { nombre: est.nombre, icono: est.icono, color: est.color };
    errorCarpeta.value = '';
};

const cancelarEdicionCarpeta = () => {
    editandoCarpeta.value = null;
    nuevaCarpeta.value = { nombre: '', icono: 'fas fa-folder', color: '#3B82F6' };
    errorCarpeta.value = '';
};

const confirmarEliminarCarpeta = async (est) => {
    if (!confirm(`¿Eliminar la carpeta "${est.nombre}"? Las novedades con esa carpeta quedarán sin asignar.`)) return;
    try {
        await eliminarEstadoCh(est.id, TIPO_CARPETA);
    } catch {
        alert('Error al eliminar la carpeta.');
    }
};

// ─── Modal asignar carpeta ────────────────────────────────────────
const carpetaModal = ref({ open: false, novedadId: null, nombreColaborador: '', estadoActual: null });
const carpetaGuardando = ref(false);

const abrirCarpeta = (item) => {
    if (!item) return;
    carpetaModal.value = {
        open: true,
        novedadId: item.id,
        nombreColaborador: item.nombre ?? '',
        estadoActual: item.estadoChCoord ?? null,
    };
};

const asignarCarpeta = async (nombreEstado) => {
    if (carpetaGuardando.value) return;
    carpetaGuardando.value = true;
    try {
        await cambiarEstadoCh(carpetaModal.value.novedadId, nombreEstado, TIPO_CARPETA);
        carpetaModal.value.estadoActual = nombreEstado;
        carpetaModal.value.open = false;
    } catch (e) {
        console.error('Error al asignar carpeta:', e);
    } finally {
        carpetaGuardando.value = false;
    }
};

// ─── Panel detalle ────────────────────────────────────────────────
const detallePanel = ref({ open: false, novedad: null });
const renunciaForm = ref({ renunciaDescuento: '', renunciaComisiones: '', renunciaHorasExtra: '', renunciaTransporte: '' });
const renunciaGuardando = ref(false);
const renunciaMensaje = ref('');

const abrirDetalle = (item) => {
    detallePanel.value = { open: true, novedad: item };
    notificarDetalle.value = true; // resetear toggle al abrir cada registro
    renunciaForm.value = {
        renunciaDescuento: item.renunciaDescuento ?? '',
        renunciaComisiones: item.renunciaComisiones ?? '',
        renunciaHorasExtra: item.renunciaHorasExtra ?? '',
        renunciaTransporte: item.renunciaTransporte ?? '',
    };
    renunciaMensaje.value = '';
    reenvioDetalle.value = { loading: false, ok: null, msg: '' };
};

const guardarRenuncia = async () => {
    if (!detallePanel.value.novedad) return;
    renunciaGuardando.value = true;
    renunciaMensaje.value = '';
    try {
        await axios.patch(`${API_URL}/novedades/${detallePanel.value.novedad.id}/renuncia`, renunciaForm.value);
        // Actualizar lista local
        const idx = novedades.value.findIndex(n => n.id === detallePanel.value.novedad.id);
        if (idx !== -1) {
            novedades.value[idx] = { ...novedades.value[idx], ...renunciaForm.value };
            detallePanel.value.novedad = { ...detallePanel.value.novedad, ...renunciaForm.value };
        }
        renunciaMensaje.value = 'ok';
        setTimeout(() => { renunciaMensaje.value = ''; }, 3000);
    } catch (e) {
        renunciaMensaje.value = 'error';
    } finally {
        renunciaGuardando.value = false;
    }
};

// ─── Notificar detalle ────────────────────────────────────────────
// Toggle visible en el footer del panel de detalle; se resetea al abrir cada registro.
const notificarDetalle = ref(true);

// ─── Modal aprobar/rechazar ───────────────────────────────────────
const accionModal = ref({ open: false, tipo: 1, id: null, nombre: '', motivo: '', notificar: true, loading: false });
const toast = ref({ visible: false, tipo: '', nombre: '', correoOk: false, correoMsg: '', reenviarId: null, reenvioLoading: false });

// notificar: viene del toggle del detalle (footer) o del menú contextual (modal)
const abrirAccion = (item, tipo, notificar = true) => {
    accionModal.value = { open: true, tipo, id: item.id, nombre: item.nombre, motivo: '', notificar, loading: false };
};

const confirmarAccion = async () => {
    if (!accionModal.value.motivo.trim()) return;
    accionModal.value.loading = true;
    try {
        const result = await aprobarJefe(accionModal.value.id, accionModal.value.tipo, accionModal.value.motivo, accionModal.value.notificar);
        const tipoLabel = accionModal.value.tipo === 1 ? 'aprobada' : 'rechazada';
        toast.value = {
            visible: true,
            tipo: tipoLabel,
            nombre: accionModal.value.nombre,
            correoOk: result?.correo?.ok ?? false,
            correoMsg: result?.correo?.mensaje ?? 'Sin información',
            reenviarId: accionModal.value.id,
            reenvioLoading: false,
        };
        accionModal.value.open = false;
        setTimeout(() => { toast.value.visible = false; }, 7000);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        accionModal.value.loading = false;
    }
};

const reenviarToast = async () => {
    toast.value.reenvioLoading = true;
    const result = await reenviarCorreo(toast.value.reenviarId, 'jefe');
    toast.value.correoOk = result?.ok ?? false;
    toast.value.correoMsg = result?.mensaje ?? 'Sin respuesta';
    toast.value.reenvioLoading = false;
    setTimeout(() => { toast.value.visible = false; }, 5000);
};

const reenvioDetalle = ref({ loading: false, ok: null, msg: '' });

const reenviarDesdeDetalle = async () => {
    if (!detallePanel.value.novedad?.id) return;
    reenvioDetalle.value = { loading: true, ok: null, msg: '' };
    const result = await reenviarCorreo(detallePanel.value.novedad.id, 'jefe');
    reenvioDetalle.value = {
        loading: false,
        ok: result?.ok ?? false,
        msg: result?.mensaje ?? 'Sin respuesta',
    };
    setTimeout(() => { reenvioDetalle.value.ok = null; }, 5000);
};

</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.fade-msg-enter-active, .fade-msg-leave-active { transition: all 0.2s ease; }
.fade-msg-enter-from, .fade-msg-leave-to { opacity: 0; transform: translateY(-4px); }
/* Modal detalle Vercel */
@keyframes vcModalIn { from { opacity: 0; transform: translateY(6px) scale(0.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
.fade-panel-enter-active, .fade-panel-leave-active { transition: opacity 0.2s ease; }
.fade-panel-enter-from, .fade-panel-leave-to { opacity: 0; }
/* Scrollbar sutil */
.vc-scroll::-webkit-scrollbar { width: 3px; }
.vc-scroll::-webkit-scrollbar-track { background: transparent; }
.vc-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.2); border-radius: 99px; }
.vc-scroll::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.4); }
</style>
