/**
 * Branch Students Validation Schemas
 * 
 * Comprehensive Zod validation schemas for branch student enrollment operations
 * Enforces business rules and data integrity
 * 
 * @module branch-system/validations/branch-students
 */

import { z } from 'zod';
import type { EnrollmentStatus, PaymentStatus } from '../types/branch-students.types';

// ============================================================
// VALIDATION LIMITS & CONSTRAINTS
// ============================================================

/**
 * Validation limits matching database constraints
 */
export const BRANCH_STUDENT_LIMITS = {
    // Text fields
    CONTACT_NAME_MIN: 2,
    CONTACT_NAME_MAX: 200,
    GRADE_MAX: 50,
    NOTES_MAX: 5000,
    BATCH_NAME_MAX: 100,
    SPECIAL_REQUIREMENTS_MAX: 2000,

    // Numeric fields
    ATTENDANCE_MIN: 0.0,
    ATTENDANCE_MAX: 100.0,
    FEES_MIN: 0.0,
    FEES_MAX: 9999999.99,

    // Date constraints
    MIN_YEAR: 2000,
    MAX_YEARS_AHEAD: 10,
} as const;

/**
 * Regular expressions for validation
 */
const VALIDATION_REGEX = {
    // E.164 international phone format (with optional +)
    PHONE: /^\+?[1-9]\d{1,14}$/,
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
 * Enrollment status enum schema
 */
export const enrollmentStatusSchema = z.enum(
    ['ENROLLED', 'PENDING', 'SUSPENDED', 'DROPPED', 'COMPLETED'],
    { errorMap: () => ({ message: 'Invalid enrollment status' }) }
) as z.ZodType<EnrollmentStatus>;

/**
 * Payment status enum schema
 */
export const paymentStatusSchema = z.enum(
    ['PAID', 'PARTIAL', 'PENDING', 'OVERDUE'],
    { errorMap: () => ({ message: 'Invalid payment status' }) }
) as z.ZodType<PaymentStatus>;

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
            return year >= BRANCH_STUDENT_LIMITS.MIN_YEAR;
        },
        `Date must be after ${BRANCH_STUDENT_LIMITS.MIN_YEAR}`
    )
    .refine(
        (date) => {
            const maxDate = new Date();
            maxDate.setFullYear(maxDate.getFullYear() + BRANCH_STUDENT_LIMITS.MAX_YEARS_AHEAD);
            return new Date(date) <= maxDate;
        },
        `Date cannot be more than ${BRANCH_STUDENT_LIMITS.MAX_YEARS_AHEAD} years in the future`
    );

/**
 * Contact name validation
 */
