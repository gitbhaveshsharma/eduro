/**
 * Delete Quiz Dialog Component
 * 
 * Confirmation dialog for deleting quizzes
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
import type { Quiz } from '@/lib/branch-system/types/quiz.types';

export interface DeleteQuizDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when the dialog should close */
    onOpenChange: (open: boolean) => void;
    /** Quiz to delete */
    quiz: Quiz | null;
    /** Callback when delete is confirmed */
    onConfirm: () => Promise<void>;
    /** Whether the delete operation is in progress */
    isDeleting?: boolean;
}

export function DeleteQuizDialog({
    open,
    onOpenChange,
    quiz,
    onConfirm,
    isDeleting = false,
}: DeleteQuizDialogProps) {
    if (!quiz) {
        return null;
    }

    const hasAttempts = quiz.total_attempts && quiz.total_attempts > 0;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="space-y-2">
                        <span className="block">
                            Are you sure you want to delete "{quiz.title}"?
                        </span>
                        {hasAttempts ? (
                            <span className="block text-destructive font-medium">
                                Warning: This quiz has {quiz.total_attempts} attempt(s). Deleting will also remove all student attempt data.
                            </span>
                        ) : (
                            <span className="block">
                                This will also delete all questions associated with this quiz.
                            </span>
                        )}
                        <span className="block font-medium">
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
                            'Delete Quiz'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
