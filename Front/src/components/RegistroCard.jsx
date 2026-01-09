import React, { useState } from 'react';
import { updateRegistroLectura, deleteRegistroLectura } from '../api/materialService';

// Opciones de estado de lectura (coinciden con tu backend models.py)
const ESTADOS = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'LEIDO', label: 'Leído' },
    { value: 'FAVORITO', label: 'Favorito' },
    { value: 'ABANDONADO', label: 'Abandonado' },
];

const RegistroCard = ({ registro, onUpdate, onDelete, theme = 'dark' }) => {
  const [currentPage, setCurrentPage] = useState(registro.pagina_actual);
  const [currentStatus, setCurrentStatus] = useState(registro.estado);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  // Extraer información del material (priorizar material_info si existe)
  const materialInfo = registro.material_info || {};
  const titulo = materialInfo.titulo || registro.titulo_material || registro.titulo || 'Sin título';
  const tipo = materialInfo.tipo || registro.tipo_material || 'material';
  const imagen = materialInfo.imagen;
  const autor = materialInfo.autor;

  // Paleta de colores responsiva al tema
  const palette = theme === 'light'
    ? {
        pageBg: '#f8fafc',
        cardBg: 'rgba(255, 255, 255, 0.95)',
        text: '#0f172a',
        textLight: '#475569',
        border: 'rgba(148, 163, 184, 0.3)',
        inputBg: 'rgba(241, 245, 249, 0.8)',
      }
    : {
        pageBg: '#0b1224',
        cardBg: 'rgba(17, 24, 39, 0.95)',
        text: '#e2e8f0',
        textLight: '#cbd5e1',
        border: 'rgba(148, 163, 184, 0.2)',
        inputBg: 'rgba(15, 23, 42, 0.6)',
      };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4500);
  };

  const handleUpdate = async (field, value) => {
    setIsUpdating(true);
    const data = { [field]: value };
    console.log(`📝 Actualizando registro ${registro.id}:`, data);
    try {
      const response = await updateRegistroLectura(registro.id, data);
      console.log('✅ Respuesta del servidor:', response);
      showNotification('✅ Registro actualizado correctamente', 'success');
      onUpdate(); // Refrescar la lista en ProfilePage
    } catch (error) {
      console.error('Error al actualizar registro:', error);
      console.error('Error response status:', error.response?.status);
      console.error('Error response data:', error.response?.data);
      const errorMsg = error.response?.data?.message || error.response?.data?.detail || error.response?.data?.error || JSON.stringify(error.response?.data) || 'Error al actualizar el registro';
      showNotification(`❌ ${errorMsg}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${titulo}" de tu historial?`)) {
        setIsUpdating(true);
        try {
            await deleteRegistroLectura(registro.id);
            showNotification('✅ Registro eliminado correctamente', 'success');
            setTimeout(() => onDelete(), 500); // Refrescar la lista en ProfilePage
        } catch (error) {
            console.error('Error al eliminar registro:', error);
            showNotification('❌ Error al eliminar el registro', 'error');
            setIsUpdating(false);
        }
    }
  };

  return (
    <div className="registro-card" style={getStyles(theme).card(palette)}>
      {/* Notificación */}
      {notification.message && (
        <div style={{
          ...getStyles(theme).notification,
          background: notification.type === 'error' 
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          animation: 'slideInDown 0.4s ease-out, slideOutUp 0.4s ease-in 4s forwards',
        }}>
          ...styles.notification,
          background: notification.type === 'error' 
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          animation: 'slideInDown 0.4s ease-out, slideOutUp 0.4s ease-in 4s forwards',
        }}>
          <style>{`
            @keyframes slideInDown {
              from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
              }
            }
            @keyframes slideOutUp {
              from {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
              }
              to {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
              }
            }
          `}</style>
          {notification.message}
        </div>
      )}
      
      {/* Imagen del material */}
      {imagen && (
        <div style={getStyles(theme).imageContainer}>
          <img 
            src={imagen} 
            alt={titulo}
            style={getStyles(theme).image}
          />
          <div style={getStyles(theme).typeBadge}>
            {tipo === 'libro' ? '📚' : tipo === 'manga' ? '📖' : '📘'} {tipo.toUpperCase()}
          </div>
        </div>
      )}
      
      {/* Contenido */}
      <div style={getStyles(theme).content(palette)}>
        <div style={getStyles(theme).header}>
          <div>
            <h4 style={getStyles(theme).title(palette)}>
              {titulo}
            </h4>
            {autor && <p style={getStyles(theme).author(palette)}>✍️ {autor}</p>}
          </div>
        </div>
        
        <div style={getStyles(theme).controls}>
          {/* Estado de lectura */}
          <div style={getStyles(theme).controlGroup}>
            <label htmlFor={`status-${registro.id}`} style={getStyles(theme).label(palette)}>
              📊 Estado
            </label>
            <select
              id={`status-${registro.id}`}
              value={currentStatus}
              onChange={(e) => {
                const newValue = e.target.value;
                setCurrentStatus(newValue);
                handleUpdate('estado', newValue);
              }}
              disabled={isUpdating}
              style={getStyles(theme).select(palette)}
            >
              {ESTADOS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Página actual */}
          <div style={getStyles(theme).controlGroup}>
            <label htmlFor={`page-${registro.id}`} style={getStyles(theme).label(palette)}>
              📄 Página
            </label>
            <input
              id={`page-${registro.id}`}
              type="number"
              min="1"
              value={currentPage}
              onChange={(e) => setCurrentPage(e.target.value)}
              onBlur={() => {
                if (currentPage !== registro.pagina_actual) {
                  handleUpdate('pagina_actual', parseInt(currentPage, 10));
                }
              }}
              onKeyDown={(e) => { 
                if (e.key === 'Enter' && currentPage !== registro.pagina_actual) {
                  handleUpdate('pagina_actual', parseInt(currentPage, 10));
                }
              }}
              disabled={isUpdating}
              style={getStyles(theme).pageInput(palette)}
            />
          </div>
        </div>

        {/* Botón eliminar */}
        <div style={getStyles(theme).actions}>
          <button 
            onClick={handleDelete} 
            disabled={isUpdating}
            style={getStyles(theme).deleteButton}
            onMouseEnter={(e) => e.target.style.background = '#dc2626'}
            onMouseLeave={(e) => e.target.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}
            aria-label={`Eliminar registro de ${titulo}`}
          >
            🗑️ Eliminar
          </button>
        </div>
        
        {isUpdating && (
          <p style={getStyles(theme).loadingMsg} aria-live="polite">
            ⏳ Actualizando...
          </p>
        )}
      </div>
    </div>
  );
};

