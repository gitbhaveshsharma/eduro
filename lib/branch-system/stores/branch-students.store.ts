/**
 * Branch Students Store (Zustand)
 * 
 * Global state management for branch student enrollments
 * Handles state, loading, errors, and actions
 * 
 * @module branch-system/stores/branch-students
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
    BranchStudent,
    PublicBranchStudent,
    BranchStudentWithRelations,
    EnrollStudentInput,
    UpdateStudentSelfInput,
    UpdateStudentByTeacherInput,
    UpdateStudentByManagerInput,
    BranchStudentFilters,
    BranchStudentSort,
    PaginationOptions,
    BranchStudentSearchResult,
    BranchStudentStats,
    StudentEnrollmentSummary,
} from '../types/branch-students.types';
import { branchStudentsService } from '../services/branch-students.service';

// ============================================================
// STORE STATE INTERFACE
// ============================================================

interface BranchStudentsState {
    // Data state
    enrollments: Record<string, BranchStudent>; // Keyed by enrollment ID
    currentEnrollment: BranchStudent | null;
    currentEnrollmentWithRelations: BranchStudentWithRelations | null;
    branchStudents: PublicBranchStudent[]; // Current list view
    studentEnrollments: BranchStudent[]; // For specific student
    searchResult: BranchStudentSearchResult | null;
    stats: BranchStudentStats | null;
    summary: StudentEnrollmentSummary | null;

    // Loading state
    loading: boolean;
    enrollmentLoading: boolean;
    listLoading: boolean;
    statsLoading: boolean;

    // Error state
    error: string | null;
    validationErrors: Record<string, string> | null;

    // Filters and pagination
    filters: BranchStudentFilters | null;
    sort: BranchStudentSort | null;
    pagination: PaginationOptions;

    // ============================================================
    // ACTIONS - Enrollment Management
    // ============================================================

    /**
     * Enrolls a new student
     */
    enrollStudent: (input: EnrollStudentInput) => Promise<boolean>;

    /**
     * Fetches enrollment by ID
     */
    fetchEnrollment: (enrollmentId: string) => Promise<void>;

    /**
     * Fetches enrollment with relations
     */
    fetchEnrollmentWithRelations: (enrollmentId: string) => Promise<void>;

    /**
     * Fetches student's enrollment in a branch
     */
    fetchStudentEnrollmentInBranch: (studentId: string, branchId: string) => Promise<void>;

    /**
     * Fetches all enrollments for a student
     */
    fetchStudentEnrollments: (studentId: string) => Promise<void>;

    /**
     * Fetches all students in a branch
     */
    fetchBranchStudents: (
        branchId: string,
        filters?: BranchStudentFilters,
        sort?: BranchStudentSort,
        pagination?: PaginationOptions
    ) => Promise<void>;

    /**
     * Fetches all students in a class
     */
    fetchClassStudents: (
        classId: string,
        filters?: Omit<BranchStudentFilters, 'class_id'>,
        sort?: BranchStudentSort
    ) => Promise<void>;

    /**
     * Updates enrollment (by student)
     */
    updateEnrollmentByStudent: (
        enrollmentId: string,
        studentId: string,
        input: UpdateStudentSelfInput
    ) => Promise<boolean>;

    /**
     * Updates enrollment (by teacher)
     */
    updateEnrollmentByTeacher: (
        enrollmentId: string,
        input: UpdateStudentByTeacherInput
    ) => Promise<boolean>;

    /**
     * Updates enrollment (by manager)
     */
    updateEnrollmentByManager: (
        enrollmentId: string,
        input: UpdateStudentByManagerInput
    ) => Promise<boolean>;

    /**
     * Deletes an enrollment (soft delete)
     */
    deleteEnrollment: (enrollmentId: string) => Promise<boolean>;

    // ============================================================
    // ACTIONS - Statistics & Analytics
    // ============================================================

    /**
     * Fetches student enrollment summary
     */
    fetchStudentSummary: (studentId: string) => Promise<void>;

    /**
     * Fetches branch student statistics
     */
    fetchBranchStats: (branchId: string) => Promise<void>;

    /**
     * Fetches students needing attention
     */
    fetchStudentsNeedingAttention: (branchId: string) => Promise<void>;

    /**
     * Fetches students with upcoming payments
     */
    fetchStudentsWithUpcomingPayments: (branchId: string, daysAhead?: number) => Promise<void>;

    // ============================================================
    // ACTIONS - State Management
    // ============================================================

    /**
     * Sets current enrollment
     */
    setCurrentEnrollment: (enrollment: BranchStudent | null) => void;

    /**
     * Sets filters
     */
    setFilters: (filters: BranchStudentFilters | null) => void;

    /**
     * Sets sort
     */
    setSort: (sort: BranchStudentSort | null) => void;

    /**
     * Sets pagination
     */
    setPagination: (pagination: PaginationOptions) => void;

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
// INITIAL STATE
// ============================================================

