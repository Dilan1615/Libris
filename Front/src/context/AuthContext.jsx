// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getProfile, login, register, logout } from '../api/authService';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Log cuando el usuario cambia
  useEffect(() => {
    console.log('👤 Usuario cambió:', user ? `${user.username} (${user.rol})` : 'null');
  }, [user]);

  // Intentar cargar el perfil al inicio para saber si hay una sesión activa (cookie)
  useEffect(() => {
    console.log('🔄 Iniciando carga de perfil inicial...');
    const loadUser = async () => {
      try {
        const profile = await getProfile();
        console.log('✅ Perfil cargado exitosamente:', profile);
        setUser(profile); // Si la petición tiene éxito (token válido), el usuario está logueado
      } catch (error) {
        console.log('⚠️ No hay sesión activa o token expirado:', error.response?.status);
        setUser(null); // Si falla (token inválido/expirado), no hay sesión
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogin = async (username, password) => {
    const loginResponse = await login(username, password); // Hace el login y el backend setea las cookies
    console.log('Login exitoso:', loginResponse);
    const profile = await getProfile(); // Obtiene el perfil del usuario recién logueado
    console.log('Perfil después del login:', profile);
    setUser(profile);
    localStorage.setItem('user', JSON.stringify(profile)); // Guardar en localStorage para persistencia
  };

  const handleLogout = async () => {
    console.log('🚪 Cerrando sesión...');
    await logout(); // Cierra la sesión en el backend y borra las cookies
    setUser(null);
    localStorage.removeItem('user'); // Limpiar localStorage
    console.log('✅ Sesión cerrada');
  };

  const value = {
    user,
    isLoading,
    isLoggedIn: !!user,
    isAdmin: user?.rol === 'ADMIN',
    login: handleLogin,
    register: register, // Asumiendo que el componente maneja el redireccionamiento después
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};