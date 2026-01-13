/**
 * Assignment Detail Dialog Component
 * 
 * Shows detailed information about an assignment
 * Reusable for different user roles
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Calendar,
    Edit,
    FileText,
    Users,
    Send,
    Lock,
    Trash2,
    FileUp,
    Type,
    Award,
    ClipboardList,
    FileEdit,
    CheckCircle2,
    LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Assignment } from '@/lib/branch-system/types/assignment.types';
import {
    AssignmentStatus,
    AssignmentSubmissionType,
    formatDateTime,
    formatAssignmentStatus,
    getDueDateStatus,
    ASSIGNMENT_STATUS_CONFIG,
    SUBMISSION_TYPE_CONFIG,
    CLEANUP_FREQUENCY_CONFIG,
} from '@/lib/branch-system/assignment';

export interface AssignmentDetailDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog open state changes */
    onOpenChange: (open: boolean) => void;
    /** Assignment to display */
    assignment: Assignment | null;
    /** Callback when edit is clicked */
    onEdit?: (assignment: Assignment) => void;
    /** Callback when publish is clicked */
    onPublish?: (assignment: Assignment) => void;
    /** Callback when close is clicked */
    onClose?: (assignment: Assignment) => void;
    /** Callback when delete is clicked */
    onDelete?: (assignment: Assignment) => void;
    /** Callback when view submissions is clicked */
    onViewSubmissions?: (assignment: Assignment) => void;
    /** Whether to show teacher actions */
    showTeacherActions?: boolean;
    /** Current user role */
    userRole?: 'teacher' | 'student' | 'coach' | 'manager';
}

