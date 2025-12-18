/**
 * Delete Enrollment Dialog Component
 * 
 * Confirmation dialog for soft-deleting student enrollments
 * Features: Warning about data retention, confirmation button
 */

'use client';

import { useState } from 'react';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';
import { formatPaymentStatus } from '@/lib/branch-system/utils/branch-students.utils';
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
import { AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Delete Enrollment Dialog Component
 */
export function DeleteEnrollmentDialog() {
    const {
        currentEnrollment,
        isDeleteDialogOpen,
        deleteEnrollment,
        closeDeleteDialog,
    } = useBranchStudentsStore();

    const [isDeleting, setIsDeleting] = useState(false);
    const isOpen = isDeleteDialogOpen && !!currentEnrollment;

    const handleDelete = async () => {
        if (!currentEnrollment) return;

        setIsDeleting(true);
        const loadingToastId = showLoadingToast('Deleting enrollment...');

        try {
            const success = await deleteEnrollment(currentEnrollment.id);

            toast.dismiss(loadingToastId);

            if (success) {
                showSuccessToast('Enrollment deleted successfully');
                closeDeleteDialog();
            } else {
                showErrorToast('Failed to delete enrollment. Please try again.');
            }
        } catch (error) {
            toast.dismiss(loadingToastId);
            showErrorToast('An unexpected error occurred.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!currentEnrollment) return null;

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && closeDeleteDialog()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Delete Student Enrollment
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <p>
                            Are you sure you want to delete this enrollment? This action will:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Mark the enrollment status as <strong>DROPPED</strong></li>
                            <li>Remove the student from active lists</li>
                            <li>Preserve all enrollment data for records</li>
                        </ul>
                        <div className="mt-4 p-3 bg-muted rounded-md">
                            <p className="text-sm">
                                <strong>Student ID:</strong> {currentEnrollment.student_id.slice(0, 8)}...
                            </p>
                            <p className="text-sm">
                                <strong>Payment Status:</strong> {formatPaymentStatus(currentEnrollment.payment_status)}
                            </p>
                        </div>
                        <p className="text-destructive mt-2">
                            <strong>Note:</strong> This is a soft delete. Data will be retained but marked as dropped.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Enrollment
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
