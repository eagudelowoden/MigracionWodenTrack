<template>
  <div class="api-root" :class="isDark ? 'api-dark' : 'api-light'">

    <!-- ── HEADER ─────────────────────────────────────────────────── -->
    <div class="api-header">
      <div class="api-header-left">
        <div class="api-header-icon" :class="isDark ? 'api-icon-dark' : 'api-icon-light'">
          <i class="fas fa-plug text-[13px]" style="color:#FF8F00"></i>
        </div>
        <div>
          <h2 class="api-title" :class="isDark ? 'text-white' : 'text-slate-800'">
            API Externa
            <span class="api-title-sub" :class="isDark ? 'text-white/25' : 'text-slate-300'">· Asistencias</span>
          </h2>
          <p class="api-subtitle" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            Expone datos de asistencia a sistemas externos con autenticación Bearer Token
          </p>
        </div>
      </div>
    </div>

    <!-- ── TABS ───────────────────────────────────────────────────── -->
    <div class="api-tabs" :class="isDark ? 'api-tabs-dark' : 'api-tabs-light'">
      <button
        v-for="t in tabs" :key="t.key"
        @click="tab = t.key"
        class="api-tab"
        :class="tab === t.key
          ? 'api-tab-active'
          : (isDark ? 'api-tab-idle-dark' : 'api-tab-idle-light')"
      >
        <i :class="t.icon" class="text-[9px]"></i>
        {{ t.label }}
        <span v-if="tab === t.key" class="api-tab-indicator"></span>
      </button>
    </div>

    <!-- ── BODY (scrollable) ──────────────────────────────────────── -->
    <div class="api-body">

      <!-- ─── TAB: CREDENCIALES ──────────────────────────────────── -->
      <div v-if="tab === 'credenciales'" class="api-section">

        <!-- Formulario -->
        <div class="api-card" :class="isDark ? 'api-card-dark' : 'api-card-light'">
          <div class="api-card-head" :class="isDark ? 'api-card-head-dark' : 'api-card-head-light'">
            <i class="fas fa-plus-circle text-[10px]" style="color:#FF8F00"></i>
            <span class="api-card-title" :class="isDark ? 'text-white' : 'text-slate-700'">Nueva credencial</span>
          </div>
          <div class="api-card-body">
            <div class="api-form-grid">
              <div class="api-field">
                <label class="api-label" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Nombre / Descripción</label>
                <input v-model="nueva.nombre" type="text" placeholder="Ej: Sistema RRHH"
                  class="api-input" :class="isDark ? 'api-input-dark' : 'api-input-light'" />
              </div>
              <div class="api-field">
                <label class="api-label" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Usuario</label>
                <input v-model="nueva.username" type="text" placeholder="usuario_api"
                  class="api-input" :class="isDark ? 'api-input-dark' : 'api-input-light'" />
              </div>
              <div class="api-field">
                <label class="api-label" :class="isDark ? 'text-slate-400' : 'text-slate-500'">Contraseña</label>
                <div class="api-input-wrap">
                  <input v-model="nueva.password" :type="showPass ? 'text' : 'password'" placeholder="••••••••"
                    class="api-input api-input-pr" :class="isDark ? 'api-input-dark' : 'api-input-light'" />
                  <button type="button" @click="showPass = !showPass" class="api-eye-btn">
                    <i :class="showPass ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-[10px]"></i>
                  </button>
                </div>
              </div>
            </div>
            <div class="flex justify-end pt-1">
              <button @click="crearCredencial" :disabled="loadingCred" class="api-btn-primary">
                <i v-if="loadingCred" class="fas fa-circle-notch fa-spin text-[10px]"></i>
                <i v-else class="fas fa-key text-[10px]"></i>
                {{ loadingCred ? 'Creando…' : 'Crear credencial' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Tabla credenciales -->
        <div class="api-card" :class="isDark ? 'api-card-dark' : 'api-card-light'">
          <div class="api-card-head" :class="isDark ? 'api-card-head-dark' : 'api-card-head-light'">
            <i class="fas fa-list-ul text-[10px]" style="color:#FF8F00"></i>
            <span class="api-card-title" :class="isDark ? 'text-white' : 'text-slate-700'">Credenciales activas</span>
            <span class="api-count-badge">{{ credenciales.length }}</span>
          </div>

          <div v-if="loadingList" class="api-loading">
            <i class="fas fa-circle-notch fa-spin" style="color:#FF8F00"></i>
          </div>
          <div v-else-if="!credenciales.length" class="api-empty">
            <i class="fas fa-key api-empty-icon" :class="isDark ? 'text-white/15' : 'text-slate-300'"></i>
            <p class="api-empty-text" :class="isDark ? 'text-slate-500' : 'text-slate-400'">Sin credenciales creadas</p>
          </div>
          <div v-else class="api-table-wrap">
            <div class="api-thead" :class="isDark ? 'api-thead-dark' : 'api-thead-light'">
              <span class="api-th api-tcol-name">Nombre</span>
              <span class="api-th api-tcol-user">Usuario</span>
              <span class="api-th api-tcol-token">Token</span>
              <span class="api-th api-tcol-status text-center">Estado</span>
              <span class="api-th api-tcol-uso text-center">Último uso</span>
              <span class="api-th api-tcol-acts text-right">Acciones</span>
            </div>
            <div class="api-tbody">
              <div v-for="c in credenciales" :key="c.id"
                class="api-tr" :class="isDark ? 'api-tr-dark' : 'api-tr-light'">
                <div class="api-tcol-name">
                  <p class="api-tr-name" :class="isDark ? 'text-white' : 'text-slate-800'">{{ c.nombre }}</p>
                </div>
                <div class="api-tcol-user">
                  <code class="api-tr-code" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ c.username }}</code>
                </div>
                <div class="api-tcol-token flex items-center gap-2">
                  <code class="api-tr-token" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ c.token.substring(0, 16) }}…</code>
                  <button @click="copiarToken(c.token)" class="api-copy-btn" title="Copiar token">
                    <i class="fas fa-copy text-[9px]"></i>
                  </button>
                </div>
                <div class="api-tcol-status flex justify-center">
                  <span class="api-status-badge" :class="c.activa ? 'api-badge-green' : 'api-badge-red'">
                    <span class="api-badge-dot" :class="c.activa ? 'bg-emerald-400' : 'bg-red-400'"></span>
                    {{ c.activa ? 'Activa' : 'Inactiva' }}
                  </span>
                </div>
                <div class="api-tcol-uso text-center">
                  <span class="api-tr-uso" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                    {{ c.ultimoUso ? formatFecha(c.ultimoUso) : 'Nunca' }}
                  </span>
                </div>
                <div class="api-tcol-acts flex items-center justify-end gap-1.5">
                  <button @click="regenerarToken(c.id)" class="api-icon-btn api-icon-orange" title="Regenerar token">
                    <i class="fas fa-rotate text-[10px]"></i>
                  </button>
                  <button @click="toggleActiva(c)" class="api-icon-btn" :class="c.activa ? 'api-icon-green' : 'api-icon-slate'" title="Activar/Desactivar">
                    <i :class="c.activa ? 'fas fa-toggle-on' : 'fas fa-toggle-off'" class="text-[11px]"></i>
                  </button>
                  <button @click="confirmarEliminar(c)" class="api-icon-btn api-icon-red" title="Eliminar">
                    <i class="fas fa-trash-can text-[10px]"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── TAB: CAMPOS ────────────────────────────────────────── -->
      <div v-if="tab === 'campos'" class="api-section">
        <div class="api-card" :class="isDark ? 'api-card-dark' : 'api-card-light'">
          <div class="api-card-head" :class="isDark ? 'api-card-head-dark' : 'api-card-head-light'">
            <i class="fas fa-table-list text-[10px]" style="color:#FF8F00"></i>
            <span class="api-card-title" :class="isDark ? 'text-white' : 'text-slate-700'">Campos expuestos en la respuesta</span>
          </div>
          <p class="api-desc" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            Selecciona qué campos se incluyen en el endpoint de asistencias.
          </p>

          <div v-if="loadingCampos" class="api-loading">
            <i class="fas fa-circle-notch fa-spin" style="color:#FF8F00"></i>
          </div>
          <div v-else class="api-table-wrap">
            <div class="api-thead" :class="isDark ? 'api-thead-dark' : 'api-thead-light'">
              <span class="api-th flex-1">Campo</span>
              <span class="api-th w-24">Tipo</span>
              <span class="api-th w-20 text-center">Expuesto</span>
            </div>
            <div class="api-tbody">
              <div v-for="c in campos" :key="c.campo"
                class="api-tr" :class="isDark ? 'api-tr-dark' : 'api-tr-light'">
                <div class="flex-1 min-w-0">
                  <p class="api-campo-label" :class="isDark ? 'text-white' : 'text-slate-800'">{{ c.label }}</p>
                  <code class="api-campo-key" :class="isDark ? 'text-slate-500' : 'text-slate-400'">{{ c.campo }}</code>
                </div>
                <div class="w-24">
                  <span class="api-tipo-chip" :class="isDark ? 'api-tipo-dark' : 'api-tipo-light'">
                    {{ tiposCampo[c.campo] || 'Text' }}
                  </span>
                </div>
                <div class="w-20 flex justify-center">
                  <button @click="toggleCampo(c)"
                    class="api-toggle"
                    :class="c.activo ? 'api-toggle-on' : (isDark ? 'api-toggle-off-dark' : 'api-toggle-off-light')">
                    <span class="api-toggle-knob" :class="c.activo ? 'translate-x-5' : 'translate-x-0.5'"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="api-card-foot" :class="isDark ? 'api-foot-dark' : 'api-foot-light'">
            <button @click="guardarCampos" :disabled="savingCampos" class="api-btn-primary">
              <i v-if="savingCampos" class="fas fa-circle-notch fa-spin text-[10px]"></i>
              <i v-else class="fas fa-save text-[10px]"></i>
              {{ savingCampos ? 'Guardando…' : 'Guardar cambios' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ─── TAB: DOCUMENTACIÓN ─────────────────────────────────── -->
      <div v-if="tab === 'docs'" class="api-section">

        <!-- URL Base -->
        <div class="api-card" :class="isDark ? 'api-card-dark' : 'api-card-light'">
          <div class="api-card-head" :class="isDark ? 'api-card-head-dark' : 'api-card-head-light'">
            <i class="fas fa-link text-[10px]" style="color:#FF8F00"></i>
            <span class="api-card-title" :class="isDark ? 'text-white' : 'text-slate-700'">URL base del API</span>
          </div>
          <div class="api-card-body">
            <div class="api-url-bar" :class="isDark ? 'api-url-dark' : 'api-url-light'">
              <span class="flex-1 truncate font-mono text-[11px] text-emerald-400">{{ apiBase }}</span>
              <button @click="copiarTexto(apiBase)" class="api-copy-btn">
                <i class="fas fa-copy text-[9px]"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Bloque autenticación -->
        <div class="api-card" :class="isDark ? 'api-card-dark' : 'api-card-light'">
          <div class="api-card-head" :class="isDark ? 'api-card-head-dark' : 'api-card-head-light'">
            <i class="fas fa-shield-halved text-[10px]" style="color:#FF8F00"></i>
            <span class="api-card-title" :class="isDark ? 'text-white' : 'text-slate-700'">1 · Autenticación</span>
          </div>
          <div class="api-card-body">
            <pre class="api-pre api-pre-green">{{ ejemploAuth }}</pre>
          </div>
        </div>

        <!-- Bloque consultar asistencias -->
        <div class="api-card" :class="isDark ? 'api-card-dark' : 'api-card-light'">
          <div class="api-card-head" :class="isDark ? 'api-card-head-dark' : 'api-card-head-light'">
            <i class="fas fa-calendar-check text-[10px]" style="color:#FF8F00"></i>
            <span class="api-card-title" :class="isDark ? 'text-white' : 'text-slate-700'">2 · Consultar asistencias</span>
          </div>
          <div class="api-card-body">
            <pre class="api-pre api-pre-sky">{{ ejemploAsistencias }}</pre>
          </div>
        </div>

        <!-- Python -->
        <div class="api-card" :class="isDark ? 'api-card-dark' : 'api-card-light'">
          <div class="api-card-head" :class="isDark ? 'api-card-head-dark' : 'api-card-head-light'">
            <i class="fab fa-python text-[10px]" style="color:#FF8F00"></i>
            <span class="api-card-title" :class="isDark ? 'text-white' : 'text-slate-700'">Ejemplo Python</span>
            <button @click="copiarTexto(ejemploPython)" class="api-copy-text-btn" :class="isDark ? 'api-copy-text-dark' : 'api-copy-text-light'">
              <i class="fas fa-copy text-[8px]"></i> Copiar
            </button>
          </div>
          <div class="api-card-body">
            <pre class="api-pre api-pre-yellow">{{ ejemploPython }}</pre>
          </div>
        </div>

        <!-- JavaScript -->
        <div class="api-card" :class="isDark ? 'api-card-dark' : 'api-card-light'">
          <div class="api-card-head" :class="isDark ? 'api-card-head-dark' : 'api-card-head-light'">
            <i class="fab fa-js-square text-[10px]" style="color:#FF8F00"></i>
            <span class="api-card-title" :class="isDark ? 'text-white' : 'text-slate-700'">Ejemplo JavaScript / Node.js</span>
            <button @click="copiarTexto(ejemploJs)" class="api-copy-text-btn" :class="isDark ? 'api-copy-text-dark' : 'api-copy-text-light'">
              <i class="fas fa-copy text-[8px]"></i> Copiar
            </button>
          </div>
          <div class="api-card-body">
            <pre class="api-pre api-pre-amber">{{ ejemploJs }}</pre>
          </div>
        </div>

        <!-- Respuesta JSON -->
        <div class="api-card" :class="isDark ? 'api-card-dark' : 'api-card-light'">
          <div class="api-card-head" :class="isDark ? 'api-card-head-dark' : 'api-card-head-light'">
            <i class="fas fa-code text-[10px]" style="color:#FF8F00"></i>
            <span class="api-card-title" :class="isDark ? 'text-white' : 'text-slate-700'">Respuesta JSON esperada</span>
          </div>
          <div class="api-card-body">
            <pre class="api-pre api-pre-slate">{{ ejemploRespuesta }}</pre>
          </div>
        </div>

        <!-- Parámetros -->
        <div class="api-card" :class="isDark ? 'api-card-dark' : 'api-card-light'">
          <div class="api-card-head" :class="isDark ? 'api-card-head-dark' : 'api-card-head-light'">
            <i class="fas fa-sliders text-[10px]" style="color:#FF8F00"></i>
            <span class="api-card-title" :class="isDark ? 'text-white' : 'text-slate-700'">Parámetros de consulta</span>
          </div>
          <div class="api-table-wrap">
            <div class="api-thead" :class="isDark ? 'api-thead-dark' : 'api-thead-light'">
              <span class="api-th w-36">Parámetro</span>
              <span class="api-th w-44">Tipo</span>
              <span class="api-th flex-1">Descripción</span>
            </div>
            <div class="api-tbody">
              <div v-for="p in parametros" :key="p.nombre"
                class="api-tr" :class="isDark ? 'api-tr-dark' : 'api-tr-light'">
                <div class="w-36 shrink-0">
                  <code class="api-param-name">{{ p.nombre }}</code>
                </div>
                <div class="w-44 shrink-0">
                  <span class="api-tr-code" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ p.tipo }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <span class="api-tr-desc" :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ p.desc }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div><!-- /api-body -->

    <!-- ── TOAST ───────────────────────────────────────────────────── -->
    <Transition name="api-toast">
      <div v-if="toastMsg" class="api-toast">
        <i class="fas fa-check-circle text-emerald-400 text-[10px]"></i>
        <span>{{ toastMsg }}</span>
      </div>
    </Transition>

    <!-- ── MODAL ELIMINAR ─────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="api-toast">
        <div v-if="credAEliminar" class="api-modal-overlay" @click.self="credAEliminar = null">
          <div class="api-modal" :class="isDark ? 'api-modal-dark' : 'api-modal-light'">
            <div class="api-modal-head" :class="isDark ? 'api-mhead-dark' : 'api-mhead-light'">
              <div class="api-modal-icon">
                <i class="fas fa-triangle-exclamation text-red-400 text-[12px]"></i>
              </div>
              <p class="api-modal-title" :class="isDark ? 'text-white' : 'text-slate-800'">Eliminar credencial</p>
            </div>
            <div class="api-modal-body">
              <p class="api-modal-text" :class="isDark ? 'text-slate-300' : 'text-slate-600'">
                ¿Eliminar <strong>{{ credAEliminar?.nombre }}</strong> ({{ credAEliminar?.username }})?
                Los sistemas que la usen perderán acceso.
              </p>
            </div>
            <div class="api-modal-foot" :class="isDark ? 'api-mfoot-dark' : 'api-mfoot-light'">
              <button @click="credAEliminar = null" class="api-btn-ghost" :class="isDark ? 'api-ghost-dark' : 'api-ghost-light'">
                Cancelar
              </button>
              <button @click="eliminarCredencial" class="api-btn-danger">
                <i class="fas fa-trash-can text-[9px]"></i> Eliminar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({ isDark: Boolean });
