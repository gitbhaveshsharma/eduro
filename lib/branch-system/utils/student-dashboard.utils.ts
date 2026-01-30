/**
 * Student Dashboard Utility Functions
 * 
 * Helper functions for formatting and processing student dashboard data
 * 
 * @module branch-system/utils/student-dashboard
 */

import type {
    StudentDashboardStats,
    StudentTodayScheduleItem,
    FormattedStudentScheduleItem,
    StudentUpcomingAssignment,
    FormattedStudentAssignment,
    StudentUpcomingQuiz,
    FormattedStudentQuiz,
    StudentDashboardQuickStats,
} from '../types/branch-students.types';

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
 * Formats date with relative time for assignment/quiz
 * 
 * @param dateStr - ISO date string
 * @param daysRemaining - Number of days remaining
 * @returns Formatted date with relative indicator
 */
export function formatDeadlineDate(dateStr: string, daysRemaining: number): string {
    const date = formatDate(dateStr);

    if (daysRemaining === 0) return `Today (${date})`;
    if (daysRemaining === 1) return `Tomorrow (${date})`;
    if (daysRemaining < 0) return `Overdue (${date})`;
    return date;
}

/**
 * Calculates days remaining from now
 * 
 * @param dueDateStr - ISO date string
 * @returns Number of days remaining (negative if overdue)
 */
export function calculateDaysRemaining(dueDateStr: string): number {
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

/**
 * Calculates hours remaining from now
 * 
 * @param dateTimeStr - ISO date-time string
 * @returns Number of hours remaining
 */
export function calculateHoursRemaining(dateTimeStr: string): number {
    try {
        const targetDate = new Date(dateTimeStr);
        const now = new Date();

        const diffTime = targetDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60));
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
    scheduleItems: StudentTodayScheduleItem[]
): FormattedStudentScheduleItem[] {
    if (!scheduleItems || !Array.isArray(scheduleItems)) {
        return [];
    }

    return scheduleItems.map((item) => ({
        ...item,
        formatted_time: formatTimeRange(item.start_time, item.end_time),
        status: getScheduleStatus(item.start_time, item.end_time),
    }));
}

/**
 * Formats assignment items for display
 * 
 * @param assignments - Raw assignment items from RPC
 * @returns Formatted assignments with urgency and computed properties
 */
export function formatAssignments(
    assignments: StudentUpcomingAssignment[]
): FormattedStudentAssignment[] {
    if (!assignments || !Array.isArray(assignments)) {
        return [];
    }

    return assignments.map((assignment) => {
        const urgency = getUrgency(assignment.days_remaining);

        return {
            ...assignment,
            urgency,
            formatted_due_date: formatDeadlineDate(assignment.due_date, assignment.days_remaining),
            submission_percentage: 0, // Not available in student view
        };
    });
}

/**
 * Formats quiz items for display
 * 
 * @param quizzes - Raw quiz items from RPC
 * @returns Formatted quizzes with urgency and computed properties
 */
export function formatQuizzes(
    quizzes: StudentUpcomingQuiz[]
): FormattedStudentQuiz[] {
    if (!quizzes || !Array.isArray(quizzes)) {
        return [];
    }

    return quizzes.map((quiz) => {
        const hoursRemaining = calculateHoursRemaining(quiz.available_to);
        const urgency = getQuizUrgency(hoursRemaining);
        const progressPercentage = quiz.max_attempts > 0
            ? Math.round((quiz.attempts_used / quiz.max_attempts) * 100)
            : 0;

        return {
            ...quiz,
            urgency,
            formatted_available_from: formatDate(quiz.available_from),
            formatted_available_to: formatDate(quiz.available_to),
            progress_percentage: progressPercentage,
        };
    });
}

/**
 * Extracts quick stats from dashboard data
 * 
 * @param stats - Full dashboard stats
 * @returns Quick stats for dashboard cards
 */
