/**
 * Question Form Component
 * 
 * Form for creating and editing quiz questions
 * Uses react-hook-form with Zod validation
 * Supports MCQ single and multi-choice questions
 */

'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
    Loader2,
    Save,
    X,
    Plus,
    Trash2,
    GripVertical,
    CircleDot,
    CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
    QuizQuestion,
    CreateQuestionDTO,
    UpdateQuestionDTO,
    QuizOptions,
} from '@/lib/branch-system/types/quiz.types';
import { QuestionType } from '@/lib/branch-system/types/quiz.types';
import { QUESTION_TYPE_CONFIG } from '@/lib/branch-system/quiz';
import {
    createQuestionFormSchema,
} from '@/lib/branch-system/validations/quiz.validation';
import {
    optionsToArray,
    optionsToObject,
    generateOptionKey,
} from '@/lib/branch-system/utils/quiz.utils';

// Option type for managing options in form
interface OptionItem {
    key: string;
    text: string;
}

type QuestionFormValues = z.infer<ReturnType<typeof createQuestionFormSchema>>;

export interface QuestionFormProps {
    /** Mode: create or edit */
    mode: 'create' | 'edit';
    /** Quiz ID (required for create mode) */
    quizId: string;
    /** Quiz max score (for points validation) */
    quizMaxScore: number;
    /** Maximum allowed points for this question */
    maxAllowedPoints: number;
    /** Remaining available points (for create mode) */
    remainingPoints?: number;
    /** Current question order (for create mode) */
    questionOrder: number;
    /** Initial values (for edit mode) */
    initialData?: QuizQuestion;
    /** Callback when form is submitted */
    onSubmit: (data: CreateQuestionDTO | UpdateQuestionDTO) => Promise<void>;
    /** Callback when form is cancelled */
    onCancel: () => void;
    /** Whether the form is submitting */
    isSubmitting?: boolean;
    /** Additional className */
    className?: string;
}

