/**
 * Branch Teacher Types
 * 
 * TypeScript interfaces and types for branch teacher assignments
 * Based on Supabase schema: 019_create_branch_teacher_system.sql
 * 
 * @module branch-system/types/branch-teacher
 */

// ============================================================
// ENUMS - Matching Database Types
// ============================================================

/**
 * Teacher assignment status enum
 */
export type AssignmentStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';

/**
 * Days of the week for availability
 */
export type DayOfWeek = 
    | 'MONDAY' 
    | 'TUESDAY' 
    | 'WEDNESDAY' 
    | 'THURSDAY' 
    | 'FRIDAY' 
    | 'SATURDAY' 
    | 'SUNDAY';

// ============================================================
// CORE INTERFACES
// ============================================================

/**
 * Branch Teacher - Complete database record
 * Matches the branch_teacher table structure
 */
export interface BranchTeacher {
    // Primary identification
    id: string; // UUID

    // Relationships
    teacher_id: string; // UUID - References auth.users(id)
    branch_id: string; // UUID - References coaching_branches(id)

    // Teacher snapshot details (copied from profiles at assignment time)
    teacher_name: string;
    teacher_email: string;
    teacher_phone: string | null;
    teacher_username: string | null;
    teacher_qualification: string | null;
    teacher_specialization: string[] | null;

    // Assignment details
    assignment_date: string; // ISO date string
    assignment_end_date: string | null; // ISO date string
    is_active: boolean;

    // Teaching details
    teaching_subjects: string[]; // Subjects this teacher teaches at this branch
    teaching_experience_years: number | null;
    hourly_rate: number | null; // DECIMAL(10,2)

    // Availability at this branch
    available_days: DayOfWeek[] | null; // Days teacher is available at this branch
    available_start_time: string | null; // TIME format HH:MM:SS
    available_end_time: string | null; // TIME format HH:MM:SS

    // Notes
    assignment_notes: string | null;
    performance_notes: string | null;

    // Metadata
    metadata: Record<string, unknown> | null;

    // Timestamps
    created_at: string; // ISO timestamp
    updated_at: string; // ISO timestamp
}

/**
 * Public Branch Teacher - For display to students and other users
 * Excludes sensitive internal management fields
 */
export interface PublicBranchTeacher {
    id: string;
    teacher_id: string;
    branch_id: string;
    teacher_name: string;
    teacher_email: string;
    teacher_phone: string | null;
    teacher_username: string | null;
    teacher_qualification: string | null;
    teacher_specialization: string[] | null;
    teaching_subjects: string[];
    teaching_experience_years: number | null;
    available_days: DayOfWeek[] | null;
    available_start_time: string | null;
    available_end_time: string | null;
    is_active: boolean;
    // Computed fields
    total_subjects_count: number;
    availability_summary: string;
    experience_level: ExperienceLevel;
}

/**
 * Experience level categorization
 */
export type ExperienceLevel = 'entry' | 'intermediate' | 'senior' | 'expert';

/**
 * Teacher Self-Editable Fields
 * Fields that teachers can update themselves
 */
export interface TeacherSelfEditableFields {
    teaching_subjects: string[];
    teaching_experience_years: number | null;
    available_days: DayOfWeek[] | null;
    available_start_time: string | null;
    available_end_time: string | null;
    hourly_rate: number | null;
}

/**
 * Manager/Coach Editable Fields
 * Fields that branch managers/coaches can update
 */
export interface ManagerEditableFields extends TeacherSelfEditableFields {
    assignment_end_date: string | null;
    is_active: boolean;
    assignment_notes: string | null;
    performance_notes: string | null;
    metadata: Record<string, unknown> | null;
}

/**
 * Branch Teacher with Relations - Includes related data
 */
export interface BranchTeacherWithRelations extends BranchTeacher {
    // Teacher profile information (current profile data)
    profile?: {
        id: string;
        full_name: string;
        username: string | null;
        email: string;
        avatar_url: string | null;
        phone: string | null;
        role: string;
        qualification: string | null;
        specialization: string[] | null;
    };
    // Branch information
    branch?: {
        id: string;
        branch_name: string;
        branch_code: string;
        coaching_center_id: string;
        address: string | null;
    };
    // Classes taught by this teacher at this branch
    classes?: Array<{
        id: string;
        class_name: string;
        subject: string;
        grade_level: string;
        batch_name: string | null;
        student_count: number;
    }>;
}

