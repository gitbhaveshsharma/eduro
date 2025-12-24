'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import OnboardingGuard from '@/components/providers/onboarding-guard'
import { CustomToaster } from '@/lib/toast'

export default function ClientRoot({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
        >
            <AuthProvider>
                {/* Side-effects only (no UI blocking) */}
                <OnboardingGuard />
                {/* App renders immediately */}
                {children}

                <CustomToaster />
            </AuthProvider>
        </ThemeProvider>
    )
}
