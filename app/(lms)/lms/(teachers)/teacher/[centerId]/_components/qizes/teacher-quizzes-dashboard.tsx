/**
 * Teacher Quizzes Dashboard Component
 * 
 * Main dashboard for teachers to manage their quizzes
 * Orchestrates all quiz components and handles state management
 * Mobile-first responsive design
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileQuestion } from 'lucide-react';

// Toast notifications
import {
    showSuccessToast,
    showErrorToast,
    showLoadingToast,
} from '@/lib/toast';

// Quiz store hooks
import {
    useQuizStore,
    useQuizzes,
    useQuizLoading,
    useQuizError,
} from '@/lib/branch-system/stores/quiz.store';

// Classes store hooks
import {
    useClassesByTeacher,
    useClassesLoading,
    useBranchClassesStore,
} from '@/lib/branch-system/stores/branch-classes.store';

// Types
import type { Quiz, CreateQuizDTO, UpdateQuizDTO } from '@/lib/branch-system/types/quiz.types';
import { getQuizAvailabilityStatus } from '@/lib/branch-system/quiz';

// Child components
import { QuizzesHeader, type ViewMode } from './quizzes-header';
import { QuizzesFilters, type QuizStatusFilter } from './quizzes-filters';
import { QuizzesListView } from './quizzes-list-view';
import { QuizCard } from './quiz-card';
import { CreateQuizDialog } from './create-quiz-dialog';
import { EditQuizDialog } from './edit-quiz-dialog';
import { DeleteQuizDialog } from './delete-quiz-dialog';

export interface TeacherQuizzesDashboardProps {
    centerId: string;
    teacherId: string;
    userRole?: 'student' | 'teacher' | 'coach' | 'manager';
}

export function TeacherQuizzesDashboard({
    centerId,
    teacherId,
    userRole = 'teacher',
}: TeacherQuizzesDashboardProps) {
    // ============================================================
    // STORE HOOKS
    // ============================================================
    const quizzes = useQuizzes();
    const loading = useQuizLoading();
    const error = useQuizError();

    const {
        fetchQuizzes,
        createQuiz,
        updateQuiz,
        toggleQuizActive,
        deleteQuiz,
        clearError,
    } = useQuizStore();

    const { fetchClassesByTeacher } = useBranchClassesStore();
    const teacherClasses = useClassesByTeacher(teacherId);
    const { fetchClasses: classesLoading } = useClassesLoading();

    // ============================================================
    // LOCAL STATE
    // ============================================================
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<QuizStatusFilter>('all');
    const [classFilter, setClassFilter] = useState<string>('all');

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingQuiz, setDeletingQuiz] = useState<Quiz | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch data on mount
    useEffect(() => {
        if (teacherId) {
            fetchQuizzes({ teacher_id: teacherId });
            fetchClassesByTeacher(teacherId);
        }
    }, [teacherId, fetchQuizzes, fetchClassesByTeacher]);

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================
    const getFriendlyErrorMessage = (error: string): string => {
        const lowerError = error.toLowerCase();
        if (lowerError.includes('valid_dates')) return "Available from must be before available to.";
        if (lowerError.includes('unauthorized')) return "You don't have permission.";
        if (lowerError.includes('duplicate')) return "A quiz with this title already exists.";
        return error.length > 100 ? "An unexpected error occurred." : error;
    };

    // ============================================================
    // COMPUTED VALUES
    // ============================================================
    const availableClasses = useMemo(() => {
        return teacherClasses.map(cls => ({
            id: cls.id,
            name: cls.class_name,
            subject: cls.subject,
        }));
    }, [teacherClasses]);

    const classesForFilter = useMemo(() => {
        const classMap = new Map<string, string>();
        quizzes.forEach(q => {
            if (q.class_id && q.class) {
                classMap.set(q.class_id, q.class.class_name);
            }
        });
        return Array.from(classMap.entries()).map(([id, name]) => ({ id, name }));
    }, [quizzes]);

    const filteredQuizzes = useMemo(() => {
        let filtered = quizzes;

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(q =>
                q.title.toLowerCase().includes(query) ||
                q.description?.toLowerCase().includes(query) ||
                q.class?.class_name.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(q => {
                const availability = getQuizAvailabilityStatus(q.available_from, q.available_to);

                switch (statusFilter) {
                    case 'active':
                        return q.is_active && availability.status === 'active';
                    case 'inactive':
                        return !q.is_active;
                    case 'upcoming':
                        return q.is_active && availability.status === 'upcoming';
                    case 'ended':
                        return availability.status === 'ended';
                    default:
                        return true;
                }
            });
        }

        // Class filter
        if (classFilter !== 'all') {
            filtered = filtered.filter(q => q.class_id === classFilter);
        }

        return filtered;
    }, [quizzes, searchQuery, statusFilter, classFilter]);

    const friendlyErrorMessage = useMemo(() =>
        error?.message ? getFriendlyErrorMessage(error.message) : null,
        [error]
    );

    // ============================================================
    // EVENT HANDLERS
    // ============================================================

    const handleCreate = useCallback(async (data: CreateQuizDTO) => {
        const toastId = showLoadingToast('Creating quiz...');
        setIsSubmitting(true);

        try {
            const result = await createQuiz(data);

            if (result) {
                showSuccessToast('Quiz created successfully! You can now add questions.', { id: toastId });
                setIsCreateDialogOpen(false);
                fetchQuizzes({ teacher_id: teacherId });
            } else {
                showErrorToast('Failed to create quiz', { id: toastId });
            }
        } catch (err) {
            console.error('[TeacherQuizzesDashboard] Create error:', err);
            showErrorToast('An unexpected error occurred', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    }, [createQuiz, fetchQuizzes, teacherId]);

    const handleUpdate = useCallback(async (data: UpdateQuizDTO) => {
        const toastId = showLoadingToast('Saving changes...');
        setIsSubmitting(true);

        try {
            const result = await updateQuiz(data);

            if (result) {
                showSuccessToast('Quiz updated successfully', { id: toastId });
                setIsEditDialogOpen(false);
                setEditingQuiz(null);
                fetchQuizzes({ teacher_id: teacherId });
            } else {
                showErrorToast('Failed to update quiz', { id: toastId });
            }
        } catch (err) {
            console.error('[TeacherQuizzesDashboard] Update error:', err);
            showErrorToast('An unexpected error occurred', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    }, [updateQuiz, fetchQuizzes, teacherId]);

    const handleToggleActive = useCallback(async (quiz: Quiz) => {
        const action = quiz.is_active ? 'Deactivating' : 'Activating';
        const toastId = showLoadingToast(`${action} quiz...`);

        try {
            const result = await toggleQuizActive(quiz.id, !quiz.is_active);

            if (result) {
                const status = quiz.is_active ? 'deactivated' : 'activated';
                showSuccessToast(`Quiz ${status} successfully`, { id: toastId });
                fetchQuizzes({ teacher_id: teacherId });
            } else {
                showErrorToast('Failed to update quiz status', { id: toastId });
            }
        } catch (err) {
            console.error('[TeacherQuizzesDashboard] Toggle error:', err);
            showErrorToast('An unexpected error occurred', { id: toastId });
        }
    }, [toggleQuizActive, fetchQuizzes, teacherId]);

    const handleDelete = useCallback(async () => {
        if (!deletingQuiz) return;

        const toastId = showLoadingToast('Deleting quiz...');
        setIsDeleting(true);

        try {
            const success = await deleteQuiz(deletingQuiz.id);

            if (success) {
                showSuccessToast('Quiz deleted successfully', { id: toastId });
                setIsDeleteDialogOpen(false);
                setDeletingQuiz(null);
                fetchQuizzes({ teacher_id: teacherId });
            } else {
                showErrorToast('Failed to delete quiz', { id: toastId });
            }
        } catch (err) {
            console.error('[TeacherQuizzesDashboard] Delete error:', err);
            showErrorToast('An unexpected error occurred', { id: toastId });
        } finally {
            setIsDeleting(false);
        }
    }, [deletingQuiz, deleteQuiz, fetchQuizzes, teacherId]);

    const handleViewDetails = useCallback((quizId: string) => {
        // TODO: Navigate to quiz details page or open detail sheet
        console.log('[TeacherQuizzesDashboard] View details:', quizId);
    }, []);

    const handleEdit = useCallback((quiz: Quiz) => {
        setEditingQuiz(quiz);
        setIsEditDialogOpen(true);
    }, []);

    const handleOpenDeleteDialog = useCallback((quiz: Quiz) => {
        setDeletingQuiz(quiz);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleManageQuestions = useCallback((quiz: Quiz) => {
        // TODO: Navigate to question management page
        console.log('[TeacherQuizzesDashboard] Manage questions:', quiz.id);
    }, []);

    const handleClearFilters = useCallback(() => {
        setSearchQuery('');
        setStatusFilter('all');
        setClassFilter('all');
    }, []);

    // ============================================================
    // LOADING STATE
    // ============================================================
    if (loading.quizzes && quizzes.length === 0) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 flex-1 max-w-xs" />
                    <Skeleton className="h-10 w-32" />
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
    // ERROR STATE
    // ============================================================
    if (friendlyErrorMessage && quizzes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{friendlyErrorMessage}</AlertDescription>
                </Alert>
                <button
                    onClick={() => {
                        clearError();
                        fetchQuizzes({ teacher_id: teacherId });
                    }}
                    className="text-sm text-primary hover:underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="space-y-6">
            {/* Header */}
            <QuizzesHeader
                title="Quizzes"
                description="Create and manage quizzes for your students"
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onCreateQuiz={() => setIsCreateDialogOpen(true)}
                showCreateButton={availableClasses.length > 0}
                createButtonDisabled={availableClasses.length === 0}
                totalQuizzes={quizzes.length}
                filteredCount={filteredQuizzes.length}
            />

            {/* Filters */}
            <QuizzesFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                classFilter={classFilter}
                onClassFilterChange={setClassFilter}
                availableClasses={classesForFilter}
                onClearFilters={handleClearFilters}
            />

            {/* No classes warning */}
            {availableClasses.length === 0 && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        You need to be assigned to at least one class before creating quizzes.
                    </AlertDescription>
                </Alert>
            )}

            {/* Quiz List */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredQuizzes.length > 0 ? (
                        filteredQuizzes.map((quiz) => (
                            <QuizCard
                                key={quiz.id}
                                quiz={quiz}
                                onViewDetails={handleViewDetails}
                                onEdit={handleEdit}
                                onToggleActive={handleToggleActive}
                                onDelete={handleOpenDeleteDialog}
                                onManageQuestions={handleManageQuestions}
                                showTeacherActions={userRole === 'teacher' || userRole === 'manager'}
                                userRole={userRole}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No quizzes found</h3>
                            <p className="text-muted-foreground text-sm mt-1">
                                {quizzes.length > 0
                                    ? 'Try adjusting your filters'
                                    : 'Create your first quiz to get started'}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <QuizzesListView
                    quizzes={filteredQuizzes}
                    onViewDetails={handleViewDetails}
                    onEdit={handleEdit}
                    onToggleActive={handleToggleActive}
                    onDelete={handleOpenDeleteDialog}
                    onManageQuestions={handleManageQuestions}
                    showTeacherActions={userRole === 'teacher' || userRole === 'manager'}
                    userRole={userRole}
                />
            )}

            {/* Dialogs */}
            <CreateQuizDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                availableClasses={availableClasses}
                teacherId={teacherId}
                branchId={teacherClasses[0]?.branch_id || ''}
                onSubmit={handleCreate}
                isSubmitting={isSubmitting}
            />

            <EditQuizDialog
                open={isEditDialogOpen}
                onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) setEditingQuiz(null);
                }}
                quiz={editingQuiz}
                availableClasses={availableClasses}
                teacherId={teacherId}
                branchId={editingQuiz?.branch_id || teacherClasses[0]?.branch_id || ''}
                onSubmit={handleUpdate}
                isSubmitting={isSubmitting}
            />

            <DeleteQuizDialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    setIsDeleteDialogOpen(open);
                    if (!open) setDeletingQuiz(null);
                }}
                quiz={deletingQuiz}
                onConfirm={handleDelete}
                isDeleting={isDeleting}
            />
        </div>
    );
}
