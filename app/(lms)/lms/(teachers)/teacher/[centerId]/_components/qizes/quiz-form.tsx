/**
 * Quiz Form Component
 * 
 * Form for creating and editing quizzes
 * Uses react-hook-form with Zod validation
 * Mobile-first responsive design
 */

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
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
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TimePicker } from '@/components/ui/time-picker';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, X, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Quiz, CreateQuizDTO, UpdateQuizDTO } from '@/lib/branch-system/types/quiz.types';
import { CleanupFrequency } from '@/lib/branch-system/types/quiz.types';
import { createQuizSchema, updateQuizSchema } from '@/lib/branch-system/quiz';
import { getCurrentDateTime } from '@/lib/branch-system/quiz';

// Form schema for create mode
const createFormSchema = createQuizSchema;

// Form schema for edit mode (partial)
const editFormSchema = updateQuizSchema;

// Combined form type
type QuizFormValues = z.infer<typeof createFormSchema>;
type QuizEditFormValues = z.infer<typeof editFormSchema>;

export interface QuizFormProps {
    /** Mode: create or edit */
    mode: 'create' | 'edit';
    /** Initial values (for edit mode) */
    initialData?: Quiz;
    /** Available classes for selection */
    availableClasses: Array<{
        id: string;
        name: string;
        subject?: string;
    }>;
    /** Teacher ID */
    teacherId: string;
    /** Branch ID */
    branchId: string;
    /** Callback when form is submitted */
    onSubmit: (data: CreateQuizDTO | UpdateQuizDTO) => Promise<void>;
    /** Callback when form is cancelled */
    onCancel: () => void;
    /** Whether the form is submitting */
    isSubmitting?: boolean;
    /** Additional className */
    className?: string;
}

// Helper to parse date string to Date object
function parseDateTimeString(dateTimeStr: string | undefined): Date | undefined {
    if (!dateTimeStr) return undefined;
    const date = new Date(dateTimeStr);
    return isNaN(date.getTime()) ? undefined : date;
}

// Helper to format Date to ISO string
function formatDateTimeToISO(date: Date | undefined, time?: string): string {
    if (!date) return '';
    const dateStr = format(date, 'yyyy-MM-dd');
    if (time) {
        return `${dateStr}T${time}:00`;
    }
    return `${dateStr}T23:59:00`;
}

// Extract time from datetime string
function extractTime(dateTimeStr: string | undefined): string {
    if (!dateTimeStr) return '23:59';
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return '23:59';
    return format(date, 'HH:mm');
}

