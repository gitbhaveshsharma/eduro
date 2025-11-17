/**
 * Branch Classes Validation Schemas
 * 
 * Comprehensive Zod validation schemas for branch class operations
 * Enforces business rules and data integrity
 * 
 * @module branch-system/validations/branch-classes
 */

import { z } from 'zod';
import type { ClassStatus, FeeFrequency, DayOfWeek } from '../types/branch-classes.types';

// ============================================================
// VALIDATION LIMITS & CONSTRAINTS
// ============================================================

/**
 * Validation limits matching database constraints
 */
export const BRANCH_CLASS_LIMITS = {
    // Text fields
    CLASS_NAME_MIN: 3,
    CLASS_NAME_MAX: 200,
    SUBJECT_MIN: 2,
    SUBJECT_MAX: 100,
    DESCRIPTION_MAX: 2000,
    GRADE_LEVEL_MIN: 2,
    GRADE_LEVEL_MAX: 50,
    BATCH_NAME_MAX: 100,

    // Array fields
    CLASS_DAYS_MIN: 1,
    CLASS_DAYS_MAX: 7,
    PREREQUISITES_MAX: 20,
    MATERIALS_MAX: 50,
    ITEM_LENGTH_MAX: 200,

    // Numeric fields
    MAX_STUDENTS_MIN: 1,
    MAX_STUDENTS_MAX: 500,

    // Date constraints
    MIN_YEAR: 2000,
    MAX_YEARS_AHEAD: 10,
} as const;

/**
 * Regular expressions for validation
 */
const VALIDATION_REGEX = {
    // Accepts both 24-hour (HH:MM) and 12-hour (hh:MM AM/PM) formats
    TIME: /^(([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?|([0-1]?[0-9]:[0-5][0-9]\s?(AM|PM|am|pm)))$/i,
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
 * Class status enum schema
 */
export const classStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'FULL', 'COMPLETED'], {
    errorMap: () => ({ message: 'Invalid class status' }),
}) as z.ZodType<ClassStatus>;

/**
 * Fee frequency enum schema
 */
export const feeFrequencySchema = z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY'], {
    errorMap: () => ({ message: 'Invalid fee frequency' }),
}) as z.ZodType<FeeFrequency>;

/**
 * Day of week enum schema
 */
export const dayOfWeekSchema = z.enum(
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    { errorMap: () => ({ message: 'Invalid day of week' }) }
) as z.ZodType<DayOfWeek>;

/**
 * Class name validation
 */
export const classNameSchema = z
    .string()
    .min(BRANCH_CLASS_LIMITS.CLASS_NAME_MIN, `Class name must be at least ${BRANCH_CLASS_LIMITS.CLASS_NAME_MIN} characters`)
    .max(BRANCH_CLASS_LIMITS.CLASS_NAME_MAX, `Class name must not exceed ${BRANCH_CLASS_LIMITS.CLASS_NAME_MAX} characters`)
    .refine(
        (name) => name.trim().length >= BRANCH_CLASS_LIMITS.CLASS_NAME_MIN,
        'Class name cannot be only whitespace'
    )
    .refine(
        (name) => !/^\d+$/.test(name.trim()),
        'Class name cannot be only numbers'
    );

/**
 * Subject validation
 */
export const subjectSchema = z
    .string()
    .min(BRANCH_CLASS_LIMITS.SUBJECT_MIN, `Subject must be at least ${BRANCH_CLASS_LIMITS.SUBJECT_MIN} characters`)
    .max(BRANCH_CLASS_LIMITS.SUBJECT_MAX, `Subject must not exceed ${BRANCH_CLASS_LIMITS.SUBJECT_MAX} characters`)
    .refine(
        (subject) => subject.trim().length >= BRANCH_CLASS_LIMITS.SUBJECT_MIN,
        'Subject cannot be only whitespace'
    );

/**
 * Description validation
 */
export const descriptionSchema = z
    .string()
    .max(BRANCH_CLASS_LIMITS.DESCRIPTION_MAX, `Description must not exceed ${BRANCH_CLASS_LIMITS.DESCRIPTION_MAX} characters`)
    .optional()
    .nullable();

/**
 * Grade level validation
 */
