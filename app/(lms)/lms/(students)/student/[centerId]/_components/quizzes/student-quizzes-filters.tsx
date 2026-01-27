/**
 * Student Quizzes Filters Component
 * 
 * Mobile-first filter component for student quizzes
 * Uses bottom sheet for mobile, inline filters for desktop
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
    X,
    SlidersHorizontal,
    BookOpen,
    CheckCircle2,
    RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type StudentQuizStatusFilter = 'all' | 'available' | 'in_progress' | 'completed' | 'passed' | 'failed' | 'upcoming' | 'ended';

export interface StudentQuizzesFiltersProps {
    /** Current search query */
    searchQuery: string;
    /** Callback when search query changes */
    onSearchChange: (query: string) => void;
    /** Current status filter */
    statusFilter: StudentQuizStatusFilter;
    /** Callback when status filter changes */
    onStatusFilterChange: (status: StudentQuizStatusFilter) => void;
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

export function StudentQuizzesFilters({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    classFilter,
    onClassFilterChange,
    availableClasses,
    onClearFilters,
    searchPlaceholder = 'Search quizzes...',
}: StudentQuizzesFiltersProps) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [tempStatusFilter, setTempStatusFilter] = useState<StudentQuizStatusFilter>(statusFilter);
    const [tempClassFilter, setTempClassFilter] = useState(classFilter);

    // Calculate active filter count
    const activeFilterCount = [
        statusFilter !== 'all',
        classFilter !== 'all',
    ].filter(Boolean).length;

    // Status options for students
    const statusOptions = [
        { value: 'all', label: 'All Quizzes' },
        { value: 'available', label: 'Available Now' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'passed', label: 'Passed' },
        { value: 'failed', label: 'Failed' },
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
                                            onValueChange={(value) => setTempStatusFilter(value as StudentQuizStatusFilter)}
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
                                </div>

                                {/* Footer Actions */}
                                <SheetFooter className="flex flex-row gap-3 border-t pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={handleClearFilters}
                                        className="flex-1"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Reset
                                    </Button>
                                    <Button
                                        onClick={handleApplyFilters}
                                        className="flex-1"
                                    >
                                        Apply Filters
                                    </Button>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </div>
                </CardContent>
            </Card>

            {/* Desktop Inline Filters */}
            <Card className="hidden lg:block">
                <CardContent>
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-9 h-10"
                            />
                            {searchQuery && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                    onClick={() => onSearchChange('')}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>

                        {/* Status Filter */}
                        <Select
                            value={statusFilter}
                            onValueChange={(value) => onStatusFilterChange(value as StudentQuizStatusFilter)}
                        >
                            <SelectTrigger className="w-[160px] h-10">
                                <CheckCircle2 className="h-4 w-4 mr-2 text-muted-foreground" />
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
                        <Select
                            value={classFilter}
                            onValueChange={onClassFilterChange}
                        >
                            <SelectTrigger className="w-[180px] h-10">
                                <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
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

                        {/* Clear Filters */}
                        {activeFilterCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearFilters}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Clear filters ({activeFilterCount})
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
