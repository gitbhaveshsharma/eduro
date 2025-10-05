/**
 * Logging and Monitoring Utilities
 * Comprehensive logging, metrics, and monitoring for the middleware system
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  MiddlewareContext, 
  SecurityEvent, 
  SecurityEventType, 
  LoggingConfig, 
  MonitoringConfig 
} from './types'

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// Log entry interface
export interface LogEntry {
  timestamp: Date
  level: LogLevel
  category: string
  message: string
  context?: Record<string, any>
  requestId?: string
  userId?: string
  ip?: string
  userAgent?: string
}

// Metrics interface
export interface Metrics {
  requests: {
    total: number
    byStatus: Record<number, number>
    byRoute: Record<string, number>
    byMethod: Record<string, number>
  }
  auth: {
    successful: number
    failed: number
    tokenRefreshes: number
  }
  security: {
    rateLimitViolations: number
    suspiciousRequests: number
    blockedIPs: number
    csrfViolations: number
  }
  performance: {
    averageResponseTime: number
    slowRequests: number
    errors: number
  }
}

/**
 * Advanced logging system
 */
export class Logger {
  private static logs: LogEntry[] = []
  private static config: LoggingConfig = {
    enabled: true,
    logLevel: 'info',
    logRequests: true,
    logResponses: false,
    logErrors: true,
    logSecurity: true,
    maxLogSize: 10485760, // 10MB
    anonymizeIPs: false,
    excludeRoutes: []
  }

