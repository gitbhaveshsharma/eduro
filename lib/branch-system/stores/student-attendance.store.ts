/**
 * Student Attendance Store
 * 
 * Zustand store for managing student attendance state in React components.
 * Provides actions for CRUD operations, filtering, pagination, and caching.
 * Implements devtools integration, persistence, and intelligent cache management.
 * 
 * @module branch-system/stores/student-attendance
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useMemo } from 'react';
import {
    studentAttendanceService,
    type AttendanceOperationResult,
} from '../services/student-attendance.service';
import type {
    StudentAttendance,
    MarkAttendanceDTO,
    BulkMarkAttendanceDTO,
    UpdateAttendanceDTO,
    AttendanceFilters,
    AttendanceListParams,
    AttendanceListResponse,
    StudentAttendanceSummary,
    ClassAttendanceReport,
    DailyAttendanceRecord,
    AttendanceStatus,
} from '../types/student-attendance.types';
import { getCurrentDateString } from '../utils/student-attendance.utils';

// ============================================================
// CACHE CONFIGURATION
// ============================================================

/**
 * Cache duration in milliseconds
 */
const CACHE_DURATION = {
    LIST: 2 * 60 * 1000,        // 2 minutes for list data
    DAILY: 1 * 60 * 1000,       // 1 minute for daily attendance (more frequent updates)
    SUMMARY: 5 * 60 * 1000,     // 5 minutes for summary (less frequent changes)
    REPORT: 5 * 60 * 1000,      // 5 minutes for reports
    SINGLE: 3 * 60 * 1000,      // 3 minutes for single record
} as const;

/**
 * Cache entry interface
 */
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    key: string;
}

/**
 * Cache metadata for tracking
 */
interface CacheMetadata {
    lastListFetch: number | null;
    lastDailyFetch: Record<string, number>; // classId/branchId -> timestamp
    lastSummaryFetch: Record<string, number>; // studentId -> timestamp
    lastReportFetch: Record<string, number>; // classId -> timestamp
    lastRecordFetch: Record<string, number>; // recordId -> timestamp
}

// ============================================================
// STATE INTERFACE
// ============================================================

interface StudentAttendanceState {
    // ============================================================
    // STATE DATA
    // ============================================================

    /**
     * Current attendance records list
     */
    attendanceRecords: StudentAttendance[];

    /**
     * Daily attendance records for teacher's class view
     */
    dailyRecords: DailyAttendanceRecord[];

    /**
     * Current attendance record (for viewing/editing)
     */
    currentRecord: StudentAttendance | null;

    /**
     * Student attendance summary
     */
    studentSummary: StudentAttendanceSummary | null;

    /**
     * Class attendance report
     */
    classReport: ClassAttendanceReport | null;

    /**
     * Current filters applied
     */
    filters: AttendanceFilters;

    /**
     * Pagination state
     */
    pagination: {
        page: number;
        limit: number;
        total: number;
        has_more: boolean;
    };

    /**
     * Sort configuration
     */
    sort: {
        sort_by: 'attendance_date' | 'created_at';
        sort_order: 'asc' | 'desc';
    };

    /**
     * Loading states
     */
    loading: {
        list: boolean;
        daily: boolean;
        create: boolean;
        update: boolean;
        delete: boolean;
        summary: boolean;
        report: boolean;
    };

    /**
     * Error state
     */
    error: string | null;

    /**
     * Success message (for operations feedback)
     */
    successMessage: string | null;

    /**
     * Cache metadata for intelligent cache management
     */
    _cacheMetadata: CacheMetadata;

    /**
     * Last query params hash for cache invalidation
     */
    _lastQueryHash: string | null;

    // ============================================================
    // ACTIONS - CRUD OPERATIONS
    // ============================================================

    /**
     * Marks attendance for a student
     */
    markAttendance: (input: MarkAttendanceDTO) => Promise<boolean>;

    /**
     * Marks attendance for multiple students (bulk)
     */
    bulkMarkAttendance: (input: BulkMarkAttendanceDTO) => Promise<boolean>;

    /**
     * Updates an existing attendance record
     */
    updateAttendance: (input: UpdateAttendanceDTO) => Promise<boolean>;

    /**
     * Deletes an attendance record
     */
    deleteAttendance: (attendanceId: string) => Promise<boolean>;

    // ============================================================
    // ACTIONS - DATA FETCHING
    // ============================================================

    /**
     * Fetches attendance records with filtering and pagination
     */
    fetchAttendanceList: (params?: AttendanceListParams, forceRefresh?: boolean) => Promise<void>;

    /**
     * Fetches daily attendance for teacher's class view
     */
    fetchDailyAttendance: (classId: string, date?: string, forceRefresh?: boolean) => Promise<void>;

    /**
     * Fetches attendance record by ID
     */
    fetchAttendanceById: (attendanceId: string, forceRefresh?: boolean) => Promise<void>;

    /**
     * Fetches student attendance summary
     */
    fetchStudentSummary: (
        studentId: string,
        classId?: string,
        fromDate?: string,
        toDate?: string,
        forceRefresh?: boolean
    ) => Promise<void>;

