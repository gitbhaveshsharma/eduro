/**
 * Follow Module Index
 * 
 * Centralized exports for all follow system functionality
 * Provides a clean and organized API for importing follow components
 */

// Types and Schemas
export * from './schema/follow.types';

// Services
export { FollowService } from './service/follow.service';

// Store and Hooks
export {
  useFollowStore,
  
  // Data selectors
  useFollowers,
  useFollowing,
  useReceivedRequests,
  useSentRequests,
  useBlockedUsers,
  useFollowStats,
  useFollowSuggestions,
  
  // Loading state selectors
  useFollowersLoading,
  useFollowingLoading,
  useRequestsLoading,
  useBlockedLoading,
  useStatsLoading,
  useSuggestionsLoading,
  
  // Operation loading selectors
  useFollowLoading,
  useUnfollowLoading,
  useBlockLoading,
  useUnblockLoading,
  useRequestLoading,
  
  // Error state selectors
  useFollowersError,
  useFollowingError,
  useRequestsError,
  useBlockedError,
  useStatsError,
  useSuggestionsError,
  
  // Search results selectors
  useFollowerSearchResults,
  useFollowingSearchResults,
  useRequestSearchResults,
  useBlockedSearchResults,
  
  // Pagination selectors
  useFollowersPagination,
  useFollowingPagination,
  useRequestsPagination,
  useBlockedPagination,
  
  // Cache selectors
  useFollowStatusFromCache,
  
  // Derived data selectors
  useFollowCounts,
  useMutualFollows,
  usePendingRequests,
  
  // Helper hooks
  useIsFollowing,
  useIsFollowedBy,
  useIsBlocked,
  useHasPendingRequest,
  useHasReceivedRequest,
} from './store/follow.store';

// Utilities
export {
  FollowDisplayUtils,
  FollowValidationUtils,
  FollowFilterUtils,
  FollowSortUtils,
  FollowTransformUtils,
  FollowSearchUtils,
  FollowAnalyticsUtils,
  FollowPermissionUtils,
  FollowUrlUtils,
} from './utils/follow.utils';

// Import store for internal use
import { useFollowStore } from './store/follow.store';
import type { 
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
  BulkFollowRequest,
  BulkUnfollowRequest,
  FollowStatusCheck
} from './schema/follow.types';

/**
 * Main Follow API
 * 
 * Convenient wrapper around the follow service and store
 * for common operations
 */
export class FollowAPI {
  /**
   * Initialize follow system for current user
   */
  static async initialize() {
    const store = useFollowStore.getState();
    await Promise.all([
      store.loadFollowers(),
      store.loadFollowing(),
      store.loadReceivedRequests(),
      store.loadStats(),
    ]);
  }

  /**
   * Follow a user
   */
  static async followUser(request: FollowUserRequest): Promise<boolean> {
    const store = useFollowStore.getState();
    return await store.followUser(request);
  }

  /**
   * Unfollow a user
   */
  static async unfollowUser(request: UnfollowUserRequest): Promise<boolean> {
    const store = useFollowStore.getState();
    return await store.unfollowUser(request);
  }

  /**
   * Update follow relationship settings
   */
  static async updateFollowRelationship(request: UpdateFollowRequest): Promise<boolean> {
    const store = useFollowStore.getState();
    return await store.updateFollowRelationship(request);
  }

  /**
   * Send a follow request
   */
  static async sendFollowRequest(request: SendFollowRequestData): Promise<boolean> {
    const store = useFollowStore.getState();
    return await store.sendFollowRequest(request);
  }

  /**
   * Respond to a follow request
   */
  static async respondToFollowRequest(request: RespondToFollowRequestData): Promise<boolean> {
    const store = useFollowStore.getState();
    return await store.respondToFollowRequest(request);
  }

  /**
   * Cancel a sent follow request
   */
  static async cancelFollowRequest(targetId: string): Promise<boolean> {
    const store = useFollowStore.getState();
    return await store.cancelFollowRequest(targetId);
  }

