// src/api/apiClient.js
import axios from 'axios';

// La URL base es solo el host y puerto
const API_BASE_URL = 'http://localhost:8000'; 

const apiClient = axios.create({
  baseURL: API_BASE_URL, // <-- ¡IMPORTANTE! Hemos quitado '/api' de aquí
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para logging de peticiones
apiClient.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Error en request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para logging de respuestas
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url}: ${response.status}`, response.data);
    return response;
  },
  (error) => {
    const url = error.config?.url || 'unknown';
    const method = error.config?.method?.toUpperCase() || 'unknown';
    const status = error.response?.status || 'no response';
    
    console.error(`❌ ${method} ${url}: ${status}`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;