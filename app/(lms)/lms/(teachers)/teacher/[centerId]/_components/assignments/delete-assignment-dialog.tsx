/**
 * Delete Assignment Dialog Component
 * 
 * Confirmation dialog for deleting assignments
 * Only allows deletion of DRAFT assignments
 */

'use client';

import { useState } from 'react';
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
import type { Assignment } from '@/lib/branch-system/types/assignment.types';
import { AssignmentStatus } from '@/lib/branch-system/assignment';

export interface DeleteAssignmentDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog open state changes */
    onOpenChange: (open: boolean) => void;
    /** Assignment to delete */
    assignment: Assignment | null;
    /** Callback on confirmed deletion */
    onConfirm: (assignmentId: string) => Promise<void>;
    /** Whether deletion is in progress */
    isDeleting?: boolean;
}

export function DeleteAssignmentDialog({
    open,
    onOpenChange,
    assignment,
    onConfirm,
    isDeleting = false,
}: DeleteAssignmentDialogProps) {
    const canDelete = assignment?.status === AssignmentStatus.DRAFT;

    const handleConfirm = async () => {
        if (!assignment || !canDelete) return;
        await onConfirm(assignment.id);
    };

    if (!assignment) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Delete Assignment
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        {canDelete ? (
                            <>
                                <p>
                                    Are you sure you want to delete the assignment{' '}
                                    <strong>&quot;{assignment.title}&quot;</strong>?
                                </p>
                                <p className="text-destructive">
                                    This action cannot be undone.
                                </p>
                            </>
                        ) : (
                            <p className="text-destructive">
                                Only draft assignments can be deleted. This assignment is currently{' '}
                                <strong>{assignment.status.toLowerCase()}</strong> and cannot be deleted.
                            </p>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    {canDelete && (
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Assignment
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
