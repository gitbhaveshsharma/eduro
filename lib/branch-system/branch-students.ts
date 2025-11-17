/**
 * Branch Students Module - Main Export
 * 
 * Central export point for all branch student enrollment functionality
 * 
 * @module branch-system/branch-students
 */

// ============================================================
// TYPES
// ============================================================

export type {
    // Core interfaces
    BranchStudent,
    PublicBranchStudent,
    StudentEditableFields,
    TeacherEditableFields,
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
// VALIDATION
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
// SERVICE
// ============================================================

export {
    BranchStudentsService,
    branchStudentsService,
} from './services/branch-students.service';

// ============================================================
// STORE (Zustand)
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