    /**
     * Fetches class attendance report
     */
    fetchClassReport: (
        classId: string,
        fromDate?: string,
        toDate?: string,
        forceRefresh?: boolean
    ) => Promise<void>;

    // ============================================================
    // ACTIONS - CONVENIENCE METHODS
    // ============================================================

    /**
     * Fetches attendance for a specific teacher
     */
    fetchTeacherAttendance: (teacherId: string, params?: Omit<AttendanceListParams, 'teacher_id'>, forceRefresh?: boolean) => Promise<void>;

    /**
     * Fetches attendance for a specific student
     */
    fetchStudentAttendance: (studentId: string, params?: Omit<AttendanceListParams, 'student_id'>, forceRefresh?: boolean) => Promise<void>;

    /**
     * Fetches attendance for a specific class
     */
    fetchClassAttendance: (classId: string, params?: Omit<AttendanceListParams, 'class_id'>, forceRefresh?: boolean) => Promise<void>;

    /**
     * Fetches attendance for a specific branch
     */
    fetchBranchAttendance: (branchId: string, params?: Omit<AttendanceListParams, 'branch_id'>, forceRefresh?: boolean) => Promise<void>;

    /**
     * Fetches daily attendance for a coaching center (all branches)
     * For coach view - aggregates attendance across all branches
     */
    fetchCoachingCenterDailyAttendance: (coachingCenterId: string, date?: string, forceRefresh?: boolean) => Promise<void>;

    /**
     * Fetches daily attendance for a specific branch
     * For branch manager view
     */
    fetchBranchDailyAttendance: (branchId: string, date?: string, forceRefresh?: boolean) => Promise<void>;

    // ============================================================
    // ACTIONS - STATE MANAGEMENT
    // ============================================================

    /**
     * Sets current attendance record
     */
    setCurrentRecord: (record: StudentAttendance | null) => void;

    /**
     * Sets filters
     */
    setFilters: (filters: Partial<AttendanceFilters>) => void;

    /**
     * Resets filters to default
     */
    resetFilters: () => void;

    /**
     * Sets pagination
     */
    setPagination: (page: number, limit?: number) => void;

    /**
     * Sets sort configuration
     */
    setSort: (sortBy: 'attendance_date' | 'created_at', sortOrder: 'asc' | 'desc') => void;

    /**
     * Clears all error states
     */
    clearError: () => void;

    /**
     * Clears success message
     */
    clearSuccessMessage: () => void;

    /**
     * Invalidates all caches
     */
    invalidateCache: () => void;

    /**
     * Invalidates specific cache by key
     */
    invalidateCacheByKey: (key: 'list' | 'daily' | 'summary' | 'report' | 'record', identifier?: string) => void;

    /**
     * Resets entire store to initial state
     */
    reset: () => void;

    // ============================================================
    // SELECTORS
    // ============================================================

    /**
     * Gets attendance records by status
     */
    getRecordsByStatus: (status: AttendanceStatus) => StudentAttendance[];

    /**
     * Gets attendance records for a specific date
     */
    getRecordsByDate: (date: string) => StudentAttendance[];

    /**
     * Checks if any operation is loading
     */
    isAnyLoading: () => boolean;

    /**
     * Gets current day attendance statistics
     */
    getDailyStats: () => {
        total: number;
        present: number;
        absent: number;
        late: number;
        excused: number;
        marked: number;
        unmarked: number;
    };