  /**
   * Configure logger
   */
  static configure(config: LoggingConfig): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Log debug message
   */
  static debug(message: string, context?: Record<string, any>, requestContext?: Partial<MiddlewareContext>): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, context, requestContext)
  }

  /**
   * Log info message
   */
  static info(message: string, context?: Record<string, any>, requestContext?: Partial<MiddlewareContext>): void {
    this.log(LogLevel.INFO, 'INFO', message, context, requestContext)
  }

  /**
   * Log warning
   */
  static warn(message: string, context?: Record<string, any>, requestContext?: Partial<MiddlewareContext>): void {
    this.log(LogLevel.WARN, 'WARN', message, context, requestContext)
  }

  /**
   * Log error
   */
  static error(message: string, error?: Error, context?: Record<string, any>, requestContext?: Partial<MiddlewareContext>): void {
    const errorContext = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...context
    } : context

    this.log(LogLevel.ERROR, 'ERROR', message, errorContext, requestContext)
  }

  /**
   * Log security event
   */
  static security(event: SecurityEvent, context?: Record<string, any>): void {
    if (!this.config.logSecurity) return

    const securityContext = {
      eventType: event.type,
      severity: event.severity,
      details: event.details,
      ...context
    }

    // Provide required RequestContext fields (with sensible defaults) so the object matches the expected type
    this.log(LogLevel.WARN, 'SECURITY', `Security event: ${event.type}`, securityContext, {
      requestContext: {
        ip: event.ip,
        userAgent: event.userAgent,
        isMobile: false,
        isBot: false,
        timestamp: Date.now(),
        requestId: ''
      }
    } as unknown as Partial<MiddlewareContext>)
  }

  /**
   * Log request
   */
  static logRequest(request: NextRequest, context?: MiddlewareContext): void {
    if (!this.config.logRequests) return
    if (this.shouldExcludeRoute(request.nextUrl.pathname)) return

    const requestData = {
      method: request.method,
      url: request.nextUrl.pathname + request.nextUrl.search,
      headers: this.sanitizeHeaders(Object.fromEntries(request.headers.entries())),
      ip: context?.requestContext?.ip,
      userAgent: request.headers.get('user-agent'),
      contentLength: request.headers.get('content-length'),
      referer: request.headers.get('referer')
    }

    this.log(LogLevel.INFO, 'REQUEST', `${request.method} ${request.nextUrl.pathname}`, requestData, context)
  }

  /**
   * Log response
   */
  static logResponse(
    request: NextRequest, 
    response: NextResponse, 
    duration: number,
    context?: MiddlewareContext
  ): void {
    if (!this.config.logResponses) return
    if (this.shouldExcludeRoute(request.nextUrl.pathname)) return

    const responseData = {
      status: response.status,
      duration: `${duration}ms`,
      size: response.headers.get('content-length'),
      cacheControl: response.headers.get('cache-control')
    }

    this.log(LogLevel.INFO, 'RESPONSE', `${response.status} ${request.method} ${request.nextUrl.pathname}`, responseData, context)
  }

  /**
   * Core logging method
   */
  private static log(
    level: LogLevel, 
    category: string, 
    message: string, 
    context?: Record<string, any>,
    requestContext?: Partial<MiddlewareContext>
  ): void {
    if (!this.config.enabled) return
    if (level < this.getLogLevelValue(this.config.logLevel)) return

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      context: context || {},
      requestId: requestContext?.requestContext?.requestId,
      userId: requestContext?.user?.id,
      ip: this.config.anonymizeIPs && requestContext?.requestContext?.ip ? 
          this.anonymizeIP(requestContext.requestContext.ip) : 
          requestContext?.requestContext?.ip,
      userAgent: requestContext?.requestContext?.userAgent
    }

    this.logs.push(entry)
    this.outputLog(entry)
    this.cleanup()
  }

  /**
   * Output log entry
   */
  private static outputLog(entry: LogEntry): void {
    const logLine = this.formatLogEntry(entry)

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logLine)
        break
      case LogLevel.INFO:
        console.info(logLine)
        break
      case LogLevel.WARN:
        console.warn(logLine)
        break
      case LogLevel.ERROR:
        console.error(logLine)
        break
    }

    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(entry)
    }
  }

  /**
   * Format log entry for output
   */
  private static formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString()
    const level = LogLevel[entry.level].padEnd(5)
    const category = entry.category.padEnd(10)
    
    let logLine = `[${timestamp}] [${level}] [${category}] ${entry.message}`

    if (entry.requestId) {
      logLine += ` [${entry.requestId}]`
    }

    if (entry.userId) {
      logLine += ` [user:${entry.userId}]`
    }

    if (entry.ip) {
      logLine += ` [ip:${entry.ip}]`
    }

    if (entry.context && Object.keys(entry.context).length > 0) {
      logLine += ` ${JSON.stringify(entry.context)}`
    }

    return logLine
  }

  /**
   * Send to external logging service
   */
  private static async sendToExternalLogger(entry: LogEntry): Promise<void> {
    // Implement integration with logging services like DataDog, LogRocket, etc.
    // For now, this is a placeholder
    
    if (process.env.LOGGING_WEBHOOK_URL) {
      try {
        await fetch(process.env.LOGGING_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        })
      } catch (error) {
        console.error('Failed to send log to external service:', error)
      }
    }
  }

  /**
   * Get numeric value for log level
   */
  private static getLogLevelValue(level: string): LogLevel {
    const levels: Record<string, LogLevel> = {
      debug: LogLevel.DEBUG,
      info: LogLevel.INFO,
      warn: LogLevel.WARN,
      error: LogLevel.ERROR
    }
    return levels[level] || LogLevel.INFO
  }

  /**
   * Check if route should be excluded from logging
   */
  private static shouldExcludeRoute(pathname: string): boolean {
    return this.config.excludeRoutes?.some(route => {
      if (route.includes('*')) {
        const pattern = new RegExp(route.replace(/\*/g, '.*'))
        return pattern.test(pathname)
      }
      return pathname === route
    }) || false
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private static sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-csrf-token']
    const sanitized: Record<string, string> = {}

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  /**
   * Anonymize IP address
   */
  private static anonymizeIP(ip: string): string {
    if (ip.includes(':')) {
      // IPv6
      const parts = ip.split(':')
      return parts.slice(0, 4).join(':') + '::xxxx:xxxx:xxxx:xxxx'
    } else {
      // IPv4
      const parts = ip.split('.')
      return parts.slice(0, 3).join('.') + '.xxx'
    }
  }

  /**
   * Clean up old logs
   */
  private static cleanup(): void {
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-500) // Keep last 500 logs
    }
  }

  /**
   * Get recent logs
   */
  static getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count)
  }

  /**
   * Get logs by level
   */
  static getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level)
  }

  /**
   * Get logs by category
   */
  static getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category)
  }
}

