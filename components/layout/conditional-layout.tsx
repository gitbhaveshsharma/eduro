"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ConditionalHeader } from "./headers/conditional-header";
import { UniversalHeader } from "./headers/universal-header";
import { Sidebar } from "./sidebar/sidebar";
import { BottomNavigation } from "./navigation/bottom-navigation";
import { LayoutUtils } from "./config";
import type { ConditionalLayoutProps, LayoutConfig, NavigationItem } from "./types";
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useCurrentProfile } from '@/lib/profile';

export function ConditionalLayout({
    children,
    platform,
    className = "",
    forceConfig
}: ConditionalLayoutProps) {
    // Get user profile for role-based filtering
    const profile = useCurrentProfile();

    // ✅ Start with isMounted = false to prevent hydration mismatch
    const [isMounted, setIsMounted] = useState(false);

    // ✅ Initialize with server-safe config
    const [config, setConfig] = useState<LayoutConfig>(() => ({
        platform: platform || 'community', // Default to community if not provided
        device: 'desktop',
        view: 'browser',
        showHeader: true,
        showBottomNav: false,
        headerType: platform === 'lms' ? 'lms' : 'community',
        sidebar: LayoutUtils.getDefaultSidebarConfig('desktop'),
        ...forceConfig
    } as LayoutConfig));

    const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // ✅ Single useEffect to handle mounting and config updates
    useEffect(() => {
        // Update config with real device detection
        const updateConfig = () => {
            const deviceType = LayoutUtils.getDeviceType();
            const effectivePlatform = platform || 'community'; // Default to community
            const newConfig = LayoutUtils.generateConfig(effectivePlatform, {
                ...forceConfig,
                sidebar: forceConfig?.sidebar || LayoutUtils.getDefaultSidebarConfig(deviceType, forceConfig?.page)
            });
            setConfig(newConfig);

            // Set default sidebar state based on config AND device
            // Only auto-open on desktop, keep closed on mobile/tablet
            if (newConfig.sidebar?.enabled) {
                const shouldOpen = deviceType === 'desktop' && (newConfig.sidebar?.defaultOpen ?? false);
                setSidebarOpen(shouldOpen);
            }
        };

        // Initial setup - update config first, then show content
        updateConfig();

        // For universal header, skip loading screen
        const skipLoading = forceConfig?.headerType === 'universal';
        const mountTimer = setTimeout(() => {
            setIsMounted(true);
        }, skipLoading ? 0 : 100);

        // Listen for window resize to update device type
        const handleResize = () => {
            updateConfig();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(mountTimer);
            window.removeEventListener('resize', handleResize);
        };
    }, [platform, forceConfig]);

    // ✅ Update navigation items when config changes
    useEffect(() => {
        const items = LayoutUtils.getNavigationItems(config.platform);
        const filteredItems = LayoutUtils.filterNavigationItems(
            items,
            config.platform,
            config.device
        );
        setNavigationItems(filteredItems);
    }, [config.platform, config.device]);

    // ✅ Get platform-specific loading message
    const getLoadingMessage = () => {
        switch (platform) {
            case 'lms':
                return "Loading LMS...";
            case 'community':
                return "Loading community feed...";
            // case 'mobile':
            //     return "Loading app...";
            default:
                return "Loading...";
        }
    };

    const shouldShowHeader = LayoutUtils.shouldShowHeader(config);
    const shouldShowBottomNav = LayoutUtils.shouldShowBottomNav(config);

    // Get sidebar items if sidebar is enabled
    const sidebarItems = config.sidebar?.enabled && config.page
        ? LayoutUtils.filterSidebarItemsByRole(
            LayoutUtils.getSidebarItemsForPage(config.page),
            profile?.role as 'S' | 'T' | 'C' | 'A' | 'SA' | undefined
        )
        : [];

    // ✅ Show loading only for non-universal headers
    if (!isMounted && config.headerType !== 'universal') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <LoadingSpinner message={getLoadingMessage()} size="lg" />
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "min-h-screen bg-background",
            "flex flex-col",
            className
        )}>
            {/* Conditional Header */}
            {shouldShowHeader && (
                <>
                    {/* Use UniversalHeader if headerType is 'universal', otherwise fallback to ConditionalHeader */}
                    {config.headerType === 'universal' ? (
                        <UniversalHeader
                            config={config}
                            title={config.title}
                            sidebarOpen={sidebarOpen}
                            onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
                            onNavigationClick={(item) => {
                                console.log('Navigation item clicked:', item);
                            }}
                        />
                    ) : (
                        <ConditionalHeader
                            config={config}
                            onNavigationClick={(item) => {
                                console.log('Navigation item clicked:', item);
                            }}
                        />
                    )}
                </>
            )}

            {/* Sidebar (if enabled) */}
            {config.sidebar?.enabled && (
                <Sidebar
                    open={sidebarOpen}
                    onOpenChange={setSidebarOpen}
                    config={config.sidebar}
                    items={sidebarItems}
                    title={config.page === 'settings' ? 'Settings' : 'Menu'}
                />
            )}

            {/* Main Content Area with proper spacing */}
            <main className={cn(
                "flex-1 transition-all duration-300 ease-in-out",
                shouldShowBottomNav && "pb-20",
                shouldShowHeader && "pt-0",
                // Apply left margin on all screen sizes when sidebar is open, using responsive classes
                config.sidebar?.enabled && sidebarOpen && "lg:ml-[280px]"
            )}>
                {children}
            </main>

            {/* Conditional Bottom Navigation */}
            {shouldShowBottomNav && (
                <BottomNavigation
                    config={config}
                    navigationItems={navigationItems}
                    onItemClick={(item) => {
                        console.log('Bottom nav item clicked:', item);
                    }}
                />
            )}
        </div>
    );
}