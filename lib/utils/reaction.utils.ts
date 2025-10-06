/**
 * Reaction Utilities
 * 
 * Utility functions for reaction formatting, sorting, filtering, and validation
 */

import type {
  PublicReaction,
  ReactionSummary,
  ReactionAnalytics,
  ReactionFilters,
  ReactionSort,
  UserReactionPreferences,
  ReactionCategory,
  PopularReactionGroup,
} from '../schema/reaction.types';
import {
  REACTION_CONSTANTS,
  POPULAR_REACTION_GROUPS,
  REACTION_CATEGORIES,
} from '../schema/reaction.types';

// ========== FORMATTING UTILITIES ==========

/**
 * Format reaction emoji with fallback
 */
export function formatReactionEmoji(reaction: PublicReaction, fallback: string = '👍'): string {
  return reaction.emoji_unicode || fallback;
}

/**
 * Format reaction name for display
 */
export function formatReactionName(reaction: PublicReaction): string {
  return reaction.name.charAt(0).toUpperCase() + reaction.name.slice(1).replace(/_/g, ' ');
}

/**
 * Format reaction description
 */
export function formatReactionDescription(reaction: PublicReaction): string {
  return reaction.description || `${formatReactionName(reaction)} reaction`;
}

/**
 * Format reaction count for display
 */
export function formatReactionCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    return `${(count / 1000).toFixed(1)}K`;
  } else {
    return `${(count / 1000000).toFixed(1)}M`;
  }
}

/**
 * Format popularity score as percentage
 */
export function formatPopularityScore(score: number): string {
  return `${score}%`;
}

/**
 * Get reaction category display name
 */
export function getCategoryDisplayName(category: ReactionCategory): string {
  const names = {
    positive: 'Positive',
    negative: 'Negative',
    neutral: 'Neutral',
  };
  return names[category] || category;
}

/**
 * Get reaction category emoji
 */
export function getCategoryEmoji(category: ReactionCategory): string {
  const emojis = {
    positive: '😊',
    negative: '😔',
    neutral: '😐',
  };
  return emojis[category] || '⚪';
}

/**
 * Get reaction category color
 */
export function getCategoryColor(category: ReactionCategory): string {
  const colors = {
    positive: '#10B981', // green
    negative: '#EF4444', // red
    neutral: '#6B7280', // gray
  };
  return colors[category] || '#6B7280';
}

// ========== SORTING UTILITIES ==========

/**
 * Sort reactions by popularity (descending)
 */
export function sortByPopularity(reactions: PublicReaction[]): PublicReaction[] {
  return [...reactions].sort((a, b) => b.popularity_score - a.popularity_score);
}

/**
 * Sort reactions by name (ascending)
 */
