// components/dashboard/dashboard-actions.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    BookOpen, Users, Settings,
    Plus, Users2, Calendar, BarChart3, FileText
} from 'lucide-react'
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
                        <Card key={action.title} className="h-full flex flex-col">
                            <CardContent className="p-6 flex flex-col flex-1">
                                <h3 className="text-lg font-semibold mb-2">
                                    {action.title}
                                </h3>
                                <p className="text-muted-foreground mb-4 flex-1">
                                    {action.description}
                                </p>
                                <Button variant={action.variant} className="w-full mt-auto" asChild>
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

            {/* Role-specific Cards - Modern 2025 Style */}
            {role === 'T' && (
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Create Course Card */}
                    <Card className="group cursor-pointer h-full flex flex-col p-0 border-2 border-transparent hover:border-primary/20 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
                        <Link href="/teacher/create-course" className="flex flex-col flex-1">
                            <CardContent className="p-6 flex flex-col flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-blue-100/80 rounded-full group-hover:bg-blue-100 transition-colors">
                                        <Plus className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                        New
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                                    Create Course
                                </h3>
                                <p className=" mb-4 leading-relaxed text-sm flex-1">
                                    Design and launch your next learning experience with our intuitive course builder.
                                </p>
                                <div className="flex items-center text-sm text-blue-600 font-medium group-hover:text-blue-700 transition-colors mt-auto pt-2">
                                    Start creating
                                    <Plus className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    {/* Manage Students Card */}
                    <Card className="group cursor-pointer h-full flex flex-col p-0 border-2 border-transparent hover:border-primary/20 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-green-50/30">
                        <Link href="/teacher/students" className="flex flex-col flex-1">
                            <CardContent className="p-6 flex flex-col flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-green-100/80 rounded-full group-hover:bg-green-100 transition-colors">
                                        <Users2 className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                                    Student Management
                                </h3>
                                <p className="text-muted-foreground mb-4 leading-relaxed text-sm flex-1">
                                    Track progress, provide feedback, and manage your student community.
                                </p>
                                <div className="flex items-center text-sm text-green-600 font-medium group-hover:text-green-700 transition-colors mt-auto pt-2">
                                    View students
                                    <Users2 className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    {/* Analytics Card */}
                    <Card className="group cursor-pointer h-full flex flex-col p-0 border-2 border-transparent hover:border-primary/20 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
                        <Link href="/teacher/analytics" className="flex flex-col flex-1">
                            <CardContent className="p-6 flex flex-col flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-purple-100/80 rounded-full group-hover:bg-purple-100 transition-colors">
                                        <BarChart3 className="h-6 w-6 text-purple-600" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                                    Performance Analytics
                                </h3>
                                <p className="text-muted-foreground mb-4 leading-relaxed text-sm flex-1">
                                    Gain insights into course engagement and student learning patterns.
                                </p>
                                <div className="flex items-center text-sm text-purple-600 font-medium group-hover:text-purple-700 transition-colors mt-auto pt-2">
                                    View insights
                                    <BarChart3 className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Link>
                    </Card>
                </div>
            )}

            {role === 'C' && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* Manage Classes Card */}
                    <Card className="group cursor-pointer h-full flex flex-col border-2 border-transparent hover:border-primary/20 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-orange-50/30 p-0">
                        <Link href="/coach/branch-classes" className="flex flex-col flex-1">
                            <CardContent className="p-6 flex flex-col flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-orange-100/80 rounded-full group-hover:bg-orange-100 transition-colors">
                                        <Users className="h-6 w-6 text-orange-600" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                                    Class Management
                                </h3>
                                <p className="text-muted-foreground mb-4 leading-relaxed text-sm flex-1">
                                    Organize and manage your coaching classes across different branches.
                                </p>
                                <div className="flex items-center text-sm text-orange-600 font-medium group-hover:text-orange-700 transition-colors mt-auto pt-2">
                                    Manage classes
                                    <Users className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    {/* Schedule Session Card */}
                    <Card className="group cursor-pointer h-full flex flex-col p-0 border-2 border-transparent hover:border-primary/20 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
                        <Link href="/coach/schedule" className="flex flex-col flex-1">
                            <CardContent className="p-6 flex flex-col flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-blue-100/80 rounded-full group-hover:bg-blue-100 transition-colors">
                                        <Calendar className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                        New
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                                    Session Scheduling
                                </h3>
                                <p className="text-muted-foreground mb-4 leading-relaxed text-sm flex-1">
                                    Plan and schedule coaching sessions with automated reminders.
                                </p>
                                <div className="flex items-center text-sm text-blue-600 font-medium group-hover:text-blue-700 transition-colors mt-auto pt-2">
                                    Schedule now
                                    <Calendar className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    {/* View Students Card */}
                    <Card className="group cursor-pointer h-full flex flex-col p-0 border-2 border-transparent hover:border-primary/20 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-green-50/30">
                        <Link href="/coach/students" className="flex flex-col flex-1">
                            <CardContent className="p-6 flex flex-col flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-green-100/80 rounded-full group-hover:bg-green-100 transition-colors">
                                        <Users2 className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                                    Student Roster
                                </h3>
                                <p className="text-muted-foreground mb-4 leading-relaxed text-sm flex-1">
                                    Access your student profiles and track individual progress.
                                </p>
                                <div className="flex items-center text-sm text-green-600 font-medium group-hover:text-green-700 transition-colors mt-auto pt-2">
                                    View roster
                                    <Users2 className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    {/* Progress Reports Card */}
                    <Card className="group cursor-pointer h-full flex flex-col p-0 border-2 border-transparent hover:border-primary/20 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
                        <Link href="/coach/reports" className="flex flex-col flex-1">
                            <CardContent className="p-6 flex flex-col flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-purple-100/80 rounded-full group-hover:bg-purple-100 transition-colors">
                                        <FileText className="h-6 w-6 text-purple-600" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                                    Progress Analytics
                                </h3>
                                <p className="text-muted-foreground mb-4 leading-relaxed text-sm flex-1">
                                    Generate detailed reports and analytics on student performance.
                                </p>
                                <div className="flex items-center text-sm text-purple-600 font-medium group-hover:text-purple-700 transition-colors mt-auto pt-2">
                                    View reports
                                    <FileText className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Link>
                    </Card>
                </div>
            )}
        </>
    )
}