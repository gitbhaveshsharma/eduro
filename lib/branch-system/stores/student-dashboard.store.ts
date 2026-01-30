/**
 * Student Dashboard Store (Zustand)
 * 
 * Global state management for student dashboard
 * Handles dashboard stats, caching, and real-time updates
 * 
 * @module branch-system/stores/student-dashboard
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
    StudentDashboardStats,
    FormattedStudentScheduleItem,
    FormattedStudentAssignment,
    FormattedStudentQuiz,
    StudentDashboardQuickStats,
    StudentDashboardCacheEntry,
} from '../types/branch-students.types';
import { STUDENT_DASHBOARD_CACHE_TTL } from '../types/branch-students.types';
import { branchStudentsService } from '../services/branch-students.service';
import {
    formatScheduleItems,
    formatAssignments,
    formatQuizzes,
    extractQuickStats,
} from '../utils/student-dashboard.utils';

// ============================================================
// STORE STATE INTERFACE
// ============================================================

interface StudentDashboardState {
    // Raw data from RPC
    dashboardStats: StudentDashboardStats | null;

    // Processed/formatted data
    formattedSchedule: FormattedStudentScheduleItem[];
    formattedAssignments: FormattedStudentAssignment[];
    formattedQuizzes: FormattedStudentQuiz[];
    quickStats: StudentDashboardQuickStats | null;

    // Cache management
    cache: Record<string, StudentDashboardCacheEntry>;
    lastFetchParams: { studentId: string; branchId: string | null } | null;
    lastFetchTime: number | null;

    // Loading states
    loading: boolean;
    refreshing: boolean;

    // Error state
    error: string | null;

    // ============================================================
    // ACTIONS
    // ============================================================

    /**
     * Fetches dashboard stats (with caching)
     */
    fetchDashboardStats: (
        studentId: string,
        branchId?: string | null,
        forceRefresh?: boolean
    ) => Promise<boolean>;

    /**
     * Refreshes dashboard stats (bypasses cache)
     */
    refreshDashboardStats: () => Promise<boolean>;

    /**
     * Checks if cache is valid
     */
    isCacheValid: (studentId: string, branchId?: string | null) => boolean;

    /**
     * Gets cached data if valid
     */
    getCachedData: (
        studentId: string,
        branchId?: string | null
    ) => StudentDashboardStats | null;

    /**
     * Clears dashboard cache
     */
    clearCache: () => void;

    /**
     * Clears error
     */
    clearError: () => void;

    /**
     * Resets store to initial state
     */
    reset: () => void;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Generates cache key from params
 */
function getCacheKey(studentId: string, branchId: string | null): string {
    return branchId ? `${studentId}:${branchId}` : studentId;
}

/**
 * Processes raw stats into formatted display data
 */
function processStats(stats: StudentDashboardStats): {
    formattedSchedule: FormattedStudentScheduleItem[];
    formattedAssignments: FormattedStudentAssignment[];
    formattedQuizzes: FormattedStudentQuiz[];
    quickStats: StudentDashboardQuickStats;
} {
    return {
        formattedSchedule: formatScheduleItems(stats.today_schedule),
        formattedAssignments: formatAssignments(stats.upcoming_assignments),
        formattedQuizzes: formatQuizzes(stats.upcoming_quizzes),
        quickStats: extractQuickStats(stats),
    };
}

// ============================================================
// INITIAL STATE
// ============================================================

const initialState: Omit<
    StudentDashboardState,
    | 'fetchDashboardStats'
    | 'refreshDashboardStats'
    | 'isCacheValid'
    | 'getCachedData'
    | 'clearCache'
    | 'clearError'
    | 'reset'
> = {
    dashboardStats: null,
    formattedSchedule: [],
    formattedAssignments: [],
    formattedQuizzes: [],
    quickStats: null,
    cache: {},
    lastFetchParams: null,
    lastFetchTime: null,
    loading: false,
    refreshing: false,
    error: null,
};

// ============================================================
// ZUSTAND STORE
// ============================================================

