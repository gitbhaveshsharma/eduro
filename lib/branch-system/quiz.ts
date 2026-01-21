/**
 * Quiz System - Central Export
 * 
 * This file provides a clean, centralized API for all quiz-related functionality.
 * Import everything from this file to ensure consistent usage across the application.
 * 
 * @module branch-system/quiz
 * 
 * @example
 * // Import types
 * import type { Quiz, QuizQuestion, QuizAttempt, CreateQuizDTO } from '@/lib/branch-system/quiz';
 * 
 * // Import service
 * import { quizService } from '@/lib/branch-system/quiz';
 * 
 * // Import store
 * import { useQuizStore, useQuizzes, useActiveAttempt } from '@/lib/branch-system/quiz';
 * 
 * // Import utilities
 * import { formatTimeSeconds, calculatePercentage, isQuizAvailable } from '@/lib/branch-system/quiz';
 * 
 * // Import validation schemas
 * import { createQuizSchema, submitAttemptSchema } from '@/lib/branch-system/quiz';
 */

// ============================================================
// TYPES - All type definitions
// ============================================================

// Enums
export {
    QuestionType,
    AttemptStatus,
    GradingStatus,
    CleanupFrequency,
    StudentQuizStatus,
} from './types/quiz.types';

// Database Row Types
export type {
    QuizRow,
    QuizQuestionRow,
    QuizAttemptRow,
    QuizResponseRow,
} from './types/quiz.types';

// Extended Interfaces
export type {
    Quiz,
    QuizQuestion,
    QuizAttempt,
    QuizResponse,
    QuizFile,
} from './types/quiz.types';

// DTOs - Create
export type {
    CreateQuizDTO,
    CreateQuestionDTO,
    BulkCreateQuestionsDTO,
    StartAttemptDTO,
    SubmitAttemptDTO,
    SaveResponseDTO,
} from './types/quiz.types';

// DTOs - Update
export type {
    UpdateQuizDTO,
    UpdateQuestionDTO,
    ToggleQuizActiveDTO,
    ReorderQuestionsDTO,
    AbandonAttemptDTO,
} from './types/quiz.types';

// Filter and List Types
export type {
    QuizFilters,
    QuizListParams,
    QuizListResponse,
    AttemptFilters,
    AttemptListParams,
    AttemptListResponse,
} from './types/quiz.types';

// Statistics Types
export type {
    QuizStatistics,
    QuestionStatistics,
    StudentQuizSummary,
    ClassQuizReport,
} from './types/quiz.types';

// UI Types
export type {
    AttemptForTeacher,
    StudentAttemptStatusItem,
    QuizAttemptResult,
    LeaderboardEntry,
} from './types/quiz.types';

// ============================================================
// VALIDATION - Zod schemas for form and API validation
// ============================================================

export {
    // Quiz schemas
    createQuizSchema,
    updateQuizSchema,
    toggleQuizActiveSchema,
    quizFiltersSchema,
    quizListParamsSchema,

    // Question schemas
    createQuestionSchema,
    updateQuestionSchema,
    bulkCreateQuestionsSchema,
    reorderQuestionsSchema,

    // Attempt schemas
    startAttemptSchema,
    submitAttemptSchema,
    saveResponseSchema,
    abandonAttemptSchema,
    attemptFiltersSchema,
    attemptListParamsSchema,

    // Inferred types
    type CreateQuizSchema,
    type UpdateQuizSchema,
    type CreateQuestionSchema,
    type UpdateQuestionSchema,
    type StartAttemptSchema,
    type SubmitAttemptSchema,
} from './validations/quiz.validation';

// ============================================================
// UTILITIES - Pure functions for calculations and formatting
// ============================================================

// Status Config Objects
export {
    ATTEMPT_STATUS_CONFIG,
    QUESTION_TYPE_CONFIG,
    STUDENT_QUIZ_STATUS_CONFIG,
    CLEANUP_FREQUENCY_CONFIG,
    SCORE_THRESHOLDS,
    TIME_CONSTANTS,
} from './utils/quiz.utils';

// Config Helpers
export {
    getAttemptStatusConfig,
    getQuestionTypeConfig,
    getStudentQuizStatusConfig,
} from './utils/quiz.utils';

// Status Formatting
export {
    formatAttemptStatus,
    formatQuestionType,
    formatStudentQuizStatus,
} from './utils/quiz.utils';

// Time Utilities
export {
    getCurrentDateTime,
    getCurrentDateString,
    isPastDateTime,
    isFutureDateTime,
    isWithinAvailability,
    calculateSecondsDifference,
    formatDateTime,
    formatRelativeTime,
    formatTimeSeconds,
    formatTimeMinutes,
    getQuizAvailabilityStatus,
    calculateCleanupDate,
    calculateRemainingTime,
    formatRemainingTime,
} from './utils/quiz.utils';

// Score Utilities
export {
    calculatePercentage,
    getScorePerformanceLevel,
    getScoreColor,
    isPassing,
    formatScore,
    calculateResponsePoints,
} from './utils/quiz.utils';

