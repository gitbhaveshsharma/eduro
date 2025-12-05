/**
 * Teacher Filters Component
 * 
 * Advanced filtering controls for the teachers list
 * Features: Search, status filters, experience filters, subject filters
 */

'use client';

import { useState, useEffect } from 'react';
import { useBranchTeacherStore } from '@/lib/branch-system/stores/branch-teacher.store';
import type { BranchTeacherFilters, DayOfWeek } from '@/lib/branch-system/types/branch-teacher.types';
import { DAYS_OF_WEEK_OPTIONS } from '@/lib/branch-system/types/branch-teacher.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter, RefreshCw } from 'lucide-react';

/**
 * Props for Teacher Filters Component
 */
interface TeacherFiltersProps {
    /** When provided, filters for a single branch (branch manager view) */
    branchId?: string;
    /** When provided, filters across all branches (coach/owner view) */
    coachingCenterId?: string;
}

/**
 * Main Teacher Filters Component - Same style as StudentFilters
 */
export function TeacherFilters({ branchId, coachingCenterId }: TeacherFiltersProps = {}) {
    const { filters, setFilters, fetchCoachingCenterTeachers, fetchBranchTeachers } = useBranchTeacherStore();

    // Local state for immediate UI updates
    const [searchQuery, setSearchQuery] = useState(filters?.search_query || '');
    const [selectedIsActive, setSelectedIsActive] = useState<'all' | 'active' | 'inactive'>('all');
    const [selectedAvailableDay, setSelectedAvailableDay] = useState<DayOfWeek | 'all'>('all');
    const [experienceMin, setExperienceMin] = useState<string>('');
    const [experienceMax, setExperienceMax] = useState<string>('');

    // Apply filters to the store and trigger search
    const applyFilters = () => {
        const newFilters: BranchTeacherFilters = {};

        if (searchQuery.trim()) {
            newFilters.search_query = searchQuery.trim();
        }

        if (selectedIsActive !== 'all') {
            newFilters.is_active = selectedIsActive === 'active';
        }

        if (selectedAvailableDay !== 'all') {
            newFilters.available_day = selectedAvailableDay;
        }

        if (experienceMin) {
            newFilters.experience_min = Number(experienceMin);
        }

        if (experienceMax) {
            newFilters.experience_max = Number(experienceMax);
        }

        setFilters(Object.keys(newFilters).length > 0 ? newFilters : null);

        // Re-fetch teachers with new filters based on view type
        if (branchId) {
            fetchBranchTeachers(branchId, newFilters);
        } else if (coachingCenterId) {
            fetchCoachingCenterTeachers(coachingCenterId, newFilters);
        }
    };

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            applyFilters();
        }, 300);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setSelectedIsActive('all');
        setSelectedAvailableDay('all');
        setExperienceMin('');
        setExperienceMax('');
        setFilters(null);

        // Re-fetch all teachers without filters
        if (branchId) {
            fetchBranchTeachers(branchId);
        } else if (coachingCenterId) {
            fetchCoachingCenterTeachers(coachingCenterId);
        }
    };

    // Check if any filters are active
    const hasActiveFilters =
        searchQuery !== '' ||
        selectedIsActive !== 'all' ||
        selectedAvailableDay !== 'all' ||
        experienceMin !== '' ||
        experienceMax !== '';

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search teachers by name, email, or subject..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => setSearchQuery('')}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {hasActiveFilters && (
                    <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Clear Filters
                    </Button>
                )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3">
                {/* Status Filter */}
                <Select
                    value={selectedIsActive}
                    onValueChange={(value: 'all' | 'active' | 'inactive') => {
                        setSelectedIsActive(value);
                        setTimeout(applyFilters, 100);
                    }}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>

                {/* Available Day Filter */}
                <Select
                    value={selectedAvailableDay}
                    onValueChange={(value: DayOfWeek | 'all') => {
                        setSelectedAvailableDay(value);
                        setTimeout(applyFilters, 100);
                    }}
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Available Day" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Any Day</SelectItem>
                        {Object.entries(DAYS_OF_WEEK_OPTIONS).map(([day, config]) => (
                            <SelectItem key={day} value={day}>
                                {config.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Experience Range */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Experience:</span>
                    <Input
                        type="number"
                        placeholder="Min"
                        value={experienceMin}
                        onChange={(e) => {
                            setExperienceMin(e.target.value);
                        }}
                        onBlur={applyFilters}
                        className="w-[70px]"
                        min={0}
                        max={60}
                    />
                    <span className="text-sm text-muted-foreground">-</span>
                    <Input
                        type="number"
                        placeholder="Max"
                        value={experienceMax}
                        onChange={(e) => {
                            setExperienceMax(e.target.value);
                        }}
                        onBlur={applyFilters}
                        className="w-[70px]"
                        min={0}
                        max={60}
                    />
                    <span className="text-sm text-muted-foreground">years</span>
                </div>

                {/* Apply Button */}
                <Button
                    variant="secondary"
                    onClick={applyFilters}
                    className="gap-2"
                >
                    <Filter className="h-4 w-4" />
                    Apply
                </Button>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {searchQuery && (
                        <Badge variant="secondary" className="gap-1">
                            Search: {searchQuery}
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setTimeout(applyFilters, 100);
                                }}
                                className="hover:text-destructive"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {selectedIsActive !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                            Status: {selectedIsActive}
                            <button
                                onClick={() => {
                                    setSelectedIsActive('all');
                                    setTimeout(applyFilters, 100);
                                }}
                                className="hover:text-destructive"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {selectedAvailableDay !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                            Day: {DAYS_OF_WEEK_OPTIONS[selectedAvailableDay]?.label || selectedAvailableDay}
                            <button
                                onClick={() => {
                                    setSelectedAvailableDay('all');
                                    setTimeout(applyFilters, 100);
                                }}
                                className="hover:text-destructive"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {(experienceMin || experienceMax) && (
                        <Badge variant="secondary" className="gap-1">
                            Experience: {experienceMin || '0'} - {experienceMax || '∞'} years
                            <button
                                onClick={() => {
                                    setExperienceMin('');
                                    setExperienceMax('');
                                    setTimeout(applyFilters, 100);
                                }}
                                className="hover:text-destructive"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}
