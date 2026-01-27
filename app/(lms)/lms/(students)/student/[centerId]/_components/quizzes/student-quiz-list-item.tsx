/**
 * Student Quiz List Item Component
 * 
 * List view for displaying individual quizzes for students
 * Compact design with key information and actions
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    Clock,
    Eye,
    Play,
    FileQuestion,
    Timer,
    Target,
    Award,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Trophy,
} from 'lucide-react';
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
} from '@/lib/branch-system/quiz';

export interface StudentQuizListItemProps {
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

export function StudentQuizListItem({
    quiz,
    studentAttempts = [],
    onStartQuiz,
    onViewResults,
    onViewDetails,
}: StudentQuizListItemProps) {
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
                    };
                }
                if (availabilityStatus.status === 'ended') {
                    return {
                        label: 'Missed',
                        variant: 'destructive' as const,
                        icon: XCircle,
                        color: 'text-red-600',
                        bgColor: 'bg-red-100 dark:bg-red-900/30',
                    };
                }
                return {
                    label: 'Not Started',
                    variant: 'outline' as const,
                    icon: Play,
                    color: 'text-muted-foreground',
                    bgColor: 'bg-muted',
                };
            case 'IN_PROGRESS':
                return {
                    label: 'In Progress',
                    variant: 'warning' as const,
                    icon: Clock,
                    color: 'text-amber-600',
                    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
                };
            case 'COMPLETED':
                return {
                    label: 'Completed',
                    variant: 'default' as const,
                    icon: CheckCircle2,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
                };
            case 'PASSED':
                return {
                    label: 'Passed',
                    variant: 'success' as const,
                    icon: Trophy,
                    color: 'text-green-600',
                    bgColor: 'bg-green-100 dark:bg-green-900/30',
                };
            case 'FAILED':
                return {
                    label: 'Failed',
                    variant: 'destructive' as const,
                    icon: XCircle,
                    color: 'text-red-600',
                    bgColor: 'bg-red-100 dark:bg-red-900/30',
                };
            case 'TIMED_OUT':
                return {
                    label: 'Timed Out',
                    variant: 'destructive' as const,
                    icon: Timer,
                    color: 'text-red-600',
                    bgColor: 'bg-red-100 dark:bg-red-900/30',
                };
            default:
                return {
                    label: 'Unknown',
                    variant: 'outline' as const,
                    icon: FileQuestion,
                    color: 'text-muted-foreground',
                    bgColor: 'bg-muted',
                };
        }
    };

    const statusConfig = getStatusConfig();
    const StatusIcon = statusConfig.icon;

    // Get best score display
    const getBestScoreText = () => {
        if (!bestAttempt || bestAttempt.score === null) return null;
        return formatScore(bestAttempt.score, quiz.max_score, true);
    };

    // Determine primary action
    const handlePrimaryAction = () => {
        if (inProgressAttempt) {
            onStartQuiz(quiz, inProgressAttempt);
        } else if (attemptability.canAttempt && remainingAttempts > 0) {
            onStartQuiz(quiz);
        } else if (bestAttempt) {
            onViewResults(quiz, bestAttempt.id);
        } else {
            onViewDetails(quiz.id);
        }
    };

    const getActionButton = () => {
        if (inProgressAttempt) {
            return (
                <Button variant="default" size="sm" onClick={() => onStartQuiz(quiz, inProgressAttempt)} className="gap-1.5 h-8 px-3">
                    <Play className="h-4 w-4" />
                    <span className="hidden sm:inline">Continue</span>
                </Button>
            );
        }

        if (attemptability.canAttempt && remainingAttempts > 0) {
            const isRetry = completedAttempts.length > 0;
            return (
                <Button variant="default" size="sm" onClick={() => onStartQuiz(quiz)} className="gap-1.5 h-8 px-3">
                    {isRetry ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    <span className="hidden sm:inline">{isRetry ? 'Retry' : 'Start'}</span>
                </Button>
            );
        }

        if (bestAttempt) {
            return (
                <Button variant="outline" size="sm" onClick={() => onViewResults(quiz, bestAttempt.id)} className="gap-1.5 h-8 px-3">
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">Results</span>
                </Button>
            );
        }

        return (
            <Button variant="ghost" size="sm" onClick={() => onViewDetails(quiz.id)} className="gap-1.5 h-8 px-3">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">View</span>
            </Button>
        );
    };

    const bestScoreText = getBestScoreText();

    return (
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
                    statusConfig.bgColor
                )}>
                    <StatusIcon className={cn('h-5 w-5 sm:h-6 sm:w-6', statusConfig.color)} />
                </div>
            </ItemMedia>

            {/* Content */}
            <ItemContent className="min-w-0 flex-1">
                <ItemTitle className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate transition-colors duration-200 group-hover/item:text-primary">
                        {quiz.title}
                    </span>
                    <Badge
                        variant={statusConfig.variant}
                        className="text-xs font-medium flex-shrink-0"
                    >
                        {statusConfig.label}
                    </Badge>
                </ItemTitle>
                <ItemDescription>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground mt-1">
                        {quiz.class?.class_name && (
                            <span className="flex items-center gap-1.5 truncate">
                                <FileQuestion className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{quiz.class.class_name}</span>
                            </span>
                        )}
                        <span className="flex items-center gap-1.5">
                            <Timer className="h-3.5 w-3.5 flex-shrink-0" />
                            {formatTimeMinutes(quiz.time_limit_minutes)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Target className="h-3.5 w-3.5 flex-shrink-0" />
                            {quiz.total_questions} Qs • {quiz.max_score} pts
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                            {formatDateTime(quiz.available_to, 'short')}
                        </span>
                    </div>
                    {/* Score Display */}
                    {bestScoreText && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                            <Award className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                            <span className="font-medium">Best: {bestScoreText}</span>
                            <span className="text-muted-foreground">
                                • {remainingAttempts}/{quiz.max_attempts} attempts left
                            </span>
                        </div>
                    )}
                    {!bestScoreText && remainingAttempts < quiz.max_attempts && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                            <RotateCcw className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{remainingAttempts}/{quiz.max_attempts} attempts left</span>
                        </div>
                    )}
                </ItemDescription>
            </ItemContent>

            {/* Actions */}
            <ItemActions className="flex items-center gap-1">
                {getActionButton()}
                {bestAttempt && attemptability.canAttempt && remainingAttempts > 0 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onViewResults(quiz, bestAttempt.id)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                )}
            </ItemActions>
        </Item>
    );
}
