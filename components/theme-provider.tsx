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
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
