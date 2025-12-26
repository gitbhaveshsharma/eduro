/**
 * Student Attendance Utility Functions
 * 
 * Pure utility functions for attendance calculations, formatting, and transformations.
 * All functions are pure (no side effects) and follow functional programming principles.
 * 
 * @module branch-system/utils/student-attendance
 */

import type {
    StudentAttendance,
    StudentAttendanceRow,
    AttendanceStatus,
    StudentAttendanceSummary,
    ClassAttendanceReport,
    DailyAttendanceRecord,
    AttendanceFilters,
} from '../types/student-attendance.types';

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Attendance status display configurations
 *//**
 * Attendance status display configurations
 * Updated to use Badge component variant names
 */
export const ATTENDANCE_STATUS_CONFIG = {
    PRESENT: {
        label: 'Present',
        color: 'success',      // Changed from 'green' to 'success'
        priority: 1,
        emoji: '✅',
    },
    LATE: {
        label: 'Late',
        color: 'warning',      // Changed from 'orange' to 'warning'
        priority: 2,
        emoji: '⏰',
    },
    EXCUSED: {
        label: 'Excused',
        color: 'outline',      // Changed from 'blue' to 'outline'
        priority: 3,
        emoji: '📝',
    },
    ABSENT: {
        label: 'Absent',
        color: 'destructive',  // Changed from 'red' to 'destructive'
        priority: 4,
        emoji: '❌',
    },
    HOLIDAY: {
        label: 'Holiday',
        color: 'secondary',    // Changed from 'purple' to 'secondary'
        priority: 5,
        emoji: '🏖️',
    },
} as const;


/**
 * Attendance performance thresholds
 */
export const ATTENDANCE_THRESHOLDS = {
    EXCELLENT: 95,       // >= 95%
    GOOD: 85,           // 85-94%
    SATISFACTORY: 75,   // 75-84%
    NEEDS_IMPROVEMENT: 60, // 60-74%
    POOR: 60,           // < 60%
} as const;

/**
 * Time-related constants
 */
export const TIME_CONSTANTS = {
    MINUTES_IN_HOUR: 60,
    LATE_THRESHOLD_MINUTES: 15,      // Consider "late" after 15 minutes
    EARLY_LEAVE_THRESHOLD_MINUTES: 30, // Consider "early leave" if leaving 30+ minutes early
} as const;

// ============================================================
// ATTENDANCE STATUS UTILITIES
// ============================================================

/**
 * Gets attendance status configuration
 * 
 * @param status - Attendance status
 * @returns Status configuration object
 */
export function getAttendanceStatusConfig(status: AttendanceStatus) {
    return ATTENDANCE_STATUS_CONFIG[status];
}

/**
 * Formats attendance status for display
 * 
 * @param status - Attendance status
 * @param includeEmoji - Whether to include emoji
 * @returns Formatted status string
 */
export function formatAttendanceStatus(status: AttendanceStatus, includeEmoji = false): string {
    const config = getAttendanceStatusConfig(status);
    return includeEmoji ? `${config.emoji} ${config.label}` : config.label;
}

/**
 * Gets attendance status priority (for sorting)
 * 
 * @param status - Attendance status
 * @returns Priority number (lower = higher priority)
 */
export function getAttendanceStatusPriority(status: AttendanceStatus): number {
    return getAttendanceStatusConfig(status).priority;
}

/**
 * Sorts attendance statuses by priority
 * 
 * @param statuses - Array of attendance statuses
 * @returns Sorted array (highest priority first)
 */
export function sortAttendanceStatusesByPriority(statuses: AttendanceStatus[]): AttendanceStatus[] {
    return [...statuses].sort((a, b) =>
        getAttendanceStatusPriority(a) - getAttendanceStatusPriority(b)
    );
}

// ============================================================
// TIME UTILITIES
// ============================================================

/**
 * Formats time string (HH:MM format)
 * 
 * @param time - Time string or null
 * @returns Formatted time or default text
 */
export function formatTime(time: string | null, defaultText = 'Not recorded'): string {
    if (!time) return defaultText;

    // Ensure HH:MM format
    const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!timeMatch) return time;

    const [, hours, minutes] = timeMatch;
    return `${hours.padStart(2, '0')}:${minutes}`;
}

/**
 * Calculates duration between two times
 * 
 * @param checkInTime - Check-in time (HH:MM)
 * @param checkOutTime - Check-out time (HH:MM)
 * @returns Duration in minutes, or null if invalid
 */
export function calculateDurationMinutes(
    checkInTime: string | null,
    checkOutTime: string | null
): number | null {
    if (!checkInTime || !checkOutTime) return null;

    try {
        const [inHours, inMinutes] = checkInTime.split(':').map(Number);
        const [outHours, outMinutes] = checkOutTime.split(':').map(Number);

        const inTotalMinutes = inHours * TIME_CONSTANTS.MINUTES_IN_HOUR + inMinutes;
        const outTotalMinutes = outHours * TIME_CONSTANTS.MINUTES_IN_HOUR + outMinutes;

        return outTotalMinutes - inTotalMinutes;
    } catch {
        return null;
    }
}

