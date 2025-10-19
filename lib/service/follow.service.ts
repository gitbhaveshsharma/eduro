/**
 * Follow Service
 * 
 * Handles all follow system database operations and API interactions
 * Provides a clean interface for follower/following CRUD operations
 */

import { supabase } from '../supabase';
import { SupabaseRequestWrapper } from '../api-interceptor';
import type {
  FollowRelationship,
  FollowRelationshipWithProfile,
  FollowRequest,
  FollowRequestWithProfile,
  BlockedUser,
  BlockedUserWithProfile,
  FollowerProfile,
  FollowUserRequest,
  UnfollowUserRequest,
  UpdateFollowRequest,
  SendFollowRequestData,
  RespondToFollowRequestData,
  BlockUserRequest,
  UnblockUserRequest,
  FollowFilters,
  FollowRequestFilters,
  BlockedUserFilters,
  FollowSort,
  FollowRequestSort,
  FollowSearchResult,
  FollowRequestSearchResult,
  BlockedUserSearchResult,
  FollowStats,
  FollowStatusCheck,
  FollowOperationResult,
  BulkFollowRequest,
  BulkUnfollowRequest,
  BulkFollowResult,
  FollowSuggestion,
  FollowSuggestionsResult,
  FollowActivity,
  FollowActivityResult,
  FollowNetworkAnalysis,
  FollowStatus,
  FollowRequestStatus
} from '../schema/follow.types';

export class FollowService {
  // =====================================
  // FOLLOW RELATIONSHIP OPERATIONS
  // =====================================

  /**
   * Follow a user
   */
  static async followUser(request: FollowUserRequest): Promise<FollowOperationResult<FollowRelationship>> {
    return await SupabaseRequestWrapper.profileRequest(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      // Check if user is trying to follow themselves
      if (user.id === request.following_id) {
        return { data: null, error: { message: 'Cannot follow yourself' } };
      }

      // Check if already following
      const { data: existing } = await supabase
        .from('user_followers')
        .select('id, follow_status')
        .eq('follower_id', user.id)
        .eq('following_id', request.following_id)
        .single();

      if (existing) {
        if (existing.follow_status === 'active') {
          return { data: null, error: { message: 'Already following this user' } };
        } else {
          // Reactivate the follow relationship
          return await supabase
            .from('user_followers')
            .update({
              follow_status: 'active',
              follow_category: request.follow_category || null,
              notification_enabled: request.notification_enabled ?? true,
              notes: request.notes || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select()
            .single();
        }
      }

      // Check if target user has blocked current user
      const { data: isBlocked } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', request.following_id)
        .eq('blocked_id', user.id)
        .single();

      if (isBlocked) {
        return { data: null, error: { message: 'Cannot follow this user' } };
      }

      // Create new follow relationship
      return await supabase
        .from('user_followers')
        .insert({
          follower_id: user.id,
          following_id: request.following_id,
          follow_status: 'active',
          follow_category: request.follow_category || null,
          notification_enabled: request.notification_enabled ?? true,
          notes: request.notes || null
        })
        .select()
        .single();
    });
  }

  /**
   * Unfollow a user
   */
  static async unfollowUser(request: UnfollowUserRequest): Promise<FollowOperationResult<boolean>> {
    return await SupabaseRequestWrapper.profileRequest(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      const { error } = await supabase
        .from('user_followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', request.following_id);

      if (error) {
        return { data: null, error };
      }

      return { data: true, error: null };
    });
  }

