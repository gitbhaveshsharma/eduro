/**
 * Post System Schema Types
 * 
 * TypeScript interfaces and types for the comprehensive post system
 * Based on the Supabase post system migration schema
 */

// Database enums from migration
export type PostType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'POLL' | 'ARTICLE' | 'QUESTION' | 'ANNOUNCEMENT' | 'EVENT' | 'DISCUSSION';
export type PostPrivacy = 'PUBLIC' | 'FOLLOWERS' | 'FRIENDS' | 'PRIVATE' | 'RESTRICTED';
export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED' | 'FLAGGED' | 'REMOVED';
export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'LINK';
export type ReactionTargetType = 'POST' | 'COMMENT' | 'REPLY';

// Geographic coordinates interface for PostGIS support
export interface PostCoordinates {
  latitude: number;
  longitude: number;
}

// Core post interface matching the database table
export interface Post {
  // Primary identification
  id: string; // UUID
  author_id: string; // UUID reference to auth.users
  
  // Post content
  title: string | null;
  content: string; // Required
  content_preview: string | null;
  
  // Post metadata
  post_type: PostType;
  privacy: PostPrivacy;
  status: PostStatus;
  
  // Categories and tagging
  category: string | null;
  tags: string[] | null;
  mentions: string[] | null; // Array of mentioned user IDs
  
  // Media and attachments
  media_urls: string[] | null;
  media_types: MediaType[] | null;
  external_link: string | null;
  external_link_preview: Record<string, any> | null; // JSON
  
  // Location data
  location: string | null; // Text location
  coordinates: PostCoordinates | null; // Geographic coordinates
  
  // Engagement metrics (cached for performance)
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  engagement_score: number;
  
  // Content moderation
  is_pinned: boolean;
  is_featured: boolean;
  is_sensitive: boolean;
  content_warning: string | null;
  
  // SEO and searchability
  slug: string | null;
  
  // Scheduling and expiry
  scheduled_at: string | null; // ISO timestamp
  expires_at: string | null; // ISO timestamp
  
  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  published_at: string; // ISO timestamp
  last_activity_at: string; // ISO timestamp
}

// Public post interface (for displaying to other users)
export interface PublicPost {
  id: string;
  author_id: string;
  author_username: string | null;
  author_full_name: string | null;
  author_avatar_url: string | null;
  title: string | null;
  content: string;
  content_preview: string | null;
  post_type: PostType;
  privacy: PostPrivacy;
  category: string | null;
  tags: string[] | null;
  media_urls: string[] | null;
  media_types: MediaType[] | null;
  external_link: string | null;
  external_link_preview: Record<string, any> | null;
  location: string | null;
  coordinates: PostCoordinates | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  engagement_score: number;
  is_pinned: boolean;
  is_featured: boolean;
  is_sensitive: boolean;
  content_warning: string | null;
  user_has_liked: boolean;
  user_has_saved: boolean;
  created_at: string;
  published_at: string;
  last_activity_at: string;
}

// Comment interface with threading support
export interface Comment {
  id: string; // UUID
  post_id: string; // UUID reference to posts
  author_id: string; // UUID reference to auth.users
  parent_comment_id: string | null; // UUID reference for nested replies
  
  // Comment content
  content: string; // Required
  
  // Threading and hierarchy
  thread_level: number; // 0 = top-level, 1+ = reply depth
  thread_path: string | null; // Path like "1.2.3" for nested structure
  
  // Engagement metrics
  like_count: number;
  reply_count: number;
  
