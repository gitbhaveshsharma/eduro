import { createClient } from '@supabase/supabase-js'

// CRITICAL: Import the visibility fix BEFORE creating the Supabase client
// This patches document.hidden to prevent the visibility change bug

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    autoRefreshToken: true,
    // Let Supabase manage its own storage - don't override it
    // This ensures proper session refresh and token management
    debug: process.env.NODE_ENV === 'development'
  }
})
