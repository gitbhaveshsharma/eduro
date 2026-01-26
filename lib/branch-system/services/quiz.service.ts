/**
 * Quiz Service
 * 
 * Handles all quiz database operations and API interactions.
 * Provides a clean, type-safe interface for CRUD operations with RLS support.
 * Implements singleton pattern for optimal performance and memory usage.
 * 
 * @module branch-system/services/quiz
 */

import { createClient } from '@/lib/supabase/client';
import type {
    Quiz,
    QuizQuestion,
    QuizAttempt,
    QuizResponse,
    QuestionType,
    CreateQuizDTO,
    UpdateQuizDTO,
    ToggleQuizActiveDTO,
    CreateQuestionDTO,
    UpdateQuestionDTO,
    BulkCreateQuestionsDTO,
    ReorderQuestionsDTO,
    StartAttemptDTO,
    SubmitAttemptDTO,
    SaveResponseDTO,
    AbandonAttemptDTO,
    QuizFilters,
    QuizListParams,
    QuizListResponse,
    AttemptFilters,
    AttemptListParams,
    AttemptListResponse,
    QuizStatistics,
    QuestionStatistics,
    StudentQuizSummary,
    ClassQuizReport,
    AttemptForTeacher,
    StudentAttemptStatusItem,
    QuizAttemptResult,
    LeaderboardEntry,
    QuizFile,
} from '../types/quiz.types';
import {
    createQuizSchema,
    updateQuizSchema,
    toggleQuizActiveSchema,
    createQuestionSchema,
    updateQuestionSchema,
    bulkCreateQuestionsSchema,
    reorderQuestionsSchema,
    startAttemptSchema,
    submitAttemptSchema,
    saveResponseSchema,
    abandonAttemptSchema,
    quizListParamsSchema,
    attemptListParamsSchema,
} from '../validations/quiz.validation';
import {
    getCurrentDateTime,
    calculateQuizStatistics,
    calculateQuestionStatistics,
    calculateStudentQuizSummary,
    calculateClassQuizReport,
    createAttemptForTeacher,
    createStudentAttemptStatusItem,
    createQuizAttemptResult,
    createLeaderboard,
    buildQuizQueryFilters,
    calculateResponsePoints,
    prepareQuestionsForAttempt,
} from '../utils/quiz.utils';

// ============================================================
// TYPES
// ============================================================

/**
 * Operation Result - Generic response wrapper
 */
export interface QuizOperationResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    validation_errors?: Array<{
        field: string;
        message: string;
    }>;
}

/**
 * Validation Error
 */
export interface QuizValidationError {
    field: string;
    message: string;
}

// ============================================================
// DATABASE ROW TYPES FOR INTERNAL USE
// ============================================================

interface QuizDbRow {
    id: string;
    class_id: string;
    teacher_id: string;
    branch_id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    available_from: string;
    available_to: string;
    time_limit_minutes: number | null;
    submission_window_minutes: number;
    shuffle_questions: boolean;
    shuffle_options: boolean;
    show_correct_answers: boolean;
    show_score_immediately: boolean;
    allow_multiple_attempts: boolean;
    max_attempts: number;
    require_webcam: boolean;
    max_score: number;
    passing_score: number | null;
    is_active: boolean;
    total_questions: number;
    total_attempts: number;
    average_score: number | null;
    created_at: string;
    updated_at: string;
    branch_classes?: { id: string; class_name: string; subject: string; grade_level: string };
    coaching_branches?: { id: string; name: string };
}

interface QuizQuestionDbRow {
    id: string;
    quiz_id: string;
    question_text: string;
    question_type: string;
    options: Record<string, string>;
    correct_answers: string[];
    points: number;
    negative_points: number;
    explanation: string | null;
    question_order: number;
    topic: string | null;
    media_file_id: string | null;
    created_at: string;
    updated_at: string;
}

interface QuizAttemptDbRow {
    id: string;
    quiz_id: string;
    student_id: string;
    class_id: string;
    attempt_number: number;
    attempt_status: string;
    started_at: string;
    submitted_at: string | null;
    time_taken_seconds: number | null;
    score: number | null;
    max_score: number | null;
    percentage: number | null;
    passed: boolean | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
    quizzes?: {
        id: string;
        title: string;
        time_limit_minutes: number | null;
        max_score: number;
        passing_score: number | null;
        show_correct_answers: boolean;
        show_score_immediately: boolean;
    };
}

interface ProfileDbRow {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
}

