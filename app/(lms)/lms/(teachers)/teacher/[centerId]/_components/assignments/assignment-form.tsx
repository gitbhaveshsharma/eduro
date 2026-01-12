/**
 * Assignment Form Component
 * 
 * Modular form component for creating and editing assignments
 * Can be used in dialogs, pages, or standalone
 * Full validation with Zod schemas
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TimePicker } from '@/components/ui/time-picker';
import { Loader2, CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    createAssignmentSchema,
    updateAssignmentSchema,
    AssignmentSubmissionType,
    CleanupFrequency,
    SUBMISSION_TYPE_CONFIG,
    CLEANUP_FREQUENCY_CONFIG,
} from '@/lib/branch-system/assignment';
import type { CreateAssignmentDTO, UpdateAssignmentDTO } from '@/lib/branch-system/types/assignment.types';
import type { z } from 'zod';

// Type for form data
type CreateFormData = z.infer<typeof createAssignmentSchema>;
type UpdateFormData = z.infer<typeof updateAssignmentSchema>;

export interface ClassOption {
    id: string;
    name: string;
    subject?: string;
}

// Define onSubmit callback types for each mode
type CreateSubmitHandler = (data: CreateAssignmentDTO) => Promise<void>;
type UpdateSubmitHandler = (data: UpdateAssignmentDTO) => Promise<void>;

// Base props shared between modes
interface BaseFormProps {
    /** Initial data for the form */
    initialData?: Partial<CreateAssignmentDTO>;
    /** Teacher ID */
    teacherId: string;
    /** Branch ID */
    branchId: string;
    /** Available classes for selection */
    availableClasses: ClassOption[];
    /** Callback on cancel */
    onCancel?: () => void;
    /** Whether form is submitting */
    isSubmitting?: boolean;
    /** Whether to show class selector (false if class is pre-selected) */
    showClassSelector?: boolean;
    /** Pre-selected class ID */
    selectedClassId?: string;
}

// Create mode props
interface CreateFormProps extends BaseFormProps {
    mode: 'create';
    assignmentId?: never;
    onSubmit: CreateSubmitHandler;
}

// Edit mode props
interface EditFormProps extends BaseFormProps {
    mode: 'edit';
    assignmentId: string;
    onSubmit: UpdateSubmitHandler;
}

export type AssignmentFormProps = CreateFormProps | EditFormProps;

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

