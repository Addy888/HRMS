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

console.log('🌐 API Client initialized');
console.log('   Environment:', process.env.NODE_ENV);
console.log('   Base URL:', api.defaults.baseURL);

// Attach token from Zustand-persisted localStorage on every request
api.interceptors.request.use((config) => {
  console.log("🟡 REQUEST INTERCEPTOR - START");
  console.log("   URL:", config.url);
  console.log("   baseURL:", config.baseURL);
  console.log("   Full URL:", `${config.baseURL}${config.url}`);
  
  if (typeof window !== 'undefined') {
    try {
      // Zustand persist stores under 'fcs-auth-storage'
      const storage = localStorage.getItem('fcs-auth-storage');
      if (storage) {
        const parsed = JSON.parse(storage);
        const token = parsed?.state?.token;
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log("   Token attached:", token.substring(0, 20) + "...");
        }
      }
    } catch {
      // ignore parse errors
    }
  }
  
  console.log("🟢 REQUEST INTERCEPTOR - RETURNING CONFIG");
  return config;
});

// Response interceptor — unwrap transform envelope + normalize errors
api.interceptors.response.use(
  (response) => {
    console.log("🟢 RESPONSE INTERCEPTOR - SUCCESS");
    console.log("   Status:", response.status);
    console.log("   Data keys:", Object.keys(response.data || {}));
    
    // If backend returns { success, statusCode, data, message } envelope
    if (response.data && typeof response.data.success === 'boolean') {
      console.log("   Returning full response (envelope detected)");
      return response; // return full response; callers use .data
    }
    console.log("   Returning response as-is");
    return response;
  },
  (error) => {
    console.log("🔴 RESPONSE INTERCEPTOR - ERROR");
    console.log("   Error:", error.message);
    console.log("   Status:", error.response?.status);
    
    const message =
      error.response?.data?.message || error.message || 'An unexpected error occurred';

    // Auto-redirect to login on 401
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const isLoginPage = window.location.pathname === '/login';
      if (!isLoginPage) {
        console.log("🔴 401 ERROR - REDIRECTING TO LOGIN");
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
