/**
 * Student Attendance Service
 * 
 * Handles all student attendance database operations and API interactions.
 * Provides a clean, type-safe interface for CRUD operations with RLS support.
 * Implements singleton pattern for optimal performance and memory usage.
 * 
 * @module branch-system/services/student-attendance
 */

import { createClient } from '@/lib/supabase/client';
import type {
    StudentAttendance,
    StudentAttendanceRow,
    MarkAttendanceDTO,
    BulkMarkAttendanceDTO,
    UpdateAttendanceDTO,
    AttendanceFilters,
    AttendanceListParams,
    AttendanceListResponse,
    StudentAttendanceSummary,
    ClassAttendanceReport,
    DailyAttendanceRecord,
    AttendanceStatus,
} from '../types/student-attendance.types';
import {
    markAttendanceSchema,
    bulkMarkAttendanceSchema,
    updateAttendanceSchema,
    attendanceListParamsSchema,
    getAttendanceSummarySchema,
    getClassAttendanceReportSchema,
    type MarkAttendanceSchema,
    type BulkMarkAttendanceSchema,
    type UpdateAttendanceSchema,
    type AttendanceListParamsSchema,
    type GetAttendanceSummarySchema,
    type GetClassAttendanceReportSchema,
} from '../validations/student-attendance.validation';
import {
    toPublicAttendanceRecord,
    calculateAttendanceSummary,
    calculateClassAttendanceReport,
    buildAttendanceQueryFilters,
    validateAttendanceDate,
    validateAttendanceTimes,
    createDailyAttendanceRecord,
    getCurrentDateString,
} from '../utils/student-attendance.utils';

// ============================================================
// TYPES
// ============================================================

/**
 * Operation Result - Generic response wrapper
 */
export interface AttendanceOperationResult<T = unknown> {
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
export interface AttendanceValidationError {
    field: string;
    message: string;
}

// ============================================================
// SERVICE CLASS
// ============================================================

/**
 * Student Attendance Service
 * Singleton service for managing student attendance records
 */
export class StudentAttendanceService {
    private static instance: StudentAttendanceService;
    private supabase = createClient();

    private constructor() { }

    /**
     * Gets singleton instance
     */
    public static getInstance(): StudentAttendanceService {
        if (!StudentAttendanceService.instance) {
            StudentAttendanceService.instance = new StudentAttendanceService();
        }
        return StudentAttendanceService.instance;
    }

    // ============================================================
    // CORE CRUD OPERATIONS
    // ============================================================

