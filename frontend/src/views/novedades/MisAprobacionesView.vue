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
                <!-- Botón gestionar mis carpetas -->
                <button @click="modalCarpetas.open = true"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase italic tracking-widest transition-all hover:brightness-110"
                    :class="isDark ? 'bg-[#273045] border-[#2d3548] text-[#FF8F00]' : 'bg-[#FF8F00]/10 border-[#FF8F00]/30 text-[#FF8F00]'">
                    <i class="fas fa-folder-plus text-[9px]"></i> Mis Carpetas
                </button>

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

                <div v-else class="flex-1 overflow-y-auto overflow-x-auto">
                    <table class="w-full border-separate border-spacing-0">
                        <thead class="sticky top-0 z-10">
                            <tr class="bg-[#334155]">
                                <th class="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Colaborador</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Inicio</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Fin</th>
                                <th class="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Descripción</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Capital Humano</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Mot. Capital</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Mot. Jefe</th>
                                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Mi Carpeta</th>
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
                                <!-- Mi Carpeta (coordinador) -->
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <CarpetaBadge :nombre="item.estadoChCoord" :estados="estadosCh" @click="abrirCarpeta(item)" />
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
                    <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border focus-within:ring-1 focus-within:ring-[#FF8F00]/30 flex-1 min-w-[160px]"
                        :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-200 bg-white'">
                        <i class="fas fa-search text-[#FF8F00] text-[9px]"></i>
                        <input v-model="histBuscar" type="text" placeholder="Buscar colaborador..."
                            class="bg-transparent text-[10px] font-bold outline-none w-full placeholder:font-normal placeholder:text-slate-500"
                            :class="isDark ? 'text-white' : 'text-slate-700'" />
                    </div>
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
                                <th class="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest border-b border-white/10 text-white">Mi Carpeta</th>
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
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <FolderEstado :nov="item" />
                                </td>
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <EstadoBadge :valor="item.aprobadoJefe" mini />
                                </td>
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <EstadoBadge :valor="item.aprobadoRrhh" mini />
                                </td>
                                <!-- Mi Carpeta (coordinador) -->
                                <td class="px-4 py-2.5 text-center border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                                    <CarpetaBadge :nombre="item.estadoChCoord" :estados="estadosCh" @click="abrirCarpeta(item)" />
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
                        Historial: <span :class="isDark ? 'text-white' : 'text-slate-800'">{{ historialFiltrado.length }}</span>
                        / {{ novedades.length }}
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

                    <div class="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
                        :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

                        <!-- Header -->
                        <div class="flex items-center justify-between px-5 py-3.5 border-b"
                            :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-folder-plus text-[#FF8F00]"></i>
                                <h3 class="text-sm font-black uppercase tracking-widest"
                                    :class="isDark ? 'text-white' : 'text-slate-800'">Mis Carpetas</h3>
                            </div>
                            <button @click="modalCarpetas.open = false"
                                class="w-7 h-7 rounded-lg flex items-center justify-center border"
                                :class="isDark ? 'bg-[#273045] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-500 border-slate-200'">
                                <i class="fas fa-xmark text-xs"></i>
                            </button>
                        </div>

                        <!-- Formulario crear / editar -->
                        <div class="px-5 py-4 border-b" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                            <p class="text-[9px] font-black uppercase tracking-widest mb-3"
                                :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                                {{ editandoCarpeta ? '✏️ Editando carpeta' : 'Nueva carpeta' }}
                            </p>
                            <div class="flex gap-2">
                                <input v-model="nuevaCarpeta.nombre" type="text" placeholder="Nombre..."
                                    class="flex-1 px-3 py-2 rounded-lg border text-[11px] font-bold outline-none focus:ring-1 focus:ring-[#FF8F00]/40"
                                    :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-800'"
                                    @keyup.enter="guardarCarpeta" />
                                <input type="color" v-model="nuevaCarpeta.color"
                                    class="w-9 h-9 rounded-lg border cursor-pointer p-0.5 shrink-0"
                                    :class="isDark ? 'bg-[#273045] border-[#2d3548]' : 'bg-white border-slate-200'" />
                                <select v-model="nuevaCarpeta.icono"
                                    class="px-2 py-2 rounded-lg border text-[10px] font-bold outline-none shrink-0"
                                    :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white' : 'bg-white border-slate-200 text-slate-700'">
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
                                    class="px-3 py-2 rounded-lg text-[10px] font-black uppercase italic tracking-widest transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 flex items-center gap-1"
                                    :class="editandoCarpeta ? 'bg-emerald-500 text-white' : 'bg-[#FF8F00] text-black'">
                                    <i v-if="loadingCarpeta" class="fas fa-circle-notch fa-spin text-[9px]"></i>
                                    <i v-else :class="editandoCarpeta ? 'fas fa-check' : 'fas fa-plus'" class="text-[9px]"></i>
                                </button>
                                <button v-if="editandoCarpeta" @click="cancelarEdicionCarpeta"
                                    class="px-2 py-2 rounded-lg border text-[10px] font-black"
                                    :class="isDark ? 'border-[#2d3548] text-slate-400' : 'border-slate-200 text-slate-500'">
                                    <i class="fas fa-xmark text-[9px]"></i>
                                </button>
                            </div>

                            <!-- Preview -->
                            <div v-if="nuevaCarpeta.nombre.trim()" class="mt-2 flex items-center gap-1.5">
                                <span class="text-[9px] opacity-50" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Vista previa:</span>
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-current/20 bg-current/10"
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
                            <p class="text-[9px] font-black uppercase tracking-widest mb-2"
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
                                    :class="[isDark ? 'bg-[#273045] border-[#3d4558]' : 'bg-slate-50 border-slate-200',
                                        editandoCarpeta?.id === est.id ? 'ring-1 ring-[#FF8F00]' : '']">
                                    <div class="flex items-center gap-2">
                                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-current/20 bg-current/10"
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
                                            class="w-6 h-6 rounded-lg flex items-center justify-center border text-[9px] transition-all hover:bg-[#FF8F00]/10 hover:text-[#FF8F00]"
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
                <div class="w-full max-w-xs rounded-2xl border shadow-2xl overflow-hidden"
                    :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

                    <div class="flex items-center justify-between px-4 py-3 border-b"
                        :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-folder-open text-[#FF8F00]"></i>
                            <h3 class="text-[11px] font-black uppercase tracking-widest"
                                :class="isDark ? 'text-white' : 'text-slate-800'">Mi Carpeta</h3>
                        </div>
                        <button @click="carpetaModal.open = false"
                            class="w-6 h-6 rounded-lg flex items-center justify-center border"
                            :class="isDark ? 'bg-[#273045] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-500 border-slate-200'">
                            <i class="fas fa-xmark text-[10px]"></i>
                        </button>
                    </div>
                    <div class="px-4 pt-3 pb-1">
                        <p class="text-[10px] font-black uppercase opacity-50"
                            :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                            {{ carpetaModal.nombreColaborador }}
                        </p>
                    </div>

                    <div class="px-4 pb-1">
                        <button @click="asignarCarpeta(null)"
                            class="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-bold transition-all hover:bg-[#FF8F00]/10"
                            :class="[isDark ? 'border-[#2d3548] text-slate-400' : 'border-slate-200 text-slate-500',
                                carpetaModal.estadoActual === null ? 'ring-1 ring-[#FF8F00]' : '']">
                            <i class="fas fa-folder-open opacity-40 w-4"></i>
                            <span>Sin carpeta</span>
                            <i v-if="carpetaModal.estadoActual === null" class="fas fa-check ml-auto text-[#FF8F00] text-[9px]"></i>
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
                            :class="[isDark ? 'border-[#2d3548]' : 'border-slate-200',
                                carpetaModal.estadoActual === est.nombre ? 'ring-1 ring-[#FF8F00]' : '']"
                            :style="{ borderLeftColor: est.color, borderLeftWidth: '3px' }">
                            <i :class="est.icono" :style="{ color: est.color }" class="w-4 text-center shrink-0"></i>
                            <span :class="isDark ? 'text-white' : 'text-slate-700'">{{ est.nombre }}</span>
                            <i v-if="carpetaModal.estadoActual === est.nombre" class="fas fa-check ml-auto text-[#FF8F00] text-[9px]"></i>
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
                        <img v-if="soporteModal.isImage" :src="soporteModal.url"
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

        <!-- Modal motivo -->
        <teleport to="body">
            <div v-if="motivoModal.open"
                class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                @mousedown.self="motivoModal.open = false">
                <div class="w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl"
                    :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-comment-alt text-[#FF8F00]"></i>
                        <h3 class="text-sm font-black uppercase tracking-widest"
                            :class="isDark ? 'text-white' : 'text-slate-800'">{{ motivoModal.titulo }}</h3>
                    </div>
                    <p class="text-[15px] font-medium leading-relaxed"
                        :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ motivoModal.texto }}</p>
                    <button @click="motivoModal.open = false"
                        class="py-2 rounded-lg text-[10px] font-black uppercase italic border"
                        :class="isDark ? 'border-[#2d3548] text-slate-400' : 'border-slate-200 text-slate-500'">Cerrar</button>
                </div>
            </div>
        </teleport>

        <!-- Menú contextual (tab pendientes) -->
        <teleport to="body">
            <div v-if="menuAbierto !== null" class="fixed inset-0 z-40" @click="menuAbierto = null"></div>
            <transition name="fade-msg">
                <div v-if="menuAbierto !== null" class="fixed z-50 w-48 rounded-xl border shadow-2xl overflow-hidden"
                    :style="{ top: menuPos.y + 'px', left: menuPos.x + 'px' }"
                    :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

                    <button @click="verSoporte(itemMenuActual); menuAbierto = null"
                        class="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase italic tracking-widest transition-all hover:bg-[#FF8F00]/10"
                        :class="isDark ? 'text-slate-300' : 'text-slate-700'">
                        <i class="fas fa-eye text-[#FF8F00] w-3"></i> Ver soporte
                    </button>

                    <button @click="abrirCarpeta(itemMenuActual); menuAbierto = null"
                        class="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase italic tracking-widest transition-all hover:bg-[#FF8F00]/10"
                        :class="isDark ? 'text-slate-300' : 'text-slate-700'">
                        <i class="fas fa-folder-open text-[#FF8F00] w-3"></i> Enviar a carpeta
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
                        <button @click="accionModal.open = false"
                            class="flex-1 py-2 rounded-lg text-[10px] font-black uppercase italic border"
                            :class="isDark ? 'border-[#2d3548] text-slate-400' : 'border-slate-200 text-slate-500'">
                            Cancelar
                        </button>
                        <button @click="confirmarAccion" :disabled="!accionModal.motivo.trim()"
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

