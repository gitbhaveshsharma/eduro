/**
 * Zod validation schemas for Assignment System
 * Based on migration: 020_Create assignment and quiz tables.sql
 * 
 * @module branch-system/validations/assignment
 */

import { z } from 'zod';
import {
    AssignmentSubmissionType,
    AssignmentStatus,
    GradingStatus,
    CleanupFrequency,
} from '../types/assignment.types';

// ============================================================
// ENUM SCHEMAS
// ============================================================

export const assignmentSubmissionTypeSchema = z.nativeEnum(AssignmentSubmissionType);
export const assignmentStatusSchema = z.nativeEnum(AssignmentStatus);
export const gradingStatusSchema = z.nativeEnum(GradingStatus);
export const cleanupFrequencySchema = z.nativeEnum(CleanupFrequency);

// ============================================================
// COMMON SCHEMAS
// ============================================================

/**
 * UUID validation
 */
const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Date-time validation (ISO 8601)
 */
const dateTimeSchema = z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Invalid date-time format' }
);

/**
 * Date validation (YYYY-MM-DD)
 */
const dateSchema = z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date must be in YYYY-MM-DD format'
);

/**
 * File extension validation
 */
const fileExtensionSchema = z.string()
    .min(1, 'Extension cannot be empty')
    .max(10, 'Extension too long')
    .regex(/^[a-zA-Z0-9]+$/, 'Extension must be alphanumeric');

/**
 * Allowed file extensions list
 */
const allowedExtensionsSchema = z.array(fileExtensionSchema)
    .max(20, 'Maximum 20 extensions allowed')
    .optional();

// ============================================================
// RUBRIC SCHEMAS
// ============================================================

/**
 * Rubric level schema
 */
const rubricLevelSchema = z.object({
    level: z.string().min(1, 'Level name required').max(50, 'Level name too long'),
    points: z.number().min(0, 'Points must be non-negative'),
    description: z.string().max(500, 'Description too long'),
});

/**
 * Rubric item schema
 */
export const rubricItemSchema = z.object({
    id: uuidSchema,
    criteria: z.string().min(1, 'Criteria required').max(200, 'Criteria too long'),
    description: z.string().max(500, 'Description too long').optional(),
    max_points: z.number().positive('Max points must be positive'),
    levels: z.array(rubricLevelSchema).max(10, 'Maximum 10 levels per item').optional(),
});

/**
 * Rubric scores for grading
 */
export const rubricScoresSchema = z.array(z.object({
    rubric_item_id: uuidSchema,
    points_awarded: z.number().min(0, 'Points must be non-negative'),
    comment: z.string().max(500, 'Comment too long').optional(),
}));

// ============================================================
// ASSIGNMENT SCHEMAS
// ============================================================

/**
 * Create assignment schema
 */
export const createAssignmentSchema = z.object({
    class_id: uuidSchema,
    teacher_id: uuidSchema,
    branch_id: uuidSchema,
    title: z.string()
        .min(1, 'Title is required')
        .max(200, 'Title must be at most 200 characters'),
    description: z.string()
        .max(2000, 'Description must be at most 2000 characters')
        .optional(),
    instructions: z.string()
        .max(10000, 'Instructions must be at most 10000 characters')
        .optional(),
    submission_type: assignmentSubmissionTypeSchema
        .default(AssignmentSubmissionType.FILE),
    max_file_size: z.number()
        .int('File size must be an integer')
        .positive('File size must be positive')
        .max(104857600, 'Maximum file size is 100MB')
        .default(10485760), // 10MB default
    allowed_extensions: allowedExtensionsSchema,
    max_submissions: z.number()
        .int('Submissions count must be an integer')
        .min(1, 'Must allow at least 1 submission')
        .max(10, 'Maximum 10 submissions allowed')
        .default(1),
    allow_late_submission: z.boolean().default(false),
    late_penalty_percentage: z.number()
        .min(0, 'Penalty cannot be negative')
        .max(100, 'Penalty cannot exceed 100%')
        .default(0),
    max_score: z.number()
        .positive('Max score must be positive')
        .max(10000, 'Maximum score is 10000'),
    grading_rubric: z.array(rubricItemSchema).max(20, 'Maximum 20 rubric items').optional(),
    show_rubric_to_students: z.boolean().default(false),
    publish_at: dateTimeSchema.optional(),
    due_date: dateTimeSchema,
    close_date: dateTimeSchema.optional(),
    clean_submissions_after: cleanupFrequencySchema.default(CleanupFrequency.DAYS_90),
    clean_instructions_after: cleanupFrequencySchema.default(CleanupFrequency.DAYS_30),
}).refine((data) => {
    // Validate publish_at <= due_date
    if (data.publish_at && data.due_date) {
        return new Date(data.publish_at) <= new Date(data.due_date);
    }
    return true;
}, {
    message: 'Publish date must be before or equal to due date',
    path: ['publish_at'],
}).refine((data) => {
    // Validate due_date <= close_date
    if (data.close_date && data.due_date) {
        return new Date(data.due_date) <= new Date(data.close_date);
    }
    return true;
}, {
    message: 'Due date must be before or equal to close date',
    path: ['close_date'],
}).refine((data) => {
    // Validate rubric total points matches max_score if rubric provided
    if (data.grading_rubric && data.grading_rubric.length > 0) {
        const totalRubricPoints = data.grading_rubric.reduce(
            (sum, item) => sum + item.max_points,
            0
        );
        return Math.abs(totalRubricPoints - data.max_score) < 0.01; // Allow floating point tolerance
    }
    return true;
}, {
    message: 'Rubric total points must equal max score',
    path: ['grading_rubric'],
});

