/**
 * Route Protection System
 * Comprehensive route protection based on authentication, authorization, and custom rules
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  MiddlewareContext, 
  RouteProtection, 
  SecurityLevel, 
  MiddlewareResult,
} from './types'
import { AuthHandler } from './auth-utils'
import { 
  RateLimiter, 
  RequestValidator, 
  IPUtils, 
  SecurityEventTracker,
} from './security-utils'
import { Logger, MetricsCollector } from './monitoring'

/**
 * Main route protection handler
 */
export class RouteProtector {
  /**
   * Apply route protection to a request
   */
  static async protect(context: MiddlewareContext): Promise<MiddlewareResult> {
    const { request, config } = context
    const pathname = request.nextUrl.pathname

    try {
      // Get route-specific protection rules
      const routeConfig = this.getRouteConfig(pathname, config.routes)
      
      if (!routeConfig) {
        // No specific rules, apply default protection
        return this.applyDefaultProtection(context)
      }

      Logger.debug(`Applying route protection for ${pathname}`, {
        securityLevel: routeConfig.securityLevel,
        allowedRoles: routeConfig.allowedRoles,
        requiredPermissions: routeConfig.requiredPermissions
      }, context)

      // Apply protection checks in order of importance
      const steps = [
        () => this.checkBasicValidation(context, routeConfig),
        () => this.checkIPRestrictions(context, routeConfig),
        () => this.checkMethodRestrictions(context, routeConfig),
        () => this.checkRequestSize(context, routeConfig),
        () => this.checkRateLimit(context, routeConfig),
        () => this.checkAuthentication(context, routeConfig),
        () => this.checkAuthorization(context, routeConfig),
        () => this.checkCSRF(context, routeConfig),
        () => this.checkAPIKey(context, routeConfig),
        () => this.checkCustomValidator(context, routeConfig),
        () => this.sanitizeRequest(context, routeConfig)
      ]

      for (const step of steps) {
        const result = await step()
        if (!result.shouldContinue) {
          return result
        }
        
        // Merge any context updates
        if (result.context) {
          Object.assign(context, result.context)
        }
      }

      Logger.debug(`Route protection passed for ${pathname}`, {}, context)
      return { shouldContinue: true }

    } catch (error) {
      Logger.error('Route protection error', error as Error, {}, context)
      MetricsCollector.recordSecurityEvent('MALFORMED_REQUEST' as any)
      
      return {
        shouldContinue: false,
        response: NextResponse.json(
          { error: 'Internal security error' },
          { status: 500 }
        )
      }
    }
  }

  /**
   * Get route configuration for a pathname
   */
  private static getRouteConfig(pathname: string, routes: Record<string, RouteProtection>): RouteProtection | null {
    // First try exact match
    if (routes[pathname]) {
      return routes[pathname]
    }

    // Then try pattern matching
    for (const [pattern, config] of Object.entries(routes)) {
      if (this.matchesPattern(pathname, pattern)) {
        return config
      }
    }

    return null
  }

  /**
   * Check if pathname matches a pattern
   */
  private static matchesPattern(pathname: string, pattern: string): boolean {
    if (pattern.includes('*')) {
      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\//g, '\\/')
      
      const regex = new RegExp(`^${regexPattern}$`)
      return regex.test(pathname)
    }

    return pathname === pattern
  }

  /**
   * Apply default protection for routes without specific config
   */
  private static async applyDefaultProtection(context: MiddlewareContext): Promise<MiddlewareResult> {
    const { request } = context
    const pathname = request.nextUrl.pathname

    // Apply basic rate limiting to all routes
    const rateLimitResult = await this.checkRateLimit(context, {
      securityLevel: SecurityLevel.PUBLIC,
      rateLimiting: context.config.rateLimiting.global
    })

    if (!rateLimitResult.shouldContinue) {
      return rateLimitResult
    }

    // Check if route requires authentication by default
    if (AuthHandler.routeRequiresAuth(pathname)) {
      return this.checkAuthentication(context, {
        securityLevel: SecurityLevel.AUTHENTICATED
      })
    }

    return { shouldContinue: true }
  }

