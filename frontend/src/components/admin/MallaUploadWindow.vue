<template>
  <Teleport to="body">
    <Transition name="uw">
      <div v-if="modelValue"
        class="fixed inset-0 z-[200] flex items-center justify-center p-4 font-round-custom">

        <div class="uw-backdrop absolute inset-0 bg-black/30" @click="tryClose"></div>

        <!-- Dialog -->
        <div class="uw-dialog relative z-10 w-full max-w-[720px] max-h-[90vh] flex flex-col"
          :class="isDark
            ? 'bg-[#161B26] border border-[#222938] shadow-2xl rounded-sm'
            : 'bg-white border border-[#d1d5db] shadow-xl rounded-sm'">

          <!-- HEADER -->
          <div class="px-6 py-4 border-b flex items-center justify-between"
            :class="isDark ? 'border-[#222938] bg-[#0B0F19]' : 'border-[#e5e7eb]'">
            <div class="flex items-center gap-2.5">
              <div class="w-6 h-6 rounded bg-[#3B82F6]/10 flex items-center justify-center">
                <i class="fas fa-cloud-arrow-up text-[#3B82F6] text-[10px]"></i>
              </div>
              <h2 class="text-[14px] font-semibold"
                :class="isDark ? 'text-white' : 'text-[#111]'">
                Gestión de mallas
              </h2>
            </div>
            <button @click="tryClose"
              class="text-[11px] transition-all px-3 py-1.5 border rounded"
              :class="isDark
                ? 'border-[#222938] text-[#888] hover:bg-white/10 hover:text-white'
                : 'border-[#d1d5db] text-[#374151] hover:bg-[#f9fafb]'">
              Cerrar
            </button>
          </div>

          <!-- MAIN TABS -->
          <div class="flex border-b px-6 gap-1"
            :class="isDark ? 'border-[#222938] bg-[#0B0F19]' : 'border-[#e5e7eb] bg-[#f9fafb]'">
            <button @click="mainTab = 'asignar'; resetAll()"
              class="py-2.5 px-3 text-[11px] font-medium border-b-2 -mb-px transition-colors"
              :class="mainTab === 'asignar'
                ? (isDark ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-[#111] text-[#111]')
                : (isDark ? 'border-transparent text-[#4a5568] hover:text-[#D8DAE3]' : 'border-transparent text-[#6b7280] hover:text-[#374151]')">
              <i class="fas fa-file-import text-[9px] mr-1.5"></i>Asignar mallas
            </button>
            <button @click="mainTab = 'crear'; resetAll()"
              class="py-2.5 px-3 text-[11px] font-medium border-b-2 -mb-px transition-colors"
              :class="mainTab === 'crear'
                ? (isDark ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-[#111] text-[#111]')
                : (isDark ? 'border-transparent text-[#4a5568] hover:text-[#D8DAE3]' : 'border-transparent text-[#6b7280] hover:text-[#374151]')">
              <i class="fas fa-plus-circle text-[9px] mr-1.5"></i>Crear malla
            </button>
          </div>

          <!-- BODY -->
          <div class="flex-1 overflow-y-auto custom-scrollbar">

            <!-- ═══════════════════════════════════════════════════════ -->
            <!-- TAB: ASIGNAR MALLAS (funcionalidad original)          -->
            <!-- ═══════════════════════════════════════════════════════ -->
            <template v-if="mainTab === 'asignar'">

              <!-- ── IDLE ── -->
              <div v-if="uploadState === 'idle'" class="p-6 flex flex-col gap-4">

                <!-- Vigencia -->
                <VigenciaForm :isDark="isDark"
                  v-model:fechaInicio="fechaInicio"
                  v-model:fechaFin="fechaFin"
                  v-model:indefinidamente="indefinidamente" />

                <!-- Drop zone -->
                <DropZone :isDark="isDark" :isDragging="isDragging"
                  @dragover.prevent="isDragging = true" @dragleave.self="isDragging = false"
                  @drop.prevent="onDropAsignar" @click="triggerPickerAsignar" />
                <input ref="fileInputAsignar" type="file" class="hidden" accept=".xlsx,.xls" @change="onFileSelectedAsignar" />

                <p class="text-[11px] leading-relaxed"
                  :class="isDark ? 'text-[#4a5568]' : 'text-[#6b7280]'">
                  El archivo debe incluir las columnas <strong>Empleado</strong>,
                  <strong>Horario de trabajo</strong> y opcionalmente <strong>Fecha de inicio</strong>.
                  Use el botón <em>Plantilla</em> para descargar el formato correcto.
                </p>
              </div>

              <!-- UPLOADING / DONE -->
              <UploadResult v-else
                :isDark="isDark"
                :uploadState="uploadState"
                :fileName="fileName"
                :fileSize="fileSize"
                :progress="progress"
                :procesados="procesados"
                :errors="errors"
                :activeTab="activeTab"
                @update:activeTab="activeTab = $event"
                @resetForAnother="resetForAnother"
                @descargarReporte="descargarReporte" />
            </template>

            <!-- ═══════════════════════════════════════════════════════ -->
            <!-- TAB: CREAR MALLA                                      -->
            <!-- ═══════════════════════════════════════════════════════ -->
            <template v-if="mainTab === 'crear'">

              <!-- ── IDLE ── -->
              <div v-if="crearState === 'idle'" class="p-6 flex flex-col gap-4">

                <!-- Checkbox asignar -->
                <div class="border rounded p-4 flex flex-col gap-3"
                  :class="isDark ? 'border-[#222938] bg-[#0B0F19]' : 'border-[#e5e7eb] bg-[#f9fafb]'">
                  <p class="text-[11px] font-semibold uppercase tracking-wide"
                    :class="isDark ? 'text-[#4a5568]' : 'text-[#6b7280]'">
                    Opciones de creación
                  </p>

                  <label class="flex items-center gap-2 cursor-pointer w-fit">
                    <input type="checkbox" v-model="crearYAsignar"
                      class="w-3.5 h-3.5 accent-[#3B82F6] cursor-pointer" />
                    <span class="text-[11px]"
                      :class="isDark ? 'text-[#7a8aa0]' : 'text-[#374151]'">
                      Asignar malla al empleado (requiere columna Cédula en el Excel)
                    </span>
                  </label>

                  <div v-if="crearYAsignar"
                    class="text-[10px] leading-relaxed px-2 py-1.5 rounded"
                    :class="isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-700'">
                    <i class="fas fa-info-circle text-[9px] mr-1"></i>
                    Las filas con cédula vacía solo crearán la malla sin asignarla.
                  </div>
                </div>

                <!-- Vigencia (solo si asignar) -->
                <VigenciaForm v-if="crearYAsignar" :isDark="isDark"
                  v-model:fechaInicio="crearFechaInicio"
                  v-model:fechaFin="crearFechaFin"
                  v-model:indefinidamente="crearIndefinidamente" />

                <!-- Drop zone -->
                <DropZone :isDark="isDark" :isDragging="isDraggingCrear"
                  @dragover.prevent="isDraggingCrear = true" @dragleave.self="isDraggingCrear = false"
                  @drop.prevent="onDropCrear" @click="triggerPickerCrear" />
                <input ref="fileInputCrear" type="file" class="hidden" accept=".xlsx,.xls" @change="onFileSelectedCrear" />

                <p class="text-[11px] leading-relaxed"
                  :class="isDark ? 'text-[#4a5568]' : 'text-[#6b7280]'">
                  Formato horizontal: <strong>Cedula</strong> (opcional) | <strong>Turno</strong> |
                  <strong>Lunes</strong> | <strong>Martes</strong> | … | <strong>Sábado</strong>.
                  Cada celda de día debe tener el rango horario (ej: <em>7:00 AM a 4:00 PM</em>).
                </p>
              </div>

              <!-- UPLOADING / DONE (crear) -->
              <div v-else class="flex flex-col">

                <!-- Archivo -->
                <div class="px-6 pt-5 pb-4">
                  <p class="text-[11px] font-semibold mb-2"
                    :class="isDark ? 'text-[#888]' : 'text-[#6b7280]'">
                    Archivos (1)
                  </p>
                  <div class="border rounded"
                    :class="isDark ? 'border-[#222938]' : 'border-[#e5e7eb]'">
                    <div class="flex items-center gap-3 px-4 py-3"
                      :class="isDark ? 'bg-[#0B0F19]' : ''">
                      <i class="fas fa-file-excel text-[14px] shrink-0"
                        :class="crearState === 'error' ? 'text-red-500' : 'text-[#16a34a]'"></i>
                      <div class="flex-1 min-w-0">
                        <p class="text-[12px] font-medium truncate"
                          :class="isDark ? 'text-[#E2E8F0]' : 'text-[#111]'">{{ crearFileName }}</p>
                        <p class="text-[10px] mt-0.5 font-mono"
                          :class="isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]'">{{ crearFileSize }}</p>
                      </div>
                      <div class="text-[11px] font-medium shrink-0 flex items-center gap-1.5">
                        <template v-if="crearState === 'uploading'">
                          <i class="fas fa-spinner fa-spin text-[#4a9eff] text-[10px]"></i>
                          <span :class="isDark ? 'text-[#4a9eff]' : 'text-[#2563eb]'">Procesando…</span>
                        </template>
                        <template v-else-if="crearState === 'done'">
                          <i class="fas fa-check text-[#16a34a] text-[10px]"></i>
                          <span :class="isDark ? 'text-[#4ade80]' : 'text-[#16a34a]'">Completado</span>
                        </template>
                        <template v-else-if="crearState === 'error'">
                          <i class="fas fa-times text-red-500 text-[10px]"></i>
                          <span class="text-red-500">Error</span>
                        </template>
                      </div>
                    </div>
                    <div class="h-[2px] w-full" :class="isDark ? 'bg-[#222938]' : 'bg-[#f3f4f6]'">
                      <div class="h-full transition-all duration-300"
                        :class="crearState === 'done' ? 'bg-[#16a34a]' : crearState === 'error' ? 'bg-red-500' : 'bg-[#4a9eff]'"
                        :style="{ width: crearProgress + '%' }"></div>
                    </div>
                  </div>
                </div>

                <div class="border-t mx-6" :class="isDark ? 'border-[#222938]' : 'border-[#f3f4f6]'"></div>

                <!-- Resultados crear -->
                <template v-if="crearState === 'done' || crearState === 'error'">

                  <!-- Resumen -->
                  <div class="px-6 py-3 flex items-center gap-4 flex-wrap border-b"
                    :class="isDark ? 'border-[#222938] bg-[#0B0F19]' : 'border-[#e5e7eb] bg-[#f9fafb]'">
                    <div class="flex items-center gap-2">
                      <i class="fas fa-plus-circle text-[12px]"
                        :class="crearResult.mallasCreadas ? 'text-[#16a34a]' : (isDark ? 'text-[#2A344A]' : 'text-[#d1d5db]')"></i>
                      <span class="text-[12px] font-semibold tabular-nums"
                        :class="crearResult.mallasCreadas ? (isDark ? 'text-[#4ade80]' : 'text-[#16a34a]') : (isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]')">
                        {{ crearResult.mallasCreadas }}
                      </span>
                      <span class="text-[11px]" :class="isDark ? 'text-[#4a5568]' : 'text-[#6b7280]'">creadas</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <i class="fas fa-ban text-[12px]"
                        :class="crearResult.mallasOmitidas ? 'text-yellow-500' : (isDark ? 'text-[#2A344A]' : 'text-[#d1d5db]')"></i>
                      <span class="text-[12px] font-semibold tabular-nums"
                        :class="crearResult.mallasOmitidas ? 'text-yellow-500' : (isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]')">
                        {{ crearResult.mallasOmitidas }}
                      </span>
                      <span class="text-[11px]" :class="isDark ? 'text-[#4a5568]' : 'text-[#6b7280]'">existentes</span>
                    </div>
                    <div v-if="crearYAsignar" class="flex items-center gap-2">
                      <i class="fas fa-user-check text-[12px]"
                        :class="crearResult.asignados ? 'text-[#3B82F6]' : (isDark ? 'text-[#2A344A]' : 'text-[#d1d5db]')"></i>
                      <span class="text-[12px] font-semibold tabular-nums"
                        :class="crearResult.asignados ? 'text-[#3B82F6]' : (isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]')">
                        {{ crearResult.asignados }}
                      </span>
                      <span class="text-[11px]" :class="isDark ? 'text-[#4a5568]' : 'text-[#6b7280]'">asignadas</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <i class="fas fa-times-circle text-[12px]"
                        :class="crearErrors.length ? 'text-red-500' : (isDark ? 'text-[#2A344A]' : 'text-[#d1d5db]')"></i>
                      <span class="text-[12px] font-semibold tabular-nums"
                        :class="crearErrors.length ? 'text-red-500' : (isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]')">
                        {{ crearErrors.length }}
                      </span>
                      <span class="text-[11px]" :class="isDark ? 'text-[#4a5568]' : 'text-[#6b7280]'">errores</span>
                    </div>
                    <button @click="resetCrear"
                      class="ml-auto text-[11px] transition-all px-2.5 py-1 border rounded"
                      :class="isDark
                        ? 'border-[#222938] text-[#7a8aa0] hover:bg-white/5 hover:text-white'
                        : 'border-[#d1d5db] text-[#374151] hover:bg-white'">
                      <i class="fas fa-plus text-[9px] mr-1"></i>Otro archivo
                    </button>
                  </div>

                  <!-- Tabs de resultados crear -->
                  <div class="flex border-b px-6 gap-1"
                    :class="isDark ? 'border-[#222938]' : 'border-[#e5e7eb]'">
                    <button @click="crearActiveTab = 'creadas'"
                      class="py-2.5 px-1 mr-4 text-[11px] font-medium border-b-2 -mb-px transition-colors"
                      :class="crearActiveTab === 'creadas'
                        ? (isDark ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-[#111] text-[#111]')
                        : (isDark ? 'border-transparent text-[#4a5568] hover:text-[#D8DAE3]' : 'border-transparent text-[#6b7280] hover:text-[#374151]')">
                      Mallas ({{ crearResult.detalleMallas?.creadas?.length || 0 }})
                    </button>
                    <button v-if="crearYAsignar" @click="crearActiveTab = 'asignados'"
                      class="py-2.5 px-1 mr-4 text-[11px] font-medium border-b-2 -mb-px transition-colors"
                      :class="crearActiveTab === 'asignados'
                        ? (isDark ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-[#111] text-[#111]')
                        : (isDark ? 'border-transparent text-[#4a5568] hover:text-[#D8DAE3]' : 'border-transparent text-[#6b7280] hover:text-[#374151]')">
                      Asignados ({{ crearResult.detalleAsignados?.length || 0 }})
                    </button>
                    <button @click="crearActiveTab = 'errores'"
                      class="py-2.5 px-1 text-[11px] font-medium border-b-2 -mb-px transition-colors"
                      :class="crearActiveTab === 'errores'
                        ? (isDark ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-[#111] text-[#111]')
                        : (isDark ? 'border-transparent text-[#4a5568] hover:text-[#D8DAE3]' : 'border-transparent text-[#6b7280] hover:text-[#374151]')">
                      Errores ({{ crearErrors.length }})
                    </button>
                  </div>

                  <!-- Tab Creadas -->
                  <div v-if="crearActiveTab === 'creadas'" class="max-h-[260px] overflow-y-auto custom-scrollbar">
                    <div v-if="!crearResult.detalleMallas?.creadas?.length"
                      class="py-10 text-center text-[11px]"
                      :class="isDark ? 'text-[#555]' : 'text-[#9ca3af]'">
                      No se crearon mallas nuevas
                    </div>
                    <div v-else>
                      <div v-for="(m, i) in crearResult.detalleMallas.creadas" :key="i"
                        class="flex items-center gap-3 px-6 py-2.5 border-b"
                        :class="isDark ? 'border-[#1e2538] hover:bg-white/[0.03]' : 'border-[#f3f4f6] hover:bg-[#f9fafb]'">
                        <i class="fas fa-check text-[8px] text-[#16a34a]"></i>
                        <span class="text-[11px] font-medium"
                          :class="isDark ? 'text-[#E2E8F0]' : 'text-[#111]'">{{ m }}</span>
                      </div>
                    </div>
                    <!-- Omitidas -->
                    <div v-if="crearResult.detalleMallas?.omitidas?.length" class="px-6 pt-3 pb-1">
                      <p class="text-[10px] font-semibold uppercase tracking-wide mb-1"
                        :class="isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]'">
                        Ya existentes (omitidas)
                      </p>
                    </div>
                    <div v-for="(m, i) in (crearResult.detalleMallas?.omitidas || [])" :key="'o'+i"
                      class="flex items-center gap-3 px-6 py-2 border-b"
                      :class="isDark ? 'border-[#1e2538]' : 'border-[#f3f4f6]'">
                      <i class="fas fa-ban text-[8px] text-yellow-500"></i>
                      <span class="text-[11px]"
                        :class="isDark ? 'text-[#7a8aa0]' : 'text-[#6b7280]'">{{ m }}</span>
                    </div>
                  </div>

                  <!-- Tab Asignados -->
                  <div v-if="crearActiveTab === 'asignados'" class="max-h-[260px] overflow-y-auto custom-scrollbar">
                    <div v-if="!crearResult.detalleAsignados?.length"
                      class="py-10 text-center text-[11px]"
                      :class="isDark ? 'text-[#555]' : 'text-[#9ca3af]'">
                      Sin asignaciones
                    </div>
                    <div v-else>
                      <div class="grid grid-cols-[48px_110px_1fr_150px_90px] px-6 py-2 border-b"
                        :class="isDark ? 'border-[#222938] bg-[#0B0F19]' : 'border-[#e5e7eb] bg-[#f9fafb]'">
                        <span class="text-[10px] font-semibold uppercase tracking-wide"
                          :class="isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]'">Fila</span>
                        <span class="text-[10px] font-semibold uppercase tracking-wide"
                          :class="isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]'">Cédula</span>
                        <span class="text-[10px] font-semibold uppercase tracking-wide"
                          :class="isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]'">Nombre</span>
                        <span class="text-[10px] font-semibold uppercase tracking-wide"
                          :class="isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]'">Malla</span>
                        <span class="text-[10px] font-semibold uppercase tracking-wide text-right"
                          :class="isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]'">Fecha</span>
                      </div>
                      <div v-for="(p, i) in crearResult.detalleAsignados" :key="i"
                        class="grid grid-cols-[48px_110px_1fr_150px_90px] items-center px-6 py-2.5 border-b"
                        :class="isDark ? 'border-[#1e2538] hover:bg-white/[0.03]' : 'border-[#f3f4f6] hover:bg-[#f9fafb]'">
                        <span class="text-[10px] font-mono flex items-center gap-1.5"
                          :class="isDark ? 'text-[#4ade80]' : 'text-[#16a34a]'">
                          <i class="fas fa-check text-[8px]"></i>{{ p.fila }}
                        </span>
                        <span class="text-[10px] font-mono truncate pr-2"
                          :class="isDark ? 'text-[#7a8aa0]' : 'text-[#6b7280]'">{{ p.cedula }}</span>
                        <span class="text-[11px] font-medium truncate pr-2 uppercase"
                          :class="isDark ? 'text-[#E2E8F0]' : 'text-[#111]'">{{ p.nombre }}</span>
                        <span class="text-[10px] truncate pr-2 italic" style="color:#b45309">{{ p.malla }}</span>
                        <span class="text-[10px] font-mono text-right"
                          :class="isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]'">{{ p.fecha }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Tab Errores -->
                  <div v-if="crearActiveTab === 'errores'">
                    <div v-if="!crearErrors.length"
                      class="py-10 text-center text-[11px]"
                      :class="isDark ? 'text-[#555]' : 'text-[#9ca3af]'">
                      Sin errores
                    </div>
                    <div v-else class="max-h-[260px] overflow-y-auto custom-scrollbar">
                      <div v-for="(err, i) in crearErrors" :key="i"
                        class="flex items-start gap-3 px-6 py-3 border-b"
                        :class="isDark ? 'border-[#1e2538] hover:bg-white/[0.02]' : 'border-[#f3f4f6] hover:bg-[#fff5f5]'">
                        <div class="flex items-center gap-1.5 shrink-0 mt-0.5">
                          <i class="fas fa-times-circle text-[10px] text-red-500"></i>
                          <span class="text-[10px] font-mono"
                            :class="isDark ? 'text-[#7a8aa0]' : 'text-[#6b7280]'">F{{ err.fila }}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                          <span v-if="err.cedula" class="text-[10px] font-mono mr-2"
                            :class="isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]'">{{ err.cedula }}</span>
                          <span class="text-[11px]"
                            :class="isDark ? 'text-[#D8DAE3]' : 'text-[#374151]'">{{ err.error }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </template>

                <!-- Spinner -->
                <div v-if="crearState === 'uploading'"
                  class="py-8 flex items-center justify-center gap-2">
                  <i class="fas fa-spinner fa-spin text-[11px]"
                    :class="isDark ? 'text-[#555]' : 'text-[#9ca3af]'"></i>
                  <span class="text-[11px]"
                    :class="isDark ? 'text-[#555]' : 'text-[#9ca3af]'">Procesando mallas…</span>
                </div>
              </div>
            </template>

          </div>

          <!-- FOOTER -->
          <div class="px-6 py-3 border-t flex items-center justify-between"
            :class="isDark ? 'border-[#222938] bg-[#0B0F19]' : 'border-[#e5e7eb] bg-[#f9fafb]'">

            <button
              v-if="showDownloadButton"
              @click="mainTab === 'asignar' ? descargarReporte() : descargarReporteCrear()"
              class="text-[11px] transition-all px-3 py-1.5 border rounded flex items-center gap-1.5"
              :class="isDark
                ? 'border-[#222938] text-[#7a8aa0] hover:bg-white/5 hover:text-white'
                : 'border-[#d1d5db] text-[#374151] hover:bg-white'">
              <i class="fas fa-download text-[9px]"></i>
              Descargar reporte
            </button>
            <div v-else></div>

            <div class="flex items-center gap-2">
              <button v-if="!isUploading" @click="tryClose"
                class="text-[11px] font-semibold transition-all px-4 py-1.5 rounded"
                :class="isDone
                  ? 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
                  : (isDark ? 'border border-[#222938] text-[#7a8aa0] hover:bg-white/5 hover:text-white' : 'border border-[#d1d5db] text-[#374151] hover:bg-white')">
                {{ isDone ? 'Cerrar' : 'Cancelar' }}
              </button>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import axios from 'axios'
import VigenciaForm from './MallaVigenciaForm.vue'
import DropZone from './MallaDropZone.vue'
import UploadResult from './MallaUploadResult.vue'

const props = defineProps({
  modelValue: Boolean,
  isDark: Boolean,
})
const emit = defineEmits(['update:modelValue', 'uploaded'])

const API_BASE_URL = import.meta.env.VITE_API_URL

// ── Shared ──
const mainTab = ref('asignar')

// ── Asignar tab ──
const uploadState = ref('idle')
const isDragging = ref(false)
const fileInputAsignar = ref(null)
const fileName = ref('')
const fileSize = ref('')
const progress = ref(0)
const procesados = ref([])
const errors = ref([])
const activeTab = ref('success')

const hoyBogota = () =>
  new Date().toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).slice(0, 10)

const fechaInicio = ref(hoyBogota())
const fechaFin = ref('')
const indefinidamente = ref(true)

watch(indefinidamente, (val) => { if (val) fechaFin.value = '' })

// ── Crear tab ──
const crearState = ref('idle')
const isDraggingCrear = ref(false)
const fileInputCrear = ref(null)
const crearFileName = ref('')
const crearFileSize = ref('')
const crearProgress = ref(0)
const crearResult = ref({})
const crearErrors = ref([])
const crearActiveTab = ref('creadas')
const crearYAsignar = ref(false)
const crearFechaInicio = ref(hoyBogota())
const crearFechaFin = ref('')
const crearIndefinidamente = ref(true)

watch(crearIndefinidamente, (val) => { if (val) crearFechaFin.value = '' })

// ── Computed ──
const isUploading = computed(() => uploadState.value === 'uploading' || crearState.value === 'uploading')
const isDone = computed(() =>
  (mainTab.value === 'asignar' && uploadState.value === 'done') ||
  (mainTab.value === 'crear' && crearState.value === 'done')
)
const showDownloadButton = computed(() => {
  if (mainTab.value === 'asignar') {
    return (uploadState.value === 'done' || uploadState.value === 'error') && (procesados.value.length || errors.value.length)
  }
  return (crearState.value === 'done' || crearState.value === 'error') && (crearResult.value.mallasCreadas || crearErrors.value.length)
})

// ── Progress helpers ──
let progressTimer = null
let crearProgressTimer = null

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const startProgress = (timerRef) => {
  const isCrear = timerRef === 'crear'
  const setProgress = isCrear ? (v) => crearProgress.value = v : (v) => progress.value = v
  setProgress(0)
  const timer = setInterval(() => {
    const current = isCrear ? crearProgress.value : progress.value
    if (current < 82) setProgress(Math.min(82, current + Math.random() * 7 + 2))
  }, 180)
  if (isCrear) crearProgressTimer = timer
  else progressTimer = timer
}

const readAndCleanExcel = async (file) => {
  const XLSX = await import('xlsx')
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  Object.keys(sheet).forEach((ref) => {
    if (ref.startsWith('!')) return
    const cell = sheet[ref]
    if (cell?.t === 's' && typeof cell.v === 'string') {
      const v = cell.v.trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[̀-ͯ]/g, '')
      cell.v = v
      cell.w = v
    }
  })
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

// ── Asignar handlers ──
const triggerPickerAsignar = () => fileInputAsignar.value?.click()

const onDropAsignar = (e) => {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFileAsignar(file)
}

const onFileSelectedAsignar = (e) => {
  const file = e.target?.files?.[0]
  if (file) processFileAsignar(file)
  if (e.target) e.target.value = ''
}

const processFileAsignar = async (file) => {
  fileName.value = file.name
  fileSize.value = formatSize(file.size)
  procesados.value = []
  errors.value = []
  activeTab.value = 'success'
  uploadState.value = 'uploading'
  startProgress('asignar')
  try {
    const cleanBlob = await readAndCleanExcel(file)
    const session = JSON.parse(localStorage.getItem('user_session') || '{}')
    const formData = new FormData()
    formData.append('file', cleanBlob, file.name)
    formData.append('asignado_por', session.name || 'Desconocido')
    if (fechaInicio.value) formData.append('fecha_inicio_override', fechaInicio.value)
    if (!indefinidamente.value && fechaFin.value) formData.append('fecha_fin', fechaFin.value)
    const { data } = await axios.post(`${API_BASE_URL}/mallas-upload/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    procesados.value = data.procesados || []
    errors.value = (data.errors || []).map((e) => ({
      fila: e.fila ?? '?',
      cedula: e.cedula || '',
      error: e.error || e.message || 'Error sin descripción',
    }))
    activeTab.value = procesados.value.length > 0 ? 'success' : 'errors'
    clearInterval(progressTimer)
    progress.value = 100
    uploadState.value = 'done'
    emit('uploaded')
  } catch (err) {
    errors.value = [{
      fila: '!',
      cedula: '',
      error: err.response?.data?.message || err.message || 'Error de conexión',
    }]
    activeTab.value = 'errors'
    clearInterval(progressTimer)
    progress.value = 100
    uploadState.value = 'error'
  }
}

// ── Crear handlers ──
const triggerPickerCrear = () => fileInputCrear.value?.click()

const onDropCrear = (e) => {
  isDraggingCrear.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFileCrear(file)
}

const onFileSelectedCrear = (e) => {
  const file = e.target?.files?.[0]
  if (file) processFileCrear(file)
  if (e.target) e.target.value = ''
}

const processFileCrear = async (file) => {
  crearFileName.value = file.name
  crearFileSize.value = formatSize(file.size)
  crearResult.value = {}
  crearErrors.value = []
  crearActiveTab.value = 'creadas'
  crearState.value = 'uploading'
  startProgress('crear')
  try {
    const cleanBlob = await readAndCleanExcel(file)
    const session = JSON.parse(localStorage.getItem('user_session') || '{}')
    const formData = new FormData()
    formData.append('file', cleanBlob, file.name)
    formData.append('asignar', crearYAsignar.value ? 'true' : 'false')
    formData.append('asignado_por', session.name || 'Desconocido')
    if (crearYAsignar.value) {
      if (crearFechaInicio.value) formData.append('fecha_inicio_override', crearFechaInicio.value)
      if (!crearIndefinidamente.value && crearFechaFin.value) formData.append('fecha_fin', crearFechaFin.value)
    }
    const { data } = await axios.post(`${API_BASE_URL}/mallas-admin/upload-excel-crear-asignar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    crearResult.value = data
    crearErrors.value = (data.errors || []).map((e) => ({
      fila: e.fila ?? '?',
      cedula: e.cedula || '',
      error: e.error || e.message || 'Error sin descripción',
    }))
    if (crearResult.value.mallasCreadas > 0) crearActiveTab.value = 'creadas'
    else if (crearResult.value.asignados > 0) crearActiveTab.value = 'asignados'
    else crearActiveTab.value = 'errores'
    clearInterval(crearProgressTimer)
    crearProgress.value = 100
    crearState.value = 'done'
    emit('uploaded')
  } catch (err) {
    crearErrors.value = [{
      fila: '!',
      cedula: '',
      error: err.response?.data?.message || err.message || 'Error de conexión',
    }]
    crearActiveTab.value = 'errores'
    clearInterval(crearProgressTimer)
    crearProgress.value = 100
    crearState.value = 'error'
  }
}

// ── Reports ──
const descargarReporte = async () => {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  const wsExito = XLSX.utils.aoa_to_sheet([
    ['Fila', 'Cédula', 'Nombre', 'Malla Asignada', 'Fecha'],
    ...procesados.value.map((p) => [p.fila, p.cedula, p.nombre, p.malla, p.fecha]),
  ])
  wsExito['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 35 }, { wch: 45 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, wsExito, 'Asignados')
  const wsError = XLSX.utils.aoa_to_sheet([
    ['Fila', 'Cédula', 'Error'],
    ...errors.value.map((e) => [e.fila, e.cedula, e.error]),
  ])
  wsError['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 55 }]
  XLSX.utils.book_append_sheet(wb, wsError, 'Errores')
  XLSX.writeFile(wb, `reporte_carga_mallas_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

const descargarReporteCrear = async () => {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  const wsCreadas = XLSX.utils.aoa_to_sheet([
    ['Malla'],
    ...(crearResult.value.detalleMallas?.creadas || []).map((m) => [m]),
  ])
  wsCreadas['!cols'] = [{ wch: 50 }]
  XLSX.utils.book_append_sheet(wb, wsCreadas, 'Creadas')
  if (crearYAsignar.value && crearResult.value.detalleAsignados?.length) {
    const wsAsig = XLSX.utils.aoa_to_sheet([
      ['Fila', 'Cédula', 'Nombre', 'Malla', 'Fecha'],
      ...crearResult.value.detalleAsignados.map((p) => [p.fila, p.cedula, p.nombre, p.malla, p.fecha]),
    ])
    wsAsig['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 35 }, { wch: 45 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsAsig, 'Asignados')
  }
  const wsError = XLSX.utils.aoa_to_sheet([
    ['Fila', 'Cédula', 'Error'],
    ...crearErrors.value.map((e) => [e.fila, e.cedula, e.error]),
  ])
  wsError['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 55 }]
  XLSX.utils.book_append_sheet(wb, wsError, 'Errores')
  XLSX.writeFile(wb, `reporte_crear_mallas_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

// ── Resets ──
const resetForAnother = () => {
  clearInterval(progressTimer)
  progressTimer = null
  uploadState.value = 'idle'
  procesados.value = []
  errors.value = []
  progress.value = 0
  fileName.value = ''
  fileSize.value = ''
}

const resetCrear = () => {
  clearInterval(crearProgressTimer)
  crearProgressTimer = null
  crearState.value = 'idle'
  crearResult.value = {}
  crearErrors.value = []
  crearProgress.value = 0
  crearFileName.value = ''
  crearFileSize.value = ''
}

const resetAll = () => {
  resetForAnother()
  resetCrear()
}

const tryClose = () => {
  if (isUploading.value) return
  resetAll()
  fechaInicio.value = hoyBogota()
  fechaFin.value = ''
  indefinidamente.value = true
  crearFechaInicio.value = hoyBogota()
  crearFechaFin.value = ''
  crearIndefinidamente.value = true
  emit('update:modelValue', false)
}
</script>

<style scoped>
.uw-enter-active,
.uw-leave-active {
  transition: opacity 0.15s ease;
}
.uw-enter-from,
.uw-leave-to {
  opacity: 0;
}
.uw-enter-active .uw-dialog,
.uw-leave-active .uw-dialog {
  transition: transform 0.18s ease, opacity 0.15s ease;
}
.uw-enter-from .uw-dialog {
  transform: translateY(-6px);
  opacity: 0;
}
.uw-leave-to .uw-dialog {
  transform: translateY(-4px);
  opacity: 0;
}
</style>
