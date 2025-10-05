# Enterprise-Grade Middleware System

## Overview

This middleware system provides comprehensive security, authentication, authorization, and monitoring capabilities for your Next.js application. It's designed to be enterprise-ready with features like rate limiting, IP filtering, CSRF protection, security headers, comprehensive logging, and more.

## Features

### 🔐 Authentication & Authorization
- **Multi-provider authentication** (Supabase integration)
- **Role-based access control** (Student, Teacher, Coach, Admin, Super Admin)
- **Permission-based authorization**
- **Session management** with automatic expiry
- **Email/Phone verification** enforcement

### 🛡️ Security Protection
- **Rate limiting** (global, per-user, per-IP, per-route)
- **IP whitelisting/blacklisting**
- **CSRF protection** with secure token validation
- **XSS and injection prevention**
- **Request size validation**
- **Input sanitization**
- **Security headers** (CSP, HSTS, etc.)
- **CORS configuration**

### 📊 Monitoring & Logging
- **Comprehensive request/response logging**
- **Security event tracking**
- **Performance metrics collection**
- **Real-time monitoring** with alerting
- **Suspicious activity detection**
- **Rate limit violation tracking**

### 🔧 Advanced Features
- **API key authentication**
- **Custom validation rules**
- **Geo-location tracking**
- **Bot detection**
- **Mobile device detection**
- **Configurable error pages**

## Installation

The middleware system is already integrated into your project. Make sure you have the required environment variables set up:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
API_KEYS=key1,key2,key3
SECURITY_WEBHOOK_URL=https://your-monitoring-service.com/webhook
LOGGING_WEBHOOK_URL=https://your-logging-service.com/webhook
```

## Configuration

### Basic Configuration

The middleware is configured in `/lib/middleware/config.ts`. Here's how to customize it:

```typescript
import { middlewareConfig } from '@/lib/middleware/config'

// Enable/disable the entire middleware system
middlewareConfig.enabled = true

// Configure debugging (automatically set based on NODE_ENV)
middlewareConfig.debug = false

// Configure global rate limiting
middlewareConfig.rateLimiting.global = {
  requests: 1000,
  window: RateLimitWindow.HOUR
}
```

### Route-Specific Protection

Configure protection for specific routes:

```typescript
// In config.ts
const routeProtections = {
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
  
  '/api/upload/*': {
    securityLevel: SecurityLevel.AUTHENTICATED,
    allowedMethods: ['POST'],
    maxRequestSize: 10485760, // 10MB
    rateLimiting: {
      requests: 5,
      window: RateLimitWindow.MINUTE
    }
  }
}
```

### Custom Validation

Add custom validation logic for specific routes:

```typescript
'/api/special-endpoint': {
  securityLevel: SecurityLevel.CUSTOM,
  customValidator: async (context) => {
    // Your custom validation logic
    const { user, request } = context
    
    // Example: Only allow during business hours
    const hour = new Date().getHours()
    if (hour < 9 || hour > 17) {
      return false
    }
    
    // Example: Check custom user attribute
    if (user && user.role === UserRole.STUDENT) {
      // Additional validation for students
      return checkStudentAccess(user.id)
    }
    
    return true
  }
}
```

## Security Headers

The middleware automatically applies security headers. Customize them in the config:

```typescript
middlewareConfig.security.headers = {
  contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline';",
  strictTransportSecurity: 'max-age=31536000; includeSubDomains',
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin'
}
```

## Rate Limiting

Configure different types of rate limiting:

```typescript
// Global rate limiting
middlewareConfig.rateLimiting.global = {
  requests: 1000,
  window: RateLimitWindow.HOUR
}

// Per-user rate limiting
middlewareConfig.rateLimiting.perUser = {
  requests: 500,
  window: RateLimitWindow.HOUR
}

// Per-IP rate limiting
middlewareConfig.rateLimiting.perIP = {
  requests: 200,
  window: RateLimitWindow.HOUR
}

// Route-specific rate limiting
'/api/auth/login': {
  rateLimiting: {
    requests: 5,
    window: RateLimitWindow.MINUTE
  }
}
```

## Monitoring and Logging

### Enable Logging

```typescript
middlewareConfig.logging = {
  enabled: true,
  logLevel: 'info',
  logRequests: true,
  logSecurity: true,
  anonymizeIPs: true // For GDPR compliance
}
```

### Set Up Monitoring

```typescript
middlewareConfig.monitoring = {
  enabled: true,
  alertOnSuspiciousActivity: true,
  alertThresholds: {
    failedAuthAttempts: 10,
    rateLimitViolations: 50,
    suspiciousIPs: 5
  },
  webhookUrl: process.env.SECURITY_WEBHOOK_URL
}
```

### Access Logs and Metrics

```typescript
import { Logger, MetricsCollector } from '@/lib/middleware'

// Get recent logs
const recentLogs = Logger.getRecentLogs(100)

// Get security logs
const securityLogs = Logger.getLogsByCategory('SECURITY')

// Get current metrics
const metrics = MetricsCollector.getMetrics()

