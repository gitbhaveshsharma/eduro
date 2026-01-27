/**
 * Student Quizzes Page
 * 
 * Main page for students to view and manage their quizzes
 * Route: /lms/student/[centerId]/quizzes
 * 
 * Features:
 * - View all active quizzes from enrolled classes
 * - Filter by status, class, and search
 * - Start, continue, and review quiz attempts
 * - View quiz results and scores
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStudentContext } from '../layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-guard';
import { StudentQuizzesDashboard } from '../_components/quizzes';
import { branchClassesService } from '@/lib/branch-system/services/branch-classes.service';

interface EnrollmentData {
    classIds: string[];
    isLoading: boolean;
    error: string | null;
}

export default function StudentQuizzesPage() {
    const { coachingCenter, isLoading: contextLoading, error: contextError, centerId } = useStudentContext();
    const { userId } = useAuth();

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
                const classIds = result.data.map((enrollment: { class_id: string }) => enrollment.class_id);
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
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-xl" />
                    ))}
                </div>
                <div className="flex gap-3">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-11 w-32 rounded-full" />
                    ))}
                </div>
                <Skeleton className="h-16 rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-72 rounded-2xl" />
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
                    <AlertCircle className="h-4 w-4" />
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
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {enrollmentData.error}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <StudentQuizzesDashboard
            centerId={centerId}
            studentId={userId}
            enrolledClassIds={enrollmentData.classIds}
        />
    );
}
