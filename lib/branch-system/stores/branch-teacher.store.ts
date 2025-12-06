/**
 * Branch Teacher Store (Zustand)
 * 
 * Global state management for branch teacher assignments
 * Handles state, loading, errors, and actions
 * 
 * @module branch-system/stores/branch-teacher
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
    BranchTeacher,
    PublicBranchTeacher,
    BranchTeacherWithRelations,
    AssignTeacherInput,
    UpdateTeacherSelfInput,
    UpdateTeacherByManagerInput,
    BranchTeacherFilters,
    BranchTeacherSort,
    PaginationOptions,
    BranchTeacherSearchResult,
    BranchTeacherStats,
    TeacherAssignmentSummary,
} from '../types/branch-teacher.types';
import { branchTeacherService } from '../services/branch-teacher.service';

// ============================================================
// STORE STATE INTERFACE
// ============================================================

interface BranchTeacherState {
    // Data state
    assignments: Record<string, BranchTeacher>; // Keyed by assignment ID
    assignmentsWithRelations: Record<string, BranchTeacherWithRelations>; // Keyed by assignment ID
    currentAssignment: BranchTeacher | null;
    currentAssignmentWithRelations: BranchTeacherWithRelations | null;
    branchTeachers: PublicBranchTeacher[]; // Current list view
    teacherAssignments: BranchTeacher[]; // For specific teacher
    searchResult: BranchTeacherSearchResult | null;
    stats: BranchTeacherStats | null;
    summary: TeacherAssignmentSummary | null;
    branchSubjects: string[]; // Unique subjects in branch

    // Dialog open states
    isDetailsDialogOpen: boolean;
    isEditDialogOpen: boolean;
    isDeleteDialogOpen: boolean;
    isAssignDialogOpen: boolean;

    // Loading state
    loading: boolean;
    assignmentLoading: boolean;
    listLoading: boolean;
    statsLoading: boolean;

    // Error state
    error: string | null;
    validationErrors: Record<string, string> | null;

    // Filters and pagination
    filters: BranchTeacherFilters | null;
    sort: BranchTeacherSort | null;
    pagination: PaginationOptions;

    // ============================================================
    // ACTIONS - Assignment Management
    // ============================================================

    /**
     * Assigns a new teacher to a branch
     */
    assignTeacher: (input: AssignTeacherInput) => Promise<boolean>;

    /**
     * Fetches assignment by ID
     */
    fetchAssignment: (assignmentId: string) => Promise<void>;

    /**
     * Fetches assignment with relations
     */
    fetchAssignmentWithRelations: (assignmentId: string) => Promise<void>;

    /**
     * Fetches teacher's assignment in a branch
     */
    fetchTeacherAssignmentInBranch: (teacherId: string, branchId: string) => Promise<void>;

    /**
     * Fetches all assignments for a teacher
     */
    fetchTeacherAssignments: (teacherId: string) => Promise<void>;

    /**
     * Fetches all teachers in a branch
     */
    fetchBranchTeachers: (
        branchId: string,
        filters?: BranchTeacherFilters,
        sort?: BranchTeacherSort,
        pagination?: PaginationOptions
    ) => Promise<void>;

    /**
     * Fetches all teachers across all branches of a coaching center
     */
    fetchCoachingCenterTeachers: (
        coachingCenterId: string,
        filters?: BranchTeacherFilters,
        sort?: BranchTeacherSort,
        pagination?: PaginationOptions
    ) => Promise<void>;

    /**
     * Fetches teachers by subject
     */
    fetchTeachersBySubject: (branchId: string, subject: string) => Promise<void>;

    /**
     * Updates assignment (by teacher)
     */
    updateAssignmentByTeacher: (
        assignmentId: string,
        teacherId: string,
        input: UpdateTeacherSelfInput
    ) => Promise<boolean>;

    /**
     * Updates assignment (by manager)
     */
    updateAssignmentByManager: (
        assignmentId: string,
        input: UpdateTeacherByManagerInput
    ) => Promise<boolean>;

    /**
     * Deactivates an assignment (soft delete)
     */
    deactivateAssignment: (assignmentId: string) => Promise<boolean>;

    /**
     * Reactivates an assignment
     */
    reactivateAssignment: (assignmentId: string) => Promise<boolean>;

    /**
     * Deletes an assignment (hard delete)
     */
    deleteAssignment: (assignmentId: string) => Promise<boolean>;

    // ============================================================
    // ACTIONS - Statistics & Analytics
    // ============================================================

    /**
     * Fetches teacher assignment summary
     */
    fetchTeacherSummary: (teacherId: string) => Promise<void>;

    /**
     * Fetches branch teacher statistics
     */
    fetchBranchStats: (branchId: string) => Promise<void>;

    /**
     * Fetches teachers needing attention
     */
    fetchTeachersNeedingAttention: (branchId: string, daysAhead?: number) => Promise<void>;

    /**
     * Fetches unique subjects at a branch
     */
    fetchBranchSubjects: (branchId: string) => Promise<void>;

    // ============================================================
    // ACTIONS - State Management
    // ============================================================

    /**
     * Sets current assignment
     */
    setCurrentAssignment: (assignment: BranchTeacher | null) => void;

    /**
     * Sets current assignment with relations
     */
    setCurrentAssignmentWithRelations: (assignment: BranchTeacherWithRelations | null) => void;

    /**
     * Opens the details dialog
     */
    openDetailsDialog: (assignment?: BranchTeacher | BranchTeacherWithRelations) => void;

    /**
     * Closes the details dialog
     */
    closeDetailsDialog: () => void;

    /**
     * Opens the edit dialog
     */
    openEditDialog: (assignment?: BranchTeacher | BranchTeacherWithRelations) => void;

    /**
     * Closes the edit dialog
     */
    closeEditDialog: () => void;

    /**
     * Opens the delete dialog
     */
    openDeleteDialog: (assignment?: BranchTeacher | BranchTeacherWithRelations) => void;

    /**
     * Closes the delete dialog
     */
    closeDeleteDialog: () => void;

    /**
     * Opens the assign dialog
     */
    openAssignDialog: () => void;

    /**
     * Closes the assign dialog
     */
    closeAssignDialog: () => void;

    /**
     * Sets filters
     */
    setFilters: (filters: BranchTeacherFilters | null) => void;

    /**
     * Sets sort
     */
    setSort: (sort: BranchTeacherSort | null) => void;

    /**
     * Sets pagination
     */
    setPagination: (pagination: PaginationOptions) => void;

    /**
     * Clears error
     */
    clearError: () => void;

    /**
     * Clears validation errors
     */
    clearValidationErrors: () => void;

    /**
     * Resets store to initial state
     */
    reset: () => void;
}

