'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { FormattedScheduleItem } from '@/lib/branch-system/types/teacher-dashboard.types';
import { getSubjectColor } from '@/lib/utils/subject-assets';
import type { SubjectId } from '@/components/dashboard/learning-dashboard/types';
import { mapSubjectToId } from '@/lib/branch-system/utils/branch-classes.utils';

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
                        <Clock className="h-5 w-5 text-brand-primary" />
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
                        <Clock className="h-5 w-5 text-brand-primary" />
                        Today&apos;s Schedule
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                        {schedule.length} class{schedule.length !== 1 ? 'es' : ''}
                    </Badge>
                </div>
                <CardDescription>Your classes for today</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Horizontal ScrollArea for mobile */}
                <ScrollArea className="md:hidden">
                    <div className="flex gap-3 pb-4">
                        {schedule.map((item) => (
                            <ScheduleCard
                                key={item.class_id}
                                item={item}
                                onClick={() => onClassClick?.(item.class_id)}
                            />
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>

                {/* Grid layout for desktop */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-3">
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
    // Map status to badge variants
    const statusVariants = {
        upcoming: 'secondary', // Using secondary variant (brand-secondary)
        ongoing: 'success',    // Using success variant (green #10B981)
        completed: 'outline',  // Using outline variant for completed
    };

    const statusLabels = {
        upcoming: 'Upcoming',
        ongoing: 'In Progress',
        completed: 'Completed',
    };

    // Get subject color for badge styling
    const subjectId = mapSubjectToId(item.subject) as SubjectId;
    const subjectColor = getSubjectColor(subjectId);

    return (
        <div
            className={cn(
                'min-w-[260px] sm:min-w-0 snap-start flex-shrink-0 md:flex-shrink',
                'p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-200',
                'cursor-pointer hover:border-brand-primary/30',
                item.status === 'ongoing' && 'ring-2 ring-success/20'
            )}
            onClick={onClick}
        >
            {/* Status badge */}
            <div className="flex items-center justify-between mb-3">
                <Badge
                    variant={statusVariants[item.status] as any}
                    className={cn(
                        'text-[10px] font-medium',
                        item.status === 'completed' && 'text-muted-foreground'
                    )}
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
                    {/* Updated: Subject badge with proper color from subject-assets */}
                    <Badge
                        variant="outline"
                        className={cn(
                            'text-[10px] font-medium px-2 py-0.5 border-0',
                            subjectColor
                        )}
                    >
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
                    <Badge variant="warning" className="text-[10px] mt-1">
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
    // Status colors for dots
    const statusDots = {
        upcoming: 'bg-brand-secondary',
        ongoing: 'bg-success',
        completed: 'bg-gray-400',
    };

    // Get subject color for badge styling
    const subjectId = mapSubjectToId(item.subject) as SubjectId;
    const subjectColor = getSubjectColor(subjectId);

    return (
        <div
            className={cn(
                'flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors',
                item.status === 'ongoing' && 'bg-success/5 border-success/20'
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
                <div className="flex items-center gap-2 mt-0.5">
                    {/* Updated: Subject badge with proper color from subject-assets */}
                    <Badge
                        variant="outline"
                        className={cn(
                            'text-[10px] font-medium px-1.5 py-0 h-4 border-0',
                            subjectColor
                        )}
                    >
                        {item.subject}
                    </Badge>
                    {item.batch_name && (
                        <span className="text-xs text-muted-foreground truncate">
                            {item.batch_name}
                        </span>
                    )}
                </div>
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