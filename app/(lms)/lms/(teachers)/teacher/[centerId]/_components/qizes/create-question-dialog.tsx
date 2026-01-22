/**
 * Create Question Dialog Component
 * 
 * Dialog wrapper for creating new quiz questions
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
import type { CreateQuestionDTO, UpdateQuestionDTO } from '@/lib/branch-system/types/quiz.types';

export interface CreateQuestionDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when the dialog should close */
    onOpenChange: (open: boolean) => void;
    /** Quiz ID to add question to */
    quizId: string;
    /** Quiz title for display */
    quizTitle: string;
    /** Quiz max score (for points validation) */
    quizMaxScore: number;
    /** Remaining available points */
    remainingPoints: number;
    /** Current question count (for ordering) */
    currentQuestionCount: number;
    /** Callback when question is created */
    onSubmit: (data: CreateQuestionDTO) => Promise<void>;
    /** Whether the form is submitting */
    isSubmitting?: boolean;
}

export function CreateQuestionDialog({
    open,
    onOpenChange,
    quizId,
    quizTitle,
    quizMaxScore,
    remainingPoints,
    currentQuestionCount,
    onSubmit,
    isSubmitting = false,
}: CreateQuestionDialogProps) {
    const handleSubmit = async (data: CreateQuestionDTO | UpdateQuestionDTO) => {
        await onSubmit(data as CreateQuestionDTO);
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle>Add Question</DialogTitle>
                    <DialogDescription>
                        Add a new question to "{quizTitle}"
                        {remainingPoints > 0 && remainingPoints < quizMaxScore && (
                            <span className="block mt-1 text-amber-600 dark:text-amber-400">
                                {remainingPoints} points remaining (Max: {quizMaxScore})
                            </span>
                        )}
                        {remainingPoints === 0 && (
                            <span className="block mt-1 text-destructive">
                                No points remaining. Quiz is at maximum capacity.
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 min-h-0 px-1 overflow-y-auto">
                    <div className="p-4">
                        <QuestionForm
                            mode="create"
                            quizId={quizId}
                            quizMaxScore={quizMaxScore}
                            maxAllowedPoints={remainingPoints > 0 ? remainingPoints : quizMaxScore}
                            remainingPoints={remainingPoints}
                            questionOrder={currentQuestionCount + 1}
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