    /**
     * Checks if cache is valid for a given key
     */
    _isCacheValid: (key: string, duration: number) => boolean;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Generates a hash for query parameters to detect changes
 */
function generateQueryHash(params: Record<string, any>): string {
    return JSON.stringify(params, Object.keys(params).sort());
}

/**
 * Checks if cache entry is still valid
 */
function isCacheValid(timestamp: number | null, duration: number): boolean {
    if (!timestamp) return false;
    return Date.now() - timestamp < duration;
}

// ============================================================
// INITIAL STATE
// ============================================================

const initialState = {
    attendanceRecords: [],
    dailyRecords: [],
    currentRecord: null,
    studentSummary: null,
    classReport: null,
    filters: {},
    pagination: {
        page: 1,
        limit: 20,
        total: 0,
        has_more: false,
    },
    sort: {
        sort_by: 'attendance_date' as const,
        sort_order: 'desc' as const,
    },
    loading: {
        list: false,
        daily: false,
        create: false,
        update: false,
        delete: false,
        summary: false,
        report: false,
    },
    error: null,
    successMessage: null,
    _cacheMetadata: {
        lastListFetch: null,
        lastDailyFetch: {},
        lastSummaryFetch: {},
        lastReportFetch: {},
        lastRecordFetch: {},
    },
    _lastQueryHash: null,
};

// ============================================================
// STORE IMPLEMENTATION
// ============================================================

export const useStudentAttendanceStore = create<StudentAttendanceState>()(
    devtools(
        persist(
            immer((set, get) => ({
                ...initialState,

                // ============================================================
                // CRUD ACTIONS
                // ============================================================

                markAttendance: async (input: MarkAttendanceDTO) => {
                    set((state) => {
                        state.loading.create = true;
                        state.error = null;
                        state.successMessage = null;
                    });

                    const result = await studentAttendanceService.markAttendance(input);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.create = false;
                            state.successMessage = 'Attendance marked successfully';

                            // Add to records if it matches current filters
                            const currentFilters = state.filters;
                            const matchesFilters = (
                                (!currentFilters.student_id || result.data!.student_id === currentFilters.student_id) &&
                                (!currentFilters.class_id || result.data!.class_id === currentFilters.class_id) &&
                                (!currentFilters.teacher_id || result.data!.teacher_id === currentFilters.teacher_id) &&
                                (!currentFilters.branch_id || result.data!.branch_id === currentFilters.branch_id) &&
                                (!currentFilters.attendance_status || result.data!.attendance_status === currentFilters.attendance_status) &&
                                (!currentFilters.attendance_date || result.data!.attendance_date === currentFilters.attendance_date)
                            );

                            if (matchesFilters) {
                                state.attendanceRecords.unshift(result.data!);
                                state.pagination.total += 1;
                            }

                            // Update daily records if applicable
                            const dailyRecordIndex = state.dailyRecords.findIndex(
                                r => r.student_id === result.data!.student_id
                            );
                            if (dailyRecordIndex >= 0) {
                                state.dailyRecords[dailyRecordIndex] = {
                                    ...state.dailyRecords[dailyRecordIndex],
                                    attendance_status: result.data!.attendance_status,
                                    check_in_time: result.data!.check_in_time,
                                    check_out_time: result.data!.check_out_time,
                                    late_by_minutes: result.data!.late_by_minutes,
                                    teacher_remarks: result.data!.teacher_remarks,
                                    is_marked: true,
                                };
                            }

                            // Invalidate relevant caches
                            state._cacheMetadata.lastListFetch = null;
                            if (result.data!.class_id) {
                                delete state._cacheMetadata.lastDailyFetch[result.data!.class_id];
                            }
                            if (result.data!.student_id) {
                                delete state._cacheMetadata.lastSummaryFetch[result.data!.student_id];
                            }
                            if (result.data!.class_id) {
                                delete state._cacheMetadata.lastReportFetch[result.data!.class_id];
                            }
                        });
                        return true;
                    } else {
                        set((state) => {
                            state.loading.create = false;
                            state.error = result.error || 'Failed to mark attendance';
                        });
                        return false;
                    }
                },

                bulkMarkAttendance: async (input: BulkMarkAttendanceDTO) => {
                    set((state) => {
                        state.loading.create = true;
                        state.error = null;
                        state.successMessage = null;
                    });

                    const result = await studentAttendanceService.bulkMarkAttendance(input);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.create = false;
                            state.successMessage = `Bulk attendance marked for ${result.data!.length} students`;

                            // Update attendance records
                            result.data!.forEach(record => {
                                const existingIndex = state.attendanceRecords.findIndex(r => r.id === record.id);
                                if (existingIndex >= 0) {
                                    state.attendanceRecords[existingIndex] = record;
                                } else {
                                    state.attendanceRecords.unshift(record);
                                    state.pagination.total += 1;
                                }
                            });

                            // Update daily records
                            result.data!.forEach(record => {
                                const dailyRecordIndex = state.dailyRecords.findIndex(
                                    r => r.student_id === record.student_id
                                );
                                if (dailyRecordIndex >= 0) {
                                    state.dailyRecords[dailyRecordIndex] = {
                                        ...state.dailyRecords[dailyRecordIndex],
                                        attendance_status: record.attendance_status,
                                        check_in_time: record.check_in_time,
                                        check_out_time: record.check_out_time,
                                        late_by_minutes: record.late_by_minutes,
                                        teacher_remarks: record.teacher_remarks,
                                        is_marked: true,
                                    };
                                }
                            });

                            // Invalidate relevant caches
                            state._cacheMetadata.lastListFetch = null;
                            delete state._cacheMetadata.lastDailyFetch[input.class_id];
                            delete state._cacheMetadata.lastReportFetch[input.class_id];
                            // Invalidate all student summaries for affected students
                            input.attendance_records.forEach(record => {
                                delete state._cacheMetadata.lastSummaryFetch[record.student_id];
                            });
                        });
                        return true;
                    } else {
                        set((state) => {
                            state.loading.create = false;
                            state.error = result.error || 'Failed to mark bulk attendance';
                        });
                        return false;
                    }
                },