// ============================================================
// INITIAL STATE
// ============================================================

const initialState: Omit<
    BranchTeacherState,
    | 'assignTeacher'
    | 'fetchAssignment'
    | 'fetchAssignmentWithRelations'
    | 'fetchTeacherAssignmentInBranch'
    | 'fetchTeacherAssignments'
    | 'fetchBranchTeachers'
    | 'fetchCoachingCenterTeachers'
    | 'fetchTeachersBySubject'
    | 'updateAssignmentByTeacher'
    | 'updateAssignmentByManager'
    | 'deactivateAssignment'
    | 'reactivateAssignment'
    | 'deleteAssignment'
    | 'fetchTeacherSummary'
    | 'fetchBranchStats'
    | 'fetchTeachersNeedingAttention'
    | 'fetchBranchSubjects'
    | 'setCurrentAssignment'
    | 'setCurrentAssignmentWithRelations'
    | 'openDetailsDialog'
    | 'closeDetailsDialog'
    | 'openEditDialog'
    | 'closeEditDialog'
    | 'openDeleteDialog'
    | 'closeDeleteDialog'
    | 'openAssignDialog'
    | 'closeAssignDialog'
    | 'setFilters'
    | 'setSort'
    | 'setPagination'
    | 'clearError'
    | 'clearValidationErrors'
    | 'reset'
