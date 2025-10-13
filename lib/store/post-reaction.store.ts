/**
 * Post Reaction Store
 * 
 * Zustand store for managing real-time post and comment reactions
 * Handles WebSocket subscriptions, caching, and UI state synchronization
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { PostReactionService, type UserReaction, type ReactionUpdate } from '../service/post-reaction.service';

// Enable Map and Set support for Immer
enableMapSet();

// Cache entry for user reactions
interface ReactionCacheEntry {
  targetType: 'POST' | 'COMMENT';
  targetId: string;
  userReaction: UserReaction | null;
  allReactions: UserReaction[];
  lastFetched: number;
  loading: boolean;
  error: string | null;
}

// Store state interface
interface PostReactionState {
  // Cache of reactions by target
  reactionCache: Map<string, ReactionCacheEntry>;
  
  // Active subscriptions
  activeSubscriptions: Map<string, () => void>; // channelKey -> unsubscribe function
  
  // Loading states
  loadingTargets: Set<string>;
  
  // Error tracking
  errors: Map<string, string>;
  
  // Real-time connection status
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastConnectionCheck: number;
}

// Store actions interface
interface PostReactionActions {
  // Query operations
  loadUserReaction: (targetType: 'POST' | 'COMMENT', targetId: string, force?: boolean) => Promise<void>;
  loadAllReactions: (targetType: 'POST' | 'COMMENT', targetId: string, force?: boolean) => Promise<void>;
  
  // Subscription management
  subscribeToTarget: (targetType: 'POST' | 'COMMENT', targetId: string) => void;
  unsubscribeFromTarget: (targetType: 'POST' | 'COMMENT', targetId: string) => void;
  unsubscribeAll: () => void;
  
  // Cache management
  getCachedReaction: (targetType: 'POST' | 'COMMENT', targetId: string) => ReactionCacheEntry | null;
  clearCache: (targetType?: 'POST' | 'COMMENT', targetId?: string) => void;
  invalidateCache: (targetType: 'POST' | 'COMMENT', targetId: string) => void;
  
  // Real-time update handlers
  handleReactionUpdate: (update: ReactionUpdate) => void;
  
  // Utility
  getSubscriptionCount: () => number;
  getChannelStatus: () => Record<string, any>;
  
  // Error handling
  clearError: (targetType: 'POST' | 'COMMENT', targetId: string) => void;
  clearAllErrors: () => void;
}

// Combined store interface
export interface PostReactionStore extends PostReactionState, PostReactionActions {}

// Cache TTL (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Generate cache key
function getCacheKey(targetType: 'POST' | 'COMMENT', targetId: string): string {
  return `${targetType}:${targetId}`;
}

// Create the store
export const usePostReactionStore = create<PostReactionStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      reactionCache: new Map(),
      activeSubscriptions: new Map(),
      loadingTargets: new Set(),
      errors: new Map(),
      connectionStatus: 'disconnected',
      lastConnectionCheck: 0,

      // ========== QUERY OPERATIONS ==========

      loadUserReaction: async (
        targetType: 'POST' | 'COMMENT',
        targetId: string,
        force: boolean = false
      ) => {
        const cacheKey = getCacheKey(targetType, targetId);
        const cached = get().reactionCache.get(cacheKey);

        // Check cache validity
        if (!force && cached && !cached.loading) {
          const age = Date.now() - cached.lastFetched;
          if (age < CACHE_TTL) {
            return; // Cache is still fresh
          }
        }

        // Set loading state
        set((draft) => {
          draft.loadingTargets.add(cacheKey);
          
          if (!draft.reactionCache.has(cacheKey)) {
            draft.reactionCache.set(cacheKey, {
              targetType,
              targetId,
              userReaction: null,
              allReactions: [],
              lastFetched: 0,
              loading: true,
              error: null,
            });
          } else {
            const entry = draft.reactionCache.get(cacheKey)!;
            entry.loading = true;
            entry.error = null;
          }
        });

        try {
          // Fetch user reaction
          const result = await PostReactionService.getUserReaction(targetType, targetId);

          set((draft) => {
            draft.loadingTargets.delete(cacheKey);
            
            const entry = draft.reactionCache.get(cacheKey);
            if (entry) {
              entry.loading = false;
              entry.lastFetched = Date.now();
              
              if (result.success) {
                entry.userReaction = result.data || null;
                entry.error = null;
                draft.errors.delete(cacheKey);
              } else {
                entry.error = result.error || 'Failed to load reaction';
                draft.errors.set(cacheKey, entry.error);
              }
            }
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          set((draft) => {
            draft.loadingTargets.delete(cacheKey);
            
            const entry = draft.reactionCache.get(cacheKey);
            if (entry) {
              entry.loading = false;
              entry.error = errorMessage;
            }
            
            draft.errors.set(cacheKey, errorMessage);
          });
        }
      },

      loadAllReactions: async (
        targetType: 'POST' | 'COMMENT',
        targetId: string,
        force: boolean = false
      ) => {
        const cacheKey = getCacheKey(targetType, targetId);
        const cached = get().reactionCache.get(cacheKey);

        // Check cache validity
        if (!force && cached && !cached.loading) {
          const age = Date.now() - cached.lastFetched;
          if (age < CACHE_TTL) {
            return; // Cache is still fresh
          }
        }

        // Set loading state
        set((draft) => {
          draft.loadingTargets.add(cacheKey);
          
          if (!draft.reactionCache.has(cacheKey)) {
            draft.reactionCache.set(cacheKey, {
              targetType,
              targetId,
              userReaction: null,
              allReactions: [],
              lastFetched: 0,
              loading: true,
              error: null,
            });
          } else {
            const entry = draft.reactionCache.get(cacheKey)!;
            entry.loading = true;
            entry.error = null;
          }
        });

        try {
          // Fetch all reactions
          const result = await PostReactionService.getTargetReactions(targetType, targetId);

          set((draft) => {
            draft.loadingTargets.delete(cacheKey);
            
            const entry = draft.reactionCache.get(cacheKey);
            if (entry) {
              entry.loading = false;
              entry.lastFetched = Date.now();
              
              if (result.success) {
                entry.allReactions = result.data || [];
                entry.error = null;
                draft.errors.delete(cacheKey);
              } else {
                entry.error = result.error || 'Failed to load reactions';
                draft.errors.set(cacheKey, entry.error);
              }
            }
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          set((draft) => {
            draft.loadingTargets.delete(cacheKey);
            
            const entry = draft.reactionCache.get(cacheKey);
            if (entry) {
              entry.loading = false;
              entry.error = errorMessage;
            }
            
            draft.errors.set(cacheKey, errorMessage);
          });
        }
      },

      // ========== SUBSCRIPTION MANAGEMENT ==========

      subscribeToTarget: (targetType: 'POST' | 'COMMENT', targetId: string) => {
        const cacheKey = getCacheKey(targetType, targetId);
        const state = get();

        // Don't subscribe if already subscribed
        if (state.activeSubscriptions.has(cacheKey)) {
          console.log(`[PostReactionStore] Already subscribed to ${cacheKey}`);
          return;
        }

        console.log(`[PostReactionStore] Subscribing to ${cacheKey}`);

        // Create subscription
        const unsubscribe = PostReactionService.subscribeToTarget(
          targetType,
          targetId,
          (update) => {
            get().handleReactionUpdate(update);
          }
        );

        // Store unsubscribe function
        set((draft) => {
          draft.activeSubscriptions.set(cacheKey, unsubscribe);
          draft.connectionStatus = 'connected';
          draft.lastConnectionCheck = Date.now();
        });

        // Initial load of data
        get().loadUserReaction(targetType, targetId, true);
      },

      unsubscribeFromTarget: (targetType: 'POST' | 'COMMENT', targetId: string) => {
        const cacheKey = getCacheKey(targetType, targetId);
        const state = get();
        
        const unsubscribe = state.activeSubscriptions.get(cacheKey);
        if (unsubscribe) {
          console.log(`[PostReactionStore] Unsubscribing from ${cacheKey}`);
          unsubscribe();
          
          set((draft) => {
            draft.activeSubscriptions.delete(cacheKey);
          });
        }
      },

      unsubscribeAll: () => {
        const state = get();
        
        console.log(`[PostReactionStore] Unsubscribing from all (${state.activeSubscriptions.size} subscriptions)`);
        
        state.activeSubscriptions.forEach((unsubscribe) => {
          unsubscribe();
        });
        
        set((draft) => {
          draft.activeSubscriptions.clear();
          draft.connectionStatus = 'disconnected';
        });
        
        // Also cleanup the service
        PostReactionService.unsubscribeAll();
      },

      // ========== CACHE MANAGEMENT ==========

      getCachedReaction: (targetType: 'POST' | 'COMMENT', targetId: string) => {
        const cacheKey = getCacheKey(targetType, targetId);
        return get().reactionCache.get(cacheKey) || null;
      },

      clearCache: (targetType?: 'POST' | 'COMMENT', targetId?: string) => {
        set((draft) => {
          if (targetType && targetId) {
            // Clear specific cache entry
            const cacheKey = getCacheKey(targetType, targetId);
            draft.reactionCache.delete(cacheKey);
            draft.errors.delete(cacheKey);
          } else if (targetType) {
            // Clear all entries of a specific type
            const keysToDelete: string[] = [];
            draft.reactionCache.forEach((_, key) => {
              if (key.startsWith(targetType)) {
                keysToDelete.push(key);
              }
            });
            keysToDelete.forEach(key => {
              draft.reactionCache.delete(key);
              draft.errors.delete(key);
            });
          } else {
            // Clear all cache
            draft.reactionCache.clear();
            draft.errors.clear();
          }
        });
      },

      invalidateCache: (targetType: 'POST' | 'COMMENT', targetId: string) => {
        const cacheKey = getCacheKey(targetType, targetId);
        
        set((draft) => {
          const entry = draft.reactionCache.get(cacheKey);
          if (entry) {
            entry.lastFetched = 0; // Force next load to fetch fresh data
          }
        });
      },

      // ========== REAL-TIME UPDATE HANDLERS ==========

      handleReactionUpdate: (update: ReactionUpdate) => {
        console.log('[PostReactionStore] Handling reaction update:', update);
        
        const cacheKey = getCacheKey(update.targetType, update.targetId);
        
        // Invalidate cache and reload
        get().invalidateCache(update.targetType, update.targetId);
        
        // Reload both user reaction and all reactions
        get().loadUserReaction(update.targetType, update.targetId, true);
        
        // Also trigger a reload of the reaction analytics in the reaction store
        setTimeout(async () => {
          try {
            const { useReactionStore } = await import('./reaction.store');
            const reactionStore = useReactionStore.getState();
            reactionStore.clearAnalyticsCache(update.targetId);
            reactionStore.loadReactionAnalytics(update.targetType, update.targetId, true);
          } catch (error) {
            console.error('[PostReactionStore] Error reloading analytics:', error);
          }
        }, 100);
      },

      // ========== UTILITY ==========

      getSubscriptionCount: () => {
        return get().activeSubscriptions.size;
      },

      getChannelStatus: () => {
        return PostReactionService.getChannelStatus();
      },

      // ========== ERROR HANDLING ==========

      clearError: (targetType: 'POST' | 'COMMENT', targetId: string) => {
        const cacheKey = getCacheKey(targetType, targetId);
        
        set((draft) => {
          draft.errors.delete(cacheKey);
          
          const entry = draft.reactionCache.get(cacheKey);
          if (entry) {
            entry.error = null;
          }
        });
      },

      clearAllErrors: () => {
        set((draft) => {
          draft.errors.clear();
          
          draft.reactionCache.forEach((entry) => {
            entry.error = null;
          });
        });
      },
    })),
    {
      name: 'post-reaction-store',
    }
  )
);

// ========== CONVENIENCE HOOKS ==========

/**
 * Hook to get cached user reaction for a target
 */
