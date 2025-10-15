'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

// Brand colors configuration
export const brandColors = {
  // Brand palette (primary + utility shades)
  primary: '#1D4ED8', // Deep Blue
  primaryLight: '#3B82F6',
  primaryDark: '#1E40AF',
  secondary: '#3B82F6',
  highlight: '#F97316',

  // Semantic status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Neutrals
  background: '#F3F4F6',
  card: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',

  // Alias for primary brand token (useful in components)
  brand: '#1D4ED8',
} as const

export type BrandColor = keyof typeof brandColors

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    // Set CSS variables for brand colors so components can consume them
    try {
      const root = document.documentElement;
      root.style.setProperty('--color-brand', brandColors.brand);
      root.style.setProperty('--color-brand-primary', brandColors.primary);
      root.style.setProperty('--color-brand-light', brandColors.primaryLight);
      root.style.setProperty('--color-brand-dark', brandColors.primaryDark);
      root.style.setProperty('--color-highlight', brandColors.highlight);
      root.style.setProperty('--color-border', brandColors.border);
      root.style.setProperty('--color-background', brandColors.background);
      root.style.setProperty('--color-text-primary', brandColors.textPrimary);
      root.style.setProperty('--color-text-secondary', brandColors.textSecondary);
    } catch (e) {
      // ignore (server-side or non-DOM)
    }
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
