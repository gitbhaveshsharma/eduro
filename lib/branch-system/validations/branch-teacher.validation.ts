/**
 * Branch Teacher Validation Schemas
 * 
 * Comprehensive Zod validation schemas for branch teacher assignment operations
 * Enforces business rules and data integrity
 * 
 * @module branch-system/validations/branch-teacher
 */

import { z } from 'zod';
import type { DayOfWeek, ExperienceLevel } from '../types/branch-teacher.types';

// ============================================================
// VALIDATION LIMITS & CONSTRAINTS
// ============================================================

/**
 * Validation limits matching database constraints
 */
export const BRANCH_TEACHER_LIMITS = {
    // Text fields
    TEACHER_NAME_MIN: 2,
    TEACHER_NAME_MAX: 200,
    SUBJECT_MIN: 1,
    SUBJECT_MAX: 100,
    NOTES_MAX: 5000,

    // Numeric fields
    EXPERIENCE_MIN: 0,
    EXPERIENCE_MAX: 60,
    HOURLY_RATE_MIN: 0,
    HOURLY_RATE_MAX: 99999.99,
    MAX_SUBJECTS: 20,

    // Date constraints
    MIN_YEAR: 2000,
    MAX_YEARS_AHEAD: 10,
} as const;

/**
 * Regular expressions for validation
 */
const VALIDATION_REGEX = {
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    TIME_24H: /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, // HH:MM or HH:MM:SS
    PHONE: /^\+?[1-9]\d{1,14}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
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
 * Day of week enum schema
 */
export const dayOfWeekSchema = z.enum(
    ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    { errorMap: () => ({ message: 'Invalid day of week' }) }
) as z.ZodType<DayOfWeek>;

/**
 * Experience level enum schema
 */
export const experienceLevelSchema = z.enum(
    ['entry', 'intermediate', 'senior', 'expert'],
    { errorMap: () => ({ message: 'Invalid experience level' }) }
) as z.ZodType<ExperienceLevel>;

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
            return year >= BRANCH_TEACHER_LIMITS.MIN_YEAR;
        },
        `Date must be after ${BRANCH_TEACHER_LIMITS.MIN_YEAR}`
    )
    .refine(
        (date) => {
            const maxDate = new Date();
            maxDate.setFullYear(maxDate.getFullYear() + BRANCH_TEACHER_LIMITS.MAX_YEARS_AHEAD);
            return new Date(date) <= maxDate;
        },
        `Date cannot be more than ${BRANCH_TEACHER_LIMITS.MAX_YEARS_AHEAD} years in the future`
    );

/**
 * Time validation (24-hour format HH:MM or HH:MM:SS)
 */
export const timeSchema = z
    .string()
    .refine(
        (time) => VALIDATION_REGEX.TIME_24H.test(time),
        'Invalid time format (use HH:MM or HH:MM:SS)'
    );

/**
 * Subject name validation
 */
export const subjectNameSchema = z
    .string()
    .min(BRANCH_TEACHER_LIMITS.SUBJECT_MIN, `Subject must be at least ${BRANCH_TEACHER_LIMITS.SUBJECT_MIN} character`)
    .max(BRANCH_TEACHER_LIMITS.SUBJECT_MAX, `Subject must not exceed ${BRANCH_TEACHER_LIMITS.SUBJECT_MAX} characters`)
    .refine(
        (subject) => subject.trim().length >= BRANCH_TEACHER_LIMITS.SUBJECT_MIN,
        'Subject cannot be only whitespace'
    );

/**
 * Teaching subjects array validation
 */
export const teachingSubjectsSchema = z
    .array(subjectNameSchema)
    .min(1, 'At least one teaching subject is required')
    .max(BRANCH_TEACHER_LIMITS.MAX_SUBJECTS, `Cannot have more than ${BRANCH_TEACHER_LIMITS.MAX_SUBJECTS} subjects`)
    .refine(
        (subjects) => new Set(subjects.map(s => s.toLowerCase().trim())).size === subjects.length,
        'Duplicate subjects are not allowed'
    );

/**
 * Available days array validation
 */
export const availableDaysSchema = z
    .array(dayOfWeekSchema)
    .min(1, 'At least one available day is required')
    .max(7, 'Cannot have more than 7 days')
    .refine(
        (days) => new Set(days).size === days.length,
        'Duplicate days are not allowed'
    )
    .optional()
    .nullable();

/**
 * Experience years validation
 */
export const experienceYearsSchema = z
    .number()
    .int('Experience must be a whole number')
    .min(BRANCH_TEACHER_LIMITS.EXPERIENCE_MIN, `Experience cannot be less than ${BRANCH_TEACHER_LIMITS.EXPERIENCE_MIN}`)
    .max(BRANCH_TEACHER_LIMITS.EXPERIENCE_MAX, `Experience cannot exceed ${BRANCH_TEACHER_LIMITS.EXPERIENCE_MAX} years`)
    .optional()
    .nullable();

