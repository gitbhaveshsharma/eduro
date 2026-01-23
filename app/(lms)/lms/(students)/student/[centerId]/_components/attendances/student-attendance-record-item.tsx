/**
 * Student Attendance Record Item Component
 * 
 * Individual attendance record row for student view
 * READ-ONLY - students can only view, not modify
 */

'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Item,
    ItemContent,
    ItemMedia,
    ItemTitle,
    ItemDescription,
    ItemActions,
} from '@/components/ui/item';
import {
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    CalendarDays,
    BookOpen,
    Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import {
    AttendanceStatus,
    formatAttendanceStatus,
    ATTENDANCE_STATUS_CONFIG,
} from '@/lib/branch-system/student-attendance';
import type { StudentAttendance } from '@/lib/branch-system/types/student-attendance.types';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

interface StudentAttendanceRecordItemProps {
    record: StudentAttendance;
    showClassName?: boolean;
    onViewDetails?: (recordId: string) => void;
}

/**
 * Get badge variant based on attendance status
 */
function getStatusBadgeVariant(status: AttendanceStatus): BadgeVariant {
    const variants: Record<AttendanceStatus, BadgeVariant> = {
        [AttendanceStatus.PRESENT]: 'success',
        [AttendanceStatus.ABSENT]: 'destructive',
        [AttendanceStatus.LATE]: 'warning',
        [AttendanceStatus.EXCUSED]: 'secondary',
        [AttendanceStatus.HOLIDAY]: 'outline',
    };

    return variants[status] || 'outline';
}

/**
 * Get status icon
 */
function getStatusIcon(status: AttendanceStatus) {
    const icons: Record<AttendanceStatus, React.ReactNode> = {
        [AttendanceStatus.PRESENT]: <CheckCircle2 className="h-5 w-5" />,
        [AttendanceStatus.ABSENT]: <XCircle className="h-5 w-5" />,
        [AttendanceStatus.LATE]: <Clock className="h-5 w-5" />,
        [AttendanceStatus.EXCUSED]: <FileText className="h-5 w-5" />,
        [AttendanceStatus.HOLIDAY]: <CalendarDays className="h-5 w-5" />,
    };

    return icons[status];
}

/**
 * Format date for display
 */
function formatDisplayDate(dateString: string): string {
    try {
        const date = parseISO(dateString);

        if (isToday(date)) {
            return 'Today';
        }
        if (isYesterday(date)) {
            return 'Yesterday';
        }

        return format(date, 'EEE, MMM d');
    } catch {
        return dateString;
    }
}

/**
 * Get status background color for the icon area
 */
function getStatusBackgroundColor(status: AttendanceStatus): string {
    const colors: Record<AttendanceStatus, string> = {
        [AttendanceStatus.PRESENT]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        [AttendanceStatus.ABSENT]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        [AttendanceStatus.LATE]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        [AttendanceStatus.EXCUSED]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        [AttendanceStatus.HOLIDAY]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };

    return colors[status] || 'bg-muted text-muted-foreground';
}

/**
 * Get item background color based on attendance status
 * Subtle backgrounds for warning states (absent, late)
 */
function getItemBackgroundColor(status: AttendanceStatus): string {
    const backgrounds: Record<AttendanceStatus, string> = {
        [AttendanceStatus.PRESENT]: '', // No background for present
        // Using error/destructive red for absent
        [AttendanceStatus.ABSENT]: 'bg-error/15 dark:bg-error/10 border-error/20 dark:border-error/30',
        // Using warning amber for late
        [AttendanceStatus.LATE]: 'bg-warning/15 dark:bg-warning/10 border-warning/20 dark:border-warning/30',
        // Using brand-secondary (sky blue) for excused
        [AttendanceStatus.EXCUSED]: 'bg-brand-secondary/15 dark:bg-brand-secondary/10 border-brand-secondary/20 dark:border-brand-secondary/30',
        [AttendanceStatus.HOLIDAY]: '', // No background for holiday

    };

    return backgrounds[status] || '';
}

export function StudentAttendanceRecordItem({
    record,
    showClassName = false,
    onViewDetails,
}: StudentAttendanceRecordItemProps) {
    const status = record.attendance_status;
    const badgeVariant = getStatusBadgeVariant(status);
    const statusBgColor = getStatusBackgroundColor(status);
    const itemBgColor = getItemBackgroundColor(status);

    // Format times
    const timeDisplay = useMemo(() => {
        const parts: string[] = [];

        if (record.check_in_time) {
            parts.push(`In: ${record.check_in_time}`);
        }
        if (record.check_out_time) {
            parts.push(`Out: ${record.check_out_time}`);
        }

        return parts.length > 0 ? parts.join(' • ') : 'No check-in time';
    }, [record.check_in_time, record.check_out_time]);

    return (
        <Item
            variant="default"
            className={cn(
                'group/item hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5',
                'items-stretch gap-6 px-5 py-4',
                itemBgColor, // Apply conditional background color
                itemBgColor && 'border' // Add border when background is applied
            )}
        >
            {/* Status Icon */}
            <ItemMedia variant="icon">
                <div className={cn(
                    'relative w-16 h-11 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center',
                    statusBgColor
                )}>
                    {getStatusIcon(status)}
                </div>
            </ItemMedia>

            {/* Content */}
            <ItemContent>
                <ItemTitle className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate transition-colors duration-200 group-hover/item:text-primary">
                        {formatDisplayDate(record.attendance_date)}
                    </span>
                    <Badge
                        variant={badgeVariant}
                        className="text-xs font-medium sm:inline-flex"
                    >
                        {formatAttendanceStatus(status, false)}
                    </Badge>
                </ItemTitle>

                <ItemDescription>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                            {timeDisplay}
                        </span>

                        {/* Late Minutes */}
                        {record.late_by_minutes > 0 && (
                            <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-medium">
                                • {record.late_by_minutes}m late
                            </span>
                        )}

                        {/* Class Name (optional) */}
                        {showClassName && record.class && (
                            <span className="flex items-center gap-1.5 truncate">
                                <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{record.class.class_name || record.class.subject}</span>
                            </span>
                        )}
                    </div>

                    {/* Teacher Remarks or Excuse Reason */}
                    {record.teacher_remarks && (
                        <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">
                            &quot;{record.teacher_remarks}&quot;
                        </p>
                    )}

                    {status === AttendanceStatus.EXCUSED && record.excuse_reason && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 line-clamp-1">
                            Reason: {record.excuse_reason}
                        </p>
                    )}
                </ItemDescription>
            </ItemContent>

            {/* Actions */}
            {onViewDetails && (
                <ItemActions>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(record.id)}
                        className="gap-1.5 h-8 px-2 sm:px-3"
                    >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">View</span>
                    </Button>
                </ItemActions>
            )}
        </Item>
    );
}