// Quiz Status Utilities
export {
    determineStudentQuizStatus,
    canAttemptQuiz,
    getRemainingAttempts,
    canEditQuiz,
} from './utils/quiz.utils';

// Question Utilities
export {
    shuffleArray,
    prepareQuestionsForAttempt,
    shuffleOptionsObject,
    optionsToArray,
    validateQuestionStructure,
} from './utils/quiz.utils';

// Statistics Calculations
export {
    calculateQuizStatistics,
    calculateQuestionStatistics,
    calculateStudentQuizSummary,
    calculateClassQuizReport,
} from './utils/quiz.utils';

// Transformation Utilities
export {
    createAttemptForTeacher,
    createStudentAttemptStatusItem,
    createResponseForReview,
    createQuizAttemptResult,
    createLeaderboard,
} from './utils/quiz.utils';

// Filter Utilities
export {
    buildQuizQueryFilters,
} from './utils/quiz.utils';

// ============================================================
// SERVICE - Database operations
// ============================================================

export {
    quizService,
    QuizService,
    type QuizOperationResult,
    type QuizValidationError,
} from './services/quiz.service';

// ============================================================
// STORE - State management
// ============================================================

// Main Store
export {
    useQuizStore,
} from './stores/quiz.store';

// Store Types
export type {
    QuizFilterState,
    PaginationState,
    ActiveAttemptState,
    LoadingStates,
    ErrorState,
    QuizStoreState,
    QuizStoreActions,
} from './stores/quiz.store';

// Selectors
export {
    selectQuizById,
    selectFilteredQuizzes,
    selectActiveQuizzes,
    selectQuizzesByClass,
    selectAvailableQuizzes,
    selectSortedQuestions,
    selectQuestionById,
    selectCompletedAttempts,
    selectCurrentQuestion,
    selectAttemptProgress,
    selectIsLoading,
    selectLoadingState,
    selectHasError,
    selectTopLeaderboard,
} from './stores/quiz.store';

// Convenience Hooks
export {
    useQuizzes,
    useSelectedQuiz,
    useQuizQuestions,
    useActiveAttempt,
    useQuizLoading,
    useQuizError,
    useQuizStatistics,
    useLeaderboard,
    useLastAttemptResult,
} from './stores/quiz.store';

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Default values for quiz creation
 */
export const QUIZ_DEFAULTS = {
    TIME_LIMIT_MINUTES: 60,
    SUBMISSION_WINDOW_MINUTES: 5,
    MAX_ATTEMPTS: 1,
    MAX_SCORE: 100,
    PASSING_SCORE: 60,
    SHUFFLE_QUESTIONS: false,
    SHUFFLE_OPTIONS: false,
    SHOW_CORRECT_ANSWERS: false,
    SHOW_SCORE_IMMEDIATELY: true,
    ALLOW_MULTIPLE_ATTEMPTS: false,
    REQUIRE_WEBCAM: false,
} as const;

/**
 * Default values for question creation
 */
export const QUESTION_DEFAULTS = {
    POINTS: 1,
    NEGATIVE_POINTS: 0,
    ORDER: 0,
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION_DEFAULTS = {
    PAGE: 1,
    LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
    MAX_AGE_MS: 5 * 60 * 1000, // 5 minutes
    STALE_TIME_MS: 2 * 60 * 1000, // 2 minutes
} as const;

/**
 * Question type options for form selects
 */
export const QUESTION_TYPE_OPTIONS = [
    { value: 'MCQ', label: 'Multiple Choice (Single Answer)' },
    { value: 'MCA', label: 'Multiple Choice (Multiple Answers)' },
    { value: 'TF', label: 'True/False' },
    { value: 'SHORT', label: 'Short Answer' },
    { value: 'LONG', label: 'Long Answer' },
    { value: 'FILL_BLANK', label: 'Fill in the Blank' },
    { value: 'MATCH', label: 'Matching' },
    { value: 'ORDER', label: 'Ordering' },
] as const;

/**
 * Cleanup frequency options
 */
export const CLEANUP_FREQUENCY_OPTIONS = [
    { value: 'NEVER', label: 'Never' },
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
] as const;

/**
 * Attempt status options for filters
 */
export const ATTEMPT_STATUS_OPTIONS = [
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'TIMEOUT', label: 'Timed Out' },
    { value: 'ABANDONED', label: 'Abandoned' },
] as const;

/**
 * Sort options for quiz list
 */
export const QUIZ_SORT_OPTIONS = [
    { value: 'available_from', label: 'Available Date' },
    { value: 'created_at', label: 'Created Date' },
    { value: 'title', label: 'Title' },
    { value: 'total_attempts', label: 'Total Attempts' },
    { value: 'average_score', label: 'Average Score' },
] as const;

/**
 * Sort options for attempt list
 */
export const ATTEMPT_SORT_OPTIONS = [
    { value: 'started_at', label: 'Start Time' },
    { value: 'submitted_at', label: 'Submit Time' },
    { value: 'score', label: 'Score' },
    { value: 'percentage', label: 'Percentage' },
    { value: 'time_taken_seconds', label: 'Time Taken' },
] as const;
