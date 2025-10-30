/**
 * Type definitions for Branch Students (Enrollment)
 * Based on migration: 016_create_branch_student_system.sql
 */

// Enums
export enum EnrollmentStatus {
  ENROLLED = 'ENROLLED',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  DROPPED = 'DROPPED',
  COMPLETED = 'COMPLETED',
}

export enum PaymentStatus {
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  PENDING = 'PENDING',
  OVERDUE = 'OVERDUE',
}

// Database row type
export interface BranchStudentRow {
  id: string;
  student_id: string;
  branch_id: string;
  class_id: string | null;
  enrollment_date: string;
  expected_completion_date: string | null;
  actual_completion_date: string | null;
  enrollment_status: EnrollmentStatus;
  payment_status: PaymentStatus;
  attendance_percentage: number;
  current_grade: string | null;
  performance_notes: string | null;
  total_fees_due: number;
  total_fees_paid: number;
  last_payment_date: string | null;
  next_payment_due: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  parent_guardian_name: string | null;
  parent_guardian_phone: string | null;
  preferred_batch: string | null;
  special_requirements: string | null;
  student_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Extended type with relations
export interface BranchStudent extends BranchStudentRow {
  student?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    email: string | null;
  };
  branch?: {
    id: string;
    name: string;
    coaching_center_id: string;
  };
  class?: {
    id: string;
    class_name: string;
    subject: string;
    grade_level: string;
  };
}

// DTO for creating enrollment
export interface CreateBranchStudentDTO {
  student_id: string;
  branch_id: string;
  class_id?: string;
  enrollment_date?: string;
  expected_completion_date?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  parent_guardian_name?: string;
  parent_guardian_phone?: string;
  preferred_batch?: string;
  special_requirements?: string;
  student_notes?: string;
}

// DTO for updating enrollment (students can only update specific fields)
export interface UpdateBranchStudentDTO {
  id: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  parent_guardian_name?: string;
  parent_guardian_phone?: string;
  preferred_batch?: string;
  special_requirements?: string;
  student_notes?: string;
}

// DTO for admin/teacher updates
export interface UpdateBranchStudentAdminDTO extends UpdateBranchStudentDTO {
  enrollment_status?: EnrollmentStatus;
  payment_status?: PaymentStatus;
  attendance_percentage?: number;
  current_grade?: string;
  performance_notes?: string;
  total_fees_due?: number;
  total_fees_paid?: number;
  last_payment_date?: string;
  next_payment_due?: string;
  expected_completion_date?: string;
  actual_completion_date?: string;
}

// Filter types
export interface BranchStudentFilters {
  student_id?: string;
  branch_id?: string;
  class_id?: string;
  enrollment_status?: EnrollmentStatus;
  payment_status?: PaymentStatus;
  search?: string;
}

// List params
export interface BranchStudentListParams extends BranchStudentFilters {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'enrollment_date' | 'attendance_percentage';
  sort_order?: 'asc' | 'desc';
}

export interface BranchStudentListResponse {
  data: BranchStudent[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Enrollment summary
export interface StudentEnrollmentSummary {
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  total_fees_due: number;
  total_fees_paid: number;
  average_attendance: number;
}
