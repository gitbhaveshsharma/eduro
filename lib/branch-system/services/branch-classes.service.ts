/**
 * Branch Classes Service
 * 
 * Handles all branch class database operations and API interactions
 * Provides a clean, type-safe interface for CRUD operations
 * 
 * @module branch-system/services/branch-classes
 */

import { createClient } from '@/lib/supabase/client';
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
    BranchClassOperationResult,
    ClassAvailability,
    TeacherClassSummary,
    BranchClassSummary,
} from '../types/branch-classes.types';
import {
    createBranchClassSchema,
    updateBranchClassSchema,
    branchClassFilterSchema,
    branchClassSortSchema,
    paginationSchema,
} from '../validations/branch-classes.validation';
import {
    toPublicBranchClass,
    calculateAvailableSeats,
    isClassFull,
    getClassAvailability,
    calculateClassStats,
} from '../utils/branch-classes.utils';

/**
 * Branch Classes Service
 * Singleton service for managing branch classes
 */
export class BranchClassesService {
    private static instance: BranchClassesService;
    private supabase = createClient();

    private constructor() { }

    /**
     * Gets singleton instance
     */
    static getInstance(): BranchClassesService {
        if (!BranchClassesService.instance) {
            BranchClassesService.instance = new BranchClassesService();
        }
        return BranchClassesService.instance;
    }

    // ============================================================
    // CREATE OPERATIONS
    // ============================================================

