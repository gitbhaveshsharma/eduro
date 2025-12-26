'use client';

/**
 * Receipt Details Dialog Component
 * 
 * Comprehensive read-only view of fee receipt with:
 * - Complete fee breakdown
 * - Payment history
 * - Student and enrollment information
 * - Action buttons (edit, payment, cancel)
 */

import { useMemo, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
    Edit,
    CreditCard,
    XCircle,
    IndianRupee,
    Calendar,
    User,
    FileText,
    AlertCircle
} from 'lucide-react';

// Import store and utilities
import { useFeeReceiptsStore } from '@/lib/branch-system/stores/fee-receipts.store';
import {
    formatCurrency,
    formatDate,
    formatPaymentMethod,
    getDaysOverdue,
    calculatePaymentProgress
} from '@/lib/branch-system/utils/fee-receipts.utils';
import { 
    ReceiptStatus,
    RECEIPT_STATUS_OPTIONS,
    PAYMENT_METHOD_OPTIONS,
    type FeeReceipt 
} from '@/lib/branch-system/types/fee-receipts.types';

// ============================================================
// UTILITY TYPES & HELPERS
// ============================================================

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

/**
 * Maps receipt status to Badge variant
 */
function getReceiptStatusVariant(status: ReceiptStatus): BadgeVariant {
    const statusConfig = RECEIPT_STATUS_OPTIONS[status];
    if (!statusConfig) return 'secondary';
    
    const colorMap: Record<string, BadgeVariant> = {
        'success': 'success',
        'warning': 'warning',
        'destructive': 'destructive',
        'secondary': 'secondary',
        'outline': 'outline',
        'default': 'default',
    };
    
    return colorMap[statusConfig.color] || 'secondary';
}

/**
 * Gets receipt status label
 */
function getReceiptStatusLabel(status: ReceiptStatus): string {
    const statusConfig = RECEIPT_STATUS_OPTIONS[status];
    return statusConfig?.label || status;
}

/**
 * Checks if receipt is overdue
 */
function isReceiptOverdue(receipt: FeeReceipt): boolean {
    return receipt.receipt_status === ReceiptStatus.PENDING &&
        new Date(receipt.due_date) < new Date();
}

/**
 * Gets receipt permissions
 */
function getReceiptPermissions(receipt: FeeReceipt) {
    const canEdit = 
        receipt.receipt_status !== ReceiptStatus.CANCELLED &&
        receipt.receipt_status !== ReceiptStatus.REFUNDED &&
        receipt.amount_paid === 0;
    
    const canRecordPayment = 
        receipt.receipt_status === ReceiptStatus.PENDING &&
        receipt.balance_amount > 0;
    
    const canCancel = 
        receipt.receipt_status !== ReceiptStatus.CANCELLED &&
        receipt.receipt_status !== ReceiptStatus.REFUNDED;
    
    return { canEdit, canRecordPayment, canCancel };
}

/**
 * Gets balance color class
 */
