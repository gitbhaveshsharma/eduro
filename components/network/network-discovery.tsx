'use client';

/**
 * Network Discovery Component - Refactored
 * 
 * Modular, responsive component for discovering and connecting with users.
 * Optimized for web view in mobile apps with full responsiveness.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Users } from 'lucide-react';
import { ProfileAPI } from '@/lib/profile';
import { ProfileDisplayUtils, ProfileUrlUtils } from '@/lib/utils/profile.utils';
import { useAuthStore } from '@/lib/auth-store';
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

const ROLE_OPTIONS = [
    { value: 'all', label: 'All Roles' },
    { value: 'S', label: ProfileDisplayUtils.getRoleDisplayName('S') },
    { value: 'T', label: ProfileDisplayUtils.getRoleDisplayName('T') },
    { value: 'C', label: ProfileDisplayUtils.getRoleDisplayName('C') },
];

const SORT_OPTIONS = [
    { value: 'created_at:desc', label: 'Recently Joined' },
    { value: 'created_at:asc', label: 'Oldest Members' },
    { value: 'reputation_score:desc', label: 'Highest Reputation' },
    { value: 'full_name:asc', label: 'Name (A-Z)' },
    { value: 'full_name:desc', label: 'Name (Z-A)' },
];

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
    const { user } = useAuthStore();
    const [profiles, setProfiles] = useState<FollowerProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Use refs to track previous values and prevent unnecessary fetches
    const searchTimerRef = useRef<NodeJS.Timeout>();
    const isMountedRef = useRef(true);

    // Helper to convert PublicProfile to FollowerProfile
    const toFollowerProfile = useCallback((profile: PublicProfile): FollowerProfile => ({
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
    }), []);

    // Helper to convert auth user to FollowerProfile (memoized)
    const currentUserProfile = useRef<FollowerProfile | undefined>();
    if (!currentUserProfile.current && user) {
        currentUserProfile.current = {
            id: user.id,
            username: null,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            role: (user.user_metadata?.role || 'S') as 'SA' | 'A' | 'S' | 'T' | 'C',
            is_verified: false,
            is_online: true,
            follower_count: 0,
            following_count: 0,
            created_at: user.created_at,
        };
    }

    // Fetch profiles - removed from useCallback dependencies that cause loops
    const fetchProfiles = useCallback(async (
        page: number = 1,
        append: boolean = false,
        searchQuery: string,
        selectedRole: string,
        selectedSort: string,
        showVerifiedOnly: boolean,
        showOnlineOnly: boolean
    ) => {
        if (!isMountedRef.current) return;

        console.log('🔴 NetworkDiscovery - Fetching profiles with filters:', {
            searchQuery,
            selectedRole,
            selectedSort,
            showVerifiedOnly,
            showOnlineOnly,
            page,
            append
        });

        setIsLoading(true);
        onLoadingChange?.(true);

        try {
            const profileFilters: ProfileFilters = {
                search_query: searchQuery || undefined,
                role: selectedRole !== 'all' ? selectedRole as any : undefined,
                is_verified: showVerifiedOnly || undefined,
                is_online: showOnlineOnly || undefined,
            };

            const [field, direction] = selectedSort.split(':');
            const sort: ProfileSort = {
                field: field as any,
                direction: direction as 'asc' | 'desc',
            };

            console.log('🔴 NetworkDiscovery - Calling ProfileAPI with:', { profileFilters, sort });

            const result = await ProfileAPI.searchProfiles(profileFilters, sort, page, 20);

            console.log('🔴 NetworkDiscovery - API returned:', result);

            if (result && isMountedRef.current) {
                const convertedProfiles = (result.profiles || []).map(toFollowerProfile);
                if (append) {
                    setProfiles(prev => [...prev, ...convertedProfiles]);
                } else {
                    setProfiles(convertedProfiles);
                }
                const count = result.total_count || convertedProfiles.length;
                setTotalCount(count);
                onTotalCountChange?.(count);
                setHasMore(Boolean(result.has_more));
                setCurrentPage(page);
                console.log('🔴 NetworkDiscovery - Updated profiles count:', convertedProfiles.length);
            }
        } catch (error) {
            console.error('🔴 NetworkDiscovery - Failed to fetch profiles:', error);
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
                onLoadingChange?.(false);
            }
        }
    }, [toFollowerProfile, onLoadingChange, onTotalCountChange]);

    // Single useEffect that handles ALL filter changes
    useEffect(() => {
        console.log('🔴 NetworkDiscovery - Filter changed');

        // Clear any existing search timer
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        // Debounce only search queries, fetch immediately for other filters
        if (externalSearchQuery) {
            console.log('🔴 NetworkDiscovery - Debouncing search query...');
            searchTimerRef.current = setTimeout(() => {
                console.log('🔴 NetworkDiscovery - Search timer fired');
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
            // Immediate fetch for non-search changes
            console.log('🔴 NetworkDiscovery - Fetching immediately (no search query)');
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
        fetchProfiles
    ]);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const handleLoadMore = useCallback(() => {
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
        externalSearchQuery,
        externalSelectedRole,
        externalSelectedSort,
        externalShowVerifiedOnly,
        externalShowOnlineOnly,
        fetchProfiles
    ]);

    const handleConnectionChange = useCallback(() => {
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
        fetchProfiles
    ]);

    return (
        <div className={cn('space-y-4 sm:space-y-6', className)}>
            {/* Results */}
            {isLoading && profiles.length === 0 ? (
                <LoadingSpinner
                    message="Finding users that match your criteria..."
                    size="lg"
                    variant="primary"
                />
            ) : profiles.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No users found"
                    description="Try adjusting your filters or search query to find more people in the network."
                />
            ) : (
                <>
                    <ProfileGrid
                        profiles={profiles}
                        currentUser={currentUserProfile.current}
                        onConnectionChange={handleConnectionChange}
                    />

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
