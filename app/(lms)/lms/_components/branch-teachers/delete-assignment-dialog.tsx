/**
 * Delete Assignment Dialog Component
 * 
 * Confirmation dialog for deleting a teacher assignment
 * Shows assignment summary before deletion
 */

'use client';

import { useBranchTeacherStore } from '@/lib/branch-system/stores/branch-teacher.store';
import { showSuccessToast, showErrorToast, showLoadingToast } from '@/lib/toast';
import { toast } from 'react-hot-toast';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';

/**
 * Delete Assignment Dialog Props
 */
interface DeleteAssignmentDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    assignmentId?: string;
}

/**
 * Main Delete Assignment Dialog Component
 */
export function DeleteAssignmentDialog({ open, onOpenChange, assignmentId }: DeleteAssignmentDialogProps) {
    const {
        currentAssignment,
        isDeleteDialogOpen,
        closeDeleteDialog,
        deleteAssignment,
        loading
    } = useBranchTeacherStore();

    // Use props or store state for dialog open state
    const isOpen = open ?? isDeleteDialogOpen;
    const effectiveAssignmentId = assignmentId ?? currentAssignment?.id ?? '';
    const handleOpenChange = (openValue: boolean) => {
        if (onOpenChange) {
            onOpenChange(openValue);
        } else if (!openValue) {
            closeDeleteDialog();
        }
    };

    // Handle deletion
    const handleDelete = async () => {
        const loadingToastId = showLoadingToast('Deleting teacher assignment...');

        try {
            const success = await deleteAssignment(effectiveAssignmentId);

            toast.dismiss(loadingToastId);

            if (success) {
                showSuccessToast('Teacher assignment deleted successfully!');
                handleOpenChange(false);
            } else {
                showErrorToast('Failed to delete teacher assignment. Please try again.');
            }
        } catch (error) {
            toast.dismiss(loadingToastId);
            showErrorToast('An unexpected error occurred.');
        }
    };

    // Handle dialog close
    const handleClose = () => {
        if (!loading) {
            handleOpenChange(false);
        }
    };

    if (!currentAssignment) {
        return null;
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={handleClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Teacher Assignment
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                        <p>
                            Are you sure you want to delete this teacher assignment? This action cannot be undone.
                        </p>

                        {/* Assignment Summary */}
                        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Teacher</span>
                                <span className="text-sm font-medium">
                                    {currentAssignment.teacher_name}
                                </span>
                            </div>
                            {currentAssignment.teacher_email && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Email</span>
                                    <span className="text-sm">
                                        {currentAssignment.teacher_email}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <Badge variant={currentAssignment.is_active ? 'default' : 'secondary'}>
                                    {currentAssignment.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            {currentAssignment.teaching_subjects && currentAssignment.teaching_subjects.length > 0 && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm text-muted-foreground">Subjects</span>
                                    <div className="flex flex-wrap gap-1">
                                        {currentAssignment.teaching_subjects.map((subject, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {subject}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-destructive font-medium">
                            Warning: Deleting this assignment will remove all associated data including schedules and performance records.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={loading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Assignment
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
