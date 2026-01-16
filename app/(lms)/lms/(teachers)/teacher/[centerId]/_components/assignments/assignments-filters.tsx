/**
 * Assignments Filters Component
 * 
 * Mobile-first filter component for assignments
 * Uses bottom sheet for mobile, inline filters for desktop
 * Reusable for different user roles
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
    Calendar,
    CheckCircle2,
} from 'lucide-react';
import { AssignmentStatus } from '@/lib/branch-system/assignment';

export interface AssignmentsFiltersProps {
    /** Current search query */
    searchQuery: string;
    /** Callback when search changes */
    onSearchChange: (query: string) => void;
    /** Current status filter */
    statusFilter: AssignmentStatus | 'all';
    /** Callback when status changes */
    onStatusChange: (status: AssignmentStatus | 'all') => void;
    /** Current class filter */
    classFilter: string;
    /** Callback when class changes */
    onClassChange: (classId: string) => void;
    /** Available classes for filter dropdown */
    availableClasses: Array<{ id: string; name: string }>;
    /** Search placeholder text */
    searchPlaceholder?: string;
}

export function AssignmentsFilters({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    classFilter,
    onClassChange,
    availableClasses,
    searchPlaceholder = 'Search assignments...',
}: AssignmentsFiltersProps) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [tempStatusFilter, setTempStatusFilter] = useState<AssignmentStatus | 'all'>(statusFilter);
    const [tempClassFilter, setTempClassFilter] = useState(classFilter);

    // Calculate active filter count
    const activeFilterCount = [
        statusFilter !== 'all',
        classFilter !== 'all',
    ].filter(Boolean).length;

    // Handle apply filters (for mobile sheet)
    const handleApplyFilters = () => {
        onStatusChange(tempStatusFilter);
        onClassChange(tempClassFilter);
        setSheetOpen(false);
    };

    // Handle clear filters
    const handleClearFilters = () => {
        setTempStatusFilter('all');
        setTempClassFilter('all');
        onStatusChange('all');
        onClassChange('all');
    };

    // Reset temp filters when sheet opens
    const handleSheetOpenChange = (open: boolean) => {
        if (open) {
            setTempStatusFilter(statusFilter);
            setTempClassFilter(classFilter);
        }
        setSheetOpen(open);
    };

    // Status options with labels
    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: AssignmentStatus.DRAFT, label: 'Draft' },
        { value: AssignmentStatus.PUBLISHED, label: 'Published' },
        { value: AssignmentStatus.CLOSED, label: 'Closed' },
    ];

    return (
        <>
            {/* Mobile Filter Card - Bottom Sheet Trigger */}
            <Card className="lg:hidden mb-4">
                <CardContent>
                    <div className="flex gap-2">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-9 pr-3 h-10"
                            />
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
                                        Filter Assignments
                                    </SheetTitle>
                                    <SheetDescription>
                                        Refine your assignment search with filters below
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
                                            onValueChange={(value) => setTempStatusFilter(value as AssignmentStatus | 'all')}
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
                                                                onStatusChange('all');
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
                                                                onClassChange('all');
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
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                            {statusFilter !== 'all' && (
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                                    <Filter className="h-3 w-3" />
                                    {statusOptions.find(s => s.value === statusFilter)?.label}
                                    <button
                                        onClick={() => onStatusChange('all')}
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
                                        onClick={() => onClassChange('all')}
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
                        </div>

                        {/* Status Filter */}
                        <Select
                            value={statusFilter}
                            onValueChange={(value) => onStatusChange(value as AssignmentStatus | 'all')}
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
                        <Select value={classFilter} onValueChange={onClassChange}>
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
                    </div>

                    {/* Active Filter Pills - Desktop */}
                    {activeFilterCount > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
                            <span className="text-sm text-muted-foreground">Active:</span>
                            {statusFilter !== 'all' && (
                                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                                    <Filter className="h-3 w-3" />
                                    {statusOptions.find(s => s.value === statusFilter)?.label}
                                    <button
                                        onClick={() => onStatusChange('all')}
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
                                        onClick={() => onClassChange('all')}
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