export function extractQuickStats(stats: StudentDashboardStats): StudentDashboardQuickStats {
    const upcomingAssignments = stats.upcoming_assignments?.filter(a => !a.is_submitted).length || 0;
    const availableQuizzes = stats.upcoming_quizzes?.filter(q => q.can_attempt).length || 0;
    const remainingAttempts = stats.upcoming_quizzes?.reduce(
        (sum, q) => sum + Math.max(0, q.max_attempts - q.attempts_used),
        0
    ) || 0;

    return {
        enrollments: {
            total: stats.enrollment_stats?.total_enrollments || 0,
            active: stats.enrollment_stats?.active_enrollments || 0,
        },
        assignments: {
            upcoming: upcomingAssignments,
            overdue: stats.overdue_items?.overdue_assignments || 0,
        },
        quizzes: {
            available: availableQuizzes,
            remaining_attempts: remainingAttempts,
        },
        performance: {
            average_score: stats.performance_summary?.assignments?.average_score || 0,
            attendance: stats.enrollment_stats?.average_attendance || 0,
        },
    };
}

// ============================================================
// URGENCY & STATUS HELPERS
// ============================================================

/**
 * Determines urgency level based on days remaining
 * 
 * @param daysRemaining - Number of days until due
 * @returns Urgency level: 'critical', 'warning', or 'normal'
 */
export function getUrgency(daysRemaining: number): 'critical' | 'warning' | 'normal' {
    if (daysRemaining < 0) return 'critical'; // Overdue
    if (daysRemaining <= 1) return 'critical'; // Due today or tomorrow
    if (daysRemaining <= 3) return 'warning'; // Due within 3 days
    return 'normal';
}

/**
 * Determines quiz urgency based on hours remaining
 * 
 * @param hoursRemaining - Number of hours until quiz closes
 * @returns Urgency level: 'critical', 'warning', or 'normal'
 */
export function getQuizUrgency(hoursRemaining: number): 'critical' | 'warning' | 'normal' {
    if (hoursRemaining < 0) return 'critical'; // Expired
    if (hoursRemaining <= 6) return 'critical'; // Less than 6 hours
    if (hoursRemaining <= 24) return 'warning'; // Less than 24 hours
    return 'normal';
}

/**
 * Gets badge variant for urgency level
 * 
 * @param urgency - Urgency level
 * @returns Badge variant
 */
export function getUrgencyVariant(urgency: 'critical' | 'warning' | 'normal'): 'destructive' | 'warning' | 'secondary' {
    switch (urgency) {
        case 'critical':
            return 'destructive';
        case 'warning':
            return 'warning';
        default:
            return 'secondary';
    }
}

/**
 * Gets progress color based on percentage
 * 
 * @param percentage - Progress percentage (0-100)
 * @returns Color class
 */
export function getProgressColor(percentage: number): string {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
}

/**
 * Gets score color based on percentage
 * 
 * @param percentage - Score percentage (0-100)
 * @returns Badge variant
 */
export function getScoreVariant(percentage: number): 'success' | 'warning' | 'destructive' | 'secondary' {
    if (percentage >= 85) return 'success';
    if (percentage >= 70) return 'secondary';
    if (percentage >= 50) return 'warning';
    return 'destructive';
}

// ============================================================
// CHART DATA FUNCTIONS
// ============================================================

/**
 * Prepares performance chart data
 * 
 * @param performanceSummary - Performance summary from RPC
 * @returns Chart data items
 */
export function preparePerformanceChartData(
    performanceSummary: StudentDashboardStats['performance_summary']
): Array<{ label: string; value: number; color: string }> {
    const data = [];

    if (performanceSummary.assignments.total_submitted > 0) {
        data.push({
            label: 'Assignments',
            value: performanceSummary.assignments.average_score,
            color: 'bg-blue-500',
        });
    }

    if (performanceSummary.quizzes.total_attempted > 0) {
        data.push({
            label: 'Quizzes',
            value: performanceSummary.quizzes.average_percentage,
            color: 'bg-purple-500',
        });
    }

    data.push({
        label: 'Attendance',
        value: performanceSummary.overall.average_attendance,
        color: 'bg-green-500',
    });

    return data;
}

/**
 * Prepares class progress chart data
 * 
 * @param classProgress - Class progress from RPC
 * @returns Chart data for each class
 */
export function prepareClassProgressChartData(
    classProgress: StudentDashboardStats['class_progress']
): Array<{
    className: string;
    attendance: number;
    assignments: number;
    quizzes: number;
}> {
    return classProgress.map((cls) => ({
        className: cls.class_name,
        attendance: cls.attendance_percentage,
        assignments: cls.assignments_total > 0
            ? Math.round((cls.assignments_completed / cls.assignments_total) * 100)
            : 0,
        quizzes: cls.quizzes_total > 0
            ? Math.round((cls.quizzes_completed / cls.quizzes_total) * 100)
            : 0,
    }));
}

