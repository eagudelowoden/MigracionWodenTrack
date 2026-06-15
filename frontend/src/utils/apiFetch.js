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
    redirectingToLogin = true;
    localStorage.removeItem(SESSION_KEY);
    window.location.href = '/login';
  }

  return response;
}
