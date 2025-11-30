/**
 * Student Attendance Store
 * 
 * Zustand store for managing student attendance state in React components.
 * Provides actions for CRUD operations, filtering, pagination, and caching.
 * Implements devtools integration and persistence for improved developer experience.
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
    fetchAttendanceList: (params?: AttendanceListParams) => Promise<void>;

    /**
     * Fetches daily attendance for teacher's class view
     */
    fetchDailyAttendance: (classId: string, date?: string) => Promise<void>;

    /**
     * Fetches attendance record by ID
     */
    fetchAttendanceById: (attendanceId: string) => Promise<void>;

    /**
     * Fetches student attendance summary
     */
    fetchStudentSummary: (
        studentId: string,
        classId?: string,
        fromDate?: string,
        toDate?: string
    ) => Promise<void>;

    /**
     * Fetches class attendance report
     */
    fetchClassReport: (
        classId: string,
        fromDate?: string,
        toDate?: string
    ) => Promise<void>;

    // ============================================================
    // ACTIONS - CONVENIENCE METHODS
    // ============================================================

    /**
     * Fetches attendance for a specific teacher
     */
    fetchTeacherAttendance: (teacherId: string, params?: Omit<AttendanceListParams, 'teacher_id'>) => Promise<void>;

    /**
     * Fetches attendance for a specific student
     */
    fetchStudentAttendance: (studentId: string, params?: Omit<AttendanceListParams, 'student_id'>) => Promise<void>;

    /**
     * Fetches attendance for a specific class
     */
    fetchClassAttendance: (classId: string, params?: Omit<AttendanceListParams, 'class_id'>) => Promise<void>;

    /**
     * Fetches attendance for a specific branch
     */
    fetchBranchAttendance: (branchId: string, params?: Omit<AttendanceListParams, 'branch_id'>) => Promise<void>;

    /**
     * Fetches daily attendance for a coaching center (all branches)
     * For coach view - aggregates attendance across all branches
     */
    fetchCoachingCenterDailyAttendance: (coachingCenterId: string, date?: string) => Promise<void>;

    /**
     * Fetches daily attendance for a specific branch
     * For branch manager view
     */
    fetchBranchDailyAttendance: (branchId: string, date?: string) => Promise<void>;

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

                    const result = await studentAttendanceService.deleteAttendance(attendanceId);

                    if (result.success) {
                        set((state) => {
                            state.loading.delete = false;
                            state.successMessage = 'Attendance record deleted successfully';

                            // Remove from records
                            state.attendanceRecords = state.attendanceRecords.filter(r => r.id !== attendanceId);

                            // Clear current record if it's the deleted one
                            if (state.currentRecord?.id === attendanceId) {
                                state.currentRecord = null;
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
                // FETCH ACTIONS
                // ============================================================

                fetchAttendanceList: async (params?: AttendanceListParams) => {
                    set((state) => {
                        state.loading.list = true;
                        state.error = null;
                    });

                    const currentState = get();
                    const queryParams = {
                        ...currentState.filters,
                        ...currentState.sort,
                        page: currentState.pagination.page,
                        limit: currentState.pagination.limit,
                        ...params,
                    };

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
                        });
                    } else {
                        set((state) => {
                            state.loading.list = false;
                            state.error = result.error || 'Failed to fetch attendance records';
                        });
                    }
                },

                fetchDailyAttendance: async (classId: string, date?: string) => {
                    set((state) => {
                        state.loading.daily = true;
                        state.error = null;
                    });

                    const result = await studentAttendanceService.getDailyAttendance(
                        classId,
                        date || getCurrentDateString()
                    );

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.daily = false;
                            state.dailyRecords = result.data!;
                        });
                    } else {
                        set((state) => {
                            state.loading.daily = false;
                            state.error = result.error || 'Failed to fetch daily attendance';
                        });
                    }
                },

                fetchAttendanceById: async (attendanceId: string) => {
                    set((state) => {
                        state.loading.list = true;
                        state.error = null;
                    });

                    const result = await studentAttendanceService.getAttendanceById(attendanceId);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.list = false;
                            state.currentRecord = result.data!;
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
                    toDate?: string
                ) => {
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
                        });
                    } else {
                        set((state) => {
                            state.loading.summary = false;
                            state.error = result.error || 'Failed to fetch attendance summary';
                        });
                    }
                },

                fetchClassReport: async (classId: string, fromDate?: string, toDate?: string) => {
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

                fetchTeacherAttendance: async (teacherId: string, params?: Omit<AttendanceListParams, 'teacher_id'>) => {
                    return get().fetchAttendanceList({ ...params, teacher_id: teacherId });
                },

                fetchStudentAttendance: async (studentId: string, params?: Omit<AttendanceListParams, 'student_id'>) => {
                    return get().fetchAttendanceList({ ...params, student_id: studentId });
                },

                fetchClassAttendance: async (classId: string, params?: Omit<AttendanceListParams, 'class_id'>) => {
                    return get().fetchAttendanceList({ ...params, class_id: classId });
                },

                fetchBranchAttendance: async (branchId: string, params?: Omit<AttendanceListParams, 'branch_id'>) => {
                    return get().fetchAttendanceList({ ...params, branch_id: branchId });
                },

                fetchCoachingCenterDailyAttendance: async (coachingCenterId: string, date?: string) => {
                    set((state) => {
                        state.loading.daily = true;
                        state.error = null;
                    });

                    const result = await studentAttendanceService.getCoachingCenterDailyAttendance(
                        coachingCenterId,
                        date || getCurrentDateString()
                    );

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.daily = false;
                            state.dailyRecords = result.data!;
                        });
                    } else {
                        set((state) => {
                            state.loading.daily = false;
                            state.error = result.error || 'Failed to fetch coaching center attendance';
                        });
                    }
                },

                fetchBranchDailyAttendance: async (branchId: string, date?: string) => {
                    set((state) => {
                        state.loading.daily = true;
                        state.error = null;
                    });

                    const result = await studentAttendanceService.getBranchDailyAttendance(
                        branchId,
                        date || getCurrentDateString()
                    );

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.daily = false;
                            state.dailyRecords = result.data!;
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
                    });
                },

                resetFilters: () => {
                    set((state) => {
                        state.filters = {};
                        state.pagination.page = 1;
                    });
                },

                setPagination: (page: number, limit?: number) => {
                    set((state) => {
                        state.pagination.page = page;
                        if (limit) {
                            state.pagination.limit = limit;
                        }
                    });
                },

                setSort: (sortBy: 'attendance_date' | 'created_at', sortOrder: 'asc' | 'desc') => {
                    set((state) => {
                        state.sort.sort_by = sortBy;
                        state.sort.sort_order = sortOrder;
                        state.pagination.page = 1; // Reset to first page when sort changes
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
            })),
            {
                name: 'student-attendance-store',
                // Only persist filters and pagination, not data
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
    reset: state.reset,
}));

// ============================================================
// TYPE EXPORTS
// ============================================================

export type { StudentAttendanceState };