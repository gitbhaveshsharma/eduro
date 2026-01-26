'use client';

import { useMemo, useEffect } from 'react'; // Add useEffect import
import { Skeleton } from '@/components/ui/skeleton';
import { User } from 'lucide-react';
import { AttendanceStudentItem } from './attendance-student-item';
import { QuickAttendanceActions } from './quick-attendance-actions';
import { AttendanceStatus } from '@/lib/branch-system/student-attendance';
import type { DailyAttendanceRecord } from '@/lib/branch-system/types/student-attendance.types';
import { showErrorToast } from '@/lib/toast'; // Import your toast function

interface AttendanceStudentListProps {
    records: DailyAttendanceRecord[];
    onMarkAttendance: (studentId: string, status: AttendanceStatus) => void;
    onMarkAllPresent: () => void;
    onMarkAllAbsent: () => void;
    onBulkMark: () => void;
    onEditAttendance: (record: DailyAttendanceRecord) => void;
    onDeleteAttendance: (record: DailyAttendanceRecord) => void;
    isLoading?: boolean;
    isSubmitting?: boolean;
    error?: string | null;
    className?: string;
    centerId: string;
    classId: string;
}

export function AttendanceStudentList({
    records,
    onMarkAttendance,
    onMarkAllPresent,
    onMarkAllAbsent,
    onBulkMark,
    onEditAttendance,
    onDeleteAttendance,
    isLoading = false,
    isSubmitting = false,
    error = null,
    className,
    centerId,
    classId,
}: AttendanceStudentListProps) {
    // Use useEffect to handle error toasts
    useEffect(() => {
        if (error) {
            showErrorToast(error);
        }
    }, [error]); // This will only trigger when error changes

    // Calculate stats
    const stats = useMemo(() => {
        const total = records.length;
        const marked = records.filter(r => r.is_marked).length;
        const unmarked = total - marked;
        const present = records.filter(r => r.attendance_status === AttendanceStatus.PRESENT).length;
        const absent = records.filter(r => r.attendance_status === AttendanceStatus.ABSENT).length;
        const late = records.filter(r => r.attendance_status === AttendanceStatus.LATE).length;

        return { total, marked, unmarked, present, absent, late };
    }, [records]);

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-card rounded-lg border">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="flex gap-1">
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-8 w-8 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Empty state
    if (records.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                    <User className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                    No students are enrolled in this class yet.
                </p>
            </div>
        );
    }

    return (
        <div className={className}>
            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                    {stats.unmarked > 0 ? (
                        <span>{stats.unmarked} students need attendance</span>
                    ) : (
                        <span className="text-green-600">All attendance marked ✓</span>
                    )}
                </div>
                <QuickAttendanceActions
                    onMarkAllPresent={onMarkAllPresent}
                    onMarkAllAbsent={onMarkAllAbsent}
                    onBulkMark={onBulkMark}
                    disabled={isSubmitting}
                    unmarkedCount={stats.unmarked}
                />
            </div>

            {/* Student List */}
            <div className="space-y-1 divide-y">
                {records.map((record, index) => (
                    <AttendanceStudentItem
                        key={record.student_id}
                        record={record}
                        onMarkAttendance={onMarkAttendance}
                        onEditAttendance={onEditAttendance}
                        onDeleteAttendance={onDeleteAttendance}
                        isSubmitting={isSubmitting}
                        centerId={centerId}
                        classId={classId}
                    />
                ))}
            </div>
        </div>
    );
}