/**
 * Assignment Store
 * 
 * Zustand store for managing assignment state in React components.
 * Provides actions for CRUD operations, filtering, pagination, and caching.
 * Implements devtools integration, persistence, and intelligent cache management.
 * 
 * @module branch-system/stores/assignment
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
    assignmentService,
    type AssignmentOperationResult,
} from '../services/assignment.service';
import type {
    Assignment,
    AssignmentSubmission,
    CreateAssignmentDTO,
    UpdateAssignmentDTO,
    PublishAssignmentDTO,
    CloseAssignmentDTO,
    SubmitAssignmentDTO,
    SaveDraftDTO,
    GradeSubmissionDTO,
    UpdateGradeDTO,
    RegradeRequestDTO,
    UploadFileDTO,
    FileUploadResult,
    AssignmentFilters,
    AssignmentListParams,
    AssignmentListResponse,
    SubmissionFilters,
    SubmissionListParams,
    SubmissionListResponse,
    AssignmentStatistics,
    StudentAssignmentSummary,
    ClassAssignmentReport,
    AssignmentStatus,
    SubmissionForGrading,
    StudentSubmissionStatusItem,
} from '../types/assignment.types';
import { GradingStatus } from '../types/assignment.types';
import { getCurrentDateTime } from '../utils/assignment.utils';

// ============================================================
// CACHE CONFIGURATION
// ============================================================

/**
 * Cache duration in milliseconds
 */
const CACHE_DURATION = {
    LIST: 2 * 60 * 1000,           // 2 minutes for list data
    SUBMISSIONS: 1 * 60 * 1000,    // 1 minute for submissions (more frequent updates)
    STATISTICS: 5 * 60 * 1000,     // 5 minutes for statistics
    SINGLE: 3 * 60 * 1000,         // 3 minutes for single record
} as const;

/**
 * Cache metadata for tracking
 */
interface CacheMetadata {
    lastListFetch: number | null;
    lastSubmissionsFetch: Record<string, number>; // assignmentId -> timestamp
    lastStatsFetch: Record<string, number>;       // assignmentId -> timestamp
    lastAssignmentFetch: Record<string, number>;  // assignmentId -> timestamp
}

// ============================================================
// STATE INTERFACE
// ============================================================

interface AssignmentState {
    // ============================================================
    // STATE DATA
    // ============================================================

    /** Current assignment list */
    assignments: Assignment[];

    /** Current submissions list */
    submissions: AssignmentSubmission[];

    /** Current assignment being viewed/edited */
    currentAssignment: Assignment | null;

    /** Current submission being viewed */
    currentSubmission: AssignmentSubmission | null;

    /** Submissions for grading view */
    submissionsForGrading: SubmissionForGrading[];

    /** Student submission status list */
    studentStatusList: StudentSubmissionStatusItem[];

    /** Assignment statistics */
    assignmentStatistics: AssignmentStatistics | null;

    /** Student summary */
    studentSummary: StudentAssignmentSummary | null;

    /** Class report */
    classReport: ClassAssignmentReport | null;

    /** Assignment to delete (for confirmation dialog) */
    assignmentToDelete: Assignment | null;

    /** Delete dialog open state */
    isDeleteDialogOpen: boolean;

    /** Assignment to edit (for edit dialog/page) */
    assignmentToEdit: Assignment | null;

    /** Submission to grade (for grading dialog) */
    submissionToGrade: SubmissionForGrading | null;

    /** Grading dialog open state */
    isGradingDialogOpen: boolean;

    /** Current filters applied */
    filters: AssignmentFilters;

    /** Pagination state */
    pagination: {
        page: number;
        limit: number;
        total: number;
        has_more: boolean;
    };

    /** Sort configuration */
    sort: {
        sort_by: 'due_date' | 'created_at' | 'title';
        sort_order: 'asc' | 'desc';
    };

    /** Loading states */
    loading: {
        list: boolean;
        submissions: boolean;
        create: boolean;
        update: boolean;
        delete: boolean;
        publish: boolean;
        grade: boolean;
        statistics: boolean;
        upload: boolean;
    };

    /** Error state */
    error: string | null;

    /** Success message */
    successMessage: string | null;

    /** Cache metadata */
    _cacheMetadata: CacheMetadata;

    /** Last query hash */
    _lastQueryHash: string | null;

    // ============================================================
    // ASSIGNMENT ACTIONS
    // ============================================================

    /** Creates a new assignment */
    createAssignment: (input: CreateAssignmentDTO) => Promise<boolean>;

    /** Updates an existing assignment */
    updateAssignment: (input: UpdateAssignmentDTO) => Promise<boolean>;

    /** Publishes an assignment */
    publishAssignment: (input: PublishAssignmentDTO) => Promise<boolean>;

