/**
 * Student Quiz Start Page
 * 
 * Confirmation page before starting a quiz attempt
 * Route: /lms/student/[centerId]/quizzes/[quizId]/start
 * 
 * Features:
 * - Shows quiz details and rules
 * - Validates availability before allowing start
 * - Creates new attempt and redirects to attempt page
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentContext } from '../../../layout';
import { useAuth } from '@/hooks/use-auth-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    AlertCircle,
    ArrowLeft,
    Clock,
    FileQuestion,
    Timer,
    Target,
    Award,
    RotateCcw,
    Play,
    Calendar,
    CheckCircle2,
    AlertTriangle,
    Info,
} from 'lucide-react';
import { showErrorToast, showWarningToast } from '@/lib/toast';

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
    canAttemptQuiz,
    getRemainingAttempts,
    calculatePercentage,
} from '@/lib/branch-system/quiz';
import { cn } from '@/lib/utils';

interface QuizStartPageProps {
    params: {
        centerId: string;
        quizId: string;
    };
}

export default function QuizStartPage({ params }: QuizStartPageProps) {
    const { centerId, quizId } = params;
    const router = useRouter();
    const { isLoading: contextLoading } = useStudentContext();
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

    // Local state
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
    const [isStarting, setIsStarting] = useState(false);
    const [agreedToRules, setAgreedToRules] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Fetch quiz data
    const loadQuizData = useCallback(async () => {
        if (!userId || !quizId) return;

        try {
            await fetchQuizById(quizId, true);
            await fetchStudentAttempts(quizId, userId);
            setIsInitialized(true);
        } catch (err) {
            console.error('Error loading quiz:', err);
        }
    }, [userId, quizId, fetchQuizById, fetchStudentAttempts]);

    useEffect(() => {
        loadQuizData();
    }, [loadQuizData]);

    // Update quiz from store
    useEffect(() => {
        if (selectedQuiz) {
            setQuiz(selectedQuiz);
        }
    }, [selectedQuiz]);

    // Update attempts from store
    useEffect(() => {
        if (studentAttempts) {
            setAttempts(studentAttempts);
        }
    }, [studentAttempts]);

    // Check for existing in-progress attempt and redirect
    useEffect(() => {
        if (isInitialized && attempts.length > 0) {
            const inProgressAttempt = attempts.find(a => a.attempt_status === 'IN_PROGRESS');
            if (inProgressAttempt) {
                // Redirect to continue the existing attempt
                router.replace(`/lms/student/${centerId}/quizzes/${quizId}/attempt`);
            }
        }
    }, [isInitialized, attempts, centerId, quizId, router]);

    // Calculate availability and attemptability
    const availabilityStatus = quiz ? getQuizAvailabilityStatus(quiz.available_from, quiz.available_to) : null;
    const attemptability = quiz ? canAttemptQuiz(quiz, attempts) : { canAttempt: false, reason: 'Loading...' };
    const remainingAttempts = quiz ? getRemainingAttempts(quiz.max_attempts, attempts) : 0;

    // Check if quiz is currently available (within time window)
    const isCurrentlyAvailable = availabilityStatus?.status === 'active';
    const isUpcoming = availabilityStatus?.status === 'upcoming';
    const hasEnded = availabilityStatus?.status === 'ended';

    // Start quiz handler
    const handleStartQuiz = async () => {
        if (!quiz || !userId || !attemptability.canAttempt || !isCurrentlyAvailable) {
            if (!isCurrentlyAvailable) {
                if (isUpcoming && quiz) {
                    showWarningToast(`Quiz will be available on ${formatDateTime(quiz.available_from, 'full')}`);
                } else if (hasEnded) {
                    showErrorToast('This quiz is no longer available');
                }
            }
            return;
        }

        setIsStarting(true);
        try {
            const result = await startAttempt({
                quiz_id: quizId,
                student_id: userId,
                class_id: quiz.class_id,
            });

            if (result) {
                // Navigate to attempt page
                router.push(`/lms/student/${centerId}/quizzes/${quizId}/attempt`);
            } else {
                showErrorToast('Failed to start quiz. Please try again.');
            }
        } catch (err) {
            console.error('Error starting quiz:', err);
            showErrorToast('An error occurred while starting the quiz');
        } finally {
            setIsStarting(false);
        }
    };

    // Loading state
    if (contextLoading || loading.quiz || !isInitialized) {
        return (
            <div className="space-y-6 max-w-2xl mx-auto">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-48 rounded-2xl" />
            </div>
        );
    }

    // Error state
    if (error?.message || !quiz) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error?.message || 'Quiz not found'}</AlertDescription>
                </Alert>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{quiz.title}</h1>
                    {quiz.class?.class_name && (
                        <p className="text-muted-foreground">{quiz.class.class_name}</p>
                    )}
                </div>
            </div>

            {/* Availability Warning */}
            {!isCurrentlyAvailable && (
                <Alert variant={hasEnded ? 'destructive' : 'default'} className="border-2">
                    {isUpcoming ? (
                        <>
                            <Clock className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Quiz not yet available.</strong> This quiz will open on{' '}
                                <span className="font-semibold">{formatDateTime(quiz.available_from, 'full')}</span>.
                                Please come back at that time.
                            </AlertDescription>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Quiz has ended.</strong> This quiz was available until{' '}
                                <span className="font-semibold">{formatDateTime(quiz.available_to, 'full')}</span>.
                            </AlertDescription>
                        </>
                    )}
                </Alert>
            )}

            {/* Quiz Details Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileQuestion className="h-5 w-5 text-brand-primary" />
                        Quiz Details
                    </CardTitle>
                    {quiz.description && (
                        <CardDescription>{quiz.description}</CardDescription>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                            <FileQuestion className="h-5 w-5 text-brand-primary mb-1" />
                            <span className="text-lg font-bold">{quiz.total_questions}</span>
                            <span className="text-xs text-muted-foreground">Questions</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                            <Timer className="h-5 w-5 text-amber-600 mb-1" />
                            <span className="text-lg font-bold">{formatTimeMinutes(quiz.time_limit_minutes)}</span>
                            <span className="text-xs text-muted-foreground">Time Limit</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                            <Target className="h-5 w-5 text-blue-600 mb-1" />
                            <span className="text-lg font-bold">{quiz.max_score}</span>
                            <span className="text-xs text-muted-foreground">Total Points</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                            <RotateCcw className="h-5 w-5 text-purple-600 mb-1" />
                            <span className="text-lg font-bold">{remainingAttempts}/{quiz.max_attempts}</span>
                            <span className="text-xs text-muted-foreground">Attempts Left</span>
                        </div>
                    </div>

                    {/* Passing Score */}
                    {quiz.passing_score !== null && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <Award className="h-5 w-5 text-amber-600" />
                            <span className="text-sm">
                                Passing Score: <strong>{quiz.passing_score}/{quiz.max_score}</strong>
                                {' '}({Math.round(calculatePercentage(quiz.passing_score, quiz.max_score))}%)
                            </span>
                        </div>
                    )}

                    {/* Availability Times */}
                    <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Opens: <strong>{formatDateTime(quiz.available_from, 'full')}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Closes: <strong>{formatDateTime(quiz.available_to, 'full')}</strong></span>
                        </div>
                        {availabilityStatus?.timeRemaining && isCurrentlyAvailable && (
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-brand-primary" />
                                <span className="text-brand-primary font-medium">
                                    Time remaining: {availabilityStatus.timeRemaining}
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Rules Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-600" />
                        Quiz Rules
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                            <span>You have <strong>{formatTimeMinutes(quiz.time_limit_minutes)}</strong> to complete this quiz.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                            <span>The quiz will auto-submit when time runs out.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                            <span>You can navigate between questions using the question numbers.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                            <span>Your answers are saved automatically as you select them.</span>
                        </li>
                        {quiz.max_attempts > 1 && (
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                <span>You have <strong>{remainingAttempts}</strong> attempt(s) remaining.</span>
                            </li>
                        )}
                        {quiz.show_correct_answers && (
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                <span>Correct answers will be shown after submission.</span>
                            </li>
                        )}
                    </ul>

                    <Separator className="my-4" />

                    {/* Agreement Checkbox */}
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="agree-rules"
                            checked={agreedToRules}
                            onCheckedChange={(checked) => setAgreedToRules(checked === true)}
                            disabled={!isCurrentlyAvailable}
                        />
                        <Label htmlFor="agree-rules" className="text-sm cursor-pointer leading-relaxed">
                            I understand the rules and am ready to start the quiz. I will not leave or refresh the page during the quiz.
                        </Label>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-3">
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </Button>
                    <Button
                        className="w-full sm:flex-1"
                        onClick={handleStartQuiz}
                        disabled={!agreedToRules || isStarting || !attemptability.canAttempt || !isCurrentlyAvailable}
                    >
                        {isStarting ? (
                            <>
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                Starting...
                            </>
                        ) : !isCurrentlyAvailable ? (
                            <>
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                {isUpcoming ? 'Not Available Yet' : 'Quiz Ended'}
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Start Quiz
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>

            {/* Cannot Attempt Warning */}
            {!attemptability.canAttempt && attemptability.reason && isCurrentlyAvailable && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{attemptability.reason}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}
