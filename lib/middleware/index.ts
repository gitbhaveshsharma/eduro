/**
 * Middleware System Index
 * Exports all middleware components for easy import
 */

// Types and interfaces
export * from './types'

// Configuration
export { default as middlewareConfig } from './config'

// Utilities
export * from './auth-utils'
export * from './security-utils'
export * from './monitoring'
export * from './route-protection'

// Main middleware classes
export { AuthHandler, RoleHierarchy, SessionManager } from './auth-utils'
export { 
  IPUtils, 
  RateLimiter, 
  RequestValidator, 
  CryptoUtils, 
  SecurityEventTracker,
  UserAgentAnalyzer,
  SecurityUtils 
} from './security-utils'
export { 
  Logger, 
  MetricsCollector, 
  PerformanceMonitor 
} from './monitoring'
export { RouteProtector } from './route-protection'