const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const getToken = () => localStorage.getItem('souqli_token');

export const request = async (path, options = {}) => {
  const { method = 'GET', body, token } = options;
  const headers = { 'Content-Type': 'application/json' };
  const authToken = token || getToken();

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
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