  // Status and moderation
  status: PostStatus;
  is_pinned: boolean;
  is_highlighted: boolean; // Author highlighted comments
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Public comment interface (with author info)
export interface PublicComment {
  id: string;
  post_id: string;
  author_id: string;
  author_username: string | null;
  author_full_name: string | null;
  author_avatar_url: string | null;
  author_is_verified?: boolean;
  author_reputation_score?: number;
  parent_comment_id: string | null;
  content: string;
  thread_level: number;
  thread_path: string | null;
  like_count: number;
  reply_count: number;
  user_has_liked: boolean;
  status: PostStatus;
  is_pinned: boolean;
  is_highlighted: boolean;
  created_at: string;
  updated_at: string;
}

// Post reaction interface
export interface PostReaction {
  id: string; // UUID
  target_type: ReactionTargetType;
  target_id: string; // Can be post_id or comment_id
  user_id: string; // UUID reference to auth.users
  reaction_id: number; // Reference to reactions table
  created_at: string;
  updated_at: string;
}

// Saved post interface
export interface SavedPost {
  id: string; // UUID
  user_id: string; // UUID reference to auth.users
  post_id: string; // UUID reference to posts
  collection_name: string; // Default: 'default'
  notes: string | null; // Personal notes about saved post
  created_at: string;
}

// Post view interface for analytics
export interface PostView {
  id: string; // UUID
  post_id: string; // UUID reference to posts
  user_id: string | null; // UUID reference (nullable for anonymous views)
  view_duration: number | null; // Time spent viewing (seconds)
  user_agent: string | null; // Browser/app info
  ip_address: string | null; // IP for analytics
  referrer: string | null; // Where they came from
  view_date: string; // Date for uniqueness constraint
  created_at: string;
}

// Post share interface
export interface PostShare {
  id: string; // UUID
  original_post_id: string; // UUID reference to posts
  user_id: string; // UUID reference to auth.users
  share_type: string; // 'repost', 'quote', 'external'
  quote_content: string | null; // Additional content when quote-sharing
  platform: string | null; // External platform if shared outside
  created_at: string;
}

// Post creation interface
export interface PostCreate {
  author_id: string;
  title?: string | null;
  content: string;
  post_type?: PostType;
  privacy?: PostPrivacy;
  category?: string | null;
  tags?: string[] | null;
  mentions?: string[] | null;
  media_urls?: string[] | null;
  media_types?: MediaType[] | null;
  external_link?: string | null;
  location?: string | null;
  coordinates?: PostCoordinates | null;
  is_sensitive?: boolean;
  content_warning?: string | null;
  scheduled_at?: string | null;
  expires_at?: string | null;
}

// Post update interface (for partial updates)
export interface PostUpdate {
  title?: string | null;
  content?: string;
  post_type?: PostType;
  privacy?: PostPrivacy;
  category?: string | null;
  tags?: string[] | null;
  mentions?: string[] | null;
  media_urls?: string[] | null;
  media_types?: MediaType[] | null;
  external_link?: string | null;
  location?: string | null;
  coordinates?: PostCoordinates | null;
  is_pinned?: boolean;
  is_featured?: boolean;
  is_sensitive?: boolean;
  content_warning?: string | null;
  scheduled_at?: string | null;
  expires_at?: string | null;
  status?: PostStatus;
}

// Comment creation interface
export interface CommentCreate {
  post_id: string;
  author_id: string;
  parent_comment_id?: string | null;
  content: string;
}

// Comment update interface
export interface CommentUpdate {
  content?: string;
  status?: PostStatus;
  is_pinned?: boolean;
  is_highlighted?: boolean;
}

// Post filter options for searching/listing
export interface PostFilters {
  author_id?: string | string[];
  post_type?: PostType | PostType[];
  privacy?: PostPrivacy | PostPrivacy[];
  status?: PostStatus | PostStatus[];
  category?: string | string[];
  tags?: string[];
  is_pinned?: boolean;
  is_featured?: boolean;
  is_sensitive?: boolean;
  has_media?: boolean;
  has_location?: boolean;
  location_radius?: number; // Radius in kilometers for geographic search
  center_coordinates?: PostCoordinates; // Center point for geographic search
  created_after?: string; // ISO timestamp
  created_before?: string; // ISO timestamp
  min_engagement_score?: number;
  search_query?: string; // For full-text search
}

// Post sort options
export type PostSortField = 
  | 'created_at' 
  | 'updated_at' 
  | 'published_at'
  | 'last_activity_at'
  | 'engagement_score'
  | 'like_count'
  | 'comment_count'
  | 'share_count'
  | 'view_count';

export type SortDirection = 'asc' | 'desc';

export interface PostSort {
  field: PostSortField;
  direction: SortDirection;
}

// Feed sort options with predefined algorithms
export type FeedSortType = 'recent' | 'popular' | 'trending' | 'nearby';

// Post search result interface
export interface PostSearchResult {
  posts: PublicPost[];
  total_count: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// Comment search result interface
export interface CommentSearchResult {
  comments: PublicComment[];
  total_count: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// Post analytics interface
export interface PostAnalytics {
  post_id: string;
  total_views: number;
  unique_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  engagement_rate: number;
  view_duration_avg: number;
  top_referrers: Array<{ referrer: string; count: number }>;
  geographic_distribution: Array<{ location: string; count: number }>;
  daily_views: Array<{ date: string; count: number }>;
}

// Post statistics interface
export interface PostStats {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  posts_today: number;
  posts_this_week: number;
  posts_this_month: number;
  total_engagement: number;
  average_engagement_score: number;
  top_categories: Array<{ category: string; count: number }>;
  post_type_distribution: Array<{ type: PostType; count: number }>;
}

// Post validation errors
export interface PostValidationError {
  field: keyof Post | keyof Comment;
  message: string;
  code: string;
}

// Post operation results
export interface PostOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: PostValidationError[];
}

// Post permissions interface
export interface PostPermissions {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_comment: boolean;
  can_react: boolean;
  can_share: boolean;
  can_moderate: boolean;
}

// Real-time subscription event types
export type PostEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface PostRealtimeEvent {
  event_type: PostEventType;
  table: 'posts' | 'comments' | 'post_reactions' | 'post_views' | 'post_shares';
  new_record?: any;
  old_record?: any;
}

// External link preview interface
export interface LinkPreview {
  title: string | null;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
  url: string;
  favicon_url: string | null;
}

// Media upload progress interface
export interface MediaUploadProgress {
  file_name: string;
  progress: number; // 0-100
  uploaded_bytes: number;
  total_bytes: number;
  url?: string; // Available when upload completes
  error?: string;
}

// Geolocation interface for posts
export interface PostLocation {
  name: string; // Human-readable location name
  coordinates: PostCoordinates;
  address?: string;
  city?: string;
  country?: string;
  place_id?: string; // For integration with mapping services
}

// Poll-specific interfaces (for POLL post type)
export interface PollOption {
  id: string;
  text: string;
  vote_count: number;
  percentage: number;
}

export interface PollData {
  question: string;
  options: PollOption[];
  total_votes: number;
  ends_at: string | null;
  allows_multiple: boolean;
  user_votes: string[]; // Option IDs the current user voted for
}

// Event-specific interfaces (for EVENT post type)
export interface EventData {
  title: string;
  description: string;
  start_time: string; // ISO timestamp
  end_time: string | null; // ISO timestamp
  location: PostLocation | null;
  max_attendees: number | null;
  current_attendees: number;
  is_virtual: boolean;
  meeting_url: string | null;
  user_is_attending: boolean;
}

// Post type constants for type safety
export const POST_TYPES = {
  TEXT: 'TEXT' as const,
  IMAGE: 'IMAGE' as const,
  VIDEO: 'VIDEO' as const,
  POLL: 'POLL' as const,
  ARTICLE: 'ARTICLE' as const,
  QUESTION: 'QUESTION' as const,
  ANNOUNCEMENT: 'ANNOUNCEMENT' as const,
  EVENT: 'EVENT' as const,
  DISCUSSION: 'DISCUSSION' as const,
} as const;

export const POST_PRIVACY_LEVELS = {
  PUBLIC: 'PUBLIC' as const,
  FOLLOWERS: 'FOLLOWERS' as const,
  FRIENDS: 'FRIENDS' as const,
  PRIVATE: 'PRIVATE' as const,
  RESTRICTED: 'RESTRICTED' as const,
} as const;

export const POST_STATUS_TYPES = {
  DRAFT: 'DRAFT' as const,
  PUBLISHED: 'PUBLISHED' as const,
  ARCHIVED: 'ARCHIVED' as const,
  DELETED: 'DELETED' as const,
  FLAGGED: 'FLAGGED' as const,
  REMOVED: 'REMOVED' as const,
} as const;

export const MEDIA_TYPES = {
  IMAGE: 'IMAGE' as const,
  VIDEO: 'VIDEO' as const,
  AUDIO: 'AUDIO' as const,
  DOCUMENT: 'DOCUMENT' as const,
  LINK: 'LINK' as const,
} as const;

// Default values
export const DEFAULT_POST_VALUES = {
  post_type: POST_TYPES.TEXT,
  privacy: POST_PRIVACY_LEVELS.PUBLIC,
  status: POST_STATUS_TYPES.PUBLISHED,
  like_count: 0,
  comment_count: 0,
  share_count: 0,
  view_count: 0,
  engagement_score: 0,
  is_pinned: false,
  is_featured: false,
  is_sensitive: false,
  thread_level: 0,
} as const;

// Constants for validation and limits
export const POST_CONSTANTS = {
  // Content limits
  MAX_CONTENT_LENGTH: 10000,
  MAX_TITLE_LENGTH: 200,
  MAX_PREVIEW_LENGTH: 300,
  MAX_TAGS: 10,
  MAX_TAG_LENGTH: 50,
  MAX_MENTIONS: 20,
  
  // Media limits
  MAX_MEDIA_FILES: 10,
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_AUDIO_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_DOCUMENT_SIZE: 25 * 1024 * 1024, // 25MB
  
  // Threading limits
  MAX_THREAD_DEPTH: 10,
  
  // Geographic limits
  MAX_LOCATION_RADIUS: 1000, // kilometers
  
  // Pagination limits
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Cache TTL (in seconds)
  CACHE_TTL: {
    POSTS: 300, // 5 minutes
    COMMENTS: 180, // 3 minutes
    REACTIONS: 60, // 1 minute
    ANALYTICS: 1800, // 30 minutes
  },
} as const;

// Error codes for post operations
export const POST_ERROR_CODES = {
  // General errors
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
  POST_NOT_FOUND: 'POST_NOT_FOUND',
  COMMENT_NOT_FOUND: 'COMMENT_NOT_FOUND',
  
  // Validation errors
  INVALID_CONTENT: 'INVALID_CONTENT',
  CONTENT_TOO_LONG: 'CONTENT_TOO_LONG',
  TITLE_TOO_LONG: 'TITLE_TOO_LONG',
  INVALID_POST_TYPE: 'INVALID_POST_TYPE',
  INVALID_PRIVACY_LEVEL: 'INVALID_PRIVACY_LEVEL',
  TOO_MANY_TAGS: 'TOO_MANY_TAGS',
  TOO_MANY_MENTIONS: 'TOO_MANY_MENTIONS',
  TOO_MANY_MEDIA_FILES: 'TOO_MANY_MEDIA_FILES',
  
  // Media errors
  INVALID_MEDIA_TYPE: 'INVALID_MEDIA_TYPE',
  MEDIA_TOO_LARGE: 'MEDIA_TOO_LARGE',
  MEDIA_UPLOAD_FAILED: 'MEDIA_UPLOAD_FAILED',
  
  // Threading errors
  THREAD_TOO_DEEP: 'THREAD_TOO_DEEP',
  INVALID_PARENT_COMMENT: 'INVALID_PARENT_COMMENT',
  
  // Geographic errors
  INVALID_COORDINATES: 'INVALID_COORDINATES',
  LOCATION_RADIUS_TOO_LARGE: 'LOCATION_RADIUS_TOO_LARGE',
  
  // Permission errors
  CANNOT_EDIT_POST: 'CANNOT_EDIT_POST',
  CANNOT_DELETE_POST: 'CANNOT_DELETE_POST',
  CANNOT_COMMENT: 'CANNOT_COMMENT',
  CANNOT_REACT: 'CANNOT_REACT',
  
  // Rate limiting
  TOO_MANY_POSTS: 'TOO_MANY_POSTS',
  TOO_MANY_COMMENTS: 'TOO_MANY_COMMENTS',
  TOO_MANY_REACTIONS: 'TOO_MANY_REACTIONS',
} as const;