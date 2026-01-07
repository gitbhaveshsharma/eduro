/**
 * Teacher Classes Page
 * 
 * Main page for teachers to view their assigned classes
 * Route: /lms/teacher/[centerId]/classes
 * 
 * Features:
 * - READ-ONLY access (teachers cannot create/edit/delete classes)
 * - Uses TeacherClassesDashboard component
 * - Mobile-friendly responsive design
 * - Integrated with teacher layout context
 */

'use client';

import { useTeacherContext } from '../layout';
import { TeacherClassesDashboard } from '../_components/dashboard/classes';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function TeacherClassesPage() {
    const { coachingCenter, isLoading, error, centerId } = useTeacherContext();

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-80 rounded-2xl" />
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
        <div className="space-y-6 ">
            <TeacherClassesDashboard centerId={centerId} />
        </div>
    );
}
