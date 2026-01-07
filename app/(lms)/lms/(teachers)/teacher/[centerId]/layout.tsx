'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle, GraduationCap } from 'lucide-react';
import { CoachingAPI } from '@/lib/coaching';
import type { CoachingCenter } from '@/lib/schema/coaching.types';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { LayoutUtils } from '@/components/layout/config';
import type { BrandingConfig, SidebarItem } from '@/components/layout/types';

interface TeacherContextType {
    coachingCenter: CoachingCenter | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    centerId: string;
}

const TeacherContext = createContext<TeacherContextType>({
    coachingCenter: null,
    isLoading: true,
    error: null,
    refetch: async () => { },
    centerId: '',
});

export function useTeacherContext() {
    return useContext(TeacherContext);
}

interface TeacherCoachingLayoutProps {
    children: React.ReactNode;
    params: {
        centerId: string;
    };
}

export default function TeacherCoachingLayout({ children, params }: TeacherCoachingLayoutProps) {
    const router = useRouter();
    const { centerId } = params;

    const [coachingCenter, setCoachingCenter] = useState<CoachingCenter | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCoachingCenter = useCallback(async () => {
        if (!centerId) {
            setError('Coaching Center ID is required');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const centerResult = await CoachingAPI.getCenter(centerId);
            if (!centerResult.success || !centerResult.data) {
                setError(centerResult.error || 'Failed to load coaching center');
                return;
            }
            setCoachingCenter(centerResult.data);
        } catch (err) {
            console.error('Error fetching coaching center:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [centerId]);

    useEffect(() => {
        fetchCoachingCenter();
    }, [fetchCoachingCenter]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="flex">
                    <div className="hidden lg:block w-64 border-r bg-background p-4 space-y-4">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-4 w-48" />
                        <Separator />
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                    <div className="flex-1 p-6">
                        <Skeleton className="h-10 w-64 mb-6" />
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {[1, 2, 3, 4].map(i => (
                                <Skeleton key={i} className="h-32 rounded-lg" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                        <Button onClick={fetchCoachingCenter}>Try Again</Button>
                        <Button variant="outline" onClick={() => router.push('/lms/teachers')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Teachers
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!coachingCenter) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
                <div className="max-w-2xl mx-auto text-center py-16">
                    <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Coaching Center Not Found</h2>
                    <p className="text-muted-foreground mb-6">
                        The coaching center you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
                    </p>
                    <Button onClick={() => router.push('/lms/teachers')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Teachers
                    </Button>
                </div>
            </div>
        );
    }

    // Detect current device type for filtering
    const deviceType = LayoutUtils.getDeviceType();

    const sidebarItems: SidebarItem[] = LayoutUtils.getTeacherSidebarItems(centerId);

    // Get navigation items with dynamic hrefs for bottom nav (filtered by device)
    const navigationItems = LayoutUtils.getTeacherNavigationItems(centerId, deviceType);

    // Get header items with dynamic hrefs (filtered by device)
    const headerItems = LayoutUtils.getTeacherHeaderItems(centerId, deviceType);

    const branding: BrandingConfig = {
        logoUrl: coachingCenter?.logo_url || null,
        name: coachingCenter?.name || 'Teaching Portal',
        subtitle: 'Teacher Portal',
    };

    return (
        <TeacherContext.Provider value={{ coachingCenter, isLoading, error, refetch: fetchCoachingCenter, centerId }}>
            <ConditionalLayout
                platform="lms"
                forceConfig={{
                    page: 'lms-teacher',
                    headerType: 'universal',
                    showBottomNav: true,
                    branding,
                    sidebar: {
                        enabled: true,
                        defaultOpen: true,
                        position: 'left',
                        width: '280px',
                        collapsible: true,
                        overlay: true,
                        devices: ['desktop', 'tablet'], // Show sidebar on desktop and tablet devices
                    },
                }}
                sidebarItems={sidebarItems}
                navigationItems={navigationItems}
                headerItems={headerItems}
            >
                <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </ConditionalLayout>
        </TeacherContext.Provider>
    );
}
