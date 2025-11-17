/**
 * Type definitions for Fee Receipts
 * Based on migration: 016_create_branch_student_system.sql
 */

// ============================================================
// ENUMS
// ============================================================

/**
 * Payment method types
 */
export enum PaymentMethod {
    MANUAL = 'MANUAL',             // Manual/Cash payment
    UPI = 'UPI',                   // UPI payment
    CARD = 'CARD',                 // Credit/Debit card
    BANK_TRANSFER = 'BANK_TRANSFER', // Bank transfer
    CHEQUE = 'CHEQUE',             // Cheque payment
    OTHER = 'OTHER',               // Other payment methods
}

/**
 * Receipt status types
 */
export enum ReceiptStatus {
    PENDING = 'PENDING',   // Receipt generated but payment pending
    PAID = 'PAID',         // Payment completed
    CANCELLED = 'CANCELLED', // Receipt cancelled
    REFUNDED = 'REFUNDED', // Payment refunded
}

// ============================================================
// DATABASE ROW TYPE
// ============================================================

/**
 * Fee Receipt database row (exact match with database schema)
 */
export interface FeeReceiptRow {
    id: string;

    // Relationships
    student_id: string;
    branch_id: string;
    class_id: string | null;
    enrollment_id: string;

    // Receipt details
    receipt_number: string; // Auto-generated: BRANCH-YY-MM-NNNN
    receipt_date: string;   // ISO date string
    due_date: string;       // ISO date string

    // Fee breakdown
    base_fee_amount: number;
    late_fee_amount: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;

    // Payment tracking
    amount_paid: number;
    balance_amount: number; // Auto-calculated
    payment_method: PaymentMethod | null;
    payment_reference: string | null;
    payment_date: string | null; // ISO date string

    // Status and management
    receipt_status: ReceiptStatus;
    is_auto_generated: boolean;

    // Fee period
    fee_month: number | null; // 1-12
    fee_year: number | null;  // Year (e.g., 2024)
    fee_period_start: string | null; // ISO date string
    fee_period_end: string | null;   // ISO date string

    // Processing
    processed_by: string | null; // UUID of branch manager/admin

    // Notes
    description: string | null;
    internal_notes: string | null;

    // Metadata
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

// ============================================================
// EXTENDED TYPES WITH RELATIONS
// ============================================================

/**
 * Fee Receipt with related entity information
 */
export interface FeeReceipt extends FeeReceiptRow {
    student?: {
        id: string;
        full_name: string | null;
        username: string | null;
        avatar_url: string | null;
        email: string | null;
    };
    branch?: {
        id: string;
        name: string;
    };
    class?: {
        id: string;
        class_name: string;
        subject: string;
    } | null;
    enrollment?: {
        id: string;
        enrollment_date: string;
        enrollment_status: string;
    };
    processor?: {
        id: string;
        full_name: string | null;
    } | null;
}

/**
 * Public Fee Receipt (safe for display to students/parents)
 */
export interface PublicFeeReceipt {
    id: string;
    receipt_number: string;
    receipt_date: string;
    due_date: string;

    // Fee breakdown
    base_fee_amount: number;
    late_fee_amount: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;

    // Payment info
    amount_paid: number;
    balance_amount: number;
    payment_method: PaymentMethod | null;
    payment_date: string | null;
    receipt_status: ReceiptStatus;

    // Fee period
    fee_month: number | null;
    fee_year: number | null;
    fee_period_start: string | null;
    fee_period_end: string | null;

    // Description (excluding internal notes)
    description: string | null;

    // Related info
    class_name: string | null;
    subject: string | null;
    branch_name: string;

    created_at: string;
}

// ============================================================
// INPUT DTOS
// ============================================================

/**
 * DTO for creating a new fee receipt
 */
export interface CreateFeeReceiptInput {
    student_id: string;
    branch_id: string;
    class_id?: string;
    enrollment_id: string;

    // Receipt details
    receipt_date?: string; // Defaults to current date
    due_date: string;

    // Fee breakdown
    base_fee_amount: number;
    late_fee_amount?: number;
    discount_amount?: number;
    tax_amount?: number;

    // Fee period
    fee_month?: number;
    fee_year?: number;
    fee_period_start?: string;
    fee_period_end?: string;

