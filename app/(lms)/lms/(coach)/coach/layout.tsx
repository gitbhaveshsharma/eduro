'use client';

import { useState, useEffect, useCallback, createContext, useContext, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Building2,
    ArrowLeft,
    AlertCircle,
} from 'lucide-react';
import { useMyCoachingCenters, useMyCoachingCentersLoading, useCoachingStore } from '@/lib/coaching';
import type { CoachingCenter } from '@/lib/schema/coaching.types';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { LayoutUtils } from '@/components/layout/config';
import type { BrandingConfig, SidebarItem } from '@/components/layout/types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

/**
 * Coach Context - Provides coaching center data across coach routes
 * Child pages should use this instead of loading data themselves
 */
interface CoachContextType {
    coachingCenter: CoachingCenter | null;
    coachingCenterId: string | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const CoachContext = createContext<CoachContextType>({
    coachingCenter: null,
    coachingCenterId: null,
    isLoading: true,
    error: null,
    refetch: async () => { },
});

export function useCoachContext() {
    return useContext(CoachContext);
}

interface CoachLayoutProps {
    children: React.ReactNode;
}

export default function CoachLayout({ children }: CoachLayoutProps) {
    const router = useRouter();

    // Get coaching centers from store using stable selectors
    const myCoachingCenters = useMyCoachingCenters();
    const loading = useMyCoachingCentersLoading();
    const loadMyCoachingCenters = useCoachingStore((state) => state.loadMyCoachingCenters);

    // Use refs to prevent duplicate API calls and infinite loops
    const hasLoadedRef = useRef(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Load coaching centers on mount - ONLY ONCE
     */
    useEffect(() => {
        // If already loaded or currently loading, skip
        if (hasLoadedRef.current) {
            return;
        }

        const loadCenters = async () => {
            try {
                await loadMyCoachingCenters();
            } catch (err) {
                console.error('[CoachLayout] Error loading coaching centers:', err);
                setError(err instanceof Error ? err.message : 'Failed to load coaching center');
            } finally {
                // Mark as loaded regardless of success/failure
                hasLoadedRef.current = true;
            }
        };

        loadCenters();
    }, [loadMyCoachingCenters]);

    // Get primary coaching center - use useMemo to prevent unnecessary recalculations
    const coachingCenter = useMemo(() => {
        return myCoachingCenters && myCoachingCenters.length > 0 ? myCoachingCenters[0] : null;
    }, [myCoachingCenters]);

    const coachingCenterId = coachingCenter?.id || null;

    /**
     * Refetch coaching center data
     */
    const refetch = useCallback(async () => {
        hasLoadedRef.current = false;
        setError(null);
        try {
            await loadMyCoachingCenters();
        } catch (err) {
            console.error('[CoachLayout] Error refetching coaching centers:', err);
            setError(err instanceof Error ? err.message : 'Failed to load coaching center');
        } finally {
            hasLoadedRef.current = true;
        }
    }, [loadMyCoachingCenters]);

    // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
    // Build branding config from coaching center data - MEMOIZED to prevent re-renders
    const branding: BrandingConfig = useMemo(() => ({
        logoUrl: coachingCenter?.logo_url || null,
        name: coachingCenter?.name || 'Coaching Center',
        subtitle: 'All Branches',
    }), [coachingCenter?.logo_url, coachingCenter?.name]);

    // Get sidebar items for coach view - MEMOIZED since it's static
    const sidebarItems: SidebarItem[] = useMemo(
        () => LayoutUtils.getSidebarItemsForPage('lms-coach'),
        []
    );

    // Memoize the forceConfig to prevent ConditionalLayout re-renders
    const forceConfig = useMemo(() => ({
        page: 'lms-coach' as const,
        headerType: 'universal' as const,
        showBottomNav: false,
        branding,
        sidebar: {
            enabled: true,
            defaultOpen: true,
            position: 'left' as const,
            width: '280px',
            collapsible: true,
            overlay: true,
        },
    }), [branding]);

    // Memoize context value to prevent child re-renders
    const contextValue = useMemo(() => ({
        coachingCenter,
        coachingCenterId,
        isLoading: loading,
        error,
        refetch,
    }), [coachingCenter, coachingCenterId, loading, error, refetch]);

    // Show loading state if:
    // 1. Store is loading AND we haven't finished the initial load attempt
    // 2. OR we're still loading and don't have data yet
    const isInitialLoading = !hasLoadedRef.current || (loading && !coachingCenter && !error);

    // Loading state - shows while data is being fetched
    if (isInitialLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
                <LoadingSpinner
                    title={coachingCenter?.name || 'Coaching Center'}
                    message="Loading your coaching center..."
                    size="lg"
                    variant="primary"
                />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
                <div className="max-w-2xl mx-auto">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <div className="flex gap-4 mt-4">
                        <Button onClick={refetch}>Try Again</Button>
                        <Button variant="outline" onClick={() => router.push('/lms')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to LMS
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // No coaching center found - Only shown AFTER load completes
    if (!coachingCenter) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
                <div className="max-w-2xl mx-auto text-center py-16">
                    <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold mb-2">No Coaching Center Found</h2>
                    <p className="text-muted-foreground mb-6">
                        You don&apos;t have any coaching centers. Create one to get started.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button onClick={() => router.push('/coaching/create')}>
                            <Building2 className="h-4 w-4 mr-2" />
                            Create Coaching Center
                        </Button>
                        <Button variant="outline" onClick={() => router.push('/lms')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to LMS
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <CoachContext.Provider value={contextValue}>
            <ConditionalLayout
                platform="lms"
                forceConfig={forceConfig}
                sidebarItems={sidebarItems}
            >
                <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </ConditionalLayout>
        </CoachContext.Provider>
    );
}
