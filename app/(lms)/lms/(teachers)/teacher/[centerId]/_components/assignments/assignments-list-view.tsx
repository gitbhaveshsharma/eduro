/**
 * Assignments List View Component
 * 
 * List view for displaying assignments
 * Mobile-first responsive design
 * Reusable for different user roles
 */

'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemMedia,
    ItemTitle,
    ItemDescription,
    ItemSeparator,
} from '@/components/ui/item';
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
    formatDateTime,
    formatAssignmentStatus,
    getDueDateStatus,
    ASSIGNMENT_STATUS_CONFIG,
} from '@/lib/branch-system/assignment';

export interface AssignmentsListViewProps {
    /** List of assignments to display */
    assignments: Assignment[];
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

export function AssignmentsListView({
    assignments,
    onViewDetails,
    onEdit,
    onPublish,
    onClose,
    onDelete,
    showTeacherActions = false,
    userRole = 'teacher',
}: AssignmentsListViewProps) {
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

    const getStatusIcon = (status: AssignmentStatus) => {
        const config = ASSIGNMENT_STATUS_CONFIG[status];
        return config?.icon || '📄';
    };

    return (
        <div className="space-y-2">
            {assignments.map((assignment, index) => {
                const dueDateStatus = assignment.due_date
                    ? getDueDateStatus(assignment.due_date)
                    : null;

                const canPublish = assignment.status === AssignmentStatus.DRAFT;
                const canClose = assignment.status === AssignmentStatus.PUBLISHED;
                const canEdit = assignment.status === AssignmentStatus.DRAFT;
                const canDelete = assignment.status === AssignmentStatus.DRAFT;

                return (
                    <div key={assignment.id}>
                        <Item
                            variant="default"
                            className={cn(
                                'group/item hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5',
                                'items-stretch gap-4 px-4 py-3 sm:px-5 sm:py-4'
                            )}
                        >
                            {/* Icon */}
                            <ItemMedia variant="icon">
                                <div className={cn(
                                    'w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center',
                                    assignment.status === AssignmentStatus.DRAFT && 'bg-secondary',
                                    assignment.status === AssignmentStatus.PUBLISHED && 'bg-green-100 dark:bg-green-900/30',
                                    assignment.status === AssignmentStatus.CLOSED && 'bg-red-100 dark:bg-red-900/30',
                                )}>
                                    <FileText className={cn(
                                        'h-5 w-5 sm:h-6 sm:w-6',
                                        assignment.status === AssignmentStatus.DRAFT && 'text-muted-foreground',
                                        assignment.status === AssignmentStatus.PUBLISHED && 'text-green-600',
                                        assignment.status === AssignmentStatus.CLOSED && 'text-red-600',
                                    )} />
                                </div>
                            </ItemMedia>

                            {/* Content */}
                            <ItemContent className="min-w-0 flex-1">
                                <ItemTitle className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm truncate transition-colors duration-200 group-hover/item:text-primary">
                                        {assignment.title}
                                    </span>
                                    <Badge
                                        variant={getStatusBadgeVariant(assignment.status)}
                                        className="text-xs font-medium flex-shrink-0"
                                    >
                                        {getStatusIcon(assignment.status)} {formatAssignmentStatus(assignment.status)}
                                    </Badge>
                                </ItemTitle>
                                <ItemDescription>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground mt-1">
                                        {/* Class Name */}
                                        {assignment.class?.class_name && (
                                            <span className="flex items-center gap-1.5 truncate">
                                                <Users className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span className="truncate">{assignment.class.class_name}</span>
                                            </span>
                                        )}
                                        {/* Due Date */}
                                        {assignment.due_date && (
                                            <span className={cn(
                                                'flex items-center gap-1.5',
                                                dueDateStatus?.isOverdue && 'text-red-600',
                                                dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && 'text-amber-600',
                                            )}>
                                                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                                                {formatDateTime(assignment.due_date, 'short')}
                                                {dueDateStatus?.isOverdue && (
                                                    <span className="text-red-600 font-medium">(Overdue)</span>
                                                )}
                                                {dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && (
                                                    <span className="text-amber-600 font-medium">
                                                        ({dueDateStatus.daysRemaining}d left)
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                        {/* Max Score */}
                                        <span className="flex items-center gap-1.5">
                                            <span className="font-medium">{assignment.max_score}</span> pts
                                        </span>
                                    </div>
                                </ItemDescription>
                            </ItemContent>

                            {/* Actions */}
                            <ItemActions className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onViewDetails(assignment.id)}
                                    className="gap-1.5 h-8 px-2 sm:px-3"
                                >
                                    <Eye className="h-4 w-4" />
                                    <span className="hidden sm:inline">View</span>
                                </Button>

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
                                            {(canDelete && onDelete) && (
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
                            </ItemActions>
                        </Item>

                        {index < assignments.length - 1 && <ItemSeparator />}
                    </div>
                );
            })}
        </div>
    );
}
