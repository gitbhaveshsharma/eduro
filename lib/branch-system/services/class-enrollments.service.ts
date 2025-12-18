/**
 * Class Enrollments Service
 * 
 * Service for managing class enrollments (junction table: student ↔ class)
 * Uses student_enrollment_details view for optimized queries
 * 
 * Based on Supabase schema: 019_create_enrollment_update.sql
 * 
 * @module branch-system/services/class-enrollments
 */

import { createClient } from '@/lib/supabase/client';
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
    ClassEnrollmentOperationResult,
    ClassEnrollmentStatus,
} from '../types/class-enrollments.types';
import type { PaginationOptions } from '../types/branch-students.types';
import {
    createClassEnrollmentSchema,
    updateClassEnrollmentByTeacherSchema,
    updateClassEnrollmentByManagerSchema,
    classEnrollmentFilterSchema,
    classEnrollmentSortSchema,
    paginationSchema,
} from '../validations/class-enrollments.validation';

/**
 * Class Enrollments Service
 * Singleton service for managing class enrollments
 */
export class ClassEnrollmentsService {
    private static instance: ClassEnrollmentsService;
    private supabase = createClient();

    // View name for optimized queries
    private readonly ENROLLMENT_VIEW = 'student_enrollment_details';
    private readonly TABLE_NAME = 'class_enrollments';

    private constructor() { }

    /**
     * Gets singleton instance
     */
    static getInstance(): ClassEnrollmentsService {
        if (!ClassEnrollmentsService.instance) {
            ClassEnrollmentsService.instance = new ClassEnrollmentsService();
        }
        return ClassEnrollmentsService.instance;
    }

    // ============================================================
    // CREATE OPERATIONS
    // ============================================================

