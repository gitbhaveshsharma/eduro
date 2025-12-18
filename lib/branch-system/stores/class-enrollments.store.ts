/**
 * Class Enrollments Store (Zustand)
 * 
 * Global state management for class enrollments
 * Handles state, loading, errors, and actions
 * 
 * @module branch-system/stores/class-enrollments
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
    ClassEnrollment,
    PublicClassEnrollment,
    ClassEnrollmentWithRelations,
    CreateClassEnrollmentInput,
    UpdateClassEnrollmentByTeacherInput,
    UpdateClassEnrollmentByManagerInput,
    ClassEnrollmentFilters,
    ClassEnrollmentSort,
    ClassEnrollmentSearchResult,
    ClassEnrollmentStats,
    StudentClassEnrollmentSummary,
    BranchClassEnrollmentOverview,
    ClassEnrollmentStatus,
} from '../types/class-enrollments.types';
import type { PaginationOptions } from '../types/branch-students.types';
import { classEnrollmentsService } from '../services/class-enrollments.service';

// ============================================================
// STORE STATE INTERFACE
// ============================================================

interface ClassEnrollmentsState {
    // Data state
    enrollments: Record<string, ClassEnrollment>; // Keyed by enrollment ID
    enrollmentsWithRelations: Record<string, ClassEnrollmentWithRelations>;
    currentEnrollment: ClassEnrollment | null;
    currentEnrollmentWithRelations: ClassEnrollmentWithRelations | null;
    
    // Lists
    classEnrollments: PublicClassEnrollment[]; // Current list view
    studentClassEnrollments: ClassEnrollmentWithRelations[]; // For specific student
    searchResult: ClassEnrollmentSearchResult | null;
    
    // Statistics
    classStats: ClassEnrollmentStats | null;
    studentSummary: StudentClassEnrollmentSummary | null;
    branchOverview: BranchClassEnrollmentOverview | null;

    // Dialog states
    isEnrollDialogOpen: boolean;
    isDetailsDialogOpen: boolean;
    isEditDialogOpen: boolean;
    isDropDialogOpen: boolean;

    // Loading state
    loading: boolean;
    enrollmentLoading: boolean;
    listLoading: boolean;
    statsLoading: boolean;

    // Error state
    error: string | null;
    validationErrors: Record<string, string> | null;

    // Filters and pagination
    filters: ClassEnrollmentFilters | null;
    sort: ClassEnrollmentSort | null;
    pagination: PaginationOptions;

    // ============================================================
    // ACTIONS - Class Enrollment Management
    // ============================================================

    /**
     * Creates a new class enrollment
     */
    createClassEnrollment: (input: CreateClassEnrollmentInput) => Promise<boolean>;

    /**
     * Enrolls student in multiple classes
     */
    enrollInMultipleClasses: (
        studentId: string,
        branchId: string,
        classIds: string[],
        branchStudentId?: string
    ) => Promise<boolean>;

    /**
     * Fetches class enrollment by ID
     */
    fetchClassEnrollment: (enrollmentId: string) => Promise<void>;

    /**
     * Fetches all class enrollments for a student
     */
    fetchStudentClassEnrollments: (studentId: string, branchId?: string) => Promise<void>;

    /**
     * Fetches all enrollments for a class
     */
    fetchClassEnrollments: (
        classId: string,
        filters?: Omit<ClassEnrollmentFilters, 'class_id'>,
        sort?: ClassEnrollmentSort,
        pagination?: PaginationOptions
    ) => Promise<void>;

    /**
     * Fetches all class enrollments for a branch
     */
    fetchBranchClassEnrollments: (
        branchId: string,
        filters?: Omit<ClassEnrollmentFilters, 'branch_id'>,
        sort?: ClassEnrollmentSort,
        pagination?: PaginationOptions
    ) => Promise<void>;

    /**
     * Checks if student is enrolled in a class
     */
    checkStudentEnrollment: (studentId: string, classId: string) => Promise<boolean>;

    /**
     * Updates class enrollment (by teacher)
     */
    updateEnrollmentByTeacher: (
        enrollmentId: string,
        input: UpdateClassEnrollmentByTeacherInput
    ) => Promise<boolean>;

    /**
     * Updates class enrollment (by manager)
     */
    updateEnrollmentByManager: (
        enrollmentId: string,
        input: UpdateClassEnrollmentByManagerInput
    ) => Promise<boolean>;

    /**
     * Updates enrollment status
     */
    updateEnrollmentStatus: (
        enrollmentId: string,
        status: ClassEnrollmentStatus,
        actualCompletionDate?: string
    ) => Promise<boolean>;

    /**
     * Drops (soft delete) a class enrollment
     */
    dropEnrollment: (enrollmentId: string) => Promise<boolean>;

    /**
     * Hard deletes a class enrollment
     */
    deleteEnrollment: (enrollmentId: string) => Promise<boolean>;

    // ============================================================
    // ACTIONS - Statistics & Analytics
    // ============================================================

    /**
     * Fetches class enrollment statistics
     */
    fetchClassStats: (classId: string) => Promise<void>;

    /**
     * Fetches student enrollment summary
     */
    fetchStudentSummary: (studentId: string) => Promise<void>;

    /**
     * Fetches branch enrollment overview
     */
    fetchBranchOverview: (branchId: string) => Promise<void>;

    // ============================================================
    // ACTIONS - Dialog Management
    // ============================================================

    openEnrollDialog: () => void;
    closeEnrollDialog: () => void;
    openDetailsDialog: (enrollment?: ClassEnrollment | ClassEnrollmentWithRelations) => void;
    closeDetailsDialog: () => void;
    openEditDialog: (enrollment?: ClassEnrollment | ClassEnrollmentWithRelations) => void;
    closeEditDialog: () => void;
    openDropDialog: (enrollment?: ClassEnrollment | ClassEnrollmentWithRelations) => void;
    closeDropDialog: () => void;
    closeAllDialogs: () => void;

    // ============================================================
    // ACTIONS - State Management
    // ============================================================

    setCurrentEnrollment: (enrollment: ClassEnrollment | null) => void;
    setCurrentEnrollmentWithRelations: (enrollment: ClassEnrollmentWithRelations | null) => void;
    setFilters: (filters: ClassEnrollmentFilters | null) => void;
    setSort: (sort: ClassEnrollmentSort | null) => void;
    setPagination: (pagination: PaginationOptions) => void;
    clearError: () => void;
    reset: () => void;
}

