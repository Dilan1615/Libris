import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import MaterialCard from '../components/MaterialCard';
import CommentModal from '../components/CommentModal'; // Nuevo
import { getLibros, getMangas, getNovelas, getLibrosExternos, createRegistroLectura, createComentario } from '../api/materialService';
import '../styles/animations.css';

const HomePage = () => {
  const [materiales, setMateriales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [featured, setFeatured] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [debugOpen, setDebugOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('catalogo');
  const [filterType, setFilterType] = useState('todos');
  
  // Estado para el modal de comentarios
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [materialToComment, setMaterialToComment] = useState(null);
  
  // Estados para notificaciones
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  const { isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // Función para mostrar notificación temporal
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    
    // Aumentar duración para advertencias importantes
    const isContentFlag = message.toLowerCase().includes('inapropiado') || message.toLowerCase().includes('ofensivo');
    const duration = (type === 'error' && isContentFlag) ? 6000 : 3000;
    
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, duration);
  };

  // Función de scroll (debe estar antes de los returns condicionales)
  const scrollToResults = useCallback(() => {
    const target = document.getElementById('section-resultados');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    const fetchMateriales = async () => {
      console.log('🔄 [HomePage] Iniciando carga de materiales...');
      setIsLoading(true);
      
      try {
        console.log('📚 Cargando materiales...');
        
        // Usar Promise.allSettled para que si uno falla, los otros continúen
        const results = await Promise.allSettled([
          getLibros({ page: 1, page_size: 10 }),
          getMangas({ page: 1, page_size: 10 }),
          getNovelas({ page: 1, page_size: 10 }),
          getLibrosExternos(),
        ]);

        console.log('📦 [HomePage] Resultados recibidos:', results);

        // Procesar resultados
        const [librosRes, mangasRes, novelasRes, librosExternos] = results;

        // Extrae datos según el estado
        const librosData = librosRes.status === 'fulfilled' 
          ? (Array.isArray(librosRes.value) ? librosRes.value : (librosRes.value.results || []))
          : [];
        
        const mangasData = mangasRes.status === 'fulfilled'
          ? (Array.isArray(mangasRes.value) ? mangasRes.value : (mangasRes.value.results || []))
          : [];
        
        const novelasData = novelasRes.status === 'fulfilled'
          ? (Array.isArray(novelasRes.value) ? novelasRes.value : (novelasRes.value.results || []))
          : [];
        
        const librosExternosData = librosExternos.status === 'fulfilled'
          ? (Array.isArray(librosExternos.value) ? librosExternos.value : (librosExternos.value.results || []))
          : [];

        // Log de cada endpoint
        console.log('✅ Libros:', librosData.length, librosRes.status === 'rejected' ? '(ERROR)' : '');
        console.log('✅ Mangas:', mangasData.length, mangasRes.status === 'rejected' ? '(ERROR)' : '');
        console.log('✅ Novelas:', novelasData.length, novelasRes.status === 'rejected' ? '(ERROR)' : '');
        console.log('✅ Google Books:', librosExternosData.length, librosExternos.status === 'rejected' ? '(ERROR)' : '');

        if (librosRes.status === 'rejected') console.error('Libros error:', librosRes.reason);
        if (mangasRes.status === 'rejected') console.error('Mangas error:', mangasRes.reason);
        if (novelasRes.status === 'rejected') console.error('Novelas error:', novelasRes.reason);
        if (librosExternos.status === 'rejected') console.error('Google Books error:', librosExternos.reason);

        // Combinar resultados
        const combinedMaterials = [
            ...librosData.map(m => ({ ...m, tipo: 'libro' })),
            ...librosExternosData.map(m => ({ ...m, tipo: 'libro', es_externo: true })),
            ...mangasData.map(m => ({ ...m, tipo: 'manga' })),
            ...novelasData.map(m => ({ ...m, tipo: 'novela' })),
        ];

        console.log('✅ Materiales combinados:', combinedMaterials.length);
        console.log('🎯 [HomePage] Cambiando isLoading a false');
        
        if (combinedMaterials.length === 0) {
          console.warn('⚠️ No hay materiales');
          setError("No hay materiales disponibles en el backend.");
        } else {
          setMateriales(combinedMaterials);
          setFeatured(combinedMaterials[0] || null);
          console.log('✅ [HomePage] Materiales cargados exitosamente');
        }
      } catch (err) {
        console.error("❌ Error general al cargar:", err);
        setError(`Error inesperado: ${err.message}`);
      } finally {
        console.log('🏁 [HomePage] Finalizando carga, isLoading = false');
        setIsLoading(false);
      }
    };

    fetchMateriales();
  }, []);

  // ---------------------------------------------
  // NUEVA LÓGICA: REGISTRO DE LECTURA (LEER/GUARDAR)
  // ---------------------------------------------
  const handleCreateRegistro = async (materialId, tipo) => {
    if (!isLoggedIn) {
      showNotification('Debes iniciar sesión para guardar o leer.', 'error');
      return;
    }
    
    // El payload debe contener la información necesaria para el RegistroLectura
    // Asunción: El ViewSet de Django Rest Framework podrá manejar el ID del material específico (Libro, Manga, Novela)
    
    // Necesitamos mapear el tipo a la clave correcta para el serializer
    let payload = { estado: 'PENDIENTE', pagina_actual: 1, tipo };
    
    // ¡IMPORTANTE! Esto es una asunción del payload si tu ViewSet no usa MaterialGeneral ID
    // Si tu ViewSet usa MaterialGeneral ID, el payload debe ser: { material: materialGeneralId, ... }
    // A falta de ver tu ViewSet, usamos la clave del material específico:
    switch (tipo) {
        // Si tu backend requiere el ID específico del material:
        case 'libro':
            payload.libro = materialId; 
            break;
        case 'manga':
            payload.manga = materialId;
            break;
        case 'novela':
            payload.novela = materialId;
            break;
        default:
          showNotification('Tipo de material no reconocido.', 'error');
            return;
    }

    try {
      const response = await createRegistroLectura(payload); // POST a /api/registros/
      showNotification(`✅ "${response.titulo}" guardado en tu biblioteca`);
    } catch (err) {
      // Manejar el caso de que el registro ya exista
      if (err.response?.status === 400 && err.response.data?.non_field_errors?.[0].includes('ya existe')) {
        showNotification('Ya tienes este material en tu biblioteca', 'info');
      } else {
        console.error('Error al crear registro:', err.response?.data || err.message);
        showNotification(`❌ Error al guardar: ${err.message}`, 'error');
      }
    }
  };

  // ---------------------------------------------
  // NUEVA LÓGICA: COMENTARIOS
  // ---------------------------------------------
  const handleOpenCommentModal = (material) => {
    setMaterialToComment(material);
    setShowCommentModal(true);
  };
  
  const handleCloseCommentModal = () => {
    setMaterialToComment(null);
    setShowCommentModal(false);
  };

  const handleCreateComentario = async (material, description) => {
    if (!isLoggedIn) return;

    // Crear el payload de comentario
    let payload = { descripcion: description };
    
    // Añadir la FK correcta (solo una)
    switch (material.tipo) {
        case 'libro':
            payload.libro = material.id; 
            break;
        case 'manga':
            payload.manga = material.id;
            break;
        case 'novela':
            payload.novela = material.id;
            break;
        default:
            throw new Error("Tipo de material no reconocido para el comentario.");
    }
    
    try {
      await createComentario(payload); // POST a /api/comentarios/
      showNotification(`💬 Comentario publicado en "${material.titulo}"`);
    } catch (err) {
      // Verificar si es un error de contenido inapropiado
      if (err.response?.status === 400 && err.response?.data?.descripcion) {
        const errorMsg = Array.isArray(err.response.data.descripcion) 
          ? err.response.data.descripcion[0] 
          : err.response.data.descripcion;
        
        if (errorMsg.includes('inapropiado') || errorMsg.includes('ofensivo')) {
          showNotification('🚫 ' + errorMsg, 'error');
        } else {
          showNotification('❌ ' + errorMsg, 'error');
        }
      } else {
        showNotification('❌ Error al publicar el comentario', 'error');
      }
      console.error('Error al crear comentario:', err);
      throw err; // Re-lanza para que el modal sepa que falló
    }
  };

  if (isLoading) {
    console.log('🔄 [Render] Mostrando pantalla de carga...');
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0f172a',
        color: '#e5e7eb',
        padding: '20px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(59, 130, 246, 0.2)',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '24px'
        }}></div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', margin: '0 0 12px 0' }}>
          Cargando biblioteca...
        </h2>
        <p style={{ fontSize: '1rem', margin: '0', opacity: 0.7 }}>
          Obteniendo materiales del servidor
        </p>
      </div>
    );
  }

  console.log('✅ [Render] isLoading es false, continuando...');

  const librosList = materiales.filter(m => m.tipo === 'libro');
  const mangasList = materiales.filter(m => m.tipo === 'manga');
  const novelasList = materiales.filter(m => m.tipo === 'novela');
  // Top populares: ordenar por avg_rating y total_ratings si disponibles
  const populares = [...materiales]
    .filter(m => typeof m.avg_rating === 'number')
    .sort((a, b) => {
      const ar = a.avg_rating || 0; const br = b.avg_rating || 0;
      if (br !== ar) return br - ar;
      const ac = a.total_ratings || 0; const bc = b.total_ratings || 0;
      return bc - ac;
    })
    .slice(0, 12);
  const filtered = materiales.filter(m => {
    const matchesSearch = m.titulo?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterType === 'todos' ? true : m.tipo === filterType;
    return matchesSearch && matchesFilter;
  });

  console.log('🎨 Renderizando HomePage:');
  console.log('  - isLoading:', isLoading);
  console.log('  - error:', error);
  console.log('  - materiales.length:', materiales.length);
  console.log('  - librosList:', librosList.length);
  console.log('  - mangasList:', mangasList.length);
  console.log('  - novelasList:', novelasList.length);
  console.log('  - filtered:', filtered.length);

  const stats = [
    { label: 'Libros', value: librosList.length },
    { label: 'Mangas', value: mangasList.length },
    { label: 'Novelas', value: novelasList.length },
    { label: 'Total', value: materiales.length },
  ];

  const isDark = theme === 'dark';
  const palette = {
    pageBg: isDark ? '#0f172a' : '#ffffff',
    text: isDark ? '#e5e7eb' : '#1f2937',
    textLight: isDark ? '#94a3b8' : '#6b7280',
    cardBg: isDark ? '#1e293b' : '#f8fafc',
    cardBorder: isDark ? '#334155' : '#e2e8f0',
    heroBg: isDark ? 'linear-gradient(135deg, #1e1b4b 0%, #16213e 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    heroText: isDark ? '#f1f5f9' : '#ffffff',
    heroSub: isDark ? '#cbd5e1' : '#f1f5f9',
    primary: isDark ? '#3b82f6' : '#667eea',
    secondary: isDark ? '#334155' : '#e2e8f0',
    navBg: isDark ? '#0f172a' : '#ffffff',
    navBorder: isDark ? '#1e293b' : '#e2e8f0',
    accent: '#764ba2',
  };

  // Eliminado PopularHero para evitar duplicación y tarjetas fuera del carrusel

  const PopularCarousel = ({ items }) => {
    if (!items || items.length === 0) return null;
    return (
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ color: palette.text, fontSize: 18, fontWeight: 700, margin: 0 }}>Popular ahora</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => {
              const el = document.getElementById('popular-slider');
              if (el) el.scrollBy({ left: -400, behavior: 'smooth' });
            }} style={{ padding: 8, borderRadius: 8, border: `1px solid ${palette.cardBorder}`, background: palette.cardBg, color: palette.text }}>◀</button>
            <button onClick={() => {
              const el = document.getElementById('popular-slider');
              if (el) el.scrollBy({ left: 400, behavior: 'smooth' });
            }} style={{ padding: 8, borderRadius: 8, border: `1px solid ${palette.cardBorder}`, background: palette.cardBg, color: palette.text }}>▶</button>
          </div>
        </div>
        <div id="popular-slider" style={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: 'minmax(220px, 1fr)',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 6,
          scrollbarWidth: 'thin'
        }}>
          {items.map((m) => (
            <div key={`${m.tipo}-${m.id}`} style={{ minWidth: 220 }}>
              <MaterialCard
                material={m}
                tipo={m.tipo}
                onCreateRegistro={handleCreateRegistro}
                onOpenComment={handleOpenCommentModal}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div style={{...styles.page, background: palette.pageBg, color: palette.text, minHeight: '100vh', justifyContent: 'center', alignItems: 'center', position: 'relative'}}>
        {/* Botón flotante de Debug */}
        <button 
          onClick={() => setDebugOpen(!debugOpen)}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 999,
            padding: '10px 14px',
            background: palette.primary,
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '18px',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Abrir panel de debug"
        >
          🐛
        </button>
        
        {/* Panel de Debug */}
        {debugOpen && (
          <div style={{
            position: 'fixed',
            top: '70px',
            right: '20px',
            zIndex: 998,
            background: palette.cardBg,
            border: `2px solid ${palette.cardBorder}`,
            borderRadius: '12px',
            padding: '16px',
            maxWidth: '400px',
            maxHeight: '400px',
            overflowY: 'auto',
            fontSize: '12px',
            fontFamily: 'monospace',
            color: palette.text,
          }}>
            <div style={{marginBottom: '12px', fontWeight: 'bold', fontSize: '14px'}}>
              🔍 Panel de Debug
            </div>
            <div style={{fontSize: '11px', lineHeight: '1.6', whiteSpace: 'pre-wrap'}}>
              <br /><strong>Error actual:</strong>
              <br />{error}
              <br />
            </div>
          </div>
        )}
        
        <div style={{...styles.errorContainer, background: palette.cardBg, borderColor: palette.cardBorder}}>
          <div style={styles.errorIcon}>⚠️</div>
          <h2 style={{...styles.errorTitle, color: palette.text}}>Oops, algo salió mal</h2>
          <p style={{...styles.errorMessage, color: palette.heroSub}}>{error}</p>
          <div style={{background: palette.secondary, padding: '12px', borderRadius: '8px', marginBottom: '16px', maxHeight: '150px', overflowY: 'auto', fontSize: '0.85rem', color: palette.heroSub}}>
            <strong>Cosas a verificar:</strong>
            <ul style={{margin: '8px 0', paddingLeft: '20px'}}>
              <li>Presiona 🐛 (arriba a la derecha) para más info</li>
            </ul>
          </div>
          <button 
            style={{...styles.retryBtn, background: palette.primary, color: '#fff'}}
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
          <p style={{...styles.errorHint, color: palette.heroSub, fontSize: '0.9rem'}}>Estamos trabajando en corregir esto. Por favor, intenta de nuevo en unos momentos.</p>
        </div>
      </div>
    );
  }
  
  if (materiales.length === 0) {
    return (
      <div style={{...styles.page, background: palette.pageBg, color: palette.text, minHeight: '100vh', justifyContent: 'center', alignItems: 'center'}}>
        <div style={{...styles.emptyContainer, background: palette.cardBg, borderColor: palette.cardBorder}}>
          <div style={styles.emptyIcon}>📚</div>
          <h2 style={{...styles.emptyTitle, color: palette.text}}>Tu biblioteca está vacía</h2>
          <p style={{...styles.emptyMessage, color: palette.heroSub}}>No hay materiales disponibles en este momento.</p>
          <p style={{...styles.emptyHint, color: palette.heroSub}}>Estamos trabajando para agregar más contenido. Vuelve pronto.</p>
          <button 
            style={{...styles.retryBtn, background: palette.primary, color: '#fff'}}
            onClick={() => window.location.reload()}
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{...styles.page, background: palette.pageBg, color: palette.text}}>
      <div style={styles.glowOrb}></div>
      <div style={styles.glowOrb2}></div>
      
      {/* Notificación flotante */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: notification.type === 'error' ? '#dc2626' : notification.type === 'info' ? '#3b82f6' : '#10b981',
          color: '#fff',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: notification.type === 'error'
            ? '0 15px 50px rgba(220, 38, 38, 0.5), 0 0 0 3px rgba(220, 38, 38, 0.3)'
            : '0 10px 40px rgba(0,0,0,0.3)',
          fontSize: '1rem',
          fontWeight: '600',
          minWidth: '300px',
          maxWidth: '500px',
          animation: notification.type === 'error'
            ? 'slideInRight 0.3s ease-out, shake 0.5s ease-in-out 0.3s'
            : 'slideInRight 0.3s ease-out, fadeOut 0.5s ease-in 2.5s',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          lineHeight: '1.5'
        }}>
          {notification.message}
        </div>
      )}
      
      {/* Navbar */}
      <header style={{...styles.navbar, background: palette.navBg, borderBottomColor: palette.navBorder, color: palette.text}}>
        <div style={{...styles.brand, fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', cursor: 'pointer'}}>
          📚 Libris
        </div>
        <div style={styles.navLinks}>
          {['catalogo', 'libros', 'mangas', 'novelas'].map(link => {
            const capitalLink = link.charAt(0).toUpperCase() + link.slice(1);
            return (
              <a 
                key={link}
                onClick={() => {
                  setActiveNav(link);
                  const sectionElement = document.getElementById(`section-${link}`);
                  if (sectionElement) {
                    sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                style={{
                  ...styles.navLink,
                  color: activeNav === link ? palette.accent : palette.text,
                  borderBottomColor: activeNav === link ? palette.accent : 'transparent',
                  borderBottomWidth: '2px',
                  borderBottomStyle: 'solid',
                  paddingBottom: '4px',
                  transition: 'all 0.3s ease',
                }}
              >
                {capitalLink}
              </a>
            );
          })}
        </div>
        <div style={styles.navActions}>
          {isLoggedIn ? (
            <>
              {isAdmin && (
                <button
                  style={{ 
                    ...styles.navBtn, 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    fontWeight: '600',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                  }}
                  onClick={() => navigate('/admin')}
                >
                  ⚙️ Panel de Admin
                </button>
              )}
              <button
                style={{ ...styles.navBtn, background: palette.accent, color: '#fff' }}
                onClick={() => navigate('/profile')}
              >
                👤 Perfil
              </button>
              <button
                style={{ ...styles.navBtn, background: '#ef4444', color: '#fff' }}
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                🚪 Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <button
                style={{ ...styles.navBtn, background: palette.accent, color: '#fff' }}
                onClick={() => navigate('/login')}
              >
                🔑 Iniciar sesión
              </button>
              <button
                style={{ ...styles.navBtn, background: palette.primary, color: '#fff' }}
                onClick={() => navigate('/register')}
              >
                ✨ Registrarse
              </button>
            </>
          )}
          <button 
            style={{
              ...styles.themeBtn,
              background: palette.secondary,
              color: palette.text,
              borderColor: palette.cardBorder,
            }} 
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            title="Cambiar tema"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Sección Popular ahora (carrusel único) — movida bajo búsqueda */}

      {/* Stats */}
      <div style={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ ...styles.statCard, background: palette.cardBg, borderColor: palette.cardBorder }}>
            <div style={{ ...styles.statNumber, color: palette.accent }}>{stat.value}</div>
            <div style={{ ...styles.statLabel, color: palette.textLight }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Hero removido para mantener una sola presentación de "Popular ahora" */}

      {/* Búsqueda y filtros */}
      <section style={{...styles.searchSection}} id="section-busqueda">
          <div style={styles.searchRow}>
            <div style={{ ...styles.searchContainer, borderColor: palette.cardBorder }}>
              <input
                type="text"
                placeholder="Buscar por título"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    scrollToResults();
                  }
                }}
                style={{ ...styles.searchInput, borderColor: palette.cardBorder, background: palette.cardBg, color: palette.text }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={styles.clearSearchBtn} aria-label="Limpiar búsqueda">
                  ×
                </button>
              )}
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ ...styles.filterSelect, borderColor: palette.cardBorder, background: palette.cardBg, color: palette.text }}
            >
              <option value="todos">Todos</option>
              <option value="libro">Libros</option>
              <option value="manga">Mangas</option>
              <option value="novela">Novelas</option>
            </select>
          </div>
      </section>

      {/* Resultados de búsqueda en tiempo real - sección separada para mejor layout */}
      {(search || filterType !== 'todos') && (
        <section style={{...styles.gridSection}}>
          <h2 style={{...styles.sectionTitle, color: palette.text}}>
            Resultados ({filtered.length})
          </h2>
          {filtered.length === 0 ? (
            <p style={{ color: palette.text, textAlign: 'center', padding: '40px 20px' }}>
              No encontramos resultados. Prueba con otro término.
            </p>
          ) : (
            <div style={styles.grid}>
              {filtered.map((item) => (
                <MaterialCard
                  key={`res-${item.tipo}-${item.id}`}
                  material={item}
                  tipo={item.tipo}
                  onCreateRegistro={handleCreateRegistro}
                  onOpenComment={handleOpenCommentModal}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Popular ahora - solo se muestra si no hay búsqueda activa */}
      {!search && filterType === 'todos' && (
        <div style={{ maxWidth: 1100, margin: '0 auto 0', padding: '16px', position: 'relative', zIndex: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: palette.text }}>Popular ahora</h2>
          </div>
          <PopularCarousel items={populares} />
        </div>
      )}

      {/* Sección de categorías - solo se muestra si no hay búsqueda activa */}
      {!search && filterType === 'todos' && (
        <section style={styles.railSection} id="section-libros">
          <h2 style={{...styles.sectionTitle, color: palette.text}}>Libros</h2>
          <div style={styles.rail}>
            {librosList.map(item => (
              <MaterialCard
                key={`libro-${item.id}`}
                material={item}
                tipo={item.tipo}
                onCreateRegistro={handleCreateRegistro}
                onOpenComment={handleOpenCommentModal}
              />
            ))}
          </div>

          <h2 style={{...styles.sectionTitle, color: palette.text}} id="section-mangas">Mangas</h2>
          <div style={styles.rail}>
            {mangasList.map(item => (
              <MaterialCard
                key={`manga-${item.id}`}
                material={item}
                tipo={item.tipo}
                onCreateRegistro={handleCreateRegistro}
                onOpenComment={handleOpenCommentModal}
              />
            ))}
          </div>

          <h2 style={{...styles.sectionTitle, color: palette.text}} id="section-novelas">Novelas</h2>
          <div style={styles.rail}>
            {novelasList.map(item => (
              <MaterialCard
                key={`novela-${item.id}`}
                material={item}
                tipo={item.tipo}
                onCreateRegistro={handleCreateRegistro}
                onOpenComment={handleOpenCommentModal}
              />
            ))}
          </div>
        </section>
      )}

      {/* Grid filtrado */}
      {!search && filterType === 'todos' && (
        <section style={styles.gridSection} id="section-catalogo">
          <h2 style={{...styles.sectionTitle, color: palette.text}}>Todo el catálogo</h2>
          <div style={styles.grid}>
            {materiales.map((material) => (
              <MaterialCard 
                key={`${material.tipo}-${material.id}`} 
                material={material} 
                tipo={material.tipo}
                onCreateRegistro={handleCreateRegistro} 
                onOpenComment={handleOpenCommentModal}
              />
            ))}
          </div>
        </section>
      )}

      {showCommentModal && (
        <CommentModal
          material={materialToComment}
          onClose={handleCloseCommentModal}
          onSubmit={handleCreateComentario}
        />
      )}
    </div>
  );
};

const styles = {
  page: {
    padding: '32px 20px 48px',
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    minHeight: '100vh',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    textAlign: 'center',
    padding: '60px 40px',
  },
  spinner: {
    width: '60px',
    height: '60px',
    border: '4px solid rgba(102, 126, 234, 0.2)',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingTitle: {
    fontSize: '1.8rem',
    fontWeight: '700',
    margin: '0',
  },
  loadingSubtitle: {
    fontSize: '1.1rem',
    margin: '0',
  },
  dots: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#667eea',
    animation: 'bounce 1.4s infinite',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    textAlign: 'center',
    padding: '60px 40px',
    borderRadius: '16px',
    border: '2px solid',
    maxWidth: '500px',
  },
  errorIcon: {
    fontSize: '64px',
    animation: 'shake 0.5s ease-in-out',
  },
  errorTitle: {
    fontSize: '1.8rem',
    fontWeight: '700',
    margin: '0',
  },
  errorMessage: {
    fontSize: '1.1rem',
    margin: '0',
    lineHeight: '1.5',
  },
  errorHint: {
    fontSize: '0.95rem',
    margin: '0',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    textAlign: 'center',
    padding: '60px 40px',
    borderRadius: '16px',
    border: '2px solid',
    maxWidth: '500px',
  },
  emptyIcon: {
    fontSize: '80px',
  },
  emptyTitle: {
    fontSize: '1.8rem',
    fontWeight: '700',
    margin: '0',
  },
  emptyMessage: {
    fontSize: '1.1rem',
    margin: '0',
  },
  emptyHint: {
    fontSize: '0.95rem',
    margin: '0',
  },
  retryBtn: {
    padding: '12px 32px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '12px',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '20px',
    padding: '40px',
    borderRadius: '16px',
    color: 'white',
  },
  heroText: { display: 'flex', flexDirection: 'column', gap: '12px' },
  eyebrow: { letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.85rem', color: '#9ca3af' },
  heroTitle: { fontSize: '2.8rem', margin: 0, fontWeight: '800' },
  heroDesc: { color: '#e5e7eb', margin: 0, fontSize: '1.1rem' },
  heroActions: { display: 'flex', gap: '12px', marginTop: '16px' },
  primaryBtn: { padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.3s ease' },
  secondaryBtn: { padding: '10px 16px', background: 'transparent', color: '#e5e7eb', border: '1px solid #4b5563', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s ease' },
  heroCard: { borderRadius: '12px', padding: '20px' },
  heroPill: { display: 'inline-block', padding: '6px 12px', color: '#93c5fd', borderRadius: '999px', fontSize: '0.85rem', marginBottom: '12px' },
  heroCardTitle: { margin: '10px 0 8px', fontSize: '1.4rem', fontWeight: '700' },
  heroMeta: { margin: '4px 0', fontSize: '0.95rem' },
  navbar: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: '16px 0',
    borderBottom: '1px solid',
    marginBottom: '24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(10px)',
  },
  brand: { fontSize: '1.5rem', fontWeight: 'bold' },
  navLinks: { display: 'flex', gap: '28px', alignItems: 'center' },
  navLink: { color: 'inherit', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.3s ease' },
  navActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  navBtn: { border: 'none', borderRadius: '10px', padding: '10px 14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 20px -10px rgba(0,0,0,0.35)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' },
  themeBtn: { padding: '8px 12px', border: '1px solid', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', transition: 'all 0.3s ease', fontWeight: '600' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '18px' },
  statCard: { padding: '14px 16px', borderRadius: '14px', border: '1px solid', boxShadow: '0 15px 30px -20px rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' },
  statNumber: { fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' },
  statLabel: { fontSize: '0.9rem', fontWeight: 600 },
  glowOrb: { position: 'fixed', top: '120px', right: '-80px', width: '220px', height: '220px', background: 'radial-gradient(circle at center, rgba(118,75,162,0.25), transparent 60%)', filter: 'blur(20px)', zIndex: 0, pointerEvents: 'none' },
  glowOrb2: { position: 'fixed', top: '420px', left: '-90px', width: '260px', height: '260px', background: 'radial-gradient(circle at center, rgba(59,130,246,0.2), transparent 60%)', filter: 'blur(24px)', zIndex: 0, pointerEvents: 'none' },
  searchSection: { display: 'flex', justifyContent: 'center', marginBottom: '16px', position: 'relative', zIndex: 1 },
  searchRow: { display: 'grid', gridTemplateColumns: '1fr 200px', gap: '12px', width: '100%', maxWidth: '900px' },
  searchContainer: { position: 'relative', width: '100%' },
  searchInput: { width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid', fontSize: '1rem', transition: 'all 0.3s ease' },
  clearSearchBtn: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af' },
  searchBtn: { border: 'none', borderRadius: '12px', padding: '12px 16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 20px -10px rgba(0,0,0,0.35)' },
  filterSelect: { borderRadius: '12px', border: '2px solid', padding: '12px 10px', fontWeight: 600, fontSize: '0.95rem', appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, #9ca3af 50%), linear-gradient(135deg, #9ca3af 50%, transparent 50%)', backgroundPosition: 'calc(100% - 18px) calc(50% - 2px), calc(100% - 12px) calc(50% - 2px)', backgroundSize: '6px 6px, 6px 6px', backgroundRepeat: 'no-repeat' },
  railSection: { display: 'flex', flexDirection: 'column', gap: '28px', scrollMarginTop: '110px' },
  sectionTitle: { margin: '0 0 20px 0', fontSize: '1.8rem', fontWeight: '800' },
  rail: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', padding: '0' },
  gridSection: { display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px', scrollMarginTop: '110px', minHeight: '100px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', padding: '0' }
};

export default HomePage;