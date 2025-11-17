/**
 * Edit Enrollment Dialog Component
 * 
 * Form for editing an existing student enrollment (Manager permissions)
 * Features: Pre-filled form with manager update fields using updateStudentByManagerSchema
 */

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';
import {
    updateStudentByManagerSchema,
    type UpdateStudentByManagerInput,
} from '@/lib/branch-system/validations/branch-students.validation';
import { ENROLLMENT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/lib/branch-system/types/branch-students.types';
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
import { Loader2, Edit } from 'lucide-react';

/**
 * Edit Enrollment Dialog Component
 */
export function EditEnrollmentDialog() {
    const {
        currentEnrollment,
        updateEnrollmentByManager,
        loading,
        setCurrentEnrollment,
    } = useBranchStudentsStore();

    const isOpen = !!currentEnrollment;

    // Initialize form
    const form = useForm<UpdateStudentByManagerInput>({
        resolver: zodResolver(updateStudentByManagerSchema),
    });

    // Load enrollment data when dialog opens
    useEffect(() => {
        if (currentEnrollment) {
            form.reset({
                class_id: currentEnrollment.class_id,
                expected_completion_date: currentEnrollment.expected_completion_date,
                actual_completion_date: currentEnrollment.actual_completion_date,
                enrollment_status: currentEnrollment.enrollment_status,
                payment_status: currentEnrollment.payment_status,
                attendance_percentage: currentEnrollment.attendance_percentage,
                current_grade: currentEnrollment.current_grade,
                performance_notes: currentEnrollment.performance_notes,
                total_fees_due: currentEnrollment.total_fees_due,
                total_fees_paid: currentEnrollment.total_fees_paid,
                last_payment_date: currentEnrollment.last_payment_date,
                next_payment_due: currentEnrollment.next_payment_due,
                emergency_contact_name: currentEnrollment.emergency_contact_name,
                emergency_contact_phone: currentEnrollment.emergency_contact_phone,
                parent_guardian_name: currentEnrollment.parent_guardian_name,
                parent_guardian_phone: currentEnrollment.parent_guardian_phone,
                preferred_batch: currentEnrollment.preferred_batch,
                special_requirements: currentEnrollment.special_requirements,
                metadata: currentEnrollment.metadata,
            });
        }
    }, [currentEnrollment, form]);

    // Handle form submission
    const onSubmit = async (data: UpdateStudentByManagerInput) => {
        if (!currentEnrollment) return;

        const loadingToastId = showLoadingToast('Updating enrollment...');

        try {
            const success = await updateEnrollmentByManager(currentEnrollment.id, data);

            toast.dismiss(loadingToastId);

            if (success) {
                showSuccessToast('Enrollment updated successfully!');
                setCurrentEnrollment(null);
            } else {
                showErrorToast('Failed to update enrollment. Please try again.');
            }
        } catch (error) {
            toast.dismiss(loadingToastId);
            showErrorToast('An unexpected error occurred.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && setCurrentEnrollment(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit className="h-5 w-5" />
                        Edit Enrollment
                    </DialogTitle>
                    <DialogDescription>
                        Update enrollment information, academic performance, and payment details.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Status Fields */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Status Information</h3>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="enrollment_status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Enrollment Status</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.entries(ENROLLMENT_STATUS_OPTIONS).map(([status, config]) => (
                                                        <SelectItem key={status} value={status}>
                                                            {config.label}
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
                                    name="payment_status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Payment Status</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.entries(PAYMENT_STATUS_OPTIONS).map(([status, config]) => (
                                                        <SelectItem key={status} value={status}>
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

                            <FormField
                                control={form.control}
                                name="class_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Class ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Class UUID" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator />

                        {/* Academic Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Academic Information</h3>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="attendance_percentage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Attendance Percentage</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="100"
                                                    placeholder="85.5"
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
                                    name="current_grade"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Current Grade</FormLabel>
                                            <FormControl>
                                                <Input placeholder="A+ / B / 85%" {...field} value={field.value || ''} />
                                            </FormControl>
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
                                                placeholder="Notes about student's academic performance..."
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

                        <Separator />

                        {/* Financial Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Financial Information</h3>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="total_fees_due"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total Fees Due</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="10000.00"
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
                                    name="total_fees_paid"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total Fees Paid</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="5000.00"
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
                                    name="last_payment_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Payment Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="next_payment_due"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Next Payment Due</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Dates */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Enrollment Dates</h3>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="expected_completion_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Expected Completion Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="actual_completion_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Actual Completion Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCurrentEnrollment(null)}
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
            </DialogContent>
        </Dialog>
    );
}
