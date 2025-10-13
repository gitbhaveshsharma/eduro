"use client";

import { FeedHeader } from "@/components/layout/headers/feed-header";
import { LMSHeader } from "./lms-header";
import type { HeaderProps } from "../types";

export function ConditionalHeader({
    config,
    className = "",
    onNavigationClick
}: HeaderProps) {

    // Use community header (FeedHeader) for community platform
    if (config.platform === 'community') {
        return (
            <FeedHeader
                className={className}
                showSearch={true}
                showFilters={config.device !== 'mobile'}
                notificationCount={0} // TODO: Get from notification store
                onNotificationClick={() => {
                    // TODO: Handle notification click
                }}
                onNetworkClick={() => {
                    // TODO: Handle network click
                }}
            />
        );
    }

    // Use LMS header for LMS platform
    if (config.platform === 'lms') {
        return (
            <LMSHeader
                className={className}
                title="Eduro LMS"
                showSearch={config.device !== 'mobile'}
                notificationCount={0} // TODO: Get from notification store
                userName="User" // TODO: Get from auth store
                userAvatar="" // TODO: Get from profile store
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
                    <h1 className="text-lg font-semibold text-gray-900">Eduro</h1>
                </div>
            </div>
        </header>
    );
}