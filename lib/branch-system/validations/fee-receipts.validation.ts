/**
 * Zod validation schemas for Fee Receipts
 * Comprehensive input validation with business rules
 */

import { z } from 'zod';
import { PaymentMethod, ReceiptStatus } from '../types/fee-receipts.types';

// ============================================================
// ENUM VALIDATIONS
// ============================================================

export const paymentMethodSchema = z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: 'Invalid payment method' }),
});

export const receiptStatusSchema = z.nativeEnum(ReceiptStatus, {
    errorMap: () => ({ message: 'Invalid receipt status' }),
});

// ============================================================
// BASE FIELD VALIDATIONS
// ============================================================

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid({
    message: 'Invalid UUID format',
});

/**
 * Receipt number validation (BRANCH-YY-MM-NNNN format)
 */
export const receiptNumberSchema = z
    .string()
    .regex(/^[A-Z0-9]+-\d{2}-\d{2}-\d{4}$/, {
        message: 'Receipt number must be in format: BRANCH-YY-MM-NNNN',
    })
    .min(10)
    .max(50);

/**
 * Date string validation (ISO 8601 format)
 */
export const isoDateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'Date must be in ISO format (YYYY-MM-DD)',
    })
    .refine(
        (date) => {
            const parsed = new Date(date);
            return !isNaN(parsed.getTime());
        },
        { message: 'Invalid date' }
    );

/**
 * Future date validation
 */
export const futureDateSchema = isoDateSchema.refine(
    (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        return checkDate >= today;
    },
    { message: 'Date cannot be in the past' }
);

/**
 * Past or present date validation
 */
export const pastOrPresentDateSchema = isoDateSchema.refine(
    (date) => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const checkDate = new Date(date);
        return checkDate <= today;
    },
    { message: 'Date cannot be in the future' }
);

/**
 * Amount validation (positive, max 2 decimal places)
 */
export const amountSchema = z
    .number()
    .nonnegative({ message: 'Amount must be non-negative' })
    .finite({ message: 'Amount must be a finite number' })
    .refine(
        (val) => {
            const decimals = val.toString().split('.')[1];
            return !decimals || decimals.length <= 2;
        },
        { message: 'Amount cannot have more than 2 decimal places' }
    );

/**
 * Positive amount validation (must be > 0)
 */
export const positiveAmountSchema = amountSchema.refine(
    (val) => val > 0,
    { message: 'Amount must be greater than 0' }
);

/**
 * Month validation (1-12)
 */
export const monthSchema = z
    .number()
    .int({ message: 'Month must be an integer' })
    .min(1, { message: 'Month must be between 1 and 12' })
    .max(12, { message: 'Month must be between 1 and 12' });

/**
 * Year validation (1900-2100)
 */
export const yearSchema = z
    .number()
    .int({ message: 'Year must be an integer' })
    .min(1900, { message: 'Year must be 1900 or later' })
    .max(2100, { message: 'Year must be 2100 or earlier' });

/**
 * Description validation
 */
export const descriptionSchema = z
    .string()
    .trim()
    .min(1, { message: 'Description cannot be empty' })
    .max(1000, { message: 'Description cannot exceed 1000 characters' })
    .optional();

/**
 * Internal notes validation
 */
export const internalNotesSchema = z
    .string()
    .trim()
    .max(2000, { message: 'Internal notes cannot exceed 2000 characters' })
    .optional();

/**
 * Payment reference validation
 */
export const paymentReferenceSchema = z
    .string()
    .trim()
    .min(1, { message: 'Payment reference cannot be empty' })
    .max(100, { message: 'Payment reference cannot exceed 100 characters' })
    .optional();

// ============================================================
// CREATE RECEIPT VALIDATION
// ============================================================

