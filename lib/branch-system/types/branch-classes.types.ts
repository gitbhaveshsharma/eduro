/**
 * Branch Classes Types
 * 
 * TypeScript interfaces and types for branch classes
 * Based on Supabase schema: 016_create_branch_student_system.sql
 * 
 * @module branch-system/types/branch-classes
 */

// ============================================================
// ENUMS - Matching Database Types
// ============================================================

/**
 * Class status enum - matches database enum
 */
export type ClassStatus =
    | 'ACTIVE'      // Class is currently active and accepting students
    | 'INACTIVE'    // Class is temporarily inactive
    | 'FULL'        // Class has reached maximum capacity
    | 'COMPLETED';  // Class has been completed

/**
 * Fee frequency enum
 */
export type FeeFrequency =
    | 'MONTHLY'
    | 'QUARTERLY'
    | 'YEARLY';

/**
 * Day of week for class scheduling
 */
export type DayOfWeek =
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
    | 'Sunday';

// ============================================================
// CORE INTERFACES
// ============================================================

/**
 * Branch Class - Complete database record
 * Matches the branch_classes table structure
 */
export interface BranchClass {
    // Primary identification
    id: string; // UUID

    // Branch relationship
    branch_id: string; // UUID - References coaching_branches(id)

    // Class details
    class_name: string;
    subject: string;
    description: string | null;

    // Class specifications
    grade_level: string; // e.g., "10th", "12th", "Graduate"
    batch_name: string | null; // e.g., "Morning Batch", "Evening Batch"

    // Scheduling
    start_date: string | null; // ISO date string
    end_date: string | null; // ISO date string
    class_days: DayOfWeek[] | null; // e.g., ['Monday', 'Wednesday', 'Friday']
    start_time: string | null; // HH:MM:SS format
    end_time: string | null; // HH:MM:SS format

    // Capacity and pricing
    max_students: number;
    current_enrollment: number;
    fees_frequency: FeeFrequency;

    // Teacher assignment
    teacher_id: string | null; // UUID - References auth.users(id)

    // Status and visibility
    status: ClassStatus;
    is_visible: boolean;

    // Requirements
    prerequisites: string[] | null;
    materials_required: string[] | null;

    // Metadata
    metadata: Record<string, any> | null;

    // Timestamps
    created_at: string; // ISO timestamp
    updated_at: string; // ISO timestamp
}

/**
 * Public Branch Class - For display to students and public
 * Excludes internal management fields
 */
export interface PublicBranchClass {
    id: string;
    branch_id: string;
    class_name: string;
    subject: string;
    description: string | null;
    grade_level: string;
    batch_name: string | null;
    start_date: string | null;
    end_date: string | null;
    class_days: DayOfWeek[] | null;
    start_time: string | null;
    end_time: string | null;
    max_students: number;
    current_enrollment: number;
    fees_frequency: FeeFrequency;
    status: ClassStatus;
    prerequisites: string[] | null;
    materials_required: string[] | null;
    created_at: string;
    updated_at: string;
    // Computed fields
    is_full: boolean;
    available_seats: number;
    // Optional related data (provided when query selects relations)
    branch?: {
        id: string;
        name: string;
        coaching_center_id: string;
    };
    teacher?: {
        id: string;
        full_name: string;
        username: string;
        avatar_url?: string | null;
    };
}

/**
 * Branch Class with Relations - Includes related data
 */
export interface BranchClassWithRelations extends BranchClass {
    // Branch information
    branch?: {
        id: string;
        name: string;
        coaching_center_id: string;
    };
    // Teacher information
    teacher?: {
        id: string;
        full_name: string;
        username: string;
        avatar_url: string | null;
    };
}

// ============================================================
// CREATE & UPDATE TYPES
// ============================================================

/**
 * Create Branch Class Input
 * Fields required/allowed when creating a new class
 */
export interface CreateBranchClassInput {
    // Required fields
    branch_id: string;
    class_name: string;
    subject: string;
    grade_level: string;

    // Optional fields
    description?: string | null;
    batch_name?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    class_days?: DayOfWeek[] | null;
    start_time?: string | null;
    end_time?: string | null;
    max_students?: number;
    fees_frequency?: FeeFrequency;
    teacher_id?: string | null;
    status?: ClassStatus;
    is_visible?: boolean;
    prerequisites?: string[] | null;
    materials_required?: string[] | null;
    metadata?: Record<string, any> | null;
}

/**
 * Update Branch Class Input
 * All fields optional for partial updates
 */
export interface UpdateBranchClassInput {
    class_name?: string;
    subject?: string;
    description?: string | null;
    grade_level?: string;
    batch_name?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    class_days?: DayOfWeek[] | null;
    start_time?: string | null;
    end_time?: string | null;
    max_students?: number;
    fees_frequency?: FeeFrequency;
    teacher_id?: string | null;
    status?: ClassStatus;
    is_visible?: boolean;
    prerequisites?: string[] | null;
    materials_required?: string[] | null;
    metadata?: Record<string, any> | null;
}

// ============================================================
// FILTER & SEARCH TYPES
// ============================================================