    /** Closes an assignment */
    closeAssignment: (input: CloseAssignmentDTO) => Promise<boolean>;

    /** Deletes an assignment */
    deleteAssignment: (assignmentId: string) => Promise<boolean>;

    /** Fetches assignments list */
    fetchAssignments: (params?: AssignmentListParams, forceRefresh?: boolean) => Promise<void>;

    /** Fetches single assignment by ID */
    fetchAssignmentById: (assignmentId: string, forceRefresh?: boolean) => Promise<void>;

    // ============================================================
    // SUBMISSION ACTIONS
    // ============================================================

    /** Submits an assignment (student) */
    submitAssignment: (input: SubmitAssignmentDTO) => Promise<boolean>;

    /** Saves a draft submission */
    saveDraft: (input: SaveDraftDTO) => Promise<boolean>;

    /** Fetches student's submission */
    fetchStudentSubmission: (assignmentId: string, studentId: string) => Promise<void>;

    /** Fetches submissions list */
    fetchSubmissions: (params?: SubmissionListParams, forceRefresh?: boolean) => Promise<void>;

    /** Fetches submissions for grading view */
    fetchSubmissionsForGrading: (assignmentId: string, forceRefresh?: boolean) => Promise<void>;

    /** Fetches student submission status list */
    fetchStudentStatusList: (assignmentId: string, classId: string) => Promise<void>;

    // ============================================================
    // GRADING ACTIONS
    // ============================================================

    /** Grades a submission */
    gradeSubmission: (input: GradeSubmissionDTO) => Promise<boolean>;

    /** Updates a grade */
    updateGrade: (input: UpdateGradeDTO) => Promise<boolean>;

    /** Requests a regrade (student) */
    requestRegrade: (input: RegradeRequestDTO) => Promise<boolean>;

    // ============================================================
    // STATISTICS ACTIONS
    // ============================================================

    /** Fetches assignment statistics */
    fetchAssignmentStatistics: (assignmentId: string, forceRefresh?: boolean) => Promise<void>;

    /** Fetches student summary */
    fetchStudentSummary: (studentId: string, classId?: string) => Promise<void>;

    /** Fetches class report */
    fetchClassReport: (classId: string) => Promise<void>;

    // ============================================================
    // FILE ACTIONS
    // ============================================================

    /** Uploads a file */
    uploadFile: (input: UploadFileDTO) => Promise<FileUploadResult | null>;

    /** Deletes a file */
    deleteFile: (fileId: string, userId: string) => Promise<boolean>;

    /** Attaches file to assignment */
    attachFileToAssignment: (assignmentId: string, fileId: string, type: 'instruction' | 'attachment') => Promise<boolean>;

    // ============================================================
    // STATE MANAGEMENT ACTIONS
    // ============================================================

    /** Sets current assignment */
    setCurrentAssignment: (assignment: Assignment | null) => void;

    /** Sets current submission */
    setCurrentSubmission: (submission: AssignmentSubmission | null) => void;

    /** Opens delete confirmation dialog */
    openDeleteDialog: (assignment: Assignment) => void;

    /** Closes delete confirmation dialog */
    closeDeleteDialog: () => void;

    /** Opens grading dialog */
    openGradingDialog: (submission: SubmissionForGrading) => void;

    /** Closes grading dialog */
    closeGradingDialog: () => void;

    /** Sets filters */
    setFilters: (filters: Partial<AssignmentFilters>) => void;

    /** Resets filters */
    resetFilters: () => void;

    /** Sets pagination */
    setPagination: (page: number, limit?: number) => void;

    /** Sets sort configuration */
    setSort: (sortBy: 'due_date' | 'created_at' | 'title', sortOrder: 'asc' | 'desc') => void;

    /** Clears error */
    clearError: () => void;

    /** Clears success message */
    clearSuccessMessage: () => void;

    /** Invalidates all caches */
    invalidateCache: () => void;

    /** Resets store to initial state */
    reset: () => void;

    // ============================================================
    // SELECTORS
    // ============================================================

    /** Gets assignments by status */
    getAssignmentsByStatus: (status: AssignmentStatus) => Assignment[];

    /** Gets upcoming assignments (due in future) */
    getUpcomingAssignments: () => Assignment[];

    /** Gets overdue assignments */
    getOverdueAssignments: () => Assignment[];

    /** Gets ungraded submissions count */
    getUngradedCount: () => number;

    /** Checks if any operation is loading */
    isAnyLoading: () => boolean;

