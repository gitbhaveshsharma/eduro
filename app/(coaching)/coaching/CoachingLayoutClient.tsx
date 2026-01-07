"use client"

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
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

/**
 * Check if the current path is a detail page (coaching center or branch)
 * These pages load their own data and don't need search results
 */
function isDetailPage(pathname: string | null): boolean {
    if (!pathname) return false;
    // Match /coaching/[slug] or /coaching/[slug]/branch/[branchId]
    // But NOT /coaching (the search page)
    const pathParts = pathname.split('/').filter(Boolean);
    // pathParts for /coaching = ['coaching']
    // pathParts for /coaching/thebluebe = ['coaching', 'thebluebe']
    // pathParts for /coaching/thebluebe/branch/xyz = ['coaching', 'thebluebe', 'branch', 'xyz']
    return pathParts.length >= 2 && pathParts[0] === 'coaching';
}

export default function CoachingLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isDataLoading, setIsDataLoading] = useState(true);
    const hasPrefetchedRef = useRef(false);
    const { searchCoachingCenters, centerSearchResults } = useCoachingStore();

    // Determine if we're on a detail page (coaching center or branch profile)
    const isOnDetailPage = isDetailPage(pathname);

    // Prefetch data immediately on mount - ONLY for the search page
    useEffect(() => {
        // Skip prefetch for detail pages - they load their own specific data
        if (isOnDetailPage) {
            console.log('🔷 CoachingLayout - Skipping prefetch on detail page:', pathname);
            setIsDataLoading(false);
            return;
        }

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
    }, [searchCoachingCenters, centerSearchResults, isOnDetailPage, pathname]);

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
