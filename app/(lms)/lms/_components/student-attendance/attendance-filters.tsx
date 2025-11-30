'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, X, Search } from 'lucide-react';
import { format } from 'date-fns';
import {
    useBranchClassesStore,
    useClassesByBranch,
    useClassesByCoachingCenter,
} from '@/lib/branch-system/branch-classes';

/**
 * AttendanceFilters Props
 * For branch manager view: pass branchId
 * For coach view: pass coachingCenterId
 */
interface AttendanceFiltersProps {
    selectedDate: string;
    onDateChange: (date: string) => void;
    selectedClass: string;
    onClassChange: (classId: string) => void;
    branchId?: string;
    coachingCenterId?: string;
    /** Optional: Filter by student username (partial match) */
    studentUsername?: string;
    onStudentUsernameChange?: (username: string) => void;
}

export default function AttendanceFilters({
    selectedDate,
    onDateChange,
    selectedClass,
    onClassChange,
    branchId,
    coachingCenterId,
    studentUsername = '',
    onStudentUsernameChange,
}: AttendanceFiltersProps) {
    const [date, setDate] = useState<Date>(new Date(selectedDate));
    const [usernameSearch, setUsernameSearch] = useState(studentUsername);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    // Get classes based on context
    // Destructure fetch functions from the store so we can call them without
    // causing the effect to re-run on every render (avoids unstable store ref)
    const { fetchClassesByBranch, fetchClassesByCoachingCenter } = useBranchClassesStore();
    const branchClasses = useClassesByBranch(branchId || '');
    const coachingCenterClasses = useClassesByCoachingCenter(coachingCenterId || '');

    // Determine which classes to show
    const isBranchView = !!branchId;
    const classes = isBranchView ? branchClasses : coachingCenterClasses;

    // Fetch classes on mount / when context changes
    useEffect(() => {
        if (branchId) {
            fetchClassesByBranch(branchId);
        } else if (coachingCenterId) {
            fetchClassesByCoachingCenter(coachingCenterId);
        }
    }, [branchId, coachingCenterId, fetchClassesByBranch, fetchClassesByCoachingCenter]);

    // Update active filters display (only update state when filters actually change)
    useEffect(() => {
        const filters: string[] = [];
        if (selectedClass && selectedClass !== 'all') {
            const classInfo = classes.find(c => c.id === selectedClass);
            if (classInfo) {
                filters.push(`Class: ${classInfo.class_name}`);
            }
        }
        if (usernameSearch) {
            filters.push(`Username: ${usernameSearch}`);
        }

        // shallow compare to avoid unnecessary state updates that can trigger re-renders
        const same = filters.length === activeFilters.length && filters.every((f, i) => f === activeFilters[i]);
        if (!same) {
            setActiveFilters(filters);
        }
        // Include activeFilters so the comparator works correctly and prevents loops
    }, [selectedClass, usernameSearch, classes, activeFilters]);

    const handleDateSelect = (newDate: Date | undefined) => {
        if (newDate) {
            setDate(newDate);
            onDateChange(format(newDate, 'yyyy-MM-dd'));
        }
    };

    const handleUsernameSearch = (value: string) => {
        setUsernameSearch(value);
        onStudentUsernameChange?.(value);
    };

    const clearFilters = () => {
        setDate(new Date());
        onDateChange(format(new Date(), 'yyyy-MM-dd'));
        onClassChange('all');
        setUsernameSearch('');
        onStudentUsernameChange?.('');
        setActiveFilters([]);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
                {/* Date Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            {format(date, 'PPP')}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {/* Class Selector */}
                <Select value={selectedClass} onValueChange={onClassChange}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                                {cls.class_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Username Search */}
                {onStudentUsernameChange && (
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search by username..."
                            value={usernameSearch}
                            onChange={(e) => handleUsernameSearch(e.target.value)}
                            className="pl-8 w-[180px] h-10"
                        />
                    </div>
                )}

                {/* Clear Filters */}
                {activeFilters.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                        <X className="w-4 h-4" />
                        Clear Filters
                    </Button>
                )}
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {activeFilters.map((filter, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                            {filter}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => {
                                // Remove specific filter
                                if (filter.startsWith('Class:')) {
                                    onClassChange('all');
                                } else if (filter.startsWith('Username:')) {
                                    setUsernameSearch('');
                                    onStudentUsernameChange?.('');
                                }
                            }} />
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
