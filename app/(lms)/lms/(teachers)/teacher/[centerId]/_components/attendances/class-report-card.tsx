/**
 * Class Attendance Report Component
 * 
 * Displays class-level attendance analytics
 * Shows aggregate statistics for the entire class
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Users,
    Calendar,
    TrendingUp,
    Award,
    BarChart3,
} from 'lucide-react';
import {
    getAttendancePerformanceLevel,
    getAttendancePerformanceColor,
} from '@/lib/branch-system/student-attendance';
import type { ClassAttendanceReport } from '@/lib/branch-system/types/student-attendance.types';

interface ClassReportCardProps {
    report: ClassAttendanceReport | null;
    isLoading: boolean;
    className?: string;
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
 * Mini stat component
 */
function MiniStat({
    icon: Icon,
    label,
    value,
    color = 'default',
}: {
    icon: any;
    label: string;
    value: string | number;
    color?: string;
}) {
    const colorClasses: Record<string, string> = {
        green: 'text-green-600 dark:text-green-400',
        blue: 'text-blue-600 dark:text-blue-400',
        orange: 'text-orange-600 dark:text-orange-400',
        default: 'text-muted-foreground',
    };

    return (
        <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
            <div>
                <p className="text-lg font-semibold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}

export function ClassReportCard({
    report,
    isLoading,
    className,
}: ClassReportCardProps) {
    const [showNoData, setShowNoData] = useState(false);

    useEffect(() => {
        // Wait 100ms before showing "no data" message
        if (!isLoading && (!report || report.average_attendance === null)) {
            const timer = setTimeout(() => {
                setShowNoData(true);
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setShowNoData(false);
        }
    }, [isLoading, report]);

    if (isLoading || (!showNoData && !report)) {
        return (
            <Card className={className}>
                <CardHeader>
                    <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <div className="grid grid-cols-3 gap-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (showNoData || !report || report.average_attendance === null) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Class Report
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                            No attendance data available
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const averageAttendance = report.average_attendance ?? 0;
    const performanceLevel = getAttendancePerformanceLevel(averageAttendance);

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Class Attendance Report
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Overall Performance */}
                <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <p className="text-2xl font-bold">
                                {averageAttendance.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Average Attendance
                            </p>
                        </div>
                        <Badge
                            variant={getPerformanceBadgeVariant(averageAttendance)}
                            className="text-sm"
                        >
                            {performanceLevel}
                        </Badge>
                    </div>
                    <Progress value={averageAttendance} className="h-2" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                    <MiniStat
                        icon={Calendar}
                        label="Sessions"
                        value={report.total_sessions ?? 0}
                    />
                    <MiniStat
                        icon={Users}
                        label="Records"
                        value={report.total_student_records ?? 0}
                    />
                    <MiniStat
                        icon={Award}
                        label="Perfect"
                        value={report.students_with_perfect_attendance ?? 0}
                    />
                </div>

                {/* Additional Info */}
                <div className="text-xs text-muted-foreground border-t pt-3">
                    <p>
                        {(report.students_with_perfect_attendance ?? 0) > 0 ? (
                            <>
                                🎉 {report.students_with_perfect_attendance} student
                                {report.students_with_perfect_attendance !== 1 ? 's have' : ' has'}{' '}
                                perfect attendance!
                            </>
                        ) : (
                            'No students with perfect attendance yet'
                        )}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}