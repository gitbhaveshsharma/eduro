/**
 * Review System Schema Types
 * 
 * TypeScript interfaces and types for the coaching branch review system
 * Based on the Supabase review tables schema
 */

// ============================================================
// ENUMS from Database
// ============================================================

export type ReviewUserType = 'STUDENT' | 'TEACHER' | 'COACHING_CENTER' | 'ANONYMOUS';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'FLAGGED' | 'REMOVED';
export type RatingScale = '1' | '2' | '3' | '4' | '5';
export type MediaType = 'IMAGE' | 'VIDEO';
export type ReviewSortBy = 'recent' | 'helpful' | 'highest_rated' | 'lowest_rated' | 'relevant';

// ============================================================
// CORE INTERFACES
// ============================================================

/**
 * Main Review Interface
 */
export interface Review {
  // Identification
  id: string;
  
  // What is being reviewed
  coaching_branch_id: string;
  coaching_center_id: string;
  
  // Who is reviewing
  reviewer_id: string | null; // Null for anonymous reviews
  reviewer_user_type: ReviewUserType;
  
  // Review content
  title: string;
  comment: string | null;
  
  // Ratings (1-5 scale)
  overall_rating: RatingScale;
  teaching_quality: RatingScale | null;
  infrastructure: RatingScale | null;
  staff_support: RatingScale | null;
  value_for_money: RatingScale | null;
  
  // User snapshot (preserved data)
  reviewer_name_snapshot: string | null;
  reviewer_role_snapshot: string | null;
  
  // Review metadata
  status: ReviewStatus;
  is_anonymous: boolean;
  is_verified_reviewer: boolean;
  
  // Engagement metrics
  report_count: number;
  helpful_count: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  reviewed_date: string;
}

/**
 * Review Media/Attachments
 */
export interface ReviewMedia {
  id: string;
  review_id: string;
  media_url: string;
  media_type: MediaType;
  display_order: number;
  created_at: string;
}

/**
 * Review Helpful Vote
 */
export interface ReviewHelpfulVote {
  id: string;
  review_id: string;
  user_id: string;
  created_at: string;
}

/**
 * Coaching Center Response to Review
 */