const emit  = defineEmits(['success', 'error']);

const API_URL = import.meta.env.VITE_API_URL;

const tabs = [
  { key: 'credenciales', icon: 'fas fa-key',        label: 'Credenciales'    },
  { key: 'campos',       icon: 'fas fa-table-list',  label: 'Campos expuestos'},
  { key: 'docs',         icon: 'fas fa-book-open',   label: 'Documentación'   },
];
const tab = ref('credenciales');

const credenciales  = ref([]);
const campos        = ref([]);
const loadingList   = ref(false);
const loadingCred   = ref(false);
const loadingCampos = ref(false);
const savingCampos  = ref(false);
const showPass      = ref(false);
const toastMsg      = ref('');
const credAEliminar = ref(null);

const nueva = ref({ nombre: '', username: '', password: '' });

const tiposCampo = {
  cedula:        'Number',
  nombre:        'Text',
  inicio_turno:  'Timestamp',
  fin_turno:     'Timestamp',
  fecha_entrada: 'Timestamp',
  fecha_salida:  'Timestamp',
};

const parametros = [
  { nombre: 'fechaInicio', tipo: 'string (YYYY-MM-DD)', desc: 'Fecha inicial del rango (requerido)' },
  { nombre: 'fechaFin',    tipo: 'string (YYYY-MM-DD)', desc: 'Fecha final del rango (requerido)'   },
  { nombre: 'cedula',      tipo: 'string',              desc: 'Filtrar por cédula de un colaborador (opcional)' },
];

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

