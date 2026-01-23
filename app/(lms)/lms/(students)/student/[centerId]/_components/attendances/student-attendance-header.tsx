/**
 * Student Attendance Header Component
 * 
 * Header section with title, date picker, and stats for student attendance view
 * READ-ONLY for students - they can only view their own attendance
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Calendar as CalendarIcon,
    CalendarDays,
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCw
} from 'lucide-react';
import { format, isToday, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

interface StudentAttendanceHeaderProps {
    dateRange: DateRange | undefined;
    onDateRangeChange: (range: DateRange | undefined) => void;
    totalRecords: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    onRefresh: () => void;
    isLoading?: boolean;
    className?: string;
}

export function StudentAttendanceHeader({
    dateRange,
    onDateRangeChange,
    totalRecords,
    presentCount,
    absentCount,
    lateCount,
    onRefresh,
    isLoading = false,
    className,
}: StudentAttendanceHeaderProps) {
    const [calendarOpen, setCalendarOpen] = useState(false);

    const handleDateSelect = (selectedRange: DateRange | undefined) => {
        onDateRangeChange(selectedRange);
        // Close calendar only when both dates are selected
        if (selectedRange?.from && selectedRange?.to) {
            setCalendarOpen(false);
        }
    };

    // Format date range display
    const getDateRangeDisplay = () => {
        if (!dateRange?.from) return 'Select date range';
        if (!dateRange.to) return format(dateRange.from, 'MMM d, yyyy');
        return `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
    };

    // Quick date presets
    const handleThisMonth = () => {
        const now = new Date();
        onDateRangeChange({
            from: startOfMonth(now),
            to: endOfMonth(now),
        });
        setCalendarOpen(false);
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* Title and Date */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
                    <p className="text-muted-foreground text-sm">
                        View your attendance records
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Date Range Picker */}
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'justify-start text-left font-normal gap-2',
                                    !dateRange?.from && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                    {getDateRangeDisplay()}
                                </span>
                                <span className="sm:hidden">
                                    {dateRange?.from ? format(dateRange.from, 'MMM d') : 'Dates'}
                                </span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <div className="p-2 border-b">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-sm"
                                    onClick={handleThisMonth}
                                >
                                    <CalendarDays className="h-4 w-4 mr-2" />
                                    This Month
                                </Button>
                            </div>
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={handleDateSelect}
                                disabled={(date) => date > new Date()}
                                numberOfMonths={2}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Refresh Button */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn(
                            "h-4 w-4",
                            isLoading && "animate-spin"
                        )} />
                    </Button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{totalRecords} Days</span>
                </Badge>
                <Badge variant="success" className="gap-1.5 py-1.5 px-3">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{presentCount} Present</span>
                </Badge>
                <Badge variant="destructive" className="gap-1.5 py-1.5 px-3">
                    <XCircle className="h-3.5 w-3.5" />
                    <span>{absentCount} Absent</span>
                </Badge>
                <Badge variant="warning" className="gap-1.5 py-1.5 px-3">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{lateCount} Late</span>
                </Badge>
            </div>
        </div>
    );
}
