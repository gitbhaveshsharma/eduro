/**
 * Authentication Utilities for Middleware
 * Handles JWT validation, session management, and user context
 */

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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
      // Get access token from cookies or Authorization header
      const authCookie = request.cookies.get('supabase-auth-token') // Fixed cookie name
      const authHeader = request.headers.get('authorization')
      
      let accessToken: string | null = null
      
      if (authCookie) {
        accessToken = authCookie.value
      } else if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7)
      }
      
      // Debug logging
      console.log('[AUTH] Cookie found:', !!authCookie)
      console.log('[AUTH] Header found:', !!authHeader)
      console.log('[AUTH] Access token found:', !!accessToken)
      
      if (!accessToken) {
        console.log('[AUTH] No access token, user not authenticated')
        return null
      }

      // Create Supabase client for server-side operations with the access token
      const supabase = createClient(
        this.supabaseUrl,
        this.supabaseAnonKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          },
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      )

      // Get current user from Supabase using the access token
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)

      if (authError) {
        console.log('[AUTH] Supabase auth error:', authError.message)
        return null
      }
      
      if (!user) {
        console.log('[AUTH] No user returned from Supabase')
        return null
      }
      
      console.log('[AUTH] User authenticated:', user.email)

      // Get user profile with role information
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        // User exists but no profile - might be in onboarding
        return {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: UserRole.STUDENT, // Default role
          permissions: this.getRolePermissions(UserRole.STUDENT),
          isOnline: false,
          sessionId: this.extractSessionId(request)
        }
      }

      // Return full user context
      return {
        id: user.id,
        email: user.email || profile.email,
        phone: user.phone || profile.phone,
        role: profile.role as UserRole,
        permissions: this.getRolePermissions(profile.role as UserRole),
        isOnline: profile.is_online || false,
        lastActivity: profile.last_activity ? new Date(profile.last_activity) : undefined,
        sessionId: this.extractSessionId(request)
      }
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
    const sessionCookie = request.cookies.get('supabase-auth-token') // Fixed cookie name
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }
    
    if (sessionCookie) {
      return sessionCookie.value
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
      const supabase = createClient(
        this.supabaseUrl,
        this.supabaseAnonKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      )

      const { data: user, error } = await supabase.auth.admin.getUserById(userId)
      
      if (error || !user) {
        return false
      }

      // Check if email is confirmed
      if (user.user.email && !user.user.email_confirmed_at) {
        return false
      }

      // Check if phone is confirmed
      if (user.user.phone && !user.user.phone_confirmed_at) {
        return false
      }

      return true
    } catch (error) {
      console.error('Error checking user verification:', error)
      return false
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