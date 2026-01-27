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
} from 'lucide-react';
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
            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-64" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-48 rounded-2xl" />
            </div>
        );
    }

    // Error state
    if (contextError || error?.message) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {contextError || error?.message || 'Failed to load quiz'}
                    </AlertDescription>
                </Alert>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="gap-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Quizzes
            </Button>

            {/* Quiz Header Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <FileQuestion className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">{quiz.title}</CardTitle>
                                <CardDescription>
                                    {quiz.class?.class_name} • {quiz.class?.subject}
                                </CardDescription>
                            </div>
                        </div>
                        <Badge
                            variant={
                                availabilityStatus?.status === 'active' ? 'success' :
                                availabilityStatus?.status === 'upcoming' ? 'secondary' : 'destructive'
                            }
                        >
                            {availabilityStatus?.label}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Quiz Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                            <FileQuestion className="h-5 w-5 text-muted-foreground mb-1" />
                            <span className="text-2xl font-bold">{quiz.total_questions}</span>
                            <span className="text-xs text-muted-foreground">Questions</span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                            <Timer className="h-5 w-5 text-muted-foreground mb-1" />
                            <span className="text-2xl font-bold">{formatTimeMinutes(quiz.time_limit_minutes)}</span>
                            <span className="text-xs text-muted-foreground">Time Limit</span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                            <Target className="h-5 w-5 text-muted-foreground mb-1" />
                            <span className="text-2xl font-bold">{quiz.max_score}</span>
                            <span className="text-xs text-muted-foreground">Max Score</span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                            <RotateCcw className="h-5 w-5 text-muted-foreground mb-1" />
                            <span className="text-2xl font-bold">{remainingAttempts}/{quiz.max_attempts}</span>
                            <span className="text-xs text-muted-foreground">Attempts Left</span>
                        </div>
                    </div>

                    {/* Availability Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>Available from: {formatDateTime(quiz.available_from, 'long')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>Until: {formatDateTime(quiz.available_to, 'long')}</span>
                        </div>
                    </div>

                    {/* Passing Score */}
                    {quiz.passing_score !== null && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <Award className="h-5 w-5 text-amber-600" />
                            <span className="text-sm">
                                Passing Score: <strong>{quiz.passing_score}/{quiz.max_score}</strong> ({Math.round(calculatePercentage(quiz.passing_score, quiz.max_score))}%)
                            </span>
                        </div>
                    )}

                    {/* Description */}
                    {quiz.description && (
                        <>
                            <Separator />
                            <div>
                                <h4 className="font-medium mb-2">Description</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {quiz.description}
                                </p>
                            </div>
                        </>
                    )}

                    {/* Instructions */}
                    {quiz.instructions && (
                        <>
                            <Separator />
                            <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <Info className="h-4 w-4" />
                                    Instructions
                                </h4>
                                <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                                    {quiz.instructions}
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Best Score Card (if attempted) */}
            {bestAttempt && bestAttempt.score !== null && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-amber-500" />
                            Your Best Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="text-4xl font-bold">
                                    {formatScore(bestAttempt.score, quiz.max_score, false)}
                                </div>
                                <div className="text-muted-foreground">
                                    <p className="text-sm">
                                        {Math.round(calculatePercentage(bestAttempt.score, quiz.max_score))}%
                                    </p>
                                    {bestAttempt.passed !== null && (
                                        <Badge variant={bestAttempt.passed ? 'success' : 'destructive'}>
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
                    </CardContent>
                </Card>
            )}

            {/* Attempt History */}
            {completedAttempts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Attempt History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {completedAttempts.map((attempt) => (
                                <div
                                    key={attempt.id}
                                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                            #{attempt.attempt_number}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {formatScore(attempt.score, quiz.max_score, true)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDateTime(attempt.submitted_at || attempt.started_at, 'short')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {attempt.passed !== null && (
                                            <Badge variant={attempt.passed ? 'success' : 'destructive'} className="text-xs">
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
            <div className="flex flex-col sm:flex-row gap-4">
                {attemptability.canAttempt && remainingAttempts > 0 && (
                    <Button
                        size="lg"
                        onClick={handleStartQuiz}
                        disabled={isStarting}
                        isLoading={isStarting}
                        className="flex-1"
                    >
                        {inProgressAttempt ? (
                            <>
                                <Play className="h-5 w-5 mr-2" />
                                Continue Quiz
                            </>
                        ) : completedAttempts.length > 0 ? (
                            <>
                                <RotateCcw className="h-5 w-5 mr-2" />
                                Retry Quiz
                            </>
                        ) : (
                            <>
                                <Play className="h-5 w-5 mr-2" />
                                Start Quiz
                            </>
                        )}
                    </Button>
                )}

                {!attemptability.canAttempt && attemptability.reason && (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{attemptability.reason}</AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
    );
}
