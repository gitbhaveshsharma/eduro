/**
 * Question Review Card Component
 */

'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, ChevronDown, Lock, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { QuizQuestion } from '@/lib/branch-system/types/quiz.types';

interface QuestionResult {
    question: QuizQuestion;
    selectedAnswers: string[];
    isCorrect: boolean;
}

interface QuestionReviewCardProps {
    questionResults: QuestionResult[];
    canReviewQuestions: boolean;
}

export function QuestionReviewCard({
    questionResults,
    canReviewQuestions
}: QuestionReviewCardProps) {
    const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

    const toggleQuestion = (questionId: string) => {
        if (!canReviewQuestions) return;

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

    if (questionResults.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Question Details Unavailable</h3>
                    <p className="text-sm text-muted-foreground">
                        {canReviewQuestions
                            ? 'No question details are available for this attempt.'
                            : 'Question details will be available for review later.'}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Question Review</CardTitle>
                        <CardDescription>
                            {canReviewQuestions
                                ? 'Click on each question to see the details'
                                : 'Question details will be available for review later'}
                        </CardDescription>
                    </div>
                    {!canReviewQuestions && (
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
                        disabled={!canReviewQuestions}
                    >
                        <CollapsibleTrigger asChild>
                            <div
                                className={cn(
                                    'flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors',
                                    !canReviewQuestions && 'cursor-not-allowed opacity-70',
                                    result.isCorrect
                                        ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                        : 'bg-red-50 border-red-200 hover:bg-red-100',
                                    !canReviewQuestions && 'hover:bg-initial'
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    {result.isCorrect ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                                    )}
                                    <div className="text-left">
                                        <p className="font-medium">Question {index + 1}</p>
                                        {!canReviewQuestions && (
                                            <p className="text-xs text-muted-foreground">
                                                Details locked
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={result.isCorrect ? 'default' : 'destructive'}>
                                        {result.isCorrect ? 'Correct' : 'Incorrect'}
                                    </Badge>
                                    {canReviewQuestions && (
                                        <ChevronDown
                                            className={cn(
                                                'h-4 w-4 transition-transform',
                                                expandedQuestions.has(result.question.id) && 'rotate-180'
                                            )}
                                        />
                                    )}
                                </div>
                            </div>
                        </CollapsibleTrigger>

                        {canReviewQuestions && (
                            <CollapsibleContent className="p-4 border-x border-b rounded-b-lg bg-background">
                                <div className="space-y-4">
                                    <p className="font-medium">{result.question.question_text}</p>

                                    <div className="space-y-2">
                                        {result.question.options && result.question.options.length > 0 ? (
                                            result.question.options.map((option: any) => {
                                                const optionKey = typeof option === 'object' ? option.id : option;
                                                const optionText = typeof option === 'object' ? option.option_text : option;
                                                const isSelected = result.selectedAnswers.includes(optionKey);
                                                const isCorrect = result.question.correct_answers?.includes(optionKey);

                                                return (
                                                    <div
                                                        key={optionKey}
                                                        className={cn(
                                                            'p-3 rounded-lg border-2',
                                                            isCorrect && 'bg-green-50 border-green-500',
                                                            isSelected && !isCorrect && 'bg-red-50 border-red-500',
                                                            !isSelected && !isCorrect && 'bg-background border-border'
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">{optionKey}.</span>
                                                                <span>{optionText}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {isSelected && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        Your answer
                                                                    </Badge>
                                                                )}
                                                                {isCorrect && (
                                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="p-3 rounded-lg border bg-muted">
                                                <p className="text-sm text-muted-foreground">
                                                    Your answer: {result.selectedAnswers.join(', ') || 'No answer'}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {result.question.explanation && (
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <p className="text-sm font-medium text-blue-900 mb-1">Explanation</p>
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
    );
}
