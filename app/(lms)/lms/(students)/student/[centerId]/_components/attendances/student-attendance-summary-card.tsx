/**
 * Student Attendance Summary Card Component
 * 
 * Displays student's overall attendance statistics
 * Shows percentage, performance level, and key metrics
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
    TrendingUp,
    TrendingDown,
    Award,
    Calendar,
    Clock,
    AlertCircle,
} from 'lucide-react';
import {
    getAttendancePerformanceLevel,
    getAttendancePerformanceColor,
} from '@/lib/branch-system/student-attendance';
import type { StudentAttendanceSummary } from '@/lib/branch-system/types/student-attendance.types';
import { cn } from '@/lib/utils';

interface StudentAttendanceSummaryCardProps {
    summary: StudentAttendanceSummary | null;
    isLoading: boolean;
    className?: string;
}

/**
 * Get badge variant based on performance
 */
function getPerformanceBadgeVariant(percentage: number): 'success' | 'default' | 'warning' | 'secondary' | 'destructive' {
    const color = getAttendancePerformanceColor(percentage);
    const variantMap: Record<string, 'success' | 'default' | 'warning' | 'secondary' | 'destructive'> = {
        green: 'success',
        blue: 'default',
        orange: 'warning',
        yellow: 'secondary',
        red: 'destructive',
    };
    return variantMap[color] || 'secondary';
}

/**
 * Get trend indicator
 */
function getTrendIndicator(percentage: number) {
    if (percentage >= 90) {
        return { icon: TrendingUp, text: 'Excellent', color: 'text-green-600' };
    } else if (percentage >= 75) {
        return { icon: TrendingUp, text: 'Good', color: 'text-blue-600' };
    } else if (percentage >= 60) {
        return { icon: AlertCircle, text: 'Needs Improvement', color: 'text-orange-600' };
    } else {
        return { icon: TrendingDown, text: 'Critical', color: 'text-red-600' };
    }
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
    icon: React.ElementType;
    label: string;
    value: string | number;
    color?: string;
}) {
    const colorClasses: Record<string, string> = {
        green: 'text-green-600 dark:text-green-400',
        blue: 'text-blue-600 dark:text-blue-400',
        orange: 'text-orange-600 dark:text-orange-400',
        red: 'text-red-600 dark:text-red-400',
        default: 'text-muted-foreground',
    };

    return (
        <div className="flex items-center gap-2">
            <Icon className={cn('h-4 w-4', colorClasses[color])} />
            <div>
                <p className="text-lg font-semibold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}

export function StudentAttendanceSummaryCard({
    summary,
    isLoading,
    className,
}: StudentAttendanceSummaryCardProps) {
    const [showNoData, setShowNoData] = useState(false);

    useEffect(() => {
        // Wait 100ms before showing "no data" message
        if (!isLoading && !summary) {
            const timer = setTimeout(() => {
                setShowNoData(true);
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setShowNoData(false);
        }
    }, [isLoading, summary]);

    if (isLoading || (!showNoData && !summary)) {
        return (
            <Card className={className}>
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-6 w-16" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (showNoData || !summary) {
        return (
            <Card className={cn('border-dashed', className)}>
                <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center text-muted-foreground">
                        <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No attendance data available</p>
                        <p className="text-xs mt-1">Records will appear once attendance is marked</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const percentage = summary.attendance_percentage;
    const performanceLevel = getAttendancePerformanceLevel(percentage);
    const performanceBadge = getPerformanceBadgeVariant(percentage);
    const trend = getTrendIndicator(percentage);
    const TrendIcon = trend.icon;

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                        Attendance Overview
                    </CardTitle>
                    <Badge variant={performanceBadge} className="gap-1">
                        <Award className="h-3.5 w-3.5" />
                        {performanceLevel}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Main Progress */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Overall Attendance</span>
                        <div className="flex items-center gap-1.5">
                            <TrendIcon className={cn('h-4 w-4', trend.color)} />
                            <span className="font-semibold">{percentage.toFixed(1)}%</span>
                        </div>
                    </div>
                    <Progress
                        value={percentage}
                        className="h-2"
                    />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t">
                    <MiniStat
                        icon={Calendar}
                        label="Total Days"
                        value={summary.total_days}
                        color="default"
                    />
                    <MiniStat
                        icon={TrendingUp}
                        label="Present"
                        value={summary.present_days}
                        color="green"
                    />
                    <MiniStat
                        icon={TrendingDown}
                        label="Absent"
                        value={summary.absent_days}
                        color="red"
                    />
                    <MiniStat
                        icon={Clock}
                        label="Late Days"
                        value={summary.late_days}
                        color="orange"
                    />
                </div>

                {/* Average Late Time */}
                {summary.average_late_minutes > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                        <Clock className="h-4 w-4" />
                        <span>Average late by: {Math.round(summary.average_late_minutes)} minutes</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
