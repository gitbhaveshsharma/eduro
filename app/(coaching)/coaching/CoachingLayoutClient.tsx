"use client"

import { useState, useEffect, useRef } from "react";
import { ConditionalLayout } from "@/components/layout/conditional-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CoachingFilterPanelProvider } from "@/components/coaching/search/coaching-filter-panel-context";
import { PermissionGuard } from "@/components/permissions";
import { LOCATION_PERMISSION } from "@/lib/permissions";
import { useCoachingStore } from "@/lib/store/coaching.store";

// Loading spinner component for initial page load
function CoachingPageLoader() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
            <LoadingSpinner size="lg" title="Loading Coaching centers..." message="Discover coaching centers near you" />
        </div>
    );
}

export default function CoachingLayoutClient({ children }: { children: React.ReactNode }) {
    const [isDataLoading, setIsDataLoading] = useState(true);
    const hasPrefetchedRef = useRef(false);
    const { searchCoachingCenters, centerSearchResults } = useCoachingStore();

    // Prefetch data immediately on mount
    useEffect(() => {
        if (hasPrefetchedRef.current) return;
        hasPrefetchedRef.current = true;

        // Start prefetching coaching centers in background
        console.log('🚀 CoachingLayout - Prefetching coaching centers...');

        // If we already have data, don't show loading
        if (centerSearchResults) {
            setIsDataLoading(false);
            return;
        }

        searchCoachingCenters({}, 'recent', 1, 20, 10000)
            .then(() => {
                console.log('✅ CoachingLayout - Data loaded successfully');
                setIsDataLoading(false);
            })
            .catch(() => {
                console.log('⚠️ CoachingLayout - Prefetch failed');
                setIsDataLoading(false);
            });
    }, [searchCoachingCenters, centerSearchResults]);

    return (
        <CoachingFilterPanelProvider>
            {/* PermissionGuard shows notification but doesn't block page load */}
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
            >
                {isDataLoading ? (
                    <CoachingPageLoader />
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
