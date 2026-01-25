/**
 * Assignment Detail Header Component
 * 
 * Displays assignment header with title, status, and key info
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Calendar,
    Clock,
    FileUp,
    Type,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Assignment, AssignmentSubmission } from '@/lib/branch-system/types/assignment.types';
import {
    AssignmentSubmissionType,
    formatDateTime,
    getDueDateStatus,
    SUBMISSION_TYPE_CONFIG,
} from '@/lib/branch-system/assignment';

export interface AssignmentDetailHeaderProps {
    assignment: Assignment;
    submission: AssignmentSubmission | null;
    onBack: () => void;
}

export function AssignmentDetailHeader({
    assignment,
    submission,
    onBack,
}: AssignmentDetailHeaderProps) {
    const dueDateStatus = assignment.due_date
        ? getDueDateStatus(assignment.due_date)
        : null;

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

    return (
        <div className="space-y-4">
            {/* Back Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="gap-2 -ml-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Assignments
            </Button>

            {/* Title and Status */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                        submissionStatus.bgColor
                    )}>
                        <StatusIcon className={cn('h-6 w-6', submissionStatus.color)} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {assignment.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                            {assignment.class?.class_name && (
                                <span>{assignment.class.class_name}</span>
                            )}
                            {assignment.teacher?.full_name && (
                                <>
                                    <span>•</span>
                                    <span>by {assignment.teacher.full_name}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <Badge
                    variant={submissionStatus.variant}
                    className="text-sm w-fit"
                >
                    {submissionStatus.label}
                </Badge>
            </div>

            {/* Key Info Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Due Date */}
                {assignment.due_date && (
                    <div className={cn(
                        'p-3 rounded-xl border bg-card',
                        dueDateStatus?.isOverdue && 'border-red-200 bg-red-50 dark:bg-red-900/10',
                        dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && 'border-amber-200 bg-amber-50 dark:bg-amber-900/10',
                    )}>
                        <div className="flex items-center gap-2">
                            <Calendar className={cn(
                                'h-4 w-4',
                                dueDateStatus?.isOverdue && 'text-red-600',
                                dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && 'text-amber-600',
                                !dueDateStatus?.isOverdue && !dueDateStatus?.isDueSoon && 'text-muted-foreground',
                            )} />
                            <span className="text-xs text-muted-foreground">Due Date</span>
                        </div>
                        <p className={cn(
                            'font-semibold mt-1',
                            dueDateStatus?.isOverdue && 'text-red-600',
                            dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && 'text-amber-600',
                        )}>
                            {formatDateTime(assignment.due_date, 'short')}
                        </p>
                    </div>
                )}

                {/* Max Score */}
                <div className="p-3 rounded-xl border bg-card">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Max Score</span>
                    </div>
                    <p className="font-semibold mt-1 text-primary">
                        {assignment.max_score} points
                    </p>
                </div>

                {/* Submission Type */}
                <div className="p-3 rounded-xl border bg-card">
                    <div className="flex items-center gap-2">
                        {assignment.submission_type === AssignmentSubmissionType.FILE ? (
                            <FileUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <Type className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">Type</span>
                    </div>
                    <p className="font-semibold mt-1">
                        {SUBMISSION_TYPE_CONFIG[assignment.submission_type]?.label}
                    </p>
                </div>

                {/* Late Policy */}
                <div className="p-3 rounded-xl border bg-card">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Late Policy</span>
                    </div>
                    <p className="font-semibold mt-1">
                        {assignment.allow_late_submission
                            ? `-${assignment.late_penalty_percentage}% penalty`
                            : 'Not allowed'}
                    </p>
                </div>
            </div>

            {/* Score Display (if graded) */}
            {submission && submission.score !== null && (
                <div className="p-4 rounded-xl border-2 border-green-200 bg-green-50 dark:bg-green-900/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Your Score</p>
                            <p className="text-3xl font-bold text-green-600">
                                {submission.score}
                                <span className="text-lg text-muted-foreground font-normal">
                                    /{assignment.max_score}
                                </span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Percentage</p>
                            <p className="text-2xl font-bold text-green-600">
                                {Math.round((submission.score / assignment.max_score) * 100)}%
                            </p>
                        </div>
                    </div>
                    {submission.penalty_applied > 0 && (
                        <p className="text-sm text-amber-600 mt-2">
                            Late penalty applied: -{submission.penalty_applied} points
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
