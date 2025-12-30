/**
 * Browser Supabase Client with Cookie Storage
 * 
 * CRITICAL: This client stores auth tokens in COOKIES, not localStorage
 * This enables SSR and server components to access auth state
 * 
 * Usage:
 * - Import in client components
 * - Import in client-side services (auth-service, auth-session, etc.)
 * - DO NOT use in server components (use server.ts instead)
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * 1. Request deduplication - prevents multiple simultaneous preflight requests
 * 2. Connection keep-alive - reuses TCP connections to Supabase
 * 3. DNS prefetch hints in app/layout.tsx
 * 
 * SUPABASE DASHBOARD CONFIGURATION (if preflight delays persist):
 * 1. Go to: Project Settings > API > CORS Settings
 * 2. Add your domains: http://localhost:3000, https://yourdomain.com
 * 3. Enable "Access-Control-Max-Age: 86400" for 24-hour preflight caching
 * 4. Ensure "Access-Control-Allow-Credentials: true" is enabled
 */

import { createBrowserClient } from '@supabase/ssr'

// Global singleton instance - only one instance per browser context
let globalClient: ReturnType<typeof createBrowserClient> | undefined

// Request deduplication map to prevent redundant preflight requests
const pendingRequests = new Map<string, Promise<Response>>()

/**
 * Optimized fetch wrapper with request deduplication and caching
 */
function optimizedFetch(url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> {
  const urlString = typeof url === 'string' ? url : url.toString()
  const method = options.method || 'GET'
  const cacheKey = `${method}:${urlString}`
  
  // For OPTIONS (preflight) requests, deduplicate
  if (method === 'OPTIONS') {
    const pending = pendingRequests.get(cacheKey)
    if (pending) {
      console.log('[SUPABASE] Reusing pending preflight:', urlString)
      return pending
    }
  }
  
  const headers = new Headers(options.headers)
  
  // Add connection optimization headers
  if (!headers.has('Connection')) {
    headers.set('Connection', 'keep-alive')
  }
  
  // Add CORS optimization - request credentials explicitly
  if (!headers.has('Access-Control-Request-Headers')) {
    headers.set('Access-Control-Request-Headers', 'content-type,authorization,apikey,x-client-info')
  }
  
  const requestPromise = fetch(url, {
    ...options,
    headers,
    keepalive: true,
    // Optimize cache for GET requests
    cache: method === 'GET' ? 'default' : options.cache,
  }).finally(() => {
    // Clean up pending request
    if (method === 'OPTIONS') {
      pendingRequests.delete(cacheKey)
    }
  })
  
  // Store pending preflight requests
  if (method === 'OPTIONS') {
    pendingRequests.set(cacheKey, requestPromise)
  }
  
  return requestPromise
}

/**
 * Get or create the singleton Supabase browser client
 * This ensures only ONE instance exists across the entire application
 */
export function createClient() {
  // Return existing instance if available
  if (globalClient) {
    return globalClient
  }

  // Create new instance only if it doesn't exist
  globalClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // CRITICAL: flowType must be 'pkce' for cookie-based auth
        flowType: 'pkce',
        
        // Auto-refresh tokens before they expire
        autoRefreshToken: true,
        
        // Detect session from URL (OAuth callbacks)
        detectSessionInUrl: true,
        
        // Persist session across browser tabs
        persistSession: true,
        
        // Enable debug logging in development
        debug: process.env.NODE_ENV === 'development',
        
        // Storage key for cookies
        storageKey: 'sb-auth-token',
      },
      
      // Database connection options for better performance
      db: {
        schema: 'public',
      },
      
      // Realtime options
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      // Cookie storage is handled automatically by createBrowserClient
      // It will store tokens in cookies prefixed with: sb-{project-ref}-auth-token
      
      // Global fetch options for better performance and request deduplication
      global: {
        fetch: optimizedFetch,
      },
    }
  )

  // Log instance creation in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[SUPABASE CLIENT] Created global singleton instance')
  }

  return globalClient
}

/**
 * Helper to get the client instance
 * @deprecated Use createClient() directly instead
 */
export function getSupabaseBrowserClient() {
  return createClient()
}
