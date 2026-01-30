/**
 * Branch Manager - Branches Layout
 * 
 * Layout for branch manager routes with branch context
 * Uses ConditionalLayout with UniversalHeader for consistent UI
 * Shows coaching center branding (logo + name) for white-label experience
 */

'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    MapPin,
    ArrowLeft,
    AlertCircle,
} from 'lucide-react';
import { CoachingAPI } from '@/lib/coaching';
import type { CoachingBranch, CoachingCenter } from '@/lib/schema/coaching.types';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { LayoutUtils } from '@/components/layout/config';
import type { BrandingConfig, SidebarItem } from '@/components/layout/types';

/**
 * Branch Context - Extended to include full coaching center data for branding
 */
interface BranchContextType {
    branch: CoachingBranch | null;
    coachingCenter: CoachingCenter | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType>({
    branch: null,
    coachingCenter: null,
    isLoading: true,
    error: null,
    refetch: async () => { },
});

export function useBranchContext() {
    return useContext(BranchContext);
}

interface BranchesLayoutProps {
    children: React.ReactNode;
    params: {
        branchId: string;
    };
}

export default function BranchesLayout({ children, params }: BranchesLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { branchId } = params;

    const [branch, setBranch] = useState<CoachingBranch | null>(null);
    const [coachingCenter, setCoachingCenter] = useState<CoachingCenter | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch branch and coaching center details
     */
    const fetchBranch = useCallback(async () => {
        if (!branchId) {
            setError('Branch ID is required');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Get branch details
            const branchResult = await CoachingAPI.getBranch(branchId);

            if (!branchResult.success || !branchResult.data) {
                setError(branchResult.error || 'Failed to load branch');
                return;
            }

            setBranch(branchResult.data);

            // Get full coaching center details for branding
            const centerResult = await CoachingAPI.getCenter(branchResult.data.coaching_center_id);
            if (centerResult.success && centerResult.data) {
                setCoachingCenter(centerResult.data);
            }
        } catch (err) {
            console.error('Error fetching branch:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchBranch();
    }, [fetchBranch]);

    /**
     * Get current active nav item for sidebar highlighting
     */
    const getActiveNavItem = () => {
        if (!pathname) return 'dashboard';
        const segments = pathname.split('/');
        // Get the last segment after branchId
        const branchIdIndex = segments.findIndex(s => s === branchId);
        if (branchIdIndex >= 0 && segments[branchIdIndex + 1]) {
            return segments[branchIdIndex + 1];
        }
        return 'dashboard';
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="flex">
                    {/* Sidebar Skeleton */}
                    <div className="hidden lg:block w-64 border-r bg-background p-4 space-y-4">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-4 w-48" />
                        <Separator />
                        {[1, 2, 3, 4, 5, 6].map((i) => (
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
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <div className="flex gap-4 mt-4">
                        <Button onClick={fetchBranch}>Try Again</Button>
                        <Button variant="outline" onClick={() => router.push('/lms')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to LMS
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!branch) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
                <div className="max-w-2xl mx-auto text-center py-16">
                    <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Branch Not Found</h2>
                    <p className="text-muted-foreground mb-6">
                        The branch you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
                    </p>
                    <Button onClick={() => router.push('/lms')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to LMS
                    </Button>
                </div>
            </div>
        );
    }

    // Build branding config from coaching center data
    // This creates the white-label experience showing the coaching center's logo and name
    const branding: BrandingConfig = {
        logoUrl: coachingCenter?.logo_url || null,
        name: coachingCenter?.name || 'Coaching Center',
        subtitle: branch.name, // Show branch name as subtitle
    };

    // Get sidebar items with dynamic hrefs for this branch
    const sidebarItems: SidebarItem[] = LayoutUtils.getBranchManagerSidebarItems(branchId).map(item => ({
        ...item,
        active: getActiveNavItem() === item.id,
    }));

    return (
        <BranchContext.Provider
            value={{
                branch,
                coachingCenter,
                isLoading,
                error,
                refetch: fetchBranch,
            }}
        >
            <ConditionalLayout
                platform="lms"
                forceConfig={{
                    page: 'lms-branch-manager',
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
                sidebarItems={sidebarItems} // Pass custom sidebar items with branchId in hrefs
            >
                <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </ConditionalLayout>
        </BranchContext.Provider>
    );
}
