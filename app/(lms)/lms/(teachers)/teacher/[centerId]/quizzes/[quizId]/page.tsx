/**
 * Quiz Detail Page
 * 
 * Shows complete quiz information with questions management
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTeacherContext } from '../../layout';
import { useAuthStore } from '@/lib/auth-store';

// Store imports
import {
    useQuizStore,
    useSelectedQuiz,
    useQuizQuestions,
    useQuizLoading,
    useQuizError,
} from '@/lib/branch-system/stores/quiz.store';
import {
    useClassesByTeacher,
    useBranchClassesStore,
} from '@/lib/branch-system/stores/branch-classes.store';

// Components
import {
    QuizDetailView,
    QuestionsList,
    EditQuizDialog,
    DeleteQuizDialog,
} from '../../_components/qizes';

// Toast
import {
    showSuccessToast,
    showErrorToast,
    showLoadingToast,
} from '@/lib/toast';

// Types
import type {
    Quiz,
    UpdateQuizDTO,
    CreateQuestionDTO,
    UpdateQuestionDTO,
} from '@/lib/branch-system/types/quiz.types';

export default function QuizDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { centerId } = useTeacherContext();
    const user = useAuthStore((state) => state.user);

    const quizId = params.quizId as string;

    // Store hooks
    const selectedQuiz = useSelectedQuiz();
    const questions = useQuizQuestions();
    const loading = useQuizLoading();
    const error = useQuizError();

    const {
        fetchQuizById,
        fetchQuestions,
        updateQuiz,
        toggleQuizActive,
        deleteQuiz,
        createQuestion,
        updateQuestion,
        deleteQuestion,
        clearError,
    } = useQuizStore();

    const { fetchClassesByTeacher } = useBranchClassesStore();
    const teacherClasses = useClassesByTeacher(user?.id || '');

    // Local state
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch quiz and questions on mount
    useEffect(() => {
        if (quizId) {
            fetchQuizById(quizId, true);
            fetchQuestions(quizId);
        }
    }, [quizId, fetchQuizById, fetchQuestions]);

    // Fetch teacher classes
    useEffect(() => {
        if (user?.id) {
            fetchClassesByTeacher(user.id);
        }
    }, [user?.id, fetchClassesByTeacher]);

    // Navigation
    const handleBack = useCallback(() => {
        router.push(`/lms/teacher/${centerId}/quizzes`);
    }, [router, centerId]);

    // Edit quiz handlers
    const handleEdit = useCallback((quiz: Quiz) => {
        setIsEditDialogOpen(true);
    }, []);

    const handleEditSubmit = useCallback(async (data: UpdateQuizDTO) => {
        const toastId = showLoadingToast('Saving changes...');
        setIsSubmitting(true);

        try {
            const result = await updateQuiz(data);

            if (result) {
                showSuccessToast('Quiz updated successfully!', { id: toastId });
                setIsEditDialogOpen(false);
            } else {
                const errorMsg = error?.message || 'Failed to update quiz';
                showErrorToast(errorMsg, { id: toastId });
            }
        } catch (err) {
            showErrorToast('An error occurred while updating quiz', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    }, [updateQuiz, error]);

    // Toggle active
    const handleToggleActive = useCallback(async (quiz: Quiz) => {
        const newState = !quiz.is_active;
        const action = newState ? 'Activating' : 'Deactivating';
        const toastId = showLoadingToast(`${action} quiz...`);

        try {
            const result = await toggleQuizActive(quiz.id, newState);

            if (result) {
                showSuccessToast(`Quiz ${newState ? 'activated' : 'deactivated'} successfully!`, { id: toastId });
            } else {
                showErrorToast(`Failed to ${action.toLowerCase()} quiz`, { id: toastId });
            }
        } catch (err) {
            showErrorToast('An error occurred', { id: toastId });
        }
    }, [toggleQuizActive]);

    // Delete quiz handlers
    const handleDelete = useCallback((quiz: Quiz) => {
        setIsDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!selectedQuiz) return;

        const toastId = showLoadingToast('Deleting quiz...');
        setIsDeleting(true);

        try {
            const result = await deleteQuiz(selectedQuiz.id);

            if (result) {
                showSuccessToast('Quiz deleted successfully!', { id: toastId });
                setIsDeleteDialogOpen(false);
                router.push(`/lms/teacher/${centerId}/quizzes`);
            } else {
                showErrorToast('Failed to delete quiz', { id: toastId });
            }
        } catch (err) {
            showErrorToast('An error occurred while deleting quiz', { id: toastId });
        } finally {
            setIsDeleting(false);
        }
    }, [selectedQuiz, deleteQuiz, router, centerId]);

    // Question handlers
    const handleCreateQuestion = useCallback(async (data: CreateQuestionDTO) => {
        const result = await createQuestion(data);
        if (result) {
            // Refresh questions
            fetchQuestions(quizId);
        }
        return result;
    }, [createQuestion, fetchQuestions, quizId]);

    const handleUpdateQuestion = useCallback(async (data: UpdateQuestionDTO) => {
        const result = await updateQuestion(data);
        if (result) {
            // Refresh questions
            fetchQuestions(quizId);
        }
        return result;
    }, [updateQuestion, fetchQuestions, quizId]);

    const handleDeleteQuestion = useCallback(async (questionId: string) => {
        const result = await deleteQuestion(questionId);
        if (result) {
            // Refresh questions
            fetchQuestions(quizId);
        }
        return result;
    }, [deleteQuestion, fetchQuestions, quizId]);

    // Compute editable state
    const canEdit = !selectedQuiz?.total_attempts || selectedQuiz.total_attempts === 0;
    const canDelete = canEdit;

    // Available classes for edit dialog
    const availableClasses = teacherClasses.map(cls => ({
        id: cls.id,
        name: cls.class_name,
        subject: cls.subject,
    }));

    return (
        <>
            <QuizDetailView
                quiz={selectedQuiz}
                isLoading={loading.quiz || loading.questions}
                error={error?.message}
                onBack={handleBack}
                onEdit={handleEdit}
                onToggleActive={handleToggleActive}
                onDelete={handleDelete}
                canEdit={canEdit}
                canDelete={canDelete}
                questionsListComponent={
                    selectedQuiz && (
                        <QuestionsList
                            quiz={selectedQuiz}
                            questions={questions}
                            isLoading={loading.questions}
                            error={error?.message}
                            canEdit={canEdit}
                            onCreateQuestion={handleCreateQuestion}
                            onUpdateQuestion={handleUpdateQuestion}
                            onDeleteQuestion={handleDeleteQuestion}
                        />
                    )
                }
            />

            {/* Edit Quiz Dialog */}
            <EditQuizDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                quiz={selectedQuiz}
                availableClasses={availableClasses}
                teacherId={user?.id || ''}
                branchId={selectedQuiz?.branch_id || ''}
                onSubmit={handleEditSubmit}
                isSubmitting={isSubmitting}
            />

            {/* Delete Quiz Dialog */}
            <DeleteQuizDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                quiz={selectedQuiz}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </>
    );
}