                updateAttendance: async (input: UpdateAttendanceDTO) => {
                    set((state) => {
                        state.loading.update = true;
                        state.error = null;
                        state.successMessage = null;
                    });

                    const result = await studentAttendanceService.updateAttendance(input);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.update = false;
                            state.successMessage = 'Attendance updated successfully';

                            // Update in records list
                            const recordIndex = state.attendanceRecords.findIndex(r => r.id === input.id);
                            if (recordIndex >= 0) {
                                state.attendanceRecords[recordIndex] = result.data!;
                            }

                            // Update current record if it's the same
                            if (state.currentRecord?.id === input.id) {
                                state.currentRecord = result.data!;
                            }

                            // Update daily record if applicable
                            const dailyRecordIndex = state.dailyRecords.findIndex(
                                r => r.student_id === result.data!.student_id
                            );
                            if (dailyRecordIndex >= 0) {
                                state.dailyRecords[dailyRecordIndex] = {
                                    ...state.dailyRecords[dailyRecordIndex],
                                    attendance_status: result.data!.attendance_status,
                                    check_in_time: result.data!.check_in_time,
                                    check_out_time: result.data!.check_out_time,
                                    late_by_minutes: result.data!.late_by_minutes,
                                    teacher_remarks: result.data!.teacher_remarks,
                                    is_marked: true,
                                };
                            }

                            // Invalidate relevant caches
                            delete state._cacheMetadata.lastRecordFetch[input.id];
                            if (result.data!.class_id) {
                                delete state._cacheMetadata.lastDailyFetch[result.data!.class_id];
                                delete state._cacheMetadata.lastReportFetch[result.data!.class_id];
                            }
                            if (result.data!.student_id) {
                                delete state._cacheMetadata.lastSummaryFetch[result.data!.student_id];
                            }
                        });
                        return true;
                    } else {
                        set((state) => {
                            state.loading.update = false;
                            state.error = result.error || 'Failed to update attendance';
                        });
                        return false;
                    }
                },

                deleteAttendance: async (attendanceId: string) => {
                    set((state) => {
                        state.loading.delete = true;
                        state.error = null;
                        state.successMessage = null;
                    });

                    // Get the record before deletion for cache invalidation
                    const recordToDelete = get().attendanceRecords.find(r => r.id === attendanceId);

                    const result = await studentAttendanceService.deleteAttendance(attendanceId);

                    if (result.success) {
                        set((state) => {
                            state.loading.delete = false;
                            state.successMessage = 'Attendance record deleted successfully';

                            // Remove from records
                            state.attendanceRecords = state.attendanceRecords.filter(r => r.id !== attendanceId);
                            state.pagination.total = Math.max(0, state.pagination.total - 1);

                            // Clear current record if it's the deleted one
                            if (state.currentRecord?.id === attendanceId) {
                                state.currentRecord = null;
                            }

                            // Invalidate relevant caches
                            state._cacheMetadata.lastListFetch = null;
                            delete state._cacheMetadata.lastRecordFetch[attendanceId];

                            if (recordToDelete) {
                                if (recordToDelete.class_id) {
                                    delete state._cacheMetadata.lastDailyFetch[recordToDelete.class_id];
                                    delete state._cacheMetadata.lastReportFetch[recordToDelete.class_id];
                                }
                                if (recordToDelete.student_id) {
                                    delete state._cacheMetadata.lastSummaryFetch[recordToDelete.student_id];
                                }
                            }
                        });
                        return true;
                    } else {
                        set((state) => {
                            state.loading.delete = false;
                            state.error = result.error || 'Failed to delete attendance';
                        });
                        return false;
                    }
                },

                // ============================================================
                // FETCH ACTIONS WITH CACHING
                // ============================================================

                fetchAttendanceList: async (params?: AttendanceListParams, forceRefresh: boolean = false) => {
                    const currentState = get();
                    const queryParams = {
                        ...currentState.filters,
                        ...currentState.sort,
                        page: currentState.pagination.page,
                        limit: currentState.pagination.limit,
                        ...params,
                    };

                    const queryHash = generateQueryHash(queryParams);
                    const isSameQuery = currentState._lastQueryHash === queryHash;

                    // Check cache validity
                    if (
                        !forceRefresh &&
                        isSameQuery &&
                        currentState.attendanceRecords.length > 0 &&
                        isCacheValid(currentState._cacheMetadata.lastListFetch, CACHE_DURATION.LIST)
                    ) {
                        console.log('[Cache] Using cached attendance list');
                        return;
                    }

                    set((state) => {
                        state.loading.list = true;
                        state.error = null;
                    });

                    const result = await studentAttendanceService.listAttendance(queryParams);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.list = false;
                            state.attendanceRecords = result.data!.data;
                            state.pagination = {
                                page: result.data!.page,
                                limit: result.data!.limit,
                                total: result.data!.total,
                                has_more: result.data!.has_more,
                            };
                            state._cacheMetadata.lastListFetch = Date.now();
                            state._lastQueryHash = queryHash;
                        });
                    } else {
                        set((state) => {
                            state.loading.list = false;
                            state.error = result.error || 'Failed to fetch attendance records';
                        });
                    }
                },

                fetchDailyAttendance: async (classId: string, date?: string, forceRefresh: boolean = false) => {
                    const currentState = get();
                    const effectiveDate = date || getCurrentDateString();
                    const cacheKey = `${classId}_${effectiveDate}`;

                    // Check cache validity
                    if (
                        !forceRefresh &&
                        currentState.dailyRecords.length > 0 &&
                        isCacheValid(currentState._cacheMetadata.lastDailyFetch[cacheKey], CACHE_DURATION.DAILY)
                    ) {
                        console.log('[Cache] Using cached daily attendance for class:', classId);
                        return;
                    }

                    set((state) => {
                        state.loading.daily = true;
                        state.error = null;
                    });

                    const result = await studentAttendanceService.getDailyAttendance(classId, effectiveDate);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.daily = false;
                            state.dailyRecords = result.data!;
                            state._cacheMetadata.lastDailyFetch[cacheKey] = Date.now();
                        });
                    } else {
                        set((state) => {
                            state.loading.daily = false;
                            state.error = result.error || 'Failed to fetch daily attendance';
                        });
                    }
                },

                fetchAttendanceById: async (attendanceId: string, forceRefresh: boolean = false) => {
                    const currentState = get();

                    // Check if we already have this record and it's fresh
                    const cachedRecord = currentState.attendanceRecords.find(r => r.id === attendanceId);
                    if (
                        !forceRefresh &&
                        cachedRecord &&
                        isCacheValid(currentState._cacheMetadata.lastRecordFetch[attendanceId], CACHE_DURATION.SINGLE)
                    ) {
                        console.log('[Cache] Using cached attendance record:', attendanceId);
                        set((state) => {
                            state.currentRecord = cachedRecord;
                        });
                        return;
                    }

                    set((state) => {
                        state.loading.list = true;
                        state.error = null;
                    });

                    const result = await studentAttendanceService.getAttendanceById(attendanceId);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.list = false;
                            state.currentRecord = result.data!;
                            state._cacheMetadata.lastRecordFetch[attendanceId] = Date.now();

                            // Update in records list if exists
                            const recordIndex = state.attendanceRecords.findIndex(r => r.id === attendanceId);
                            if (recordIndex >= 0) {
                                state.attendanceRecords[recordIndex] = result.data!;
                            }
                        });
                    } else {
                        set((state) => {
                            state.loading.list = false;
                            state.error = result.error || 'Failed to fetch attendance record';
                        });
                    }
                },

                fetchStudentSummary: async (
                    studentId: string,
                    classId?: string,
                    fromDate?: string,
                    toDate?: string,
                    forceRefresh: boolean = false
                ) => {
                    const currentState = get();
                    const cacheKey = `${studentId}_${classId || 'all'}_${fromDate || ''}_${toDate || ''}`;

                    // Check cache validity
                    if (
                        !forceRefresh &&
                        currentState.studentSummary &&
                        isCacheValid(currentState._cacheMetadata.lastSummaryFetch[cacheKey], CACHE_DURATION.SUMMARY)
                    ) {
                        console.log('[Cache] Using cached student summary:', studentId);
                        return;
                    }

                    set((state) => {
                        state.loading.summary = true;
                        state.error = null;
                    });

                    const result = await studentAttendanceService.getStudentAttendanceSummary({
                        student_id: studentId,
                        class_id: classId,
                        from_date: fromDate,
                        to_date: toDate,
                    });

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.summary = false;
                            state.studentSummary = result.data!;
                            state._cacheMetadata.lastSummaryFetch[cacheKey] = Date.now();
                        });
                    } else {
                        set((state) => {
                            state.loading.summary = false;
                            state.error = result.error || 'Failed to fetch attendance summary';
                        });
                    }
                },

                fetchClassReport: async (
                    classId: string,
                    fromDate?: string,
                    toDate?: string,
                    forceRefresh: boolean = false
                ) => {
                    const currentState = get();
                    const cacheKey = `${classId}_${fromDate || ''}_${toDate || ''}`;

                    // Check cache validity
                    if (
                        !forceRefresh &&
                        currentState.classReport &&
                        isCacheValid(currentState._cacheMetadata.lastReportFetch[cacheKey], CACHE_DURATION.REPORT)
                    ) {
                        console.log('[Cache] Using cached class report:', classId);
                        return;
                    }

                    set((state) => {
                        state.loading.report = true;
                        state.error = null;
                    });

                    const result = await studentAttendanceService.getClassAttendanceReport({
                        class_id: classId,
                        from_date: fromDate,
                        to_date: toDate,
                    });

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.report = false;
                            state.classReport = result.data!;
                            state._cacheMetadata.lastReportFetch[cacheKey] = Date.now();
                        });
                    } else {
                        set((state) => {
                            state.loading.report = false;
                            state.error = result.error || 'Failed to fetch class report';
                        });
                    }
                },

                // ============================================================
                // CONVENIENCE METHODS
                // ============================================================

                fetchTeacherAttendance: async (teacherId: string, params?: Omit<AttendanceListParams, 'teacher_id'>, forceRefresh: boolean = false) => {
                    return get().fetchAttendanceList({ ...params, teacher_id: teacherId }, forceRefresh);
                },

                fetchStudentAttendance: async (studentId: string, params?: Omit<AttendanceListParams, 'student_id'>, forceRefresh: boolean = false) => {
                    return get().fetchAttendanceList({ ...params, student_id: studentId }, forceRefresh);
                },

                fetchClassAttendance: async (classId: string, params?: Omit<AttendanceListParams, 'class_id'>, forceRefresh: boolean = false) => {
                    return get().fetchAttendanceList({ ...params, class_id: classId }, forceRefresh);
                },

                fetchBranchAttendance: async (branchId: string, params?: Omit<AttendanceListParams, 'branch_id'>, forceRefresh: boolean = false) => {
                    return get().fetchAttendanceList({ ...params, branch_id: branchId }, forceRefresh);
                },

                fetchCoachingCenterDailyAttendance: async (coachingCenterId: string, date?: string, forceRefresh: boolean = false) => {
                    const currentState = get();
                    const effectiveDate = date || getCurrentDateString();
                    const cacheKey = `center_${coachingCenterId}_${effectiveDate}`;

                    // Check cache validity
                    if (
                        !forceRefresh &&
                        currentState.dailyRecords.length > 0 &&
                        isCacheValid(currentState._cacheMetadata.lastDailyFetch[cacheKey], CACHE_DURATION.DAILY)
                    ) {
                        console.log('[Cache] Using cached coaching center daily attendance:', coachingCenterId);
                        return;
                    }

                    set((state) => {
                        state.loading.daily = true;
                        state.error = null;
                    });

                    const result = await studentAttendanceService.getCoachingCenterDailyAttendance(
                        coachingCenterId,
                        effectiveDate
                    );

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.daily = false;
                            state.dailyRecords = result.data!;
                            state._cacheMetadata.lastDailyFetch[cacheKey] = Date.now();
                        });
                    } else {
                        set((state) => {
                            state.loading.daily = false;
                            state.error = result.error || 'Failed to fetch coaching center attendance';
                        });
                    }
                },

                fetchBranchDailyAttendance: async (branchId: string, date?: string, forceRefresh: boolean = false) => {
                    const currentState = get();
                    const effectiveDate = date || getCurrentDateString();
                    const cacheKey = `branch_${branchId}_${effectiveDate}`;

                    // Check cache validity
                    if (
                        !forceRefresh &&
                        currentState.dailyRecords.length > 0 &&
                        isCacheValid(currentState._cacheMetadata.lastDailyFetch[cacheKey], CACHE_DURATION.DAILY)
                    ) {
                        console.log('[Cache] Using cached branch daily attendance:', branchId);
                        return;
                    }

                    set((state) => {
                        state.loading.daily = true;
                        state.error = null;
                    });

                    const result = await studentAttendanceService.getBranchDailyAttendance(
                        branchId,
                        effectiveDate
                    );

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.daily = false;
                            state.dailyRecords = result.data!;
                            state._cacheMetadata.lastDailyFetch[cacheKey] = Date.now();
                        });
                    } else {
                        set((state) => {
                            state.loading.daily = false;
                            state.error = result.error || 'Failed to fetch branch attendance';
                        });
                    }
                },

                // ============================================================
                // STATE MANAGEMENT
                // ============================================================

                setCurrentRecord: (record: StudentAttendance | null) => {
                    set((state) => {
                        state.currentRecord = record;
                    });
                },

                setFilters: (filters: Partial<AttendanceFilters>) => {
                    set((state) => {
                        state.filters = { ...state.filters, ...filters };
                        state.pagination.page = 1; // Reset to first page when filters change
                        // Invalidate list cache when filters change
                        state._cacheMetadata.lastListFetch = null;
                        state._lastQueryHash = null;
                    });
                },

                resetFilters: () => {
                    set((state) => {
                        state.filters = {};
                        state.pagination.page = 1;
                        // Invalidate list cache when filters reset
                        state._cacheMetadata.lastListFetch = null;
                        state._lastQueryHash = null;
                    });
                },

                setPagination: (page: number, limit?: number) => {
                    set((state) => {
                        state.pagination.page = page;
                        if (limit && limit !== state.pagination.limit) {
                            state.pagination.limit = limit;
                            // Invalidate cache when page size changes
                            state._cacheMetadata.lastListFetch = null;
                            state._lastQueryHash = null;
                        }
                    });
                },

                setSort: (sortBy: 'attendance_date' | 'created_at', sortOrder: 'asc' | 'desc') => {
                    set((state) => {
                        state.sort.sort_by = sortBy;
                        state.sort.sort_order = sortOrder;
                        state.pagination.page = 1; // Reset to first page when sort changes
                        // Invalidate list cache when sort changes
                        state._cacheMetadata.lastListFetch = null;
                        state._lastQueryHash = null;
                    });
                },

                clearError: () => {
                    set((state) => {
                        state.error = null;
                    });
                },

                clearSuccessMessage: () => {
                    set((state) => {
                        state.successMessage = null;
                    });
                },

                invalidateCache: () => {
                    set((state) => {
                        state._cacheMetadata = {
                            lastListFetch: null,
                            lastDailyFetch: {},
                            lastSummaryFetch: {},
                            lastReportFetch: {},
                            lastRecordFetch: {},
                        };
                        state._lastQueryHash = null;
                    });
                    console.log('[Cache] All caches invalidated');
                },

                invalidateCacheByKey: (key: 'list' | 'daily' | 'summary' | 'report' | 'record', identifier?: string) => {
                    set((state) => {
                        switch (key) {
                            case 'list':
                                state._cacheMetadata.lastListFetch = null;
                                state._lastQueryHash = null;
                                break;
                            case 'daily':
                                if (identifier) {
                                    delete state._cacheMetadata.lastDailyFetch[identifier];
                                } else {
                                    state._cacheMetadata.lastDailyFetch = {};
                                }
                                break;
                            case 'summary':
                                if (identifier) {
                                    delete state._cacheMetadata.lastSummaryFetch[identifier];
                                } else {
                                    state._cacheMetadata.lastSummaryFetch = {};
                                }
                                break;
                            case 'report':
                                if (identifier) {
                                    delete state._cacheMetadata.lastReportFetch[identifier];
                                } else {
                                    state._cacheMetadata.lastReportFetch = {};
                                }
                                break;
                            case 'record':
                                if (identifier) {
                                    delete state._cacheMetadata.lastRecordFetch[identifier];
                                } else {
                                    state._cacheMetadata.lastRecordFetch = {};
                                }
                                break;
                        }
                    });
                    console.log(`[Cache] Cache invalidated for key: ${key}${identifier ? ` (${identifier})` : ''}`);
                },

                reset: () => {
                    set(() => ({ ...initialState }));
                },

                // ============================================================
                // SELECTORS
                // ============================================================

                getRecordsByStatus: (status: AttendanceStatus) => {
                    return get().attendanceRecords.filter(record => record.attendance_status === status);
                },

                getRecordsByDate: (date: string) => {
                    return get().attendanceRecords.filter(record => record.attendance_date === date);
                },

                isAnyLoading: () => {
                    const loading = get().loading;
                    return Object.values(loading).some(isLoading => isLoading);
                },

                getDailyStats: () => {
                    const dailyRecords = get().dailyRecords;
                    const total = dailyRecords.length;
                    const marked = dailyRecords.filter(r => r.is_marked).length;
                    const unmarked = total - marked;
                    const present = dailyRecords.filter(r => r.attendance_status === 'PRESENT').length;
                    const absent = dailyRecords.filter(r => r.attendance_status === 'ABSENT').length;
                    const late = dailyRecords.filter(r => r.attendance_status === 'LATE').length;
                    const excused = dailyRecords.filter(r => r.attendance_status === 'EXCUSED').length;

                    return {
                        total,
                        present,
                        absent,
                        late,
                        excused,
                        marked,
                        unmarked,
                    };
                },

                _isCacheValid: (key: string, duration: number) => {
                    return isCacheValid(get()._cacheMetadata.lastListFetch, duration);
                },
            })),
            {
                name: 'student-attendance-store',
                // Only persist filters, pagination, and sort - not data or cache metadata
                partialize: (state) => ({
                    filters: state.filters,
                    pagination: state.pagination,
                    sort: state.sort,
                }),
            }
        ),
        {
            name: 'student-attendance-store',
        }
    )
);