// ============================================================
// CREATE & UPDATE TYPES
// ============================================================

/**
 * Assign Teacher Input
 * Fields required/allowed when assigning a teacher to a branch
 */
export interface AssignTeacherInput {
    // Required fields
    teacher_id: string;
    branch_id: string;
    teaching_subjects: string[];

    // Optional fields
    assignment_date?: string; // Defaults to current date
    assignment_end_date?: string | null;
    teaching_experience_years?: number | null;
    hourly_rate?: number | null;
    available_days?: DayOfWeek[] | null;
    available_start_time?: string | null;
    available_end_time?: string | null;
    assignment_notes?: string | null;

    // Metadata
    metadata?: Record<string, unknown> | null;
}

/**
 * Update Teacher Assignment Input (by teacher)
 * Teachers can only update their availability and teaching details
 */
export interface UpdateTeacherSelfInput {
    teaching_subjects?: string[];
    teaching_experience_years?: number | null;
    available_days?: DayOfWeek[] | null;
    available_start_time?: string | null;
    available_end_time?: string | null;
    hourly_rate?: number | null;
}

/**
 * Update Teacher Assignment Input (by manager/coach)
 * Managers can update most fields
 */
export interface UpdateTeacherByManagerInput {
    teaching_subjects?: string[];
    teaching_experience_years?: number | null;
    hourly_rate?: number | null;
    available_days?: DayOfWeek[] | null;
    available_start_time?: string | null;
    available_end_time?: string | null;
    assignment_end_date?: string | null;
    is_active?: boolean;
    assignment_notes?: string | null;
    performance_notes?: string | null;
    metadata?: Record<string, unknown> | null;
}

// ============================================================
// FILTER & SEARCH TYPES
// ============================================================

/**
 * Branch Teacher Filters
 */
export interface BranchTeacherFilters {
    teacher_id?: string;
    branch_id?: string;
    is_active?: boolean;
    teaching_subjects?: string[];
    available_day?: DayOfWeek;
    assignment_date_from?: string;
    assignment_date_to?: string;
    experience_min?: number;
    experience_max?: number;
    search_query?: string; // Search in teacher name, email, subjects
}

/**
 * Branch Teacher Sort Options
 */
export interface BranchTeacherSort {
    field:
        | 'teacher_name'
        | 'assignment_date'
        | 'teaching_experience_years'
        | 'hourly_rate'
        | 'is_active'
        | 'created_at'
        | 'updated_at';
    direction: 'asc' | 'desc';
}

/**
 * Pagination options
 */
export interface PaginationOptions {
    page: number;
    limit: number;
}

/**
 * Branch Teacher Search Result
 */
export interface BranchTeacherSearchResult {
    teachers: PublicBranchTeacher[];
    total_count: number;
    page: number;
    limit: number;
    total_pages: number;
    has_more: boolean;
}

// ============================================================
// STATISTICS & ANALYTICS
// ============================================================

/**
 * Teacher Assignment Summary (for individual teacher)
 */
export interface TeacherAssignmentSummary {
    total_assignments: number;
    active_assignments: number;
    total_branches: number;
    total_subjects: string[];
    average_hourly_rate: number | null;
}

/**
 * Branch Teacher Statistics (for branch)
 */
export interface BranchTeacherStats {
    total_teachers: number;
    active_teachers: number;
    inactive_teachers: number;
    on_leave_teachers: number;
    teachers_by_subject: Record<string, number>;
    teachers_by_experience: Record<ExperienceLevel, number>;
    teachers_by_available_day: Record<DayOfWeek, number>;
    average_experience_years: number;
    average_hourly_rate: number | null;
}

/**
 * Subject Coverage Statistics
 */
export interface SubjectCoverageStats {
    subject: string;
    teacher_count: number;
    total_experience_years: number;
    average_experience_years: number;
    teachers: Array<{
        teacher_id: string;
        teacher_name: string;
        experience_years: number | null;
    }>;
}

