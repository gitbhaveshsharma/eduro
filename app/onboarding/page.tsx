'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentProfile, useCurrentProfileLoading } from '@/lib/profile'
import { OnboardingContainer } from '@/components/onboarding/onboarding-container'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function OnboardingPage() {
    const router = useRouter()
    const profile = useCurrentProfile()
    const loading = useCurrentProfileLoading()
    const [initialStep, setInitialStep] = useState(1)

    useEffect(() => {
        if (!loading && profile) {
            // Check if user should be on onboarding page
            const onboardingLevel = parseInt(profile.onboarding_level)

            if (onboardingLevel >= 3) {
                // User has completed onboarding, redirect to dashboard after 300ms
                const timeout = setTimeout(() => {
                    router.push('/dashboard')
                }, 300)

                // Cleanup timeout if effect re-runs / component unmounts
                return () => clearTimeout(timeout)
            }

            // Determine which step to start on based on onboarding level
            if (onboardingLevel >= 2) {
                setInitialStep(2) // Start on personal info step
            } else {
                setInitialStep(1) // Start on role selection step
            }
        }
    }, [loading, profile, router])


    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <Card className="mb-8">
                        <CardContent className="p-6 space-y-4">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-2 w-full" />
                            <div className="flex justify-between">
                                <Skeleton className="h-16 w-16 rounded-full" />
                                <Skeleton className="h-16 w-16 rounded-full" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-8 space-y-6">
                            <div className="text-center space-y-4">
                                <Skeleton className="h-8 w-64 mx-auto" />
                                <Skeleton className="h-4 w-96 mx-auto" />
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                {[1, 2, 3].map((i) => (
                                    <Card key={i}>
                                        <CardContent className="p-6 space-y-4">
                                            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
                                            <Skeleton className="h-6 w-32 mx-auto" />
                                            <Skeleton className="h-4 w-full" />
                                            <div className="space-y-2">
                                                {[1, 2, 3, 4].map((j) => (
                                                    <Skeleton key={j} className="h-3 w-full" />
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return <OnboardingContainer initialStep={initialStep} />
}