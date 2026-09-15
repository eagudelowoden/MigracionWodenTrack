// frontend/src/main.js
import { createApp } from 'vue'
import './style.css'
import './assets/css/geist-typography.css' // Vercel-style tipografía global
import 'primeicons/primeicons.css'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'
import App from './App.vue'
import router from './router' // <--- Importa el router con seguridad desde el otro archivo
import { setupAxiosInterceptors } from './utils/axiosSetup.js'

// Registra el token JWT en todas las peticiones axios al backend
setupAxiosInterceptors()

// Preset compacto: el resto de la UI de admin usa texto 10-11px, el tamaño
// por defecto de PrimeVue (14px, celdas de 28px) se ve grande al lado. Se
// ajustan los tokens de tipografía y los componentes de calendario, no clases
// CSS sueltas (los nombres de clase internos cambian entre versiones).
const WodenPreset = definePreset(Aura, {
  semantic: {
    typography: { fontSize: '0.8125rem' },
    // Color de marca WodenTrack (#fd4c02) como primario global — reemplaza
    // el verde esmeralda por defecto de Aura en botones, checks, focus rings,
    // día seleccionado del DatePicker, opción resaltada del Select, etc.
    primary: {
      50: '#fff4ed', 100: '#ffe2d0', 200: '#ffc4a1', 300: '#ff9c68',
      400: '#ff7038', 500: '#fd4c02', 600: '#e64400', 700: '#c13600',
      800: '#9a2b00', 900: '#7d2400', 950: '#431000',
      color: '#fd4c02',
      contrastColor: '#ffffff',
      hoverColor: '#e64400',
      activeColor: '#c13600',
    },
    // Fondo de los campos (input/select/datepicker/textarea) en modo oscuro:
    // el mismo navy que ya usan las tarjetas de admin (#161B26), en vez del
    // gris-azulado por defecto de Aura — se ve como "parte de la tarjeta".
    formField: {
      background: 'light-dark(#ffffff, #161B26)',
      filledBackground: 'light-dark(#f8fafc, #161B26)',
      borderColor: 'light-dark({surface.300}, #222938)',
      hoverBorderColor: 'light-dark({surface.400}, #2A344A)',
    },
    list: {
      option: { fontSize: '0.75rem', padding: '0.375rem 0.625rem' },
    },
  },
  components: {
    datepicker: {
      date: { width: '1.5rem', height: '1.5rem' },
    },
    // Panel desplegable de Select/AutoComplete (el que se abre con las
    // opciones, ej. "Todos los departamentos") — hereda de "list" arriba,
    // pero se fija explícito acá porque select.option redefine su propio
    // fontSize/padding en vez de reusar el de list directamente.
    select: {
      option: { fontSize: '0.75rem', padding: '0.375rem 0.625rem' },
    },
    autocomplete: {
      option: { fontSize: '0.75rem', padding: '0.375rem 0.625rem' },
    },
  },
})

const app = createApp(App)
app.use(router) // Usa el router que SI tiene el beforeEach
// PrimeVue: componentes nuevos (tablas, inputs, autocomplete, gráficas,
// scheduler) se construyen con esta librería de aquí en adelante.
// darkModeSelector: '.dark' — la clase la sincroniza useAttendance.js sobre
// <html> cada vez que cambia isDark, así los componentes de PrimeVue heredan
// el mismo tema oscuro/claro que ya usa el resto de la app.
app.use(PrimeVue, {
  theme: {
    preset: WodenPreset,
    options: { darkModeSelector: '.dark', cssLayer: false },
  },
  locale: {
    startsWith: 'Empieza con', contains: 'Contiene', notContains: 'No contiene', endsWith: 'Termina con',
    equals: 'Igual a', notEquals: 'Distinto de', noFilter: 'Sin filtro',
    dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
    dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
    monthNames: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    today: 'Hoy', clear: 'Limpiar', dateFormat: 'dd/mm/yy', weekHeader: 'Sem',
    weak: 'Débil', medium: 'Media', strong: 'Fuerte', passwordPrompt: 'Ingresa una contraseña',
    emptyMessage: 'Sin resultados', emptyFilterMessage: 'Sin resultados',
    firstDayOfWeek: 1,
  },
})
app.mount('#app')