// ============================================================
// SORTING & FILTERING HELPERS
// ============================================================

/**
 * Sorts schedule by time
 * 
 * @param schedule - Schedule items
 * @returns Sorted schedule (earliest first)
 */
export function sortScheduleByTime(
    schedule: FormattedStudentScheduleItem[]
): FormattedStudentScheduleItem[] {
    return [...schedule].sort((a, b) => {
        if (a.start_time < b.start_time) return -1;
        if (a.start_time > b.start_time) return 1;
        return 0;
    });
}

/**
 * Sorts assignments by urgency and due date
 * 
 * @param assignments - Assignment items
 * @returns Sorted assignments (most urgent first)
 */
export function sortAssignmentsByUrgency(
    assignments: FormattedStudentAssignment[]
): FormattedStudentAssignment[] {
    return [...assignments].sort((a, b) => {
        // Urgency priority: critical > warning > normal
        const urgencyOrder = { critical: 0, warning: 1, normal: 2 };
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
            return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        }

        // Then by days remaining (ascending)
        return a.days_remaining - b.days_remaining;
    });
}

/**
 * Filters unsubmitted assignments
 * 
 * @param assignments - Assignment items
 * @returns Only unsubmitted assignments
 */
export function filterUnsubmittedAssignments(
    assignments: FormattedStudentAssignment[]
): FormattedStudentAssignment[] {
    return assignments.filter(a => !a.is_submitted);
}

/**
 * Filters available quizzes
 * 
 * @param quizzes - Quiz items
 * @returns Only quizzes that can be attempted
 */
export function filterAvailableQuizzes(
    quizzes: FormattedStudentQuiz[]
): FormattedStudentQuiz[] {
    return quizzes.filter(q => q.can_attempt);
}

// ============================================================
// SUMMARY FUNCTIONS
// ============================================================

/**
 * Gets schedule summary text
 * 
 * @param schedule - Formatted schedule items
 * @returns Summary text (e.g., "3 classes today, 1 ongoing")
 */
export function getScheduleSummary(schedule: FormattedStudentScheduleItem[]): string {
    if (schedule.length === 0) return 'No classes today';

    const ongoing = schedule.filter(s => s.status === 'ongoing').length;
    const upcoming = schedule.filter(s => s.status === 'upcoming').length;

    if (ongoing > 0) {
        return `${schedule.length} class${schedule.length !== 1 ? 'es' : ''} today, ${ongoing} ongoing`;
    }

    if (upcoming > 0) {
        return `${upcoming} class${upcoming !== 1 ? 'es' : ''} starting soon`;
    }

    return `${schedule.length} class${schedule.length !== 1 ? 'es' : ''} completed`;
}

/**
 * Gets assignment summary text
 * 
 * @param assignments - Formatted assignment items
 * @returns Summary text
 */
export function getAssignmentSummary(assignments: FormattedStudentAssignment[]): string {
    const unsubmitted = assignments.filter(a => !a.is_submitted);
    const urgent = unsubmitted.filter(a => a.urgency === 'critical');

    if (unsubmitted.length === 0) return 'All assignments submitted';

    if (urgent.length > 0) {
        return `${urgent.length} urgent assignment${urgent.length !== 1 ? 's' : ''}`;
    }

    return `${unsubmitted.length} pending assignment${unsubmitted.length !== 1 ? 's' : ''}`;
}

/**
 * Gets quiz summary text
 * 
 * @param quizzes - Formatted quiz items
 * @returns Summary text
 */
