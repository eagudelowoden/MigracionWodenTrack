<template>
  <div class="w-full h-full animate-fade-in transition-colors duration-500 flex flex-col gap-1">

    <!-- Header -->
    <div class="flex items-center justify-between gap-2 p-1.5 px-3 rounded-2xl border shrink-0 shadow-sm"
      :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

      <div class="flex items-center gap-2 ml-1">
        <div class="w-7 h-7 flex items-center justify-center rounded-xl bg-[#FF8F00] text-white shadow-sm shrink-0">
          <i class="fas fa-file-signature text-xs"></i>
        </div>
        <div>
          <h2 class="text-base font-black uppercase tracking-tighter" :class="isDark ? 'text-white' : 'text-slate-800'">
            {{ activeTab === 'registro' ? 'Registro' : 'Mi Historial' }}
            <span class="text-[#FF8F00]">{{ activeTab === 'registro' ? 'Novedad' : 'Novedades' }}</span>
          </h2>
          <p class="text-[8px] font-bold opacity-50 uppercase tracking-[0.2em]"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            {{ company || 'Woden Track' }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 mr-1">
        <!-- Tabs -->
        <div class="flex items-center rounded-xl border overflow-hidden"
          :class="isDark ? 'border-[#2d3548]' : 'border-slate-200'">
          <button @click="activeTab = 'registro'"
            class="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all" :class="activeTab === 'registro'
              ? 'bg-[#FF8F00] text-black'
              : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')">
            <i class="fas fa-plus mr-1"></i>Registrar
          </button>
          <button @click="onOpenHistorial"
            class="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all" :class="activeTab === 'historial'
              ? 'bg-[#FF8F00] text-black'
              : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')">
            <i class="fas fa-clock-rotate-left mr-1"></i>Mi Historial
          </button>
        </div>

        <!-- Indicador almacenamiento (solo en tab registro) -->
        <div v-if="activeTab === 'registro'"
          class="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest"
          :class="storageMode === 's3'
            ? 'bg-[#FF8F00]/10 text-[#FF8F00] border-[#FF8F00]/30'
            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'">
          <i :class="storageMode === 's3' ? 'fab fa-aws' : 'fas fa-hard-drive'"></i>
          {{ storageMode === 's3' ? 'AWS S3' : 'Local' }}
        </div>
      </div>
    </div>

    <!-- TAB: REGISTRO -->
    <div v-if="activeTab === 'registro'" class="flex-1 flex gap-1 overflow-hidden">

      <!-- Formulario -->
      <div class="flex flex-col overflow-hidden rounded-2xl border transition-all duration-300" :class="[
        viewerOpen ? 'w-1/2' : 'w-full',
        isDark ? 'bg-[#1e2538] border-[#2d3548] shadow-black/40' : 'bg-white border-slate-200 shadow-slate-100'
      ]">
        <form @submit.prevent="handleSubmit" class="flex-1 flex flex-col p-5 gap-4 overflow-y-auto">

          <!-- Banner modo storage -->
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold border" :class="storageMode === 's3'
            ? 'bg-[#FF8F00]/10 border-[#FF8F00]/25 text-[#FF8F00]'
            : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600'">
            <i :class="storageMode === 's3' ? 'fab fa-aws' : 'fas fa-hard-drive'"></i>
            <span v-if="storageMode === 's3'">
              <!-- Soporte → <strong>AWS S3</strong> -->
            </span>
            <!--
            <span v-else>
              Soporte → <strong>carpeta local</strong>
              <code class="ml-1 opacity-50 text-[9px]">/uploads/novedades/</code>
            </span>-->
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">

            <!-- Nombre -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[9px] font-black uppercase tracking-widest ml-1"
                :class="isDark ? 'text-slate-400' : 'text-[#FF8F00]'">Nombre</label>
              <div class="flex items-center gap-3 px-4 py-2.5 rounded-lg border text-xs"
                :class="isDark ? 'bg-[#273045] border-[#2d3548] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-500'">
                <i class="fas fa-user-circle opacity-50 text-sm"></i>
                <input type="text" v-model="form.nombre" readonly
                  class="bg-transparent w-full font-bold outline-none cursor-not-allowed"
                  :class="isDark ? 'text-white' : 'text-slate-600'" />
              </div>
            </div>

            <!-- Jefe de área -->
            <div v-if="jefe" class="md:col-span-2 flex items-center gap-3 px-4 py-2.5 rounded-lg border"
              :class="isDark ? 'bg-[#273045] border-[#2d3548]' : 'bg-slate-50 border-slate-200'">
              <div
                class="w-7 h-7 rounded-lg bg-[#FF8F00]/10 flex items-center justify-center text-[10px] font-black text-[#FF8F00] shrink-0">
                {{ jefe.name?.charAt(0) ?? '?' }}
              </div>
              <div class="flex flex-col flex-1">
                <span class="text-[8px] font-black uppercase tracking-widest opacity-50"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">Jefe directo</span>
                <span class="text-[10px] font-black uppercase" :class="isDark ? 'text-white' : 'text-slate-800'">{{
                  jefe.name }}</span>
                <span class="text-[9px] opacity-40" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ jefe.job ||
                  '' }}</span>
              </div>
              <span
                class="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-[#FF8F00]/10 text-[#FF8F00] border border-[#FF8F00]/20">
                <i class="fas fa-user-tie mr-1"></i>Responsable
              </span>
            </div>

            <!-- Cédula -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[9px] font-black uppercase tracking-widest ml-1"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">Cédula</label>
              <div
                class="flex items-center gap-3 px-4 py-2.5 rounded-lg border focus-within:ring-1 focus-within:ring-[#FF8F00]/30 transition-all text-xs"
                :class="isDark ? 'bg-[#273045] border-[#2d3548]' : 'bg-white border-slate-200 shadow-sm'">
                <i class="fas fa-id-card text-[#FF8F00]/80 text-sm"></i>
                <input type="number" v-model="form.cedula" placeholder="Número identificación..." required
                  class="bg-transparent w-full font-bold outline-none placeholder:text-slate-500"
                  :class="isDark ? 'text-white' : 'text-slate-800'" />
              </div>
            </div>

            <!-- Fecha Inicio -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[9px] font-black uppercase tracking-widest ml-1"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">Fecha Inicio</label>
              <input type="date" v-model="form.fechaInicio" required
                class="px-4 py-2.5 rounded-lg border text-xs font-bold outline-none transition-all"
                :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white [color-scheme:dark]' : 'bg-white border-slate-200 text-slate-800'" />
            </div>

            <!-- Fecha Fin -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[9px] font-black uppercase tracking-widest ml-1"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">Fecha Fin</label>
              <input type="date" v-model="form.fechaFin" required
                class="px-4 py-2.5 rounded-lg border text-xs font-bold outline-none transition-all"
                :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white [color-scheme:dark]' : 'bg-white border-slate-200 text-slate-800'" />
            </div>

            <!-- Descripción -->
            <div class="md:col-span-2 flex flex-col gap-1.5">
              <label class="text-[9px] font-black uppercase tracking-widest ml-1"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">Descripción</label>
              <textarea v-model="form.descripcion" rows="3" placeholder="Explique el motivo..." required
                class="px-4 py-3 rounded-lg border text-xs font-medium outline-none resize-none transition-all placeholder:text-slate-500"
                :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'">
              </textarea>
            </div>

            <!-- Soporte -->
            <div class="md:col-span-2 flex flex-col gap-2">
              <label class="text-[9px] font-black uppercase tracking-widest ml-1"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                Documento de Soporte
                <span class="ml-1 opacity-40 normal-case font-medium text-[9px]">
                  PDF, imagen, Word, Excel — máx 20 MB
                </span>
              </label>

              <div @dragover.prevent="dragOver = true" @dragleave="dragOver = false" @drop.prevent="onDrop"
                class="flex items-center p-1.5 rounded-lg border transition-all" :class="[
                  dragOver ? 'border-dashed border-[#FF8F00] scale-[1.01]' : '',
                  isDark ? 'bg-[#273045] border-[#2d3548]' : 'bg-white border-slate-200 shadow-sm'
                ]">
                <div class="flex-1 px-3 truncate text-[10px] font-bold" :class="fileName
                  ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
                  : (isDark ? 'text-slate-500' : 'text-slate-400')">
                  <i
                    :class="['mr-2', fileName ? 'fas fa-file-check text-emerald-500' : 'fas fa-file-upload text-[#FF8F00]']"></i>
                  {{ fileName || 'Ningún archivo seleccionado...' }}
                </div>
                <button v-if="previewUrl" @click.prevent="toggleViewer" type="button"
                  class="px-3 py-2 rounded-md mr-1 text-[10px] font-black uppercase italic transition-all hover:brightness-110 active:scale-95 flex items-center gap-1 border"
                  :class="isDark ? 'bg-[#2d3548] text-slate-300 border-[#3d4558]' : 'bg-slate-100 text-slate-600 border-slate-200'">
                  <i class="fas fa-eye text-[#FF8F00]"></i>
                  {{ viewerOpen ? 'Cerrar' : 'Ver' }}
                </button>
                <input type="file" @change="onFileChange" id="file-upload" class="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
                <label for="file-upload"
                  class="px-4 py-2 rounded-md bg-[#FF8F00] text-black text-[10px] font-black uppercase italic cursor-pointer hover:brightness-110 active:scale-95 transition-all">
                  {{ fileName ? 'Cambiar' : 'Subir' }}
                </label>
              </div>

              <div v-if="previewUrl && isImage"
                class="rounded-xl overflow-hidden border max-h-28 flex items-center justify-center"
                :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-100 bg-slate-50'">
                <img :src="previewUrl" class="max-h-28 object-contain" />
              </div>

              <div v-else-if="fileName" class="flex items-center gap-3 px-4 py-3 rounded-xl border"
                :class="isDark ? 'border-[#2d3548] bg-[#273045]' : 'border-slate-100 bg-slate-50'">
                <i :class="['text-xl', fileIcon]"></i>
                <div>
                  <p class="text-[11px] font-bold truncate max-w-xs" :class="isDark ? 'text-white' : 'text-slate-700'">
                    {{ fileName }}</p>
                  <p class="text-[9px] opacity-50" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ fileSize }}
                  </p>
                </div>
              </div>
            </div>

          </div>

          <!-- Mensaje estado -->
          <transition name="fade-msg">
            <div v-if="submitStatus" class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-bold border"
              :class="submitStatus === 'ok'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'">
              <i :class="submitStatus === 'ok' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
              {{ submitMessage }}
            </div>
          </transition>

          <!-- Footer form -->
          <div class="flex items-center justify-between pt-4 mt-auto border-t"
            :class="isDark ? 'border-[#2d3548]' : 'border-slate-200'">
            <button @click.prevent="resetForm" type="button"
              class="px-5 py-2.5 rounded-lg font-black uppercase italic tracking-widest text-[10px] transition-all active:scale-95 flex items-center gap-2 border"
              :class="isDark
                ? 'text-slate-400 border-[#2d3548] hover:text-slate-200 hover:border-slate-500'
                : 'text-slate-400 border-slate-200 hover:text-slate-700 hover:border-slate-400'">
              <i class="fas fa-rotate-left text-[10px]"></i> Limpiar
            </button>
            <button type="submit" :disabled="loading"
              class="group px-8 py-2.5 rounded-lg font-black uppercase italic tracking-widest text-[10px] transition-all active:scale-95 shadow-md flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
              :class="isDark ? 'bg-[#FF8F00] text-black hover:brightness-110' : 'bg-slate-900 text-white hover:bg-slate-700'">
              <i v-if="loading" class="fas fa-circle-notch fa-spin text-[10px]"></i>
              <i v-else class="fas fa-check-circle text-[10px] group-hover:scale-110 transition-transform"></i>
              {{ loading ? 'Guardando...' : 'Guardar Novedad' }}
            </button>
          </div>

        </form>
      </div>

      <!-- Panel visor -->
      <transition name="slide-panel">
        <div v-if="viewerOpen && previewUrl" class="flex flex-col w-1/2 rounded-2xl border overflow-hidden"
          :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

          <div class="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
            :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
            <div class="flex items-center gap-2">
              <i class="fas fa-eye text-[#FF8F00] text-xs"></i>
              <span class="text-[11px] font-black uppercase tracking-widest"
                :class="isDark ? 'text-white' : 'text-slate-700'">Vista Previa</span>
              <span class="text-[10px] font-bold truncate max-w-[140px] opacity-50"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ fileName }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <a :href="previewUrl" :download="fileName"
                class="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all hover:brightness-110 flex items-center gap-1"
                :class="isDark ? 'bg-[#273045] text-slate-300 border-[#3d4558]' : 'bg-slate-100 text-slate-600 border-slate-200'">
                <i class="fas fa-download text-[#FF8F00]"></i> Descargar
              </a>
              <button @click="viewerOpen = false"
                class="w-7 h-7 rounded-lg flex items-center justify-center border transition-all"
                :class="isDark ? 'bg-[#273045] text-slate-400 border-[#3d4558]' : 'bg-slate-100 text-slate-500 border-slate-200'">
                <i class="fas fa-xmark text-xs"></i>
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
    <div v-else class="flex-1 flex flex-col gap-2 overflow-hidden">

      <!-- Filtros -->
      <div class="flex flex-wrap items-end gap-2 px-1 shrink-0">

        <!-- Buscar -->
        <div class="flex flex-col gap-1 min-w-[200px] flex-1">
          <label class="text-[9px] font-black uppercase tracking-widest ml-0.5"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Buscar</label>
          <div
            class="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all focus-within:ring-1 focus-within:ring-[#FF8F00]/40"
            :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200 shadow-sm'">
            <i class="fas fa-magnifying-glass text-[#FF8F00] text-[10px]"></i>
            <input v-model="filtros.buscar" type="text" placeholder="Descripción o tipificación..."
              class="bg-transparent flex-1 outline-none font-medium text-xs placeholder:text-slate-500"
              :class="isDark ? 'text-white' : 'text-slate-800'" />
            <button v-if="filtros.buscar" @click="filtros.buscar = ''"
              class="text-slate-400 hover:text-slate-600 transition-colors">
              <i class="fas fa-xmark text-[10px]"></i>
            </button>
          </div>
        </div>

        <!-- Fecha desde -->
        <div class="flex flex-col gap-1">
          <label class="text-[9px] font-black uppercase tracking-widest ml-0.5"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Desde</label>
          <input v-model="filtros.fechaDesde" type="date"
            class="px-3 py-2 rounded-xl border text-xs font-bold outline-none transition-all"
            :class="isDark ? 'bg-[#1e2538] border-[#2d3548] text-white [color-scheme:dark]' : 'bg-white border-slate-200 text-slate-800'" />
        </div>

        <!-- Fecha hasta -->
        <div class="flex flex-col gap-1">
          <label class="text-[9px] font-black uppercase tracking-widest ml-0.5"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">Hasta</label>
          <input v-model="filtros.fechaHasta" type="date"
            class="px-3 py-2 rounded-xl border text-xs font-bold outline-none transition-all"
            :class="isDark ? 'bg-[#1e2538] border-[#2d3548] text-white [color-scheme:dark]' : 'bg-white border-slate-200 text-slate-800'" />
        </div>

        <!-- Botones -->
        <div class="flex items-center gap-1.5 pb-0.5">
          <button @click="aplicarFiltros"
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF8F00] text-black text-[10px] font-black uppercase italic tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-sm">
            <i class="fas fa-filter text-[9px]"></i> Filtrar
          </button>
          <button @click="limpiarFiltros"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-black uppercase italic tracking-widest hover:brightness-110 active:scale-95 transition-all"
            :class="isDark ? 'border-[#2d3548] text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'">
            <i class="fas fa-rotate-left text-[9px]"></i>
          </button>
        </div>
      </div>

      <!-- Tabla -->
      <div class="flex-1 rounded-2xl border overflow-hidden flex flex-col"
        :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

        <!-- Loading -->
        <div v-if="loading" class="flex-1 flex items-center justify-center gap-2 opacity-50">
          <i class="fas fa-circle-notch fa-spin text-[#FF8F00]"></i>
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
                      <i class="fas fa-folder text-[#FF8F00]"></i>
                      {{ nov.estadoCh }}
                    </span>
                    <span v-else class="text-[10px] opacity-30">—</span>
                  </td>

                  <!-- Carpeta Jefe / Coordinador (solo lectura) -->
                  <td class="px-4 py-2.5 text-center">
                    <span v-if="nov.estadoChCoord"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border"
                      :class="isDark ? 'bg-[#273045] border-[#3d4558] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'">
                      <i class="fas fa-folder text-[#FF8F00]"></i>
                      {{ nov.estadoChCoord }}
                    </span>
                    <span v-else class="text-[10px] opacity-30">—</span>
                  </td>

                  <!-- Acciones: Ver soporte + Eliminar -->
                  <td class="px-4 py-2.5 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                      <a :href="getFileUrl(nov.id)" target="_blank"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95"
                        :class="isDark ? 'bg-[#273045] text-slate-300 border-[#3d4558]' : 'bg-slate-100 text-slate-600 border-slate-200'">
                        <i class="fas fa-eye text-[#FF8F00]"></i> Ver
                      </a>
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

