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
import { cn } from '@/lib/utils';

// Import sub-components
import { ProfileGrid } from './network-profile-grid';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from './network-empty-state';
import { LoadMoreButton } from './network-load-more-button';

interface NetworkDiscoveryProps {
    className?: string;
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
    searchQuery: externalSearchQuery = '',
    selectedRole: externalSelectedRole = 'all',
    selectedSort: externalSelectedSort = 'created_at:desc',
    showVerifiedOnly: externalShowVerifiedOnly = false,
    showOnlineOnly: externalShowOnlineOnly = false,
    onTotalCountChange,
    onLoadingChange,
}: NetworkDiscoveryProps) {
    // State
    const [profiles, setProfiles] = useState<FollowerProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Refs for lifecycle and callbacks
    const searchTimerRef = useRef<NodeJS.Timeout>();
    const isMountedRef = useRef(true);
    const onLoadingChangeRef = useRef(onLoadingChange);
    const onTotalCountChangeRef = useRef(onTotalCountChange);

    // Update callback refs when props change
    useEffect(() => {
        onLoadingChangeRef.current = onLoadingChange;
        onTotalCountChangeRef.current = onTotalCountChange;
    }, [onLoadingChange, onTotalCountChange]);

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
        if (!isMountedRef.current) return;

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
            const profileFilters: ProfileFilters = {
                search_query: searchQuery || undefined,
                role: selectedRole !== 'all' ? selectedRole as any : undefined,
                is_verified: showVerifiedOnly || undefined,
                is_online: showOnlineOnly || undefined,
            };

            // Parse sort
            const [field, direction] = selectedSort.split(':');
            const sort: ProfileSort = {
                field: field as any,
                direction: direction as 'asc' | 'desc',
            };

            console.log('🔵 NetworkDiscovery - Calling API with:', { profileFilters, sort, page });

            // Fetch from API
            const result = await ProfileAPI.searchProfiles(profileFilters, sort, page, 20);

            console.log('🔵 NetworkDiscovery - API response:', {
                profileCount: result?.profiles?.length || 0,
                totalCount: result?.total_count || 0,
                hasMore: result?.has_more || false,
            });

            if (result && isMountedRef.current) {
                // Convert profiles inline
                const convertedProfiles = (result.profiles || []).map((profile: PublicProfile): FollowerProfile => ({
                    id: profile.id,
                    username: profile.username,
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
            if (!append && isMountedRef.current) {
                setProfiles([]);
                setTotalCount(0);
                setHasMore(false);
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
                onLoadingChangeRef.current?.(false);
            }
        }
    }, []); // ✅ Empty dependencies - function is stable

    /**
     * Effect: Handle filter changes with debouncing for search
     */
    useEffect(() => {
        console.log('🟡 NetworkDiscovery - Filters changed, scheduling fetch...');

        // Clear existing timer
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        // Debounce search queries, fetch immediately for other filters
        if (externalSearchQuery) {
            searchTimerRef.current = setTimeout(() => {
                console.log('🟡 NetworkDiscovery - Search debounce completed, fetching...');
                fetchProfiles(
                    1,
                    false,
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
                1,
                false,
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
     * Effect: Setup and cleanup mounted state
     */
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

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
