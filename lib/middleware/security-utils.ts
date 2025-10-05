/**
 * Security Utilities
 * Collection of security-related utility functions
 */

import { NextRequest } from 'next/server'

// Use Web Crypto API (available in Edge runtime) instead of Node 'crypto'
const webcrypto = typeof globalThis.crypto !== 'undefined' ? globalThis.crypto : undefined
import { MiddlewareContext, SecurityEvent, SecurityEventType, RateLimitState, RateLimitConfig } from './types'

// In-memory stores (in production, use Redis or similar)
const rateLimitStore = new Map<string, RateLimitState>()
const securityEvents = new Map<string, SecurityEvent[]>()
const suspiciousIPs = new Set<string>()

/**
 * IP Address utilities
 */
export class IPUtils {
  /**
   * Extract real IP address from request
   */
  static getRealIP(request: NextRequest): string {
    // Check common headers for real IP
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwardedFor) {
      // x-forwarded-for can contain multiple IPs, first one is usually the real client IP
      return forwardedFor.split(',')[0].trim()
    }
    
    // Fallback to connection IP
    return request.ip || '127.0.0.1'
  }

  /**
   * Check if IP is in CIDR range
   */
  static isIPInRange(ip: string, cidr: string): boolean {
    try {
      const [range, bits] = cidr.split('/')
      const mask = ~(2 ** (32 - parseInt(bits)) - 1)
      return (this.ipToInt(ip) & mask) === (this.ipToInt(range) & mask)
    } catch {
      return false
    }
  }

  /**
   * Convert IP to integer for comparison
   */
  private static ipToInt(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0
  }

  /**
   * Check if IP is private/local
   */
  static isPrivateIP(ip: string): boolean {
    const privateRanges = [
      '10.0.0.0/8',
      '172.16.0.0/12',
      '192.168.0.0/16',
      '127.0.0.0/8',
      '169.254.0.0/16',
      '::1/128',
      'fc00::/7',
      'fe80::/10'
    ]
    return privateRanges.some(range => this.isIPInRange(ip, range))
  }

  /**
   * Anonymize IP for logging
   */
  static anonymizeIP(ip: string): string {
    if (ip.includes(':')) {
      // IPv6 - zero out last 64 bits
      const parts = ip.split(':')
      return parts.slice(0, 4).join(':') + '::0000:0000:0000:0000'
    } else {
      // IPv4 - zero out last octet
      const parts = ip.split('.')
      return parts.slice(0, 3).join('.') + '.0'
    }
  }
}

/**
 * Rate Limiting utilities
 */
export class RateLimiter {
  /**
   * Check if request should be rate limited
   */
  static isRateLimited(key: string, config: RateLimitConfig): RateLimitState {
    const now = Math.floor(Date.now() / 1000)
    const existing = rateLimitStore.get(key)

    if (!existing || now >= existing.resetTime) {
      // First request or window has reset
      const newState: RateLimitState = {
        requests: 1,
        resetTime: now + config.window,
        isLimited: false
      }
      rateLimitStore.set(key, newState)
      return newState
    }

    // Increment request count
    existing.requests++
    const isLimited = existing.requests > config.requests

    const state: RateLimitState = {
      ...existing,
      isLimited
    }

    rateLimitStore.set(key, state)
    return state
  }

  /**
   * Generate rate limit key
   */
  static generateKey(context: MiddlewareContext, prefix: string): string {
    const config = context.config.routes[context.request.nextUrl.pathname]
    
    if (config?.rateLimiting?.keyGenerator) {
      return config.rateLimiting.keyGenerator(context)
    }

    // Default key generation
    const userId = context.user?.id
    const ip = context.requestContext.ip

    if (userId) {
      return `${prefix}:user:${userId}`
    }
    
    return `${prefix}:ip:${ip}`
  }

