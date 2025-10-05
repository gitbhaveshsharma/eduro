'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
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

    useEffect(() => {
        // Prevent double execution in React Strict Mode
        if (hasProcessed.current) {
            return
        }

        const handleAuthCallback = async () => {
            hasProcessed.current = true

            try {
                console.log('Starting OAuth callback processing...')

                // Check for OAuth errors first (read params from window.location)
                const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
                const error = sp.get('error')
                const errorDescription = sp.get('error_description')

                if (error) {
                    console.error('OAuth error:', error, errorDescription)
                    setError(errorDescription || 'Authentication failed')
                    authToasts.loginError(errorDescription || 'Authentication failed')
                    setTimeout(() => router.push('/login'), 2000)
                    return
                }

                // Check for authorization code
                const code = sp.get('code')
                if (!code) {
                    console.error('No authorization code found')
                    setError('No authorization code received')
                    authToasts.loginError('Authentication failed. No authorization code received.')
                    setTimeout(() => router.push('/login'), 2000)
                    return
                }

                console.log('Authorization code found, processing...')

                // Set a maximum timeout for the entire process
                timeoutRef.current = setTimeout(() => {
                    console.error('Auth callback timeout')
                    setError('Authentication timeout')
                    authToasts.loginError('Authentication timeout. Please try again.')
                    router.push('/login')
                }, 30000) // 30 second timeout

                // Method 1: Try exchangeCodeForSession directly
                try {
                    console.log('Attempting direct code exchange...')
                    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

                    if (exchangeError) {
                        console.error('Direct code exchange failed:', exchangeError)
                        throw exchangeError
                    }

                    if (data.session?.user) {
                        console.log('Direct code exchange successful for user:', data.session.user.email)
                        await processSuccessfulAuth(data.session, data.user)
                        return
                    }
                } catch (directError) {
                    console.warn('Direct code exchange failed, trying auth state listener:', directError)
                }

                // Method 2: Fallback to auth state change listener
                console.log('Setting up auth state change listener...')

                let authListenerTimeout: NodeJS.Timeout | undefined
                let subscription: any

                const authPromise = new Promise<void>((resolve, reject) => {
                    authListenerTimeout = setTimeout(() => {
                        reject(new Error('Auth state change timeout'))
                    }, 20000)

                    subscription = supabase.auth.onAuthStateChange(async (event, session) => {
                        if (event === 'SIGNED_IN' && session?.user) {
                            console.log('Auth state change detected for user:', session.user.email)
                            if (authListenerTimeout) {
                                clearTimeout(authListenerTimeout)
                            }
                            try {
                                await processSuccessfulAuth(session, session.user)
                                resolve()
                            } catch (error) {
                                reject(error)
                            }
                        }
                    })
                })

                // Method 3: Also check if session already exists
                const { data: { session: existingSession } } = await supabase.auth.getSession()
                if (existingSession?.user) {
                    console.log('Existing session found for user:', existingSession.user.email)
                    if (authListenerTimeout) {
                        clearTimeout(authListenerTimeout)
                    }
                    subscription?.data?.subscription?.unsubscribe()
                    await processSuccessfulAuth(existingSession, existingSession.user)
                    return
                }

                // Wait for auth state change
                await authPromise
                subscription?.data?.subscription?.unsubscribe()

            } catch (error: any) {
                console.error('Auth callback error:', error)
                setError(error.message || 'Authentication failed')
                authToasts.loginError(error.message || 'Authentication failed. Please try again.')
                setTimeout(() => router.push('/login'), 2000)
            } finally {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current)
                }
                setIsProcessing(false)
            }
        }

        const processSuccessfulAuth = async (session: any, user: any) => {
            try {
                console.log('Processing successful authentication for:', user.email)

                // Update auth store
                setAuth(user, session)

                // Fetch user profile
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
                    setProfile(null) // Will trigger onboarding
                }

                // Update online status (non-blocking)
                try {
                    await supabase.rpc('update_online_status', { is_online_status: true })
                    console.log('Online status updated')
                } catch (statusError) {
                    console.warn('Failed to update online status:', statusError)
                }

                // Determine redirect destination
                const sp2 = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
                const redirectParam = sp2.get('redirect')
                const redirectResult = getAuthRedirectDestination(profile || null, redirectParam || undefined)
                console.log('Redirect result:', redirectResult)

                // Show success message
                authToasts.loginSuccess(redirectResult.message || 'Welcome back!')

                // Short delay to ensure UI updates
                await new Promise(resolve => setTimeout(resolve, 500))

                // Navigate to destination
                console.log('Redirecting to:', redirectResult.destination)
                router.push(redirectResult.destination)

            } catch (error) {
                console.error('Error processing successful auth:', error)
                throw error
            }
        }

        handleAuthCallback()

        // Cleanup on unmount
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [router, setAuth, setProfile])

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