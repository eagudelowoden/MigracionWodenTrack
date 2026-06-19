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
  if (typeof url !== 'string') return false;
  const origin = getBackendOrigin();
  // Cubre URLs absolutas al backend y rutas relativas (mismo host).
  return url.startsWith(origin) || url.startsWith('/');
}

export async function apiFetch(url, options = {}) {
  const token = getToken();

  if (token && isBackendUrl(url)) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  const response = await fetch(url, options);

  // Solo redirigir al login si el token existe pero el server lo rechaza,
  // y solo si no estamos ya en /login y no hay ya una redirección en curso.
  if (
    response.status === 401 &&
    isBackendUrl(url) &&
    token &&
    !redirectingToLogin &&
    !window.location.pathname.includes('/login')
  ) {
    // El backend puede estar reiniciando (deploy en producción) y devolver
    // un 401 transitorio mientras vuelve a estar disponible. Antes de cerrar
    // la sesión del usuario confirmamos con un reintento corto — solo para
    // peticiones de lectura (GET), para no duplicar acciones en POST/PUT/DELETE.
    const esLecturaSegura = !options.method || options.method.toUpperCase() === 'GET';

    if (esLecturaSegura) {
      await new Promise((r) => setTimeout(r, 1500));
      try {
        const retry = await fetch(url, options);
        if (retry.status !== 401) return retry; // era transitorio, ya respondió bien
      } catch {
        // El backend sigue sin responder (aún reiniciando): no forzamos logout,
        // el caller maneja el error de red como corresponda.
        return response;
      }
    }

    redirectingToLogin = true;
    localStorage.removeItem(SESSION_KEY);
    window.location.href = '/login';
  }

  return response;
}
