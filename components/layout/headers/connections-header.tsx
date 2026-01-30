'use client';

/**
 * Connections Header Component
 * 
 * A simplified header for the connections page with search functionality only.
 * Follows the same patterns as NetworkHeader but without filters.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Users, Bell, Home, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/avatar';
import { useCurrentProfile, useCurrentProfileLoading } from '@/lib/profile';
import { usePendingRequests, useFollowStats } from '@/lib/follow';
import { cn } from '@/lib/utils';
import type { LayoutConfig, HeaderProps } from '../types';
import type { FollowerProfile } from '@/lib/follow';
import { useConnectionsContext } from '@/app/(community)/connections/connections-context';

interface ConnectionsHeaderProps extends Omit<HeaderProps, 'config'> {
    config: LayoutConfig;

    // Search functionality (can be overridden by props)
    searchQuery?: string;
    onSearchChange?: (value: string) => void;

    // Results info
    totalConnections?: number;
    isLoading?: boolean;

    // Navigation
    onBack?: () => void;
    showBackButton?: boolean;

    // Actions
    onNotificationClick?: () => void;
    notificationCount?: number;

    // Styling
    className?: string;
    showAvatar?: boolean;
}

export function ConnectionsHeader({
    config,
    searchQuery: propSearchQuery,
    onSearchChange: propOnSearchChange,
    totalConnections: propTotalConnections,
    isLoading: propIsLoading,
    onBack,
    showBackButton = false,
    onNotificationClick,
    notificationCount,
    onNavigationClick,
    className = '',
    showAvatar = true
}: ConnectionsHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();

    // Try to use context from connections page
    const contextState = useConnectionsContext();

    // Use context values if available, otherwise use props
    const searchQuery = contextState?.searchQuery ?? propSearchQuery ?? '';
    const onSearchChange = contextState?.onSearchChange ?? propOnSearchChange;
    const totalConnections = contextState?.totalConnections ?? propTotalConnections ?? 0;
    const isLoading = contextState?.isLoading ?? propIsLoading ?? false;

    // Local state for search
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Get pending requests count for notification badge
    const pendingRequests = usePendingRequests();
    const pendingCount = notificationCount ?? pendingRequests.length;

    // Get stats for total connections
    const stats = useFollowStats();
    const displayTotalConnections = totalConnections || (stats?.followers ?? 0) + (stats?.following ?? 0);

    // Sync local search query with external changes
    useEffect(() => {
        setLocalSearchQuery(searchQuery);
    }, [searchQuery]);

    // Use profile store hooks to get the current profile
    const profile = useCurrentProfile();
    const profileLoading = useCurrentProfileLoading();

    // Map store profile to the FollowerProfile shape expected by UserAvatar
    const currentUserProfile = profile ? {
        id: profile.id,
        username: profile.username || null,
        full_name: profile.full_name || null,
        avatar_url: profile.avatar_url || null,
        role: (profile.role || 'S') as 'SA' | 'A' | 'S' | 'T' | 'C',
        is_verified: !!profile.is_verified,
        is_online: !!profile.is_online,
        follower_count: ((profile as any)?.follower_count as number) || 0,
        following_count: ((profile as any)?.following_count as number) || 0,
        created_at: profile.created_at || null,
    } as FollowerProfile : null;

    // Handle search change with debounce
    const handleSearchChange = useCallback((value: string) => {
        setLocalSearchQuery(value);

        // Debounce the callback
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            if (onSearchChange) {
                onSearchChange(value);
            }
        }, 300);
    }, [onSearchChange]);

    // Cleanup debounce timer
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleSearchChange(e.target.value);
    };

    const clearSearch = () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        setLocalSearchQuery('');
        if (onSearchChange) {
            onSearchChange('');
        }
    };

    const handleFeedClick = () => {
        router.push('/feed');
    };

    const handleNetworkClick = () => {
        router.push('/network');
    };

    const handleRequestsClick = () => {
        // Set active tab to requests if context available
        if (contextState?.setActiveTab) {
            contextState.setActiveTab('requests');
        }
        // Navigate or scroll to requests tab
        if (onNotificationClick) {
            onNotificationClick();
        }
    };

    // Responsive behavior
    const isMobile = config.device === 'mobile';
    const isTablet = config.device === 'tablet';
    const isDesktop = config.device === 'desktop';

    // Show navigation buttons only on desktop
    const showNavigationButtons = isDesktop;

    return (
        <header className={cn(
            'bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm',
            className
        )}>
            <div className="max-w-7xl mx-auto px-4">
                {/* Main Header Row */}
                <div className="flex items-center justify-between h-16 gap-3">
                    {/* Left Side - Title */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {showBackButton && isMobile && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onBack}
                                className="h-10 w-10 p-0 hover:bg-gray-100 rounded-full"
                            >
                                <Users className="h-4 w-4" />
                            </Button>
                        )}

                        <div className="hidden md:flex items-center gap-2">
                            <h1 className="text-lg font-semibold text-gray-900">Connections</h1>
                            {!isLoading && displayTotalConnections > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                    {displayTotalConnections}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Search Bar - Centered on desktop, full width on mobile */}
                    <div className={cn(
                        "flex-1",
                        isMobile ? "max-w-full" : "max-w-xl"
                    )}>
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <Input
                                type="text"
                                placeholder="Search your connections..."
                                value={localSearchQuery}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-10 h-10 bg-gray-50 border-gray-200 rounded-full focus:bg-white focus:ring-2 focus:ring-brand-primary/20 transition-all"
                            />
                            {localSearchQuery && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={clearSearch}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                    aria-label="Clear search"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Right Side - Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Navigation Buttons - Only show on desktop */}
                        {showNavigationButtons && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleFeedClick}
                                    className="h-10 px-3 gap-2 hover:bg-gray-100 rounded-full"
                                >
                                    <Home className="h-4 w-4" />
                                    <span className="hidden sm:inline text-sm font-medium">Feed</span>
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleNetworkClick}
                                    className="h-10 px-3 gap-2 hover:bg-gray-100 rounded-full"
                                >
                                    <Users className="h-4 w-4" />
                                    <span className="hidden sm:inline text-sm font-medium">Network</span>
                                </Button>
                            </>
                        )}

                        {/* Requests Badge (Notifications) */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRequestsClick}
                            className="relative h-10 w-10 p-0 hover:bg-gray-100 rounded-full"
                        >
                            <Bell className="h-5 w-5" />
                            {pendingCount > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                                >
                                    {pendingCount > 9 ? '9+' : pendingCount}
                                </Badge>
                            )}
                        </Button>

                        {/* User Avatar */}
                        {showAvatar && currentUserProfile && (
                            <UserAvatar
                                profile={currentUserProfile}
                                size="sm"
                                showOnlineStatus
                                className="cursor-pointer hover:ring-2 hover:ring-gray-200 transition-all"
                                onClick={() => {
                                    router.push('/dashboard');
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Mobile Info Row */}
                {isMobile && (
                    <div className="flex items-center justify-between pb-3 gap-2">
                        <div className="text-sm text-gray-600">
                            {isLoading ? 'Loading...' : (
                                displayTotalConnections > 0
                                    ? `${displayTotalConnections} ${displayTotalConnections === 1 ? 'connection' : 'connections'}`
                                    : 'Your connections'
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
