'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useCurrentProfile, useCurrentProfileLoading } from '@/lib/profile'

/**
 * Hook to handle onboarding redirects based on user's onboarding level
 * Should be used in the main layout or app component
 */
export function useOnboardingRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  const profile = useCurrentProfile()
  const loading = useCurrentProfileLoading()

  useEffect(() => {
    // Don't redirect if still loading or no profile
    if (loading || !profile) return

    // Don't redirect if already on auth pages
    const isAuthPage = pathname.startsWith('/login') || 
                      pathname.startsWith('/signup') || 
                      pathname.startsWith('/auth')

    if (isAuthPage) return

    // Check onboarding level - ensure it's parsed as a number
    const onboardingLevel = parseInt(profile.onboarding_level || '1', 10)
    const isOnOnboardingPage = pathname.startsWith('/onboarding')


    // If user hasn't completed onboarding (level < 3) and is not on onboarding page, redirect
    if (onboardingLevel < 3 && !isOnOnboardingPage) {
      console.log('Redirecting to onboarding - level:', onboardingLevel)
      router.push('/onboarding')
      return
    }

    // If user has completed onboarding (level >= 3) but is on onboarding page, redirect to dashboard
    if (onboardingLevel >= 3 && isOnOnboardingPage) {
      // console.log('Redirecting to dashboard - level:', onboardingLevel)
      router.push('/')
      return
    }
  }, [loading, profile, pathname, router])

  return {
    loading,
    profile,
    shouldShowOnboarding: profile ? parseInt(profile.onboarding_level || '1', 10) < 3 : false,
    onboardingCompleted: profile ? parseInt(profile.onboarding_level || '1', 10) >= 3 : false,
    onboardingLevel: profile ? parseInt(profile.onboarding_level || '1', 10) : 1
  }
}

/**
 * Utility function to check if onboarding is required
 */
export function isOnboardingRequired(profile: any): boolean {
  if (!profile) return false
  const onboardingLevel = parseInt(profile.onboarding_level || '1', 10)
  return onboardingLevel < 3
}

/**
 * Utility function to get the appropriate onboarding step
 */
export function getOnboardingStep(profile: any): number {
  if (!profile) return 1
  const onboardingLevel = parseInt(profile.onboarding_level || '1', 10)
  
  if (onboardingLevel >= 2) {
    return 2 // Personal info step
  }
  return 1 // Role selection step
}