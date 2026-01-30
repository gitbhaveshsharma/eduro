/**
 * Branch Teacher Service
 * 
 * Singleton service for managing branch teacher assignments
 * Handles all database operations and API interactions
 * 
 * @module branch-system/services/branch-teacher
 */

import { createClient } from '@/lib/supabase/client';
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
    BranchTeacherOperationResult,
    TeacherAssignmentSummary,
} from '../types/branch-teacher.types';
import type { TeacherDashboardStats } from '../types/teacher-dashboard.types';
import {
    assignTeacherSchema,
    updateTeacherSelfSchema,
    updateTeacherByManagerSchema,
    branchTeacherFilterSchema,
    branchTeacherSortSchema,
    paginationSchema,
} from '../validations/branch-teacher.validation';
import {
    toPublicBranchTeacher,
    toPublicBranchTeachers,
    calculateBranchTeacherStats,
    calculateTeacherAssignmentSummary,
    getTeachersNeedingAttention,
    getTeachersBySubject,
} from '../utils/branch-teacher.utils';

/**
 * Branch Teacher Service
 * Singleton service for managing branch teacher assignments
 */
export class BranchTeacherService {
    private static instance: BranchTeacherService;
    private supabase = createClient();

    // Table name
    private readonly TABLE_NAME = 'branch_teacher';

    private constructor() { }

    /**
     * Gets singleton instance
     */
    static getInstance(): BranchTeacherService {
        if (!BranchTeacherService.instance) {
            BranchTeacherService.instance = new BranchTeacherService();
        }
        return BranchTeacherService.instance;
    }

    // ============================================================
    // CREATE OPERATIONS
    // ============================================================