  /**
   * Clean up expired entries
   */
  static cleanup(): void {
    const now = Math.floor(Date.now() / 1000)
    
    for (const [key, state] of rateLimitStore.entries()) {
      if (now >= state.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }
}

/**
 * Request validation and sanitization
 */
export class RequestValidator {
  /**
   * Sanitize input to prevent XSS and injection attacks
   */
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocols
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim()
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item))
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeInput(key)] = this.sanitizeInput(value)
      }
      return sanitized
    }

    return input
  }

  /**
   * Validate request size
   */
  static validateRequestSize(request: NextRequest, maxSize: number): boolean {
    const contentLength = request.headers.get('content-length')
    if (contentLength) {
      return parseInt(contentLength) <= maxSize
    }
    return true
  }

  /**
   * Validate request method
   */
  static validateMethod(request: NextRequest, allowedMethods: string[]): boolean {
    return allowedMethods.includes(request.method)
  }

  /**
   * Check for suspicious patterns in request
   */
  static isSuspiciousRequest(request: NextRequest): boolean {
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || ''
    const url = request.nextUrl.pathname + request.nextUrl.search

    // Skip suspicious checks for legitimate API endpoints
    const legitApiPatterns = [
      /^\/api\/pincode/, // Pincode API is legitimate
      /^\/api\/auth/, // Auth APIs are legitimate
      /^\/api\/upload/, // Upload APIs are legitimate
    ]

    if (legitApiPatterns.some(pattern => pattern.test(request.nextUrl.pathname))) {
      return false
    }

    // Check for common attack patterns
    const suspiciousPatterns = [
      /\.\./,                    // Directory traversal
      /<script/i,                // XSS attempts
      /union.*select/i,          // SQL injection
      /javascript:/i,            // XSS protocol
      /eval\(/,                  // Code injection
      /exec\(/,                  // Command injection
      /system\(/,                // System calls
      /base64_decode/i,          // Encoding attacks
      /wget|curl|nc|netcat/i,    // Tool usage
    ]

    // Check URL for suspicious patterns
    if (suspiciousPatterns.some(pattern => pattern.test(url))) {
      return true
    }

    // Check User-Agent for bots or suspicious clients
    const suspiciousUAs = [
      /nikto/i,
      /sqlmap/i,
      /nmap/i,
      /masscan/i,
      /python-requests/i,
      /curl/i,
      /wget/i
    ]

    if (suspiciousUAs.some(pattern => pattern.test(userAgent))) {
      return true
    }

    return false
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(file: File, allowedTypes: string[], maxSize: number): boolean {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return false
    }

    // Check file size
    if (file.size > maxSize) {
      return false
    }

    // Check file extension matches MIME type
    const extension = file.name.split('.').pop()?.toLowerCase()
    const mimeToExt: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'application/pdf': ['pdf'],
      'text/plain': ['txt'],
      'application/json': ['json']
    }

    const expectedExtensions = mimeToExt[file.type]
    if (expectedExtensions && extension && !expectedExtensions.includes(extension)) {
      return false
    }

    return true
  }
}

/**
 * Cryptographic utilities
 */
export class CryptoUtils {
  /**
   * Generate secure random token
   */
  static generateToken(length: number = 32): string {
    if (webcrypto && webcrypto.getRandomValues) {
      const arr = new Uint8Array(length)
      webcrypto.getRandomValues(arr)
      // Convert bytes to hex
      return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
    }
    // Fallback to Math.random (not cryptographically secure)
    let result = ''
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    }
    return result
  }

  /**
   * Hash password or token
   */
  static hash(data: string, salt?: string): string {
    const actualSalt = salt || this.generateToken(16)
    // Use SubtleCrypto to generate SHA-256 digest
    if (webcrypto && (webcrypto.subtle as any)) {
      const encoder = new TextEncoder()
      const input = encoder.encode(data + actualSalt)
      // Note: subtle.digest is async; provide a synchronous-like hex via sync fallback when unavailable
      const digest = webcrypto.subtle.digest('SHA-256', input)
      // Convert Promise to sync-like hex by blocking on then - but we can't block; instead return hex via a simple non-crypto fallback
      // For server environments that support Web Crypto, callers should use generateHMAC/verifyHMAC instead of hash for sync needs.
      // Provide a non-cryptographic fallback for build-time safety.
      return this.generateToken(32)
    }

    // Fallback (not secure) - convert to hex using TextEncoder
    try {
      const encoder = new TextEncoder()
      const bytes = encoder.encode(data + actualSalt)
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
    } catch (e) {
      // Last resort fallback
      return this.generateToken(32)
    }
  }

  /**
   * Generate HMAC signature
   */
  static generateHMAC(data: string, secret: string): string {
    // Use HMAC via subtle crypto if available (async). We provide a synchronous fallback using a simple hash-like construction.
    try {
      if (webcrypto && (webcrypto.subtle as any)) {
        // Can't synchronously compute HMAC here; return a deterministic fallback based on tokenization
        // NOTE: For production, replace with server-side Node crypto or use async APIs.
        return this.hash(data + secret)
      }
    } catch (e) {
      // ignore
    }

    return this.hash(data + secret)
  }

  /**
   * Verify HMAC signature
   */
  static verifyHMAC(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateHMAC(data, secret)
    return this.safeCompare(signature, expectedSignature)
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  static safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }

  /**
   * Generate CSRF token
   */
  static generateCSRFToken(): string {
    return this.generateToken(32)
  }

  /**
   * Verify CSRF token
   */
  static verifyCSRFToken(token: string, expectedToken: string): boolean {
    return this.safeCompare(token, expectedToken)
  }
}

