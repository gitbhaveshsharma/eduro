'use client';

/**
 * Cancel Receipt Dialog Component
 * 
 * Dialog for cancelling or refunding receipts with:
 * - Cancellation reason requirement
 * - Optional refund amount
 * - Confirmation warning
 * - Status-based handling (cancel vs refund)
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';

// Import store, schema, and utilities
import { useFeeReceiptsStore } from '@/lib/branch-system/stores/fee-receipts.store';
import { cancelReceiptSchema } from '@/lib/branch-system/validations/fee-receipts.validation';
import type { CancelReceiptInput } from '@/lib/branch-system/types/fee-receipts.types';
import { formatCurrency } from '@/lib/branch-system/utils/fee-receipts.utils';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

export default function CancelReceiptDialog() {
    const { currentReceipt, cancelReceipt, isCancelling, setCurrentReceipt } = useFeeReceiptsStore();

    const form = useForm<CancelReceiptInput>({
        resolver: zodResolver(cancelReceiptSchema),
        defaultValues: {
            receipt_id: '',
            reason: '',
            refund_amount: 0,
        },
    });

    // Update form when receipt changes
    useEffect(() => {
        if (currentReceipt) {
            form.setValue('receipt_id', currentReceipt.id);
            // Set refund amount if payment was made
            if (currentReceipt.amount_paid > 0) {
                form.setValue('refund_amount', currentReceipt.amount_paid);
            }
        }
    }, [currentReceipt, form]);

    const handleSubmit = async (data: CancelReceiptInput) => {
        const result = await cancelReceipt(data);

        if (result) {
            const action = currentReceipt?.amount_paid && currentReceipt.amount_paid > 0 ? 'refunded' : 'cancelled';
            showSuccessToast(`Receipt ${action} successfully!`);
            form.reset();
            setCurrentReceipt(null);
        } else {
            showErrorToast('Failed to cancel receipt. Please try again.');
        }
    };

    const handleClose = () => {
        form.reset();
        setCurrentReceipt(null);
    };

    if (!currentReceipt) return null;

    const hasPayment = currentReceipt.amount_paid > 0;
    const actionType = hasPayment ? 'Refund' : 'Cancel';

    return (
        <AlertDialog open={!!currentReceipt} onOpenChange={(open) => !open && handleClose()}>
            <AlertDialogContent className="max-w-xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        {actionType} Receipt
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {hasPayment ? (
                            <>
                                This receipt has received payment of {formatCurrency(currentReceipt.amount_paid)}.
                                Cancelling will mark it as REFUNDED.
                            </>
                        ) : (
                            <>
                                This will cancel the receipt. This action cannot be undone.
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {/* Receipt Info */}
                <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Receipt Number</span>
                        <span className="text-sm">{currentReceipt.receipt_number}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Student</span>
                        <span className="text-sm">{currentReceipt.student?.full_name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Amount</span>
                        <span className="text-sm">{formatCurrency(currentReceipt.total_amount)}</span>
                    </div>
                    {hasPayment && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Amount Paid</span>
                            <Badge variant="secondary">
                                {formatCurrency(currentReceipt.amount_paid)}
                            </Badge>
                        </div>
                    )}
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        {/* Cancellation Reason */}
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason for {actionType} *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Provide a detailed reason for this action..."
                                            className="resize-none min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Minimum 10 characters required
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Refund Amount (if payment made) */}
                        {hasPayment && (
                            <FormField
                                control={form.control}
                                name="refund_amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Refund Amount</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Maximum: {formatCurrency(currentReceipt.amount_paid)}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </form>
                </Form>

                {/* Warning Message */}
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">
                        <strong>Warning:</strong> This action will {hasPayment ? 'refund' : 'cancel'} the receipt.
                        {hasPayment && ' The refund must be processed separately through your payment system.'}
                    </p>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isCancelling}>Cancel</AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={form.handleSubmit(handleSubmit)}
                        disabled={isCancelling}
                    >
                        {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {actionType} Receipt
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