// ============================================================
// HOOK EXPORTS
// ============================================================

/**
 * Hook for accessing attendance records
 */
export const useAttendanceRecords = () => useStudentAttendanceStore((state) => state.attendanceRecords);

/**
 * Hook for accessing daily attendance records
 */
export const useDailyAttendanceRecords = () => useStudentAttendanceStore((state) => state.dailyRecords);

/**
 * Hook for accessing current attendance record
 */
export const useCurrentAttendanceRecord = () => useStudentAttendanceStore((state) => state.currentRecord);

/**
 * Hook for accessing attendance summary
 */
export const useAttendanceSummary = () => useStudentAttendanceStore((state) => state.studentSummary);

/**
 * Hook for accessing class report
 */
export const useClassAttendanceReport = () => useStudentAttendanceStore((state) => state.classReport);

/**
 * Hook for accessing filters
 */
export const useAttendanceFilters = () => useStudentAttendanceStore((state) => state.filters);

/**
 * Hook for accessing pagination
 */
export const useAttendancePagination = () => useStudentAttendanceStore((state) => state.pagination);

/**
 * Hook for accessing loading states
 */
export const useAttendanceLoading = () => useStudentAttendanceStore((state) => state.loading);

/**
 * Hook for accessing error state
 */
export const useAttendanceError = () => useStudentAttendanceStore((state) => state.error);

