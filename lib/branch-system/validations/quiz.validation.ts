/**
 * Zod validation schemas for Quiz System
 * Based on migration: 020_Create assignment and quiz tables.sql
 * 
 * @module branch-system/validations/quiz
 */

import { z } from 'zod';
import {
    QuestionType,
    AttemptStatus,
    GradingStatus,
    CleanupFrequency,
} from '../types/quiz.types';

// ============================================================
// ENUM SCHEMAS
// ============================================================

export const questionTypeSchema = z.nativeEnum(QuestionType);
export const attemptStatusSchema = z.nativeEnum(AttemptStatus);
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
 * Quiz options validation (MCQ options object)
 */
const quizOptionsSchema = z.record(
    z.string().min(1, 'Option key required').max(5, 'Option key too long'),
    z.string().min(1, 'Option text required').max(1000, 'Option text too long')
).refine(
    (opts) => Object.keys(opts).length >= 2,
    { message: 'At least 2 options required' }
).refine(
    (opts) => Object.keys(opts).length <= 10,
    { message: 'Maximum 10 options allowed' }
);

/**
 * Correct answers validation
 */
const correctAnswersSchema = z.array(
    z.string().min(1, 'Answer key required').max(5, 'Answer key too long')
).min(1, 'At least one correct answer required').max(10, 'Maximum 10 correct answers');

// ============================================================
// QUIZ SCHEMAS
// ============================================================

/**
 * Create quiz schema
 */
export const createQuizSchema = z.object({
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
    available_from: dateTimeSchema,
    available_to: dateTimeSchema,
    time_limit_minutes: z.number()
        .int('Time limit must be an integer')
        .positive('Time limit must be positive')
        .max(480, 'Maximum time limit is 8 hours (480 minutes)')
        .optional()
        .nullable(),
    submission_window_minutes: z.number()
        .int()
        .min(0, 'Submission window cannot be negative')
        .max(60, 'Maximum submission window is 60 minutes')
        .default(5),
    shuffle_questions: z.boolean().default(false),
    shuffle_options: z.boolean().default(false),
    show_correct_answers: z.boolean().default(false),
    show_score_immediately: z.boolean().default(true),
    allow_multiple_attempts: z.boolean().default(false),
    max_attempts: z.number()
        .int('Max attempts must be an integer')
        .min(1, 'Must allow at least 1 attempt')
        .max(10, 'Maximum 10 attempts allowed')
        .default(1),
    require_webcam: z.boolean().default(false),
    max_score: z.number()
        .positive('Max score must be positive')
        .max(10000, 'Maximum score is 10000'),
    passing_score: z.number()
        .min(0, 'Passing score cannot be negative')
        .optional()
        .nullable(),
    clean_attempts_after: cleanupFrequencySchema.default(CleanupFrequency.DAYS_90),
    clean_questions_after: cleanupFrequencySchema.default(CleanupFrequency.NEVER),
}).refine((data) => {
    // Validate available_from < available_to
    return new Date(data.available_from) < new Date(data.available_to);
}, {
    message: 'Available from must be before available to',
    path: ['available_from'],
}).refine((data) => {
    // Validate passing_score <= max_score
    if (data.passing_score !== null && data.passing_score !== undefined) {
        return data.passing_score <= data.max_score;
    }
    return true;
}, {
    message: 'Passing score cannot exceed max score',
    path: ['passing_score'],
}).refine((data) => {
    // If multiple attempts not allowed, max_attempts should be 1
    if (!data.allow_multiple_attempts && data.max_attempts !== 1) {
        return false;
    }
    return true;
}, {
    message: 'Max attempts must be 1 when multiple attempts are not allowed',
    path: ['max_attempts'],
});

/**
 * Update quiz schema
 */