/**
 * Formats duration minutes to human readable format
 * 
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 */
export function formatDuration(minutes: number | null): string {
    if (minutes === null || minutes < 0) return 'N/A';

    const hours = Math.floor(minutes / TIME_CONSTANTS.MINUTES_IN_HOUR);
    const remainingMinutes = minutes % TIME_CONSTANTS.MINUTES_IN_HOUR;

    if (hours === 0) return `${remainingMinutes}m`;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
}

/**
 * Parses PostgreSQL interval string to minutes
 * 
 * @param intervalString - PostgreSQL interval (e.g., "02:30:00")
 * @returns Duration in minutes
 */
export function parseIntervalToMinutes(intervalString: string | null): number | null {
    if (!intervalString) return null;

    // Handle PostgreSQL interval format (HH:MM:SS or HH:MM:SS.microseconds)
    const timeMatch = intervalString.match(/^(\d+):(\d+):(\d+)/);
    if (!timeMatch) return null;

    const [, hours, minutes, seconds] = timeMatch.map(Number);
    return hours * TIME_CONSTANTS.MINUTES_IN_HOUR + minutes + Math.round(seconds / 60);
}

// ============================================================
// ATTENDANCE CALCULATION UTILITIES
// ============================================================

/**
 * Calculates attendance percentage
 * 
 * @param totalDays - Total attendance days recorded
 * @param presentDays - Days marked as present or late
 * @returns Attendance percentage (0-100)
 */
export function calculateAttendancePercentage(totalDays: number, presentDays: number): number {
    if (totalDays === 0) return 0;
    return Number(((presentDays / totalDays) * 100).toFixed(2));
}

/**
 * Calculates attendance performance level
 * 
 * @param percentage - Attendance percentage
 * @returns Performance level string
 */
export function getAttendancePerformanceLevel(percentage: number): string {
    if (percentage >= ATTENDANCE_THRESHOLDS.EXCELLENT) return 'Excellent';
    if (percentage >= ATTENDANCE_THRESHOLDS.GOOD) return 'Good';
    if (percentage >= ATTENDANCE_THRESHOLDS.SATISFACTORY) return 'Satisfactory';
    if (percentage >= ATTENDANCE_THRESHOLDS.NEEDS_IMPROVEMENT) return 'Needs Improvement';
    return 'Poor';
}

/**
 * Gets attendance performance color
 * 
 * @param percentage - Attendance percentage
 * @returns Color identifier string
 */
export function getAttendancePerformanceColor(percentage: number): string {
    if (percentage >= ATTENDANCE_THRESHOLDS.EXCELLENT) return 'green';
    if (percentage >= ATTENDANCE_THRESHOLDS.GOOD) return 'blue';
    if (percentage >= ATTENDANCE_THRESHOLDS.SATISFACTORY) return 'orange';
    if (percentage >= ATTENDANCE_THRESHOLDS.NEEDS_IMPROVEMENT) return 'yellow';
    return 'red';
}

/**
 * Determines if late arrival is significant
 * 
 * @param lateMinutes - Minutes late
 * @returns Whether the lateness is significant
 */
export function isSignificantLateness(lateMinutes: number): boolean {
    return lateMinutes >= TIME_CONSTANTS.LATE_THRESHOLD_MINUTES;
}

/**
 * Determines if early leave is significant
 * 
 * @param earlyLeaveMinutes - Minutes of early leave
 * @returns Whether the early leave is significant
 */
export function isSignificantEarlyLeave(earlyLeaveMinutes: number): boolean {
    return earlyLeaveMinutes >= TIME_CONSTANTS.EARLY_LEAVE_THRESHOLD_MINUTES;
}

// ============================================================
// DATA TRANSFORMATION UTILITIES
// ============================================================

/**
 * Transforms database row to public attendance record
 * 
 * @param row - Raw database row
 * @returns Public attendance record (excluding sensitive data)
 */
export function toPublicAttendanceRecord(row: StudentAttendanceRow): StudentAttendance {
    return {
        ...row,
        // Calculate derived properties
        total_duration: row.total_duration ? parseIntervalToMinutes(row.total_duration) : null,
    } as StudentAttendance;
}

/**
 * Creates daily attendance record for teacher's view
 * 
 * @param studentInfo - Basic student information
 * @param attendanceRecord - Existing attendance record (if any)
 * @returns Daily attendance record
 */
