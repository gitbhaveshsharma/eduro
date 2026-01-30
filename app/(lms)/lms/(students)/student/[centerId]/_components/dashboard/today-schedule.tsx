'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, MapPin, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { FormattedStudentScheduleItem } from '@/lib/branch-system/types/branch-students.types';
import { getSubjectColor } from '@/lib/utils/subject-assets';
import type { SubjectId } from '@/components/dashboard/learning-dashboard/types';
import { mapSubjectToId } from '@/lib/branch-system/utils/branch-classes.utils';

interface TodayScheduleProps {
    schedule: FormattedStudentScheduleItem[];
    onClassClick?: (classId: string) => void;
}

export function TodaySchedule({ schedule, onClassClick }: TodayScheduleProps) {
    if (!schedule || schedule.length === 0) {
        return (
            <Card className="border-muted/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-brand-primary" />
                        Today's Schedule
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No classes scheduled for today</p>
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
                        Today's Schedule
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                        {schedule.length} class{schedule.length !== 1 ? 'es' : ''}
                    </Badge>
                </div>
                <CardDescription>Your classes for today</CardDescription>
            </CardHeader>
            <CardContent>
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
    item: FormattedStudentScheduleItem;
    onClick?: () => void;
}

function ScheduleCard({ item, onClick }: ScheduleCardProps) {
    const statusVariants = {
        upcoming: 'secondary',
        ongoing: 'success',
        completed: 'outline',
    };

    const statusLabels = {
        upcoming: 'Upcoming',
        ongoing: 'In Progress',
        completed: 'Completed',
    };

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
            <div className="flex items-center justify-between mb-3">
                <Badge variant={statusVariants[item.status] as any} className="text-[10px] font-medium">
                    {statusLabels[item.status]}
                </Badge>
                <span className="text-xs font-medium text-muted-foreground">
                    {item.formatted_time}
                </span>
            </div>

            <div className="space-y-2">
                <h4 className="font-semibold text-sm line-clamp-1">{item.class_name}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className={cn('text-[10px] font-medium px-2 py-0.5 border-0', subjectColor)}>
                        {item.subject}
                    </Badge>
                    {item.batch_name && (
                        <span className="text-[10px]">• {item.batch_name}</span>
                    )}
                </div>

                {item.teacher_name && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{item.teacher_name}</span>
                    </div>
                )}

                {item.room_number && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{item.room_number}</span>
                    </div>
                )}
            </div>
        </div>
    );
}