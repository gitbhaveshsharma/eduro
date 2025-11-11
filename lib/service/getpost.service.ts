/**
 * Get Posts Service
 * 
 * Dedicated service for the comprehensive get_posts RPC function
 * Handles feed retrieval with advanced filtering, sorting, and personalization
 * Based on the enterprise-grade get_posts function from migration 009
 */

import { createClient } from '../supabase/client';

// Initialize Supabase client
const supabase = createClient();
import type {
  PublicPost,
  PostType,
  PostPrivacy,
  PostCoordinates,
  PostOperationResult
} from '../schema/post.types';

// Feed algorithm types from the SQL function
export type FeedAlgorithmType = 
  | 'smart'         // Balanced algorithm (default)
  | 'following'     // Posts from followed users
  | 'trending'      // High engagement posts
  | 'recent'        // Chronological order
  | 'popular'       // By engagement score
  | 'personalized'; // User interest-based

// Enhanced post interface with ranking scores from the RPC function
export interface EnhancedPost extends PublicPost {
  // Author information
  author_reputation_score?: number;
  author_is_verified?: boolean;
  
  // User interaction states
  user_has_shared?: boolean;
  user_has_viewed?: boolean;
  user_reaction_id?: number | null;
  is_reposted?: boolean;
  reposts_count?: number;
  
  // Algorithm scoring (from SQL function)
  relevance_score?: number;
  viral_velocity?: number;
  freshness_score?: number;
  author_affinity_score?: number;
  final_rank_score?: number;
}

// Get posts parameters interface matching the SQL function
export interface GetPostsParams {
  // Pagination
  limit?: number;          // Default 20, max 100
  offset?: number;         // Default 0
  cursor?: string;         // ISO timestamp for cursor-based pagination
  
  // Feed algorithm selection
  feed_type?: FeedAlgorithmType;
  
  // Filters
  post_types?: PostType[];
  category?: string;
  tags?: string[];
  author_id?: string;
  privacy?: PostPrivacy;
  
  // Search and discovery
  search_query?: string;
  location_radius_km?: number;
  user_coordinates?: PostCoordinates;
  
  // Content preferences
  exclude_seen?: boolean;
  include_sensitive?: boolean;
  min_engagement_score?: number;
  
  // Time filters
  posted_after?: string;   // ISO timestamp
  posted_before?: string;  // ISO timestamp
  time_window_hours?: number;
}

// Result interface matching the SQL function return
export interface GetPostsResult {
  posts: EnhancedPost[];
  total_count?: number;
  has_more: boolean;
  next_cursor?: string;
  algorithm_used: FeedAlgorithmType;
  execution_time_ms?: number;
}

// Feed analytics interface
export interface FeedAnalytics {
  total_posts_available: number;
  total_posts_viewed: number;
  total_engagement_actions: number;
  avg_engagement_score: number;
  top_categories: string[];
  engagement_rate: number;
}

// Error codes specific to feed operations
export const FEED_ERROR_CODES = {
  INVALID_FEED_TYPE: 'INVALID_FEED_TYPE',
  INVALID_PAGINATION: 'INVALID_PAGINATION',
  INVALID_TIME_WINDOW: 'INVALID_TIME_WINDOW',
  INVALID_LOCATION_RADIUS: 'INVALID_LOCATION_RADIUS',
  SEARCH_QUERY_TOO_SHORT: 'SEARCH_QUERY_TOO_SHORT',
  TOO_MANY_FILTERS: 'TOO_MANY_FILTERS',
} as const;

export class GetPostService {
  
