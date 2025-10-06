/**
 * Enhanced Authentication Session Manager
 * Handles token refresh, session validation, and automatic token renewal
 */

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/auth-store'
import { toast } from '@/hooks/use-toast'

export class AuthSessionManager {
  private static instance: AuthSessionManager
  private refreshTimer: NodeJS.Timeout | null = null
  private isRefreshing = false
  private refreshPromise: Promise<boolean> | null = null

  // Session timeout in milliseconds (default: 15 minutes)
  private readonly SESSION_TIMEOUT = 15 * 60 * 1000
  // Refresh threshold - refresh token when it's 5 minutes before expiry
  private readonly REFRESH_THRESHOLD = 5 * 60 * 1000

  private constructor() {
    this.initializeSessionMonitor()
  }

  static getInstance(): AuthSessionManager {
    if (!AuthSessionManager.instance) {
      AuthSessionManager.instance = new AuthSessionManager()
    }
    return AuthSessionManager.instance
  }

  /**
   * Initialize session monitoring and automatic refresh
   */
  private initializeSessionMonitor() {
    // Check session every minute
    this.refreshTimer = setInterval(() => {
      this.checkAndRefreshSession()
    }, 60000) // 60 seconds

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      const authStore = useAuthStore.getState()

      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            authStore.setAuth(session.user, session)
            this.scheduleNextRefresh(session)
          }
          break

        case 'SIGNED_OUT':
          authStore.clearAuth()
          this.clearRefreshTimer()
          break

        case 'TOKEN_REFRESHED':
          if (session?.user) {
            console.log('[AUTH-SESSION] Token refreshed successfully')
            authStore.setAuth(session.user, session)
            this.scheduleNextRefresh(session)
          }
          break

        case 'USER_UPDATED':
          if (session?.user) {
            authStore.setAuth(session.user, session)
          }
          break

        default:
          break
      }
    })

    // Handle page visibility change to refresh session
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.checkAndRefreshSession()
        }
      })
    }
  }

  /**
   * Check if session needs refresh and refresh if necessary
   */
  private async checkAndRefreshSession(): Promise<boolean> {
    try {
      const { session } = useAuthStore.getState()
      
      if (!session) {
        return false
      }

      // Check if token is expired or close to expiring
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
      const now = Date.now()
      const timeUntilExpiry = expiresAt - now

    //   console.log('[AUTH-SESSION] Time until expiry:', timeUntilExpiry / 1000 / 60, 'minutes')

      // If token is expired or will expire within the threshold, refresh it
      if (timeUntilExpiry <= this.REFRESH_THRESHOLD) {
        // console.log('[AUTH-SESSION] Token needs refresh, attempting refresh...')
        return await this.refreshSession()
      }

      return true
    } catch (error) {
      console.error('[AUTH-SESSION] Error checking session:', error)
      return false
    }
  }

  /**
   * Refresh the current session
   */
  public async refreshSession(): Promise<boolean> {
    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true
    
    this.refreshPromise = this.performRefresh()
    
    try {
      const result = await this.refreshPromise
      return result
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performRefresh(): Promise<boolean> {
    try {
      console.log('[AUTH-SESSION] Attempting to refresh session...')
      
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error('[AUTH-SESSION] Token refresh failed:', error.message)
        
        // If refresh fails, sign out the user
        if (error.message.includes('refresh_token_not_found') || 
            error.message.includes('Invalid refresh token')) {
          console.log('[AUTH-SESSION] Invalid refresh token, signing out user')
          await this.signOutUser()
          return false
        }
        
        return false
      }

      if (data.session) {
        console.log('[AUTH-SESSION] Session refreshed successfully')
        const authStore = useAuthStore.getState()
        authStore.setAuth(data.session.user, data.session)
        this.scheduleNextRefresh(data.session)
        return true
      }

      return false
    } catch (error) {
      console.error('[AUTH-SESSION] Unexpected error during refresh:', error)
      return false
    }
  }

  /**
   * Schedule the next token refresh
   */
  private scheduleNextRefresh(session: any) {
    if (!session.expires_at) return

    const expiresAt = session.expires_at * 1000
    const now = Date.now()
    const refreshTime = expiresAt - this.REFRESH_THRESHOLD

    // Don't schedule if refresh time is in the past
    if (refreshTime <= now) return

    const timeUntilRefresh = refreshTime - now
    // console.log('[AUTH-SESSION] Next refresh scheduled in:', timeUntilRefresh / 1000 / 60, 'minutes')

    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    // Schedule refresh
    this.refreshTimer = setTimeout(() => {
      this.refreshSession()
    }, timeUntilRefresh)
  }

  /**
   * Sign out user when session can't be refreshed
   */
  private async signOutUser() {
    try {
      const authStore = useAuthStore.getState()
      await authStore.signOut()
      
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please sign in again.",
        variant: "destructive"
      })

      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('[AUTH-SESSION] Error signing out user:', error)
    }
  }

  /**
   * Validate current session
   */
  public async validateSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('[AUTH-SESSION] Session validation error:', error)
        return false
      }

      if (!session) {
        console.log('[AUTH-SESSION] No active session found')
        return false
      }

      // Check if session is expired
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
      const now = Date.now()

      if (expiresAt <= now) {
        console.log('[AUTH-SESSION] Session expired, attempting refresh')
        return await this.refreshSession()
      }

      // Update auth store with current session
      const authStore = useAuthStore.getState()
      authStore.setAuth(session.user, session)

      return true
    } catch (error) {
      console.error('[AUTH-SESSION] Unexpected error validating session:', error)
      return false
    }
  }

  /**
   * Get current session with automatic refresh if needed
   */
  public async getValidSession() {
    const isValid = await this.validateSession()
    
    if (!isValid) {
      return null
    }

    return useAuthStore.getState().session
  }

  /**
   * Clear refresh timer
   */
  private clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  /**
   * Cleanup when shutting down
   */
  public cleanup() {
    this.clearRefreshTimer()
    this.isRefreshing = false
    this.refreshPromise = null
  }

  /**
   * Force refresh session (useful for manual refresh)
   */
  public async forceRefresh(): Promise<boolean> {
    return await this.refreshSession()
  }

  /**
   * Check if user is authenticated with valid session
   */
  public async isAuthenticated(): Promise<boolean> {
    return await this.validateSession()
  }
}

// Create and export singleton instance
export const authSessionManager = AuthSessionManager.getInstance()

// Cleanup on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    authSessionManager.cleanup()
  })
}