export function QuestionForm({
    mode,
    quizId,
    quizMaxScore,
    maxAllowedPoints,
    remainingPoints,
    questionOrder,
    initialData,
    onSubmit,
    onCancel,
    isSubmitting = false,
    className,
}: QuestionFormProps) {
    // Initial options for create mode
    const defaultOptions: OptionItem[] = [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' },
    ];

    // Get initial values
    const getDefaultValues = (): Partial<QuestionFormValues> => {
        if (mode === 'edit' && initialData) {
            return {
                question_text: initialData.question_text,
                question_type: initialData.question_type,
                options: optionsToArray(initialData.options),
                correct_answers: initialData.correct_answers,
                points: initialData.points,
                negative_points: initialData.negative_points,
                explanation: initialData.explanation,
                topic: initialData.topic,
            };
        }

        return {
            question_text: '',
            question_type: QuestionType.MCQ_SINGLE,
            options: defaultOptions,
            correct_answers: [],
            points: 1,
            negative_points: 0,
            explanation: '',
            topic: '',
        };
    };

    const form = useForm<QuestionFormValues>({
        resolver: zodResolver(createQuestionFormSchema(maxAllowedPoints)),
        defaultValues: getDefaultValues(),
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'options',
    });

    const questionType = form.watch('question_type');
    const selectedAnswers = form.watch('correct_answers');
    // Live points tracking
    const enteredPoints = Number(form.watch('points') ?? 0);
    const effectiveRemaining = (mode === 'create')
        ? ((remainingPoints ?? maxAllowedPoints) - enteredPoints)
        : (quizMaxScore - enteredPoints);
    const exceedsAllowed = effectiveRemaining < 0;
    const disableSubmit = isSubmitting || (
        mode === 'create' && ((remainingPoints ?? maxAllowedPoints) <= 0 || exceedsAllowed)
    ) || (mode === 'edit' && exceedsAllowed);

    // Reset correct answers when question type changes
    useEffect(() => {
        if (questionType === QuestionType.MCQ_SINGLE && selectedAnswers.length > 1) {
            form.setValue('correct_answers', [selectedAnswers[0]]);
        }
    }, [questionType, selectedAnswers, form]);

    // Handle form submission
    const handleSubmit = async (values: QuestionFormValues) => {
        const optionsObject = optionsToObject(values.options);

        // Validate correct answers against options
        const validOptions = values.options.map(o => o.key);
        const validCorrectAnswers = values.correct_answers.filter(a => validOptions.includes(a));

        if (validCorrectAnswers.length === 0) {
            form.setError('correct_answers', {
                message: 'Please select at least one correct answer'
            });
            return;
        }

        if (mode === 'create') {
            const createData: CreateQuestionDTO = {
                quiz_id: quizId,
                question_text: values.question_text,
                question_type: values.question_type,
                options: optionsObject,
                correct_answers: validCorrectAnswers,
                points: values.points,
                negative_points: values.negative_points,
                explanation: values.explanation || undefined,
                question_order: questionOrder,
                topic: values.topic || undefined,
            };
            await onSubmit(createData);
        } else {
            const updateData: UpdateQuestionDTO = {
                id: initialData!.id,
                question_text: values.question_text,
                question_type: values.question_type,
                options: optionsObject,
                correct_answers: validCorrectAnswers,
                points: values.points,
                negative_points: values.negative_points,
                explanation: values.explanation || undefined,
                question_order: initialData!.question_order,
                topic: values.topic || undefined,
            };
            await onSubmit(updateData);
        }
    };

    // Add new option
    const handleAddOption = () => {
        if (fields.length < 10) {
            const newKey = generateOptionKey(fields.length);
            append({ key: newKey, text: '' });
        }
    };

    // Remove option
    const handleRemoveOption = (index: number) => {
        if (fields.length > 2) {
            const removedKey = fields[index].key;
            remove(index);

            // Remove from correct answers if selected
            const currentAnswers = form.getValues('correct_answers');
            const updatedAnswers = currentAnswers.filter(a => a !== removedKey);
            form.setValue('correct_answers', updatedAnswers);
        }
    };

    // Toggle correct answer for multi-choice
    const handleToggleCorrectAnswer = (key: string) => {
        const currentAnswers = form.getValues('correct_answers');

        if (questionType === QuestionType.MCQ_SINGLE) {
            form.setValue('correct_answers', [key]);
        } else {
            if (currentAnswers.includes(key)) {
                const updated = currentAnswers.filter(a => a !== key);
                form.setValue('correct_answers', updated);
            } else {
                form.setValue('correct_answers', [...currentAnswers, key]);
            }
        }
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className={cn('space-y-6', className)}
            >
                {/* Question Text */}
                <FormField
                    control={form.control}
                    name="question_text"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Question Text *</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Enter your question..."
                                    rows={3}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Question Type & Points Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="question_type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Question Type *</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.entries(QUESTION_TYPE_CONFIG).map(([type, config]) => (
                                            <SelectItem key={type} value={type}>
                                                <div className="flex items-center gap-2">
                                                    {type === 'MCQ_SINGLE' ? (
                                                        <CircleDot className="h-4 w-4" />
                                                    ) : (
                                                        <CheckSquare className="h-4 w-4" />
                                                    )}
                                                    {config.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    {questionType === QuestionType.MCQ_SINGLE
                                        ? 'Student can select one answer'
                                        : 'Student can select multiple answers'}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="points"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Points *</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={0.1}
                                        max={maxAllowedPoints}
                                        step="any"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                                    />
                                </FormControl>
                                <FormDescription>
                                    {mode === 'create'
                                        ? `Max ${maxAllowedPoints} points available`
                                        : `Max ${quizMaxScore} points (quiz total)`
                                    }
                                </FormDescription>
                                {/* Live remaining after this question */}
                                <div className="mt-1 text-sm">
                                    {mode === 'create' ? (
                                        remainingPoints === 0 ? (
                                            <span className="text-destructive">No points remaining.</span>
                                        ) : exceedsAllowed ? (
                                            <span className="text-destructive">Over by {Math.abs(effectiveRemaining)} points</span>
                                        ) : (
                                            <span className="text-muted-foreground">{effectiveRemaining} points remaining after this question</span>
                                        )
                                    ) : (
                                        exceedsAllowed ? (
                                            <span className="text-destructive">Exceeds quiz max by {Math.abs(effectiveRemaining)} points</span>
                                        ) : (
                                            <span className="text-muted-foreground">{effectiveRemaining} points remaining (quiz)</span>
                                        )
                                    )}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="negative_points"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Negative Points</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={maxAllowedPoints}
                                        step="any"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Points deducted for wrong answer
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Separator />

                {/* Options Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">
                            Answer Options *
                        </Label>
                        {fields.length < 10 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddOption}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Option
                            </Button>
                        )}
                    </div>

                    <FormDescription>
                        {questionType === QuestionType.MCQ_SINGLE
                            ? 'Click the radio button to mark the correct answer'
                            : 'Check the boxes to mark all correct answers'}
                    </FormDescription>

                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <Card key={field.id} className="relative">
                                <CardContent className="p-3">
                                    <div className="flex items-start gap-3">
                                        {/* Correct Answer Selection */}
                                        <div className="pt-2">
                                            {questionType === QuestionType.MCQ_SINGLE ? (
                                                <RadioGroup
                                                    value={selectedAnswers[0] || ''}
                                                    onValueChange={(value) => handleToggleCorrectAnswer(value)}
                                                >
                                                    <RadioGroupItem
                                                        value={field.key}
                                                        className="mt-0.5"
                                                    />
                                                </RadioGroup>
                                            ) : (
                                                <Checkbox
                                                    checked={selectedAnswers.includes(field.key)}
                                                    onCheckedChange={() => handleToggleCorrectAnswer(field.key)}
                                                />
                                            )}
                                        </div>

                                        {/* Option Key Badge */}
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium shrink-0">
                                            {field.key}
                                        </div>

                                        {/* Option Text Input */}
                                        <FormField
                                            control={form.control}
                                            name={`options.${index}.text`}
                                            render={({ field: inputField }) => (
                                                <FormItem className="flex-1 space-y-0">
                                                    <FormControl>
                                                        <Input
                                                            placeholder={`Option ${field.key}...`}
                                                            {...inputField}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Remove Button */}
                                        {fields.length > 2 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="shrink-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleRemoveOption(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {form.formState.errors.correct_answers && (
                        <p className="text-sm text-destructive">
                            {form.formState.errors.correct_answers.message}
                        </p>
                    )}
                </div>

                <Separator />

                {/* Additional Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="topic"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Topic (Optional)</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="e.g., Algebra, Grammar"
                                        {...field}
                                        value={field.value || ''}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Categorize this question by topic
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Explanation */}
                <FormField
                    control={form.control}
                    name="explanation"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Explanation (Optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Explain why this is the correct answer..."
                                    rows={2}
                                    {...field}
                                    value={field.value || ''}
                                />
                            </FormControl>
                            <FormDescription>
                                Shown to students after quiz if enabled
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        <X className="h-4 w-4 mr-1.5" />
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || (mode === 'create' && remainingPoints === 0)}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                {mode === 'create' ? 'Creating...' : 'Saving...'}
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-1.5" />
                                {mode === 'create'
                                    ? (remainingPoints === 0 ? 'No Points Available' : 'Create Question')
                                    : 'Save Changes'
                                }
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
