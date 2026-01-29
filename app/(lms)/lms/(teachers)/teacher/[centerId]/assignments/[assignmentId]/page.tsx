/**
 * Teacher Assignment Detail Page
 * 
 * Individual assignment detail page for teachers
 * Route: /lms/teacher/[centerId]/assignments/[assignmentId]
 * 
 * Features:
 * - View full assignment details
 * - Download attached files
 * - View list of student submissions
 * - Grade submissions
 * - Manage assignment status (edit, publish, close, delete)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-guard';

// Assignment store and types
import {
    useAssignmentStore,
    useCurrentAssignment,
    useSubmissionsForGrading,
    useAssignmentLoading,
    useAssignmentError,
    useIsGradingDialogOpen,
    useSubmissionToGrade,
} from '@/lib/branch-system/stores/assignment.store';

import type { Assignment, GradeSubmissionDTO, SubmissionForGrading } from '@/lib/branch-system/types/assignment.types';

// Toast notifications
import { showErrorToast, showSuccessToast, showLoadingToast } from '@/lib/toast';

// Components
import {
    AssignmentDetailHeader,
    AssignmentDetailContent,
    SubmissionsList,
    GradingDialog,
    EditAssignmentDialog,
    DeleteAssignmentDialog,
} from '../../_components/assignments';

import {
    AssignmentStatus,
    formatAssignmentStatus,
} from '@/lib/branch-system/assignment';

// Classes store
import { useBranchClassesStore, useClassesByTeacher } from '@/lib/branch-system/stores/branch-classes.store';

export default function TeacherAssignmentDetailPage() {
    const router = useRouter();
    const params = useParams();
    const centerId = params?.centerId as string;
    const assignmentId = params?.assignmentId as string;

    const { userId } = useAuth();

    // Store state
    const currentAssignment = useCurrentAssignment();
    const submissionsForGrading = useSubmissionsForGrading();
    const loading = useAssignmentLoading();
    const error = useAssignmentError();
    const isGradingDialogOpen = useIsGradingDialogOpen();
    const submissionToGrade = useSubmissionToGrade();

    const {
        fetchAssignmentById,
        fetchSubmissionsForGrading,
        updateAssignment,
        publishAssignment,
        closeAssignment,
        deleteAssignment,
        gradeSubmission,
        openGradingDialog,
        closeGradingDialog,
        clearError,
    } = useAssignmentStore();

    const { fetchClassesByTeacher } = useBranchClassesStore();
    const teacherClasses = useClassesByTeacher(userId || '');

    // Local state
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Fetch assignment and submissions
    const fetchData = useCallback(async () => {
        if (!assignmentId || !userId) return;

        await fetchAssignmentById(assignmentId, true);
        await fetchSubmissionsForGrading(assignmentId, true);
    }, [assignmentId, userId, fetchAssignmentById, fetchSubmissionsForGrading]);

    // Fetch teacher classes
    useEffect(() => {
        if (userId) {
            fetchClassesByTeacher(userId);
        }
    }, [userId, fetchClassesByTeacher]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ============================================================
    // EVENT HANDLERS
    // ============================================================

    const handleBack = () => {
        router.push(`/lms/teacher/${centerId}/assignments`);
    };

    const handleEdit = () => {
        if (currentAssignment?.status !== AssignmentStatus.DRAFT) {
            showErrorToast('Only draft assignments can be edited');
            return;
        }
        setIsEditDialogOpen(true);
    };

    const handleUpdate = async (data: any) => {
        if (!currentAssignment) return;

        const toastId = showLoadingToast('Updating assignment...');
        try {
            const success = await updateAssignment({ ...data, id: currentAssignment.id });
            if (success) {
                showSuccessToast('Assignment updated successfully', { id: toastId });
                setIsEditDialogOpen(false);
                await fetchData();
            } else {
                showErrorToast('Failed to update assignment', { id: toastId });
            }
        } catch (err) {
            showErrorToast(err instanceof Error ? err.message : 'Unknown error', { id: toastId });
        }
    };

    const handlePublish = async () => {
        if (!currentAssignment) return;

        const toastId = showLoadingToast('Publishing assignment...');
        try {
            const success = await publishAssignment({ id: currentAssignment.id });
            if (success) {
                showSuccessToast('Assignment published successfully', { id: toastId });
                await fetchData();
            } else {
                showErrorToast('Failed to publish assignment', { id: toastId });
            }
        } catch (err) {
            showErrorToast(err instanceof Error ? err.message : 'Unknown error', { id: toastId });
        }
    };

    const handleClose = async () => {
        if (!currentAssignment) return;

        const toastId = showLoadingToast('Closing assignment...');
        try {
            const success = await closeAssignment({ id: currentAssignment.id });
            if (success) {
                showSuccessToast('Assignment closed successfully', { id: toastId });
                await fetchData();
            } else {
                showErrorToast('Failed to close assignment', { id: toastId });
            }
        } catch (err) {
            showErrorToast(err instanceof Error ? err.message : 'Unknown error', { id: toastId });
        }
    };

    const handleDeleteClick = () => {
        if (currentAssignment?.status !== AssignmentStatus.DRAFT) {
            showErrorToast('Only draft assignments can be deleted');
            return;
        }
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!currentAssignment) return;

        const toastId = showLoadingToast('Deleting assignment...');
        try {
            const success = await deleteAssignment(currentAssignment.id);
            if (success) {
                showSuccessToast('Assignment deleted successfully', { id: toastId });
                setIsDeleteDialogOpen(false);
                router.push(`/lms/teacher/${centerId}/assignments`);
            } else {
                showErrorToast('Failed to delete assignment', { id: toastId });
            }
        } catch (err) {
            showErrorToast(err instanceof Error ? err.message : 'Unknown error', { id: toastId });
        }
    };

    const handleGrade = (submission: SubmissionForGrading) => {
        openGradingDialog(submission);
    };

    const handleGradeSubmit = async (data: GradeSubmissionDTO) => {
        const toastId = showLoadingToast('Submitting grade...');
        try {
            const success = await gradeSubmission({ ...data, graded_by: userId || '' });
            if (success) {
                showSuccessToast('Grade submitted successfully', { id: toastId });
                closeGradingDialog();
                await fetchSubmissionsForGrading(assignmentId, true);
            } else {
                showErrorToast('Failed to submit grade', { id: toastId });
            }
        } catch (err) {
            showErrorToast(err instanceof Error ? err.message : 'Unknown error', { id: toastId });
        }
    };

    // ============================================================
    // RENDER
    // ============================================================

    // Loading state
    if (loading.list || !currentAssignment) {
        return (
            <div className="space-y-6">
                {/* Back button skeleton */}
                <Skeleton className="h-10 w-32" />
                {/* Header skeleton */}
                <div className="space-y-4">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                </div>
                {/* Content skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <Skeleton className="h-64 rounded-2xl" />
                        <Skeleton className="h-64 rounded-2xl" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-48 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <div className="flex items-start gap-3 w-full">
                        <AlertDescription className="flex-1">{error}</AlertDescription>
                        <button onClick={clearError} className="shrink-0">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </Alert>
            )}

            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={handleBack}
                className="gap-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Assignments
            </Button>

            {/* Header */}
            <AssignmentDetailHeader
                assignment={currentAssignment}
                onEdit={handleEdit}
                onPublish={handlePublish}
                onClose={handleClose}
                onDelete={handleDeleteClick}
                showTeacherActions={true}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Assignment Details */}
                <div className="lg:col-span-2 space-y-6">
                    <AssignmentDetailContent
                        assignment={currentAssignment}
                        submission={null}
                    />

                    {/* Submissions List - Only show for published/closed assignments */}
                    {currentAssignment.status !== AssignmentStatus.DRAFT && (
                        <SubmissionsList
                            submissions={submissionsForGrading}
                            onGrade={handleGrade}
                            isLoading={loading.submissions}
                            maxScore={currentAssignment.max_score}
                        />
                    )}
                </div>

                {/* Right Column - Assignment Stats */}
                <div className="space-y-6">
                    {/* Assignment Stats Card */}
                    <div className="rounded-2xl border bg-card p-6">
                        <h3 className="font-semibold mb-4">Assignment Stats</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <span className="text-sm font-medium">
                                    {formatAssignmentStatus(currentAssignment.status)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Max Score</span>
                                <span className="text-sm font-medium">
                                    {currentAssignment.max_score} points
                                </span>
                            </div>
                            {currentAssignment.status !== AssignmentStatus.DRAFT && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Total Submissions</span>
                                        <span className="text-sm font-medium">
                                            {submissionsForGrading.length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Graded</span>
                                        <span className="text-sm font-medium text-green-600">
                                            {submissionsForGrading.filter(s => s.grading_status === 'MANUAL_GRADED').length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Awaiting</span>
                                        <span className="text-sm font-medium text-amber-600">
                                            {submissionsForGrading.filter(s => s.grading_status === 'NOT_GRADED').length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Late Submissions</span>
                                        <span className="text-sm font-medium text-red-600">
                                            {submissionsForGrading.filter(s => s.is_late).length}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <EditAssignmentDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                assignment={currentAssignment}
                teacherId={userId || ''}
                branchId={currentAssignment.branch_id}
                availableClasses={teacherClasses.map(c => ({ id: c.id, name: c.class_name }))}
                onSubmit={handleUpdate}
                isSubmitting={loading.update}
            />

            <DeleteAssignmentDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                assignment={currentAssignment}
                onConfirm={handleDeleteConfirm}
                isDeleting={loading.delete}
            />

            <GradingDialog
                open={isGradingDialogOpen}
                onOpenChange={(o) => !o && closeGradingDialog()}
                submission={submissionToGrade}
                maxScore={currentAssignment.max_score}
                graderId={userId || ''}
                onSubmit={handleGradeSubmit}
                isLoading={loading.grade}
            />
        </div>
    );
}
