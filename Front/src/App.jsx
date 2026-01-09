// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import HomePage from './pages/HomePage'; 
import AdminDashboard from './pages/AdminDashboard';
import DetalleMaterialPage from './pages/DetalleMaterialPage';
import LeerPage from './pages/LeerPage';

// Componente de Ruta Protegida (solo para usuarios logueados)
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, isLoading } = useAuth();
  if (isLoading) return <div>Cargando...</div>; 
  return isLoggedIn ? children : <Navigate to="/login" />;
};

// Componente de Ruta de Administrador (solo para usuarios 'ADMIN')
const AdminRoute = ({ children }) => {
    const { isAdmin, isLoading } = useAuth();
    if (isLoading) return <div>Cargando...</div>; 
    return isAdmin ? children : <Navigate to="/" />; // Redirigir a Home o Login si no es admin
};


function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Ruta Protegida para el Perfil */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } 
      />

      {/* Ruta Protegida para Admin */}
      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } 
      />

      {/* Rutas públicas para ver detalles y leer materiales */}
      <Route path="/material/:tipo/:id" element={<DetalleMaterialPage />} />
      <Route 
        path="/leer/:tipo/:id" 
        element={
          <ProtectedRoute>
            <LeerPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Añade el resto de tus rutas aquí... */}
      <Route path="*" element={<h1>404 Not Found</h1>} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;