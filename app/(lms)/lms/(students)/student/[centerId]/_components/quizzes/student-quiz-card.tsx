/**
 * Student Quiz Card Component
 * 
 * Card view for displaying individual quizzes for students
 * Shows quiz status, availability, attempts, and score information
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardContent } from '@/components/ui/card';
import {
    Calendar,
    Clock,
    Eye,
    Play,
    FileQuestion,
    Timer,
    Target,
    Award,
    CheckCircle2,
    XCircle,
    AlertCircle,
    RotateCcw,
    Trophy,
    Circle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Quiz, QuizAttempt } from '@/lib/branch-system/types/quiz.types';
import {
    formatDateTime,
    getQuizAvailabilityStatus,
    formatTimeMinutes,
    formatScore,
    calculatePercentage,
    getScoreColor,
    determineStudentQuizStatus,
    canAttemptQuiz,
    getRemainingAttempts,
    STUDENT_QUIZ_STATUS_CONFIG,
    StudentQuizStatus,
} from '@/lib/branch-system/quiz';

export interface StudentQuizCardProps {
    /** Quiz data to display */
    quiz: Quiz;
    /** Student's attempts for this quiz */
    studentAttempts?: QuizAttempt[];
    /** Callback when view details is clicked */
    onViewDetails: (quizId: string) => void;
}

// Icon mapping for status config strings to actual components
const ICON_MAP: Record<string, LucideIcon> = {
    'Circle': Circle,
    'Clock': Clock,
    'CheckCircle': CheckCircle2,
    'Trophy': Trophy,
    'XCircle': XCircle,
    'Timer': Timer,
    'Play': Play,
};