    /**
     * Creates a new branch class
     * @param input - Class creation data
     * @returns Operation result with created class
     */
    async createClass(
        input: CreateBranchClassInput
    ): Promise<BranchClassOperationResult<BranchClass>> {
        try {
            // Validate input
            const validation = createBranchClassSchema.safeParse(input);
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

            // Insert class
            const { data, error } = await this.supabase
                .from('branch_classes')
                .insert(validation.data)
                .select()
                .single();

            if (error) {
                return {
                    success: false,
                    error: `Failed to create class: ${error.message}`,
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
    // READ OPERATIONS
    // ============================================================

    /**
     * Gets a class by ID
     * @param classId - Class UUID
     * @returns Operation result with class data
     */
    async getClassById(
        classId: string
    ): Promise<BranchClassOperationResult<BranchClass>> {
        try {
            const { data, error } = await this.supabase
                .from('branch_classes')
                .select('*')
                .eq('id', classId)
                .single();

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch class: ${error.message}`,
                };
            }

            if (!data) {
                return {
                    success: false,
                    error: 'Class not found',
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
     * Gets a public class by ID (for students/public view)
     * @param classId - Class UUID
     * @returns Operation result with public class data
     */
    async getPublicClassById(
        classId: string
    ): Promise<BranchClassOperationResult<PublicBranchClass>> {
        try {
            const result = await this.getClassById(classId);

            if (!result.success || !result.data) {
                return {
                    success: false,
                    error: result.error || 'Failed to fetch class',
                };
            }

            // Filter based on visibility and status
            if (!result.data.is_visible || result.data.status === 'INACTIVE') {
                return {
                    success: false,
                    error: 'Class not available',
                };
            }

            return {
                success: true,
                data: toPublicBranchClass(result.data),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets class with related data (branch and teacher info)
     * @param classId - Class UUID
     * @returns Operation result with class and relations
     */
    async getClassWithRelations(
        classId: string
    ): Promise<BranchClassOperationResult<BranchClassWithRelations>> {
        try {
            const { data, error } = await this.supabase
                .from('branch_classes')
                .select(`
          *,
          branch:coaching_branches(id, name, coaching_center_id),
          teacher:profiles(id, full_name, username, avatar_url)
        `)
                .eq('id', classId)
                .single();

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch class: ${error.message}`,
                };
            }

            if (!data) {
                return {
                    success: false,
                    error: 'Class not found',
                };
            }

            return {
                success: true,
                data: data as BranchClassWithRelations,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets classes by branch ID
     * @param branchId - Branch UUID
     * @param includeInactive - Whether to include inactive classes
     * @returns Operation result with classes array
     */
    async getClassesByBranch(
        branchId: string,
        includeInactive: boolean = false
    ): Promise<BranchClassOperationResult<BranchClass[]>> {
        try {
            let query = this.supabase
                .from('branch_classes')
                .select('*')
                .eq('branch_id', branchId);

            if (!includeInactive) {
                query = query.eq('status', 'ACTIVE');
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch classes: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data || [],
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets classes by teacher ID
     * @param teacherId - Teacher UUID
     * @returns Operation result with classes array
     */
    async getClassesByTeacher(
        teacherId: string
    ): Promise<BranchClassOperationResult<BranchClass[]>> {
        try {
            const { data, error } = await this.supabase
                .from('branch_classes')
                .select('*')
                .eq('teacher_id', teacherId)
                .order('created_at', { ascending: false });

            if (error) {
                return {
                    success: false,
                    error: `Failed to fetch classes: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data || [],
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Searches and filters classes with pagination
     * @param filters - Filter criteria
     * @param sort - Sort options
     * @param pagination - Pagination options
     * @returns Search result with classes and metadata
     */
    async searchClasses(
        filters: BranchClassFilters = {},
        sort: BranchClassSort = { field: 'created_at', direction: 'desc' },
        pagination: PaginationOptions = { page: 1, limit: 20 }
    ): Promise<BranchClassOperationResult<BranchClassSearchResult>> {
        try {
            // Validate inputs
            const filterValidation = branchClassFilterSchema.safeParse(filters);
            const sortValidation = branchClassSortSchema.safeParse(sort);
            const paginationValidation = paginationSchema.safeParse(pagination);

            if (!filterValidation.success || !sortValidation.success || !paginationValidation.success) {
                return {
                    success: false,
                    error: 'Invalid search parameters',
                };
            }

            // Build query
            let query = this.supabase.from('branch_classes').select('*', { count: 'exact' });

            // Apply filters
            if (filters.branch_id) {
                query = query.eq('branch_id', filters.branch_id);
            }

            if (filters.teacher_id) {
                query = query.eq('teacher_id', filters.teacher_id);
            }

            if (filters.subject) {
                query = query.eq('subject', filters.subject);
            }

            if (filters.grade_level) {
                query = query.eq('grade_level', filters.grade_level);
            }

            if (filters.status) {
                if (Array.isArray(filters.status)) {
                    query = query.in('status', filters.status);
                } else {
                    query = query.eq('status', filters.status);
                }
            }

            if (filters.is_visible !== undefined) {
                query = query.eq('is_visible', filters.is_visible);
            }

            if (filters.has_available_seats) {
                query = query.lt('current_enrollment', 'max_students');
            }

            if (filters.start_date_from) {
                query = query.gte('start_date', filters.start_date_from);
            }

            if (filters.start_date_to) {
                query = query.lte('start_date', filters.start_date_to);
            }

            if (filters.class_days && filters.class_days.length > 0) {
                query = query.overlaps('class_days', filters.class_days);
            }

            if (filters.search_query) {
                query = query.or(
                    `class_name.ilike.%${filters.search_query}%,subject.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%`
                );
            }

            // Apply sorting
            query = query.order(sort.field, { ascending: sort.direction === 'asc' });

            // Apply pagination
            const from = (pagination.page - 1) * pagination.limit;
            const to = from + pagination.limit - 1;
            query = query.range(from, to);

            // Execute query
            const { data, error, count } = await query;

            if (error) {
                return {
                    success: false,
                    error: `Failed to search classes: ${error.message}`,
                };
            }

            const totalCount = count || 0;
            const totalPages = Math.ceil(totalCount / pagination.limit);
            const hasMore = pagination.page < totalPages;

            return {
                success: true,
                data: {
                    classes: (data || []).map(toPublicBranchClass),
                    total_count: totalCount,
                    page: pagination.page,
                    limit: pagination.limit,
                    total_pages: totalPages,
                    has_more: hasMore,
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
    // UPDATE OPERATIONS
    // ============================================================

    /**
     * Updates a class
     * @param classId - Class UUID
     * @param input - Update data
     * @returns Operation result with updated class
     */
    async updateClass(
        classId: string,
        input: UpdateBranchClassInput
    ): Promise<BranchClassOperationResult<BranchClass>> {
        try {
            // Validate input
            const validation = updateBranchClassSchema.safeParse(input);
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

            // Update class
            const { data, error } = await this.supabase
                .from('branch_classes')
                .update(validation.data)
                .eq('id', classId)
                .select()
                .single();

            if (error) {
                return {
                    success: false,
                    error: `Failed to update class: ${error.message}`,
                };
            }

            if (!data) {
                return {
                    success: false,
                    error: 'Class not found',
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
     * Updates class status
     * @param classId - Class UUID
     * @param status - New status
     * @returns Operation result
     */
    async updateClassStatus(
        classId: string,
        status: BranchClass['status']
    ): Promise<BranchClassOperationResult<BranchClass>> {
        return this.updateClass(classId, { status });
    }

    /**
     * Updates class visibility
     * @param classId - Class UUID
     * @param isVisible - Visibility flag
     * @returns Operation result
     */
    async updateClassVisibility(
        classId: string,
        isVisible: boolean
    ): Promise<BranchClassOperationResult<BranchClass>> {
        return this.updateClass(classId, { is_visible: isVisible });
    }

    // ============================================================
    // DELETE OPERATIONS
    // ============================================================

    /**
     * Deletes a class
     * @param classId - Class UUID
     * @returns Operation result
     */
    async deleteClass(classId: string): Promise<BranchClassOperationResult<void>> {
        try {
            const { error } = await this.supabase
                .from('branch_classes')
                .delete()
                .eq('id', classId);

            if (error) {
                return {
                    success: false,
                    error: `Failed to delete class: ${error.message}`,
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
    // STATISTICS & ANALYTICS
    // ============================================================

    /**
     * Gets class statistics for a branch
     * @param branchId - Branch UUID
     * @returns Operation result with statistics
     */
    async getBranchClassStats(
        branchId: string
    ): Promise<BranchClassOperationResult<BranchClassStats>> {
        try {
            const result = await this.getClassesByBranch(branchId, true);

            if (!result.success || !result.data) {
                return {
                    success: false,
                    error: result.error || 'Failed to fetch classes',
                };
            }

            const stats = calculateClassStats(result.data);

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
     * Gets teacher's class summary
     * @param teacherId - Teacher UUID
     * @returns Operation result with teacher summary
     */
    async getTeacherClassSummary(
        teacherId: string
    ): Promise<BranchClassOperationResult<TeacherClassSummary>> {
        try {
            const result = await this.getClassesByTeacher(teacherId);

            if (!result.success || !result.data) {
                return {
                    success: false,
                    error: result.error || 'Failed to fetch classes',
                };
            }

            // Fetch teacher info
            const { data: teacher, error: teacherError } = await this.supabase
                .from('profiles')
                .select('full_name')
                .eq('id', teacherId)
                .single();

            if (teacherError) {
                return {
                    success: false,
                    error: `Failed to fetch teacher info: ${teacherError.message}`,
                };
            }

            const activeClasses = result.data.filter((c) => c.status === 'ACTIVE');
            const totalStudents = result.data.reduce((sum, c) => sum + c.current_enrollment, 0);

            return {
                success: true,
                data: {
                    teacher_id: teacherId,
                    teacher_name: teacher?.full_name || 'Unknown',
                    total_classes: result.data.length,
                    active_classes: activeClasses.length,
                    total_students: totalStudents,
                    classes: result.data.map(toPublicBranchClass),
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
     * Gets class availability information
     * @param classId - Class UUID
     * @returns Operation result with availability info
     */
    async getClassAvailability(
        classId: string
    ): Promise<BranchClassOperationResult<ClassAvailability>> {
        try {
            const result = await this.getClassById(classId);

            if (!result.success || !result.data) {
                return {
                    success: false,
                    error: result.error || 'Failed to fetch class',
                };
            }

            const availability = getClassAvailability(result.data);

            return {
                success: true,
                data: availability,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets branch class summary
     * @param branchId - Branch UUID
     * @returns Operation result with branch summary
     */
    async getBranchClassSummary(
        branchId: string
    ): Promise<BranchClassOperationResult<BranchClassSummary>> {
        try {
            const result = await this.getClassesByBranch(branchId, true);

            if (!result.success || !result.data) {
                return {
                    success: false,
                    error: result.error || 'Failed to fetch classes',
                };
            }

            // Fetch branch info
            const { data: branch, error: branchError } = await this.supabase
                .from('coaching_branches')
                .select('name')
                .eq('id', branchId)
                .single();

            if (branchError) {
                return {
                    success: false,
                    error: `Failed to fetch branch info: ${branchError.message}`,
                };
            }

            const activeClasses = result.data.filter((c) => c.status === 'ACTIVE');
            const totalCapacity = result.data.reduce((sum, c) => sum + c.max_students, 0);
            const totalEnrolled = result.data.reduce((sum, c) => sum + c.current_enrollment, 0);
            const utilizationRate = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;

            return {
                success: true,
                data: {
                    branch_id: branchId,
                    branch_name: branch?.name || 'Unknown',
                    total_classes: result.data.length,
                    active_classes: activeClasses.length,
                    total_capacity: totalCapacity,
                    total_enrolled: totalEnrolled,
                    utilization_rate: Math.round(utilizationRate),
                },
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
export const branchClassesService = BranchClassesService.getInstance();
