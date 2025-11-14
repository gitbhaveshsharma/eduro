/**
 * Fee Receipts System - Central Export
 * 
 * Main export file for the fee receipts system.
 * Provides centralized access to all fee receipt-related functionality including
 * types, validations, utilities, services, and stores.
 * 
 * @module branch-system/fee-receipts
 */

// ============================================================
// SERVICE & STORE EXPORTS
// ============================================================

export {
    feeReceiptsService,
    type FeeReceiptOperationResult,
} from './services/fee-receipts.service';

export {
    useFeeReceiptsStore,
    // Types
    type FeeReceiptsState,
} from './stores/fee-receipts.store';

// ============================================================
// TYPE EXPORTS
// ============================================================

export {
    // Enums
    PaymentMethod,
    ReceiptStatus,
    // Core interfaces
    type FeeReceiptRow,
    type FeeReceipt,
    type PublicFeeReceipt,
    // Input DTOs
    type CreateFeeReceiptInput,
    type RecordPaymentInput,
    type UpdateReceiptInput,
    type CancelReceiptInput,
    // Filters and queries
    type FeeReceiptFilters,
    type FeeReceiptListParams,
    type FeeReceiptListResponse,
    // Statistics
    type StudentPaymentSummary,
    type BranchRevenueStats,
    type PaymentHistoryRecord,
    type OverdueReceipt,
    type ReceiptGenerationParams,
    // Operation results
    type FeeReceiptValidationError,
    type ReceiptCreationResult,
    type PaymentRecordingResult,
    type BulkGenerationResult,
    // Dashboard types
    type StudentPaymentDashboard,
    type BranchManagerDashboard,
    type ReceiptDetailView,
    // Utility types
    type FeeCalculationParams,
    type FeeCalculationResult,
    type ReceiptNumberParams,
    type PaymentStatusInfo,
    // Type guards
    isReceiptPaid,
    isReceiptOverdue,
    hasPartialPayment,
} from './types/fee-receipts.types';

// ============================================================
// VALIDATION EXPORTS
// ============================================================

export {
    // Enum schemas
    paymentMethodSchema,
    receiptStatusSchema,
    // Base field schemas
    uuidSchema,
    receiptNumberSchema,
    isoDateSchema,
    futureDateSchema,
    pastOrPresentDateSchema,
    amountSchema,
    positiveAmountSchema,
    monthSchema,
    yearSchema,
    descriptionSchema,
    internalNotesSchema,
    paymentReferenceSchema,
    // Main operation schemas
    createFeeReceiptSchema,
    recordPaymentSchema,
    updateReceiptSchema,
    cancelReceiptSchema,
    feeReceiptFiltersSchema,
    feeReceiptListParamsSchema,
    receiptGenerationParamsSchema,
    feeCalculationParamsSchema,
    // Bulk operation schemas
    bulkCreateReceiptsSchema,
    bulkRecordPaymentsSchema,
    // Helper functions
    validateInput,
    validateAmountLimits,
    validatePaymentAmount,
    validateReceiptModifiable,
    validateDateRange,
} from './validations/fee-receipts.validation';

// ============================================================
// UTILITY EXPORTS
// ============================================================

export {
    // Formatting utilities
    formatCurrency,
    formatReceiptNumber,
    formatPaymentMethod,
    formatReceiptStatus,
    formatDate,
    formatMonthYear,
    formatFeePeriod,
    // Calculation utilities
    calculateTotalAmount,
    calculateBalance,
    calculateLateFee,
    calculateDiscount,
    calculateTax,
    calculateFeeBreakdown,
    calculatePaymentProgress,
    calculateCollectionRate,
    // Date utilities
    getDaysUntilDue,
    getDaysOverdue,
    isOverdue,
    isDueSoon,
    getCurrentMonthYear,
    getTodayISODate,
    addDaysToDate,
    getMonthDateRange,
    // Status utilities
    getReceiptStatusInfo,
    getStatusBadgeColor,
    getPaymentPriority,
    canEditReceipt,
    canCancelReceipt,
    canRecordPayment,
    // Transformation utilities
    toPublicReceipt,
    groupReceiptsByStatus,
    groupReceiptsByMonth,
    sortReceiptsByPriority,
    filterOverdueReceipts,
    filterDueSoonReceipts,
    // Summary utilities
    calculateStudentSummary,
    calculateBranchStats,
    generateOverdueList,
    // Validation helpers
    validatePaymentAmount as validatePaymentAmountUtil,
    validateDiscountAmount,
    validateDateRange as validateDateRangeUtil,
} from './utils/fee-receipts.utils';