  /**
   * Check basic request validation
   */
  private static async checkBasicValidation(
    context: MiddlewareContext, 
    config: RouteProtection
  ): Promise<MiddlewareResult> {
    const { request } = context

    // Check for suspicious requests
    if (RequestValidator.isSuspiciousRequest(request)) {
      Logger.warn('Suspicious request detected', {
        url: request.nextUrl.href,
        userAgent: request.headers.get('user-agent')
      }, context)

      SecurityEventTracker.recordEvent({
        type: 'SUSPICIOUS_ACTIVITY' as any,
        timestamp: new Date(),
        ip: context.requestContext.ip,
        userAgent: context.requestContext.userAgent,
        userId: context.user?.id,
        route: request.nextUrl.pathname,
        details: { reason: 'Suspicious patterns detected' },
        severity: 'medium'
      })

      MetricsCollector.recordSecurityEvent('SUSPICIOUS_ACTIVITY' as any)

      return {
        shouldContinue: false,
        response: NextResponse.json(
          { error: 'Request rejected' },
          { status: 400 }
        )
      }
    }

    return { shouldContinue: true }
  }

  /**
   * Check IP restrictions
   */
  private static async checkIPRestrictions(
    context: MiddlewareContext, 
    config: RouteProtection
  ): Promise<MiddlewareResult> {
    const { requestContext } = context
    const ip = requestContext.ip

    // Check IP blacklist
    if (config.ipBlacklist && config.ipBlacklist.some(blockedIP => IPUtils.isIPInRange(ip, blockedIP))) {
      Logger.warn('Request from blacklisted IP', { ip }, context)
      
      SecurityEventTracker.recordEvent({
        type: 'BLOCKED_IP' as any,
        timestamp: new Date(),
        ip,
        userAgent: requestContext.userAgent,
        userId: context.user?.id,
        route: context.request.nextUrl.pathname,
        details: { reason: 'IP blacklisted' },
        severity: 'high'
      })

      MetricsCollector.recordSecurityEvent('BLOCKED_IP' as any)

      return {
        shouldContinue: false,
        response: NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Check IP whitelist (if configured)
    if (config.ipWhitelist && !config.ipWhitelist.some(allowedIP => IPUtils.isIPInRange(ip, allowedIP))) {
      Logger.warn('Request from non-whitelisted IP', { ip }, context)
      
      return {
        shouldContinue: false,
        response: NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Check if IP is marked as suspicious
    if (SecurityEventTracker.isSuspiciousIP(ip)) {
      Logger.warn('Request from suspicious IP', { ip }, context)
      
      return {
        shouldContinue: false,
        response: NextResponse.json(
          { error: 'Access temporarily restricted' },
          { status: 429 }
        )
      }
    }

    return { shouldContinue: true }
  }

  /**
   * Check HTTP method restrictions
   */
  private static async checkMethodRestrictions(
    context: MiddlewareContext, 
    config: RouteProtection
  ): Promise<MiddlewareResult> {
    const { request } = context

    if (config.allowedMethods && !RequestValidator.validateMethod(request, config.allowedMethods)) {
      Logger.warn('Method not allowed', { 
        method: request.method, 
        allowedMethods: config.allowedMethods 
      }, context)

      return {
        shouldContinue: false,
        response: NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        )
      }
    }

    return { shouldContinue: true }
  }

  /**
   * Check request size limits
   */
  private static async checkRequestSize(
    context: MiddlewareContext, 
    config: RouteProtection
  ): Promise<MiddlewareResult> {
    const { request } = context
    const maxSize = config.maxRequestSize || context.config.security.maxRequestSize

    if (!RequestValidator.validateRequestSize(request, maxSize)) {
      Logger.warn('Request size exceeds limit', { 
        contentLength: request.headers.get('content-length'),
        maxSize 
      }, context)

      return {
        shouldContinue: false,
        response: NextResponse.json(
          { error: 'Request too large' },
          { status: 413 }
        )
      }
    }

    return { shouldContinue: true }
  }

  /**
   * Check rate limiting
   */
  private static async checkRateLimit(
    context: MiddlewareContext, 
    config: RouteProtection
  ): Promise<MiddlewareResult> {
    if (!context.config.rateLimiting.enabled || !config.rateLimiting) {
      return { shouldContinue: true }
    }

    const key = RateLimiter.generateKey(context, 'route')
    const rateLimitState = RateLimiter.isRateLimited(key, config.rateLimiting)

    if (rateLimitState.isLimited) {
      Logger.warn('Rate limit exceeded', { 
        key, 
        requests: rateLimitState.requests,
        limit: config.rateLimiting.requests 
      }, context)

      SecurityEventTracker.recordEvent({
        type: 'RATE_LIMIT_EXCEEDED' as any,
        timestamp: new Date(),
        ip: context.requestContext.ip,
        userAgent: context.requestContext.userAgent,
        userId: context.user?.id,
        route: context.request.nextUrl.pathname,
        details: { requests: rateLimitState.requests, limit: config.rateLimiting.requests },
        severity: 'medium'
      })

      MetricsCollector.recordSecurityEvent('RATE_LIMIT_EXCEEDED' as any)

      const response = NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )

      // Add rate limit headers
      response.headers.set('X-Rate-Limit-Remaining', 
        Math.max(0, config.rateLimiting.requests - rateLimitState.requests).toString())
      response.headers.set('X-Rate-Limit-Reset', rateLimitState.resetTime.toString())

      return {
        shouldContinue: false,
        response
      }
    }

    // Store rate limit state in context
    return {
      shouldContinue: true,
      context: { rateLimitState }
    }
  }

  /**
   * Check authentication requirements
   */
  private static async checkAuthentication(
    context: MiddlewareContext, 
    config: RouteProtection
  ): Promise<MiddlewareResult> {
    if (config.securityLevel === SecurityLevel.PUBLIC) {
      return { shouldContinue: true }
    }

    if (!context.user) {
      Logger.info('Authentication required but user not authenticated', {}, context)
      MetricsCollector.recordAuthEvent('failure')

      // For API routes, return JSON error
      if (context.request.nextUrl.pathname.startsWith('/api/')) {
        return {
          shouldContinue: false,
          response: NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }
      }

      // For web routes, redirect to login
      const redirectUrl = AuthHandler.getRedirectUrl(context.request, context.config.errorPages.unauthorized)
      return {
        shouldContinue: false,
        response: NextResponse.redirect(new URL(redirectUrl, context.request.nextUrl.origin))
      }
    }



    // Check session expiry
    if (AuthHandler.isSessionExpired(context.user, context.config.auth.sessionTimeout)) {
      Logger.info('Session expired', { userId: context.user.id }, context)
      MetricsCollector.recordAuthEvent('failure')

      return {
        shouldContinue: false,
        response: NextResponse.json(
          { error: 'Session expired' },
          { status: 401 }
        )
      }
    }

    MetricsCollector.recordAuthEvent('success')
    return { shouldContinue: true }
  }

  /**
   * Check authorization (roles and permissions)
   */
  private static async checkAuthorization(
    context: MiddlewareContext, 
    config: RouteProtection
  ): Promise<MiddlewareResult> {
    if (!context.user || config.securityLevel === SecurityLevel.PUBLIC || config.securityLevel === SecurityLevel.AUTHENTICATED) {
      return { shouldContinue: true }
    }

    // Check role-based access
    if (config.securityLevel === SecurityLevel.ROLE_BASED && config.allowedRoles) {
      if (!AuthHandler.hasRole(context.user, config.allowedRoles)) {
        Logger.warn('Insufficient role permissions', {
          userRole: context.user.role,
          requiredRoles: config.allowedRoles
        }, context)

        return {
          shouldContinue: false,
          response: NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          )
        }
      }
    }

    // Check permission-based access
    if (config.securityLevel === SecurityLevel.PERMISSION_BASED && config.requiredPermissions) {
      if (!AuthHandler.hasPermission(context.user, config.requiredPermissions)) {
        Logger.warn('Insufficient permissions', {
          userPermissions: context.user.permissions,
          requiredPermissions: config.requiredPermissions
        }, context)

        return {
          shouldContinue: false,
          response: NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          )
        }
      }
    }

    return { shouldContinue: true }
  }