BASE     = "${apiBase.value}"
TOKEN    = "mi_token_aqui"    # token estático (cópialo desde la tabla)

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

const formatFecha = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const toast = (msg, ms = 2500) => {
  toastMsg.value = msg;
  setTimeout(() => (toastMsg.value = ''), ms);
};

const copiarToken  = async (t)  => { await navigator.clipboard.writeText(t);    toast('Token copiado'); };
const copiarTexto  = async (tx) => { await navigator.clipboard.writeText(tx);   toast('Copiado al portapapeles'); };

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

const confirmarEliminar  = (c) => { credAEliminar.value = c; };

const eliminarCredencial = async () => {
  if (!credAEliminar.value) return;
  try {
    await fetch(`${API_URL}/superadmin/api-externa/credenciales/${credAEliminar.value.id}`, { method: 'DELETE' });
    credAEliminar.value = null;
    await fetchCredenciales();
    emit('success', 'Credencial eliminada');
  } catch { emit('error', 'Error al eliminar'); }
};

const regenerarToken = async (id) => {
  try {
    await fetch(`${API_URL}/superadmin/api-externa/credenciales/${id}/regenerar-token`, { method: 'POST' });
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
      body: JSON.stringify({ campos: campos.value.map((c) => ({ campo: c.campo, activo: c.activo })) }),
    });
    emit('success', 'Campos actualizados');
    toast('Campos guardados correctamente');
  } catch { emit('error', 'Error al guardar campos'); }
  finally { savingCampos.value = false; }
};

