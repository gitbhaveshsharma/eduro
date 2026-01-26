/**
 * Student Attendance Summary Card Component
 * 
 * Displays student's overall attendance statistics
 * Shows percentage, performance level, and key metrics
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
    Calendar,
    Clock,
    TrendingUp,
    TrendingDown,
    Award,
    AlertCircle,
    CheckCircle2,
    XCircle,
    AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    getAttendancePerformanceLevel,
    getAttendancePerformanceColor,
} from '@/lib/branch-system/student-attendance';
import type { StudentAttendanceSummary } from '@/lib/branch-system/types/student-attendance.types';

interface StudentAttendanceSummaryCardProps {
    summary: StudentAttendanceSummary | null;
    isLoading?: boolean;
    className?: string;
}

/**
 * Stat item component
 */
interface StatItemProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subValue?: string;
    colorClass?: string;
    isHighlighted?: boolean;
}

function StatItem({
    icon,
    label,
    value,
    subValue,
    colorClass = 'text-muted-foreground',
    isHighlighted = false,
}: StatItemProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-3 p-3 rounded-xl transition-colors',
                isHighlighted && 'bg-primary/5'
            )}
        >
            <div
                className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-xl',
                    colorClass.includes('green') && 'bg-green-100 dark:bg-green-900/30',
                    colorClass.includes('yellow') && 'bg-yellow-100 dark:bg-yellow-900/30',
                    colorClass.includes('orange') && 'bg-orange-100 dark:bg-orange-900/30',
                    colorClass.includes('red') && 'bg-red-100 dark:bg-red-900/30',
                    colorClass.includes('blue') && 'bg-blue-100 dark:bg-blue-900/30',
                    !colorClass.includes('green') &&
                    !colorClass.includes('yellow') &&
                    !colorClass.includes('orange') &&
                    !colorClass.includes('red') &&
                    !colorClass.includes('blue') &&
                    'bg-muted'
                )}
            >
                <span className={cn('text-sm', colorClass)}>{icon}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
                <span className="text-lg font-semibold text-foreground">{value}</span>
                {subValue && (
                    <span className="text-xs text-muted-foreground">{subValue}</span>
                )}
            </div>
        </div>
    );
}

/**
 * Get icon and color based on performance
 */
function getPerformanceConfig(percentage: number): { icon: React.ElementType; colorClass: string } {
    if (percentage >= 90) {
        return { icon: Award, colorClass: 'text-green-600' };
    } else if (percentage >= 75) {
        return { icon: TrendingUp, colorClass: 'text-blue-600' };
    } else if (percentage >= 60) {
        return { icon: AlertTriangle, colorClass: 'text-orange-600' };
    } else {
        return { icon: TrendingDown, colorClass: 'text-red-600' };
    }
}

/**
 * Get color class for attendance status
 */
function getAttendanceStatusColor(status: 'present' | 'absent' | 'late'): string {
    switch (status) {
        case 'present': return 'text-green-600';
        case 'absent': return 'text-red-600';
        case 'late': return 'text-orange-600';
        default: return 'text-muted-foreground';
    }
}

export function StudentAttendanceSummaryCard({
    summary,
    isLoading = false,
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

    if (isLoading) {
        return (
            <Card className={cn('overflow-hidden', className)}>
                <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3">
                                <Skeleton className="w-10 h-10 rounded-xl" />
                                <div className="flex flex-col gap-1.5">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-5 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 px-3">
                        <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (showNoData || !summary) {
        return (
            <Card className={cn('overflow-hidden', className)}>
                <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No attendance data available</p>
                </CardContent>
            </Card>
        );
    }

    const percentage = summary.attendance_percentage;
    const performanceLevel = getAttendancePerformanceLevel(percentage);
    const performanceConfig = getPerformanceConfig(percentage);
    const PerformanceIcon = performanceConfig.icon;

    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardContent className="p-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                    <StatItem
                        icon={<Calendar className="h-4 w-4" />}
                        label="Total Days"
                        value={summary.total_days}
                        subValue="Days tracked"
                        colorClass="text-blue-600"
                    />
                    <StatItem
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        label="Present"
                        value={summary.present_days}
                        subValue={`${((summary.present_days / summary.total_days) * 100).toFixed(0)}% of total`}
                        colorClass="text-green-600"
                    />
                    <StatItem
                        icon={<XCircle className="h-4 w-4" />}
                        label="Absent"
                        value={summary.absent_days}
                        subValue={`${((summary.absent_days / summary.total_days) * 100).toFixed(0)}% of total`}
                        colorClass="text-red-600"
                        isHighlighted={summary.absent_days > 0}
                    />
                    <StatItem
                        icon={<Clock className="h-4 w-4" />}
                        label="Late Arrivals"
                        value={summary.late_days}
                        subValue={
                            summary.average_late_minutes > 0
                                ? `Avg: ${Math.round(summary.average_late_minutes)} min`
                                : 'No late arrivals'
                        }
                        colorClass="text-orange-600"
                        isHighlighted={summary.late_days > 0}
                    />
                </div>

                {/* Attendance Progress */}
                <div className="mt-4 px-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <PerformanceIcon className="h-3 w-3" />
                            Attendance Rate • {performanceLevel}
                        </span>
                        <span className="text-xs font-medium text-foreground">
                            {percentage.toFixed(1)}%
                        </span>
                    </div>
                    <Progress
                        value={percentage}
                        className="h-2"
                    />
                </div>
            </CardContent>
        </Card>
    );
}