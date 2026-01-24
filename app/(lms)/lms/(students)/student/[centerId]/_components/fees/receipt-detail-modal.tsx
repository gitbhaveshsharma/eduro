/**
 * Receipt Detail Modal Component
 * 
 * Modal for viewing full receipt details
 * Shows fee breakdown, payment info, and receipt status
 */

'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Receipt,
    Calendar,
    Building2,
    GraduationCap,
    CreditCard,
    CheckCircle2,
    Clock,
    XCircle,
    RefreshCw,
    AlertTriangle,
    IndianRupee,
    FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    formatCurrency,
    formatDate,
    formatMonthYear,
    formatPaymentMethod,
    isOverdue,
    getDaysOverdue,
} from '@/lib/branch-system/utils/fee-receipts.utils';
import {
    ReceiptStatus,
    RECEIPT_STATUS_OPTIONS,
    type FeeReceipt,
} from '@/lib/branch-system/types/fee-receipts.types';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

interface ReceiptDetailModalProps {
    receipt: FeeReceipt | null;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Get badge variant based on receipt status
 */
function getStatusBadgeVariant(status: ReceiptStatus): BadgeVariant {
    const variants: Record<ReceiptStatus, BadgeVariant> = {
        [ReceiptStatus.PAID]: 'success',
        [ReceiptStatus.PENDING]: 'warning',
        [ReceiptStatus.CANCELLED]: 'outline',
        [ReceiptStatus.REFUNDED]: 'secondary',
    };
    return variants[status];
}

/**
 * Get status icon
 */
function getStatusIcon(status: ReceiptStatus) {
    const icons: Record<ReceiptStatus, React.ReactNode> = {
        [ReceiptStatus.PAID]: <CheckCircle2 className="h-4 w-4" />,
        [ReceiptStatus.PENDING]: <Clock className="h-4 w-4" />,
        [ReceiptStatus.CANCELLED]: <XCircle className="h-4 w-4" />,
        [ReceiptStatus.REFUNDED]: <RefreshCw className="h-4 w-4" />,
    };
    return icons[status];
}

/**
 * Detail row component
 */
function DetailRow({
    label,
    value,
    icon,
    valueClassName,
}: {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    valueClassName?: string;
}) {
    return (
        <div className="flex items-start justify-between py-2">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
                {icon}
                {label}
            </span>
            <span className={cn('text-sm font-medium text-right', valueClassName)}>
                {value}
            </span>
        </div>
    );
}

export function ReceiptDetailModal({
    receipt,
    isOpen,
    onClose,
}: ReceiptDetailModalProps) {
    if (!receipt) return null;

    const receiptIsOverdue = isOverdue(receipt.due_date, receipt.receipt_status);
    const daysOverdue = getDaysOverdue(receipt.due_date);
    const statusConfig = RECEIPT_STATUS_OPTIONS[receipt.receipt_status];
    const badgeVariant = getStatusBadgeVariant(receipt.receipt_status);

    // Format period display
    const periodDisplay = receipt.fee_month && receipt.fee_year
        ? formatMonthYear(receipt.fee_month, receipt.fee_year)
        : null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl h-[95vh] flex flex-col p-0 gap-0">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-primary" />
                        Receipt Details
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 min-h-0 p-4 overflow-x-auto">
                    <div className="space-y-6 p-2">
                        {/* Receipt Header */}
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                            <div>
                                <p className="text-xs text-muted-foreground">Receipt Number</p>
                                <p className="text-lg font-semibold">{receipt.receipt_number}</p>
                            </div>
                            <Badge variant={badgeVariant} className="gap-1">
                                {getStatusIcon(receipt.receipt_status)}
                                {statusConfig.label}
                            </Badge>
                        </div>

                        {/* Overdue Warning */}
                        {receiptIsOverdue && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                <p className="text-sm font-medium">
                                    This receipt is {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                                </p>
                            </div>
                        )}

                        {/* Class & Branch Info */}
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-foreground mb-2">Details</h4>
                            {receipt.class?.class_name && (
                                <DetailRow
                                    label="Class"
                                    value={
                                        <span>
                                            {receipt.class.class_name}
                                            {receipt.class.subject && (
                                                <span className="text-muted-foreground"> • {receipt.class.subject}</span>
                                            )}
                                        </span>
                                    }
                                    icon={<GraduationCap className="h-4 w-4" />}
                                />
                            )}
                            {receipt.branch?.name && (
                                <DetailRow
                                    label="Branch"
                                    value={receipt.branch.name}
                                    icon={<Building2 className="h-4 w-4" />}
                                />
                            )}
                            {periodDisplay && (
                                <DetailRow
                                    label="Fee Period"
                                    value={periodDisplay}
                                    icon={<Calendar className="h-4 w-4" />}
                                />
                            )}
                        </div>

                        <Separator />

                        {/* Fee Breakdown */}
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-foreground mb-2">Fee Breakdown</h4>
                            <DetailRow
                                label="Base Fee"
                                value={formatCurrency(receipt.base_fee_amount)}
                                icon={<IndianRupee className="h-4 w-4" />}
                            />
                            {receipt.late_fee_amount > 0 && (
                                <DetailRow
                                    label="Late Fee"
                                    value={`+ ${formatCurrency(receipt.late_fee_amount)}`}
                                    valueClassName="text-orange-600"
                                />
                            )}
                            {receipt.discount_amount > 0 && (
                                <DetailRow
                                    label="Discount"
                                    value={`- ${formatCurrency(receipt.discount_amount)}`}
                                    valueClassName="text-green-600"
                                />
                            )}
                            {receipt.tax_amount > 0 && (
                                <DetailRow
                                    label="Tax"
                                    value={`+ ${formatCurrency(receipt.tax_amount)}`}
                                />
                            )}
                            <Separator className="my-2" />
                            <DetailRow
                                label="Total Amount"
                                value={formatCurrency(receipt.total_amount)}
                                valueClassName="text-lg font-bold"
                            />
                        </div>

                        <Separator />

                        {/* Payment Info */}
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-foreground mb-2">Payment Status</h4>
                            <DetailRow
                                label="Amount Paid"
                                value={formatCurrency(receipt.amount_paid)}
                                icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                                valueClassName="text-green-600"
                            />
                            <DetailRow
                                label="Balance Due"
                                value={formatCurrency(receipt.balance_amount)}
                                icon={<Clock className="h-4 w-4 text-orange-600" />}
                                valueClassName={receipt.balance_amount > 0 ? 'text-orange-600' : 'text-green-600'}
                            />
                            {receipt.payment_method && (
                                <DetailRow
                                    label="Payment Method"
                                    value={formatPaymentMethod(receipt.payment_method)}
                                    icon={<CreditCard className="h-4 w-4" />}
                                />
                            )}
                            {receipt.payment_date && (
                                <DetailRow
                                    label="Payment Date"
                                    value={formatDate(receipt.payment_date)}
                                    icon={<Calendar className="h-4 w-4" />}
                                />
                            )}
                        </div>

                        <Separator />

                        {/* Dates */}
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-foreground mb-2">Important Dates</h4>
                            <DetailRow
                                label="Receipt Date"
                                value={formatDate(receipt.receipt_date)}
                                icon={<Calendar className="h-4 w-4" />}
                            />
                            <DetailRow
                                label="Due Date"
                                value={formatDate(receipt.due_date)}
                                icon={<Calendar className="h-4 w-4" />}
                                valueClassName={receiptIsOverdue ? 'text-red-600' : undefined}
                            />
                        </div>

                        {/* Description */}
                        {receipt.description && (
                            <>
                                <Separator />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                                        <FileText className="h-4 w-4" />
                                        Description
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        {receipt.description}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
