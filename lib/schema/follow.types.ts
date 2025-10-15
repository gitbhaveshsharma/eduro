/**
 * Follow System Schema Types
 * 
 * TypeScript interfaces and types for follower/following system
 * Based on the Supabase follow system schema (008_create_follow_system.sql)
 */

// Enums from database
export type FollowStatus = 'active' | 'blocked' | 'muted';
export type FollowRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';
export type FollowCategory = 'close_friend' | 'colleague' | 'mentor' | 'student' | 'classmate' | 'teacher' | null;

// Core follow relationship interface
export interface FollowRelationship {
  id: string; // UUID
  
  // Relationship participants
  follower_id: string; // User who follows
  following_id: string; // User being followed
  
  // Follow metadata
  follow_status: FollowStatus;
  notification_enabled: boolean;
  
  // Follow categorization
  follow_category: FollowCategory;
  notes: string | null; // Personal notes about this connection
  
  // Mutual follow detection
  is_mutual: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Follow request interface
export interface FollowRequest {
  id: string; // UUID
  
  // Request participants
  requester_id: string; // User who sent the request
  target_id: string; // User who received the request
  
  // Request metadata
  status: FollowRequestStatus;
  message: string | null; // Optional message with request
  
  // Timestamps
  created_at: string;
  updated_at: string;
  responded_at: string | null;
}

// Blocked user interface
export interface BlockedUser {
  id: string; // UUID
  
  // Blocking relationship
  blocker_id: string; // User who blocked
  blocked_id: string; // User who was blocked
  
  // Block metadata
  reason: string | null; // Optional reason for blocking
  
  // Timestamps
  created_at: string;
}

// Enhanced interfaces with profile data for UI display
export interface FollowRelationshipWithProfile extends FollowRelationship {
  follower_profile?: FollowerProfile;
  following_profile?: FollowerProfile;
}

export interface FollowRequestWithProfile extends FollowRequest {
  requester_profile?: FollowerProfile;
  target_profile?: FollowerProfile;
}

export interface BlockedUserWithProfile extends BlockedUser {
  blocker_profile?: FollowerProfile;
  blocked_profile?: FollowerProfile;
}

// Minimal profile interface for follow system operations
export interface FollowerProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: 'SA' | 'A' | 'S' | 'T' | 'C';
  is_verified: boolean;
  is_online: boolean;
  follower_count: number;
  following_count: number;
  created_at: string;
}

// Follow operation request interfaces
export interface FollowUserRequest {
  following_id: string;
  follow_category?: FollowCategory;
  notification_enabled?: boolean;
  notes?: string;
}

export interface UnfollowUserRequest {
  following_id: string;
}

export interface UpdateFollowRequest {
  following_id: string;
  follow_status?: FollowStatus;
  notification_enabled?: boolean;
  follow_category?: FollowCategory;
  notes?: string;
}

export interface SendFollowRequestData {
  target_id: string;
  message?: string;
}

export interface RespondToFollowRequestData {
  request_id: string;
  status: 'accepted' | 'rejected';
}

export interface BlockUserRequest {
  blocked_id: string;
  reason?: string;
}

export interface UnblockUserRequest {
  blocked_id: string;
}

// Follow statistics interface
export interface FollowStats {
  total_follows: number;
  mutual_follows: number;
  active_follows: number;
  pending_requests: number;
  blocked_users: number;
  followers: number;
  following: number;
}

// Filter interfaces for searching/listing
export interface FollowFilters {
  follow_status?: FollowStatus | FollowStatus[];
  follow_category?: FollowCategory | FollowCategory[];
  is_mutual?: boolean;
  notification_enabled?: boolean;
  search_query?: string; // Search by username, full_name
}

export interface FollowRequestFilters {
  status?: FollowRequestStatus | FollowRequestStatus[];
  search_query?: string;
}

export interface BlockedUserFilters {
  search_query?: string;
}

// Sort options
export type FollowSortField = 
  | 'created_at' 
  | 'updated_at' 
  | 'username'
  | 'full_name'
  | 'follower_count'
  | 'following_count';

export type FollowRequestSortField = 
  | 'created_at' 
  | 'updated_at'
  | 'responded_at'
  | 'username'
  | 'full_name';

export type SortDirection = 'asc' | 'desc';

export interface FollowSort {
  field: FollowSortField;
  direction: SortDirection;
}

export interface FollowRequestSort {
  field: FollowRequestSortField;
  direction: SortDirection;
}

