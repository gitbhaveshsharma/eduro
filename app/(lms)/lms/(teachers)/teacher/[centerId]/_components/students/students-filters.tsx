/**
 * Teacher Students Filters Component
 * 
 * Mobile-friendly filters for student list
 * Similar styling to classes-filters.tsx
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
import { Search, Filter, BookOpen, X, SlidersHorizontal } from 'lucide-react';

interface StudentsFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    classFilter: string;
    onClassChange: (classId: string) => void;
    attendanceFilter: string;
    onAttendanceChange: (filter: string) => void;
    availableClasses: Array<{ id: string; name: string }>;
}

export function StudentsFilters({
    searchQuery,
    onSearchChange,
    classFilter,
    onClassChange,
    attendanceFilter,
    onAttendanceChange,
    availableClasses,
}: StudentsFiltersProps) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [tempClassFilter, setTempClassFilter] = useState(classFilter);
    const [tempAttendanceFilter, setTempAttendanceFilter] = useState(attendanceFilter);

    // Calculate active filter count
    const activeFilterCount = [
        classFilter !== 'all',
        attendanceFilter !== 'all',
    ].filter(Boolean).length;

    // Handle apply filters (for mobile sheet)
    const handleApplyFilters = () => {
        onClassChange(tempClassFilter);
        onAttendanceChange(tempAttendanceFilter);
        setSheetOpen(false);
    };

    // Handle clear filters
    const handleClearFilters = () => {
        setTempClassFilter('all');
        setTempAttendanceFilter('all');
        onClassChange('all');
        onAttendanceChange('all');
    };

    // Reset temp filters when sheet opens
    const handleSheetOpenChange = (open: boolean) => {
        if (open) {
            setTempClassFilter(classFilter);
            setTempAttendanceFilter(attendanceFilter);
        }
        setSheetOpen(open);
    };

    const getClassDisplayName = (classId: string) => {
        const cls = availableClasses.find(c => c.id === classId);
        return cls?.name || classId;
    };

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
                                placeholder="Search students..."
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
                                        Filter Students
                                    </SheetTitle>
                                    <SheetDescription>
                                        Refine your student search with filters below
                                    </SheetDescription>
                                </SheetHeader>

                                {/* Scrollable Filter Content */}
                                <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-modern p-4">
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

                                    {/* Attendance Filter */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Filter className="h-4 w-4" />
                                            Attendance
                                        </label>
                                        <Select
                                            value={tempAttendanceFilter}
                                            onValueChange={setTempAttendanceFilter}
                                        >
                                            <SelectTrigger className="w-full h-11">
                                                <SelectValue placeholder="Select attendance range" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Attendance</SelectItem>
                                                <SelectItem value="excellent">Excellent (≥90%)</SelectItem>
                                                <SelectItem value="good">Good (≥75%)</SelectItem>
                                                <SelectItem value="average">Average (≥60%)</SelectItem>
                                                <SelectItem value="poor">Poor (&lt;60%)</SelectItem>
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
                                                {classFilter !== 'all' && (
                                                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                                                        <BookOpen className="h-3 w-3" />
                                                        {getClassDisplayName(classFilter)}
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
                                                {attendanceFilter !== 'all' && (
                                                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                                                        <Filter className="h-3 w-3" />
                                                        {attendanceFilter.charAt(0).toUpperCase() + attendanceFilter.slice(1)}
                                                        <button
                                                            onClick={() => {
                                                                setTempAttendanceFilter('all');
                                                                onAttendanceChange('all');
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
                            {classFilter !== 'all' && (
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                                    <BookOpen className="h-3 w-3" />
                                    {getClassDisplayName(classFilter)}
                                    <button
                                        onClick={() => onClassChange('all')}
                                        className="ml-1 hover:bg-brand-primary/20 rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                            {attendanceFilter !== 'all' && (
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                                    <Filter className="h-3 w-3" />
                                    {attendanceFilter.charAt(0).toUpperCase() + attendanceFilter.slice(1)}
                                    <button
                                        onClick={() => onAttendanceChange('all')}
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
                                placeholder="Search students by name..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Class Filter */}
                        <Select value={classFilter} onValueChange={onClassChange}>
                            <SelectTrigger className="w-full sm:w-[200px]">
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

                        {/* Attendance Filter */}
                        <Select value={attendanceFilter} onValueChange={onAttendanceChange}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Attendance" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Attendance</SelectItem>
                                <SelectItem value="excellent">Excellent (≥90%)</SelectItem>
                                <SelectItem value="good">Good (≥75%)</SelectItem>
                                <SelectItem value="average">Average (≥60%)</SelectItem>
                                <SelectItem value="poor">Poor (&lt;60%)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Active Filter Pills - Desktop */}
                    {activeFilterCount > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
                            <span className="text-sm text-muted-foreground">Active:</span>
                            {classFilter !== 'all' && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                                    <BookOpen className="h-3 w-3" />
                                    {getClassDisplayName(classFilter)}
                                    <button
                                        onClick={() => onClassChange('all')}
                                        className="ml-1 hover:bg-brand-primary/20 rounded-full p-0.5 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                            {attendanceFilter !== 'all' && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                                    <Filter className="h-3 w-3" />
                                    {attendanceFilter.charAt(0).toUpperCase() + attendanceFilter.slice(1)}
                                    <button
                                        onClick={() => onAttendanceChange('all')}
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
