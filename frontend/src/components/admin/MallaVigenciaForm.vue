<template>
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
        <input type="date" :value="fechaInicio" @input="$emit('update:fechaInicio', $event.target.value)"
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
        <input type="date" :value="fechaFin" :disabled="indefinidamente"
          @input="$emit('update:fechaFin', $event.target.value)"
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
        <input type="checkbox" :checked="indefinidamente"
          @change="$emit('update:indefinidamente', $event.target.checked)"
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
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isDark: Boolean,
  fechaInicio: String,
  fechaFin: String,
  indefinidamente: Boolean,
})

defineEmits(['update:fechaInicio', 'update:fechaFin', 'update:indefinidamente'])

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

function toISO(d) { return d.toISOString().slice(0, 10) }

function festivosDelAnio(anio) {
  const p = pascua(anio)
  const fijos = FESTIVOS_FIJOS.map((f) => `${anio}-${f}`)
  const moviles = [
    addDias(p, -3), addDias(p, -2), addDias(p, 60), addDias(p, 68),
    siguienteLunes(new Date(anio, 0, 6)),
    siguienteLunes(new Date(anio, 2, 19)),
    siguienteLunes(new Date(anio, 5, 29)),
    siguienteLunes(new Date(anio, 7, 15)),
    siguienteLunes(new Date(anio, 9, 12)),
    siguienteLunes(new Date(anio, 10, 1)),
    siguienteLunes(new Date(anio, 10, 11)),
  ].map(toISO)
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

const advertenciaFechaInicio = computed(() => advertenciaFecha(props.fechaInicio))
const advertenciaFechaFin = computed(() => advertenciaFecha(props.fechaFin))
</script>
