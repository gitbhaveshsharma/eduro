/**
 * Branch Students Types
 * 
 * TypeScript interfaces and types for branch student enrollments
 * Based on Supabase schema: 016_create_branch_student_system.sql
 * 
 * @module branch-system/types/branch-students
 */

// ============================================================
// ENUMS - Matching Database Types
// ============================================================

/**
 * Student enrollment status enum - matches database enum
 */
export type EnrollmentStatus =
    | 'ENROLLED'    // Student is actively enrolled
    | 'PENDING'     // Enrollment is pending approval
    | 'SUSPENDED'   // Student is temporarily suspended
    | 'DROPPED'     // Student has dropped from the class
    | 'COMPLETED';  // Student has completed the class

/**
 * Payment status enum - matches database enum
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
 * Matches the branch_students table structure
 */
export interface BranchStudent {
    // Primary identification
    id: string; // UUID

    // Relationships
    student_id: string; // UUID - References auth.users(id)
    branch_id: string; // UUID - References coaching_branches(id)
    class_id: string | null; // UUID - References branch_classes(id)

    // Enrollment details
    enrollment_date: string; // ISO date string
    expected_completion_date: string | null; // ISO date string
    actual_completion_date: string | null; // ISO date string

    // Status tracking
    enrollment_status: EnrollmentStatus;
    payment_status: PaymentStatus;

    // Academic tracking
    attendance_percentage: number; // DECIMAL(5,2) - 0.0 to 100.0
    current_grade: string | null;
    performance_notes: string | null;

    // Financial tracking
    total_fees_due: number; // DECIMAL(10,2)
    total_fees_paid: number; // DECIMAL(10,2)
    last_payment_date: string | null; // ISO date string
    next_payment_due: string | null; // ISO date string

    // Contact and emergency info (student-specific)
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    parent_guardian_name: string | null;
    parent_guardian_phone: string | null;

    // Student preferences and notes
    preferred_batch: string | null;
    special_requirements: string | null;
    student_notes: string | null;

    // Metadata
    metadata: Record<string, any> | null;

    // Timestamps
    created_at: string; // ISO timestamp
    updated_at: string; // ISO timestamp
}

/**
 * Public Branch Student - For display to students
 * Excludes sensitive internal management fields
 */
export interface PublicBranchStudent {
    id: string;
    student_id: string;
    student_name: string;  // Student's display name from profile
    branch_id: string;
    class_id: string | null;
    enrollment_date: string;
    expected_completion_date: string | null;
    enrollment_status: EnrollmentStatus;
    payment_status: PaymentStatus;
    attendance_percentage: number;
    current_grade: string | null;
    next_payment_due: string | null;
    preferred_batch: string | null;
    special_requirements: string | null;
    student_notes: string | null;
    created_at: string;
    updated_at: string;
    // Computed fields
    outstanding_balance: number;
    is_payment_overdue: boolean;
    enrollment_duration_days: number;
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
    preferred_batch: string | null;
    special_requirements: string | null;
    student_notes: string | null;
}

/**
 * Teacher Editable Fields
 * Fields that teachers can update for their students
 */
export interface TeacherEditableFields {
    current_grade: string | null;
    performance_notes: string | null;
    attendance_percentage: number;
}

/**
 * Manager Editable Fields
 * Fields that branch managers can update
 */
export interface ManagerEditableFields extends TeacherEditableFields {
    class_id: string | null;
    enrollment_status: EnrollmentStatus;
    payment_status: PaymentStatus;
    total_fees_due: number;
    total_fees_paid: number;
    last_payment_date: string | null;
    next_payment_due: string | null;
    expected_completion_date: string | null;
    actual_completion_date: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    parent_guardian_name: string | null;
    parent_guardian_phone: string | null;
    preferred_batch: string | null;
    special_requirements: string | null;
    metadata: Record<string, any> | null;
}

/**
 * Branch Student with Relations - Includes related data
 */
export interface BranchStudentWithRelations extends BranchStudent {
    // Student profile information
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
    // Class information
    class?: {
        id: string;
        class_name: string;
        subject: string;
        grade_level: string;
        batch_name: string | null;
        teacher_id: string | null;
    };
}

// ============================================================
// CREATE & UPDATE TYPES
// ============================================================

/**
 * Enroll Student Input
 * Fields required/allowed when enrolling a new student
 */
export interface EnrollStudentInput {
    // Required fields
    student_id: string;
    branch_id: string;

    // Optional fields
    class_id?: string | null;
    enrollment_date?: string; // Defaults to current date
    expected_completion_date?: string | null;

    // Contact information
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    parent_guardian_name?: string | null;
    parent_guardian_phone?: string | null;

    // Preferences
    preferred_batch?: string | null;
    special_requirements?: string | null;
    student_notes?: string | null;

    // Metadata
    metadata?: Record<string, any> | null;
}

/**
 * Update Student Enrollment Input (by student)
 * Students can only update contact info and preferences
 */
export interface UpdateStudentSelfInput {
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    parent_guardian_name?: string | null;
    parent_guardian_phone?: string | null;
    preferred_batch?: string | null;
    special_requirements?: string | null;
    student_notes?: string | null;
}

