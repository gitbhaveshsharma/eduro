/**
 * Teacher Dashboard Utility Functions
 * 
 * Helper functions for formatting and processing dashboard data
 * 
 * @module branch-system/utils/teacher-dashboard
 */

import type {
    TeacherDashboardStats,
    TodayScheduleItem,
    FormattedScheduleItem,
    UpcomingDeadline,
    FormattedDeadline,
    DashboardQuickStats,
    GradingChartData,
    ClassPerformanceData,
    ChartDataItem,
    ClassAssignmentStats,
} from '../types/teacher-dashboard.types';
import {
    DEADLINE_URGENCY_THRESHOLDS,
    DASHBOARD_COLORS,
} from '../types/teacher-dashboard.types';

// ============================================================
// TIME FORMATTING FUNCTIONS
// ============================================================

/**
 * Formats time string (HH:MM:SS) to 12-hour format
 * 
 * @param time - Time string in HH:MM:SS format
 * @returns Formatted time string (e.g., "9:00 AM")
 */
export function formatTime(time: string | null): string {
    if (!time) return '';
    
    try {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch {
        return time;
    }
}

/**
 * Formats time range for schedule display
 * 
 * @param startTime - Start time in HH:MM:SS format
 * @param endTime - End time in HH:MM:SS format
 * @returns Formatted time range (e.g., "9:00 AM - 10:30 AM")
 */
export function formatTimeRange(startTime: string, endTime: string): string {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * Gets schedule item status based on current time
 * 
 * @param startTime - Start time in HH:MM:SS format
 * @param endTime - End time in HH:MM:SS format
 * @returns Status: 'upcoming', 'ongoing', or 'completed'
 */
export function getScheduleStatus(
    startTime: string,
    endTime: string
): 'upcoming' | 'ongoing' | 'completed' {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
    
    if (currentTime < startTime) return 'upcoming';
    if (currentTime > endTime) return 'completed';
    return 'ongoing';
}

// ============================================================
// DATE FORMATTING FUNCTIONS
// ============================================================

/**
 * Formats ISO date string to readable format
 * 
 * @param dateStr - ISO date string
 * @returns Formatted date (e.g., "Jan 20, 2026")
 */
export function formatDate(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

/**
 * Formats date for deadline display with relative time
 * 
 * @param dateStr - ISO date string
 * @returns Formatted date with relative indicator
 */
export function formatDeadlineDate(dateStr: string): string {
    const days = getDaysUntilDue(dateStr);
    const date = formatDate(dateStr);
    
    if (days === 0) return `Today (${date})`;
    if (days === 1) return `Tomorrow (${date})`;
    if (days < 0) return `Overdue (${date})`;
    return date;
}

/**
 * Calculates days until due date
 * 
 * @param dueDateStr - ISO date string
 * @returns Number of days until due (negative if overdue)
 */
export function getDaysUntilDue(dueDateStr: string): number {
    try {
        const dueDate = new Date(dueDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        
        const diffTime = dueDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
        return 0;
    }
}

// ============================================================
// DATA TRANSFORMATION FUNCTIONS
// ============================================================

/**
 * Formats schedule items for display
 * 
 * @param scheduleItems - Raw schedule items from RPC
 * @returns Formatted schedule items with computed properties
 */
export function formatScheduleItems(
    scheduleItems: TodayScheduleItem[]
): FormattedScheduleItem[] {
    return scheduleItems.map((item) => ({
        ...item,
        formatted_time: formatTimeRange(item.start_time, item.end_time),
        enrollment_percentage: item.max_students > 0 
            ? Math.round((item.current_enrollment / item.max_students) * 100)
            : 0,
        status: getScheduleStatus(item.start_time, item.end_time),
        is_full: item.current_enrollment >= item.max_students,
    }));
}

/**
 * Formats deadline items for display
 * 
 * @param deadlines - Raw deadline items from RPC
 * @returns Formatted deadlines with urgency and computed properties
 */
export function formatDeadlines(
    deadlines: UpcomingDeadline[]
): FormattedDeadline[] {
    return deadlines.map((deadline) => {
        const daysUntilDue = getDaysUntilDue(deadline.due_date);
        const submissionPercentage = deadline.total_students > 0
            ? Math.round((deadline.submissions_received / deadline.total_students) * 100)
            : 0;
        
        let urgency: 'critical' | 'warning' | 'normal' = 'normal';
        if (daysUntilDue <= DEADLINE_URGENCY_THRESHOLDS.CRITICAL) {
            urgency = 'critical';
        } else if (daysUntilDue <= DEADLINE_URGENCY_THRESHOLDS.WARNING) {
            urgency = 'warning';
        }
        
        return {
            ...deadline,
            days_until_due: daysUntilDue,
            submission_percentage: submissionPercentage,
            urgency,
            formatted_due_date: formatDeadlineDate(deadline.due_date),
        };
    });
}

/**
 * Extracts quick stats from dashboard data
 * 
 * @param stats - Full dashboard stats
 * @returns Quick stats for dashboard cards
 */
export function extractQuickStats(stats: TeacherDashboardStats): DashboardQuickStats {
    const totalAtRisk = stats.at_risk_students.low_attendance_count + 
                        stats.at_risk_students.failing_count;
    
    return {
        classes: {
            total: stats.total_classes,
            today: stats.today_schedule.length,
        },
        students: {
            total: stats.total_students,
            at_risk: totalAtRisk,
        },
        assignments: {
            total: stats.total_assignments,
            pending_grading: stats.grading_stats.pending_count,
        },
        submissions: {
            today: stats.recent_activity.recent_submissions,
            week: stats.recent_activity.submissions_last_7days,
        },
    };
}

// ============================================================
// CHART DATA FUNCTIONS
// ============================================================

/**
 * Prepares grading stats for chart display
 * 
 * @param gradingStats - Grading statistics from RPC
 * @returns Chart-ready grading data
 */
export function prepareGradingChartData(
    gradingStats: TeacherDashboardStats['grading_stats']
): ChartDataItem[] {
    return [
        {
            name: 'Pending',
            value: gradingStats.pending_count,
            color: DASHBOARD_COLORS.pending,
            label: 'Pending Review',
        },
        {
            name: 'Urgent',
            value: gradingStats.urgent_count,
            color: DASHBOARD_COLORS.urgent,
            label: 'Urgent (>3 days)',
        },
        {
            name: 'Auto-graded',
            value: gradingStats.auto_graded_count,
            color: DASHBOARD_COLORS.auto_graded,
            label: 'Auto-graded',
        },
        {
            name: 'Graded Today',
            value: gradingStats.graded_today,
            color: DASHBOARD_COLORS.success,
            label: 'Graded Today',
        },
    ];
}

/**
 * Prepares class assignment stats for chart display
 * 
 * @param classStats - Class assignment statistics from RPC
 * @returns Chart-ready class performance data
 */
export function prepareClassPerformanceData(
    classStats: ClassAssignmentStats[]
): ClassPerformanceData[] {
    return classStats.map((cls) => ({
        class_name: cls.class_name,
        subject: cls.subject,
        avg_score: cls.avg_score,
        submission_rate: cls.assignment_count > 0 && cls.total_submissions > 0
            ? Math.round((cls.total_submissions / (cls.assignment_count * 100)) * 100)
            : 0,
        pending_grading: cls.pending_grading,
    }));
}

/**
 * Prepares submission activity for chart display
 * 
 * @param activity - Recent activity from RPC
 * @returns Chart-ready activity data
 */
export function prepareActivityChartData(
    activity: TeacherDashboardStats['recent_activity']
): ChartDataItem[] {
    return [
        {
            name: 'Last 24h',
            value: activity.recent_submissions,
            color: DASHBOARD_COLORS.success,
            label: 'Submissions (24h)',
        },
        {
            name: 'Last 7 days',
            value: activity.submissions_last_7days,
            color: DASHBOARD_COLORS.primary,
            label: 'Submissions (7 days)',
        },
    ];
}

/**
 * Gets subject color for charts
 * 
 * @param subject - Subject name
 * @returns Color code for the subject
 */
export function getSubjectColor(subject: string): string {
    const normalizedSubject = subject.toLowerCase();
    
    if (normalizedSubject.includes('math')) return DASHBOARD_COLORS.mathematics;
    if (normalizedSubject.includes('physics')) return DASHBOARD_COLORS.physics;
    if (normalizedSubject.includes('chemistry')) return DASHBOARD_COLORS.chemistry;
    if (normalizedSubject.includes('biology')) return DASHBOARD_COLORS.biology;
    if (normalizedSubject.includes('english')) return DASHBOARD_COLORS.english;
    
    return DASHBOARD_COLORS.default;
}

// ============================================================
// PERCENTAGE & PROGRESS FUNCTIONS
// ============================================================

/**
 * Calculates percentage with safe division
 * 
 * @param value - Numerator
 * @param total - Denominator
 * @returns Percentage (0-100)
 */
export function calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

/**
 * Gets progress bar color based on percentage
 * 
 * @param percentage - Current percentage
 * @param thresholds - Custom thresholds (default: 50 warning, 75 good)
 * @returns Color class name
 */
export function getProgressColor(
    percentage: number,
    thresholds = { warning: 50, good: 75 }
): string {
    if (percentage >= thresholds.good) return 'bg-green-500';
    if (percentage >= thresholds.warning) return 'bg-yellow-500';
    return 'bg-red-500';
}

/**
 * Gets urgency badge variant
 * 
 * @param urgency - Urgency level
 * @returns Badge variant name
 */
export function getUrgencyVariant(
    urgency: 'critical' | 'warning' | 'normal'
): 'destructive' | 'warning' | 'default' {
    switch (urgency) {
        case 'critical':
            return 'destructive';
        case 'warning':
            return 'warning' as 'destructive'; // Using destructive as fallback if warning not available
        default:
            return 'default';
    }
}

// ============================================================
// SORTING & FILTERING FUNCTIONS
// ============================================================

/**
 * Sorts schedule items by start time
 * 
 * @param scheduleItems - Schedule items to sort
 * @returns Sorted schedule items
 */
export function sortScheduleByTime<T extends { start_time: string }>(
    scheduleItems: T[]
): T[] {
    return [...scheduleItems].sort((a, b) => 
        a.start_time.localeCompare(b.start_time)
    );
}

/**
 * Sorts deadlines by urgency
 * 
 * @param deadlines - Deadlines to sort
 * @returns Sorted deadlines (most urgent first)
 */
export function sortDeadlinesByUrgency(
    deadlines: FormattedDeadline[]
): FormattedDeadline[] {
    return [...deadlines].sort((a, b) => a.days_until_due - b.days_until_due);
}

/**
 * Filters classes with pending grading
 * 
 * @param classStats - Class statistics
 * @returns Classes with pending grading work
 */
export function filterClassesWithPendingGrading(
    classStats: ClassAssignmentStats[]
): ClassAssignmentStats[] {
    return classStats.filter((cls) => cls.pending_grading > 0);
}

// ============================================================
// SUMMARY TEXT FUNCTIONS
// ============================================================

/**
 * Generates schedule summary text
 * 
 * @param scheduleItems - Today's schedule items
 * @returns Summary text (e.g., "3 classes today")
 */
export function getScheduleSummary(scheduleItems: TodayScheduleItem[]): string {
    const count = scheduleItems.length;
    if (count === 0) return 'No classes scheduled for today';
    return `${count} class${count !== 1 ? 'es' : ''} today`;
}

/**
 * Generates grading summary text
 * 
 * @param gradingStats - Grading statistics
 * @returns Summary text with urgency indicator
 */
export function getGradingSummary(
    gradingStats: TeacherDashboardStats['grading_stats']
): string {
    const { pending_count, urgent_count } = gradingStats;
    
    if (pending_count === 0) return 'All caught up!';
    if (urgent_count > 0) {
        return `${pending_count} pending (${urgent_count} urgent)`;
    }
    return `${pending_count} pending review`;
}

/**
 * Generates at-risk students summary
 * 
 * @param atRisk - At-risk students data
 * @returns Summary text
 */
export function getAtRiskSummary(
    atRisk: TeacherDashboardStats['at_risk_students']
): string {
    const total = atRisk.low_attendance_count + atRisk.failing_count;
    if (total === 0) return 'All students performing well';
    
    const parts: string[] = [];
    if (atRisk.low_attendance_count > 0) {
        parts.push(`${atRisk.low_attendance_count} low attendance`);
    }
    if (atRisk.failing_count > 0) {
        parts.push(`${atRisk.failing_count} failing`);
    }
    return parts.join(', ');
}

// ============================================================
// EMPTY STATE CHECKS
// ============================================================

/**
 * Checks if dashboard has any data
 * 
 * @param stats - Dashboard statistics
 * @returns True if dashboard has meaningful data
 */
export function hasDashboardData(stats: TeacherDashboardStats): boolean {
    return (
        stats.total_classes > 0 ||
        stats.total_students > 0 ||
        stats.total_assignments > 0
    );
}

/**
 * Checks if there's grading work to do
 * 
 * @param gradingStats - Grading statistics
 * @returns True if there's pending grading
 */
export function hasPendingGrading(
    gradingStats: TeacherDashboardStats['grading_stats']
): boolean {
    return gradingStats.pending_count > 0;
}

/**
 * Checks if there are at-risk students
 * 
 * @param atRisk - At-risk students data
 * @returns True if there are at-risk students
 */
export function hasAtRiskStudents(
    atRisk: TeacherDashboardStats['at_risk_students']
): boolean {
    return atRisk.low_attendance_count > 0 || atRisk.failing_count > 0;
}
