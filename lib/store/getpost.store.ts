/**
 * Get Posts Store
 * 
 * State management store for posts data using the get_posts service
 * Handles loading states, caching, data management, and real-time updates
 * Built with Zustand for optimal performance and TypeScript support
 * 
 * ✅ Reaction subscriptions handled by components via useReactionSubscription
 * ✅ GetPostStore only handles engagement subscriptions (separate concern)
 * ✅ No duplicate subscriptions
 */

import React from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { GetPostService } from '../service/getpost.service';
import type {
  GetPostsParams,
  GetPostsResult,
  EnhancedPost,
  FeedAlgorithmType,
  FeedAnalytics
} from '../service/getpost.service';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 1000; // Maximum number of cached posts

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Error types
export interface FeedError {
  message: string;
  code?: string;
  timestamp: number;
}

// Cache entry interface
interface CacheEntry {
  data: GetPostsResult;
  timestamp: number;
  params: GetPostsParams;
  key: string;
}

// Feed state interface
interface FeedState {
  // Current feed data
  posts: EnhancedPost[];
  hasMore: boolean;
  nextCursor?: string;
  currentAlgorithm: FeedAlgorithmType;
  totalCount?: number;
  
  // Loading states
  loadingState: LoadingState;
  refreshing: boolean;
  loadingMore: boolean;
  
  // Error handling
  error: FeedError | null;
  
  // Cache - stored as array for Immer compatibility
  cacheEntries: CacheEntry[];
  
  // Analytics
  analytics: FeedAnalytics | null;
  analyticsLoading: boolean;
  
  // Filters and preferences
  currentFilters: GetPostsParams;
  searchQuery: string;
  
  // User interactions tracking
  viewedPosts: string[];
  likedPosts: string[];
  savedPosts: string[];
  
  // Real-time updates
  lastUpdateTime: number;
  pendingUpdates: EnhancedPost[];
  
  // Real-time subscriptions (only for engagement, not reactions)
  realtimeSubscriptions: Map<string, () => void>;
  subscribedPostIds: Set<string>;
}

// Store actions interface
interface FeedActions {
  // Core feed operations
  loadFeed: (params?: GetPostsParams) => Promise<void>;
  refreshFeed: () => Promise<void>;
  loadMorePosts: () => Promise<void>;
  clearFeed: () => void;
  
  // Specific feed types
  loadSmartFeed: (params?: Omit<GetPostsParams, 'feed_type'>) => Promise<void>;
  loadFollowingFeed: (params?: Omit<GetPostsParams, 'feed_type'>) => Promise<void>;
  loadTrendingFeed: (params?: Omit<GetPostsParams, 'feed_type'>) => Promise<void>;
  loadRecentFeed: (params?: Omit<GetPostsParams, 'feed_type'>) => Promise<void>;
  loadPopularFeed: (params?: Omit<GetPostsParams, 'feed_type'>) => Promise<void>;
  loadPersonalizedFeed: (params?: Omit<GetPostsParams, 'feed_type'>) => Promise<void>;
  
  // Search and filtering
  searchPosts: (query: string, filters?: Omit<GetPostsParams, 'search_query'>) => Promise<void>;
  applyFilters: (filters: Partial<GetPostsParams>) => Promise<void>;
  clearFilters: () => Promise<void>;
  
  // Location-based feeds
  loadLocationFeed: (latitude: number, longitude: number, radius?: number) => Promise<void>;
  
  // Category and author feeds
  loadCategoryFeed: (category: string) => Promise<void>;
  loadAuthorFeed: (authorId: string) => Promise<void>;
  loadTaggedFeed: (tags: string[]) => Promise<void>;
  
  // User interactions
  markPostViewed: (postId: string) => void;
  togglePostLike: (postId: string) => void;
  togglePostSave: (postId: string) => void;
  incrementPostShareCount: (postId: string) => void;
  recordPostViews: (postIds: string[]) => Promise<void>;
  
  // Real-time subscriptions (only engagement, reactions handled by components)
  subscribeToPostEngagement: (postId: string) => void;
  unsubscribeFromPost: (postId: string) => void;
  unsubscribeAll: () => void;
  handleEngagementUpdate: (payload: any) => void;
  
  // Post operations
  updatePost: (postId: string, updates: Partial<EnhancedPost>) => void;
  deletePost: (postId: string) => Promise<boolean>;
  removePost: (postId: string) => void;
  addPost: (post: EnhancedPost) => void;
  
