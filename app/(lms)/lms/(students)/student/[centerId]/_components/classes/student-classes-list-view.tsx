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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
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
    AlertCircle,
    CalendarClock,
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
import {
    getSubjectImageById,
    getSubjectColor,
    getSubjectConfig
} from '@/lib/utils/subject-assets';
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
 * Maps attendance utils color strings to Badge variants
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
 * Maps to Tailwind color classes
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

/**
 * Format completion date to a readable string
 */
function formatCompletionDate(dateString?: string | null): string | null {
    if (!dateString) return null;

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch {
        return null;
    }
}

/**
 * Get days remaining until completion date
 */
function getDaysRemaining(dateString?: string | null): number | null {
    if (!dateString) return null;

    try {
        const completionDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        completionDate.setHours(0, 0, 0, 0);

        const diffTime = completionDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    } catch {
        return null;
    }
}

/**
 * Check if completion date is approaching (within 30 days)
 */
function isCompletionDateApproaching(dateString?: string | null): boolean {
    const daysRemaining = getDaysRemaining(dateString);
    return daysRemaining !== null && daysRemaining <= 30 && daysRemaining > 0;
}

/**
 * Check if completion date has passed
 */
function isCompletionDatePassed(dateString?: string | null): boolean {
    const daysRemaining = getDaysRemaining(dateString);
    return daysRemaining !== null && daysRemaining < 0;
}

/**
 * Get completion status message based on date status
 */
function getCompletionStatusMessage(dateString?: string | null): {
    message: string;
    description: string;
} {
    const daysRemaining = getDaysRemaining(dateString);

    if (!dateString || daysRemaining === null) {
        return {
            message: 'No completion date set',
            description: 'Contact your instructor for completion schedule'
        };
    }

    if (isCompletionDatePassed(dateString)) {
        const daysOverdue = Math.abs(daysRemaining);
        return {
            message: `Course completion overdue by ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'}`,
            description: 'This course was expected to be completed by now. Please check with your instructor.'
        };
    }

    if (isCompletionDateApproaching(dateString)) {
        return {
            message: `Course ends in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`,
            description: 'Complete your assignments and prepare for final assessments.'
        };
    }

    return {
        message: `Course ends in ${daysRemaining} days`,
        description: 'You are on track to complete the course as scheduled.'
    };
}

function ClassListItem({ classItem, onViewDetails }: { classItem: UpcomingClassData; onViewDetails: (id: string) => void }) {
    const [imageLoaded, setImageLoaded] = useState(false);

    const subjectId = mapSubjectToId(classItem.subject) as SubjectId;
    const subjectConfig = getSubjectConfig(subjectId);
    const subjectColor = getSubjectColor(subjectId);
    const subjectImagePath = getSubjectImageById(subjectId);

    const displayName = classItem.class_name || getClassDisplayName(classItem as any) || classItem.subject;
    const schedule = formatClassDays(classItem.class_days);
    const timeRange = classItem.start_time && classItem.end_time
        ? `${formatTime(classItem.start_time)} - ${formatTime(classItem.end_time)}`
        : 'Time not set';

    const statusVariant = getEnrollmentStatusVariant(classItem.enrollment_status);
    const statusLabel = getEnrollmentStatusLabel(classItem.enrollment_status);

    // Format completion date
    const formattedCompletionDate = formatCompletionDate(classItem.expected_completion_date);
    const isApproaching = isCompletionDateApproaching(classItem.expected_completion_date);
    const isPassed = isCompletionDatePassed(classItem.expected_completion_date);
    const completionStatus = getCompletionStatusMessage(classItem.expected_completion_date);
    const daysRemaining = getDaysRemaining(classItem.expected_completion_date);

    // Memoize attendance performance calculations using standard attendance utils
    const attendanceMetrics = useMemo(() => {
        const percentage = classItem.attendance_percentage || 0;
        const performanceLevel = getAttendancePerformanceLevel(percentage);
        const performanceVariant = getAttendancePerformanceVariant(percentage);
        const colorClass = getAttendanceColorClass(percentage);
        // needsAttendanceAttention checks: percentage < 60% (NEEDS_IMPROVEMENT) OR consecutiveAbsences >= 3
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
                        alt={subjectConfig.name}
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
                        <div className={cn(
                            "absolute inset-0 flex items-center justify-center",
                            subjectColor
                        )}>
                            <div className="text-2xl">
                                {subjectConfig.icon}
                            </div>
                        </div>
                    )}
                </div>
            </ItemMedia>

            {/* Content */}
            <ItemContent>
                {/* Single row layout - works on ALL screen sizes */}
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

                        {/* Completion Date Badge with Tooltip */}
                        {formattedCompletionDate && (
                            <TooltipProvider>
                                <Tooltip delayDuration={300}>
                                    <TooltipTrigger asChild>
                                        <Badge
                                            variant={isPassed ? "destructive" : isApproaching ? "warning" : "secondary"}
                                            className="text-xs font-medium gap-1 cursor-help h-5 px-1.5"
                                        >
                                            <CalendarClock className="h-3 w-3" />
                                            <span className="hidden sm:inline">{formattedCompletionDate}</span>
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs p-4" side="bottom" align="start">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                                <h4 className="font-semibold text-sm">
                                                    Course Completion
                                                </h4>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">
                                                    {completionStatus.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {completionStatus.description}
                                                </p>
                                                {daysRemaining !== null && (
                                                    <div className="pt-2 mt-2 border-t border-border">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-muted-foreground">Expected completion:</span>
                                                            <span className="font-medium">{formattedCompletionDate}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs mt-1">
                                                            <span className="text-muted-foreground">
                                                                {daysRemaining >= 0 ? 'Days remaining:' : 'Days overdue:'}
                                                            </span>
                                                            <span className={cn(
                                                                "font-medium",
                                                                isPassed ? "text-destructive" :
                                                                    isApproaching ? "text-warning" :
                                                                        "text-success"
                                                            )}>
                                                                {Math.abs(daysRemaining)} {Math.abs(daysRemaining) === 1 ? 'day' : 'days'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}

                        {/* Subject badge - hidden on very small screens */}
                        <Badge
                            variant="outline"
                            className={cn(
                                'text-xs font-medium px-2 py-0.5 border-0 h-5',
                                subjectColor,
                                'max-sm:hidden' // Hidden only on extra small screens
                            )}
                        >
                            {subjectConfig.name}
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
                            <TrendingUp className={cn('h-3.5 w-3.5 flex-shrink-0', attendanceMetrics.colorClass)} />
                            <span className={cn('font-medium', attendanceMetrics.colorClass)}>
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