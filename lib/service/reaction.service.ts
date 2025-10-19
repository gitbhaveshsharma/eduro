/**
 * Reaction Service
 * 
 * Handles all reaction-related database operations and API interactions
 * Provides a clean interface for reaction CRUD operations, analytics, and user preferences
 */

import { createClient } from '../supabase/client';
import { withAuth } from '../api-interceptor';

// Initialize Supabase client
const supabase = createClient();
import type {
  Reaction,
  PublicReaction,
  ReactionSummary,
  ReactionAnalytics,
  ReactionFilters,
  ReactionSort,
  ReactionOperationResult,
  ReactionUsageStats,
  UserReactionPreferences,
  ReactionSearchResult,
  ReactionCategory,
} from '../schema/reaction.types';
import {
  REACTION_CONSTANTS,
  REACTION_ERROR_CODES,
  POPULAR_REACTION_GROUPS,
  REACTION_CATEGORIES,
} from '../schema/reaction.types';

export class ReactionService {
  
  // ========== REACTION CATALOG OPERATIONS ==========
  
  /**
   * Get all available reactions with optional filtering and sorting
   */
  static async getReactions(
    filters?: ReactionFilters,
    sort?: ReactionSort
  ): Promise<ReactionOperationResult<ReactionSearchResult>> {
    try {
      let query = supabase
        .from('reactions')
        .select('*');

      // Apply filters
      if (filters) {
        if (filters.category && filters.category !== 'all') {
          const categories = filters.category.split(',') as ReactionCategory[];
          query = query.in('category', categories);
        }

        if (filters.popularity_min !== undefined) {
          query = query.gte('popularity_score', filters.popularity_min);
        }

        if (filters.popularity_max !== undefined) {
          query = query.lte('popularity_score', filters.popularity_max);
        }

        if (filters.search_query) {
          query = query.or(`name.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%`);
        }
      }

      // Apply sorting
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        // Default sort by popularity
        query = query.order('popularity_score', { ascending: false });
      }

      // Apply limit
      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(REACTION_CONSTANTS.DEFAULT_PAGE_SIZE);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      // Process reactions and add trending flag
      const reactions: PublicReaction[] = (data || []).map(reaction => ({
        ...reaction,
        is_trending: reaction.popularity_score >= REACTION_CONSTANTS.TRENDING_SCORE_THRESHOLD,
      }));

      // Get trending reactions
      const trendingReactions = reactions.filter(r => r.is_trending);

      // Calculate category counts
      const categoryCounts = reactions.reduce(
        (counts, reaction) => {
          counts[reaction.category]++;
          return counts;
        },
        { positive: 0, negative: 0, neutral: 0 }
      );

      const result: ReactionSearchResult = {
        reactions,
        total_count: reactions.length,
        filtered_count: reactions.length,
        trending_reactions: trendingReactions,
        category_counts: categoryCounts,
      };

      return { success: true, data: result };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get reactions by category
   */
  static async getReactionsByCategory(
    category: ReactionCategory,
    limit?: number
  ): Promise<ReactionOperationResult<PublicReaction[]>> {
    const filters: ReactionFilters = {
      category,
      limit: limit || REACTION_CONSTANTS.DEFAULT_PAGE_SIZE,
    };

    const result = await this.getReactions(filters);
    
    if (result.success && result.data) {
      return { success: true, data: result.data.reactions };
    }

    return { success: false, error: result.error };
  }

  /**
   * Get trending reactions
   */
  static async getTrendingReactions(limit: number = 20): Promise<ReactionOperationResult<PublicReaction[]>> {
    const filters: ReactionFilters = {
      popularity_min: REACTION_CONSTANTS.TRENDING_SCORE_THRESHOLD,
      limit,
    };

    const sort: ReactionSort = {
      field: 'popularity_score',
      direction: 'desc',
    };

    const result = await this.getReactions(filters, sort);
    
    if (result.success && result.data) {
      return { success: true, data: result.data.reactions };
    }

    return { success: false, error: result.error };
  }

  /**
   * Get popular reaction groups
   */
  static async getPopularReactionGroups(): Promise<ReactionOperationResult<Record<string, PublicReaction[]>>> {
    try {
      const groups: Record<string, PublicReaction[]> = {};

      for (const [groupName, reactionNames] of Object.entries(POPULAR_REACTION_GROUPS)) {
        const { data, error } = await supabase
          .from('reactions')
          .select('*')
          .in('name', reactionNames)
          .order('popularity_score', { ascending: false });

        if (error) {
          return { success: false, error: error.message };
        }

        groups[groupName.toLowerCase()] = (data || []).map(reaction => ({
          ...reaction,
          is_trending: reaction.popularity_score >= REACTION_CONSTANTS.TRENDING_SCORE_THRESHOLD,
        }));
      }

      return { success: true, data: groups };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search reactions by query
   */
  static async searchReactions(
    query: string,
    limit: number = 50
  ): Promise<ReactionOperationResult<PublicReaction[]>> {
    const filters: ReactionFilters = {
      search_query: query,
      limit,
    };

    const result = await this.getReactions(filters);
    
    if (result.success && result.data) {
      return { success: true, data: result.data.reactions };
    }

    return { success: false, error: result.error };
  }

  // ========== REACTION ANALYTICS OPERATIONS ==========

  /**
   * Get reaction analytics for a specific target (post or comment)
   */
  static async getReactionAnalytics(
    targetType: 'POST' | 'COMMENT',
    targetId: string
  ): Promise<ReactionOperationResult<ReactionAnalytics>> {
    try {
      // Get reaction summary with counts
      const { data: reactionData, error: reactionError } = await supabase
        .from('post_reactions')
        .select(`
          reaction_id,
          user_id,
          reactions!inner(
            name,
            emoji_unicode,
            category
          )
        `)
        .eq('target_type', targetType)
        .eq('target_id', targetId);

      if (reactionError) {
        return { success: false, error: reactionError.message };
      }

      // Get user's reactions if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      const userReactionIds = new Set<number>();

      if (user) {
        const { data: userReactions } = await supabase
          .from('post_reactions')
          .select('reaction_id')
          .eq('target_type', targetType)
          .eq('target_id', targetId)
          .eq('user_id', user.id);

        userReactions?.forEach(ur => userReactionIds.add(ur.reaction_id));
      }

      // Process reaction counts
      const reactionCounts = new Map<number, { count: number; reaction: any }>();
      
      reactionData?.forEach(item => {
        const reactionId = item.reaction_id;
        if (reactionCounts.has(reactionId)) {
          reactionCounts.get(reactionId)!.count++;
        } else {
          reactionCounts.set(reactionId, {
            count: 1,
            reaction: item.reactions,
          });
        }
      });

      // Create reaction summary
      const reactionsBreakdown: ReactionSummary[] = Array.from(reactionCounts.entries()).map(
        ([reactionId, { count, reaction }]) => ({
          reaction_id: reactionId,
          reaction_name: reaction.name,
          emoji_unicode: reaction.emoji_unicode,
          category: reaction.category,
          count,
          user_reacted: userReactionIds.has(reactionId),
        })
      );

      // Sort by count (most popular first)
      reactionsBreakdown.sort((a, b) => b.count - a.count);

      // Calculate category distribution
      const categoryDistribution = reactionsBreakdown.reduce(
        (dist, reaction) => {
          dist[reaction.category] += reaction.count;
          return dist;
        },
        { positive: 0, negative: 0, neutral: 0 }
      );

      // Get trending reactions (top reactions by recent usage)
      const trendingResult = await this.getTrendingReactions(10);
      const trendingReactions = trendingResult.success ? trendingResult.data || [] : [];

      const analytics: ReactionAnalytics = {
        target_id: targetId,
        target_type: targetType,
        total_reactions: reactionData?.length || 0,
        unique_users: new Set(reactionData?.map(r => r.user_id) || []).size,
        reactions_breakdown: reactionsBreakdown,
        trending_reactions: trendingReactions,
        category_distribution: categoryDistribution,
      };

      return { success: true, data: analytics };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get reaction usage statistics
   */
  static async getReactionUsageStats(): Promise<ReactionOperationResult<ReactionUsageStats[]>> {
    try {
      const { data, error } = await supabase.rpc('get_reaction_usage_stats');

      if (error) {
        // If RPC doesn't exist, fall back to manual calculation
        return this.calculateReactionUsageStats();
      }

      return { success: true, data: data || [] };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fallback method to calculate reaction usage stats manually
   */
  private static async calculateReactionUsageStats(): Promise<ReactionOperationResult<ReactionUsageStats[]>> {
    try {
      // Get all reactions
      const { data: reactions, error: reactionsError } = await supabase
        .from('reactions')
        .select('*');

      if (reactionsError) {
        return { success: false, error: reactionsError.message };
      }

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stats: ReactionUsageStats[] = [];

      for (const reaction of reactions || []) {
        // Get total usage
        const { count: totalUsage } = await supabase
          .from('post_reactions')
          .select('id', { count: 'exact' })
          .eq('reaction_id', reaction.id);

        // Get usage this week
        const { count: usageThisWeek } = await supabase
          .from('post_reactions')
          .select('id', { count: 'exact' })
          .eq('reaction_id', reaction.id)
          .gte('created_at', weekAgo.toISOString());

        // Get usage this month
        const { count: usageThisMonth } = await supabase
          .from('post_reactions')
          .select('id', { count: 'exact' })
          .eq('reaction_id', reaction.id)
          .gte('created_at', monthAgo.toISOString());

        // Calculate trending score (simplified)
        const trendingScore = Math.min(100, 
          (reaction.popularity_score * 0.7) + 
          ((usageThisWeek || 0) * 0.3)
        );

        // Calculate growth rate (simplified)
        const growthRate = usageThisWeek && usageThisMonth ? 
          ((usageThisWeek * 4) / usageThisMonth - 1) * 100 : 0;

        stats.push({
          reaction_id: reaction.id,
          reaction_name: reaction.name,
          emoji_unicode: reaction.emoji_unicode,
          total_usage: totalUsage || 0,
          usage_this_week: usageThisWeek || 0,
          usage_this_month: usageThisMonth || 0,
          trending_score: trendingScore,
          growth_rate: growthRate,
        });
      }

      // Sort by trending score
      stats.sort((a, b) => b.trending_score - a.trending_score);

      return { success: true, data: stats };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ========== USER PREFERENCE OPERATIONS ==========

  /**
   * Get user's reaction preferences
   */
  static async getUserReactionPreferences(): Promise<ReactionOperationResult<UserReactionPreferences | null>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: REACTION_ERROR_CODES.NOT_AUTHENTICATED };
      }

      const { data, error } = await supabase
        .from('user_reaction_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || null };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update user's reaction preferences
   */
  static async updateUserReactionPreferences(
    preferences: Partial<Omit<UserReactionPreferences, 'user_id' | 'updated_at'>>
  ): Promise<ReactionOperationResult<UserReactionPreferences>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: REACTION_ERROR_CODES.NOT_AUTHENTICATED };
      }

      const updateData = {
        ...preferences,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('user_reaction_preferences')
        .upsert(updateData)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user's quick reactions (for UI shortcuts)
   */
  static async getUserQuickReactions(): Promise<ReactionOperationResult<PublicReaction[]>> {
    try {
      const prefsResult = await this.getUserReactionPreferences();
      
      if (!prefsResult.success || !prefsResult.data?.quick_reactions) {
        // Return default quick reactions if no preferences
        return this.getReactionsByCategory(REACTION_CATEGORIES.POSITIVE, 8);
      }

      const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .in('id', prefsResult.data.quick_reactions)
        .order('popularity_score', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const reactions: PublicReaction[] = (data || []).map(reaction => ({
        ...reaction,
        is_trending: reaction.popularity_score >= REACTION_CONSTANTS.TRENDING_SCORE_THRESHOLD,
      }));

      return { success: true, data: reactions };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ========== UTILITY METHODS ==========

  /**
   * Get reaction by ID
   */
  static async getReactionById(id: number): Promise<ReactionOperationResult<PublicReaction | null>> {
    try {
      const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: true, data: null };
      }

      const reaction: PublicReaction = {
        ...data,
        is_trending: data.popularity_score >= REACTION_CONSTANTS.TRENDING_SCORE_THRESHOLD,
      };

      return { success: true, data: reaction };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get reaction by name
   */
  static async getReactionByName(name: string): Promise<ReactionOperationResult<PublicReaction | null>> {
    try {
      const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .eq('name', name)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: true, data: null };
      }

      const reaction: PublicReaction = {
        ...data,
        is_trending: data.popularity_score >= REACTION_CONSTANTS.TRENDING_SCORE_THRESHOLD,
      };

      return { success: true, data: reaction };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate reaction ID exists
   */
  static async validateReactionId(reactionId: number): Promise<boolean> {
    const result = await this.getReactionById(reactionId);
    return result.success && result.data !== null;
  }
}