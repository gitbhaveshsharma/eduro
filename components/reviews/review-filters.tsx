/**
 * Review Filters Component
 * 
 * Filter and sort controls for reviews
 * Responsive design with collapsible mobile view
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Search, SlidersHorizontal, X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReviewSearchFilters } from '@/lib/validations/review.validation';
import type { ReviewSortBy } from '@/lib/schema/review.types';

interface ReviewFiltersProps {
    onFiltersChange: (filters: ReviewSearchFilters) => void;
    className?: string;
}

export function ReviewFilters({ onFiltersChange, className }: ReviewFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [filters, setFilters] = useState<ReviewSearchFilters>({
        search_query: undefined,
        min_rating: undefined,
        has_media: undefined,
        is_verified: undefined,
        days_ago: undefined,
        sort_by: 'recent',
    });

    const activeFilterCount = Object.values(filters).filter(v =>
        v !== undefined && v !== 'recent'
    ).length;

    const updateFilter = <K extends keyof ReviewSearchFilters>(
        key: K,
        value: ReviewSearchFilters[K]
    ) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const clearFilters = () => {
        const clearedFilters: ReviewSearchFilters = {
            search_query: undefined,
            min_rating: undefined,
            has_media: undefined,
            is_verified: undefined,
            days_ago: undefined,
            sort_by: 'recent',
        };
        setFilters(clearedFilters);
        onFiltersChange(clearedFilters);
    };

    return (
        <Card className={className}>
            <CardContent className="p-4 space-y-4">
                {/* Search and Quick Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search reviews..."
                            value={filters.search_query || ''}
                            onChange={(e) => updateFilter('search_query', e.target.value || undefined)}
                            className="pl-9"
                        />
                    </div>

                    {/* Sort */}
                    <Select
                        value={filters.sort_by || 'recent'}
                        onValueChange={(value) => updateFilter('sort_by', value as ReviewSortBy)}
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="recent">Most Recent</SelectItem>
                            <SelectItem value="helpful">Most Helpful</SelectItem>
                            <SelectItem value="highest_rated">Highest Rated</SelectItem>
                            <SelectItem value="lowest_rated">Lowest Rated</SelectItem>
                            <SelectItem value="relevant">Most Relevant</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Toggle Advanced Filters */}
                    <Button
                        variant="outline"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="gap-2"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        <span className="hidden sm:inline">Filters</span>
                        {activeFilterCount > 0 && (
                            <Badge variant="secondary" className="ml-1">
                                {activeFilterCount}
                            </Badge>
                        )}
                    </Button>

                    {activeFilterCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="gap-1"
                        >
                            <X className="h-4 w-4" />
                            Clear
                        </Button>
                    )}
                </div>

                {/* Advanced Filters - Collapsible */}
                {isExpanded && (
                    <div className="border-t pt-4 space-y-4 animate-in slide-in-from-top-2">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Minimum Rating */}
                            <div className="space-y-2">
                                <Label>Minimum Rating</Label>
                                <Select
                                    value={filters.min_rating?.toString() || 'all'}
                                    onValueChange={(value) =>
                                        updateFilter('min_rating', value === 'all' ? undefined : parseInt(value))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Ratings</SelectItem>
                                        <SelectItem value="5">
                                            <div className="flex items-center gap-2">
                                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                                <span>5 Stars</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="4">
                                            <div className="flex items-center gap-2">
                                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                                <span>4+ Stars</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="3">
                                            <div className="flex items-center gap-2">
                                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                                <span>3+ Stars</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="2">
                                            <div className="flex items-center gap-2">
                                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                                <span>2+ Stars</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Time Period */}
                            <div className="space-y-2">
                                <Label>Time Period</Label>
                                <Select
                                    value={filters.days_ago?.toString() || 'all'}
                                    onValueChange={(value) =>
                                        updateFilter('days_ago', value === 'all' ? undefined : parseInt(value))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Time</SelectItem>
                                        <SelectItem value="7">Last 7 Days</SelectItem>
                                        <SelectItem value="30">Last 30 Days</SelectItem>
                                        <SelectItem value="90">Last 3 Months</SelectItem>
                                        <SelectItem value="365">Last Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Toggle Filters */}
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={filters.is_verified || false}
                                    onCheckedChange={(checked) =>
                                        updateFilter('is_verified', checked || undefined)
                                    }
                                />
                                <Label className="cursor-pointer">Verified Reviews Only</Label>
                            </div>

                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={filters.has_media || false}
                                    onCheckedChange={(checked) =>
                                        updateFilter('has_media', checked || undefined)
                                    }
                                />
                                <Label className="cursor-pointer">With Photos/Videos</Label>
                            </div>
                        </div>

                        {/* Active Filters Summary */}
                        {activeFilterCount > 0 && (
                            <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
                                <span className="text-sm font-medium text-muted-foreground">Active:</span>
                                {filters.min_rating && (
                                    <Badge variant="secondary">
                                        {filters.min_rating}+ Stars
                                    </Badge>
                                )}
                                {filters.days_ago && (
                                    <Badge variant="secondary">
                                        Last {filters.days_ago} Days
                                    </Badge>
                                )}
                                {filters.is_verified && (
                                    <Badge variant="secondary">Verified</Badge>
                                )}
                                {filters.has_media && (
                                    <Badge variant="secondary">With Media</Badge>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
