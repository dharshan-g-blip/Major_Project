import axios from 'axios';
import { handleMockRequest } from './mockDataAdapter';

// Detect if running in static hosting environments like Netlify without an active backend
const isStaticOrNetlifyHost = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host.includes('netlify.app') || host.includes('github.io') || host.includes('vercel.app');
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 4000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token and intercept on static hosts (e.g. Netlify)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('unfazed_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // On Netlify / static hosts, seamlessly serve requests from local data engine
    if (isStaticOrNetlifyHost() && !import.meta.env.VITE_REMOTE_BACKEND_URL) {
      const mockRes = handleMockRequest(config);
      if (mockRes) {
        config.adapter = () => Promise.resolve(mockRes);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle auth & automatic 404 fallback
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Transparent fallback: If an API endpoint returns 404, 500, or fails to connect,
    // seamlessly handle it with mockDataAdapter instead of showing an error to the user
    if (
      !error.response ||
      error.response.status >= 500 ||
      error.response.status === 404 ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED'
    ) {
      const mockRes = handleMockRequest(error.config);
      if (mockRes) {
        return Promise.resolve(mockRes);
      }
    }

    if (error.response?.status === 401) {
      // Clear token if expired or invalid
      if (window.location.pathname.startsWith('/therapist')) {
        localStorage.removeItem('unfazed_token');
        localStorage.removeItem('unfazed_role');
        localStorage.removeItem('unfazed_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