  /**
   * Check CSRF protection
   */
  private static async checkCSRF(
    context: MiddlewareContext, 
    config: RouteProtection
  ): Promise<MiddlewareResult> {
    const { request } = context
    const csrfConfig = context.config.security.csrf

    if (!config.requiresCSRF || !csrfConfig) {
      return { shouldContinue: true }
    }

    // Skip CSRF check for safe methods
    if (csrfConfig.ignoredMethods.includes(request.method)) {
      return { shouldContinue: true }
    }

    // Get CSRF token from cookie
    const csrfToken = request.cookies.get(csrfConfig.cookieName)?.value

    if (!csrfToken) {
      Logger.warn('CSRF token missing', {}, context)
      MetricsCollector.recordSecurityEvent('CSRF_VIOLATION' as any)

      return {
        shouldContinue: false,
        response: NextResponse.json(
          { error: 'CSRF token required' },
          { status: 403 }
        )
      }
    }

    // Validate CSRF token
    if (!AuthHandler.validateCSRFToken(request, csrfToken)) {
      Logger.warn('Invalid CSRF token', {}, context)
      
      SecurityEventTracker.recordEvent({
        type: 'CSRF_VIOLATION' as any,
        timestamp: new Date(),
        ip: context.requestContext.ip,
        userAgent: context.requestContext.userAgent,
        userId: context.user?.id,
        route: request.nextUrl.pathname,
        details: { reason: 'Invalid CSRF token' },
        severity: 'high'
      })

      MetricsCollector.recordSecurityEvent('CSRF_VIOLATION' as any)

      return {
        shouldContinue: false,
        response: NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        )
      }
    }

