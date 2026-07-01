const ENV ={
  baseAPI: import.meta.env.VITE_BASE_API || 'http://localhost:5000/api/v1',
  baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5000',
  demoMode: import.meta.env.VITE_DEMO_MODE === 'true' || false,
  demoEmail: import.meta.env.VITE_DEMO_EMAIL || '',
  demoPassword: import.meta.env.VITE_DEMO_PASSWORD || '',
}