// Search result interfaces
export interface FollowSearchResult {
  follows: FollowRelationshipWithProfile[];
  total_count: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface FollowRequestSearchResult {
  requests: FollowRequestWithProfile[];
  total_count: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface BlockedUserSearchResult {
  blocked_users: BlockedUserWithProfile[];
  total_count: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// Follow suggestion interface
export interface FollowSuggestion {
  user: FollowerProfile;
  reason: 'mutual_connections' | 'same_role' | 'same_interests' | 'popular' | 'recent_activity';
  connection_count?: number; // For mutual connections
  similarity_score?: number; // For interest-based suggestions
}

export interface FollowSuggestionsResult {
  suggestions: FollowSuggestion[];
  total_count: number;
  refresh_available_at: string; // When new suggestions will be available
}

// Follow activity interface
export interface FollowActivity {
  id: string;
  type: 'follow' | 'unfollow' | 'follow_request' | 'request_accepted' | 'mutual_follow';
  user: FollowerProfile;
  target_user?: FollowerProfile;
  created_at: string;
}

export interface FollowActivityResult {
  activities: FollowActivity[];
  total_count: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// Operation result interfaces
export interface FollowOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Follow status check results
export interface FollowStatusCheck {
  is_following: boolean;
  is_followed_by: boolean;
  is_mutual: boolean;
  is_blocked: boolean;
  is_blocking: boolean;
  has_pending_request: boolean;
  has_received_request: boolean;
  follow_status?: FollowStatus;
  relationship?: FollowRelationship;
}

// Bulk operation interfaces
export interface BulkFollowRequest {
  user_ids: string[];
  follow_category?: FollowCategory;
  notification_enabled?: boolean;
}

export interface BulkUnfollowRequest {
  user_ids: string[];
}

export interface BulkFollowResult {
  successful: string[];
  failed: Array<{
    user_id: string;
    error: string;
  }>;
  total_processed: number;
}

// Follow network analysis
export interface FollowNetworkAnalysis {
  mutual_connections: FollowerProfile[];
  suggested_connections: FollowSuggestion[];
  common_followers: FollowerProfile[];
  common_following: FollowerProfile[];
  network_size: number;
  clustering_coefficient: number; // How interconnected the user's network is
}

// Constants for type safety
export const FOLLOW_STATUS = {
  ACTIVE: 'active' as const,
  BLOCKED: 'blocked' as const,
  MUTED: 'muted' as const,
} as const;

export const FOLLOW_REQUEST_STATUS = {
  PENDING: 'pending' as const,
  ACCEPTED: 'accepted' as const,
  REJECTED: 'rejected' as const,
  CANCELLED: 'cancelled' as const,
} as const;

export const FOLLOW_CATEGORY = {
  CLOSE_FRIEND: 'close_friend' as const,
  COLLEAGUE: 'colleague' as const,
  MENTOR: 'mentor' as const,
  STUDENT: 'student' as const,
  CLASSMATE: 'classmate' as const,
  TEACHER: 'teacher' as const,
} as const;

// Default values
export const DEFAULT_FOLLOW_VALUES = {
  follow_status: FOLLOW_STATUS.ACTIVE,
  notification_enabled: true,
  follow_category: null,
  is_mutual: false,
} as const;

export const DEFAULT_FOLLOW_REQUEST_VALUES = {
  status: FOLLOW_REQUEST_STATUS.PENDING,
  message: null,
} as const;

// Validation constraints
export const FOLLOW_CONSTRAINTS = {
  NOTES_MAX_LENGTH: 500,
  MESSAGE_MAX_LENGTH: 500,
  REASON_MAX_LENGTH: 200,
  
  // Pagination limits
  MAX_FOLLOWERS_PER_PAGE: 100,
  MAX_FOLLOWING_PER_PAGE: 100,
  MAX_REQUESTS_PER_PAGE: 50,
  MAX_BLOCKED_PER_PAGE: 50,
  
  // Rate limiting
  MAX_FOLLOW_REQUESTS_PER_HOUR: 20,
  MAX_BULK_OPERATIONS: 50,
  
  // Cache TTL
  FOLLOW_STATUS_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  FOLLOW_LIST_CACHE_TTL: 2 * 60 * 1000, // 2 minutes
  SUGGESTIONS_CACHE_TTL: 30 * 60 * 1000, // 30 minutes
} as const;

// Error codes specific to follow system
export const FOLLOW_ERROR_CODES = {
  // Authentication
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation
  INVALID_USER_ID: 'INVALID_USER_ID',
  CANNOT_FOLLOW_SELF: 'CANNOT_FOLLOW_SELF',
  ALREADY_FOLLOWING: 'ALREADY_FOLLOWING',
  NOT_FOLLOWING: 'NOT_FOLLOWING',
  USER_BLOCKED: 'USER_BLOCKED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  
  // Follow requests
  REQUEST_ALREADY_EXISTS: 'REQUEST_ALREADY_EXISTS',
  REQUEST_NOT_FOUND: 'REQUEST_NOT_FOUND',
  INVALID_REQUEST_STATUS: 'INVALID_REQUEST_STATUS',
  CANNOT_REQUEST_SELF: 'CANNOT_REQUEST_SELF',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  BULK_LIMIT_EXCEEDED: 'BULK_LIMIT_EXCEEDED',
  
  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  
  // General
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

// Event types for follow system
export const FOLLOW_EVENTS = {
  USER_FOLLOWED: 'follow.user_followed',
  USER_UNFOLLOWED: 'follow.user_unfollowed',
  MUTUAL_FOLLOW_CREATED: 'follow.mutual_follow_created',
  MUTUAL_FOLLOW_BROKEN: 'follow.mutual_follow_broken',
  FOLLOW_REQUEST_SENT: 'follow.request_sent',
  FOLLOW_REQUEST_ACCEPTED: 'follow.request_accepted',
  FOLLOW_REQUEST_REJECTED: 'follow.request_rejected',
  USER_BLOCKED: 'follow.user_blocked',
  USER_UNBLOCKED: 'follow.user_unblocked',
  FOLLOW_STATUS_CHANGED: 'follow.status_changed',
} as const;