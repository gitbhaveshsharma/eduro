/**
 * Reaction System Index
 * 
 * Main entry point for the reaction system
 * Exports all reaction components for easy importing
 */

// Re-export everything from the reaction modules
export * from './schema/reaction.types';
export * from './service/reaction.service';
export * from './service/post-reaction.service';
export * from './store/reaction.store';
export * from './store/post-reaction.store';
export * from './utils/reaction.utils';

// Export commonly used items with named exports for convenience
export {
  // Types
  type PublicReaction,
  type ReactionSummary,
  type ReactionAnalytics,
  type ReactionFilters,
  type UserReactionPreferences,
  type ReactionPickerConfig,
  
  // Constants
  REACTION_CONSTANTS,
  REACTION_CATEGORIES,
  POPULAR_REACTION_GROUPS,
  DEFAULT_REACTION_PICKER_CONFIG,
  
  // Error codes
  REACTION_ERROR_CODES,
} from './schema/reaction.types';

export {
  // Service
  ReactionService,
} from './service/reaction.service';

export {
  // Post Reaction Service
  PostReactionService,
  type UserReaction,
  type ReactionUpdate,
} from './service/post-reaction.service';

export {
  // Store and hooks
  useReactionStore,
  useReactions,
  useTrendingReactions,
  usePopularGroups,
  useQuickReactions,
  useFavoriteReactions,
  useRecentlyUsedReactions,
  useReactionPickerState,
  useReactionsByCategory,
  useReactionAnalytics,
  useReactionUsageStats,
  useFilteredReactions,
  useIsReactionFavorite,
  useIsReactionQuick,
} from './store/reaction.store';

export {
  // Post Reaction Store and hooks
  usePostReactionStore,
  useUserReaction,
  useTargetReactions,
  useReactionSubscription,
} from './store/post-reaction.store';

export {
  // Utilities
  ReactionUtils,
  
  // Individual utility functions for direct import
  formatReactionEmoji,
  formatReactionName,
  formatReactionCount,
  getCategoryDisplayName,
  getCategoryEmoji,
  getCategoryColor,
  sortByPopularity,
  sortByName,
  filterByCategory,
  getReactionAriaLabel,
} from './utils/reaction.utils';