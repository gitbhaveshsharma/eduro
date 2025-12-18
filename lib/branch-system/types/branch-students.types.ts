/**
 * Branch Students Types (Updated)
 * 
 * TypeScript interfaces and types for branch student profiles
 * Based on updated Supabase schema: 019_create_enrollment_update.sql
 * 
 * IMPORTANT: After migration 019, branch_students is now a pure "student profile per branch" table.
 * Class-specific enrollment data is now stored in the class_enrollments table.
 * 
 * @module branch-system/types/branch-students
 */

// Re-export enrollment status for backward compatibility
export type { ClassEnrollmentStatus as EnrollmentStatus } from './class-enrollments.types';

// ============================================================
// ENUMS - Matching Database Types
// ============================================================

/**
 * Payment status enum - matches database enum
 * This remains in branch_students for tracking overall payment status
 */
export type PaymentStatus =
    | 'PAID'        // Fees are fully paid
    | 'PARTIAL'     // Partial payment made
    | 'PENDING'     // Payment is pending
    | 'OVERDUE';    // Payment is overdue

// ============================================================
// CORE INTERFACES
// ============================================================

/**
 * Branch Student - Complete database record
 * Matches the updated branch_students table structure (post-migration 019)
 * 
 * This table now stores ONLY student profile information per branch.
 * NO class-specific enrollment fields (those are in class_enrollments).
 * NO uniqueness constraint on (student_id, branch_id).
 */
export interface BranchStudent {
    // Primary identification
    id: string; // UUID

    // Relationships
    student_id: string; // UUID - References auth.users(id)
    branch_id: string; // UUID - References coaching_branches(id)

    // Student information (cached from profile or manually entered)
    student_name: string | null;
    student_email: string | null;
    student_phone: string | null;

    // Financial tracking (branch-level summary)
    total_fees_due: number; // DECIMAL(10,2)
    total_fees_paid: number; // DECIMAL(10,2)
    last_payment_date: string | null; // ISO date string
    next_payment_due: string | null; // ISO date string
    payment_status: PaymentStatus;

    // Contact and emergency info
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    parent_guardian_name: string | null;
    parent_guardian_phone: string | null;

    // Branch-level student notes
    student_notes: string | null;

    // Registration tracking
    registration_date: string; // ISO date string - when student registered with this branch

    // Metadata
    metadata: Record<string, any> | null;

    // Timestamps
    created_at: string; // ISO timestamp
    updated_at: string; // ISO timestamp
}

/**
 * Public Branch Student - For display
 * Excludes sensitive internal fields
 */
export interface PublicBranchStudent {
    id: string;
    student_id: string;
    branch_id: string;
    student_name: string | null;
    student_email: string | null;
    student_phone: string | null;
    payment_status: PaymentStatus;
    next_payment_due: string | null;
    registration_date: string;
    created_at: string;
    updated_at: string;
    
    // Class enrollment fields (from class_enrollments)
    enrollment_status: string | null;
    attendance_percentage: number;
    class_name: string | null;
    
    // Computed fields
    outstanding_balance: number;
    is_payment_overdue: boolean;
}

/**
 * Student Editable Fields
 * Fields that students can update themselves
 */
export interface StudentEditableFields {
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    parent_guardian_name: string | null;
    parent_guardian_phone: string | null;
    student_notes: string | null;
}

/**
 * Manager Editable Fields
 * Fields that branch managers can update
 */
export interface ManagerEditableFields {
    student_name: string | null;
    student_email: string | null;
    student_phone: string | null;
    payment_status: PaymentStatus;
    total_fees_due: number;
    total_fees_paid: number;
    last_payment_date: string | null;
    next_payment_due: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    parent_guardian_name: string | null;
    parent_guardian_phone: string | null;
    student_notes: string | null;
    metadata: Record<string, any> | null;
}

/**
 * Branch Student with Relations - Includes related data
 */
export interface BranchStudentWithRelations extends BranchStudent {
    // Student profile information (from profiles table)
    student?: {
        id: string;
        full_name: string;
        username: string;
        email: string;
        avatar_url: string | null;
        phone: string | null;
    };
    
    // Branch information
    branch?: {
        id: string;
        name: string;
        coaching_center_id: string;
        address: string | null;
    };

    // Class enrollments for this student in this branch
    class_enrollments?: {
        id: string;
        class_id: string;
        class_name: string;
        enrollment_status: string;
        attendance_percentage: number;
    }[];
}

// ============================================================
// CREATE & UPDATE TYPES
// ============================================================

