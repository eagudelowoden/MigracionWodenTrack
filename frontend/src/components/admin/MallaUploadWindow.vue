<template>
  <Teleport to="body">
    <Transition name="uw">
      <div v-if="modelValue"
        class="fixed inset-0 z-[200] flex items-center justify-center p-4 font-round-custom">

        <div class="uw-backdrop absolute inset-0 bg-black/30" @click="tryClose"></div>

        <!-- Dialog -->
        <div class="uw-dialog relative z-10 w-full max-w-[620px] max-h-[88vh] flex flex-col"
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
                Cargar mallas
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

          <!-- BODY -->
          <div class="flex-1 overflow-y-auto custom-scrollbar">

            <!-- ── IDLE ── -->
            <div v-if="uploadState === 'idle'" class="p-6 flex flex-col gap-4">

              <!-- ── Sección de fechas ── -->
              <div class="border rounded p-4 flex flex-col gap-3"
                :class="isDark ? 'border-[#222938] bg-[#0B0F19]' : 'border-[#e5e7eb] bg-[#f9fafb]'">
                <p class="text-[11px] font-semibold uppercase tracking-wide"
                  :class="isDark ? 'text-[#4a5568]' : 'text-[#6b7280]'">
                  Vigencia de la malla
                </p>

                <div class="flex flex-col gap-2.5">
                  <!-- Fecha inicio -->
                  <div class="flex items-center gap-3">
                    <label class="text-[11px] w-24 shrink-0"
                      :class="isDark ? 'text-[#7a8aa0]' : 'text-[#374151]'">Fecha inicio</label>
                    <input type="date" v-model="fechaInicio"
                      class="text-[11px] px-2 py-1 border rounded outline-none transition-colors"
                      :class="isDark
                        ? 'bg-[#161B26] border-[#222938] text-[#E2E8F0] focus:border-[#3B82F6]'
                        : 'bg-white border-[#d1d5db] text-[#111] focus:border-[#3B82F6]'" />
                    <span v-if="advertenciaFechaInicio"
                      class="text-[10px] font-medium px-2 py-0.5 rounded"
                      :class="isDark ? 'bg-yellow-900/40 text-yellow-400' : 'bg-yellow-50 text-yellow-700'">
                      <i class="fas fa-exclamation-triangle text-[9px] mr-1"></i>{{ advertenciaFechaInicio }}
                    </span>
                  </div>

                  <!-- Fecha fin -->
                  <div class="flex items-center gap-3">
                    <label class="text-[11px] w-24 shrink-0"
                      :class="isDark ? 'text-[#7a8aa0]' : 'text-[#374151]'">Fecha fin</label>
                    <input type="date" v-model="fechaFin" :disabled="indefinidamente"
                      class="text-[11px] px-2 py-1 border rounded outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      :class="isDark
                        ? 'bg-[#161B26] border-[#222938] text-[#E2E8F0] focus:border-[#3B82F6]'
                        : 'bg-white border-[#d1d5db] text-[#111] focus:border-[#3B82F6]'" />
                    <span v-if="!indefinidamente && advertenciaFechaFin"
                      class="text-[10px] font-medium px-2 py-0.5 rounded"
                      :class="isDark ? 'bg-yellow-900/40 text-yellow-400' : 'bg-yellow-50 text-yellow-700'">
                      <i class="fas fa-exclamation-triangle text-[9px] mr-1"></i>{{ advertenciaFechaFin }}
                    </span>
                  </div>

                  <!-- Indefinidamente -->
                  <label class="flex items-center gap-2 cursor-pointer w-fit">
                    <input type="checkbox" v-model="indefinidamente"
                      class="w-3.5 h-3.5 accent-[#3B82F6] cursor-pointer" />
                    <span class="text-[11px]"
                      :class="isDark ? 'text-[#7a8aa0]' : 'text-[#374151]'">Sin fecha de vencimiento (indefinidamente)</span>
                  </label>
                </div>

                <!-- Nota tipo de asignación -->
                <div class="text-[10px] leading-relaxed mt-1 px-2 py-1.5 rounded"
                  :class="indefinidamente || !fechaFin
                    ? (isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-700')
                    : (isDark ? 'bg-orange-900/20 text-orange-400' : 'bg-orange-50 text-orange-700')">
                  <i class="fas mr-1 text-[9px]"
                    :class="indefinidamente || !fechaFin ? 'fa-infinity' : 'fa-clock'"></i>
                  <template v-if="indefinidamente || !fechaFin">
                    Asignación permanente — reemplaza la malla actual del empleado
                  </template>
                  <template v-else>
                    Asignación temporal — la malla actual del empleado se mantiene fuera del rango seleccionado
                  </template>
                </div>
              </div>

              <!-- Drop zone -->
              <div @dragover.prevent="isDragging = true" @dragleave.self="isDragging = false"
                @drop.prevent="onDrop" @click="triggerPicker"
                class="border border-dashed cursor-pointer transition-colors py-12 flex flex-col items-center gap-3 rounded"
                :class="isDragging
                  ? (isDark ? 'border-[#3B82F6] bg-[#3B82F6]/5' : 'border-[#3B82F6] bg-[#EFF6FF]')
                  : (isDark ? 'border-[#222938] hover:border-[#3B82F6]/40' : 'border-[#d1d5db] hover:border-[#9ca3af]')">

                <i class="fas fa-cloud-arrow-up text-2xl"
                  :class="isDragging ? 'text-[#3B82F6]' : (isDark ? 'text-[#3B82F6]/40' : 'text-[#9ca3af]')"></i>

                <div class="text-center">
                  <p class="text-[13px] font-medium"
                    :class="isDark ? 'text-[#D8DAE3]' : 'text-[#374151]'">
                    Arrastre un archivo o
                    <span class="text-[#3B82F6] cursor-pointer">selecciónelo</span>
                  </p>
                  <p class="text-[11px] mt-1"
                    :class="isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]'">
                    Formatos aceptados: .xlsx, .xls
                  </p>
                </div>
              </div>
              <input ref="fileInput" type="file" class="hidden" accept=".xlsx,.xls" @change="onFileSelected" />

              <!-- Nota -->
              <p class="text-[11px] leading-relaxed"
                :class="isDark ? 'text-[#4a5568]' : 'text-[#6b7280]'">
                El archivo debe incluir las columnas <strong>Empleado</strong>,
                <strong>Horario de trabajo</strong> y opcionalmente <strong>Fecha de inicio</strong>.
                Use el botón <em>Plantilla</em> para descargar el formato correcto.
              </p>
            </div>

            <!-- ── UPLOADING / DONE ── -->
            <div v-else class="flex flex-col">

              <!-- Tabla de archivos -->
              <div class="px-6 pt-5 pb-4">
                <p class="text-[11px] font-semibold mb-2"
                  :class="isDark ? 'text-[#888]' : 'text-[#6b7280]'">
                  Archivos (1)
                </p>

                <!-- Fila del archivo -->
                <div class="border rounded"
                  :class="isDark ? 'border-[#222938]' : 'border-[#e5e7eb]'">

                  <div class="flex items-center gap-3 px-4 py-3"
                    :class="isDark ? 'bg-[#0B0F19]' : ''">
                    <i class="fas fa-file-excel text-[14px] shrink-0"
                      :class="uploadState === 'error' ? 'text-red-500' : 'text-[#16a34a]'"></i>

                    <div class="flex-1 min-w-0">
                      <p class="text-[12px] font-medium truncate"
                        :class="isDark ? 'text-[#E2E8F0]' : 'text-[#111]'">
                        {{ fileName }}
                      </p>
                      <p class="text-[10px] mt-0.5 font-mono"
                        :class="isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]'">
                        {{ fileSize }}
                      </p>
                    </div>

                    <!-- Estado -->
                    <div class="text-[11px] font-medium shrink-0 flex items-center gap-1.5">
                      <template v-if="uploadState === 'uploading'">
                        <i class="fas fa-spinner fa-spin text-[#4a9eff] text-[10px]"></i>
                        <span :class="isDark ? 'text-[#4a9eff]' : 'text-[#2563eb]'">Subiendo…</span>
                      </template>
                      <template v-else-if="uploadState === 'done'">
                        <i class="fas fa-check text-[#16a34a] text-[10px]"></i>
                        <span :class="isDark ? 'text-[#4ade80]' : 'text-[#16a34a]'">Carga exitosa</span>
                      </template>
                      <template v-else-if="uploadState === 'error'">
                        <i class="fas fa-times text-red-500 text-[10px]"></i>
                        <span class="text-red-500">Error</span>
                      </template>
                    </div>
                  </div>

                  <!-- Barra de progreso -->
                  <div class="h-[2px] w-full"
                    :class="isDark ? 'bg-[#222938]' : 'bg-[#f3f4f6]'">
                    <div class="h-full transition-all duration-300"
                      :class="uploadState === 'done'
                        ? 'bg-[#16a34a]'
                        : uploadState === 'error'
                          ? 'bg-red-500'
                          : 'bg-[#4a9eff]'"
                      :style="{ width: progress + '%' }"></div>
                  </div>
                </div>
              </div>

              <!-- Separador -->
              <div class="border-t mx-6"
                :class="isDark ? 'border-[#222938]' : 'border-[#f3f4f6]'"></div>

              <!-- RESULTADOS -->
              <template v-if="uploadState === 'done' || uploadState === 'error'">

                <!-- Resumen de estado -->
                <div class="px-6 py-3 flex items-center gap-6 border-b"
                  :class="isDark ? 'border-[#222938] bg-[#0B0F19]' : 'border-[#e5e7eb] bg-[#f9fafb]'">
                  <div class="flex items-center gap-2">
                    <i class="fas fa-check-circle text-[12px]"
                      :class="procesados.length ? 'text-[#16a34a]' : (isDark ? 'text-[#2A344A]' : 'text-[#d1d5db]')"></i>
                    <span class="text-[12px] font-semibold tabular-nums"
                      :class="procesados.length ? (isDark ? 'text-[#4ade80]' : 'text-[#16a34a]') : (isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]')">
                      {{ procesados.length }}
                    </span>
                    <span class="text-[11px]"
                      :class="isDark ? 'text-[#4a5568]' : 'text-[#6b7280]'">
                      {{ procesados.length === 1 ? 'asignada' : 'asignadas' }}
                    </span>
                  </div>

                  <div class="flex items-center gap-2">
                    <i class="fas fa-times-circle text-[12px]"
                      :class="errors.length ? 'text-red-500' : (isDark ? 'text-[#2A344A]' : 'text-[#d1d5db]')"></i>
                    <span class="text-[12px] font-semibold tabular-nums"
                      :class="errors.length ? 'text-red-500' : (isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]')">
                      {{ errors.length }}
                    </span>
                    <span class="text-[11px]"
                      :class="isDark ? 'text-[#4a5568]' : 'text-[#6b7280]'">
                      {{ errors.length === 1 ? 'error' : 'errores' }}
                    </span>
                  </div>

                  <button @click="resetForAnother"
                    class="ml-auto text-[11px] transition-all px-2.5 py-1 border rounded"
                    :class="isDark
                      ? 'border-[#222938] text-[#7a8aa0] hover:bg-white/5 hover:text-white'
                      : 'border-[#d1d5db] text-[#374151] hover:bg-white'">
                    <i class="fas fa-plus text-[9px] mr-1"></i>
                    Otro archivo
                  </button>
                </div>

                <!-- Tabs -->
                <div class="flex border-b px-6 gap-1"
                  :class="isDark ? 'border-[#222938]' : 'border-[#e5e7eb]'">
                  <button @click="activeTab = 'success'"
                    class="py-2.5 px-1 mr-4 text-[11px] font-medium border-b-2 -mb-px transition-colors"
                    :class="activeTab === 'success'
                      ? (isDark ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-[#111] text-[#111]')
                      : (isDark ? 'border-transparent text-[#4a5568] hover:text-[#D8DAE3]' : 'border-transparent text-[#6b7280] hover:text-[#374151]')">
                    Exitosos ({{ procesados.length }})
                  </button>
                  <button @click="activeTab = 'errors'"
                    class="py-2.5 px-1 text-[11px] font-medium border-b-2 -mb-px transition-colors"
                    :class="activeTab === 'errors'
                      ? (isDark ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-[#111] text-[#111]')
                      : (isDark ? 'border-transparent text-[#4a5568] hover:text-[#D8DAE3]' : 'border-transparent text-[#6b7280] hover:text-[#374151]')">
                    Errores ({{ errors.length }})
                  </button>
                </div>

                <!-- Tab Exitosos -->
                <div v-if="activeTab === 'success'">
                  <div v-if="!procesados.length"
                    class="py-10 text-center text-[11px]"
                    :class="isDark ? 'text-[#555]' : 'text-[#9ca3af]'">
                    Sin registros asignados
                  </div>
                  <div v-else>
                    <!-- Encabezado -->
                    <div class="grid grid-cols-[48px_130px_1fr_150px_96px] px-6 py-2 border-b"
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
                    <div class="max-h-[260px] overflow-y-auto custom-scrollbar">
                      <div v-for="(p, i) in procesados" :key="i"
                        class="grid grid-cols-[48px_130px_1fr_150px_96px] items-center px-6 py-2.5 border-b"
                        :class="isDark ? 'border-[#1e2538] hover:bg-white/[0.03]' : 'border-[#f3f4f6] hover:bg-[#f9fafb]'">
                        <span class="text-[10px] font-mono flex items-center gap-1.5"
                          :class="isDark ? 'text-[#4ade80]' : 'text-[#16a34a]'">
                          <i class="fas fa-check text-[8px]"></i>{{ p.fila }}
                        </span>
                        <span class="text-[10px] font-mono truncate pr-2"
                          :class="isDark ? 'text-[#7a8aa0]' : 'text-[#6b7280]'">{{ p.cedula }}</span>
                        <span class="text-[11px] font-medium truncate pr-2 uppercase"
                          :class="isDark ? 'text-[#E2E8F0]' : 'text-[#111]'">{{ p.nombre }}</span>
                        <span class="text-[10px] truncate pr-2 italic"
                          style="color:#b45309">{{ p.malla }}</span>
                        <span class="text-[10px] font-mono text-right"
                          :class="isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]'">{{ p.fecha }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Tab Errores -->
                <div v-if="activeTab === 'errors'">
                  <div v-if="!errors.length"
                    class="py-10 text-center text-[11px]"
                    :class="isDark ? 'text-[#555]' : 'text-[#9ca3af]'">
                    Sin errores
                  </div>
                  <div v-else class="max-h-[280px] overflow-y-auto custom-scrollbar">
                    <div v-for="(err, i) in errors" :key="i"
                      class="flex items-start gap-3 px-6 py-3 border-b"
                      :class="isDark ? 'border-[#1e2538] hover:bg-white/[0.02]' : 'border-[#f3f4f6] hover:bg-[#fff5f5]'">
                      <div class="flex items-center gap-1.5 shrink-0 mt-0.5">
                        <i class="fas fa-times-circle text-[10px] text-red-500"></i>
                        <span class="text-[10px] font-mono"
                          :class="isDark ? 'text-[#7a8aa0]' : 'text-[#6b7280]'">F{{ err.fila }}</span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <span v-if="err.cedula"
                          class="text-[10px] font-mono mr-2"
                          :class="isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]'">{{ err.cedula }}</span>
                        <span class="text-[11px]"
                          :class="isDark ? 'text-[#D8DAE3]' : 'text-[#374151]'">{{ err.error }}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </template>

              <!-- Estado vacío mientras sube -->
              <div v-if="uploadState === 'uploading'"
                class="py-8 flex items-center justify-center gap-2">
                <i class="fas fa-spinner fa-spin text-[11px]"
                  :class="isDark ? 'text-[#555]' : 'text-[#9ca3af]'"></i>
                <span class="text-[11px]"
                  :class="isDark ? 'text-[#555]' : 'text-[#9ca3af]'">
                  Procesando registros…
                </span>
              </div>
            </div>
          </div>

          <!-- FOOTER -->
          <div class="px-6 py-3 border-t flex items-center justify-between"
            :class="isDark ? 'border-[#222938] bg-[#0B0F19]' : 'border-[#e5e7eb] bg-[#f9fafb]'">

            <button
              v-if="(uploadState === 'done' || uploadState === 'error') && (procesados.length || errors.length)"
              @click="descargarReporte"
              class="text-[11px] transition-all px-3 py-1.5 border rounded flex items-center gap-1.5"
              :class="isDark
                ? 'border-[#222938] text-[#7a8aa0] hover:bg-white/5 hover:text-white'
                : 'border-[#d1d5db] text-[#374151] hover:bg-white'">
              <i class="fas fa-download text-[9px]"></i>
              Descargar reporte
            </button>
            <div v-else></div>

            <div class="flex items-center gap-2">
              <button v-if="uploadState !== 'uploading'" @click="tryClose"
                class="text-[11px] font-semibold transition-all px-4 py-1.5 rounded"
                :class="uploadState === 'done'
                  ? 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
                  : (isDark ? 'border border-[#222938] text-[#7a8aa0] hover:bg-white/5 hover:text-white' : 'border border-[#d1d5db] text-[#374151] hover:bg-white')">
                {{ uploadState === 'done' ? 'Cerrar' : 'Cancelar' }}
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

const props = defineProps({
  modelValue: Boolean,
  isDark: Boolean,
})
const emit = defineEmits(['update:modelValue', 'uploaded'])

const API_BASE_URL = import.meta.env.VITE_API_URL

const uploadState = ref('idle')
const isDragging = ref(false)
const fileInput = ref(null)
const fileName = ref('')
const fileSize = ref('')
const progress = ref(0)
const procesados = ref([])
const errors = ref([])
const activeTab = ref('success')

// ── Fechas de vigencia ────────────────────────────────────────────────────
const hoyBogota = () =>
  new Date().toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).slice(0, 10)

const fechaInicio = ref(hoyBogota())
const fechaFin = ref('')
const indefinidamente = ref(true)

watch(indefinidamente, (val) => { if (val) fechaFin.value = '' })

// Festivos colombianos de ley (fijos + variables calculados)
const FESTIVOS_FIJOS = ['01-01', '05-01', '07-20', '08-07', '12-08', '12-25']

function pascua(anio) {
  const a = anio % 19, b = Math.floor(anio / 100), c = anio % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(anio, mes - 1, dia)
}

function siguienteLunes(fecha) {
  const d = new Date(fecha)
  const dow = d.getDay()
  if (dow !== 1) d.setDate(d.getDate() + ((8 - dow) % 7 || 7))
  return d
}

function addDias(fecha, n) {
  const d = new Date(fecha); d.setDate(d.getDate() + n); return d
}

function toISO(d) {
  return d.toISOString().slice(0, 10)
}

function festivosDelAnio(anio) {
  const p = pascua(anio)
  const fijos = FESTIVOS_FIJOS.map((f) => `${anio}-${f}`)
  const moviles = [
    addDias(p, -3),   // Jueves Santo
    addDias(p, -2),   // Viernes Santo
    addDias(p, 60),   // Corpus Christi → lunes siguiente
    addDias(p, 68),   // Sagrado Corazón → lunes siguiente
    siguienteLunes(new Date(anio, 0, 6)),   // Reyes Magos
    siguienteLunes(new Date(anio, 2, 19)),  // San José
    siguienteLunes(new Date(anio, 5, 29)),  // San Pedro y San Pablo
    siguienteLunes(new Date(anio, 7, 15)),  // Asunción de la Virgen
    siguienteLunes(new Date(anio, 9, 12)),  // Día de la Raza
    siguienteLunes(new Date(anio, 10, 1)),  // Todos los Santos
    siguienteLunes(new Date(anio, 10, 11)), // Independencia de Cartagena
  ].map(toISO)
  // Corpus Christi y Sagrado Corazón también van al lunes siguiente
  const corpusSagrado = [addDias(p, 60), addDias(p, 68)].map((d) => toISO(siguienteLunes(d)))
  return new Set([...fijos, ...moviles, ...corpusSagrado])
}

function advertenciaFecha(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha + 'T12:00:00')
  const dow = d.getDay()
  const anio = d.getFullYear()
  const festivos = festivosDelAnio(anio)
  if (festivos.has(fecha)) return 'Festivo'
  if (dow === 0) return 'Domingo'
  if (dow === 6) return 'Sábado'
  return ''
}

const advertenciaFechaInicio = computed(() => advertenciaFecha(fechaInicio.value))
const advertenciaFechaFin = computed(() => advertenciaFecha(fechaFin.value))

let progressTimer = null

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const startProgress = () => {
  progress.value = 0
  progressTimer = setInterval(() => {
    if (progress.value < 82) {
      progress.value = Math.min(82, progress.value + Math.random() * 7 + 2)
    }
  }, 180)
}

const finishProgress = (success = true) => {
  clearInterval(progressTimer)
  progressTimer = null
  progress.value = 100
  uploadState.value = success ? 'done' : 'error'
}

const triggerPicker = () => fileInput.value?.click()

const onDrop = (e) => {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

const onFileSelected = (e) => {
  const file = e.target?.files?.[0]
  if (file) processFile(file)
  if (e.target) e.target.value = ''
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

const processFile = async (file) => {
  fileName.value = file.name
  fileSize.value = formatSize(file.size)
  procesados.value = []
  errors.value = []
  activeTab.value = 'success'
  uploadState.value = 'uploading'
  startProgress()
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
    finishProgress(true)
    emit('uploaded')
  } catch (err) {
    errors.value = [{
      fila: '!',
      cedula: '',
      error: err.response?.data?.message || err.message || 'Error de conexión',
    }]
    activeTab.value = 'errors'
    finishProgress(false)
  }
}

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

const tryClose = () => {
  if (uploadState.value === 'uploading') return
  clearInterval(progressTimer)
  progressTimer = null
  uploadState.value = 'idle'
  procesados.value = []
  errors.value = []
  progress.value = 0
  fechaInicio.value = hoyBogota()
  fechaFin.value = ''
  indefinidamente.value = true
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
