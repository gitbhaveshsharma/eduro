/**
 * Middleware Configuration
 * Centralized configuration for the middleware system
 */

import { 
  MiddlewareConfig, 
  UserRole, 
  Permission, 
  SecurityLevel, 
  RateLimitWindow 
} from './types'

// Default security headers for production
const defaultSecurityHeaders = {
  contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https: wss:; media-src 'self' https: blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';",
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=()',
  crossOriginEmbedderPolicy: 'require-corp',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin'
}

// Development security headers (more permissive)
const developmentSecurityHeaders = {
  ...defaultSecurityHeaders,
  contentSecurityPolicy: "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: wss: ws:;",
  crossOriginEmbedderPolicy: 'unsafe-none'
}

// Default CORS configuration
const defaultCorsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-CSRF-Token',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset'],
  credentials: true,
  maxAge: 86400 // 24 hours
}

// Route-specific protections
const routeProtections = {
  // Public routes - no authentication required
  '/': {
    securityLevel: SecurityLevel.PUBLIC,
    rateLimiting: {
      requests: 100,
      window: RateLimitWindow.MINUTE
    },
    logRequests: false
  },
  
  '/login': {
    securityLevel: SecurityLevel.PUBLIC,
    rateLimiting: {
      requests: 20,
      window: RateLimitWindow.MINUTE
    },
    maxRequestSize: 1024, // 1KB for login forms
    sanitizeInput: true,
    logRequests: true
  },
  
  '/auth/callback': {
    securityLevel: SecurityLevel.PUBLIC,
    rateLimiting: {
      requests: 10,
      window: RateLimitWindow.MINUTE
    },
    logRequests: true
  },
  
  // API routes
  '/api/auth/*': {
    securityLevel: SecurityLevel.PUBLIC,
    rateLimiting: {
      requests: 30,
      window: RateLimitWindow.MINUTE
    },
    allowedMethods: ['POST', 'GET'],
    maxRequestSize: 2048, // 2KB
    sanitizeInput: true,
    requiresCSRF: false, // OAuth doesn't work well with CSRF
    logRequests: true
  },
  
  '/api/pincode': {
    securityLevel: SecurityLevel.AUTHENTICATED,
    rateLimiting: {
      requests: 10,
      window: RateLimitWindow.MINUTE
    },
    allowedMethods: ['GET'], // Fixed: pincode API uses GET method
    maxRequestSize: 512, // 512B
    sanitizeInput: false, // Disable input sanitization for GET requests
    logRequests: true
  },
  
  // Protected pages - require authentication
  '/dashboard': {
    securityLevel: SecurityLevel.AUTHENTICATED,
    rateLimiting: {
      requests: 60,
      window: RateLimitWindow.MINUTE
    },
    logRequests: false
  },
  
  '/onboarding': {
    securityLevel: SecurityLevel.AUTHENTICATED,
    rateLimiting: {
      requests: 30,
      window: RateLimitWindow.MINUTE
    },
    maxRequestSize: 10240, // 10KB for profile data
    sanitizeInput: true,
    logRequests: true
  },
  // feed routes
  '/feed': {
    securityLevel: SecurityLevel.AUTHENTICATED,
    rateLimiting: {
      requests: 100,
      window: RateLimitWindow.MINUTE
    },
    logRequests: true
  },
  '/feed/*': {
    securityLevel: SecurityLevel.AUTHENTICATED,
    rateLimiting: {
      requests: 100,
      window: RateLimitWindow.MINUTE
    },
    logRequests: true
  },
  '/network': {
    securityLevel: SecurityLevel.AUTHENTICATED,
    rateLimiting: {
      requests: 100,
      window: RateLimitWindow.MINUTE
    },
    logRequests: true
  },
  '/network/*': {
    securityLevel: SecurityLevel.AUTHENTICATED,
    rateLimiting: {
      requests: 100,
      window: RateLimitWindow.MINUTE
    },
    logRequests: true
  },
  '/coaching-reviews': {
    securityLevel: SecurityLevel.PUBLIC,
    rateLimiting: { requests: 100, window: RateLimitWindow.MINUTE },
    logRequests: true
  },
  '/coaching-reviews/*': {
    securityLevel: SecurityLevel.PUBLIC,
    rateLimiting: { requests: 100, window: RateLimitWindow.MINUTE },
    logRequests: true
  },
  // Admin routes - require admin role
  '/admin/*': {
    securityLevel: SecurityLevel.ROLE_BASED,
    allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    rateLimiting: {
      requests: 100,
      window: RateLimitWindow.MINUTE
    },
    requiresCSRF: true,
    logRequests: true
  },
  
  // API routes by role
  '/api/admin/*': {
    securityLevel: SecurityLevel.ROLE_BASED,
    allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    rateLimiting: {
      requests: 60,
      window: RateLimitWindow.MINUTE
    },
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    requiresCSRF: true,
    logRequests: true
  },
  
  '/api/teacher/*': {
    securityLevel: SecurityLevel.ROLE_BASED,
    allowedRoles: [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    rateLimiting: {
      requests: 120,
      window: RateLimitWindow.MINUTE
    },
    logRequests: true
  },
  
  '/api/student/*': {
    securityLevel: SecurityLevel.ROLE_BASED,
    allowedRoles: [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    rateLimiting: {
      requests: 200,
      window: RateLimitWindow.MINUTE
    },
    logRequests: false
  },
  
  // File upload routes
  '/api/upload/*': {
    securityLevel: SecurityLevel.AUTHENTICATED,
    rateLimiting: {
      requests: 10,
      window: RateLimitWindow.MINUTE
    },
    allowedMethods: ['POST'],
    maxRequestSize: 10485760, // 10MB
    requiresCSRF: true,
    logRequests: true
  }
}

// Main configuration
export const middlewareConfig: MiddlewareConfig = {
  enabled: true,
  debug: process.env.NODE_ENV === 'development',
  
  security: {
    headers: process.env.NODE_ENV === 'production' 
      ? defaultSecurityHeaders 
      : developmentSecurityHeaders,
    cors: defaultCorsConfig,
    maxRequestSize: 1048576, // 1MB default
    sanitizeInput: true,
    
    // API Keys configuration (optional)
    apiKeys: process.env.API_KEYS ? {
      header: 'X-API-Key',
      validKeys: process.env.API_KEYS.split(','),
      rateLimitMultiplier: 10 // API key users get 10x rate limit
    } : undefined,
    
    // CSRF protection
    csrf: {
      tokenLength: 32,
      cookieName: '__csrf_token',
      headerName: 'X-CSRF-Token',
      ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    }
  },
  
  auth: {
    enabled: true,
    cookieName: 'supabase-auth-token', // Fixed to match auth store
    sessionTimeout: 3600, // 1 hour
    refreshThreshold: 300, // 5 minutes before expiry
    requiresVerification: true
  },
  
  rateLimiting: {
    enabled: true,
    global: {
      requests: 1000,
      window: RateLimitWindow.HOUR
    },
    perUser: {
      requests: 500,
      window: RateLimitWindow.HOUR
    },
    perIP: {
      requests: 200,
      window: RateLimitWindow.HOUR
    }
  },
  
  logging: {
    enabled: true,
    logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    logRequests: process.env.NODE_ENV === 'development',
    logResponses: false,
    logErrors: true,
    logSecurity: true,
    maxLogSize: 10485760, // 10MB
    anonymizeIPs: process.env.NODE_ENV === 'production',
    excludeRoutes: ['/health', '/favicon.ico', '/_next/static/*']
  },
  
  monitoring: {
    enabled: true,
    collectMetrics: true,
    alertOnSuspiciousActivity: process.env.NODE_ENV === 'production',
    alertThresholds: {
      failedAuthAttempts: 10,
      rateLimitViolations: 50,
      suspiciousIPs: 5
    },
    webhookUrl: process.env.SECURITY_WEBHOOK_URL
  },
  
  routes: routeProtections,
  
  errorPages: {
    unauthorized: '/login',
    forbidden: '/403',
    rateLimited: '/429',
    serverError: '/500'
  }
}

// Environment-specific overrides
if (process.env.NODE_ENV === 'development') {
  middlewareConfig.rateLimiting.enabled = false
  middlewareConfig.security.headers.strictTransportSecurity = ''
  middlewareConfig.monitoring.alertOnSuspiciousActivity = false
}

// Production-specific settings
if (process.env.NODE_ENV === 'production') {
  middlewareConfig.debug = false
  middlewareConfig.logging.logRequests = false
  middlewareConfig.logging.anonymizeIPs = true
}

export default middlewareConfig