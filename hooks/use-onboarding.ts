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

    // Different completion levels based on role
    const getRequiredOnboardingLevel = (userRole: string) => {
      if (userRole === 'C') return 5; // Coaching centers need 5 steps (Role, Personal, Coaching, Terms, Complete)
      return 5; // Others need 5 steps (Role, Personal, Terms, Complete)
    }

    const requiredLevel = getRequiredOnboardingLevel(profile.role || 'S')

    // If user hasn't completed onboarding and is not on onboarding page, redirect
    if (onboardingLevel < requiredLevel && !isOnOnboardingPage) {
      console.log('Redirecting to onboarding - level:', onboardingLevel, 'required:', requiredLevel)
      router.push('/onboarding')
      return
    }

    // If user has completed onboarding but is on onboarding page, redirect to dashboard
    if (onboardingLevel >= requiredLevel && isOnOnboardingPage) {
      // console.log('Redirecting to dashboard - level:', onboardingLevel)
      router.push('/')
      return
    }
  }, [loading, profile, pathname, router])

  return {
    loading,
    profile,
    shouldShowOnboarding: profile ? parseInt(profile.onboarding_level || '1', 10) < getRequiredOnboardingLevel(profile.role || 'S') : false,
    onboardingCompleted: profile ? parseInt(profile.onboarding_level || '1', 10) >= getRequiredOnboardingLevel(profile.role || 'S') : false,
    onboardingLevel: profile ? parseInt(profile.onboarding_level || '1', 10) : 1
  }

  function getRequiredOnboardingLevel(userRole: string) {
    if (userRole === 'C') return 5; // Coaching centers need 5 steps (Role, Personal, Coaching, Terms, Complete)
    return 5; // Others need 5 steps (Role, Personal, Terms, Complete)
  }
}

/**
 * Utility function to check if onboarding is required
 */
export function isOnboardingRequired(profile: any): boolean {
  if (!profile) return false
  const onboardingLevel = parseInt(profile.onboarding_level || '1', 10)
  const requiredLevel = 5 // All roles now require completing terms (level 5)
  return onboardingLevel < requiredLevel
}

/**
 * Utility function to get the appropriate onboarding step
 */
export function getOnboardingStep(profile: any): number {
  if (!profile) return 1
  const onboardingLevel = parseInt(profile.onboarding_level || '1', 10)
  const role = profile.role || 'S'
  
  if (role === 'C') {
    // Coaching center flow: Role (1) → Personal Info (2) → Coaching Details (3) → Terms (4) → Complete (5)
    if (onboardingLevel >= 4) return 4 // Terms and conditions step
    if (onboardingLevel >= 3) return 3 // Coaching details step
    if (onboardingLevel >= 2) return 2 // Personal info step
    return 1 // Role selection step
  } else {
    // Other roles flow: Role (1) → Personal Info (2) → Terms (4) → Complete (5)
    if (onboardingLevel >= 3) return 4 // Terms and conditions step (skipping step 3)
    if (onboardingLevel >= 2) return 2 // Personal info step
    return 1 // Role selection step
  }
}