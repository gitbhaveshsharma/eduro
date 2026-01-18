/**
 * Edit Assignment Dialog Component
 * 
 * Dialog for editing existing assignments
 * Uses the modular AssignmentForm component
 * Only works for DRAFT assignments
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { AssignmentForm, ClassOption } from './assignment-form';
import type { Assignment, UpdateAssignmentDTO } from '@/lib/branch-system/types/assignment.types';
import { AssignmentStatus } from '@/lib/branch-system/assignment';

export interface EditAssignmentDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog open state changes */
    onOpenChange: (open: boolean) => void;
    /** Assignment to edit */
    assignment: Assignment | null;
    /** Teacher ID for the assignment */
    teacherId: string;
    /** Branch ID for the assignment */
    branchId: string;
    /** Available classes for selection */
    availableClasses: ClassOption[];
    /** Callback on successful update */
    onSuccess?: (assignment: UpdateAssignmentDTO) => void;
    /** Whether form is submitting */
    isSubmitting?: boolean;
    /** Submit handler */
    onSubmit: (data: UpdateAssignmentDTO) => Promise<void>;
}

export function EditAssignmentDialog({
    open,
    onOpenChange,
    assignment,
    teacherId,
    branchId,
    availableClasses,
    onSuccess,
    isSubmitting = false,
    onSubmit,
}: EditAssignmentDialogProps) {
    // Only allow editing DRAFT assignments
    const canEdit = assignment?.status === AssignmentStatus.DRAFT;

    const handleSubmit = async (data: UpdateAssignmentDTO) => {
        await onSubmit(data);
        onSuccess?.(data);
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    if (!assignment) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Edit Assignment</DialogTitle>
                    <DialogDescription>
                        Update the assignment details
                    </DialogDescription>
                </DialogHeader>

                {!canEdit ? (
                    <div className="p-4">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Only draft assignments can be edited. This assignment is currently {assignment.status.toLowerCase()}.
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : (
                    <ScrollArea className="flex-1 min-h-0 px-1 overflow-y-auto">
                        <div className="p-4">
                            <AssignmentForm
                                mode="edit"
                                assignmentId={assignment.id}
                                initialData={{
                                    class_id: assignment.class_id,
                                    teacher_id: assignment.teacher_id,
                                    branch_id: assignment.branch_id,
                                    title: assignment.title,
                                    description: assignment.description || undefined,
                                    instructions: assignment.instructions || undefined,
                                    submission_type: assignment.submission_type,
                                    max_file_size: assignment.max_file_size,
                                    allowed_extensions: assignment.allowed_extensions ?? undefined,
                                    max_submissions: assignment.max_submissions,
                                    allow_late_submission: assignment.allow_late_submission,
                                    late_penalty_percentage: assignment.late_penalty_percentage,
                                    max_score: assignment.max_score,
                                    grading_rubric: assignment.grading_rubric ?? undefined,
                                    show_rubric_to_students: assignment.show_rubric_to_students,
                                    publish_at: assignment.publish_at || undefined,
                                    due_date: assignment.due_date,
                                    close_date: assignment.close_date || undefined,
                                    clean_submissions_after: assignment.clean_submissions_after,
                                    clean_instructions_after: assignment.clean_instructions_after,
                                }}
                                teacherId={teacherId}
                                branchId={branchId}
                                availableClasses={availableClasses}
                                onSubmit={handleSubmit}
                                onCancel={handleCancel}
                                isSubmitting={isSubmitting}
                                showClassSelector={false}
                            />
                        </div>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}
