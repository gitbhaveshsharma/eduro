/**
 * Branch Students Service (Updated for New Schema)
 * 
 * Service for managing branch student profiles
 * Uses student_enrollment_details view for optimized queries
 * 
 * IMPORTANT: After migration 019, branch_students is now a pure "student profile per branch" table.
 * Class-specific enrollment data is now handled by ClassEnrollmentsService.
 * 
 * @module branch-system/services/branch-students
 */

import { createClient } from '@/lib/supabase/client';
import type {
    BranchStudent,
    PublicBranchStudent,
    BranchStudentWithRelations,
    RegisterStudentInBranchInput,
    UpdateStudentSelfInput,
    UpdateStudentByManagerInput,
    BranchStudentFilters,
    BranchStudentSort,
    PaginationOptions,
    BranchStudentSearchResult,
    BranchStudentStats,
    BranchStudentOperationResult,
    StudentEnrollmentSummary,
    PaymentStatus,
    // Legacy types for backward compatibility
    EnrollStudentInput,
    UpdateStudentByTeacherInput,
} from '../types/branch-students.types';
import type { ClassEnrollmentWithRelations } from '../types/class-enrollments.types';
import {
    // Import legacy schemas for backward compatibility
    enrollStudentSchema,
    updateStudentSelfSchema,
    updateStudentByManagerSchema,
    branchStudentFilterSchema,
    branchStudentSortSchema,
    paginationSchema,
} from '../validations/branch-students.validation';
import { classEnrollmentsService } from './class-enrollments.service';

/**
 * Branch Students Service (Updated)
 * Singleton service for managing branch student profiles
 */
export class BranchStudentsService {
    private static instance: BranchStudentsService;
    private supabase = createClient();

