<template>
  <div class="border border-dashed cursor-pointer transition-colors py-12 flex flex-col items-center gap-3 rounded"
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
</template>

<script setup>
defineProps({
  isDark: Boolean,
  isDragging: Boolean,
})
</script>