  /**
   * Update follow relationship settings
   */
  static async updateFollowRelationship(request: UpdateFollowRequest): Promise<FollowOperationResult<FollowRelationship>> {
    return await SupabaseRequestWrapper.profileRequest(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      const updateData: Partial<FollowRelationship> = {
        updated_at: new Date().toISOString()
      };

      if (request.follow_status !== undefined) updateData.follow_status = request.follow_status;
      if (request.notification_enabled !== undefined) updateData.notification_enabled = request.notification_enabled;
      if (request.follow_category !== undefined) updateData.follow_category = request.follow_category;
      if (request.notes !== undefined) updateData.notes = request.notes;

      return await supabase
        .from('user_followers')
        .update(updateData)
        .eq('follower_id', user.id)
        .eq('following_id', request.following_id)
        .select()
        .single();
    });
  }

  /**
   * Get user's followers
   */
  static async getFollowers(
    userId?: string,
    filters?: FollowFilters,
    sort?: FollowSort,
    page: number = 1,
    perPage: number = 20
  ): Promise<FollowOperationResult<FollowSearchResult>> {
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      
      if (!targetUserId) {
        return { success: false, error: 'User not authenticated' };
      }

      let query = supabase
        .from('user_followers')
        .select(`
          *,
          follower_profile:profiles!user_followers_follower_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            role,
            is_verified,
            is_online,
            follower_count,
            following_count,
            created_at
          )
        `)
        .eq('following_id', targetUserId)
        .eq('follow_status', 'active');

      // Apply filters
      if (filters) {
        if (filters.follow_category) {
          if (Array.isArray(filters.follow_category)) {
            query = query.in('follow_category', filters.follow_category);
          } else {
            query = query.eq('follow_category', filters.follow_category);
          }
        }

        if (filters.is_mutual !== undefined) {
          query = query.eq('is_mutual', filters.is_mutual);
        }

        if (filters.notification_enabled !== undefined) {
          query = query.eq('notification_enabled', filters.notification_enabled);
        }

        if (filters.search_query) {
          query = query.or(`
            follower_profile.username.ilike.%${filters.search_query}%,
            follower_profile.full_name.ilike.%${filters.search_query}%
          `);
        }
      }

      // Apply sorting
      if (sort) {
        const direction = sort.direction === 'desc' ? 'desc' : 'asc';
        if (sort.field === 'username' || sort.field === 'full_name' || sort.field === 'follower_count' || sort.field === 'following_count') {
          query = query.order(`follower_profile.${sort.field}`, { ascending: direction === 'asc' });
        } else {
          query = query.order(sort.field, { ascending: direction === 'asc' });
        }
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Count query for pagination
      const countQuery = supabase
        .from('user_followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId)
        .eq('follow_status', 'active');

      // Apply same filters to count query
      // ... (apply same filters as above)

      const [{ data: follows, error }, { count }] = await Promise.all([
        query.range((page - 1) * perPage, page * perPage - 1),
        countQuery
      ]);

      if (error) {
        return { success: false, error: error.message };
      }

      const result: FollowSearchResult = {
        follows: follows as FollowRelationshipWithProfile[],
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

  /**
   * Get users that the user is following
   */
  static async getFollowing(
    userId?: string,
    filters?: FollowFilters,
    sort?: FollowSort,
    page: number = 1,
    perPage: number = 20
  ): Promise<FollowOperationResult<FollowSearchResult>> {
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      
      if (!targetUserId) {
        return { success: false, error: 'User not authenticated' };
      }

      let query = supabase
        .from('user_followers')
        .select(`
          *,
          following_profile:profiles!user_followers_following_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            role,
            is_verified,
            is_online,
            follower_count,
            following_count,
            created_at
          )
        `)
        .eq('follower_id', targetUserId)
        .eq('follow_status', 'active');

      // Apply filters (similar to getFollowers)
      if (filters) {
        if (filters.follow_category) {
          if (Array.isArray(filters.follow_category)) {
            query = query.in('follow_category', filters.follow_category);
          } else {
            query = query.eq('follow_category', filters.follow_category);
          }
        }

        if (filters.is_mutual !== undefined) {
          query = query.eq('is_mutual', filters.is_mutual);
        }

        if (filters.notification_enabled !== undefined) {
          query = query.eq('notification_enabled', filters.notification_enabled);
        }

        if (filters.search_query) {
          query = query.or(`
            following_profile.username.ilike.%${filters.search_query}%,
            following_profile.full_name.ilike.%${filters.search_query}%
          `);
        }
      }

      // Apply sorting
      if (sort) {
        const direction = sort.direction === 'desc' ? 'desc' : 'asc';
        if (sort.field === 'username' || sort.field === 'full_name' || sort.field === 'follower_count' || sort.field === 'following_count') {
          query = query.order(`following_profile.${sort.field}`, { ascending: direction === 'asc' });
        } else {
          query = query.order(sort.field, { ascending: direction === 'asc' });
        }
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Execute query with pagination
      const [{ data: follows, error }, { count }] = await Promise.all([
        query.range((page - 1) * perPage, page * perPage - 1),
        supabase
          .from('user_followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', targetUserId)
          .eq('follow_status', 'active')
      ]);

      if (error) {
        return { success: false, error: error.message };
      }

      const result: FollowSearchResult = {
        follows: follows as FollowRelationshipWithProfile[],
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

  // =====================================
  // FOLLOW REQUEST OPERATIONS
  // =====================================

  /**
   * Send a follow request
   */
  static async sendFollowRequest(request: SendFollowRequestData): Promise<FollowOperationResult<FollowRequest>> {
    return await SupabaseRequestWrapper.profileRequest(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      // Check if user is trying to request themselves
      if (user.id === request.target_id) {
        return { data: null, error: { message: 'Cannot send follow request to yourself' } };
      }

      // Check if already following
      const { data: existingFollow } = await supabase
        .from('user_followers')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', request.target_id)
        .single();

      if (existingFollow) {
        return { data: null, error: { message: 'Already following this user' } };
      }

      // Check if request already exists
      const { data: existingRequest } = await supabase
        .from('follow_requests')
        .select('id, status')
        .eq('requester_id', user.id)
        .eq('target_id', request.target_id)
        .single();

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          return { data: null, error: { message: 'Follow request already sent' } };
        } else {
          // Delete old request and create new one
          await supabase
            .from('follow_requests')
            .delete()
            .eq('id', existingRequest.id);
        }
      }

      // Create new follow request
      return await supabase
        .from('follow_requests')
        .insert({
          requester_id: user.id,
          target_id: request.target_id,
          message: request.message || null,
          status: 'pending'
        })
        .select()
        .single();
    });
  }

  /**
   * Respond to a follow request (accept/reject)
   */
  static async respondToFollowRequest(request: RespondToFollowRequestData): Promise<FollowOperationResult<FollowRequest>> {
    return await SupabaseRequestWrapper.profileRequest(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      // Get the follow request
      const { data: followRequest, error: requestError } = await supabase
        .from('follow_requests')
        .select('*')
        .eq('id', request.request_id)
        .eq('target_id', user.id)
        .eq('status', 'pending')
        .single();

      if (requestError || !followRequest) {
        return { data: null, error: { message: 'Follow request not found' } };
      }

      // Update request status
      const { data: updatedRequest, error: updateError } = await supabase
        .from('follow_requests')
        .update({
          status: request.status,
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', request.request_id)
        .select()
        .single();

      if (updateError) {
        return { data: null, error: updateError };
      }

      // If accepted, create follow relationship
      if (request.status === 'accepted') {
        await supabase
          .from('user_followers')
          .insert({
            follower_id: followRequest.requester_id,
            following_id: followRequest.target_id,
            follow_status: 'active'
          });
      }

      return { data: updatedRequest, error: null };
    });
  }

  /**
   * Cancel a sent follow request
   */
  static async cancelFollowRequest(targetId: string): Promise<FollowOperationResult<boolean>> {
    return await SupabaseRequestWrapper.profileRequest(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      const { error } = await supabase
        .from('follow_requests')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('requester_id', user.id)
        .eq('target_id', targetId)
        .eq('status', 'pending');

      if (error) {
        return { data: null, error };
      }

      return { data: true, error: null };
    });
  }

  /**
   * Get received follow requests
   */
  static async getReceivedFollowRequests(
    filters?: FollowRequestFilters,
    sort?: FollowRequestSort,
    page: number = 1,
    perPage: number = 20
  ): Promise<FollowOperationResult<FollowRequestSearchResult>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      let query = supabase
        .from('follow_requests')
        .select(`
          *,
          requester_profile:profiles!follow_requests_requester_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            role,
            is_verified,
            is_online,
            follower_count,
            following_count,
            created_at
          )
        `)
        .eq('target_id', user.id);

      // Apply filters
      if (filters) {
        if (filters.status) {
          if (Array.isArray(filters.status)) {
            query = query.in('status', filters.status);
          } else {
            query = query.eq('status', filters.status);
          }
        }

        if (filters.search_query) {
          query = query.or(`
            requester_profile.username.ilike.%${filters.search_query}%,
            requester_profile.full_name.ilike.%${filters.search_query}%
          `);
        }
      }

      // Apply sorting
      if (sort) {
        const direction = sort.direction === 'desc' ? 'desc' : 'asc';
        if (sort.field === 'username' || sort.field === 'full_name') {
          query = query.order(`requester_profile.${sort.field}`, { ascending: direction === 'asc' });
        } else {
          query = query.order(sort.field, { ascending: direction === 'asc' });
        }
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Execute query with pagination
      const [{ data: requests, error }, { count }] = await Promise.all([
        query.range((page - 1) * perPage, page * perPage - 1),
        supabase
          .from('follow_requests')
          .select('*', { count: 'exact', head: true })
          .eq('target_id', user.id)
      ]);

      if (error) {
        return { success: false, error: error.message };
      }

      const result: FollowRequestSearchResult = {
        requests: requests as FollowRequestWithProfile[],
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

  /**
   * Get sent follow requests
   */
  static async getSentFollowRequests(
    filters?: FollowRequestFilters,
    sort?: FollowRequestSort,
    page: number = 1,
    perPage: number = 20
  ): Promise<FollowOperationResult<FollowRequestSearchResult>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      let query = supabase
        .from('follow_requests')
        .select(`
          *,
          target_profile:profiles!follow_requests_target_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            role,
            is_verified,
            is_online,
            follower_count,
            following_count,
            created_at
          )
        `)
        .eq('requester_id', user.id);

      // Apply filters
      if (filters) {
        if (filters.status) {
          if (Array.isArray(filters.status)) {
            query = query.in('status', filters.status);
          } else {
            query = query.eq('status', filters.status);
          }
        }

        if (filters.search_query) {
          query = query.or(`
            target_profile.username.ilike.%${filters.search_query}%,
            target_profile.full_name.ilike.%${filters.search_query}%
          `);
        }
      }

      // Apply sorting
      if (sort) {
        const direction = sort.direction === 'desc' ? 'desc' : 'asc';
        if (sort.field === 'username' || sort.field === 'full_name') {
          query = query.order(`target_profile.${sort.field}`, { ascending: direction === 'asc' });
        } else {
          query = query.order(sort.field, { ascending: direction === 'asc' });
        }
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Execute query with pagination
      const [{ data: requests, error }, { count }] = await Promise.all([
        query.range((page - 1) * perPage, page * perPage - 1),
        supabase
          .from('follow_requests')
          .select('*', { count: 'exact', head: true })
          .eq('requester_id', user.id)
      ]);

      if (error) {
        return { success: false, error: error.message };
      }

      const result: FollowRequestSearchResult = {
        requests: requests as FollowRequestWithProfile[],
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

  // =====================================
  // BLOCKING OPERATIONS
  // =====================================

  /**
   * Block a user
   */
  static async blockUser(request: BlockUserRequest): Promise<FollowOperationResult<BlockedUser>> {
    return await SupabaseRequestWrapper.profileRequest(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      // Check if user is trying to block themselves
      if (user.id === request.blocked_id) {
        return { data: null, error: { message: 'Cannot block yourself' } };
      }

      // Check if already blocked
      const { data: existingBlock } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', request.blocked_id)
        .single();

      if (existingBlock) {
        return { data: null, error: { message: 'User is already blocked' } };
      }

      // Remove any existing follow relationships
      await Promise.all([
        supabase
          .from('user_followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', request.blocked_id),
        supabase
          .from('user_followers')
          .delete()
          .eq('follower_id', request.blocked_id)
          .eq('following_id', user.id),
        supabase
          .from('follow_requests')
          .delete()
          .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`)
          .or(`requester_id.eq.${request.blocked_id},target_id.eq.${request.blocked_id}`)
      ]);

      // Create block relationship
      return await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: request.blocked_id,
          reason: request.reason || null
        })
        .select()
        .single();
    });
  }

  /**
   * Unblock a user
   */
  static async unblockUser(request: UnblockUserRequest): Promise<FollowOperationResult<boolean>> {
    return await SupabaseRequestWrapper.profileRequest(async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', request.blocked_id);

      if (error) {
        return { data: null, error };
      }

      return { data: true, error: null };
    });
  }

  /**
   * Get blocked users
   */
  static async getBlockedUsers(
    filters?: BlockedUserFilters,
    page: number = 1,
    perPage: number = 20
  ): Promise<FollowOperationResult<BlockedUserSearchResult>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      let query = supabase
        .from('blocked_users')
        .select(`
          *,
          blocked_profile:profiles!blocked_users_blocked_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            role,
            is_verified,
            is_online,
            follower_count,
            following_count,
            created_at
          )
        `)
        .eq('blocker_id', user.id);

      // Apply filters
      if (filters?.search_query) {
        query = query.or(`
          blocked_profile.username.ilike.%${filters.search_query}%,
          blocked_profile.full_name.ilike.%${filters.search_query}%
        `);
      }

      query = query.order('created_at', { ascending: false });

      // Execute query with pagination
      const [{ data: blockedUsers, error }, { count }] = await Promise.all([
        query.range((page - 1) * perPage, page * perPage - 1),
        supabase
          .from('blocked_users')
          .select('*', { count: 'exact', head: true })
          .eq('blocker_id', user.id)
      ]);

      if (error) {
        return { success: false, error: error.message };
      }

      const result: BlockedUserSearchResult = {
        blocked_users: blockedUsers as BlockedUserWithProfile[],
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

  // =====================================
  // STATUS AND UTILITY OPERATIONS
  // =====================================

  /**
   * Check follow status between current user and target user
   */
  static async getFollowStatus(targetUserId: string): Promise<FollowOperationResult<FollowStatusCheck>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      if (user.id === targetUserId) {
        return {
          success: true,
          data: {
            is_following: false,
            is_followed_by: false,
            is_mutual: false,
            is_blocked: false,
            is_blocking: false,
            has_pending_request: false,
            has_received_request: false
          }
        };
      }

      // Check all relationships in parallel
      const [
        { data: followingRelation },
        { data: followerRelation },
        { data: isBlocked },
        { data: isBlocking },
        { data: sentRequest },
        { data: receivedRequest }
      ] = await Promise.all([
        // Check if current user follows target
        supabase
          .from('user_followers')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .eq('follow_status', 'active')
          .single(),
        
        // Check if target follows current user
        supabase
          .from('user_followers')
          .select('*')
          .eq('follower_id', targetUserId)
          .eq('following_id', user.id)
          .eq('follow_status', 'active')
          .single(),
        
        // Check if current user is blocked by target
        supabase
          .from('blocked_users')
          .select('id')
          .eq('blocker_id', targetUserId)
          .eq('blocked_id', user.id)
          .single(),
        
        // Check if current user blocked target
        supabase
          .from('blocked_users')
          .select('id')
          .eq('blocker_id', user.id)
          .eq('blocked_id', targetUserId)
          .single(),
        
        // Check for pending request sent by current user
        supabase
          .from('follow_requests')
          .select('id')
          .eq('requester_id', user.id)
          .eq('target_id', targetUserId)
          .eq('status', 'pending')
          .single(),
        
        // Check for pending request received by current user
        supabase
          .from('follow_requests')
          .select('id')
          .eq('requester_id', targetUserId)
          .eq('target_id', user.id)
          .eq('status', 'pending')
          .single()
      ]);

      const result: FollowStatusCheck = {
        is_following: !!followingRelation,
        is_followed_by: !!followerRelation,
        is_mutual: !!(followingRelation && followerRelation),
        is_blocked: !!isBlocked,
        is_blocking: !!isBlocking,
        has_pending_request: !!sentRequest,
        has_received_request: !!receivedRequest,
        follow_status: followingRelation?.follow_status,
        relationship: followingRelation || undefined
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
   * Get follow statistics for a user
   */
  static async getFollowStats(userId?: string): Promise<FollowOperationResult<FollowStats>> {
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      
      if (!targetUserId) {
        return { success: false, error: 'User not authenticated' };
      }

      const [
        { count: followers },
        { count: following },
        { count: mutualFollows },
        { count: activeFollows },
        { count: pendingRequests },
        { count: blockedUsers }
      ] = await Promise.all([
        supabase
          .from('user_followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', targetUserId)
          .eq('follow_status', 'active'),
        
        supabase
          .from('user_followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', targetUserId)
          .eq('follow_status', 'active'),
        
        supabase
          .from('user_followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', targetUserId)
          .eq('is_mutual', true),
        
        supabase
          .from('user_followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', targetUserId)
          .eq('follow_status', 'active'),
        
        supabase
          .from('follow_requests')
          .select('*', { count: 'exact', head: true })
          .eq('target_id', targetUserId)
          .eq('status', 'pending'),
        
        supabase
          .from('blocked_users')
          .select('*', { count: 'exact', head: true })
          .eq('blocker_id', targetUserId)
      ]);

      const stats: FollowStats = {
        total_follows: (following || 0) + (followers || 0),
        mutual_follows: mutualFollows || 0,
        active_follows: activeFollows || 0,
        pending_requests: pendingRequests || 0,
        blocked_users: blockedUsers || 0,
        followers: followers || 0,
        following: following || 0
      };

      return { success: true, data: stats };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // =====================================
  // BULK OPERATIONS
  // =====================================

  /**
   * Follow multiple users at once
   */
  static async bulkFollowUsers(request: BulkFollowRequest): Promise<FollowOperationResult<BulkFollowResult>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      const successful: string[] = [];
      const failed: Array<{ user_id: string; error: string }> = [];

      // Process each user ID
      for (const userId of request.user_ids) {
        try {
          if (userId === user.id) {
            failed.push({ user_id: userId, error: 'Cannot follow yourself' });
            continue;
          }

          const followResult = await this.followUser({
            following_id: userId,
            follow_category: request.follow_category,
            notification_enabled: request.notification_enabled
          });

          if (followResult.success) {
            successful.push(userId);
          } else {
            failed.push({ user_id: userId, error: followResult.error || 'Unknown error' });
          }
        } catch (error) {
          failed.push({ 
            user_id: userId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      const result: BulkFollowResult = {
        successful,
        failed,
        total_processed: request.user_ids.length
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
   * Unfollow multiple users at once
   */
  static async bulkUnfollowUsers(request: BulkUnfollowRequest): Promise<FollowOperationResult<BulkFollowResult>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      const successful: string[] = [];
      const failed: Array<{ user_id: string; error: string }> = [];

      // Process each user ID
      for (const userId of request.user_ids) {
        try {
          const unfollowResult = await this.unfollowUser({ following_id: userId });

          if (unfollowResult.success) {
            successful.push(userId);
          } else {
            failed.push({ user_id: userId, error: unfollowResult.error || 'Unknown error' });
          }
        } catch (error) {
          failed.push({ 
            user_id: userId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      const result: BulkFollowResult = {
        successful,
        failed,
        total_processed: request.user_ids.length
      };

      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // =====================================
  // SUGGESTIONS AND RECOMMENDATIONS
  // =====================================

  /**
   * Get follow suggestions for current user
   */
  static async getFollowSuggestions(limit: number = 10): Promise<FollowOperationResult<FollowSuggestionsResult>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get users the current user is not following
      // Attempt RPC call and provide richer error logging on failure.
      let suggestions: any = null;
      try {
        const res = await supabase.rpc('get_follow_suggestions', {
          p_user_id: user.id,
          p_limit: limit
        });

        // supabase.rpc can return a single object with { data, error }
        // or a direct tuple depending on client version. Normalize.
        // If using the modular client, res may be { data, error }
        if ((res as any).error) {
          throw (res as any).error;
        }

        suggestions = (res as any).data ?? res;
      } catch (rpcError) {
        // Log full error object for debugging (includes hint/details)
        console.error('[FollowService] getFollowSuggestions RPC failed (p_user_id):', rpcError);

        // Try fallback with alternate param name in case function signature was deployed differently
        try {
          console.log('[FollowService] Retrying get_follow_suggestions RPC with fallback param "user_id"');
          const res2 = await supabase.rpc('get_follow_suggestions', {
            user_id: user.id,
            p_limit: limit
          });

          if ((res2 as any).error) {
            throw (res2 as any).error;
          }

          suggestions = (res2 as any).data ?? res2;
        } catch (rpcError2) {
          console.error('[FollowService] getFollowSuggestions RPC failed (fallback user_id):', rpcError2);
          // Return a helpful error message including PostgREST/Supabase error fields if available
          // Safely extract known fields from the RPC error object if present
          const extractField = (obj: any, field: string) => {
            try {
              if (!obj) return null;
              const v = obj[field];
              if (v === undefined || v === null) return null;
              return typeof v === 'string' ? v : JSON.stringify(v);
            } catch (_) {
              return null;
            }
          };

          const message = extractField(rpcError2, 'message') || extractField(rpcError, 'message') || 'RPC get_follow_suggestions failed with 400 Bad Request';
          const details = extractField(rpcError2, 'details') || extractField(rpcError, 'details');
          const hint = extractField(rpcError2, 'hint') || extractField(rpcError, 'hint');

          const composed = `${message}${details ? ' - ' + details : ''}${hint ? ' (' + hint + ')' : ''}`;
          return { success: false, error: composed };
        }
      }

      const result: FollowSuggestionsResult = {
        suggestions: suggestions || [],
        total_count: suggestions?.length || 0,
        refresh_available_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now
      };

      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}