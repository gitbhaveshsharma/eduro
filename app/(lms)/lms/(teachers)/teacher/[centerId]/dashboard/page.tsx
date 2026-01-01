'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, BookOpen, Calendar, Award, ClipboardList } from 'lucide-react';
import { CoachingAPI } from '@/lib/coaching';
import { useTeacherContext } from '../layout';
import type { TeacherAssignment } from '@/lib/schema/coaching.types';

export default function TeacherDashboardPage() {
    const router = useRouter();
    const { coachingCenter, centerId } = useTeacherContext();

    const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadAssignments() {
            if (!coachingCenter) return;
            setLoading(true);
            try {
                const res = await CoachingAPI.getTeacherAssignments();
                if (res.success && res.data) {
                    setAssignments(res.data);
                } else {
                    setError(res.error || 'Failed to load assignments');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unexpected error');
            } finally {
                setLoading(false);
            }
        }
        loadAssignments();
    }, [coachingCenter]);

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
                                Welcome to your teacher portal at {coachingCenter.name}
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-lg px-4 py-2">
                        Teacher Portal
                    </Badge>
                </div>
            </div>

            {/* Stats Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            My Classes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">4</div>
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
                            <div className="text-2xl font-bold">{assignments.length}</div>
                            <ClipboardList className="h-8 w-8 text-green-500/30" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Students
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">156</div>
                            <Users className="h-8 w-8 text-blue-500/30" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Classes Today
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">3</div>
                            <Calendar className="h-8 w-8 text-yellow-500/30" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/lms/teacher/${centerId}/classes`)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            My Classes
                        </CardTitle>
                        <CardDescription>
                            Manage your classes and course materials
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full">View Classes</Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/lms/teacher/${centerId}/students`)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            Students
                        </CardTitle>
                        <CardDescription>
                            View and manage your students
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full">View Students</Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/lms/teacher/${centerId}/attendance`)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-green-500" />
                            Attendance
                        </CardTitle>
                        <CardDescription>
                            Mark attendance and view records
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="secondary" className="w-full">Take Attendance</Button>
                    </CardContent>
                </Card>
            </div>

            {/* Assignments Section */}
            {assignments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-primary" />
                            Recent Assignments to Review
                        </CardTitle>
                        <CardDescription>
                            {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} pending review
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {assignments.slice(0, 3).map((assignment) => (
                                <div key={assignment.assignment_id} className="p-3 border rounded-lg hover:bg-accent cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium">{assignment.coaching_name}</p>
                                            {assignment.branch_name && (
                                                <p className="text-sm text-muted-foreground">{assignment.branch_name}</p>
                                            )}
                                        </div>
                                        <Badge variant={assignment.is_active ? 'default' : 'secondary'}>
                                            {assignment.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {assignments.length > 3 && (
                            <Button variant="link" className="w-full mt-4" onClick={() => router.push(`/lms/teacher/${centerId}/assignments`)}>
                                View All Assignments
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

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