> = {
    assignments: {},
    assignmentsWithRelations: {},
    currentAssignment: null,
    currentAssignmentWithRelations: null,
    branchTeachers: [],
    teacherAssignments: [],
    searchResult: null,
    stats: null,
    summary: null,
    branchSubjects: [],
    isDetailsDialogOpen: false,
    isEditDialogOpen: false,
    isDeleteDialogOpen: false,
    isAssignDialogOpen: false,
    loading: false,
    assignmentLoading: false,
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

export const useBranchTeacherStore = create<BranchTeacherState>()(
    devtools(
        persist(
            (set, get) => ({
                ...initialState,

                // ============================================================
                // ASSIGNMENT MANAGEMENT ACTIONS
                // ============================================================

                assignTeacher: async (input: AssignTeacherInput) => {
                    console.log('🚀 Assigning teacher with input:', input);
                    set({ loading: true, error: null, validationErrors: null });

                    const result = await branchTeacherService.assignTeacher(input);

                    if (result.success && result.data) {
                        const assignment = result.data;
                        set((state) => ({
                            loading: false,
                            assignments: {
                                ...state.assignments,
                                [assignment.id]: assignment,
                            },
                            currentAssignment: assignment,
                        }));
                        return true;
                    }
                    console.log('⚠️ Assignment failed with result:', result);
                    // Handle validation errors
                    if (result.validation_errors) {
                        const validationErrors: Record<string, string> = {};
                        result.validation_errors.forEach((err) => {
                            validationErrors[err.field] = err.message;
                        });
                        set({ loading: false, validationErrors });
                    } else {
                        set({ loading: false, error: result.error || 'Failed to assign teacher' });
                    }

                    return false;
                },

                fetchAssignment: async (assignmentId: string) => {
                    set({ assignmentLoading: true, error: null });

                    const result = await branchTeacherService.getAssignmentById(assignmentId);

                    if (result.success && result.data) {
                        const assignment = result.data;
                        set((state) => ({
                            assignmentLoading: false,
                            assignments: {
                                ...state.assignments,
                                [assignment.id]: assignment,
                            },
                            currentAssignment: assignment,
                        }));
                    } else {
                        set({
                            assignmentLoading: false,
                            error: result.error || 'Failed to fetch assignment',
                        });
                    }
                },

                fetchAssignmentWithRelations: async (assignmentId: string) => {
                    set({ assignmentLoading: true, error: null });

                    const result = await branchTeacherService.getAssignmentWithRelations(assignmentId);

                    if (result.success && result.data) {
                        const assignment = result.data;
                        set((state) => ({
                            assignmentLoading: false,
                            assignmentsWithRelations: {
                                ...state.assignmentsWithRelations,
                                [assignment.id]: assignment,
                            },
                            currentAssignmentWithRelations: assignment,
                        }));
                    } else {
                        set({
                            assignmentLoading: false,
                            error: result.error || 'Failed to fetch assignment',
                        });
                    }
                },

                fetchTeacherAssignmentInBranch: async (teacherId: string, branchId: string) => {
                    set({ assignmentLoading: true, error: null });

                    const result = await branchTeacherService.getTeacherAssignmentInBranch(
                        teacherId,
                        branchId
                    );

                    if (result.success && result.data) {
                        const assignment = result.data;
                        set((state) => ({
                            assignmentLoading: false,
                            assignments: {
                                ...state.assignments,
                                [assignment.id]: assignment,
                            },
                            currentAssignment: assignment,
                        }));
                    } else {
                        set({
                            assignmentLoading: false,
                            error: result.error || 'Assignment not found',
                        });
                    }
                },

                fetchTeacherAssignments: async (teacherId: string) => {
                    set({ listLoading: true, error: null });

                    const result = await branchTeacherService.getTeacherAssignments(teacherId);

                    if (result.success && result.data) {
                        const assignments = result.data;
                        const assignmentsRecord: Record<string, BranchTeacher> = {};
                        assignments.forEach((a) => {
                            assignmentsRecord[a.id] = a;
                        });

                        set((state) => ({
                            listLoading: false,
                            teacherAssignments: assignments,
                            assignments: {
                                ...state.assignments,
                                ...assignmentsRecord,
                            },
                        }));
                    } else {
                        set({
                            listLoading: false,
                            error: result.error || 'Failed to fetch assignments',
                        });
                    }
                },

                fetchBranchTeachers: async (
                    branchId: string,
                    filters?: BranchTeacherFilters,
                    sort?: BranchTeacherSort,
                    pagination?: PaginationOptions
                ) => {
                    set({ listLoading: true, error: null });

                    const result = await branchTeacherService.getBranchTeachers(
                        branchId,
                        filters,
                        sort,
                        pagination
                    );

                    if (result.success && result.data) {
                        set({
                            listLoading: false,
                            searchResult: result.data,
                            branchTeachers: result.data.teachers,
                        });
                    } else {
                        set({
                            listLoading: false,
                            error: result.error || 'Failed to fetch teachers',
                        });
                    }
                },

                fetchCoachingCenterTeachers: async (
                    coachingCenterId: string,
                    filters?: BranchTeacherFilters,
                    sort?: BranchTeacherSort,
                    pagination?: PaginationOptions
                ) => {
                    set({ listLoading: true, error: null });

                    const result = await branchTeacherService.getCoachingCenterTeachers(
                        coachingCenterId,
                        filters,
                        sort,
                        pagination
                    );

                    if (result.success && result.data) {
                        set({
                            listLoading: false,
                            searchResult: result.data,
                            branchTeachers: result.data.teachers,
                        });
                    } else {
                        set({
                            listLoading: false,
                            error: result.error || 'Failed to fetch teachers',
                        });
                    }
                },

                fetchTeachersBySubject: async (branchId: string, subject: string) => {
                    set({ listLoading: true, error: null });

                    const result = await branchTeacherService.getTeachersBySubject(branchId, subject);

                    if (result.success && result.data) {
                        set({
                            listLoading: false,
                            branchTeachers: result.data,
                        });
                    } else {
                        set({
                            listLoading: false,
                            error: result.error || 'Failed to fetch teachers',
                        });
                    }
                },

                updateAssignmentByTeacher: async (
                    assignmentId: string,
                    teacherId: string,
                    input: UpdateTeacherSelfInput
                ) => {
                    set({ loading: true, error: null, validationErrors: null });

                    const result = await branchTeacherService.updateAssignmentByTeacher(
                        assignmentId,
                        teacherId,
                        input
                    );

                    if (result.success && result.data) {
                        const assignment = result.data;
                        set((state) => ({
                            loading: false,
                            assignments: {
                                ...state.assignments,
                                [assignment.id]: assignment,
                            },
                            currentAssignment: assignment,
                        }));
                        return true;
                    }

                    if (result.validation_errors) {
                        const validationErrors: Record<string, string> = {};
                        result.validation_errors.forEach((err) => {
                            validationErrors[err.field] = err.message;
                        });
                        set({ loading: false, validationErrors });
                    } else {
                        set({ loading: false, error: result.error || 'Failed to update assignment' });
                    }

                    return false;
                },

                updateAssignmentByManager: async (
                    assignmentId: string,
                    input: UpdateTeacherByManagerInput
                ) => {
                    set({ loading: true, error: null, validationErrors: null });

                    const result = await branchTeacherService.updateAssignmentByManager(
                        assignmentId,
                        input
                    );

                    if (result.success && result.data) {
                        const assignment = result.data;
                        set((state) => ({
                            loading: false,
                            assignments: {
                                ...state.assignments,
                                [assignment.id]: assignment,
                            },
                            currentAssignment: assignment,
                        }));
                        return true;
                    }

                    if (result.validation_errors) {
                        const validationErrors: Record<string, string> = {};
                        result.validation_errors.forEach((err) => {
                            validationErrors[err.field] = err.message;
                        });
                        set({ loading: false, validationErrors });
                    } else {
                        set({ loading: false, error: result.error || 'Failed to update assignment' });
                    }

                    return false;
                },

                deactivateAssignment: async (assignmentId: string) => {
                    set({ loading: true, error: null });

                    const result = await branchTeacherService.deactivateAssignment(assignmentId);

                    if (result.success && result.data) {
                        const assignment = result.data;
                        set((state) => ({
                            loading: false,
                            assignments: {
                                ...state.assignments,
                                [assignment.id]: assignment,
                            },
                            currentAssignment: assignment,
                        }));
                        return true;
                    }

                    set({ loading: false, error: result.error || 'Failed to deactivate assignment' });
                    return false;
                },

                reactivateAssignment: async (assignmentId: string) => {
                    set({ loading: true, error: null });

                    const result = await branchTeacherService.reactivateAssignment(assignmentId);

                    if (result.success && result.data) {
                        const assignment = result.data;
                        set((state) => ({
                            loading: false,
                            assignments: {
                                ...state.assignments,
                                [assignment.id]: assignment,
                            },
                            currentAssignment: assignment,
                        }));
                        return true;
                    }

                    set({ loading: false, error: result.error || 'Failed to reactivate assignment' });
                    return false;
                },

                deleteAssignment: async (assignmentId: string) => {
                    set({ loading: true, error: null });

                    const result = await branchTeacherService.deleteAssignment(assignmentId);

                    if (result.success) {
                        set((state) => {
                            const { [assignmentId]: _, ...remainingAssignments } = state.assignments;
                            return {
                                loading: false,
                                assignments: remainingAssignments,
                                currentAssignment:
                                    state.currentAssignment?.id === assignmentId
                                        ? null
                                        : state.currentAssignment,
                            };
                        });
                        return true;
                    }

                    set({ loading: false, error: result.error || 'Failed to delete assignment' });
                    return false;
                },

                // ============================================================
                // STATISTICS & ANALYTICS ACTIONS
                // ============================================================

                fetchTeacherSummary: async (teacherId: string) => {
                    set({ statsLoading: true, error: null });

                    const result = await branchTeacherService.getTeacherAssignmentSummary(teacherId);

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

                    const result = await branchTeacherService.getBranchTeacherStats(branchId);

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

                fetchTeachersNeedingAttention: async (branchId: string, daysAhead?: number) => {
                    set({ listLoading: true, error: null });

                    const result = await branchTeacherService.getTeachersNeedingAttention(
                        branchId,
                        daysAhead
                    );

                    if (result.success && result.data) {
                        set({
                            listLoading: false,
                            branchTeachers: result.data,
                        });
                    } else {
                        set({
                            listLoading: false,
                            error: result.error || 'Failed to fetch teachers',
                        });
                    }
                },

                fetchBranchSubjects: async (branchId: string) => {
                    set({ loading: true, error: null });

                    const result = await branchTeacherService.getBranchSubjects(branchId);

                    if (result.success && result.data) {
                        set({
                            loading: false,
                            branchSubjects: result.data,
                        });
                    } else {
                        set({
                            loading: false,
                            error: result.error || 'Failed to fetch subjects',
                        });
                    }
                },

                // ============================================================
                // STATE MANAGEMENT ACTIONS
                // ============================================================

                setCurrentAssignment: (assignment: BranchTeacher | null) => {
                    set({ currentAssignment: assignment });
                },

                setCurrentAssignmentWithRelations: (assignment: BranchTeacherWithRelations | null) => {
                    set({ currentAssignmentWithRelations: assignment });
                },

                openDetailsDialog: (assignment) => {
                    if (assignment) {
                        if ('profile' in assignment) {
                            set({
                                currentAssignmentWithRelations: assignment as BranchTeacherWithRelations,
                                isDetailsDialogOpen: true,
                            });
                        } else {
                            set({
                                currentAssignment: assignment as BranchTeacher,
                                isDetailsDialogOpen: true,
                            });
                        }
                    } else {
                        set({ isDetailsDialogOpen: true });
                    }
                },

                closeDetailsDialog: () => {
                    set({ isDetailsDialogOpen: false });
                },

                openEditDialog: (assignment) => {
                    if (assignment) {
                        if ('profile' in assignment) {
                            set({
                                currentAssignmentWithRelations: assignment as BranchTeacherWithRelations,
                                isEditDialogOpen: true,
                            });
                        } else {
                            set({
                                currentAssignment: assignment as BranchTeacher,
                                isEditDialogOpen: true,
                            });
                        }
                    } else {
                        set({ isEditDialogOpen: true });
                    }
                },

                closeEditDialog: () => {
                    set({ isEditDialogOpen: false, validationErrors: null });
                },

                openDeleteDialog: (assignment) => {
                    if (assignment) {
                        if ('profile' in assignment) {
                            set({
                                currentAssignmentWithRelations: assignment as BranchTeacherWithRelations,
                                isDeleteDialogOpen: true,
                            });
                        } else {
                            set({
                                currentAssignment: assignment as BranchTeacher,
                                isDeleteDialogOpen: true,
                            });
                        }
                    } else {
                        set({ isDeleteDialogOpen: true });
                    }
                },

                closeDeleteDialog: () => {
                    set({ isDeleteDialogOpen: false });
                },

                openAssignDialog: () => {
                    set({ isAssignDialogOpen: true, validationErrors: null });
                },

                closeAssignDialog: () => {
                    set({ isAssignDialogOpen: false, validationErrors: null });
                },

                setFilters: (filters: BranchTeacherFilters | null) => {
                    set({ filters });
                },

                setSort: (sort: BranchTeacherSort | null) => {
                    set({ sort });
                },

                setPagination: (pagination: PaginationOptions) => {
                    set({ pagination });
                },

                clearError: () => {
                    set({ error: null });
                },

                clearValidationErrors: () => {
                    set({ validationErrors: null });
                },

                reset: () => {
                    set(initialState);
                },
            }),
            {
                name: 'branch-teacher-store',
                partialize: (state) => ({
                    // Only persist these fields
                    pagination: state.pagination,
                    filters: state.filters,
                    sort: state.sort,
                }),
            }
        ),
        {
            name: 'BranchTeacherStore',
        }
    )
);

// ============================================================
// SELECTORS
// ============================================================

/**
 * Select assignment by ID
 */
export const selectAssignmentById = (assignmentId: string) => (state: BranchTeacherState) =>
    state.assignments[assignmentId];

/**
 * Select current assignment
 */
export const selectCurrentAssignment = (state: BranchTeacherState) => state.currentAssignment;

/**
 * Select current assignment with relations
 */
export const selectCurrentAssignmentWithRelations = (state: BranchTeacherState) =>
    state.currentAssignmentWithRelations;

/**
 * Select branch teachers list
 */
export const selectBranchTeachers = (state: BranchTeacherState) => state.branchTeachers;

/**
 * Select teacher assignments
 */
export const selectTeacherAssignments = (state: BranchTeacherState) => state.teacherAssignments;

/**
 * Select loading state
 */
export const selectLoading = (state: BranchTeacherState) => state.loading;

/**
 * Select list loading state
 */
export const selectListLoading = (state: BranchTeacherState) => state.listLoading;

/**
 * Select stats loading state
 */
export const selectStatsLoading = (state: BranchTeacherState) => state.statsLoading;

/**
 * Select error
 */
export const selectError = (state: BranchTeacherState) => state.error;

/**
 * Select validation errors
 */
export const selectValidationErrors = (state: BranchTeacherState) => state.validationErrors;

/**
 * Select stats
 */
export const selectStats = (state: BranchTeacherState) => state.stats;

/**
 * Select summary
 */
export const selectSummary = (state: BranchTeacherState) => state.summary;

/**
 * Select branch subjects
 */
export const selectBranchSubjects = (state: BranchTeacherState) => state.branchSubjects;

/**
 * Select search result
 */
export const selectSearchResult = (state: BranchTeacherState) => state.searchResult;

/**
 * Select dialog states
 */
export const selectDialogStates = (state: BranchTeacherState) => ({
    isDetailsDialogOpen: state.isDetailsDialogOpen,
    isEditDialogOpen: state.isEditDialogOpen,
    isDeleteDialogOpen: state.isDeleteDialogOpen,
    isAssignDialogOpen: state.isAssignDialogOpen,
});

/**
 * Select filters
 */
export const selectFilters = (state: BranchTeacherState) => state.filters;

/**
 * Select sort
 */
export const selectSort = (state: BranchTeacherState) => state.sort;

/**
 * Select pagination
 */
export const selectPagination = (state: BranchTeacherState) => state.pagination;