const { crearNovedad, loading, jefe, fetchJefeDeArea, misNovedades, fetchMisNovedades, getFileUrl, eliminarMiNovedad } = useNovedades();

const activeTab = ref('registro');
const storageMode = ref('local');
const sessionIdOdoo = ref(null);
const sessionNombre = ref('');

const form = ref({
  nombre: '', cedula: '', descripcion: '',
  fechaInicio: '', fechaFin: '', soporte: null,
});

const fileName = ref('');
const fileSize = ref('');
const previewUrl = ref('');
const dragOver = ref(false);
const viewerOpen = ref(false);
const submitStatus = ref('');
const submitMessage = ref('');

const filtros = ref({ buscar: '', fechaDesde: '', fechaHasta: '' });

const modalEliminar = ref({ open: false, novedad: null });
const loadingDelete = ref(false);

const ext = computed(() => fileName.value.split('.').pop().toLowerCase());
const isImage = computed(() => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext.value));
const isPdf = computed(() => ext.value === 'pdf');
const fileIcon = computed(() => {
  if (isImage.value) return 'fas fa-file-image text-violet-400';
  if (isPdf.value) return 'fas fa-file-pdf text-red-400';
  if (['doc', 'docx'].includes(ext.value)) return 'fas fa-file-word text-blue-400';
  if (['xls', 'xlsx'].includes(ext.value)) return 'fas fa-file-excel text-emerald-400';
  return 'fas fa-file text-slate-400';
});

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

