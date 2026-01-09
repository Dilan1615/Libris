// src/components/AccessibleButton.jsx
import React from 'react';

const AccessibleButton = ({ children, onClick, disabled, label }) => {
  return (
    // El elemento button nativo ya maneja el enfoque con teclado, el clic con Enter/Space
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label} // Útil si el botón es solo un icono
      className="responsive-styles" // Aplica estilos responsivos y de contraste
    >
      {children}
    </button>
  );
};