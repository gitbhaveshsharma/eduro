/**
 * Reaction Store
 * 
 * Zustand store for managing reaction state across the application
 * Handles caching of available reactions, user preferences, and UI state
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { ReactionService } from '../service/reaction.service';
import type {
  PublicReaction,
  ReactionAnalytics,
  ReactionFilters,
  ReactionUsageStats,
  UserReactionPreferences,
  ReactionCategory,
  ReactionPickerConfig,
} from '../schema/reaction.types';
import {
  REACTION_CONSTANTS,
  DEFAULT_REACTION_PICKER_CONFIG,
  POPULAR_REACTION_GROUPS,
  REACTION_CATEGORIES,
} from '../schema/reaction.types';

// Enable Map and Set support for Immer
enableMapSet();

// Store state interface
interface ReactionState {
  // Reaction catalog cache
  allReactions: PublicReaction[];
  reactionsLoading: boolean;
  reactionsError: string | null;
  reactionsLastFetched: number | null;

  // Trending and popular reactions
  trendingReactions: PublicReaction[];
  popularGroups: Record<string, PublicReaction[]>;
  
  // Category-specific caches
  reactionsByCategory: Map<ReactionCategory, PublicReaction[]>;
  
  // Search results cache
  searchResults: Map<string, PublicReaction[]>; // query -> results
  searchLoading: boolean;
  
  // Analytics cache
  analyticsCache: Map<string, ReactionAnalytics>; // targetId -> analytics
  analyticsLoading: Set<string>;
  
  // Usage statistics
  usageStats: ReactionUsageStats[];
  usageStatsLoading: boolean;
  usageStatsLastFetched: number | null;
  
  // User preferences
  userPreferences: UserReactionPreferences | null;
  quickReactions: PublicReaction[];
  favoriteReactions: PublicReaction[];
  
  // UI State
  pickerConfig: ReactionPickerConfig;
  activeCategory: ReactionCategory | 'all';
  showTrendingOnly: boolean;
  
  // Reaction picker state
  isPickerOpen: boolean;
  pickerTargetType: 'POST' | 'COMMENT' | null;
  pickerTargetId: string | null;
  
  // Recently used reactions (for quick access)
  recentlyUsed: PublicReaction[];
  
  // Error states
  error: string | null;
}

// Store actions interface
interface ReactionActions {
  // Reaction catalog actions
  loadAllReactions: (force?: boolean) => Promise<void>;
  loadReactionsByCategory: (category: ReactionCategory, force?: boolean) => Promise<void>;
  loadTrendingReactions: (force?: boolean) => Promise<void>;
  loadPopularGroups: (force?: boolean) => Promise<void>;
  searchReactions: (query: string) => Promise<void>;
  
  // Analytics actions
  loadReactionAnalytics: (targetType: 'POST' | 'COMMENT', targetId: string, force?: boolean) => Promise<void>;
  loadUsageStats: (force?: boolean) => Promise<void>;
  
  // User preference actions
  loadUserPreferences: () => Promise<void>;
  updateUserPreferences: (preferences: Partial<UserReactionPreferences>) => Promise<boolean>;
  loadQuickReactions: () => Promise<void>;
  loadFavoriteReactions: () => Promise<void>;
  addToQuickReactions: (reactionId: number) => Promise<boolean>;
  removeFromQuickReactions: (reactionId: number) => Promise<boolean>;
  addToFavorites: (reactionId: number) => Promise<boolean>;
  removeFromFavorites: (reactionId: number) => Promise<boolean>;
  
  // UI state actions
  setPickerConfig: (config: Partial<ReactionPickerConfig>) => void;
  setActiveCategory: (category: ReactionCategory | 'all') => void;
  setShowTrendingOnly: (show: boolean) => void;
  
  // Picker actions
  openReactionPicker: (targetType: 'POST' | 'COMMENT', targetId: string) => void;
  closeReactionPicker: () => void;
  
  // Recently used actions
  addToRecentlyUsed: (reaction: PublicReaction) => void;
  clearRecentlyUsed: () => void;
  
  // Cache management
  clearCache: () => void;
  clearErrors: () => void;
  
  // Utility actions
  getReactionById: (id: number) => PublicReaction | null;
  getReactionByName: (name: string) => PublicReaction | null;
  getFilteredReactions: (filters?: ReactionFilters) => PublicReaction[];
}

type ReactionStore = ReactionState & ReactionActions;

// Initial state
const initialState: ReactionState = {
  allReactions: [],
  reactionsLoading: false,
  reactionsError: null,
  reactionsLastFetched: null,

  trendingReactions: [],
  popularGroups: {},
  
  reactionsByCategory: new Map(),
  
  searchResults: new Map(),
  searchLoading: false,
  
  analyticsCache: new Map(),
  analyticsLoading: new Set(),
  
  usageStats: [],
  usageStatsLoading: false,
  usageStatsLastFetched: null,
  
  userPreferences: null,
  quickReactions: [],
  favoriteReactions: [],
  
  pickerConfig: DEFAULT_REACTION_PICKER_CONFIG,
  activeCategory: 'all',
  showTrendingOnly: false,
  
  isPickerOpen: false,
  pickerTargetType: null,
  pickerTargetId: null,
  
  recentlyUsed: [],
  
  error: null,
};

export const useReactionStore = create<ReactionStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // ========== REACTION CATALOG ACTIONS ==========
        
        loadAllReactions: async (force: boolean = false) => {
          const state = get();
          const now = Date.now();
          
          // Check if we need to refresh cache
          if (!force && state.allReactions.length > 0 && state.reactionsLastFetched) {
            const cacheAge = now - state.reactionsLastFetched;
            if (cacheAge < REACTION_CONSTANTS.CACHE_TTL.REACTIONS_LIST * 1000) {
              return; // Cache is still fresh
            }
          }

          set((state) => {
            state.reactionsLoading = true;
            state.reactionsError = null;
          });

          const result = await ReactionService.getReactions();

          set((state) => {
            state.reactionsLoading = false;
            if (result.success && result.data) {
              state.allReactions = result.data.reactions;
              state.trendingReactions = result.data.trending_reactions;
              state.reactionsLastFetched = now;
              state.reactionsError = null;
            } else {
              state.reactionsError = result.error || 'Failed to load reactions';
            }
          });
        },

        loadReactionsByCategory: async (category: ReactionCategory, force: boolean = false) => {
          const state = get();
          
          // Check cache first
          if (!force && state.reactionsByCategory.has(category)) {
            return;
          }

          const result = await ReactionService.getReactionsByCategory(category);

          set((state) => {
            if (result.success && result.data) {
              state.reactionsByCategory.set(category, result.data);
            }
          });
        },

        loadTrendingReactions: async (force: boolean = false) => {
          const state = get();
          
          // Check cache
          if (!force && state.trendingReactions.length > 0) {
            return;
          }

          const result = await ReactionService.getTrendingReactions();

          set((state) => {
            if (result.success && result.data) {
              state.trendingReactions = result.data;
            }
          });
        },

        loadPopularGroups: async (force: boolean = false) => {
          const state = get();
          
          // Check cache
          if (!force && Object.keys(state.popularGroups).length > 0) {
            return;
          }

          const result = await ReactionService.getPopularReactionGroups();

          set((state) => {
            if (result.success && result.data) {
              state.popularGroups = result.data;
            }
          });
        },

        searchReactions: async (query: string) => {
          const state = get();
          
          // Check cache first
          if (state.searchResults.has(query)) {
            return;
          }

          set((state) => {
            state.searchLoading = true;
          });

          const result = await ReactionService.searchReactions(query);

          set((state) => {
            state.searchLoading = false;
            if (result.success && result.data) {
              state.searchResults.set(query, result.data);
            }
          });
        },

        // ========== ANALYTICS ACTIONS ==========

        loadReactionAnalytics: async (
          targetType: 'POST' | 'COMMENT',
          targetId: string,
          force: boolean = false
        ) => {
          const cacheKey = `${targetType}:${targetId}`;
          const state = get();
          
          // Check cache
          if (!force && state.analyticsCache.has(cacheKey)) {
            return;
          }

          set((state) => {
            state.analyticsLoading.add(cacheKey);
          });

          const result = await ReactionService.getReactionAnalytics(targetType, targetId);

          set((state) => {
            state.analyticsLoading.delete(cacheKey);
            if (result.success && result.data) {
              state.analyticsCache.set(cacheKey, result.data);
            }
          });
        },

        loadUsageStats: async (force: boolean = false) => {
          const state = get();
          const now = Date.now();
          
          // Check cache
          if (!force && state.usageStats.length > 0 && state.usageStatsLastFetched) {
            const cacheAge = now - state.usageStatsLastFetched;
            if (cacheAge < REACTION_CONSTANTS.CACHE_TTL.TRENDING_REACTIONS * 1000) {
              return;
            }
          }

          set((state) => {
            state.usageStatsLoading = true;
          });

          const result = await ReactionService.getReactionUsageStats();

          set((state) => {
            state.usageStatsLoading = false;
            if (result.success && result.data) {
              state.usageStats = result.data;
              state.usageStatsLastFetched = now;
            }
          });
        },

        // ========== USER PREFERENCE ACTIONS ==========

        loadUserPreferences: async () => {
          const result = await ReactionService.getUserReactionPreferences();

          set((state) => {
            if (result.success) {
              state.userPreferences = result.data || null;
            }
          });
        },

        updateUserPreferences: async (preferences: Partial<UserReactionPreferences>) => {
          const result = await ReactionService.updateUserReactionPreferences(preferences);

          if (result.success && result.data) {
            set((state) => {
              state.userPreferences = result.data ?? null;
            });
            
            // Reload related data
            if (preferences.quick_reactions) {
              await get().loadQuickReactions();
            }
            if (preferences.favorite_reactions) {
              await get().loadFavoriteReactions();
            }
          }

          return result.success;
        },

        loadQuickReactions: async () => {
          const result = await ReactionService.getUserQuickReactions();

          set((state) => {
            if (result.success && result.data) {
              state.quickReactions = result.data;
            }
          });
        },

        loadFavoriteReactions: async () => {
          const state = get();
          
          if (!state.userPreferences?.favorite_reactions?.length) {
            set((state) => {
              state.favoriteReactions = [];
            });
            return;
          }

          // Get favorite reactions from all reactions
          const favorites = state.allReactions.filter(reaction => 
            state.userPreferences?.favorite_reactions?.includes(reaction.id)
          );

          set((state) => {
            state.favoriteReactions = favorites;
          });
        },

        addToQuickReactions: async (reactionId: number) => {
          const state = get();
          const currentQuick = state.userPreferences?.quick_reactions || [];
          
          if (currentQuick.includes(reactionId)) {
            return true; // Already in quick reactions
          }

          if (currentQuick.length >= REACTION_CONSTANTS.MAX_QUICK_REACTIONS) {
            // Remove oldest reaction
            currentQuick.shift();
          }

          const newQuick = [...currentQuick, reactionId];
          return get().updateUserPreferences({ quick_reactions: newQuick });
        },

        removeFromQuickReactions: async (reactionId: number) => {
          const state = get();
          const currentQuick = state.userPreferences?.quick_reactions || [];
          const newQuick = currentQuick.filter(id => id !== reactionId);
          
          return get().updateUserPreferences({ quick_reactions: newQuick });
        },

        addToFavorites: async (reactionId: number) => {
          const state = get();
          const currentFavorites = state.userPreferences?.favorite_reactions || [];
          
          if (currentFavorites.includes(reactionId)) {
            return true; // Already in favorites
          }

          if (currentFavorites.length >= REACTION_CONSTANTS.MAX_FAVORITE_REACTIONS) {
            return false; // Too many favorites
          }

          const newFavorites = [...currentFavorites, reactionId];
          return get().updateUserPreferences({ favorite_reactions: newFavorites });
        },

        removeFromFavorites: async (reactionId: number) => {
          const state = get();
          const currentFavorites = state.userPreferences?.favorite_reactions || [];
          const newFavorites = currentFavorites.filter(id => id !== reactionId);
          
          return get().updateUserPreferences({ favorite_reactions: newFavorites });
        },

        // ========== UI STATE ACTIONS ==========

        setPickerConfig: (config: Partial<ReactionPickerConfig>) => {
          set((state) => {
            state.pickerConfig = { ...state.pickerConfig, ...config };
          });
        },

        setActiveCategory: (category: ReactionCategory | 'all') => {
          set((state) => {
            state.activeCategory = category;
          });
        },

        setShowTrendingOnly: (show: boolean) => {
          set((state) => {
            state.showTrendingOnly = show;
          });
        },

        // ========== PICKER ACTIONS ==========

        openReactionPicker: (targetType: 'POST' | 'COMMENT', targetId: string) => {
          set((state) => {
            state.isPickerOpen = true;
            state.pickerTargetType = targetType;
            state.pickerTargetId = targetId;
          });
          
          // Load analytics for this target
          get().loadReactionAnalytics(targetType, targetId);
        },

        closeReactionPicker: () => {
          set((state) => {
            state.isPickerOpen = false;
            state.pickerTargetType = null;
            state.pickerTargetId = null;
          });
        },

        // ========== RECENTLY USED ACTIONS ==========

        addToRecentlyUsed: (reaction: PublicReaction) => {
          set((state) => {
            // Remove if already exists
            state.recentlyUsed = state.recentlyUsed.filter(r => r.id !== reaction.id);
            
            // Add to beginning
            state.recentlyUsed.unshift(reaction);
            
            // Keep only last 12
            if (state.recentlyUsed.length > 12) {
              state.recentlyUsed = state.recentlyUsed.slice(0, 12);
            }
          });
        },

        clearRecentlyUsed: () => {
          set((state) => {
            state.recentlyUsed = [];
          });
        },

        // ========== CACHE MANAGEMENT ==========

        clearCache: () => {
          set((state) => {
            state.allReactions = [];
            state.reactionsLastFetched = null;
            state.trendingReactions = [];
            state.popularGroups = {};
            state.reactionsByCategory.clear();
            state.searchResults.clear();
            state.analyticsCache.clear();
            state.usageStats = [];
            state.usageStatsLastFetched = null;
          });
        },

        clearErrors: () => {
          set((state) => {
            state.reactionsError = null;
            state.error = null;
          });
        },

        // ========== UTILITY ACTIONS ==========

        getReactionById: (id: number) => {
          const state = get();
          return state.allReactions.find(r => r.id === id) || null;
        },

        getReactionByName: (name: string) => {
          const state = get();
          return state.allReactions.find(r => r.name === name) || null;
        },

        getFilteredReactions: (filters?: ReactionFilters) => {
          const state = get();
          let reactions = state.allReactions;

          if (!filters) {
            return reactions;
          }

          // Apply category filter
          if (filters.category && filters.category !== 'all') {
            const categories = filters.category.split(',');
            reactions = reactions.filter(r => categories.includes(r.category));
          }

          // Apply popularity filter
          if (filters.popularity_min !== undefined) {
            reactions = reactions.filter(r => r.popularity_score >= filters.popularity_min!);
          }

          if (filters.popularity_max !== undefined) {
            reactions = reactions.filter(r => r.popularity_score <= filters.popularity_max!);
          }

          // Apply trending filter
          if (filters.is_trending) {
            reactions = reactions.filter(r => r.is_trending);
          }

          // Apply search filter
          if (filters.search_query) {
            const query = filters.search_query.toLowerCase();
            reactions = reactions.filter(r => 
              r.name.toLowerCase().includes(query) ||
              r.description?.toLowerCase().includes(query)
            );
          }

          // Apply limit
          if (filters.limit) {
            reactions = reactions.slice(0, filters.limit);
          }

          return reactions;
        },
      })),
      {
        name: 'reaction-store',
        partialize: (state) => ({
          // Persist user preferences and recently used reactions
          userPreferences: state.userPreferences,
          quickReactions: state.quickReactions,
          favoriteReactions: state.favoriteReactions,
          recentlyUsed: state.recentlyUsed,
          pickerConfig: state.pickerConfig,
        }),
      }
    ),
    {
      name: 'reaction-store',
    }
  )
);

// ========== CONVENIENCE HOOKS ==========

export const useReactions = () => useReactionStore(state => state.allReactions);
export const useTrendingReactions = () => useReactionStore(state => state.trendingReactions);
export const usePopularGroups = () => useReactionStore(state => state.popularGroups);
export const useQuickReactions = () => useReactionStore(state => state.quickReactions);
export const useFavoriteReactions = () => useReactionStore(state => state.favoriteReactions);
export const useRecentlyUsedReactions = () => useReactionStore(state => state.recentlyUsed);
export const useReactionPickerState = () => useReactionStore(state => ({
  isOpen: state.isPickerOpen,
  targetType: state.pickerTargetType,
  targetId: state.pickerTargetId,
  config: state.pickerConfig,
}));
export const useReactionsByCategory = (category: ReactionCategory) => 
  useReactionStore(state => state.reactionsByCategory.get(category) || []);
export const useReactionAnalytics = (targetType: 'POST' | 'COMMENT', targetId: string) => 
  useReactionStore(state => state.analyticsCache.get(`${targetType}:${targetId}`));
export const useReactionUsageStats = () => useReactionStore(state => state.usageStats);

// Hook for getting filtered reactions based on current UI state
export const useFilteredReactions = () => useReactionStore(state => {
  const { activeCategory, showTrendingOnly } = state;
  
  const filters: ReactionFilters = {
    category: activeCategory === 'all' ? undefined : activeCategory,
    is_trending: showTrendingOnly || undefined,
  };
  
  return state.getFilteredReactions(filters);
});

// Hook for checking if a reaction is in user's favorites
export const useIsReactionFavorite = (reactionId: number) => 
  useReactionStore(state => state.userPreferences?.favorite_reactions?.includes(reactionId) || false);

// Hook for checking if a reaction is in user's quick reactions
export const useIsReactionQuick = (reactionId: number) => 
  useReactionStore(state => state.userPreferences?.quick_reactions?.includes(reactionId) || false);