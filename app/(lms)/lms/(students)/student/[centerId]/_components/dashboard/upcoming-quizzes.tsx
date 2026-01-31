'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, CheckCircle2, ArrowRight, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormattedStudentQuiz } from '@/lib/branch-system/types/branch-students.types';
import { getUrgencyVariant } from '@/lib/branch-system/utils/student-dashboard.utils';

interface UpcomingQuizzesProps {
    quizzes: FormattedStudentQuiz[];
    onQuizClick?: (quizId: string) => void;
    onViewAll?: () => void;
}

export function UpcomingQuizzes({ quizzes, onQuizClick, onViewAll }: UpcomingQuizzesProps) {
    const availableQuizzes = quizzes?.filter(q => q.can_attempt) || [];

    if (!quizzes || quizzes.length === 0) {
        return (
            <Card className="border-muted/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5 text-brand-primary" />
                        Upcoming Quizzes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                        <p className="text-sm">No quizzes available</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-muted/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5 text-brand-primary" />
                        Upcoming Quizzes
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                        {availableQuizzes.length} available
                    </Badge>
                </div>
                <CardDescription>Quizzes you can attempt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {availableQuizzes.slice(0, 5).map((quiz) => (
                    <QuizCard
                        key={quiz.quiz_id}
                        quiz={quiz}
                        onClick={() => onQuizClick?.(quiz.quiz_id)}
                    />
                ))}
                {availableQuizzes.length > 5 && onViewAll && (
                    <Button variant="ghost" className="w-full" onClick={onViewAll}>
                        View All Quizzes
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

function QuizCard({ quiz, onClick }: { quiz: FormattedStudentQuiz; onClick?: () => void }) {
    const attemptsRemaining = quiz.max_attempts - quiz.attempts_used;

    return (
        <div
            className={cn(
                'p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm hover:border-brand-primary/20',
                quiz.urgency === 'critical' && 'border-destructive/30 bg-destructive/5'
            )}
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-sm line-clamp-1 flex-1">{quiz.title}</h4>
                <div className="flex items-center gap-1 shrink-0">
                    {quiz.best_score !== null && (
                        <Badge variant="success" className="text-[10px]">
                            {quiz.best_score}%
                        </Badge>
                    )}
                    <Badge variant={getUrgencyVariant(quiz.urgency)} className="text-[10px]">
                        {quiz.hours_remaining}h
                    </Badge>
                </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span>{quiz.class_name}</span>
                <span>•</span>
                <span>{quiz.total_questions} questions</span>
                {quiz.time_limit_minutes && (
                    <>
                        <span>•</span>
                        <span>{quiz.time_limit_minutes}min</span>
                    </>
                )}
            </div>
            <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                    {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} left
                </span>
                {quiz.attempts_used > 0 && quiz.best_score !== null && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span>Best: {quiz.best_score}%</span>
                    </div>
                )}
            </div>
        </div>
    );
}