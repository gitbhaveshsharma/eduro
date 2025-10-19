import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for Server Components and Server Actions
 * 
 * CRITICAL: This client reads auth tokens from COOKIES
 * Middleware refreshes the session and updates cookies automatically
 * 
 * Usage:
 * - Server Components (app directory)
 * - Server Actions
 * - API Route Handlers
 * 
 * DO NOT use in:
 * - Client Components (use client.ts instead)
 * - Middleware (use supabase-middleware.ts instead)
 */

export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Get the current authenticated user from Supabase
 * This is a convenience method that creates a client and gets the user
 */
export async function getCurrentUser() {
  const supabase = await createServerClient()
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('[SERVER CLIENT] Error getting user:', error.message)
    return null
  }

  return user
}

/**
 * Get the current session from Supabase
 * This is a convenience method that creates a client and gets the session
 */
export async function getCurrentSession() {
  const supabase = await createServerClient()
  
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error('[SERVER CLIENT] Error getting session:', error.message)
    return null
  }

  return session
}
