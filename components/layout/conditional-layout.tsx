"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ConditionalHeader } from "./headers/conditional-header";
import { BottomNavigation } from "./navigation/bottom-navigation";
import { LayoutUtils } from "./config";
import type { ConditionalLayoutProps, LayoutConfig, NavigationItem } from "./types";
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function ConditionalLayout({
    children,
    platform,
    className = "",
    forceConfig
}: ConditionalLayoutProps) {
    // ✅ Start with isMounted = false to prevent hydration mismatch
    const [isMounted, setIsMounted] = useState(false);

    // ✅ Initialize with server-safe config
    const [config, setConfig] = useState<LayoutConfig>(() => ({
        platform,
        device: 'desktop',
        view: 'browser',
        showHeader: true,
        showBottomNav: false,
        headerType: platform === 'community' ? 'community' : 'lms',
        ...forceConfig
    } as LayoutConfig));

    const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);

    // ✅ Single useEffect to handle mounting and config updates
    useEffect(() => {
        // Update config with real device detection
        const updateConfig = () => {
            const newConfig = LayoutUtils.generateConfig(platform, forceConfig);
            setConfig(newConfig);
        };

        // Initial setup - update config first, then show content
        updateConfig();

        // Small delay to ensure smooth transition
        const mountTimer = setTimeout(() => {
            setIsMounted(true);
        }, 100); // Reduced from 800ms

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

    const shouldShowHeader = LayoutUtils.shouldShowHeader(config);
    const shouldShowBottomNav = LayoutUtils.shouldShowBottomNav(config);

    // ✅ Show loading only once on initial mount
    if (!isMounted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <LoadingSpinner message="Loading community feed..." size="lg" />
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
                <ConditionalHeader
                    config={config}
                    onNavigationClick={(item) => {
                        console.log('Navigation item clicked:', item);
                    }}
                />
            )}

            {/* Main Content Area */}
            <main className={cn(
                "flex-1",
                shouldShowBottomNav && "pb-20",
                shouldShowHeader && "pt-0"
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