    // Description
    description?: string;
    internal_notes?: string;

    // Auto-generation flag
    is_auto_generated?: boolean;
}

/**
 * DTO for recording a payment
 */
export interface RecordPaymentInput {
    receipt_id: string;
    amount_paid: number;
    payment_method: PaymentMethod;
    payment_reference?: string;
    payment_date?: string; // Defaults to current date
    internal_notes?: string;
}

/**
 * DTO for updating receipt details (before payment)
 */
export interface UpdateReceiptInput {
    id: string;
    due_date?: string;
    base_fee_amount?: number;
    late_fee_amount?: number;
    discount_amount?: number;
    tax_amount?: number;
    description?: string;
    internal_notes?: string;
    fee_month?: number;
    fee_year?: number;
    fee_period_start?: string;
    fee_period_end?: string;
}

/**
 * DTO for cancelling/refunding a receipt
 */
export interface CancelReceiptInput {
    receipt_id: string;
    reason: string;
    refund_amount?: number;
}

// ============================================================
// FILTER & QUERY TYPES
// ============================================================

/**
 * Filters for querying fee receipts
 */
export interface FeeReceiptFilters {
    student_id?: string;
    branch_id?: string;
    class_id?: string;
    enrollment_id?: string;
    receipt_status?: ReceiptStatus;
    payment_method?: PaymentMethod;
    processed_by?: string;

    // Date filters
    receipt_date_from?: string;
    receipt_date_to?: string;
    due_date_from?: string;
    due_date_to?: string;
    payment_date_from?: string;
    payment_date_to?: string;

    // Fee period filters
    fee_month?: number;
    fee_year?: number;

    // Amount filters
    min_amount?: number;
    max_amount?: number;
    has_balance?: boolean; // Has outstanding balance
    is_overdue?: boolean;  // Past due date and unpaid
    is_auto_generated?: boolean;
}

/**
 * List parameters with pagination and sorting
 */
export interface FeeReceiptListParams extends FeeReceiptFilters {
    page?: number;
    limit?: number;
    sort_by?: 'receipt_date' | 'due_date' | 'payment_date' | 'total_amount' | 'balance_amount' | 'created_at';
    sort_order?: 'asc' | 'desc';
}

/**
 * List response with pagination metadata
 */
export interface FeeReceiptListResponse {
    data: FeeReceipt[];
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
}

// ============================================================
// STATISTICS & ANALYTICS TYPES
// ============================================================

/**
 * Student payment summary
 */
export interface StudentPaymentSummary {
    student_id: string;
    total_receipts: number;
    total_amount_due: number;
    total_amount_paid: number;
    total_outstanding: number;
    paid_receipts: number;
    pending_receipts: number;
    overdue_receipts: number;
    next_due_date: string | null;
}

/**
 * Branch revenue statistics
 */
export interface BranchRevenueStats {
    branch_id: string;
    total_receipts: number;
    total_revenue: number;           // Sum of total_amount
    total_collected: number;          // Sum of amount_paid
    total_outstanding: number;        // Sum of balance_amount
    pending_receipts: number;
    paid_receipts: number;
    overdue_receipts: number;
    collection_rate: number;          // Percentage of collected vs total

    // Payment method breakdown
    payment_by_method: Record<PaymentMethod, number>;

    // Monthly breakdown
    monthly_revenue?: Array<{
        month: number;
        year: number;
        revenue: number;
        collected: number;
        outstanding: number;
    }>;
}

/**
 * Payment history record
 */
export interface PaymentHistoryRecord {
    receipt_id: string;
    receipt_number: string;
    payment_date: string;
    amount_paid: number;
    payment_method: PaymentMethod;
    payment_reference: string | null;
    processed_by: string | null;
    processor_name: string | null;
}

/**
 * Overdue receipt information
 */
export interface OverdueReceipt {
    id: string;
    receipt_number: string;
    student_id: string;
    student_name: string;
    due_date: string;
    days_overdue: number;
    balance_amount: number;
    total_amount: number;
    last_payment_date: string | null;
    contact_phone: string | null;
}

/**
 * Receipt generation parameters
 */
export interface ReceiptGenerationParams {
    student_id?: string;
    branch_id?: string;
    class_id?: string;
    days_ahead?: number; // Generate for receipts due in X days
}

// ============================================================
// OPERATION RESULT TYPES
// ============================================================

/**
 * Generic operation result wrapper
 */
export interface FeeReceiptOperationResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    validation_errors?: Array<{
        field: string;
        message: string;
    }>;
}

