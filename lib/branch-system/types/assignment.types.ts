/**
 * Type definitions for Assignment System
 * Based on migration: 020_Create assignment and quiz tables.sql
 * 
 * @module branch-system/types/assignment
 */

// ============================================================
// ENUMS
// ============================================================

/**
 * Assignment submission type
 */
export enum AssignmentSubmissionType {
    FILE = 'FILE',
    TEXT = 'TEXT',
}

/**
 * Assignment status
 */
export enum AssignmentStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    CLOSED = 'CLOSED',
}

/**
 * Grading status
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
 * Student submission status (computed from submission data)
 */
export enum StudentSubmissionStatus {
    NOT_STARTED = 'NOT_STARTED',
    DRAFT_SAVED = 'DRAFT_SAVED',
    SUBMITTED = 'SUBMITTED',
    LATE = 'LATE',
    GRADED = 'GRADED',
}

// ============================================================
// FILE TYPES
// ============================================================

/**
 * File context types
 */
export type FileContextType =
    | 'assignment_instruction'
    | 'assignment_attachment'
    | 'submission'
    | 'quiz_attachment';

/**
 * Storage provider types
 */
export type StorageProvider = 'local' | 's3' | 'gcs';

/**
 * File database row type
 */
export interface FileRow {
    id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string | null;
    storage_provider: StorageProvider;
    file_content: string | null; // Base64 for small files
    preview_url: string | null;
    thumbnail_url: string | null;
    uploaded_by: string;
    context_type: FileContextType | null;
    context_id: string | null;
    expires_at: string | null;
    is_permanent: boolean;
    cleanup_notes: string | null;
    is_compressed: boolean;
    compression_ratio: number | null;
    created_at: string;
    updated_at: string;
}

/**
 * File with extended information
 */
export interface AssignmentFile extends FileRow {
    download_url?: string;
    uploader?: {
        id: string;
        full_name: string | null;
    };
}

// ============================================================
// ASSIGNMENT TYPES
// ============================================================

/**
 * Grading rubric item structure
 */
export interface RubricItem {
    id: string;
    criteria: string;
    description?: string;
    max_points: number;
    levels?: {
        level: string;
        points: number;
        description: string;
    }[];
}

/**
 * Assignment database row type
 */
