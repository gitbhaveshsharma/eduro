/**
 * Profile Manager Component
 * 
 * Complete profile management interface for users
 * Handles profile editing, settings, social links, and more
 */

"use client";

import { useState, useEffect } from 'react';
import { useCurrentProfile, useProfileStore, useEditMode } from '@/lib/store/profile.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, User, Settings, Link as LinkIcon, BarChart3, AlertCircle } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { ProfileForm } from './profile-form';
import { ProfileSettings } from './profile-settings';
import { ProfileSocialLinks } from './profile-social-links';
import { ProfileStats } from './profile-stats';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProfileManagerProps {
    className?: string;
}

export function ProfileManager({ className = '' }: ProfileManagerProps) {
    const currentProfile = useCurrentProfile();
    const { loadCurrentProfile, currentProfileLoading, currentProfileError } = useProfileStore();

    const [activeTab, setActiveTab] = useState<string>('profile');
    const [isSaving, setIsSaving] = useState(false);

    // Load profile on mount if not loaded
    useState(() => {
        if (!currentProfile && !currentProfileLoading) {
            loadCurrentProfile();
        }
    });

    // Handle URL hash -> switch tabs and scroll to anchor when appropriate
    useEffect(() => {
        const settingsAnchors = new Set([
            'notifications',
            'email',
            'certifications',
            'tags',
            'language',
            'timezone',
        ]);
        // profile anchors
        const profileAnchors = new Set([
            'username',
            'bio',
            'avatar',
            'cover',
            'contact',
            'location',
        ]);

        const handleHash = () => {
            if (typeof window === 'undefined') return;
            const hash = window.location.hash || '';
            if (!hash) return;
            const id = hash.replace('#', '');

            if (settingsAnchors.has(id)) {
                // Open Settings tab, then scroll to anchor
                setActiveTab('settings');
                // Delay scroll to allow tab content to render
                setTimeout(() => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 60);
                return;
            }
            if (profileAnchors.has(id)) {
                // Open Profile tab, then scroll to anchor
                setActiveTab('profile');
                // Delay scroll to allow tab content to render
                setTimeout(() => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 60);
                return;
            }

            if (id === 'social') setActiveTab('social');
            if (id === 'stats') setActiveTab('stats');
        };

        // Run once on mount
        handleHash();

        // Also listen for subsequent hash changes
        window.addEventListener('hashchange', handleHash);
        return () => window.removeEventListener('hashchange', handleHash);
    }, []);

    // Handle refresh
    const handleRefresh = async () => {
        setIsSaving(true);
        try {
            await loadCurrentProfile();
            showSuccessToast('Profile refreshed successfully');
        } catch (error) {
            showErrorToast('Failed to refresh profile');
        } finally {
            setIsSaving(false);
        }
    };

    // Loading state
    if (currentProfileLoading && !currentProfile) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="text-sm text-muted-foreground">Loading profile...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Error state
    if (currentProfileError && !currentProfile) {
        return (
            <Card className={className}>
                <CardContent className="py-12">
                    <Alert variant="destructive">
                        <AlertDescription className="ml-2">
                            {currentProfileError}
                        </AlertDescription>
                    </Alert>
                    <div className="mt-4 text-center">
                        <Button onClick={handleRefresh} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Retrying...
                                </>
                            ) : (
                                'Try Again'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // No profile state
    if (!currentProfile) {
        return (
            <Card className={className}>
                <CardContent className="py-12">
                    <div className="text-center space-y-4">
                        <User className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div>
                            <h3 className="text-lg font-semibold">No Profile Found</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Your profile could not be loaded.
                            </p>
                        </div>
                        <Button onClick={handleRefresh} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                'Load Profile'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Profile completion warning */}
            {currentProfile.profile_completion_percentage < 70 && (
                <Alert variant="warning">
                    <AlertDescription>
                        Your profile is {currentProfile.profile_completion_percentage}% complete.
                        Complete your profile to unlock all features and improve your visibility.
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Profile Management</CardTitle>
                    <CardDescription>
                        Manage your profile information, settings, and preferences
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="profile" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span className="hidden sm:inline">Profile</span>
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                <span className="hidden sm:inline">Settings</span>
                            </TabsTrigger>
                            <TabsTrigger value="social" className="flex items-center gap-2">
                                <LinkIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">Social</span>
                            </TabsTrigger>
                            <TabsTrigger value="stats" className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                <span className="hidden sm:inline">Stats</span>
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-6">
                            <TabsContent value="profile" className="space-y-4">
                                <ProfileForm profile={currentProfile} />
                            </TabsContent>

                            <TabsContent value="settings" className="space-y-4">
                                <ProfileSettings profile={currentProfile} />
                            </TabsContent>

                            <TabsContent value="social" className="space-y-4">
                                <ProfileSocialLinks profile={currentProfile} />
                            </TabsContent>

                            <TabsContent value="stats" className="space-y-4">
                                <ProfileStats profile={currentProfile} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
