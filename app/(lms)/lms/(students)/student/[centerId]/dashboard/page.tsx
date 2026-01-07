'use client';

import { useEffect } from 'react';
import { useStudentContext } from '../layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, BookOpen, Calendar, Award, Download } from 'lucide-react';

export default function StudentDashboardPage() {
    const { coachingCenter, isLoading, error, centerId } = useStudentContext();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!coachingCenter) {
        return <div>Coaching center not found</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-3 rounded-lg border shadow-sm">
                            <Building2 className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">{coachingCenter.name}</h1>
                            <p className="text-muted-foreground">
                                Welcome to your student portal at {coachingCenter.name}
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-lg px-4 py-2">
                        Student Portal
                    </Badge>
                </div>
            </div>

            {/* Stats Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Enrolled Courses
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">5</div>
                            <BookOpen className="h-8 w-8 text-primary/30" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Assignments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">3</div>
                            <Calendar className="h-8 w-8 text-green-500/30" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Average Grade
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">A-</div>
                            <Award className="h-8 w-8 text-yellow-500/30" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Classmates
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">42</div>
                            <Users className="h-8 w-8 text-blue-500/30" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            View Courses
                        </CardTitle>
                        <CardDescription>
                            Access all your enrolled courses and materials
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full">Go to Courses</Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-green-500" />
                            Upcoming Classes
                        </CardTitle>
                        <CardDescription>
                            Check your schedule and upcoming classes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full">View Schedule</Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5 text-blue-500" />
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

            {/* Coaching Center Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        About {coachingCenter.name}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {coachingCenter.description && (
                        <p className="text-muted-foreground">{coachingCenter.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                        {coachingCenter.email && (
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Email:</span>
                                <span className="text-muted-foreground">{coachingCenter.email}</span>
                            </div>
                        )}
                        {coachingCenter.phone && (
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Phone:</span>
                                <span className="text-muted-foreground">{coachingCenter.phone}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
