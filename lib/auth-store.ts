import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

// Get the browser client (with cookie storage)
const supabase = createClient()

// Define Profile type directly
interface Profile {
  id: string
  full_name: string | null
  username: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  role: string
  is_online: boolean
  last_seen_at: string | null
  [key: string]: any
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  isInitialized: boolean
}

interface AuthActions {
  setAuth: (user: User | null, session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  signOut: () => Promise<void>
  updateOnlineStatus: (isOnline: boolean) => Promise<void>
  clearAuth: () => void
}

type AuthStore = AuthState & AuthActions

/**
 * Auth Store - In-Memory State Management
 * 
 * CRITICAL: NO localStorage or cookie persistence here!
 * Supabase handles all cookie storage via createBrowserClient
 * This store only manages in-memory state for React components
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  // Actions
  setAuth: (user: User | null, session: Session | null) => {
    set({ user, session })
  },

  setProfile: (profile: Profile | null) => {
    set({ profile })
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading })
  },

  setInitialized: (isInitialized: boolean) => {
    set({ isInitialized })
  },

  signOut: async () => {
    try {
      set({ isLoading: true })
      
      // Sign out user - Supabase will clear cookies automatically
      await supabase.auth.signOut()
      
      // Clear all auth data from memory
      set({ 
        user: null, 
        session: null, 
        profile: null,
        isLoading: false
      })
    } catch (error) {
      console.error('Error during sign out:', error)
      set({ isLoading: false })
    }
  },

  updateOnlineStatus: async (isOnline: boolean) => {
    try {
      const { user } = get()
      if (!user) return

      // Update profile directly
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_online: isOnline,
          last_seen_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (error) {
        console.error('Error updating online status:', error)
        return
      }
      
      // Update local profile state
      const { profile } = get()
      if (profile) {
        set({ 
          profile: { 
            ...profile, 
            is_online: isOnline,
            last_seen_at: new Date().toISOString()
          } 
        })
      }
    } catch (error) {
      console.error('Error updating online status:', error)
    }
  },

  clearAuth: () => {
    set({ 
      user: null, 
      session: null, 
      profile: null,
      isLoading: false,
      isInitialized: true
    })
  },
}))

// Utility functions for easier access
export const getAuthState = () => useAuthStore.getState()
export const isAuthenticated = () => !!useAuthStore.getState().user
export const getCurrentUser = () => useAuthStore.getState().user
export const getCurrentProfile = () => useAuthStore.getState().profile
export const getUserRole = () => useAuthStore.getState().profile?.role || 'S'