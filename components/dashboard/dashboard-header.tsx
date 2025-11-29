import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/avatar'
import type { Profile } from '@/lib/profile'
import { ProfileUrlUtils } from '@/lib/utils/profile.utils'
import { Eye } from 'lucide-react'
import dynamic from 'next/dynamic'

// Lazy-load AvatarManager (client-side only)
const DashboardHeaderAvatar = dynamic(
    () => import('./dashboard-header-avatar').then(mod => mod.DashboardHeaderAvatar),
    {
        ssr: false,
        loading: () => (
            <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-muted to-muted-foreground/10 animate-pulse ring-4 ring-primary/10">
                <span className="text-[10px] text-muted-foreground">Loading...</span>
            </div>
        ),
    }
)

const getRoleDisplay = (role: string) => {
    switch (role) {
        case 'T': return { label: 'Teacher', color: 'bg-blue-100 text-blue-800' }
        case 'C': return { label: 'Coach', color: 'bg-green-100 text-green-800' }
        case 'S': return { label: 'Student', color: 'bg-purple-100 text-purple-800' }
        default: return { label: 'User', color: 'bg-gray-100 text-gray-800' }
    }
}

export function DashboardHeader({ profile }: { profile: Profile }) {
    const roleInfo = getRoleDisplay(profile.role || 'S')
    const publicProfileUrl = profile.username
        ? ProfileUrlUtils.getProfileUrl(profile.username)
        : null

    return (
        <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
                {/* SSR-visible static avatar (renders instantly) */}
                <div className="relative">
                    <UserAvatar
                        profile={profile}
                        size="2xl"
                        showOnlineStatus
                        className="ring-4 ring-primary/10"
                    />
                    {/* Dynamically injected Avatar Manager */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <DashboardHeaderAvatar profile={profile} />
                    </div>
                </div>

                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Welcome back, {profile.full_name || 'User'}!
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Ready to continue your learning journey?
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* View Public Profile Button */}
                {publicProfileUrl && (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={publicProfileUrl}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Public Profile
                        </Link>
                    </Button>
                )}

                <Badge className={roleInfo.color}>
                    {roleInfo.label}
                </Badge>
            </div>
        </div>
    )
}
