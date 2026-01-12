/**
 * Create Assignment Dialog Component
 * 
 * Dialog for creating new assignments
 * Uses the modular AssignmentForm component
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
import { AssignmentForm, ClassOption } from './assignment-form';
import type { CreateAssignmentDTO } from '@/lib/branch-system/types/assignment.types';

export interface CreateAssignmentDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog open state changes */
    onOpenChange: (open: boolean) => void;
    /** Teacher ID for the assignment */
    teacherId: string;
    /** Branch ID for the assignment */
    branchId: string;
    /** Available classes for selection */
    availableClasses: ClassOption[];
    /** Callback on successful creation */
    onSuccess?: (assignment: CreateAssignmentDTO) => void;
    /** Whether form is submitting */
    isSubmitting?: boolean;
    /** Submit handler */
    onSubmit: (data: CreateAssignmentDTO) => Promise<void>;
    /** Pre-selected class ID (optional) */
    selectedClassId?: string;
}

export function CreateAssignmentDialog({
    open,
    onOpenChange,
    teacherId,
    branchId,
    availableClasses,
    onSuccess,
    isSubmitting = false,
    onSubmit,
    selectedClassId,
}: CreateAssignmentDialogProps) {
    const handleSubmit = async (data: CreateAssignmentDTO) => {
        await onSubmit(data);
        onSuccess?.(data);
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Create New Assignment</DialogTitle>
                    <DialogDescription>
                        Fill in the details to create a new assignment for your students
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 min-h-0 px-1">
                    <div className="p-4">
                        <AssignmentForm
                            mode="create"
                            teacherId={teacherId}
                            branchId={branchId}
                            availableClasses={availableClasses}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            isSubmitting={isSubmitting}
                            showClassSelector={!selectedClassId}
                            selectedClassId={selectedClassId}
                        />
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