/**
 * Update assignment schema
 */
export const updateAssignmentSchema = z.object({
    id: uuidSchema,
    title: z.string()
        .min(1, 'Title is required')
        .max(200, 'Title must be at most 200 characters')
        .optional(),
    description: z.string()
        .max(2000, 'Description must be at most 2000 characters')
        .optional(),
    instructions: z.string()
        .max(10000, 'Instructions must be at most 10000 characters')
        .optional(),
    max_file_size: z.number()
        .int()
        .positive()
        .max(104857600)
        .optional(),
    allowed_extensions: allowedExtensionsSchema,
    allow_late_submission: z.boolean().optional(),
    late_penalty_percentage: z.number()
        .min(0)
        .max(100)
        .optional(),
    max_score: z.number()
        .positive()
        .max(10000)
        .optional(),
    grading_rubric: z.array(rubricItemSchema).max(20).optional(),
    show_rubric_to_students: z.boolean().optional(),
    publish_at: dateTimeSchema.optional(),
    due_date: dateTimeSchema.optional(),
    close_date: dateTimeSchema.optional(),
    clean_submissions_after: cleanupFrequencySchema.optional(),
    clean_instructions_after: cleanupFrequencySchema.optional(),
}).refine((data) => {
    if (data.publish_at && data.due_date) {
        return new Date(data.publish_at) <= new Date(data.due_date);
    }
    return true;
}, {
    message: 'Publish date must be before or equal to due date',
    path: ['publish_at'],
}).refine((data) => {
    if (data.close_date && data.due_date) {
        return new Date(data.due_date) <= new Date(data.close_date);
    }
    return true;
}, {
    message: 'Due date must be before or equal to close date',
    path: ['close_date'],
});

/**
 * Publish assignment schema
 */
export const publishAssignmentSchema = z.object({
    id: uuidSchema,
    notify_students: z.boolean().default(false),
});

/**
 * Close assignment schema
 */
export const closeAssignmentSchema = z.object({
    id: uuidSchema,
    reason: z.string().max(500, 'Reason too long').optional(),
});

// ============================================================
// SUBMISSION SCHEMAS
// ============================================================

/**
 * Submit assignment schema (for students)
 */
export const submitAssignmentSchema = z.object({
    assignment_id: uuidSchema,
    student_id: uuidSchema,
    class_id: uuidSchema,
    submission_text: z.string()
        .max(50000, 'Submission text must be at most 50000 characters')
        .optional(),
    submission_file_id: uuidSchema.optional(),
    is_final: z.boolean(),
}).refine((data) => {
    // Either text or file must be provided (or draft can be empty)
    if (data.is_final && !data.submission_text && !data.submission_file_id) {
        return false;
    }
    return true;
}, {
    message: 'Final submission must include either text or file',
    path: ['submission_text'],
}).refine((data) => {
    // Cannot have both text and file
    if (data.submission_text && data.submission_file_id) {
        return false;
    }
    return true;
}, {
    message: 'Cannot submit both text and file - choose one',
    path: ['submission_text'],
});

/**
 * Save draft schema
 */
export const saveDraftSchema = z.object({
    assignment_id: uuidSchema,
    student_id: uuidSchema,
    class_id: uuidSchema,
    submission_text: z.string()
        .max(50000, 'Submission text must be at most 50000 characters')
        .optional(),
    submission_file_id: uuidSchema.optional(),
});

// ============================================================
// GRADING SCHEMAS
// ============================================================

/**
 * Grade submission schema
 */
export const gradeSubmissionSchema = z.object({
    submission_id: uuidSchema,
    graded_by: uuidSchema,
    score: z.number().min(0, 'Score cannot be negative'),
    feedback: z.string()
        .max(5000, 'Feedback must be at most 5000 characters')
        .optional(),
    private_notes: z.string()
        .max(2000, 'Private notes must be at most 2000 characters')
        .optional(),
    rubric_scores: rubricScoresSchema.optional(),
});

/**
 * Update grade schema
 */
export const updateGradeSchema = z.object({
    submission_id: uuidSchema,
    graded_by: uuidSchema,
    score: z.number().min(0).optional(),
    feedback: z.string().max(5000).optional(),
    private_notes: z.string().max(2000).optional(),
});

/**
 * Regrade request schema
 */
export const regradeRequestSchema = z.object({
    submission_id: uuidSchema,
    student_id: uuidSchema,
    reason: z.string()
        .min(10, 'Please provide a detailed reason (at least 10 characters)')
        .max(1000, 'Reason must be at most 1000 characters'),
});

