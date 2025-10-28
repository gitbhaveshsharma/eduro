/**
 * Authentication Redirect Utilities
 * 
 * Helper functions to determine correct redirect destination after successful authentication
 * based on user's onboarding status and profile completion
 */

import { Profile } from '@/lib/schema/profile.types'
import { isOnboardingRequired } from '@/hooks/use-onboarding'

export interface AuthRedirectResult {
  destination: string
  reason: 'onboarding_required' | 'onboarding_completed' | 'no_profile' | 'redirect_param'
  message?: string
}

/**
 * Get redirect destination from URL search params
 */
export function getRedirectFromUrl(searchParams?: URLSearchParams | string): string | null {
  let params: URLSearchParams
  
  if (typeof searchParams === 'string') {
    // Handle case where search params are passed as string
    params = new URLSearchParams(searchParams.startsWith('?') ? searchParams.slice(1) : searchParams)
  } else if (searchParams instanceof URLSearchParams) {
    params = searchParams
  } else {
    // Try to get from current URL if running in browser
    if (typeof window !== 'undefined') {
      params = new URLSearchParams(window.location.search)
    } else {
      return null
    }
  }
  
  const redirect = params.get('redirect')
  
  // Validate redirect URL to prevent open redirect attacks
  if (redirect) {
    // Only allow relative URLs or same origin
    if (redirect.startsWith('/') && !redirect.startsWith('//')) {
      // Fix common typos in redirect URLs
      const cleanRedirect = redirect.replace('/onbording', '/onboarding')
      
      // Allow review pages and other safe paths
      const safePatterns = [
        /^\/dashboard/,
        /^\/onboarding/,
        /^\/profile/,
        /^\/coaching-reviews/,
        /^\/network/,
        /^\/feed/,
        /^\/settings/
      ]
      
      const isSafePath = safePatterns.some(pattern => pattern.test(cleanRedirect))
      if (isSafePath) {
        return cleanRedirect
      }
    }
  }
  
  return null
}

/**
 * Determines where to redirect user after successful authentication
 * @param profile User profile data
 * @param redirectParam Optional redirect parameter from URL
 * @returns Object with destination path and reason
 */
export function getAuthRedirectDestination(
  profile: Profile | null, 
  redirectParam?: string | URLSearchParams
): AuthRedirectResult {
  // First check if there's a valid redirect parameter
  const redirectUrl = typeof redirectParam === 'string' ? 
    getRedirectFromUrl(redirectParam) : 
    getRedirectFromUrl(redirectParam)
  
  if (redirectUrl) {
    // If redirect is to onboarding, check if user actually needs onboarding
    if (redirectUrl === '/onboarding') {
      if (!profile || isOnboardingRequired(profile)) {
        return {
          destination: '/onboarding',
          reason: 'redirect_param',
          message: 'Continuing with profile setup'
        }
      } else {
        // User doesn't need onboarding, redirect to dashboard instead
        return {
          destination: '/dashboard',
          reason: 'onboarding_completed',
          message: 'Profile already complete, welcome back!'
        }
      }
    }
    
    // For other redirect URLs, only allow if user has completed onboarding
    if (profile && !isOnboardingRequired(profile)) {
      return {
        destination: redirectUrl,
        reason: 'redirect_param',
        message: 'Redirecting to requested page'
      }
    }
  }

  // If no profile exists, user needs to complete onboarding
  if (!profile) {
    return {
      destination: '/onboarding',
      reason: 'no_profile',
      message: 'Please complete your profile setup'
    }
  }

  // Check if onboarding is required (level < 3)
  if (isOnboardingRequired(profile)) {
    return {
      destination: '/onboarding',
      reason: 'onboarding_required',
      message: 'Please complete your profile setup'
    }
  }

  // Onboarding completed, redirect to dashboard
  return {
    destination: '/dashboard',
    reason: 'onboarding_completed',
    message: 'Welcome back!'
  }
}

/**
 * Waits for profile to be loaded and determines redirect destination
 * @param getUserProfile Function that returns current user profile
 * @param maxWaitTime Maximum time to wait for profile (ms)
 * @returns Promise with redirect result
 */
export async function waitForProfileAndGetRedirect(
  getUserProfile: () => Profile | null,
  maxWaitTime: number = 5000
): Promise<AuthRedirectResult> {
  const startTime = Date.now()
  
  // Poll for profile data
  while (Date.now() - startTime < maxWaitTime) {
    const profile = getUserProfile()
    
    if (profile) {
      return getAuthRedirectDestination(profile)
    }
    
    // Wait 100ms before checking again
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Timeout - assume onboarding needed
  return {
    destination: '/onboarding',
    reason: 'no_profile',
    message: 'Profile loading timeout - please complete setup'
  }
}

/**
 * Helper to check if user should be redirected from current page based on profile
 * @param profile User profile
 * @param currentPath Current page path
 * @returns Whether redirect is needed and destination
 */
export function shouldRedirectFromCurrentPage(
  profile: Profile | null,
  currentPath: string
): { shouldRedirect: boolean; destination?: string } {
  const isOnOnboardingPage = currentPath.startsWith('/onboarding')
  const isOnAuthPage = currentPath.startsWith('/login') || 
                      currentPath.startsWith('/auth') || 
                      currentPath.startsWith('/signup')
  
  // Don't redirect if on auth pages
  if (isOnAuthPage) {
    return { shouldRedirect: false }
  }
  
  if (!profile) {
    // No profile - redirect to onboarding if not already there
    return {
      shouldRedirect: !isOnOnboardingPage,
      destination: '/onboarding'
    }
  }
  
  const needsOnboarding = isOnboardingRequired(profile)
  
  if (needsOnboarding && !isOnOnboardingPage) {
    // Needs onboarding but not on onboarding page
    return {
      shouldRedirect: true,
      destination: '/onboarding'
    }
  }
  
  if (!needsOnboarding && isOnOnboardingPage) {
    // Completed onboarding but still on onboarding page
    return {
      shouldRedirect: true,
      destination: '/dashboard'
    }
  }
  
  return { shouldRedirect: false }
}

/**
 * Create auth redirect URL for specific actions on review pages
 * @param currentPath Current page path
 * @param action Action user was trying to perform
 * @returns Login URL with proper redirect back to current page
 */
export function createAuthRedirectUrl(
  currentPath: string, 
  action?: string
): string {
  const loginUrl = new URL('/login', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  
  // Always redirect back to the current page after login
  loginUrl.searchParams.set('redirect', currentPath)
  
  if (action) {
    loginUrl.searchParams.set('action', action)
  }
  
  return loginUrl.href
}

/**
 * Check if the current route is a public route that allows unauthenticated access
 * @param pathname Current pathname
 * @returns Whether the route is public
 */
export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/auth/callback',
    '/api/auth/callback',
    '/api/health',
    '/favicon.ico'
  ]

  const publicPatterns = [
    /^\/_next\//,
    /^\/api\/auth\//,
    /^\/static\//,
    /^\/images\//,
    /^\/coaching-reviews/, // Review pages are public for viewing
  ]

  // Check exact matches
  if (publicRoutes.includes(pathname)) {
    return true
  }

  // Check pattern matches
  return publicPatterns.some(pattern => pattern.test(pathname))
}