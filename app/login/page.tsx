'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { OtpForm } from '@/components/auth/otp-form'
import { PhoneOtpForm } from '@/components/auth/phone-otp-form'
import { OAuthProviders, Divider } from '@/components/auth/oauth-providers'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'
import { CustomToaster } from '@/lib/toast'
import { useAuthStore } from '@/lib/auth-store'
import { getAuthRedirectDestination } from '@/lib/utils/auth-redirect'

type LoginMethod = 'email' | 'phone'

export default function LoginPage() {
    const router = useRouter()
    const { user, profile, isLoading, isInitialized } = useAuthStore()
    const [loginMethod, setLoginMethod] = useState<LoginMethod>('email')
    const [isRedirecting, setIsRedirecting] = useState(false)

    const redirectTimerRef = useRef<number | null>(null)

    // Clear any existing timers on cleanup
    useEffect(() => {
        return () => {
            if (redirectTimerRef.current) {
                clearTimeout(redirectTimerRef.current)
                redirectTimerRef.current = null
            }
        }
    }, [])

    // Handle authenticated user redirect with onboarding check
    useEffect(() => {
        if (isInitialized && user && !isRedirecting) {
            setIsRedirecting(true)

            // Wait for auth store and profile sync to complete
            redirectTimerRef.current = window.setTimeout(async () => {
                try {
                    // Allow time for profile creation, notifications setup, etc.
                    await new Promise(resolve => setTimeout(resolve, 500))

                    // Get redirect parameter from URL (read from window location to avoid SSR issues)
                    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
                    const redirectParam = params.get('redirect')

                    // Determine redirect destination based on onboarding status
                    const redirectResult = getAuthRedirectDestination(profile as any, redirectParam || undefined)
                    // console.log('Login page redirect:', redirectResult)
                    router.push(redirectResult.destination)
                } catch (error) {
                    console.error('Redirect error:', error)
                    // Fallback redirect to onboarding
                    router.push('/onboarding')
                } finally {
                    redirectTimerRef.current = null
                    setIsRedirecting(false)
                }
            }, 800) // Increased delay for auth tasks
        }
    }, [user, profile, isInitialized, isRedirecting, router])

    const handleLoginSuccess = async () => {
        setIsRedirecting(true)

        // Clear any existing timer
        if (redirectTimerRef.current) {
            clearTimeout(redirectTimerRef.current)
            redirectTimerRef.current = null
        }

        redirectTimerRef.current = window.setTimeout(async () => {
            try {
                // Wait for post-login tasks to complete
                // - Profile creation/update
                // - Notification preferences sync  
                // - Session establishment
                await new Promise(resolve => setTimeout(resolve, 1000))

                // Get redirect parameter from URL (read from window location)
                const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
                const redirectParam = params.get('redirect')

                // Determine redirect destination based on onboarding status
                const currentProfile = useAuthStore.getState().profile
                const redirectResult = getAuthRedirectDestination(currentProfile as any, redirectParam || undefined)
                console.log('Login success redirect:', redirectResult)

                router.push(redirectResult.destination)
            } catch (error) {
                console.error('Post-login redirect error:', error)
                // Fallback to onboarding if there's an error
                router.push('/onboarding')
            } finally {
                redirectTimerRef.current = null
                setIsRedirecting(false)
            }
        }, 1500) // Extended delay for post-login tasks
    }

    // Show loading during auth initialization or redirect
    if (isLoading || !isInitialized || isRedirecting) {
        const loadingMessage = isRedirecting ? 'Redirecting...' : 'login page'
        return <PageLoadingSpinner component={loadingMessage} />
    }

    // Don't render login form if user is authenticated
    if (user) {
        return null
    }

    return (
        <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
            <CustomToaster />

            <div className="w-full max-w-md mx-auto">
                {/* Logo & Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[#111827] mb-2">Welcome to Eduro</h1>
                    <p className="text-[#6B7280]">Choose your preferred login method to sign in or create an account</p>
                </div>

                {/* Method Toggle */}
                <div className="flex bg-white p-1 rounded-lg mb-6 shadow-sm border border-[#E5E7EB]">
                    <button
                        onClick={() => setLoginMethod('email')}
                        className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${loginMethod === 'email'
                            ? 'bg-[#1D4ED8] text-white shadow-sm'
                            : 'text-[#6B7280] hover:text-[#111827]'
                            }`}
                        disabled={isRedirecting}
                    >
                        Email OTP
                    </button>
                    <button
                        onClick={() => setLoginMethod('phone')}
                        className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${loginMethod === 'phone'
                            ? 'bg-[#1D4ED8] text-white shadow-sm'
                            : 'text-[#6B7280] hover:text-[#111827]'
                            }`}
                        disabled={isRedirecting}
                    >
                        Phone OTP
                    </button>
                </div>

                {/* Auth Card */}
                <Card className="bg-white border-[#E5E7EB] shadow-lg">
                    <CardContent className="p-6">
                        <div className="space-y-6">
                            <OAuthProviders onSuccess={handleLoginSuccess} />
                            <Divider text="or continue with OTP" />

                            {/* Form Content */}
                            <div className="relative min-h-[180px]">
                                <div
                                    className={`absolute inset-0 transition-all duration-300 ease-in-out ${loginMethod === 'email'
                                        ? 'opacity-100 translate-x-0'
                                        : 'opacity-0 translate-x-4 pointer-events-none'
                                        }`}
                                >
                                    <OtpForm
                                        onSuccess={handleLoginSuccess}
                                        onBack={() => setLoginMethod('phone')}
                                    />
                                </div>

                                <div
                                    className={`absolute inset-0 transition-all duration-300 ease-in-out ${loginMethod === 'phone'
                                        ? 'opacity-100 translate-x-0'
                                        : 'opacity-0 -translate-x-4 pointer-events-none'
                                        }`}
                                >
                                    <PhoneOtpForm
                                        onSuccess={handleLoginSuccess}
                                        onBack={() => setLoginMethod('email')}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Links */}
                <div className="text-center mt-6 space-y-3">
                    <div className="text-sm text-[#6B7280]">
                        Secure login with OTP verification
                    </div>
                </div>
            </div>
        </div>
    )
}
