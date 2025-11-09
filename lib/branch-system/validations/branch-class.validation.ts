/**
 * Zod validation schemas for Branch Classes
 * Based on migration: 016_create_branch_student_system.sql
 */

import { z } from 'zod';
import { ClassStatus, FeesFrequency } from '../types/branch-class.types';

// Enum schemas
export const classStatusSchema = z.nativeEnum(ClassStatus);
export const feesFrequencySchema = z.nativeEnum(FeesFrequency);

// Base schema for branch class
export const branchClassSchema = z.object({
  id: z.string().uuid(),
  branch_id: z.string().uuid(),
  class_name: z.string().min(1, 'Class name is required').max(255),
  subject: z.string().min(1, 'Subject is required').max(255),
  description: z.string().max(1000).nullable().optional(),
  grade_level: z.string().min(1, 'Grade level is required').max(50),
  batch_name: z.string().max(100).nullable().optional(),
  start_date: z.string().date().nullable().optional(),
  end_date: z.string().date().nullable().optional(),
  class_days: z.array(z.string()).nullable().optional(),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).nullable().optional(),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).nullable().optional(),
  max_students: z.number().int().positive().default(30),
  current_enrollment: z.number().int().nonnegative().default(0),
  fees_amount: z.number().nonnegative().nullable().optional(),
  fees_frequency: feesFrequencySchema.default(FeesFrequency.MONTHLY),
  teacher_id: z.string().uuid().nullable().optional(),
  status: classStatusSchema.default(ClassStatus.ACTIVE),
  is_visible: z.boolean().default(true),
  prerequisites: z.array(z.string()).nullable().optional(),
  materials_required: z.array(z.string()).nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
}).refine((data) => {
  // Validate start_time < end_time if both are present
  if (data.start_time && data.end_time) {
    return data.start_time < data.end_time;
  }
  return true;
}, {
  message: 'Start time must be before end time',
  path: ['start_time'],
}).refine((data) => {
  // Validate start_date <= end_date if both are present
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) <= new Date(data.end_date);
  }
  return true;
}, {
  message: 'Start date must be before or equal to end date',
  path: ['start_date'],
}).refine((data) => {
  // Validate current_enrollment <= max_students
  return data.current_enrollment <= data.max_students;
}, {
  message: 'Current enrollment cannot exceed maximum students',
  path: ['current_enrollment'],
});

// Create schema (without auto-generated fields)
export const createBranchClassSchema = z.object({
  branch_id: z.string().uuid('Invalid branch ID'),
  class_name: z.string().min(1, 'Class name is required').max(255, 'Class name too long'),
  subject: z.string().min(1, 'Subject is required').max(255, 'Subject name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  grade_level: z.string().min(1, 'Grade level is required').max(50, 'Grade level too long'),
  batch_name: z.string().max(100, 'Batch name too long').optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  class_days: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).optional(),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  max_students: z.number().int().positive('Max students must be positive').default(30),
  fees_amount: z.number().nonnegative('Fees amount must be non-negative').optional(),
  fees_frequency: feesFrequencySchema.optional().default(FeesFrequency.MONTHLY),
  teacher_id: z.string().uuid('Invalid teacher ID').optional(),
  status: classStatusSchema.optional().default(ClassStatus.ACTIVE),
  is_visible: z.boolean().optional().default(true),
  prerequisites: z.array(z.string()).optional(),
  materials_required: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional().default({}),
}).refine((data) => {
  if (data.start_time && data.end_time) {
    return data.start_time < data.end_time;
  }
  return true;
}, {
  message: 'Start time must be before end time',
  path: ['end_time'],
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) <= new Date(data.end_date);
  }
  return true;
}, {
  message: 'End date must be after or equal to start date',
  path: ['end_date'],
});

// Update schema (all fields optional except id)
export const updateBranchClassSchema = z.object({
  id: z.string().uuid('Invalid class ID'),
  branch_id: z.string().uuid('Invalid branch ID').optional(),
  class_name: z.string().min(1, 'Class name is required').max(255, 'Class name too long').optional(),
  subject: z.string().min(1, 'Subject is required').max(255, 'Subject name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  grade_level: z.string().min(1, 'Grade level is required').max(50, 'Grade level too long').optional(),
  batch_name: z.string().max(100, 'Batch name too long').optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  class_days: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).optional(),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  max_students: z.number().int().positive('Max students must be positive').optional(),
  fees_amount: z.number().nonnegative('Fees amount must be non-negative').optional(),
  fees_frequency: feesFrequencySchema.optional(),
  teacher_id: z.string().uuid('Invalid teacher ID').optional(),
  status: classStatusSchema.optional(),
  is_visible: z.boolean().optional(),
  prerequisites: z.array(z.string()).optional(),
  materials_required: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Filter schema
export const branchClassFiltersSchema = z.object({
  branch_id: z.string().uuid().optional(),
  teacher_id: z.string().uuid().optional(),
  status: classStatusSchema.optional(),
  subject: z.string().optional(),
  grade_level: z.string().optional(),
  is_visible: z.boolean().optional(),
  search: z.string().optional(),
});

// List params schema
export const branchClassListParamsSchema = branchClassFiltersSchema.extend({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sort_by: z.enum(['created_at', 'class_name', 'start_date', 'current_enrollment']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Export types from schemas
export type BranchClassSchema = z.infer<typeof branchClassSchema>;
export type CreateBranchClassSchema = z.infer<typeof createBranchClassSchema>;
export type UpdateBranchClassSchema = z.infer<typeof updateBranchClassSchema>;
export type BranchClassFiltersSchema = z.infer<typeof branchClassFiltersSchema>;
export type BranchClassListParamsSchema = z.infer<typeof branchClassListParamsSchema>;
