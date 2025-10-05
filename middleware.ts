/**
 * Enterprise-Grade Middleware System
 * Main middleware file that orchestrates all security, authentication, and protection layers
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  MiddlewareContext, 
  RequestContext, 
  SecurityEvent, 
  SecurityEventType 
} from './lib/middleware/types'
import middlewareConfig from './lib/middleware/config'
import { AuthHandler } from './lib/middleware/auth-utils'
import { RouteProtector } from './lib/middleware/route-protection'
import { 
  IPUtils, 
  UserAgentAnalyzer, 
  SecurityUtils,
  SecurityEventTracker 
} from './lib/middleware/security-utils'
import { 
  Logger, 
  MetricsCollector, 
  PerformanceMonitor 
} from './lib/middleware/monitoring'

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  // Initialize logging and monitoring
  Logger.configure(middlewareConfig.logging)
  MetricsCollector.configure(middlewareConfig.monitoring)

  // Generate request ID for tracking
  const requestId = SecurityUtils.generateRequestId()
  
  try {
    // Build request context
    const requestContext = await buildRequestContext(request, requestId)
    
    // Log incoming request if enabled
    if (middlewareConfig.logging.logRequests) {
      Logger.logRequest(request)
    }

    // Check if middleware is enabled
    if (!middlewareConfig.enabled) {
      return NextResponse.next()
    }

    // Extract and validate user if authenticated
    const user = await AuthHandler.validateUser(request)
    
    // Build full middleware context
    const context: MiddlewareContext = {
      request,
      user: user || undefined,
      requestContext,
      config: middlewareConfig
    }

    // Apply security headers
    const response = NextResponse.next()
    applySecurityHeaders(response, middlewareConfig.security.headers)

    // Apply CORS if needed
    if (request.method === 'OPTIONS') {
      return handleCORSPreflight(request, response)
    }

    // Apply route protection
    const protectionResult = await RouteProtector.protect(context)
    
    if (!protectionResult.shouldContinue) {
      const finalResponse = protectionResult.response || response
      
      // Log failed request
      const duration = Date.now() - startTime
      Logger.logResponse(request, finalResponse, duration, context)
      MetricsCollector.recordRequest(request, finalResponse, duration)
      
      return finalResponse
    }

    // Use modified request if provided
    const finalRequest = protectionResult.modifiedRequest || request

    // Apply additional security measures
    applyCORSHeaders(response, middlewareConfig.security.cors, request)
    
    // Add security and tracking headers
    response.headers.set('X-Request-ID', requestId)
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    
    // Track session if user is authenticated
    if (user && user.sessionId) {
      // In a real implementation, you might want to update last activity
      AuthHandler.logAuthEvent(user.id, 'login', requestContext.ip, requestContext.userAgent)
    }

    // Log successful request
    const duration = Date.now() - startTime
    Logger.logResponse(request, response, duration, context)
    MetricsCollector.recordRequest(request, response, duration)

    return response

  } catch (error) {
    // Log and handle errors
    Logger.error('Middleware error', error as Error, {}, {
      requestContext: { requestId, ip: IPUtils.getRealIP(request), userAgent: request.headers.get('user-agent') || '' } as any
    })

    // Record security event for unexpected errors
    SecurityEventTracker.recordEvent({
      type: SecurityEventType.MALFORMED_REQUEST,
      timestamp: new Date(),
      ip: IPUtils.getRealIP(request),
      userAgent: request.headers.get('user-agent') || '',
      route: request.nextUrl.pathname,
      details: { error: (error as Error).message },
      severity: 'medium'
    })

    // Return error response
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )

    // Still apply basic security headers
    applySecurityHeaders(errorResponse, middlewareConfig.security.headers)
    errorResponse.headers.set('X-Request-ID', requestId)

    const duration = Date.now() - startTime
    MetricsCollector.recordRequest(request, errorResponse, duration)

    return errorResponse
  }
}

/**
 * Build request context with security information
 */
async function buildRequestContext(request: NextRequest, requestId: string): Promise<RequestContext> {
  const ip = IPUtils.getRealIP(request)
  const userAgent = request.headers.get('user-agent') || ''
  
  // Get geo-location info (in production, use a real service)
  const geoInfo = await SecurityUtils.getGeoLocation(ip)
  
  return {
    ip,
    userAgent,
    country: geoInfo.country,
    city: geoInfo.city,
    isMobile: UserAgentAnalyzer.isMobile(userAgent),
    isBot: UserAgentAnalyzer.isBot(userAgent),
    timestamp: new Date(),
    requestId
  }
}

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse, headers: any): void {
  for (const [key, value] of Object.entries(headers)) {
    if (value && typeof value === 'string') { // Only set non-empty string headers
      // Convert camelCase to kebab-case for HTTP headers
      const headerName = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      response.headers.set(headerName, value)
    }
  }
}

/**
 * Handle CORS preflight requests
 */
function handleCORSPreflight(request: NextRequest, response: NextResponse): NextResponse {
  const corsConfig = middlewareConfig.security.cors
  
  // Set CORS headers for preflight
  response.headers.set('Access-Control-Allow-Origin', getOriginHeader(request, corsConfig.origin))
  response.headers.set('Access-Control-Allow-Methods', corsConfig.methods?.join(', ') || 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders?.join(', ') || 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', (corsConfig.maxAge || 86400).toString())
  
  if (corsConfig.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return new NextResponse(null, { status: 200, headers: response.headers })
}

/**
 * Apply CORS headers to regular responses
 */
function applyCORSHeaders(response: NextResponse, corsConfig: any, request: NextRequest): void {
  const origin = getOriginHeader(request, corsConfig.origin)
  
  response.headers.set('Access-Control-Allow-Origin', origin)
  
  if (corsConfig.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  if (corsConfig.exposedHeaders && corsConfig.exposedHeaders.length > 0) {
    response.headers.set('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '))
  }
}

/**
 * Get appropriate origin header value
 */
function getOriginHeader(request: NextRequest, allowedOrigins: string | string[] | boolean | undefined): string {
  if (allowedOrigins === true) {
    return '*'
  }
  
  if (allowedOrigins === false) {
    return 'null'
  }
  
  if (typeof allowedOrigins === 'string') {
    return allowedOrigins
  }
  
  if (Array.isArray(allowedOrigins)) {
    const requestOrigin = request.headers.get('origin')
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      return requestOrigin
    }
    return allowedOrigins[0] || '*'
  }
  
  return '*'
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
