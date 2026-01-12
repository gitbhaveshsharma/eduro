/**
 * Assignment Card Component
 * 
 * Card view for displaying individual assignments
 * Mobile-first responsive design with grid layout
 * Reusable for different user roles
 */

'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
    Calendar,
    Clock,
    Eye,
    Edit,
    FileText,
    Users,
    MoreHorizontal,
    Send,
    Lock,
    Trash2,
    FileUp,
    Type,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from '@/lib/branch-system/assignment';

export interface AssignmentCardProps {
    /** Assignment data to display */
    assignment: Assignment;
    /** Callback when view details is clicked */
    onViewDetails: (assignmentId: string) => void;
    /** Callback when edit is clicked (optional) */
    onEdit?: (assignment: Assignment) => void;
    /** Callback when publish is clicked (optional) */
    onPublish?: (assignment: Assignment) => void;
    /** Callback when close is clicked (optional) */
    onClose?: (assignment: Assignment) => void;
    /** Callback when delete is clicked (optional) */
    onDelete?: (assignment: Assignment) => void;
    /** Whether to show teacher actions (edit, publish, close, delete) */
    showTeacherActions?: boolean;
    /** Current user role for conditional rendering */
    userRole?: 'teacher' | 'student' | 'coach' | 'manager';
}

export function AssignmentCard({
    assignment,
    onViewDetails,
    onEdit,
    onPublish,
    onClose,
    onDelete,
    showTeacherActions = false,
    userRole = 'teacher',
}: AssignmentCardProps) {
    const dueDateStatus = assignment.due_date
        ? getDueDateStatus(assignment.due_date)
        : null;

    const canPublish = assignment.status === AssignmentStatus.DRAFT;
    const canClose = assignment.status === AssignmentStatus.PUBLISHED;
    const canEdit = assignment.status === AssignmentStatus.DRAFT;
    const canDelete = assignment.status === AssignmentStatus.DRAFT;

    const getStatusBadgeVariant = (status: AssignmentStatus) => {
        switch (status) {
            case AssignmentStatus.DRAFT:
                return 'secondary';
            case AssignmentStatus.PUBLISHED:
                return 'default';
            case AssignmentStatus.CLOSED:
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getStatusConfig = (status: AssignmentStatus) => {
        return ASSIGNMENT_STATUS_CONFIG[status];
    };

    const getSubmissionTypeIcon = (type: AssignmentSubmissionType) => {
        return type === AssignmentSubmissionType.FILE ? FileUp : Type;
    };

    return (
        <Card className={cn(
            'group hover:shadow-md transition-all duration-200 hover:-translate-y-1',
            'flex flex-col h-full',
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Status Icon */}
                        <div className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                            assignment.status === AssignmentStatus.DRAFT && 'bg-secondary',
                            assignment.status === AssignmentStatus.PUBLISHED && 'bg-green-100 dark:bg-green-900/30',
                            assignment.status === AssignmentStatus.CLOSED && 'bg-red-100 dark:bg-red-900/30',
                        )}>
                            <FileText className={cn(
                                'h-5 w-5',
                                assignment.status === AssignmentStatus.DRAFT && 'text-muted-foreground',
                                assignment.status === AssignmentStatus.PUBLISHED && 'text-green-600',
                                assignment.status === AssignmentStatus.CLOSED && 'text-red-600',
                            )} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                {assignment.title}
                            </h3>
                            {assignment.class?.class_name && (
                                <p className="text-xs text-muted-foreground truncate">
                                    {assignment.class.class_name}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Status Badge & Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Badge
                            variant={getStatusBadgeVariant(assignment.status)}
                            className="text-xs"
                        >
                            {getStatusConfig(assignment.status)?.icon} {formatAssignmentStatus(assignment.status)}
                        </Badge>

                        {showTeacherActions && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">More actions</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    {canEdit && onEdit && (
                                        <DropdownMenuItem onClick={() => onEdit(assignment)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                    )}
                                    {canPublish && onPublish && (
                                        <DropdownMenuItem onClick={() => onPublish(assignment)}>
                                            <Send className="h-4 w-4 mr-2" />
                                            Publish
                                        </DropdownMenuItem>
                                    )}
                                    {canClose && onClose && (
                                        <DropdownMenuItem onClick={() => onClose(assignment)}>
                                            <Lock className="h-4 w-4 mr-2" />
                                            Close
                                        </DropdownMenuItem>
                                    )}
                                    {canDelete && onDelete && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => onDelete(assignment)}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 pb-3">
                {/* Description */}
                {assignment.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {assignment.description}
                    </p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Due Date */}
                    {assignment.due_date && (
                        <div className={cn(
                            'flex items-center gap-1.5 p-2 rounded-md bg-muted/50',
                            dueDateStatus?.isOverdue && 'bg-red-100 dark:bg-red-900/20',
                            dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && 'bg-amber-100 dark:bg-amber-900/20',
                        )}>
                            <Calendar className={cn(
                                'h-3.5 w-3.5 flex-shrink-0',
                                dueDateStatus?.isOverdue && 'text-red-600',
                                dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && 'text-amber-600',
                            )} />
                            <div className="min-w-0">
                                <p className="text-muted-foreground truncate">Due</p>
                                <p className={cn(
                                    'font-medium truncate',
                                    dueDateStatus?.isOverdue && 'text-red-600',
                                    dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && 'text-amber-600',
                                )}>
                                    {formatDateTime(assignment.due_date, 'short')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Max Score */}
                    <div className="flex items-center gap-1.5 p-2 rounded-md bg-muted/50">
                        <span className="text-lg font-bold text-primary">{assignment.max_score}</span>
                        <span className="text-muted-foreground">points</span>
                    </div>

                    {/* Submission Type */}
                    <div className="flex items-center gap-1.5 p-2 rounded-md bg-muted/50">
                        {assignment.submission_type === AssignmentSubmissionType.FILE ? (
                            <FileUp className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                            <Type className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="truncate">
                            {SUBMISSION_TYPE_CONFIG[assignment.submission_type]?.label || 'Unknown'}
                        </span>
                    </div>

                    {/* Late Submission */}
                    <div className="flex items-center gap-1.5 p-2 rounded-md bg-muted/50">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate">
                            {assignment.allow_late_submission
                                ? `Late OK (-${assignment.late_penalty_percentage}%)`
                                : 'No late'}
                        </span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-3 border-t">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(assignment.id)}
                    className="w-full gap-2"
                >
                    <Eye className="h-4 w-4" />
                    View Details
                </Button>
            </CardFooter>
        </Card>
    );
}
