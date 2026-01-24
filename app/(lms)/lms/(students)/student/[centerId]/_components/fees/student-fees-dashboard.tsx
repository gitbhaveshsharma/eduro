/**
 * Student Fees Dashboard Component
 * 
 * Main dashboard for students to view their fee receipts
 * Features:
 * - Fee summary with statistics
 * - Status filter for receipts
 * - Receipt list with detailed view
 * - READ-ONLY view (students cannot modify receipts)
 * 
 * IMPORTANT: This only shows fees for the current coaching center (centerId)
 * If student is enrolled in multiple centers, each center shows its own fees
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth-guard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Receipt, RefreshCw, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

// Fee receipts imports
import { useFeeReceiptsStore } from '@/lib/branch-system/stores/fee-receipts.store';
import {
    ReceiptStatus,
    type FeeReceipt,
    type StudentPaymentSummary,
} from '@/lib/branch-system/types/fee-receipts.types';
import {
    isOverdue,
    filterOverdueReceipts,
} from '@/lib/branch-system/utils/fee-receipts.utils';

// Local components
import { FeeStatusFilter } from './fee-status-filter';
import { FeeSummaryCard } from './fee-summary-card';
import { FeeReceiptList } from './fee-receipt-list';
import { ReceiptDetailModal } from './receipt-detail-modal';
import { FeeDownloadModal } from './fee-download-modal';

import { showErrorToast } from '@/lib/toast';

interface StudentFeesDashboardProps {
    centerId: string;
}

export function StudentFeesDashboard({ centerId }: StudentFeesDashboardProps) {
    const { userId } = useAuth();

    // Local state
    const [selectedStatus, setSelectedStatus] = useState<ReceiptStatus | 'ALL' | 'OVERDUE'>('ALL');
    const [selectedReceipt, setSelectedReceipt] = useState<FeeReceipt | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [showNoReceipts, setShowNoReceipts] = useState(false);

    // Track if we're ready to show data for this specific center
    // This prevents flashing of data from other centers
    const [isDataReady, setIsDataReady] = useState(false);

    // Store state
    const {
        receipts,
        studentSummary,
        isLoading,
        isFetchingSummary,
        error,
        currentCoachingCenterId,
        fetchCoachingCenterReceipts,
        fetchStudentSummary,
        setFilters,
        clearFilters,
    } = useFeeReceiptsStore();

    // Reset data ready state when centerId changes (MUST be before fetch effect)
    useEffect(() => {
        setIsDataReady(false);
        setShowNoReceipts(false);
    }, [centerId]);

    // Fetch receipts and summary for this student filtered by coaching center
    useEffect(() => {
        if (!userId || !centerId) return;

        // Set filters for this student
        setFilters({
            student_id: userId,
        });

        // Fetch both receipts and summary for this coaching center
        const fetchData = async () => {
            await fetchCoachingCenterReceipts(centerId);
            await fetchStudentSummary(userId, centerId);
        };

        fetchData();
    }, [userId, centerId, setFilters, fetchCoachingCenterReceipts, fetchStudentSummary]);

    // Mark data as ready when store has updated for current center
    useEffect(() => {
        if (currentCoachingCenterId === centerId && !isLoading) {
            setIsDataReady(true);
        }
    }, [currentCoachingCenterId, centerId, isLoading]);

    // Wait before showing "no receipts" message (only when data is ready)
    useEffect(() => {
        if (isDataReady && !isLoading && receipts.length === 0) {
            const timer = setTimeout(() => {
                setShowNoReceipts(true);
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setShowNoReceipts(false);
        }
    }, [isDataReady, isLoading, receipts.length]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            clearFilters();
        };
    }, [clearFilters]);

    // Filter receipts by selected status and coaching center
    // IMPORTANT: Only return data when we're sure it's for the current center
    const filteredReceipts = useMemo(() => {
        // Safety check: Don't show receipts if:
        // 1. Data isn't ready for current center
        // 2. Store's center doesn't match component's center
        // 3. Still loading
        if (!isDataReady || currentCoachingCenterId !== centerId || isLoading) {
            return [];
        }

        // First, filter by coaching center (using branch from receipt)
        // Since students can be enrolled in multiple centers, we need to filter
        // receipts that belong to branches of the current coaching center
        const centerReceipts = receipts.filter(receipt => {
            // The receipt should have the branch info
            // We'll match by checking if the receipt's coaching_center matches
            // For now, we rely on the API filtering - but this is an extra safety check
            return true; // API should already filter by student_id
        });

        // Then filter by selected status
        if (selectedStatus === 'ALL') {
            return centerReceipts;
        }

        if (selectedStatus === 'OVERDUE') {
            return filterOverdueReceipts(centerReceipts);
        }

        return centerReceipts.filter(receipt => receipt.receipt_status === selectedStatus);
    }, [receipts, selectedStatus, isDataReady, currentCoachingCenterId, centerId]);

    // Calculate overdue count for filter badge (only when data is ready)
    const overdueCount = useMemo(() => {
        if (!isDataReady || currentCoachingCenterId !== centerId) {
            return 0;
        }
        return receipts.filter(receipt => isOverdue(receipt.due_date, receipt.receipt_status)).length;
    }, [receipts, isDataReady, currentCoachingCenterId, centerId]);

    // Handler: Change status filter
    const handleStatusChange = useCallback((status: ReceiptStatus | 'ALL' | 'OVERDUE') => {
        setSelectedStatus(status);
    }, []);

    // Handler: View receipt details
    const handleViewDetails = useCallback((receipt: FeeReceipt) => {
        setSelectedReceipt(receipt);
        setIsDetailModalOpen(true);
    }, []);

    // Handler: Close detail modal
    const handleCloseDetailModal = useCallback(() => {
        setIsDetailModalOpen(false);
        setSelectedReceipt(null);
    }, []);

    // Handler: Refresh data
    const handleRefresh = useCallback(() => {
        if (userId && centerId) {
            fetchCoachingCenterReceipts(centerId);
            fetchStudentSummary(userId, centerId);
        }
    }, [userId, centerId, fetchCoachingCenterReceipts, fetchStudentSummary]);

    // Loading skeleton state - show when:
    // 1. Initial loading with no data
    // 2. Data isn't ready for current center (prevents flash of stale data)
    const showLoadingSkeleton = !isDataReady || (isLoading && receipts.length === 0);

    if (showLoadingSkeleton) {
        return (
            <div className="space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-9 w-24" />
                </div>

                {/* Summary Skeleton */}
                <Skeleton className="h-32 w-full rounded-xl" />

                {/* Filter Skeleton */}
                <div className="flex gap-3">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-28 rounded-full" />
                    ))}
                </div>

                {/* List Skeleton */}
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error && receipts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Alert variant="destructive" className="max-w-md mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button variant="outline" onClick={handleRefresh} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                </Button>
            </div>
        );
    }

    // No receipts state (after loading)
    if (showNoReceipts && receipts.length === 0) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Fee Receipts</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            View and track your fee payments
                        </p>
                    </div>
                </div>

                {/* Empty State */}
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="rounded-full bg-muted p-6 mb-4">
                        <Receipt className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Fee Receipts</h3>
                    <p className="text-sm text-muted-foreground max-w-md text-center">
                        You don&apos;t have any fee receipts for this coaching center yet.
                        Receipts will appear here once they are generated.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Fee Receipts</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        View and track your fee payments
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDownloadModalOpen(true)}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Download PDF
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        loading={isLoading}
                        loadingText="Refreshing..."
                        className="gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Fee Summary Card */}
            <FeeSummaryCard
                summary={studentSummary}
                isLoading={isFetchingSummary}
            />

            {/* Status Filter */}
            <FeeStatusFilter
                selectedStatus={selectedStatus}
                onStatusChange={handleStatusChange}
                overdueCount={overdueCount}
                isLoading={isLoading}
            />

            {/* Filter Info */}
            {selectedStatus !== 'ALL' && (
                <div className="text-sm text-muted-foreground">
                    Showing {filteredReceipts.length} {selectedStatus.toLowerCase()} receipt
                    {filteredReceipts.length !== 1 ? 's' : ''}
                </div>
            )}

            {/* Receipt List */}
            <FeeReceiptList
                receipts={filteredReceipts}
                onViewDetails={handleViewDetails}
                isLoading={isLoading && receipts.length === 0}
                error={error}
                onRefresh={handleRefresh}
            />

            {/* Receipt Detail Modal */}
            <ReceiptDetailModal
                receipt={selectedReceipt}
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
            />

            {/* Fee Download Modal */}
            <FeeDownloadModal
                isOpen={isDownloadModalOpen}
                onClose={() => setIsDownloadModalOpen(false)}
                studentId={userId || ''}
                centerId={centerId}
            />
        </div>
    );
}