/**
 * Update Student Enrollment Input (by teacher)
 * Teachers can update academic fields
 */
export interface UpdateStudentByTeacherInput {
    current_grade?: string | null;
    performance_notes?: string | null;
    attendance_percentage?: number;
}

/**
 * Update Student Enrollment Input (by manager)
 * Branch managers can update most fields
 */
export interface UpdateStudentByManagerInput {
    class_id?: string | null;
    expected_completion_date?: string | null;
    actual_completion_date?: string | null;
    enrollment_status?: EnrollmentStatus;
    payment_status?: PaymentStatus;
    attendance_percentage?: number;
    current_grade?: string | null;
    performance_notes?: string | null;
    total_fees_due?: number;
    total_fees_paid?: number;
    last_payment_date?: string | null;
    next_payment_due?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    parent_guardian_name?: string | null;
    parent_guardian_phone?: string | null;
    preferred_batch?: string | null;
    special_requirements?: string | null;
    metadata?: Record<string, any> | null;
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
    class_id?: string;
    enrollment_status?: EnrollmentStatus | EnrollmentStatus[];
    payment_status?: PaymentStatus | PaymentStatus[];
    enrollment_date_from?: string;
    enrollment_date_to?: string;
    has_overdue_payment?: boolean;
    attendance_min?: number;
    attendance_max?: number;
    search_query?: string; // Search in student name, notes
}

/**
 * Branch Student Sort Options
 */
export interface BranchStudentSort {
    field:
    | 'student_name'
    | 'enrollment_date'
    | 'enrollment_status'
    | 'payment_status'
    | 'attendance_percentage'
    | 'total_fees_due'
    | 'total_fees_paid'
    | 'next_payment_due'
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
 */
export interface StudentEnrollmentSummary {
    total_enrollments: number;
    active_enrollments: number;
    completed_enrollments: number;
    total_fees_due: number;
    total_fees_paid: number;
    outstanding_balance: number;
    average_attendance: number;
}

/**
 * Branch Student Statistics (for branch)
 */
export interface BranchStudentStats {
    total_students: number;
    enrolled_students: number;
    pending_students: number;
    suspended_students: number;
    dropped_students: number;
    completed_students: number;
    students_with_overdue_payments: number;
    total_fees_collected: number;
    total_outstanding_fees: number;
    average_attendance: number;
    students_by_class: Record<string, number>;
    students_by_payment_status: Record<PaymentStatus, number>;
    students_by_enrollment_status: Record<EnrollmentStatus, number>;
}

/**
 * Class Student Statistics
 */
export interface ClassStudentStats {
    class_id: string;
    class_name: string;
    total_enrolled: number;
    average_attendance: number;
    students_with_good_attendance: number; // >= 75%
    students_needing_attention: number; // < 60%
    payment_compliance_rate: number; // % of students with paid/partial status
}

/**
 * Student Financial Summary
 */
export interface StudentFinancialSummary {
    student_id: string;
    enrollment_id: string;
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
 */
export interface StudentAcademicSummary {
    student_id: string;
    enrollment_id: string;
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
    enrollment: BranchStudentWithRelations;
    summary: StudentEnrollmentSummary;
    financial_summary: StudentFinancialSummary;
    academic_summary: StudentAcademicSummary;
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
    recent_enrollments: PublicBranchStudent[];
    students_needing_attention: PublicBranchStudent[]; // Overdue payments, low attendance
    payment_due_soon: PublicBranchStudent[]; // Payments due in next 7 days
}

/**
 * Teacher Class Dashboard
 */
export interface TeacherClassDashboard {
    class_stats: ClassStudentStats;
    students: BranchStudentWithRelations[];
    attendance_summary: {
        excellent: number; // >= 90%
        good: number; // 75-89%
        needs_improvement: number; // 60-74%
        poor: number; // < 60%
    };
}

// ============================================================
// CONSTANTS & DEFAULTS
// ============================================================

/**
 * Default values for enrolling a new student
 */
export const DEFAULT_BRANCH_STUDENT_VALUES: Partial<EnrollStudentInput> = {
    enrollment_date: new Date().toISOString().split('T')[0],
    metadata: {},
} as const;

/**
 * Enrollment status options with labels
 */
export const ENROLLMENT_STATUS_OPTIONS: Record<EnrollmentStatus, { label: string; description: string; color: string }> = {
    ENROLLED: {
        label: 'Enrolled',
        description: 'Student is actively enrolled',
        color: 'green',
    },
    PENDING: {
        label: 'Pending',
        description: 'Enrollment is pending approval',
        color: 'yellow',
    },
    SUSPENDED: {
        label: 'Suspended',
        description: 'Student is temporarily suspended',
        color: 'orange',
    },
    DROPPED: {
        label: 'Dropped',
        description: 'Student has dropped from the class',
        color: 'red',
    },
    COMPLETED: {
        label: 'Completed',
        description: 'Student has completed the class',
        color: 'blue',
    },
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