    /** Checks if cache is valid */
    _isCacheValid: (key: string, duration: number) => boolean;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Generates a hash for query parameters
 */
function generateQueryHash(params: Record<string, unknown>): string {
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
    assignments: [],
    submissions: [],
    currentAssignment: null,
    currentSubmission: null,
    submissionsForGrading: [],
    studentStatusList: [],
    assignmentStatistics: null,
    studentSummary: null,
    classReport: null,
    assignmentToDelete: null,
    isDeleteDialogOpen: false,
    assignmentToEdit: null,
    submissionToGrade: null,
    isGradingDialogOpen: false,
    filters: {},
    pagination: {
        page: 1,
        limit: 20,
        total: 0,
        has_more: false,
    },
    sort: {
        sort_by: 'due_date' as const,
        sort_order: 'desc' as const,
    },
    loading: {
        list: false,
        submissions: false,
        create: false,
        update: false,
        delete: false,
        publish: false,
        grade: false,
        statistics: false,
        upload: false,
    },
    error: null,
    successMessage: null,
    _cacheMetadata: {
        lastListFetch: null,
        lastSubmissionsFetch: {},
        lastStatsFetch: {},
        lastAssignmentFetch: {},
    },
    _lastQueryHash: null,
};

// ============================================================
// STORE IMPLEMENTATION
// ============================================================

export const useAssignmentStore = create<AssignmentState>()(
    devtools(
        persist(
            immer((set, get) => ({
                ...initialState,

                // ============================================================
                // ASSIGNMENT ACTIONS
                // ============================================================

                createAssignment: async (input: CreateAssignmentDTO) => {
                    set((state) => {
                        state.loading.create = true;
                        state.error = null;
                        state.successMessage = null;
                    });

                    const result = await assignmentService.createAssignment(input);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.create = false;
                            state.successMessage = 'Assignment created successfully';
                            state.assignments.unshift(result.data!);
                            state.currentAssignment = result.data!;
                            // Invalidate cache
                            state._cacheMetadata.lastListFetch = null;
                        });
                        return true;
                    } else {
                        set((state) => {
                            state.loading.create = false;
                            state.error = result.error || 'Failed to create assignment';
                        });
                        return false;
                    }
                },

                updateAssignment: async (input: UpdateAssignmentDTO) => {
                    set((state) => {
                        state.loading.update = true;
                        state.error = null;
                        state.successMessage = null;
                    });

                    const result = await assignmentService.updateAssignment(input);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.update = false;
                            state.successMessage = 'Assignment updated successfully';
                            // Update in list
                            const index = state.assignments.findIndex(a => a.id === input.id);
                            if (index !== -1) {
                                state.assignments[index] = result.data!;
                            }
                            // Update current if same
                            if (state.currentAssignment?.id === input.id) {
                                state.currentAssignment = result.data!;
                            }
                        });
                        return true;
                    } else {
                        set((state) => {
                            state.loading.update = false;
                            state.error = result.error || 'Failed to update assignment';
                        });
                        return false;
                    }
                },

