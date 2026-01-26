/**
 * Teacher Assignment Detail Header Component
 * 
 * Displays assignment header with title, status, and action buttons
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Edit,
    Send,
    Lock,
    Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Assignment } from '@/lib/branch-system/types/assignment.types';
import {
    AssignmentStatus,
    formatAssignmentStatus,
    ASSIGNMENT_STATUS_CONFIG,
} from '@/lib/branch-system/assignment';

export interface AssignmentDetailHeaderProps {
    assignment: Assignment;
    onEdit?: () => void;
    onPublish?: () => void;
    onClose?: () => void;
    onDelete?: () => void;
    showTeacherActions?: boolean;
}

export function AssignmentDetailHeader({
    assignment,
    onEdit,
    onPublish,
    onClose,
    onDelete,
    showTeacherActions = false,
}: AssignmentDetailHeaderProps) {
    const canPublish = assignment.status === AssignmentStatus.DRAFT;
    const canClose = assignment.status === AssignmentStatus.PUBLISHED;
    const canEdit = assignment.status === AssignmentStatus.DRAFT;
    const canDelete = assignment.status === AssignmentStatus.DRAFT;

    const statusConfig = ASSIGNMENT_STATUS_CONFIG[assignment.status];

    return (
        <div className="rounded-2xl border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        {assignment.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <Badge variant={statusConfig.variant}>
                            {formatAssignmentStatus(assignment.status)}
                        </Badge>
                        {assignment.class && (
                            <span className="text-sm text-muted-foreground">
                                {assignment.class.class_name} • {assignment.class.subject}
                            </span>
                        )}
                    </div>
                </div>

                {showTeacherActions && (
                    <div className="flex flex-wrap gap-2 shrink-0">
                        {canEdit && onEdit && (
                            <Button
                                variant="outline"
                                onClick={onEdit}
                                size="sm"
                                className="gap-2"
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </Button>
                        )}
                        {canPublish && onPublish && (
                            <Button
                                onClick={onPublish}
                                size="sm"
                                className="gap-2"
                            >
                                <Send className="h-4 w-4" />
                                Publish
                            </Button>
                        )}
                        {canClose && onClose && (
                            <Button
                                variant="secondary"
                                onClick={onClose}
                                size="sm"
                                className="gap-2"
                            >
                                <Lock className="h-4 w-4" />
                                Close
                            </Button>
                        )}
                        {canDelete && onDelete && (
                            <Button
                                variant="destructive"
                                onClick={onDelete}
                                size="sm"
                                className="gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
