/**
 * Student Attendance Summary Modal (Minimal Professional Style)
 * 
 * Clean, minimal design following ViewClassesDialog patterns
 * Uses table layout and shadcn/ui components consistently
 */

'use client';

import { useEffect, useState, useMemo, memo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
    Alert,
    AlertTitle,
    AlertDescription,
} from '@/components/ui/alert';
import {
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    TrendingUp,
    Award,
    GraduationCap,
    Download,
} from 'lucide-react';
import {
    useFetchStudentSummary,
    useAttendanceSummary,
    useAttendanceLoading,
} from '@/lib/branch-system/student-attendance';
import type { StudentAttendanceSummary } from '@/lib/branch-system/types/student-attendance.types';
import {
    getAttendancePerformanceLevel,
    getAttendancePerformanceColor,
    ATTENDANCE_THRESHOLDS,
    needsAttendanceAttention,
} from '@/lib/branch-system/utils/student-attendance.utils';

interface StudentSummaryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    studentName: string;
    studentAvatar?: string | null;
    classId?: string;
}

/**
 * Performance Badge Component - Memoized
 */
const PerformanceBadge = memo(function PerformanceBadge({
    percentage,
}: {
    percentage: number;
}) {
    const config = useMemo(() => {
        const level = getAttendancePerformanceLevel(percentage);
        const color = getAttendancePerformanceColor(percentage);
        const variantMap: Record<string, any> = {
            green: 'success',
            blue: 'default',
            orange: 'warning',
            yellow: 'secondary',
            red: 'destructive',
        };
        return {
            variant: variantMap[color] || 'secondary',
            level,
        };
    }, [percentage]);

    return (
        <Badge variant={config.variant} className="text-xs">
            {config.level}
        </Badge>
    );
});

/**
 * Attendance Metric Display - Memoized
 */
const AttendanceMetric = memo(function AttendanceMetric({
    label,
    value,
    percentage,
    color,
}: {
    label: string;
    value: number;
    percentage?: number;
    color?: string;
}) {
    const displayValue = useMemo(() => {
        if (percentage !== undefined) return `${percentage.toFixed(1)}%`;
        return value.toString();
    }, [value, percentage]);

    const colorClass = useMemo(() => {
        const classes: Record<string, string> = {
            green: 'text-green-600 dark:text-green-500',
            blue: 'text-blue-600 dark:text-blue-500',
            orange: 'text-orange-600 dark:text-orange-500',
            red: 'text-red-600 dark:text-red-500',
            default: 'text-muted-foreground',
        };
        return classes[color || 'default'];
    }, [color]);

    return (
        <div className="space-y-1">
            <span className={`font-medium ${colorClass}`}>{displayValue}</span>
            <span className="text-xs text-muted-foreground block">{label}</span>
        </div>
    );
});

/**
 * Loading Skeleton - Memoized
 */
const SummarySkeleton = memo(function SummarySkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                </div>
                <Skeleton className="h-8 w-24" />
            </div>
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

/**
 * Empty State Component - Memoized
 */
const EmptyState = memo(function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="rounded-full bg-muted p-6">
                <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-medium">No Attendance Data</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    No attendance records found for this student.
                </p>
            </div>
        </div>
    );
});

