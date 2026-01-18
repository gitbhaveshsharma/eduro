/**
 * Teacher Dashboard Store (Zustand)
 * 
 * Global state management for teacher dashboard
 * Handles dashboard stats, caching, and real-time updates
 * 
 * @module branch-system/stores/teacher-dashboard
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
    TeacherDashboardStats,
    FormattedScheduleItem,
    FormattedDeadline,
    DashboardQuickStats,
    DashboardCacheEntry,
} from '../types/teacher-dashboard.types';
import { DASHBOARD_CACHE_TTL } from '../types/teacher-dashboard.types';
import { branchTeacherService } from '../services/branch-teacher.service';
import {
    formatScheduleItems,
    formatDeadlines,
    extractQuickStats,
} from '../utils/teacher-dashboard.utils';

// ============================================================
// STORE STATE INTERFACE
// ============================================================

interface TeacherDashboardState {
    // Raw data from RPC
    dashboardStats: TeacherDashboardStats | null;
    
    // Processed/formatted data
    formattedSchedule: FormattedScheduleItem[];
    formattedDeadlines: FormattedDeadline[];
    quickStats: DashboardQuickStats | null;
    
    // Cache management
    cache: Record<string, DashboardCacheEntry>;
    lastFetchParams: { teacherId: string; branchId: string | null } | null;
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
        teacherId: string,
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
    isCacheValid: (teacherId: string, branchId?: string | null) => boolean;
    
    /**
     * Gets cached data if valid
     */
    getCachedData: (
        teacherId: string,
        branchId?: string | null
    ) => TeacherDashboardStats | null;
    
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
function getCacheKey(teacherId: string, branchId: string | null): string {
    return `${teacherId}_${branchId || 'all'}`;
}

/**
 * Processes raw stats into formatted display data
 */
function processStats(stats: TeacherDashboardStats): {
    formattedSchedule: FormattedScheduleItem[];
    formattedDeadlines: FormattedDeadline[];
    quickStats: DashboardQuickStats;
} {
    return {
        formattedSchedule: formatScheduleItems(stats.today_schedule),
        formattedDeadlines: formatDeadlines(stats.upcoming_deadlines),
        quickStats: extractQuickStats(stats),
    };
}

// ============================================================
// INITIAL STATE
// ============================================================

const initialState: Omit<
    TeacherDashboardState,
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
    formattedDeadlines: [],
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

export const useTeacherDashboardStore = create<TeacherDashboardState>()(
    devtools(
        persist(
            (set, get) => ({
                ...initialState,

                // ============================================================
                // FETCH DASHBOARD STATS
                // ============================================================

                fetchDashboardStats: async (
                    teacherId: string,
                    branchId: string | null = null,
                    forceRefresh: boolean = false
                ) => {
                    const state = get();
                    
                    // Check cache first (unless force refresh)
                    if (!forceRefresh && state.isCacheValid(teacherId, branchId)) {
                        const cachedData = state.getCachedData(teacherId, branchId);
                        if (cachedData) {
                            // Use cached data
                            const processed = processStats(cachedData);
                            set({
                                dashboardStats: cachedData,
                                ...processed,
                                lastFetchParams: { teacherId, branchId },
                            });
                            return true;
                        }
                    }

                    // Set loading state
                    set({ 
                        loading: true, 
                        error: null,
                        lastFetchParams: { teacherId, branchId },
                    });

                    try {
                        const result = await branchTeacherService.getTeacherDashboardStats(
                            teacherId,
                            branchId
                        );

                        if (result.success && result.data) {
                            const stats = result.data;
                            const processed = processStats(stats);
                            const cacheKey = getCacheKey(teacherId, branchId);
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
                                        teacher_id: teacherId,
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
                        console.error('Dashboard fetch error:', error);
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
                            params.teacherId,
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

                isCacheValid: (teacherId: string, branchId: string | null = null) => {
                    const state = get();
                    const cacheKey = getCacheKey(teacherId, branchId);
                    const cached = state.cache[cacheKey];
                    
                    if (!cached) return false;
                    
                    const now = Date.now();
                    const age = now - cached.timestamp;
                    
                    return age < DASHBOARD_CACHE_TTL;
                },

                getCachedData: (teacherId: string, branchId: string | null = null) => {
                    const state = get();
                    const cacheKey = getCacheKey(teacherId, branchId);
                    const cached = state.cache[cacheKey];
                    
                    if (!cached || !state.isCacheValid(teacherId, branchId)) {
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
                name: 'teacher-dashboard-store',
                partialize: (state) => ({
                    // Only persist cache (for faster initial loads)
                    cache: state.cache,
                }),
            }
        ),
        {
            name: 'TeacherDashboard',
        }
    )
);

// ============================================================
// SELECTORS
// ============================================================

/**
 * Select dashboard stats
 */
export const selectDashboardStats = (state: TeacherDashboardState) => 
    state.dashboardStats;

/**
 * Select quick stats
 */
export const selectQuickStats = (state: TeacherDashboardState) => 
    state.quickStats;

/**
 * Select formatted schedule
 */
export const selectFormattedSchedule = (state: TeacherDashboardState) => 
    state.formattedSchedule;

/**
 * Select formatted deadlines
 */
export const selectFormattedDeadlines = (state: TeacherDashboardState) => 
    state.formattedDeadlines;

/**
 * Select loading state
 */
export const selectDashboardLoading = (state: TeacherDashboardState) => 
    state.loading;

/**
 * Select refreshing state
 */
export const selectDashboardRefreshing = (state: TeacherDashboardState) => 
    state.refreshing;

/**
 * Select error
 */
export const selectDashboardError = (state: TeacherDashboardState) => 
    state.error;

/**
 * Select grading stats
 */
export const selectGradingStats = (state: TeacherDashboardState) => 
    state.dashboardStats?.grading_stats ?? null;

/**
 * Select at-risk students
 */
export const selectAtRiskStudents = (state: TeacherDashboardState) => 
    state.dashboardStats?.at_risk_students ?? null;

/**
 * Select assignments by class
 */
export const selectAssignmentsByClass = (state: TeacherDashboardState) => 
    state.dashboardStats?.assignments_by_class ?? [];

/**
 * Select recent activity
 */
export const selectRecentActivity = (state: TeacherDashboardState) => 
    state.dashboardStats?.recent_activity ?? null;

/**
 * Select today's schedule
 */
export const selectTodaySchedule = (state: TeacherDashboardState) => 
    state.dashboardStats?.today_schedule ?? [];
