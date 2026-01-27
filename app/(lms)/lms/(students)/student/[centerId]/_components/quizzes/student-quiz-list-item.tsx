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
    /** Callback when view details is clicked */
    onViewDetails: (quizId: string) => void;
}

export function StudentQuizListItem({
    quiz,
    studentAttempts = [],
    onViewDetails,
}: StudentQuizListItemProps) {
    // Check availability status
    const availabilityStatus = getQuizAvailabilityStatus(quiz.available_from, quiz.available_to);

    // Determine if quiz is currently available (within time window)
    const isCurrentlyAvailable = availabilityStatus.status === 'active';
    const isUpcoming = availabilityStatus.status === 'upcoming';
    const hasEnded = availabilityStatus.status === 'ended';

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

    // Check if student can attempt (includes availability check)
    const attemptability = canAttemptQuiz(quiz, studentAttempts);
    const remainingAttempts = getRemainingAttempts(quiz.max_attempts, studentAttempts);

    // Get in-progress attempt if any
    const inProgressAttempt = studentAttempts.find(a => a.attempt_status === 'IN_PROGRESS');

    // Get status display configuration with brand colors
    const getStatusConfig = () => {
        switch (studentStatus) {
            case 'NOT_STARTED':
                if (isUpcoming) {
                    return {
                        label: 'Upcoming',
                        variant: 'secondary' as const,
                        icon: Clock,
                        color: 'text-brand-secondary',
                        bgColor: 'bg-brand-secondary/10',
                    };
                }
                if (hasEnded) {
                    return {
                        label: 'Missed',
                        variant: 'destructive' as const,
                        icon: XCircle,
                        color: 'text-destructive',
                        bgColor: 'bg-destructive/10',
                    };
                }
                return {
                    label: 'Available',
                    variant: 'default' as const,
                    icon: Play,
                    color: 'text-brand-primary',
                    bgColor: 'bg-brand-primary/10',
                };
            case 'IN_PROGRESS':
                return {
                    label: 'In Progress',
                    variant: 'warning' as const,
                    icon: Clock,
                    color: 'text-warning',
                    bgColor: 'bg-warning/10',
                };
            case 'COMPLETED':
                return {
                    label: 'Completed',
                    variant: 'secondary' as const,
                    icon: CheckCircle2,
                    color: 'text-brand-secondary',
                    bgColor: 'bg-brand-secondary/10',
                };
            case 'PASSED':
                return {
                    label: 'Passed',
                    variant: 'success' as const,
                    icon: Trophy,
                    color: 'text-success',
                    bgColor: 'bg-success/10',
                };
            case 'FAILED':
                return {
                    label: 'Failed',
                    variant: 'destructive' as const,
                    icon: XCircle,
                    color: 'text-destructive',
                    bgColor: 'bg-destructive/10',
                };
            case 'TIMED_OUT':
                return {
                    label: 'Timed Out',
                    variant: 'destructive' as const,
                    icon: Timer,
                    color: 'text-destructive',
                    bgColor: 'bg-destructive/10',
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

    // Action button always shows View Details - student starts quiz from details page
    const actionButton = (
        <Button variant="default" size="sm" onClick={() => onViewDetails(quiz.id)} className="gap-1.5 h-8 px-3">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">View Details</span>
        </Button>
    );

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
                            <Award className="h-3.5 w-3.5 text-brand-highlight flex-shrink-0" />
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
                {actionButton}
            </ItemActions>
        </Item>
    );
}
