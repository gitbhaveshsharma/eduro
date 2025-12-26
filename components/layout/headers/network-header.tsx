'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, Users, Bell, Settings, X, Home } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutUtils } from '@/components/layout/config';
import type { HeaderProps } from '@/components/layout/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/avatar';
import { useCurrentProfile, useCurrentProfileLoading } from '@/lib/profile'
import { cn } from '@/lib/utils';
import type { LayoutConfig } from '../types';
import type { FollowerProfile } from '@/lib/follow';
import { useNetworkFilters } from '@/app/(community)/network/network-context';

interface FilterOption {
    value: string;
    label: string;
}

interface NetworkHeaderProps extends Omit<HeaderProps, 'config'> {
    config: LayoutConfig;

    // Search functionality
    searchQuery?: string;
    onSearchChange?: (value: string) => void;

    // Filter state
    roleOptions?: FilterOption[];
    sortOptions?: FilterOption[];
    selectedRole?: string;
    selectedSort?: string;
    showVerifiedOnly?: boolean;
    showOnlineOnly?: boolean;
    onRoleChange?: (value: string) => void;
    onSortChange?: (value: string) => void;
    onVerifiedToggle?: () => void;
    onOnlineToggle?: () => void;

    // Results info
    totalCount?: number;
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

// Default sort options for network (matching ProfileService sort format)
const defaultSortOptions = [
    { value: 'created_at:desc', label: 'Recently Joined' },
    { value: 'created_at:asc', label: 'Oldest Members' },
    { value: 'reputation_score:desc', label: 'Highest Reputation' },
    { value: 'full_name:asc', label: 'Name (A-Z)' },
    { value: 'full_name:desc', label: 'Name (Z-A)' }
];

// Default role options (matching profile role codes)
const defaultRoleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'S', label: 'Students' },
    { value: 'T', label: 'Teachers' },
    { value: 'C', label: 'Coaches' },
    { value: 'A', label: 'Admins' }
];