// ============================================================
// FILE UPLOAD SCHEMAS
// ============================================================

/**
 * File context type schema
 */
export const fileContextTypeSchema = z.enum([
    'assignment_instruction',
    'assignment_attachment',
    'submission',
    'quiz_attachment',
]);

/**
 * Upload file schema
 */
export const uploadFileSchema = z.object({
    file_name: z.string()
        .min(1, 'File name is required')
        .max(255, 'File name too long')
        .regex(/^[^<>:"/\\|?*]+$/, 'File name contains invalid characters'),
    file_size: z.number()
        .int()
        .positive('File size must be positive')
        .max(104857600, 'Maximum file size is 100MB'),
    mime_type: z.string().min(1, 'MIME type is required'),
    context_type: fileContextTypeSchema,
    context_id: z.string().min(1, 'Context ID is required'), // Allow 'temp' or UUID
    uploaded_by: uuidSchema,
    is_permanent: z.boolean().default(false),
    file_content: z.string().optional(), // Base64 for small files
});

// ============================================================
// FILTER & LIST SCHEMAS
// ============================================================

/**
 * Assignment filters schema
 */
export const assignmentFiltersSchema = z.object({
    class_id: uuidSchema.optional(),
    teacher_id: uuidSchema.optional(),
    branch_id: uuidSchema.optional(),
    coaching_center_id: uuidSchema.optional(),
    status: assignmentStatusSchema.optional(),
    submission_type: assignmentSubmissionTypeSchema.optional(),
    is_visible: z.boolean().optional(),
    due_date_from: dateSchema.optional(),
    due_date_to: dateSchema.optional(),
    search: z.string().max(100, 'Search term too long').optional(),
}).refine((data) => {
    if (data.due_date_from && data.due_date_to) {
        return new Date(data.due_date_from) <= new Date(data.due_date_to);
    }
    return true;
}, {
    message: 'From date must be before or equal to To date',
    path: ['due_date_to'],
});

/**
 * Assignment list params schema
 */
export const assignmentListParamsSchema = z.object({
    class_id: uuidSchema.optional(),
    teacher_id: uuidSchema.optional(),
    branch_id: uuidSchema.optional(),
    coaching_center_id: uuidSchema.optional(),
    status: assignmentStatusSchema.optional(),
    submission_type: assignmentSubmissionTypeSchema.optional(),
    is_visible: z.boolean().optional(),
    due_date_from: dateSchema.optional(),
    due_date_to: dateSchema.optional(),
    search: z.string().max(100).optional(),
    student_id: uuidSchema.optional(), // For fetching student submissions
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
    sort_by: z.enum(['due_date', 'created_at', 'title']).default('due_date'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
    include_submissions: z.boolean().default(false),
}).refine((data) => {
    if (data.due_date_from && data.due_date_to) {
        return new Date(data.due_date_from) <= new Date(data.due_date_to);
    }
    return true;
}, {
    message: 'From date must be before or equal to To date',
    path: ['due_date_to'],
});

/**
 * Submission filters schema
 */
export const submissionFiltersSchema = z.object({
    assignment_id: uuidSchema.optional(),
    student_id: uuidSchema.optional(),
    class_id: uuidSchema.optional(),
    grading_status: gradingStatusSchema.optional(),
    is_late: z.boolean().optional(),
    is_final: z.boolean().optional(),
});

/**
 * Submission list params schema
 */
export const submissionListParamsSchema = z.object({
    assignment_id: uuidSchema.optional(),
    student_id: uuidSchema.optional(),
    class_id: uuidSchema.optional(),
    grading_status: gradingStatusSchema.optional(),
    is_late: z.boolean().optional(),
    is_final: z.boolean().optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
    sort_by: z.enum(['submitted_at', 'score', 'student_name']).default('submitted_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================
// EXPORT TYPES FROM SCHEMAS
// ============================================================

export type CreateAssignmentSchema = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentSchema = z.infer<typeof updateAssignmentSchema>;
export type PublishAssignmentSchema = z.infer<typeof publishAssignmentSchema>;
export type CloseAssignmentSchema = z.infer<typeof closeAssignmentSchema>;
export type SubmitAssignmentSchema = z.infer<typeof submitAssignmentSchema>;
export type SaveDraftSchema = z.infer<typeof saveDraftSchema>;
export type GradeSubmissionSchema = z.infer<typeof gradeSubmissionSchema>;
export type UpdateGradeSchema = z.infer<typeof updateGradeSchema>;
export type RegradeRequestSchema = z.infer<typeof regradeRequestSchema>;
export type UploadFileSchema = z.infer<typeof uploadFileSchema>;
export type AssignmentFiltersSchema = z.infer<typeof assignmentFiltersSchema>;
export type AssignmentListParamsSchema = z.infer<typeof assignmentListParamsSchema>;
export type SubmissionFiltersSchema = z.infer<typeof submissionFiltersSchema>;
export type SubmissionListParamsSchema = z.infer<typeof submissionListParamsSchema>;
export type RubricItemSchema = z.infer<typeof rubricItemSchema>;
export type RubricScoresSchema = z.infer<typeof rubricScoresSchema>;