const processFile = (file) => {
  if (!file) return;
  form.value.soporte = file;
  fileName.value = file.name;
  fileSize.value = file.size > 1024 * 1024
    ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
    : `${(file.size / 1024).toFixed(0)} KB`;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = URL.createObjectURL(file);
};

const onFileChange = (e) => processFile(e.target.files[0]);
const onDrop = (e) => { dragOver.value = false; processFile(e.dataTransfer?.files[0]); };
const toggleViewer = () => { viewerOpen.value = !viewerOpen.value; };

const handleSubmit = async () => {
  if (!form.value.soporte) {
    submitStatus.value = 'error';
    submitMessage.value = 'Por favor cargue un documento de soporte.';
    return;
  }

  submitStatus.value = '';
  try {
    const res = await crearNovedad({
      nombre: form.value.nombre,
      cedula: form.value.cedula,
      descripcion: form.value.descripcion,
      fechaInicio: form.value.fechaInicio,
      fechaFin: form.value.fechaFin,
      soporte: form.value.soporte,
      storageMode: storageMode.value,
      responsableIdOdoo: jefe.value?.id_odoo ?? null,
      responsableNombre: jefe.value?.name ?? null,
      responsableCargo: jefe.value?.job ?? null,
      creadoPor: sessionIdOdoo.value,
    });
    submitStatus.value = 'ok';
    submitMessage.value = `Novedad guardada correctamente (ID ${res?.data?.id ?? ''}).`;
    setTimeout(() => { submitStatus.value = ''; }, 5000);
  } catch (e) {
    submitStatus.value = 'error';
    submitMessage.value = e?.response?.data?.message || 'Error al guardar la novedad.';
  }
};

const resetForm = () => {
  form.value = { ...form.value, cedula: '', descripcion: '', fechaInicio: '', fechaFin: '', soporte: null };
  fileName.value = fileSize.value = previewUrl.value = '';
  viewerOpen.value = false;
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
