/**
 * Student Quiz Attempt Page - Secure Mode
 * 
 * The page where students take the quiz with security features:
 * - One question at a time fetching
 * - Fullscreen enforcement
 * - Tab switch detection
 * - Webcam verification (optional)
 * - Copy/paste prevention
 * 
 * Route: /lms/student/[centerId]/quizzes/[quizId]/attempt
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentContext } from '../../../layout';
import { useAuth } from '@/hooks/use-auth-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Clock,
    CheckCircle2,
    Send,
    AlertTriangle,
    FileQuestion,
    Loader2,
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    showErrorToast,
    showSuccessToast,
    showWarningToast,
} from '@/lib/toast';

// Quiz imports
import {
    useQuizStore,
    useActiveAttempt,
    useQuizLoading,
    useQuizError,
} from '@/lib/branch-system/stores/quiz.store';

import type { QuizQuestion, QuizAttempt, Quiz } from '@/lib/branch-system/types/quiz.types';
import {
    calculateRemainingTime,
    formatRemainingTime,
    optionsToArray,
    QuestionType,
} from '@/lib/branch-system/quiz';
import { cn } from '@/lib/utils';

// Security imports
import { useQuizSecurity } from '@/hooks/use-quiz-security';
import { QuizSecuritySetup } from '@/components/lms/quiz/quiz-security-setup';
import { QuizWebcamMonitor } from '@/components/lms/quiz/quiz-webcam-monitor';
import { QuizSecurityStatus } from '@/components/lms/quiz/quiz-security-status';

interface StudentQuizAttemptPageProps {
    params: {
        centerId: string;
        quizId: string;
    };
}

// Security configuration constants
const MAX_TAB_SWITCHES = 3;

export default function StudentQuizAttemptPage({ params }: StudentQuizAttemptPageProps) {
    const { centerId, quizId } = params;
    const router = useRouter();
    const { isLoading: contextLoading } = useStudentContext();
    const { userId } = useAuth();

    // Store hooks
    const activeAttempt = useActiveAttempt();
    const loading = useQuizLoading();
    const error = useQuizError();

    const {
        fetchQuizById,
        startAttempt,
        submitAttempt,
        saveResponse,
        fetchStudentAttempts,
        clearActiveAttempt,
        clearError,
        fetchSecureQuestion,
        fetchQuestionMetadata,
    } = useQuizStore();

    // Local state
    const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [questionIds, setQuestionIds] = useState<string[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState<Record<string, string[]>>({});
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitDialog, setShowSubmitDialog] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [showSecuritySetup, setShowSecuritySetup] = useState(true);
    const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const initializationAttemptedRef = useRef(false);
    const attemptRef = useRef<QuizAttempt | null>(null);

    // Keep ref in sync with state
    useEffect(() => {
        attemptRef.current = attempt;
    }, [attempt]);

    // Security hook - define callbacks first
    const handleAutoSubmit = useCallback(async () => {
        const currentAttempt = attemptRef.current;
        if (!currentAttempt || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const responseArray = Object.entries(responses).map(([questionId, selectedAnswers]) => ({
                question_id: questionId,
                selected_answers: selectedAnswers,
            }));

            const result = await submitAttempt({
                attempt_id: currentAttempt.id,
                responses: responseArray,
            });

            if (result) {
                showWarningToast('Quiz submitted automatically.');
                clearActiveAttempt();
                router.push(`/lms/student/${centerId}/quizzes/${quizId}/results/${currentAttempt.id}`);
            }
        } catch (err) {
            console.error('Auto-submit error:', err);
            showErrorToast('Failed to submit quiz');
        } finally {
            setIsSubmitting(false);
        }
    }, [responses, submitAttempt, clearActiveAttempt, router, centerId, quizId, isSubmitting]);

    const security = useQuizSecurity(
        {
            requireFullscreen: true,
            requireWebcam: quiz?.require_webcam ?? false,
            detectTabSwitch: true,
            maxTabSwitches: MAX_TAB_SWITCHES,
            preventCopyPaste: true,
            preventRightClick: true,
            detectDevTools: true,
            onViolationLimit: handleAutoSubmit,
        },
        isInitialized && !showSecuritySetup
    );

    // Initialize quiz data (not attempt yet)
    useEffect(() => {
        if (!userId || !quizId && initializationAttemptedRef.current) return;
        initializationAttemptedRef.current = true;

        const initializeQuizData = async () => {
            try {
                // Fetch quiz data first
                await fetchQuizById(quizId, false);
                const quizData = useQuizStore.getState().selectedQuiz;

                if (!quizData) {
                    showErrorToast('Quiz not found');
                    router.push(`/lms/student/${centerId}/quizzes`);
                    return;
                }

                setQuiz(quizData);
            } catch (err) {
                console.error('Error loading quiz:', err);
                showErrorToast('Failed to load quiz');
                router.push(`/lms/student/${centerId}/quizzes`);
            }
        };

        initializeQuizData();
    }, [userId, quizId, centerId, fetchQuizById, router]);

    // Load a single question
    const loadQuestion = useCallback(async (attemptId: string, questionId: string) => {
        setIsLoadingQuestion(true);
        try {
            const question = await fetchSecureQuestion(attemptId, questionId);
            if (question) {
                setCurrentQuestion(question);
                // Also add to local questions array for tracking
                setQuestions(prev => {
                    const existing = prev.findIndex(q => q.id === questionId);
                    if (existing === -1) {
                        return [...prev, question];
                    }
                    return prev;
                });
            }
        } finally {
            setIsLoadingQuestion(false);
        }
    }, [fetchSecureQuestion]);

    // Start the actual quiz after security setup
    const handleStartQuiz = async () => {
        if (!quiz || !userId) return;

        try {
            // Check for existing in-progress attempt
            await fetchStudentAttempts(quizId, userId);

            // Start new attempt (or resume existing)
            const result = await startAttempt({
                quiz_id: quizId,
                student_id: userId,
                class_id: quiz.class_id,
            });

            if (result) {
                // Get the active attempt from store
                const state = useQuizStore.getState();
                const activeAttemptData = state.activeAttempt;

                if (activeAttemptData) {
                    setAttempt(activeAttemptData.attempt);

                    // Get question IDs for navigation
                    const metadataResult = await fetchQuestionMetadata(activeAttemptData.attempt.id);
                    if (metadataResult) {
                        setQuestionIds(metadataResult);

                        // Load existing responses if any
                        if (activeAttemptData.responses && activeAttemptData.responses.size > 0) {
                            const existingResponses: Record<string, string[]> = {};
                            activeAttemptData.responses.forEach((response, qId) => {
                                if (response.selected_answers) {
                                    existingResponses[qId] = response.selected_answers;
                                }
                            });
                            setResponses(existingResponses);
                        }

                        // Fetch first question
                        if (metadataResult.length > 0) {
                            await loadQuestion(activeAttemptData.attempt.id, metadataResult[0]);
                        }

                        setIsInitialized(true);
                        setShowSecuritySetup(false);
                    }
                }
            } else {
                const storeError = useQuizStore.getState().error;
                showErrorToast(storeError?.message || 'Failed to start quiz');
                router.push(`/lms/student/${centerId}/quizzes/${quizId}`);
            }
        } catch (err) {
            console.error('Error starting attempt:', err);
            showErrorToast('Failed to start quiz');
        }
    };

    // Timer logic
    useEffect(() => {
        if (!attempt?.quiz?.time_limit_minutes || !attempt.started_at || !isInitialized) return;

        let hasShownWarning = false;
        let hasShownCritical = false;

        const updateTimer = () => {
            const timeInfo = calculateRemainingTime(
                attempt.started_at,
                attempt.quiz?.time_limit_minutes || null,
                5 // submission window
            );

            setTimeRemaining(timeInfo.remainingSeconds);

            if (timeInfo.isExpired && !isSubmitting) {
                handleAutoSubmit();
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            } else if (timeInfo.isWarning && !hasShownWarning) {
                hasShownWarning = true;
                showWarningToast('5 minutes remaining!');
            } else if (timeInfo.isCritical && !hasShownCritical) {
                hasShownCritical = true;
                showWarningToast('1 minute remaining!');
            }
        };

        updateTimer();
        timerRef.current = setInterval(updateTimer, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [attempt?.started_at, attempt?.quiz?.time_limit_minutes, isInitialized, isSubmitting, handleAutoSubmit]);

    // Handle response change
    const handleResponseChange = (questionId: string, answer: string, isMultiple: boolean) => {
        setResponses(prev => {
            let newResponses: Record<string, string[]>;
            if (isMultiple) {
                const current = prev[questionId] || [];
                const updated = current.includes(answer)
                    ? current.filter(a => a !== answer)
                    : [...current, answer];
                newResponses = { ...prev, [questionId]: updated };
            } else {
                newResponses = { ...prev, [questionId]: [answer] };
            }

            // Auto-save response
            if (attempt) {
                saveResponse({
                    attempt_id: attempt.id,
                    question_id: questionId,
                    selected_answers: newResponses[questionId],
                }).catch(err => {
                    console.error('Failed to auto-save response:', err);
                });
            }

            return newResponses;
        });
    };

    // Handle manual submit
    const handleSubmit = async () => {
        if (!attempt || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const responseArray = Object.entries(responses).map(([questionId, selectedAnswers]) => ({
                question_id: questionId,
                selected_answers: selectedAnswers,
            }));

            const result = await submitAttempt({
                attempt_id: attempt.id,
                responses: responseArray,
            });

            if (result) {
                showSuccessToast('Quiz submitted successfully!');
                security.stopWebcam();
                security.exitFullscreen();
                clearActiveAttempt();
                router.push(`/lms/student/${centerId}/quizzes/${quizId}/results/${attempt.id}`);
            } else {
                showErrorToast('Failed to submit quiz');
            }
        } catch (err) {
            console.error('Submit error:', err);
            showErrorToast('An error occurred while submitting');
        } finally {
            setIsSubmitting(false);
            setShowSubmitDialog(false);
        }
    };

    // Navigation - load question when changing
    const goToQuestion = async (index: number) => {
        if (index >= 0 && index < questionIds.length && !isLoadingQuestion && attempt) {
            setCurrentQuestionIndex(index);
            const questionId = questionIds[index];

            // Check if we already have this question loaded
            const existingQuestion = questions.find(q => q.id === questionId);
            if (existingQuestion) {
                setCurrentQuestion(existingQuestion);
            } else {
                await loadQuestion(attempt.id, questionId);
            }
        }
    };

    const goNext = () => goToQuestion(currentQuestionIndex + 1);
    const goPrev = () => goToQuestion(currentQuestionIndex - 1);

    // Count answered questions
    const answeredCount = Object.values(responses).filter(r => r.length > 0).length;
    const progress = questionIds.length > 0
        ? ((currentQuestionIndex + 1) / questionIds.length) * 100
        : 0;

    // Show security setup screen first
    if (showSecuritySetup && quiz) {
        return (
            <QuizSecuritySetup
                quizTitle={quiz.title}
                timeLimitMinutes={quiz.time_limit_minutes}
                totalQuestions={quiz.total_questions || 0}
                maxScore={quiz.max_score}
                requireFullscreen={true}
                requireWebcam={quiz.require_webcam}
                maxTabSwitches={MAX_TAB_SWITCHES}
                isInitializing={loading.attempt}
                onStartQuiz={handleStartQuiz}
                onEnterFullscreen={security.enterFullscreen}
                onStartWebcam={security.startWebcam}
                isFullscreen={security.isFullscreen}
                isWebcamActive={security.isWebcamActive}
                webcamStream={security.webcamStream}
            />
        );
    }

    // Loading state - waiting for quiz data
    if (!quiz || contextLoading) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto p-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-24" />
                </div>
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-64 rounded-2xl" />
            </div>
        );
    }

    // Loading state - waiting for attempt
    if (loading.attempt || !isInitialized || !attempt) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto p-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-24" />
                </div>
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-64 rounded-2xl" />
                <div className="flex justify-between">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
        );
    }

    // Error state
    if (error?.message) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error.message}</AlertDescription>
                </Alert>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    // No questions found
    if (isInitialized && questionIds.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <FileQuestion className="h-16 w-16 text-muted-foreground mb-2" />
                <h2 className="text-2xl font-semibold">No Questions Found</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    This quiz doesn't have any questions yet. Please contact your instructor.
                </p>
                <Button variant="outline" onClick={() => {
                    security.exitFullscreen();
                    router.push(`/lms/student/${centerId}/quizzes`);
                }}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Quizzes
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background select-none">
            {/* Fixed Header */}
            <div className="fixed top-0 left-0 right-0 bg-background z-40 border-b">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-semibold truncate">{quiz?.title || 'Quiz'}</h2>
                            <p className="text-sm text-muted-foreground">
                                Question {currentQuestionIndex + 1} of {questionIds.length}
                            </p>
                        </div>

                        {/* Timer */}
                        {timeRemaining !== null && (
                            <Badge
                                variant={timeRemaining < 60 ? 'destructive' : timeRemaining < 300 ? 'warning' : 'outline'}
                                className="text-lg px-4 py-2 shrink-0 ml-4"
                            >
                                <Clock className="h-4 w-4 mr-2" />
                                {formatRemainingTime(timeRemaining)}
                            </Badge>
                        )}
                    </div>

                    {/* Progress & Security Status */}
                    <div className="mt-3 flex items-center gap-4">
                        <div className="flex-1">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                                {answeredCount} of {questionIds.length} answered
                            </p>
                        </div>
                        <QuizSecurityStatus
                            violationCount={security.tabSwitchCount}
                            maxViolations={MAX_TAB_SWITCHES}
                            isInViolation={security.isInViolation}
                            isFullscreen={security.isFullscreen}
                            isWebcamActive={security.isWebcamActive}
                            requireWebcam={quiz?.require_webcam ?? false}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-32 pb-28 px-4 max-w-4xl mx-auto">
                {/* Question Card */}
                {isLoadingQuestion ? (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Loading question...</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-3/4 mb-4" />
                            <div className="space-y-3">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                ) : currentQuestion ? (
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <CardTitle className="text-base">
                                    <span className="text-muted-foreground mr-2">Q{currentQuestionIndex + 1}.</span>
                                    {currentQuestion.question_text}
                                </CardTitle>
                                <Badge variant="outline">
                                    {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Options */}
                            {currentQuestion.question_type === QuestionType.MCQ_SINGLE ? (
                                <RadioGroup
                                    value={responses[currentQuestion.id]?.[0] || ''}
                                    onValueChange={(value) => handleResponseChange(currentQuestion.id, value, false)}
                                    className="space-y-3"
                                >
                                    {optionsToArray(currentQuestion.options).map((option) => (
                                        <div
                                            key={option.key}
                                            className={cn(
                                                'flex items-center space-x-3 p-4 rounded-lg border transition-colors',
                                                responses[currentQuestion.id]?.includes(option.key)
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-primary/50'
                                            )}
                                        >
                                            <RadioGroupItem value={option.key} id={`option-${option.key}`} />
                                            <Label
                                                htmlFor={`option-${option.key}`}
                                                className="flex-1 cursor-pointer"
                                            >
                                                <span className="font-medium mr-2">{option.key}.</span>
                                                {option.text}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Select all that apply
                                    </p>
                                    {optionsToArray(currentQuestion.options).map((option) => (
                                        <div
                                            key={option.key}
                                            className={cn(
                                                'flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer',
                                                responses[currentQuestion.id]?.includes(option.key)
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-primary/50'
                                            )}
                                            onClick={() => handleResponseChange(currentQuestion.id, option.key, true)}
                                        >
                                            <Checkbox
                                                checked={responses[currentQuestion.id]?.includes(option.key)}
                                                onCheckedChange={() => handleResponseChange(currentQuestion.id, option.key, true)}
                                            />
                                            <Label className="flex-1 cursor-pointer">
                                                <span className="font-medium mr-2">{option.key}.</span>
                                                {option.text}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : null}

                {/* Question Navigator */}
                <div className="mt-6 flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg">
                    {questionIds.map((qId, index) => (
                        <Button
                            key={qId}
                            variant={index === currentQuestionIndex ? 'default' : responses[qId]?.length > 0 ? 'outline' : 'ghost'}
                            size="sm"
                            className={cn(
                                'w-10 h-10',
                                responses[qId]?.length > 0 && index !== currentQuestionIndex && 'bg-green-50 text-green-600 border-green-200'
                            )}
                            onClick={() => goToQuestion(index)}
                            disabled={isLoadingQuestion}
                        >
                            {index + 1}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons - Fixed Bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-40">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
                    <Button
                        variant="outline"
                        onClick={goPrev}
                        disabled={currentQuestionIndex === 0 || isLoadingQuestion}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>

                    <div className="flex items-center gap-2">
                        {currentQuestionIndex === questionIds.length - 1 ? (
                            <Button
                                onClick={() => setShowSubmitDialog(true)}
                                disabled={isSubmitting || isLoadingQuestion}
                                className="gap-2"
                            >
                                <Send className="h-4 w-4" />
                                Submit Quiz
                            </Button>
                        ) : (
                            <Button onClick={goNext} disabled={isLoadingQuestion}>
                                {isLoadingQuestion ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        Next
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Webcam Monitor */}
            <QuizWebcamMonitor
                stream={security.webcamStream}
                isActive={security.isWebcamActive}
            />

            {/* Submit Confirmation Dialog */}
            <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {answeredCount < questionIds.length ? (
                                <span className="text-amber-600">
                                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                                    You have {questionIds.length - answeredCount} unanswered question(s).
                                </span>
                            ) : (
                                <span className="text-green-600">
                                    <CheckCircle2 className="h-4 w-4 inline mr-1" />
                                    All questions answered!
                                </span>
                            )}
                            <br />
                            <br />
                            Are you sure you want to submit your quiz? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
