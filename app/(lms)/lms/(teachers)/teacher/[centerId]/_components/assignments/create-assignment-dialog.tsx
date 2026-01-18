/**
 * Create Assignment Dialog Component
 * 
 * Dialog for creating new assignments
 * Uses the modular AssignmentForm component
 */

'use client';

import { useState } from 'react';
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
    /** Submit handler - now returns assignment ID for file upload */
    onSubmit: (data: CreateAssignmentDTO, pendingFiles: Array<{
        file: File;
        content: string;
        preview: { name: string; size: number; type: string; };
    }>) => Promise<string | void>;
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
    // Track if submission is in progress to prevent dialog closing
    const [isSubmissionInProgress, setIsSubmissionInProgress] = useState(false);

    const handleSubmit = async (
        data: CreateAssignmentDTO,
        pendingFiles: Array<{
            file: File;
            content: string;
            preview: { name: string; size: number; type: string; };
        }>
    ) => {
        // Mark submission as in progress to prevent accidental dialog close
        setIsSubmissionInProgress(true);

        try {
            const result = await onSubmit(data, pendingFiles);
            onSuccess?.(data);
            return result;
        } finally {
            setIsSubmissionInProgress(false);
        }
    };

    const handleCancel = () => {
        // Don't allow cancel while submission is in progress
        if (!isSubmissionInProgress) {
            onOpenChange(false);
        }
    };

    // Prevent dialog from closing via escape/outside click during submission
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && isSubmissionInProgress) {
            // Prevent closing while submission in progress
            console.log('⚠️ Cannot close dialog while submission is in progress');
            return;
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-3xl max-h-[95vh] flex flex-col"
                onInteractOutside={(e) => {
                    // Prevent closing by clicking outside during submission
                    if (isSubmissionInProgress) {
                        e.preventDefault();
                    }
                }}
                onEscapeKeyDown={(e) => {
                    // Prevent closing by escape key during submission
                    if (isSubmissionInProgress) {
                        e.preventDefault();
                    }
                }}
            >
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Create New Assignment</DialogTitle>
                    <DialogDescription>
                        Fill in the details to create a new assignment for your students
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 min-h-0 p-4 overflow-x-auto">
                    <div className="p-4">
                        <AssignmentForm
                            mode="create"
                            teacherId={teacherId}
                            branchId={branchId}
                            availableClasses={availableClasses}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            isSubmitting={isSubmitting || isSubmissionInProgress}
                            showClassSelector={!selectedClassId}
                            selectedClassId={selectedClassId}
                        />
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
