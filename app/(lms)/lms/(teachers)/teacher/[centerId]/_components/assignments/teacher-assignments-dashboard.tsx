'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, X } from 'lucide-react';

// Toast notifications
import {
    showSuccessToast,
    showErrorToast,
    showLoadingToast,
} from '@/lib/toast';

// Assignment store hooks
import {
    useAssignmentStore,
    useAssignments,
    useAssignmentLoading,
    useAssignmentError,
    useSubmissionsForGrading,
    useIsDeleteDialogOpen,
    useAssignmentToDelete,
    useIsGradingDialogOpen,
    useSubmissionToGrade,
    useCurrentAssignment,
} from '@/lib/branch-system/stores/assignment.store';

// Classes store hooks
import {
    useClassesByTeacher,
    useClassesLoading,
    useBranchClassesStore,
} from '@/lib/branch-system/stores/branch-classes.store';

// Types
import type { Assignment, CreateAssignmentDTO, UpdateAssignmentDTO, GradeSubmissionDTO, SubmissionForGrading } from '@/lib/branch-system/types/assignment.types';
import { AssignmentStatus } from '@/lib/branch-system/assignment';
import { formatFileSize } from '@/lib/branch-system/utils/assignment.utils';
import { fileUploadService } from '@/lib/branch-system/services/file-upload.service';

// Child components
import { AssignmentsHeader } from './assignments-header';
import { AssignmentsFilters } from './assignments-filters';
import { AssignmentsListView } from './assignments-list-view';
import { AssignmentCard } from './assignment-card';
import { CreateAssignmentDialog } from './create-assignment-dialog';
import { EditAssignmentDialog } from './edit-assignment-dialog';
import { DeleteAssignmentDialog } from './delete-assignment-dialog';
import { AssignmentDetailDialog } from './assignment-detail-sheet';
import { GradingDialog } from './grading-dialog';

type ViewMode = 'grid' | 'list';

export interface TeacherAssignmentsDashboardProps {
    centerId: string;
    teacherId: string;
    userRole?: 'student' | 'teacher' | 'coach' | 'manager';
}

