import axios from 'axios';

const DEFAULT_API_ORIGIN = 'http://localhost:5001';

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const upgradeToHttpsWhenNeeded = (value = '') => {
  if (!value) return '';

  const trimmedValue = trimTrailingSlash(value.trim());

  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    /^http:\/\//i.test(trimmedValue) &&
    !/^http:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/i.test(trimmedValue)
  ) {
    return trimmedValue.replace(/^http:\/\//i, 'https://');
  }

  return trimmedValue;
};

const rawApiBaseUrl = upgradeToHttpsWhenNeeded(import.meta.env.VITE_API_BASE_URL || '');
const rawApiOrigin = upgradeToHttpsWhenNeeded(import.meta.env.VITE_API_ORIGIN || '');
const fallbackApiOrigin = upgradeToHttpsWhenNeeded(DEFAULT_API_ORIGIN || '');

export const API_ORIGIN = trimTrailingSlash(
  rawApiOrigin || rawApiBaseUrl?.replace(/\/api\/?$/, '') || fallbackApiOrigin
);

export const API_BASE_URL = trimTrailingSlash(
  rawApiBaseUrl || `${API_ORIGIN}/api`
);

export const toApiAssetUrl = (path = '') => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}/${path.replace(/^\/+/, '')}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
