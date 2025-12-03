/**
 * Branch Students Service (Optimized with View)
 * 
 * Uses student_enrollment_details view for fast, efficient queries
 * Handles all branch student enrollment database operations and API interactions
 * 
 * @module branch-system/services/branch-students
 */

import { createClient } from '@/lib/supabase/client';
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
    BranchStudentOperationResult,
    StudentEnrollmentSummary,
    // StudentFinancialSummary,
    // StudentAcademicSummary,
    // EnrollmentResult,
} from '../types/branch-students.types';
import {
    enrollStudentSchema,
    updateStudentSelfSchema,
    updateStudentByTeacherSchema,
    updateStudentByManagerSchema,
    branchStudentFilterSchema,
    branchStudentSortSchema,
    paginationSchema,
} from '../validations/branch-students.validation';
import {
    toPublicBranchStudent,
    toPublicBranchStudents,
    calculateBranchStudentStats,
    calculateStudentEnrollmentSummary,
    createStudentFinancialSummary,
    createStudentAcademicSummary,
    filterStudentsNeedingAttention,
    filterStudentsWithUpcomingPayments,
} from '../utils/branch-students.utils';

/**
 * Branch Students Service (View-Optimized)
 * Singleton service for managing branch student enrollments
 */
export class BranchStudentsService {
    private static instance: BranchStudentsService;
    private supabase = createClient();

    // View name for optimized queries
    private readonly ENROLLMENT_VIEW = 'student_enrollment_details';

    private constructor() { }

    /**
     * Gets singleton instance
     */
    static getInstance(): BranchStudentsService {
        if (!BranchStudentsService.instance) {
            BranchStudentsService.instance = new BranchStudentsService();
        }
        return BranchStudentsService.instance;
    }

    // ============================================================
    // CREATE OPERATIONS
    // ============================================================

