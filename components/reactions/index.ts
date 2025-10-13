/**
 * Reactions Components Index
 * 
 * Centralized exports for all reaction-related components
 * Provides easy importing for consumers
 */

// Main components
export { ReactionSystem, type ReactionSystemProps } from './reaction-system';
export { PostReactions, type PostReactionsProps } from './post-reactions';
export { ReactionBar, type ReactionBarProps } from './reaction-bar';
export { ReactionPicker, type ReactionPickerProps } from './reaction-picker';
export { ReactionDisplay, type ReactionDisplayProps } from './reaction-display';
export { ReactionTrigger, type ReactionTriggerProps } from './reaction-trigger';

// Re-export reaction utilities and types for convenience
export {
  // Hooks
  useReactionStore,
  useReactions,
  useTrendingReactions,
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
  
  // Services
  ReactionService,
  
  // Utilities
  ReactionUtils,
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
  
  // Types
  type PublicReaction,
  type ReactionSummary,
  type ReactionAnalytics,
  type ReactionFilters,
  type UserReactionPreferences,
  type ReactionPickerConfig,
  type ReactionCategory,
  type ReactionOperationResult,
  
  // Constants
  REACTION_CONSTANTS,
  REACTION_CATEGORIES,
  POPULAR_REACTION_GROUPS,
  DEFAULT_REACTION_PICKER_CONFIG,
  REACTION_ERROR_CODES,
} from '@/lib/reaction';

// Default export for most common use case
export { PostReactions as default } from './post-reactions';