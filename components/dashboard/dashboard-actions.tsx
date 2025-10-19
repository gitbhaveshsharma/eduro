// components/dashboard/dashboard-actions.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, Settings } from 'lucide-react'
import Link from 'next/link'

interface DashboardActionsProps {
    role: string
}

// Pure Server Component - All links work without JS (progressive enhancement)
export function DashboardActions({ role }: DashboardActionsProps) {
    const commonActions = [
        {
            title: 'Get Started',
            description: 'Complete your profile and start exploring courses.',
            icon: BookOpen,
            buttonText: 'Browse Courses',
            href: '/courses',
            variant: 'default' as const
        },
        {
            title: 'Connect',
            description: 'Find and connect with other learners and educators.',
            icon: Users,
            buttonText: 'Find People',
            href: '/network',
            variant: 'outline' as const
        },
        {
            title: 'Settings',
            description: 'Customize your profile and learning preferences.',
            icon: Settings,
            buttonText: 'Profile Settings',
            href: '/settings',
            variant: 'outline' as const
        }
    ]

    return (
        <>
            {/* Common Action Cards - Server rendered, clickable without JS */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {commonActions.map((action) => {
                    const Icon = action.icon
                    return (
                        <Card key={action.title}>
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold mb-2">
                                    {action.title}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {action.description}
                                </p>
                                <Button variant={action.variant} className="w-full" asChild>
                                    <Link href={action.href}>
                                        <Icon className="h-4 w-4 mr-2" />
                                        {action.buttonText}
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Role-specific Cards - Conditionally rendered on server */}
            {role === 'T' && (
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-2">Teacher Tools</h3>
                        <p className="text-muted-foreground mb-4">
                            Access your teaching dashboard and course management tools.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button asChild>
                                <Link href="/teacher/create-course">Create Course</Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/teacher/students">Manage Students</Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/teacher/analytics">View Analytics</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {role === 'C' && (
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-2">Coach Dashboard</h3>
                        <p className="text-muted-foreground mb-4">
                            Manage your coaching sessions and track student progress.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button asChild>
                                <Link href="/coach/schedule">Schedule Session</Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/coach/students">View Students</Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/coach/reports">Progress Reports</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </>
    )
}
