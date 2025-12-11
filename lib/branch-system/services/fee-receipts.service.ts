/**
 * Fee Receipts Service
 * 
 * Handles all fee receipt database operations and API interactions.
 * Provides a clean, type-safe interface for CRUD operations with RLS support.
 * Implements singleton pattern for optimal performance and memory usage.
 * 
 * @module branch-system/services/fee-receipts
 */

import { createClient } from '@/lib/supabase/client';
import {
    ReceiptStatus,
    PaymentMethod,
} from '../types/fee-receipts.types';
import type {
    FeeReceipt,
    FeeReceiptRow,
    CreateFeeReceiptInput,
    RecordPaymentInput,
    UpdateReceiptInput,
    CancelReceiptInput,
    FeeReceiptFilters,
    FeeReceiptListParams,
    FeeReceiptListResponse,
    FeeReceiptOperationResult,
    ReceiptCreationResult,
    PaymentRecordingResult,
    BulkGenerationResult,
    StudentPaymentSummary,
    BranchRevenueStats,
} from '../types/fee-receipts.types';
import {
    createFeeReceiptSchema,
    recordPaymentSchema,
    updateReceiptSchema,
    cancelReceiptSchema,
    feeReceiptListParamsSchema,
    receiptGenerationParamsSchema,
    validateInput,
    type CreateFeeReceiptInput as ValidatedCreateInput,
    type RecordPaymentInput as ValidatedRecordPaymentInput,
    type UpdateReceiptInput as ValidatedUpdateInput,
    type CancelReceiptInput as ValidatedCancelInput,
    type FeeReceiptListParams as ValidatedListParams,
} from '../validations/fee-receipts.validation';
import {
    calculateTotalAmount,
    calculateBalance,
    getTodayISODate,
    toPublicReceipt,
    calculateStudentSummary,
    calculateBranchStats,
    canEditReceipt,
    canRecordPayment,
    isOverdue,
    getDaysOverdue,
} from '../utils/fee-receipts.utils';

// ============================================================
// SERVICE CLASS
// ============================================================

/**
 * Fee Receipts Service - Singleton
 * Manages all fee receipt operations with database
 */
class FeeReceiptsService {
    private static instance: FeeReceiptsService;
    private supabase = createClient();

    private constructor() { }

    /**
     * Get singleton instance
     */
    public static getInstance(): FeeReceiptsService {
        if (!FeeReceiptsService.instance) {
            FeeReceiptsService.instance = new FeeReceiptsService();
        }
        return FeeReceiptsService.instance;
    }

    // ============================================================
    // CREATE OPERATIONS
    // ============================================================

