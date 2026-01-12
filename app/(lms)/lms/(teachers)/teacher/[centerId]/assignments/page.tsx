/**
 * Teacher Assignments Page
 * 
 * Main page for teachers to manage their assignments
 * Route: /lms/teacher/[centerId]/assignments
 * 
 * Features:
 * - View all assignments for teacher's classes
 * - Create, edit, publish, close assignments
 * - View submissions and grade students
 * - Mobile-friendly responsive design
 */

'use client';

import { useTeacherContext } from '../layout';
import { TeacherAssignmentsDashboard } from '../_components/assignments';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-guard';

export default function TeacherAssignmentsPage() {
    const { coachingCenter, isLoading, error, centerId } = useTeacherContext();
    const { userId } = useAuth();

    // Loading state
    if (isLoading || !userId) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-48 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error || !coachingCenter) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error || 'Coaching center not found'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <TeacherAssignmentsDashboard
                centerId={centerId}
                teacherId={userId}
                userRole="teacher"
            />
        </div>
    );
}
