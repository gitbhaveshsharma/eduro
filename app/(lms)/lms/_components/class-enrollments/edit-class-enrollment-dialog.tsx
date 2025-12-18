/**
 * Edit Class Enrollment Dialog Component
 * 
 * Dialog for editing class enrollment details (grades, attendance, status)
 * Features: Status update, grade entry, performance notes, attendance tracking
 * 
 * @module class-enrollments/edit-class-enrollment-dialog
 */

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useClassEnrollmentsStore } from '@/lib/branch-system/stores/class-enrollments.store';
import {
    updateClassEnrollmentByManagerSchema,
    type UpdateClassEnrollmentByManagerInput,
    CLASS_ENROLLMENT_LIMITS,
} from '@/lib/branch-system/validations/class-enrollments.validation';
import {
    CLASS_ENROLLMENT_STATUS_OPTIONS,
    type ClassEnrollmentStatus,
} from '@/lib/branch-system/types/class-enrollments.types';
import { showSuccessToast, showErrorToast, showLoadingToast } from '@/lib/toast';
import { toast } from 'react-hot-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Loader2,
    Edit,
    CalendarIcon,
    ChevronDownIcon,
    GraduationCap,
    TrendingUp,
    ClipboardList,
} from 'lucide-react';

/**
 * Helper function to parse date string to Date object
 */
const parseDateFromString = (dateString?: string | null): Date | undefined => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
};

/**
 * Edit Class Enrollment Dialog Component
 * 
 * Uses store state for dialog visibility and current enrollment
 */
