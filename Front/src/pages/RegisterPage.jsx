import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/animations.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    rol: 'USER',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    if (formData.password !== formData.password2) {
      setError('Las contraseñas no coinciden.');
      setIsSubmitting(false);
      return;
    }

    try {
      await register(formData);
      setSuccess('¡Registro exitoso! Por favor, inicia sesión.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const errorData = err.response?.data;
      let errorMsg = 'Ocurrió un error en el registro.';

      if (errorData) {
        if (errorData.username) errorMsg = errorData.username[0];
        else if (errorData.email) errorMsg = errorData.email[0];
        else if (errorData.password) errorMsg = errorData.password[0];
        else if (errorData.password2) errorMsg = errorData.password2[0];
      }

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
    inputBorder: 'rgba(148, 163, 184, 0.2)',
    inputBg: 'rgba(15, 23, 42, 0.5)',
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
      marginBottom: '18px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600',
      color: palette.text,
      fontSize: '13px',
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
    success: {
      background: 'rgba(16, 185, 129, 0.1)',
      color: '#6ee7b7',
      padding: '14px 16px',
      borderRadius: '12px',
      marginBottom: '20px',
      fontSize: '14px',
      border: `1px solid rgba(16, 185, 129, 0.3)`,
      animation: 'slideIn 0.3s ease',
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
  }
  ;
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
          <h1 style={styles.title}>Únete a Libris</h1>
          <p style={styles.subtitle}>Crea tu cuenta para empezar a leer</p>
        </div>

        {error && (
          <div style={styles.error} role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        {success && (
          <div style={styles.success} role="status" aria-live="polite">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="reg-username" style={styles.label}>
              👤 Nombre de Usuario
            </label>
            <input
              id="reg-username"
              type="text"
              name="username"
              style={styles.input}
              value={formData.username}
              onChange={handleChange}
              required
              aria-required="true"
              placeholder="tu_usuario"
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="reg-email" style={styles.label}>
              📧 Email
            </label>
            <input
              id="reg-email"
              type="email"
              name="email"
              style={styles.input}
              value={formData.email}
              onChange={handleChange}
              required
              aria-required="true"
              placeholder="tu@email.com"
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="reg-password" style={styles.label}>
              🔐 Contraseña
            </label>
            <input
              id="reg-password"
              type="password"
              name="password"
              style={styles.input}
              value={formData.password}
              onChange={handleChange}
              required
              aria-required="true"
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="reg-password2" style={styles.label}>
              ✓ Confirmar Contraseña
            </label>
            <input
              id="reg-password2"
              type="password"
              name="password2"
              style={styles.input}
              value={formData.password2}
              onChange={handleChange}
              required
              aria-required="true"
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={styles.button}
            aria-label={isSubmitting ? 'Registrando' : 'Registrarme'}
          >
            {isSubmitting ? '⏳ Registrando...' : '🎉 Registrarme'}
          </button>
        </form>

        <div style={styles.link}>
          ¿Ya tienes cuenta?{' '}
          <a href="/login" style={styles.linkAnchor}>
            Inicia Sesión
          </a>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;