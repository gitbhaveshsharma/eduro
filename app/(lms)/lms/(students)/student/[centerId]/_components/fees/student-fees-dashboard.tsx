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

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Track the center we're currently displaying to prevent stale data
    const activeCenterId = useRef<string>(centerId);

    // Prevent duplicate API calls
    const fetchInProgress = useRef(false);
    const lastFetchedCenter = useRef<string | null>(null);

    // Store state
    const {
        receipts,
        studentSummary,
        isLoading,
        isFetchingSummary,
        error,
        currentCoachingCenterId,
        fetchStudentData,
        clearFilters,
    } = useFeeReceiptsStore();

    // Single fetch effect - only runs when centerId or userId changes
    useEffect(() => {
        if (!userId || !centerId) return;

        // Skip if already fetching or already fetched for this center
        if (fetchInProgress.current || lastFetchedCenter.current === centerId) {
            return;
        }

        // Update active center reference
        activeCenterId.current = centerId;
        setIsInitialLoad(true);
        setShowNoReceipts(false);

        // Fetch data - OPTIMIZED: Single API call gets both receipts and summary
        const fetchData = async () => {
            fetchInProgress.current = true;

            try {
                await fetchStudentData(userId, centerId);
                lastFetchedCenter.current = centerId;
            } catch (err) {
                console.error('[StudentFeesDashboard] Fetch error:', err);
            } finally {
                fetchInProgress.current = false;
                setIsInitialLoad(false);
            }
        };

        fetchData();

        // Cleanup when centerId changes
        return () => {
            if (activeCenterId.current !== centerId) {
                lastFetchedCenter.current = null;
            }
        };
    }, [userId, centerId]); // Remove store methods from dependencies

    // Show "no receipts" message after data loads
    useEffect(() => {
        if (!isInitialLoad && !isLoading && receipts.length === 0 && currentCoachingCenterId === centerId) {
            const timer = setTimeout(() => {
                setShowNoReceipts(true);
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setShowNoReceipts(false);
        }
    }, [isInitialLoad, isLoading, receipts.length, currentCoachingCenterId, centerId]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            clearFilters();
            lastFetchedCenter.current = null;
        };
    }, []);

    // Only show receipts that belong to the current center
    const centerReceipts = useMemo(() => {
        // Don't show any data if:
        // 1. Still on initial load
        // 2. Center doesn't match
        // 3. Store's center doesn't match component's center
        if (isInitialLoad || activeCenterId.current !== centerId || currentCoachingCenterId !== centerId) {
            return [];
        }

        return receipts;
    }, [receipts, centerId, currentCoachingCenterId, isInitialLoad]);

    // Filter receipts by selected status
    const filteredReceipts = useMemo(() => {
        if (selectedStatus === 'ALL') {
            return centerReceipts;
        }

        if (selectedStatus === 'OVERDUE') {
            return filterOverdueReceipts(centerReceipts);
        }

        return centerReceipts.filter(receipt => receipt.receipt_status === selectedStatus);
    }, [centerReceipts, selectedStatus]);

    // Calculate overdue count for filter badge
    const overdueCount = useMemo(() => {
        if (isInitialLoad || currentCoachingCenterId !== centerId) {
            return 0;
        }
        return centerReceipts.filter(receipt =>
            isOverdue(receipt.due_date, receipt.receipt_status)
        ).length;
    }, [centerReceipts, isInitialLoad, currentCoachingCenterId, centerId]);

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
    const handleRefresh = useCallback(async () => {
        if (!userId || !centerId || fetchInProgress.current) return;

        fetchInProgress.current = true;

        try {
            await fetchStudentData(userId, centerId);
            lastFetchedCenter.current = centerId;
        } catch (err) {
            console.error('[StudentFeesDashboard] Refresh error:', err);
        } finally {
            fetchInProgress.current = false;
        }
    }, [userId, centerId, fetchStudentData]);

    // Show loading skeleton only on initial load or when center changes
    const showLoadingSkeleton = isInitialLoad || (isLoading && centerReceipts.length === 0);

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
    if (error && centerReceipts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Alert variant="destructive" className="max-w-md mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button
                    variant="outline"
                    onClick={handleRefresh}
                    className="gap-2"
                    disabled={fetchInProgress.current}
                >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                </Button>
            </div>
        );
    }

    // No receipts state
    if (showNoReceipts && centerReceipts.length === 0) {
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
                        disabled={fetchInProgress.current || isLoading}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
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
                isLoading={false}
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