const {
    novedades, loading,
    aprobarJefe, getFileUrl,
    fetchPorArea, fetchPorSegmento, fetchPorDepartamentos,
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
const modoLabel = esDirector ? 'Director — Todo el departamento' : esSegmento ? 'Jefe — Todo el segmento' : 'Jefe — Solo mi área';
const modoIcon = esDirector ? 'fas fa-building' : esSegmento ? 'fas fa-sitemap' : 'fas fa-users';

// ─── Componentes internos ─────────────────────────────────────────

const EstadoBadge = defineComponent({
    props: { valor: { default: null }, mini: Boolean },
    setup(p) {
        return () => {
            const v = p.valor;
            if (v === 1) return h('span', { class: 'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' }, [h('i', { class: 'fas fa-check' }), !p.mini && ' Aprobado'].filter(Boolean));
            if (v === 0) return h('span', { class: 'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase bg-red-500/10 text-red-400 border border-red-500/20' }, [h('i', { class: 'fas fa-xmark' }), !p.mini && ' Rechazado'].filter(Boolean));
            return h('span', { class: 'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20' }, [h('i', { class: 'fas fa-clock' }), !p.mini && ' Pendiente'].filter(Boolean));
        };
    }
});

const FolderEstado = defineComponent({
    props: { nov: Object },
    setup(p) {
        return () => {
            const cfg = getEstadoVisual(p.nov);
            return h('span', { class: `inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${cfg.bg}` }, [
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
                    class: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border cursor-pointer hover:opacity-80 transition-opacity',
                    style: { borderColor: est.color + '33', background: est.color + '15' }
                }, [
                    h('i', { class: est.icono, style: { color: est.color } }),
                    h('span', { style: { color: est.color } }, est.nombre)
                ]);
            }
            return h('button', {
                onClick: () => emitBadge('click'),
                class: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-dashed transition-all hover:border-[#FF8F00]/50 hover:text-[#FF8F00] text-slate-400 border-slate-300/30'
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
const pendientes = computed(() =>
    novedades.value.filter(n => n.aprobadoJefe === null || n.aprobadoJefe === undefined)
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
const nuevaCarpeta = ref({ nombre: '', icono: 'fas fa-folder', color: '#FF8F00' });
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
        nuevaCarpeta.value = { nombre: '', icono: 'fas fa-folder', color: '#FF8F00' };
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
    nuevaCarpeta.value = { nombre: '', icono: 'fas fa-folder', color: '#FF8F00' };
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
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.fade-msg-enter-active, .fade-msg-leave-active { transition: all 0.2s ease; }
.fade-msg-enter-from, .fade-msg-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