/**
 * Metrics collection and monitoring
 */
export class MetricsCollector {
  private static metrics: Metrics = {
    requests: {
      total: 0,
      byStatus: {},
      byRoute: {},
      byMethod: {}
    },
    auth: {
      successful: 0,
      failed: 0,
      tokenRefreshes: 0
    },
    security: {
      rateLimitViolations: 0,
      suspiciousRequests: 0,
      blockedIPs: 0,
      csrfViolations: 0
    },
    performance: {
      averageResponseTime: 0,
      slowRequests: 0,
      errors: 0
    }
  }

  private static responseTimes: number[] = []
  private static config: MonitoringConfig = {
    enabled: true,
    collectMetrics: true,
    alertOnSuspiciousActivity: false,
    alertThresholds: {
      failedAuthAttempts: 10,
      rateLimitViolations: 50,
      suspiciousIPs: 5
    }
  }

  /**
   * Configure metrics collector
   */
  static configure(config: MonitoringConfig): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Record request metrics
   */
  static recordRequest(request: NextRequest, response: NextResponse, duration: number): void {
    if (!this.config.collectMetrics) return

    this.metrics.requests.total++
    
    // Record by status
    const status = response.status
    this.metrics.requests.byStatus[status] = (this.metrics.requests.byStatus[status] || 0) + 1

    // Record by route
    const route = request.nextUrl.pathname
    this.metrics.requests.byRoute[route] = (this.metrics.requests.byRoute[route] || 0) + 1

    // Record by method
    const method = request.method
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1

    // Record response time
    this.recordResponseTime(duration)

    // Record errors
    if (status >= 400) {
      this.metrics.performance.errors++
    }

    // Record slow requests (> 1 second)
    if (duration > 1000) {
      this.metrics.performance.slowRequests++
    }
  }

  /**
   * Record authentication metrics
   */
  static recordAuthEvent(event: 'success' | 'failure' | 'refresh'): void {
    if (!this.config.collectMetrics) return

    switch (event) {
      case 'success':
        this.metrics.auth.successful++
        break
      case 'failure':
        this.metrics.auth.failed++
        this.checkAuthFailureThreshold()
        break
      case 'refresh':
        this.metrics.auth.tokenRefreshes++
        break
    }
  }

  /**
   * Record security event
   */
  static recordSecurityEvent(type: SecurityEventType): void {
    if (!this.config.collectMetrics) return

    switch (type) {
      case SecurityEventType.RATE_LIMIT_EXCEEDED:
        this.metrics.security.rateLimitViolations++
        this.checkRateLimitThreshold()
        break
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
        this.metrics.security.suspiciousRequests++
        break
      case SecurityEventType.BLOCKED_IP:
        this.metrics.security.blockedIPs++
        this.checkSuspiciousIPThreshold()
        break
      case SecurityEventType.CSRF_VIOLATION:
        this.metrics.security.csrfViolations++
        break
    }
  }

