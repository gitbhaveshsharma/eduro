'use client'

import { useCurrentProfile, useCurrentProfileLoading } from '@/lib/profile'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ComponentLoadingSpinner } from '@/components/ui/loading-spinner'
import { User, BookOpen, Users, Trophy, Settings } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isOnboardingRequired } from '@/hooks/use-onboarding'

export default function DashboardPage() {
    const profile = useCurrentProfile()
    const loading = useCurrentProfileLoading()
    const { user, isInitialized } = useAuthStore()
    const router = useRouter()

    // Redirect to home if not authenticated
    useEffect(() => {
        if (isInitialized && !user) {
            router.push('/')
        }
    }, [user, isInitialized, router])

    // Redirect to onboarding if not completed
    useEffect(() => {
        if (profile && isOnboardingRequired(profile)) {
            router.push('/onbording')
        }
    }, [profile, router])

    // Show loading state while profile is loading
    if (loading || !isInitialized) {
        return (
            <main className="min-h-screen bg-background p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    <ComponentLoadingSpinner component="dashboard" size="lg" />
                </div>
            </main>
        )
    }

    // Redirect if no profile (shouldn't happen if user is authenticated)
    if (!profile) {
        return null
    }

    // Show dashboard for authenticated users with loaded profile
    const getRoleDisplay = (role: string) => {
        switch (role) {
            case 'T': return { label: 'Teacher', color: 'bg-blue-100 text-blue-800' }
            case 'C': return { label: 'Coach', color: 'bg-green-100 text-green-800' }
            case 'S': return { label: 'Student', color: 'bg-purple-100 text-purple-800' }
            default: return { label: 'User', color: 'bg-gray-100 text-gray-800' }
        }
    }

    const roleInfo = getRoleDisplay(profile.role || 'S')

    return (
        <main className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto p-6 space-y-6">
                {/* Welcome Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Welcome back, {profile.full_name || 'User'}!
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Ready to continue your learning journey?
                        </p>
                    </div>
                    <Badge className={roleInfo.color}>
                        {roleInfo.label}
                    </Badge>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <User className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Profile</p>
                                    <p className="text-2xl font-bold">
                                        {profile.profile_completion_percentage || 0}%
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Courses</p>
                                    <p className="text-2xl font-bold">0</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <Users className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Connections</p>
                                    <p className="text-2xl font-bold">0</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <Trophy className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Achievements</p>
                                    <p className="text-2xl font-bold">0</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold mb-2">Get Started</h3>
                            <p className="text-muted-foreground mb-4">
                                Complete your profile and start exploring courses.
                            </p>
                            <Button className="w-full">
                                <BookOpen className="h-4 w-4 mr-2" />
                                Browse Courses
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold mb-2">Connect</h3>
                            <p className="text-muted-foreground mb-4">
                                Find and connect with other learners and educators.
                            </p>
                            <Button variant="outline" className="w-full">
                                <Users className="h-4 w-4 mr-2" />
                                Find People
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold mb-2">Settings</h3>
                            <p className="text-muted-foreground mb-4">
                                Customize your profile and learning preferences.
                            </p>
                            <Button variant="outline" className="w-full">
                                <Settings className="h-4 w-4 mr-2" />
                                Profile Settings
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Role-specific content */}
                {profile.role === 'T' && (
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold mb-2">Teacher Tools</h3>
                            <p className="text-muted-foreground mb-4">
                                Access your teaching dashboard and course management tools.
                            </p>
                            <div className="flex gap-3">
                                <Button>Create Course</Button>
                                <Button variant="outline">Manage Students</Button>
                                <Button variant="outline">View Analytics</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {profile.role === 'C' && (
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold mb-2">Coach Dashboard</h3>
                            <p className="text-muted-foreground mb-4">
                                Manage your coaching sessions and track student progress.
                            </p>
                            <div className="flex gap-3">
                                <Button>Schedule Session</Button>
                                <Button variant="outline">View Students</Button>
                                <Button variant="outline">Progress Reports</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    )
}