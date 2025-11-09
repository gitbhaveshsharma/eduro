'use client'

import { useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useCurrentProfile, useCurrentProfileLoading } from '@/lib/profile'
import { isPublicRoute } from '@/lib/utils/auth-redirect'

// Constants to avoid magic numbers
const ONBOARDING_LEVELS = {
  ROLE_SELECTION: 1,
  PERSONAL_INFO: 2,
  COACHING_DETAILS: 3, // Only for coaching centers
  TERMS: 4,
  COMPLETE: 5
} as const

/**
 * Hook to handle onboarding redirects based on user's onboarding level
 * Should be used in the main layout or app component
 */
export function useOnboardingRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  const currentPath = pathname || '/'
  const profile = useCurrentProfile()
  const loading = useCurrentProfileLoading()

  // Memoize computed values to avoid recalculating on every render
  const {
    onboardingLevel,
    requiredLevel,
    isOnOnboardingPage,
    isAuthPage,
    shouldRedirect
  } = useMemo(() => {
    const onboardingLevel = profile ? parseInt(profile.onboarding_level || '1', 10) : 1
    const requiredLevel = getRequiredOnboardingLevel(profile?.role || 'S')
    const isOnOnboardingPage = currentPath.startsWith('/onboarding')
    const isAuthPage = currentPath.startsWith('/login') ||
      currentPath.startsWith('/signup') ||
      currentPath.startsWith('/auth')

    const shouldRedirect = !loading &&
      !isAuthPage &&
      !isPublicRoute(currentPath) &&
      profile &&
      ((onboardingLevel < requiredLevel && !isOnOnboardingPage) ||
        (onboardingLevel >= requiredLevel && isOnOnboardingPage))

    return {
      onboardingLevel,
      requiredLevel,
      isOnOnboardingPage,
      isAuthPage,
      shouldRedirect
    }
  }, [loading, profile, currentPath])

  useEffect(() => {
    if (!shouldRedirect) return

    // If user hasn't completed onboarding and is not on onboarding page, redirect
    if (onboardingLevel < requiredLevel && !isOnOnboardingPage) {
      console.log('Redirecting to onboarding - level:', onboardingLevel, 'required:', requiredLevel)
      router.push('/onboarding')
      return
    }

    // If user has completed onboarding but is on onboarding page, redirect to dashboard
    if (onboardingLevel >= requiredLevel && isOnOnboardingPage) {
      router.push('/')
      return
    }
  }, [shouldRedirect, onboardingLevel, requiredLevel, isOnOnboardingPage, router])

  return {
    loading,
    profile,
    shouldShowOnboarding: onboardingLevel < requiredLevel,
    onboardingCompleted: onboardingLevel >= requiredLevel,
    onboardingLevel,
    requiredLevel
  }
}

/**
 * Utility function to check if onboarding is required
 */
export function isOnboardingRequired(profile: any): boolean {
  if (!profile) return false
  const onboardingLevel = parseInt(profile.onboarding_level || '1', 10)
  const requiredLevel = getRequiredOnboardingLevel(profile.role || 'S')
  return onboardingLevel < requiredLevel
}

/**
 * Utility function to get the appropriate onboarding step
 */
export function getOnboardingStep(profile: any): number {
  if (!profile) return ONBOARDING_LEVELS.ROLE_SELECTION

  const onboardingLevel = parseInt(profile.onboarding_level || '1', 10)
  const role = profile.role || 'S'

  if (role === 'C') {
    // Coaching center flow: Role (1) → Personal Info (2) → Coaching Details (3) → Terms (4) → Complete (5)
    if (onboardingLevel >= ONBOARDING_LEVELS.TERMS) return ONBOARDING_LEVELS.TERMS
    if (onboardingLevel >= ONBOARDING_LEVELS.COACHING_DETAILS) return ONBOARDING_LEVELS.COACHING_DETAILS
    if (onboardingLevel >= ONBOARDING_LEVELS.PERSONAL_INFO) return ONBOARDING_LEVELS.PERSONAL_INFO
    return ONBOARDING_LEVELS.ROLE_SELECTION
  } else {
    // Other roles flow: Role (1) → Personal Info (2) → Terms (4) → Complete (5)
    if (onboardingLevel >= 3) return ONBOARDING_LEVELS.TERMS // Skip step 3 for non-coaching roles
    if (onboardingLevel >= ONBOARDING_LEVELS.PERSONAL_INFO) return ONBOARDING_LEVELS.PERSONAL_INFO
    return ONBOARDING_LEVELS.ROLE_SELECTION
  }
}

/**
 * Get required onboarding level based on user role
 */
function getRequiredOnboardingLevel(userRole: string): number {
  return ONBOARDING_LEVELS.COMPLETE // All roles require level 5 (terms completion)
}