/**
 * Hourly rate validation
 */
export const hourlyRateSchema = z
    .number()
    .min(BRANCH_TEACHER_LIMITS.HOURLY_RATE_MIN, 'Hourly rate cannot be negative')
    .max(BRANCH_TEACHER_LIMITS.HOURLY_RATE_MAX, `Hourly rate exceeds maximum allowed`)
    .refine(
        (val) => Number.isFinite(val),
        'Hourly rate must be a valid number'
    )
    .refine(
        (val) => {
            // Check decimal places (max 2)
            const str = val.toString();
            const decimalIndex = str.indexOf('.');
            if (decimalIndex === -1) return true;
            return str.length - decimalIndex - 1 <= 2;
        },
        'Hourly rate can have maximum 2 decimal places'
    )
    .optional()
    .nullable();

/**
 * Notes validation (assignment notes, performance notes)
 */
export const notesSchema = z
    .string()
    .max(BRANCH_TEACHER_LIMITS.NOTES_MAX, `Notes must not exceed ${BRANCH_TEACHER_LIMITS.NOTES_MAX} characters`)
    .optional()
    .nullable();

/**
 * Metadata validation (flexible JSON object)
 */
export const metadataSchema = z
    .record(z.unknown())
    .optional()
    .nullable();

// ============================================================
// MAIN VALIDATION SCHEMAS
// ============================================================

/**
 * Assign Teacher Schema
 * Validates input when assigning a teacher to a branch
 */
export const assignTeacherSchema = z
    .object({
        // Required fields
        teacher_id: uuidSchema,
        branch_id: uuidSchema,
        teaching_subjects: teachingSubjectsSchema,

        // Optional fields
        assignment_date: dateSchema.optional(),
        assignment_end_date: dateSchema.optional().nullable(),
        teaching_experience_years: experienceYearsSchema,
        hourly_rate: hourlyRateSchema,
        available_days: availableDaysSchema,
        available_start_time: timeSchema.optional().nullable(),
        available_end_time: timeSchema.optional().nullable(),
        assignment_notes: notesSchema,

        // Metadata
        metadata: metadataSchema,
    })
    .refine(
        (data) => {
            // Assignment date should not be in the future (beyond today)
            if (data.assignment_date) {
                const assignDate = new Date(data.assignment_date);
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                return assignDate <= today;
            }
            return true;
        },
        {
            message: 'Assignment date cannot be in the future',
            path: ['assignment_date'],
        }
    )
    .refine(
        (data) => {
            // Assignment end date should be after assignment date
            if (data.assignment_date && data.assignment_end_date) {
                return new Date(data.assignment_end_date) > new Date(data.assignment_date);
            }
            return true;
        },
        {
            message: 'Assignment end date must be after assignment date',
            path: ['assignment_end_date'],
        }
    )
    .refine(
        (data) => {
            // If start time is provided, end time should also be provided
            if (data.available_start_time && !data.available_end_time) {
                return false;
            }
            return true;
        },
        {
            message: 'End time is required when start time is provided',
            path: ['available_end_time'],
        }
    )
    .refine(
        (data) => {
            // If end time is provided, start time should also be provided
            if (data.available_end_time && !data.available_start_time) {
                return false;
            }
            return true;
        },
        {
            message: 'Start time is required when end time is provided',
            path: ['available_start_time'],
        }
    )
    .refine(
        (data) => {
            // Start time should be before end time
            if (data.available_start_time && data.available_end_time) {
                return data.available_start_time < data.available_end_time;
            }
            return true;
        },
        {
            message: 'Start time must be before end time',
            path: ['available_start_time'],
        }
    );

/**
 * Update Teacher Self Schema
 * Teachers can only update their availability and teaching details
 */
export const updateTeacherSelfSchema = z
    .object({
        teaching_subjects: teachingSubjectsSchema.optional(),
        teaching_experience_years: experienceYearsSchema,
        available_days: availableDaysSchema,
        available_start_time: timeSchema.optional().nullable(),
        available_end_time: timeSchema.optional().nullable(),
        hourly_rate: hourlyRateSchema,
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
            // If start time is provided, end time should also be provided
            if (data.available_start_time && !data.available_end_time) {
                return false;
            }
            return true;
        },
        {
            message: 'End time is required when start time is provided',
            path: ['available_end_time'],
        }
    )
    .refine(
        (data) => {
            // If end time is provided, start time should also be provided
            if (data.available_end_time && !data.available_start_time) {
                return false;
            }
            return true;
        },
        {
            message: 'Start time is required when end time is provided',
            path: ['available_start_time'],
        }
    )
    .refine(
        (data) => {
            // Start time should be before end time
            if (data.available_start_time && data.available_end_time) {
                return data.available_start_time < data.available_end_time;
            }
            return true;
        },
        {
            message: 'Start time must be before end time',
            path: ['available_start_time'],
        }
    );

