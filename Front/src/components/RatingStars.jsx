import React, { useState } from 'react';

// Componente para mostrar y calificar con estrellas
// Props:
//   - currentRating: número actual de estrellas (0-5, puede ser decimal para promedio)
//   - maxStars: número máximo de estrellas (por defecto 5)
//   - onRate: callback cuando el usuario hace click en una estrella (recibe el número)
//   - isInteractive: boolean para permitir clickear (por defecto true para usuarios logueados)
//   - size: 'small' | 'medium' | 'large' (por defecto 'medium')
//   - showText: mostrar número de estrellas como texto (por defecto false)

const RatingStars = ({ 
  currentRating = 0, 
  maxStars = 5, 
  onRate = () => {}, 
  isInteractive = true,
  size = 'medium',
  showText = false 
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeMap = {
    small: { star: '16px', gap: '4px', text: '12px' },
    medium: { star: '20px', gap: '6px', text: '14px' },
    large: { star: '24px', gap: '8px', text: '16px' }
  };

  const styles = sizeMap[size] || sizeMap.medium;
  const displayRating = hoverRating || Math.round(currentRating * 2) / 2; // Redondea a media estrella

  const handleClick = (starIndex) => {
    if (isInteractive) {
      onRate(starIndex + 1);
    }
  };

  const handleMouseEnter = (starIndex) => {
    if (isInteractive) {
      setHoverRating(starIndex + 1);
    }
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  // Renderizar estrellas
  const stars = Array.from({ length: maxStars }, (_, i) => {
    const starValue = i + 1;
    const isFilled = starValue <= Math.floor(displayRating);
    const isHalf = starValue - displayRating > 0 && starValue - displayRating <= 1 && displayRating !== Math.floor(displayRating);

    return (
      <span
        key={i}
        onClick={() => handleClick(i)}
        onMouseEnter={() => handleMouseEnter(i)}
        onMouseLeave={handleMouseLeave}
        style={{
          fontSize: styles.star,
          cursor: isInteractive ? 'pointer' : 'default',
          color: isFilled ? '#fbbf24' : isHalf ? '#fbbf24' : '#d1d5db',
          opacity: isFilled || isHalf ? 1 : 0.6,
          transition: 'all 0.1s ease',
          userSelect: 'none',
          display: 'inline-block',
          width: styles.star,
          height: styles.star,
          lineHeight: styles.star,
          textAlign: 'center',
        }}
      >
        {isHalf ? '⭐' : '⭐'}
      </span>
    );
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: styles.gap,
      }}
    >
      <div style={{ display: 'flex', gap: '2px' }}>
        {stars}
      </div>
      {showText && (
        <span
          style={{
            fontSize: styles.text,
            color: '#6b7280',
            fontWeight: '500',
            minWidth: '35px',
          }}
        >
          {currentRating > 0 ? currentRating.toFixed(1) : 'Sin calificar'}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