  /**
   * Block a user
   */
  static async blockUser(request: BlockUserRequest): Promise<boolean> {
    const store = useFollowStore.getState();
    return await store.blockUser(request);
  }

  /**
   * Unblock a user
   */
  static async unblockUser(request: UnblockUserRequest): Promise<boolean> {
    const store = useFollowStore.getState();
    return await store.unblockUser(request);
  }

  /**
   * Get follow status between current user and target user
   */
  static async getFollowStatus(targetUserId: string, useCache: boolean = true): Promise<FollowStatusCheck | null> {
    const store = useFollowStore.getState();
    return await store.getFollowStatus(targetUserId, useCache);
  }

  /**
   * Refresh follow status for a user
   */
  static async refreshFollowStatus(targetUserId: string): Promise<FollowStatusCheck | null> {
    const store = useFollowStore.getState();
    return await store.refreshFollowStatus(targetUserId);
  }

  /**
   * Load followers list
   */
  static async loadFollowers(
    userId?: string,
    filters?: FollowFilters,
    sort?: FollowSort,
    page?: number,
    refresh?: boolean
  ): Promise<void> {
    const store = useFollowStore.getState();
    await store.loadFollowers(userId, filters, sort, page, refresh);
  }

  /**
   * Load following list
   */
  static async loadFollowing(
    userId?: string,
    filters?: FollowFilters,
    sort?: FollowSort,
    page?: number,
    refresh?: boolean
  ): Promise<void> {
    const store = useFollowStore.getState();
    await store.loadFollowing(userId, filters, sort, page, refresh);
  }

  /**
   * Load received follow requests
   */
  static async loadReceivedRequests(
    filters?: FollowRequestFilters,
    sort?: FollowRequestSort,
    page?: number,
    refresh?: boolean
  ): Promise<void> {
    const store = useFollowStore.getState();
    await store.loadReceivedRequests(filters, sort, page, refresh);
  }

  /**
   * Load sent follow requests
   */
  static async loadSentRequests(
    filters?: FollowRequestFilters,
    sort?: FollowRequestSort,
    page?: number,
    refresh?: boolean
  ): Promise<void> {
    const store = useFollowStore.getState();
    await store.loadSentRequests(filters, sort, page, refresh);
  }

  /**
   * Load blocked users
   */
  static async loadBlockedUsers(
    filters?: BlockedUserFilters,
    page?: number,
    refresh?: boolean
  ): Promise<void> {
    const store = useFollowStore.getState();
    await store.loadBlockedUsers(filters, page, refresh);
  }

  /**
   * Load follow statistics
   */
  static async loadStats(userId?: string, refresh?: boolean): Promise<void> {
    const store = useFollowStore.getState();
    await store.loadStats(userId, refresh);
  }

  /**
   * Load follow suggestions
   */
  static async loadSuggestions(limit?: number, refresh?: boolean): Promise<void> {
    const store = useFollowStore.getState();
    await store.loadSuggestions(limit, refresh);
  }

  /**
   * Bulk follow multiple users
   */
  static async bulkFollowUsers(request: BulkFollowRequest) {
    const store = useFollowStore.getState();
    return await store.bulkFollowUsers(request);
  }

  /**
   * Bulk unfollow multiple users
   */
  static async bulkUnfollowUsers(request: BulkUnfollowRequest) {
    const store = useFollowStore.getState();
    return await store.bulkUnfollowUsers(request);
  }

  /**
   * Get current follow data
   */
  static getFollowData() {
    const store = useFollowStore.getState();
    return {
      followers: store.followers,
      following: store.following,
      receivedRequests: store.receivedRequests,
      sentRequests: store.sentRequests,
      blockedUsers: store.blockedUsers,
      stats: store.stats,
      suggestions: store.suggestions,
    };
  }

  /**
   * Get follow counts
   */
  static getFollowCounts() {
    const store = useFollowStore.getState();
    return {
      followers: store.followers.length,
      following: store.following.length,
      pendingRequests: store.receivedRequests.filter(r => r.status === 'pending').length,
      blockedUsers: store.blockedUsers.length,
    };
  }

