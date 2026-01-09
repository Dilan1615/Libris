import React, { useState } from 'react';

const CommentModal = ({ material, onClose, onSubmit }) => {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (description.trim() === '') {
        alert('El comentario no puede estar vacío.');
        return;
    }
    setIsSubmitting(true);
    // Llama a la función que se pasa desde HomePage
    onSubmit(material, description)
      .finally(() => {
          setIsSubmitting(false);
          onClose();
      });
  };

  if (!material) return null;

  return (
    // ⚠️ Accesibilidad: Modal con role="dialog" y enfoque inicial
    <div className="modal-backdrop" style={styles.backdrop}>
      <div 
        className="modal-content" 
        style={styles.modal} 
        role="dialog" 
        aria-modal="true"
        aria-labelledby="comment-title"
      >
        <h3 id="comment-title" style={styles.title}>Comentar: {material.titulo} ({material.tipo})</h3>
        
        <form onSubmit={handleSubmit}>
          <label htmlFor="comment-text" style={styles.label}>Tu Comentario:</label>
          {/* ⚠️ Accesibilidad: textarea con label asociado */}
          <textarea
            id="comment-text"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            aria-required="true"
            style={styles.textarea}
            disabled={isSubmitting}
          />
          
          <div style={styles.actions}>
            <button 
                type="button" 
                onClick={onClose} 
                disabled={isSubmitting}
                style={styles.cancelButton}
            >
                Cancelar
            </button>
            <button 
                type="submit" 
                disabled={isSubmitting}
                style={styles.submitButton}
            >
              {isSubmitting ? 'Enviando...' : 'Publicar Comentario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 💅 Estilos para el Modal
const styles = {
    backdrop: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.7)', 
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1000
    },
    modal: {
        backgroundColor: '#1e293b',
        color: '#e5e7eb',
        padding: '30px',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        border: '1px solid #334155'
    },
    title: {
        marginBottom: '20px',
        fontSize: '1.4rem',
        color: '#e5e7eb',
        fontWeight: '700'
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontWeight: '600',
        color: '#e5e7eb'
    },
    textarea: {
        width: '100%',
        padding: '12px',
        marginBottom: '20px',
        border: '2px solid #334155',
        borderRadius: '8px',
        resize: 'vertical',
        background: '#0f172a',
        color: '#e5e7eb',
        fontSize: '1rem',
        fontFamily: 'inherit'
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px'
    },
    submitButton: {
        backgroundColor: '#3b82f6', 
        color: 'white', 
        padding: '10px 20px', 
        border: 'none', 
        borderRadius: '8px', 
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'all 0.2s ease'
    },
    cancelButton: {
        backgroundColor: '#475569', 
        color: 'white', 
        padding: '10px 20px', 
        border: 'none', 
        borderRadius: '8px', 
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'all 0.2s ease'
    }
};

export default CommentModal;