/**
 * Validation error detail
 */
export interface FeeReceiptValidationError {
    field: string;
    message: string;
}

/**
 * Receipt creation result with additional info
 */
export interface ReceiptCreationResult {
    receipt: FeeReceipt;
    receipt_number: string;
    total_amount: number;
    balance_amount: number;
}

/**
 * Payment recording result
 */
export interface PaymentRecordingResult {
    receipt: FeeReceipt;
    payment_applied: number;
    new_balance: number;
    is_fully_paid: boolean;
}

/**
 * Bulk generation result
 */
export interface BulkGenerationResult {
    receipts_generated: number;
    receipts: FeeReceipt[];
    failed_count: number;
    errors?: Array<{
        student_id: string;
        error: string;
    }>;
}

// ============================================================
// DASHBOARD & UI TYPES
// ============================================================

/**
 * Student payment dashboard data
 */
export interface StudentPaymentDashboard {
    summary: StudentPaymentSummary;
    recent_receipts: PublicFeeReceipt[];
    upcoming_payments: PublicFeeReceipt[];
    overdue_payments: PublicFeeReceipt[];
    payment_history: PaymentHistoryRecord[];
}

/**
 * Branch manager dashboard data
 */
export interface BranchManagerDashboard {
    revenue_stats: BranchRevenueStats;
    recent_receipts: FeeReceipt[];
    overdue_receipts: OverdueReceipt[];
    pending_receipts: FeeReceipt[];
    collection_trends: Array<{
        date: string;
        collected: number;
        target: number;
    }>;
}

/**
 * Receipt detail for viewing
 */
export interface ReceiptDetailView extends FeeReceipt {
    student_full_info: {
        id: string;
        full_name: string;
        email: string | null;
        phone: string | null;
        parent_phone: string | null;
    };
    payment_breakdown: {
        base_fee: number;
        late_fee: number;
        discount: number;
        tax: number;
        subtotal: number;
        total: number;
        paid: number;
        balance: number;
    };
    payment_history: PaymentHistoryRecord[];
}

// ============================================================
// UTILITY TYPES
// ============================================================

/**
 * Fee calculation parameters
 */
export interface FeeCalculationParams {
    base_amount: number;
    late_fee_rate?: number;     // Percentage for late fee
    discount_rate?: number;      // Percentage for discount
    tax_rate?: number;           // Percentage for tax
    days_late?: number;          // Days past due date
}

/**
 * Fee calculation result
 */
export interface FeeCalculationResult {
    base_fee_amount: number;
    late_fee_amount: number;
    discount_amount: number;
    tax_amount: number;
    subtotal: number;
    total_amount: number;
}

/**
 * Receipt number generation params
 */
export interface ReceiptNumberParams {
    branch_id: string;
    receipt_date: string;
}

/**
 * Payment status with metadata
 */
export interface PaymentStatusInfo {
    status: ReceiptStatus;
    is_paid: boolean;
    is_partial: boolean;
    is_overdue: boolean;
    days_until_due: number | null;
    days_overdue: number | null;
    payment_progress: number; // Percentage (0-100)
}

// ============================================================
// TYPE GUARDS
// ============================================================

/**
 * Type guard for checking if receipt is paid
 */
export function isReceiptPaid(receipt: FeeReceipt | FeeReceiptRow): boolean {
    return receipt.receipt_status === ReceiptStatus.PAID || receipt.balance_amount <= 0;
}

/**
 * Type guard for checking if receipt is overdue
 */
export function isReceiptOverdue(receipt: FeeReceipt | FeeReceiptRow): boolean {
    if (isReceiptPaid(receipt)) return false;
    const today = new Date().toISOString().split('T')[0];
    return receipt.due_date < today;
}

/**
 * Type guard for checking if receipt has partial payment
 */
export function hasPartialPayment(receipt: FeeReceipt | FeeReceiptRow): boolean {
    return receipt.amount_paid > 0 && receipt.balance_amount > 0;
}