    // View name for optimized queries
    private readonly ENROLLMENT_VIEW = 'student_enrollment_details';
    private readonly TABLE_NAME = 'branch_students';

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
     * Registers a student in a branch (creates branch_students record)
     * This creates the student profile in the branch, NOT a class enrollment.
     * 
     * @param input - Registration data
     * @returns Operation result with student data
     */
    async registerStudentInBranch(
        input: RegisterStudentInBranchInput
    ): Promise<BranchStudentOperationResult<BranchStudent>> {
        try {
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .insert({
                    student_id: input.student_id,
                    branch_id: input.branch_id,
                    student_name: input.student_name || null,
                    student_email: input.student_email || null,
                    student_phone: input.student_phone || null,
                    emergency_contact_name: input.emergency_contact_name || null,
                    emergency_contact_phone: input.emergency_contact_phone || null,
                    parent_guardian_name: input.parent_guardian_name || null,
                    parent_guardian_phone: input.parent_guardian_phone || null,
                    student_notes: input.student_notes || null,
                    registration_date: input.registration_date || new Date().toISOString().split('T')[0],
                    metadata: input.metadata || {},
                })
                .select()
                .single();

            if (error) {
                return {
                    success: false,
                    error: `Failed to register student in branch: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data as BranchStudent,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * @deprecated Use registerStudentInBranch + classEnrollmentsService.createClassEnrollment
     * 
     * Legacy method for backward compatibility
     * Enrolls a student in a branch (and optionally in a class)
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

            // Step 1: Register student in branch (creates branch_students record)
            const registerResult = await this.registerStudentInBranch({
                student_id: validation.data.student_id,
                branch_id: validation.data.branch_id,
                emergency_contact_name: validation.data.emergency_contact_name,
                emergency_contact_phone: validation.data.emergency_contact_phone,
                parent_guardian_name: validation.data.parent_guardian_name,
                parent_guardian_phone: validation.data.parent_guardian_phone,
                student_notes: validation.data.student_notes,
                metadata: validation.data.metadata,
            });

            if (!registerResult.success || !registerResult.data) {
                return registerResult;
            }

            // Step 2: If class_id is provided, create class enrollment
            if (validation.data.class_id) {
                const classEnrollmentResult = await classEnrollmentsService.createClassEnrollment({
                    student_id: validation.data.student_id,
                    branch_id: validation.data.branch_id,
                    class_id: validation.data.class_id,
                    branch_student_id: registerResult.data.id,
                    enrollment_date: validation.data.enrollment_date,
                    expected_completion_date: validation.data.expected_completion_date,
                    preferred_batch: validation.data.preferred_batch,
                    special_requirements: validation.data.special_requirements,
                });

                if (!classEnrollmentResult.success) {
                    console.warn('Branch student created but class enrollment failed:', classEnrollmentResult.error);
                }
            }

            return registerResult;
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
     * Gets a branch student by ID
     * 
     * @param branchStudentId - Branch student UUID
     * @returns Operation result with student data
     */
    async getBranchStudentById(
        branchStudentId: string
    ): Promise<BranchStudentOperationResult<BranchStudent>> {
        try {
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .select('*')
                .eq('id', branchStudentId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return {
                        success: false,
                        error: 'Branch student not found',
                    };
                }
                return {
                    success: false,
                    error: `Failed to fetch branch student: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data as BranchStudent,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets enrollment by ID from the optimized view
     * This returns the class enrollment with all related data
     * 
     * @param enrollmentId - Class enrollment UUID
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
                if (error.code === 'PGRST116') {
                    return {
                        success: false,
                        error: 'Enrollment not found',
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
     * Gets student's branch profile
     * Note: After migration, a student can have multiple branch_students records per branch
     * 
     * @param studentId - Student UUID
     * @param branchId - Branch UUID
     * @returns Operation result with student data
     */
    async getStudentBranchProfile(
        studentId: string,
        branchId: string
    ): Promise<BranchStudentOperationResult<BranchStudent[]>> {
        try {
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .select('*')
                .eq('student_id', studentId)
                .eq('branch_id', branchId);

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch student profile: ${error.message}`,
                };
            }

            return {
                success: true,
                data: (data || []) as BranchStudent[],
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * @deprecated Use getStudentBranchProfile instead
     * Gets student's enrollment in a specific branch
     */
    async getStudentEnrollmentInBranch(
        studentId: string,
        branchId: string
    ): Promise<BranchStudentOperationResult<BranchStudentWithRelations>> {
        try {
            // Get first class enrollment from view for this student in this branch
            const { data, error } = await this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*')
                .eq('student_id', studentId)
                .eq('branch_id', branchId)
                .limit(1)
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
     * Lists all class enrollments for a student
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
            const validatedFilters = filters ? branchStudentFilterSchema.parse(filters) : {};
            const validatedSort = sort ? branchStudentSortSchema.parse(sort) : { field: 'enrollment_date', direction: 'desc' };
            const validatedPagination = pagination ? paginationSchema.parse(pagination) : { page: 1, limit: 20 };

            // Get all branch IDs for this coaching center
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
                        students: [],
                        total_count: 0,
                        page: validatedPagination.page,
                        limit: validatedPagination.limit,
                        total_pages: 0,
                        has_more: false,
                    },
                };
            }

            const branchIds = branches.map((b: { id: string }) => b.id);

            let query = this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*', { count: 'exact' })
                .in('branch_id', branchIds);

            // Apply filters
            query = this.applyFilters(query, validatedFilters);

            // Apply sorting
            query = query.order(validatedSort.field as any, {
                ascending: validatedSort.direction === 'asc',
            });

            // Apply pagination
            const from = (validatedPagination.page - 1) * validatedPagination.limit;
            const to = from + validatedPagination.limit - 1;
            query = query.range(from, to);

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
                    students: (data || []).map((d: any) => this.mapViewToPublicStudent(d)),
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
            const validatedFilters = filters ? branchStudentFilterSchema.parse({ ...filters, branch_id: branchId }) : { branch_id: branchId };
            const validatedSort = sort ? branchStudentSortSchema.parse(sort) : { field: 'enrollment_date', direction: 'desc' };
            const validatedPagination = pagination ? paginationSchema.parse(pagination) : { page: 1, limit: 20 };

            let query = this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*', { count: 'exact' })
                .eq('branch_id', branchId);

            // Apply filters
            query = this.applyFilters(query, validatedFilters);

            // Apply sorting
            query = query.order(validatedSort.field as any, {
                ascending: validatedSort.direction === 'asc',
            });

            // Apply pagination
            const from = (validatedPagination.page - 1) * validatedPagination.limit;
            const to = from + validatedPagination.limit - 1;
            query = query.range(from, to);

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
                    students: (data || []).map((d: any) => this.mapViewToPublicStudent(d)),
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
     * Now delegates to ClassEnrollmentsService
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
    // UPDATE OPERATIONS
    // ============================================================

    /**
     * Updates branch student profile (by student)
     * Students can only update contact info
     * 
     * @param branchStudentId - Branch student UUID
     * @param studentId - Student UUID (for verification)
     * @param input - Update data
     * @returns Operation result with updated data
     */
    async updateBranchStudentByStudent(
        branchStudentId: string,
        studentId: string,
        input: UpdateStudentSelfInput
    ): Promise<BranchStudentOperationResult<BranchStudent>> {
        try {
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

            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .update(validation.data)
                .eq('id', branchStudentId)
                .eq('student_id', studentId)
                .select()
                .single();

            if (error) {
                return {
                    success: false,
                    error: `Failed to update: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data as BranchStudent,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * @deprecated Use updateBranchStudentByStudent instead
     * Legacy method - Updates student enrollment (by student themselves)
     */
    async updateEnrollmentByStudent(
        enrollmentId: string,
        studentId: string,
        input: UpdateStudentSelfInput
    ): Promise<BranchStudentOperationResult<BranchStudent>> {
        // For backward compatibility, try to update both branch_students and class_enrollments
        try {
            // First, try to get the class enrollment to find the branch_student_id
            const { data: enrollment } = await this.supabase
                .from('class_enrollments')
                .select('branch_student_id')
                .eq('id', enrollmentId)
                .single();

            if (enrollment?.branch_student_id) {
                return this.updateBranchStudentByStudent(enrollment.branch_student_id, studentId, input);
            }

            // Fallback to direct update on branch_students
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .update(input)
                .eq('id', enrollmentId)
                .eq('student_id', studentId)
                .select()
                .single();

            if (error) {
                return {
                    success: false,
                    error: `Failed to update: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data as BranchStudent,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * @deprecated Use classEnrollmentsService.updateClassEnrollmentByTeacher instead
     * Legacy method - Updates student enrollment (by teacher)
     */
    async updateEnrollmentByTeacher(
        enrollmentId: string,
        input: UpdateStudentByTeacherInput
    ): Promise<BranchStudentOperationResult<BranchStudent>> {
        // Delegate to class enrollments service
        const result = await classEnrollmentsService.updateClassEnrollmentByTeacher(enrollmentId, input);

        if (!result.success) {
            return {
                success: false,
                error: result.error,
            };
        }

        // Return the updated enrollment from view
        return this.getEnrollmentById(enrollmentId);
    }

    /**
     * Updates branch student profile (by manager)
     * 
     * @param branchStudentId - Branch student UUID
     * @param input - Update data
     * @returns Operation result with updated data
     */
    async updateBranchStudentByManager(
        branchStudentId: string,
        input: UpdateStudentByManagerInput
    ): Promise<BranchStudentOperationResult<BranchStudent>> {
        try {
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

            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .update(validation.data)
                .eq('id', branchStudentId)
                .select()
                .single();

            if (error) {
                return {
                    success: false,
                    error: `Failed to update: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data as BranchStudent,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * @deprecated Use updateBranchStudentByManager + classEnrollmentsService for class-specific updates
     * Legacy method - Updates student enrollment (by manager)
     */
    async updateEnrollmentByManager(
        enrollmentId: string,
        input: any // Using any for backward compatibility
    ): Promise<BranchStudentOperationResult<BranchStudent>> {
        try {
            // Separate class-specific and branch-specific fields
            const classFields = ['enrollment_status', 'expected_completion_date', 'actual_completion_date',
                'attendance_percentage', 'current_grade', 'performance_notes',
                'preferred_batch', 'special_requirements'];
            const branchFields = ['payment_status', 'total_fees_due', 'total_fees_paid',
                'last_payment_date', 'next_payment_due', 'emergency_contact_name',
                'emergency_contact_phone', 'parent_guardian_name', 'parent_guardian_phone',
                'metadata'];

            const classUpdate: Record<string, any> = {};
            const branchUpdate: Record<string, any> = {};

            Object.keys(input).forEach(key => {
                if (classFields.includes(key)) {
                    classUpdate[key] = input[key];
                } else if (branchFields.includes(key)) {
                    branchUpdate[key] = input[key];
                }
            });

            // Update class enrollment if there are class-specific fields
            if (Object.keys(classUpdate).length > 0) {
                await classEnrollmentsService.updateClassEnrollmentByManager(enrollmentId, classUpdate);
            }

            // Update branch student if there are branch-specific fields
            if (Object.keys(branchUpdate).length > 0) {
                const { data: enrollment } = await this.supabase
                    .from('class_enrollments')
                    .select('branch_student_id')
                    .eq('id', enrollmentId)
                    .single();

                if (enrollment?.branch_student_id) {
                    await this.supabase
                        .from(this.TABLE_NAME)
                        .update(branchUpdate)
                        .eq('id', enrollment.branch_student_id);
                }
            }

            // Return updated enrollment from view
            return this.getEnrollmentById(enrollmentId);
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
     * @deprecated Use classEnrollmentsService.dropClassEnrollment instead
     * Legacy method - Deletes an enrollment (soft delete)
     */
    async deleteEnrollment(
        enrollmentId: string
    ): Promise<BranchStudentOperationResult<void>> {
        return classEnrollmentsService.dropClassEnrollment(enrollmentId);
    }

    // ============================================================
    // STATISTICS & ANALYTICS
    // ============================================================

    /**
     * Gets student enrollment summary
     */
    async getStudentEnrollmentSummary(
        studentId: string
    ): Promise<BranchStudentOperationResult<StudentEnrollmentSummary>> {
        try {
            const enrollmentsResult = await this.getStudentEnrollments(studentId);

            if (!enrollmentsResult.success || !enrollmentsResult.data) {
                return {
                    success: false,
                    error: 'Failed to fetch enrollments',
                };
            }

            const enrollments = enrollmentsResult.data;
            const summary = this.calculateStudentSummary(enrollments);

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
     * Gets branch student statistics
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

            const stats = this.calculateBranchStats(data || []);

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
     * Gets students needing attention
     */
    async getStudentsNeedingAttention(
        branchId: string
    ): Promise<BranchStudentOperationResult<PublicBranchStudent[]>> {
        try {
            const { data, error } = await this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*')
                .eq('branch_id', branchId)
                .or('is_payment_overdue.eq.true,attendance_percentage.lt.60');

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch students: ${error.message}`,
                };
            }

            return {
                success: true,
                data: (data || []).map((d: any) => this.mapViewToPublicStudent(d)),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets students with upcoming payments
     */
    async getStudentsWithUpcomingPayments(
        branchId: string,
        daysAhead: number = 7
    ): Promise<BranchStudentOperationResult<PublicBranchStudent[]>> {
        try {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + daysAhead);
            const futureDateStr = futureDate.toISOString().split('T')[0];

            const { data, error } = await this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*')
                .eq('branch_id', branchId)
                .lte('next_payment_due', futureDateStr)
                .gte('next_payment_due', new Date().toISOString().split('T')[0]);

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch students: ${error.message}`,
                };
            }

            return {
                success: true,
                data: (data || []).map((d: any) => this.mapViewToPublicStudent(d)),
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
     * Applies filters to a query
     */
    private applyFilters(query: any, filters: BranchStudentFilters): any {
        if (filters.student_id) {
            query = query.eq('student_id', filters.student_id);
        }

        if (filters.branch_id) {
            query = query.eq('branch_id', filters.branch_id);
        }

        if (filters.class_id) {
            query = query.eq('class_id', filters.class_id);
        }

        // Text search across student name, email, and phone
        if (filters.search_query) {
            const searchTerm = `%${filters.search_query}%`;
            query = query.or(
                `student_name.ilike.${searchTerm},student_email.ilike.${searchTerm},student_phone.ilike.${searchTerm}`
            );
        }

        if (filters.enrollment_status) {
            if (Array.isArray(filters.enrollment_status)) {
                query = query.in('enrollment_status', filters.enrollment_status);
            } else {
                query = query.eq('enrollment_status', filters.enrollment_status);
            }
        }

        if (filters.payment_status) {
            if (Array.isArray(filters.payment_status)) {
                query = query.in('payment_status', filters.payment_status);
            } else {
                query = query.eq('payment_status', filters.payment_status);
            }
        }

        if (filters.enrollment_date_from) {
            query = query.gte('enrollment_date', filters.enrollment_date_from);
        }

        if (filters.enrollment_date_to) {
            query = query.lte('enrollment_date', filters.enrollment_date_to);
        }

        if (filters.attendance_min !== undefined) {
            query = query.gte('attendance_percentage', filters.attendance_min);
        }

        if (filters.attendance_max !== undefined) {
            query = query.lte('attendance_percentage', filters.attendance_max);
        }

        if (filters.has_overdue_payment) {
            query = query.eq('is_payment_overdue', true);
        }

        return query;
    }

    /**
     * Maps view data to BranchStudentWithRelations type
     */
    private mapViewToBranchStudent(viewData: any): BranchStudentWithRelations {
        return {
            id: viewData.branch_student_id || viewData.enrollment_id || viewData.id,
            student_id: viewData.student_id,
            branch_id: viewData.branch_id,
            student_name: viewData.student_name || viewData.branch_student_name,
            student_email: viewData.student_email || viewData.branch_student_email,
            student_phone: viewData.student_phone || viewData.branch_student_phone,
            total_fees_due: viewData.total_fees_due || 0,
            total_fees_paid: viewData.total_fees_paid || 0,
            last_payment_date: viewData.last_payment_date,
            next_payment_due: viewData.next_payment_due,
            payment_status: viewData.payment_status || 'PENDING',
            emergency_contact_name: viewData.emergency_contact_name,
            emergency_contact_phone: viewData.emergency_contact_phone,
            parent_guardian_name: viewData.parent_guardian_name,
            parent_guardian_phone: viewData.parent_guardian_phone,
            student_notes: viewData.student_notes,
            registration_date: viewData.registration_date || viewData.enrollment_date,
            metadata: viewData.metadata,
            created_at: viewData.created_at,
            updated_at: viewData.updated_at,
            student: {
                id: viewData.student_id,
                full_name: viewData.student_name || '',
                username: viewData.student_username || '',
                email: viewData.student_email || '',
                avatar_url: viewData.avatar_url || null,
                phone: viewData.student_phone || null,
            },
            branch: {
                id: viewData.branch_id,
                name: viewData.branch_name || '',
                coaching_center_id: viewData.coaching_center_id || '',
                address: viewData.branch_address || null,
            },
            // Include class enrollment info if available
            class_enrollments: viewData.class_id ? [{
                id: viewData.enrollment_id,
                class_id: viewData.class_id,
                class_name: viewData.class_name || '',
                enrollment_status: viewData.enrollment_status || 'ENROLLED',
                attendance_percentage: viewData.attendance_percentage || 0,
            }] : [],
        };
    }

    /**
     * Maps view data to PublicBranchStudent type
     */
    private mapViewToPublicStudent(viewData: any): PublicBranchStudent {
        const outstandingBalance = (viewData.total_fees_due || 0) - (viewData.total_fees_paid || 0);
        const isOverdue = viewData.is_payment_overdue ||
            (viewData.next_payment_due && new Date(viewData.next_payment_due) < new Date());

        return {
            id: viewData.branch_student_id || viewData.enrollment_id || viewData.id,
            student_id: viewData.student_id,
            branch_id: viewData.branch_id,
            student_name: viewData.student_name || viewData.branch_student_name,
            student_email: viewData.student_email || viewData.branch_student_email,
            student_phone: viewData.student_phone || viewData.branch_student_phone,
            payment_status: viewData.payment_status || 'PENDING',
            next_payment_due: viewData.next_payment_due,
            registration_date: viewData.registration_date || viewData.enrollment_date,
            created_at: viewData.created_at,
            updated_at: viewData.updated_at,
            // Class enrollment fields
            enrollment_status: viewData.enrollment_status || null,
            attendance_percentage: viewData.attendance_percentage || 0,
            class_name: viewData.class_name || null,
            // Computed fields
            outstanding_balance: Math.max(0, outstandingBalance),
            is_payment_overdue: isOverdue,
        };
    }

    /**
     * Calculates student enrollment summary
     */
    private calculateStudentSummary(enrollments: BranchStudentWithRelations[]): StudentEnrollmentSummary {
        const totalEnrollments = enrollments.length;
        const activeEnrollments = enrollments.filter(e =>
            e.class_enrollments?.some((ce: { enrollment_status: string }) => ce.enrollment_status === 'ENROLLED')
        ).length;
        const completedEnrollments = enrollments.filter(e =>
            e.class_enrollments?.some((ce: { enrollment_status: string }) => ce.enrollment_status === 'COMPLETED')
        ).length;

        const totalFeesDue = enrollments.reduce((sum, e) => sum + (e.total_fees_due || 0), 0);
        const totalFeesPaid = enrollments.reduce((sum, e) => sum + (e.total_fees_paid || 0), 0);

        const attendances = enrollments.flatMap(e =>
            e.class_enrollments?.map((ce: { attendance_percentage: number }) => ce.attendance_percentage) || []
        );
        const avgAttendance = attendances.length > 0
            ? attendances.reduce((a, b) => a + b, 0) / attendances.length
            : 0;

        return {
            total_enrollments: totalEnrollments,
            active_enrollments: activeEnrollments,
            completed_enrollments: completedEnrollments,
            total_fees_due: totalFeesDue,
            total_fees_paid: totalFeesPaid,
            outstanding_balance: Math.max(0, totalFeesDue - totalFeesPaid),
            average_attendance: Number(avgAttendance.toFixed(2)),
        };
    }

    /**
     * Calculates branch student statistics
     */
    private calculateBranchStats(data: any[]): BranchStudentStats {
        // Get unique students
        const uniqueStudents = new Set(data.map(d => d.student_id));
        const totalStudents = uniqueStudents.size;

        // Payment statistics
        const overdueStudents = data.filter(d => d.is_payment_overdue).length;
        const totalCollected = data.reduce((sum, d) => sum + (d.total_fees_paid || 0), 0);
        const totalOutstanding = data.reduce((sum, d) => sum + Math.max(0, (d.total_fees_due || 0) - (d.total_fees_paid || 0)), 0);

        // Count by payment status
        const byPaymentStatus: Record<PaymentStatus, number> = {
            PAID: 0,
            PARTIAL: 0,
            PENDING: 0,
            OVERDUE: 0,
        };
        data.forEach(d => {
            const status = d.payment_status as PaymentStatus;
            if (byPaymentStatus[status] !== undefined) {
                byPaymentStatus[status]++;
            }
        });

        // Class enrollment statistics
        const byEnrollmentStatus: Record<string, number> = {};
        const byClass: Record<string, number> = {};

        data.forEach(d => {
            const status = d.enrollment_status || 'ENROLLED';
            byEnrollmentStatus[status] = (byEnrollmentStatus[status] || 0) + 1;

            const classId = d.class_id;
            if (classId) {
                byClass[classId] = (byClass[classId] || 0) + 1;
            }
        });

        const activeEnrollments = data.filter(d => d.enrollment_status === 'ENROLLED');
        const avgAttendance = activeEnrollments.length > 0
            ? activeEnrollments.reduce((sum, d) => sum + (d.attendance_percentage || 0), 0) / activeEnrollments.length
            : 0;

        return {
            total_students: totalStudents,
            students_with_overdue_payments: overdueStudents,
            total_fees_collected: totalCollected,
            total_outstanding_fees: totalOutstanding,
            students_by_payment_status: byPaymentStatus,
            total_class_enrollments: data.length,
            active_class_enrollments: activeEnrollments.length,
            average_attendance: Number(avgAttendance.toFixed(2)),
            students_by_enrollment_status: byEnrollmentStatus,
            students_by_class: byClass,
        };
    }
}

// Export singleton instance
export const branchStudentsService = BranchStudentsService.getInstance();
