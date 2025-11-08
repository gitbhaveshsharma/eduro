"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { MapPin, Star, Calendar, X, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { CoachingFilterUtils } from '@/lib/utils/coaching.utils';
import type { CoachingCenterFilters } from '@/lib/schema/coaching.types';

interface CoachingFiltersPanelProps {
    filters: CoachingCenterFilters;
    onFiltersChange: (filters: CoachingCenterFilters) => void;
    onClose?: () => void;
    className?: string;
    /** Whether the panel is open (for mobile) */
    isOpen?: boolean;
}

export function CoachingFiltersPanel({
    filters,
    onFiltersChange,
    onClose,
    className,
    isOpen = true
}: CoachingFiltersPanelProps) {
    const [locationInput, setLocationInput] = useState({
        city: filters.city || '',
        state: filters.state || '',
        district: filters.district || ''
    });

    const [subjectInput, setSubjectInput] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);
    const [isMobileDevice, setIsMobileDevice] = useState(false);

    // Animation handling
    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Detect mobile viewport so we only auto-close the panel on mobile/tablet
    useEffect(() => {
        const updateIsMobile = () => {
            if (typeof window === 'undefined') return;
            // Tailwind 'lg' breakpoint is 1024px. Treat widths below that as mobile/tablet.
            setIsMobileDevice(window.innerWidth < 1024);
        };

        updateIsMobile();
        window.addEventListener('resize', updateIsMobile);
        return () => window.removeEventListener('resize', updateIsMobile);
    }, []);

    // Filter handlers
    const handleLocationUpdate = useCallback(() => {
        const newFilters = { ...filters };

        if (locationInput.city?.trim()) {
            newFilters.city = locationInput.city.trim();
        } else {
            delete newFilters.city;
        }

        if (locationInput.state?.trim()) {
            newFilters.state = locationInput.state.trim();
        } else {
            delete newFilters.state;
        }

        if (locationInput.district?.trim()) {
            newFilters.district = locationInput.district.trim();
        } else {
            delete newFilters.district;
        }

        onFiltersChange(newFilters);
        // Close panel on mobile after applying filters to avoid user confusion
        if (onClose && isMobileDevice) onClose();
    }, [filters, locationInput, onFiltersChange]);

    const handleNearMe = useCallback(() => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                onFiltersChange({
                    ...filters,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    radius_meters: 10000
                });
                if (onClose && isMobileDevice) onClose();
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Unable to get your location. Please check your permissions.');
            }
        );
    }, [filters, onFiltersChange]);

    const handleRatingChange = useCallback((value: number[]) => {
        onFiltersChange({
            ...filters,
            min_rating: value[0],
            max_rating: value[1]
        });
        if (onClose && isMobileDevice) onClose();
    }, [filters, onFiltersChange]);

    const handleDaysAgoChange = useCallback((value: string) => {
        const days = parseInt(value);
        const newFilters = { ...filters };

        if (!isNaN(days) && days > 0) {
            newFilters.days_ago = days;
        } else {
            delete newFilters.days_ago;
        }

        onFiltersChange(newFilters);
        if (onClose && isMobileDevice) onClose();
    }, [filters, onFiltersChange]);

    const handleSubjectAdd = useCallback(() => {
        if (!subjectInput.trim()) return;

        const currentSubjects = filters.subjects || [];
        if (!currentSubjects.includes(subjectInput.trim())) {
            onFiltersChange({
                ...filters,
                subjects: [...currentSubjects, subjectInput.trim()]
            });
            if (onClose && isMobileDevice) onClose();
        }
        setSubjectInput('');
    }, [filters, subjectInput, onFiltersChange]);

    const handleSubjectRemove = useCallback((subject: string) => {
        const currentSubjects = filters.subjects || [];
        onFiltersChange({
            ...filters,
            subjects: currentSubjects.filter(s => s !== subject)
        });
        if (onClose && isMobileDevice) onClose();
    }, [filters, onFiltersChange]);

    const handleClearAll = useCallback(() => {
        setLocationInput({ city: '', state: '', district: '' });
        setSubjectInput('');
        onFiltersChange({});
        if (onClose && isMobileDevice) onClose();
    }, [onFiltersChange]);

    // Active filters count for badge
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.city || filters.state || filters.district || (filters.latitude && filters.longitude)) count++;
        if (filters.min_rating && filters.min_rating > 1) count++;
        if (filters.max_rating && filters.max_rating < 5) count++;
        if (filters.days_ago) count++;
        if (filters.subjects && filters.subjects.length > 0) count++;
        return count;
    }, [filters]);

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className={cn(
                        // overlay should sit above the bottom nav but below the panel
                        "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300",
                        isAnimating ? "opacity-0" : "opacity-100"
                    )}
                    onClick={onClose}
                />
            )}

            {/* Filters Panel */}
            <Card className={cn(
                "border-2 ",
                // Mobile: Fixed, full height, slides from left
                // Make panel full-width on mobile (w-full) and constrain on lg screens (lg:max-w-sm).
                "fixed lg:sticky top-0 left-0 z-60 h-screen lg:h-[85vh] w-full lg:max-w-sm",
                // Smooth animations for mobile
                "transform transition-transform duration-300 ease-in-out lg:transform-none",
                "shadow-xl lg:shadow-md",
                // Mobile slide animation - from left instead of right
                isOpen
                    ? "translate-x-0"
                    : "-translate-x-full lg:translate-x-0",
                className
            )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sticky top-0 z-10 border-b ">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-primary" />
                            <CardTitle className="text-xl font-bold">Filters</CardTitle>
                        </div>
                        {activeFiltersCount > 0 && (
                            <Badge variant="secondary" className="px-2 py-1 text-xs font-semibold">
                                {activeFiltersCount}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearAll}
                            className="h-9 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Clear all
                        </Button>
                        {onClose && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="h-9 w-9 p-0 lg:hidden hover:bg-muted transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                </CardHeader>

                {/*
                    Adjust scroll area so content isn't hidden behind fixed bottom navigation on mobile.
                    - Subtract an estimated bottom nav height (56px) from the viewport calculation
                    - Add extra padding at the bottom of the content to ensure last elements are visible
                    - Include safe-area inset space for devices with notches
                */}
                <ScrollArea
                    className="h-[calc(100vh-5rem-56px)] lg:h-[calc(85vh-5rem)] overflow-auto"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                >
                    <CardContent className="space-y-6 p-4 pb-28 lg:pb-6">
                        {/* Location Filter */}
                        <div className="space-y-4">
                            <Label className="text-base font-semibold flex items-center gap-2 text-foreground">
                                <MapPin className="h-5 w-5 text-blue-600" />
                                Location
                            </Label>

                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="City"
                                        value={locationInput.city}
                                        onChange={(e) => setLocationInput(prev => ({ ...prev, city: e.target.value }))}
                                        onBlur={handleLocationUpdate}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLocationUpdate()}
                                        className="pl-9"
                                    />
                                </div>
                                <Input
                                    placeholder="District"
                                    value={locationInput.district}
                                    onChange={(e) => setLocationInput(prev => ({ ...prev, district: e.target.value }))}
                                    onBlur={handleLocationUpdate}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLocationUpdate()}
                                />
                                <Input
                                    placeholder="State"
                                    value={locationInput.state}
                                    onChange={(e) => setLocationInput(prev => ({ ...prev, state: e.target.value }))}
                                    onBlur={handleLocationUpdate}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLocationUpdate()}
                                />

                                <Button
                                    variant="default"
                                    onClick={handleNearMe}
                                    className="w-full border-blue-200 hover:bg-blue-50 transition-colors"
                                >
                                    <MapPin className="h-4 w-4 mr-2" />
                                    Search near me
                                </Button>

                                {filters.latitude && filters.longitude && (
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
                                        <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                        <p className="text-xs text-blue-700">
                                            Using your location (within {((filters.radius_meters || 10000) / 1000).toFixed(1)}km)
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator className="bg-border/50" />

                        {/* Rating Filter */}
                        <div className="space-y-4">
                            <Label className="text-base font-semibold flex items-center gap-2 text-foreground">
                                <Star className="h-5 w-5 text-yellow-500 fill-current" />
                                Rating Range
                            </Label>

                            <div className="space-y-4 p-2">
                                <Slider
                                    min={1}
                                    max={5}
                                    step={1}
                                    value={[filters.min_rating || 1, filters.max_rating || 5]}
                                    onValueChange={handleRatingChange}
                                    className="w-full"
                                />

                                <div className="flex items-center justify-between text-sm font-medium">
                                    <span className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200 transition-colors">
                                        {filters.min_rating || 1} <Star className="h-3 w-3 fill-yellow-500" />
                                    </span>
                                    <span className="text-muted-foreground mx-2">to</span>
                                    <span className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200 transition-colors">
                                        {filters.max_rating || 5} <Star className="h-3 w-3 fill-yellow-500" />
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Time Filter - Hidden on mobile */}
                        <div className="hidden lg:block space-y-4">
                            <Separator className="bg-border/50" />
                            <Label className="text-base font-semibold flex items-center gap-2 text-foreground">
                                <Calendar className="h-5 w-5 text-purple-600" />
                                Recently Added
                            </Label>

                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Input
                                        type="number"
                                        placeholder="7"
                                        value={filters.days_ago || ''}
                                        onChange={(e) => handleDaysAgoChange(e.target.value)}
                                        min="1"
                                        max="365"
                                        className="pr-16"
                                    />
                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                                        days
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-border/50" />

                        {/* Subjects Filter */}
                        <div className="space-y-4">
                            <Label className="text-base font-semibold text-foreground">Subjects</Label>

                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add subject (e.g., Mathematics)"
                                        value={subjectInput}
                                        onChange={(e) => setSubjectInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSubjectAdd();
                                            }
                                        }}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleSubjectAdd}
                                        disabled={!subjectInput.trim()}
                                        className="shrink-0 transition-all hover:scale-105 active:scale-95"
                                    >
                                        Add
                                    </Button>
                                </div>

                                {filters.subjects && filters.subjects.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {filters.subjects.map((subject) => (
                                            <Badge
                                                key={subject}
                                                variant="secondary"
                                                className="gap-2 px-3 py-1.5 text-sm transition-all hover:shadow-md group hover:bg-muted"
                                            >
                                                {subject}
                                                <button
                                                    type="button"
                                                    onClick={() => handleSubjectRemove(subject)}
                                                    className="hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors group-hover:scale-110"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </ScrollArea>
            </Card>
        </>
    );
}