export const createFeeReceiptSchema = z
    .object({
        // Required relationships
        student_id: uuidSchema,
        branch_id: uuidSchema,
        enrollment_id: uuidSchema,

        // Optional class
        class_id: uuidSchema.optional(),

        // Receipt details
        receipt_date: isoDateSchema.optional(), // Defaults to current date
        due_date: futureDateSchema,

        // Fee breakdown
        base_fee_amount: positiveAmountSchema,
        late_fee_amount: amountSchema.optional().default(0),
        discount_amount: amountSchema.optional().default(0),
        tax_amount: amountSchema.optional().default(0),

        // Fee period
        fee_month: monthSchema.optional(),
        fee_year: yearSchema.optional(),
        fee_period_start: isoDateSchema.optional(),
        fee_period_end: isoDateSchema.optional(),

        // Description
        description: descriptionSchema,
        internal_notes: internalNotesSchema,

        // Auto-generation flag
        is_auto_generated: z.boolean().optional().default(false),
    })
    .refine(
        (data) => {
            // If both receipt_date and due_date provided, due_date must be after receipt_date
            if (data.receipt_date && data.due_date) {
                return new Date(data.due_date) >= new Date(data.receipt_date);
            }
            return true;
        },
        {
            message: 'Due date must be on or after receipt date',
            path: ['due_date'],
        }
    )
    .refine(
        (data) => {
            // If discount provided, it cannot exceed base fee
            if (data.discount_amount && data.discount_amount > data.base_fee_amount) {
                return false;
            }
            return true;
        },
        {
            message: 'Discount amount cannot exceed base fee amount',
            path: ['discount_amount'],
        }
    )
    .refine(
        (data) => {
            // If fee period provided, both must be set or both must be empty
            const hasStart = !!data.fee_period_start;
            const hasEnd = !!data.fee_period_end;
            return hasStart === hasEnd;
        },
        {
            message: 'Both fee_period_start and fee_period_end must be provided together',
            path: ['fee_period_end'],
        }
    )
    .refine(
        (data) => {
            // If fee period dates provided, start must be before end
            if (data.fee_period_start && data.fee_period_end) {
                return new Date(data.fee_period_start) <= new Date(data.fee_period_end);
            }
            return true;
        },
        {
            message: 'Fee period start must be before or equal to end',
            path: ['fee_period_end'],
        }
    )
    .refine(
        (data) => {
            // If month/year provided, both must be set
            const hasMonth = data.fee_month !== undefined;
            const hasYear = data.fee_year !== undefined;
            return hasMonth === hasYear;
        },
        {
            message: 'Both fee_month and fee_year must be provided together',
            path: ['fee_year'],
        }
    );

export type CreateFeeReceiptInput = z.infer<typeof createFeeReceiptSchema>;

// ============================================================
// RECORD PAYMENT VALIDATION
// ============================================================

export const recordPaymentSchema = z
    .object({
        receipt_id: uuidSchema,
        amount_paid: positiveAmountSchema,
        payment_method: paymentMethodSchema,
        payment_reference: paymentReferenceSchema,
        payment_date: pastOrPresentDateSchema.optional(), // Defaults to current date
        internal_notes: internalNotesSchema,
    })
    .refine(
        (data) => {
            // UPI/CARD/BANK_TRANSFER payments should have payment reference
            const requiresReference = [
                PaymentMethod.UPI,
                PaymentMethod.CARD,
                PaymentMethod.BANK_TRANSFER,
            ];
            if (requiresReference.includes(data.payment_method) && !data.payment_reference) {
                return false;
            }
            return true;
        },
        {
            message: 'Payment reference is required for UPI, Card, and Bank Transfer payments',
            path: ['payment_reference'],
        }
    );

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

// ============================================================
// UPDATE RECEIPT VALIDATION
// ============================================================

