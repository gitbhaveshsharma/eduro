/**
 * Teacher Assignments Dashboard Component
 * 
 * Main container component that integrates all assignment components.
 * Manages state, data fetching, and coordinates child components.
 * 
 * Features:
 * - Grid and list view modes
 * - Filtering by status, class, and search
 * - CRUD operations with dialogs
 * - Grading workflow
 * - Toast notifications for feedback
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileText, X } from 'lucide-react';

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
    /** Coaching center ID */
    centerId: string;
    /** Teacher user ID */
    teacherId: string;
    /** User role for conditional rendering */
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

    // Assignment store
    const assignments = useAssignments();
    const loading = useAssignmentLoading();
    const error = useAssignmentError();
    const submissionsForGrading = useSubmissionsForGrading();
    const isDeleteDialogOpen = useIsDeleteDialogOpen();
    const assignmentToDelete = useAssignmentToDelete();
    const isGradingDialogOpen = useIsGradingDialogOpen();
    const submissionToGrade = useSubmissionToGrade();
    const currentAssignment = useCurrentAssignment();

    // Assignment store actions
    const {
        fetchAssignments,
        fetchSubmissionsForGrading,
        createAssignment,
        updateAssignment,
        publishAssignment,
        closeAssignment,
        deleteAssignment,
        gradeSubmission,
        setCurrentAssignment,
        openDeleteDialog,
        closeDeleteDialog,
        openGradingDialog,
        closeGradingDialog,
        clearError,
    } = useAssignmentStore();

    // Classes store
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

    // Dialog states
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
    const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

    // ============================================================
    // DATA FETCHING
    // ============================================================

    // Fetch assignments on mount
    useEffect(() => {
        if (teacherId) {
            fetchAssignments({
                teacher_id: teacherId,
            });
        }
    }, [teacherId, fetchAssignments]);

    // Fetch teacher's classes on mount
    useEffect(() => {
        if (teacherId) {
            fetchClassesByTeacher(teacherId);
        }
    }, [teacherId, fetchClassesByTeacher]);

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================

    // Function to parse database error messages into user-friendly messages
    const getFriendlyErrorMessage = (error: string): string => {
        const lowerError = error.toLowerCase();

        // Handle constraint violation errors
        if (lowerError.includes('violates check constraint')) {
            if (lowerError.includes('valid_dates')) {
                return "Invalid dates: Due date must be before or equal to close date, and publish date must be before or equal to due date.";
            }
            if (lowerError.includes('valid_max_score')) {
                return "Maximum score must be greater than 0.";
            }
            if (lowerError.includes('valid_late_penalty')) {
                return "Late penalty must be between 0% and 100%.";
            }
            if (lowerError.includes('valid_file_size_limit')) {
                return "Maximum file size must be greater than 0.";
            }
            return "Data validation failed. Please check your input values.";
        }

        // Handle foreign key constraint errors
        if (lowerError.includes('foreign key constraint')) {
            if (lowerError.includes('class_id')) {
                return "Selected class does not exist or you don't have access to it.";
            }
            if (lowerError.includes('teacher_id')) {
                return "Teacher information is invalid. Please try again.";
            }
            if (lowerError.includes('branch_id')) {
                return "Branch information is invalid. Please try again.";
            }
            return "Related data not found. Please check your selections.";
        }

        // Handle unique constraint errors
        if (lowerError.includes('unique constraint')) {
            return "An assignment with similar details already exists.";
        }

        // Handle network/timeout errors
        if (lowerError.includes('network') || lowerError.includes('timeout') || lowerError.includes('fetch')) {
            return "Network error. Please check your internet connection and try again.";
        }

        // Handle authentication/authorization errors
        if (lowerError.includes('unauthorized') || lowerError.includes('forbidden') || lowerError.includes('401') || lowerError.includes('403')) {
            return "You don't have permission to perform this action.";
        }

        // Handle server errors
        if (lowerError.includes('500') || lowerError.includes('server error')) {
            return "Server error. Please try again in a few moments.";
        }

        // Handle not found errors
        if (lowerError.includes('not found') || lowerError.includes('404')) {
            return "The requested resource was not found.";
        }

        // Generic error messages based on common patterns
        if (lowerError.includes('invalid') || lowerError.includes('validation')) {
            return "Invalid data provided. Please check your input and try again.";
        }

        if (lowerError.includes('required') || lowerError.includes('missing')) {
            return "Required information is missing. Please fill all required fields.";
        }

        if (lowerError.includes('deadline') || lowerError.includes('due date')) {
            return "Invalid date selection. Please check the assignment dates.";
        }

        // Return original error if no match found
        return error.length > 200 ? "An unexpected error occurred. Please try again." : error;
    };

    // ============================================================
    // COMPUTED VALUES
    // ============================================================

    // Get unique class IDs from assignments and map to class names
    const availableClasses = useMemo(() => {
        const classMap = new Map<string, string>();

        assignments.forEach(assignment => {
            if (assignment.class_id) {
                const classInfo = teacherClasses.find(c => c.id === assignment.class_id);
                if (classInfo) {
                    classMap.set(assignment.class_id, classInfo.class_name);
                } else {
                    classMap.set(assignment.class_id, 'Unknown Class');
                }
            }
        });

        return Array.from(classMap.entries()).map(([id, name]) => ({
            id,
            name,
        }));
    }, [assignments, teacherClasses]);

    // Filter assignments based on search and filters
    const filteredAssignments = useMemo(() => {
        let filtered = assignments;

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.title.toLowerCase().includes(query) ||
                a.description?.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(a => a.status === statusFilter);
        }

        // Class filter
        if (classFilter !== 'all') {
            filtered = filtered.filter(a => a.class_id === classFilter);
        }

        return filtered;
    }, [assignments, searchQuery, statusFilter, classFilter]);

    // Get friendly error message
    const friendlyErrorMessage = useMemo(() => {
        if (!error) return null;
        return getFriendlyErrorMessage(error);
    }, [error]);

    // ============================================================
    // EVENT HANDLERS
    // ============================================================

    // Create assignment
    const handleCreate = useCallback(async (data: CreateAssignmentDTO) => {
        const loadingToast = showLoadingToast('Creating assignment...');

        try {
            const success = await createAssignment({
                ...data,
                teacher_id: teacherId,
            });

            if (success) {
                showSuccessToast('Assignment created successfully');
                setIsCreateDialogOpen(false);
                // Refetch to update list
                await fetchAssignments({ teacher_id: teacherId }, true);
            } else {
                showErrorToast('Failed to create assignment');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            const friendlyMessage = getFriendlyErrorMessage(errorMessage);
            showErrorToast(friendlyMessage);
        }
    }, [teacherId, createAssignment, fetchAssignments]);

    // Edit assignment
    const handleEdit = useCallback((assignment: Assignment) => {
        if (assignment.status !== AssignmentStatus.DRAFT) {
            showErrorToast('Only draft assignments can be edited');
            return;
        }
        setEditingAssignment(assignment);
        setIsEditDialogOpen(true);
    }, []);

    // Update assignment
    const handleUpdate = useCallback(async (data: UpdateAssignmentDTO) => {
        if (!editingAssignment) return;

        const loadingToast = showLoadingToast('Updating assignment...');

        try {
            const success = await updateAssignment({
                ...data,
                id: editingAssignment.id,
            });

            if (success) {
                showSuccessToast('Assignment updated successfully');
                setIsEditDialogOpen(false);
                setEditingAssignment(null);
                await fetchAssignments({ teacher_id: teacherId }, true);
            } else {
                showErrorToast('Failed to update assignment');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            const friendlyMessage = getFriendlyErrorMessage(errorMessage);
            showErrorToast(friendlyMessage);
        }
    }, [editingAssignment, teacherId, updateAssignment, fetchAssignments]);

    // Publish assignment
    const handlePublish = useCallback(async (assignment: Assignment) => {
        if (assignment.status !== AssignmentStatus.DRAFT) {
            showErrorToast('Only draft assignments can be published');
            return;
        }

        const loadingToast = showLoadingToast('Publishing assignment...');

        try {
            const success = await publishAssignment({
                id: assignment.id,
            });

            if (success) {
                showSuccessToast('Assignment published successfully');
                await fetchAssignments({ teacher_id: teacherId }, true);
            } else {
                showErrorToast('Failed to publish assignment');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            const friendlyMessage = getFriendlyErrorMessage(errorMessage);
            showErrorToast(friendlyMessage);
        }
    }, [teacherId, publishAssignment, fetchAssignments]);

    // Close assignment
    const handleClose = useCallback(async (assignment: Assignment) => {
        if (assignment.status !== AssignmentStatus.PUBLISHED) {
            showErrorToast('Only published assignments can be closed');
            return;
        }

        const loadingToast = showLoadingToast('Closing assignment...');

        try {
            const success = await closeAssignment({
                id: assignment.id,
            });

            if (success) {
                showSuccessToast('Assignment closed successfully');
                await fetchAssignments({ teacher_id: teacherId }, true);
            } else {
                showErrorToast('Failed to close assignment');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            const friendlyMessage = getFriendlyErrorMessage(errorMessage);
            showErrorToast(friendlyMessage);
        }
    }, [teacherId, closeAssignment, fetchAssignments]);

    // Open delete dialog
    const handleDeleteClick = useCallback((assignment: Assignment) => {
        if (assignment.status !== AssignmentStatus.DRAFT) {
            showErrorToast('Only draft assignments can be deleted');
            return;
        }
        openDeleteDialog(assignment);
    }, [openDeleteDialog]);

    // Confirm delete
    const handleDeleteConfirm = useCallback(async (assignmentId: string) => {
        const loadingToast = showLoadingToast('Deleting assignment...');

        try {
            const success = await deleteAssignment(assignmentId);

            if (success) {
                showSuccessToast('Assignment deleted successfully');
                closeDeleteDialog();
                await fetchAssignments({ teacher_id: teacherId }, true);
            } else {
                showErrorToast('Failed to delete assignment');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            const friendlyMessage = getFriendlyErrorMessage(errorMessage);
            showErrorToast(friendlyMessage);
        }
    }, [teacherId, deleteAssignment, closeDeleteDialog, fetchAssignments]);

    // View assignment details
    const handleViewDetails = useCallback((assignmentId: string) => {
        const assignment = assignments.find(a => a.id === assignmentId);
        if (assignment) {
            setSelectedAssignment(assignment);
            setIsDetailSheetOpen(true);
            // Fetch submissions for this assignment
            fetchSubmissionsForGrading(assignmentId);
        }
    }, [assignments, fetchSubmissionsForGrading]);

    // Grade submission
    const handleGrade = useCallback((submission: SubmissionForGrading) => {
        openGradingDialog(submission);
    }, [openGradingDialog]);

    // Submit grade
    const handleGradeSubmit = useCallback(async (data: GradeSubmissionDTO) => {
        const loadingToast = showLoadingToast('Submitting grade...');

        try {
            const success = await gradeSubmission({
                ...data,
                graded_by: teacherId,
            });

            if (success) {
                showSuccessToast('Grade submitted successfully');
                closeGradingDialog();
                // Refetch submissions for the current assignment
                if (selectedAssignment) {
                    await fetchSubmissionsForGrading(selectedAssignment.id, true);
                }
            } else {
                showErrorToast('Failed to submit grade');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            const friendlyMessage = getFriendlyErrorMessage(errorMessage);
            showErrorToast(friendlyMessage);
        }
    }, [teacherId, selectedAssignment, gradeSubmission, closeGradingDialog, fetchSubmissionsForGrading]);

    // Reset filters
    const handleResetFilters = useCallback(() => {
        setSearchQuery('');
        setStatusFilter('all');
        setClassFilter('all');
    }, []);

    // ============================================================
    // LOADING STATE
    // ============================================================

    if (loading.list || classesLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-64 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    // ============================================================
    // MAIN RENDER
    // ============================================================

    return (
        <div className="space-y-6">
            {/* Error Alert - Shows at top without hiding UI */}
            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <AlertDescription>
                                {friendlyErrorMessage}
                            </AlertDescription>
                        </div>
                        <button
                            onClick={clearError}
                            className="text-muted-foreground hover:text-foreground transition-colors ml-2 flex-shrink-0"
                            aria-label="Dismiss error"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </Alert>
            )}

            {/* Empty state for no assignments */}
            {assignments.length === 0 && (
                <div className="space-y-6">
                    {/* Header with create button */}
                    <AssignmentsHeader
                        totalAssignments={0}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        onCreateClick={() => setIsCreateDialogOpen(true)}
                        showCreateButton={true}
                    />

                    {/* Empty state */}
                    <div className="flex flex-col items-center justify-center py-12 border rounded-xl bg-card">
                        <div className="rounded-full bg-muted p-6">
                            <FileText className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <div className="text-center space-y-2 mt-4">
                            <h3 className="text-lg font-semibold">No Assignments Yet</h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                                You haven&apos;t created any assignments yet. Create your first
                                assignment to get started with your class.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main content when assignments exist */}
            {assignments.length > 0 && (
                <>
                    {/* Header */}
                    <AssignmentsHeader
                        totalAssignments={filteredAssignments.length}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        onCreateClick={() => setIsCreateDialogOpen(true)}
                        showCreateButton={true}
                    />

                    {/* Filters */}
                    <AssignmentsFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        statusFilter={statusFilter}
                        onStatusChange={setStatusFilter}
                        classFilter={classFilter}
                        onClassChange={setClassFilter}
                        availableClasses={availableClasses}
                    />

                    {/* No Results after filtering */}
                    {filteredAssignments.length === 0 && assignments.length > 0 && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                No assignments match your search criteria. Try adjusting your filters.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Grid View */}
                    {viewMode === 'grid' && filteredAssignments.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredAssignments.map((assignment) => (
                                <AssignmentCard
                                    key={assignment.id}
                                    assignment={assignment}
                                    onViewDetails={handleViewDetails}
                                    onEdit={handleEdit}
                                    onDelete={handleDeleteClick}
                                    onPublish={handlePublish}
                                    onClose={handleClose}
                                    showTeacherActions={true}
                                    userRole={userRole}
                                />
                            ))}
                        </div>
                    )}

                    {/* List View */}
                    {viewMode === 'list' && filteredAssignments.length > 0 && (
                        <AssignmentsListView
                            assignments={filteredAssignments}
                            onViewDetails={handleViewDetails}
                            onEdit={handleEdit}
                            onDelete={handleDeleteClick}
                            onPublish={handlePublish}
                            onClose={handleClose}
                            userRole={userRole}
                        />
                    )}
                </>
            )}

            {/* Create Assignment Dialog */}
            <CreateAssignmentDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                teacherId={teacherId}
                branchId={teacherClasses[0]?.branch_id || ''}
                availableClasses={teacherClasses.map(c => ({ id: c.id, name: c.class_name }))}
                onSubmit={handleCreate}
                isSubmitting={loading.create}
            />

            {/* Edit Assignment Dialog */}
            <EditAssignmentDialog
                open={isEditDialogOpen}
                onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) setEditingAssignment(null);
                }}
                assignment={editingAssignment}
                teacherId={teacherId}
                branchId={editingAssignment?.branch_id || teacherClasses[0]?.branch_id || ''}
                availableClasses={teacherClasses.map(c => ({ id: c.id, name: c.class_name }))}
                onSubmit={handleUpdate}
                isSubmitting={loading.update}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteAssignmentDialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    if (!open) closeDeleteDialog();
                }}
                assignment={assignmentToDelete}
                onConfirm={handleDeleteConfirm}
                isDeleting={loading.delete}
            />

            {/* Assignment Detail Dialog */}
            <AssignmentDetailDialog
                open={isDetailSheetOpen}
                onOpenChange={(open) => {
                    setIsDetailSheetOpen(open);
                    if (!open) setSelectedAssignment(null);
                }}
                assignment={selectedAssignment}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onPublish={handlePublish}
                onClose={handleClose}
                showTeacherActions={true}
                userRole={userRole}
            />

            {/* Grading Dialog */}
            <GradingDialog
                open={isGradingDialogOpen}
                onOpenChange={(open) => {
                    if (!open) closeGradingDialog();
                }}
                submission={submissionToGrade}
                maxScore={selectedAssignment?.max_score || 100}
                graderId={teacherId}
                onSubmit={handleGradeSubmit}
                isLoading={loading.grade}
            />
        </div>
    );
}