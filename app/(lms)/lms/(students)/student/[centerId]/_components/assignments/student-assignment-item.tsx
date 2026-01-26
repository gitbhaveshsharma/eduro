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
    Calendar,
    Eye,
    Users,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    Circle,
    Clock,
    Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Assignment } from '@/lib/branch-system/types/assignment.types';
import {
    formatDateTime,
    getDueDateStatus,
    determineStudentStatus,
    calculatePercentage,
    getScoreColor,
    StudentSubmissionStatus,
    STUDENT_STATUS_CONFIG,
} from '@/lib/branch-system/assignment';

// Brand color mapping for assignment statuses (following your attendance pattern)
function getItemBackgroundColor(status: StudentSubmissionStatus): string {
    const backgrounds: Record<StudentSubmissionStatus, string> = {
        [StudentSubmissionStatus.GRADED]: 'bg-success/15 dark:bg-success/10 border-success/20 dark:border-success/30',
        [StudentSubmissionStatus.SUBMITTED]: 'bg-primary/15 dark:bg-primary/10 border-primary/20 dark:border-primary/30',
        [StudentSubmissionStatus.LATE]: 'bg-warning/15 dark:bg-warning/10 border-warning/20 dark:border-warning/30',
        [StudentSubmissionStatus.DRAFT_SAVED]: 'bg-secondary/15 dark:bg-secondary/10 border-secondary/20 dark:border-secondary/30',
        [StudentSubmissionStatus.NOT_STARTED]: '', // No background for not started
    };

    return backgrounds[status] || '';
}

export interface StudentAssignmentItemProps {
    assignment: Assignment;
    studentId: string;
    onViewDetails: (assignmentId: string) => void;
    showClassName?: boolean;
}

export function StudentAssignmentItem({
    assignment,
    studentId,
    onViewDetails,
    showClassName = false,
}: StudentAssignmentItemProps) {
    const dueDateStatus = assignment.due_date
        ? getDueDateStatus(assignment.due_date)
        : null;

    const submission = assignment.student_submission;
    const studentStatus = determineStudentStatus(submission ?? null, assignment);

    // Updated submission status display with brand colors
    const getSubmissionStatusDisplay = () => {
        const config = STUDENT_STATUS_CONFIG[studentStatus];

        // Map icon names to actual icon components
        const iconMap = {
            'Circle': Circle,
            'Save': Save,
            'CheckCircle': CheckCircle2,
            'AlertCircle': AlertCircle,
            'BarChart3': BarChart3,
            'Clock': Clock,
        };

        const IconComponent = iconMap[config.icon as keyof typeof iconMap] || Circle;

        // Use brand color backgrounds from getItemBackgroundColor
        const bgColor = getItemBackgroundColor(studentStatus);

        // Semantic text colors matching backgrounds
        let color = 'text-muted-foreground';
        switch (studentStatus) {
            case StudentSubmissionStatus.GRADED:
                color = 'text-success-foreground dark:text-success';
                break;
            case StudentSubmissionStatus.SUBMITTED:
                color = 'text-primary-foreground dark:text-primary';
                break;
            case StudentSubmissionStatus.LATE:
            case StudentSubmissionStatus.DRAFT_SAVED:
                color = 'text-warning-foreground dark:text-warning';
                break;
            case StudentSubmissionStatus.NOT_STARTED:
                if (dueDateStatus?.isOverdue) {
                    color = 'text-destructive-foreground dark:text-destructive';
                }
                break;
        }

        return {
            label: config.label,
            variant: config.variant,
            icon: IconComponent,
            color,
            bgColor,
        };
    };

    const statusDisplay = getSubmissionStatusDisplay();
    const StatusIcon = statusDisplay.icon;

    // Calculate score display using utility functions
    const getScoreDisplay = () => {
        if (!submission || submission.score === null) return null;

        const score = submission.score;
        const maxScore = assignment.max_score;
        const percentage = calculatePercentage(score, maxScore);
        const scoreColor = getScoreColor(percentage);

        // Convert score color variant to Tailwind classes
        const colorClassMap = {
            'success': 'text-green-600',
            'warning': 'text-amber-600',
            'destructive': 'text-red-600',
        };

        return {
            score,
            maxScore,
            percentage,
            scoreColor: colorClassMap[scoreColor as keyof typeof colorClassMap] || 'text-muted-foreground',
        };
    };

    const scoreDisplay = getScoreDisplay();

    return (
        <Item
            variant="default"
            className={cn(
                'group/item hover:bg-muted/50 transition-all duration-200',
                'items-stretch gap-3 sm:gap-4 px-3 py-3 sm:px-4 sm:py-3.5',
                'border-0' // Remove border since parent has dividers
            )}
        >
            {/* Status Icon - Now uses brand color backgrounds */}
            <ItemMedia variant="icon">
                <div className={cn(
                    'w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center flex-shrink-0',
                    statusDisplay.bgColor // Brand colors with borders!
                )}>
                    <StatusIcon className={cn(
                        'h-5 w-5',
                        statusDisplay.color
                    )} />
                </div>
            </ItemMedia>

            {/* Content */}
            <ItemContent className="min-w-0 flex-1">
                <ItemTitle className="text-sm sm:text-base font-semibold mb-1.5 line-clamp-1 group-hover/item:text-primary transition-colors">
                    {assignment.title}
                </ItemTitle>

                <ItemDescription>
                    <div className="flex flex-col gap-1.5">
                        {/* Class and Due Date Row */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {/* Class Name */}
                            {showClassName && assignment.class?.class_name && (
                                <span className="flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="truncate max-w-[150px]">
                                        {assignment.class.class_name}
                                    </span>
                                </span>
                            )}

                            {/* Due Date */}
                            {assignment.due_date && (
                                <span className={cn(
                                    'flex items-center gap-1.5',
                                    dueDateStatus?.isOverdue && 'text-red-600 font-medium',
                                    dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue &&
                                    'text-amber-600 font-medium',
                                )}>
                                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>Due {formatDateTime(assignment.due_date, 'short')}</span>
                                </span>
                            )}
                        </div>

                        {/* Score/Status Row */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <Badge
                                variant={statusDisplay.variant}
                                className="text-xs font-medium h-5 px-2"
                            >
                                {statusDisplay.label}
                            </Badge>

                            {/* Score Display */}
                            {scoreDisplay ? (
                                <span className="text-xs flex items-baseline gap-1">
                                    <span className={cn('font-bold text-sm', scoreDisplay.scoreColor)}>
                                        {scoreDisplay.score}
                                    </span>
                                    <span className="text-muted-foreground">
                                        / {scoreDisplay.maxScore} pts
                                    </span>
                                    <span className={cn('font-medium ml-0.5', scoreDisplay.scoreColor)}>
                                        ({scoreDisplay.percentage}%)
                                    </span>
                                </span>
                            ) : (
                                <span className="text-xs text-muted-foreground">
                                    {assignment.max_score} points
                                </span>
                            )}
                        </div>
                    </div>
                </ItemDescription>
            </ItemContent>

            {/* Actions */}
            <ItemActions className="flex items-center">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(assignment.id)}
                    className="gap-1.5 h-8 px-2.5 sm:px-3 flex-shrink-0"
                >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs">
                        {submission ? 'View' : 'Start'}
                    </span>
                </Button>
            </ItemActions>
        </Item>
    );
}