/**
 * Update Teacher By Manager Schema
 * Managers can update most fields
 */
export const updateTeacherByManagerSchema = z
    .object({
        teaching_subjects: teachingSubjectsSchema.optional(),
        teaching_experience_years: experienceYearsSchema,
        hourly_rate: hourlyRateSchema,
        available_days: availableDaysSchema,
        available_start_time: timeSchema.optional().nullable(),
        available_end_time: timeSchema.optional().nullable(),
        assignment_end_date: dateSchema.optional().nullable(),
        is_active: z.boolean().optional(),
        assignment_notes: notesSchema,
        performance_notes: notesSchema,
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
            // If start time is provided, end time should also be provided
            if (data.available_start_time && !data.available_end_time) {
                return false;
            }
            return true;
        },
        {
            message: 'End time is required when start time is provided',
            path: ['available_end_time'],
        }
    )
    .refine(
        (data) => {
            // If end time is provided, start time should also be provided
            if (data.available_end_time && !data.available_start_time) {
                return false;
            }
            return true;
        },
        {
            message: 'Start time is required when end time is provided',
            path: ['available_start_time'],
        }
    )
    .refine(
        (data) => {
            // Start time should be before end time
            if (data.available_start_time && data.available_end_time) {
                return data.available_start_time < data.available_end_time;
            }
            return true;
        },
        {
            message: 'Start time must be before end time',
            path: ['available_start_time'],
        }
    );

/**
 * Branch Teacher Filter Schema
 * Validates filter parameters for searching/listing teachers
 */
export const branchTeacherFilterSchema = z.object({
    teacher_id: uuidSchema.optional(),
    branch_id: uuidSchema.optional(),
    is_active: z.boolean().optional(),
    teaching_subjects: z.array(subjectNameSchema).optional(),
    available_day: dayOfWeekSchema.optional(),
    assignment_date_from: dateSchema.optional(),
    assignment_date_to: dateSchema.optional(),
    experience_min: experienceYearsSchema,
    experience_max: experienceYearsSchema,
    search_query: z.string().max(200).optional(),
});

/**
 * Branch Teacher Sort Schema
 * Validates sort parameters
 */
export const branchTeacherSortSchema = z.object({
    field: z.enum([
        'teacher_name',
        'assignment_date',
        'teaching_experience_years',
        'hourly_rate',
        'is_active',
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
 * Assignment ID Schema
 * Validates an assignment ID parameter
 */
export const assignmentIdSchema = z.object({
    assignment_id: uuidSchema,
});

// ============================================================
// TYPE EXPORTS - Inferred types from schemas
// ============================================================

export type AssignTeacherInput = z.infer<typeof assignTeacherSchema>;
export type UpdateTeacherSelfInput = z.infer<typeof updateTeacherSelfSchema>;
export type UpdateTeacherByManagerInput = z.infer<typeof updateTeacherByManagerSchema>;
export type BranchTeacherFilter = z.infer<typeof branchTeacherFilterSchema>;
export type BranchTeacherSortInput = z.infer<typeof branchTeacherSortSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

// ============================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================

/**
 * Validates assign teacher input and returns typed result
 */
export function validateAssignTeacher(input: unknown) {
    return assignTeacherSchema.safeParse(input);
}

/**
 * Validates teacher self-update input and returns typed result
 */
export function validateUpdateTeacherSelf(input: unknown) {
    return updateTeacherSelfSchema.safeParse(input);
}

/**
 * Validates manager update input and returns typed result
 */
export function validateUpdateTeacherByManager(input: unknown) {
    return updateTeacherByManagerSchema.safeParse(input);
}

/**
 * Validates filter parameters and returns typed result
 */
export function validateBranchTeacherFilter(input: unknown) {
    return branchTeacherFilterSchema.safeParse(input);
}

/**
 * Validates sort parameters and returns typed result
 */
export function validateBranchTeacherSort(input: unknown) {
    return branchTeacherSortSchema.safeParse(input);
}

/**
 * Validates pagination parameters and returns typed result
 */
export function validatePagination(input: unknown) {
    return paginationSchema.safeParse(input);
}

/**
 * Validates assignment ID and returns typed result
 */
export function validateAssignmentId(input: unknown) {
    return assignmentIdSchema.safeParse(input);
}
