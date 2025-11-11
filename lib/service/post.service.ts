/**
 * Post Service
 * 
 * Handles all post-related database operations and API interactions
 * Provides a clean interface for post CRUD operations, comments, reactions, and real-time subscriptions
 */

import { createClient } from '../supabase/client';
import { withAuth} from '../api-interceptor';

// Initialize Supabase client
const supabase = createClient();
import type {
  Post,
  PublicPost,
  PostCreate,
  PostUpdate,
  PostFilters,
  PostSort,
  PostSearchResult,
  PostStats,
  PostOperationResult,
  PostPermissions,
  Comment,
  CommentCreate,
  CommentUpdate,
  PostReaction,
  SavedPost,
  PostView,
  PostShare,
  PostAnalytics,
  PostCoordinates,
  LinkPreview,
  MediaUploadProgress,
  FeedSortType,
  ReactionTargetType
} from '../schema/post.types';

// Import constants as values
import {
  POST_ERROR_CODES,
  POST_CONSTANTS
} from '../schema/post.types';

export class PostService {
  /**
   * Create a new post
   */
  static async createPost(postData: PostCreate): Promise<PostOperationResult<Post>> {
    try {
      const result = await withAuth(async () => {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          return {
            data: null,
            error: { message: 'User not authenticated' }
          };
        }

        // Validate post data
        if (!postData.content || postData.content.trim().length === 0) {
          return {
            data: null,
            error: { message: 'Post content is required' }
          };
        }

        // Ensure author_id matches authenticated user
        const postToCreate = {
          ...postData,
          author_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          published_at: postData.scheduled_at || new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('posts')
          .insert(postToCreate)
          .select()
          .single();

        return { data, error };
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error?.message || 'Failed to create post'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error creating post:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while creating the post'
      };
    }
  }

  /**
   * Update post
   */
  static async updatePost(postId: string, updates: PostUpdate): Promise<PostOperationResult<Post>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: POST_ERROR_CODES.NOT_AUTHENTICATED };
      }

      // Validate updates
      const validationResult = this.validatePostUpdate(updates);
      if (!validationResult.success) {
        return validationResult as PostOperationResult<Post>;
      }

      // Check if user owns the post
      const ownership = await this.checkPostOwnership(postId, user.id);
      if (!ownership.success) {
        return { success: false, error: POST_ERROR_CODES.CANNOT_EDIT_POST };
      }

      const { data, error } = await supabase
        .from('posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('author_id', user.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Delete post (soft delete)
   */
  static async deletePost(postId: string): Promise<PostOperationResult<void>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: POST_ERROR_CODES.NOT_AUTHENTICATED };
      }

      // Check if user owns the post
      const ownership = await this.checkPostOwnership(postId, user.id);
      if (!ownership.success) {
        return { success: false, error: POST_ERROR_CODES.CANNOT_DELETE_POST };
      }

      const { error } = await supabase
        .from('posts')
        .update({ 
          status: 'DELETED',
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('author_id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ========== COMMENT OPERATIONS ==========

  /**
   * Create a new comment
   */
  static async createComment(commentData: CommentCreate): Promise<PostOperationResult<Comment>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: POST_ERROR_CODES.NOT_AUTHENTICATED };
      }

      // Validate comment data
      const validationResult = this.validateCommentCreate(commentData);
      if (!validationResult.success) {
        return validationResult as PostOperationResult<Comment>;
      }

      // Use the database function that includes proper validation
      const { data: commentId, error } = await supabase.rpc('create_comment', {
        p_post_id: commentData.post_id,
        p_content: commentData.content,
        p_parent_comment_id: commentData.parent_comment_id || null
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Return basic comment structure
      return { 
        success: true, 
        data: {
          id: commentId,
          post_id: commentData.post_id,
          author_id: user.id,
          parent_comment_id: commentData.parent_comment_id || null,
          content: commentData.content,
          thread_level: 0,
          thread_path: null,
          like_count: 0,
          reply_count: 0,
          status: 'PUBLISHED',
          is_pinned: false,
          is_highlighted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update comment
   */
  static async updateComment(commentId: string, updates: CommentUpdate): Promise<PostOperationResult<Comment>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: POST_ERROR_CODES.NOT_AUTHENTICATED };
      }

      // Check if user owns the comment
      const ownership = await this.checkCommentOwnership(commentId, user.id);
      if (!ownership.success) {
        return { success: false, error: POST_ERROR_CODES.CANNOT_EDIT_POST };
      }

      const { data, error } = await supabase
        .from('comments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('author_id', user.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Delete comment (soft delete)
   */
  static async deleteComment(commentId: string): Promise<PostOperationResult<void>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: POST_ERROR_CODES.NOT_AUTHENTICATED };
      }

      // Check if user owns the comment
      const ownership = await this.checkCommentOwnership(commentId, user.id);
      if (!ownership.success) {
        return { success: false, error: POST_ERROR_CODES.CANNOT_DELETE_POST };
      }

      const { error } = await supabase
        .from('comments')
        .update({ 
          status: 'DELETED',
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('author_id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ========== REACTION OPERATIONS ==========

  /**
   * Toggle reaction on post or comment using the database function
   */
  static async toggleReaction(
    targetType: ReactionTargetType,
    targetId: string,
    reactionId: number
  ): Promise<PostOperationResult<boolean>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: POST_ERROR_CODES.NOT_AUTHENTICATED };
      }

      // Validate reaction ID exists in reactions table
      const { data: reactionExists, error: reactionError } = await supabase
        .from('reactions')
        .select('id')
        .eq('id', reactionId)
        .single();

      if (reactionError || !reactionExists) {
        return { success: false, error: 'Invalid reaction ID' };
      }

      // Use the database's toggle_reaction RPC function which handles all logic atomically
      // This prevents race conditions and handles the unique constraint properly
      const { data, error } = await supabase.rpc('toggle_reaction', {
        target_type_param: targetType,
        target_id_param: targetId,
        reaction_id_param: reactionId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // The function returns TRUE if reaction was added, FALSE if removed
      return { success: true, data: data || false };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get user's reaction to a post or comment with reaction details
   */
  static async getUserReaction(
    targetType: ReactionTargetType,
    targetId: string
  ): Promise<PostOperationResult<PostReaction | null>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: POST_ERROR_CODES.NOT_AUTHENTICATED };
      }

      const { data, error } = await supabase
        .from('post_reactions')
        .select(`
          *,
          reactions!inner(
            name,
            emoji_unicode,
            category,
            description
          )
        `)
        .eq('user_id', user.id)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        return { success: false, error: error.message };
      }

      return { success: true, data: data || null };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get reaction summary for a post or comment
   */
  static async getReactionSummary(
    targetType: ReactionTargetType,
    targetId: string
  ): Promise<PostOperationResult<{ reaction_id: number; reaction_name: string; emoji_unicode: string; category: string; count: number; user_reacted: boolean }[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get all reactions for the target with reaction details
      const { data: reactions, error } = await supabase
        .from('post_reactions')
        .select(`
          reaction_id,
          user_id,
          reactions!inner(
            name,
            emoji_unicode,
            category
          )
        `)
        .eq('target_type', targetType)
        .eq('target_id', targetId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Count reactions and check user's reactions
      const reactionCounts = new Map<number, { 
        count: number; 
        reaction: any; 
        userReacted: boolean 
      }>();

      reactions?.forEach(reaction => {
        const reactionId = reaction.reaction_id;
        const isUserReaction = user && reaction.user_id === user.id;
        
        if (reactionCounts.has(reactionId)) {
          const existing = reactionCounts.get(reactionId)!;
          existing.count++;
          if (isUserReaction) existing.userReacted = true;
        } else {
          reactionCounts.set(reactionId, {
            count: 1,
            reaction: reaction.reactions,
            userReacted: isUserReaction || false,
          });
        }
      });

      // Convert to summary format
      const summary = Array.from(reactionCounts.entries()).map(([reactionId, data]) => ({
        reaction_id: reactionId,
        reaction_name: data.reaction.name,
        emoji_unicode: data.reaction.emoji_unicode,
        category: data.reaction.category,
        count: data.count,
        user_reacted: data.userReacted,
      }));

      // Sort by count (most popular first)
      summary.sort((a, b) => b.count - a.count);

      return { success: true, data: summary };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get all user reactions for a specific target
   */
  static async getAllUserReactions(
    targetType: ReactionTargetType,
    targetId: string
  ): Promise<PostOperationResult<PostReaction[]>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: POST_ERROR_CODES.NOT_AUTHENTICATED };
      }

      const { data, error } = await supabase
        .from('post_reactions')
        .select(`
          *,
          reactions!inner(
            name,
            emoji_unicode,
            category,
            description
          )
        `)
        .eq('user_id', user.id)
        .eq('target_type', targetType)
        .eq('target_id', targetId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ========== SAVED POSTS OPERATIONS ==========

  /**
   * Save/unsave a post
   */
  static async toggleSavedPost(postId: string, collectionName: string = 'default'): Promise<PostOperationResult<boolean>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: POST_ERROR_CODES.NOT_AUTHENTICATED };
      }

      // Check if already saved
      const { data: existing } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      if (existing) {
        // Remove save
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, data: false }; // Unsaved
      } else {
        // Add save
        const { error } = await supabase
          .from('saved_posts')
          .insert({
            user_id: user.id,
            post_id: postId,
            collection_name: collectionName,
            created_at: new Date().toISOString()
          });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, data: true }; // Saved
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get user's saved posts
   */
  static async getSavedPosts(
    collectionName?: string,
    page: number = 1,
    perPage: number = POST_CONSTANTS.DEFAULT_PAGE_SIZE
  ): Promise<PostOperationResult<PostSearchResult>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: POST_ERROR_CODES.NOT_AUTHENTICATED };
      }

      // Validate pagination
      if (page < 1) page = 1;
      if (perPage > POST_CONSTANTS.MAX_PAGE_SIZE) perPage = POST_CONSTANTS.MAX_PAGE_SIZE;

      let query = supabase
        .from('saved_posts')
        .select(`
          created_at,
          posts!inner (
            *,
            profiles:author_id (
              username,
              full_name,
              avatar_url
            )
          )
        `, { count: 'exact' })
        .eq('user_id', user.id);

      if (collectionName) {
        query = query.eq('collection_name', collectionName);
      }

      // Apply pagination
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      // Transform data to match PublicPost interface
      const posts: PublicPost[] = (data || []).map((savedPost: any) => {
        const post = savedPost.posts;
        return {
          ...post,
          author_username: post.profiles?.username || null,
          author_full_name: post.profiles?.full_name || null,
          author_avatar_url: post.profiles?.avatar_url || null,
          user_has_liked: false, // Will be set by the store
          user_has_saved: true, // Always true for saved posts
        };
      });

      // Remove nested profiles objects
      posts.forEach(post => delete (post as any).profiles);

      const result: PostSearchResult = {
        posts,
        total_count: count || 0,
        page,
        per_page: perPage,
        has_more: (count || 0) > page * perPage
      };

      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ========== POST VIEWS OPERATIONS ==========

  /**
   * Record post view using the database function
   */
  static async recordPostView(postId: string, viewDuration?: number): Promise<PostOperationResult<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use the database function that properly handles the unique constraint
      const { error } = await supabase.rpc('record_post_view', {
        post_id_param: postId,
        view_duration_param: viewDuration
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ========== POST SHARES OPERATIONS ==========

  /**
   * Record post share
   */
  static async recordPostShare(
    postId: string, 
    shareType: 'repost' | 'quote' | 'external' = 'external',
    quoteContent?: string,
    platform?: string
  ): Promise<PostOperationResult<PostShare>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: POST_ERROR_CODES.NOT_AUTHENTICATED };
      }

      // Check if post exists
      const { data: postExists, error: postError } = await supabase
        .from('posts')
        .select('id')
        .eq('id', postId)
        .single();

      if (postError || !postExists) {
        return { success: false, error: POST_ERROR_CODES.POST_NOT_FOUND };
      }

      const shareData = {
        original_post_id: postId,
        user_id: user.id,
        share_type: shareType,
        quote_content: quoteContent || null,
        platform: platform || null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('post_shares')
        .insert(shareData)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Share count is automatically updated by database trigger

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get post shares with user information
   */
  static async getPostShares(
    postId: string,
    page: number = 1,
    perPage: number = POST_CONSTANTS.DEFAULT_PAGE_SIZE
  ): Promise<PostOperationResult<{ shares: PostShare[]; total_count: number; has_more: boolean }>> {
    try {
      // Validate pagination
      if (page < 1) page = 1;
      if (perPage > POST_CONSTANTS.MAX_PAGE_SIZE) perPage = POST_CONSTANTS.MAX_PAGE_SIZE;

      const offset = (page - 1) * perPage;

      const { data, error, count } = await supabase
        .from('post_shares')
        .select(`
          *,
          profiles:user_id (
            username,
            full_name,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('original_post_id', postId)
        .order('created_at', { ascending: false })
        .range(offset, offset + perPage - 1);

      if (error) {
        return { success: false, error: error.message };
      }

      const result = {
        shares: data || [],
        total_count: count || 0,
        has_more: (count || 0) > page * perPage
      };

      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get user's shares
   */
  static async getUserShares(
    userId?: string,
    page: number = 1,
    perPage: number = POST_CONSTANTS.DEFAULT_PAGE_SIZE
  ): Promise<PostOperationResult<{ shares: PostShare[]; total_count: number; has_more: boolean }>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: POST_ERROR_CODES.NOT_AUTHENTICATED };
      }

      const targetUserId = userId || user.id;

      // Validate pagination
      if (page < 1) page = 1;
      if (perPage > POST_CONSTANTS.MAX_PAGE_SIZE) perPage = POST_CONSTANTS.MAX_PAGE_SIZE;

      const offset = (page - 1) * perPage;

      const { data, error, count } = await supabase
        .from('post_shares')
        .select(`
          *,
          posts:original_post_id (
            title,
            content,
            post_type,
            created_at,
            profiles:author_id (
              username,
              full_name,
              avatar_url
            )
          )
        `, { count: 'exact' })
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .range(offset, offset + perPage - 1);

      if (error) {
        return { success: false, error: error.message };
      }

      const result = {
        shares: data || [],
        total_count: count || 0,
        has_more: (count || 0) > page * perPage
      };

      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ========== VALIDATION HELPERS ==========

  private static validatePostCreate(postData: PostCreate): PostOperationResult<void> {
    const errors: any[] = [];

    if (!postData.content?.trim()) {
      errors.push({ field: 'content', message: 'Content is required', code: POST_ERROR_CODES.INVALID_CONTENT });
    }

    if (postData.content && postData.content.length > POST_CONSTANTS.MAX_CONTENT_LENGTH) {
      errors.push({ field: 'content', message: 'Content too long', code: POST_ERROR_CODES.CONTENT_TOO_LONG });
    }

    if (postData.title && postData.title.length > POST_CONSTANTS.MAX_TITLE_LENGTH) {
      errors.push({ field: 'title', message: 'Title too long', code: POST_ERROR_CODES.TITLE_TOO_LONG });
    }

    if (postData.tags && postData.tags.length > POST_CONSTANTS.MAX_TAGS) {
      errors.push({ field: 'tags', message: 'Too many tags', code: POST_ERROR_CODES.TOO_MANY_TAGS });
    }

    if (postData.mentions && postData.mentions.length > POST_CONSTANTS.MAX_MENTIONS) {
      errors.push({ field: 'mentions', message: 'Too many mentions', code: POST_ERROR_CODES.TOO_MANY_MENTIONS });
    }

    if (postData.media_urls && postData.media_urls.length > POST_CONSTANTS.MAX_MEDIA_FILES) {
      errors.push({ field: 'media_urls', message: 'Too many media files', code: POST_ERROR_CODES.TOO_MANY_MEDIA_FILES });
    }

    // Validate coordinates
    if (postData.coordinates) {
      const { latitude, longitude } = postData.coordinates;
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        errors.push({ field: 'coordinates', message: 'Invalid coordinates', code: POST_ERROR_CODES.INVALID_COORDINATES });
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true };
  }

  private static validatePostUpdate(updates: PostUpdate): PostOperationResult<void> {
    const errors: any[] = [];

    if (updates.content !== undefined) {
      if (!updates.content?.trim()) {
        errors.push({ field: 'content', message: 'Content cannot be empty', code: POST_ERROR_CODES.INVALID_CONTENT });
      }

      if (updates.content && updates.content.length > POST_CONSTANTS.MAX_CONTENT_LENGTH) {
        errors.push({ field: 'content', message: 'Content too long', code: POST_ERROR_CODES.CONTENT_TOO_LONG });
      }
    }

    if (updates.title && updates.title.length > POST_CONSTANTS.MAX_TITLE_LENGTH) {
      errors.push({ field: 'title', message: 'Title too long', code: POST_ERROR_CODES.TITLE_TOO_LONG });
    }

    if (updates.tags && updates.tags.length > POST_CONSTANTS.MAX_TAGS) {
      errors.push({ field: 'tags', message: 'Too many tags', code: POST_ERROR_CODES.TOO_MANY_TAGS });
    }

    if (updates.mentions && updates.mentions.length > POST_CONSTANTS.MAX_MENTIONS) {
      errors.push({ field: 'mentions', message: 'Too many mentions', code: POST_ERROR_CODES.TOO_MANY_MENTIONS });
    }

    if (updates.media_urls && updates.media_urls.length > POST_CONSTANTS.MAX_MEDIA_FILES) {
      errors.push({ field: 'media_urls', message: 'Too many media files', code: POST_ERROR_CODES.TOO_MANY_MEDIA_FILES });
    }

    // Validate coordinates
    if (updates.coordinates) {
      const { latitude, longitude } = updates.coordinates;
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        errors.push({ field: 'coordinates', message: 'Invalid coordinates', code: POST_ERROR_CODES.INVALID_COORDINATES });
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true };
  }

  private static validateCommentCreate(commentData: CommentCreate): PostOperationResult<void> {
    const errors: any[] = [];

    if (!commentData.content?.trim()) {
      errors.push({ field: 'content', message: 'Comment content is required', code: POST_ERROR_CODES.INVALID_CONTENT });
    }

    if (commentData.content && commentData.content.length > POST_CONSTANTS.MAX_CONTENT_LENGTH) {
      errors.push({ field: 'content', message: 'Comment too long', code: POST_ERROR_CODES.CONTENT_TOO_LONG });
    }

    if (!commentData.post_id) {
      errors.push({ field: 'post_id', message: 'Post ID is required', code: POST_ERROR_CODES.POST_NOT_FOUND });
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true };
  }

  // ========== PERMISSION HELPERS ==========

  private static async checkPostOwnership(postId: string, userId: string): Promise<PostOperationResult<boolean>> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('author_id')
        .eq('id', postId)
        .single();

      if (error) {
        return { success: false, error: POST_ERROR_CODES.POST_NOT_FOUND };
      }

      return { success: data.author_id === userId, data: data.author_id === userId };
    } catch (error) {
      return { success: false, error: 'Failed to check post ownership' };
    }
  }

  private static async checkCommentOwnership(commentId: string, userId: string): Promise<PostOperationResult<boolean>> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('author_id')
        .eq('id', commentId)
        .single();

      if (error) {
        return { success: false, error: POST_ERROR_CODES.COMMENT_NOT_FOUND };
      }

      return { success: data.author_id === userId, data: data.author_id === userId };
    } catch (error) {
      return { success: false, error: 'Failed to check comment ownership' };
    }
  }

  /**
   * Get post statistics
   */
  static async getPostStats(): Promise<PostOperationResult<PostStats>> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('post_type, status, category, created_at, like_count, comment_count, share_count, engagement_score')
        .neq('status', 'DELETED');

      if (error) {
        return { success: false, error: error.message };
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const publishedPosts = data.filter(p => p.status === 'PUBLISHED');
      const draftPosts = data.filter(p => p.status === 'DRAFT');

      const stats: PostStats = {
        total_posts: data.length,
        published_posts: publishedPosts.length,
        draft_posts: draftPosts.length,
        posts_today: data.filter(p => new Date(p.created_at) >= today).length,
        posts_this_week: data.filter(p => new Date(p.created_at) >= weekAgo).length,
        posts_this_month: data.filter(p => new Date(p.created_at) >= monthAgo).length,
        total_engagement: data.reduce((sum, p) => sum + p.like_count + p.comment_count + p.share_count, 0),
        average_engagement_score: data.length > 0 
          ? data.reduce((sum, p) => sum + p.engagement_score, 0) / data.length 
          : 0,
        top_categories: this.getTopCategories(data),
        post_type_distribution: this.getPostTypeDistribution(data)
      };

      return { success: true, data: stats };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private static getTopCategories(posts: any[]): Array<{ category: string; count: number }> {
    const categoryCount: Record<string, number> = {};
    
    posts.forEach(post => {
      if (post.category) {
        categoryCount[post.category] = (categoryCount[post.category] || 0) + 1;
      }
    });

    return Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private static getPostTypeDistribution(posts: any[]): Array<{ type: any; count: number }> {
    const typeCount: Record<string, number> = {};
    
    posts.forEach(post => {
      typeCount[post.post_type] = (typeCount[post.post_type] || 0) + 1;
    });

    return Object.entries(typeCount)
      .map(([type, count]) => ({ type: type as any, count }))
      .sort((a, b) => b.count - a.count);
  }

  // ========== REAL-TIME SUBSCRIPTIONS ==========

  /**
   * NOTE: Real-time reaction subscriptions moved to PostReactionService
   * Use PostReactionService.subscribeToTarget() for reaction-specific subscriptions
   * This keeps reaction logic separated and prevents WebSocket connection issues
   */

  /**
   * Subscribe to post engagement metrics (likes, comments, shares) in real-time
   */
  static subscribeToPostEngagement(
    postId: string,
    onEngagementChange: (payload: any) => void
  ): () => void {
    const subscription = supabase
      .channel(`post_engagement:${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
          filter: `id=eq.${postId}`
        },
        (payload) => {
          console.log('Post engagement change:', payload);
          onEngagementChange(payload);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(subscription);
    };
  }

  /**
   * Subscribe to multiple posts engagement metrics
   */
  static subscribeToMultiplePostsEngagement(
    postIds: string[],
    onEngagementChange: (payload: any) => void
  ): () => void {
    if (postIds.length === 0) {
      return () => {}; // No-op unsubscribe function
    }

    const subscription = supabase
      .channel(`posts_engagement:${postIds.join(',')}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
          filter: `id=in.(${postIds.join(',')})`
        },
        (payload) => {
          console.log('Multiple posts engagement change:', payload);
          onEngagementChange(payload);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(subscription);
    };
  }

  /**
   * Subscribe to new comments on a post
   */
  static subscribeToPostComments(
    postId: string,
    onCommentChange: (payload: any) => void
  ): () => void {
    const subscription = supabase
      .channel(`post_comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          console.log('Post comment change:', payload);
          onCommentChange(payload);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(subscription);
    };
  }

  /**
   * Get detailed reaction information for real-time updates
   */
  static async getReactionDetails(
    targetType: ReactionTargetType,
    targetId: string,
    reactionId: number
  ): Promise<PostOperationResult<any>> {
    try {
      const { data, error } = await supabase
        .from('post_reactions')
        .select(`
          *,
          reactions!inner(
            name,
            emoji_unicode,
            category,
            description
          ),
          profiles:user_id(
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .eq('reaction_id', reactionId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
