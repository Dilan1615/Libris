import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRegistrosLectura, getMaterialById } from '../api/materialService';
import { estadisticasService, favoritoService } from '../api/ratingService';
import { updateProfile } from '../api/authService';
import RegistroCard from '../components/RegistroCard';
import MaterialCard from '../components/MaterialCard';
import Navbar from '../components/Navbar';
import { getThemePalette } from '../styles/theme';
import { useNavigate } from 'react-router-dom';
import '../styles/animations.css';

const ProfilePage = () => {
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const [registros, setRegistros] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [editMessage, setEditMessage] = useState({ text: '', type: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [favoritos, setFavoritos] = useState([]);
  const [isLoadingFavoritos, setIsLoadingFavoritos] = useState(false);
  const [favoritosError, setFavoritosError] = useState('');
  const [favoritosLoaded, setFavoritosLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState('historial');
  const navigate = useNavigate();

  // Función para cargar los registros de lectura
  const fetchRegistros = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getRegistrosLectura();
      console.log('📖 Registros cargados:', res);
      console.log('📖 Registros.results:', res.results);
      console.log('📖 Cantidad de registros:', res.results?.length || 0);
      
      // El backend puede devolver array directo o {results: [...]}
      const registrosList = Array.isArray(res) ? res : (res.results || []);
      console.log('📖 Registros finales a mostrar:', registrosList.length);
      setRegistros(registrosList);
    } catch (err) {
      console.error('❌ Error al cargar registros:', err);
      console.error('❌ Error response:', err.response?.data);
      setError('No se pudo cargar el historial de lectura.');
      setRegistros([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Función para cargar estadísticas del usuario
  const fetchEstadisticas = useCallback(async () => {
    if (!user) return;
    setIsLoadingStats(true);
    try {
      const stats = await estadisticasService.getMyStats(user.id);
      console.log('📊 Estadísticas cargadas:', stats);
      setEstadisticas(stats);
    } catch (err) {
      console.error('❌ Error al cargar estadísticas:', err);
      setEstadisticas(null);
    } finally {
      setIsLoadingStats(false);
    }
  }, [user]);

  // Cargar materiales favoritos del usuario con detalles para la tarjeta
  const fetchFavoritos = useCallback(async () => {
    if (!user) return;
    setIsLoadingFavoritos(true);
    setFavoritosError('');

    try {
      const res = await favoritoService.getMyFavorites();
      const rawFavorites = Array.isArray(res) ? res : (res?.results || []);

      const detailedFavorites = await Promise.all(rawFavorites.map(async (fav) => {
        const materialType = fav.material_info?.tipo;
        const materialId = fav.material_info?.id;

        if (!materialType || !materialId) {
          return null;
        }

        // Si es un libro externo y ya tiene imagen en material_info, usarla directamente
        if (fav.material_info?.es_externo && fav.material_info?.imagen) {
          return {
            id: materialId,
            tipo: materialType,
            titulo: fav.material_info.titulo,
            imagen: fav.material_info.imagen,
            es_externo: true,
            google_id: materialId.replace('google_', '')
          };
        }

        try {
          const material = await getMaterialById(materialType, materialId);
          const normalized = {
            ...material,
            tipo: materialType,
            imagen: material.imagen || material.portada || material.cover || fav.material_info?.imagen,
            generos: material.generos || (material.genero ? [material.genero] : undefined),
          };
          return normalized;
        } catch (err) {
          console.error('⚠️ No se pudo cargar detalle del favorito:', materialType, materialId, err);
          return {
            id: materialId,
            tipo: materialType,
            titulo: fav.material_info?.titulo || 'Material sin título',
            imagen: fav.material_info?.imagen,
            es_externo: fav.material_info?.es_externo
          };
        }
      }));

      setFavoritos(detailedFavorites.filter(Boolean));
      setFavoritosLoaded(true);
    } catch (err) {
      console.error('❌ Error al cargar favoritos:', err);
      setFavoritosError('No se pudieron cargar tus favoritos.');
      setFavoritos([]);
    } finally {
      setIsLoadingFavoritos(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthLoading && user) {
      fetchRegistros();
      fetchEstadisticas();
    } else if (!isAuthLoading && !user) {
      console.log('Usuario no autenticado, redirigiendo...');
      setIsLoading(false);
      setIsLoadingStats(false);
    }
  }, [isAuthLoading, user, fetchRegistros, fetchEstadisticas]);

  // Cargar favoritos cuando el usuario abra la sección correspondiente
  useEffect(() => {
    if (activeSection === 'favoritos' && !favoritosLoaded) {
      fetchFavoritos();
    }
  }, [activeSection, favoritosLoaded, fetchFavoritos]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isAuthLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme === 'light' ? '#f8fafc' : '#0b1224',
          color: theme === 'light' ? '#0f172a' : '#e2e8f0',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 1s linear infinite' }}>
            ⏳
          </div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b1224',
          color: '#e2e8f0',
          padding: '20px',
        }}
      >
        <div style={{ textAlign: 'center', background: 'rgba(17,24,39,0.85)', padding: '32px', borderRadius: '16px', border: '1px solid rgba(148,163,184,0.2)', boxShadow: '0 20px 40px -18px rgba(0,0,0,0.35)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
          <p style={{ margin: 0, marginBottom: '12px', fontSize: '16px' }}>Debes iniciar sesión para ver tu perfil.</p>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #06b6d4 0%, #a855f7 100%)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: '700',
              boxShadow: '0 10px 25px -8px rgba(0,0,0,0.45)',
            }}
          >
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  // Paleta de colores
  const palette = getThemePalette(theme);

  const styles = {
    container: {
      maxWidth: '900px',
      margin: '0 auto',
      animation: 'slideIn 0.4s ease',
      padding: '24px',
    },
    header: {
      background: palette.cardBg,
      border: `1px solid ${palette.cardBorder}`,
      borderRadius: '18px',
      padding: '28px',
      marginBottom: '28px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '20px',
      boxShadow: '0 20px 40px -18px rgba(0, 0, 0, 0.35)',
      backdropFilter: 'blur(12px)',
    },
    userInfo: {
      flex: 1,
    },
    title: {
      fontSize: '30px',
      fontWeight: '800',
      marginBottom: '10px',
      background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.accent} 100%)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    infoRow: {
      marginBottom: '6px',
      color: palette.textLight,
      fontSize: '14px',
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    button: {
      padding: '11px 18px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      transition: 'all 0.3s ease',
      boxShadow: '0 10px 25px -8px rgba(0,0,0,0.45)',
    },
    logoutBtn: {
      background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.accent} 100%)`,
      color: '#fff',
    },
    homeBtn: {
      background: palette.success,
      color: '#0b1224',
    },
    themeToggle: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: `linear-gradient(135deg, ${palette.accent} 0%, ${palette.primary} 100%)`,
      border: 'none',
      borderRadius: '50%',
      width: '46px',
      height: '46px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      transition: 'transform 0.3s ease',
      boxShadow: '0 12px 30px -10px rgba(0,0,0,0.45)',
    },
    section: {
      background: palette.cardBg,
      border: `1px solid ${palette.cardBorder}`,
      borderRadius: '18px',
      padding: '30px',
      boxShadow: '0 20px 40px -18px rgba(0, 0, 0, 0.35)',
      backdropFilter: 'blur(10px)',
    },
    tabSwitcher: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      margin: '26px 0 14px',
    },
    tabButton: {
      flex: 1,
      padding: '12px 16px',
      borderRadius: '12px',
      border: `1px solid ${palette.cardBorder}`,
      background: palette.secondary,
      color: palette.text,
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.25s ease',
      boxShadow: '0 10px 25px -18px rgba(0,0,0,0.35)',
    },
    tabButtonActive: {
      background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.accent} 100%)`,
      color: '#fff',
      border: 'none',
      boxShadow: '0 14px 30px -18px rgba(59,130,246,0.6)',
      transform: 'translateY(-1px)',
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '20px',
      color: palette.text,
    },
    registrosList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: palette.textLight,
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '16px',
    },
    emptyText: {
      fontSize: '16px',
      marginBottom: '20px',
    },
    emptyLink: {
      color: palette.primary,
      textDecoration: 'none',
      fontWeight: '600',
    },
    cardsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '18px',
    },
    sectionHint: {
      color: palette.textLight,
      fontSize: '14px',
      marginBottom: '10px',
    },
    loading: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      color: palette.textLight,
    },
    error: {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px',
    },
  };

  // Avatar por defecto (servicio ui-avatars)
  const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'Usuario')}&background=0b1224&color=ffffff&size=256`;

  const handleRegistroChange = () => {
    fetchRegistros();
  };

  const handleEditProfile = () => {
    setEditFormData({
      username: user.username || '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
    });
    setAvatarPreview(user.foto_perfil || null);
    setIsEditingProfile(true);
    setEditMessage({ text: '', type: '' });
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditFormData({});
    setAvatarPreview(null);
    setEditMessage({ text: '', type: '' });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validación cliente: tipos y tamaño (<=5MB)
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) {
        setEditMessage({ text: '❌ Formato no permitido. Usa JPG, PNG o WEBP.', type: 'error' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setEditMessage({ text: '❌ La imagen supera 5MB.', type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setEditFormData({ ...editFormData, foto_perfil: file });
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setEditMessage({ text: '', type: '' });
    
    try {
      const formData = new FormData();
      formData.append('username', editFormData.username);
      formData.append('email', editFormData.email);
      formData.append('first_name', editFormData.first_name);
      formData.append('last_name', editFormData.last_name);
      if (editFormData.foto_perfil instanceof File) {
        formData.append('foto_perfil', editFormData.foto_perfil);
      }

      const response = await updateProfile(formData);
      setEditMessage({ text: '✅ Perfil actualizado correctamente', type: 'success' });
      setIsEditingProfile(false);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      const errorMsg = err.response?.data?.username?.[0] || 
                       err.response?.data?.email?.[0] ||
                       err.response?.data?.detail ||
                       'Error al actualizar el perfil';
      setEditMessage({ text: `❌ ${errorMsg}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: palette.pageBg, color: palette.text }}>
      <Navbar theme={theme} setTheme={setTheme} palette={{
        ...palette,
        navBg: palette.cardBg,
        navBorder: palette.cardBorder,
        cardBorder: palette.cardBorder,
        secondary: palette.cardBg
      }} />
      
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
        }
      `}</style>

      <div style={styles.container}>
        {/* Mensajes de edición */}
        {editMessage.text && (
          <div style={{
            background: editMessage.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: editMessage.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${editMessage.type === 'success' ? '#a7f3d0' : '#fca5a5'}`,
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            animation: 'slideIn 0.3s ease',
          }}>
            {editMessage.text}
          </div>
        )}

        {/* Modal de edición de perfil */}
        {isEditingProfile && (
          <div style={{
            background: palette.cardBg,
            border: `1px solid ${palette.cardBorder}`,
            borderRadius: '18px',
            padding: '28px',
            marginBottom: '28px',
            boxShadow: '0 20px 40px -18px rgba(0, 0, 0, 0.35)',
          }}>
            <h2 style={{...styles.sectionTitle, marginTop: 0}}>✏️ Editar Perfil</h2>
            
            {/* Avatar upload */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: palette.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: `3px solid ${palette.primary}`,
                flexShrink: 0,
              }}>
                <img
                  src={avatarPreview || defaultAvatarUrl}
                  alt="Avatar preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: palette.text,
                }}>
                  Foto de perfil
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={isSaving}
                  style={{
                    fontSize: '14px',
                    color: palette.text,
                  }}
                />
                <p style={{ fontSize: '12px', color: palette.textLight, margin: '8px 0 0 0' }}>
                  JPG, PNG o WEBP (máx. 5MB)
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: palette.text }}>
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={editFormData.username || ''}
                  onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${palette.cardBorder}`,
                    background: palette.pageBg,
                    color: palette.text,
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                  disabled={isSaving}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: palette.text }}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${palette.cardBorder}`,
                    background: palette.pageBg,
                    color: palette.text,
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                  disabled={isSaving}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: palette.text }}>
                  Nombre
                </label>
                <input
                  type="text"
                  value={editFormData.first_name || ''}
                  onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${palette.cardBorder}`,
                    background: palette.pageBg,
                    color: palette.text,
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                  disabled={isSaving}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: palette.text }}>
                  Apellido
                </label>
                <input
                  type="text"
                  value={editFormData.last_name || ''}
                  onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${palette.cardBorder}`,
                    background: palette.pageBg,
                    color: palette.text,
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                  disabled={isSaving}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelEdit}
                style={{...styles.button, background: palette.secondary, color: palette.text, border: `2px solid ${palette.cardBorder}`, boxShadow: '0 4px 12px rgba(0,0,0,0.2)'}}
                disabled={isSaving}
              >
                ❌ Cancelar
              </button>
              <button
                onClick={handleSaveProfile}
                style={{...styles.button, ...styles.logoutBtn}}
                disabled={isSaving}
              >
                {isSaving ? '⏳ Guardando...' : '✅ Guardar cambios'}
              </button>
            </div>
          </div>
        )}

        {/* Header con info del usuario */}
        <div style={styles.header}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flex: 1 }}>
            {/* Avatar circular */}
            <div style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: palette.secondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: `4px solid ${palette.primary}`,
              flexShrink: 0,
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            }}>
              <img
                src={user.foto_perfil || defaultAvatarUrl}
                alt={user.username}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            
            <div style={styles.userInfo}>
              <h1 style={styles.title}>👋 ¡Hola, {user.username}!</h1>
              <div style={styles.infoRow}>
                📧 <strong>{user.email}</strong>
              </div>
              {(user.first_name || user.last_name) && (
                <div style={styles.infoRow}>
                  👤 <strong>{user.first_name} {user.last_name}</strong>
                </div>
              )}
            </div>
          </div>
          <div style={styles.buttonGroup}>
            <button
              onClick={handleEditProfile}
              style={{...styles.button, background: palette.primary, color: '#fff'}}
              aria-label="Editar perfil"
            >
              ✏️ Editar perfil
            </button>
          </div>
        </div>

        {/* Sección de Estadísticas */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>📊 Mis Estadísticas</h2>

          {isLoadingStats ? (
            <div style={styles.loading}>
              <span style={{ marginRight: '10px', fontSize: '24px', animation: 'spin 1s linear infinite' }}>
                ⏳
              </span>
              Cargando estadísticas...
            </div>
          ) : estadisticas ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              {/* Libros leídos */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📖</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                  {estadisticas.total_libros_leidos || 0}
                </div>
                <div style={{ fontSize: '12px', color: palette.textLight, marginTop: '4px' }}>
                  Libros leídos
                </div>
              </div>

              {/* Total comentarios */}
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
                  {estadisticas.total_comentarios || 0}
                </div>
                <div style={{ fontSize: '12px', color: palette.textLight, marginTop: '4px' }}>
                  Comentarios
                </div>
              </div>

              {/* Calificación promedio */}
              <div style={{
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>⭐</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#a855f7' }}>
                  {(estadisticas.calificacion_promedio_dada || 0).toFixed(1)}
                </div>
                <div style={{ fontSize: '12px', color: palette.textLight, marginTop: '4px' }}>
                  Promedio (tu voto)
                </div>
              </div>

              {/* Total favoritos */}
              <button
                type="button"
                onClick={() => setActiveSection('favoritos')}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  width: '100%',
                  color: palette.text,
                  boxShadow: '0 12px 28px -18px rgba(239,68,68,0.45)'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>❤️</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                  {estadisticas.total_favoritos || 0}
                </div>
                <div style={{ fontSize: '12px', color: palette.textLight, marginTop: '4px', fontWeight: 700 }}>
                  Favoritos (clic para ver)
                </div>
              </button>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>No hay estadísticas disponibles</p>
            </div>
          )}
        </section>

        <div style={styles.tabSwitcher} aria-label="Navegación de secciones del perfil">
          <button
            type="button"
            style={{
              ...styles.tabButton,
              ...(activeSection === 'historial' ? styles.tabButtonActive : {}),
            }}
            onClick={() => setActiveSection('historial')}
            aria-pressed={activeSection === 'historial'}
          >
            📖 Historial
          </button>
          <button
            type="button"
            style={{
              ...styles.tabButton,
              ...(activeSection === 'favoritos' ? styles.tabButtonActive : {}),
            }}
            onClick={() => setActiveSection('favoritos')}
            aria-pressed={activeSection === 'favoritos'}
          >
            ❤️ Favoritos
          </button>
        </div>

        {activeSection === 'favoritos' ? (
          <section id="favoritos-section" style={styles.section}>
            <h2 style={styles.sectionTitle}>❤️ Mis Favoritos</h2>
            <p style={styles.sectionHint}>Aquí verás los materiales que guardaste tocando el corazón.</p>

            {favoritosError && (
              <div style={styles.error} role="alert">
                {favoritosError}
              </div>
            )}

            {isLoadingFavoritos ? (
              <div style={styles.loading}>
                <span style={{ marginRight: '10px', fontSize: '24px', animation: 'spin 1s linear infinite' }}>
                  ⏳
                </span>
                Cargando favoritos...
              </div>
            ) : favoritos.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>🤍</div>
                <p style={styles.emptyText}>Aún no tienes favoritos guardados</p>
                <p style={{ color: palette.textLight, fontSize: '14px', marginBottom: '20px' }}>
                  Explora el catálogo y pulsa "Guardar" para añadirlos aquí.
                </p>
                <a href="/" style={styles.emptyLink}>
                  Ir al catálogo →
                </a>
              </div>
            ) : (
              <div style={styles.cardsGrid}>
                {favoritos.map((fav) => (
                  <MaterialCard
                    key={`${fav.tipo}-${fav.id}`}
                    material={fav}
                    tipo={fav.tipo}
                    onCreateRegistro={() => {}}
                    onOpenComment={() => {}}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>📖 Mi Historial de Lectura</h2>

            {error && (
              <div style={styles.error} role="alert">
                {error}
              </div>
            )}

            {isLoading && (
              <div style={styles.loading}>
                <span style={{ marginRight: '10px', fontSize: '24px', animation: 'spin 1s linear infinite' }}>
                  ⏳
                </span>
                Cargando historial...
              </div>
            )}

            {!isLoading && registros.length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📚</div>
                <p style={styles.emptyText}>Aún no tienes materiales registrados</p>
                <p style={{ color: palette.textLight, fontSize: '14px', marginBottom: '20px' }}>
                  Comienza a explorar y guardar tu progreso de lectura
                </p>
                <a href="/" style={styles.emptyLink}>
                  Ir al catálogo →
                </a>
              </div>
            )}

            {!isLoading && registros.length > 0 && (
              <div style={styles.registrosList}>
                {registros.map((registro) => (
                  <RegistroCard
                    key={registro.id}
                    registro={registro}
                    onUpdate={handleRegistroChange}
                    onDelete={handleRegistroChange}
                    theme={theme}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
