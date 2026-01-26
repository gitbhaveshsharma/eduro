/**
 * Student Classes List View Component
 * List view for student enrolled classes using attendance utilities
 * Uses Item component for consistent styling
 */

'use client';

import { useState, useMemo } from 'react';
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
    GraduationCap,
    AlertCircle
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
import {
    getAttendancePerformanceLevel,
    getAttendancePerformanceColor,
    needsAttendanceAttention,
} from '@/lib/branch-system/utils/student-attendance.utils';
import { cn } from '@/lib/utils';
import { getSubjectImageById, getSubjectColor } from '@/lib/utils/subject-assets';
import type { SubjectId } from '@/components/dashboard/learning-dashboard/types';

interface StudentClassesListViewProps {
    classes: UpcomingClassData[];
    onViewDetails: (classId: string) => void;
}

/**
 * Get enrollment status badge variant using CLASS_ENROLLMENT_STATUS_OPTIONS
 */
function getEnrollmentStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
    const statusConfig = CLASS_ENROLLMENT_STATUS_OPTIONS[status as ClassEnrollmentStatus];
    if (!statusConfig) return 'secondary';

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

function getEnrollmentStatusLabel(status: string): string {
    const statusConfig = CLASS_ENROLLMENT_STATUS_OPTIONS[status as ClassEnrollmentStatus];
    return statusConfig?.label || status;
}

/**
 * Gets attendance performance badge variant based on percentage
 */
function getAttendancePerformanceVariant(percentage: number): 'success' | 'default' | 'warning' | 'secondary' | 'destructive' {
    const color = getAttendancePerformanceColor(percentage);

    const colorMap: Record<string, 'success' | 'default' | 'warning' | 'secondary' | 'destructive'> = {
        'green': 'success',
        'blue': 'default',
        'orange': 'warning',
        'yellow': 'secondary',
        'red': 'destructive',
    };

    return colorMap[color] || 'secondary';
}

/**
 * Gets attendance color class based on performance color from attendance utils
 */
function getAttendanceColorClass(percentage: number): string {
    const color = getAttendancePerformanceColor(percentage);

    const classes: Record<string, string> = {
        'green': 'text-green-600 dark:text-green-500',
        'blue': 'text-blue-600 dark:text-blue-500',
        'orange': 'text-orange-600 dark:text-orange-500',
        'yellow': 'text-yellow-600 dark:text-yellow-500',
        'red': 'text-red-600 dark:text-red-500',
    };

    return classes[color] || 'text-muted-foreground';
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

    // Memoize attendance performance calculations using standard attendance utils
    const attendanceMetrics = useMemo(() => {
        const percentage = classItem.attendance_percentage || 0;
        const performanceLevel = getAttendancePerformanceLevel(percentage);
        const performanceVariant = getAttendancePerformanceVariant(percentage);
        const colorClass = getAttendanceColorClass(percentage);
        // needsAttendanceAttention checks: percentage < 60% (NEEDS_IMPROVEMENT) OR consecutiveAbsences >= 3
        // Example: 89% attendance = false (Good), 55% attendance = true (needs attention)
        const needsAttention = needsAttendanceAttention(percentage, 0);

        return {
            percentage,
            performanceLevel,
            performanceVariant,
            colorClass,
            needsAttention,
        };
    }, [classItem.attendance_percentage]);

    return (
        <Item
            variant="default"
            className={cn(
                'group/item hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5',
                'items-stretch gap-6 px-5 py-4',
                // Red border/background for low attendance (< 60% threshold)
                attendanceMetrics.needsAttention && 'border-l-4 border-destructive/30 bg-destructive/5'
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
                    {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                            <BookOpen className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                    )}
                </div>
            </ItemMedia>

            {/* Content */}
            <ItemContent>
                {/* ✅ FIXED: Single row layout - works on ALL screen sizes */}
                <ItemTitle className="flex flex-wrap items-center gap-2">
                    {/* Class name - always visible */}
                    <span className="font-semibold text-sm truncate transition-colors duration-200 group-hover/item:text-primary flex-1 min-w-0">
                        {displayName}
                    </span>

                    {/* Badges container - flex wrap, same row */}
                    <div className="flex items-center gap-1 flex-wrap -m-0.5">
                        {/* Enrollment Status - always visible */}
                        <Badge
                            variant={statusVariant}
                            className="text-xs font-medium h-5 px-1.5"
                        >
                            {statusLabel}
                        </Badge>

                        {/* Low Attendance Badge - Only shows if attendance < 60% (NEEDS_IMPROVEMENT threshold) */}
                        {attendanceMetrics.needsAttention && (
                            <Badge
                                variant="destructive"
                                className="text-xs font-medium gap-1 h-5 px-1.5"
                            >
                                <AlertCircle className="h-3 w-3" />
                                Low
                            </Badge>
                        )}

                        {/* Subject badge - hidden on very small screens */}
                        <Badge
                            variant="outline"
                            className={cn(
                                'text-xs font-medium px-2 py-0.5 border-0 h-5',
                                'max-sm:hidden' // Hidden only on extra small screens
                            )}
                        >
                            {classItem.subject}
                        </Badge>
                    </div>
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
                            <TrendingUp className={cn('h-3.5 w-3.5 flex-shrink-0')} />
                            <span className={cn('font-medium')}>
                                {attendanceMetrics.percentage.toFixed(1)}%
                            </span>
                            <span className="hidden sm:inline">attendance</span>
                        </span>
                        {classItem.current_grade && (
                            <span className="flex items-center gap-1.5">
                                <GraduationCap className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="font-medium">{classItem.current_grade}</span>
                                <span className="hidden sm:inline">grade</span>
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
