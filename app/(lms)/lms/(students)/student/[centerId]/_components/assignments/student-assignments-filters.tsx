/**
 * Student Assignments Filters Component
 * 
 * Mobile-first filter component for student assignments
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
    SlidersHorizontal,
    BookOpen,
    CheckCircle2,
    X,
} from 'lucide-react';

type StatusFilterType = 'all' | 'pending' | 'submitted' | 'graded' | 'overdue';

export interface StudentAssignmentsFiltersProps {
    /** Current search query */
    searchQuery: string;
    /** Callback when search changes */
    onSearchChange: (query: string) => void;
    /** Current status filter */
    statusFilter: StatusFilterType;
    /** Callback when status changes */
    onStatusChange: (status: StatusFilterType) => void;
    /** Current class filter */
    classFilter: string;
    /** Callback when class changes */
    onClassChange: (classId: string) => void;
    /** Available classes for filter dropdown */
    availableClasses: Array<{ id: string; name: string }>;
    /** Search placeholder text */
    searchPlaceholder?: string;
}

export function StudentAssignmentsFilters({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    classFilter,
    onClassChange,
    availableClasses,
    searchPlaceholder = 'Search assignments...',
}: StudentAssignmentsFiltersProps) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [tempStatusFilter, setTempStatusFilter] = useState<StatusFilterType>(statusFilter);
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
    const statusOptions: Array<{ value: StatusFilterType; label: string }> = [
        { value: 'all', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'graded', label: 'Graded' },
        { value: 'overdue', label: 'Overdue' },
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
                                            Submission Status
                                        </label>
                                        <Select
                                            value={tempStatusFilter}
                                            onValueChange={(value) => setTempStatusFilter(value as StatusFilterType)}
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

                                <SheetFooter className="pt-4 border-t flex flex-row gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleClearFilters}
                                        className="flex-1"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Clear
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

            {/* Desktop Filters - Inline */}
            <Card className="hidden lg:block">
                <CardContent >
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
                        </div>

                        {/* Status Filter */}
                        <Select
                            value={statusFilter}
                            onValueChange={(value) => onStatusChange(value as StatusFilterType)}
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
                            onValueChange={onClassChange}
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

                        {/* Clear Filters Button */}
                        {activeFilterCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearFilters}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Clear filters
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
