/**
 * Post Reaction Service
 * 
 * Dedicated service for managing real-time post and comment reactions
 * Handles WebSocket subscriptions to the post_reactions table
 * Provides clean interfaces for reaction queries and real-time updates
 */

import { supabase } from '../supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { PostOperationResult } from '../schema/post.types';

// Types for reaction data
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

export interface ReactionUpdate {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  targetType: 'POST' | 'COMMENT';
  targetId: string;
  reaction?: UserReaction;
  oldReaction?: UserReaction;
}

export type ReactionUpdateCallback = (update: ReactionUpdate) => void;

/**
 * Post Reaction Service
 * Manages real-time subscriptions and queries for post/comment reactions
 */
export class PostReactionService {
  private static activeChannels: Map<string, RealtimeChannel> = new Map();
  private static subscriptionCallbacks: Map<string, Set<ReactionUpdateCallback>> = new Map();

  // ========== QUERY OPERATIONS ==========

  /**
   * Get user's reaction for a specific target
   */
  static async getUserReaction(
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
        console.error('Error fetching user reaction:', error);
        return { success: false, error: error.message };
      }

      // Transform the nested reaction data
      if (data && data.reaction) {
        const reaction = Array.isArray(data.reaction) ? data.reaction[0] : data.reaction;
        return {
          success: true,
          data: {
            ...data,
            reaction
          } as UserReaction
        };
      }