export interface AssignmentRow {
    id: string;
    class_id: string;
    teacher_id: string;
    branch_id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    submission_type: AssignmentSubmissionType;
    max_file_size: number;
    allowed_extensions: string[] | null;
    max_submissions: number;
    allow_late_submission: boolean;
    late_penalty_percentage: number;
    max_score: number;
    grading_rubric: RubricItem[] | null;
    show_rubric_to_students: boolean;
    publish_at: string | null;
    due_date: string;
    close_date: string | null;
    clean_submissions_after: CleanupFrequency;
    clean_instructions_after: CleanupFrequency;
    instruction_file_id: string | null;
    attachment_ids: string[];
    status: AssignmentStatus;
    is_visible: boolean;
    total_submissions: number;
    average_score: number | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

/**
 * Assignment with extended relations
 */
export interface Assignment extends AssignmentRow {
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
    instruction_file?: AssignmentFile | null;
    attachments?: AssignmentFile[];
    // Computed fields
    submissions_count?: number;
    graded_count?: number;
    student_submission?: AssignmentSubmission | null; // For student view
}

/**
 * Assignment list item (lighter weight for lists)
 */
export interface AssignmentListItem {
    id: string;
    title: string;
    class_name: string;
    subject: string;
    submission_type: AssignmentSubmissionType;
    status: AssignmentStatus;
    due_date: string;
    max_score: number;
    total_submissions: number;
    is_visible: boolean;
    // For student view
    student_status?: StudentSubmissionStatus;
    student_score?: number | null;
}

// ============================================================
// SUBMISSION TYPES
// ============================================================

/**
 * Assignment submission database row type
 */
export interface AssignmentSubmissionRow {
    id: string;
    assignment_id: string;
    student_id: string;
    class_id: string;
    submission_text: string | null;
    submission_file_id: string | null;
    submitted_at: string;
    ip_address: string | null;
    user_agent: string | null;
    score: number | null;
    max_score: number | null;
    grading_status: GradingStatus;
    graded_by: string | null;
    graded_at: string | null;
    is_late: boolean;
    late_minutes: number | null;
    penalty_applied: number;
    feedback: string | null;
    private_notes: string | null;
    attempt_number: number;
    is_final: boolean;
    auto_delete_after: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

/**
 * Assignment submission with extended relations
 */
export interface AssignmentSubmission extends AssignmentSubmissionRow {
    assignment?: {
        id: string;
        title: string;
        submission_type: AssignmentSubmissionType;
        max_score: number;
        due_date: string;
        allow_late_submission: boolean;
        late_penalty_percentage: number;
    };
    student?: {
        id: string;
        full_name: string | null;
        username: string | null;
        avatar_url: string | null;
    };
    submission_file?: AssignmentFile | null;
    grader?: {
        id: string;
        full_name: string | null;
    } | null;
}

/**
 * Submission for teacher's grading view
 */
export interface SubmissionForGrading {
    id: string;
    student_id: string;
    student_name: string;
    student_username: string | null;
    student_avatar: string | null;
    submitted_at: string;
    is_late: boolean;
    late_minutes: number | null;
    grading_status: GradingStatus;
    score: number | null;
    attempt_number: number;
    is_final: boolean;
    submission_text: string | null;
    submission_file?: AssignmentFile | null;
}

/**
 * Submission status for student list view
 */
export interface StudentSubmissionStatusItem {
    student_id: string;
    student_name: string;
    student_username: string | null;
    has_submitted: boolean;
    is_final: boolean;
    submitted_at: string | null;
    is_late: boolean;
    grading_status: GradingStatus | null;
    score: number | null;
}

// ============================================================
// DTO TYPES - CREATE/UPDATE
// ============================================================

/**
 * DTO for creating an assignment
 */
export interface CreateAssignmentDTO {
    class_id: string;
    teacher_id: string;
    branch_id: string;
    title: string;
    description?: string;
    instructions?: string;
    submission_type?: AssignmentSubmissionType;
    max_file_size?: number;
    allowed_extensions?: string[];
    max_submissions?: number;
    allow_late_submission?: boolean;
    late_penalty_percentage?: number;
    max_score: number;
    grading_rubric?: RubricItem[];
    show_rubric_to_students?: boolean;
    publish_at?: string;
    due_date: string;
    close_date?: string;
    clean_submissions_after?: CleanupFrequency;
    clean_instructions_after?: CleanupFrequency;
}

/**
 * DTO for updating an assignment
 */
export interface UpdateAssignmentDTO {
    id: string;
    title?: string;
    description?: string;
    instructions?: string;
    max_file_size?: number;
    allowed_extensions?: string[];
    allow_late_submission?: boolean;
    late_penalty_percentage?: number;
    max_score?: number;
    grading_rubric?: RubricItem[];
    show_rubric_to_students?: boolean;
    publish_at?: string;
    due_date?: string;
    close_date?: string;
    clean_submissions_after?: CleanupFrequency;
    clean_instructions_after?: CleanupFrequency;
}

/**
 * DTO for publishing an assignment
 */
export interface PublishAssignmentDTO {
    id: string;
    notify_students?: boolean;
}

/**
 * DTO for closing an assignment
 */
export interface CloseAssignmentDTO {
    id: string;
    reason?: string;
}

// ============================================================
// DTO TYPES - SUBMISSION
// ============================================================

/**
 * DTO for submitting an assignment (student)
 */
export interface SubmitAssignmentDTO {
    assignment_id: string;
    student_id: string;
    class_id: string;
    submission_text?: string;
    submission_file_id?: string;
    is_final: boolean;
}

/**
 * DTO for saving a draft submission
 */
export interface SaveDraftDTO {
    assignment_id: string;
    student_id: string;
    class_id: string;
    submission_text?: string;
    submission_file_id?: string;
}

// ============================================================
// DTO TYPES - GRADING
// ============================================================

/**
 * DTO for grading a submission
 */
export interface GradeSubmissionDTO {
    submission_id: string;
    graded_by: string;
    score: number;
    feedback?: string;
    private_notes?: string;
    rubric_scores?: {
        rubric_item_id: string;
        points_awarded: number;
        comment?: string;
    }[];
}

/**
 * DTO for updating a grade
 */
export interface UpdateGradeDTO {
    submission_id: string;
    graded_by: string;
    score?: number;
    feedback?: string;
    private_notes?: string;
}

/**
 * DTO for regrade request
 */
export interface RegradeRequestDTO {
    submission_id: string;
    student_id: string;
    reason: string;
}

// ============================================================
// DTO TYPES - FILE UPLOAD
// ============================================================

/**
 * DTO for uploading a file
 */
export interface UploadFileDTO {
    file_name: string;
    file_size: number;
    mime_type: string;
    context_type: FileContextType;
    context_id: string;
    uploaded_by: string;
    is_permanent?: boolean;
    file_content?: string; // Base64 for small files
}

/**
 * DTO for file upload response
 */
export interface FileUploadResult {
    id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string | null;
    upload_url?: string; // Pre-signed URL for direct upload
    download_url?: string;
}

// ============================================================
// FILTER & LIST TYPES
// ============================================================

/**
 * Assignment filter parameters
 */
export interface AssignmentFilters {
    class_id?: string;
    teacher_id?: string;
    branch_id?: string;
    coaching_center_id?: string;
    status?: AssignmentStatus;
    submission_type?: AssignmentSubmissionType;
    is_visible?: boolean;
    due_date_from?: string;
    due_date_to?: string;
    search?: string; // Search by title
}

/**
 * Assignment list parameters
 */
export interface AssignmentListParams extends AssignmentFilters {
    page?: number;
    limit?: number;
    sort_by?: 'due_date' | 'created_at' | 'title';
    sort_order?: 'asc' | 'desc';
    include_submissions?: boolean; // For teacher view
}

/**
 * Assignment list response
 */
export interface AssignmentListResponse {
    data: Assignment[];
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
}

/**
 * Submission filter parameters
 */
export interface SubmissionFilters {
    assignment_id?: string;
    student_id?: string;
    class_id?: string;
    grading_status?: GradingStatus;
    is_late?: boolean;
    is_final?: boolean;
}

/**
 * Submission list parameters
 */
export interface SubmissionListParams extends SubmissionFilters {
    page?: number;
    limit?: number;
    sort_by?: 'submitted_at' | 'score' | 'student_name';
    sort_order?: 'asc' | 'desc';
}

/**
 * Submission list response
 */
export interface SubmissionListResponse {
    data: AssignmentSubmission[];
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
}

// ============================================================
// STATISTICS & REPORT TYPES
// ============================================================

/**
 * Assignment statistics
 */
export interface AssignmentStatistics {
    total_students: number;
    submitted_count: number;
    not_submitted_count: number;
    draft_count: number;
    late_count: number;
    graded_count: number;
    not_graded_count: number;
    average_score: number | null;
    highest_score: number | null;
    lowest_score: number | null;
    submission_rate: number; // Percentage
    on_time_rate: number; // Percentage of submissions on time
}

/**
 * Student assignment summary
 */
export interface StudentAssignmentSummary {
    total_assignments: number;
    submitted_count: number;
    pending_count: number;
    graded_count: number;
    average_score: number | null;
    total_points_earned: number;
    total_points_possible: number;
    on_time_submissions: number;
    late_submissions: number;
}

/**
 * Class assignment report
 */
export interface ClassAssignmentReport {
    class_id: string;
    class_name: string;
    total_assignments: number;
    published_assignments: number;
    average_submission_rate: number;
    average_score: number | null;
    students_summary: {
        total: number;
        with_submissions: number;
        with_perfect_scores: number;
    };
}

// ============================================================
// CLEANUP TYPES
// ============================================================

/**
 * Cleanup log entry
 */
export interface CleanupLogEntry {
    id: string;
    entity_type: 'file' | 'quiz_response' | 'submission';
    entity_id: string;
    entity_name: string | null;
    cleanup_reason: string;
    cleanup_trigger: string | null;
    cleaned_at: string;
    storage_saved_bytes: number | null;
    rows_deleted: number | null;
    triggered_by: string | null;
    backup_location: string | null;
    backup_available_until: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
}

/**
 * Storage usage statistics
 */
export interface StorageUsageStats {
    total_files: number;
    total_size_bytes: number;
    by_context: {
        context_type: FileContextType;
        count: number;
        size_bytes: number;
    }[];
    pending_cleanup: {
        count: number;
        size_bytes: number;
        earliest_date: string | null;
    };
}