export const updateQuizSchema = z.object({
    id: uuidSchema,
    title: z.string()
        .min(1, 'Title is required')
        .max(200, 'Title must be at most 200 characters')
        .optional(),
    description: z.string()
        .max(2000, 'Description must be at most 2000 characters')
        .optional()
        .nullable(),
    instructions: z.string()
        .max(10000, 'Instructions must be at most 10000 characters')
        .optional()
        .nullable(),
    available_from: dateTimeSchema.optional(),
    available_to: dateTimeSchema.optional(),
    time_limit_minutes: z.number()
        .int()
        .positive()
        .max(480)
        .optional()
        .nullable(),
    submission_window_minutes: z.number()
        .int()
        .min(0)
        .max(60)
        .optional(),
    shuffle_questions: z.boolean().optional(),
    shuffle_options: z.boolean().optional(),
    show_correct_answers: z.boolean().optional(),
    show_score_immediately: z.boolean().optional(),
    allow_multiple_attempts: z.boolean().optional(),
    max_attempts: z.number()
        .int()
        .min(1)
        .max(10)
        .optional(),
    require_webcam: z.boolean().optional(),
    max_score: z.number()
        .positive()
        .max(10000)
        .optional(),
    passing_score: z.number()
        .min(0)
        .optional()
        .nullable(),
    clean_attempts_after: cleanupFrequencySchema.optional(),
    clean_questions_after: cleanupFrequencySchema.optional(),
    is_active: z.boolean().optional(),
}).refine((data) => {
    if (data.available_from && data.available_to) {
        return new Date(data.available_from) < new Date(data.available_to);
    }
    return true;
}, {
    message: 'Available from must be before available to',
    path: ['available_from'],
}).refine((data) => {
    if (data.passing_score !== null && data.passing_score !== undefined && data.max_score) {
        return data.passing_score <= data.max_score;
    }
    return true;
}, {
    message: 'Passing score cannot exceed max score',
    path: ['passing_score'],
});

/**
 * Toggle quiz active schema
 */
export const toggleQuizActiveSchema = z.object({
    id: uuidSchema,
    is_active: z.boolean(),
});

// ============================================================
// QUESTION SCHEMAS
// ============================================================

/**
 * Create question schema
 */
export const createQuestionSchema = z.object({
    quiz_id: uuidSchema,
    question_text: z.string()
        .min(1, 'Question text is required')
        .max(2000, 'Question text must be at most 2000 characters'),
    question_type: questionTypeSchema.default(QuestionType.MCQ_SINGLE),
    options: quizOptionsSchema,
    correct_answers: correctAnswersSchema,
    points: z.number()
        .positive('Points must be positive')
        .max(1000, 'Maximum points per question is 1000')
        .default(1),
    negative_points: z.number()
        .min(0, 'Negative points cannot be negative')
        .max(1000, 'Maximum negative points is 1000')
        .default(0),
    explanation: z.string()
        .max(2000, 'Explanation must be at most 2000 characters')
        .optional()
        .nullable(),
    question_order: z.number()
        .int('Question order must be an integer')
        .min(1, 'Question order must be at least 1'),
    topic: z.string()
        .max(100, 'Topic must be at most 100 characters')
        .optional()
        .nullable(),
    media_file_id: uuidSchema.optional().nullable(),
}).refine((data) => {
    // Validate all correct_answers exist in options
    const optionKeys = Object.keys(data.options);
    return data.correct_answers.every(ans => optionKeys.includes(ans));
}, {
    message: 'All correct answers must be valid option keys',
    path: ['correct_answers'],
}).refine((data) => {
    // Single choice should have exactly one correct answer
    if (data.question_type === QuestionType.MCQ_SINGLE && data.correct_answers.length !== 1) {
        return false;
    }
    return true;
}, {
    message: 'Single choice question must have exactly one correct answer',
    path: ['correct_answers'],
});

/**
 * Update question schema
 */
export const updateQuestionSchema = z.object({
    id: uuidSchema,
    question_text: z.string()
        .min(1, 'Question text is required')
        .max(2000)
        .optional(),
    question_type: questionTypeSchema.optional(),
    options: quizOptionsSchema.optional(),
    correct_answers: correctAnswersSchema.optional(),
    points: z.number()
        .positive()
        .max(1000)
        .optional(),
    negative_points: z.number()
        .min(0)
        .max(1000)
        .optional(),
    explanation: z.string()
        .max(2000)
        .optional()
        .nullable(),
    question_order: z.number()
        .int()
        .min(1)
        .optional(),
    topic: z.string()
        .max(100)
        .optional()
        .nullable(),
    media_file_id: uuidSchema.optional().nullable(),
});

/**
 * Bulk create questions schema
 */
export const bulkCreateQuestionsSchema = z.object({
    quiz_id: uuidSchema,
    questions: z.array(
        z.object({
            question_text: z.string()
                .min(1, 'Question text is required')
                .max(2000),
            question_type: questionTypeSchema.default(QuestionType.MCQ_SINGLE),
            options: quizOptionsSchema,
            correct_answers: correctAnswersSchema,
            points: z.number().positive().max(1000).default(1),
            negative_points: z.number().min(0).max(1000).default(0),
            explanation: z.string().max(2000).optional().nullable(),
            question_order: z.number().int().min(1),
            topic: z.string().max(100).optional().nullable(),
            media_file_id: uuidSchema.optional().nullable(),
        })
    ).min(1, 'At least one question required').max(100, 'Maximum 100 questions per batch'),
});

