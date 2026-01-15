import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { notificationService } from '../api/notificationService';

// Función auxiliar para obtener tiempo relativo
const getTimeAgo = (dateString) => {
  if (!dateString) return '';
  
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Ahora';
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString();
};

// Función para determinar el icono según el tipo de notificación
const getNotificationIcon = (message) => {
  if (!message) return '📬';
  
  const msg = message.toLowerCase();
  if (msg.includes('comentar') || msg.includes('comentario')) return '💬';
  if (msg.includes('bienvenid')) return '👋';
  if (msg.includes('elimina') || msg.includes('borr')) return '🗑️';
  if (msg.includes('activad') || msg.includes('desactivad')) return '🔄';
  if (msg.includes('favor') || msg.includes('estrella')) return '⭐';
  if (msg.includes('error') || msg.includes('problema')) return '⚠️';
  if (msg.includes('éxito') || msg.includes('exitosa')) return '✅';
  return '📬';
};

const Navbar = ({ theme, setTheme, palette }) => {
  const { isLoggedIn, isAdmin, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  // Cargar notificaciones reales del backend
  useEffect(() => {
    const loadNotifs = async () => {
      if (!isLoggedIn) {
        setNotifications([]);
        setUnread(0);
        return;
      }
      try {
        const res = await notificationService.getMyNotifications();
        const list = Array.isArray(res) ? res : res.results || [];
        setNotifications(list);
        setUnread(list.filter((n) => !n.is_read).length);
      } catch (err) {
        console.error('No se pudieron cargar notificaciones', err);
      }
    };
    loadNotifs();
  }, [isLoggedIn]);

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
    },
    notifBtn: {
      position: 'relative',
      padding: '8px 10px',
      borderRadius: '10px',
      border: `1px solid ${palette.cardBorder}`,
      background: palette.cardBg,
      color: palette.text,
      cursor: 'pointer',
      fontSize: '18px',
      transition: 'all 0.2s ease',
    },
    notifBadge: {
      position: 'absolute',
      top: '-6px',
      right: '-6px',
      background: palette.error,
      color: '#fff',
      borderRadius: '50%',
      padding: '2px 6px',
      fontSize: '11px',
      fontWeight: '700'
    },
    notifDropdown: {
      position: 'absolute',
      top: '52px',
      right: 0,
      minWidth: '320px',
      maxWidth: '400px',
      maxHeight: '500px',
      overflowY: 'auto',
      background: palette.cardBg,
      border: `1px solid ${palette.cardBorder}`,
      borderRadius: '16px',
      boxShadow: '0 20px 60px -15px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
      padding: '0',
      zIndex: 200,
      backdropFilter: 'blur(10px)',
    },
    notifHeader: {
      padding: '16px 16px 12px 16px',
      borderBottom: `1px solid ${palette.cardBorder}`,
      fontWeight: '600',
      fontSize: '1rem',
      color: palette.text,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    notifList: {
      padding: '8px',
      maxHeight: '400px',
      overflowY: 'auto',
    },
    notifItem: {
      padding: '14px 12px',
      borderRadius: '12px',
      background: `linear-gradient(135deg, ${palette.secondary} 0%, ${palette.cardBg} 100%)`,
      color: palette.text,
      border: `1px solid ${palette.cardBorder}`,
      fontSize: '0.875rem',
      lineHeight: '1.5',
      marginBottom: '8px',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
    },
    notifItemUnread: {
      background: `linear-gradient(135deg, ${palette.primary}15 0%, ${palette.accent}10 100%)`,
      borderLeft: `3px solid ${palette.primary}`,
      fontWeight: '500',
    },
    notifEmpty: {
      padding: '32px 16px',
      textAlign: 'center',
      color: palette.textLight,
      fontSize: '0.9rem',
    },
    notifIcon: {
      fontSize: '1.2rem',
      marginRight: '8px',
    },
    notifTime: {
      fontSize: '0.75rem',
      color: palette.textLight,
      marginTop: '6px',
      display: 'block',
    }
  };

  const scrollToSection = (sectionId) => {
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenNotifications = async () => {
    setShowNotifications((v) => !v);
    if (!showNotifications && unread > 0) {
      try {
        await notificationService.markAllRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnread(0);
      } catch (err) {
        console.error('No se pudo marcar notificaciones', err);
      }
    }
  };

  // Auto-cerrar el dropdown de notificaciones a los 3s
  useEffect(() => {
    if (showNotifications) {
      const t = setTimeout(() => setShowNotifications(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showNotifications]);

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
        {/* Notificaciones */}
        <div style={{ position: 'relative' }}>
          <button
            style={styles.notifBtn}
            onClick={handleOpenNotifications}
            aria-label="Notificaciones"
            title="Notificaciones"
          >
            🔔
            <span style={styles.notifBadge}>{unread}</span>
          </button>
          {showNotifications && (
            <div style={styles.notifDropdown}>
              <div style={styles.notifHeader}>
                🔔 Notificaciones {unread > 0 && <span style={{ 
                  background: palette.primary, 
                  color: '#fff', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>{unread}</span>}
              </div>
              <div style={styles.notifList}>
                {notifications.length === 0 ? (
                  <div style={styles.notifEmpty}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
                    No tienes nuevas notificaciones
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isUnread = !n.is_read;
                    const timeAgo = getTimeAgo(n.created_at);
                    const icon = getNotificationIcon(n.message);
                    
                    return (
                      <div 
                        key={n.id} 
                        style={{
                          ...styles.notifItem,
                          ...(isUnread ? styles.notifItemUnread : {})
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px -8px rgba(0,0,0,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                          <span style={styles.notifIcon}>{icon}</span>
                          <div style={{ flex: 1 }}>
                            <div>{n.message}</div>
                            <span style={styles.notifTime}>{timeAgo}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

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
