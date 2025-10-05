import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          username: string | null
          bio: string | null
          avatar_url: string | null
          role: 'S' | 'T' | 'C' | 'A' | 'SA'
          is_online: boolean
          onboarding_level: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
          profile_completion_percentage: number
          phone: string | null
          location: string | null
          timezone: string
          email_notifications: boolean
          push_notifications: boolean
          language_preference: string
          website_url: string | null
          linkedin_url: string | null
          github_url: string | null
          twitter_url: string | null
          expertise_areas: string[] | null
          years_of_experience: number | null
          hourly_rate: number | null
          grade_level: string | null
          subjects_of_interest: string[] | null
          learning_goals: string | null
          reputation_score: number
          total_posts: number
          total_comments: number
          followers_count: number
          following_count: number
          is_verified: boolean
          is_active: boolean
          is_premium: boolean
          created_at: string
          updated_at: string
          last_seen_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          username?: string | null
          bio?: string | null
          avatar_url?: string | null
          role?: 'S' | 'T' | 'C' | 'A' | 'SA'
          is_online?: boolean
          onboarding_level?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
          profile_completion_percentage?: number
          phone?: string | null
          location?: string | null
          timezone?: string
          email_notifications?: boolean
          push_notifications?: boolean
          language_preference?: string
          website_url?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          twitter_url?: string | null
          expertise_areas?: string[] | null
          years_of_experience?: number | null
          hourly_rate?: number | null
          grade_level?: string | null
          subjects_of_interest?: string[] | null
          learning_goals?: string | null
          reputation_score?: number
          total_posts?: number
          total_comments?: number
          followers_count?: number
          following_count?: number
          is_verified?: boolean
          is_active?: boolean
          is_premium?: boolean
          created_at?: string
          updated_at?: string
          last_seen_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          username?: string | null
          bio?: string | null
          avatar_url?: string | null
          role?: 'S' | 'T' | 'C' | 'A' | 'SA'
          is_online?: boolean
          onboarding_level?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
          profile_completion_percentage?: number
          phone?: string | null
          location?: string | null
          timezone?: string
          email_notifications?: boolean
          push_notifications?: boolean
          language_preference?: string
          website_url?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          twitter_url?: string | null
          expertise_areas?: string[] | null
          years_of_experience?: number | null
          hourly_rate?: number | null
          grade_level?: string | null
          subjects_of_interest?: string[] | null
          learning_goals?: string | null
          reputation_score?: number
          total_posts?: number
          total_comments?: number
          followers_count?: number
          following_count?: number
          is_verified?: boolean
          is_active?: boolean
          is_premium?: boolean
          created_at?: string
          updated_at?: string
          last_seen_at?: string
        }
      }
    }
  }
}