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
    UpcomingClassData,
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
            console.log('🔵 [createClass] Starting class creation:', input);

            // Validate input
            const validation = createBranchClassSchema.safeParse(input);
            if (!validation.success) {
                console.error('❌ [createClass] Validation failed:', validation.error.errors);
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

            console.log('✅ [createClass] Validation passed, inserting data');

            // Insert class
            const { data, error } = await this.supabase
                .from('branch_classes')
                .insert(validation.data)
                .select()
                .single();

            if (error) {
                console.error('❌ [createClass] Supabase error:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                });
                return {
                    success: false,
                    error: `Failed to create class: ${error.message}`,
                };
            }

            console.log('✅ [createClass] Class created successfully:', data);
            return {
                success: true,
                data,
            };
        } catch (error) {
            console.error('❌ [createClass] Unexpected error:', error);
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
            console.log('🔵 [getClassById] Fetching class:', classId);

            const { data, error } = await this.supabase
                .from('branch_classes')
                .select('*')
                .eq('id', classId)
                .single();

            if (error) {
                console.error('❌ [getClassById] Supabase error:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                });
                return {
                    success: false,
                    error: `Failed to fetch class: ${error.message}`,
                };
            }

            if (!data) {
                console.warn('⚠️ [getClassById] Class not found:', classId);
                return {
                    success: false,
                    error: 'Class not found',
                };
            }

            console.log('✅ [getClassById] Class fetched successfully:', data);
            return {
                success: true,
                data,
            };
        } catch (error) {
            console.error('❌ [getClassById] Unexpected error:', error);
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
            console.log('🔵 [getPublicClassById] Fetching public class:', classId);

            const result = await this.getClassById(classId);

            if (!result.success || !result.data) {
                console.error('❌ [getPublicClassById] Failed to fetch class:', result.error);
                return {
                    success: false,
                    error: result.error || 'Failed to fetch class',
                };
            }

            // Filter based on visibility and status
            if (!result.data.is_visible || result.data.status === 'INACTIVE') {
                console.warn('⚠️ [getPublicClassById] Class not available (visibility or status):', {
                    is_visible: result.data.is_visible,
                    status: result.data.status,
                });
                return {
                    success: false,
                    error: 'Class not available',
                };
            }

            console.log('✅ [getPublicClassById] Public class fetched successfully');
            return {
                success: true,
                data: toPublicBranchClass(result.data),
            };
        } catch (error) {
            console.error('❌ [getPublicClassById] Unexpected error:', error);
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
            console.log('🔵 [getClassWithRelations] Fetching class with relations:', classId);

            const { data, error } = await this.supabase
                .from('branch_classes')
                .select(`
          *,
          branch:coaching_branches(id, name, coaching_center_id),
          teacher:profiles(id, full_name, username)
        `)
                .eq('id', classId)
                .single();

            if (error) {
                console.error('❌ [getClassWithRelations] Supabase error:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                });
                return {
                    success: false,
                    error: `Failed to fetch class: ${error.message}`,
                };
            }

            if (!data) {
                console.warn('⚠️ [getClassWithRelations] Class not found:', classId);
                return {
                    success: false,
                    error: 'Class not found',
                };
            }

            console.log('✅ [getClassWithRelations] Class with relations fetched:', {
                classId: data.id,
                branchId: data.branch?.id,
                teacherId: data.teacher?.id,
            });

            return {
                success: true,
                data: data as BranchClassWithRelations,
            };
        } catch (error) {
            console.error('❌ [getClassWithRelations] Unexpected error:', error);
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
            console.log('🔵 [getClassesByBranch] Fetching classes for branch:', {
                branchId,
                includeInactive,
            });

            let query = this.supabase
                .from('branch_classes')
                .select('*')
                .eq('branch_id', branchId);

            if (!includeInactive) {
                query = query.eq('status', 'ACTIVE');
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) {
                console.error('❌ [getClassesByBranch] Supabase error:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                });
                return {
                    success: false,
                    error: `Failed to fetch classes: ${error.message}`,
                };
            }

            // console.log('✅ [getClassesByBranch] Classes fetched:', {
            //     branchId,
            //     count: data?.length || 0,
            // });

            return {
                success: true,
                data: data || [],
            };
        } catch (error) {
            console.error('❌ [getClassesByBranch] Unexpected error:', error);
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
            // console.log('🔵 [getClassesByTeacher] Fetching classes for teacher:', teacherId);

            const { data, error } = await this.supabase
                .from('branch_classes')
                .select('*')
                .eq('teacher_id', teacherId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ [getClassesByTeacher] Supabase error:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                });
                return {
                    success: false,
                    error: `Failed to fetch classes: ${error.message}`,
                };
            }

            // console.log('✅ [getClassesByTeacher] Classes fetched:', {
            //     teacherId,
            //     count: data?.length || 0,
            // });

            return {
                success: true,
                data: data || [],
            };
        } catch (error) {
            console.error('❌ [getClassesByTeacher] Unexpected error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Gets all classes for a coaching center (across all branches)
     * @param coachingCenterId - Coaching Center UUID
     * @param includeInactive - Whether to include inactive classes
     * @returns Operation result with classes array
     */
    async getClassesByCoachingCenter(
        coachingCenterId: string,
        includeInactive: boolean = false
    ): Promise<BranchClassOperationResult<BranchClass[]>> {
        try {
            //     console.log('🔵 [getClassesByCoachingCenter] Fetching classes for coaching center:', {
            //     coachingCenterId,
            //     includeInactive,
            // });

            // Join with coaching_branches to filter by coaching_center_id
            let query = this.supabase
                .from('branch_classes')
                .select(`
                    *,
                    branch:coaching_branches!inner(id, name, coaching_center_id)
                `)
                .eq('branch.coaching_center_id', coachingCenterId);

            if (!includeInactive) {
                query = query.eq('status', 'ACTIVE');
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) {
                console.error('❌ [getClassesByCoachingCenter] Supabase error:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                });
                return {
                    success: false,
                    error: `Failed to fetch classes: ${error.message}`,
                };
            }

            // console.log('✅ [getClassesByCoachingCenter] Classes fetched:', {
            //     coachingCenterId,
            //     count: data?.length || 0,
            // });

            return {
                success: true,
                data: data || [],
            };
        } catch (error) {
            console.error('❌ [getClassesByCoachingCenter] Unexpected error:', error);
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
            console.log('🔵 [searchClasses] Starting search with params:', {
                filters,
                sort,
                pagination,
            });

            // Validate inputs
            const filterValidation = branchClassFilterSchema.safeParse(filters);
            const sortValidation = branchClassSortSchema.safeParse(sort);
            const paginationValidation = paginationSchema.safeParse(pagination);

            if (!filterValidation.success || !sortValidation.success || !paginationValidation.success) {
                console.error('❌ [searchClasses] Validation failed:', {
                    filters: filterValidation.success ? 'OK' : filterValidation.error,
                    sort: sortValidation.success ? 'OK' : sortValidation.error,
                    pagination: paginationValidation.success ? 'OK' : paginationValidation.error,
                });
                return {
                    success: false,
                    error: 'Invalid search parameters',
                };
            }

            console.log('✅ [searchClasses] Validation passed, building query');

            // Build query - include branch and teacher relations
            let query = this.supabase.from('branch_classes').select(`
                *,
                branch:coaching_branches(id, name, coaching_center_id),
                teacher:profiles(id, full_name, username)
            `, { count: 'exact' });

            console.log('📊 [searchClasses] Base query built with relations');

            // Apply filters
            if (filters.branch_id) {
                console.log('🔍 [searchClasses] Applying branch_id filter:', filters.branch_id);
                query = query.eq('branch_id', filters.branch_id);
            }

            // Filter by coaching center ID (joins with coaching_branches table)
            if (filters.coaching_center_id) {
                console.log('🔍 [searchClasses] Applying coaching_center_id filter:', filters.coaching_center_id);
                query = query.eq('branch.coaching_center_id', filters.coaching_center_id);
            }

            if (filters.teacher_id) {
                console.log('🔍 [searchClasses] Applying teacher_id filter:', filters.teacher_id);
                query = query.eq('teacher_id', filters.teacher_id);
            }

            if (filters.subject) {
                console.log('🔍 [searchClasses] Applying subject filter:', filters.subject);
                query = query.eq('subject', filters.subject);
            }

            if (filters.grade_level) {
                console.log('🔍 [searchClasses] Applying grade_level filter:', filters.grade_level);
                query = query.eq('grade_level', filters.grade_level);
            }

            if (filters.status) {
                if (Array.isArray(filters.status)) {
                    console.log('🔍 [searchClasses] Applying status filter (array):', filters.status);
                    query = query.in('status', filters.status);
                } else {
                    console.log('🔍 [searchClasses] Applying status filter:', filters.status);
                    query = query.eq('status', filters.status);
                }
            }

            if (filters.is_visible !== undefined) {
                console.log('🔍 [searchClasses] Applying is_visible filter:', filters.is_visible);
                query = query.eq('is_visible', filters.is_visible);
            }

            if (filters.has_available_seats) {
                console.log('🔍 [searchClasses] Applying has_available_seats filter');
                query = query.lt('current_enrollment', 'max_students');
            }

            if (filters.start_date_from) {
                console.log('🔍 [searchClasses] Applying start_date_from filter:', filters.start_date_from);
                query = query.gte('start_date', filters.start_date_from);
            }

            if (filters.start_date_to) {
                console.log('🔍 [searchClasses] Applying start_date_to filter:', filters.start_date_to);
                query = query.lte('start_date', filters.start_date_to);
            }

            if (filters.class_days && filters.class_days.length > 0) {
                console.log('🔍 [searchClasses] Applying class_days filter:', filters.class_days);
                query = query.overlaps('class_days', filters.class_days);
            }

            if (filters.search_query) {
                console.log('🔍 [searchClasses] Applying search_query filter:', filters.search_query);
                query = query.or(
                    `class_name.ilike.%${filters.search_query}%,subject.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%`
                );
            }

            // Apply sorting
            console.log('📊 [searchClasses] Applying sort:', sort);
            query = query.order(sort.field, { ascending: sort.direction === 'asc' });

            // Apply pagination
            const from = (pagination.page - 1) * pagination.limit;
            const to = from + pagination.limit - 1;
            console.log('📄 [searchClasses] Applying pagination:', { from, to, page: pagination.page, limit: pagination.limit });
            query = query.range(from, to);

            console.log('🚀 [searchClasses] Executing query...');

            // Execute query
            const { data, error, count } = await query;

            if (error) {
                console.error('❌ [searchClasses] Supabase error:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                });
                return {
                    success: false,
                    error: `Failed to search classes: ${error.message}`,
                };
            }

            const totalCount = count || 0;
            const totalPages = Math.ceil(totalCount / pagination.limit);
            const hasMore = pagination.page < totalPages;

            console.log('✅ [searchClasses] Search completed successfully:', {
                resultsCount: data?.length || 0,
                totalCount,
                totalPages,
                currentPage: pagination.page,
                hasMore,
            });

            console.log('📦 [searchClasses] Raw data from Supabase:', data);

            const mappedClasses = (data || []).map(toPublicBranchClass);

            console.log('📦 [searchClasses] Mapped public classes:', mappedClasses);

            return {
                success: true,
                data: {
                    classes: mappedClasses,
                    total_count: totalCount,
                    page: pagination.page,
                    limit: pagination.limit,
                    total_pages: totalPages,
                    has_more: hasMore,
                },
            };
        } catch (error) {
            console.error('❌ [searchClasses] Unexpected error:', error);
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
            console.log('🔵 [updateClass] Updating class:', { classId, input });

            // Validate input
            const validation = updateBranchClassSchema.safeParse(input);
            if (!validation.success) {
                console.error('❌ [updateClass] Validation failed:', validation.error.errors);
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

            console.log('✅ [updateClass] Validation passed, updating data');

            // Update class
            const { data, error } = await this.supabase
                .from('branch_classes')
                .update(validation.data)
                .eq('id', classId)
                .select()
                .single();

            if (error) {
                console.error('❌ [updateClass] Supabase error:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                });
                return {
                    success: false,
                    error: `Failed to update class: ${error.message}`,
                };
            }

            if (!data) {
                console.warn('⚠️ [updateClass] Class not found:', classId);
                return {
                    success: false,
                    error: 'Class not found',
                };
            }

            console.log('✅ [updateClass] Class updated successfully:', data);
            return {
                success: true,
                data,
            };
        } catch (error) {
            console.error('❌ [updateClass] Unexpected error:', error);
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
        console.log('🔵 [updateClassStatus] Updating status:', { classId, status });
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
        console.log('🔵 [updateClassVisibility] Updating visibility:', { classId, isVisible });
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
            console.log('🔵 [deleteClass] Deleting class:', classId);

            const { error } = await this.supabase
                .from('branch_classes')
                .delete()
                .eq('id', classId);

            if (error) {
                console.error('❌ [deleteClass] Supabase error:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                });
                return {
                    success: false,
                    error: `Failed to delete class: ${error.message}`,
                };
            }

            console.log('✅ [deleteClass] Class deleted successfully');
            return {
                success: true,
            };
        } catch (error) {
            console.error('❌ [deleteClass] Unexpected error:', error);
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
            console.log('🔵 [getBranchClassStats] Fetching stats for branch:', branchId);

            const result = await this.getClassesByBranch(branchId, true);

            if (!result.success || !result.data) {
                console.error('❌ [getBranchClassStats] Failed to fetch classes:', result.error);
                return {
                    success: false,
                    error: result.error || 'Failed to fetch classes',
                };
            }

            const stats = calculateClassStats(result.data);

            console.log('✅ [getBranchClassStats] Stats calculated:', stats);
            return {
                success: true,
                data: stats,
            };
        } catch (error) {
            console.error('❌ [getBranchClassStats] Unexpected error:', error);
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
            console.log('🔵 [getTeacherClassSummary] Fetching summary for teacher:', teacherId);

            const result = await this.getClassesByTeacher(teacherId);

            if (!result.success || !result.data) {
                console.error('❌ [getTeacherClassSummary] Failed to fetch classes:', result.error);
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
                console.error('❌ [getTeacherClassSummary] Failed to fetch teacher info:', teacherError);
                return {
                    success: false,
                    error: `Failed to fetch teacher info: ${teacherError.message}`,
                };
            }

            const activeClasses = result.data.filter((c) => c.status === 'ACTIVE');
            const totalStudents = result.data.reduce((sum, c) => sum + c.current_enrollment, 0);

            const summary = {
                teacher_id: teacherId,
                teacher_name: teacher?.full_name || 'Unknown',
                total_classes: result.data.length,
                active_classes: activeClasses.length,
                total_students: totalStudents,
                classes: result.data.map(toPublicBranchClass),
            };

            console.log('✅ [getTeacherClassSummary] Summary calculated:', {
                teacher_id: summary.teacher_id,
                total_classes: summary.total_classes,
                active_classes: summary.active_classes,
                total_students: summary.total_students,
            });

            return {
                success: true,
                data: summary,
            };
        } catch (error) {
            console.error('❌ [getTeacherClassSummary] Unexpected error:', error);
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
            console.log('🔵 [getClassAvailability] Fetching availability for class:', classId);

            const result = await this.getClassById(classId);

            if (!result.success || !result.data) {
                console.error('❌ [getClassAvailability] Failed to fetch class:', result.error);
                return {
                    success: false,
                    error: result.error || 'Failed to fetch class',
                };
            }

            const availability = getClassAvailability(result.data);

            console.log('✅ [getClassAvailability] Availability calculated:', availability);
            return {
                success: true,
                data: availability,
            };
        } catch (error) {
            console.error('❌ [getClassAvailability] Unexpected error:', error);
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
            console.log('🔵 [getBranchClassSummary] Fetching summary for branch:', branchId);

            const result = await this.getClassesByBranch(branchId, true);

            if (!result.success || !result.data) {
                console.error('❌ [getBranchClassSummary] Failed to fetch classes:', result.error);
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
                console.error('❌ [getBranchClassSummary] Failed to fetch branch info:', branchError);
                return {
                    success: false,
                    error: `Failed to fetch branch info: ${branchError.message}`,
                };
            }

            const activeClasses = result.data.filter((c) => c.status === 'ACTIVE');
            const totalCapacity = result.data.reduce((sum, c) => sum + c.max_students, 0);
            const totalEnrolled = result.data.reduce((sum, c) => sum + c.current_enrollment, 0);
            const utilizationRate = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;

            const summary = {
                branch_id: branchId,
                branch_name: branch?.name || 'Unknown',
                total_classes: result.data.length,
                active_classes: activeClasses.length,
                total_capacity: totalCapacity,
                total_enrolled: totalEnrolled,
                utilization_rate: Math.round(utilizationRate),
            };

            console.log('✅ [getBranchClassSummary] Summary calculated:', {
                branch_id: summary.branch_id,
                total_classes: summary.total_classes,
                active_classes: summary.active_classes,
                utilization_rate: summary.utilization_rate,
            });

            return {
                success: true,
                data: summary,
            };
        } catch (error) {
            console.error('❌ [getBranchClassSummary] Unexpected error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // ============================================================
    // UPCOMING CLASSES (RPC)
    // ============================================================

    /**
     * Gets upcoming classes for a student
     * Uses RPC function to get enrolled classes that are active and not ended
     * @param studentId - Student UUID
     * @returns Operation result with upcoming classes array
     */
    async getUpcomingClasses(
        studentId: string
    ): Promise<BranchClassOperationResult<UpcomingClassData[]>> {
        try {
            console.log('🔵 [getUpcomingClasses] Fetching upcoming classes for student:', studentId);

            // Call the RPC function
            const { data, error } = await this.supabase
                .rpc('get_upcoming_classes', {
                    p_student_id: studentId
                });

            if (error) {
                console.error('❌ [getUpcomingClasses] Database error:', error);
                return {
                    success: false,
                    error: error.message || 'Failed to fetch upcoming classes',
                };
            }

            if (!data) {
                // console.log('✅ [getUpcomingClasses] No upcoming classes found');
                return {
                    success: true,
                    data: [],
                };
            }

            // console.log('✅ [getUpcomingClasses] Upcoming classes fetched:', {
            //     count: data.length,
            //     studentId,
            // });

            return {
                success: true,
                data: data as UpcomingClassData[],
            };
        } catch (error) {
            console.error('❌ [getUpcomingClasses] Unexpected error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
    * Gets student enrollments filtered by coaching center
    * Uses student_enrollment_details materialized view for optimal performance
    * @param studentId - Student UUID
    * @param coachingCenterId - Coaching Center UUID
    * @returns Operation result with enrollments array
    */
    async getStudentEnrollmentsByCenter(
        studentId: string,
        coachingCenterId: string
    ): Promise<BranchClassOperationResult<UpcomingClassData[]>> {
        try {
            console.log('🔵 [getStudentEnrollmentsByCenter] Fetching enrollments:', {
                studentId,
                coachingCenterId
            });

            // Query materialized view - selects only required columns
            const { data, error } = await this.supabase
                .from('student_enrollment_details')
                .select(`
                enrollment_id,
                enrollment_status,
                attendance_percentage,
                current_grade,
                preferred_batch,
                class_id,
                class_name,
                subject,
                grade_level,
                batch_name,
                class_start_date,
                class_end_date,
                class_start_time,
                class_end_time,
                class_days,
                teacher_id,
                branch_id
            `)
                .eq('student_id', studentId)
                .eq('coaching_center_id', coachingCenterId)
                .eq('enrollment_status', 'ENROLLED')
                .eq('class_status', 'ACTIVE')
                .gte('class_end_date', new Date().toISOString().split('T')[0])
                .order('class_start_date', { ascending: true });

            if (error) {
                console.error('❌ [getStudentEnrollmentsByCenter] Database error:', error);
                return {
                    success: false,
                    error: error.message || 'Failed to fetch student enrollments',
                };
            }

            if (!data || data.length === 0) {
                console.log('✅ [getStudentEnrollmentsByCenter] No enrollments found');
                return {
                    success: true,
                    data: [],
                };
            }

            // Transform to UpcomingClassData interface
            const transformedData: UpcomingClassData[] = data.map((row: any) => {
                // Convert decimal to percentage if needed (database stores as decimal 0-1, we need 0-100)
                const rawAttendance = row.attendance_percentage || 0;
                const attendance_percentage = rawAttendance < 1 && rawAttendance > 0
                    ? rawAttendance * 100
                    : rawAttendance;

                console.log('🔍 [getStudentEnrollmentsByCenter] Attendance conversion:', {
                    raw: rawAttendance,
                    converted: attendance_percentage,
                    classId: row.class_id
                });

                return {
                    enrollment_id: row.enrollment_id,
                    enrollment_status: row.enrollment_status as 'ENROLLED' | 'PENDING' | 'WITHDRAWN' | 'COMPLETED',
                    attendance_percentage,
                    current_grade: row.current_grade,
                    preferred_batch: row.preferred_batch,
                    class_id: row.class_id,
                    class_name: row.class_name,
                    subject: row.subject,
                    description: null,
                    grade_level: row.grade_level,
                    batch_name: row.batch_name,
                    start_date: row.class_start_date,
                    end_date: row.class_end_date,
                    class_days: row.class_days,
                    start_time: row.class_start_time,
                    end_time: row.class_end_time,
                    teacher_id: row.teacher_id,
                    branch_id: row.branch_id,
                };
            });

            console.log('✅ [getStudentEnrollmentsByCenter] Enrollments fetched:', {
                count: transformedData.length,
                studentId,
                coachingCenterId
            });

            return {
                success: true,
                data: transformedData,
            };
        } catch (error) {
            console.error('❌ [getStudentEnrollmentsByCenter] Unexpected error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

}

// Export singleton instance
export const branchClassesService = BranchClassesService.getInstance();