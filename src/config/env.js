const backendURL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:2001').replace(/\/$/, '');

const ENV = {
  baseAPI: `${backendURL}/api`,
  baseURL: backendURL,
  apiTimeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000,
  demoMode: import.meta.env.VITE_DEMO_MODE === 'true' || false,
  demoEmail: import.meta.env.VITE_DEMO_EMAIL || '',
  demoPassword: import.meta.env.VITE_DEMO_PASSWORD || '',
};

export default ENV;