export const useUserReaction = (targetType: 'POST' | 'COMMENT', targetId: string) => {
  return usePostReactionStore((state) => {
    const cacheKey = getCacheKey(targetType, targetId);
    const cached = state.reactionCache.get(cacheKey);
    return {
      reaction: cached?.userReaction || null,
      loading: cached?.loading || false,
      error: cached?.error || null,
    };
  });
};

/**
 * Hook to get all reactions for a target
 */
export const useTargetReactions = (targetType: 'POST' | 'COMMENT', targetId: string) => {
  return usePostReactionStore((state) => {
    const cacheKey = getCacheKey(targetType, targetId);
    const cached = state.reactionCache.get(cacheKey);
    return {
      reactions: cached?.allReactions || [],
      loading: cached?.loading || false,
      error: cached?.error || null,
    };
  });
};

/**
 * Hook to manage subscription for a target
 */
export const useReactionSubscription = (
  targetType: 'POST' | 'COMMENT',
  targetId: string,
  autoSubscribe: boolean = true
) => {
  const { subscribeToTarget, unsubscribeFromTarget } = usePostReactionStore();
  
  React.useEffect(() => {
    if (autoSubscribe) {
      subscribeToTarget(targetType, targetId);
      
      return () => {
        unsubscribeFromTarget(targetType, targetId);
      };
    }
  }, [targetType, targetId, autoSubscribe, subscribeToTarget, unsubscribeFromTarget]);
  
  return {
    subscribeToTarget,
    unsubscribeFromTarget,
  };
};

// Need to import React for useEffect
import React from 'react';

export default usePostReactionStore;
