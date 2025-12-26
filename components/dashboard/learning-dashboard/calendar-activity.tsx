/**
 * Calendar Activity Component
 * Traditional calendar grid layout with month/year navigation
 * Shows dates, days, and activity tracking with blue theme
 * Visible for Teachers (T), Coaches (C), and Students (S)
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface ActivityData {
    date: string; // YYYY-MM-DD format
    count: number;
}

interface CalendarActivityProps {
    activities: ActivityData[];
    defaultView?: 'Month' | 'Year';
    onPeriodChange?: (period: string) => void;
}

export function CalendarActivity({
    activities,
    defaultView = 'Month',
    onPeriodChange,
}: CalendarActivityProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'Month' | 'Year'>(defaultView);

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Get calendar grid for month (including previous/next month days)
    const getCalendarGrid = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Get day of week (0 = Sunday, convert to Monday = 0)
        let startDay = firstDay.getDay() - 1;
        if (startDay === -1) startDay = 6; // Sunday becomes 6

        const daysInMonth = lastDay.getDate();
        const weeks: (Date | null)[][] = [];
        let currentWeek: (Date | null)[] = [];

        // Fill in days from previous month
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            currentWeek.push(new Date(year, month - 1, prevMonthLastDay - i));
        }

        // Fill in current month days
        for (let day = 1; day <= daysInMonth; day++) {
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
            currentWeek.push(new Date(year, month, day));
        }

        // Fill in days from next month
        let nextMonthDay = 1;
        while (currentWeek.length < 7) {
            currentWeek.push(new Date(year, month + 1, nextMonthDay++));
        }
        weeks.push(currentWeek);

        return weeks;
    };

    const getActivityCount = (date: Date): number => {
        const dateStr = date.toISOString().split('T')[0];
        const activity = activities.find((a) => a.date === dateStr);
        return activity?.count ?? 0;
    };

    const getIntensityClass = (count: number, isCurrentMonth: boolean): string => {
        if (!isCurrentMonth) {
            return 'bg-muted/10 dark:bg-muted/5 text-muted-foreground/40';
        }

        if (count === 0) return 'bg-muted/30 dark:bg-muted/20';
        if (count <= 3) return 'bg-blue-100 dark:bg-blue-900/30';
        if (count <= 6) return 'bg-blue-300 dark:bg-blue-700/50';
        if (count <= 9) return 'bg-blue-500 dark:bg-blue-600/70';
        return 'bg-blue-600 dark:bg-blue-500/80';
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getMonthName = (date: Date): string => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    // Navigation handlers
    const handlePrevious = () => {
        const newDate = new Date(currentDate);
        if (view === 'Month') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setFullYear(newDate.getFullYear() - 1);
        }
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (view === 'Month') {
            newDate.setMonth(newDate.getMonth() + 1);
        } else {
            newDate.setFullYear(newDate.getFullYear() + 1);
        }
        setCurrentDate(newDate);
    };

    const handleViewChange = (newView: 'Month' | 'Year') => {
        setView(newView);
        onPeriodChange?.(newView);
    };

    const isToday = (date: Date): boolean => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isFutureDate = (date: Date): boolean => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date > today;
    };

    const isCurrentMonth = (date: Date): boolean => {
        return date.getMonth() === currentDate.getMonth() &&
            date.getFullYear() === currentDate.getFullYear();
    };

    const calendarWeeks = getCalendarGrid(currentDate);
    const totalActivities = activities.filter(a => {
        const activityDate = new Date(a.date);
        return activityDate.getMonth() === currentDate.getMonth() &&
            activityDate.getFullYear() === currentDate.getFullYear();
    }).reduce((sum, a) => sum + a.count, 0);

    return (
        <div className="bg-secondary/20 rounded-xl p-4 dark:bg-secondary/30">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                        Calendar
                    </span>
                </div>
                <Select value={view} onValueChange={(value) => handleViewChange(value as 'Month' | 'Year')}>
                    <SelectTrigger className="w-[100px] h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Month">Month</SelectItem>
                        <SelectItem value="Year">Year</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mb-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevious}
                    className="h-8 w-8 p-0 "
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-medium text-foreground hover:bg-primary/10"
                >
                    {view === 'Month' ? getMonthName(currentDate) : currentDate.getFullYear()}
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNext}
                    className="h-8 w-8 p-0 "
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            {/* Activity Count */}
            <div className="mb-3">
                <span className="text-xs text-muted-foreground">
                    {view === 'Month'
                        ? `${totalActivities} activities this month`
                        : `${activities.filter(a => new Date(a.date).getFullYear() === currentDate.getFullYear()).reduce((sum, a) => sum + a.count, 0)} activities this year`
                    }
                </span>
            </div>

            {/* Month View - Calendar Grid */}
            {view === 'Month' && (
                <TooltipProvider>
                    <div className="space-y-1">
                        {/* Week Day Headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {weekDays.map((day) => (
                                <div
                                    key={day}
                                    className="text-center text-[10px] font-medium text-muted-foreground py-1"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        {calendarWeeks.map((week, weekIdx) => (
                            <div key={weekIdx} className="grid grid-cols-7 gap-1">
                                {week.map((date, dayIdx) => {
                                    if (!date) return <div key={dayIdx} />;

                                    const count = getActivityCount(date);
                                    const currentMonth = isCurrentMonth(date);
                                    const intensity = getIntensityClass(count, currentMonth);
                                    const today = isToday(date);
                                    const future = isFutureDate(date);

                                    return (
                                        <Tooltip key={dayIdx}>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={`
                                                        relative flex items-center justify-center 
                                                        h-10 rounded-lg transition-all cursor-pointer
                                                        ${intensity}
                                                        ${today ? 'ring-2 ring-primary font-bold' : ''}
                                                        ${future && currentMonth ? 'opacity-50 cursor-not-allowed' : ''}
                                                        ${currentMonth && !future ? 'hover:ring-2 hover:ring-primary/50' : ''}
                                                    `}
                                                >
                                                    <span className={`text-sm ${currentMonth ? 'text-foreground font-medium' : 'text-muted-foreground/50'}`}>
                                                        {date.getDate()}
                                                    </span>
                                                    {count > 0 && currentMonth && (
                                                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
                                                    )}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="text-xs">
                                                <p className="font-semibold">
                                                    {count} {count === 1 ? 'activity' : 'activities'}
                                                </p>
                                                <p className="text-muted-foreground">
                                                    {formatDate(date)}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </TooltipProvider>
            )}

            {/* Year View - Horizontal Scroll */}
            {view === 'Year' && (
                <ScrollArea className="w-full whitespace-nowrap">
                    <TooltipProvider>
                        <div className="flex gap-4 pb-4">
                            {Array.from({ length: 12 }, (_, monthIdx) => {
                                const monthDate = new Date(currentDate.getFullYear(), monthIdx, 1);
                                const monthWeeks = getCalendarGrid(monthDate);
                                const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });

                                return (
                                    <div key={monthIdx} className="flex-shrink-0 space-y-2">
                                        {/* Month Label */}
                                        <div className="text-center">
                                            <span className="text-xs font-semibold text-foreground">
                                                {monthName}
                                            </span>
                                        </div>

                                        {/* Mini Calendar Grid */}
                                        <div className="space-y-1 bg-background/50 rounded-lg p-2">
                                            {/* Week Headers */}
                                            <div className="grid grid-cols-7 gap-1">
                                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="text-center text-[8px] font-medium text-muted-foreground w-5"
                                                    >
                                                        {day}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Calendar Days */}
                                            {monthWeeks.map((week, weekIdx) => (
                                                <div key={weekIdx} className="grid grid-cols-7 gap-1">
                                                    {week.map((date, dayIdx) => {
                                                        if (!date) return <div key={dayIdx} className="w-5 h-5" />;

                                                        const count = getActivityCount(date);
                                                        const currentMonth = date.getMonth() === monthIdx;
                                                        const intensity = getIntensityClass(count, currentMonth);

                                                        return (
                                                            <Tooltip key={dayIdx}>
                                                                <TooltipTrigger asChild>
                                                                    <div
                                                                        className={`w-5 h-5 rounded-sm flex items-center justify-center ${intensity} transition-all hover:ring-1 hover:ring-primary/50 cursor-pointer`}
                                                                    >
                                                                        <span className="text-[8px] font-medium">
                                                                            {currentMonth ? date.getDate() : ''}
                                                                        </span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="text-xs">
                                                                    <p className="font-semibold">
                                                                        {count} {count === 1 ? 'activity' : 'activities'}
                                                                    </p>
                                                                    <p className="text-muted-foreground">
                                                                        {formatDate(date)}
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </TooltipProvider>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            )}

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 justify-end">
                <span className="text-[10px] text-muted-foreground">Less</span>
                <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((level) => (
                        <div
                            key={level}
                            className={`w-3 h-3 rounded-sm ${level === 0
                                ? 'bg-muted/30'
                                : level === 1
                                    ? 'bg-blue-100 dark:bg-blue-900/30'
                                    : level === 2
                                        ? 'bg-blue-300 dark:bg-blue-700/50'
                                        : level === 3
                                            ? 'bg-blue-500 dark:bg-blue-600/70'
                                            : 'bg-blue-600 dark:bg-blue-500/80'
                                }`}
                        />
                    ))}
                </div>
                <span className="text-[10px] text-muted-foreground">More</span>
            </div>
        </div>
    );
}
