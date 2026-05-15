<template>
  <div class="w-full h-full animate-fade-in transition-colors duration-500 flex flex-col gap-1.5">

    <!-- Header -->
    <div class="flex items-center gap-2 px-3 py-2 rounded-xl border shrink-0"
      :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

      <!-- Título -->
      <div class="flex items-center gap-2 shrink-0">
        <div class="w-6 h-6 flex items-center justify-center rounded-lg bg-[#3B82F6] text-white shrink-0">
          <i class="fas fa-file-signature text-[10px]"></i>
        </div>
        <div>
          <h2 class="text-sm font-black uppercase tracking-tight leading-none" :class="isDark ? 'text-white' : 'text-slate-800'">
            {{ activeTab === 'registro' ? 'Registro' : 'Mi Historial' }}
            <span class="text-[#3B82F6]">{{ activeTab === 'registro' ? 'Novedad' : 'Novedades' }}</span>
          </h2>
          <p class="text-[8px] font-semibold opacity-40 uppercase tracking-[0.15em] mt-0.5"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            {{ company || 'Woden Track' }}
          </p>
        </div>
      </div>

      <!-- Filtros inline (solo historial) -->
      <template v-if="activeTab === 'historial'">
        <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border flex-1 min-w-0 transition-all focus-within:ring-1 focus-within:ring-[#3B82F6]/30"
          :class="isDark ? 'bg-[#273045] border-[#2d3548]' : 'bg-slate-50 border-slate-200'">
          <i class="fas fa-magnifying-glass text-[#3B82F6] text-[9px] shrink-0"></i>
          <input v-model="filtros.buscar" type="text" placeholder="Buscar descripción o tipificación..."
            class="bg-transparent flex-1 outline-none font-medium text-[11px] placeholder:text-slate-400 min-w-0"
            :class="isDark ? 'text-white' : 'text-slate-800'" />
          <button v-if="filtros.buscar" @click="filtros.buscar = ''" class="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
            <i class="fas fa-xmark text-[9px]"></i>
          </button>
        </div>
        <input v-model="filtros.fechaDesde" type="date"
          class="px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold outline-none transition-all shrink-0"
          :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white [color-scheme:dark]' : 'bg-slate-50 border-slate-200 text-slate-800'" />
        <span class="text-[9px] opacity-30 shrink-0" :class="isDark ? 'text-slate-400' : 'text-slate-500'">—</span>
        <input v-model="filtros.fechaHasta" type="date"
          class="px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold outline-none transition-all shrink-0"
          :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white [color-scheme:dark]' : 'bg-slate-50 border-slate-200 text-slate-800'" />
        <button @click="aplicarFiltros"
          class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#3B82F6] text-white text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shrink-0">
          <i class="fas fa-filter text-[8px]"></i> Filtrar
        </button>
        <button @click="limpiarFiltros"
          class="flex items-center justify-center w-7 h-7 rounded-lg border hover:brightness-110 active:scale-95 transition-all shrink-0"
          :class="isDark ? 'border-[#2d3548] text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'">
          <i class="fas fa-rotate-left text-[9px]"></i>
        </button>
      </template>

      <div class="flex items-center gap-1.5 ml-auto shrink-0">
        <!-- Indicador almacenamiento -->
        <div v-if="activeTab === 'registro'"
          class="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold"
          :class="storageMode === 's3'
            ? 'bg-[#3B82F6]/10 text-[#3B82F6]'
            : 'bg-emerald-500/10 text-emerald-500'">
          <i :class="storageMode === 's3' ? 'fab fa-aws text-[10px]' : 'fas fa-hard-drive text-[10px]'"></i>
          {{ storageMode === 's3' ? 'S3' : 'Local' }}
        </div>

        <!-- Tabs -->
        <div class="flex items-center rounded-lg border overflow-hidden"
          :class="isDark ? 'border-[#2d3548]' : 'border-slate-200'">
          <button @click="activeTab = 'registro'"
            class="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all" :class="activeTab === 'registro'
              ? 'bg-[#3B82F6] text-white'
              : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')">
            <i class="fas fa-plus mr-1"></i>Registrar
          </button>
          <button @click="onOpenHistorial"
            class="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all" :class="activeTab === 'historial'
              ? 'bg-[#3B82F6] text-white'
              : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')">
            <i class="fas fa-clock-rotate-left mr-1"></i>Historial
          </button>
        </div>
      </div>
    </div>

    <!-- TAB: REGISTRO -->
    <div v-if="activeTab === 'registro'" class="flex-1 flex gap-1.5 overflow-hidden min-h-0">

      <!-- Formulario -->
      <div class="flex flex-col overflow-hidden rounded-xl border transition-all duration-300" :class="[
        viewerOpen ? 'w-1/2' : 'w-full',
        isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'
      ]">
        <form @submit.prevent="handleSubmit" class="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">

          <div class="grid grid-cols-1 gap-3">

            <!-- Nombre -->
            <div class="flex flex-col gap-1">
              <label class="text-[9px] font-black uppercase tracking-widest ml-0.5"
                :class="isDark ? 'text-slate-400' : 'text-[#3B82F6]'">Nombre</label>
              <div class="flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs"
                :class="isDark ? 'bg-[#273045] border-[#2d3548]' : 'bg-slate-50 border-slate-200'">
                <i class="fas fa-user-circle opacity-40 text-xs" :class="isDark ? 'text-slate-400' : 'text-slate-500'"></i>
                <input type="text" v-model="form.nombre" readonly
                  class="bg-transparent w-full font-semibold outline-none cursor-not-allowed text-xs"
                  :class="isDark ? 'text-slate-200' : 'text-slate-700'" />
              </div>
            </div>

            <!-- Jefe de área -->
            <div v-if="jefe" class="flex items-center gap-2.5 px-3 py-2 rounded-lg border"
              :class="isDark ? 'bg-[#273045] border-[#2d3548]' : 'bg-slate-50 border-slate-200'">
              <div class="w-6 h-6 rounded-md bg-[#3B82F6]/15 flex items-center justify-center text-[9px] font-black text-[#3B82F6] shrink-0">
                {{ jefe.name?.charAt(0) ?? '?' }}
              </div>
              <div class="flex flex-col flex-1 min-w-0">
                <span class="text-[8px] font-bold uppercase tracking-widest opacity-40"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Jefe directo</span>
                <span class="text-[11px] font-bold uppercase truncate" :class="isDark ? 'text-white' : 'text-slate-800'">{{ jefe.name }}</span>
                <span class="text-[9px] opacity-40 truncate" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ jefe.job || '' }}</span>
              </div>
              <span class="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase bg-[#3B82F6]/10 text-[#3B82F6]">
                <i class="fas fa-user-tie text-[8px]"></i>Responsable
              </span>
            </div>

            <!-- Fila: Cédula + Fecha Inicio + Fecha Fin -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">

              <!-- Cédula -->
              <div class="flex flex-col gap-1">
                <label class="text-[9px] font-black uppercase tracking-widest ml-0.5"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cédula</label>
                <div class="flex items-center gap-2 px-3 py-2 rounded-lg border focus-within:ring-1 focus-within:ring-[#3B82F6]/30 transition-all"
                  :class="isDark ? 'bg-[#273045] border-[#2d3548]' : 'bg-white border-slate-200'">
                  <i class="fas fa-id-card text-[#3B82F6]/60 text-xs"></i>
                  <input type="number" v-model="form.cedula" placeholder="N° identificación..." required
                    class="bg-transparent w-full font-semibold outline-none placeholder:text-slate-500 text-xs"
                    :class="isDark ? 'text-white' : 'text-slate-800'" />
                </div>
              </div>

              <!-- Fecha Inicio -->
              <div class="flex flex-col gap-1">
                <label class="text-[9px] font-black uppercase tracking-widest ml-0.5"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Fecha Inicio</label>
                <input type="date" v-model="form.fechaInicio" required
                  class="px-3 py-2 rounded-lg border text-xs font-semibold outline-none transition-all"
                  :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white [color-scheme:dark]' : 'bg-white border-slate-200 text-slate-800'" />
              </div>

              <!-- Fecha Fin -->
              <div class="flex flex-col gap-1">
                <label class="text-[9px] font-black uppercase tracking-widest ml-0.5"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Fecha Fin</label>
                <input type="date" v-model="form.fechaFin" required
                  class="px-3 py-2 rounded-lg border text-xs font-semibold outline-none transition-all"
                  :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white [color-scheme:dark]' : 'bg-white border-slate-200 text-slate-800'" />
              </div>
            </div>

            <!-- Descripción -->
            <div class="flex flex-col gap-1">
              <label class="text-[9px] font-black uppercase tracking-widest ml-0.5"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">Descripción</label>
              <textarea v-model="form.descripcion" rows="3" placeholder="Explique el motivo..." required
                class="px-3 py-2.5 rounded-lg border text-xs font-medium outline-none resize-none transition-all placeholder:text-slate-500"
                :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white' : 'bg-white border-slate-200 text-slate-800'">
              </textarea>
            </div>

            <!-- Archivos adjuntos (múltiples) -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[9px] font-black uppercase tracking-widest ml-0.5"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                Archivos de Soporte
                <span class="ml-1 opacity-35 normal-case font-medium text-[8px]">Solo PDF e imágenes — máx 10 archivos, 20 MB c/u</span>
              </label>

              <!-- Zona de drop -->
              <div @dragover.prevent="dragOver = true" @dragleave="dragOver = false" @drop.prevent="onDrop"
                class="flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed transition-all cursor-pointer"
                :class="[
                  dragOver ? 'border-[#3B82F6] bg-[#3B82F6]/5' : (isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-200 bg-slate-50'),
                ]"
                @click="$refs.fileInput.click()">
                <i class="fas fa-cloud-arrow-up text-[#3B82F6] text-sm shrink-0"></i>
                <span class="flex-1 text-[10px] font-medium" :class="isDark ? 'text-slate-400' : 'text-slate-400'">
                  {{ archivosSeleccionados.length ? `${archivosSeleccionados.length} archivo(s) seleccionado(s)` : 'Arrastra o haz clic para seleccionar...' }}
                </span>
                <input ref="fileInput" type="file" multiple @change="onFilesChange" class="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" />
                <span class="shrink-0 px-3 py-1 rounded-md bg-[#3B82F6] text-white text-[9px] font-black uppercase">
                  Elegir
                </span>
              </div>

              <!-- Lista de archivos seleccionados -->
              <div v-if="archivosSeleccionados.length" class="flex flex-col gap-1 max-h-[136px] overflow-y-auto pr-0.5">
                <div v-for="(file, idx) in archivosSeleccionados" :key="idx"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                  :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-100 bg-white'">
                  <i :class="['text-sm shrink-0', getFileIcon(file)]"></i>
                  <span class="flex-1 text-[10px] font-medium truncate" :class="isDark ? 'text-slate-200' : 'text-slate-700'">
                    {{ file.name }}
                  </span>
                  <span class="text-[9px] opacity-40 shrink-0" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                    {{ formatSize(file.size) }}
                  </span>
                  <button @click.prevent="quitarArchivo(idx)" type="button"
                    class="shrink-0 w-5 h-5 flex items-center justify-center rounded-md text-rose-400 hover:bg-rose-500/10 transition-all">
                    <i class="fas fa-xmark text-[9px]"></i>
                  </button>
                </div>
              </div>

              <!-- Error de tipo -->
              <p v-if="archivoError" class="text-[9px] text-rose-400 font-semibold flex items-center gap-1">
                <i class="fas fa-circle-exclamation"></i> {{ archivoError }}
              </p>
            </div>

          </div>

          <!-- Mensaje estado -->
          <transition name="fade-msg">
            <div v-if="submitStatus" class="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-semibold border"
              :class="submitStatus === 'ok'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'">
              <i :class="submitStatus === 'ok' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
              {{ submitMessage }}
            </div>
          </transition>

          <!-- Footer form -->
          <div class="flex items-center justify-between pt-3 mt-auto border-t"
            :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
            <button @click.prevent="resetForm" type="button"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 border"
              :class="isDark
                ? 'text-slate-500 border-[#2d3548] hover:text-slate-300 hover:border-slate-500'
                : 'text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300'">
              <i class="fas fa-rotate-left text-[9px]"></i> Limpiar
            </button>
            <button type="submit" :disabled="loading"
              class="group flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-black uppercase tracking-widest text-[9px] transition-all active:scale-95 shadow-sm disabled:opacity-60 disabled:cursor-wait"
              :class="isDark ? 'bg-[#3B82F6] text-white hover:brightness-110' : 'bg-slate-900 text-white hover:bg-slate-700'">
              <i v-if="loading" class="fas fa-circle-notch fa-spin text-[9px]"></i>
              <i v-else class="fas fa-check-circle text-[9px] group-hover:scale-110 transition-transform"></i>
              {{ loading ? 'Guardando...' : 'Guardar Novedad' }}
            </button>
          </div>

        </form>
      </div>

      <!-- Panel visor -->
      <transition name="slide-panel">
        <div v-if="viewerOpen && previewUrl" class="flex flex-col w-1/2 rounded-xl border overflow-hidden"
          :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

          <div class="flex items-center justify-between px-3 py-2 border-b shrink-0"
            :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
            <div class="flex items-center gap-2 min-w-0">
              <i class="fas fa-eye text-[#3B82F6] text-[10px]"></i>
              <span class="text-[10px] font-black uppercase tracking-widest"
                :class="isDark ? 'text-white' : 'text-slate-700'">Vista Previa</span>
              <span class="text-[9px] font-medium truncate max-w-[120px] opacity-40"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ fileName }}</span>
            </div>
            <div class="flex items-center gap-1">
              <a :href="previewUrl" :download="fileName"
                class="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black uppercase border transition-all hover:brightness-110"
                :class="isDark ? 'bg-[#273045] text-slate-300 border-[#3d4558]' : 'bg-slate-100 text-slate-600 border-slate-200'">
                <i class="fas fa-download text-[#3B82F6] text-[9px]"></i> Descargar
              </a>
              <button @click="viewerOpen = false"
                class="w-6 h-6 rounded-md flex items-center justify-center border transition-all"
                :class="isDark ? 'bg-[#273045] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-500 border-slate-200'">
                <i class="fas fa-xmark text-[9px]"></i>
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-hidden flex items-center justify-center p-2"
            :class="isDark ? 'bg-[#151c2c]' : 'bg-slate-50'">
            <img v-if="isImage" :src="previewUrl" class="max-w-full max-h-full object-contain rounded-lg shadow-xl" />
            <iframe v-else-if="isPdf" :src="previewUrl" class="w-full h-full rounded-lg border-0"
              title="Vista previa PDF" />
            <div v-else class="flex flex-col items-center gap-4 opacity-60">
              <i :class="['text-6xl', fileIcon]"></i>
              <p class="text-xs text-center" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                Vista previa no disponible.<br />
                <span class="opacity-60 text-[10px]">Descarga el archivo para abrirlo.</span>
              </p>
            </div>
          </div>

        </div>
      </transition>

    </div>

    <!-- TAB: HISTORIAL -->
    <div v-else class="flex-1 flex flex-col overflow-hidden min-h-0">

      <!-- Tabla -->
      <div class="flex-1 rounded-xl border overflow-hidden flex flex-col min-h-0"
        :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

        <!-- Loading -->
        <div v-if="loading" class="flex-1 flex items-center justify-center gap-2 opacity-50">
          <i class="fas fa-circle-notch fa-spin text-[#3B82F6]"></i>
          <span class="text-xs font-bold" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cargando...</span>
        </div>

        <!-- Vacío -->
        <div v-else-if="!misNovedades.length" class="flex-1 flex flex-col items-center justify-center gap-3 opacity-40">
          <i class="fas fa-inbox text-4xl" :class="isDark ? 'text-slate-600' : 'text-slate-300'"></i>
          <p class="text-xs font-bold" :class="isDark ? 'text-slate-500' : 'text-slate-400'">No hay novedades
            registradas</p>
        </div>

        <!-- Tabla con datos -->
        <template v-else>
          <div class="overflow-x-auto overflow-y-auto flex-1">
            <table class="w-full text-[11px]">
              <thead class="sticky top-0 z-10"
                :class="isDark ? 'bg-[#1a2035] border-b border-[#2d3548]' : 'bg-slate-50 border-b border-slate-200'">
                <tr>
                  <th class="px-4 py-2.5 text-left font-black uppercase tracking-widest text-[9px]"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">#</th>
                  <th class="px-4 py-2.5 text-left font-black uppercase tracking-widest text-[9px]"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Descripción</th>
                  <th class="px-4 py-2.5 text-left font-black uppercase tracking-widest text-[9px]"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Tipo</th>
                  <th class="px-4 py-2.5 text-left font-black uppercase tracking-widest text-[9px]"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Inicio</th>
                  <th class="px-4 py-2.5 text-left font-black uppercase tracking-widest text-[9px]"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Fin</th>
                  <th class="px-4 py-2.5 text-center font-black uppercase tracking-widest text-[9px]"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Jefe</th>
                  <th class="px-4 py-2.5 text-center font-black uppercase tracking-widest text-[9px]"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">RRHH</th>
                  <th class="px-4 py-2.5 text-center font-black uppercase tracking-widest text-[9px]"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Estado</th>
                  <th class="px-4 py-2.5 text-center font-black uppercase tracking-widest text-[9px]"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Carpeta CH</th>
                  <th class="px-4 py-2.5 text-center font-black uppercase tracking-widest text-[9px]"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Carpeta Jefe</th>
                  <th class="px-4 py-2.5 text-center font-black uppercase tracking-widest text-[9px]"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Soporte</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(nov, i) in misNovedades" :key="nov.id" class="border-b transition-colors cursor-default"
                  :class="isDark
                    ? 'border-[#2d3548] hover:bg-[#273045]'
                    : 'border-slate-100 hover:bg-slate-50'">

                  <!-- # -->
                  <td class="px-4 py-2.5">
                    <span class="text-[9px] font-black opacity-40"
                      :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                      {{ i + 1 }}
                    </span>
                  </td>

                  <!-- Descripción -->
                  <td class="px-4 py-2.5 max-w-[200px]">
                    <p class="font-medium truncate" :class="isDark ? 'text-slate-200' : 'text-slate-700'"
                      :title="nov.descripcion">
                      {{ nov.descripcion }}
                    </p>
                  </td>

                  <!-- Tipo / Tipificación -->
                  <td class="px-4 py-2.5">
                    <span v-if="nov.tipificacion"
                      class="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border"
                      :class="isDark ? 'bg-[#273045] text-slate-300 border-[#3d4558]' : 'bg-slate-100 text-slate-600 border-slate-200'">
                      {{ nov.tipificacion }}
                    </span>
                    <span v-else class="opacity-30 text-[10px]">—</span>
                  </td>

                  <!-- Fechas -->
                  <td class="px-4 py-2.5 whitespace-nowrap font-bold"
                    :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                    {{ formatFecha(nov.fechaInicio) }}
                  </td>
                  <td class="px-4 py-2.5 whitespace-nowrap font-bold"
                    :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                    {{ formatFecha(nov.fechaFin) }}
                  </td>

                  <!-- Estado Jefe -->
                  <td class="px-4 py-2.5 text-center">
                    <span :class="estadoBadge(nov.aprobadoJefe)"
                      class="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border">
                      <i :class="estadoIcon(nov.aprobadoJefe)" class="mr-0.5"></i>
                      {{ estadoLabel(nov.aprobadoJefe) }}
                    </span>
                  </td>

                  <!-- Estado RRHH -->
                  <td class="px-4 py-2.5 text-center">
                    <span :class="estadoBadge(nov.aprobadoRrhh)"
                      class="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border">
                      <i :class="estadoIcon(nov.aprobadoRrhh)" class="mr-0.5"></i>
                      {{ estadoLabel(nov.aprobadoRrhh) }}
                    </span>
                  </td>

                  <!-- Estado general tipo carpeta -->
                  <td class="px-4 py-2.5 text-center">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border"
                      :class="getEstadoVisual(nov).bg">
                      <i :class="getEstadoVisual(nov).icon" :style="{ color: getEstadoVisual(nov).color }"></i>
                      <span :style="{ color: getEstadoVisual(nov).color }">{{ getEstadoVisual(nov).label }}</span>
                    </span>
                  </td>

                  <!-- Carpeta Capital Humano (solo lectura) -->
                  <td class="px-4 py-2.5 text-center">
                    <span v-if="nov.estadoCh"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border"
                      :class="isDark ? 'bg-[#273045] border-[#3d4558] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'">
                      <i class="fas fa-folder text-[#3B82F6]"></i>
                      {{ nov.estadoCh }}
                    </span>
                    <span v-else class="text-[10px] opacity-30">—</span>
                  </td>

                  <!-- Carpeta Jefe / Coordinador (solo lectura) -->
                  <td class="px-4 py-2.5 text-center">
                    <span v-if="nov.estadoChCoord"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border"
                      :class="isDark ? 'bg-[#273045] border-[#3d4558] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'">
                      <i class="fas fa-folder text-[#3B82F6]"></i>
                      {{ nov.estadoChCoord }}
                    </span>
                    <span v-else class="text-[10px] opacity-30">—</span>
                  </td>

                  <!-- Archivos adjuntos + Eliminar -->
                  <td class="px-4 py-2.5 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                      <!-- Badge con cantidad de archivos -->
                      <div class="relative group">
                        <button type="button"
                          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all hover:brightness-110"
                          :class="(nov.archivos?.length ? 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20' : (isDark ? 'bg-[#273045] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-400 border-slate-200'))">
                          <i class="fas fa-paperclip"></i>
                          {{ nov.archivos?.length ?? 0 }}
                        </button>
                        <!-- Dropdown de archivos al hover -->
                        <div v-if="nov.archivos?.length"
                          class="absolute right-0 top-full mt-1 z-50 min-w-[200px] rounded-xl border shadow-xl overflow-hidden opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150"
                          :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">
                          <a v-for="arch in nov.archivos" :key="arch.id"
                            :href="getArchivoUrl(nov.id, arch.id)" target="_blank"
                            class="flex items-center gap-2 px-3 py-2 text-[10px] font-medium transition-colors hover:bg-[#3B82F6]/10 border-b last:border-0"
                            :class="isDark ? 'text-slate-200 border-[#2d3548]' : 'text-slate-700 border-slate-100'">
                            <i :class="['shrink-0', getMimeIcon(arch.mime)]"></i>
                            <span class="truncate flex-1">{{ arch.nombreOriginal }}</span>
                            <i class="fas fa-external-link-alt text-[#3B82F6] shrink-0 text-[8px]"></i>
                          </a>
                        </div>
                      </div>
                      <!-- Eliminar novedad -->
                      <button @click="abrirModalEliminar(nov)"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95"
                        :class="isDark ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'">
                        <i class="fas fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer conteo -->
          <div class="px-4 py-2 border-t shrink-0 flex items-center justify-between"
            :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
            <span class="text-[9px] font-black uppercase tracking-widest opacity-40"
              :class="isDark ? 'text-slate-400' : 'text-slate-500'">
              {{ misNovedades.length }} novedad{{ misNovedades.length !== 1 ? 'es' : '' }}
            </span>
          </div>
        </template>
      </div>
    </div>

  </div>

  <!-- Modal confirmar eliminación -->
  <teleport to="body">
    <transition name="fade-msg">
      <div v-if="modalEliminar.open" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background:rgba(0,0,0,0.55);" @click.self="modalEliminar.open = false">

        <div class="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
          :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

          <!-- Header modal -->
          <div class="flex items-center gap-3 px-5 py-4 border-b"
            :class="isDark ? 'border-[#2d3548]' : 'border-slate-200'">
            <div class="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <i class="fas fa-triangle-exclamation text-red-400 text-sm"></i>
            </div>
            <div>
              <p class="text-sm font-black" :class="isDark ? 'text-white' : 'text-slate-800'">
                Eliminar novedad
              </p>
              <p class="text-[10px] opacity-50 font-medium" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                Esta acción no se puede deshacer
              </p>
            </div>
          </div>

          <!-- Cuerpo modal -->
          <div class="px-5 py-4 flex flex-col gap-3">
            <p class="text-xs" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
              ¿Deseas eliminar la siguiente novedad?
            </p>
            <div class="px-4 py-3 rounded-xl border"
              :class="isDark ? 'bg-[#273045] border-[#3d4558]' : 'bg-slate-50 border-slate-200'">
              <p class="text-[11px] font-bold truncate" :class="isDark ? 'text-white' : 'text-slate-800'">
                {{ modalEliminar.novedad?.descripcion }}
              </p>
              <p class="text-[10px] opacity-50 mt-0.5" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                {{ formatFecha(modalEliminar.novedad?.fechaInicio) }} →
                {{ formatFecha(modalEliminar.novedad?.fechaFin) }}
              </p>
            </div>

            <p class="text-[10px] text-red-400 font-medium">
              <i class="fas fa-info-circle mr-1"></i>
              Se registrará que <strong>{{ sessionNombre }}</strong> realizó esta eliminación.
            </p>
          </div>

          <!-- Footer modal -->
          <div class="flex items-center justify-end gap-2 px-5 py-3 border-t"
            :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
            <button @click="modalEliminar.open = false"
              class="px-4 py-2 rounded-lg border text-[10px] font-black uppercase italic tracking-widest transition-all hover:brightness-110 active:scale-95"
              :class="isDark ? 'border-[#2d3548] text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'">
              Cancelar
            </button>
            <button @click="confirmarEliminar" :disabled="loadingDelete"
              class="px-5 py-2 rounded-lg bg-red-500 text-white text-[10px] font-black uppercase italic tracking-widest transition-all hover:bg-red-600 active:scale-95 flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait">
              <i v-if="loadingDelete" class="fas fa-circle-notch fa-spin"></i>
              <i v-else class="fas fa-trash-can"></i>
              {{ loadingDelete ? 'Eliminando...' : 'Sí, eliminar' }}
            </button>
          </div>

        </div>
      </div>
    </transition>
  </teleport>

