import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import AdminTable from '../components/AdminTable';
import { getUsuarios, deleteUsuario, updateUsuario, getComentarios, deleteComentario, getAllLibros, deleteLibro, getAllMangas, deleteManga, getAllNovelas, deleteNovela } from '../api/adminService';

const AdminDashboard = () => {
  const [section, setSection] = useState('crear'); // 'crear', 'usuarios', 'comentarios', 'materiales'
  const [activeTab, setActiveTab] = useState('libros'); // Para crear: 'libros', 'mangas', 'novelas'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Datos de tablas
  const [usuarios, setUsuarios] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [libros, setLibros] = useState([]);
  const [mangas, setMangas] = useState([]);
  const [novelas, setNovelas] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState(null);

  // Modal de edición de usuarios
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ username: '', rol: '' });

  // Estados para formularios de creación
  const [libroForm, setLibroForm] = useState({
    titulo: '', autor: '', editorial: '', anio_publicacion: '', generos: [], numero_paginas: '', isbn: '', portada: null, descripcion: '', contenido_pdf: null
  });
  const [mangaForm, setMangaForm] = useState({
    titulo: '', autor: '', editorial: '', anio_publicacion: '', generos: [], tomo: '', capitulos: '', estado_publicacion: 'EN_CURSO', portada: null, descripcion: '', contenido_pdf: null
  });
  const [novelaForm, setNovelaForm] = useState({
    titulo: '', autor: '', editorial: '', anio_publicacion: '', generos: [], numero_capitulos: '', tipo: 'LIGERA', portada: null, descripcion: '', contenido_pdf: null
  });

  // Opciones de géneros por tipo
  const [generosLibros, setGenerosLibros] = useState([]);
  const [generosMangas, setGenerosMangas] = useState([]);
  const [generosNovelas, setGenerosNovelas] = useState([]);

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
    warning: '#f59e0b',
  };

  const styles = {
    page: { minHeight: '100vh', background: palette.pageBg, color: palette.text, padding: '0' },
    header: { background: palette.cardBg, borderBottom: `1px solid ${palette.cardBorder}`, padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    brand: { fontSize: '1.8rem', fontWeight: '800', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
    userInfo: { fontSize: '0.9rem', color: palette.textLight },
    btn: { padding: '10px 18px', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '0.9rem' },
    container: { maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' },
    mainTabs: { display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: `2px solid ${palette.cardBorder}`, paddingBottom: '0', flexWrap: 'wrap' },
    mainTab: { padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: '3px solid transparent', color: palette.textLight, cursor: 'pointer', fontWeight: '600', fontSize: '1rem', transition: 'all 0.2s ease' },
    mainTabActive: { color: palette.primary, borderBottomColor: palette.primary },
    subTabs: { display: 'flex', gap: '8px', marginBottom: '20px', paddingBottom: '8px', borderBottom: `1px solid ${palette.cardBorder}` },
    subTab: { padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: '2px solid transparent', color: palette.textLight, cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.2s ease' },
    subTabActive: { color: palette.primary, borderBottomColor: palette.primary },
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
    message: { 
      padding: '16px 24px', 
      borderRadius: '12px', 
      marginBottom: '20px', 
      fontWeight: '600',
      fontSize: '1rem',
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      animation: 'slideInDown 0.3s ease-out'
    },
    messageSuccess: { background: palette.success, color: '#fff' },
    messageError: { background: palette.error, color: '#fff' },
    messageInfo: { background: palette.info || '#3b82f6', color: '#fff' },
  };

  // Cargar datos de CRUD
  const loadDataForSection = async () => {
    setIsLoadingData(true);
    setDataError(null);
    try {
      if (section === 'usuarios') {
        const data = await getUsuarios();
        setUsuarios(Array.isArray(data) ? data : data.results || []);
      } else if (section === 'comentarios') {
        const data = await getComentarios();
        setComentarios(Array.isArray(data) ? data : data.results || []);
      } else if (section === 'materiales') {
        const [librosData, mangasData, novelasData] = await Promise.all([
          getAllLibros(),
          getAllMangas(),
          getAllNovelas(),
        ]);
        setLibros(Array.isArray(librosData) ? librosData : librosData.results || []);
        setMangas(Array.isArray(mangasData) ? mangasData : mangasData.results || []);
        setNovelas(Array.isArray(novelasData) ? novelasData : novelasData.results || []);
      }
    } catch (err) {
      setDataError(err.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadDataForSection();
  }, [section]);

  // Cargar opciones de géneros cuando estamos en crear
  useEffect(() => {
    const loadGeneros = async () => {
      if (section !== 'crear') return;
      try {
        const [gl, gm, gn] = await Promise.all([
          apiClient.get('/api/generos/?tipo=LIBRO'),
          apiClient.get('/api/generos/?tipo=MANGA'),
          apiClient.get('/api/generos/?tipo=NOVELA'),
        ]);
        setGenerosLibros(gl.data || []);
        setGenerosMangas(gm.data || []);
        setGenerosNovelas(gn.data || []);
      } catch (e) {
        console.warn('No se pudieron cargar géneros', e);
      }
    };
    loadGeneros();
  }, [section]);

  const handleFileChange = (e, formType, field = 'portada') => {
    const file = e.target.files[0];
    if (file) {
      if (formType === 'libro') setLibroForm({ ...libroForm, [field]: file });
      if (formType === 'manga') setMangaForm({ ...mangaForm, [field]: file });
      if (formType === 'novela') setNovelaForm({ ...novelaForm, [field]: file });
    }
  };

  // Manejadores para crear materiales
  const createFormData = (form, type) => {
    const required = ['titulo', 'autor', 'editorial', 'anio_publicacion'];
    for (const field of required) {
      if (!form[field] || String(form[field]).trim() === '') {
        throw new Error(`El campo "${field}" es obligatorio`);
      }
    }

    const normalized = {
      ...form,
      anio_publicacion: parseInt(form.anio_publicacion, 10),
      ...(form.numero_paginas && { numero_paginas: parseInt(form.numero_paginas, 10) }),
      ...(form.numero_capitulos && { numero_capitulos: parseInt(form.numero_capitulos, 10) }),
      ...(form.tomo && { tomo: parseInt(form.tomo, 10) }),
      ...(form.capitulos && { capitulos: parseInt(form.capitulos, 10) }),
      ...(form.volumen && { volumen: parseInt(form.volumen, 10) }),
    };

    const formData = new FormData();
    Object.keys(normalized).forEach(key => {
      const val = normalized[key];
      if (val === null || typeof val === 'undefined') return;
      if (key === 'generos' && Array.isArray(val)) {
        val.forEach(g => formData.append('generos', g));
      } else if (val !== '') {
        formData.append(key, val);
      }
    });
    return formData;
  };

  const handleSubmitLibro = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = createFormData(libroForm, 'libro');
      await apiClient.post('/api/libros/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage({ type: 'success', text: '✅ Libro creado exitosamente' });
      setLibroForm({ titulo: '', autor: '', editorial: '', anio_publicacion: '', generos: [], numero_paginas: '', isbn: '', portada: null, descripcion: '', contenido_pdf: null });
      const fileInputs = document.querySelectorAll('#libro-form input[type="file"]');
      fileInputs.forEach(input => { input.value = ''; });
    } catch (error) {
      const text = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      setMessage({ type: 'error', text: `❌ Error: ${text}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitManga = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = createFormData(mangaForm, 'manga');
      await apiClient.post('/api/mangas/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage({ type: 'success', text: '✅ Manga creado exitosamente' });
      setMangaForm({ titulo: '', autor: '', editorial: '', anio_publicacion: '', generos: [], tomo: '', capitulos: '', estado_publicacion: 'EN_CURSO', portada: null, descripcion: '', contenido_pdf: null });
      const fileInputs = document.querySelectorAll('#manga-form input[type="file"]');
      fileInputs.forEach(input => { input.value = ''; });
    } catch (error) {
      const text = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      setMessage({ type: 'error', text: `❌ Error: ${text}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitNovela = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = createFormData(novelaForm, 'novela');
      await apiClient.post('/api/novelas/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage({ type: 'success', text: '✅ Novela creada exitosamente' });
      setNovelaForm({ titulo: '', autor: '', editorial: '', anio_publicacion: '', generos: [], numero_capitulos: '', tipo: 'LIGERA', portada: null, descripcion: '', contenido_pdf: null });
      const fileInputs = document.querySelectorAll('#novela-form input[type="file"]');
      fileInputs.forEach(input => { input.value = ''; });
    } catch (error) {
      const text = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      setMessage({ type: 'error', text: `❌ Error: ${text}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejadores de CRUD
  const handleDeleteLibro = async (libroId) => {
    try {
      await deleteLibro(libroId);
      setLibros(libros.filter(l => l.id !== libroId));
      setMessage({ type: 'success', text: '✅ Libro eliminado' });
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Error: ${error.message}` });
    }
  };

  const handleDeleteManga = async (mangaId) => {
    try {
      await deleteManga(mangaId);
      setMangas(mangas.filter(m => m.id !== mangaId));
      setMessage({ type: 'success', text: '✅ Manga eliminado' });
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Error: ${error.message}` });
    }
  };

  const handleDeleteNovela = async (novelaId) => {
    try {
      await deleteNovela(novelaId);
      setNovelas(novelas.filter(n => n.id !== novelaId));
      setMessage({ type: 'success', text: '✅ Novela eliminada' });
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Error: ${error.message}` });
    }
  };

  const handleDeleteComentario = async (comentarioId) => {
    // Mostrar mensaje de "eliminando..." inmediatamente
    setMessage({ type: 'info', text: '⏳ Eliminando comentario...' });
    
    try {
      await deleteComentario(comentarioId);
      setComentarios(comentarios.filter(c => c.id !== comentarioId));
      setMessage({ type: 'success', text: '✅ Comentario eliminado correctamente' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Error: ${error.response?.data?.error || error.message}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleDeleteUsuario = async (usuarioId) => {
    // Mostrar mensaje de "eliminando..." inmediatamente
    setMessage({ type: 'info', text: '⏳ Eliminando usuario...' });
    
    try {
      await deleteUsuario(usuarioId);
      setUsuarios(usuarios.filter(u => u.id !== usuarioId));
      setMessage({ type: 'success', text: '✅ Usuario eliminado correctamente' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Error: ${error.response?.data?.error || error.message}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleEditUsuarioClick = (usuario) => {
    setEditingUser(usuario);
    setEditUserForm({ username: usuario.username, rol: usuario.rol });
  };

  const handleEditUsuarioSave = async () => {
    if (!editUserForm.username.trim() || !editUserForm.rol) {
      setMessage({ type: 'error', text: '❌ Todos los campos son obligatorios' });
      return;
    }
    try {
      await updateUsuario(editingUser.id, editUserForm);
      const updatedUsuarios = usuarios.map(u => 
        u.id === editingUser.id ? { ...u, ...editUserForm } : u
      );
      setUsuarios(updatedUsuarios);
      setEditingUser(null);
      setMessage({ type: 'success', text: '✅ Usuario actualizado' });
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Error: ${error.message}` });
    }
  };

  const handleEditUsuarioCancel = () => {
    setEditingUser(null);
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>📚 Libris Admin</div>
        <div style={styles.headerActions}>
          <span style={styles.userInfo}>👤 {user?.username}</span>
          <button style={{ ...styles.btn, background: palette.accent, color: '#fff' }} onClick={() => navigate('/')}>🏠 Inicio</button>
          <button style={{ ...styles.btn, background: palette.error, color: '#fff' }} onClick={() => { logout(); navigate('/login'); }}>🚪 Cerrar sesión</button>
        </div>
      </header>

      <div style={styles.container}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '12px' }}>Panel de Administración</h1>
        <p style={{ color: palette.textLight, marginBottom: '32px', fontSize: '1.1rem' }}>Gestiona usuarios, materiales y comentarios</p>

        {/* Tabs principales */}
        <div style={styles.mainTabs}>
          {['crear', 'usuarios', 'comentarios', 'materiales'].map(s => (
            <button 
              key={s} 
              style={{ ...styles.mainTab, ...(section === s ? styles.mainTabActive : {}) }} 
              onClick={() => { setSection(s); setMessage({ type: '', text: '' }); }}
            >
              {s === 'crear' && '➕ Crear Materiales'}
              {s === 'usuarios' && '👥 Usuarios'}
              {s === 'comentarios' && '💬 Comentarios'}
              {s === 'materiales' && '📚 Materiales'}
            </button>
          ))}
        </div>

        {message.text && (
          <div style={{ 
            ...styles.message, 
            ...(message.type === 'success' ? styles.messageSuccess : 
                message.type === 'error' ? styles.messageError : 
                styles.messageInfo) 
          }}>
            {message.text}
          </div>
        )}

        {/* SECCIÓN: CREAR */}
        {section === 'crear' && (
          <>
            <div style={styles.subTabs}>
              {['libros', 'mangas', 'novelas'].map(tab => (
                <button key={tab} style={{ ...styles.subTab, ...(activeTab === tab ? styles.subTabActive : {}) }} onClick={() => setActiveTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Formulario Libros */}
            {activeTab === 'libros' && (
              <div style={styles.formCard}>
                <h2 style={styles.formTitle}>➕ Agregar Nuevo Libro</h2>
                <form id="libro-form" onSubmit={handleSubmitLibro}>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}><label style={styles.label}>Título *</label><input type="text" required value={libroForm.titulo} onChange={(e) => setLibroForm({ ...libroForm, titulo: e.target.value })} style={styles.input} placeholder="Título" /></div>
                    <div style={styles.formGroup}><label style={styles.label}>Autor *</label><input type="text" required value={libroForm.autor} onChange={(e) => setLibroForm({ ...libroForm, autor: e.target.value })} style={styles.input} placeholder="Autor" /></div>
                    <div style={styles.formGroup}><label style={styles.label}>Editorial</label><input type="text" value={libroForm.editorial} onChange={(e) => setLibroForm({ ...libroForm, editorial: e.target.value })} style={styles.input} placeholder="Editorial" /></div>
                    <div style={styles.formGroup}><label style={styles.label}>Año *</label><input type="number" required value={libroForm.anio_publicacion} onChange={(e) => setLibroForm({ ...libroForm, anio_publicacion: e.target.value })} style={styles.input} placeholder="Año" /></div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Géneros *</label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <select 
                          id="libro-genero-select"
                          style={{ ...styles.select, flex: 1 }}
                          defaultValue=""
                        >
                          <option value="" disabled>Seleccionar género...</option>
                          {generosLibros.filter(g => !libroForm.generos.includes(g.nombre)).map(g => (
                            <option key={g.id} value={g.nombre}>{g.nombre}</option>
                          ))}
                        </select>
                        <button 
                          type="button"
                          onClick={() => {
                            const select = document.getElementById('libro-genero-select');
                            if (!select) return;
                            const valor = select.value;
                            if (valor && !libroForm.generos.includes(valor)) {
                              setLibroForm({ ...libroForm, generos: [...libroForm.generos, valor] });
                              select.value = '';
                            }
                          }}
                          style={{ ...styles.btn, background: palette.success, color: '#fff', padding: '8px 16px' }}
                        >
                          ➕ Agregar
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {libroForm.generos.map((gen, idx) => (
                          <span 
                            key={idx}
                            style={{ 
                              background: palette.primary, 
                              color: '#fff', 
                              padding: '6px 12px', 
                              borderRadius: '20px', 
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            {gen}
                            <button
                              type="button"
                              onClick={() => setLibroForm({ ...libroForm, generos: libroForm.generos.filter((_, i) => i !== idx) })}
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: '#fff', 
                                cursor: 'pointer',
                                fontSize: '1rem',
                                padding: 0,
                                fontWeight: 'bold'
                              }}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={styles.formGroup}><label style={styles.label}>Páginas</label><input type="number" value={libroForm.numero_paginas} onChange={(e) => setLibroForm({ ...libroForm, numero_paginas: e.target.value })} style={styles.input} placeholder="Páginas" /></div>
                    <div style={{ ...styles.formGroup, ...styles.formGroupFull }}><label style={styles.label}>ISBN</label><input type="text" value={libroForm.isbn} onChange={(e) => setLibroForm({ ...libroForm, isbn: e.target.value })} style={styles.input} placeholder="ISBN" /></div>
                    <div style={{ ...styles.formGroup, ...styles.formGroupFull }}>
                      <label style={styles.label}>Descripción</label>
                      <textarea
                        value={libroForm.descripcion}
                        onChange={(e) => setLibroForm({ ...libroForm, descripcion: e.target.value })}
                        style={{ ...styles.input, minHeight: '120px', resize: 'vertical' }}
                        placeholder="Resumen o sinopsis"
                      ></textarea>
                    </div>
                    <div style={{ ...styles.formGroup, ...styles.formGroupFull }}><label style={styles.label}>Portada</label><input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'libro', 'portada')} style={styles.fileInput} /></div>
                    <div style={{ ...styles.formGroup, ...styles.formGroupFull }}><label style={styles.label}>Archivo PDF</label><input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, 'libro', 'contenido_pdf')} style={styles.fileInput} /></div>
                    <button type="submit" disabled={isSubmitting} style={{ ...styles.submitBtn, opacity: isSubmitting ? 0.6 : 1 }}>{isSubmitting ? '⏳ Creando...' : '✨ Crear'}</button>
                  </div>
                </form>
              </div>
            )}

            {/* Formulario Mangas */}
            {activeTab === 'mangas' && (
              <div style={styles.formCard}>
                <h2 style={styles.formTitle}>➕ Agregar Nuevo Manga</h2>
                <form id="manga-form" onSubmit={handleSubmitManga}>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}><label style={styles.label}>Título *</label><input type="text" required value={mangaForm.titulo} onChange={(e) => setMangaForm({ ...mangaForm, titulo: e.target.value })} style={styles.input} placeholder="Título" /></div>
                    <div style={styles.formGroup}><label style={styles.label}>Autor *</label><input type="text" required value={mangaForm.autor} onChange={(e) => setMangaForm({ ...mangaForm, autor: e.target.value })} style={styles.input} placeholder="Autor" /></div>
                    <div style={styles.formGroup}><label style={styles.label}>Editorial</label><input type="text" value={mangaForm.editorial} onChange={(e) => setMangaForm({ ...mangaForm, editorial: e.target.value })} style={styles.input} placeholder="Editorial" /></div>
                    <div style={styles.formGroup}><label style={styles.label}>Año *</label><input type="number" required value={mangaForm.anio_publicacion} onChange={(e) => setMangaForm({ ...mangaForm, anio_publicacion: e.target.value })} style={styles.input} placeholder="Año" /></div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Géneros *</label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <select 
                          id="manga-genero-select"
                          style={{ ...styles.select, flex: 1 }}
                          defaultValue=""
                        >
                          <option value="" disabled>Seleccionar género...</option>
                          {generosMangas.filter(g => !mangaForm.generos.includes(g.nombre)).map(g => (
                            <option key={g.id} value={g.nombre}>{g.nombre}</option>
                          ))}
                        </select>
                        <button 
                          type="button"
                          onClick={() => {
                            const select = document.getElementById('manga-genero-select');
                            if (!select) return;
                            const valor = select.value;
                            if (valor && !mangaForm.generos.includes(valor)) {
                              setMangaForm({ ...mangaForm, generos: [...mangaForm.generos, valor] });
                              select.value = '';
                            }
                          }}
                          style={{ ...styles.btn, background: palette.success, color: '#fff', padding: '8px 16px' }}
                        >
                          ➕ Agregar
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {mangaForm.generos.map((gen, idx) => (
                          <span 
                            key={idx}
                            style={{ 
                              background: palette.accent, 
                              color: '#fff', 
                              padding: '6px 12px', 
                              borderRadius: '20px', 
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            {gen}
                            <button
                              type="button"
                              onClick={() => setMangaForm({ ...mangaForm, generos: mangaForm.generos.filter((_, i) => i !== idx) })}
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: '#fff', 
                                cursor: 'pointer',
                                fontSize: '1rem',
                                padding: 0,
                                fontWeight: 'bold'
                              }}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={styles.formGroup}><label style={styles.label}>Tomo</label><input type="number" value={mangaForm.tomo} onChange={(e) => setMangaForm({ ...mangaForm, tomo: e.target.value })} style={styles.input} placeholder="Tomo" /></div>
                    <div style={styles.formGroup}><label style={styles.label}>Capítulos</label><input type="number" value={mangaForm.capitulos} onChange={(e) => setMangaForm({ ...mangaForm, capitulos: e.target.value })} style={styles.input} placeholder="Capítulos" /></div>
                    <div style={styles.formGroup}><label style={styles.label}>Estado</label><select value={mangaForm.estado_publicacion} onChange={(e) => setMangaForm({ ...mangaForm, estado_publicacion: e.target.value })} style={styles.select}><option value="EN_CURSO">En curso</option><option value="FINALIZADO">Finalizado</option><option value="HIATUS">Hiatus</option></select></div>
                    <div style={{ ...styles.formGroup, ...styles.formGroupFull }}>
                      <label style={styles.label}>Descripción</label>
                      <textarea
                        value={mangaForm.descripcion}
                        onChange={(e) => setMangaForm({ ...mangaForm, descripcion: e.target.value })}
                        style={{ ...styles.input, minHeight: '120px', resize: 'vertical' }}
                        placeholder="Resumen o sinopsis"
                      ></textarea>
                    </div>
                    <div style={{ ...styles.formGroup, ...styles.formGroupFull }}><label style={styles.label}>Portada</label><input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'manga', 'portada')} style={styles.fileInput} /></div>
                    <div style={{ ...styles.formGroup, ...styles.formGroupFull }}><label style={styles.label}>Archivo PDF</label><input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, 'manga', 'contenido_pdf')} style={styles.fileInput} /></div>
                    <button type="submit" disabled={isSubmitting} style={{ ...styles.submitBtn, opacity: isSubmitting ? 0.6 : 1 }}>{isSubmitting ? '⏳ Creando...' : '✨ Crear'}</button>
                  </div>
                </form>
              </div>
            )}

            {/* Formulario Novelas */}
            {activeTab === 'novelas' && (
              <div style={styles.formCard}>
                <h2 style={styles.formTitle}>➕ Agregar Nueva Novela</h2>
                <form id="novela-form" onSubmit={handleSubmitNovela}>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}><label style={styles.label}>Título *</label><input type="text" required value={novelaForm.titulo} onChange={(e) => setNovelaForm({ ...novelaForm, titulo: e.target.value })} style={styles.input} placeholder="Título" /></div>
                    <div style={styles.formGroup}><label style={styles.label}>Autor *</label><input type="text" required value={novelaForm.autor} onChange={(e) => setNovelaForm({ ...novelaForm, autor: e.target.value })} style={styles.input} placeholder="Autor" /></div>
                    <div style={styles.formGroup}><label style={styles.label}>Editorial</label><input type="text" value={novelaForm.editorial} onChange={(e) => setNovelaForm({ ...novelaForm, editorial: e.target.value })} style={styles.input} placeholder="Editorial" /></div>
                    <div style={styles.formGroup}><label style={styles.label}>Año *</label><input type="number" required value={novelaForm.anio_publicacion} onChange={(e) => setNovelaForm({ ...novelaForm, anio_publicacion: e.target.value })} style={styles.input} placeholder="Año" /></div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Géneros *</label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <select 
                          id="novela-genero-select"
                          style={{ ...styles.select, flex: 1 }}
                          defaultValue=""
                        >
                          <option value="" disabled>Seleccionar género...</option>
                          {generosNovelas.filter(g => !novelaForm.generos.includes(g.nombre)).map(g => (
                            <option key={g.id} value={g.nombre}>{g.nombre}</option>
                          ))}
                        </select>
                        <button 
                          type="button"
                          onClick={() => {
                            const select = document.getElementById('novela-genero-select');
                            if (!select) return;
                            const valor = select.value;
                            if (valor && !novelaForm.generos.includes(valor)) {
                              setNovelaForm({ ...novelaForm, generos: [...novelaForm.generos, valor] });
                              select.value = '';
                            }
                          }}
                          style={{ ...styles.btn, background: palette.success, color: '#fff', padding: '8px 16px' }}
                        >
                          ➕ Agregar
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {novelaForm.generos.map((gen, idx) => (
                          <span 
                            key={idx}
                            style={{ 
                              background: palette.warning, 
                              color: '#fff', 
                              padding: '6px 12px', 
                              borderRadius: '20px', 
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            {gen}
                            <button
                              type="button"
                              onClick={() => setNovelaForm({ ...novelaForm, generos: novelaForm.generos.filter((_, i) => i !== idx) })}
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: '#fff', 
                                cursor: 'pointer',
                                fontSize: '1rem',
                                padding: 0,
                                fontWeight: 'bold'
                              }}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={styles.formGroup}><label style={styles.label}>Capítulos</label><input type="number" value={novelaForm.numero_capitulos} onChange={(e) => setNovelaForm({ ...novelaForm, numero_capitulos: e.target.value })} style={styles.input} placeholder="Capítulos" /></div>
                    <div style={styles.formGroup}><label style={styles.label}>Tipo</label><select value={novelaForm.tipo} onChange={(e) => setNovelaForm({ ...novelaForm, tipo: e.target.value })} style={styles.select}><option value="LIGERA">Ligera</option><option value="WEB">Web</option><option value="VISUAL">Visual</option></select></div>
                    <div style={{ ...styles.formGroup, ...styles.formGroupFull }}>
                      <label style={styles.label}>Descripción</label>
                      <textarea
                        value={novelaForm.descripcion}
                        onChange={(e) => setNovelaForm({ ...novelaForm, descripcion: e.target.value })}
                        style={{ ...styles.input, minHeight: '120px', resize: 'vertical' }}
                        placeholder="Resumen o sinopsis"
                      ></textarea>
                    </div>
                    <div style={{ ...styles.formGroup, ...styles.formGroupFull }}><label style={styles.label}>Portada</label><input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'novela', 'portada')} style={styles.fileInput} /></div>
                    <div style={{ ...styles.formGroup, ...styles.formGroupFull }}><label style={styles.label}>Archivo PDF</label><input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, 'novela', 'contenido_pdf')} style={styles.fileInput} /></div>
                    <button type="submit" disabled={isSubmitting} style={{ ...styles.submitBtn, opacity: isSubmitting ? 0.6 : 1 }}>{isSubmitting ? '⏳ Creando...' : '✨ Crear'}</button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {/* SECCIÓN: USUARIOS */}
        {section === 'usuarios' && (
          <>
            {editingUser === null ? (
              <AdminTable
                title="👥 Gestión de Usuarios"
                columns={[
                  { key: 'id', label: 'ID' },
                  { key: 'username', label: 'Usuario' },
                  { key: 'email', label: 'Email' },
                  { key: 'rol', label: 'Rol' },
                ]}
                data={usuarios}
                onDelete={handleDeleteUsuario}
                onEdit={handleEditUsuarioClick}
                isLoading={isLoadingData}
                error={dataError}
                palette={palette}
              />
            ) : (
              <div style={styles.formCard}>
                <h2 style={styles.formTitle}>✏️ Editar Usuario: {editingUser.username}</h2>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Nombre de Usuario</label>
                    <input 
                      type="text" 
                      value={editUserForm.username} 
                      onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })} 
                      style={styles.input} 
                      placeholder="Nombre de usuario" 
                    />
                  </div>
                  <div style={{ ...styles.formGroup, ...styles.formGroupFull }}>
                    <label style={styles.label}>Rol</label>
                    <select 
                      value={editUserForm.rol} 
                      onChange={(e) => setEditUserForm({ ...editUserForm, rol: e.target.value })} 
                      style={styles.select}
                    >
                      <option value="">Seleccionar rol...</option>
                      <option value="USER">Usuario</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div style={{ ...styles.formGroup, ...styles.formGroupFull, display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={handleEditUsuarioSave} 
                      style={{ ...styles.submitBtn, flex: 1, marginTop: 0, background: palette.success }}
                    >
                      ✅ Guardar
                    </button>
                    <button 
                      onClick={handleEditUsuarioCancel} 
                      style={{ ...styles.submitBtn, flex: 1, marginTop: 0, background: palette.error }}
                    >
                      ❌ Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* SECCIÓN: COMENTARIOS */}
        {section === 'comentarios' && (
          <AdminTable
            title="💬 Gestión de Comentarios"
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'nombre_usuario', label: 'Usuario' },
              { key: 'titulo_material', label: 'Obra' },
              { key: 'tipo_material', label: 'Tipo', render: (val) => {
                const tipos = { libro: '📖 Libro', manga: '📰 Manga', novela: '📕 Novela' };
                return tipos[val] || val;
              }},
              { key: 'descripcion', label: 'Comentario', render: (val) => val.substring(0, 50) + (val.length > 50 ? '...' : '') },
              { key: 'fecha', label: 'Fecha', render: (val) => new Date(val).toLocaleDateString() },
            ]}
            data={comentarios}
            onDelete={handleDeleteComentario}
            isLoading={isLoadingData}
            error={dataError}
            palette={palette}
          />
        )}

        {/* SECCIÓN: MATERIALES */}
        {section === 'materiales' && (
          <>
            <AdminTable
              title="📖 Gestión de Libros"
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'titulo', label: 'Título' },
                { key: 'autor', label: 'Autor' },
                { key: 'anio_publicacion', label: 'Año' },
                { key: 'generos', label: 'Géneros', render: (val) => Array.isArray(val) ? val.join(', ') : '' },
              ]}
              data={libros}
              onDelete={handleDeleteLibro}
              isLoading={isLoadingData}
              error={dataError}
              palette={palette}
            />
            <AdminTable
              title="📰 Gestión de Mangas"
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'titulo', label: 'Título' },
                { key: 'autor', label: 'Autor' },
                { key: 'tomo', label: 'Tomo' },
                { key: 'estado_publicacion', label: 'Estado' },
                { key: 'generos', label: 'Géneros', render: (val) => Array.isArray(val) ? val.join(', ') : '' },
              ]}
              data={mangas}
              onDelete={handleDeleteManga}
              isLoading={isLoadingData}
              error={dataError}
              palette={palette}
            />
            <AdminTable
              title="📕 Gestión de Novelas"
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'titulo', label: 'Título' },
                { key: 'autor', label: 'Autor' },
                { key: 'tipo', label: 'Tipo' },
                { key: 'volumen', label: 'Volumen' },
                { key: 'generos', label: 'Géneros', render: (val) => Array.isArray(val) ? val.join(', ') : '' },
              ]}
              data={novelas}
              onDelete={handleDeleteNovela}
              isLoading={isLoadingData}
              error={dataError}
              palette={palette}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