  /**
   * Check relationship status with a user
   */
  static getRelationshipStatus(userId: string) {
    const store = useFollowStore.getState();
    return {
      isFollowing: store.following.some(f => f.following_id === userId && f.follow_status === 'active'),
      isFollowedBy: store.followers.some(f => f.follower_id === userId && f.follow_status === 'active'),
      isBlocked: store.blockedUsers.some(b => b.blocked_id === userId),
      hasPendingRequest: store.sentRequests.some(r => r.target_id === userId && r.status === 'pending'),
      hasReceivedRequest: store.receivedRequests.some(r => r.requester_id === userId && r.status === 'pending'),
    };
  }

  /**
   * Clear all follow data and cache
   */
  static clearAll() {
    const store = useFollowStore.getState();
    store.resetFollowData();
    store.clearAllCache();
  }

  /**
   * Reset error states
   */
  static resetErrors() {
    const store = useFollowStore.getState();
    store.resetErrors();
  }

  /**
   * Invalidate specific cache types
   */
  static invalidateCache(types?: Array<'followers' | 'following' | 'requests' | 'blocked' | 'stats' | 'suggestions'>) {
    const store = useFollowStore.getState();
    store.invalidateCache(types);
  }
}

/**
 * Follow Constants
 * 
 * Commonly used constants for follow operations
 */
export const FOLLOW_CONSTANTS = {
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Validation limits
  NOTES_MAX_LENGTH: 500,
  MESSAGE_MAX_LENGTH: 500,
  REASON_MAX_LENGTH: 200,
  
  // Rate limiting
  MAX_FOLLOW_REQUESTS_PER_HOUR: 20,
  MAX_BULK_OPERATIONS: 50,
  
  // Cache settings
  FOLLOW_STATUS_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  FOLLOW_LIST_CACHE_TTL: 2 * 60 * 1000, // 2 minutes
  STATS_CACHE_TTL: 10 * 60 * 1000, // 10 minutes
  SUGGESTIONS_CACHE_TTL: 30 * 60 * 1000, // 30 minutes
  
  // Follow categories
  FOLLOW_CATEGORIES: [
    { value: 'close_friend', label: 'Close Friend' },
    { value: 'colleague', label: 'Colleague' },
    { value: 'mentor', label: 'Mentor' },
    { value: 'student', label: 'Student' },
    { value: 'classmate', label: 'Classmate' },
    { value: 'teacher', label: 'Teacher' },
  ],
  
  // Follow statuses
  FOLLOW_STATUSES: [
    { value: 'active', label: 'Following' },
    { value: 'muted', label: 'Muted' },
    { value: 'blocked', label: 'Blocked' },
  ],
  
  // Request statuses
  REQUEST_STATUSES: [
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
} as const;

/**
 * Follow Error Codes
 * 
 * Standardized error codes for follow operations
 */
export const FOLLOW_ERROR_CODES = {
  // Authentication errors
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  INVALID_USER_ID: 'INVALID_USER_ID',
  CANNOT_FOLLOW_SELF: 'CANNOT_FOLLOW_SELF',
  ALREADY_FOLLOWING: 'ALREADY_FOLLOWING',
  NOT_FOLLOWING: 'NOT_FOLLOWING',
  USER_BLOCKED: 'USER_BLOCKED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  
  // Follow request errors
  REQUEST_ALREADY_EXISTS: 'REQUEST_ALREADY_EXISTS',
  REQUEST_NOT_FOUND: 'REQUEST_NOT_FOUND',
  INVALID_REQUEST_STATUS: 'INVALID_REQUEST_STATUS',
  CANNOT_REQUEST_SELF: 'CANNOT_REQUEST_SELF',
  
  // Rate limiting errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  BULK_LIMIT_EXCEEDED: 'BULK_LIMIT_EXCEEDED',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

/**
 * Follow Event Types
 * 
 * Event types for follow-related notifications and webhooks
 */
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