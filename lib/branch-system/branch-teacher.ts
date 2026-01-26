/**
 * Branch Teacher Module - Main Export
 * 
 * Central export point for all branch teacher assignment functionality
 * 
 * @module branch-system/branch-teacher
 */

// ============================================================
// TYPES
// ============================================================

export type {
    // Core interfaces
    BranchTeacher,
    PublicBranchTeacher,
    TeacherSelfEditableFields,
    ManagerEditableFields,
    BranchTeacherWithRelations,

    // Enums
    AssignmentStatus,
    DayOfWeek,
    ExperienceLevel,

    // Input types
    AssignTeacherInput,
    UpdateTeacherSelfInput,
    UpdateTeacherByManagerInput,

    // Filter & search types
    BranchTeacherFilters,
    BranchTeacherSort,
    PaginationOptions,
    BranchTeacherSearchResult,

    // Statistics & analytics
    TeacherAssignmentSummary,
    BranchTeacherStats,
    SubjectCoverageStats,
    TeacherScheduleItem,

    // Operation results
    BranchTeacherOperationResult,
    BranchTeacherValidationError,
    AssignmentResult,

    // Dashboard types
    TeacherDashboard,
    BranchManagerTeacherDashboard,
} from './types/branch-teacher.types';

export {
    // Constants
    DEFAULT_BRANCH_TEACHER_VALUES,
    DAYS_OF_WEEK_OPTIONS,
    EXPERIENCE_THRESHOLDS,
    EXPERIENCE_LEVEL_OPTIONS,
    ASSIGNMENT_STATUS_OPTIONS,
} from './types/branch-teacher.types';

// ============================================================
// VALIDATION
// ============================================================

export {
    // Schemas
    assignTeacherSchema,
    updateTeacherSelfSchema,
    updateTeacherByManagerSchema,
    branchTeacherFilterSchema,
    branchTeacherSortSchema,
    paginationSchema,
    assignmentIdSchema,

    // Base schemas
    uuidSchema,
    dayOfWeekSchema,
    experienceLevelSchema,
    dateSchema,
    timeSchema,
    subjectNameSchema,
    teachingSubjectsSchema,
    availableDaysSchema,
    experienceYearsSchema,
    hourlyRateSchema,
    notesSchema,
    metadataSchema,

    // Validation functions
    validateAssignTeacher,
    validateUpdateTeacherSelf,
    validateUpdateTeacherByManager,
    validateBranchTeacherFilter,
    validateBranchTeacherSort,
    validatePagination,
    validateAssignmentId,

    // Constants
    BRANCH_TEACHER_LIMITS,
} from './validations/branch-teacher.validation';

export type {
    // Inferred types
    AssignTeacherInput as AssignTeacherValidatedInput,
    UpdateTeacherSelfInput as UpdateTeacherSelfValidatedInput,
    UpdateTeacherByManagerInput as UpdateTeacherByManagerValidatedInput,
    BranchTeacherFilter,
    BranchTeacherSortInput,
    PaginationInput,
} from './validations/branch-teacher.validation';

// ============================================================
// UTILITIES
// ============================================================

export {
    // Data transformation
    toPublicBranchTeacher,
    toPublicBranchTeachers,

    // Experience calculations
    getExperienceLevel,
    getExperienceLevelLabel,
    calculateAverageExperience,

    // Availability functions
    formatAvailabilitySummary,
    isConsecutiveDays,
    isAvailableOnDay,
    getTeachersAvailableOnDay,
    calculateWeeklyHours,
    calculateTimeDifferenceHours,

    // Subject functions
    getUniqueSubjects,
    getTeachersBySubject,
    isSubjectCovered,
    calculateSubjectCoverageStats,

    // Statistics calculations
    calculateTeacherAssignmentSummary,
    calculateBranchTeacherStats,

    // Attention & filtering
    isAssignmentEndingSoon,
    getTeachersNeedingAttention,
    filterActiveTeachers,
    filterByExperienceLevel,

    // Formatting
    formatTime,
    formatCurrency,
    formatPhoneNumber,
    formatDate,
    formatExperience,
    formatSubjects,
    formatAvailableDays,

    // Sorting
    sortByExperience,
    sortByName,
    sortByAssignmentDate,
    sortByHourlyRate,
} from './utils/branch-teacher.utils';

// ============================================================
// SERVICE
// ============================================================

export {
    BranchTeacherService,
    branchTeacherService,
} from './services/branch-teacher.service';

// ============================================================
// STORE (Zustand)
// ============================================================

export {
    useBranchTeacherStore,

    // Selectors
    selectAssignmentById,
    selectCurrentAssignment,
    selectCurrentAssignmentWithRelations,
    selectBranchTeachers,
    selectTeacherAssignments,
    selectLoading,
    selectListLoading,
    selectStatsLoading,
    selectError,
    selectValidationErrors,
    selectStats,
    selectSummary,
    selectBranchSubjects,
    selectSearchResult,
    selectDialogStates,
    selectFilters,
    selectSort,
    selectPagination,
} from './stores/branch-teacher.store';

// ============================================================
// TEACHER DASHBOARD
// ============================================================

// Dashboard types
export type {
    TeacherDashboardStats,
    TodayScheduleItem,
    FormattedScheduleItem,
    GradingStats,
    UpcomingDeadline,
    FormattedDeadline,
    AtRiskStudents,
    ClassAssignmentStats,
    RecentActivity,
    DashboardQuickStats,
    ChartDataItem,
    GradingChartData,
    ClassPerformanceData,
    DashboardFetchParams,
    DashboardOperationResult,
    DashboardCacheEntry,
    DashboardCacheConfig,
    DashboardSection,
} from './types/teacher-dashboard.types';

export {
    DASHBOARD_CACHE_TTL,
    DEADLINE_URGENCY_THRESHOLDS,
    AT_RISK_ATTENDANCE_THRESHOLD,
    PASSING_SCORE_THRESHOLD,
    DASHBOARD_COLORS,
} from './types/teacher-dashboard.types';

// Dashboard utilities
export {
    formatTime as formatScheduleTime,
    formatTimeRange,
    getScheduleStatus,
    formatDate as formatDashboardDate,
    formatDeadlineDate,
    getDaysUntilDue,
    formatScheduleItems,
    formatDeadlines,
    extractQuickStats,
    prepareGradingChartData,
    prepareClassPerformanceData,
    prepareActivityChartData,
    getSubjectColor,
    calculatePercentage,
    getProgressColor,
    getUrgencyVariant,
    sortScheduleByTime,
    sortDeadlinesByUrgency,
    filterClassesWithPendingGrading,
    getScheduleSummary,
    getGradingSummary,
    getAtRiskSummary,
    hasDashboardData,
    hasPendingGrading,
    hasAtRiskStudents,
} from './utils/teacher-dashboard.utils';

// Dashboard store
export {
    useTeacherDashboardStore,
    selectDashboardStats,
    selectQuickStats,
    selectFormattedSchedule,
    selectFormattedDeadlines,
    selectDashboardLoading,
    selectDashboardRefreshing,
    selectDashboardError,
    selectGradingStats,
    selectAtRiskStudents,
    selectAssignmentsByClass,
    selectRecentActivity,
    selectTodaySchedule,
} from './stores/teacher-dashboard.store';
