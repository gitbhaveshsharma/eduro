/**
 * Student Quiz Card Component
 * 
 * Card view for displaying individual quizzes for students
 * Shows quiz status, availability, attempts, and score information
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Quiz, QuizAttempt, StudentQuizStatus } from '@/lib/branch-system/types/quiz.types';
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
} from '@/lib/branch-system/quiz';

export interface StudentQuizCardProps {
    /** Quiz data to display */
    quiz: Quiz;
    /** Student's attempts for this quiz */
    studentAttempts?: QuizAttempt[];
    /** Callback when start/continue quiz is clicked */
    onStartQuiz: (quiz: Quiz, existingAttempt?: QuizAttempt) => void;
    /** Callback when view results is clicked */
    onViewResults: (quiz: Quiz, attemptId: string) => void;
    /** Callback when view details is clicked */
    onViewDetails: (quizId: string) => void;
}

export function StudentQuizCard({
    quiz,
    studentAttempts = [],
    onStartQuiz,
    onViewResults,
    onViewDetails,
}: StudentQuizCardProps) {
    const availabilityStatus = getQuizAvailabilityStatus(quiz.available_from, quiz.available_to);

    // Get latest attempt
    const latestAttempt = studentAttempts.length > 0
        ? studentAttempts.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0]
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

    // Check if student can attempt
    const attemptability = canAttemptQuiz(quiz, studentAttempts);
    const remainingAttempts = getRemainingAttempts(quiz.max_attempts, studentAttempts);

    // Get in-progress attempt if any
    const inProgressAttempt = studentAttempts.find(a => a.attempt_status === 'IN_PROGRESS');

    // Get status display configuration
    const getStatusConfig = () => {
        switch (studentStatus) {
            case 'NOT_STARTED':
                if (availabilityStatus.status === 'upcoming') {
                    return {
                        label: 'Upcoming',
                        variant: 'secondary' as const,
                        icon: Clock,
                        color: 'text-blue-600',
                        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
                        borderColor: 'border-blue-200 dark:border-blue-800',
                    };
                }
                if (availabilityStatus.status === 'ended') {
                    return {
                        label: 'Missed',
                        variant: 'destructive' as const,
                        icon: XCircle,
                        color: 'text-red-600',
                        bgColor: 'bg-red-100 dark:bg-red-900/30',
                        borderColor: 'border-red-200 dark:border-red-800',
                    };
                }
                return {
                    label: 'Not Started',
                    variant: 'outline' as const,
                    icon: Play,
                    color: 'text-muted-foreground',
                    bgColor: 'bg-muted',
                    borderColor: 'border-border',
                };
            case 'IN_PROGRESS':
                return {
                    label: 'In Progress',
                    variant: 'warning' as const,
                    icon: Clock,
                    color: 'text-amber-600',
                    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
                    borderColor: 'border-amber-200 dark:border-amber-800',
                };
            case 'COMPLETED':
                return {
                    label: 'Completed',
                    variant: 'default' as const,
                    icon: CheckCircle2,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
                    borderColor: 'border-blue-200 dark:border-blue-800',
                };
            case 'PASSED':
                return {
                    label: 'Passed',
                    variant: 'success' as const,
                    icon: Trophy,
                    color: 'text-green-600',
                    bgColor: 'bg-green-100 dark:bg-green-900/30',
                    borderColor: 'border-green-200 dark:border-green-800',
                };
            case 'FAILED':
                return {
                    label: 'Failed',
                    variant: 'destructive' as const,
                    icon: XCircle,
                    color: 'text-red-600',
                    bgColor: 'bg-red-100 dark:bg-red-900/30',
                    borderColor: 'border-red-200 dark:border-red-800',
                };
            case 'TIMED_OUT':
                return {
                    label: 'Timed Out',
                    variant: 'destructive' as const,
                    icon: Timer,
                    color: 'text-red-600',
                    bgColor: 'bg-red-100 dark:bg-red-900/30',
                    borderColor: 'border-red-200 dark:border-red-800',
                };
            default:
                return {
                    label: 'Unknown',
                    variant: 'outline' as const,
                    icon: FileQuestion,
                    color: 'text-muted-foreground',
                    bgColor: 'bg-muted',
                    borderColor: 'border-border',
                };
        }
    };

    const statusConfig = getStatusConfig();
    const StatusIcon = statusConfig.icon;

    // Calculate score display for best attempt
    const getScoreDisplay = () => {
        if (!bestAttempt || bestAttempt.score === null) return null;

        const score = bestAttempt.score;
        const maxScore = quiz.max_score;
        const percentage = calculatePercentage(score, maxScore);
        const scoreColorClass = getScoreColor(percentage);

        let bgColor = 'bg-green-100 dark:bg-green-900/30';
        let borderColor = 'border-green-200 dark:border-green-800';
        let textColor = 'text-green-600';

        if (scoreColorClass === 'destructive') {
            bgColor = 'bg-red-100 dark:bg-red-900/30';
            borderColor = 'border-red-200 dark:border-red-800';
            textColor = 'text-red-600';
        } else if (scoreColorClass === 'warning') {
            bgColor = 'bg-amber-100 dark:bg-amber-900/30';
            borderColor = 'border-amber-200 dark:border-amber-800';
            textColor = 'text-amber-600';
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

    // Determine primary action
    const getPrimaryAction = () => {
        if (inProgressAttempt) {
            return {
                label: 'Continue Quiz',
                icon: Play,
                onClick: () => onStartQuiz(quiz, inProgressAttempt),
                variant: 'default' as const,
            };
        }

        if (attemptability.canAttempt && remainingAttempts > 0) {
            const isRetry = completedAttempts.length > 0;
            return {
                label: isRetry ? 'Retry Quiz' : 'Start Quiz',
                icon: isRetry ? RotateCcw : Play,
                onClick: () => onStartQuiz(quiz),
                variant: 'default' as const,
            };
        }

        if (bestAttempt) {
            return {
                label: 'View Results',
                icon: Eye,
                onClick: () => onViewResults(quiz, bestAttempt.id),
                variant: 'outline' as const,
            };
        }

        return {
            label: 'View Details',
            icon: Eye,
            onClick: () => onViewDetails(quiz.id),
            variant: 'outline' as const,
        };
    };

    const primaryAction = getPrimaryAction();
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
                            <h3 className="font-semibold text-sm truncate group-hover:text-brand-primary transition-colors">
                                {quiz.title}
                            </h3>
                            {quiz.class?.class_name && (
                                <p className="text-xs text-muted-foreground truncate">
                                    {quiz.class.class_name} • {quiz.class.subject}
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
                        <Award className="h-3.5 w-3.5 text-amber-500" />
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
                            <span className="text-primary font-medium">{availabilityStatus.timeRemaining}</span>
                        </div>
                    )}
                </div>

                {/* Attempt Reason (if cannot attempt) */}
                {!attemptability.canAttempt && attemptability.reason && (
                    <div className="flex items-center gap-1.5 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{attemptability.reason}</span>
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-0 flex items-center gap-2">
                <Button
                    variant={primaryAction.variant}
                    size="sm"
                    onClick={primaryAction.onClick}
                    className="flex-1"
                    disabled={!attemptability.canAttempt && !bestAttempt && studentStatus !== 'NOT_STARTED'}
                >
                    <ActionIcon className="h-3.5 w-3.5 mr-1.5" />
                    {primaryAction.label}
                </Button>
                {bestAttempt && attemptability.canAttempt && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewResults(quiz, bestAttempt.id)}
                    >
                        <Eye className="h-3.5 w-3.5" />
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
