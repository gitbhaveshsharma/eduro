import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Cookies from 'js-cookie'

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

// Cookie storage implementation for auth state
const cookieStorage = {
  getItem: (name: string): string | null => {
    return Cookies.get(name) || null
  },
  setItem: (name: string, value: string): void => {
    Cookies.set(name, value, { 
      expires: 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
  },
  removeItem: (name: string): void => {
    Cookies.remove(name)
  },
}

// Enhanced cookie storage for Supabase session
const enhancedCookieStorage = {
  getItem: (name: string): string | null => {
    return cookieStorage.getItem(name)
  },
  setItem: (name: string, value: string): void => {
    cookieStorage.setItem(name, value)
    
    // Also set with Supabase standard naming for middleware compatibility
    if (name.includes('auth-storage')) {
      try {
        const sessionData = JSON.parse(value)
        if (sessionData?.user && sessionData?.session) {
          cookieStorage.setItem('supabase-auth-token', sessionData.session.access_token)
          cookieStorage.setItem('supabase-refresh-token', sessionData.session.refresh_token || '')
        }
      } catch (e) {
        // Not JSON, set as is
        cookieStorage.setItem('supabase-auth-token', value)
      }
    }
  },
  removeItem: (name: string): void => {
    cookieStorage.removeItem(name)
    
    // Also remove Supabase standard cookies
    if (name.includes('auth-storage')) {
      cookieStorage.removeItem('supabase-auth-token')
      cookieStorage.removeItem('supabase-refresh-token')
    }
  },
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      profile: null,
      isLoading: true,
      isInitialized: false,

      // Actions
      setAuth: (user, session) => {
        set({ user, session })
        
        // Store session token in cookies for SSR
        if (session?.access_token) {
          cookieStorage.setItem('supabase-auth-token', session.access_token)
          cookieStorage.setItem('supabase-refresh-token', session.refresh_token || '')
        } else {
          cookieStorage.removeItem('supabase-auth-token')
          cookieStorage.removeItem('supabase-refresh-token')
        }
      },

      setProfile: (profile) => {
        set({ profile })
      },

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      setInitialized: (isInitialized) => {
        set({ isInitialized })
      },

      signOut: async () => {
        try {
          set({ isLoading: true })
          
          // Sign out user
          await supabase.auth.signOut()
          
          // Clear all auth data
          set({ 
            user: null, 
            session: null, 
            profile: null,
            isLoading: false
          })
          
          // Clear cookies
          cookieStorage.removeItem('supabase-auth-token')
          cookieStorage.removeItem('supabase-refresh-token')
          
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
        cookieStorage.removeItem('supabase-auth-token')
        cookieStorage.removeItem('supabase-refresh-token')
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => enhancedCookieStorage),
      partialize: (state) => ({
        // Only persist essential user data, not loading states
        user: state.user,
        session: state.session,
        profile: state.profile,
      }),
    }
  )
)

// Utility functions for easier access
export const getAuthState = () => useAuthStore.getState()
export const isAuthenticated = () => !!useAuthStore.getState().user
export const getCurrentUser = () => useAuthStore.getState().user
export const getCurrentProfile = () => useAuthStore.getState().profile
export const getUserRole = () => useAuthStore.getState().profile?.role || 'S'