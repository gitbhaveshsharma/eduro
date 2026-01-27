/**
 * Student Quiz Detail Page
 * 
 * Shows quiz information before starting
 * Route: /lms/student/[centerId]/quizzes/[quizId]
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentContext } from '../../layout';
import { useAuth } from '@/hooks/use-auth-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
    AlertCircle,
    ArrowLeft,
    Clock,
    FileQuestion,
    Timer,
    Target,
    Award,
    Play,
    RotateCcw,
    Calendar,
    CheckCircle2,
    XCircle,
    Trophy,
    Info,
    ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    showErrorToast,
    showSuccessToast,
} from '@/lib/toast';

// Quiz imports
import {
    useQuizStore,
    useSelectedQuiz,
    useQuizLoading,
    useQuizError,
} from '@/lib/branch-system/stores/quiz.store';

import type { Quiz, QuizAttempt } from '@/lib/branch-system/types/quiz.types';
import {
    formatDateTime,
    formatTimeMinutes,
    getQuizAvailabilityStatus,
    determineStudentQuizStatus,
    canAttemptQuiz,
    getRemainingAttempts,
    calculatePercentage,
    formatScore,
    StudentQuizStatus,
} from '@/lib/branch-system/quiz';

interface StudentQuizDetailPageProps {
    params: {
        centerId: string;
        quizId: string;
    };
}

export default function StudentQuizDetailPage({ params }: StudentQuizDetailPageProps) {
    const { centerId, quizId } = params;
    const router = useRouter();
    const { coachingCenter, isLoading: contextLoading, error: contextError } = useStudentContext();
    const { userId } = useAuth();

    // Store hooks
    const selectedQuiz = useSelectedQuiz();
    const loading = useQuizLoading();
    const error = useQuizError();

    const {
        fetchQuizById,
        fetchStudentAttempts,
        startAttempt,
        studentAttempts,
        clearError,
    } = useQuizStore();

    const [localAttempts, setLocalAttempts] = useState<QuizAttempt[]>([]);
    const [isStarting, setIsStarting] = useState(false);

    // Fetch quiz and attempts
    const fetchData = useCallback(async () => {
        if (!quizId || !userId) return;

        await fetchQuizById(quizId, true);
        await fetchStudentAttempts(quizId, userId);
    }, [quizId, userId, fetchQuizById, fetchStudentAttempts]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (studentAttempts) {
            setLocalAttempts(studentAttempts);
        }
    }, [studentAttempts]);

    // Get quiz data
    const quiz = selectedQuiz;

    // Calculations
    const availabilityStatus = quiz
        ? getQuizAvailabilityStatus(quiz.available_from, quiz.available_to)
        : null;

    const latestAttempt = localAttempts.length > 0
        ? localAttempts.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0]
        : null;

    const completedAttempts = localAttempts.filter(a =>
        a.attempt_status === 'COMPLETED' || a.attempt_status === 'TIMEOUT'
    );

    const bestAttempt = completedAttempts.length > 0
        ? completedAttempts.reduce((best, current) =>
            (current.score ?? 0) > (best.score ?? 0) ? current : best
        )
        : null;

    const studentStatus = quiz && latestAttempt
        ? determineStudentQuizStatus(latestAttempt, quiz)
        : StudentQuizStatus.NOT_STARTED;

    const attemptability = quiz
        ? canAttemptQuiz(quiz, localAttempts)
        : { canAttempt: false, reason: 'Quiz not loaded' };

    const remainingAttempts = quiz
        ? getRemainingAttempts(quiz.max_attempts, localAttempts)
        : 0;

    const inProgressAttempt = localAttempts.find(a => a.attempt_status === 'IN_PROGRESS');

    // Check if quiz is currently available (within time window)
    const isCurrentlyAvailable = availabilityStatus?.status === 'active';
    const isUpcoming = availabilityStatus?.status === 'upcoming';
    const hasEnded = availabilityStatus?.status === 'ended';

    // Handle start quiz
    const handleStartQuiz = async () => {
        if (!quiz || !userId) return;

        if (inProgressAttempt) {
            // Resume existing attempt
            router.push(`/lms/student/${centerId}/quizzes/${quizId}/attempt/${inProgressAttempt.id}`);
            return;
        }

        setIsStarting(true);
        try {
            const result = await startAttempt({
                quiz_id: quiz.id,
                student_id: userId,
                class_id: quiz.class_id,
            });

            if (result) {
                showSuccessToast('Quiz started! Good luck!');
                // Navigate to attempt page - result should contain attempt ID
                router.push(`/lms/student/${centerId}/quizzes/${quizId}/attempt`);
            } else {
                showErrorToast('Failed to start quiz');
            }
        } catch (err) {
            console.error('Error starting quiz:', err);
            showErrorToast('An error occurred while starting the quiz');
        } finally {
            setIsStarting(false);
        }
    };

    // Handle view results
    const handleViewResults = (attemptId: string) => {
        router.push(`/lms/student/${centerId}/quizzes/${quizId}/results/${attemptId}`);
    };

    // Loading state
    if (contextLoading || loading.quiz || !quiz) {
        return (
            <div className="space-y-6">
                {/* Back button skeleton */}
                <Skeleton className="h-9 w-40" />

                {/* Header skeleton */}
                <div className="flex items-start gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>

                {/* Info cards skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>

                {/* Content skeleton */}
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
            </div>
        );
    }

    // Error state
    if (contextError || error?.message) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {contextError || error?.message || 'Failed to load quiz'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Quiz not found
    if (!quiz) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">Quiz Not Found</h2>
                <p className="text-muted-foreground mt-2">
                    The quiz you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="gap-2 -ml-2 hover:bg-brand-secondary/10 hover:text-brand-primary transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Quizzes
            </Button>

            {/* Title and Status */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border bg-brand-primary/10 border-brand-primary/30">
                        <FileQuestion className="h-6 w-6 text-brand-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-primary">
                            {quiz.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-secondary">
                            {quiz.class?.class_name && (
                                <span>{quiz.class.class_name}</span>
                            )}
                            {quiz.class?.subject && (
                                <>
                                    <span>•</span>
                                    <span>{quiz.class.subject}</span>
                                </>
                            )}
                            {localAttempts.length > 0 && (
                                <>
                                    <span>•</span>
                                    <span className="font-medium">
                                        {localAttempts.length} attempt{localAttempts.length !== 1 ? 's' : ''} taken
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <Badge
                    variant={
                        availabilityStatus?.status === 'active' ? 'default' :
                            availabilityStatus?.status === 'upcoming' ? 'secondary' : 'destructive'
                    }
                    className="px-3 py-1 text-sm font-medium"
                >
                    {availabilityStatus?.label}
                </Badge>
            </div>

            {/* Key Info Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Questions */}
                <div className="p-4 rounded-xl border border-brand-primary/20 bg-card hover:border-brand-primary/40 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-2">
                        <FileQuestion className="h-4 w-4 text-brand-primary" />
                        <span className="text-xs text-secondary">Questions</span>
                    </div>
                    <p className="font-semibold mt-1.5 text-primary">
                        {quiz.total_questions}
                    </p>
                </div>

                {/* Time Limit */}
                <div className="p-4 rounded-xl border bg-card hover:shadow-sm transition-all">
                    <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-amber-600" />
                        <span className="text-xs text-secondary">Time Limit</span>
                    </div>
                    <p className="font-semibold mt-1.5 text-primary">
                        {formatTimeMinutes(quiz.time_limit_minutes)}
                    </p>
                </div>

                {/* Max Score */}
                <div className="p-4 rounded-xl border border-brand-secondary/20 bg-card hover:border-brand-secondary/40 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-brand-secondary" />
                        <span className="text-xs text-secondary">Max Score</span>
                    </div>
                    <p className="font-semibold mt-1.5 text-primary">
                        {quiz.max_score} points
                    </p>
                </div>

                {/* Attempts */}
                <div className="p-4 rounded-xl border bg-card  hover:shadow-sm transition-all">
                    <div className="flex items-center gap-2">
                        <RotateCcw className="h-4 w-4 text-purple-600" />
                        <span className="text-xs text-secondary">Attempts Left</span>
                    </div>
                    <p className="font-semibold mt-1.5 text-primary">
                        {remainingAttempts}/{quiz.max_attempts}
                    </p>
                </div>
            </div>

            {/* Best Score Card (if attempted) */}
            {bestAttempt && bestAttempt.score !== null && (
                <Card className="border-2 border-amber-500/40 bg-amber-500/5">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-amber-500" />
                            Your Best Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-bold text-amber-600">
                                        {bestAttempt.score}
                                    </p>
                                    <span className="text-xl text-secondary font-medium">
                                        /{quiz.max_score}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <p className="text-lg font-semibold text-amber-600">
                                        {Math.round(calculatePercentage(bestAttempt.score, quiz.max_score))}%
                                    </p>
                                    {bestAttempt.passed !== null && (
                                        <Badge variant={bestAttempt.passed ? 'default' : 'destructive'}>
                                            {bestAttempt.passed ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                            {bestAttempt.passed ? 'Passed' : 'Failed'}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => handleViewResults(bestAttempt.id)}
                            >
                                View Results
                            </Button>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-4">
                            <Progress
                                value={calculatePercentage(bestAttempt.score, quiz.max_score)}
                                className="h-2"
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quiz Details Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="h-5 w-5 " />
                        Quiz Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Description */}
                    {quiz.description && (
                        <div>
                            <h4 className="font-medium mb-2 text-sm">Description</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {quiz.description}
                            </p>
                        </div>
                    )}

                    {quiz.description && (quiz.passing_score !== null || quiz.instructions) && <Separator />}

                    {/* Instructions */}
                    {quiz.instructions && (
                        <div>
                            <h4 className="font-medium mb-2 text-sm flex items-center gap-2">
                                <ClipboardList className="h-4 w-4" />
                                Instructions
                            </h4>
                            <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-lg">
                                {quiz.instructions}
                            </div>
                        </div>
                    )}

                    {(quiz.instructions || quiz.description) && (quiz.passing_score !== null || quiz.available_from) && <Separator />}

                    {/* Passing Score */}
                    {quiz.passing_score !== null && (
                        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <Award className="h-5 w-5 text-amber-600 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                    Passing Score Required
                                </p>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                                    <strong>{quiz.passing_score}/{quiz.max_score}</strong> points
                                    {' '}({Math.round(calculatePercentage(quiz.passing_score, quiz.max_score))}%)
                                </p>
                            </div>
                        </div>
                    )}

                    {quiz.passing_score !== null && <Separator />}

                    {/* Availability Times */}
                    <div className="space-y-3">
                        <div className="flex items-start gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground">Available From</p>
                                <p className="font-medium">{formatDateTime(quiz.available_from, 'long')}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground">Available Until</p>
                                <p className="font-medium">{formatDateTime(quiz.available_to, 'long')}</p>
                            </div>
                        </div>
                        {availabilityStatus?.timeRemaining && isCurrentlyAvailable && (
                            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/30">
                                <Clock className="h-4 w-4 text-brand-primary" />
                                <span className="text-sm text-brand-primary font-medium">
                                    Time remaining: {availabilityStatus.timeRemaining}
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Attempt History */}
            {completedAttempts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Attempt History
                        </CardTitle>
                        <CardDescription>
                            {completedAttempts.length} attempt{completedAttempts.length !== 1 ? 's' : ''} completed
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {completedAttempts.map((attempt) => (
                                <div
                                    key={attempt.id}
                                    className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-lg border transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-sm font-semibold text-brand-primary">
                                            #{attempt.attempt_number}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">
                                                {formatScore(attempt.score, quiz.max_score, true)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDateTime(attempt.submitted_at || attempt.started_at, 'short')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {attempt.passed !== null && (
                                            <Badge variant={attempt.passed ? 'default' : 'destructive'} className="text-xs">
                                                {attempt.passed ? 'Passed' : 'Failed'}
                                            </Badge>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewResults(attempt.id)}
                                        >
                                            View
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
                {attemptability.canAttempt && remainingAttempts > 0 && isCurrentlyAvailable && (
                    <Button
                        size="lg"
                        onClick={handleStartQuiz}
                        disabled={isStarting}
                        className="w-full sm:w-auto"
                    >
                        {isStarting ? (
                            <>
                                <Clock className="h-5 w-5 mr-2 animate-spin" />
                                Starting...
                            </>
                        ) : inProgressAttempt ? (
                            <>
                                <Play className="h-5 w-5 mr-2" />
                                Continue Quiz
                            </>
                        ) : completedAttempts.length > 0 ? (
                            <>
                                <RotateCcw className="h-5 w-5 mr-2" />
                                Retry Quiz ({remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} left)
                            </>
                        ) : (
                            <>
                                <Play className="h-5 w-5 mr-2" />
                                Start Quiz
                            </>
                        )}
                    </Button>
                )}

                {!isCurrentlyAvailable && (
                    <Alert variant={hasEnded ? 'destructive' : 'default'}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {isUpcoming
                                ? `This quiz will be available starting ${formatDateTime(quiz.available_from, 'long')}`
                                : `This quiz ended on ${formatDateTime(quiz.available_to, 'long')}`}
                        </AlertDescription>
                    </Alert>
                )}

                {!attemptability.canAttempt && attemptability.reason && isCurrentlyAvailable && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{attemptability.reason}</AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
    );
}
