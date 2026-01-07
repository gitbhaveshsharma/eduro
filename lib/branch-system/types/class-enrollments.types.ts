/**
 * Class Enrollments Types
 * 
 * TypeScript interfaces and types for class enrollments (junction table)
 * Based on Supabase schema: 019_create_enrollment_update.sql
 * 
 * This module handles the NEW class_enrollments table which tracks
 * which classes students are enrolled in. One student can be enrolled
 * in multiple classes within the same branch.
 * 
 * @module branch-system/types/class-enrollments
 */

// ============================================================
// ENUMS - Matching Database Types
// ============================================================

/**
 * Class enrollment status enum - matches database enum
 */
export type ClassEnrollmentStatus =
    | 'null'  // Placeholder for no enrollment
    | 'ENROLLED'    // Student is actively enrolled in the class
    | 'PENDING'     // Enrollment is pending approval
    | 'SUSPENDED'   // Student is temporarily suspended from the class
    | 'DROPPED'     // Student has dropped from the class
    | 'COMPLETED';  // Student has completed the class

// ============================================================
// CORE INTERFACES
// ============================================================

/**
 * Class Enrollment - Complete database record
 * Matches the class_enrollments table structure
 * 
 * This is the junction table that links students to classes.
 * A student can have multiple class enrollments in the same branch.
 */
export interface ClassEnrollment {
    // Primary identification
    id: string; // UUID

    // Core Relationships
    student_id: string; // UUID - References auth.users(id)
    branch_id: string; // UUID - References coaching_branches(id)
    class_id: string; // UUID - References branch_classes(id)

    // Link to branch_students (optional, for tracking student profile)
    branch_student_id: string | null; // UUID - References branch_students(id)

    // Enrollment Details
    enrollment_date: string; // ISO date string
    enrollment_status: ClassEnrollmentStatus;
    expected_completion_date: string | null; // ISO date string
    actual_completion_date: string | null; // ISO date string

    // Academic Tracking (per class)
    attendance_percentage: number; // DECIMAL(5,2) - 0.0 to 100.0
    current_grade: string | null;
    performance_notes: string | null;

    // Class-specific preferences
    preferred_batch: string | null;
    special_requirements: string | null;

    // Metadata
    metadata: Record<string, any> | null;

    // Timestamps
    created_at: string; // ISO timestamp
    updated_at: string; // ISO timestamp
}

/**
 * Public Class Enrollment - For display to students
 * Excludes sensitive internal management fields
 */
export interface PublicClassEnrollment {
    id: string;
    student_id: string;
    branch_id: string;
    class_id: string;
    enrollment_date: string;
    enrollment_status: ClassEnrollmentStatus;
    expected_completion_date: string | null;
    attendance_percentage: number;
    current_grade: string | null;
    preferred_batch: string | null;
    special_requirements: string | null;
    created_at: string;
    updated_at: string;

    // Computed fields
    enrollment_duration_days: number;
    is_on_track: boolean;
}

/**
 * Class Enrollment with Relations - Includes related data from view
 * Maps to student_enrollment_details view
 */
export interface ClassEnrollmentWithRelations extends ClassEnrollment {
    // Student profile information (from profiles table)
    student?: {
        id: string;
        full_name: string;
        username: string;
        email: string;
        avatar_url: string | null;
        phone: string | null;
        date_of_birth: string | null;
        gender: string | null;
    };

    // Branch student info (from branch_students table)
    branch_student?: {
        id: string;
        student_name: string | null;
        student_email: string | null;
        student_phone: string | null;
        emergency_contact_name: string | null;
        emergency_contact_phone: string | null;
        parent_guardian_name: string | null;
        parent_guardian_phone: string | null;
        student_notes: string | null;
        // Financial tracking from branch_students
        total_fees_due: number;
        total_fees_paid: number;
        last_payment_date: string | null;
        next_payment_due: string | null;
        payment_status: string | null;
    };

    // Student address information
    student_address?: {
        id: string;
        address_type: string | null;
        label: string | null;
        address_line_1: string | null;
        address_line_2: string | null;
        city: string | null;
        district: string | null;
        state: string | null;
        pin_code: string | null;
        country: string | null;
    };

    // Branch information
    branch?: {
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
        is_main_branch: boolean;
        description: string | null;
    };

    // Branch manager information
    branch_manager?: {
        full_name: string | null;
        email: string | null;
        phone: string | null;
    };

    // Class information
    class?: {
        id: string;
        class_name: string;
        subject: string | null;
        grade_level: string | null;
        batch_name: string | null;
        start_date: string | null;
        end_date: string | null;
        start_time: string | null;
        end_time: string | null;
        class_days: string[] | null;
        max_students: number | null;
        current_enrollment: number | null;
        fees_amount: number | null;
        fees_frequency: string | null;
        status: string | null;
    };

    // Teacher information
    teacher?: {
        id: string;
        full_name: string | null;
        email: string | null;
        phone: string | null;
        avatar_url: string | null;
    };

    // Aggregate statistics from view
    total_days_present?: number;
    total_days_absent?: number;
    total_receipts_paid?: number;
    total_receipts_pending?: number;
    total_amount_paid_via_receipts?: number;

    // Computed fields from view
    days_enrolled?: number;
    days_until_completion?: number | null;
    is_payment_overdue?: boolean;
    days_until_payment_due?: number | null;
    outstanding_balance?: number;
    payment_completion_percentage?: number;
}

// ============================================================
// CREATE & UPDATE TYPES
// ============================================================

/**
 * Create Class Enrollment Input
 * Fields required/allowed when enrolling a student in a class
 */
