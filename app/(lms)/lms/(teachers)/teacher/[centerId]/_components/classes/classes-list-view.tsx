'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemMedia,
    ItemTitle,
    ItemDescription,
    ItemGroup,
    ItemSeparator,
} from '@/components/ui/item';
import {
    Calendar,
    Clock,
    Eye,
    BookOpen
} from 'lucide-react';
import type { BranchClass } from '@/lib/branch-system/types/branch-classes.types';
import {
    formatTime,
    formatClassDays,
    formatClassStatus,
    getClassDisplayName,
    getSubjectColor,
    mapSubjectToId,
} from '@/lib/branch-system/utils/branch-classes.utils';
import { cn } from '@/lib/utils';
import { getSubjectImageById } from '@/lib/utils/subject-assets';

interface ClassesListViewProps {
    classes: BranchClass[];
    onViewDetails: (classId: string) => void;
}

export function ClassesListView({ classes, onViewDetails }: ClassesListViewProps) {
    return (
        <div className="space-y-2">
            {classes.map((classItem, index) => {
                const [imageLoaded, setImageLoaded] = useState(false);

                const displayName = getClassDisplayName(classItem);
                const schedule = formatClassDays(classItem.class_days);
                const timeRange = classItem.start_time && classItem.end_time
                    ? `${formatTime(classItem.start_time)} - ${formatTime(classItem.end_time)}`
                    : 'Time not set';
                const statusInfo = formatClassStatus(classItem.status);
                const subjectId = mapSubjectToId(classItem.subject);
                const subjectColor = getSubjectColor(subjectId);
                const subjectImagePath = getSubjectImageById(subjectId as any);

                return (
                    <div key={classItem.id}>
                        <Item
                            variant="default"
                            className={cn(
                                'group/item hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5',
                                'items-stretch gap-6 px-5 py-4'
                            )}
                        >
                            {/* Subject Image */}
                            <ItemMedia variant="icon">
                                <div className="relative w-16 h-11 rounded-lg overflow-hidden flex-shrink-0">
                                    <Image
                                        src={subjectImagePath}
                                        alt={classItem.subject}
                                        fill
                                        className={cn(
                                            "object-cover transition-opacity duration-300",
                                            imageLoaded ? "opacity-100" : "opacity-0"
                                        )}
                                        sizes="64px"
                                        onLoad={() => setImageLoaded(true)}
                                        onError={() => setImageLoaded(true)}
                                    />

                                    {/* Fallback Icon */}
                                    {!imageLoaded && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                            <BookOpen className="h-5 w-5 text-muted-foreground/50" />
                                        </div>
                                    )}
                                </div>
                            </ItemMedia>

                            {/* Content */}
                            <ItemContent>
                                <ItemTitle className="flex items-center gap-2">
                                    <span className="font-semibold text-sm truncate transition-colors duration-200 group-hover/item:text-primary">
                                        {displayName}
                                    </span>
                                    <Badge
                                        variant={
                                            statusInfo.color === 'green' ? 'default' :
                                                statusInfo.color === 'yellow' ? 'secondary' :
                                                    'destructive'
                                        }
                                        className="text-xs font-medium hidden sm:inline-flex"
                                    >
                                        {statusInfo.label}
                                    </Badge>
                                </ItemTitle>
                                <ItemDescription>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1.5 truncate">
                                            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span className="truncate">{schedule || 'No schedule'}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                                            {timeRange}
                                        </span>
                                    </div>
                                </ItemDescription>
                            </ItemContent>

                            {/* Actions */}
                            <ItemActions>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onViewDetails(classItem.id)}
                                    className="gap-1.5 h-8 px-2 sm:px-3"
                                >
                                    <Eye className="h-4 w-4" />
                                    <span className="hidden sm:inline">View</span>
                                </Button>
                            </ItemActions>
                        </Item>

                        {index < classes.length - 1 && <ItemSeparator />}
                    </div>
                );
            })}
        </div>
    );
}
