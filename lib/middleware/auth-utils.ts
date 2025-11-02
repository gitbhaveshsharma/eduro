/**
 * Authentication Utilities for Middleware
 * Handles JWT validation, session management, and user context
 */

import { NextRequest } from 'next/server'
import { UserContext, UserRole, Permission } from './types'
import { CryptoUtils } from './security-utils'

/**
 * Authentication handler for Supabase
 */
export class AuthHandler {
  private static supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  private static supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  /**
   * Extract and validate user from request
   */
  static async validateUser(request: NextRequest): Promise<UserContext | null> {
    try {
      // CRITICAL: Check if Supabase middleware already authenticated the user
      // This header is set by supabase-middleware.ts after successful auth
      const isAuthenticated = request.headers.get('x-user-authenticated')
      const userId = request.headers.get('x-user-id')
      const email = request.headers.get('x-user-email')
      const roleHeader = request.headers.get('x-user-role')

      if (isAuthenticated === 'true' && userId) {
        console.log('[AUTH] User authenticated via Supabase middleware:', userId)

        // Use role from header (set by supabase-middleware) or fetch from database as fallback
        let userRole: UserRole = UserRole.STUDENT // Default fallback

        if (roleHeader && Object.values(UserRole).includes(roleHeader as UserRole)) {
          userRole = roleHeader as UserRole
          console.log('[AUTH] Using user role from header:', userRole)
        } else {
          // Fallback: Fetch user role from database if not in header
          console.warn('[AUTH] Role not in header, fetching from database...')
          try {
            const supabaseUrl = this.supabaseUrl
            const supabaseAnonKey = this.supabaseAnonKey

            const profileUrl = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role`
            const response = await fetch(profileUrl, {
              method: 'GET',
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
              },
            })

            if (response.ok) {
              const profiles = await response.json()
              if (profiles && profiles.length > 0 && profiles[0].role) {
                userRole = profiles[0].role as UserRole
                console.log('[AUTH] Fetched user role from database:', userRole)
              } else {
                console.warn('[AUTH] No profile found for user, using default role:', UserRole.STUDENT)
              }
            } else {
              console.error('[AUTH] Failed to fetch user profile:', response.status, response.statusText)
            }
          } catch (profileError) {
            console.error('[AUTH] Error fetching user profile:', profileError)
            // Continue with default role
          }
        }

        return {
          id: userId,
          email: email || undefined,
          phone: undefined,
          role: userRole,
          permissions: this.getRolePermissions(userRole),
          isOnline: false,
          lastActivity: new Date(),
          sessionId: userId
        }
      }

      console.log('[AUTH] No authenticated user found in headers')
      return null
    } catch (error) {
      console.error('Auth validation error:', error)
      return null
    }
  }

  /**
   * Get permissions for a user role
   */
  static getRolePermissions(role: UserRole): Permission[] {
    const rolePermissions: Record<UserRole, Permission[]> = {
      [UserRole.STUDENT]: [Permission.READ],
      [UserRole.TEACHER]: [Permission.READ, Permission.WRITE],
      [UserRole.COACH]: [Permission.READ, Permission.WRITE],
      [UserRole.ADMIN]: [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN],
      [UserRole.SUPER_ADMIN]: [
        Permission.READ,
        Permission.WRITE,
        Permission.DELETE,
        Permission.ADMIN,
        Permission.SUPER_ADMIN
      ]
    }

    return rolePermissions[role] || [Permission.READ]
  }

  /**
   * Check if user has required role
   */
  static hasRole(user: UserContext, requiredRoles: UserRole[]): boolean {
    return requiredRoles.includes(user.role)
  }

  /**
   * Check if user has required permission
   */
  static hasPermission(user: UserContext, requiredPermissions: Permission[]): boolean {
    return requiredPermissions.some(permission => user.permissions.includes(permission))
  }

  /**
   * Check if user has any of the required permissions
   */
  static hasAnyPermission(user: UserContext, permissions: Permission[]): boolean {
    return permissions.some(permission => user.permissions.includes(permission))
  }

  /**
   * Check if user has all required permissions
   */
  static hasAllPermissions(user: UserContext, permissions: Permission[]): boolean {
    return permissions.every(permission => user.permissions.includes(permission))
  }

  /**
   * Extract session ID from request
   */
  private static extractSessionId(request: NextRequest): string | undefined {
    // Try to get session ID from various sources
    const authHeader = request.headers.get('authorization')
    const sessionCookie = request.cookies.get('sb-' + this.supabaseUrl.split('//')[1].split('.')[0] + '-auth-token') ||
      request.cookies.get('supabase-auth-token') ||
      request.cookies.get('sb-auth-token')

    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }

    if (sessionCookie) {
      try {
        // Try parsing as JSON first (Supabase's format)
        const sessionData = JSON.parse(sessionCookie.value)
        return sessionData.access_token || sessionCookie.value
      } catch (e) {
        // Not JSON, return as is
        return sessionCookie.value
      }
    }

    return undefined
  }

  /**
   * Check if session is expired
   */
  static isSessionExpired(user: UserContext, sessionTimeout: number): boolean {
    if (!user.lastActivity) {
      return false // No last activity recorded, assume valid
    }

    const now = new Date()
    const sessionExpiry = new Date(user.lastActivity.getTime() + sessionTimeout * 1000)

    return now > sessionExpiry
  }

  /**
   * Check if session needs refresh
   */
  static shouldRefreshSession(user: UserContext, refreshThreshold: number): boolean {
    if (!user.lastActivity) {
      return false
    }

    const now = new Date()
    const refreshTime = new Date(user.lastActivity.getTime() + refreshThreshold * 1000)

    return now > refreshTime
  }

  /**
   * Validate API key
   */
  static validateApiKey(request: NextRequest, validKeys: string[]): boolean {
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')

    if (!apiKey) {
      return false
    }

    return validKeys.includes(apiKey)
  }

  /**
   * Generate and validate CSRF tokens
   */
  static generateCSRFToken(): string {
    return CryptoUtils.generateCSRFToken()
  }

  /**
   * Validate CSRF token from request
   */
  static validateCSRFToken(request: NextRequest, expectedToken: string): boolean {
    const token = request.headers.get('x-csrf-token') ||
      request.headers.get('csrf-token') ||
      request.nextUrl.searchParams.get('csrf_token')

    if (!token) {
      return false
    }

    return CryptoUtils.verifyCSRFToken(token, expectedToken)
  }

  /**
   * Check if route requires authentication
   */
  static routeRequiresAuth(pathname: string): boolean {
    const publicRoutes = [
      '/',
      '/login',
      '/auth/callback',
      '/api/auth/callback',
      '/api/health',
      '/favicon.ico'
    ]

    const publicPatterns = [
      /^\/_next\//,
      /^\/api\/auth\//,
      /^\/static\//,
      /^\/images\//
    ]

    // Check exact matches
    if (publicRoutes.includes(pathname)) {
      return false
    }

    // Check pattern matches
    if (publicPatterns.some(pattern => pattern.test(pathname))) {
      return false
    }

    return true
  }

  /**
   * Get redirect URL for unauthorized users
   */
  static getRedirectUrl(request: NextRequest, defaultRedirect: string = '/login'): string {
    const pathname = request.nextUrl.pathname
    const searchParams = request.nextUrl.searchParams.toString()

    // Don't redirect API routes
    if (pathname.startsWith('/api/')) {
      return defaultRedirect
    }

    // Don't create recursive redirects to login page
    if (pathname === '/login' || pathname.startsWith('/auth/')) {
      return defaultRedirect
    }

    // Build redirect URL with return path
    const returnUrl = pathname + (searchParams ? `?${searchParams}` : '')
    const redirectUrl = new URL(defaultRedirect, request.nextUrl.origin)
    redirectUrl.searchParams.set('redirect', returnUrl)

    return redirectUrl.href // Use href instead of toString()
  }

  /**
   * Check if user is verified (email/phone confirmed)
   */
  static async isUserVerified(userId: string): Promise<boolean> {
    try {
      // Avoid using supabase-js in middleware (Edge runtime incompatible).
      // If an ADMIN service key is available, we could call the Supabase Admin
      // REST endpoint here. For safety during build and to keep middleware
      // compatible with Edge, return false when admin key is not configured.
      const adminKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ADMIN_KEY
      if (!adminKey) {
        // Can't verify without admin privileges; assume not verified to be safe.
        return false
      }

      // If adminKey is provided, perform a REST call to Supabase Admin API.
      // Note: This uses fetch which is available in Edge.
      const url = `${this.supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users/${encodeURIComponent(userId)}`
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminKey}`,
          apikey: adminKey,
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) return false
      const user = await res.json()

      if (!user) return false
      if (user.email && !user.email_confirmed_at) return false
      if (user.phone && !user.phone_confirmed_at) return false
      return true
    } catch (error) {
      console.error('Error checking user verification:', error)
      return false
    }
  }

  /**
   * Decode JWT payload without verifying signature. Edge-safe, no Node APIs.
   */
  private static decodeJwtPayload(token: string | null): any | null {
    if (!token) return null
    try {
      const parts = token.split('.')
      if (parts.length < 2) return null
      const payload = parts[1]
      // Base64url decode
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
      const decoded = atob(padded)
      return JSON.parse(decoded)
    } catch (e) {
      return null
    }
  }

  /**
   * Log authentication events
   */
  static logAuthEvent(
    userId: string | undefined,
    event: 'login' | 'logout' | 'failed_login' | 'token_refresh',
    ip: string,
    userAgent: string,
    details?: Record<string, any>
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      event,
      ip,
      userAgent,
      details: details || {}
    }

    // In production, send to logging service
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth Event:', logEntry)
    }
  }
}

/**
 * Role hierarchy checker
 */
export class RoleHierarchy {
  private static hierarchy = {
    [UserRole.STUDENT]: 1,
    [UserRole.TEACHER]: 2,
    [UserRole.COACH]: 2,
    [UserRole.ADMIN]: 3,
    [UserRole.SUPER_ADMIN]: 4
  }

