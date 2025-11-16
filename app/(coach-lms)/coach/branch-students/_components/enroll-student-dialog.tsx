/**
 * Enroll Student Dialog Component
 * 
 * Form for enrolling a new student in a branch
 * Features: Multi-section form with complete validation using enrollStudentSchema
 */

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';
import {
    enrollStudentSchema,
    type EnrollStudentInput,
} from '@/lib/branch-system/validations/branch-students.validation';
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
import { Label } from '@/components/ui/label';
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
import { Loader2, UserPlus } from 'lucide-react';

/**
 * Enroll Student Dialog Props
 */
interface EnrollStudentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    branchId?: string; // Default branch ID
}

/**
 * Main Enroll Student Dialog Component
 */
export function EnrollStudentDialog({ open, onOpenChange, branchId }: EnrollStudentDialogProps) {
    const { enrollStudent, loading } = useBranchStudentsStore();

    // Initialize form
    const form = useForm<EnrollStudentInput>({
        resolver: zodResolver(enrollStudentSchema),
        defaultValues: {
            student_id: '',
            branch_id: branchId || '',
            class_id: null,
            enrollment_date: new Date().toISOString().split('T')[0],
            expected_completion_date: null,
            emergency_contact_name: null,
            emergency_contact_phone: null,
            parent_guardian_name: null,
            parent_guardian_phone: null,
            preferred_batch: null,
            special_requirements: null,
            student_notes: null,
            metadata: null,
        },
    });

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            form.reset();
        }
    }, [open, form]);

    // Handle form submission
    const onSubmit = async (data: EnrollStudentInput) => {
        const loadingToastId = showLoadingToast('Enrolling student...');

        try {
            const success = await enrollStudent(data);

            toast.dismiss(loadingToastId);

            if (success) {
                showSuccessToast('Student enrolled successfully!');
                onOpenChange(false);
                form.reset();
            } else {
                showErrorToast('Failed to enroll student. Please try again.');
            }
        } catch (error) {
            toast.dismiss(loadingToastId);
            showErrorToast('An unexpected error occurred.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Enroll New Student
                    </DialogTitle>
                    <DialogDescription>
                        Fill in the student information to enroll them in the branch.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Basic Information</h3>

                            <FormField
                                control={form.control}
                                name="student_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Student ID *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter student UUID" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            The unique identifier of the student to enroll
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="branch_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Branch ID *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter branch UUID" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            The branch where the student will be enrolled
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="class_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Class ID (Optional)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter class UUID"
                                                {...field}
                                                value={field.value || ''}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Assign student to a specific class
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator />

                        {/* Enrollment Dates */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Enrollment Dates</h3>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="enrollment_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Enrollment Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

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
                            </div>
                        </div>

                        <Separator />

                        {/* Contact Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Contact Information</h3>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="emergency_contact_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Emergency Contact Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} value={field.value || ''} />
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
                                                <Input
                                                    placeholder="+911234567890"
                                                    {...field}
                                                    value={field.value || ''}
                                                />
                                            </FormControl>
                                            <FormDescription>E.164 format (+country code + number)</FormDescription>
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
                                                <Input placeholder="Jane Doe" {...field} value={field.value || ''} />
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
                                                <Input
                                                    placeholder="+919876543210"
                                                    {...field}
                                                    value={field.value || ''}
                                                />
                                            </FormControl>
                                            <FormDescription>E.164 format (+country code + number)</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Preferences */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Preferences & Notes</h3>

                            <FormField
                                control={form.control}
                                name="preferred_batch"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Preferred Batch</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Morning / Evening / Weekend" {...field} value={field.value || ''} />
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
                                            <Textarea
                                                placeholder="Any special needs or accommodations..."
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
                                name="student_notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Student Notes</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Additional notes about the student..."
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
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enroll Student
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