function getBalanceColorClass(balance: number): string {
    if (balance > 0) return 'text-orange-600 dark:text-orange-500';
    return 'text-green-600 dark:text-green-500';
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

/**
 * Info Row Component
 */
interface InfoRowProps {
    label: string;
    value: string | null;
    labelClassName?: string;
    valueClassName?: string;
}

function InfoRow({
    label,
    value,
    labelClassName = '',
    valueClassName = ''
}: InfoRowProps) {
    return (
        <div className="flex items-center justify-between">
            <span className={`text-sm text-muted-foreground ${labelClassName}`}>{label}</span>
            <span className={`text-sm font-medium ${valueClassName}`}>{value || 'N/A'}</span>
        </div>
    );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ReceiptDetailsDialog() {
    const { currentReceipt, activeDialog, closeDialog, openDialog } = useFeeReceiptsStore();

    // Memoize payment progress
    const progress = useMemo(() => {
        if (!currentReceipt) return 0;
        return calculatePaymentProgress(currentReceipt.total_amount, currentReceipt.amount_paid);
    }, [currentReceipt]);

    // Memoize overdue status
    const isOverdue = useMemo(() => {
        if (!currentReceipt) return false;
        return isReceiptOverdue(currentReceipt);
    }, [currentReceipt]);

    // Memoize permissions
    const permissions = useMemo(() => {
        if (!currentReceipt) return { canEdit: false, canRecordPayment: false, canCancel: false };
        return getReceiptPermissions(currentReceipt);
    }, [currentReceipt]);

    // Memoize status badge
    const statusBadge = useMemo(() => {
        if (!currentReceipt) return null;
        
        const variant = getReceiptStatusVariant(currentReceipt.receipt_status);
        const label = getReceiptStatusLabel(currentReceipt.receipt_status);
        
        return (
            <Badge variant={variant}>
                {label}
            </Badge>
        );
    }, [currentReceipt]);

    // Memoize balance color
    const balanceColorClass = useMemo(() => {
        if (!currentReceipt) return '';
        return getBalanceColorClass(currentReceipt.balance_amount);
    }, [currentReceipt]);

    // Action handlers
    const handleEdit = useCallback(() => {
        if (currentReceipt) {
            openDialog('edit', currentReceipt);
        }
    }, [currentReceipt, openDialog]);

    const handleRecordPayment = useCallback(() => {
        if (currentReceipt) {
            openDialog('payment', currentReceipt);
        }
    }, [currentReceipt, openDialog]);

    const handleCancel = useCallback(() => {
        if (currentReceipt) {
            openDialog('cancel', currentReceipt);
        }
    }, [currentReceipt, openDialog]);

    const handleClose = useCallback(() => {
        closeDialog();
    }, [closeDialog]);

    if (!currentReceipt) return null;

    const { canEdit, canRecordPayment, canCancel } = permissions;

    return (
        <Dialog open={activeDialog === 'details'} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl">{currentReceipt.receipt_number}</DialogTitle>
                            <DialogDescription className="mt-1">
                                Receipt details and payment information
                            </DialogDescription>
                        </div>
                        {statusBadge}
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 min-h-0 p-4 overflow-y-auto">
                    <div className="space-y-6">
                        {/* Overdue Alert */}
                        {isOverdue && (
                            <div className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4">
                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-red-900 dark:text-red-100">Payment Overdue</h4>
                                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                        This receipt is {getDaysOverdue(currentReceipt.due_date)} days overdue.
                                        Please contact the student immediately.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Student Information */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Student Information
                            </h3>
                            <div className="grid gap-3 rounded-lg border p-4">
                                <InfoRow label="Name" value={currentReceipt.student?.full_name || 'Unknown'} />
                                <InfoRow label="Email" value={currentReceipt.student?.email || 'N/A'} />
                                <InfoRow label="Class" value={currentReceipt.class?.class_name || 'N/A'} />
                                <InfoRow label="Branch" value={currentReceipt.branch?.name || 'Unknown'} />
                            </div>
                        </div>

                        <Separator />

                        {/* Receipt Details */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Receipt Details
                            </h3>
                            <div className="grid gap-3 rounded-lg border p-4">
                                <InfoRow label="Receipt Number" value={currentReceipt.receipt_number} />
                                <InfoRow label="Receipt Date" value={formatDate(currentReceipt.receipt_date)} />
                                <InfoRow label="Due Date" value={formatDate(currentReceipt.due_date)} />
                                {currentReceipt.payment_date && (
                                    <InfoRow label="Payment Date" value={formatDate(currentReceipt.payment_date)} />
                                )}
                                {currentReceipt.fee_month && currentReceipt.fee_year && (
                                    <InfoRow 
                                        label="Fee Period" 
                                        value={`${currentReceipt.fee_month}/${currentReceipt.fee_year}`} 
                                    />
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Fee Breakdown */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <IndianRupee className="h-4 w-4" />
                                Fee Breakdown
                            </h3>
                            <div className="rounded-lg border p-4 space-y-3">
                                <InfoRow
                                    label="Base Fee"
                                    value={formatCurrency(currentReceipt.base_fee_amount)}
                                />
                                {currentReceipt.late_fee_amount > 0 && (
                                    <InfoRow
                                        label="Late Fee"
                                        value={formatCurrency(currentReceipt.late_fee_amount)}
                                        valueClassName="text-orange-600 dark:text-orange-500"
                                    />
                                )}
                                {currentReceipt.discount_amount > 0 && (
                                    <InfoRow
                                        label="Discount"
                                        value={`-${formatCurrency(currentReceipt.discount_amount)}`}
                                        valueClassName="text-green-600 dark:text-green-500"
                                    />
                                )}
                                {currentReceipt.tax_amount > 0 && (
                                    <InfoRow
                                        label="Tax"
                                        value={formatCurrency(currentReceipt.tax_amount)}
                                    />
                                )}
                                <Separator />
                                <InfoRow
                                    label="Total Amount"
                                    value={formatCurrency(currentReceipt.total_amount)}
                                    labelClassName="font-semibold"
                                    valueClassName="font-bold text-lg"
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Payment Status */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Payment Status
                            </h3>
                            <div className="rounded-lg border p-4 space-y-4">
                                <InfoRow
                                    label="Amount Paid"
                                    value={formatCurrency(currentReceipt.amount_paid)}
                                    valueClassName="text-green-600 dark:text-green-500 font-semibold"
                                />
                                <InfoRow
                                    label="Balance Due"
                                    value={formatCurrency(currentReceipt.balance_amount)}
                                    valueClassName={`font-semibold ${balanceColorClass}`}
                                />

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Payment Progress</span>
                                        <span className="font-medium">{progress.toFixed(0)}%</span>
                                    </div>
                                    <Progress value={progress} />
                                </div>

                                {currentReceipt.payment_method && (
                                    <InfoRow
                                        label="Payment Method"
                                        value={formatPaymentMethod(currentReceipt.payment_method)}
                                    />
                                )}
                                {currentReceipt.payment_reference && (
                                    <InfoRow
                                        label="Payment Reference"
                                        value={currentReceipt.payment_reference}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        {currentReceipt.description && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <h3 className="font-semibold">Description</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {currentReceipt.description}
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Internal Notes */}
                        {currentReceipt.internal_notes && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <h3 className="font-semibold">Internal Notes</h3>
                                    <p className="text-sm text-muted-foreground rounded-lg border p-3 bg-muted/50">
                                        {currentReceipt.internal_notes}
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Metadata */}
                        <Separator />
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Metadata
                            </h3>
                            <div className="grid gap-2 text-sm">
                                <InfoRow
                                    label="Receipt ID"
                                    value={currentReceipt.id}
                                    valueClassName="font-mono text-xs"
                                />
                                <InfoRow
                                    label="Created"
                                    value={formatDate(currentReceipt.created_at)}
                                />
                                <InfoRow
                                    label="Last Updated"
                                    value={formatDate(currentReceipt.updated_at)}
                                />
                                {currentReceipt.is_auto_generated && (
                                    <InfoRow
                                        label="Auto Generated"
                                        value="Yes"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="flex items-center justify-between">
                    <Button variant="outline" onClick={handleClose}>
                        Close
                    </Button>
                    <div className="flex gap-2">
                        {canEdit && (
                            <Button variant="outline" size="sm" onClick={handleEdit}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        )}
                        {canRecordPayment && (
                            <Button size="sm" onClick={handleRecordPayment}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Record Payment
                            </Button>
                        )}
                        {canCancel && (
                            <Button variant="destructive" size="sm" onClick={handleCancel}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
