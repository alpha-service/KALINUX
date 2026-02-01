import { useState, useEffect } from 'react';

export const THEMES = {
  DEFAULT: 'default',
  OCEAN: 'ocean',
  FOREST: 'forest',
  SUNSET: 'sunset',
  PURPLE: 'purple',
  DARK: 'dark'
};

export const THEME_COLORS = {
  [THEMES.DEFAULT]: {
    name: 'Noir & Gris',
    nameNL: 'Zwart & Grijs',
    primary: '#000000',
    secondary: '#374151',
    accent: '#f1f5f9',
    sidebar: '#000000',
    button: '#374151',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  },
  [THEMES.OCEAN]: {
    name: 'Bleu Minuit',
    nameNL: 'Middernacht Blauw',
    primary: '#0f172a',
    secondary: '#1e293b',
    accent: '#334155',
    sidebar: '#0f172a',
    button: '#1e293b',
    success: '#14b8a6',
    warning: '#f59e0b',
    danger: '#ef4444'
  },
  [THEMES.FOREST]: {
    name: 'Vert Émeraude Sombre',
    nameNL: 'Donker Smaragdgroen',
    primary: '#064e3b',
    secondary: '#065f46',
    accent: '#064e3b',
    sidebar: '#064e3b',
    button: '#065f46',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444'
  },
  [THEMES.SUNSET]: {
    name: 'Bordeaux Profond',
    nameNL: 'Diep Bordeaux',
    primary: '#450a0a',
    secondary: '#7f1d1d',
    accent: '#450a0a',
    sidebar: '#450a0a',
    button: '#7f1d1d',
    success: '#10b981',
    warning: '#fbbf24',
    danger: '#dc2626'
  },
  [THEMES.PURPLE]: {
    name: 'Violet Royal',
    nameNL: 'Koninklijk Paars',
    primary: '#2e1065',
    secondary: '#4c1d95',
    accent: '#2e1065',
    sidebar: '#2e1065',
    button: '#4c1d95',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  },
  [THEMES.DARK]: {
    name: 'Onyx Noir',
    nameNL: 'Onyx Zwart',
    primary: '#09090b',
    secondary: '#18181b',
    accent: '#27272a',
    sidebar: '#09090b',
    button: '#18181b',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  }
};

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('app_theme');
    // Validate saved theme exists in THEME_COLORS
    if (saved && THEME_COLORS[saved]) {
      return saved;
    }
    return THEMES.DEFAULT;
  });

  const colors = THEME_COLORS[currentTheme] || THEME_COLORS[THEMES.DEFAULT];

  useEffect(() => {
    localStorage.setItem('app_theme', currentTheme);
    applyTheme(colors);
  }, [currentTheme, colors]);

  const applyTheme = (themeColors) => {
    const root = document.documentElement;
    
    // Convert hex to RGB for Tailwind
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
        : '0 0 0';
    };

    root.style.setProperty('--color-primary', hexToRgb(themeColors.primary));
    root.style.setProperty('--color-secondary', hexToRgb(themeColors.secondary));
    root.style.setProperty('--color-accent', hexToRgb(themeColors.accent));
    root.style.setProperty('--color-sidebar', themeColors.sidebar);
    root.style.setProperty('--color-button', themeColors.button);
    root.style.setProperty('--color-success', themeColors.success);
    root.style.setProperty('--color-warning', themeColors.warning);
    root.style.setProperty('--color-danger', themeColors.danger);
  };

  const changeTheme = (themeId) => {
    setCurrentTheme(themeId);
  };

  return {
    currentTheme,
    colors,
    changeTheme,
    THEMES,
    THEME_COLORS
  };
}