export interface CreateClassEnrollmentInput {
    // Required fields
    student_id: string;
    branch_id: string;
    class_id: string;

    // Optional fields
    branch_student_id?: string | null;
    enrollment_date?: string; // Defaults to current date
    enrollment_status?: ClassEnrollmentStatus;
    expected_completion_date?: string | null;

    // Class-specific preferences
    preferred_batch?: string | null;
    special_requirements?: string | null;

    // Metadata
    metadata?: Record<string, any> | null;
}

/**
 * Update Class Enrollment Input (by teacher)
 * Teachers can update academic fields
 */
export interface UpdateClassEnrollmentByTeacherInput {
    current_grade?: string | null;
    performance_notes?: string | null;
    attendance_percentage?: number;
}

/**
 * Update Class Enrollment Input (by manager/admin)
 * Managers can update most fields
 */
export interface UpdateClassEnrollmentByManagerInput {
    enrollment_status?: ClassEnrollmentStatus;
    expected_completion_date?: string | null;
    actual_completion_date?: string | null;
    attendance_percentage?: number;
    current_grade?: string | null;
    performance_notes?: string | null;
    preferred_batch?: string | null;
    special_requirements?: string | null;
    metadata?: Record<string, any> | null;
}

// ============================================================
// FILTER & SEARCH TYPES
// ============================================================

/**
 * Class Enrollment Filters
 */
export interface ClassEnrollmentFilters {
    student_id?: string;
    branch_id?: string;
    class_id?: string;
    branch_student_id?: string;
    enrollment_status?: ClassEnrollmentStatus | ClassEnrollmentStatus[];
    enrollment_date_from?: string;
    enrollment_date_to?: string;
    attendance_min?: number;
    attendance_max?: number;
    search_query?: string; // Search in student name, class name
}

/**
 * Class Enrollment Sort Options
 */
export interface ClassEnrollmentSort {
    field:
    | 'student_name'
    | 'class_name'
    | 'enrollment_date'
    | 'enrollment_status'
    | 'attendance_percentage'
    | 'current_grade'
    | 'created_at'
    | 'updated_at';
    direction: 'asc' | 'desc';
}

/**
 * Class Enrollment Search Result
 */
export interface ClassEnrollmentSearchResult {
    enrollments: PublicClassEnrollment[];
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
 * Class Enrollment Statistics (for a specific class)
 */
export interface ClassEnrollmentStats {
    class_id: string;
    class_name: string;
    total_enrolled: number;
    pending_enrollments: number;
    suspended_enrollments: number;
    dropped_enrollments: number;
    completed_enrollments: number;
    average_attendance: number;
    students_with_good_attendance: number; // >= 75%
    students_needing_attention: number; // < 60%
}

/**
 * Student Class Enrollment Summary
 * Summary of all class enrollments for a specific student
 */
export interface StudentClassEnrollmentSummary {
    student_id: string;
    total_class_enrollments: number;
    active_class_enrollments: number;
    completed_class_enrollments: number;
    average_attendance: number;
    classes_by_status: Record<ClassEnrollmentStatus, number>;
}

/**
 * Branch Class Enrollment Overview
 * Overview of all class enrollments in a branch
 */
export interface BranchClassEnrollmentOverview {
    branch_id: string;
    total_enrollments: number;
    enrollments_by_status: Record<ClassEnrollmentStatus, number>;
    enrollments_by_class: Record<string, number>;
    average_attendance: number;
}

// ============================================================
// OPERATION RESULTS
// ============================================================

/**
 * Operation Result - Generic response wrapper
 */
export interface ClassEnrollmentOperationResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    validation_errors?: ClassEnrollmentValidationError[];
}

/**
 * Validation Error
 */
export interface ClassEnrollmentValidationError {
    field: string;
    message: string;
    code?: string;
}

// ============================================================
// CONSTANTS & DEFAULTS
// ============================================================

/**
 * Default values for creating a new class enrollment
 */
export const DEFAULT_CLASS_ENROLLMENT_VALUES: Partial<CreateClassEnrollmentInput> = {
    enrollment_date: new Date().toISOString().split('T')[0],
    enrollment_status: 'ENROLLED',
    metadata: {},
} as const;

/**
 * Class enrollment status options with labels
 */
export const CLASS_ENROLLMENT_STATUS_OPTIONS: Record<ClassEnrollmentStatus, { label: string; description: string; color: string }> = {
    ENROLLED: {
        label: 'Enrolled',
        description: 'Student is actively enrolled in the class',
        color: 'success',  // Changed from 'green' to 'success'
    },
    PENDING: {
        label: 'Pending',
        description: 'Class enrollment is pending approval',
        color: 'warning',  // Changed from 'yellow' to 'warning'
    },
    SUSPENDED: {
        label: 'Suspended',
        description: 'Student is temporarily suspended from the class',
        color: 'warning',  // Changed from 'orange' to 'warning' (closest match)
    },
    DROPPED: {
        label: 'Dropped',
        description: 'Student has dropped from the class',
        color: 'destructive',  // Changed from 'red' to 'destructive'
    },
    COMPLETED: {
        label: 'Completed',
        description: 'Student has completed the class',
        color: 'secondary',  // Changed from 'blue' to 'secondary'
    },
    'null': {
        label: 'Not Enrolled',
        description: 'Student is not enrolled in any class',
        color: 'muted',  // Changed from 'gray' to 'muted'
    },
} as const;


/**
 * Attendance thresholds for class enrollments
 */
export const CLASS_ATTENDANCE_THRESHOLDS = {
    EXCELLENT: 90,
    GOOD: 75,
    NEEDS_IMPROVEMENT: 60,
    POOR: 0,
} as const;
