/**
 * Assignment Service
 * 
 * Handles all assignment database operations and API interactions.
 * Provides a clean, type-safe interface for CRUD operations with RLS support.
 * Implements singleton pattern for optimal performance and memory usage.
 * 
 * @module branch-system/services/assignment
 */

import { createClient } from '@/lib/supabase/client';
import type {
    Assignment,
    AssignmentSubmission,
    AssignmentFile,
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
    GradingStatus,
    SubmissionForGrading,
    StudentSubmissionStatusItem,
} from '../types/assignment.types';
import {
    createAssignmentSchema,
    updateAssignmentSchema,
    publishAssignmentSchema,
    closeAssignmentSchema,
    submitAssignmentSchema,
    saveDraftSchema,
    gradeSubmissionSchema,
    updateGradeSchema,
    regradeRequestSchema,
    uploadFileSchema,
    assignmentListParamsSchema,
    submissionListParamsSchema,
} from '../validations/assignment.validation';
import {
    getCurrentDateTime,
    isPastDateTime,
    calculateMinutesDifference,
    calculateLatePenalty,
    calculateAssignmentStatistics,
    calculateStudentSummary,
    calculateClassReport,
    calculateCleanupDate,
    buildAssignmentQueryFilters,
    createSubmissionForGrading,
    createStudentStatusItem,
} from '../utils/assignment.utils';

// ============================================================
// TYPES
// ============================================================

/**
 * Operation Result - Generic response wrapper
 */
export interface AssignmentOperationResult<T = unknown> {
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
export interface AssignmentValidationError {
    field: string;
    message: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Transforms database row to Assignment with relations
 */
function rowToAssignment(row: any): Assignment {
    return {
        ...row,
        class: row.branch_classes ? {
            id: row.branch_classes.id,
            class_name: row.branch_classes.class_name,
            subject: row.branch_classes.subject,
            grade_level: row.branch_classes.grade_level,
        } : undefined,
        branch: row.coaching_branches ? {
            id: row.coaching_branches.id,
            name: row.coaching_branches.name,
        } : undefined,
        teacher: row.teacher_profile ? {
            id: row.teacher_id,
            full_name: row.teacher_profile.full_name,
            avatar_url: row.teacher_profile.avatar_url,
        } : undefined,
        instruction_file: row.instruction_file || null,
        attachments: row.attachments || [],
    };
}

/**
 * Transforms database row to AssignmentSubmission with relations
 */
function rowToSubmission(row: any): AssignmentSubmission {
    return {
        ...row,
        assignment: row.assignments ? {
            id: row.assignments.id,
            title: row.assignments.title,
            submission_type: row.assignments.submission_type,
            max_score: row.assignments.max_score,
            due_date: row.assignments.due_date,
            allow_late_submission: row.assignments.allow_late_submission,
            late_penalty_percentage: row.assignments.late_penalty_percentage,
        } : undefined,
        student: row.student_profile ? {
            id: row.student_id,
            full_name: row.student_profile.full_name,
            username: row.student_profile.username,
            avatar_url: row.student_profile.avatar_url,
        } : undefined,
        submission_file: row.submission_file || null,
        grader: row.grader_profile ? {
            id: row.graded_by,
            full_name: row.grader_profile.full_name,
        } : null,
    };
}

// ============================================================
// SERVICE CLASS
// ============================================================

/**
 * Assignment Service
 * Singleton service for managing assignments and submissions
 */
export class AssignmentService {
    private static instance: AssignmentService;
    private supabase = createClient();

    private constructor() { }

    /**
     * Gets singleton instance
     */
    public static getInstance(): AssignmentService {
        if (!AssignmentService.instance) {
            AssignmentService.instance = new AssignmentService();
        }
        return AssignmentService.instance;
    }

    // ============================================================
    // ASSIGNMENT CRUD OPERATIONS
    // ============================================================

