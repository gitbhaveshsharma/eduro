'use client';

/**
 * Receipts Table Component
 * 
 * Displays fee receipts in a sortable table with:
 * - Status badges and payment progress
 * - Action menu for each receipt
 * - Responsive design with loading states
 * - Horizontal scroll for wide content
 */

import { useEffect, useMemo, useCallback, memo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    ArrowUpDown,
    MoreHorizontal,
    Eye,
    Edit,
    CreditCard,
    XCircle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

// Import store and utilities
import { useFeeReceiptsStore } from '@/lib/branch-system/stores/fee-receipts.store';
import {
    formatCurrency,
    formatDate,
    formatReceiptStatus,
    getDaysOverdue,
    calculatePaymentProgress
} from '@/lib/branch-system/utils/fee-receipts.utils';
import { 
    ReceiptStatus,
    RECEIPT_STATUS_OPTIONS,
    type FeeReceipt 
} from '@/lib/branch-system/types/fee-receipts.types';

// ============================================================
// UTILITY TYPES & HELPERS
// ============================================================

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

/**
 * Maps receipt status to Badge variant
 * Uses RECEIPT_STATUS_OPTIONS for consistent color mapping
 */
function getReceiptStatusVariant(status: ReceiptStatus): BadgeVariant {
    const statusConfig = RECEIPT_STATUS_OPTIONS[status];
    if (!statusConfig) return 'secondary';
    
    // Map from status config color to Badge variant
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
 * Gets receipt status label from configuration
 */
function getReceiptStatusLabel(status: ReceiptStatus): string {
    const statusConfig = RECEIPT_STATUS_OPTIONS[status];
    return statusConfig?.label || formatReceiptStatus(status);
}

/**
 * Gets balance color class based on amount
 */
function getBalanceColorClass(balance: number): string {
    if (balance > 0) return 'text-orange-600 dark:text-orange-500';
    return 'text-green-600 dark:text-green-500';
}

/**
 * Checks if receipt is overdue
 */
function isReceiptOverdue(receipt: FeeReceipt): boolean {
    return receipt.receipt_status === ReceiptStatus.PENDING &&
        new Date(receipt.due_date) < new Date();
}

/**
 * Gets overdue badge props
 */
function getOverdueBadgeProps(dueDate: string): { variant: BadgeVariant; label: string } | null {
    const daysOverdue = getDaysOverdue(dueDate);
    if (daysOverdue <= 0) return null;
    
    return {
        variant: 'destructive',
        label: `${daysOverdue} days overdue`
    };
}

/**
 * Receipt permissions helper
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

// ============================================================
// SUB-COMPONENTS
// ============================================================

/**
 * Sortable Header Component - Memoized
 */
interface SortableHeaderProps {
    label: string;
    column: string;
    currentSort: string;
    currentOrder: 'asc' | 'desc';
    onSort: (column: string) => void;
}

const SortableHeader = memo(function SortableHeader({
    label,
    column,
    currentSort,
    currentOrder,
    onSort,
}: SortableHeaderProps) {
    const handleClick = useCallback(() => {
        onSort(column);
    }, [column, onSort]);
    
    const isActive = currentSort === column;
    
    return (
        <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={handleClick}
        >
            {label}
            <ArrowUpDown className={`ml-2 h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
        </Button>
    );
});

/**
 * Row Actions Component - Memoized
 */
interface ReceiptRowActionsProps {
    receipt: FeeReceipt;
    onView: () => void;
    onEdit: () => void;
    onRecordPayment: () => void;
    onCancel: () => void;
}

const ReceiptRowActions = memo(function ReceiptRowActions({
    receipt,
    onView,
    onEdit,
    onRecordPayment,
    onCancel,
}: ReceiptRowActionsProps) {
    const { canEdit, canRecordPayment, canCancel } = useMemo(
        () => getReceiptPermissions(receipt),
        [receipt]
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onView}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                </DropdownMenuItem>
                {canEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Receipt
                    </DropdownMenuItem>
                )}
                {canRecordPayment && (
                    <DropdownMenuItem onClick={onRecordPayment}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Record Payment
                    </DropdownMenuItem>
                )}
                {canCancel && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onCancel} className="text-destructive">
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Receipt
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

/**
 * Receipt Row Component - Memoized
 */
interface ReceiptRowProps {
    receipt: FeeReceipt;
    onView: (receipt: FeeReceipt) => void;
    onEdit: (receipt: FeeReceipt) => void;
    onRecordPayment: (receipt: FeeReceipt) => void;
    onCancel: (receipt: FeeReceipt) => void;
}

const ReceiptRow = memo(function ReceiptRow({
    receipt,
    onView,
    onEdit,
    onRecordPayment,
    onCancel,
}: ReceiptRowProps) {
    // Memoize payment progress
    const progress = useMemo(
        () => calculatePaymentProgress(receipt.total_amount, receipt.amount_paid),
        [receipt.total_amount, receipt.amount_paid]
    );

    // Memoize overdue status
    const isOverdue = useMemo(
        () => isReceiptOverdue(receipt),
        [receipt]
    );

    // Memoize overdue badge
    const overdueBadge = useMemo(() => {
        if (!isOverdue) return null;
        const badgeProps = getOverdueBadgeProps(receipt.due_date);
        if (!badgeProps) return null;
        
        return (
            <Badge variant={badgeProps.variant} className="text-xs">
                {badgeProps.label}
            </Badge>
        );
    }, [isOverdue, receipt.due_date]);

    // Memoize status badge
    const statusBadge = useMemo(() => {
        const variant = getReceiptStatusVariant(receipt.receipt_status);
        const label = getReceiptStatusLabel(receipt.receipt_status);
        
        return (
            <Badge variant={variant}>
                {label}
            </Badge>
        );
    }, [receipt.receipt_status]);

    // Memoize balance color
    const balanceColorClass = useMemo(
        () => getBalanceColorClass(receipt.balance_amount),
        [receipt.balance_amount]
    );

    // Action callbacks
    const handleView = useCallback(() => onView(receipt), [receipt, onView]);
    const handleEdit = useCallback(() => onEdit(receipt), [receipt, onEdit]);
    const handleRecordPayment = useCallback(() => onRecordPayment(receipt), [receipt, onRecordPayment]);
    const handleCancel = useCallback(() => onCancel(receipt), [receipt, onCancel]);

    return (
        <TableRow>
            <TableCell>
                <div className="space-y-1">
                    <div className="font-medium">{receipt.receipt_number}</div>
                    <div className="text-xs text-muted-foreground">
                        {formatDate(receipt.receipt_date)}
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <div className="space-y-1">
                    <div className="font-medium">
                        {receipt.student?.full_name || 'Unknown'}
                    </div>
                    {receipt.class?.class_name && (
                        <div className="text-xs text-muted-foreground">
                            {receipt.class.class_name}
                        </div>
                    )}
                </div>
            </TableCell>
            <TableCell>
                <div className="space-y-1">
                    <div>{formatDate(receipt.due_date)}</div>
                    {overdueBadge}
                </div>
            </TableCell>
            <TableCell className="font-medium">
                {formatCurrency(receipt.total_amount)}
            </TableCell>
            <TableCell>
                <div className="space-y-1">
                    <div className={`font-medium ${balanceColorClass}`}>
                        {formatCurrency(receipt.balance_amount)}
                    </div>
                    {receipt.amount_paid > 0 && (
                        <div className="text-xs text-muted-foreground">
                            Paid: {formatCurrency(receipt.amount_paid)}
                        </div>
                    )}
                </div>
            </TableCell>
            <TableCell>
                <div className="space-y-2 min-w-[150px]">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </TableCell>
            <TableCell>
                {statusBadge}
            </TableCell>
            <TableCell>
                <ReceiptRowActions
                    receipt={receipt}
                    onView={handleView}
                    onEdit={handleEdit}
                    onRecordPayment={handleRecordPayment}
                    onCancel={handleCancel}
                />
            </TableCell>
        </TableRow>
    );
}, (prevProps, nextProps) => {
    // Custom comparison to prevent re-render if receipt data hasn't changed
    return prevProps.receipt.id === nextProps.receipt.id &&
        prevProps.receipt.receipt_status === nextProps.receipt.receipt_status &&
        prevProps.receipt.amount_paid === nextProps.receipt.amount_paid &&
        prevProps.receipt.balance_amount === nextProps.receipt.balance_amount;
});

/**
 * Loading Skeleton - Memoized
 */
const TableSkeleton = memo(function TableSkeleton() {
    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {[...Array(8)].map((_, i) => (
                            <TableHead key={i}>
                                <Skeleton className="h-4 w-20" />
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            {[...Array(8)].map((_, j) => (
                                <TableCell key={j}>
                                    <Skeleton className="h-4 w-full" />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
});

/**
 * Empty State Component - Memoized
 */
const EmptyState = memo(function EmptyState() {
    return (
        <div className="rounded-lg border border-dashed p-12 text-center">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                    <CreditCard className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-xl mb-2">No receipts found</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Start by creating a new fee receipt for your students
                </p>
                <Button>Create Receipt</Button>
            </div>
        </div>
    );
});

// ============================================================
// MAIN COMPONENT
// ============================================================

interface ReceiptsTableProps {
    /** Branch ID - for branch manager view (single branch) */
    branchId?: string;
    /** Coaching Center ID - for coach view (all branches) */
    coachingCenterId?: string;
}

export default function ReceiptsTable({ branchId, coachingCenterId }: ReceiptsTableProps) {
    const {
        receipts,
        pagination,
        sort,
        isLoading,
        fetchBranchReceipts,
        fetchCoachingCenterReceipts,
        openDialog,
        setSort,
        nextPage,
        previousPage,
    } = useFeeReceiptsStore();

    // Fetch receipts on mount based on branchId or coachingCenterId
    useEffect(() => {
        if (coachingCenterId) {
            // Coach view - fetch all branches of coaching center
            fetchCoachingCenterReceipts(coachingCenterId);
        } else if (branchId) {
            // Branch manager view - fetch single branch
            fetchBranchReceipts(branchId);
        }
        // Note: If neither branchId nor coachingCenterId is provided,
        // no fetch is performed - this component requires context
    }, [branchId, coachingCenterId, fetchBranchReceipts, fetchCoachingCenterReceipts]);

    // Handle sort
    const handleSort = useCallback((column: typeof sort.sort_by) => {
        const newOrder = sort.sort_by === column && sort.sort_order === 'desc' ? 'asc' : 'desc';
        setSort(column, newOrder);
    }, [sort.sort_by, sort.sort_order, setSort]);

    // Action handlers
    const handleView = useCallback((receipt: FeeReceipt) => {
        openDialog('details', receipt);
    }, [openDialog]);

    const handleEdit = useCallback((receipt: FeeReceipt) => {
        openDialog('edit', receipt);
    }, [openDialog]);

    const handleRecordPayment = useCallback((receipt: FeeReceipt) => {
        openDialog('payment', receipt);
    }, [openDialog]);

    const handleCancel = useCallback((receipt: FeeReceipt) => {
        openDialog('cancel', receipt);
    }, [openDialog]);

    if (isLoading && receipts.length === 0) {
        return <TableSkeleton />;
    }

    if (receipts.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="space-y-4">
            {/* Table with Horizontal Scroll */}
            <div className="rounded-lg border">
                <ScrollArea className="w-full">
                    <div className="min-w-max">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        <SortableHeader
                                            label="Receipt #"
                                            column="receipt_date"
                                            currentSort={sort.sort_by}
                                            currentOrder={sort.sort_order}
                                            onSort={handleSort}
                                        />
                                    </TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>
                                        <SortableHeader
                                            label="Due Date"
                                            column="due_date"
                                            currentSort={sort.sort_by}
                                            currentOrder={sort.sort_order}
                                            onSort={handleSort}
                                        />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader
                                            label="Total Amount"
                                            column="total_amount"
                                            currentSort={sort.sort_by}
                                            currentOrder={sort.sort_order}
                                            onSort={handleSort}
                                        />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader
                                            label="Balance"
                                            column="balance_amount"
                                            currentSort={sort.sort_by}
                                            currentOrder={sort.sort_order}
                                            onSort={handleSort}
                                        />
                                    </TableHead>
                                    <TableHead>Payment Progress</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {receipts.map((receipt) => (
                                    <ReceiptRow
                                        key={receipt.id}
                                        receipt={receipt}
                                        onView={handleView}
                                        onEdit={handleEdit}
                                        onRecordPayment={handleRecordPayment}
                                        onCancel={handleCancel}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} receipts
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={previousPage}
                        disabled={pagination.page === 1 || isLoading}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                    </Button>
                    <div className="text-sm font-medium">
                        Page {pagination.page}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={nextPage}
                        disabled={!pagination.has_more || isLoading}
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
