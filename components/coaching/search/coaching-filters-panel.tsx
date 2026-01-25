"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { MapPin, Star, Calendar, X, Search, SlidersHorizontal } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
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
    const [isMobileDevice, setIsMobileDevice] = useState(false);

    // Detect mobile viewport
    useEffect(() => {
        const updateIsMobile = () => {
            if (typeof window === 'undefined') return;
            // Mobile breakpoint at 768px
            setIsMobileDevice(window.innerWidth < 768);
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
    }, [filters, onFiltersChange]);

    const handleSubjectAdd = useCallback(() => {
        if (!subjectInput.trim()) return;

        const currentSubjects = filters.subjects || [];
        if (!currentSubjects.includes(subjectInput.trim())) {
            onFiltersChange({
                ...filters,
                subjects: [...currentSubjects, subjectInput.trim()]
            });
        }
        setSubjectInput('');
    }, [filters, subjectInput, onFiltersChange]);

    const handleSubjectRemove = useCallback((subject: string) => {
        const currentSubjects = filters.subjects || [];
        onFiltersChange({
            ...filters,
            subjects: currentSubjects.filter(s => s !== subject)
        });
    }, [filters, onFiltersChange]);

    const handleClearAll = useCallback(() => {
        setLocationInput({ city: '', state: '', district: '' });
        setSubjectInput('');
        onFiltersChange({});
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

    // Mobile sheet content
    const renderMobileContent = () => (
        <div className="flex flex-col h-full">
            <SheetHeader className="text-left pb-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-primary" />
                    Filters
                    {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="px-2 py-1 text-xs font-semibold">
                            {activeFiltersCount}
                        </Badge>
                    )}
                </SheetTitle>
                <SheetDescription>
                    Refine your coaching center search with filters below
                </SheetDescription>
            </SheetHeader>

            {/* Scrollable Filter Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6">
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

                <Separator />

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

                <Separator />

                {/* Time Filter */}
                <div className="space-y-4">
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

                <Separator />

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
            </div>

            {/* Fixed Footer with Actions */}
            <SheetFooter className="border-t pt-4 flex-shrink-0">
                <div className="flex gap-2 w-full">
                    <Button
                        variant="outline"
                        onClick={handleClearAll}
                        className="flex-1"
                        disabled={activeFiltersCount === 0}
                    >
                        Clear All
                    </Button>
                    <Button
                        onClick={onClose}
                        className="flex-1"
                    >
                        Apply Filters
                    </Button>
                </div>
            </SheetFooter>
        </div>
    );

    // Desktop content remains the same
    const renderDesktopContent = () => (
        <>
            <SheetHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-5 w-5 text-primary" />
                        <SheetTitle className="text-xl font-bold">Filters</SheetTitle>
                        {activeFiltersCount > 0 && (
                            <Badge variant="secondary" className="px-2 py-1 text-xs font-semibold">
                                {activeFiltersCount}
                            </Badge>
                        )}
                    </div>
                </div>
            </SheetHeader>

            <ScrollArea className="h-full pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-4">
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

                    {/* Vertical separator for desktop */}
                    <Separator className="hidden md:block md:h-auto md:w-px bg-border/50" orientation="vertical" />
                    {/* Horizontal separator for mobile */}
                    <Separator className="md:hidden bg-border/50" />

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

                        {/* Time Filter - moved into Rating column on desktop */}
                        <div className="space-y-4 pt-4 border-t md:border-t-0">
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
                    </div>

                    {/* Vertical separator for desktop */}
                    <Separator className="hidden lg:block lg:h-auto lg:w-px bg-border/50" orientation="vertical" />
                    {/* Horizontal separator for mobile/tablet */}
                    <Separator className="lg:hidden bg-border/50" />

                    {/* Subjects Filter */}
                    <div className="space-y-4 md:col-span-2 lg:col-span-1">
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
                </div>
            </ScrollArea>

            {/* Footer with Clear All and Close Buttons */}
            <SheetFooter className="border-t pt-4 flex-row gap-2">
                <Button
                    variant="outline"
                    onClick={handleClearAll}
                    className="flex-1"
                    disabled={activeFiltersCount === 0}
                >
                    Clear All
                </Button>
                <Button
                    onClick={onClose}
                    className="flex-1"
                >
                    Apply Filters
                </Button>
            </SheetFooter>
        </>
    );

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
            <SheetContent
                side={isMobileDevice ? "bottom" : "top"}
                className={cn(
                    // Mobile: bottom sheet with 60vh height (adjustable with rounded corners)
                    "data-[side=bottom]:h-[60vh] data-[side=bottom]:max-h-[60vh] data-[side=bottom]:rounded-t-2xl",
                    // Desktop/Tablet: top sheet with max height
                    "data-[side=top]:max-h-[70vh]",
                    "flex flex-col p-4 md:p-6",
                    className
                )}
            >
                {isMobileDevice ? renderMobileContent() : renderDesktopContent()}
            </SheetContent>
        </Sheet>
    );
}