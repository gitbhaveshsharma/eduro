/**
 * Zod validation schemas for Student Attendance
 * Based on migration: 016_create_branch_student_system.sql
 */

import { z } from 'zod';
import { AttendanceStatus } from '../types/student-attendance.types';

// Enum schema
export const attendanceStatusSchema = z.nativeEnum(AttendanceStatus);

// Time validation regex (HH:MM format)
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Mark attendance schema
export const markAttendanceSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  class_id: z.string().uuid('Invalid class ID'),
  teacher_id: z.string().uuid('Invalid teacher ID'),
  branch_id: z.string().uuid('Invalid branch ID'),
  attendance_date: z.string().date('Invalid attendance date'),
  attendance_status: attendanceStatusSchema,
  check_in_time: z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
  check_out_time: z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
  late_by_minutes: z.number().int().nonnegative('Late minutes must be non-negative').default(0),
  early_leave_minutes: z.number().int().nonnegative('Early leave minutes must be non-negative').default(0),
  teacher_remarks: z.string().max(500).optional(),
  excuse_reason: z.string().max(500).optional(),
}).refine((data) => {
  // Validate check_in_time < check_out_time if both present
  if (data.check_in_time && data.check_out_time) {
    return data.check_in_time <= data.check_out_time;
  }
  return true;
}, {
  message: 'Check-in time must be before or equal to check-out time',
  path: ['check_out_time'],
}).refine((data) => {
  // Excuse reason required for EXCUSED status
  if (data.attendance_status === AttendanceStatus.EXCUSED && !data.excuse_reason) {
    return false;
  }
  return true;
}, {
  message: 'Excuse reason is required for excused absences',
  path: ['excuse_reason'],
});

// Bulk mark attendance schema
export const bulkMarkAttendanceSchema = z.object({
  class_id: z.string().uuid('Invalid class ID'),
  teacher_id: z.string().uuid('Invalid teacher ID'),
  branch_id: z.string().uuid('Invalid branch ID'),
  attendance_date: z.string().date('Invalid attendance date'),
  attendance_records: z.array(
    z.object({
      student_id: z.string().uuid('Invalid student ID'),
      attendance_status: attendanceStatusSchema,
      check_in_time: z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
      check_out_time: z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
      late_by_minutes: z.number().int().nonnegative().default(0),
      teacher_remarks: z.string().max(500).optional(),
    })
  ).min(1, 'At least one attendance record is required'),
});

// Update attendance schema
export const updateAttendanceSchema = z.object({
  id: z.string().uuid('Invalid attendance ID'),
  attendance_status: attendanceStatusSchema.optional(),
  check_in_time: z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
  check_out_time: z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
  late_by_minutes: z.number().int().nonnegative().optional(),
  early_leave_minutes: z.number().int().nonnegative().optional(),
  teacher_remarks: z.string().max(500).optional(),
  excuse_reason: z.string().max(500).optional(),
});

// Filter schema
export const attendanceFiltersSchema = z.object({
  student_id: z.string().uuid().optional(),
  class_id: z.string().uuid().optional(),
  teacher_id: z.string().uuid().optional(),
  branch_id: z.string().uuid().optional(),
  attendance_status: attendanceStatusSchema.optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  attendance_date: z.string().date().optional(),
}).refine((data) => {
  // Validate date_from <= date_to if both present
  if (data.date_from && data.date_to) {
    return new Date(data.date_from) <= new Date(data.date_to);
  }
  return true;
}, {
  message: 'From date must be before or equal to date',
  path: ['date_to'],
});

// List params schema
export const attendanceListParamsSchema = attendanceFiltersSchema.extend({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sort_by: z.enum(['attendance_date', 'created_at']).default('attendance_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Get attendance summary schema
export const getAttendanceSummarySchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  class_id: z.string().uuid('Invalid class ID').optional(),
  from_date: z.string().date().optional(),
  to_date: z.string().date().optional(),
}).refine((data) => {
  if (data.from_date && data.to_date) {
    return new Date(data.from_date) <= new Date(data.to_date);
  }
  return true;
}, {
  message: 'From date must be before or equal to date',
  path: ['to_date'],
});

// Get class attendance report schema
export const getClassAttendanceReportSchema = z.object({
  class_id: z.string().uuid('Invalid class ID'),
  from_date: z.string().date().optional(),
  to_date: z.string().date().optional(),
}).refine((data) => {
  if (data.from_date && data.to_date) {
    return new Date(data.from_date) <= new Date(data.to_date);
  }
  return true;
}, {
  message: 'From date must be before or equal to date',
  path: ['to_date'],
});

// Export types from schemas
export type MarkAttendanceSchema = z.infer<typeof markAttendanceSchema>;
export type BulkMarkAttendanceSchema = z.infer<typeof bulkMarkAttendanceSchema>;
export type UpdateAttendanceSchema = z.infer<typeof updateAttendanceSchema>;
export type AttendanceFiltersSchema = z.infer<typeof attendanceFiltersSchema>;
export type AttendanceListParamsSchema = z.infer<typeof attendanceListParamsSchema>;
export type GetAttendanceSummarySchema = z.infer<typeof getAttendanceSummarySchema>;
export type GetClassAttendanceReportSchema = z.infer<typeof getClassAttendanceReportSchema>;
