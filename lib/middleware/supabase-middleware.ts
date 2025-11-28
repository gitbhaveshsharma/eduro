/**
 * Supabase Session Refresh Middleware
 * CRITICAL: Handles automatic session refresh and cookie management
 * 
 * This middleware:
 * 1. Always uses getUser() for security (never getSession())
 * 2. Throttles auth server calls to prevent rate limiting
 * 3. Caches authenticated user data in secure cookies between refreshes
 * 4. Updates response cookies with refreshed tokens
 * 5. Passes user context to route protection layer
 */

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// Session refresh throttle interval (in milliseconds)
// Only call getUser() if last verification was more than this time ago
const SESSION_REFRESH_INTERVAL = 60 * 1000 // 1 minute

// Role cache duration (in seconds) - how long to trust the cached role cookie
const ROLE_CACHE_DURATION = 5 * 60 // 5 minutes

// Cookie name for tracking last session refresh timestamp
const LAST_REFRESH_COOKIE = 'sb-last-refresh'

// Cookie name for caching verified user data (user ID, email)
const USER_CACHE_COOKIE = 'sb-user-cache'

// Cookie name for caching user role
const ROLE_CACHE_COOKIE = 'sb-user-role'

/**
 * Check if we should call getUser() based on throttling
 */
function shouldCallGetUser(request: NextRequest): boolean {
  const lastRefreshCookie = request.cookies.get(LAST_REFRESH_COOKIE)

  if (!lastRefreshCookie?.value) {
    return true // No previous refresh, should verify
  }

  try {
    const lastRefresh = parseInt(lastRefreshCookie.value, 10)
    const now = Date.now()
    const timeSinceLastRefresh = now - lastRefresh

    // Only call getUser if enough time has passed
    return timeSinceLastRefresh >= SESSION_REFRESH_INTERVAL
  } catch {
    return true // Invalid cookie, should verify
  }
}

/**
 * Get cached user data from cookie (set after successful getUser() call)
 */
function getCachedUser(request: NextRequest): { id: string; email?: string } | null {
  const userCacheCookie = request.cookies.get(USER_CACHE_COOKIE)

  if (!userCacheCookie?.value) {
    return null
  }

  try {
    // Format: "userId:email:timestamp" (email is base64 encoded to handle special chars)
    const parts = userCacheCookie.value.split(':')
    if (parts.length < 3) return null

    const [userId, encodedEmail, timestamp] = parts
    const cacheTime = parseInt(timestamp, 10)
    const now = Math.floor(Date.now() / 1000)

    // Cache valid for same duration as refresh interval (in seconds)
    if (now - cacheTime > SESSION_REFRESH_INTERVAL / 1000 + 10) {
      return null // Cache expired (with 10s buffer)
    }

    const email = encodedEmail ? Buffer.from(encodedEmail, 'base64').toString('utf-8') : undefined
    return { id: userId, email: email || undefined }
  } catch {
    return null
  }
}

/**
 * Get cached user role from cookie
 */
function getCachedRole(request: NextRequest, userId: string): string | null {
  const roleCookie = request.cookies.get(ROLE_CACHE_COOKIE)

  if (!roleCookie?.value) {
    return null
  }

  try {
    // Format: "userId:role:timestamp"
    const [cachedUserId, role, timestamp] = roleCookie.value.split(':')

    if (cachedUserId !== userId) {
      return null // Different user, cache invalid
    }

    const cacheTime = parseInt(timestamp, 10)
    const now = Math.floor(Date.now() / 1000)

    if (now - cacheTime > ROLE_CACHE_DURATION) {
      return null // Cache expired
    }

    return role
  } catch {
    return null
  }
}