export function sortByName(reactions: PublicReaction[]): PublicReaction[] {
  return [...reactions].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Sort reactions by category, then by popularity
 */
export function sortByCategory(reactions: PublicReaction[]): PublicReaction[] {
  const categoryOrder = ['positive', 'neutral', 'negative'];
  
  return [...reactions].sort((a, b) => {
    const categoryCompare = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
    if (categoryCompare !== 0) return categoryCompare;
    return b.popularity_score - a.popularity_score;
  });
}

/**
 * Sort reaction summaries by count (descending)
 */
export function sortReactionSummariesByCount(summaries: ReactionSummary[]): ReactionSummary[] {
  return [...summaries].sort((a, b) => b.count - a.count);
}

/**
 * Apply custom sorting to reactions
 */
export function applySorting(reactions: PublicReaction[], sort: ReactionSort): PublicReaction[] {
  const sorted = [...reactions].sort((a, b) => {
    let comparison = 0;
    
    switch (sort.field) {
      case 'popularity_score':
        comparison = a.popularity_score - b.popularity_score;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'created_at':
        // PublicReaction doesn't have created_at, fallback to name sorting
        comparison = a.name.localeCompare(b.name);
        break;
      default:
        comparison = 0;
    }
    
    return sort.direction === 'desc' ? -comparison : comparison;
  });
  
  return sorted;
}

// ========== FILTERING UTILITIES ==========

/**
 * Filter reactions by category
 */
export function filterByCategory(
  reactions: PublicReaction[], 
  category: ReactionCategory | 'all'
): PublicReaction[] {
  if (category === 'all') return reactions;
  return reactions.filter(r => r.category === category);
}

/**
 * Filter reactions by popularity range
 */
export function filterByPopularity(
  reactions: PublicReaction[], 
  min?: number, 
  max?: number
): PublicReaction[] {
  return reactions.filter(r => {
    if (min !== undefined && r.popularity_score < min) return false;
    if (max !== undefined && r.popularity_score > max) return false;
    return true;
  });
}

/**
 * Filter reactions by search query
 */
export function filterBySearch(reactions: PublicReaction[], query: string): PublicReaction[] {
  if (!query.trim()) return reactions;
  
  const searchTerm = query.toLowerCase();
  return reactions.filter(r => 
    r.name.toLowerCase().includes(searchTerm) ||
    r.description?.toLowerCase().includes(searchTerm) ||
    r.emoji_unicode.includes(searchTerm)
  );
}

/**
 * Filter trending reactions only
 */
export function filterTrendingOnly(reactions: PublicReaction[]): PublicReaction[] {
  return reactions.filter(r => r.is_trending);
}

/**
 * Apply all filters to reactions
 */
export function applyFilters(reactions: PublicReaction[], filters: ReactionFilters): PublicReaction[] {
  let filtered = reactions;
  
  // Category filter
  if (filters.category && filters.category !== 'all') {
    const categories = filters.category.split(',') as ReactionCategory[];
    filtered = filtered.filter(r => categories.includes(r.category));
  }
  
  // Popularity filter
  filtered = filterByPopularity(filtered, filters.popularity_min, filters.popularity_max);
  
  // Search filter
  if (filters.search_query) {
    filtered = filterBySearch(filtered, filters.search_query);
  }
  
  // Trending filter
  if (filters.is_trending) {
    filtered = filterTrendingOnly(filtered);
  }
  
  // Limit results
  if (filters.limit) {
    filtered = filtered.slice(0, filters.limit);
  }
  
  return filtered;
}

// ========== GROUPING UTILITIES ==========

/**
 * Group reactions by category
 */
export function groupByCategory(reactions: PublicReaction[]): Record<ReactionCategory, PublicReaction[]> {
  const groups: Record<ReactionCategory, PublicReaction[]> = {
    positive: [],
    negative: [],
    neutral: [],
  };
  
  reactions.forEach(reaction => {
    groups[reaction.category].push(reaction);
  });
  
  return groups;
}

/**
 * Group reactions by popularity tiers
 */
export function groupByPopularityTier(reactions: PublicReaction[]): Record<string, PublicReaction[]> {
  const groups = {
    high: [] as PublicReaction[], // 80-100
    medium: [] as PublicReaction[], // 50-79
    low: [] as PublicReaction[], // 1-49
  };
  
  reactions.forEach(reaction => {
    if (reaction.popularity_score >= 80) {
      groups.high.push(reaction);
    } else if (reaction.popularity_score >= 50) {
      groups.medium.push(reaction);
    } else {
      groups.low.push(reaction);
    }
  });
  
  return groups;
}

/**
 * Get popular reaction groups with actual reaction data
 */
export function getPopularReactionGroups(allReactions: PublicReaction[]): Record<string, PublicReaction[]> {
  const groups: Record<string, PublicReaction[]> = {};
  
  Object.entries(POPULAR_REACTION_GROUPS).forEach(([groupName, reactionNames]) => {
    groups[groupName.toLowerCase()] = allReactions.filter(reaction => 
      (reactionNames as readonly string[]).includes(reaction.name)
    );
  });
  
  return groups;
}

// ========== VALIDATION UTILITIES ==========

/**
 * Validate reaction ID
 */
export function isValidReactionId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

/**
 * Validate reaction category
 */
export function isValidCategory(category: string): category is ReactionCategory {
  return Object.values(REACTION_CATEGORIES).includes(category as ReactionCategory);
}

/**
 * Validate popularity score
 */
export function isValidPopularityScore(score: number): boolean {
  return Number.isInteger(score) && 
         score >= REACTION_CONSTANTS.MIN_POPULARITY_SCORE && 
         score <= REACTION_CONSTANTS.MAX_POPULARITY_SCORE;
}

/**
 * Validate reaction filters
 */
export function validateFilters(filters: ReactionFilters): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (filters.category && filters.category !== 'all') {
    const categories = filters.category.split(',');
    const invalidCategories = categories.filter(cat => !isValidCategory(cat));
    if (invalidCategories.length > 0) {
      errors.push(`Invalid categories: ${invalidCategories.join(', ')}`);
    }
  }
  
  if (filters.popularity_min !== undefined && !isValidPopularityScore(filters.popularity_min)) {
    errors.push('Invalid minimum popularity score');
  }
  
  if (filters.popularity_max !== undefined && !isValidPopularityScore(filters.popularity_max)) {
    errors.push('Invalid maximum popularity score');
  }
  
  if (filters.limit !== undefined && (filters.limit < 1 || filters.limit > REACTION_CONSTANTS.MAX_PAGE_SIZE)) {
    errors.push(`Limit must be between 1 and ${REACTION_CONSTANTS.MAX_PAGE_SIZE}`);
  }
  
  return { valid: errors.length === 0, errors };
}

// ========== ANALYTICS UTILITIES ==========

/**
 * Calculate reaction diversity score (0-1, higher = more diverse)
 */
export function calculateReactionDiversity(summaries: ReactionSummary[]): number {
  if (summaries.length <= 1) return 0;
  
  const total = summaries.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) return 0;
  
  // Calculate Shannon diversity index
  let diversity = 0;
  summaries.forEach(summary => {
    const proportion = summary.count / total;
    if (proportion > 0) {
      diversity -= proportion * Math.log2(proportion);
    }
  });
  
  // Normalize to 0-1 scale
  const maxDiversity = Math.log2(summaries.length);
  return maxDiversity > 0 ? diversity / maxDiversity : 0;
}

