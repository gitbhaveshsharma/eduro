/**
 * API Request Interceptor
 * Automatically handles authentication and token refresh for API calls
 */

import { authSessionManager } from '@/lib/auth-session'
import { useAuthStore } from '@/lib/auth-store'

export class ApiRequestInterceptor {
  private static instance: ApiRequestInterceptor
  private baseUrl: string

  private constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
  }

  static getInstance(): ApiRequestInterceptor {
    if (!ApiRequestInterceptor.instance) {
      ApiRequestInterceptor.instance = new ApiRequestInterceptor()
    }
    return ApiRequestInterceptor.instance
  }

  /**
   * Enhanced fetch with automatic authentication and retry logic
   */
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Get valid session
    const session = await authSessionManager.getSession()

    // Prepare headers
    const headers = new Headers(options.headers)

    // Add authentication header if session exists
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`)
    }

    // Add content type if not specified for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(options.method?.toUpperCase() || 'GET')) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }
    }

    // Make the request
    let response = await fetch(url, {
      ...options,
      headers,
    })

    // If unauthorized, try to refresh token and retry
    if (response.status === 401) {
      console.log('[API] Received 401, attempting token refresh...')

      const refreshSuccess = await authSessionManager.refreshSession()

      if (refreshSuccess) {
        // Get the new session from the store and retry
        const newSession = useAuthStore.getState().session

        if (newSession?.access_token) {
          headers.set('Authorization', `Bearer ${newSession.access_token}`)

          // Retry the original request
          response = await fetch(url, {
            ...options,
            headers,
          })

          console.log('[API] Request retried with new token, status:', response.status)
        }
      } else {
        console.log('[API] Token refresh failed, user may need to re-authenticate')
      }
    }

    return response
  }

  /**
   * GET request with authentication
   */
  async get(url: string, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'GET',
    })
  }

  /**
   * POST request with authentication
   */
  async post(url: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT request with authentication
   */
  async put(url: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PATCH request with authentication
   */
  async patch(url: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE request with authentication
   */
  async delete(url: string, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'DELETE',
    })
  }
}

// Create singleton instance
export const apiClient = ApiRequestInterceptor.getInstance()

/**
 * Enhanced Supabase client wrapper that handles authentication automatically
 */
export class SupabaseRequestWrapper {
  /**
   * Make a Supabase request with automatic session validation and timeout
   */
  static async request<T>(
    requestFn: () => Promise<{ data: T | null; error: any }>,
    timeoutMs: number = 20000 // Reduced from 30s to 20s
  ): Promise<{ data: T | null; error: any; success: boolean }> {
    try {
      // Get current session with corruption recovery
      const session = await authSessionManager.getSession()
      
      if (!session) {
        console.error('[SUPABASE] No valid session available')
        return {
          data: null,
          error: { message: 'Authentication required. Please log in again.' },
          success: false
        }
      }

      // Create timeout promise
      const timeoutPromise = new Promise<{ data: T | null; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
      )

      // Race between request and timeout
      const result = await Promise.race([requestFn(), timeoutPromise])
      
      // If we get an auth error, try refreshing and retry once
      if (result.error && this.isAuthError(result.error)) {
        console.log('[SUPABASE] Auth error detected, attempting refresh...')
        
        const refreshSuccess = await authSessionManager.refreshSession()
        
        if (refreshSuccess) {
          console.log('[SUPABASE] Retrying request after refresh...')
          // Create new timeout for retry
          const retryTimeoutPromise = new Promise<{ data: T | null; error: any }>((_, reject) =>
            setTimeout(() => reject(new Error(`Retry timeout after ${timeoutMs}ms`)), timeoutMs)
          )
          const retryResult = await Promise.race([requestFn(), retryTimeoutPromise])
          return {
            ...retryResult,
            success: !retryResult.error,
          }
        } else {
          console.error('[SUPABASE] Token refresh failed, cannot retry request')
          return {
            data: null,
            error: { message: 'Authentication failed. Please log in again.' },
            success: false,
          }
        }
      }

      return {
        ...result,
        success: !result.error
      }
    } catch (error) {
      console.error('[SUPABASE] Request wrapper error:', error)
      
      // Handle timeout specifically
      if (error instanceof Error && error.message.includes('timeout')) {
        return {
          data: null,
          error: { message: 'Request timed out. Please check your connection and try again.' },
          success: false
        }
      }
      
      return {
        data: null,
        error: error,
        success: false
      }
    }
  }

  /**
   * Make a Supabase request that returns ProfileOperationResult format
   */
  static async profileRequest<T>(
    requestFn: () => Promise<{ data: T | null; error: any }>,
    timeoutMs: number = 10000
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const result = await this.request(requestFn, timeoutMs)
    
    return {
      success: result.success,
      data: result.data || undefined,
      error: result.error?.message || (result.error ? String(result.error) : undefined)
    }
  }

  /**
   * Check if error is authentication related
   */
  private static isAuthError(error: any): boolean {
    if (!error) return false
    
    const message = error.message?.toLowerCase() || ''
    const code = error.code?.toLowerCase() || ''
    
    return (
      message.includes('expired') ||
      message.includes('invalid') ||
      message.includes('unauthorized') ||
      message.includes('jwt') ||
      code.includes('unauthorized') ||
      code.includes('invalid_grant')
    )
  }
}

/**
 * Utility function to wrap Supabase queries with auth and timeout
 */
export function withAuth<T>(requestFn: () => Promise<{ data: T | null; error: any }>, timeoutMs: number = 10000) {
  return SupabaseRequestWrapper.request(requestFn, timeoutMs)
}

/**
 * Utility function to wrap Supabase queries for profile operations
 */
export function withProfileAuth<T>(requestFn: () => Promise<{ data: T | null; error: any }>, timeoutMs: number = 10000) {
  return SupabaseRequestWrapper.profileRequest(requestFn, timeoutMs)
}