// ============================================================
// CONVENIENCE EXPORTS
// ============================================================

/**
 * Pre-configured service instance for immediate use
 */
export const receiptService = feeReceiptsService;

/**
 * Complete fee receipts system bundle
 * Contains all essential parts of the fee receipts system
 */
export const feeReceiptsSystem = {
    // Core service
    service: feeReceiptsService,

    // Store hook
    useStore: useFeeReceiptsStore,

    // Validation schemas (commonly used)
    validation: {
        createReceipt: createFeeReceiptSchema,
        recordPayment: recordPaymentSchema,
        updateReceipt: updateReceiptSchema,
        cancelReceipt: cancelReceiptSchema,
        listParams: feeReceiptListParamsSchema,
    },

    // Common utilities
    utils: {
        formatCurrency,
        formatDate,
        calculateTotalAmount,
        calculateBalance,
        isOverdue,
        canRecordPayment,
        toPublicReceipt,
    },
} as const;

// ============================================================
// QUICK START EXAMPLE
// ============================================================

/**
 * Quick Start Usage Examples
 * 
 * @example
 * ```typescript
 * import { 
 *   feeReceiptsService, 
 *   useFeeReceiptsStore,
 *   PaymentMethod,
 *   formatCurrency
 * } from '@/lib/branch-system/fee-receipts';
 * 
 * // In a React component
 * function ReceiptsComponent() {
 *   const { 
 *     receipts, 
 *     createReceipt, 
 *     recordPayment,
 *     fetchReceipts 
 *   } = useFeeReceiptsStore();
 *   
 *   // Create a receipt
 *   const handleCreateReceipt = async () => {
 *     const result = await createReceipt({
 *       student_id: "student-uuid",
 *       branch_id: "branch-uuid",
 *       enrollment_id: "enrollment-uuid",
 *       class_id: "class-uuid",
 *       due_date: "2024-02-15",
 *       base_fee_amount: 5000,
 *       description: "Monthly tuition fee"
 *     });
 *     
 *     if (result) {
 *       console.log('Receipt created:', formatCurrency(result.total_amount));
 *     }
 *   };
 *   
 *   // Record payment
 *   const handleRecordPayment = async (receiptId: string) => {
 *     const result = await recordPayment({
 *       receipt_id: receiptId,
 *       amount_paid: 5000,
 *       payment_method: PaymentMethod.UPI,
 *       payment_reference: "UPI123456789"
 *     });
 *     
 *     if (result) {
 *       console.log('Payment recorded. New balance:', formatCurrency(result.new_balance));
 *     }
 *   };
 *   
 *   // Fetch receipts on mount
 *   useEffect(() => {
 *     fetchReceipts();
 *   }, []);
 *   
 *   return (
 *     <div>
 *       {receipts.map(receipt => (
 *         <div key={receipt.id}>
 *           {receipt.receipt_number} - {formatCurrency(receipt.balance_amount)}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * 
 * // Direct service usage (outside React)
 * const result = await feeReceiptsService.createReceipt({
 *   student_id: "student-uuid",
 *   branch_id: "branch-uuid",
 *   enrollment_id: "enrollment-uuid",
 *   due_date: "2024-02-15",
 *   base_fee_amount: 5000,
 * });
 * 
 * if (result.success && result.data) {
 *   console.log('Receipt created:', result.data.receipt_number);
 *   console.log('Total amount:', formatCurrency(result.data.total_amount));
 * }
 * 
 * // Student summary
 * const summary = await feeReceiptsService.getStudentSummary("student-uuid");
 * if (summary.success && summary.data) {
 *   console.log('Total outstanding:', formatCurrency(summary.data.total_outstanding));
 *   console.log('Overdue receipts:', summary.data.overdue_receipts);
 * }
 * 
 * // Branch statistics
 * const stats = await feeReceiptsService.getBranchStats("branch-uuid");
 * if (stats.success && stats.data) {
 *   console.log('Collection rate:', stats.data.collection_rate + '%');
 *   console.log('Total revenue:', formatCurrency(stats.data.total_revenue));
 * }
 * ```
 */

