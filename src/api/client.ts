import axios from 'axios';
import { getAuthHeaders } from '../utils/api.utils';
import { createDedupedAdapter } from './request-dedupe';

const normalizeBaseUrl = (value?: string) => (value || '').trim().replace(/\/+$/, '');

export const API_TARGET_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_PROXY_TARGET || 'http://api-businesscard.setclapp.com'
);
export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : API_TARGET_URL)
);

export const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000);

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: API_TIMEOUT_MS,
});

export const publicAxiosInstance = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: API_TIMEOUT_MS,
});

[axiosInstance, publicAxiosInstance].forEach((instance) => {
  instance.defaults.adapter = createDedupedAdapter(axios.getAdapter(axios.defaults.adapter));
});

const isAuthFreeEndpoint = (url = '') => {
  return url.includes('/api/Auth/login');
};

const toOrigin = (value: string) => {
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
};

const TRUSTED_API_ORIGINS = new Set(
  [window.location.origin, toOrigin(API_BASE_URL), toOrigin(API_TARGET_URL)].filter(Boolean)
);

// Token yalnız öz API-mizə göndərilir; xarici şəkil URL-lərinə sızmamalıdır.
const isTrustedApiRequest = (url: string, baseURL?: string) => {
  try {
    const base = new URL(baseURL || '/', window.location.origin);
    return TRUSTED_API_ORIGINS.has(new URL(url, base).origin);
  } catch {
    return false;
  }
};

axiosInstance.interceptors.request.use(
  (config) => {
    if (isAuthFreeEndpoint(config.url || '') || !isTrustedApiRequest(config.url || '', config.baseURL)) {
      return config;
    }

    const { Authorization } = getAuthHeaders();

    if (Authorization) {
      config.headers.set?.('Authorization', Authorization);

      if (!config.headers.set) {
        config.headers.Authorization = Authorization;
      }
    }

    return config;
  },
  (error: unknown) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(error)
);