  /**
   * Check if one role has higher or equal authority than another
   */
  static hasAuthorityOver(userRole: UserRole, targetRole: UserRole): boolean {
    return this.hierarchy[userRole] >= this.hierarchy[targetRole]
  }

  /**
   * Get all roles that a user can manage
   */
  static getManageableRoles(userRole: UserRole): UserRole[] {
    const userLevel = this.hierarchy[userRole]
    return Object.entries(this.hierarchy)
      .filter(([_, level]) => level <= userLevel)
      .map(([role, _]) => role as UserRole)
  }

  /**
   * Check if user can perform action on target user
   */
  static canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
    // Super admin can manage anyone
    if (managerRole === UserRole.SUPER_ADMIN) {
      return true
    }

    // Admin can manage everyone except super admin
    if (managerRole === UserRole.ADMIN && targetRole !== UserRole.SUPER_ADMIN) {
      return true
    }

    // Teachers and coaches can manage students
    if ((managerRole === UserRole.TEACHER || managerRole === UserRole.COACH) &&
      targetRole === UserRole.STUDENT) {
      return true
    }

    // Users can manage themselves
    return managerRole === targetRole
  }
}

/**
 * Session management utilities
 */
export class SessionManager {
  private static activeSessions = new Map<string, UserContext>()

