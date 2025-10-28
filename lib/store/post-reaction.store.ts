/**
 * Post Reaction Store (Global Broadcast Edition)
 * 
 * Zustand store for managing real-time post and comment reactions.
 * Uses GlobalReactionBroadcastService for scalable single-channel architecture.
 * 
 * Key Features:
 * - ONE global WebSocket channel instead of N channels
 * - Client-side filtering for efficiency
 * - Optimistic updates for instant UI
 * - Smart caching with TTL (5 minutes)
 * - Batch loading for performance
 * - No duplicate subscriptions
 * - Proper cleanup on unmount
 * 
 * @example
 * ```
 * // In a component
 * const { reaction, loading } = useUserReaction('POST', postId);
 * useReactionSubscription('POST', postId); // Auto-subscribes
 * ```
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import GlobalReactionBroadcastService, { 
  type ReactionBroadcastPayload 
} from '../service/post-reaction.service';
import { createClient } from '../supabase/client';
import type { PostOperationResult } from '../schema/post.types';

// Initialize Supabase client
const supabase = createClient();

// Enable Map and Set support for Immer when using immer middleware in Zustand
enableMapSet();

// ========== TYPE DEFINITIONS ==========

export interface UserReaction {
  id: string;
  user_id: string;
  target_type: 'POST' | 'COMMENT';
  target_id: string;
  reaction_id: number;
  created_at: string;
  reaction?: {
    name: string;
    emoji_unicode: string;
    category: string;
    description?: string;
  };
}

interface ReactionCacheEntry {
  targetType: 'POST' | 'COMMENT';
  targetId: string;
  userReaction: UserReaction | null;
  allReactions: UserReaction[];
  lastFetched: number;
  loading: boolean;
  error: string | null;
}

interface PostReactionState {
  // Cache of reactions by target
  reactionCache: Record<string, ReactionCacheEntry>;
  
  // Active subscriptions (unsubscribe functions)
  activeSubscriptions: Record<string, () => void>;
  
  // Loading states
  loadingTargets: Set<string>;
  
  // Batch loading for initial subscriptions
  pendingBatchLoad: Set<string>;
  batchLoadTimer: NodeJS.Timeout | null;
  
  // Error tracking
  errors: Record<string, string>;
  
  // Connection status
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastConnectionCheck: number;
}

interface PostReactionActions {
  // Query operations
  loadUserReaction: (
    targetType: 'POST' | 'COMMENT', 
    targetId: string, 
    force?: boolean
  ) => Promise<void>;
  
  loadAllReactions: (
    targetType: 'POST' | 'COMMENT', 
    targetId: string, 
    force?: boolean
  ) => Promise<void>;
  
  // Subscription management
  subscribeToTarget: (targetType: 'POST' | 'COMMENT', targetId: string) => void;
  unsubscribeFromTarget: (targetType: 'POST' | 'COMMENT', targetId: string) => void;
  unsubscribeAll: () => void;
  
  // Cache management
  getCachedReaction: (targetType: 'POST' | 'COMMENT', targetId: string) => ReactionCacheEntry | null;
  clearCache: (targetType?: 'POST' | 'COMMENT', targetId?: string) => void;
  invalidateCache: (targetType: 'POST' | 'COMMENT', targetId: string) => void;
  
  // Real-time update handlers
  handleReactionUpdate: (payload: ReactionBroadcastPayload) => void;
  
  // Batch loading
  processBatchLoad: () => void;
  
  // Utility
  getSubscriptionCount: () => number;
  isHealthy: () => boolean;
  
  // Error handling
  clearError: (targetType: 'POST' | 'COMMENT', targetId: string) => void;
  clearAllErrors: () => void;
}

export interface PostReactionStore extends PostReactionState, PostReactionActions {}

// ========== CONSTANTS ==========

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const BATCH_LOAD_DELAY = 150; // 150ms batch window
const BATCH_STAGGER_DELAY = 25; // 25ms between each load

// ========== HELPER FUNCTIONS ==========

/**
 * Generate cache key for type safety and consistency
 */
function getCacheKey(targetType: 'POST' | 'COMMENT', targetId: string): string {
  return `${targetType}:${targetId}`;
}

/**
 * Check if cache is fresh
 */
function isCacheFresh(entry: ReactionCacheEntry | undefined, ttl: number = CACHE_TTL): boolean {
  if (!entry || entry.loading) return false;
  const age = Date.now() - entry.lastFetched;
  return age < ttl;
}

/**
 * Fetch user's reaction from database
 */
