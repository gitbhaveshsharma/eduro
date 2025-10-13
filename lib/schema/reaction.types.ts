/**
 * Reaction System Schema Types
 * 
 * TypeScript interfaces and types for the reaction system
 * Based on the reactions table from 005_create_reaction.sql migration
 */

// Core reaction interface matching the database table
export interface Reaction {
  id: number; // SERIAL PRIMARY KEY
  name: string; // VARCHAR(50) NOT NULL UNIQUE
  emoji_unicode: string; // VARCHAR(10) NOT NULL
  category: 'positive' | 'negative' | 'neutral'; // VARCHAR(20) NOT NULL
  description: string | null; // TEXT
  popularity_score: number; // INT DEFAULT 50 (1-100 scale)
  created_at: string; // TIMESTAMP
  updated_at: string; // TIMESTAMP
}

// Public reaction interface (for displaying to users)
export interface PublicReaction {
  id: number;
  name: string;
  emoji_unicode: string;
  category: 'positive' | 'negative' | 'neutral';
  description: string | null;
  popularity_score: number;
  is_trending?: boolean; // Calculated field
}

// Reaction summary for posts/comments
export interface ReactionSummary {
  reaction_id: number;
  reaction_name: string;
  emoji_unicode: string;
  category: 'positive' | 'negative' | 'neutral';
  count: number;
  user_reacted: boolean; // Whether current user has this reaction
}

// Detailed reaction analytics for a specific target
export interface ReactionAnalytics {
  target_id: string;
  target_type: 'POST' | 'COMMENT';
  total_reactions: number;
  unique_users: number;
  reactions_breakdown: ReactionSummary[];
  trending_reactions: PublicReaction[]; // Top reactions by recent usage
  category_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

// Reaction filter options
export interface ReactionFilters {
  category?: 'positive' | 'negative' | 'neutral' | 'positive,negative' | 'positive,neutral' | 'negative,neutral' | 'all';
  popularity_min?: number; // Minimum popularity score
  popularity_max?: number; // Maximum popularity score
  is_trending?: boolean; // Only show trending reactions
  search_query?: string; // Search by name or description
  limit?: number; // Limit number of reactions returned
}

// Reaction sort options
export type ReactionSortField = 'popularity_score' | 'name' | 'created_at' | 'usage_count';
export type ReactionSortDirection = 'asc' | 'desc';

export interface ReactionSort {
  field: ReactionSortField;
  direction: ReactionSortDirection;
}

// Reaction operation results
export interface ReactionOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ReactionValidationError[];
}

// Reaction validation errors
export interface ReactionValidationError {
  field: keyof Reaction;
  message: string;
  code: string;
}

// Reaction usage statistics
export interface ReactionUsageStats {
  reaction_id: number;
  reaction_name: string;
  emoji_unicode: string;
  total_usage: number;
  usage_this_week: number;
  usage_this_month: number;
  trending_score: number; // Calculated trending score
  growth_rate: number; // Percentage growth from last period
}

// User reaction preferences
export interface UserReactionPreferences {
  user_id: string;
  favorite_reactions: number[]; // Array of reaction IDs
  quick_reactions: number[]; // Array of reaction IDs for quick access
  hidden_reactions: number[]; // Array of reaction IDs to hide
  custom_order: number[]; // Custom ordering of reaction IDs
  updated_at: string;
}

