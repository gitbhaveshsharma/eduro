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

    // Store hooks
    const fetchEnrollment = useBranchStudentsStore(state => state.fetchEnrollmentWithRelations);
    const enrollment = useBranchStudentsStore(state => state.currentEnrollmentWithRelations);
    const enrollmentLoading = useBranchStudentsStore(state => state.enrollmentLoading);
    const error = useBranchStudentsStore(state => state.error);

    // Dialog state
    const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);

    // Fetch enrollment details
    useEffect(() => {
        if (enrollmentId) {
            console.log('[TeacherStudentDetailPage] Fetching enrollment:', enrollmentId);
            fetchEnrollment(enrollmentId);
        }
    }, [enrollmentId, fetchEnrollment]);

    const handleBack = () => {
        router.push(`/lms/teacher/${centerId}/students`);
    };

    // Loading state
    if (enrollmentLoading) {
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

    // Error or not found state
    if (error || !enrollment) {
        return (
            <div className="container max-w-7xl mx-auto p-4 space-y-4">
                <Button variant="ghost" onClick={handleBack} size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Students
                </Button>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error || 'Student enrollment not found'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

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
                    <StudentProfileHeader enrollment={enrollment} />

                    {/* Quick Actions */}
                    <StudentQuickActions
                        enrollment={enrollment}
                        onMarkAttendance={() => setIsMarkAttendanceOpen(true)}
                    />

                    {/* Details Grid */}
                    <StudentDetailsGrid enrollment={enrollment} />
                </div>
            </div>

            {/* Mark Attendance Dialog */}
            {enrollment.branch_id && (
                <MarkAttendanceDialog
                    open={isMarkAttendanceOpen}
                    onOpenChange={setIsMarkAttendanceOpen}
                    branchId={enrollment.branch_id}
                />
            )}
        </>
    );
}