                publishAssignment: async (input: PublishAssignmentDTO) => {
                    set((state) => {
                        state.loading.publish = true;
                        state.error = null;
                    });

                    const result = await assignmentService.publishAssignment(input);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.publish = false;
                            state.successMessage = 'Assignment published successfully';
                            // Update in list
                            const index = state.assignments.findIndex(a => a.id === input.id);
                            if (index !== -1) {
                                state.assignments[index] = result.data!;
                            }
                            if (state.currentAssignment?.id === input.id) {
                                state.currentAssignment = result.data!;
                            }
                        });
                        return true;
                    } else {
                        set((state) => {
                            state.loading.publish = false;
                            state.error = result.error || 'Failed to publish assignment';
                        });
                        return false;
                    }
                },

                closeAssignment: async (input: CloseAssignmentDTO) => {
                    set((state) => {
                        state.loading.update = true;
                        state.error = null;
                    });

                    const result = await assignmentService.closeAssignment(input);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.update = false;
                            state.successMessage = 'Assignment closed successfully';
                            const index = state.assignments.findIndex(a => a.id === input.id);
                            if (index !== -1) {
                                state.assignments[index] = result.data!;
                            }
                            if (state.currentAssignment?.id === input.id) {
                                state.currentAssignment = result.data!;
                            }
                        });
                        return true;
                    } else {
                        set((state) => {
                            state.loading.update = false;
                            state.error = result.error || 'Failed to close assignment';
                        });
                        return false;
                    }
                },

                deleteAssignment: async (assignmentId: string) => {
                    set((state) => {
                        state.loading.delete = true;
                        state.error = null;
                    });

                    const result = await assignmentService.deleteAssignment(assignmentId);

                    if (result.success) {
                        set((state) => {
                            state.loading.delete = false;
                            state.successMessage = 'Assignment deleted successfully';
                            state.assignments = state.assignments.filter(a => a.id !== assignmentId);
                            if (state.currentAssignment?.id === assignmentId) {
                                state.currentAssignment = null;
                            }
                            state.isDeleteDialogOpen = false;
                            state.assignmentToDelete = null;
                        });
                        return true;
                    } else {
                        set((state) => {
                            state.loading.delete = false;
                            state.error = result.error || 'Failed to delete assignment';
                        });
                        return false;
                    }
                },

                fetchAssignments: async (params?: AssignmentListParams, forceRefresh = false) => {
                    const state = get();
                    const queryHash = generateQueryHash({ ...state.filters, ...state.sort, ...params });

                    // Check cache
                    if (!forceRefresh &&
                        state._lastQueryHash === queryHash &&
                        isCacheValid(state._cacheMetadata.lastListFetch, CACHE_DURATION.LIST)) {
                        return;
                    }

                    set((s) => {
                        s.loading.list = true;
                        s.error = null;
                    });

                    const result = await assignmentService.listAssignments({
                        ...state.filters,
                        ...state.sort,
                        page: state.pagination.page,
                        limit: state.pagination.limit,
                        ...params,
                    });

                    if (result.success && result.data) {
                        set((s) => {
                            s.loading.list = false;
                            s.assignments = result.data!.data;
                            s.pagination = {
                                page: result.data!.page,
                                limit: result.data!.limit,
                                total: result.data!.total,
                                has_more: result.data!.has_more,
                            };
                            s._cacheMetadata.lastListFetch = Date.now();
                            s._lastQueryHash = queryHash;
                        });
                    } else {
                        set((s) => {
                            s.loading.list = false;
                            s.error = result.error || 'Failed to fetch assignments';
                        });
                    }
                },

                fetchAssignmentById: async (assignmentId: string, forceRefresh = false) => {
                    const state = get();

                    // Check cache
                    if (!forceRefresh &&
                        isCacheValid(state._cacheMetadata.lastAssignmentFetch[assignmentId], CACHE_DURATION.SINGLE)) {
                        const cached = state.assignments.find(a => a.id === assignmentId);
                        if (cached) {
                            set((s) => { s.currentAssignment = cached; });
                            return;
                        }
                    }

                    set((s) => {
                        s.loading.list = true;
                        s.error = null;
                    });

                    const result = await assignmentService.getAssignmentById(assignmentId);

                    if (result.success && result.data) {
                        set((s) => {
                            s.loading.list = false;
                            s.currentAssignment = result.data!;
                            s._cacheMetadata.lastAssignmentFetch[assignmentId] = Date.now();
                        });
                    } else {
                        set((s) => {
                            s.loading.list = false;
                            s.error = result.error || 'Failed to fetch assignment';
                        });
                    }
                },

                // ============================================================
                // SUBMISSION ACTIONS
                // ============================================================

                submitAssignment: async (input: SubmitAssignmentDTO) => {
                    set((state) => {
                        state.loading.create = true;
                        state.error = null;
                    });

                    const result = await assignmentService.submitAssignment(input);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.create = false;
                            state.successMessage = input.is_final
                                ? 'Assignment submitted successfully'
                                : 'Draft saved successfully';
                            state.currentSubmission = result.data!;
                            // Invalidate submissions cache
                            state._cacheMetadata.lastSubmissionsFetch = {};
                        });
                        return true;
                    } else {
                        set((state) => {
                            state.loading.create = false;
                            state.error = result.error || 'Failed to submit assignment';
                        });
                        return false;
                    }
                },

                saveDraft: async (input: SaveDraftDTO) => {
                    set((state) => {
                        state.loading.create = true;
                        state.error = null;
                    });

                    const result = await assignmentService.saveDraft(input);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.create = false;
                            state.successMessage = 'Draft saved successfully';
                            state.currentSubmission = result.data!;
                        });
                        return true;
                    } else {
                        set((state) => {
                            state.loading.create = false;
                            state.error = result.error || 'Failed to save draft';
                        });
                        return false;
                    }
                },

                fetchStudentSubmission: async (assignmentId: string, studentId: string) => {
                    set((state) => {
                        state.loading.submissions = true;
                        state.error = null;
                    });

                    const result = await assignmentService.getStudentSubmission(assignmentId, studentId);

                    if (result.success) {
                        set((state) => {
                            state.loading.submissions = false;
                            state.currentSubmission = result.data || null;
                        });
                    } else {
                        set((state) => {
                            state.loading.submissions = false;
                            state.error = result.error || 'Failed to fetch submission';
                        });
                    }
                },

                fetchSubmissions: async (params?: SubmissionListParams, forceRefresh = false) => {
                    const state = get();
                    const cacheKey = params?.assignment_id || 'all';

                    if (!forceRefresh &&
                        isCacheValid(state._cacheMetadata.lastSubmissionsFetch[cacheKey], CACHE_DURATION.SUBMISSIONS)) {
                        return;
                    }

                    set((s) => {
                        s.loading.submissions = true;
                        s.error = null;
                    });

                    const result = await assignmentService.listSubmissions(params);

                    if (result.success && result.data) {
                        set((s) => {
                            s.loading.submissions = false;
                            s.submissions = result.data!.data;
                            s._cacheMetadata.lastSubmissionsFetch[cacheKey] = Date.now();
                        });
                    } else {
                        set((s) => {
                            s.loading.submissions = false;
                            s.error = result.error || 'Failed to fetch submissions';
                        });
                    }
                },

                fetchSubmissionsForGrading: async (assignmentId: string, forceRefresh = false) => {
                    const state = get();

                    if (!forceRefresh &&
                        isCacheValid(state._cacheMetadata.lastSubmissionsFetch[`grading_${assignmentId}`], CACHE_DURATION.SUBMISSIONS)) {
                        return;
                    }

                    set((s) => {
                        s.loading.submissions = true;
                        s.error = null;
                    });

                    const result = await assignmentService.getSubmissionsForGrading(assignmentId);

                    if (result.success && result.data) {
                        set((s) => {
                            s.loading.submissions = false;
                            s.submissionsForGrading = result.data!;
                            s._cacheMetadata.lastSubmissionsFetch[`grading_${assignmentId}`] = Date.now();
                        });
                    } else {
                        set((s) => {
                            s.loading.submissions = false;
                            s.error = result.error || 'Failed to fetch submissions';
                        });
                    }
                },

                fetchStudentStatusList: async (assignmentId: string, classId: string) => {
                    set((state) => {
                        state.loading.submissions = true;
                        state.error = null;
                    });

                    const result = await assignmentService.getStudentSubmissionStatusList(assignmentId, classId);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.submissions = false;
                            state.studentStatusList = result.data!;
                        });
                    } else {
                        set((state) => {
                            state.loading.submissions = false;
                            state.error = result.error || 'Failed to fetch student status';
                        });
                    }
                },

                // ============================================================
                // GRADING ACTIONS
                // ============================================================

                gradeSubmission: async (input: GradeSubmissionDTO) => {
                    set((state) => {
                        state.loading.grade = true;
                        state.error = null;
                    });

                    const result = await assignmentService.gradeSubmission(input);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.grade = false;
                            state.successMessage = 'Submission graded successfully';
                            // Update in submissions for grading list
                            const index = state.submissionsForGrading.findIndex(
                                s => s.id === input.submission_id
                            );
                            if (index !== -1) {
                                state.submissionsForGrading[index].grading_status = GradingStatus.MANUAL_GRADED;
                                state.submissionsForGrading[index].score = result.data!.score;
                            }
                            state.isGradingDialogOpen = false;
                            state.submissionToGrade = null;
                            // Invalidate stats cache
                            state._cacheMetadata.lastStatsFetch = {};
                        });
                        return true;
                    } else {
                        set((state) => {
                            state.loading.grade = false;
                            state.error = result.error || 'Failed to grade submission';
                        });
                        return false;
                    }
                },

                updateGrade: async (input: UpdateGradeDTO) => {
                    set((state) => {
                        state.loading.grade = true;
                        state.error = null;
                    });

                    const result = await assignmentService.updateGrade(input);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.grade = false;
                            state.successMessage = 'Grade updated successfully';
                            // Update in list
                            const index = state.submissionsForGrading.findIndex(
                                s => s.id === input.submission_id
                            );
                            if (index !== -1 && result.data!.score !== null) {
                                state.submissionsForGrading[index].score = result.data!.score;
                            }
                        });
                        return true;
                    } else {
                        set((state) => {
                            state.loading.grade = false;
                            state.error = result.error || 'Failed to update grade';
                        });
                        return false;
                    }
                },

                requestRegrade: async (input: RegradeRequestDTO) => {
                    set((state) => {
                        state.loading.update = true;
                        state.error = null;
                    });

                    const result = await assignmentService.requestRegrade(input);

                    if (result.success) {
                        set((state) => {
                            state.loading.update = false;
                            state.successMessage = 'Regrade request submitted successfully';
                        });
                        return true;
                    } else {
                        set((state) => {
                            state.loading.update = false;
                            state.error = result.error || 'Failed to submit regrade request';
                        });
                        return false;
                    }
                },

                // ============================================================
                // STATISTICS ACTIONS
                // ============================================================

                fetchAssignmentStatistics: async (assignmentId: string, forceRefresh = false) => {
                    const state = get();

                    if (!forceRefresh &&
                        isCacheValid(state._cacheMetadata.lastStatsFetch[assignmentId], CACHE_DURATION.STATISTICS)) {
                        return;
                    }

                    set((s) => {
                        s.loading.statistics = true;
                        s.error = null;
                    });

                    const result = await assignmentService.getAssignmentStatistics(assignmentId);

                    if (result.success && result.data) {
                        set((s) => {
                            s.loading.statistics = false;
                            s.assignmentStatistics = result.data!;
                            s._cacheMetadata.lastStatsFetch[assignmentId] = Date.now();
                        });
                    } else {
                        set((s) => {
                            s.loading.statistics = false;
                            s.error = result.error || 'Failed to fetch statistics';
                        });
                    }
                },

                fetchStudentSummary: async (studentId: string, classId?: string) => {
                    set((state) => {
                        state.loading.statistics = true;
                        state.error = null;
                    });

                    const result = await assignmentService.getStudentSummary(studentId, classId);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.statistics = false;
                            state.studentSummary = result.data!;
                        });
                    } else {
                        set((state) => {
                            state.loading.statistics = false;
                            state.error = result.error || 'Failed to fetch student summary';
                        });
                    }
                },

                fetchClassReport: async (classId: string) => {
                    set((state) => {
                        state.loading.statistics = true;
                        state.error = null;
                    });

                    const result = await assignmentService.getClassReport(classId);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.statistics = false;
                            state.classReport = result.data!;
                        });
                    } else {
                        set((state) => {
                            state.loading.statistics = false;
                            state.error = result.error || 'Failed to fetch class report';
                        });
                    }
                },

                // ============================================================
                // FILE ACTIONS
                // ============================================================

                uploadFile: async (input: UploadFileDTO) => {
                    set((state) => {
                        state.loading.upload = true;
                        state.error = null;
                    });

                    const result = await assignmentService.uploadFile(input);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.upload = false;
                            state.successMessage = 'File uploaded successfully';
                        });
                        return result.data;
                    } else {
                        set((state) => {
                            state.loading.upload = false;
                            state.error = result.error || 'Failed to upload file';
                        });
                        return null;
                    }
                },

                deleteFile: async (fileId: string, userId: string) => {
                    set((state) => {
                        state.loading.delete = true;
                        state.error = null;
                    });

                    const result = await assignmentService.deleteFile(fileId, userId);

                    if (result.success) {
                        set((state) => {
                            state.loading.delete = false;
                            state.successMessage = 'File deleted successfully';
                        });
                        return true;
                    } else {
                        set((state) => {
                            state.loading.delete = false;
                            state.error = result.error || 'Failed to delete file';
                        });
                        return false;
                    }
                },

                attachFileToAssignment: async (assignmentId: string, fileId: string, type: 'instruction' | 'attachment') => {
                    set((state) => {
                        state.loading.update = true;
                        state.error = null;
                    });

                    const result = await assignmentService.attachFileToAssignment(assignmentId, fileId, type);

                    if (result.success && result.data) {
                        set((state) => {
                            state.loading.update = false;
                            state.successMessage = 'File attached successfully';
                            if (state.currentAssignment?.id === assignmentId) {
                                state.currentAssignment = result.data!;
                            }
                        });
                        return true;
                    } else {
                        set((state) => {
                            state.loading.update = false;
                            state.error = result.error || 'Failed to attach file';
                        });
                        return false;
                    }
                },

                // ============================================================
                // STATE MANAGEMENT ACTIONS
                // ============================================================

                setCurrentAssignment: (assignment: Assignment | null) => {
                    set((state) => {
                        state.currentAssignment = assignment;
                    });
                },

                setCurrentSubmission: (submission: AssignmentSubmission | null) => {
                    set((state) => {
                        state.currentSubmission = submission;
                    });
                },

                openDeleteDialog: (assignment: Assignment) => {
                    set((state) => {
                        state.assignmentToDelete = assignment;
                        state.isDeleteDialogOpen = true;
                    });
                },

                closeDeleteDialog: () => {
                    set((state) => {
                        state.assignmentToDelete = null;
                        state.isDeleteDialogOpen = false;
                    });
                },

                openGradingDialog: (submission: SubmissionForGrading) => {
                    set((state) => {
                        state.submissionToGrade = submission;
                        state.isGradingDialogOpen = true;
                    });
                },

                closeGradingDialog: () => {
                    set((state) => {
                        state.submissionToGrade = null;
                        state.isGradingDialogOpen = false;
                    });
                },

                setFilters: (filters: Partial<AssignmentFilters>) => {
                    set((state) => {
                        state.filters = { ...state.filters, ...filters };
                        state.pagination.page = 1;
                        state._cacheMetadata.lastListFetch = null;
                    });
                },

                resetFilters: () => {
                    set((state) => {
                        state.filters = {};
                        state.pagination.page = 1;
                        state._cacheMetadata.lastListFetch = null;
                    });
                },

                setPagination: (page: number, limit?: number) => {
                    set((state) => {
                        state.pagination.page = page;
                        if (limit) state.pagination.limit = limit;
                    });
                },

                setSort: (sortBy: 'due_date' | 'created_at' | 'title', sortOrder: 'asc' | 'desc') => {
                    set((state) => {
                        state.sort = { sort_by: sortBy, sort_order: sortOrder };
                        state._cacheMetadata.lastListFetch = null;
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
                            lastSubmissionsFetch: {},
                            lastStatsFetch: {},
                            lastAssignmentFetch: {},
                        };
                        state._lastQueryHash = null;
                    });
                },

                reset: () => {
                    set(() => ({ ...initialState }));
                },

                // ============================================================
                // SELECTORS
                // ============================================================

                getAssignmentsByStatus: (status: AssignmentStatus) => {
                    return get().assignments.filter(a => a.status === status);
                },

                getUpcomingAssignments: () => {
                    const now = new Date().toISOString();
                    return get().assignments.filter(
                        a => a.status === 'PUBLISHED' && a.due_date > now
                    );
                },

                getOverdueAssignments: () => {
                    const now = new Date().toISOString();
                    return get().assignments.filter(
                        a => a.status === 'PUBLISHED' && a.due_date < now
                    );
                },

                getUngradedCount: () => {
                    return get().submissionsForGrading.filter(
                        s => s.grading_status === 'NOT_GRADED'
                    ).length;
                },

                isAnyLoading: () => {
                    const loading = get().loading;
                    return Object.values(loading).some(Boolean);
                },

                _isCacheValid: (key: string, duration: number) => {
                    const metadata = get()._cacheMetadata;
                    const timestamp = metadata.lastListFetch;
                    return isCacheValid(timestamp, duration);
                },
            })),
            {
                name: 'assignment-store',
                partialize: (state) => ({
                    filters: state.filters,
                    pagination: state.pagination,
                    sort: state.sort,
                }),
            }
        ),
        {
            name: 'assignment-store',
        }
    )
);

