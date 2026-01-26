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
    NotepadTextDashed,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    Circle,
    Type,
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
                    color: 'text-error',
                    bgColor: 'bg-error/20',
                    borderColor: 'border-error/50',
                };
            }
            return {
                label: 'Not Started',
                variant: 'secondary' as const,
                icon: Circle,
                color: 'text-muted-foreground',
                bgColor: 'bg-muted/20',
                borderColor: 'border-border/50',
            };
        }

        if (submission.grading_status === 'MANUAL_GRADED' || submission.grading_status === 'AUTO_GRADED') {
            return {
                label: 'Graded',
                variant: 'success' as const,
                icon: BarChart3,
                color: 'text-success',
                bgColor: 'bg-success/20',
                borderColor: 'border-success/50',
            };
        }

        if (submission.is_late) {
            return {
                label: 'Late Submission',
                variant: 'warning' as const,
                icon: AlertCircle,
                color: 'text-warning',
                bgColor: 'bg-warning/20',
                borderColor: 'border-warning/50',
            };
        }
        if (submission.is_final === false) {
            return {
                label: 'Draft Saved',
                variant: 'secondary' as const,
                icon: NotepadTextDashed,
                color: 'text-brand-secondary',
                bgColor: 'bg-secondary/20',
                borderColor: 'border-secondary/50',
            };
        }

        return {
            label: 'Submitted',
            variant: 'success' as const,
            icon: CheckCircle2,
            color: 'text-brand-primary',
            bgColor: 'bg-brand-primary/20',
            borderColor: 'border-brand-primary/50',
        };
    };

    const submissionStatus = getSubmissionStatus();
    const StatusIcon = submissionStatus.icon;

    // Get grade percentage for visual indicator
    const getGradePercentage = () => {
        if (!submission || submission.score === null) return 0;
        return (submission.score / assignment.max_score) * 100;
    };

    const gradePercentage = getGradePercentage();
    const isHighGrade = gradePercentage >= 80;
    const isMediumGrade = gradePercentage >= 50 && gradePercentage < 80;
    const isLowGrade = gradePercentage < 50;

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="gap-2 -ml-2 hover:bg-brand-secondary/10 hover:text-brand-primary transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Assignments
            </Button>

            {/* Title and Status */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border',
                        submissionStatus.bgColor,
                        submissionStatus.borderColor
                    )}>
                        <StatusIcon className={cn('h-6 w-6', submissionStatus.color)} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-primary">
                            {assignment.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-secondary">
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
                    className="px-3 py-1 text-sm font-medium"
                >
                    {submissionStatus.label}
                </Badge>
            </div>

            {/* Key Info Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Due Date */}
                {assignment.due_date && (
                    <div className={cn(
                        'p-4 rounded-xl border bg-card transition-all hover:shadow-sm',
                        dueDateStatus?.isOverdue && 'border-error/50 bg-error/30',
                        dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && 'border-warning/50 bg-warning/20',
                        !dueDateStatus?.isOverdue && !dueDateStatus?.isDueSoon && 'border-brand-primary/50 hover:border-brand-primary/40',
                    )}>
                        <div className="flex items-center gap-2">
                            <Calendar className={cn(
                                'h-4 w-4',
                                dueDateStatus?.isOverdue && 'text-error',
                                dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && 'text-warning',
                                !dueDateStatus?.isOverdue && !dueDateStatus?.isDueSoon && 'text-brand-primary',
                            )} />
                            <span className="text-xs text-secondary">Due Date</span>
                        </div>
                        <p className={cn(
                            'font-semibold mt-1.5',
                            dueDateStatus?.isOverdue && 'text-error',
                            dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && 'text-warning',
                            !dueDateStatus?.isOverdue && !dueDateStatus?.isDueSoon && 'text-primary',
                        )}>
                            {formatDateTime(assignment.due_date, 'short')}
                        </p>
                    </div>
                )}

                {/* Max Score */}
                <div className="p-4 rounded-xl border border-brand-secondary/20 bg-card hover:border-brand-secondary/40 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-brand-secondary" />
                        <span className="text-xs text-secondary">Max Score</span>
                    </div>
                    <p className="font-semibold mt-1.5 text-brand-primary">
                        {assignment.max_score} points
                    </p>
                </div>

                {/* Submission Type */}
                <div className="p-4 rounded-xl border border-brand-highlight/20 bg-card hover:border-brand-highlight/40 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-2">
                        {assignment.submission_type === AssignmentSubmissionType.FILE ? (
                            <FileUp className="h-4 w-4 text-brand-highlight" />
                        ) : (
                            <Type className="h-4 w-4 text-brand-highlight" />
                        )}
                        <span className="text-xs text-secondary">Type</span>
                    </div>
                    <p className="font-semibold mt-1.5 text-brand-highlight">
                        {SUBMISSION_TYPE_CONFIG[assignment.submission_type]?.label}
                    </p>
                </div>

                {/* Late Policy */}
                <div className="p-4 rounded-xl border border-border bg-card hover:border-brand-primary/30 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-secondary" />
                        <span className="text-xs text-secondary">Late Policy</span>
                    </div>
                    <p className="font-semibold mt-1.5 text-primary">
                        {assignment.allow_late_submission
                            ? `-${assignment.late_penalty_percentage}% penalty`
                            : 'Not allowed'}
                    </p>
                </div>
            </div>

            {/* Score Display (if graded) */}
            {submission && submission.score !== null && (
                <div className={cn(
                    "p-6 rounded-xl border-2 bg-card shadow-sm transition-all",
                    isHighGrade && "border-success/40 bg-success/5",
                    isMediumGrade && "border-warning/40 bg-warning/5",
                    isLowGrade && "border-error/40 bg-error/5",
                )}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary">Your Score</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <p className={cn(
                                    "text-3xl font-bold",
                                    isHighGrade && "text-success",
                                    isMediumGrade && "text-warning",
                                    isLowGrade && "text-error",
                                )}>
                                    {submission.score}
                                </p>
                                <span className="text-lg text-secondary font-medium">
                                    /{assignment.max_score}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-secondary">Percentage</p>
                            <p className={cn(
                                "text-2xl font-bold",
                                isHighGrade && "text-success",
                                isMediumGrade && "text-warning",
                                isLowGrade && "text-error",
                            )}>
                                {Math.round(gradePercentage)}%
                            </p>
                        </div>
                    </div>

                    {/* Progress bar for visual representation */}
                    <div className="mt-4">
                        <div className="flex justify-between text-sm text-secondary mb-1">
                            <span>Grade Progress</span>
                            <span>{Math.round(gradePercentage)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    isHighGrade && "bg-success",
                                    isMediumGrade && "bg-warning",
                                    isLowGrade && "bg-error",
                                )}
                                style={{ width: `${Math.min(gradePercentage, 100)}%` }}
                            />
                        </div>
                    </div>

                    {submission.penalty_applied > 0 && (
                        <p className="text-sm text-warning mt-3 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            Late penalty applied: -{submission.penalty_applied} points
                        </p>
                    )}


                </div>
            )}

            {/* Pending Submission Status */}
            {submission && submission.score === null && submission.is_final === true && (
                <div className="p-5 rounded-xl border-2 border-brand-secondary/30 bg-brand-secondary/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-brand-secondary font-medium">Submission Received</p>
                            <p className="text-lg text-primary font-semibold mt-1">
                                Awaiting grading by instructor
                            </p>
                            <p className="text-sm text-secondary mt-1">
                                Your submission has been successfully uploaded and is pending review.
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-brand-secondary/10 border border-brand-secondary/20 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-brand-secondary" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}