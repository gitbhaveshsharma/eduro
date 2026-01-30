/**
 * Student Attendance Record List Component
 * 
 * List view of student's attendance records
 * READ-ONLY - students can only view their records
 */

'use client';

import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarDays, Calendar, AlertCircle } from 'lucide-react';
import { StudentAttendanceRecordItem } from './student-attendance-record-item';
import { AttendanceStatus } from '@/lib/branch-system/student-attendance';
import type { StudentAttendance } from '@/lib/branch-system/types/student-attendance.types';
import { format, parseISO, isThisMonth, isThisWeek } from 'date-fns';

interface StudentAttendanceRecordListProps {
    records: StudentAttendance[];
    isLoading?: boolean;
    error?: string | null;
    showClassName?: boolean;
    className?: string;
}

/**
 * Group records by month
 */
function groupRecordsByMonth(records: StudentAttendance[]): Map<string, StudentAttendance[]> {
    const groups = new Map<string, StudentAttendance[]>();

    records.forEach((record) => {
        const date = parseISO(record.attendance_date);
        const monthKey = format(date, 'MMMM yyyy');

        if (!groups.has(monthKey)) {
            groups.set(monthKey, []);
        }
        groups.get(monthKey)!.push(record);
    });

    return groups;
}

/**
 * Get section label for a month
 */
function getMonthSectionLabel(monthKey: string): { label: string; badge?: string } {
    const [monthName, year] = monthKey.split(' ');
    const firstDayOfMonth = parseISO(`${year}-${getMonthNumber(monthName)}-01`);

    if (isThisMonth(firstDayOfMonth)) {
        return { label: 'This Month', badge: monthKey };
    }

    return { label: monthKey };
}

/**
 * Get month number from name
 */
function getMonthNumber(monthName: string): string {
    const months: Record<string, string> = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04',
        'May': '05', 'June': '06', 'July': '07', 'August': '08',
        'September': '09', 'October': '10', 'November': '11', 'December': '12',
    };
    return months[monthName] || '01';
}

export function StudentAttendanceRecordList({
    records,
    isLoading = false,
    error = null,
    showClassName = false,
    className,
}: StudentAttendanceRecordListProps) {
    // Group records by month
    const groupedRecords = useMemo(() => {
        if (!records.length) return new Map<string, StudentAttendance[]>();

        // Sort records by date (newest first)
        const sortedRecords = [...records].sort((a, b) =>
            new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime()
        );

        return groupRecordsByMonth(sortedRecords);
    }, [records]);

    // Calculate stats
    const stats = useMemo(() => {
        const total = records.length;
        const present = records.filter(r => r.attendance_status === AttendanceStatus.PRESENT).length;
        const absent = records.filter(r => r.attendance_status === AttendanceStatus.ABSENT).length;
        const late = records.filter(r => r.attendance_status === AttendanceStatus.LATE).length;
        const excused = records.filter(r => r.attendance_status === AttendanceStatus.EXCUSED).length;

        return { total, present, absent, late, excused };
    }, [records]);

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-card rounded-lg border">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                ))}
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    // Empty state
    if (records.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                    <CalendarDays className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Attendance Records</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                    Your attendance records will appear here once your teacher marks attendance.
                </p>
            </div>
        );
    }

    return (
        <div className={className}>
            {/* Records List Grouped by Month */}
            <div className="space-y-6">
                {Array.from(groupedRecords.entries()).map(([monthKey, monthRecords]) => {
                    const sectionInfo = getMonthSectionLabel(monthKey);

                    return (
                        <div key={monthKey} className="space-y-2">
                            {/* Month Header */}
                            <div className="sticky top-0 z-10 flex items-center gap-2 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 rounded-lg">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">
                                    {sectionInfo.label}
                                </span>
                                {sectionInfo.badge && sectionInfo.label !== sectionInfo.badge && (
                                    <span className="text-xs text-muted-foreground/70">
                                        ({sectionInfo.badge})
                                    </span>
                                )}
                                <span className="text-xs text-muted-foreground/70 ml-auto">
                                    {monthRecords.length} records
                                </span>
                            </div>

                            {/* Month Records */}
                            <div className="space-y-1 divide-y  overflow-hidden">
                                {monthRecords.map((record) => (
                                    <StudentAttendanceRecordItem
                                        key={record.id}
                                        record={record}
                                        showClassName={showClassName}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
