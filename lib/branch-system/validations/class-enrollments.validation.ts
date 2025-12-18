/**
 * Class Enrollments Validation Schemas
 * 
 * Comprehensive Zod validation schemas for class enrollment operations
 * Enforces business rules and data integrity
 * 
 * @module branch-system/validations/class-enrollments
 */

import { z } from 'zod';
import type { ClassEnrollmentStatus } from '../types/class-enrollments.types';

// ============================================================
// VALIDATION LIMITS & CONSTRAINTS
// ============================================================

/**
 * Validation limits matching database constraints
 */
export const CLASS_ENROLLMENT_LIMITS = {
    // Text fields
    GRADE_MAX: 50,
    NOTES_MAX: 5000,
    BATCH_NAME_MAX: 100,
    SPECIAL_REQUIREMENTS_MAX: 2000,

    // Numeric fields
    ATTENDANCE_MIN: 0.0,
    ATTENDANCE_MAX: 100.0,

    // Date constraints
    MIN_YEAR: 2000,
    MAX_YEARS_AHEAD: 10,
} as const;

/**
 * Regular expressions for validation
 */
const VALIDATION_REGEX = {
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
} as const;

// ============================================================
// BASE SCHEMAS - Reusable validation schemas
// ============================================================

/**
 * UUID validation schema
 */
export const uuidSchema = z
    .string()
    .uuid('Invalid UUID format')
    .refine(
        (val) => VALIDATION_REGEX.UUID.test(val),
        'Must be a valid UUID'
    );

/**
 * Class enrollment status enum schema
 */
export const classEnrollmentStatusSchema = z.enum(
    ['ENROLLED', 'PENDING', 'SUSPENDED', 'DROPPED', 'COMPLETED'],
    { errorMap: () => ({ message: 'Invalid enrollment status' }) }
) as z.ZodType<ClassEnrollmentStatus>;

/**
 * Date validation (ISO date string)
 */
export const dateSchema = z
    .string()
    .refine(
        (date) => {
            const parsed = new Date(date);
            return !isNaN(parsed.getTime());
        },
        'Invalid date format'
    )
    .refine(
        (date) => {
            const year = new Date(date).getFullYear();
            return year >= CLASS_ENROLLMENT_LIMITS.MIN_YEAR;
        },
        `Date must be after ${CLASS_ENROLLMENT_LIMITS.MIN_YEAR}`
    )
    .refine(
        (date) => {
            const maxDate = new Date();
            maxDate.setFullYear(maxDate.getFullYear() + CLASS_ENROLLMENT_LIMITS.MAX_YEARS_AHEAD);
            return new Date(date) <= maxDate;
        },
        `Date cannot be more than ${CLASS_ENROLLMENT_LIMITS.MAX_YEARS_AHEAD} years in the future`
    );

/**
 * Attendance percentage validation
 */
export const attendancePercentageSchema = z
    .number()
    .min(CLASS_ENROLLMENT_LIMITS.ATTENDANCE_MIN, `Attendance cannot be less than ${CLASS_ENROLLMENT_LIMITS.ATTENDANCE_MIN}%`)
    .max(CLASS_ENROLLMENT_LIMITS.ATTENDANCE_MAX, `Attendance cannot exceed ${CLASS_ENROLLMENT_LIMITS.ATTENDANCE_MAX}%`)
    .refine(
        (val) => Number.isFinite(val),
        'Attendance must be a valid number'
    )
    .refine(
        (val) => {
            // Check decimal places (max 2)
            const str = val.toString();
            const decimalIndex = str.indexOf('.');
            if (decimalIndex === -1) return true;
            return str.length - decimalIndex - 1 <= 2;
        },
        'Attendance can have maximum 2 decimal places'
    );

/**
 * Grade validation
 */
