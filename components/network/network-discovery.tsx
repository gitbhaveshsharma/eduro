'use client';

/**
 * Network Discovery Component - Refactored & Optimized
 * 
 * Modular, responsive component for discovering and connecting with users.
 * Fixed infinite loop issues with stable callbacks and proper dependency management.
 * Does not fetch or use current user profile data.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Users } from 'lucide-react';
import { ProfileAPI } from '@/lib/profile';
import { ProfileDisplayUtils, ProfileUrlUtils } from '@/lib/utils/profile.utils';
import type { ProfileFilters, ProfileSort, PublicProfile } from '@/lib/schema/profile.types';
import type { FollowerProfile } from '@/lib/follow';
import { useFollowStore } from '@/lib/follow';
import { cn } from '@/lib/utils';

// Import sub-components
import { ProfileGrid } from './network-profile-grid';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from './network-empty-state';
import { LoadMoreButton } from './network-load-more-button';

interface NetworkDiscoveryProps {
    className?: string;
    initialProfiles?: any[];
    // Props from parent (network page)
    searchQuery?: string;
    selectedRole?: string;
    selectedSort?: string;
    showVerifiedOnly?: boolean;
    showOnlineOnly?: boolean;
    onTotalCountChange?: (count: number) => void;
    onLoadingChange?: (loading: boolean) => void;
}

export function NetworkDiscovery({
    className,
    initialProfiles = [],
    searchQuery: externalSearchQuery = '',
    selectedRole: externalSelectedRole = 'all',
    selectedSort: externalSelectedSort = 'created_at:desc',
    showVerifiedOnly: externalShowVerifiedOnly = false,
    showOnlineOnly: externalShowOnlineOnly = false,
    onTotalCountChange,
    onLoadingChange,
}: NetworkDiscoveryProps) {
    // State
    // Initialize profiles from server-provided initial data when available
    const [profiles, setProfiles] = useState<FollowerProfile[]>(() => (initialProfiles as FollowerProfile[]) || []);
    const [isLoading, setIsLoading] = useState(profiles.length === 0);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [hasInitialLoad, setHasInitialLoad] = useState(false); // Track if we've done initial load
    const [connectionStateReady, setConnectionStateReady] = useState(false); // Track if connection state is loaded

    // Refs for lifecycle and callbacks
    const searchTimerRef = useRef<NodeJS.Timeout>();
    const isMounted = useRef(false); // Ref to track mount status
    const onLoadingChangeRef = useRef(onLoadingChange);
    const onTotalCountChangeRef = useRef(onTotalCountChange);

    // Update callback refs when props change
    useEffect(() => {
        onLoadingChangeRef.current = onLoadingChange;
        onTotalCountChangeRef.current = onTotalCountChange;
    }, [onLoadingChange, onTotalCountChange]);

    /**
     * Effect: Pre-load connection state (sent requests) on mount
     * This ensures the ConnectionButton shows the correct state without flickering
     */
    useEffect(() => {
        const loadConnectionState = async () => {
            try {
                const store = useFollowStore.getState();
                await store.loadSentRequests(undefined, undefined, 1, false);
                setConnectionStateReady(true);
            } catch (error) {
                console.error('Failed to load connection state:', error);
                // Still set ready to true to show cards even if loading fails
                setConnectionStateReady(true);
            }
        };

        loadConnectionState();
    }, []);

    /**
     * Fetch profiles with filters
     * Stable callback with empty dependencies - all values passed as parameters
     */
    const fetchProfiles = useCallback(async (
        page: number,
        append: boolean,
        searchQuery: string,
        selectedRole: string,
        selectedSort: string,
        showVerifiedOnly: boolean,
        showOnlineOnly: boolean
    ) => {
        console.log('🔵 NetworkDiscovery - Fetching profiles:', {
            page,
            append,
            searchQuery,
            selectedRole,
            selectedSort,
            showVerifiedOnly,
            showOnlineOnly,
        });

        setIsLoading(true);
        onLoadingChangeRef.current?.(true);

        try {
            // Build filters
            const profileFilters: ProfileFilters = {};

            // Only add filters if they have meaningful values
            if (searchQuery && searchQuery.trim()) {
                profileFilters.search_query = searchQuery.trim();
            }

            if (selectedRole && selectedRole !== 'all') {
                profileFilters.role = selectedRole as any;
            }

            if (showVerifiedOnly === true) {
                profileFilters.is_verified = true;
            }

            if (showOnlineOnly === true) {
                profileFilters.is_online = true;
            }

            // Parse sort
            const [field, direction] = selectedSort.split(':');
            const sort: ProfileSort = {
                field: field as any,
                direction: direction as 'asc' | 'desc',
            };

            console.log('🔵 NetworkDiscovery - Calling API with:', { profileFilters, sort, page });

            // Fetch from API - now returns direct result instead of store state
            const result = await ProfileAPI.searchProfiles(profileFilters, sort, page, 20);

            console.log('🔵 NetworkDiscovery - API response:', {
                profileCount: result?.profiles?.length || 0,
                totalCount: result?.total_count || 0,
                hasMore: result?.has_more || false,
            });

            if (result) {
                // Convert profiles inline
                const convertedProfiles = (result.profiles || []).map((profile: PublicProfile): FollowerProfile => ({
                    id: profile.id,
                    username: profile.username,
                    bio: profile.bio || '',
                    full_name: profile.full_name || ProfileDisplayUtils.getDisplayName(profile),
                    avatar_url: ProfileUrlUtils.getAvatarUrl(profile),
                    role: profile.role,
                    is_verified: profile.is_verified || false,
                    is_online: profile.is_online || false,
                    follower_count: 0,
                    following_count: 0,
                    created_at: profile.created_at,
                }));

                // Update state
                if (append) {
                    setProfiles(prev => [...prev, ...convertedProfiles]);
                } else {
                    setProfiles(convertedProfiles);
                }

                const count = result.total_count || convertedProfiles.length;
                setTotalCount(count);
                onTotalCountChangeRef.current?.(count);
                setHasMore(Boolean(result.has_more));
                setCurrentPage(page);

                console.log('🔵 NetworkDiscovery - State updated:', {
                    profilesCount: convertedProfiles.length,
                    totalCount: count,
                    hasMore: result.has_more,
                });
            }
        } catch (error) {
            console.error('🔴 NetworkDiscovery - Failed to fetch profiles:', error);

            // Clear profiles on error if not appending
            if (!append) {
                setProfiles([]);
                setTotalCount(0);
                setHasMore(false);
            }
        } finally {
            setIsLoading(false);
            onLoadingChangeRef.current?.(false);
        }
    }, []); // ✅ Empty dependencies - function is stable

    /**
     * Effect: Initial load - fetch profiles on mount if no initial data provided
     */
    useEffect(() => {
        // Only run once on mount
        if (hasInitialLoad) return;

        console.log('🟢 NetworkDiscovery - Initial mount check:', {
            hasInitialProfiles: initialProfiles.length > 0,
            profilesInState: profiles.length,
        });

        // If we have no profiles from server, fetch immediately on client
        if (profiles.length === 0) {
            console.log('🟢 NetworkDiscovery - No initial profiles, fetching on client...');
            fetchProfiles(
                1,
                false,
                externalSearchQuery,
                externalSelectedRole,
                externalSelectedSort,
                externalShowVerifiedOnly,
                externalShowOnlineOnly
            );
        }

        setHasInitialLoad(true);
    }, []); // Run only once on mount

    /**
     * Effect: Handle filter changes with debouncing for search
     */
    useEffect(() => {
        // Skip initial mount - let the initial load effect handle it
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        // console.log('🟡 NetworkDiscovery (effect) - Filters changed (effect), current values:', {
        //     searchQuery: externalSearchQuery,
        //     role: externalSelectedRole,
        //     sort: externalSelectedSort,
        //     verified: externalShowVerifiedOnly,
        //     online: externalShowOnlineOnly,
        // });

        // Clear existing timer
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        // Debounce search queries, fetch immediately for other filters
        if (externalSearchQuery) {
            searchTimerRef.current = setTimeout(() => {
                console.log('🟡 NetworkDiscovery - Search debounce completed, fetching...');
                fetchProfiles(
                    1, // Always reset to page 1 when filters change
                    false, // Don't append, replace results
                    externalSearchQuery,
                    externalSelectedRole,
                    externalSelectedSort,
                    externalShowVerifiedOnly,
                    externalShowOnlineOnly
                );
            }, 500);
        } else {
            console.log('🟡 NetworkDiscovery - Fetching immediately (no search query)');
            fetchProfiles(
                1, // Always reset to page 1 when filters change
                false, // Don't append, replace results
                externalSearchQuery,
                externalSelectedRole,
                externalSelectedSort,
                externalShowVerifiedOnly,
                externalShowOnlineOnly
            );
        }

        // Cleanup timer on unmount or filter change
        return () => {
            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current);
            }
        };
    }, [
        externalSearchQuery,
        externalSelectedRole,
        externalSelectedSort,
        externalShowVerifiedOnly,
        externalShowOnlineOnly,
        fetchProfiles, // ✅ Safe - fetchProfiles is stable
    ]);

    /**
     * Handler: Load more profiles (pagination)
     */
    const handleLoadMore = useCallback(() => {
        if (isLoading || !hasMore) return;

        console.log('🟢 NetworkDiscovery - Loading more profiles...');
        fetchProfiles(
            currentPage + 1,
            true,
            externalSearchQuery,
            externalSelectedRole,
            externalSelectedSort,
            externalShowVerifiedOnly,
            externalShowOnlineOnly
        );
    }, [
        currentPage,
        isLoading,
        hasMore,
        externalSearchQuery,
        externalSelectedRole,
        externalSelectedSort,
        externalShowVerifiedOnly,
        externalShowOnlineOnly,
        fetchProfiles,
    ]);

    /**
     * Handler: Connection state changed (follow/unfollow)
     * Refresh the current page to update connection status
     */
    const handleConnectionChange = useCallback(() => {
        console.log('🟢 NetworkDiscovery - Connection changed, refreshing...');
        fetchProfiles(
            1,
            false,
            externalSearchQuery,
            externalSelectedRole,
            externalSelectedSort,
            externalShowVerifiedOnly,
            externalShowOnlineOnly
        );
    }, [
        externalSearchQuery,
        externalSelectedRole,
        externalSelectedSort,
        externalShowVerifiedOnly,
        externalShowOnlineOnly,
        fetchProfiles,
    ]);

    // Render
    return (
        <div className={cn('space-y-4 sm:space-y-6', className)}>
            {/* Loading State */}
            {isLoading && profiles.length === 0 ? (
                <LoadingSpinner
                    message="Finding users that match your criteria..."
                    size="lg"
                    variant="primary"
                />
            ) : profiles.length === 0 ? (
                /* Empty State */
                <EmptyState
                    icon={Users}
                    title="No users found"
                    description="Try adjusting your filters or search query to find more people in the network."
                />
            ) : (
                /* Results */
                <>
                    <ProfileGrid
                        profiles={profiles}
                        onConnectionChange={handleConnectionChange}
                        connectionStateReady={connectionStateReady}
                    />

                    {/* Load More Button */}
                    {hasMore && (
                        <LoadMoreButton
                            isLoading={isLoading}
                            currentCount={profiles.length}
                            totalCount={totalCount}
                            onClick={handleLoadMore}
                        />
                    )}
                </>
            )}
        </div>
    );
}
