/**
 * Profile Page
 * 
 * Dedicated page for user profile management
 * - Personal information
 * - Account settings
 * - Preferences
 */

"use client";

import { useCurrentProfile, useCurrentProfileLoading } from '@/lib/profile';
import { ProfileManager } from '@/components/profile/profile-manager';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
export default function ProfilePage() {
    const profile = useCurrentProfile();
    const loading = useCurrentProfileLoading();

    // FIXED: Show loading spinner until we have profile data AND loading is complete
    if (loading || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner
                    title="Profile"
                    message="Loading your profile information..."
                    size="lg"
                    variant="primary"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="w-full max-w-6xl mx-auto"> {/* Increased width to max-w-6xl */}
                <div className="space-y-6">
                    {/* Header */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Profile Management</h1>
                        <p className="text-muted-foreground">
                            Manage your personal information, account settings, and preferences
                        </p>
                    </div>

                    {/* Profile Manager - Centered with full width */}
                    <div className="flex justify-center">
                        <div className="w-full">
                            <ProfileManager />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}