// Reaction search result
export interface ReactionSearchResult {
  reactions: PublicReaction[];
  total_count: number;
  filtered_count: number;
  trending_reactions: PublicReaction[];
  category_counts: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

// Real-time reaction event
export interface ReactionRealtimeEvent {
  event_type: 'REACTION_ADDED' | 'REACTION_REMOVED' | 'REACTION_UPDATED';
  target_type: 'POST' | 'COMMENT';
  target_id: string;
  user_id: string;
  reaction_id: number;
  reaction_name: string;
  emoji_unicode: string;
  timestamp: string;
}

// Reaction picker configuration
export interface ReactionPickerConfig {
  show_categories: boolean;
  show_search: boolean;
  show_trending: boolean;
  show_descriptions: boolean;
  max_quick_reactions: number;
  enable_skin_tones: boolean; // For future emoji skin tone support
  custom_reactions: PublicReaction[]; // Custom reactions for specific contexts
}

// Reaction constants
export const REACTION_CATEGORIES = {
  POSITIVE: 'positive' as const,
  NEGATIVE: 'negative' as const,
  NEUTRAL: 'neutral' as const,
} as const;

export const REACTION_SORT_FIELDS = {
  POPULARITY: 'popularity_score' as const,
  NAME: 'name' as const,
  CREATED_AT: 'created_at' as const,
  USAGE_COUNT: 'usage_count' as const,
} as const;

export const REACTION_CONSTANTS = {
  // Popularity score ranges
  MIN_POPULARITY_SCORE: 1,
  MAX_POPULARITY_SCORE: 100,
  DEFAULT_POPULARITY_SCORE: 50,
  
  // Trending thresholds
  TRENDING_SCORE_THRESHOLD: 80,
  TRENDING_GROWTH_THRESHOLD: 20, // 20% growth to be considered trending
  
  // Limits
  MAX_NAME_LENGTH: 50,
  MAX_EMOJI_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_QUICK_REACTIONS: 12,
  MAX_FAVORITE_REACTIONS: 20,
  
  // Cache settings
  CACHE_TTL: {
    REACTIONS_LIST: 3600, // 1 hour (reactions don't change often)
    REACTION_ANALYTICS: 300, // 5 minutes
    USER_PREFERENCES: 1800, // 30 minutes
    TRENDING_REACTIONS: 600, // 10 minutes
  },
  
  // API limits
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  MAX_SEARCH_RESULTS: 200,
} as const;

// Default reaction picker configuration
export const DEFAULT_REACTION_PICKER_CONFIG: ReactionPickerConfig = {
  show_categories: true,
  show_search: true,
  show_trending: true,
  show_descriptions: false,
  max_quick_reactions: 8,
  enable_skin_tones: false,
  custom_reactions: [],
};

// Popular reaction groups for easy access
export const POPULAR_REACTION_GROUPS = {
  ESSENTIAL: ['like', 'love', 'funny', 'fire'], // Most basic reactions
  GEN_Z: ['skull', 'crying_laugh', 'pleading', 'sparkles', 'nail_polish'], // Gen Z favorites
  ACADEMIC: ['brain', 'books', 'graduation', 'coffee', 'stress'], // Student/academic
  SOCIAL: ['tea', 'popcorn', 'eyes', 'chart_up', 'red_flag'], // Social media style
  EMOTIONAL: ['heart_hands', 'mending_heart', 'melting', 'relieved'], // Emotional support
} as const;

// Error codes for reaction operations
export const REACTION_ERROR_CODES = {
  // Authentication
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
  
  // Validation
  INVALID_REACTION_ID: 'INVALID_REACTION_ID',
  REACTION_NOT_FOUND: 'REACTION_NOT_FOUND',
  INVALID_TARGET: 'INVALID_TARGET',
  INVALID_CATEGORY: 'INVALID_CATEGORY',
  
  // Limits
  TOO_MANY_REACTIONS: 'TOO_MANY_REACTIONS',
  REACTION_LIMIT_EXCEEDED: 'REACTION_LIMIT_EXCEEDED',
  
  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

// Type exports for convenience
export type ReactionCategory = typeof REACTION_CATEGORIES[keyof typeof REACTION_CATEGORIES];
export type ReactionErrorCode = typeof REACTION_ERROR_CODES[keyof typeof REACTION_ERROR_CODES];
export type PopularReactionGroup = keyof typeof POPULAR_REACTION_GROUPS;