      return { success: true, data: null };
    } catch (error) {
      console.error('Error in getUserReaction:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get all reactions for a specific target (for analytics)
   */
  static async getTargetReactions(
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
        console.error('Error fetching target reactions:', error);
        return { success: false, error: error.message };
      }

      // Transform nested reaction data
      const reactions = (data || []).map(item => ({
        ...item,
        reaction: Array.isArray(item.reaction) ? item.reaction[0] : item.reaction
      })) as UserReaction[];

      return { success: true, data: reactions };
    } catch (error) {
      console.error('Error in getTargetReactions:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ========== REAL-TIME SUBSCRIPTION OPERATIONS ==========

  /**
   * Subscribe to reaction changes for a specific target
   * Handles INSERT, UPDATE, and DELETE events
   */
  static subscribeToTarget(
    targetType: 'POST' | 'COMMENT',
    targetId: string,
    callback: ReactionUpdateCallback
  ): () => void {
    const channelKey = `${targetType}:${targetId}`;
    
    // Add callback to the set
    if (!this.subscriptionCallbacks.has(channelKey)) {
      this.subscriptionCallbacks.set(channelKey, new Set());
    }
    this.subscriptionCallbacks.get(channelKey)!.add(callback);

    // Create channel if it doesn't exist
    if (!this.activeChannels.has(channelKey)) {
      this.createChannel(targetType, targetId, channelKey);
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribeCallback(channelKey, callback);
    };
  }

  /**
   * Create and setup a real-time channel for a target
   */
  private static createChannel(
    targetType: 'POST' | 'COMMENT',
    targetId: string,
    channelKey: string
  ): void {
    console.log(`[PostReactionService] Creating channel for ${channelKey}`);

    const channel = supabase
      .channel(`post_reactions_${channelKey}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_reactions',
          filter: `target_id=eq.${targetId}`
        },
        (payload) => {
          console.log(`[PostReactionService] INSERT event:`, payload);
          this.handleReactionChange('INSERT', targetType, targetId, payload.new as any);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'post_reactions',
          filter: `target_id=eq.${targetId}`
        },
        (payload) => {
          console.log(`[PostReactionService] UPDATE event:`, payload);
          this.handleReactionChange('UPDATE', targetType, targetId, payload.new as any, payload.old as any);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'post_reactions',
          filter: `target_id=eq.${targetId}`
        },
        (payload) => {
          console.log(`[PostReactionService] DELETE event:`, payload);
          this.handleReactionChange('DELETE', targetType, targetId, undefined, payload.old as any);
        }
      )
      .subscribe((status) => {
        console.log(`[PostReactionService] Channel ${channelKey} status:`, status);
        
        if (status === 'CHANNEL_ERROR') {
          console.error(`[PostReactionService] Channel error for ${channelKey}`);
          // Attempt to reconnect after a delay
          setTimeout(() => {
            this.reconnectChannel(targetType, targetId, channelKey);
          }, 2000);
        }
      });

    this.activeChannels.set(channelKey, channel);
  }

  /**
   * Handle reaction change events and notify callbacks
   */
  private static handleReactionChange(
    eventType: 'INSERT' | 'UPDATE' | 'DELETE',
    targetType: 'POST' | 'COMMENT',
    targetId: string,
    newData?: any,
    oldData?: any
  ): void {
    const channelKey = `${targetType}:${targetId}`;
    const callbacks = this.subscriptionCallbacks.get(channelKey);

    if (!callbacks || callbacks.size === 0) {
      return;
    }

    const update: ReactionUpdate = {
      eventType,
      targetType,
      targetId,
      reaction: newData as UserReaction,
      oldReaction: oldData as UserReaction,
    };

    // Notify all callbacks
    callbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('[PostReactionService] Error in callback:', error);
      }
    });
  }

  /**
   * Reconnect a channel after an error
   */
  private static reconnectChannel(
    targetType: 'POST' | 'COMMENT',
    targetId: string,
    channelKey: string
  ): void {
    console.log(`[PostReactionService] Reconnecting channel ${channelKey}`);
    
    // Remove old channel
    const oldChannel = this.activeChannels.get(channelKey);
    if (oldChannel) {
      supabase.removeChannel(oldChannel);
      this.activeChannels.delete(channelKey);
    }

    // Only recreate if there are still active callbacks
    if (this.subscriptionCallbacks.has(channelKey) && 
        this.subscriptionCallbacks.get(channelKey)!.size > 0) {
      this.createChannel(targetType, targetId, channelKey);
    }
  }

  /**
   * Unsubscribe a specific callback
   */
  private static unsubscribeCallback(channelKey: string, callback: ReactionUpdateCallback): void {
    const callbacks = this.subscriptionCallbacks.get(channelKey);
    if (callbacks) {
      callbacks.delete(callback);

      // If no more callbacks, remove the channel
      if (callbacks.size === 0) {
        this.subscriptionCallbacks.delete(channelKey);
        this.removeChannel(channelKey);
      }
    }
  }

  /**
   * Remove a channel and clean up
   */
  private static removeChannel(channelKey: string): void {
    const channel = this.activeChannels.get(channelKey);
    if (channel) {
      console.log(`[PostReactionService] Removing channel ${channelKey}`);
      supabase.removeChannel(channel);
      this.activeChannels.delete(channelKey);
    }
  }

  /**
   * Unsubscribe from all targets (cleanup utility)
   */
  static unsubscribeAll(): void {
    console.log('[PostReactionService] Unsubscribing from all channels');
    
    this.activeChannels.forEach((channel, key) => {
      supabase.removeChannel(channel);
    });
    
    this.activeChannels.clear();
    this.subscriptionCallbacks.clear();
  }

  /**
   * Get active channel count (for debugging)
   */
  static getActiveChannelCount(): number {
    return this.activeChannels.size;
  }

  /**
   * Get active subscription count (for debugging)
   */
  static getActiveSubscriptionCount(): number {
    let count = 0;
    this.subscriptionCallbacks.forEach(callbacks => {
      count += callbacks.size;
    });
    return count;
  }

  /**
   * Get channel status (for debugging)
   */
  static getChannelStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    this.activeChannels.forEach((channel, key) => {
      status[key] = {
        state: channel.state,
        callbackCount: this.subscriptionCallbacks.get(key)?.size || 0
      };
    });
    
    return status;
  }
}

export default PostReactionService;
