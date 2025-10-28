/**
 * Simplified Authentication Session Manager
 * Relies on Supabase's built-in session handling and refreshes tokens on demand.
 */

import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/auth-store'
import { toast } from '@/hooks/use-toast'
import type { Session } from '@supabase/supabase-js'

// Get the browser client (with cookie storage)
const supabase = createClient()

export class AuthSessionManager {
  private static instance: AuthSessionManager
  private refreshPromise: Promise<boolean> | null = null
  private isInitialized = false
  private lastKnownSession: Session | null = null

  private constructor() {
    this.initialize()
    const initialSession = useAuthStore.getState().session
    if (initialSession) {
      this.lastKnownSession = initialSession
    }
  }

  static getInstance(): AuthSessionManager {
    if (!AuthSessionManager.instance) {
      AuthSessionManager.instance = new AuthSessionManager()
    }
    return AuthSessionManager.instance
  }

  /**
   * Initialize listener for auth state changes
   */
  private initialize() {
    if (this.isInitialized || typeof window === 'undefined') {
      return
    }

    supabase.auth.onAuthStateChange((event, session) => {
      const authStore = useAuthStore.getState()
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          if (session) {
            authStore.setAuth(session.user, session)
            this.lastKnownSession = session
          }
          break
        case 'SIGNED_OUT':
          authStore.clearAuth()
          this.lastKnownSession = null
          break
        default:
          break
      }
    })

    this.isInitialized = true
  }

  /**
   * Get the current session from Supabase with corruption recovery.
   * Handles cases where Supabase's internal storage gets corrupted during idle time.
   */
  async getSession() {
    try {
      const authStore = useAuthStore.getState()
      const storeSession = authStore.session

      if (storeSession && this.isSessionValid(storeSession)) {
        this.lastKnownSession = storeSession
        return storeSession
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error('[AUTH-SESSION] Error getting session:', error)
        // If there's an error getting session, try to recover
        return await this.recoverSession()
      }

      if (!session) {
        console.log('[AUTH-SESSION] No session found, checking for corruption...')
        const recovered = await this.recoverSession()
        if (recovered) {
          return recovered
        }

        if (this.lastKnownSession && this.isSessionValid(this.lastKnownSession)) {
          console.warn('[AUTH-SESSION] Using cached session while Supabase recovers lock')
          return this.lastKnownSession
        }

        return null
      }

      // Validate session is not expired
      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at <= now) {
        console.log('[AUTH-SESSION] Session expired, refreshing...')
        const refreshed = await this.refreshSession()
        if (refreshed) {
          // Get the new session after refresh
          const { data: { session: newSession } } = await supabase.auth.getSession()
          if (newSession) {
            this.lastKnownSession = newSession
            return newSession
          }

          if (this.lastKnownSession && this.isSessionValid(this.lastKnownSession)) {
            return this.lastKnownSession
          }
          return null
        }
        return null
      }

      this.lastKnownSession = session
      return session
    } catch (error) {
      console.error('[AUTH-SESSION] Unexpected error getting session:', error)
      const recovered = await this.recoverSession()
      if (recovered) {
        return recovered
      }

      if (this.lastKnownSession && this.isSessionValid(this.lastKnownSession)) {
        console.warn('[AUTH-SESSION] Using cached session after unexpected error')
        return this.lastKnownSession
      }

      return null
    }
  }

  /**
   * Recover from corrupted session storage.
   * This happens when Supabase's internal lock mechanism fails.
   */
  private async recoverSession() {
    try {
      console.log('[AUTH-SESSION] Attempting session recovery...')
      
      // First, try to refresh the session
      const refreshed = await this.refreshSession()
      if (refreshed) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('[AUTH-SESSION] Session recovered successfully')
          this.lastKnownSession = session
          return session
        }

        if (this.lastKnownSession && this.isSessionValid(this.lastKnownSession)) {
          return this.lastKnownSession
        }
      }

      // If refresh fails, the user needs to re-authenticate
      console.log('[AUTH-SESSION] Session recovery failed, user needs to re-authenticate')
      return null
    } catch (error) {
      console.error('[AUTH-SESSION] Session recovery failed:', error)
      return null
    }
  }

  /**
   * Force a session refresh with timeout protection.
   * Uses a lock to prevent multiple concurrent refresh attempts.
   */
  async refreshSession(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.performSessionRefresh()
    }

    const currentPromise = this.refreshPromise

    try {
      return await currentPromise
    } finally {
      if (this.refreshPromise === currentPromise) {
        this.refreshPromise = null
      }
    }
  }

  /**
   * Sign out the user and clear local state.
   */
  /**
   * Validate the current session
   * This is kept for backward compatibility but now simply calls getSession
   */
  async validateSession(): Promise<boolean> {
    const session = await this.getSession()
    return !!session
  }

  private isSessionValid(session: Session | null): boolean {
    if (!session) {
      return false
    }

    if (!session.expires_at) {
      return true
    }

    const now = Math.floor(Date.now() / 1000)
    return session.expires_at > now
  }

  private async performSessionRefresh(): Promise<boolean> {
    const refreshPromise = supabase.auth.refreshSession()
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Refresh timeout')), 10000)
    )

    try {
      const { data, error } = await Promise.race([refreshPromise, timeoutPromise]) as {
        data: { session: Session | null }
        error: { message?: string } | null
      }

      if (error) {
        // console.error('[AUTH-SESSION] Token refresh failed:', error.message)

        if (error.message?.includes('refresh_token_not_found') ||
            error.message?.includes('Invalid refresh token')) {
          await this.signOut()
        } 

        return false
      }

      if (data.session) {
        console.log('[AUTH-SESSION] Session refreshed successfully')
        const authStore = useAuthStore.getState()
        authStore.setAuth(data.session.user, data.session)
        this.lastKnownSession = data.session
        return true
      }

      return false
    } catch (error) {
      console.error('[AUTH-SESSION] Unexpected error during refresh:', error)
      if (error instanceof Error && error.message === 'Refresh timeout') {
        console.error('[AUTH-SESSION] Refresh timed out - storage may be corrupted')
      }
      return false
    }
  }

  async signOut() {
    await supabase.auth.signOut()
    // The onAuthStateChange listener will handle clearing the auth store
    toast({
      title: 'Session Expired',
      description: 'Your session has expired. Please sign in again.',
      variant: 'destructive',
    })

    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
}

export const authSessionManager = AuthSessionManager.getInstance()
