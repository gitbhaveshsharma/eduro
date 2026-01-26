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
} from '@/components/ui/item';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Calendar,
    Eye,
    Users,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    CirclePlay,
    Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Assignment } from '@/lib/branch-system/types/assignment.types';
import {
    formatDateTime,
    getDueDateStatus,
    determineStudentStatus,
    getStudentStatusConfig,
    calculatePercentage,
    getScoreColor,
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
        <TooltipProvider>
            <div className="space-y-2">
                {items.map((assignment) => {
                    const dueDateStatus = assignment.due_date
                        ? getDueDateStatus(assignment.due_date)
                        : null;

                    const submission = assignment.student_submission;

                    // Determine student's submission status using utility
                    const studentStatus = determineStudentStatus(submission ?? null, assignment);

                    const statusConfig = getStudentStatusConfig(studentStatus);

                    // Map status to icon component
                    const getStatusIcon = () => {
                        switch (studentStatus) {
                            case 'NOT_STARTED':
                                return CirclePlay;
                            case 'DRAFT_SAVED':
                                return Save;
                            case 'SUBMITTED':
                                return CheckCircle2;
                            case 'LATE':
                                return AlertCircle;
                            case 'GRADED':
                                return BarChart3;
                            default:
                                return CirclePlay;
                        }
                    };

                    const StatusIcon = getStatusIcon();

                    // Get status colors using brand colors
                    const getStatusColors = () => {
                        // If not started and overdue, use error red
                        if (!submission && dueDateStatus?.isOverdue) {
                            return {
                                color: 'text-red-700 dark:text-red-400',
                                bgColor: 'bg-red-100 dark:bg-red-900/30',
                            };
                        }

                        switch (studentStatus) {
                            case 'NOT_STARTED':
                                return {
                                    color: 'text-muted-foreground',

                                };
                            case 'DRAFT_SAVED':
                                // Using warning amber
                                return {
                                    color: 'text-orange-700 dark:text-orange-400',

                                };
                            case 'SUBMITTED':
                                // Using brand-secondary (sky blue)
                                return {
                                    color: 'text-blue-700 dark:text-blue-400',
                                    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
                                };
                            case 'LATE':
                                // Using error red
                                return {
                                    color: 'text-red-700 dark:text-red-400',

                                };
                            case 'GRADED':
                                // Using success green
                                return {
                                    color: 'text-green-700 dark:text-green-400',
                                };
                            default:
                                return {
                                    color: 'text-muted-foreground',
                                };
                        }
                    };

                    const statusColors = getStatusColors();

                    // Get item background color for warning states
                    const getItemBackgroundColor = () => {
                        // Overdue - error red background
                        if (!submission && dueDateStatus?.isOverdue) {
                            return 'bg-error/15 dark:bg-error/10 border-error/20 dark:border-error/30';
                        }

                        // Late submission - error red background
                        if (studentStatus === 'LATE') {
                            return 'bg-error/15 dark:bg-error/10 border-error/20 dark:border-error/30';
                        }

                        // Draft saved - warning amber background
                        if (studentStatus === 'DRAFT_SAVED') {
                            return 'bg-warning/15 dark:bg-warning/10 border-warning/20 dark:border-warning/30';
                        }

                        // Due soon (not overdue, not submitted) - subtle warning
                        if (!submission && dueDateStatus?.isDueSoon) {
                            return 'bg-warning/10 dark:bg-warning/5 border-warning/15 dark:border-warning/20';
                        }

                        return '';
                    };

                    const itemBgColor = getItemBackgroundColor();

                    // Calculate score display using utilities
                    const getScoreDisplay = () => {
                        if (!submission || submission.score === null) return null;

                        const percentage = calculatePercentage(submission.score, assignment.max_score);
                        const scoreColorVariant = getScoreColor(percentage);

                        // Map score color variant to Tailwind class
                        const scoreColorClass =
                            scoreColorVariant === 'success' ? 'text-green-600' :
                                scoreColorVariant === 'warning' ? 'text-amber-600' :
                                    'text-red-600';

                        return {
                            score: submission.score,
                            maxScore: assignment.max_score,
                            percentage,
                            scoreColor: scoreColorClass,
                        };
                    };

                    const scoreDisplay = getScoreDisplay();

                    // Determine tooltip text based on submission status
                    const getTooltipText = () => {
                        if (!submission) {
                            if (dueDateStatus?.isOverdue) {
                                return "Start your assignment (Overdue)";
                            }
                            return "Start your assignment";
                        }

                        switch (studentStatus) {
                            case 'DRAFT_SAVED':
                                return "Continue editing draft";
                            case 'SUBMITTED':
                                return "View submission";
                            case 'LATE':
                                return "View late submission";
                            case 'GRADED':
                                return "View grade and feedback";
                            default:
                                return "View assignment";
                        }
                    };

                    return (
                        <div key={assignment.id}>
                            <Item
                                variant="default"
                                className={cn(
                                    'group/item hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5',
                                    'items-stretch gap-4 px-4 py-3 sm:px-5 sm:py-4',
                                    itemBgColor,
                                    itemBgColor && 'border'
                                )}
                            >
                                {/* Icon */}
                                <ItemMedia variant="icon">
                                    <div className={cn(
                                        'w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center',
                                        statusColors.bgColor
                                    )}>
                                        <StatusIcon className={cn(
                                            'h-5 w-5 sm:h-6 sm:w-6',
                                            statusColors.color
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
                                            variant={!submission && dueDateStatus?.isOverdue ? 'destructive' : statusConfig.variant}
                                            className="text-xs font-medium flex-shrink-0"
                                        >
                                            {!submission && dueDateStatus?.isOverdue ? 'Overdue' : statusConfig.label}
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
                                                    dueDateStatus?.isOverdue && 'text-red-600 dark:text-red-400 font-medium',
                                                    dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && 'text-orange-600 dark:text-orange-400',
                                                )}>
                                                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                                                    {formatDateTime(assignment.due_date, 'short')}
                                                    {dueDateStatus?.isOverdue && (
                                                        <span className="text-red-600 dark:text-red-400 font-medium">(Overdue)</span>
                                                    )}
                                                    {dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && (
                                                        <span className="text-orange-600 dark:text-orange-400 font-medium">
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
                                    <Tooltip>
                                        <TooltipTrigger asChild>
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
                                        </TooltipTrigger>
                                        <TooltipContent side="top" align="end">
                                            <p>{getTooltipText()}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </ItemActions>
                            </Item>
                        </div>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}