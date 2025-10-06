'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef, useCallback } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/auth-store'
import { authToasts } from '@/lib/toast'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'
import { getAuthRedirectDestination } from '@/lib/utils/auth-redirect'

export default function AuthCallbackPage() {
    const router = useRouter()
    const { setAuth, setProfile } = useAuthStore()
    const [isProcessing, setIsProcessing] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const hasProcessed = useRef(false)
    const timeoutRef = useRef<NodeJS.Timeout>()
    const listenerCleanupRef = useRef<(() => void) | null>(null)

    const processSuccessfulAuth = useCallback(async (session: Session, user: User) => {
        try {
            console.log('Processing successful authentication for:', user.email)

            setAuth(user, session)

            console.log('Fetching user profile...')
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (!profileError && profile) {
                setProfile(profile)
                console.log('Profile loaded successfully, onboarding level:', profile.onboarding_level)
            } else {
                console.log('Profile not found or error:', profileError?.message)
                setProfile(null)
            }

            try {
                await supabase
                    .from('profiles')
                    .update({
                        is_online: true,
                        last_seen_at: new Date().toISOString()
                    })
                    .eq('id', user.id)
                console.log('Online status updated')
            } catch (statusError) {
                console.warn('Failed to update online status:', statusError)
            }

            const sp2 = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
            const redirectParam = sp2.get('redirect')
            const redirectResult = getAuthRedirectDestination(profile || null, redirectParam || undefined)
            console.log('Redirect result:', redirectResult)

            authToasts.loginSuccess(redirectResult.message || 'Welcome back!')

            await new Promise(resolve => setTimeout(resolve, 500))

            console.log('Redirecting to:', redirectResult.destination)
            router.push(redirectResult.destination)

        } catch (error) {
            console.error('Error processing successful auth:', error)
            throw error
        }
    }, [router, setAuth, setProfile])

    useEffect(() => {
        if (hasProcessed.current) {
            return
        }

        const waitForAuthSession = (timeoutMs: number) => {
            if (typeof window === 'undefined') {
                return {
                    promise: Promise.resolve<Session | null>(null),
                    stop: () => { }
                }
            }

            let settled = false
            let subscription: { unsubscribe: () => void } | null = null
            let timeoutId: ReturnType<typeof setTimeout> | null = null

            let resolvePromise: (value: Session | null) => void = () => { }

            const promise = new Promise<Session | null>((resolve) => {
                resolvePromise = resolve
            })

            const cleanup = () => {
                if (subscription) {
                    subscription.unsubscribe()
                    subscription = null
                }
                if (timeoutId) {
                    clearTimeout(timeoutId)
                    timeoutId = null
                }
            }

            const { data } = supabase.auth.onAuthStateChange((event, session) => {
                if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user && !settled) {
                    settled = true
                    cleanup()
                    resolvePromise(session)
                }
            })

            subscription = data.subscription

            timeoutId = setTimeout(() => {
                if (!settled) {
                    settled = true
                    cleanup()
                    resolvePromise(null)
                }
            }, timeoutMs)

            const stop = () => {
                if (!settled) {
                    settled = true
                    resolvePromise(null)
                }
                cleanup()
                listenerCleanupRef.current = null
            }

            listenerCleanupRef.current = stop

            return { promise, stop }
        }

        const handleAuthCallback = async () => {
            hasProcessed.current = true

            try {
                console.log('Starting OAuth callback processing...')

                const { promise: sessionPromise, stop: stopSessionListener } = waitForAuthSession(20000)

                const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
                const oauthError = urlParams.get('error')
                const oauthErrorDescription = urlParams.get('error_description')

                if (oauthError) {
                    console.error('OAuth error:', oauthError, oauthErrorDescription)
                    setError(oauthErrorDescription || 'Authentication failed')
                    authToasts.loginError(oauthErrorDescription || 'Authentication failed')
                    setTimeout(() => router.push('/login'), 2000)
                    stopSessionListener()
                    return
                }

                const initialSessionResult = await supabase.auth.getSession()

                if (initialSessionResult.error) {
                    console.warn('Initial session lookup error:', initialSessionResult.error)
                }

                const existingSession = initialSessionResult.data?.session

                if (existingSession?.user) {
                    console.log('Existing session detected for user:', existingSession.user.email)
                    await processSuccessfulAuth(existingSession, existingSession.user)
                    stopSessionListener()
                    return
                }

                const code = urlParams.get('code')

                if (!code) {
                    console.warn('No authorization code found, waiting for auth state change...')

                    const listenerSession = await sessionPromise

                    if (listenerSession?.user) {
                        console.log('Session resolved via auth listener for user:', listenerSession.user.email)
                        await processSuccessfulAuth(listenerSession, listenerSession.user)
                        stopSessionListener()
                        return
                    }

                    console.error('No authorization code found and no auth state change received')
                    setError('No authorization code received')
                    authToasts.loginError('Authentication failed. No authorization code received.')
                    setTimeout(() => router.push('/login'), 2000)
                    stopSessionListener()
                    return
                }

                console.log('Authorization code found, processing...')

                timeoutRef.current = setTimeout(() => {
                    console.error('Auth callback timeout')
                    setError('Authentication timeout')
                    authToasts.loginError('Authentication timeout. Please try again.')
                    router.push('/login')
                }, 30000)

                try {
                    console.log('Attempting direct code exchange...')
                    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

                    if (exchangeError) {
                        console.error('Direct code exchange failed:', exchangeError)
                        throw exchangeError
                    }

                    if (data.session?.user) {
                        console.log('Direct code exchange successful for user:', data.session.user.email)
                        await processSuccessfulAuth(data.session, data.user ?? data.session.user)
                        stopSessionListener()
                        return
                    }
                } catch (directError) {
                    console.warn('Direct code exchange failed, waiting for auth state listener:', directError)
                }

                console.log('Waiting for auth state change listener...')

                const sessionFromListener = await sessionPromise

                if (sessionFromListener?.user) {
                    console.log('Auth state change detected for user:', sessionFromListener.user.email)
                    await processSuccessfulAuth(sessionFromListener, sessionFromListener.user)
                    stopSessionListener()
                    return
                }

                stopSessionListener()
                throw new Error('Auth state change timeout')

            } catch (error: any) {
                console.error('Auth callback error:', error)
                setError(error.message || 'Authentication failed')
                authToasts.loginError(error.message || 'Authentication failed. Please try again.')
                setTimeout(() => router.push('/login'), 2000)
            } finally {
                listenerCleanupRef.current?.()
                listenerCleanupRef.current = null
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current)
                }
                setIsProcessing(false)
            }
        }

        handleAuthCallback()

        return () => {
            listenerCleanupRef.current?.()
            listenerCleanupRef.current = null
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [processSuccessfulAuth, router, setAuth, setProfile])

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <p className="text-sm text-gray-500">Redirecting to login page...</p>
                </div>
            </div>
        )
    }

    if (isProcessing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <PageLoadingSpinner component="authentication" />
                <p className="mt-4 text-gray-600">Processing authentication...</p>
            </div>
        )
    }

    return null
}