    return { shouldContinue: true }
  }

  /**
   * Check API key authentication
   */
  private static async checkAPIKey(
    context: MiddlewareContext, 
    config: RouteProtection
  ): Promise<MiddlewareResult> {
    const { request } = context
    const apiKeyConfig = context.config.security.apiKeys

    if (!config.requiresApiKey || !apiKeyConfig) {
      return { shouldContinue: true }
    }

    if (!AuthHandler.validateApiKey(request, apiKeyConfig.validKeys)) {
      Logger.warn('Invalid API key', {}, context)
      
      SecurityEventTracker.recordEvent({
        type: 'INVALID_API_KEY' as any,
        timestamp: new Date(),
        ip: context.requestContext.ip,
        userAgent: context.requestContext.userAgent,
        userId: context.user?.id,
        route: request.nextUrl.pathname,
        details: { reason: 'Invalid or missing API key' },
        severity: 'medium'
      })

      MetricsCollector.recordSecurityEvent('INVALID_API_KEY' as any)

      return {
        shouldContinue: false,
        response: NextResponse.json(
          { error: 'Valid API key required' },
          { status: 401 }
        )
      }
    }

    return { shouldContinue: true }
  }

  /**
   * Check custom validator
   */
  private static async checkCustomValidator(
    context: MiddlewareContext, 
    config: RouteProtection
  ): Promise<MiddlewareResult> {
    if (!config.customValidator) {
      return { shouldContinue: true }
    }

    try {
      const isValid = await config.customValidator(context)
      
      if (!isValid) {
        Logger.warn('Custom validation failed', {}, context)
        
        return {
          shouldContinue: false,
          response: NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          )
        }
      }
    } catch (error) {
      Logger.error('Custom validator error', error as Error, {}, context)
      
      return {
        shouldContinue: false,
        response: NextResponse.json(
          { error: 'Validation error' },
          { status: 500 }
        )
      }
    }

    return { shouldContinue: true }
  }

  /**
   * Sanitize request if needed
   */
  private static async sanitizeRequest(
    context: MiddlewareContext, 
    config: RouteProtection
  ): Promise<MiddlewareResult> {
    if (!config.sanitizeInput) {
      return { shouldContinue: true }
    }

    try {
      // For POST/PUT requests with JSON body, sanitize the body
      if (context.request.method === 'POST' || context.request.method === 'PUT') {
        const contentType = context.request.headers.get('content-type')
        
        if (contentType && contentType.includes('application/json')) {
          const body = await context.request.text()
          
          if (body) {
            const parsed = JSON.parse(body)
            const sanitized = RequestValidator.sanitizeInput(parsed)
            
            // Create new request with sanitized body
            const modifiedRequest = new NextRequest(context.request.url, {
              method: context.request.method,
              headers: context.request.headers,
              body: JSON.stringify(sanitized)
            })

            return {
              shouldContinue: true,
              modifiedRequest
            }
          }
        }
      }
    } catch (error) {
      Logger.warn('Input sanitization failed', { error: (error as Error).message }, context)
      // Continue anyway - don't block request for sanitization errors
    }

    return { shouldContinue: true }
  }
}