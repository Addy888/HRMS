import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor to dynamically attach headers
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const storage = localStorage.getItem('fcs-auth-storage');
    if (storage) {
      try {
        const parsed = JSON.parse(storage);
        const token = parsed?.state?.user?.token;
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error('Error parsing auth storage', e);
      }
    }
  }
  return config;
});

// Response Interceptor to wrap results and strip metadata wrapping
api.interceptors.response.use(
  (response) => {
    // If our API wraps in { success, statusCode, data, message }
    if (response.data && response.data.success !== undefined) {
      return response.data;
    }
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || 'An unexpected error occurred';
    return Promise.reject({
      ...error,
      message,
      statusCode: error.response?.status || 500,
    });
  }
);

export default api;