  // Analytics
  loadAnalytics: (timeRangeHours?: number) => Promise<void>;
  
  // Cache management
  clearCache: () => void;
  getCachedResult: (key: string) => GetPostsResult | null;
  
  // Error handling
  clearError: () => void;
  setError: (error: FeedError) => void;
  
  // Real-time updates
  processRealtimeUpdate: (post: EnhancedPost, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
  applyPendingUpdates: () => void;
}

// Combined store interface
export interface GetPostStore extends FeedState, FeedActions {}

// Cache key generator
function generateCacheKey(params: GetPostsParams): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key as keyof GetPostsParams];
      return result;
    }, {} as any);
  
  return JSON.stringify(sortedParams);
}

// Create the store

// Enable Map and Set support for Immer when using immer middleware in Zustand
enableMapSet();

export const useGetPostStore = create<GetPostStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      posts: [],
      hasMore: true,
      nextCursor: undefined,
      currentAlgorithm: 'smart',
      totalCount: undefined,
      
      loadingState: 'idle',
      refreshing: false,
      loadingMore: false,
      
      error: null,
      
      cacheEntries: [],
      
      analytics: null,
      analyticsLoading: false,
      
      currentFilters: {},
      searchQuery: '',
      
      viewedPosts: [],
      likedPosts: [],
      savedPosts: [],
      
      lastUpdateTime: Date.now(),
      pendingUpdates: [],
      
      // Real-time subscriptions
      realtimeSubscriptions: new Map(),
      subscribedPostIds: new Set(),

      // =================== CORE FEED OPERATIONS ===================

      loadFeed: async (params: GetPostsParams = {}) => {
        const state = get();
        const cacheKey = generateCacheKey(params);
        
        // Prevent duplicate requests for the same parameters
        if (state.loadingState === 'loading' && 
            JSON.stringify(state.currentFilters) === JSON.stringify(params)) {
          return;
        }
        
        // Check cache first
        const cachedResult = state.getCachedResult(cacheKey);
        if (cachedResult) {
          set((draft) => {
            draft.posts = cachedResult.posts;
            draft.hasMore = cachedResult.has_more;
            draft.nextCursor = cachedResult.next_cursor;
            draft.currentAlgorithm = cachedResult.algorithm_used;
            draft.currentFilters = params;
            draft.loadingState = 'success';
            draft.error = null;
          });
          return;
        }

        // Only set loading if we don't have existing posts or it's a significantly different request
        const shouldShowLoading = state.posts.length === 0 || 
          JSON.stringify(state.currentFilters) !== JSON.stringify(params);

        set((draft) => {
          if (shouldShowLoading) {
            draft.loadingState = 'loading';
          }
          draft.error = null;
          draft.currentFilters = params;
        });

        try {
          const result = await GetPostService.getPosts(params);
          
          if (result.success && result.data) {
            const data = result.data as GetPostsResult;
            const { posts, has_more, next_cursor, algorithm_used } = data;
            
            set((draft) => {
              // Update cache
              const newCacheEntry: CacheEntry = {
                data,
                timestamp: Date.now(),
                params,
                key: cacheKey
              };
              
              draft.cacheEntries.push(newCacheEntry);
              
              // Clean cache if too large
              if (draft.cacheEntries.length > MAX_CACHE_SIZE) {
                draft.cacheEntries.shift();
              }

              draft.posts = posts;
              draft.hasMore = has_more;
              draft.nextCursor = next_cursor;
              draft.currentAlgorithm = algorithm_used;
              draft.loadingState = 'success';
              draft.lastUpdateTime = Date.now();
            });

            // Record views for loaded posts
            const postIds = posts.map((p: EnhancedPost) => p.id);
            if (postIds.length > 0) {
              GetPostService.recordPostViews(postIds);
            }

          } else {
            set((draft) => {
              draft.loadingState = 'error';
              draft.error = {
                message: result.error || 'Failed to load posts',
                timestamp: Date.now()
              };
            });
          }
        } catch (error) {
          set((draft) => {
            draft.loadingState = 'error';
            draft.error = {
              message: error instanceof Error ? error.message : 'Unknown error occurred',
              timestamp: Date.now()
            };
          });
        }
      },

      refreshFeed: async () => {
        const state = get();
        
        set((draft) => {
          draft.refreshing = true;
          draft.error = null;
        });

        try {
          // Clear cache
          set((draft) => {
            draft.cacheEntries = [];
          });
          
          await state.loadFeed(state.currentFilters);
        } finally {
          set((draft) => {
            draft.refreshing = false;
          });
        }
      },

      loadMorePosts: async () => {
        const state = get();
        
        if (!state.hasMore || state.loadingMore || state.loadingState === 'loading') {
          return;
        }

        set((draft) => {
          draft.loadingMore = true;
          draft.error = null;
        });

        try {
          const params: GetPostsParams = {
            ...state.currentFilters,
            cursor: state.nextCursor,
            offset: state.posts.length
          };

          const result = await GetPostService.getPosts(params);
          
          if (result.success && result.data) {
            const { posts: newPosts, has_more, next_cursor } = result.data;

            set((draft) => {
              draft.posts.push(...newPosts);
              draft.hasMore = has_more;
              draft.nextCursor = next_cursor;
              draft.loadingMore = false;
            });

            // Record views for new posts
            const postIds = newPosts.map((p: EnhancedPost) => p.id);
            if (postIds.length > 0) {
              GetPostService.recordPostViews(postIds);
            }

          } else {
            set((draft) => {
              draft.loadingMore = false;
              draft.error = {
                message: result.error || 'Failed to load more posts',
                timestamp: Date.now()
              };
            });
          }
        } catch (error) {
          set((draft) => {
            draft.loadingMore = false;
            draft.error = {
              message: error instanceof Error ? error.message : 'Unknown error occurred',
              timestamp: Date.now()
            };
          });
        }
      },

      clearFeed: () => {
        set((draft) => {
          draft.posts = [];
          draft.hasMore = true;
          draft.nextCursor = undefined;
          draft.loadingState = 'idle';
          draft.error = null;
          draft.currentFilters = {};
          draft.searchQuery = '';
        });
      },

      // =================== SPECIFIC FEED TYPES ===================

      loadSmartFeed: async (params = {}) => {
        return get().loadFeed({ ...params, feed_type: 'smart' });
      },

      loadFollowingFeed: async (params = {}) => {
        return get().loadFeed({ ...params, feed_type: 'following' });
      },

      loadTrendingFeed: async (params = {}) => {
        return get().loadFeed({ 
          ...params, 
          feed_type: 'trending',
          time_window_hours: params.time_window_hours || 24
        });
      },

      loadRecentFeed: async (params = {}) => {
        return get().loadFeed({ ...params, feed_type: 'recent' });
      },

      loadPopularFeed: async (params = {}) => {
        return get().loadFeed({ 
          ...params, 
          feed_type: 'popular',
          time_window_hours: params.time_window_hours || 168
        });
      },

      loadPersonalizedFeed: async (params = {}) => {
        return get().loadFeed({ ...params, feed_type: 'personalized' });
      },

      // =================== SEARCH AND FILTERING ===================

      searchPosts: async (query: string, filters = {}) => {
        set((draft) => {
          draft.searchQuery = query;
        });
        
        return get().loadFeed({
          ...filters,
          search_query: query,
          feed_type: 'smart'
        });
      },

      applyFilters: async (filters: Partial<GetPostsParams>) => {
        const currentFilters = get().currentFilters;
        return get().loadFeed({
          ...currentFilters,
          ...filters
        });
      },

      clearFilters: async () => {
        set((draft) => {
          draft.searchQuery = '';
        });
        return get().loadFeed({});
      },

      // =================== LOCATION AND CATEGORY FEEDS ===================

      loadLocationFeed: async (latitude: number, longitude: number, radius = 10) => {
        return get().loadFeed({
          user_coordinates: { latitude, longitude },
          location_radius_km: radius,
          feed_type: 'smart'
        });
      },

      loadCategoryFeed: async (category: string) => {
        return get().loadFeed({
          category,
          feed_type: 'smart'
        });
      },

      loadAuthorFeed: async (authorId: string) => {
        return get().loadFeed({
          author_id: authorId,
          feed_type: 'recent'
        });
      },

      loadTaggedFeed: async (tags: string[]) => {
        return get().loadFeed({
          tags,
          feed_type: 'smart'
        });
      },

      // =================== USER INTERACTIONS ===================

      markPostViewed: (postId: string) => {
        set((draft) => {
          if (!draft.viewedPosts.includes(postId)) {
            draft.viewedPosts.push(postId);
          }
          
          const post = draft.posts.find((p: EnhancedPost) => p.id === postId);
          if (post) {
            post.user_has_viewed = true;
            post.view_count = (post.view_count || 0) + 1;
          }
        });
      },

      togglePostLike: (postId: string) => {
        set((draft) => {
          const post = draft.posts.find((p: EnhancedPost) => p.id === postId);
          if (post) {
            const wasLiked = post.user_has_liked;
            post.user_has_liked = !wasLiked;
            post.like_count = wasLiked 
              ? Math.max(0, (post.like_count || 0) - 1)
              : (post.like_count || 0) + 1;
            
            if (post.user_has_liked) {
              if (!draft.likedPosts.includes(postId)) {
                draft.likedPosts.push(postId);
              }
            } else {
              draft.likedPosts = draft.likedPosts.filter(id => id !== postId);
            }
          }
        });
      },

      togglePostSave: (postId: string) => {
        set((draft) => {
          const post = draft.posts.find((p: EnhancedPost) => p.id === postId);
          if (post) {
            post.user_has_saved = !post.user_has_saved;
            
            if (post.user_has_saved) {
              if (!draft.savedPosts.includes(postId)) {
                draft.savedPosts.push(postId);
              }
            } else {
              draft.savedPosts = draft.savedPosts.filter(id => id !== postId);
            }
          }
        });
      },

      incrementPostShareCount: (postId: string) => {
        set((draft) => {
          const post = draft.posts.find((p: EnhancedPost) => p.id === postId);
          if (post) {
            post.share_count = (post.share_count || 0) + 1;
            post.user_has_shared = true;
          }
        });
      },

      recordPostViews: async (postIds: string[]) => {
        try {
          await GetPostService.recordPostViews(postIds);
          
          set((draft) => {
            postIds.forEach(postId => {
              if (!draft.viewedPosts.includes(postId)) {
                draft.viewedPosts.push(postId);
              }
            });
          });
        } catch (error) {
          console.warn('[GetPostStore] Failed to record post views:', error);
        }
      },

      // =================== POST OPERATIONS ===================

      deletePost: async (postId: string): Promise<boolean> => {
        try {
          // Optimistically remove from UI
          set((draft) => {
            draft.posts = draft.posts.filter((p: EnhancedPost) => p.id !== postId);
          });

          const { PostService } = await import('../service/post.service');
          const result = await PostService.deletePost(postId);
          
          if (!result.success) {
            await get().refreshFeed();
            return false;
          }

          return true;
        } catch (error) {
          await get().refreshFeed();
          return false;
        }
      },

      updatePost: (postId: string, updates: Partial<EnhancedPost>) => {
        set((draft) => {
          const postIndex = draft.posts.findIndex((p: EnhancedPost) => p.id === postId);
          if (postIndex !== -1) {
            Object.assign(draft.posts[postIndex], updates);
          }
        });
      },

      removePost: (postId: string) => {
        set((draft) => {
          draft.posts = draft.posts.filter((p: EnhancedPost) => p.id !== postId);
        });
      },

      addPost: (post: EnhancedPost) => {
        set((draft) => {
          draft.posts.unshift(post);
        });
      },

      // =================== ANALYTICS ===================

      loadAnalytics: async (timeRangeHours = 24) => {
        set((draft) => {
          draft.analyticsLoading = true;
        });

        try {
          const result = await GetPostService.getFeedAnalytics(timeRangeHours);
          
          if (result.success && result.data) {
            set((draft) => {
              draft.analytics = result.data!;
              draft.analyticsLoading = false;
            });
          } else {
            set((draft) => {
              draft.analyticsLoading = false;
              draft.error = {
                message: result.error || 'Failed to load analytics',
                timestamp: Date.now()
              };
            });
          }
        } catch (error) {
          set((draft) => {
            draft.analyticsLoading = false;
            draft.error = {
              message: error instanceof Error ? error.message : 'Unknown error occurred',
              timestamp: Date.now()
            };
          });
        }
      },

      // =================== CACHE MANAGEMENT ===================

      clearCache: () => {
        set((draft) => {
          draft.cacheEntries = [];
        });
      },

      getCachedResult: (key: string): GetPostsResult | null => {
        const state = get();
        const entry = state.cacheEntries.find(e => e.key === key);
        
        if (!entry) return null;
        
        const age = Date.now() - entry.timestamp;
        if (age > CACHE_DURATION) {
          set((draft) => {
            draft.cacheEntries = draft.cacheEntries.filter(e => e.key !== key);
          });
          return null;
        }
        
        return entry.data;
      },

      // =================== ERROR HANDLING ===================

      clearError: () => {
        set((draft) => {
          draft.error = null;
        });
      },

      setError: (error: FeedError) => {
        set((draft) => {
          draft.error = error;
        });
      },

      // =================== REAL-TIME UPDATES ===================

      processRealtimeUpdate: (post: EnhancedPost, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => {
        set((draft) => {
          switch (eventType) {
            case 'INSERT':
              draft.pendingUpdates.push(post);
              break;
            
            case 'UPDATE':
              const updateIndex = draft.posts.findIndex((p: EnhancedPost) => p.id === post.id);
              if (updateIndex !== -1) {
                draft.posts[updateIndex] = post;
              }
              break;
            
            case 'DELETE':
              draft.posts = draft.posts.filter((p: EnhancedPost) => p.id !== post.id);
              break;
          }
        });
      },

      applyPendingUpdates: () => {
        set((draft) => {
          if (draft.pendingUpdates.length > 0) {
            draft.posts.unshift(...draft.pendingUpdates);
            draft.pendingUpdates = [];
          }
        });
      },

      // =================== REAL-TIME SUBSCRIPTIONS ===================
      // ✅ ONLY ENGAGEMENT SUBSCRIPTIONS - Reactions handled by components

      subscribeToPostEngagement: (postId: string) => {
        const state = get();
        const subscriptionKey = `engagement:${postId}`;
        
        if (state.subscribedPostIds.has(subscriptionKey)) {
          console.log(`[GetPostStore] Already subscribed to engagement for post ${postId}`);
          return;
        }

        console.log(`[GetPostStore] 📡 Subscribing to engagement for post ${postId}`);

        try {
          const { PostService } = require('../service/post.service');
          
          if (typeof PostService.subscribeToPostEngagement !== 'function') {
            console.warn('[GetPostStore] PostService.subscribeToPostEngagement not available');
            return;
          }

          const unsubscribe = PostService.subscribeToPostEngagement(postId, (payload: any) => {
            state.handleEngagementUpdate(payload);
          });

          set((draft) => {
            draft.realtimeSubscriptions.set(subscriptionKey, unsubscribe);
            draft.subscribedPostIds.add(subscriptionKey);
          });
        } catch (error) {
          console.error(`[GetPostStore] Error subscribing to engagement for post ${postId}:`, error);
        }
      },

      unsubscribeFromPost: (postId: string) => {
        console.log(`[GetPostStore] 📴 Unsubscribing from engagement for post ${postId}`);
        
        set((draft) => {
          const engagementKey = `engagement:${postId}`;
          const engagementUnsubscribe = draft.realtimeSubscriptions.get(engagementKey);
          
          if (engagementUnsubscribe) {
            try {
              engagementUnsubscribe();
              draft.realtimeSubscriptions.delete(engagementKey);
              draft.subscribedPostIds.delete(engagementKey);
            } catch (error) {
              console.error(`[GetPostStore] Error unsubscribing from ${engagementKey}:`, error);
            }
          }
        });
      },

      unsubscribeAll: () => {
        const state = get();
        const count = state.realtimeSubscriptions.size;
        
        if (count === 0) {
          console.log('[GetPostStore] No subscriptions to clean up');
          return;
        }
        
        console.log(`[GetPostStore] 📴 Unsubscribing from all (${count} subscriptions)`);
        
        set((draft) => {
          draft.realtimeSubscriptions.forEach((unsubscribe, key) => {
            console.log(`[GetPostStore] Unsubscribing from ${key}`);
            try {
              unsubscribe();
            } catch (error) {
              console.error(`[GetPostStore] Error unsubscribing from ${key}:`, error);
            }
          });
          
          draft.realtimeSubscriptions.clear();
          draft.subscribedPostIds.clear();
        });
      },

      handleEngagementUpdate: (payload: any) => {
        console.log('[GetPostStore] 📨 Handling engagement update:', payload);
        
        set((draft) => {
          const { new: newData } = payload;
          
          if (newData && newData.id) {
            const postIndex = draft.posts.findIndex((p: EnhancedPost) => p.id === newData.id);
            
            if (postIndex !== -1) {
              const existingPost = draft.posts[postIndex];
              draft.posts[postIndex] = {
                ...existingPost,
                like_count: newData.like_count ?? existingPost.like_count,
                comment_count: newData.comment_count ?? existingPost.comment_count,
                share_count: newData.share_count ?? existingPost.share_count,
                view_count: newData.view_count ?? existingPost.view_count,
                engagement_score: newData.engagement_score ?? existingPost.engagement_score,
                last_activity_at: newData.last_activity_at ?? existingPost.last_activity_at,
              };
              
              draft.lastUpdateTime = Date.now();
              
              console.log(`[GetPostStore] ✅ Updated engagement for post ${newData.id}`);
            } else {
              console.debug(`[GetPostStore] Post ${newData.id} not found in current feed`);
            }
          }
        });
      }
    }))
  )
);

