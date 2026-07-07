import axios from 'axios';
import ENV from '../config/env';

const API = axios.create({
  baseURL: ENV.baseAPI,
  timeout: ENV.apiTimeoutMs,
});

export const getApiErrorMessage = (error, fallback = 'Something went wrong') => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === 'ECONNABORTED') {
    return `Request timed out after ${ENV.apiTimeoutMs / 1000} seconds. Please check if the backend is awake and reachable.`;
  }
  if (error.request && !error.response) {
    return 'Cannot reach the backend server. Please check the API URL, CORS settings, and server status.';
  }
  return error.message || fallback;
};

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.metadata = { startedAt: Date.now() };
  console.info('[API] request', {
    method: config.method?.toUpperCase(),
    url: `${config.baseURL}${config.url}`,
    timeout: config.timeout,
  });

  return config;
});

API.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startedAt;
    console.info('[API] response', {
      method: response.config.method?.toUpperCase(),
      url: `${response.config.baseURL}${response.config.url}`,
      status: response.status,
      duration,
    });
    return response;
  },
  (error) => {
    const config = error.config || {};
    const duration = config.metadata?.startedAt ? Date.now() - config.metadata.startedAt : null;

    console.error('[API] error', {
      method: config.method?.toUpperCase(),
      url: config.baseURL && config.url ? `${config.baseURL}${config.url}` : config.url,
      status: error.response?.status,
      code: error.code,
      duration,
      message: getApiErrorMessage(error),
    });

    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }

    error.userMessage = getApiErrorMessage(error);
    return Promise.reject(error);
  }
);

export default API;
