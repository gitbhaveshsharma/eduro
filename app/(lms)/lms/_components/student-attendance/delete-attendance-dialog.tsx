/**
 * Delete Attendance Dialog Component
 * 
 * Confirmation dialog for deleting attendance records
 * Features: Warning about permanent deletion, student info display, confirmation
 */

'use client';

import { useState } from 'react';
import {
    useRecordToDelete,
    useIsDeleteDialogOpen,
    useCloseDeleteDialog,
    useDeleteAttendance,
    formatAttendanceStatus,
    formatAttendanceDate,
} from '@/lib/branch-system/student-attendance';
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
import { AlertTriangle, Loader2, Calendar, User } from 'lucide-react';

/**
 * Get status badge color based on attendance status
 */
function getStatusColor(status: string) {
    const colors: Record<string, string> = {
        PRESENT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        ABSENT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        LATE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        EXCUSED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        HOLIDAY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Delete Attendance Dialog Component
 */
export function DeleteAttendanceDialog() {
    const recordToDelete = useRecordToDelete();
    const isDeleteDialogOpen = useIsDeleteDialogOpen();
    const closeDeleteDialog = useCloseDeleteDialog();
    const deleteAttendance = useDeleteAttendance();

    const [isDeleting, setIsDeleting] = useState(false);
    const isOpen = isDeleteDialogOpen && !!recordToDelete;

    const handleDelete = async () => {
        if (!recordToDelete) return;

        setIsDeleting(true);
        const loadingToastId = showLoadingToast('Deleting attendance record...');

        try {
            const success = await deleteAttendance(recordToDelete.id);

            toast.dismiss(loadingToastId);

            if (success) {
                showSuccessToast('Attendance record deleted successfully');
                closeDeleteDialog();
            } else {
                showErrorToast('Failed to delete attendance record. Please try again.');
            }
        } catch (error) {
            toast.dismiss(loadingToastId);
            showErrorToast('An unexpected error occurred.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!recordToDelete) return null;

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && closeDeleteDialog()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Delete Attendance Record
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                        <p>
                            Are you sure you want to delete this attendance record? This action cannot be undone.
                        </p>
                        
                        {/* Record Details */}
                        <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                            {/* Student Info */}
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                    {recordToDelete.student?.full_name || 'Unknown Student'}
                                </span>
                            </div>
                            
                            {/* Date */}
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    {formatAttendanceDate(recordToDelete.attendance_date, 'long')}
                                </span>
                            </div>
                            
                            {/* Status */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Status:</span>
                                <Badge className={getStatusColor(recordToDelete.attendance_status)}>
                                    {formatAttendanceStatus(recordToDelete.attendance_status, true)}
                                </Badge>
                            </div>
                            
                            {/* Class Info */}
                            {recordToDelete.class && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Class:</span>
                                    <span className="text-sm">
                                        {recordToDelete.class.class_name}
                                        {recordToDelete.class.subject && ` - ${recordToDelete.class.subject}`}
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        <p className="text-destructive text-sm mt-2">
                            <strong>Warning:</strong> This will permanently remove the attendance record from the system.
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
                        Delete Record
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default DeleteAttendanceDialog;
