import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import RatingStars from './RatingStars';
import { calificacionService, favoritoService } from '../api/ratingService';

// Acepta dos nuevas props: onCreateRegistro y onOpenComment
const MaterialCard = ({ material, tipo, onCreateRegistro, onOpenComment }) => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginAction, setLoginAction] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loadingRating, setLoadingRating] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const [cardNotice, setCardNotice] = useState({ message: '', type: '' });
  
  const materialId = material.id;
  
  // Cargar calificación y favoritos del usuario cuando esté logueado
  useEffect(() => {
    if (!isLoggedIn) {
      setIsFavorited(false);
      setUserRating(0);
      return;
    }

    const loadUserData = async () => {
      try {
        // Cargar calificación del usuario
        const ratings = await calificacionService.getMyRatings();
        const myRating = ratings.results?.find(r => 
          r.material_info?.id === materialId
        );
        setUserRating(myRating?.rating || 0);

        // Cargar favoritos del usuario
        const favorites = await favoritoService.getMyFavorites();
        
        let isFav = false;
        
        // Para libros externos, buscar por google_id
        if (material?.es_externo && material?.google_id) {
          isFav = favorites.results?.some(f => f.google_libro_id === material.google_id);
        } else {
          // Para libros locales, buscar por material_info.id
          isFav = favorites.results?.some(f => {
            return String(f.material_info?.id) === String(materialId);
          });
        }
        
        setIsFavorited(!!isFav);
      } catch (error) {
        console.error('Error cargando datos del usuario:', error);
        setIsFavorited(false);
        setUserRating(0);
      }
    };

    loadUserData();
  }, [isLoggedIn, materialId]);
  
  const actionLabels = {
    start_reading: '📖 Leer',
    comment: '💬 Comentar',
    save: '❤️ Guardar'
  };
  
  const handleAction = (action) => {
    if (!isLoggedIn) {
      setLoginAction(action);
      setShowLoginModal(true);
      return;
    }

    if (action === 'start_reading') {
        // Llama a la función que inicia el registro de lectura
        onCreateRegistro(materialId, tipo); 
    }
    
    if (action === 'comment') {
        // Abre el modal de comentario en HomePage
        onOpenComment(material);
    }
  };

  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    navigate('/login');
  };

  // Manejar calificación con debouncing
  const handleRating = async (newRating) => {
    if (!isLoggedIn) {
      setLoginAction('rate');
      setShowLoginModal(true);
      return;
    }

    // Prevenir múltiples clics
    if (loadingRating) return;

    setLoadingRating(true);
    try {
      if (userRating > 0) {
        // Actualizar calificación existente
        const ratings = await calificacionService.getMyRatings();
        const myRating = ratings.results?.find(r => 
          r.material_info?.id === materialId
        );
        if (myRating) {
          await calificacionService.updateRating(myRating.id, newRating);
        }
      } else {
        // Crear nueva calificación
        const materialKey = tipo === 'libro' ? 'libro' : tipo === 'manga' ? 'manga' : 'novela';
        await calificacionService.rateaterial({
          rating: newRating,
          [materialKey]: materialId
        });
      }
      setUserRating(newRating);
      setCardNotice({ message: '⭐ Calificación guardada', type: 'success' });
      setTimeout(() => setCardNotice({ message: '', type: '' }), 2000);
    } catch (error) {
      console.error('Error al calificar:', error);
      setCardNotice({ message: '❌ No se pudo guardar la calificación', type: 'error' });
      setTimeout(() => setCardNotice({ message: '', type: '' }), 3000);
    } finally {
      setLoadingRating(false);
    }
  };

  // Manejar favoritos
  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      setLoginAction('save');
      setShowLoginModal(true);
      return;
    }

    setLoadingFavorite(true);
    try {
      // Obtener lista actualizada de favoritos
      const favorites = await favoritoService.getMyFavorites();
      const myFav = favorites.results?.find(f =>
        f.material_info?.id === materialId
      );

      if (myFav) {
        // Ya existe en favoritos, eliminar
        await favoritoService.removeFavorite(myFav.id);
        setIsFavorited(false);
        setCardNotice({ message: '💔 Eliminado de favoritos', type: 'success' });
        console.log('✅ Favorito eliminado, estado actualizado a false');
      } else {
        // No existe, agregar
        let payload;
        
        // Para libros externos, usar google_libro_id
        if (material?.es_externo && material?.google_id) {
          payload = {
            google_libro_id: material.google_id,
            google_libro_titulo: material.titulo
          };
        } else {
          // Para libros locales
          const materialKey = tipo === 'libro' ? 'libro' : tipo === 'manga' ? 'manga' : 'novela';
          payload = { [materialKey]: materialId };
        }
        
        try {
          const result = await favoritoService.addFavorite(payload);
          console.log('✅ Favorito agregado exitosamente:', result);
          setIsFavorited(true);
          setCardNotice({ message: '❤️ Agregado a favoritos', type: 'success' });
        } catch (addError) {
          // Logging detallado del error para depurar 500
          console.error('Error específico al agregar favorito:', {
            status: addError.response?.status,
            statusText: addError.response?.statusText,
            data: addError.response?.data,
            dataString: JSON.stringify(addError.response?.data, null, 2),
            message: addError.message,
            fullError: addError
          });
          
          // Manejar duplicados (400)
          if (addError.response?.status === 400) {
            const errorMsg = addError.response?.data?.detail || 
                           addError.response?.data?.message ||
                           'Ya está en tus favoritos';
            setCardNotice({ message: `💡 ${errorMsg}`, type: 'info' });
            setIsFavorited(true); // Actualizar estado si ya existe
          } else if (addError.response?.status === 500) {
            setCardNotice({ message: '❌ Error del servidor. Por favor intenta de nuevo.', type: 'error' });
          } else {
            setCardNotice({ message: '❌ No se pudo guardar en favoritos', type: 'error' });
          }
          throw addError;
        }
      }
    } catch (error) {
      console.error('Error al cambiar favorito:', error);
      // El error ya fue manejado arriba si es de agregar
      if (!error.response?.status) {
        setCardNotice({ message: 'Error de conexión', type: 'error' });
      }
    } finally {
      setLoadingFavorite(false);
      // Limpiar notificación después de 3 segundos
      setTimeout(() => setCardNotice({ message: '', type: '' }), 3000);
    }
  };

  const getButtonStyle = (btnKey, baseStyle) => {
    if (hoveredBtn === btnKey) {
      return { ...baseStyle, opacity: 0.85 };
    }
    return baseStyle;
  };

  return (
    <div style={styles.card}>
      {/* Portada */}
      <div style={styles.coverContainer}>
        {material.imagen ? (
          <img 
            src={material.imagen} 
            alt={material.titulo}
            style={styles.cover}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={styles.placeholderCover}>
            <span style={styles.placeholderText}>📚</span>
          </div>
        )}
        {material.es_externo && <div style={styles.badge}>Google Books</div>}
      </div>

      {/* Contenido */}
      <div style={styles.content}>
        <h3 style={styles.title}>{material.titulo || 'Sin título'}</h3>
        
        <p style={styles.author}>{material.autor || 'Autor desconocido'}</p>
        
        <div style={styles.meta}>
          <span style={styles.metaItem}>
            {Array.isArray(material.generos) && material.generos.length > 0 
              ? material.generos.join(', ') 
              : material.genero || 'N/A'}
          </span>
          <span style={styles.metaItem}>{material.anio_publicacion || '—'}</span>
        </div>

        {/* Sección de estrellas y favorito */}
        <div style={styles.ratingSection}>
          <div style={styles.ratingContainer}>
            <RatingStars
              currentRating={userRating}
              isInteractive={isLoggedIn}
              onRate={handleRating}
              size="small"
            />
            {material.avg_rating && (
              <span style={styles.avgRating}>
                {material.avg_rating.toFixed(1)} ({material.total_ratings || 0})
              </span>
            )}
          </div>
          <button
            onClick={handleToggleFavorite}
            disabled={loadingFavorite}
            style={{
              ...styles.favoriteBtn,
              backgroundColor: isFavorited ? '#fbbf24' : '#f3f4f6',
              color: isFavorited ? '#fff' : '#6b7280',
              opacity: loadingFavorite ? 0.6 : 1,
              cursor: loadingFavorite ? 'wait' : 'pointer',
            }}
            title={loadingFavorite ? 'Guardando...' : (isFavorited ? 'Quitar de favoritos' : 'Agregar a favoritos')}
          >
            {loadingFavorite ? '⏳' : (isFavorited ? '❤️' : '🤍')}
          </button>
        </div>
      </div>

      {/* Acciones */}
      <div style={styles.actions}>
        <button 
          style={getButtonStyle('primary', styles.btnPrimary)}
          onMouseEnter={() => setHoveredBtn('primary')}
          onMouseLeave={() => setHoveredBtn(null)}
          onClick={() => navigate(`/material/${tipo}/${materialId}`)}
        >
          📖 Ver detalles
        </button>
        
        <button 
          style={getButtonStyle('tertiary', styles.btnTertiary)}
          onMouseEnter={() => setHoveredBtn('tertiary')}
          onMouseLeave={() => setHoveredBtn(null)}
          onClick={handleToggleFavorite}
          disabled={loadingFavorite}
        >
          {isFavorited ? '❤️ Favorito' : '🤍 Guardar'}
        </button>
      </div>

      {/* Notificación local */}
      {cardNotice.message && (
        <div style={{
          margin: '0 12px 12px 12px',
          padding: '10px 12px',
          borderRadius: '8px',
          background: cardNotice.type === 'error' ? '#fee2e2' : cardNotice.type === 'info' ? '#dbeafe' : '#dcfce7',
          border: `1px solid ${cardNotice.type === 'error' ? '#fecaca' : cardNotice.type === 'info' ? '#bfdbfe' : '#bbf7d0'}`,
          color: cardNotice.type === 'error' ? '#991b1b' : cardNotice.type === 'info' ? '#1e3a8a' : '#14532d',
          fontSize: '13px',
          fontWeight: '600',
          textAlign: 'center',
        }}>
          {cardNotice.message}
        </div>
      )}

      {/* Modal de login requerido */}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            color: '#e5e7eb',
            padding: '40px',
            borderRadius: '16px',
            textAlign: 'center',
            maxWidth: '450px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
            border: '2px solid #3b82f6'
          }}>
            <h2 style={{ 
              marginBottom: '16px', 
              fontSize: '1.5rem', 
              fontWeight: '700',
              color: '#60a5fa'
            }}>
              🔐 Inicia sesión
            </h2>
            <p style={{ 
              marginBottom: '8px', 
              color: '#cbd5e1', 
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              Para {actionLabels[loginAction]?.toLowerCase() || 'realizar esta acción'}, necesitas tener una cuenta activa.
            </p>
            <p style={{ 
              marginBottom: '24px', 
              color: '#94a3b8', 
              fontSize: '0.9rem'
            }}>
              ¿No tienes cuenta? Puedes registrarte de forma gratuita.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleLoginRedirect}
                style={{
                  padding: '12px 32px',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                🔑 Iniciar sesión
              </button>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  navigate('/register');
                }}
                style={{
                  padding: '12px 32px',
                  backgroundColor: '#475569',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#64748b'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#475569'}
              >
                ✨ Registrarse
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                style={{
                  padding: '12px 32px',
                  backgroundColor: '#334155',
                  color: '#f1f5f9',
                  border: '2px solid #64748b',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#475569';
                  e.target.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#08326dff';
                  e.target.style.borderColor = '#64748b';
                }}
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



// 💅 Estilos modernos y atractivos
const styles = {
  card: {
    background: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  },

  coverContainer: {
    position: 'relative',
    width: '100%',
    height: '200px',
    overflow: 'hidden',
    background: '#f5f5f5',
  },

  cover: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },

  placeholderCover: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
  },

  placeholderText: {
    fontSize: '48px',
  },

  badge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'rgba(0, 123, 255, 0.9)',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    backdropFilter: 'blur(4px)',
  },

  content: {
    padding: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },

  title: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: '1.3',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  author: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    color: '#666',
    fontStyle: 'italic',
    display: '-webkit-box',
    WebkitLineClamp: 1,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  meta: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '12px',
    flex: 1,
    alignItems: 'flex-start',
  },

  metaItem: {
    fontSize: '12px',
    color: '#999',
    background: '#f0f0f0',
    padding: '2px 8px',
    borderRadius: '4px',
  },

  actions: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '8px',
    padding: '12px',
    borderTop: '1px solid #eee',
  },

  btnPrimary: {
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.1s',
  },

  btnTertiary: {
    padding: '8px 12px',
    background: '#ffe0e0',
    color: '#d32f2f',
    border: '1px solid #ffb3b3',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.2s, border-color 0.2s',
  },

  ratingSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0',
  },

  ratingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  avgRating: {
    fontSize: '12px',
    color: '#999',
    fontWeight: '500',
  },

  favoriteBtn: {
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '44px',
    height: '44px',
    '&:hover': {
      transform: 'scale(1.1)',
    }
  },
};

export default MaterialCard;