/**
 * Reorder questions schema
 */
export const reorderQuestionsSchema = z.object({
    quiz_id: uuidSchema,
    question_orders: z.array(
        z.object({
            id: uuidSchema,
            order: z.number().int().min(1),
        })
    ).min(1, 'At least one question order required'),
});

// ============================================================
// ATTEMPT SCHEMAS
// ============================================================

/**
 * Start attempt schema
 */
export const startAttemptSchema = z.object({
    quiz_id: uuidSchema,
    student_id: uuidSchema,
    class_id: uuidSchema,
});

/**
 * Response item schema
 */
const responseItemSchema = z.object({
    question_id: uuidSchema,
    selected_answers: z.array(z.string().max(5)).default([]),
    time_spent_seconds: z.number().int().min(0).optional(),
});

/**
 * Submit attempt schema
 */
export const submitAttemptSchema = z.object({
    attempt_id: uuidSchema,
    responses: z.array(responseItemSchema)
        .min(1, 'At least one response required'),
});

/**
 * Save response schema (auto-save during quiz)
 */
export const saveResponseSchema = z.object({
    attempt_id: uuidSchema,
    question_id: uuidSchema,
    selected_answers: z.array(z.string().max(5)).default([]),
    time_spent_seconds: z.number().int().min(0).optional(),
});

/**
 * Abandon attempt schema
 */
export const abandonAttemptSchema = z.object({
    attempt_id: uuidSchema,
    reason: z.string().max(500, 'Reason too long').optional(),
});

// ============================================================
// FILTER & LIST SCHEMAS
// ============================================================

/**
 * Quiz filters schema
 */
export const quizFiltersSchema = z.object({
    class_id: uuidSchema.optional(),
    teacher_id: uuidSchema.optional(),
    branch_id: uuidSchema.optional(),
    coaching_center_id: uuidSchema.optional(),
    is_active: z.boolean().optional(),
    available_from: dateTimeSchema.optional(),
    available_to: dateTimeSchema.optional(),
    search: z.string().max(100, 'Search term too long').optional(),
});

/**
 * Quiz list params schema
 */
export const quizListParamsSchema = z.object({
    class_id: uuidSchema.optional(),
    teacher_id: uuidSchema.optional(),
    branch_id: uuidSchema.optional(),
    coaching_center_id: uuidSchema.optional(),
    is_active: z.boolean().optional(),
    available_from: dateTimeSchema.optional(),
    available_to: dateTimeSchema.optional(),
    search: z.string().max(100).optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
    sort_by: z.enum(['available_from', 'created_at', 'title']).default('available_from'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
    include_questions: z.boolean().default(false),
});

/**
 * Attempt filters schema
 */
export const attemptFiltersSchema = z.object({
    quiz_id: uuidSchema.optional(),
    student_id: uuidSchema.optional(),
    class_id: uuidSchema.optional(),
    attempt_status: attemptStatusSchema.optional(),
    passed: z.boolean().optional(),
});

/**
 * Attempt list params schema
 */
export const attemptListParamsSchema = z.object({
    quiz_id: uuidSchema.optional(),
    student_id: uuidSchema.optional(),
    class_id: uuidSchema.optional(),
    attempt_status: attemptStatusSchema.optional(),
    passed: z.boolean().optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
    sort_by: z.enum(['started_at', 'submitted_at', 'score']).default('started_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================
// EXPORT TYPES FROM SCHEMAS
// ============================================================

export type CreateQuizSchema = z.infer<typeof createQuizSchema>;
export type UpdateQuizSchema = z.infer<typeof updateQuizSchema>;
export type ToggleQuizActiveSchema = z.infer<typeof toggleQuizActiveSchema>;
export type CreateQuestionSchema = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionSchema = z.infer<typeof updateQuestionSchema>;
export type BulkCreateQuestionsSchema = z.infer<typeof bulkCreateQuestionsSchema>;
export type ReorderQuestionsSchema = z.infer<typeof reorderQuestionsSchema>;
export type StartAttemptSchema = z.infer<typeof startAttemptSchema>;
export type SubmitAttemptSchema = z.infer<typeof submitAttemptSchema>;
export type SaveResponseSchema = z.infer<typeof saveResponseSchema>;
export type AbandonAttemptSchema = z.infer<typeof abandonAttemptSchema>;
export type QuizFiltersSchema = z.infer<typeof quizFiltersSchema>;
export type QuizListParamsSchema = z.infer<typeof quizListParamsSchema>;
export type AttemptFiltersSchema = z.infer<typeof attemptFiltersSchema>;
export type AttemptListParamsSchema = z.infer<typeof attemptListParamsSchema>;
