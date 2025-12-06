/**
 * Edit Teacher Dialog Component
 * 
 * Form for editing an existing teacher assignment
 * Features: Multi-section form with complete validation using updateTeacherByManagerSchema
 */

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBranchTeacherStore } from '@/lib/branch-system/stores/branch-teacher.store';
import {
    updateTeacherByManagerSchema,
    type UpdateTeacherByManagerInput,
} from '@/lib/branch-system/validations/branch-teacher.validation';
import { DAYS_OF_WEEK_OPTIONS, type DayOfWeek } from '@/lib/branch-system/types/branch-teacher.types';
import { showSuccessToast, showErrorToast, showLoadingToast } from '@/lib/toast';
import { toast } from 'react-hot-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Edit2 } from 'lucide-react';

/**
 * Edit Teacher Dialog Props
 */
interface EditTeacherDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    assignmentId?: string;
}

/**
 * Main Edit Teacher Dialog Component
 */
export function EditTeacherDialog({ open, onOpenChange, assignmentId }: EditTeacherDialogProps) {
    const {
        currentAssignment,
        isEditDialogOpen,
        closeEditDialog,
        updateAssignmentByManager,
        loading,
    } = useBranchTeacherStore();

    // Use props or store state for dialog open state
    const isOpen = open ?? isEditDialogOpen;
    const effectiveAssignmentId = assignmentId ?? currentAssignment?.id ?? '';
    const handleOpenChange = (openValue: boolean) => {
        if (onOpenChange) {
            onOpenChange(openValue);
        } else if (!openValue) {
            closeEditDialog();
        }
    };

    // Subject input state
    const [subjectsInput, setSubjectsInput] = useState('');

    // Initialize form with correct schema fields
    const form = useForm<UpdateTeacherByManagerInput>({
        resolver: zodResolver(updateTeacherByManagerSchema),
        defaultValues: {
            teaching_subjects: [],
            teaching_experience_years: null,
            hourly_rate: null,
            available_days: null,
            available_start_time: null,
            available_end_time: null,
            assignment_end_date: null,
            is_active: true,
            assignment_notes: null,
            performance_notes: null,
            metadata: null,
        },
    });

    // Reset form when dialog opens or currentAssignment changes
    useEffect(() => {
        if (isOpen && currentAssignment) {
            const formData = {
                teaching_subjects: currentAssignment.teaching_subjects || [],
                teaching_experience_years: currentAssignment.teaching_experience_years,
                hourly_rate: currentAssignment.hourly_rate,
                available_days: currentAssignment.available_days,
                available_start_time: currentAssignment.available_start_time,
                available_end_time: currentAssignment.available_end_time,
                assignment_end_date: currentAssignment.assignment_end_date,
                is_active: currentAssignment.is_active ?? true,
                assignment_notes: currentAssignment.assignment_notes,
                performance_notes: currentAssignment.performance_notes,
                metadata: currentAssignment.metadata,
            };
            form.reset(formData, { keepDefaultValues: false });
            setSubjectsInput('');
        }
    }, [isOpen, currentAssignment]);

    // Handle form submission
    const onSubmit = async (data: UpdateTeacherByManagerInput) => {
        const loadingToastId = showLoadingToast('Updating teacher assignment...');

        try {
            const success = await updateAssignmentByManager(effectiveAssignmentId, data);

            toast.dismiss(loadingToastId);

            if (success) {
                showSuccessToast('Teacher assignment updated successfully!');
                handleOpenChange(false);
            } else {
                showErrorToast('Failed to update teacher assignment. Please try again.');
            }
        } catch (error) {
            toast.dismiss(loadingToastId);
            showErrorToast('An unexpected error occurred.');
        }
    };

    // Handle dialog close
    const handleClose = () => {
        if (!loading) {
            form.reset();
            setSubjectsInput('');
            handleOpenChange(false);
        }
    };

    // Handle subjects input
    const handleAddSubject = () => {
        if (subjectsInput.trim()) {
            const currentSubjects = form.getValues('teaching_subjects') || [];
            if (!currentSubjects.includes(subjectsInput.trim())) {
                form.setValue('teaching_subjects', [...currentSubjects, subjectsInput.trim()]);
            }
            setSubjectsInput('');
        }
    };

    const handleRemoveSubject = (subject: string) => {
        const currentSubjects = form.getValues('teaching_subjects') || [];
        form.setValue('teaching_subjects', currentSubjects.filter((s: string) => s !== subject));
    };

    // Handle available days toggle
    const handleDayToggle = (day: DayOfWeek, checked: boolean) => {
        const currentDays = form.getValues('available_days') || [];
        if (checked) {
            form.setValue('available_days', [...currentDays, day]);
        } else {
            form.setValue('available_days', currentDays.filter((d: DayOfWeek) => d !== day));
        }
    };

    if (!currentAssignment) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto" key={currentAssignment?.id}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit2 className="h-5 w-5" />
                        Edit Teacher Assignment
                    </DialogTitle>
                    <DialogDescription>
                        Update the teacher assignment information.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 min-h-0 p-4 overflow-x-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
                            {/* Status */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Status</h3>

                                <FormField
                                    control={form.control}
                                    name="is_active"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Active Status</FormLabel>
                                                <FormDescription>
                                                    Set whether this teacher assignment is currently active
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

                            {/* Teaching Subjects */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Teaching Subjects</h3>

                                <FormField
                                    control={form.control}
                                    name="teaching_subjects"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subjects</FormLabel>
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Enter subject name"
                                                        value={subjectsInput}
                                                        onChange={(e) => setSubjectsInput(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddSubject();
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={handleAddSubject}
                                                    >
                                                        Add
                                                    </Button>
                                                </div>
                                                {(field.value?.length || 0) > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {field.value?.map((subject: string) => (
                                                            <span
                                                                key={subject}
                                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm"
                                                            >
                                                                {subject}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveSubject(subject)}
                                                                    className="hover:text-destructive"
                                                                >
                                                                    ×
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <FormDescription>
                                                Subjects this teacher will teach
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="teaching_experience_years"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Teaching Experience (Years)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="e.g., 5"
                                                    min={0}
                                                    max={60}
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            {/* Availability Schedule */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Availability</h3>

                                <FormField
                                    control={form.control}
                                    name="available_days"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Available Days</FormLabel>
                                            <div className="grid grid-cols-4 gap-2">
                                                {Object.entries(DAYS_OF_WEEK_OPTIONS).map(([day, config]) => (
                                                    <div key={day} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`edit-day-${day}`}
                                                            checked={(field.value || []).includes(day as DayOfWeek)}
                                                            onCheckedChange={(checked) => handleDayToggle(day as DayOfWeek, checked as boolean)}
                                                        />
                                                        <label
                                                            htmlFor={`edit-day-${day}`}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                        >
                                                            {config.short}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                            <FormDescription>
                                                Select the days the teacher is available
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="available_start_time"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Available Start Time</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="time"
                                                        {...field}
                                                        value={field.value || ''}
                                                        onChange={(e) => field.onChange(e.target.value || null)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="available_end_time"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Available End Time</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="time"
                                                        {...field}
                                                        value={field.value || ''}
                                                        onChange={(e) => field.onChange(e.target.value || null)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Compensation & Dates */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Compensation & Dates</h3>

                                <FormField
                                    control={form.control}
                                    name="hourly_rate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Hourly Rate</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="e.g., 500"
                                                    step="0.01"
                                                    min={0}
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Hourly rate for the teacher
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="assignment_end_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Assignment End Date</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    {...field}
                                                    value={field.value || ''}
                                                    onChange={(e) => field.onChange(e.target.value || null)}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                When the assignment is expected to end (optional)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            {/* Notes */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Notes</h3>

                                <FormField
                                    control={form.control}
                                    name="assignment_notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Assignment Notes</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Notes about this assignment..."
                                                    {...field}
                                                    value={field.value || ''}
                                                    rows={3}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="performance_notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Performance Notes</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Notes about performance..."
                                                    {...field}
                                                    value={field.value || ''}
                                                    rows={3}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Assignment
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
