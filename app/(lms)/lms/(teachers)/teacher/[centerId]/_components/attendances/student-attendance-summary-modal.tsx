/**
 * Student Attendance Summary Modal
 * 
 * Displays detailed attendance analytics for a student
 * Shows comprehensive stats with visual indicators
 */

'use client';

import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UserAvatar } from '@/components/avatar/user-avatar';
import {
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    TrendingUp,
    Award,
    AlertCircle,
} from 'lucide-react';
import {
    useFetchStudentSummary,
    useAttendanceSummary,
    useAttendanceLoading,
    getAttendancePerformanceLevel,
    getAttendancePerformanceColor,
    formatDuration,
} from '@/lib/branch-system/student-attendance';
import type { StudentAttendanceSummary } from '@/lib/branch-system/types/student-attendance.types';

interface StudentSummaryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    studentName: string;
    studentAvatar?: string | null;
    classId?: string;
}

/**
 * Get badge variant based on performance
 */
function getPerformanceBadgeVariant(percentage: number) {
    const color = getAttendancePerformanceColor(percentage);
    const variantMap: Record<string, any> = {
        green: 'success',
        blue: 'default',
        orange: 'warning',
        yellow: 'secondary',
        red: 'destructive',
    };
    return variantMap[color] || 'secondary';
}

/**
 * Stat card component
 */
function StatCard({
    icon: Icon,
    label,
    value,
    subtitle,
    color = 'default',
}: {
    icon: any;
    label: string;
    value: string | number;
    subtitle?: string;
    color?: string;
}) {
    const colorClasses: Record<string, string> = {
        green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        default: 'bg-muted text-muted-foreground',
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs text-muted-foreground truncate">{label}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

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
            fetchStudentSummary(studentId, classId, undefined, undefined, true); // Force refresh
        }
    }, [open, studentId, classId, currentStudentId, fetchStudentSummary]);

    // Clear current student when modal closes
    useEffect(() => {
        if (!open) {
            setCurrentStudentId(null);
        }
    }, [open]);

    const performanceLevel = summary
        ? getAttendancePerformanceLevel(summary.attendance_percentage)
        : 'N/A';
    const performanceColor = summary
        ? getAttendancePerformanceColor(summary.attendance_percentage)
        : 'default';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" key={studentId}>
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <UserAvatar
                            profile={{
                                id: studentId,
                                full_name: studentName,
                                avatar_url: studentAvatar,
                            }}
                            size="lg"
                            fallbackToInitials
                        />
                        <div>
                            <DialogTitle>{studentName}</DialogTitle>
                            <DialogDescription>Attendance Analytics</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
                    <div className="p-1">{loading.summary ? (
                        <div className="space-y-4 animate-pulse">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-24 bg-muted rounded-lg" />
                            ))}
                        </div>
                    ) : summary ? (
                        <div className="space-y-6">
                            {/* Overall Performance */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Award className="h-5 w-5" />
                                        Overall Performance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-3xl font-bold">
                                                {summary.attendance_percentage}%
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Attendance Rate
                                            </p>
                                        </div>
                                        <Badge
                                            variant={getPerformanceBadgeVariant(
                                                summary.attendance_percentage
                                            )}
                                            className="text-sm px-3 py-1"
                                        >
                                            {performanceLevel}
                                        </Badge>
                                    </div>
                                    <Progress
                                        value={summary.attendance_percentage}
                                        className="h-3"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {summary.present_days} present out of {summary.total_days}{' '}
                                        total days
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <StatCard
                                    icon={Calendar}
                                    label="Total Days"
                                    value={summary.total_days}
                                    color="default"
                                />
                                <StatCard
                                    icon={CheckCircle2}
                                    label="Present"
                                    value={summary.present_days}
                                    color="green"
                                />
                                <StatCard
                                    icon={XCircle}
                                    label="Absent"
                                    value={summary.absent_days}
                                    color="red"
                                />
                                <StatCard
                                    icon={Clock}
                                    label="Late"
                                    value={summary.late_days}
                                    color="orange"
                                />
                            </div>

                            {/* Additional Stats */}
                            <div className="grid grid-cols-1 gap-3">
                                <StatCard
                                    icon={FileText}
                                    label="Excused Absences"
                                    value={summary.excused_days}
                                    subtitle="With valid excuse"
                                    color="blue"
                                />
                                {summary.average_late_minutes > 0 && (
                                    <StatCard
                                        icon={Clock}
                                        label="Average Late Time"
                                        value={`${summary.average_late_minutes} min`}
                                        subtitle="When arriving late"
                                        color="orange"
                                    />
                                )}
                            </div>

                            {/* Performance Indicator */}
                            {summary.attendance_percentage < 75 && (
                                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10">
                                    <CardContent className="pt-4">
                                        <div className="flex gap-3">
                                            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-orange-900 dark:text-orange-300">
                                                    Attendance Below Target
                                                </p>
                                                <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                                                    This student's attendance is below 75%. Consider
                                                    reaching out to discuss any issues.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground">
                                No attendance data available for this student
                            </p>
                        </div>
                    )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
