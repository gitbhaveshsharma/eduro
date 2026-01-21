/**
 * Type definitions for Quiz System
 * Based on migration: 020_Create assignment and quiz tables.sql
 * 
 * @module branch-system/types/quiz
 */

// ============================================================
// ENUMS
// ============================================================

/**
 * Quiz question type
 */
export enum QuestionType {
    MCQ_SINGLE = 'MCQ_SINGLE',
    MCQ_MULTI = 'MCQ_MULTI',
}

/**
 * Quiz attempt status
 */
export enum AttemptStatus {
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    TIMEOUT = 'TIMEOUT',
    ABANDONED = 'ABANDONED',
}

/**
 * Grading status (shared with assignment)
 */
export enum GradingStatus {
    NOT_GRADED = 'NOT_GRADED',
    AUTO_GRADED = 'AUTO_GRADED',
    MANUAL_GRADED = 'MANUAL_GRADED',
}

/**
 * Cleanup frequency for auto-cleanup
 */
export enum CleanupFrequency {
    DAYS_30 = '30_DAYS',
    DAYS_60 = '60_DAYS',
    DAYS_90 = '90_DAYS',
    SEMESTER_END = 'SEMESTER_END',
    NEVER = 'NEVER',
}

/**
 * Student quiz status (computed from attempt data)
 */
export enum StudentQuizStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    PASSED = 'PASSED',
    FAILED = 'FAILED',
    TIMED_OUT = 'TIMED_OUT',
}

// ============================================================
// FILE TYPES
// ============================================================

/**
 * File context types for quiz
 */
export type QuizFileContextType = 'quiz_attachment' | 'question_media';

/**
 * Storage provider types
 */
export type StorageProvider = 'local' | 's3' | 'gcs';

/**
 * Quiz file type
 */
export interface QuizFile {
    id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string | null;
    storage_provider: StorageProvider;
    preview_url: string | null;
    thumbnail_url: string | null;
    uploaded_by: string;
    context_type: QuizFileContextType | null;
    context_id: string | null;
    expires_at: string | null;
    is_permanent: boolean;
    created_at: string;
    updated_at: string;
    download_url?: string;
}

// ============================================================
// QUIZ TYPES
// ============================================================

/**
 * Quiz option structure for MCQ
 */
export interface QuizOption {
    key: string;      // 'A', 'B', 'C', 'D', etc.
    text: string;     // Option text
    media_url?: string; // Optional media for option
}

/**
 * Quiz options object (stored in DB as JSONB)
 */
export type QuizOptions = Record<string, string>; // {"A": "Option 1", "B": "Option 2", ...}

/**
 * Quiz database row type
 */