/**
 * Get dominant reaction from summaries
 */
export function getDominantReaction(summaries: ReactionSummary[]): ReactionSummary | null {
  if (summaries.length === 0) return null;
  return summaries.reduce((max, current) => current.count > max.count ? current : max);
}

/**
 * Calculate engagement rate from analytics
 */
export function calculateEngagementRate(analytics: ReactionAnalytics, viewCount: number): number {
  if (viewCount === 0) return 0;
  return (analytics.total_reactions / viewCount) * 100;
}

/**
 * Get reaction sentiment score (-1 to 1, negative to positive)
 */
export function getReactionSentiment(summaries: ReactionSummary[]): number {
  const total = summaries.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) return 0;
  
  let score = 0;
  summaries.forEach(summary => {
    const weight = summary.count / total;
    switch (summary.category) {
      case 'positive':
        score += weight;
        break;
      case 'negative':
        score -= weight;
        break;
      // neutral reactions don't affect sentiment
    }
  });
  
  return score;
}

// ========== USER PREFERENCE UTILITIES ==========

/**
 * Get user's preferred reactions (quick + favorites)
 */
export function getUserPreferredReactions(
  allReactions: PublicReaction[],
  preferences: UserReactionPreferences | null
): PublicReaction[] {
  if (!preferences) return [];
  
  const preferredIds = new Set([
    ...(preferences.quick_reactions || []),
    ...(preferences.favorite_reactions || []),
  ]);
  
  return allReactions.filter(r => preferredIds.has(r.id));
}

/**
 * Generate default quick reactions for new users
 */
export function generateDefaultQuickReactions(allReactions: PublicReaction[]): number[] {
  // Get essential reactions first
  const essentialNames = POPULAR_REACTION_GROUPS.ESSENTIAL as readonly string[];
  const essential = allReactions.filter(r => essentialNames.includes(r.name));
  
  // Fill remaining slots with high popularity reactions
  const remaining = REACTION_CONSTANTS.MAX_QUICK_REACTIONS - essential.length;
  const additional = allReactions
    .filter(r => !essentialNames.includes(r.name))
    .sort((a, b) => b.popularity_score - a.popularity_score)
    .slice(0, remaining);
  
  return [...essential, ...additional].map(r => r.id);
}

/**
 * Check if user has reached preference limits
 */
export function checkPreferenceLimits(preferences: UserReactionPreferences): {
  quickReactionsAtLimit: boolean;
  favoritesAtLimit: boolean;
} {
  return {
    quickReactionsAtLimit: (preferences.quick_reactions?.length || 0) >= REACTION_CONSTANTS.MAX_QUICK_REACTIONS,
    favoritesAtLimit: (preferences.favorite_reactions?.length || 0) >= REACTION_CONSTANTS.MAX_FAVORITE_REACTIONS,
  };
}

// ========== ACCESSIBILITY UTILITIES ==========

/**
 * Get ARIA label for reaction
 */
export function getReactionAriaLabel(reaction: PublicReaction, count?: number): string {
  const name = formatReactionName(reaction);
  const description = reaction.description ? `, ${reaction.description}` : '';
  const countText = count !== undefined ? `, ${count} reactions` : '';
  
  return `${name} reaction${description}${countText}`;
}

/**
 * Get accessibility description for reaction picker
 */
export function getReactionPickerAriaDescription(
  targetType: 'POST' | 'COMMENT',
  reactionCount: number
): string {
  const target = targetType.toLowerCase();
  return `Choose a reaction for this ${target}. Currently ${reactionCount} reactions on this ${target}.`;
}

// ========== EXPORT ALL UTILITIES ==========

export const ReactionUtils = {
  // Formatting
  formatReactionEmoji,
  formatReactionName,
  formatReactionDescription,
  formatReactionCount,
  formatPopularityScore,
  getCategoryDisplayName,
  getCategoryEmoji,
  getCategoryColor,
  
  // Sorting
  sortByPopularity,
  sortByName,
  sortByCategory,
  sortReactionSummariesByCount,
  applySorting,
  
  // Filtering
  filterByCategory,
  filterByPopularity,
  filterBySearch,
  filterTrendingOnly,
  applyFilters,
  
  // Grouping
  groupByCategory,
  groupByPopularityTier,
  getPopularReactionGroups,
  
  // Validation
  isValidReactionId,
  isValidCategory,
  isValidPopularityScore,
  validateFilters,
  
  // Analytics
  calculateReactionDiversity,
  getDominantReaction,
  calculateEngagementRate,
  getReactionSentiment,
  
  // User preferences
  getUserPreferredReactions,
  generateDefaultQuickReactions,
  checkPreferenceLimits,
  
  // Accessibility
  getReactionAriaLabel,
  getReactionPickerAriaDescription,
};