export function QuizForm({
    mode,
    initialData,
    availableClasses,
    teacherId,
    branchId,
    onSubmit,
    onCancel,
    isSubmitting = false,
    className,
}: QuizFormProps) {
    // State for time values
    const [availableFromTime, setAvailableFromTime] = useState<string>(
        initialData?.available_from ? extractTime(initialData.available_from) : '09:00'
    );
    const [availableToTime, setAvailableToTime] = useState<string>(
        initialData?.available_to ? extractTime(initialData.available_to) : '23:59'
    );

    // Default values for create mode
    const getDefaultValues = (): Partial<QuizFormValues> => {
        const now = new Date();
        const defaultFrom = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
        const defaultTo = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

        if (mode === 'edit' && initialData) {
            return {
                class_id: initialData.class_id,
                teacher_id: initialData.teacher_id,
                branch_id: initialData.branch_id,
                title: initialData.title,
                description: initialData.description || '',
                instructions: initialData.instructions || '',
                available_from: initialData.available_from,
                available_to: initialData.available_to,
                time_limit_minutes: initialData.time_limit_minutes,
                submission_window_minutes: initialData.submission_window_minutes,
                shuffle_questions: initialData.shuffle_questions,
                shuffle_options: initialData.shuffle_options,
                show_correct_answers: initialData.show_correct_answers,
                show_score_immediately: initialData.show_score_immediately,
                allow_multiple_attempts: initialData.allow_multiple_attempts,
                max_attempts: initialData.max_attempts,
                require_webcam: initialData.require_webcam,
                max_score: initialData.max_score,
                passing_score: initialData.passing_score,
                clean_attempts_after: initialData.clean_attempts_after,
                clean_questions_after: initialData.clean_questions_after,
            };
        }

        return {
            class_id: availableClasses[0]?.id || '',
            teacher_id: teacherId,
            branch_id: branchId,
            title: '',
            description: '',
            instructions: '',
            available_from: defaultFrom.toISOString(),
            available_to: defaultTo.toISOString(),
            time_limit_minutes: 30,
            submission_window_minutes: 5,
            shuffle_questions: false,
            shuffle_options: false,
            show_correct_answers: false,
            show_score_immediately: true,
            allow_multiple_attempts: false,
            max_attempts: 1,
            require_webcam: false,
            max_score: 100,
            passing_score: null,
            clean_attempts_after: CleanupFrequency.DAYS_90,
            clean_questions_after: CleanupFrequency.NEVER,
        };
    };

    const form = useForm<QuizFormValues>({
        resolver: zodResolver(mode === 'create' ? createFormSchema : editFormSchema),
        defaultValues: getDefaultValues(),
    });

    // Update hidden fields when props change
    useEffect(() => {
        if (mode === 'create') {
            form.setValue('teacher_id', teacherId);
            form.setValue('branch_id', branchId);
        }
    }, [teacherId, branchId, mode, form]);

    // Watch allow_multiple_attempts to sync max_attempts
    const allowMultipleAttempts = form.watch('allow_multiple_attempts');

    useEffect(() => {
        if (!allowMultipleAttempts) {
            form.setValue('max_attempts', 1);
        }
    }, [allowMultipleAttempts, form]);

    const handleSubmit = async (values: QuizFormValues) => {
        if (mode === 'edit' && initialData) {
            const updateData: UpdateQuizDTO = {
                id: initialData.id,
                ...values,
            };
            await onSubmit(updateData);
        } else {
            await onSubmit(values as CreateQuizDTO);
        }
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className={cn('space-y-6', className)}
            >
                {/* Basic Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>

                    <FormField
                        control={form.control}
                        name="class_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Class *</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={mode === 'edit'}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a class" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {availableClasses.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id}>
                                                {cls.name}
                                                {cls.subject && ` - ${cls.subject}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title *</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter quiz title"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Brief description of the quiz"
                                        className="resize-none"
                                        rows={3}
                                        {...field}
                                        value={field.value || ''}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="instructions"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Instructions</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Instructions for students taking the quiz"
                                        className="resize-none"
                                        rows={4}
                                        {...field}
                                        value={field.value || ''}
                                    />
                                </FormControl>
                                <FormDescription>
                                    These instructions will be shown to students before they start the quiz.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Separator />

                {/* Availability */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Availability</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="available_from"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Available From *</FormLabel>
                                    <div className="flex gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        'flex-1 justify-start text-left font-normal',
                                                        !field.value && 'text-muted-foreground'
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value
                                                        ? format(parseDateTimeString(field.value) || new Date(), 'PPP')
                                                        : 'Pick a date'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={parseDateTimeString(field.value)}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            field.onChange(formatDateTimeToISO(date, availableFromTime));
                                                        }
                                                    }}
                                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <div className="w-32">
                                            <TimePicker
                                                value={availableFromTime}
                                                onChange={(time) => {
                                                    setAvailableFromTime(time);
                                                    if (field.value) {
                                                        field.onChange(formatDateTimeToISO(parseDateTimeString(field.value), time));
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="available_to"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Available Until *</FormLabel>
                                    <div className="flex gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        'flex-1 justify-start text-left font-normal',
                                                        !field.value && 'text-muted-foreground'
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value
                                                        ? format(parseDateTimeString(field.value) || new Date(), 'PPP')
                                                        : 'Pick a date'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={parseDateTimeString(field.value)}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            field.onChange(formatDateTimeToISO(date, availableToTime));
                                                        }
                                                    }}
                                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <div className="w-32">
                                            <TimePicker
                                                value={availableToTime}
                                                onChange={(time) => {
                                                    setAvailableToTime(time);
                                                    if (field.value) {
                                                        field.onChange(formatDateTimeToISO(parseDateTimeString(field.value), time));
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="time_limit_minutes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Time Limit (minutes)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="No time limit"
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                field.onChange(val ? parseInt(val, 10) : null);
                                            }}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Leave empty for no time limit
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="submission_window_minutes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Submission Window (minutes)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={60}
                                            {...field}
                                            value={field.value ?? 5}
                                            onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Extra time allowed after quiz ends to submit
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                {/* Scoring */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Scoring</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="max_score"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Maximum Score *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="passing_score"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Passing Score</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={0}
                                            placeholder="No passing score"
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                field.onChange(val ? parseFloat(val) : null);
                                            }}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Leave empty if no passing score is required
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                {/* Quiz Settings */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Quiz Settings</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="shuffle_questions"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Shuffle Questions</FormLabel>
                                        <FormDescription>
                                            Randomize question order for each student
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="shuffle_options"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Shuffle Options</FormLabel>
                                        <FormDescription>
                                            Randomize answer options order
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="show_score_immediately"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Show Score Immediately</FormLabel>
                                        <FormDescription>
                                            Display score after quiz completion
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="show_correct_answers"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Show Correct Answers</FormLabel>
                                        <FormDescription>
                                            Reveal correct answers after completion
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                {/* Attempts */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Attempts</h3>

                    <FormField
                        control={form.control}
                        name="allow_multiple_attempts"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel>Allow Multiple Attempts</FormLabel>
                                    <FormDescription>
                                        Let students retake the quiz
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    {allowMultipleAttempts && (
                        <FormField
                            control={form.control}
                            name="max_attempts"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Maximum Attempts</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={10}
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="require_webcam"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel>Require Webcam</FormLabel>
                                    <FormDescription>
                                        Student must enable webcam during quiz
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <Separator />

                {/* Cleanup Settings */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Data Retention</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="clean_attempts_after"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Clean Attempts After</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select retention period" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={CleanupFrequency.DAYS_30}>30 Days</SelectItem>
                                            <SelectItem value={CleanupFrequency.DAYS_60}>60 Days</SelectItem>
                                            <SelectItem value={CleanupFrequency.DAYS_90}>90 Days</SelectItem>
                                            <SelectItem value={CleanupFrequency.SEMESTER_END}>End of Semester</SelectItem>
                                            <SelectItem value={CleanupFrequency.NEVER}>Never</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        When to automatically remove attempt data
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="clean_questions_after"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Clean Questions After</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select retention period" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={CleanupFrequency.DAYS_30}>30 Days</SelectItem>
                                            <SelectItem value={CleanupFrequency.DAYS_60}>60 Days</SelectItem>
                                            <SelectItem value={CleanupFrequency.DAYS_90}>90 Days</SelectItem>
                                            <SelectItem value={CleanupFrequency.SEMESTER_END}>End of Semester</SelectItem>
                                            <SelectItem value={CleanupFrequency.NEVER}>Never</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        When to automatically remove questions
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        <X className="h-4 w-4 mr-1.5" />
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                {mode === 'create' ? 'Creating...' : 'Saving...'}
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-1.5" />
                                {mode === 'create' ? 'Create Quiz' : 'Save Changes'}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
