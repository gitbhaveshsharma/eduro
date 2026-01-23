'use client';

import { useStudentContext } from './layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BookOpen,
    Calendar,
    Award,
    Users,
    Download,
    Building2
} from 'lucide-react';

// Import the new Header Component
import { StudentDashboardHeader } from './_components/dashboard/student-dashboard-header';

export default function StudentCoachingPage() {
    const { coachingCenter } = useStudentContext();

    if (!coachingCenter) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <p className="text-muted-foreground italic">Coaching center not found...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* 🆕 The Professional Header Component */}
            <StudentDashboardHeader
                coachingCenter={coachingCenter}
            />

            {/* 📊 Stats Section - Stylized to match the new header */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none bg-card shadow-sm ring-1 ring-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Enrolled Courses
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-extrabold text-brand-primary">5</div>
                            <div className="rounded-xl bg-brand-primary/10 p-2.5">
                                <BookOpen className="h-6 w-6 text-brand-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-card shadow-sm ring-1 ring-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Active Assignments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-extrabold text-green-600">3</div>
                            <div className="rounded-xl bg-green-500/10 p-2.5">
                                <Calendar className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-card shadow-sm ring-1 ring-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Average Grade
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-extrabold text-yellow-600">A-</div>
                            <div className="rounded-xl bg-yellow-500/10 p-2.5">
                                <Award className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-card shadow-sm ring-1 ring-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Classmates
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-extrabold text-blue-600">42</div>
                            <div className="rounded-xl bg-blue-500/10 p-2.5">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ⚡ Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-lg transition-all border-border/60 group">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 group-hover:text-brand-primary transition-colors">
                            <BookOpen className="h-5 w-5" />
                            View Courses
                        </CardTitle>
                        <CardDescription>
                            Access all your enrolled courses and materials
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full bg-brand-primary hover:bg-brand-primary/90">Go to Courses</Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all border-border/60 group">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 group-hover:text-green-600 transition-colors">
                            <Calendar className="h-5 w-5" />
                            Upcoming Classes
                        </CardTitle>
                        <CardDescription>
                            Check your schedule and upcoming classes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full border-green-200 hover:bg-green-50">View Schedule</Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all border-border/60 group">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                            <Download className="h-5 w-5" />
                            Resources
                        </CardTitle>
                        <CardDescription>
                            Download study materials and resources
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="secondary" className="w-full">Browse Resources</Button>
                    </CardContent>
                </Card>
            </div>

            {/* 🏫 Coaching Center Info Section */}
            <Card className="overflow-hidden border-border/60">
                <div className="h-1.5 bg-brand-primary/20 w-full" />
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Building2 className="h-5 w-5 text-brand-primary" />
                        About {coachingCenter.name}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {coachingCenter.description && (
                        <p className="text-muted-foreground leading-relaxed max-w-4xl">
                            {coachingCenter.description}
                        </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t">
                        {coachingCenter.email && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Official Email</p>
                                <p className="font-semibold text-foreground">{coachingCenter.email}</p>
                            </div>
                        )}
                        {coachingCenter.phone && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contact Support</p>
                                <p className="font-semibold text-foreground">{coachingCenter.phone}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}