// Paleta de colores compartida para toda la aplicación
export const getThemePalette = (theme) => {
  const isDark = theme === 'dark';
  
  return isDark
    ? {
        // Tema oscuro
        pageBg: '#0f172a',
        cardBg: '#1e293b',
        cardBorder: '#334155',
        text: '#e5e7eb',
        textLight: '#94a3b8',
        heroSub: '#cbd5e1',
        navBg: 'rgba(30, 41, 59, 0.8)',
        navBorder: '#334155',
        inputBg: '#0f172a',
        inputBorder: '#334155',
        primary: '#3b82f6',
        secondary: '#1e293b',
        accent: '#a855f7',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
      }
    : {
        // Tema claro
        pageBg: '#f8fafc',
        cardBg: 'rgba(255, 255, 255, 0.85)',
        cardBorder: 'rgba(148, 163, 184, 0.3)',
        text: '#0f172a',
        textLight: '#475569',
        heroSub: '#64748b',
        navBg: 'rgba(255, 255, 255, 0.8)',
        navBorder: 'rgba(148, 163, 184, 0.3)',
        inputBg: '#ffffff',
        inputBorder: 'rgba(148, 163, 184, 0.3)',
        primary: '#3b82f6',
        secondary: '#f1f5f9',
        accent: '#a855f7',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
      };
};
