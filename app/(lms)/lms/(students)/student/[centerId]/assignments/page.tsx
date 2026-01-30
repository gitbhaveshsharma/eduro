/**
 * Student Assignments & Quizzes Page
 * 
 * Main page for students to view and manage their assignments and quizzes
 * Route: /lms/student/[centerId]/assignments
 * 
 * Features:
 * - Tab-based navigation between Assignments and Quizzes
 * - Smooth slide/fade animations between tabs
 * - View all published assignments/quizzes from enrolled classes
 * - Filter by status, class, and search
 * - Take quizzes and view results
 * - Mobile-friendly responsive design
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStudentContext } from '../layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-guard';
import { StudentAssignmentsDashboard } from '../_components/assignments';
import { StudentQuizzesDashboard } from '../_components/quizzes';
import { branchClassesService } from '@/lib/branch-system/services/branch-classes.service';
import { cn } from '@/lib/utils';

interface EnrollmentData {
    classIds: string[];
    isLoading: boolean;
    error: string | null;
}

type TabValue = 'assignments' | 'quizzes';

export default function StudentAssignmentsPage() {
    const { coachingCenter, isLoading: contextLoading, error: contextError, centerId } = useStudentContext();
    const { userId } = useAuth();
    const [activeTab, setActiveTab] = useState<TabValue>('assignments');

    const [enrollmentData, setEnrollmentData] = useState<EnrollmentData>({
        classIds: [],
        isLoading: true,
        error: null,
    });

    // Fetch student's enrolled classes
    const fetchEnrollments = useCallback(async () => {
        if (!userId || !centerId) return;

        setEnrollmentData(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const result = await branchClassesService.getStudentEnrollmentsByCenter(userId, centerId);

            if (result.success && result.data) {
                const classIds = result.data.map((enrollment: any) => enrollment.class_id);
                setEnrollmentData({
                    classIds,
                    isLoading: false,
                    error: null,
                });
            } else {
                setEnrollmentData({
                    classIds: [],
                    isLoading: false,
                    error: result.error || 'Failed to load enrollments',
                });
            }
        } catch (err) {
            console.error('Error fetching enrollments:', err);
            setEnrollmentData({
                classIds: [],
                isLoading: false,
                error: err instanceof Error ? err.message : 'An unexpected error occurred',
            });
        }
    }, [userId, centerId]);

    useEffect(() => {
        fetchEnrollments();
    }, [fetchEnrollments]);

    // Loading state
    if (contextLoading || !userId || enrollmentData.isLoading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-16 rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-64 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (contextError || !coachingCenter) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Alert variant="destructive" className="max-w-md">
                    <AlertDescription>
                        {contextError || 'Coaching center not found'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Enrollment error
    if (enrollmentData.error) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Alert variant="destructive" className="max-w-md">
                    <AlertDescription>
                        {enrollmentData.error}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as TabValue)}
                className="w-full"
            >
                {/* Shadcn TabsList styled similar to network client */}
                <TabsList className="grid w-full max-w-md grid-cols-2 bg-white p-1 rounded-lg shadow-sm border border-border h-auto">
                    <TabsTrigger
                        value="assignments"
                        className={cn(
                            "py-2.5 px-4 rounded-md text-sm font-medium",
                            "data-[state=active]:bg-[#1D4ED8] data-[state=active]:text-white data-[state=active]:shadow-sm",
                            "data-[state=inactive]:text-[#6B7280] data-[state=inactive]:hover:text-[#111827]",
                            "data-[state=inactive]:bg-transparent"
                        )}
                    >
                        <span className="hidden sm:inline">Assignments</span>
                        <span className="sm:hidden">Assign.</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="quizzes"
                        className={cn(
                            "py-2.5 px-4 rounded-md text-sm font-medium",
                            "data-[state=active]:bg-[#1D4ED8] data-[state=active]:text-white data-[state=active]:shadow-sm",
                            "data-[state=inactive]:text-[#6B7280] data-[state=inactive]:hover:text-[#111827]",
                            "data-[state=inactive]:bg-transparent"
                        )}
                    >
                        Quizzes
                    </TabsTrigger>
                </TabsList>

                {/* Content */}
                <div className="mt-6">
                    {/* Assignments Tab */}
                    {activeTab === 'assignments' && (
                        <StudentAssignmentsDashboard
                            centerId={centerId}
                            studentId={userId}
                            enrolledClassIds={enrollmentData.classIds}
                        />
                    )}

                    {/* Quizzes Tab */}
                    {activeTab === 'quizzes' && (
                        <StudentQuizzesDashboard
                            centerId={centerId}
                            studentId={userId}
                            enrolledClassIds={enrollmentData.classIds}
                        />
                    )}
                </div>
            </Tabs>
        </div>
    );
}