// 💅 Estilos para la tarjeta - Responsivos al tema
const getStyles = (theme) => ({
    card: (palette) => ({
        background: theme === 'light'
            ? 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${palette.border}`,
        borderRadius: '16px',
        padding: '0',
        margin: '16px 0',
        display: 'flex',
        gap: '0',
        overflow: 'hidden',
        boxShadow: theme === 'light' 
            ? '0 12px 30px -10px rgba(0,0,0,0.1)'
            : '0 12px 30px -10px rgba(0,0,0,0.4)',
        transition: 'all 0.3s ease',
        position: 'relative',
    }),
    notification: {
        position: 'absolute',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '14px 28px',
        borderRadius: '12px',
        color: '#fff',
        fontWeight: '600',
        fontSize: '15px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
        zIndex: 1000,
        whiteSpace: 'nowrap',
    },
    imageContainer: {
        position: 'relative',
        minWidth: '140px',
        maxWidth: '140px',
        height: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
        minHeight: '220px',
        objectFit: 'cover',
    },
    typeBadge: {
        position: 'absolute',
        top: '12px',
        right: '12px',
        background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        color: '#fff',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '700',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    content: (palette) => ({
        flex: 1,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        color: palette.text,
    }),
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: (palette) => ({
        fontSize: '20px',
        fontWeight: '700',
        color: palette.text,
        margin: '0 0 8px 0',
        lineHeight: '1.3',
    }),
    author: (palette) => ({
        fontSize: '14px',
        color: palette.textLight,
        margin: '0',
        fontWeight: '500',
    }),
    controls: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
    },
    controlGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: (palette) => ({
        fontSize: '13px',
        fontWeight: '600',
        color: palette.text,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    }),
    select: (palette) => ({
        padding: '10px 14px',
        borderRadius: '10px',
        border: `1px solid ${palette.border}`,
        background: palette.inputBg,
        color: palette.text,
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        outline: 'none',
    }),
    pageInput: (palette) => ({
        padding: '10px 14px',
        borderRadius: '10px',
        border: `1px solid ${palette.border}`,
        background: palette.inputBg,
        color: palette.text,
        fontSize: '16px',
        fontWeight: '600',
        textAlign: 'center',
        outline: 'none',
        transition: 'all 0.2s ease',
    }),
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: 'auto',
    },
    deleteButton: {
        padding: '10px 20px',
        borderRadius: '10px',
        border: 'none',
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: '#fff',
        fontWeight: '600',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
    },
    loadingMsg: {
        fontSize: '13px',
        color: '#06b6d4',
        fontWeight: '600',
        margin: '0',
        textAlign: 'center',
    }
});

const styles = getStyles('dark');

export default RegistroCard;