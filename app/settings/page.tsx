/**
 * Settings Page
 * 
 * Centralized settings and management page for all users
 * - Profile Management (All users)
 * - Coaching Center Management (Only for users with role 'C', 'SA', or 'A')
 */

"use client";

import { useCurrentProfile, useCurrentProfileLoading } from '@/lib/profile';
import { ProfileManager } from '@/components/profile/profile-manager';
import { CoachingManager } from '@/components/coaching/management/coaching-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Building2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
    const profile = useCurrentProfile();
    const loading = useCurrentProfileLoading();
    const [activeTab, setActiveTab] = useState<string>('profile');

    // Check if user has coaching access (role C, SA, or A)
    const hasCoachingAccess = profile?.role === 'C' || profile?.role === 'SA' || profile?.role === 'A';

    // Auto-switch to profile tab if user navigates to coaching but doesn't have access
    useEffect(() => {
        if (activeTab === 'coaching' && !hasCoachingAccess && !loading && profile) {
            setActiveTab('profile');
        }
    }, [activeTab, hasCoachingAccess, loading, profile]);

    // FIXED: Show loading spinner until we have profile data AND loading is complete
    if (loading || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner
                    title="Settings"
                    message="Loading your settings and preferences..."
                    size="lg"
                    variant="primary"
                />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">
                        Manage your profile, preferences, and {hasCoachingAccess ? 'coaching centers' : 'account settings'}
                    </p>
                </div>

                {/* Main Content */}
                <Card>
                    <CardHeader>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className={`grid w-full ${hasCoachingAccess ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                <TabsTrigger value="profile" className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Profile Management
                                </TabsTrigger>
                                {hasCoachingAccess && (
                                    <TabsTrigger value="coaching" className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        Coaching Management
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                </Card>
                <Tabs value={activeTab} className="w-full">
                    {/* Profile Management Tab - Available to all users */}
                    <TabsContent value="profile" className="space-y-4 mt-0">
                        <ProfileManager />
                    </TabsContent>

                    {/* Coaching Management Tab - Only for coaches (role C, SA, or A) */}
                    {hasCoachingAccess && (
                        <TabsContent value="coaching" className="space-y-4 mt-0">
                            <CoachingManager />
                        </TabsContent>
                    )}
                </Tabs>


                {/* Info Card for non-coaching users */}
                {!hasCoachingAccess && (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="ml-2">
                            <strong>Want to manage coaching centers?</strong>
                            <br />
                            Coaching center management is only available for users with the Coach role.
                            Current role: <strong>{profile?.role === 'T' ? 'Teacher' : profile?.role === 'S' ? 'Student' : profile?.role || 'Unknown'}</strong>
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
    );
}