// =================== HELPER HOOKS ===================

/**
 * Hook for getting posts with specific filters
 */
export const useGetPosts = (params?: GetPostsParams) => {
  const store = useGetPostStore();
  
  React.useEffect(() => {
    store.loadFeed(params);
  }, [JSON.stringify(params)]);
  
  return {
    posts: store.posts,
    loading: store.loadingState === 'loading',
    error: store.error,
    hasMore: store.hasMore,
    loadMore: store.loadMorePosts,
    refresh: store.refreshFeed
  };
};

/**
 * Hook for search functionality
 */
export const usePostSearch = () => {
  const store = useGetPostStore();
  
  return {
    searchQuery: store.searchQuery,
    searchPosts: store.searchPosts,
    clearSearch: () => store.searchPosts(''),
    loading: store.loadingState === 'loading',
    posts: store.posts,
    error: store.error
  };
};

/**
 * Hook for feed analytics
 */
export const useFeedAnalytics = (timeRangeHours = 24) => {
  const store = useGetPostStore();
  
  React.useEffect(() => {
    store.loadAnalytics(timeRangeHours);
  }, [timeRangeHours]);
  
  return {
    analytics: store.analytics,
    loading: store.analyticsLoading,
    error: store.error
  };
};

/**
 * Hook for user interactions
 */
