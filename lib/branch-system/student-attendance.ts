/**
 * Student Attendance System - Central Export
 * 
 * Main export file for the student attendance system.
 * Provides centralized access to all attendance-related functionality including
 * types, validations, utilities, services, and stores.
 * 
 * @module branch-system/student-attendance
 */

// ============================================================
// SERVICE & STORE EXPORTS
// ============================================================

export {
    StudentAttendanceService,
    studentAttendanceService,
    type AttendanceOperationResult,
    type AttendanceValidationError,
} from './services/student-attendance.service';

import { studentAttendanceService } from './services/student-attendance.service';
import {
    useStudentAttendanceStore,
    useAttendanceActions,
    useAttendanceRecords,
    useDailyAttendanceRecords,
    useAttendanceLoading,
    useAttendanceError,
} from './stores/student-attendance.store';

export {
    useStudentAttendanceStore,
    // Selector hooks
    useAttendanceRecords,
    useDailyAttendanceRecords,
    useCurrentAttendanceRecord,
    useAttendanceSummary,
    useClassAttendanceReport,
    useAttendanceFilters,
    useAttendancePagination,
    useAttendanceLoading,
    useAttendanceError,
    useAttendanceSuccessMessage,
    useDailyAttendanceStats,
    // Action hooks
    useAttendanceActions,
    // Types
    type StudentAttendanceState,
} from './stores/student-attendance.store';

// ============================================================
// TYPE EXPORTS
// ============================================================

export {
    // Enums
    AttendanceStatus,
    // Core interfaces
    type StudentAttendanceRow,
    type StudentAttendance,
    // DTOs
    type MarkAttendanceDTO,
    type BulkMarkAttendanceDTO,
    type UpdateAttendanceDTO,
    // Filters and params
    type AttendanceFilters,
    type AttendanceListParams,
    type AttendanceListResponse,
    // Analytics
    type StudentAttendanceSummary,
    type ClassAttendanceReport,
    // UI helpers
    type DailyAttendanceRecord,
} from './types/student-attendance.types';

// ============================================================
// VALIDATION EXPORTS
// ============================================================

export {
    // Schemas
    attendanceStatusSchema,
    markAttendanceSchema,
    bulkMarkAttendanceSchema,
    updateAttendanceSchema,
    attendanceFiltersSchema,
    attendanceListParamsSchema,
    getAttendanceSummarySchema,
    getClassAttendanceReportSchema,
    // Schema types
    type MarkAttendanceSchema,
    type BulkMarkAttendanceSchema,
    type UpdateAttendanceSchema,
    type AttendanceFiltersSchema,
    type AttendanceListParamsSchema,
    type GetAttendanceSummarySchema,
    type GetClassAttendanceReportSchema,
} from './validations/student-attendance.validation';

// ============================================================
// UTILITY EXPORTS
// ============================================================

export {
    // Constants
    ATTENDANCE_STATUS_CONFIG,
    ATTENDANCE_THRESHOLDS,
    TIME_CONSTANTS,
    // Status utilities
    getAttendanceStatusConfig,
    formatAttendanceStatus,
    getAttendanceStatusPriority,
    sortAttendanceStatusesByPriority,
    // Time utilities
    formatTime,
    calculateDurationMinutes,
    formatDuration,
    parseIntervalToMinutes,
    // Calculation utilities
    calculateAttendancePercentage,
    getAttendancePerformanceLevel,
    getAttendancePerformanceColor,
    isSignificantLateness,
    isSignificantEarlyLeave,
    // Data transformation utilities
    toPublicAttendanceRecord,
    createDailyAttendanceRecord,
    // Statistics & analysis utilities
    calculateAttendanceSummary,
    calculateClassAttendanceReport,
    // Date & filter utilities
    formatAttendanceDate,
    getCurrentDateString,
    isToday,
    isPastDate,
    buildAttendanceQueryFilters,
    // Validation utilities
    validateAttendanceDate,
    validateAttendanceTimes,
    needsAttendanceAttention,
} from './utils/student-attendance.utils';

// ============================================================
// CONVENIENCE EXPORTS
// ============================================================

/**
 * Pre-configured service instance for immediate use
 */
export const attendanceService = studentAttendanceService;

/**
 * Complete attendance system bundle
 * Contains all essential parts of the attendance system
 */
export const studentAttendanceSystem = {
    // Core service
    service: studentAttendanceService,

    // Store hook
    useStore: useStudentAttendanceStore,

    // Action hooks
    useActions: useAttendanceActions,

    // Key selector hooks
    useRecords: useAttendanceRecords,
    useDailyRecords: useDailyAttendanceRecords,
    useLoading: useAttendanceLoading,
    useError: useAttendanceError,

    // Validation schemas (commonly used)
    validation: {
        markAttendance: markAttendanceSchema,
        bulkMarkAttendance: bulkMarkAttendanceSchema,
        updateAttendance: updateAttendanceSchema,
        listParams: attendanceListParamsSchema,
    },
} as const;

// ============================================================
// QUICK START EXAMPLE
// ============================================================

/**
 * Quick Start Usage Examples
 * 
 * @example
 * ```typescript
 * import { 
 *   studentAttendanceService, 
 *   useAttendanceActions,
 *   useAttendanceRecords,
 *   AttendanceStatus 
 * } from '@/lib/branch-system/student-attendance';
 * 
 * // In a React component
 * function AttendanceComponent() {
 *   const records = useAttendanceRecords();
 *   const { markAttendance, fetchDailyAttendance } = useAttendanceActions();
 *   
 *   // Mark attendance
 *   const handleMarkAttendance = async () => {
 *     await markAttendance({
 *       student_id: "student-uuid",
 *       class_id: "class-uuid",
 *       teacher_id: "teacher-uuid",
 *       branch_id: "branch-uuid",
 *       attendance_date: "2024-01-15",
 *       attendance_status: AttendanceStatus.PRESENT,
 *       check_in_time: "09:00",
 *       teacher_remarks: "On time"
 *     });
 *   };
 *   
 *   // Fetch daily attendance
 *   useEffect(() => {
 *     fetchDailyAttendance("class-uuid", "2024-01-15");
 *   }, []);
 *   
 *   return <div>{JSON.stringify(records)}</div>;
 * }
 * 
 * // Direct service usage
 * const result = await studentAttendanceService.markAttendance({
 *   student_id: "student-uuid",
 *   class_id: "class-uuid",
 *   teacher_id: "teacher-uuid", 
 *   branch_id: "branch-uuid",
 *   attendance_date: "2024-01-15",
 *   attendance_status: AttendanceStatus.PRESENT
 * });
 * 
 * if (result.success) {
 *   console.log('Attendance marked:', result.data);
 * }
 * ```
 */

// ============================================================
// RE-EXPORT IMPORTS
// ============================================================

// Re-export from validations for convenience
import {
    attendanceStatusSchema,
    markAttendanceSchema,
    bulkMarkAttendanceSchema,
    updateAttendanceSchema,
    attendanceFiltersSchema,
    attendanceListParamsSchema,
    getAttendanceSummarySchema,
    getClassAttendanceReportSchema,
} from './validations/student-attendance.validation';

// ============================================================
// DEFAULT EXPORT
// ============================================================

/**
 * Default export - complete student attendance system
 */
export default studentAttendanceSystem;