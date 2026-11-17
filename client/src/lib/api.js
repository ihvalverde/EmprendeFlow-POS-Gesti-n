import axios from 'axios';
import { useAuthStore } from '../stores/auth.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const absoluteBase = (() => {
  try {
    return new URL(API_BASE, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
})();

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 25000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthRoute = original?.url?.includes('/auth/');

    if (!original || error.response?.status !== 401 || original._retry || isAuthRoute) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
          .finally(() => {
            setTimeout(() => {
              refreshPromise = null;
            }, 0);
          });
      }

      const { data } = await refreshPromise;
      useAuthStore.getState().setAccessToken(data.accessToken);
      if (data.user) useAuthStore.getState().setUser(data.user);
      original.headers = { ...original.headers, Authorization: `Bearer ${data.accessToken}` };
      return api(original);
    } catch (refreshError) {
      useAuthStore.getState().clear();
      return Promise.reject(refreshError);
    }
  }
);

export function assetUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  return `${absoluteBase}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function apiErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Ocurrió un error. Intenta nuevamente.'
  );
}

export function apiFieldErrors(error) {
  const errors = error?.response?.data?.errors;
  if (!Array.isArray(errors)) return {};
  return errors.reduce((acc, item) => {
    if (item?.path) acc[item.path] = item.message;
    return acc;
  }, {});
}

export async function downloadExport(path, filename) {
  const response = await api.get(path, { responseType: 'blob' });
  const contentType = response.headers['content-type'];
  const fallbackType = /\.pdf$/i.test(filename) ? 'application/pdf' : 'text/csv;charset=utf-8;';
  const blob = new Blob([response.data], { type: contentType || fallbackType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
