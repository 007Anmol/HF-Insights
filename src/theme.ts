/**
 * Global Theme Configuration
 * A comprehensive design system for HealthFuture Insights
 * Modern, clean, medical/educational aesthetic with soft blues and generous spacing
 */

export const theme = {
  // Color Palette - Soft blues, teal accents, clean backgrounds
  colors: {
    // Primary - Vibrant yet soft blue for buttons, accents, CTAs
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',
    
    // Secondary - Teal/green accents
    secondary: '#10B981',
    secondaryLight: '#34D399',
    
    // Background hierarchy
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      tertiary: '#F1F5F9',
    },
    
    // Surface colors for cards, modals
    surface: {
      light: '#FFFFFF',
      elevated: '#FAFBFC',
    },
    
    // Text hierarchy
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      tertiary: '#94A3B8',
      inverse: '#FFFFFF',
    },
    
    // Semantic colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Borders and dividers
    border: {
      light: '#E2E8F0',
      medium: '#CBD5E1',
      strong: '#94A3B8',
    },
    
    // Upload zone and interactive elements
    uploadZone: {
      background: '#F0F7FF',
      border: '#3B82F6',
      borderDashed: '#93C5FD',
    },
    
    // Icon backgrounds
    iconBackground: {
      blue: '#EFF6FF',
      teal: '#ECFDF5',
      purple: '#F5F3FF',
    },
  },
  
  // Typography Scale
  typography: {
    // Font families (system defaults for React Native)
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semibold: 'System',
      bold: 'System',
    },
    
    // Font sizes with semantic names
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
      '5xl': 40,
    },
    
    // Line heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
    
    // Font weights
    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
  
  // Spacing scale (multiples of 8)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
    '4xl': 64,
  },
  
  // Border radius scale
  borderRadius: {
    none: 0,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },
  
  // Shadow/Elevation system
  shadows: {
    none: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
    xl: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 12,
    },
  },
  
  // Animation timings (in ms)
  animation: {
    duration: {
      fast: 150,
      normal: 250,
      slow: 350,
    },
    easing: {
      ease: 'ease' as const,
      easeIn: 'ease-in' as const,
      easeOut: 'ease-out' as const,
      easeInOut: 'ease-in-out' as const,
    },
  },
  
  // Touch target sizes (min 48dp for accessibility)
  touchTarget: {
    min: 48,
    comfortable: 56,
  },
  
  // Safe area and screen padding
  layout: {
    screenPadding: 24,
    cardPadding: 20,
    sectionSpacing: 32,
  },
} as const;

// Type exports for TypeScript
export type Theme = typeof theme;
export type ThemeColors = typeof theme.colors;
export type ThemeSpacing = typeof theme.spacing;