export function StudentQuizCard({
    quiz,
    studentAttempts = [],
    onViewDetails,
}: StudentQuizCardProps) {
    // Check availability status
    const availabilityStatus = getQuizAvailabilityStatus(quiz.available_from, quiz.available_to);

    // Determine if quiz is currently available (within time window)
    const isCurrentlyAvailable = availabilityStatus.status === 'active';
    const isUpcoming = availabilityStatus.status === 'upcoming';
    const hasEnded = availabilityStatus.status === 'ended';

    // Get latest attempt
    const latestAttempt = studentAttempts.length > 0
        ? [...studentAttempts].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0]
        : null;

    // Get best completed attempt
    const completedAttempts = studentAttempts.filter(a =>
        a.attempt_status === 'COMPLETED' || a.attempt_status === 'TIMEOUT'
    );
    const bestAttempt = completedAttempts.length > 0
        ? completedAttempts.reduce((best, current) =>
            (current.score ?? 0) > (best.score ?? 0) ? current : best
        )
        : null;

    // Determine student quiz status
    const studentStatus = determineStudentQuizStatus(latestAttempt, quiz);

    // Check if student can attempt (includes availability check)
    const attemptability = canAttemptQuiz(quiz, studentAttempts);
    const remainingAttempts = getRemainingAttempts(quiz.max_attempts, studentAttempts);

    // Get status configuration from utils
    const baseStatusConfig = STUDENT_QUIZ_STATUS_CONFIG[studentStatus];

    // Override status for special cases
    const getStatusConfig = () => {
        if (studentStatus === StudentQuizStatus.NOT_STARTED) {
            if (isUpcoming) {
                return {
                    ...baseStatusConfig,
                    label: 'Upcoming',
                    icon: 'Clock' as const,
                    color: 'text-brand-secondary',
                    bgColor: 'bg-brand-secondary/10',
                    borderColor: 'border-brand-secondary/30',
                };
            }
            if (hasEnded) {
                return {
                    ...baseStatusConfig,
                    label: 'Missed',
                    icon: 'XCircle' as const,
                    color: 'text-destructive',
                    bgColor: 'bg-destructive/10',
                    borderColor: 'border-destructive/30',
                };
            }
            return {
                ...baseStatusConfig,
                label: 'Available',
                icon: 'Play' as const,
                color: 'text-brand-primary',
                bgColor: 'bg-primary/10',
                borderColor: 'border-primary/30',
            };
        }

        // For other statuses, use the utility config with proper color mapping
        let color = 'text-muted-foreground';
        let bgColor = 'bg-muted';
        let borderColor = 'border-border';

        switch (studentStatus) {
            case StudentQuizStatus.IN_PROGRESS:
                color = 'text-warning';
                bgColor = 'bg-warning/10';
                borderColor = 'border-warning/30';
                break;
            case StudentQuizStatus.PASSED:
                color = 'text-success';
                bgColor = 'bg-success/10';
                borderColor = 'border-success/30';
                break;
            case StudentQuizStatus.FAILED:
            case StudentQuizStatus.TIMED_OUT:
                color = 'text-destructive';
                bgColor = 'bg-destructive/10';
                borderColor = 'border-destructive/30';
                break;
            case StudentQuizStatus.COMPLETED:
                color = 'text-brand-secondary';
                bgColor = 'bg-brand-secondary/10';
                borderColor = 'border-brand-secondary/30';
                break;
        }

        return {
            ...baseStatusConfig,
            color,
            bgColor,
            borderColor,
        };
    };

    const statusConfig = getStatusConfig();
    // Resolve icon from string name to actual component
    const iconName = typeof statusConfig.icon === 'string' ? statusConfig.icon : 'Circle';
    const StatusIcon = ICON_MAP[iconName] || Circle;

    // Calculate score display for best attempt
    const getScoreDisplay = () => {
        if (!bestAttempt || bestAttempt.score === null) return null;

        const score = bestAttempt.score;
        const maxScore = quiz.max_score;
        const percentage = calculatePercentage(score, maxScore);
        const scoreColorClass = getScoreColor(percentage);

        // Use brand colors for score display
        let bgColor = 'bg-success/10';
        let borderColor = 'border-success/30';
        let textColor = 'text-success';

        if (scoreColorClass === 'destructive') {
            bgColor = 'bg-destructive/10';
            borderColor = 'border-destructive/30';
            textColor = 'text-destructive';
        } else if (scoreColorClass === 'warning') {
            bgColor = 'bg-warning/10';
            borderColor = 'border-warning/30';
            textColor = 'text-warning';
        }

        return {
            score,
            maxScore,
            percentage,
            bgColor,
            borderColor,
            textColor,
        };
    };

    const scoreDisplay = getScoreDisplay();

    // Primary action is always to view details - student starts quiz from details page
    const primaryAction = {
        label: 'View Details',
        icon: Eye,
        onClick: () => onViewDetails(quiz.id),
        variant: 'default' as const,
        disabled: false,
    };
    const ActionIcon = primaryAction.icon;

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
                            statusConfig.bgColor,
                            statusConfig.borderColor,
                        )}>
                            <StatusIcon className={cn('h-5 w-5', statusConfig.color)} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm group-hover:text-brand-primary transition-colors line-clamp-1 md:line-clamp-2">
                                {quiz.title}
                            </h3>
                            {quiz.class?.class_name && (
                                <p className="text-xs text-secondary truncate max-w-[120px] sm:max-w-[150px] md:max-w-none line-clamp-1 md:line-clamp-2">
                                    {quiz.class.class_name}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Status Badge */}
                    <Badge
                        variant={statusConfig.variant}
                        className="px-2 py-0.5 rounded-full shrink-0"
                    >
                        {statusConfig.label}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-3 pb-3">
                {/* Quiz Stats */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FileQuestion className="h-3.5 w-3.5" />
                        <span>{quiz.total_questions} questions</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Timer className="h-3.5 w-3.5" />
                        <span>{formatTimeMinutes(quiz.time_limit_minutes)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Target className="h-3.5 w-3.5" />
                        <span>{quiz.max_score} points</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>{remainingAttempts}/{quiz.max_attempts} left</span>
                    </div>
                </div>

                {/* Score Display (if attempted) */}
                {scoreDisplay && (
                    <div className={cn(
                        'flex items-center justify-between p-2 rounded-lg border',
                        scoreDisplay.bgColor,
                        scoreDisplay.borderColor,
                    )}>
                        <div className="flex items-center gap-2">
                            <Award className={cn('h-4 w-4', scoreDisplay.textColor)} />
                            <span className="text-sm font-medium">Best Score</span>
                        </div>
                        <span className={cn('text-sm font-bold', scoreDisplay.textColor)}>
                            {formatScore(scoreDisplay.score, scoreDisplay.maxScore, true)}
                        </span>
                    </div>
                )}

                {/* Passing Score Info */}
                {quiz.passing_score !== null && !scoreDisplay && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Award className="h-3.5 w-3.5 text-brand-highlight" />
                        <span>
                            Pass: {quiz.passing_score}/{quiz.max_score} ({Math.round(calculatePercentage(quiz.passing_score, quiz.max_score))}%)
                        </span>
                    </div>
                )}

                {/* Availability Info */}
                <div className="space-y-1 text-xs text-muted-foreground border-t pt-2">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>Available: {formatDateTime(quiz.available_from, 'short')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>Until: {formatDateTime(quiz.available_to, 'short')}</span>
                    </div>
                    {availabilityStatus.timeRemaining && (
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            <span className={cn(
                                'font-medium',
                                isUpcoming ? 'text-brand-secondary' : 'text-brand-primary'
                            )}>
                                {isUpcoming ? `Opens in ${availabilityStatus.timeRemaining}` : `Ends in ${availabilityStatus.timeRemaining}`}
                            </span>
                        </div>
                    )}
                </div>

                {/* Attempt Reason (if cannot attempt) */}
                {!attemptability.canAttempt && attemptability.reason && isCurrentlyAvailable && (
                    <div className="flex items-center gap-1.5 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{attemptability.reason}</span>
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-0">
                <Button
                    variant={primaryAction.variant}
                    size="sm"
                    onClick={primaryAction.onClick}
                    className="w-full"
                    disabled={primaryAction.disabled}
                >
                    <ActionIcon className="h-3.5 w-3.5 mr-1.5" />
                    {primaryAction.label}
                </Button>
            </CardFooter>
        </Card>
    );
}