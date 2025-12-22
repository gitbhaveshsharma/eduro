// app/dashboard/page.tsx
import { ProfileServerService } from '@/lib/service/server/profile-server.service'
import { LearningDashboard, LearningDashboardSkeleton } from '@/components/dashboard/learning-dashboard'
import { Suspense } from 'react'

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
        <Suspense fallback={<LearningDashboardSkeleton />}>
            <LearningDashboard profile={profile} />
        </Suspense>
    )
}