interface EnrollmentDbRow {
    student_id: string;
    profiles: ProfileDbRow | null;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Transforms database row to Quiz with relations
 */
function rowToQuiz(row: Record<string, unknown>): Quiz {
    const quiz = row as unknown as Quiz;
    return {
        ...quiz,
        class: row.branch_classes ? {
            id: (row.branch_classes as Record<string, unknown>).id as string,
            class_name: (row.branch_classes as Record<string, unknown>).class_name as string,
            subject: (row.branch_classes as Record<string, unknown>).subject as string,
            grade_level: (row.branch_classes as Record<string, unknown>).grade_level as string,
        } : undefined,
        branch: row.coaching_branches ? {
            id: (row.coaching_branches as Record<string, unknown>).id as string,
            name: (row.coaching_branches as Record<string, unknown>).name as string,
        } : undefined,
        teacher: row.teacher_profile ? {
            id: quiz.teacher_id,
            full_name: (row.teacher_profile as Record<string, unknown>).full_name as string | null,
            avatar_url: (row.teacher_profile as Record<string, unknown>).avatar_url as string | null,
        } : undefined,
        questions: row.quiz_questions as QuizQuestion[] | undefined,
    };
}

/**
 * Transforms database row to QuizAttempt with relations
 */
function rowToAttempt(row: Record<string, unknown>): QuizAttempt {
    const attempt = row as unknown as QuizAttempt;
    return {
        ...attempt,
        quiz: row.quizzes ? {
            id: (row.quizzes as Record<string, unknown>).id as string,
            title: (row.quizzes as Record<string, unknown>).title as string,
            time_limit_minutes: (row.quizzes as Record<string, unknown>).time_limit_minutes as number | null,
            max_score: (row.quizzes as Record<string, unknown>).max_score as number,
            passing_score: (row.quizzes as Record<string, unknown>).passing_score as number | null,
            show_correct_answers: (row.quizzes as Record<string, unknown>).show_correct_answers as boolean,
            show_score_immediately: (row.quizzes as Record<string, unknown>).show_score_immediately as boolean,
        } : undefined,
        student: row.student_profile ? {
            id: attempt.student_id,
            full_name: (row.student_profile as Record<string, unknown>).full_name as string | null,
            username: (row.student_profile as Record<string, unknown>).username as string | null,
            avatar_url: (row.student_profile as Record<string, unknown>).avatar_url as string | null,
        } : undefined,
        responses: row.quiz_responses as QuizResponse[] | undefined,
    };
}

// ============================================================
// SERVICE CLASS
// ============================================================

/**
 * Quiz Service
 * Singleton service for managing quizzes, questions, and attempts
 */
export class QuizService {
    private static instance: QuizService;
    private supabase = createClient();

    private constructor() { }

    /**
     * Gets singleton instance
     */
    public static getInstance(): QuizService {
        if (!QuizService.instance) {
            QuizService.instance = new QuizService();
        }
        return QuizService.instance;
    }

    // ============================================================
    // QUIZ CRUD OPERATIONS
    // ============================================================

