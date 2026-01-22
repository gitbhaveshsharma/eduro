/**
 * Delete Question Dialog Component
 * 
 * Confirmation dialog for deleting quiz questions
 */

'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { QuizQuestion } from '@/lib/branch-system/types/quiz.types';
import { QUESTION_TYPE_CONFIG } from '@/lib/branch-system/quiz';

export interface DeleteQuestionDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when the dialog should close */
    onOpenChange: (open: boolean) => void;
    /** Question to delete */
    question: QuizQuestion | null;
    /** Callback when delete is confirmed */
    onConfirm: () => Promise<void>;
    /** Whether the delete operation is in progress */
    isDeleting?: boolean;
}

export function DeleteQuestionDialog({
    open,
    onOpenChange,
    question,
    onConfirm,
    isDeleting = false,
}: DeleteQuestionDialogProps) {
    if (!question) {
        return null;
    }

    const questionTypeConfig = QUESTION_TYPE_CONFIG[question.question_type];
    const truncatedText = question.question_text.length > 100
        ? question.question_text.substring(0, 100) + '...'
        : question.question_text;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <AlertDialogTitle>Delete Question</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="space-y-3">
                        <span className="block">
                            Are you sure you want to delete this question?
                        </span>
                        <div className="p-3 bg-muted rounded-md space-y-1">
                            <span className="block text-foreground font-medium">
                                Question #{question.question_order}
                            </span>
                            <span className="block text-sm">
                                "{truncatedText}"
                            </span>
                            <span className="block text-xs text-muted-foreground">
                                Type: {questionTypeConfig.label} • Points: {question.points}
                            </span>
                        </div>
                        <span className="block font-medium text-destructive">
                            This action cannot be undone.
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete Question'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
