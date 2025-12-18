/**
 * Branch Students Module - Main Export
 * 
 * Central export point for all branch student enrollment functionality
 * 
 * @module branch-system/branch-students
 * 
 * @version 2.0.0
 * @since 2024
 * 
 * @description
 * This module has been refactored to separate branch student profiles from class enrollments.
 * 
 * Key concepts:
 * - `branch_students`: Student profile per branch (demographics, contact info, registration)
 * - `class_enrollments`: Junction table for student-class relationships
 * - `student_enrollment_details`: Database view combining both for queries
 * 
 * Migration guide:
 * - Use `ClassEnrollmentsService` for class-specific operations
 * - Use `BranchStudentsService` for student profile operations
 * - Legacy methods are marked @deprecated and delegate to new services
 */

// ============================================================
// TYPES - Branch Students (Profile)
// ============================================================

export type {
    // Core interfaces
    BranchStudent,
    PublicBranchStudent,
    StudentEditableFields,
    ManagerEditableFields,
    BranchStudentWithRelations,

    // Enums
    EnrollmentStatus,
    PaymentStatus,

    // Input types
    EnrollStudentInput,
    UpdateStudentSelfInput,
    UpdateStudentByTeacherInput,
    UpdateStudentByManagerInput,

    // Filter & search types
    BranchStudentFilters,
    BranchStudentSort,
    PaginationOptions,
    BranchStudentSearchResult,

    // Statistics & analytics
    StudentEnrollmentSummary,
    BranchStudentStats,
    ClassStudentStats,
    StudentFinancialSummary,
    StudentAcademicSummary,

    // Operation results
    BranchStudentOperationResult,
    BranchStudentValidationError,
    EnrollmentResult,

    // Dashboard types
    StudentDashboard,
    BranchManagerDashboard,
    TeacherClassDashboard,
} from './types/branch-students.types';

export {
    // Constants
    DEFAULT_BRANCH_STUDENT_VALUES,
    ENROLLMENT_STATUS_OPTIONS,
    PAYMENT_STATUS_OPTIONS,
    ATTENDANCE_THRESHOLDS,
    PAYMENT_WARNING_DAYS,
} from './types/branch-students.types';

// ============================================================
// TYPES - Class Enrollments (NEW)
// ============================================================

export type {
    // Core interfaces
    ClassEnrollment,
    PublicClassEnrollment,
    ClassEnrollmentWithRelations,

    // Status enum
    ClassEnrollmentStatus,

    // Input types
    CreateClassEnrollmentInput,
    UpdateClassEnrollmentByTeacherInput,
    UpdateClassEnrollmentByManagerInput,

    // Filter & search types
    ClassEnrollmentFilters,
    ClassEnrollmentSort,
    ClassEnrollmentSearchResult,

    // Statistics & analytics
    ClassEnrollmentStats,
    StudentClassEnrollmentSummary,
    BranchClassEnrollmentOverview,

    // Operation results
    ClassEnrollmentOperationResult,
    ClassEnrollmentValidationError,
} from './types/class-enrollments.types';

export {
    // Constants
    CLASS_ENROLLMENT_STATUS_OPTIONS,
    DEFAULT_CLASS_ENROLLMENT_VALUES,
} from './types/class-enrollments.types';

// ============================================================
// VALIDATION - Branch Students
// ============================================================

export {
    // Schemas
    enrollStudentSchema,
    updateStudentSelfSchema,
    updateStudentByTeacherSchema,
    updateStudentByManagerSchema,
    branchStudentFilterSchema,
    branchStudentSortSchema,
    paginationSchema,
    enrollmentIdSchema,

    // Base schemas
    uuidSchema,
    enrollmentStatusSchema,
    paymentStatusSchema,
    dateSchema,
    contactNameSchema,
    phoneSchema,
    attendancePercentageSchema,
    feesAmountSchema,
    gradeSchema,
    performanceNotesSchema,
    studentNotesSchema,
    batchNameSchema,
    specialRequirementsSchema,
    metadataSchema,

    // Validation functions
    validateEnrollStudent,
    validateUpdateStudentSelf,
    validateUpdateStudentByTeacher,
    validateUpdateStudentByManager,
    validateBranchStudentFilter,
    validateBranchStudentSort,
    validatePagination,
    validateEnrollmentId,

    // Constants
    BRANCH_STUDENT_LIMITS,
} from './validations/branch-students.validation';