export function AssignmentDetailDialog({
    open,
    onOpenChange,
    assignment,
    onEdit,
    onPublish,
    onClose,
    onDelete,
    onViewSubmissions,
    showTeacherActions = false,
    userRole = 'teacher',
}: AssignmentDetailDialogProps) {
    if (!assignment) return null;

    const dueDateStatus = assignment.due_date
        ? getDueDateStatus(assignment.due_date)
        : null;

    const canPublish = assignment.status === AssignmentStatus.DRAFT;
    const canClose = assignment.status === AssignmentStatus.PUBLISHED;
    const canEdit = assignment.status === AssignmentStatus.DRAFT;
    const canDelete = assignment.status === AssignmentStatus.DRAFT;

    const statusConfig = ASSIGNMENT_STATUS_CONFIG[assignment.status];

    // Get icon component dynamically
    const getStatusIcon = (iconName: string): LucideIcon => {
        const icons: Record<string, LucideIcon> = {
            FileEdit,
            CheckCircle2,
            Lock,
        };
        return icons[iconName] || FileText;
    };

    const StatusIcon = getStatusIcon(statusConfig.icon);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl p-0 overflow-hidden flex flex-col max-h-[95vh]">
                <DialogHeader className="flex-shrink-0 border-b px-6 py-4">
                    <div className="flex items-start gap-3">
                        <div className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                            assignment.status === AssignmentStatus.DRAFT && 'bg-secondary/30',
                            assignment.status === AssignmentStatus.PUBLISHED && 'bg-green-100 dark:bg-green-900/30',
                            assignment.status === AssignmentStatus.CLOSED && 'bg-red-100 dark:bg-red-900/30',
                        )}>
                            <StatusIcon className={cn(
                                'h-6 w-6',
                                assignment.status === AssignmentStatus.DRAFT && 'text-muted-foreground',
                                assignment.status === AssignmentStatus.PUBLISHED && 'text-green-600',
                                assignment.status === AssignmentStatus.CLOSED && 'text-red-600',
                            )} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-lg line-clamp-2">{assignment.title}</DialogTitle>
                            <DialogDescription className="flex items-center gap-2 mt-1">
                                <Badge variant={statusConfig.variant}>
                                    {formatAssignmentStatus(assignment.status)}
                                </Badge>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6 py-4 overflow-y-auto">
                    <div className="pr-4">
                        {/* Class Info */}
                        {assignment.class && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-6">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{assignment.class.class_name}</p>
                                    {assignment.class.subject && (
                                        <p className="text-sm text-muted-foreground">{assignment.class.subject}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {assignment.description && (
                            <div className="mb-6">
                                <h4 className="text-sm font-medium mb-2">Description</h4>
                                <p className="text-sm text-muted-foreground">{assignment.description}</p>
                            </div>
                        )}

                        {/* Instructions */}
                        {assignment.instructions && (
                            <div className="mb-6">
                                <h4 className="text-sm font-medium mb-2">Instructions</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {assignment.instructions}
                                </p>
                            </div>
                        )}

                        <Separator className="my-6" />

                        {/* Key Details Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {/* Due Date */}
                            <div className={cn(
                                'p-3 rounded-lg',
                                dueDateStatus?.isOverdue ? 'bg-red-100 dark:bg-red-900/20' :
                                    dueDateStatus?.isDueSoon ? 'bg-amber-100 dark:bg-amber-900/20' :
                                        'bg-muted/50'
                            )}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className={cn(
                                        'h-4 w-4',
                                        dueDateStatus?.isOverdue && 'text-red-600',
                                        dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && 'text-amber-600',
                                    )} />
                                    <span className="text-xs text-muted-foreground">Due Date</span>
                                </div>
                                <p className={cn(
                                    'font-medium text-sm',
                                    dueDateStatus?.isOverdue && 'text-red-600',
                                    dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && 'text-amber-600',
                                )}>
                                    {formatDateTime(assignment.due_date, 'short')}
                                </p>
                                {dueDateStatus?.isOverdue && (
                                    <p className="text-xs text-red-600 mt-1">Overdue</p>
                                )}
                                {dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && (
                                    <p className="text-xs text-amber-600 mt-1">
                                        {dueDateStatus.daysRemaining} days left
                                    </p>
                                )}
                            </div>

                            {/* Max Score */}
                            <div className="p-3 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-2 mb-1">
                                    <Award className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Max Score</span>
                                </div>
                                <p className="font-medium text-sm">{assignment.max_score} points</p>
                            </div>

                            {/* Submission Type */}
                            <div className="p-3 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-2 mb-1">
                                    {assignment.submission_type === AssignmentSubmissionType.FILE ? (
                                        <FileUp className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Type className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="text-xs text-muted-foreground">Submission</span>
                                </div>
                                <p className="font-medium text-sm">
                                    {SUBMISSION_TYPE_CONFIG[assignment.submission_type]?.label}
                                </p>
                            </div>

                            {/* Max Submissions */}
                            <div className="p-3 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-2 mb-1">
                                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Attempts</span>
                                </div>
                                <p className="font-medium text-sm">{assignment.max_submissions} max</p>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Additional Settings */}
                        <div className="space-y-3 mb-6">
                            <h4 className="text-sm font-medium">Settings</h4>

                            {/* Late Submission */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Late submissions</span>
                                <span className="text-sm font-medium">
                                    {assignment.allow_late_submission
                                        ? `Allowed (-${assignment.late_penalty_percentage}%)`
                                        : 'Not allowed'}
                                </span>
                            </div>

                            {/* File Settings */}
                            {assignment.submission_type === AssignmentSubmissionType.FILE && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Max file size</span>
                                        <span className="text-sm font-medium">
                                            {Math.round(assignment.max_file_size / 1048576)} MB
                                        </span>
                                    </div>
                                    {assignment.allowed_extensions && assignment.allowed_extensions.length > 0 && (
                                        <div className="flex items-start justify-between">
                                            <span className="text-sm text-muted-foreground">Allowed types</span>
                                            <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                                                {assignment.allowed_extensions.map((ext) => (
                                                    <Badge key={ext} variant="outline" className="text-xs">
                                                        .{ext}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Cleanup */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Auto-cleanup</span>
                                <span className="text-sm font-medium">
                                    {CLEANUP_FREQUENCY_CONFIG[assignment.clean_submissions_after]?.label || 'Not set'}
                                </span>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Dates */}
                        <div className="space-y-3 pb-4">
                            <h4 className="text-sm font-medium">Timeline</h4>

                            {assignment.publish_at && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Publish at</span>
                                    <span className="text-sm font-medium">
                                        {formatDateTime(assignment.publish_at, 'short')}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Due date</span>
                                <span className="text-sm font-medium">
                                    {formatDateTime(assignment.due_date, 'short')}
                                </span>
                            </div>

                            {assignment.close_date && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Close date</span>
                                    <span className="text-sm font-medium">
                                        {formatDateTime(assignment.close_date, 'short')}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Created</span>
                                <span className="text-sm font-medium">
                                    {formatDateTime(assignment.created_at, 'short')}
                                </span>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Actions Footer */}
                {showTeacherActions && (
                    <DialogFooter className="flex-shrink-0 border-t px-6 py-4">
                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                            {/* View Submissions */}
                            {onViewSubmissions && assignment.status !== AssignmentStatus.DRAFT && (
                                <Button
                                    variant="outline"
                                    onClick={() => onViewSubmissions(assignment)}
                                    className="flex-1"
                                >
                                    <ClipboardList className="h-4 w-4 mr-2" />
                                    View Submissions
                                </Button>
                            )}

                            {/* Edit */}
                            {canEdit && onEdit && (
                                <Button
                                    variant="outline"
                                    onClick={() => onEdit(assignment)}
                                    className="flex-1"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                            )}

                            {/* Publish */}
                            {canPublish && onPublish && (
                                <Button
                                    onClick={() => onPublish(assignment)}
                                    className="flex-1"
                                >
                                    <Send className="h-4 w-4 mr-2" />
                                    Publish
                                </Button>
                            )}

                            {/* Close */}
                            {canClose && onClose && (
                                <Button
                                    variant="secondary"
                                    onClick={() => onClose(assignment)}
                                    className="flex-1"
                                >
                                    <Lock className="h-4 w-4 mr-2" />
                                    Close
                                </Button>
                            )}

                            {/* Delete */}
                            {canDelete && onDelete && (
                                <Button
                                    variant="destructive"
                                    onClick={() => onDelete(assignment)}
                                    className="flex-1"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}