/**
 * Student Quiz Results Page
 * 
 * Shows quiz attempt results with score breakdown
 * Route: /lms/student/[centerId]/quizzes/[quizId]/results/[attemptId]
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentContext } from '../../../../layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    AlertCircle,
    ArrowLeft,
    Trophy,
    Target,
    Clock,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Home,
    ChevronDown,
    ChevronUp,
    Eye,
    EyeOff,
    CalendarClock,
    Lock,
    Check,
    X,
} from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Quiz imports
import {
    useQuizStore,
    useQuizLoading,
    useQuizError,
    useSelectedQuiz,
} from '@/lib/branch-system/stores/quiz.store';
import type { QuizAttempt, QuizQuestion } from '@/lib/branch-system/types/quiz.types';
import {
    formatScore,
    calculatePercentage,
    formatDateTime,
    optionsToArray,
} from '@/lib/branch-system/quiz';

interface QuizResultsPageProps {
    params: {
        centerId: string;
        quizId: string;
        attemptId: string;
    };
}

interface QuestionResult {
    question: QuizQuestion;
    selectedAnswers: string[];
    isCorrect: boolean;
}

// Interface for quiz availability status
interface QuizAvailability {
    isQuizActive: boolean;
    hasEnded: boolean;
    canReviewQuestions: boolean;
    reviewAllowedDate: Date | null;
    reviewMessage: string;
    showReviewCountdown: boolean;
}

export default function QuizResultsPage({ params }: QuizResultsPageProps) {
    const { centerId, quizId, attemptId } = params;
    const router = useRouter();
    const { isLoading: contextLoading } = useStudentContext();

    // Store hooks
    const loading = useQuizLoading();
    const error = useQuizError();
    const selectedQuiz = useSelectedQuiz();
    const { fetchQuizById, clearError, fetchAttemptDetails } = useQuizStore();

    // Local state
    const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
    const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
    const [quizAvailability, setQuizAvailability] = useState<QuizAvailability>({
        isQuizActive: false,
        hasEnded: false,
        canReviewQuestions: false,
        reviewAllowedDate: null,
        reviewMessage: '',
        showReviewCountdown: false,
    });

    // Check if student can review questions
    const checkQuestionReviewAvailability = useCallback((quizData: any, attemptData: QuizAttempt) => {
        if (!quizData) {
            return;
        }

        const now = new Date();
        const availableTo = quizData.available_to ? new Date(quizData.available_to) : null;
        const isQuizActive = quizData.is_active === true;
        const hasEnded = availableTo ? availableTo < now : false;
        const attemptStatus = attemptData.attempt_status;

        // Determine when questions can be reviewed
        let canReviewQuestions = false;
        let reviewAllowedDate: Date | null = null;
        let reviewMessage = '';
        let showReviewCountdown = false;

        if (attemptStatus === 'IN_PROGRESS') {
            canReviewQuestions = true;
            reviewMessage = 'You can view questions during your attempt.';
        } else if (attemptStatus === 'COMPLETED') {
            if (quizData.show_correct_answers === true) {
                canReviewQuestions = true;
                reviewMessage = 'You can review questions as this quiz allows viewing correct answers.';
            } else if (hasEnded && isQuizActive && availableTo) {
                canReviewQuestions = true;
                reviewMessage = 'You can now review questions as the quiz period has ended.';
            } else if (!hasEnded && availableTo) {
                canReviewQuestions = false;
                reviewAllowedDate = availableTo;
                reviewMessage = `Questions will be available for review after ${format(availableTo, 'PPP p')}.`;
                showReviewCountdown = true;
            } else if (hasEnded && !isQuizActive) {
                canReviewQuestions = false;
                reviewMessage = 'Question review is not available for this quiz.';
            } else if (!availableTo) {
                canReviewQuestions = false;
                reviewMessage = 'Question review is not available for this quiz.';
            }
        } else {
            canReviewQuestions = false;
            reviewMessage = 'Question review is not available for this attempt.';
        }

        setQuizAvailability({
            isQuizActive,
            hasEnded,
            canReviewQuestions,
            reviewAllowedDate,
            reviewMessage,
            showReviewCountdown,
        });
    }, []);

    // Fetch attempt details
    const loadResults = useCallback(async () => {
        try {
            setIsLoading(true);
            clearError();

            const attemptData = await fetchAttemptDetails(attemptId);

            if (!attemptData) {
                throw new Error('Attempt not found');
            }

            await fetchQuizById(quizId, true);

            const quiz = useQuizStore.getState().selectedQuiz;

            if (!quiz) {
                throw new Error('Quiz not found');
            }

            // Create a new attempt object with quiz data
            const attemptWithQuiz: QuizAttempt = {
                ...attemptData,
                quiz: {
                    id: quiz.id,
                    title: quiz.title,
                    time_limit_minutes: quiz.time_limit_minutes,
                    max_score: quiz.max_score,
                    passing_score: quiz.passing_score,
                    show_correct_answers: quiz.show_correct_answers ?? false,
                    show_score_immediately: quiz.show_score_immediately ?? false,
                    available_to: quiz.available_to,
                    is_active: quiz.is_active,
                }
            };

            setAttempt(attemptWithQuiz);

            // Check question review availability
            checkQuestionReviewAvailability(quiz, attemptData);

            // Build question results if questions are available
            if (quiz.questions && quiz.questions.length > 0 && attemptData.responses && attemptData.responses.length > 0) {
                const results: QuestionResult[] = quiz.questions.map((question: QuizQuestion) => {
                    const response = attemptData.responses?.find(
                        (r: QuizResponse) => r.question_id === question.id
                    );

                    return {
                        question,
                        selectedAnswers: response?.selected_answers ?? [],
                        isCorrect: response?.is_correct ?? false,
                    };
                });

                setQuestionResults(results);
            } else if (attemptData.responses && attemptData.responses.length > 0) {
                const results: QuestionResult[] = attemptData.responses.map((response: QuizResponse, index: number) => {
                    const minimalQuestion: QuizQuestion = {
                        id: response.question_id,
                        quiz_id: quizId,
                        question_text: `Question ${index + 1}`,
                        question_type: 'MCQ_SINGLE',
                        options: [],
                        correct_answers: [],
                        points: response.points_earned + response.points_deducted,
                        question_order: index + 1,
                        created_at: response.created_at,
                        metadata: null,
                    };

                    return {
                        question: minimalQuestion,
                        selectedAnswers: response.selected_answers ?? [],
                        isCorrect: response.is_correct ?? false,
                    };
                });

                setQuestionResults(results);
            }
        } catch (err) {
            // Don't throw - let the error state handle it
        } finally {
            setIsLoading(false);
        }
    }, [quizId, attemptId, fetchQuizById, fetchAttemptDetails, clearError, checkQuestionReviewAvailability]);

    useEffect(() => {
        loadResults();
    }, [loadResults]);

    // Toggle question expansion
    const toggleQuestion = (questionId: string) => {
        if (!quizAvailability.canReviewQuestions) return;

        setExpandedQuestions(prev => {
            const next = new Set(prev);
            if (next.has(questionId)) {
                next.delete(questionId);
            } else {
                next.add(questionId);
            }
            return next;
        });
    };

    // Calculate stats
    const scorePercentage = attempt?.score !== undefined && attempt?.score !== null && attempt?.max_score
        ? calculatePercentage(attempt.score, attempt.max_score)
        : 0;
    const passed = attempt?.passed ?? false;
    const correctCount = questionResults.filter(r => r.isCorrect).length;
    const totalQuestions = questionResults.length;

    // Check if retry is allowed
    const canRetry = attempt?.quiz?.is_active && !quizAvailability.hasEnded;

    // Loading state
    if (contextLoading || isLoading) {
        return (
            <div className="space-y-6 max-w-3xl mx-auto">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-48 rounded-2xl" />
            </div>
        );
    }

    // Error state
    if (error?.message || (!isLoading && !attempt)) {
        const errorMessage = error?.message || 'Results not found or access denied';

        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertDescription>
                        {errorMessage}
                    </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </Button>
                    <Button onClick={() => loadResults()}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Quiz Results</h1>
                    <p className="text-muted-foreground">{attempt?.quiz?.title || 'Loading...'}</p>
                </div>
            </div>

            {/* Score Card */}
            <Card className={cn(
                'border-2',
                passed ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
            )}>
                <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center gap-4">
                        {/* Status Icon */}
                        <div className={cn(
                            'p-4 rounded-full',
                            passed ? 'bg-green-100' : 'bg-red-100'
                        )}>
                            {passed ? (
                                <Trophy className={cn('h-12 w-12 text-green-600')} />
                            ) : (
                                <Target className={cn('h-12 w-12 text-red-600')} />
                            )}
                        </div>

                        {/* Score */}
                        <div>
                            <p className="text-5xl font-bold">
                                {attempt ? formatScore(attempt.score ?? 0, attempt.max_score ?? 0) : '0/0'}
                            </p>
                            <p className="text-lg text-muted-foreground mt-1">
                                {scorePercentage.toFixed(0)}%
                            </p>
                        </div>

                        {/* Status Badge */}
                        <Badge
                            variant={passed ? 'default' : 'destructive'}
                            className="text-lg px-4 py-1"
                        >
                            {passed ? 'PASSED' : 'NOT PASSED'}
                        </Badge>

                        {/* Passing Score Info */}
                        {attempt?.quiz?.passing_score && (
                            <p className="text-sm text-muted-foreground">
                                Passing score: {attempt.quiz.passing_score}%
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Question Review Availability Banner */}
            {!quizAvailability.canReviewQuestions && (
                <Alert className={cn(
                    'border-amber-200 bg-amber-50/50',
                    quizAvailability.showReviewCountdown && 'border-blue-200 bg-blue-50/50'
                )}>
                    <CalendarClock className="h-4 w-4 text-amber-600" />
                    <AlertDescription>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <EyeOff className="h-4 w-4" />
                                <span className="font-medium">
                                    Question details are not currently available
                                </span>
                            </div>
                            <p className="text-sm">
                                {quizAvailability.reviewMessage}
                            </p>
                            {quizAvailability.reviewAllowedDate && quizAvailability.showReviewCountdown && (
                                <div className="mt-2 p-3 bg-blue-100/50 rounded-lg">
                                    <div className="flex items-center gap-2 text-blue-700">
                                        <CalendarClock className="h-4 w-4" />
                                        <span className="font-medium">
                                            Available on: {format(quizAvailability.reviewAllowedDate, 'PPP p')}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <CheckCircle2 className="h-6 w-6 mx-auto text-green-600 mb-2" />
                        <p className="text-2xl font-bold">{correctCount}</p>
                        <p className="text-xs text-muted-foreground">Correct</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <XCircle className="h-6 w-6 mx-auto text-red-600 mb-2" />
                        <p className="text-2xl font-bold">{totalQuestions - correctCount}</p>
                        <p className="text-xs text-muted-foreground">Incorrect</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <Target className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                        <p className="text-2xl font-bold">{attempt?.score ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Points Earned</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <Clock className="h-6 w-6 mx-auto text-amber-600 mb-2" />
                        <p className="text-2xl font-bold">
                            {attempt?.started_at && attempt?.submitted_at
                                ? Math.round(
                                    (new Date(attempt.submitted_at).getTime() -
                                        new Date(attempt.started_at).getTime()) / 60000
                                )
                                : '-'}
                        </p>
                        <p className="text-xs text-muted-foreground">Minutes</p>
                    </CardContent>
                </Card>
            </div>

            {/* Attempt Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Attempt Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Started</span>
                        <span>{attempt?.started_at ? formatDateTime(attempt.started_at) : '-'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Submitted</span>
                        <span>{attempt?.submitted_at ? formatDateTime(attempt.submitted_at) : '-'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Attempt #</span>
                        <span>{attempt?.attempt_number || 1}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Quiz Status</span>
                        <div className="flex items-center gap-1">
                            {quizAvailability.isQuizActive ? (
                                <>
                                    <Check className="h-3 w-3 text-green-600" />
                                    <span>Active</span>
                                </>
                            ) : (
                                <>
                                    <X className="h-3 w-3 text-red-600" />
                                    <span>Inactive</span>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Question Review Section */}
            {totalQuestions > 0 ? (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Question Review</CardTitle>
                                <CardDescription>
                                    {quizAvailability.canReviewQuestions
                                        ? 'Click on each question to see the details'
                                        : 'Question details will be available for review later'}
                                </CardDescription>
                            </div>
                            {!quizAvailability.canReviewQuestions && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                    <Lock className="h-3 w-3" />
                                    Locked
                                </Badge>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                        {questionResults.map((result, index) => (
                            <Collapsible
                                key={result.question.id}
                                open={expandedQuestions.has(result.question.id)}
                                onOpenChange={() => toggleQuestion(result.question.id)}
                                disabled={!quizAvailability.canReviewQuestions}
                            >
                                <CollapsibleTrigger asChild>
                                    <div
                                        className={cn(
                                            'flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors',
                                            !quizAvailability.canReviewQuestions && 'cursor-not-allowed opacity-70',
                                            result.isCorrect
                                                ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                                : 'bg-red-50 border-red-200 hover:bg-red-100',
                                            !quizAvailability.canReviewQuestions && 'hover:bg-initial'
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            {result.isCorrect ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                                            )}
                                            <div className="text-left">
                                                <span className="font-medium">Question {index + 1}</span>
                                                <p className="text-xs text-muted-foreground">
                                                    Your answer: {result.selectedAnswers.length > 0
                                                        ? result.selectedAnswers.join(', ')
                                                        : 'No answer'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">
                                                {result.isCorrect ? result.question.points : 0}/{result.question.points} pts
                                            </Badge>
                                            {quizAvailability.canReviewQuestions ? (
                                                expandedQuestions.has(result.question.id) ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )
                                            ) : (
                                                <Lock className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>
                                </CollapsibleTrigger>

                                {quizAvailability.canReviewQuestions && (
                                    <CollapsibleContent className="p-4 border-x border-b rounded-b-lg bg-background">
                                        <div className="space-y-4">
                                            {/* Question Text */}
                                            <p className="font-medium">{result.question.question_text}</p>

                                            {/* Options */}
                                            <div className="space-y-2">
                                                {optionsToArray(result.question.options).map((option) => {
                                                    const isSelected = result.selectedAnswers.includes(option.key);
                                                    const isCorrect = result.question.correct_answers?.includes(option.key);

                                                    return (
                                                        <div
                                                            key={option.key}
                                                            className={cn(
                                                                'flex items-center gap-3 p-3 rounded-lg border',
                                                                isCorrect && 'bg-green-50 border-green-300',
                                                                isSelected && !isCorrect && 'bg-red-50 border-red-300',
                                                                !isSelected && !isCorrect && 'bg-muted/30'
                                                            )}
                                                        >
                                                            {isCorrect ? (
                                                                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                                            ) : isSelected ? (
                                                                <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                                                            ) : (
                                                                <div className="h-4 w-4 rounded-full border shrink-0" />
                                                            )}
                                                            <span className={cn(
                                                                isCorrect && 'font-medium text-green-700',
                                                                isSelected && !isCorrect && 'font-medium text-red-700'
                                                            )}>
                                                                {option.key}. {option.text}
                                                            </span>
                                                            {isSelected && (
                                                                <Badge variant="outline" className="ml-auto text-xs">
                                                                    Your answer
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Explanation */}
                                            {result.question.explanation && (
                                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                    <p className="text-sm font-medium text-blue-800 mb-1">Explanation:</p>
                                                    <p className="text-sm text-blue-700">{result.question.explanation}</p>
                                                </div>
                                            )}
                                        </div>
                                    </CollapsibleContent>
                                )}
                            </Collapsible>
                        ))}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-6 text-center">
                        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Question Details Unavailable</h3>
                        <p className="text-sm text-muted-foreground">
                            {quizAvailability.canReviewQuestions
                                ? 'No question details are available for this attempt.'
                                : 'Question details will be available for review later.'}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/lms/student/${centerId}/quizzes`)}
                >
                    <Home className="h-4 w-4 mr-2" />
                    Back to Quizzes
                </Button>

                {canRetry && (
                    <Button
                        className="flex-1"
                        onClick={() => router.push(`/lms/student/${centerId}/quizzes/${quizId}`)}
                    >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                )}
            </div>
        </div>
    );
}