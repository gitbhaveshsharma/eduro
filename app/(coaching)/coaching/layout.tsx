"use client"
import { useState, useEffect, useRef } from "react";
import { ConditionalLayout } from "@/components/layout/conditional-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CoachingFilterPanelProvider } from "@/components/coaching/search/coaching-filter-panel-context";
import { PermissionGuard } from "@/components/permissions";
import { LOCATION_PERMISSION } from "@/lib/permissions";
import { useCoachingStore } from "@/lib/store/coaching.store";
import { Card, CardContent } from "@/components/ui/card";

// Skeleton component for preloading state
function CoachingPageSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
                {/* Header Skeleton */}
                <div className="space-y-4">
                    <div className="h-10 w-64 bg-muted rounded animate-pulse" />
                    <div className="h-5 w-96 bg-muted rounded animate-pulse" />
                </div>

                {/* Grid Skeleton */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="h-[320px] animate-pulse">
                            <CardContent className="p-0">
                                <div className="h-32 bg-muted" />
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-muted rounded w-3/4" />
                                    <div className="h-3 bg-muted rounded w-1/2" />
                                    <div className="h-16 bg-muted rounded" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function CoachingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isLoading, setIsLoading] = useState(true);
    const hasPrefetchedRef = useRef(false);
    const { searchCoachingCenters, centerSearchResults } = useCoachingStore();

    // Prefetch data while waiting for permissions (in parallel)
    useEffect(() => {
        if (hasPrefetchedRef.current || centerSearchResults) return;
        hasPrefetchedRef.current = true;

        // Start prefetching coaching centers in background with timeout
        console.log('🚀 CoachingLayout - Prefetching coaching centers...');
        searchCoachingCenters({}, 'recent', 1, 20, 10000).catch(() => {
            // Silently handle prefetch errors - the page will retry
            console.log('⚠️ CoachingLayout - Prefetch failed, will retry on page load');
        });
    }, [searchCoachingCenters, centerSearchResults]);

    return (
        <CoachingFilterPanelProvider>
            <PermissionGuard
                permissions={[{
                    ...LOCATION_PERMISSION,
                    required: false,
                    autoRequest: true,
                }]}
                strategy="all"
                autoRequest
                strictMode={false}
                showLoading={false}
                onAllGranted={() => setIsLoading(false)}
                onDenied={() => setIsLoading(false)}
            >
                {isLoading ? (
                    <CoachingPageSkeleton />
                ) : (
                    <ConditionalLayout
                        forceConfig={{
                            page: 'coaching',
                            headerType: 'universal',
                            title: 'Coaching',
                            sidebar: {
                                enabled: false,
                                defaultOpen: false,
                            },
                        }}
                    >
                        {children}
                    </ConditionalLayout>
                )}
            </PermissionGuard>
        </CoachingFilterPanelProvider>
    );
}