  /**
   * Get a single post by ID
   */
  static async getPostById(postId: string): Promise<PostOperationResult<EnhancedPost | null>> {
    try {
      // Use the existing getPosts function with specific filters
      const result = await this.getPosts({
        limit: 1,
        author_id: undefined, // Don't filter by author
        post_ids: [postId], // This parameter might need to be added to the function
        feed_type: 'smart'
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // If the above doesn't work with post_ids, fallback to direct query
      if (!result.data?.posts.length) {
        // Fallback: Direct database query for the specific post
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:author_id (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('id', postId)
          .eq('status', 'PUBLISHED')
          .single();

        if (error) {
          return { success: false, error: error.message };
        }

        if (!data) {
          return { success: true, data: null };
        }

        // Convert to EnhancedPost format
        const enhancedPost: EnhancedPost = {
          ...data,
          author_username: data.profiles?.username || null,
          author_full_name: data.profiles?.full_name || null,
          author_avatar_url: data.profiles?.avatar_url || null,
          user_has_liked: false, // Would need to check reactions
          user_has_saved: false, // Would need to check saved_posts
          author_is_verified: false,
          user_has_shared: false,
          user_has_viewed: false,
          user_reaction_id: null,
          relevance_score: 0,
          viral_velocity: 0,
          freshness_score: 0,
          author_affinity_score: 0,
          final_rank_score: 0
        };

        // Clean up the profiles property
        delete (enhancedPost as any).profiles;

        return { success: true, data: enhancedPost };
      }

      return { success: true, data: result.data.posts[0] || null };
    } catch (error) {
      console.error('Error getting post by ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get post'
      };
    }
  }
  
  /**
   * Get posts using the comprehensive get_posts RPC function
   */
  static async getPosts(params: GetPostsParams = {}): Promise<PostOperationResult<GetPostsResult>> {
    try {
      const startTime = Date.now();
      
      // Validate parameters
      const validationResult = this.validateParams(params);
      if (!validationResult.success) {
        return validationResult as PostOperationResult<GetPostsResult>;
      }

      // Set defaults
      const {
        limit = 20,
        offset = 0,
        cursor,
        feed_type = 'smart',
        post_types,
        category,
        tags,
        author_id,
        privacy = 'PUBLIC',
        search_query,
        location_radius_km,
        user_coordinates,
        exclude_seen = false,
        include_sensitive = false,
        min_engagement_score,
        posted_after,
        posted_before,
        time_window_hours
      } = params;

      // Get current user context
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;

      // Call the get_posts RPC function
      const { data, error } = await supabase.rpc('get_posts', {
        p_user_id: userId,
        p_limit: limit,
        p_offset: offset,
        p_cursor: cursor ? new Date(cursor).toISOString() : null,
        p_feed_type: feed_type,
        p_post_types: post_types || null,
        p_category: category || null,
        p_tags: tags || null,
        p_author_id: author_id || null,
        p_privacy: privacy,
        p_search_query: search_query || null,
        p_location_radius_km: location_radius_km || null,
        p_user_coordinates: user_coordinates ? `POINT(${user_coordinates.longitude} ${user_coordinates.latitude})` : null,
        p_exclude_seen: exclude_seen,
        p_include_sensitive: include_sensitive,
        p_min_engagement_score: min_engagement_score || null,
        p_posted_after: posted_after ? new Date(posted_after).toISOString() : null,
        p_posted_before: posted_before ? new Date(posted_before).toISOString() : null,
        p_time_window_hours: time_window_hours || null
      });

      if (error) {
        console.error('Error calling get_posts RPC:', error);
        return {
          success: false,
          error: `Failed to fetch posts: ${error.message}`
        };
      }

      const posts: EnhancedPost[] = (data || []).map(this.transformPostData);
      
      const result: GetPostsResult = {
        posts,
        has_more: posts.length === limit, // Simple check, could be improved
        next_cursor: posts.length > 0 ? posts[posts.length - 1].created_at : undefined,
        algorithm_used: feed_type,
        execution_time_ms: Date.now() - startTime
      };
      console.log('getPosts result:', result);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error in getPosts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  

  /**
   * Get feed analytics for the current user
   */
  static async getFeedAnalytics(timeRangeHours: number = 24): Promise<PostOperationResult<FeedAnalytics>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      const { data, error } = await supabase.rpc('get_feed_analytics', {
        p_user_id: user.id,
        p_time_range_hours: timeRangeHours
      });

      if (error) {
        return {
          success: false,
          error: `Failed to fetch analytics: ${error.message}`
        };
      }

      return {
        success: true,
        data: data?.[0] || {
          total_posts_available: 0,
          total_posts_viewed: 0,
          total_engagement_actions: 0,
          avg_engagement_score: 0,
          top_categories: [],
          engagement_rate: 0
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Record post views in batch for analytics
   */
  static async recordPostViews(postIds: string[]): Promise<PostOperationResult<number>> {
    try {
      if (postIds.length === 0) {
        return { success: true, data: 0 };
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Allow anonymous views
        return { success: true, data: 0 };
      }

      const { data, error } = await supabase.rpc('batch_record_post_views_safe', {
        p_post_ids: postIds,
        p_user_id: user.id
      });

      if (error) {
        console.warn('Failed to record post views:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: data || 0
      };

    } catch (error) {
      console.warn('Error recording post views:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get posts by specific feed algorithm with optimized parameters
   */
  static async getSmartFeed(params?: Omit<GetPostsParams, 'feed_type'>): Promise<PostOperationResult<GetPostsResult>> {
    return this.getPosts({ ...params, feed_type: 'smart' });
  }

  static async getFollowingFeed(params?: Omit<GetPostsParams, 'feed_type'>): Promise<PostOperationResult<GetPostsResult>> {
    return this.getPosts({ ...params, feed_type: 'following' });
  }

  static async getTrendingFeed(params?: Omit<GetPostsParams, 'feed_type'>): Promise<PostOperationResult<GetPostsResult>> {
    return this.getPosts({ 
      ...params, 
      feed_type: 'trending',
      time_window_hours: params?.time_window_hours || 24, // Trending posts from last 24h
      min_engagement_score: params?.min_engagement_score || 5 // Only high engagement posts
    });
  }

  static async getRecentFeed(params?: Omit<GetPostsParams, 'feed_type'>): Promise<PostOperationResult<GetPostsResult>> {
    return this.getPosts({ ...params, feed_type: 'recent' });
  }

  static async getPopularFeed(params?: Omit<GetPostsParams, 'feed_type'>): Promise<PostOperationResult<GetPostsResult>> {
    return this.getPosts({ 
      ...params, 
      feed_type: 'popular',
      time_window_hours: params?.time_window_hours || 168 // Popular posts from last week
    });
  }

  static async getPersonalizedFeed(params?: Omit<GetPostsParams, 'feed_type'>): Promise<PostOperationResult<GetPostsResult>> {
    return this.getPosts({ ...params, feed_type: 'personalized' });
  }

  /**
   * Search posts with the get_posts function
   */
  static async searchPosts(
    query: string,
    filters?: Omit<GetPostsParams, 'search_query'>
  ): Promise<PostOperationResult<GetPostsResult>> {
    if (!query.trim()) {
      return {
        success: false,
        error: 'Search query cannot be empty'
      };
    }

    if (query.length < 2) {
      return {
        success: false,
        error: FEED_ERROR_CODES.SEARCH_QUERY_TOO_SHORT
      };
    }

    return this.getPosts({
      ...filters,
      search_query: query.trim(),
      feed_type: 'smart' // Use smart algorithm for search relevance
    });
  }

  /**
   * Get posts by location with radius
   */
  static async getLocationFeed(
    coordinates: PostCoordinates,
    radiusKm: number = 10,
    params?: Omit<GetPostsParams, 'user_coordinates' | 'location_radius_km'>
  ): Promise<PostOperationResult<GetPostsResult>> {
    
    if (radiusKm <= 0 || radiusKm > 1000) {
      return {
        success: false,
        error: FEED_ERROR_CODES.INVALID_LOCATION_RADIUS
      };
    }

    return this.getPosts({
      ...params,
      user_coordinates: coordinates,
      location_radius_km: radiusKm,
      feed_type: 'smart'
    });
  }

  /**
   * Get posts by author
   */
  static async getAuthorPosts(
    authorId: string,
    params?: Omit<GetPostsParams, 'author_id'>
  ): Promise<PostOperationResult<GetPostsResult>> {
    return this.getPosts({
      ...params,
      author_id: authorId,
      feed_type: 'recent' // Chronological for author posts
    });
  }

  /**
   * Get posts by category
   */
  static async getCategoryPosts(
    category: string,
    params?: Omit<GetPostsParams, 'category'>
  ): Promise<PostOperationResult<GetPostsResult>> {
    return this.getPosts({
      ...params,
      category,
      feed_type: 'smart'
    });
  }

  /**
   * Get posts by tags
   */
  static async getTaggedPosts(
    tags: string[],
    params?: Omit<GetPostsParams, 'tags'>
  ): Promise<PostOperationResult<GetPostsResult>> {
    if (tags.length === 0) {
      return {
        success: false,
        error: 'At least one tag is required'
      };
    }

    return this.getPosts({
      ...params,
      tags,
      feed_type: 'smart'
    });
  }

  // =================== PRIVATE METHODS ===================

  /**
   * Validate get posts parameters
   */
  private static validateParams(params: GetPostsParams): PostOperationResult<void> {
    const errors: string[] = [];

    // Validate pagination
    if (params.limit !== undefined) {
      if (params.limit < 1 || params.limit > 100) {
        errors.push('Limit must be between 1 and 100');
      }
    }

    if (params.offset !== undefined && params.offset < 0) {
      errors.push('Offset cannot be negative');
    }

    // Validate feed type
    if (params.feed_type) {
      const validFeedTypes: FeedAlgorithmType[] = ['smart', 'following', 'trending', 'recent', 'popular', 'personalized'];
      if (!validFeedTypes.includes(params.feed_type)) {
        errors.push(`Invalid feed type. Must be one of: ${validFeedTypes.join(', ')}`);
      }
    }

    // Validate time window
    if (params.time_window_hours !== undefined) {
      if (params.time_window_hours < 1 || params.time_window_hours > 8760) { // Max 1 year
        errors.push('Time window must be between 1 hour and 1 year (8760 hours)');
      }
    }

    // Validate location radius
    if (params.location_radius_km !== undefined) {
      if (params.location_radius_km <= 0 || params.location_radius_km > 1000) {
        errors.push('Location radius must be between 0 and 1000 kilometers');
      }
    }

    // Validate coordinates
    if (params.user_coordinates) {
      const { latitude, longitude } = params.user_coordinates;
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        errors.push('Invalid coordinates');
      }
    }

    // Validate search query
    if (params.search_query !== undefined) {
      if (params.search_query.trim().length < 2) {
        errors.push('Search query must be at least 2 characters long');
      }
      if (params.search_query.length > 500) {
        errors.push('Search query is too long (max 500 characters)');
      }
    }

    // Validate engagement score
    if (params.min_engagement_score !== undefined && params.min_engagement_score < 0) {
      errors.push('Minimum engagement score cannot be negative');
    }

    // Validate date strings
    if (params.posted_after && isNaN(Date.parse(params.posted_after))) {
      errors.push('Invalid posted_after date format');
    }

    if (params.posted_before && isNaN(Date.parse(params.posted_before))) {
      errors.push('Invalid posted_before date format');
    }

    // Validate tags array
    if (params.tags && params.tags.length > 20) {
      errors.push('Too many tags (max 20)');
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: errors.join('; ')
      };
    }

    return { success: true };
  }

  /**
   * Transform raw post data from RPC function to EnhancedPost interface
   */
  private static transformPostData(rawPost: any): EnhancedPost {
    return {
      // Core post data
      id: rawPost.id,
      author_id: rawPost.author_id,
      author_username: rawPost.author_username,
      author_full_name: rawPost.author_full_name,
      author_avatar_url: rawPost.author_avatar_url,
      author_reputation_score: rawPost.author_reputation_score,
      author_is_verified: rawPost.author_is_verified,
      
      title: rawPost.title,
      content: rawPost.content,
      content_preview: rawPost.content_preview,
      post_type: rawPost.post_type,
      privacy: rawPost.privacy,
      
      // Categories and metadata
      category: rawPost.category,
      tags: rawPost.tags,
      
      // Media and links
      media_urls: rawPost.media_urls,
      media_types: rawPost.media_types,
      external_link: rawPost.external_link,
      external_link_preview: rawPost.external_link_preview,
      
      // Location
      location: rawPost.location,
      coordinates: rawPost.coordinates ? {
        latitude: rawPost.coordinates.coordinates[1],
        longitude: rawPost.coordinates.coordinates[0]
      } : null,
      
      // Engagement metrics
      like_count: rawPost.like_count || 0,
      comment_count: rawPost.comment_count || 0,
      share_count: rawPost.share_count || 0,
      view_count: rawPost.view_count || 0,
      engagement_score: rawPost.engagement_score || 0,
      
      // User interaction states
      user_has_liked: rawPost.user_has_liked || false,
      user_has_saved: rawPost.user_has_saved || false,
      user_has_shared: rawPost.user_has_shared || false,
      user_has_viewed: rawPost.user_has_viewed || false,
      user_reaction_id: rawPost.user_reaction_id,
      
      // Content flags
      is_pinned: rawPost.is_pinned || false,
      is_featured: rawPost.is_featured || false,
      is_sensitive: rawPost.is_sensitive || false,
      content_warning: rawPost.content_warning,
      
      // Timestamps
      created_at: rawPost.created_at,
      published_at: rawPost.published_at,
      last_activity_at: rawPost.last_activity_at,
      
      // Algorithm scoring (from RPC function)
      relevance_score: rawPost.relevance_score,
      viral_velocity: rawPost.viral_velocity,
      freshness_score: rawPost.freshness_score,
      author_affinity_score: rawPost.author_affinity_score,
      final_rank_score: rawPost.final_rank_score
    };
  }

  /**
   * Get feed preferences for a user (helper method)
   */
  static async getUserFeedPreferences(userId?: string): Promise<{
    interests: string[];
    blocked_categories: string[];
    blocked_authors: string[];
    preferred_languages: string[];
  }> {
    try {
      if (!userId) {
        return {
          interests: [],
          blocked_categories: [],
          blocked_authors: [],
          preferred_languages: ['en']
        };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('subjects_of_interest, blocked_categories, blocked_authors, preferred_languages')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return {
          interests: [],
          blocked_categories: [],
          blocked_authors: [],
          preferred_languages: ['en']
        };
      }

      return {
        interests: data.subjects_of_interest || [],
        blocked_categories: data.blocked_categories || [],
        blocked_authors: data.blocked_authors || [],
        preferred_languages: data.preferred_languages || ['en']
      };

    } catch (error) {
      console.warn('Failed to get user feed preferences:', error);
      return {
        interests: [],
        blocked_categories: [],
        blocked_authors: [],
        preferred_languages: ['en']
      };
    }
  }
}

// Default export
export default GetPostService;