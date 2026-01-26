/**
 * Fee Summary Card Component
 * 
 * Displays student fee summary statistics
 * Shows total due, paid, outstanding, and overdue counts
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
    IndianRupee,
    CheckCircle2,
    Clock,
    AlertTriangle,
    TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    formatCurrency,
    calculatePaymentProgress,
} from '@/lib/branch-system/utils/fee-receipts.utils';
import type { StudentPaymentSummary } from '@/lib/branch-system/types/fee-receipts.types';

interface FeeSummaryCardProps {
    summary: StudentPaymentSummary | null;
    isLoading?: boolean;
    className?: string;
}

/**
 * Stat item component
 */
interface StatItemProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subValue?: string;
    colorClass?: string;
    isHighlighted?: boolean;
}

function StatItem({
    icon,
    label,
    value,
    subValue,
    colorClass = 'text-muted-foreground',
    isHighlighted = false,
}: StatItemProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-3 p-3 rounded-xl transition-colors',
                isHighlighted && 'bg-primary/5'
            )}
        >
            <div
                className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-xl',
                    colorClass.includes('green') && 'bg-green-100 dark:bg-green-900/30',
                    colorClass.includes('yellow') && 'bg-yellow-100 dark:bg-yellow-900/30',
                    colorClass.includes('red') && 'bg-red-100 dark:bg-red-900/30',
                    colorClass.includes('blue') && 'bg-blue-100 dark:bg-blue-900/30',
                    !colorClass.includes('green') &&
                    !colorClass.includes('yellow') &&
                    !colorClass.includes('red') &&
                    !colorClass.includes('blue') &&
                    'bg-muted'
                )}
            >
                <span className={cn('text-sm', colorClass)}>{icon}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
                <span className="text-lg font-semibold text-foreground">{value}</span>
                {subValue && (
                    <span className="text-xs text-muted-foreground">{subValue}</span>
                )}
            </div>
        </div>
    );
}

export function FeeSummaryCard({
    summary,
    isLoading = false,
    className,
}: FeeSummaryCardProps) {
    if (isLoading) {
        return (
            <Card className={cn('overflow-hidden', className)}>
                <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3">
                                <Skeleton className="w-10 h-10 rounded-xl" />
                                <div className="flex flex-col gap-1.5">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-5 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 px-3">
                        <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!summary) {
        return (
            <Card className={cn('overflow-hidden', className)}>
                <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No fee summary available</p>
                </CardContent>
            </Card>
        );
    }

    const paymentProgress = calculatePaymentProgress(
        summary.total_amount_due,
        summary.total_amount_paid
    );

    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardContent className="p-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                    <StatItem
                        icon={<IndianRupee className="h-4 w-4" />}
                        label="Total Due"
                        value={formatCurrency(summary.total_amount_due)}
                        subValue={`${summary.total_receipts} receipt${summary.total_receipts !== 1 ? 's' : ''}`}
                        colorClass="text-blue-600"
                    />
                    <StatItem
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        label="Total Paid"
                        value={formatCurrency(summary.total_amount_paid)}
                        subValue={`${summary.paid_receipts} paid`}
                        colorClass="text-green-600"
                    />
                    <StatItem
                        icon={<Clock className="h-4 w-4" />}
                        label="Outstanding"
                        value={formatCurrency(summary.total_outstanding)}
                        subValue={`${summary.pending_receipts} pending`}
                        colorClass="text-yellow-600"
                        isHighlighted={summary.total_outstanding > 0}
                    />
                    <StatItem
                        icon={<AlertTriangle className="h-4 w-4" />}
                        label="Overdue"
                        value={summary.overdue_receipts}
                        subValue={summary.next_due_date ? `Next: ${new Date(summary.next_due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` : undefined}
                        colorClass="text-red-600"
                        isHighlighted={summary.overdue_receipts > 0}
                    />
                </div>

                {/* Payment Progress */}
                <div className="mt-4 px-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Payment Progress
                        </span>
                        <span className="text-xs font-medium text-foreground">
                            {paymentProgress.toFixed(0)}%
                        </span>
                    </div>
                    <Progress
                        value={paymentProgress}
                        className="h-2"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