export function AssignmentForm({
    mode,
    initialData,
    assignmentId,
    teacherId,
    branchId,
    availableClasses,
    onSubmit,
    onCancel,
    isSubmitting = false,
    showClassSelector = true,
    selectedClassId,
}: AssignmentFormProps) {
    const [dueTime, setDueTime] = useState<string>(
        initialData?.due_date ? extractTime(initialData.due_date) : '23:59'
    );
    const [publishTime, setPublishTime] = useState<string>(
        initialData?.publish_at ? extractTime(initialData.publish_at) : '09:00'
    );
    const [closeTime, setCloseTime] = useState<string>(
        initialData?.close_date ? extractTime(initialData.close_date) : '23:59'
    );

    // Default values for create mode
    const createDefaults: Partial<CreateFormData> = {
        class_id: selectedClassId || '',
        teacher_id: teacherId,
        branch_id: branchId,
        title: '',
        description: '',
        instructions: '',
        submission_type: AssignmentSubmissionType.FILE,
        max_file_size: 10485760, // 10MB
        allowed_extensions: ['pdf', 'doc', 'docx', 'txt'],
        max_submissions: 1,
        allow_late_submission: false,
        late_penalty_percentage: 0,
        max_score: 100,
        show_rubric_to_students: false,
        due_date: '',
        clean_submissions_after: CleanupFrequency.DAYS_90,
        clean_instructions_after: CleanupFrequency.DAYS_30,
    };

    // Merge with initial data
    const defaultValues = mode === 'create'
        ? { ...createDefaults, ...initialData }
        : { id: assignmentId, ...initialData };

    const form = useForm<CreateFormData>({
        resolver: zodResolver(mode === 'create' ? createAssignmentSchema : updateAssignmentSchema),
        defaultValues: defaultValues as any,
    });

    // Watch for late submission toggle
    const allowLateSubmission = form.watch('allow_late_submission');
    const submissionType = form.watch('submission_type');

    // Reset form when initialData changes
    useEffect(() => {
        if (initialData) {
            form.reset({ ...defaultValues, ...initialData } as any);
            if (initialData.due_date) setDueTime(extractTime(initialData.due_date));
            if (initialData.publish_at) setPublishTime(extractTime(initialData.publish_at));
            if (initialData.close_date) setCloseTime(extractTime(initialData.close_date));
        }
    }, [initialData]);

    // Handle form submission
    const handleSubmit = async (data: CreateFormData) => {
        try {
            if (mode === 'edit' && assignmentId) {
                // Type assertion for edit mode - onSubmit is UpdateSubmitHandler
                const updateHandler = onSubmit as UpdateSubmitHandler;
                await updateHandler({ id: assignmentId, ...data } as UpdateAssignmentDTO);
            } else {
                // Type assertion for create mode - onSubmit is CreateSubmitHandler
                const createHandler = onSubmit as CreateSubmitHandler;
                await createHandler(data as CreateAssignmentDTO);
            }
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    // Common file extensions
    const commonExtensions = [
        { value: 'pdf', label: 'PDF' },
        { value: 'doc', label: 'DOC' },
        { value: 'docx', label: 'DOCX' },
        { value: 'txt', label: 'TXT' },
        { value: 'rtf', label: 'RTF' },
        { value: 'jpg', label: 'JPG' },
        { value: 'jpeg', label: 'JPEG' },
        { value: 'png', label: 'PNG' },
        { value: 'gif', label: 'GIF' },
        { value: 'xls', label: 'XLS' },
        { value: 'xlsx', label: 'XLSX' },
        { value: 'csv', label: 'CSV' },
        { value: 'ppt', label: 'PPT' },
        { value: 'pptx', label: 'PPTX' },
        { value: 'zip', label: 'ZIP' },
    ];

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-sm border-b pb-2">Basic Information</h3>

                    {/* Class Selection */}
                    {showClassSelector && (
                        <FormField
                            control={form.control}
                            name="class_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Class *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a class" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {availableClasses.map((cls) => (
                                                <SelectItem key={cls.id} value={cls.id}>
                                                    {cls.name} {cls.subject && `(${cls.subject})`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {/* Title */}
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title *</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="e.g., Chapter 5 Homework"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Description */}
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Brief description of the assignment"
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

                    {/* Instructions */}
                    <FormField
                        control={form.control}
                        name="instructions"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Instructions</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Detailed instructions for students"
                                        className="resize-none"
                                        rows={5}
                                        {...field}
                                        value={field.value || ''}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Provide clear instructions on how to complete the assignment
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Submission Settings */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-sm border-b pb-2">Submission Settings</h3>

                    {/* Submission Type */}
                    <FormField
                        control={form.control}
                        name="submission_type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Submission Type *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select submission type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.entries(SUBMISSION_TYPE_CONFIG).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                                {config.icon} {config.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* File-specific settings */}
                    {submissionType === AssignmentSubmissionType.FILE && (
                        <>
                            {/* Max File Size */}
                            <FormField
                                control={form.control}
                                name="max_file_size"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max File Size (MB)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={100}
                                                {...field}
                                                value={Math.round((field.value || 10485760) / 1048576)}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) * 1048576)}
                                            />
                                        </FormControl>
                                        <FormDescription>Maximum file size in megabytes (1-100 MB)</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Allowed Extensions */}
                            <FormField
                                control={form.control}
                                name="allowed_extensions"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Allowed File Types</FormLabel>
                                        <div className="flex flex-wrap gap-2">
                                            {commonExtensions.map((ext) => {
                                                const isSelected = field.value?.includes(ext.value);
                                                return (
                                                    <Button
                                                        key={ext.value}
                                                        type="button"
                                                        variant={isSelected ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => {
                                                            const current = field.value || [];
                                                            if (isSelected) {
                                                                field.onChange(current.filter(e => e !== ext.value));
                                                            } else {
                                                                field.onChange([...current, ext.value]);
                                                            }
                                                        }}
                                                        className="h-8"
                                                    >
                                                        {ext.label}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                        <FormDescription>Select allowed file extensions</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </>
                    )}

                    {/* Max Submissions */}
                    <FormField
                        control={form.control}
                        name="max_submissions"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Max Submissions</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={10}
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    />
                                </FormControl>
                                <FormDescription>Maximum number of submission attempts (1-10)</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Dates & Times */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-sm border-b pb-2">Dates & Times</h3>

                    {/* Due Date */}
                    <FormField
                        control={form.control}
                        name="due_date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Due Date *</FormLabel>
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
                                                        field.onChange(formatDateTimeToISO(date, dueTime));
                                                    }
                                                }}
                                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <div className="w-32">
                                        <TimePicker
                                            value={dueTime}
                                            onChange={(time) => {
                                                setDueTime(time);
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

                    {/* Publish Date (Optional) */}
                    <FormField
                        control={form.control}
                        name="publish_at"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Publish Date (Optional)</FormLabel>
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
                                                    : 'Schedule publish'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={parseDateTimeString(field.value)}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        field.onChange(formatDateTimeToISO(date, publishTime));
                                                    }
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <div className="w-32">
                                        <TimePicker
                                            value={publishTime}
                                            onChange={(time) => {
                                                setPublishTime(time);
                                                if (field.value) {
                                                    field.onChange(formatDateTimeToISO(parseDateTimeString(field.value), time));
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <FormDescription>Leave empty to publish manually</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Close Date (Optional) */}
                    <FormField
                        control={form.control}
                        name="close_date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Close Date (Optional)</FormLabel>
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
                                                    : 'Auto-close date'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={parseDateTimeString(field.value)}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        field.onChange(formatDateTimeToISO(date, closeTime));
                                                    }
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <div className="w-32">
                                        <TimePicker
                                            value={closeTime}
                                            onChange={(time) => {
                                                setCloseTime(time);
                                                if (field.value) {
                                                    field.onChange(formatDateTimeToISO(parseDateTimeString(field.value), time));
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <FormDescription>Assignment will auto-close at this time</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Grading Settings */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-sm border-b pb-2">Grading Settings</h3>

                    {/* Max Score */}
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
                                        max={10000}
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    />
                                </FormControl>
                                <FormDescription>Total points for this assignment</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Late Submission */}
                    <FormField
                        control={form.control}
                        name="allow_late_submission"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Allow Late Submissions</FormLabel>
                                    <FormDescription>
                                        Allow students to submit after the due date
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

                    {/* Late Penalty */}
                    {allowLateSubmission && (
                        <FormField
                            control={form.control}
                            name="late_penalty_percentage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Late Penalty (%)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Percentage deducted from score for late submissions
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                {/* Cleanup Settings */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-sm border-b pb-2">Cleanup Settings</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Clean Submissions After */}
                        <FormField
                            control={form.control}
                            name="clean_submissions_after"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Delete Submissions After</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select duration" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.entries(CLEANUP_FREQUENCY_CONFIG).map(([key, config]) => (
                                                <SelectItem key={key} value={key}>
                                                    {config.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Clean Instructions After */}
                        <FormField
                            control={form.control}
                            name="clean_instructions_after"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Delete Instructions After</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select duration" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.entries(CLEANUP_FREQUENCY_CONFIG).map(([key, config]) => (
                                                <SelectItem key={key} value={key}>
                                                    {config.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4 border-t">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-none"
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none"
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mode === 'create' ? 'Create Assignment' : 'Update Assignment'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
