/**
 * Teacher Assignment Card Component
 * 
 * Grid view for displaying individual assignments for teachers
 * Shows assignment status, due date, and management actions
 * Consistent with student assignment card design patterns
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
    Calendar,
    Clock,
    Eye,
    Edit,
    FileText,
    MoreHorizontal,
    Send,
    Lock,
    Trash2,
    FileUp,
    Type,
    FileEdit,
    CheckCircle2,
    LucideIcon,
    Users,
    BarChart3,
    AlertCircle,
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
    getDueDateStatus,
    ASSIGNMENT_STATUS_CONFIG,
    SUBMISSION_TYPE_CONFIG,
} from '@/lib/branch-system/assignment';

export interface AssignmentCardProps {
    /** Assignment data to display */
    assignment: Assignment;
    /** Callback when view details is clicked */
    onViewDetails: (assignmentId: string) => void;
    /** Callback when quick preview is clicked (optional) */
    onPreview?: (assignment: Assignment) => void;
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
    onPreview,
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

    // Determine actionable states
    const canPublish = assignment.status === AssignmentStatus.DRAFT;
    const canClose = assignment.status === AssignmentStatus.PUBLISHED;
    const canEdit = assignment.status === AssignmentStatus.DRAFT;
    const canDelete = assignment.status === AssignmentStatus.DRAFT;

    // Get status configuration
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

    // Get status display configuration (similar to student card)
    const getStatusDisplay = () => {
        switch (assignment.status) {
            case AssignmentStatus.DRAFT:
                return {
                    label: statusConfig.label,
                    variant: 'secondary' as const,
                    icon: StatusIcon,
                    color: 'text-muted-foreground',
                    bgColor: 'bg-secondary/10',
                    borderColor: 'border-secondary/20',
                };
            case AssignmentStatus.PUBLISHED:
                return {
                    label: statusConfig.label,
                    variant: 'success' as const,
                    icon: StatusIcon,
                    color: 'text-success',
                    bgColor: 'bg-success/10',
                    borderColor: 'border-success/20',
                };
            case AssignmentStatus.CLOSED:
                return {
                    label: statusConfig.label,
                    variant: 'destructive' as const,
                    icon: StatusIcon,
                    color: 'text-error',
                    bgColor: 'bg-error/10',
                    borderColor: 'border-error/20',
                };
            default:
                return {
                    label: statusConfig.label,
                    variant: 'secondary' as const,
                    icon: StatusIcon,
                    color: 'text-muted-foreground',
                    bgColor: 'bg-muted',
                    borderColor: 'border-border',
                };
        }
    };

    const statusDisplay = getStatusDisplay();
    const DisplayIcon = statusDisplay.icon;

    // Calculate submission statistics
    const getSubmissionStats = () => {
        // support both snake_case and camelCase shapes from API/runtime
        const totalStudents =
            (assignment as any).student_count ?? (assignment as any).studentCount ?? 0;
        const submittedCount =
            (assignment as any).submitted_count ?? (assignment as any).submittedCount ?? 0;
        const gradedCount =
            (assignment as any).graded_count ?? (assignment as any).gradedCount ?? 0;

        let submissionPercentage = 0;
        if (totalStudents > 0) {
            submissionPercentage = Math.round((submittedCount / totalStudents) * 100);
        }

        let gradingPercentage = 0;
        if (submittedCount > 0) {
            gradingPercentage = Math.round((gradedCount / submittedCount) * 100);
        }

        return {
            totalStudents,
            submittedCount,
            gradedCount,
            submissionPercentage,
            gradingPercentage,
        };
    };

    const submissionStats = getSubmissionStats();

    return (
        <Card className={cn(
            'group hover:shadow-md transition-all duration-200 border-border hover:border-primary/30',
            'flex flex-col h-full',
        )}>
            <CardHeader >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Status Icon */}
                        <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border',
                            statusDisplay.bgColor,
                            statusDisplay.borderColor,
                        )}>
                            <DisplayIcon className={cn('h-5 w-5', statusDisplay.color)} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm truncate group-hover:text-brand-primary transition-colors">
                                {assignment.title}
                            </h3>
                            {assignment.class?.class_name && (
                                <p className="text-xs text-secondary truncate">
                                    {assignment.class.class_name}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Status Badge */}
                    <Badge
                        variant={statusDisplay.variant}
                        className="px-2 py-0.5 rounded-full truncate"
                    >
                        {statusDisplay.label}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="flex-1 py-0">
                {/* Description */}
                {assignment.description && (
                    <p className="text-sm text-secondary line-clamp-2 mb-4">
                        {assignment.description}
                    </p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Due Date */}
                    {assignment.due_date && (
                        <div className={cn(
                            'flex items-center gap-1.5 p-2 rounded-md transition-colors border',
                            dueDateStatus?.isOverdue && 'bg-error/15 border-error/20',
                            dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && 'bg-warning/15 border-warning/20',
                            !dueDateStatus?.isOverdue && !dueDateStatus?.isDueSoon && 'bg-primary/15 border-primary/10',
                        )}>
                            <Calendar className={cn(
                                'h-3.5 w-3.5 flex-shrink-0',
                                dueDateStatus?.isOverdue && 'text-error',
                                dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && 'text-warning',
                                !dueDateStatus?.isOverdue && !dueDateStatus?.isDueSoon && 'text-brand-primary',
                            )} />
                            <div className="min-w-0">
                                <p className="text-secondary truncate">Due</p>
                                <p className={cn(
                                    'font-medium truncate',
                                    dueDateStatus?.isOverdue && 'text-error',
                                    dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && 'text-warning',
                                    !dueDateStatus?.isOverdue && !dueDateStatus?.isDueSoon && 'text-brand-primary',
                                )}>
                                    {formatDateTime(assignment.due_date, 'short')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Max Score */}
                    <div className="flex items-center gap-1.5 p-2 rounded-md bg-primary/15 border border-primary/10">
                        <span className="text-lg font-bold text-brand-primary mr-1">
                            {assignment.max_score}
                        </span>
                        <span className="text-secondary truncate">points</span>
                    </div>

                    {/* Submission Type */}
                    <div className="flex items-center gap-1.5 p-2 rounded-md bg-highlight/5 border border-highlight/10">
                        {assignment.submission_type === AssignmentSubmissionType.FILE ? (
                            <FileUp className="h-3.5 w-3.5 text-brand-highlight" />
                        ) : (
                            <Type className="h-3.5 w-3.5 text-brand-highlight" />
                        )}
                        <span className="truncate text-primary">
                            {SUBMISSION_TYPE_CONFIG[assignment.submission_type]?.label || 'Unknown'}
                        </span>
                    </div>

                    {/* Late Submission Info */}
                    <div className="flex items-center gap-1.5 p-2 rounded-md bg-muted/50 border border-border">
                        <Clock className="h-3.5 w-3.5 text-secondary" />
                        <span className="truncate text-primary">
                            {assignment.allow_late_submission
                                ? `Late OK (-${assignment.late_penalty_percentage}%)`
                                : 'No late'}
                        </span>
                    </div>
                </div>

                {/* Submission Progress (Teacher-specific) */}
                {assignment.status !== AssignmentStatus.DRAFT && submissionStats.totalStudents > 0 && (
                    <div className="mt-4 pt-3 border-t">
                        <div className="flex items-center justify-between text-xs mb-2">
                            <div className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-secondary" />
                                <span className="text-secondary">
                                    {submissionStats.submittedCount}/{submissionStats.totalStudents} submitted
                                </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                                {submissionStats.submissionPercentage}%
                            </Badge>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    'h-full transition-all duration-300',
                                    submissionStats.submissionPercentage < 50 ? 'bg-warning' :
                                        submissionStats.submissionPercentage < 80 ? 'bg-brand-highlight' : 'bg-brand-primary'
                                )}
                                style={{ width: `${submissionStats.submissionPercentage}%` }}
                            />
                        </div>

                        {submissionStats.submittedCount > 0 && (
                            <div className="flex items-center justify-between text-xs mt-2">
                                <div className="flex items-center gap-1.5">
                                    <BarChart3 className="h-3.5 w-3.5 text-secondary" />
                                    <span className="text-secondary">
                                        {submissionStats.gradedCount}/{submissionStats.submittedCount} graded
                                    </span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    {submissionStats.gradingPercentage}%
                                </Badge>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>

            <CardFooter className="border-t ">
                <div className="flex items-center gap-2 w-full">
                    {/* Main Action Button */}
                    <Button
                        variant={assignment.status === AssignmentStatus.PUBLISHED ? "default" : "outline"}
                        size="sm"
                        onClick={() => onViewDetails(assignment.id)}
                        className={cn(
                            'flex-1 gap-2 transition-all duration-200',
                            assignment.status === AssignmentStatus.PUBLISHED
                                ? 'bg-brand-highlight hover:bg-brand-highlight/90 text-highlight-foreground shadow-sm hover:shadow-md'
                                : 'border-brand-primary/20 hover:border-brand-primary/40 hover:bg-brand-primary/5 hover:text-brand-primary'
                        )}
                    >
                        {assignment.status === AssignmentStatus.PUBLISHED ? (
                            <>
                                <BarChart3 className="h-4 w-4" />
                                Grade Submissions
                            </>
                        ) : assignment.status === AssignmentStatus.CLOSED ? (
                            <>
                                <Eye className="h-4 w-4" />
                                View Results
                            </>
                        ) : (
                            <>
                                <FileText className="h-4 w-4" />
                                View Details
                            </>
                        )}
                    </Button>

                    {/* Actions Dropdown */}
                    {showTeacherActions && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 shrink-0 border border-border hover:bg-muted"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">More actions</span>
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-48">
                                {onPreview && (
                                    <DropdownMenuItem onClick={() => onPreview(assignment)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Quick Preview
                                    </DropdownMenuItem>
                                )}

                                {canEdit && onEdit && (
                                    <DropdownMenuItem onClick={() => onEdit(assignment)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Assignment
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
                                        Close Submissions
                                    </DropdownMenuItem>
                                )}

                                {canDelete && onDelete && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => onDelete(assignment)}
                                            className="text-error focus:text-error focus:bg-error/10"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Assignment
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}