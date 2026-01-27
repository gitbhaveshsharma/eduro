/**
 * Student Quiz Attempt Page
 * 
 * The page where students take the quiz
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

import type { QuizQuestion, QuizAttempt } from '@/lib/branch-system/types/quiz.types';
import {
    calculateRemainingTime,
    formatRemainingTime,
    optionsToArray,
    QuestionType,
} from '@/lib/branch-system/quiz';
import { cn } from '@/lib/utils';

interface StudentQuizAttemptPageProps {
    params: {
        centerId: string;
        quizId: string;
    };
}

interface QuestionResponse {
    questionId: string;
    selectedAnswers: string[];
}

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
    } = useQuizStore();

    // Local state
    const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState<Record<string, string[]>>({});
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitDialog, setShowSubmitDialog] = useState(false);
    const [showTimeWarning, setShowTimeWarning] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize attempt
    useEffect(() => {
        if (!userId || !quizId || isInitialized) return;

        const initializeAttempt = async () => {
            try {
                // Fetch quiz with questions
                await fetchQuizById(quizId, true);

                // Check for existing in-progress attempt
                await fetchStudentAttempts(quizId, userId);

                // Start new attempt (or resume existing)
                const result = await startAttempt({
                    quiz_id: quizId,
                    student_id: userId,
                    class_id: '', // Will be set from quiz data
                });

                if (result) {
                    setIsInitialized(true);
                } else {
                    showErrorToast('Failed to start quiz');
                    router.back();
                }
            } catch (err) {
                console.error('Error initializing attempt:', err);
                showErrorToast('Failed to load quiz');
                router.back();
            }
        };

        initializeAttempt();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    // Update local state from active attempt
    useEffect(() => {
        if (activeAttempt) {
            setAttempt(activeAttempt.attempt);
            setQuestions(activeAttempt.questions || []);

            // Load existing responses
            if (activeAttempt.responses) {
                const existingResponses: Record<string, string[]> = {};
                Object.entries(activeAttempt.responses).forEach(([questionId, answer]) => {
                    existingResponses[questionId] = answer;
                });
                setResponses(existingResponses);
            }
        }
    }, [activeAttempt]);

    // Timer logic
    useEffect(() => {
        if (!attempt?.quiz?.time_limit_minutes || !attempt.started_at) return;

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
                // Auto-submit
                handleAutoSubmit();
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            } else if (timeInfo.isWarning && !hasShownWarning) {
                hasShownWarning = true;
                setShowTimeWarning(true);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attempt?.started_at, attempt?.quiz?.time_limit_minutes]);

    // Handle response change
    const handleResponseChange = (questionId: string, answer: string, isMultiple: boolean) => {
        setResponses(prev => {
            if (isMultiple) {
                // Toggle answer for multiple choice
                const current = prev[questionId] || [];
                const updated = current.includes(answer)
                    ? current.filter(a => a !== answer)
                    : [...current, answer];
                return { ...prev, [questionId]: updated };
            } else {
                // Single choice
                return { ...prev, [questionId]: [answer] };
            }
        });

        // Auto-save response
        if (attempt) {
            saveResponse({
                attempt_id: attempt.id,
                question_id: questionId,
                selected_answers: isMultiple
                    ? (responses[questionId]?.includes(answer)
                        ? responses[questionId].filter(a => a !== answer)
                        : [...(responses[questionId] || []), answer])
                    : [answer],
            }).catch(err => {
                console.error('Failed to auto-save response:', err);
            });
        }
    };

    // Handle auto-submit (timeout)
    const handleAutoSubmit = async () => {
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
                showWarningToast('Time is up! Quiz submitted automatically.');
                clearActiveAttempt();
                router.push(`/lms/student/${centerId}/quizzes/${quizId}/results/${attempt.id}`);
            }
        } catch (err) {
            console.error('Auto-submit error:', err);
            showErrorToast('Failed to submit quiz');
        } finally {
            setIsSubmitting(false);
        }
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

    // Navigation
    const goToQuestion = (index: number) => {
        if (index >= 0 && index < questions.length) {
            setCurrentQuestionIndex(index);
        }
    };

    const goNext = () => goToQuestion(currentQuestionIndex + 1);
    const goPrev = () => goToQuestion(currentQuestionIndex - 1);

    // Current question
    const currentQuestion = questions[currentQuestionIndex];
    const progress = questions.length > 0
        ? ((currentQuestionIndex + 1) / questions.length) * 100
        : 0;

    // Count answered questions
    const answeredCount = Object.values(responses).filter(r => r.length > 0).length;

    // Loading state
    if (contextLoading || loading.attempt || !isInitialized || !attempt) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
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
    if (isInitialized && questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <FileQuestion className="h-16 w-16 text-muted-foreground mb-2" />
                <h2 className="text-2xl font-semibold">No Questions Found</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    This quiz doesn&apos;t have any questions yet. Please contact your instructor.
                </p>
                <Button variant="outline" onClick={() => router.push(`/lms/student/${centerId}/quizzes`)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Quizzes
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-w-4xl mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 bg-background z-10 py-2 border-b">
                <div>
                    <h2 className="text-lg font-semibold">{attempt.quiz?.title || 'Quiz'}</h2>
                    <p className="text-sm text-muted-foreground">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </p>
                </div>

                {/* Timer */}
                {timeRemaining !== null && (
                    <Badge
                        variant={timeRemaining < 60 ? 'destructive' : timeRemaining < 300 ? 'warning' : 'outline'}
                        className="text-lg px-4 py-2"
                    >
                        <Clock className="h-4 w-4 mr-2" />
                        {formatRemainingTime(timeRemaining)}
                    </Badge>
                )}
            </div>

            {/* Progress */}
            <div className="space-y-1">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                    {answeredCount} of {questions.length} answered
                </p>
            </div>

            {/* Question Card */}
            {currentQuestion && (
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
            )}

            {/* Question Navigator */}
            <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg">
                {questions.map((q, index) => (
                    <Button
                        key={q.id}
                        variant={index === currentQuestionIndex ? 'default' : responses[q.id]?.length > 0 ? 'outline' : 'ghost'}
                        size="sm"
                        className={cn(
                            'w-10 h-10',
                            responses[q.id]?.length > 0 && index !== currentQuestionIndex && 'bg-green-50 text-green-600 border-green-200'
                        )}
                        onClick={() => goToQuestion(index)}
                    >
                        {index + 1}
                    </Button>
                ))}
            </div>

            {/* Navigation Buttons */}
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <Button
                        variant="outline"
                        onClick={goPrev}
                        disabled={currentQuestionIndex === 0}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>

                    <div className="flex items-center gap-2">
                        {currentQuestionIndex === questions.length - 1 ? (
                            <Button
                                onClick={() => setShowSubmitDialog(true)}
                                disabled={isSubmitting}
                                className="gap-2"
                            >
                                <Send className="h-4 w-4" />
                                Submit Quiz
                            </Button>
                        ) : (
                            <Button onClick={goNext}>
                                Next
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Submit Confirmation Dialog */}
            <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {answeredCount < questions.length ? (
                                <span className="text-amber-600">
                                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                                    You have {questions.length - answeredCount} unanswered question(s).
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
