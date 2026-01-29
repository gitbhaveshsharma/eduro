'use client';

/**
 * Connection List Component
 * 
 * Displays a list of connections with infinite scroll support.
 * Handles loading states, empty states, and search functionality.
 */

import { useState, useEffect } from 'react';
import { Search, Users, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ItemGroup, ItemSeparator } from '@/components/ui/item';
import { ConnectionCard } from './connection-card';
import {
    useFollowers,
    useFollowing,
    useFollowersLoading,
    useFollowingLoading,
    useFollowStore,
    FollowFilterUtils,
    FollowSortUtils,
} from '@/lib/follow';
import type { FollowerProfile, FollowRelationshipWithProfile } from '@/lib/follow';
import { cn } from '@/lib/utils';

type ConnectionListType = 'connections' | 'connected';

interface ConnectionListProps {
    type: ConnectionListType;
    userId?: string;
    currentUser?: FollowerProfile;
    showSearch?: boolean;
    showFilters?: boolean;
    showMutualBadge?: boolean;
    className?: string;
}

export function ConnectionList({
    type,
    userId,
    currentUser,
    showSearch = true,
    showFilters = true,
    showMutualBadge = true,
    className,
}: ConnectionListProps) {
    const followers = useFollowers();
    const following = useFollowing();
    const followersLoading = useFollowersLoading();
    const followingLoading = useFollowingLoading();

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<string>('recent');
    const [filterMutual, setFilterMutual] = useState<string>('all');

    const isConnections = type === 'connections';
    const data = isConnections ? followers : following;
    const isLoading = isConnections ? followersLoading : followingLoading;

    // Load data on mount
    useEffect(() => {
        const store = useFollowStore.getState();
        if (isConnections) {
            store.loadFollowers(userId, undefined, undefined, 1, false);
        } else {
            store.loadFollowing(userId, undefined, undefined, 1, false);
        }
    }, [type, userId, isConnections]);

    // Filter and sort data
    const filteredData = FollowFilterUtils.filterFollowers(data, {
        search_query: searchQuery,
        is_mutual: filterMutual === 'mutual' ? true : filterMutual === 'non-mutual' ? false : undefined,
    });

    const sortedData = FollowSortUtils.sortFollowers(
        filteredData,
        sortBy === 'name' ? 'username' : sortBy === 'connections' ? 'follower_count' : 'created_at',
        sortBy === 'name' ? 'asc' : 'desc'
    );

    const handleRefresh = () => {
        const store = useFollowStore.getState();
        if (isConnections) {
            store.loadFollowers(userId, undefined, undefined, 1, true);
        } else {
            store.loadFollowing(userId, undefined, undefined, 1, true);
        }
    };

    // Loading state
    if (isLoading && data.length === 0) {
        return (
            <div className={cn('space-y-4', className)}>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    // Empty state
    if (!isLoading && data.length === 0) {
        return (
            <div className={cn('', className)}>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                        {isConnections ? 'No connections yet' : 'Not connected with anyone'}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        {isConnections
                            ? 'When people connect with you, they will appear here.'
                            : 'Start connecting with people to build your network.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* Search and Filters */}
            {(showSearch || showFilters) && (
                <div className="flex flex-col sm:flex-row gap-3">
                    {showSearch && (
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search connections..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    )}

                    {showFilters && (
                        <div className="flex gap-2">
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="recent">Most Recent</SelectItem>
                                    <SelectItem value="name">Name</SelectItem>
                                    <SelectItem value="connections">Connections</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filterMutual} onValueChange={setFilterMutual}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Filter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="mutual">Mutual Only</SelectItem>
                                    <SelectItem value="non-mutual">Non-Mutual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            )}

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {sortedData.length} {sortedData.length === 1 ? 'connection' : 'connections'}
                    {searchQuery && ` matching "${searchQuery}"`}
                </p>
                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        'Refresh'
                    )}
                </Button>
            </div>

            {/* Connection List */}
            <ItemGroup className="space-y-1 divide-y overflow-hidden">
                {sortedData.map((connection, index) => {
                    const profile = isConnections
                        ? connection.follower_profile
                        : connection.following_profile;

                    if (!profile) return null;

                    return (
                        <div key={connection.id}>
                            <ConnectionCard
                                user={profile}
                                currentUser={currentUser}
                                showStats
                                showMutualBadge={showMutualBadge}
                                isMutual={connection.is_mutual}
                            />
                            {index < sortedData.length - 1 && <ItemSeparator />}
                        </div>
                    );
                })}
            </ItemGroup>

            {/* Load More */}
            {isLoading && data.length > 0 && (
                <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}
        </div>
    );
}
