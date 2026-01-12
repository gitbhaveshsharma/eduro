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
    BranchStudentValidationError,
    TeacherStudent,
} from '../types/branch-students.types';
import { branchStudentsService } from '../services/branch-students.service';
import { deprecate } from 'util';

// ============================================================
// STORE STATE INTERFACE
// ============================================================

interface BranchStudentsState {
    // Data state
    enrollments: Record<string, BranchStudent>; // Keyed by enrollment ID
    enrollmentsWithRelations: Record<string, BranchStudentWithRelations>; // Keyed by enrollment ID
    currentEnrollment: BranchStudent | null;
    currentEnrollmentWithRelations: BranchStudentWithRelations | null;
    branchStudents: PublicBranchStudent[]; // Current list view
    studentEnrollments: BranchStudent[]; // For specific student
    studentEnrollmentsWithRelations: BranchStudentWithRelations[]; // For specific student with relations
    searchResult: BranchStudentSearchResult | null;
    stats: BranchStudentStats | null;
    summary: StudentEnrollmentSummary | null;

    // Teacher students cache (privacy-focused limited data)
    teacherStudentsCache: Record<string, {
        students: TeacherStudent[];
        timestamp: number;
    }>;
    currentTeacherStudents: TeacherStudent[]; // Current list for teacher view

