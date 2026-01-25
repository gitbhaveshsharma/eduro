/**
 * Student Assignment List Component
 * 
 * List view for displaying student assignments
 * Mobile-first responsive design
 * Shows submission status, due date, and grade information
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
    Eye,
    Users,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Assignment } from '@/lib/branch-system/types/assignment.types';
import {
    formatDateTime,
    getDueDateStatus,
} from '@/lib/branch-system/assignment';

export interface StudentAssignmentListProps {
    /** Either a list of assignments to display, or a single assignment */
    assignments?: Assignment[];
    assignment?: Assignment;
    /** Current student's ID */
    studentId: string;
    /** Callback when view details is clicked */
    onViewDetails: (assignmentId: string) => void;
}

export function StudentAssignmentList({
    assignments,
    assignment,
    studentId,
    onViewDetails,
}: StudentAssignmentListProps) {
    const items = assignments ?? (assignment ? [assignment] : []);

    return (
        <div className="space-y-2">
            {items.map((assignment, index) => {
                const dueDateStatus = assignment.due_date
                    ? getDueDateStatus(assignment.due_date)
                    : null;

                const submission = assignment.student_submission;

                // Determine student's submission status
                const getSubmissionStatus = () => {
                    if (!submission) {
                        if (dueDateStatus?.isOverdue) {
                            return {
                                label: 'Overdue',
                                variant: 'destructive' as const,
                                icon: AlertCircle,
                                color: 'text-red-600',
                                bgColor: 'bg-red-100 dark:bg-red-900/30',
                            };
                        }
                        return {
                            label: 'Not Started',
                            variant: 'secondary' as const,
                            icon: Circle,
                            color: 'text-muted-foreground',
                            bgColor: 'bg-secondary/30',
                        };
                    }

                    if (submission.grading_status === 'MANUAL_GRADED' || submission.grading_status === 'AUTO_GRADED') {
                        return {
                            label: 'Graded',
                            variant: 'success' as const,
                            icon: BarChart3,
                            color: 'text-green-600',
                            bgColor: 'bg-green-100 dark:bg-green-900/30',
                        };
                    }

                    if (submission.is_late) {
                        return {
                            label: 'Late Submission',
                            variant: 'warning' as const,
                            icon: AlertCircle,
                            color: 'text-amber-600',
                            bgColor: 'bg-amber-100 dark:bg-amber-900/30',
                        };
                    }

                    return {
                        label: 'Submitted',
                        variant: 'success' as const,
                        icon: CheckCircle2,
                        color: 'text-blue-600',
                        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
                    };
                };

                const submissionStatus = getSubmissionStatus();
                const StatusIcon = submissionStatus.icon;

                // Calculate score display
                const getScoreDisplay = () => {
                    if (!submission || submission.score === null) return null;
                    const score = submission.score;
                    const maxScore = assignment.max_score;
                    const percentage = Math.round((score / maxScore) * 100);

                    let scoreColor = 'text-green-600';
                    if (percentage < 60) scoreColor = 'text-red-600';
                    else if (percentage < 80) scoreColor = 'text-amber-600';

                    return {
                        score,
                        maxScore,
                        percentage,
                        scoreColor,
                    };
                };

                const scoreDisplay = getScoreDisplay();

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
                                    submissionStatus.bgColor
                                )}>
                                    <StatusIcon className={cn(
                                        'h-5 w-5 sm:h-6 sm:w-6',
                                        submissionStatus.color
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
                                        variant={submissionStatus.variant}
                                        className="text-xs font-medium flex-shrink-0"
                                    >
                                        {submissionStatus.label}
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
                                        {/* Score/Max Score */}
                                        <span className="flex items-center gap-1.5">
                                            {scoreDisplay ? (
                                                <>
                                                    <span className={cn('font-medium', scoreDisplay.scoreColor)}>
                                                        {scoreDisplay.score}
                                                    </span>
                                                    <span className="text-muted-foreground">/{scoreDisplay.maxScore} pts</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="font-medium">{assignment.max_score}</span> pts
                                                </>
                                            )}
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
                                    <span className="hidden sm:inline">
                                        {submission ? 'View' : 'Start'}
                                    </span>
                                </Button>
                            </ItemActions>
                        </Item>

                    </div>
                );
            })}
        </div>
    );
}