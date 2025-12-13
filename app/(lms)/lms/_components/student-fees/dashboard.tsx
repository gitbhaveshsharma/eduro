'use client';

/**
 * Dashboard Component
 * 
 * Displays revenue statistics, collection rates, overdue receipts,
 * and financial overview for branch fee receipts management
 */

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
    TrendingUp,
    IndianRupee,
    Receipt,
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle
} from 'lucide-react';

// Import store and utilities
import { useFeeReceiptsStore } from '@/lib/branch-system/stores/fee-receipts.store';
import {
    formatCurrency,
    formatDate,
    formatReceiptStatus,
    formatPaymentMethod,
    getDaysOverdue
} from '@/lib/branch-system/utils/fee-receipts.utils';
import { ReceiptStatus } from '@/lib/branch-system/types/fee-receipts.types';

interface DashboardProps {
    /** Branch ID - for branch manager view (single branch) */
    branchId?: string;
    /** Coaching Center ID - for coach view (all branches) */
    coachingCenterId?: string;
}

export default function Dashboard({ branchId, coachingCenterId }: DashboardProps) {
    const {
        branchStats,
        receipts,
        fetchBranchStats,
        fetchCoachingCenterStats,
        fetchBranchReceipts,
        fetchCoachingCenterReceipts,
        isFetchingStats,
        isLoading,
    } = useFeeReceiptsStore();

    // Fetch data on mount based on branchId or coachingCenterId
    useEffect(() => {
        if (coachingCenterId) {
            // Coach view - fetch all branches of coaching center
            fetchCoachingCenterStats(coachingCenterId);
            fetchCoachingCenterReceipts(coachingCenterId);
        } else if (branchId) {
            // Branch manager view - fetch single branch
            fetchBranchStats(branchId);
            fetchBranchReceipts(branchId);
        }
    }, [branchId, coachingCenterId, fetchBranchStats, fetchCoachingCenterStats, fetchBranchReceipts, fetchCoachingCenterReceipts]);

    // Calculate additional metrics
    const overdueReceipts = receipts.filter((r) => {
        if (r.receipt_status !== ReceiptStatus.PENDING) return false;
        const today = new Date().toISOString().split('T')[0];
        return r.due_date < today;
    });

    const dueSoonReceipts = receipts.filter((r) => {
        if (r.receipt_status !== ReceiptStatus.PENDING) return false;
        const today = new Date();
        const dueDate = new Date(r.due_date);
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
    });

    if (isFetchingStats || isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Revenue */}
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(branchStats?.total_revenue || 0)}
                    icon={<IndianRupee className="h-4 w-4" />}
                    description={`${branchStats?.total_receipts || 0} receipts`}
                    trend={branchStats?.collection_rate}
                />

                {/* Collected */}
                <StatCard
                    title="Collected"
                    value={formatCurrency(branchStats?.total_collected || 0)}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    description={`${branchStats?.paid_receipts || 0} paid`}
                    variant="success"
                />

                {/* Outstanding */}
                <StatCard
                    title="Outstanding"
                    value={formatCurrency(branchStats?.total_outstanding || 0)}
                    icon={<Clock className="h-4 w-4" />}
                    description={`${branchStats?.pending_receipts || 0} pending`}
                    variant="warning"
                />

                {/* Overdue */}
                <StatCard
                    title="Overdue"
                    value={branchStats?.overdue_receipts || 0}
                    icon={<AlertCircle className="h-4 w-4" />}
                    description="Require immediate attention"
                    variant="error"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Collection Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Collection Overview</CardTitle>
                        <CardDescription>Revenue collection progress</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Collection Rate */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Collection Rate</span>
                                <span className="text-muted-foreground">
                                    {branchStats?.collection_rate.toFixed(1)}%
                                </span>
                            </div>
                            <Progress value={branchStats?.collection_rate || 0} />
                        </div>

                        {/* Revenue Breakdown */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Total Due</span>
                                <span className="text-sm font-medium">
                                    {formatCurrency(branchStats?.total_revenue || 0)}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Collected</span>
                                <span className="text-sm font-medium text-green-600">
                                    {formatCurrency(branchStats?.total_collected || 0)}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Outstanding</span>
                                <span className="text-sm font-medium text-orange-600">
                                    {formatCurrency(branchStats?.total_outstanding || 0)}
                                </span>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        {branchStats && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium">Payment Methods</h4>
                                {Object.entries(branchStats.payment_by_method).map(([method, amount]) => {
                                    if (amount === 0) return null;
                                    return (
                                        <div key={method} className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                {formatPaymentMethod(method as any)}
                                            </span>
                                            <span className="font-medium">{formatCurrency(amount)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Receipt Status Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Receipt Status</CardTitle>
                        <CardDescription>Current status distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Status Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1 rounded-lg border p-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium">Paid</span>
                                </div>
                                <div className="text-2xl font-bold">{branchStats?.paid_receipts || 0}</div>
                            </div>

                            <div className="space-y-1 rounded-lg border p-3">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-orange-600" />
                                    <span className="text-sm font-medium">Pending</span>
                                </div>
                                <div className="text-2xl font-bold">{branchStats?.pending_receipts || 0}</div>
                            </div>

                            <div className="space-y-1 rounded-lg border p-3">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <span className="text-sm font-medium">Overdue</span>
                                </div>
                                <div className="text-2xl font-bold">{branchStats?.overdue_receipts || 0}</div>
                            </div>

                            <div className="space-y-1 rounded-lg border p-3">
                                <div className="flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium">Due Soon</span>
                                </div>
                                <div className="text-2xl font-bold">{dueSoonReceipts.length}</div>
                            </div>
                        </div>

                        {/* Active Students Rate */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Active Students</span>
                                <span className="text-muted-foreground">
                                    {branchStats?.total_receipts || 0} enrolled
                                </span>
                            </div>
                            <Progress value={85} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Overdue Receipts */}
            {overdueReceipts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            Overdue Receipts
                        </CardTitle>
                        <CardDescription>
                            {overdueReceipts.length} receipt{overdueReceipts.length !== 1 ? 's' : ''} require immediate attention
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-3">
                                {overdueReceipts.slice(0, 10).map((receipt) => (
                                    <div
                                        key={receipt.id}
                                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{receipt.receipt_number}</span>
                                                <Badge variant="destructive" className="text-xs">
                                                    {getDaysOverdue(receipt.due_date)} days overdue
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {receipt.student?.full_name || 'Unknown Student'} • Due: {formatDate(receipt.due_date)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-red-600">
                                                {formatCurrency(receipt.balance_amount)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                of {formatCurrency(receipt.total_amount)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Stat Card Component
function StatCard({
    title,
    value,
    icon,
    description,
    trend,
    variant = 'default',
}: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    description: string;
    trend?: number;
    variant?: 'default' | 'success' | 'warning' | 'error';
}) {
    const variantClasses = {
        default: 'text-primary',
        success: 'text-green-600',
        warning: 'text-orange-600',
        error: 'text-red-600',
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={variantClasses[variant]}>{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">{description}</p>
                    {trend !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                            <TrendingUp className="h-3 w-3" />
                            {trend.toFixed(1)}%
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Loading Skeleton
function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-32 mb-2" />
                            <Skeleton className="h-3 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-24 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
