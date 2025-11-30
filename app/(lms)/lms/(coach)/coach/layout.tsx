/**
 * Coach LMS Layout
 * 
 * Layout for coaching center owner/manager routes
 * Uses ConditionalLayout with UniversalHeader for consistent UI
 * Shows coaching center branding (logo + name) for white-label experience
 * 
 * This is the unified view for coaches - they can manage ALL branches
 * of their coaching center from a single interface
 */

'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Building2,
    ArrowLeft,
    AlertCircle,
} from 'lucide-react';
import { CoachingAPI } from '@/lib/coaching';
import { useMyCoachingCenters, useMyCoachingCentersLoading, useCoachingStore } from '@/lib/coaching';
import type { CoachingCenter } from '@/lib/schema/coaching.types';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { LayoutUtils } from '@/components/layout/config';
import type { BrandingConfig, SidebarItem } from '@/components/layout/types';

/**
 * Coach Context - Provides coaching center data across coach routes
 */
interface CoachContextType {
    coachingCenter: CoachingCenter | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const CoachContext = createContext<CoachContextType>({
    coachingCenter: null,
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

    // Get coaching centers from store
    const myCoachingCenters = useMyCoachingCenters();
    const loading = useMyCoachingCentersLoading();
    const { loadMyCoachingCenters } = useCoachingStore();

    const [coachingCenter, setCoachingCenter] = useState<CoachingCenter | null>(null);
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Load coaching centers on mount
     */
    const loadCenters = useCallback(async () => {
        if (loading || hasAttemptedLoad) return;

        try {
            await loadMyCoachingCenters();
            setHasAttemptedLoad(true);
        } catch (err) {
            console.error('Error loading coaching centers:', err);
            setError(err instanceof Error ? err.message : 'Failed to load coaching center');
        }
    }, [loading, hasAttemptedLoad, loadMyCoachingCenters]);

    useEffect(() => {
        loadCenters();
    }, [loadCenters]);

    // Set primary coaching center when loaded
    useEffect(() => {
        if (myCoachingCenters && myCoachingCenters.length > 0) {
            setCoachingCenter(myCoachingCenters[0]);
        }
    }, [myCoachingCenters]);

    /**
     * Refetch coaching center data
     */
    const refetch = useCallback(async () => {
        setHasAttemptedLoad(false);
        setError(null);
        await loadCenters();
    }, [loadCenters]);

    // Loading state
    if (loading || !hasAttemptedLoad) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="flex">
                    {/* Sidebar Skeleton */}
                    <div className="hidden lg:block w-64 border-r bg-background p-4 space-y-4">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-4 w-48" />
                        <Separator />
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                    {/* Content Skeleton */}
                    <div className="flex-1 p-6">
                        <Skeleton className="h-10 w-64 mb-6" />
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-32 rounded-lg" />
                            ))}
                        </div>
                    </div>
                </div>
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

    // Build branding config from coaching center data
    // This creates the white-label experience showing the coaching center's logo and name
    const branding: BrandingConfig = {
        logoUrl: coachingCenter.logo_url || null,
        name: coachingCenter.name,
        subtitle: 'All Branches', // Indicate unified view across branches
    };

    // Get sidebar items for coach view
    const sidebarItems: SidebarItem[] = LayoutUtils.getSidebarItemsForPage('lms-coach');

    return (
        <CoachContext.Provider
            value={{
                coachingCenter,
                isLoading: loading,
                error,
                refetch,
            }}
        >
            <ConditionalLayout
                platform="lms"
                forceConfig={{
                    page: 'lms-coach',
                    headerType: 'universal',
                    showBottomNav: false,
                    branding, // Pass branding for white-label header
                    sidebar: {
                        enabled: true,
                        defaultOpen: true,
                        position: 'left',
                        width: '280px',
                        collapsible: true,
                        overlay: true,
                    },
                }}
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