export const updateReceiptSchema = z
    .object({
        id: uuidSchema,
        due_date: futureDateSchema.optional(),
        base_fee_amount: positiveAmountSchema.optional(),
        late_fee_amount: amountSchema.optional(),
        discount_amount: amountSchema.optional(),
        tax_amount: amountSchema.optional(),
        description: descriptionSchema,
        internal_notes: internalNotesSchema,
        fee_month: monthSchema.optional(),
        fee_year: yearSchema.optional(),
        fee_period_start: isoDateSchema.optional(),
        fee_period_end: isoDateSchema.optional(),
    })
    .refine(
        (data) => {
            // At least one field must be provided for update
            const hasUpdate =
                data.due_date ||
                data.base_fee_amount !== undefined ||
                data.late_fee_amount !== undefined ||
                data.discount_amount !== undefined ||
                data.tax_amount !== undefined ||
                data.description ||
                data.internal_notes ||
                data.fee_month !== undefined ||
                data.fee_year !== undefined ||
                data.fee_period_start ||
                data.fee_period_end;
            return hasUpdate;
        },
        {
            message: 'At least one field must be provided for update',
            path: ['id'],
        }
    )
    .refine(
        (data) => {
            // If discount provided with base fee, discount cannot exceed base fee
            if (data.discount_amount !== undefined && data.base_fee_amount !== undefined) {
                return data.discount_amount <= data.base_fee_amount;
            }
            return true;
        },
        {
            message: 'Discount amount cannot exceed base fee amount',
            path: ['discount_amount'],
        }
    )
    .refine(
        (data) => {
            // If fee period dates provided, start must be before end
            if (data.fee_period_start && data.fee_period_end) {
                return new Date(data.fee_period_start) <= new Date(data.fee_period_end);
            }
            return true;
        },
        {
            message: 'Fee period start must be before or equal to end',
            path: ['fee_period_end'],
        }
    );

export type UpdateReceiptInput = z.infer<typeof updateReceiptSchema>;

// ============================================================
// CANCEL/REFUND VALIDATION
// ============================================================

export const cancelReceiptSchema = z.object({
    receipt_id: uuidSchema,
    reason: z
        .string()
        .trim()
        .min(10, { message: 'Cancellation reason must be at least 10 characters' })
        .max(500, { message: 'Cancellation reason cannot exceed 500 characters' }),
    refund_amount: amountSchema.optional(),
});

export type CancelReceiptInput = z.infer<typeof cancelReceiptSchema>;

// ============================================================
// FILTER VALIDATION
// ============================================================

export const feeReceiptFiltersSchema = z.object({
    // Relationships
    student_id: uuidSchema.optional(),
    branch_id: uuidSchema.optional(),
    class_id: uuidSchema.optional(),
    enrollment_id: uuidSchema.optional(),
    processed_by: uuidSchema.optional(),

    // Status
    receipt_status: receiptStatusSchema.optional(),
    payment_method: paymentMethodSchema.optional(),

    // Date ranges
    receipt_date_from: isoDateSchema.optional(),
    receipt_date_to: isoDateSchema.optional(),
    due_date_from: isoDateSchema.optional(),
    due_date_to: isoDateSchema.optional(),
    payment_date_from: isoDateSchema.optional(),
    payment_date_to: isoDateSchema.optional(),

    // Fee period
    fee_month: monthSchema.optional(),
    fee_year: yearSchema.optional(),

    // Amount filters
    min_amount: amountSchema.optional(),
    max_amount: amountSchema.optional(),
    has_balance: z.boolean().optional(),
    is_overdue: z.boolean().optional(),
    is_auto_generated: z.boolean().optional(),
});

export type FeeReceiptFilters = z.infer<typeof feeReceiptFiltersSchema>;

// ============================================================
// LIST PARAMETERS VALIDATION
// ============================================================