    /**
     * Create a new fee receipt
     */
    public async createReceipt(
        input: CreateFeeReceiptInput
    ): Promise<FeeReceiptOperationResult<ReceiptCreationResult>> {
        try {
            // Validate input
            const validation = validateInput(createFeeReceiptSchema, input);
            if (!validation.success) {
                return {
                    success: false,
                    validation_errors: validation.errors,
                };
            }

            const data = validation.data;

            // Calculate total amount
            const total_amount = calculateTotalAmount(
                data.base_fee_amount,
                data.late_fee_amount || 0,
                data.discount_amount || 0,
                data.tax_amount || 0
            );

            // Prepare insert data
            const insertData: any = {
                student_id: data.student_id,
                branch_id: data.branch_id,
                enrollment_id: data.enrollment_id,
                class_id: data.class_id || null,
                receipt_date: data.receipt_date || getTodayISODate(),
                due_date: data.due_date,
                base_fee_amount: data.base_fee_amount,
                late_fee_amount: data.late_fee_amount || 0,
                discount_amount: data.discount_amount || 0,
                tax_amount: data.tax_amount || 0,
                total_amount: total_amount,
                amount_paid: 0,
                balance_amount: total_amount,
                receipt_status: ReceiptStatus.PENDING,
                is_auto_generated: data.is_auto_generated || false,
                fee_month: data.fee_month || null,
                fee_year: data.fee_year || null,
                fee_period_start: data.fee_period_start || null,
                fee_period_end: data.fee_period_end || null,
                description: data.description || null,
                internal_notes: data.internal_notes || null,
            };

            // Insert into database
            const { data: receipt, error } = await this.supabase
                .from('fee_receipts')
                .insert(insertData)
                .select(`
                    *,
                    profiles:student_id (
                        id,
                        full_name,
                        username,
                        avatar_url,
                        email
                    ),
                    coaching_branches:branch_id (
                        id,
                        name
                    ),
                    branch_classes:class_id (
                        id,
                        class_name,
                        subject
                    ),
                    branch_students:enrollment_id (
                        id,
                        enrollment_date,
                        enrollment_status
                    )
                `)
                .single();

            if (error) {
                console.error('[FeeReceiptsService] Create receipt error:', error);
                return {
                    success: false,
                    error: error.message || 'Failed to create receipt',
                };
            }

            if (!receipt) {
                return {
                    success: false,
                    error: 'Receipt created but not returned from database',
                };
            }

            return {
                success: true,
                data: {
                    receipt: receipt as FeeReceipt,
                    receipt_number: receipt.receipt_number,
                    total_amount: receipt.total_amount,
                    balance_amount: receipt.balance_amount,
                },
            };
        } catch (error) {
            console.error('[FeeReceiptsService] Create receipt exception:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Record a payment for a receipt
     */
    public async recordPayment(
        input: RecordPaymentInput
    ): Promise<FeeReceiptOperationResult<PaymentRecordingResult>> {
        try {
            // Validate input
            const validation = validateInput(recordPaymentSchema, input);
            if (!validation.success) {
                return {
                    success: false,
                    validation_errors: validation.errors,
                };
            }

            const data = validation.data;

            // First, get the current receipt to validate
            const { data: currentReceipt, error: fetchError } = await this.supabase
                .from('fee_receipts')
                .select('*')
                .eq('id', data.receipt_id)
                .single();

            if (fetchError || !currentReceipt) {
                return {
                    success: false,
                    error: 'Receipt not found',
                };
            }

            // Validate receipt can accept payment
            if (!canRecordPayment(currentReceipt as FeeReceiptRow)) {
                return {
                    success: false,
                    error: 'Cannot record payment for this receipt',
                };
            }

            // Validate payment amount doesn't exceed balance
            if (data.amount_paid > currentReceipt.balance_amount) {
                return {
                    success: false,
                    error: `Payment amount (₹${data.amount_paid}) exceeds balance (₹${currentReceipt.balance_amount})`,
                };
            }

            // Calculate new amounts
            const new_amount_paid = currentReceipt.amount_paid + data.amount_paid;
            const new_balance = calculateBalance(currentReceipt.total_amount, new_amount_paid);
            const is_fully_paid = new_balance === 0;

            // Prepare update data
            const updateData: any = {
                amount_paid: new_amount_paid,
                balance_amount: new_balance,
                payment_method: data.payment_method,
                payment_reference: data.payment_reference || null,
                payment_date: data.payment_date || getTodayISODate(),
                receipt_status: is_fully_paid ? ReceiptStatus.PAID : ReceiptStatus.PENDING,
            };

            // Add internal notes if provided
            if (data.internal_notes) {
                const existingNotes = currentReceipt.internal_notes || '';
                const timestamp = new Date().toISOString();
                updateData.internal_notes = existingNotes
                    ? `${existingNotes}\n\n[${timestamp}] Payment recorded: ${data.internal_notes}`
                    : `[${timestamp}] Payment recorded: ${data.internal_notes}`;
            }

            // Update receipt in database
            const { data: updatedReceipt, error: updateError } = await this.supabase
                .from('fee_receipts')
                .update(updateData)
                .eq('id', data.receipt_id)
                .select(`
                    *,
                    profiles:student_id (
                        id,
                        full_name,
                        username,
                        avatar_url,
                        email
                    ),
                    coaching_branches:branch_id (
                        id,
                        name
                    ),
                    branch_classes:class_id (
                        id,
                        class_name,
                        subject
                    ),
                    branch_students:enrollment_id (
                        id,
                        enrollment_date,
                        enrollment_status
                    )
                `)
                .single();

            if (updateError) {
                console.error('[FeeReceiptsService] Record payment error:', updateError);
                return {
                    success: false,
                    error: updateError.message || 'Failed to record payment',
                };
            }

            if (!updatedReceipt) {
                return {
                    success: false,
                    error: 'Payment recorded but receipt not returned',
                };
            }

            return {
                success: true,
                data: {
                    receipt: updatedReceipt as FeeReceipt,
                    payment_applied: data.amount_paid,
                    new_balance: new_balance,
                    is_fully_paid: is_fully_paid,
                },
            };
        } catch (error) {
            console.error('[FeeReceiptsService] Record payment exception:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // ============================================================
    // UPDATE OPERATIONS
    // ============================================================

    /**
     * Update receipt details (before payment)
     */
    public async updateReceipt(
        input: UpdateReceiptInput
    ): Promise<FeeReceiptOperationResult<FeeReceipt>> {
        try {
            // Validate input
            const validation = validateInput(updateReceiptSchema, input);
            if (!validation.success) {
                return {
                    success: false,
                    validation_errors: validation.errors,
                };
            }

            const data = validation.data;

            // First, get current receipt to validate
            const { data: currentReceipt, error: fetchError } = await this.supabase
                .from('fee_receipts')
                .select('*')
                .eq('id', data.id)
                .single();

            if (fetchError || !currentReceipt) {
                return {
                    success: false,
                    error: 'Receipt not found',
                };
            }

            // Validate receipt can be edited
            if (!canEditReceipt(currentReceipt as FeeReceiptRow)) {
                return {
                    success: false,
                    error: 'Receipt cannot be edited (payment already recorded or receipt cancelled)',
                };
            }

            // Prepare update data
            const updateData: any = {};

            if (data.due_date) updateData.due_date = data.due_date;
            if (data.base_fee_amount !== undefined) updateData.base_fee_amount = data.base_fee_amount;
            if (data.late_fee_amount !== undefined) updateData.late_fee_amount = data.late_fee_amount;
            if (data.discount_amount !== undefined) updateData.discount_amount = data.discount_amount;
            if (data.tax_amount !== undefined) updateData.tax_amount = data.tax_amount;
            if (data.description !== undefined) updateData.description = data.description;
            if (data.internal_notes !== undefined) updateData.internal_notes = data.internal_notes;
            if (data.fee_month !== undefined) updateData.fee_month = data.fee_month;
            if (data.fee_year !== undefined) updateData.fee_year = data.fee_year;
            if (data.fee_period_start !== undefined) updateData.fee_period_start = data.fee_period_start;
            if (data.fee_period_end !== undefined) updateData.fee_period_end = data.fee_period_end;

            // Recalculate total if fee amounts changed
            if (
                data.base_fee_amount !== undefined ||
                data.late_fee_amount !== undefined ||
                data.discount_amount !== undefined ||
                data.tax_amount !== undefined
            ) {
                const base = data.base_fee_amount ?? currentReceipt.base_fee_amount;
                const late = data.late_fee_amount ?? currentReceipt.late_fee_amount;
                const discount = data.discount_amount ?? currentReceipt.discount_amount;
                const tax = data.tax_amount ?? currentReceipt.tax_amount;

                updateData.total_amount = calculateTotalAmount(base, late, discount, tax);
                updateData.balance_amount = calculateBalance(
                    updateData.total_amount,
                    currentReceipt.amount_paid
                );
            }

            // Update in database
            const { data: updatedReceipt, error: updateError } = await this.supabase
                .from('fee_receipts')
                .update(updateData)
                .eq('id', data.id)
                .select(`
                    *,
                    profiles:student_id (
                        id,
                        full_name,
                        username,
                        avatar_url,
                        email
                    ),
                    coaching_branches:branch_id (
                        id,
                        name
                    ),
                    branch_classes:class_id (
                        id,
                        class_name,
                        subject
                    ),
                    branch_students:enrollment_id (
                        id,
                        enrollment_date,
                        enrollment_status
                    )
                `)
                .single();

            if (updateError) {
                console.error('[FeeReceiptsService] Update receipt error:', updateError);
                return {
                    success: false,
                    error: updateError.message || 'Failed to update receipt',
                };
            }

            if (!updatedReceipt) {
                return {
                    success: false,
                    error: 'Receipt updated but not returned',
                };
            }

            return {
                success: true,
                data: updatedReceipt as FeeReceipt,
            };
        } catch (error) {
            console.error('[FeeReceiptsService] Update receipt exception:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Cancel or refund a receipt
     */
    public async cancelReceipt(
        input: CancelReceiptInput
    ): Promise<FeeReceiptOperationResult<FeeReceipt>> {
        try {
            // Validate input
            const validation = validateInput(cancelReceiptSchema, input);
            if (!validation.success) {
                return {
                    success: false,
                    validation_errors: validation.errors,
                };
            }

            const data = validation.data;

            // Get current receipt
            const { data: currentReceipt, error: fetchError } = await this.supabase
                .from('fee_receipts')
                .select('*')
                .eq('id', data.receipt_id)
                .single();

            if (fetchError || !currentReceipt) {
                return {
                    success: false,
                    error: 'Receipt not found',
                };
            }

            // Determine status
            const hasPayment = currentReceipt.amount_paid > 0;
            const newStatus = hasPayment ? ReceiptStatus.REFUNDED : ReceiptStatus.CANCELLED;

            // Prepare update data
            const updateData: any = {
                receipt_status: newStatus,
                internal_notes: `${currentReceipt.internal_notes || ''}\n\n[${new Date().toISOString()}] ${newStatus === ReceiptStatus.REFUNDED ? 'REFUNDED' : 'CANCELLED'
                    }: ${data.reason}`,
            };

            // If refund amount provided, update amounts
            if (data.refund_amount && data.refund_amount > 0) {
                updateData.amount_paid = Math.max(0, currentReceipt.amount_paid - data.refund_amount);
                updateData.balance_amount = calculateBalance(
                    currentReceipt.total_amount,
                    updateData.amount_paid
                );
            }

            // Update in database
            const { data: updatedReceipt, error: updateError } = await this.supabase
                .from('fee_receipts')
                .update(updateData)
                .eq('id', data.receipt_id)
                .select(`
                    *,
                    profiles:student_id (
                        id,
                        full_name,
                        username,
                        avatar_url,
                        email
                    ),
                    coaching_branches:branch_id (
                        id,
                        name
                    ),
                    branch_classes:class_id (
                        id,
                        class_name,
                        subject
                    ),
                    branch_students:enrollment_id (
                        id,
                        enrollment_date,
                        enrollment_status
                    )
                `)
                .single();

            if (updateError) {
                console.error('[FeeReceiptsService] Cancel receipt error:', updateError);
                return {
                    success: false,
                    error: updateError.message || 'Failed to cancel receipt',
                };
            }

            if (!updatedReceipt) {
                return {
                    success: false,
                    error: 'Receipt cancelled but not returned',
                };
            }

            return {
                success: true,
                data: updatedReceipt as FeeReceipt,
            };
        } catch (error) {
            console.error('[FeeReceiptsService] Cancel receipt exception:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // ============================================================
    // READ OPERATIONS
    // ============================================================

    /**
     * Get receipt by ID
     */
    public async getReceiptById(
        receiptId: string
    ): Promise<FeeReceiptOperationResult<FeeReceipt>> {
        try {
            const { data: receipt, error } = await this.supabase
                .from('fee_receipts')
                .select(`
                    *,
                        profiles:student_id (
                        id,
                        full_name,
                        username,
                        avatar_url,
                        email
                    ),
                    coaching_branches:branch_id (
                        id,
                        name
                    ),
                    branch_classes:class_id (
                        id,
                        class_name,
                        subject
                    ),
                    branch_students:enrollment_id (
                        id,
                        enrollment_date,
                        enrollment_status
                    ),
                    processor:processed_by (
                        id,
                        full_name
                    )
                `)
                .eq('id', receiptId)
                .single();

            if (error) {
                console.error('[FeeReceiptsService] Get receipt by ID error:', error);
                return {
                    success: false,
                    error: error.message || 'Failed to fetch receipt',
                };
            }

            if (!receipt) {
                return {
                    success: false,
                    error: 'Receipt not found',
                };
            }

            return {
                success: true,
                data: receipt as FeeReceipt,
            };
        } catch (error) {
            console.error('[FeeReceiptsService] Get receipt by ID exception:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
            }
    }

    /**
     * List receipts with filters and pagination
     */
    public async listReceipts(
        params: FeeReceiptListParams = {}
    ): Promise<FeeReceiptOperationResult<FeeReceiptListResponse>> {
        try {
            // Validate params
            const validation = validateInput(feeReceiptListParamsSchema, params);
            if (!validation.success) {
                return {
                    success: false,
                    validation_errors: validation.errors,
                };
            }

            const validParams = validation.data;
            const page = validParams.page || 1;
            const limit = validParams.limit || 20;
            const offset = (page - 1) * limit;

            // Build query
            let query = this.supabase
                .from('fee_receipts')
                .select(
                    `
                    *,
                    profiles:student_id (
                        id,
                        full_name,
                        username,
                        avatar_url,
                        email
                    ),
                    coaching_branches:branch_id (
                        id,
                        name
                    ),
                    branch_classes:class_id (
                        id,
                        class_name,
                        subject
                    ),
                    branch_students:enrollment_id (
                        id,
                        enrollment_date,
                        enrollment_status
                    )
                `,
                    { count: 'exact' }
                );

            // Apply filters
            if (validParams.student_id) query = query.eq('student_id', validParams.student_id);
            if (validParams.branch_id) query = query.eq('branch_id', validParams.branch_id);
            if (validParams.class_id) query = query.eq('class_id', validParams.class_id);
            if (validParams.enrollment_id) query = query.eq('enrollment_id', validParams.enrollment_id);
            if (validParams.receipt_status) query = query.eq('receipt_status', validParams.receipt_status);
            if (validParams.payment_method) query = query.eq('payment_method', validParams.payment_method);
            if (validParams.processed_by) query = query.eq('processed_by', validParams.processed_by);
            if (validParams.is_auto_generated !== undefined)
                query = query.eq('is_auto_generated', validParams.is_auto_generated);

            // Date filters
            if (validParams.receipt_date_from) query = query.gte('receipt_date', validParams.receipt_date_from);
            if (validParams.receipt_date_to) query = query.lte('receipt_date', validParams.receipt_date_to);
            if (validParams.due_date_from) query = query.gte('due_date', validParams.due_date_from);
            if (validParams.due_date_to) query = query.lte('due_date', validParams.due_date_to);
            if (validParams.payment_date_from) query = query.gte('payment_date', validParams.payment_date_from);
            if (validParams.payment_date_to) query = query.lte('payment_date', validParams.payment_date_to);

            // Fee period filters
            if (validParams.fee_month) query = query.eq('fee_month', validParams.fee_month);
            if (validParams.fee_year) query = query.eq('fee_year', validParams.fee_year);

            // Amount filters
            if (validParams.min_amount) query = query.gte('total_amount', validParams.min_amount);
            if (validParams.max_amount) query = query.lte('total_amount', validParams.max_amount);

            // Balance filter
            if (validParams.has_balance !== undefined) {
                if (validParams.has_balance) {
                    query = query.gt('balance_amount', 0);
                } else {
                    query = query.eq('balance_amount', 0);
                }
            }

            // Overdue filter
            if (validParams.is_overdue) {
                const today = getTodayISODate();
                query = query.lt('due_date', today).eq('receipt_status', ReceiptStatus.PENDING);
            }

            // Sorting
            const sortBy = validParams.sort_by || 'receipt_date';
            const sortOrder = validParams.sort_order || 'desc';
            query = query.order(sortBy, { ascending: sortOrder === 'asc' });

            // Pagination
            query = query.range(offset, offset + limit - 1);

            // Execute query
            const { data: receipts, error, count } = await query;

            if (error) {
                console.error('[FeeReceiptsService] List receipts error:', error);
                return {
                    success: false,
                    error: error.message || 'Failed to fetch receipts',
                };
            }

            const total = count || 0;
            const hasMore = offset + limit < total;

            return {
                success: true,
                data: {
                    data: (receipts || []) as FeeReceipt[],
                    total: total,
                    page: page,
                    limit: limit,
                    has_more: hasMore,
                },
            };
        } catch (error) {
            console.error('[FeeReceiptsService] List receipts exception:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * List receipts across all branches of a coaching center
     * First fetches all branch IDs for the coaching center, then queries receipts
     * 
     * @param coachingCenterId - Coaching center UUID
     * @param params - Filter and pagination params
     * @returns List response with receipts and pagination metadata
     */
    public async listReceiptsByCoachingCenter(
        coachingCenterId: string,
        params: Omit<FeeReceiptListParams, 'branch_id'> = {}
    ): Promise<FeeReceiptOperationResult<FeeReceiptListResponse>> {
        try {
            // First get all branches for this coaching center
            const { data: branches, error: branchError } = await this.supabase
                .from('coaching_branches')
                .select('id')
                .eq('coaching_center_id', coachingCenterId);

            if (branchError) {
                console.error('[FeeReceiptsService] Fetch branches error:', branchError);
                return {
                    success: false,
                    error: `Failed to fetch branches: ${branchError.message}`,
                };
            }

            if (!branches || branches.length === 0) {
                return {
                    success: true,
                    data: {
                        data: [],
                        total: 0,
                        page: 1,
                        limit: params.limit || 20,
                        has_more: false,
                    },
                };
            }

            const branchIds = branches.map((b: { id: string }) => b.id);

            // Build params without branch_id validation since we'll use branch_ids
            const page = params.page || 1;
            const limit = params.limit || 20;
            const offset = (page - 1) * limit;

            // Build query with multiple branch filter
            let query = this.supabase
                .from('fee_receipts')
                .select(
                    `
                    *,
                    profiles:student_id (
                        id,
                        full_name,
                        username,
                        avatar_url,
                        email
                    ),
                    coaching_branches:branch_id (
                        id,
                        name
                    ),
                    branch_classes:class_id (
                        id,
                        class_name,
                        subject
                    ),
                    branch_students:enrollment_id (
                        id,
                        enrollment_date,
                        enrollment_status
                    )
                `,
                    { count: 'exact' }
                )
                .in('branch_id', branchIds);

            // Apply filters (same as listReceipts but without branch_id)
            if (params.student_id) query = query.eq('student_id', params.student_id);
            if (params.class_id) query = query.eq('class_id', params.class_id);
            if (params.enrollment_id) query = query.eq('enrollment_id', params.enrollment_id);
            if (params.receipt_status) query = query.eq('receipt_status', params.receipt_status);
            if (params.payment_method) query = query.eq('payment_method', params.payment_method);
            if (params.processed_by) query = query.eq('processed_by', params.processed_by);
            if (params.is_auto_generated !== undefined)
                query = query.eq('is_auto_generated', params.is_auto_generated);

            // Date filters
            if (params.receipt_date_from) query = query.gte('receipt_date', params.receipt_date_from);
            if (params.receipt_date_to) query = query.lte('receipt_date', params.receipt_date_to);
            if (params.due_date_from) query = query.gte('due_date', params.due_date_from);
            if (params.due_date_to) query = query.lte('due_date', params.due_date_to);
            if (params.payment_date_from) query = query.gte('payment_date', params.payment_date_from);
            if (params.payment_date_to) query = query.lte('payment_date', params.payment_date_to);

            // Fee period filters
            if (params.fee_month) query = query.eq('fee_month', params.fee_month);
            if (params.fee_year) query = query.eq('fee_year', params.fee_year);

            // Amount filters
            if (params.min_amount) query = query.gte('total_amount', params.min_amount);
            if (params.max_amount) query = query.lte('total_amount', params.max_amount);

            // Balance filter
            if (params.has_balance !== undefined) {
                if (params.has_balance) {
                    query = query.gt('balance_amount', 0);
                } else {
                    query = query.eq('balance_amount', 0);
                }
            }

            // Overdue filter
            if (params.is_overdue) {
                const today = getTodayISODate();
                query = query.lt('due_date', today).eq('receipt_status', ReceiptStatus.PENDING);
            }

            // Sorting
            const sortBy = params.sort_by || 'receipt_date';
            const sortOrder = params.sort_order || 'desc';
            query = query.order(sortBy, { ascending: sortOrder === 'asc' });

            // Pagination
            query = query.range(offset, offset + limit - 1);

            // Execute query
            const { data: receipts, error, count } = await query;

            if (error) {
                console.error('[FeeReceiptsService] List coaching center receipts error:', error);
                return {
                    success: false,
                    error: error.message || 'Failed to fetch receipts',
                };
            }

            const total = count || 0;
            const hasMore = offset + limit < total;

            return {
                success: true,
                data: {
                    data: (receipts || []) as FeeReceipt[],
                    total: total,
                    page: page,
                    limit: limit,
                    has_more: hasMore,
                },
            };
        } catch (error) {
            console.error('[FeeReceiptsService] List coaching center receipts exception:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Get coaching center revenue statistics
     * Aggregates stats across all branches of a coaching center
     * 
     * @param coachingCenterId - Coaching center UUID
     * @returns Revenue statistics for the coaching center
     */
    public async getCoachingCenterStats(
        coachingCenterId: string
    ): Promise<FeeReceiptOperationResult<BranchRevenueStats>> {
        try {
            // First get all branches for this coaching center
            const { data: branches, error: branchError } = await this.supabase
                .from('coaching_branches')
                .select('id')
                .eq('coaching_center_id', coachingCenterId);

            if (branchError) {
                console.error('[FeeReceiptsService] Fetch branches error:', branchError);
                return {
                    success: false,
                    error: `Failed to fetch branches: ${branchError.message}`,
                };
            }

            if (!branches || branches.length === 0) {
                return {
                    success: true,
                    data: {
                        branch_id: coachingCenterId,
                        total_receipts: 0,
                        total_revenue: 0,
                        total_collected: 0,
                        total_outstanding: 0,
                        paid_receipts: 0,
                        pending_receipts: 0,
                        overdue_receipts: 0,
                        collection_rate: 0,
                        payment_by_method: {
                            [PaymentMethod.MANUAL]: 0,
                            [PaymentMethod.UPI]: 0,
                            [PaymentMethod.CARD]: 0,
                            [PaymentMethod.BANK_TRANSFER]: 0,
                            [PaymentMethod.CHEQUE]: 0,
                            [PaymentMethod.OTHER]: 0,
                        },
                    },
                };
            }

            const branchIds = branches.map((b: { id: string }) => b.id);

            // Fetch all receipts for these branches
            const { data: receipts, error } = await this.supabase
                .from('fee_receipts')
                .select('*')
                .in('branch_id', branchIds);

            if (error) {
                console.error('[FeeReceiptsService] Coaching center stats error:', error);
                return {
                    success: false,
                    error: error.message || 'Failed to fetch stats',
                };
            }

            if (!receipts || receipts.length === 0) {
                return {
                    success: true,
                    data: {
                        branch_id: coachingCenterId,
                        total_receipts: 0,
                        total_revenue: 0,
                        total_collected: 0,
                        total_outstanding: 0,
                        paid_receipts: 0,
                        pending_receipts: 0,
                        overdue_receipts: 0,
                        collection_rate: 0,
                        payment_by_method: {
                            [PaymentMethod.MANUAL]: 0,
                            [PaymentMethod.UPI]: 0,
                            [PaymentMethod.CARD]: 0,
                            [PaymentMethod.BANK_TRANSFER]: 0,
                            [PaymentMethod.CHEQUE]: 0,
                            [PaymentMethod.OTHER]: 0,
                        },
                    },
                };
            }

            // Calculate statistics using the helper
            const stats = calculateBranchStats(receipts as FeeReceipt[]);
            // Override branch_id to use coaching center ID for identification
            stats.branch_id = coachingCenterId;

            return {
                success: true,
                data: stats,
            };
        } catch (error) {
            console.error('[FeeReceiptsService] Coaching center stats exception:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Get student payment summary
     */
    public async getStudentSummary(
        studentId: string
    ): Promise<FeeReceiptOperationResult<StudentPaymentSummary>> {
        try {
            // Fetch all receipts for student
            const { data: receipts, error } = await this.supabase
                .from('fee_receipts')
                .select('*')
                .eq('student_id', studentId);

            if (error) {
                console.error('[FeeReceiptsService] Get student summary error:', error);
                return {
                    success: false,
                    error: error.message || 'Failed to fetch student receipts',
                };
            }

            if (!receipts || receipts.length === 0) {
                return {
                    success: true,
                    data: {
                        student_id: studentId,
                        total_receipts: 0,
                        total_amount_due: 0,
                        total_amount_paid: 0,
                        total_outstanding: 0,
                        paid_receipts: 0,
                        pending_receipts: 0,
                        overdue_receipts: 0,
                        next_due_date: null,
                    },
                };
            }

            // Calculate summary
            const summary = calculateStudentSummary(receipts as FeeReceipt[]);

            return {
                success: true,
                data: summary,
            };
        } catch (error) {
            console.error('[FeeReceiptsService] Get student summary exception:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Get branch revenue statistics
     */
    public async getBranchStats(
        branchId: string
    ): Promise<FeeReceiptOperationResult<BranchRevenueStats>> {
        try {
            // Fetch all receipts for branch
            const { data: receipts, error } = await this.supabase
                .from('fee_receipts')
                .select('*')
                .eq('branch_id', branchId);

            if (error) {
                console.error('[FeeReceiptsService] Get branch stats error:', error);
                return {
                    success: false,
                    error: error.message || 'Failed to fetch branch receipts',
                };
            }

            if (!receipts || receipts.length === 0) {
                return {
                    success: true,
                    data: {
                        branch_id: branchId,
                        total_receipts: 0,
                        total_revenue: 0,
                        total_collected: 0,
                        total_outstanding: 0,
                        pending_receipts: 0,
                        paid_receipts: 0,
                        overdue_receipts: 0,
                        collection_rate: 0,
                        payment_by_method: {
                            [PaymentMethod.MANUAL]: 0,
                            [PaymentMethod.UPI]: 0,
                            [PaymentMethod.CARD]: 0,
                            [PaymentMethod.BANK_TRANSFER]: 0,
                            [PaymentMethod.CHEQUE]: 0,
                            [PaymentMethod.OTHER]: 0,
                        },
                    },
                };
            }

            // Calculate stats
            const stats = calculateBranchStats(receipts as FeeReceipt[]);

            return {
                success: true,
                data: stats,
            };
        } catch (error) {
            console.error('[FeeReceiptsService] Get branch stats exception:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Generate upcoming fee receipts using RPC (if available)
     * Falls back to client-side generation if RPC not available
     */
    public async generateUpcomingReceipts(
        params: { student_id?: string; branch_id?: string; class_id?: string; days_ahead?: number }
    ): Promise<FeeReceiptOperationResult<BulkGenerationResult>> {
        try {
            // Validate params
            const validation = validateInput(receiptGenerationParamsSchema, params);
            if (!validation.success) {
                return {
                    success: false,
                    validation_errors: validation.errors,
                };
            }

            const validParams = validation.data;

            // Try using RPC function first
            const { data, error } = await this.supabase.rpc('generate_upcoming_fee_receipts', {
                p_student_id: validParams.student_id || null,
                p_branch_id: validParams.branch_id || null,
                p_class_id: validParams.class_id || null,
                p_days_ahead: validParams.days_ahead || 30,
            });

            if (!error && data) {
                // RPC succeeded
                return {
                    success: true,
                    data: {
                        receipts_generated: data.receipts_generated || 0,
                        receipts: data.receipts || [],
                        failed_count: data.failed_count || 0,
                        errors: data.errors || [],
                    },
                };
            }

            // RPC failed or not available, return info message
            console.warn('[FeeReceiptsService] RPC generate_upcoming_fee_receipts not available:', error);
            return {
                success: false,
                error: 'Automatic receipt generation RPC not available. Please generate receipts manually.',
            };
        } catch (error) {
            console.error('[FeeReceiptsService] Generate upcoming receipts exception:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // ============================================================
    // DELETE OPERATIONS
    // ============================================================

    /**
     * Delete a receipt (soft delete via status change)
     */
    public async deleteReceipt(receiptId: string): Promise<FeeReceiptOperationResult<void>> {
        try {
            // Check if receipt exists and can be deleted
            const { data: receipt, error: fetchError } = await this.supabase
                .from('fee_receipts')
                .select('*')
                .eq('id', receiptId)
                .single();

            if (fetchError || !receipt) {
                return {
                    success: false,
                    error: 'Receipt not found',
                };
            }

            // Can only delete if no payment recorded
            if (receipt.amount_paid > 0) {
                return {
                    success: false,
                    error: 'Cannot delete receipt with payments. Cancel it instead.',
                };
            }

            // Perform soft delete (mark as cancelled)
            const { error: deleteError } = await this.supabase
                .from('fee_receipts')
                .update({
                    receipt_status: ReceiptStatus.CANCELLED,
                    internal_notes: `${receipt.internal_notes || ''}\n\n[${new Date().toISOString()}] Receipt deleted`,
                })
                .eq('id', receiptId);

            if (deleteError) {
                console.error('[FeeReceiptsService] Delete receipt error:', deleteError);
                return {
                    success: false,
                    error: deleteError.message || 'Failed to delete receipt',
                };
            }

            return {
                success: true,
            };
        } catch (error) {
            console.error('[FeeReceiptsService] Delete receipt exception:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
}

// ============================================================
// EXPORT SINGLETON INSTANCE
// ============================================================

export const feeReceiptsService = FeeReceiptsService.getInstance();
export default feeReceiptsService;

// Export types for external use
export type { FeeReceiptOperationResult };