export interface QuizRow {
    id: string;
    class_id: string;
    teacher_id: string;
    branch_id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    available_from: string;
    available_to: string;
    time_limit_minutes: number | null;
    submission_window_minutes: number;
    shuffle_questions: boolean;
    shuffle_options: boolean;
    show_correct_answers: boolean;
    show_score_immediately: boolean;
    allow_multiple_attempts: boolean;
    max_attempts: number;
    require_webcam: boolean;
    max_score: number;
    passing_score: number | null;
    clean_attempts_after: CleanupFrequency;
    clean_questions_after: CleanupFrequency;
    is_active: boolean;
    total_questions: number;
    total_attempts: number;
    average_score: number | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

/**
 * Quiz with extended relations
 */
export interface Quiz extends QuizRow {
    class?: {
        id: string;
        class_name: string;
        subject: string;
        grade_level: string;
    };
    teacher?: {
        id: string;
        full_name: string | null;
        avatar_url?: string | null;
    };
    branch?: {
        id: string;
        name: string;
    };
    questions?: QuizQuestion[];
    // Computed fields
    questions_count?: number;
    attempts_count?: number;
    student_attempt?: QuizAttempt | null; // For student view
}

/**
 * Quiz list item (lighter weight for lists)
 */
export interface QuizListItem {
    id: string;
    title: string;
    class_name: string;
    subject: string;
    available_from: string;
    available_to: string;
    time_limit_minutes: number | null;
    total_questions: number;
    max_score: number;
    passing_score: number | null;
    is_active: boolean;
    total_attempts: number;
    average_score: number | null;
    // For student view
    student_status?: StudentQuizStatus;
    student_score?: number | null;
    student_attempts_remaining?: number;
}

// ============================================================
// QUIZ QUESTION TYPES
// ============================================================

/**
 * Quiz question database row type
 */
export interface QuizQuestionRow {
    id: string;
    quiz_id: string;
    question_text: string;
    question_type: QuestionType;
    options: QuizOptions;
    correct_answers: string[];
    points: number;
    negative_points: number;
    explanation: string | null;
    question_order: number;
    topic: string | null;
    media_file_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

/**
 * Quiz question with extended relations
 */
export interface QuizQuestion extends QuizQuestionRow {
    media_file?: QuizFile | null;
}

/**
 * Quiz question for student view (without correct answers)
 */
export interface QuizQuestionForStudent {
    id: string;
    question_text: string;
    question_type: QuestionType;
    options: QuizOptions;
    points: number;
    negative_points: number;
    question_order: number;
    topic: string | null;
    media_file?: QuizFile | null;
}

// ============================================================
// QUIZ ATTEMPT TYPES
// ============================================================

/**
 * Quiz attempt database row type
 */
export interface QuizAttemptRow {
    id: string;
    quiz_id: string;
    student_id: string;
    class_id: string;
    attempt_number: number;
    attempt_status: AttemptStatus;
    started_at: string;
    submitted_at: string | null;
    time_taken_seconds: number | null;
    score: number | null;
    max_score: number | null;
    percentage: number | null;
    passed: boolean | null;
    expires_at: string | null;
    ip_address: string | null;
    user_agent: string | null;
    session_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

/**
 * Quiz attempt with extended relations
 */
export interface QuizAttempt extends QuizAttemptRow {
    quiz?: {
        id: string;
        title: string;
        time_limit_minutes: number | null;
        max_score: number;
        passing_score: number | null;
        show_correct_answers: boolean;
        show_score_immediately: boolean;
    };
    student?: {
        id: string;
        full_name: string | null;
        username: string | null;
        avatar_url: string | null;
    };
    responses?: QuizResponse[];
}

/**
 * Attempt for teacher's view
 */
export interface AttemptForTeacher {
    id: string;
    student_id: string;
    student_name: string;
    student_username: string | null;
    student_avatar: string | null;
    attempt_number: number;
    attempt_status: AttemptStatus;
    started_at: string;
    submitted_at: string | null;
    time_taken_seconds: number | null;
    score: number | null;
    max_score: number | null;
    percentage: number | null;
    passed: boolean | null;
}

/**
 * Student attempt status item
 */
export interface StudentAttemptStatusItem {
    student_id: string;
    student_name: string;
    student_username: string | null;
    has_attempted: boolean;
    total_attempts: number;
    best_score: number | null;
    best_percentage: number | null;
    passed: boolean | null;
    last_attempt_at: string | null;
}

// ============================================================
// QUIZ RESPONSE TYPES
// ============================================================

/**
 * Quiz response database row type
 */
export interface QuizResponseRow {
    id: string;
    attempt_id: string;
    question_id: string;
    selected_answers: string[] | null;
    answer_text: string | null;
    is_correct: boolean | null;
    points_earned: number;
    points_deducted: number;
    time_spent_seconds: number;
    question_started_at: string | null;
    question_answered_at: string | null;
    is_detailed: boolean;
    metadata: Record<string, unknown>;
    created_at: string;
}

/**
 * Quiz response with extended relations
 */
export interface QuizResponse extends QuizResponseRow {
    question?: QuizQuestion;
}

/**
 * Response for review (with correct answers if allowed)
 */
export interface QuizResponseForReview {
    id: string;
    question_id: string;
    question_text: string;
    question_type: QuestionType;
    options: QuizOptions;
    selected_answers: string[] | null;
    correct_answers?: string[]; // Only if show_correct_answers is true
    is_correct: boolean | null;
    points_earned: number;
    points_deducted: number;
    explanation?: string | null; // Only if show_correct_answers is true
}

// ============================================================
// DTO TYPES - CREATE/UPDATE
// ============================================================

/**
 * DTO for creating a quiz
 */
export interface CreateQuizDTO {
    class_id: string;
    teacher_id: string;
    branch_id: string;
    title: string;
    description?: string;
    instructions?: string;
    available_from: string;
    available_to: string;
    time_limit_minutes?: number;
    submission_window_minutes?: number;
    shuffle_questions?: boolean;
    shuffle_options?: boolean;
    show_correct_answers?: boolean;
    show_score_immediately?: boolean;
    allow_multiple_attempts?: boolean;
    max_attempts?: number;
    require_webcam?: boolean;
    max_score: number;
    passing_score?: number;
    clean_attempts_after?: CleanupFrequency;
    clean_questions_after?: CleanupFrequency;
}

/**
 * DTO for updating a quiz
 */
export interface UpdateQuizDTO {
    id: string;
    title?: string;
    description?: string;
    instructions?: string;
    available_from?: string;
    available_to?: string;
    time_limit_minutes?: number | null;
    submission_window_minutes?: number;
    shuffle_questions?: boolean;
    shuffle_options?: boolean;
    show_correct_answers?: boolean;
    show_score_immediately?: boolean;
    allow_multiple_attempts?: boolean;
    max_attempts?: number;
    require_webcam?: boolean;
    max_score?: number;
    passing_score?: number | null;
    clean_attempts_after?: CleanupFrequency;
    clean_questions_after?: CleanupFrequency;
    is_active?: boolean;
}

/**
 * DTO for activating/deactivating a quiz
 */
export interface ToggleQuizActiveDTO {
    id: string;
    is_active: boolean;
}

// ============================================================
// DTO TYPES - QUESTIONS
// ============================================================

/**
 * DTO for creating a question
 */
export interface CreateQuestionDTO {
    quiz_id: string;
    question_text: string;
    question_type?: QuestionType;
    options: QuizOptions;
    correct_answers: string[];
    points?: number;
    negative_points?: number;
    explanation?: string;
    question_order: number;
    topic?: string;
    media_file_id?: string;
}

/**
 * DTO for updating a question
 */
export interface UpdateQuestionDTO {
    id: string;
    question_text?: string;
    question_type?: QuestionType;
    options?: QuizOptions;
    correct_answers?: string[];
    points?: number;
    negative_points?: number;
    explanation?: string;
    question_order?: number;
    topic?: string;
    media_file_id?: string | null;
}

/**
 * DTO for bulk creating questions
 */
export interface BulkCreateQuestionsDTO {
    quiz_id: string;
    questions: Omit<CreateQuestionDTO, 'quiz_id'>[];
}

/**
 * DTO for reordering questions
 */
export interface ReorderQuestionsDTO {
    quiz_id: string;
    question_orders: { id: string; order: number }[];
}

// ============================================================
// DTO TYPES - ATTEMPTS
// ============================================================

/**
 * DTO for starting a quiz attempt
 */
export interface StartAttemptDTO {
    quiz_id: string;
    student_id: string;
    class_id: string;
}

/**
 * DTO for submitting a quiz attempt
 */
export interface SubmitAttemptDTO {
    attempt_id: string;
    responses: {
        question_id: string;
        selected_answers: string[];
        time_spent_seconds?: number;
    }[];
}

/**
 * DTO for saving a response (auto-save during quiz)
 */
export interface SaveResponseDTO {
    attempt_id: string;
    question_id: string;
    selected_answers: string[];
    time_spent_seconds?: number;
}

/**
 * DTO for abandoning an attempt
 */
export interface AbandonAttemptDTO {
    attempt_id: string;
    reason?: string;
}

// ============================================================
// FILTER & LIST TYPES
// ============================================================

/**
 * Quiz filter parameters
 */
export interface QuizFilters {
    class_id?: string;
    teacher_id?: string;
    branch_id?: string;
    coaching_center_id?: string;
    is_active?: boolean;
    available_from?: string;
    available_to?: string;
    search?: string;
}

/**
 * Quiz list parameters
 */
export interface QuizListParams extends QuizFilters {
    page?: number;
    limit?: number;
    sort_by?: 'available_from' | 'created_at' | 'title';
    sort_order?: 'asc' | 'desc';
    include_questions?: boolean;
}

/**
 * Quiz list response
 */
export interface QuizListResponse {
    data: Quiz[];
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
}

/**
 * Attempt filter parameters
 */
export interface AttemptFilters {
    quiz_id?: string;
    student_id?: string;
    class_id?: string;
    attempt_status?: AttemptStatus;
    passed?: boolean;
}

/**
 * Attempt list parameters
 */
export interface AttemptListParams extends AttemptFilters {
    page?: number;
    limit?: number;
    sort_by?: 'started_at' | 'submitted_at' | 'score';
    sort_order?: 'asc' | 'desc';
}

/**
 * Attempt list response
 */
export interface AttemptListResponse {
    data: QuizAttempt[];
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
}

// ============================================================
// STATISTICS & REPORT TYPES
// ============================================================

/**
 * Quiz statistics
 */
export interface QuizStatistics {
    total_students: number;
    attempted_count: number;
    not_attempted_count: number;
    completed_count: number;
    in_progress_count: number;
    passed_count: number;
    failed_count: number;
    average_score: number | null;
    highest_score: number | null;
    lowest_score: number | null;
    average_time_seconds: number | null;
    attempt_rate: number;
    pass_rate: number;
}

/**
 * Question statistics
 */
export interface QuestionStatistics {
    question_id: string;
    question_text: string;
    total_responses: number;
    correct_count: number;
    incorrect_count: number;
    correct_rate: number;
    average_time_seconds: number | null;
    most_selected_option: string | null;
    option_distribution: Record<string, number>;
}

/**
 * Student quiz summary
 */
export interface StudentQuizSummary {
    total_quizzes: number;
    attempted_count: number;
    pending_count: number;
    passed_count: number;
    failed_count: number;
    average_score: number | null;
    average_percentage: number | null;
    total_time_spent_seconds: number;
    best_performance_quiz_id: string | null;
}

/**
 * Class quiz report
 */
export interface ClassQuizReport {
    class_id: string;
    class_name: string;
    total_quizzes: number;
    active_quizzes: number;
    average_attempt_rate: number;
    average_pass_rate: number;
    average_score: number | null;
    students_summary: {
        total: number;
        with_attempts: number;
        with_all_passed: number;
    };
}

// ============================================================
// RESULT TYPES
// ============================================================

/**
 * Quiz attempt result (shown after submission)
 */
export interface QuizAttemptResult {
    attempt_id: string;
    quiz_id: string;
    quiz_title: string;
    score: number;
    max_score: number;
    percentage: number;
    passed: boolean | null;
    passing_score: number | null;
    time_taken_seconds: number;
    time_limit_minutes: number | null;
    total_questions: number;
    correct_count: number;
    incorrect_count: number;
    unanswered_count: number;
    show_correct_answers: boolean;
    responses?: QuizResponseForReview[];
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
    rank: number;
    student_id: string;
    student_name: string;
    student_avatar: string | null;
    score: number;
    percentage: number;
    time_taken_seconds: number;
    attempt_number: number;
}
