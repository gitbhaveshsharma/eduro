/**
 * Enroll Class Dialog Component
 * 
 * Dialog for enrolling a student in a class
 * Features: Class search/selection, enrollment date, preferences
 * 
 * @module class-enrollments/enroll-class-dialog
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useClassEnrollmentsStore } from '@/lib/branch-system/stores/class-enrollments.store';
import {
    createClassEnrollmentSchema,
    type CreateClassEnrollmentInput,
    CLASS_ENROLLMENT_LIMITS,
} from '@/lib/branch-system/validations/class-enrollments.validation';
import { showSuccessToast, showErrorToast, showLoadingToast } from '@/lib/toast';
import { toast } from 'react-hot-toast';
import { ClassSearchSelect } from '@/components/coaching/management/class-search-select';
import type { BranchClass } from '@/lib/branch-system/types/branch-classes.types';
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
    GraduationCap,
    CalendarIcon,
    ChevronDownIcon,
    BookOpen,
    User,
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
 * Props for EnrollClassDialog
 */
interface EnrollClassDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog open state changes */
    onOpenChange: (open: boolean) => void;
    /** Student ID to enroll */
    studentId: string;
    /** Branch ID where student is enrolled */
    branchId: string;
    /** Optional branch student ID for tracking */
    branchStudentId?: string | null;
    /** Student name for display */
    studentName?: string;
    /** Coaching center ID for class search */
    coachingCenterId?: string;
    /** Callback on successful enrollment */
    onSuccess?: () => void;
}

/**
 * Enroll Class Dialog Component
 * 
 * Allows enrolling a student in a class with preferences
 */