export const gradeLevelSchema = z
    .string()
    .min(BRANCH_CLASS_LIMITS.GRADE_LEVEL_MIN, `Grade level must be at least ${BRANCH_CLASS_LIMITS.GRADE_LEVEL_MIN} characters`)
    .max(BRANCH_CLASS_LIMITS.GRADE_LEVEL_MAX, `Grade level must not exceed ${BRANCH_CLASS_LIMITS.GRADE_LEVEL_MAX} characters`)
    .refine(
        (level) => level.trim().length >= BRANCH_CLASS_LIMITS.GRADE_LEVEL_MIN,
        'Grade level cannot be only whitespace'
    );

/**
 * Batch name validation
 */
export const batchNameSchema = z
    .string()
    .max(BRANCH_CLASS_LIMITS.BATCH_NAME_MAX, `Batch name must not exceed ${BRANCH_CLASS_LIMITS.BATCH_NAME_MAX} characters`)
    .optional()
    .nullable();

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
            return year >= BRANCH_CLASS_LIMITS.MIN_YEAR;
        },
        `Date must be after ${BRANCH_CLASS_LIMITS.MIN_YEAR}`
    )
    .refine(
        (date) => {
            const maxDate = new Date();
            maxDate.setFullYear(maxDate.getFullYear() + BRANCH_CLASS_LIMITS.MAX_YEARS_AHEAD);
            return new Date(date) <= maxDate;
        },
        `Date cannot be more than ${BRANCH_CLASS_LIMITS.MAX_YEARS_AHEAD} years in the future`
    );

/**
 * Time validation (HH:MM or hh:MM AM/PM format)
 */
export const timeSchema = z
    .string()
    .regex(VALIDATION_REGEX.TIME, 'Invalid time format (expected HH:MM or HH:MM AM/PM)')
    .refine(
        (time) => {
            // Convert to 24-hour format for validation
            const time24 = convertTo24Hour(time);
            const [hours, minutes] = time24.split(':').map(Number);
            return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
        },
        'Invalid time values'
    );

/**
 * Helper function to convert 12-hour format to 24-hour format
 */
