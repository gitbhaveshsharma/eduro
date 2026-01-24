/**
 * Student Fees Page
 * 
 * Main page for students to view their fee receipts
 * Route: /lms/student/[centerId]/fees
 * 
 * Features:
 * - Fee summary with payment statistics
 * - Status-based filtering (All, Pending, Paid, Overdue, etc.)
 * - Receipt list with detailed view
 * - READ-ONLY view (students cannot modify receipts)
 * 
 * Note: Shows fees only for the current coaching center (centerId)
 */

'use client';

import { useStudentContext } from '../layout';
import { StudentFeesDashboard } from '../_components/fees';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function StudentFeesPage() {
    const { coachingCenter, isLoading, error, centerId } = useStudentContext();

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                {/* Summary skeleton */}
                <Skeleton className="h-32 w-full rounded-xl" />
                {/* Filter skeleton */}
                <div className="flex gap-3">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-28 rounded-full" />
                    ))}
                </div>
                {/* Receipt list skeleton */}
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
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
            <StudentFeesDashboard centerId={centerId} />
        </div>
    );
}
