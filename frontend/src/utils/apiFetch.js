const SESSION_KEY = 'user_session';

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
  const backendBase = import.meta.env.VITE_API_URL || 'http://localhost:8082';
  return url.startsWith(backendBase) || url.startsWith('/');
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

  if (response.status === 401 && isBackendUrl(url)) {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = '/login';
    return response;
  }

  return response;
}