    /**
     * Enrolls a new student in a branch
     * Uses RPC function if available for validation
     * 
     * @param input - Enrollment data
     * @returns Operation result with enrollment data
     */
    async enrollStudent(
        input: EnrollStudentInput
    ): Promise<BranchStudentOperationResult<BranchStudent>> {
        try {
            // Validate input
            const validation = enrollStudentSchema.safeParse(input);
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

            // Try using RPC function first (provides additional validation)
            try {
                const { data: rpcResult, error: rpcError } = await this.supabase
                    .rpc('enroll_student_in_branch', {
                        student_uuid: validation.data.student_id,
                        branch_uuid: validation.data.branch_id,
                        class_uuid: validation.data.class_id || null,
                    });

                if (!rpcError && rpcResult?.success) {
                    // Fetch the created enrollment from the view for complete data
                    const { data: enrollment, error: fetchError } = await this.supabase
                        .from(this.ENROLLMENT_VIEW)
                        .select('*')
                        .eq('enrollment_id', rpcResult.enrollment_id)
                        .single();

                    if (fetchError || !enrollment) {
                        throw new Error('Enrollment created but fetch failed');
                    }

                    // Update additional fields if provided
                    if (Object.keys(validation.data).length > 3) {
                        const { error: updateError } = await this.supabase
                            .from('branch_students')
                            .update({
                                expected_completion_date: validation.data.expected_completion_date,
                                emergency_contact_name: validation.data.emergency_contact_name,
                                emergency_contact_phone: validation.data.emergency_contact_phone,
                                parent_guardian_name: validation.data.parent_guardian_name,
                                parent_guardian_phone: validation.data.parent_guardian_phone,
                                preferred_batch: validation.data.preferred_batch,
                                special_requirements: validation.data.special_requirements,
                                student_notes: validation.data.student_notes,
                                metadata: validation.data.metadata,
                            })
                            .eq('id', rpcResult.enrollment_id);

                        if (updateError) {
                            console.warn('Failed to update additional fields:', updateError);
                        }
                    }

                    return {
                        success: true,
                        data: enrollment as unknown as BranchStudent,
                    };
                }
            } catch (rpcError) {
                // RPC function not available or failed, fallback to direct insert
                console.warn('RPC function not available, using direct insert');
            }

            // Direct insert (fallback)
            const { data, error } = await this.supabase
                .from('branch_students')
                .insert(validation.data)
                .select()
                .single();

            if (error) {
                // Handle duplicate enrollment error
                if (error.code === '23505') {
                    return {
                        success: false,
                        error: 'Student is already enrolled in this branch',
                    };
                }

                return {
                    success: false,
                    error: `Failed to enroll student: ${error.message}`,
                };
            }

            return {
                success: true,
                data,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // ============================================================
    // READ OPERATIONS (USING VIEW)
    // ============================================================

    /**
     * Gets an enrollment by ID from the optimized view
     * 
     * @param enrollmentId - Enrollment UUID
     * @returns Operation result with enriched enrollment data
     */
    async getEnrollmentById(
        enrollmentId: string
    ): Promise<BranchStudentOperationResult<BranchStudentWithRelations>> {
        try {
            const { data, error } = await this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*')
                .eq('enrollment_id', enrollmentId)
                .single();

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch enrollment: ${error.message}`,
                };
            }

            if (!data) {
                return {
                    success: false,
                    error: 'Enrollment not found',
                };
            }

            return {
                success: true,
                data: this.mapViewToBranchStudent(data),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets student's enrollment in a specific branch
     * 
     * @param studentId - Student UUID
     * @param branchId - Branch UUID
     * @returns Operation result with enrollment data
     */
    async getStudentEnrollmentInBranch(
        studentId: string,
        branchId: string
    ): Promise<BranchStudentOperationResult<BranchStudentWithRelations>> {
        try {
            const { data, error } = await this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*')
                .eq('student_id', studentId)
                .eq('branch_id', branchId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return {
                        success: false,
                        error: 'Student is not enrolled in this branch',
                    };
                }

                return {
                    success: false,
                    error: `Failed to fetch enrollment: ${error.message}`,
                };
            }

            return {
                success: true,
                data: this.mapViewToBranchStudent(data),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Lists all enrollments for a student
     * 
     * @param studentId - Student UUID
     * @returns Operation result with array of enrollments
     */
    async getStudentEnrollments(
        studentId: string
    ): Promise<BranchStudentOperationResult<BranchStudentWithRelations[]>> {
        try {
            const { data, error } = await this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*')
                .eq('student_id', studentId)
                .order('enrollment_date', { ascending: false });

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch enrollments: ${error.message}`,
                };
            }

            return {
                success: true,
                data: (data || []).map(this.mapViewToBranchStudent),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Lists all students enrolled across all branches of a coaching center
     * 
     * @param coachingCenterId - Coaching Center UUID
     * @param filters - Optional filters
     * @param sort - Optional sort parameters
     * @param pagination - Optional pagination
     * @returns Search result with students and metadata
     */
    async getCoachingCenterStudents(
        coachingCenterId: string,
        filters?: BranchStudentFilters,
        sort?: BranchStudentSort,
        pagination?: PaginationOptions
    ): Promise<BranchStudentOperationResult<BranchStudentSearchResult>> {
        try {
            // Validate inputs
            const validatedFilters = filters ? branchStudentFilterSchema.parse(filters) : {};
            const validatedSort = sort ? branchStudentSortSchema.parse(sort) : { field: 'enrollment_date', direction: 'desc' };
            const validatedPagination = pagination ? paginationSchema.parse(pagination) : { page: 1, limit: 20 };

            // Build query using the optimized view
            let query = this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*', { count: 'exact' })
                .eq('coaching_center_id', coachingCenterId);

            // Apply filters
            if (validatedFilters.student_id) {
                query = query.eq('student_id', validatedFilters.student_id);
            }

            if (validatedFilters.branch_id) {
                query = query.eq('branch_id', validatedFilters.branch_id);
            }

            if (validatedFilters.class_id) {
                query = query.eq('class_id', validatedFilters.class_id);
            }

            if (validatedFilters.enrollment_status) {
                if (Array.isArray(validatedFilters.enrollment_status)) {
                    query = query.in('enrollment_status', validatedFilters.enrollment_status);
                } else {
                    query = query.eq('enrollment_status', validatedFilters.enrollment_status);
                }
            }

            if (validatedFilters.payment_status) {
                if (Array.isArray(validatedFilters.payment_status)) {
                    query = query.in('payment_status', validatedFilters.payment_status);
                } else {
                    query = query.eq('payment_status', validatedFilters.payment_status);
                }
            }

            if (validatedFilters.enrollment_date_from) {
                query = query.gte('enrollment_date', validatedFilters.enrollment_date_from);
            }

            if (validatedFilters.enrollment_date_to) {
                query = query.lte('enrollment_date', validatedFilters.enrollment_date_to);
            }

            if (validatedFilters.attendance_min !== undefined) {
                query = query.gte('attendance_percentage', validatedFilters.attendance_min);
            }

            if (validatedFilters.attendance_max !== undefined) {
                query = query.lte('attendance_percentage', validatedFilters.attendance_max);
            }

            if (validatedFilters.has_overdue_payment) {
                query = query.lt('next_payment_due', new Date().toISOString().split('T')[0]);
            }

            // Apply sorting
            query = query.order(validatedSort.field as any, {
                ascending: validatedSort.direction === 'asc',
            });

            // Apply pagination
            const from = (validatedPagination.page - 1) * validatedPagination.limit;
            const to = from + validatedPagination.limit - 1;
            query = query.range(from, to);

            // Execute query
            const { data, error, count } = await query;

            if (error) {
                console.error('Error fetching coaching center students:', error);
                return {
                    success: false,
                    error: error.message,
                };
            }

            const totalCount = count || 0;
            const totalPages = Math.ceil(totalCount / validatedPagination.limit);

            return {
                success: true,
                data: {
                    students: toPublicBranchStudents((data || []).map(this.mapViewToBranchStudent)),
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
     * Lists all students enrolled in a branch
     * 
     * @param branchId - Branch UUID
     * @param filters - Optional filters
     * @param sort - Optional sort parameters
     * @param pagination - Optional pagination
     * @returns Search result with students and metadata
     */
    async getBranchStudents(
        branchId: string,
        filters?: BranchStudentFilters,
        sort?: BranchStudentSort,
        pagination?: PaginationOptions
    ): Promise<BranchStudentOperationResult<BranchStudentSearchResult>> {
        try {
            // Validate inputs
            const validatedFilters = filters ? branchStudentFilterSchema.parse({ ...filters, branch_id: branchId }) : { branch_id: branchId };
            const validatedSort = sort ? branchStudentSortSchema.parse(sort) : { field: 'enrollment_date', direction: 'desc' };
            const validatedPagination = pagination ? paginationSchema.parse(pagination) : { page: 1, limit: 20 };

            // Build query using the optimized view
            let query = this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*', { count: 'exact' })
                .eq('branch_id', branchId);

            // Apply filters
            if (validatedFilters.student_id) {
                query = query.eq('student_id', validatedFilters.student_id);
            }

            if (validatedFilters.class_id) {
                query = query.eq('class_id', validatedFilters.class_id);
            }

            if (validatedFilters.enrollment_status) {
                if (Array.isArray(validatedFilters.enrollment_status)) {
                    query = query.in('enrollment_status', validatedFilters.enrollment_status);
                } else {
                    query = query.eq('enrollment_status', validatedFilters.enrollment_status);
                }
            }

            if (validatedFilters.payment_status) {
                if (Array.isArray(validatedFilters.payment_status)) {
                    query = query.in('payment_status', validatedFilters.payment_status);
                } else {
                    query = query.eq('payment_status', validatedFilters.payment_status);
                }
            }

            if (validatedFilters.enrollment_date_from) {
                query = query.gte('enrollment_date', validatedFilters.enrollment_date_from);
            }

            if (validatedFilters.enrollment_date_to) {
                query = query.lte('enrollment_date', validatedFilters.enrollment_date_to);
            }

            if (validatedFilters.attendance_min !== undefined) {
                query = query.gte('attendance_percentage', validatedFilters.attendance_min);
            }

            if (validatedFilters.attendance_max !== undefined) {
                query = query.lte('attendance_percentage', validatedFilters.attendance_max);
            }

            if (validatedFilters.has_overdue_payment) {
                query = query.lt('next_payment_due', new Date().toISOString().split('T')[0]);
            }

            // Apply sorting
            query = query.order(validatedSort.field as any, {
                ascending: validatedSort.direction === 'asc',
            });

            // Apply pagination
            const from = (validatedPagination.page - 1) * validatedPagination.limit;
            const to = from + validatedPagination.limit - 1;
            query = query.range(from, to);

            // Execute query
            const { data, error, count } = await query;

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch students: ${error.message}`,
                };
            }

            const totalCount = count || 0;
            const totalPages = Math.ceil(totalCount / validatedPagination.limit);

            return {
                success: true,
                data: {
                    students: toPublicBranchStudents((data || []).map(this.mapViewToBranchStudent)),
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
     * Lists all students enrolled in a class
     * 
     * @param classId - Class UUID
     * @param filters - Optional filters
     * @param sort - Optional sort parameters
     * @returns Operation result with students array
     */
    async getClassStudents(
        classId: string,
        filters?: Omit<BranchStudentFilters, 'class_id'>,
        sort?: BranchStudentSort
    ): Promise<BranchStudentOperationResult<BranchStudentWithRelations[]>> {
        try {
            const validatedSort = sort ? branchStudentSortSchema.parse(sort) : { field: 'enrollment_date', direction: 'desc' };

            let query = this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*')
                .eq('class_id', classId);

            // Apply filters
            if (filters?.enrollment_status) {
                if (Array.isArray(filters.enrollment_status)) {
                    query = query.in('enrollment_status', filters.enrollment_status);
                } else {
                    query = query.eq('enrollment_status', filters.enrollment_status);
                }
            }

            if (filters?.payment_status) {
                if (Array.isArray(filters.payment_status)) {
                    query = query.in('payment_status', filters.payment_status);
                } else {
                    query = query.eq('payment_status', filters.payment_status);
                }
            }

            // Apply sorting
            query = query.order(validatedSort.field as any, {
                ascending: validatedSort.direction === 'asc',
            });

            const { data, error } = await query;

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch class students: ${error.message}`,
                };
            }

            return {
                success: true,
                data: (data || []).map(this.mapViewToBranchStudent),
            };
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
     * Maps view data to BranchStudentWithRelations type
     */
    private mapViewToBranchStudent(viewData: any): BranchStudentWithRelations {
        return {
            id: viewData.enrollment_id,
            student_id: viewData.student_id,
            branch_id: viewData.branch_id,
            class_id: viewData.class_id,
            enrollment_date: viewData.enrollment_date,
            expected_completion_date: viewData.expected_completion_date,
            actual_completion_date: viewData.actual_completion_date,
            enrollment_status: viewData.enrollment_status,
            payment_status: viewData.payment_status,
            attendance_percentage: viewData.attendance_percentage,
            current_grade: viewData.current_grade ?? null,
            performance_notes: viewData.performance_notes ?? null,
            total_fees_due: viewData.total_fees_due ?? 0,
            total_fees_paid: viewData.total_fees_paid ?? 0,
            last_payment_date: viewData.last_payment_date ?? null,
            next_payment_due: viewData.next_payment_due,
            emergency_contact_name: viewData.emergency_contact_name,
            emergency_contact_phone: viewData.emergency_contact_phone,
            parent_guardian_name: viewData.parent_guardian_name,
            parent_guardian_phone: viewData.parent_guardian_phone,
            preferred_batch: viewData.preferred_batch,
            special_requirements: viewData.special_requirements,
            student_notes: viewData.student_notes,
            metadata: viewData.metadata,
            created_at: viewData.created_at,
            updated_at: viewData.updated_at,
            student: {
                id: viewData.student_id,
                full_name: viewData.student_name ?? '',
                username: viewData.student_username ?? '',
                email: viewData.student_email ?? '',
                avatar_url: viewData.student_avatar_url ?? null,
                phone: viewData.student_phone ?? null,
            },
            branch: {
                id: viewData.branch_id,
                name: viewData.branch_name ?? '',
                coaching_center_id: viewData.coaching_center_id ?? '',
                address: viewData.branch_address ?? null,
            },
            class: viewData.class_id ? {
                id: viewData.class_id,
                class_name: viewData.class_name ?? '',
                subject: viewData.subject ?? '',
                grade_level: viewData.grade_level ?? '',
                batch_name: viewData.batch_name ?? null,
                teacher_id: viewData.teacher_id ?? null,
            } : undefined,
        };
    }

    /**
     * Gets student enrollment summary from view
     * 
     * @param studentId - Student UUID
     * @returns Operation result with summary
     */
    async getStudentEnrollmentSummary(
        studentId: string
    ): Promise<BranchStudentOperationResult<StudentEnrollmentSummary>> {
        try {
            // Get all enrollments for the student
            const enrollmentsResult = await this.getStudentEnrollments(studentId);

            if (!enrollmentsResult.success || !enrollmentsResult.data) {
                return {
                    success: false,
                    error: 'Failed to fetch enrollments',
                };
            }

            const summary = calculateStudentEnrollmentSummary(enrollmentsResult.data);

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
     * Gets branch student statistics from view
     * 
     * @param branchId - Branch UUID
     * @returns Operation result with statistics
     */
    async getBranchStudentStats(
        branchId: string
    ): Promise<BranchStudentOperationResult<BranchStudentStats>> {
        try {
            const { data, error } = await this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*')
                .eq('branch_id', branchId);

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch statistics: ${error.message}`,
                };
            }

            const stats = calculateBranchStudentStats((data || []).map(this.mapViewToBranchStudent));

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
     * Gets students needing attention for a branch
     * 
     * @param branchId - Branch UUID
     * @returns Operation result with students array
     */
    async getStudentsNeedingAttention(
        branchId: string
    ): Promise<BranchStudentOperationResult<PublicBranchStudent[]>> {
        try {
            const { data, error } = await this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*')
                .eq('branch_id', branchId);

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch students: ${error.message}`,
                };
            }

            const studentsNeedingAttention = filterStudentsNeedingAttention(
                (data || []).map(this.mapViewToBranchStudent)
            );

            return {
                success: true,
                data: toPublicBranchStudents(studentsNeedingAttention),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets students with upcoming payments for a branch
     * 
     * @param branchId - Branch UUID
     * @param daysAhead - Number of days to look ahead (default: 7)
     * @returns Operation result with students array
     */
    async getStudentsWithUpcomingPayments(
        branchId: string,
        daysAhead: number = 7
    ): Promise<BranchStudentOperationResult<PublicBranchStudent[]>> {
        try {
            const { data, error } = await this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*')
                .eq('branch_id', branchId);

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch students: ${error.message}`,
                };
            }

            const studentsWithUpcoming = filterStudentsWithUpcomingPayments(
                (data || []).map(this.mapViewToBranchStudent),
                daysAhead
            );

            return {
                success: true,
                data: toPublicBranchStudents(studentsWithUpcoming),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // ============================================================
    // UPDATE OPERATIONS (Keep as is - these operate on the base table)
    // ============================================================

    /**
     * Updates student enrollment (by student themselves)
     * Students can only update contact info and preferences
     * 
     * @param enrollmentId - Enrollment UUID
     * @param studentId - Student UUID (for verification)
     * @param input - Update data
     * @returns Operation result with updated enrollment
     */
    async updateEnrollmentByStudent(
        enrollmentId: string,
        studentId: string,
        input: UpdateStudentSelfInput
    ): Promise<BranchStudentOperationResult<BranchStudent>> {
        try {
            // Validate input
            const validation = updateStudentSelfSchema.safeParse(input);
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

            // Update enrollment (RLS will ensure student can only update their own)
            const { data, error } = await this.supabase
                .from('branch_students')
                .update(validation.data)
                .eq('id', enrollmentId)
                .eq('student_id', studentId)
                .select()
                .single();

            if (error) {
                return {
                    success: false,
                    error: `Failed to update enrollment: ${error.message}`,
                };
            }

            if (!data) {
                return {
                    success: false,
                    error: 'Enrollment not found or unauthorized',
                };
            }

            return {
                success: true,
                data,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Updates student enrollment (by teacher)
     * Teachers can update academic fields for their class students
     * 
     * @param enrollmentId - Enrollment UUID
     * @param input - Update data
     * @returns Operation result with updated enrollment
     */
    async updateEnrollmentByTeacher(
        enrollmentId: string,
        input: UpdateStudentByTeacherInput
    ): Promise<BranchStudentOperationResult<BranchStudent>> {
        try {
            // Validate input
            const validation = updateStudentByTeacherSchema.safeParse(input);
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

            // Update enrollment (RLS will ensure teacher can only update their class students)
            const { data, error } = await this.supabase
                .from('branch_students')
                .update(validation.data)
                .eq('id', enrollmentId)
                .select()
                .single();

            if (error) {
                return {
                    success: false,
                    error: `Failed to update enrollment: ${error.message}`,
                };
            }

            if (!data) {
                return {
                    success: false,
                    error: 'Enrollment not found or unauthorized',
                };
            }

            return {
                success: true,
                data,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Updates student enrollment (by branch manager)
     * Managers can update most fields
     * 
     * @param enrollmentId - Enrollment UUID
     * @param input - Update data
     * @returns Operation result with updated enrollment
     */
    async updateEnrollmentByManager(
        enrollmentId: string,
        input: UpdateStudentByManagerInput
    ): Promise<BranchStudentOperationResult<BranchStudent>> {
        try {
            // Validate input
            const validation = updateStudentByManagerSchema.safeParse(input);
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

            // Update enrollment (RLS will ensure manager can only update their branch students)
            const { data, error } = await this.supabase
                .from('branch_students')
                .update(validation.data)
                .eq('id', enrollmentId)
                .select()
                .single();

            if (error) {
                return {
                    success: false,
                    error: `Failed to update enrollment: ${error.message}`,
                };
            }

            if (!data) {
                return {
                    success: false,
                    error: 'Enrollment not found or unauthorized',
                };
            }

            return {
                success: true,
                data,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // ============================================================
    // DELETE OPERATIONS (Keep as is - these operate on the base table)
    // ============================================================

    /**
     * Deletes an enrollment (soft delete by changing status)
     * 
     * @param enrollmentId - Enrollment UUID
     * @returns Operation result
     */
    async deleteEnrollment(
        enrollmentId: string
    ): Promise<BranchStudentOperationResult<void>> {
        try {
            // Soft delete by updating status to DROPPED
            const { error } = await this.supabase
                .from('branch_students')
                .update({
                    enrollment_status: 'DROPPED',
                    actual_completion_date: new Date().toISOString().split('T')[0],
                })
                .eq('id', enrollmentId);

            if (error) {
                return {
                    success: false,
                    error: `Failed to delete enrollment: ${error.message}`,
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
}

// Export singleton instance
export const branchStudentsService = BranchStudentsService.getInstance();