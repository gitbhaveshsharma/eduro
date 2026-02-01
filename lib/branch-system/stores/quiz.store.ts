/**
 * Quiz Store
 * 
 * Zustand store for managing quiz state in React components.
 * Provides reactive state management with caching, optimistic updates,
 * and integration with the quiz service layer.
 * 
 * @module branch-system/stores/quiz
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
    Quiz,
    QuizQuestion,
    QuizAttempt,
    QuizResponse,
    CreateQuizDTO,
    UpdateQuizDTO,
    CreateQuestionDTO,
    UpdateQuestionDTO,
    BulkCreateQuestionsDTO,
    ReorderQuestionsDTO,
    StartAttemptDTO,
    SubmitAttemptDTO,
    SaveResponseDTO,
    QuizFilters,
    QuizListParams,
    QuizStatistics,
    QuestionStatistics,
    StudentQuizSummary,
    ClassQuizReport,
    AttemptForTeacher,
    StudentAttemptStatusItem,
    QuizAttemptResult,
    LeaderboardEntry,
    AttemptStatus,
} from '../types/quiz.types';
import { quizService } from '../services/quiz.service';

// ============================================================
// STATE TYPES
// ============================================================

/**
 * Quiz Filter State
 */
export interface QuizFilterState extends QuizFilters {
    search: string;
    sort_by: string;
    sort_order: 'asc' | 'desc';
}

/**
 * Pagination State
 */
export interface PaginationState {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
}

/**
 * Active Quiz Attempt State
 */
export interface ActiveAttemptState {
    attempt: QuizAttempt;
    quiz: Quiz;
    questions: QuizQuestion[];
    responses: Map<string, QuizResponse>;
    currentQuestionIndex: number;
    timeRemaining: number | null;
}

/**
 * Cache Entry with timestamp
 */
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

/**
 * Loading States
 */
export interface LoadingStates {
    quizzes: boolean;
    quiz: boolean;
    questions: boolean;
    attempts: boolean;
    attempt: boolean;
    statistics: boolean;
    saving: boolean;
    submitting: boolean;
}

/**
 * Error State
 */
export interface ErrorState {
    message: string | null;
    field?: string;
    timestamp: number;
}

/**
 * Quiz Store State
 */
export interface QuizStoreState {
    // ============================================================
    // QUIZ STATE
    // ============================================================
    quizzes: Quiz[];
    selectedQuiz: Quiz | null;
    filters: QuizFilterState;
    pagination: PaginationState;

    // ============================================================
    // QUESTION STATE
    // ============================================================
    questions: QuizQuestion[];
    editingQuestion: QuizQuestion | null;

    // ============================================================
    // ATTEMPT STATE
    // ============================================================
    attempts: QuizAttempt[];
    studentAttempts: QuizAttempt[];
    activeAttempt: ActiveAttemptState | null;
    lastAttemptResult: QuizAttemptResult | null;

    // ============================================================
    // STATISTICS STATE
    // ============================================================
    quizStatistics: QuizStatistics | null;
    questionStatistics: QuestionStatistics[];
    studentSummary: StudentQuizSummary | null;
    classReport: ClassQuizReport | null;
    leaderboard: LeaderboardEntry[];
    teacherAttempts: AttemptForTeacher[];
    studentStatusList: StudentAttemptStatusItem[];

    // ============================================================
    // UI STATE
    // ============================================================
    loading: LoadingStates;
    error: ErrorState;

    // ============================================================
    // CACHE
    // ============================================================
    cache: {
        quizzes: CacheEntry<Quiz[]> | null;
        quizById: Map<string, CacheEntry<Quiz>>;
        questionsByQuiz: Map<string, CacheEntry<QuizQuestion[]>>;
        attemptsByQuiz: Map<string, CacheEntry<QuizAttempt[]>>;
        statisticsByQuiz: Map<string, CacheEntry<QuizStatistics>>;
    };
}

/**
 * Quiz Store Actions
 */
export interface QuizStoreActions {
    // ============================================================
    // QUIZ ACTIONS
    // ============================================================
    fetchQuizzes: (params?: QuizListParams) => Promise<void>;
    fetchQuizById: (quizId: string, includeQuestions?: boolean) => Promise<void>;
    createQuiz: (input: CreateQuizDTO) => Promise<Quiz | null>;
    updateQuiz: (input: UpdateQuizDTO) => Promise<Quiz | null>;
    toggleQuizActive: (quizId: string, isActive: boolean) => Promise<Quiz | null>;
    deleteQuiz: (quizId: string) => Promise<boolean>;
    selectQuiz: (quiz: Quiz | null) => void;
    setFilters: (filters: Partial<QuizFilterState>) => void;
    resetFilters: () => void;
    setPage: (page: number) => void;

