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
import { PAYMENT_STATUS_OPTIONS } from '@/lib/branch-system/types/branch-students.types';
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
import { Loader2, Edit } from 'lucide-react';

/**
 * Edit Enrollment Dialog Component
 */
export function EditEnrollmentDialog() {
    const {
        currentEnrollment,
        isEditDialogOpen,
        updateEnrollmentByManager,
        loading,
        closeEditDialog,
    } = useBranchStudentsStore();

    const isOpen = isEditDialogOpen && !!currentEnrollment;

    // Initialize form with fields available in updateStudentByManagerSchema
    const form = useForm<UpdateStudentByManagerInput>({
        resolver: zodResolver(updateStudentByManagerSchema),
        defaultValues: {
            payment_status: undefined,
            total_fees_due: undefined,
            total_fees_paid: undefined,
            last_payment_date: undefined,
            next_payment_due: undefined,
            emergency_contact_name: undefined,
            emergency_contact_phone: undefined,
            parent_guardian_name: undefined,
            parent_guardian_phone: undefined,
            metadata: undefined,
        },
    });

    // Load enrollment data when dialog opens
    useEffect(() => {
        if (currentEnrollment) {
            const formData = {
                payment_status: currentEnrollment.payment_status,
                total_fees_due: currentEnrollment.total_fees_due,
                total_fees_paid: currentEnrollment.total_fees_paid,
                last_payment_date: currentEnrollment.last_payment_date,
                next_payment_due: currentEnrollment.next_payment_due,
                emergency_contact_name: currentEnrollment.emergency_contact_name,
                emergency_contact_phone: currentEnrollment.emergency_contact_phone,
                parent_guardian_name: currentEnrollment.parent_guardian_name,
                parent_guardian_phone: currentEnrollment.parent_guardian_phone,
                metadata: currentEnrollment.metadata,
            };
            form.reset(formData, { keepDefaultValues: false });
        }
    }, [currentEnrollment]);

    // Handle form submission
    const onSubmit = async (data: UpdateStudentByManagerInput) => {
        if (!currentEnrollment) return;

        const loadingToastId = showLoadingToast('Updating enrollment...');

        try {
            const success = await updateEnrollmentByManager(currentEnrollment.id, data);

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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeEditDialog()}>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto" key={currentEnrollment?.id}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit className="h-5 w-5" />
                        Edit Student Profile
                    </DialogTitle>
                    <DialogDescription>
                        Update student profile, payment details, and contact information.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 min-h-0 p-4 overflow-x-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Payment Status */}
                            <div className="space-y-4 p-4">
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

                            <Separator />

                            {/* Financial Information */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Financial Information</h3>

                                <div className="grid gap-4 md:grid-cols-2 p-1">
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

                            {/* Contact Information */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Contact Information</h3>

                                <div className="grid gap-4 md:grid-cols-2 p-1">
                                    <FormField
                                        control={form.control}
                                        name="emergency_contact_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Emergency Contact Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Contact name" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="emergency_contact_phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Emergency Contact Phone</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+91 9876543210" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="parent_guardian_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Parent/Guardian Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Parent name" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="parent_guardian_phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Parent/Guardian Phone</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+91 9876543210" {...field} value={field.value || ''} />
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
                                    onClick={() => closeEditDialog()}
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