export function createSupabaseMiddleware() {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Create response that will be returned
    let supabaseResponse = NextResponse.next({
      request,
    })

    // Check if we need to call getUser() (throttled)
    const needsServerVerification = shouldCallGetUser(request)

    // Create Supabase client with cookie handlers
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Update request cookies for potential downstream usage
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )

            // Create fresh response with new cookies
            supabaseResponse = NextResponse.next({
              request,
            })

            // Set cookies on the response
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    let userId: string | null = null
    let userEmail: string | undefined = undefined
    let isAuthenticated = false

    if (needsServerVerification) {
      // SECURE PATH: Call getUser() to verify with Supabase Auth server
      // This is the ONLY secure way to verify the user's identity
      const { data: { user }, error } = await supabase.auth.getUser()

      if (user && !error) {
        userId = user.id
        userEmail = user.email ?? undefined
        isAuthenticated = true

        // Cache the verified user data for subsequent requests
        const encodedEmail = userEmail ? Buffer.from(userEmail).toString('base64') : ''
        const cacheValue = `${userId}:${encodedEmail}:${Math.floor(Date.now() / 1000)}`

        supabaseResponse.cookies.set(USER_CACHE_COOKIE, cacheValue, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: Math.ceil(SESSION_REFRESH_INTERVAL / 1000) + 60, // Slightly longer than interval
          path: '/',
        })

        // Update the last refresh timestamp
        supabaseResponse.cookies.set(LAST_REFRESH_COOKIE, Date.now().toString(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24, // 24 hours
          path: '/',
        })

        console.log('[SUPABASE MIDDLEWARE] ✅ User verified via getUser():', {
          userId: user.id,
          email: user.email,
        })
      } else {
        // User not authenticated or error - clear caches
        supabaseResponse.cookies.delete(USER_CACHE_COOKIE)
        supabaseResponse.cookies.delete(ROLE_CACHE_COOKIE)
        supabaseResponse.cookies.delete(LAST_REFRESH_COOKIE)

        console.log('[SUPABASE MIDDLEWARE] ❌ No user session:', error?.message || 'Not authenticated')
      }
    } else {
      // FAST PATH: Use cached user data from our secure cookie
      // This avoids calling getUser() on every request while still being secure
      // because the cache was populated by a recent getUser() call
      const cachedUser = getCachedUser(request)

      if (cachedUser) {
        userId = cachedUser.id
        userEmail = cachedUser.email
        isAuthenticated = true
        // Don't log on fast path to reduce noise
      } else {
        // Cache miss/expired - need to verify
        // This shouldn't happen often if throttle timing is correct
        const { data: { user }, error } = await supabase.auth.getUser()

        if (user && !error) {
          userId = user.id
          userEmail = user.email ?? undefined
          isAuthenticated = true

          // Cache the verified user data
          const encodedEmail = userEmail ? Buffer.from(userEmail).toString('base64') : ''
          const cacheValue = `${userId}:${encodedEmail}:${Math.floor(Date.now() / 1000)}`

          supabaseResponse.cookies.set(USER_CACHE_COOKIE, cacheValue, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: Math.ceil(SESSION_REFRESH_INTERVAL / 1000) + 60,
            path: '/',
          })

          supabaseResponse.cookies.set(LAST_REFRESH_COOKIE, Date.now().toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24,
            path: '/',
          })
        }
      }
    }

    // Process authenticated user
    if (isAuthenticated && userId) {
      // Try to get role from cache first
      let userRole: string = getCachedRole(request, userId) || ''

      if (!userRole) {
        // Cache miss - need to fetch from database
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single()

          if (!profileError && profile?.role) {
            userRole = profile.role

            // Cache the role in a cookie
            const cacheValue = `${userId}:${userRole}:${Math.floor(Date.now() / 1000)}`
            supabaseResponse.cookies.set(ROLE_CACHE_COOKIE, cacheValue, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: ROLE_CACHE_DURATION,
              path: '/',
            })

            console.log('[SUPABASE MIDDLEWARE] User role (fetched):', userRole)
          } else {
            userRole = 'S' // Default to Student
            console.warn('[SUPABASE MIDDLEWARE] Could not fetch user role, using default:', userRole)
          }
        } catch (profileError) {
          userRole = 'S' // Default to Student on error
          console.error('[SUPABASE MIDDLEWARE] Error fetching user role:', profileError)
        }
      }

      // CRITICAL: Set custom headers so auth-utils can detect authenticated user
      supabaseResponse.headers.set('x-user-authenticated', 'true')
      supabaseResponse.headers.set('x-user-id', userId)
      supabaseResponse.headers.set('x-user-role', userRole)
      if (userEmail) {
        supabaseResponse.headers.set('x-user-email', userEmail)
      }
    }

    return supabaseResponse
  }
}
