"use client";

import { useState } from "react";
import { Search, Filter, Bell, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { LayoutUtils } from "@/components/layout/config";
import type { HeaderProps, LayoutConfig } from "@/components/layout/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/avatar";
import { useCurrentProfile } from '@/lib/profile';

export type FeedSortType = 'recent' | 'trending' | 'popular' | 'following';

interface FeedHeaderProps extends Omit<HeaderProps, 'config'> {
    currentSort?: FeedSortType;
    onSortChange?: (sort: FeedSortType) => void;
    onSearch?: (query: string) => void;
    showSearch?: boolean;
    showFilters?: boolean;
    notificationCount?: number;
    onNotificationClick?: () => void;
    onNetworkClick?: () => void;
    // onNavigationClick provided by HeaderProps (NavigationItem) via Omit
    className?: string;
    config?: LayoutConfig;
    showAvatar?: boolean;
}

const sortOptions = [
    { value: 'recent' as const, label: 'Recent' },
    { value: 'trending' as const, label: 'Trending' },
    { value: 'popular' as const, label: 'Popular' },
    { value: 'following' as const, label: 'Following' }
];

export function FeedHeader({
    currentSort = 'recent',
    onSortChange,
    onSearch,
    showSearch = true,
    showFilters = true,
    notificationCount = 0,
    onNotificationClick,
    onNetworkClick,
    onNavigationClick,
    className = '',
    config,
    showAvatar = true
}: FeedHeaderProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    // Use profile store hook to get current user profile
    const profile = useCurrentProfile();



    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        onSearch?.(value);
    };

    const handleSortSelect = (sort: FeedSortType) => {
        onSortChange?.(sort);
    };

    const currentSortOption = sortOptions.find(option => option.value === currentSort);

    // Use device from config when provided, otherwise detect
    const device = config?.device ?? LayoutUtils.getDeviceType();

    // Filter community navigation items for this device
    const navItems = LayoutUtils.filterNavigationItems(
        LayoutUtils.getNavigationItems('community'),
        'community',
        device
    );

    return (
        <header className={`bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm ${className}`}>
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16 gap-3">
                    {/* Logo/Title - Hidden on mobile */}
                    <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                        <h1 className="text-lg font-semibold text-gray-900">Feed</h1>
                    </div>

                    {/* Search Bar - Responsive */}
                    {showSearch && (
                        <div className="flex-1 max-w-xl">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search posts..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="w-full pl-10 pr-4 h-10 bg-gray-50 border-gray-200 rounded-full focus:bg-white focus:ring-2 focus:ring-brand-primary/20 transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {/* Actions - Always visible */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Desktop/Tablet inline nav (use config/device to filter) */}
                        <nav className="hidden lg:flex items-center gap-2">
                            {navItems.filter(i => i.id !== 'feed').map(item => {
                                const Icon = item.icon as any;
                                return (
                                    <Button
                                        key={item.id}
                                        variant="ghost"
                                        size="sm"
                                        onClick={async () => {
                                            if (onNavigationClick) {
                                                try {
                                                    const res = await onNavigationClick(item);
                                                    if ((res as unknown as boolean) === false) return;
                                                } catch (e) {
                                                    return;
                                                }
                                            }

                                            if (item.href) router.push(item.href);
                                        }}
                                        className="h-10 px-3 flex items-center gap-2 rounded-full"
                                    >
                                        {Icon && <Icon className="h-4 w-4 text-current" />}
                                        <span className="hidden xl:inline">{item.label}</span>
                                    </Button>
                                );
                            })}
                        </nav>

                        {/* Filter Dropdown */}
                        {showFilters && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-10 px-3 gap-2 hover:bg-gray-100 rounded-full"
                                    >
                                        <Filter className="h-4 w-4" />
                                        <span className="hidden sm:inline text-sm font-medium">
                                            {currentSortOption?.label}
                                        </span>
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
                                                {currentSort === option.value && (
                                                    <div className="h-2 w-2 rounded-full bg-brand-primary" />
                                                )}
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Notification Bell */}
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
                        {showAvatar && (
                            <UserAvatar
                                profile={profile}
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
            </div>
        </header>
    );
}