  /**
   * Track active session
   */
  static trackSession(sessionId: string, user: UserContext): void {
    this.activeSessions.set(sessionId, {
      ...user,
      lastActivity: new Date()
    })
  }

  /**
   * Get active session
   */
  static getSession(sessionId: string): UserContext | undefined {
    return this.activeSessions.get(sessionId)
  }

  /**
   * Remove session
   */
  static removeSession(sessionId: string): void {
    this.activeSessions.delete(sessionId)
  }

  /**
   * Clean up expired sessions
   */
  static cleanupExpiredSessions(sessionTimeout: number): void {
    const now = new Date()

    for (const [sessionId, user] of this.activeSessions.entries()) {
      if (user.lastActivity) {
        const expiryTime = new Date(user.lastActivity.getTime() + sessionTimeout * 1000)
        if (now > expiryTime) {
          this.activeSessions.delete(sessionId)
        }
      }
    }
  }

  /**
   * Get all active sessions for a user
   */
  static getUserSessions(userId: string): string[] {
    const sessions: string[] = []

    for (const [sessionId, user] of this.activeSessions.entries()) {
      if (user.id === userId) {
        sessions.push(sessionId)
      }
    }

    return sessions
  }

  /**
   * Terminate all sessions for a user
   */
  static terminateUserSessions(userId: string): void {
    for (const [sessionId, user] of this.activeSessions.entries()) {
      if (user.id === userId) {
        this.activeSessions.delete(sessionId)
      }
    }
  }
}