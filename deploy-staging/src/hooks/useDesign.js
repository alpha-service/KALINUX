import { useState, useEffect, createContext, useContext } from 'react';

// 4 design modes: 3 presets + 1 custom
export const DESIGNS = {
  CLASSIC: 'classic',     // Current design - traditional POS
  MODERN: 'modern',       // Sleek, glassmorphism, rounded
  MINIMAL: 'minimal',     // Ultra-clean, flat, monochrome
  CUSTOM: 'custom'        // User defined
};

// Default values for granular appearance settings
const DEFAULT_APPEARANCE = {
  density: 'comfortable', // compact, comfortable, spacious
  radius: '0.5rem',       // 0, 0.25rem, 0.5rem, 0.75rem, 1rem
  fontScale: '100%',      // 90%, 100%, 110%
  buttonSize: 'default',  // sm, default, lg
  shadows: 'enabled'      // enabled, disabled
};

export const DESIGN_CONFIG = {
  [DESIGNS.CLASSIC]: {
    name: 'Classic / Classique',
    nameNL: 'Klassiek',
    description: 'Design traditionnel ALPHA&CO',
    // Layout
    sidebarStyle: 'solid',
    cardStyle: 'shadow',
    buttonStyle: 'solid',
    inputStyle: 'bordered',
    // Spacing
    borderRadius: 'rounded-lg',
    buttonRadius: 'rounded-md',
    cardRadius: 'rounded-lg',
    // Visual Effects
    useGradients: false,
    useGlass: false,
    useShadows: true,
    // Typography
    headingWeight: 'font-bold',
    // Colors overlay
    cardBg: 'bg-white',
    surfaceBg: 'bg-slate-50',
    borderColor: 'border-slate-200',
    // Button styles
    primaryButton: 'bg-brand-orange hover:bg-brand-orange/90 text-white',
    secondaryButton: 'bg-brand-navy hover:bg-brand-navy/90 text-white',
    ghostButton: 'hover:bg-slate-100',
    // Header
    headerStyle: 'solid',
    // Sidebar  
    sidebarWidth: 'w-64',
    navItemStyle: 'rounded-lg',
    // Input
    inputBorder: 'border border-slate-300',
    inputFocus: 'focus:ring-2 focus:ring-brand-navy/20',
    // Product cards
    productCardStyle: 'border border-slate-200 hover:border-brand-navy hover:shadow-md',
    // Icons
    iconSize: 'w-4 h-4',
    // Animations
    transition: 'transition-all duration-200'
  },
  [DESIGNS.MODERN]: {
    name: 'Modern / Moderne',
    nameNL: 'Modern',
    description: 'Design moderne avec effets glass',
    // Layout
    sidebarStyle: 'glass',
    cardStyle: 'glass',
    buttonStyle: 'gradient',
    inputStyle: 'glass',
    // Spacing
    borderRadius: 'rounded-2xl',
    buttonRadius: 'rounded-xl',
    cardRadius: 'rounded-2xl',
    // Visual Effects
    useGradients: true,
    useGlass: true,
    useShadows: true,
    // Typography
    headingWeight: 'font-semibold',
    // Colors overlay
    cardBg: 'bg-white/80 backdrop-blur-lg',
    surfaceBg: 'bg-gradient-to-br from-slate-100 to-slate-200',
    borderColor: 'border-white/20',
    // Button styles
    primaryButton: 'bg-gradient-to-r from-neutral-700 to-neutral-900 hover:from-neutral-800 hover:to-black text-white shadow-lg shadow-black/25',
    secondaryButton: 'bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black text-white shadow-lg shadow-black/25',
    ghostButton: 'hover:bg-white/50 backdrop-blur',
    // Header
    headerStyle: 'glass',
    // Sidebar
    sidebarWidth: 'w-72',
    navItemStyle: 'rounded-xl',
    // Input
    inputBorder: 'border border-white/30 bg-white/50 backdrop-blur',
    inputFocus: 'focus:ring-2 focus:ring-neutral-500/30 focus:border-neutral-500/50',
    // Product cards
    productCardStyle: 'bg-white/70 backdrop-blur border border-white/30 hover:bg-white/90 hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1',
    // Icons
    iconSize: 'w-5 h-5',
    // Animations
    transition: 'transition-all duration-300 ease-out'
  },
  [DESIGNS.MINIMAL]: {
    name: 'Minimal / Minimaal',
    nameNL: 'Minimalistisch',
    description: 'Design ultra-épuré et fonctionnel',
    // Layout
    sidebarStyle: 'flat',
    cardStyle: 'flat',
    buttonStyle: 'outline',
    inputStyle: 'underline',
    // Spacing
    borderRadius: 'rounded-none',
    buttonRadius: 'rounded-none',
    cardRadius: 'rounded-none',
    // Visual Effects
    useGradients: false,
    useGlass: false,
    useShadows: false,
    // Typography
    headingWeight: 'font-medium',
    // Colors overlay
    cardBg: 'bg-white',
    surfaceBg: 'bg-neutral-100',
    borderColor: 'border-neutral-300',
    // Button styles
    primaryButton: 'bg-black hover:bg-neutral-800 text-white',
    secondaryButton: 'border-2 border-black text-black hover:bg-black hover:text-white',
    ghostButton: 'hover:bg-neutral-100',
    // Header
    headerStyle: 'flat',
    // Sidebar
    sidebarWidth: 'w-56',
    navItemStyle: 'rounded-none border-l-2 border-transparent',
    // Input
    inputBorder: 'border-0 border-b-2 border-neutral-300 bg-transparent',
    inputFocus: 'focus:border-black focus:ring-0',
    // Product cards
    productCardStyle: 'border-2 border-neutral-200 hover:border-black',
    // Icons
    iconSize: 'w-4 h-4',
    // Animations
    transition: 'transition-colors duration-150'
  },
  [DESIGNS.CUSTOM]: {
    name: 'Custom / Personnalisé',
    nameNL: 'Aangepast',
    description: 'Votre design, vos règles',
    // Defaults will be overridden by appearance state
    sidebarStyle: 'solid',
    cardStyle: 'shadow',
    buttonStyle: 'solid',
    inputStyle: 'bordered',
    borderRadius: 'rounded-lg',
    buttonRadius: 'rounded-md',
    cardRadius: 'rounded-lg',
    useGradients: false,
    useGlass: false,
    useShadows: true,
    headingWeight: 'font-bold',
    cardBg: 'bg-white',
    surfaceBg: 'bg-slate-50',
    borderColor: 'border-slate-200',
    primaryButton: 'bg-brand-orange hover:bg-brand-orange/90 text-white',
    secondaryButton: 'bg-brand-navy hover:bg-brand-navy/90 text-white',
    ghostButton: 'hover:bg-slate-100',
    headerStyle: 'solid',
    sidebarWidth: 'w-64',
    navItemStyle: 'rounded-lg',
    inputBorder: 'border border-slate-300',
    inputFocus: 'focus:ring-2 focus:ring-brand-navy/20',
    productCardStyle: 'border border-slate-200 hover:border-brand-navy hover:shadow-md',
    iconSize: 'w-4 h-4',
    transition: 'transition-all duration-200'
  }
};

