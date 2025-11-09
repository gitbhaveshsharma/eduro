/**
 * Zod validation schemas for Branch Students (Enrollment)
 * Based on migration: 016_create_branch_student_system.sql
 */

import { z } from 'zod';
import { EnrollmentStatus, PaymentStatus } from '../types/branch-student.types';

// Enum schemas
export const enrollmentStatusSchema = z.nativeEnum(EnrollmentStatus);
export const paymentStatusSchema = z.nativeEnum(PaymentStatus);

// Phone number validation regex (international format)
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// Create enrollment schema
export const createBranchStudentSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  branch_id: z.string().uuid('Invalid branch ID'),
  class_id: z.string().uuid('Invalid class ID').optional(),
  enrollment_date: z.string().date().optional(),
  expected_completion_date: z.string().date().optional(),
  emergency_contact_name: z.string().max(255).optional(),
  emergency_contact_phone: z.string().regex(phoneRegex, 'Invalid phone number format').optional(),
  parent_guardian_name: z.string().max(255).optional(),
  parent_guardian_phone: z.string().regex(phoneRegex, 'Invalid phone number format').optional(),
  preferred_batch: z.string().max(100).optional(),
  special_requirements: z.string().max(1000).optional(),
  student_notes: z.string().max(1000).optional(),
});

// Student update schema (only fields students can update)
export const updateBranchStudentSchema = z.object({
  id: z.string().uuid('Invalid enrollment ID'),
  emergency_contact_name: z.string().max(255).optional(),
  emergency_contact_phone: z.string().regex(phoneRegex, 'Invalid phone number format').optional(),
  parent_guardian_name: z.string().max(255).optional(),
  parent_guardian_phone: z.string().regex(phoneRegex, 'Invalid phone number format').optional(),
  preferred_batch: z.string().max(100).optional(),
  special_requirements: z.string().max(1000).optional(),
  student_notes: z.string().max(1000).optional(),
});

// Admin/Teacher update schema (includes all fields)
export const updateBranchStudentAdminSchema = updateBranchStudentSchema.extend({
  enrollment_status: enrollmentStatusSchema.optional(),
  payment_status: paymentStatusSchema.optional(),
  attendance_percentage: z.number().min(0).max(100).optional(),
  current_grade: z.string().max(50).optional(),
  performance_notes: z.string().max(2000).optional(),
  total_fees_due: z.number().nonnegative().optional(),
  total_fees_paid: z.number().nonnegative().optional(),
  last_payment_date: z.string().date().optional(),
  next_payment_due: z.string().date().optional(),
  expected_completion_date: z.string().date().optional(),
  actual_completion_date: z.string().date().optional(),
  class_id: z.string().uuid('Invalid class ID').optional(),
}).refine((data) => {
  // Validate total_fees_paid <= total_fees_due if both are present
  if (data.total_fees_paid !== undefined && data.total_fees_due !== undefined) {
    return data.total_fees_paid <= data.total_fees_due;
  }
  return true;
}, {
  message: 'Total fees paid cannot exceed total fees due',
  path: ['total_fees_paid'],
});

// Filter schema
export const branchStudentFiltersSchema = z.object({
  student_id: z.string().uuid().optional(),
  branch_id: z.string().uuid().optional(),
  class_id: z.string().uuid().optional(),
  enrollment_status: enrollmentStatusSchema.optional(),
  payment_status: paymentStatusSchema.optional(),
  search: z.string().optional(),
});

// List params schema
export const branchStudentListParamsSchema = branchStudentFiltersSchema.extend({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sort_by: z.enum(['created_at', 'enrollment_date', 'attendance_percentage']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Export types from schemas
export type CreateBranchStudentSchema = z.infer<typeof createBranchStudentSchema>;
export type UpdateBranchStudentSchema = z.infer<typeof updateBranchStudentSchema>;
export type UpdateBranchStudentAdminSchema = z.infer<typeof updateBranchStudentAdminSchema>;
export type BranchStudentFiltersSchema = z.infer<typeof branchStudentFiltersSchema>;
export type BranchStudentListParamsSchema = z.infer<typeof branchStudentListParamsSchema>;
