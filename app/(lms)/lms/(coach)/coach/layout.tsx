'use client';

import { useState, useEffect, createContext, useContext, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Building2,
    ArrowLeft,
    AlertCircle,
} from 'lucide-react';
import { useCoachingStore, CoachingService } from '@/lib/coaching';
import type { CoachingCenter, CoachingBranch } from '@/lib/schema/coaching.types';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { LayoutUtils } from '@/components/layout/config';
import type { BrandingConfig, SidebarItem } from '@/components/layout/types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

/**
 * Branch info type for context (minimal data needed for filters)
 */
interface BranchInfo {
    id: string;
    name: string;
}

/**
 * Coach Context - Provides coaching center data across coach routes
 * OPTIMIZATION: Includes branches to prevent duplicate API calls in child components
 */
interface CoachContextType {
    coachingCenter: CoachingCenter | null;
    coachingCenterId: string | null;
    /** Branches for the coaching center - loaded once, shared with all children */
    branches: BranchInfo[];
    /** Branch IDs for quick lookups */
    branchIds: string[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const CoachContext = createContext<CoachContextType>({
    coachingCenter: null,
    coachingCenterId: null,
    branches: [],
    branchIds: [],
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

    // Local state for loading and error
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasLoadedRef = useRef(false);

    // State for branches (loaded once with coaching center)
    const [branches, setBranches] = useState<BranchInfo[]>([]);

    // Subscribe to store state directly - no selectors
    const myCoachingCenters = useCoachingStore((state) => state.myCoachingCenters);

    /**
     * Load coaching centers AND branches on mount - ONLY ONCE
     * This prevents duplicate API calls from child components
     */
    useEffect(() => {
        if (hasLoadedRef.current) {
            return;
        }

        hasLoadedRef.current = true;

        const loadData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Load coaching centers first
                const loadMyCoachingCenters = useCoachingStore.getState().loadMyCoachingCenters;
                await loadMyCoachingCenters();

                // Get the primary coaching center
                const centers = useCoachingStore.getState().myCoachingCenters;
                const primaryCenter = centers && centers.length > 0 ? centers[0] : null;

                // If we have a center, load branches
                if (primaryCenter?.id) {
                    console.log('[CoachLayout] 🔄 Loading branches for coaching center:', primaryCenter.id);
                    const branchResult = await CoachingService.getBranchesByCenter(primaryCenter.id);
                    if (branchResult.success && branchResult.data) {
                        const branchInfos = branchResult.data.map((b: CoachingBranch) => ({
                            id: b.id,
                            name: b.name,
                        }));
                        setBranches(branchInfos);
                        console.log('[CoachLayout] ✅ Loaded', branchInfos.length, 'branches');
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load coaching center');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Get primary coaching center
    const coachingCenter = useMemo(() => {
        return myCoachingCenters && myCoachingCenters.length > 0 ? myCoachingCenters[0] : null;
    }, [myCoachingCenters]);

    const coachingCenterId = coachingCenter?.id || null;

    // Memoize branch IDs for quick lookups
    const branchIds = useMemo(() => branches.map(b => b.id), [branches]);

    /**
     * Refetch coaching center and branches data
     */
    const refetch = useCallback(async () => {
        hasLoadedRef.current = false;
        setIsLoading(true);
        setError(null);
        setBranches([]);

        try {
            const loadMyCoachingCenters = useCoachingStore.getState().loadMyCoachingCenters;
            await loadMyCoachingCenters();

            // Reload branches
            const centers = useCoachingStore.getState().myCoachingCenters;
            const primaryCenter = centers && centers.length > 0 ? centers[0] : null;

            if (primaryCenter?.id) {
                const branchResult = await CoachingService.getBranchesByCenter(primaryCenter.id);
                if (branchResult.success && branchResult.data) {
                    setBranches(branchResult.data.map((b: CoachingBranch) => ({
                        id: b.id,
                        name: b.name,
                    })));
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load coaching center');
        } finally {
            setIsLoading(false);
            hasLoadedRef.current = true;
        }
    }, []);

    // Build branding config
    const branding: BrandingConfig = useMemo(() => ({
        logoUrl: coachingCenter?.logo_url || null,
        name: coachingCenter?.name || 'Coaching Center',
        subtitle: 'All Branches',
    }), [coachingCenter?.logo_url, coachingCenter?.name]);

    // Get sidebar items
    const sidebarItems: SidebarItem[] = useMemo(
        () => LayoutUtils.getSidebarItemsForPage('lms-coach'),
        []
    );

    // Memoize forceConfig
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

    // Memoize context value - includes branches for child components
    const contextValue = useMemo(() => ({
        coachingCenter,
        coachingCenterId,
        branches,
        branchIds,
        isLoading,
        error,
        refetch,
    }), [coachingCenter, coachingCenterId, branches, branchIds, isLoading, error, refetch]);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
                <LoadingSpinner
                    title="Coaching Center"
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

    // No coaching center found
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