/**
 * Register Student in Branch Input
 * Fields required/allowed when registering a new student in a branch
 * 
 * Note: This creates a branch_students record (student profile in branch),
 * NOT a class enrollment. Use CreateClassEnrollmentInput for class enrollments.
 */
export interface RegisterStudentInBranchInput {
    // Required fields
    student_id: string;
    branch_id: string;

    // Optional student info (if different from profile)
    student_name?: string | null;
    student_email?: string | null;
    student_phone?: string | null;

    // Contact information
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    parent_guardian_name?: string | null;
    parent_guardian_phone?: string | null;

    // Notes
    student_notes?: string | null;

    // Registration date (defaults to current date)
    registration_date?: string;

    // Metadata
    metadata?: Record<string, any> | null;
}

/**
 * Update Student Self Input
 * Students can only update contact info
 */
export interface UpdateStudentSelfInput {
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    parent_guardian_name?: string | null;
    parent_guardian_phone?: string | null;
    student_notes?: string | null;
}

/**
 * Update Student By Manager Input
 * Branch managers can update most fields
 */
export interface UpdateStudentByManagerInput {
    student_name?: string | null;
    student_email?: string | null;
    student_phone?: string | null;
    payment_status?: PaymentStatus;
    total_fees_due?: number;
    total_fees_paid?: number;
    last_payment_date?: string | null;
    next_payment_due?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    parent_guardian_name?: string | null;
    parent_guardian_phone?: string | null;
    student_notes?: string | null;
    metadata?: Record<string, any> | null;
}

// ============================================================
// BACKWARD COMPATIBILITY - Legacy types for gradual migration
// ============================================================

/**
 * @deprecated Use RegisterStudentInBranchInput instead
 * Kept for backward compatibility during migration
 */
export interface EnrollStudentInput extends RegisterStudentInBranchInput {
    // Legacy field - now handled by class_enrollments
    class_id?: string | null;
    enrollment_date?: string;
    expected_completion_date?: string | null;
    preferred_batch?: string | null;
    special_requirements?: string | null;
}

/**
 * @deprecated Use UpdateClassEnrollmentByTeacherInput from class-enrollments.types
 * Kept for backward compatibility
 */
export interface UpdateStudentByTeacherInput {
    current_grade?: string | null;
    performance_notes?: string | null;
    attendance_percentage?: number;
}

// ============================================================
// FILTER & SEARCH TYPES
// ============================================================

/**
 * Branch Student Filters
 */
export interface BranchStudentFilters {
    student_id?: string;
    branch_id?: string;
    payment_status?: PaymentStatus | PaymentStatus[];
    has_overdue_payment?: boolean;
    registration_date_from?: string;
    registration_date_to?: string;
    search_query?: string; // Search in student name, notes
    
    // Legacy filters for backward compatibility
    class_id?: string;
    enrollment_status?: string | string[];
    enrollment_date_from?: string;
    enrollment_date_to?: string;
    attendance_min?: number;
    attendance_max?: number;
}

/**
 * Branch Student Sort Options
 */
export interface BranchStudentSort {
    field:
        | 'student_name'
        | 'registration_date'
        | 'payment_status'
        | 'total_fees_due'
        | 'total_fees_paid'
        | 'next_payment_due'
        | 'created_at'
        | 'updated_at'
        // Legacy fields for backward compatibility
        | 'enrollment_date'
        | 'enrollment_status'
        | 'attendance_percentage';
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
 * Branch Student Search Result
 */
export interface BranchStudentSearchResult {
    students: PublicBranchStudent[];
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
 * Student Enrollment Summary (for individual student)
 * Now combines data from branch_students and class_enrollments
 */
export interface StudentEnrollmentSummary {
    total_enrollments: number; // From class_enrollments
    active_enrollments: number; // From class_enrollments
    completed_enrollments: number; // From class_enrollments
    total_fees_due: number; // From branch_students
    total_fees_paid: number; // From branch_students
    outstanding_balance: number; // Computed
    average_attendance: number; // From class_enrollments
}

/**
 * Branch Student Statistics (for branch)
 */
export interface BranchStudentStats {
    total_students: number;
    students_with_overdue_payments: number;
    total_fees_collected: number;
    total_outstanding_fees: number;
    students_by_payment_status: Record<PaymentStatus, number>;
    
