'use client';

/**
 * Connection Hooks
 * 
 * Custom React hooks for connection operations.
 * Provides convenient access to connection functionality with proper state management.
 */

import { useCallback, useEffect } from 'react';
import { 
  useFollowStore,
  useIsFollowing,
  useIsFollowedBy,
  useFollowLoading,
  useUnfollowLoading,
  useHasPendingRequest,
  useFollowStats,
  FollowAPI,
} from '@/lib/follow';
import type { FollowerProfile } from '@/lib/follow';

/**
 * Hook for connection operations
 */
export function useConnection(targetUserId: string) {
  const { followUser, unfollowUser, getFollowStatus } = useFollowStore();
  const isConnected = useIsFollowing(targetUserId);
  const isConnecting = useFollowLoading(targetUserId);
  const isDisconnecting = useUnfollowLoading(targetUserId);
  const hasPendingRequest = useHasPendingRequest(targetUserId);

  const connect = useCallback(async () => {
    return await followUser({
      following_id: targetUserId,
      notification_enabled: true,
    });
  }, [targetUserId, followUser]);

  const disconnect = useCallback(async () => {
    return await unfollowUser({
      following_id: targetUserId,
    });
  }, [targetUserId, unfollowUser]);

  const checkStatus = useCallback(async () => {
    return await getFollowStatus(targetUserId, false);
  }, [targetUserId, getFollowStatus]);

  return {
    isConnected,
    isConnecting,
    isDisconnecting,
    hasPendingRequest,
    isLoading: isConnecting || isDisconnecting,
    connect,
    disconnect,
    checkStatus,
  };
}

/**
 * Hook for managing connection data
 */
export function useConnections(userId?: string) {
  const { loadFollowers, loadFollowing, loadStats } = useFollowStore();

  const loadConnectionData = useCallback(async (refresh: boolean = false) => {
    await Promise.all([
      loadFollowers(userId, undefined, undefined, 1, refresh),
      loadFollowing(userId, undefined, undefined, 1, refresh),
      loadStats(userId, refresh),
    ]);
  }, [userId, loadFollowers, loadFollowing, loadStats]);

  useEffect(() => {
    loadConnectionData(false);
  }, [loadConnectionData]);

  const refreshConnections = useCallback(() => {
    return loadConnectionData(true);
  }, [loadConnectionData]);

  return {
    loadConnectionData,
    refreshConnections,
  };
}

/**
 * Hook for connection requests management
 */
export function useConnectionRequests() {
  const { 
    loadReceivedRequests, 
    loadSentRequests, 
    respondToFollowRequest, 
    cancelFollowRequest 
  } = useFollowStore();

  const acceptRequest = useCallback(async (requestId: string) => {
    return await respondToFollowRequest({
      request_id: requestId,
      status: 'accepted',
    });
  }, [respondToFollowRequest]);

  const rejectRequest = useCallback(async (requestId: string) => {
    return await respondToFollowRequest({
      request_id: requestId,
      status: 'rejected',
    });
  }, [respondToFollowRequest]);

  const cancelRequest = useCallback(async (targetUserId: string) => {
    return await cancelFollowRequest(targetUserId);
  }, [cancelFollowRequest]);

  const loadRequests = useCallback(async (refresh: boolean = false) => {
    await Promise.all([
      loadReceivedRequests(undefined, undefined, 1, refresh),
      loadSentRequests(undefined, undefined, 1, refresh),
    ]);
  }, [loadReceivedRequests, loadSentRequests]);

  useEffect(() => {
    loadRequests(false);
  }, [loadRequests]);

  const refreshRequests = useCallback(() => {
    return loadRequests(true);
  }, [loadRequests]);

  return {
    acceptRequest,
    rejectRequest,
    cancelRequest,
    loadRequests,
    refreshRequests,
  };
}

/**
 * Hook for connection suggestions
 */
export function useConnectionSuggestions(limit: number = 10) {
  const { loadSuggestions } = useFollowStore();

  const loadSuggestionsData = useCallback(async (refresh: boolean = false) => {
    await loadSuggestions(limit, refresh);
  }, [limit, loadSuggestions]);

  useEffect(() => {
    loadSuggestionsData(false);
  }, [loadSuggestionsData]);

  const refreshSuggestions = useCallback(() => {
    return loadSuggestionsData(true);
  }, [loadSuggestionsData]);

  return {
    loadSuggestions: loadSuggestionsData,
    refreshSuggestions,
  };
}

/**
 * Hook for mutual connections
 */
export function useMutualConnection(targetUserId: string) {
  const isConnected = useIsFollowing(targetUserId);
  const isConnectedBy = useIsFollowedBy(targetUserId);
  const isMutual = isConnected && isConnectedBy;

  return {
    isConnected,
    isConnectedBy,
    isMutual,
  };
}

/**
 * Hook to initialize connection system
 */
export function useInitializeConnections() {
  useEffect(() => {
    FollowAPI.initialize();
  }, []);
}

/**
 * Hook for connection statistics
 */
export function useConnectionStats(userId?: string) {
  const { loadStats } = useFollowStore();
  const stats = useFollowStats();

  useEffect(() => {
    loadStats(userId, false);
  }, [userId]);

  const refreshStats = useCallback(() => {
    return loadStats(userId, true);
  }, [userId, loadStats]);

  return {
    stats,
    refreshStats,
  };
}

/**
 * Hook to check if user can connect with target
 */
export function useCanConnect(
  currentUser?: FollowerProfile,
  targetUser?: FollowerProfile
) {
  const isConnected = useIsFollowing(targetUser?.id || '');
  const hasPendingRequest = useHasPendingRequest(targetUser?.id || '');

  if (!currentUser || !targetUser) {
    return false;
  }

  // Can't connect with yourself
  if (currentUser.id === targetUser.id) {
    return false;
  }

  // Can't connect if already connected or request pending
  if (isConnected || hasPendingRequest) {
    return false;
  }

  return true;
}