// ============================================================
// SELECTOR HOOKS
// ============================================================

export const useAssignments = () => useAssignmentStore((state) => state.assignments);
export const useSubmissions = () => useAssignmentStore((state) => state.submissions);
export const useCurrentAssignment = () => useAssignmentStore((state) => state.currentAssignment);
export const useCurrentSubmission = () => useAssignmentStore((state) => state.currentSubmission);
export const useSubmissionsForGrading = () => useAssignmentStore((state) => state.submissionsForGrading);
export const useStudentStatusList = () => useAssignmentStore((state) => state.studentStatusList);
export const useAssignmentStatistics = () => useAssignmentStore((state) => state.assignmentStatistics);
export const useStudentAssignmentSummary = () => useAssignmentStore((state) => state.studentSummary);
export const useClassAssignmentReport = () => useAssignmentStore((state) => state.classReport);
export const useAssignmentToDelete = () => useAssignmentStore((state) => state.assignmentToDelete);
export const useIsDeleteDialogOpen = () => useAssignmentStore((state) => state.isDeleteDialogOpen);
export const useSubmissionToGrade = () => useAssignmentStore((state) => state.submissionToGrade);
export const useIsGradingDialogOpen = () => useAssignmentStore((state) => state.isGradingDialogOpen);
export const useAssignmentFilters = () => useAssignmentStore((state) => state.filters);
export const useAssignmentPagination = () => useAssignmentStore((state) => state.pagination);
export const useAssignmentSort = () => useAssignmentStore((state) => state.sort);
export const useAssignmentLoading = () => useAssignmentStore((state) => state.loading);
export const useAssignmentError = () => useAssignmentStore((state) => state.error);
export const useAssignmentSuccessMessage = () => useAssignmentStore((state) => state.successMessage);

