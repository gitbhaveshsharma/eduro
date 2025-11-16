'use client';

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
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

interface AttendanceFiltersProps {
    selectedDate: string;
    onDateChange: (date: string) => void;
    selectedClass: string;
    onClassChange: (classId: string) => void;
}

export default function AttendanceFilters({
    selectedDate,
    onDateChange,
    selectedClass,
    onClassChange,
}: AttendanceFiltersProps) {
    const [date, setDate] = useState<Date>(new Date(selectedDate));
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    const handleDateSelect = (newDate: Date | undefined) => {
        if (newDate) {
            setDate(newDate);
            onDateChange(format(newDate, 'yyyy-MM-dd'));
        }
    };

    const clearFilters = () => {
        setDate(new Date());
        onDateChange(format(new Date(), 'yyyy-MM-dd'));
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
                        <SelectItem value="default-class-id">All Classes</SelectItem>
                        <SelectItem value="class-1">Class 1A</SelectItem>
                        <SelectItem value="class-2">Class 2B</SelectItem>
                    </SelectContent>
                </Select>

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
                                setActiveFilters(prev => prev.filter((_, i) => i !== index));
                            }} />
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
