/**
 * Supabase Session Refresh Middleware
 * CRITICAL: Handles automatic session refresh and cookie management
 * 
 * This middleware:
 * 1. Reads auth cookies from the request
 * 2. Validates and refreshes the session if needed
 * 3. Updates response cookies with refreshed tokens
 * 4. Passes user context to route protection layer
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export function createSupabaseMiddleware() {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Create response that will be returned
    let supabaseResponse = NextResponse.next({
      request,
    })

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
            cookiesToSet.forEach(({ name, value, options }) =>
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

    // CRITICAL: This getUser() call:
    // 1. Validates the current session
    // 2. Refreshes tokens if needed
    // 3. Updates cookies via setAll() above
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    // Log authentication state
    if (user) {
      console.log('[SUPABASE MIDDLEWARE] ✅ User authenticated:', {
        userId: user.id,
        email: user.email,
      })
      
      // CRITICAL: Set custom header so auth-utils can detect authenticated user
      // This bridges the gap between Supabase auth and the existing auth system
      supabaseResponse.headers.set('x-user-authenticated', 'true')
      supabaseResponse.headers.set('x-user-id', user.id)
      if (user.email) {
        supabaseResponse.headers.set('x-user-email', user.email)
      }
    } else {
      console.log('[SUPABASE MIDDLEWARE] ❌ No user session:', error?.message || 'Not authenticated')
    }

    // IMPORTANT: Return the response with updated cookies and headers
    // Server components will automatically read these cookies
    // Auth-utils will read the headers to know user is authenticated
    return supabaseResponse
  }
}
