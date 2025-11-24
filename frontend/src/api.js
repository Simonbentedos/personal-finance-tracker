import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Attach token from localStorage for every request
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('m3r_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// Better error messages for network issues
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network or CORS error
      error.message = 'Network error: Unable to reach API server';
      console.error('API network error', error);
    }
    return Promise.reject(error);
  }
);

export default api;
