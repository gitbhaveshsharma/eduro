"use client";

import { memo } from "react";
import { FeedHeader } from "@/components/layout/headers/feed-header";
import { LMSHeader } from "./lms-header";
import { NetworkHeader } from "./network-header";
import { ConnectionsHeader } from "./connections-header";
import type { HeaderProps } from "../types";
import { useCurrentProfile } from '@/lib/profile';

function ConditionalHeaderComponent({
    config,
    className = "",
    onNavigationClick
}: HeaderProps) {
    // Single profile fetch for the entire header system
    // This prevents multiple components from triggering separate fetches
    const profile = useCurrentProfile();

    // Centralized control: decide whether the avatar should be shown in headers
    // Default to true; this can be toggled per-platform or page as needed.
    const showAvatar = true;

    // If headerType or page explicitly requests the network header, use it first
    if (config.headerType === 'network' || config.page === 'network') {
        return (
            <NetworkHeader
                className={className}
                config={config}
                onNavigationClick={onNavigationClick}
                showAvatar={true}
            />
        );
    }

    // If headerType or page explicitly requests the connections header
    if (config.headerType === 'connections' || config.page === 'connections') {
        return (
            <ConnectionsHeader
                className={className}
                config={config}
                onNavigationClick={onNavigationClick}
                showAvatar={true}
            />
        );
    }

    // Use community header (FeedHeader) for community platform
    if (config.platform === 'community') {
        return (
            <FeedHeader
                className={className}
                showSearch={true}
                showFilters={config.device !== 'mobile'}
                showAvatar={showAvatar}
                notificationCount={0} // TODO: Get from notification store
                onNotificationClick={() => {
                    // TODO: Handle notification click
                }}
                onNetworkClick={() => {
                    // TODO: Handle network click
                }}
                config={config}
            />
        );
    }

    // Use LMS header for LMS platform
    if (config.platform === 'lms') {
        return (
            <LMSHeader
                className={className}
                title="Tutrsy LMS"
                showSearch={config.device !== 'mobile'}
                showAvatar={true}
                config={config}
                profile={profile} // Pass profile to avoid duplicate fetches
                notificationCount={0} // TODO: Get from notification store
                userName={profile?.full_name || "User"}
                userAvatar={profile?.avatar_url || ""}
                onMenuClick={() => {
                    // TODO: Handle mobile menu toggle
                }}
                onNotificationClick={() => {
                    // TODO: Handle notification click
                }}
                onProfileClick={() => {
                    // TODO: Handle profile click
                }}
                onSearch={(query) => {
                    // TODO: Handle search
                }}
            />
        );
    }

    // Fallback - minimal header
    return (
        <header className={`bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm ${className}`}>
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <h1 className="text-lg font-semibold text-gray-900">Tutrsy</h1>
                </div>
            </div>
        </header>
    );
}

// Memoize to prevent unnecessary re-renders when parent updates
export const ConditionalHeader = memo(ConditionalHeaderComponent);
ConditionalHeader.displayName = 'ConditionalHeader';