export function EnrollClassDialog({
    open,
    onOpenChange,
    studentId,
    branchId,
    branchStudentId,
    studentName,
    coachingCenterId,
    onSuccess,
}: EnrollClassDialogProps) {
    // Store
    const { createClassEnrollment, loading } = useClassEnrollmentsStore();

    // Local state
    const [selectedClass, setSelectedClass] = useState<BranchClass | null>(null);

    // Form setup with Zod validation
    const form = useForm<CreateClassEnrollmentInput>({
        resolver: zodResolver(createClassEnrollmentSchema),
        defaultValues: {
            student_id: studentId,
            branch_id: branchId,
            class_id: '',
            branch_student_id: branchStudentId || null,
            enrollment_date: format(new Date(), 'yyyy-MM-dd'),
            enrollment_status: 'ENROLLED',
            expected_completion_date: null,
            preferred_batch: null,
            special_requirements: null,
            metadata: null,
        },
    });

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (open) {
            form.reset({
                student_id: studentId,
                branch_id: branchId,
                class_id: '',
                branch_student_id: branchStudentId || null,
                enrollment_date: format(new Date(), 'yyyy-MM-dd'),
                enrollment_status: 'ENROLLED',
                expected_completion_date: null,
                preferred_batch: null,
                special_requirements: null,
                metadata: null,
            });
            setSelectedClass(null);
        }
    }, [open, studentId, branchId, branchStudentId, form]);

    // Handle class selection
    const handleClassSelect = useCallback((cls: BranchClass) => {
        setSelectedClass(cls);
        form.setValue('class_id', cls.id);
        // Auto-set expected completion if class has end_date
        if (cls.end_date) {
            form.setValue('expected_completion_date', cls.end_date);
        }
        // Auto-set batch if class has batch_name
        if (cls.batch_name) {
            form.setValue('preferred_batch', cls.batch_name);
        }
    }, [form]);

    // Handle class clear
    const handleClassClear = useCallback(() => {
        setSelectedClass(null);
        form.setValue('class_id', '');
        form.setValue('expected_completion_date', null);
        form.setValue('preferred_batch', null);
    }, [form]);

    // Handle form submission
    const onSubmit = async (data: CreateClassEnrollmentInput) => {
        if (!selectedClass) {
            showErrorToast('Please select a class');
            return;
        }

        const loadingToastId = showLoadingToast('Enrolling in class...');

        try {
            const success = await createClassEnrollment(data);

            toast.dismiss(loadingToastId);

            if (success) {
                showSuccessToast(`Successfully enrolled in ${selectedClass.class_name}`);
                onOpenChange(false);
                onSuccess?.();
            } else {
                showErrorToast('Failed to enroll in class. Please try again.');
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
            setSelectedClass(null);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Enroll in Class
                    </DialogTitle>
                    <DialogDescription>
                        Select a class to enroll {studentName ? `"${studentName}"` : 'the student'} in.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 min-h-0 p-4 overflow-x-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
                            {/* Student Info Display */}
                            {studentName && (
                                <div className="p-3 border rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{studentName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Student ID: {studentId.slice(0, 8)}...
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Separator />

                            {/* Class Selection */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    Class Selection
                                </h3>

                                <FormField
                                    control={form.control}
                                    name="class_id"
                                    render={() => (
                                        <FormItem>
                                            <ClassSearchSelect
                                                selectedClass={selectedClass}
                                                onSelect={handleClassSelect}
                                                onClear={handleClassClear}
                                                branchId={branchId}
                                                coachingCenterId={coachingCenterId}
                                                label="Select Class *"
                                                placeholder="Search for a class by name or subject"
                                                required
                                                error={form.formState.errors.class_id?.message}
                                            />
                                            <FormDescription>
                                                Choose the class to enroll the student in
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Selected Class Info */}
                                {selectedClass && (
                                    <div className="p-3 border rounded-lg bg-accent/30">
                                        <div className="grid gap-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Subject:</span>
                                                <span className="font-medium">{selectedClass.subject || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Grade Level:</span>
                                                <span className="font-medium">{selectedClass.grade_level || 'N/A'}</span>
                                            </div>
                                            {selectedClass.fees_frequency && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Fees Frequency:</span>
                                                    <span className="font-medium">{selectedClass.fees_frequency}</span>
                                                </div>
                                            )}
                                            {selectedClass.batch_name && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Batch:</span>
                                                    <span className="font-medium">{selectedClass.batch_name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Enrollment Details */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Enrollment Details</h3>

                                <div className="grid gap-4 md:grid-cols-2">
                                    {/* Enrollment Date */}
                                    <FormField
                                        control={form.control}
                                        name="enrollment_date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Enrollment Date *</FormLabel>
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
                                                                format(parseDateFromString(field.value) || new Date(), 'PPP')
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={parseDateFromString(field.value) || undefined}
                                                            onSelect={(date) =>
                                                                field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                                                            }
                                                            disabled={(date) =>
                                                                date > new Date() ||
                                                                date < new Date(`${CLASS_ENROLLMENT_LIMITS.MIN_YEAR}-01-01`)
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

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
                                                                format(parseDateFromString(field.value) || new Date(), 'PPP')
                                                            ) : (
                                                                <span>Optional</span>
                                                            )}
                                                            <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={parseDateFromString(field.value) || undefined}
                                                            onSelect={(date) =>
                                                                field.onChange(date ? format(date, 'yyyy-MM-dd') : null)
                                                            }
                                                            disabled={(date) =>
                                                                date < new Date()
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Preferences */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Preferences (Optional)</h3>

                                <FormField
                                    control={form.control}
                                    name="preferred_batch"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Preferred Batch</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g., Morning Batch, Evening Batch"
                                                    {...field}
                                                    value={field.value || ''}
                                                    onChange={(e) => field.onChange(e.target.value || null)}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Specify preferred batch timing if applicable
                                            </FormDescription>
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
                                                <Textarea
                                                    placeholder="Any special requirements or notes..."
                                                    rows={3}
                                                    {...field}
                                                    value={field.value || ''}
                                                    onChange={(e) => field.onChange(e.target.value || null)}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Note any accommodations or special needs
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Form Actions */}
                            <DialogFooter className="pt-4">
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
                                    disabled={loading || !selectedClass}
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Enroll in Class
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
