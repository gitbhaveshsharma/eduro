/**
 * Type definitions for Student Attendance
 * Based on migration: 016_create_branch_student_system.sql
 */

// Enums
export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
  HOLIDAY = 'HOLIDAY',
}

// Database row type
export interface StudentAttendanceRow {
  id: string;
  student_id: string;
  class_id: string;
  teacher_id: string;
  branch_id: string;
  attendance_date: string;
  attendance_status: AttendanceStatus;
  check_in_time: string | null;
  check_out_time: string | null;
  total_duration: string | null; // PostgreSQL interval type as string
  late_by_minutes: number;
  early_leave_minutes: number;
  teacher_remarks: string | null;
  excuse_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Extended type with relations
export interface StudentAttendance extends StudentAttendanceRow {
  student?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  class?: {
    id: string;
    class_name: string;
    subject: string;
    grade_level: string;
  };
  teacher?: {
    id: string;
    full_name: string | null;
  };
  branch?: {
    id: string;
    name: string;
  };
}

// DTO for marking attendance
export interface MarkAttendanceDTO {
  student_id: string;
  class_id: string;
  teacher_id: string;
  branch_id: string;
  attendance_date: string;
  attendance_status: AttendanceStatus;
  check_in_time?: string;
  check_out_time?: string;
  late_by_minutes?: number;
  early_leave_minutes?: number;
  teacher_remarks?: string;
  excuse_reason?: string;
}

// DTO for bulk attendance marking
export interface BulkMarkAttendanceDTO {
  class_id: string;
  teacher_id: string;
  branch_id: string;
  attendance_date: string;
  attendance_records: Array<{
    student_id: string;
    attendance_status: AttendanceStatus;
    check_in_time?: string;
    check_out_time?: string;
    late_by_minutes?: number;
    teacher_remarks?: string;
  }>;
}

// DTO for updating attendance
export interface UpdateAttendanceDTO {
  id: string;
  attendance_status?: AttendanceStatus;
  check_in_time?: string;
  check_out_time?: string;
  late_by_minutes?: number;
  early_leave_minutes?: number;
  teacher_remarks?: string;
  excuse_reason?: string;
}

// Filter types
export interface AttendanceFilters {
  student_id?: string;
  class_id?: string;
  teacher_id?: string;
  branch_id?: string;
  attendance_status?: AttendanceStatus;
  date_from?: string;
  date_to?: string;
  attendance_date?: string;
}

// List params
export interface AttendanceListParams extends AttendanceFilters {
  page?: number;
  limit?: number;
  sort_by?: 'attendance_date' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface AttendanceListResponse {
  data: StudentAttendance[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Attendance summary
export interface StudentAttendanceSummary {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  excused_days: number;
  attendance_percentage: number;
  average_late_minutes: number;
}

// Class attendance report
export interface ClassAttendanceReport {
  class_id: string;
  total_sessions: number;
  total_student_records: number;
  average_attendance: number;
  students_with_perfect_attendance: number;
}

// Attendance for a specific date (for teacher's daily view)
export interface DailyAttendanceRecord {
  student_id: string;
  student_name: string;
  student_avatar: string | null;
  attendance_status: AttendanceStatus | null;
  check_in_time: string | null;
  check_out_time: string | null;
  late_by_minutes: number;
  teacher_remarks: string | null;
  is_marked: boolean;
}