    // Class enrollment related stats (from class_enrollments)
    total_class_enrollments: number;
    active_class_enrollments: number;
    average_attendance: number;
    students_by_enrollment_status: Record<string, number>;
    students_by_class: Record<string, number>;
}

/**
 * Class Student Statistics
 * @deprecated Use ClassEnrollmentStats from class-enrollments.types
 */
export interface ClassStudentStats {
    class_id: string;
    class_name: string;
    total_enrolled: number;
    average_attendance: number;
    students_with_good_attendance: number;
    students_needing_attention: number;
    payment_compliance_rate: number;
}

/**
 * Student Financial Summary
 */
export interface StudentFinancialSummary {
    student_id: string;
    branch_student_id: string;
    total_fees_due: number;
    total_fees_paid: number;
    outstanding_balance: number;
    last_payment_date: string | null;
    next_payment_due: string | null;
    payment_status: PaymentStatus;
    is_overdue: boolean;
    overdue_days: number | null;
}

/**
 * Student Academic Summary
 * Now sourced from class_enrollments
 */
export interface StudentAcademicSummary {
    student_id: string;
    class_enrollment_id: string;
    class_name: string | null;
    subject: string | null;
    attendance_percentage: number;
    current_grade: string | null;
    performance_notes: string | null;
    enrollment_duration_days: number;
    is_on_track: boolean;
}

// ============================================================
// OPERATION RESULTS
// ============================================================

/**
 * Operation Result - Generic response wrapper
 */
export interface BranchStudentOperationResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    validation_errors?: BranchStudentValidationError[];
}

/**
 * Validation Error
 */
export interface BranchStudentValidationError {
    field: string;
    message: string;
    code?: string;
}

/**
 * Enrollment Result - Specific to enrollment operation
 * @deprecated Use ClassEnrollmentOperationResult for class enrollments
 */
export interface EnrollmentResult {
    success: boolean;
    enrollment_id?: string;
    message?: string;
    error?: string;
}

// ============================================================
// DASHBOARD & SUMMARY TYPES
// ============================================================

/**
 * Student Dashboard Data (for individual student)
 */
export interface StudentDashboard {
    branch_student: BranchStudentWithRelations;
    summary: StudentEnrollmentSummary;
    financial_summary: StudentFinancialSummary;
    class_enrollments: StudentAcademicSummary[];
    upcoming_payment: {
        due_date: string | null;
        amount: number;
        is_overdue: boolean;
    } | null;
}

/**
 * Branch Manager Dashboard
 */
export interface BranchManagerDashboard {
    stats: BranchStudentStats;
    recent_registrations: PublicBranchStudent[];
    students_needing_attention: PublicBranchStudent[];
    payment_due_soon: PublicBranchStudent[];
}

/**
 * Teacher Class Dashboard
 */
export interface TeacherClassDashboard {
    class_stats: ClassStudentStats;
    students: BranchStudentWithRelations[];
    attendance_summary: {
        excellent: number;
        good: number;
        needs_improvement: number;
        poor: number;
    };
}

// ============================================================
// CONSTANTS & DEFAULTS
// ============================================================

/**
 * Default values for registering a new student in a branch
 */
export const DEFAULT_BRANCH_STUDENT_VALUES: Partial<RegisterStudentInBranchInput> = {
    registration_date: new Date().toISOString().split('T')[0],
    metadata: {},
} as const;

/**
 * Payment status options with labels
 */
export const PAYMENT_STATUS_OPTIONS: Record<PaymentStatus, { label: string; description: string; color: string }> = {
    PAID: {
        label: 'Paid',
        description: 'Fees are fully paid',
        color: 'green',
    },
    PARTIAL: {
        label: 'Partial',
        description: 'Partial payment made',
        color: 'blue',
    },
    PENDING: {
        label: 'Pending',
        description: 'Payment is pending',
        color: 'yellow',
    },
    OVERDUE: {
        label: 'Overdue',
        description: 'Payment is overdue',
        color: 'red',
    },
} as const;

/**
 * Attendance thresholds
 */
export const ATTENDANCE_THRESHOLDS = {
    EXCELLENT: 90,
    GOOD: 75,
    NEEDS_IMPROVEMENT: 60,
    POOR: 0,
} as const;

/**
 * Payment warning thresholds (days before due)
 */
export const PAYMENT_WARNING_DAYS = {
    URGENT: 3,
    WARNING: 7,
    REMINDER: 14,
} as const;

// ============================================================
// RE-EXPORTS for backward compatibility
// ============================================================

// Re-export enrollment status options from class-enrollments for compatibility
export { CLASS_ENROLLMENT_STATUS_OPTIONS as ENROLLMENT_STATUS_OPTIONS } from './class-enrollments.types';