const initialState = {
    enrollments: {},
    currentEnrollment: null,
    currentEnrollmentWithRelations: null,
    branchStudents: [],
    studentEnrollments: [],
    searchResult: null,
    stats: null,
    summary: null,
    loading: false,
    enrollmentLoading: false,
    listLoading: false,
    statsLoading: false,
    error: null,
    validationErrors: null,
    filters: null,
    sort: null,
    pagination: { page: 1, limit: 20 },
};

// ============================================================
// ZUSTAND STORE
// ============================================================

export const useBranchStudentsStore = create<BranchStudentsState>()(
    devtools(
        persist(
            (set, get) => ({
                ...initialState,

                // ============================================================
                // ENROLLMENT MANAGEMENT ACTIONS
                // ============================================================

                enrollStudent: async (input: EnrollStudentInput) => {
                    set({ loading: true, error: null, validationErrors: null });

                    const result = await branchStudentsService.enrollStudent(input);

                    if (result.success && result.data) {
                        set((state) => ({
                            loading: false,
                            enrollments: {
                                ...state.enrollments,
                                [result.data!.id]: result.data!,
                            },
                            currentEnrollment: result.data!,
                        }));
                        return true;
                    } else {
                        const validationErrors: Record<string, string> = {};
                        result.validation_errors?.forEach((err) => {
                            validationErrors[err.field] = err.message;
                        });

                        set({
                            loading: false,
                            error: result.error || 'Failed to enroll student',
                            validationErrors: Object.keys(validationErrors).length > 0 ? validationErrors : null,
                        });
                        return false;
                    }
                },

                fetchEnrollment: async (enrollmentId: string) => {
                    set({ enrollmentLoading: true, error: null });

                    const result = await branchStudentsService.getEnrollmentById(enrollmentId);

                    if (result.success && result.data) {
                        set((state) => ({
                            enrollmentLoading: false,
                            enrollments: {
                                ...state.enrollments,
                                [result.data!.id]: result.data!,
                            },
                            currentEnrollment: result.data!,
                        }));
                    } else {
                        set({
                            enrollmentLoading: false,
                            error: result.error || 'Failed to fetch enrollment',
                        });
                    }
                },

                fetchEnrollmentWithRelations: async (enrollmentId: string) => {
                    set({ enrollmentLoading: true, error: null });

                    const result = await branchStudentsService.getEnrollmentWithRelations(enrollmentId);

                    if (result.success && result.data) {
                        set({
                            enrollmentLoading: false,
                            currentEnrollmentWithRelations: result.data,
                            currentEnrollment: result.data,
                        });
                    } else {
                        set({
                            enrollmentLoading: false,
                            error: result.error || 'Failed to fetch enrollment',
                        });
                    }
                },

                fetchStudentEnrollmentInBranch: async (studentId: string, branchId: string) => {
                    set({ enrollmentLoading: true, error: null });

                    const result = await branchStudentsService.getStudentEnrollmentInBranch(
                        studentId,
                        branchId
                    );

                    if (result.success && result.data) {
                        set((state) => ({
                            enrollmentLoading: false,
                            enrollments: {
                                ...state.enrollments,
                                [result.data!.id]: result.data!,
                            },
                            currentEnrollment: result.data!,
                        }));
                    } else {
                        set({
                            enrollmentLoading: false,
                            error: result.error || 'Student not enrolled in this branch',
                            currentEnrollment: null,
                        });
                    }
                },

                fetchStudentEnrollments: async (studentId: string) => {
                    set({ listLoading: true, error: null });

                    const result = await branchStudentsService.getStudentEnrollments(studentId);

                    if (result.success && result.data) {
                        const enrollmentsMap: Record<string, BranchStudent> = {};
                        result.data.forEach((enrollment) => {
                            enrollmentsMap[enrollment.id] = enrollment;
                        });

                        set({
                            listLoading: false,
                            studentEnrollments: result.data,
                            enrollments: enrollmentsMap,
                        });
                    } else {
                        set({
                            listLoading: false,
                            error: result.error || 'Failed to fetch enrollments',
                            studentEnrollments: [],
                        });
                    }
                },

                fetchBranchStudents: async (
                    branchId: string,
                    filters?: BranchStudentFilters,
                    sort?: BranchStudentSort,
                    pagination?: PaginationOptions
                ) => {
                    set({ listLoading: true, error: null });

                    const result = await branchStudentsService.getBranchStudents(
                        branchId,
                        filters,
                        sort,
                        pagination
                    );

                    if (result.success && result.data) {
                        set({
                            listLoading: false,
                            searchResult: result.data,
                            branchStudents: result.data.students,
                            filters: filters || null,
                            sort: sort || null,
                            pagination: pagination || { page: 1, limit: 20 },
                        });
                    } else {
                        set({
                            listLoading: false,
                            error: result.error || 'Failed to fetch branch students',
                            branchStudents: [],
                        });
                    }
                },

                fetchClassStudents: async (
                    classId: string,
                    filters?: Omit<BranchStudentFilters, 'class_id'>,
                    sort?: BranchStudentSort
                ) => {
                    set({ listLoading: true, error: null });

                    const result = await branchStudentsService.getClassStudents(classId, filters, sort);

                    if (result.success && result.data) {
                        const enrollmentsMap: Record<string, BranchStudent> = {};
                        result.data.forEach((enrollment) => {
                            enrollmentsMap[enrollment.id] = enrollment;
                        });

                        set({
                            listLoading: false,
                            studentEnrollments: result.data,
                            enrollments: enrollmentsMap,
                        });
                    } else {
                        set({
                            listLoading: false,
                            error: result.error || 'Failed to fetch class students',
                            studentEnrollments: [],
                        });
                    }
                },

                updateEnrollmentByStudent: async (
                    enrollmentId: string,
                    studentId: string,
                    input: UpdateStudentSelfInput
                ) => {
                    set({ loading: true, error: null, validationErrors: null });

                    const result = await branchStudentsService.updateEnrollmentByStudent(
                        enrollmentId,
                        studentId,
                        input
                    );

                    if (result.success && result.data) {
                        set((state) => ({
                            loading: false,
                            enrollments: {
                                ...state.enrollments,
                                [result.data!.id]: result.data!,
                            },
                            currentEnrollment:
                                state.currentEnrollment?.id === enrollmentId ? result.data! : state.currentEnrollment,
                        }));
                        return true;
                    } else {
                        const validationErrors: Record<string, string> = {};
                        result.validation_errors?.forEach((err) => {
                            validationErrors[err.field] = err.message;
                        });

                        set({
                            loading: false,
                            error: result.error || 'Failed to update enrollment',
                            validationErrors: Object.keys(validationErrors).length > 0 ? validationErrors : null,
                        });
                        return false;
                    }
                },

                updateEnrollmentByTeacher: async (
                    enrollmentId: string,
                    input: UpdateStudentByTeacherInput
                ) => {
                    set({ loading: true, error: null, validationErrors: null });

                    const result = await branchStudentsService.updateEnrollmentByTeacher(
                        enrollmentId,
                        input
                    );

                    if (result.success && result.data) {
                        set((state) => ({
                            loading: false,
                            enrollments: {
                                ...state.enrollments,
                                [result.data!.id]: result.data!,
                            },
                            currentEnrollment:
                                state.currentEnrollment?.id === enrollmentId ? result.data! : state.currentEnrollment,
                        }));
                        return true;
                    } else {
                        const validationErrors: Record<string, string> = {};
                        result.validation_errors?.forEach((err) => {
                            validationErrors[err.field] = err.message;
                        });

                        set({
                            loading: false,
                            error: result.error || 'Failed to update enrollment',
                            validationErrors: Object.keys(validationErrors).length > 0 ? validationErrors : null,
                        });
                        return false;
                    }
                },

                updateEnrollmentByManager: async (
                    enrollmentId: string,
                    input: UpdateStudentByManagerInput
                ) => {
                    set({ loading: true, error: null, validationErrors: null });

                    const result = await branchStudentsService.updateEnrollmentByManager(
                        enrollmentId,
                        input
                    );

                    if (result.success && result.data) {
                        set((state) => ({
                            loading: false,
                            enrollments: {
                                ...state.enrollments,
                                [result.data!.id]: result.data!,
                            },
                            currentEnrollment:
                                state.currentEnrollment?.id === enrollmentId ? result.data! : state.currentEnrollment,
                        }));
                        return true;
                    } else {
                        const validationErrors: Record<string, string> = {};
                        result.validation_errors?.forEach((err) => {
                            validationErrors[err.field] = err.message;
                        });

                        set({
                            loading: false,
                            error: result.error || 'Failed to update enrollment',
                            validationErrors: Object.keys(validationErrors).length > 0 ? validationErrors : null,
                        });
                        return false;
                    }
                },

                deleteEnrollment: async (enrollmentId: string) => {
                    set({ loading: true, error: null });

                    const result = await branchStudentsService.deleteEnrollment(enrollmentId);

                    if (result.success) {
                        set((state) => {
                            const newEnrollments = { ...state.enrollments };
                            delete newEnrollments[enrollmentId];

                            return {
                                loading: false,
                                enrollments: newEnrollments,
                                currentEnrollment:
                                    state.currentEnrollment?.id === enrollmentId ? null : state.currentEnrollment,
                            };
                        });
                        return true;
                    } else {
                        set({
                            loading: false,
                            error: result.error || 'Failed to delete enrollment',
                        });
                        return false;
                    }
                },

                // ============================================================
                // STATISTICS & ANALYTICS ACTIONS
                // ============================================================

                fetchStudentSummary: async (studentId: string) => {
                    set({ statsLoading: true, error: null });

                    const result = await branchStudentsService.getStudentEnrollmentSummary(studentId);

                    if (result.success && result.data) {
                        set({
                            statsLoading: false,
                            summary: result.data,
                        });
                    } else {
                        set({
                            statsLoading: false,
                            error: result.error || 'Failed to fetch summary',
                        });
                    }
                },

                fetchBranchStats: async (branchId: string) => {
                    set({ statsLoading: true, error: null });

                    const result = await branchStudentsService.getBranchStudentStats(branchId);

                    if (result.success && result.data) {
                        set({
                            statsLoading: false,
                            stats: result.data,
                        });
                    } else {
                        set({
                            statsLoading: false,
                            error: result.error || 'Failed to fetch statistics',
                        });
                    }
                },

                fetchStudentsNeedingAttention: async (branchId: string) => {
                    set({ listLoading: true, error: null });

                    const result = await branchStudentsService.getStudentsNeedingAttention(branchId);

                    if (result.success && result.data) {
                        set({
                            listLoading: false,
                            branchStudents: result.data,
                        });
                    } else {
                        set({
                            listLoading: false,
                            error: result.error || 'Failed to fetch students',
                        });
                    }
                },

                fetchStudentsWithUpcomingPayments: async (branchId: string, daysAhead: number = 7) => {
                    set({ listLoading: true, error: null });

                    const result = await branchStudentsService.getStudentsWithUpcomingPayments(
                        branchId,
                        daysAhead
                    );

                    if (result.success && result.data) {
                        set({
                            listLoading: false,
                            branchStudents: result.data,
                        });
                    } else {
                        set({
                            listLoading: false,
                            error: result.error || 'Failed to fetch students',
                        });
                    }
                },

                // ============================================================
                // STATE MANAGEMENT ACTIONS
                // ============================================================

                setCurrentEnrollment: (enrollment: BranchStudent | null) => {
                    set({ currentEnrollment: enrollment });
                },

                setFilters: (filters: BranchStudentFilters | null) => {
                    set({ filters });
                },

                setSort: (sort: BranchStudentSort | null) => {
                    set({ sort });
                },

                setPagination: (pagination: PaginationOptions) => {
                    set({ pagination });
                },

                clearError: () => {
                    set({ error: null, validationErrors: null });
                },

                reset: () => {
                    set(initialState);
                },
            }),
            {
                name: 'branch-students-store',
                partialize: (state) => ({
                    // Only persist essential data
                    pagination: state.pagination,
                    filters: state.filters,
                    sort: state.sort,
                }),
            }
        ),
        {
            name: 'BranchStudentsStore',
        }
    )
);

// ============================================================
// SELECTORS (for optimized access)
// ============================================================

/**
 * Gets enrollment by ID from store
 */
export const selectEnrollmentById = (enrollmentId: string) => (state: BranchStudentsState) =>
    state.enrollments[enrollmentId] || null;

/**
 * Gets current enrollment
 */
export const selectCurrentEnrollment = (state: BranchStudentsState) => state.currentEnrollment;

/**
 * Gets branch students list
 */
export const selectBranchStudents = (state: BranchStudentsState) => state.branchStudents;

/**
 * Gets loading state
 */
export const selectLoading = (state: BranchStudentsState) => state.loading;

/**
 * Gets list loading state
 */
export const selectListLoading = (state: BranchStudentsState) => state.listLoading;

/**
 * Gets error
 */
export const selectError = (state: BranchStudentsState) => state.error;

/**
 * Gets validation errors
 */
export const selectValidationErrors = (state: BranchStudentsState) => state.validationErrors;

/**
 * Gets statistics
 */
export const selectStats = (state: BranchStudentsState) => state.stats;

/**
 * Gets summary
 */
export const selectSummary = (state: BranchStudentsState) => state.summary;
