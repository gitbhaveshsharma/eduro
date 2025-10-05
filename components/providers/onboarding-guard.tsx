"use client"

import React from 'react'
import { useOnboardingRedirect } from '@/hooks/use-onboarding'

interface OnboardingGuardProps {
    children: React.ReactNode
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
    // This hook performs redirects when necessary (pushes to /onbording or /)
    // and also returns loading/profile state if the UI needs to reflect it.
    const { loading } = useOnboardingRedirect()

    // While profile/loading state resolves, avoid rendering children to prevent
    // flash of protected content. This mirrors common guard/provider behavior
    // in the app.
    if (loading) {
        return null
    }

    return <>{children}</>
}

export default OnboardingGuard