function convertTo24Hour(timeStr: string): string {
    timeStr = timeStr.trim().toUpperCase();

    // If already in 24-hour format, return as is
    if (!timeStr.includes('AM') && !timeStr.includes('PM')) {
        return timeStr;
    }

    // Handle 12-hour format with AM/PM
    const [time, period] = timeStr.split(/\s+/);
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Class days array validation
 */
export const classDaysSchema = z
    .array(dayOfWeekSchema)
    .min(BRANCH_CLASS_LIMITS.CLASS_DAYS_MIN, `At least ${BRANCH_CLASS_LIMITS.CLASS_DAYS_MIN} class day required`)
    .max(BRANCH_CLASS_LIMITS.CLASS_DAYS_MAX, `Maximum ${BRANCH_CLASS_LIMITS.CLASS_DAYS_MAX} class days allowed`)
    .refine(
        (days) => {
            const uniqueDays = new Set(days);
            return uniqueDays.size === days.length;
        },
        'Duplicate days are not allowed'
    )
    .optional()
    .nullable();

/**
 * Max students validation
 */
export const maxStudentsSchema = z
    .number()
    .int('Maximum students must be an integer')
    .min(BRANCH_CLASS_LIMITS.MAX_STUDENTS_MIN, `Minimum capacity is ${BRANCH_CLASS_LIMITS.MAX_STUDENTS_MIN}`)
    .max(BRANCH_CLASS_LIMITS.MAX_STUDENTS_MAX, `Maximum capacity is ${BRANCH_CLASS_LIMITS.MAX_STUDENTS_MAX}`)
    .default(30);

/**
 * Prerequisites array validation
 */
export const prerequisitesSchema = z
    .array(
        z.string()
            .min(1, 'Prerequisite cannot be empty')
            .max(BRANCH_CLASS_LIMITS.ITEM_LENGTH_MAX, `Prerequisite must not exceed ${BRANCH_CLASS_LIMITS.ITEM_LENGTH_MAX} characters`)
    )
    .max(BRANCH_CLASS_LIMITS.PREREQUISITES_MAX, `Maximum ${BRANCH_CLASS_LIMITS.PREREQUISITES_MAX} prerequisites allowed`)
    .optional()
    .nullable();

/**
 * Materials required array validation
 */
export const materialsRequiredSchema = z
    .array(
        z.string()
            .min(1, 'Material cannot be empty')
            .max(BRANCH_CLASS_LIMITS.ITEM_LENGTH_MAX, `Material must not exceed ${BRANCH_CLASS_LIMITS.ITEM_LENGTH_MAX} characters`)
    )
    .max(BRANCH_CLASS_LIMITS.MATERIALS_MAX, `Maximum ${BRANCH_CLASS_LIMITS.MATERIALS_MAX} materials allowed`)
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
// COMPOSITE VALIDATION SCHEMAS
// ============================================================

/**
 * Date range validation (start_date must be before end_date)
 */
export const dateRangeSchema = z
    .object({
        start_date: dateSchema.optional().nullable(),
        end_date: dateSchema.optional().nullable(),
    })
    .refine(
        (data) => {
            if (!data.start_date || !data.end_date) return true;
            return new Date(data.start_date) <= new Date(data.end_date);
        },
        {
            message: 'Start date must be before or equal to end date',
            path: ['end_date'],
        }
    );

/**
 * Time range validation (start_time must be before end_time)
 */
export const timeRangeSchema = z
    .object({
        start_time: timeSchema.optional().nullable(),
        end_time: timeSchema.optional().nullable(),
    })
    .refine(
        (data) => {
            if (!data.start_time || !data.end_time) return true;

            const convertToMinutes = (timeStr: string): number => {
                const time24 = convertTo24Hour(timeStr);
                const [hours, minutes] = time24.split(':').map(Number);
                return hours * 60 + minutes;
            };

            const startTotalMinutes = convertToMinutes(data.start_time);
            const endTotalMinutes = convertToMinutes(data.end_time);

            return startTotalMinutes < endTotalMinutes;
        },
        {
            message: 'Start time must be before end time',
            path: ['end_time'],
        }
    );;

// ============================================================
// MAIN VALIDATION SCHEMAS
// ============================================================

/**
 * Create Branch Class Schema
 * Validates input when creating a new branch class
 */
export const createBranchClassSchema = z
    .object({
        // Required fields
        branch_id: uuidSchema,
        class_name: classNameSchema,
        subject: subjectSchema,
        grade_level: gradeLevelSchema,

        // Optional fields
        description: descriptionSchema,
        batch_name: batchNameSchema,
        start_date: dateSchema.optional().nullable(),
        end_date: dateSchema.optional().nullable(),
        class_days: classDaysSchema,
        start_time: timeSchema.optional().nullable(),
        end_time: timeSchema.optional().nullable(),
        max_students: maxStudentsSchema,
        fees_frequency: feeFrequencySchema.default('MONTHLY'),
        teacher_id: uuidSchema.optional().nullable(),
        status: classStatusSchema.default('ACTIVE'),
        is_visible: z.boolean().default(true),
        prerequisites: prerequisitesSchema,
        materials_required: materialsRequiredSchema,
        metadata: metadataSchema,
    })
    .refine(
        (data) => {
            if (!data.start_date || !data.end_date) return true;
            return new Date(data.start_date) <= new Date(data.end_date);
        },
        {
            message: 'Start date must be before or equal to end date',
            path: ['end_date'],
        }
    )
    .refine(
        (data) => {
            if (!data.start_time || !data.end_time) return true;

            const [startHours, startMinutes] = convertTo24Hour(data.start_time).split(':').slice(0, 2).map(Number);
            const [endHours, endMinutes] = convertTo24Hour(data.end_time).split(':').slice(0, 2).map(Number);

            const startTotalMinutes = startHours * 60 + startMinutes;
            const endTotalMinutes = endHours * 60 + endMinutes;

            return startTotalMinutes < endTotalMinutes;
        },
        {
            message: 'Start time must be before end time',
            path: ['end_time'],
        }
    );

/**
 * Update Branch Class Schema
 * Validates input when updating an existing branch class
 * All fields are optional for partial updates
 */
export const updateBranchClassSchema = z
    .object({
        class_name: classNameSchema.optional(),
        subject: subjectSchema.optional(),
        description: descriptionSchema,
        grade_level: gradeLevelSchema.optional(),
        batch_name: batchNameSchema,
        start_date: dateSchema.optional().nullable(),
        end_date: dateSchema.optional().nullable(),
        class_days: classDaysSchema,
        start_time: timeSchema.optional().nullable(),
        end_time: timeSchema.optional().nullable(),
        max_students: maxStudentsSchema.optional(),
        fees_frequency: feeFrequencySchema.optional(),
        teacher_id: uuidSchema.optional().nullable(),
        status: classStatusSchema.optional(),
        is_visible: z.boolean().optional(),
        prerequisites: prerequisitesSchema,
        materials_required: materialsRequiredSchema,
        metadata: metadataSchema,
    })
    .refine(
        (data) => {
            if (!data.start_date || !data.end_date) return true;
            return new Date(data.start_date) <= new Date(data.end_date);
        },
        {
            message: 'Start date must be before or equal to end date',
            path: ['end_date'],
        }
    )
    .refine(
        (data) => {
            if (!data.start_time || !data.end_time) return true;

            const [startHours, startMinutes] = convertTo24Hour(data.start_time).split(':').slice(0, 2).map(Number);
            const [endHours, endMinutes] = convertTo24Hour(data.end_time).split(':').slice(0, 2).map(Number);

            const startTotalMinutes = startHours * 60 + startMinutes;
            const endTotalMinutes = endHours * 60 + endMinutes;

            return startTotalMinutes < endTotalMinutes;
        },
        {
            message: 'Start time must be before end time',
            path: ['end_time'],
        }
    )
    .refine(
        (data) => Object.keys(data).length > 0,
        'At least one field must be provided for update'
    );

/**
 * Branch Class Filter Schema
 * Validates filter parameters for searching/listing classes
 */
export const branchClassFilterSchema = z.object({
    branch_id: uuidSchema.optional(),
    teacher_id: uuidSchema.optional(),
    subject: z.string().optional(),
    grade_level: z.string().optional(),
    status: z.union([classStatusSchema, z.array(classStatusSchema)]).optional(),
    is_visible: z.boolean().optional(),
    has_available_seats: z.boolean().optional(),
    start_date_from: dateSchema.optional(),
    start_date_to: dateSchema.optional(),
    class_days: z.array(dayOfWeekSchema).optional(),
    search_query: z.string().max(200).optional(),
});

/**
 * Branch Class Sort Schema
 * Validates sort parameters
 */
export const branchClassSortSchema = z.object({
    field: z.enum([
        'class_name',
        'subject',
        'grade_level',
        'start_date',
        'start_time',
        'current_enrollment',
        'max_students',
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
 * Class ID Schema
 * Validates a class ID parameter
 */
export const classIdSchema = z.object({
    class_id: uuidSchema,
});

// ============================================================
// TYPE EXPORTS - Inferred types from schemas
// ============================================================

export type CreateBranchClassInput = z.infer<typeof createBranchClassSchema>;
export type UpdateBranchClassInput = z.infer<typeof updateBranchClassSchema>;
export type BranchClassFilter = z.infer<typeof branchClassFilterSchema>;
export type BranchClassSort = z.infer<typeof branchClassSortSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

// ============================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================

/**
 * Validates create branch class input and returns typed result
 */
export function validateCreateBranchClass(input: unknown) {
    return createBranchClassSchema.safeParse(input);
}

/**
 * Validates update branch class input and returns typed result
 */
export function validateUpdateBranchClass(input: unknown) {
    return updateBranchClassSchema.safeParse(input);
}

/**
 * Validates filter parameters and returns typed result
 */
export function validateBranchClassFilter(input: unknown) {
    return branchClassFilterSchema.safeParse(input);
}

/**
 * Validates sort parameters and returns typed result
 */
export function validateBranchClassSort(input: unknown) {
    return branchClassSortSchema.safeParse(input);
}

/**
 * Validates pagination parameters and returns typed result
 */
export function validatePagination(input: unknown) {
    return paginationSchema.safeParse(input);
}

/**
 * Validates class ID and returns typed result
 */
export function validateClassId(input: unknown) {
    return classIdSchema.safeParse(input);
}
