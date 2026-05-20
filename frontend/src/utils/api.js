import axios from 'axios';

const DEFAULT_API_ORIGIN = import.meta.VITE_API_ORIGIN;

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const rawApiOrigin = import.meta.env.VITE_API_ORIGIN?.trim();

export const API_ORIGIN = trimTrailingSlash(
  rawApiOrigin || rawApiBaseUrl?.replace(/\/api\/?$/, '') || DEFAULT_API_ORIGIN
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