  /**
   * Record response time
   */
  private static recordResponseTime(duration: number): void {
    this.responseTimes.push(duration)
    
    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-500)
    }

    // Update average
    this.metrics.performance.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
  }

  /**
   * Check authentication failure threshold
   */
  private static checkAuthFailureThreshold(): void {
    if (!this.config.alertOnSuspiciousActivity) return

    if (this.metrics.auth.failed >= this.config.alertThresholds.failedAuthAttempts) {
      this.sendAlert('High number of authentication failures detected', {
        failedAttempts: this.metrics.auth.failed,
        threshold: this.config.alertThresholds.failedAuthAttempts
      })
    }
  }

  /**
   * Check rate limit violation threshold
   */
  private static checkRateLimitThreshold(): void {
    if (!this.config.alertOnSuspiciousActivity) return

    if (this.metrics.security.rateLimitViolations >= this.config.alertThresholds.rateLimitViolations) {
      this.sendAlert('High number of rate limit violations detected', {
        violations: this.metrics.security.rateLimitViolations,
        threshold: this.config.alertThresholds.rateLimitViolations
      })
    }
  }

  /**
   * Check suspicious IP threshold
   */
  private static checkSuspiciousIPThreshold(): void {
    if (!this.config.alertOnSuspiciousActivity) return

    if (this.metrics.security.blockedIPs >= this.config.alertThresholds.suspiciousIPs) {
      this.sendAlert('High number of suspicious IPs detected', {
        blockedIPs: this.metrics.security.blockedIPs,
        threshold: this.config.alertThresholds.suspiciousIPs
      })
    }
  }

  /**
   * Send security alert
   */
  private static async sendAlert(message: string, data: Record<string, any>): Promise<void> {
    const alert = {
      timestamp: new Date().toISOString(),
      level: 'warning',
      message,
      data,
      metrics: this.getMetrics()
    }

    Logger.warn(`Security Alert: ${message}`, data)

    // Send to webhook if configured
    if (this.config.webhookUrl) {
      try {
        await fetch(this.config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        })
      } catch (error) {
        Logger.error('Failed to send security alert', error as Error)
      }
    }
  }

  /**
   * Get current metrics
   */
  static getMetrics(): Metrics {
    return JSON.parse(JSON.stringify(this.metrics))
  }

  /**
   * Reset metrics
   */
  static resetMetrics(): void {
    this.metrics = {
      requests: {
        total: 0,
        byStatus: {},
        byRoute: {},
        byMethod: {}
      },
      auth: {
        successful: 0,
        failed: 0,
        tokenRefreshes: 0
      },
      security: {
        rateLimitViolations: 0,
        suspiciousRequests: 0,
        blockedIPs: 0,
        csrfViolations: 0
      },
      performance: {
        averageResponseTime: 0,
        slowRequests: 0,
        errors: 0
      }
    }
    this.responseTimes = []
  }

  /**
   * Get health status
   */
  static getHealthStatus(): { status: 'healthy' | 'warning' | 'critical'; details: Record<string, any> } {
    const metrics = this.getMetrics()
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    const details: Record<string, any> = {}

    // Check error rate
    const errorRate = metrics.requests.total > 0 ? 
      (metrics.performance.errors / metrics.requests.total) * 100 : 0

    if (errorRate > 10) {
      status = 'critical'
      details.errorRate = `${errorRate.toFixed(2)}%`
    } else if (errorRate > 5) {
      status = 'warning'
      details.errorRate = `${errorRate.toFixed(2)}%`
    }

    // Check average response time
    if (metrics.performance.averageResponseTime > 2000) {
      status = status === 'critical' ? 'critical' : 'warning'
      details.averageResponseTime = `${metrics.performance.averageResponseTime.toFixed(2)}ms`
    }

    // Check authentication failures
    if (metrics.auth.failed > this.config.alertThresholds.failedAuthAttempts) {
      status = 'warning'
      details.authFailures = metrics.auth.failed
    }

    return { status, details }
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private static measurements = new Map<string, number>()

  /**
   * Start measuring performance
   */
  static start(key: string): void {
    this.measurements.set(key, Date.now())
  }

  /**
   * End measurement and return duration
   */
  static end(key: string): number {
    const startTime = this.measurements.get(key)
    if (!startTime) {
      return 0
    }

    const duration = Date.now() - startTime
    this.measurements.delete(key)
    return duration
  }

  /**
   * Measure async function execution time
   */
  static async measure<T>(key: string, fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = Date.now()
    const result = await fn()
    const duration = Date.now() - startTime

    Logger.debug(`Performance: ${key} took ${duration}ms`)
    return { result, duration }
  }

  /**
   * Measure sync function execution time
   */
  static measureSync<T>(key: string, fn: () => T): { result: T; duration: number } {
    const startTime = Date.now()
    const result = fn()
    const duration = Date.now() - startTime

    Logger.debug(`Performance: ${key} took ${duration}ms`)
    return { result, duration }
  }
}