    /**
     * Marks attendance for a student
     * 
     * @param input - Attendance data
     * @returns Operation result with attendance record
     */
    async markAttendance(
        input: MarkAttendanceDTO
    ): Promise<AttendanceOperationResult<StudentAttendance>> {
        try {
            // Validate input
            const validationResult = markAttendanceSchema.safeParse(input);
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

            // Additional business validation
            const dateValidation = validateAttendanceDate(validatedInput.attendance_date, false, 7);
            if (!dateValidation.isValid) {
                return {
                    success: false,
                    error: dateValidation.error,
                };
            }

            const timeValidation = validateAttendanceTimes(
                validatedInput.check_in_time,
                validatedInput.check_out_time
            );
            if (!timeValidation.isValid) {
                return {
                    success: false,
                    error: timeValidation.error,
                };
            }

            // Insert attendance record
            const { data, error } = await this.supabase
                .from('student_attendance')
                .insert({
                    student_id: validatedInput.student_id,
                    class_id: validatedInput.class_id,
                    teacher_id: validatedInput.teacher_id,
                    branch_id: validatedInput.branch_id,
                    attendance_date: validatedInput.attendance_date,
                    attendance_status: validatedInput.attendance_status,
                    check_in_time: validatedInput.check_in_time,
                    check_out_time: validatedInput.check_out_time,
                    late_by_minutes: validatedInput.late_by_minutes,
                    early_leave_minutes: validatedInput.early_leave_minutes,
                    teacher_remarks: validatedInput.teacher_remarks,
                    excuse_reason: validatedInput.excuse_reason,
                })
                .select(`
                    *,
                    student:student_id(id, full_name, username, avatar_url),
                    class:class_id(id, class_name, subject, grade_level),
                    teacher:teacher_id(id, full_name),
                    branch:branch_id(id, name)
                `)
                .single();

            if (error) {
                // Handle specific database errors
                if (error.code === '23505') { // Unique constraint violation
                    return {
                        success: false,
                        error: 'Attendance for this student on this date already exists',
                    };
                }

                return {
                    success: false,
                    error: `Database error: ${error.message}`,
                };
            }

            return {
                success: true,
                data: toPublicAttendanceRecord(data),
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Marks attendance for multiple students (bulk operation)
     * 
     * @param input - Bulk attendance data
     * @returns Operation result with attendance records
     */
    async bulkMarkAttendance(
        input: BulkMarkAttendanceDTO
    ): Promise<AttendanceOperationResult<StudentAttendance[]>> {
        try {
            // Validate input
            const validationResult = bulkMarkAttendanceSchema.safeParse(input);
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

            // Validate date
            const dateValidation = validateAttendanceDate(validatedInput.attendance_date, false, 7);
            if (!dateValidation.isValid) {
                return {
                    success: false,
                    error: dateValidation.error,
                };
            }

            // Prepare records for insertion
            const attendanceRecords = validatedInput.attendance_records.map(record => ({
                student_id: record.student_id,
                class_id: validatedInput.class_id,
                teacher_id: validatedInput.teacher_id,
                branch_id: validatedInput.branch_id,
                attendance_date: validatedInput.attendance_date,
                attendance_status: record.attendance_status,
                check_in_time: record.check_in_time,
                check_out_time: record.check_out_time,
                late_by_minutes: record.late_by_minutes || 0,
                early_leave_minutes: 0,
                teacher_remarks: record.teacher_remarks,
                excuse_reason: null,
            }));

            // Insert all records
            const { data, error } = await this.supabase
                .from('student_attendance')
                .insert(attendanceRecords)
                .select(`
                    *,
                    student:student_id(id, full_name, username, avatar_url),
                    class:class_id(id, class_name, subject, grade_level),
                    teacher:teacher_id(id, full_name),
                    branch:branch_id(id, name)
                `);

            if (error) {
                if (error.code === '23505') {
                    return {
                        success: false,
                        error: 'Some attendance records for this date already exist',
                    };
                }

                return {
                    success: false,
                    error: `Database error: ${error.message}`,
                };
            }

            return {
                success: true,
                data: data.map(toPublicAttendanceRecord),
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Updates an existing attendance record
     * 
     * @param input - Update data
     * @returns Operation result with updated record
     */
    async updateAttendance(
        input: UpdateAttendanceDTO
    ): Promise<AttendanceOperationResult<StudentAttendance>> {
        try {
            // Validate input
            const validationResult = updateAttendanceSchema.safeParse(input);
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

            // Validate times if provided
            if (validatedInput.check_in_time || validatedInput.check_out_time) {
                const timeValidation = validateAttendanceTimes(
                    validatedInput.check_in_time,
                    validatedInput.check_out_time
                );
                if (!timeValidation.isValid) {
                    return {
                        success: false,
                        error: timeValidation.error,
                    };
                }
            }

            // Prepare update data (exclude undefined values)
            const updateData: Partial<StudentAttendanceRow> = {};

            if (validatedInput.attendance_status) updateData.attendance_status = validatedInput.attendance_status;
            if (validatedInput.check_in_time !== undefined) updateData.check_in_time = validatedInput.check_in_time;
            if (validatedInput.check_out_time !== undefined) updateData.check_out_time = validatedInput.check_out_time;
            if (validatedInput.late_by_minutes !== undefined) updateData.late_by_minutes = validatedInput.late_by_minutes;
            if (validatedInput.early_leave_minutes !== undefined) updateData.early_leave_minutes = validatedInput.early_leave_minutes;
            if (validatedInput.teacher_remarks !== undefined) updateData.teacher_remarks = validatedInput.teacher_remarks;
            if (validatedInput.excuse_reason !== undefined) updateData.excuse_reason = validatedInput.excuse_reason;

            // Update record
            const { data, error } = await this.supabase
                .from('student_attendance')
                .update(updateData)
                .eq('id', validatedInput.id)
                .select(`
                    *,
                    student:student_id(id, full_name, username, avatar_url),
                    class:class_id(id, class_name, subject, grade_level),
                    teacher:teacher_id(id, full_name),
                    branch:branch_id(id, name)
                `)
                .single();

            if (error) {
                return {
                    success: false,
                    error: `Database error: ${error.message}`,
                };
            }

            if (!data) {
                return {
                    success: false,
                    error: 'Attendance record not found or not authorized to update',
                };
            }

            return {
                success: true,
                data: toPublicAttendanceRecord(data),
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Deletes an attendance record
     * 
     * @param attendanceId - Attendance record ID
     * @returns Operation result
     */
    async deleteAttendance(
        attendanceId: string
    ): Promise<AttendanceOperationResult<{ id: string }>> {
        try {
            if (!attendanceId) {
                return {
                    success: false,
                    error: 'Attendance ID is required',
                };
            }

            const { data, error } = await this.supabase
                .from('student_attendance')
                .delete()
                .eq('id', attendanceId)
                .select('id')
                .single();

            if (error) {
                return {
                    success: false,
                    error: `Database error: ${error.message}`,
                };
            }

            if (!data) {
                return {
                    success: false,
                    error: 'Attendance record not found or not authorized to delete',
                };
            }

            return {
                success: true,
                data: { id: data.id },
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
     * Gets attendance record by ID
     * 
     * @param attendanceId - Attendance record ID
     * @returns Operation result with attendance record
     */
    async getAttendanceById(
        attendanceId: string
    ): Promise<AttendanceOperationResult<StudentAttendance>> {
        try {
            if (!attendanceId) {
                return {
                    success: false,
                    error: 'Attendance ID is required',
                };
            }

            const { data, error } = await this.supabase
                .from('student_attendance')
                .select(`
                    *,
                    student:student_id(id, full_name, username, avatar_url),
                    class:class_id(id, class_name, subject, grade_level),
                    teacher:teacher_id(id, full_name),
                    branch:branch_id(id, name)
                `)
                .eq('id', attendanceId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return {
                        success: false,
                        error: 'Attendance record not found',
                    };
                }
                return {
                    success: false,
                    error: `Database error: ${error.message}`,
                };
            }

            return {
                success: true,
                data: toPublicAttendanceRecord(data),
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Lists attendance records with filtering and pagination
     * 
     * @param params - List parameters
     * @returns Operation result with attendance list
     */
    async listAttendance(
        params: AttendanceListParams = {}
    ): Promise<AttendanceOperationResult<AttendanceListResponse>> {
        try {
            // Validate params
            const validationResult = attendanceListParamsSchema.safeParse(params);
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
            const { page, limit, sort_by, sort_order, ...filters } = validatedParams;

            // Build query
            let query = this.supabase
                .from('student_attendance')
                .select(`
                    *,
                    student:student_id(id, full_name, username, avatar_url),
                    class:class_id(id, class_name, subject, grade_level),
                    teacher:teacher_id(id, full_name),
                    branch:branch_id(id, name)
                `, { count: 'exact' });

            // Apply filters
            const queryFilters = buildAttendanceQueryFilters(filters);
            Object.entries(queryFilters).forEach(([key, value]) => {
                query = query.eq(key, value);
            });

            // Apply date range filters
            if (filters.date_from) {
                query = query.gte('attendance_date', filters.date_from);
            }
            if (filters.date_to) {
                query = query.lte('attendance_date', filters.date_to);
            }

            // Apply sorting
            const ascending = sort_order === 'asc';
            query = query.order(sort_by, { ascending });

            // Apply pagination
            const offset = (page - 1) * limit;
            query = query.range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) {
                return {
                    success: false,
                    error: `Database error: ${error.message}`,
                };
            }

            const totalCount = count || 0;
            const totalPages = Math.ceil(totalCount / limit);
            const hasMore = page < totalPages;

            return {
                success: true,
                data: {
                    data: data.map(toPublicAttendanceRecord),
                    total: totalCount,
                    page,
                    limit,
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

    /**
     * Gets daily attendance records for teacher's class view
     * 
     * @param classId - Class UUID
     * @param date - Date in YYYY-MM-DD format
     * @returns Operation result with daily attendance records
     */
    async getDailyAttendance(
        classId: string,
        date: string = getCurrentDateString()
    ): Promise<AttendanceOperationResult<DailyAttendanceRecord[]>> {
        try {
            if (!classId) {
                return {
                    success: false,
                    error: 'Class ID is required',
                };
            }

            // Get all enrolled students in the class
            const { data: students, error: studentsError } = await this.supabase
                .from('branch_students')
                .select(`
                    student_id,
                    student:student_id(id, full_name, avatar_url)
                `)
                .eq('class_id', classId)
                .eq('enrollment_status', 'ENROLLED');

            if (studentsError) {
                return {
                    success: false,
                    error: `Failed to fetch students: ${studentsError.message}`,
                };
            }

            // Get attendance records for the date
            const { data: attendanceRecords, error: attendanceError } = await this.supabase
                .from('student_attendance')
                .select(`
                    *,
                    student:student_id(id, full_name, username, avatar_url),
                    class:class_id(id, class_name, subject, grade_level),
                    teacher:teacher_id(id, full_name),
                    branch:branch_id(id, name)
                `)
                .eq('class_id', classId)
                .eq('attendance_date', date);

            if (attendanceError) {
                return {
                    success: false,
                    error: `Failed to fetch attendance: ${attendanceError.message}`,
                };
            }

            // Create daily attendance records
            const dailyRecords: DailyAttendanceRecord[] = students.map((studentRecord: any) => {
                const student = studentRecord.student;
                const attendanceRecord = attendanceRecords.find(
                    (record: any) => record.student_id === student.id
                );

                return createDailyAttendanceRecord(
                    {
                        id: student.id,
                        full_name: student.full_name,
                        avatar_url: student.avatar_url,
                    },
                    attendanceRecord ? toPublicAttendanceRecord(attendanceRecord) : null
                );
            });

            return {
                success: true,
                data: dailyRecords,
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // ============================================================
    // ANALYTICS & REPORTING
    // ============================================================

    /**
     * Gets student attendance summary using RPC function
     * 
     * @param params - Summary parameters
     * @returns Operation result with attendance summary
     */
    async getStudentAttendanceSummary(
        params: Omit<GetAttendanceSummarySchema, 'class_id'> & { class_id?: string }
    ): Promise<AttendanceOperationResult<StudentAttendanceSummary>> {
        try {
            // Validate params
            const validationResult = getAttendanceSummarySchema.safeParse(params);
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

            // Try using RPC function first
            try {
                const { data: rpcResult, error: rpcError } = await this.supabase
                    .rpc('get_student_attendance_summary', {
                        student_uuid: validatedParams.student_id,
                        class_uuid: validatedParams.class_id || null,
                        from_date: validatedParams.from_date || null,
                        to_date: validatedParams.to_date || null,
                    });

                if (!rpcError && rpcResult) {
                    return {
                        success: true,
                        data: rpcResult as StudentAttendanceSummary,
                    };
                }
            } catch (rpcError) {
                console.warn('RPC function not available, calculating manually');
            }

            // Fallback: Calculate manually
            const { data: attendanceRecords, error } = await this.supabase
                .from('student_attendance')
                .select('*')
                .eq('student_id', validatedParams.student_id)
                .filter('class_id', validatedParams.class_id ? 'eq' : 'is', validatedParams.class_id)
                .filter('attendance_date', validatedParams.from_date ? 'gte' : 'is', validatedParams.from_date)
                .filter('attendance_date', validatedParams.to_date ? 'lte' : 'is', validatedParams.to_date);

            if (error) {
                return {
                    success: false,
                    error: `Database error: ${error.message}`,
                };
            }

            const summary = calculateAttendanceSummary(
                attendanceRecords.map(toPublicAttendanceRecord)
            );

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
     * Gets class attendance report using RPC function
     * 
     * @param params - Report parameters
     * @returns Operation result with class report
     */
    async getClassAttendanceReport(
        params: GetClassAttendanceReportSchema
    ): Promise<AttendanceOperationResult<ClassAttendanceReport>> {
        try {
            // Validate params
            const validationResult = getClassAttendanceReportSchema.safeParse(params);
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

            // Try using RPC function first
            try {
                const { data: rpcResult, error: rpcError } = await this.supabase
                    .rpc('get_class_attendance_report', {
                        class_uuid: validatedParams.class_id,
                        from_date: validatedParams.from_date || null,
                        to_date: validatedParams.to_date || null,
                    });

                if (!rpcError && rpcResult) {
                    return {
                        success: true,
                        data: rpcResult as ClassAttendanceReport,
                    };
                }
            } catch (rpcError) {
                console.warn('RPC function not available, calculating manually');
            }

            // Fallback: Calculate manually
            const { data: attendanceRecords, error } = await this.supabase
                .from('student_attendance')
                .select('*')
                .eq('class_id', validatedParams.class_id)
                .filter('attendance_date', validatedParams.from_date ? 'gte' : 'is', validatedParams.from_date)
                .filter('attendance_date', validatedParams.to_date ? 'lte' : 'is', validatedParams.to_date);

            if (error) {
                return {
                    success: false,
                    error: `Database error: ${error.message}`,
                };
            }

            const report = calculateClassAttendanceReport(
                validatedParams.class_id,
                attendanceRecords.map(toPublicAttendanceRecord)
            );

            return {
                success: true,
                data: report,
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    // ============================================================
    // TEACHER & CLASS MANAGEMENT
    // ============================================================

    /**
     * Gets attendance records for a teacher's classes
     * 
     * @param teacherId - Teacher UUID
     * @param params - Optional filters
     * @returns Operation result with attendance records
     */
    async getTeacherClassAttendance(
        teacherId: string,
        params: Omit<AttendanceListParams, 'teacher_id'> = {}
    ): Promise<AttendanceOperationResult<AttendanceListResponse>> {
        return this.listAttendance({
            ...params,
            teacher_id: teacherId,
        });
    }

    /**
     * Gets attendance records for a specific student
     * 
     * @param studentId - Student UUID
     * @param params - Optional filters
     * @returns Operation result with attendance records
     */
    async getStudentAttendance(
        studentId: string,
        params: Omit<AttendanceListParams, 'student_id'> = {}
    ): Promise<AttendanceOperationResult<AttendanceListResponse>> {
        return this.listAttendance({
            ...params,
            student_id: studentId,
        });
    }

    /**
     * Gets attendance records for a specific class
     * 
     * @param classId - Class UUID
     * @param params - Optional filters
     * @returns Operation result with attendance records
     */
    async getClassAttendance(
        classId: string,
        params: Omit<AttendanceListParams, 'class_id'> = {}
    ): Promise<AttendanceOperationResult<AttendanceListResponse>> {
        return this.listAttendance({
            ...params,
            class_id: classId,
        });
    }

    /**
     * Gets attendance records for a branch
     * 
     * @param branchId - Branch UUID
     * @param params - Optional filters
     * @returns Operation result with attendance records
     */
    async getBranchAttendance(
        branchId: string,
        params: Omit<AttendanceListParams, 'branch_id'> = {}
    ): Promise<AttendanceOperationResult<AttendanceListResponse>> {
        return this.listAttendance({
            ...params,
            branch_id: branchId,
        });
    }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

/**
 * Student Attendance Service Instance
 * Pre-configured singleton for immediate use
 */
export const studentAttendanceService = StudentAttendanceService.getInstance();

// ============================================================
// TYPE EXPORTS
// ============================================================

export type {
    MarkAttendanceSchema,
    BulkMarkAttendanceSchema,
    UpdateAttendanceSchema,
    AttendanceListParamsSchema,
    GetAttendanceSummarySchema,
    GetClassAttendanceReportSchema,
};

// Re-export types for convenience
export type {
    StudentAttendance,
    MarkAttendanceDTO,
    BulkMarkAttendanceDTO,
    UpdateAttendanceDTO,
    AttendanceFilters,
    AttendanceListParams,
    AttendanceListResponse,
    StudentAttendanceSummary,
    ClassAttendanceReport,
    DailyAttendanceRecord,
    AttendanceStatus,
} from '../types/student-attendance.types';