// ============================================================
// INITIAL STATE
// ============================================================

const initialState = {
    enrollments: {},
    enrollmentsWithRelations: {},
    currentEnrollment: null,
    currentEnrollmentWithRelations: null,
    classEnrollments: [],
    studentClassEnrollments: [],
    searchResult: null,
    classStats: null,
    studentSummary: null,
    branchOverview: null,
    isEnrollDialogOpen: false,
    isDetailsDialogOpen: false,
    isEditDialogOpen: false,
    isDropDialogOpen: false,
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

export const useClassEnrollmentsStore = create<ClassEnrollmentsState>()(
    devtools(
        persist(
            (set, get) => ({
                ...initialState,

                // ============================================================
                // ENROLLMENT MANAGEMENT ACTIONS
                // ============================================================

                createClassEnrollment: async (input: CreateClassEnrollmentInput) => {
                    set({ loading: true, error: null, validationErrors: null });

                    const result = await classEnrollmentsService.createClassEnrollment(input);

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
                            error: result.error || 'Failed to create class enrollment',
                            validationErrors: Object.keys(validationErrors).length > 0 ? validationErrors : null,
                        });
                        return false;
                    }
                },

                enrollInMultipleClasses: async (
                    studentId: string,
                    branchId: string,
                    classIds: string[],
                    branchStudentId?: string
                ) => {
                    set({ loading: true, error: null });

                    const result = await classEnrollmentsService.enrollStudentInMultipleClasses(
                        studentId,
                        branchId,
                        classIds,
                        branchStudentId
                    );

                    if (result.success && result.data) {
                        set((state) => {
                            const newEnrollments = { ...state.enrollments };
                            result.data!.forEach((enrollment) => {
                                newEnrollments[enrollment.id] = enrollment;
                            });
                            return {
                                loading: false,
                                enrollments: newEnrollments,
                            };
                        });
                        return true;
                    } else {
                        set({
                            loading: false,
                            error: result.error || 'Failed to enroll in classes',
                        });
                        return false;
                    }
                },

                fetchClassEnrollment: async (enrollmentId: string) => {
                    set({ enrollmentLoading: true, error: null });

                    const result = await classEnrollmentsService.getClassEnrollmentById(enrollmentId);

                    if (result.success && result.data) {
                        set((state) => ({
                            enrollmentLoading: false,
                            enrollmentsWithRelations: {
                                ...state.enrollmentsWithRelations,
                                [result.data!.id]: result.data!,
                            },
                            currentEnrollment: result.data!,
                            currentEnrollmentWithRelations: result.data!,
                        }));
                    } else {
                        set({
                            enrollmentLoading: false,
                            error: result.error || 'Failed to fetch enrollment',
                        });
                    }
                },

                fetchStudentClassEnrollments: async (studentId: string, branchId?: string) => {
                    set({ listLoading: true, error: null });

                    const result = await classEnrollmentsService.getStudentClassEnrollments(studentId, branchId);

                    if (result.success && result.data) {
                        const enrollmentsMap: Record<string, ClassEnrollmentWithRelations> = {};
                        result.data.forEach((enrollment) => {
                            enrollmentsMap[enrollment.id] = enrollment;
                        });

                        set({
                            listLoading: false,
                            studentClassEnrollments: result.data,
                            enrollmentsWithRelations: enrollmentsMap,
                        });
                    } else {
                        set({
                            listLoading: false,
                            error: result.error || 'Failed to fetch student enrollments',
                            studentClassEnrollments: [],
                        });
                    }
                },

                fetchClassEnrollments: async (
                    classId: string,
                    filters?: Omit<ClassEnrollmentFilters, 'class_id'>,
                    sort?: ClassEnrollmentSort,
                    pagination?: PaginationOptions
                ) => {
                    set({ listLoading: true, error: null });

                    const result = await classEnrollmentsService.getClassEnrollments(
                        classId,
                        filters,
                        sort,
                        pagination
                    );

                    if (result.success && result.data) {
                        set({
                            listLoading: false,
                            searchResult: result.data,
                            classEnrollments: result.data.enrollments,
                            filters: filters ? { ...filters, class_id: classId } : { class_id: classId },
                            sort: sort || null,
                            pagination: pagination || { page: 1, limit: 20 },
                        });
                    } else {
                        set({
                            listLoading: false,
                            error: result.error || 'Failed to fetch class enrollments',
                            classEnrollments: [],
                        });
                    }
                },

                fetchBranchClassEnrollments: async (
                    branchId: string,
                    filters?: Omit<ClassEnrollmentFilters, 'branch_id'>,
                    sort?: ClassEnrollmentSort,
                    pagination?: PaginationOptions
                ) => {
                    set({ listLoading: true, error: null });

                    const result = await classEnrollmentsService.getBranchClassEnrollments(
                        branchId,
                        filters,
                        sort,
                        pagination
                    );

                    if (result.success && result.data) {
                        set({
                            listLoading: false,
                            searchResult: result.data,
                            classEnrollments: result.data.enrollments,
                            filters: filters ? { ...filters, branch_id: branchId } : { branch_id: branchId },
                            sort: sort || null,
                            pagination: pagination || { page: 1, limit: 20 },
                        });
                    } else {
                        set({
                            listLoading: false,
                            error: result.error || 'Failed to fetch branch enrollments',
                            classEnrollments: [],
                        });
                    }
                },

                checkStudentEnrollment: async (studentId: string, classId: string) => {
                    const result = await classEnrollmentsService.checkStudentClassEnrollment(studentId, classId);
                    return result.success && result.data !== null;
                },

                updateEnrollmentByTeacher: async (
                    enrollmentId: string,
                    input: UpdateClassEnrollmentByTeacherInput
                ) => {
                    set({ loading: true, error: null, validationErrors: null });

                    const result = await classEnrollmentsService.updateClassEnrollmentByTeacher(
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
                    input: UpdateClassEnrollmentByManagerInput
                ) => {
                    set({ loading: true, error: null, validationErrors: null });

                    const result = await classEnrollmentsService.updateClassEnrollmentByManager(
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

                updateEnrollmentStatus: async (
                    enrollmentId: string,
                    status: ClassEnrollmentStatus,
                    actualCompletionDate?: string
                ) => {
                    set({ loading: true, error: null });

                    const result = await classEnrollmentsService.updateEnrollmentStatus(
                        enrollmentId,
                        status,
                        actualCompletionDate
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
                        set({
                            loading: false,
                            error: result.error || 'Failed to update status',
                        });
                        return false;
                    }
                },

                dropEnrollment: async (enrollmentId: string) => {
                    set({ loading: true, error: null });

                    const result = await classEnrollmentsService.dropClassEnrollment(enrollmentId);

                    if (result.success) {
                        set((state) => {
                            const enrollment = state.enrollments[enrollmentId];
                            if (enrollment) {
                                enrollment.enrollment_status = 'DROPPED';
                            }
                            return {
                                loading: false,
                                enrollments: { ...state.enrollments },
                                currentEnrollment: null,
                                currentEnrollmentWithRelations: null,
                            };
                        });
                        return true;
                    } else {
                        set({
                            loading: false,
                            error: result.error || 'Failed to drop enrollment',
                        });
                        return false;
                    }
                },

                deleteEnrollment: async (enrollmentId: string) => {
                    set({ loading: true, error: null });

                    const result = await classEnrollmentsService.deleteClassEnrollment(enrollmentId);

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
                                currentEnrollment: null,
                                currentEnrollmentWithRelations: null,
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

                fetchClassStats: async (classId: string) => {
                    set({ statsLoading: true, error: null });

                    const result = await classEnrollmentsService.getClassEnrollmentStats(classId);

                    if (result.success && result.data) {
                        set({
                            statsLoading: false,
                            classStats: result.data,
                        });
                    } else {
                        set({
                            statsLoading: false,
                            error: result.error || 'Failed to fetch class statistics',
                        });
                    }
                },

                fetchStudentSummary: async (studentId: string) => {
                    set({ statsLoading: true, error: null });

                    const result = await classEnrollmentsService.getStudentEnrollmentSummary(studentId);

                    if (result.success && result.data) {
                        set({
                            statsLoading: false,
                            studentSummary: result.data,
                        });
                    } else {
                        set({
                            statsLoading: false,
                            error: result.error || 'Failed to fetch student summary',
                        });
                    }
                },

                fetchBranchOverview: async (branchId: string) => {
                    set({ statsLoading: true, error: null });

                    const result = await classEnrollmentsService.getBranchEnrollmentOverview(branchId);

                    if (result.success && result.data) {
                        set({
                            statsLoading: false,
                            branchOverview: result.data,
                        });
                    } else {
                        set({
                            statsLoading: false,
                            error: result.error || 'Failed to fetch branch overview',
                        });
                    }
                },

                // ============================================================
                // DIALOG MANAGEMENT ACTIONS
                // ============================================================

                openEnrollDialog: () => {
                    set({ isEnrollDialogOpen: true });
                },

                closeEnrollDialog: () => {
                    set({ isEnrollDialogOpen: false });
                },

                openDetailsDialog: (enrollment?: ClassEnrollment | ClassEnrollmentWithRelations) => {
                    if (enrollment) {
                        set({
                            currentEnrollment: enrollment,
                            currentEnrollmentWithRelations: enrollment as ClassEnrollmentWithRelations,
                            isDetailsDialogOpen: true,
                        });
                    } else {
                        set({ isDetailsDialogOpen: true });
                    }
                },

                closeDetailsDialog: () => {
                    set({ isDetailsDialogOpen: false });
                },

                openEditDialog: (enrollment?: ClassEnrollment | ClassEnrollmentWithRelations) => {
                    if (enrollment) {
                        set({
                            currentEnrollment: enrollment,
                            currentEnrollmentWithRelations: enrollment as ClassEnrollmentWithRelations,
                            isEditDialogOpen: true,
                        });
                    } else {
                        set({ isEditDialogOpen: true });
                    }
                },

                closeEditDialog: () => {
                    set({
                        isEditDialogOpen: false,
                        currentEnrollment: null,
                        currentEnrollmentWithRelations: null,
                    });
                },

                openDropDialog: (enrollment?: ClassEnrollment | ClassEnrollmentWithRelations) => {
                    if (enrollment) {
                        set({
                            currentEnrollment: enrollment,
                            currentEnrollmentWithRelations: enrollment as ClassEnrollmentWithRelations,
                            isDropDialogOpen: true,
                        });
                    } else {
                        set({ isDropDialogOpen: true });
                    }
                },

                closeDropDialog: () => {
                    set({
                        isDropDialogOpen: false,
                        currentEnrollment: null,
                        currentEnrollmentWithRelations: null,
                    });
                },

                closeAllDialogs: () => {
                    set({
                        isEnrollDialogOpen: false,
                        isDetailsDialogOpen: false,
                        isEditDialogOpen: false,
                        isDropDialogOpen: false,
                        currentEnrollment: null,
                        currentEnrollmentWithRelations: null,
                    });
                },

                // ============================================================
                // STATE MANAGEMENT ACTIONS
                // ============================================================

                setCurrentEnrollment: (enrollment: ClassEnrollment | null) => {
                    set({ currentEnrollment: enrollment });
                },

                setCurrentEnrollmentWithRelations: (enrollment: ClassEnrollmentWithRelations | null) => {
                    set({
                        currentEnrollment: enrollment,
                        currentEnrollmentWithRelations: enrollment,
                    });
                },

                setFilters: (filters: ClassEnrollmentFilters | null) => {
                    set({ filters });
                },

                setSort: (sort: ClassEnrollmentSort | null) => {
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
                name: 'class-enrollments-store',
                partialize: (state) => ({
                    filters: state.filters,
                    sort: state.sort,
                    pagination: state.pagination,
                }),
            }
        ),
        { name: 'ClassEnrollmentsStore' }
    )
);

// Export default store instance
export default useClassEnrollmentsStore;
