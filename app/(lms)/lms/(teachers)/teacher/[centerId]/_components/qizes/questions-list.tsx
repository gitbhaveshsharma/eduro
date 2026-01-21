/**
 * Questions List Component
 * 
 * Displays and manages a list of quiz questions
 * Supports adding, editing, deleting, and reordering questions
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Plus,
    FileQuestion,
    AlertCircle,
    Target,
    BarChart3,
    ArrowUpDown,
} from 'lucide-react';
import { QuestionCard } from './question-card';
import { CreateQuestionDialog } from './create-question-dialog';
import { EditQuestionDialog } from './edit-question-dialog';
import { DeleteQuestionDialog } from './delete-question-dialog';
import {
    showSuccessToast,
    showErrorToast,
    showLoadingToast,
} from '@/lib/toast';
import type {
    Quiz,
    QuizQuestion,
    CreateQuestionDTO,
    UpdateQuestionDTO
} from '@/lib/branch-system/types/quiz.types';

export interface QuestionsListProps {
    /** Quiz that owns these questions */
    quiz: Quiz;
    /** List of questions */
    questions: QuizQuestion[];
    /** Whether questions are loading */
    isLoading?: boolean;
    /** Error message if any */
    error?: string | null;
    /** Whether the quiz can be edited (no attempts) */
    canEdit?: boolean;
    /** Callback to create a question */
    onCreateQuestion: (data: CreateQuestionDTO) => Promise<QuizQuestion | null>;
    /** Callback to update a question */
    onUpdateQuestion: (data: UpdateQuestionDTO) => Promise<QuizQuestion | null>;
    /** Callback to delete a question */
    onDeleteQuestion: (questionId: string) => Promise<boolean>;
    /** Callback when questions are reordered */
    onReorderQuestions?: (questionOrders: Array<{ id: string; order: number }>) => Promise<boolean>;
    /** Additional className */
    className?: string;
}

export function QuestionsList({
    quiz,
    questions,
    isLoading = false,
    error = null,
    canEdit = true,
    onCreateQuestion,
    onUpdateQuestion,
    onDeleteQuestion,
    onReorderQuestions,
    className,
}: QuestionsListProps) {
    // Dialog states
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Selected question for editing/deleting
    const [selectedQuestion, setSelectedQuestion] = useState<QuizQuestion | null>(null);

    // Submitting states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Calculate total points
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    // Handle create question
    const handleCreate = useCallback(async (data: CreateQuestionDTO) => {
        const toastId = showLoadingToast('Creating question...');
        setIsSubmitting(true);

        try {
            const result = await onCreateQuestion(data);

            if (result) {
                showSuccessToast('Question created successfully!', { id: toastId });
                setIsCreateDialogOpen(false);
            } else {
                showErrorToast('Failed to create question', { id: toastId });
            }
        } catch (error) {
            showErrorToast('An error occurred while creating question', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    }, [onCreateQuestion]);

    // Handle edit question
    const handleEdit = useCallback((question: QuizQuestion) => {
        setSelectedQuestion(question);
        setIsEditDialogOpen(true);
    }, []);

    const handleEditSubmit = useCallback(async (data: UpdateQuestionDTO) => {
        const toastId = showLoadingToast('Saving changes...');
        setIsSubmitting(true);

        try {
            const result = await onUpdateQuestion(data);

            if (result) {
                showSuccessToast('Question updated successfully!', { id: toastId });
                setIsEditDialogOpen(false);
                setSelectedQuestion(null);
            } else {
                showErrorToast('Failed to update question', { id: toastId });
            }
        } catch (error) {
            showErrorToast('An error occurred while updating question', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    }, [onUpdateQuestion]);

    // Handle delete question
    const handleDelete = useCallback((question: QuizQuestion) => {
        setSelectedQuestion(question);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!selectedQuestion) return;

        const toastId = showLoadingToast('Deleting question...');
        setIsDeleting(true);

        try {
            const result = await onDeleteQuestion(selectedQuestion.id);

            if (result) {
                showSuccessToast('Question deleted successfully!', { id: toastId });
                setIsDeleteDialogOpen(false);
                setSelectedQuestion(null);
            } else {
                showErrorToast('Failed to delete question', { id: toastId });
            }
        } catch (error) {
            showErrorToast('An error occurred while deleting question', { id: toastId });
        } finally {
            setIsDeleting(false);
        }
    }, [selectedQuestion, onDeleteQuestion]);

    // Render loading state
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className={className}>
            {/* Header with summary */}
            <Card className="mb-6">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileQuestion className="h-5 w-5" />
                                Questions
                            </CardTitle>
                            <CardDescription>
                                Manage quiz questions and answers
                            </CardDescription>
                        </div>
                        {canEdit && (
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add Question
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <Badge variant="secondary" className="text-sm py-1.5 px-3">
                            <FileQuestion className="h-4 w-4 mr-1.5" />
                            {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
                        </Badge>
                        <Badge variant="secondary" className="text-sm py-1.5 px-3">
                            <Target className="h-4 w-4 mr-1.5" />
                            {totalPoints} Total Points
                        </Badge>
                        {quiz.max_score !== totalPoints && (
                            <Badge variant="outline" className="text-sm py-1.5 px-3 text-amber-600 border-amber-300">
                                <AlertCircle className="h-4 w-4 mr-1.5" />
                                Quiz max score ({quiz.max_score}) differs from total points ({totalPoints})
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Questions List */}
            {questions.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <FileQuestion className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No questions yet</h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                            This quiz doesn't have any questions. Add questions to make the quiz available to students.
                        </p>
                        {canEdit && (
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add First Question
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {[...questions]
                        .sort((a, b) => a.question_order - b.question_order)
                        .map((question) => (
                            <QuestionCard
                                key={question.id}
                                question={question}
                                canEdit={canEdit}
                                showCorrectAnswers={true}
                                onEdit={canEdit ? handleEdit : undefined}
                                onDelete={canEdit ? handleDelete : undefined}
                            />
                        ))}
                </div>
            )}

            {/* Create Question Dialog */}
            <CreateQuestionDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                quizId={quiz.id}
                quizTitle={quiz.title}
                currentQuestionCount={questions.length}
                onSubmit={handleCreate}
                isSubmitting={isSubmitting}
            />

            {/* Edit Question Dialog */}
            <EditQuestionDialog
                open={isEditDialogOpen}
                onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) setSelectedQuestion(null);
                }}
                quizId={quiz.id}
                question={selectedQuestion}
                onSubmit={handleEditSubmit}
                isSubmitting={isSubmitting}
            />

            {/* Delete Question Dialog */}
            <DeleteQuestionDialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    setIsDeleteDialogOpen(open);
                    if (!open) setSelectedQuestion(null);
                }}
                question={selectedQuestion}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </div>
    );
}
