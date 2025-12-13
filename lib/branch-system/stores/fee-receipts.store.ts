/**
 * Fee Receipts Store
 * 
 * Zustand store for managing fee receipt state in React components.
 * Provides actions for CRUD operations, payment recording, filtering, pagination, and caching.
 * Implements devtools integration and persistence for improved developer experience.
 * 
 * @module branch-system/stores/fee-receipts
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
    feeReceiptsService
} from '../services/fee-receipts.service';
import { ReceiptStatus } from '../types/fee-receipts.types';
import type {
    FeeReceipt,
    CreateFeeReceiptInput,
    RecordPaymentInput,
    UpdateReceiptInput,
    CancelReceiptInput,
    FeeReceiptFilters,
    FeeReceiptListParams,
    FeeReceiptListResponse,
    ReceiptCreationResult,
    PaymentRecordingResult,
    StudentPaymentSummary,
    BranchRevenueStats,
} from '../types/fee-receipts.types';

// ============================================================
// STATE INTERFACE
// ============================================================

export interface FeeReceiptsState {
    // ============================================================
    // STATE DATA
    // ============================================================

    /**
     * Current fee receipts list
     */
    receipts: FeeReceipt[];

    /**
     * Current receipt (for viewing/editing)
     */
    currentReceipt: FeeReceipt | null;

    /**
     * Active dialog type - controls which dialog is open
     */
    activeDialog: 'details' | 'edit' | 'payment' | 'cancel' | null;

    /**
     * Student payment summary
     */
    studentSummary: StudentPaymentSummary | null;

    /**
     * Branch revenue statistics
     */
    branchStats: BranchRevenueStats | null;

    /**
     * Current branch ID - for branch manager view context
     */
    currentBranchId: string | null;

    /**
     * Current coaching center ID - for coach view context
     */
    currentCoachingCenterId: string | null;

    /**
     * Current filters applied
     */
    filters: FeeReceiptFilters;

    /**
     * Pagination state
     */
    pagination: {
        page: number;
        limit: number;
        total: number;
        has_more: boolean;
    };

    /**
     * Sort configuration
     */
    sort: {
        sort_by: 'receipt_date' | 'due_date' | 'payment_date' | 'total_amount' | 'balance_amount' | 'created_at';
        sort_order: 'asc' | 'desc';
    };

    // ============================================================
    // LOADING STATES
    // ============================================================

    isLoading: boolean;
    isCreating: boolean;
    isRecordingPayment: boolean;
    isUpdating: boolean;
    isCancelling: boolean;
    isDeleting: boolean;
    isFetchingSummary: boolean;
    isFetchingStats: boolean;
    isFetchingReceipt: boolean;

    // ============================================================
    // ERROR STATE
    // ============================================================

    error: string | null;
    validationErrors: Array<{ field: string; message: string }> | null;

    // ============================================================
    // CREATE ACTIONS
    // ============================================================

    /**
     * Create a new fee receipt
     */
    createReceipt: (input: CreateFeeReceiptInput) => Promise<ReceiptCreationResult | null>;

    /**
     * Record payment for a receipt
     */
    recordPayment: (input: RecordPaymentInput) => Promise<PaymentRecordingResult | null>;

    // ============================================================
    // UPDATE ACTIONS
    // ============================================================

    /**
     * Update receipt details
     */
    updateReceipt: (input: UpdateReceiptInput) => Promise<FeeReceipt | null>;

    /**
     * Cancel or refund a receipt
     */
    cancelReceipt: (input: CancelReceiptInput) => Promise<FeeReceipt | null>;

    // ============================================================
    // READ ACTIONS
    // ============================================================

    /**
     * Fetch receipts with current filters and pagination
     */
    fetchReceipts: () => Promise<void>;

    /**
     * Fetch receipts for a specific branch (branch manager view)
     * @param branchId - Branch UUID
     */
    fetchBranchReceipts: (branchId: string) => Promise<void>;

    /**
     * Fetch receipt by ID
     */
    fetchReceiptById: (receiptId: string) => Promise<FeeReceipt | null>;

    /**
     * Fetch student payment summary
     */
    fetchStudentSummary: (studentId: string) => Promise<StudentPaymentSummary | null>;

    /**
     * Fetch branch revenue statistics
     */
    fetchBranchStats: (branchId: string) => Promise<BranchRevenueStats | null>;

    /**
     * Fetch receipts for all branches of a coaching center
     */
    fetchCoachingCenterReceipts: (coachingCenterId: string) => Promise<void>;

    /**
     * Fetch coaching center revenue statistics (all branches)
     */
    fetchCoachingCenterStats: (coachingCenterId: string) => Promise<BranchRevenueStats | null>;

    /**
     * Refresh current list (re-fetch with same params)
     */
    refresh: () => Promise<void>;

    // ============================================================
    // DELETE ACTIONS
    // ============================================================

    /**
     * Delete a receipt
     */
    deleteReceipt: (receiptId: string) => Promise<boolean>;

    // ============================================================
    // FILTER & PAGINATION ACTIONS
    // ============================================================

    /**
     * Set filters
     */
    setFilters: (filters: Partial<FeeReceiptFilters>) => void;

    /**
     * Clear all filters
     */
    clearFilters: () => void;

    /**
     * Set pagination page
     */
    setPage: (page: number) => void;

    /**
     * Set pagination limit
     */
    setLimit: (limit: number) => void;

    /**
     * Set sort configuration
     */
    setSort: (
        sort_by: 'receipt_date' | 'due_date' | 'payment_date' | 'total_amount' | 'balance_amount' | 'created_at',
        sort_order: 'asc' | 'desc'
    ) => void;

    /**
     * Go to next page
     */
    nextPage: () => Promise<void>;

    /**
     * Go to previous page
     */
    previousPage: () => Promise<void>;

    // ============================================================
    // STATE MANAGEMENT
    // ============================================================

    /**
     * Set current receipt
     */
    setCurrentReceipt: (receipt: FeeReceipt | null) => void;

    /**
     * Open a specific dialog with a receipt
     */
    openDialog: (dialog: 'details' | 'edit' | 'payment' | 'cancel', receipt: FeeReceipt) => void;

    /**
     * Close the active dialog
     */
    closeDialog: () => void;

    /**
     * Clear error state
     */
    clearError: () => void;

    /**
     * Reset store to initial state
     */
    reset: () => void;

    // ============================================================
    // SELECTORS
    // ============================================================

    /**
     * Get receipts by status
     */
    getReceiptsByStatus: (status: ReceiptStatus) => FeeReceipt[];

    /**
     * Get overdue receipts
     */
    getOverdueReceipts: () => FeeReceipt[];

    /**
     * Get paid receipts
     */
    getPaidReceipts: () => FeeReceipt[];

    /**
     * Get pending receipts
     */
    getPendingReceipts: () => FeeReceipt[];

    /**
     * Check if any operation is loading
     */
    isAnyLoading: () => boolean;
}

