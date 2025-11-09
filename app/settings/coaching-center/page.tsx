/**
 * Coaching Centers Page
 * 
 * Dedicated page for coaching center management
 * Simply renders the CoachingManager component
 */

"use client";

import { useCurrentProfile, useCurrentProfileLoading } from '@/lib/profile';
import { CoachingManager } from '@/components/coaching/management/coaching-manager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function CoachingCentersPage() {
    const profile = useCurrentProfile();
    const loading = useCurrentProfileLoading();

    // Show loading spinner
    if (loading || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner
                    title="Coaching Centers"
                    message="Loading coaching management..."
                    size="lg"
                    variant="primary"
                />
            </div>
        );
    }

    // Check if user has coaching access (role C, SA, or A)
    const hasCoachingAccess = profile?.role === 'C' || profile?.role === 'SA' || profile?.role === 'A';

    // If user doesn't have coaching access, show access denied
    if (!hasCoachingAccess) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="w-full max-w-6xl mx-auto">
                    <div className="space-y-6">
                        <div className="space-y-2 text-center">
                            <h1 className="text-3xl font-bold tracking-tight">Coaching Center Management</h1>
                            <p className="text-muted-foreground">
                                Manage your coaching centers, students, and courses
                            </p>
                        </div>

                        <Alert className="bg-muted/50 border-border">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="ml-2">
                                <strong>Access Restricted</strong>
                                <br />
                                Coaching center management is only available for users with Coach, Admin, or Super Admin roles.
                                Your current role: <strong>
                                    {profile?.role === 'T' ? 'Teacher' :
                                        profile?.role === 'S' ? 'Student' :
                                            profile?.role || 'Unknown'}
                                </strong>
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>
            </div>
        );
    }

    // Simply render the CoachingManager component
    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-b from-background to-muted/10">
            <div className="w-full max-w-6xl mx-auto">
                <CoachingManager />
            </div>
        </div>
    );
}