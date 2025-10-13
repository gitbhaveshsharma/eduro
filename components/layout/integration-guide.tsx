/**
 * Integration Guide for ConditionalLayout
 * 
 * This file shows how to integrate the layout system with your existing pages
 */

// Method 1: Page-level integration (Recommended)
// Update individual pages to use ConditionalLayout

// Example: app/dashboard/page.tsx
/*
'use client'

import { ConditionalLayout } from '@/components/layout'
import { useCurrentProfile, useCurrentProfileLoading } from '@/lib/profile'
// ...other imports

export default function DashboardPage() {
    const profile = useCurrentProfile()
    const loading = useCurrentProfileLoading()
    // ...existing logic

    if (loading || !isInitialized) {
        return (
            <ConditionalLayout platform="lms">
                <main className="min-h-screen bg-background p-6">
                    <div className="max-w-6xl mx-auto space-y-6">
                        <ComponentLoadingSpinner component="dashboard" size="lg" />
                    </div>
                </main>
            </ConditionalLayout>
        )
    }

    return (
        <ConditionalLayout platform="lms">
            <main className="min-h-screen bg-background">
                <div className="max-w-6xl mx-auto p-6 space-y-6">
                    // ...existing dashboard content
                </div>
            </main>
        </ConditionalLayout>
    )
}
*/

// Method 2: Layout-level integration  
// Add ConditionalLayout to the root layout for specific routes

// Example: app/dashboard/layout.tsx (create this file)
/*
import { ConditionalLayout } from '@/components/layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ConditionalLayout platform="lms">
      {children}
    </ConditionalLayout>
  )
}
*/

// Method 3: Route-based integration
// Use different layouts based on route patterns

// Example: Create a layout provider component
/*
'use client'

import { usePathname } from 'next/navigation'
import { ConditionalLayout } from '@/components/layout'
import type { PlatformType } from '@/components/layout'

interface RouteLayoutProviderProps {
  children: React.ReactNode
}

export function RouteLayoutProvider({ children }: RouteLayoutProviderProps) {
  const pathname = usePathname()
  
  // Determine platform based on route
  const getPlatform = (path: string): PlatformType => {
    if (path.startsWith('/feed') || 
        path.startsWith('/network') || 
        path.startsWith('/messages')) {
      return 'community'
    }
    
    if (path.startsWith('/dashboard') || 
        path.startsWith('/courses') || 
        path.startsWith('/assignments')) {
      return 'lms'
    }
    
    // Default platform
    return 'lms'
  }
  
  const platform = getPlatform(pathname)
  
  return (
    <ConditionalLayout platform={platform}>
      {children}
    </ConditionalLayout>
  )
}
*/

// Method 4: Context-based integration
// Use React Context to manage layout state

/*
'use client'

import { createContext, useContext, useState } from 'react'
import { ConditionalLayout } from '@/components/layout'
import type { PlatformType, LayoutConfig } from '@/components/layout'

interface LayoutContextType {
  platform: PlatformType
  setPlatform: (platform: PlatformType) => void
  config: Partial<LayoutConfig>
  setConfig: (config: Partial<LayoutConfig>) => void
}

const LayoutContext = createContext<LayoutContextType | null>(null)

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [platform, setPlatform] = useState<PlatformType>('lms')
  const [config, setConfig] = useState<Partial<LayoutConfig>>({})
  
  return (
    <LayoutContext.Provider value={{ platform, setPlatform, config, setConfig }}>
      <ConditionalLayout platform={platform} forceConfig={config}>
        {children}
      </ConditionalLayout>
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider')
  }
  return context
}
*/

// Quick Integration Steps:

// 1. Import ConditionalLayout in your page
// 2. Wrap your page content with ConditionalLayout
// 3. Specify platform type ('community' or 'lms')
// 4. Remove any existing headers/navigation from your page
// 5. Ensure your content has proper spacing for mobile bottom nav

export { };