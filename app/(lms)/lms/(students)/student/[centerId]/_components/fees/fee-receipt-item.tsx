/**
 * Fee Receipt Item Component
 * 
 * Individual fee receipt row with status, amount, and quick actions
 * Uses the Item component pattern from teacher attendance
 */

'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemMedia,
    ItemTitle,
    ItemDescription,
} from '@/components/ui/item';
import {
    Receipt,
    Eye,
    Calendar,
    CheckCircle2,
    Clock,
    XCircle,
    RefreshCw,
    AlertTriangle,
    IndianRupee,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    formatCurrency,
    formatDate,
    formatMonthYear,
    isOverdue,
    getDaysOverdue,
    getDaysUntilDue,
    calculatePaymentProgress,
} from '@/lib/branch-system/utils/fee-receipts.utils';
import {
    ReceiptStatus,
    RECEIPT_STATUS_OPTIONS,
    type FeeReceipt,
} from '@/lib/branch-system/types/fee-receipts.types';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

interface FeeReceiptItemProps {
    receipt: FeeReceipt;
    onViewDetails: (receipt: FeeReceipt) => void;
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
        [ReceiptStatus.PAID]: <CheckCircle2 className="h-3.5 w-3.5" />,
        [ReceiptStatus.PENDING]: <Clock className="h-3.5 w-3.5" />,
        [ReceiptStatus.CANCELLED]: <XCircle className="h-3.5 w-3.5" />,
        [ReceiptStatus.REFUNDED]: <RefreshCw className="h-3.5 w-3.5" />,
    };
    return icons[status];
}

/**
 * Get receipt icon color based on status
 */
