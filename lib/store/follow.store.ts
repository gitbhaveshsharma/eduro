/**
 * Follow Store
 * 
 * Zustand store for managing follow system state with caching,
 * optimistic updates, and comprehensive follow relationship management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { FollowService } from '../service/follow.service';
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
  BulkFollowRequest,
  BulkUnfollowRequest,
  BulkFollowResult,
  FollowSuggestionsResult,
  FollowActivity,
  FollowActivityResult,
  FollowNetworkAnalysis
} from '../schema/follow.types';

// Store state interface
interface FollowState {
  // Current user's follow data
  followers: FollowRelationshipWithProfile[];
  following: FollowRelationshipWithProfile[];
  receivedRequests: FollowRequestWithProfile[];
  sentRequests: FollowRequestWithProfile[];
  blockedUsers: BlockedUserWithProfile[];

  // Statistics
  stats: FollowStats | null;

  // Suggestions and recommendations
  suggestions: FollowSuggestionsResult | null;

  // Search results
  followerSearchResults: FollowSearchResult | null;
  followingSearchResults: FollowSearchResult | null;
  requestSearchResults: FollowRequestSearchResult | null;
  blockedSearchResults: BlockedUserSearchResult | null;

  // Loading states
  followersLoading: boolean;
  followingLoading: boolean;
  requestsLoading: boolean;
  blockedLoading: boolean;
  statsLoading: boolean;
  suggestionsLoading: boolean;

  // Operation states
  followLoading: Record<string, boolean>; // userId -> loading state
  unfollowLoading: Record<string, boolean>;
  blockLoading: Record<string, boolean>;
  unblockLoading: Record<string, boolean>;
  requestLoading: Record<string, boolean>;

  // Error states
  followersError: string | null;
  followingError: string | null;
  requestsError: string | null;
  blockedError: string | null;
  statsError: string | null;
  suggestionsError: string | null;

  // Cache for follow status checks
  followStatusCache: Record<string, FollowStatusCheck>;
  followStatusCacheTimestamps: Record<string, number>;

  // Last update timestamps
  lastFollowersUpdate: number | null;
  lastFollowingUpdate: number | null;
  lastRequestsUpdate: number | null;
  lastBlockedUpdate: number | null;
  lastStatsUpdate: number | null;
  lastSuggestionsUpdate: number | null;

  // Pagination state
  followersPagination: { page: number; hasMore: boolean };
  followingPagination: { page: number; hasMore: boolean };
  requestsPagination: { page: number; hasMore: boolean };
  blockedPagination: { page: number; hasMore: boolean };
}

// Store actions interface
interface FollowActions {
  // Follow relationship actions
  followUser: (request: FollowUserRequest) => Promise<boolean>;
  unfollowUser: (request: UnfollowUserRequest) => Promise<boolean>;
  updateFollowRelationship: (request: UpdateFollowRequest) => Promise<boolean>;

  // Follow request actions
  sendFollowRequest: (request: SendFollowRequestData) => Promise<boolean>;
  respondToFollowRequest: (request: RespondToFollowRequestData) => Promise<boolean>;
  cancelFollowRequest: (targetId: string) => Promise<boolean>;

  // Blocking actions
  blockUser: (request: BlockUserRequest) => Promise<boolean>;
  unblockUser: (request: UnblockUserRequest) => Promise<boolean>;

  // Data loading actions
  loadFollowers: (userId?: string, filters?: FollowFilters, sort?: FollowSort, page?: number, refresh?: boolean) => Promise<void>;
  loadFollowing: (userId?: string, filters?: FollowFilters, sort?: FollowSort, page?: number, refresh?: boolean) => Promise<void>;
  loadReceivedRequests: (filters?: FollowRequestFilters, sort?: FollowRequestSort, page?: number, refresh?: boolean) => Promise<void>;
  loadSentRequests: (filters?: FollowRequestFilters, sort?: FollowRequestSort, page?: number, refresh?: boolean) => Promise<void>;
  loadBlockedUsers: (filters?: BlockedUserFilters, page?: number, refresh?: boolean) => Promise<void>;
  loadStats: (userId?: string, refresh?: boolean) => Promise<void>;
  loadSuggestions: (limit?: number, refresh?: boolean) => Promise<void>;

  // Status and utility actions
  getFollowStatus: (targetUserId: string, useCache?: boolean) => Promise<FollowStatusCheck | null>;
  refreshFollowStatus: (targetUserId: string) => Promise<FollowStatusCheck | null>;

  // Bulk operations
  bulkFollowUsers: (request: BulkFollowRequest) => Promise<BulkFollowResult | null>;
  bulkUnfollowUsers: (request: BulkUnfollowRequest) => Promise<BulkFollowResult | null>;

  // Cache management
  clearFollowStatusCache: () => void;
  clearAllCache: () => void;
  invalidateCache: (types?: Array<'followers' | 'following' | 'requests' | 'blocked' | 'stats' | 'suggestions'>) => void;

  // Reset actions
  resetFollowData: () => void;
  resetErrors: () => void;
}

// Combined store type
type FollowStore = FollowState & FollowActions;

// Cache TTL constants (in milliseconds)
const CACHE_TTL = {
  FOLLOW_STATUS: 5 * 60 * 1000, // 5 minutes
  FOLLOW_LISTS: 2 * 60 * 1000, // 2 minutes
  STATS: 10 * 60 * 1000, // 10 minutes
  SUGGESTIONS: 30 * 60 * 1000, // 30 minutes
} as const;

// Initial state
const initialState: FollowState = {
  // Data
  followers: [],
  following: [],
  receivedRequests: [],
  sentRequests: [],
  blockedUsers: [],
  stats: null,
  suggestions: null,

  // Search results
  followerSearchResults: null,
  followingSearchResults: null,
  requestSearchResults: null,
  blockedSearchResults: null,

  // Loading states
  followersLoading: false,
  followingLoading: false,
  requestsLoading: false,
  blockedLoading: false,
  statsLoading: false,
  suggestionsLoading: false,

  // Operation states
  followLoading: {},
  unfollowLoading: {},
  blockLoading: {},
  unblockLoading: {},
  requestLoading: {},

  // Error states
  followersError: null,
  followingError: null,
  requestsError: null,
  blockedError: null,
  statsError: null,
  suggestionsError: null,

  // Cache
  followStatusCache: {},
  followStatusCacheTimestamps: {},

  // Timestamps
  lastFollowersUpdate: null,
  lastFollowingUpdate: null,
  lastRequestsUpdate: null,
  lastBlockedUpdate: null,
  lastStatsUpdate: null,
  lastSuggestionsUpdate: null,

  // Pagination
  followersPagination: { page: 1, hasMore: true },
  followingPagination: { page: 1, hasMore: true },
  requestsPagination: { page: 1, hasMore: true },
  blockedPagination: { page: 1, hasMore: true },
};

export const useFollowStore = create<FollowStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // =====================================
      // FOLLOW RELATIONSHIP ACTIONS
      // =====================================

      followUser: async (request: FollowUserRequest): Promise<boolean> => {
        const { followLoading } = get();

        if (followLoading[request.following_id]) {
          return false;
        }

        // Set loading state
        set(state => ({
          followLoading: { ...state.followLoading, [request.following_id]: true }
        }));

        try {
          // Optimistic update - add to following list
          const optimisticFollow: FollowRelationshipWithProfile = {
            id: `temp-${Date.now()}`,
            follower_id: 'current-user', // Will be replaced by real data
            following_id: request.following_id,
            follow_status: 'active',
            notification_enabled: request.notification_enabled ?? true,
            follow_category: request.follow_category || null,
            notes: request.notes || null,
            is_mutual: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          set(state => ({
            following: [optimisticFollow, ...state.following],
          }));

          const result = await FollowService.followUser(request);

          if (result.success && result.data) {
            // Replace optimistic update with real data
            set(state => ({
              following: state.following.map(f =>
                f.id === optimisticFollow.id ? result.data! : f
              ),
              followLoading: { ...state.followLoading, [request.following_id]: false }
            }));

            // Invalidate related cache
            get().clearFollowStatusCache();

            return true;
          } else {
            // Revert optimistic update
            set(state => ({
              following: state.following.filter(f => f.id !== optimisticFollow.id),
              followLoading: { ...state.followLoading, [request.following_id]: false }
            }));

            return false;
          }
        } catch (error) {
          // Revert optimistic update
          set(state => ({
            following: state.following.filter(f => f.id.startsWith('temp-')),
            followLoading: { ...state.followLoading, [request.following_id]: false }
          }));

          return false;
        }
      },

      unfollowUser: async (request: UnfollowUserRequest): Promise<boolean> => {
        const { unfollowLoading } = get();

        if (unfollowLoading[request.following_id]) {
          return false;
        }

        // Set loading state
        set(state => ({
          unfollowLoading: { ...state.unfollowLoading, [request.following_id]: true }
        }));

        try {
          // Store original state for potential revert
          const originalFollowing = get().following;

          // Optimistic update - remove from following list
          set(state => ({
            following: state.following.filter(f => f.following_id !== request.following_id)
          }));

          const result = await FollowService.unfollowUser(request);

          if (result.success) {
            set(state => ({
              unfollowLoading: { ...state.unfollowLoading, [request.following_id]: false }
            }));

            // Invalidate related cache
            get().clearFollowStatusCache();

            return true;
          } else {
            // Revert optimistic update
            set(state => ({
              following: originalFollowing,
              unfollowLoading: { ...state.unfollowLoading, [request.following_id]: false }
            }));

            return false;
          }
        } catch (error) {
          // Revert optimistic update - get original state again
          const originalFollowing = get().following;
          set(state => ({
            following: originalFollowing,
            unfollowLoading: { ...state.unfollowLoading, [request.following_id]: false }
          }));

          return false;
        }
      },

      updateFollowRelationship: async (request: UpdateFollowRequest): Promise<boolean> => {
        try {
          const result = await FollowService.updateFollowRelationship(request);

          if (result.success && result.data) {
            // Update in following list
            set(state => ({
              following: state.following.map(f =>
                f.following_id === request.following_id
                  ? { ...f, ...result.data }
                  : f
              )
            }));

            // Invalidate cache
            get().clearFollowStatusCache();

            return true;
          }

          return false;
        } catch (error) {
          return false;
        }
      },

      // =====================================
      // FOLLOW REQUEST ACTIONS
      // =====================================

      sendFollowRequest: async (request: SendFollowRequestData): Promise<boolean> => {
        const { requestLoading } = get();

        if (requestLoading[request.target_id]) {
          return false;
        }

        set(state => ({
          requestLoading: { ...state.requestLoading, [request.target_id]: true }
        }));

        try {
          const result = await FollowService.sendFollowRequest(request);

          if (result.success && result.data) {
            // Add to sent requests
            set(state => ({
              sentRequests: [result.data!, ...state.sentRequests],
              requestLoading: { ...state.requestLoading, [request.target_id]: false }
            }));

            return true;
          } else {
            set(state => ({
              requestLoading: { ...state.requestLoading, [request.target_id]: false }
            }));

            return false;
          }
        } catch (error) {
          set(state => ({
            requestLoading: { ...state.requestLoading, [request.target_id]: false }
          }));

          return false;
        }
      },

      respondToFollowRequest: async (request: RespondToFollowRequestData): Promise<boolean> => {
        try {
          const result = await FollowService.respondToFollowRequest(request);

          if (result.success) {
            // Remove from received requests
            set(state => ({
              receivedRequests: state.receivedRequests.filter(r => r.id !== request.request_id)
            }));

            // If accepted, refresh followers list
            if (request.status === 'accepted') {
              get().loadFollowers(undefined, undefined, undefined, 1, true);
            }

            return true;
          }

          return false;
        } catch (error) {
          return false;
        }
      },

      cancelFollowRequest: async (targetId: string): Promise<boolean> => {
        try {
          const result = await FollowService.cancelFollowRequest(targetId);

          if (result.success) {
            // Remove from sent requests
            set(state => ({
              sentRequests: state.sentRequests.filter(r => r.target_id !== targetId)
            }));

            return true;
          }

          return false;
        } catch (error) {
          return false;
        }
      },

      // =====================================
      // BLOCKING ACTIONS
      // =====================================

      blockUser: async (request: BlockUserRequest): Promise<boolean> => {
        const { blockLoading } = get();

        if (blockLoading[request.blocked_id]) {
          return false;
        }

        set(state => ({
          blockLoading: { ...state.blockLoading, [request.blocked_id]: true }
        }));

        try {
          const result = await FollowService.blockUser(request);

          if (result.success && result.data) {
            set(state => ({
              blockedUsers: [result.data!, ...state.blockedUsers],
              // Remove from following and followers
              following: state.following.filter(f => f.following_id !== request.blocked_id),
              followers: state.followers.filter(f => f.follower_id !== request.blocked_id),
              blockLoading: { ...state.blockLoading, [request.blocked_id]: false }
            }));

            // Invalidate cache
            get().clearFollowStatusCache();

            return true;
          } else {
            set(state => ({
              blockLoading: { ...state.blockLoading, [request.blocked_id]: false }
            }));

            return false;
          }
        } catch (error) {
          set(state => ({
            blockLoading: { ...state.blockLoading, [request.blocked_id]: false }
          }));

          return false;
        }
      },

      unblockUser: async (request: UnblockUserRequest): Promise<boolean> => {
        const { unblockLoading } = get();

        if (unblockLoading[request.blocked_id]) {
          return false;
        }

        set(state => ({
          unblockLoading: { ...state.unblockLoading, [request.blocked_id]: true }
        }));

        try {
          const result = await FollowService.unblockUser(request);

          if (result.success) {
            set(state => ({
              blockedUsers: state.blockedUsers.filter(b => b.blocked_id !== request.blocked_id),
              unblockLoading: { ...state.unblockLoading, [request.blocked_id]: false }
            }));

            // Invalidate cache
            get().clearFollowStatusCache();

            return true;
          } else {
            set(state => ({
              unblockLoading: { ...state.unblockLoading, [request.blocked_id]: false }
            }));

            return false;
          }
        } catch (error) {
          set(state => ({
            unblockLoading: { ...state.unblockLoading, [request.blocked_id]: false }
          }));

          return false;
        }
      },

      // =====================================
      // DATA LOADING ACTIONS
      // =====================================

      loadFollowers: async (
        userId?: string,
        filters?: FollowFilters,
        sort?: FollowSort,
        page: number = 1,
        refresh: boolean = false
      ): Promise<void> => {
        const { followersLoading, lastFollowersUpdate } = get();

        // Check if we need to refresh
        const shouldRefresh = refresh ||
          !lastFollowersUpdate ||
          (Date.now() - lastFollowersUpdate > CACHE_TTL.FOLLOW_LISTS);

        if (followersLoading || (!shouldRefresh && page === 1)) {
          return;
        }

        set({ followersLoading: true, followersError: null });

        try {
          const result = await FollowService.getFollowers(userId, filters, sort, page, 20);

          if (result.success && result.data) {
            set(state => ({
              followers: page === 1 ? result.data!.follows : [...state.followers, ...result.data!.follows],
              followerSearchResults: result.data!,
              followersPagination: {
                page: result.data!.page,
                hasMore: result.data!.has_more
              },
              followersLoading: false,
              lastFollowersUpdate: Date.now()
            }));
          } else {
            set({
              followersLoading: false,
              followersError: result.error || 'Failed to load followers'
            });
          }
        } catch (error) {
          set({
            followersLoading: false,
            followersError: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      },

      loadFollowing: async (
        userId?: string,
        filters?: FollowFilters,
        sort?: FollowSort,
        page: number = 1,
        refresh: boolean = false
      ): Promise<void> => {
        const { followingLoading, lastFollowingUpdate } = get();

        const shouldRefresh = refresh ||
          !lastFollowingUpdate ||
          (Date.now() - lastFollowingUpdate > CACHE_TTL.FOLLOW_LISTS);

        if (followingLoading || (!shouldRefresh && page === 1)) {
          return;
        }

        set({ followingLoading: true, followingError: null });

        try {
          const result = await FollowService.getFollowing(userId, filters, sort, page, 20);

          if (result.success && result.data) {
            set(state => ({
              following: page === 1 ? result.data!.follows : [...state.following, ...result.data!.follows],
              followingSearchResults: result.data!,
              followingPagination: {
                page: result.data!.page,
                hasMore: result.data!.has_more
              },
              followingLoading: false,
              lastFollowingUpdate: Date.now()
            }));
          } else {
            set({
              followingLoading: false,
              followingError: result.error || 'Failed to load following'
            });
          }
        } catch (error) {
          set({
            followingLoading: false,
            followingError: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      },

      loadReceivedRequests: async (
        filters?: FollowRequestFilters,
        sort?: FollowRequestSort,
        page: number = 1,
        refresh: boolean = false
      ): Promise<void> => {
        const { requestsLoading, lastRequestsUpdate } = get();

        const shouldRefresh = refresh ||
          !lastRequestsUpdate ||
          (Date.now() - lastRequestsUpdate > CACHE_TTL.FOLLOW_LISTS);

        if (requestsLoading || (!shouldRefresh && page === 1)) {
          return;
        }

        set({ requestsLoading: true, requestsError: null });

        try {
          const result = await FollowService.getReceivedFollowRequests(filters, sort, page, 20);

          if (result.success && result.data) {
            set(state => ({
              receivedRequests: page === 1 ? result.data!.requests : [...state.receivedRequests, ...result.data!.requests],
              requestSearchResults: result.data!,
              requestsPagination: {
                page: result.data!.page,
                hasMore: result.data!.has_more
              },
              requestsLoading: false,
              lastRequestsUpdate: Date.now()
            }));
          } else {
            set({
              requestsLoading: false,
              requestsError: result.error || 'Failed to load requests'
            });
          }
        } catch (error) {
          set({
            requestsLoading: false,
            requestsError: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      },

      loadSentRequests: async (
        filters?: FollowRequestFilters,
        sort?: FollowRequestSort,
        page: number = 1,
        refresh: boolean = false
      ): Promise<void> => {
        const { requestsLoading } = get();

        if (requestsLoading) {
          return;
        }

        set({ requestsLoading: true, requestsError: null });

        try {
          const result = await FollowService.getSentFollowRequests(filters, sort, page, 20);

          if (result.success && result.data) {
            set(state => ({
              sentRequests: page === 1 ? result.data!.requests : [...state.sentRequests, ...result.data!.requests],
              requestsLoading: false
            }));
          } else {
            set({
              requestsLoading: false,
              requestsError: result.error || 'Failed to load sent requests'
            });
          }
        } catch (error) {
          set({
            requestsLoading: false,
            requestsError: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      },

      loadBlockedUsers: async (
        filters?: BlockedUserFilters,
        page: number = 1,
        refresh: boolean = false
      ): Promise<void> => {
        const { blockedLoading, lastBlockedUpdate } = get();

        const shouldRefresh = refresh ||
          !lastBlockedUpdate ||
          (Date.now() - lastBlockedUpdate > CACHE_TTL.FOLLOW_LISTS);

        if (blockedLoading || (!shouldRefresh && page === 1)) {
          return;
        }

        set({ blockedLoading: true, blockedError: null });

        try {
          const result = await FollowService.getBlockedUsers(filters, page, 20);

          if (result.success && result.data) {
            set(state => ({
              blockedUsers: page === 1 ? result.data!.blocked_users : [...state.blockedUsers, ...result.data!.blocked_users],
              blockedSearchResults: result.data!,
              blockedPagination: {
                page: result.data!.page,
                hasMore: result.data!.has_more
              },
              blockedLoading: false,
              lastBlockedUpdate: Date.now()
            }));
          } else {
            set({
              blockedLoading: false,
              blockedError: result.error || 'Failed to load blocked users'
            });
          }
        } catch (error) {
          set({
            blockedLoading: false,
            blockedError: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      },

      loadStats: async (userId?: string, refresh: boolean = false): Promise<void> => {
        const { statsLoading, lastStatsUpdate } = get();

        const shouldRefresh = refresh ||
          !lastStatsUpdate ||
          (Date.now() - lastStatsUpdate > CACHE_TTL.STATS);

        if (statsLoading || !shouldRefresh) {
          return;
        }

        set({ statsLoading: true, statsError: null });

        try {
          const result = await FollowService.getFollowStats(userId);

          if (result.success && result.data) {
            set({
              stats: result.data,
              statsLoading: false,
              lastStatsUpdate: Date.now()
            });
          } else {
            set({
              statsLoading: false,
              statsError: result.error || 'Failed to load stats'
            });
          }
        } catch (error) {
          set({
            statsLoading: false,
            statsError: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      },

      loadSuggestions: async (limit: number = 10, refresh: boolean = false): Promise<void> => {
        const { suggestionsLoading, lastSuggestionsUpdate } = get();

        const shouldRefresh = refresh ||
          !lastSuggestionsUpdate ||
          (Date.now() - lastSuggestionsUpdate > CACHE_TTL.SUGGESTIONS);

        if (suggestionsLoading || !shouldRefresh) {
          return;
        }

        set({ suggestionsLoading: true, suggestionsError: null });

        try {
          const result = await FollowService.getFollowSuggestions(limit);

          if (result.success && result.data) {
            set({
              suggestions: result.data,
              suggestionsLoading: false,
              lastSuggestionsUpdate: Date.now()
            });
          } else {
            set({
              suggestionsLoading: false,
              suggestionsError: result.error || 'Failed to load suggestions'
            });
          }
        } catch (error) {
          set({
            suggestionsLoading: false,
            suggestionsError: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      },

      // =====================================
      // STATUS AND UTILITY ACTIONS
      // =====================================

      getFollowStatus: async (targetUserId: string, useCache: boolean = true): Promise<FollowStatusCheck | null> => {
        const { followStatusCache, followStatusCacheTimestamps } = get();

        // Check cache first
        if (useCache && followStatusCache[targetUserId]) {
          const timestamp = followStatusCacheTimestamps[targetUserId];
          if (timestamp && (Date.now() - timestamp < CACHE_TTL.FOLLOW_STATUS)) {
            return followStatusCache[targetUserId];
          }
        }

        try {
          const result = await FollowService.getFollowStatus(targetUserId);

          if (result.success && result.data) {
            // Update cache
            set(state => ({
              followStatusCache: {
                ...state.followStatusCache,
                [targetUserId]: result.data!
              },
              followStatusCacheTimestamps: {
                ...state.followStatusCacheTimestamps,
                [targetUserId]: Date.now()
              }
            }));

            return result.data;
          }

          return null;
        } catch (error) {
          return null;
        }
      },

      refreshFollowStatus: async (targetUserId: string): Promise<FollowStatusCheck | null> => {
        return get().getFollowStatus(targetUserId, false);
      },

      // =====================================
      // BULK OPERATIONS
      // =====================================

      bulkFollowUsers: async (request: BulkFollowRequest): Promise<BulkFollowResult | null> => {
        try {
          const result = await FollowService.bulkFollowUsers(request);

          if (result.success && result.data) {
            // Refresh following list to show new follows
            get().loadFollowing(undefined, undefined, undefined, 1, true);
            get().clearFollowStatusCache();

            return result.data;
          }

          return null;
        } catch (error) {
          return null;
        }
      },

      bulkUnfollowUsers: async (request: BulkUnfollowRequest): Promise<BulkFollowResult | null> => {
        try {
          const result = await FollowService.bulkUnfollowUsers(request);

          if (result.success && result.data) {
            // Refresh following list to show removed follows
            get().loadFollowing(undefined, undefined, undefined, 1, true);
            get().clearFollowStatusCache();

            return result.data;
          }

          return null;
        } catch (error) {
          return null;
        }
      },

      // =====================================
      // CACHE MANAGEMENT
      // =====================================

      clearFollowStatusCache: () => {
        set({
          followStatusCache: {},
          followStatusCacheTimestamps: {}
        });
      },

      clearAllCache: () => {
        set({
          followStatusCache: {},
          followStatusCacheTimestamps: {},
          lastFollowersUpdate: null,
          lastFollowingUpdate: null,
          lastRequestsUpdate: null,
          lastBlockedUpdate: null,
          lastStatsUpdate: null,
          lastSuggestionsUpdate: null
        });
      },

      invalidateCache: (types?: Array<'followers' | 'following' | 'requests' | 'blocked' | 'stats' | 'suggestions'>) => {
        if (!types) {
          get().clearAllCache();
          return;
        }

        const updates: Partial<FollowState> = {};

        if (types.includes('followers')) updates.lastFollowersUpdate = null;
        if (types.includes('following')) updates.lastFollowingUpdate = null;
        if (types.includes('requests')) updates.lastRequestsUpdate = null;
        if (types.includes('blocked')) updates.lastBlockedUpdate = null;
        if (types.includes('stats')) updates.lastStatsUpdate = null;
        if (types.includes('suggestions')) updates.lastSuggestionsUpdate = null;

        set(updates);
      },

      // =====================================
      // RESET ACTIONS
      // =====================================

      resetFollowData: () => {
        set({
          followers: [],
          following: [],
          receivedRequests: [],
          sentRequests: [],
          blockedUsers: [],
          stats: null,
          suggestions: null,
          followerSearchResults: null,
          followingSearchResults: null,
          requestSearchResults: null,
          blockedSearchResults: null,
          followersPagination: { page: 1, hasMore: true },
          followingPagination: { page: 1, hasMore: true },
          requestsPagination: { page: 1, hasMore: true },
          blockedPagination: { page: 1, hasMore: true },
        });

        get().clearAllCache();
      },

      resetErrors: () => {
        set({
          followersError: null,
          followingError: null,
          requestsError: null,
          blockedError: null,
          statsError: null,
          suggestionsError: null
        });
      },
    }),
    {
      name: 'follow-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist essential UI state, not large data sets
      partialize: (state) => ({
        followersPagination: state.followersPagination,
        followingPagination: state.followingPagination,
        requestsPagination: state.requestsPagination,
        blockedPagination: state.blockedPagination,
      }),
    }
  )
);

// =====================================
// SELECTOR HOOKS
// =====================================

// Follow data selectors
export const useFollowers = () => useFollowStore(state => state.followers);
export const useFollowing = () => useFollowStore(state => state.following);
export const useReceivedRequests = () => useFollowStore(state => state.receivedRequests);
export const useSentRequests = () => useFollowStore(state => state.sentRequests);
export const useBlockedUsers = () => useFollowStore(state => state.blockedUsers);
export const useFollowStats = () => useFollowStore(state => state.stats);
export const useFollowSuggestions = () => useFollowStore(state => state.suggestions);

// Loading state selectors
export const useFollowersLoading = () => useFollowStore(state => state.followersLoading);
export const useFollowingLoading = () => useFollowStore(state => state.followingLoading);
export const useRequestsLoading = () => useFollowStore(state => state.requestsLoading);
export const useBlockedLoading = () => useFollowStore(state => state.blockedLoading);
export const useStatsLoading = () => useFollowStore(state => state.statsLoading);
export const useSuggestionsLoading = () => useFollowStore(state => state.suggestionsLoading);

// Operation loading selectors
export const useFollowLoading = (userId: string) => useFollowStore(state => state.followLoading[userId] || false);
export const useUnfollowLoading = (userId: string) => useFollowStore(state => state.unfollowLoading[userId] || false);
export const useBlockLoading = (userId: string) => useFollowStore(state => state.blockLoading[userId] || false);
export const useUnblockLoading = (userId: string) => useFollowStore(state => state.unblockLoading[userId] || false);
export const useRequestLoading = (userId: string) => useFollowStore(state => state.requestLoading[userId] || false);

// Error state selectors
export const useFollowersError = () => useFollowStore(state => state.followersError);
export const useFollowingError = () => useFollowStore(state => state.followingError);
export const useRequestsError = () => useFollowStore(state => state.requestsError);
export const useBlockedError = () => useFollowStore(state => state.blockedError);
export const useStatsError = () => useFollowStore(state => state.statsError);
export const useSuggestionsError = () => useFollowStore(state => state.suggestionsError);

// Search results selectors
export const useFollowerSearchResults = () => useFollowStore(state => state.followerSearchResults);
export const useFollowingSearchResults = () => useFollowStore(state => state.followingSearchResults);
export const useRequestSearchResults = () => useFollowStore(state => state.requestSearchResults);
export const useBlockedSearchResults = () => useFollowStore(state => state.blockedSearchResults);

// Pagination selectors
export const useFollowersPagination = () => useFollowStore(state => state.followersPagination);
export const useFollowingPagination = () => useFollowStore(state => state.followingPagination);
export const useRequestsPagination = () => useFollowStore(state => state.requestsPagination);
export const useBlockedPagination = () => useFollowStore(state => state.blockedPagination);

// Cache selectors
export const useFollowStatusFromCache = (userId: string) =>
  useFollowStore(state => state.followStatusCache[userId]);

// Derived data selectors
export const useFollowCounts = () =>
  useFollowStore(
    useShallow(state => ({
      followers: state.followers.length,
      following: state.following.length,
      pendingRequests: state.receivedRequests.filter(r => r.status === 'pending').length,
      blockedUsers: state.blockedUsers.length
    }))
  );

export const useMutualFollows = () =>
  useFollowStore(
    useShallow(state => state.following.filter(f => f.is_mutual))
  );

export const usePendingRequests = () =>
  useFollowStore(
    useShallow(state => state.receivedRequests.filter(r => r.status === 'pending'))
  );

// Helper hooks
export const useIsFollowing = (userId: string) =>
  useFollowStore(state => state.following.some(f => f.following_id === userId && f.follow_status === 'active'));

export const useIsFollowedBy = (userId: string) =>
  useFollowStore(state => state.followers.some(f => f.follower_id === userId && f.follow_status === 'active'));

export const useIsBlocked = (userId: string) =>
  useFollowStore(state => state.blockedUsers.some(b => b.blocked_id === userId));

export const useHasPendingRequest = (userId: string) =>
  useFollowStore(state => state.sentRequests.some(r => r.target_id === userId && r.status === 'pending'));

export const useHasReceivedRequest = (userId: string) =>
  useFollowStore(state => state.receivedRequests.some(r => r.requester_id === userId && r.status === 'pending'));