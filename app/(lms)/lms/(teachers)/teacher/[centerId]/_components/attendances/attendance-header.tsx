/**
 * Attendance Header Component
 * 
 * Header section with title, date picker, and action buttons
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Calendar as CalendarIcon,
    Users,
    UserCheck,
    RefreshCw
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface AttendanceHeaderProps {
    date: Date;
    onDateChange: (date: Date) => void;
    totalStudents: number;
    markedCount: number;
    onRefresh: () => void;
    isLoading?: boolean;
    className?: string;
}

export function AttendanceHeader({
    date,
    onDateChange,
    totalStudents,
    markedCount,
    onRefresh,
    isLoading = false,
    className,
}: AttendanceHeaderProps) {
    const [calendarOpen, setCalendarOpen] = useState(false);
    const unmarkedCount = totalStudents - markedCount;

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            onDateChange(selectedDate);
            setCalendarOpen(false);
        }
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* Title and Date */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Mark Attendance</h1>
                    <p className="text-muted-foreground text-sm">
                        Mark attendance for your students
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Date Picker */}
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'justify-start text-left font-normal gap-2',
                                    !date && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                    {isToday(date) ? 'Today' : format(date, 'PPP')}
                                </span>
                                <span className="sm:hidden">
                                    {format(date, 'MMM d')}
                                </span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={handleDateSelect}
                                disabled={(date) => date > new Date()}
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
                        <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                    </Button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className="gap-1.5 px-3 py-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{totalStudents} Students</span>
                </Badge>

                <Badge variant="success" className="gap-1.5 px-3 py-1">
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>{markedCount} Marked</span>
                </Badge>

                {unmarkedCount > 0 && (
                    <Badge variant="warning" className="gap-1.5 px-3 py-1">
                        <span>{unmarkedCount} Unmarked</span>
                    </Badge>
                )}
            </div>
        </div>
    );
}
