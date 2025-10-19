/**
 * @deprecated This file is deprecated. Use the new SSR-compatible clients instead:
 * 
 * For CLIENT COMPONENTS (browser):
 * ```typescript
 * import { createClient } from '@/lib/supabase/client'
 * const supabase = createClient()
 * ```
 * 
 * For SERVER COMPONENTS (app directory):
 * ```typescript
 * import { createServerClient } from '@/lib/supabase/server'
 * const supabase = await createServerClient()
 * ```
 * 
 * For MIDDLEWARE:
 * Already configured in lib/middleware/supabase-middleware.ts
 * 
 * MIGRATION REASON:
 * The old client used localStorage which is NOT accessible in server-side code.
 * The new clients use cookies which work across client, server, and middleware.
 * This enables proper SSR and eliminates the "no session found" errors.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * @deprecated Use createClient() from @/lib/supabase/client instead
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    autoRefreshToken: true,
    debug: process.env.NODE_ENV === 'development'
  }
})
