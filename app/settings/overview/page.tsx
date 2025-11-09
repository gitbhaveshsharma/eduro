/**
 * Settings Overview Page
 * 
 * Central hub for all settings with search and category navigation
 */

"use client";

import { useCurrentProfile, useCurrentProfileLoading } from '@/lib/profile';
import { SettingsOverview } from '@/components/settings';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function SettingsOverviewPage() {
    const profile = useCurrentProfile();
    const loading = useCurrentProfileLoading();

    // Show loading state
    if (loading || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner
                    title="Settings"
                    message="Loading settings..."
                    size="lg"
                    variant="primary"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-5xl mx-auto">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="space-y-2 text-center md:text-left">
                        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                        <p className="text-muted-foreground">
                            Manage your account, preferences, and application settings
                        </p>
                    </div>

                    {/* Settings Overview */}
                    <SettingsOverview userRole={profile.role as any} />
                </div>
            </div>
        </div>
    );
}