// ============================================================
// REACT HOOKS
// ============================================================

/**
 * Custom hook for fee receipts actions
 */
export const useFeeReceiptActions = () => {
    const store = useFeeReceiptsStore();
    return {
        createReceipt: store.createReceipt,
        recordPayment: store.recordPayment,
        updateReceipt: store.updateReceipt,
        cancelReceipt: store.cancelReceipt,
        deleteReceipt: store.deleteReceipt,
        fetchReceipts: store.fetchReceipts,
        fetchReceiptById: store.fetchReceiptById,
        fetchStudentSummary: store.fetchStudentSummary,
        fetchBranchStats: store.fetchBranchStats,
        refresh: store.refresh,
    };
};

/**
 * Custom hook for fee receipts data
 */
export const useFeeReceiptData = () => {
    const store = useFeeReceiptsStore();
    return {
        receipts: store.receipts,
        currentReceipt: store.currentReceipt,
        studentSummary: store.studentSummary,
        branchStats: store.branchStats,
    };
};

/**
 * Custom hook for fee receipts filters
 */
export const useFeeReceiptFilters = () => {
    const store = useFeeReceiptsStore();
    return {
        filters: store.filters,
        setFilters: store.setFilters,
        clearFilters: store.clearFilters,
        pagination: store.pagination,
        sort: store.sort,
        setPage: store.setPage,
        setLimit: store.setLimit,
        setSort: store.setSort,
        nextPage: store.nextPage,
        previousPage: store.previousPage,
    };
};

/**
 * Custom hook for fee receipts loading state
 */
export const useFeeReceiptLoading = () => {
    const store = useFeeReceiptsStore();
    return {
        isLoading: store.isLoading,
        isCreating: store.isCreating,
        isRecordingPayment: store.isRecordingPayment,
        isUpdating: store.isUpdating,
        isCancelling: store.isCancelling,
        isDeleting: store.isDeleting,
        isFetchingSummary: store.isFetchingSummary,
        isFetchingStats: store.isFetchingStats,
        isFetchingReceipt: store.isFetchingReceipt,
        isAnyLoading: store.isAnyLoading(),
    };
};

/**
 * Custom hook for fee receipts error state
 */
export const useFeeReceiptError = () => {
    const store = useFeeReceiptsStore();
    return {
        error: store.error,
        validationErrors: store.validationErrors,
        clearError: store.clearError,
    };
};

/**
 * Custom hook for fee receipts selectors
 */
export const useFeeReceiptSelectors = () => {
    const store = useFeeReceiptsStore();
    return {
        getReceiptsByStatus: store.getReceiptsByStatus,
        getOverdueReceipts: store.getOverdueReceipts,
        getPaidReceipts: store.getPaidReceipts,
        getPendingReceipts: store.getPendingReceipts,
    };
};

// ============================================================
// RE-EXPORT IMPORTS
// ============================================================

// Re-export from service and store for convenience
import { feeReceiptsService } from './services/fee-receipts.service';
import { useFeeReceiptsStore } from './stores/fee-receipts.store';

// Re-export from validations for convenience
import {
    createFeeReceiptSchema,
    recordPaymentSchema,
    updateReceiptSchema,
    cancelReceiptSchema,
    feeReceiptListParamsSchema,
} from './validations/fee-receipts.validation';

// Re-export from utils for convenience
import {
    formatCurrency,
    formatDate,
    calculateTotalAmount,
    calculateBalance,
    isOverdue,
    canRecordPayment,
    toPublicReceipt,
} from './utils/fee-receipts.utils';

// ============================================================
// DEFAULT EXPORT
// ============================================================

/**
 * Default export - complete fee receipts system
 */
export default feeReceiptsSystem;