export const usePostInteractions = () => {
  const store = useGetPostStore();
  
  return {
    markViewed: store.markPostViewed,
    toggleLike: store.togglePostLike,
    toggleSave: store.togglePostSave,
    incrementShareCount: store.incrementPostShareCount,
    viewedPosts: store.viewedPosts,
    likedPosts: store.likedPosts,
    savedPosts: store.savedPosts
  };
};

/**
 * Hook for real-time engagement (NOT reactions)
 * Reactions are handled by components via useReactionSubscription
 * Optimized to prevent unnecessary re-subscriptions
 */
export const useRealtimePosts = (autoSubscribe = true) => {
  const store = useGetPostStore();
  const isSubscribedRef = React.useRef(false);
  const postsLengthRef = React.useRef(store.posts.length);
  const unsubscribeRef = React.useRef<(() => void) | null>(null);
  
  // Debounced effect to prevent too many subscription updates
  React.useEffect(() => {
    postsLengthRef.current = store.posts.length;
    
    // Only subscribe once when posts are first loaded
    if (autoSubscribe && store.posts.length > 0 && !isSubscribedRef.current) {
      isSubscribedRef.current = true;
      
      const currentPostIds = store.posts.map(p => p.id);
      
      // Optional: Subscribe to feed-wide engagement if you have that feature
      try {
        const { PostService } = require('../service/post.service');
        
        if (typeof PostService.subscribeToMultiplePostsEngagement === 'function') {
          const unsubscribe = PostService.subscribeToMultiplePostsEngagement(
            currentPostIds,
            (payload: any) => {
              store.handleEngagementUpdate(payload);
            }
          );

          unsubscribeRef.current = unsubscribe;
        }
      } catch (error) {
        console.debug('[useRealtimePosts] Engagement subscription not available:', error);
      }
    }
    
    // Cleanup function for unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [autoSubscribe]); // Only depend on autoSubscribe, not posts.length
  
  return {
    subscribeToEngagement: store.subscribeToPostEngagement,
    unsubscribeFromPost: store.unsubscribeFromPost,
    unsubscribeAll: store.unsubscribeAll,
    lastUpdateTime: store.lastUpdateTime
  };
};

// Default export
export default useGetPostStore;
