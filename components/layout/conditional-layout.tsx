"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ConditionalHeader } from "./headers/conditional-header";
import { BottomNavigation } from "./navigation/bottom-navigation";
import { LayoutUtils } from "./config";
import type { ConditionalLayoutProps, LayoutConfig, NavigationItem } from "./types";

export function ConditionalLayout({
    children,
    platform,
    className = "",
    forceConfig
}: ConditionalLayoutProps) {
    const [config, setConfig] = useState<LayoutConfig>(() =>
        LayoutUtils.generateConfig(platform, forceConfig)
    );
    const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);

    // Update config when platform changes or window resizes
    useEffect(() => {
        const updateConfig = () => {
            const newConfig = LayoutUtils.generateConfig(platform, forceConfig);
            setConfig(newConfig);
        };

        // Initial setup
        updateConfig();

        // Listen for window resize to update device type
        const handleResize = () => {
            updateConfig();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [platform, forceConfig]);

    // Update navigation items when config changes
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
                        // Handle navigation item clicks
                        console.log('Navigation item clicked:', item);
                    }}
                />
            )}

            {/* Main Content Area */}
            <main className={cn(
                "flex-1",
                shouldShowBottomNav && "pb-20", // Add padding for bottom nav
                shouldShowHeader && "pt-0" // Header is sticky, no extra padding needed
            )}>
                {children}
            </main>

            {/* Conditional Bottom Navigation */}
            {shouldShowBottomNav && (
                <BottomNavigation
                    config={config}
                    navigationItems={navigationItems}
                    onItemClick={(item) => {
                        // Handle navigation item clicks
                        console.log('Bottom nav item clicked:', item);
                    }}
                />
            )}
        </div>
    );
}