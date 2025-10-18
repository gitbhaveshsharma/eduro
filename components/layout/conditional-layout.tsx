"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ConditionalHeader } from "./headers/conditional-header";
import { BottomNavigation } from "./navigation/bottom-navigation";
// import NetworkBottomNavigation from "./navigation/network-bottom-navigation"; // commented out per request
import { LayoutUtils } from "./config";
import type { ConditionalLayoutProps, LayoutConfig, NavigationItem } from "./types";
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function ConditionalLayout({
    children,
    platform,
    className = "",
    forceConfig
}: ConditionalLayoutProps) {
    const [isInitializing, setIsInitializing] = useState(true);
    // Use a deterministic server-safe initial config to avoid hydration mismatches.
    // On the server `window` is undefined so LayoutUtils.getDeviceType would return 'desktop'.
    // We'll initialize with a desktop config and update on mount to the actual device.
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

    // Update config when platform changes or window resizes
    useEffect(() => {
        // On mount, compute the real config (this runs only on client)
        const updateConfig = () => {
            const newConfig = LayoutUtils.generateConfig(platform, forceConfig);
            setConfig(newConfig);
        };

        // Initial setup on client
        updateConfig();

        // Listen for window resize to update device type
        const handleResize = () => {
            updateConfig();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [platform, forceConfig]);

    // Simulate initial loading to match previous page behavior
    useEffect(() => {
        const timer = setTimeout(() => setIsInitializing(false), 800);
        return () => clearTimeout(timer);
    }, []);

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

    // Temporarily disable network bottom nav and always use the default BottomNavigation
    // const useNetworkBottomNav = config.page === 'network' || config.bottomNavType === 'network';

    return (
        <div className={cn(
            "min-h-screen bg-background",
            "flex flex-col",
            className
        )}>
            {/* Conditional Header (hidden during initial layout loading) */}
            {!isInitializing && shouldShowHeader && (
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
                {isInitializing ? (
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="flex flex-col items-center space-y-4">
                            <LoadingSpinner message="Loading community feed..." size="lg" />
                        </div>
                    </div>
                ) : (
                    children
                )}
            </main>

            {/* Conditional Bottom Navigation */}
            {shouldShowBottomNav && (
                // Always render the default BottomNavigation for now
                <BottomNavigation
                    config={config}
                    navigationItems={navigationItems}
                    onItemClick={(item) => {
                        // Handle navigation item clicks
                        console.log('Bottom nav item clicked:', item);
                    }}
                />

                /*
                If you want to re-enable the network bottom nav later, uncomment the import above
                and replace the block with the conditional rendering below:

                useNetworkBottomNav ? (
                    <NetworkBottomNavigation
                        activeItem={undefined}
                        onItemClick={(item) => console.log('Network bottom nav clicked', item)}
                        connectionRequests={0}
                    />
                ) : (
                    <BottomNavigation ... />
                )
                */
            )}
        </div>
    );
}
