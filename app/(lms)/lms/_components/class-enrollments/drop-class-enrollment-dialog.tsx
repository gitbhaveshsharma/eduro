/**
 * Drop Class Enrollment Dialog Component
 * 
 * Confirmation dialog for dropping/removing a student from a class
 * Features: Warning message, enrollment info display, soft delete confirmation
 * 
 * @module class-enrollments/drop-class-enrollment-dialog
 */

'use client';

import { useState } from 'react';
import { useClassEnrollmentsStore } from '@/lib/branch-system/stores/class-enrollments.store';
import {
    CLASS_ENROLLMENT_STATUS_OPTIONS,
} from '@/lib/branch-system/types/class-enrollments.types';
import { formatDate } from '@/lib/branch-system/utils/branch-students.utils';
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
import { AlertTriangle, Loader2, BookOpen, Calendar, User } from 'lucide-react';

/**
 * Drop Class Enrollment Dialog Component
 * 
 * Uses store state for dialog visibility and current enrollment
 */
export function DropClassEnrollmentDialog() {
    const {
        currentEnrollment,
        currentEnrollmentWithRelations,
        isDropDialogOpen,
        dropEnrollment,
        closeDropDialog,
    } = useClassEnrollmentsStore();

    const [isDropping, setIsDropping] = useState(false);

    const enrollment = currentEnrollmentWithRelations || currentEnrollment;
    const isOpen = isDropDialogOpen && !!enrollment;

    // Handle drop action
    const handleDrop = async () => {
        if (!enrollment) return;

        setIsDropping(true);
        const loadingToastId = showLoadingToast('Dropping from class...');

        try {
            const success = await dropEnrollment(enrollment.id);

            toast.dismiss(loadingToastId);

            if (success) {
                showSuccessToast('Successfully dropped from class');
                closeDropDialog();
            } else {
                showErrorToast('Failed to drop from class. Please try again.');
            }
        } catch (error) {
            toast.dismiss(loadingToastId);
            showErrorToast('An unexpected error occurred.');
        } finally {
            setIsDropping(false);
        }
    };

    if (!enrollment) return null;

    // Get class and student info for display
    const className = currentEnrollmentWithRelations?.class?.class_name || 'Unknown Class';
    const subject = currentEnrollmentWithRelations?.class?.subject || null;
    const studentName = currentEnrollmentWithRelations?.student?.full_name ||
        currentEnrollmentWithRelations?.branch_student?.student_name ||
        'Unknown Student';
    const statusConfig = CLASS_ENROLLMENT_STATUS_OPTIONS[enrollment.enrollment_status];

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && closeDropDialog()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Drop from Class
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                        <p>
                            Are you sure you want to drop this student from the class? This action will:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                            <li>Change enrollment status to <strong>DROPPED</strong></li>
                            <li>Remove student from active class roster</li>
                            <li>Preserve all enrollment and academic records</li>
                        </ul>

                        {/* Enrollment Info Card */}
                        <div className="mt-4 p-4 bg-muted rounded-md space-y-3">
                            {/* Student Info */}
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{studentName}</span>
                            </div>

                            {/* Class Info */}
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <div className="text-sm">
                                    <span className="font-medium">{className}</span>
                                    {subject && (
                                        <span className="text-muted-foreground"> • {subject}</span>
                                    )}
                                </div>
                            </div>

                            {/* Enrollment Date */}
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    Enrolled: {formatDate(enrollment.enrollment_date)}
                                </span>
                            </div>

                            {/* Current Status */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Status:</span>
                                <Badge
                                    variant="outline"
                                    style={{
                                        backgroundColor: statusConfig?.color + '20',
                                        borderColor: statusConfig?.color,
                                        color: statusConfig?.color,
                                    }}
                                >
                                    {statusConfig?.label || enrollment.enrollment_status}
                                </Badge>
                            </div>

                            {/* Attendance if available */}
                            {enrollment.attendance_percentage !== undefined && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Attendance:</span>
                                    <span className="font-medium">
                                        {enrollment.attendance_percentage.toFixed(1)}%
                                    </span>
                                </div>
                            )}

                            {/* Grade if available */}
                            {enrollment.current_grade && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Current Grade:</span>
                                    <span className="font-medium">{enrollment.current_grade}</span>
                                </div>
                            )}
                        </div>

                        <p className="text-destructive text-sm mt-2">
                            <strong>Note:</strong> This is a soft delete. All data will be retained for records
                            but the student will no longer be counted as active in this class.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDropping}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDrop();
                        }}
                        disabled={isDropping}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDropping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Drop from Class
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

/**
 * Delete Class Enrollment Dialog Component
 * 
 * For hard deletion (permanent removal) - use with caution
 */
export function DeleteClassEnrollmentDialog() {
    const {
        currentEnrollment,
        currentEnrollmentWithRelations,
        isDropDialogOpen, // Reusing drop dialog state, but could add separate state
        deleteEnrollment,
        closeDropDialog,
    } = useClassEnrollmentsStore();

    const [isDeleting, setIsDeleting] = useState(false);

    const enrollment = currentEnrollmentWithRelations || currentEnrollment;

    // Handle permanent delete
    const handleDelete = async () => {
        if (!enrollment) return;

        setIsDeleting(true);
        const loadingToastId = showLoadingToast('Deleting enrollment...');

        try {
            const success = await deleteEnrollment(enrollment.id);

            toast.dismiss(loadingToastId);

            if (success) {
                showSuccessToast('Enrollment permanently deleted');
                closeDropDialog();
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

    // This component is not rendered by default
    // It's provided for cases where permanent deletion is needed
    return null;
}
