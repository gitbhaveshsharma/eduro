/**
 * Fee Status Filter Component
 * 
 * Horizontal scrollable filter pills for filtering receipts by status
 * Similar to AttendanceClassFilter component style
 */

'use client';

import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
    CheckCircle2,
    Clock,
    XCircle,
    RefreshCw,
    Receipt,
    AlertTriangle,
} from 'lucide-react';
import {
    ReceiptStatus,
    RECEIPT_STATUS_OPTIONS,
} from '@/lib/branch-system/types/fee-receipts.types';

interface FeeStatusFilterProps {
    selectedStatus: ReceiptStatus | 'ALL' | 'OVERDUE';
    onStatusChange: (status: ReceiptStatus | 'ALL' | 'OVERDUE') => void;
    overdueCount?: number;
    isLoading?: boolean;
}

/**
 * Get icon for status
 */
function getStatusIcon(status: ReceiptStatus | 'ALL' | 'OVERDUE') {
    const icons: Record<ReceiptStatus | 'ALL' | 'OVERDUE', React.ReactNode> = {
        ALL: <Receipt className="h-4 w-4" />,
        OVERDUE: <AlertTriangle className="h-4 w-4" />,
        [ReceiptStatus.PAID]: <CheckCircle2 className="h-4 w-4" />,
        [ReceiptStatus.PENDING]: <Clock className="h-4 w-4" />,
        [ReceiptStatus.CANCELLED]: <XCircle className="h-4 w-4" />,
        [ReceiptStatus.REFUNDED]: <RefreshCw className="h-4 w-4" />,
    };
    return icons[status];
}

/**
 * Get color configuration for status
 */
function getStatusColorConfig(status: ReceiptStatus | 'ALL' | 'OVERDUE', isActive: boolean) {
    if (isActive) {
        return 'bg-primary/10 text-primary';
    }

    const colorConfig: Record<ReceiptStatus | 'ALL' | 'OVERDUE', string> = {
        ALL: 'bg-muted/80 text-foreground',
        OVERDUE: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
        [ReceiptStatus.PAID]: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
        [ReceiptStatus.PENDING]: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
        [ReceiptStatus.CANCELLED]: 'bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400',
        [ReceiptStatus.REFUNDED]: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    };
    return colorConfig[status];
}

/**
 * Status filter options
 */
const STATUS_FILTERS: Array<{
    value: ReceiptStatus | 'ALL' | 'OVERDUE';
    label: string;
    description: string;
}> = [
        {
            value: 'ALL',
            label: 'All Receipts',
            description: 'View all fee receipts',
        },
        {
            value: 'OVERDUE',
            label: 'Overdue',
            description: 'Receipts past due date',
        },
        {
            value: ReceiptStatus.PENDING,
            label: RECEIPT_STATUS_OPTIONS[ReceiptStatus.PENDING].label,
            description: RECEIPT_STATUS_OPTIONS[ReceiptStatus.PENDING].description,
        },
        {
            value: ReceiptStatus.PAID,
            label: RECEIPT_STATUS_OPTIONS[ReceiptStatus.PAID].label,
            description: RECEIPT_STATUS_OPTIONS[ReceiptStatus.PAID].description,
        },
        {
            value: ReceiptStatus.CANCELLED,
            label: RECEIPT_STATUS_OPTIONS[ReceiptStatus.CANCELLED].label,
            description: RECEIPT_STATUS_OPTIONS[ReceiptStatus.CANCELLED].description,
        },
        {
            value: ReceiptStatus.REFUNDED,
            label: RECEIPT_STATUS_OPTIONS[ReceiptStatus.REFUNDED].label,
            description: RECEIPT_STATUS_OPTIONS[ReceiptStatus.REFUNDED].description,
        },
    ];

export function FeeStatusFilter({
    selectedStatus,
    onStatusChange,
    overdueCount = 0,
    isLoading = false,
}: FeeStatusFilterProps) {
    if (isLoading) {
        return (
            <div className="flex gap-3 py-2">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-11 w-28 rounded-full" />
                ))}
            </div>
        );
    }

    return (
        <ScrollArea className="w-full whitespace-nowrap overflow-x-auto">
            <div className="flex gap-3 py-2">
                {STATUS_FILTERS.map((filter) => {
                    const isActive = selectedStatus === filter.value;
                    const colorConfig = getStatusColorConfig(filter.value, isActive);
                    const icon = getStatusIcon(filter.value);

                    return (
                        <button
                            key={filter.value}
                            onClick={() => onStatusChange(filter.value)}
                            className={cn(
                                'inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full text-sm font-medium',
                                'border transition-all duration-200 whitespace-nowrap',
                                'focus:outline-none focus:ring-2 focus:ring-primary/20',
                                'bg-white dark:bg-gray-900',
                                isActive
                                    ? 'border-primary text-primary shadow-sm bg-primary/5 hover:border-primary hover:text-primary'
                                    : 'border-border/50 text-foreground hover:border-primary hover:text-primary hover:bg-primary/5'
                            )}
                        >
                            <span
                                className={cn(
                                    'flex items-center justify-center w-7 h-7 rounded-lg text-sm',
                                    colorConfig
                                )}
                            >
                                {icon}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="font-medium leading-tight">{filter.label}</span>
                                {filter.value === 'OVERDUE' && overdueCount > 0 && (
                                    <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                                        {overdueCount}
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
            <ScrollBar orientation="horizontal" className="h-2 hidden" />
        </ScrollArea>
    );
}
