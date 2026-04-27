<template>
  <div class="flex flex-col gap-4 max-w-5xl">

    <!-- Header -->
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-[#FF8F00]/10 flex items-center justify-center shrink-0">
        <i class="fas fa-plug text-[#FF8F00]"></i>
      </div>
      <div>
        <h2 class="text-sm font-black uppercase tracking-tight" :class="isDark ? 'text-white' : 'text-slate-800'">API
          Externa · Asistencias</h2>
        <p class="text-[10px] opacity-50 font-medium" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Expone datos de asistencia a sistemas externos con autenticación Bearer Token
        </p>
      </div>
    </div>

    <!-- Tabs internos -->
    <div class="flex items-center gap-1 border-b pb-2" :class="isDark ? 'border-[#2d3548]' : 'border-slate-200'">
      <button v-for="t in tabs" :key="t.key" @click="tab = t.key"
        class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all" :class="tab === t.key
          ? 'bg-[#FF8F00] text-black'
          : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')">
        <i :class="t.icon + ' mr-1'"></i>{{ t.label }}
      </button>
    </div>

    <!-- ─── TAB: CREDENCIALES ─────────────────────────────────────────────── -->
    <div v-if="tab === 'credenciales'" class="flex flex-col gap-4">

      <!-- Formulario nueva credencial -->
      <div class="rounded-2xl border p-4 flex flex-col gap-3"
        :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">
        <p class="text-[10px] font-black uppercase tracking-widest"
          :class="isDark ? 'text-slate-300' : 'text-slate-700'">
          <i class="fas fa-plus-circle text-[#FF8F00] mr-1"></i> Nueva credencial
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-[9px] font-black uppercase tracking-widest"
              :class="isDark ? 'text-slate-400' : 'text-slate-500'">Nombre / Descripción</label>
            <input v-model="nueva.nombre" type="text" placeholder="Ej: Sistema RRHH cliente X"
              class="px-3 py-2 rounded-xl border text-xs font-medium outline-none transition-all placeholder:text-slate-400"
              :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[9px] font-black uppercase tracking-widest"
              :class="isDark ? 'text-slate-400' : 'text-slate-500'">Usuario</label>
            <input v-model="nueva.username" type="text" placeholder="usuario_api"
              class="px-3 py-2 rounded-xl border text-xs font-medium outline-none transition-all placeholder:text-slate-400"
              :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[9px] font-black uppercase tracking-widest"
              :class="isDark ? 'text-slate-400' : 'text-slate-500'">Contraseña</label>
            <div class="relative">
              <input v-model="nueva.password" :type="showPass ? 'text' : 'password'" placeholder="••••••••"
                class="w-full px-3 py-2 pr-9 rounded-xl border text-xs font-medium outline-none transition-all placeholder:text-slate-400"
                :class="isDark ? 'bg-[#273045] border-[#2d3548] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'" />
              <button type="button" @click="showPass = !showPass"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                <i :class="showPass ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-1">
          <button @click="crearCredencial" :disabled="loadingCred"
            class="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#FF8F00] text-black text-[10px] font-black uppercase italic tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-60">
            <i v-if="loadingCred" class="fas fa-circle-notch fa-spin"></i>
            <i v-else class="fas fa-key"></i>
            {{ loadingCred ? 'Creando...' : 'Crear credencial' }}
          </button>
        </div>
      </div>

      <!-- Lista de credenciales -->
      <div class="rounded-2xl border overflow-hidden"
        :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

        <div v-if="loadingList" class="p-6 flex justify-center opacity-50">
          <i class="fas fa-circle-notch fa-spin text-[#FF8F00] text-lg"></i>
        </div>

        <div v-else-if="!credenciales.length" class="p-8 flex flex-col items-center gap-2 opacity-40">
          <i class="fas fa-key text-3xl" :class="isDark ? 'text-slate-600' : 'text-slate-300'"></i>
          <p class="text-xs font-bold" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Sin credenciales creadas
          </p>
        </div>

        <table v-else class="w-full text-[11px]">
          <thead :class="isDark ? 'bg-[#1a2035] border-b border-[#2d3548]' : 'bg-slate-50 border-b border-slate-200'">
            <tr>
              <th class="px-4 py-2.5 text-left font-black uppercase tracking-widest text-[9px]"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">Nombre</th>
              <th class="px-4 py-2.5 text-left font-black uppercase tracking-widest text-[9px]"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">Usuario</th>
              <th class="px-4 py-2.5 text-left font-black uppercase tracking-widest text-[9px]"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">Token</th>
              <th class="px-4 py-2.5 text-center font-black uppercase tracking-widest text-[9px]"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">Estado</th>
              <th class="px-4 py-2.5 text-center font-black uppercase tracking-widest text-[9px]"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">Último uso</th>
              <th class="px-4 py-2.5 text-center font-black uppercase tracking-widest text-[9px]"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in credenciales" :key="c.id" class="border-b transition-colors"
              :class="isDark ? 'border-[#2d3548] hover:bg-[#273045]' : 'border-slate-100 hover:bg-slate-50'">

              <td class="px-4 py-3 font-bold" :class="isDark ? 'text-white' : 'text-slate-800'">
                {{ c.nombre }}
              </td>
              <td class="px-4 py-3 font-mono text-xs opacity-70" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                {{ c.username }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1.5">
                  <code class="font-mono text-[9px] opacity-60 truncate max-w-[120px]"
                    :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                    {{ c.token.substring(0, 16) }}…
                  </code>
                  <button @click="copiarToken(c.token)" class="text-[#FF8F00] hover:brightness-125 transition-all"
                    title="Copiar token completo">
                    <i class="fas fa-copy text-[10px]"></i>
                  </button>
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase border" :class="c.activa
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'">
                  {{ c.activa ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td class="px-4 py-3 text-center text-[10px] opacity-60"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                {{ c.ultimoUso ? formatFecha(c.ultimoUso) : 'Nunca' }}
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button @click="regenerarToken(c.id)" title="Regenerar token"
                    class="w-7 h-7 rounded-lg border flex items-center justify-center transition-all hover:brightness-110 active:scale-95"
                    :class="isDark ? 'bg-[#273045] border-[#3d4558] text-[#FF8F00]' : 'bg-slate-100 border-slate-200 text-[#FF8F00]'">
                    <i class="fas fa-rotate text-[10px]"></i>
                  </button>
                  <button @click="toggleActiva(c)" title="Activar/Desactivar"
                    class="w-7 h-7 rounded-lg border flex items-center justify-center transition-all hover:brightness-110 active:scale-95"
                    :class="isDark ? 'bg-[#273045] border-[#3d4558] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'">
                    <i :class="c.activa ? 'fas fa-toggle-on text-emerald-500' : 'fas fa-toggle-off text-red-400'"
                      class="text-[10px]"></i>
                  </button>
                  <button @click="confirmarEliminar(c)" title="Eliminar"
                    class="w-7 h-7 rounded-lg border flex items-center justify-center transition-all hover:brightness-110 active:scale-95"
                    :class="isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-500'">
                    <i class="fas fa-trash-can text-[10px]"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ─── TAB: CAMPOS ───────────────────────────────────────────────────── -->
    <div v-if="tab === 'campos'" class="flex flex-col gap-3">
      <p class="text-xs font-medium opacity-60" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
        Selecciona qué campos se incluyen en la respuesta del endpoint de asistencias.
      </p>

      <div class="rounded-2xl border overflow-hidden"
        :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">
        <div v-if="loadingCampos" class="p-6 flex justify-center opacity-50">
          <i class="fas fa-circle-notch fa-spin text-[#FF8F00]"></i>
        </div>
        <table v-else class="w-full text-[11px]">
          <thead :class="isDark ? 'bg-[#1a2035] border-b border-[#2d3548]' : 'bg-slate-50 border-b border-slate-200'">
            <tr>
              <th class="px-4 py-2.5 text-left font-black uppercase tracking-widest text-[9px]"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">Campo</th>
              <th class="px-4 py-2.5 text-left font-black uppercase tracking-widest text-[9px]"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">Tipo</th>
              <th class="px-4 py-2.5 text-center font-black uppercase tracking-widest text-[9px]"
                :class="isDark ? 'text-slate-400' : 'text-slate-500'">Expuesto</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in campos" :key="c.campo" class="border-b transition-colors"
              :class="isDark ? 'border-[#2d3548] hover:bg-[#273045]' : 'border-slate-100 hover:bg-slate-50'">
              <td class="px-4 py-3">
                <p class="font-bold" :class="isDark ? 'text-white' : 'text-slate-800'">{{ c.label }}</p>
                <code class="text-[9px] opacity-40"
                  :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ c.campo }}</code>
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-md text-[8px] font-black uppercase border"
                  :class="isDark ? 'bg-[#273045] text-slate-300 border-[#3d4558]' : 'bg-slate-100 text-slate-600 border-slate-200'">
                  {{ tiposCampo[c.campo] || 'Text' }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <button @click="toggleCampo(c)" class="relative w-10 h-5 rounded-full transition-all duration-200"
                  :class="c.activo ? 'bg-[#FF8F00]' : (isDark ? 'bg-[#2d3548]' : 'bg-slate-200')">
                  <span class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
                    :class="c.activo ? 'left-5' : 'left-0.5'"></span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="px-4 py-3 border-t flex justify-end" :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
          <button @click="guardarCampos" :disabled="savingCampos"
            class="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#FF8F00] text-black text-[10px] font-black uppercase italic tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-60">
            <i v-if="savingCampos" class="fas fa-circle-notch fa-spin"></i>
            <i v-else class="fas fa-save"></i>
            {{ savingCampos ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ─── TAB: DOCUMENTACIÓN ────────────────────────────────────────────── -->
    <div v-if="tab === 'docs'" class="flex flex-col gap-4">

      <div class="rounded-2xl border p-5 flex flex-col gap-5"
        :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">

        <!-- URL base -->
        <div class="flex flex-col gap-2">
          <p class="text-[10px] font-black uppercase tracking-widest text-[#FF8F00]">
            <i class="fas fa-link mr-1"></i> URL base del API
          </p>
          <div class="flex items-center gap-2 px-3 py-2.5 rounded-xl border font-mono text-xs"
            :class="isDark ? 'bg-[#0f172a] border-[#2d3548] text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-700'">
            <span class="flex-1 truncate">{{ apiBase }}</span>
            <button @click="copiarTexto(apiBase)" class="text-slate-400 hover:text-[#FF8F00] transition-colors">
              <i class="fas fa-copy text-[10px]"></i>
            </button>
          </div>
        </div>

        <!-- Flujo de autenticación -->
        <div class="flex flex-col gap-2">
          <p class="text-[10px] font-black uppercase tracking-widest"
            :class="isDark ? 'text-slate-300' : 'text-slate-700'">
            <i class="fas fa-shield-halved text-[#FF8F00] mr-1"></i> 1 · Autenticación
          </p>
          <pre class="text-[10px] leading-relaxed rounded-xl p-4 overflow-x-auto"
            :class="isDark ? 'bg-[#0f172a] text-emerald-300' : 'bg-slate-900 text-emerald-400'">{{ ejemploAuth }}</pre>
        </div>

        <!-- Consultar asistencias -->
        <div class="flex flex-col gap-2">
          <p class="text-[10px] font-black uppercase tracking-widest"
            :class="isDark ? 'text-slate-300' : 'text-slate-700'">
            <i class="fas fa-calendar-check text-[#FF8F00] mr-1"></i> 2 · Consultar asistencias
          </p>
          <pre class="text-[10px] leading-relaxed rounded-xl p-4 overflow-x-auto"
            :class="isDark ? 'bg-[#0f172a] text-sky-300' : 'bg-slate-900 text-sky-400'">{{ ejemploAsistencias }}</pre>
        </div>

        <!-- Ejemplo Python -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <p class="text-[10px] font-black uppercase tracking-widest"
              :class="isDark ? 'text-slate-300' : 'text-slate-700'">
              <i class="fab fa-python text-[#FF8F00] mr-1"></i> Ejemplo Python
            </p>
            <button @click="copiarTexto(ejemploPython)"
              class="text-[9px] font-bold px-2 py-0.5 rounded border transition-all hover:brightness-110"
              :class="isDark ? 'border-[#2d3548] text-slate-400' : 'border-slate-200 text-slate-500'">
              <i class="fas fa-copy mr-1"></i> Copiar
            </button>
          </div>
          <pre class="text-[10px] leading-relaxed rounded-xl p-4 overflow-x-auto"
            :class="isDark ? 'bg-[#0f172a] text-yellow-300' : 'bg-slate-900 text-yellow-400'">{{ ejemploPython }}</pre>
        </div>

        <!-- Ejemplo JavaScript/Node -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <p class="text-[10px] font-black uppercase tracking-widest"
              :class="isDark ? 'text-slate-300' : 'text-slate-700'">
              <i class="fab fa-js-square text-[#FF8F00] mr-1"></i> Ejemplo JavaScript / Node.js
            </p>
            <button @click="copiarTexto(ejemploJs)"
              class="text-[9px] font-bold px-2 py-0.5 rounded border transition-all hover:brightness-110"
              :class="isDark ? 'border-[#2d3548] text-slate-400' : 'border-slate-200 text-slate-500'">
              <i class="fas fa-copy mr-1"></i> Copiar
            </button>
          </div>
          <pre class="text-[10px] leading-relaxed rounded-xl p-4 overflow-x-auto"
            :class="isDark ? 'bg-[#0f172a] text-amber-300' : 'bg-slate-900 text-amber-400'">{{ ejemploJs }}</pre>
        </div>

        <!-- Respuesta esperada -->
        <div class="flex flex-col gap-2">
          <p class="text-[10px] font-black uppercase tracking-widest"
            :class="isDark ? 'text-slate-300' : 'text-slate-700'">
            <i class="fas fa-code text-[#FF8F00] mr-1"></i> Respuesta JSON
          </p>
          <pre class="text-[10px] leading-relaxed rounded-xl p-4 overflow-x-auto"
            :class="isDark ? 'bg-[#0f172a] text-slate-300' : 'bg-slate-900 text-slate-300'">{{ ejemploRespuesta }}</pre>
        </div>

        <!-- Parámetros -->
        <div class="flex flex-col gap-2">
          <p class="text-[10px] font-black uppercase tracking-widest"
            :class="isDark ? 'text-slate-300' : 'text-slate-700'">
            <i class="fas fa-sliders text-[#FF8F00] mr-1"></i> Parámetros de consulta
          </p>
          <div class="rounded-xl border overflow-hidden" :class="isDark ? 'border-[#2d3548]' : 'border-slate-200'">
            <table class="w-full text-[11px]">
              <thead :class="isDark ? 'bg-[#1a2035]' : 'bg-slate-50'">
                <tr>
                  <th class="px-4 py-2 text-left text-[9px] font-black uppercase tracking-widest"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Parámetro</th>
                  <th class="px-4 py-2 text-left text-[9px] font-black uppercase tracking-widest"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Tipo</th>
                  <th class="px-4 py-2 text-left text-[9px] font-black uppercase tracking-widest"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">Descripción</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in parametros" :key="p.nombre" class="border-t"
                  :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
                  <td class="px-4 py-2 font-mono text-[10px] text-[#FF8F00]">{{ p.nombre }}</td>
                  <td class="px-4 py-2 text-[10px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ p.tipo }}
                  </td>
                  <td class="px-4 py-2 text-[10px]" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ p.desc }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast copiado -->
    <transition name="fade-toast">
      <div v-if="toastMsg"
        class="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-500 text-[11px] font-black uppercase tracking-widest shadow-xl">
        <i class="fas fa-check-circle"></i> {{ toastMsg }}
      </div>
    </transition>

    <!-- Modal confirmar eliminar -->
    <teleport to="body">
      <transition name="fade-toast">
        <div v-if="credAEliminar" class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background:rgba(0,0,0,0.55);" @click.self="credAEliminar = null">
          <div class="w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden"
            :class="isDark ? 'bg-[#1e2538] border-[#2d3548]' : 'bg-white border-slate-200'">
            <div class="px-5 py-4 flex items-center gap-3 border-b"
              :class="isDark ? 'border-[#2d3548]' : 'border-slate-200'">
              <div class="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                <i class="fas fa-triangle-exclamation text-red-400"></i>
              </div>
              <p class="text-sm font-black" :class="isDark ? 'text-white' : 'text-slate-800'">
                Eliminar credencial
              </p>
            </div>
            <div class="px-5 py-4">
              <p class="text-xs" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                ¿Eliminar la credencial <strong>{{ credAEliminar?.nombre }}</strong> ({{ credAEliminar?.username }})?
                Los sistemas que la usen perderán acceso.
              </p>
            </div>
            <div class="px-5 py-3 flex justify-end gap-2 border-t"
              :class="isDark ? 'border-[#2d3548]' : 'border-slate-100'">
              <button @click="credAEliminar = null"
                class="px-4 py-2 rounded-lg border text-[10px] font-black uppercase italic"
                :class="isDark ? 'border-[#2d3548] text-slate-400' : 'border-slate-200 text-slate-500'">
                Cancelar
              </button>
              <button @click="eliminarCredencial"
                class="px-5 py-2 rounded-lg bg-red-500 text-white text-[10px] font-black uppercase italic hover:bg-red-600 active:scale-95 transition-all">
                <i class="fas fa-trash-can mr-1"></i> Eliminar
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({ isDark: Boolean });
const emit = defineEmits(['success', 'error']);

const API_URL = import.meta.env.VITE_API_URL;

const tabs = [
  { key: 'credenciales', icon: 'fas fa-key', label: 'Credenciales' },
  { key: 'campos', icon: 'fas fa-table-list', label: 'Campos expuestos' },
  { key: 'docs', icon: 'fas fa-book-open', label: 'Documentación' },
];
const tab = ref('credenciales');

// ─── Estado ────────────────────────────────────────────────────────────────
const credenciales = ref([]);
const campos = ref([]);
const loadingList = ref(false);
const loadingCred = ref(false);
const loadingCampos = ref(false);
const savingCampos = ref(false);
const showPass = ref(false);
const toastMsg = ref('');
const credAEliminar = ref(null);

const nueva = ref({ nombre: '', username: '', password: '' });

const tiposCampo = {
  cedula: 'Number',
  nombre: 'Text',
  inicio_turno: 'Timestamp',
  fin_turno: 'Timestamp',
  fecha_entrada: 'Timestamp',
  fecha_salida: 'Timestamp',
};

const parametros = [
  { nombre: 'fechaInicio', tipo: 'string (YYYY-MM-DD)', desc: 'Fecha inicial del rango (requerido)' },
  { nombre: 'fechaFin', tipo: 'string (YYYY-MM-DD)', desc: 'Fecha final del rango (requerido)' },
  { nombre: 'cedula', tipo: 'string', desc: 'Filtrar por cédula de un colaborador (opcional)' },
];

// ─── URL y ejemplos de código ──────────────────────────────────────────────
const apiBase = computed(() => `${API_URL}/api-externa`);

const ejemploAuth = computed(() => `# POST ${apiBase.value}/auth
curl -X POST ${apiBase.value}/auth \\
  -H "Content-Type: application/json" \\
  -d '{"username": "mi_usuario", "password": "mi_password"}'

# Respuesta:
# { "ok": true, "token": "abc123...", "tipo": "Bearer" }`);

const ejemploAsistencias = computed(() => `# GET ${apiBase.value}/asistencias
curl "${apiBase.value}/asistencias?fechaInicio=2024-01-01&fechaFin=2024-01-31" \\
  -H "Authorization: Bearer <TOKEN>"`);

const ejemploPython = computed(() => `import requests

BASE = "${apiBase.value}"

# Token estático (cópialo desde la tabla de credenciales)
TOKEN = "tu_token_aqui"

resp = requests.get(
    f"{BASE}/asistencias",
    params={
        "fechaInicio": "2024-01-01",
        "fechaFin":    "2024-01-31",
        # "cedula": "123456789"  # opcional
    },
    headers={"Authorization": f"Bearer {TOKEN}"},
)

data = resp.json()
print(f"Total registros: {data['total']}")
for row in data["data"]:
    print(row)`);

const ejemploJs = computed(() => `const BASE = "${apiBase.value}";

// 1. Autenticar
const { token } = await fetch(\`\${BASE}/auth\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "mi_usuario", password: "mi_password" })
}).then(r => r.json());

// 2. Consultar asistencias
const result = await fetch(
  \`\${BASE}/asistencias?fechaInicio=2024-01-01&fechaFin=2024-01-31\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
).then(r => r.json());

console.log(result.data);`);

const ejemploRespuesta = `{
  "ok": true,
  "total": 2,
  "fechaInicio": "2024-01-15",
  "fechaFin": "2024-01-15",
  "data": [
    {
      "cedula": "1234567890",
      "nombre": "Juan García López",
      "inicio_turno":  "2024-01-15 08:00:00",
      "fin_turno":     "2024-01-15 17:00:00",
      "fecha_entrada": "2024-01-15 07:58:42",
      "fecha_salida":  "2024-01-15 17:04:10"
    }
  ]
}`;

// ─── Utilidades ────────────────────────────────────────────────────────────
const formatFecha = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const toast = (msg, ms = 2500) => {
  toastMsg.value = msg;
  setTimeout(() => toastMsg.value = '', ms);
};

const copiarToken = async (token) => {
  await navigator.clipboard.writeText(token);
  toast('Token copiado al portapapeles');
};

const copiarTexto = async (texto) => {
  await navigator.clipboard.writeText(texto);
  toast('Copiado al portapapeles');
};

// ─── CRUD Credenciales ────────────────────────────────────────────────────
const fetchCredenciales = async () => {
  loadingList.value = true;
  try {
    const r = await fetch(`${API_URL}/superadmin/api-externa/credenciales`);
    credenciales.value = await r.json();
  } catch { emit('error', 'Error cargando credenciales'); }
  finally { loadingList.value = false; }
};

const crearCredencial = async () => {
  if (!nueva.value.nombre || !nueva.value.username || !nueva.value.password) {
    emit('error', 'Completa todos los campos'); return;
  }
  loadingCred.value = true;
  try {
    const r = await fetch(`${API_URL}/superadmin/api-externa/credenciales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nueva.value),
    });
    if (!r.ok) throw new Error();
    nueva.value = { nombre: '', username: '', password: '' };
    await fetchCredenciales();
    emit('success', 'Credencial creada');
    toast('Credencial creada correctamente');
  } catch { emit('error', 'Error al crear credencial'); }
  finally { loadingCred.value = false; }
};

const confirmarEliminar = (c) => { credAEliminar.value = c; };

const eliminarCredencial = async () => {
  if (!credAEliminar.value) return;
  try {
    await fetch(`${API_URL}/superadmin/api-externa/credenciales/${credAEliminar.value.id}`, {
      method: 'DELETE',
    });
    credAEliminar.value = null;
    await fetchCredenciales();
    emit('success', 'Credencial eliminada');
  } catch { emit('error', 'Error al eliminar'); }
};

const regenerarToken = async (id) => {
  try {
    await fetch(`${API_URL}/superadmin/api-externa/credenciales/${id}/regenerar-token`, {
      method: 'POST',
    });
    await fetchCredenciales();
    toast('Token regenerado');
    emit('success', 'Token regenerado');
  } catch { emit('error', 'Error al regenerar token'); }
};

const toggleActiva = async (c) => {
  try {
    await fetch(`${API_URL}/superadmin/api-externa/credenciales/${c.id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activa: !c.activa }),
    });
    await fetchCredenciales();
  } catch { emit('error', 'Error al cambiar estado'); }
};

// ─── Campos ────────────────────────────────────────────────────────────────
const fetchCampos = async () => {
  loadingCampos.value = true;
  try {
    const r = await fetch(`${API_URL}/superadmin/api-externa/campos`);
    campos.value = await r.json();
  } catch { emit('error', 'Error cargando campos'); }
  finally { loadingCampos.value = false; }
};

const toggleCampo = (c) => { c.activo = !c.activo; };

const guardarCampos = async () => {
  savingCampos.value = true;
  try {
    await fetch(`${API_URL}/superadmin/api-externa/campos`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campos: campos.value.map((c) => ({ campo: c.campo, activo: c.activo })),
      }),
    });
    emit('success', 'Campos actualizados');
    toast('Campos guardados correctamente');
  } catch { emit('error', 'Error al guardar campos'); }
  finally { savingCampos.value = false; }
};

// ─── Init ──────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([fetchCredenciales(), fetchCampos()]);
});
</script>

<style scoped>
.fade-toast-enter-active,
.fade-toast-leave-active {
  transition: all 0.25s ease;
}

.fade-toast-enter-from,
.fade-toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
