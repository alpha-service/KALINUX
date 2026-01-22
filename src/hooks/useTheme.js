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
    name: 'ALPHA&CO Original',
    nameNL: 'ALPHA&CO Origineel',
    primary: '#1e3a8a',
    secondary: '#ff6b35',
    accent: '#f1f5f9',
    sidebar: '#1e3a8a',
    button: '#ff6b35',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  },
  [THEMES.OCEAN]: {
    name: 'Ocean Bleu',
    nameNL: 'Ocean Blauw',
    primary: '#0369a1',
    secondary: '#06b6d4',
    accent: '#f0f9ff',
    sidebar: '#0c4a6e',
    button: '#06b6d4',
    success: '#14b8a6',
    warning: '#f59e0b',
    danger: '#ef4444'
  },
  [THEMES.FOREST]: {
    name: 'Foret Verte',
    nameNL: 'Bos Groen',
    primary: '#15803d',
    secondary: '#84cc16',
    accent: '#f7fee7',
    sidebar: '#14532d',
    button: '#84cc16',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444'
  },
  [THEMES.SUNSET]: {
    name: 'Coucher de Soleil',
    nameNL: 'Zonsondergang',
    primary: '#c2410c',
    secondary: '#f97316',
    accent: '#fff7ed',
    sidebar: '#7c2d12',
    button: '#f97316',
    success: '#10b981',
    warning: '#fbbf24',
    danger: '#dc2626'
  },
  [THEMES.PURPLE]: {
    name: 'Violet Royal',
    nameNL: 'Koninklijk Paars',
    primary: '#7e22ce',
    secondary: '#a855f7',
    accent: '#faf5ff',
    sidebar: '#581c87',
    button: '#a855f7',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  },
  [THEMES.DARK]: {
    name: 'Nuit Sombre',
    nameNL: 'Donkere Nacht',
    primary: '#1f2937',
    secondary: '#6366f1',
    accent: '#f9fafb',
    sidebar: '#111827',
    button: '#6366f1',
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