    /**
     * Assigns a teacher to a branch
     * The database trigger will auto-populate teacher snapshot from profiles
     * 
     * @param input - Assignment data
     * @returns Operation result with assignment data
     */
    async assignTeacher(
        input: AssignTeacherInput
    ): Promise<BranchTeacherOperationResult<BranchTeacher>> {
        try {
            // Validate input
            const validation = assignTeacherSchema.safeParse(input);
            if (!validation.success) {
                return {
                    success: false,
                    error: 'Validation failed',
                    validation_errors: validation.error.errors.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message,
                        code: err.code,
                    })),
                };
            }

            // Prepare data for insert
            const insertData = {
                teacher_id: validation.data.teacher_id,
                branch_id: validation.data.branch_id,
                teaching_subjects: validation.data.teaching_subjects,
                assignment_date: validation.data.assignment_date || new Date().toISOString().split('T')[0],
                assignment_end_date: validation.data.assignment_end_date || null,
                teaching_experience_years: validation.data.teaching_experience_years || null,
                hourly_rate: validation.data.hourly_rate || null,
                available_days: validation.data.available_days || null,
                available_start_time: validation.data.available_start_time || null,
                available_end_time: validation.data.available_end_time || null,
                assignment_notes: validation.data.assignment_notes || null,
                metadata: validation.data.metadata || {},
            };

            // Insert the assignment (trigger will populate teacher snapshot)
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .insert(insertData)
                .select()
                .single();

            if (error) {
                // Handle duplicate assignment error
                if (error.code === '23505') {
                    return {
                        success: false,
                        error: 'Teacher is already assigned to this branch',
                    };
                }

                // Handle foreign key violation (teacher doesn't exist or isn't eligible)
                if (error.code === '23503') {
                    return {
                        success: false,
                        error: 'Invalid teacher or branch ID',
                    };
                }

                // Handle trigger exception (invalid teacher role)
                if (error.message.includes('Only active teachers')) {
                    return {
                        success: false,
                        error: 'Only active teachers, coaches, or admins can be assigned to branches',
                    };
                }

                return {
                    success: false,
                    error: `Failed to assign teacher: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data as BranchTeacher,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // ============================================================
    // READ OPERATIONS
    // ============================================================

    /**
     * Gets an assignment by ID
     * 
     * @param assignmentId - Assignment UUID
     * @returns Operation result with assignment data
     */
    async getAssignmentById(
        assignmentId: string
    ): Promise<BranchTeacherOperationResult<BranchTeacher>> {
        try {
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .select('*')
                .eq('id', assignmentId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return {
                        success: false,
                        error: 'Assignment not found',
                    };
                }
                return {
                    success: false,
                    error: `Failed to fetch assignment: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data as BranchTeacher,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets assignment with relations (profile, branch, classes)
     * 
     * @param assignmentId - Assignment UUID
     * @returns Operation result with enriched assignment data
     */
    async getAssignmentWithRelations(
        assignmentId: string
    ): Promise<BranchTeacherOperationResult<BranchTeacherWithRelations>> {
        try {
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .select(`
                    *,
                    profile:profiles!branch_teacher_teacher_id_fkey(
                        id,
                        full_name,
                        username,
                        email,
                        avatar_url,
                        phone,
                        role,
                        qualification,
                        specialization
                    ),
                    branch:coaching_branches!branch_teacher_branch_id_fkey(
                        id,
                        branch_name,
                        branch_code,
                        coaching_center_id,
                        address
                    )
                `)
                .eq('id', assignmentId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return {
                        success: false,
                        error: 'Assignment not found',
                    };
                }
                return {
                    success: false,
                    error: `Failed to fetch assignment: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data as BranchTeacherWithRelations,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets teacher's assignment in a specific branch
     * 
     * @param teacherId - Teacher UUID
     * @param branchId - Branch UUID
     * @returns Operation result with assignment data
     */
    async getTeacherAssignmentInBranch(
        teacherId: string,
        branchId: string
    ): Promise<BranchTeacherOperationResult<BranchTeacher>> {
        try {
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .select('*')
                .eq('teacher_id', teacherId)
                .eq('branch_id', branchId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return {
                        success: false,
                        error: 'Teacher is not assigned to this branch',
                    };
                }
                return {
                    success: false,
                    error: `Failed to fetch assignment: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data as BranchTeacher,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets all assignments for a teacher
     * 
     * @param teacherId - Teacher UUID
     * @returns Operation result with assignments array
     */
    async getTeacherAssignments(
        teacherId: string
    ): Promise<BranchTeacherOperationResult<BranchTeacher[]>> {
        try {
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .select('*')
                .eq('teacher_id', teacherId)
                .order('assignment_date', { ascending: false });

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch assignments: ${error.message}`,
                };
            }

            return {
                success: true,
                data: (data || []) as BranchTeacher[],
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Lists all teachers in a branch with filters, sorting, and pagination
     * 
     * @param branchId - Branch UUID
     * @param filters - Optional filters
     * @param sort - Optional sort parameters
     * @param pagination - Optional pagination
     * @returns Search result with teachers and metadata
     */
    async getBranchTeachers(
        branchId: string,
        filters?: BranchTeacherFilters,
        sort?: BranchTeacherSort,
        pagination?: PaginationOptions
    ): Promise<BranchTeacherOperationResult<BranchTeacherSearchResult>> {
        try {
            // Validate inputs
            const validatedFilters = filters
                ? branchTeacherFilterSchema.parse({ ...filters, branch_id: branchId })
                : { branch_id: branchId };
            const validatedSort = sort
                ? branchTeacherSortSchema.parse(sort)
                : { field: 'teacher_name', direction: 'asc' };
            const validatedPagination = pagination
                ? paginationSchema.parse(pagination)
                : { page: 1, limit: 20 };

            // Calculate offset
            const offset = (validatedPagination.page - 1) * validatedPagination.limit;

            // Build query
            let query = this.supabase
                .from(this.TABLE_NAME)
                .select('*', { count: 'exact' })
                .eq('branch_id', branchId);

            // Apply filters
            if (validatedFilters.teacher_id) {
                query = query.eq('teacher_id', validatedFilters.teacher_id);
            }

            if (validatedFilters.is_active !== undefined) {
                query = query.eq('is_active', validatedFilters.is_active);
            }

            if (validatedFilters.teaching_subjects && validatedFilters.teaching_subjects.length > 0) {
                query = query.overlaps('teaching_subjects', validatedFilters.teaching_subjects);
            }

            if (validatedFilters.available_day) {
                query = query.contains('available_days', [validatedFilters.available_day]);
            }

            if (validatedFilters.assignment_date_from) {
                query = query.gte('assignment_date', validatedFilters.assignment_date_from);
            }

            if (validatedFilters.assignment_date_to) {
                query = query.lte('assignment_date', validatedFilters.assignment_date_to);
            }

            if (validatedFilters.experience_min !== undefined) {
                query = query.gte('teaching_experience_years', validatedFilters.experience_min);
            }

            if (validatedFilters.experience_max !== undefined) {
                query = query.lte('teaching_experience_years', validatedFilters.experience_max);
            }

            if (validatedFilters.search_query) {
                query = query.or(
                    `teacher_name.ilike.%${validatedFilters.search_query}%,` +
                    `teacher_email.ilike.%${validatedFilters.search_query}%,` +
                    `teacher_username.ilike.%${validatedFilters.search_query}%`
                );
            }

            // Apply sorting
            const sortColumn = validatedSort.field;
            const ascending = validatedSort.direction === 'asc';
            query = query.order(sortColumn, { ascending });

            // Apply pagination
            query = query.range(offset, offset + validatedPagination.limit - 1);

            // Execute query
            const { data, error, count } = await query;

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch teachers: ${error.message}`,
                };
            }

            const teachers = (data || []) as BranchTeacher[];
            const totalCount = count || 0;
            const totalPages = Math.ceil(totalCount / validatedPagination.limit);

            return {
                success: true,
                data: {
                    teachers: toPublicBranchTeachers(teachers),
                    total_count: totalCount,
                    page: validatedPagination.page,
                    limit: validatedPagination.limit,
                    total_pages: totalPages,
                    has_more: validatedPagination.page < totalPages,
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
     * Gets all teachers across all branches of a coaching center
     * 
     * @param coachingCenterId - Coaching center UUID
     * @param filters - Optional filters
     * @param sort - Optional sort parameters
     * @param pagination - Optional pagination
     * @returns Search result with teachers and metadata
     */
    async getCoachingCenterTeachers(
        coachingCenterId: string,
        filters?: BranchTeacherFilters,
        sort?: BranchTeacherSort,
        pagination?: PaginationOptions
    ): Promise<BranchTeacherOperationResult<BranchTeacherSearchResult>> {
        try {
            // First get all branches for this coaching center
            const { data: branches, error: branchError } = await this.supabase
                .from('coaching_branches')
                .select('id')
                .eq('coaching_center_id', coachingCenterId);

            if (branchError) {
                return {
                    success: false,
                    error: `Failed to fetch branches: ${branchError.message}`,
                };
            }

            if (!branches || branches.length === 0) {
                return {
                    success: true,
                    data: {
                        teachers: [],
                        total_count: 0,
                        page: 1,
                        limit: 20,
                        total_pages: 0,
                        has_more: false,
                    },
                };
            }

            const branchIds = branches.map((b: { id: string }) => b.id);

            // Validate inputs
            const validatedFilters = filters
                ? branchTeacherFilterSchema.parse(filters)
                : {};
            const validatedSort = sort
                ? branchTeacherSortSchema.parse(sort)
                : { field: 'teacher_name', direction: 'asc' };
            const validatedPagination = pagination
                ? paginationSchema.parse(pagination)
                : { page: 1, limit: 20 };

            // Calculate offset
            const offset = (validatedPagination.page - 1) * validatedPagination.limit;

            // Build query
            let query = this.supabase
                .from(this.TABLE_NAME)
                .select('*', { count: 'exact' })
                .in('branch_id', branchIds);

            // Apply filters (same as getBranchTeachers)
            if (validatedFilters.teacher_id) {
                query = query.eq('teacher_id', validatedFilters.teacher_id);
            }

            if (validatedFilters.is_active !== undefined) {
                query = query.eq('is_active', validatedFilters.is_active);
            }

            if (validatedFilters.teaching_subjects && validatedFilters.teaching_subjects.length > 0) {
                query = query.overlaps('teaching_subjects', validatedFilters.teaching_subjects);
            }

            if (validatedFilters.search_query) {
                query = query.or(
                    `teacher_name.ilike.%${validatedFilters.search_query}%,` +
                    `teacher_email.ilike.%${validatedFilters.search_query}%`
                );
            }

            // Apply sorting
            const sortColumn = validatedSort.field;
            const ascending = validatedSort.direction === 'asc';
            query = query.order(sortColumn, { ascending });

            // Apply pagination
            query = query.range(offset, offset + validatedPagination.limit - 1);

            // Execute query
            const { data, error, count } = await query;

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch teachers: ${error.message}`,
                };
            }

            const teachers = (data || []) as BranchTeacher[];
            const totalCount = count || 0;
            const totalPages = Math.ceil(totalCount / validatedPagination.limit);

            return {
                success: true,
                data: {
                    teachers: toPublicBranchTeachers(teachers),
                    total_count: totalCount,
                    page: validatedPagination.page,
                    limit: validatedPagination.limit,
                    total_pages: totalPages,
                    has_more: validatedPagination.page < totalPages,
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
     * Gets teachers by subject in a branch
     * 
     * @param branchId - Branch UUID
     * @param subject - Subject to filter by
     * @returns Operation result with teachers array
     */
    async getTeachersBySubject(
        branchId: string,
        subject: string
    ): Promise<BranchTeacherOperationResult<PublicBranchTeacher[]>> {
        try {
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .select('*')
                .eq('branch_id', branchId)
                .eq('is_active', true)
                .contains('teaching_subjects', [subject]);

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch teachers: ${error.message}`,
                };
            }

            const teachers = (data || []) as BranchTeacher[];
            return {
                success: true,
                data: toPublicBranchTeachers(teachers),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // ============================================================
    // UPDATE OPERATIONS
    // ============================================================

    /**
     * Updates assignment (by teacher)
     * Teachers can only update availability and teaching details
     * 
     * @param assignmentId - Assignment UUID
     * @param teacherId - Teacher UUID (must match assignment)
     * @param input - Update data
     * @returns Operation result with updated assignment
     */
    async updateAssignmentByTeacher(
        assignmentId: string,
        teacherId: string,
        input: UpdateTeacherSelfInput
    ): Promise<BranchTeacherOperationResult<BranchTeacher>> {
        try {
            // Validate input
            const validation = updateTeacherSelfSchema.safeParse(input);
            if (!validation.success) {
                return {
                    success: false,
                    error: 'Validation failed',
                    validation_errors: validation.error.errors.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message,
                        code: err.code,
                    })),
                };
            }

            // Verify ownership
            const { data: existing, error: fetchError } = await this.supabase
                .from(this.TABLE_NAME)
                .select('teacher_id')
                .eq('id', assignmentId)
                .single();

            if (fetchError || !existing) {
                return {
                    success: false,
                    error: 'Assignment not found',
                };
            }

            if (existing.teacher_id !== teacherId) {
                return {
                    success: false,
                    error: 'You can only update your own assignments',
                };
            }

            // Build update data
            const updateData: Record<string, unknown> = {};
            if (validation.data.teaching_subjects !== undefined) {
                updateData.teaching_subjects = validation.data.teaching_subjects;
            }
            if (validation.data.teaching_experience_years !== undefined) {
                updateData.teaching_experience_years = validation.data.teaching_experience_years;
            }
            if (validation.data.available_days !== undefined) {
                updateData.available_days = validation.data.available_days;
            }
            if (validation.data.available_start_time !== undefined) {
                updateData.available_start_time = validation.data.available_start_time;
            }
            if (validation.data.available_end_time !== undefined) {
                updateData.available_end_time = validation.data.available_end_time;
            }
            if (validation.data.hourly_rate !== undefined) {
                updateData.hourly_rate = validation.data.hourly_rate;
            }

            // Perform update
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .update(updateData)
                .eq('id', assignmentId)
                .select()
                .single();

            if (error) {
                return {
                    success: false,
                    error: `Failed to update assignment: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data as BranchTeacher,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Updates assignment (by manager/coach)
     * Managers can update most fields
     * 
     * @param assignmentId - Assignment UUID
     * @param input - Update data
     * @returns Operation result with updated assignment
     */
    async updateAssignmentByManager(
        assignmentId: string,
        input: UpdateTeacherByManagerInput
    ): Promise<BranchTeacherOperationResult<BranchTeacher>> {
        try {
            // Validate input
            const validation = updateTeacherByManagerSchema.safeParse(input);
            if (!validation.success) {
                return {
                    success: false,
                    error: 'Validation failed',
                    validation_errors: validation.error.errors.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message,
                        code: err.code,
                    })),
                };
            }

            // Build update data
            const updateData: Record<string, unknown> = {};
            const validatedData = validation.data;

            if (validatedData.teaching_subjects !== undefined) {
                updateData.teaching_subjects = validatedData.teaching_subjects;
            }
            if (validatedData.teaching_experience_years !== undefined) {
                updateData.teaching_experience_years = validatedData.teaching_experience_years;
            }
            if (validatedData.hourly_rate !== undefined) {
                updateData.hourly_rate = validatedData.hourly_rate;
            }
            if (validatedData.available_days !== undefined) {
                updateData.available_days = validatedData.available_days;
            }
            if (validatedData.available_start_time !== undefined) {
                updateData.available_start_time = validatedData.available_start_time;
            }
            if (validatedData.available_end_time !== undefined) {
                updateData.available_end_time = validatedData.available_end_time;
            }
            if (validatedData.assignment_end_date !== undefined) {
                updateData.assignment_end_date = validatedData.assignment_end_date;
            }
            if (validatedData.is_active !== undefined) {
                updateData.is_active = validatedData.is_active;
            }
            if (validatedData.assignment_notes !== undefined) {
                updateData.assignment_notes = validatedData.assignment_notes;
            }
            if (validatedData.performance_notes !== undefined) {
                updateData.performance_notes = validatedData.performance_notes;
            }
            if (validatedData.metadata !== undefined) {
                updateData.metadata = validatedData.metadata;
            }

            // Perform update
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .update(updateData)
                .eq('id', assignmentId)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return {
                        success: false,
                        error: 'Assignment not found',
                    };
                }
                return {
                    success: false,
                    error: `Failed to update assignment: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data as BranchTeacher,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Deactivates a teacher assignment (soft delete)
     * Sets is_active to false
     * 
     * @param assignmentId - Assignment UUID
     * @returns Operation result
     */
    async deactivateAssignment(
        assignmentId: string
    ): Promise<BranchTeacherOperationResult<BranchTeacher>> {
        try {
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .update({
                    is_active: false,
                    assignment_end_date: new Date().toISOString().split('T')[0],
                })
                .eq('id', assignmentId)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return {
                        success: false,
                        error: 'Assignment not found',
                    };
                }
                return {
                    success: false,
                    error: `Failed to deactivate assignment: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data as BranchTeacher,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Reactivates a teacher assignment
     * Sets is_active to true and clears assignment_end_date
     * 
     * @param assignmentId - Assignment UUID
     * @returns Operation result
     */
    async reactivateAssignment(
        assignmentId: string
    ): Promise<BranchTeacherOperationResult<BranchTeacher>> {
        try {
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .update({
                    is_active: true,
                    assignment_end_date: null,
                })
                .eq('id', assignmentId)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return {
                        success: false,
                        error: 'Assignment not found',
                    };
                }
                return {
                    success: false,
                    error: `Failed to reactivate assignment: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data as BranchTeacher,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // ============================================================
    // DELETE OPERATIONS
    // ============================================================

    /**
     * Permanently deletes a teacher assignment
     * Use with caution - prefer deactivateAssignment for soft delete
     * 
     * @param assignmentId - Assignment UUID
     * @returns Operation result
     */
    async deleteAssignment(
        assignmentId: string
    ): Promise<BranchTeacherOperationResult<void>> {
        try {
            const { error } = await this.supabase
                .from(this.TABLE_NAME)
                .delete()
                .eq('id', assignmentId);

            if (error) {
                return {
                    success: false,
                    error: `Failed to delete assignment: ${error.message}`,
                };
            }

            return {
                success: true,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // ============================================================
    // STATISTICS OPERATIONS
    // ============================================================

    /**
     * Gets branch teacher statistics
     * 
     * @param branchId - Branch UUID
     * @returns Operation result with statistics
     */
    async getBranchTeacherStats(
        branchId: string
    ): Promise<BranchTeacherOperationResult<BranchTeacherStats>> {
        try {
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .select('*')
                .eq('branch_id', branchId);

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch statistics: ${error.message}`,
                };
            }

            const teachers = (data || []) as BranchTeacher[];
            const stats = calculateBranchTeacherStats(teachers);

            return {
                success: true,
                data: stats,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets teacher assignment summary
     * 
     * @param teacherId - Teacher UUID
     * @returns Operation result with summary
     */
    async getTeacherAssignmentSummary(
        teacherId: string
    ): Promise<BranchTeacherOperationResult<TeacherAssignmentSummary>> {
        try {
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .select('*')
                .eq('teacher_id', teacherId);

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch assignments: ${error.message}`,
                };
            }

            const assignments = (data || []) as BranchTeacher[];
            const summary = calculateTeacherAssignmentSummary(assignments);

            return {
                success: true,
                data: summary,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets teachers needing attention (inactive, ending soon)
     * 
     * @param branchId - Branch UUID
     * @param daysAhead - Days threshold (default 30)
     * @returns Operation result with teachers array
     */
    async getTeachersNeedingAttention(
        branchId: string,
        daysAhead: number = 30
    ): Promise<BranchTeacherOperationResult<PublicBranchTeacher[]>> {
        try {
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .select('*')
                .eq('branch_id', branchId);

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch teachers: ${error.message}`,
                };
            }

            const teachers = (data || []) as BranchTeacher[];
            const needingAttention = getTeachersNeedingAttention(teachers, daysAhead);

            return {
                success: true,
                data: toPublicBranchTeachers(needingAttention),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets unique subjects taught at a branch
     * 
     * @param branchId - Branch UUID
     * @returns Operation result with subjects array
     */
    async getBranchSubjects(
        branchId: string
    ): Promise<BranchTeacherOperationResult<string[]>> {
        try {
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .select('teaching_subjects')
                .eq('branch_id', branchId)
                .eq('is_active', true);

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch subjects: ${error.message}`,
                };
            }

            const allSubjects = (data || []).flatMap((t: { teaching_subjects: string[] }) => t.teaching_subjects);
            const uniqueSubjects = [...new Set(allSubjects)].sort() as string[];

            return {
                success: true,
                data: uniqueSubjects,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // ============================================================
    // DASHBOARD STATISTICS
    // ============================================================

    /**
     * Gets teacher dashboard statistics using RPC function
     * Calls get_teacher_dashboard_stats_v2 from the database
     * 
     * @param teacherId - Teacher UUID
     * @param branchId - Optional branch UUID to filter by
     * @returns Operation result with dashboard statistics
     */
    async getTeacherDashboardStats(
        teacherId: string,
        branchId?: string | null
    ): Promise<BranchTeacherOperationResult<TeacherDashboardStats>> {
        try {
            console.log('Fetching dashboard stats for teacher:', teacherId, 'branch:', branchId);
            const { data, error } = await this.supabase.rpc(
                'get_teacher_dashboard_stats_v2',
                {
                    p_teacher_id: teacherId,
                    p_branch_id: branchId || null,
                }
            );

            if (error) {
                console.error('Dashboard stats RPC error:', error);
                return {
                    success: false,
                    error: `Failed to fetch dashboard stats: ${error.message}`,
                };
            }

            // The RPC returns JSON directly
            const stats = data as TeacherDashboardStats;

            return {
                success: true,
                data: stats,
            };
        } catch (error) {
            console.error('Dashboard stats error:', error);
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

export const branchTeacherService = BranchTeacherService.getInstance();
