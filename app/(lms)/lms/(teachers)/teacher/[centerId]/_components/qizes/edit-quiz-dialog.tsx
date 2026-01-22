/**
 * Edit Quiz Dialog Component
 * 
 * Dialog wrapper for editing existing quizzes
 * Uses QuizForm internally
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
import { QuizForm } from './quiz-form';
import type { Quiz, CreateQuizDTO, UpdateQuizDTO } from '@/lib/branch-system/types/quiz.types';

export interface EditQuizDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when the dialog should close */
    onOpenChange: (open: boolean) => void;
    /** Quiz data to edit */
    quiz: Quiz | null;
    /** Available classes for selection */
    availableClasses: Array<{
        id: string;
        name: string;
        subject?: string;
    }>;
    /** Teacher ID */
    teacherId: string;
    /** Branch ID */
    branchId: string;
    /** Callback when quiz is updated */
    onSubmit: (data: UpdateQuizDTO) => Promise<void>;
    /** Whether the form is submitting */
    isSubmitting?: boolean;
}

export function EditQuizDialog({
    open,
    onOpenChange,
    quiz,
    availableClasses,
    teacherId,
    branchId,
    onSubmit,
    isSubmitting = false,
}: EditQuizDialogProps) {
    const handleSubmit = async (data: CreateQuizDTO | UpdateQuizDTO) => {
        await onSubmit(data as UpdateQuizDTO);
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    if (!quiz) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle>Edit Quiz</DialogTitle>
                    <DialogDescription>
                        Update the quiz settings. Note: You cannot change the class after the quiz is created.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 min-h-0 px-1 overflow-y-auto">
                    <div className="p-4" >
                        <QuizForm
                            mode="edit"
                            initialData={quiz}
                            availableClasses={availableClasses}
                            teacherId={teacherId}
                            branchId={branchId}
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
