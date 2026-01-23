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
    TrendingUp,
    GraduationCap
} from 'lucide-react';
import type { UpcomingClassData } from '@/lib/branch-system/types/branch-classes.types';
import {
    formatTime,
    formatClassDays,
    getClassDisplayName,
    mapSubjectToId
} from '@/lib/branch-system/utils/branch-classes.utils';
import {
    CLASS_ENROLLMENT_STATUS_OPTIONS,
    type ClassEnrollmentStatus,
} from '@/lib/branch-system/types/class-enrollments.types';
import { cn } from '@/lib/utils';
import { getSubjectImageById, getSubjectColor } from '@/lib/utils/subject-assets';
import type { SubjectId } from '@/components/dashboard/learning-dashboard/types';

interface StudentClassesListViewProps {
    classes: UpcomingClassData[];
    onViewDetails: (classId: string) => void;
}

/**
 * Get enrollment status badge info using CLASS_ENROLLMENT_STATUS_OPTIONS
 */
function getEnrollmentStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
    const statusConfig = CLASS_ENROLLMENT_STATUS_OPTIONS[status as ClassEnrollmentStatus];
    if (!statusConfig) return 'secondary';

    // Map from status config color to Badge variant
    const colorMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
        'success': 'success',
        'warning': 'warning',
        'destructive': 'destructive',
        'secondary': 'secondary',
        'outline': 'outline',
        'default': 'default',
    };

    return colorMap[statusConfig.color] || 'secondary';
}

/**
 * Get enrollment status label using CLASS_ENROLLMENT_STATUS_OPTIONS
 */
function getEnrollmentStatusLabel(status: string): string {
    const statusConfig = CLASS_ENROLLMENT_STATUS_OPTIONS[status as ClassEnrollmentStatus];
    return statusConfig?.label || status;
}

/**
 * Gets attendance color class based on percentage
 */
function getAttendanceColorClass(percentage: number): string {
    if (percentage >= 90) return 'text-green-600 dark:text-green-500';
    if (percentage >= 75) return 'text-blue-600 dark:text-blue-500';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-500';
    if (percentage > 0) return 'text-red-600 dark:text-red-500';
    return 'text-muted-foreground';
}

function ClassListItem({ classItem, onViewDetails }: { classItem: UpcomingClassData; onViewDetails: (id: string) => void }) {
    const [imageLoaded, setImageLoaded] = useState(false);

    const subjectId = mapSubjectToId(classItem.subject) as SubjectId;
    const subjectColor = getSubjectColor(subjectId);
    const subjectImagePath = getSubjectImageById(subjectId);

    const displayName = classItem.class_name || getClassDisplayName(classItem as any) || classItem.subject;
    const schedule = formatClassDays(classItem.class_days);
    const timeRange = classItem.start_time && classItem.end_time
        ? `${formatTime(classItem.start_time)} - ${formatTime(classItem.end_time)}`
        : 'Time not set';

    const statusVariant = getEnrollmentStatusVariant(classItem.enrollment_status);
    const statusLabel = getEnrollmentStatusLabel(classItem.enrollment_status);
    const attendanceColorClass = getAttendanceColorClass(classItem.attendance_percentage);

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
                <ItemTitle className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate transition-colors duration-200 group-hover/item:text-primary">
                        {displayName}
                    </span>
                    <Badge
                        variant={statusVariant}
                        className="text-xs font-medium"
                    >
                        {statusLabel}
                    </Badge>
                    <Badge
                        variant="outline"
                        className={cn('text-xs font-medium px-2 py-0.5 border-0 hidden sm:inline-flex', subjectColor)}
                    >
                        {classItem.subject}
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
                            <TrendingUp className={cn('h-3.5 w-3.5 flex-shrink-0', attendanceColorClass)} />
                            <span className={cn('font-medium', attendanceColorClass)}>
                                {classItem.attendance_percentage.toFixed(1)}%
                            </span>
                            <span>attendance</span>
                        </span>
                        {classItem.current_grade && (
                            <span className="flex items-center gap-1.5">
                                <GraduationCap className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="font-medium">{classItem.current_grade}</span>
                                <span>grade</span>
                            </span>
                        )}
                    </div>
                </ItemDescription>
            </ItemContent>

            {/* Actions */}
            <ItemActions>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(classItem.class_id)}
                    className="gap-1.5 h-8 px-2 sm:px-3 hover:bg-primary/10"
                >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">View</span>
                </Button>
            </ItemActions>
        </Item>
    );
}

export function StudentClassesListView({ classes, onViewDetails }: StudentClassesListViewProps) {
    if (!classes || classes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Classes Found</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    You are not enrolled in any classes yet.
                </p>
            </div>
        );
    }

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
