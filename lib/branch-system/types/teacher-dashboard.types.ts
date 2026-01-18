/**
 * Teacher Dashboard Types
 * 
 * TypeScript interfaces for the get_teacher_dashboard_stats_v2 RPC function
 * Based on migration: 019_create_branch_teacher_system.sql
 * 
 * @module branch-system/types/teacher-dashboard
 */

import type { AssignmentStatus, GradingStatus } from './assignment.types';
import type { ClassStatus } from './branch-classes.types';

// ============================================================
// CORE DASHBOARD STATS TYPES
// ============================================================

/**
 * Teacher dashboard statistics from get_teacher_dashboard_stats_v2 RPC
 */
export interface TeacherDashboardStats {
    // Core metrics
    total_classes: number;
    total_students: number;
    total_assignments: number;
    
    // Schedule
    today_schedule: TodayScheduleItem[];
    
    // Grading workload
    grading_stats: GradingStats;
    
    // Upcoming work
    upcoming_deadlines: UpcomingDeadline[];
    
    // At-risk students
    at_risk_students: AtRiskStudents;
    
    // Class-wise breakdown
    assignments_by_class: ClassAssignmentStats[];
    
    // Recent activity
    recent_activity: RecentActivity;
}

/**
 * Today's class schedule item
 */
export interface TodayScheduleItem {
    class_id: string;
    class_name: string;
    subject: string;
    batch_name: string | null;
    start_time: string; // HH:MM:SS format
    end_time: string; // HH:MM:SS format
    current_enrollment: number;
    max_students: number;
}

/**
 * Grading workload statistics
 */
export interface GradingStats {
    pending_count: number;
    auto_graded_count: number;
    manual_graded_count: number;
    urgent_count: number; // Submissions > 3 days old
    graded_today: number;
}

/**
 * Upcoming assignment deadline
 */
export interface UpcomingDeadline {
    assignment_id: string;
    title: string;
    class_name: string;
    status: AssignmentStatus;
    due_date: string; // ISO timestamp
    total_students: number;
    submissions_received: number;
}

/**
 * At-risk students summary
 */
export interface AtRiskStudents {
    low_attendance_count: number;
    failing_count: number;
}

/**
 * Assignment statistics by class
 */
export interface ClassAssignmentStats {
    class_id: string;
    class_name: string;
    subject: string;
    assignment_count: number;
    published_count: number;
    total_submissions: number;
    pending_grading: number;
    avg_score: number;
}

/**
 * Recent activity summary
 */
export interface RecentActivity {
    recent_submissions: number; // Last 24 hours
    submissions_last_7days: number;
    pending_grading_breakdown: {
        not_graded: number;
        auto_graded: number;
        manual_graded: number;
    };
}

// ============================================================
// DASHBOARD DISPLAY TYPES
// ============================================================

/**
 * Formatted schedule item for display
 */
export interface FormattedScheduleItem extends TodayScheduleItem {
    formatted_time: string; // "9:00 AM - 10:30 AM"
    enrollment_percentage: number;
    status: 'upcoming' | 'ongoing' | 'completed';
    is_full: boolean;
}

/**
 * Formatted deadline for display
 */
export interface FormattedDeadline extends UpcomingDeadline {
    days_until_due: number;
    submission_percentage: number;
    urgency: 'critical' | 'warning' | 'normal';
    formatted_due_date: string;
}

/**
 * Dashboard quick stats for cards
 */
export interface DashboardQuickStats {
    classes: {
        total: number;
        today: number;
    };
    students: {
        total: number;
        at_risk: number;
    };
    assignments: {
        total: number;
        pending_grading: number;
    };
    submissions: {
        today: number;
        week: number;
    };
}

// ============================================================
// CHART DATA TYPES
// ============================================================

/**
 * Bar chart data item
 */
export interface ChartDataItem {
    name: string;
    value: number;
    color?: string;
    label?: string;
}

/**
 * Grading chart data
 */
export interface GradingChartData {
    pending: number;
    auto_graded: number;
    manual_graded: number;
    urgent: number;
}

/**
 * Class performance chart data
 */
export interface ClassPerformanceData {
    class_name: string;
    subject: string;
    avg_score: number;
    submission_rate: number;
    pending_grading: number;
}

// ============================================================
// OPERATION TYPES
// ============================================================

/**
 * Dashboard fetch params
 */
export interface DashboardFetchParams {
    teacher_id: string;
    branch_id?: string | null;
}

/**
 * Dashboard operation result
 */
export interface DashboardOperationResult {
    success: boolean;
    data?: TeacherDashboardStats;
    error?: string;
}

// ============================================================
// CACHE TYPES
// ============================================================

/**
 * Dashboard cache entry
 */
export interface DashboardCacheEntry {
    data: TeacherDashboardStats;
    timestamp: number;
    teacher_id: string;
    branch_id: string | null;
}

/**
 * Cache configuration
 */
export interface DashboardCacheConfig {
    ttl: number; // Time to live in milliseconds
    maxEntries: number;
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Default cache TTL (5 minutes)
 */
export const DASHBOARD_CACHE_TTL = 5 * 60 * 1000;

/**
 * Urgency thresholds for deadlines
 */
export const DEADLINE_URGENCY_THRESHOLDS = {
    CRITICAL: 1, // 1 day or less
    WARNING: 3,  // 3 days or less
} as const;

/**
 * Attendance threshold for at-risk (percentage)
 */
export const AT_RISK_ATTENDANCE_THRESHOLD = 75;

/**
 * Passing score threshold (percentage)
 */
export const PASSING_SCORE_THRESHOLD = 50;

/**
 * Colors for different metrics
 */
export const DASHBOARD_COLORS = {
    primary: 'hsl(var(--primary))',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    muted: 'hsl(var(--muted-foreground))',
    
    // Grading status colors
    pending: '#f59e0b',
    auto_graded: '#3b82f6',
    manual_graded: '#22c55e',
    urgent: '#ef4444',
    
    // Subject colors (for charts)
    mathematics: '#3b82f6',
    physics: '#8b5cf6',
    chemistry: '#ec4899',
    biology: '#22c55e',
    english: '#f59e0b',
    default: '#6b7280',
} as const;

/**
 * Dashboard section keys for selective refresh
 */
export type DashboardSection = 
    | 'core_stats'
    | 'schedule'
    | 'grading'
    | 'deadlines'
    | 'at_risk'
    | 'class_stats'
    | 'activity';
