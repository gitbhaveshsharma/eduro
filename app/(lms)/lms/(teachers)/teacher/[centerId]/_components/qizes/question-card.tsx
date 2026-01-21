/**
 * Question Card Component
 * 
 * Displays a single quiz question with options
 * Used in quiz detail view and question management
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Edit,
    Trash2,
    MoreHorizontal,
    Check,
    X,
    CircleDot,
    CheckSquare,
    GripVertical,
    Tag,
    MessageSquare,
    Target,
    MinusCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuizQuestion, QuizOptions } from '@/lib/branch-system/types/quiz.types';
import { QuestionType } from '@/lib/branch-system/types/quiz.types';
import { QUESTION_TYPE_CONFIG } from '@/lib/branch-system/quiz';

export interface QuestionCardProps {
    /** Question data to display */
    question: QuizQuestion;
    /** Whether the question can be edited */
    canEdit?: boolean;
    /** Whether to show the correct answers */
    showCorrectAnswers?: boolean;
    /** Callback when edit is clicked */
    onEdit?: (question: QuizQuestion) => void;
    /** Callback when delete is clicked */
    onDelete?: (question: QuizQuestion) => void;
    /** Whether this card is being dragged */
    isDragging?: boolean;
    /** Additional className */
    className?: string;
}

// Convert options object to array
const optionsToArray = (options: QuizOptions): { key: string; text: string }[] => {
    return Object.entries(options)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, text]) => ({ key, text }));
};

export function QuestionCard({
    question,
    canEdit = true,
    showCorrectAnswers = true,
    onEdit,
    onDelete,
    isDragging = false,
    className,
}: QuestionCardProps) {
    const questionTypeConfig = QUESTION_TYPE_CONFIG[question.question_type];
    const optionsArray = optionsToArray(question.options);

    const isCorrectAnswer = (key: string): boolean => {
        return question.correct_answers.includes(key);
    };

    return (
        <Card
            className={cn(
                'relative transition-all duration-200',
                isDragging && 'opacity-50 ring-2 ring-primary',
                className
            )}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Question Number */}
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0">
                            {question.question_order}
                        </div>

                        {/* Question Text */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-relaxed">
                                {question.question_text}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="hidden sm:flex">
                            {question.question_type === QuestionType.MCQ_SINGLE ? (
                                <CircleDot className="h-3 w-3 mr-1" />
                            ) : (
                                <CheckSquare className="h-3 w-3 mr-1" />
                            )}
                            {questionTypeConfig.label}
                        </Badge>

                        {canEdit && (onEdit || onDelete) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">More actions</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {onEdit && (
                                        <DropdownMenuItem onClick={() => onEdit(question)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Question
                                        </DropdownMenuItem>
                                    )}
                                    {onDelete && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => onDelete(question)}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete Question
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Options */}
                <div className="space-y-2">
                    {optionsArray.map((option) => {
                        const isCorrect = isCorrectAnswer(option.key);
                        return (
                            <div
                                key={option.key}
                                className={cn(
                                    'flex items-start gap-3 p-2.5 rounded-md border transition-colors',
                                    showCorrectAnswers && isCorrect
                                        ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900'
                                        : 'bg-muted/30 border-muted'
                                )}
                            >
                                {/* Option Key */}
                                <div
                                    className={cn(
                                        'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium shrink-0',
                                        showCorrectAnswers && isCorrect
                                            ? 'bg-green-500 text-white'
                                            : 'bg-muted-foreground/20 text-muted-foreground'
                                    )}
                                >
                                    {option.key}
                                </div>

                                {/* Option Text */}
                                <span className="text-sm flex-1">
                                    {option.text}
                                </span>

                                {/* Correct Answer Indicator */}
                                {showCorrectAnswers && isCorrect && (
                                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Target className="h-3.5 w-3.5" />
                        <span>{question.points} pts</span>
                    </div>

                    {question.negative_points > 0 && (
                        <div className="flex items-center gap-1 text-destructive">
                            <MinusCircle className="h-3.5 w-3.5" />
                            <span>-{question.negative_points} pts</span>
                        </div>
                    )}

                    {question.topic && (
                        <div className="flex items-center gap-1">
                            <Tag className="h-3.5 w-3.5" />
                            <span>{question.topic}</span>
                        </div>
                    )}

                    {showCorrectAnswers && question.explanation && (
                        <div className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Has explanation</span>
                        </div>
                    )}
                </div>

                {/* Explanation (if shown) */}
                {showCorrectAnswers && question.explanation && (
                    <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                        <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                            Explanation:
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                            {question.explanation}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