export const contactNameSchema = z
    .string()
    .min(BRANCH_STUDENT_LIMITS.CONTACT_NAME_MIN, `Name must be at least ${BRANCH_STUDENT_LIMITS.CONTACT_NAME_MIN} characters`)
    .max(BRANCH_STUDENT_LIMITS.CONTACT_NAME_MAX, `Name must not exceed ${BRANCH_STUDENT_LIMITS.CONTACT_NAME_MAX} characters`)
    .refine(
        (name) => name.trim().length >= BRANCH_STUDENT_LIMITS.CONTACT_NAME_MIN,
        'Name cannot be only whitespace'
    )
    .refine(
        (name) => !/^\d+$/.test(name.trim()),
        'Name cannot be only numbers'
    )
    .refine(
        (name) => /^[a-zA-Z\s.'-]+$/.test(name.trim()),
        'Name can only contain letters, spaces, dots, hyphens, and apostrophes'
    )
    .optional()
    .nullable();

/**
 * Phone number validation (E.164 format)
 */
export const phoneSchema = z
    .string()
    .regex(VALIDATION_REGEX.PHONE, 'Invalid phone number format (use E.164 format: +[country code][number])')
    .min(10, 'Phone number must be at least 10 digits')
    .max(16, 'Phone number must not exceed 16 characters')
    .refine(
        (phone) => {
            // Additional check: ensure it has enough digits
            const digits = phone.replace(/\D/g, '');
            return digits.length >= 10 && digits.length <= 15;
        },
        'Phone number must contain 10-15 digits'
    )
    .optional()
    .nullable();

/**
 * Attendance percentage validation
 */
export const attendancePercentageSchema = z
    .number()
    .min(BRANCH_STUDENT_LIMITS.ATTENDANCE_MIN, `Attendance cannot be less than ${BRANCH_STUDENT_LIMITS.ATTENDANCE_MIN}%`)
    .max(BRANCH_STUDENT_LIMITS.ATTENDANCE_MAX, `Attendance cannot exceed ${BRANCH_STUDENT_LIMITS.ATTENDANCE_MAX}%`)
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
 * Fees amount validation
 */
export const feesAmountSchema = z
    .number()
    .min(BRANCH_STUDENT_LIMITS.FEES_MIN, `Amount cannot be negative`)
    .max(BRANCH_STUDENT_LIMITS.FEES_MAX, `Amount exceeds maximum allowed`)
    .refine(
        (val) => Number.isFinite(val),
        'Amount must be a valid number'
    )
    .refine(
        (val) => {
            // Check decimal places (max 2)
            const str = val.toString();
            const decimalIndex = str.indexOf('.');
            if (decimalIndex === -1) return true;
            return str.length - decimalIndex - 1 <= 2;
        },
        'Amount can have maximum 2 decimal places'
    );

/**
 * Grade validation
 */
export const gradeSchema = z
    .string()
    .max(BRANCH_STUDENT_LIMITS.GRADE_MAX, `Grade must not exceed ${BRANCH_STUDENT_LIMITS.GRADE_MAX} characters`)
    .optional()
    .nullable();

/**
 * Performance notes validation
 */
export const performanceNotesSchema = z
    .string()
    .max(BRANCH_STUDENT_LIMITS.NOTES_MAX, `Notes must not exceed ${BRANCH_STUDENT_LIMITS.NOTES_MAX} characters`)
    .optional()
    .nullable();

/**
 * Student notes validation
 */
export const studentNotesSchema = z
    .string()
    .max(BRANCH_STUDENT_LIMITS.NOTES_MAX, `Notes must not exceed ${BRANCH_STUDENT_LIMITS.NOTES_MAX} characters`)
    .optional()
    .nullable();

/**
 * Batch name validation
 */
export const batchNameSchema = z
    .string()
    .max(BRANCH_STUDENT_LIMITS.BATCH_NAME_MAX, `Batch name must not exceed ${BRANCH_STUDENT_LIMITS.BATCH_NAME_MAX} characters`)
    .optional()
    .nullable();

/**
 * Special requirements validation
 */
export const specialRequirementsSchema = z
    .string()
    .max(BRANCH_STUDENT_LIMITS.SPECIAL_REQUIREMENTS_MAX, `Requirements must not exceed ${BRANCH_STUDENT_LIMITS.SPECIAL_REQUIREMENTS_MAX} characters`)
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
 * Enroll Student Schema
 * Validates input when enrolling a new student
 */
export const enrollStudentSchema = z
    .object({
        // Required fields
        student_id: uuidSchema,
        branch_id: uuidSchema,

        // Optional fields
        class_id: uuidSchema.optional().nullable(),
        enrollment_date: dateSchema.optional(),
        expected_completion_date: dateSchema.optional().nullable(),

        // Contact information
        emergency_contact_name: contactNameSchema,
        emergency_contact_phone: phoneSchema,
        parent_guardian_name: contactNameSchema,
        parent_guardian_phone: phoneSchema,

        // Preferences
        preferred_batch: batchNameSchema,
        special_requirements: specialRequirementsSchema,
        student_notes: studentNotesSchema,

        // Metadata
        metadata: metadataSchema,
    })
    .refine(
        (data) => {
            // If emergency contact name is provided, phone should also be provided
            if (data.emergency_contact_name && !data.emergency_contact_phone) {
                return false;
            }
            return true;
        },
        {
            message: 'Emergency contact phone is required when emergency contact name is provided',
            path: ['emergency_contact_phone'],
        }
    )
    .refine(
        (data) => {
            // If parent/guardian name is provided, phone should also be provided
            if (data.parent_guardian_name && !data.parent_guardian_phone) {
                return false;
            }
            return true;
        },
        {
            message: 'Parent/guardian phone is required when parent/guardian name is provided',
            path: ['parent_guardian_phone'],
        }
    )
    .refine(
        (data) => {
            // Enrollment date should not be in the future (beyond today)
            if (data.enrollment_date) {
                const enrollDate = new Date(data.enrollment_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
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
 * Update Student Self Schema
 * Students can only update their contact info and preferences
 */
export const updateStudentSelfSchema = z
    .object({
        emergency_contact_name: contactNameSchema,
        emergency_contact_phone: phoneSchema,
        parent_guardian_name: contactNameSchema,
        parent_guardian_phone: phoneSchema,
        preferred_batch: batchNameSchema,
        special_requirements: specialRequirementsSchema,
        student_notes: studentNotesSchema,
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
            // If emergency contact name is provided, phone should also be provided
            if (data.emergency_contact_name && !data.emergency_contact_phone) {
                return false;
            }
            return true;
        },
        {
            message: 'Emergency contact phone is required when emergency contact name is provided',
            path: ['emergency_contact_phone'],
        }
    )
    .refine(
        (data) => {
            // If parent/guardian name is provided, phone should also be provided
            if (data.parent_guardian_name && !data.parent_guardian_phone) {
                return false;
            }
            return true;
        },
        {
            message: 'Parent/guardian phone is required when parent/guardian name is provided',
            path: ['parent_guardian_phone'],
        }
    );

/**
 * Update Student By Teacher Schema
 * Teachers can only update academic fields
 */
export const updateStudentByTeacherSchema = z
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
 * Update Student By Manager Schema
 * Branch managers can update most fields
 */
export const updateStudentByManagerSchema = z
    .object({
        class_id: uuidSchema.optional().nullable(),
        expected_completion_date: dateSchema.optional().nullable(),
        actual_completion_date: dateSchema.optional().nullable(),
        enrollment_status: enrollmentStatusSchema.optional(),
        payment_status: paymentStatusSchema.optional(),
        attendance_percentage: attendancePercentageSchema.optional(),
        current_grade: gradeSchema,
        performance_notes: performanceNotesSchema,
        total_fees_due: feesAmountSchema.optional(),
        total_fees_paid: feesAmountSchema.optional(),
        last_payment_date: dateSchema.optional().nullable(),
        next_payment_due: dateSchema.optional().nullable(),
        emergency_contact_name: contactNameSchema,
        emergency_contact_phone: phoneSchema,
        parent_guardian_name: contactNameSchema,
        parent_guardian_phone: phoneSchema,
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
            // Total fees paid cannot exceed total fees due
            if (data.total_fees_paid !== undefined && data.total_fees_due !== undefined) {
                return data.total_fees_paid <= data.total_fees_due;
            }
            return true;
        },
        {
            message: 'Total fees paid cannot exceed total fees due',
            path: ['total_fees_paid'],
        }
    )
    .refine(
        (data) => {
            // Actual completion date should be after expected completion date (if both provided)
            if (data.expected_completion_date && data.actual_completion_date) {
                return new Date(data.actual_completion_date) >= new Date(data.expected_completion_date);
            }
            return true;
        },
        {
            message: 'Actual completion date should be on or after expected completion date',
            path: ['actual_completion_date'],
        }
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
 * Branch Student Filter Schema
 * Validates filter parameters for searching/listing students
 */
export const branchStudentFilterSchema = z.object({
    student_id: uuidSchema.optional(),
    branch_id: uuidSchema.optional(),
    class_id: uuidSchema.optional(),
    enrollment_status: z.union([enrollmentStatusSchema, z.array(enrollmentStatusSchema)]).optional(),
    payment_status: z.union([paymentStatusSchema, z.array(paymentStatusSchema)]).optional(),
    enrollment_date_from: dateSchema.optional(),
    enrollment_date_to: dateSchema.optional(),
    has_overdue_payment: z.boolean().optional(),
    attendance_min: attendancePercentageSchema.optional(),
    attendance_max: attendancePercentageSchema.optional(),
    search_query: z.string().max(200).optional(),
});

/**
 * Branch Student Sort Schema
 * Validates sort parameters
 */
export const branchStudentSortSchema = z.object({
    field: z.enum([
        'enrollment_date',
        'enrollment_status',
        'payment_status',
        'attendance_percentage',
        'total_fees_due',
        'total_fees_paid',
        'next_payment_due',
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
 * Enrollment ID Schema
 * Validates an enrollment ID parameter
 */
export const enrollmentIdSchema = z.object({
    enrollment_id: uuidSchema,
});

// ============================================================
// TYPE EXPORTS - Inferred types from schemas
// ============================================================

export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;
export type UpdateStudentSelfInput = z.infer<typeof updateStudentSelfSchema>;
export type UpdateStudentByTeacherInput = z.infer<typeof updateStudentByTeacherSchema>;
export type UpdateStudentByManagerInput = z.infer<typeof updateStudentByManagerSchema>;
export type BranchStudentFilter = z.infer<typeof branchStudentFilterSchema>;
export type BranchStudentSort = z.infer<typeof branchStudentSortSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

// ============================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================

/**
 * Validates enroll student input and returns typed result
 */
export function validateEnrollStudent(input: unknown) {
    return enrollStudentSchema.safeParse(input);
}

/**
 * Validates student self-update input and returns typed result
 */
export function validateUpdateStudentSelf(input: unknown) {
    return updateStudentSelfSchema.safeParse(input);
}

/**
 * Validates teacher update input and returns typed result
 */
export function validateUpdateStudentByTeacher(input: unknown) {
    return updateStudentByTeacherSchema.safeParse(input);
}

/**
 * Validates manager update input and returns typed result
 */
export function validateUpdateStudentByManager(input: unknown) {
    return updateStudentByManagerSchema.safeParse(input);
}

/**
 * Validates filter parameters and returns typed result
 */
export function validateBranchStudentFilter(input: unknown) {
    return branchStudentFilterSchema.safeParse(input);
}

/**
 * Validates sort parameters and returns typed result
 */
export function validateBranchStudentSort(input: unknown) {
    return branchStudentSortSchema.safeParse(input);
}

/**
 * Validates pagination parameters and returns typed result
 */
export function validatePagination(input: unknown) {
    return paginationSchema.safeParse(input);
}

/**
 * Validates enrollment ID and returns typed result
 */
export function validateEnrollmentId(input: unknown) {
    return enrollmentIdSchema.safeParse(input);
}
