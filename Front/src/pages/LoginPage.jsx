import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/animations.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isLoggedIn, isAdmin, user } = useAuth();
  const navigate = useNavigate();

  // Si ya está logueado, redirigir según el rol
  if (isLoggedIn && user) {
    if (user.rol === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/profile');
    }
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(username, password);
      // El AuthContext ya carga el perfil después del login
      // Esperar un momento para que se actualice el user en el contexto
      setTimeout(() => {
        const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
        if (userFromStorage.rol === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/profile');
        }
      }, 100);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Credenciales inválidas. Inténtalo de nuevo.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Paleta moderna premium
  const palette = {
    pageBg: 'linear-gradient(135deg, #0f172a 0%, #1a1a2e 50%, #16213e 100%)',
    cardBg: 'rgba(30, 41, 59, 0.7)',
    cardBgHover: 'rgba(30, 41, 59, 0.85)',
    text: '#f1f5f9',
    textLight: '#cbd5e1',
    border: 'rgba(148, 163, 184, 0.2)',
    borderLight: 'rgba(148, 163, 184, 0.3)',
    primary: '#06b6d4',
    primaryHover: '#0891b2',
    accent: '#a855f7',
    inputBg: 'rgba(15, 23, 42, 0.6)',
    inputBorder: 'rgba(148, 163, 184, 0.2)',
  };

  const styles = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: palette.pageBg,
      color: palette.text,
      padding: '20px',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
    },
    container: {
      background: palette.cardBg,
      border: `1px solid ${palette.borderLight}`,
      borderRadius: '20px',
      padding: '50px 40px',
      maxWidth: '420px',
      width: '100%',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      animation: 'slideIn 0.5s ease',
      backdropFilter: 'blur(10px)',
    },
    header: {
      marginBottom: '35px',
      textAlign: 'center',
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      marginBottom: '8px',
      background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.accent} 100%)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    subtitle: {
      color: palette.textLight,
      fontSize: '14px',
      fontWeight: '500',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600',
      color: palette.text,
      fontSize: '14px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: `1px solid ${palette.inputBorder}`,
      borderRadius: '12px',
      background: palette.inputBg,
      color: palette.text,
      fontSize: '14px',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box',
      outline: 'none',
      backdropFilter: 'blur(5px)',
    },
    button: {
      width: '100%',
      padding: '14px',
      marginTop: '25px',
      background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.accent} 100%)`,
      color: '#ffffff',
      border: 'none',
      borderRadius: '12px',
      fontWeight: '700',
      fontSize: '15px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      opacity: isSubmitting ? 0.7 : 1,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      boxShadow: `0 10px 25px -5px rgba(6, 182, 212, 0.3)`,
    },
    error: {
      background: 'rgba(239, 68, 68, 0.1)',
      color: '#fca5a5',
      padding: '14px 16px',
      borderRadius: '12px',
      marginBottom: '20px',
      fontSize: '14px',
      border: `1px solid rgba(239, 68, 68, 0.3)`,
      animation: 'shake 0.5s ease',
      backdropFilter: 'blur(5px)',
    },
    link: {
      marginTop: '25px',
      textAlign: 'center',
      fontSize: '14px',
      color: palette.textLight,
    },
    linkAnchor: {
      color: palette.primary,
      textDecoration: 'none',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    homeLink: {
      position: 'fixed',
      top: '30px',
      left: '30px',
      color: palette.primary,
      textDecoration: 'none',
      fontWeight: '700',
      fontSize: '20px',
      transition: 'all 0.3s ease',
    },
  };

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        input:focus {
          border-color: ${palette.primary};
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.2), inset 0 0 10px rgba(6, 182, 212, 0.1);
          background: rgba(15, 23, 42, 0.8);
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px -5px rgba(6, 182, 212, 0.4), 0 10px 25px -5px rgba(168, 85, 247, 0.2);
        }
        a:hover {
          color: ${palette.primary};
          text-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
        }
      `}</style>

      <a href="/" style={styles.homeLink} title="Volver a inicio">
        📚 Libris
      </a>



      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Bienvenido</h1>
          <p style={styles.subtitle}>Inicia sesión en tu biblioteca</p>
        </div>

        {error && (
          <div style={styles.error} role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="username" style={styles.label}>
              👤 Nombre de Usuario
            </label>
            <input
              id="username"
              type="text"
              style={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="ejemplo@usuario"
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>
              🔐 Contraseña
            </label>
            <input
              id="password"
              type="password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={styles.button}
            aria-label={isSubmitting ? 'Iniciando sesión' : 'Iniciar sesión'}
          >
            {isSubmitting ? '⏳ Iniciando...' : '✨ Entrar'}
          </button>
        </form>

        <div style={styles.link}>
          ¿No tienes cuenta?{' '}
          <a href="/register" style={styles.linkAnchor}>
            Regístrate aquí
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;