    /**
     * Creates a new assignment
     */
    async createAssignment(
        input: CreateAssignmentDTO
    ): Promise<AssignmentOperationResult<Assignment>> {
        try {
            // Validate input
            const validationResult = createAssignmentSchema.safeParse(input);
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

            // Insert assignment
            const { data, error } = await this.supabase
                .from('assignments')
                .insert({
                    class_id: validatedInput.class_id,
                    teacher_id: validatedInput.teacher_id,
                    branch_id: validatedInput.branch_id,
                    title: validatedInput.title,
                    description: validatedInput.description,
                    instructions: validatedInput.instructions,
                    submission_type: validatedInput.submission_type,
                    max_file_size: validatedInput.max_file_size,
                    allowed_extensions: validatedInput.allowed_extensions,
                    max_submissions: validatedInput.max_submissions,
                    allow_late_submission: validatedInput.allow_late_submission,
                    late_penalty_percentage: validatedInput.late_penalty_percentage,
                    max_score: validatedInput.max_score,
                    grading_rubric: validatedInput.grading_rubric,
                    show_rubric_to_students: validatedInput.show_rubric_to_students,
                    publish_at: validatedInput.publish_at,
                    due_date: validatedInput.due_date,
                    close_date: validatedInput.close_date,
                    clean_submissions_after: validatedInput.clean_submissions_after,
                    clean_instructions_after: validatedInput.clean_instructions_after,
                    status: 'DRAFT',
                    is_visible: false,
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

            // Fetch teacher profile
            const { data: teacherProfile } = await this.supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', validatedInput.teacher_id)
                .single();

            const assignment = rowToAssignment({
                ...data,
                teacher_profile: teacherProfile,
            });

            return {
                success: true,
                data: assignment,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Updates an existing assignment
     */
    async updateAssignment(
        input: UpdateAssignmentDTO
    ): Promise<AssignmentOperationResult<Assignment>> {
        try {
            // Validate input
            const validationResult = updateAssignmentSchema.safeParse(input);
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

            // Check if assignment exists and can be edited
            const { data: existing, error: fetchError } = await this.supabase
                .from('assignments')
                .select('status, total_submissions')
                .eq('id', id)
                .single();

            if (fetchError || !existing) {
                return {
                    success: false,
                    error: 'Assignment not found',
                };
            }

            if (existing.status === 'CLOSED') {
                return {
                    success: false,
                    error: 'Cannot edit closed assignment',
                };
            }

            // Update assignment
            const { data, error } = await this.supabase
                .from('assignments')
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
                return {
                    success: false,
                    error: `Database error: ${error.message}`,
                };
            }

            // Fetch teacher profile
            const { data: teacherProfile } = await this.supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', data.teacher_id)
                .single();

            const assignment = rowToAssignment({
                ...data,
                teacher_profile: teacherProfile,
            });

            return {
                success: true,
                data: assignment,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Publishes an assignment
     */
    async publishAssignment(
        input: PublishAssignmentDTO
    ): Promise<AssignmentOperationResult<Assignment>> {
        try {
            const validationResult = publishAssignmentSchema.safeParse(input);
            if (!validationResult.success) {
                return {
                    success: false,
                    validation_errors: validationResult.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                };
            }

            const { id, notify_students } = validationResult.data;

            // Check current status
            const { data: existing, error: fetchError } = await this.supabase
                .from('assignments')
                .select('status')
                .eq('id', id)
                .single();

            if (fetchError || !existing) {
                return { success: false, error: 'Assignment not found' };
            }

            if (existing.status !== 'DRAFT') {
                return { success: false, error: 'Only draft assignments can be published' };
            }

            // Update to published
            const { data, error } = await this.supabase
                .from('assignments')
                .update({
                    status: 'PUBLISHED',
                    is_visible: true,
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

            // TODO: If notify_students, send notifications to enrolled students

            const { data: teacherProfile } = await this.supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', data.teacher_id)
                .single();

            return {
                success: true,
                data: rowToAssignment({ ...data, teacher_profile: teacherProfile }),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Closes an assignment
     */
    async closeAssignment(
        input: CloseAssignmentDTO
    ): Promise<AssignmentOperationResult<Assignment>> {
        try {
            const validationResult = closeAssignmentSchema.safeParse(input);
            if (!validationResult.success) {
                return {
                    success: false,
                    validation_errors: validationResult.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                };
            }

            const { id } = validationResult.data;

            // Update to closed
            const { data, error } = await this.supabase
                .from('assignments')
                .update({
                    status: 'CLOSED',
                    close_date: getCurrentDateTime(),
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
                data: rowToAssignment({ ...data, teacher_profile: teacherProfile }),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Deletes an assignment (soft delete or hard delete based on status)
     */
    async deleteAssignment(
        assignmentId: string
    ): Promise<AssignmentOperationResult<{ id: string }>> {
        try {
            // Check assignment status
            const { data: existing, error: fetchError } = await this.supabase
                .from('assignments')
                .select('status, total_submissions')
                .eq('id', assignmentId)
                .single();

            if (fetchError || !existing) {
                return { success: false, error: 'Assignment not found' };
            }

            // Only allow deleting draft assignments with no submissions
            if (existing.status !== 'DRAFT') {
                return { success: false, error: 'Only draft assignments can be deleted' };
            }

            if (existing.total_submissions > 0) {
                return { success: false, error: 'Cannot delete assignment with submissions' };
            }

            const { error } = await this.supabase
                .from('assignments')
                .delete()
                .eq('id', assignmentId);

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            return { success: true, data: { id: assignmentId } };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets assignment by ID
     */
    async getAssignmentById(
        assignmentId: string,
        includeSubmissions = false
    ): Promise<AssignmentOperationResult<Assignment>> {
        try {
            const { data, error } = await this.supabase
                .from('assignments')
                .select(`
                    *,
                    branch_classes:class_id(id, class_name, subject, grade_level),
                    coaching_branches:branch_id(id, name)
                `)
                .eq('id', assignmentId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return { success: false, error: 'Assignment not found' };
                }
                return { success: false, error: `Database error: ${error.message}` };
            }

            // Fetch teacher profile
            const { data: teacherProfile } = await this.supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', data.teacher_id)
                .single();

            // Fetch instruction file if exists
            let instructionFile = null;
            if (data.instruction_file_id) {
                const { data: file } = await this.supabase
                    .from('files')
                    .select('*')
                    .eq('id', data.instruction_file_id)
                    .single();
                instructionFile = file;
            }

            // Fetch attachments if exist
            let attachments: AssignmentFile[] = [];
            if (data.attachment_ids && data.attachment_ids.length > 0) {
                const { data: files } = await this.supabase
                    .from('files')
                    .select('*')
                    .in('id', data.attachment_ids);
                attachments = files || [];
            }

            const assignment = rowToAssignment({
                ...data,
                teacher_profile: teacherProfile,
                instruction_file: instructionFile,
                attachments,
            });

            return { success: true, data: assignment };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Lists assignments with filtering and pagination
     */
    async listAssignments(
        params: AssignmentListParams = {}
    ): Promise<AssignmentOperationResult<AssignmentListResponse>> {
        try {
            const validationResult = assignmentListParamsSchema.safeParse(params);
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
                sort_by = 'due_date',
                sort_order = 'desc',
                search,
                due_date_from,
                due_date_to,
                ...filters
            } = validatedParams;

            const offset = (page - 1) * limit;

            // Build query
            let query = this.supabase
                .from('assignments')
                .select(`
                    *,
                    branch_classes:class_id(id, class_name, subject, grade_level),
                    coaching_branches:branch_id(id, name)
                `, { count: 'exact' });

            // Apply filters
            const queryFilters = buildAssignmentQueryFilters(filters);
            Object.entries(queryFilters).forEach(([key, value]) => {
                query = query.eq(key, value);
            });

            // Date range filters
            if (due_date_from) {
                query = query.gte('due_date', due_date_from);
            }
            if (due_date_to) {
                query = query.lte('due_date', due_date_to);
            }

            // Search filter
            if (search) {
                query = query.ilike('title', `%${search}%`);
            }

            // Apply sorting and pagination
            query = query
                .order(sort_by, { ascending: sort_order === 'asc' })
                .range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            // Fetch teacher profiles
            const teacherIds = [...new Set(data?.map((a: any) => a.teacher_id) || [])];
            const { data: teacherProfiles } = await this.supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', teacherIds);

            const teacherMap = new Map(
                teacherProfiles?.map((p: any) => [p.id, p]) || []
            );

            const assignments = data?.map((row: any) => rowToAssignment({
                ...row,
                teacher_profile: teacherMap.get(row.teacher_id),
            })) || [];

            return {
                success: true,
                data: {
                    data: assignments,
                    total: count || 0,
                    page,
                    limit,
                    has_more: (count || 0) > offset + limit,
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
    // SUBMISSION OPERATIONS
    // ============================================================

    /**
     * Submits an assignment (student)
     */
    async submitAssignment(
        input: SubmitAssignmentDTO
    ): Promise<AssignmentOperationResult<AssignmentSubmission>> {
        try {
            const validationResult = submitAssignmentSchema.safeParse(input);
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

            // Fetch assignment to check rules
            const { data: assignment, error: assignmentError } = await this.supabase
                .from('assignments')
                .select('*')
                .eq('id', validatedInput.assignment_id)
                .single();

            if (assignmentError || !assignment) {
                return { success: false, error: 'Assignment not found' };
            }

            // Check if assignment is published
            if (assignment.status !== 'PUBLISHED') {
                return { success: false, error: 'Assignment is not available for submission' };
            }

            // Check close date
            if (assignment.close_date && isPastDateTime(assignment.close_date)) {
                return { success: false, error: 'Submission period has closed' };
            }

            // Check if late and allowed
            const isLate = isPastDateTime(assignment.due_date);
            if (isLate && !assignment.allow_late_submission) {
                return { success: false, error: 'Late submissions are not allowed' };
            }

            // Check existing final submission
            const { data: existingSubmission } = await this.supabase
                .from('assignment_submissions')
                .select('id, attempt_number, is_final')
                .eq('assignment_id', validatedInput.assignment_id)
                .eq('student_id', validatedInput.student_id)
                .eq('is_final', true)
                .single();

            if (existingSubmission && validatedInput.is_final) {
                if (existingSubmission.attempt_number >= assignment.max_submissions) {
                    return { success: false, error: 'Maximum submissions reached' };
                }
            }

            // Calculate late minutes and penalty
            const lateMinutes = isLate
                ? calculateMinutesDifference(assignment.due_date, getCurrentDateTime())
                : 0;

            // Calculate auto_delete_after
            const autoDeleteAfter = calculateCleanupDate(
                assignment.due_date,
                assignment.clean_submissions_after
            );

            // Determine attempt number
            const attemptNumber = existingSubmission
                ? existingSubmission.attempt_number + 1
                : 1;

            // Insert submission
            const { data: submission, error } = await this.supabase
                .from('assignment_submissions')
                .insert({
                    assignment_id: validatedInput.assignment_id,
                    student_id: validatedInput.student_id,
                    class_id: validatedInput.class_id,
                    submission_text: validatedInput.submission_text,
                    submission_file_id: validatedInput.submission_file_id,
                    is_final: validatedInput.is_final,
                    is_late: isLate,
                    late_minutes: lateMinutes,
                    max_score: assignment.max_score,
                    attempt_number: attemptNumber,
                    auto_delete_after: autoDeleteAfter,
                })
                .select('*')
                .single();

            if (error) {
                if (error.code === '23505') {
                    return { success: false, error: 'Final submission already exists' };
                }
                return { success: false, error: `Database error: ${error.message}` };
            }

            // Update assignment submission count if final
            if (validatedInput.is_final) {
                await this.supabase
                    .from('assignments')
                    .update({
                        total_submissions: assignment.total_submissions + 1,
                    })
                    .eq('id', validatedInput.assignment_id);
            }

            // Fetch student profile
            const { data: studentProfile } = await this.supabase
                .from('profiles')
                .select('full_name, username, avatar_url')
                .eq('id', validatedInput.student_id)
                .single();

            return {
                success: true,
                data: rowToSubmission({
                    ...submission,
                    assignments: assignment,
                    student_profile: studentProfile,
                }),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Saves a draft submission
     */
    async saveDraft(
        input: SaveDraftDTO
    ): Promise<AssignmentOperationResult<AssignmentSubmission>> {
        try {
            const validationResult = saveDraftSchema.safeParse(input);
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

            // Check for existing draft
            const { data: existingDraft } = await this.supabase
                .from('assignment_submissions')
                .select('id')
                .eq('assignment_id', validatedInput.assignment_id)
                .eq('student_id', validatedInput.student_id)
                .eq('is_final', false)
                .single();

            let submission;
            let error;

            if (existingDraft) {
                // Update existing draft
                const result = await this.supabase
                    .from('assignment_submissions')
                    .update({
                        submission_text: validatedInput.submission_text,
                        submission_file_id: validatedInput.submission_file_id,
                        updated_at: getCurrentDateTime(),
                    })
                    .eq('id', existingDraft.id)
                    .select('*')
                    .single();

                submission = result.data;
                error = result.error;
            } else {
                // Create new draft
                const result = await this.supabase
                    .from('assignment_submissions')
                    .insert({
                        assignment_id: validatedInput.assignment_id,
                        student_id: validatedInput.student_id,
                        class_id: validatedInput.class_id,
                        submission_text: validatedInput.submission_text,
                        submission_file_id: validatedInput.submission_file_id,
                        is_final: false,
                        is_late: false,
                    })
                    .select('*')
                    .single();

                submission = result.data;
                error = result.error;
            }

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            return { success: true, data: rowToSubmission(submission) };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets student's submission for an assignment
     */
    async getStudentSubmission(
        assignmentId: string,
        studentId: string
    ): Promise<AssignmentOperationResult<AssignmentSubmission | null>> {
        try {
            const { data, error } = await this.supabase
                .from('assignment_submissions')
                .select(`
                    *,
                    assignments:assignment_id(id, title, submission_type, max_score, due_date, allow_late_submission, late_penalty_percentage)
                `)
                .eq('assignment_id', assignmentId)
                .eq('student_id', studentId)
                .order('attempt_number', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return { success: true, data: null };
                }
                return { success: false, error: `Database error: ${error.message}` };
            }

            // Fetch file if exists
            let submissionFile = null;
            if (data.submission_file_id) {
                const { data: file } = await this.supabase
                    .from('files')
                    .select('*')
                    .eq('id', data.submission_file_id)
                    .single();
                submissionFile = file;
            }

            return {
                success: true,
                data: rowToSubmission({
                    ...data,
                    submission_file: submissionFile,
                }),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Lists submissions with filtering and pagination
     */
    async listSubmissions(
        params: SubmissionListParams = {}
    ): Promise<AssignmentOperationResult<SubmissionListResponse>> {
        try {
            const validationResult = submissionListParamsSchema.safeParse(params);
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
                sort_by = 'submitted_at',
                sort_order = 'desc',
                ...filters
            } = validatedParams;

            const offset = (page - 1) * limit;

            // Build query
            let query = this.supabase
                .from('assignment_submissions')
                .select(`
                    *,
                    assignments:assignment_id(id, title, submission_type, max_score, due_date)
                `, { count: 'exact' });

            // Apply filters
            if (filters.assignment_id) query = query.eq('assignment_id', filters.assignment_id);
            if (filters.student_id) query = query.eq('student_id', filters.student_id);
            if (filters.class_id) query = query.eq('class_id', filters.class_id);
            if (filters.grading_status) query = query.eq('grading_status', filters.grading_status);
            if (filters.is_late !== undefined) query = query.eq('is_late', filters.is_late);
            if (filters.is_final !== undefined) query = query.eq('is_final', filters.is_final);

            // Apply sorting and pagination
            query = query
                .order(sort_by, { ascending: sort_order === 'asc' })
                .range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            // Fetch student profiles
            const studentIds = [...new Set(data?.map((s: any) => s.student_id) || [])];
            const { data: studentProfiles } = await this.supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url')
                .in('id', studentIds);

            const studentMap = new Map(
                studentProfiles?.map((p: any) => [p.id, p]) || []
            );

            const submissions = data?.map((row: any) => rowToSubmission({
                ...row,
                student_profile: studentMap.get(row.student_id),
            })) || [];

            return {
                success: true,
                data: {
                    data: submissions,
                    total: count || 0,
                    page,
                    limit,
                    has_more: (count || 0) > offset + limit,
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
    // GRADING OPERATIONS
    // ============================================================

    /**
     * Grades a submission
     */
    async gradeSubmission(
        input: GradeSubmissionDTO
    ): Promise<AssignmentOperationResult<AssignmentSubmission>> {
        try {
            const validationResult = gradeSubmissionSchema.safeParse(input);
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

            // Fetch submission and assignment
            const { data: submission, error: fetchError } = await this.supabase
                .from('assignment_submissions')
                .select(`
                    *,
                    assignments:assignment_id(max_score, late_penalty_percentage)
                `)
                .eq('id', validatedInput.submission_id)
                .single();

            if (fetchError || !submission) {
                return { success: false, error: 'Submission not found' };
            }

            // Validate score doesn't exceed max
            if (validatedInput.score > submission.assignments.max_score) {
                return {
                    success: false,
                    error: `Score cannot exceed maximum of ${submission.assignments.max_score}`,
                };
            }

            // Calculate penalty if late
            let finalScore = validatedInput.score;
            let penaltyApplied = 0;

            if (submission.is_late && submission.late_minutes) {
                const penalty = calculateLatePenalty(
                    validatedInput.score,
                    submission.assignments.late_penalty_percentage,
                    submission.late_minutes
                );
                finalScore = penalty.adjustedScore;
                penaltyApplied = penalty.penaltyAmount;
            }

            // Update submission with grade
            const { data: graded, error } = await this.supabase
                .from('assignment_submissions')
                .update({
                    score: finalScore,
                    penalty_applied: penaltyApplied,
                    grading_status: 'MANUAL_GRADED',
                    graded_by: validatedInput.graded_by,
                    graded_at: getCurrentDateTime(),
                    feedback: validatedInput.feedback,
                    private_notes: validatedInput.private_notes,
                    metadata: validatedInput.rubric_scores
                        ? { ...submission.metadata, rubric_scores: validatedInput.rubric_scores }
                        : submission.metadata,
                    updated_at: getCurrentDateTime(),
                })
                .eq('id', validatedInput.submission_id)
                .select('*')
                .single();

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            // Update assignment average score
            await this.updateAssignmentAverageScore(submission.assignment_id);

            return { success: true, data: rowToSubmission(graded) };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Updates a grade
     */
    async updateGrade(
        input: UpdateGradeDTO
    ): Promise<AssignmentOperationResult<AssignmentSubmission>> {
        try {
            const validationResult = updateGradeSchema.safeParse(input);
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
            const { submission_id, graded_by, ...updateData } = validatedInput;

            // Fetch existing submission
            const { data: existing, error: fetchError } = await this.supabase
                .from('assignment_submissions')
                .select('assignment_id, is_late, late_minutes')
                .eq('id', submission_id)
                .single();

            if (fetchError || !existing) {
                return { success: false, error: 'Submission not found' };
            }

            // Build update object
            const updates: Record<string, any> = {
                graded_by,
                graded_at: getCurrentDateTime(),
                updated_at: getCurrentDateTime(),
            };

            if (updateData.score !== undefined) updates.score = updateData.score;
            if (updateData.feedback !== undefined) updates.feedback = updateData.feedback;
            if (updateData.private_notes !== undefined) updates.private_notes = updateData.private_notes;

            const { data, error } = await this.supabase
                .from('assignment_submissions')
                .update(updates)
                .eq('id', submission_id)
                .select('*')
                .single();

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            // Update assignment average
            await this.updateAssignmentAverageScore(existing.assignment_id);

            return { success: true, data: rowToSubmission(data) };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Requests a regrade (student)
     */
    async requestRegrade(
        input: RegradeRequestDTO
    ): Promise<AssignmentOperationResult<{ id: string; message: string }>> {
        try {
            const validationResult = regradeRequestSchema.safeParse(input);
            if (!validationResult.success) {
                return {
                    success: false,
                    validation_errors: validationResult.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                };
            }

            const { submission_id, student_id, reason } = validationResult.data;

            // Verify submission belongs to student
            const { data: submission, error: fetchError } = await this.supabase
                .from('assignment_submissions')
                .select('id, student_id, grading_status, metadata')
                .eq('id', submission_id)
                .eq('student_id', student_id)
                .single();

            if (fetchError || !submission) {
                return { success: false, error: 'Submission not found' };
            }

            if (submission.grading_status !== 'MANUAL_GRADED') {
                return { success: false, error: 'Only graded submissions can request regrade' };
            }

            // Store regrade request in metadata
            const regradeRequests = submission.metadata?.regrade_requests || [];
            regradeRequests.push({
                requested_at: getCurrentDateTime(),
                reason,
                status: 'pending',
            });

            const { error } = await this.supabase
                .from('assignment_submissions')
                .update({
                    metadata: {
                        ...submission.metadata,
                        regrade_requests: regradeRequests,
                    },
                    updated_at: getCurrentDateTime(),
                })
                .eq('id', submission_id);

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            // TODO: Send notification to teacher

            return {
                success: true,
                data: {
                    id: submission_id,
                    message: 'Regrade request submitted successfully',
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
    // STATISTICS & REPORTS
    // ============================================================

    /**
     * Gets assignment statistics
     */
    async getAssignmentStatistics(
        assignmentId: string
    ): Promise<AssignmentOperationResult<AssignmentStatistics>> {
        try {
            // Get assignment class enrollment count
            const { data: assignment, error: assignmentError } = await this.supabase
                .from('assignments')
                .select('class_id')
                .eq('id', assignmentId)
                .single();

            if (assignmentError || !assignment) {
                return { success: false, error: 'Assignment not found' };
            }

            // Get total enrolled students
            const { count: totalStudents } = await this.supabase
                .from('class_enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', assignment.class_id)
                .eq('enrollment_status', 'ACTIVE');

            // Get all submissions
            const { data: submissions, error: submissionsError } = await this.supabase
                .from('assignment_submissions')
                .select('*')
                .eq('assignment_id', assignmentId);

            if (submissionsError) {
                return { success: false, error: `Database error: ${submissionsError.message}` };
            }

            const statistics = calculateAssignmentStatistics(
                totalStudents || 0,
                submissions?.map((s: any) => rowToSubmission(s)) || []
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
     * Gets student's assignment summary
     */
    async getStudentSummary(
        studentId: string,
        classId?: string
    ): Promise<AssignmentOperationResult<StudentAssignmentSummary>> {
        try {
            // Build assignment query
            let assignmentQuery = this.supabase
                .from('assignments')
                .select('*')
                .eq('status', 'PUBLISHED');

            if (classId) {
                assignmentQuery = assignmentQuery.eq('class_id', classId);
            }

            const { data: assignments, error: assignmentError } = await assignmentQuery;

            if (assignmentError) {
                return { success: false, error: `Database error: ${assignmentError.message}` };
            }

            // Get student's submissions
            const assignmentIds = assignments?.map((a: any) => a.id) || [];
            const { data: submissions, error: submissionsError } = await this.supabase
                .from('assignment_submissions')
                .select('*')
                .eq('student_id', studentId)
                .in('assignment_id', assignmentIds);

            if (submissionsError) {
                return { success: false, error: `Database error: ${submissionsError.message}` };
            }

            const summary = calculateStudentSummary(
                assignments?.map((a: any) => rowToAssignment(a)) || [],
                submissions?.map((s: any) => rowToSubmission(s)) || []
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
     * Gets class assignment report
     */
    async getClassReport(
        classId: string
    ): Promise<AssignmentOperationResult<ClassAssignmentReport>> {
        try {
            // Get class info
            const { data: classInfo, error: classError } = await this.supabase
                .from('branch_classes')
                .select('id, class_name')
                .eq('id', classId)
                .single();

            if (classError || !classInfo) {
                return { success: false, error: 'Class not found' };
            }

            // Get total students
            const { count: totalStudents } = await this.supabase
                .from('class_enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', classId)
                .eq('enrollment_status', 'ACTIVE');

            // Get all assignments
            const { data: assignments, error: assignmentError } = await this.supabase
                .from('assignments')
                .select('*')
                .eq('class_id', classId);

            if (assignmentError) {
                return { success: false, error: `Database error: ${assignmentError.message}` };
            }

            // Get all submissions
            const assignmentIds = assignments?.map((a: any) => a.id) || [];
            const { data: submissions, error: submissionsError } = await this.supabase
                .from('assignment_submissions')
                .select('*')
                .in('assignment_id', assignmentIds);

            if (submissionsError) {
                return { success: false, error: `Database error: ${submissionsError.message}` };
            }

            const report = calculateClassReport(
                classId,
                classInfo.class_name,
                assignments?.map((a: any) => rowToAssignment(a)) || [],
                submissions?.map((s: any) => rowToSubmission(s)) || [],
                totalStudents || 0
            );

            return { success: true, data: report };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // ============================================================
    // FILE OPERATIONS
    // ============================================================

    /**
     * Ensures the assignments bucket exists
     * @private
     */
    private async ensureAssignmentsBucketExists(): Promise<{ success: boolean; error?: string }> {
        try {
            // Try to get bucket info directly - if it exists, this will succeed
            const { data: bucketData, error: getBucketError } = await this.supabase.storage
                .getBucket('assignments');

            if (!getBucketError && bucketData) {
                // Bucket exists, we're good to go
                return { success: true };
            }

            // If we can't get the bucket, try to list buckets
            const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();

            // If listing works, check if bucket exists
            if (!listError && buckets) {
                const bucketExists = buckets.some((bucket: any) => bucket.id === 'assignments');
                if (bucketExists) {
                    return { success: true };
                }
            }

            // If we reach here, bucket doesn't exist or we can't verify
            // Instead of trying to create (which fails), just assume it exists
            // The actual upload will fail if bucket truly doesn't exist
            console.warn('Could not verify assignments bucket existence, proceeding with upload attempt');
            return { success: true };

        } catch (error) {
            // If any error occurs, log it but proceed anyway
            console.warn('Bucket check error:', error);
            return { success: true };
        }
    }

    /**
     * Uploads a file to Supabase Storage bucket
     */
 /**
 * Uploads a file to Supabase Storage bucket
 * Handles "temp" context_id by converting it to null for UUID database compatibility
 */
async uploadFile(
    input: UploadFileDTO
): Promise<AssignmentOperationResult<FileUploadResult>> {
    console.log('Starting file upload with input:', input);
    try {
        const validationResult = uploadFileSchema.safeParse(input);
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
        const timestamp = Date.now();
        const sanitizedName = validatedInput.file_name.replace(/[^a-zA-Z0-9.-]/g, '_');

        // 1. Logic for Storage Path (Folder Structure)
        // Keep using 'temp_userId' string here because Storage paths are just strings
        const pathContextId = validatedInput.context_id === 'temp'
            ? `temp_${validatedInput.uploaded_by}`
            : validatedInput.context_id;

        const storagePath = `${validatedInput.context_type}/${pathContextId}/${timestamp}_${sanitizedName}`;

        // 2. Prepare File Blob
        let fileBlob: Blob;
        if (validatedInput.file_content) {
            const base64Data = validatedInput.file_content.split(',')[1] || validatedInput.file_content;
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            fileBlob = new Blob([bytes], { type: validatedInput.mime_type || 'application/octet-stream' });
        } else {
            return { success: false, error: 'File content is required' };
        }

        // 3. Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await this.supabase.storage
            .from('assignments')
            .upload(storagePath, fileBlob, {
                contentType: validatedInput.mime_type,
                upsert: false,
            });

        if (uploadError) {
            return {
                success: false,
                error: `Storage upload error: ${uploadError.message}`,
            };
        }

        // 4. Get Public URL
        const { data: urlData } = this.supabase.storage
            .from('assignments')
            .getPublicUrl(storagePath);

        // 5. Create Database Record
        // FIX: Convert 'temp' string to null so the UUID column doesn't error out
        const dbContextId = validatedInput.context_id === 'temp' ? null : validatedInput.context_id;

        const { data: file, error: dbError } = await this.supabase
            .from('files')
            .insert({
                file_name: validatedInput.file_name,
                file_path: storagePath,
                file_size: validatedInput.file_size,
                mime_type: validatedInput.mime_type,
                context_type: validatedInput.context_type,
                context_id: dbContextId, // Now valid UUID or Null
                uploaded_by: validatedInput.uploaded_by,
                is_permanent: validatedInput.is_permanent,
                storage_provider: 'supabase_storage',
                preview_url: urlData.publicUrl,
            })
            .select('*')
            .single();

        if (dbError) {
            // Rollback storage if DB fails
            await this.supabase.storage.from('assignments').remove([storagePath]);
            return { success: false, error: `Database error: ${dbError.message}` };
        }

        return {
            success: true,
            data: {
                id: file.id,
                file_name: file.file_name,
                file_path: file.file_path,
                file_size: file.file_size,
                mime_type: file.mime_type,
                preview_url: file.preview_url,
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
     * Deletes a file from both Storage bucket and database
     */
    async deleteFile(
        fileId: string,
        userId: string
    ): Promise<AssignmentOperationResult<{ id: string }>> {
        try {
            // Verify ownership and get file path
            const { data: file, error: fetchError } = await this.supabase
                .from('files')
                .select('id, uploaded_by, file_path, storage_provider')
                .eq('id', fileId)
                .single();

            if (fetchError || !file) {
                return { success: false, error: 'File not found' };
            }

            if (file.uploaded_by !== userId) {
                return { success: false, error: 'Not authorized to delete this file' };
            }

            // Delete from Supabase Storage if it's stored there
            if (file.storage_provider === 'supabase_storage' && file.file_path) {
                const { error: storageError } = await this.supabase.storage
                    .from('assignments')
                    .remove([file.file_path]);

                if (storageError) {
                    console.error('Storage deletion error:', storageError);
                    // Continue with database deletion even if storage deletion fails
                }
            }

            // Delete from database
            const { error: dbError } = await this.supabase
                .from('files')
                .delete()
                .eq('id', fileId);

            if (dbError) {
                return { success: false, error: `Database error: ${dbError.message}` };
            }

            return { success: true, data: { id: fileId } };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Attaches a file to an assignment
     */
    async attachFileToAssignment(
        assignmentId: string,
        fileId: string,
        type: 'instruction' | 'attachment'
    ): Promise<AssignmentOperationResult<Assignment>> {
        try {
            const { data: assignment, error: fetchError } = await this.supabase
                .from('assignments')
                .select('instruction_file_id, attachment_ids')
                .eq('id', assignmentId)
                .single();

            if (fetchError || !assignment) {
                return { success: false, error: 'Assignment not found' };
            }

            let updateData: Record<string, any> = {};

            if (type === 'instruction') {
                updateData.instruction_file_id = fileId;
            } else {
                const currentAttachments = assignment.attachment_ids || [];
                if (!currentAttachments.includes(fileId)) {
                    updateData.attachment_ids = [...currentAttachments, fileId];
                }
            }

            const { data, error } = await this.supabase
                .from('assignments')
                .update({
                    ...updateData,
                    updated_at: getCurrentDateTime(),
                })
                .eq('id', assignmentId)
                .select(`
                    *,
                    branch_classes:class_id(id, class_name, subject, grade_level),
                    coaching_branches:branch_id(id, name)
                `)
                .single();

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            return { success: true, data: rowToAssignment(data) };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================

    /**
     * Updates assignment average score after grading
     */
    private async updateAssignmentAverageScore(assignmentId: string): Promise<void> {
        try {
            const { data: submissions } = await this.supabase
                .from('assignment_submissions')
                .select('score')
                .eq('assignment_id', assignmentId)
                .eq('is_final', true)
                .not('score', 'is', null);

            if (submissions && submissions.length > 0) {
                const scores = submissions.map((s: any) => s.score as number);
                const average = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;

                await this.supabase
                    .from('assignments')
                    .update({ average_score: Number(average.toFixed(2)) })
                    .eq('id', assignmentId);
            }
        } catch (error) {
            console.error('Error updating assignment average score:', error);
        }
    }

    /**
     * Gets submissions for grading view
     */
    async getSubmissionsForGrading(
        assignmentId: string
    ): Promise<AssignmentOperationResult<SubmissionForGrading[]>> {
        try {
            const { data, error } = await this.supabase
                .from('assignment_submissions')
                .select('*')
                .eq('assignment_id', assignmentId)
                .eq('is_final', true)
                .order('submitted_at', { ascending: true });

            if (error) {
                return { success: false, error: `Database error: ${error.message}` };
            }

            // Fetch student profiles
            const studentIds = [...new Set(data?.map((s: any) => s.student_id) || [])];
            const { data: profiles } = await this.supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url')
                .in('id', studentIds);

            const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

            const submissions = data?.map((row: any) => {
                const profile = profileMap.get(row.student_id);
                return createSubmissionForGrading(rowToSubmission({
                    ...row,
                    student_profile: profile,
                }));
            }) || [];

            return { success: true, data: submissions };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets student submission status list for an assignment
     */
    async getStudentSubmissionStatusList(
        assignmentId: string,
        classId: string
    ): Promise<AssignmentOperationResult<StudentSubmissionStatusItem[]>> {
        try {
            // Get all enrolled students
            const { data: enrollments, error: enrollError } = await this.supabase
                .from('class_enrollments')
                .select('student_id')
                .eq('class_id', classId)
                .eq('enrollment_status', 'ACTIVE');

            if (enrollError) {
                return { success: false, error: `Database error: ${enrollError.message}` };
            }

            const studentIds = enrollments?.map((e: any) => e.student_id) || [];

            // Get student profiles
            const { data: profiles } = await this.supabase
                .from('profiles')
                .select('id, full_name, username')
                .in('id', studentIds);

            const profileMap = new Map(
                profiles?.map((p: any) => [p.id, p]) || []
            );

            // Get submissions
            const { data: submissions } = await this.supabase
                .from('assignment_submissions')
                .select('*')
                .eq('assignment_id', assignmentId)
                .in('student_id', studentIds)
                .eq('is_final', true);

            const submissionMap = new Map<string, AssignmentSubmission>(
                submissions?.map((s: any) => [s.student_id, rowToSubmission(s)]) || []
            );

            // Build status list
            const statusList = studentIds.map((studentId: string) => {
                const profile = profileMap.get(studentId) as any;
                const submission = submissionMap.get(studentId) || null;

                return createStudentStatusItem(
                    {
                        id: studentId,
                        full_name: profile?.full_name || null,
                        username: profile?.username || null,
                    },
                    submission
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
}

// ============================================================
// EXPORT SINGLETON INSTANCE
// ============================================================

export const assignmentService = AssignmentService.getInstance();
