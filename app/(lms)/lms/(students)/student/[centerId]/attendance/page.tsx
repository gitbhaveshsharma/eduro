/**
 * Student Attendance Page
 * 
 * Main page for students to view their attendance records
 * Route: /lms/student/[centerId]/attendance
 * 
 * Features:
 * - READ-ONLY access (students view their attendance)
 * - Filter by enrolled classes
 * - Date range filtering
 * - Performance metrics and summary
 * - Mobile-friendly responsive design
 * 
 * IMPORTANT: 
 * - Shows attendance ONLY for the current coaching center (centerId)
 * - If student is enrolled in multiple centers, each has separate attendance
 */

'use client';

import { useStudentContext } from '../layout';
import { StudentAttendanceDashboard } from '../_components/attendances';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function StudentAttendancePage() {
    const { coachingCenter, isLoading, error, centerId } = useStudentContext();

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
                {/* Summary card skeleton */}
                <Skeleton className="h-40 rounded-xl" />
                {/* Attendance records skeleton */}
                <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-xl" />
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
            <StudentAttendanceDashboard centerId={centerId} />
        </div>
    );
}
