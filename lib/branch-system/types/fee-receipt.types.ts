/**
 * Type definitions for Fee Receipts
 * Based on migration: 016_create_branch_student_system.sql
 */

// Enums
export enum ReceiptStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  MANUAL = 'MANUAL',
  UPI = 'UPI',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  OTHER = 'OTHER',
}

// Database row type
export interface FeeReceiptRow {
  id: string;
  student_id: string;
  branch_id: string;
  class_id: string | null;
  enrollment_id: string;
  receipt_number: string;
  receipt_date: string;
  due_date: string;
  base_fee_amount: number;
  late_fee_amount: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_amount: number;
  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  payment_date: string | null;
  receipt_status: ReceiptStatus;
  is_auto_generated: boolean;
  fee_month: number | null;
  fee_year: number | null;
  fee_period_start: string | null;
  fee_period_end: string | null;
  processed_by: string | null;
  description: string | null;
  internal_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Extended type with relations
export interface FeeReceipt extends FeeReceiptRow {
  student?: {
    id: string;
    full_name: string | null;
    username: string | null;
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
  };
  processed_by_user?: {
    id: string;
    full_name: string | null;
  };
}

// DTO for creating receipt
export interface CreateFeeReceiptDTO {
  student_id: string;
  branch_id: string;
  class_id?: string;
  enrollment_id: string;
  due_date: string;
  base_fee_amount: number;
  late_fee_amount?: number;
  discount_amount?: number;
  tax_amount?: number;
  total_amount: number;
  fee_month?: number;
  fee_year?: number;
  fee_period_start?: string;
  fee_period_end?: string;
  description?: string;
  internal_notes?: string;
}

// DTO for updating receipt (payment processing)
export interface UpdateFeeReceiptDTO {
  id: string;
  amount_paid?: number;
  payment_method?: PaymentMethod;
  payment_reference?: string;
  payment_date?: string;
  receipt_status?: ReceiptStatus;
  late_fee_amount?: number;
  discount_amount?: number;
  internal_notes?: string;
}

// Filter types
export interface FeeReceiptFilters {
  student_id?: string;
  branch_id?: string;
  class_id?: string;
  enrollment_id?: string;
  receipt_status?: ReceiptStatus;
  payment_method?: PaymentMethod;
  is_auto_generated?: boolean;
  fee_month?: number;
  fee_year?: number;
  due_date_from?: string;
  due_date_to?: string;
  search?: string; // Search by receipt number
}

// List params
export interface FeeReceiptListParams extends FeeReceiptFilters {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'receipt_date' | 'due_date' | 'total_amount';
  sort_order?: 'asc' | 'desc';
}

export interface FeeReceiptListResponse {
  data: FeeReceipt[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Payment processing
export interface ProcessPaymentDTO {
  receipt_id: string;
  amount_paid: number;
  payment_method: PaymentMethod;
  payment_reference?: string;
  payment_date?: string;
}

// Receipt generation result
export interface GenerateReceiptsResult {
  success: boolean;
  receipts_generated: number;
  message: string;
  error?: string;
}