// Get health status
const health = MetricsCollector.getHealthStatus()
```

## API Usage

### Protecting API Routes

API routes are automatically protected based on your configuration. You can also add manual checks:

```typescript
// pages/api/admin/users.ts
import { NextRequest, NextResponse } from 'next/server'
import { AuthHandler } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  // Manual auth check (optional, middleware handles this automatically)
  const user = await AuthHandler.validateUser(request)
  
  if (!user || !AuthHandler.hasRole(user, [UserRole.ADMIN])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  // Your API logic here
  return NextResponse.json({ users: [] })
}
```

### Custom Rate Limiting

```typescript
import { RateLimiter } from '@/lib/middleware'

export async function POST(request: NextRequest) {
  // Custom rate limiting
  const rateLimitConfig = {
    requests: 10,
    window: RateLimitWindow.MINUTE
  }
  
  const key = `custom:${request.ip}:${request.nextUrl.pathname}`
  const rateLimitState = RateLimiter.isRateLimited(key, rateLimitConfig)
  
  if (rateLimitState.isLimited) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }
  
  // Your API logic here
}
```

## Security Event Handling

Monitor and respond to security events:

```typescript
import { SecurityEventTracker, SecurityEventType } from '@/lib/middleware'

// Check for suspicious IPs
const suspiciousIPs = SecurityEventTracker.getSuspiciousIPs()

// Get events for specific IP
const events = SecurityEventTracker.getEventsForIP('192.168.1.1')

// Clear suspicious status
SecurityEventTracker.clearSuspiciousIP('192.168.1.1')
```

## Best Practices

### 1. Environment-Specific Configuration

```typescript
// Production settings
if (process.env.NODE_ENV === 'production') {
  middlewareConfig.debug = false
  middlewareConfig.logging.anonymizeIPs = true
  middlewareConfig.monitoring.alertOnSuspiciousActivity = true
  middlewareConfig.security.headers.strictTransportSecurity = 'max-age=31536000; includeSubDomains; preload'
}

// Development settings
if (process.env.NODE_ENV === 'development') {
  middlewareConfig.rateLimiting.enabled = false
  middlewareConfig.logging.logRequests = true
}
```

### 2. Gradual Rollout

Start with basic protection and gradually enable more features:

```typescript
// Phase 1: Basic protection
middlewareConfig.enabled = true
middlewareConfig.rateLimiting.enabled = false
middlewareConfig.security.csrf = undefined

// Phase 2: Add rate limiting
middlewareConfig.rateLimiting.enabled = true

// Phase 3: Add CSRF protection
middlewareConfig.security.csrf = {
  tokenLength: 32,
  cookieName: '__csrf_token',
  headerName: 'X-CSRF-Token',
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS']
}
```

### 3. Monitor Performance

```typescript
import { PerformanceMonitor } from '@/lib/middleware'

// Monitor specific operations
const { result, duration } = await PerformanceMonitor.measure('database-query', async () => {
  return await database.query('SELECT * FROM users')
})

console.log(`Database query took ${duration}ms`)
```

### 4. Handle Errors Gracefully

```typescript
// Custom error pages
middlewareConfig.errorPages = {
  unauthorized: '/login',
  forbidden: '/403',
  rateLimited: '/rate-limit',
  serverError: '/500'
}
```

## Troubleshooting

### Common Issues

1. **Rate limiting too aggressive**: Adjust the limits in config
2. **CSRF token errors**: Ensure tokens are properly included in forms
3. **IP blocking issues**: Check IP whitelist/blacklist configuration
4. **Performance issues**: Monitor logs and adjust rate limits

### Debug Mode

Enable debug mode for detailed logging:

```typescript
middlewareConfig.debug = true
middlewareConfig.logging.logLevel = 'debug'
```

### Health Check Endpoint

Create a health check endpoint to monitor middleware status:

```typescript
// pages/api/health.ts
import { MetricsCollector } from '@/lib/middleware'

export async function GET() {
  const health = MetricsCollector.getHealthStatus()
  const metrics = MetricsCollector.getMetrics()
  
  return Response.json({
    status: health.status,
    details: health.details,
    metrics: {
      totalRequests: metrics.requests.total,
      errorRate: (metrics.performance.errors / metrics.requests.total) * 100,
      averageResponseTime: metrics.performance.averageResponseTime
    }
  })
}
```

## Security Considerations

1. **Regular Updates**: Keep dependencies updated
2. **Secret Management**: Use environment variables for sensitive data
3. **Monitoring**: Set up alerts for security events
4. **Backup Plans**: Have fallback mechanisms for rate limiting
5. **Testing**: Regularly test security measures

## Performance Tips

1. **Redis Integration**: For production, replace in-memory stores with Redis
2. **CDN Usage**: Use CDN for static assets
3. **Caching**: Implement appropriate caching strategies
4. **Database Optimization**: Optimize database queries
5. **Monitoring**: Use APM tools for performance monitoring

This middleware system provides enterprise-grade security while maintaining flexibility and performance. Customize it according to your specific needs and gradually enable features as required.