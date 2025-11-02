/**
 * Coaching Center Manager Component
 * 
 * Main interface for managing coaching centers and branches
 * Only accessible to users with role 'C' (Coach)
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCurrentProfile } from '@/lib/profile';
import {
    useMyCoachingCenters,
    useMyCoachingCentersLoading,
    useMyCoachingCentersError,
    useCoachingStore,
} from '@/lib/coaching';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Building2,
    AlertCircle,
    Network,
    Settings
} from 'lucide-react';
import { CoachingCenterUpdateForm } from './coaching-center-update-form';
import { CoachingBranchManager } from './coaching-branch-manager';
import { showWarningToast, showSuccessToast, showErrorToast } from '@/lib/toast';
import { ComponentLoadingSpinner } from '@/components/ui/loading-spinner';

interface CoachingManagerProps {
    className?: string;
}

export function CoachingManager({ className = '' }: CoachingManagerProps) {
    const profile = useCurrentProfile();
    const myCoachingCenters = useMyCoachingCenters();
    const loading = useMyCoachingCentersLoading();
    const error = useMyCoachingCentersError();

    const {
        loadMyCoachingCenters,
        updateCoachingCenter,
        uploadLogo,
        uploadCover,
        loadCoachingCenter,
    } = useCoachingStore();

    const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});
    const [activeTab, setActiveTab] = useState<string>('centers');
    const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
    const [isLoadingBranchData, setIsLoadingBranchData] = useState(false);

    // Check if user has coach role (memoized)
    const isCoach = useMemo(() =>
        profile?.role === 'C' || profile?.role === 'SA' || profile?.role === 'A',
        [profile?.role]
    );

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

    // Selector to get selected center from coaching store (memoized)
    const selectedCenter = useCoachingStore(
        useCallback((state) => {
            if (!selectedCenterId) return null;
            const cached = state.coachingCenterCache.get(selectedCenterId);
            if (cached) return cached as any;
            if (state.currentCoachingCenter && state.currentCoachingCenter.id === selectedCenterId)
                return state.currentCoachingCenter;
            const my = state.myCoachingCenters.find((c) => c.id === selectedCenterId);
            return my || null;
        }, [selectedCenterId])
    );

    // Memoized event handlers to prevent unnecessary re-renders
    const handleManageBranches = useCallback(async (centerId: string) => {
        setIsLoadingBranchData(true);
        try {
            await loadCoachingCenter(centerId);
            setSelectedCenterId(centerId);
            setActiveTab('branches');
        } catch (e) {
            console.error('Failed to load center for branches', e);
            showErrorToast('Failed to load coaching center details');
        } finally {
            setIsLoadingBranchData(false);
        }
    }, [loadCoachingCenter]);

    const handleRetryLoad = useCallback(() => {
        setHasAttemptedLoad(false);
        loadCenters();
    }, [loadCenters]);

    // When user switches to the Branches tab, automatically select a center
    useEffect(() => {
        if (activeTab !== 'branches') return;

        // If a center is already selected, ensure it's loaded
        if (selectedCenterId) {
            setIsLoadingBranchData(true);
            loadCoachingCenter(selectedCenterId)
                .catch((e) => console.error('Failed to ensure center loaded:', e))
                .finally(() => setIsLoadingBranchData(false));
            return;
        }

        // No selected center yet — pick the first available center for immediate display
        if (myCoachingCenters && myCoachingCenters.length > 0) {
            const firstId = myCoachingCenters[0].id;
            handleManageBranches(firstId);
        }
    }, [activeTab, selectedCenterId, myCoachingCenters, loadCoachingCenter, handleManageBranches]);

    // Memoized update handler factory
    const createUpdateHandler = useCallback((centerId: string) => {
        return async (data: any, files: { logo?: File; cover?: File }) => {
            setUpdatingIds((s) => ({ ...s, [centerId]: true }));
            try {
                const updated = await updateCoachingCenter(centerId, data);
                if (!updated) {
                    showErrorToast('Failed to update coaching center');
                    return;
                }

                if (files.logo) {
                    const ok = await uploadLogo(centerId, files.logo);
                    if (!ok) showWarningToast('Logo upload failed');
                }
                if (files.cover) {
                    const ok = await uploadCover(centerId, files.cover);
                    if (!ok) showWarningToast('Cover upload failed');
                }

                showSuccessToast('Coaching center updated successfully');
                setHasAttemptedLoad(false);
                await loadCenters();
            } catch (err) {
                console.error('Error updating center:', err);
                showErrorToast(err instanceof Error ? err.message : 'Failed to update');
            } finally {
                setUpdatingIds((s) => ({ ...s, [centerId]: false }));
            }
        };
    }, [updateCoachingCenter, uploadLogo, uploadCover, loadCenters]);

    // Memoized cancel handler
    const handleCancel = useCallback(() => {
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

    // Loading state - Show while initially loading
    if (loading && !myCoachingCenters && !error) {
        return (
            <Card className={className}>
                <CardContent className="py-12">
                    <ComponentLoadingSpinner component="coaching centers" size="lg" />
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
                            <TabsTrigger value="branches" className="flex items-center gap-2">
                                <Network className="h-4 w-4" />
                                <span className="hidden sm:inline">Branches</span>
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
                            {loading ? (
                                <div className="py-12">
                                    <ComponentLoadingSpinner component="coaching centers" size="sm" />
                                </div>
                            ) : !myCoachingCenters || myCoachingCenters.length === 0 ? (
                                <div className="text-center py-12">
                                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Coaching Centers</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        You don't have any coaching centers assigned to you.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-6">
                                    {myCoachingCenters.map((center) => (
                                        <div key={center.id} className="space-y-3">
                                            {/* <div className="flex justify-end">
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    onClick={() => handleManageBranches(center.id)}
                                                    disabled={isLoadingBranchData}
                                                >
                                                    {isLoadingBranchData ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Loading...
                                                        </>
                                                    ) : (
                                                        'Manage Branches'
                                                    )}
                                                </Button>
                                            </div> */}

                                            <CoachingCenterUpdateForm
                                                initialData={center}
                                                onSubmit={createUpdateHandler(center.id)}
                                                onCancel={handleCancel}
                                                isLoading={!!updatingIds[center.id]}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Branches Tab */}
                        <TabsContent value="branches" className="space-y-4">
                            {isLoadingBranchData ? (
                                <div className="py-12">
                                    <ComponentLoadingSpinner component="branch data" size="sm" />
                                </div>
                            ) : selectedCenterId ? (
                                selectedCenter ? (
                                    <CoachingBranchManager
                                        coachingCenterId={selectedCenterId}
                                        coachingCenterName={selectedCenter.name || 'Selected Center'}
                                        centerOwnerId={(selectedCenter as any).owner_id || profile?.id || ''}
                                    />
                                ) : (
                                    <div className="py-12">
                                        <ComponentLoadingSpinner component="center details" size="sm" />
                                    </div>
                                )
                            ) : !myCoachingCenters || myCoachingCenters.length === 0 ? (
                                <div className="text-center py-12">
                                    <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Centers Available</h3>
                                    <p className="text-sm text-muted-foreground">
                                        You need to have at least one coaching center to manage branches
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Select a Center</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Select a coaching center from "My Centers" tab to manage its branches
                                    </p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Settings Tab */}
                        <TabsContent value="settings" className="space-y-4">
                            {loading ? (
                                <div className="py-12">
                                    <ComponentLoadingSpinner component="settings" size="lg" />
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Settings</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Global coaching center settings coming soon...
                                    </p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}