/**
 * Hook for accessing success message
 */
export const useAttendanceSuccessMessage = () => useStudentAttendanceStore((state) => state.successMessage);

/**
 * Hook for daily statistics - STABLE: uses useMemo to cache object
 */
export const useDailyAttendanceStats = () => {
    const dailyRecords = useStudentAttendanceStore((state) => state.dailyRecords);

    // Use useMemo to create a stable object reference
    return useMemo(() => {
        const total = dailyRecords.length;
        const marked = dailyRecords.filter(r => r.is_marked).length;
        const unmarked = total - marked;
        const present = dailyRecords.filter(r => r.attendance_status === 'PRESENT').length;
        const absent = dailyRecords.filter(r => r.attendance_status === 'ABSENT').length;
        const late = dailyRecords.filter(r => r.attendance_status === 'LATE').length;
        const excused = dailyRecords.filter(r => r.attendance_status === 'EXCUSED').length;

        return { total, present, absent, late, excused, marked, unmarked };
    }, [dailyRecords]);
};

// ============================================================
// INDIVIDUAL ACTION HOOKS - STABLE REFERENCES
// ============================================================

/**
 * Individual action hooks for stable references (prevent infinite loops)
 */
export const useMarkAttendance = () => useStudentAttendanceStore((state) => state.markAttendance);
export const useBulkMarkAttendance = () => useStudentAttendanceStore((state) => state.bulkMarkAttendance);
export const useUpdateAttendance = () => useStudentAttendanceStore((state) => state.updateAttendance);
export const useDeleteAttendance = () => useStudentAttendanceStore((state) => state.deleteAttendance);
export const useFetchAttendanceList = () => useStudentAttendanceStore((state) => state.fetchAttendanceList);
export const useFetchDailyAttendance = () => useStudentAttendanceStore((state) => state.fetchDailyAttendance);
export const useFetchAttendanceById = () => useStudentAttendanceStore((state) => state.fetchAttendanceById);
export const useFetchStudentSummary = () => useStudentAttendanceStore((state) => state.fetchStudentSummary);
export const useFetchClassReport = () => useStudentAttendanceStore((state) => state.fetchClassReport);
export const useFetchTeacherAttendance = () => useStudentAttendanceStore((state) => state.fetchTeacherAttendance);
export const useFetchStudentAttendance = () => useStudentAttendanceStore((state) => state.fetchStudentAttendance);
export const useFetchClassAttendance = () => useStudentAttendanceStore((state) => state.fetchClassAttendance);
export const useFetchBranchAttendance = () => useStudentAttendanceStore((state) => state.fetchBranchAttendance);
export const useFetchCoachingCenterDailyAttendance = () => useStudentAttendanceStore((state) => state.fetchCoachingCenterDailyAttendance);
export const useFetchBranchDailyAttendance = () => useStudentAttendanceStore((state) => state.fetchBranchDailyAttendance);
export const useSetCurrentRecord = () => useStudentAttendanceStore((state) => state.setCurrentRecord);
export const useSetAttendanceFilters = () => useStudentAttendanceStore((state) => state.setFilters);
export const useResetAttendanceFilters = () => useStudentAttendanceStore((state) => state.resetFilters);
export const useSetAttendancePagination = () => useStudentAttendanceStore((state) => state.setPagination);
export const useSetAttendanceSort = () => useStudentAttendanceStore((state) => state.setSort);
export const useClearAttendanceError = () => useStudentAttendanceStore((state) => state.clearError);
export const useClearAttendanceSuccessMessage = () => useStudentAttendanceStore((state) => state.clearSuccessMessage);
export const useInvalidateAttendanceCache = () => useStudentAttendanceStore((state) => state.invalidateCache);
export const useInvalidateAttendanceCacheByKey = () => useStudentAttendanceStore((state) => state.invalidateCacheByKey);
export const useResetAttendanceStore = () => useStudentAttendanceStore((state) => state.reset);

