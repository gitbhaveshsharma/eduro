'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';

import { useTeacherContext } from '../../layout';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';
import MarkAttendanceDialog from '@/app/(lms)/lms/_components/student-attendance/mark-attendance-dialog';
import { StudentProfileHeader } from '../../_components/students/student-details-header';
import { StudentQuickActions } from '../../_components/students/student-quick-actions';
import { StudentDetailsGrid } from '../../_components/students/student-details-grid';

export default function TeacherStudentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { centerId } = useTeacherContext();
    const enrollmentId = params?.enrollmentId as string;

    // Add state to track if we should show error
    const [showError, setShowError] = useState(false);
    const [hasStartedLoading, setHasStartedLoading] = useState(false);

    // Store hooks
    const fetchEnrollmentWithRelations = useBranchStudentsStore(
        state => state.fetchEnrollmentWithRelations
    );

    const currentEnrollment = useBranchStudentsStore(
        state => state.currentEnrollmentWithRelations
    );

    const enrollmentLoading = useBranchStudentsStore(
        state => state.enrollmentLoading
    );

    const error = useBranchStudentsStore(
        state => state.error
    );

    const clearCurrentEnrollment = useBranchStudentsStore(
        state => state.closeAllDialogs
    );

    // Dialog state
    const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);

    // Track loading start
    useEffect(() => {
        if (enrollmentId && !hasStartedLoading) {
            console.log('[TeacherStudentDetailPage] Starting to fetch enrollment:', enrollmentId);
            setHasStartedLoading(true);
            fetchEnrollmentWithRelations(enrollmentId);
        }
    }, [enrollmentId, hasStartedLoading, fetchEnrollmentWithRelations]);

    // Handle error display with delay
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        if (!enrollmentLoading && !currentEnrollment && hasStartedLoading) {
            // Set timeout to show error after 300ms
            timeoutId = setTimeout(() => {
                setShowError(true);
            }, 300);
        } else {
            // Reset error state if loading or we have data
            setShowError(false);
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [enrollmentLoading, currentEnrollment, hasStartedLoading]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearCurrentEnrollment();
        };
    }, [clearCurrentEnrollment]);

    const handleBack = () => {
        router.push(`/lms/teacher/${centerId}/students`);
    };

    // Show loading skeleton while fetching
    if ((enrollmentLoading && !currentEnrollment) || !hasStartedLoading) {
        return (
            <div className="container max-w-7xl mx-auto p-4 space-y-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-40" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
            </div>
        );
    }

    // Show student details if we have enrollment data
    if (currentEnrollment && !enrollmentLoading) {
        return (
            <>
                <div className="space-y-6">
                    <div className="space-y-6">
                        {/* Header with Back Button */}
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" onClick={handleBack} size="sm" className="h-10">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Back to Students</span>
                                <span className="sm:hidden">Back</span>
                            </Button>
                        </div>

                        {/* Student Profile Header */}
                        <StudentProfileHeader enrollment={currentEnrollment} />

                        {/* Quick Actions */}
                        <StudentQuickActions
                            enrollment={currentEnrollment}
                            onMarkAttendance={() => setIsMarkAttendanceOpen(true)}
                        />

                        {/* Details Grid */}
                        <StudentDetailsGrid enrollment={currentEnrollment} />
                    </div>
                </div>

                {/* Mark Attendance Dialog */}
                {currentEnrollment.branch_id && (
                    <MarkAttendanceDialog
                        open={isMarkAttendanceOpen}
                        onOpenChange={setIsMarkAttendanceOpen}
                        branchId={currentEnrollment.branch_id}
                    />
                )}
            </>
        );
    }

    // Show error/fallback if no data and not loading (with delay)
    if (showError) {
        return (
            <div className="container max-w-7xl mx-auto p-4 space-y-4">
                <Button variant="ghost" onClick={handleBack} size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Students
                </Button>
                <Alert variant="destructive">
                    <AlertDescription>
                        {error || 'Unable to load student details'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Show loading skeleton while waiting for error delay or in intermediate state
    return (
        <div className="container max-w-7xl mx-auto p-4 space-y-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-40" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
            </div>
        </div>
    );
}