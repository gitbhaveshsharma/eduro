'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/auth-store'
import { useProfileStore } from '@/lib/store/profile.store'
import { AuthLoadingSpinner } from '@/components/ui/loading-spinner'

interface AuthProviderProps {
    children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const { setAuth, setProfile, setLoading, setInitialized, clearAuth, isLoading, isInitialized } = useAuthStore()
    const { loadCurrentProfile, clearCurrentProfile } = useProfileStore()

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) {
                    console.error('Error getting session:', error)
                    clearAuth()
                    clearCurrentProfile()
                    return
                }

                if (session?.user) {
                    setAuth(session.user, session)

                    // Fetch user profile for auth store
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single()

                    if (!profileError && profile) {
                        setProfile(profile)

                        // Also load into profile store for consistency
                        await loadCurrentProfile()

                        // Update online status
                        await supabase.rpc('update_online_status', { is_online_status: true })
                    }
                } else {
                    clearAuth()
                    clearCurrentProfile()
                }
            } catch (error) {
                console.error('Error in getInitialSession:', error)
                clearAuth()
                clearCurrentProfile()
            } finally {
                setLoading(false)
                setInitialized(true)
            }
        }

        getInitialSession()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                // console.log('Auth state changed:', event, session?.user?.id)

                // Don't interfere if we're on the OAuth callback page - let it handle its own auth
                const isCallbackPage = window.location.pathname === '/auth/callback'

                if (isCallbackPage) {
                    // console.log('On callback page, skipping auth provider handling')
                    return
                }

                switch (event) {
                    case 'SIGNED_IN':
                        if (session?.user) {
                            setAuth(session.user, session)

                            // Fetch user profile for auth store
                            const { data: profile, error } = await supabase
                                .from('profiles')
                                .select('*')
                                .eq('id', session.user.id)
                                .single()

                            if (!error && profile) {
                                setProfile(profile)

                                // Also load into profile store for consistency
                                await loadCurrentProfile()

                                // Update online status
                                await supabase.rpc('update_online_status', { is_online_status: true })
                            }
                        }
                        break

                    case 'SIGNED_OUT':
                        clearAuth()
                        clearCurrentProfile()
                        break

                    case 'TOKEN_REFRESHED':
                        if (session?.user) {
                            setAuth(session.user, session)
                        }
                        break

                    case 'USER_UPDATED':
                        if (session?.user) {
                            setAuth(session.user, session)
                            // Reload profile to get latest data
                            await loadCurrentProfile()
                        }
                        break

                    default:
                        break
                }
            }
        )

        // Handle browser close/refresh to update online status
        const handleBeforeUnload = async () => {
            try {
                await supabase.rpc('update_online_status', { is_online_status: false })
            } catch (error) {
                console.error('Error updating online status on unload:', error)
            }
        }

        // Handle visibility change to update online status
        const handleVisibilityChange = async () => {
            try {
                const isOnline = !document.hidden
                await supabase.rpc('update_online_status', { is_online_status: isOnline })
            } catch (error) {
                console.error('Error updating online status on visibility change:', error)
            }
        }

        // Add event listeners
        window.addEventListener('beforeunload', handleBeforeUnload)
        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Cleanup function
        return () => {
            subscription.unsubscribe()
            window.removeEventListener('beforeunload', handleBeforeUnload)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [setAuth, setProfile, setLoading, setInitialized, clearAuth, loadCurrentProfile, clearCurrentProfile])

    // // Show loading spinner while initializing authentication
    // if (isLoading || !isInitialized) {
    //     return <AuthLoadingSpinner />
    // }

    return <>{children}</>
}