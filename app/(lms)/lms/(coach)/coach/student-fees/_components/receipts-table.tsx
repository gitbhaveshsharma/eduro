'use client';

/**
 * Receipts Table Component
 * 
 * Displays fee receipts in a sortable table with:
 * - Status badges and payment progress
 * - Action menu for each receipt
 * - Responsive design with loading states
 */

import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { ReceiptStatus } from '@/lib/branch-system/types/fee-receipts.types';

export default function ReceiptsTable() {
    const {
        receipts,
        pagination,
        sort,
        isLoading,
        fetchReceipts,
        setCurrentReceipt,
        setSort,
        setPage,
        nextPage,
        previousPage,
    } = useFeeReceiptsStore();

    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

    // Fetch receipts on mount
    useEffect(() => {
        fetchReceipts();
    }, []);

    // Handle sort
    const handleSort = (column: typeof sort.sort_by) => {
        const newOrder = sort.sort_by === column && sort.sort_order === 'desc' ? 'asc' : 'desc';
        setSort(column, newOrder);
    };

    // Get status badge variant
    const getStatusVariant = (status: ReceiptStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
            case ReceiptStatus.PAID:
                return 'default';
            case ReceiptStatus.PENDING:
                return 'secondary';
            case ReceiptStatus.CANCELLED:
                return 'outline';
            case ReceiptStatus.REFUNDED:
                return 'destructive';
            default:
                return 'default';
        }
    };

    if (isLoading && receipts.length === 0) {
        return <TableSkeleton />;
    }

    if (receipts.length === 0) {
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
    }

    return (
        <div className="space-y-4">
            {/* Table */}
            <div className="rounded-lg border">
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
                        {receipts.map((receipt) => {
                            const progress = calculatePaymentProgress(receipt.total_amount, receipt.amount_paid);
                            const isOverdue = receipt.receipt_status === ReceiptStatus.PENDING &&
                                new Date(receipt.due_date) < new Date();
                            const daysOverdue = isOverdue ? getDaysOverdue(receipt.due_date) : 0;

                            return (
                                <TableRow key={receipt.id}>
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
                                            {isOverdue && (
                                                <Badge variant="destructive" className="text-xs">
                                                    {daysOverdue} days overdue
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {formatCurrency(receipt.total_amount)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className={`font-medium ${receipt.balance_amount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
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
                                        <Badge variant={getStatusVariant(receipt.receipt_status)}>
                                            {formatReceiptStatus(receipt.receipt_status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <StudentRowActions
                                            receipt={receipt}
                                            onView={() => {
                                                setCurrentReceipt(receipt);
                                                setDetailsDialogOpen(true);
                                            }}
                                            onEdit={() => {
                                                setCurrentReceipt(receipt);
                                                setEditDialogOpen(true);
                                            }}
                                            onRecordPayment={() => {
                                                setCurrentReceipt(receipt);
                                                setPaymentDialogOpen(true);
                                            }}
                                            onCancel={() => {
                                                setCurrentReceipt(receipt);
                                                setCancelDialogOpen(true);
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
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

// Sortable Header Component
function SortableHeader({
    label,
    column,
    currentSort,
    currentOrder,
    onSort,
}: {
    label: string;
    column: string;
    currentSort: string;
    currentOrder: 'asc' | 'desc';
    onSort: (column: any) => void;
}) {
    return (
        <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => onSort(column as any)}
        >
            {label}
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    );
}

// Row Actions Component
function StudentRowActions({
    receipt,
    onView,
    onEdit,
    onRecordPayment,
    onCancel,
}: {
    receipt: any;
    onView: () => void;
    onEdit: () => void;
    onRecordPayment: () => void;
    onCancel: () => void;
}) {
    const canEdit = receipt.receipt_status !== ReceiptStatus.CANCELLED &&
        receipt.receipt_status !== ReceiptStatus.REFUNDED &&
        receipt.amount_paid === 0;

    const canRecordPayment = receipt.receipt_status === ReceiptStatus.PENDING &&
        receipt.balance_amount > 0;

    const canCancel = receipt.receipt_status !== ReceiptStatus.CANCELLED &&
        receipt.receipt_status !== ReceiptStatus.REFUNDED;

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
}

// Loading Skeleton
function TableSkeleton() {
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
}
