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
import { Progress } from '@/components/ui/progress';
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
} from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

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

    // Fetch attempt details
    const loadResults = useCallback(async () => {
        try {
            setIsLoading(true);
            clearError();

            // Fetch the specific attempt details with responses
            // This is RLS-protected, so only the student's own attempts can be accessed
            const attemptData = await fetchAttemptDetails(attemptId);

            if (!attemptData) {
                console.error('Attempt not found or access denied:', attemptId);
                throw new Error('Attempt not found');
            }

            console.log('Attempt data received:', {
                id: attemptData.id,
                hasResponses: !!attemptData.responses,
                responsesCount: attemptData.responses?.length || 0,
                responses: attemptData.responses
            });

            // Fetch the quiz to get questions (updates store state)
            await fetchQuizById(quizId, true);

            // Get the quiz from store after fetching
            const quiz = useQuizStore.getState().selectedQuiz;

            if (!quiz) {
                console.error('Quiz not found:', quizId);
                throw new Error('Quiz not found');
            }

            // Create a new attempt object with quiz data (don't mutate the original)
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
                }
            };

            setAttempt(attemptWithQuiz);

            // Build question results (if quiz allows showing answers AND we have responses)
            if (quiz.questions && quiz.show_correct_answers && attemptData.responses && attemptData.responses.length > 0) {
                const results: QuestionResult[] = quiz.questions.map((question: QuizQuestion) => {
                    const response = attemptData.responses?.find(
                        (r: { question_id: string }) => r.question_id === question.id
                    );
                    const selectedAnswers = response?.selected_answers || [];
                    const correctAnswers = question.correct_answers || [];

                    const isCorrect =
                        selectedAnswers.length === correctAnswers.length &&
                        selectedAnswers.every((a: string) => correctAnswers.includes(a));

                    return {
                        question,
                        selectedAnswers,
                        isCorrect,
                    };
                });

                setQuestionResults(results);
            } else {
                console.warn('Cannot show question results:', {
                    hasQuestions: !!quiz.questions,
                    questionsCount: quiz.questions?.length || 0,
                    showCorrectAnswers: quiz.show_correct_answers,
                    hasResponses: !!attemptData.responses,
                    responsesCount: attemptData.responses?.length || 0
                });
            }
        } catch (err) {
            console.error('Error loading results:', err);
            // Error is handled by the store and displayed below
        } finally {
            setIsLoading(false);
        }
    }, [quizId, attemptId, fetchQuizById, fetchAttemptDetails, clearError]);

    useEffect(() => {
        loadResults();
    }, [loadResults]);

    // Toggle question expansion
    const toggleQuestion = (questionId: string) => {
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

    // Check if retry is allowed - simplified since we don't have full quiz data
    const canRetry = false; // Would need full quiz data to determine this

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
                        <p className="text-2xl font-bold">{questionResults.length - correctCount}</p>
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
                </CardContent>
            </Card>

            {/* Question Review */}
            {questionResults.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Question Review</CardTitle>
                        <CardDescription>
                            Click on each question to see the details
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {questionResults.map((result, index) => (
                            <Collapsible
                                key={result.question.id}
                                open={expandedQuestions.has(result.question.id)}
                                onOpenChange={() => toggleQuestion(result.question.id)}
                            >
                                <CollapsibleTrigger asChild>
                                    <div
                                        className={cn(
                                            'flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors',
                                            result.isCorrect
                                                ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                                : 'bg-red-50 border-red-200 hover:bg-red-100'
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            {result.isCorrect ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                                            )}
                                            <span className="font-medium">Question {index + 1}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">
                                                {result.isCorrect ? result.question.points : 0}/{result.question.points} pts
                                            </Badge>
                                            {expandedQuestions.has(result.question.id) ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </div>
                                    </div>
                                </CollapsibleTrigger>

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
                            The detailed question breakdown is not available for this attempt.
                            Your score and results have been recorded.
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