export interface ReviewResponse {
  id: string;
  review_id: string;
  responder_id: string;
  response_text: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Branch Rating Summary (from materialized view)
 */
export interface BranchRatingSummary {
  coaching_branch_id: string;
  total_reviews: number;
  avg_rating: number;
  rating_5: number;
  rating_4: number;
  rating_3: number;
  rating_2: number;
  rating_1: number;
  teaching_quality_count: number;
  avg_teaching_quality: number | null;
  avg_infrastructure: number | null;
  avg_staff_support: number | null;
  avg_value_for_money: number | null;
  verified_reviews_count: number;
  last_review_date: string | null;
  reviews_last_30_days: number;
}

/**
 * Enhanced Review with Related Data
 */
export interface ReviewWithDetails extends Review {
  reviewer_name: string | null;
  has_media: boolean;
  response_exists: boolean;
  branch_name: string | null;
  center_name: string | null;
  branch_state: string | null;
  branch_district: string | null;
  branch_city: string | null;
  branch_pin_code: string | null;
  media?: ReviewMedia[];
  response?: ReviewResponse;
  user_has_voted?: boolean;
}

/**
 * Search Result from RPC Function
 */
export interface ReviewSearchResult {
  review_id: string;
  title: string;
  comment: string | null;
  overall_rating: RatingScale;
  reviewer_name: string | null;
  is_anonymous: boolean;
  is_verified_reviewer: boolean;
  reviewer_role_snapshot: string | null;
  helpful_count: number;
  has_media: boolean;
  response_exists: boolean;
  created_at: string;
  teaching_quality: RatingScale | null;
  infrastructure: RatingScale | null;
  staff_support: RatingScale | null;
  value_for_money: RatingScale | null;
  branch_name: string | null;
  center_name: string | null;
  branch_state: string | null;
  branch_district: string | null;
  branch_city: string | null;
  branch_pin_code: string | null;
  search_rank: number;
  total_count: number;
}

// ============================================================
// OUTPUT TYPES
// ============================================================
// Note: Input types with Zod validation are now in lib/validations/review.validation.ts
// Note: ReviewSearchFilters is also in lib/validations/review.validation.ts

/**
 * Paginated Review Results
 */
export interface PaginatedReviews {
  reviews: ReviewWithDetails[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

/**
 * Rating Summary Response
 */
export interface RatingSummaryResponse {
  total_reviews: number;
  average_rating: number;
  rating_breakdown: {
    '5': number;
    '4': number;
    '3': number;
    '2': number;
    '1': number;
  };
  category_ratings: {
    teaching_quality: number | null;
    infrastructure: number | null;
    staff_support: number | null;
    value_for_money: number | null;
  };
  verified_reviews: number;
  last_review_date: string | null;
  recent_activity: number;
  cached: boolean;
}

// ============================================================
// SERVICE RESPONSE TYPES
// ============================================================

/**
 * Generic Service Response
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Rate Limit Check Response
 */
export interface RateLimitCheckResponse {
  can_review: boolean;
  reason?: string;
  retry_after?: number; // seconds
}

// ============================================================
// ERROR CODES
// ============================================================

export const REVIEW_ERROR_CODES = {
  // Authentication & Authorization
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  SELF_REVIEW_NOT_ALLOWED: 'SELF_REVIEW_NOT_ALLOWED',
  
  // Validation Errors
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_BRANCH_ID: 'INVALID_BRANCH_ID',
  INVALID_REVIEW_ID: 'INVALID_REVIEW_ID',
  INVALID_RATING: 'INVALID_RATING',
  COMMENT_REQUIRED: 'COMMENT_REQUIRED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  ALREADY_REVIEWED: 'ALREADY_REVIEWED',
  TOO_MANY_REVIEWS: 'TOO_MANY_REVIEWS',
  
  // Not Found
  REVIEW_NOT_FOUND: 'REVIEW_NOT_FOUND',
  BRANCH_NOT_FOUND: 'BRANCH_NOT_FOUND',
  
  // Edit/Delete Constraints
  EDIT_WINDOW_EXPIRED: 'EDIT_WINDOW_EXPIRED',
  DELETE_WINDOW_EXPIRED: 'DELETE_WINDOW_EXPIRED',
  CANNOT_EDIT_REVIEW: 'CANNOT_EDIT_REVIEW',
  
  // Media Errors
  INVALID_MEDIA_URL: 'INVALID_MEDIA_URL',
  MEDIA_UPLOAD_FAILED: 'MEDIA_UPLOAD_FAILED',
  TOO_MANY_MEDIA_FILES: 'TOO_MANY_MEDIA_FILES',
  
  // Database Errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  
  // General
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

// ============================================================
// CONSTANTS
// ============================================================

export const REVIEW_CONSTANTS = {
  // Validation limits
  TITLE_MIN_LENGTH: 5,
  TITLE_MAX_LENGTH: 200,
  COMMENT_MIN_LENGTH: 10,
  COMMENT_MAX_LENGTH: 2000,
  RESPONSE_MIN_LENGTH: 10,
  RESPONSE_MAX_LENGTH: 1000,
  
  // Time windows (in milliseconds)
  EDIT_WINDOW: 24 * 60 * 60 * 1000, // 24 hours
  DELETE_WINDOW: 1 * 60 * 60 * 1000, // 1 hour
  RESPONSE_WINDOW: 180 * 24 * 60 * 60 * 1000, // 180 days
  
  // Rate limiting
  MAX_REVIEWS_PER_HOUR: 3,
  MAX_REVIEWS_PER_DAY: 10,
  MAX_REVIEWS_PER_BRANCH: 1,
  
  // Media limits
  MAX_MEDIA_PER_REVIEW: 5,
  MAX_MEDIA_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'],
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Search defaults
  SEARCH_MIN_QUERY_LENGTH: 2,
  DEFAULT_RADIUS_KM: 10,
  MAX_RADIUS_KM: 500,
  
  // Cache settings
  REVIEW_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  RATING_SUMMARY_CACHE_TTL: 10 * 60 * 1000, // 10 minutes
  SEARCH_CACHE_TTL: 2 * 60 * 1000, // 2 minutes
  
  // Materialized view refresh interval
  MV_REFRESH_INTERVAL: 60 * 60 * 1000, // 1 hour
} as const;
