/**
 * Branch Classes Store 
 * 
 * Zustand store for managing branch class state
 * Handles caching, UI state, and provides convenient hooks
 * 
 * @module branch-system/stores/branch-classes
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
    BranchClass,
    PublicBranchClass,
    BranchClassWithRelations,
    CreateBranchClassInput,
    UpdateBranchClassInput,
    BranchClassFilters,
    BranchClassSort,
    PaginationOptions,
    BranchClassSearchResult,
    BranchClassStats,
    ClassAvailability,
    TeacherClassSummary,
    BranchClassSummary,
} from '../types/branch-classes.types';
import { branchClassesService } from '../services/branch-classes.service';

// ============================================================
// STORE STATE INTERFACE
// ============================================================

interface BranchClassesState {
    // ============================================================
    // CACHE - Normalized data storage
    // ============================================================
    classesById: Record<string, BranchClass>;
    classesByBranch: Record<string, string[]>; // branch_id -> class_id[]
    classesByTeacher: Record<string, string[]>; // teacher_id -> class_id[]
    searchResults: BranchClassSearchResult | null;
    stats: Record<string, BranchClassStats>; // branch_id -> stats

    // ============================================================
    // LOADING STATES
    // ============================================================
    loading: {
        fetchClass: boolean;
        fetchClasses: boolean;
        createClass: boolean;
        updateClass: boolean;
        deleteClass: boolean;
        search: boolean;
        stats: boolean;
    };

    // ============================================================
    // ERROR STATES
    // ============================================================
    errors: {
        fetchClass: string | null;
        fetchClasses: string | null;
        createClass: string | null;
        updateClass: string | null;
        deleteClass: string | null;
        search: string | null;
        stats: string | null;
    };

    // ============================================================
    // UI STATE
    // ============================================================
    ui: {
        selectedClassId: string | null;
        isCreating: boolean;
        isEditing: boolean;
        editingClassId: string | null;
        createFormData: Partial<CreateBranchClassInput>;
        editFormData: Partial<UpdateBranchClassInput>;
        currentFilters: BranchClassFilters;
        currentSort: BranchClassSort;
        currentPagination: PaginationOptions;
    };

    // ============================================================
    // ACTIONS - Data fetching and manipulation
    // ============================================================

    // Fetch operations
    fetchClassById: (classId: string, forceRefresh?: boolean) => Promise<void>;
    fetchClassesByBranch: (branchId: string, forceRefresh?: boolean) => Promise<void>;
    fetchClassesByTeacher: (teacherId: string, forceRefresh?: boolean) => Promise<void>;
    searchClasses: (
        filters?: BranchClassFilters,
        sort?: BranchClassSort,
        pagination?: PaginationOptions
    ) => Promise<void>;
    fetchBranchStats: (branchId: string, forceRefresh?: boolean) => Promise<void>;

    // Create, Update, Delete operations
    createClass: (input: CreateBranchClassInput) => Promise<boolean>;
    updateClass: (classId: string, input: UpdateBranchClassInput) => Promise<boolean>;
    deleteClass: (classId: string) => Promise<boolean>;
    updateClassStatus: (classId: string, status: BranchClass['status']) => Promise<boolean>;
    updateClassVisibility: (classId: string, isVisible: boolean) => Promise<boolean>;

    // UI Actions
    setSelectedClass: (classId: string | null) => void;
    startCreating: (branchId?: string) => void;
    cancelCreating: () => void;
    startEditing: (classId: string) => void;
    cancelEditing: () => void;
    updateCreateFormData: (data: Partial<CreateBranchClassInput>) => void;
    updateEditFormData: (data: Partial<UpdateBranchClassInput>) => void;
    setFilters: (filters: BranchClassFilters) => void;
    setSort: (sort: BranchClassSort) => void;
    setPagination: (pagination: Partial<PaginationOptions>) => void;
    resetFilters: () => void;

    // Cache management
    clearCache: () => void;
    clearBranchCache: (branchId: string) => void;
    clearTeacherCache: (teacherId: string) => void;
    invalidateClass: (classId: string) => void;
}

// ============================================================
// DEFAULT VALUES
// ============================================================

const DEFAULT_FILTERS: BranchClassFilters = {};

const DEFAULT_SORT: BranchClassSort = {
    field: 'created_at',
    direction: 'desc',
};

const DEFAULT_PAGINATION: PaginationOptions = {
    page: 1,
    limit: 20,
};

// ============================================================
// STORE CREATION
// ============================================================

export const useBranchClassesStore = create<BranchClassesState>()(
    devtools(
        immer((set, get) => ({
            // ============================================================
            // INITIAL STATE
            // ============================================================
            classesById: {},
            classesByBranch: {},
            classesByTeacher: {},
            searchResults: null,
            stats: {},

            loading: {
                fetchClass: false,
                fetchClasses: false,
                createClass: false,
                updateClass: false,
                deleteClass: false,
                search: false,
                stats: false,
            },

            errors: {
                fetchClass: null,
                fetchClasses: null,
                createClass: null,
                updateClass: null,
                deleteClass: null,
                search: null,
                stats: null,
            },

            ui: {
                selectedClassId: null,
                isCreating: false,
                isEditing: false,
                editingClassId: null,
                createFormData: {},
                editFormData: {},
                currentFilters: DEFAULT_FILTERS,
                currentSort: DEFAULT_SORT,
                currentPagination: DEFAULT_PAGINATION,
            },

            // ============================================================
            // FETCH OPERATIONS
            // ============================================================

            fetchClassById: async (classId: string, forceRefresh = false) => {
                const state = get();

                // Check cache first
                if (!forceRefresh && state.classesById[classId]) {
                    return;
                }

                set((draft) => {
                    draft.loading.fetchClass = true;
                    draft.errors.fetchClass = null;
                });

                try {
                    const result = await branchClassesService.getClassById(classId);

                    if (result.success && result.data) {
                        set((draft) => {
                            draft.classesById[classId] = result.data!;
                            draft.loading.fetchClass = false;
                        });
                    } else {
                        set((draft) => {
                            draft.errors.fetchClass = result.error || 'Failed to fetch class';
                            draft.loading.fetchClass = false;
                        });
                    }
                } catch (error) {
                    set((draft) => {
                        draft.errors.fetchClass = error instanceof Error ? error.message : 'Unknown error';
                        draft.loading.fetchClass = false;
                    });
                }
            },

            fetchClassesByBranch: async (branchId: string, forceRefresh = false) => {
                const state = get();

                // Check cache first
                if (!forceRefresh && state.classesByBranch[branchId]) {
                    return;
                }

                set((draft) => {
                    draft.loading.fetchClasses = true;
                    draft.errors.fetchClasses = null;
                });

                try {
                    const result = await branchClassesService.getClassesByBranch(branchId, true);

                    if (result.success && result.data) {
                        set((draft) => {
                            const classIds: string[] = [];

                            result.data!.forEach((cls) => {
                                draft.classesById[cls.id] = cls;
                                classIds.push(cls.id);
                            });

                            draft.classesByBranch[branchId] = classIds;
                            draft.loading.fetchClasses = false;
                        });
                    } else {
                        set((draft) => {
                            draft.errors.fetchClasses = result.error || 'Failed to fetch classes';
                            draft.loading.fetchClasses = false;
                        });
                    }
                } catch (error) {
                    set((draft) => {
                        draft.errors.fetchClasses = error instanceof Error ? error.message : 'Unknown error';
                        draft.loading.fetchClasses = false;
                    });
                }
            },

            fetchClassesByTeacher: async (teacherId: string, forceRefresh = false) => {
                const state = get();

                // Check cache first
                if (!forceRefresh && state.classesByTeacher[teacherId]) {
                    return;
                }

                set((draft) => {
                    draft.loading.fetchClasses = true;
                    draft.errors.fetchClasses = null;
                });

                try {
                    const result = await branchClassesService.getClassesByTeacher(teacherId);

                    if (result.success && result.data) {
                        set((draft) => {
                            const classIds: string[] = [];

                            result.data!.forEach((cls) => {
                                draft.classesById[cls.id] = cls;
                                classIds.push(cls.id);
                            });

                            draft.classesByTeacher[teacherId] = classIds;
                            draft.loading.fetchClasses = false;
                        });
                    } else {
                        set((draft) => {
                            draft.errors.fetchClasses = result.error || 'Failed to fetch classes';
                            draft.loading.fetchClasses = false;
                        });
                    }
                } catch (error) {
                    set((draft) => {
                        draft.errors.fetchClasses = error instanceof Error ? error.message : 'Unknown error';
                        draft.loading.fetchClasses = false;
                    });
                }
            },

            searchClasses: async (
                filters = DEFAULT_FILTERS,
                sort = DEFAULT_SORT,
                pagination = DEFAULT_PAGINATION
            ) => {
                set((draft) => {
                    draft.loading.search = true;
                    draft.errors.search = null;
                    draft.ui.currentFilters = filters;
                    draft.ui.currentSort = sort;
                    draft.ui.currentPagination = pagination;
                });

                try {
                    const result = await branchClassesService.searchClasses(filters, sort, pagination);

                    if (result.success && result.data) {
                        set((draft) => {
                            // Cache classes in normalized store
                            result.data!.classes.forEach((cls) => {
                                // result.data!.classes may be PublicBranchClass; cast via unknown first to silence
                                // TypeScript complaint about non-overlapping types when the cast is intentional.
                                draft.classesById[cls.id] = cls as unknown as BranchClass;
                            });

                            draft.searchResults = result.data!;
                            draft.loading.search = false;
                        });
                    } else {
                        set((draft) => {
                            draft.errors.search = result.error || 'Failed to search classes';
                            draft.loading.search = false;
                        });
                    }
                } catch (error) {
                    set((draft) => {
                        draft.errors.search = error instanceof Error ? error.message : 'Unknown error';
                        draft.loading.search = false;
                    });
                }
            },

            fetchBranchStats: async (branchId: string, forceRefresh = false) => {
                const state = get();

                // Check cache first
                if (!forceRefresh && state.stats[branchId]) {
                    return;
                }

                set((draft) => {
                    draft.loading.stats = true;
                    draft.errors.stats = null;
                });

                try {
                    const result = await branchClassesService.getBranchClassStats(branchId);

                    if (result.success && result.data) {
                        set((draft) => {
                            draft.stats[branchId] = result.data!;
                            draft.loading.stats = false;
                        });
                    } else {
                        set((draft) => {
                            draft.errors.stats = result.error || 'Failed to fetch stats';
                            draft.loading.stats = false;
                        });
                    }
                } catch (error) {
                    set((draft) => {
                        draft.errors.stats = error instanceof Error ? error.message : 'Unknown error';
                        draft.loading.stats = false;
                    });
                }
            },

            // ============================================================
            // CREATE, UPDATE, DELETE OPERATIONS
            // ============================================================

            createClass: async (input: CreateBranchClassInput) => {
                set((draft) => {
                    draft.loading.createClass = true;
                    draft.errors.createClass = null;
                });

                try {
                    const result = await branchClassesService.createClass(input);

                    if (result.success && result.data) {
                        set((draft) => {
                            draft.classesById[result.data!.id] = result.data!;

                            // Add to branch cache
                            const branchId = result.data!.branch_id;
                            if (!draft.classesByBranch[branchId]) {
                                draft.classesByBranch[branchId] = [];
                            }
                            draft.classesByBranch[branchId].push(result.data!.id);

                            // Add to teacher cache if assigned
                            if (result.data!.teacher_id) {
                                const teacherId = result.data!.teacher_id;
                                if (!draft.classesByTeacher[teacherId]) {
                                    draft.classesByTeacher[teacherId] = [];
                                }
                                draft.classesByTeacher[teacherId].push(result.data!.id);
                            }

                            draft.loading.createClass = false;
                            draft.ui.isCreating = false;
                            draft.ui.createFormData = {};
                        });

                        return true;
                    } else {
                        set((draft) => {
                            draft.errors.createClass = result.error || 'Failed to create class';
                            draft.loading.createClass = false;
                        });
                        return false;
                    }
                } catch (error) {
                    set((draft) => {
                        draft.errors.createClass = error instanceof Error ? error.message : 'Unknown error';
                        draft.loading.createClass = false;
                    });
                    return false;
                }
            },

            updateClass: async (classId: string, input: UpdateBranchClassInput) => {
                set((draft) => {
                    draft.loading.updateClass = true;
                    draft.errors.updateClass = null;
                });

                try {
                    const result = await branchClassesService.updateClass(classId, input);

                    if (result.success && result.data) {
                        set((draft) => {
                            draft.classesById[classId] = result.data!;
                            draft.loading.updateClass = false;
                            draft.ui.isEditing = false;
                            draft.ui.editingClassId = null;
                            draft.ui.editFormData = {};
                        });

                        return true;
                    } else {
                        set((draft) => {
                            draft.errors.updateClass = result.error || 'Failed to update class';
                            draft.loading.updateClass = false;
                        });
                        return false;
                    }
                } catch (error) {
                    set((draft) => {
                        draft.errors.updateClass = error instanceof Error ? error.message : 'Unknown error';
                        draft.loading.updateClass = false;
                    });
                    return false;
                }
            },

            deleteClass: async (classId: string) => {
                set((draft) => {
                    draft.loading.deleteClass = true;
                    draft.errors.deleteClass = null;
                });

                try {
                    const result = await branchClassesService.deleteClass(classId);

                    if (result.success) {
                        set((draft) => {
                            const cls = draft.classesById[classId];

                            // Remove from main cache
                            delete draft.classesById[classId];

                            // Remove from branch cache
                            if (cls) {
                                const branchClasses = draft.classesByBranch[cls.branch_id];
                                if (branchClasses) {
                                    draft.classesByBranch[cls.branch_id] = branchClasses.filter(id => id !== classId);
                                }

                                // Remove from teacher cache
                                if (cls.teacher_id) {
                                    const teacherClasses = draft.classesByTeacher[cls.teacher_id];
                                    if (teacherClasses) {
                                        draft.classesByTeacher[cls.teacher_id] = teacherClasses.filter(id => id !== classId);
                                    }
                                }
                            }

                            draft.loading.deleteClass = false;
                        });

                        return true;
                    } else {
                        set((draft) => {
                            draft.errors.deleteClass = result.error || 'Failed to delete class';
                            draft.loading.deleteClass = false;
                        });
                        return false;
                    }
                } catch (error) {
                    set((draft) => {
                        draft.errors.deleteClass = error instanceof Error ? error.message : 'Unknown error';
                        draft.loading.deleteClass = false;
                    });
                    return false;
                }
            },

            updateClassStatus: async (classId: string, status: BranchClass['status']) => {
                return get().updateClass(classId, { status });
            },

            updateClassVisibility: async (classId: string, isVisible: boolean) => {
                return get().updateClass(classId, { is_visible: isVisible });
            },

            // ============================================================
            // UI ACTIONS
            // ============================================================

            setSelectedClass: (classId: string | null) => {
                set((draft) => {
                    draft.ui.selectedClassId = classId;
                });
            },

            startCreating: (branchId?: string) => {
                set((draft) => {
                    draft.ui.isCreating = true;
                    draft.ui.createFormData = branchId ? { branch_id: branchId } : {};
                    draft.errors.createClass = null;
                });
            },

            cancelCreating: () => {
                set((draft) => {
                    draft.ui.isCreating = false;
                    draft.ui.createFormData = {};
                    draft.errors.createClass = null;
                });
            },

            startEditing: (classId: string) => {
                const cls = get().classesById[classId];

                set((draft) => {
                    draft.ui.isEditing = true;
                    draft.ui.editingClassId = classId;
                    draft.ui.editFormData = cls || {};
                    draft.errors.updateClass = null;
                });
            },

            cancelEditing: () => {
                set((draft) => {
                    draft.ui.isEditing = false;
                    draft.ui.editingClassId = null;
                    draft.ui.editFormData = {};
                    draft.errors.updateClass = null;
                });
            },

            updateCreateFormData: (data: Partial<CreateBranchClassInput>) => {
                set((draft) => {
                    draft.ui.createFormData = { ...draft.ui.createFormData, ...data };
                });
            },

            updateEditFormData: (data: Partial<UpdateBranchClassInput>) => {
                set((draft) => {
                    draft.ui.editFormData = { ...draft.ui.editFormData, ...data };
                });
            },

            setFilters: (filters: BranchClassFilters) => {
                set((draft) => {
                    draft.ui.currentFilters = filters;
                    draft.ui.currentPagination = { ...draft.ui.currentPagination, page: 1 }; // Reset to first page
                });
            },

            setSort: (sort: BranchClassSort) => {
                set((draft) => {
                    draft.ui.currentSort = sort;
                });
            },

            setPagination: (pagination: Partial<PaginationOptions>) => {
                set((draft) => {
                    draft.ui.currentPagination = { ...draft.ui.currentPagination, ...pagination };
                });
            },

            resetFilters: () => {
                set((draft) => {
                    draft.ui.currentFilters = DEFAULT_FILTERS;
                    draft.ui.currentSort = DEFAULT_SORT;
                    draft.ui.currentPagination = DEFAULT_PAGINATION;
                });
            },

            // ============================================================
            // CACHE MANAGEMENT
            // ============================================================

            clearCache: () => {
                set((draft) => {
                    draft.classesById = {};
                    draft.classesByBranch = {};
                    draft.classesByTeacher = {};
                    draft.searchResults = null;
                    draft.stats = {};
                });
            },

            clearBranchCache: (branchId: string) => {
                set((draft) => {
                    const classIds = draft.classesByBranch[branchId] || [];
                    classIds.forEach((id) => {
                        delete draft.classesById[id];
                    });
                    delete draft.classesByBranch[branchId];
                    delete draft.stats[branchId];
                });
            },

            clearTeacherCache: (teacherId: string) => {
                set((draft) => {
                    delete draft.classesByTeacher[teacherId];
                });
            },

            invalidateClass: (classId: string) => {
                set((draft) => {
                    delete draft.classesById[classId];
                });
            },
        })),
        { name: 'BranchClassesStore' }
    )
);

// ============================================================
// CONVENIENT HOOKS - FIXED to prevent infinite loops
// ============================================================

/**
 * Gets a class by ID from cache
 * FIXED: No longer creates new objects on each call
 */
