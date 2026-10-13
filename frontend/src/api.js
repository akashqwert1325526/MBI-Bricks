import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 5000
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('mbi_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mbi_token');
    }
    // Return empty fallback array or object if network error occurs to prevent crash
    if (!err.response && err.message?.includes('Network Error')) {
      console.warn('Backend server connection fallback:', err.message);
      return Promise.resolve({ data: [] });
    }
    return Promise.reject(err);
  }
);

export default api;
