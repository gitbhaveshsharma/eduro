/**
 * Edit Question Dialog Component
 * 
 * Dialog wrapper for editing existing quiz questions
 * Uses QuestionForm internally
 */

'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QuestionForm } from './question-form';
import type { QuizQuestion, CreateQuestionDTO, UpdateQuestionDTO } from '@/lib/branch-system/types/quiz.types';

export interface EditQuestionDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when the dialog should close */
    onOpenChange: (open: boolean) => void;
    /** Quiz ID */
    quizId: string;
    /** Question data to edit */
    question: QuizQuestion | null;
    /** Callback when question is updated */
    onSubmit: (data: UpdateQuestionDTO) => Promise<void>;
    /** Whether the form is submitting */
    isSubmitting?: boolean;
}

export function EditQuestionDialog({
    open,
    onOpenChange,
    quizId,
    question,
    onSubmit,
    isSubmitting = false,
}: EditQuestionDialogProps) {
    const handleSubmit = async (data: CreateQuestionDTO | UpdateQuestionDTO) => {
        await onSubmit(data as UpdateQuestionDTO);
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    if (!question) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle>Edit Question</DialogTitle>
                    <DialogDescription>
                        Update question #{question.question_order}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 min-h-0 px-1 overflow-y-auto">
                    <div className="p-4">
                        <QuestionForm
                            mode="edit"
                            quizId={quizId}
                            questionOrder={question.question_order}
                            initialData={question}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            isSubmitting={isSubmitting}
                        />
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
