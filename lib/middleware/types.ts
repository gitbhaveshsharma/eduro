/**
 * Middleware Types and Interfaces
 * Comprehensive type definitions for the middleware system
 */

import { NextRequest, NextResponse } from 'next/server'

// User roles enum for type safety
export enum UserRole {
  STUDENT = 'S',
  TEACHER = 'T',
  COACH = 'C',
  ADMIN = 'A',
  SUPER_ADMIN = 'SA'
}

// Permission levels
export enum Permission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// Security levels
export enum SecurityLevel {
  PUBLIC = 'public',
  AUTHENTICATED = 'authenticated',
  ROLE_BASED = 'role_based',
  PERMISSION_BASED = 'permission_based',
  CUSTOM = 'custom'
}

// Rate limiting windows
export enum RateLimitWindow {
  MINUTE = 60,
  HOUR = 3600,
  DAY = 86400
}

// User context interface
export interface UserContext {
  id: string
  email?: string
  phone?: string
  role: UserRole
  permissions: Permission[]
  isOnline: boolean
  lastActivity?: Date
  sessionId?: string
}

// Request context interface
export interface RequestContext {
  ip: string
  userAgent: string
  country?: string
  city?: string
  isMobile: boolean
  isBot: boolean
  timestamp: Date
  requestId: string
}

// Route protection configuration
export interface RouteProtection {
  securityLevel: SecurityLevel
  allowedRoles?: UserRole[]
  requiredPermissions?: Permission[]
  customValidator?: (context: MiddlewareContext) => Promise<boolean> | boolean
  rateLimiting?: RateLimitConfig
  ipWhitelist?: string[]
  ipBlacklist?: string[]
  requiresApiKey?: boolean
  requiresCSRF?: boolean
  allowedMethods?: string[]
  maxRequestSize?: number
  sanitizeInput?: boolean
  logRequests?: boolean
}

// Rate limiting configuration
export interface RateLimitConfig {
  requests: number
  window: RateLimitWindow
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (context: MiddlewareContext) => string
  onLimitReached?: (context: MiddlewareContext) => Promise<NextResponse> | NextResponse
}

// Security headers configuration
export interface SecurityHeaders {
  contentSecurityPolicy?: string
  strictTransportSecurity?: string
  xFrameOptions?: string
  xContentTypeOptions?: string
  referrerPolicy?: string
  permissionsPolicy?: string
  crossOriginEmbedderPolicy?: string
  crossOriginOpenerPolicy?: string
  crossOriginResourcePolicy?: string
}

// CORS configuration
export interface CorsConfig {
  origin?: string | string[] | boolean
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
  preflightContinue?: boolean
  optionsSuccessStatus?: number
}

// API key configuration
export interface ApiKeyConfig {
  header: string
  validKeys: string[]
  rateLimitMultiplier?: number
}

// CSRF protection configuration
export interface CSRFConfig {
  tokenLength: number
  cookieName: string
  headerName: string
  ignoredMethods: string[]
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

// Logging configuration
export interface LoggingConfig {
  enabled: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  logRequests: boolean
  logResponses: boolean
  logErrors: boolean
  logSecurity: boolean
  maxLogSize?: number
  anonymizeIPs?: boolean
  excludeRoutes?: string[]
}

// Monitoring configuration
export interface MonitoringConfig {
  enabled: boolean
  collectMetrics: boolean
  alertOnSuspiciousActivity: boolean
  alertThresholds: {
    failedAuthAttempts: number
    rateLimitViolations: number
    suspiciousIPs: number
  }
  webhookUrl?: string
}

// Main middleware configuration interface
export interface MiddlewareConfig {
  // Global settings
  enabled: boolean
  debug: boolean
  
  // Security settings
  security: {
    headers: SecurityHeaders
    cors: CorsConfig
    apiKeys?: ApiKeyConfig
    csrf?: CSRFConfig
    maxRequestSize: number
    sanitizeInput: boolean
  }
  
  // Authentication settings
  auth: {
    enabled: boolean
    cookieName: string
    sessionTimeout: number
    refreshThreshold: number
    requiresVerification: boolean
  }
  
  // Rate limiting
  rateLimiting: {
    enabled: boolean
    global: RateLimitConfig
    perUser?: RateLimitConfig
    perIP?: RateLimitConfig
  }
  
  // Logging and monitoring
  logging: LoggingConfig
  monitoring: MonitoringConfig
  
  // Route-specific configurations
  routes: Record<string, RouteProtection>
  
  // Error handling
  errorPages: {
    unauthorized: string
    forbidden: string
    rateLimited: string
    serverError: string
  }
}

// Middleware context - everything available to middleware functions
export interface MiddlewareContext {
  request: NextRequest
  user?: UserContext
  requestContext: RequestContext
  config: MiddlewareConfig
  rateLimitState?: RateLimitState
}

// Rate limit state
export interface RateLimitState {
  requests: number
  resetTime: number
  isLimited: boolean
}

// Middleware result
export interface MiddlewareResult {
  shouldContinue: boolean
  response?: NextResponse
  modifiedRequest?: NextRequest
  context?: Partial<MiddlewareContext>
}

// Middleware function type
export type MiddlewareFunction = (
  context: MiddlewareContext
) => Promise<MiddlewareResult> | MiddlewareResult

// Security event types
export enum SecurityEventType {
  AUTH_FAILURE = 'auth_failure',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_TOKEN = 'invalid_token',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  BLOCKED_IP = 'blocked_ip',
  CSRF_VIOLATION = 'csrf_violation',
  INVALID_API_KEY = 'invalid_api_key',
  MALFORMED_REQUEST = 'malformed_request'
}

// Security event interface
export interface SecurityEvent {
  type: SecurityEventType
  timestamp: Date
  ip: string
  userAgent: string
  userId?: string
  route: string
  details: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// Error types
export class MiddlewareError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'MiddlewareError'
  }
}

export class AuthenticationError extends MiddlewareError {
  constructor(message: string = 'Authentication required', details?: Record<string, any>) {
    super(message, 401, 'AUTH_REQUIRED', details)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends MiddlewareError {
  constructor(message: string = 'Insufficient permissions', details?: Record<string, any>) {
    super(message, 403, 'INSUFFICIENT_PERMISSIONS', details)
    this.name = 'AuthorizationError'
  }
}

export class RateLimitError extends MiddlewareError {
  constructor(message: string = 'Rate limit exceeded', details?: Record<string, any>) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details)
    this.name = 'RateLimitError'
  }
}

export class ValidationError extends MiddlewareError {
  constructor(message: string = 'Invalid request', details?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}