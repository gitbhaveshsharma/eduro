'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'
import { useAuthStore } from '@/lib/auth-store'
import { useProfileStore } from '@/lib/store/profile.store'
import { authSessionManager } from '@/lib/auth-session'

// Get the browser client (with cookie storage)
const supabase = createClient()

interface AuthProviderProps {
    children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const { setAuth, setProfile, setLoading, setInitialized, clearAuth } = useAuthStore()
    const { loadCurrentProfile, clearCurrentProfile } = useProfileStore()

    // Track current token to prevent duplicate processing
    const currentTokenRef = useRef<string | null>(null)
    const isProcessingRef = useRef(false)

    useEffect(() => {
        let mounted = true

        // Get initial session
        const getInitialSession = async () => {
            try {
                const session: Session | null = await authSessionManager.getSession()

                if (!mounted) return

                if (session?.user) {
                    currentTokenRef.current = session.access_token
                    setAuth(session.user, session)

                    // CRITICAL: Defer profile loading to prevent blocking
                    setTimeout(async () => {
                        if (!mounted) return

                        try {
                            const { data: profile, error } = await supabase
                                .from('profiles')
                                .select('*')
                                .eq('id', session.user.id)
                                .single()

                            if (!error && profile && mounted) {
                                setProfile(profile)
                                await loadCurrentProfile()
                            }
                        } catch (error) {
                            console.error('[AUTH-PROVIDER] Error loading initial profile:', error)
                        }
                    }, 0)
                } else {
                    clearAuth()
                    clearCurrentProfile()
                }
            } catch (error) {
                console.error('[AUTH-PROVIDER] Error in getInitialSession:', error)
                if (mounted) {
                    clearAuth()
                    clearCurrentProfile()
                }
            } finally {
                if (mounted) {
                    setLoading(false)
                    setInitialized(true)
                }
            }
        }

        getInitialSession()

        // CRITICAL: Non-blocking auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event: AuthChangeEvent, session: Session | null) => {
                if (!mounted) return

                // Don't interfere on OAuth callback page
                const isCallbackPage = window.location.pathname === '/auth/callback'
                if (isCallbackPage) return

                // console.log('[AUTH-PROVIDER] Auth event:', event)

                const newToken = session?.access_token || null

                switch (event) {
                    case 'SIGNED_IN':
                        // OPTIMIZATION: Skip if same token (visibility spam)
                        if (newToken === currentTokenRef.current) {
                            // console.log('[AUTH-PROVIDER] Token unchanged, skipping')
                            return
                        }

                        // CRITICAL: Prevent concurrent processing
                        if (isProcessingRef.current) {
                            //console.log('[AUTH-PROVIDER] Already processing, skipping')
                            return
                        }

                        if (session?.user) {
                            isProcessingRef.current = true
                            currentTokenRef.current = newToken

                            // Update auth immediately (non-blocking)
                            setAuth(session.user, session)

                            // CRITICAL: Defer profile loading to next event loop tick
                            // This releases Supabase lock IMMEDIATELY
                            setTimeout(async () => {
                                if (!mounted) {
                                    isProcessingRef.current = false
                                    return
                                }

                                try {
                                    //console.log('[AUTH-PROVIDER] Loading profile after SIGNED_IN')
                                    await loadCurrentProfile()
                                } catch (error) {
                                    console.error('[AUTH-PROVIDER] Error loading profile on SIGNED_IN:', error)
                                } finally {
                                    isProcessingRef.current = false
                                }
                            }, 0)
                        }
                        break

                    case 'TOKEN_REFRESHED':
                        // Update token only, don't reload profile
                        if (session?.user) {
                            currentTokenRef.current = newToken
                            setAuth(session.user, session)
                            //console.log('[AUTH-PROVIDER] Token refreshed')
                        }
                        break

                    case 'USER_UPDATED':
                        if (session?.user) {
                            currentTokenRef.current = newToken
                            setAuth(session.user, session)

                            // Defer profile reload
                            setTimeout(async () => {
                                if (!mounted) return

                                try {
                                    //console.log('[AUTH-PROVIDER] Loading profile after USER_UPDATED')
                                    await loadCurrentProfile()
                                } catch (error) {
                                    console.error('[AUTH-PROVIDER] Error loading profile on USER_UPDATED:', error)
                                }
                            }, 0)
                        }
                        break

                    case 'SIGNED_OUT':
                        currentTokenRef.current = null
                        isProcessingRef.current = false
                        clearAuth()
                        clearCurrentProfile()
                        // console.log('[AUTH-PROVIDER] User signed out')
                        break

                    default:
                    // console.log('[AUTH-PROVIDER] Unhandled event:', event)
                }
            }
        )

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    return <>{children}</>
}