// ============================================================
// ACTION HOOKS
// ============================================================

export const useCreateAssignment = () => useAssignmentStore((state) => state.createAssignment);
export const useUpdateAssignment = () => useAssignmentStore((state) => state.updateAssignment);
export const usePublishAssignment = () => useAssignmentStore((state) => state.publishAssignment);
export const useCloseAssignment = () => useAssignmentStore((state) => state.closeAssignment);
export const useDeleteAssignment = () => useAssignmentStore((state) => state.deleteAssignment);
export const useFetchAssignments = () => useAssignmentStore((state) => state.fetchAssignments);
export const useFetchAssignmentById = () => useAssignmentStore((state) => state.fetchAssignmentById);
export const useSubmitAssignment = () => useAssignmentStore((state) => state.submitAssignment);
export const useSaveDraft = () => useAssignmentStore((state) => state.saveDraft);
export const useFetchStudentSubmission = () => useAssignmentStore((state) => state.fetchStudentSubmission);
export const useFetchSubmissions = () => useAssignmentStore((state) => state.fetchSubmissions);
export const useFetchSubmissionsForGrading = () => useAssignmentStore((state) => state.fetchSubmissionsForGrading);
export const useFetchStudentStatusList = () => useAssignmentStore((state) => state.fetchStudentStatusList);
export const useGradeSubmission = () => useAssignmentStore((state) => state.gradeSubmission);
export const useUpdateGrade = () => useAssignmentStore((state) => state.updateGrade);
export const useRequestRegrade = () => useAssignmentStore((state) => state.requestRegrade);
export const useFetchAssignmentStatistics = () => useAssignmentStore((state) => state.fetchAssignmentStatistics);
export const useFetchStudentSummary = () => useAssignmentStore((state) => state.fetchStudentSummary);
export const useFetchClassReport = () => useAssignmentStore((state) => state.fetchClassReport);
export const useUploadFile = () => useAssignmentStore((state) => state.uploadFile);
export const useDeleteFile = () => useAssignmentStore((state) => state.deleteFile);
export const useAttachFileToAssignment = () => useAssignmentStore((state) => state.attachFileToAssignment);
export const useSetCurrentAssignment = () => useAssignmentStore((state) => state.setCurrentAssignment);
export const useSetCurrentSubmission = () => useAssignmentStore((state) => state.setCurrentSubmission);
export const useOpenDeleteDialog = () => useAssignmentStore((state) => state.openDeleteDialog);
export const useCloseDeleteDialog = () => useAssignmentStore((state) => state.closeDeleteDialog);
export const useOpenGradingDialog = () => useAssignmentStore((state) => state.openGradingDialog);
export const useCloseGradingDialog = () => useAssignmentStore((state) => state.closeGradingDialog);
export const useSetAssignmentFilters = () => useAssignmentStore((state) => state.setFilters);
export const useResetAssignmentFilters = () => useAssignmentStore((state) => state.resetFilters);
export const useSetAssignmentPagination = () => useAssignmentStore((state) => state.setPagination);
export const useSetAssignmentSort = () => useAssignmentStore((state) => state.setSort);
export const useClearAssignmentError = () => useAssignmentStore((state) => state.clearError);
export const useClearAssignmentSuccessMessage = () => useAssignmentStore((state) => state.clearSuccessMessage);
export const useInvalidateAssignmentCache = () => useAssignmentStore((state) => state.invalidateCache);
export const useResetAssignmentStore = () => useAssignmentStore((state) => state.reset);