export const feeReceiptListParamsSchema = feeReceiptFiltersSchema.extend({
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().min(1).max(100).optional().default(20),
    sort_by: z
        .enum(['receipt_date', 'due_date', 'payment_date', 'total_amount', 'balance_amount', 'created_at'])
        .optional()
        .default('receipt_date'),
    sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type FeeReceiptListParams = z.infer<typeof feeReceiptListParamsSchema>;

// ============================================================
// RECEIPT GENERATION VALIDATION
// ============================================================

export const receiptGenerationParamsSchema = z
    .object({
        student_id: uuidSchema.optional(),
        branch_id: uuidSchema.optional(),
        class_id: uuidSchema.optional(),
        days_ahead: z
            .number()
            .int()
            .min(1, { message: 'Days ahead must be at least 1' })
            .max(365, { message: 'Days ahead cannot exceed 365' })
            .optional()
            .default(30),
    })
    .refine(
        (data) => {
            // At least one filter must be provided
            return data.student_id || data.branch_id || data.class_id;
        },
        {
            message: 'At least one of student_id, branch_id, or class_id must be provided',
            path: ['student_id'],
        }
    );

export type ReceiptGenerationParams = z.infer<typeof receiptGenerationParamsSchema>;

// ============================================================
// FEE CALCULATION VALIDATION
// ============================================================

export const feeCalculationParamsSchema = z
    .object({
        base_amount: positiveAmountSchema,
        late_fee_rate: z
            .number()
            .nonnegative()
            .max(100, { message: 'Late fee rate cannot exceed 100%' })
            .optional(),
        discount_rate: z
            .number()
            .nonnegative()
            .max(100, { message: 'Discount rate cannot exceed 100%' })
            .optional(),
        tax_rate: z
            .number()
            .nonnegative()
            .max(100, { message: 'Tax rate cannot exceed 100%' })
            .optional(),
        days_late: z.number().int().nonnegative().optional(),
    })
    .refine(
        (data) => {
            // If discount rate provided, ensure it doesn't exceed 100% of base
            if (data.discount_rate && data.discount_rate > 0) {
                const discountAmount = (data.base_amount * data.discount_rate) / 100;
                return discountAmount <= data.base_amount;
            }
            return true;
        },
        {
            message: 'Discount cannot exceed base amount',
            path: ['discount_rate'],
        }
    );

export type FeeCalculationParams = z.infer<typeof feeCalculationParamsSchema>;

// ============================================================
// BULK OPERATIONS VALIDATION
// ============================================================

export const bulkCreateReceiptsSchema = z.object({
    receipts: z
        .array(z.object({
            student_id: uuidSchema,
            branch_id: uuidSchema,
            enrollment_id: uuidSchema,
            class_id: uuidSchema.optional(),
            receipt_date: isoDateSchema.optional(),
            due_date: futureDateSchema,
            base_fee_amount: positiveAmountSchema,
            late_fee_amount: amountSchema.optional(),
            discount_amount: amountSchema.optional(),
            tax_amount: amountSchema.optional(),
            fee_month: monthSchema.optional(),
            fee_year: yearSchema.optional(),
            fee_period_start: isoDateSchema.optional(),
            fee_period_end: isoDateSchema.optional(),
            description: descriptionSchema,
            internal_notes: internalNotesSchema,
            is_auto_generated: z.boolean().optional(),
        }))
        .min(1, { message: 'At least one receipt must be provided' })
        .max(100, { message: 'Cannot create more than 100 receipts at once' }),
});

export const bulkRecordPaymentsSchema = z.object({
    payments: z
        .array(z.object({
            receipt_id: uuidSchema,
            amount_paid: positiveAmountSchema,
            payment_method: paymentMethodSchema,
            payment_reference: paymentReferenceSchema,
            payment_date: pastOrPresentDateSchema.optional(),
            internal_notes: internalNotesSchema,
        }))
        .min(1, { message: 'At least one payment must be provided' })
        .max(50, { message: 'Cannot record more than 50 payments at once' }),
});

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Validate and parse input with proper error handling
 */
export function validateInput<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: Array<{ field: string; message: string }> } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
    }));

    return { success: false, errors };
}

/**
 * Validate amount is within reasonable limits
 */
export function validateAmountLimits(amount: number): boolean {
    return amount >= 0 && amount <= 10000000; // 1 crore max
}

/**
 * Validate payment does not exceed balance
 */
export function validatePaymentAmount(paymentAmount: number, balance: number): boolean {
    return paymentAmount > 0 && paymentAmount <= balance;
}

/**
 * Validate receipt can be modified
 */
export function validateReceiptModifiable(status: ReceiptStatus): boolean {
    return status !== ReceiptStatus.CANCELLED && status !== ReceiptStatus.REFUNDED;
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: string, endDate: string): boolean {
    return new Date(startDate) <= new Date(endDate);
}