export function createDailyAttendanceRecord(
    studentInfo: {
        id: string;
        full_name: string | null;
        username?: string | null;
        avatar_url: string | null;
    },
    attendanceRecord?: StudentAttendance | null,
    additionalInfo?: {
        branch_name?: string | null;
        class_name?: string | null;
    }
): DailyAttendanceRecord {
    return {
        student_id: studentInfo.id,
        student_name: studentInfo.full_name || 'Unknown Student',
        student_username: studentInfo.username || null,
        student_avatar: studentInfo.avatar_url,
        attendance_status: attendanceRecord?.attendance_status || null,
        check_in_time: attendanceRecord?.check_in_time || null,
        check_out_time: attendanceRecord?.check_out_time || null,
        late_by_minutes: attendanceRecord?.late_by_minutes || 0,
        teacher_remarks: attendanceRecord?.teacher_remarks || null,
        is_marked: !!attendanceRecord,
        branch_name: additionalInfo?.branch_name || null,
        class_name: additionalInfo?.class_name || null,
    };
}

// ============================================================
// STATISTICS & ANALYSIS UTILITIES
// ============================================================

/**
 * Calculates student attendance summary from records
 * 
 * @param attendanceRecords - Array of attendance records
 * @returns Attendance summary statistics
 */
export function calculateAttendanceSummary(
    attendanceRecords: StudentAttendance[]
): StudentAttendanceSummary {
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r =>
        r.attendance_status === 'PRESENT' || r.attendance_status === 'LATE'
    ).length;
    const absentDays = attendanceRecords.filter(r => r.attendance_status === 'ABSENT').length;
    const lateDays = attendanceRecords.filter(r => r.attendance_status === 'LATE').length;
    const excusedDays = attendanceRecords.filter(r => r.attendance_status === 'EXCUSED').length;

    const lateMinutesArray = attendanceRecords
        .filter(r => r.late_by_minutes > 0)
        .map(r => r.late_by_minutes);

    const averageLateMinutes = lateMinutesArray.length > 0
        ? Number((lateMinutesArray.reduce((sum, mins) => sum + mins, 0) / lateMinutesArray.length).toFixed(1))
        : 0;

    const attendancePercentage = calculateAttendancePercentage(totalDays, presentDays);

    return {
        total_days: totalDays,
        present_days: presentDays,
        absent_days: absentDays,
        late_days: lateDays,
        excused_days: excusedDays,
        attendance_percentage: attendancePercentage,
        average_late_minutes: averageLateMinutes,
    };
}

/**
 * Calculates class attendance report from all records
 * 
 * @param classId - Class UUID
 * @param attendanceRecords - All attendance records for the class
 * @returns Class attendance report
 */
export function calculateClassAttendanceReport(
    classId: string,
    attendanceRecords: StudentAttendance[]
): ClassAttendanceReport {
    const uniqueDates = new Set(attendanceRecords.map(r => r.attendance_date));
    const totalSessions = uniqueDates.size;
    const totalStudentRecords = attendanceRecords.length;

    const presentRecords = attendanceRecords.filter(r =>
        r.attendance_status === 'PRESENT' || r.attendance_status === 'LATE'
    ).length;

    const averageAttendance = totalStudentRecords > 0
        ? Number(((presentRecords / totalStudentRecords) * 100).toFixed(2))
        : 0;

    // Calculate students with perfect attendance
    const studentAttendanceCounts = new Map<string, { total: number, present: number }>();

    attendanceRecords.forEach(record => {
        const current = studentAttendanceCounts.get(record.student_id) || { total: 0, present: 0 };
        current.total += 1;
        if (record.attendance_status === 'PRESENT') {
            current.present += 1;
        }
        studentAttendanceCounts.set(record.student_id, current);
    });

    const studentsWithPerfectAttendance = Array.from(studentAttendanceCounts.values())
        .filter(({ total, present }) => total > 0 && present === total)
        .length;

    return {
        class_id: classId,
        total_sessions: totalSessions,
        total_student_records: totalStudentRecords,
        average_attendance: averageAttendance,
        students_with_perfect_attendance: studentsWithPerfectAttendance,
    };
}

// ============================================================
// DATE & FILTER UTILITIES
// ============================================================

/**
 * Formats date for display
 * 
 * @param dateString - ISO date string
 * @param format - Format type
 * @returns Formatted date string
 */
export function formatAttendanceDate(
    dateString: string,
    format: 'short' | 'long' | 'full' = 'short'
): string {
    try {
        const date = new Date(dateString);

        switch (format) {
            case 'short':
                return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
            case 'long':
                return date.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });
            case 'full':
                return date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });
            default:
                return dateString;
        }
    } catch {
        return dateString;
    }
}

/**
 * Gets current date in YYYY-MM-DD format
 * 
 * @returns Current date string
 */
