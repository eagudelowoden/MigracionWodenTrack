<template>
  <div class="flex flex-col">

    <!-- Tabla de archivos -->
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
            :class="uploadState === 'error' ? 'text-red-500' : 'text-[#16a34a]'"></i>
          <div class="flex-1 min-w-0">
            <p class="text-[12px] font-medium truncate"
              :class="isDark ? 'text-[#E2E8F0]' : 'text-[#111]'">{{ fileName }}</p>
            <p class="text-[10px] mt-0.5 font-mono"
              :class="isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]'">{{ fileSize }}</p>
          </div>
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
        <div class="h-[2px] w-full" :class="isDark ? 'bg-[#222938]' : 'bg-[#f3f4f6]'">
          <div class="h-full transition-all duration-300"
            :class="uploadState === 'done' ? 'bg-[#16a34a]' : uploadState === 'error' ? 'bg-red-500' : 'bg-[#4a9eff]'"
            :style="{ width: progress + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="border-t mx-6" :class="isDark ? 'border-[#222938]' : 'border-[#f3f4f6]'"></div>

    <!-- RESULTADOS -->
    <template v-if="uploadState === 'done' || uploadState === 'error'">

      <div class="px-6 py-3 flex items-center gap-6 border-b"
        :class="isDark ? 'border-[#222938] bg-[#0B0F19]' : 'border-[#e5e7eb] bg-[#f9fafb]'">
        <div class="flex items-center gap-2">
          <i class="fas fa-check-circle text-[12px]"
            :class="procesados.length ? 'text-[#16a34a]' : (isDark ? 'text-[#2A344A]' : 'text-[#d1d5db]')"></i>
          <span class="text-[12px] font-semibold tabular-nums"
            :class="procesados.length ? (isDark ? 'text-[#4ade80]' : 'text-[#16a34a]') : (isDark ? 'text-[#4a5568]' : 'text-[#9ca3af]')">
            {{ procesados.length }}
          </span>
          <span class="text-[11px]" :class="isDark ? 'text-[#4a5568]' : 'text-[#6b7280]'">
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
          <span class="text-[11px]" :class="isDark ? 'text-[#4a5568]' : 'text-[#6b7280]'">
            {{ errors.length === 1 ? 'error' : 'errores' }}
          </span>
        </div>
        <button @click="$emit('resetForAnother')"
          class="ml-auto text-[11px] transition-all px-2.5 py-1 border rounded"
          :class="isDark
            ? 'border-[#222938] text-[#7a8aa0] hover:bg-white/5 hover:text-white'
            : 'border-[#d1d5db] text-[#374151] hover:bg-white'">
          <i class="fas fa-plus text-[9px] mr-1"></i>Otro archivo
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b px-6 gap-1"
        :class="isDark ? 'border-[#222938]' : 'border-[#e5e7eb]'">
        <button @click="$emit('update:activeTab', 'success')"
          class="py-2.5 px-1 mr-4 text-[11px] font-medium border-b-2 -mb-px transition-colors"
          :class="activeTab === 'success'
            ? (isDark ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-[#111] text-[#111]')
            : (isDark ? 'border-transparent text-[#4a5568] hover:text-[#D8DAE3]' : 'border-transparent text-[#6b7280] hover:text-[#374151]')">
          Exitosos ({{ procesados.length }})
        </button>
        <button @click="$emit('update:activeTab', 'errors')"
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
              <span class="text-[10px] truncate pr-2 italic" style="color:#b45309">{{ p.malla }}</span>
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
</template>

<script setup>
defineProps({
  isDark: Boolean,
  uploadState: String,
  fileName: String,
  fileSize: String,
  progress: Number,
  procesados: Array,
  errors: Array,
  activeTab: String,
})

defineEmits(['update:activeTab', 'resetForAnother', 'descargarReporte'])
</script>
