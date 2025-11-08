'use client';

import { useEffect, useCallback, useState, useMemo } from 'react';
import { useCoachingStore } from '@/lib/store/coaching.store';
import { useCoachingFilterPanel } from '@/components/coaching/search/coaching-filter-panel-context';
import type {
    CoachingCenterFilters,
    CoachingCenterSortBy,
    PublicCoachingCenter
} from '@/lib/schema/coaching.types';
import { CoachingCenterGrid } from '@/components/coaching/public/coaching-center-card';
import { CoachingFiltersPanel } from '@/components/coaching/search/coaching-filters-panel';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

/**
 * Coaching Centers Search Page
 * 
 * Main page for searching and discovering coaching centers
 * Features:
 * - Integrated search in Universal Header (via CoachingSearch component with Filters button)
 * - Advanced filtering with CoachingFiltersPanel
 * - Infinite scroll support
 * - Result caching via Zustand store
 * - Responsive design
 */
export default function CoachingCentersPage() {
    // Store hooks
    const {
        searchCoachingCenters,
        centerSearchResults,
        centerSearchLoading,
        currentCenterFilters,
        currentCenterSortBy,
        updateCenterFilters,
        updateCenterSortBy
    } = useCoachingStore();

    // Filter panel context (controlled by Universal Header)
    const { isOpen: showFiltersPanel, close: closeFiltersPanel } = useCoachingFilterPanel();

    // Local UI state
    const [currentPage, setCurrentPage] = useState(1);

    // Constants
    const perPage = 20;

    // Get results from store
    const searchItems = centerSearchResults?.results || [];
    const totalCount = centerSearchResults?.total_count || 0;
    const hasMore = centerSearchResults?.has_more || false;

    // Convert CoachingCenterSearchItem to PublicCoachingCenter for the grid
    const results = useMemo((): PublicCoachingCenter[] => {
        return searchItems.map((item): PublicCoachingCenter => ({
            id: item.center_id,
            name: item.center_name,
            slug: item.center_slug,
            description: null, // Not included in search results
            established_year: null,
            logo_url: item.center_logo_url,
            cover_url: null,
            category: item.center_category,
            subjects: item.center_subjects,
            target_audience: null,
            phone: null,
            email: null,
            website: null,
            is_verified: item.center_is_verified,
            is_featured: false, // Not included in search results
            created_at: '',
            updated_at: '',
            // Additional data from search
            total_branches: 1,
            active_branches: 1
        }));
    }, [searchItems]);

    // Initial load - only once on mount
    useEffect(() => {
        // If we don't have cached results, do initial search
        if (!centerSearchResults) {
            searchCoachingCenters(currentCenterFilters, currentCenterSortBy, 1, perPage);
        }
    }, []); // Empty deps - run only on mount

    // Handle filter changes (debouncing is handled in CoachingSearchHeader)
    const handleFiltersChange = useCallback((newFilters: CoachingCenterFilters) => {
        updateCenterFilters(newFilters);
        setCurrentPage(1); // Reset to first page
        searchCoachingCenters(newFilters, currentCenterSortBy, 1, perPage);
    }, [currentCenterSortBy, perPage, searchCoachingCenters, updateCenterFilters]);

    // Handle sort change
    const handleSortChange = useCallback((newSortBy: CoachingCenterSortBy) => {
        updateCenterSortBy(newSortBy);
        setCurrentPage(1); // Reset to first page
        searchCoachingCenters(currentCenterFilters, newSortBy, 1, perPage);
    }, [currentCenterFilters, perPage, searchCoachingCenters, updateCenterSortBy]);

    // Handle load more
    const handleLoadMore = useCallback(() => {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        searchCoachingCenters(currentCenterFilters, currentCenterSortBy, nextPage, perPage);
    }, [currentPage, currentCenterFilters, currentCenterSortBy, perPage, searchCoachingCenters]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/10">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
                {/* Header Section */}
                <div className="space-y-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Coaching Centers</h1>
                        <p className="text-muted-foreground mt-2">
                            Discover and compare coaching centers with our advanced search
                        </p>
                    </div>
                </div>

                {/* Results Count */}
                {!centerSearchLoading && centerSearchResults && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            {totalCount === 0 ? (
                                'No coaching centers found'
                            ) : (
                                <>
                                    Found <span className="font-semibold text-foreground">{totalCount}</span>{' '}
                                    coaching {totalCount === 1 ? 'center' : 'centers'}
                                </>
                            )}
                        </p>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Filters Panel - Desktop: Sidebar, Mobile: Collapsible */}
                    {showFiltersPanel && (
                        <aside className="lg:col-span-3">
                            <div className="sticky top-20">
                                <CoachingFiltersPanel
                                    filters={currentCenterFilters}
                                    onFiltersChange={handleFiltersChange}
                                    onClose={closeFiltersPanel}
                                    className="lg:max-h-[calc(100vh-8rem)]"
                                />
                            </div>
                        </aside>
                    )}

                    {/* Results Grid */}
                    <main className={showFiltersPanel ? 'lg:col-span-9' : 'lg:col-span-12'}>
                        <CoachingCenterGrid
                            centers={results}
                            searchItems={searchItems}
                            loading={centerSearchLoading && results.length === 0}
                            emptyMessage="No coaching centers match your filters. Try adjusting your search criteria."
                        />

                        {/* Load More Button */}
                        {hasMore && !centerSearchLoading && (
                            <div className="flex justify-center pt-8">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={handleLoadMore}
                                    disabled={centerSearchLoading}
                                    className="min-w-[200px]"
                                >
                                    {centerSearchLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        'Load More'
                                    )}
                                </Button>
                            </div>
                        )}

                        {/* Loading Indicator for Load More */}
                        {centerSearchLoading && results.length > 0 && (
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
                                <span className="ml-2 text-sm text-muted-foreground">Loading more results...</span>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
