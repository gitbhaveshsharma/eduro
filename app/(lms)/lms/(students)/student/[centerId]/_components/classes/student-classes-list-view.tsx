/**
 * Student Classes List View Component
 * 
 * List view for student enrolled classes
 * Uses Item component for consistent styling
 */

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
    ItemSeparator,
} from '@/components/ui/item';
import {
    Calendar,
    Clock,
    Eye,
    BookOpen,
    TrendingUp
} from 'lucide-react';
import type { UpcomingClassData } from '@/lib/branch-system/types/branch-classes.types';
import {
    formatTime,
    formatClassDays,
} from '@/lib/branch-system/utils/branch-classes.utils';
import { cn } from '@/lib/utils';
import { getSubjectImageById, getSubjectColor } from '@/lib/utils/subject-assets';
import type { SubjectId } from '@/components/dashboard/learning-dashboard/types';

interface StudentClassesListViewProps {
    classes: UpcomingClassData[];
    onViewDetails: (classId: string) => void;
}

/**
 * Map subject name to SubjectId for assets lookup
 */
function mapSubjectToId(subject: string): string {
    const subjectMap: Record<string, string> = {
        'physics': 'physics',
        'chemistry': 'chemistry',
        'mathematics': 'mathematics',
        'math': 'mathematics',
        'maths': 'mathematics',
        'biology': 'biology',
        'english': 'english',
        'hindi': 'hindi',
        'science': 'science',
        'social studies': 'social-studies',
        'history': 'history',
        'geography': 'geography',
        'economics': 'economics',
        'computer science': 'computer-science',
        'accountancy': 'accountancy',
        'business studies': 'business-studies',
    };
    return subjectMap[subject.toLowerCase()] || 'default';
}

/**
 * Get enrollment status badge info
 */
function getEnrollmentStatusInfo(status: string): {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
        'ENROLLED': { label: 'Enrolled', variant: 'default' },
        'PENDING': { label: 'Pending', variant: 'secondary' },
        'WITHDRAWN': { label: 'Withdrawn', variant: 'destructive' },
        'COMPLETED': { label: 'Completed', variant: 'outline' },
    };
    return statusMap[status] || { label: status, variant: 'secondary' };
}

function ClassListItem({ classItem, onViewDetails }: { classItem: UpcomingClassData; onViewDetails: (id: string) => void }) {
    const [imageLoaded, setImageLoaded] = useState(false);

    const displayName = classItem.class_name || classItem.subject;
    const schedule = formatClassDays(classItem.class_days);
    const timeRange = classItem.start_time && classItem.end_time
        ? `${formatTime(classItem.start_time)} - ${formatTime(classItem.end_time)}`
        : 'Time not set';
    const statusInfo = getEnrollmentStatusInfo(classItem.enrollment_status);
    const subjectId = mapSubjectToId(classItem.subject);
    const subjectColor = getSubjectColor(subjectId as SubjectId);
    const subjectImagePath = getSubjectImageById(subjectId as SubjectId);

    return (
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
                        variant={statusInfo.variant}
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
                        <span className="flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
                            {classItem.attendance_percentage}% attendance
                        </span>
                    </div>
                </ItemDescription>
            </ItemContent>

            {/* Actions */}
            <ItemActions>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(classItem.class_id)}
                    className="gap-1.5 h-8 px-2 sm:px-3"
                >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">View</span>
                </Button>
            </ItemActions>
        </Item>
    );
}

export function StudentClassesListView({ classes, onViewDetails }: StudentClassesListViewProps) {
    return (
        <div className="space-y-2">
            {classes.map((classItem, index) => (
                <div key={classItem.enrollment_id}>
                    <ClassListItem classItem={classItem} onViewDetails={onViewDetails} />
                    {index < classes.length - 1 && <ItemSeparator />}
                </div>
            ))}
        </div>
    );
}
