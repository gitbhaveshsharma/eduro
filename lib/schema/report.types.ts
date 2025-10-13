// Report Types and Interfaces
export type ReportTargetType = 
  | 'POST' 
  | 'COMMENT' 
  | 'LMS_COURSE' 
  | 'LMS_MODULE' 
  | 'USER_PROFILE' 
  | 'COMMUNITY_POST';

export type ReportCategory = 
  | 'SPAM' 
  | 'HARASSMENT' 
  | 'INAPPROPRIATE_CONTENT' 
  | 'MISINFORMATION' 
  | 'COPYRIGHT' 
  | 'OTHER';

export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';

export interface Report {
  id: string;
  user_id: string;
  target_type: ReportTargetType;
  target_id: string;
  category: ReportCategory;
  description: string;
  metadata: Record<string, any>; // JSONB for flexible data storage
  status: ReportStatus;
  created_at: string;
  updated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string;
}

export interface ReportCreate {
  target_type: ReportTargetType;
  target_id: string;
  category: ReportCategory;
  description: string;
  metadata?: Record<string, any>;
}

export interface ReportFormData {
  category: ReportCategory;
  description: string;
}

export interface ReportOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}