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
    CirclePlay,
    NotepadTextDashed,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Assignment } from '@/lib/branch-system/types/assignment.types';
import {
    AssignmentSubmissionType,
    formatDateTime,
    getDueDateStatus,
    SUBMISSION_TYPE_CONFIG,
    determineStudentStatus,
    StudentSubmissionStatus,
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
    onViewDetails,
}: StudentAssignmentCardProps) {
    const dueDateStatus = assignment.due_date
        ? getDueDateStatus(assignment.due_date)
        : null;

    const submission = assignment.student_submission;

    // Determine student's submission status using standard utility
    const studentStatus = determineStudentStatus(submission ?? null, assignment);

    // Determine display configuration based on status
    const getSubmissionStatus = () => {
        // Check for overdue if not started
        if (studentStatus === StudentSubmissionStatus.NOT_STARTED && dueDateStatus?.isOverdue) {
            return {
                label: 'Overdue',
                variant: 'destructive' as const,
                icon: AlertCircle,
                color: 'text-error',
                bgColor: 'bg-error/10',
                borderColor: 'border-error/20',
            };
        }

        // Map student status to display config
        switch (studentStatus) {
            case StudentSubmissionStatus.NOT_STARTED:
                return {
                    label: 'Not Started',
                    variant: 'secondary' as const,
                    icon: CirclePlay,
                    color: 'text-muted-foreground',
                    bgColor: 'bg-muted',
                    borderColor: 'border-border',
                };
            case StudentSubmissionStatus.DRAFT_SAVED:
                return {
                    label: 'Draft Saved',
                    variant: 'secondary' as const,
                    icon: NotepadTextDashed,
                    color: 'text-brand-secondary',
                    bgColor: 'bg-secondary/10',
                    borderColor: 'border-secondary/20',
                };
            case StudentSubmissionStatus.SUBMITTED:
                return {
                    label: 'Submitted',
                    variant: 'success' as const,
                    icon: CheckCircle2,
                    color: 'text-brand-primary',
                    bgColor: 'bg-primary/10',
                    borderColor: 'border-primary/20',
                };
            case StudentSubmissionStatus.LATE:
                return {
                    label: 'Late Submission',
                    variant: 'warning' as const,
                    icon: AlertCircle,
                    color: 'text-warning',
                    bgColor: 'bg-warning/10',
                    borderColor: 'border-warning/20',
                };
            case StudentSubmissionStatus.GRADED:
                return {
                    label: 'Graded',
                    variant: 'success' as const,
                    icon: BarChart3,
                    color: 'text-success',
                    bgColor: 'bg-success/10',
                    borderColor: 'border-success/20',
                };
            default:
                return {
                    label: 'Not Started',
                    variant: 'secondary' as const,
                    icon: CirclePlay,
                    color: 'text-muted-foreground',
                    bgColor: 'bg-muted',
                    borderColor: 'border-border',
                };
        }
    };

    const submissionStatus = getSubmissionStatus();
    const StatusIcon = submissionStatus.icon;

    // Calculate score display
    const getScoreDisplay = () => {
        if (!submission || submission.score === null) return null;
        const score = submission.score;
        const maxScore = assignment.max_score;
        const percentage = Math.round((score / maxScore) * 100);

        let scoreColor = 'text-success';
        let bgColor = 'bg-success/15';
        let borderColor = 'border-success/20';

        if (percentage < 60) {
            scoreColor = 'text-error';
            bgColor = 'bg-error/15';
            borderColor = 'border-error/20';
        } else if (percentage < 80) {
            scoreColor = 'text-warning';
            bgColor = 'bg-warning/15';
            borderColor = 'border-warning/20';
        }

        return {
            score,
            maxScore,
            percentage,
            scoreColor,
            bgColor,
            borderColor,
        };
    };

    const scoreDisplay = getScoreDisplay();

    return (
        <Card className={cn(
            'group hover:shadow-md transition-all duration-200 border-border hover:border-primary/30',

        )}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Status Icon */}
                        <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border',
                            submissionStatus.bgColor,
                            submissionStatus.borderColor,

                        )}>
                            <StatusIcon className={cn('h-5 w-5', submissionStatus.color)} />
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
                        variant={submissionStatus.variant}
                        className="px-2 py-0.5 text-sm rounded-full"
                    >
                        {submissionStatus.label}
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
                            'flex items-center gap-1.5 p-2 rounded-md transition-colors',
                            dueDateStatus?.isOverdue && 'bg-error/15 border border-error/20',
                            dueDateStatus?.isDueSoon && !dueDateStatus?.isOverdue && 'bg-warning/15 border border-warning/20',
                            !dueDateStatus?.isOverdue && !dueDateStatus?.isDueSoon && 'bg-primary/15 border border-primary/10',
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

                    {/* Score/Max Score */}
                    <div className={cn(
                        'flex items-center gap-1.5 p-2 rounded-md transition-colors',
                        scoreDisplay
                            ? `${scoreDisplay.bgColor} border ${scoreDisplay.borderColor}`
                            : 'bg-primary/15 border border-primary/10'
                    )}>
                        {scoreDisplay ? (
                            <div className="flex items-center min-w-0">
                                <span className={cn('text-lg font-bold mr-1', scoreDisplay.scoreColor)}>
                                    {scoreDisplay.score}
                                </span>
                                <div className="text-secondary truncate">
                                    <span>/</span>
                                    <span>{scoreDisplay.maxScore} pts</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center min-w-0">
                                <span className="text-lg font-bold text-brand-primary mr-1">{assignment.max_score}</span>
                                <span className="text-secondary truncate">points</span>
                            </div>
                        )}
                    </div>

                    {/* Submission Type */}
                    <div className="flex items-center gap-1.5 p-2 rounded-md bg-brand-highlight/5 border border-brand-highlight/10">
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
            </CardContent>

            <CardFooter className="border-t pt-3 mt-3">
                <Button
                    variant={submission ? "outline" : "default"}
                    size="sm"
                    onClick={() => onViewDetails(assignment.id)}
                    className={cn(
                        'w-full gap-2 transition-all duration-200',
                        submission
                            ? 'border-brand-primary/20 hover:border-brand-primary/40 hover:bg-brand-primary/5 hover:text-brand-primary'
                            : 'bg-brand-highlight hover:bg-brand-highlight/90 text-highlight-foreground shadow-sm hover:shadow-md'
                    )}
                >
                    <Eye className="h-4 w-4" />
                    {submission ? 'View Submission' : 'Start Assignment'}
                </Button>
            </CardFooter>
        </Card>
    );
}