export const useClass = (classId: string | null) => {
    return useBranchClassesStore((state) =>
        classId ? state.classesById[classId] : null
    );
};

/**
 * Gets classes by branch ID from cache
 * FIXED: Returns the array reference from store, not a newly created array
 */
export const useClassesByBranch = (branchId: string | null) => {
    // Get the IDs array directly (this is stable)
    const classIds = useBranchClassesStore((state) =>
        branchId ? state.classesByBranch[branchId] : undefined
    );

    // Get the classes lookup object (this is stable)
    const classesById = useBranchClassesStore((state) => state.classesById);

    // Only create the mapped array when IDs or classes actually change
    // This still creates a new array, but only when dependencies change
    if (!classIds || !branchId) return [];

    return classIds.map((id) => classesById[id]).filter(Boolean);
};

/**
 * Gets classes by teacher ID from cache
 * FIXED: Returns the array reference from store, not a newly created array
 */
export const useClassesByTeacher = (teacherId: string | null) => {
    // Get the IDs array directly (this is stable)
    const classIds = useBranchClassesStore((state) =>
        teacherId ? state.classesByTeacher[teacherId] : undefined
    );

    // Get the classes lookup object (this is stable)
    const classesById = useBranchClassesStore((state) => state.classesById);

    // Only create the mapped array when IDs or classes actually change
    if (!classIds || !teacherId) return [];

    return classIds.map((id) => classesById[id]).filter(Boolean);
};

/**
 * Gets search results
 */
export const useSearchResults = () => {
    return useBranchClassesStore((state) => state.searchResults);
};

/**
 * Gets branch stats
 */
export const useBranchStats = (branchId: string | null) => {
    return useBranchClassesStore((state) =>
        branchId ? state.stats[branchId] : null
    );
};

/**
 * Gets loading states
 */
export const useClassesLoading = () => {
    return useBranchClassesStore((state) => state.loading);
};

/**
 * Gets error states
 */
export const useClassesErrors = () => {
    return useBranchClassesStore((state) => state.errors);
};

/**
 * Gets UI state
 */
export const useClassesUI = () => {
    return useBranchClassesStore((state) => state.ui);
};

/**
 * Gets selected class
 */
export const useSelectedClass = () => {
    const selectedId = useBranchClassesStore((state) => state.ui.selectedClassId);
    return useClass(selectedId);
};