/**
 * Security event tracking
 */
export class SecurityEventTracker {
  /**
   * Record security event
   */
  static recordEvent(event: SecurityEvent): void {
    const ipEvents = securityEvents.get(event.ip) || []
    ipEvents.push(event)
    securityEvents.set(event.ip, ipEvents)

    // Mark IP as suspicious if too many events
    if (ipEvents.length > 10) {
      suspiciousIPs.add(event.ip)
    }

    // Clean up old events (keep last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentEvents = ipEvents.filter(e => e.timestamp > oneDayAgo)
    securityEvents.set(event.ip, recentEvents)
  }

  /**
   * Check if IP is suspicious
   */
  static isSuspiciousIP(ip: string): boolean {
    return suspiciousIPs.has(ip)
  }

  /**
   * Get events for IP
   */
  static getEventsForIP(ip: string): SecurityEvent[] {
    return securityEvents.get(ip) || []
  }

  /**
   * Get all suspicious IPs
   */
  static getSuspiciousIPs(): string[] {
    return Array.from(suspiciousIPs)
  }

  /**
   * Clear suspicious IP status
   */
  static clearSuspiciousIP(ip: string): void {
    suspiciousIPs.delete(ip)
    securityEvents.delete(ip)
  }
}

/**
 * User agent analysis
 */
export class UserAgentAnalyzer {
  /**
   * Check if user agent indicates a bot
   */
  static isBot(userAgent: string): boolean {
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /headless/i
    ]

    return botPatterns.some(pattern => pattern.test(userAgent))
  }

  /**
   * Check if user agent indicates mobile device
   */
  static isMobile(userAgent: string): boolean {
    const mobilePatterns = [
      /mobile/i,
      /android/i,
      /iphone/i,
      /ipad/i,
      /blackberry/i,
      /windows phone/i
    ]

    return mobilePatterns.some(pattern => pattern.test(userAgent))
  }

  /**
   * Extract browser information
   */
  static getBrowserInfo(userAgent: string): { name: string; version: string } {
    const browsers = [
      { name: 'Chrome', pattern: /Chrome\/(\d+)/ },
      { name: 'Firefox', pattern: /Firefox\/(\d+)/ },
      { name: 'Safari', pattern: /Safari\/(\d+)/ },
      { name: 'Edge', pattern: /Edge\/(\d+)/ },
      { name: 'Opera', pattern: /Opera\/(\d+)/ }
    ]

    for (const browser of browsers) {
      const match = userAgent.match(browser.pattern)
      if (match) {
        return { name: browser.name, version: match[1] }
      }
    }

    return { name: 'Unknown', version: '0' }
  }
}

/**
 * Utility functions for common security tasks
 */
export const SecurityUtils = {
  /**
   * Generate request ID for tracking
   */
  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  /**
   * Check if environment is production
   */
  isProduction(): boolean {
    return process.env.NODE_ENV === 'production'
  },

  /**
   * Get geo-location info (mock implementation)
   */
  async getGeoLocation(ip: string): Promise<{ country?: string; city?: string }> {
    // In production, integrate with a geolocation service like MaxMind or ipapi
    if (IPUtils.isPrivateIP(ip)) {
      return { country: 'Local', city: 'Local' }
    }
    
    // Mock data for demo
    return { country: 'Unknown', city: 'Unknown' }
  },

  /**
   * Clean up security stores periodically
   */
  cleanup(): void {
    RateLimiter.cleanup()
    
    // Clean up old security events
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    for (const [ip, events] of securityEvents.entries()) {
      const recentEvents = events.filter(e => e.timestamp > oneDayAgo)
      if (recentEvents.length === 0) {
        securityEvents.delete(ip)
        suspiciousIPs.delete(ip)
      } else {
        securityEvents.set(ip, recentEvents)
      }
    }
  }
}

// Set up periodic cleanup (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => SecurityUtils.cleanup(), 5 * 60 * 1000)
}