const DesignContext = createContext(null);

export function DesignProvider({ children }) {
  const [currentDesign, setCurrentDesign] = useState(() => {
    const saved = localStorage.getItem('app_design');
    // Validate saved design exists in DESIGN_CONFIG
    if (saved && DESIGN_CONFIG[saved]) {
      return saved;
    }
    return DESIGNS.CLASSIC;
  });

  const [appearance, setAppearance] = useState(() => {
    const saved = localStorage.getItem('app_appearance');
    return saved ? JSON.parse(saved) : DEFAULT_APPEARANCE;
  });

  const design = DESIGN_CONFIG[currentDesign] || DESIGN_CONFIG[DESIGNS.CLASSIC];

  useEffect(() => {
    localStorage.setItem('app_design', currentDesign);
    localStorage.setItem('app_appearance', JSON.stringify(appearance));
    
    // Apply design classes to root
    document.documentElement.setAttribute('data-design', currentDesign);
    
    // Apply CSS custom properties for design
    const root = document.documentElement;
    
    // Determine radius based on design or custom settings
    let radiusValue = '0.5rem';
    let shadowValue = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
    
    if (currentDesign === DESIGNS.CUSTOM) {
      radiusValue = appearance.radius;
      shadowValue = appearance.shadows === 'enabled' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none';
      
      // Apply density variables
      if (appearance.density === 'compact') {
        root.style.setProperty('--spacing-unit', '0.25rem');
      } else if (appearance.density === 'spacious') {
        root.style.setProperty('--spacing-unit', '0.75rem');
      } else {
        root.style.setProperty('--spacing-unit', '0.5rem');
      }
      
    } else {
      // PRESET LOGIC (STRICT)
      radiusValue = design.borderRadius === 'rounded-none' ? '0' : design.borderRadius === 'rounded-2xl' ? '1rem' : '0.5rem';
      shadowValue = design.useShadows ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none';
    }

    root.style.setProperty('--radius', radiusValue);
    root.style.setProperty('--design-shadow', shadowValue);
    
  }, [currentDesign, design, appearance]);

  const changeDesign = (designId) => {
    if (DESIGN_CONFIG[designId]) {
      setCurrentDesign(designId);
    }
  };

  const updateAppearance = (key, value) => {
    setAppearance(prev => ({ ...prev, [key]: value }));
    // Auto-switch to custom when tweaking
    if (currentDesign !== DESIGNS.CUSTOM) {
      setCurrentDesign(DESIGNS.CUSTOM);
    }
  };

  const value = {
    currentDesign,
    setCurrentDesign: changeDesign,  // Alias for direct setting
    design,
    changeDesign,
    appearance,
    updateAppearance,
    DESIGNS,
    DESIGN_CONFIG
  };

  return (
    <DesignContext.Provider value={value}>
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const context = useContext(DesignContext);
  if (!context) {
    // Fallback for when used outside provider
    return {
      currentDesign: DESIGNS.CLASSIC,
      setCurrentDesign: () => {},  // Alias
      design: DESIGN_CONFIG[DESIGNS.CLASSIC],
      changeDesign: () => {},
      appearance: DEFAULT_APPEARANCE,
      updateAppearance: () => {},
      DESIGNS,
      DESIGN_CONFIG
    };
  }
  return context;
}

// Utility function to get conditional classes based on design
export function getDesignClasses(designObj, type, appearance = null) {
  // If we have a custom design active (implied by passing valid appearance obj and designObj being custom)
  // For now, simpler: just use the passed design object which comes from useDesign()
  
  // Note: strict logic maintained for Presets because designObj comes directly from DESIGN_CONFIG[currentDesign]
  const d = designObj; 
  
  // Helper to override if Custom Mode
  const isCustom = d.name.startsWith('Custom');
  
  // We can inject custom overrides here if needed, but for now 
  // we rely on the implementation in DESIGN_CONFIG[DESIGNS.CUSTOM] 
  // matching the default behavior, and we will update `getDesignClasses` consumers
  // to possibly treat granular classes differently. 
  
  // However, to keep it non-invasive as requested:
  // We return the strings from the config object. 
  // For Custom mode, we might want to construct these strings dynamically in the future.
  // Currently, the CSS variables approach handles Density/Radius.
  // Class strings handles shapes/colors.
  
  switch (type) {
    case 'card':
      return `${d.cardBg} ${d.cardRadius} ${d.borderColor} ${d.transition}`;
    case 'button-primary':
      return `${d.primaryButton} ${d.buttonRadius} ${d.transition}`;
    case 'button-secondary':
      return `${d.secondaryButton} ${d.buttonRadius} ${d.transition}`;
    case 'input':
      return `${d.inputBorder} ${d.inputFocus} ${d.buttonRadius}`;
    case 'product-card':
      return `${d.productCardStyle} ${d.cardRadius} ${d.transition}`;
    case 'nav-item':
      return `${d.navItemStyle} ${d.transition}`;
    case 'surface':
      return `${d.surfaceBg}`;
    default:
      return '';
  }
}