/**
 * Branch Class Filters
 */
export interface BranchClassFilters {
    branch_id?: string;
    coaching_center_id?: string;
    teacher_id?: string;
    subject?: string;
    grade_level?: string;
    status?: ClassStatus | ClassStatus[];
    is_visible?: boolean;
    has_available_seats?: boolean;
    start_date_from?: string;
    start_date_to?: string;
    class_days?: DayOfWeek[];
    search_query?: string; // Search in name, subject, description
}

/**
 * Branch Class Sort Options
 */
export interface BranchClassSort {
    field:
    | 'class_name'
    | 'subject'
    | 'grade_level'
    | 'start_date'
    | 'start_time'
    | 'current_enrollment'
    | 'max_students'
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
 * Branch Class Search Result
 */
export interface BranchClassSearchResult {
    classes: PublicBranchClass[];
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
 * Branch Class Statistics
 */
export interface BranchClassStats {
    total_classes: number;
    active_classes: number;
    inactive_classes: number;
    full_classes: number;
    completed_classes: number;
    total_students_enrolled: number;
    total_capacity: number;
    average_utilization: number; // Percentage
    classes_by_subject: Record<string, number>;
    classes_by_grade: Record<string, number>;
    classes_by_status: Record<ClassStatus, number>;
}

/**
 * Class Schedule Info
 */
export interface ClassScheduleInfo {
    class_id: string;
    class_name: string;
    subject: string;
    day: DayOfWeek;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    teacher_name: string | null;
}

/**
 * Class Availability
 */
export interface ClassAvailability {
    class_id: string;
    is_available: boolean;
    available_seats: number;
    is_full: boolean;
    can_enroll: boolean;
    reason?: string; // Reason why enrollment is not possible
}

// ============================================================
// OPERATION RESULTS
// ============================================================

/**
 * Operation Result - Generic response wrapper
 */
export interface BranchClassOperationResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    validation_errors?: BranchClassValidationError[];
}

/**
 * Validation Error
 */
export interface BranchClassValidationError {
    field: string;
    message: string;
    code?: string;
}

// ============================================================
// DASHBOARD & SUMMARY TYPES
// ============================================================

/**
 * Class Dashboard Data
 */
export interface ClassDashboard {
    stats: BranchClassStats;
    recent_classes: PublicBranchClass[];
    upcoming_classes: PublicBranchClass[];
    classes_needing_attention: PublicBranchClass[]; // Full or inactive
}

/**
 * Teacher Class Summary
 */
export interface TeacherClassSummary {
    teacher_id: string;
    teacher_name: string;
    total_classes: number;
    active_classes: number;
    total_students: number;
    classes: PublicBranchClass[];
}

/**
 * Branch Class Summary (for branch dashboard)
 */
export interface BranchClassSummary {
    branch_id: string;
    branch_name: string;
    total_classes: number;
    active_classes: number;
    total_capacity: number;
    total_enrolled: number;
    utilization_rate: number;
}

// ============================================================
// CONSTANTS & DEFAULTS
// ============================================================

/**
 * Default values for creating a new class
 */
export const DEFAULT_BRANCH_CLASS_VALUES: Partial<CreateBranchClassInput> = {
    max_students: 30,
    fees_frequency: 'MONTHLY',
    status: 'ACTIVE',
    is_visible: true,
    prerequisites: [],
    materials_required: [],
    metadata: {},
} as const;

/**
 * Class status options with labels
 */
export const CLASS_STATUS_OPTIONS: Record<ClassStatus, { label: string; description: string }> = {
    ACTIVE: {
        label: 'Active',
        description: 'Class is currently active and accepting students',
    },
    INACTIVE: {
        label: 'Inactive',
        description: 'Class is temporarily inactive',
    },
    FULL: {
        label: 'Full',
        description: 'Class has reached maximum capacity',
    },
    COMPLETED: {
        label: 'Completed',
        description: 'Class has been completed',
    },
} as const;

/**
 * Fee frequency options with labels
 */
export const FEE_FREQUENCY_OPTIONS: Record<FeeFrequency, { label: string; description: string }> = {
    MONTHLY: {
        label: 'Monthly',
        description: 'Fees collected every month',
    },
    QUARTERLY: {
        label: 'Quarterly',
        description: 'Fees collected every 3 months',
    },
    YEARLY: {
        label: 'Yearly',
        description: 'Fees collected annually',
    },
} as const;

/**
 * Days of week array for iteration
 */
export const DAYS_OF_WEEK: DayOfWeek[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
] as const;

/**
 * Common grade levels
 */
export const COMMON_GRADE_LEVELS = [
    '1st', '2nd', '3rd', '4th', '5th',
    '6th', '7th', '8th', '9th', '10th',
    '11th', '12th',
    'Graduate', 'Post Graduate',
    'Diploma', 'Professional',
] as const;

/**
 * Common subjects
 */
export const COMMON_SUBJECTS = [
    'Mathematics',
    'Science',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'Hindi',
    'Social Studies',
    'History',
    'Geography',
    'Economics',
    'Computer Science',
    'Accountancy',
    'Business Studies',
] as const;
