/**
 * Utility functions for Fee Receipts
 * Pure functions for calculations, formatting, and transformations
 */

import {
    FeeReceipt,
    FeeReceiptRow,
    PublicFeeReceipt,
    PaymentMethod,
    ReceiptStatus,
    FeeCalculationParams,
    FeeCalculationResult,
    PaymentStatusInfo,
    StudentPaymentSummary,
    BranchRevenueStats,
    OverdueReceipt,
} from '../types/fee-receipts.types';

// ============================================================
// FORMATTING UTILITIES
// ============================================================

/**
 * Format amount as currency (₹)
 */
export function formatCurrency(amount: number, includeSymbol = true): string {
    const formatted = amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Format receipt number for display
 */
export function formatReceiptNumber(receiptNumber: string): string {
    return receiptNumber.toUpperCase();
}

/**
 * Format payment method for display
 */
export function formatPaymentMethod(method: PaymentMethod): string {
    const methodLabels: Record<PaymentMethod, string> = {
        [PaymentMethod.MANUAL]: 'Manual/Cash',
        [PaymentMethod.UPI]: 'UPI',
        [PaymentMethod.CARD]: 'Card',
        [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
        [PaymentMethod.CHEQUE]: 'Cheque',
        [PaymentMethod.OTHER]: 'Other',
    };
    return methodLabels[method];
}

/**
 * Format receipt status for display
 */
export function formatReceiptStatus(status: ReceiptStatus): string {
    const statusLabels: Record<ReceiptStatus, string> = {
        [ReceiptStatus.PENDING]: 'Pending',
        [ReceiptStatus.PAID]: 'Paid',
        [ReceiptStatus.CANCELLED]: 'Cancelled',
        [ReceiptStatus.REFUNDED]: 'Refunded',
    };
    return statusLabels[status];
}

/**
 * Format date for display (DD/MM/YYYY)
 */
export function formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return 'Invalid Date';
    }
}

/**
 * Format month/year for display (MMM YYYY)
 */
