/**
 * Student Attendance Record Item Component
 * 
 * Individual attendance record row for student view
 * READ-ONLY - students can only view, not modify
 */

'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
    Item,
    ItemContent,
    ItemMedia,
    ItemTitle,
    ItemDescription,
} from '@/components/ui/item';
import {
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    CalendarDays,
    BookOpen,
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
        [AttendanceStatus.PRESENT]: <CheckCircle2 className="h-3.5 w-3.5" />,
        [AttendanceStatus.ABSENT]: <XCircle className="h-3.5 w-3.5" />,
        [AttendanceStatus.LATE]: <Clock className="h-3.5 w-3.5" />,
        [AttendanceStatus.EXCUSED]: <FileText className="h-3.5 w-3.5" />,
        [AttendanceStatus.HOLIDAY]: <FileText className="h-3.5 w-3.5" />,
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

export function StudentAttendanceRecordItem({
    record,
    showClassName = false,
}: StudentAttendanceRecordItemProps) {
    const status = record.attendance_status;
    const statusConfig = ATTENDANCE_STATUS_CONFIG[status];
    const badgeVariant = getStatusBadgeVariant(status);
    const statusBgColor = getStatusBackgroundColor(status);

    // Format times
    const timeDisplay = useMemo(() => {
        const parts: string[] = [];

        if (record.check_in_time) {
            parts.push(`In: ${record.check_in_time}`);
        }
        if (record.check_out_time) {
            parts.push(`Out: ${record.check_out_time}`);
        }

        return parts.length > 0 ? parts.join(' • ') : null;
    }, [record.check_in_time, record.check_out_time]);

    return (
        <Item
            variant="default"
            className={cn(
                'group/item hover:bg-secondary/15 hover:text-primary transition-all duration-200',
                'items-center gap-4 px-4 py-3'
            )}
        >
            {/* Status Icon */}
            <ItemMedia variant="icon">
                <div className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full',
                    statusBgColor
                )}>
                    {getStatusIcon(status)}
                </div>
            </ItemMedia>

            {/* Main Content */}
            <ItemContent className="min-w-0 flex-1">
                <ItemTitle className="flex items-center gap-2 font-medium text-sm">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formatDisplayDate(record.attendance_date)}</span>
                </ItemTitle>
                <ItemDescription className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Status Badge */}
                    <Badge variant={badgeVariant} className="gap-1 text-xs h-5">
                        {getStatusIcon(status)}
                        <span>{formatAttendanceStatus(status, false)}</span>
                    </Badge>

                    {/* Time Info */}
                    {timeDisplay && (
                        <span className="text-muted-foreground">
                            • {timeDisplay}
                        </span>
                    )}

                    {/* Late Minutes */}
                    {record.late_by_minutes > 0 && (
                        <span className="text-orange-600">
                            • {record.late_by_minutes}m late
                        </span>
                    )}

                    {/* Class Name (optional) */}
                    {showClassName && record.class && (
                        <span className="text-muted-foreground flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {record.class.class_name || record.class.subject}
                        </span>
                    )}
                </ItemDescription>

                {/* Teacher Remarks (if any) */}
                {record.teacher_remarks && (
                    <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">
                        &quot;{record.teacher_remarks}&quot;
                    </p>
                )}

                {/* Excuse Reason (if excused) */}
                {status === AttendanceStatus.EXCUSED && record.excuse_reason && (
                    <p className="text-xs text-blue-600 mt-1">
                        Reason: {record.excuse_reason}
                    </p>
                )}
            </ItemContent>

            {/* Right Side - Full Date */}
            <div className="text-right text-xs text-muted-foreground hidden sm:block">
                {format(parseISO(record.attendance_date), 'yyyy')}
            </div>
        </Item>
    );
}
