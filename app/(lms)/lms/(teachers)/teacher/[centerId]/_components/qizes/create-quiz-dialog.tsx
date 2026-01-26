/**
 * Create Quiz Dialog Component
 * 
 * Dialog wrapper for creating new quizzes
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
import type { CreateQuizDTO, UpdateQuizDTO } from '@/lib/branch-system/types/quiz.types';

export interface CreateQuizDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when the dialog should close */
    onOpenChange: (open: boolean) => void;
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
    /** Callback when quiz is created */
    onSubmit: (data: CreateQuizDTO) => Promise<void>;
    /** Whether the form is submitting */
    isSubmitting?: boolean;
}

export function CreateQuizDialog({
    open,
    onOpenChange,
    availableClasses,
    teacherId,
    branchId,
    onSubmit,
    isSubmitting = false,
}: CreateQuizDialogProps) {
    const handleSubmit = async (data: CreateQuizDTO | UpdateQuizDTO) => {
        await onSubmit(data as CreateQuizDTO);
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle>Create New Quiz</DialogTitle>
                    <DialogDescription>
                        Set up a new quiz for your students. You can add questions after creating the quiz.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 min-h-0 px-1 overflow-y-auto">
                    <div className="p-4" >
                        <QuizForm
                            mode="create"
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