/**
 * @deprecated Use individual action hooks instead to prevent infinite loops
 * Hook for attendance actions - Returns object (can cause re-renders)
 */
export const useAttendanceActions = () => useStudentAttendanceStore((state) => ({
    markAttendance: state.markAttendance,
    bulkMarkAttendance: state.bulkMarkAttendance,
    updateAttendance: state.updateAttendance,
    deleteAttendance: state.deleteAttendance,
    fetchAttendanceList: state.fetchAttendanceList,
    fetchDailyAttendance: state.fetchDailyAttendance,
    fetchAttendanceById: state.fetchAttendanceById,
    fetchStudentSummary: state.fetchStudentSummary,
    fetchClassReport: state.fetchClassReport,
    fetchTeacherAttendance: state.fetchTeacherAttendance,
    fetchStudentAttendance: state.fetchStudentAttendance,
    fetchClassAttendance: state.fetchClassAttendance,
    fetchBranchAttendance: state.fetchBranchAttendance,
    setCurrentRecord: state.setCurrentRecord,
    setFilters: state.setFilters,
    resetFilters: state.resetFilters,
    setPagination: state.setPagination,
    setSort: state.setSort,
    clearError: state.clearError,
    clearSuccessMessage: state.clearSuccessMessage,
    invalidateCache: state.invalidateCache,
    invalidateCacheByKey: state.invalidateCacheByKey,
    reset: state.reset,
}));

// ============================================================
// TYPE EXPORTS
// ============================================================

export type { StudentAttendanceState };