export type {
    // Inferred types
    EnrollStudentInput as EnrollStudentValidatedInput,
    UpdateStudentSelfInput as UpdateStudentSelfValidatedInput,
    UpdateStudentByTeacherInput as UpdateStudentByTeacherValidatedInput,
    UpdateStudentByManagerInput as UpdateStudentByManagerValidatedInput,
    BranchStudentFilter,
    BranchStudentSort as BranchStudentSortValidated,
    PaginationInput,
} from './validations/branch-students.validation';

// ============================================================
// VALIDATION - Class Enrollments (NEW)
// ============================================================

export {
    // Schemas
    createClassEnrollmentSchema,
    updateClassEnrollmentByTeacherSchema,
    updateClassEnrollmentByManagerSchema,
    classEnrollmentFilterSchema,
    classEnrollmentSortSchema,
    classEnrollmentIdSchema,

    // Base schemas
    classEnrollmentStatusSchema,

    // Validation functions
    validateCreateClassEnrollment,
    validateUpdateClassEnrollmentByTeacher,
    validateUpdateClassEnrollmentByManager,
    validateClassEnrollmentFilter,
    validateClassEnrollmentSort,
    validateClassEnrollmentId,

    // Constants
    CLASS_ENROLLMENT_LIMITS,
} from './validations/class-enrollments.validation';

// export type {
//     // Inferred types
//     CreateClassEnrollmentValidated,
//     UpdateClassEnrollmentByTeacherValidated,
//     UpdateClassEnrollmentByManagerValidated,
//     BulkClassEnrollmentValidated,
//     ClassEnrollmentFilterValidated,
//     ClassEnrollmentSortValidated,
// } from './validations/class-enrollments.validation';

// ============================================================
// UTILITIES
// ============================================================

export {
    // Data transformation
    toPublicBranchStudent,
    toPublicBranchStudents,

    // Financial calculations
    calculateOutstandingBalance,
    checkPaymentOverdue,
    calculateDaysUntilPayment,
    getPaymentUrgency,
    calculatePaymentComplianceRate,

    // Academic calculations
    calculateEnrollmentDuration,
    getAttendanceStatus,
    studentNeedsAttention,
    isStudentOnTrack,

    // Statistics calculations
    calculateStudentEnrollmentSummary,
    calculateBranchStudentStats,
    calculateClassStudentStats,
    createStudentFinancialSummary,
    createStudentAcademicSummary,

    // Filtering & sorting
    filterStudentsNeedingAttention,
    filterStudentsWithUpcomingPayments,
    sortByAttendance,
    sortByOutstandingBalance,

    // Formatting
    formatCurrency,
    formatPhoneNumber,
    formatDate,
    formatEnrollmentStatus,
    formatPaymentStatus,
} from './utils/branch-students.utils';

// ============================================================
// SERVICE - Branch Students
// ============================================================

export {
    BranchStudentsService,
    branchStudentsService,
} from './services/branch-students.service';

// ============================================================
// SERVICE - Class Enrollments (NEW)
// ============================================================

export {
    ClassEnrollmentsService,
    classEnrollmentsService,
} from './services/class-enrollments.service';

// ============================================================
// STORE (Zustand) - Branch Students
// ============================================================

export {
    useBranchStudentsStore,

    // Selectors
    selectEnrollmentById,
    selectCurrentEnrollment,
    selectBranchStudents,
    selectLoading,
    selectListLoading,
    selectError,
    selectValidationErrors,
    selectStats,
    selectSummary,
} from './stores/branch-students.store';

// ============================================================
// STORE (Zustand) - Class Enrollments (NEW)
// ============================================================

export {
    useClassEnrollmentsStore,
} from './stores/class-enrollments.store';
