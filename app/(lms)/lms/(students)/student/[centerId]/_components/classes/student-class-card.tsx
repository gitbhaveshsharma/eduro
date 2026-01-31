/**
 * Student Class Card Component
 * Beautiful cards showing student's enrolled classes
 * READ-ONLY for students
 */

'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
    Clock,
    Calendar,
    Users,
    BookOpen,
    Eye,
    TrendingUp,
    GraduationCap,
    AlertCircle,
    CalendarClock,
    Info
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
import {
    getSubjectImageById,
    getSubjectColor,
    getSubjectConfig
} from '@/lib/utils/subject-assets';
import type { SubjectId } from '@/components/dashboard/learning-dashboard/types';

interface StudentClassCardProps {
    classData: UpcomingClassData;
    onViewDetails?: (classId: string) => void;
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

/**
 * Get enrollment status label using CLASS_ENROLLMENT_STATUS_OPTIONS
 */
function getEnrollmentStatusLabel(status: string): string {
    const statusConfig = CLASS_ENROLLMENT_STATUS_OPTIONS[status as ClassEnrollmentStatus];
    return statusConfig?.label || status;
}

/**
 * Gets attendance performance badge variant based on percentage
 * Uses attendance thresholds from student-attendance.utils
 */
function getAttendancePerformanceVariant(percentage: number): 'success' | 'default' | 'warning' | 'secondary' | 'destructive' {
    const color = getAttendancePerformanceColor(percentage);

    // Map attendance utils color strings to Badge variants
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
 * Gets attendance color class based on performance color
 * Maps to Tailwind color classes
 */
function getAttendanceColorClass(percentage: number): string {
    const color = getAttendancePerformanceColor(percentage);

    // Map attendance utils color strings to Tailwind classes
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

export function StudentClassCard({ classData, onViewDetails }: StudentClassCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);

    const subjectId = mapSubjectToId(classData.subject) as SubjectId;
    const subjectConfig = getSubjectConfig(subjectId);
    const subjectImagePath = getSubjectImageById(subjectId);
    const subjectColor = getSubjectColor(subjectId);

    const displayName = classData.class_name || getClassDisplayName(classData as any) || classData.subject;
    const schedule = formatClassDays(classData.class_days);
    const timeRange = classData.start_time && classData.end_time
        ? `${formatTime(classData.start_time)} - ${formatTime(classData.end_time)}`
        : 'Time not set';

    const statusVariant = getEnrollmentStatusVariant(classData.enrollment_status);
    const statusLabel = getEnrollmentStatusLabel(classData.enrollment_status);

    // Format completion date
    const formattedCompletionDate = formatCompletionDate(classData.expected_completion_date);
    const isApproaching = isCompletionDateApproaching(classData.expected_completion_date);
    const isPassed = isCompletionDatePassed(classData.expected_completion_date);
    const completionStatus = getCompletionStatusMessage(classData.expected_completion_date);
    const daysRemaining = getDaysRemaining(classData.expected_completion_date);

    // Memoize attendance performance calculations
    const attendanceMetrics = useMemo(() => {
        const percentage = classData.attendance_percentage || 0;
        const performanceLevel = getAttendancePerformanceLevel(percentage);
        const performanceColor = getAttendancePerformanceColor(percentage);
        const performanceVariant = getAttendancePerformanceVariant(percentage);
        const colorClass = getAttendanceColorClass(percentage);
        // needsAttendanceAttention checks: percentage < 60% OR consecutiveAbsences >= 3
        const needsAttention = needsAttendanceAttention(percentage, 0);

        return {
            percentage,
            performanceLevel,
            performanceColor,
            performanceVariant,
            colorClass,
            needsAttention,
        };
    }, [classData.attendance_percentage]);

    const handleViewDetails = () => {
        if (onViewDetails) {
            onViewDetails(classData.class_id);
        }
    };

    return (
        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-card rounded-2xl p-0 gap-0 group">
            {/* Header with Status Badge */}
            <div className="relative p-2">
                <div className="absolute top-5 left-5 z-10 flex gap-2">
                    <Badge
                        variant={statusVariant}
                        className="text-xs font-medium"
                    >
                        {statusLabel}
                    </Badge>
                    {/* Only shows if attendance < 60% (NEEDS_IMPROVEMENT threshold) */}
                    {attendanceMetrics.needsAttention && (
                        <Badge
                            variant="destructive"
                            className="text-xs font-medium gap-1"
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
                                        className="text-xs font-medium gap-1 cursor-help"
                                    >
                                        <CalendarClock className="h-3 w-3" />
                                        {formattedCompletionDate}
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
                                                    {daysRemaining !== null && (
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
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>

                {/* Subject Image with Gradient Background */}
                <div className="h-32 w-full relative overflow-hidden rounded-2xl">
                    <Image
                        src={subjectImagePath}
                        alt={`${subjectConfig.name} class`}
                        fill
                        className={cn(
                            "object-cover transition-opacity duration-300",
                            imageLoaded ? "opacity-100" : "opacity-0"
                        )}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={false}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageLoaded(true)}
                    />

                    {/* Gradient background - visible while image loads */}
                    {!imageLoaded && (
                        <div className={cn(
                            'absolute inset-0 animate-pulse',
                            subjectColor
                        )} />
                    )}

                    {/* Decorative overlay with subject icon */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                        <div className="text-8xl">
                            {subjectConfig.icon}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Subject Badge & Grade/Batch in same line */}
                <div className="flex items-center gap-2">
                    <Badge
                        variant="outline"
                        className={cn('text-xs font-medium px-2 py-0.5 border-0', subjectColor)}
                    >
                        {subjectConfig.name}
                    </Badge>
                    {/* Grade & Batch */}
                    <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{classData.grade_level}</span>
                        {classData.batch_name && (
                            <>
                                <span className="mx-1">•</span>
                                <span>{classData.batch_name}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Title with hover effect */}
                <h3 className="font-semibold text-foreground text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-200">
                    {displayName}
                </h3>

                {/* Schedule Info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{schedule || 'No schedule'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{timeRange}</span>
                    </div>
                </div>

                {/* Attendance Performance Section */}
                <div className="space-y-2 pt-2 border-t border-border">
                    {/* Attendance Stats */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className={cn('h-4 w-4', attendanceMetrics.colorClass)} />
                            <span className={cn('text-sm font-medium', attendanceMetrics.colorClass)}>
                                {attendanceMetrics.percentage.toFixed(1)}%
                            </span>
                            <span className="text-xs text-muted-foreground">attendance</span>
                        </div>
                        <Badge
                            variant={attendanceMetrics.performanceVariant}
                            className="text-xs"
                        >
                            {attendanceMetrics.performanceLevel}
                        </Badge>
                    </div>

                    {/* Attendance Progress Bar */}
                    <Progress
                        value={attendanceMetrics.percentage}
                        className="h-2"
                    />

                    {/* Current Grade */}
                    {classData.current_grade && (
                        <div className="flex items-center gap-2 text-sm">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{classData.current_grade}</span>
                            <span className="text-xs text-muted-foreground">current grade</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                    {/* Description preview */}
                    <div className="text-xs text-muted-foreground truncate max-w-[60%]">
                        {classData.description || 'No description'}
                    </div>

                    {/* View Details Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewDetails}
                        className="rounded-full px-4 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                    </Button>
                </div>
            </div>
        </Card>
    );
}