export const useStudentDashboardStore = create<StudentDashboardState>()(
    devtools(
        persist(
            (set, get) => ({
                ...initialState,

                // ============================================================
                // FETCH DASHBOARD STATS
                // ============================================================

                fetchDashboardStats: async (
                    studentId: string,
                    branchId: string | null = null,
                    forceRefresh: boolean = false
                ) => {
                    const state = get();

                    // Check cache first (unless force refresh)
                    if (!forceRefresh && state.isCacheValid(studentId, branchId)) {
                        const cachedData = state.getCachedData(studentId, branchId);
                        if (cachedData) {
                            // Use cached data
                            const processed = processStats(cachedData);
                            set({
                                dashboardStats: cachedData,
                                ...processed,
                                lastFetchParams: { studentId, branchId },
                            });
                            return true;
                        }
                    }

                    // Set loading state
                    set({
                        loading: true,
                        error: null,
                        lastFetchParams: { studentId, branchId },
                    });

                    try {
                        const result = await branchStudentsService.getStudentDashboardStats(
                            studentId,
                            branchId
                        );

                        if (result.success && result.data) {
                            const stats = result.data;
                            const processed = processStats(stats);
                            const cacheKey = getCacheKey(studentId, branchId);
                            const now = Date.now();

                            set((prevState) => ({
                                loading: false,
                                dashboardStats: stats,
                                ...processed,
                                lastFetchTime: now,
                                cache: {
                                    ...prevState.cache,
                                    [cacheKey]: {
                                        data: stats,
                                        timestamp: now,
                                        student_id: studentId,
                                        branch_id: branchId,
                                    },
                                },
                            }));

                            return true;
                        }

                        set({
                            loading: false,
                            error: result.error || 'Failed to fetch dashboard stats',
                        });
                        return false;
                    } catch (error) {
                        console.error('Student dashboard fetch error:', error);
                        set({
                            loading: false,
                            error: error instanceof Error ? error.message : 'Unknown error',
                        });
                        return false;
                    }
                },

                // ============================================================
                // REFRESH DASHBOARD STATS
                // ============================================================

                refreshDashboardStats: async () => {
                    const state = get();
                    const params = state.lastFetchParams;

                    if (!params) {
                        return false;
                    }

                    set({ refreshing: true });

                    try {
                        const success = await state.fetchDashboardStats(
                            params.studentId,
                            params.branchId,
                            true // Force refresh
                        );
                        set({ refreshing: false });
                        return success;
                    } catch (error) {
                        set({ refreshing: false });
                        return false;
                    }
                },

                // ============================================================
                // CACHE MANAGEMENT
                // ============================================================

                isCacheValid: (studentId: string, branchId: string | null = null) => {
                    const state = get();
                    const cacheKey = getCacheKey(studentId, branchId);
                    const cached = state.cache[cacheKey];

                    if (!cached) return false;

                    const now = Date.now();
                    const age = now - cached.timestamp;

                    return age < STUDENT_DASHBOARD_CACHE_TTL;
                },

                getCachedData: (studentId: string, branchId: string | null = null) => {
                    const state = get();
                    const cacheKey = getCacheKey(studentId, branchId);
                    const cached = state.cache[cacheKey];

                    if (!cached || !state.isCacheValid(studentId, branchId)) {
                        return null;
                    }

                    return cached.data;
                },

                clearCache: () => {
                    set({ cache: {} });
                },

                // ============================================================
                // STATE MANAGEMENT
                // ============================================================

                clearError: () => {
                    set({ error: null });
                },

                reset: () => {
                    set(initialState);
                },
            }),
            {
                name: 'student-dashboard-store',
                partialize: (state) => ({
                    // Only persist cache (for faster initial loads)
                    cache: state.cache,
                }),
            }
        ),
        {
            name: 'StudentDashboard',
        }
    )
);

// ============================================================
// SELECTORS
// ============================================================

/**
 * Select dashboard stats
 */
export const selectDashboardStats = (state: StudentDashboardState) =>
    state.dashboardStats;

/**
 * Select quick stats
 */
export const selectQuickStats = (state: StudentDashboardState) =>
    state.quickStats;

/**
 * Select formatted schedule
 */
export const selectFormattedSchedule = (state: StudentDashboardState) =>
    state.formattedSchedule;

/**
 * Select formatted assignments
 */
export const selectFormattedAssignments = (state: StudentDashboardState) =>
    state.formattedAssignments;

/**
 * Select formatted quizzes
 */
export const selectFormattedQuizzes = (state: StudentDashboardState) =>
    state.formattedQuizzes;

/**
 * Select loading state
 */
export const selectDashboardLoading = (state: StudentDashboardState) =>
    state.loading;

/**
 * Select refreshing state
 */
export const selectDashboardRefreshing = (state: StudentDashboardState) =>
    state.refreshing;

/**
 * Select error
 */
export const selectDashboardError = (state: StudentDashboardState) =>
    state.error;

/**
 * Select enrollment stats
 */
export const selectEnrollmentStats = (state: StudentDashboardState) =>
    state.dashboardStats?.enrollment_stats ?? null;

/**
 * Select performance summary
 */
export const selectPerformanceSummary = (state: StudentDashboardState) =>
    state.dashboardStats?.performance_summary ?? null;

/**
 * Select class progress
 */
export const selectClassProgress = (state: StudentDashboardState) =>
    state.dashboardStats?.class_progress ?? [];

/**
 * Select recent submissions
 */
export const selectRecentSubmissions = (state: StudentDashboardState) =>
    state.dashboardStats?.recent_submissions ?? [];

/**
 * Select recent notices
 */
export const selectRecentNotices = (state: StudentDashboardState) =>
    state.dashboardStats?.recent_notices ?? [];

/**
 * Select today's attendance
 */
export const selectTodayAttendance = (state: StudentDashboardState) =>
    state.dashboardStats?.today_attendance ?? null;

/**
 * Select profile status
 */
export const selectProfileStatus = (state: StudentDashboardState) =>
    state.dashboardStats?.profile_status ?? null;

/**
 * Select overdue items
 */
export const selectOverdueItems = (state: StudentDashboardState) =>
    state.dashboardStats?.overdue_items ?? null;
