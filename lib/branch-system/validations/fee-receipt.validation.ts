/**
 * Zod validation schemas for Fee Receipts
 * Based on migration: 016_create_branch_student_system.sql
 */

import { z } from 'zod';
import { ReceiptStatus, PaymentMethod } from '../types/fee-receipt.types';

// Enum schemas
export const receiptStatusSchema = z.nativeEnum(ReceiptStatus);
export const paymentMethodSchema = z.nativeEnum(PaymentMethod);

// Create fee receipt schema
export const createFeeReceiptSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  branch_id: z.string().uuid('Invalid branch ID'),
  class_id: z.string().uuid('Invalid class ID').optional(),
  enrollment_id: z.string().uuid('Invalid enrollment ID'),
  due_date: z.string().date('Invalid due date'),
  base_fee_amount: z.number().nonnegative('Base fee must be non-negative'),
  late_fee_amount: z.number().nonnegative('Late fee must be non-negative').default(0),
  discount_amount: z.number().nonnegative('Discount must be non-negative').default(0),
  tax_amount: z.number().nonnegative('Tax must be non-negative').default(0),
  total_amount: z.number().nonnegative('Total amount must be non-negative'),
  fee_month: z.number().int().min(1).max(12).optional(),
  fee_year: z.number().int().min(2000).max(2100).optional(),
  fee_period_start: z.string().date().optional(),
  fee_period_end: z.string().date().optional(),
  description: z.string().max(500).optional(),
  internal_notes: z.string().max(1000).optional(),
}).refine((data) => {
  // Validate total_amount = base_fee + late_fee + tax - discount
  const calculated = data.base_fee_amount + data.late_fee_amount + data.tax_amount - data.discount_amount;
  return Math.abs(data.total_amount - calculated) < 0.01; // Allow for floating point precision
}, {
  message: 'Total amount must equal base fee + late fee + tax - discount',
  path: ['total_amount'],
}).refine((data) => {
  // Validate fee_period_start <= fee_period_end if both present
  if (data.fee_period_start && data.fee_period_end) {
    return new Date(data.fee_period_start) <= new Date(data.fee_period_end);
  }
  return true;
}, {
  message: 'Fee period start must be before or equal to end',
  path: ['fee_period_end'],
});

// Update fee receipt schema (for payment processing)
export const updateFeeReceiptSchema = z.object({
  id: z.string().uuid('Invalid receipt ID'),
  amount_paid: z.number().nonnegative('Amount paid must be non-negative').optional(),
  payment_method: paymentMethodSchema.optional(),
  payment_reference: z.string().max(255).optional(),
  payment_date: z.string().date().optional(),
  receipt_status: receiptStatusSchema.optional(),
  late_fee_amount: z.number().nonnegative('Late fee must be non-negative').optional(),
  discount_amount: z.number().nonnegative('Discount must be non-negative').optional(),
  internal_notes: z.string().max(1000).optional(),
});

// Process payment schema
export const processPaymentSchema = z.object({
  receipt_id: z.string().uuid('Invalid receipt ID'),
  amount_paid: z.number().positive('Amount paid must be positive'),
  payment_method: paymentMethodSchema,
  payment_reference: z.string().max(255).optional(),
  payment_date: z.string().date().optional(),
});

// Filter schema
export const feeReceiptFiltersSchema = z.object({
  student_id: z.string().uuid().optional(),
  branch_id: z.string().uuid().optional(),
  class_id: z.string().uuid().optional(),
  enrollment_id: z.string().uuid().optional(),
  receipt_status: receiptStatusSchema.optional(),
  payment_method: paymentMethodSchema.optional(),
  is_auto_generated: z.boolean().optional(),
  fee_month: z.number().int().min(1).max(12).optional(),
  fee_year: z.number().int().min(2000).max(2100).optional(),
  due_date_from: z.string().date().optional(),
  due_date_to: z.string().date().optional(),
  search: z.string().optional(),
});

// List params schema
export const feeReceiptListParamsSchema = feeReceiptFiltersSchema.extend({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sort_by: z.enum(['created_at', 'receipt_date', 'due_date', 'total_amount']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Export types from schemas
export type CreateFeeReceiptSchema = z.infer<typeof createFeeReceiptSchema>;
export type UpdateFeeReceiptSchema = z.infer<typeof updateFeeReceiptSchema>;
export type ProcessPaymentSchema = z.infer<typeof processPaymentSchema>;
export type FeeReceiptFiltersSchema = z.infer<typeof feeReceiptFiltersSchema>;
export type FeeReceiptListParamsSchema = z.infer<typeof feeReceiptListParamsSchema>;
