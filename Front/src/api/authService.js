// src/api/authService.js
import apiClient from './apiClient';

// Ahora usamos el path completo con '/api'
export const login = async (username, password) => {
  const response = await apiClient.post('/api/login/', { username, password }); 
  return response.data; 
};

export const register = async (data) => {
  const response = await apiClient.post('/api/register/', data); 
  return response.data;
};

export const getProfile = async () => {
  const response = await apiClient.get('/api/profile/'); 
  return response.data; 
};

export const logout = async () => {
  const response = await apiClient.post('/api/logout/'); 
  return response.data;
};

export const updateProfile = async (data) => {
  // Si enviamos FormData, no forzar Content-Type para que axios ponga multipart/form-data
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const response = await apiClient.patch('/api/usuarios/me/', data, isFormData ? { headers: { 'Content-Type': undefined } } : undefined);
  return response.data;
};

export const getMyProfile = async () => {
  const response = await apiClient.get('/api/usuarios/me/');
  return response.data;
};
// ...