</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNovedades } from '../../composables/adminLogica/useNovedadesUsuario';
import { getEstadoVisual } from '../../composables/adminLogica/useNovedades';

const props = defineProps({
  isDark: Boolean,
  company: String,
  employee: Object,
});

const { crearNovedad, loading, jefe, fetchJefeDeArea, misNovedades, fetchMisNovedades, getFileUrl, getArchivoUrl, eliminarMiNovedad } = useNovedades();

const activeTab = ref('registro');
const storageMode = ref('local');
const sessionIdOdoo = ref(null);
const sessionNombre = ref('');

const form = ref({
  nombre: '', cedula: '', descripcion: '',
  fechaInicio: '', fechaFin: '',
});

const archivosSeleccionados = ref([]);
const archivoError = ref('');
const dragOver = ref(false);
const submitStatus = ref('');
const submitMessage = ref('');

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const getMimeIcon = (mime = '') => {
  if (mime === 'application/pdf') return 'fas fa-file-pdf text-red-400';
  if (mime.startsWith('image/')) return 'fas fa-file-image text-violet-400';
  return 'fas fa-file text-slate-400';
};
const getFileIcon = (file) => getMimeIcon(file.type);
const formatSize = (bytes) => bytes > 1024 * 1024
  ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
  : `${(bytes / 1024).toFixed(0)} KB`;

