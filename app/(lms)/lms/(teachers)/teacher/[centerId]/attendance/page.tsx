/**
 * Teacher Attendance Page
 * 
 * Main page for teachers to mark and manage student attendance
 * Route: /lms/teacher/[centerId]/attendance
 * 
 * Features:
 * - Default view of first class with enrolled students
 * - Class filter to switch between assigned classes
 * - Individual and bulk attendance marking
 * - View and edit attendance records
 * - Mobile-friendly responsive design
 */

'use client';

import { useTeacherContext } from '../layout';
import { TeacherAttendanceDashboard } from '../_components/attendances';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function TeacherAttendancePage() {
    const { coachingCenter, isLoading, error, centerId } = useTeacherContext();

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                {/* Class filter skeleton */}
                <div className="flex gap-3">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-32 rounded-full" />
                    ))}
                </div>
                {/* Student list skeleton */}
                <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-xl" />
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
            <TeacherAttendanceDashboard centerId={centerId} />
        </div>
    );
}