    // ============================================================
    // QUESTION ACTIONS
    // ============================================================
    fetchQuestions: (quizId: string) => Promise<void>;
    createQuestion: (input: CreateQuestionDTO) => Promise<QuizQuestion | null>;
    updateQuestion: (input: UpdateQuestionDTO) => Promise<QuizQuestion | null>;
    deleteQuestion: (questionId: string) => Promise<boolean>;
    bulkCreateQuestions: (input: BulkCreateQuestionsDTO) => Promise<QuizQuestion[] | null>;
    reorderQuestions: (input: ReorderQuestionsDTO) => Promise<boolean>;
    setEditingQuestion: (question: QuizQuestion | null) => void;

    // ============================================================
    // ATTEMPT ACTIONS
    // ============================================================
    startAttempt: (input: StartAttemptDTO) => Promise<boolean>;
    /** Start attempt with secure mode (one question at a time) */
    startSecureAttempt: (input: StartAttemptDTO) => Promise<boolean>;
    /** Fetch single question by ID for secure mode */
    fetchSecureQuestion: (attemptId: string, questionId: string) => Promise<QuizQuestion | null>;
    /** Get question metadata (IDs only) for navigation */
    fetchQuestionMetadata: (attemptId: string) => Promise<string[] | null>;
    submitAttempt: (input: SubmitAttemptDTO) => Promise<QuizAttemptResult | null>;
    saveResponse: (input: SaveResponseDTO) => Promise<boolean>;
    abandonAttempt: (attemptId: string) => Promise<boolean>;
    fetchStudentAttempts: (quizId: string, studentId: string) => Promise<void>;
    fetchStudentAttemptsForQuizzes: (quizIds: string[], studentId: string) => Promise<void>;
    fetchAttemptDetails: (attemptId: string) => Promise<QuizAttempt | null>;
    getAttemptsByQuizId: (quizId: string, studentId: string) => QuizAttempt[];
    setCurrentQuestion: (index: number) => void;
    updateTimeRemaining: (seconds: number | null) => void;
    recordResponse: (questionId: string, selectedAnswers: string[]) => void;
    clearActiveAttempt: () => void;

    // ============================================================
    // STATISTICS ACTIONS
    // ============================================================
    fetchQuizStatistics: (quizId: string) => Promise<void>;
    fetchQuestionStatistics: (quizId: string) => Promise<void>;
    fetchStudentSummary: (studentId: string, classId?: string) => Promise<void>;
    fetchClassReport: (classId: string) => Promise<void>;
    fetchLeaderboard: (quizId: string, limit?: number) => Promise<void>;
    fetchTeacherAttempts: (quizId: string) => Promise<void>;
    fetchStudentStatusList: (quizId: string, classId: string) => Promise<void>;

    // ============================================================
    // UTILITY ACTIONS
    // ============================================================
    clearError: () => void;
    setError: (message: string, field?: string) => void;
    clearCache: () => void;
    isCacheValid: (cacheKey: string, maxAge?: number) => boolean;
    reset: () => void;
}

// ============================================================
// INITIAL STATE
// ============================================================

const defaultFilters: QuizFilterState = {
    search: '',
    sort_by: 'available_from',
    sort_order: 'desc',
};

const defaultPagination: PaginationState = {
    page: 1,
    limit: 20,
    total: 0,
    has_more: false,
};

const defaultLoading: LoadingStates = {
    quizzes: false,
    quiz: false,
    questions: false,
    attempts: false,
    attempt: false,
    statistics: false,
    saving: false,
    submitting: false,
};

const initialState: QuizStoreState = {
    quizzes: [],
    selectedQuiz: null,
    filters: { ...defaultFilters },
    pagination: { ...defaultPagination },
    questions: [],
    editingQuestion: null,
    attempts: [],
    studentAttempts: [],
    activeAttempt: null,
    lastAttemptResult: null,
    quizStatistics: null,
    questionStatistics: [],
    studentSummary: null,
    classReport: null,
    leaderboard: [],
    teacherAttempts: [],
    studentStatusList: [],
    loading: { ...defaultLoading },
    error: { message: null, timestamp: 0 },
    cache: {
        quizzes: null,
        quizById: new Map(),
        questionsByQuiz: new Map(),
        attemptsByQuiz: new Map(),
        statisticsByQuiz: new Map(),
    },
};

// ============================================================
// CONSTANTS
// ============================================================

const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes
const STORE_NAME = 'quiz-store';

// ============================================================
// STORE CREATION
// ============================================================