export function NetworkHeader({
    config,
    searchQuery: propSearchQuery = '',
    onSearchChange: propOnSearchChange,
    roleOptions = defaultRoleOptions,
    sortOptions = defaultSortOptions,
    selectedRole: propSelectedRole = 'all',
    selectedSort: propSelectedSort = 'created_at:desc',
    showVerifiedOnly: propShowVerifiedOnly = false,
    showOnlineOnly: propShowOnlineOnly = false,
    onRoleChange: propOnRoleChange,
    onSortChange: propOnSortChange,
    onVerifiedToggle: propOnVerifiedToggle,
    onOnlineToggle: propOnOnlineToggle,
    totalCount: propTotalCount = 0,
    isLoading: propIsLoading = false,
    onBack,
    showBackButton = false,
    onNotificationClick,
    notificationCount = 0,
    onNavigationClick,
    className = '',
    showAvatar = true
}: NetworkHeaderProps) {
    // Try to use context from network page, fallback to props
    const contextFilters = useNetworkFilters();

    console.log('🟢 NetworkHeader - Context filters:', contextFilters);

    // Use context values if available, otherwise use props
    const searchQuery = contextFilters?.searchQuery ?? propSearchQuery;
    const onSearchChange = contextFilters?.onSearchChange ?? propOnSearchChange;
    const selectedRole = contextFilters?.selectedRole ?? propSelectedRole;
    const onRoleChange = contextFilters?.onRoleChange ?? propOnRoleChange;
    const selectedSort = contextFilters?.selectedSort ?? propSelectedSort;
    const onSortChange = contextFilters?.onSortChange ?? propOnSortChange;
    const showVerifiedOnly = contextFilters?.showVerifiedOnly ?? propShowVerifiedOnly;
    const showOnlineOnly = contextFilters?.showOnlineOnly ?? propShowOnlineOnly;
    const onVerifiedToggle = contextFilters?.onVerifiedToggle ?? propOnVerifiedToggle;
    const onOnlineToggle = contextFilters?.onOnlineToggle ?? propOnOnlineToggle;
    const totalCount = contextFilters?.totalCount ?? propTotalCount;
    const isLoading = contextFilters?.isLoading ?? propIsLoading;

    console.log('🟢 NetworkHeader - Selected Role:', selectedRole);
    console.log('🟢 NetworkHeader - Selected Sort:', selectedSort);

    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
    const router = useRouter();
    const pathname = usePathname();
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Check if we're on the main network page (context is available)
    const isOnNetworkPage = pathname === '/network' || pathname.startsWith('/network/');
    const hasContext = contextFilters !== null;

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

    // Navigate to network page with search query when not on network page
    const navigateToNetworkWithSearch = useCallback((query: string) => {
        if (query.trim()) {
            router.push(`/network?q=${encodeURIComponent(query.trim())}`);
        } else {
            router.push('/network');
        }
    }, [router]);

    // Integrated SearchBar logic with smart navigation
    const handleSearchChange = useCallback((value: string) => {
        setLocalSearchQuery(value);

        // If context is available, use it (we're on network page)
        if (hasContext && onSearchChange) {
            onSearchChange(value);
        } else {
            // Not on network page - debounce and navigate
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            debounceTimerRef.current = setTimeout(() => {
                navigateToNetworkWithSearch(value);
            }, 500);
        }
    }, [hasContext, onSearchChange, navigateToNetworkWithSearch]);

    // Cleanup debounce timer
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        handleSearchChange(value);
    };

    const clearSearch = () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        setLocalSearchQuery('');
        if (hasContext && onSearchChange) {
            onSearchChange('');
        }
    };

    const handleRoleSelect = (role: string) => {
        console.log('🔵 NetworkHeader - Role selected:', role);
        console.log('🔵 NetworkHeader - Current selectedRole:', selectedRole);
        console.log('🔵 NetworkHeader - onRoleChange function:', onRoleChange);

        if (onRoleChange) {
            onRoleChange(role);
            console.log('🔵 NetworkHeader - Role change called');
        } else {
            // Navigate to network page with role filter
            router.push(`/network?role=${role}`);
        }
    };

    const handleSortSelect = (sort: string) => {
        console.log('🔵 NetworkHeader - Sort selected:', sort);
        console.log('🔵 NetworkHeader - Current selectedSort:', selectedSort);
        console.log('🔵 NetworkHeader - onSortChange function:', onSortChange);

        if (onSortChange) {
            onSortChange(sort);
            console.log('🔵 NetworkHeader - Sort change called');
        } else {
            // Navigate to network page with sort filter
            router.push(`/network?sort=${sort}`);
        }
    };

    const handleFeedClick = () => {
        router.push('/feed');
    };

    // Calculate filter counts for each dropdown
    const hasRoleFilter = selectedRole !== 'all';
    const hasSortFilter = selectedSort !== 'created_at:desc';
    const hasSearchFilter = !!searchQuery;

    // Check if any filters are applied (excluding default sort)
    const hasActiveFilters = hasSearchFilter || hasRoleFilter || showVerifiedOnly || showOnlineOnly;

    const currentRoleOption = roleOptions.find(option => option.value === selectedRole);
    const currentSortOption = sortOptions.find(option => option.value === selectedSort);

    // Responsive behavior
    const isMobile = config.device === 'mobile';
    const isTablet = config.device === 'tablet';
    const isDesktop = config.device === 'desktop';

    // Show Feed button only on desktop
    const showFeedButton = isDesktop;

    return (
        <header className={cn(
            'bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm',
            className
        )}>
            <div className="max-w-7xl mx-auto px-4">
                {/* Main Header Row */}
                <div className="flex items-center justify-between h-16 gap-3">
                    {/* Left Side - Navigation & Title */}
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
                            <h1 className="text-lg font-semibold text-gray-900">Network</h1>
                            {/* Only show count when filters are applied */}
                            {!isLoading && totalCount > 0 && hasActiveFilters && (
                                <Badge variant="secondary" className="ml-2">
                                    {totalCount}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Integrated Search Bar - Centered on desktop, full width on mobile */}
                    <div className={cn(
                        "flex-1",
                        isMobile ? "max-w-full" : "max-w-xl"
                    )}>
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <Input
                                type="text"
                                placeholder="Search by name, username, or bio..."
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
                            {hasSearchFilter && !localSearchQuery && (
                                <Badge
                                    variant="destructive"
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                                >
                                    1
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Right Side - Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Feed Page Button - Only show on desktop */}
                        {showFeedButton && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleFeedClick}
                                className="h-10 px-3 gap-2 hover:bg-gray-100 rounded-full"
                            >
                                <Home className="h-4 w-4" />
                                <span className="hidden sm:inline text-sm font-medium">Feed</span>
                            </Button>
                        )}

                        {/* Role Filter Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-10 px-3 gap-2 hover:bg-gray-100 rounded-full relative"
                                >
                                    <Users className="h-4 w-4" />
                                    <span className="hidden sm:inline text-sm font-medium">
                                        {currentRoleOption?.label || 'Role'}
                                    </span>
                                    {hasRoleFilter && (
                                        <Badge
                                            variant="destructive"
                                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                                        >
                                            1
                                        </Badge>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {roleOptions.map((option) => (
                                    <DropdownMenuItem
                                        key={option.value}
                                        onClick={() => handleRoleSelect(option.value)}
                                        className="cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span>{option.label}</span>
                                            {selectedRole === option.value && (
                                                <div className="h-2 w-2 rounded-full bg-brand-primary" />
                                            )}
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Sort Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-10 px-3 gap-2 hover:bg-gray-100 rounded-full relative"
                                >
                                    <Filter className="h-4 w-4" />
                                    <span className="hidden sm:inline text-sm font-medium">
                                        {currentSortOption?.label || 'Sort'}
                                    </span>
                                    {hasSortFilter && (
                                        <Badge
                                            variant="destructive"
                                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                                        >
                                            1
                                        </Badge>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {sortOptions.map((option) => (
                                    <DropdownMenuItem
                                        key={option.value}
                                        onClick={() => handleSortSelect(option.value)}
                                        className="cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span>{option.label}</span>
                                            {selectedSort === option.value && (
                                                <div className="h-2 w-2 rounded-full bg-brand-primary" />
                                            )}
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Notifications */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onNotificationClick}
                            className="relative h-10 w-10 p-0 hover:bg-gray-100 rounded-full"
                        >
                            <Bell className="h-5 w-5" />
                            {notificationCount > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                                >
                                    {notificationCount > 9 ? '9+' : notificationCount}
                                </Badge>
                            )}
                        </Button>

                        {/* User Avatar (centralized control) */}
                        {showAvatar && currentUserProfile && (
                            <UserAvatar
                                profile={currentUserProfile}
                                size="sm"
                                showOnlineStatus
                                className="cursor-pointer hover:ring-2 hover:ring-gray-200 transition-all"
                                onClick={() => {
                                    // Navigate to user profile
                                    router.push(`/dashboard`);
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Mobile Filters Row - Removed advanced filters */}
                {isMobile && (
                    <div className="flex items-center justify-between pb-3 gap-2">
                        {/* Results Count - Only show when filters are applied */}
                        <div className="text-sm text-gray-600">
                            {isLoading ? 'Searching...' : (
                                hasActiveFilters
                                    ? `${totalCount} ${totalCount === 1 ? 'user' : 'users'}`
                                    : 'Browse all users'
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}