async function fetchUserReaction(
  targetType: 'POST' | 'COMMENT',
  targetId: string
): Promise<PostOperationResult<UserReaction | null>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('post_reactions')
      .select(`
        *,
        reaction:reactions!inner(
          name,
          emoji_unicode,
          category,
          description
        )
      `)
      .eq('user_id', user.id)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .maybeSingle();

    if (error) {
      console.error('[fetchUserReaction] Error:', error);
      return { success: false, error: error.message };
    }

    if (data && data.reaction) {
      const reaction = Array.isArray(data.reaction) ? data.reaction[0] : data.reaction;
      return {
        success: true,
        data: { ...data, reaction } as UserReaction
      };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error('[fetchUserReaction] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch all reactions for a target from database
 */
async function fetchTargetReactions(
  targetType: 'POST' | 'COMMENT',
  targetId: string
): Promise<PostOperationResult<UserReaction[]>> {
  try {
    const { data, error } = await supabase
      .from('post_reactions')
      .select(`
        *,
        reaction:reactions!inner(
          name,
          emoji_unicode,
          category,
          description
        )
      `)
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    if (error) {
      console.error('[fetchTargetReactions] Error:', error);
      return { success: false, error: error.message };
    }

    const reactions = (data || []).map(item => ({
      ...item,
      reaction: Array.isArray(item.reaction) ? item.reaction[0] : item.reaction
    })) as UserReaction[];

    return { success: true, data: reactions };
  } catch (error) {
    console.error('[fetchTargetReactions] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ========== ZUSTAND STORE ==========

export const usePostReactionStore = create<PostReactionStore>()(
  devtools(
    immer((set, get) => ({
      // ========== INITIAL STATE ==========
      
      reactionCache: {},
      activeSubscriptions: {},
      loadingTargets: new Set(),
      pendingBatchLoad: new Set(),
      batchLoadTimer: null,
      errors: {},
      connectionStatus: 'disconnected',
      lastConnectionCheck: 0,

      // ========== QUERY OPERATIONS ==========

      loadUserReaction: async (
        targetType: 'POST' | 'COMMENT',
        targetId: string,
        force: boolean = false
      ) => {
        const cacheKey = getCacheKey(targetType, targetId);
        const cached = get().reactionCache[cacheKey];

        // Check cache validity
        if (!force && isCacheFresh(cached)) {
          console.log(`[PostReactionStore] Using cached user reaction for ${cacheKey}`);
          return;
        }

        // Set loading state
        set((draft) => {
          if (!draft.reactionCache[cacheKey]) {
            draft.reactionCache[cacheKey] = {
              targetType,
              targetId,
              userReaction: null,
              allReactions: [],
              lastFetched: 0,
              loading: true,
              error: null,
            };
          } else {
            draft.reactionCache[cacheKey].loading = true;
            draft.reactionCache[cacheKey].error = null;
          }
          draft.loadingTargets.add(cacheKey);
        });

        try {
          const result = await fetchUserReaction(targetType, targetId);

          set((draft) => {
            draft.loadingTargets.delete(cacheKey);
            
            const entry = draft.reactionCache[cacheKey];
            if (entry) {
              entry.loading = false;
              entry.lastFetched = Date.now();
              
              if (result.success) {
                entry.userReaction = result.data || null;
                entry.error = null;
                delete draft.errors[cacheKey];
              } else {
                entry.error = result.error || 'Failed to load reaction';
                draft.errors[cacheKey] = entry.error;
              }
            }
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          set((draft) => {
            draft.loadingTargets.delete(cacheKey);
            
            const entry = draft.reactionCache[cacheKey];
            if (entry) {
              entry.loading = false;
              entry.error = errorMessage;
            }
            
            draft.errors[cacheKey] = errorMessage;
          });
        }
      },

      loadAllReactions: async (
        targetType: 'POST' | 'COMMENT',
        targetId: string,
        force: boolean = false
      ) => {
        const cacheKey = getCacheKey(targetType, targetId);
        const cached = get().reactionCache[cacheKey];

        // Check cache validity
        if (!force && isCacheFresh(cached)) {
          console.log(`[PostReactionStore] Using cached all reactions for ${cacheKey}`);
          return;
        }

        // Set loading state
        set((draft) => {
          if (!draft.reactionCache[cacheKey]) {
            draft.reactionCache[cacheKey] = {
              targetType,
              targetId,
              userReaction: null,
              allReactions: [],
              lastFetched: 0,
              loading: true,
              error: null,
            };
          } else {
            draft.reactionCache[cacheKey].loading = true;
            draft.reactionCache[cacheKey].error = null;
          }
          draft.loadingTargets.add(cacheKey);
        });

        try {
          const result = await fetchTargetReactions(targetType, targetId);

          set((draft) => {
            draft.loadingTargets.delete(cacheKey);
            
            const entry = draft.reactionCache[cacheKey];
            if (entry) {
              entry.loading = false;
              entry.lastFetched = Date.now();
              
              if (result.success) {
                entry.allReactions = result.data || [];
                entry.error = null;
                delete draft.errors[cacheKey];
              } else {
                entry.error = result.error || 'Failed to load reactions';
                draft.errors[cacheKey] = entry.error;
              }
            }
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          set((draft) => {
            draft.loadingTargets.delete(cacheKey);
            
            const entry = draft.reactionCache[cacheKey];
            if (entry) {
              entry.loading = false;
              entry.error = errorMessage;
            }
            
            draft.errors[cacheKey] = errorMessage;
          });
        }
      },

      // ========== SUBSCRIPTION MANAGEMENT ==========

      subscribeToTarget: (targetType: 'POST' | 'COMMENT', targetId: string) => {
        const cacheKey = getCacheKey(targetType, targetId);
        
        set(draft => {
          if (draft.activeSubscriptions[cacheKey]) {
            console.log(`[PostReactionStore] Already subscribed to ${cacheKey}`);
            return;
          }

          console.log(`[PostReactionStore] 📡 Subscribing to ${cacheKey} via global broadcast`);

          const unsubscribe = GlobalReactionBroadcastService.subscribe(
            targetType,
            targetId,
            (payload) => {
              get().handleReactionUpdate(payload);
            }
          );

          draft.activeSubscriptions[cacheKey] = unsubscribe;
          draft.connectionStatus = 'connected';
          draft.lastConnectionCheck = Date.now();
          draft.pendingBatchLoad.add(cacheKey);

          if (!draft.batchLoadTimer) {
            draft.batchLoadTimer = setTimeout(() => {
              get().processBatchLoad();
            }, BATCH_LOAD_DELAY);
          }
        });
      },

      unsubscribeFromTarget: (targetType: 'POST' | 'COMMENT', targetId: string) => {
        const cacheKey = getCacheKey(targetType, targetId);
        
        set((draft) => {
          const unsubscribe = draft.activeSubscriptions[cacheKey];
          if (unsubscribe) {
            console.log(`[PostReactionStore] 📴 Unsubscribing from ${cacheKey}`);
            unsubscribe();
            delete draft.activeSubscriptions[cacheKey];
          }
        });
      },

      unsubscribeAll: () => {
        const state = get();
        
        const count = Object.keys(state.activeSubscriptions).length;
        console.log(`[PostReactionStore] Unsubscribing from all (${count} subscriptions)`);
        
        Object.values(state.activeSubscriptions).forEach((unsubscribe) => {
          unsubscribe();
        });
        
        set((draft) => {
          draft.activeSubscriptions = {};
          draft.connectionStatus = 'disconnected';
        });
      },

      // ========== CACHE MANAGEMENT ==========

      getCachedReaction: (targetType: 'POST' | 'COMMENT', targetId: string) => {
        const cacheKey = getCacheKey(targetType, targetId);
        return get().reactionCache[cacheKey] || null;
      },

      clearCache: (targetType?: 'POST' | 'COMMENT', targetId?: string) => {
        set((draft) => {
          if (targetType && targetId) {
            // Clear specific cache entry
            const cacheKey = getCacheKey(targetType, targetId);
            delete draft.reactionCache[cacheKey];
            delete draft.errors[cacheKey];
          } else if (targetType) {
            // Clear all entries of a specific type
            Object.keys(draft.reactionCache).forEach((key) => {
              if (key.startsWith(targetType)) {
                delete draft.reactionCache[key];
                delete draft.errors[key];
              }
            });
          } else {
            // Clear all cache
            draft.reactionCache = {};
            draft.errors = {};
          }
        });
      },

      invalidateCache: (targetType: 'POST' | 'COMMENT', targetId: string) => {
        const cacheKey = getCacheKey(targetType, targetId);
        
        set((draft) => {
          const entry = draft.reactionCache[cacheKey];
          if (entry) {
            entry.lastFetched = 0; // Force next load to fetch fresh data
          }
        });
      },

      // ========== REAL-TIME UPDATE HANDLERS ==========

      handleReactionUpdate: (payload: ReactionBroadcastPayload) => {
        console.log('[PostReactionStore] 📨 Handling reaction update:', payload);
        
        const cacheKey = getCacheKey(payload.target_type, payload.target_id);
        
        // Reload data immediately to keep UI in sync
        // Use Promise.all to load both user reaction and all reactions
        Promise.all([
          get().loadUserReaction(payload.target_type, payload.target_id, true),
          get().loadAllReactions(payload.target_type, payload.target_id, true)
        ]).catch((error) => {
          console.error('[PostReactionStore] Error reloading after update:', error);
        });
        
        // Also trigger reload of reaction analytics if available
        setTimeout(async () => {
          try {
            const { useReactionStore } = await import('./reaction.store');
            const reactionStore = useReactionStore.getState();
            
            // Check if method exists before calling
            if (typeof reactionStore.loadReactionAnalytics === 'function') {
              await reactionStore.loadReactionAnalytics(
                payload.target_type, 
                payload.target_id, 
                true
              );
            }
          } catch (error) {
            // Ignore if reaction store doesn't exist
            console.debug('[PostReactionStore] Reaction store not available:', error);
          }
        }, 50);
      },

      // ========== BATCH LOADING ==========

      processBatchLoad: () => {
        const state = get();
        const pending = Array.from(state.pendingBatchLoad);
        
        if (pending.length === 0) return;
        
        console.log(`[PostReactionStore] 🔄 Processing batch load for ${pending.length} targets`);
        
        // Clear pending set and timer
        set((draft) => {
          draft.pendingBatchLoad.clear();
          if (draft.batchLoadTimer) {
            clearTimeout(draft.batchLoadTimer);
            draft.batchLoadTimer = null;
          }
        });
        
        // Process each pending load with stagger to prevent thundering herd
        pending.forEach((cacheKey, index) => {
          const [targetType, targetId] = cacheKey.split(':') as ['POST' | 'COMMENT', string];
          
          setTimeout(() => {
            const currentState = get();
            
            // Only load if still subscribed
            if (!currentState.activeSubscriptions[cacheKey]) {
              console.log(`[PostReactionStore] Skipping ${cacheKey} - no longer subscribed`);
              return;
            }
            
            const cached = currentState.reactionCache[cacheKey];
            
            // Only load if cache is stale or missing
            if (!isCacheFresh(cached)) {
              get().loadUserReaction(targetType, targetId, true);
            } else {
              console.log(`[PostReactionStore] Skipping ${cacheKey} - cache is fresh`);
            }
          }, index * BATCH_STAGGER_DELAY);
        });
      },

      // ========== UTILITY ==========

      getSubscriptionCount: () => {
        return Object.keys(get().activeSubscriptions).length;
      },

      isHealthy: () => {
        const state = get();
        return (
          state.connectionStatus === 'connected' &&
          GlobalReactionBroadcastService.isHealthy()
        );
      },

      // ========== ERROR HANDLING ==========

      clearError: (targetType: 'POST' | 'COMMENT', targetId: string) => {
        const cacheKey = getCacheKey(targetType, targetId);
        
        set((draft) => {
          delete draft.errors[cacheKey];
          
          const entry = draft.reactionCache[cacheKey];
          if (entry) {
            entry.error = null;
          }
        });
      },

      clearAllErrors: () => {
        set((draft) => {
          draft.errors = {};
          
          Object.values(draft.reactionCache).forEach((entry) => {
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
    const cached = state.reactionCache[cacheKey];
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
    const cached = state.reactionCache[cacheKey];
    return {
      reactions: cached?.allReactions || [],
      loading: cached?.loading || false,
      error: cached?.error || null,
    };
  });
};

/**
 * Hook to manage subscription for a target
 * 
 * @example
 * ```
 * // In PostCard component
 * useReactionSubscription('POST', postId); // Auto-subscribes and cleans up
 * const { reaction } = useUserReaction('POST', postId);
 * ```
 */
export function useReactionSubscription(
  targetType: 'POST' | 'COMMENT',
  targetId: string,
  autoSubscribe: boolean = true
) {
  const subscribeToTargetRef = React.useRef(usePostReactionStore.getState().subscribeToTarget);
  const unsubscribeFromTargetRef = React.useRef(usePostReactionStore.getState().unsubscribeFromTarget);
  
  // Update refs on each render to get latest store functions
  React.useEffect(() => {
    subscribeToTargetRef.current = usePostReactionStore.getState().subscribeToTarget;
    unsubscribeFromTargetRef.current = usePostReactionStore.getState().unsubscribeFromTarget;
  });
  
  React.useEffect(() => {
    if (autoSubscribe) {
      subscribeToTargetRef.current(targetType, targetId);
      
      return () => {
        unsubscribeFromTargetRef.current(targetType, targetId);
      };
    }
  }, [targetType, targetId, autoSubscribe]); // ✅ Only stable dependencies
  
  return {
    subscribeToTarget: subscribeToTargetRef.current,
    unsubscribeFromTarget: unsubscribeFromTargetRef.current,
  };
}

// Import React for hooks
import React from 'react';

export default usePostReactionStore;