// ============================================================
// OPERATION RESULTS
// ============================================================

/**
 * Operation Result - Generic response wrapper
 */
export interface BranchTeacherOperationResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    validation_errors?: BranchTeacherValidationError[];
}

/**
 * Validation Error
 */
export interface BranchTeacherValidationError {
    field: string;
    message: string;
    code?: string;
}

/**
 * Assignment Result - Specific to assignment operation
 */
export interface AssignmentResult {
    success: boolean;
    assignment_id?: string;
    message?: string;
    error?: string;
}

// ============================================================
// DASHBOARD & SUMMARY TYPES
// ============================================================

/**
 * Teacher Dashboard Data (for individual teacher)
 */
export interface TeacherDashboard {
    assignments: BranchTeacherWithRelations[];
    summary: TeacherAssignmentSummary;
    upcoming_schedule: TeacherScheduleItem[];
    recent_performance_notes: string[];
}

/**
 * Teacher Schedule Item
 */
export interface TeacherScheduleItem {
    branch_id: string;
    branch_name: string;
    day: DayOfWeek;
    start_time: string;
    end_time: string;
    subjects: string[];
}

/**
 * Branch Manager Teacher Dashboard
 */
export interface BranchManagerTeacherDashboard {
    stats: BranchTeacherStats;
    recent_assignments: PublicBranchTeacher[];
    subject_coverage: SubjectCoverageStats[];
    teachers_needing_attention: PublicBranchTeacher[]; // Ending soon, inactive, etc.
}

// ============================================================
// CONSTANTS & DEFAULTS
// ============================================================

/**
 * Default values for assigning a new teacher
 */
export const DEFAULT_BRANCH_TEACHER_VALUES: Partial<AssignTeacherInput> = {
    assignment_date: new Date().toISOString().split('T')[0],
    metadata: {},
} as const;

/**
 * Days of week options with labels
 */
export const DAYS_OF_WEEK_OPTIONS: Record<DayOfWeek, { label: string; short: string; order: number }> = {
    MONDAY: { label: 'Monday', short: 'Mon', order: 1 },
    TUESDAY: { label: 'Tuesday', short: 'Tue', order: 2 },
    WEDNESDAY: { label: 'Wednesday', short: 'Wed', order: 3 },
    THURSDAY: { label: 'Thursday', short: 'Thu', order: 4 },
    FRIDAY: { label: 'Friday', short: 'Fri', order: 5 },
    SATURDAY: { label: 'Saturday', short: 'Sat', order: 6 },
    SUNDAY: { label: 'Sunday', short: 'Sun', order: 7 },
} as const;

/**
 * Experience level thresholds (years)
 */
export const EXPERIENCE_THRESHOLDS = {
    ENTRY: 0,
    INTERMEDIATE: 3,
    SENIOR: 7,
    EXPERT: 15,
} as const;

/**
 * Experience level options with labels
 */
export const EXPERIENCE_LEVEL_OPTIONS: Record<ExperienceLevel, { label: string; description: string; color: string }> = {
    entry: {
        label: 'Entry Level',
        description: '0-2 years experience',
        color: 'blue',
    },
    intermediate: {
        label: 'Intermediate',
        description: '3-6 years experience',
        color: 'green',
    },
    senior: {
        label: 'Senior',
        description: '7-14 years experience',
        color: 'purple',
    },
    expert: {
        label: 'Expert',
        description: '15+ years experience',
        color: 'gold',
    },
} as const;

/**
 * Assignment status options
 */
export const ASSIGNMENT_STATUS_OPTIONS: Record<AssignmentStatus, { label: string; description: string; color: string }> = {
    ACTIVE: {
        label: 'Active',
        description: 'Teacher is actively assigned',
        color: 'green',
    },
    INACTIVE: {
        label: 'Inactive',
        description: 'Assignment is inactive',
        color: 'gray',
    },
    ON_LEAVE: {
        label: 'On Leave',
        description: 'Teacher is on leave',
        color: 'yellow',
    },
    TERMINATED: {
        label: 'Terminated',
        description: 'Assignment has been terminated',
        color: 'red',
    },
} as const;
