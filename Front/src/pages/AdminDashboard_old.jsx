import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('libros');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Estados para formularios
  const [libroForm, setLibroForm] = useState({
    titulo: '',
    autor: '',
    editorial: '',
    anio_publicacion: '',
    genero: '',
    numero_paginas: '',
    isbn: '',
    portada: null
  });

  const [mangaForm, setMangaForm] = useState({
    titulo: '',
    autor: '',
    editorial: '',
    anio_publicacion: '',
    genero: '',
    tomo: '',
    capitulos: '',
    estado_publicacion: 'EN_CURSO',
    portada: null
  });

  const [novelaForm, setNovelaForm] = useState({
    titulo: '',
    autor: '',
    editorial: '',
    anio_publicacion: '',
    genero: '',
    numero_capitulos: '',
    tipo: 'LIGERA',
    portada: null
  });

  const handleFileChange = (e, formType) => {
    const file = e.target.files[0];
    if (file) {
      if (formType === 'libro') setLibroForm({ ...libroForm, portada: file });
      if (formType === 'manga') setMangaForm({ ...mangaForm, portada: file });
      if (formType === 'novela') setNovelaForm({ ...novelaForm, portada: file });
    }
  };

  const handleSubmitLibro = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const required = ['titulo', 'autor', 'editorial', 'anio_publicacion', 'genero'];
      for (const field of required) {
        if (!libroForm[field] || String(libroForm[field]).trim() === '') {
          throw new Error(`El campo "${field}" es obligatorio`);
        }
      }

      const normalized = {
        ...libroForm,
        anio_publicacion: parseInt(libroForm.anio_publicacion, 10),
        numero_paginas: libroForm.numero_paginas ? parseInt(libroForm.numero_paginas, 10) : undefined,
      };

      const formData = new FormData();
      Object.keys(normalized).forEach(key => {
        const val = normalized[key];
        if (val !== null && val !== '' && typeof val !== 'undefined') {
          formData.append(key, val);
        }
      });

      await apiClient.post('/api/libros/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage({ type: 'success', text: '✅ Libro creado exitosamente' });
      setLibroForm({
        titulo: '', autor: '', editorial: '', anio_publicacion: '',
        genero: '', numero_paginas: '', isbn: '', portada: null
      });
      // Reset file input
      document.querySelector('input[type="file"]').value = '';
    } catch (error) {
      const backendMsg = error.response?.data || error.response?.data?.detail;
      const text = typeof backendMsg === 'string' ? backendMsg : (backendMsg ? JSON.stringify(backendMsg) : error.message);
      setMessage({ type: 'error', text: `❌ Error: ${text}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitManga = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const required = ['titulo', 'autor', 'editorial', 'anio_publicacion', 'genero'];
      for (const field of required) {
        if (!mangaForm[field] || String(mangaForm[field]).trim() === '') {
          throw new Error(`El campo "${field}" es obligatorio`);
        }
      }

      const normalized = {
        ...mangaForm,
        anio_publicacion: parseInt(mangaForm.anio_publicacion, 10),
        tomo: mangaForm.tomo ? parseInt(mangaForm.tomo, 10) : undefined,
        capitulos: mangaForm.capitulos ? parseInt(mangaForm.capitulos, 10) : undefined,
      };

      const formData = new FormData();
      Object.keys(normalized).forEach(key => {
        const val = normalized[key];
        if (val !== null && val !== '' && typeof val !== 'undefined') {
          formData.append(key, val);
        }
      });

      await apiClient.post('/api/mangas/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage({ type: 'success', text: '✅ Manga creado exitosamente' });
      setMangaForm({
        titulo: '', autor: '', editorial: '', anio_publicacion: '',
        genero: '', tomo: '', capitulos: '', estado_publicacion: 'EN_CURSO', portada: null
      });
      document.querySelector('input[type="file"]').value = '';
    } catch (error) {
      const backendMsg = error.response?.data || error.response?.data?.detail;
      const text = typeof backendMsg === 'string' ? backendMsg : (backendMsg ? JSON.stringify(backendMsg) : error.message);
      setMessage({ type: 'error', text: `❌ Error: ${text}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitNovela = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const required = ['titulo', 'autor', 'editorial', 'anio_publicacion', 'genero'];
      for (const field of required) {
        if (!novelaForm[field] || String(novelaForm[field]).trim() === '') {
          throw new Error(`El campo "${field}" es obligatorio`);
        }
      }

      const normalized = {
        ...novelaForm,
        anio_publicacion: parseInt(novelaForm.anio_publicacion, 10),
        numero_capitulos: novelaForm.numero_capitulos ? parseInt(novelaForm.numero_capitulos, 10) : undefined,
        volumen: novelaForm.volumen ? parseInt(novelaForm.volumen, 10) : undefined,
      };

      const formData = new FormData();
      Object.keys(normalized).forEach(key => {
        const val = normalized[key];
        if (val !== null && val !== '' && typeof val !== 'undefined') {
          formData.append(key, val);
        }
      });

      await apiClient.post('/api/novelas/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage({ type: 'success', text: '✅ Novela creada exitosamente' });
      setNovelaForm({
        titulo: '', autor: '', editorial: '', anio_publicacion: '',
        genero: '', numero_capitulos: '', tipo: 'LIGERA', portada: null
      });
      document.querySelector('input[type="file"]').value = '';
    } catch (error) {
      const backendMsg = error.response?.data || error.response?.data?.detail;
      const text = typeof backendMsg === 'string' ? backendMsg : (backendMsg ? JSON.stringify(backendMsg) : error.message);
      setMessage({ type: 'error', text: `❌ Error: ${text}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const palette = {
    pageBg: '#0f172a',
    cardBg: '#1e293b',
    cardBorder: '#334155',
    text: '#e5e7eb',
    textLight: '#94a3b8',
    primary: '#3b82f6',
    accent: '#764ba2',
    success: '#10b981',
    error: '#ef4444',
    inputBg: '#0f172a',
    inputBorder: '#334155',
  };

  const styles = {
    page: { minHeight: '100vh', background: palette.pageBg, color: palette.text, padding: '0' },
    header: { background: palette.cardBg, borderBottom: `1px solid ${palette.cardBorder}`, padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    brand: { fontSize: '1.8rem', fontWeight: '800', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
    userInfo: { fontSize: '0.9rem', color: palette.textLight },
    btn: { padding: '10px 18px', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '0.9rem' },
    container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
    tabs: { display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: `2px solid ${palette.cardBorder}`, paddingBottom: '0' },
    tab: { padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: '3px solid transparent', color: palette.textLight, cursor: 'pointer', fontWeight: '600', fontSize: '1rem', transition: 'all 0.2s ease' },
    tabActive: { color: palette.primary, borderBottomColor: palette.primary },
    formCard: { background: palette.cardBg, border: `1px solid ${palette.cardBorder}`, borderRadius: '16px', padding: '32px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)' },
    formTitle: { fontSize: '1.8rem', fontWeight: '700', marginBottom: '24px', color: palette.text },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    formGroupFull: { gridColumn: '1 / -1' },
    label: { fontWeight: '600', fontSize: '0.9rem', color: palette.text },
    input: { padding: '12px 16px', background: palette.inputBg, border: `2px solid ${palette.inputBorder}`, borderRadius: '10px', color: palette.text, fontSize: '1rem', transition: 'all 0.2s ease' },
    select: { padding: '12px 16px', background: palette.inputBg, border: `2px solid ${palette.inputBorder}`, borderRadius: '10px', color: palette.text, fontSize: '1rem', cursor: 'pointer' },
    fileInput: { padding: '12px', background: palette.inputBg, border: `2px dashed ${palette.inputBorder}`, borderRadius: '10px', color: palette.textLight, fontSize: '0.9rem', cursor: 'pointer' },
    submitBtn: { gridColumn: '1 / -1', padding: '14px 32px', background: palette.primary, color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s ease', marginTop: '12px' },
    message: { padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontWeight: '600' },
    messageSuccess: { background: 'rgba(16, 185, 129, 0.1)', border: `2px solid ${palette.success}`, color: palette.success },
    messageError: { background: 'rgba(239, 68, 68, 0.1)', border: `2px solid ${palette.error}`, color: palette.error },
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>📚 Libris Admin</div>
        <div style={styles.headerActions}>
          <span style={styles.userInfo}>👤 {user?.username} <strong>(Admin)</strong></span>
          <button style={{ ...styles.btn, background: palette.accent, color: '#fff' }} onClick={() => navigate('/')}>🏠 Inicio</button>
          <button style={{ ...styles.btn, background: palette.error, color: '#fff' }} onClick={() => { logout(); navigate('/login'); }}>🚪 Cerrar sesión</button>
        </div>
      </header>

      <div style={styles.container}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '12px' }}>Panel de Administración</h1>
        <p style={{ color: palette.textLight, marginBottom: '32px', fontSize: '1.1rem' }}>Gestiona los materiales de la biblioteca</p>

        <div style={styles.tabs}>
          {['libros', 'mangas', 'novelas'].map(tab => (
            <button key={tab} style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }} onClick={() => { setActiveTab(tab); setMessage({ type: '', text: '' }); }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {message.text && <div style={{ ...styles.message, ...(message.type === 'success' ? styles.messageSuccess : styles.messageError) }}>{message.text}</div>}

        {/* Formulario: Libros */}
        {activeTab === 'libros' && (
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>➕ Agregar Nuevo Libro</h2>
            <form onSubmit={handleSubmitLibro}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Título *</label>
                  <input type="text" required value={libroForm.titulo} onChange={(e) => setLibroForm({ ...libroForm, titulo: e.target.value })} style={styles.input} placeholder="Ej: Cien Años de Soledad" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Autor *</label>
                  <input type="text" required value={libroForm.autor} onChange={(e) => setLibroForm({ ...libroForm, autor: e.target.value })} style={styles.input} placeholder="Ej: Gabriel García Márquez" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Editorial</label>
                  <input type="text" value={libroForm.editorial} onChange={(e) => setLibroForm({ ...libroForm, editorial: e.target.value })} style={styles.input} placeholder="Ej: Alfaguara" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Año de publicación</label>
                  <input type="number" value={libroForm.anio_publicacion} onChange={(e) => setLibroForm({ ...libroForm, anio_publicacion: e.target.value })} style={styles.input} placeholder="Ej: 1967" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Género</label>
                  <input type="text" value={libroForm.genero} onChange={(e) => setLibroForm({ ...libroForm, genero: e.target.value })} style={styles.input} placeholder="Ej: Ficción" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Número de páginas</label>
                  <input type="number" value={libroForm.numero_paginas} onChange={(e) => setLibroForm({ ...libroForm, numero_paginas: e.target.value })} style={styles.input} placeholder="Ej: 471" />
                </div>
                <div style={{ ...styles.formGroup, ...styles.formGroupFull }}>
                  <label style={styles.label}>ISBN</label>
                  <input type="text" value={libroForm.isbn} onChange={(e) => setLibroForm({ ...libroForm, isbn: e.target.value })} style={styles.input} placeholder="Ej: 978-3-16-148410-0" />
                </div>
                <div style={{ ...styles.formGroup, ...styles.formGroupFull }}>
                  <label style={styles.label}>Portada (imagen)</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'libro')} style={styles.fileInput} />
                  {libroForm.portada && <span style={{ color: palette.success, fontSize: '0.85rem', marginTop: '4px' }}>✓ {libroForm.portada.name}</span>}
                </div>
                <button type="submit" disabled={isSubmitting} style={{ ...styles.submitBtn, opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                  {isSubmitting ? '⏳ Creando...' : '✨ Crear Libro'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Formulario: Mangas */}
        {activeTab === 'mangas' && (
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>➕ Agregar Nuevo Manga</h2>
            <form onSubmit={handleSubmitManga}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Título *</label>
                  <input type="text" required value={mangaForm.titulo} onChange={(e) => setMangaForm({ ...mangaForm, titulo: e.target.value })} style={styles.input} placeholder="Ej: One Piece" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Autor *</label>
                  <input type="text" required value={mangaForm.autor} onChange={(e) => setMangaForm({ ...mangaForm, autor: e.target.value })} style={styles.input} placeholder="Ej: Eiichiro Oda" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Editorial</label>
                  <input type="text" value={mangaForm.editorial} onChange={(e) => setMangaForm({ ...mangaForm, editorial: e.target.value })} style={styles.input} placeholder="Ej: Shueisha" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Año de publicación</label>
                  <input type="number" value={mangaForm.anio_publicacion} onChange={(e) => setMangaForm({ ...mangaForm, anio_publicacion: e.target.value })} style={styles.input} placeholder="Ej: 1997" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Género</label>
                  <input type="text" value={mangaForm.genero} onChange={(e) => setMangaForm({ ...mangaForm, genero: e.target.value })} style={styles.input} placeholder="Ej: Shonen" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Tomo</label>
                  <input type="number" value={mangaForm.tomo} onChange={(e) => setMangaForm({ ...mangaForm, tomo: e.target.value })} style={styles.input} placeholder="Ej: 1" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Capítulos</label>
                  <input type="number" value={mangaForm.capitulos} onChange={(e) => setMangaForm({ ...mangaForm, capitulos: e.target.value })} style={styles.input} placeholder="Ej: 200" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Estado</label>
                  <select value={mangaForm.estado_publicacion} onChange={(e) => setMangaForm({ ...mangaForm, estado_publicacion: e.target.value })} style={styles.select}>
                    <option value="EN_CURSO">En curso</option>
                    <option value="FINALIZADO">Finalizado</option>
                    <option value="HIATUS">Hiatus</option>
                  </select>
                </div>
                <div style={{ ...styles.formGroup, ...styles.formGroupFull }}>
                  <label style={styles.label}>Portada (imagen)</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'manga')} style={styles.fileInput} />
                  {mangaForm.portada && <span style={{ color: palette.success, fontSize: '0.85rem', marginTop: '4px' }}>✓ {mangaForm.portada.name}</span>}
                </div>
                <button type="submit" disabled={isSubmitting} style={{ ...styles.submitBtn, opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                  {isSubmitting ? '⏳ Creando...' : '✨ Crear Manga'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Formulario: Novelas */}
        {activeTab === 'novelas' && (
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>➕ Agregar Nueva Novela</h2>
            <form onSubmit={handleSubmitNovela}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Título *</label>
                  <input type="text" required value={novelaForm.titulo} onChange={(e) => setNovelaForm({ ...novelaForm, titulo: e.target.value })} style={styles.input} placeholder="Ej: Re:Zero" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Autor *</label>
                  <input type="text" required value={novelaForm.autor} onChange={(e) => setNovelaForm({ ...novelaForm, autor: e.target.value })} style={styles.input} placeholder="Ej: Tappei Nagatsuki" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Editorial</label>
                  <input type="text" value={novelaForm.editorial} onChange={(e) => setNovelaForm({ ...novelaForm, editorial: e.target.value })} style={styles.input} placeholder="Ej: Media Factory" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Año de publicación</label>
                  <input type="number" value={novelaForm.anio_publicacion} onChange={(e) => setNovelaForm({ ...novelaForm, anio_publicacion: e.target.value })} style={styles.input} placeholder="Ej: 2014" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Género</label>
                  <input type="text" value={novelaForm.genero} onChange={(e) => setNovelaForm({ ...novelaForm, genero: e.target.value })} style={styles.input} placeholder="Ej: Fantasy" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Número de capítulos</label>
                  <input type="number" value={novelaForm.numero_capitulos} onChange={(e) => setNovelaForm({ ...novelaForm, numero_capitulos: e.target.value })} style={styles.input} placeholder="Ej: 12" />
                </div>
                <div style={{ ...styles.formGroup, ...styles.formGroupFull }}>
                  <label style={styles.label}>Tipo</label>
                  <select value={novelaForm.tipo} onChange={(e) => setNovelaForm({ ...novelaForm, tipo: e.target.value })} style={styles.select}>
                    <option value="LIGERA">Ligera</option>
                    <option value="WEB">Web</option>
                    <option value="VISUAL">Visual</option>
                  </select>
                </div>
                <div style={{ ...styles.formGroup, ...styles.formGroupFull }}>
                  <label style={styles.label}>Portada (imagen)</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'novela')} style={styles.fileInput} />
                  {novelaForm.portada && <span style={{ color: palette.success, fontSize: '0.85rem', marginTop: '4px' }}>✓ {novelaForm.portada.name}</span>}
                </div>
                <button type="submit" disabled={isSubmitting} style={{ ...styles.submitBtn, opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                  {isSubmitting ? '⏳ Creando...' : '✨ Crear Novela'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;