export const gradeSchema = z
    .string()
    .max(CLASS_ENROLLMENT_LIMITS.GRADE_MAX, `Grade must not exceed ${CLASS_ENROLLMENT_LIMITS.GRADE_MAX} characters`)
    .optional()
    .nullable();

/**
 * Performance notes validation
 */
export const performanceNotesSchema = z
    .string()
    .max(CLASS_ENROLLMENT_LIMITS.NOTES_MAX, `Notes must not exceed ${CLASS_ENROLLMENT_LIMITS.NOTES_MAX} characters`)
    .optional()
    .nullable();

/**
 * Batch name validation
 */
export const batchNameSchema = z
    .string()
    .max(CLASS_ENROLLMENT_LIMITS.BATCH_NAME_MAX, `Batch name must not exceed ${CLASS_ENROLLMENT_LIMITS.BATCH_NAME_MAX} characters`)
    .optional()
    .nullable();

/**
 * Special requirements validation
 */
export const specialRequirementsSchema = z
    .string()
    .max(CLASS_ENROLLMENT_LIMITS.SPECIAL_REQUIREMENTS_MAX, `Requirements must not exceed ${CLASS_ENROLLMENT_LIMITS.SPECIAL_REQUIREMENTS_MAX} characters`)
    .optional()
    .nullable();

/**
 * Metadata validation (flexible JSON object)
 */
export const metadataSchema = z
    .record(z.any())
    .optional()
    .nullable();

// ============================================================
// MAIN VALIDATION SCHEMAS
// ============================================================

/**
 * Create Class Enrollment Schema
 * Validates input when enrolling a student in a class
 */
export const createClassEnrollmentSchema = z
    .object({
        // Required fields
        student_id: uuidSchema,
        branch_id: uuidSchema,
        class_id: uuidSchema,

        // Optional fields
        branch_student_id: uuidSchema.optional().nullable(),
        enrollment_date: dateSchema.optional(),
        enrollment_status: classEnrollmentStatusSchema.optional().default('ENROLLED'),
        expected_completion_date: dateSchema.optional().nullable(),

        // Class-specific preferences
        preferred_batch: batchNameSchema,
        special_requirements: specialRequirementsSchema,

        // Metadata
        metadata: metadataSchema,
    })
    .refine(
        (data) => {
            // Enrollment date should not be in the future
            if (data.enrollment_date) {
                const enrollDate = new Date(data.enrollment_date);
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                return enrollDate <= today;
            }
            return true;
        },
        {
            message: 'Enrollment date cannot be in the future',
            path: ['enrollment_date'],
        }
    )
    .refine(
        (data) => {
            // Expected completion date should be after enrollment date
            if (data.enrollment_date && data.expected_completion_date) {
                return new Date(data.expected_completion_date) > new Date(data.enrollment_date);
            }
            return true;
        },
        {
            message: 'Expected completion date must be after enrollment date',
            path: ['expected_completion_date'],
        }
    );

/**
 * Update Class Enrollment By Teacher Schema
 * Teachers can only update academic fields
 */
export const updateClassEnrollmentByTeacherSchema = z
    .object({
        current_grade: gradeSchema,
        performance_notes: performanceNotesSchema,
        attendance_percentage: attendancePercentageSchema.optional(),
    })
    .refine(
        (data) => {
            // At least one field must be provided
            return Object.values(data).some(val => val !== undefined);
        },
        'At least one field must be provided for update'
    );

/**
 * Update Class Enrollment By Manager Schema
 * Managers can update most fields
 */
