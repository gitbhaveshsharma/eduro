/**
 * Delete Class Dialog Component
 * 
 * Confirmation dialog for deleting a branch class
 * Features: Warning message, Confirmation, Loading state
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
import { Button } from '@/components/ui/button';
import {
    BranchClassesAPI,
    useClass,
    useSelectedClass,
    useBranchClassesStore,
} from '@/lib/branch-system/branch-classes';
import { showSuccessToast, showErrorToast, showLoadingToast } from '@/lib/toast';
import { Loader2, AlertTriangle } from 'lucide-react';

/**
 * Delete Class Dialog Component
 */
export function DeleteClassDialog() {
    const store = useBranchClassesStore();
    const selectedClass = useSelectedClass();
    const selectedClassId = store.ui.selectedClassId;
    const classData = selectedClass;
    const [isDeleting, setIsDeleting] = useState(false);

    // Check if delete dialog should be shown only when explicitly opened
    const isOpen = !!selectedClassId && !!store.ui.showDeleteDialog && !store.ui.isEditing;

    const handleDelete = async () => {
        if (!selectedClassId) return;

        const toastId = showLoadingToast('Deleting class...');
        setIsDeleting(true);

        try {
            const success = await BranchClassesAPI.delete(selectedClassId);

            if (success) {
                showSuccessToast('Class deleted successfully!');
                store.closeDeleteDialog?.();
                store.setSelectedClass(null);
            } else {
                showErrorToast('Failed to delete class. Please try again.');
            }
        } catch (error: any) {
            showErrorToast(error.message || 'An unexpected error occurred');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancel = () => {
        if (!isDeleting) {
            store.closeDeleteDialog?.();
        }
    };

    if (!classData) return null;

    return (
        <AlertDialog open={isOpen} onOpenChange={handleCancel}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Delete Class
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                        <div>
                            Are you sure you want to delete <strong>{classData.class_name}</strong>?
                        </div>

                        {classData.current_enrollment > 0 && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                                <div className="text-sm font-semibold text-destructive">
                                    Warning: This class has {classData.current_enrollment} enrolled student{classData.current_enrollment !== 1 ? 's' : ''}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Deleting this class may affect student enrollments.
                                </div>
                            </div>
                        )}

                        <div className="text-sm">
                            This action cannot be undone. All class data will be permanently removed.
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Class
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