export function EditClassEnrollmentDialog() {
    const {
        currentEnrollment,
        currentEnrollmentWithRelations,
        isEditDialogOpen,
        updateEnrollmentByManager,
        loading,
        closeEditDialog,
    } = useClassEnrollmentsStore();

    const enrollment = currentEnrollmentWithRelations || currentEnrollment;
    const isOpen = isEditDialogOpen && !!enrollment;

    // Form setup with Zod validation
    const form = useForm<UpdateClassEnrollmentByManagerInput>({
        resolver: zodResolver(updateClassEnrollmentByManagerSchema),
        defaultValues: {
            enrollment_status: undefined,
            expected_completion_date: undefined,
            actual_completion_date: undefined,
            attendance_percentage: undefined,
            current_grade: undefined,
            performance_notes: undefined,
            preferred_batch: undefined,
            special_requirements: undefined,
            metadata: undefined,
        },
    });

    // Load enrollment data when dialog opens
    useEffect(() => {
        if (enrollment) {
            const formData: UpdateClassEnrollmentByManagerInput = {
                enrollment_status: enrollment.enrollment_status,
                expected_completion_date: enrollment.expected_completion_date || undefined,
                actual_completion_date: enrollment.actual_completion_date || undefined,
                attendance_percentage: enrollment.attendance_percentage,
                current_grade: enrollment.current_grade || undefined,
                performance_notes: enrollment.performance_notes || undefined,
                preferred_batch: enrollment.preferred_batch || undefined,
                special_requirements: enrollment.special_requirements || undefined,
                metadata: enrollment.metadata || undefined,
            };
            form.reset(formData, { keepDefaultValues: false });
        }
    }, [enrollment, form]);

    // Handle form submission
    const onSubmit = async (data: UpdateClassEnrollmentByManagerInput) => {
        if (!enrollment) return;

        const loadingToastId = showLoadingToast('Updating enrollment...');

        try {
            const success = await updateEnrollmentByManager(enrollment.id, data);

            toast.dismiss(loadingToastId);

            if (success) {
                showSuccessToast('Enrollment updated successfully!');
                closeEditDialog();
            } else {
                showErrorToast('Failed to update enrollment. Please try again.');
            }
        } catch (error) {
            toast.dismiss(loadingToastId);
            showErrorToast('An unexpected error occurred.');
        }
    };

    // Get class name for display
    const getClassName = () => {
        if (currentEnrollmentWithRelations?.class) {
            return currentEnrollmentWithRelations.class.class_name;
        }
        return null;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeEditDialog()}>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto" key={enrollment?.id}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit className="h-5 w-5" />
                        Edit Class Enrollment
                    </DialogTitle>
                    <DialogDescription>
                        Update enrollment details{getClassName() ? ` for "${getClassName()}"` : ''}.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 min-h-0 p-4 overflow-x-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Enrollment Status */}
                            <div className="space-y-4 p-4">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <ClipboardList className="h-4 w-4" />
                                    Enrollment Status
                                </h3>

                                <FormField
                                    control={form.control}
                                    name="enrollment_status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.entries(CLASS_ENROLLMENT_STATUS_OPTIONS).map(
                                                        ([status, config]) => (
                                                            <SelectItem key={status} value={status}>
                                                                <div className="flex items-center gap-2">
                                                                    <span
                                                                        className="w-2 h-2 rounded-full"
                                                                        style={{ backgroundColor: config.color }}
                                                                    />
                                                                    {config.label}
                                                                </div>
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Current enrollment status in this class
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            {/* Academic Performance */}
                            <div className="space-y-4 p-4">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4" />
                                    Academic Performance
                                </h3>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="current_grade"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Current Grade</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g., A+, 95%, Pass"
                                                        {...field}
                                                        value={field.value || ''}
                                                        onChange={(e) =>
                                                            field.onChange(e.target.value || undefined)
                                                        }
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Student's current grade in this class
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="attendance_percentage"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Attendance %</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min={CLASS_ENROLLMENT_LIMITS.ATTENDANCE_MIN}
                                                        max={CLASS_ENROLLMENT_LIMITS.ATTENDANCE_MAX}
                                                        placeholder="e.g., 85.5"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target.value
                                                                    ? parseFloat(e.target.value)
                                                                    : undefined
                                                            )
                                                        }
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Attendance percentage (0-100)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="performance_notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Performance Notes</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Notes about student's performance, behavior, etc."
                                                    rows={3}
                                                    {...field}
                                                    value={field.value || ''}
                                                    onChange={(e) =>
                                                        field.onChange(e.target.value || undefined)
                                                    }
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Teacher/manager notes on performance
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            {/* Dates */}
                            <div className="space-y-4 p-4">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Timeline
                                </h3>

                                <div className="grid gap-4 md:grid-cols-2">
                                    {/* Expected Completion Date */}
                                    <FormField
                                        control={form.control}
                                        name="expected_completion_date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Expected Completion</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal inline-flex items-center px-3 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {field.value ? (
                                                                format(
                                                                    parseDateFromString(field.value) || new Date(),
                                                                    'PPP'
                                                                )
                                                            ) : (
                                                                <span>Not set</span>
                                                            )}
                                                            <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={
                                                                parseDateFromString(field.value) || undefined
                                                            }
                                                            onSelect={(date) =>
                                                                field.onChange(
                                                                    date ? format(date, 'yyyy-MM-dd') : undefined
                                                                )
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Actual Completion Date */}
                                    <FormField
                                        control={form.control}
                                        name="actual_completion_date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Actual Completion</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal inline-flex items-center px-3 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {field.value ? (
                                                                format(
                                                                    parseDateFromString(field.value) || new Date(),
                                                                    'PPP'
                                                                )
                                                            ) : (
                                                                <span>Not completed</span>
                                                            )}
                                                            <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={
                                                                parseDateFromString(field.value) || undefined
                                                            }
                                                            onSelect={(date) =>
                                                                field.onChange(
                                                                    date ? format(date, 'yyyy-MM-dd') : undefined
                                                                )
                                                            }
                                                            disabled={(date) => date > new Date()}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormDescription>
                                                    Set when marking as COMPLETED
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Preferences */}
                            <div className="space-y-4 p-4">
                                <h3 className="text-sm font-semibold">Preferences</h3>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="preferred_batch"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Preferred Batch</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g., Morning Batch"
                                                        {...field}
                                                        value={field.value || ''}
                                                        onChange={(e) =>
                                                            field.onChange(e.target.value || undefined)
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="special_requirements"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Special Requirements</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Any special needs"
                                                        {...field}
                                                        value={field.value || ''}
                                                        onChange={(e) =>
                                                            field.onChange(e.target.value || undefined)
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Form Actions */}
                            <DialogFooter className="pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeEditDialog}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
