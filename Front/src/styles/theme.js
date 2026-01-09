import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ theme, setTheme, palette }) => {
  const { isLoggedIn, isAdmin, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determinar qué enlaces mostrar según la ubicación
  const isHomePage = location.pathname === '/';
  const isAdminPage = location.pathname === '/admin';
  const isProfilePage = location.pathname === '/profile';

  const styles = {
    navbar: { 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '16px 40px',
      borderBottom: '1px solid',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(10px)',
    },
    brand: { 
      fontSize: '1.5rem', 
      fontWeight: '800', 
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: palette.text,
    },
    brandGradient: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      WebkitBackgroundClip: 'text', 
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    navLinks: { 
      display: 'flex', 
      gap: '28px', 
      alignItems: 'center' 
    },
    navLink: { 
      color: 'inherit', 
      textDecoration: 'none', 
      fontSize: '0.95rem', 
      fontWeight: '500', 
      cursor: 'pointer', 
      transition: 'all 0.3s ease',
      padding: '8px 12px',
      borderRadius: '8px',
    },
    navActions: { 
      display: 'flex', 
      gap: '12px', 
      alignItems: 'center' 
    },
    navBtn: { 
      border: 'none', 
      borderRadius: '10px', 
      padding: '10px 14px', 
      fontWeight: 700, 
      cursor: 'pointer', 
      boxShadow: '0 10px 20px -10px rgba(0,0,0,0.35)', 
      transition: 'transform 0.2s ease, box-shadow 0.2s ease' 
    },
    themeBtn: { 
      padding: '8px 12px', 
      border: '1px solid', 
      borderRadius: '8px', 
      cursor: 'pointer', 
      fontSize: '18px', 
      transition: 'all 0.3s ease', 
      fontWeight: '600',
      background: 'transparent'
    }
  };

  const scrollToSection = (sectionId) => {
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header style={{
      ...styles.navbar, 
      background: palette.navBg, 
      borderBottomColor: palette.navBorder, 
      color: palette.text
    }}>
      {/* Logo/Brand */}
      <div 
        style={styles.brand}
        onClick={() => navigate('/')}
      >
        <span style={{ fontSize: '1.8rem' }}>📚</span>
        <span style={styles.brandGradient}>Libris</span>
      </div>

      {/* Enlaces de navegación */}
      <div style={styles.navLinks}>
        {isHomePage && (
          <>
            {['catalogo', 'libros', 'mangas', 'novelas'].map(link => {
              const capitalLink = link.charAt(0).toUpperCase() + link.slice(1);
              return (
                <a 
                  key={link}
                  onClick={() => scrollToSection(`section-${link}`)}
                  style={{
                    ...styles.navLink,
                    background: palette.cardBg,
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = palette.accent;
                    e.target.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = palette.cardBg;
                    e.target.style.color = palette.text;
                  }}
                >
                  {capitalLink}
                </a>
              );
            })}
          </>
        )}
      </div>

      {/* Acciones */}
      <div style={styles.navActions}>
        {/* Enlace a catálogo cuando no estamos en home */}
        {!isHomePage && (
          <button
            onClick={() => navigate('/')}
            style={{
              ...styles.navBtn,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 24px -12px rgba(59, 130, 246, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 20px -10px rgba(0,0,0,0.35)';
            }}
          >
            📚 Catálogo
          </button>
        )}
        
        {/* Botón de tema */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          style={{
            ...styles.themeBtn,
            background: palette.cardBg,
            borderColor: palette.cardBorder,
            color: palette.text
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {isLoggedIn ? (
          <>
            {isAdmin && !isAdminPage && (
              <button
                style={{ 
                  ...styles.navBtn, 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}
                onClick={() => navigate('/admin')}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }}
              >
                🔧 Panel Admin
              </button>
            )}
            
            {!isProfilePage && (
              <button
                style={{ 
                  ...styles.navBtn, 
                  background: palette.accent, 
                  color: '#fff' 
                }}
                onClick={() => navigate('/profile')}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 24px -12px rgba(0,0,0,0.45)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 10px 20px -10px rgba(0,0,0,0.35)';
                }}
              >
                👤 Perfil
              </button>
            )}
            
            <button
              style={{ 
                ...styles.navBtn, 
                background: '#ef4444', 
                color: '#fff' 
              }}
              onClick={() => {
                logout();
                navigate('/');
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 24px -12px rgba(0,0,0,0.45)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 10px 20px -10px rgba(0,0,0,0.35)';
              }}
            >
              🚪 Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <button
              style={{ 
                ...styles.navBtn, 
                background: palette.accent, 
                color: '#fff' 
              }}
              onClick={() => navigate('/login')}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 24px -12px rgba(0,0,0,0.45)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 10px 20px -10px rgba(0,0,0,0.35)';
              }}
            >
              Iniciar sesión
            </button>
            <button
              style={{ 
                ...styles.navBtn, 
                background: palette.primary, 
                color: '#fff' 
              }}
              onClick={() => navigate('/register')}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 24px -12px rgba(0,0,0,0.45)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 10px 20px -10px rgba(0,0,0,0.35)';
              }}
            >
              Registrarse
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