export function TeacherAssignmentsDashboard({
    centerId,
    teacherId,
    userRole = 'teacher',
}: TeacherAssignmentsDashboardProps) {
    const router = useRouter();

    // ============================================================
    // STORE HOOKS
    // ============================================================
    const assignments = useAssignments();
    const loading = useAssignmentLoading();
    const error = useAssignmentError();
    const submissionsForGrading = useSubmissionsForGrading();
    const isDeleteDialogOpen = useIsDeleteDialogOpen();
    const assignmentToDelete = useAssignmentToDelete();
    const isGradingDialogOpen = useIsGradingDialogOpen();
    const submissionToGrade = useSubmissionToGrade();
    const currentAssignment = useCurrentAssignment();

    const {
        fetchAssignments,
        fetchSubmissionsForGrading,
        createAssignment,
        updateAssignment,
        publishAssignment,
        closeAssignment,
        deleteAssignment,
        gradeSubmission,
        openDeleteDialog,
        closeDeleteDialog,
        openGradingDialog,
        closeGradingDialog,
        clearError,
    } = useAssignmentStore();

    const { fetchClassesByTeacher } = useBranchClassesStore();
    const teacherClasses = useClassesByTeacher(teacherId);
    const { fetchClasses: classesLoading } = useClassesLoading();

    // ============================================================
    // LOCAL STATE
    // ============================================================
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<AssignmentStatus | 'all'>('all');
    const [classFilter, setClassFilter] = useState<string>('all');

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
    const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
    const [previewAssignment, setPreviewAssignment] = useState<Assignment | null>(null);

    // Fetch data on mount
    useEffect(() => {
        if (teacherId) {
            fetchAssignments({ teacher_id: teacherId });
            fetchClassesByTeacher(teacherId);
        }
    }, [teacherId, fetchAssignments, fetchClassesByTeacher]);

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================
    const getFriendlyErrorMessage = (error: string): string => {
        const lowerError = error.toLowerCase();
        if (lowerError.includes('valid_dates')) return "Due date must be before close date.";
        if (lowerError.includes('unauthorized')) return "You don't have permission.";
        return error.length > 100 ? "An unexpected error occurred." : error;
    };

    // ============================================================
    // COMPUTED VALUES
    // ============================================================
    const availableClasses = useMemo(() => {
        const classMap = new Map<string, string>();
        assignments.forEach(a => {
            if (a.class_id) {
                const classInfo = teacherClasses.find(c => c.id === a.class_id);
                classMap.set(a.class_id, classInfo?.class_name || 'Unknown Class');
            }
        });
        return Array.from(classMap.entries()).map(([id, name]) => ({ id, name }));
    }, [assignments, teacherClasses]);

    const filteredAssignments = useMemo(() => {
        let filtered = assignments;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(a => a.title.toLowerCase().includes(query));
        }
        if (statusFilter !== 'all') filtered = filtered.filter(a => a.status === statusFilter);
        if (classFilter !== 'all') filtered = filtered.filter(a => a.class_id === classFilter);
        return filtered;
    }, [assignments, searchQuery, statusFilter, classFilter]);

    const friendlyErrorMessage = useMemo(() => error ? getFriendlyErrorMessage(error) : null, [error]);

    // ============================================================
    // EVENT HANDLERS (FIXED TOAST LOGIC)
    // ============================================================

    const handleCreate = useCallback(async (
        data: CreateAssignmentDTO,
        pendingFiles: Array<{
            file: File;
            content: string;
            preview: { name: string; size: number; type: string; };
        }>
    ) => {
        const toastId = showLoadingToast('Creating assignment...');
        try {
            // Step 1: Create assignment
            console.log('📝 [handleCreate] Creating assignment...');
            const result = await createAssignment({ ...data, teacher_id: teacherId });

            if (!result?.success || !result?.data) {
                console.error('📝 [handleCreate] Assignment creation failed:', result?.error);
                showErrorToast('Failed to create assignment', { id: toastId });
                return;
            }

            const assignmentId = result.data.id;
            console.log('📝 [handleCreate] Assignment created with ID:', assignmentId);

            // Step 2: Upload files if any (with progress tracking)
            if (pendingFiles && pendingFiles.length > 0) {
                const totalFiles = pendingFiles.length;
                let uploadedCount = 0;
                let failedCount = 0;

                console.log(`📎 [handleCreate] Starting upload of ${totalFiles} file(s)...`);

                for (let i = 0; i < totalFiles; i++) {
                    const pendingFile = pendingFiles[i];
                    const fileNum = i + 1;

                    // Update toast to show progress with file info
                    showLoadingToast(
                        `Uploading file ${fileNum}/${totalFiles}: ${pendingFile.file.name} (${formatFileSize(pendingFile.file.size)})...`,
                        { id: toastId }
                    );

                    console.log(`📎 [handleCreate] Uploading file ${fileNum}/${totalFiles}: ${pendingFile.file.name} (${formatFileSize(pendingFile.file.size)})`);

                    try {
                        // Upload file to storage - this will wait for the upload to complete
                        const uploadStartTime = Date.now();

                        const uploadResult = await fileUploadService.uploadFile({
                            file: pendingFile.file,
                            assignmentId: assignmentId,
                            uploadType: 'instruction',
                        });

                        const uploadDuration = Date.now() - uploadStartTime;
                        console.log(`📎 [handleCreate] Upload took ${uploadDuration}ms, result:`, uploadResult.success ? 'SUCCESS' : 'FAILED');

                        if (uploadResult.success && uploadResult.data) {
                            uploadedCount++;
                            console.log(`✅ [handleCreate] File ${fileNum} uploaded successfully: ${uploadResult.data.fileName}`);
                        } else {
                            failedCount++;
                            console.error(`❌ [handleCreate] Failed to upload file: ${pendingFile.file.name}`, uploadResult.error);
                        }
                    } catch (fileError) {
                        failedCount++;
                        console.error(`❌ [handleCreate] Error uploading file ${pendingFile.file.name}:`, fileError);
                        // Continue with other files even if one fails
                    }
                }

                console.log(`📎 [handleCreate] Upload complete: ${uploadedCount} succeeded, ${failedCount} failed`);

                // Show appropriate message based on results
                if (failedCount > 0 && uploadedCount > 0) {
                    showSuccessToast(`Assignment created. ${uploadedCount} file(s) uploaded, ${failedCount} failed.`, { id: toastId });
                } else if (failedCount > 0) {
                    showErrorToast(`Assignment created but file upload failed. Please try uploading files again.`, { id: toastId });
                } else {
                    showSuccessToast('Assignment created successfully with all files!', { id: toastId });
                }
            } else {
                // No files to upload
                showSuccessToast('Assignment created successfully', { id: toastId });
            }

            // Step 3: Close dialog and refresh
            setIsCreateDialogOpen(false);
            await fetchAssignments({ teacher_id: teacherId }, true);

            return assignmentId;
        } catch (err) {
            console.error('❌ [handleCreate] Unexpected error:', err);
            showErrorToast(getFriendlyErrorMessage(err instanceof Error ? err.message : 'Unknown error'), { id: toastId });
        }
    }, [teacherId, createAssignment, fetchAssignments]);

    const handleUpdate = useCallback(async (data: UpdateAssignmentDTO) => {
        if (!editingAssignment) return;
        const toastId = showLoadingToast('Updating assignment...');
        try {
            const success = await updateAssignment({ ...data, id: editingAssignment.id });
            if (success) {
                showSuccessToast('Assignment updated successfully', { id: toastId });
                setIsEditDialogOpen(false);
                setEditingAssignment(null);
                await fetchAssignments({ teacher_id: teacherId }, true);
            } else {
                showErrorToast('Failed to update assignment', { id: toastId });
            }
        } catch (err) {
            showErrorToast(getFriendlyErrorMessage(err instanceof Error ? err.message : 'Unknown error'), { id: toastId });
        }
    }, [editingAssignment, teacherId, updateAssignment, fetchAssignments]);

    const handlePublish = useCallback(async (assignment: Assignment) => {
        const toastId = showLoadingToast('Publishing assignment...');
        try {
            const success = await publishAssignment({ id: assignment.id });
            if (success) {
                showSuccessToast('Assignment published successfully', { id: toastId });
                await fetchAssignments({ teacher_id: teacherId }, true);
            } else {
                showErrorToast('Failed to publish assignment', { id: toastId });
            }
        } catch (err) {
            showErrorToast(getFriendlyErrorMessage(err instanceof Error ? err.message : 'Unknown error'), { id: toastId });
        }
    }, [teacherId, publishAssignment, fetchAssignments]);

    const handleClose = useCallback(async (assignment: Assignment) => {
        const toastId = showLoadingToast('Closing assignment...');
        try {
            const success = await closeAssignment({ id: assignment.id });
            if (success) {
                showSuccessToast('Assignment closed successfully', { id: toastId });
                await fetchAssignments({ teacher_id: teacherId }, true);
            } else {
                showErrorToast('Failed to close assignment', { id: toastId });
            }
        } catch (err) {
            showErrorToast(getFriendlyErrorMessage(err instanceof Error ? err.message : 'Unknown error'), { id: toastId });
        }
    }, [teacherId, closeAssignment, fetchAssignments]);

    const handleDeleteConfirm = useCallback(async (assignmentId: string) => {
        const toastId = showLoadingToast('Deleting assignment...');
        try {
            const success = await deleteAssignment(assignmentId);
            if (success) {
                showSuccessToast('Assignment deleted successfully', { id: toastId });
                closeDeleteDialog();
                await fetchAssignments({ teacher_id: teacherId }, true);
            } else {
                showErrorToast('Failed to delete assignment', { id: toastId });
            }
        } catch (err) {
            showErrorToast(getFriendlyErrorMessage(err instanceof Error ? err.message : 'Unknown error'), { id: toastId });
        }
    }, [teacherId, deleteAssignment, closeDeleteDialog, fetchAssignments]);

    const handleGradeSubmit = useCallback(async (data: GradeSubmissionDTO) => {
        const toastId = showLoadingToast('Submitting grade...');
        try {
            const success = await gradeSubmission({ ...data, graded_by: teacherId });
            if (success) {
                showSuccessToast('Grade submitted successfully', { id: toastId });
                closeGradingDialog();
                // Refresh assignments list to update any grade displays
                await fetchAssignments({ teacher_id: teacherId }, true);
            } else {
                showErrorToast('Failed to submit grade', { id: toastId });
            }
        } catch (err) {
            showErrorToast(getFriendlyErrorMessage(err instanceof Error ? err.message : 'Unknown error'), { id: toastId });
        }
    }, [teacherId, gradeSubmission, closeGradingDialog, fetchAssignments]);

    // View Handlers
    const handleEdit = (assignment: Assignment) => {
        if (assignment.status !== AssignmentStatus.DRAFT) {
            showErrorToast('Only draft assignments can be edited');
            return;
        }
        setEditingAssignment(assignment);
        setIsEditDialogOpen(true);
    };

    const handleDeleteClick = (assignment: Assignment) => {
        if (assignment.status !== AssignmentStatus.DRAFT) {
            showErrorToast('Only draft assignments can be deleted');
            return;
        }
        openDeleteDialog(assignment);
    };

    const handleViewDetails = (assignmentId: string) => {
        // Navigate to the dedicated assignment detail page
        router.push(`/lms/teacher/${centerId}/assignments/${assignmentId}`);
    };

    const handlePreview = (assignment: Assignment) => {
        setPreviewAssignment(assignment);
        setIsPreviewDialogOpen(true);
    };

    // ============================================================
    // RENDER
    // ============================================================

    if (loading.list || classesLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <div className="flex items-start gap-3 w-full">
                        <AlertDescription className="flex-1">{friendlyErrorMessage}</AlertDescription>
                        <button onClick={clearError}><X className="h-4 w-4" /></button>
                    </div>
                </Alert>
            )}

            <AssignmentsHeader
                totalAssignments={filteredAssignments.length}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onCreateClick={() => setIsCreateDialogOpen(true)}
                showCreateButton={true}
            />

            {assignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border rounded-xl bg-card">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mt-4">No Assignments Yet</h3>
                </div>
            ) : (
                <>
                    <AssignmentsFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        statusFilter={statusFilter}
                        onStatusChange={setStatusFilter}
                        classFilter={classFilter}
                        onClassChange={setClassFilter}
                        availableClasses={availableClasses}
                    />

                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredAssignments.map((a) => (
                                <AssignmentCard key={a.id} assignment={a} onViewDetails={handleViewDetails} onPreview={handlePreview} onEdit={handleEdit} onDelete={handleDeleteClick} onPublish={handlePublish} onClose={handleClose} showTeacherActions userRole={userRole} />
                            ))}
                        </div>
                    ) : (
                        <AssignmentsListView assignments={filteredAssignments} onViewDetails={handleViewDetails} onPreview={handlePreview} onEdit={handleEdit} onDelete={handleDeleteClick} onPublish={handlePublish} onClose={handleClose} userRole={userRole} />
                    )}
                </>
            )}

            {/* Dialogs */}
            <CreateAssignmentDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} teacherId={teacherId} branchId={teacherClasses[0]?.branch_id || ''} availableClasses={teacherClasses.map(c => ({ id: c.id, name: c.class_name }))} onSubmit={handleCreate} isSubmitting={loading.create} />
            <EditAssignmentDialog open={isEditDialogOpen} onOpenChange={(o) => { setIsEditDialogOpen(o); if (!o) setEditingAssignment(null); }} assignment={editingAssignment} teacherId={teacherId} branchId={editingAssignment?.branch_id || ''} availableClasses={teacherClasses.map(c => ({ id: c.id, name: c.class_name }))} onSubmit={handleUpdate} isSubmitting={loading.update} />
            <DeleteAssignmentDialog open={isDeleteDialogOpen} onOpenChange={(o) => !o && closeDeleteDialog()} assignment={assignmentToDelete} onConfirm={handleDeleteConfirm} isDeleting={loading.delete} />
            <AssignmentDetailDialog open={isPreviewDialogOpen} onOpenChange={(o) => { setIsPreviewDialogOpen(o); if (!o) setPreviewAssignment(null); }} assignment={previewAssignment} onEdit={handleEdit} onDelete={handleDeleteClick} onPublish={handlePublish} onClose={handleClose} showTeacherActions userRole={userRole} />
            <GradingDialog open={isGradingDialogOpen} onOpenChange={(o) => !o && closeGradingDialog()} submission={submissionToGrade} maxScore={currentAssignment?.max_score || 100} graderId={teacherId} onSubmit={handleGradeSubmit} isLoading={loading.grade} />
        </div>
    );
}