    /**
     * Creates a new class enrollment
     * Enrolls a student in a specific class
     * 
     * @param input - Enrollment data
     * @returns Operation result with enrollment data
     */
    async createClassEnrollment(
        input: CreateClassEnrollmentInput
    ): Promise<ClassEnrollmentOperationResult<ClassEnrollment>> {
        try {
            // Validate input
            const validation = createClassEnrollmentSchema.safeParse(input);
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

            // Insert into class_enrollments table
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .insert({
                    student_id: validation.data.student_id,
                    branch_id: validation.data.branch_id,
                    class_id: validation.data.class_id,
                    branch_student_id: validation.data.branch_student_id || null,
                    enrollment_date: validation.data.enrollment_date || new Date().toISOString().split('T')[0],
                    enrollment_status: validation.data.enrollment_status || 'ENROLLED',
                    expected_completion_date: validation.data.expected_completion_date || null,
                    preferred_batch: validation.data.preferred_batch || null,
                    special_requirements: validation.data.special_requirements || null,
                    metadata: validation.data.metadata || {},
                })
                .select()
                .single();

            if (error) {
                // Handle duplicate enrollment error (student already enrolled in this class)
                if (error.code === '23505') {
                    return {
                        success: false,
                        error: 'Student is already enrolled in this class',
                    };
                }

                return {
                    success: false,
                    error: `Failed to create class enrollment: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data as ClassEnrollment,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Enrolls a student in multiple classes at once
     * 
     * @param studentId - Student UUID
     * @param branchId - Branch UUID
     * @param classIds - Array of class UUIDs
     * @param branchStudentId - Optional branch_students reference
     * @returns Operation result with array of enrollments
     */
    async enrollStudentInMultipleClasses(
        studentId: string,
        branchId: string,
        classIds: string[],
        branchStudentId?: string
    ): Promise<ClassEnrollmentOperationResult<ClassEnrollment[]>> {
        try {
            const enrollments = classIds.map(classId => ({
                student_id: studentId,
                branch_id: branchId,
                class_id: classId,
                branch_student_id: branchStudentId || null,
                enrollment_date: new Date().toISOString().split('T')[0],
                enrollment_status: 'ENROLLED' as ClassEnrollmentStatus,
            }));

            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .insert(enrollments)
                .select();

            if (error) {
                return {
                    success: false,
                    error: `Failed to create class enrollments: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data as ClassEnrollment[],
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
     * Gets a class enrollment by ID from the optimized view
     * 
     * @param enrollmentId - Enrollment UUID
     * @returns Operation result with enriched enrollment data
     */
    async getClassEnrollmentById(
        enrollmentId: string
    ): Promise<ClassEnrollmentOperationResult<ClassEnrollmentWithRelations>> {
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
                        error: 'Class enrollment not found',
                    };
                }
                return {
                    success: false,
                    error: `Failed to fetch class enrollment: ${error.message}`,
                };
            }

            return {
                success: true,
                data: this.mapViewToClassEnrollment(data),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets enriched enrollment data by ID
     * Returns complete data from student_enrollment_details view
     * 
     * @param enrollmentId - Enrollment UUID
     * @returns Operation result with complete enriched enrollment data
     */
    async getEnrichedEnrollmentById(
        enrollmentId: string
    ): Promise<ClassEnrollmentOperationResult<Record<string, any>>> {
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
                    error: `Failed to fetch enriched enrollment: ${error.message}`,
                };
            }

            // Return the complete raw data from the view
            return {
                success: true,
                data: data,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets all class enrollments for a student
     * 
     * @param studentId - Student UUID
     * @param branchId - Optional branch UUID to filter by
     * @returns Operation result with array of enrollments
     */
    async getStudentClassEnrollments(
        studentId: string,
        branchId?: string
    ): Promise<ClassEnrollmentOperationResult<ClassEnrollmentWithRelations[]>> {
        try {
            let query = this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*')
                .eq('student_id', studentId)
                .order('enrollment_date', { ascending: false });

            if (branchId) {
                query = query.eq('branch_id', branchId);
            }

            const { data, error } = await query;

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch student class enrollments: ${error.message}`,
                };
            }

            return {
                success: true,
                data: (data || []).map(this.mapViewToClassEnrollment),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets all enrollments for a specific class
     * 
     * @param classId - Class UUID
     * @param filters - Optional filters
     * @param sort - Optional sort parameters
     * @param pagination - Optional pagination
     * @returns Search result with enrollments and metadata
     */
    async getClassEnrollments(
        classId: string,
        filters?: Omit<ClassEnrollmentFilters, 'class_id'>,
        sort?: ClassEnrollmentSort,
        pagination?: PaginationOptions
    ): Promise<ClassEnrollmentOperationResult<ClassEnrollmentSearchResult>> {
        try {
            const validatedSort = sort ? classEnrollmentSortSchema.parse(sort) : { field: 'enrollment_date', direction: 'desc' };
            const validatedPagination = pagination ? paginationSchema.parse(pagination) : { page: 1, limit: 20 };

            let query = this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*', { count: 'exact' })
                .eq('class_id', classId);

            // Apply filters
            if (filters?.enrollment_status) {
                if (Array.isArray(filters.enrollment_status)) {
                    query = query.in('enrollment_status', filters.enrollment_status);
                } else {
                    query = query.eq('enrollment_status', filters.enrollment_status);
                }
            }

            if (filters?.attendance_min !== undefined) {
                query = query.gte('attendance_percentage', filters.attendance_min);
            }

            if (filters?.attendance_max !== undefined) {
                query = query.lte('attendance_percentage', filters.attendance_max);
            }

            // Apply sorting
            query = query.order(validatedSort.field as string, {
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
                    error: `Failed to fetch class enrollments: ${error.message}`,
                };
            }

            const totalCount = count || 0;
            const totalPages = Math.ceil(totalCount / validatedPagination.limit);

            return {
                success: true,
                data: {
                    enrollments: (data || []).map(this.mapViewToPublicEnrollment),
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
     * Gets all class enrollments for a branch
     * 
     * @param branchId - Branch UUID
     * @param filters - Optional filters
     * @param sort - Optional sort parameters
     * @param pagination - Optional pagination
     * @returns Search result with enrollments and metadata
     */
    async getBranchClassEnrollments(
        branchId: string,
        filters?: Omit<ClassEnrollmentFilters, 'branch_id'>,
        sort?: ClassEnrollmentSort,
        pagination?: PaginationOptions
    ): Promise<ClassEnrollmentOperationResult<ClassEnrollmentSearchResult>> {
        try {
            const validatedFilters = filters ? classEnrollmentFilterSchema.parse({ ...filters, branch_id: branchId }) : { branch_id: branchId };
            const validatedSort = sort ? classEnrollmentSortSchema.parse(sort) : { field: 'enrollment_date', direction: 'desc' };
            const validatedPagination = pagination ? paginationSchema.parse(pagination) : { page: 1, limit: 20 };

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

            // Apply sorting
            query = query.order(validatedSort.field as string, {
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
                    error: `Failed to fetch branch class enrollments: ${error.message}`,
                };
            }

            const totalCount = count || 0;
            const totalPages = Math.ceil(totalCount / validatedPagination.limit);

            return {
                success: true,
                data: {
                    enrollments: (data || []).map(this.mapViewToPublicEnrollment),
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
     * Checks if a student is enrolled in a specific class
     * 
     * @param studentId - Student UUID
     * @param classId - Class UUID
     * @returns Operation result with enrollment if exists
     */
    async checkStudentClassEnrollment(
        studentId: string,
        classId: string
    ): Promise<ClassEnrollmentOperationResult<ClassEnrollmentWithRelations | null>> {
        try {
            const { data, error } = await this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*')
                .eq('student_id', studentId)
                .eq('class_id', classId)
                .maybeSingle();

            if (error) {
                return {
                    success: false,
                    error: `Failed to check enrollment: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data ? this.mapViewToClassEnrollment(data) : null,
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
     * Updates a class enrollment (by teacher)
     * Teachers can only update academic fields
     * 
     * @param enrollmentId - Enrollment UUID
     * @param input - Update data
     * @returns Operation result with updated enrollment
     */
    async updateClassEnrollmentByTeacher(
        enrollmentId: string,
        input: UpdateClassEnrollmentByTeacherInput
    ): Promise<ClassEnrollmentOperationResult<ClassEnrollment>> {
        try {
            const validation = updateClassEnrollmentByTeacherSchema.safeParse(input);
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
                .eq('id', enrollmentId)
                .select()
                .single();

            if (error) {
                return {
                    success: false,
                    error: `Failed to update class enrollment: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data as ClassEnrollment,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Updates a class enrollment (by manager/admin)
     * Managers can update most fields
     * 
     * @param enrollmentId - Enrollment UUID
     * @param input - Update data
     * @returns Operation result with updated enrollment
     */
    async updateClassEnrollmentByManager(
        enrollmentId: string,
        input: UpdateClassEnrollmentByManagerInput
    ): Promise<ClassEnrollmentOperationResult<ClassEnrollment>> {
        try {
            const validation = updateClassEnrollmentByManagerSchema.safeParse(input);
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
                .eq('id', enrollmentId)
                .select()
                .single();

            if (error) {
                return {
                    success: false,
                    error: `Failed to update class enrollment: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data as ClassEnrollment,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Updates enrollment status
     * 
     * @param enrollmentId - Enrollment UUID
     * @param status - New status
     * @param actualCompletionDate - Completion date (required for COMPLETED status)
     * @returns Operation result
     */
    async updateEnrollmentStatus(
        enrollmentId: string,
        status: ClassEnrollmentStatus,
        actualCompletionDate?: string
    ): Promise<ClassEnrollmentOperationResult<ClassEnrollment>> {
        try {
            const updateData: Record<string, any> = {
                enrollment_status: status,
            };

            if (status === 'COMPLETED') {
                updateData.actual_completion_date = actualCompletionDate || new Date().toISOString().split('T')[0];
            }

            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .update(updateData)
                .eq('id', enrollmentId)
                .select()
                .single();

            if (error) {
                return {
                    success: false,
                    error: `Failed to update enrollment status: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data as ClassEnrollment,
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
     * Soft deletes a class enrollment (changes status to DROPPED)
     * 
     * @param enrollmentId - Enrollment UUID
     * @returns Operation result
     */
    async dropClassEnrollment(
        enrollmentId: string
    ): Promise<ClassEnrollmentOperationResult<void>> {
        try {
            const { error } = await this.supabase
                .from(this.TABLE_NAME)
                .update({
                    enrollment_status: 'DROPPED',
                    actual_completion_date: new Date().toISOString().split('T')[0],
                })
                .eq('id', enrollmentId);

            if (error) {
                return {
                    success: false,
                    error: `Failed to drop enrollment: ${error.message}`,
                };
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Hard deletes a class enrollment
     * Use with caution - only for pending/invalid enrollments
     * 
     * @param enrollmentId - Enrollment UUID
     * @returns Operation result
     */
    async deleteClassEnrollment(
        enrollmentId: string
    ): Promise<ClassEnrollmentOperationResult<void>> {
        try {
            const { error } = await this.supabase
                .from(this.TABLE_NAME)
                .delete()
                .eq('id', enrollmentId);

            if (error) {
                return {
                    success: false,
                    error: `Failed to delete enrollment: ${error.message}`,
                };
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // ============================================================
    // STATISTICS & ANALYTICS
    // ============================================================

    /**
     * Gets class enrollment statistics
     * 
     * @param classId - Class UUID
     * @returns Operation result with statistics
     */
    async getClassEnrollmentStats(
        classId: string
    ): Promise<ClassEnrollmentOperationResult<ClassEnrollmentStats>> {
        try {
            const { data, error } = await this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*')
                .eq('class_id', classId);

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch class statistics: ${error.message}`,
                };
            }

            const enrollments = data || [];
            const stats = this.calculateClassStats(classId, enrollments);

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
     * Gets student class enrollment summary
     * 
     * @param studentId - Student UUID
     * @returns Operation result with summary
     */
    async getStudentEnrollmentSummary(
        studentId: string
    ): Promise<ClassEnrollmentOperationResult<StudentClassEnrollmentSummary>> {
        try {
            const { data, error } = await this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*')
                .eq('student_id', studentId);

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch student summary: ${error.message}`,
                };
            }

            const enrollments = data || [];
            const summary = this.calculateStudentSummary(studentId, enrollments);

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
     * Gets branch class enrollment overview
     * 
     * @param branchId - Branch UUID
     * @returns Operation result with overview
     */
    async getBranchEnrollmentOverview(
        branchId: string
    ): Promise<ClassEnrollmentOperationResult<BranchClassEnrollmentOverview>> {
        try {
            const { data, error } = await this.supabase
                .from(this.ENROLLMENT_VIEW)
                .select('*')
                .eq('branch_id', branchId);

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch branch overview: ${error.message}`,
                };
            }

            const enrollments = data || [];
            const overview = this.calculateBranchOverview(branchId, enrollments);

            return {
                success: true,
                data: overview,
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
     * Maps view data to ClassEnrollmentWithRelations type
     */
    private mapViewToClassEnrollment(viewData: any): ClassEnrollmentWithRelations {
        return {
            id: viewData.enrollment_id,
            student_id: viewData.student_id,
            branch_id: viewData.branch_id,
            class_id: viewData.class_id,
            branch_student_id: viewData.branch_student_id,
            enrollment_date: viewData.enrollment_date,
            enrollment_status: viewData.enrollment_status,
            expected_completion_date: viewData.expected_completion_date,
            actual_completion_date: viewData.actual_completion_date,
            attendance_percentage: viewData.attendance_percentage || 0,
            current_grade: viewData.current_grade,
            performance_notes: viewData.performance_notes,
            preferred_batch: viewData.preferred_batch,
            special_requirements: viewData.special_requirements,
            metadata: viewData.metadata,
            created_at: viewData.created_at,
            updated_at: viewData.updated_at,

            // Student profile
            student: {
                id: viewData.student_id,
                full_name: viewData.student_name || '',
                username: viewData.student_username || '',
                email: viewData.student_email || '',
                avatar_url: viewData.avatar_url,
                phone: viewData.student_phone,
                date_of_birth: viewData.date_of_birth,
                gender: viewData.gender,
            },

            // Branch student info
            branch_student: viewData.branch_student_id ? {
                id: viewData.branch_student_id,
                student_name: viewData.branch_student_name,
                student_email: viewData.branch_student_email,
                student_phone: viewData.branch_student_phone,
                emergency_contact_name: viewData.emergency_contact_name,
                emergency_contact_phone: viewData.emergency_contact_phone,
                parent_guardian_name: viewData.parent_guardian_name,
                parent_guardian_phone: viewData.parent_guardian_phone,
                student_notes: viewData.student_notes,
                total_fees_due: viewData.total_fees_due || 0,
                total_fees_paid: viewData.total_fees_paid || 0,
                last_payment_date: viewData.last_payment_date,
                next_payment_due: viewData.next_payment_due,
                payment_status: viewData.payment_status,
            } : undefined,

            // Student address
            student_address: viewData.student_address_id ? {
                id: viewData.student_address_id,
                address_type: viewData.student_address_type,
                label: viewData.student_address_label,
                address_line_1: viewData.student_address_line_1,
                address_line_2: viewData.student_address_line_2,
                city: viewData.student_city,
                district: viewData.student_district,
                state: viewData.student_state,
                pin_code: viewData.student_pin_code,
                country: viewData.student_country,
            } : undefined,

            // Branch information
            branch: {
                id: viewData.branch_id,
                name: viewData.branch_name || '',
                phone: viewData.branch_phone,
                email: viewData.branch_email,
                is_main_branch: viewData.is_main_branch,
                description: viewData.branch_description,
            },

            // Branch manager
            branch_manager: viewData.branch_manager_name ? {
                full_name: viewData.branch_manager_name,
                email: viewData.branch_manager_email,
                phone: viewData.branch_manager_phone,
            } : undefined,

            // Class information
            class: {
                id: viewData.class_id,
                class_name: viewData.class_name || '',
                subject: viewData.subject,
                grade_level: viewData.grade_level,
                batch_name: viewData.batch_name,
                start_date: viewData.class_start_date,
                end_date: viewData.class_end_date,
                start_time: viewData.class_start_time,
                end_time: viewData.class_end_time,
                class_days: viewData.class_days,
                max_students: viewData.class_max_students,
                current_enrollment: viewData.class_current_enrollment,
                fees_amount: viewData.class_fees_amount,
                fees_frequency: viewData.class_fees_frequency,
                status: viewData.class_status,
            },

            // Teacher information
            teacher: viewData.teacher_id ? {
                id: viewData.teacher_id,
                full_name: viewData.teacher_name,
                email: viewData.teacher_email,
                phone: viewData.teacher_phone,
                avatar_url: viewData.teacher_avatar_url,
            } : undefined,

            // Aggregate statistics
            total_days_present: viewData.total_days_present,
            total_days_absent: viewData.total_days_absent,
            total_receipts_paid: viewData.total_receipts_paid,
            total_receipts_pending: viewData.total_receipts_pending,
            total_amount_paid_via_receipts: viewData.total_amount_paid_via_receipts,

            // Computed fields
            days_enrolled: viewData.days_enrolled,
            days_until_completion: viewData.days_until_completion,
            is_payment_overdue: viewData.is_payment_overdue,
            days_until_payment_due: viewData.days_until_payment_due,
            outstanding_balance: viewData.outstanding_balance || 0,
            payment_completion_percentage: viewData.payment_completion_percentage || 0,
        };
    }

    /**
     * Maps view data to PublicClassEnrollment type
     */
    private mapViewToPublicEnrollment(viewData: any): PublicClassEnrollment {
        const enrollmentDuration = this.calculateEnrollmentDuration(
            viewData.enrollment_date,
            viewData.actual_completion_date
        );

        const isOnTrack =
            viewData.enrollment_status === 'ENROLLED' &&
            (viewData.attendance_percentage || 0) >= 75;

        return {
            id: viewData.enrollment_id,
            student_id: viewData.student_id,
            branch_id: viewData.branch_id,
            class_id: viewData.class_id,
            enrollment_date: viewData.enrollment_date,
            enrollment_status: viewData.enrollment_status,
            expected_completion_date: viewData.expected_completion_date,
            attendance_percentage: viewData.attendance_percentage || 0,
            current_grade: viewData.current_grade,
            preferred_batch: viewData.preferred_batch,
            special_requirements: viewData.special_requirements,
            created_at: viewData.created_at,
            updated_at: viewData.updated_at,
            enrollment_duration_days: enrollmentDuration,
            is_on_track: isOnTrack,
        };
    }

    /**
     * Calculates enrollment duration in days
     */
    private calculateEnrollmentDuration(
        enrollmentDate: string,
        completionDate: string | null
    ): number {
        const startDate = new Date(enrollmentDate);
        const endDate = completionDate ? new Date(completionDate) : new Date();
        const diffTime = endDate.getTime() - startDate.getTime();
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    /**
     * Calculates class enrollment statistics
     */
    private calculateClassStats(classId: string, enrollments: any[]): ClassEnrollmentStats {
        const totalEnrolled = enrollments.filter(e => e.enrollment_status === 'ENROLLED').length;
        const pending = enrollments.filter(e => e.enrollment_status === 'PENDING').length;
        const suspended = enrollments.filter(e => e.enrollment_status === 'SUSPENDED').length;
        const dropped = enrollments.filter(e => e.enrollment_status === 'DROPPED').length;
        const completed = enrollments.filter(e => e.enrollment_status === 'COMPLETED').length;

        const activeEnrollments = enrollments.filter(e => e.enrollment_status === 'ENROLLED');
        const avgAttendance = activeEnrollments.length > 0
            ? activeEnrollments.reduce((sum, e) => sum + (e.attendance_percentage || 0), 0) / activeEnrollments.length
            : 0;

        const goodAttendance = activeEnrollments.filter(e => (e.attendance_percentage || 0) >= 75).length;
        const needsAttention = activeEnrollments.filter(e => (e.attendance_percentage || 0) < 60).length;

        return {
            class_id: classId,
            class_name: enrollments[0]?.class_name || '',
            total_enrolled: totalEnrolled,
            pending_enrollments: pending,
            suspended_enrollments: suspended,
            dropped_enrollments: dropped,
            completed_enrollments: completed,
            average_attendance: Number(avgAttendance.toFixed(2)),
            students_with_good_attendance: goodAttendance,
            students_needing_attention: needsAttention,
        };
    }

    /**
     * Calculates student enrollment summary
     */
    private calculateStudentSummary(studentId: string, enrollments: any[]): StudentClassEnrollmentSummary {
        const classesByStatus: Record<ClassEnrollmentStatus, number> = {
            ENROLLED: 0,
            PENDING: 0,
            SUSPENDED: 0,
            DROPPED: 0,
            COMPLETED: 0,
        };

        enrollments.forEach(e => {
            const status = e.enrollment_status as ClassEnrollmentStatus;
            if (classesByStatus[status] !== undefined) {
                classesByStatus[status]++;
            }
        });

        const activeEnrollments = enrollments.filter(e => e.enrollment_status === 'ENROLLED');
        const avgAttendance = activeEnrollments.length > 0
            ? activeEnrollments.reduce((sum, e) => sum + (e.attendance_percentage || 0), 0) / activeEnrollments.length
            : 0;

        return {
            student_id: studentId,
            total_class_enrollments: enrollments.length,
            active_class_enrollments: classesByStatus.ENROLLED,
            completed_class_enrollments: classesByStatus.COMPLETED,
            average_attendance: Number(avgAttendance.toFixed(2)),
            classes_by_status: classesByStatus,
        };
    }

    /**
     * Calculates branch enrollment overview
     */
    private calculateBranchOverview(branchId: string, enrollments: any[]): BranchClassEnrollmentOverview {
        const enrollmentsByStatus: Record<ClassEnrollmentStatus, number> = {
            ENROLLED: 0,
            PENDING: 0,
            SUSPENDED: 0,
            DROPPED: 0,
            COMPLETED: 0,
        };

        const enrollmentsByClass: Record<string, number> = {};

        enrollments.forEach(e => {
            const status = e.enrollment_status as ClassEnrollmentStatus;
            if (enrollmentsByStatus[status] !== undefined) {
                enrollmentsByStatus[status]++;
            }

            const classId = e.class_id;
            if (classId) {
                enrollmentsByClass[classId] = (enrollmentsByClass[classId] || 0) + 1;
            }
        });

        const activeEnrollments = enrollments.filter(e => e.enrollment_status === 'ENROLLED');
        const avgAttendance = activeEnrollments.length > 0
            ? activeEnrollments.reduce((sum, e) => sum + (e.attendance_percentage || 0), 0) / activeEnrollments.length
            : 0;

        return {
            branch_id: branchId,
            total_enrollments: enrollments.length,
            enrollments_by_status: enrollmentsByStatus,
            enrollments_by_class: enrollmentsByClass,
            average_attendance: Number(avgAttendance.toFixed(2)),
        };
    }
}

// Export singleton instance
export const classEnrollmentsService = ClassEnrollmentsService.getInstance();