export const updateClassEnrollmentByManagerSchema = z
    .object({
        enrollment_status: classEnrollmentStatusSchema.optional(),
        expected_completion_date: dateSchema.optional().nullable(),
        actual_completion_date: dateSchema.optional().nullable(),
        attendance_percentage: attendancePercentageSchema.optional(),
        current_grade: gradeSchema,
        performance_notes: performanceNotesSchema,
        preferred_batch: batchNameSchema,
        special_requirements: specialRequirementsSchema,
        metadata: metadataSchema,
    })
    .refine(
        (data) => {
            // At least one field must be provided
            return Object.values(data).some(val => val !== undefined);
        },
        'At least one field must be provided for update'
    )
    .refine(
        (data) => {
            // If enrollment_status is COMPLETED, actual_completion_date should be provided
            if (data.enrollment_status === 'COMPLETED' && !data.actual_completion_date) {
                return false;
            }
            return true;
        },
        {
            message: 'Actual completion date is required when marking enrollment as COMPLETED',
            path: ['actual_completion_date'],
        }
    );

/**
 * Class Enrollment Filter Schema
 * Validates filter parameters for searching/listing enrollments
 */
export const classEnrollmentFilterSchema = z.object({
    student_id: uuidSchema.optional(),
    branch_id: uuidSchema.optional(),
    class_id: uuidSchema.optional(),
    branch_student_id: uuidSchema.optional(),
    enrollment_status: z.union([classEnrollmentStatusSchema, z.array(classEnrollmentStatusSchema)]).optional(),
    enrollment_date_from: dateSchema.optional(),
    enrollment_date_to: dateSchema.optional(),
    attendance_min: attendancePercentageSchema.optional(),
    attendance_max: attendancePercentageSchema.optional(),
    search_query: z.string().max(200).optional(),
});

/**
 * Class Enrollment Sort Schema
 * Validates sort parameters
 */
export const classEnrollmentSortSchema = z.object({
    field: z.enum([
        'student_name',
        'class_name',
        'enrollment_date',
        'enrollment_status',
        'attendance_percentage',
        'current_grade',
        'created_at',
        'updated_at',
    ]),
    direction: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Pagination Schema
 * Validates pagination parameters
 */
export const paginationSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
});

/**
 * Class Enrollment ID Schema
 * Validates an enrollment ID parameter
 */
export const classEnrollmentIdSchema = z.object({
    enrollment_id: uuidSchema,
});

// ============================================================
// TYPE EXPORTS - Inferred types from schemas
// ============================================================

export type CreateClassEnrollmentInput = z.infer<typeof createClassEnrollmentSchema>;
export type UpdateClassEnrollmentByTeacherInput = z.infer<typeof updateClassEnrollmentByTeacherSchema>;
export type UpdateClassEnrollmentByManagerInput = z.infer<typeof updateClassEnrollmentByManagerSchema>;
export type ClassEnrollmentFilter = z.infer<typeof classEnrollmentFilterSchema>;
export type ClassEnrollmentSort = z.infer<typeof classEnrollmentSortSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

// ============================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================

/**
 * Validates create class enrollment input and returns typed result
 */
export function validateCreateClassEnrollment(input: unknown) {
    return createClassEnrollmentSchema.safeParse(input);
}

/**
 * Validates teacher update input and returns typed result
 */
export function validateUpdateClassEnrollmentByTeacher(input: unknown) {
    return updateClassEnrollmentByTeacherSchema.safeParse(input);
}

/**
 * Validates manager update input and returns typed result
 */
export function validateUpdateClassEnrollmentByManager(input: unknown) {
    return updateClassEnrollmentByManagerSchema.safeParse(input);
}

/**
 * Validates filter parameters and returns typed result
 */
export function validateClassEnrollmentFilter(input: unknown) {
    return classEnrollmentFilterSchema.safeParse(input);
}

/**
 * Validates sort parameters and returns typed result
 */
export function validateClassEnrollmentSort(input: unknown) {
    return classEnrollmentSortSchema.safeParse(input);
}

/**
 * Validates pagination parameters and returns typed result
 */
export function validatePagination(input: unknown) {
    return paginationSchema.safeParse(input);
}

/**
 * Validates class enrollment ID and returns typed result
 */
export function validateClassEnrollmentId(input: unknown) {
    return classEnrollmentIdSchema.safeParse(input);
}