// ============================================================
// INITIAL STATE
// ============================================================

const initialState = {
    receipts: [],
    currentReceipt: null,
    activeDialog: null as 'details' | 'edit' | 'payment' | 'cancel' | null,
    studentSummary: null,
    branchStats: null,
    currentBranchId: null as string | null,
    currentCoachingCenterId: null as string | null,
    filters: {},
    pagination: {
        page: 1,
        limit: 20,
        total: 0,
        has_more: false,
    },
    sort: {
        sort_by: 'receipt_date' as const,
        sort_order: 'desc' as const,
    },
    isLoading: false,
    isCreating: false,
    isRecordingPayment: false,
    isUpdating: false,
    isCancelling: false,
    isDeleting: false,
    isFetchingSummary: false,
    isFetchingStats: false,
    isFetchingReceipt: false,
    error: null,
    validationErrors: null,
};

// ============================================================
// STORE IMPLEMENTATION
// ============================================================

export const useFeeReceiptsStore = create<FeeReceiptsState>()(
    devtools(
        persist(
            immer((set, get) => ({
                ...initialState,

                // ============================================================
                // CREATE ACTIONS IMPLEMENTATION
                // ============================================================

                createReceipt: async (input: CreateFeeReceiptInput) => {
                    set((state) => {
                        state.isCreating = true;
                        state.error = null;
                        state.validationErrors = null;
                    });

                    try {
                        const result = await feeReceiptsService.createReceipt(input);

                        if (result.success && result.data) {
                            set((state) => {
                                state.receipts.unshift(result.data!.receipt);
                                state.currentReceipt = result.data!.receipt;
                                state.pagination.total += 1;
                                state.isCreating = false;
                            });
                            return result.data;
                        } else {
                            set((state) => {
                                state.error = result.error || 'Failed to create receipt';
                                state.validationErrors = result.validation_errors || null;
                                state.isCreating = false;
                            });
                            return null;
                        }
                    } catch (error) {
                        set((state) => {
                            state.error = error instanceof Error ? error.message : 'Unknown error';
                            state.isCreating = false;
                        });
                        return null;
                    }
                },

                recordPayment: async (input: RecordPaymentInput) => {
                    set((state) => {
                        state.isRecordingPayment = true;
                        state.error = null;
                        state.validationErrors = null;
                    });

                    try {
                        const result = await feeReceiptsService.recordPayment(input);

                        if (result.success && result.data) {
                            set((state) => {
                                // Update receipt in list
                                const index = state.receipts.findIndex((r) => r.id === result.data!.receipt.id);
                                if (index !== -1) {
                                    state.receipts[index] = result.data!.receipt;
                                }
                                // Update current receipt
                                if (state.currentReceipt?.id === result.data!.receipt.id) {
                                    state.currentReceipt = result.data!.receipt;
                                }
                                state.isRecordingPayment = false;
                            });
                            return result.data;
                        } else {
                            set((state) => {
                                state.error = result.error || 'Failed to record payment';
                                state.validationErrors = result.validation_errors || null;
                                state.isRecordingPayment = false;
                            });
                            return null;
                        }
                    } catch (error) {
                        set((state) => {
                            state.error = error instanceof Error ? error.message : 'Unknown error';
                            state.isRecordingPayment = false;
                        });
                        return null;
                    }
                },

                // ============================================================
                // UPDATE ACTIONS IMPLEMENTATION
                // ============================================================

                updateReceipt: async (input: UpdateReceiptInput) => {
                    set((state) => {
                        state.isUpdating = true;
                        state.error = null;
                        state.validationErrors = null;
                    });

                    try {
                        const result = await feeReceiptsService.updateReceipt(input);

                        if (result.success && result.data) {
                            set((state) => {
                                // Update receipt in list
                                const index = state.receipts.findIndex((r) => r.id === input.id);
                                if (index !== -1) {
                                    state.receipts[index] = result.data!;
                                }
                                // Update current receipt
                                if (state.currentReceipt?.id === input.id) {
                                    state.currentReceipt = result.data!;
                                }
                                state.isUpdating = false;
                            });
                            return result.data;
                        } else {
                            set((state) => {
                                state.error = result.error || 'Failed to update receipt';
                                state.validationErrors = result.validation_errors || null;
                                state.isUpdating = false;
                            });
                            return null;
                        }
                    } catch (error) {
                        set((state) => {
                            state.error = error instanceof Error ? error.message : 'Unknown error';
                            state.isUpdating = false;
                        });
                        return null;
                    }
                },

                cancelReceipt: async (input: CancelReceiptInput) => {
                    set((state) => {
                        state.isCancelling = true;
                        state.error = null;
                        state.validationErrors = null;
                    });

                    try {
                        const result = await feeReceiptsService.cancelReceipt(input);

                        if (result.success && result.data) {
                            set((state) => {
                                // Update receipt in list
                                const index = state.receipts.findIndex((r) => r.id === input.receipt_id);
                                if (index !== -1) {
                                    state.receipts[index] = result.data!;
                                }
                                // Update current receipt
                                if (state.currentReceipt?.id === input.receipt_id) {
                                    state.currentReceipt = result.data!;
                                }
                                state.isCancelling = false;
                            });
                            return result.data;
                        } else {
                            set((state) => {
                                state.error = result.error || 'Failed to cancel receipt';
                                state.validationErrors = result.validation_errors || null;
                                state.isCancelling = false;
                            });
                            return null;
                        }
                    } catch (error) {
                        set((state) => {
                            state.error = error instanceof Error ? error.message : 'Unknown error';
                            state.isCancelling = false;
                        });
                        return null;
                    }
                },

                // ============================================================
                // READ ACTIONS IMPLEMENTATION
                // ============================================================

                fetchReceipts: async () => {
                    const { currentBranchId, currentCoachingCenterId } = get();
                    
                    // Route to appropriate fetch method based on context
                    if (currentCoachingCenterId) {
                        await get().fetchCoachingCenterReceipts(currentCoachingCenterId);
                        return;
                    }
                    
                    if (currentBranchId) {
                        await get().fetchBranchReceipts(currentBranchId);
                        return;
                    }

                    // Fallback: fetch with current filters (no context restriction)
                    set((state) => {
                        state.isLoading = true;
                        state.error = null;
                    });

                    try {
                        const { filters, pagination, sort } = get();
                        const params: FeeReceiptListParams = {
                            ...filters,
                            page: pagination.page,
                            limit: pagination.limit,
                            sort_by: sort.sort_by,
                            sort_order: sort.sort_order,
                        };

                        const result = await feeReceiptsService.listReceipts(params);

                        if (result.success && result.data) {
                            set((state) => {
                                state.receipts = result.data!.data;
                                state.pagination.total = result.data!.total;
                                state.pagination.has_more = result.data!.has_more;
                                state.isLoading = false;
                            });
                        } else {
                            set((state) => {
                                state.error = result.error || 'Failed to fetch receipts';
                                state.isLoading = false;
                            });
                        }
                    } catch (error) {
                        set((state) => {
                            state.error = error instanceof Error ? error.message : 'Unknown error';
                            state.isLoading = false;
                        });
                    }
                },

                fetchBranchReceipts: async (branchId: string) => {
                    set((state) => {
                        state.isLoading = true;
                        state.error = null;
                        state.currentBranchId = branchId;
                        state.currentCoachingCenterId = null; // Clear coaching center context
                        // Clear previous data when switching context to prevent stale data display
                        state.receipts = [];
                        state.branchStats = null;
                        state.pagination.total = 0;
                        state.pagination.has_more = false;
                    });

                    try {
                        const { filters, pagination, sort } = get();
                        // Remove branch_id from filters and use the passed branchId
                        const { branch_id, ...otherFilters } = filters;
                        const params: FeeReceiptListParams = {
                            ...otherFilters,
                            branch_id: branchId, // Use the passed branchId
                            page: pagination.page,
                            limit: pagination.limit,
                            sort_by: sort.sort_by,
                            sort_order: sort.sort_order,
                        };

                        const result = await feeReceiptsService.listReceipts(params);

                        if (result.success && result.data) {
                            set((state) => {
                                state.receipts = result.data!.data;
                                state.pagination.total = result.data!.total;
                                state.pagination.has_more = result.data!.has_more;
                                state.isLoading = false;
                            });
                        } else {
                            set((state) => {
                                state.error = result.error || 'Failed to fetch receipts';
                                state.isLoading = false;
                            });
                        }
                    } catch (error) {
                        set((state) => {
                            state.error = error instanceof Error ? error.message : 'Unknown error';
                            state.isLoading = false;
                        });
                    }
                },

                fetchReceiptById: async (receiptId: string) => {
                    set((state) => {
                        state.isFetchingReceipt = true;
                        state.error = null;
                    });

                    try {
                        const result = await feeReceiptsService.getReceiptById(receiptId);

                        if (result.success && result.data) {
                            set((state) => {
                                state.currentReceipt = result.data!;
                                state.isFetchingReceipt = false;
                            });
                            return result.data;
                        } else {
                            set((state) => {
                                state.error = result.error || 'Failed to fetch receipt';
                                state.isFetchingReceipt = false;
                            });
                            return null;
                        }
                    } catch (error) {
                        set((state) => {
                            state.error = error instanceof Error ? error.message : 'Unknown error';
                            state.isFetchingReceipt = false;
                        });
                        return null;
                    }
                },

                fetchStudentSummary: async (studentId: string) => {
                    set((state) => {
                        state.isFetchingSummary = true;
                        state.error = null;
                    });

                    try {
                        const result = await feeReceiptsService.getStudentSummary(studentId);

                        if (result.success && result.data) {
                            set((state) => {
                                state.studentSummary = result.data!;
                                state.isFetchingSummary = false;
                            });
                            return result.data;
                        } else {
                            set((state) => {
                                state.error = result.error || 'Failed to fetch student summary';
                                state.isFetchingSummary = false;
                            });
                            return null;
                        }
                    } catch (error) {
                        set((state) => {
                            state.error = error instanceof Error ? error.message : 'Unknown error';
                            state.isFetchingSummary = false;
                        });
                        return null;
                    }
                },

                fetchBranchStats: async (branchId: string) => {
                    set((state) => {
                        state.isFetchingStats = true;
                        state.error = null;
                    });

                    try {
                        const result = await feeReceiptsService.getBranchStats(branchId);

                        if (result.success && result.data) {
                            set((state) => {
                                state.branchStats = result.data!;
                                state.isFetchingStats = false;
                            });
                            return result.data;
                        } else {
                            set((state) => {
                                state.error = result.error || 'Failed to fetch branch stats';
                                state.isFetchingStats = false;
                            });
                            return null;
                        }
                    } catch (error) {
                        set((state) => {
                            state.error = error instanceof Error ? error.message : 'Unknown error';
                            state.isFetchingStats = false;
                        });
                        return null;
                    }
                },

                fetchCoachingCenterReceipts: async (coachingCenterId: string) => {
                    set((state) => {
                        state.isLoading = true;
                        state.error = null;
                        state.currentCoachingCenterId = coachingCenterId;
                        state.currentBranchId = null; // Clear branch context
                        // Clear previous data when switching context to prevent stale data display
                        state.receipts = [];
                        state.branchStats = null;
                        state.pagination.total = 0;
                        state.pagination.has_more = false;
                    });

                    try {
                        const { filters, pagination, sort } = get();
                        // Remove branch_id from filters since we're fetching all branches
                        const { branch_id, ...otherFilters } = filters;
                        const params = {
                            ...otherFilters,
                            page: pagination.page,
                            limit: pagination.limit,
                            sort_by: sort.sort_by,
                            sort_order: sort.sort_order,
                        };

                        const result = await feeReceiptsService.listReceiptsByCoachingCenter(coachingCenterId, params);

                        if (result.success && result.data) {
                            set((state) => {
                                state.receipts = result.data!.data;
                                state.pagination.total = result.data!.total;
                                state.pagination.has_more = result.data!.has_more;
                                state.isLoading = false;
                            });
                        } else {
                            set((state) => {
                                state.error = result.error || 'Failed to fetch receipts';
                                state.isLoading = false;
                            });
                        }
                    } catch (error) {
                        set((state) => {
                            state.error = error instanceof Error ? error.message : 'Unknown error';
                            state.isLoading = false;
                        });
                    }
                },

                fetchCoachingCenterStats: async (coachingCenterId: string) => {
                    set((state) => {
                        state.isFetchingStats = true;
                        state.error = null;
                    });

                    try {
                        const result = await feeReceiptsService.getCoachingCenterStats(coachingCenterId);

                        if (result.success && result.data) {
                            set((state) => {
                                state.branchStats = result.data!;
                                state.isFetchingStats = false;
                            });
                            return result.data;
                        } else {
                            set((state) => {
                                state.error = result.error || 'Failed to fetch coaching center stats';
                                state.isFetchingStats = false;
                            });
                            return null;
                        }
                    } catch (error) {
                        set((state) => {
                            state.error = error instanceof Error ? error.message : 'Unknown error';
                            state.isFetchingStats = false;
                        });
                        return null;
                    }
                },

                refresh: async () => {
                    await get().fetchReceipts();
                },

                // ============================================================
                // DELETE ACTIONS IMPLEMENTATION
                // ============================================================

                deleteReceipt: async (receiptId: string) => {
                    set((state) => {
                        state.isDeleting = true;
                        state.error = null;
                    });

                    try {
                        const result = await feeReceiptsService.deleteReceipt(receiptId);

                        if (result.success) {
                            set((state) => {
                                state.receipts = state.receipts.filter((r) => r.id !== receiptId);
                                if (state.currentReceipt?.id === receiptId) {
                                    state.currentReceipt = null;
                                }
                                state.pagination.total = Math.max(0, state.pagination.total - 1);
                                state.isDeleting = false;
                            });
                            return true;
                        } else {
                            set((state) => {
                                state.error = result.error || 'Failed to delete receipt';
                                state.isDeleting = false;
                            });
                            return false;
                        }
                    } catch (error) {
                        set((state) => {
                            state.error = error instanceof Error ? error.message : 'Unknown error';
                            state.isDeleting = false;
                        });
                        return false;
                    }
                },

                // ============================================================
                // FILTER & PAGINATION ACTIONS IMPLEMENTATION
                // ============================================================

                setFilters: (filters: Partial<FeeReceiptFilters>) => {
                    set((state) => {
                        state.filters = { ...state.filters, ...filters };
                        state.pagination.page = 1; // Reset to first page
                    });
                    get().fetchReceipts();
                },

                clearFilters: () => {
                    set((state) => {
                        state.filters = {};
                        state.pagination.page = 1;
                    });
                    get().fetchReceipts();
                },

                setPage: (page: number) => {
                    set((state) => {
                        state.pagination.page = page;
                    });
                    get().fetchReceipts();
                },

                setLimit: (limit: number) => {
                    set((state) => {
                        state.pagination.limit = limit;
                        state.pagination.page = 1;
                    });
                    get().fetchReceipts();
                },

                setSort: (sort_by, sort_order) => {
                    set((state) => {
                        state.sort.sort_by = sort_by;
                        state.sort.sort_order = sort_order;
                        state.pagination.page = 1;
                    });
                    get().fetchReceipts();
                },

                nextPage: async () => {
                    const { pagination } = get();
                    if (pagination.has_more) {
                        await get().setPage(pagination.page + 1);
                    }
                },

                previousPage: async () => {
                    const { pagination } = get();
                    if (pagination.page > 1) {
                        await get().setPage(pagination.page - 1);
                    }
                },

                // ============================================================
                // STATE MANAGEMENT IMPLEMENTATION
                // ============================================================

                setCurrentReceipt: (receipt: FeeReceipt | null) => {
                    set((state) => {
                        state.currentReceipt = receipt;
                    });
                },

                openDialog: (dialog: 'details' | 'edit' | 'payment' | 'cancel', receipt: FeeReceipt) => {
                    set((state) => {
                        state.currentReceipt = receipt;
                        state.activeDialog = dialog;
                    });
                },

                closeDialog: () => {
                    set((state) => {
                        state.activeDialog = null;
                        state.currentReceipt = null;
                    });
                },

                clearError: () => {
                    set((state) => {
                        state.error = null;
                        state.validationErrors = null;
                    });
                },

                reset: () => {
                    set(initialState);
                },

                // ============================================================
                // SELECTORS IMPLEMENTATION
                // ============================================================

                getReceiptsByStatus: (status: ReceiptStatus) => {
                    return get().receipts.filter((r) => r.receipt_status === status);
                },

                getOverdueReceipts: () => {
                    const today = new Date().toISOString().split('T')[0];
                    return get().receipts.filter(
                        (r) => r.receipt_status === ReceiptStatus.PENDING && r.due_date < today
                    );
                },

                getPaidReceipts: () => {
                    return get().receipts.filter((r) => r.receipt_status === ReceiptStatus.PAID);
                },

                getPendingReceipts: () => {
                    return get().receipts.filter((r) => r.receipt_status === ReceiptStatus.PENDING);
                },

                isAnyLoading: () => {
                    const state = get();
                    return (
                        state.isLoading ||
                        state.isCreating ||
                        state.isRecordingPayment ||
                        state.isUpdating ||
                        state.isCancelling ||
                        state.isDeleting ||
                        state.isFetchingSummary ||
                        state.isFetchingStats ||
                        state.isFetchingReceipt
                    );
                },
            })),
            {
                name: 'fee-receipts-storage',
                partialize: (state) => ({
                    // Only persist user preferences, not context-specific data
                    // Don't persist filters as they may contain branch_id which is context-specific
                    pagination: { limit: state.pagination.limit }, // Only persist limit preference
                    sort: state.sort,
                }),
            }
        ),
        { name: 'FeeReceiptsStore' }
    )
);

// ============================================================
// EXPORT STORE
// ============================================================

export default useFeeReceiptsStore;