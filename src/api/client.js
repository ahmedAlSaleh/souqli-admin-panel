const envBase = (import.meta.env.VITE_API_URL || '').trim();
const isLocalHostBase = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(envBase);

// In production, force same-origin if env accidentally points to localhost.
const resolvedBase = import.meta.env.PROD && isLocalHostBase ? '' : envBase;
// Default to same-origin so Apache/Nginx reverse proxy can route /api correctly.
export const API_BASE = resolvedBase ? resolvedBase.replace(/\/$/, '') : '';
const buildUrl = (path) => `${API_BASE}${path}`;

export const getToken = () => localStorage.getItem('souqli_token');

export const request = async (path, options = {}) => {
  const { method = 'GET', body, token } = options;
  const headers = { 'Content-Type': 'application/json' };
  const authToken = token || getToken();

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    const error = new Error(payload.message || 'Request failed');
    error.status = response.status;
    error.details = payload.errors || null;
    throw error;
  }

  return payload.data;
};

export const uploadFile = async (path, file, fields = {}, token) => {
  const headers = {};
  const authToken = token || getToken();
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const formData = new FormData();
  formData.append('image', file);
  Object.entries(fields || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers,
    body: formData
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const error = new Error(payload.message || 'Upload failed');
    error.status = response.status;
    error.details = payload.errors || null;
    throw error;
  }

  return payload.data;
};
