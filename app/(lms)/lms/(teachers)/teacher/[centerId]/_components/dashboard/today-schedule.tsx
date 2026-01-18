'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormattedScheduleItem } from '@/lib/branch-system/types/teacher-dashboard.types';

interface TodayScheduleProps {
    schedule: FormattedScheduleItem[];
    onClassClick?: (classId: string) => void;
}

/**
 * Today's class schedule card
 * Mobile-friendly with horizontal scroll on small screens
 */
export function TodaySchedule({ schedule, onClassClick }: TodayScheduleProps) {
    if (schedule.length === 0) {
        return (
            <Card className="border-muted/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Today&apos;s Schedule
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No classes scheduled for today</p>
                        <p className="text-xs mt-1">Enjoy your free day!</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-muted/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Today&apos;s Schedule
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                        {schedule.length} class{schedule.length !== 1 ? 'es' : ''}
                    </Badge>
                </div>
                <CardDescription>Your classes for today</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Horizontal scroll on mobile */}
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible">
                    {schedule.map((item) => (
                        <ScheduleCard
                            key={item.class_id}
                            item={item}
                            onClick={() => onClassClick?.(item.class_id)}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

interface ScheduleCardProps {
    item: FormattedScheduleItem;
    onClick?: () => void;
}

function ScheduleCard({ item, onClick }: ScheduleCardProps) {
    const statusColors = {
        upcoming: 'bg-blue-100 text-blue-700 border-blue-200',
        ongoing: 'bg-green-100 text-green-700 border-green-200 animate-pulse',
        completed: 'bg-gray-100 text-gray-600 border-gray-200',
    };

    const statusLabels = {
        upcoming: 'Upcoming',
        ongoing: 'In Progress',
        completed: 'Completed',
    };

    return (
        <div
            className={cn(
                'min-w-[260px] sm:min-w-0 snap-start flex-shrink-0 md:flex-shrink',
                'p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-200',
                'cursor-pointer hover:border-primary/30',
                item.status === 'ongoing' && 'ring-2 ring-green-500/20'
            )}
            onClick={onClick}
        >
            {/* Status badge */}
            <div className="flex items-center justify-between mb-3">
                <Badge
                    variant="outline"
                    className={cn('text-[10px] font-medium', statusColors[item.status])}
                >
                    {statusLabels[item.status]}
                </Badge>
                <span className="text-xs font-medium text-muted-foreground">
                    {item.formatted_time}
                </span>
            </div>

            {/* Class info */}
            <div className="space-y-2">
                <h4 className="font-semibold text-sm line-clamp-1">{item.class_name}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px] px-2 py-0">
                        {item.subject}
                    </Badge>
                    {item.batch_name && (
                        <span className="truncate">{item.batch_name}</span>
                    )}
                </div>
            </div>

            {/* Enrollment */}
            <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        Students
                    </span>
                    <span className="font-medium tabular-nums">
                        {item.current_enrollment}/{item.max_students}
                    </span>
                </div>
                <Progress
                    value={item.enrollment_percentage}
                    className="h-1.5"
                />
                {item.is_full && (
                    <Badge variant="secondary" className="text-[10px] mt-1">
                        Class Full
                    </Badge>
                )}
            </div>
        </div>
    );
}

interface ScheduleListItemProps {
    item: FormattedScheduleItem;
    onClick?: () => void;
}

/**
 * Compact list item for schedule (alternative view)
 */
export function ScheduleListItem({ item, onClick }: ScheduleListItemProps) {
    const statusDots = {
        upcoming: 'bg-blue-500',
        ongoing: 'bg-green-500 animate-pulse',
        completed: 'bg-gray-400',
    };

    return (
        <div
            className={cn(
                'flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors',
                item.status === 'ongoing' && 'bg-green-50 border-green-200'
            )}
            onClick={onClick}
        >
            {/* Status indicator */}
            <div className={cn('w-2 h-2 rounded-full shrink-0', statusDots[item.status])} />

            {/* Time */}
            <div className="text-xs text-muted-foreground w-20 shrink-0">
                {item.formatted_time}
            </div>

            {/* Class info */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.class_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                    {item.subject} {item.batch_name && `• ${item.batch_name}`}
                </p>
            </div>

            {/* Enrollment */}
            <div className="text-right shrink-0">
                <p className="text-sm font-medium tabular-nums">
                    {item.current_enrollment}/{item.max_students}
                </p>
                <p className="text-[10px] text-muted-foreground">students</p>
            </div>
        </div>
    );
}
