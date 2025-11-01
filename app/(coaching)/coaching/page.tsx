'use client';

import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import {
    useCoachingStore,
    CoachingFilterUtils,
    type CoachingCenterFilters,
    type PublicCoachingCenter,
    CoachingDisplayUtils
} from '@/lib/coaching';
import { CoachingCenterGrid } from '@/components/coaching/public/coaching-center-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function CoachingCentersPage() {
    const { searchCoachingCenters, centerSearchResults, centerSearchLoading } = useCoachingStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [featuredOnly, setFeaturedOnly] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Stable refs to prevent recreating debounce timers
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const centers = centerSearchResults?.centers || [];
    const perPage = centerSearchResults?.per_page || 12;

    const hasActiveFilters = useMemo(
        () => !!searchQuery || selectedCategories.length > 0 || verifiedOnly || featuredOnly,
        [searchQuery, selectedCategories.length, verifiedOnly, featuredOnly]
    );

    const categoryGroups = useMemo(
        () => CoachingFilterUtils.getCategoriesByGroup(),
        []
    );

    const buildFilters = useCallback((): CoachingCenterFilters => {
        const filters: CoachingCenterFilters = {};
        if (searchQuery.trim()) filters.search_query = searchQuery.trim();
        if (selectedCategories.length > 0) filters.category = selectedCategories as any;
        if (verifiedOnly) filters.is_verified = true;
        if (featuredOnly) filters.is_featured = true;
        return filters;
    }, [searchQuery, selectedCategories, verifiedOnly, featuredOnly]);

    const triggerSearch = useCallback(async () => {
        const filters = buildFilters();
        await searchCoachingCenters(filters, { field: 'is_featured', direction: 'desc' }, 1, perPage);
    }, [buildFilters, searchCoachingCenters, perPage]);

    // Initial load
    useEffect(() => {
        triggerSearch();
    }, [triggerSearch]);

    // Debounced search when any filter changes
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            triggerSearch();
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchQuery, selectedCategories, verifiedOnly, featuredOnly, triggerSearch]);

    const handleCategoryToggle = useCallback((category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
        );
    }, []);

    const clearFilters = useCallback(() => {
        setSearchQuery('');
        setSelectedCategories([]);
        setVerifiedOnly(false);
        setFeaturedOnly(false);
    }, []);

    const loadMore = useCallback(() => {
        const nextPage = Math.floor(centers.length / perPage) + 1;
        const filters = buildFilters();
        searchCoachingCenters(filters, { field: 'is_featured', direction: 'desc' }, nextPage, perPage);
    }, [centers.length, perPage, buildFilters, searchCoachingCenters]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="space-y-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Coaching Centers</h1>
                        <p className="text-muted-foreground mt-2">
                            Discover and compare coaching centers near you
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search coaching centers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            variant={showFilters ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setShowFilters((v) => !v)}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Active Filters */}
                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-muted-foreground">Active filters:</span>

                            {selectedCategories.map((category) => (
                                <Badge key={category} variant="secondary" className="gap-1">
                                    {CoachingDisplayUtils.getCategoryDisplayName(category as any)}
                                    <button
                                        onClick={() => handleCategoryToggle(category)}
                                        className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}

                            {verifiedOnly && (
                                <Badge variant="secondary" className="gap-1">
                                    Verified Only
                                    <button
                                        onClick={() => setVerifiedOnly(false)}
                                        className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}

                            {featuredOnly && (
                                <Badge variant="secondary" className="gap-1">
                                    Featured Only
                                    <button
                                        onClick={() => setFeaturedOnly(false)}
                                        className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}

                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                Clear all
                            </Button>
                        </div>
                    )}
                </div>

                {/* Filters Panel (Inline; swap to Drawer pattern if needed) */}
                {showFilters && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Quick Filters */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Quick Filters</Label>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="verified"
                                            checked={verifiedOnly}
                                            onCheckedChange={(checked) => setVerifiedOnly(!!checked)}
                                        />
                                        <Label htmlFor="verified" className="cursor-pointer">
                                            Verified coaching centers only
                                        </Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="featured"
                                            checked={featuredOnly}
                                            onCheckedChange={(checked) => setFeaturedOnly(!!checked)}
                                        />
                                        <Label htmlFor="featured" className="cursor-pointer">
                                            Featured coaching centers only
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            {/* Category Filters */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Categories</Label>
                                <div className="space-y-4">
                                    {Object.entries(categoryGroups).map(([groupName, categories]) => (
                                        <div key={groupName} className="space-y-2">
                                            <h4 className="text-sm font-medium text-muted-foreground">
                                                {groupName.replace(/_/g, ' ')}
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {categories.map((categoryMeta) => (
                                                    <Badge
                                                        key={categoryMeta.category}
                                                        variant={selectedCategories.includes(categoryMeta.category) ? 'default' : 'outline'}
                                                        className="cursor-pointer"
                                                        onClick={() => handleCategoryToggle(categoryMeta.category)}
                                                    >
                                                        {categoryMeta.icon} {categoryMeta.label}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Results Count */}
                {!centerSearchLoading && centerSearchResults && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Found {centerSearchResults.total_count} coaching {centerSearchResults.total_count === 1 ? 'center' : 'centers'}
                        </p>
                    </div>
                )}

                {/* Results Grid (swap to virtualized grid if list gets very large) */}
                <CoachingCenterGrid
                    centers={centers}
                    loading={centerSearchLoading}
                    emptyMessage={
                        hasActiveFilters
                            ? 'No coaching centers match your filters. Try adjusting your search criteria.'
                            : 'No coaching centers available at the moment.'
                    }
                />

                {/* Load More */}
                {centerSearchResults?.has_more && (
                    <div className="flex justify-center pt-4">
                        <Button variant="outline" onClick={loadMore}>
                            Load More
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
