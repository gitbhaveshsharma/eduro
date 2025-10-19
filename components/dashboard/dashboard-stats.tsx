// components/dashboard/dashboard-stats.tsx
import { Card, CardContent } from '@/components/ui/card'
import { User, BookOpen, Users, Trophy } from 'lucide-react'
import type { Profile } from '@/lib/profile'

interface DashboardStatsProps {
    profile: Profile
}

// Pure Server Component - Static HTML, no JS needed
export function DashboardStats({ profile }: DashboardStatsProps) {
    // Static data - renders instantly on server
    const stats = [
        {
            icon: User,
            label: 'Profile',
            value: `${profile.profile_completion_percentage || 0}%`,
            color: 'text-primary'
        },
        {
            icon: BookOpen,
            label: 'Courses',
            value: '0',
            color: 'text-primary'
        },
        {
            icon: Users,
            label: 'Connections',
            value: '0',
            color: 'text-primary'
        },
        {
            icon: Trophy,
            label: 'Achievements',
            value: '0',
            color: 'text-primary'
        }
    ]

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
                const Icon = stat.icon
                return (
                    <Card key={stat.label}>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <Icon className={`h-5 w-5 ${stat.color}`} />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {stat.label}
                                    </p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
