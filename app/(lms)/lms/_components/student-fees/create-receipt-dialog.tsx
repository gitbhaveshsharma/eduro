'use client';

/**
 * Create Receipt Dialog Component
 * 
 * Multi-section form for creating new fee receipts with:
 * - Student search by username/name (fetches from branch_students)
 * - Auto-fills enrollment_id, class_id, branch_id from student data
 * - Fee breakdown (base, late fee, discount, tax)
 * - Fee period configuration
 * - Full Zod validation
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, User } from 'lucide-react';

// Import store, schema, and utilities
import { useFeeReceiptsStore } from '@/lib/branch-system/stores/fee-receipts.store';
import { createFeeReceiptSchema } from '@/lib/branch-system/validations/fee-receipts.validation';
import type { CreateFeeReceiptInput } from '@/lib/branch-system/types/fee-receipts.types';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import StudentSearch from '../student-attendance/student-search';

/**
 * Selected student data from the student_enrollment_details view
 */
interface SelectedStudent {
    enrollment_id: string;
    student_id: string;
    student_name: string | null;
    student_username: string | null;
    branch_id: string;
    branch_name: string | null;
    coaching_center_name: string | null;
    class_id: string | null;
    class_name: string | null;
    subject: string | null;
    enrollment_status: string;
    avatar_url?: string | null;
}

interface CreateReceiptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Branch ID - pre-fills the branch for branch manager view */
    branchId?: string;
    /** Coaching Center ID - for coach view to search across all branches */
    coachingCenterId?: string;
}

export default function CreateReceiptDialog({
    open,
    onOpenChange,
    branchId,
    coachingCenterId
}: CreateReceiptDialogProps) {
    const { createReceipt, isCreating, refresh } = useFeeReceiptsStore();
    const [selectedStudent, setSelectedStudent] = useState<SelectedStudent | null>(null);

    const form = useForm<CreateFeeReceiptInput>({
        resolver: zodResolver(createFeeReceiptSchema),
        defaultValues: {
            student_id: '',
            branch_id: branchId || '',
            enrollment_id: '',
            class_id: '',
            due_date: '',
            base_fee_amount: 0,
            late_fee_amount: 0,
            discount_amount: 0,
            tax_amount: 0,
            description: '',
            internal_notes: '',
        },
    });

    // Reset form and selection when dialog closes
    useEffect(() => {
        if (!open) {
            setSelectedStudent(null);
            form.reset({
                student_id: '',
                branch_id: branchId || '',
                enrollment_id: '',
                class_id: '',
                due_date: '',
                base_fee_amount: 0,
                late_fee_amount: 0,
                discount_amount: 0,
                tax_amount: 0,
                description: '',
                internal_notes: '',
            });
        }
    }, [open, branchId, form]);

    // Update form when student is selected
    useEffect(() => {
        if (selectedStudent) {
            form.setValue('student_id', selectedStudent.student_id);
            form.setValue('enrollment_id', selectedStudent.enrollment_id);
            form.setValue('branch_id', selectedStudent.branch_id);
            if (selectedStudent.class_id) {
                form.setValue('class_id', selectedStudent.class_id);
            }
        } else {
            form.setValue('student_id', '');
            form.setValue('enrollment_id', '');
            form.setValue('class_id', '');
            if (!branchId) {
                form.setValue('branch_id', '');
            }
        }
    }, [selectedStudent, form, branchId]);

    const handleSubmit = async (data: CreateFeeReceiptInput) => {
        if (!selectedStudent) {
            showErrorToast('Please select a student first');
            return;
        }

        const result = await createReceipt(data);

        if (result) {
            showSuccessToast(`Receipt ${result.receipt_number} created successfully!`);
            setSelectedStudent(null);
            form.reset();
            onOpenChange(false);
            // Refresh the receipts list to ensure data is up-to-date
            refresh();
        } else {
            showErrorToast('Failed to create receipt. Please check the form and try again.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Fee Receipt</DialogTitle>
                    <DialogDescription>
                        Search for a student by username or name to create a fee receipt.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 min-h-0 p-4 overflow-y-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-4">
                            {/* Student Selection */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Student Information</h3>

                                <div className="space-y-2">
                                    <FormLabel>Student *</FormLabel>
                                    <StudentSearch
                                        coachingCenterId={coachingCenterId}
                                        branchId={branchId}
                                        selectedStudent={selectedStudent}
                                        onSelect={(student) => setSelectedStudent(student as SelectedStudent | null)}
                                        placeholder="Search by username or name..."
                                    />
                                </div>

                                {/* Display selected student info */}
                                {selectedStudent && (
                                    <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">
                                                {selectedStudent.student_name || 'Unknown'}
                                            </span>
                                            {selectedStudent.student_username && (
                                                <span className="text-muted-foreground">
                                                    @{selectedStudent.student_username}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedStudent.branch_name && (
                                                <Badge variant="outline">
                                                    {selectedStudent.branch_name}
                                                </Badge>
                                            )}
                                            {selectedStudent.class_name && (
                                                <Badge variant="secondary">
                                                    {selectedStudent.class_name}
                                                </Badge>
                                            )}
                                            <Badge variant="default">
                                                {selectedStudent.enrollment_status}
                                            </Badge>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Receipt Dates */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Receipt Dates</h3>

                                <FormField
                                    control={form.control}
                                    name="due_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Due Date *</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                The date by which payment should be received
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            {/* Fee Breakdown */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Fee Breakdown</h3>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="base_fee_amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Base Fee Amount *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="late_fee_amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Late Fee Amount</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="discount_amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Discount Amount</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="tax_amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tax Amount</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Description and Notes */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Additional Information</h3>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter receipt description (visible to students)"
                                                    className="resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="internal_notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Internal Notes</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter internal notes (not visible to students)"
                                                    className="resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </form>
                    </Form>
                </ScrollArea>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
                        Cancel
                    </Button>
                    <Button
                        onClick={form.handleSubmit(handleSubmit)}
                        disabled={isCreating || !selectedStudent}
                    >
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Receipt
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