export function getQuizSummary(quizzes: FormattedStudentQuiz[]): string {
    const available = quizzes.filter(q => q.can_attempt);
    const urgent = available.filter(q => q.urgency === 'critical');

    if (available.length === 0) return 'No quizzes available';

    if (urgent.length > 0) {
        return `${urgent.length} quiz${urgent.length !== 1 ? 'zes' : ''} closing soon`;
    }

    return `${available.length} quiz${available.length !== 1 ? 'zes' : ''} available`;
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Checks if dashboard has data
 * 
 * @param stats - Dashboard stats
 * @returns True if dashboard has meaningful data
 */
export function hasDashboardData(stats: StudentDashboardStats | null): boolean {
    if (!stats) return false;

    return (
        stats.enrollment_stats.total_enrollments > 0 ||
        stats.today_schedule.length > 0 ||
        stats.upcoming_assignments.length > 0 ||
        stats.upcoming_quizzes.length > 0 ||
        stats.class_progress.length > 0
    );
}

/**
 * Checks if student has urgent items
 * 
 * @param stats - Dashboard stats
 * @returns True if there are urgent assignments or quizzes
 */
export function hasUrgentItems(stats: StudentDashboardStats | null): boolean {
    if (!stats) return false;

    return stats.overdue_items.overdue_assignments > 0 ||
        stats.overdue_items.expiring_quizzes > 0;
}

/**
 * Checks if profile is incomplete
 * 
 * @param stats - Dashboard stats
 * @returns True if profile needs completion
 */
export function isProfileIncomplete(stats: StudentDashboardStats | null): boolean {
    if (!stats) return false;

    return !stats.profile_status.is_complete;
}

// ============================================================
// PERCENTAGE CALCULATIONS
// ============================================================

/**
 * Calculates percentage safely
 * 
 * @param value - Current value
 * @param total - Total value
 * @returns Percentage (0-100)
 */
export function calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

/**
 * Calculates completion rate for assignments
 * 
 * @param completed - Number of completed assignments
 * @param total - Total number of assignments
 * @returns Completion percentage
 */
export function calculateCompletionRate(completed: number, total: number): number {
    return calculatePercentage(completed, total);
}

/**
 * Gets grade letter from percentage
 * 
 * @param percentage - Score percentage
 * @returns Grade letter (A+, A, B+, etc.)
 */
export function getGradeLetter(percentage: number): string {
    if (percentage >= 95) return 'A+';
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'A-';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'B-';
    if (percentage >= 65) return 'C+';
    if (percentage >= 60) return 'C';
    if (percentage >= 55) return 'C-';
    if (percentage >= 50) return 'D';
    return 'F';
}

// ============================================================
// FINANCIAL HELPERS
// ============================================================

/**
 * Calculates outstanding balance
 * 
 * @param totalDue - Total fees due
 * @param totalPaid - Total fees paid
 * @returns Outstanding balance
 */
export function calculateOutstandingBalance(totalDue: number, totalPaid: number): number {
    return Math.max(0, totalDue - totalPaid);
}

/**
 * Calculates payment percentage
 * 
 * @param totalPaid - Total fees paid
 * @param totalDue - Total fees due
 * @returns Payment percentage (0-100)
 */
export function calculatePaymentPercentage(totalPaid: number, totalDue: number): number {
    return calculatePercentage(totalPaid, totalDue);
}

/**
 * Formats currency for display
 * 
 * @param amount - Amount in rupees
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}

// ============================================================
// SUBJECT & COLOR HELPERS
// ============================================================

/**
 * Gets color for a subject
 * 
 * @param subject - Subject name
 * @returns Tailwind color class
 */
export function getSubjectColor(subject: string): string {
    const subjectColors: Record<string, string> = {
        'Mathematics': 'bg-blue-100 text-blue-700',
        'Physics': 'bg-purple-100 text-purple-700',
        'Chemistry': 'bg-green-100 text-green-700',
        'Biology': 'bg-teal-100 text-teal-700',
        'English': 'bg-pink-100 text-pink-700',
        'History': 'bg-amber-100 text-amber-700',
        'Geography': 'bg-cyan-100 text-cyan-700',
        'Computer Science': 'bg-indigo-100 text-indigo-700',
    };

    return subjectColors[subject] || 'bg-gray-100 text-gray-700';
}

// ============================================================
// DASHBOARD CONSTANTS
// ============================================================

export const DASHBOARD_COLORS = {
    primary: 'bg-brand-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
} as const;

export const ASSIGNMENT_URGENCY_THRESHOLDS = {
    CRITICAL: 1, // 1 day or less
    WARNING: 3,  // 3 days or less
} as const;

export const QUIZ_URGENCY_THRESHOLDS = {
    CRITICAL: 6,  // 6 hours or less
    WARNING: 24,  // 24 hours or less
} as const;
