/**
 * Coaching Center Manager Component
 * 
 * Main interface for managing coaching centers and branches
 * Only accessible to users with role 'C' (Coach)
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useCurrentProfile } from '@/lib/profile';
import {
    useMyCoachingCenters,
    useMyCoachingCentersLoading,
    useMyCoachingCentersError,
    useCoachingStore,
    useCreateMode
} from '@/lib/coaching';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Loader2,
    Plus,
    Building2,
    AlertCircle,
    BarChart3,
    Settings
} from 'lucide-react';
import { CoachingCenterUpdateForm } from './coaching-center-update-form';
import { CoachingCenterCard } from './coaching-center-card';
import { CoachingCenterDashboard } from './coaching-center-dashboard';
import { showWarningToast } from '@/lib/toast';

interface CoachingManagerProps {
    className?: string;
}

export function CoachingManager({ className = '' }: CoachingManagerProps) {
    const profile = useCurrentProfile();
    const myCoachingCenters = useMyCoachingCenters();
    const loading = useMyCoachingCentersLoading();
    const error = useMyCoachingCentersError();
    const isCreateMode = useCreateMode();

    const {
        loadMyCoachingCenters,
        setCreateMode,
    } = useCoachingStore();

    const [activeTab, setActiveTab] = useState<string>('centers');
    const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

    // Check if user has coach role
    const isCoach = profile?.role === 'C' || profile?.role === 'SA' || profile?.role === 'A';

    // Memoized load function to prevent recreating on every render
    const loadCenters = useCallback(async () => {
        if (isCoach && !loading && !hasAttemptedLoad) {
            console.log('[CoachingManager] Loading coaching centers...');
            await loadMyCoachingCenters();
            setHasAttemptedLoad(true);
        }
    }, [isCoach, loading, hasAttemptedLoad, loadMyCoachingCenters]);

    // Load coaching centers only once when component mounts and user is coach
    useEffect(() => {
        loadCenters();
    }, [loadCenters]);

    // Reset attempted load when profile changes (user logs in/out)
    useEffect(() => {
        setHasAttemptedLoad(false);
    }, [profile?.id]);

    // Memoized event handlers to prevent unnecessary re-renders
    const handleCreateNew = useCallback(() => {
        if (!isCoach) {
            showWarningToast('Only coaches can create coaching centers');
            return;
        }
        setCreateMode(true);
        setSelectedCenterId(null);
    }, [isCoach, setCreateMode]);

    const handleCancelCreate = useCallback(() => {
        setCreateMode(false);
    }, [setCreateMode]);

    const handleCreateSuccess = useCallback(() => {
        setCreateMode(false);
        setHasAttemptedLoad(false); // Reset to trigger reload
        loadCenters();
    }, [setCreateMode, loadCenters]);

    const handleViewDashboard = useCallback((centerId: string) => {
        setSelectedCenterId(centerId);
        setActiveTab('dashboard');
    }, []);

    const handleRetryLoad = useCallback(() => {
        setHasAttemptedLoad(false);
        loadCenters();
    }, [loadCenters]);

    // Not a coach
    if (!isCoach) {
        return (
            <Card className={className}>
                <CardContent className="py-12">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="ml-2">
                            Only coaches can access coaching center management.
                            Your current role: {profile?.role ? profile.role : 'Unknown'}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    // Loading state
    if (loading && !myCoachingCenters && !error) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="text-sm text-muted-foreground">Loading coaching centers...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Error state
    if (error && !myCoachingCenters) {
        return (
            <Card className={className}>
                <CardContent className="py-12">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="ml-2">
                            {error}
                        </AlertDescription>
                    </Alert>
                    <div className="mt-4 text-center">
                        <Button onClick={handleRetryLoad}>
                            Try Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Create mode - Note: Center creation is not available via the update-only form
    // This needs a separate create flow or the update form needs to support creation
    if (isCreateMode) {
        return (
            <div className={`space-y-6 ${className}`}>
                <Card>
                    <CardHeader>
                        <CardTitle>Create New Coaching Center</CardTitle>
                        <CardDescription>
                            Set up your coaching center with all the necessary details
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <AlertDescription>
                                        Center creation flow needs to be implemented. The update form is
                                        designed for editing existing centers only. Please select an existing
                                        center to edit its details.
                                    </AlertDescription>
                                </div>
                                <div className="mt-4 md:mt-0">
                                    <Button variant="outline" size="sm" onClick={handleCancelCreate}>
                                        Back to centers
                                    </Button>
                                </div>
                            </div>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Main interface
    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Coaching Center Management</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your coaching centers and branches
                    </p>
                </div>
                <Button onClick={handleCreateNew} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Center
                </Button>
            </div>

            {/* Tabs */}
            <Card>
                <CardHeader>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="centers" className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <span className="hidden sm:inline">My Centers</span>
                            </TabsTrigger>
                            <TabsTrigger value="dashboard" className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                <span className="hidden sm:inline">Dashboard</span>
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                <span className="hidden sm:inline">Settings</span>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} className="w-full">
                        {/* My Centers Tab */}
                        <TabsContent value="centers" className="space-y-4">
                            {!myCoachingCenters || myCoachingCenters.length === 0 ? (
                                <div className="text-center py-12">
                                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Coaching Centers</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        You haven't created any coaching centers yet.
                                    </p>
                                    <Button onClick={handleCreateNew} className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Create Your First Center
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {myCoachingCenters.map((center) => (
                                        <CoachingCenterCard
                                            key={center.id}
                                            center={center}
                                            onViewDashboard={() => handleViewDashboard(center.id)}
                                            onEditSuccess={() => {
                                                setHasAttemptedLoad(false);
                                                loadCenters();
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Dashboard Tab */}
                        <TabsContent value="dashboard" className="space-y-4">
                            {selectedCenterId ? (
                                <CoachingCenterDashboard centerId={selectedCenterId} />
                            ) : (
                                <div className="text-center py-12">
                                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Select a Center</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Select a coaching center from "My Centers" tab to view its dashboard
                                    </p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Settings Tab */}
                        <TabsContent value="settings" className="space-y-4">
                            <div className="text-center py-12">
                                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Settings</h3>
                                <p className="text-sm text-muted-foreground">
                                    Global coaching center settings coming soon...
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}