onMounted(async () => { await Promise.all([fetchCredenciales(), fetchCampos()]); });
</script>

<style scoped>
/* ── ROOT ─────────────────────────────────────────────────── */
.api-root {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', system-ui, sans-serif;
  overflow: hidden;
}
.api-dark  { background: #1e2535; color: #fff; }
.api-light { background: #f8fafc; color: #1e293b; }

/* ── HEADER ───────────────────────────────────────────────── */
.api-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 14px;
  flex-shrink: 0;
}
.api-header-left { display: flex; align-items: center; gap: 12px; }
.api-header-icon {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.api-icon-dark  { background: rgba(255,143,0,.1);  border: 1px solid rgba(255,143,0,.18); }
.api-icon-light { background: rgba(255,143,0,.08); border: 1px solid rgba(255,143,0,.14); }
.api-title      { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: .05em; line-height: 1; }
.api-title-sub  { font-weight: 400; font-size: 12px; }
.api-subtitle   { font-size: 10px; font-weight: 500; margin-top: 3px; letter-spacing: .02em; }

/* ── TABS ─────────────────────────────────────────────────── */
.api-tabs {
  display: flex; gap: 0;
  padding: 0 24px;
  border-bottom: 1px solid;
  flex-shrink: 0;
}
.api-tabs-dark  { border-color: rgba(255,255,255,.07); }
.api-tabs-light { border-color: #e2e8f0; }

.api-tab {
  position: relative;
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 16px;
  font-size: 10px; font-weight: 800;
  text-transform: uppercase; letter-spacing: .08em;
  cursor: pointer; border: none; background: none;
  transition: color .15s;
}
.api-tab-active           { color: #FF8F00; }
.api-tab-idle-dark        { color: rgba(255,255,255,.35); }
.api-tab-idle-dark:hover  { color: rgba(255,255,255,.7); }
.api-tab-idle-light       { color: #94a3b8; }
.api-tab-idle-light:hover { color: #475569; }

.api-tab-indicator {
  position: absolute; bottom: -1px; left: 16px; right: 16px;
  height: 2px; border-radius: 2px 2px 0 0;
  background: #FF8F00;
}

/* ── BODY / SCROLL ────────────────────────────────────────── */
.api-body {
  flex: 1; min-height: 0;
  overflow-y: auto;
  padding: 20px 24px;
}
.api-body::-webkit-scrollbar        { width: 4px; }
.api-body::-webkit-scrollbar-track  { background: transparent; }
.api-body::-webkit-scrollbar-thumb  { border-radius: 2px; background: rgba(100,116,139,.2); }
.api-body::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,.4); }
.api-body { scrollbar-width: thin; scrollbar-color: rgba(100,116,139,.2) transparent; }

.api-section { display: flex; flex-direction: column; gap: 14px; }

/* ── CARDS ────────────────────────────────────────────────── */
.api-card {
  border-radius: 12px; border: 1px solid; overflow: hidden;
}
.api-card-dark  { background: rgba(255,255,255,.02); border-color: rgba(255,255,255,.07); }
.api-card-light { background: #fff; border-color: #e2e8f0; box-shadow: 0 1px 6px rgba(0,0,0,.05); }

.api-card-head {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-bottom: 1px solid;
}
.api-card-head-dark  { border-color: rgba(255,255,255,.06); }
.api-card-head-light { border-color: #f1f5f9; background: #fafbfc; }

.api-card-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }

.api-count-badge {
  margin-left: auto;
  background: rgba(255,143,0,.15); color: #FF8F00;
  font-size: 9px; font-weight: 900;
  padding: 1px 7px; border-radius: 999px;
}

.api-card-body { padding: 14px; }

.api-card-foot {
  padding: 10px 14px; border-top: 1px solid; display: flex; justify-content: flex-end;
}
.api-foot-dark  { border-color: rgba(255,255,255,.06); }
.api-foot-light { border-color: #f1f5f9; }

.api-desc { padding: 10px 14px 0; font-size: 10px; font-weight: 400; }

/* ── FORM ─────────────────────────────────────────────────── */
.api-form-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 12px; margin-bottom: 12px;
}
@media (max-width: 700px) { .api-form-grid { grid-template-columns: 1fr; } }

.api-field { display: flex; flex-direction: column; gap: 4px; }
.api-label {
  font-size: 8.5px; font-weight: 900;
  text-transform: uppercase; letter-spacing: .14em;
}
.api-input {
  padding: 7px 10px; border-radius: 8px; border: 1px solid;
  font-size: 11px; font-weight: 500; outline: none;
  transition: border-color .15s;
}
.api-input-dark  { background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.1); color: #fff; }
.api-input-dark:focus  { border-color: rgba(255,143,0,.5); }
.api-input-light { background: #f8fafc; border-color: #e2e8f0; color: #1e293b; }
.api-input-light:focus { border-color: rgba(255,143,0,.6); }
.api-input-pr   { padding-right: 34px; }

.api-input-wrap { position: relative; }
.api-eye-btn {
  position: absolute; right: 9px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; color: #94a3b8;
  transition: color .15s;
}
.api-eye-btn:hover { color: #64748b; }

/* ── BOTÓN PRIMARIO ───────────────────────────────────────── */
.api-btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 16px; border-radius: 8px; border: none;
  background: #FF8F00; color: #000;
  font-size: 10px; font-weight: 900;
  text-transform: uppercase; letter-spacing: .08em;
  cursor: pointer; transition: all .15s;
}
.api-btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
.api-btn-primary:disabled { opacity: .5; cursor: default; }

/* ── TABLA ────────────────────────────────────────────────── */
.api-table-wrap { display: flex; flex-direction: column; }

.api-thead {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 14px;
}
.api-thead-dark  { background: rgba(255,255,255,.03); }
.api-thead-light { background: #f8fafc; }

.api-th {
  font-size: 8.5px; font-weight: 900;
  text-transform: uppercase; letter-spacing: .14em; color: #64748b;
}

.api-tcol-name   { flex: 1;      min-width: 0; }
.api-tcol-user   { width: 110px; flex-shrink: 0; }
.api-tcol-token  { width: 160px; flex-shrink: 0; }
.api-tcol-status { width: 80px;  flex-shrink: 0; }
.api-tcol-uso    { width: 110px; flex-shrink: 0; }
.api-tcol-acts   { width: 100px; flex-shrink: 0; }

.api-tbody { display: flex; flex-direction: column; }

.api-tr {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-top: 1px solid;
  transition: background .12s;
}
.api-tr-dark  { border-color: rgba(255,255,255,.05); }
.api-tr-dark:hover  { background: rgba(255,255,255,.03); }
.api-tr-light { border-color: #f1f5f9; }
.api-tr-light:hover { background: #fafbfc; }

.api-tr-name  { font-size: 11px; font-weight: 700; }
.api-tr-code  { font-family: monospace; font-size: 10px; }
.api-tr-token { font-family: monospace; font-size: 9px; }
.api-tr-uso   { font-size: 9px; font-weight: 600; }
.api-tr-desc  { font-size: 10px; }

/* ── STATUS BADGE ─────────────────────────────────────────── */
.api-status-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 8px; border-radius: 999px;
  font-size: 9px; font-weight: 700; text-transform: uppercase;
}
.api-badge-green { background: rgba(52,211,153,.1);  color: #34d399; }
.api-badge-red   { background: rgba(239,68,68,.1);   color: #f87171; }
.api-badge-dot   { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

/* ── ICONOS ACCIÓN ────────────────────────────────────────── */
.api-icon-btn {
  width: 28px; height: 28px; border-radius: 7px; border: 1px solid;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .15s; flex-shrink: 0; background: transparent;
}
.api-icon-btn:hover { filter: brightness(1.2); }

.api-icon-orange { border-color: rgba(255,143,0,.3);  color: #FF8F00; }
.api-icon-orange:hover { background: rgba(255,143,0,.1); }
.api-icon-green  { border-color: rgba(52,211,153,.3); color: #34d399; }
.api-icon-green:hover  { background: rgba(52,211,153,.1); }
.api-icon-slate  { border-color: rgba(100,116,139,.3);color: #94a3b8; }
.api-icon-slate:hover  { background: rgba(100,116,139,.1); }
.api-icon-red    { border-color: rgba(239,68,68,.3);  color: #f87171; }
.api-icon-red:hover    { background: rgba(239,68,68,.1); }

.api-copy-btn {
  background: none; border: none; cursor: pointer;
  color: #FF8F00; transition: opacity .15s; opacity: .7;
}
.api-copy-btn:hover { opacity: 1; }

/* ── CAMPOS ───────────────────────────────────────────────── */
.api-campo-label { font-size: 11px; font-weight: 700; }
.api-campo-key   { font-family: monospace; font-size: 9px; opacity: .5; }

.api-tipo-chip {
  display: inline-block; padding: 2px 7px; border-radius: 5px; border: 1px solid;
  font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em;
}
.api-tipo-dark  { background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.1); color: #94a3b8; }
.api-tipo-light { background: #f1f5f9; border-color: #e2e8f0; color: #64748b; }

.api-toggle {
  position: relative; width: 36px; height: 20px;
  border-radius: 999px; border: none; cursor: pointer;
  transition: background .2s; flex-shrink: 0;
}
.api-toggle-on        { background: #FF8F00; }
.api-toggle-off-dark  { background: rgba(255,255,255,.12); }
.api-toggle-off-light { background: #cbd5e1; }
.api-toggle-knob {
  position: absolute; top: 2px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.25);
  transition: transform .2s;
}

/* ── DOCS ─────────────────────────────────────────────────── */
.api-url-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border-radius: 8px; border: 1px solid;
}
.api-url-dark  { background: rgba(15,23,42,.8); border-color: rgba(255,255,255,.08); }
.api-url-light { background: #0f172a;           border-color: #1e293b; }

.api-pre {
  border-radius: 8px; padding: 14px; font-size: 10px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  line-height: 1.7; overflow-x: auto; background: #0f172a;
  white-space: pre;
}
.api-pre::-webkit-scrollbar { height: 3px; }
.api-pre::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 2px; }

.api-pre-green  { color: #6ee7b7; }
.api-pre-sky    { color: #7dd3fc; }
.api-pre-yellow { color: #fde68a; }
.api-pre-amber  { color: #fcd34d; }
.api-pre-slate  { color: #cbd5e1; }

.api-param-name { font-family: monospace; font-size: 10px; color: #FF8F00; font-weight: 700; }

.api-copy-text-btn {
  margin-left: auto; display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 6px; border: 1px solid;
  font-size: 9px; font-weight: 700; cursor: pointer; transition: all .15s;
}
.api-copy-text-dark  { background: transparent; border-color: rgba(255,255,255,.1); color: #94a3b8; }
.api-copy-text-dark:hover  { color: #fff; background: rgba(255,255,255,.06); }
.api-copy-text-light { background: #fff; border-color: #e2e8f0; color: #64748b; }
.api-copy-text-light:hover { border-color: #cbd5e1; color: #1e293b; }

/* ── TOAST ────────────────────────────────────────────────── */
.api-toast {
  position: absolute; bottom: 20px; right: 20px; z-index: 50;
  display: flex; align-items: center; gap: 8px;
  padding: 9px 16px; border-radius: 10px;
  background: rgba(6,78,59,.9); border: 1px solid rgba(52,211,153,.25);
  color: #6ee7b7; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em;
  box-shadow: 0 8px 24px rgba(0,0,0,.3);
}
.api-toast-enter-active, .api-toast-leave-active { transition: all .25s ease; }
.api-toast-enter-from, .api-toast-leave-to { opacity: 0; transform: translateY(8px); }

/* ── MODAL ────────────────────────────────────────────────── */
.api-modal-overlay {
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: center; justify-content: center; padding: 16px;
  background: rgba(0,0,0,.55);
}
.api-modal {
  width: 100%; max-width: 380px;
  border-radius: 14px; border: 1px solid; overflow: hidden;
}
.api-modal-dark  { background: #1e2538; border-color: rgba(255,255,255,.1); box-shadow: 0 24px 60px rgba(0,0,0,.5); }
.api-modal-light { background: #fff;    border-color: #e2e8f0;              box-shadow: 0 24px 60px rgba(0,0,0,.15); }

.api-modal-head {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 18px; border-bottom: 1px solid;
}
.api-mhead-dark  { border-color: rgba(255,255,255,.08); }
.api-mhead-light { border-color: #f1f5f9; }

.api-modal-icon {
  width: 32px; height: 32px; border-radius: 9px;
  background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.2);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.api-modal-title { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }

.api-modal-body { padding: 14px 18px; }
.api-modal-text { font-size: 11px; line-height: 1.6; }

.api-modal-foot {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 18px; border-top: 1px solid;
}
.api-mfoot-dark  { border-color: rgba(255,255,255,.06); }
.api-mfoot-light { border-color: #f1f5f9; }

.api-btn-ghost {
  padding: 6px 14px; border-radius: 8px; border: 1px solid;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  cursor: pointer; transition: all .15s; background: transparent;
}
.api-ghost-dark  { border-color: rgba(255,255,255,.12); color: #94a3b8; }
.api-ghost-dark:hover  { color: #fff; background: rgba(255,255,255,.06); }
.api-ghost-light { border-color: #e2e8f0; color: #64748b; }
.api-ghost-light:hover { border-color: #cbd5e1; color: #1e293b; }

.api-btn-danger {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 8px; border: none;
  background: #ef4444; color: #fff;
  font-size: 10px; font-weight: 900;
  text-transform: uppercase; letter-spacing: .06em;
  cursor: pointer; transition: all .15s;
}
.api-btn-danger:hover { background: #dc2626; }
</style>