const filtros = ref({ buscar: '', fechaDesde: '', fechaHasta: '' });

const modalEliminar = ref({ open: false, novedad: null });
const loadingDelete = ref(false);


// ─── Badges simples para Jefe / RRHH (aprobado parcial) ──────────
const estadoLabel = (v) => v === 1 ? 'Aprobado' : v === 0 ? 'Rechazado' : 'Pendiente';
const estadoIcon = (v) => v === 1 ? 'fas fa-check' : v === 0 ? 'fas fa-xmark' : 'fas fa-clock';
const estadoBadge = (v) => {
  if (v === 1) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  if (v === 0) return 'bg-red-500/10 text-red-400 border-red-500/20';
  return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
};
const formatFecha = (f) => {
  if (!f) return '—';
  const [y, m, d] = String(f).split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

onMounted(async () => {
  const session = JSON.parse(localStorage.getItem('user_session') || '{}');
  form.value.nombre = props.employee?.name || session?.name || '';
  sessionIdOdoo.value = props.employee?.id_odoo || session?.id_odoo || null;
  sessionNombre.value = props.employee?.name || session?.name || '';

  const department = props.employee?.department || session?.department;
  if (department) await fetchJefeDeArea(department);

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/sistema-config`);
    if (res.ok) {
      const cfg = await res.json();
      if (cfg.storage_mode) storageMode.value = cfg.storage_mode;
    }
  } catch { }
});

const abrirModalEliminar = (nov) => {
  modalEliminar.value = { open: true, novedad: nov };
};

const confirmarEliminar = async () => {
  if (!modalEliminar.value.novedad) return;
  loadingDelete.value = true;
  try {
    await eliminarMiNovedad(
      modalEliminar.value.novedad.id,
      sessionIdOdoo.value,
      sessionNombre.value,
    );
    modalEliminar.value.open = false;
  } catch {
    // el error ya se loguea en el composable
  } finally {
    loadingDelete.value = false;
  }
};

const onOpenHistorial = async () => {
  activeTab.value = 'historial';
  await fetchMisNovedades({ idOdoo: sessionIdOdoo.value });
};

const aplicarFiltros = async () => {
  await fetchMisNovedades({
    idOdoo: sessionIdOdoo.value,
    fechaDesde: filtros.value.fechaDesde || undefined,
    fechaHasta: filtros.value.fechaHasta || undefined,
    buscar: filtros.value.buscar || undefined,
  });
};

const limpiarFiltros = async () => {
  filtros.value = { buscar: '', fechaDesde: '', fechaHasta: '' };
  await fetchMisNovedades({ idOdoo: sessionIdOdoo.value });
};

const onFilesChange = (e) => agregarArchivos([...e.target.files]);
const onDrop = (e) => { dragOver.value = false; agregarArchivos([...(e.dataTransfer?.files ?? [])]); };

const agregarArchivos = (files) => {
  archivoError.value = '';
  for (const f of files) {
    if (!ALLOWED_TYPES.includes(f.type)) {
      archivoError.value = `"${f.name}" no es PDF ni imagen. Solo se aceptan PDF, JPG, PNG, GIF o WEBP.`;
      return;
    }
    if (archivosSeleccionados.value.length >= 10) {
      archivoError.value = 'Máximo 10 archivos por novedad.';
      return;
    }
    // Evitar duplicados por nombre
    if (!archivosSeleccionados.value.find(x => x.name === f.name && x.size === f.size)) {
      archivosSeleccionados.value.push(f);
    }
  }
};

const quitarArchivo = (idx) => {
  archivosSeleccionados.value.splice(idx, 1);
};

const handleSubmit = async () => {
  submitStatus.value = '';
  archivoError.value = '';
  try {
    const res = await crearNovedad({
      nombre: form.value.nombre,
      cedula: form.value.cedula,
      descripcion: form.value.descripcion,
      fechaInicio: form.value.fechaInicio,
      fechaFin: form.value.fechaFin,
      archivos: archivosSeleccionados.value,
      storageMode: storageMode.value,
      responsableIdOdoo: jefe.value?.id_odoo ?? null,
      responsableNombre: jefe.value?.name ?? null,
      responsableCargo: jefe.value?.job ?? null,
      creadoPor: sessionIdOdoo.value,
    });
    submitStatus.value = 'ok';
    submitMessage.value = `Novedad guardada correctamente (ID ${res?.data?.id ?? ''}).`;
    resetForm();
    setTimeout(() => { submitStatus.value = ''; }, 5000);
  } catch (e) {
    submitStatus.value = 'error';
    submitMessage.value = e?.response?.data?.message || 'Error al guardar la novedad.';
  }
};

const resetForm = () => {
  form.value = { ...form.value, cedula: '', descripcion: '', fechaInicio: '', fechaFin: '' };
  archivosSeleccionados.value = [];
  archivoError.value = '';
  submitStatus.value = '';
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: all 0.3s ease;
}

.slide-panel-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-panel-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.fade-msg-enter-active,
.fade-msg-leave-active {
  transition: all 0.25s ease;
}

.fade-msg-enter-from,
.fade-msg-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
