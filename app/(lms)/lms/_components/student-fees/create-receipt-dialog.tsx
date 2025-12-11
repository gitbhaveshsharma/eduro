'use client';

/**
 * Create Receipt Dialog Component
 * 
 * Multi-section form for creating new fee receipts with:
 * - Student and enrollment selection
 * - Fee breakdown (base, late fee, discount, tax)
 * - Fee period configuration
 * - Full Zod validation
 */

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
import { Loader2 } from 'lucide-react';

// Import store, schema, and utilities
import { useFeeReceiptsStore } from '@/lib/branch-system/stores/fee-receipts.store';
import { createFeeReceiptSchema } from '@/lib/branch-system/validations/fee-receipts.validation';
import type { CreateFeeReceiptInput } from '@/lib/branch-system/types/fee-receipts.types';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

interface CreateReceiptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Branch ID - pre-fills the branch for branch manager view */
    branchId?: string;
}

export default function CreateReceiptDialog({ open, onOpenChange, branchId }: CreateReceiptDialogProps) {
    const { createReceipt, isCreating } = useFeeReceiptsStore();

    const form = useForm<CreateFeeReceiptInput>({
        resolver: zodResolver(createFeeReceiptSchema),
        defaultValues: {
            student_id: '',
            branch_id: branchId || '', // Use branchId if provided
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

    const handleSubmit = async (data: CreateFeeReceiptInput) => {
        const result = await createReceipt(data);

        if (result) {
            showSuccessToast(`Receipt ${result.receipt_number} created successfully!`);
            form.reset();
            onOpenChange(false);
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
                        Create a new fee receipt for a student. All fields marked with * are required.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 min-h-0 p-4 overflow-y-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-4">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Basic Information</h3>

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
                                                The UUID of the student receiving this receipt
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="enrollment_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Enrollment ID *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter enrollment UUID" {...field} />
                                            </FormControl>
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
                                                <Input placeholder="Enter class UUID" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
                    <Button onClick={form.handleSubmit(handleSubmit)} disabled={isCreating}>
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Receipt
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
