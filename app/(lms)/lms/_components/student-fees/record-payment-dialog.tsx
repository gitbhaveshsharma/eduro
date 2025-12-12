'use client';

/**
 * Record Payment Dialog Component
 * 
 * Form for recording payments against fee receipts with:
 * - Payment amount validation
 * - Payment method selection
 * - Payment reference tracking
 * - Payment date recording
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, IndianRupee, Scroll } from 'lucide-react';

// Import store, schema, and utilities
import { useFeeReceiptsStore } from '@/lib/branch-system/stores/fee-receipts.store';
import { recordPaymentSchema } from '@/lib/branch-system/validations/fee-receipts.validation';
import { PaymentMethod } from '@/lib/branch-system/types/fee-receipts.types';
import type { RecordPaymentInput } from '@/lib/branch-system/types/fee-receipts.types';
import { formatCurrency, formatPaymentMethod } from '@/lib/branch-system/utils/fee-receipts.utils';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

export default function RecordPaymentDialog() {
    const { currentReceipt, activeDialog, recordPayment, isRecordingPayment, closeDialog, refresh } = useFeeReceiptsStore();

    const isOpen = activeDialog === 'payment' && !!currentReceipt;

    const form = useForm<RecordPaymentInput>({
        resolver: zodResolver(recordPaymentSchema),
        defaultValues: {
            receipt_id: '',
            amount_paid: 0,
            payment_method: PaymentMethod.MANUAL,
            payment_reference: '',
            internal_notes: '',
        },
    });

    // Update form when receipt changes
    useEffect(() => {
        if (currentReceipt && isOpen) {
            form.setValue('receipt_id', currentReceipt.id);
            form.setValue('amount_paid', currentReceipt.balance_amount);
        }
    }, [currentReceipt, isOpen, form]);

    // Reset form when dialog closes
    useEffect(() => {
        if (!isOpen) {
            form.reset();
        }
    }, [isOpen, form]);

    const handleSubmit = async (data: RecordPaymentInput) => {
        const result = await recordPayment(data);

        if (result) {
            showSuccessToast(
                `Payment of ${formatCurrency(result.payment_applied)} recorded successfully! ${result.is_fully_paid ? 'Receipt fully paid.' : `Remaining: ${formatCurrency(result.new_balance)}`
                }`
            );
            form.reset();
            closeDialog();
            // Refresh the receipts list to ensure data is up-to-date
            refresh();
        } else {
            showErrorToast('Failed to record payment. Please check the form and try again.');
        }
    };

    const handleClose = () => {
        form.reset();
        closeDialog();
    };

    if (!currentReceipt || !isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                        Record a payment for receipt {currentReceipt.receipt_number}
                    </DialogDescription>
                </DialogHeader>

                {/* Receipt Summary */}
                <ScrollArea className="flex-1 min-h-0 p-4 overflow-y-auto">
                    <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Student</span>
                            <span className="text-sm">{currentReceipt.student?.full_name || 'Unknown'}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Total Amount</span>
                            <span className="text-sm">{formatCurrency(currentReceipt.total_amount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Already Paid</span>
                            <span className="text-sm text-green-600">{formatCurrency(currentReceipt.amount_paid)}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Balance Due</span>
                            <Badge variant="secondary" className="text-base">
                                {formatCurrency(currentReceipt.balance_amount)}
                            </Badge>
                        </div>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 p-2">
                            {/* Payment Amount */}
                            <FormField
                                control={form.control}
                                name="amount_paid"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Amount *</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    className="pl-10"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            Maximum: {formatCurrency(currentReceipt.balance_amount)}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Payment Method */}
                            <FormField
                                control={form.control}
                                name="payment_method"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Method *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select payment method" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(PaymentMethod).map((method) => (
                                                    <SelectItem key={method} value={method}>
                                                        {formatPaymentMethod(method)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Payment Reference */}
                            <FormField
                                control={form.control}
                                name="payment_reference"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Reference</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Transaction ID, cheque number, etc." {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Required for UPI, Card, and Bank Transfer payments
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Payment Date */}
                            <FormField
                                control={form.control}
                                name="payment_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Leave empty to use today's date
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Internal Notes */}
                            <FormField
                                control={form.control}
                                name="internal_notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Internal Notes</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Add any notes about this payment..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isRecordingPayment}>
                        Cancel
                    </Button>
                    <Button onClick={form.handleSubmit(handleSubmit)} disabled={isRecordingPayment}>
                        {isRecordingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Record Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