export function formatMonthYear(month: number | null, year: number | null): string {
    if (!month || !year) return 'N/A';

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[month - 1]} ${year}`;
}

/**
 * Format fee period for display
 */
export function formatFeePeriod(startDate: string | null, endDate: string | null): string {
    if (!startDate || !endDate) return 'N/A';
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

// ============================================================
// CALCULATION UTILITIES
// ============================================================

/**
 * Calculate total amount from fee breakdown
 */
export function calculateTotalAmount(
    baseFee: number,
    lateFee: number = 0,
    discount: number = 0,
    tax: number = 0
): number {
    const subtotal = baseFee + lateFee - discount;
    const total = subtotal + tax;
    return Math.max(0, parseFloat(total.toFixed(2)));
}

/**
 * Calculate balance amount
 */
export function calculateBalance(totalAmount: number, amountPaid: number = 0): number {
    const balance = totalAmount - amountPaid;
    return Math.max(0, parseFloat(balance.toFixed(2)));
}

/**
 * Calculate late fee based on days late and rate
 */
export function calculateLateFee(
    baseAmount: number,
    daysLate: number,
    dailyRate: number = 0.5
): number {
    if (daysLate <= 0) return 0;
    const lateFee = (baseAmount * dailyRate * daysLate) / 100;
    return parseFloat(lateFee.toFixed(2));
}

/**
 * Calculate discount amount from percentage
 */
export function calculateDiscount(baseAmount: number, discountRate: number): number {
    if (discountRate <= 0) return 0;
    const discount = (baseAmount * discountRate) / 100;
    return parseFloat(discount.toFixed(2));
}

/**
 * Calculate tax amount from percentage
 */
export function calculateTax(subtotal: number, taxRate: number): number {
    if (taxRate <= 0) return 0;
    const tax = (subtotal * taxRate) / 100;
    return parseFloat(tax.toFixed(2));
}

/**
 * Calculate full fee breakdown with all components
 */
export function calculateFeeBreakdown(params: FeeCalculationParams): FeeCalculationResult {
    const {
        base_amount,
        late_fee_rate = 0,
        discount_rate = 0,
        tax_rate = 0,
        days_late = 0,
    } = params;

    // Calculate late fee if days late
    const late_fee_amount = late_fee_rate > 0 && days_late > 0
        ? calculateLateFee(base_amount, days_late, late_fee_rate)
        : 0;

    // Calculate discount
    const discount_amount = calculateDiscount(base_amount, discount_rate);

    // Calculate subtotal (base + late fee - discount)
    const subtotal = base_amount + late_fee_amount - discount_amount;

    // Calculate tax on subtotal
    const tax_amount = calculateTax(subtotal, tax_rate);

    // Calculate total
    const total_amount = subtotal + tax_amount;

    return {
        base_fee_amount: parseFloat(base_amount.toFixed(2)),
        late_fee_amount: parseFloat(late_fee_amount.toFixed(2)),
        discount_amount: parseFloat(discount_amount.toFixed(2)),
        tax_amount: parseFloat(tax_amount.toFixed(2)),
        subtotal: parseFloat(subtotal.toFixed(2)),
        total_amount: parseFloat(total_amount.toFixed(2)),
    };
}

/**
 * Calculate payment progress percentage
 */
export function calculatePaymentProgress(totalAmount: number, amountPaid: number): number {
    if (totalAmount === 0) return 100;
    const progress = (amountPaid / totalAmount) * 100;
    return Math.min(100, Math.max(0, parseFloat(progress.toFixed(2))));
}

/**
 * Calculate collection rate
 */
export function calculateCollectionRate(totalRevenue: number, totalCollected: number): number {
    if (totalRevenue === 0) return 0;
    const rate = (totalCollected / totalRevenue) * 100;
    return parseFloat(rate.toFixed(2));
}

// ============================================================
// DATE UTILITIES
// ============================================================

/**
 * Get days until due date
 */
export function getDaysUntilDue(dueDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Get days overdue
 */
export function getDaysOverdue(dueDate: string): number {
    const daysUntil = getDaysUntilDue(dueDate);
    return daysUntil < 0 ? Math.abs(daysUntil) : 0;
}

/**
 * Check if receipt is overdue
 */
export function isOverdue(dueDate: string, status: ReceiptStatus): boolean {
    if (status === ReceiptStatus.PAID) return false;
    return getDaysUntilDue(dueDate) < 0;
}

/**
 * Check if receipt is due soon (within days)
 */
export function isDueSoon(dueDate: string, withinDays: number = 7): boolean {
    const daysUntil = getDaysUntilDue(dueDate);
    return daysUntil >= 0 && daysUntil <= withinDays;
}

/**
 * Get current month and year
 */
export function getCurrentMonthYear(): { month: number; year: number } {
    const now = new Date();
    return {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
    };
}

/**
 * Get ISO date string for today
 */
export function getTodayISODate(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Add days to date
 */
export function addDaysToDate(dateString: string, days: number): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

/**
 * Get date range for month
 */
export function getMonthDateRange(month: number, year: number): { start: string; end: string } {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
    };
}

// ============================================================
// STATUS UTILITIES
// ============================================================

/**
 * Get receipt status with detailed information
 */
export function getReceiptStatusInfo(receipt: FeeReceipt | FeeReceiptRow): PaymentStatusInfo {
    const isPaid = receipt.receipt_status === ReceiptStatus.PAID || receipt.balance_amount <= 0;
    const isPartial = receipt.amount_paid > 0 && receipt.balance_amount > 0;
    const daysUntilDue = isPaid ? null : getDaysUntilDue(receipt.due_date);
    const daysOverdue = isPaid ? null : getDaysOverdue(receipt.due_date);
    const paymentProgress = calculatePaymentProgress(receipt.total_amount, receipt.amount_paid);

    return {
        status: receipt.receipt_status,
        is_paid: isPaid,
        is_partial: isPartial,
        is_overdue: isOverdue(receipt.due_date, receipt.receipt_status),
        days_until_due: daysUntilDue,
        days_overdue: daysOverdue,
        payment_progress: paymentProgress,
    };
}

/**
 * Get receipt status badge color
 */
export function getStatusBadgeColor(status: ReceiptStatus): string {
    const colors: Record<ReceiptStatus, string> = {
        [ReceiptStatus.PENDING]: 'yellow',
        [ReceiptStatus.PAID]: 'green',
        [ReceiptStatus.CANCELLED]: 'gray',
        [ReceiptStatus.REFUNDED]: 'blue',
    };
    return colors[status];
}

/**
 * Get payment priority (1=highest, 3=lowest)
 */
export function getPaymentPriority(receipt: FeeReceipt | FeeReceiptRow): number {
    if (receipt.receipt_status === ReceiptStatus.PAID) return 3;

    const daysOverdue = getDaysOverdue(receipt.due_date);
    if (daysOverdue > 30) return 1; // Critical
    if (daysOverdue > 0) return 2;  // High

    const daysUntilDue = getDaysUntilDue(receipt.due_date);
    if (daysUntilDue <= 7) return 2; // High (due soon)

    return 3; // Normal
}

/**
 * Check if receipt can be edited
 */
export function canEditReceipt(receipt: FeeReceipt | FeeReceiptRow): boolean {
    return (
        receipt.receipt_status !== ReceiptStatus.CANCELLED &&
        receipt.receipt_status !== ReceiptStatus.REFUNDED &&
        receipt.amount_paid === 0
    );
}

/**
 * Check if receipt can be cancelled
 */
export function canCancelReceipt(receipt: FeeReceipt | FeeReceiptRow): boolean {
    return (
        receipt.receipt_status !== ReceiptStatus.CANCELLED &&
        receipt.receipt_status !== ReceiptStatus.REFUNDED
    );
}

/**
 * Check if payment can be recorded
 */
export function canRecordPayment(receipt: FeeReceipt | FeeReceiptRow): boolean {
    return (
        receipt.receipt_status === ReceiptStatus.PENDING &&
        receipt.balance_amount > 0
    );
}

// ============================================================
// TRANSFORMATION UTILITIES
// ============================================================

/**
 * Convert FeeReceipt to PublicFeeReceipt (safe for students)
 */
export function toPublicReceipt(receipt: FeeReceipt): PublicFeeReceipt {
    return {
        id: receipt.id,
        receipt_number: receipt.receipt_number,
        receipt_date: receipt.receipt_date,
        due_date: receipt.due_date,

        // Fee breakdown
        base_fee_amount: receipt.base_fee_amount,
        late_fee_amount: receipt.late_fee_amount,
        discount_amount: receipt.discount_amount,
        tax_amount: receipt.tax_amount,
        total_amount: receipt.total_amount,

        // Payment info
        amount_paid: receipt.amount_paid,
        balance_amount: receipt.balance_amount,
        payment_method: receipt.payment_method,
        payment_date: receipt.payment_date,
        receipt_status: receipt.receipt_status,

        // Fee period
        fee_month: receipt.fee_month,
        fee_year: receipt.fee_year,
        fee_period_start: receipt.fee_period_start,
        fee_period_end: receipt.fee_period_end,

        // Description (no internal notes)
        description: receipt.description,

        // Related info
        class_name: receipt.class?.class_name || null,
        subject: receipt.class?.subject || null,
        branch_name: receipt.branch?.name || 'Unknown Branch',

        created_at: receipt.created_at,
    };
}

/**
 * Group receipts by status
 */
export function groupReceiptsByStatus(
    receipts: FeeReceipt[]
): Record<ReceiptStatus, FeeReceipt[]> {
    const grouped: Record<ReceiptStatus, FeeReceipt[]> = {
        [ReceiptStatus.PENDING]: [],
        [ReceiptStatus.PAID]: [],
        [ReceiptStatus.CANCELLED]: [],
        [ReceiptStatus.REFUNDED]: [],
    };

    receipts.forEach((receipt) => {
        grouped[receipt.receipt_status].push(receipt);
    });

    return grouped;
}

/**
 * Group receipts by month/year
 */
export function groupReceiptsByMonth(
    receipts: FeeReceipt[]
): Record<string, FeeReceipt[]> {
    const grouped: Record<string, FeeReceipt[]> = {};

    receipts.forEach((receipt) => {
        if (receipt.fee_month && receipt.fee_year) {
            const key = `${receipt.fee_year}-${receipt.fee_month.toString().padStart(2, '0')}`;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(receipt);
        }
    });

    return grouped;
}

/**
 * Sort receipts by priority
 */
export function sortReceiptsByPriority(receipts: FeeReceipt[]): FeeReceipt[] {
    return [...receipts].sort((a, b) => {
        const priorityA = getPaymentPriority(a);
        const priorityB = getPaymentPriority(b);

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        // Same priority, sort by due date
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
}

/**
 * Filter overdue receipts
 */
export function filterOverdueReceipts(receipts: FeeReceipt[]): FeeReceipt[] {
    return receipts.filter((r) => isOverdue(r.due_date, r.receipt_status));
}

/**
 * Filter receipts due soon
 */
export function filterDueSoonReceipts(receipts: FeeReceipt[], withinDays: number = 7): FeeReceipt[] {
    return receipts.filter(
        (r) =>
            r.receipt_status === ReceiptStatus.PENDING &&
            isDueSoon(r.due_date, withinDays)
    );
}

// ============================================================
// SUMMARY UTILITIES
// ============================================================

/**
 * Calculate student payment summary
 */
export function calculateStudentSummary(receipts: FeeReceipt[]): StudentPaymentSummary {
    const totalReceipts = receipts.length;
    const totalAmountDue = receipts.reduce((sum, r) => sum + r.total_amount, 0);
    const totalAmountPaid = receipts.reduce((sum, r) => sum + r.amount_paid, 0);
    const totalOutstanding = receipts.reduce((sum, r) => sum + r.balance_amount, 0);

    const paidReceipts = receipts.filter((r) => r.receipt_status === ReceiptStatus.PAID).length;
    const pendingReceipts = receipts.filter((r) => r.receipt_status === ReceiptStatus.PENDING).length;
    const overdueReceipts = receipts.filter((r) => isOverdue(r.due_date, r.receipt_status)).length;

    const upcomingReceipts = receipts.filter(
        (r) => r.receipt_status === ReceiptStatus.PENDING && !isOverdue(r.due_date, r.receipt_status)
    );

    const nextDueDate =
        upcomingReceipts.length > 0
            ? upcomingReceipts.sort(
                (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
            )[0].due_date
            : null;

    return {
        student_id: receipts[0]?.student_id || '',
        total_receipts: totalReceipts,
        total_amount_due: parseFloat(totalAmountDue.toFixed(2)),
        total_amount_paid: parseFloat(totalAmountPaid.toFixed(2)),
        total_outstanding: parseFloat(totalOutstanding.toFixed(2)),
        paid_receipts: paidReceipts,
        pending_receipts: pendingReceipts,
        overdue_receipts: overdueReceipts,
        next_due_date: nextDueDate,
    };
}

/**
 * Calculate branch revenue statistics
 */
export function calculateBranchStats(receipts: FeeReceipt[]): BranchRevenueStats {
    const totalReceipts = receipts.length;
    const totalRevenue = receipts.reduce((sum, r) => sum + r.total_amount, 0);
    const totalCollected = receipts.reduce((sum, r) => sum + r.amount_paid, 0);
    const totalOutstanding = receipts.reduce((sum, r) => sum + r.balance_amount, 0);

    const pendingReceipts = receipts.filter((r) => r.receipt_status === ReceiptStatus.PENDING).length;
    const paidReceipts = receipts.filter((r) => r.receipt_status === ReceiptStatus.PAID).length;
    const overdueReceipts = receipts.filter((r) => isOverdue(r.due_date, r.receipt_status)).length;

    const collectionRate = calculateCollectionRate(totalRevenue, totalCollected);

    // Payment by method breakdown
    const paymentByMethod: Record<PaymentMethod, number> = {
        [PaymentMethod.MANUAL]: 0,
        [PaymentMethod.UPI]: 0,
        [PaymentMethod.CARD]: 0,
        [PaymentMethod.BANK_TRANSFER]: 0,
        [PaymentMethod.CHEQUE]: 0,
        [PaymentMethod.OTHER]: 0,
    };

    receipts.forEach((r) => {
        if (r.payment_method && r.amount_paid > 0) {
            paymentByMethod[r.payment_method] += r.amount_paid;
        }
    });

    return {
        branch_id: receipts[0]?.branch_id || '',
        total_receipts: totalReceipts,
        total_revenue: parseFloat(totalRevenue.toFixed(2)),
        total_collected: parseFloat(totalCollected.toFixed(2)),
        total_outstanding: parseFloat(totalOutstanding.toFixed(2)),
        pending_receipts: pendingReceipts,
        paid_receipts: paidReceipts,
        overdue_receipts: overdueReceipts,
        collection_rate: collectionRate,
        payment_by_method: paymentByMethod,
    };
}

/**
 * Generate overdue receipts list with details
 */
export function generateOverdueList(receipts: FeeReceipt[]): OverdueReceipt[] {
    return receipts
        .filter((r) => isOverdue(r.due_date, r.receipt_status))
        .map((r) => ({
            id: r.id,
            receipt_number: r.receipt_number,
            student_id: r.student_id,
            student_name: r.student?.full_name || 'Unknown',
            due_date: r.due_date,
            days_overdue: getDaysOverdue(r.due_date),
            balance_amount: r.balance_amount,
            total_amount: r.total_amount,
            last_payment_date: r.payment_date,
            contact_phone: r.student?.email || null,
        }))
        .sort((a, b) => b.days_overdue - a.days_overdue);
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Validate payment amount against balance
 */
export function validatePaymentAmount(paymentAmount: number, balance: number): {
    valid: boolean;
    error?: string;
} {
    if (paymentAmount <= 0) {
        return { valid: false, error: 'Payment amount must be greater than 0' };
    }
    if (paymentAmount > balance) {
        return { valid: false, error: 'Payment amount cannot exceed balance' };
    }
    return { valid: true };
}

/**
 * Validate discount amount
 */
export function validateDiscountAmount(discount: number, baseFee: number): {
    valid: boolean;
    error?: string;
} {
    if (discount < 0) {
        return { valid: false, error: 'Discount cannot be negative' };
    }
    if (discount > baseFee) {
        return { valid: false, error: 'Discount cannot exceed base fee' };
    }
    return { valid: true };
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: string, endDate: string): {
    valid: boolean;
    error?: string;
} {
    if (new Date(startDate) > new Date(endDate)) {
        return { valid: false, error: 'Start date must be before or equal to end date' };
    }
    return { valid: true };
}

// ============================================================
// EXPORT ALL UTILITIES
// ============================================================

export {
    // Type guards from types file
    isReceiptPaid,
    isReceiptOverdue,
    hasPartialPayment,
} from '../types/fee-receipts.types';