export function StudentSummaryModal({
    open,
    onOpenChange,
    studentId,
    studentName,
    studentAvatar,
    classId,
}: StudentSummaryModalProps) {
    const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
    const fetchStudentSummary = useFetchStudentSummary();
    const summary = useAttendanceSummary();
    const loading = useAttendanceLoading();

    // Fetch summary when modal opens or student changes
    useEffect(() => {
        if (open && studentId && studentId !== currentStudentId) {
            setCurrentStudentId(studentId);
            fetchStudentSummary(studentId, classId, undefined, undefined, true);
        }
    }, [open, studentId, classId, currentStudentId, fetchStudentSummary]);

    // Clear current student when modal closes
    useEffect(() => {
        if (!open) {
            setCurrentStudentId(null);
        }
    }, [open]);

    // Memoized derived values
    const performance = useMemo(() => {
        if (!summary) return null;
        return {
            level: getAttendancePerformanceLevel(summary.attendance_percentage),
            color: getAttendancePerformanceColor(summary.attendance_percentage),
            needsAttention: needsAttendanceAttention(summary.attendance_percentage),
        };
    }, [summary]);

    // Show late average
    const showLateAverage = useMemo(
        () => summary?.average_late_minutes && summary.average_late_minutes > 0,
        [summary?.average_late_minutes]
    );

    const totalDays = useMemo(() => summary?.total_days || 0, [summary]);
    const presentPercentage = useMemo(
        () => totalDays > 0 ? (summary?.present_days || 0) / totalDays * 100 : 0,
        [summary, totalDays]
    );

    const hasAttendanceData = useMemo(
        () => summary && summary.total_days > 0,
        [summary]
    );

    const handleExport = () => {
        if (!summary) return;

        // Create CSV content
        const csvContent = [
            ['Student Attendance Summary', '', ''],
            ['Student:', studentName, ''],
            ['Period:', 'All Time', ''],
            ['', '', ''],
            ['Metric', 'Count', 'Percentage'],
            ['Total Sessions', summary.total_days, '100%'],
            ['Present Days', summary.present_days, `${presentPercentage.toFixed(1)}%`],
            ['Absent Days', summary.absent_days, `${(summary.absent_days / totalDays * 100).toFixed(1)}%`],
            ['Late Arrivals', summary.late_days, `${(summary.late_days / totalDays * 100).toFixed(1)}%`],
            ['Excused Absences', summary.excused_days, `${(summary.excused_days / totalDays * 100).toFixed(1)}%`],
            ['', '', ''],
            ['Attendance Rate:', `${summary.attendance_percentage.toFixed(1)}%`, ''],
            ['Performance Level:', getAttendancePerformanceLevel(summary.attendance_percentage), ''],
            ['Generated:', new Date().toLocaleDateString(), ''],
        ].map(row => row.join(',')).join('\n');

        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-summary-${studentName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[95vh] flex flex-col p-0 gap-0">
                {/* Header Section */}
                <div className="p-2">
                    <DialogHeader className="text-left">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <GraduationCap className="h-5 w-5" />
                            Attendance Summary
                            <span className="text-muted-foreground font-normal">— {studentName}</span>
                        </DialogTitle>
                        <DialogDescription className="text-base mt-1 flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            {summary && hasAttendanceData ? (
                                <>
                                    {summary.present_days} of {summary.total_days} sessions •{' '}
                                    <PerformanceBadge percentage={summary.attendance_percentage} />
                                </>
                            ) : (
                                'No attendance data available'
                            )}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-hidden p-3">
                    <ScrollArea className="h-full pr-4">
                        {/* Loading State */}
                        {loading.summary && (
                            <div className="py-8">
                                <SummarySkeleton />
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading.summary && !hasAttendanceData && (
                            <div className="py-8">
                                <EmptyState />
                            </div>
                        )}

                        {/* Summary Table - Only show if there's data */}
                        {summary && hasAttendanceData && (
                            <div className="space-y-6">
                                {/* Performance Overview Card */}
                                <div className="rounded-lg border p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                        <h3 className="text-lg font-semibold">Performance Overview</h3>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
                                        <div className="lg:col-span-2 space-y-4">
                                            <div className="space-y-2">
                                                <div className="text-4xl font-bold text-primary">
                                                    {summary.attendance_percentage.toFixed(1)}%
                                                </div>
                                                <div className="text-lg text-muted-foreground">
                                                    {summary.present_days} of {summary.total_days} sessions
                                                </div>
                                            </div>
                                            <Progress
                                                value={summary.attendance_percentage}
                                                className="h-3"
                                            />
                                        </div>
                                        <PerformanceBadge percentage={summary.attendance_percentage} />
                                    </div>
                                </div>

                                {/* Statistics Table */}
                                <div className="rounded-lg border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="w-[200px] font-semibold">Metric</TableHead>
                                                <TableHead className="w-[180px] font-semibold text-center">Count</TableHead>
                                                <TableHead className="w-[180px] font-semibold text-center">Percentage</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-muted rounded-md p-2">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        Total Sessions
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-lg">
                                                    {summary.total_days}
                                                </TableCell>
                                                <TableCell className="text-center">—</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-md">
                                                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                        </div>
                                                        Present Days
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-lg text-green-600 dark:text-green-500">
                                                    {summary.present_days}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <AttendanceMetric
                                                        label="of total"
                                                        value={summary.present_days}
                                                        percentage={presentPercentage}
                                                        color="green"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-md">
                                                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                        </div>

                                                        Absent Days
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-lg text-red-600 dark:text-red-500">
                                                    {summary.absent_days}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <AttendanceMetric
                                                        label="of total"
                                                        value={summary.absent_days}
                                                        percentage={(summary.absent_days / totalDays * 100)}
                                                        color="red"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-md">
                                                            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                                        </div>
                                                        Late Arrivals
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-lg text-orange-600 dark:text-orange-500">
                                                    {summary.late_days}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <AttendanceMetric
                                                        label="of total"
                                                        value={summary.late_days}
                                                        percentage={(summary.late_days / totalDays * 100)}
                                                        color="orange"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                            {summary.excused_days > 0 && (
                                                <TableRow>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md">
                                                                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                            Excused Absences
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center font-mono text-lg text-blue-600 dark:text-blue-500">
                                                        {summary.excused_days}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <AttendanceMetric
                                                            label="of total"
                                                            value={summary.excused_days}
                                                            percentage={(summary.excused_days / totalDays * 100)}
                                                            color="blue"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Late Average Alert */}
                                {showLateAverage && (
                                    <Alert
                                        variant="warning"
                                        className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20"
                                    >
                                        <div className="flex-1">
                                            <AlertTitle className="text-orange-900 dark:text-orange-100 font-semibold">
                                                Average {summary.average_late_minutes} minutes late
                                            </AlertTitle>
                                            <AlertDescription className="text-sm text-orange-800/80 dark:text-orange-200/80">
                                                Across {summary.late_days} late arrivals
                                            </AlertDescription>
                                        </div>
                                    </Alert>
                                )}

                                {/* Attention Alert - Only show if percentage is meaningful */}
                                {performance?.needsAttention && summary.attendance_percentage > 0 && (
                                    <Alert
                                        variant="destructive"
                                        className="border-destructive/20 bg-destructive/5"
                                    >
                                        <AlertTitle className="text-destructive-foreground text-lg font-semibold">
                                            Attendance Below Target
                                        </AlertTitle>
                                        <AlertDescription className="mt-1 text-destructive-foreground/90">
                                            {summary.attendance_percentage < ATTENDANCE_THRESHOLDS.SATISFACTORY
                                                ? 'Significantly '
                                                : ''}below {ATTENDANCE_THRESHOLDS.SATISFACTORY}% target
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                {/* Footer Section */}
                <DialogFooter className="p-4 border-t">
                    <div className="flex justify-between items-center w-full">
                        <div className="text-sm text-muted-foreground">
                            {summary && hasAttendanceData ? (
                                `Updated ${new Date().toLocaleDateString()}`
                            ) : (
                                'No data to export'
                            )}
                        </div>
                        <Button
                            onClick={handleExport}
                            disabled={!hasAttendanceData}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}