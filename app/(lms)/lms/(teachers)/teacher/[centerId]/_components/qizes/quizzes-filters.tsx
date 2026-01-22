/**
 * Quizzes Filters Component (Updated)
 * 
 * Enhanced mobile-first filter component matching AssignmentsFilters design
 * Uses bottom sheet for mobile, inline filters for desktop with active filter pills
 */

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import {
    Search,
    Filter,
    X,
    SlidersHorizontal,
    BookOpen,
    CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type QuizStatusFilter = 'all' | 'active' | 'inactive' | 'upcoming' | 'ended';

export interface QuizzesFiltersProps {
    /** Current search query */
    searchQuery: string;
    /** Callback when search query changes */
    onSearchChange: (query: string) => void;
    /** Current status filter */
    statusFilter: QuizStatusFilter;
    /** Callback when status filter changes */
    onStatusFilterChange: (status: QuizStatusFilter) => void;
    /** Current class filter */
    classFilter: string;
    /** Callback when class filter changes */
    onClassFilterChange: (classId: string) => void;
    /** Available classes for filtering */
    availableClasses: Array<{ id: string; name: string }>;
    /** Callback when clear filters button is clicked */
    onClearFilters: () => void;
    /** Search placeholder text */
    searchPlaceholder?: string;
}

export function QuizzesFilters({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    classFilter,
    onClassFilterChange,
    availableClasses,
    onClearFilters,
    searchPlaceholder = 'Search quizzes...',
}: QuizzesFiltersProps) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [tempStatusFilter, setTempStatusFilter] = useState<QuizStatusFilter>(statusFilter);
    const [tempClassFilter, setTempClassFilter] = useState(classFilter);

    // Calculate active filter count
    const activeFilterCount = [
        statusFilter !== 'all',
        classFilter !== 'all',
    ].filter(Boolean).length;

    // Status options with labels
    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'ended', label: 'Ended' },
    ];

    // Handle apply filters (for mobile sheet)
    const handleApplyFilters = () => {
        onStatusFilterChange(tempStatusFilter);
        onClassFilterChange(tempClassFilter);
        setSheetOpen(false);
    };

    // Handle clear filters
    const handleClearFilters = () => {
        setTempStatusFilter('all');
        setTempClassFilter('all');
        onStatusFilterChange('all');
        onClassFilterChange('all');
        onClearFilters();
    };

    // Reset temp filters when sheet opens
    const handleSheetOpenChange = (open: boolean) => {
        if (open) {
            setTempStatusFilter(statusFilter);
            setTempClassFilter(classFilter);
        }
        setSheetOpen(open);
    };

    return (
        <>
            {/* Mobile Filter Card - Bottom Sheet Trigger */}
            <Card className="lg:hidden mb-4">
                <CardContent className={cn("p-0", "pt-6 pb-6")}>
                    <div className="flex gap-2 px-6">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-9 pr-3 h-10"
                            />
                            {searchQuery && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute -right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                    onClick={() => onSearchChange('')}
                                >
                                    <X className="h-3.5 w-3.5" />
                                    <span className="sr-only">Clear search</span>
                                </Button>
                            )}
                        </div>

                        {/* Filter Button with Badge */}
                        <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="relative h-10 w-10 flex-shrink-0"
                                >
                                    <SlidersHorizontal className="h-4 w-4" />
                                    {activeFilterCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-brand-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="bottom"
                                className="h-[85vh] flex flex-col border-t rounded-t-2xl"
                            >
                                <SheetHeader className="text-left pb-4 border-b">
                                    <SheetTitle className="flex items-center gap-2">
                                        <SlidersHorizontal className="h-5 w-5" />
                                        Filter Quizzes
                                    </SheetTitle>
                                    <SheetDescription>
                                        Refine your quiz search with filters below
                                    </SheetDescription>
                                </SheetHeader>

                                {/* Scrollable Filter Content */}
                                <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-modern p-4">
                                    {/* Status Filter */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Status
                                        </label>
                                        <Select
                                            value={tempStatusFilter}
                                            onValueChange={(value) => setTempStatusFilter(value as QuizStatusFilter)}
                                        >
                                            <SelectTrigger className="w-full h-11">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statusOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Class Filter */}
                                    {availableClasses.length > 0 && (
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <BookOpen className="h-4 w-4" />
                                                Class
                                            </label>
                                            <Select
                                                value={tempClassFilter}
                                                onValueChange={setTempClassFilter}
                                            >
                                                <SelectTrigger className="w-full h-11">
                                                    <SelectValue placeholder="Select class" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Classes</SelectItem>
                                                    {availableClasses.map((cls) => (
                                                        <SelectItem key={cls.id} value={cls.id}>
                                                            {cls.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Active Filters Display */}
                                    {activeFilterCount > 0 && (
                                        <div className="pt-4 border-t">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-medium">Active Filters</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleClearFilters}
                                                    className="h-8 text-xs"
                                                >
                                                    Clear All
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {statusFilter !== 'all' && (
                                                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                                                        <Filter className="h-3 w-3" />
                                                        {statusOptions.find(s => s.value === statusFilter)?.label}
                                                        <button
                                                            onClick={() => {
                                                                setTempStatusFilter('all');
                                                                onStatusFilterChange('all');
                                                            }}
                                                            className="ml-1"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                )}
                                                {classFilter !== 'all' && (
                                                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                                                        <BookOpen className="h-3 w-3" />
                                                        {availableClasses.find(c => c.id === classFilter)?.name}
                                                        <button
                                                            onClick={() => {
                                                                setTempClassFilter('all');
                                                                onClassFilterChange('all');
                                                            }}
                                                            className="ml-1"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Fixed Footer with Actions */}
                                <SheetFooter className="border-t pt-4 flex-shrink-0">
                                    <div className="flex gap-2 w-full">
                                        <Button
                                            variant="outline"
                                            onClick={() => setSheetOpen(false)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleApplyFilters}
                                            className="flex-1 bg-brand-primary hover:bg-brand-primary/90"
                                        >
                                            Apply Filters
                                        </Button>
                                    </div>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Active Filter Pills - Mobile */}
                    {activeFilterCount > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t px-6 pb-6">
                            {statusFilter !== 'all' && (
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                                    <Filter className="h-3 w-3" />
                                    {statusOptions.find(s => s.value === statusFilter)?.label}
                                    <button
                                        onClick={() => onStatusFilterChange('all')}
                                        className="ml-1 hover:bg-brand-primary/20 rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                            {classFilter !== 'all' && (
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                                    <BookOpen className="h-3 w-3" />
                                    {availableClasses.find(c => c.id === classFilter)?.name}
                                    <button
                                        onClick={() => onClassFilterChange('all')}
                                        className="ml-1 hover:bg-brand-primary/20 rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Desktop Filter Card - Inline */}
            <Card className="hidden lg:block mb-4">
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-10"
                            />
                            {searchQuery && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute -right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                                    onClick={() => onSearchChange('')}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* Status Filter */}
                        <Select
                            value={statusFilter}
                            onValueChange={(value) => onStatusFilterChange(value as QuizStatusFilter)}
                        >
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Class Filter */}
                        {availableClasses.length > 0 && (
                            <Select value={classFilter} onValueChange={onClassFilterChange}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {availableClasses.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id}>
                                            {cls.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Active Filter Pills - Desktop */}
                    {activeFilterCount > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
                            <span className="text-sm text-muted-foreground">Active:</span>
                            {statusFilter !== 'all' && (
                                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                                    <Filter className="h-3 w-3" />
                                    {statusOptions.find(s => s.value === statusFilter)?.label}
                                    <button
                                        onClick={() => onStatusFilterChange('all')}
                                        className="ml-1 hover:bg-brand-primary/20 rounded-full p-0.5 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                            {classFilter !== 'all' && (
                                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                                    <BookOpen className="h-3 w-3" />
                                    {availableClasses.find(c => c.id === classFilter)?.name}
                                    <button
                                        onClick={() => onClassFilterChange('all')}
                                        className="ml-1 hover:bg-brand-primary/20 rounded-full p-0.5 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearFilters}
                                className="h-7 text-xs ml-auto"
                            >
                                Clear All
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