export function getCurrentDateString(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Checks if a date is today
 * 
 * @param dateString - Date string to check
 * @returns Whether the date is today
 */
export function isToday(dateString: string): boolean {
    return dateString === getCurrentDateString();
}

/**
 * Checks if a date is in the past
 * 
 * @param dateString - Date string to check
 * @returns Whether the date is in the past
 */
export function isPastDate(dateString: string): boolean {
    return dateString < getCurrentDateString();
}

/**
 * Builds query filters for Supabase
 * 
 * @param filters - Attendance filters object
 * @returns Query filter object for Supabase
 */
export function buildAttendanceQueryFilters(filters: AttendanceFilters) {
    const queryFilters: Record<string, unknown> = {};

    if (filters.student_id) queryFilters.student_id = filters.student_id;
    if (filters.class_id) queryFilters.class_id = filters.class_id;
    if (filters.teacher_id) queryFilters.teacher_id = filters.teacher_id;
    if (filters.branch_id) queryFilters.branch_id = filters.branch_id;
    if (filters.attendance_status) queryFilters.attendance_status = filters.attendance_status;
    if (filters.attendance_date) queryFilters.attendance_date = filters.attendance_date;

    return queryFilters;
}

/**
 * Builds query filters specifically for the attendance_details view
 * Maps filter keys to the view column names
 * 
 * @param filters - Attendance filters object
 * @returns Query filter object for Supabase view queries
 */
export function buildAttendanceViewFilters(filters: AttendanceFilters) {
    const queryFilters: Record<string, unknown> = {};

    // Direct field mappings
    if (filters.student_id) queryFilters.student_id = filters.student_id;
    if (filters.student_username) queryFilters.student_username = filters.student_username;
    if (filters.class_id) queryFilters.class_id = filters.class_id;
    if (filters.teacher_id) queryFilters.teacher_id = filters.teacher_id;
    if (filters.branch_id) queryFilters.branch_id = filters.branch_id;
    if (filters.attendance_status) queryFilters.attendance_status = filters.attendance_status;
    if (filters.attendance_date) queryFilters.attendance_date = filters.attendance_date;

    return queryFilters;
}

// ============================================================
// VALIDATION UTILITIES
// ============================================================

/**
 * Validates if attendance can be marked for a specific date
 * 
 * @param attendanceDate - Date to validate
 * @param allowFutureDates - Whether future dates are allowed
 * @param maxPastDays - Maximum days in the past allowed
 * @returns Validation result with error message if invalid
 */
export function validateAttendanceDate(
    attendanceDate: string,
    allowFutureDates = false,
    maxPastDays = 7
): { isValid: boolean; error?: string } {
    const today = getCurrentDateString();
    const targetDate = new Date(attendanceDate);
    const todayDate = new Date(today);

    // Check if future date
    if (!allowFutureDates && attendanceDate > today) {
        return {
            isValid: false,
            error: 'Cannot mark attendance for future dates',
        };
    }

    // Check if too far in the past
    const daysDifference = Math.floor(
        (todayDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDifference > maxPastDays) {
        return {
            isValid: false,
            error: `Cannot mark attendance for dates more than ${maxPastDays} days ago`,
        };
    }

    return { isValid: true };
}

/**
 * Validates attendance time entries
 * 
 * @param checkInTime - Check-in time
 * @param checkOutTime - Check-out time
 * @returns Validation result
 */
export function validateAttendanceTimes(
    checkInTime?: string,
    checkOutTime?: string
): { isValid: boolean; error?: string } {
    if (!checkInTime || !checkOutTime) {
        return { isValid: true }; // Optional times
    }

    const duration = calculateDurationMinutes(checkInTime, checkOutTime);

    if (duration === null) {
        return {
            isValid: false,
            error: 'Invalid time format',
        };
    }

    if (duration < 0) {
        return {
            isValid: false,
            error: 'Check-out time must be after check-in time',
        };
    }

    if (duration > 12 * TIME_CONSTANTS.MINUTES_IN_HOUR) {
        return {
            isValid: false,
            error: 'Session duration cannot exceed 12 hours',
        };
    }

    return { isValid: true };
}

/**
 * Checks if student needs attendance attention
 * 
 * @param attendancePercentage - Student's attendance percentage
 * @param consecutiveAbsences - Number of consecutive absences
 * @returns Whether attention is needed
 */
export function needsAttendanceAttention(
    attendancePercentage: number,
    consecutiveAbsences: number = 0
): boolean {
    return attendancePercentage < ATTENDANCE_THRESHOLDS.NEEDS_IMPROVEMENT ||
        consecutiveAbsences >= 3;
}

// ============================================================
// EXPORT ALL UTILITIES
// ============================================================

export {
    type AttendanceStatus,
    type StudentAttendance,
    type StudentAttendanceRow,
    type StudentAttendanceSummary,
    type ClassAttendanceReport,
    type DailyAttendanceRecord,
    type AttendanceFilters,
};