function getReceiptIconColor(status: ReceiptStatus, isReceiptOverdue: boolean) {
    if (isReceiptOverdue) {
        return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
    }

    const colors: Record<ReceiptStatus, string> = {
        [ReceiptStatus.PAID]: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        [ReceiptStatus.PENDING]: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
        [ReceiptStatus.CANCELLED]: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
        [ReceiptStatus.REFUNDED]: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return colors[status];
}

/**
 * Get item background color based on receipt status and overdue status
 */
function getItemBackgroundColor(status: ReceiptStatus, isReceiptOverdue: boolean): string {
    if (isReceiptOverdue) {
        // Overdue gets highest priority with error red background
        return 'bg-error/15 dark:bg-error/10 border-error/20 dark:border-error/30';
    }

    const backgrounds: Record<ReceiptStatus, string> = {
        [ReceiptStatus.PAID]: '', // No background for paid (success state)
        [ReceiptStatus.PENDING]: 'bg-warning/15 dark:bg-warning/10 border-warning/20 dark:border-warning/30',
        [ReceiptStatus.CANCELLED]: 'bg-muted/20 dark:bg-muted/15 border-muted/30 dark:border-muted/40',
        [ReceiptStatus.REFUNDED]: 'bg-brand-secondary/15 dark:bg-brand-secondary/10 border-brand-secondary/20 dark:border-brand-secondary/30',
    };
    return backgrounds[status];
}

export function FeeReceiptItem({
    receipt,
    onViewDetails,
}: FeeReceiptItemProps) {
    const [isHovered, setIsHovered] = useState(false);

    const receiptIsOverdue = isOverdue(receipt.due_date, receipt.receipt_status);
    const daysOverdue = getDaysOverdue(receipt.due_date);
    const daysUntilDue = getDaysUntilDue(receipt.due_date);
    const paymentProgress = calculatePaymentProgress(receipt.total_amount, receipt.amount_paid);
    const statusConfig = RECEIPT_STATUS_OPTIONS[receipt.receipt_status];
    const badgeVariant = getStatusBadgeVariant(receipt.receipt_status);

    // Get dynamic background color
    const itemBackgroundColor = getItemBackgroundColor(receipt.receipt_status, receiptIsOverdue);

    // Format period display
    const periodDisplay = receipt.fee_month && receipt.fee_year
        ? formatMonthYear(receipt.fee_month, receipt.fee_year)
        : null;

    return (
        <TooltipProvider delayDuration={200}>
            <Item
                variant="default"
                className={cn(
                    'group/item hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5',
                    'items-center gap-6 px-5 py-4 cursor-pointer',
                    itemBackgroundColor // Apply dynamic background
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => onViewDetails(receipt)}
            >
                {/* Receipt Icon */}
                <ItemMedia variant="icon">
                    <div
                        className={cn(
                            'flex items-center justify-center w-10 h-10 rounded-xl',
                            getReceiptIconColor(receipt.receipt_status, receiptIsOverdue)
                        )}
                    >
                        <Receipt className="h-5 w-5" />
                    </div>
                </ItemMedia>

                {/* Receipt Info */}
                <ItemContent className="min-w-0 flex-1">
                    <ItemTitle className="font-semibold text-sm truncate transition-colors duration-200 group-hover/item:text-primary">
                        <span className="truncate">{receipt.receipt_number}</span>
                        {receipt.class?.class_name && (
                            <span className="text-xs text-muted-foreground font-normal hidden sm:inline">
                                • {receipt.class.class_name}
                            </span>
                        )}
                    </ItemTitle>
                    <ItemDescription className="flex flex-wrap items-center gap-2 text-xs">
                        {/* Status Badge */}
                        <Badge variant={badgeVariant} className="gap-1 text-xs h-5">
                            {getStatusIcon(receipt.receipt_status)}
                            <span>{statusConfig.label}</span>
                        </Badge>

                        {/* Due Date */}
                        <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Due: {formatDate(receipt.due_date)}
                        </span>

                        {/* Overdue Warning */}
                        {receiptIsOverdue && (
                            <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                                <AlertTriangle className="h-3 w-3" />
                                {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                            </span>
                        )}

                        {/* Due Soon */}
                        {!receiptIsOverdue &&
                            receipt.receipt_status === ReceiptStatus.PENDING &&
                            daysUntilDue <= 7 &&
                            daysUntilDue >= 0 && (
                                <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                    <Clock className="h-3 w-3" />
                                    Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
                                </span>
                            )}

                        {/* Period */}
                        {periodDisplay && (
                            <span className="text-muted-foreground hidden sm:inline">
                                • {periodDisplay}
                            </span>
                        )}
                    </ItemDescription>

                    {/* Payment Progress (for pending receipts with partial payment) */}
                    {receipt.receipt_status === ReceiptStatus.PENDING &&
                        receipt.amount_paid > 0 && (
                            <div className="mt-2 max-w-48">
                                <Progress value={paymentProgress} className="h-1.5" />
                                <span className="text-[10px] text-muted-foreground">
                                    {paymentProgress.toFixed(0)}% paid
                                </span>
                            </div>
                        )}
                </ItemContent>

                {/* Amount Info */}
                <div className="flex flex-col items-end gap-0.5 min-w-[100px]">
                    <span className="text-sm font-semibold text-foreground flex items-center">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {formatCurrency(receipt.total_amount, false)}
                    </span>
                    {receipt.balance_amount > 0 ? (
                        <span className="text-xs text-red-600 dark:text-red-400">
                            Balance: {formatCurrency(receipt.balance_amount)}
                        </span>
                    ) : (
                        <span className="text-xs text-green-600 dark:green-400">
                            Fully paid
                        </span>
                    )}
                </div>

                {/* Quick Actions */}
                <ItemActions
                    className={cn(
                        'flex items-center gap-1 transition-opacity',
                        !isHovered && 'opacity-0 md:opacity-100'
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewDetails(receipt);
                                }}
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>View Details</TooltipContent>
                    </Tooltip>
                </ItemActions>
            </Item>
        </TooltipProvider>
    );
}
