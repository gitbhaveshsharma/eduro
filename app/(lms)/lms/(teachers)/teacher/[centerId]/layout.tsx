'use client';

import { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle, GraduationCap } from 'lucide-react';
import { CoachingAPI } from '@/lib/coaching';
import type { CoachingCenter } from '@/lib/schema/coaching.types';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { LayoutUtils } from '@/components/layout/config';
import type { BrandingConfig, SidebarItem } from '@/components/layout/types';

// Lazy load heavy components
const Skeleton = dynamic(() => import('@/components/ui/skeleton').then(m => ({ default: m.Skeleton })), {
    loading: () => <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
});
const Separator = dynamic(() => import('@/components/ui/separator').then(m => ({ default: m.Separator })));

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

// Memoize loading skeleton to prevent re-renders
const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="flex">
            <div className="hidden lg:block w-64 border-r bg-background p-4 space-y-4">
                <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-48 bg-gray-200 animate-pulse rounded" />
                <div className="border-t my-2" />
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-10 w-full bg-gray-200 animate-pulse rounded" />
                ))}
            </div>
            <div className="flex-1 p-6">
                <div className="h-10 w-64 mb-6 bg-gray-200 animate-pulse rounded" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const ErrorState = ({ error, onRetry, onBack }: { error: string; onRetry: () => void; onBack: () => void }) => (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
        <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-4 mt-4">
                <Button onClick={onRetry}>Try Again</Button>
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Teachers
                </Button>
            </div>
        </div>
    </div>
);

const NotFoundState = ({ onBack }: { onBack: () => void }) => (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
        <div className="max-w-2xl mx-auto text-center py-16">
            <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Coaching Center Not Found</h2>
            <p className="text-muted-foreground mb-6">
                The coaching center you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Button onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Teachers
            </Button>
        </div>
    </div>
);

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

    // Memoize expensive computations
    const sidebarItems = useMemo(() => LayoutUtils.getTeacherSidebarItems(centerId), [centerId]);
    const deviceType = useMemo(() => LayoutUtils.getDeviceType(), []);
    const navigationItems = useMemo(() => LayoutUtils.getTeacherNavigationItems(centerId, deviceType), [centerId, deviceType]);
    const headerItems = useMemo(() => LayoutUtils.getTeacherHeaderItems(centerId, deviceType), [centerId, deviceType]);

    const branding: BrandingConfig = useMemo(() => ({
        logoUrl: coachingCenter?.logo_url || null,
        name: coachingCenter?.name || 'Teaching Portal',
        subtitle: 'Teacher Portal',
    }), [coachingCenter?.logo_url, coachingCenter?.name]);

    const contextValue = useMemo(() => ({
        coachingCenter,
        isLoading,
        error,
        refetch: fetchCoachingCenter,
        centerId,
    }), [coachingCenter, isLoading, error, fetchCoachingCenter, centerId]);

    if (isLoading) return <LoadingSkeleton />;

    if (error) {
        return <ErrorState error={error} onRetry={fetchCoachingCenter} onBack={() => router.push('/lms/teachers')} />;
    }

    if (!coachingCenter) {
        return <NotFoundState onBack={() => router.push('/lms/teachers')} />;
    }

    return (
        <TeacherContext.Provider value={contextValue}>
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
                        devices: ['desktop', 'tablet'],
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