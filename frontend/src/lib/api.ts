import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token from Zustand-persisted localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      // Zustand persist stores under 'fcs-auth-storage'
      const storage = localStorage.getItem('fcs-auth-storage');
      if (storage) {
        const parsed = JSON.parse(storage);
        const token = parsed?.state?.token;
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
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
      return response; // return full response; callers use .data
    }
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'An unexpected error occurred';

    // Auto-redirect to login on 401
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const isLoginPage = window.location.pathname === '/login';
      if (!isLoginPage) {
        localStorage.removeItem('fcs-auth-storage');
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