// ============================================================
// COMBINED ACTIONS HOOK
// ============================================================

export const useAssignmentActions = () => {
    return useAssignmentStore((state) => ({
        // Assignment CRUD
        createAssignment: state.createAssignment,
        updateAssignment: state.updateAssignment,
        publishAssignment: state.publishAssignment,
        closeAssignment: state.closeAssignment,
        deleteAssignment: state.deleteAssignment,
        fetchAssignments: state.fetchAssignments,
        fetchAssignmentById: state.fetchAssignmentById,
        // Submissions
        submitAssignment: state.submitAssignment,
        saveDraft: state.saveDraft,
        fetchStudentSubmission: state.fetchStudentSubmission,
        fetchSubmissions: state.fetchSubmissions,
        fetchSubmissionsForGrading: state.fetchSubmissionsForGrading,
        fetchStudentStatusList: state.fetchStudentStatusList,
        // Grading
        gradeSubmission: state.gradeSubmission,
        updateGrade: state.updateGrade,
        requestRegrade: state.requestRegrade,
        // Statistics
        fetchAssignmentStatistics: state.fetchAssignmentStatistics,
        fetchStudentSummary: state.fetchStudentSummary,
        fetchClassReport: state.fetchClassReport,
        // Files
        uploadFile: state.uploadFile,
        deleteFile: state.deleteFile,
        attachFileToAssignment: state.attachFileToAssignment,
        // State management
        setCurrentAssignment: state.setCurrentAssignment,
        setCurrentSubmission: state.setCurrentSubmission,
        openDeleteDialog: state.openDeleteDialog,
        closeDeleteDialog: state.closeDeleteDialog,
        openGradingDialog: state.openGradingDialog,
        closeGradingDialog: state.closeGradingDialog,
        setFilters: state.setFilters,
        resetFilters: state.resetFilters,
        setPagination: state.setPagination,
        setSort: state.setSort,
        clearError: state.clearError,
        clearSuccessMessage: state.clearSuccessMessage,
        invalidateCache: state.invalidateCache,
        reset: state.reset,
        // Selectors
        getAssignmentsByStatus: state.getAssignmentsByStatus,
        getUpcomingAssignments: state.getUpcomingAssignments,
        getOverdueAssignments: state.getOverdueAssignments,
        getUngradedCount: state.getUngradedCount,
        isAnyLoading: state.isAnyLoading,
    }));
};
