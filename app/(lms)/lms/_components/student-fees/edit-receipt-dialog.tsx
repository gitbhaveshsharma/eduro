'use client';

/**
 * Edit Receipt Dialog Component
 * 
 * Form for editing receipt details (before payment) with:
 * - Due date modification
 * - Fee amount adjustments
 * - Description and notes updates
 * - Full Zod validation
 */

import { useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

// Import store, schema, and utilities
import { useFeeReceiptsStore } from '@/lib/branch-system/stores/fee-receipts.store';
import { updateReceiptSchema } from '@/lib/branch-system/validations/fee-receipts.validation';
import type { UpdateReceiptInput } from '@/lib/branch-system/types/fee-receipts.types';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

export default function EditReceiptDialog() {
    const { currentReceipt, updateReceipt, isUpdating, setCurrentReceipt } = useFeeReceiptsStore();

    const form = useForm<UpdateReceiptInput>({
        resolver: zodResolver(updateReceiptSchema),
        defaultValues: {
            id: '',
            due_date: '',
            base_fee_amount: 0,
            late_fee_amount: 0,
            discount_amount: 0,
            tax_amount: 0,
            description: '',
            internal_notes: '',
        },
    });

    // Load current receipt data
    useEffect(() => {
        if (currentReceipt) {
            const formData = {
                id: currentReceipt.id,
                due_date: currentReceipt.due_date,
                base_fee_amount: currentReceipt.base_fee_amount,
                late_fee_amount: currentReceipt.late_fee_amount,
                discount_amount: currentReceipt.discount_amount,
                tax_amount: currentReceipt.tax_amount,
                description: currentReceipt.description || '',
                internal_notes: currentReceipt.internal_notes || '',
            };
            form.reset(formData, { keepDefaultValues: false });
        }
    }, [currentReceipt]);

    const handleSubmit = async (data: UpdateReceiptInput) => {
        const result = await updateReceipt(data);

        if (result) {
            showSuccessToast('Receipt updated successfully!');
            form.reset();
            setCurrentReceipt(null);
        } else {
            showErrorToast('Failed to update receipt. Please check the form and try again.');
        }
    };

    const handleClose = () => {
        form.reset();
        setCurrentReceipt(null);
    };

    if (!currentReceipt) return null;

    // Check if receipt can be edited
    const canEdit = currentReceipt.amount_paid === 0;
    if (!canEdit) {
        return (
            <Dialog open={!!currentReceipt} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cannot Edit Receipt</DialogTitle>
                        <DialogDescription>
                            This receipt cannot be edited because payment has already been recorded.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={handleClose}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={!!currentReceipt} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh]" key={currentReceipt?.id}>
                <DialogHeader>
                    <DialogTitle>Edit Receipt</DialogTitle>
                    <DialogDescription>
                        Edit receipt details for {currentReceipt.receipt_number}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                            {/* Due Date */}
                            <FormField
                                control={form.control}
                                name="due_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Due Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Update the payment due date
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
                                                <FormLabel>Base Fee Amount</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
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
                    <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
                        Cancel
                    </Button>
                    <Button onClick={form.handleSubmit(handleSubmit)} disabled={isUpdating}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Receipt
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
