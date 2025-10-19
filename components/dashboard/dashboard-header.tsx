// components/dashboard/dashboard-header.tsx
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/avatar'
import type { Profile } from '@/lib/profile'

interface DashboardHeaderProps {
    profile: Profile
}

const getRoleDisplay = (role: string) => {
    switch (role) {
        case 'T': return { label: 'Teacher', color: 'bg-blue-100 text-blue-800' }
        case 'C': return { label: 'Coach', color: 'bg-green-100 text-green-800' }
        case 'S': return { label: 'Student', color: 'bg-purple-100 text-purple-800' }
        default: return { label: 'User', color: 'bg-gray-100 text-gray-800' }
    }
}

// Pure Server Component - No JavaScript needed for rendering
export function DashboardHeader({ profile }: DashboardHeaderProps) {
    const roleInfo = getRoleDisplay(profile.role || 'S')

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <UserAvatar
                        profile={profile}
                        size="2xl"
                        showOnlineStatus={true}
                        className="ring-4 ring-primary/10"
                    />
                </div>
                <div>
                    {/* LCP Element - Renders immediately from server HTML */}
                    <h1 className="text-3xl font-bold text-foreground">
                        Welcome back, {profile.full_name || 'User'}!
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Ready to continue your learning journey?
                    </p>
                </div>
            </div>
            <Badge className={roleInfo.color}>
                {roleInfo.label}
            </Badge>
        </div>
    )
}
