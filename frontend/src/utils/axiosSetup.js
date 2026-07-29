import axios from 'axios';

const SESSION_KEY = 'user_session';
let redirectingToLogin = false;

// Origin del backend (host:puerto), derivado de VITE_API_URL quitando la ruta.
// Ej: "http://localhost:8082/usuarios" -> "http://localhost:8082"
function getBackendOrigin() {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:8082';
  try {
    return new URL(raw).origin;
  } catch {
    return raw.replace(/\/usuarios\/?$/, '');
  }
}

function getToken() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.token ?? null;
  } catch {
    return null;
  }
}

function isBackendUrl(url) {
  if (typeof url !== 'string') return true; // axios relativo al baseURL → asumimos backend
  const origin = getBackendOrigin();
  return url.startsWith(origin) || url.startsWith('/');
}

export function setupAxiosInterceptors() {
  // Request: adjuntar el token a peticiones al backend
  axios.interceptors.request.use(
    (config) => {
      const token = getToken();
      const url = config.url || '';
      if (token && isBackendUrl(url)) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response: ante 401 con token presente, limpiar sesión y redirigir a login
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      const url = error?.config?.url || '';
      const token = getToken();
      if (
        status === 401 &&
        token &&
        isBackendUrl(url) &&
        !redirectingToLogin &&
        !window.location.pathname.includes('/login')
      ) {
        redirectingToLogin = true;
        localStorage.removeItem(SESSION_KEY);
        window.location.href = '/login';
      }

      // Sistema bajo presión (memoria/concurrencia): el backend rechazó una
      // consulta pesada con 503. En vez de un error feo, mostramos un mensaje
      // amable de "vuelve a intentar" y marcamos el error para que el llamador
      // pueda ofrecer reintento en línea si quiere.
      const data = error?.response?.data;
      if (status === 503 && data?.code === 'SISTEMA_OCUPADO') {
        const mensaje =
          data.message ||
          'Ups, esto podría tardar un poco. Intenta de nuevo en unos segundos.';
        error.sistemaOcupado = true;
        error.mensajeAmable = mensaje;
        window.dispatchEvent(
          new CustomEvent('sistema-ocupado', { detail: { message: mensaje } }),
        );
      }

      return Promise.reject(error);
    },
  );
}
