// app/dashboard/page.tsx
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { DashboardActions } from '@/components/dashboard/dashboard-actions'
import { AvatarSectionClient } from '@/components/dashboard/dashboard-avatar-section-client'
import { ProfileServerService } from '@/lib/service/server/profile-server.service'

// Force dynamic rendering for authenticated pages
// This is intentional - dashboard requires authentication
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Server Component - Fast SSR with authentication
export default async function DashboardPage() {
    console.log('Dashboard: Starting server-side profile fetch')

    // Fetch profile server-side using server client
    const profile = await ProfileServerService.getCurrentProfile()

    console.log('Dashboard: Profile fetched:', profile ? 'SUCCESS' : 'NULL')

    // Middleware should ensure auth, but defensive check
    if (!profile) {
        console.error('Dashboard: No profile found!')
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold">Profile Not Found</h1>
                    <p className="text-muted-foreground">
                        Unable to load your profile. Please try logging in again.
                    </p>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto p-6 space-y-6">
                {/* LCP Element - Renders instantly */}
                <DashboardHeader profile={profile} />

                {/* Static stats - Server rendered */}
                <DashboardStats profile={profile} />

                {/* Static action cards - Server rendered */}
                <DashboardActions role={profile.role} />

                {/* Interactive avatar section - Client component */}
                <AvatarSectionClient profile={profile} />
            </div>
        </main>
    )
}