/**
 * Authentication Guard Hook
 * 
 * Provides utilities for handling authentication requirements
 * and redirects in client components
 */

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { createAuthRedirectUrl } from '@/lib/utils/auth-redirect';
import { showErrorToast } from '@/lib/toast';

export interface AuthGuardConfig {
  /** Custom redirect delay in milliseconds (default: 1000) */
  redirectDelay?: number;
  /** Custom error message prefix (default: "Please log in to") */
  errorPrefix?: string;
  /** Whether to show toast message (default: true) */
  showToast?: boolean;
}

export function useAuthGuard(config: AuthGuardConfig = {}) {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  
  const {
    redirectDelay = 1000,
    errorPrefix = 'Please log in to',
    showToast = true
  } = config;

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = (): boolean => {
    return !!user;
  };

  /**
   * Get current user ID
   */
  const getCurrentUserId = (): string | undefined => {
    return user?.id;
  };

  /**
   * Get current user role (if available on profile or user)
   */
  const getCurrentUserRole = (): string | undefined => {
    // Prefer profile.role if available, otherwise fallback to user.role
    // Role values in the system may be short codes (e.g. 'S','T','C') or full text.
    return (profile as any)?.role || (user as any)?.role;
  };

  /**
   * Handle authentication requirement with redirect
   * @param action Action the user was trying to perform
   * @param customPath Custom redirect path (default: current path)
   */
  const requireAuth = (action: string, customPath?: string): boolean => {
    if (isAuthenticated()) {
      return true;
    }

    const currentPath = customPath || (typeof window !== 'undefined' ? window.location.pathname : '/');
    const redirectUrl = createAuthRedirectUrl(currentPath, action);
    
    if (showToast) {
      showErrorToast(`${errorPrefix} ${action}`);
    }
    
    // Redirect after a short delay to show the toast
    setTimeout(() => {
      router.push(redirectUrl);
    }, redirectDelay);

    return false;
  };

  /**
   * Execute a function only if user is authenticated
   * @param action Action description for error message
   * @param callback Function to execute if authenticated
   * @param customPath Custom redirect path
   */
  const withAuth = <T extends any[], R>(
    action: string,
    callback: (...args: T) => R,
    customPath?: string
  ) => {
    return (...args: T): R | void => {
      if (requireAuth(action, customPath)) {
        return callback(...args);
      }
    };
  };

  /**
   * Create an auth-protected event handler
   * @param action Action description for error message
   * @param handler Event handler function
   * @param customPath Custom redirect path
   */
  const createAuthHandler = <T extends Event>(
    action: string,
    handler: (event: T) => void,
    customPath?: string
  ) => {
    return (event: T) => {
      if (requireAuth(action, customPath)) {
        handler(event);
      }
    };
  };

  /**
   * Create auth-protected async function
   * @param action Action description for error message
   * @param asyncFn Async function to execute
   * @param customPath Custom redirect path
   */
  const createAuthAsyncHandler = <T extends any[], R>(
    action: string,
    asyncFn: (...args: T) => Promise<R>,
    customPath?: string
  ) => {
    return async (...args: T): Promise<R | void> => {
      if (requireAuth(action, customPath)) {
        return await asyncFn(...args);
      }
    };
  };

  /**
   * Check if user can perform an action (boolean check without redirect)
   * @param requireProfile Whether profile is also required
   */
  const canPerformAction = (requireProfile: boolean = false): boolean => {
    if (!user) return false;
    if (requireProfile && !profile) return false;
    return true;
  };

  /**
   * Get auth status with detailed information
   */
  const getAuthStatus = () => {
    return {
      isAuthenticated: !!user,
      hasProfile: !!profile,
      userId: user?.id,
      userEmail: user?.email,
      profileComplete: profile && profile.level >= 3
    };
  };

  return {
    // Basic checks
    isAuthenticated,
    getCurrentUserId,
    getCurrentUserRole,
    canPerformAction,
    getAuthStatus,
    
    // Auth requirement with redirect
    requireAuth,
    
    // Higher-order functions
    withAuth,
    createAuthHandler,
    createAuthAsyncHandler,
    
    // Raw user data
    user,
    profile
  };
}

/**
 * Simple auth check hook for components that just need to check auth status
 */
export function useAuth() {
  const { user, profile } = useAuthStore();
  
  return {
    user,
    profile,
    isAuthenticated: !!user,
    userId: user?.id,
    userRole: (profile as any)?.role || (user as any)?.role,
    userEmail: user?.email,
    hasProfile: !!profile,
    profileComplete: profile && profile.level >= 3
  };
}