export const useQuizStore = create<QuizStoreState & QuizStoreActions>()(
    devtools(
        persist(
            immer((set, get) => ({
                ...initialState,

                // ============================================================
                // QUIZ ACTIONS
                // ============================================================

                fetchQuizzes: async (params?: QuizListParams) => {
                    set((state) => {
                        state.loading.quizzes = true;
                        state.error.message = null;
                    });

                    const { filters, pagination } = get();
                    const mergedParams: QuizListParams = {
                        class_id: filters.class_id,
                        teacher_id: filters.teacher_id,
                        branch_id: filters.branch_id,
                        coaching_center_id: filters.coaching_center_id,
                        is_active: filters.is_active,
                        available_from: filters.available_from,
                        available_to: filters.available_to,
                        search: filters.search || undefined,
                        page: params?.page ?? pagination.page,
                        limit: params?.limit ?? pagination.limit,
                        sort_by: (filters.sort_by as 'available_from' | 'created_at' | 'title') || 'available_from',
                        sort_order: filters.sort_order,
                        ...params,
                    };

                    const result = await quizService.listQuizzes(mergedParams);

                    set((state) => {
                        state.loading.quizzes = false;
                        if (result.success && result.data) {
                            state.quizzes = result.data.data;
                            state.pagination = {
                                page: result.data.page,
                                limit: result.data.limit,
                                total: result.data.total,
                                has_more: result.data.has_more,
                            };
                            state.cache.quizzes = {
                                data: result.data.data,
                                timestamp: Date.now(),
                            };
                        } else {
                            state.error = {
                                message: result.error ?? 'Failed to fetch quizzes',
                                timestamp: Date.now(),
                            };
                        }
                    });
                },

                fetchQuizById: async (quizId: string, includeQuestions = false) => {
                    // Check cache first
                    const cached = get().cache.quizById.get(quizId);
                    if (cached && get().isCacheValid(quizId)) {
                        // If we need questions but cached quiz doesn't have them, fetch from API
                        if (includeQuestions && !cached.data.questions) {
                            console.log('[QuizStore] Cache hit but questions needed, fetching from API');
                            // Fall through to API fetch below
                        } else {
                            console.log('[QuizStore] Using cached quiz:', {
                                quizId,
                                hasQuestions: !!cached.data.questions,
                                questionsCount: cached.data.questions?.length || 0,
                            });
                            set((state) => {
                                state.selectedQuiz = cached.data;
                                if (cached.data.questions) {
                                    state.questions = cached.data.questions;
                                }
                            });
                            return;
                        }
                    }

                    console.log('[QuizStore] Fetching quiz from API:', {
                        quizId,
                        includeQuestions,
                    });

                    set((state) => {
                        state.loading.quiz = true;
                        state.error.message = null;
                    });

                    const result = await quizService.getQuizById(quizId, includeQuestions);

                    set((state) => {
                        state.loading.quiz = false;
                        if (result.success && result.data) {
                            state.selectedQuiz = result.data;
                            state.cache.quizById.set(quizId, {
                                data: result.data,
                                timestamp: Date.now(),
                            });
                            if (result.data.questions) {
                                state.questions = result.data.questions;
                            }
                        } else {
                            state.error = {
                                message: result.error ?? 'Failed to fetch quiz',
                                timestamp: Date.now(),
                            };
                        }
                    });
                },

                createQuiz: async (input: CreateQuizDTO) => {
                    set((state) => {
                        state.loading.saving = true;
                        state.error.message = null;
                    });

                    const result = await quizService.createQuiz(input);

                    set((state) => {
                        state.loading.saving = false;
                        if (result.success && result.data) {
                            state.quizzes = [result.data, ...state.quizzes];
                            state.selectedQuiz = result.data;
                            state.cache.quizzes = null; // Invalidate cache
                        } else {
                            state.error = {
                                message: result.error ?? 'Failed to create quiz',
                                timestamp: Date.now(),
                            };
                        }
                    });

                    return result.success ? result.data! : null;
                },

                updateQuiz: async (input: UpdateQuizDTO) => {
                    console.log('[QuizStore] updateQuiz called with input:', input);
                    set((state) => {
                        state.loading.saving = true;
                        state.error.message = null;
                    });

                    const result = await quizService.updateQuiz(input);
                    console.log('[QuizStore] updateQuiz result:', result);

                    set((state) => {
                        state.loading.saving = false;
                        if (result.success && result.data) {
                            console.log('[QuizStore] Update successful, updating state');
                            const index = state.quizzes.findIndex(q => q.id === input.id);
                            if (index !== -1) {
                                state.quizzes[index] = result.data;
                            }
                            if (state.selectedQuiz?.id === input.id) {
                                state.selectedQuiz = result.data;
                            }
                            state.cache.quizById.delete(input.id);
                        } else {
                            console.error('[QuizStore] Update failed:', result.error, result.validation_errors);
                            state.error = {
                                message: result.error ?? 'Failed to update quiz',
                                timestamp: Date.now(),
                            };
                        }
                    });

                    return result.success ? result.data! : null;
                },

                toggleQuizActive: async (quizId: string, isActive: boolean) => {
                    const result = await quizService.toggleQuizActive({ id: quizId, is_active: isActive });

                    if (result.success && result.data) {
                        set((state) => {
                            const index = state.quizzes.findIndex(q => q.id === quizId);
                            if (index !== -1) {
                                state.quizzes[index] = result.data!;
                            }
                            if (state.selectedQuiz?.id === quizId) {
                                state.selectedQuiz = result.data!;
                            }
                        });
                    }

                    return result.success ? result.data! : null;
                },

                deleteQuiz: async (quizId: string) => {
                    const result = await quizService.deleteQuiz(quizId);

                    if (result.success) {
                        set((state) => {
                            state.quizzes = state.quizzes.filter(q => q.id !== quizId);
                            if (state.selectedQuiz?.id === quizId) {
                                state.selectedQuiz = null;
                            }
                            state.cache.quizById.delete(quizId);
                            state.cache.questionsByQuiz.delete(quizId);
                        });
                    } else {
                        set((state) => {
                            state.error = {
                                message: result.error ?? 'Failed to delete quiz',
                                timestamp: Date.now(),
                            };
                        });
                    }

                    return result.success;
                },

                selectQuiz: (quiz: Quiz | null) => {
                    set((state) => {
                        state.selectedQuiz = quiz;
                        if (quiz) {
                            state.questions = quiz.questions ?? [];
                        }
                    });
                },

                setFilters: (filters: Partial<QuizFilterState>) => {
                    set((state) => {
                        state.filters = { ...state.filters, ...filters };
                        state.pagination.page = 1;
                    });
                },

                resetFilters: () => {
                    set((state) => {
                        state.filters = { ...defaultFilters };
                        state.pagination.page = 1;
                    });
                },

                setPage: (page: number) => {
                    set((state) => {
                        state.pagination.page = page;
                    });
                },

                // ============================================================
                // QUESTION ACTIONS
                // ============================================================

                fetchQuestions: async (quizId: string) => {
                    // Check cache first
                    const cached = get().cache.questionsByQuiz.get(quizId);
                    if (cached && Date.now() - cached.timestamp < CACHE_MAX_AGE) {
                        set((state) => {
                            state.questions = cached.data;
                        });
                        return;
                    }

                    set((state) => {
                        state.loading.questions = true;
                    });

                    const result = await quizService.getQuizQuestions(quizId);

                    set((state) => {
                        state.loading.questions = false;
                        if (result.success && result.data) {
                            state.questions = result.data;
                            state.cache.questionsByQuiz.set(quizId, {
                                data: result.data,
                                timestamp: Date.now(),
                            });
                        }
                    });
                },

                createQuestion: async (input: CreateQuestionDTO) => {
                    set((state) => {
                        state.loading.saving = true;
                        state.error.message = null;
                    });

                    const result = await quizService.createQuestion(input);

                    set((state) => {
                        state.loading.saving = false;
                        if (result.success && result.data) {
                            state.questions = [...state.questions, result.data];
                            state.cache.questionsByQuiz.delete(input.quiz_id);
                        } else {
                            state.error = {
                                message: result.error ?? 'Failed to create question',
                                timestamp: Date.now(),
                            };
                        }
                    });

                    return result.success ? result.data! : null;
                },

                updateQuestion: async (input: UpdateQuestionDTO) => {
                    set((state) => {
                        state.loading.saving = true;
                        state.error.message = null;
                    });

                    const result = await quizService.updateQuestion(input);

                    set((state) => {
                        state.loading.saving = false;
                        if (result.success && result.data) {
                            const index = state.questions.findIndex(q => q.id === input.id);
                            if (index !== -1) {
                                state.questions[index] = result.data;
                            }
                            if (state.editingQuestion?.id === input.id) {
                                state.editingQuestion = result.data;
                            }
                        } else {
                            state.error = {
                                message: result.error ?? 'Failed to update question',
                                timestamp: Date.now(),
                            };
                        }
                    });

                    return result.success ? result.data! : null;
                },

                deleteQuestion: async (questionId: string) => {
                    const question = get().questions.find(q => q.id === questionId);
                    const result = await quizService.deleteQuestion(questionId);

                    if (result.success) {
                        set((state) => {
                            state.questions = state.questions.filter(q => q.id !== questionId);
                            if (state.editingQuestion?.id === questionId) {
                                state.editingQuestion = null;
                            }
                            if (question) {
                                state.cache.questionsByQuiz.delete(question.quiz_id);
                            }
                        });
                    } else {
                        set((state) => {
                            state.error = {
                                message: result.error ?? 'Failed to delete question',
                                timestamp: Date.now(),
                            };
                        });
                    }

                    return result.success;
                },

                bulkCreateQuestions: async (input: BulkCreateQuestionsDTO) => {
                    set((state) => {
                        state.loading.saving = true;
                        state.error.message = null;
                    });

                    const result = await quizService.bulkCreateQuestions(input);

                    set((state) => {
                        state.loading.saving = false;
                        if (result.success && result.data) {
                            state.questions = [...state.questions, ...result.data];
                            state.cache.questionsByQuiz.delete(input.quiz_id);
                        } else {
                            state.error = {
                                message: result.error ?? 'Failed to create questions',
                                timestamp: Date.now(),
                            };
                        }
                    });

                    return result.success ? result.data! : null;
                },

                reorderQuestions: async (input: ReorderQuestionsDTO) => {
                    const result = await quizService.reorderQuestions(input);

                    if (result.success) {
                        // Update local order
                        set((state) => {
                            const orderMap = new Map(input.question_orders.map(o => [o.id, o.order]));
                            state.questions = state.questions
                                .map(q => ({
                                    ...q,
                                    question_order: orderMap.get(q.id) ?? q.question_order,
                                }))
                                .sort((a, b) => a.question_order - b.question_order);
                            state.cache.questionsByQuiz.delete(input.quiz_id);
                        });
                    }

                    return result.success;
                },

                setEditingQuestion: (question: QuizQuestion | null) => {
                    set((state) => {
                        state.editingQuestion = question;
                    });
                },

                // ============================================================
                // ATTEMPT ACTIONS
                // ============================================================

                startAttempt: async (input: StartAttemptDTO) => {
                    set((state) => {
                        state.loading.attempt = true;
                        state.error.message = null;
                    });

                    const result = await quizService.startAttempt(input);

                    if (result.success && result.data) {
                        const { attempt, questions } = result.data;

                        // Get quiz details
                        const quizResult = await quizService.getQuizById(input.quiz_id);
                        const quiz = quizResult.data;

                        if (quiz) {
                            const timeRemaining = quiz.time_limit_minutes
                                ? quiz.time_limit_minutes * 60
                                : null;

                            set((state) => {
                                state.loading.attempt = false;
                                state.activeAttempt = {
                                    attempt,
                                    quiz,
                                    questions,
                                    responses: new Map(),
                                    currentQuestionIndex: 0,
                                    timeRemaining,
                                };
                            });

                            return true;
                        }
                    }

                    set((state) => {
                        state.loading.attempt = false;
                        state.error = {
                            message: result.error ?? 'Failed to start quiz',
                            timestamp: Date.now(),
                        };
                    });

                    return false;
                },

                /**
                 * Start a secure attempt (one question at a time)
                 * Only fetches question IDs, not the full questions
                 */
                startSecureAttempt: async (input: StartAttemptDTO) => {
                    set((state) => {
                        state.loading.attempt = true;
                        state.error.message = null;
                    });

                    // Start the attempt (but we won't use the questions from this)
                    const result = await quizService.startAttempt(input);

                    if (result.success && result.data) {
                        const { attempt } = result.data;

                        // Get quiz details
                        const quizResult = await quizService.getQuizById(input.quiz_id);
                        const quiz = quizResult.data;

                        if (quiz) {
                            // Get question metadata (IDs only)
                            const metadataResult = await quizService.getQuestionMetadata(attempt.id);

                            if (metadataResult.success && metadataResult.data) {
                                const timeRemaining = quiz.time_limit_minutes
                                    ? quiz.time_limit_minutes * 60
                                    : null;

                                set((state) => {
                                    state.loading.attempt = false;
                                    state.activeAttempt = {
                                        attempt,
                                        quiz,
                                        questions: [], // Start empty - will fetch one at a time
                                        responses: new Map(),
                                        currentQuestionIndex: 0,
                                        timeRemaining,
                                    };
                                    // Store question IDs in a separate place for navigation
                                    (state as unknown as { secureQuestionIds: string[] }).secureQuestionIds = metadataResult.data!.questionIds;
                                });

                                return true;
                            }
                        }
                    }

                    set((state) => {
                        state.loading.attempt = false;
                        state.error = {
                            message: result.error ?? 'Failed to start quiz',
                            timestamp: Date.now(),
                        };
                    });

                    return false;
                },

                /**
                 * Fetch a single question by ID for secure mode
                 */
                fetchSecureQuestion: async (attemptId: string, questionId: string) => {
                    const result = await quizService.getQuestionById(attemptId, questionId);

                    if (result.success && result.data) {
                        // Update the current question in activeAttempt
                        set((state) => {
                            if (state.activeAttempt) {
                                // Check if question already exists
                                const existingIndex = state.activeAttempt.questions.findIndex(
                                    q => q.id === questionId
                                );
                                if (existingIndex === -1) {
                                    // Add new question
                                    state.activeAttempt.questions.push(result.data!);
                                } else {
                                    // Update existing
                                    state.activeAttempt.questions[existingIndex] = result.data!;
                                }
                            }
                        });

                        return result.data;
                    }

                    return null;
                },

                /**
                 * Get question metadata (IDs only) for navigation
                 */
                fetchQuestionMetadata: async (attemptId: string) => {
                    const result = await quizService.getQuestionMetadata(attemptId);

                    if (result.success && result.data) {
                        return result.data.questionIds;
                    }

                    return null;
                },

                submitAttempt: async (input: SubmitAttemptDTO) => {
                    set((state) => {
                        state.loading.submitting = true;
                        state.error.message = null;
                    });

                    const result = await quizService.submitAttempt(input);

                    set((state) => {
                        state.loading.submitting = false;
                        if (result.success && result.data) {
                            state.lastAttemptResult = result.data;
                            state.activeAttempt = null;
                        } else {
                            state.error = {
                                message: result.error ?? 'Failed to submit quiz',
                                timestamp: Date.now(),
                            };
                        }
                    });

                    return result.success ? result.data! : null;
                },

                saveResponse: async (input: SaveResponseDTO) => {
                    const result = await quizService.saveResponse(input);

                    if (result.success && result.data) {
                        set((state) => {
                            if (state.activeAttempt) {
                                state.activeAttempt.responses.set(input.question_id, result.data!);
                            }
                        });
                    } else if (result.error) {
                        console.error('[QuizStore] saveResponse failed:', result.error);
                        set((state) => {
                            state.error = {
                                message: result.error || 'Failed to save response',
                                timestamp: Date.now(),
                            };
                        });
                    }

                    return result.success;
                },

                abandonAttempt: async (attemptId: string) => {
                    const result = await quizService.abandonAttempt({ attempt_id: attemptId });

                    if (result.success) {
                        set((state) => {
                            if (state.activeAttempt?.attempt.id === attemptId) {
                                state.activeAttempt = null;
                            }
                        });
                    }

                    return result.success;
                },

                fetchStudentAttempts: async (quizId: string, studentId: string) => {
                    // Check cache first
                    const cacheKey = `${quizId}-${studentId}`;
                    const cached = get().cache.attemptsByQuiz.get(cacheKey);
                    if (cached && get().isCacheValid(cacheKey, 30000)) { // 30 second cache
                        set((state) => {
                            state.studentAttempts = cached.data;
                        });
                        return;
                    }

                    set((state) => {
                        state.loading.attempts = true;
                    });

                    const result = await quizService.getStudentAttempts(quizId, studentId);

                    set((state) => {
                        state.loading.attempts = false;
                        if (result.success && result.data) {
                            state.studentAttempts = result.data;
                            // Cache the result with quiz-student key
                            state.cache.attemptsByQuiz.set(cacheKey, {
                                data: result.data,
                                timestamp: Date.now(),
                            });
                        }
                    });
                },

                fetchStudentAttemptsForQuizzes: async (quizIds: string[], studentId: string) => {
                    if (quizIds.length === 0) return;

                    // Filter out quizzes that are already cached and valid
                    const quizzesToFetch = quizIds.filter(quizId => {
                        const cacheKey = `${quizId}-${studentId}`;
                        const cached = get().cache.attemptsByQuiz.get(cacheKey);
                        return !cached || !get().isCacheValid(cacheKey, 30000);
                    });

                    if (quizzesToFetch.length === 0) return;

                    set((state) => {
                        state.loading.attempts = true;
                    });

                    // Fetch attempts for all quizzes in parallel
                    const results = await Promise.allSettled(
                        quizzesToFetch.map(quizId =>
                            quizService.getStudentAttempts(quizId, studentId)
                        )
                    );

                    set((state) => {
                        state.loading.attempts = false;
                        results.forEach((result, index) => {
                            if (result.status === 'fulfilled' && result.value.success && result.value.data) {
                                const quizId = quizzesToFetch[index];
                                const cacheKey = `${quizId}-${studentId}`;
                                state.cache.attemptsByQuiz.set(cacheKey, {
                                    data: result.value.data,
                                    timestamp: Date.now(),
                                });
                            }
                        });
                    });
                },

                getAttemptsByQuizId: (quizId: string, studentId: string) => {
                    const cacheKey = `${quizId}-${studentId}`;
                    const cached = get().cache.attemptsByQuiz.get(cacheKey);
                    return cached?.data || [];
                },

                fetchAttemptDetails: async (attemptId: string) => {
                    set((state) => {
                        state.loading.attempt = true;
                    });

                    const result = await quizService.getAttemptDetails(attemptId);

                    set((state) => {
                        state.loading.attempt = false;
                        if (result.success && result.data) {
                            const index = state.attempts.findIndex(a => a.id === attemptId);
                            if (index !== -1) {
                                // Update existing attempt
                                state.attempts[index] = result.data;
                            } else {
                                // Add new attempt if not found
                                state.attempts.push(result.data);
                            }
                        }
                    });

                    return result.success && result.data ? result.data : null;
                },

                setCurrentQuestion: (index: number) => {
                    set((state) => {
                        if (state.activeAttempt) {
                            state.activeAttempt.currentQuestionIndex = index;
                        }
                    });
                },

                updateTimeRemaining: (seconds: number | null) => {
                    set((state) => {
                        if (state.activeAttempt) {
                            state.activeAttempt.timeRemaining = seconds;
                        }
                    });
                },

                recordResponse: (questionId: string, selectedAnswers: string[]) => {
                    set((state) => {
                        if (state.activeAttempt) {
                            const existingResponse = state.activeAttempt.responses.get(questionId);
                            state.activeAttempt.responses.set(questionId, {
                                ...existingResponse,
                                id: existingResponse?.id ?? '',
                                attempt_id: state.activeAttempt.attempt.id,
                                question_id: questionId,
                                selected_answers: selectedAnswers,
                                answer_text: null,
                                is_correct: null,
                                points_earned: existingResponse?.points_earned ?? 0,
                                points_deducted: existingResponse?.points_deducted ?? 0,
                                time_spent_seconds: existingResponse?.time_spent_seconds ?? 0,
                                question_started_at: existingResponse?.question_started_at ?? null,
                                question_answered_at: new Date().toISOString(),
                                is_detailed: false,
                                metadata: {},
                                created_at: existingResponse?.created_at ?? new Date().toISOString(),
                            });
                        }
                    });
                },

                clearActiveAttempt: () => {
                    set((state) => {
                        state.activeAttempt = null;
                    });
                },

                // ============================================================
                // STATISTICS ACTIONS
                // ============================================================

                fetchQuizStatistics: async (quizId: string) => {
                    // Check cache
                    const cached = get().cache.statisticsByQuiz.get(quizId);
                    if (cached && Date.now() - cached.timestamp < CACHE_MAX_AGE) {
                        set((state) => {
                            state.quizStatistics = cached.data;
                        });
                        return;
                    }

                    set((state) => {
                        state.loading.statistics = true;
                    });

                    const result = await quizService.getQuizStatistics(quizId);

                    set((state) => {
                        state.loading.statistics = false;
                        if (result.success && result.data) {
                            state.quizStatistics = result.data;
                            state.cache.statisticsByQuiz.set(quizId, {
                                data: result.data,
                                timestamp: Date.now(),
                            });
                        }
                    });
                },

                fetchQuestionStatistics: async (quizId: string) => {
                    set((state) => {
                        state.loading.statistics = true;
                    });

                    const result = await quizService.getQuestionStatistics(quizId);

                    set((state) => {
                        state.loading.statistics = false;
                        if (result.success && result.data) {
                            state.questionStatistics = result.data;
                        }
                    });
                },

                fetchStudentSummary: async (studentId: string, classId?: string) => {
                    set((state) => {
                        state.loading.statistics = true;
                    });

                    const result = await quizService.getStudentSummary(studentId, classId);

                    set((state) => {
                        state.loading.statistics = false;
                        if (result.success && result.data) {
                            state.studentSummary = result.data;
                        }
                    });
                },

                fetchClassReport: async (classId: string) => {
                    set((state) => {
                        state.loading.statistics = true;
                    });

                    const result = await quizService.getClassReport(classId);

                    set((state) => {
                        state.loading.statistics = false;
                        if (result.success && result.data) {
                            state.classReport = result.data;
                        }
                    });
                },

                fetchLeaderboard: async (quizId: string, limit?: number) => {
                    const result = await quizService.getLeaderboard(quizId, limit);

                    if (result.success && result.data) {
                        set((state) => {
                            state.leaderboard = result.data!;
                        });
                    }
                },

                fetchTeacherAttempts: async (quizId: string) => {
                    set((state) => {
                        state.loading.attempts = true;
                    });

                    const result = await quizService.getAttemptsForTeacher(quizId);

                    set((state) => {
                        state.loading.attempts = false;
                        if (result.success && result.data) {
                            state.teacherAttempts = result.data;
                        }
                    });
                },

                fetchStudentStatusList: async (quizId: string, classId: string) => {
                    set((state) => {
                        state.loading.attempts = true;
                    });

                    const result = await quizService.getStudentAttemptStatusList(quizId, classId);

                    set((state) => {
                        state.loading.attempts = false;
                        if (result.success && result.data) {
                            state.studentStatusList = result.data;
                        }
                    });
                },

                // ============================================================
                // UTILITY ACTIONS
                // ============================================================

                clearError: () => {
                    set((state) => {
                        state.error = { message: null, timestamp: 0 };
                    });
                },

                setError: (message: string, field?: string) => {
                    set((state) => {
                        state.error = { message, field, timestamp: Date.now() };
                    });
                },

                clearCache: () => {
                    set((state) => {
                        state.cache = {
                            quizzes: null,
                            quizById: new Map(),
                            questionsByQuiz: new Map(),
                            attemptsByQuiz: new Map(),
                            statisticsByQuiz: new Map(),
                        };
                    });
                },

                isCacheValid: (cacheKey: string, maxAge = CACHE_MAX_AGE) => {
                    const cache = get().cache.quizById.get(cacheKey);
                    if (!cache) return false;
                    return Date.now() - cache.timestamp < maxAge;
                },

                reset: () => {
                    set((state) => {
                        Object.assign(state, initialState);
                    });
                },
            })),
            {
                name: STORE_NAME,
                partialize: (state) => ({
                    filters: state.filters,
                    pagination: { ...state.pagination, total: 0, has_more: false },
                }),
            }
        ),
        { name: STORE_NAME }
    )
);

