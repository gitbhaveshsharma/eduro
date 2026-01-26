/**
 * Student Classes Filters Component
 * 
 * Desktop and mobile responsive filters for student classes
 * Similar to teacher's classes-filters component
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

interface StudentClassesFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    statusFilter: string;
    onStatusChange: (status: string) => void;
    subjectFilter: string;
    onSubjectChange: (subject: string) => void;
    availableSubjects: string[];
}

export function StudentClassesFilters({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    subjectFilter,
    onSubjectChange,
    availableSubjects,
}: StudentClassesFiltersProps) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [tempStatusFilter, setTempStatusFilter] = useState(statusFilter);
    const [tempSubjectFilter, setTempSubjectFilter] = useState(subjectFilter);

    // Calculate active filter count
    const activeFilterCount = [
        statusFilter !== 'all',
        subjectFilter !== 'all',
    ].filter(Boolean).length;

    // Handle apply filters (for mobile sheet)
    const handleApplyFilters = () => {
        onStatusChange(tempStatusFilter);
        onSubjectChange(tempSubjectFilter);
        setSheetOpen(false);
    };

    // Handle clear filters
    const handleClearFilters = () => {
        setTempStatusFilter('all');
        setTempSubjectFilter('all');
        onStatusChange('all');
        onSubjectChange('all');
    };

    // Reset temp filters when sheet opens
    const handleSheetOpenChange = (open: boolean) => {
        if (open) {
            setTempStatusFilter(statusFilter);
            setTempSubjectFilter(subjectFilter);
        }
        setSheetOpen(open);
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
                                placeholder="Search classes..."
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
                                        Filter
                                    </SheetTitle>
                                    <SheetDescription>
                                        Refine your class search with filters below
                                    </SheetDescription>
                                </SheetHeader>

                                {/* Scrollable Filter Content */}
                                <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-modern p-4">
                                    {/* Status Filter */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Filter className="h-4 w-4" />
                                            Enrollment Status
                                        </label>
                                        <Select
                                            value={tempStatusFilter}
                                            onValueChange={setTempStatusFilter}
                                        >
                                            <SelectTrigger className="w-full h-11">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="ENROLLED">Enrolled</SelectItem>
                                                <SelectItem value="PENDING">Pending</SelectItem>
                                                <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Subject Filter */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <BookOpen className="h-4 w-4" />
                                            Subject
                                        </label>
                                        <Select
                                            value={tempSubjectFilter}
                                            onValueChange={setTempSubjectFilter}
                                        >
                                            <SelectTrigger className="w-full h-11">
                                                <SelectValue placeholder="Select subject" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Subjects</SelectItem>
                                                {availableSubjects.map((subject) => (
                                                    <SelectItem key={subject} value={subject}>
                                                        {subject}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <SheetFooter className="border-t pt-4 gap-2 sm:gap-0">
                                    <Button
                                        variant="outline"
                                        onClick={handleClearFilters}
                                        className="flex-1 sm:flex-none"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Clear
                                    </Button>
                                    <Button
                                        onClick={handleApplyFilters}
                                        className="flex-1 sm:flex-none"
                                    >
                                        Apply Filters
                                    </Button>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </div>
                </CardContent>
            </Card>

            {/* Desktop Filters */}
            <Card className="hidden lg:block">
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Search classes..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={onStatusChange}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="ENROLLED">Enrolled</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Subject Filter */}
                        <Select value={subjectFilter} onValueChange={onSubjectChange}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Subject" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Subjects</SelectItem>
                                {availableSubjects.map((subject) => (
                                    <SelectItem key={subject} value={subject}>
                                        {subject}
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
                                Clear filters
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
