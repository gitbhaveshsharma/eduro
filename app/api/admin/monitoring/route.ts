/**
 * Admin Dashboard API - Middleware Monitoring Endpoint
 * Demonstrates how to access middleware metrics and logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { Logger, MetricsCollector } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  try {
    // Get current metrics
    const metrics = MetricsCollector.getMetrics()
    
    // Get health status
    const health = MetricsCollector.getHealthStatus()
    
    // Get recent logs (only security and error logs for admin view)
    const securityLogs = Logger.getLogsByCategory('SECURITY')
    const errorLogs = Logger.getLogsByLevel(3) // ERROR level
    const recentLogs = Logger.getRecentLogs(50)
    
    return NextResponse.json({
      health,
      metrics: {
        requests: {
          total: metrics.requests.total,
          byStatus: metrics.requests.byStatus,
          topRoutes: Object.entries(metrics.requests.byRoute)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10),
          byMethod: metrics.requests.byMethod
        },
        auth: metrics.auth,
        security: metrics.security,
        performance: {
          averageResponseTime: Math.round(metrics.performance.averageResponseTime),
          slowRequests: metrics.performance.slowRequests,
          errors: metrics.performance.errors,
          errorRate: metrics.requests.total > 0 ? 
            ((metrics.performance.errors / metrics.requests.total) * 100).toFixed(2) + '%' : 
            '0%'
        }
      },
      logs: {
        security: securityLogs.slice(-20), // Last 20 security events
        errors: errorLogs.slice(-10), // Last 10 errors
        recent: recentLogs.slice(-10) // Last 10 logs
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    Logger.error('Admin dashboard API error', error as Error)
    
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    )
  }
}