// ============================================================
// SELECTORS
// ============================================================

/**
 * Gets quiz by ID from local state
 */
export const selectQuizById = (quizId: string) => (state: QuizStoreState) =>
    state.quizzes.find((q) => q.id === quizId);

/**
 * Gets filtered quizzes
 */
export const selectFilteredQuizzes = (state: QuizStoreState) => {
    let filtered = [...state.quizzes];

    if (state.filters.search) {
        const search = state.filters.search.toLowerCase();
        filtered = filtered.filter((q) =>
            q.title.toLowerCase().includes(search) ||
            q.description?.toLowerCase().includes(search)
        );
    }

    if (state.filters.is_active !== undefined) {
        filtered = filtered.filter((q) => q.is_active === state.filters.is_active);
    }

    return filtered;
};

/**
 * Gets active quizzes only
 */
export const selectActiveQuizzes = (state: QuizStoreState) =>
    state.quizzes.filter((q) => q.is_active);

/**
 * Gets quizzes for a specific class
 */
export const selectQuizzesByClass = (classId: string) => (state: QuizStoreState) =>
    state.quizzes.filter((q) => q.class_id === classId);

/**
 * Gets currently available quizzes (within date range)
 */
export const selectAvailableQuizzes = (state: QuizStoreState) => {
    const now = new Date();
    return state.quizzes.filter((q) => {
        if (!q.is_active) return false;
        const from = new Date(q.available_from);
        const to = new Date(q.available_to);
        return now >= from && now <= to;
    });
};

