import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMaterialById } from '../api/materialService';
import apiClient from '../api/apiClient';

const LeerPage = () => {
  const { tipo, id } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState('page-width'); // values: 'auto', 'page-width', 'page-fit', or numeric percent
  const [dark, setDark] = useState(true);
  const [isViewerLoading, setIsViewerLoading] = useState(true);

  useEffect(() => {
    const fetchMaterial = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getMaterialById(tipo, id);
        if (!data.contenido_pdf_url) {
          setError('Este material no tiene contenido disponible para leer');
        } else {
          setMaterial(data);
          // restaurar última página
          const key = `lectura:${tipo}:${id}:page`;
          const last = parseInt(localStorage.getItem(key) || '1', 10);
          if (!isNaN(last) && last > 0) setPage(last);
        }
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
    if (!material) return;
    const key = `lectura:${tipo}:${id}:page`;
    localStorage.setItem(key, String(page));
  }, [page, material, tipo, id]);

  // Timeout para el loading del PDF (si no carga en 10 segundos, ocultar spinner)
  useEffect(() => {
    if (!material?.contenido_pdf_url) return;
    
    const timer = setTimeout(() => {
      if (isViewerLoading) {
        console.warn('PDF no se cargó en 10 segundos');
        setIsViewerLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [material, isViewerLoading]);

  const getPdfUrl = () => {
    if (!material?.contenido_pdf_url) return null;
    const base = apiClient.defaults.baseURL || 'http://localhost:8000';
    const rawUrl = material.contenido_pdf_url.startsWith('http')
      ? material.contenido_pdf_url
      : `${base}${material.contenido_pdf_url}`;
    // cache-buster para evitar 304 vacíos
    const sep = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${sep}v=${Date.now()}#page=${page}`;
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b1224',
        color: '#e2e8f0',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 1s linear infinite' }}>⏳</div>
          <p>Cargando contenido...</p>
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
        background: '#0b1224',
        color: '#e2e8f0',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <p>{error || 'Material no encontrado'}</p>
          <button
            onClick={() => navigate(`/material/${tipo}/${id}`)}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #06b6d4 0%, #a855f7 100%)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Volver a detalles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0b1224',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: dark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(243, 244, 246, 0.95)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate(`/material/${tipo}/${id}`)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: 'transparent',
              color: dark ? '#e2e8f0' : '#111827',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← Volver
          </button>
          <div>
            <h1 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: dark ? '#e2e8f0' : '#111827',
              margin: 0,
            }}>
              {material.titulo}
            </h1>
            <p style={{
              fontSize: '14px',
              color: dark ? '#cbd5e1' : '#374151',
              margin: '4px 0 0 0',
            }}>
              {material.autor}
            </p>
          </div>
        </div>

        {/* Toolbar personalizada */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
          >
            ◀
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="number"
              value={page}
              onChange={(e) => setPage(Math.max(1, parseInt(e.target.value || '1', 10)))}
              style={{ width: '64px', padding: '8px', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.4)', background: dark ? '#0f172a' : '#fff', color: dark ? '#e2e8f0' : '#111827' }}
            />
          </div>
          <button
            onClick={() => setPage(p => p + 1)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
          >
            ▶
          </button>

          <div style={{ width: '1px', height: '24px', background: 'rgba(148, 163, 184, 0.4)', margin: '0 8px' }}></div>

          <button
            onClick={() => setZoom(z => (z === 'page-width' ? 'page-fit' : 'page-width'))}
            style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#a855f7', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
          >
            {zoom === 'page-width' ? 'Ajuste a página' : 'Ajuste al ancho'}
          </button>
          <button
            onClick={() => setZoom('auto')}
            style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
          >
            Auto
          </button>

          <div style={{ width: '1px', height: '24px', background: 'rgba(148, 163, 184, 0.4)', margin: '0 8px' }}></div>

          <button
            onClick={() => setDark(d => !d)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#111827', fontWeight: 700, cursor: 'pointer' }}
          >
            {dark ? 'Claro' : 'Oscuro'}
          </button>
        </div>
      </div>

      {/* Visor PDF nativo */}
      <div style={{ flex: 1, position: 'relative', background: dark ? '#111827' : '#f3f4f6' }}>
        {/* Overlay de carga */}
        {isViewerLoading && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: dark ? 'rgba(17,24,39,0.95)' : 'rgba(243,244,246,0.95)',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#3b82f6', animation: 'bounce 0.8s infinite', animationDelay: '0s' }}></span>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#a855f7', animation: 'bounce 0.8s infinite', animationDelay: '0.2s' }}></span>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981', animation: 'bounce 0.8s infinite', animationDelay: '0.4s' }}></span>
              </div>
              <span style={{ color: dark ? '#e5e7eb' : '#111827', fontWeight: 700 }}>Cargando PDF…</span>
            </div>
            <style>{`
              @keyframes bounce {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1); }
              }
            `}</style>
          </div>
        )}
        {getPdfUrl() ? (
          <object
            data={getPdfUrl()}
            type="application/pdf"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onLoad={() => setIsViewerLoading(false)}
          >
            <iframe
              src={getPdfUrl()}
              title={`Leer ${material.titulo}`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              onLoad={() => setIsViewerLoading(false)}
            />
          </object>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fca5a5', fontWeight: 600 }}>
            Este material no tiene contenido PDF disponible
          </div>
        )}
      </div>
    </div>
  );
};

export default LeerPage;
