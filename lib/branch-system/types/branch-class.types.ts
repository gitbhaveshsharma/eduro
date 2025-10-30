/**
 * Type definitions for Branch Classes
 * Based on migration: 016_create_branch_student_system.sql
 */

// Database types - Define manually based on schema
export interface BranchClassRow {
  id: string;
  branch_id: string;
  class_name: string;
  subject: string;
  description: string | null;
  grade_level: string;
  batch_name: string | null;
  start_date: string | null;
  end_date: string | null;
  class_days: string[] | null;
  start_time: string | null;
  end_time: string | null;
  max_students: number;
  current_enrollment: number;
  fees_amount: number | null;
  fees_frequency: string;
  teacher_id: string | null;
  status: ClassStatus;
  is_visible: boolean;
  prerequisites: string[] | null;
  materials_required: string[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Enums
export enum ClassStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FULL = 'FULL',
  COMPLETED = 'COMPLETED',
}

export enum FeesFrequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

// Extended types for application use
export interface BranchClass extends BranchClassRow {
  // Relations populated
  branch?: {
    id: string;
    name: string;
    coaching_center_id: string;
  };
  teacher?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// DTO types for API requests/responses
export interface CreateBranchClassDTO {
  branch_id: string;
  class_name: string;
  subject: string;
  description?: string;
  grade_level: string;
  batch_name?: string;
  start_date?: string;
  end_date?: string;
  class_days?: string[];
  start_time?: string;
  end_time?: string;
  max_students?: number;
  fees_amount?: number;
  fees_frequency?: FeesFrequency;
  teacher_id?: string;
  status?: ClassStatus;
  is_visible?: boolean;
  prerequisites?: string[];
  materials_required?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateBranchClassDTO extends Partial<CreateBranchClassDTO> {
  id: string;
}

// Query filter types
export interface BranchClassFilters {
  branch_id?: string;
  teacher_id?: string;
  status?: ClassStatus;
  subject?: string;
  grade_level?: string;
  is_visible?: boolean;
  search?: string; // For searching by name or description
}

// Pagination types
export interface BranchClassListParams extends BranchClassFilters {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'class_name' | 'start_date' | 'current_enrollment';
  sort_order?: 'asc' | 'desc';
}

export interface BranchClassListResponse {
  data: BranchClass[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Statistics type
export interface BranchClassStats {
  total_classes: number;
  active_classes: number;
  total_students_enrolled: number;
  total_capacity: number;
  average_utilization: number;
}
