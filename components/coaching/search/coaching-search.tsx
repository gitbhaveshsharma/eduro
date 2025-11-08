/**
 * Coaching Search Component for Universal Header
 * 
 * Integrated search bar that appears in the universal header on coaching pages
 * Similar to SettingsSearch but for coaching centers
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCoachingStore } from '@/lib/store/coaching.store';
import { useCoachingFilterPanel } from './coaching-filter-panel-context';
import type { CoachingCenterFilters } from '@/lib/schema/coaching.types';
import { cn } from '@/lib/utils';

interface CoachingSearchProps {
    placeholder?: string;
    className?: string;
    debounceDelay?: number;
}

/**
 * Coaching Search Component
 * Provides search input with debouncing and active filter display
 * Designed to be used in the Universal Header
 * Uses global context to control filter panel on the page
 */
export function CoachingSearch({
    placeholder = 'Search by name, subject, location...',
    className,
    debounceDelay = 500
}: CoachingSearchProps) {
    const {
        currentCenterFilters,
        currentCenterSortBy,
        updateCenterFilters,
        searchCoachingCenters
    } = useCoachingStore();

    // Use context to control filter panel
    const { isOpen: isFiltersPanelOpen, toggle: toggleFiltersPanel } = useCoachingFilterPanel();

    // Local state for input value (before debounce)
    const [searchValue, setSearchValue] = useState(currentCenterFilters.search_query || '');
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Sync with store when filters change externally
    useEffect(() => {
        setSearchValue(currentCenterFilters.search_query || '');
    }, [currentCenterFilters.search_query]);

    // Handle search input change with debouncing
    const handleSearchChange = useCallback((value: string) => {
        setSearchValue(value);

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer
        debounceTimerRef.current = setTimeout(() => {
            const newFilters: CoachingCenterFilters = {
                ...currentCenterFilters,
                search_query: value.trim() || undefined
            };
            updateCenterFilters(newFilters);
            searchCoachingCenters(newFilters, currentCenterSortBy, 1, 20);
        }, debounceDelay);
    }, [currentCenterFilters, currentCenterSortBy, debounceDelay, searchCoachingCenters, updateCenterFilters]);

    // Cleanup debounce timer
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // Count active filters (excluding search_query)
    const activeFilterCount = Object.entries(currentCenterFilters).filter(([key, value]) => {
        if (key === 'search_query') return false;
        if (value === null || value === undefined) return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
    }).length;

    return (
        <div className={cn('flex items-center gap-2 w-full', className)}>
            {/* Search Input */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    type="text"
                    placeholder={placeholder}
                    value={searchValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-10 h-10 bg-gray-50 border-gray-200 rounded-full focus:bg-white focus:ring-2 focus:ring-brand-primary/20 transition-all"
                />
                {searchValue && (
                    <button
                        onClick={() => handleSearchChange('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Filters Toggle Button */}
            <Button
                variant={isFiltersPanelOpen ? 'default' : 'outline'}
                size="sm"
                onClick={toggleFiltersPanel}
                className="h-10 px-3 gap-2 relative shrink-0 rounded-full"
                aria-label={isFiltersPanelOpen ? 'Close filters' : 'Open filters'}
            >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                    <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                    >
                        {activeFilterCount > 9 ? '9+' : activeFilterCount}
                    </Badge>
                )}
            </Button>
        </div>
    );
}
