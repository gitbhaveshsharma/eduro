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

interface ClassesFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    statusFilter: string;
    onStatusChange: (status: string) => void;
    subjectFilter: string;
    onSubjectChange: (subject: string) => void;
    availableSubjects: string[];
}

export function ClassesFilters({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    subjectFilter,
    onSubjectChange,
    availableSubjects,
}: ClassesFiltersProps) {
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
                                className="h-[85vh] flex flex-col border-t rounded-t-2xl "
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
                                            <Filter className="h-4 w-4 " />
                                            Status
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
                                                <SelectItem value="ACTIVE">Active</SelectItem>
                                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                                                <SelectItem value="FULL">Full</SelectItem>
                                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Subject Filter */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <BookOpen className="h-4 w-4 " />
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
                                                        {statusFilter}
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
                                                {subjectFilter !== 'all' && (
                                                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                                                        <BookOpen className="h-3 w-3" />
                                                        {subjectFilter}
                                                        <button
                                                            onClick={() => {
                                                                setTempSubjectFilter('all');
                                                                onSubjectChange('all');
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
                                    {statusFilter}
                                    <button
                                        onClick={() => onStatusChange('all')}
                                        className="ml-1 hover:bg-brand-primary/20 rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                            {subjectFilter !== 'all' && (
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                                    <BookOpen className="h-3 w-3" />
                                    {subjectFilter}
                                    <button
                                        onClick={() => onSubjectChange('all')}
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
                <CardContent >
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Search classes by name, subject, or grade..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={onStatusChange}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                                <SelectItem value="FULL">Full</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Subject Filter */}
                        <Select value={subjectFilter} onValueChange={onSubjectChange}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <BookOpen className="h-4 w-4 mr-2" />
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
                    </div>

                    {/* Active Filter Pills - Desktop */}
                    {activeFilterCount > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
                            <span className="text-sm text-muted-foreground">Active:</span>
                            {statusFilter !== 'all' && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                                    <Filter className="h-3 w-3" />
                                    {statusFilter}
                                    <button
                                        onClick={() => onStatusChange('all')}
                                        className="ml-1 hover:bg-brand-primary/20 rounded-full p-0.5 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                            {subjectFilter !== 'all' && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                                    <BookOpen className="h-3 w-3" />
                                    {subjectFilter}
                                    <button
                                        onClick={() => onSubjectChange('all')}
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