    /**
     * Creates a new quiz
     */
    async createQuiz(
        input: CreateQuizDTO
    ): Promise<QuizOperationResult<Quiz>> {
        try {
            const validationResult = createQuizSchema.safeParse(input);
            if (!validationResult.success) {
                return {
                    success: false,
                    validation_errors: validationResult.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                };
            }

            const validatedInput = validationResult.data;

            const { data, error } = await this.supabase
                .from('quizzes')
                .insert({
                    class_id: validatedInput.class_id,
                    teacher_id: validatedInput.teacher_id,
                    branch_id: validatedInput.branch_id,
                    title: validatedInput.title,
                    description: validatedInput.description,
                    instructions: validatedInput.instructions,
                    available_from: validatedInput.available_from,
                    available_to: validatedInput.available_to,
                    time_limit_minutes: validatedInput.time_limit_minutes,
                    submission_window_minutes: validatedInput.submission_window_minutes,
                    shuffle_questions: validatedInput.shuffle_questions,
                    shuffle_options: validatedInput.shuffle_options,
                    show_correct_answers: validatedInput.show_correct_answers,
                    show_score_immediately: validatedInput.show_score_immediately,
                    allow_multiple_attempts: validatedInput.allow_multiple_attempts,
                    max_attempts: validatedInput.max_attempts,
                    require_webcam: validatedInput.require_webcam,
                    max_score: validatedInput.max_score,
                    passing_score: validatedInput.passing_score,
                    clean_attempts_after: validatedInput.clean_attempts_after,
                    clean_questions_after: validatedInput.clean_questions_after,
                    is_active: true,
                })
                .select(`
                    *,
                    branch_classes:class_id(id, class_name, subject, grade_level),
                    coaching_branches:branch_id(id, name)
                `)
                .single();

            if (error) {
                return {
                    success: false,
                    error: `Database error: ${error.message}`,
                };
            }

            const { data: teacherProfile } = await this.supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', validatedInput.teacher_id)
                .single();

            const quiz = rowToQuiz({
                ...data,
                teacher_profile: teacherProfile,
            });

            return { success: true, data: quiz };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Updates an existing quiz
     */
    async updateQuiz(
        input: UpdateQuizDTO
    ): Promise<QuizOperationResult<Quiz>> {
        try {
            console.log('[QuizService] updateQuiz called with input:', input);
            const validationResult = updateQuizSchema.safeParse(input);
            if (!validationResult.success) {
                console.error('[QuizService] Validation failed:', validationResult.error.errors);
                return {
                    success: false,
                    validation_errors: validationResult.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                };
            }

            console.log('[QuizService] Validation passed');
            const validatedInput = validationResult.data;
            const { id, ...updateData } = validatedInput;

            console.log('[QuizService] Fetching existing quiz:', id);
            const { data: existing, error: fetchError } = await this.supabase
                .from('quizzes')
                .select('total_attempts')
                .eq('id', id)
                .single();

            if (fetchError || !existing) {
                console.error('[QuizService] Quiz not found:', fetchError);
                return { success: false, error: 'Quiz not found' };
            }

            console.log('[QuizService] Updating quiz with data:', updateData);
            const { data, error } = await this.supabase
                .from('quizzes')
                .update({
                    ...updateData,
                    updated_at: getCurrentDateTime(),
                })
                .eq('id', id)
                .select(`
                    *,
                    branch_classes:class_id(id, class_name, subject, grade_level),
                    coaching_branches:branch_id(id, name)
                `)
                .single();

            if (error) {
                console.error('[QuizService] Database update error:', error);
                return { success: false, error: `Database error: ${error.message}` };
            }

            console.log('[QuizService] Quiz updated successfully, fetching teacher profile');
            const { data: teacherProfile } = await this.supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', data.teacher_id)
                .single();

            const quiz = rowToQuiz({
                ...data,
                teacher_profile: teacherProfile,
            });

            console.log('[QuizService] Returning updated quiz:', quiz.id, quiz.title);
            return { success: true, data: quiz };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Toggles quiz active status
     */
    async toggleQuizActive(
        input: ToggleQuizActiveDTO
    ): Promise<QuizOperationResult<Quiz>> {
        try {
            const validationResult = toggleQuizActiveSchema.safeParse(input);
            if (!validationResult.success) {
                return {
                    success: false,
                    validation_errors: validationResult.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                };
            }

            const { id, is_active } = validationResult.data;

            const { data, error } = await this.supabase
                .from('quizzes')
                .update({
                    is_active,
                    updated_at: getCurrentDateTime(),
                })
                .eq('id', id)
                .select(`
                    *,
                    branch_classes:class_id(id, class_name, subject, grade_level),
                    coaching_branches:branch_id(id, name)
                `)
                .single();

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            const { data: teacherProfile } = await this.supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', data.teacher_id)
                .single();

            return {
                success: true,
                data: rowToQuiz({ ...data, teacher_profile: teacherProfile }),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Deletes a quiz (only if no attempts)
     */
    async deleteQuiz(
        quizId: string
    ): Promise<QuizOperationResult<{ id: string }>> {
        try {
            const { data: existing, error: fetchError } = await this.supabase
                .from('quizzes')
                .select('total_attempts')
                .eq('id', quizId)
                .single();

            if (fetchError || !existing) {
                return { success: false, error: 'Quiz not found' };
            }

            if (existing.total_attempts > 0) {
                return { success: false, error: 'Cannot delete quiz with attempts' };
            }

            // Delete questions first (cascade should handle this, but explicit for safety)
            await this.supabase
                .from('quiz_questions')
                .delete()
                .eq('quiz_id', quizId);

            const { error } = await this.supabase
                .from('quizzes')
                .delete()
                .eq('id', quizId);

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            return { success: true, data: { id: quizId } };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets quiz by ID
     */
    async getQuizById(
        quizId: string,
        includeQuestions = false
    ): Promise<QuizOperationResult<Quiz>> {
        try {
            let query = this.supabase
                .from('quizzes')
                .select(`
                    *,
                    branch_classes:class_id(id, class_name, subject, grade_level),
                    coaching_branches:branch_id(id, name)
                `)
                .eq('id', quizId);

            const { data, error } = await query.single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return { success: false, error: 'Quiz not found' };
                }
                return { success: false, error: `Database error: ${error.message}` };
            }

            const { data: teacherProfile } = await this.supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', data.teacher_id)
                .single();

            let questions: QuizQuestion[] | undefined;
            if (includeQuestions) {
                const { data: questionData } = await this.supabase
                    .from('quiz_questions')
                    .select('*')
                    .eq('quiz_id', quizId)
                    .order('question_order', { ascending: true });
                questions = questionData ?? undefined;
            }

            const quiz = rowToQuiz({
                ...data,
                teacher_profile: teacherProfile,
                quiz_questions: questions,
            });

            return { success: true, data: quiz };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Lists quizzes with filters and pagination
     */
    async listQuizzes(
        params?: QuizListParams
    ): Promise<QuizOperationResult<QuizListResponse>> {
        try {
            const validationResult = quizListParamsSchema.safeParse(params || {});
            if (!validationResult.success) {
                return {
                    success: false,
                    validation_errors: validationResult.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                };
            }

            const validatedParams = validationResult.data;
            const {
                page = 1,
                limit = 20,
                sort_by = 'available_from',
                sort_order = 'desc',
                search,
                ...filters
            } = validatedParams;

            let query = this.supabase
                .from('quizzes')
                .select(`
                    *,
                    branch_classes:class_id(id, class_name, subject, grade_level),
                    coaching_branches:branch_id(id, name)
                `, { count: 'exact' });

            // Apply filters
            const queryFilters = buildQuizQueryFilters(filters);
            Object.entries(queryFilters).forEach(([key, value]) => {
                query = query.eq(key, value);
            });

            // Search
            if (search) {
                query = query.ilike('title', `%${search}%`);
            }

            // Date range filters
            if (filters.available_from) {
                query = query.gte('available_from', filters.available_from);
            }
            if (filters.available_to) {
                query = query.lte('available_to', filters.available_to);
            }

            // Sorting
            query = query.order(sort_by, { ascending: sort_order === 'asc' });

            // Pagination
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            // Fetch teacher profiles
            const teacherIds = [...new Set((data as QuizDbRow[] | null)?.map((d: QuizDbRow) => d.teacher_id) ?? [])];
            const { data: teacherProfiles } = await this.supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', teacherIds);

            const teacherMap = new Map(
                (teacherProfiles as ProfileDbRow[] | null)?.map((p: ProfileDbRow) => [p.id, p]) ?? []
            );

            const quizzes = ((data ?? []) as QuizDbRow[]).map((d: QuizDbRow) =>
                rowToQuiz({
                    ...d,
                    teacher_profile: teacherMap.get(d.teacher_id),
                })
            );

            return {
                success: true,
                data: {
                    data: quizzes,
                    total: count ?? 0,
                    page,
                    limit,
                    has_more: (count ?? 0) > page * limit,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // ============================================================
    // QUESTION CRUD OPERATIONS
    // ============================================================

    /**
     * Creates a question
     */
    async createQuestion(
        input: CreateQuestionDTO
    ): Promise<QuizOperationResult<QuizQuestion>> {
        try {
            const validationResult = createQuestionSchema.safeParse(input);
            if (!validationResult.success) {
                return {
                    success: false,
                    validation_errors: validationResult.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                };
            }

            const validatedInput = validationResult.data;

            const { data, error } = await this.supabase
                .from('quiz_questions')
                .insert({
                    quiz_id: validatedInput.quiz_id,
                    question_text: validatedInput.question_text,
                    question_type: validatedInput.question_type,
                    options: validatedInput.options,
                    correct_answers: validatedInput.correct_answers,
                    points: validatedInput.points,
                    negative_points: validatedInput.negative_points,
                    explanation: validatedInput.explanation,
                    question_order: validatedInput.question_order,
                    topic: validatedInput.topic,
                    media_file_id: validatedInput.media_file_id,
                })
                .select('*')
                .single();

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            // Update quiz total_questions count
            try {
                await this.supabase.rpc('increment_quiz_questions', {
                    quiz_id: validatedInput.quiz_id,
                    amount: 1,
                });
            } catch (rpcError) {
                // If RPC doesn't exist, update manually
                await this.updateQuizQuestionCount(validatedInput.quiz_id);
            }

            return { success: true, data: data as QuizQuestion };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Updates a question
     */
    async updateQuestion(
        input: UpdateQuestionDTO
    ): Promise<QuizOperationResult<QuizQuestion>> {
        try {
            const validationResult = updateQuestionSchema.safeParse(input);
            if (!validationResult.success) {
                return {
                    success: false,
                    validation_errors: validationResult.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                };
            }

            const validatedInput = validationResult.data;
            const { id, ...updateData } = validatedInput;

            const { data, error } = await this.supabase
                .from('quiz_questions')
                .update({
                    ...updateData,
                    updated_at: getCurrentDateTime(),
                })
                .eq('id', id)
                .select('*')
                .single();

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            return { success: true, data: data as QuizQuestion };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Deletes a question
     */
    async deleteQuestion(
        questionId: string
    ): Promise<QuizOperationResult<{ id: string }>> {
        try {
            // Get quiz_id before deletion
            const { data: question, error: fetchError } = await this.supabase
                .from('quiz_questions')
                .select('quiz_id')
                .eq('id', questionId)
                .single();

            if (fetchError || !question) {
                return { success: false, error: 'Question not found' };
            }

            const { error } = await this.supabase
                .from('quiz_questions')
                .delete()
                .eq('id', questionId);

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            // Update quiz total_questions count
            await this.updateQuizQuestionCount(question.quiz_id);

            return { success: true, data: { id: questionId } };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Bulk creates questions
     */
    async bulkCreateQuestions(
        input: BulkCreateQuestionsDTO
    ): Promise<QuizOperationResult<QuizQuestion[]>> {
        try {
            const validationResult = bulkCreateQuestionsSchema.safeParse(input);
            if (!validationResult.success) {
                return {
                    success: false,
                    validation_errors: validationResult.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                };
            }

            const validatedInput = validationResult.data;

            const questionsToInsert = validatedInput.questions.map(q => ({
                quiz_id: validatedInput.quiz_id,
                question_text: q.question_text,
                question_type: q.question_type,
                options: q.options,
                correct_answers: q.correct_answers,
                points: q.points,
                negative_points: q.negative_points,
                explanation: q.explanation,
                question_order: q.question_order,
                topic: q.topic,
                media_file_id: q.media_file_id,
            }));

            const { data, error } = await this.supabase
                .from('quiz_questions')
                .insert(questionsToInsert)
                .select('*');

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            // Update quiz total_questions count
            await this.updateQuizQuestionCount(validatedInput.quiz_id);

            return { success: true, data: data as QuizQuestion[] };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Reorders questions
     */
    async reorderQuestions(
        input: ReorderQuestionsDTO
    ): Promise<QuizOperationResult<boolean>> {
        try {
            const validationResult = reorderQuestionsSchema.safeParse(input);
            if (!validationResult.success) {
                return {
                    success: false,
                    validation_errors: validationResult.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                };
            }

            const validatedInput = validationResult.data;

            // Update each question's order
            for (const item of validatedInput.question_orders) {
                const { error } = await this.supabase
                    .from('quiz_questions')
                    .update({ question_order: item.order })
                    .eq('id', item.id)
                    .eq('quiz_id', validatedInput.quiz_id);

                if (error) {
                    return { success: false, error: `Failed to update question order: ${error.message}` };
                }
            }

            return { success: true, data: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets questions for a quiz
     */
    async getQuizQuestions(
        quizId: string
    ): Promise<QuizOperationResult<QuizQuestion[]>> {
        try {
            const { data, error } = await this.supabase
                .from('quiz_questions')
                .select('*')
                .eq('quiz_id', quizId)
                .order('question_order', { ascending: true });

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            return { success: true, data: data as QuizQuestion[] };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Updates quiz question count
     */
    private async updateQuizQuestionCount(quizId: string): Promise<void> {
        const { count } = await this.supabase
            .from('quiz_questions')
            .select('*', { count: 'exact', head: true })
            .eq('quiz_id', quizId);

        await this.supabase
            .from('quizzes')
            .update({ total_questions: count ?? 0 })
            .eq('id', quizId);
    }

    // ============================================================
    // ATTEMPT OPERATIONS
    // ============================================================

    /**
     * Starts a quiz attempt
     */
    async startAttempt(
        input: StartAttemptDTO
    ): Promise<QuizOperationResult<{ attempt: QuizAttempt; questions: QuizQuestion[] }>> {
        try {
            const validationResult = startAttemptSchema.safeParse(input);
            if (!validationResult.success) {
                return {
                    success: false,
                    validation_errors: validationResult.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                };
            }

            const validatedInput = validationResult.data;

            // Get quiz details
            const { data: quiz, error: quizError } = await this.supabase
                .from('quizzes')
                .select('*')
                .eq('id', validatedInput.quiz_id)
                .single();

            if (quizError || !quiz) {
                return { success: false, error: 'Quiz not found' };
            }

            // Check if quiz is active and available
            if (!quiz.is_active) {
                return { success: false, error: 'Quiz is not active' };
            }

            const now = new Date();
            if (now < new Date(quiz.available_from)) {
                return { success: false, error: 'Quiz has not started yet' };
            }
            if (now > new Date(quiz.available_to)) {
                return { success: false, error: 'Quiz has ended' };
            }

            // Check existing attempts
            const { data: existingAttempts } = await this.supabase
                .from('quiz_attempts')
                .select('*')
                .eq('quiz_id', validatedInput.quiz_id)
                .eq('student_id', validatedInput.student_id);

            const typedAttempts = existingAttempts as QuizAttemptDbRow[] | null;
            const inProgressAttempt = typedAttempts?.find((a: QuizAttemptDbRow) => a.attempt_status === 'IN_PROGRESS');
            if (inProgressAttempt) {
                // Return existing in-progress attempt
                const { data: questions } = await this.supabase
                    .from('quiz_questions')
                    .select('*')
                    .eq('quiz_id', validatedInput.quiz_id)
                    .order('question_order', { ascending: true });

                const preparedQuestions = prepareQuestionsForAttempt(
                    (questions ?? []) as QuizQuestion[],
                    quiz.shuffle_questions,
                    quiz.shuffle_options
                );

                return {
                    success: true,
                    data: {
                        attempt: inProgressAttempt as unknown as QuizAttempt,
                        questions: preparedQuestions,
                    },
                };
            }

            const completedAttempts = typedAttempts?.filter(
                (a: QuizAttemptDbRow) => a.attempt_status === 'COMPLETED' || a.attempt_status === 'TIMEOUT'
            ) ?? [];

            if (completedAttempts.length >= quiz.max_attempts) {
                return { success: false, error: 'Maximum attempts reached' };
            }

            // Create new attempt
            const attemptNumber = completedAttempts.length + 1;

            const { data: attempt, error: attemptError } = await this.supabase
                .from('quiz_attempts')
                .insert({
                    quiz_id: validatedInput.quiz_id,
                    student_id: validatedInput.student_id,
                    class_id: validatedInput.class_id,
                    attempt_number: attemptNumber,
                    attempt_status: 'IN_PROGRESS',
                    started_at: getCurrentDateTime(),
                    max_score: quiz.max_score,
                })
                .select('*')
                .single();

            if (attemptError) {
                return { success: false, error: `Failed to create attempt: ${attemptError.message}` };
            }

            // Update quiz total_attempts
            await this.supabase
                .from('quizzes')
                .update({ total_attempts: (quiz.total_attempts || 0) + 1 })
                .eq('id', validatedInput.quiz_id);

            // Get questions
            const { data: questions } = await this.supabase
                .from('quiz_questions')
                .select('*')
                .eq('quiz_id', validatedInput.quiz_id)
                .order('question_order', { ascending: true });

            const preparedQuestions = prepareQuestionsForAttempt(
                questions ?? [],
                quiz.shuffle_questions,
                quiz.shuffle_options
            );

            return {
                success: true,
                data: {
                    attempt: attempt as QuizAttempt,
                    questions: preparedQuestions,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Submits a quiz attempt
     */
    async submitAttempt(
        input: SubmitAttemptDTO
    ): Promise<QuizOperationResult<QuizAttemptResult>> {
        try {
            const validationResult = submitAttemptSchema.safeParse(input);
            if (!validationResult.success) {
                return {
                    success: false,
                    validation_errors: validationResult.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                };
            }

            const validatedInput = validationResult.data;

            // Get attempt
            const { data: attempt, error: attemptError } = await this.supabase
                .from('quiz_attempts')
                .select('*, quizzes(*)')
                .eq('id', validatedInput.attempt_id)
                .single();

            if (attemptError || !attempt) {
                return { success: false, error: 'Attempt not found' };
            }

            if (attempt.attempt_status !== 'IN_PROGRESS') {
                return { success: false, error: 'Attempt is not in progress' };
            }

            const quiz = attempt.quizzes;

            // Get questions
            const { data: questions } = await this.supabase
                .from('quiz_questions')
                .select('*')
                .eq('quiz_id', quiz.id);

            const typedQuestions = (questions ?? []) as QuizQuestionDbRow[];
            const questionMap = new Map(typedQuestions.map((q: QuizQuestionDbRow) => [q.id, q]));

            // Calculate scores and insert responses
            let totalScore = 0;
            const responsesToInsert = validatedInput.responses.map(r => {
                const question = questionMap.get(r.question_id);
                if (!question) return null;

                const result = calculateResponsePoints(
                    r.selected_answers,
                    question.correct_answers,
                    question.question_type as QuestionType,
                    question.points,
                    question.negative_points
                );

                totalScore += result.earned - result.deducted;

                return {
                    attempt_id: validatedInput.attempt_id,
                    question_id: r.question_id,
                    selected_answers: r.selected_answers,
                    is_correct: result.isCorrect,
                    points_earned: result.earned,
                    points_deducted: result.deducted,
                    time_spent_seconds: r.time_spent_seconds ?? 0,
                };
            }).filter((r): r is NonNullable<typeof r> => r !== null);

            // Insert responses
            if (responsesToInsert.length > 0) {
                const { error: responseError } = await this.supabase
                    .from('quiz_responses')
                    .insert(responsesToInsert);

                if (responseError) {
                    return { success: false, error: `Failed to save responses: ${responseError.message}` };
                }
            }

            // Calculate final results
            const submittedAt = getCurrentDateTime();
            const timeTakenSeconds = Math.floor(
                (new Date(submittedAt).getTime() - new Date(attempt.started_at).getTime()) / 1000
            );
            const percentage = quiz.max_score > 0 ? (totalScore / quiz.max_score) * 100 : 0;
            const passed = quiz.passing_score !== null ? totalScore >= quiz.passing_score : null;

            // Update attempt
            const { data: updatedAttempt, error: updateError } = await this.supabase
                .from('quiz_attempts')
                .update({
                    attempt_status: 'COMPLETED',
                    submitted_at: submittedAt,
                    time_taken_seconds: timeTakenSeconds,
                    score: totalScore,
                    percentage: Number(percentage.toFixed(2)),
                    passed,
                    updated_at: getCurrentDateTime(),
                })
                .eq('id', validatedInput.attempt_id)
                .select('*')
                .single();

            if (updateError) {
                return { success: false, error: `Failed to complete attempt: ${updateError.message}` };
            }

            // Update quiz average score
            await this.updateQuizAverageScore(quiz.id);

            // Build result
            const result = createQuizAttemptResult(
                updatedAttempt as QuizAttempt,
                quiz as Quiz,
                responsesToInsert as QuizResponse[],
                questions as QuizQuestion[]
            );

            return { success: true, data: result };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Saves a response during quiz (auto-save)
     */
    async saveResponse(
        input: SaveResponseDTO
    ): Promise<QuizOperationResult<QuizResponse>> {
        try {
            const validationResult = saveResponseSchema.safeParse(input);
            if (!validationResult.success) {
                return {
                    success: false,
                    validation_errors: validationResult.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                };
            }

            const validatedInput = validationResult.data;

            // Check if response already exists
            const { data: existing } = await this.supabase
                .from('quiz_responses')
                .select('id')
                .eq('attempt_id', validatedInput.attempt_id)
                .eq('question_id', validatedInput.question_id)
                .single();

            if (existing) {
                // Update existing response
                const { data, error } = await this.supabase
                    .from('quiz_responses')
                    .update({
                        selected_answers: validatedInput.selected_answers,
                        time_spent_seconds: validatedInput.time_spent_seconds ?? 0,
                    })
                    .eq('id', existing.id)
                    .select('*')
                    .single();

                if (error) {
                    return { success: false, error: `Failed to update response: ${error.message}` };
                }

                return { success: true, data: data as QuizResponse };
            }

            // Insert new response (without grading - will be graded on submit)
            const { data, error } = await this.supabase
                .from('quiz_responses')
                .insert({
                    attempt_id: validatedInput.attempt_id,
                    question_id: validatedInput.question_id,
                    selected_answers: validatedInput.selected_answers,
                    time_spent_seconds: validatedInput.time_spent_seconds ?? 0,
                })
                .select('*')
                .single();

            if (error) {
                return { success: false, error: `Failed to save response: ${error.message}` };
            }

            return { success: true, data: data as QuizResponse };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Abandons an attempt
     */
    async abandonAttempt(
        input: AbandonAttemptDTO
    ): Promise<QuizOperationResult<QuizAttempt>> {
        try {
            const validationResult = abandonAttemptSchema.safeParse(input);
            if (!validationResult.success) {
                return {
                    success: false,
                    validation_errors: validationResult.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                };
            }

            const { attempt_id } = validationResult.data;

            const { data, error } = await this.supabase
                .from('quiz_attempts')
                .update({
                    attempt_status: 'ABANDONED',
                    updated_at: getCurrentDateTime(),
                })
                .eq('id', attempt_id)
                .eq('attempt_status', 'IN_PROGRESS')
                .select('*')
                .single();

            if (error) {
                return { success: false, error: `Failed to abandon attempt: ${error.message}` };
            }

            return { success: true, data: data as QuizAttempt };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets student's attempts for a quiz
     */
    async getStudentAttempts(
        quizId: string,
        studentId: string
    ): Promise<QuizOperationResult<QuizAttempt[]>> {
        try {
            const { data, error } = await this.supabase
                .from('quiz_attempts')
                .select(`
                    *,
                    quizzes:quiz_id(id, title, time_limit_minutes, max_score, passing_score, show_correct_answers, show_score_immediately)
                `)
                .eq('quiz_id', quizId)
                .eq('student_id', studentId)
                .order('attempt_number', { ascending: true });

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            return { success: true, data: data.map(rowToAttempt) };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets attempt details with responses
     */
    async getAttemptDetails(
        attemptId: string
    ): Promise<QuizOperationResult<QuizAttempt>> {
        try {
            const { data: attempt, error: attemptError } = await this.supabase
                .from('quiz_attempts')
                .select(`
                    *,
                    quizzes:quiz_id(*)
                `)
                .eq('id', attemptId)
                .single();

            if (attemptError || !attempt) {
                return { success: false, error: 'Attempt not found' };
            }

            // Get responses
            const { data: responses } = await this.supabase
                .from('quiz_responses')
                .select('*')
                .eq('attempt_id', attemptId);

            // Get student profile
            const { data: studentProfile } = await this.supabase
                .from('profiles')
                .select('full_name, username, avatar_url')
                .eq('id', attempt.student_id)
                .single();

            const result = rowToAttempt({
                ...attempt,
                student_profile: studentProfile,
                quiz_responses: responses,
            });

            return { success: true, data: result };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Lists attempts with filters
     */
    async listAttempts(
        params?: AttemptListParams
    ): Promise<QuizOperationResult<AttemptListResponse>> {
        try {
            const validationResult = attemptListParamsSchema.safeParse(params || {});
            if (!validationResult.success) {
                return {
                    success: false,
                    validation_errors: validationResult.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                };
            }

            const validatedParams = validationResult.data;
            const {
                page = 1,
                limit = 20,
                sort_by = 'started_at',
                sort_order = 'desc',
                ...filters
            } = validatedParams;

            let query = this.supabase
                .from('quiz_attempts')
                .select(`
                    *,
                    quizzes:quiz_id(id, title, time_limit_minutes, max_score, passing_score)
                `, { count: 'exact' });

            // Apply filters
            if (filters.quiz_id) query = query.eq('quiz_id', filters.quiz_id);
            if (filters.student_id) query = query.eq('student_id', filters.student_id);
            if (filters.class_id) query = query.eq('class_id', filters.class_id);
            if (filters.attempt_status) query = query.eq('attempt_status', filters.attempt_status);
            if (filters.passed !== undefined) query = query.eq('passed', filters.passed);

            // Sorting
            query = query.order(sort_by, { ascending: sort_order === 'asc' });

            // Pagination
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            // Fetch student profiles
            const typedAttemptData = (data ?? []) as QuizAttemptDbRow[];
            const studentIds = [...new Set(typedAttemptData.map((d: QuizAttemptDbRow) => d.student_id))];
            const { data: studentProfiles } = await this.supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url')
                .in('id', studentIds);

            const studentMap = new Map(
                (studentProfiles as ProfileDbRow[] | null)?.map((p: ProfileDbRow) => [p.id, p]) ?? []
            );

            const attempts = typedAttemptData.map((d: QuizAttemptDbRow) =>
                rowToAttempt({
                    ...d,
                    student_profile: studentMap.get(d.student_id),
                })
            );

            return {
                success: true,
                data: {
                    data: attempts,
                    total: count ?? 0,
                    page,
                    limit,
                    has_more: (count ?? 0) > page * limit,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Updates quiz average score
     */
    private async updateQuizAverageScore(quizId: string): Promise<void> {
        const { data } = await this.supabase
            .from('quiz_attempts')
            .select('percentage')
            .eq('quiz_id', quizId)
            .eq('attempt_status', 'COMPLETED')
            .not('percentage', 'is', null);

        if (data && data.length > 0) {
            const typedData = data as { percentage: number }[];
            const avgScore = typedData.reduce((sum: number, a: { percentage: number }) => sum + a.percentage, 0) / typedData.length;
            await this.supabase
                .from('quizzes')
                .update({ average_score: Number(avgScore.toFixed(2)) })
                .eq('id', quizId);
        }
    }

    // ============================================================
    // STATISTICS OPERATIONS
    // ============================================================

    /**
     * Gets quiz statistics
     */
    async getQuizStatistics(
        quizId: string
    ): Promise<QuizOperationResult<QuizStatistics>> {
        try {
            // Get quiz with class info
            const { data: quiz, error: quizError } = await this.supabase
                .from('quizzes')
                .select('class_id')
                .eq('id', quizId)
                .single();

            if (quizError || !quiz) {
                return { success: false, error: 'Quiz not found' };
            }

            // Get total students in class
            const { count: totalStudents } = await this.supabase
                .from('class_enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', quiz.class_id);

            // Get all attempts
            const { data: attempts } = await this.supabase
                .from('quiz_attempts')
                .select('*')
                .eq('quiz_id', quizId);

            const statistics = calculateQuizStatistics(
                totalStudents ?? 0,
                attempts as QuizAttempt[] ?? []
            );

            return { success: true, data: statistics };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets question statistics
     */
    async getQuestionStatistics(
        quizId: string
    ): Promise<QuizOperationResult<QuestionStatistics[]>> {
        try {
            // Get questions
            const { data: questions } = await this.supabase
                .from('quiz_questions')
                .select('*')
                .eq('quiz_id', quizId)
                .order('question_order', { ascending: true });

            if (!questions || questions.length === 0) {
                return { success: true, data: [] };
            }

            // Get all responses for this quiz
            const { data: attempts } = await this.supabase
                .from('quiz_attempts')
                .select('id')
                .eq('quiz_id', quizId)
                .eq('attempt_status', 'COMPLETED');

            const typedAttempts = (attempts ?? []) as { id: string }[];
            const attemptIds = typedAttempts.map((a: { id: string }) => a.id);

            if (attemptIds.length === 0) {
                return {
                    success: true,
                    data: (questions as QuizQuestionDbRow[]).map((q: QuizQuestionDbRow) => calculateQuestionStatistics(q as unknown as QuizQuestion, [])),
                };
            }

            const { data: responses } = await this.supabase
                .from('quiz_responses')
                .select('*')
                .in('attempt_id', attemptIds);

            const statistics = (questions as QuizQuestionDbRow[]).map((q: QuizQuestionDbRow) =>
                calculateQuestionStatistics(q as unknown as QuizQuestion, (responses ?? []) as QuizResponse[])
            );

            return { success: true, data: statistics };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets student quiz summary
     */
    async getStudentSummary(
        studentId: string,
        classId?: string
    ): Promise<QuizOperationResult<StudentQuizSummary>> {
        try {
            let quizQuery = this.supabase
                .from('quizzes')
                .select('*')
                .eq('is_active', true);

            if (classId) {
                quizQuery = quizQuery.eq('class_id', classId);
            }

            const { data: quizzes } = await quizQuery;

            let attemptQuery = this.supabase
                .from('quiz_attempts')
                .select('*')
                .eq('student_id', studentId);

            if (classId) {
                attemptQuery = attemptQuery.eq('class_id', classId);
            }

            const { data: attempts } = await attemptQuery;

            const summary = calculateStudentQuizSummary(
                quizzes as Quiz[] ?? [],
                attempts as QuizAttempt[] ?? []
            );

            return { success: true, data: summary };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets class quiz report
     */
    async getClassReport(
        classId: string
    ): Promise<QuizOperationResult<ClassQuizReport>> {
        try {
            // Get class info
            const { data: classData, error: classError } = await this.supabase
                .from('branch_classes')
                .select('class_name')
                .eq('id', classId)
                .single();

            if (classError || !classData) {
                return { success: false, error: 'Class not found' };
            }

            // Get total students
            const { count: totalStudents } = await this.supabase
                .from('class_enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', classId);

            // Get all quizzes
            const { data: quizzes } = await this.supabase
                .from('quizzes')
                .select('*')
                .eq('class_id', classId);

            // Get all attempts
            const { data: attempts } = await this.supabase
                .from('quiz_attempts')
                .select('*')
                .eq('class_id', classId);

            const report = calculateClassQuizReport(
                classId,
                classData.class_name,
                quizzes as Quiz[] ?? [],
                attempts as QuizAttempt[] ?? [],
                totalStudents ?? 0
            );

            return { success: true, data: report };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets attempts for teacher's grading view
     */
    async getAttemptsForTeacher(
        quizId: string
    ): Promise<QuizOperationResult<AttemptForTeacher[]>> {
        try {
            const { data, error } = await this.supabase
                .from('quiz_attempts')
                .select('*')
                .eq('quiz_id', quizId)
                .order('submitted_at', { ascending: false, nullsFirst: false });

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            // Get student profiles
            const typedData = (data ?? []) as QuizAttemptDbRow[];
            const studentIds = [...new Set(typedData.map((d: QuizAttemptDbRow) => d.student_id))];
            const { data: profiles } = await this.supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url')
                .in('id', studentIds);

            const typedProfiles = (profiles ?? []) as ProfileDbRow[];
            const profileMap = new Map(typedProfiles.map((p: ProfileDbRow) => [p.id, p]));

            const attempts = typedData.map((d: QuizAttemptDbRow) => {
                const profile = profileMap.get(d.student_id);
                return createAttemptForTeacher({
                    ...d,
                    student: profile ? {
                        id: d.student_id,
                        full_name: profile.full_name,
                        username: profile.username,
                        avatar_url: profile.avatar_url,
                    } : undefined,
                } as unknown as QuizAttempt);
            });

            return { success: true, data: attempts };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets student attempt status list
     */
    async getStudentAttemptStatusList(
        quizId: string,
        classId: string
    ): Promise<QuizOperationResult<StudentAttemptStatusItem[]>> {
        try {
            // Get all students in class
            const { data: enrollments, error: enrollError } = await this.supabase
                .from('class_enrollments')
                .select(`
                    student_id,
                    profiles:student_id(id, full_name, username)
                `)
                .eq('class_id', classId);

            if (enrollError) {
                return { success: false, error: `Database error: ${enrollError.message}` };
            }

            // Get all attempts for this quiz
            const { data: attempts } = await this.supabase
                .from('quiz_attempts')
                .select('*')
                .eq('quiz_id', quizId);

            const typedAttemptData = (attempts ?? []) as QuizAttemptDbRow[];
            const attemptsByStudent = new Map<string, QuizAttempt[]>();
            typedAttemptData.forEach((a: QuizAttemptDbRow) => {
                const existing = attemptsByStudent.get(a.student_id) ?? [];
                existing.push(a as unknown as QuizAttempt);
                attemptsByStudent.set(a.student_id, existing);
            });

            const typedEnrollments = (enrollments ?? []) as EnrollmentDbRow[];
            const statusList = typedEnrollments.map((e: EnrollmentDbRow) => {
                const profile = e.profiles;
                const studentAttempts = attemptsByStudent.get(e.student_id) ?? [];
                return createStudentAttemptStatusItem(
                    { id: e.student_id, full_name: profile?.full_name ?? null, username: profile?.username ?? null },
                    studentAttempts
                );
            });

            return { success: true, data: statusList };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets quiz leaderboard
     */
    async getLeaderboard(
        quizId: string,
        limit = 10
    ): Promise<QuizOperationResult<LeaderboardEntry[]>> {
        try {
            const { data } = await this.supabase
                .from('quiz_attempts')
                .select('*')
                .eq('quiz_id', quizId)
                .eq('attempt_status', 'COMPLETED');

            // Get student profiles
            const typedLeaderboardData = (data ?? []) as QuizAttemptDbRow[];
            const studentIds = [...new Set(typedLeaderboardData.map((d: QuizAttemptDbRow) => d.student_id))];
            const { data: profiles } = await this.supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', studentIds);

            const typedProfiles = (profiles ?? []) as ProfileDbRow[];
            const profileMap = new Map(typedProfiles.map((p: ProfileDbRow) => [p.id, p]));

            const attemptsWithStudents = typedLeaderboardData.map((d: QuizAttemptDbRow) => ({
                ...d,
                student: profileMap.get(d.student_id) ? {
                    id: d.student_id,
                    full_name: profileMap.get(d.student_id)?.full_name ?? null,
                    username: null,
                    avatar_url: profileMap.get(d.student_id)?.avatar_url ?? null,
                } : undefined,
            })) as unknown as QuizAttempt[];

            const leaderboard = createLeaderboard(attemptsWithStudents, limit);

            return { success: true, data: leaderboard };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const quizService = QuizService.getInstance();
