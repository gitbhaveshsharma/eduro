"use client";

import { useState, useEffect } from "react";
import { Search, Bell, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
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
import { LayoutUtils } from "@/components/layout/config";
import type { HeaderProps, HeaderItem } from "@/components/layout/types";
import { SettingsSearch } from "@/components/settings";

/**
 * UniversalHeader Component
 * 
 * Single, reusable header that works across all pages
 * - Page-based configuration (not platform-based)
 * - Dynamic header items based on page context
 * - Integrated search with customizable behavior
 * - Sidebar toggle support
 * - Responsive design for all devices
 * - Clean, maintainable code following project patterns
 */
export function UniversalHeader({
    config,
    className = '',
    showAvatar = true,
    items: customItems,
    title,
    searchConfig,
    sidebarOpen,
    onSidebarToggle,
    notificationCount = 0,
    onNotificationClick,
    onNavigationClick
}: HeaderProps) {
    const router = useRouter();
    const profile = useCurrentProfile();

    // Local search state
    const [searchQuery, setSearchQuery] = useState(searchConfig?.value || '');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Sync external search value
    useEffect(() => {
        if (searchConfig?.value !== undefined) {
            setSearchQuery(searchConfig.value);
        }
    }, [searchConfig?.value]);

    // Get header items - use custom items or generate from page config
    const headerItems = customItems || (
        config.page
            ? LayoutUtils.filterHeaderItems(
                LayoutUtils.getHeaderItemsForPage(config.page),
                config.page,
                config.device,
                config.platform
            )
            : []
    );

    // Handle search
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        searchConfig?.onChange?.(value);
    };

    const handleSearchToggle = () => {
        setIsSearchExpanded(!isSearchExpanded);
        if (isSearchExpanded) {
            handleSearchChange('');
        }
    };

    // Handle header item click
    const handleItemClick = async (item: HeaderItem) => {
        // Call global navigation handler if provided
        if (onNavigationClick) {
            try {
                const result = await onNavigationClick(item);
                if (result === false) return; // Prevent default if handler returns false
            } catch (e) {
                return; // Prevent default on error
            }
        }

        // Handle action based on type
        if (item.action) {
            switch (item.action.type) {
                case 'navigate':
                    if (item.action.href) {
                        router.push(item.action.href);
                    }
                    break;
                case 'callback':
                    if (item.action.onClick) {
                        try {
                            const result = await item.action.onClick();
                            if (result === false) return;
                        } catch (e) {
                            return;
                        }
                    }
                    break;
                case 'toggle':
                    // For toggle actions (like sidebar)
                    if (item.action.onClick) {
                        item.action.onClick();
                    }
                    break;
                // 'dropdown' type is handled by the dropdown menu component
            }
        }
    };

    // Determine if we should show search
    const showSearch = searchConfig?.enabled !== false;
    const searchPlaceholder = searchConfig?.placeholder || 'Search...';

    // Check if we're on settings page for custom search
    const isSettingsPage = config.page === 'settings';

    // Responsive behavior
    const isMobile = config.device === 'mobile';
    const isTablet = config.device === 'tablet';
    const isDesktop = config.device === 'desktop';

    return (
        <header className={cn(
            'bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm',
            className
        )}>
            {/* Expanded Search Bar (Mobile/Tablet) */}
            {showSearch && isSearchExpanded && !isDesktop && (
                <div className="bg-white border-b border-gray-200 px-4 py-3">
                    {isSettingsPage ? (
                        // Settings-specific search for mobile/tablet
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <SettingsSearch
                                    userRole={profile?.role as any}
                                    placeholder={searchPlaceholder}
                                    className="w-full"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleSearchToggle}
                                className="h-10 w-10 p-0 shrink-0"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    ) : (
                        // Default search input for mobile/tablet
                        <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder={searchPlaceholder}
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="w-full pl-10 pr-4 h-10 bg-gray-50 border-gray-200 rounded-full focus:bg-white focus:ring-2 focus:ring-brand-primary/20 transition-all"
                                    autoFocus
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleSearchToggle}
                                className="h-10 w-10 p-0 shrink-0"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </form>
                    )}
                </div>
            )}

            {/* Main Header Row */}
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16 gap-3">
                    {/* Left Side - Sidebar Toggle & Title */}
                    <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
                        {/* Sidebar Toggle Button */}
                        {config.sidebar?.enabled && onSidebarToggle && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onSidebarToggle}
                                className={cn(
                                    "h-10 w-10 p-0 hover:bg-gray-100 rounded-full",
                                    // On mobile, hide when sidebar is open (they'll use X in sidebar)
                                    sidebarOpen && !isDesktop && "hidden"
                                )}
                                aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                            >
                                {/* Desktop: Show X when open, Menu when closed */}
                                {/* Mobile/Tablet: Always show Menu (button is hidden when open) */}
                                {isDesktop && sidebarOpen ? (
                                    <X className="h-5 w-5" />
                                ) : (
                                    <Menu className="h-5 w-5" />
                                )}
                            </Button>
                        )}

                        {/* Title/Logo */}
                        {title && (
                            <div className="hidden md:flex items-center gap-2 min-w-0">
                                <h1 className="text-lg font-semibold text-gray-900 truncate">
                                    {title}
                                </h1>
                            </div>
                        )}
                    </div>

                    {/* Center - Desktop Search Bar */}
                    {showSearch && isDesktop && (
                        <div className="flex-1 max-w-xl">
                            {isSettingsPage ? (
                                // Settings-specific search
                                <SettingsSearch
                                    userRole={profile?.role as any}
                                    placeholder={searchPlaceholder}
                                    className="w-full"
                                />
                            ) : (
                                // Default search input
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder={searchPlaceholder}
                                        value={searchQuery}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        className="w-full pl-10 pr-4 h-10 bg-gray-50 border-gray-200 rounded-full focus:bg-white focus:ring-2 focus:ring-brand-primary/20 transition-all"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Right Side - Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Mobile/Tablet Search Toggle */}
                        {showSearch && !isDesktop && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSearchToggle}
                                className="h-10 w-10 p-0 hover:bg-gray-100 rounded-full"
                                aria-label={isSearchExpanded ? 'Close search' : 'Open search'}
                            >
                                {isSearchExpanded ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                            </Button>
                        )}

                        {/* Dynamic Header Items */}
                        <nav className="flex items-center gap-2">
                            {headerItems.map((item) => {
                                const Icon = item.icon;

                                // Handle dropdown items
                                if (item.action?.type === 'dropdown' && item.action.items) {
                                    return (
                                        <DropdownMenu key={item.id}>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cn(
                                                        "h-10 px-3 gap-2 hover:bg-gray-100 rounded-full relative",
                                                        item.className
                                                    )}
                                                >
                                                    {Icon && <Icon className="h-4 w-4" />}
                                                    <span className="hidden sm:inline text-sm font-medium">
                                                        {item.label}
                                                    </span>
                                                    {item.badge && item.badge > 0 && (
                                                        <Badge
                                                            variant="destructive"
                                                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                                                        >
                                                            {item.badge > 9 ? '9+' : item.badge}
                                                        </Badge>
                                                    )}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                {item.action.items.map((dropdownItem) => (
                                                    <DropdownMenuItem
                                                        key={dropdownItem.id}
                                                        onClick={() => handleItemClick(dropdownItem)}
                                                        className="cursor-pointer"
                                                    >
                                                        {dropdownItem.label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    );
                                }

                                // Regular button items
                                return (
                                    <Button
                                        key={item.id}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleItemClick(item)}
                                        className={cn(
                                            "h-10 px-3 gap-2 hover:bg-gray-100 rounded-full relative",
                                            item.active && "bg-brand-primary/10 text-brand-primary",
                                            item.className
                                        )}
                                    >
                                        {Icon && <Icon className="h-4 w-4" />}
                                        <span className="hidden sm:inline text-sm font-medium">
                                            {item.label}
                                        </span>
                                        {item.badge && item.badge > 0 && (
                                            <Badge
                                                variant="destructive"
                                                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                                            >
                                                {item.badge > 9 ? '9+' : item.badge}
                                            </Badge>
                                        )}
                                    </Button>
                                );
                            })}
                        </nav>

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

                        {/* User Avatar */}
                        {showAvatar && profile && (
                            <UserAvatar
                                profile={profile}
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
            </div>
        </header>
    );
}
