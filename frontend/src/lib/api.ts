import axios from 'axios';

// Environment validation for production
const getApiUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction && !apiUrl) {
    console.error('❌ CONFIGURATION ERROR: NEXT_PUBLIC_API_URL is not set in production');
    throw new Error('Backend API URL is not configured. Please set NEXT_PUBLIC_API_URL in Vercel Environment Variables.');
  }
  
  // Default to localhost for development
  return apiUrl || 'http://localhost:4000/api/v1';
};

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token from authStore or localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      let token: string | null = null;
      try {
        const useAuthStore = require('@/store/authStore').default;
        token = useAuthStore.getState().token;
      } catch {}

      if (!token) {
        const storage = localStorage.getItem('fcs-auth-storage');
        if (storage) {
          token = JSON.parse(storage)?.state?.token;
        }
      }

      if (!token) {
        token = localStorage.getItem('fcs_token');
      }

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore parse errors
    }
  }
  return config;
});

// Response interceptor — unwrap transform envelope + normalize errors
api.interceptors.response.use(
  (response) => {
    // If backend returns { success, statusCode, data, message } envelope
    if (response.data && typeof response.data.success === 'boolean') {
      return response;
    }
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'An unexpected error occurred';

    // Auto-redirect to login on 401 only if not already on a login route
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const isLoginPage = window.location.pathname.startsWith('/login');
      if (!isLoginPage) {
        try {
          const useAuthStore = require('@/store/authStore').default;
          useAuthStore.getState().logout();
        } catch {
          localStorage.removeItem('fcs_token');
          localStorage.removeItem('fcs_user');
          localStorage.removeItem('fcs-auth-storage');
        }
        window.location.href = '/login';
      }
    }

    return Promise.reject({
      ...error,
      message: Array.isArray(message) ? message[0] : message,
      statusCode: error.response?.status || 500,
    });
  }
);

export default api;