/**
 * Gets questions sorted by order
 */
export const selectSortedQuestions = (state: QuizStoreState) =>
    [...state.questions].sort((a, b) => a.question_order - b.question_order);

/**
 * Gets question by ID
 */
export const selectQuestionById = (questionId: string) => (state: QuizStoreState) =>
    state.questions.find((q) => q.id === questionId);

/**
 * Gets completed attempts
 */
export const selectCompletedAttempts = (state: QuizStoreState) =>
    state.studentAttempts.filter((a) => a.attempt_status === 'COMPLETED');

/**
 * Gets current question in active attempt
 */
export const selectCurrentQuestion = (state: QuizStoreState) => {
    if (!state.activeAttempt) return null;
    return state.activeAttempt.questions[state.activeAttempt.currentQuestionIndex] ?? null;
};

/**
 * Gets progress of current attempt
 */
export const selectAttemptProgress = (state: QuizStoreState) => {
    if (!state.activeAttempt) return null;
    const { questions, responses, currentQuestionIndex } = state.activeAttempt;
    return {
        total: questions.length,
        answered: responses.size,
        current: currentQuestionIndex + 1,
        percentage: Math.round((responses.size / questions.length) * 100),
    };
};

/**
 * Checks if any loading state is active
 */
export const selectIsLoading = (state: QuizStoreState) =>
    Object.values(state.loading).some(Boolean);

/**
 * Gets loading state for specific operation
 */
export const selectLoadingState = (key: keyof LoadingStates) => (state: QuizStoreState) =>
    state.loading[key];

/**
 * Checks if there's an active error
 */
export const selectHasError = (state: QuizStoreState) =>
    state.error.message !== null;

/**
 * Gets leaderboard top entries
 */
export const selectTopLeaderboard = (count: number) => (state: QuizStoreState) =>
    state.leaderboard.slice(0, count);

// ============================================================
// HOOKS - Convenience exports
// ============================================================

export const useQuizzes = () => useQuizStore((s) => s.quizzes);
export const useSelectedQuiz = () => useQuizStore((s) => s.selectedQuiz);
export const useQuizQuestions = () => useQuizStore((s) => s.questions);
export const useActiveAttempt = () => useQuizStore((s) => s.activeAttempt);
export const useQuizLoading = () => useQuizStore((s) => s.loading);
export const useQuizError = () => useQuizStore((s) => s.error);
export const useQuizStatistics = () => useQuizStore((s) => s.quizStatistics);
export const useLeaderboard = () => useQuizStore((s) => s.leaderboard);
export const useLastAttemptResult = () => useQuizStore((s) => s.lastAttemptResult);