    // Dialog open states
    isDetailsDialogOpen: boolean;
    isEditDialogOpen: boolean;
    isDeleteDialogOpen: boolean;

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
     * Fetches enrollment with relations (using view)
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
     * Fetches all enrollments for a student with relations
     */
    fetchStudentEnrollmentsWithRelations: (studentId: string) => Promise<void>;

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
     * Fetches all students across all branches of a coaching center
     */
    fetchCoachingCenterStudents: (
        coachingCenterId: string,
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
     * Fetches students for a teacher (limited data for privacy)
     * Cached by teacher ID to prevent redundant API calls
     */
    fetchTeacherStudents: (
        teacherId: string,
        forceRefresh?: boolean
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
     * Sets current enrollment with relations
     */
    setCurrentEnrollmentWithRelations: (enrollment: BranchStudentWithRelations | null) => void;

    /**
     * Opens the details dialog for the current enrollment
     */
    openDetailsDialog: (enrollment?: BranchStudent | BranchStudentWithRelations) => void;

    /**
     * Closes the details dialog
     */
    closeDetailsDialog: () => void;

    /**
     * Opens the edit dialog for the current enrollment
     */
    openEditDialog: (enrollment?: BranchStudent | BranchStudentWithRelations) => void;

    /**
     * Closes the edit dialog
     */
    closeEditDialog: () => void;

    /**
     * Opens the delete dialog for the current enrollment
     */
    openDeleteDialog: (enrollment?: BranchStudent | BranchStudentWithRelations) => void;

    /**
     * Closes the delete dialog
     */
    closeDeleteDialog: () => void;

    /**
     * Closes all dialogs
     */
    closeAllDialogs: () => void;

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

const initialState: Omit<BranchStudentsState,
    | 'enrollStudent'
    | 'fetchEnrollment'
    | 'fetchEnrollmentWithRelations'
    | 'fetchStudentEnrollmentInBranch'
    | 'fetchStudentEnrollments'
    | 'fetchStudentEnrollmentsWithRelations'
    | 'fetchBranchStudents'
    | 'fetchCoachingCenterStudents'
    | 'fetchClassStudents'
    | 'updateEnrollmentByStudent'
    | 'updateEnrollmentByTeacher'
    | 'updateEnrollmentByManager'
    | 'deleteEnrollment'
    | 'fetchStudentSummary'
    | 'fetchBranchStats'
    | 'fetchStudentsNeedingAttention'
    | 'fetchStudentsWithUpcomingPayments'
    | 'fetchTeacherStudents'
    | 'setCurrentEnrollment'
    | 'setCurrentEnrollmentWithRelations'
    | 'openDetailsDialog'
    | 'closeDetailsDialog'
    | 'openEditDialog'
    | 'closeEditDialog'
    | 'openDeleteDialog'
    | 'closeDeleteDialog'
    | 'closeAllDialogs'
    | 'setFilters'
    | 'setSort'
    | 'setPagination'
    | 'clearError'
    | 'reset'
> = {
    enrollments: {},
    enrollmentsWithRelations: {},
    currentEnrollment: null,
    currentEnrollmentWithRelations: null,
    branchStudents: [],
    studentEnrollments: [],
    studentEnrollmentsWithRelations: [],
    searchResult: null,
    stats: null,
    summary: null,
    teacherStudentsCache: {},
    currentTeacherStudents: [],
    isDetailsDialogOpen: false,
    isEditDialogOpen: false,
    isDeleteDialogOpen: false,
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
                        result.validation_errors?.forEach((err: BranchStudentValidationError) => {
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
                            currentEnrollmentWithRelations: result.data as BranchStudentWithRelations,
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

                    const result = await branchStudentsService.getEnrollmentById(enrollmentId);

                    if (result.success && result.data) {
                        set((state) => ({
                            enrollmentLoading: false,
                            enrollmentsWithRelations: {
                                ...state.enrollmentsWithRelations,
                                [result.data!.id]: result.data!,
                            },
                            currentEnrollment: result.data!,
                            currentEnrollmentWithRelations: result.data,
                        }));
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
                            enrollmentsWithRelations: {
                                ...state.enrollmentsWithRelations,
                                [result.data!.id]: result.data!,
                            },
                            currentEnrollment: result.data!,
                            currentEnrollmentWithRelations: result.data,
                        }));
                    } else {
                        set({
                            enrollmentLoading: false,
                            error: result.error || 'Student not enrolled in this branch',
                            currentEnrollment: null,
                            currentEnrollmentWithRelations: null,
                        });
                    }
                },

                fetchStudentEnrollments: async (studentId: string) => {
                    set({ listLoading: true, error: null });

                    const result = await branchStudentsService.getStudentEnrollments(studentId);

                    if (result.success && result.data) {
                        const enrollmentsMap: Record<string, BranchStudent> = {};
                        result.data.forEach((enrollment: BranchStudentWithRelations) => {
                            enrollmentsMap[enrollment.id] = enrollment;
                        });

                        set({
                            listLoading: false,
                            studentEnrollments: result.data,
                            studentEnrollmentsWithRelations: result.data as BranchStudentWithRelations[],
                            enrollments: enrollmentsMap,
                        });
                    } else {
                        set({
                            listLoading: false,
                            error: result.error || 'Failed to fetch enrollments',
                            studentEnrollments: [],
                            studentEnrollmentsWithRelations: [],
                        });
                    }
                },

                fetchStudentEnrollmentsWithRelations: async (studentId: string) => {
                    set({ listLoading: true, error: null });

                    const result = await branchStudentsService.getStudentEnrollments(studentId);

                    if (result.success && result.data) {
                        const enrollmentsMap: Record<string, BranchStudentWithRelations> = {};
                        result.data.forEach((enrollment: BranchStudentWithRelations) => {
                            enrollmentsMap[enrollment.id] = enrollment as BranchStudentWithRelations;
                        });

                        set({
                            listLoading: false,
                            studentEnrollments: result.data,
                            studentEnrollmentsWithRelations: result.data as BranchStudentWithRelations[],
                            enrollmentsWithRelations: enrollmentsMap,
                        });
                    } else {
                        set({
                            listLoading: false,
                            error: result.error || 'Failed to fetch enrollments',
                            studentEnrollments: [],
                            studentEnrollmentsWithRelations: [],
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

                fetchCoachingCenterStudents: async (
                    coachingCenterId: string,
                    filters?: BranchStudentFilters,
                    sort?: BranchStudentSort,
                    pagination?: PaginationOptions
                ) => {
                    set({ listLoading: true, error: null });

                    const result = await branchStudentsService.getCoachingCenterStudents(
                        coachingCenterId,
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
                            error: result.error || 'Failed to fetch coaching center students',
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
                        const enrollmentsMap: Record<string, BranchStudentWithRelations> = {};
                        result.data.forEach((enrollment: BranchStudentWithRelations) => {
                            enrollmentsMap[enrollment.id] = enrollment;
                        });

                        set({
                            listLoading: false,
                            studentEnrollments: result.data,
                            studentEnrollmentsWithRelations: result.data,
                            enrollmentsWithRelations: enrollmentsMap,
                        });
                    } else {
                        set({
                            listLoading: false,
                            error: result.error || 'Failed to fetch class students',
                            studentEnrollments: [],
                            studentEnrollmentsWithRelations: [],
                        });
                    }
                },

                fetchTeacherStudents: async (
                    teacherId: string,
                    forceRefresh: boolean = false
                ) => {
                    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

                    // Check cache first
                    const cached = get().teacherStudentsCache[teacherId];
                    const now = Date.now();

                    if (cached && !forceRefresh && (now - cached.timestamp < CACHE_TTL)) {
                        console.log('✅ [Store] Using cached teacher students data');
                        set({ currentTeacherStudents: cached.students });
                        return;
                    }

                    set({ listLoading: true, error: null });

                    const result = await branchStudentsService.getTeacherStudents(teacherId);

                    if (result.success && result.data) {
                        // Update cache
                        set((state) => ({
                            listLoading: false,
                            currentTeacherStudents: result.data!,
                            teacherStudentsCache: {
                                ...state.teacherStudentsCache,
                                [teacherId]: {
                                    students: result.data!,
                                    timestamp: now,
                                },
                            },
                        }));
                    } else {
                        set({
                            listLoading: false,
                            error: result.error || 'Failed to fetch teacher students',
                            currentTeacherStudents: [],
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
                            currentEnrollmentWithRelations:
                                state.currentEnrollmentWithRelations?.id === enrollmentId
                                    ? { ...state.currentEnrollmentWithRelations, ...result.data! } as BranchStudentWithRelations
                                    : state.currentEnrollmentWithRelations,
                        }));
                        return true;
                    } else {
                        const validationErrors: Record<string, string> = {};
                        result.validation_errors?.forEach((err: BranchStudentValidationError) => {
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

                // @deprecated Use updateEnrollmentByManager instead

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
                            currentEnrollmentWithRelations:
                                state.currentEnrollmentWithRelations?.id === enrollmentId
                                    ? { ...state.currentEnrollmentWithRelations, ...result.data! } as BranchStudentWithRelations
                                    : state.currentEnrollmentWithRelations,
                        }));
                        return true;
                    } else {
                        const validationErrors: Record<string, string> = {};
                        result.validation_errors?.forEach((err: BranchStudentValidationError) => {
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

                // @deprecated Use updateEnrollmentByTeacher instead
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
                            currentEnrollmentWithRelations:
                                state.currentEnrollmentWithRelations?.id === enrollmentId
                                    ? { ...state.currentEnrollmentWithRelations, ...result.data! } as BranchStudentWithRelations
                                    : state.currentEnrollmentWithRelations,
                        }));
                        return true;
                    } else {
                        const validationErrors: Record<string, string> = {};
                        result.validation_errors?.forEach((err: BranchStudentValidationError) => {
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
                            const newEnrollmentsWithRelations = { ...state.enrollmentsWithRelations };
                            delete newEnrollments[enrollmentId];
                            delete newEnrollmentsWithRelations[enrollmentId];

                            return {
                                loading: false,
                                enrollments: newEnrollments,
                                enrollmentsWithRelations: newEnrollmentsWithRelations,
                                currentEnrollment:
                                    state.currentEnrollment?.id === enrollmentId ? null : state.currentEnrollment,
                                currentEnrollmentWithRelations:
                                    state.currentEnrollmentWithRelations?.id === enrollmentId ? null : state.currentEnrollmentWithRelations,
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

                setCurrentEnrollmentWithRelations: (enrollment: BranchStudentWithRelations | null) => {
                    set({
                        currentEnrollment: enrollment,
                        currentEnrollmentWithRelations: enrollment
                    });
                },

                openDetailsDialog: (enrollment?: BranchStudent | BranchStudentWithRelations) => {
                    if (enrollment) {
                        set({
                            currentEnrollment: enrollment,
                            currentEnrollmentWithRelations: enrollment as BranchStudentWithRelations,
                            isDetailsDialogOpen: true
                        });
                    } else {
                        set({ isDetailsDialogOpen: true });
                    }
                },

                closeDetailsDialog: () => {
                    set({ isDetailsDialogOpen: false });
                },

                openEditDialog: (enrollment?: BranchStudent | BranchStudentWithRelations) => {
                    if (enrollment) {
                        set({
                            currentEnrollment: enrollment,
                            currentEnrollmentWithRelations: enrollment as BranchStudentWithRelations,
                            isEditDialogOpen: true
                        });
                    } else {
                        set({ isEditDialogOpen: true });
                    }
                },

                closeEditDialog: () => {
                    set({
                        isEditDialogOpen: false,
                        currentEnrollment: null,
                        currentEnrollmentWithRelations: null
                    });
                },

                openDeleteDialog: (enrollment?: BranchStudent | BranchStudentWithRelations) => {
                    if (enrollment) {
                        set({
                            currentEnrollment: enrollment,
                            currentEnrollmentWithRelations: enrollment as BranchStudentWithRelations,
                            isDeleteDialogOpen: true
                        });
                    } else {
                        set({ isDeleteDialogOpen: true });
                    }
                },

                closeDeleteDialog: () => {
                    set({
                        isDeleteDialogOpen: false,
                        currentEnrollment: null,
                        currentEnrollmentWithRelations: null
                    });
                },

                closeAllDialogs: () => {
                    set({
                        isDetailsDialogOpen: false,
                        isEditDialogOpen: false,
                        isDeleteDialogOpen: false,
                        currentEnrollment: null,
                        currentEnrollmentWithRelations: null
                    });
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
                    enrollments: state.enrollments, // Optional: cache enrollments
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
 * Gets enrollment with relations by ID from store
 */
export const selectEnrollmentWithRelationsById = (enrollmentId: string) => (state: BranchStudentsState) =>
    state.enrollmentsWithRelations[enrollmentId] || null;

/**
 * Gets current enrollment
 */
export const selectCurrentEnrollment = (state: BranchStudentsState) => state.currentEnrollment;

/**
 * Gets current enrollment with relations
 */
export const selectCurrentEnrollmentWithRelations = (state: BranchStudentsState) => state.currentEnrollmentWithRelations;

/**
 * Gets branch students list
 */
export const selectBranchStudents = (state: BranchStudentsState) => state.branchStudents;

/**
 * Gets student enrollments
 */
export const selectStudentEnrollments = (state: BranchStudentsState) => state.studentEnrollments;

/**
 * Gets student enrollments with relations
 */
export const selectStudentEnrollmentsWithRelations = (state: BranchStudentsState) => state.studentEnrollmentsWithRelations;

/**
 * Gets teacher students (limited data for privacy)
 */
export const selectTeacherStudents = (state: BranchStudentsState) => state.currentTeacherStudents;

/**
 * Gets search result
 */
export const selectSearchResult = (state: BranchStudentsState) => state.searchResult;

/**
 * Gets loading state
 */
export const selectLoading = (state: BranchStudentsState) => state.loading;

/**
 * Gets enrollment loading state
 */
export const selectEnrollmentLoading = (state: BranchStudentsState) => state.enrollmentLoading;

/**
 * Gets list loading state
 */
export const selectListLoading = (state: BranchStudentsState) => state.listLoading;

/**
 * Gets stats loading state
 */
export const selectStatsLoading = (state: BranchStudentsState) => state.statsLoading;

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

/**
 * Gets dialog states
 */
export const selectDialogs = (state: BranchStudentsState) => ({
    isDetailsDialogOpen: state.isDetailsDialogOpen,
    isEditDialogOpen: state.isEditDialogOpen,
    isDeleteDialogOpen: state.isDeleteDialogOpen,
});

/**
 * Gets filters
 */
export const selectFilters = (state: BranchStudentsState) => state.filters;

/**
 * Gets sort
 */
export const selectSort = (state: BranchStudentsState) => state.sort;

/**
 * Gets pagination
 */
export const selectPagination = (state: BranchStudentsState) => state.pagination;