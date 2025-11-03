"use client";
import { SettingsOverview } from '@/components/settings/settings-overview';
import { useCurrentProfile, useCurrentProfileLoading } from '@/lib/profile';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function SettingsPage() {

    const profile = useCurrentProfile();
    const loading = useCurrentProfileLoading();

    // Show loading state
    if (loading || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner
                    message="loading settings..."
                    size="lg"
                    variant="primary"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="w-full max-w-6xl mx-auto">
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