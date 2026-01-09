import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMaterialById, getComentariosByMaterial, createComentario, updateComentario, deleteComentario, createRegistroLectura } from '../api/materialService';
import { useAuth } from '../context/AuthContext';
import RatingStars from '../components/RatingStars';
import { calificacionService } from '../api/ratingService';

const DetalleMaterialPage = () => {
  const { tipo, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [material, setMaterial] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [comentarios, setComentarios] = useState([]);
  const [loadingComentarios, setLoadingComentarios] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [commentNotice, setCommentNotice] = useState({ message: '', type: '' });
  const [userRating, setUserRating] = useState(0);
  const [loadingRating, setLoadingRating] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    const fetchMaterial = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getMaterialById(tipo, id);
        setMaterial(data);
      } catch (err) {
        console.error('Error al cargar material:', err);
        setError('No se pudo cargar el material');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterial();
  }, [tipo, id]);

  useEffect(() => {
    const fetchComentarios = async () => {
      setLoadingComentarios(true);
      try {
        const data = await getComentariosByMaterial(tipo, id);
        setComentarios(data.results || data || []);
      } catch (err) {
        console.error('Error al cargar comentarios:', err);
      } finally {
        setLoadingComentarios(false);
      }
    };

    fetchComentarios();
  }, [tipo, id]);

  // Cargar calificación del usuario
  useEffect(() => {
    if (!user || !material) return;

    const loadUserRating = async () => {
      try {
        const ratings = await calificacionService.getMyRatings();
        const myRating = ratings.results?.find(r => 
          r.material_info?.id === material.id
        );
        setUserRating(myRating?.rating || 0);
      } catch (error) {
        console.error('Error cargando calificación:', error);
      }
    };

    loadUserRating();
  }, [user, material]);

  const handleEnviarComentario = async () => {
    if (!nuevoComentario.trim()) {
      setCommentNotice({ message: 'Por favor escribe un comentario', type: 'error' });
      return;
    }

    setEnviandoComentario(true);
    try {
      const materialKey = tipo === 'libro' ? 'libro' : tipo === 'manga' ? 'manga' : 'novela';
      await createComentario({
        [materialKey]: material.id,
        descripcion: nuevoComentario
      });
      
      // Recargar comentarios
      const data = await getComentariosByMaterial(tipo, id);
      setComentarios(data.results || data || []);
      setNuevoComentario('');
      setCommentNotice({ message: '✅ Comentario publicado', type: 'success' });
    } catch (err) {
      console.error('Error al enviar comentario:', err);
      const serverMsg = err?.response?.data?.descripcion;
      const parsed = Array.isArray(serverMsg) ? serverMsg[0] : serverMsg;
      setCommentNotice({ message: parsed ? `🚫 ${parsed}` : '❌ Error al publicar el comentario', type: 'error' });
    } finally {
      setEnviandoComentario(false);
    }
  };

  // Manejar inicio de lectura (crear registro y navegar)
  const handleEmpezarALeer = async () => {
    if (!user) {
      setCommentNotice({ message: 'Debes iniciar sesión para leer', type: 'error' });
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    // Crear registro de lectura
    const materialKey = tipo === 'libro' ? 'libro' : tipo === 'manga' ? 'manga' : 'novela';
    const payload = {
      estado: 'PENDIENTE',
      pagina_actual: 1,
      tipo,
      [materialKey]: material.id
    };

    try {
      await createRegistroLectura(payload);
      console.log('✅ Registro de lectura creado');
    } catch (err) {
      // Si ya existe, no es problema
      if (err.response?.status === 400) {
        console.log('📝 Registro ya existe, continuando...');
      } else {
        console.error('Error al crear registro:', err);
      }
    }

    // Navegar a la página de lectura
    navigate(`/leer/${tipo}/${id}`);
  };

  // Manejar calificación
  const handleRating = async (newRating) => {
    if (!user) {
      setCommentNotice({ message: 'Debes iniciar sesión para calificar', type: 'error' });
      return;
    }

    setLoadingRating(true);
    try {
      if (userRating > 0) {
        // Actualizar calificación existente
        const ratings = await calificacionService.getMyRatings();
        const myRating = ratings.results?.find(r => 
          r.material_info?.id === material.id
        );
        if (myRating) {
          await calificacionService.updateRating(myRating.id, newRating);
        }
      } else {
        // Crear nueva calificación
        const materialKey = tipo === 'libro' ? 'libro' : tipo === 'manga' ? 'manga' : 'novela';
        await calificacionService.rateaterial({
          rating: newRating,
          [materialKey]: material.id
        });
      }
      setUserRating(newRating);
      setCommentNotice({ message: '⭐ Calificación guardada', type: 'success' });
      setTimeout(() => setCommentNotice({ message: '', type: '' }), 2000);
    } catch (error) {
      console.error('Error al calificar:', error);
      setCommentNotice({ message: '❌ No se pudo guardar la calificación', type: 'error' });
    } finally {
      setLoadingRating(false);
    }
  };

  // Funciones para editar y eliminar comentarios
  const handleEditComentario = (comentario) => {
    setEditingCommentId(comentario.id);
    setEditingText(comentario.descripcion);
  };

  const handleSaveEdit = async () => {
    if (!editingText.trim()) {
      setCommentNotice({ message: 'El comentario no puede estar vacío', type: 'error' });
      return;
    }

    try {
      setEnviandoComentario(true);
      await updateComentario(editingCommentId, { descripcion: editingText });
      setComentarios(comentarios.map(c => 
        c.id === editingCommentId ? { ...c, descripcion: editingText } : c
      ));
      setEditingCommentId(null);
      setEditingText('');
      setCommentNotice({ message: '✅ Comentario actualizado', type: 'success' });
      setTimeout(() => setCommentNotice({ message: '', type: '' }), 2000);
    } catch (error) {
      console.error('Error al actualizar comentario:', error);
      setCommentNotice({ message: '❌ No se pudo actualizar el comentario', type: 'error' });
    } finally {
      setEnviandoComentario(false);
    }
  };

  const handleDeleteComentario = async (comentarioId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      return;
    }

    try {
      setEnviandoComentario(true);
      await deleteComentario(comentarioId);
      setComentarios(comentarios.filter(c => c.id !== comentarioId));
      setCommentNotice({ message: '✅ Comentario eliminado', type: 'success' });
      setTimeout(() => setCommentNotice({ message: '', type: '' }), 2000);
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
      const errorMsg = error.response?.data?.detail || 'No se pudo eliminar el comentario';
      setCommentNotice({ message: `❌ ${errorMsg}`, type: 'error' });
    } finally {
      setEnviandoComentario(false);
    }
  };

  const palette = theme === 'light'
    ? {
        pageBg: '#f8fafc',
        cardBg: 'rgba(255, 255, 255, 0.9)',
        text: '#0f172a',
        textLight: '#475569',
        border: 'rgba(148, 163, 184, 0.3)',
        primary: '#06b6d4',
        accent: '#a855f7',
      }
    : {
        pageBg: '#0b1224',
        cardBg: 'rgba(17, 24, 39, 0.9)',
        text: '#e2e8f0',
        textLight: '#cbd5e1',
        border: 'rgba(148, 163, 184, 0.2)',
        primary: '#06b6d4',
        accent: '#a855f7',
      };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: palette.pageBg,
        color: palette.text,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 1s linear infinite' }}>⏳</div>
          <p>Cargando material...</p>
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: palette.pageBg,
        color: palette.text,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <p>{error || 'Material no encontrado'}</p>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.accent} 100%)`,
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: palette.pageBg,
      color: palette.text,
      padding: '24px',
    }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        }
      `}</style>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: `linear-gradient(135deg, ${palette.accent} 0%, ${palette.primary} 100%)`,
          border: 'none',
          borderRadius: '50%',
          width: '46px',
          height: '46px',
          cursor: 'pointer',
          fontSize: '20px',
          boxShadow: '0 12px 30px -10px rgba(0,0,0,0.45)',
          zIndex: 1000,
        }}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header con botón volver */}
        <button
          onClick={() => navigate('/')}
          style={{
            marginBottom: '24px',
            padding: '10px 16px',
            borderRadius: '10px',
            border: 'none',
            background: palette.cardBg,
            color: palette.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600',
            border: `1px solid ${palette.border}`,
          }}
        >
          ← Volver al catálogo
        </button>

        {/* Contenido principal */}
        <div style={{
          background: palette.cardBg,
          borderRadius: '20px',
          padding: '32px',
          border: `1px solid ${palette.border}`,
          boxShadow: '0 20px 40px -18px rgba(0,0,0,0.35)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '300px 1fr',
            gap: '32px',
            marginBottom: '32px',
          }}>
            {/* Portada */}
            <div>
              <img
                src={material.imagen || 'https://via.placeholder.com/300x450?text=Sin+Portada'}
                alt={material.titulo}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                }}
              />
            </div>

            {/* Información */}
            <div>
              <h1 style={{
                fontSize: '36px',
                fontWeight: 'bold',
                marginBottom: '12px',
                background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {material.titulo}
              </h1>

              <p style={{ fontSize: '18px', color: palette.textLight, marginBottom: '16px' }}>
                Por <strong>{material.autor}</strong>
              </p>

              {/* Rating */}
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <RatingStars
                  rating={userRating}
                  onRate={handleRating}
                  size={28}
                  interactive={!!user}
                />
                {loadingRating && <span style={{ fontSize: '14px', color: palette.textLight }}>⏳ Guardando...</span>}
                {!user && <span style={{ fontSize: '14px', color: palette.textLight }}>Inicia sesión para calificar</span>}
              </div>
              {material.avg_rating > 0 && (
                <div style={{ fontSize: '14px', color: palette.textLight, marginBottom: '16px' }}>
                  Promedio: {material.avg_rating?.toFixed(1)} ⭐ ({material.total_ratings || 0} calificaciones)
                </div>
              )}

              {/* Metadatos */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '24px',
              }}>
                <div style={{
                  padding: '12px',
                  background: palette.pageBg,
                  borderRadius: '8px',
                  border: `1px solid ${palette.border}`,
                }}>
                  <div style={{ fontSize: '12px', color: palette.textLight, marginBottom: '4px' }}>Editorial</div>
                  <div style={{ fontWeight: '600' }}>{material.editorial}</div>
                </div>

                <div style={{
                  padding: '12px',
                  background: palette.pageBg,
                  borderRadius: '8px',
                  border: `1px solid ${palette.border}`,
                }}>
                  <div style={{ fontSize: '12px', color: palette.textLight, marginBottom: '4px' }}>Año</div>
                  <div style={{ fontWeight: '600' }}>{material.anio_publicacion}</div>
                </div>

                {material.numero_paginas && (
                  <div style={{
                    padding: '12px',
                    background: palette.pageBg,
                    borderRadius: '8px',
                    border: `1px solid ${palette.border}`,
                  }}>
                    <div style={{ fontSize: '12px', color: palette.textLight, marginBottom: '4px' }}>Páginas</div>
                    <div style={{ fontWeight: '600' }}>{material.numero_paginas}</div>
                  </div>
                )}

                {material.isbn && (
                  <div style={{
                    padding: '12px',
                    background: palette.pageBg,
                    borderRadius: '8px',
                    border: `1px solid ${palette.border}`,
                  }}>
                    <div style={{ fontSize: '12px', color: palette.textLight, marginBottom: '4px' }}>ISBN</div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{material.isbn}</div>
                  </div>
                )}
              </div>

              {/* Géneros */}
              {material.generos && material.generos.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', color: palette.textLight, marginBottom: '8px' }}>Géneros</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {material.generos.map((genero, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '6px 12px',
                          background: `linear-gradient(135deg, ${palette.primary}20 0%, ${palette.accent}20 100%)`,
                          border: `1px solid ${palette.primary}40`,
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '600',
                        }}
                      >
                        {genero}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                {material.contenido_pdf_url ? (
                  <button
                    onClick={handleEmpezarALeer}
                    style={{
                      padding: '14px 28px',
                      borderRadius: '12px',
                      border: 'none',
                      background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.accent} 100%)`,
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      boxShadow: '0 10px 25px -8px rgba(0,0,0,0.45)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    📖 Empieza a leer
                  </button>
                ) : (
                  <div style={{
                    padding: '14px 28px',
                    borderRadius: '12px',
                    background: palette.pageBg,
                    border: `1px solid ${palette.border}`,
                    color: palette.textLight,
                    fontSize: '14px',
                  }}>
                    📄 Contenido no disponible
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Descripción */}
          {material.descripcion && (
            <div style={{
              marginTop: '32px',
              padding: '24px',
              background: palette.pageBg,
              borderRadius: '12px',
              border: `1px solid ${palette.border}`,
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '16px',
              }}>
                📝 Descripción
              </h2>
              <p style={{
                lineHeight: '1.8',
                color: palette.textLight,
                whiteSpace: 'pre-wrap',
              }}>
                {material.descripcion}
              </p>
            </div>
          )}

          {/* Sección de comentarios */}
          <div style={{
            marginTop: '32px',
            padding: '24px',
            background: palette.pageBg,
            borderRadius: '12px',
            border: `1px solid ${palette.border}`,
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px',
            }}>
              💬 Comentarios ({comentarios.length})
            </h2>

            {commentNotice.message && (
              <div style={{
                marginBottom: '16px',
                padding: '12px 16px',
                borderRadius: '10px',
                border: `1px solid ${commentNotice.type === 'error' ? '#fca5a5' : '#86efac'}`,
                background: commentNotice.type === 'error' ? '#fee2e2' : '#dcfce7',
                color: commentNotice.type === 'error' ? '#991b1b' : '#166534',
                fontWeight: '600',
              }}>
                {commentNotice.message}
              </div>
            )}

            {/* Formulario para nuevo comentario */}
            {user ? (
              <div style={{ marginBottom: '24px' }}>
                <textarea
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  placeholder="Escribe tu comentario..."
                  disabled={enviandoComentario}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${palette.border}`,
                    background: palette.cardBg,
                    color: palette.text,
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={handleEnviarComentario}
                  disabled={enviandoComentario || !nuevoComentario.trim()}
                  style={{
                    marginTop: '12px',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: enviandoComentario || !nuevoComentario.trim() 
                      ? palette.border 
                      : `linear-gradient(135deg, ${palette.primary} 0%, ${palette.accent} 100%)`,
                    color: '#fff',
                    cursor: enviandoComentario || !nuevoComentario.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                  }}
                >
                  {enviandoComentario ? '⏳ Publicando...' : '📤 Publicar comentario'}
                </button>
              </div>
            ) : (
              <div style={{
                padding: '16px',
                background: palette.cardBg,
                borderRadius: '8px',
                border: `1px solid ${palette.border}`,
                marginBottom: '24px',
                textAlign: 'center',
              }}>
                <p style={{ margin: '0 0 12px 0', color: palette.textLight }}>
                  Inicia sesión para comentar
                </p>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.accent} 100%)`,
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Iniciar sesión
                </button>
              </div>
            )}

            {/* Lista de comentarios */}
            {loadingComentarios ? (
              <div style={{ textAlign: 'center', padding: '20px', color: palette.textLight }}>
                ⏳ Cargando comentarios...
              </div>
            ) : comentarios.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: palette.textLight }}>
                No hay comentarios aún. ¡Sé el primero en comentar!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {comentarios.map((comentario) => {
                  const esPropio = user && comentario.user === user.id;
                  const editando = editingCommentId === comentario.id;

                  return (
                    <div
                      key={comentario.id}
                      style={{
                        padding: '16px',
                        background: palette.cardBg,
                        borderRadius: '8px',
                        border: `1px solid ${palette.border}`,
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flex: 1,
                        }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.accent} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 'bold',
                          }}>
                            {comentario.nombre_usuario?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', color: palette.text }}>
                              {comentario.nombre_usuario || 'Usuario'}
                              {esPropio && <span style={{ fontSize: '12px', color: palette.primary, marginLeft: '8px' }}>(Tú)</span>}
                            </div>
                            <div style={{ fontSize: '12px', color: palette.textLight }}>
                              {new Date(comentario.fecha).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                        {/* Botones de editar/eliminar solo para el propietario */}
                        {esPropio && !editando && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleEditComentario(comentario)}
                              disabled={enviandoComentario}
                              style={{
                                background: palette.primary,
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                opacity: enviandoComentario ? 0.6 : 1,
                              }}
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => handleDeleteComentario(comentario.id)}
                              disabled={enviandoComentario}
                              style={{
                                background: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                opacity: enviandoComentario ? 0.6 : 1,
                              }}
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                      {/* Mostrar texto en edición o modo lectura */}
                      {editando ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            disabled={enviandoComentario}
                            style={{
                              padding: '12px',
                              borderRadius: '6px',
                              border: `1px solid ${palette.border}`,
                              background: palette.inputBg || 'rgba(15, 23, 42, 0.6)',
                              color: palette.text,
                              fontFamily: 'inherit',
                              fontSize: '14px',
                              resize: 'vertical',
                              minHeight: '80px',
                            }}
                          />
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditingText('');
                              }}
                              disabled={enviandoComentario}
                              style={{
                                background: palette.textLight,
                                color: palette.text,
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                opacity: enviandoComentario ? 0.6 : 1,
                              }}
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              disabled={enviandoComentario}
                              style={{
                                background: palette.primary,
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                opacity: enviandoComentario ? 0.6 : 1,
                              }}
                            >
                              {enviandoComentario ? '⏳ Guardando...' : '✅ Guardar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p style={{
                          margin: 0,
                          color: palette.textLight,
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                        }}>
                          {comentario.descripcion}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleMaterialPage;
