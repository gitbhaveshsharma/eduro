/**
 * Student Assignment Card Component
 * 
 * Grid view for displaying individual assignments for students
 * Shows submission status, due date, and grade information
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
    Calendar,
    Clock,
    Eye,
    FileUp,
    Type,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Assignment } from '@/lib/branch-system/types/assignment.types';
import {
    AssignmentSubmissionType,
    formatDateTime,
    getDueDateStatus,
    SUBMISSION_TYPE_CONFIG,
} from '@/lib/branch-system/assignment';

export interface StudentAssignmentCardProps {
    /** Assignment data to display */
    assignment: Assignment;
    /** Current student's ID */
    studentId: string;
    /** Callback when view details is clicked */
    onViewDetails: (assignmentId: string) => void;
}

export function StudentAssignmentCard({
    assignment,
    studentId,
    onViewDetails,
}: StudentAssignmentCardProps) {
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
        <Card className={cn(
            'group hover:shadow-md transition-all duration-200',
            'flex flex-col h-full',
        )}>
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Status Icon */}
                        <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                            submissionStatus.bgColor
                        )}>
                            <StatusIcon className={cn('h-5 w-5', submissionStatus.color)} />
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

                    {/* Status Badge */}
                    <Badge
                        variant={submissionStatus.variant}
                        className="text-xs shrink-0"
                    >
                        {submissionStatus.label}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="flex-1">
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

                    {/* Score/Max Score */}
                    <div className="flex items-center gap-1.5 p-2 rounded-md bg-muted/50">
                        {scoreDisplay ? (
                            <>
                                <span className={cn('text-lg font-bold', scoreDisplay.scoreColor)}>
                                    {scoreDisplay.score}
                                </span>
                                <span className="text-muted-foreground">/{scoreDisplay.maxScore} pts</span>
                            </>
                        ) : (
                            <>
                                <span className="text-lg font-bold text-primary">{assignment.max_score}</span>
                                <span className="text-muted-foreground">points</span>
                            </>
                        )}
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

                    {/* Late Submission Info */}
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

            <CardFooter className="border-t">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(assignment.id)}
                    className="w-full gap-2"
                >
                    <Eye className="h-4 w-4" />
                    {submission ? 'View Submission' : 'Start Assignment'}
                </Button>
            </CardFooter>
        </Card>
    );
}